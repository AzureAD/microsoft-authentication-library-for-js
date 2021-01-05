/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { StringUtils, AuthorizationCodeRequest, AuthenticationResult, AuthorizationCodeClient, AuthorityFactory, Authority, INetworkModule, ClientAuthError } from "@azure/msal-common";
import { BrowserCacheManager } from "../cache/BrowserCacheManager";
import { BrowserAuthError } from "../error/BrowserAuthError";

export type InteractionParams = {};

/**
 * Abstract class which defines operations for a browser interaction handling class.
 */
export abstract class InteractionHandler {

    protected authModule: AuthorizationCodeClient;
    protected browserStorage: BrowserCacheManager;
    protected authCodeRequest: AuthorizationCodeRequest|undefined;

    constructor(authCodeModule: AuthorizationCodeClient, storageImpl: BrowserCacheManager) {
        this.authModule = authCodeModule;
        this.browserStorage = storageImpl;
    }

    /**
     * Function to enable user interaction.
     * @param requestUrl
     */
    abstract initiateAuthRequest(requestUrl: string, authCodeRequest: AuthorizationCodeRequest, params: InteractionParams): Window | Promise<HTMLIFrameElement> | Promise<void>;

    /**
     * Function to handle response parameters from hash.
     * @param locationHash
     */
    async handleCodeResponse(locationHash: string, state: string, authority: Authority, networkModule: INetworkModule): Promise<AuthenticationResult | null> {
        // Check that location hash isn't empty.
        if (StringUtils.isEmpty(locationHash)) {
            throw BrowserAuthError.createEmptyHashError(locationHash);
        }

        if (!this.authCodeRequest) {
            throw BrowserAuthError.createAuthRequestNotSetError();
        }

        // Handle code response.
        const stateKey = this.browserStorage.generateStateKey(state);
        const requestState = this.browserStorage.getTemporaryCache(stateKey);
        if (!requestState) {
            throw ClientAuthError.createStateNotFoundError("Cached State");
        }
        const authCodeResponse = this.authModule.handleFragmentResponse(locationHash, requestState);

        // Get cached items
        const nonceKey = this.browserStorage.generateNonceKey(requestState);
        const cachedNonce = this.browserStorage.getTemporaryCache(nonceKey);

        // Assign code to request
        this.authCodeRequest.code = authCodeResponse.code;

        // Check for new cloud instance
        if (authCodeResponse.cloud_instance_host_name) {
            await this.updateTokenEndpointAuthority(authCodeResponse.cloud_instance_host_name, authority, networkModule);
        }

        authCodeResponse.nonce = cachedNonce || undefined;
        authCodeResponse.state = requestState;

        // Acquire token with retrieved code.
        const tokenResponse = await this.authModule.acquireToken(this.authCodeRequest, authCodeResponse);
        this.browserStorage.cleanRequestByState(state);
        return tokenResponse;
    }

    protected async updateTokenEndpointAuthority(cloudInstanceHostname: string, authority: Authority, networkModule: INetworkModule): Promise<void> {
        if (!authority.isAuthorityAlias(cloudInstanceHostname)) {
            const cloudInstanceAuthorityUri = `https://${cloudInstanceHostname}/${authority.tenant}/`;
            const cloudInstanceAuthority = await AuthorityFactory.createDiscoveredInstance(cloudInstanceAuthorityUri, networkModule, authority.protocolMode);
            this.authModule.updateAuthority(cloudInstanceAuthority);
        }
    }
}
