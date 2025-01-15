/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    Constants,
    TokenKeys,
    IPerformanceClient,
    invokeAsync,
    PerformanceEvents,
    Logger,
    invoke,
} from "@azure/msal-common/browser";
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
import { StaticCacheKeys } from "../utils/BrowserConstants.js";

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
    private performanceClient: IPerformanceClient;
    private logger: Logger;
    private encryptionCookie?: EncryptionCookie;

    constructor(
        clientId: string,
        logger: Logger,
        performanceClient: IPerformanceClient
    ) {
        if (!window.localStorage) {
            throw createBrowserConfigurationAuthError(
                BrowserConfigurationAuthErrorCodes.storageNotSupported
            );
        }
        this.memoryStorage = new MemoryStorage<string>();
        this.initialized = false;
        this.clientId = clientId;
        this.logger = logger;
        this.performanceClient = performanceClient;
    }

    async initialize(correlationId: string): Promise<void> {
        this.initialized = true;

        const cookies = new CookieStorage();
        const cookieString = cookies.getItem(ENCRYPTION_KEY);
        let parsedCookie = { key: "", id: "" };
        if (cookieString) {
            try {
                parsedCookie = JSON.parse(cookieString);
            } catch (e) {}
        }
        if (parsedCookie.key && parsedCookie.id) {
            // Encryption key already exists, import
            const baseKey = invoke(
                base64DecToArr,
                PerformanceEvents.Base64Decode,
                this.logger,
                this.performanceClient,
                correlationId
            )(parsedCookie.key);
            this.encryptionCookie = {
                id: parsedCookie.id,
                key: await invokeAsync(
                    generateHKDF,
                    PerformanceEvents.GenerateHKDF,
                    this.logger,
                    this.performanceClient,
                    correlationId
                )(baseKey),
            };
            await invokeAsync(
                this.importExistingCache.bind(this),
                PerformanceEvents.ImportExistingCache,
                this.logger,
                this.performanceClient,
                correlationId
            )(correlationId);
        } else {
            // Encryption key doesn't exist or is invalid, generate a new one and clear existing cache
            this.clear();
            const id = createNewGuid();
            const baseKey = await invokeAsync(
                generateBaseKey,
                PerformanceEvents.GenerateBaseKey,
                this.logger,
                this.performanceClient,
                correlationId
            )();
            const keyStr = invoke(
                urlEncodeArr,
                PerformanceEvents.UrlEncodeArr,
                this.logger,
                this.performanceClient,
                correlationId
            )(new Uint8Array(baseKey));
            this.encryptionCookie = {
                id: id,
                key: await invokeAsync(
                    generateHKDF,
                    PerformanceEvents.GenerateHKDF,
                    this.logger,
                    this.performanceClient,
                    correlationId
                )(baseKey),
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

    async setUserData(
        key: string,
        value: string,
        correlationId: string
    ): Promise<void> {
        if (!this.initialized || !this.encryptionCookie) {
            throw createBrowserAuthError(
                BrowserAuthErrorCodes.uninitializedPublicClientApplication
            );
        }

        const { data, nonce } = await invokeAsync(
            encrypt,
            PerformanceEvents.Encrypt,
            this.logger,
            this.performanceClient,
            correlationId
        )(this.encryptionCookie.key, value, this.getContext(key));
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
    private async importExistingCache(correlationId: string): Promise<void> {
        if (!this.encryptionCookie) {
            return;
        }

        let accountKeys = getAccountKeys(this);
        accountKeys = await this.importArray(accountKeys, correlationId);
        // Write valid account keys back to map
        this.setItem(StaticCacheKeys.ACCOUNT_KEYS, JSON.stringify(accountKeys));

        const tokenKeys: TokenKeys = getTokenKeys(this.clientId, this);
        tokenKeys.idToken = await this.importArray(
            tokenKeys.idToken,
            correlationId
        );
        tokenKeys.accessToken = await this.importArray(
            tokenKeys.accessToken,
            correlationId
        );
        tokenKeys.refreshToken = await this.importArray(
            tokenKeys.refreshToken,
            correlationId
        );
        // Write valid token keys back to map
        this.setItem(
            `${StaticCacheKeys.TOKEN_KEYS}.${this.clientId}`,
            JSON.stringify(tokenKeys)
        );
    }

    /**
     * Helper to decrypt and save cache entries
     * @param key
     * @returns
     */
    private async getItemFromEncryptedCache(
        key: string,
        correlationId: string
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
        } catch (e) {
            // Not a valid encrypted object, remove
            return null;
        }

        if (!encObj.id || !encObj.nonce || !encObj.data) {
            // Data is not encrypted, likely from old version of MSAL. It must be removed because we don't know how old it is.
            this.performanceClient.incrementFields(
                { unencryptedCacheCount: 1 },
                correlationId
            );
            return null;
        }

        if (encObj.id !== this.encryptionCookie.id) {
            // Data was encrypted with a different key. It must be removed because it is from a previous session.
            this.performanceClient.incrementFields(
                { encryptedCacheExpiredCount: 1 },
                correlationId
            );
            return null;
        }

        return invokeAsync(
            decrypt,
            PerformanceEvents.Decrypt,
            this.logger,
            this.performanceClient,
            correlationId
        )(
            this.encryptionCookie.key,
            encObj.nonce,
            this.getContext(key),
            encObj.data
        );
    }

    /**
     * Helper to decrypt and save an array of cache keys
     * @param arr
     * @returns Array of keys successfully imported
     */
    private async importArray(
        arr: Array<string>,
        correlationId: string
    ): Promise<Array<string>> {
        const importedArr: Array<string> = [];
        const promiseArr: Array<Promise<void>> = [];
        arr.forEach((key) => {
            const promise = this.getItemFromEncryptedCache(
                key,
                correlationId
            ).then((value) => {
                if (value) {
                    this.memoryStorage.setItem(key, value);
                    importedArr.push(key);
                } else {
                    // If value is empty, unencrypted or expired remove
                    this.removeItem(key);
                }
            });
            promiseArr.push(promise);
        });

        await Promise.all(promiseArr);
        return importedArr;
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
