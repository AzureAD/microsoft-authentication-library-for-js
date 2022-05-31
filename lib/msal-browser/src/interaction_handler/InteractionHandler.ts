/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthorizationCodePayload , StringUtils, CommonAuthorizationCodeRequest, AuthenticationResult, AuthorizationCodeClient, AuthorityFactory, Authority, INetworkModule, ClientAuthError, CcsCredential, Logger, ServerError } from "@azure/msal-common";

import { BrowserCacheManager } from "../cache/BrowserCacheManager";
import { BrowserAuthError, BrowserAuthErrorMessage } from "../error/BrowserAuthError";
import { TemporaryCacheKeys } from "../utils/BrowserConstants";

export type InteractionParams = {};

/**
 * Abstract class which defines operations for a browser interaction handling class.
 */
export class InteractionHandler {

    protected authModule: AuthorizationCodeClient;
    protected browserStorage: BrowserCacheManager;
    protected authCodeRequest: CommonAuthorizationCodeRequest;
    protected logger: Logger;

    constructor(authCodeModule: AuthorizationCodeClient, storageImpl: BrowserCacheManager, authCodeRequest: CommonAuthorizationCodeRequest, logger: Logger) {
        this.authModule = authCodeModule;
        this.browserStorage = storageImpl;
        this.authCodeRequest = authCodeRequest;
        this.logger = logger;
    }

    /**
     * Function to handle response parameters from hash.
     * @param locationHash
     */
    async handleCodeResponseFromHash(locationHash: string, state: string, authority: Authority, networkModule: INetworkModule): Promise<AuthenticationResult> {
        this.logger.verbose("InteractionHandler.handleCodeResponse called");
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

        let authCodeResponse;
        try {
            authCodeResponse = this.authModule.handleFragmentResponse(locationHash, requestState);
        } catch (e) {
            if (e instanceof ServerError && e.subError === BrowserAuthErrorMessage.userCancelledError.code) {
                // Translate server error caused by user closing native prompt to corresponding first class MSAL error
                throw BrowserAuthError.createUserCancelledError();
            } else {
                throw e;
            }
        }

        return this.handleCodeResponseFromServer(authCodeResponse, state, authority, networkModule);
    }

    /**
     * Process auth code response from AAD
     * @param authCodeResponse 
     * @param state 
     * @param authority 
     * @param networkModule 
     * @returns 
     */
    async handleCodeResponseFromServer(authCodeResponse: AuthorizationCodePayload, state: string, authority: Authority, networkModule: INetworkModule, validateNonce: boolean = true): Promise<AuthenticationResult> {
        this.logger.trace("InteractionHandler.handleCodeResponseFromServer called");

        // Handle code response.
        const stateKey = this.browserStorage.generateStateKey(state);
        const requestState = this.browserStorage.getTemporaryCache(stateKey);
        if (!requestState) {
            throw ClientAuthError.createStateNotFoundError("Cached State");
        }
        
        // Get cached items
        const nonceKey = this.browserStorage.generateNonceKey(requestState);
        const cachedNonce = this.browserStorage.getTemporaryCache(nonceKey);

        // Assign code to request
        this.authCodeRequest.code = authCodeResponse.code;

        // Check for new cloud instance
        if (authCodeResponse.cloud_instance_host_name) {
            await this.updateTokenEndpointAuthority(authCodeResponse.cloud_instance_host_name, authority, networkModule);
        }

        // Nonce validation not needed when redirect not involved (e.g. hybrid spa, renewing token via rt)
        if (validateNonce) {
            authCodeResponse.nonce = cachedNonce || undefined;
        }
        
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
