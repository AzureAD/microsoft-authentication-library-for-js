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
    TenantProfileFilter,
} from "./utils/CacheTypes.js";
import { CacheRecord } from "./entities/CacheRecord.js";
import {
    CredentialType,
    APP_METADATA,
    THE_FAMILY_ID,
    AUTHORITY_METADATA_CONSTANTS,
    AuthenticationScheme,
    Separators,
} from "../utils/Constants.js";
import { CredentialEntity } from "./entities/CredentialEntity.js";
import { generateCredentialKey } from "./utils/CacheHelpers.js";
import { ScopeSet } from "../request/ScopeSet.js";
import { AccountEntity } from "./entities/AccountEntity.js";
import { AccessTokenEntity } from "./entities/AccessTokenEntity.js";
import { IdTokenEntity } from "./entities/IdTokenEntity.js";
import { RefreshTokenEntity } from "./entities/RefreshTokenEntity.js";
import {
    createClientAuthError,
    ClientAuthErrorCodes,
} from "../error/ClientAuthError.js";
import {
    AccountInfo,
    TenantProfile,
    updateAccountTenantProfileData,
} from "../account/AccountInfo.js";
import { AppMetadataEntity } from "./entities/AppMetadataEntity.js";
import { ServerTelemetryEntity } from "./entities/ServerTelemetryEntity.js";
import { ThrottlingEntity } from "./entities/ThrottlingEntity.js";
import { extractTokenClaims } from "../account/AuthToken.js";
import { ICrypto } from "../crypto/ICrypto.js";
import { AuthorityMetadataEntity } from "./entities/AuthorityMetadataEntity.js";
import { BaseAuthRequest } from "../request/BaseAuthRequest.js";
import { Logger } from "../logger/Logger.js";
import { name, version } from "../packageMetadata.js";
import { StoreInCache } from "../request/StoreInCache.js";
import { getAliasesFromStaticSources } from "../authority/AuthorityMetadata.js";
import { StaticAuthorityOptions } from "../authority/AuthorityOptions.js";
import { TokenClaims } from "../account/TokenClaims.js";
import { IPerformanceClient } from "../telemetry/performance/IPerformanceClient.js";
import { CacheError, CacheErrorCodes } from "../error/CacheError.js";

/**
 * Interface class which implement cache storage functions used by MSAL to perform validity checks, and store tokens.
 * @internal
 */
export abstract class AsyncCacheManager {
    protected clientId: string;
    protected cryptoImpl: ICrypto;
    // Instance of logger for functions defined in the msal-common layer
    private commonLogger: Logger;
    private staticAuthorityOptions?: StaticAuthorityOptions;

    constructor(
        clientId: string,
        cryptoImpl: ICrypto,
        logger: Logger,
        staticAuthorityOptions?: StaticAuthorityOptions
    ) {
        this.clientId = clientId;
        this.cryptoImpl = cryptoImpl;
        this.commonLogger = logger.clone(name, version);
        this.staticAuthorityOptions = staticAuthorityOptions;
    }

    /**
     * fetch the account entity from the platform cache
     *  @param accountKey
     */
    abstract getAccount(
        accountKey: string,
        logger?: Logger
    ): Promise<AccountEntity | null>;

    /**
     * set account entity in the platform cache
     * @param account
     * @param correlationId
     */
    abstract setAccount(
        account: AccountEntity,
        correlationId: string
    ): Promise<void>;

    /**
     * fetch the idToken entity from the platform cache
     * @param idTokenKey
     */
    abstract getIdTokenCredential(idTokenKey: string): Promise<IdTokenEntity | null>;

    /**
     * set idToken entity to the platform cache
     * @param idToken
     * @param correlationId
     */
    abstract setIdTokenCredential(
        idToken: IdTokenEntity,
        correlationId: string
    ): Promise<void>;

    /**
     * fetch the idToken entity from the platform cache
     * @param accessTokenKey
     */
    abstract getAccessTokenCredential(
        accessTokenKey: string
    ): Promise<AccessTokenEntity | null>;

    /**
     * set accessToken entity to the platform cache
     * @param accessToken
     * @param correlationId
     */
    abstract setAccessTokenCredential(
        accessToken: AccessTokenEntity,
        correlationId: string
    ): Promise<void>;

    /**
     * fetch the idToken entity from the platform cache
     * @param refreshTokenKey
     */
    abstract getRefreshTokenCredential(
        refreshTokenKey: string
    ): Promise<RefreshTokenEntity | null>;

    /**
     * set refreshToken entity to the platform cache
     * @param refreshToken
     * @param correlationId
     */
    abstract setRefreshTokenCredential(
        refreshToken: RefreshTokenEntity,
        correlationId: string
    ): Promise<void>;

