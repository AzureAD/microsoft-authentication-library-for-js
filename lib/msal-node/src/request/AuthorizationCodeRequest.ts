/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CommonAuthorizationCodeRequest } from "@azure/msal-common";

export type AuthorizationCodeRequest = Partial<Omit<CommonAuthorizationCodeRequest, "scopes"|"redirectUri"|"code"|"authenticationScheme"|"resourceRequestMethod"|"resourceRequestUri">> & {
    scopes: Array<string>;
    redirectUri: string;
    code: string;
};
