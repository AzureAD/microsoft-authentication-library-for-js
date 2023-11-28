/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    AuthError,
    ClientAuthErrorCodes,
    createClientAuthError,
    HttpStatus,
    INetworkModule,
    NetworkResponse,
    NetworkRequestOptions,
    Logger,
    UrlString,
    ResponseHandler,
    ServerAuthorizationTokenResponse,
} from "@azure/msal-common";
import { ManagedIdentityId } from "../../config/ManagedIdentityId";
import { ManagedIdentityRequestParameters } from "../../config/ManagedIdentityRequestParameters";
import { BaseManagedIdentitySource } from "./BaseManagedIdentitySource";
import { CryptoProvider } from "../../crypto/CryptoProvider";
import {
    ManagedIdentityErrorCodes,
    createManagedIdentityError,
} from "../../error/ManagedIdentityError";
import {
    AUTHORIZATION_HEADER_NAME,
    HttpMethod,
    METADATA_HEADER_NAME,
    ManagedIdentityIdType,
} from "../../utils/Constants";
import { NodeStorage } from "../../cache/NodeStorage";
import * as fs from "fs";
import { ManagedIdentityTokenResponse } from "../../response/ManagedIdentityTokenResponse";

const ARC_API_VERSION: string = "2019-11-01";

/**
 * Original source of code: https://github.com/Azure/azure-sdk-for-net/blob/main/sdk/identity/Azure.Identity/src/AzureArcManagedIdentitySource.cs
 */
export class AzureArc extends BaseManagedIdentitySource {
    private endpoint: string;

    constructor(
        logger: Logger,
        nodeStorage: NodeStorage,
        networkClient: INetworkModule,
        cryptoProvider: CryptoProvider,
        endpoint: string
    ) {
        super(logger, nodeStorage, networkClient, cryptoProvider);

        this.endpoint = endpoint;
    }

    public static tryCreate(
        logger: Logger,
        nodeStorage: NodeStorage,
        networkClient: INetworkModule,
        cryptoProvider: CryptoProvider
    ): AzureArc | null {
        const imdsEndpoint: string | undefined = process.env["IMDS_ENDPOINT"];

        const [areEnvironmentVariablesValidated, endpoint]: [
            boolean,
            string | undefined
        ] = validateEnvironmentVariables(
            process.env["IDENTITY_ENDPOINT"] || undefined,
            imdsEndpoint,
            logger
        );

        return areEnvironmentVariablesValidated
            ? new AzureArc(
                  logger,
                  nodeStorage,
                  networkClient,
                  cryptoProvider,
                  endpoint as string
              )
            : null;
    }

    public createRequest(
        resource: string,
        managedIdentityId: ManagedIdentityId
    ): ManagedIdentityRequestParameters {
        if (
            managedIdentityId.idType !== ManagedIdentityIdType.SYSTEM_ASSIGNED
        ) {
            throw createManagedIdentityError(
                ManagedIdentityErrorCodes.unableToCreateAzureArc
            );
        }

        const request: ManagedIdentityRequestParameters =
            new ManagedIdentityRequestParameters(HttpMethod.GET, this.endpoint);

        request.headers[METADATA_HEADER_NAME] = "true";
        request.queryParameters["api-version"] = ARC_API_VERSION;
        request.queryParameters["resource"] = resource;
        // bodyParameters calculated in BaseManagedIdentity.acquireTokenWithManagedIdentity

        return request;
    }

    public async validateResponseAsync(
        networkClient: INetworkModule,
        originalResponse: NetworkResponse<ManagedIdentityTokenResponse>,
        networkRequest: ManagedIdentityRequestParameters,
        networkRequestOptions: NetworkRequestOptions,
        responseHandler: ResponseHandler,
        refreshAccessToken: boolean | undefined
    ): Promise<ServerAuthorizationTokenResponse> {
        let retryResponse:
            | NetworkResponse<ManagedIdentityTokenResponse>
            | undefined;

        if (originalResponse.status === HttpStatus.UNAUTHORIZED) {
            const wwwAuthHeader: string =
                originalResponse.headers["WWW-Authenticate"];
            if (!wwwAuthHeader) {
                throw createManagedIdentityError(
                    ManagedIdentityErrorCodes.wwwAuthenticateHeaderMissing
                );
            }
            if (!wwwAuthHeader.includes("Basic realm=")) {
                throw createManagedIdentityError(
                    ManagedIdentityErrorCodes.wwwAuthenticateHeaderUnsupportedFormat
                );
            }

            const secretFile = wwwAuthHeader.split("Basic realm=")[1];
            let secret;
            try {
                secret = fs.readFileSync(secretFile, "utf-8");
            } catch (e) {
                throw createManagedIdentityError(
                    ManagedIdentityErrorCodes.unableToReadSecretFile
                );
            }
            const authHeaderValue = `Basic ${secret}`;

            this.logger.info(
                `[Managed Identity] Adding authorization header to the request.`
            );
            networkRequest.headers[AUTHORIZATION_HEADER_NAME] = authHeaderValue;

            try {
                retryResponse =
                    await networkClient.sendGetRequestAsync<ManagedIdentityTokenResponse>(
                        networkRequest.computeUri(),
                        networkRequestOptions
                    );
            } catch (error) {
                if (error instanceof AuthError) {
                    throw error;
                } else {
                    throw createClientAuthError(
                        ClientAuthErrorCodes.networkError
                    );
                }
            }
        }

        return this.validateResponse(
            retryResponse || originalResponse,
            responseHandler,
            refreshAccessToken
        );
    }
}

const validateEnvironmentVariables = (
    identityEndpoint: string | undefined,
    imdsEndpoint: string | undefined,
    logger: Logger
): [boolean, string | undefined] => {
    let endpointUrlString: string | undefined;

    // if either of the identity or imds endpoints are undefined, this MSI provider is unavailable.
    if (!identityEndpoint || !imdsEndpoint) {
        logger.info(
            "[Managed Identity] Azure Arc managed identity is unavailable because one or both of the 'IDENTITY_ENDPOINT' and 'IMDS_ENDPOINT' environment variables are missing."
        );
        return [false, endpointUrlString];
    }

    try {
        endpointUrlString = new UrlString(identityEndpoint).urlString;
    } catch (error) {
        logger.info(
            "[Managed Identity] App service managed identity is unavailable because the 'IDENTITY_ENDPOINT' environment variable is malformed."
        );

        throw createManagedIdentityError(
            ManagedIdentityErrorCodes.urlParseError
        );
    }

    logger.info(
        `[Managed Identity] Environment variables validation passed for Azure Arc managed identity. Endpoint URI: ${endpointUrlString}. Creating Azure Arc managed identity.`
    );
    return [true, endpointUrlString];
};
