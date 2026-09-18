/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AccessTokenEntity } from "../common/cache/entities/AccessTokenEntity.js";
import {
    AppMetadataCache,
    AppMetadataFilter,
    CredentialFilter,
    TokenKeys,
    ValidCacheType,
    ValidCredentialType,
} from "../common/cache/utils/CacheTypes.js";
import { AccountEntity } from "../common/cache/entities/AccountEntity.js";
import { IdTokenEntity } from "../common/cache/entities/IdTokenEntity.js";
import { RefreshTokenEntity } from "../common/cache/entities/RefreshTokenEntity.js";
import { AppMetadataEntity } from "../common/cache/entities/AppMetadataEntity.js";
import { ServerTelemetryEntity } from "../common/cache/entities/ServerTelemetryEntity.js";
import { ThrottlingEntity } from "../common/cache/entities/ThrottlingEntity.js";
import { CacheManager } from "../common/cache/CacheManager.js";
import { Logger } from "../common/logger/Logger.js";
import { ICrypto } from "../common/crypto/ICrypto.js";
import { AuthorityMetadataEntity } from "../common/cache/entities/AuthorityMetadataEntity.js";
import { StaticAuthorityOptions } from "../common/authority/AuthorityOptions.js";
import * as CacheHelpers from "../common/cache/utils/CacheHelpers.js";
import * as AccountEntityUtils from "../common/cache/utils/AccountEntityUtils.js";
import { CredentialEntity } from "../common/cache/entities/CredentialEntity.js";
import { AccountInfo } from "../common/account/AccountInfo.js";
import { StubPerformanceClient } from "../common/telemetry/performance/StubPerformanceClient.js";
import { DEFAULT_TOKEN_BINDING_KEY_MANAGER } from "../common/crypto/ITokenBindingKeyManager.js";
import { getAliasesFromStaticSources } from "../common/authority/AuthorityMetadata.js";
import * as Constants from "../common/utils/Constants.js";

import { Deserializer } from "./serializer/Deserializer.js";
import { Serializer } from "./serializer/Serializer.js";
import {
    InMemoryCache,
    JsonCache,
    CacheKVStore,
} from "./serializer/SerializerTypes.js";
import {
    computeAdditionalCacheKeyHash,
    generateAccountKey,
    generateCredentialKey,
} from "./CacheHelpers.js";

type AccessTokenIndex = {
    allKeys: Set<string>;
    scopeKeys: Map<string, Set<string>>;
    malformedScopeKeys: Set<string>;
};

/**
 * This class implements Storage for node, reading cache from user specified storage location or an  extension library
 * @public
 */
export class NodeStorage extends CacheManager {
    // Cache configuration, either set by user or default values.
    private logger: Logger;
    private cache: CacheKVStore = {};
    private changeEmitters: Array<Function> = [];
    private readonly nodeStaticAuthorityOptions?: StaticAuthorityOptions;
    private accountKeys = new Set<string>();
    private idTokenKeys = new Set<string>();
    private accessTokenKeys = new Set<string>();
    private refreshTokenKeys = new Set<string>();
    private appMetadataKeys = new Set<string>();
    private authorityMetadataKeys = new Set<string>();
    private authorityAliasIndex = new Map<string, Set<string>>();
    private authorityAliasesByKey = new Map<string, string[]>();
    private authorityMetadataSnapshots = new Map<string, string>();
    private cacheKeyOrder = new Map<string, number>();
    private nextCacheKeyOrder = 0;
    private appMetadataIndex = new Map<string, Set<string>>();
    private idTokenIndex = new Map<string, Set<string>>();
    private idTokenWithoutRealmIndex = new Map<string, Set<string>>();
    private refreshTokenIndex = new Map<string, Set<string>>();
    private accessTokenIndex = new Map<string, AccessTokenIndex>();

    constructor(
        logger: Logger,
        clientId: string,
        cryptoImpl: ICrypto,
        staticAuthorityOptions?: StaticAuthorityOptions
    ) {
        super(
            clientId,
            cryptoImpl,
            logger,
            new StubPerformanceClient(),
            staticAuthorityOptions,
            DEFAULT_TOKEN_BINDING_KEY_MANAGER
        );
        this.logger = logger;
        this.nodeStaticAuthorityOptions = staticAuthorityOptions;
    }

    getCacheSnapshot(): CacheKVStore {
        return JSON.parse(JSON.stringify(this.cache)) as CacheKVStore;
    }

    private rebuildIndexes(): void {
        this.accountKeys.clear();
        this.idTokenKeys.clear();
        this.accessTokenKeys.clear();
        this.refreshTokenKeys.clear();
        this.appMetadataKeys.clear();
        this.authorityMetadataKeys.clear();
        this.authorityAliasIndex.clear();
        this.authorityAliasesByKey.clear();
        this.authorityMetadataSnapshots.clear();
        this.cacheKeyOrder.clear();
        this.nextCacheKeyOrder = 0;
        this.appMetadataIndex.clear();
        this.idTokenIndex.clear();
        this.idTokenWithoutRealmIndex.clear();
        this.refreshTokenIndex.clear();
        this.accessTokenIndex.clear();

        const cacheKeys = Object.keys(this.cache);
        cacheKeys.forEach((key) => {
            this.cacheKeyOrder.set(key, this.nextCacheKeyOrder++);
        });
        cacheKeys.forEach((key) => {
            this.addToIndexes(key, this.cache[key]);
        });
    }

