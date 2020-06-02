/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { ICacheStorage, InMemoryCache } from '@azure/msal-common';

/**
 * This class implements Storage for node, reading cache from user specified storage location or an  extension library
 */
export class Storage implements ICacheStorage {
    // Cache configuration, either set by user or default values.
    private inMemoryCache: InMemoryCache = {
        accounts: {},
        accessTokens: {},
        refreshTokens: {},
        appMetadata: {},
        idTokens: {},
    };
    private changeEmitters: Array<Function> = [];

    registerChangeEmitter(func: () => void): void {
        this.changeEmitters.push(func);
    }

    emitChange() {
        this.changeEmitters.forEach(func => func.call(null));
    }

    /**
     * gets the current in memory cache for the client
     */
    getCache(): InMemoryCache {
        return this.inMemoryCache;
    }

    /**
     * sets the current in memory cache for the client
     * @param inMemoryCache
     */
    setCache(inMemoryCache: InMemoryCache) {
        this.inMemoryCache = inMemoryCache;
        this.emitChange();
    }

    /**
     * Sets the cache item with the key and value given.
     * @param key
     * @param value
     * TODO: implement after the lookup implementation
     */
    setItem(key: string, value: string): void {
        if (key && value) {
            this.emitChange();
            return;
        }
        this.emitChange();
    }

    /**
     * Gets cache item with given key.
     * Will retrieve frm cookies if storeAuthStateInCookie is set to true.
     * @param key
     * TODO: implement after the lookup implementation
     */
    getItem(key: string): string {
        return key ? 'random' : 'truly random';
    }

    /**
     * Removes the cache item with the given key.
     * Will also clear the cookie item if storeAuthStateInCookie is set to true.
     * @param key
     * TODO: implement after the lookup implementation
     */
    removeItem(key: string): void {
        if (!key) {
            this.emitChange();
            return;
        }
        this.emitChange();
    }

    /**
     * Checks whether key is in cache.
     * @param key
     * TODO: implement after the lookup implementation
     */
    containsKey(key: string): boolean {
        return key ? true : false;
    }

    /**
     * Gets all keys in window.
     * TODO: implement after the lookup implementation
     */
    getKeys(): string[] {
        return [];
    }

    /**
     * Clears all cache entries created by MSAL (except tokens).
     */
    clear(): void {
        this.emitChange();
        return;
    }
}
