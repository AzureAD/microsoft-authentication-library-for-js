/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { InMemoryCache, JsonCache, AccountFilter, CredentialFilter  } from "./utils/CacheTypes";
import { AccessTokenEntity } from "./entities/AccessTokenEntity";
import { IdTokenEntity } from "./entities/IdTokenEntity";
import { RefreshTokenEntity } from "./entities/RefreshTokenEntity";
import { AccountEntity } from "./entities/AccountEntity";
import { ICacheStorage } from "../cache/ICacheStorage";
import { Deserializer } from "./serialize/Deserializer";
import { Serializer } from "./serialize/Serializer";
import { Credential } from "./entities/Credential";
import {
    CredentialType,
    Separators,
    CacheKeyPosition,
} from "../utils/Constants";
import {
    AccountCache,
    CredentialCache,
    IdTokenCache,
    AccessTokenCache,
    RefreshTokenCache,
} from "./utils/CacheTypes";
import { ICacheManager } from "./interface/ICacheManager";
import { CacheHelper } from "./utils/CacheHelper";
import { CacheRecord } from './entities/CacheRecord';

export class UnifiedCacheManager implements ICacheManager {
    // Storage interface
    private inMemoryCache: InMemoryCache;
    private cacheStorage: ICacheStorage;

    constructor(cacheImpl: ICacheStorage) {
        this.cacheStorage = cacheImpl;
        this.inMemoryCache = this.cacheStorage.getCache();
    }

    /**
     * sets the inMemory cache
     * @param cache
     */
    setCacheInMemory(cache: InMemoryCache): void {
        this.inMemoryCache = cache;
    }

    /**
     * get the inMemory Cache
     */
    getCacheInMemory(): InMemoryCache {
        return this.inMemoryCache;
    }

    /**
     * Initialize in memory cache from an exisiting cache vault
     * @param cache
     */
    generateInMemoryCache(cache: string): InMemoryCache {
        return Deserializer.deserializeAllCache(
            Deserializer.deserializeJSONBlob(cache)
        );
    }

    /**
     * retrieves the final JSON
     * @param inMemoryCache
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
     * saves a cache record
     * @param cacheRecord
     */
    saveCacheRecord(cacheRecord: CacheRecord): void {
        this.saveAccount(cacheRecord.account);
        this.saveCredential(cacheRecord.idToken);
        this.saveCredential(cacheRecord.accessToken);
        this.saveCredential(cacheRecord.refreshToken);
    }

    /**
     * saves account into cache
     * @param account
     */
    saveAccount(account: AccountEntity): void {
        const cache = this.getCacheInMemory();
        const key = account.generateAccountKey();
        cache.accounts[key] = account;
        this.setCacheInMemory(cache);
    }

    /**
     * saves credential - accessToken, idToken or refreshToken into cache
     * @param credential
     */
    saveCredential(credential: Credential): void {
        const cache = this.getCacheInMemory();
        const key = credential.generateCredentialKey();

        switch (credential.credentialType) {
            case CredentialType.ID_TOKEN:
                cache.idTokens[key] = credential as IdTokenEntity;
                break;
            case CredentialType.ACCESS_TOKEN:
                cache.accessTokens[
                    key
                ] = credential as AccessTokenEntity;
                break;
            case CredentialType.REFRESH_TOKEN:
                cache.refreshTokens[
                    key
                ] = credential as RefreshTokenEntity;
                break;
            default:
                console.log("Cache entity type mismatch");
        }

        this.setCacheInMemory(cache);
    }

    /**
     * Given account key retrieve an account
     * @param key
     */
    getAccount(key: string): AccountEntity {
        return this.getCacheInMemory().accounts[key] || null;
    }

    /**
     * retrieve a credential - accessToken, idToken or refreshToken; given the cache key
     * @param key
     */
    getCredential(key: string): Credential {
        const cache = this.getCacheInMemory();
        switch (
            key.split(Separators.CACHE_KEY_SEPARATOR)[
                CacheKeyPosition.CREDENTIAL_TYPE
            ]
        ) {
            case "idtoken":
                return cache.idTokens[key] || null;
            case "accesstoken":
                return cache.accessTokens[key] || null;
            case "refreshtoken":
                return cache.refreshTokens[key] || null;
            default:
                console.log("Cache entity type mismatch");
                return null;
        }
    }

    /**
     * retrieve accounts matching all provided filters; if no filter is set, get all accounts
     * not checking for casing as keys are all generated in lower case, remember to convert to lower case if object properties are compared
     * @param homeAccountId
     * @param environment
     * @param realm
     */
    getAccountsFilteredBy(
       accountFilter: AccountFilter
    ): AccountCache {
        return this.getAccountsFilteredByInternal(
            accountFilter.homeAccountId,
            accountFilter.environment,
            accountFilter.realm
        );
    }

    /**
     * retrieve accounts matching all provided filters; if no filter is set, get all accounts
     * not checking for casing as keys are all generated in lower case, remember to convert to lower case if object properties are compared
     * @param homeAccountId
     * @param environment
     * @param realm
     */
    getAccountsFilteredByInternal(
        homeAccountId?: string,
        environment?: string,
        realm?: string
    ): AccountCache {
        const accounts: AccountCache = this.getCacheInMemory().accounts;
        const matchingAccounts: AccountCache = {};

        let matches: boolean = true;

        Object.keys(accounts).forEach((key) => {
            if (!!homeAccountId) {
                matches = CacheHelper.matchHomeAccountId(key, homeAccountId);
            }

            if (!!environment) {
                matches = matches && CacheHelper.matchEnvironment(key, environment);
            }

            if (!!realm) {
                matches = matches && CacheHelper.matchRealm(key, realm);
            }

            if (matches) {
                matchingAccounts[key] = accounts[key];
            }
        });

        return matchingAccounts;
    }

