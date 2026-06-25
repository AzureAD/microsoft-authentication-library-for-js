/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    AuthError,
    Authority,
    ClientAuthErrorCodes,
    INetworkModule,
    Logger,
    NetworkRequestOptions,
    NetworkResponse,
    ResponseHandler,
    ServerAuthorizationTokenResponse,
    TimeUtils,
    createClientAuthError,
    AuthenticationResult,
    UrlString,
    Constants,
    StubPerformanceClient,
} from "@azure/msal-common/node";
import { ManagedIdentityId } from "../../config/ManagedIdentityId.js";
import { ManagedIdentityRequestParameters } from "../../config/ManagedIdentityRequestParameters.js";
import { CryptoProvider } from "../../crypto/CryptoProvider.js";
import { ManagedIdentityRequest } from "../../request/ManagedIdentityRequest.js";
import {
    ApiId,
    HttpMethod,
    ManagedIdentityIdType,
    ManagedIdentityQueryParameters,
} from "../../utils/Constants.js";
import { ManagedIdentityTokenResponse } from "../../response/ManagedIdentityTokenResponse.js";
import { NodeStorage } from "../../cache/NodeStorage.js";
import {
    ManagedIdentityErrorCodes,
    createManagedIdentityError,
} from "../../error/ManagedIdentityError.js";
import { isIso8601 } from "../../utils/TimeUtils.js";
import { HttpClientWithRetries } from "../../network/HttpClientWithRetries.js";

/**
 * Managed Identity User Assigned Id Query Parameter Names
 */
export const ManagedIdentityUserAssignedIdQueryParameterNames = {
    MANAGED_IDENTITY_CLIENT_ID_2017: "clientid", // 2017-09-01 API version
    MANAGED_IDENTITY_CLIENT_ID: "client_id", // 2019+ API versions
    MANAGED_IDENTITY_OBJECT_ID: "object_id",
    MANAGED_IDENTITY_RESOURCE_ID_IMDS: "msi_res_id",
    MANAGED_IDENTITY_RESOURCE_ID_NON_IMDS: "mi_res_id",
} as const;
export type ManagedIdentityUserAssignedIdQueryParameterNames =
    (typeof ManagedIdentityUserAssignedIdQueryParameterNames)[keyof typeof ManagedIdentityUserAssignedIdQueryParameterNames];

/**
 * Base class for all Managed Identity sources. Provides common functionality for
 * authenticating with Azure Managed Identity endpoints across different Azure services
 * including IMDS, App Service, Azure Arc, Service Fabric, Cloud Shell, and Machine Learning.
 *
 * This abstract class handles token acquisition, response processing, and network communication
 * while allowing concrete implementations to define source-specific request creation logic.
 */
export abstract class BaseManagedIdentitySource {
    protected logger: Logger;
    private nodeStorage: NodeStorage;
    private networkClient: INetworkModule;
    private cryptoProvider: CryptoProvider;
    private disableInternalRetries: boolean;

    /**
     * Creates an instance of BaseManagedIdentitySource.
     *
     * @param logger - Logger instance for diagnostic information
     * @param nodeStorage - Storage interface for caching tokens
     * @param networkClient - Network client for making HTTP requests
     * @param cryptoProvider - Cryptographic provider for token operations
     * @param disableInternalRetries - Whether to disable automatic retry logic
     */
    constructor(
        logger: Logger,
        nodeStorage: NodeStorage,
        networkClient: INetworkModule,
        cryptoProvider: CryptoProvider,
        disableInternalRetries: boolean
    ) {
        this.logger = logger;
        this.nodeStorage = nodeStorage;
        this.networkClient = networkClient;
        this.cryptoProvider = cryptoProvider;
        this.disableInternalRetries = disableInternalRetries;
    }

    /**
     * Generates a new correlation ID for request tracing.
     *
     * @returns A new GUID string for use as a correlation or request ID
     */
    protected createCorrelationId(): string {
        return this.cryptoProvider.createNewGuid();
    }

