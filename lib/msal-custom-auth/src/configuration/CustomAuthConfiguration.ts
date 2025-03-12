/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Configuration } from "@azure/msal-browser";
import { BrowserConfiguration } from "../../../msal-browser/lib/types/index.js";

export type CustomAuthOptions = {
    challengeTypes?: Array<string>;
    authApiProxyUrl: string;
};

export type CustomAuthConfiguration = Configuration & {
    customAuth: CustomAuthOptions;
};

export type CustomAuthBrowserConfiguration = BrowserConfiguration & {
    customAuth: CustomAuthOptions;
};
