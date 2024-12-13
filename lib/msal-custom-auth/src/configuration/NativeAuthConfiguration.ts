/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Configuration } from "@azure/msal-browser";

export type NativeAuthOptions = {
    challengeTypes?: Array<string>;
};

export type NativeAuthConfiguration = Configuration & {
    nativeAuth: NativeAuthOptions;
};
