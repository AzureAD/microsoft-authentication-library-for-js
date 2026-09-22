/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CommonAuthorizationUrlRequest } from "@azure/msal-common/node";

/**
 * Request object passed by user to configure acquireTokenInteractive API
 * @public
 */
export type InteractiveRequest = Partial<
    Omit<
        CommonAuthorizationUrlRequest,
        "scopes" | "storeInCache" | "responseMode"
    >
> & {
    /**
     * Selects how the authorization response is returned to the loopback server.
     * @deprecated Omit this property to use `form_post`. Interactive response-mode selection will be removed in MSAL Node v7.
     */
    responseMode?: CommonAuthorizationUrlRequest["responseMode"];
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
     * Preferred port for the loopback server to listen on. If the port is unavailable, a random port will be used.
     * Set this when you need a fixed port for redirect URI registration.
     */
    preferredPort?: number;
};
