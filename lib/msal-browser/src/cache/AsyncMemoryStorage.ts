/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { DatabaseStorage } from "./DatabaseStorage";
import { IAsyncStorage } from "./IAsyncMemoryStorage";
import { MemoryStorage } from "./MemoryStorage";

/**
 * This class allows MSAL to store artifacts asynchronously using the DatabaseStorage IndexedDB wrapper,
 * backed up with the more volatile MemoryStorage object for cases in which IndexedDB may be unavailable.
 */
export class AsyncMemoryStorage<T> implements IAsyncStorage<T> {
    private inMemoryCache: MemoryStorage<T>;
    private indexedDBCache: DatabaseStorage<T>;

    constructor() {
        this.inMemoryCache = new MemoryStorage<T>();
        this.indexedDBCache = new DatabaseStorage<T>();
    }

    /**
     * Get the item matching the given key. Tries in-memory cache first, then in the asynchronous
     * storage object if item isn't found in-memory.
     * @param key 
     */
    async getItem(key: string): Promise<T | null> {
        const item =this.inMemoryCache.getItem(key);
        if(!item) {
            try {
                return await this.indexedDBCache.getItem(key);
            } catch (e) {
                // Do nothing if IndexedDB is unavailable
            }
        }
        return item;
    }

    /**
     * Sets the item in the in-memory cache and then tries to set it in the asynchronous
     * storage object with the given key.
     * @param key 
     * @param value 
     */
    async setItem(key: string, value: T): Promise<void> {
        this.inMemoryCache.setItem(key, value);
        try {
            await this.indexedDBCache.setItem(key, value);
        } catch (e) {
            // Do nothing if IndexedDB is unavailable
        }
    }

    /**
     * Removes the item matching the key from the in-memory cache, then tries to remove it from the asynchronous storage object.
     * @param key 
     */
    async removeItem(key: string): Promise<void> {
        this.inMemoryCache.removeItem(key);
        try {
            await this.indexedDBCache.removeItem(key);
        } catch (e) {
            // Do nothing if IndexedDB is unavailable
        }
    }

    /**
     * Get all the keys from the in-memory cache as an iterable array of strings. If no keys are found, query the keys in the 
     * asynchronous storage object.
     */
    async getKeys(): Promise<string[]> {
        const cacheKeys = this.inMemoryCache.getKeys();
        if (cacheKeys.length === 0) {
            try {
                return await this.indexedDBCache.getKeys();
            } catch (e) {
                // Do nothing if IndexedDB is unavailable
            }
        }
        return cacheKeys;
    }

    /**
     * Returns true or false if the given key is present in the cache.
     * @param key 
     */
    async containsKey(key: string): Promise<boolean> {
        const containsKey = this.inMemoryCache.containsKey(key);
        if(!containsKey) {
            try {
                return await this.indexedDBCache.containsKey(key);
            } catch (e) {
                // Do nothing if IndexedDB is unavailable
            }
        }
        return containsKey;
    }

    /**
     * Clears in-memory Map and tries to delete the IndexedDB database.
     */
    async clear(): Promise<void> {
        this.inMemoryCache.clear();
        try {
            await this.indexedDBCache.deleteDatabase();
        } catch (e) {
            // Do nothing if IndexedDB is unavailable
        }
    }
}
