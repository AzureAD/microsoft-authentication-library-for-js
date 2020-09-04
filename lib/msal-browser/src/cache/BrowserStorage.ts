/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { IWindowStorage } from "./IWindowStorage";
import { BrowserConfigurationAuthError } from "../error/BrowserConfigurationAuthError";
import { BrowserConstants } from "../utils/BrowserConstants";
import { BrowserUtils } from "../utils/BrowserUtils";
import { BrowserAuthError } from "../error/BrowserAuthError";

export class BrowserStorage implements IWindowStorage {

    private _windowStorage: Storage;
    private cacheLocation: string;
    private isBrowserEnvironment: boolean;

    public get windowStorage() : Storage {
        if (!this._windowStorage) {
            this._windowStorage = window[this.cacheLocation];
        }

        return this._windowStorage;
    }

    constructor(cacheLocation: string) {
        // Validate cache location
        this.validateWindowStorage(cacheLocation);

        this.cacheLocation = cacheLocation;
        this.isBrowserEnvironment = typeof window !== "undefined";
    }

    /**
     * Validates the the given cache location string is an expected value:
     * - localStorage
     * - sessionStorage (default)
     * Also validates if given cacheLocation is supported on the browser.
     * @param cacheLocation
     */
    private validateWindowStorage(cacheLocation: string): void {
        if (cacheLocation !== BrowserConstants.CACHE_LOCATION_LOCAL && cacheLocation !== BrowserConstants.CACHE_LOCATION_SESSION) {
            throw BrowserConfigurationAuthError.createStorageNotSupportedError(cacheLocation);
        }

        try {
            BrowserUtils.blockNonBrowserEnvironment();
        } catch(err) {
            throw err;
        }

        if (!this.isBrowserEnvironment) {
            return;
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
        BrowserUtils.blockNonBrowserEnvironment();
        return this.windowStorage.getItem(key);
    }

    /**
     * Sets the item in the window storage object with the given key.
     * @param key 
     * @param value 
     */
    setWindowStorageItem(key: string, value: string): void {
        BrowserUtils.blockNonBrowserEnvironment();
        this.windowStorage.setItem(key, value);
    }

    /**
     * Removes the item in the window storage object matching the given key.
     * @param key 
     */
    removeWindowStorageItem(key: string): void {
        BrowserUtils.blockNonBrowserEnvironment();
        this.windowStorage.removeItem(key);
    }

    /**
     * Get all the keys from the window storage object as an iterable array of strings.
     */
    getWindowStorageKeys(): string[] {
        BrowserUtils.blockNonBrowserEnvironment();
        return Object.keys(this.windowStorage);
    }

    /**
     * Returns true or false if the given key is present in the cache.
     * @param key 
     */
    windowStorageContainsItem(key: string): boolean {
        BrowserUtils.blockNonBrowserEnvironment();
        return this.windowStorage.hasOwnProperty(key);
    }
}
