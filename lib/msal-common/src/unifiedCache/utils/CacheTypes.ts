/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { StringDict } from "../../utils/MsalTypes";

import { AccountEntity } from "../entities/AccountEntity";
import { IdTokenEntity } from "../entities/IdTokenEntity";
import { AccessTokenEntity } from "../entities/AccessTokenEntity";
import { RefreshTokenEntity } from "../entities/RefreshTokenEntity";
import { AppMetadataEntity } from "../entities/AppMetadataEntity";

export type AccountCache = { [key: string]: AccountEntity };
export type IdTokenCache = { [key: string]: IdTokenEntity };
export type AccessTokenCache = { [key: string]: AccessTokenEntity };
export type RefreshTokenCache = { [key: string]: RefreshTokenEntity };
export type AppMetadataCache = { [key: string]: AppMetadataEntity };

export type JsonCache = {
    Account?: StringDict;
    IdToken?: StringDict;
    AccessToken?: StringDict;
    RefreshToken?: StringDict;
    AppMetadata?: StringDict;
};

export type InMemoryCache = {
    accounts: AccountCache;
    idTokens: IdTokenCache;
    accessTokens: AccessTokenCache;
    refreshTokens: RefreshTokenCache;
    appMetadata: AppMetadataCache;
};

export type ClientCache = {
    serializedCache: string,
    inMemoryCache: InMemoryCache
}