    private addToIndexes(key: string, value: ValidCacheType): void {
        if (!this.cacheKeyOrder.has(key)) {
            this.cacheKeyOrder.set(key, this.nextCacheKeyOrder++);
        }
        if (this.isAuthorityMetadata(key)) {
            this.authorityMetadataKeys.add(key);
            if (
                value &&
                typeof value === "object" &&
                CacheHelpers.isAuthorityMetadataEntity(key, value)
            ) {
                this.addAuthorityMetadataToIndexes(
                    key,
                    value as AuthorityMetadataEntity
                );
                return;
            }
        }
        if (!value || typeof value !== "object") {
            return;
        }
        if (AccountEntityUtils.isAccountEntity(value)) {
            this.accountKeys.add(key);
        } else if (CacheHelpers.isIdTokenEntity(value)) {
            this.idTokenKeys.add(key);
            this.addIdTokenToIndexes(key, value);
        } else if (CacheHelpers.isAccessTokenEntity(value)) {
            this.accessTokenKeys.add(key);
            this.addAccessTokenToIndexes(key, value);
        } else if (CacheHelpers.isRefreshTokenEntity(value)) {
            this.refreshTokenKeys.add(key);
            this.addRefreshTokenToIndexes(key, value);
        } else if (CacheHelpers.isAppMetadataEntity(key, value)) {
            const appMetadata = value as AppMetadataEntity;
            this.appMetadataKeys.add(key);
            this.addKeyToIndex(
                this.appMetadataIndex,
                this.appMetadataIndexKey(
                    appMetadata.environment,
                    appMetadata.clientId
                ),
                key
            );
        }
    }

    private removeFromIndexes(key: string, value: ValidCacheType): void {
        this.cacheKeyOrder.delete(key);
        if (this.isAuthorityMetadata(key)) {
            this.removeAuthorityMetadataFromIndexes(key);
        }
        if (!value || typeof value !== "object") {
            return;
        }
        if (AccountEntityUtils.isAccountEntity(value)) {
            this.accountKeys.delete(key);
        } else if (CacheHelpers.isIdTokenEntity(value)) {
            this.idTokenKeys.delete(key);
            this.removeIdTokenFromIndexes(key, value);
        } else if (CacheHelpers.isAccessTokenEntity(value)) {
            this.accessTokenKeys.delete(key);
            this.removeAccessTokenFromIndexes(key, value);
        } else if (CacheHelpers.isRefreshTokenEntity(value)) {
            this.refreshTokenKeys.delete(key);
            this.removeRefreshTokenFromIndexes(key, value);
        } else if (CacheHelpers.isAppMetadataEntity(key, value)) {
            const appMetadata = value as AppMetadataEntity;
            this.appMetadataKeys.delete(key);
            this.removeKeyFromIndex(
                this.appMetadataIndex,
                this.appMetadataIndexKey(
                    appMetadata.environment,
                    appMetadata.clientId
                ),
                key
            );
        }
    }

    private addAuthorityMetadataToIndexes(
        key: string,
        metadata: AuthorityMetadataEntity,
        snapshot: string = this.stableStringify(metadata)
    ): void {
        const aliases = Array.isArray(metadata.aliases)
            ? metadata.aliases.filter(
                  (alias): alias is string => typeof alias === "string"
              )
            : [];
        this.authorityMetadataKeys.add(key);
        this.authorityAliasesByKey.set(key, aliases);
        this.authorityMetadataSnapshots.set(key, snapshot);
        aliases.forEach((alias) => {
            this.addKeyToIndex(
                this.authorityAliasIndex,
                alias.toLowerCase(),
                key
            );
        });
    }

    private removeAuthorityMetadataFromIndexes(key: string): void {
        this.authorityMetadataKeys.delete(key);
        (this.authorityAliasesByKey.get(key) || []).forEach((alias) => {
            this.removeKeyFromIndex(
                this.authorityAliasIndex,
                alias.toLowerCase(),
                key
            );
        });
        this.authorityAliasesByKey.delete(key);
        this.authorityMetadataSnapshots.delete(key);
    }

    private addKeyToIndex(
        index: Map<string, Set<string>>,
        indexKey: string,
        cacheKey: string
    ): void {
        let cacheKeys = index.get(indexKey);
        if (!cacheKeys) {
            cacheKeys = new Set<string>();
            index.set(indexKey, cacheKeys);
        }
        cacheKeys.add(cacheKey);
    }

    private removeKeyFromIndex(
        index: Map<string, Set<string>>,
        indexKey: string,
        cacheKey: string
    ): void {
        const cacheKeys = index.get(indexKey);
        if (!cacheKeys) {
            return;
        }
        cacheKeys.delete(cacheKey);
        if (cacheKeys.size === 0) {
            index.delete(indexKey);
        }
    }

    private tuple(...values: string[]): string {
        return JSON.stringify(values);
    }

    private stableStringify(value: unknown): string {
        if (Array.isArray(value)) {
            return `[${value
                .map((item) => this.stableStringify(item))
                .join(",")}]`;
        }
        if (value && typeof value === "object") {
            return `{${Object.keys(value)
                .sort()
                .map(
                    (key) =>
                        `${JSON.stringify(key)}:${this.stableStringify(
                            (value as Record<string, unknown>)[key]
                        )}`
                )
                .join(",")}}`;
        }
        return JSON.stringify(value) ?? "undefined";
    }

    private orderCandidateKeys(keys: Iterable<string>): string[] {
        return Array.from(new Set(keys)).sort(
            (left, right) =>
                (this.cacheKeyOrder.get(left) ?? Number.MAX_SAFE_INTEGER) -
                (this.cacheKeyOrder.get(right) ?? Number.MAX_SAFE_INTEGER)
        );
    }

