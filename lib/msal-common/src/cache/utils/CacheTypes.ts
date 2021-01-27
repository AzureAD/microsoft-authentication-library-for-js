/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AccountEntity } from "../entities/AccountEntity";
import { IdTokenEntity } from "../entities/IdTokenEntity";
import { AccessTokenEntity } from "../entities/AccessTokenEntity";
import { RefreshTokenEntity } from "../entities/RefreshTokenEntity";
import { AppMetadataEntity } from "../entities/AppMetadataEntity";
import { ServerTelemetryEntity } from "../entities/ServerTelemetryEntity";
import { ThrottlingEntity } from "../entities/ThrottlingEntity";
import { AuthorityMetadataEntity } from "../entities/AuthorityMetadataEntity";

export type AccountCache = Record<string, AccountEntity>;
export type IdTokenCache = Record<string, IdTokenEntity>;
export type AccessTokenCache = Record<string, AccessTokenEntity>;
export type RefreshTokenCache = Record<string, RefreshTokenEntity>;
export type AppMetadataCache = Record<string, AppMetadataEntity>;
export type CredentialCache = {
    idTokens: IdTokenCache;
    accessTokens: AccessTokenCache;
    refreshTokens: RefreshTokenCache;
};

export type ValidCacheType = AccountEntity | IdTokenEntity | AccessTokenEntity | RefreshTokenEntity | AppMetadataEntity | AuthorityMetadataEntity | ServerTelemetryEntity | ThrottlingEntity | string;
export type ValidCredentialType = IdTokenEntity | AccessTokenEntity | RefreshTokenEntity;

/**
 * Account:	<home_account_id>-<environment>-<realm*>
 */
export type AccountFilter = {
    homeAccountId?: string;
    environment?: string;
    realm?: string;
};

/**
 * Credential: <home_account_id*>-<environment>-<credential_type>-<client_id>-<realm*>-<target*>
 */
export type CredentialFilter = {
    homeAccountId?: string;
    environment?: string;
    credentialType?: string;
    clientId?: string;
    familyId?: string;
    realm?: string;
    target?: string;
    oboAssertion?: string;
};

/**
 * AppMetadata: appmetadata-<environment>-<client_id>
 */
export type AppMetadataFilter = {
    environment?: string;
    clientId?: string;
};
