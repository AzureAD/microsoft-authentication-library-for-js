/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    AccountFilter,
    CredentialFilter,
    ValidCredentialType,
    AppMetadataFilter,
    AppMetadataCache,
    TokenKeys,
} from "./utils/CacheTypes";
import { CacheRecord } from "./entities/CacheRecord";
import {
    CredentialType,
    APP_METADATA,
    THE_FAMILY_ID,
    AUTHORITY_METADATA_CONSTANTS,
    AuthenticationScheme,
    Separators,
} from "../utils/Constants";
import { CredentialEntity } from "./entities/CredentialEntity";
import { ScopeSet } from "../request/ScopeSet";
import { AccountEntity } from "./entities/AccountEntity";
import { AccessTokenEntity } from "./entities/AccessTokenEntity";
import { IdTokenEntity } from "./entities/IdTokenEntity";
import { RefreshTokenEntity } from "./entities/RefreshTokenEntity";
import { AuthError } from "../error/AuthError";
import { ICacheManager } from "./interface/ICacheManager";
import { ClientAuthError } from "../error/ClientAuthError";
import { AccountInfo } from "../account/AccountInfo";
import { AppMetadataEntity } from "./entities/AppMetadataEntity";
import { ServerTelemetryEntity } from "./entities/ServerTelemetryEntity";
import { ThrottlingEntity } from "./entities/ThrottlingEntity";
import { extractTokenClaims } from "../account/AuthToken";
import { ICrypto } from "../crypto/ICrypto";
import { AuthorityMetadataEntity } from "./entities/AuthorityMetadataEntity";
import { BaseAuthRequest } from "../request/BaseAuthRequest";
import { Logger } from "../logger/Logger";
import { name, version } from "../packageMetadata";
import { StoreInCache } from "../request/StoreInCache";

/**
 * Interface class which implement cache storage functions used by MSAL to perform validity checks, and store tokens.
 * @internal
 */
export abstract class CacheManager implements ICacheManager {
    protected clientId: string;
    protected cryptoImpl: ICrypto;
    // Instance of logger for functions defined in the msal-common layer
    private commonLogger: Logger;

    constructor(clientId: string, cryptoImpl: ICrypto, logger: Logger) {
        this.clientId = clientId;
        this.cryptoImpl = cryptoImpl;
        this.commonLogger = logger.clone(name, version);
    }

    /**
     * fetch the account entity from the platform cache
     *  @param accountKey
     */
    abstract getAccount(accountKey: string): AccountEntity | null;

    /**
     * set account entity in the platform cache
     * @param account
     */
    abstract setAccount(account: AccountEntity): void;

    /**
     * fetch the idToken entity from the platform cache
     * @param idTokenKey
     */
    abstract getIdTokenCredential(idTokenKey: string): IdTokenEntity | null;

    /**
     * set idToken entity to the platform cache
     * @param idToken
     */
    abstract setIdTokenCredential(idToken: IdTokenEntity): void;

    /**
     * fetch the idToken entity from the platform cache
     * @param accessTokenKey
     */
    abstract getAccessTokenCredential(
        accessTokenKey: string
    ): AccessTokenEntity | null;

    /**
     * set idToken entity to the platform cache
     * @param accessToken
     */
    abstract setAccessTokenCredential(accessToken: AccessTokenEntity): void;

    /**
     * fetch the idToken entity from the platform cache
     * @param refreshTokenKey
     */
    abstract getRefreshTokenCredential(
        refreshTokenKey: string
    ): RefreshTokenEntity | null;

    /**
     * set idToken entity to the platform cache
     * @param refreshToken
     */
    abstract setRefreshTokenCredential(refreshToken: RefreshTokenEntity): void;

    /**
     * fetch appMetadata entity from the platform cache
     * @param appMetadataKey
     */
    abstract getAppMetadata(appMetadataKey: string): AppMetadataEntity | null;

    /**
     * set appMetadata entity to the platform cache
     * @param appMetadata
     */
    abstract setAppMetadata(appMetadata: AppMetadataEntity): void;

    /**
     * fetch server telemetry entity from the platform cache
     * @param serverTelemetryKey
     */
    abstract getServerTelemetry(
        serverTelemetryKey: string
    ): ServerTelemetryEntity | null;

    /**
     * set server telemetry entity to the platform cache
     * @param serverTelemetryKey
     * @param serverTelemetry
     */
    abstract setServerTelemetry(
        serverTelemetryKey: string,
        serverTelemetry: ServerTelemetryEntity
    ): void;

    /**
     * fetch cloud discovery metadata entity from the platform cache
     * @param key
     */
    abstract getAuthorityMetadata(key: string): AuthorityMetadataEntity | null;

    /**
     *
     */
    abstract getAuthorityMetadataKeys(): Array<string>;

    /**
     * set cloud discovery metadata entity to the platform cache
     * @param key
     * @param value
     */
    abstract setAuthorityMetadata(
        key: string,
        value: AuthorityMetadataEntity
    ): void;

    /**
     * fetch throttling entity from the platform cache
     * @param throttlingCacheKey
     */
    abstract getThrottlingCache(
        throttlingCacheKey: string
    ): ThrottlingEntity | null;

    /**
     * set throttling entity to the platform cache
     * @param throttlingCacheKey
     * @param throttlingCache
     */
    abstract setThrottlingCache(
        throttlingCacheKey: string,
        throttlingCache: ThrottlingEntity
    ): void;

    /**
     * Function to remove an item from cache given its key.
     * @param key
     */
    abstract removeItem(key: string): void;

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
     * Function which retrieves all account keys from the cache
     */
    abstract getAccountKeys(): string[];

