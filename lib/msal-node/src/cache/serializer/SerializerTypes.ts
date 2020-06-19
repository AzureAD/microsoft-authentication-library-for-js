/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {AccountCache, IdTokenCache, AccessTokenCache, RefreshTokenCache, AppMetadataCache } from "@azure/msal-common";

export type Dict = {
    [key: string]: object;
};

export type JsonCache = {
    Account: Dict;
    IdToken: Dict;
    AccessToken: Dict;
    RefreshToken: Dict;
    AppMetadata: Dict;
};

export type InMemoryCache = {
    accounts: AccountCache;
    idTokens: IdTokenCache;
    accessTokens: AccessTokenCache;
    refreshTokens: RefreshTokenCache;
    appMetadata: AppMetadataCache;
};
