/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    BrowserConfiguration,
    Configuration,
} from "../../config/Configuration.js";
import { CustomAuthRequestInterceptor } from "./CustomAuthRequestInterceptor.js";

export type CustomAuthOptions = {
    challengeTypes?: Array<string>;
    authApiProxyUrl: string;
    customAuthApiQueryParams?: Record<string, string>;
    capabilities?: Array<string>;
    requestInterceptor?: CustomAuthRequestInterceptor;
};

export type CustomAuthConfiguration = Configuration & {
    customAuth: CustomAuthOptions;
};

export type CustomAuthBrowserConfiguration = BrowserConfiguration & {
    customAuth: CustomAuthOptions;
};
