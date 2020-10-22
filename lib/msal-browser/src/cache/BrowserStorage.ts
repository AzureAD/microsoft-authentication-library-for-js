/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { BrowserConfigurationAuthError } from "../error/BrowserConfigurationAuthError";
import { BrowserConstants } from "../utils/BrowserConstants";
import { IWindowStorage } from "./IWindowStorage";

export class BrowserStorage implements IWindowStorage {

    private _windowStorage: Storage;
    private cacheLocation: string;

    public get windowStorage(): Storage {
        if (!this._windowStorage) {
            this._windowStorage = window[this.cacheLocation];
        }

        return this._windowStorage;
    }

    constructor(cacheLocation: string) {
        this.validateWindowStorage(cacheLocation);
        this.cacheLocation = cacheLocation;
    }

    private validateWindowStorage(cacheLocation: string) {
        if (cacheLocation !== BrowserConstants.CACHE_LOCATION_LOCAL && cacheLocation !== BrowserConstants.CACHE_LOCATION_SESSION) {
            throw BrowserConfigurationAuthError.createStorageNotSupportedError(cacheLocation);
        }
        const storageSupported = !!window[cacheLocation];
        if (!storageSupported) {
            throw BrowserConfigurationAuthError.createStorageNotSupportedError(cacheLocation);
        }
    }

    getItem(key: string): string {
        return this.windowStorage.getItem(key);
    }

    setItem(key: string, value: string): void {
        this.windowStorage.setItem(key, value);
    }

    removeItem(key: string): void {
        this.windowStorage.removeItem(key);
    }

    getKeys(): string[] {
        return Object.keys(this.windowStorage);
    }

    containsItem(key: string): boolean {
        return this.windowStorage.hasOwnProperty(key);
    }
}
