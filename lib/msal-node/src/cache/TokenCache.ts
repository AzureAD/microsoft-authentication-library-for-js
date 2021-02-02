/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Storage } from "./Storage";
import { StringUtils, AccountEntity, AccountInfo, Logger, ISerializableTokenCache, ICachePlugin, TokenCacheContext } from "@azure/msal-common";
import { InMemoryCache, JsonCache, SerializedAccountEntity, SerializedAccessTokenEntity, SerializedRefreshTokenEntity, SerializedIdTokenEntity, SerializedAppMetadataEntity, CacheKVStore } from "./serializer/SerializerTypes";
import { Deserializer } from "./serializer/Deserializer";
import { Serializer } from "./serializer/Serializer";
import { ITokenCache } from "./ITokenCache";

const defaultSerializedCache: JsonCache = {
    Account: {},
    IdToken: {},
    AccessToken: {},
    RefreshToken: {},
    AppMetadata: {},
};

/**
 * In-memory token cache manager
 */
export class TokenCache implements ISerializableTokenCache, ITokenCache {

    private storage: Storage;
    private cacheHasChanged: boolean;
    private cacheSnapshot: string;
    private readonly persistence: ICachePlugin;
    private logger: Logger;

    constructor(storage: Storage, logger: Logger, cachePlugin?: ICachePlugin) {
        this.cacheHasChanged = false;
        this.storage = storage;
        this.storage.registerChangeEmitter(this.handleChangeEvent.bind(this));
        if (cachePlugin) {
            this.persistence = cachePlugin;
        }
        this.logger = logger;
    }

    /**
     * Set to true if cache state has changed since last time serialize or writeToPersistence was called
     */
    hasChanged(): boolean {
        return this.cacheHasChanged;
    }

    /**
     * Serializes in memory cache to JSON
     */
    serialize(): string {
        this.logger.verbose("Serializing in-memory cache");
        let finalState = Serializer.serializeAllCache(
            this.storage.getInMemoryCache() as InMemoryCache
        );

        // if cacheSnapshot not null or empty, merge
        if (!StringUtils.isEmpty(this.cacheSnapshot)) {
            this.logger.verbose("Reading cache snapshot from disk");
            finalState = this.mergeState(
                JSON.parse(this.cacheSnapshot),
                finalState
            );
        } else {
            this.logger.verbose("No cache snapshot to merge");
        }
        this.cacheHasChanged = false;

        return JSON.stringify(finalState);
    }

    /**
     * Deserializes JSON to in-memory cache. JSON should be in MSAL cache schema format
     * @param cache
     */
    deserialize(cache: string): void {
        this.logger.verbose("Deserializing JSON to in-memory cache");
        this.cacheSnapshot = cache;

        if (!StringUtils.isEmpty(this.cacheSnapshot)) {
            this.logger.verbose("Reading cache snapshot from disk");
            const deserializedCache = Deserializer.deserializeAllCache(
                this.overlayDefaults(JSON.parse(this.cacheSnapshot))
            );
            this.storage.setInMemoryCache(deserializedCache);
        } else {
            this.logger.verbose("No cache snapshot to deserialize");
        }
    }

    getKVStore(): CacheKVStore {
        return this.storage.getCache();
    }

    /**
     * API that retrieves all accounts currently in cache to the user
     */
    async getAllAccounts(): Promise<AccountInfo[]> {

        this.logger.verbose("getAllAccounts called");
        let cacheContext;
        try {
            if (this.persistence) {
                cacheContext = new TokenCacheContext(this, false);
                await this.persistence.beforeCacheAccess(cacheContext);
            }
            return this.storage.getAllAccounts();
        } finally {
            if (this.persistence && cacheContext) {
                await this.persistence.afterCacheAccess(cacheContext);
            }
        }
    }

    /**
     * Returns the signed in account matching homeAccountId.
     * (the account object is created at the time of successful login)
     * or null when no matching account is found
     * @returns {@link AccountInfo} - the account object stored in MSAL
     */
    async getAccountByHomeId(homeAccountId: string): Promise<AccountInfo | null> {
        const allAccounts = await this.getAllAccounts();
        if (!StringUtils.isEmpty(homeAccountId) && allAccounts && allAccounts.length) {
            return allAccounts.filter(accountObj => accountObj.homeAccountId === homeAccountId)[0] || null;
        } else {
            return null;
        }
    }

    /**
     * Returns the signed in account matching localAccountId.
     * (the account object is created at the time of successful login)
     * or null when no matching account is found
     * @returns {@link AccountInfo} - the account object stored in MSAL
     */
    async getAccountByLocalId(localAccountId: string): Promise<AccountInfo | null> {
        const allAccounts = await this.getAllAccounts();
        if (!StringUtils.isEmpty(localAccountId) && allAccounts && allAccounts.length) {
            return allAccounts.filter(accountObj => accountObj.localAccountId === localAccountId)[0] || null;
        } else {
            return null;
        }
    }