    /**
     * fetch appMetadata entity from the platform cache
     * @param appMetadataKey
     */
    abstract getAppMetadata(appMetadataKey: string): Promise<AppMetadataEntity | null>;

    /**
     * set appMetadata entity to the platform cache
     * @param appMetadata
     */
    abstract setAppMetadata(appMetadata: AppMetadataEntity): Promise<void>;

    /**
     * fetch server telemetry entity from the platform cache
     * @param serverTelemetryKey
     */
    abstract getServerTelemetry(
        serverTelemetryKey: string
    ): Promise<ServerTelemetryEntity | null>;

    /**
     * set server telemetry entity to the platform cache
     * @param serverTelemetryKey
     * @param serverTelemetry
     */
    abstract setServerTelemetry(
        serverTelemetryKey: string,
        serverTelemetry: ServerTelemetryEntity
    ): Promise<void>;

    /**
     * fetch cloud discovery metadata entity from the platform cache
     * @param key
     */
    abstract getAuthorityMetadata(key: string): Promise<AuthorityMetadataEntity | null>;

    /**
     *
     */
    abstract getAuthorityMetadataKeys(): Promise<Array<string>>;

    /**
     * set cloud discovery metadata entity to the platform cache
     * @param key
     * @param value
     */
    abstract setAuthorityMetadata(
        key: string,
        value: AuthorityMetadataEntity
    ): Promise<void>;

    /**
     * fetch throttling entity from the platform cache
     * @param throttlingCacheKey
     */
    abstract getThrottlingCache(
        throttlingCacheKey: string
    ): Promise<ThrottlingEntity | null>;

    /**
     * set throttling entity to the platform cache
     * @param throttlingCacheKey
     * @param throttlingCache
     */
    abstract setThrottlingCache(
        throttlingCacheKey: string,
        throttlingCache: ThrottlingEntity
    ): Promise<void>;

    /**
     * Function to remove an item from cache given its key.
     * @param key
     */
    abstract removeItem(key: string): Promise<void>;

    /**
     * Function which retrieves all current keys from the cache.
     */
    abstract getKeys(): Promise<string[]>;

    /**
     * Function which retrieves all account keys from the cache
     */
    abstract getAccountKeys(): Promise<string[]>;

    /**
     * Function which retrieves all token keys from the cache
     */
    abstract getTokenKeys(): Promise<TokenKeys>;

    /**
     * Returns all the accounts in the cache that match the optional filter. If no filter is provided, all accounts are returned.
     * @param accountFilter - (Optional) filter to narrow down the accounts returned
     * @returns Array of AccountInfo objects in cache
     */
    async getAllAccounts(accountFilter?: AccountFilter): Promise<AccountInfo[]> {
        const filteredAccounts= await this.getAccountsFilteredBy(accountFilter || {});
        return this.buildTenantProfiles(filteredAccounts, accountFilter);
    }

    /**
     * Gets first tenanted AccountInfo object found based on provided filters
     */
    async getAccountInfoFilteredBy(accountFilter: AccountFilter): Promise<AccountInfo | null> {
        const allAccounts = await this.getAllAccounts(accountFilter);
        if (allAccounts.length > 1) {
            // If one or more accounts are found, prioritize accounts that have an ID token
            const sortedAccounts = allAccounts.sort((account) => {
                return account.idTokenClaims ? -1 : 1;
            });
            return sortedAccounts[0];
        } else if (allAccounts.length === 1) {
            // If only one account is found, return it regardless of whether a matching ID token was found
            return allAccounts[0];
        } else {
            return null;
        }
    }

    /**
     * Returns a single matching
     * @param accountFilter
     * @returns
     */
    async getBaseAccountInfo(accountFilter: AccountFilter): Promise<AccountInfo | null> {
        const accountEntities = await this.getAccountsFilteredBy(accountFilter);
        if (accountEntities.length > 0) {
            return accountEntities[0].getAccountInfo();
        } else {
            return null;
        }
    }

    /**
     * Matches filtered account entities with cached ID tokens that match the tenant profile-specific account filters
     * and builds the account info objects from the matching ID token's claims
     * @param cachedAccounts
     * @param accountFilter
     * @returns Array of AccountInfo objects that match account and tenant profile filters
     */
    private async buildTenantProfiles(
        cachedAccounts: AccountEntity[],
        accountFilter?: AccountFilter
    ): Promise<AccountInfo[]> {
        const profilePromises = cachedAccounts.map(accountEntity =>
            this.getTenantProfilesFromAccountEntity(
                accountEntity,
                accountFilter?.tenantId,
                accountFilter
            )
        );
        const profilesArrays = await Promise.all(profilePromises);
        return profilesArrays.flat();
    }

