/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * Interface class which implement cache storage functions used by MSAL to perform validity checks, and store tokens.
 */
export interface ICacheStorage {
    /**
     * Function to set item in cache.
     * @param key 
     * @param value 
     */
    setItem(key: string, value: string): void;
    /**
     * Function which retrieves item from cache.
     * @param key 
     */
    getItem(key: string): string;
    /**
     * Function which removes item from cache.
     * @param key 
     */
    removeItem(key: string): void;
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
