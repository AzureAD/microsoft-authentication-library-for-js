/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    InMemoryCache,
    JsonCache,
    AccountFilter,
    CredentialFilter,
} from "./utils/CacheTypes";
import { AccountEntity } from "./entities/AccountEntity";
import { ICacheStorage } from "./interface/ICacheStorage";
import { Deserializer } from "./serialize/Deserializer";
import { Serializer } from "./serialize/Serializer";
import { Credential } from "./entities/Credential";
import { CredentialType, CacheSchemaType, Constants } from "../utils/Constants";
import { AccountCache, CredentialCache } from "./utils/CacheTypes";
import { ICacheManager } from "./interface/ICacheManager";
import { CacheHelper } from "./utils/CacheHelper";
import { CacheRecord } from "./entities/CacheRecord";
import { StringUtils } from "../utils/StringUtils";
import { AccessTokenEntity } from "./entities/AccessTokenEntity";
import { ScopeSet } from "../request/ScopeSet";

export class UnifiedCacheManager implements ICacheManager {
    // Storage interface
    private cacheStorage: ICacheStorage;
    private inMemory: boolean;
    private clientId: string;

    constructor(cacheImpl: ICacheStorage, clientId: string, storeInMemory: boolean) {
        this.cacheStorage = cacheImpl;
        this.clientId = clientId;
        this.inMemory = storeInMemory;
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
        return this.getAccountsFilteredBy();
    }

    /**
     * saves a cache record
     * @param cacheRecord
     */
    saveCacheRecord(cacheRecord: CacheRecord, responseScopes: ScopeSet): void {
        this.saveAccount(cacheRecord.account);
        this.saveCredential(cacheRecord.idToken);
        this.saveAccessToken(cacheRecord.accessToken, responseScopes);
        this.saveCredential(cacheRecord.refreshToken);
    }

    /**
     * saves account into cache
     * @param account
     */
    saveAccount(account: AccountEntity): void {
        const key = account.generateAccountKey();
        this.cacheStorage.setItem(
            key,
            account,
            CacheSchemaType.ACCOUNT,
            this.inMemory
        );
    }

    /**
     * saves credential - accessToken, idToken or refreshToken into cache
     * @param credential
     */
    saveCredential(credential: Credential): void {
        const key = credential.generateCredentialKey();
        this.cacheStorage.setItem(
            key,
            credential,
            CacheSchemaType.CREDENTIAL,
            this.inMemory
        );
    }

    /**
     * saves access token credential
     * @param credential 
     */
    saveAccessToken(credential: AccessTokenEntity, responseScopes: ScopeSet): void {
        const currentTokenCache = this.getCredentialsFilteredBy({
            clientId: credential.clientId,
            credentialType: CredentialType.ACCESS_TOKEN,
            environment: credential.environment,
            homeAccountId: credential.homeAccountId,
            realm: credential.realm
        });
        const currentAccessTokens: AccessTokenEntity[] = Object.values(currentTokenCache) as AccessTokenEntity[];
        if (currentAccessTokens) {
            currentAccessTokens.forEach((tokenEntity) => {
                const tokenScopeSet = ScopeSet.fromString(tokenEntity.target, this.clientId);
                if (tokenScopeSet.intersectingScopeSets(responseScopes)) {
                    this.removeCredential(tokenEntity);
                }
            });
        }
        this.saveCredential(credential);
    }

    /**
     * Given account key retrieve an account
     * @param key
     */
    getAccount(key: string): AccountEntity {
        const account = this.cacheStorage.getItem(
            key,
            CacheSchemaType.ACCOUNT,
            this.inMemory
        ) as AccountEntity;
        return account;
    }

    /**
     * retrieve a credential - accessToken, idToken or refreshToken; given the cache key
     * @param key
     */
    getCredential(key: string): Credential {
        return this.cacheStorage.getItem(
            key,
            CacheSchemaType.CREDENTIAL,
            this.inMemory
        ) as Credential;
    }

    /**
     * retrieve accounts matching all provided filters; if no filter is set, get all accounts
     * not checking for casing as keys are all generated in lower case, remember to convert to lower case if object properties are compared
     * @param homeAccountId
     * @param environment
     * @param realm
     */
    getAccountsFilteredBy(accountFilter?: AccountFilter): AccountCache {
        return this.getAccountsFilteredByInternal(
            accountFilter ? accountFilter.homeAccountId : "",
            accountFilter ? accountFilter.environment : "",
            accountFilter ? accountFilter.realm : ""
        );
    }

