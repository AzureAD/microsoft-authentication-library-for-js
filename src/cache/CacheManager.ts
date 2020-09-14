/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AccountCache, AccountFilter, CredentialFilter, CredentialCache } from "./utils/CacheTypes";
import { CacheRecord } from "./entities/CacheRecord";
import { CacheSchemaType, CredentialType, Constants, APP_METADATA } from "../utils/Constants";
import { CredentialEntity } from "./entities/CredentialEntity";
import { ScopeSet } from "../request/ScopeSet";
import { AccountEntity } from "./entities/AccountEntity";
import { AccessTokenEntity } from "./entities/AccessTokenEntity";
import { StringUtils } from "../utils/StringUtils";
import { IdTokenEntity } from "./entities/IdTokenEntity";
import { RefreshTokenEntity } from "./entities/RefreshTokenEntity";
import { AuthError } from "../error/AuthError";
import { ICacheManager } from "./interface/ICacheManager";
import { ClientAuthError } from "../error/ClientAuthError";
import { AccountInfo } from "../account/AccountInfo";
import { TrustedAuthority } from "../authority/TrustedAuthority";

/**
 * Interface class which implement cache storage functions used by MSAL to perform validity checks, and store tokens.
 */
export abstract class CacheManager implements ICacheManager {

    /**
     * Function to set item in cache.
     * @param key
     * @param value
     */
    abstract setItem(key: string, value: string | object, type?: string): void;

    /**
     * Function which retrieves item from cache.
     * @param key
     */
    abstract getItem(key: string, type?: string): string | object;

    /**
     * Function to remove an item from cache given its key.
     * @param key
     */
    abstract removeItem(key: string, type?: string): boolean;

    /**
     * Function which returns boolean whether cache contains a specific key.
     * @param key
     */
    abstract containsKey(key: string, type?: string): boolean;

    /**
     * Function which retrieves all current keys from the cache.
     */
    abstract getKeys(): string[];

    /**
     * Function which clears cache.
     */
    abstract clear(): void;

    /**
     * Returns all accounts in cache
     */
    getAllAccounts(): AccountInfo[] {
        const currentAccounts: AccountCache = this.getAccountsFilteredBy();
        const accountValues: AccountEntity[] = Object.keys(currentAccounts).map(accountKey => currentAccounts[accountKey]);
        const numAccounts = accountValues.length;
        if (numAccounts < 1) {
            return [];
        } else {
            const allAccounts = accountValues.map<AccountInfo>((value) => {
                let accountObj: AccountEntity = new AccountEntity();
                accountObj = CacheManager.toObject(accountObj, value) as AccountEntity;
                return accountObj.getAccountInfo();
            });
            return allAccounts;
        }
    }

    /**
     * saves a cache record
     * @param cacheRecord
     */
    saveCacheRecord(cacheRecord: CacheRecord): void {
        if (!cacheRecord) {
            throw ClientAuthError.createNullOrUndefinedCacheRecord();
        }

        if (!!cacheRecord.account) {
            this.saveAccount(cacheRecord.account);
        }

        if (!!cacheRecord.idToken) {
            this.saveCredential(cacheRecord.idToken);
        }

        if (!!cacheRecord.accessToken) {
            this.saveAccessToken(cacheRecord.accessToken);
        }

        if (!!cacheRecord.refreshToken) {
            this.saveCredential(cacheRecord.refreshToken);
        }
    }

    getCacheRecord(account: AccountInfo, clientId: string, scopes: ScopeSet): CacheRecord {
        // Get account object for this request.
        const accountKey: string = AccountEntity.generateAccountCacheKey(account);
        const cachedAccount = this.getAccount(accountKey);

        // Get current cached tokens
        const cachedAccessToken = this.getAccessTokenEntity(clientId, account, scopes);
        const cachedRefreshToken = this.getRefreshTokenEntity(clientId, account);
        const cachedIdToken = this.getIdTokenEntity(clientId, account);

        return {
            account: cachedAccount,
            accessToken: cachedAccessToken,
            idToken: cachedIdToken,
            refreshToken: cachedRefreshToken
        };
    }

    /**
     * saves account into cache
     * @param account
     */
    private saveAccount(account: AccountEntity): void {
        const key = account.generateAccountKey();
        this.setItem(
            key,
            account,
            CacheSchemaType.ACCOUNT
        );
    }

    /**
     * saves credential - accessToken, idToken or refreshToken into cache
     * @param credential
     */
    private saveCredential(credential: CredentialEntity): void {
        const key = credential.generateCredentialKey();
        this.setItem(
            key,
            credential,
            CacheSchemaType.CREDENTIAL
        );
    }

