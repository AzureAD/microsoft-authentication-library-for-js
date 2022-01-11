/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { BrowserConfigurationAuthError } from "../error/BrowserConfigurationAuthError";
import { BrowserCacheLocation } from "../utils/BrowserConstants";
import { IWindowStorage } from "./IWindowStorage";

export class BrowserStorage implements IWindowStorage<string> {

    private windowStorage: Storage;

    constructor(cacheLocation: string) {
        this.validateWindowStorage(cacheLocation);
        this.windowStorage = window[cacheLocation];
    }

    private validateWindowStorage(cacheLocation: string): void {
        if (cacheLocation !== BrowserCacheLocation.LocalStorage && cacheLocation !== BrowserCacheLocation.SessionStorage) {
            throw BrowserConfigurationAuthError.createStorageNotSupportedError(cacheLocation);
        }
        const storageSupported = !!window[cacheLocation];
        if (!storageSupported) {
            throw BrowserConfigurationAuthError.createStorageNotSupportedError(cacheLocation);
        }
    }

    getItem(key: string): string | null {
        return this.windowStorage.getItem(key);
    }

    setItem(key: string, value: string): void {
        this.windowStorage.setItem(key, value);
    }

    removeItem(key: string): void {
        this.windowStorage.removeItem(key);
    }

    getKeys(): string[] {
        const keys: string[] = [];

        // Manually iterate to properly support environments where localStorage/sessionStorage are not enumerable, e.g. Salesforce
        for (let i = 0; i < this.windowStorage.length; ++i) {
            keys.push(this.windowStorage.key(i) || "");
        }

        return keys;
    }

    containsKey(key: string): boolean {
        return this.windowStorage.hasOwnProperty(key);
    }
}
