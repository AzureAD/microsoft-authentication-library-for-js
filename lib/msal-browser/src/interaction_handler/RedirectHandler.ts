/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { InteractionHandler } from "./InteractionHandler";
import { BrowserAuthError } from "../error/BrowserAuthError";
import { StringUtils, AuthorizationCodeModule, TemporaryCacheKeys, TokenResponse } from "msal-common";
import { BrowserStorage } from "../cache/BrowserStorage";
import { BrowserConstants } from "../utils/BrowserConstants";

export class RedirectHandler extends InteractionHandler {

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
        this.browserStorage.setItem(TemporaryCacheKeys.ORIGIN_URI, window.location.href);
        this.browserStorage.setItem(BrowserConstants.INTERACTION_STATUS_KEY, BrowserConstants.INTERACTION_IN_PROGRESS);
        // Navigate if valid URL
        if (!StringUtils.isEmpty(requestUrl)) {
            this.authModule.logger.infoPii("Navigate to:" + requestUrl);
            window.location.assign(requestUrl);
        } else {
            this.authModule.logger.info("Navigate url is empty");
            throw BrowserAuthError.createEmptyRedirectUriError();
        }
        return window;
    }

    /**
     * Handle authorization code response in the window.
     * @param hash 
     */
    async handleCodeResponse(locationHash: string): Promise<TokenResponse> {
        if (StringUtils.isEmpty(locationHash)) {
            throw BrowserAuthError.createEmptyHashError(locationHash);
        }

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

        this.browserStorage.removeItem(BrowserConstants.INTERACTION_STATUS_KEY);
        const codeResponse = this.authModule.handleFragmentResponse(locationHash);
        return this.authModule.acquireToken(codeResponse);
    }
}
