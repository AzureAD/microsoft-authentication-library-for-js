/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { IInteractionHandler } from "./IInteractionHandler";
import { BrowserAuthError } from "../error/BrowserAuthError";
import { StringUtils, AuthorizationCodeModule, TemporaryCacheKeys, AuthenticationParameters, AuthError, AuthResponse } from "msal-common";
import { AuthCallback } from "../app/PublicClientApplication";
import { BrowserConfigurationAuthError } from "../error/BrowserConfigurationAuthError";
import { BrowserStorage } from "../cache/BrowserStorage";

export class RedirectHandler extends IInteractionHandler {

    private authCallback: AuthCallback;

    constructor(authCodeModule: AuthorizationCodeModule, storageImpl: BrowserStorage,  redirectCallback: AuthCallback) {
        super(authCodeModule, storageImpl);
        if (!redirectCallback) {
            throw BrowserConfigurationAuthError.createRedirectCallbacksNotSetError();
        }
        this.authCallback = redirectCallback;
    }

    /**
     * Redirects window to given URL.
     * @param urlNavigate 
     */
    showUI(authRequest: AuthenticationParameters): void {
        this.browserStorage.setItem(TemporaryCacheKeys.ORIGIN_URI, window.location.href);
        this.authModule.createLoginUrl(authRequest).then((urlNavigate) => {
            // Navigate if valid URL
            if (urlNavigate && !StringUtils.isEmpty(urlNavigate)) {
                this.authModule.logger.infoPii("Navigate to:" + urlNavigate);
                window.location.assign(urlNavigate);
            }
            else {
                this.authModule.logger.info("Navigate url is empty");
                throw BrowserAuthError.createEmptyRedirectUriError();
            }
        });
    }

    /**
     * Handle authorization code response in the window.
     * @param hash 
     */
    handleCodeResponse(hash: string, navigateToLoginRequestUrl?: boolean): void {
        // retrieve the hash
        const locationHash = hash || window.location.hash;

        if (navigateToLoginRequestUrl) {
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
            return;
        } else {
            window.location.hash = "";
        }

        const authResponse: AuthResponse = null;
        let authErr: AuthError = null;
        try {
            this.authModule.handleFragmentResponse(locationHash);
        } catch (err) {
            authErr = err;
        }

        this.authCallback(authErr, authResponse);
    }
}
