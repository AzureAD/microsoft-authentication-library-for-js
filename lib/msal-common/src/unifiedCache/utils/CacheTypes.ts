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
export type CredentialCache = {
    idTokens: IdTokenCache;
    accessTokens: AccessTokenCache;
    refreshTokens: RefreshTokenCache;
};

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

/**
 * Account:	<home_account_id>-<environment>-<realm*>
 */
export type AccountFilter = {
    homeAccountId?: string;
    environment?: string;
    realm?: string;
};

/**
 * Credential:	<home_account_id*>-<environment>-<credential_type>-<client_id>-<realm*>-<target*>
 */
export type CredentialFilter = {
    homeAccountId?: string;
    environment?: string;
    credentialType?: string;
    clientId?: string;
    realm?: string;
    target?: string;
};
