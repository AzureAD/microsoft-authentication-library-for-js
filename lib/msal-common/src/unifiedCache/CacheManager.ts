/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AccessTokenCache, IdTokenCache, RefreshTokenCache, AccountCache, AppMetadataCache, StringDict } from "../utils/MsalTypes";
import { CacheInterface } from "./serialize/CacheInterface";
import { Separators } from "../utils/Constants";
import { AccessTokenEntity } from "./entities/AccessTokenEntity";
import { IdTokenEntity } from "./entities/IdTokenEntity";
import { RefreshTokenEntity } from "./entities/RefreshTokenEntity";
import { AccountEntity } from "./entities/AccountEntity";

export type CacheContent = {
    accessTokens: AccessTokenCache;
    idTokens: IdTokenCache;
    refreshTokens: RefreshTokenCache;
    accounts: AccountCache;
    appMetadata: AppMetadataCache;
};

export class CacheManager {

    cacheContent: CacheContent;

    constructor(cachedJson: any) {
        this.cacheContent = this.initCache(cachedJson);
    }

    /**
     * Initialize in memory cache from an exisiting cache vault
     */
    initCache(cachedJson: any): CacheContent {
        const jsonContent = CacheInterface.deserializeJSONBlob(cachedJson);

        return {
            accessTokens: CacheInterface.generateAccessTokenCache(jsonContent.accessTokens),
            idTokens: CacheInterface.generateIdTokenCache(jsonContent.idTokens),
            refreshTokens: CacheInterface.generateRefreshTokenCache(jsonContent.refreshTokens),
            accounts: CacheInterface.generateAccountCache(jsonContent.accounts),
            appMetadata: CacheInterface.generateAppMetadataCache(jsonContent.appMetadata)
        };
    }

    /**
     * Returns all accounts in memory
     */
    getAllAccounts() {
        return this.cacheContent.accounts;
    }

    /**
     * Returns if the account is in Cache
     * @param homeAccountId
     * @param environment
     * @param realm
     */
    getAccount(homeAccountId: string, environment: string, realm: string) {
        const accountCacheKey: Array<string> = [
            homeAccountId,
            environment,
            realm
        ];

        const accountKey = accountCacheKey.join(Separators.CACHE_KEY_SEPARATOR).toLowerCase();
        return this.cacheContent.accounts[accountKey];
    }

    /**
     * append credential cache to in memory cache
     * @param idT: IdTokenEntity
     * @param at: AccessTokenEntity
     * @param rt: RefreshTokenEntity
     */
    addCredentialCache(idT: IdTokenEntity, at: AccessTokenEntity, rt: RefreshTokenEntity): void {
        this.cacheContent.idTokens[idT.generateIdTokenEntityKey()] = idT;
        this.cacheContent.accessTokens[at.generateAccessTokenEntityKey()] = at;
        this.cacheContent.refreshTokens[at.generateAccessTokenEntityKey()] = rt;
    }

    /**
     * append account to the in memory cache
     * @param account
     */
    addAccountEntity(account: AccountEntity): void {
        const accKey = account.generateAccountEntityKey();
        if (!this.cacheContent.accounts[accKey])
            this.cacheContent.accounts[accKey] = account;
    }
}
