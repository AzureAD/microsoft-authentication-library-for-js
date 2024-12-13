/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Configuration } from "@azure/msal-browser";

export type CustomAuthOptions = {
    challengeTypes?: Array<string>;
};

export type CustomAuthConfiguration = Configuration & {
    customAuth: CustomAuthOptions;
};