    /**
     * Function which retrieves all token keys from the cache
     */
    abstract getTokenKeys(): TokenKeys;

    /**
     * Function which clears cache.
     */
    abstract clear(): Promise<void>;

    /**
     * Function which updates an outdated credential cache key
     */
    abstract updateCredentialCacheKey(
        currentCacheKey: string,
        credential: ValidCredentialType
    ): string;

    /**
     * Returns all accounts in cache
     */
    getAllAccounts(): AccountInfo[] {
        const allAccountKeys = this.getAccountKeys();
        if (allAccountKeys.length < 1) {
            return [];
        }

        const accountEntities: AccountEntity[] = allAccountKeys.reduce(
            (accounts: AccountEntity[], key: string) => {
                const entity: AccountEntity | null = this.getAccount(key);

                if (!entity) {
                    return accounts;
                }
                accounts.push(entity);
                return accounts;
            },
            []
        );

        if (accountEntities.length < 1) {
            return [];
        } else {
            const allAccounts = accountEntities.map<AccountInfo>(
                (accountEntity) => {
                    return this.getAccountInfoFromEntity(accountEntity);
                }
            );
            return allAccounts;
        }
    }

    /**
     * Gets accountInfo object based on provided filters
     */
    getAccountInfoFilteredBy(accountFilter: AccountFilter): AccountInfo | null {
        const allAccounts = this.getAccountsFilteredBy(accountFilter);
        if (allAccounts.length > 0) {
            return this.getAccountInfoFromEntity(allAccounts[0]);
        } else {
            return null;
        }
    }

    private getAccountInfoFromEntity(
        accountEntity: AccountEntity
    ): AccountInfo {
        const accountInfo = accountEntity.getAccountInfo();
        const idToken = this.getIdToken(accountInfo);
        if (idToken) {
            accountInfo.idToken = idToken.secret;
            accountInfo.idTokenClaims = extractTokenClaims(
                idToken.secret,
                this.cryptoImpl.base64Decode
            );
        }
        return accountInfo;
    }

    /**
     * saves a cache record
     * @param cacheRecord
     */
    async saveCacheRecord(
        cacheRecord: CacheRecord,
        storeInCache?: StoreInCache
    ): Promise<void> {
        if (!cacheRecord) {
            throw ClientAuthError.createNullOrUndefinedCacheRecord();
        }

        if (!!cacheRecord.account) {
            this.setAccount(cacheRecord.account);
        }

        if (!!cacheRecord.idToken && storeInCache?.idToken !== false) {
            this.setIdTokenCredential(cacheRecord.idToken);
        }

        if (!!cacheRecord.accessToken && storeInCache?.accessToken !== false) {
            await this.saveAccessToken(cacheRecord.accessToken);
        }

        if (
            !!cacheRecord.refreshToken &&
            storeInCache?.refreshToken !== false
        ) {
            this.setRefreshTokenCredential(cacheRecord.refreshToken);
        }

        if (!!cacheRecord.appMetadata) {
            this.setAppMetadata(cacheRecord.appMetadata);
        }
    }

    /**
     * saves access token credential
     * @param credential
     */
    private async saveAccessToken(
        credential: AccessTokenEntity
    ): Promise<void> {
        const accessTokenFilter: CredentialFilter = {
            clientId: credential.clientId,
            credentialType: credential.credentialType,
            environment: credential.environment,
            homeAccountId: credential.homeAccountId,
            realm: credential.realm,
            tokenType: credential.tokenType,
            requestedClaimsHash: credential.requestedClaimsHash,
        };

        const tokenKeys = this.getTokenKeys();
        const currentScopes = ScopeSet.fromString(credential.target);

        const removedAccessTokens: Array<Promise<void>> = [];
        tokenKeys.accessToken.forEach((key) => {
            if (
                !this.accessTokenKeyMatchesFilter(key, accessTokenFilter, false)
            ) {
                return;
            }

            const tokenEntity = this.getAccessTokenCredential(key);

            if (
                tokenEntity &&
                this.credentialMatchesFilter(tokenEntity, accessTokenFilter)
            ) {
                const tokenScopeSet = ScopeSet.fromString(tokenEntity.target);
                if (tokenScopeSet.intersectingScopeSets(currentScopes)) {
                    removedAccessTokens.push(this.removeAccessToken(key));
                }
            }
        });
        await Promise.all(removedAccessTokens);
        this.setAccessTokenCredential(credential);
    }

    /**
     * retrieve accounts matching all provided filters; if no filter is set, get all accounts
     * not checking for casing as keys are all generated in lower case, remember to convert to lower case if object properties are compared
     * @param homeAccountId
     * @param environment
     * @param realm
     */
    getAccountsFilteredBy(accountFilter: AccountFilter): AccountEntity[] {
        const allAccountKeys = this.getAccountKeys();
        const matchingAccounts: AccountEntity[] = [];

        allAccountKeys.forEach((cacheKey) => {
            if (
                !this.isAccountKey(
                    cacheKey,
                    accountFilter.homeAccountId,
                    accountFilter.realm
                )
            ) {
                // Don't parse value if the key doesn't match the account filters
                return;
            }

            const entity: AccountEntity | null = this.getAccount(cacheKey);

            if (!entity) {
                return;
            }

            if (
                !!accountFilter.homeAccountId &&
                !this.matchHomeAccountId(entity, accountFilter.homeAccountId)
            ) {
                return;
            }

            if (
                !!accountFilter.localAccountId &&
                !this.matchLocalAccountId(entity, accountFilter.localAccountId)
            ) {
                return;
            }

            if (
                !!accountFilter.username &&
                !this.matchUsername(entity, accountFilter.username)
            ) {
                return;
            }

            if (
                !!accountFilter.environment &&
                !this.matchEnvironment(entity, accountFilter.environment)
            ) {
                return;
            }

            if (
                !!accountFilter.realm &&
                !this.matchRealm(entity, accountFilter.realm)
            ) {
                return;
            }

            if (
                !!accountFilter.nativeAccountId &&
                !this.matchNativeAccountId(
                    entity,
                    accountFilter.nativeAccountId
                )
            ) {
                return;
            }

            matchingAccounts.push(entity);
        });

        return matchingAccounts;
    }