    /**
     * Creates a managed identity request with source-specific parameters.
     * This method must be implemented by concrete managed identity sources to define
     * how requests are constructed for their specific endpoint requirements.
     *
     * @param resource - The Azure resource URI for which the access token is requested (e.g., "https://vault.azure.net/")
     * @param managedIdentityId - The managed identity configuration specifying system-assigned or user-assigned identity details
     *
     * @returns Request parameters configured for the specific managed identity source
     */
    abstract createRequest(
        resource: string,
        managedIdentityId: ManagedIdentityId
    ): ManagedIdentityRequestParameters;

    /**
     * Processes the network response and converts it to a standardized server token response.
     * This async version allows for source-specific response processing logic while maintaining
     * backward compatibility with the synchronous version.
     *
     * @param response - The network response containing the managed identity token
     * @param _networkClient - Network client used for the request (unused in base implementation)
     * @param _networkRequest - The original network request parameters (unused in base implementation)
     * @param _networkRequestOptions - The network request options (unused in base implementation)
     *
     * @returns Promise resolving to a standardized server authorization token response
     */
    public async getServerTokenResponseAsync(
        response: NetworkResponse<ManagedIdentityTokenResponse>,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _networkClient: INetworkModule,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _networkRequest: ManagedIdentityRequestParameters,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _networkRequestOptions: NetworkRequestOptions
    ): Promise<ServerAuthorizationTokenResponse> {
        return this.getServerTokenResponse(response);
    }

    /**
     * Converts a managed identity token response to a standardized server authorization token response.
     * Handles time format conversion, expiration calculation, and error mapping to ensure
     * compatibility with the MSAL response handling pipeline.
     *
     * @param response - The network response containing the managed identity token
     *
     * @returns Standardized server authorization token response with normalized fields
     */
    public getServerTokenResponse(
        response: NetworkResponse<ManagedIdentityTokenResponse>
    ): ServerAuthorizationTokenResponse {
        let refreshIn, expiresIn: number | undefined;
        if (response.body.expires_on) {
            // if the expires_on field in the response body is a string and in ISO 8601 format, convert it to a Unix timestamp (seconds since epoch)
            if (isIso8601(response.body.expires_on)) {
                response.body.expires_on =
                    new Date(response.body.expires_on).getTime() / 1000;
            }

            expiresIn = response.body.expires_on - TimeUtils.nowSeconds();

            // compute refresh_in as 1/2 of expires_in, but only if expires_in > 2h
            if (expiresIn > 2 * 3600) {
                refreshIn = expiresIn / 2;
            }
        }

        const serverTokenResponse: ServerAuthorizationTokenResponse = {
            status: response.status,

            // success
            access_token: response.body.access_token,
            expires_in: expiresIn,
            scope: response.body.resource,
            token_type: response.body.token_type,
            refresh_in: refreshIn,

            // error
            correlation_id:
                response.body.correlation_id || response.body.correlationId,
            error:
                typeof response.body.error === "string"
                    ? response.body.error
                    : response.body.error?.code,
            error_description:
                response.body.message ||
                (typeof response.body.error === "string"
                    ? response.body.error_description
                    : response.body.error?.message),
            error_codes: response.body.error_codes,
            timestamp: response.body.timestamp,
            trace_id: response.body.trace_id,
        };

        return serverTokenResponse;
    }

