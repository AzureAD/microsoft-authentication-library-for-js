/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Storage } from './Storage';
import { ClientAuthError, StringUtils, AccountEntity, AccountInfo} from '@azure/msal-common';
import { InMemoryCache, JsonCache, SerializedAccountEntity, SerializedAccessTokenEntity, SerializedRefreshTokenEntity, SerializedIdTokenEntity, SerializedAppMetadataEntity } from './serializer/SerializerTypes';
import { ICachePlugin } from './ICachePlugin';
import { Deserializer } from './serializer/Deserializer';
import { Serializer } from './serializer/Serializer';

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
export class TokenCache {

    private storage: Storage;
    private hasChanged: boolean;
    private cacheSnapshot: string;
    private readonly persistence: ICachePlugin;

    constructor(storage: Storage, cachePlugin?: ICachePlugin) {
        this.hasChanged = false;
        this.storage = storage;
        this.storage.registerChangeEmitter(this.handleChangeEvent.bind(this));
        if (cachePlugin) {
            this.persistence = cachePlugin;
        }
    }

    /**
     * Set to true if cache state has changed since last time serialized() or writeToPersistence was called
     */
    cacheHasChanged(): boolean {
        return this.hasChanged;
    }

    /**
     * Serializes in memory cache to JSON
     */
    serialize(): string {
        let finalState = Serializer.serializeAllCache(
            this.storage.getCache() as InMemoryCache
        );

        // if cacheSnapshot not null or empty, merge
        if (!StringUtils.isEmpty(this.cacheSnapshot)) {
            finalState = this.mergeState(
                JSON.parse(this.cacheSnapshot),
                finalState
            );
        }
        this.hasChanged = false;

        return JSON.stringify(finalState);
    }

    /**
     * Deserializes JSON to in-memory cache. JSON should be in MSAL cache schema format
     * @param cache
     */
    deserialize(cache: string): void {
        this.cacheSnapshot = cache;

        if (!StringUtils.isEmpty(this.cacheSnapshot)) {
            const deserializedCache = Deserializer.deserializeAllCache(
                this.overlayDefaults(JSON.parse(this.cacheSnapshot))
            );
            this.storage.setCache(deserializedCache);
        }
    }

    /**
     * Serializes cache into JSON and calls ICachePlugin.writeToStorage. ICachePlugin must be set on ClientApplication
     */
    async writeToPersistence(): Promise<void> {
        if (this.persistence) {
            let cache = Serializer.serializeAllCache(this.storage.getCache() as InMemoryCache);
            const getMergedState = (stateFromDisk: string) => {
                if (!StringUtils.isEmpty(stateFromDisk)) {
                    this.cacheSnapshot = stateFromDisk;
                    cache = this.mergeState(JSON.parse(stateFromDisk), cache);
                }

                return JSON.stringify(cache);
            };

            await this.persistence.writeToStorage(getMergedState);
            this.hasChanged = false;
        } else {
            throw ClientAuthError.createCachePluginError();
        }
    }

    /**
     * Calls ICachePlugin.readFromStorage and deserializes JSON to in-memory cache.
     * ICachePlugin must be set on ClientApplication.
     */
    async readFromPersistence(): Promise<void> {
        if (this.persistence) {
            this.cacheSnapshot = await this.persistence.readFromStorage();

            if (!StringUtils.isEmpty(this.cacheSnapshot)) {
                const cache = this.overlayDefaults(
                    JSON.parse(this.cacheSnapshot)
                );
                const deserializedCache = Deserializer.deserializeAllCache(
                    cache
                );
                this.storage.setCache(deserializedCache);
            }
        } else {
            throw ClientAuthError.createCachePluginError();
        }
    }


    /**
     * API that retrieves all accounts currently in cache to the user
     */
    getAllAccounts(): AccountInfo[] {
        return this.storage.getAllAccounts();
    }

    /**
     * API to remove a specific account and the relevant data from cache
     * @param account
     */
    removeAccount(account: AccountInfo) {
        this.storage.removeAccount(
            AccountEntity.generateAccountCacheKey(account)
        );
    }

    /**
     * Called when the cache has changed state.
     */
    private handleChangeEvent() {
        this.hasChanged = true;
    }

    /**
     * Merge in memory cache with the cache snapshot.
     * @param oldState
     * @param currentState
     */
    private mergeState(oldState: JsonCache, currentState: JsonCache): JsonCache {
        let stateAfterRemoval = this.mergeRemovals(oldState, currentState);
        return this.mergeUpdates(stateAfterRemoval, currentState);
    }

    /**
     * Deep update of oldState based on newState values
     * @param oldState
     * @param newState
     */
    private mergeUpdates(oldState: any, newState: any): JsonCache {
        Object.keys(newState).forEach((newKey: string) => {
            let newValue = newState[newKey];

            // if oldState does not contain value but newValue does, add it
            if (!oldState.hasOwnProperty(newKey)) {
                if (newValue !== null) {
                    oldState[newKey] = newValue;
                }
            } else {
                // both oldState and newState contain the key, do deep update
                let newValueNotNull = newValue !== null;
                let newValueIsObject = typeof newValue === 'object';
                let newValueIsNotArray = !Array.isArray(newValue);

                if (newValueNotNull && newValueIsObject && newValueIsNotArray) {
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
        const accounts = oldState.Account != null ? this.mergeRemovalsDict<SerializedAccountEntity>(oldState.Account, newState.Account) : oldState.Account;
        const accessTokens = oldState.AccessToken != null ? this.mergeRemovalsDict<SerializedAccessTokenEntity>(oldState.AccessToken, newState.AccessToken) : oldState.AccessToken;
        const refreshTokens = oldState.RefreshToken != null ? this.mergeRemovalsDict<SerializedRefreshTokenEntity>(oldState.RefreshToken, newState.RefreshToken) : oldState.RefreshToken;
        const idTokens = oldState.IdToken != null ? this.mergeRemovalsDict<SerializedIdTokenEntity>(oldState.IdToken, newState.IdToken) : oldState.IdToken;
        const appMetadata = oldState.AppMetadata != null ? this.mergeRemovalsDict<SerializedAppMetadataEntity>(oldState.AppMetadata, newState.AppMetadata) : oldState.AppMetadata;

        return {
            Account: accounts,
            AccessToken: accessTokens,
            RefreshToken: refreshTokens,
            IdToken: idTokens,
            AppMetadata: appMetadata,
            ...oldState
        };
    }

    private mergeRemovalsDict<T>(oldState: Record<string, T>, newState?: Record<string, T>): Record<string, T> {
        let finalState = {...oldState};
        Object.keys(oldState).forEach((oldKey) => {
            if (!newState || !(newState.hasOwnProperty(oldKey))) {
                delete finalState[oldKey];
            }
        });
        return finalState;
    }

    private overlayDefaults(passedInCache: JsonCache): JsonCache {
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
