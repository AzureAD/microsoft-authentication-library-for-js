/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthorizationCodeClient, StringUtils, CommonAuthorizationCodeRequest, ICrypto, AuthenticationResult, Authority, INetworkModule, ClientAuthError, Logger, ServerError } from "@azure/msal-common";
import { BrowserAuthError, BrowserAuthErrorMessage } from "../error/BrowserAuthError";
import { ApiId, TemporaryCacheKeys } from "../utils/BrowserConstants";
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

    constructor(authCodeModule: AuthorizationCodeClient, storageImpl: BrowserCacheManager, authCodeRequest: CommonAuthorizationCodeRequest, logger: Logger, browserCrypto: ICrypto) {
        super(authCodeModule, storageImpl, authCodeRequest, logger);
        this.browserCrypto = browserCrypto;
    }

    /**
     * Redirects window to given URL.
     * @param urlNavigate
     */
    async initiateAuthRequest(requestUrl: string, params: RedirectParams): Promise<void> {
        this.logger.verbose("RedirectHandler.initiateAuthRequest called");
        // Navigate if valid URL
        if (!StringUtils.isEmpty(requestUrl)) {
            // Cache start page, returns to this page after redirectUri if navigateToLoginRequestUrl is true
            if (params.redirectStartPage) {
                this.logger.verbose("RedirectHandler.initiateAuthRequest: redirectStartPage set, caching start page");
                this.browserStorage.setTemporaryCache(TemporaryCacheKeys.ORIGIN_URI, params.redirectStartPage, true);
            }

            // Set interaction status in the library.
            this.browserStorage.setTemporaryCache(TemporaryCacheKeys.CORRELATION_ID, this.authCodeRequest.correlationId, true);
            this.browserStorage.cacheCodeRequest(this.authCodeRequest, this.browserCrypto);
            this.logger.infoPii(`RedirectHandler.initiateAuthRequest: Navigate to: ${requestUrl}`);
            const navigationOptions: NavigationOptions = {
                apiId: ApiId.acquireTokenRedirect,
                timeout: params.redirectTimeout,
                noHistory: false
            };
            
            // If onRedirectNavigate is implemented, invoke it and provide requestUrl
            if (typeof params.onRedirectNavigate === "function") {
                this.logger.verbose("RedirectHandler.initiateAuthRequest: Invoking onRedirectNavigate callback");
                const navigate = params.onRedirectNavigate(requestUrl);

                // Returning false from onRedirectNavigate will stop navigation
                if (navigate !== false) {
                    this.logger.verbose("RedirectHandler.initiateAuthRequest: onRedirectNavigate did not return false, navigating");
                    await params.navigationClient.navigateExternal(requestUrl, navigationOptions);
                    return;
                } else {
                    this.logger.verbose("RedirectHandler.initiateAuthRequest: onRedirectNavigate returned false, stopping navigation");
                    return;
                }
            } else {
                // Navigate window to request URL
                this.logger.verbose("RedirectHandler.initiateAuthRequest: Navigating window to navigate url");
                await params.navigationClient.navigateExternal(requestUrl, navigationOptions);
                return;
            }
        } else {
            // Throw error if request URL is empty.
            this.logger.info("RedirectHandler.initiateAuthRequest: Navigate url is empty");
            throw BrowserAuthError.createEmptyNavigationUriError();
        }
    }

    /**
     * Handle authorization code response in the window.
     * @param hash
     */
    async handleCodeResponseFromHash(locationHash: string, state: string, authority: Authority, networkModule: INetworkModule): Promise<AuthenticationResult> {
        this.logger.verbose("RedirectHandler.handleCodeResponse called");

        // Check that location hash isn't empty.
        if (StringUtils.isEmpty(locationHash)) {
            throw BrowserAuthError.createEmptyHashError(locationHash);
        }

        // Interaction is completed - remove interaction status.
        this.browserStorage.setInteractionInProgress(false);

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
}