    private async getTenantedAccountInfoByFilter(
        accountInfo: AccountInfo,
        tokenKeys: TokenKeys,
        tenantProfile: TenantProfile,
        tenantProfileFilter?: TenantProfileFilter
    ): Promise<AccountInfo | null> {
        let tenantedAccountInfo: AccountInfo | null = null;
        let idTokenClaims: TokenClaims | undefined;

        if (tenantProfileFilter) {
            if (
                !this.tenantProfileMatchesFilter(
                    tenantProfile,
                    tenantProfileFilter
                )
            ) {
                return null;
            }
        }

        const idToken = await this.getIdToken(
            accountInfo,
            tokenKeys,
            tenantProfile.tenantId
        );

        if (idToken) {
            idTokenClaims = extractTokenClaims(
                idToken.secret,
                this.cryptoImpl.base64Decode
            );

            if (
                !this.idTokenClaimsMatchTenantProfileFilter(
                    idTokenClaims,
                    tenantProfileFilter
                )
            ) {
                // ID token sourced claims don't match so this tenant profile is not a match
                return null;
            }
        }

        // Expand tenant profile into account info based on matching tenant profile and if available matching ID token claims
        tenantedAccountInfo = updateAccountTenantProfileData(
            accountInfo,
            tenantProfile,
            idTokenClaims,
            idToken?.secret
        );

        return tenantedAccountInfo;
    }

    private async getTenantProfilesFromAccountEntity(
        accountEntity: AccountEntity,
        targetTenantId?: string,
        tenantProfileFilter?: TenantProfileFilter
    ): Promise<AccountInfo[]> {
        const accountInfo = accountEntity.getAccountInfo();
        let searchTenantProfiles: Map<string, TenantProfile> =
            accountInfo.tenantProfiles || new Map<string, TenantProfile>();
        const tokenKeys = await this.getTokenKeys();

        // If a tenant ID was provided, only return the tenant profile for that tenant ID if it exists
        if (targetTenantId) {
            const tenantProfile = searchTenantProfiles.get(targetTenantId);
            if (tenantProfile) {
                // Reduce search field to just this tenant profile
                searchTenantProfiles = new Map<string, TenantProfile>([
                    [targetTenantId, tenantProfile],
                ]);
            } else {
                // No tenant profile for search tenant ID, return empty array
                return [];
            }
        }

        const tenantProfilePromises = Array.from(searchTenantProfiles.values()).map(
            async (tenantProfile: TenantProfile) => {
            return this.getTenantedAccountInfoByFilter(
                accountInfo,
                tokenKeys,
                tenantProfile,
                tenantProfileFilter
            );
            }
        );

        const results = await Promise.all(tenantProfilePromises);
        return results.filter((tenantedAccountInfo): tenantedAccountInfo is AccountInfo => !!tenantedAccountInfo);
    }

    private tenantProfileMatchesFilter(
        tenantProfile: TenantProfile,
        tenantProfileFilter: TenantProfileFilter
    ): boolean {
        if (
            !!tenantProfileFilter.localAccountId &&
            !this.matchLocalAccountIdFromTenantProfile(
                tenantProfile,
                tenantProfileFilter.localAccountId
            )
        ) {
            return false;
        }

        if (
            !!tenantProfileFilter.name &&
            !(tenantProfile.name === tenantProfileFilter.name)
        ) {
            return false;
        }

        if (
            tenantProfileFilter.isHomeTenant !== undefined &&
            !(tenantProfile.isHomeTenant === tenantProfileFilter.isHomeTenant)
        ) {
            return false;
        }

        return true;
    }

    private idTokenClaimsMatchTenantProfileFilter(
        idTokenClaims: TokenClaims,
        tenantProfileFilter?: TenantProfileFilter
    ): boolean {
        // Tenant Profile filtering
        if (tenantProfileFilter) {
            if (
                !!tenantProfileFilter.localAccountId &&
                !this.matchLocalAccountIdFromTokenClaims(
                    idTokenClaims,
                    tenantProfileFilter.localAccountId
                )
            ) {
                return false;
            }

            if (
                !!tenantProfileFilter.loginHint &&
                !this.matchLoginHintFromTokenClaims(
                    idTokenClaims,
                    tenantProfileFilter.loginHint
                )
            ) {
                return false;
            }

            if (
                !!tenantProfileFilter.username &&
                !this.matchUsername(
                    idTokenClaims.preferred_username,
                    tenantProfileFilter.username
                )
            ) {
                return false;
            }

            if (
                !!tenantProfileFilter.name &&
                !this.matchName(idTokenClaims, tenantProfileFilter.name)
            ) {
                return false;
            }

            if (
                !!tenantProfileFilter.sid &&
                !this.matchSid(idTokenClaims, tenantProfileFilter.sid)
            ) {
                return false;
            }
        }

        return true;
    }