    /**
     * Acquires an access token using the managed identity endpoint for the specified resource.
     * This is the primary method for token acquisition, handling the complete flow from
     * request creation through response processing and token caching.
     *
     * @param managedIdentityRequest - The managed identity request containing resource and optional parameters
     * @param managedIdentityId - The managed identity configuration (system or user-assigned)
     * @param fakeAuthority - Authority instance used for token caching (managed identity uses a placeholder authority)
     * @param refreshAccessToken - Whether this is a token refresh operation
     *
     * @returns Promise resolving to an authentication result containing the access token and metadata
     *
     * @throws {AuthError} When network requests fail or token validation fails
     * @throws {ClientAuthError} When network errors occur during the request
     */
    public async acquireTokenWithManagedIdentity(
        managedIdentityRequest: ManagedIdentityRequest,
        managedIdentityId: ManagedIdentityId,
        fakeAuthority: Authority,
        refreshAccessToken?: boolean
    ): Promise<AuthenticationResult> {
        const networkRequest: ManagedIdentityRequestParameters =
            this.createRequest(
                managedIdentityRequest.resource,
                managedIdentityId
            );

        if (managedIdentityRequest.revokedTokenSha256Hash) {
            this.logger.info(
                `[Managed Identity] The following claims are present in the request: ${managedIdentityRequest.claims}`,
                ""
            );

            networkRequest.queryParameters[
                ManagedIdentityQueryParameters.SHA256_TOKEN_TO_REFRESH
            ] = managedIdentityRequest.revokedTokenSha256Hash;
        }

        if (managedIdentityRequest.clientCapabilities?.length) {
            const clientCapabilities: string =
                managedIdentityRequest.clientCapabilities.toString();

            this.logger.info(
                `[Managed Identity] The following client capabilities are present in the request: ${clientCapabilities}`,
                ""
            );

            networkRequest.queryParameters[
                ManagedIdentityQueryParameters.XMS_CC
            ] = clientCapabilities;
        }

        const headers: Record<string, string> = networkRequest.headers;
        headers[Constants.HeaderNames.CONTENT_TYPE] =
            Constants.URL_FORM_CONTENT_TYPE;

        const networkRequestOptions: NetworkRequestOptions = { headers };

        if (Object.keys(networkRequest.bodyParameters).length) {
            networkRequestOptions.body =
                networkRequest.computeParametersBodyString();
        }

        /**
         * Initializes the network client helper based on the retry policy configuration.
         * If internal retries are disabled, it uses the provided network client directly.
         * Otherwise, it wraps the network client with an HTTP client that supports retries.
         */
        const networkClientHelper: INetworkModule = this.disableInternalRetries
            ? this.networkClient
            : new HttpClientWithRetries(
                  this.networkClient,
                  networkRequest.retryPolicy,
                  this.logger
              );

        const reqTimestamp = TimeUtils.nowSeconds();
        let response: NetworkResponse<ManagedIdentityTokenResponse>;
        try {
            // Sources that send POST requests: Cloud Shell
            if (networkRequest.httpMethod === HttpMethod.POST) {
                response =
                    await networkClientHelper.sendPostRequestAsync<ManagedIdentityTokenResponse>(
                        networkRequest.computeUri(),
                        networkRequestOptions
                    );
                // Sources that send GET requests: App Service, Azure Arc, IMDS, Service Fabric
            } else {
                response =
                    await networkClientHelper.sendGetRequestAsync<ManagedIdentityTokenResponse>(
                        networkRequest.computeUri(),
                        networkRequestOptions
                    );
            }
        } catch (error) {
            if (error instanceof AuthError) {
                throw error;
            } else {
                throw createClientAuthError(
                    ClientAuthErrorCodes.networkError,
                    managedIdentityRequest.correlationId
                );
            }
        }

        const responseHandler = new ResponseHandler(
            managedIdentityId.id,
            this.nodeStorage,
            this.cryptoProvider,
            this.logger,
            new StubPerformanceClient(),
            null,
            null
        );

        const serverTokenResponse: ServerAuthorizationTokenResponse =
            await this.getServerTokenResponseAsync(
                response,
                networkClientHelper,
                networkRequest,
                networkRequestOptions
            );

        responseHandler.validateTokenResponse(
            serverTokenResponse,
            serverTokenResponse.correlation_id || "",
            refreshAccessToken
        );

        // caches the token
        return responseHandler.handleServerTokenResponse(
            serverTokenResponse,
            fakeAuthority,
            reqTimestamp,
            managedIdentityRequest,
            ApiId.acquireTokenWithManagedIdentity
        );
    }

