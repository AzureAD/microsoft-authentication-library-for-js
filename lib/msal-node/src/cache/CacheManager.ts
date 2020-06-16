/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Storage } from './Storage';
import {
    Serializer,
    Deserializer,
    JsonCache,
    ClientAuthError,
    StringUtils
} from '@azure/msal-common';
import { ICachePlugin } from './ICachePlugin';

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
export class CacheManager {

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
        let finalState = Serializer.serializeAllCache(this.storage.getCache());

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
            const deserializedCache = Deserializer.deserializeAllCache(this.overlayDefaults(JSON.parse(this.cacheSnapshot)));
            this.storage.setCache(deserializedCache);
        }
    }

    /**
     * Serializes cache into JSON and calls ICachePlugin.writeToStorage. ICachePlugin must be set on ClientApplication
     */
    async writeToPersistence(): Promise<void> {
        if (this.persistence) {
            let cache = Serializer.serializeAllCache(this.storage.getCache());

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
                const cache = this.overlayDefaults(JSON.parse(this.cacheSnapshot));
                const deserializedCache = Deserializer.deserializeAllCache(cache);
                this.storage.setCache(deserializedCache);
            }
        } else {
            throw ClientAuthError.createCachePluginError();
        }
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
        Object.keys(newState).forEach((newKey) => {
            let newValue = newState[newKey];

            // if oldState does not contain value but newValue does, add it
            if (!oldState.hasOwnProperty(newKey)) {
                if (newValue != null) {
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
        // set of entities created because we only want to remove these. If the oldState contains any other things,
        // we leave them untouched
        const entities = new Set(["Account", "AccessToken", "RefreshToken", "IdToken", "AppMetadata"]);

        entities.forEach((entity: string) => {
            let oldEntries = oldState[entity];
            let newEntries = newState[entity];
            // if entity is in oldState but not in newState remove it
            if (oldEntries != null) {
                Object.keys(oldEntries).forEach((oldKey) => {
                    if (!newEntries || !(newEntries.hasOwnProperty(oldKey))) {
                        delete oldEntries[oldKey];
                    }
                })
            }
        });
        return oldState;
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