    /**
     * saves a cache record
     * @param cacheRecord {CacheRecord}
     * @param storeInCache {?StoreInCache}
     * @param correlationId {?string} correlation id
     */
    async saveCacheRecord(
        cacheRecord: CacheRecord,
        correlationId: string,
        storeInCache?: StoreInCache
    ): Promise<void> {
        if (!cacheRecord) {
            throw createClientAuthError(
                ClientAuthErrorCodes.invalidCacheRecord
            );
        }

        try {
            if (!!cacheRecord.account) {
                await this.setAccount(cacheRecord.account, correlationId);
            }

            if (!!cacheRecord.idToken && storeInCache?.idToken !== false) {
                await this.setIdTokenCredential(
                    cacheRecord.idToken,
                    correlationId
                );
            }

            if (
                !!cacheRecord.accessToken &&
                storeInCache?.accessToken !== false
            ) {
                await this.saveAccessToken(
                    cacheRecord.accessToken,
                    correlationId
                );
            }

            if (
                !!cacheRecord.refreshToken &&
                storeInCache?.refreshToken !== false
            ) {
                await this.setRefreshTokenCredential(
                    cacheRecord.refreshToken,
                    correlationId
                );
            }

            if (!!cacheRecord.appMetadata) {
                await this.setAppMetadata(cacheRecord.appMetadata);
            }
        } catch (e: unknown) {
            this.commonLogger?.error(`CacheManager.saveCacheRecord: failed`);
            if (e instanceof Error) {
                this.commonLogger?.errorPii(
                    `CacheManager.saveCacheRecord: ${e.message}`,
                    correlationId
                );

                if (
                    e.name === "QuotaExceededError" ||
                    e.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
                    e.message.includes("exceeded the quota")
                ) {
                    this.commonLogger?.error(
                        `CacheManager.saveCacheRecord: exceeded storage quota`,
                        correlationId
                    );
                    throw new CacheError(
                        CacheErrorCodes.cacheQuotaExceededErrorCode
                    );
                } else {
                    throw new CacheError(e.name, e.message);
                }
            } else {
                this.commonLogger?.errorPii(
                    `CacheManager.saveCacheRecord: ${e}`,
                    correlationId
                );
                throw new CacheError(CacheErrorCodes.cacheUnknownErrorCode);
            }
        }
    }

