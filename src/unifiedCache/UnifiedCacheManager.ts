/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { InMemoryCache, JsonCache } from "./utils/CacheTypes";
import { Separators } from "../utils/Constants";
import { AccessTokenEntity } from "./entities/AccessTokenEntity";
import { IdTokenEntity } from "./entities/IdTokenEntity";
import { RefreshTokenEntity } from "./entities/RefreshTokenEntity";
import { AccountEntity } from "./entities/AccountEntity";
import { ICacheStorage } from "../cache/ICacheStorage";
import { Deserializer } from "./serialize/Deserializer";
import { Serializer } from "./serialize/Serializer";
import { AccountCache } from "./utils/CacheTypes";

export class UnifiedCacheManager {
    // Storage interface
    private inMemoryCache: InMemoryCache;
    private cacheStorage: ICacheStorage;

    constructor(cacheImpl: ICacheStorage) {
        this.cacheStorage = cacheImpl;
        this.inMemoryCache = this.generateInMemoryCache(
            this.cacheStorage.getSerializedCache()
        );
    }

    /**
     * setter  for in cache memory
     */
    setCacheInMemory(cache: InMemoryCache): void {
        this.inMemoryCache = cache;
    }

    /**
     * get the cache in memory
     */
    getCacheInMemory(): InMemoryCache {
        return this.inMemoryCache;
    }

    /**
     * Initialize in memory cache from an exisiting cache vault
     */
    generateInMemoryCache(cache: string): InMemoryCache {
        return Deserializer.deserializeAllCache(
            Deserializer.deserializeJSONBlob(cache)
        );
    }

    /**
     * retrieves the final JSON
     */
    generateJsonCache(inMemoryCache: InMemoryCache): JsonCache {
        return Serializer.serializeAllCache(inMemoryCache);
    }

    /**
     * Returns all accounts in memory
     */
    getAllAccounts(): AccountCache {
        return this.inMemoryCache.accounts;
    }

    /**
     * Returns if the account is in Cache
     * @param homeAccountId
     * @param environment
     * @param realm
     */
    getAccount(
        homeAccountId: string,
        environment: string,
        realm: string
    ): AccountEntity {
        const accountCacheKey: Array<string> = [
            homeAccountId,
            environment,
            realm,
        ];

        const accountKey = accountCacheKey
            .join(Separators.CACHE_KEY_SEPARATOR)
            .toLowerCase();

        return this.inMemoryCache.accounts[accountKey] || null;
    }

    /**
     * append credential cache to in memory cache
     * @param idT: IdTokenEntity
     * @param at: AccessTokenEntity
     * @param rt: RefreshTokenEntity
     */
    addCredentialCache(
        accessToken: AccessTokenEntity,
        idToken: IdTokenEntity,
        refreshToken: RefreshTokenEntity
    ): void {
        this.inMemoryCache.accessTokens[accessToken.generateAccessTokenEntityKey()] = accessToken;
        this.inMemoryCache.idTokens[idToken.generateIdTokenEntityKey()] = idToken;
        this.inMemoryCache.refreshTokens[refreshToken.generateRefreshTokenEntityKey()] = refreshToken;
    }

    /**
     * append account to the in memory cache
     * @param account
     */
    addAccountEntity(account: AccountEntity): void {
        const accKey = account.generateAccountEntityKey();
        if (!this.inMemoryCache.accounts[accKey]) {
            this.inMemoryCache.accounts[accKey] = account;
        }
    }
}
