/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CacheInterface, CacheContent, CacheInMemObjects  } from "./serialize/CacheInterface";
import { Separators } from "../utils/Constants";
import { AccessTokenEntity } from "./entities/AccessTokenEntity";
import { IdTokenEntity } from "./entities/IdTokenEntity";
import { RefreshTokenEntity } from "./entities/RefreshTokenEntity";
import { AccountEntity } from "./entities/AccountEntity";

export class UnifiedCacheManager {

    // Storage interface
    inMemoryCache: CacheInMemObjects;

    constructor(inMemCache: CacheInMemObjects) {
        this.inMemoryCache = inMemCache;
    }

    /**
     * set the memory
     */
    setCacheInMemory(cache: CacheInMemObjects): void {
        this.inMemoryCache = cache;
    }

    /**
     * Returns all accounts in memory
     */
    getAllAccounts() {
        return this.inMemoryCache.accounts;
    }

    /**
     * Returns if the account is in Cache
     * @param homeAccountId
     * @param environment
     * @param realm
     */
    getAccount(homeAccountId: string, environment: string, realm: string): AccountEntity {
        const accountCacheKey: Array<string> = [
            homeAccountId,
            environment,
            realm
        ];

        const accountKey = accountCacheKey.join(Separators.CACHE_KEY_SEPARATOR).toLowerCase();

        if (this.inMemoryCache.accounts[accountKey])
            return this.inMemoryCache.accounts[accountKey];
        else {
            return null;
        }
    }

    /**
     * append credential cache to in memory cache
     * @param idT: IdTokenEntity
     * @param at: AccessTokenEntity
     * @param rt: RefreshTokenEntity
     */
    addCredentialCache(at: AccessTokenEntity, idT: IdTokenEntity, rt: RefreshTokenEntity): void {
        this.inMemoryCache.accessTokens[at.generateAccessTokenEntityKey()] = at;
        this.inMemoryCache.idTokens[idT.generateIdTokenEntityKey()] = idT;
        this.inMemoryCache.refreshTokens[rt.generateRefreshTokenEntityKey()] = rt;
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
