/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    BrowserConfiguration,
    Configuration,
} from "../../config/Configuration.js";

export type QueryKey = "dc" | "slice";

export type CustomAuthOptions = {
    challengeTypes?: Array<string>;
    authApiProxyUrl: string;
    customAuthApiQueryParams?: Partial<Record<QueryKey, string>>;
    capabilities?: Array<string>;
};

export type CustomAuthConfiguration = Configuration & {
    customAuth: CustomAuthOptions;
};

export type CustomAuthBrowserConfiguration = BrowserConfiguration & {
    customAuth: CustomAuthOptions;
};
