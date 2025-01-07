/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    BrowserConfigurationAuthErrorCodes,
    createBrowserConfigurationAuthError,
} from "../error/BrowserConfigurationAuthError.js";
import { IWindowStorage } from "./IWindowStorage.js";

export class SessionStorage implements IWindowStorage<string> {
    constructor() {
        if (!window.sessionStorage) {
            throw createBrowserConfigurationAuthError(
                BrowserConfigurationAuthErrorCodes.storageNotSupported
            );
        }
    }

    getItem(key: string): string | null {
        return window.sessionStorage.getItem(key);
    }

    setItem(key: string, value: string): void {
        window.sessionStorage.setItem(key, value);
    }

    removeItem(key: string): void {
        window.sessionStorage.removeItem(key);
    }

    getKeys(): string[] {
        return Object.keys(window.sessionStorage);
    }

    containsKey(key: string): boolean {
        return window.sessionStorage.hasOwnProperty(key);
    }
}
