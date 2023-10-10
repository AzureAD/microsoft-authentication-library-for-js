/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    AuthError,
    AuthenticationResult,
    Authority,
    CacheManager,
    ClientAuthErrorCodes,
    Constants,
    HeaderNames,
    INetworkModule,
    Logger,
    NetworkRequestOptions,
    ResponseHandler,
    TimeUtils,
    createClientAuthError,
} from "@azure/msal-common";
import { ManagedIdentityId } from "../../config/ManagedIdentityId";
import { ManagedIdentityRequestParameters } from "../../config/ManagedIdentityRequestParameters";
import { CryptoProvider } from "../../crypto/CryptoProvider";
import { ManagedIdentityRequest } from "../../request/ManagedIdentityRequest";
import { ServerManagedIdentityTokenResponse } from "../../response/ServerManagedIdentityTokenResponse";
import { HttpMethod } from "../../utils/Constants";

export abstract class BaseManagedIdentitySource {
    protected logger: Logger;
    private cacheManager: CacheManager;
    private networkClient: INetworkModule;
    protected readonly cryptoProvider: CryptoProvider;

    constructor(
        logger: Logger,
        cacheManager: CacheManager,
        networkClient: INetworkModule,
        cryptoProvider: CryptoProvider
    ) {
        this.logger = logger;
        this.cacheManager = cacheManager;
        this.networkClient = networkClient;
        this.cryptoProvider = cryptoProvider;
    }

    abstract createRequest(
        request: string,
        managedIdentityId: ManagedIdentityId
    ): ManagedIdentityRequestParameters;

    public async authenticateWithMSI(
        managedIdentityRequest: ManagedIdentityRequest,
        managedIdentityId: ManagedIdentityId,
        fakeAuthority: Authority
    ): Promise<AuthenticationResult | null> {
        const networkRequest: ManagedIdentityRequestParameters =
            this.createRequest(
                managedIdentityRequest.resource,
                managedIdentityId
            );

        const headers: Record<string, string> = {};
        headers[HeaderNames.CONTENT_TYPE] = Constants.URL_FORM_CONTENT_TYPE;
        const networkRequestOptions: NetworkRequestOptions = { headers };
        if (managedIdentityRequest.forceRefresh) {
            networkRequestOptions.body =
                networkRequest.computeParametersBodyString();
        }

        const reqTimestamp = TimeUtils.nowSeconds();
        let serverTokenResponse: ServerManagedIdentityTokenResponse;
        let response;
        try {
            // Sources that send GET requests: Cloud Shell
            if (networkRequest.httpMethod === HttpMethod.GET) {
                response =
                    await this.networkClient.sendGetRequestAsync<ServerManagedIdentityTokenResponse>(
                        networkRequest.computeUri(),
                        networkRequestOptions
                    );
                // Sources that send POST requests: App Service, Azure Arc, IMDS, Service Fabric
            } else {
                response =
                    await this.networkClient.sendPostRequestAsync<ServerManagedIdentityTokenResponse>(
                        networkRequest.computeUri(),
                        networkRequestOptions
                    );
            }

            serverTokenResponse = response.body;
            serverTokenResponse.status = response.status;
            if (serverTokenResponse.expires_on) {
                serverTokenResponse.expires_in = serverTokenResponse.expires_on;
            }
            if (serverTokenResponse.message) {
                serverTokenResponse.error = serverTokenResponse.message;
            }
            if (serverTokenResponse.correlationId) {
                serverTokenResponse.correlation_id =
                    serverTokenResponse.correlationId;
            }
        } catch (error) {
            if (error instanceof AuthError) {
                throw error;
            } else {
                throw createClientAuthError(ClientAuthErrorCodes.networkError);
            }
        }

        const responseHandler = new ResponseHandler(
            managedIdentityId.getId,
            this.cacheManager,
            this.cryptoProvider,
            this.logger,
            null,
            null
        );

        responseHandler.validateTokenResponse(serverTokenResponse);

        const tokenResponse = await responseHandler.handleServerTokenResponse(
            serverTokenResponse,
            fakeAuthority,
            reqTimestamp,
            // BaseAuthRequest
            {
                ...managedIdentityRequest,
                authority: fakeAuthority.canonicalAuthority,
                correlationId: managedIdentityId.getId,
                scopes: [managedIdentityRequest.resource],
            }
        );

        return tokenResponse;
    }
}
