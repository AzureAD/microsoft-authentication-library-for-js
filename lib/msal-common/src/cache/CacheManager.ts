/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AccountCache, AccountFilter, CredentialFilter, CredentialCache } from "./utils/CacheTypes";
import { CacheRecord } from "./entities/CacheRecord";
import { CacheSchemaType, CredentialType, Constants, APP_METADATA, THE_FAMILY_ID } from "../utils/Constants";
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
import { AppMetadataEntity } from "./entities/AppMetadataEntity";
import { ServerTelemetryEntity } from "./entities/ServerTelemetryEntity";
import { ThrottlingEntity } from "./entities/ThrottlingEntity";

/**
 * Interface class which implement cache storage functions used by MSAL to perform validity checks, and store tokens.
 */
export abstract class CacheManager implements ICacheManager {

    /**
     * set account entity in the platform cache
     * @param key
     * @param value
     */
    abstract setAccount(key: string, value: AccountEntity): void;

    /**
     * fetch the account entity from the platform cache
     * @param key
     */
    abstract getAccount(key: string): AccountEntity;

    /**
     * set credential entity (IdToken/AccessToken/RefreshToken) to the platform cache
     * @param key
     * @param value
     */
    abstract setCredential(key: string, value: CredentialEntity): void;

    /**
     * fetch the credential entity (IdToken/AccessToken/RefreshToken) from the platform cache
     * @param key
     */
    abstract getCredential(key: string): CredentialEntity;

    /**
     * set appMetadata entity to the platform cache
     * @param key
     * @param value
     */
    abstract setAppMetadata(key: string, value: AppMetadataEntity): void;

    /**
     * fetch appMetadata entity from the platform cache
     * @param key
     */
    abstract getAppMetadata(key: string): AppMetadataEntity;

    /**
     * set server telemetry entity to the platform cache
     * @param key
     * @param value
     */
    abstract setServerTelemetry(key: string, value: ServerTelemetryEntity): void;

    /**
     * fetch server telemetry entity from the platform cache
     * @param key
     */
    abstract getServerTelemetry(key: string): ServerTelemetryEntity;

    /**
     * set throttling entity to the platform cache
     * @param key
     * @param value
     */
    abstract setThrottlingCache(key: string, value: ThrottlingEntity): void;

    /**
     * fetch throttling entity from the platform cache
     * @param key
     */
    abstract getThrottlingCache(key: string): ThrottlingEntity;

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

    /**
     * saves account into cache
     * @param account
     */
    private saveAccount(account: AccountEntity): void {
        const key = account.generateAccountKey();
        this.setAccount(key, account);
    }

