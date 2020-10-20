/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { StringUtils, AuthorizationCodeRequest, ICrypto, CacheSchemaType, AuthenticationResult, ThrottlingUtils } from "@azure/msal-common";
import { InteractionHandler } from "./InteractionHandler";
import { BrowserAuthError } from "../error/BrowserAuthError";
import { BrowserConstants, TemporaryCacheKeys } from "../utils/BrowserConstants";
import { BrowserUtils } from "../utils/BrowserUtils";
import { BrowserProtocolUtils } from "../utils/BrowserProtocolUtils";

export class RedirectHandler extends InteractionHandler {

    /**
     * Redirects window to given URL.
     * @param urlNavigate
     */
    initiateAuthRequest(requestUrl: string, authCodeRequest: AuthorizationCodeRequest, redirectStartPage?: string, browserCrypto?: ICrypto): Window {
        // Navigate if valid URL
        if (!StringUtils.isEmpty(requestUrl)) {
            // Cache start page, returns to this page after redirectUri if navigateToLoginRequestUrl is true
            if (redirectStartPage) {
                this.browserStorage.setTemporaryCache(TemporaryCacheKeys.ORIGIN_URI, redirectStartPage, true);
            }

            // Set interaction status in the library.
            this.browserStorage.setTemporaryCache(BrowserConstants.INTERACTION_STATUS_KEY, BrowserConstants.INTERACTION_IN_PROGRESS_VALUE, true);
            this.browserStorage.cacheCodeRequest(authCodeRequest, browserCrypto);
            this.authModule.logger.infoPii("Navigate to:" + requestUrl);
            const isIframedApp = BrowserUtils.isInIframe();
            if (isIframedApp) {
                // If we are not in top frame, we shouldn't redirect. This is also handled by the service.
                throw BrowserAuthError.createRedirectInIframeError(isIframedApp);
            }
            // Navigate window to request URL
            BrowserUtils.navigateWindow(requestUrl);
        } else {
            // Throw error if request URL is empty.
            this.authModule.logger.info("Navigate url is empty");
            throw BrowserAuthError.createEmptyNavigationUriError();
        }
        // Return this window handle. Not used for redirect, but needed for API definition.
        return window;
    }

    /**
     * Handle authorization code response in the window.
     * @param hash
     */
    async handleCodeResponse(locationHash: string, browserCrypto?: ICrypto, clientId?: string): Promise<AuthenticationResult> {
        // Check that location hash isn't empty.
        if (StringUtils.isEmpty(locationHash)) {
            throw BrowserAuthError.createEmptyHashError(locationHash);
        }

        // Interaction is completed - remove interaction status.
        this.browserStorage.removeItem(this.browserStorage.generateCacheKey(BrowserConstants.INTERACTION_STATUS_KEY));

        // Deserialize hash fragment response parameters.
        const serverParams = BrowserProtocolUtils.parseServerResponseFromHash(locationHash);

        // Handle code response.
        const stateKey = this.browserStorage.generateStateKey(serverParams.state);
        const requestState = this.browserStorage.getTemporaryCache(stateKey);
        const authCode = this.authModule.handleFragmentResponse(locationHash, requestState);

        // Get cached items
        const nonceKey = this.browserStorage.generateNonceKey(requestState);
        const cachedNonce = this.browserStorage.getTemporaryCache(nonceKey);
        this.authCodeRequest = this.browserStorage.getCachedRequest(requestState, browserCrypto);
        this.authCodeRequest.code = authCode;

        // Remove throttle if it exists
        if (clientId) {
            ThrottlingUtils.removeThrottle(this.browserStorage, clientId, this.authCodeRequest.authority, this.authCodeRequest.scopes);
        }

        // Acquire token with retrieved code.
        const tokenResponse = await this.authModule.acquireToken(this.authCodeRequest, cachedNonce, requestState);

        this.browserStorage.cleanRequest(serverParams.state);
        return tokenResponse;
    }
}