    private normalizeString(value: unknown): string {
        return typeof value === "string" ? value.toLowerCase() : "";
    }

    private normalizeScheme(tokenType?: string): string {
        return this.normalizeString(
            tokenType || Constants.AuthenticationScheme.BEARER
        );
    }

    private additionalComponentsKey(
        components?: Record<string, string>
    ): string {
        if (
            !components ||
            typeof components !== "object" ||
            Object.keys(components).length === 0
        ) {
            return "none";
        }
        if (
            !Object.entries(components).every(
                ([key, value]) =>
                    typeof key === "string" && typeof value === "string"
            )
        ) {
            return "invalid";
        }
        return `hash:${computeAdditionalCacheKeyHash(components)}`;
    }

    private normalizeScopes(target: string): string[] {
        if (typeof target !== "string") {
            return [];
        }
        return Array.from(
            new Set(
                target
                    .split(" ")
                    .map((scope) => scope.trim().toLowerCase())
                    .filter((scope) => scope.length > 0)
            )
        );
    }

    private accessTokenStandardIndexKey(
        value: {
            homeAccountId?: string;
            environment?: string;
            credentialType?: string;
            clientId?: string;
            tokenType?: string;
            additionalCacheKeyComponents?: Record<string, string>;
        },
        environment: string = value.environment || "",
        correlationId: string = ""
    ): string {
        return this.tuple(
            "standard",
            value.homeAccountId || "",
            this.environmentIndexKey(environment, correlationId),
            this.normalizeString(value.credentialType),
            value.clientId || "",
            this.normalizeScheme(value.tokenType),
            this.additionalComponentsKey(value.additionalCacheKeyComponents)
        );
    }

    private accessTokenOboIndexKey(value: {
        credentialType?: string;
        clientId?: string;
        tokenType?: string;
        userAssertionHash?: string;
        additionalCacheKeyComponents?: Record<string, string>;
    }): string {
        return this.tuple(
            "obo",
            this.normalizeString(value.credentialType),
            value.clientId || "",
            this.normalizeScheme(value.tokenType),
            value.userAssertionHash || "",
            this.additionalComponentsKey(value.additionalCacheKeyComponents)
        );
    }

    private addAccessTokenToIndexes(
        cacheKey: string,
        entity: AccessTokenEntity
    ): void {
        this.addAccessTokenToIndex(
            this.accessTokenStandardIndexKey(entity),
            cacheKey,
            entity.target
        );
        this.addAccessTokenToIndex(
            this.accessTokenOboIndexKey(entity),
            cacheKey,
            entity.target
        );
    }

    private removeAccessTokenFromIndexes(
        cacheKey: string,
        entity: AccessTokenEntity
    ): void {
        this.removeAccessTokenFromIndex(
            this.accessTokenStandardIndexKey(entity),
            cacheKey,
            entity.target
        );
        this.removeAccessTokenFromIndex(
            this.accessTokenOboIndexKey(entity),
            cacheKey,
            entity.target
        );
    }

    private addAccessTokenToIndex(
        indexKey: string,
        cacheKey: string,
        target: string
    ): void {
        let index = this.accessTokenIndex.get(indexKey);
        if (!index) {
            index = {
                allKeys: new Set<string>(),
                scopeKeys: new Map<string, Set<string>>(),
                malformedScopeKeys: new Set<string>(),
            };
            this.accessTokenIndex.set(indexKey, index);
        }
        const accessTokenIndex = index;
        accessTokenIndex.allKeys.add(cacheKey);
        if (typeof target !== "string") {
            accessTokenIndex.malformedScopeKeys.add(cacheKey);
            return;
        }
        this.normalizeScopes(target).forEach((scope) => {
            this.addKeyToIndex(accessTokenIndex.scopeKeys, scope, cacheKey);
        });
    }

    private removeAccessTokenFromIndex(
        indexKey: string,
        cacheKey: string,
        target: string
    ): void {
        const index = this.accessTokenIndex.get(indexKey);
        if (!index) {
            return;
        }
        index.allKeys.delete(cacheKey);
        index.malformedScopeKeys.delete(cacheKey);
        this.normalizeScopes(target).forEach((scope) => {
            this.removeKeyFromIndex(index.scopeKeys, scope, cacheKey);
        });
        if (index.allKeys.size === 0) {
            this.accessTokenIndex.delete(indexKey);
        }
    }

    private idTokenIndexKey(
        value: {
            homeAccountId?: string;
            environment?: string;
            credentialType?: string;
            clientId?: string;
            realm?: string;
        },
        environment: string = value.environment || "",
        includeRealm: boolean = true,
        correlationId: string = ""
    ): string {
        const components = [
            value.homeAccountId || "",
            this.environmentIndexKey(environment, correlationId),
            this.normalizeString(value.credentialType),
            value.clientId || "",
        ];
        if (includeRealm) {
            components.push(this.normalizeString(value.realm));
        }
        return this.tuple(...components);
    }

    private addIdTokenToIndexes(cacheKey: string, entity: IdTokenEntity): void {
        this.addKeyToIndex(
            this.idTokenIndex,
            this.idTokenIndexKey(entity),
            cacheKey
        );
        this.addKeyToIndex(
            this.idTokenWithoutRealmIndex,
            this.idTokenIndexKey(entity, entity.environment, false),
            cacheKey
        );
    }

