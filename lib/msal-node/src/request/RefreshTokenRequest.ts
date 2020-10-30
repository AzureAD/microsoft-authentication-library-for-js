/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CommonRefreshTokenRequest } from "@azure/msal-common";

export type RefreshTokenRequest = Partial<Omit<CommonRefreshTokenRequest, "scopes"|"refreshToken"|"authenticationScheme"|"resourceRequestMethod"|"resourceRequestUri">> & {
    scopes: Array<string>;
    refreshToken: string;
};
