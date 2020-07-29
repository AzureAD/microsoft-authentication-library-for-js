/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * Interface object for window storage. TODO: Add link to custom cache docs.
 */
export interface IWindowStorage {

    /**
     * Get the item from the window storage object matching the given key.
     * @param key 
     */
    getWindowStorageItem(key: string): string;

    /**
     * Sets the item in the window storage object with the given key.
     * @param key 
     * @param value 
     */
    setWindowStorageItem(key: string, value: string): void;

    /**
     * Removes the item in the window storage object matching the given key.
     * @param key 
     */
    removeWindowStorageItem(key: string): void;

    /**
     * Get all the keys from the window storage object as an iterable array of strings.
     */
    getWindowStorageKeys(): string[];

    /**
     * Returns true or false if the given key is present in the cache.
     * @param key 
     */
    windowStorageContainsItem(key: string): boolean;
}
