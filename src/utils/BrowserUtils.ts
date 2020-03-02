/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { INetworkModule } from "@azure/msal-common";
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
     */
    static navigateWindow(urlNavigate: string, noHistory?: boolean): void {
        const windowParentCheck = (window.parent !== window);
        if (windowParentCheck) {
            // If we are not in top frame, we shouldn't redirect. This is also handled by the service.
            throw BrowserAuthError.createRedirectInIframeError(windowParentCheck);
        }
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
}