    private removeIdTokenFromIndexes(
        cacheKey: string,
        entity: IdTokenEntity
    ): void {
        this.removeKeyFromIndex(
            this.idTokenIndex,
            this.idTokenIndexKey(entity),
            cacheKey
        );
        this.removeKeyFromIndex(
            this.idTokenWithoutRealmIndex,
            this.idTokenIndexKey(entity, entity.environment, false),
            cacheKey
        );
    }

    private refreshTokenIndexKey(
        value: {
            homeAccountId?: string;
            environment?: string;
            credentialType?: string;
            clientId?: string;
            familyId?: string;
        },
        environment: string = value.environment || "",
        correlationId: string = ""
    ): string {
        return this.tuple(
            value.homeAccountId || "",
            this.environmentIndexKey(environment, correlationId),
            this.normalizeString(value.credentialType),
            value.clientId || "",
            value.familyId || ""
        );
    }

    private addRefreshTokenToIndexes(
        cacheKey: string,
        entity: RefreshTokenEntity
    ): void {
        this.addKeyToIndex(
            this.refreshTokenIndex,
            this.refreshTokenIndexKey(entity),
            cacheKey
        );
    }

    private removeRefreshTokenFromIndexes(
        cacheKey: string,
        entity: RefreshTokenEntity
    ): void {
        this.removeKeyFromIndex(
            this.refreshTokenIndex,
            this.refreshTokenIndexKey(entity),
            cacheKey
        );
    }

    private appMetadataIndexKey(
        environment: string,
        clientId: string,
        correlationId: string = ""
    ): string {
        return this.tuple(
            this.environmentIndexKey(environment, correlationId),
            clientId
        );
    }

    private getEnvironmentAliases(
        environment: string,
        correlationId: string
    ): Set<string> {
        const normalizedEnvironment = this.normalizeString(environment);
        const aliases = new Set<string>([normalizedEnvironment]);

        if (this.nodeStaticAuthorityOptions) {
            const staticAliases = getAliasesFromStaticSources(
                this.nodeStaticAuthorityOptions,
                this.logger,
                correlationId
            );
            if (staticAliases.includes(normalizedEnvironment)) {
                staticAliases.forEach((alias) => {
                    if (typeof alias === "string") {
                        aliases.add(alias.toLowerCase());
                    }
                });
            }
        }

        const metadata = this.getAuthorityMetadataByAliasFromIndex(
            normalizedEnvironment
        );
        if (metadata?.aliases.includes(normalizedEnvironment)) {
            metadata.aliases.forEach((alias) => {
                if (typeof alias === "string") {
                    aliases.add(alias.toLowerCase());
                }
            });
        }

        return aliases;
    }

    private environmentIndexKey(
        environment: string,
        _correlationId: string
    ): string {
        return this.normalizeString(environment);
    }

    private environmentMatches(
        entityEnvironment: string,
        environment: string,
        correlationId: string
    ): boolean {
        if (this.nodeStaticAuthorityOptions) {
            const staticAliases = getAliasesFromStaticSources(
                this.nodeStaticAuthorityOptions,
                this.logger,
                correlationId
            );
            if (
                staticAliases.includes(environment) &&
                staticAliases.includes(entityEnvironment)
            ) {
                return true;
            }
        }

        const metadata = this.getAuthorityMetadataByAlias(
            environment,
            correlationId
        );
        return !!metadata?.aliases.includes(entityEnvironment);
    }

    private getAccessTokenCandidates(
        filter: CredentialFilter,
        correlationId: string
    ): string[] | null {
        if (!filter.target || !filter.credentialType || !filter.clientId) {
            return null;
        }

        const indexKeys: string[] = [];

        if (filter.homeAccountId !== undefined && filter.environment) {
            this.getEnvironmentAliases(
                filter.environment,
                correlationId
            ).forEach((environment) => {
                indexKeys.push(
                    this.accessTokenStandardIndexKey(
                        filter,
                        environment,
                        correlationId
                    )
                );
            });
        } else if (filter.userAssertionHash) {
            indexKeys.push(this.accessTokenOboIndexKey(filter));
        } else {
            return null;
        }

        const requestedScopes = this.normalizeScopes(
            filter.target.printScopes()
        );
        const candidates = new Set<string>();
        indexKeys.forEach((indexKey) => {
            const index = this.accessTokenIndex.get(indexKey);
            if (!index) {
                return;
            }
            if (requestedScopes.length === 0) {
                index.allKeys.forEach((key) => candidates.add(key));
                return;
            }
            const postings = requestedScopes.map(
                (scope) => index.scopeKeys.get(scope) || new Set<string>()
            );
            const smallestPosting = postings.reduce((smallest, current) =>
                current.size < smallest.size ? current : smallest
            );
            smallestPosting.forEach((key) => {
                if (postings.every((posting) => posting.has(key))) {
                    candidates.add(key);
                }
            });
            index.malformedScopeKeys.forEach((key) => candidates.add(key));
        });

        return this.orderCandidateKeys(candidates);
    }

    protected getAccessTokenEntriesByFilter(
        filter: CredentialFilter,
        correlationId: string,
        tokenKeys?: TokenKeys
    ): Map<string, AccessTokenEntity> {
        if (tokenKeys) {
            return super.getAccessTokenEntriesByFilter(
                filter,
                correlationId,
                tokenKeys
            );
        }

        const candidateKeys = this.getAccessTokenCandidates(
            filter,
            correlationId
        );
        if (!candidateKeys) {
            return super.getAccessTokenEntriesByFilter(filter, correlationId);
        }

        const accessTokens = new Map<string, AccessTokenEntity>();
        candidateKeys.forEach((key) => {
            if (!this.accessTokenKeyMatchesFilter(key, filter, true)) {
                return;
            }
            const accessToken = this.getAccessTokenCredential(key);
            if (
                accessToken &&
                this.credentialMatchesFilter(accessToken, filter, correlationId)
            ) {
                accessTokens.set(key, accessToken);
            }
        });
        return accessTokens;
    }