    /**
     * saves credential - accessToken, idToken or refreshToken into cache
     * @param credential
     */
    private saveCredential(credential: CredentialEntity): void {
        const key = credential.generateCredentialKey();
        this.setCredential(key, credential);
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
            realm: credential.realm,
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
     * retrieve an account entity given the cache key
     * @param key
     */
    getAccount(key: string): AccountEntity | null {
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
     * retrieve a credential - accessToken, idToken or refreshToken; given the cache key
     * @param key
     */
    getCredential(key: string): CredentialEntity | null {
        return this.getItem(key, CacheSchemaType.CREDENTIAL) as CredentialEntity;
    }

    /**
     * retrieve an appmetadata entity given the cache key
     * @param key
     */
    getAppMetadata(key: string): AppMetadataEntity | null {
        return this.getItem(key, CacheSchemaType.APP_METADATA) as AppMetadataEntity;
    }

    /**
     *>>>>>>> dev
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
            const entity: AccountEntity | null = this.getAccount(cacheKey);

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
            filter.familyId,
            filter.realm,
            filter.target,
            filter.oboAssertion
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
        familyId?: string,
        realm?: string,
        target?: string,
        oboAssertion?: string
    ): CredentialCache {
        const allCacheKeys = this.getKeys();
        const matchingCredentials: CredentialCache = {
            idTokens: {},
            accessTokens: {},
            refreshTokens: {},
        };

        allCacheKeys.forEach((cacheKey) => {
            // don't parse any non-credential type cache entities
            const credType = CredentialEntity.getCredentialType(cacheKey);
            if (credType === Constants.NOT_DEFINED) {
                return;
            }

            // Attempt retrieval
            const entity = this.getCredential(cacheKey) as CredentialEntity;
            if (!entity) {
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

            if (!StringUtils.isEmpty(familyId) && !this.matchFamilyId(entity, familyId)) {
                return;
            }

            /*
             * idTokens do not have "target", target specific refreshTokens do exist for some types of authentication
             * Resource specific refresh tokens case will be added when the support is deemed necessary
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
     * Removes all accounts and related tokens from cache.
     */
    removeAllAccounts(): boolean {
        const allCacheKeys = this.getKeys();
        allCacheKeys.forEach((cacheKey) => {
            const entity: AccountEntity | null = this.getAccount(cacheKey);
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
        const account = this.getAccount(accountKey);
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

            const cacheEntity: CredentialEntity = this.getCredential(cacheKey) as CredentialEntity;

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
     * Retrieve the cached credentials into a cacherecord
     * @param account
     * @param clientId
     * @param scopes
     * @param environment
     */
    readCacheRecord(account: AccountInfo, clientId: string, scopes: ScopeSet, environment: string): CacheRecord {
        const cachedAccount = this.readAccountFromCache(account);
        const cachedIdToken = this.readIdTokenFromCache(clientId, account);
        const cachedAccessToken = this.readAccessTokenFromCache(clientId, account, scopes);
        const cachedRefreshToken = this.readRefreshTokenFromCache(clientId, account, false);
        const cachedAppMetadata = this.readAppMetadataFromCache(environment, clientId);

        return {
            account: cachedAccount,
            idToken: cachedIdToken,
            accessToken: cachedAccessToken,
            refreshToken: cachedRefreshToken,
            appMetadata: cachedAppMetadata,
        };
    }

    /**
     * Retrieve AccountEntity from cache
     * @param account
     */
    readAccountFromCache(account: AccountInfo): AccountEntity | null {
        const accountKey: string = AccountEntity.generateAccountCacheKey(account);
        return this.getAccount(accountKey);
    }

    /**
     * Retrieve IdTokenEntity from cache
     * @param clientId
     * @param account
     * @param inputRealm
     */
    readIdTokenFromCache(clientId: string, account: AccountInfo): IdTokenEntity | null {
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
     * Retrieve AccessTokenEntity from cache
     * @param clientId
     * @param account
     * @param scopes
     * @param inputRealm
     */
    readAccessTokenFromCache(clientId: string, account: AccountInfo, scopes: ScopeSet): AccessTokenEntity | null {
        const accessTokenFilter: CredentialFilter = {
            homeAccountId: account.homeAccountId,
            environment: account.environment,
            credentialType: CredentialType.ACCESS_TOKEN,
            clientId,
            realm: account.tenantId,
            target: scopes.printScopesLowerCase(),
        };

        const credentialCache: CredentialCache = this.getCredentialsFilteredBy(accessTokenFilter);
        const accessTokens = Object.keys(credentialCache.accessTokens).map((key) => credentialCache.accessTokens[key]);

        const numAccessTokens = accessTokens.length;
        if (numAccessTokens < 1) {
            return null;
        } else if (numAccessTokens > 1) {
            throw ClientAuthError.createMultipleMatchingTokensInCacheError();
        }

        return accessTokens[0] as AccessTokenEntity;
    }

    /**
     * Helper to retrieve the appropriate refresh token from cache
     * @param clientId
     * @param account
     * @param familyRT
     */
    readRefreshTokenFromCache(clientId: string, account: AccountInfo, familyRT: boolean): RefreshTokenEntity | null {
        const id = familyRT ? THE_FAMILY_ID : null;
        const refreshTokenFilter: CredentialFilter = {
            homeAccountId: account.homeAccountId,
            environment: account.environment,
            credentialType: CredentialType.REFRESH_TOKEN,
            clientId: clientId,
            familyId: id
        };

        const credentialCache: CredentialCache = this.getCredentialsFilteredBy(refreshTokenFilter);
        const refreshTokens = Object.keys(credentialCache.refreshTokens).map((key) => credentialCache.refreshTokens[key]);

        const numRefreshTokens = refreshTokens.length;
        if (numRefreshTokens < 1) {
            return null;
        }
        // address the else case after remove functions address environment aliases

        return refreshTokens[0] as RefreshTokenEntity;
    }

    /**
     * Retrieve AppMetadataEntity from cache
     */
    readAppMetadataFromCache(environment: string, clientId: string): AppMetadataEntity {
        const cacheKey = AppMetadataEntity.generateAppMetadataCacheKey(environment, clientId);
        return this.getAppMetadata(cacheKey);
    }

    /**
     * Return the family_id value associated  with FOCI
     * @param environment
     * @param clientId
     */
    isAppMetadataFOCI(environment: string, clientId: string): boolean {
        const appMetadata = this.readAppMetadataFromCache(environment, clientId);
        return appMetadata && appMetadata.familyId === THE_FAMILY_ID;
    }

    /**
     * helper to match account ids
     * @param value
     * @param homeAccountId
     */
    private matchHomeAccountId(entity: AccountEntity | CredentialEntity, homeAccountId: string): boolean {
        return entity.homeAccountId && homeAccountId === entity.homeAccountId;
    }

    /**
     * helper to match assertion
     * @param value
     * @param oboAssertion
     */
    private matchOboAssertion(entity: AccountEntity | CredentialEntity, oboAssertion: string): boolean {
        return entity.oboAssertion && oboAssertion === entity.oboAssertion;
    }

    /**
     * helper to match environment
     * @param value
     * @param environment
     */
    private matchEnvironment(entity: AccountEntity | CredentialEntity | AppMetadataEntity, environment: string): boolean {
        const cloudMetadata = TrustedAuthority.getCloudDiscoveryMetadata(environment);
        if (cloudMetadata && cloudMetadata.aliases.indexOf(entity.environment) > -1) {
            return true;
        }

        return false;
    }

    /**
     * helper to match credential type
     * @param entity
     * @param credentialType
     */
    private matchCredentialType(entity: CredentialEntity, credentialType: string): boolean {
        return (entity.credentialType && credentialType.toLowerCase() === entity.credentialType.toLowerCase());
    }

    /**
     * helper to match client ids
     * @param entity
     * @param clientId
     */
    private matchClientId(entity: CredentialEntity | AppMetadataEntity, clientId: string): boolean {
        return entity.clientId && clientId === entity.clientId;
    }

    /**
     * helper to match family ids
     * @param entity
     * @param familyId
     */
    private matchFamilyId(entity: CredentialEntity | AppMetadataEntity, familyId: string): boolean {
        return entity.familyId && familyId === entity.familyId;
    }

    /**
     * helper to match realm
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

        if (!requestTargetScopeSet.containsOnlyDefaultScopes()) {
            requestTargetScopeSet.removeDefaultScopes(); // ignore default scopes
        }
        return entityScopeSet.containsScopeSet(requestTargetScopeSet);
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
    setAccount(): void {
        const notImplErr = "Storage interface - setAccount() has not been implemented for the cacheStorage interface.";
        throw AuthError.createUnexpectedError(notImplErr);
    }
    getAccount(): AccountEntity {
        const notImplErr = "Storage interface - getAccount() has not been implemented for the cacheStorage interface.";
        throw AuthError.createUnexpectedError(notImplErr);
    }
    setCredential(): void {
        const notImplErr = "Storage interface - setCredential() has not been implemented for the cacheStorage interface.";
        throw AuthError.createUnexpectedError(notImplErr);
    }
    getCredential(): CredentialEntity {
        const notImplErr = "Storage interface - getCredential() has not been implemented for the cacheStorage interface.";
        throw AuthError.createUnexpectedError(notImplErr);
    }
    setAppMetadata(): void {
        const notImplErr = "Storage interface - setAppMetadata() has not been implemented for the cacheStorage interface.";
        throw AuthError.createUnexpectedError(notImplErr);
    }
    getAppMetadata(): AppMetadataEntity {
        const notImplErr = "Storage interface - getAppMetadata() has not been implemented for the cacheStorage interface.";
        throw AuthError.createUnexpectedError(notImplErr);
    }
    setServerTelemetry(): void {
        const notImplErr = "Storage interface - setServerTelemetry() has not been implemented for the cacheStorage interface.";
        throw AuthError.createUnexpectedError(notImplErr);
    }
    getServerTelemetry(): ServerTelemetryEntity {
        const notImplErr = "Storage interface - getServerTelemetry() has not been implemented for the cacheStorage interface.";
        throw AuthError.createUnexpectedError(notImplErr);
    }
    setThrottlingCache(): void {
        const notImplErr = "Storage interface - setThrottlingCache() has not been implemented for the cacheStorage interface.";
        throw AuthError.createUnexpectedError(notImplErr);
    }
    getThrottlingCache(): ThrottlingEntity {
        const notImplErr = "Storage interface - getThrottlingCache() has not been implemented for the cacheStorage interface.";
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