    /**
     * Determines the appropriate query parameter name for user-assigned managed identity
     * based on the identity type, API version, and endpoint characteristics.
     * Different Azure services and API versions use different parameter names for the same identity types.
     *
     * @param managedIdentityIdType - The type of user-assigned managed identity (client ID, object ID, or resource ID)
     * @param isImds - Whether the request is being made to the IMDS (Instance Metadata Service) endpoint
     * @param usesApi2017 - Whether the endpoint uses the 2017-09-01 API version (affects client ID parameter name)
     *
     * @returns The correct query parameter name for the specified identity type and endpoint
     *
     * @throws {ManagedIdentityError} When an invalid managed identity ID type is provided
     */
    public getManagedIdentityUserAssignedIdQueryParameterKey(
        managedIdentityIdType: ManagedIdentityIdType,
        isImds?: boolean,
        usesApi2017?: boolean
    ): string {
        switch (managedIdentityIdType) {
            case ManagedIdentityIdType.USER_ASSIGNED_CLIENT_ID:
                this.logger.info(
                    `[Managed Identity] [API version ${
                        usesApi2017 ? "2017+" : "2019+"
                    }] Adding user assigned client id to the request.`,
                    ""
                );
                // The Machine Learning source uses the 2017-09-01 API version, which uses "clientid" instead of "client_id"
                return usesApi2017
                    ? ManagedIdentityUserAssignedIdQueryParameterNames.MANAGED_IDENTITY_CLIENT_ID_2017
                    : ManagedIdentityUserAssignedIdQueryParameterNames.MANAGED_IDENTITY_CLIENT_ID;

            case ManagedIdentityIdType.USER_ASSIGNED_RESOURCE_ID:
                this.logger.info(
                    "[Managed Identity] Adding user assigned resource id to the request.",
                    ""
                );
                return isImds
                    ? ManagedIdentityUserAssignedIdQueryParameterNames.MANAGED_IDENTITY_RESOURCE_ID_IMDS
                    : ManagedIdentityUserAssignedIdQueryParameterNames.MANAGED_IDENTITY_RESOURCE_ID_NON_IMDS;

            case ManagedIdentityIdType.USER_ASSIGNED_OBJECT_ID:
                this.logger.info(
                    "[Managed Identity] Adding user assigned object id to the request.",
                    ""
                );
                return ManagedIdentityUserAssignedIdQueryParameterNames.MANAGED_IDENTITY_OBJECT_ID;
            default:
                throw createManagedIdentityError(
                    ManagedIdentityErrorCodes.invalidManagedIdentityIdType,
                    ""
                );
        }
    }

    /**
     * Returns true only if the given URL host (as produced by the WHATWG URL parser)
     * is a loopback or link-local address.
     *
     * Managed Identity credential endpoints are always served by a node-local agent
     * (IMDS on link-local 169.254.169.254; Azure Arc, App Service, Cloud Shell, Machine
     * Learning and Service Fabric on loopback). Any other host indicates the endpoint
     * environment variable has been tampered with to redirect the credential request -
     * and the secret it carries - to an attacker-controlled server.
     *
     * The host must come from URL.hostname (not UrlString's regex) so that userinfo such
     * as "http://127.0.0.1@evil.com" correctly resolves to host "evil.com" and is
     * rejected. The WHATWG parser also normalizes alternate IPv4 encodings (decimal,
     * hexadecimal, short form) to dotted-decimal, so the octet checks below can assume
     * base-10 notation.
     *
     * @param hostname - The host component of the endpoint URL (URL.hostname)
     * @returns true if the host is loopback or link-local, false otherwise
     */
    private static isAllowedManagedIdentityHost(hostname: string): boolean {
        const host: string = hostname.toLowerCase();

        /*
         * localhost and the bracketed IPv6 loopback that URL.hostname returns
         * (e.g. "[::1]") are always node-local. Allowing localhost by name is
         * intentional: the threat mitigated here is redirection to an off-box
         * attacker server. A co-located process that can both bind localhost and
         * set these environment variables already has local code execution, which
         * is outside the scope of this control.
         */
        if (host === "localhost" || host === "[::1]") {
            return true;
        }

        const octets: number[] | null =
            BaseManagedIdentitySource.parseIPv4Octets(host);
        if (octets) {
            /*
             * IPv4 loopback (127.0.0.0/8) and link-local (169.254.0.0/16). The
             * latter includes the well-known IMDS endpoint 169.254.169.254.
             */
            if (octets[0] === 127) {
                return true;
            }
            if (octets[0] === 169 && octets[1] === 254) {
                return true;
            }
        }

        /*
         * Everything else is rejected, including IPv6 link-local (fe80::/10) and
         * IPv4-mapped IPv6 such as "[::ffff:127.0.0.1]". Real Managed Identity
         * endpoints never use those forms, so failing closed is the safe choice.
         */
        return false;
    }