    getIdTokensByFilter(
        filter: CredentialFilter,
        correlationId: string,
        tokenKeys?: TokenKeys
    ): Map<string, IdTokenEntity> {
        if (
            tokenKeys ||
            filter.homeAccountId === undefined ||
            !filter.environment ||
            !filter.credentialType ||
            !filter.clientId
        ) {
            return super.getIdTokensByFilter(filter, correlationId, tokenKeys);
        }

        const index = !filter.realm
            ? this.idTokenWithoutRealmIndex
            : this.idTokenIndex;
        const candidates = new Set<string>();
        this.getEnvironmentAliases(filter.environment, correlationId).forEach(
            (environment) => {
                const indexKey = this.idTokenIndexKey(
                    filter,
                    environment,
                    !!filter.realm,
                    correlationId
                );
                index.get(indexKey)?.forEach((key) => candidates.add(key));
            }
        );

        const idTokens = new Map<string, IdTokenEntity>();
        this.orderCandidateKeys(candidates).forEach((key) => {
            if (
                !this.idTokenKeyMatchesFilter(key, {
                    clientId: this.clientId,
                    ...filter,
                })
            ) {
                return;
            }
            const idToken = this.getIdTokenCredential(key);
            if (
                idToken &&
                this.credentialMatchesFilter(idToken, filter, correlationId)
            ) {
                idTokens.set(key, idToken);
            }
        });
        return idTokens;
    }

    protected getRefreshTokensByFilter(
        filter: CredentialFilter,
        correlationId: string,
        tokenKeys?: TokenKeys
    ): RefreshTokenEntity[] {
        if (
            tokenKeys ||
            filter.homeAccountId === undefined ||
            !filter.environment ||
            !filter.credentialType ||
            !filter.clientId
        ) {
            return super.getRefreshTokensByFilter(
                filter,
                correlationId,
                tokenKeys
            );
        }

        const candidates = new Set<string>();
        this.getEnvironmentAliases(filter.environment, correlationId).forEach(
            (environment) => {
                const indexKey = this.refreshTokenIndexKey(
                    filter,
                    environment,
                    correlationId
                );
                this.refreshTokenIndex
                    .get(indexKey)
                    ?.forEach((key) => candidates.add(key));
            }
        );

        const refreshTokens: RefreshTokenEntity[] = [];
        this.orderCandidateKeys(candidates).forEach((key) => {
            if (!this.refreshTokenKeyMatchesFilter(key, filter)) {
                return;
            }
            const refreshToken = this.getRefreshTokenCredential(key);
            if (
                refreshToken &&
                this.credentialMatchesFilter(
                    refreshToken,
                    filter,
                    correlationId
                )
            ) {
                refreshTokens.push(refreshToken);
            }
        });
        return refreshTokens;
    }

    getAppMetadataFilteredBy(
        filter: AppMetadataFilter,
        correlationId: string
    ): AppMetadataCache {
        if (!filter.environment || !filter.clientId) {
            return super.getAppMetadataFilteredBy(filter, correlationId);
        }

        const candidates = new Set<string>();
        const clientId = filter.clientId;
        this.getEnvironmentAliases(filter.environment, correlationId).forEach(
            (environment) => {
                this.appMetadataIndex
                    .get(
                        this.appMetadataIndexKey(
                            environment,
                            clientId,
                            correlationId
                        )
                    )
                    ?.forEach((key) => candidates.add(key));
            }
        );

        const appMetadata: AppMetadataCache = {};
        this.orderCandidateKeys(candidates).forEach((key) => {
            const entity = this.getAppMetadata(key);
            if (
                entity &&
                entity.clientId === filter.clientId &&
                this.environmentMatches(
                    entity.environment,
                    filter.environment!,
                    correlationId
                )
            ) {
                appMetadata[key] = entity;
            }
        });
        return appMetadata;
    }

    getAuthorityMetadataByAlias(
        host: string,
        _correlationId: string
    ): AuthorityMetadataEntity | null {
        return this.getAuthorityMetadataByAliasFromIndex(host);
    }

    private getAuthorityMetadataByAliasFromIndex(
        host: string
    ): AuthorityMetadataEntity | null {
        let matchedEntity: AuthorityMetadataEntity | null = null;
        const candidates = this.authorityAliasIndex.get(host.toLowerCase());
        if (!candidates) {
            return null;
        }

        this.orderCandidateKeys(candidates).forEach((key) => {
            if (key.indexOf(this.clientId) === -1) {
                return;
            }
            const entity = this.getAuthorityMetadata(key);
            if (entity?.aliases.includes(host)) {
                matchedEntity = entity;
            }
        });
        return matchedEntity;
    }

    /**
     * Queue up callbacks
     * @param func - a callback function for cache change indication
     */
    registerChangeEmitter(func: () => void): void {
        this.changeEmitters.push(func);
    }

    /**
     * Invoke the callback when cache changes
     */
    emitChange(): void {
        this.changeEmitters.forEach((func) => func.call(null));
    }