    /**
     * Returns true if the given key matches our account key schema. Also matches homeAccountId and/or tenantId if provided
     * @param key
     * @param homeAccountId
     * @param tenantId
     * @returns
     */
    isAccountKey(
        key: string,
        homeAccountId?: string,
        tenantId?: string
    ): boolean {
        if (key.split(Separators.CACHE_KEY_SEPARATOR).length < 3) {
            // Account cache keys contain 3 items separated by '-' (each item may also contain '-')
            return false;
        }

        if (
            homeAccountId &&
            !key.toLowerCase().includes(homeAccountId.toLowerCase())
        ) {
            return false;
        }

        if (tenantId && !key.toLowerCase().includes(tenantId.toLowerCase())) {
            return false;
        }

        // Do not check environment as aliasing can cause false negatives

        return true;
    }

    /**
     * Returns true if the given key matches our credential key schema.
     * @param key
     */
    isCredentialKey(key: string): boolean {
        if (key.split(Separators.CACHE_KEY_SEPARATOR).length < 6) {
            // Credential cache keys contain 6 items separated by '-' (each item may also contain '-')
            return false;
        }

        const lowerCaseKey = key.toLowerCase();
        // Credential keys must indicate what credential type they represent
        if (
            lowerCaseKey.indexOf(CredentialType.ID_TOKEN.toLowerCase()) ===
                -1 &&
            lowerCaseKey.indexOf(CredentialType.ACCESS_TOKEN.toLowerCase()) ===
                -1 &&
            lowerCaseKey.indexOf(
                CredentialType.ACCESS_TOKEN_WITH_AUTH_SCHEME.toLowerCase()
            ) === -1 &&
            lowerCaseKey.indexOf(CredentialType.REFRESH_TOKEN.toLowerCase()) ===
                -1
        ) {
            return false;
        }

        if (
            lowerCaseKey.indexOf(CredentialType.REFRESH_TOKEN.toLowerCase()) >
            -1
        ) {
            // Refresh tokens must contain the client id or family id
            const clientIdValidation = `${CredentialType.REFRESH_TOKEN}${Separators.CACHE_KEY_SEPARATOR}${this.clientId}${Separators.CACHE_KEY_SEPARATOR}`;
            const familyIdValidation = `${CredentialType.REFRESH_TOKEN}${Separators.CACHE_KEY_SEPARATOR}${THE_FAMILY_ID}${Separators.CACHE_KEY_SEPARATOR}`;
            if (
                lowerCaseKey.indexOf(clientIdValidation.toLowerCase()) === -1 &&
                lowerCaseKey.indexOf(familyIdValidation.toLowerCase()) === -1
            ) {
                return false;
            }
        } else if (lowerCaseKey.indexOf(this.clientId.toLowerCase()) === -1) {
            // Tokens must contain the clientId
            return false;
        }

        return true;
    }

    /**
     * Returns whether or not the given credential entity matches the filter
     * @param entity
     * @param filter
     * @returns
     */
    credentialMatchesFilter(
        entity: ValidCredentialType,
        filter: CredentialFilter
    ): boolean {
        if (!!filter.clientId && !this.matchClientId(entity, filter.clientId)) {
            return false;
        }

        if (
            !!filter.userAssertionHash &&
            !this.matchUserAssertionHash(entity, filter.userAssertionHash)
        ) {
            return false;
        }

        /*
         * homeAccountId can be undefined, and we want to filter out cached items that have a homeAccountId of ""
         * because we don't want a client_credential request to return a cached token that has a homeAccountId
         */
        if (
            typeof filter.homeAccountId === "string" &&
            !this.matchHomeAccountId(entity, filter.homeAccountId)
        ) {
            return false;
        }

        if (
            !!filter.environment &&
            !this.matchEnvironment(entity, filter.environment)
        ) {
            return false;
        }

        if (!!filter.realm && !this.matchRealm(entity, filter.realm)) {
            return false;
        }

        if (
            !!filter.credentialType &&
            !this.matchCredentialType(entity, filter.credentialType)
        ) {
            return false;
        }

        if (!!filter.familyId && !this.matchFamilyId(entity, filter.familyId)) {
            return false;
        }

        /*
         * idTokens do not have "target", target specific refreshTokens do exist for some types of authentication
         * Resource specific refresh tokens case will be added when the support is deemed necessary
         */
        if (!!filter.target && !this.matchTarget(entity, filter.target)) {
            return false;
        }

        // If request OR cached entity has requested Claims Hash, check if they match
        if (filter.requestedClaimsHash || entity.requestedClaimsHash) {
            // Don't match if either is undefined or they are different
            if (entity.requestedClaimsHash !== filter.requestedClaimsHash) {
                return false;
            }
        }

        // Access Token with Auth Scheme specific matching
        if (
            entity.credentialType ===
            CredentialType.ACCESS_TOKEN_WITH_AUTH_SCHEME
        ) {
            if (
                !!filter.tokenType &&
                !this.matchTokenType(entity, filter.tokenType)
            ) {
                return false;
            }

            // KeyId (sshKid) in request must match cached SSH certificate keyId because SSH cert is bound to a specific key
            if (filter.tokenType === AuthenticationScheme.SSH) {
                if (filter.keyId && !this.matchKeyId(entity, filter.keyId)) {
                    return false;
                }
            }
        }

        return true;
    }