    /**
     * Parses a host string as a dotted-decimal IPv4 address (e.g. "127.0.0.1").
     *
     * URL.hostname has already normalized alternate IPv4 encodings (decimal,
     * hexadecimal, short form) to dotted-decimal, so a node-local literal always
     * reaches this method as four base-10 octets. Anything that is not exactly four
     * numeric octets in the 0-255 range (including real domain names such as
     * "127.0.0.1.evil.com") returns null and is therefore treated as disallowed.
     *
     * @param host - The lower-cased host component to parse
     * @returns The four octets as numbers, or null if host is not a dotted-decimal IPv4 address
     */
    private static parseIPv4Octets(host: string): number[] | null {
        const parts: string[] = host.split(".");
        if (parts.length !== 4) {
            return null;
        }

        const octets: number[] = [];
        for (const part of parts) {
            if (part.length < 1 || part.length > 3) {
                return null;
            }

            for (let i: number = 0; i < part.length; i++) {
                const charCode: number = part.charCodeAt(i);
                if (charCode < 0x30 || charCode > 0x39) {
                    return null;
                }
            }

            const octet: number = Number(part);
            if (octet > 255) {
                return null;
            }
            octets.push(octet);
        }

        return octets;
    }

    /**
     * Validates and normalizes an environment variable containing a Managed Identity
     * endpoint URL.
     *
     * Beyond ensuring the value is a parseable URL, this pins the endpoint host to a
     * node-local (loopback or link-local) address. Managed Identity endpoint URLs are
     * read from environment variables and are used together with credential material, so
     * host pinning prevents an in-process attacker from redirecting the credential
     * request to an arbitrary server.
     *
     * @param envVariableStringName - The name of the environment variable being validated (for error reporting)
     * @param envVariable - The environment variable value containing the URL string
     * @param sourceName - The name of the managed identity source (for error reporting)
     * @param logger - Logger instance for diagnostic information
     *
     * @returns The validated and normalized URL string
     *
     * @throws {ManagedIdentityError} When the value is not a parseable URL, or when its
     *         host is not a loopback / link-local address
     */
    public static getValidatedEnvVariableUrlString = (
        envVariableStringName: keyof typeof ManagedIdentityErrorCodes.MsiEnvironmentVariableUrlMalformedErrorCodes,
        envVariable: string,
        sourceName: string,
        logger: Logger
    ): string => {
        let endpointHost: string;
        try {
            /*
             * Parse with the WHATWG URL parser so the host is cleanly separated
             * from any userinfo (e.g. "http://127.0.0.1@evil.com" resolves to
             * host "evil.com"). This helper runs from each MI source's
             * tryCreate() before any request object exists.
             */
            endpointHost = new URL(envVariable).hostname;
        } catch (error) {
            logger.info(
                `[Managed Identity] ${sourceName} managed identity is unavailable because the '${envVariableStringName}' environment variable is malformed.`,
                ""
            );

            throw createManagedIdentityError(
                ManagedIdentityErrorCodes
                    .MsiEnvironmentVariableUrlMalformedErrorCodes[
                    envVariableStringName
                ],
                ""
            );
        }

        /*
         * Managed Identity endpoints are always node-local. Reject any other
         * host so a co-located attacker cannot redirect the credential request
         * (and its secret) to an arbitrary server via this environment variable.
         */
        if (
            !BaseManagedIdentitySource.isAllowedManagedIdentityHost(
                endpointHost
            )
        ) {
            logger.error(
                `[Managed Identity] ${sourceName} managed identity is unavailable because the '${envVariableStringName}' environment variable points to a disallowed host '${endpointHost}'. Managed Identity endpoints must use a loopback or link-local address.`,
                ""
            );

            throw createManagedIdentityError(
                ManagedIdentityErrorCodes.invalidManagedIdentityEndpoint,
                ""
            );
        }

        /*
         * Re-parse with UrlString for canonicalization parity with the rest of
         * msal. This intentionally sits outside the try/catch above: UrlString's
         * constructor only throws on an empty value, which the new URL() parse has
         * already rejected, so any value reaching here is non-empty and safe.
         */
        return new UrlString(envVariable, "").urlString;
    };
}