    /**
     * Converts cacheKVStore to InMemoryCache
     * @param cache - key value store
     */
    cacheToInMemoryCache(cache: CacheKVStore): InMemoryCache {
        const inMemoryCache: InMemoryCache = {
            accounts: {},
            idTokens: {},
            accessTokens: {},
            refreshTokens: {},
            appMetadata: {},
        };

        for (const key in cache) {
            const value = cache[key];
            if (typeof value !== "object") {
                continue;
            }
            if (AccountEntityUtils.isAccountEntity(value)) {
                inMemoryCache.accounts[key] = value as AccountEntity;
            } else if (CacheHelpers.isIdTokenEntity(value)) {
                inMemoryCache.idTokens[key] = value as IdTokenEntity;
            } else if (CacheHelpers.isAccessTokenEntity(value)) {
                inMemoryCache.accessTokens[key] = value as AccessTokenEntity;
            } else if (CacheHelpers.isRefreshTokenEntity(value)) {
                inMemoryCache.refreshTokens[key] = value as RefreshTokenEntity;
            } else if (CacheHelpers.isAppMetadataEntity(key, value)) {
                inMemoryCache.appMetadata[key] = value as AppMetadataEntity;
            } else {
                continue;
            }
        }

        return inMemoryCache;
    }

    /**
     * converts inMemoryCache to CacheKVStore
     * @param inMemoryCache - kvstore map for inmemory
     */
    inMemoryCacheToCache(inMemoryCache: InMemoryCache): CacheKVStore {
        // convert in memory cache to a flat Key-Value map
        const cache = {
            ...this.cache,
            ...inMemoryCache.accounts,
            ...inMemoryCache.idTokens,
            ...inMemoryCache.accessTokens,
            ...inMemoryCache.refreshTokens,
            ...inMemoryCache.appMetadata,
        };

        // convert in memory cache to a flat Key-Value map
        return cache;
    }

    /**
     * gets the current in memory cache for the client
     */
    getInMemoryCache(): InMemoryCache {
        this.logger.trace("Getting in-memory cache", "");

        // convert the cache key value store to inMemoryCache
        const inMemoryCache = this.cacheToInMemoryCache(this.cache);
        return inMemoryCache;
    }

    /**
     * sets the current in memory cache for the client
     * @param inMemoryCache - key value map in memory
     */
    setInMemoryCache(inMemoryCache: InMemoryCache): void {
        this.logger.trace("Setting in-memory cache", "");

        // convert and append the inMemoryCache to cacheKVStore
        const cache = this.inMemoryCacheToCache(inMemoryCache);
        this.setCache(cache);

        this.emitChange();
    }

    /**
     * get the current cache key-value store
     */
    getCache(): CacheKVStore {
        this.logger.trace("Getting cache key-value store", "");
        return this.cache;
    }

    /**
     * sets the current cache (key value store)
     * @param cacheMap - key value map
     */
    setCache(cache: CacheKVStore): void {
        this.logger.trace("Setting cache key value store", "");
        const previousCache = this.cache;
        this.cache = cache;
        try {
            this.rebuildIndexes();
        } catch (error) {
            this.cache = previousCache;
            this.rebuildIndexes();
            throw error;
        }

        // mark change in cache
        this.emitChange();
    }

    /**
     * Gets cache item with given key.
     * @param key - lookup key for the cache entry
     */
    getItem(key: string): ValidCacheType {
        this.logger.tracePii(`Item key: ${key}`, "");

        // read cache
        return this.cache[key];
    }

    /**
     * Gets cache item with given key-value
     * @param key - lookup key for the cache entry
     * @param value - value of the cache entry
     */
    setItem(key: string, value: ValidCacheType): void {
        this.logger.tracePii(`Item key: ${key}`, "");

        // read cache
        const cache = this.cache;
        const hadItem = Object.prototype.hasOwnProperty.call(cache, key);
        const previousValue = cache[key];
        const previousOrder = this.cacheKeyOrder.get(key);
        try {
            if (hadItem) {
                this.removeFromIndexes(key, previousValue);
                if (previousOrder !== undefined) {
                    this.cacheKeyOrder.set(key, previousOrder);
                }
            }
            cache[key] = value;
            this.addToIndexes(key, value);
        } catch (error) {
            if (hadItem) {
                cache[key] = previousValue;
            } else {
                delete cache[key];
            }
            this.rebuildIndexes();
            throw error;
        }

        // mark change in cache
        this.emitChange();
    }

    generateCredentialKey(
        credential: CredentialEntity,
        additionalCacheKeyHash?: string
    ): string {
        return generateCredentialKey(credential, additionalCacheKeyHash);
    }

    generateAccountKey(account: AccountInfo): string {
        return generateAccountKey(account);
    }

    getAccountKeys(): string[] {
        return Array.from(this.accountKeys);
    }

    getTokenKeys(): TokenKeys {
        return {
            idToken: Array.from(this.idTokenKeys),
            accessToken: Array.from(this.accessTokenKeys),
            refreshToken: Array.from(this.refreshTokenKeys),
        };
    }

    /**
     * Reads account from cache, builds it into an account entity and returns it.
     * @param accountKey - lookup key to fetch cache type AccountEntity
     * @returns
     */
    getAccount(accountKey: string): AccountEntity | null {
        const cachedAccount = this.getItem(accountKey);
        return cachedAccount && typeof cachedAccount === "object"
            ? ({ ...cachedAccount } as AccountEntity)
            : null;
    }

    /**
     * set account entity
     * @param account - cache value to be set of type AccountEntity
     */
    async setAccount(account: AccountEntity): Promise<void> {
        const accountKey = this.generateAccountKey(
            AccountEntityUtils.getAccountInfo(account)
        );
        this.setItem(accountKey, account);
    }

