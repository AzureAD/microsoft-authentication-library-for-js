/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

export interface IWindowStorage<T> {
    /**
     * Get the item from the window storage object matching the given key.
     * @param key
     */
    getItem(key: string): T | null;

    /**
     * Sets the item in the window storage object with the given key.
     * @param key
     * @param value
     */
    setItem(key: string, value: T): void;

    /**
     * Removes the item in the window storage object matching the given key.
     * @param key
     */
    removeItem(key: string): void;

    /**
     * Get all the keys from the window storage object as an iterable array of strings.
     */
    getKeys(): string[];

    /**
     * Returns true or false if the given key is present in the cache.
     * @param key
     */
    containsKey(key: string): boolean;
}
