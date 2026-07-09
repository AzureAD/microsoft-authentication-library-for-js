/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CommonAuthorizationUrlRequest } from "@azure/msal-common/node";
import { ILoopbackClient } from "../network/ILoopbackClient.js";

/**
 * Request object passed by user to configure acquireTokenInteractive API
 * @public
 */
export type InteractiveRequest = Partial<
    Omit<CommonAuthorizationUrlRequest, "scopes" | "storeInCache">
> & {
    /**
     * Function to open a browser instance on user's system.
     */
    openBrowser: (url: string) => Promise<void>;
    /**
     * Array of scopes the application is requesting access to.
     */
    scopes?: Array<string>;
    /**
     * Template to be displayed on the opened browser instance upon successful token acquisition.
     */
    successTemplate?: string;
    /**
     * Template to be displayed on the opened browser instance upon token acquisition failure.
     */
    errorTemplate?: string;
    /**
     * Used in native broker flows to properly parent the native broker window
     */
    windowHandle?: Buffer; // Relevant only to brokered requests
    /**
     * Custom implementation for a loopback server to listen for authorization code response.
     * @deprecated Omit this property to use MSAL's built-in loopback server; set `preferredPort` when a fixed port is required. This property will be removed in a future major version.
     */
    loopbackClient?: ILoopbackClient;
    /**
     * Preferred port for the loopback server to listen on. If the port is unavailable, a random port will be used.
     * Use this instead of a custom loopbackClient when you need a fixed port for redirect URI registration.
     */
    preferredPort?: number;
};