    /**
     * fetch the idToken credential
     * @param idTokenKey - lookup key to fetch cache type IdTokenEntity
     */
    getIdTokenCredential(idTokenKey: string): IdTokenEntity | null {
        const idToken = this.getItem(idTokenKey) as IdTokenEntity;
        if (CacheHelpers.isIdTokenEntity(idToken)) {
            return idToken;
        }
        return null;
    }

    /**
     * set idToken credential
     * @param idToken - cache value to be set of type IdTokenEntity
     */
    async setIdTokenCredential(idToken: IdTokenEntity): Promise<void> {
        const idTokenKey = this.generateCredentialKey(idToken);
        this.setItem(idTokenKey, idToken);
    }

    /**
     * fetch the accessToken credential
     * @param accessTokenKey - lookup key to fetch cache type AccessTokenEntity
     */
    getAccessTokenCredential(accessTokenKey: string): AccessTokenEntity | null {
        const accessToken = this.getItem(accessTokenKey) as AccessTokenEntity;
        if (CacheHelpers.isAccessTokenEntity(accessToken)) {
            return accessToken;
        }
        return null;
    }

    /**
     * Set accessToken credential to the cache
     * @param accessToken - the access token entity to cache
     * @param _correlationId - unique identifier for the request
     * @param _kmsi - keep me signed in flag
     * @param additionalCacheKeyHash - optional precomputed hash of additionalCacheKeyComponents used in key generation
     */
    async setAccessTokenCredential(
        accessToken: AccessTokenEntity,
        _correlationId: string,
        _kmsi: boolean,
        additionalCacheKeyHash?: string
    ): Promise<void> {
        const accessTokenKey = this.generateCredentialKey(
            accessToken,
            additionalCacheKeyHash
        );
        this.setItem(accessTokenKey, accessToken);
    }

    /**
     * fetch the refreshToken credential
     * @param refreshTokenKey - lookup key to fetch cache type RefreshTokenEntity
     */
    getRefreshTokenCredential(
        refreshTokenKey: string
    ): RefreshTokenEntity | null {
        const refreshToken = this.getItem(
            refreshTokenKey
        ) as RefreshTokenEntity;
        if (CacheHelpers.isRefreshTokenEntity(refreshToken)) {
            return refreshToken as RefreshTokenEntity;
        }
        return null;
    }

    /**
     * set refreshToken credential
     * @param refreshToken - cache value to be set of type RefreshTokenEntity
     */
    async setRefreshTokenCredential(
        refreshToken: RefreshTokenEntity
    ): Promise<void> {
        const refreshTokenKey = this.generateCredentialKey(refreshToken);
        this.setItem(refreshTokenKey, refreshToken);
    }

    /**
     * fetch appMetadata entity from the platform cache
     * @param appMetadataKey - lookup key to fetch cache type AppMetadataEntity
     */
    getAppMetadata(appMetadataKey: string): AppMetadataEntity | null {
        const appMetadata: AppMetadataEntity = this.getItem(
            appMetadataKey
        ) as AppMetadataEntity;
        if (CacheHelpers.isAppMetadataEntity(appMetadataKey, appMetadata)) {
            return appMetadata;
        }
        return null;
    }

    /**
     * set appMetadata entity to the platform cache
     * @param appMetadata - cache value to be set of type AppMetadataEntity
     */
    setAppMetadata(appMetadata: AppMetadataEntity): void {
        const appMetadataKey = CacheHelpers.generateAppMetadataKey(appMetadata);
        this.setItem(appMetadataKey, appMetadata);
    }

    /**
     * fetch server telemetry entity from the platform cache
     * @param serverTelemetrykey - lookup key to fetch cache type ServerTelemetryEntity
     */
    getServerTelemetry(
        serverTelemetrykey: string
    ): ServerTelemetryEntity | null {
        const serverTelemetryEntity: ServerTelemetryEntity = this.getItem(
            serverTelemetrykey
        ) as ServerTelemetryEntity;
        if (
            serverTelemetryEntity &&
            CacheHelpers.isServerTelemetryEntity(
                serverTelemetrykey,
                serverTelemetryEntity
            )
        ) {
            return serverTelemetryEntity;
        }
        return null;
    }

    /**
     * set server telemetry entity to the platform cache
     * @param serverTelemetryKey - lookup key to fetch cache type ServerTelemetryEntity
     * @param serverTelemetry - cache value to be set of type ServerTelemetryEntity
     */
    setServerTelemetry(
        serverTelemetryKey: string,
        serverTelemetry: ServerTelemetryEntity
    ): void {
        this.setItem(serverTelemetryKey, serverTelemetry);
    }

    /**
     * fetch authority metadata entity from the platform cache
     * @param key - lookup key to fetch cache type AuthorityMetadataEntity
     */
    getAuthorityMetadata(key: string): AuthorityMetadataEntity | null {
        const authorityMetadataEntity: AuthorityMetadataEntity = this.getItem(
            key
        ) as AuthorityMetadataEntity;
        if (
            authorityMetadataEntity &&
            CacheHelpers.isAuthorityMetadataEntity(key, authorityMetadataEntity)
        ) {
            return {
                ...authorityMetadataEntity,
                aliases: Array.isArray(authorityMetadataEntity.aliases)
                    ? [...authorityMetadataEntity.aliases]
                    : [],
            };
        }
        return null;
    }

    /**
     * Get all authority metadata keys
     */
    getAuthorityMetadataKeys(): Array<string> {
        return Array.from(this.authorityMetadataKeys);
    }