    /**
     * saves access token credential
     * @param credential
     */
    private saveAccessToken(credential: AccessTokenEntity): void {
        const currentTokenCache = this.getCredentialsFilteredBy({
            clientId: credential.clientId,
            credentialType: CredentialType.ACCESS_TOKEN,
            environment: credential.environment,
            homeAccountId: credential.homeAccountId,
            realm: credential.realm
        });
        const currentScopes = ScopeSet.fromString(credential.target);
        const currentAccessTokens: AccessTokenEntity[] = Object.keys(currentTokenCache.accessTokens).map(key => currentTokenCache.accessTokens[key]);
        if (currentAccessTokens) {
            currentAccessTokens.forEach((tokenEntity) => {
                const tokenScopeSet = ScopeSet.fromString(tokenEntity.target);
                if (tokenScopeSet.intersectingScopeSets(currentScopes)) {
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
        const account = this.getItem(key, CacheSchemaType.ACCOUNT) as AccountEntity;
        return account;
    }

    /**
     * retrieve a credential - accessToken, idToken or refreshToken; given the cache key
     * @param key
     */
    getCredential(key: string): CredentialEntity | null {
        return this.getItem(key, CacheSchemaType.CREDENTIAL) as CredentialEntity;
    }

    /**
     * Helper function to retrieve IdTokenEntity from cache
     * @param clientId 
     * @param account 
     * @param inputRealm 
     */
    getIdTokenEntity(clientId: string, account: AccountInfo): IdTokenEntity | null {
        const idTokenKey: string = CredentialEntity.generateCredentialCacheKey(
            account.homeAccountId,
            account.environment,
            CredentialType.ID_TOKEN,
            clientId,
            account.tenantId
        );

        return this.getCredential(idTokenKey) as IdTokenEntity;
    }

    /**
     * Helper function to retrieve AccessTokenEntity from cache
     * @param clientId 
     * @param account 
     * @param scopes 
     * @param inputRealm 
     */
    getAccessTokenEntity(clientId: string, account: AccountInfo, scopes: ScopeSet): AccessTokenEntity | null {
        const accessTokenFilter: CredentialFilter = {
            homeAccountId: account.homeAccountId,
            environment: account.environment,
            credentialType: CredentialType.ACCESS_TOKEN,
            clientId,
            realm: account.tenantId,
            target: scopes.printScopesLowerCase()
        };
        const credentialCache: CredentialCache = this.getCredentialsFilteredBy(accessTokenFilter);
        const accessTokens = Object.keys(credentialCache.accessTokens).map(key => credentialCache.accessTokens[key]);

        const numAccessTokens = accessTokens.length;
        if (numAccessTokens < 1) {
            return null;
        } else if (numAccessTokens > 1) {
            throw ClientAuthError.createMultipleMatchingTokensInCacheError();
        }

        return accessTokens[0] as AccessTokenEntity;
    }

    /**
     * Helper function to retrieve RefreshTokenEntity from cache
     * @param clientId 
     * @param account 
     */
    getRefreshTokenEntity(clientId: string, account: AccountInfo): RefreshTokenEntity | null {
        const refreshTokenKey: string = CredentialEntity.generateCredentialCacheKey(
            account.homeAccountId,
            account.environment,
            CredentialType.REFRESH_TOKEN,
            clientId
        );

        return this.getCredential(refreshTokenKey) as RefreshTokenEntity;
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
        const allCacheKeys = this.getKeys();
        const matchingAccounts: AccountCache = {};

        allCacheKeys.forEach((cacheKey) => {
            const entity: AccountEntity | null = this.getAccountEntity(cacheKey);

            if (!entity) {
                return null;
            }

            if (!StringUtils.isEmpty(homeAccountId) && !this.matchHomeAccountId(entity, homeAccountId)) {
                return;
            }

            if (!StringUtils.isEmpty(environment) && !this.matchEnvironment(entity, environment)) {
                return;
            }

            if (!StringUtils.isEmpty(realm) && !this.matchRealm(entity, realm)) {
                return;
            }

            matchingAccounts[cacheKey] = entity;
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
            filter.target,
            filter.oboAssertion,
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
        target?: string,
        oboAssertion?: string
    ): CredentialCache {
        const allCacheKeys = this.getKeys();
        const matchingCredentials: CredentialCache = {
            idTokens: {},
            accessTokens: {},
            refreshTokens: {}
        };

        allCacheKeys.forEach((cacheKey) => {
            let entity: CredentialEntity;
            // don't parse any non-credential type cache entities
            const credType = CredentialEntity.getCredentialType(cacheKey);
            if (credType === Constants.NOT_DEFINED) {
                return;
            }

            // Attempt retrieval
            try {
                entity = this.getItem(cacheKey, CacheSchemaType.CREDENTIAL) as CredentialEntity;
            } catch (e) {
                return;
            }

            if (!StringUtils.isEmpty(oboAssertion) && !this.matchOboAssertion(entity, oboAssertion)) {
                return;
            }

            if (!StringUtils.isEmpty(homeAccountId) && !this.matchHomeAccountId(entity, homeAccountId)) {
                return;
            }

            if (!StringUtils.isEmpty(environment) && !this.matchEnvironment(entity, environment)) {
                return;
            }

            if (!StringUtils.isEmpty(realm) && !this.matchRealm(entity, realm)) {
                return;
            }

            if (!StringUtils.isEmpty(credentialType) && !this.matchCredentialType(entity, credentialType)) {
                return;
            }

            if (!StringUtils.isEmpty(clientId) && !this.matchClientId(entity, clientId)) {
                return;
            }

            /*
             * idTokens do not have "target", target specific refreshTokens do exist for some types of authentication
             * TODO: Add case for target specific refresh tokens
             */
            if (!StringUtils.isEmpty(target) && !this.matchTarget(entity, target)) {
                return;
            }

            switch (credType) {
                case CredentialType.ID_TOKEN:
                    matchingCredentials.idTokens[cacheKey] = entity as IdTokenEntity;
                    break;
                case CredentialType.ACCESS_TOKEN:
                    matchingCredentials.accessTokens[cacheKey] = entity as AccessTokenEntity;
                    break;
                case CredentialType.REFRESH_TOKEN:
                    matchingCredentials.refreshTokens[cacheKey] = entity as RefreshTokenEntity;
                    break;
            }
        });

        return matchingCredentials;
    }

    /**
     * Removes all app metadata objects from cache.
     */
    removeAppMetadata(): boolean {
        const allCacheKeys = this.getKeys();
        allCacheKeys.forEach((cacheKey) => {
            if (this.isAppMetadata(cacheKey)) {
                this.removeItem(cacheKey, CacheSchemaType.APP_METADATA);
            }
        });

        return true;
    }

    /**
     * Removes all accounts and related tokens from cache.
     */
    removeAllAccounts(): boolean {
        const allCacheKeys = this.getKeys();
        allCacheKeys.forEach((cacheKey) => {
            const entity: AccountEntity | null = this.getAccountEntity(cacheKey);
            if (!entity) {
                return;
            }
            this.removeAccount(cacheKey);
        });

        return true;
    }

    /**
     * returns a boolean if the given account is removed
     * @param account
     */
    removeAccount(accountKey: string): boolean {
        const account = this.getAccount(accountKey) as AccountEntity;
        if (!account) {
            throw ClientAuthError.createNoAccountFoundError();
        }
        return (this.removeAccountContext(account) && this.removeItem(accountKey, CacheSchemaType.ACCOUNT));
    }

    /**
     * returns a boolean if the given account is removed
     * @param account
     */
    removeAccountContext(account: AccountEntity): boolean {
        const allCacheKeys = this.getKeys();
        const accountId = account.generateAccountId();

        allCacheKeys.forEach((cacheKey) => {
            // don't parse any non-credential type cache entities
            if (CredentialEntity.getCredentialType(cacheKey) === Constants.NOT_DEFINED) {
                return;
            }

            const cacheEntity: CredentialEntity = this.getItem(cacheKey, CacheSchemaType.CREDENTIAL) as CredentialEntity;

            if (!!cacheEntity && accountId === cacheEntity.generateAccountId()) {
                this.removeCredential(cacheEntity);
            }
        });

        return true;
    }

    /**
     * returns a boolean if the given credential is removed
     * @param credential
     */
    removeCredential(credential: CredentialEntity): boolean {
        const key = credential.generateCredentialKey();
        return this.removeItem(key, CacheSchemaType.CREDENTIAL);
    }

    /**
     *
     * @param value
     * @param homeAccountId
     */
    private matchHomeAccountId(
        entity: AccountEntity | CredentialEntity,
        homeAccountId: string
    ): boolean {
        return entity.homeAccountId && homeAccountId === entity.homeAccountId;
    }

    /**
     * @param value
     * @param oboAssertion
     */
    private matchOboAssertion(
        entity: AccountEntity | CredentialEntity,
        oboAssertion: string
    ): boolean {
        return entity.oboAssertion && oboAssertion === entity.oboAssertion;
    }

    /**
     *
     * @param value
     * @param environment
     */
    private matchEnvironment(
        entity: AccountEntity | CredentialEntity,
        environment: string
    ): boolean {
        const cloudMetadata = TrustedAuthority.getCloudDiscoveryMetadata(environment);
        if (
            cloudMetadata &&
            cloudMetadata.aliases.indexOf(entity.environment) > -1
        ) {
            return true;
        }

        return false;
    }

    /**
     *
     * @param entity
     * @param credentialType
     */
    private matchCredentialType(entity: CredentialEntity, credentialType: string): boolean {
        return entity.credentialType && credentialType.toLowerCase() === entity.credentialType.toLowerCase();
    }

    /**
     *
     * @param entity
     * @param clientId
     */
    private matchClientId(entity: CredentialEntity, clientId: string): boolean {
        return entity.clientId && clientId === entity.clientId;
    }

    /**
     *
     * @param entity
     * @param realm
     */
    private matchRealm(entity: AccountEntity | CredentialEntity, realm: string): boolean {
        return entity.realm && realm === entity.realm;
    }

    /**
     * Returns true if the target scopes are a subset of the current entity's scopes, false otherwise.
     * @param entity
     * @param target
     */
    private matchTarget(entity: CredentialEntity, target: string): boolean {
        if (entity.credentialType !== CredentialType.ACCESS_TOKEN || StringUtils.isEmpty(entity.target)) {
            return false;
        }

        const entityScopeSet: ScopeSet = ScopeSet.fromString(entity.target);
        const requestTargetScopeSet: ScopeSet = ScopeSet.fromString(target);

        // ignore offline_access when comparing scopes
        entityScopeSet.removeScope(Constants.OFFLINE_ACCESS_SCOPE);
        requestTargetScopeSet.removeScope(Constants.OFFLINE_ACCESS_SCOPE);
        return entityScopeSet.containsScopeSet(requestTargetScopeSet);
    }

    /**
     * Returns a valid AccountEntity if key and object contain correct values, null otherwise.
     * @param key
     */
    private getAccountEntity(key: string): AccountEntity | null {
        // don't parse any non-account type cache entities
        if (CredentialEntity.getCredentialType(key) !== Constants.NOT_DEFINED || this.isAppMetadata(key)) {
            return null;
        }

        // Attempt retrieval
        let entity: AccountEntity;
        try {
            entity = this.getItem(key, CacheSchemaType.ACCOUNT) as AccountEntity;
        } catch (e) {
            return null;
        }

        // Authority type is required for accounts, return if it is not available (not an account entity)
        if (!entity || StringUtils.isEmpty(entity.authorityType)) {
            return null;
        }

        return entity;
    }

    /**
     * returns if a given cache entity is of the type appmetadata
     * @param key
     */
    private isAppMetadata(key: string): boolean {
        return key.indexOf(APP_METADATA) !== -1;
    }

    /**
     * Helper to convert serialized data to object
     * @param obj
     * @param json
     */
    static toObject<T>(obj: T, json: object): T {
        for (const propertyName in json) {
            obj[propertyName] = json[propertyName];
        }
        return obj;
    }
}

export class DefaultStorageClass extends CacheManager {
    setItem(): void {
        const notImplErr = "Storage interface - setItem() has not been implemented for the cacheStorage interface.";
        throw AuthError.createUnexpectedError(notImplErr);
    }
    getItem(): string | object {
        const notImplErr = "Storage interface - getItem() has not been implemented for the cacheStorage interface.";
        throw AuthError.createUnexpectedError(notImplErr);
    }
    removeItem(): boolean {
        const notImplErr = "Storage interface - removeItem() has not been implemented for the cacheStorage interface.";
        throw AuthError.createUnexpectedError(notImplErr);
    }
    containsKey(): boolean {
        const notImplErr = "Storage interface - containsKey() has not been implemented for the cacheStorage interface.";
        throw AuthError.createUnexpectedError(notImplErr);
    }
    getKeys(): string[] {
        const notImplErr = "Storage interface - getKeys() has not been implemented for the cacheStorage interface.";
        throw AuthError.createUnexpectedError(notImplErr);
    }
    clear(): void {
        const notImplErr = "Storage interface - clear() has not been implemented for the cacheStorage interface.";
        throw AuthError.createUnexpectedError(notImplErr);
    }
}
