/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { InMemoryCache, JsonCache  } from "./utils/CacheTypes";
import { Separators } from "../utils/Constants";
import { AccessTokenEntity } from "./entities/AccessTokenEntity";
import { IdTokenEntity } from "./entities/IdTokenEntity";
import { RefreshTokenEntity } from "./entities/RefreshTokenEntity";
import { AccountEntity } from "./entities/AccountEntity";
import { Deserializer } from "./serialize/Deserializer";
import { Serializer } from "./serialize/Serializer";
import { AccountCache } from "./utils/CacheTypes";
import { ICacheStorageAsync } from "../cache/ICacheStorageAsync";

export class UnifiedCacheManager {

    // Storage interface
    private inMemoryCache: InMemoryCache;
    private cacheStorage: ICacheStorageAsync;

    constructor(cacheImpl: ICacheStorageAsync) {
        this.cacheStorage = cacheImpl;
    }

    /**
     * setter  for in cache memory
     */
    async setCacheInMemory(cache: InMemoryCache): Promise<void> {
        this.inMemoryCache = cache;
    }

    // if inMemmory cache is not set, set it from caheStorage
    // this async operation can't be done in constructor
    async setCacheInMemmoryIfNotSet(): Promise<void> {
        if (!this.inMemoryCache) {
            this.inMemoryCache = await this.cacheStorage.getCache();
        }
    }

    /**
     * get the cache in memory
     */
    async getCacheInMemory(): Promise<InMemoryCache> {
        await this.setCacheInMemmoryIfNotSet();
        return this.inMemoryCache;
    }

    /**
     * Initialize in memory cache from an exisiting cache vault
     */
    async generateInMemoryCache(cache: string): Promise<InMemoryCache> {
        await this.setCacheInMemmoryIfNotSet();
        return Deserializer.deserializeAllCache(Deserializer.deserializeJSONBlob(cache));
    }

    /**
     * retrieves the final JSON
     */
    async generateJsonCache(inMemoryCache: InMemoryCache): Promise<JsonCache> {
        await this.setCacheInMemmoryIfNotSet();
        return Serializer.serializeAllCache(inMemoryCache);
    }

    /**
     * Returns all accounts in memory
     */
    async getAllAccounts(): Promise<AccountCache> {
        await this.setCacheInMemmoryIfNotSet();
        return this.inMemoryCache.accounts;
    }

    /**
     * Returns if the account is in Cache
     * @param homeAccountId
     * @param environment
     * @param realm
     */
    async getAccount(homeAccountId: string, environment: string, realm: string): Promise<AccountEntity> {
        await this.setCacheInMemmoryIfNotSet();
        const accountCacheKey: Array<string> = [
            homeAccountId,
            environment,
            realm
        ];

        const accountKey = accountCacheKey.join(Separators.CACHE_KEY_SEPARATOR).toLowerCase();

        return this.inMemoryCache.accounts[accountKey] || null;
    }

    /**
     * append credential cache to in memory cache
     * @param idT: IdTokenEntity
     * @param at: AccessTokenEntity
     * @param rt: RefreshTokenEntity
     */
    async addCredentialCache(
        accessToken: AccessTokenEntity,
        idToken: IdTokenEntity,
        refreshToken: RefreshTokenEntity
    ): Promise<void> {
        await this.setCacheInMemmoryIfNotSet();
        this.inMemoryCache.accessTokens[accessToken.generateAccessTokenEntityKey()] = accessToken;
        this.inMemoryCache.idTokens[idToken.generateIdTokenEntityKey()] = idToken;
        this.inMemoryCache.refreshTokens[refreshToken.generateRefreshTokenEntityKey()] = refreshToken;
    }

    /**
     * append account to the in memory cache
     * @param account
     */
    async addAccountEntity(account: AccountEntity): Promise<void> {
        await this.setCacheInMemmoryIfNotSet();
        const accKey = account.generateAccountEntityKey();
        if (!this.inMemoryCache.accounts[accKey]) {
            this.inMemoryCache.accounts[accKey] = account;
        }
    }
}
