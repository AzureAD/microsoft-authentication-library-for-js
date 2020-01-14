/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
// Common package imports
import { StringUtils, AuthorizationCodeModule, TemporaryCacheKeys, TokenResponse } from "msal-common";
// Base class
import { InteractionHandler } from "./InteractionHandler";
// Storage
import { BrowserStorage } from "../cache/BrowserStorage";
// Error
import { BrowserAuthError } from "../error/BrowserAuthError";
// Constants
import { BrowserConstants } from "../utils/BrowserConstants";

export class RedirectHandler extends InteractionHandler {

    // Config to navigate to login request url. Set by user, default is true.
    private navigateToLoginRequestUrl: boolean;

    constructor(authCodeModule: AuthorizationCodeModule, storageImpl: BrowserStorage, navigateToLoginRequestUrl: boolean) {
        super(authCodeModule, storageImpl);
        this.navigateToLoginRequestUrl = navigateToLoginRequestUrl;
    }

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
            // Navigate window to request URL
            window.location.assign(requestUrl);
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

        // If navigateToLoginRequestUrl is true, then cache the hash and navigate to cached request URI.
        if (this.navigateToLoginRequestUrl) {
            this.browserStorage.setItem(TemporaryCacheKeys.URL_HASH, locationHash);
            if (window.parent === window) {
                const loginRequestUrl = this.browserStorage.getItem(TemporaryCacheKeys.ORIGIN_URI);

                // Redirect to home page if login request url is null (real null or the string null)
                if (!loginRequestUrl || loginRequestUrl === "null") {
                    this.authModule.logger.error("Unable to get valid login request url from cache, redirecting to home page");
                    window.location.href = "/";
                } else {
                    window.location.href = loginRequestUrl;
                }
            }
            return null;
        } else {
            window.location.hash = "";
        }

        // Interaction is completed - remove interaction status.
        this.browserStorage.removeItem(BrowserConstants.INTERACTION_STATUS_KEY);
        // Handle code response.
        const codeResponse = this.authModule.handleFragmentResponse(locationHash);
        // Acquire token with retrieved code.
        return this.authModule.acquireToken(codeResponse);
    }
}
