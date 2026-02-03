/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import fs from "fs";

// Note: This imports from msal-node's internal serializer.
// In a production setup, you might want to copy this logic or use a different approach.
import { Deserializer } from "../../../msal-node-samples/../lib/msal-node/src/cache/serializer/Deserializer";
import { Serializer } from "../../../msal-node-samples/../lib/msal-node/src/cache/serializer/Serializer";

export type TokenMap = {
    idTokens: any[];
    accessTokens: any[];
    refreshTokens: any[];
};

/**
 * Utilities for testing Node.js token cache operations.
 */
export class NodeCacheTestUtils {
    /**
     * Gets all tokens from the cache file.
     * @param cacheLocation - Path to the cache file.
     * @returns Object containing arrays of id tokens, access tokens, and refresh tokens.
     */
    static async getTokens(cacheLocation: string): Promise<TokenMap> {
        const deserializedCache = await NodeCacheTestUtils.readCacheFile(
            cacheLocation
        );
        const tokenCache: TokenMap = {
            idTokens: [],
            accessTokens: [],
            refreshTokens: [],
        };

        Object.keys(tokenCache).forEach((cacheSectionKey: string) => {
            Object.keys(deserializedCache[cacheSectionKey]).map((cacheKey) => {
                const cacheSection = deserializedCache[cacheSectionKey];
                // @ts-ignore
                tokenCache[cacheSectionKey].push(cacheSection[cacheKey]);
            });
        });

        return Promise.resolve(tokenCache);
    }

    /**
     * Gets all accounts from the cache file.
     * @param cacheLocation - Path to the cache file.
     * @returns Object containing account entries.
     */
    static async getAccounts(cacheLocation: string): Promise<Object> {
        const deserializedCache = await NodeCacheTestUtils.readCacheFile(
            cacheLocation
        );
        return Promise.resolve(deserializedCache.accounts || {});
    }

    /**
     * Reads and deserializes the cache file.
     * @param cacheLocation - Path to the cache file.
     * @returns Deserialized cache object.
     */
    static async readCacheFile(cacheLocation: string): Promise<any> {
        return new Promise((resolve, reject) => {
            fs.readFile(cacheLocation, "utf-8", (err, data) => {
                if (err) {
                    console.log("Error getting tokens from cache: ", err);
                    reject(err);
                }
                const cache = data ? data : this.getCacheTemplate();
                const deserializedCache = Deserializer.deserializeAllCache(
                    JSON.parse(cache)
                );
                resolve(deserializedCache);
            });
        });
    }

    /**
     * Waits for tokens to appear in the cache file.
     * @param cacheLocation - Path to the cache file.
     * @param interval - Polling interval in milliseconds.
     * @returns Token map once tokens are found.
     */
    static async waitForTokens(
        cacheLocation: string,
        interval: number
    ): Promise<TokenMap> {
        let tokenCache = await this.getTokens(cacheLocation);
        if (tokenCache.idTokens.length) {
            return tokenCache;
        }

        return new Promise((resolve) => {
            const intervalId = setInterval(async () => {
                tokenCache = await this.getTokens(cacheLocation);

                if (tokenCache.idTokens.length) {
                    clearInterval(intervalId);
                    resolve(tokenCache);
                }
            }, interval);
        });
    }

    /**
     * Writes data to the cache file.
     * @param cacheLocation - Path to the cache file.
     * @param deserializedCache - Cache data to write.
     */
    static async writeToCacheFile(
        cacheLocation: string,
        deserializedCache: object
    ): Promise<void> {
        return new Promise((resolve, reject) => {
            fs.writeFile(
                cacheLocation,
                JSON.stringify(deserializedCache, null, 1),
                (error) => {
                    if (error) {
                        console.error(
                            "Error writing to cache file in resetCache: ",
                            error
                        );
                        reject(error);
                    }
                    resolve();
                }
            );
        });
    }

    /**
     * Expires all access tokens in the cache.
     * @param cacheLocation - Path to the cache file.
     */
    static async expireAccessTokens(cacheLocation: string): Promise<void> {
        const deserializedCache = await NodeCacheTestUtils.readCacheFile(
            cacheLocation
        );
        const atKeys = Object.keys(deserializedCache.accessTokens);

        atKeys.forEach((atKey: string) => {
            deserializedCache.accessTokens[atKey].expiresOn = "0";
            deserializedCache.accessTokens[atKey].extendedExpiresOn = "0";
        });

        const serializedCache = Serializer.serializeAllCache(deserializedCache);

        return new Promise((resolve, reject) => {
            fs.writeFile(
                cacheLocation,
                JSON.stringify(serializedCache, null, 1),
                (error) => {
                    if (error) {
                        reject(error);
                    }
                    resolve();
                }
            );
        });
    }

    /**
     * Resets the cache file to an empty state.
     * @param cacheLocation - Path to the cache file.
     */
    static async resetCache(cacheLocation: string): Promise<void> {
        const emptyCache = this.getCacheSchema();
        await NodeCacheTestUtils.writeToCacheFile(cacheLocation, emptyCache);
    }

    private static getCacheSchema(): any {
        return {
            Account: {},
            IdToken: {},
            AccessToken: {},
            RefreshToken: {},
            AppMetadata: {},
        };
    }

    private static getCacheTemplate(): string {
        return JSON.stringify(this.getCacheSchema());
    }
}
