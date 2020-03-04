/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { StringUtils, TemporaryCacheKeys, TokenResponse } from "@azure/msal-common";
import { InteractionHandler } from "./InteractionHandler";
import { BrowserAuthError } from "../error/BrowserAuthError";
import { BrowserConstants } from "../utils/BrowserConstants";
import { BrowserUtils } from "../utils/BrowserUtils";

export class RedirectHandler extends InteractionHandler {

    /**
     * Redirects window to given URL.
     * @param urlNavigate
     */
    showUI(requestUrl: string): Window {
        // Navigate if valid URL
        if (!StringUtils.isEmpty(requestUrl)) {
            // Set interaction status in the library.
            this.browserStorage.setItem(TemporaryCacheKeys.ORIGIN_URI, window.location.href);
            this.browserStorage.setItem(BrowserConstants.INTERACTION_STATUS_KEY, BrowserConstants.INTERACTION_IN_PROGRESS_VALUE);
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
    async handleCodeResponse(locationHash: string): Promise<TokenResponse> {
        // Check that location hash isn't empty.
        if (StringUtils.isEmpty(locationHash)) {
            throw BrowserAuthError.createEmptyHashError(locationHash);
        }

        // Interaction is completed - remove interaction status.
        this.browserStorage.removeItem(BrowserConstants.INTERACTION_STATUS_KEY);
        // Handle code response.
        const codeResponse = this.authModule.handleFragmentResponse(locationHash);
        // Hash was processed successfully - remove from cache
        this.browserStorage.removeItem(TemporaryCacheKeys.URL_HASH);
        // Acquire token with retrieved code.
        return this.authModule.acquireToken(codeResponse);
    }
}
