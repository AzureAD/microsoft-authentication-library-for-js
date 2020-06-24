/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { StringUtils, AuthorizationCodeRequest, ICrypto, ProtocolUtils, CacheSchemaType, AuthenticationResult } from "@azure/msal-common";
import { InteractionHandler } from "./InteractionHandler";
import { BrowserAuthError } from "../error/BrowserAuthError";
import { BrowserConstants, TemporaryCacheKeys } from "../utils/BrowserConstants";
import { BrowserUtils } from "../utils/BrowserUtils";

export class RedirectHandler extends InteractionHandler {

    /**
     * Redirects window to given URL.
     * @param urlNavigate
     */
    initiateAuthRequest(requestUrl: string, authCodeRequest: AuthorizationCodeRequest, browserCrypto?: ICrypto): Window {
        // Navigate if valid URL
        if (!StringUtils.isEmpty(requestUrl)) {
            // Set interaction status in the library.
            this.browserStorage.setItem(
                this.browserStorage.generateCacheKey(TemporaryCacheKeys.ORIGIN_URI), 
                BrowserUtils.getCurrentUri(), 
                CacheSchemaType.TEMPORARY
            );
            this.browserStorage.setItem(this.browserStorage.generateCacheKey(BrowserConstants.INTERACTION_STATUS_KEY), BrowserConstants.INTERACTION_IN_PROGRESS_VALUE, CacheSchemaType.TEMPORARY);
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
    async handleCodeResponse(locationHash: string, browserCrypto?: ICrypto): Promise<AuthenticationResult> {
        // Check that location hash isn't empty.
        if (StringUtils.isEmpty(locationHash)) {
            throw BrowserAuthError.createEmptyHashError(locationHash);
        }

        // Interaction is completed - remove interaction status.
        this.browserStorage.removeItem(this.browserStorage.generateCacheKey(BrowserConstants.INTERACTION_STATUS_KEY));

        // Get cached items
        const requestState = this.browserStorage.getItem(this.browserStorage.generateCacheKey(TemporaryCacheKeys.REQUEST_STATE), CacheSchemaType.TEMPORARY) as string;
        const cachedNonceKey = this.browserStorage.generateNonceKey(requestState);
        const cachedNonce = this.browserStorage.getItem(this.browserStorage.generateCacheKey(cachedNonceKey), CacheSchemaType.TEMPORARY) as string;
        this.authCodeRequest = this.browserStorage.getCachedRequest(requestState, browserCrypto);

        // Handle code response.
        const authCode = this.authModule.handleFragmentResponse(locationHash, requestState);
        this.authCodeRequest.code = authCode;

        // Hash was processed successfully - remove from cache
        this.browserStorage.removeItem(this.browserStorage.generateCacheKey(TemporaryCacheKeys.URL_HASH));

        // Extract user state.
        const userState = ProtocolUtils.getUserRequestState(requestState);

        // Acquire token with retrieved code.
        const tokenResponse = await this.authModule.acquireToken(this.authCodeRequest, userState, cachedNonce);
        this.browserStorage.cleanRequest();
        return tokenResponse;
    }
}
