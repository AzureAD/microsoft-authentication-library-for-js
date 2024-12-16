/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    BrowserConfigurationAuthErrorCodes,
    createBrowserConfigurationAuthError,
} from "../error/BrowserConfigurationAuthError.js";
import { IWindowStorage } from "./IWindowStorage.js";

export class LocalStorage implements IWindowStorage<string> {
    constructor() {
        if (!window.localStorage) {
            throw createBrowserConfigurationAuthError(
                BrowserConfigurationAuthErrorCodes.storageNotSupported
            );
        }
    }

    getItem(key: string): string | null {
        return window.localStorage.getItem(key);
    }

    setItem(key: string, value: string): void {
        window.localStorage.setItem(key, value);
    }

    removeItem(key: string): void {
        window.localStorage.removeItem(key);
    }

    getKeys(): string[] {
        return Object.keys(window.localStorage);
    }

    containsKey(key: string): boolean {
        return window.localStorage.hasOwnProperty(key);
    }
}
