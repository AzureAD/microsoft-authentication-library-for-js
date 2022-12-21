/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { BrowserConfigurationAuthError } from "../error/BrowserConfigurationAuthError";
import { BrowserCacheLocation } from "../utils/BrowserConstants";
import { IWindowStorage } from "./IWindowStorage";
import { BrowserAuthErrorMessage } from "../error/BrowserAuthError";
import { Logger } from "@azure/msal-common";

export class BrowserStorage implements IWindowStorage<string> {

    private windowStorage: Storage;
    private logger:Logger;

    constructor(cacheLocation: string, logger:Logger) {
        this.validateWindowStorage(cacheLocation);
        this.windowStorage = window[cacheLocation];
        this.logger= logger;
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
        try{
            this.windowStorage.setItem(key, value);
        }
        catch(e){
            if(e.code === BrowserAuthErrorMessage.chromiumStorageException.code || e.code === BrowserAuthErrorMessage.firefoxStorageException.code)
            {
                this.logger.error("Could not access browser storage. This may be caused by exceeding the quota.");
            } else {
                throw e;
            }
        }
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
