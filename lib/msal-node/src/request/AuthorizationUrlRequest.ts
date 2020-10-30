/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CommonAuthorizationUrlRequest } from "@azure/msal-common";

export type AuthorizationUrlRequest = Partial<Omit<CommonAuthorizationUrlRequest, "scopes"|"redirectUri"|"resourceRequestMethod"|"resourceRequestUri"|"authenticationScheme">> & {
    scopes: Array<string>;
    redirectUri: string;
};
