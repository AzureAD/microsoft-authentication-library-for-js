/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { INetworkModule, UrlString } from "@azure/msal-common";
import { FetchClient } from "../network/FetchClient";
import { XhrClient } from "../network/XhrClient";
import { BrowserAuthError } from "../error/BrowserAuthError";

/**
 * Utility class for browser specific functions
 */
export class BrowserUtils {

    // #region Window Navigation and URL management

    /**
     * Used to redirect the browser to the STS authorization endpoint
     * @param {string} urlNavigate - URL of the authorization endpoint
     * @param {boolean} noHistory - boolean flag, uses .replace() instead of .assign() if true
     */
    static navigateWindow(urlNavigate: string, noHistory?: boolean): void {
        if (noHistory) {
            window.location.replace(urlNavigate);
        } else {
            window.location.assign(urlNavigate);
        }
    }

    /**
     * Clears hash from window url.
     */
    static clearHash(): void {
        window.location.hash = "";
    }

    /**
     * Returns boolean of whether the current window is in an iframe or not.
     */
    static isInIframe(): boolean {
        return window.parent !== window;
    }

    // #endregion

    /**
     * Returns current window URL as redirect uri
     */
    static getDefaultRedirectUri(): string {
        return window.location.href.split("?")[0].split("#")[0];
    }

    /**
     * Returns best compatible network client object. 
     */
    static getBrowserNetworkClient(): INetworkModule {
        if (window.fetch) {
            return new FetchClient();
        } else {
            return new XhrClient();
        }
    }

    /**
     * Throws error if we have completed an auth and are 
     * attempting another auth request inside an iframe.
     */
    static blockReloadInHiddenIframes(): void {
        const isResponseHash = UrlString.hashContainsKnownProperties(window.location.hash);
        // return an error if called from the hidden iframe created by the msal js silent calls
        if (isResponseHash && BrowserUtils.isInIframe()) {
            throw BrowserAuthError.createBlockReloadInHiddenIframeError();
        }
    }
}
