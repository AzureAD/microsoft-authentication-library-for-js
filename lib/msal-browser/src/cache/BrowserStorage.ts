/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { IWindowStorage } from "./IWindowStorage";
import { BrowserConfigurationAuthError } from "../error/BrowserConfigurationAuthError";
import { BrowserAuthError } from "../error/BrowserAuthError";
import { BrowserConstants } from "../utils/BrowserConstants";

export class BrowserStorage implements IWindowStorage {

    private windowStorage: Storage;

    constructor(cacheLocation: string) {
        // Validate cache location
        this.validateWindowStorage(cacheLocation);

        this.windowStorage = window[cacheLocation];
    }

    /**
     * Validates the the given cache location string is an expected value:
     * - localStorage
     * - sessionStorage (default)
     * Also validates if given cacheLocation is supported on the browser.
     * @param cacheLocation
     */
    private validateWindowStorage(cacheLocation: string): void {
        if (typeof window === "undefined" || !window) {
            throw BrowserAuthError.createNoWindowObjectError();
        }

        if (cacheLocation !== BrowserConstants.CACHE_LOCATION_LOCAL && cacheLocation !== BrowserConstants.CACHE_LOCATION_SESSION) {
            throw BrowserConfigurationAuthError.createStorageNotSupportedError(cacheLocation);
        }

        const storageSupported = !!window[cacheLocation];
        if (!storageSupported) {
            throw BrowserConfigurationAuthError.createStorageNotSupportedError(cacheLocation);
        }
    }

    /**
     * Get the item from the window storage object matching the given key.
     * @param key 
     */
    getWindowStorageItem(key: string): string {
        return this.windowStorage.getItem(key);
    }

    /**
     * Sets the item in the window storage object with the given key.
     * @param key 
     * @param value 
     */
    setWindowStorageItem(key: string, value: string): void {
        this.windowStorage.setItem(key, value);
    }

    /**
     * Removes the item in the window storage object matching the given key.
     * @param key 
     */
    removeWindowStorageItem(key: string): void {
        this.windowStorage.removeItem(key);
    }

    /**
     * Get all the keys from the window storage object as an iterable array of strings.
     */
    getWindowStorageKeys(): string[] {
        return Object.keys(this.windowStorage);
    }

    /**
     * Returns true or false if the given key is present in the cache.
     * @param key 
     */
    windowStorageContainsItem(key: string): boolean {
        return this.windowStorage.hasOwnProperty(key);
    }
}
