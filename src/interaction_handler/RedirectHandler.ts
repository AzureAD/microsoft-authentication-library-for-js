/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthorizationCodeClient, StringUtils, CommonAuthorizationCodeRequest, ICrypto, AuthenticationResult, ThrottlingUtils, Authority, INetworkModule, ClientAuthError, Logger } from "@azure/msal-common";
import { BrowserAuthError } from "../error/BrowserAuthError";
import { ApiId, BrowserConstants, TemporaryCacheKeys } from "../utils/BrowserConstants";
import { BrowserCacheManager } from "../cache/BrowserCacheManager";
import { InteractionHandler, InteractionParams } from "./InteractionHandler";
import { INavigationClient } from "../navigation/INavigationClient";
import { NavigationOptions } from "../navigation/NavigationOptions";

export type RedirectParams = InteractionParams & {
    navigationClient: INavigationClient;
    redirectTimeout: number;
    redirectStartPage: string;
    onRedirectNavigate?: (url: string) => void | boolean;
};

export class RedirectHandler extends InteractionHandler {

    private browserCrypto: ICrypto;

    constructor(authCodeModule: AuthorizationCodeClient, storageImpl: BrowserCacheManager, authCodeRequest: CommonAuthorizationCodeRequest, browserRequestLogger: Logger, browserCrypto: ICrypto) {
        super(authCodeModule, storageImpl, authCodeRequest, browserRequestLogger);
        this.browserCrypto = browserCrypto;
    }

    /**
     * Redirects window to given URL.
     * @param urlNavigate
     */
    async initiateAuthRequest(requestUrl: string, params: RedirectParams): Promise<void> {
        this.browserRequestLogger.verbose("RedirectHandler.initiateAuthRequest called");
        // Navigate if valid URL
        if (!StringUtils.isEmpty(requestUrl)) {
            // Cache start page, returns to this page after redirectUri if navigateToLoginRequestUrl is true
            if (params.redirectStartPage) {
                this.browserRequestLogger.verbose("RedirectHandler.initiateAuthRequest: redirectStartPage set, caching start page");
                this.browserStorage.setTemporaryCache(TemporaryCacheKeys.ORIGIN_URI, params.redirectStartPage, true);
            }

            // Set interaction status in the library.
            this.browserStorage.setTemporaryCache(TemporaryCacheKeys.INTERACTION_STATUS_KEY, BrowserConstants.INTERACTION_IN_PROGRESS_VALUE, true);
            this.browserStorage.setTemporaryCache(TemporaryCacheKeys.CORRELATION_ID, this.authCodeRequest.correlationId, true);
            this.browserStorage.cacheCodeRequest(this.authCodeRequest, this.browserCrypto);
            this.browserRequestLogger.infoPii(`RedirectHandler.initiateAuthRequest: Navigate to: ${requestUrl}`);
            const navigationOptions: NavigationOptions = {
                apiId: ApiId.acquireTokenRedirect,
                timeout: params.redirectTimeout,
                noHistory: false
            };
            
            // If onRedirectNavigate is implemented, invoke it and provide requestUrl
            if (typeof params.onRedirectNavigate === "function") {
                this.browserRequestLogger.verbose("RedirectHandler.initiateAuthRequest: Invoking onRedirectNavigate callback");
                const navigate = params.onRedirectNavigate(requestUrl);

                // Returning false from onRedirectNavigate will stop navigation
                if (navigate !== false) {
                    this.browserRequestLogger.verbose("RedirectHandler.initiateAuthRequest: onRedirectNavigate did not return false, navigating");
                    await params.navigationClient.navigateExternal(requestUrl, navigationOptions);
                    return;
                } else {
                    this.browserRequestLogger.verbose("RedirectHandler.initiateAuthRequest: onRedirectNavigate returned false, stopping navigation");
                    return;
                }
            } else {
                // Navigate window to request URL
                this.browserRequestLogger.verbose("RedirectHandler.initiateAuthRequest: Navigating window to navigate url");
                await params.navigationClient.navigateExternal(requestUrl, navigationOptions);
                return;
            }
        } else {
            // Throw error if request URL is empty.
            this.browserRequestLogger.info("RedirectHandler.initiateAuthRequest: Navigate url is empty");
            throw BrowserAuthError.createEmptyNavigationUriError();
        }
    }

    /**
     * Handle authorization code response in the window.
     * @param hash
     */
    async handleCodeResponse(locationHash: string, state: string, authority: Authority, networkModule: INetworkModule, clientId?: string): Promise<AuthenticationResult> {
        this.browserRequestLogger.verbose("RedirectHandler.handleCodeResponse called");

        // Check that location hash isn't empty.
        if (StringUtils.isEmpty(locationHash)) {
            throw BrowserAuthError.createEmptyHashError(locationHash);
        }

        // Interaction is completed - remove interaction status.
        this.browserStorage.removeItem(this.browserStorage.generateCacheKey(TemporaryCacheKeys.INTERACTION_STATUS_KEY));

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

        // Remove throttle if it exists
        if (clientId) {
            ThrottlingUtils.removeThrottle(this.browserStorage, clientId, this.authCodeRequest.authority, this.authCodeRequest.scopes);
        }

        // Acquire token with retrieved code.
        const tokenResponse = await this.authModule.acquireToken(this.authCodeRequest, authCodeResponse);

        this.browserStorage.cleanRequestByState(state);
        return tokenResponse;
    }
}