    /**
     * retrieve appMetadata matching all provided filters; if no filter is set, get all appMetadata
     * @param filter
     */
    getAppMetadataFilteredBy(filter: AppMetadataFilter): AppMetadataCache {
        return this.getAppMetadataFilteredByInternal(
            filter.environment,
            filter.clientId
        );
    }

    /**
     * Support function to help match appMetadata
     * @param environment
     * @param clientId
     */
    private getAppMetadataFilteredByInternal(
        environment?: string,
        clientId?: string
    ): AppMetadataCache {
        const allCacheKeys = this.getKeys();
        const matchingAppMetadata: AppMetadataCache = {};

        allCacheKeys.forEach((cacheKey) => {
            // don't parse any non-appMetadata type cache entities
            if (!this.isAppMetadata(cacheKey)) {
                return;
            }

            // Attempt retrieval
            const entity = this.getAppMetadata(cacheKey);

            if (!entity) {
                return;
            }

            if (!!environment && !this.matchEnvironment(entity, environment)) {
                return;
            }

            if (!!clientId && !this.matchClientId(entity, clientId)) {
                return;
            }

            matchingAppMetadata[cacheKey] = entity;
        });

        return matchingAppMetadata;
    }

    /**
     * retrieve authorityMetadata that contains a matching alias
     * @param filter
     */
    getAuthorityMetadataByAlias(host: string): AuthorityMetadataEntity | null {
        const allCacheKeys = this.getAuthorityMetadataKeys();
        let matchedEntity = null;

        allCacheKeys.forEach((cacheKey) => {
            // don't parse any non-authorityMetadata type cache entities
            if (
                !this.isAuthorityMetadata(cacheKey) ||
                cacheKey.indexOf(this.clientId) === -1
            ) {
                return;
            }

            // Attempt retrieval
            const entity = this.getAuthorityMetadata(cacheKey);

            if (!entity) {
                return;
            }

            if (entity.aliases.indexOf(host) === -1) {
                return;
            }

            matchedEntity = entity;
        });

        return matchedEntity;
    }

    /**
     * Removes all accounts and related tokens from cache.
     */
    async removeAllAccounts(): Promise<void> {
        const allAccountKeys = this.getAccountKeys();
        const removedAccounts: Array<Promise<void>> = [];

        allAccountKeys.forEach((cacheKey) => {
            removedAccounts.push(this.removeAccount(cacheKey));
        });

        await Promise.all(removedAccounts);
    }

    /**
     * Removes the account and related tokens for a given account key
     * @param account
     */
    async removeAccount(accountKey: string): Promise<void> {
        const account = this.getAccount(accountKey);
        if (!account) {
            return;
        }
        await this.removeAccountContext(account);
        this.removeItem(accountKey);
    }

    /**
     * Removes credentials associated with the provided account
     * @param account
     */
    async removeAccountContext(account: AccountEntity): Promise<void> {
        const allTokenKeys = this.getTokenKeys();
        const accountId = account.generateAccountId();
        const removedCredentials: Array<Promise<void>> = [];

        allTokenKeys.idToken.forEach((key) => {
            if (key.indexOf(accountId) === 0) {
                this.removeIdToken(key);
            }
        });

        allTokenKeys.accessToken.forEach((key) => {
            if (key.indexOf(accountId) === 0) {
                removedCredentials.push(this.removeAccessToken(key));
            }
        });

        allTokenKeys.refreshToken.forEach((key) => {
            if (key.indexOf(accountId) === 0) {
                this.removeRefreshToken(key);
            }
        });

        await Promise.all(removedCredentials);
    }

    /**
     * returns a boolean if the given credential is removed
     * @param credential
     */
    async removeAccessToken(key: string): Promise<void> {
        const credential = this.getAccessTokenCredential(key);
        if (!credential) {
            return;
        }

        // Remove Token Binding Key from key store for PoP Tokens Credentials
        if (
            credential.credentialType.toLowerCase() ===
            CredentialType.ACCESS_TOKEN_WITH_AUTH_SCHEME.toLowerCase()
        ) {
            if (credential.tokenType === AuthenticationScheme.POP) {
                const accessTokenWithAuthSchemeEntity =
                    credential as AccessTokenEntity;
                const kid = accessTokenWithAuthSchemeEntity.keyId;

                if (kid) {
                    try {
                        await this.cryptoImpl.removeTokenBindingKey(kid);
                    } catch (error) {
                        throw ClientAuthError.createBindingKeyNotRemovedError();
                    }
                }
            }
        }

        return this.removeItem(key);
    }

