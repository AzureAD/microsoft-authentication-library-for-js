/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { StringUtils, CommonAuthorizationCodeRequest, AuthenticationResult, AuthorizationCodeClient, AuthorityFactory, Authority, INetworkModule, ClientAuthError, CcsCredential, Logger } from "@azure/msal-common";
import { BrowserCacheManager } from "../cache/BrowserCacheManager";
import { BrowserAuthError } from "../error/BrowserAuthError";
import { TemporaryCacheKeys } from "../utils/BrowserConstants";

export type InteractionParams = {};

/**
 * Abstract class which defines operations for a browser interaction handling class.
 */
export abstract class InteractionHandler {

    protected authModule: AuthorizationCodeClient;
    protected browserStorage: BrowserCacheManager;
    protected authCodeRequest: CommonAuthorizationCodeRequest;
    protected browserRequestLogger: Logger;

    constructor(authCodeModule: AuthorizationCodeClient, storageImpl: BrowserCacheManager, authCodeRequest: CommonAuthorizationCodeRequest, browserRequestLogger: Logger) {
        this.authModule = authCodeModule;
        this.browserStorage = storageImpl;
        this.authCodeRequest = authCodeRequest;
        this.browserRequestLogger = browserRequestLogger;
    }

    /**
     * Function to enable user interaction.
     * @param requestUrl
     */
    abstract initiateAuthRequest(requestUrl: string, params: InteractionParams): Window | Promise<HTMLIFrameElement> | Promise<void>;

    /**
     * Function to handle response parameters from hash.
     * @param locationHash
     */
    async handleCodeResponse(locationHash: string, state: string, authority: Authority, networkModule: INetworkModule): Promise<AuthenticationResult> {
        this.browserRequestLogger.verbose("InteractionHandler.handleCodeResponse called");
        // Check that location hash isn't empty.
        if (StringUtils.isEmpty(locationHash)) {
            throw BrowserAuthError.createEmptyHashError(locationHash);
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

        // Add CCS parameters if available
        if (authCodeResponse.client_info) {
            this.authCodeRequest.clientInfo = authCodeResponse.client_info;
        } else {
            const cachedCcsCred = this.checkCcsCredentials();
            if (cachedCcsCred) {
                this.authCodeRequest.ccsCredential = cachedCcsCred;
            }
        }

        // Acquire token with retrieved code.
        const tokenResponse = await this.authModule.acquireToken(this.authCodeRequest, authCodeResponse);
        this.browserStorage.cleanRequestByState(state);
        return tokenResponse;
    }

    /**
     * Updates authority based on cloudInstanceHostname
     * @param cloudInstanceHostname 
     * @param authority 
     * @param networkModule 
     */
    protected async updateTokenEndpointAuthority(cloudInstanceHostname: string, authority: Authority, networkModule: INetworkModule): Promise<void> {
        const cloudInstanceAuthorityUri = `https://${cloudInstanceHostname}/${authority.tenant}/`;
        const cloudInstanceAuthority = await AuthorityFactory.createDiscoveredInstance(cloudInstanceAuthorityUri, networkModule, this.browserStorage, authority.options);
        this.authModule.updateAuthority(cloudInstanceAuthority);
    }

    /**
     * Looks up ccs creds in the cache
     */
    protected checkCcsCredentials(): CcsCredential | null {
        // Look up ccs credential in temp cache
        const cachedCcsCred = this.browserStorage.getTemporaryCache(TemporaryCacheKeys.CCS_CREDENTIAL, true);
        if (cachedCcsCred) {
            try {
                return JSON.parse(cachedCcsCred) as CcsCredential;
            } catch (e) {
                this.authModule.logger.error("Cache credential could not be parsed");
                this.authModule.logger.errorPii(`Cache credential could not be parsed: ${cachedCcsCred}`);
            }
        }
        return null;
    }
}
