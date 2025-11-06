/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    CommonAuthorizationUrlRequest,
    StringDict,
} from "@azure/msal-common/node";
import { ILoopbackClient } from "../network/ILoopbackClient.js";

/**
 * Request object passed by user to configure acquireTokenInteractive API
 *
 * - openBrowser             - Function to open a browser instance on user's system.
 * - scopes                  - Array of scopes the application is requesting access to.
 * - successTemplate:        - Template to be displayed on the opened browser instance upon successful token acquisition.
 * - errorTemplate           - Template to be displayed on the opened browser instance upon token acquisition failure.
 * - windowHandle            - Used in native broker flows to properly parent the native broker window
 * - loopbackClient          - Custom implementation for a loopback server to listen for authorization code response.
 * @public
 */
export type InteractiveRequest = Partial<
    Omit<
        CommonAuthorizationUrlRequest,
        | "scopes"
        | "requestedClaimsHash"
        | "storeInCache"
        | "tokenQueryParameters"
    >
> & {
    openBrowser: (url: string) => Promise<void>;
    scopes?: Array<string>;
    successTemplate?: string;
    errorTemplate?: string;
    windowHandle?: Buffer; // Relevant only to brokered requests
    loopbackClient?: ILoopbackClient;
    /**
     * @deprecated String to string map of custom query parameters added to the /token call.
     * This feature is being deprecated and not recommended for production scenarios.
     * It will be removed in a future release, and the behavior may be replaced by a new API.
     */
    tokenQueryParameters?: StringDict;
};