    /**
     * Removes all app metadata objects from cache.
     */
    removeAppMetadata(): boolean {
        const allCacheKeys = this.getKeys();
        allCacheKeys.forEach((cacheKey) => {
            if (this.isAppMetadata(cacheKey)) {
                this.removeItem(cacheKey);
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
     * @param authScheme
     */
    readCacheRecord(
        account: AccountInfo,
        request: BaseAuthRequest,
        environment: string
    ): CacheRecord {
        const tokenKeys = this.getTokenKeys();
        const cachedAccount = this.readAccountFromCache(account);
        const cachedIdToken = this.getIdToken(account, tokenKeys);
        const cachedAccessToken = this.getAccessToken(
            account,
            request,
            tokenKeys
        );
        const cachedRefreshToken = this.getRefreshToken(
            account,
            false,
            tokenKeys
        );
        const cachedAppMetadata = this.readAppMetadataFromCache(environment);

        if (cachedAccount && cachedIdToken) {
            cachedAccount.idTokenClaims = extractTokenClaims(
                cachedIdToken.secret,
                this.cryptoImpl.base64Decode
            );
        }

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
        const accountKey: string =
            AccountEntity.generateAccountCacheKey(account);
        return this.getAccount(accountKey);
    }

    /**
     * Retrieve IdTokenEntity from cache
     * @param clientId
     * @param account
     * @param inputRealm
     */
    getIdToken(
        account: AccountInfo,
        tokenKeys?: TokenKeys
    ): IdTokenEntity | null {
        this.commonLogger.trace("CacheManager - getIdToken called");
        const idTokenFilter: CredentialFilter = {
            homeAccountId: account.homeAccountId,
            environment: account.environment,
            credentialType: CredentialType.ID_TOKEN,
            clientId: this.clientId,
            realm: account.tenantId,
        };

        const idTokens: IdTokenEntity[] = this.getIdTokensByFilter(
            idTokenFilter,
            tokenKeys
        );
        const numIdTokens = idTokens.length;

        if (numIdTokens < 1) {
            this.commonLogger.info("CacheManager:getIdToken - No token found");
            return null;
        } else if (numIdTokens > 1) {
            this.commonLogger.info(
                "CacheManager:getIdToken - Multiple id tokens found, clearing them"
            );
            idTokens.forEach((idToken) => {
                this.removeIdToken(idToken.generateCredentialKey());
            });
            return null;
        }

        this.commonLogger.info("CacheManager:getIdToken - Returning id token");
        return idTokens[0];
    }

    /**
     * Gets all idTokens matching the given filter
     * @param filter
     * @returns
     */
    getIdTokensByFilter(
        filter: CredentialFilter,
        tokenKeys?: TokenKeys
    ): IdTokenEntity[] {
        const idTokenKeys =
            (tokenKeys && tokenKeys.idToken) || this.getTokenKeys().idToken;

        const idTokens: IdTokenEntity[] = [];
        idTokenKeys.forEach((key) => {
            if (
                !this.idTokenKeyMatchesFilter(key, {
                    clientId: this.clientId,
                    ...filter,
                })
            ) {
                return;
            }

            const idToken = this.getIdTokenCredential(key);
            if (idToken && this.credentialMatchesFilter(idToken, filter)) {
                idTokens.push(idToken);
            }
        });

        return idTokens;
    }

    /**
     * Validate the cache key against filter before retrieving and parsing cache value
     * @param key
     * @param filter
     * @returns
     */
    idTokenKeyMatchesFilter(
        inputKey: string,
        filter: CredentialFilter
    ): boolean {
        const key = inputKey.toLowerCase();
        if (
            filter.clientId &&
            key.indexOf(filter.clientId.toLowerCase()) === -1
        ) {
            return false;
        }

        if (
            filter.homeAccountId &&
            key.indexOf(filter.homeAccountId.toLowerCase()) === -1
        ) {
            return false;
        }

        return true;
    }

    /**
     * Removes idToken from the cache
     * @param key
     */
    removeIdToken(key: string): void {
        this.removeItem(key);
    }

    /**
     * Removes refresh token from the cache
     * @param key
     */
    removeRefreshToken(key: string): void {
        this.removeItem(key);
    }

    /**
     * Retrieve AccessTokenEntity from cache
     * @param clientId
     * @param account
     * @param scopes
     * @param authScheme
     */
    getAccessToken(
        account: AccountInfo,
        request: BaseAuthRequest,
        tokenKeys?: TokenKeys
    ): AccessTokenEntity | null {
        this.commonLogger.trace("CacheManager - getAccessToken called");
        const scopes = ScopeSet.createSearchScopes(request.scopes);
        const authScheme =
            request.authenticationScheme || AuthenticationScheme.BEARER;
        /*
         * Distinguish between Bearer and PoP/SSH token cache types
         * Cast to lowercase to handle "bearer" from ADFS
         */
        const credentialType =
            authScheme &&
            authScheme.toLowerCase() !==
                AuthenticationScheme.BEARER.toLowerCase()
                ? CredentialType.ACCESS_TOKEN_WITH_AUTH_SCHEME
                : CredentialType.ACCESS_TOKEN;

        const accessTokenFilter: CredentialFilter = {
            homeAccountId: account.homeAccountId,
            environment: account.environment,
            credentialType: credentialType,
            clientId: this.clientId,
            realm: account.tenantId,
            target: scopes,
            tokenType: authScheme,
            keyId: request.sshKid,
            requestedClaimsHash: request.requestedClaimsHash,
        };

        const accessTokenKeys =
            (tokenKeys && tokenKeys.accessToken) ||
            this.getTokenKeys().accessToken;
        const accessTokens: AccessTokenEntity[] = [];

        accessTokenKeys.forEach((key) => {
            // Validate key
            if (
                this.accessTokenKeyMatchesFilter(key, accessTokenFilter, true)
            ) {
                const accessToken = this.getAccessTokenCredential(key);

                // Validate value
                if (
                    accessToken &&
                    this.credentialMatchesFilter(accessToken, accessTokenFilter)
                ) {
                    accessTokens.push(accessToken);
                }
            }
        });

        const numAccessTokens = accessTokens.length;
        if (numAccessTokens < 1) {
            this.commonLogger.info(
                "CacheManager:getAccessToken - No token found"
            );
            return null;
        } else if (numAccessTokens > 1) {
            this.commonLogger.info(
                "CacheManager:getAccessToken - Multiple access tokens found, clearing them"
            );
            accessTokens.forEach((accessToken) => {
                void this.removeAccessToken(
                    accessToken.generateCredentialKey()
                );
            });
            return null;
        }

        this.commonLogger.info(
            "CacheManager:getAccessToken - Returning access token"
        );
        return accessTokens[0];
    }

    /**
     * Validate the cache key against filter before retrieving and parsing cache value
     * @param key
     * @param filter
     * @param keyMustContainAllScopes
     * @returns
     */
    accessTokenKeyMatchesFilter(
        inputKey: string,
        filter: CredentialFilter,
        keyMustContainAllScopes: boolean
    ): boolean {
        const key = inputKey.toLowerCase();
        if (
            filter.clientId &&
            key.indexOf(filter.clientId.toLowerCase()) === -1
        ) {
            return false;
        }

        if (
            filter.homeAccountId &&
            key.indexOf(filter.homeAccountId.toLowerCase()) === -1
        ) {
            return false;
        }

        if (filter.realm && key.indexOf(filter.realm.toLowerCase()) === -1) {
            return false;
        }

        if (
            filter.requestedClaimsHash &&
            key.indexOf(filter.requestedClaimsHash.toLowerCase()) === -1
        ) {
            return false;
        }

        if (filter.target) {
            const scopes = filter.target.asArray();
            for (let i = 0; i < scopes.length; i++) {
                if (
                    keyMustContainAllScopes &&
                    !key.includes(scopes[i].toLowerCase())
                ) {
                    // When performing a cache lookup a missing scope would be a cache miss
                    return false;
                } else if (
                    !keyMustContainAllScopes &&
                    key.includes(scopes[i].toLowerCase())
                ) {
                    // When performing a cache write, any token with a subset of requested scopes should be replaced
                    return true;
                }
            }
        }

        return true;
    }

    /**
     * Gets all access tokens matching the filter
     * @param filter
     * @returns
     */
    getAccessTokensByFilter(filter: CredentialFilter): AccessTokenEntity[] {
        const tokenKeys = this.getTokenKeys();

        const accessTokens: AccessTokenEntity[] = [];
        tokenKeys.accessToken.forEach((key) => {
            if (!this.accessTokenKeyMatchesFilter(key, filter, true)) {
                return;
            }

            const accessToken = this.getAccessTokenCredential(key);
            if (
                accessToken &&
                this.credentialMatchesFilter(accessToken, filter)
            ) {
                accessTokens.push(accessToken);
            }
        });

        return accessTokens;
    }

    /**
     * Helper to retrieve the appropriate refresh token from cache
     * @param clientId
     * @param account
     * @param familyRT
     */
    getRefreshToken(
        account: AccountInfo,
        familyRT: boolean,
        tokenKeys?: TokenKeys
    ): RefreshTokenEntity | null {
        this.commonLogger.trace("CacheManager - getRefreshToken called");
        const id = familyRT ? THE_FAMILY_ID : undefined;
        const refreshTokenFilter: CredentialFilter = {
            homeAccountId: account.homeAccountId,
            environment: account.environment,
            credentialType: CredentialType.REFRESH_TOKEN,
            clientId: this.clientId,
            familyId: id,
        };

        const refreshTokenKeys =
            (tokenKeys && tokenKeys.refreshToken) ||
            this.getTokenKeys().refreshToken;
        const refreshTokens: RefreshTokenEntity[] = [];

        refreshTokenKeys.forEach((key) => {
            // Validate key
            if (this.refreshTokenKeyMatchesFilter(key, refreshTokenFilter)) {
                const refreshToken = this.getRefreshTokenCredential(key);
                // Validate value
                if (
                    refreshToken &&
                    this.credentialMatchesFilter(
                        refreshToken,
                        refreshTokenFilter
                    )
                ) {
                    refreshTokens.push(refreshToken);
                }
            }
        });

        const numRefreshTokens = refreshTokens.length;
        if (numRefreshTokens < 1) {
            this.commonLogger.info(
                "CacheManager:getRefreshToken - No refresh token found."
            );
            return null;
        }
        // address the else case after remove functions address environment aliases

        this.commonLogger.info(
            "CacheManager:getRefreshToken - returning refresh token"
        );
        return refreshTokens[0] as RefreshTokenEntity;
    }

    /**
     * Validate the cache key against filter before retrieving and parsing cache value
     * @param key
     * @param filter
     */
    refreshTokenKeyMatchesFilter(
        inputKey: string,
        filter: CredentialFilter
    ): boolean {
        const key = inputKey.toLowerCase();
        if (
            filter.familyId &&
            key.indexOf(filter.familyId.toLowerCase()) === -1
        ) {
            return false;
        }

        // If familyId is used, clientId is not in the key
        if (
            !filter.familyId &&
            filter.clientId &&
            key.indexOf(filter.clientId.toLowerCase()) === -1
        ) {
            return false;
        }

        if (
            filter.homeAccountId &&
            key.indexOf(filter.homeAccountId.toLowerCase()) === -1
        ) {
            return false;
        }

        return true;
    }

    /**
     * Retrieve AppMetadataEntity from cache
     */
    readAppMetadataFromCache(environment: string): AppMetadataEntity | null {
        const appMetadataFilter: AppMetadataFilter = {
            environment,
            clientId: this.clientId,
        };

        const appMetadata: AppMetadataCache =
            this.getAppMetadataFilteredBy(appMetadataFilter);
        const appMetadataEntries: AppMetadataEntity[] = Object.keys(
            appMetadata
        ).map((key) => appMetadata[key]);

        const numAppMetadata = appMetadataEntries.length;
        if (numAppMetadata < 1) {
            return null;
        } else if (numAppMetadata > 1) {
            throw ClientAuthError.createMultipleMatchingAppMetadataInCacheError();
        }

        return appMetadataEntries[0] as AppMetadataEntity;
    }

    /**
     * Return the family_id value associated  with FOCI
     * @param environment
     * @param clientId
     */
    isAppMetadataFOCI(environment: string): boolean {
        const appMetadata = this.readAppMetadataFromCache(environment);
        return !!(appMetadata && appMetadata.familyId === THE_FAMILY_ID);
    }

    /**
     * helper to match account ids
     * @param value
     * @param homeAccountId
     */
    private matchHomeAccountId(
        entity: AccountEntity | CredentialEntity,
        homeAccountId: string
    ): boolean {
        return !!(
            typeof entity.homeAccountId === "string" &&
            homeAccountId === entity.homeAccountId
        );
    }

    /**
     * helper to match account ids
     * @param entity
     * @param localAccountId
     * @returns
     */
    private matchLocalAccountId(
        entity: AccountEntity,
        localAccountId: string
    ): boolean {
        return !!(
            typeof entity.localAccountId === "string" &&
            localAccountId === entity.localAccountId
        );
    }

    /**
     * helper to match usernames
     * @param entity
     * @param username
     * @returns
     */
    private matchUsername(entity: AccountEntity, username: string): boolean {
        return !!(
            typeof entity.username === "string" &&
            username.toLowerCase() === entity.username.toLowerCase()
        );
    }

    /**
     * helper to match assertion
     * @param value
     * @param oboAssertion
     */
    private matchUserAssertionHash(
        entity: CredentialEntity,
        userAssertionHash: string
    ): boolean {
        return !!(
            entity.userAssertionHash &&
            userAssertionHash === entity.userAssertionHash
        );
    }

    /**
     * helper to match environment
     * @param value
     * @param environment
     */
    private matchEnvironment(
        entity: AccountEntity | CredentialEntity | AppMetadataEntity,
        environment: string
    ): boolean {
        const cloudMetadata = this.getAuthorityMetadataByAlias(environment);
        if (
            cloudMetadata &&
            cloudMetadata.aliases.indexOf(entity.environment) > -1
        ) {
            return true;
        }

        return false;
    }

    /**
     * helper to match credential type
     * @param entity
     * @param credentialType
     */
    private matchCredentialType(
        entity: CredentialEntity,
        credentialType: string
    ): boolean {
        return (
            entity.credentialType &&
            credentialType.toLowerCase() === entity.credentialType.toLowerCase()
        );
    }

    /**
     * helper to match client ids
     * @param entity
     * @param clientId
     */
    private matchClientId(
        entity: CredentialEntity | AppMetadataEntity,
        clientId: string
    ): boolean {
        return !!(entity.clientId && clientId === entity.clientId);
    }

    /**
     * helper to match family ids
     * @param entity
     * @param familyId
     */
    private matchFamilyId(
        entity: CredentialEntity | AppMetadataEntity,
        familyId: string
    ): boolean {
        return !!(entity.familyId && familyId === entity.familyId);
    }

    /**
     * helper to match realm
     * @param entity
     * @param realm
     */
    private matchRealm(
        entity: AccountEntity | CredentialEntity,
        realm: string
    ): boolean {
        return !!(entity.realm && realm === entity.realm);
    }

    /**
     * helper to match nativeAccountId
     * @param entity
     * @param nativeAccountId
     * @returns boolean indicating the match result
     */
    private matchNativeAccountId(
        entity: AccountEntity,
        nativeAccountId: string
    ): boolean {
        return !!(
            entity.nativeAccountId && nativeAccountId === entity.nativeAccountId
        );
    }

    /**
     * Returns true if the target scopes are a subset of the current entity's scopes, false otherwise.
     * @param entity
     * @param target
     */
    private matchTarget(entity: CredentialEntity, target: ScopeSet): boolean {
        const isNotAccessTokenCredential =
            entity.credentialType !== CredentialType.ACCESS_TOKEN &&
            entity.credentialType !==
                CredentialType.ACCESS_TOKEN_WITH_AUTH_SCHEME;

        if (isNotAccessTokenCredential || !entity.target) {
            return false;
        }

        const entityScopeSet: ScopeSet = ScopeSet.fromString(entity.target);

        return entityScopeSet.containsScopeSet(target);
    }

    /**
     * Returns true if the credential's tokenType or Authentication Scheme matches the one in the request, false otherwise
     * @param entity
     * @param tokenType
     */
    private matchTokenType(
        entity: CredentialEntity,
        tokenType: AuthenticationScheme
    ): boolean {
        return !!(entity.tokenType && entity.tokenType === tokenType);
    }

    /**
     * Returns true if the credential's keyId matches the one in the request, false otherwise
     * @param entity
     * @param tokenType
     */
    private matchKeyId(entity: CredentialEntity, keyId: string): boolean {
        return !!(entity.keyId && entity.keyId === keyId);
    }

    /**
     * returns if a given cache entity is of the type appmetadata
     * @param key
     */
    private isAppMetadata(key: string): boolean {
        return key.indexOf(APP_METADATA) !== -1;
    }

    /**
     * returns if a given cache entity is of the type authoritymetadata
     * @param key
     */
    protected isAuthorityMetadata(key: string): boolean {
        return key.indexOf(AUTHORITY_METADATA_CONSTANTS.CACHE_KEY) !== -1;
    }

    /**
     * returns cache key used for cloud instance metadata
     */
    generateAuthorityMetadataCacheKey(authority: string): string {
        return `${AUTHORITY_METADATA_CONSTANTS.CACHE_KEY}-${this.clientId}-${authority}`;
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

/** @internal */
export class DefaultStorageClass extends CacheManager {
    setAccount(): void {
        const notImplErr =
            "Storage interface - setAccount() has not been implemented for the cacheStorage interface.";
        throw AuthError.createUnexpectedError(notImplErr);
    }
    getAccount(): AccountEntity {
        const notImplErr =
            "Storage interface - getAccount() has not been implemented for the cacheStorage interface.";
        throw AuthError.createUnexpectedError(notImplErr);
    }
    setIdTokenCredential(): void {
        const notImplErr =
            "Storage interface - setIdTokenCredential() has not been implemented for the cacheStorage interface.";
        throw AuthError.createUnexpectedError(notImplErr);
    }
    getIdTokenCredential(): IdTokenEntity {
        const notImplErr =
            "Storage interface - getIdTokenCredential() has not been implemented for the cacheStorage interface.";
        throw AuthError.createUnexpectedError(notImplErr);
    }
    setAccessTokenCredential(): void {
        const notImplErr =
            "Storage interface - setAccessTokenCredential() has not been implemented for the cacheStorage interface.";
        throw AuthError.createUnexpectedError(notImplErr);
    }
    getAccessTokenCredential(): AccessTokenEntity {
        const notImplErr =
            "Storage interface - getAccessTokenCredential() has not been implemented for the cacheStorage interface.";
        throw AuthError.createUnexpectedError(notImplErr);
    }
    setRefreshTokenCredential(): void {
        const notImplErr =
            "Storage interface - setRefreshTokenCredential() has not been implemented for the cacheStorage interface.";
        throw AuthError.createUnexpectedError(notImplErr);
    }
    getRefreshTokenCredential(): RefreshTokenEntity {
        const notImplErr =
            "Storage interface - getRefreshTokenCredential() has not been implemented for the cacheStorage interface.";
        throw AuthError.createUnexpectedError(notImplErr);
    }
    setAppMetadata(): void {
        const notImplErr =
            "Storage interface - setAppMetadata() has not been implemented for the cacheStorage interface.";
        throw AuthError.createUnexpectedError(notImplErr);
    }
    getAppMetadata(): AppMetadataEntity {
        const notImplErr =
            "Storage interface - getAppMetadata() has not been implemented for the cacheStorage interface.";
        throw AuthError.createUnexpectedError(notImplErr);
    }
    setServerTelemetry(): void {
        const notImplErr =
            "Storage interface - setServerTelemetry() has not been implemented for the cacheStorage interface.";
        throw AuthError.createUnexpectedError(notImplErr);
    }
    getServerTelemetry(): ServerTelemetryEntity {
        const notImplErr =
            "Storage interface - getServerTelemetry() has not been implemented for the cacheStorage interface.";
        throw AuthError.createUnexpectedError(notImplErr);
    }
    setAuthorityMetadata(): void {
        const notImplErr =
            "Storage interface - setAuthorityMetadata() has not been implemented for the cacheStorage interface.";
        throw AuthError.createUnexpectedError(notImplErr);
    }
    getAuthorityMetadata(): AuthorityMetadataEntity | null {
        const notImplErr =
            "Storage interface - getAuthorityMetadata() has not been implemented for the cacheStorage interface.";
        throw AuthError.createUnexpectedError(notImplErr);
    }
    getAuthorityMetadataKeys(): Array<string> {
        const notImplErr =
            "Storage interface - getAuthorityMetadataKeys() has not been implemented for the cacheStorage interface.";
        throw AuthError.createUnexpectedError(notImplErr);
    }
    setThrottlingCache(): void {
        const notImplErr =
            "Storage interface - setThrottlingCache() has not been implemented for the cacheStorage interface.";
        throw AuthError.createUnexpectedError(notImplErr);
    }
    getThrottlingCache(): ThrottlingEntity {
        const notImplErr =
            "Storage interface - getThrottlingCache() has not been implemented for the cacheStorage interface.";
        throw AuthError.createUnexpectedError(notImplErr);
    }
    removeItem(): boolean {
        const notImplErr =
            "Storage interface - removeItem() has not been implemented for the cacheStorage interface.";
        throw AuthError.createUnexpectedError(notImplErr);
    }
    containsKey(): boolean {
        const notImplErr =
            "Storage interface - containsKey() has not been implemented for the cacheStorage interface.";
        throw AuthError.createUnexpectedError(notImplErr);
    }
    getKeys(): string[] {
        const notImplErr =
            "Storage interface - getKeys() has not been implemented for the cacheStorage interface.";
        throw AuthError.createUnexpectedError(notImplErr);
    }
    getAccountKeys(): string[] {
        const notImplErr =
            "Storage interface - getAccountKeys() has not been implemented for the cacheStorage interface.";
        throw AuthError.createUnexpectedError(notImplErr);
    }
    getTokenKeys(): TokenKeys {
        const notImplErr =
            "Storage interface - getTokenKeys() has not been implemented for the cacheStorage interface.";
        throw AuthError.createUnexpectedError(notImplErr);
    }
    async clear(): Promise<void> {
        const notImplErr =
            "Storage interface - clear() has not been implemented for the cacheStorage interface.";
        throw AuthError.createUnexpectedError(notImplErr);
    }
    updateCredentialCacheKey(): string {
        const notImplErr =
            "Storage interface - updateCredentialCacheKey() has not been implemented for the cacheStorage interface.";
        throw AuthError.createUnexpectedError(notImplErr);
    }
}
