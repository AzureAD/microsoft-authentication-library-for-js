/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { InMemoryCache } from "../unifiedCache/utils/CacheTypes";

/**
 * Interface class which implement cache storage functions used by MSAL to perform validity checks, and store tokens.
 */
export interface ICacheStorage {
    /**
     * Function to read serialized Cache from disk
     * @param key
     * @param value
     */
    getCache(): InMemoryCache;

    /**
     * Function to write serialized Cache to disk
     * @param cache
     */
    setCache(cache: InMemoryCache): void;

    /**
     * Function to set item in cache.
     * @param key
     * @param value
     */
    setItem(key: string, value: string): void;

    /**
     * Function to set item in Memory
     * @param key
     * @param value
     * @param type
     */
    setItemInMemory(key: string, value: object, type?: string): void;

    /**
     * Function which retrieves item from cache.
     * @param key
     */
    getItem(key: string): string;

    /**
     * Function to get an item from memory
     * @param key
     * @param type
     */
    getItemFromMemory(key: string, type?: string): object;

    /**
     * Function to remove an item from cache given its key.
     * @param key
     */
    removeItem(key: string): boolean;

    /**
     * Function to remove an item from memory given its key
     * @param key
     * @param type
     */
    removeItemFromMemory(key: string, type?: string): boolean;

    /**
     * Function which returns boolean whether cache contains a specific key.
     * @param key
     */
    containsKey(key: string): boolean;

    /**
     * Function which retrieves all current keys from the cache.
     */
    getKeys(): string[];

    /**
     * Function which clears cache.
     */
    clear(): void;
}