    /**
     * retrieve accounts matching all provided filters; if no filter is set, get all accounts
     * not checking for casing as keys are all generated in lower case, remember to convert to lower case if object properties are compared
     * @param homeAccountId
     * @param environment
     * @param realm
     */
    private getAccountsFilteredByInternal(
        homeAccountId?: string,
        environment?: string,
        realm?: string
    ): AccountCache {
        const allCacheKeys = this.cacheStorage.getKeys();
        const matchingAccounts: AccountCache = {};

        allCacheKeys.forEach((cacheKey) => {
            let matches: boolean = true;
            // don't parse any non-credential type cache entities
            if (CacheHelper.getCredentialType(cacheKey) !== Constants.NOT_DEFINED || CacheHelper.isAppMetadata(cacheKey)) {
                return;
            }
            const entity: AccountEntity = this.cacheStorage.getItem(cacheKey, CacheSchemaType.ACCOUNT) as AccountEntity;

            if (!StringUtils.isEmpty(homeAccountId)) {
                matches = CacheHelper.matchHomeAccountId(entity, homeAccountId);
            }

            if (!StringUtils.isEmpty(environment)) {
                matches =
                    matches &&
                    CacheHelper.matchEnvironment(entity, environment);
            }

            if (!StringUtils.isEmpty(realm)) {
                matches = matches && CacheHelper.matchRealm(entity, realm);
            }

            if (matches) {
                matchingAccounts[cacheKey] = entity;
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
    getCredentialsFilteredBy(filter: CredentialFilter): CredentialCache {
        return this.getCredentialsFilteredByInternal(
            filter.homeAccountId,
            filter.environment,
            filter.credentialType,
            filter.clientId,
            filter.realm,
            filter.target
        );
    }

    /**
     * Support function to help match credentials
     * @param homeAccountId
     * @param environment
     * @param credentialType
     * @param clientId
     * @param realm
     * @param target
     */
    private getCredentialsFilteredByInternal(
        homeAccountId?: string,
        environment?: string,
        credentialType?: string,
        clientId?: string,
        realm?: string,
        target?: string
    ): CredentialCache {
        const allCacheKeys = this.cacheStorage.getKeys();
        const matchingCredentials: CredentialCache = {};

        allCacheKeys.forEach((cacheKey) => {
            let matches: boolean = true;
            // don't parse any non-credential type cache entities
            if (CacheHelper.getCredentialType(cacheKey) === Constants.NOT_DEFINED) {
                return;
            }

            const entity: Credential = this.cacheStorage.getItem(cacheKey, CacheSchemaType.CREDENTIAL) as Credential;

            if (!StringUtils.isEmpty(homeAccountId)) {
                matches = CacheHelper.matchHomeAccountId(
                    entity,
                    homeAccountId
                );
            }

            if (!StringUtils.isEmpty(environment)) {
                matches =
                    matches &&
                    CacheHelper.matchEnvironment(entity, environment);
            }

            if (!StringUtils.isEmpty(realm)) {
                matches = matches && CacheHelper.matchRealm(entity, realm);
            }

            if (!StringUtils.isEmpty(credentialType)) {
                matches =
                    matches &&
                    CacheHelper.matchCredentialType(entity, credentialType);
            }

            if (!StringUtils.isEmpty(clientId)) {
                matches =
                    matches && CacheHelper.matchClientId(entity, clientId);
            }

            // idTokens do not have "target", target specific refreshTokens do exist for some types of authentication
            if (!StringUtils.isEmpty(target) && CacheHelper.getCredentialType(cacheKey) !== CredentialType.ID_TOKEN) {
                matches = matches && CacheHelper.matchTarget(entity, target, clientId);
            }

            if (matches) {
                matchingCredentials[cacheKey] = entity;
            }
        });

        return matchingCredentials;
    }

    /**
     * returns a boolean if the given account is removed
     * @param account
     */
    removeAccount(accountKey: string): boolean {
        const account = this.getAccount(accountKey) as AccountEntity;
        return (
            this.removeAccountContext(account) &&
            this.cacheStorage.removeItem(
                accountKey,
                CacheSchemaType.ACCOUNT,
                this.inMemory
            )
        );
    }

    /**
     * returns a boolean if the given account is removed
     * @param account
     */
    private removeAccountContext(account: AccountEntity): boolean {
        const allCacheKeys = this.cacheStorage.getKeys();
        const accountId = account.generateAccountId();

        allCacheKeys.forEach((cacheKey) => {
            // don't parse any non-credential type cache entities
            if (CacheHelper.getCredentialType(cacheKey) === Constants.NOT_DEFINED) {
                return;
            }

            const cacheEntity: Credential = this.cacheStorage.getItem(
                cacheKey,
                CacheSchemaType.CREDENTIAL,
                this.inMemory
            ) as Credential;

            if (
                !!cacheEntity &&
                accountId === cacheEntity.generateAccountId()
            ) {
                this.removeCredential(cacheEntity);
            }
        });

        return true;
    }

    /**
     * returns a boolean if the given credential is removed
     * @param credential
     */
    removeCredential(credential: Credential): boolean {
        const key = credential.generateCredentialKey();
        return this.cacheStorage.removeItem(
            key,
            CacheSchemaType.CREDENTIAL,
            this.inMemory
        );
    }
}
