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
