/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    AuthError,
    Authority,
    ClientAuthErrorCodes,
    Constants,
    HeaderNames,
    INetworkModule,
    Logger,
    NetworkRequestOptions,
    NetworkResponse,
    ResponseHandler,
    ServerAuthorizationTokenResponse,
    TimeUtils,
    createClientAuthError,
    AuthenticationResult,
    HttpStatus,
} from "@azure/msal-common";
import { ManagedIdentityId } from "../../config/ManagedIdentityId";
import { ManagedIdentityRequestParameters } from "../../config/ManagedIdentityRequestParameters";
import { CryptoProvider } from "../../crypto/CryptoProvider";
import { ManagedIdentityRequest } from "../../request/ManagedIdentityRequest";
import { AUTHORIZATION_HEADER_NAME, HttpMethod } from "../../utils/Constants";
import { ManagedIdentityTokenResponse } from "../../response/ManagedIdentityTokenResponse";
import {
    ManagedIdentityErrorCodes,
    createManagedIdentityError,
} from "../../error/ManagedIdentityError";
import { NodeStorage } from "../../cache/NodeStorage";

export abstract class BaseManagedIdentitySource {
    protected logger: Logger;
    private nodeStorage: NodeStorage;
    private networkClient: INetworkModule;
    private cryptoProvider: CryptoProvider;

    constructor(
        logger: Logger,
        nodeStorage: NodeStorage,
        networkClient: INetworkModule,
        cryptoProvider: CryptoProvider
    ) {
        this.logger = logger;
        this.nodeStorage = nodeStorage;
        this.networkClient = networkClient;
        this.cryptoProvider = cryptoProvider;
    }

    abstract createRequest(
        request: string,
        managedIdentityId: ManagedIdentityId
    ): ManagedIdentityRequestParameters;

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

        const headers: Record<string, string> = networkRequest.headers;
        headers[HeaderNames.CONTENT_TYPE] = Constants.URL_FORM_CONTENT_TYPE;
        const networkRequestOptions: NetworkRequestOptions = { headers };
        if (managedIdentityRequest.forceRefresh) {
            networkRequestOptions.body =
                networkRequest.computeParametersBodyString();
        }

        const reqTimestamp = TimeUtils.nowSeconds();
        let response: NetworkResponse<ManagedIdentityTokenResponse>;
        try {
            // Sources that send POST requests: Cloud Shell
            if (networkRequest.httpMethod === HttpMethod.POST) {
                response =
                    await this.networkClient.sendPostRequestAsync<ManagedIdentityTokenResponse>(
                        networkRequest.computeUri(),
                        networkRequestOptions
                    );
                // Sources that send GET requests: App Service, Azure Arc, IMDS, Service Fabric
            } else {
                response =
                    await this.networkClient.sendGetRequestAsync<ManagedIdentityTokenResponse>(
                        networkRequest.computeUri(),
                        networkRequestOptions
                    );
            }
        } catch (error) {
            if (error instanceof AuthError) {
                throw error;
            } else {
                throw createClientAuthError(ClientAuthErrorCodes.networkError);
            }
        }

        // Azure Arc
        if (response.status === HttpStatus.UNAUTHORIZED) {
            response = await this.retryWithWWWAuthenticate(
                response.headers["WWW-Authenticate"],
                networkRequest,
                networkRequestOptions
            );
        }

        const serverTokenResponse: ServerAuthorizationTokenResponse = {
            status: response.status,

            // success
            access_token: response.body.access_token,
            expires_in: response.body.expires_on,
            scope: response.body.resource,
            token_type: response.body.token_type,

            // error
            error: response.body.message,
            correlation_id: response.body.correlationId,
        };

        // compute refresh_in as 1/2 of expires_in, but only if expires_in > 2h
        if (
            serverTokenResponse.expires_in &&
            serverTokenResponse.expires_in > 2 * 3600
        ) {
            serverTokenResponse.refresh_in = serverTokenResponse.expires_in / 2;
        }

        const responseHandler = new ResponseHandler(
            managedIdentityId.id,
            this.nodeStorage,
            this.cryptoProvider,
            this.logger,
            null,
            null
        );

        responseHandler.validateTokenResponse(
            serverTokenResponse,
            refreshAccessToken
        );

        // caches the token
        return await responseHandler.handleServerTokenResponse(
            serverTokenResponse,
            fakeAuthority,
            reqTimestamp,
            managedIdentityRequest
        );
    }

    private async retryWithWWWAuthenticate(
        challenge: string | undefined,
        networkRequest: ManagedIdentityRequestParameters,
        networkRequestOptions: NetworkRequestOptions
    ): Promise<NetworkResponse<ManagedIdentityTokenResponse>> {
        if (!challenge) {
            throw createManagedIdentityError(
                ManagedIdentityErrorCodes.wwwAuthenticateHeaderMissing
            );
        }

        const splitChallenge = challenge.split("=");
        if (splitChallenge.length !== 2) {
            throw createManagedIdentityError(
                ManagedIdentityErrorCodes.wwwAuthenticateHeaderUnsupportedFormat
            );
        }

        const authHeaderValue = `Basic ${splitChallenge[1]}`;

        this.logger.info(
            `[Managed Identity] Adding authorization header to the request.`
        );
        networkRequest.headers[AUTHORIZATION_HEADER_NAME] = authHeaderValue;

        try {
            return await this.networkClient.sendGetRequestAsync<ManagedIdentityTokenResponse>(
                networkRequest.computeUri(),
                networkRequestOptions
            );
        } catch (error) {
            if (error instanceof AuthError) {
                throw error;
            } else {
                throw createClientAuthError(ClientAuthErrorCodes.networkError);
            }
        }
    }
}
