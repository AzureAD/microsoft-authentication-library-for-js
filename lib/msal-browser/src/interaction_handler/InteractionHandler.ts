/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { StringUtils, AuthorizationCodeRequest, AuthenticationResult, AuthorizationCodeClient, AuthorityFactory, Authority, INetworkModule } from "@azure/msal-common";
import { BrowserCacheManager } from "../cache/BrowserCacheManager";
import { BrowserAuthError } from "../error/BrowserAuthError";
import { BrowserProtocolUtils } from "../utils/BrowserProtocolUtils";

export type InteractionParams = {};

/**
 * Abstract class which defines operations for a browser interaction handling class.
 */
export abstract class InteractionHandler {

    protected authModule: AuthorizationCodeClient;
    protected browserStorage: BrowserCacheManager;
    protected authCodeRequest: AuthorizationCodeRequest;

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
    async handleCodeResponse(locationHash: string, authority: Authority, networkModule: INetworkModule): Promise<AuthenticationResult> {
        // Check that location hash isn't empty.
        if (StringUtils.isEmpty(locationHash)) {
            throw BrowserAuthError.createEmptyHashError(locationHash);
        }

        // Deserialize hash fragment response parameters.
        const serverParams = BrowserProtocolUtils.parseServerResponseFromHash(locationHash);

        // Handle code response.
        const stateKey = this.browserStorage.generateStateKey(serverParams.state);
        const requestState = this.browserStorage.getTemporaryCache(stateKey);
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

        authCodeResponse.nonce = cachedNonce;
        authCodeResponse.state = requestState;

        // Acquire token with retrieved code.
        const tokenResponse = await this.authModule.acquireToken(this.authCodeRequest, authCodeResponse);
        this.browserStorage.cleanRequestByState(serverParams.state);
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
