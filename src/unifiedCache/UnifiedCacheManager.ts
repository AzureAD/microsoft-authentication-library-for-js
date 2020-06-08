/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { InMemoryCache, JsonCache, AccountFilter, CredentialFilter  } from "./utils/CacheTypes";
import { AccountEntity } from "./entities/AccountEntity";
import { ICacheStorage } from "../cache/ICacheStorage";
import { Deserializer } from "./serialize/Deserializer";
import { Serializer } from "./serialize/Serializer";
import { Credential } from "./entities/Credential";
import {
    CredentialType,
    CacheSchemaType
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
import { CacheRecord } from "./entities/CacheRecord";

export class UnifiedCacheManager implements ICacheManager {
    // Storage interface
    private cacheStorage: ICacheStorage;
    private inMemory: boolean;

    constructor(cacheImpl: ICacheStorage) {
        this.cacheStorage = cacheImpl;
        this.inMemory = true;
    }

    /**
     * sets the inMemory cache
     * @param cache
     */
    setCacheInMemory(cache: InMemoryCache): void {
        this.cacheStorage.setCache(cache);
    }

    /**
     * get the inMemory Cache
     */
    getCacheInMemory(): InMemoryCache {
        return this.cacheStorage.getCache();
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
        return this.getCacheInMemory().accounts;
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
        const key = account.generateAccountKey();
        this.cacheStorage.setItem(key, account, CacheSchemaType.ACCOUNT, this.inMemory);
    }

    /**
     * saves credential - accessToken, idToken or refreshToken into cache
     * @param credential
     */
    saveCredential(credential: Credential): void {
        console.log("in UCacheManager saving credential");
        const key = credential.generateCredentialKey();
        this.cacheStorage.setItem(key, credential, CacheSchemaType.CREDENTIAL, this.inMemory);
    }

    /**
     * Given account key retrieve an account
     * @param key
     */
    getAccount(key: string): AccountEntity {
        return this.cacheStorage.getItem(key, CacheSchemaType.ACCOUNT, this.inMemory) as AccountEntity;
    }

    /**
     * retrieve a credential - accessToken, idToken or refreshToken; given the cache key
     * @param key
     */
    getCredential(key: string): Credential {
        return this.cacheStorage.getItem(key, CacheSchemaType.CREDENTIAL, this.inMemory) as Credential;
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
            if (!!target && CacheHelper.getCredentialType(key) != CredentialType.ID_TOKEN) {
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
        const key = account.generateAccountKey();
        return this.cacheStorage.removeItem(key, CacheSchemaType.ACCOUNT, this.inMemory);
    }

    /**
     * returns a boolean if the given account is removed
     * @param account
     */
    removeAccountContext(account: AccountEntity): boolean {
        const cache = this.getCacheInMemory();
        const accountId = account.generateAccountId();

        Object.keys(cache.idTokens).forEach((key) => {
            if (cache.idTokens[key].generateAccountId() === accountId) {
                this.cacheStorage.removeItem(key, CacheSchemaType.CREDENTIAL, this.inMemory);
            }
        });

        Object.keys(cache.accessTokens).forEach((key) => {
            if (cache.accessTokens[key].generateAccountId() === accountId) {
                this.cacheStorage.removeItem(key, CacheSchemaType.CREDENTIAL, this.inMemory);
            }
        });

        Object.keys(cache.refreshTokens).forEach((key) => {
            if (cache.refreshTokens[key].generateAccountId() === accountId) {
                this.cacheStorage.removeItem(key, CacheSchemaType.CREDENTIAL, this.inMemory);
            }
        });

        return this.removeAccount(account);
    }

    /**
     * returns a boolean if the given credential is removed
     * @param credential
     */
    removeCredential(credential: Credential): boolean {
        const key = credential.generateCredentialKey();
        return this.cacheStorage.removeItem(key, CacheSchemaType.CREDENTIAL, this.inMemory);
    }
}
