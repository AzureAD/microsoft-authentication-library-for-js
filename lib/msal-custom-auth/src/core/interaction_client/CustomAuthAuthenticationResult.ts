/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthenticationResult } from "@azure/msal-browser";

export type CustomAuthAuthenticationResult = AuthenticationResult & {
    refreshToken: string;
};