    /**
     * retrieve credentails matching all provided filters; if no filter is set, get all credentials
     * @param homeAccountId
     * @param environment
     * @param credentialType
     * @param clientId
     * @param realm
     * @param target
     */
    getCredentialsFilteredBy(
        filter: CredentialFilter
    ): CredentialCache {
        const matchingCredentials: CredentialCache = {
            idTokens: {},
            accessTokens: {},
            refreshTokens: {},
        };

        return this.getCredentialsFilteredByInternal(
            filter.homeAccountId,
            filter.environment,
            filter.clientId,
            filter.realm,
            filter.target
        );
    }

    /**
     * retrieve credentails matching all provided filters; if no filter is set, get all credentials
     * @param homeAccountId
     * @param environment
     * @param credentialType
     * @param clientId
     * @param realm
     * @param target
     */
    getCredentialsFilteredByInternal(
        homeAccountId?: string,
        environment?: string,
        credentialType?: string,
        clientId?: string,
        realm?: string,
        target?: string
    ): CredentialCache {
        const matchingCredentials: CredentialCache = {
            idTokens: {},
            accessTokens: {},
            refreshTokens: {},
        };

        matchingCredentials.idTokens = this.getCredentialsFilteredByCredentialType(
            this.getCacheInMemory().idTokens,
            homeAccountId,
            environment,
            credentialType,
            clientId,
            realm,
            target
        ) as IdTokenCache;

        matchingCredentials.accessTokens = this.getCredentialsFilteredByCredentialType(
            this.getCacheInMemory().accessTokens,
            homeAccountId,
            environment,
            credentialType,
            clientId,
            realm,
            target
        ) as AccessTokenCache;

        matchingCredentials.refreshTokens = this.getCredentialsFilteredByCredentialType(
            this.getCacheInMemory().refreshTokens,
            homeAccountId,
            environment,
            credentialType,
            clientId,
            realm,
            target
        ) as RefreshTokenCache;

        return matchingCredentials;
    }

    /**
     * Support function to help match credentials
     * @param cacheCredentials
     * @param homeAccountId
     * @param environment
     * @param credentialType
     * @param clientId
     * @param realm
     * @param target
     */
    private getCredentialsFilteredByCredentialType(
        cacheCredentials: object,
        homeAccountId?: string,
        environment?: string,
        credentialType?: string,
        clientId?: string,
        realm?: string,
        target?: string
    ): Object {
        const matchingCredentials = {};
        let matches: boolean = true;

        Object.keys(cacheCredentials).forEach((key) => {
            if (!!homeAccountId) {
                matches = CacheHelper.matchHomeAccountId(
                    key,
                    homeAccountId
                );
            }

            if (!!environment) {
                matches = matches && CacheHelper.matchEnvironment(key, environment);
            }

            if (!!realm) {
                matches = matches && CacheHelper.matchRealm(key, realm);
            }

            if (!!credentialType) {
                matches = matches && CacheHelper.matchCredentialType(key, credentialType);
            }

            if (!!clientId) {
                matches = matches && CacheHelper.matchClientId(key, clientId);
            }

            // idTokens do not have "target", target specific refreshTokens do exist for some types of authentication
            if (!!target && CacheHelper.getCredentialType(key) != CredentialType.ID_TOKEN.toString().toLowerCase()) {
                matches = matches && CacheHelper.matchTarget(key, target);
            }

            if (matches) {
                matchingCredentials[key] = cacheCredentials[key];
            }
        });

        return matchingCredentials;
    }

    /**
     * returns a boolean if the given account is removed
     * @param account
     */
    removeAccount(account: AccountEntity): boolean {
        const cache = this.getCacheInMemory();
        const accountKey = account.generateAccountKey();

        if (!!cache.accounts[accountKey]) {
            delete cache.accounts[accountKey];
            return true;
        }

        return false;
    }

    /**
     * returns a boolean if the given account is removed
     * @param account
     */
    removeAccountContext(account: AccountEntity): boolean {
        const cache = this.getCacheInMemory();

        const accountId = account.generateAccountId();

        // TODO: Check how this should be done, do we just remove the account or also the associated credentials always?
        Object.keys(cache.accessTokens).forEach((key) => {
            if (
                cache.accessTokens[key].generateAccountId() === accountId
            )
                this.removeCredential(cache.accessTokens[key]);
        });

        Object.keys(cache.idTokens).forEach((key) => {
            if (cache.idTokens[key].generateAccountId() === accountId)
                this.removeCredential(cache.idTokens[key]);
        });

        Object.keys(cache.idTokens).forEach((key) => {
            if (cache.idTokens[key].generateAccountId() === accountId)
                this.removeCredential(cache.idTokens[key]);
        });

        this.removeAccount(account);
        return true;
    }

    /**
     * returns a boolean if the given credential is removed
     * @param credential
     */
    removeCredential(credential: Credential): boolean {
        const cache = this.getCacheInMemory();

        switch (credential.credentialType) {
            case CredentialType.ID_TOKEN:
                delete cache.idTokens[
                    credential.generateCredentialKey()
                ];
                return true;
            case CredentialType.ACCESS_TOKEN:
                delete cache.accessTokens[
                    credential.generateCredentialKey()
                ];
                return true;
            case CredentialType.REFRESH_TOKEN:
                delete cache.refreshTokens[
                    credential.generateCredentialKey()
                ];
                return true;
            default:
                console.log("Cache entity type mismatch");
                return false;
        }
    }
}
