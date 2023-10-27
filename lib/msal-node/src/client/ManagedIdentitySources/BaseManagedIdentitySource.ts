/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    AuthError,
    Authority,
    CacheManager,
    ClientAuthErrorCodes,
    Constants,
    HeaderNames,
    INetworkModule,
    Logger,
    NetworkRequestOptions,
    ResponseHandler,
    ServerAuthorizationTokenResponse,
    TimeUtils,
    createClientAuthError,
} from "@azure/msal-common";
import { ManagedIdentityId } from "../../config/ManagedIdentityId";
import { ManagedIdentityRequestParameters } from "../../config/ManagedIdentityRequestParameters";
import { CryptoProvider } from "../../crypto/CryptoProvider";
import { ManagedIdentityRequest } from "../../request/ManagedIdentityRequest";
import { HttpMethod } from "../../utils/Constants";
import { ManagedIdentityResult } from "../../response/ManagedIdentityResult";
import { ManagedIdentityUtils } from "../../utils/ManagedIdentityUtils";

export abstract class BaseManagedIdentitySource {
    protected logger: Logger;
    private cacheManager: CacheManager;
    private networkClient: INetworkModule;
    private cryptoProvider: CryptoProvider;

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
        fakeAuthority: Authority,
        refreshAccessToken?: boolean
    ): Promise<ManagedIdentityResult> {
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
        let serverTokenResponse: ServerAuthorizationTokenResponse;
        let response;
        try {
            // Sources that send GET requests: Cloud Shell
            if (networkRequest.httpMethod === HttpMethod.GET) {
                response =
                    await this.networkClient.sendGetRequestAsync<ServerAuthorizationTokenResponse>(
                        networkRequest.computeUri(),
                        networkRequestOptions
                    );
                // Sources that send POST requests: App Service, Azure Arc, IMDS, Service Fabric
            } else {
                response =
                    await this.networkClient.sendPostRequestAsync<ServerAuthorizationTokenResponse>(
                        networkRequest.computeUri(),
                        networkRequestOptions
                    );
            }

            serverTokenResponse = response.body;
            serverTokenResponse.status = response.status;
            // if success
            if (serverTokenResponse.expires_on) {
                serverTokenResponse.expires_in = serverTokenResponse.expires_on;
            }
            // if error
            if (serverTokenResponse.message) {
                serverTokenResponse.error = serverTokenResponse.message;
            }
            // if error
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

        responseHandler.validateTokenResponse(
            serverTokenResponse,
            refreshAccessToken
        );

        // caches the token
        const authResult = await responseHandler.handleServerTokenResponse(
            serverTokenResponse,
            fakeAuthority,
            reqTimestamp,
            managedIdentityRequest
        );

        return ManagedIdentityUtils.convertAuthResultToManagedIdentityResult(
            authResult
        );
    }
}
