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
import { LocalStorage } from "./LocalStorage.js";
import { SessionStorage } from "./SessionStorage.js";

/**
 * @deprecated This class will be removed in a future major version
 */
export class BrowserStorage implements IWindowStorage<string> {
    private windowStorage: IWindowStorage<string>;

    constructor(cacheLocation: string) {
        if (cacheLocation === BrowserCacheLocation.LocalStorage) {
            this.windowStorage = new LocalStorage();
        } else if (cacheLocation === BrowserCacheLocation.SessionStorage) {
            this.windowStorage = new SessionStorage();
        } else {
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
