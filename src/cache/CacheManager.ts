/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AccountCache, AccountFilter, CredentialFilter, CredentialCache } from "./utils/CacheTypes";
import { CacheRecord } from "./entities/CacheRecord";
import { CacheSchemaType, CredentialType, Constants, APP_META_DATA } from "../utils/Constants";
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
        const accountValues: AccountEntity[] = Object.values(currentAccounts);
        const numAccounts = accountValues.length;
        if (numAccounts < 1) {
            return null;
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
    saveCacheRecord(cacheRecord: CacheRecord, responseScopes?: ScopeSet): void {
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
            this.saveAccessToken(cacheRecord.accessToken, responseScopes);
        }

        if (!!cacheRecord.refreshToken) {
            this.saveCredential(cacheRecord.refreshToken);
        }
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
    private saveAccessToken(credential: AccessTokenEntity, responseScopes: ScopeSet): void {
        const currentTokenCache = this.getCredentialsFilteredBy({
            clientId: credential.clientId,
            credentialType: CredentialType.ACCESS_TOKEN,
            environment: credential.environment,
            homeAccountId: credential.homeAccountId,
            realm: credential.realm
        });
        const currentAccessTokens: AccessTokenEntity[] = Object.values(currentTokenCache.accessTokens) as AccessTokenEntity[];
        if (currentAccessTokens) {
            currentAccessTokens.forEach((tokenEntity) => {
                const tokenScopeSet = ScopeSet.fromString(tokenEntity.target);
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
        const account = this.getItem(key, CacheSchemaType.ACCOUNT) as AccountEntity;
        return account;
    }

    /**
     * retrieve a credential - accessToken, idToken or refreshToken; given the cache key
     * @param key
     */
    getCredential(key: string): CredentialEntity {
        return this.getItem(key, CacheSchemaType.CREDENTIAL) as CredentialEntity;
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
        let entity: AccountEntity;

        allCacheKeys.forEach((cacheKey) => {
            let matches: boolean = true;
            // don't parse any non-account type cache entities
            if (CredentialEntity.getCredentialType(cacheKey) !== Constants.NOT_DEFINED || this.isAppMetadata(cacheKey)) {
                return;
            }

            // Attempt retrieval
            try {
                entity = this.getItem(cacheKey, CacheSchemaType.ACCOUNT) as AccountEntity;
            } catch (e) {
                return;
            }

            if (!StringUtils.isEmpty(homeAccountId)) {
                matches = this.matchHomeAccountId(entity, homeAccountId);
            }

            if (!StringUtils.isEmpty(environment)) {
                matches = matches && this.matchEnvironment(entity, environment);
            }

            if (!StringUtils.isEmpty(realm)) {
                matches = matches && this.matchRealm(entity, realm);
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
        const allCacheKeys = this.getKeys();
        const matchingCredentials: CredentialCache = {
            idTokens: {},
            accessTokens: {},
            refreshTokens: {}
        };

        allCacheKeys.forEach((cacheKey) => {
            let matches: boolean = true;
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

            if (!StringUtils.isEmpty(homeAccountId)) {
                matches = this.matchHomeAccountId(entity, homeAccountId);
            }

            if (!StringUtils.isEmpty(environment)) {
                matches = matches && this.matchEnvironment(entity, environment);
            }

            if (!StringUtils.isEmpty(realm)) {
                matches = matches && this.matchRealm(entity, realm);
            }

            if (!StringUtils.isEmpty(credentialType)) {
                matches = matches && this.matchCredentialType(entity, credentialType);
            }

            if (!StringUtils.isEmpty(clientId)) {
                matches = matches && this.matchClientId(entity, clientId);
            }

            // idTokens do not have "target", target specific refreshTokens do exist for some types of authentication
            // TODO: Add case for target specific refresh tokens
            if (!StringUtils.isEmpty(target) && credType === CredentialType.ACCESS_TOKEN) {
                matches = matches && this.matchTarget(entity, target);
            }

            if (matches) {
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
        return homeAccountId === entity.homeAccountId;
    }

    /**
     *
     * @param value
     * @param environment
     * // TODO: Add Cloud specific aliases based on current cloud
     */
    private matchEnvironment(
        entity: AccountEntity | CredentialEntity,
        environment: string
    ): boolean {
        if (
            TrustedAuthority.getCloudDiscoveryMetadata(environment) &&
            TrustedAuthority.getCloudDiscoveryMetadata(entity.environment)
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
        return credentialType.toLowerCase() === entity.credentialType.toLowerCase();
    }

    /**
     *
     * @param entity
     * @param clientId
     */
    private matchClientId(entity: CredentialEntity, clientId: string): boolean {
        return clientId === entity.clientId;
    }

    /**
     *
     * @param entity
     * @param realm
     */
    private matchRealm(entity: AccountEntity | CredentialEntity, realm: string): boolean {
        return realm === entity.realm;
    }

    /**
     * Returns true if the target scopes are a subset of the current entity's scopes, false otherwise.
     * @param entity
     * @param target
     */
    private matchTarget(entity: CredentialEntity, target: string): boolean {
        const entityScopeSet: ScopeSet = ScopeSet.fromString(entity.target);
        const requestTargetScopeSet: ScopeSet = ScopeSet.fromString(target);
        return entityScopeSet.containsScopeSet(requestTargetScopeSet);
    }

    /**
     * returns if a given cache entity is of the type appmetadata
     * @param key
     */
    private isAppMetadata(key: string): boolean {
        return key.indexOf(APP_META_DATA) !== -1;
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
