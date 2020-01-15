/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
// Common package imports
import { INetworkModule } from "msal-common";
// Network Clients
import { FetchClient } from "../network/FetchClient";
import { XhrClient } from "../network/XhrClient";

/**
 * Utility class for browser specific functions
 */
export class BrowserUtils {

    // #region Window Navigation

    /**
     * Used to redirect the browser to the STS authorization endpoint
     * @param {string} urlNavigate - URL of the authorization endpoint
     */
    static navigateWindow(urlNavigate: string): void {
        window.location.assign(urlNavigate);
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
