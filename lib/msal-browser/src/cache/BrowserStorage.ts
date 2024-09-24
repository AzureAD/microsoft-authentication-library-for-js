/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    BrowserConfigurationAuthErrorCodes,
    createBrowserConfigurationAuthError,
} from "../error/BrowserConfigurationAuthError.js";
import { BrowserCacheLocation } from "../utils/BrowserConstants.js";
import { IWindowStorage } from "./IWindowStorage.js";

export class BrowserStorage implements IWindowStorage<string> {
    private windowStorage: Storage;

    constructor(cacheLocation: string) {
        this.validateWindowStorage(cacheLocation);
        this.windowStorage = window[cacheLocation];
    }

    private validateWindowStorage(cacheLocation: string): void {
        if (
            (cacheLocation !== BrowserCacheLocation.LocalStorage &&
                cacheLocation !== BrowserCacheLocation.SessionStorage) ||
            !window[cacheLocation]
        ) {
            throw createBrowserConfigurationAuthError(
                BrowserConfigurationAuthErrorCodes.storageNotSupported
            );
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
        return Object.keys(this.windowStorage);
    }

    containsKey(key: string): boolean {
        return this.windowStorage.hasOwnProperty(key);
    }
}
