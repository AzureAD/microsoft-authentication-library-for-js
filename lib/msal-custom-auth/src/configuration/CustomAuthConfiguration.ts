/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Configuration } from "@azure/msal-browser";
import { BrowserConfiguration } from "../../../msal-browser/lib/types/index.js";

/**
 * Custom Auth Options
 */
export type CustomAuthOptions = {
    challengeTypes?: Array<string>;
    authApiProxyUrl: string;
};

/**
 * Configuration object for Custom Auth
 */
export type CustomAuthConfiguration = Configuration & {
    customAuth: CustomAuthOptions;
};

/**
 * Browser configuration object for Custom Auth
 */
export type CustomAuthBrowserConfiguration = BrowserConfiguration & {
    customAuth: CustomAuthOptions;
};
