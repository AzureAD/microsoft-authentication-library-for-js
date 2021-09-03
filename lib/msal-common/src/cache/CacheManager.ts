/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AccountCache, AccountFilter, CredentialFilter, CredentialCache, ValidCredentialType, AppMetadataFilter, AppMetadataCache } from "./utils/CacheTypes";
import { CacheRecord } from "./entities/CacheRecord";
import { CacheSchemaType, CredentialType, Constants, APP_METADATA, THE_FAMILY_ID, AUTHORITY_METADATA_CONSTANTS, AuthenticationScheme } from "../utils/Constants";
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
import { AuthToken } from "../account/AuthToken";
import { ICrypto } from "../crypto/ICrypto";
import { AuthorityMetadataEntity } from "./entities/AuthorityMetadataEntity";

/**
 * Interface class which implement cache storage functions used by MSAL to perform validity checks, and store tokens.
 */
export abstract class CacheManager implements ICacheManager {
    protected clientId: string;
    protected cryptoImpl: ICrypto;

    constructor(clientId: string, cryptoImpl: ICrypto) {
        this.clientId = clientId;
        this.cryptoImpl = cryptoImpl;
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
    abstract getAccessTokenCredential(accessTokenKey: string): AccessTokenEntity | null;

    /**
     * set idToken entity to the platform cache
     * @param accessToken
     */
    abstract setAccessTokenCredential(accessToken: AccessTokenEntity): void;

    /**
     * fetch the idToken entity from the platform cache
     * @param refreshTokenKey
     */
    abstract getRefreshTokenCredential(refreshTokenKey: string): RefreshTokenEntity | null;

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
    abstract getServerTelemetry(serverTelemetryKey: string): ServerTelemetryEntity | null;

    /**
     * set server telemetry entity to the platform cache
     * @param serverTelemetryKey
     * @param serverTelemetry
     */
    abstract setServerTelemetry(serverTelemetryKey: string, serverTelemetry: ServerTelemetryEntity): void;

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
    abstract setAuthorityMetadata(key: string, value: AuthorityMetadataEntity): void;

    /**
     * fetch throttling entity from the platform cache
     * @param throttlingCacheKey
     */
    abstract getThrottlingCache(throttlingCacheKey: string): ThrottlingEntity | null;

    /**
     * set throttling entity to the platform cache
     * @param throttlingCacheKey
     * @param throttlingCache
     */
    abstract setThrottlingCache(throttlingCacheKey: string, throttlingCache: ThrottlingEntity): void;;

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
    abstract clear(): Promise<void>;

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
                const accountEntity = CacheManager.toObject<AccountEntity>(new AccountEntity(), value);
                const accountInfo = accountEntity.getAccountInfo();
                const idToken = this.readIdTokenFromCache(this.clientId, accountInfo);
                if (idToken && !accountInfo.idTokenClaims) {
                    accountInfo.idTokenClaims = new AuthToken(idToken.secret, this.cryptoImpl).claims;
                }

                return accountInfo;
                
            });
            return allAccounts;
        }
    }

    /**
     * saves a cache record
     * @param cacheRecord
     */
    async saveCacheRecord(cacheRecord: CacheRecord): Promise<void> {
        if (!cacheRecord) {
            throw ClientAuthError.createNullOrUndefinedCacheRecord();
        }

        if (!!cacheRecord.account) {
            this.setAccount(cacheRecord.account);
        }

        if (!!cacheRecord.idToken) {
            this.setIdTokenCredential(cacheRecord.idToken);
        }

        if (!!cacheRecord.accessToken) {
            await this.saveAccessToken(cacheRecord.accessToken);
        }

        if (!!cacheRecord.refreshToken) {
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
    private async saveAccessToken(credential: AccessTokenEntity): Promise<void> {
        const currentTokenCache = this.getCredentialsFilteredBy({
            clientId: credential.clientId,
            credentialType: credential.credentialType,
            environment: credential.environment,
            homeAccountId: credential.homeAccountId,
            realm: credential.realm,
            tokenType: credential.tokenType
        });

        const currentScopes = ScopeSet.fromString(credential.target);
        const currentAccessTokens: AccessTokenEntity[] = Object.keys(currentTokenCache.accessTokens).map(key => currentTokenCache.accessTokens[key]);

        if (currentAccessTokens) {
            const removedAccessTokens: Array<Promise<boolean>> = [];
            currentAccessTokens.forEach((tokenEntity) => {
                const tokenScopeSet = ScopeSet.fromString(tokenEntity.target);
                if (tokenScopeSet.intersectingScopeSets(currentScopes)) {
                    removedAccessTokens.push(this.removeCredential(tokenEntity));
                }
            });
            await Promise.all(removedAccessTokens);
        }
        this.setAccessTokenCredential(credential);
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
            const entity: AccountEntity | null = this.getAccount(cacheKey);

            if (!entity) {
                return;
            }

            if (!!homeAccountId && !this.matchHomeAccountId(entity, homeAccountId)) {
                return;
            }

            if (!!environment && !this.matchEnvironment(entity, environment)) {
                return;
            }

            if (!!realm && !this.matchRealm(entity, realm)) {
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
            filter.oboAssertion,
            filter.tokenType
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
     * @param oboAssertion
     * @param tokenType
     */
    private getCredentialsFilteredByInternal(
        homeAccountId?: string,
        environment?: string,
        credentialType?: string,
        clientId?: string,
        familyId?: string,
        realm?: string,
        target?: string,
        oboAssertion?: string,
        tokenType?: AuthenticationScheme
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
            const entity = this.getSpecificCredential(cacheKey, credType);

            if (!entity) {
                return;
            }

            if (!!oboAssertion && !this.matchOboAssertion(entity, oboAssertion)) {
                return;
            }

            if (!!homeAccountId && !this.matchHomeAccountId(entity, homeAccountId)) {
                return;
            }

            if (!!environment && !this.matchEnvironment(entity, environment)) {
                return;
            }

            if (!!realm && !this.matchRealm(entity, realm)) {
                return;
            }

            if (!!credentialType && !this.matchCredentialType(entity, credentialType)) {
                return;
            }

            if (!!clientId && !this.matchClientId(entity, clientId)) {
                return;
            }

            if (!!familyId && !this.matchFamilyId(entity, familyId)) {
                return;
            }

            /*
             * idTokens do not have "target", target specific refreshTokens do exist for some types of authentication
             * Resource specific refresh tokens case will be added when the support is deemed necessary
             */
            if (!!target && !this.matchTarget(entity, target)) {
                return;
            }

            if (credentialType === CredentialType.ACCESS_TOKEN_WITH_AUTH_SCHEME) {
                if(!!tokenType && !this.matchTokenType(entity, tokenType)) {
                    return;
                }

                // This check avoids matching outdated POP tokens that don't have the <-scheme> in the cache key
                if(cacheKey.indexOf(AuthenticationScheme.POP) === -1) {
                    // AccessToken_With_AuthScheme that doesn't have pop in the key is outdated
                    this.removeItem(cacheKey, CacheSchemaType.CREDENTIAL);
                    return;
                }
            }

            switch (credType) {
                case CredentialType.ID_TOKEN:
                    matchingCredentials.idTokens[cacheKey] = entity as IdTokenEntity;
                    break;
                case CredentialType.ACCESS_TOKEN:
                case CredentialType.ACCESS_TOKEN_WITH_AUTH_SCHEME:
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
     * retrieve appMetadata matching all provided filters; if no filter is set, get all appMetadata
     * @param filter
     */
    getAppMetadataFilteredBy(filter: AppMetadataFilter): AppMetadataCache {
        return this.getAppMetadataFilteredByInternal(
            filter.environment,
            filter.clientId,
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
            if (!this.isAuthorityMetadata(cacheKey) || cacheKey.indexOf(this.clientId) === -1) {
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
    async removeAllAccounts(): Promise<boolean> {
        const allCacheKeys = this.getKeys();
        const removedAccounts: Array<Promise<boolean>> = [];

        allCacheKeys.forEach((cacheKey) => {
            const entity = this.getAccount(cacheKey);
            if (!entity) {
                return;
            }
            removedAccounts.push(this.removeAccount(cacheKey));
        });
        
        await Promise.all(removedAccounts);
        return true;
    }

    /**
     * returns a boolean if the given account is removed
     * @param account
     */
    async removeAccount(accountKey: string): Promise<boolean> {
        const account = this.getAccount(accountKey);
        if (!account) {
            throw ClientAuthError.createNoAccountFoundError();
        }
        return (await this.removeAccountContext(account) && this.removeItem(accountKey, CacheSchemaType.ACCOUNT));
    }

    /**
     * returns a boolean if the given account is removed
     * @param account
     */
    async removeAccountContext(account: AccountEntity): Promise<boolean> {
        const allCacheKeys = this.getKeys();
        const accountId = account.generateAccountId();
        const removedCredentials: Array<Promise<boolean>> = [];

        allCacheKeys.forEach((cacheKey) => {
            // don't parse any non-credential type cache entities
            const credType = CredentialEntity.getCredentialType(cacheKey);
            if (credType === Constants.NOT_DEFINED) {
                return;
            }

            const cacheEntity = this.getSpecificCredential(cacheKey, credType);
            if (!!cacheEntity && accountId === cacheEntity.generateAccountId()) {
                removedCredentials.push(this.removeCredential(cacheEntity));
            }
        });

        await Promise.all(removedCredentials);
        return true;
    }

    /**
     * returns a boolean if the given credential is removed
     * @param credential
     */
    async removeCredential(credential: CredentialEntity): Promise<boolean> {
        const key = credential.generateCredentialKey();

        // Remove Token Binding Key from key store for Auth Scheme Credentials
        if (credential.credentialType.toLowerCase() === CredentialType.ACCESS_TOKEN_WITH_AUTH_SCHEME.toLowerCase()) {
            const accessTokenWithAuthSchemeEntity = credential as AccessTokenEntity;
            const kid = accessTokenWithAuthSchemeEntity.keyId;

            if (kid) {
                try {
                    await this.cryptoImpl.removeTokenBindingKey(kid);
                } catch (error) {
                    throw ClientAuthError.createBindingKeyNotRemovedError();
                }
            }
        }

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
     * @param authScheme
     */
    readCacheRecord(account: AccountInfo, clientId: string, scopes: ScopeSet, environment: string, authScheme: AuthenticationScheme): CacheRecord {
        const cachedAccount = this.readAccountFromCache(account);
        const cachedIdToken = this.readIdTokenFromCache(clientId, account);
        const cachedAccessToken = this.readAccessTokenFromCache(clientId, account, scopes, authScheme);
        const cachedRefreshToken = this.readRefreshTokenFromCache(clientId, account, false);
        const cachedAppMetadata = this.readAppMetadataFromCache(environment, clientId);

        if (cachedAccount && cachedIdToken) {
            cachedAccount.idTokenClaims = new AuthToken(cachedIdToken.secret, this.cryptoImpl).claims;
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
        const idTokenFilter: CredentialFilter = {
            homeAccountId: account.homeAccountId,
            environment: account.environment,
            credentialType: CredentialType.ID_TOKEN,
            clientId: clientId,
            realm: account.tenantId,
        };

        const credentialCache: CredentialCache = this.getCredentialsFilteredBy(idTokenFilter);
        const idTokens = Object.keys(credentialCache.idTokens).map((key) => credentialCache.idTokens[key]);
        const numIdTokens = idTokens.length;

        if (numIdTokens < 1) {
            return null;
        } else if (numIdTokens > 1) {
            throw ClientAuthError.createMultipleMatchingTokensInCacheError();
        }

        return idTokens[0] as IdTokenEntity;
    }

    /**
     * Retrieve AccessTokenEntity from cache
     * @param clientId
     * @param account
     * @param scopes
     * @param authScheme
     */
    readAccessTokenFromCache(clientId: string, account: AccountInfo, scopes: ScopeSet, authScheme: AuthenticationScheme): AccessTokenEntity | null {
        // Distinguish between Bearer and PoP token cache types
        const credentialType = (authScheme === AuthenticationScheme.POP) ? CredentialType.ACCESS_TOKEN_WITH_AUTH_SCHEME : CredentialType.ACCESS_TOKEN;

        const accessTokenFilter: CredentialFilter = {
            homeAccountId: account.homeAccountId,
            environment: account.environment,
            credentialType: credentialType,
            clientId,
            realm: account.tenantId,
            target: scopes.printScopesLowerCase(),
            tokenType: authScheme
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
        const id = familyRT ? THE_FAMILY_ID : undefined;
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
    readAppMetadataFromCache(environment: string, clientId: string): AppMetadataEntity | null {
        const appMetadataFilter: AppMetadataFilter = {
            environment,
            clientId,
        };

        const appMetadata: AppMetadataCache = this.getAppMetadataFilteredBy(appMetadataFilter);
        const appMetadataEntries: AppMetadataEntity[] = Object.keys(appMetadata).map((key) => appMetadata[key]);

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
    isAppMetadataFOCI(environment: string, clientId: string): boolean {
        const appMetadata = this.readAppMetadataFromCache(environment, clientId);
        return !!(appMetadata && appMetadata.familyId === THE_FAMILY_ID);
    }

    /**
     * helper to match account ids
     * @param value
     * @param homeAccountId
     */
    private matchHomeAccountId(entity: AccountEntity | CredentialEntity, homeAccountId: string): boolean {
        return !!(entity.homeAccountId && homeAccountId === entity.homeAccountId);
    }

    /**
     * helper to match assertion
     * @param value
     * @param oboAssertion
     */
    private matchOboAssertion(entity: AccountEntity | CredentialEntity, oboAssertion: string): boolean {
        return !!(entity.oboAssertion && oboAssertion === entity.oboAssertion);
    }

    /**
     * helper to match environment
     * @param value
     * @param environment
     */
    private matchEnvironment(entity: AccountEntity | CredentialEntity | AppMetadataEntity, environment: string): boolean {
        const cloudMetadata = this.getAuthorityMetadataByAlias(environment);
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
        return !!(entity.clientId && clientId === entity.clientId);
    }

    /**
     * helper to match family ids
     * @param entity
     * @param familyId
     */
    private matchFamilyId(entity: CredentialEntity | AppMetadataEntity, familyId: string): boolean {
        return !!(entity.familyId && familyId === entity.familyId);
    }

    /**
     * helper to match realm
     * @param entity
     * @param realm
     */
    private matchRealm(entity: AccountEntity | CredentialEntity, realm: string): boolean {
        return !!(entity.realm && realm === entity.realm);
    }

    /**
     * Returns true if the target scopes are a subset of the current entity's scopes, false otherwise.
     * @param entity
     * @param target
     */
    private matchTarget(entity: CredentialEntity, target: string): boolean {
        const isNotAccessTokenCredential = (entity.credentialType !== CredentialType.ACCESS_TOKEN && entity.credentialType !== CredentialType.ACCESS_TOKEN_WITH_AUTH_SCHEME);

        if ( isNotAccessTokenCredential || !entity.target) {
            return false;
        }

        const entityScopeSet: ScopeSet = ScopeSet.fromString(entity.target);
        const requestTargetScopeSet: ScopeSet = ScopeSet.fromString(target);

        if (!requestTargetScopeSet.containsOnlyOIDCScopes()) {
            requestTargetScopeSet.removeOIDCScopes(); // ignore OIDC scopes
        } else {
            requestTargetScopeSet.removeScope(Constants.OFFLINE_ACCESS_SCOPE);
        }
        return entityScopeSet.containsScopeSet(requestTargetScopeSet);
    }

    /**
     * Returns true if the credential's tokenType or Authentication Scheme matches the one in the request, false otherwise
     * @param entity 
     * @param tokenType 
     */
    private matchTokenType(entity: CredentialEntity, tokenType: AuthenticationScheme): boolean {
        return !!(entity.tokenType && entity.tokenType === tokenType);
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
     * Returns the specific credential (IdToken/AccessToken/RefreshToken) from the cache
     * @param key
     * @param credType
     */
    private getSpecificCredential(key: string, credType: string): ValidCredentialType | null {
        switch (credType) {
            case CredentialType.ID_TOKEN: {
                return this.getIdTokenCredential(key);
            }
            case CredentialType.ACCESS_TOKEN:
            case CredentialType.ACCESS_TOKEN_WITH_AUTH_SCHEME: {
                return this.getAccessTokenCredential(key);
            }
            case CredentialType.REFRESH_TOKEN: {
                return this.getRefreshTokenCredential(key);
            }
            default:
                return null;
        }
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
    setIdTokenCredential(): void {
        const notImplErr = "Storage interface - setIdTokenCredential() has not been implemented for the cacheStorage interface.";
        throw AuthError.createUnexpectedError(notImplErr);
    }
    getIdTokenCredential(): IdTokenEntity {
        const notImplErr = "Storage interface - getIdTokenCredential() has not been implemented for the cacheStorage interface.";
        throw AuthError.createUnexpectedError(notImplErr);
    }
    setAccessTokenCredential(): void {
        const notImplErr = "Storage interface - setAccessTokenCredential() has not been implemented for the cacheStorage interface.";
        throw AuthError.createUnexpectedError(notImplErr);
    }
    getAccessTokenCredential(): AccessTokenEntity {
        const notImplErr = "Storage interface - getAccessTokenCredential() has not been implemented for the cacheStorage interface.";
        throw AuthError.createUnexpectedError(notImplErr);
    }
    setRefreshTokenCredential(): void {
        const notImplErr = "Storage interface - setRefreshTokenCredential() has not been implemented for the cacheStorage interface.";
        throw AuthError.createUnexpectedError(notImplErr);
    }
    getRefreshTokenCredential(): RefreshTokenEntity {
        const notImplErr = "Storage interface - getRefreshTokenCredential() has not been implemented for the cacheStorage interface.";
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
    setAuthorityMetadata(): void {
        const notImplErr = "Storage interface - setAuthorityMetadata() has not been implemented for the cacheStorage interface.";
        throw AuthError.createUnexpectedError(notImplErr);
    }
    getAuthorityMetadata(): AuthorityMetadataEntity | null {
        const notImplErr = "Storage interface - getAuthorityMetadata() has not been implemented for the cacheStorage interface.";
        throw AuthError.createUnexpectedError(notImplErr);
    }
    getAuthorityMetadataKeys(): Array<string> {
        const notImplErr = "Storage interface - getAuthorityMetadataKeys() has not been implemented for the cacheStorage interface.";
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
    async clear(): Promise<void> {
        const notImplErr = "Storage interface - clear() has not been implemented for the cacheStorage interface.";
        throw AuthError.createUnexpectedError(notImplErr);
    }
}