    /**
     * saves access token credential
     * @param credential
     */
    private async saveAccessToken(
        credential: AccessTokenEntity,
        correlationId: string
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

        const tokenKeys = await this.getTokenKeys();
        const currentScopes = ScopeSet.fromString(credential.target);

        const removedAccessTokens: Array<Promise<void>> = [];
        tokenKeys.accessToken.forEach(async (key) => {
            if (
                !this.accessTokenKeyMatchesFilter(key, accessTokenFilter, false)
            ) {
                return;
            }

            const tokenEntity = await this.getAccessTokenCredential(key);

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
        await this.setAccessTokenCredential(credential, correlationId);
    }

    /**
     * Retrieve account entities matching all provided tenant-agnostic filters; if no filter is set, get all account entities in the cache
     * Not checking for casing as keys are all generated in lower case, remember to convert to lower case if object properties are compared
     * @param accountFilter - An object containing Account properties to filter by
     */
    async getAccountsFilteredBy(accountFilter: AccountFilter): Promise<AccountEntity[]> {
        const allAccountKeys = await this.getAccountKeys();
        const accountPromises = allAccountKeys.map(async (cacheKey) => {
            if (!this.isAccountKey(cacheKey, accountFilter.homeAccountId)) {
            // Don't parse value if the key doesn't match the account filters
            return null;
            }

            const entity: AccountEntity | null = await this.getAccount(
            cacheKey,
            this.commonLogger
            );

            // Match base account fields

            if (!entity) {
            return null;
            }

            if (
            !!accountFilter.homeAccountId &&
            !this.matchHomeAccountId(entity, accountFilter.homeAccountId)
            ) {
            return null;
            }

            if (
            !!accountFilter.username &&
            !this.matchUsername(entity.username, accountFilter.username)
            ) {
            return null;
            }

            if (
            !!accountFilter.environment &&
            !(await this.matchEnvironment(entity, accountFilter.environment))
            ) {
            return null;
            }

            if (
            !!accountFilter.realm &&
            !this.matchRealm(entity, accountFilter.realm)
            ) {
            return null;
            }

            if (
            !!accountFilter.nativeAccountId &&
            !this.matchNativeAccountId(
                entity,
                accountFilter.nativeAccountId
            )
            ) {
            return null;
            }

            if (
            !!accountFilter.authorityType &&
            !this.matchAuthorityType(entity, accountFilter.authorityType)
            ) {
            return null;
            }

            // If at least one tenant profile matches the tenant profile filter, add the account to the list of matching accounts
            const tenantProfileFilter: TenantProfileFilter = {
            localAccountId: accountFilter?.localAccountId,
            name: accountFilter?.name,
            };

            const matchingTenantProfiles = entity.tenantProfiles?.filter(
            (tenantProfile: TenantProfile) => {
                return this.tenantProfileMatchesFilter(
                tenantProfile,
                tenantProfileFilter
                );
            }
            );

            if (matchingTenantProfiles && matchingTenantProfiles.length === 0) {
            // No tenant profile for this account matches filter, don't add to list of matching accounts
            return null;
            }

            return entity;
        });

        const results = await Promise.all(accountPromises);
        console.dir(results);
        return results.filter((entity): entity is AccountEntity => entity !== null);
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
    async getAppMetadataFilteredBy(filter: AppMetadataFilter): Promise<AppMetadataCache> {
        const allCacheKeys = await this.getKeys();
        const matchingAppMetadata: AppMetadataCache = {};

        allCacheKeys.forEach(async (cacheKey) => {
            // don't parse any non-appMetadata type cache entities
            if (!this.isAppMetadata(cacheKey)) {
                return;
            }

            // Attempt retrieval
            const entity = await this.getAppMetadata(cacheKey);

            if (!entity) {
                return;
            }

            if (
                !!filter.environment &&
                !this.matchEnvironment(entity, filter.environment)
            ) {
                return;
            }

            if (
                !!filter.clientId &&
                !this.matchClientId(entity, filter.clientId)
            ) {
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
    async getAuthorityMetadataByAlias(host: string): Promise<AuthorityMetadataEntity | null> {
        const allCacheKeys = await this.getAuthorityMetadataKeys();
        let matchedEntity = null;

        allCacheKeys.forEach(async (cacheKey) => {
            // don't parse any non-authorityMetadata type cache entities
            if (
                !this.isAuthorityMetadata(cacheKey) ||
                cacheKey.indexOf(this.clientId) === -1
            ) {
                return;
            }

            // Attempt retrieval
            const entity = await this.getAuthorityMetadata(cacheKey);

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
        const allAccountKeys = await this.getAccountKeys();
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
        const account = await this.getAccount(accountKey, this.commonLogger);
        if (!account) {
            return;
        }
        await this.removeAccountContext(account);
        await this.removeItem(accountKey);
    }

    /**
     * Removes credentials associated with the provided account
     * @param account
     */
    async removeAccountContext(account: AccountEntity): Promise<void> {
        const allTokenKeys = await this.getTokenKeys();
        const accountId = account.generateAccountId();
        const removedCredentials: Array<Promise<void>> = [];

        allTokenKeys.idToken.forEach(async (key) => {
            if (key.indexOf(accountId) === 0) {
                await this.removeIdToken(key);
            }
        });

        allTokenKeys.accessToken.forEach(async (key) => {
            if (key.indexOf(accountId) === 0) {
                removedCredentials.push(this.removeAccessToken(key));
            }
        });

        allTokenKeys.refreshToken.forEach(async (key) => {
            if (key.indexOf(accountId) === 0) {
                await this.removeRefreshToken(key);
            }
        });

        await Promise.all(removedCredentials);
    }

    /**
     * returns a boolean if the given credential is removed
     * @param credential
     */
    async removeAccessToken(key: string): Promise<void> {
        const credential = await this.getAccessTokenCredential(key);
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
                        throw createClientAuthError(
                            ClientAuthErrorCodes.bindingKeyNotRemoved
                        );
                    }
                }
            }
        }

        return this.removeItem(key);
    }

    /**
     * Removes all app metadata objects from cache.
     */
    async removeAppMetadata(): Promise<boolean> {
        const allCacheKeys = await this.getKeys();
        allCacheKeys.forEach(async (cacheKey) => {
            if (this.isAppMetadata(cacheKey)) {
                await this.removeItem(cacheKey);
            }
        });

        return true;
    }

    /**
     * Retrieve AccountEntity from cache
     * @param account
     */
    async readAccountFromCache(account: AccountInfo): Promise<AccountEntity | null> {
        const accountKey: string =
            AccountEntity.generateAccountCacheKey(account);
        return this.getAccount(accountKey, this.commonLogger);
    }

    /**
     * Retrieve IdTokenEntity from cache
     * @param account {AccountInfo}
     * @param tokenKeys {?TokenKeys}
     * @param targetRealm {?string}
     * @param performanceClient {?IPerformanceClient}
     * @param correlationId {?string}
     */
    async getIdToken(
        account: AccountInfo,
        tokenKeys?: TokenKeys,
        targetRealm?: string,
        performanceClient?: IPerformanceClient,
        correlationId?: string
    ): Promise<IdTokenEntity | null> {
        this.commonLogger.trace("CacheManager - getIdToken called");
        const idTokenFilter: CredentialFilter = {
            homeAccountId: account.homeAccountId,
            environment: account.environment,
            credentialType: CredentialType.ID_TOKEN,
            clientId: this.clientId,
            realm: targetRealm,
        };

        const idTokenMap: Map<string, IdTokenEntity> = await this.getIdTokensByFilter(
            idTokenFilter,
            tokenKeys
        );

        const numIdTokens = idTokenMap.size;

        if (numIdTokens < 1) {
            this.commonLogger.info("CacheManager:getIdToken - No token found");
            return null;
        } else if (numIdTokens > 1) {
            let tokensToBeRemoved: Map<string, IdTokenEntity> = idTokenMap;
            // Multiple tenant profiles and no tenant specified, pick home account
            if (!targetRealm) {
                const homeIdTokenMap: Map<string, IdTokenEntity> = new Map<
                    string,
                    IdTokenEntity
                >();
                idTokenMap.forEach((idToken, key) => {
                    if (idToken.realm === account.tenantId) {
                        homeIdTokenMap.set(key, idToken);
                    }
                });
                const numHomeIdTokens = homeIdTokenMap.size;
                if (numHomeIdTokens < 1) {
                    this.commonLogger.info(
                        "CacheManager:getIdToken - Multiple ID tokens found for account but none match account entity tenant id, returning first result"
                    );
                    return idTokenMap.values().next().value;
                } else if (numHomeIdTokens === 1) {
                    this.commonLogger.info(
                        "CacheManager:getIdToken - Multiple ID tokens found for account, defaulting to home tenant profile"
                    );
                    return homeIdTokenMap.values().next().value;
                } else {
                    // Multiple ID tokens for home tenant profile, remove all and return null
                    tokensToBeRemoved = homeIdTokenMap;
                }
            }
            // Multiple tokens for a single tenant profile, remove all and return null
            this.commonLogger.info(
                "CacheManager:getIdToken - Multiple matching ID tokens found, clearing them"
            );
            tokensToBeRemoved.forEach(async (idToken, key) => {
                await this.removeIdToken(key);
            });
            if (performanceClient && correlationId) {
                performanceClient.addFields(
                    { multiMatchedID: idTokenMap.size },
                    correlationId
                );
            }
            return null;
        }

        this.commonLogger.info("CacheManager:getIdToken - Returning ID token");
        return idTokenMap.values().next().value;
    }

    /**
     * Gets all idTokens matching the given filter
     * @param filter
     * @returns
     */
    async getIdTokensByFilter(
        filter: CredentialFilter,
        tokenKeys?: TokenKeys
    ): Promise<Map<string, IdTokenEntity>> {
        const idTokenKeys =
            (tokenKeys && tokenKeys.idToken) || (await this.getTokenKeys()).idToken;

        const idTokens: Map<string, IdTokenEntity> = new Map<string, IdTokenEntity>();

        const idTokenPromises = idTokenKeys.map(async (key) => {
            if (
            !this.idTokenKeyMatchesFilter(key, {
                clientId: this.clientId,
                ...filter,
            })
            ) {
            return null;
            }
            const idToken = await this.getIdTokenCredential(key);
            if (idToken && this.credentialMatchesFilter(idToken, filter)) {
            return { key, idToken };
            }
            return null;
        });

        const results = await Promise.all(idTokenPromises);
        results.forEach((result) => {
            if (result) {
            idTokens.set(result.key, result.idToken);
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
    async removeIdToken(key: string): Promise<void> {
        await this.removeItem(key);
    }

    /**
     * Removes refresh token from the cache
     * @param key
     */
    async removeRefreshToken(key: string): Promise<void> {
        await this.removeItem(key);
    }

    /**
     * Retrieve AccessTokenEntity from cache
     * @param account {AccountInfo}
     * @param request {BaseAuthRequest}
     * @param tokenKeys {?TokenKeys}
     * @param performanceClient {?IPerformanceClient}
     * @param correlationId {?string}
     */
    async getAccessToken(
        account: AccountInfo,
        request: BaseAuthRequest,
        tokenKeys?: TokenKeys,
        targetRealm?: string,
        performanceClient?: IPerformanceClient,
        correlationId?: string
    ): Promise<AccessTokenEntity | null> {
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
            realm: targetRealm || account.tenantId,
            target: scopes,
            tokenType: authScheme,
            keyId: request.sshKid,
            requestedClaimsHash: request.requestedClaimsHash,
        };

        const accessTokenKeys =
            (tokenKeys && tokenKeys.accessToken) ||
            (await this.getTokenKeys()).accessToken;
        const accessTokens: AccessTokenEntity[] = [];

        const accessTokenPromises = accessTokenKeys.map(async (key) => {
            // Validate key
            if (
            this.accessTokenKeyMatchesFilter(key, accessTokenFilter, true)
            ) {
            const accessToken = await this.getAccessTokenCredential(key);

            // Validate value
            if (
                accessToken &&
                this.credentialMatchesFilter(accessToken, accessTokenFilter)
            ) {
                return accessToken;
            }
            }
            return null;
        });

        const accessTokenResults = await Promise.all(accessTokenPromises);
        accessTokenResults.forEach((accessToken) => {
            if (accessToken) {
            accessTokens.push(accessToken);
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
                void this.removeAccessToken(generateCredentialKey(accessToken));
            });
            if (performanceClient && correlationId) {
                performanceClient.addFields(
                    { multiMatchedAT: accessTokens.length },
                    correlationId
                );
            }
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
    async getAccessTokensByFilter(filter: CredentialFilter): Promise<AccessTokenEntity[]> {
        const tokenKeys = await this.getTokenKeys();

        const accessTokens: AccessTokenEntity[] = [];
        tokenKeys.accessToken.forEach(async (key) => {
            if (!this.accessTokenKeyMatchesFilter(key, filter, true)) {
                return;
            }

            const accessToken = await this.getAccessTokenCredential(key);
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
     * @param account {AccountInfo}
     * @param familyRT {boolean}
     * @param tokenKeys {?TokenKeys}
     * @param performanceClient {?IPerformanceClient}
     * @param correlationId {?string}
     */
    async getRefreshToken(
        account: AccountInfo,
        familyRT: boolean,
        tokenKeys?: TokenKeys,
        performanceClient?: IPerformanceClient,
        correlationId?: string
    ): Promise<RefreshTokenEntity | null> {
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
            (await this.getTokenKeys()).refreshToken;
        const refreshTokens: RefreshTokenEntity[] = [];

        refreshTokenKeys.forEach(async (key) => {
            // Validate key
            if (this.refreshTokenKeyMatchesFilter(key, refreshTokenFilter)) {
                const refreshToken = await this.getRefreshTokenCredential(key);
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

        if (numRefreshTokens > 1 && performanceClient && correlationId) {
            performanceClient.addFields(
                { multiMatchedRT: numRefreshTokens },
                correlationId
            );
        }

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
    async readAppMetadataFromCache(environment: string): Promise<AppMetadataEntity | null> {
        const appMetadataFilter: AppMetadataFilter = {
            environment,
            clientId: this.clientId,
        };

        const appMetadata: AppMetadataCache =
            await this.getAppMetadataFilteredBy(appMetadataFilter);
        const appMetadataEntries: AppMetadataEntity[] = Object.keys(
            appMetadata
        ).map((key) => appMetadata[key]);

        const numAppMetadata = appMetadataEntries.length;
        if (numAppMetadata < 1) {
            return null;
        } else if (numAppMetadata > 1) {
            throw createClientAuthError(
                ClientAuthErrorCodes.multipleMatchingAppMetadata
            );
        }

        return appMetadataEntries[0] as AppMetadataEntity;
    }

    /**
     * Return the family_id value associated  with FOCI
     * @param environment
     * @param clientId
     */
    async isAppMetadataFOCI(environment: string): Promise<boolean> {
        const appMetadata = await this.readAppMetadataFromCache(environment);
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
    private matchLocalAccountIdFromTokenClaims(
        tokenClaims: TokenClaims,
        localAccountId: string
    ): boolean {
        const idTokenLocalAccountId = tokenClaims.oid || tokenClaims.sub;
        return localAccountId === idTokenLocalAccountId;
    }

    private matchLocalAccountIdFromTenantProfile(
        tenantProfile: TenantProfile,
        localAccountId: string
    ): boolean {
        return tenantProfile.localAccountId === localAccountId;
    }

    /**
     * helper to match names
     * @param entity
     * @param name
     * @returns true if the downcased name properties are present and match in the filter and the entity
     */
    private matchName(claims: TokenClaims, name: string): boolean {
        return !!(name.toLowerCase() === claims.name?.toLowerCase());
    }

    /**
     * helper to match usernames
     * @param entity
     * @param username
     * @returns
     */
    private matchUsername(
        cachedUsername?: string,
        filterUsername?: string
    ): boolean {
        return !!(
            cachedUsername &&
            typeof cachedUsername === "string" &&
            filterUsername?.toLowerCase() === cachedUsername.toLowerCase()
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
    private async matchEnvironment(
        entity: AccountEntity | CredentialEntity | AppMetadataEntity,
        environment: string
    ): Promise<boolean> {
        // Check static authority options first for cases where authority metadata has not been resolved and cached yet
        if (this.staticAuthorityOptions) {
            const staticAliases = getAliasesFromStaticSources(
                this.staticAuthorityOptions,
                this.commonLogger
            );
            if (
                staticAliases.includes(environment) &&
                staticAliases.includes(entity.environment)
            ) {
                return true;
            }
        }

        // Query metadata cache if no static authority configuration has aliases that match environment
        const cloudMetadata = await this.getAuthorityMetadataByAlias(environment);
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
        return !!(entity.realm?.toLowerCase() === realm.toLowerCase());
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
     * helper to match loginHint which can be either:
     * 1. login_hint ID token claim
     * 2. username in cached account object
     * 3. upn in ID token claims
     * @param entity
     * @param loginHint
     * @returns
     */
    private matchLoginHintFromTokenClaims(
        tokenClaims: TokenClaims,
        loginHint: string
    ): boolean {
        if (tokenClaims.login_hint === loginHint) {
            return true;
        }

        if (tokenClaims.preferred_username === loginHint) {
            return true;
        }

        if (tokenClaims.upn === loginHint) {
            return true;
        }

        return false;
    }

    /**
     * Helper to match sid
     * @param entity
     * @param sid
     * @returns true if the sid claim is present and matches the filter
     */
    private matchSid(idTokenClaims: TokenClaims, sid: string): boolean {
        return idTokenClaims.sid === sid;
    }

    private matchAuthorityType(
        entity: AccountEntity,
        authorityType: string
    ): boolean {
        return !!(
            entity.authorityType &&
            authorityType.toLowerCase() === entity.authorityType.toLowerCase()
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
     * @param keyId
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
export class DefaultAsyncStorageClass extends AsyncCacheManager {
    async setAccount(): Promise<void> {
        throw createClientAuthError(ClientAuthErrorCodes.methodNotImplemented);
    }
    async getAccount(): Promise<AccountEntity> {
        throw createClientAuthError(ClientAuthErrorCodes.methodNotImplemented);
    }
    async setIdTokenCredential(): Promise<void> {
        throw createClientAuthError(ClientAuthErrorCodes.methodNotImplemented);
    }
    async getIdTokenCredential(): Promise<IdTokenEntity> {
        throw createClientAuthError(ClientAuthErrorCodes.methodNotImplemented);
    }
    async setAccessTokenCredential(): Promise<void> {
        throw createClientAuthError(ClientAuthErrorCodes.methodNotImplemented);
    }
    async getAccessTokenCredential(): Promise<AccessTokenEntity> {
        throw createClientAuthError(ClientAuthErrorCodes.methodNotImplemented);
    }
    async setRefreshTokenCredential(): Promise<void> {
        throw createClientAuthError(ClientAuthErrorCodes.methodNotImplemented);
    }
    async getRefreshTokenCredential(): Promise<RefreshTokenEntity> {
        throw createClientAuthError(ClientAuthErrorCodes.methodNotImplemented);
    }
    async setAppMetadata(): Promise<void> {
        throw createClientAuthError(ClientAuthErrorCodes.methodNotImplemented);
    }
    async getAppMetadata(): Promise<AppMetadataEntity> {
        throw createClientAuthError(ClientAuthErrorCodes.methodNotImplemented);
    }
    async setServerTelemetry(): Promise<void> {
        throw createClientAuthError(ClientAuthErrorCodes.methodNotImplemented);
    }
    async getServerTelemetry(): Promise<ServerTelemetryEntity> {
        throw createClientAuthError(ClientAuthErrorCodes.methodNotImplemented);
    }
    async setAuthorityMetadata(): Promise<void> {
        throw createClientAuthError(ClientAuthErrorCodes.methodNotImplemented);
    }
    async getAuthorityMetadata(): Promise<AuthorityMetadataEntity | null> {
        throw createClientAuthError(ClientAuthErrorCodes.methodNotImplemented);
    }
    async getAuthorityMetadataKeys(): Promise<Array<string>> {
        throw createClientAuthError(ClientAuthErrorCodes.methodNotImplemented);
    }
    async setThrottlingCache(): Promise<void> {
        throw createClientAuthError(ClientAuthErrorCodes.methodNotImplemented);
    }
    async getThrottlingCache(): Promise<ThrottlingEntity> {
        throw createClientAuthError(ClientAuthErrorCodes.methodNotImplemented);
    }
    async removeItem(): Promise<void> {
        throw createClientAuthError(ClientAuthErrorCodes.methodNotImplemented);
    }
    async getKeys(): Promise<string[]> {
        throw createClientAuthError(ClientAuthErrorCodes.methodNotImplemented);
    }
    async getAccountKeys(): Promise<string[]> {
        throw createClientAuthError(ClientAuthErrorCodes.methodNotImplemented);
    }
    async getTokenKeys(): Promise<TokenKeys> {
        throw createClientAuthError(ClientAuthErrorCodes.methodNotImplemented);
    }
}
