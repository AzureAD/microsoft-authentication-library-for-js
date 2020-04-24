/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CacheHelper } from "../utils/CacheHelper";

/**
 * Map for AccountCache entity serialization and deserialization
 */
export class AccountCacheMaps {
    static toCacheMap = {
        homeAccountId: "home_account_id",
        environment: "environment",
        realm: "realm",
        localAccountId: "local_account_id",
        username: "username",
        authorityType: "authority_type",
        name: "name",
        clientInfo: "client_info",
        lastModificationTime: "last_modification_time",
        lastModificationApp: "last_modification_app",
    };

    static fromCacheMap = CacheHelper.swap(AccountCacheMaps.toCacheMap);
}

/**
 * Map for IdTokenCache entity serialization and deserialization
 */
export class IdTokenCacheMaps {
    static toCacheMap = {
        homeAccountId: "home_account_id",
        environment: "environment",
        credentialType: "credential_type",
        clientId: "client_id",
        secret: "secret",
        realm: "realm",
    };

    static fromCacheMap = CacheHelper.swap(IdTokenCacheMaps.toCacheMap);
}

/**
 * Map for AccessTokenCache entity serialization and deserialization
 */
export class AccessTokenCacheMaps {
    static toCacheMap = {
        homeAccountId: "home_account_id",
        environment: "environment",
        credentialType: "credential_type",
        clientId: "client_id",
        secret: "secret",
        realm: "realm",
        target: "target",
        cachedAt: "cached_at",
        expiresOn: "expires_on",
        extendedExpiresOn: "extended_expires_on",
        refreshOn: "refresh_on",
        keyId: "key_id",
        tokenType: "token_type",
    };

    static fromCacheMap = CacheHelper.swap(AccessTokenCacheMaps.toCacheMap);
}

/**
 * Map for RefreshTokenCache entity serialization and deserialization
 */
export class RefreshTokenCacheMaps {
    static toCacheMap = {
        homeAccountId: "home_account_id",
        environment: "environment",
        credentialType: "credential_type",
        clientId: "client_id",
        secret: "secret",
    };

    static fromCacheMap = CacheHelper.swap(RefreshTokenCacheMaps.toCacheMap);
}

/**
 * Map for AppMetadataCache entity serialization and deserialization
 */
export class AppMetadataCacheMaps {
    static toCacheMap = {
        clientId: "client_id",
        environment: "environment",
        familyId: "family_id",
    };

    static fromCacheMap = CacheHelper.swap(AppMetadataCacheMaps.toCacheMap);
}
