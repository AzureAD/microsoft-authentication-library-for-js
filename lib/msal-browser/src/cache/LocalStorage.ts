/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Constants, TokenKeys } from "@azure/msal-common/browser";
import {
    createNewGuid,
    decrypt,
    encrypt,
    generateBaseKey,
    generateHKDF,
} from "../crypto/BrowserCrypto.js";
import { base64DecToArr } from "../encode/Base64Decode.js";
import { urlEncodeArr } from "../encode/Base64Encode.js";
import {
    BrowserAuthErrorCodes,
    createBrowserAuthError,
} from "../error/BrowserAuthError.js";
import {
    BrowserConfigurationAuthErrorCodes,
    createBrowserConfigurationAuthError,
} from "../error/BrowserConfigurationAuthError.js";
import { CookieStorage } from "./CookieStorage.js";
import { IWindowStorage } from "./IWindowStorage.js";
import { MemoryStorage } from "./MemoryStorage.js";
import { getAccountKeys, getTokenKeys } from "./CacheHelpers.js";

const ENCRYPTION_KEY = "msal.cache.encryption";

type EncryptionCookie = {
    id: string;
    key: CryptoKey;
};

type EncryptedData = {
    id: string;
    nonce: string;
    data: string;
};

export class LocalStorage implements IWindowStorage<string> {
    private clientId: string;
    private initialized: boolean;
    private memoryStorage: MemoryStorage<string>;
    private encryptionCookie?: EncryptionCookie;

    constructor(clientId: string) {
        if (!window.localStorage) {
            throw createBrowserConfigurationAuthError(
                BrowserConfigurationAuthErrorCodes.storageNotSupported
            );
        }
        this.memoryStorage = new MemoryStorage<string>();
        this.initialized = false;
        this.clientId = clientId;
    }

    async initialize(): Promise<void> {
        this.initialized = true;

        const cookies = new CookieStorage();
        const cookieString = cookies.getItem(ENCRYPTION_KEY);
        let parsedCookie = { key: "", id: "" };
        if (cookieString) {
            try {
                parsedCookie = JSON.parse(cookieString);
            } catch (e) {
                // TODO: Log telemetry but don't throw
            }
        }
        if (parsedCookie.key && parsedCookie.id) {
            // Encryption key already exists, import
            this.encryptionCookie = {
                id: parsedCookie.id,
                key: await generateHKDF(base64DecToArr(parsedCookie.key)),
            };
            await this.importExistingCache();
        } else {
            // Encryption key doesn't exist or is invalid, generate a new one and clear existing cache
            this.clear();
            const id = createNewGuid();
            const baseKey = await generateBaseKey();
            const keyStr = urlEncodeArr(new Uint8Array(baseKey));
            this.encryptionCookie = {
                id: id,
                key: await generateHKDF(baseKey),
            };

            const cookieData = {
                id: id,
                key: keyStr,
            };
            cookies.setItem(ENCRYPTION_KEY, JSON.stringify(cookieData));
        }
    }

    getItem(key: string): string | null {
        return window.localStorage.getItem(key);
    }

    getUserData(key: string): string | null {
        if (!this.initialized) {
            throw createBrowserAuthError(
                BrowserAuthErrorCodes.uninitializedPublicClientApplication
            );
        }
        return this.memoryStorage.getItem(key);
    }

    setItem(key: string, value: string): void {
        window.localStorage.setItem(key, value);
    }

    async setUserData(key: string, value: string): Promise<void> {
        if (!this.initialized || !this.encryptionCookie) {
            throw createBrowserAuthError(
                BrowserAuthErrorCodes.uninitializedPublicClientApplication
            );
        }

        const { data, nonce } = await encrypt(
            this.encryptionCookie.key,
            value,
            this.getContext(key)
        );
        const encryptedData: EncryptedData = {
            id: this.encryptionCookie.id,
            nonce: nonce,
            data: data,
        };

        this.memoryStorage.setItem(key, value);
        this.setItem(key, JSON.stringify(encryptedData));
    }

    removeItem(key: string): void {
        this.memoryStorage.removeItem(key);
        window.localStorage.removeItem(key);
    }

    getKeys(): string[] {
        return Object.keys(window.localStorage);
    }

    containsKey(key: string): boolean {
        return window.localStorage.hasOwnProperty(key);
    }

    /**
     * Removes all known MSAL keys from the cache
     */
    clear(): void {
        // Removes all remaining MSAL cache items
        this.memoryStorage.clear();

        const accountKeys = getAccountKeys(this);
        accountKeys.forEach((key) => this.removeItem(key));
        const tokenKeys = getTokenKeys(this.clientId, this);
        tokenKeys.idToken.forEach((key) => this.removeItem(key));
        tokenKeys.accessToken.forEach((key) => this.removeItem(key));
        tokenKeys.refreshToken.forEach((key) => this.removeItem(key));

        // Clean up anything left
        this.getKeys().forEach((cacheKey: string) => {
            if (
                cacheKey.startsWith(Constants.CACHE_PREFIX) ||
                cacheKey.indexOf(this.clientId) !== -1
            ) {
                this.removeItem(cacheKey);
            }
        });
    }

    /**
     * Helper to decrypt all known MSAL keys in localStorage and save them to inMemory storage
     * @returns
     */
    private async importExistingCache(): Promise<void> {
        if (!this.encryptionCookie) {
            return;
        }

        const accountKeys = getAccountKeys(this);
        await this.importArray(accountKeys);

        const tokenKeys: TokenKeys = getTokenKeys(this.clientId, this);
        await Promise.all([
            this.importArray(tokenKeys.idToken),
            this.importArray(tokenKeys.accessToken),
            this.importArray(tokenKeys.refreshToken),
        ]);
    }

    /**
     * Helper to decrypt and save cache entries
     * @param key
     * @returns
     */
    private async getItemFromEncryptedCache(
        key: string
    ): Promise<string | null> {
        if (!this.encryptionCookie) {
            return null;
        }

        const rawCache = this.getItem(key);
        if (!rawCache) {
            return null;
        }

        let encObj: EncryptedData;
        try {
            encObj = JSON.parse(rawCache);
            if (!encObj.id || !encObj.nonce || !encObj.data) {
                throw "Not encrypted!"; // TODO: Typed error
            }

            if (encObj.id !== this.encryptionCookie.id) {
                throw "Old item!"; // TODO: Typed error
            }
        } catch (e) {
            // Not a valid encrypted object, remove
            this.removeItem(key);
            // TODO: Log to telemetry
            return null;
        }

        return decrypt(
            this.encryptionCookie.key,
            encObj.nonce,
            this.getContext(key),
            encObj.data
        );
    }

    /**
     * Helper to decrypt and save an array of cache keys
     * @param arr
     */
    private async importArray(arr: Array<string>): Promise<void> {
        const promiseArr: Array<Promise<void>> = [];
        arr.forEach((key) => {
            const promise = this.getItemFromEncryptedCache(key).then(
                (value) => {
                    if (value) {
                        this.memoryStorage.setItem(key, value);
                    }
                }
            );
            promiseArr.push(promise);
        });

        await Promise.all(promiseArr);
    }

    /**
     * Gets encryption context for a given cache entry. This is clientId for app specific entries, empty string for shared entries
     * @param key
     * @returns
     */
    private getContext(key: string): string {
        let context = "";
        if (key.includes(this.clientId)) {
            context = this.clientId; // Used to bind encryption key to this appId
        }

        return context;
    }
}