    /**
     * API to remove a specific account and the relevant data from cache
     * @param account
     */
    async removeAccount(account: AccountInfo): Promise<void> {
        this.logger.verbose("removeAccount called");
        let cacheContext;
        try {
            if (this.persistence) {
                cacheContext = new TokenCacheContext(this, true);
                await this.persistence.beforeCacheAccess(cacheContext);
            }
            this.storage.removeAccount(AccountEntity.generateAccountCacheKey(account));
        } finally {
            if (this.persistence && cacheContext) {
                await this.persistence.afterCacheAccess(cacheContext);
            }
        }
    }

    /**
     * Called when the cache has changed state.
     */
    private handleChangeEvent() {
        this.cacheHasChanged = true;
    }

    /**
     * Merge in memory cache with the cache snapshot.
     * @param oldState
     * @param currentState
     */
    private mergeState(oldState: JsonCache, currentState: JsonCache): JsonCache {
        this.logger.verbose("Merging in-memory cache with cache snapshot");
        const stateAfterRemoval = this.mergeRemovals(oldState, currentState);
        return this.mergeUpdates(stateAfterRemoval, currentState);
    }

    /**
     * Deep update of oldState based on newState values
     * @param oldState
     * @param newState
     */
    private mergeUpdates(oldState: any, newState: any): JsonCache {
        Object.keys(newState).forEach((newKey: string) => {
            const newValue = newState[newKey];

            // if oldState does not contain value but newValue does, add it
            if (!oldState.hasOwnProperty(newKey)) {
                if (newValue !== null) {
                    oldState[newKey] = newValue;
                }
            } else {
                // both oldState and newState contain the key, do deep update
                const newValueNotNull = newValue !== null;
                const newValueIsObject = typeof newValue === "object";
                const newValueIsNotArray = !Array.isArray(newValue);
                const oldStateNotUndefinedOrNull = typeof oldState[newKey] !== "undefined" && oldState[newKey] !== null;

                if (newValueNotNull && newValueIsObject && newValueIsNotArray && oldStateNotUndefinedOrNull) {
                    this.mergeUpdates(oldState[newKey], newValue);
                } else {
                    oldState[newKey] = newValue;
                }
            }
        });

        return oldState;
    }

    /**
     * Removes entities in oldState that the were removed from newState. If there are any unknown values in root of
     * oldState that are not recognized, they are left untouched.
     * @param oldState
     * @param newState
     */
    private mergeRemovals(oldState: JsonCache, newState: JsonCache): JsonCache {
        this.logger.verbose("Remove updated entries in cache");
        const accounts = oldState.Account ? this.mergeRemovalsDict<SerializedAccountEntity>(oldState.Account, newState.Account) : oldState.Account;
        const accessTokens = oldState.AccessToken ? this.mergeRemovalsDict<SerializedAccessTokenEntity>(oldState.AccessToken, newState.AccessToken) : oldState.AccessToken;
        const refreshTokens = oldState.RefreshToken ? this.mergeRemovalsDict<SerializedRefreshTokenEntity>(oldState.RefreshToken, newState.RefreshToken) : oldState.RefreshToken;
        const idTokens = oldState.IdToken ? this.mergeRemovalsDict<SerializedIdTokenEntity>(oldState.IdToken, newState.IdToken) : oldState.IdToken;
        const appMetadata = oldState.AppMetadata ? this.mergeRemovalsDict<SerializedAppMetadataEntity>(oldState.AppMetadata, newState.AppMetadata) : oldState.AppMetadata;

        return {
            ...oldState,
            Account: accounts,
            AccessToken: accessTokens,
            RefreshToken: refreshTokens,
            IdToken: idTokens,
            AppMetadata: appMetadata
        };
    }

    private mergeRemovalsDict<T>(oldState: Record<string, T>, newState?: Record<string, T>): Record<string, T> {
        const finalState = { ...oldState };
        Object.keys(oldState).forEach((oldKey) => {
            if (!newState || !(newState.hasOwnProperty(oldKey))) {
                delete finalState[oldKey];
            }
        });
        return finalState;
    }

    private overlayDefaults(passedInCache: JsonCache): JsonCache {
        this.logger.verbose("Overlaying input cache with the default cache");
        return {
            Account: {
                ...defaultSerializedCache.Account,
                ...passedInCache.Account,
            },
            IdToken: {
                ...defaultSerializedCache.IdToken,
                ...passedInCache.IdToken,
            },
            AccessToken: {
                ...defaultSerializedCache.AccessToken,
                ...passedInCache.AccessToken,
            },
            RefreshToken: {
                ...defaultSerializedCache.RefreshToken,
                ...passedInCache.RefreshToken,
            },
            AppMetadata: {
                ...defaultSerializedCache.AppMetadata,
                ...passedInCache.AppMetadata,
            },
        };
    }
}