    /**
     * set authority metadata entity to the platform cache
     * @param key - lookup key to fetch cache type AuthorityMetadataEntity
     * @param metadata - cache value to be set of type AuthorityMetadataEntity
     */
    setAuthorityMetadata(key: string, metadata: AuthorityMetadataEntity): void {
        const snapshot = this.stableStringify(metadata);
        if (this.authorityMetadataSnapshots.get(key) === snapshot) {
            return;
        }

        const hadItem = Object.prototype.hasOwnProperty.call(this.cache, key);
        const previousValue = this.cache[key];
        const previousOrder = this.cacheKeyOrder.get(key);
        try {
            this.removeAuthorityMetadataFromIndexes(key);
            this.cache[key] = metadata;
            if (previousOrder !== undefined) {
                this.cacheKeyOrder.set(key, previousOrder);
            } else {
                this.cacheKeyOrder.set(key, this.nextCacheKeyOrder++);
            }
            this.addAuthorityMetadataToIndexes(key, metadata, snapshot);
        } catch (error) {
            if (hadItem) {
                this.cache[key] = previousValue;
            } else {
                delete this.cache[key];
            }
            this.rebuildIndexes();
            throw error;
        }
        this.emitChange();
    }

    /**
     * fetch throttling entity from the platform cache
     * @param throttlingCacheKey - lookup key to fetch cache type ThrottlingEntity
     */
    getThrottlingCache(throttlingCacheKey: string): ThrottlingEntity | null {
        const throttlingCache: ThrottlingEntity = this.getItem(
            throttlingCacheKey
        ) as ThrottlingEntity;
        if (
            throttlingCache &&
            CacheHelpers.isThrottlingEntity(throttlingCacheKey, throttlingCache)
        ) {
            return throttlingCache;
        }
        return null;
    }

    /**
     * set throttling entity to the platform cache
     * @param throttlingCacheKey - lookup key to fetch cache type ThrottlingEntity
     * @param throttlingCache - cache value to be set of type ThrottlingEntity
     */
    setThrottlingCache(
        throttlingCacheKey: string,
        throttlingCache: ThrottlingEntity
    ): void {
        this.setItem(throttlingCacheKey, throttlingCache);
    }

    /**
     * Removes the cache item from memory with the given key.
     * @param key - lookup key to remove a cache entity
     * @param inMemory - key value map of the cache
     */
    removeItem(key: string): boolean {
        this.logger.tracePii(`Item key: ${key}`, "");

        // read inMemoryCache
        let result: boolean = false;
        const cache = this.cache;

        if (!!cache[key]) {
            const value = cache[key];
            const isAuthorityMetadata =
                this.isAuthorityMetadata(key) ||
                (!!value &&
                    typeof value === "object" &&
                    CacheHelpers.isAuthorityMetadataEntity(key, value));
            delete cache[key];
            if (isAuthorityMetadata) {
                this.removeAuthorityMetadataFromIndexes(key);
                this.cacheKeyOrder.delete(key);
            } else {
                this.removeFromIndexes(key, value);
            }
            result = true;
        }

        // write to the cache after removal
        if (result) {
            this.emitChange();
        }
        return result;
    }

    /**
     * Remove account entity from the platform cache if it's outdated
     * @param accountKey - lookup key to fetch cache type AccountEntity
     */
    removeOutdatedAccount(accountKey: string): void {
        this.removeItem(accountKey);
    }

    /**
     * Checks whether key is in cache.
     * @param key - look up key for a cache entity
     */
    containsKey(key: string): boolean {
        return this.getKeys().includes(key);
    }

    /**
     * Gets all keys in window.
     */
    getKeys(): string[] {
        this.logger.trace("Retrieving all cache keys", "");

        // read cache
        const cache = this.cache;
        return [...Object.keys(cache)];
    }

    /**
     * Clears all cache entries created by MSAL except authority metadata..
     */
    clear(): void {
        this.logger.trace("Clearing cache entries created by MSAL", "");

        // read inMemoryCache
        const cacheKeys = this.getKeys();

        // delete each element
        cacheKeys.forEach((key) => {
            if (this.isAuthorityMetadata(key)) {
                return;
            }
            this.removeItem(key);
        });
        this.emitChange();
    }

    /**
     * Initialize in memory cache from an exisiting cache vault
     * @param cache - blob formatted cache (JSON)
     */
    static generateInMemoryCache(cache: string): InMemoryCache {
        return Deserializer.deserializeAllCache(
            Deserializer.deserializeJSONBlob(cache)
        );
    }

    /**
     * retrieves the final JSON
     * @param inMemoryCache - itemised cache read from the JSON
     */
    static generateJsonCache(inMemoryCache: InMemoryCache): JsonCache {
        return Serializer.serializeAllCache(inMemoryCache);
    }

    /**
     * Updates a credential's cache key if the current cache key is outdated
     */
    updateCredentialCacheKey(
        currentCacheKey: string,
        credential: ValidCredentialType
    ): string {
        const updatedCacheKey = this.generateCredentialKey(credential);

        if (currentCacheKey !== updatedCacheKey) {
            const cacheItem = this.getItem(currentCacheKey);
            if (cacheItem) {
                this.removeItem(currentCacheKey);
                this.setItem(updatedCacheKey, cacheItem);
                this.logger.verbose(
                    `Updated an outdated ${credential.credentialType} cache key`,
                    ""
                );
                return updatedCacheKey;
            } else {
                this.logger.error(
                    `Attempted to update an outdated ${credential.credentialType} cache key but no item matching the outdated key was found in storage`,
                    ""
                );
            }
        }

        return currentCacheKey;
    }
}
