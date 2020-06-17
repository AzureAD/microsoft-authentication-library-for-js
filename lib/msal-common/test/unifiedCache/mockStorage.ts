/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { ICacheStorage } from "../../src/cache/ICacheStorage";
import { CacheHelper } from "../../src/unifiedCache/utils/CacheHelper";
import { InMemoryCache } from "../../src/unifiedCache/utils/CacheTypes";
import { CredentialType, CacheSchemaType } from "../../src/utils/Constants";
import { AccountEntity } from "../../src/unifiedCache/entities/AccountEntity";
import { AccessTokenEntity } from "../../src/unifiedCache/entities/AccessTokenEntity";
import { RefreshTokenEntity } from "../../src/unifiedCache/entities/RefreshTokenEntity";
import { IdTokenEntity } from "../../src/unifiedCache/entities/IdTokenEntity";
import { AppMetadataEntity } from "../../src/unifiedCache/entities/AppMetadataEntity";

/**
 * This class implements Storage for node, reading cache from user specified storage location or an  extension library
 */
export class Storage implements ICacheStorage {

    private inMemoryCache;

    /**
     * gets the current in memory cache for the client
     */
    getCache(): object {
        return {
            accounts: {},
            accessTokens: {},
            idTokens: {},
            refreshTokens: {},
            appMetadata: {}
        };
    }

    /**
     * sets the current in memory cache for the client
     * @param inMemoryCache
     */
    setCache(inMemoryCache: InMemoryCache) {
        this.inMemoryCache = inMemoryCache;
    }

    /**
     * Set Item in memory
     * @param key
     * @param value
     * @param type
     * @param inMemory
     */
    setItem(
        key: string,
        value: string | object,
        type?: string,
        inMemory?: boolean
    ): void {
        // check memory type
        if (!inMemory) {
            console.log("Node doesn't support granular cache persistence yet");
            return;
        }

        // read inMemoryCache
        const cache = this.getCache() as InMemoryCache;

        // save the cacheItem
        switch (type) {
            case CacheSchemaType.ACCOUNT: {
                cache.accounts[key] = value as AccountEntity;
                break;
            }
            case CacheSchemaType.CREDENTIAL: {
                const credentialType = CacheHelper.getCredentialType(key);
                switch (credentialType) {
                    case CredentialType.ID_TOKEN: {
                        cache.idTokens[key] = value as IdTokenEntity;
                        break;
                    }
                    case CredentialType.ACCESS_TOKEN: {
                        cache.accessTokens[key] = value as AccessTokenEntity;
                        break;
                    }
                    case CredentialType.REFRESH_TOKEN: {
                        cache.refreshTokens[key] = value as RefreshTokenEntity;
                        break;
                    }
                }
                break;
            }
            case CacheSchemaType.APP_META_DATA: {
                cache.appMetadata[key] = value as AppMetadataEntity;
                break;
            }
            default: {
                console.log("Invalid Cache Type");
                return;
            }
        }

        // update inMemoryCache
        this.setCache(cache);
    }

    /**
     * Gets cache item with given key.
     * Will retrieve frm cookies if storeAuthStateInCookie is set to true.
     * @param key
     * @param type
     * @param inMemory
     */
    getItem(key: string, type?: string, inMemory?: boolean): string | object {
        // check memory type
        if (!inMemory) {
            console.log("Node doesn't support granular cache persistence yet");
            return {};
        }

        // read inMemoryCache
        const cache = this.getCache();

        // save the cacheItem
        switch (type!) {
            case CacheSchemaType.ACCOUNT: {
                return (cache.accounts[key] as AccountEntity) || null;
            }
            case CacheSchemaType.CREDENTIAL: {
                const credentialType = CacheHelper.getCredentialType(key);
                let credential = null;
                switch (credentialType) {
                    case CredentialType.ID_TOKEN: {
                        credential =
                            (cache.idTokens[key] as IdTokenEntity) || null;
                        break;
                    }
                    case CredentialType.ACCESS_TOKEN: {
                        credential =
                            (cache.accessTokens[key] as AccessTokenEntity) ||
                            null;
                        break;
                    }
                    case CredentialType.REFRESH_TOKEN: {
                        credential =
                            (cache.refreshTokens[key] as RefreshTokenEntity) ||
                            null;
                        break;
                    }
                }
                return credential!;
            }
            case CacheSchemaType.APP_META_DATA: {
                return (cache.appMetadata[key] as AppMetadataEntity) || null;
            }
            default: {
                console.log("Invalid Cache Type");
                return {};
            }
        }
    }

    /**
     * Removes the cache item from memory with the given key.
     * @param key
     * @param type
     * @param inMemory
     */
    removeItem(key: string, type?: string, inMemory?: boolean): boolean {
        // check memory type
        if (!inMemory) {
            console.log("Node doesn't support granular cache persistence yet");
            return false;
        }

        // read inMemoryCache
        const cache = this.getCache();
        let result: boolean = false;

        // save the cacheItem
        switch (type) {
            case CacheSchemaType.ACCOUNT: {
                if (!!cache.accounts[key]) {
                    delete cache.accounts[key];
                    result = true;
                }
                break;
            }
            case CacheSchemaType.CREDENTIAL: {
                const credentialType = CacheHelper.getCredentialType(key);
                switch (credentialType) {
                    case CredentialType.ID_TOKEN: {
                        if (!!cache.idTokens[key]) {
                            delete cache.idTokens[key];
                            result = true;
                        }
                        break;
                    }
                    case CredentialType.ACCESS_TOKEN: {
                        if (!!cache.accessTokens[key]) {
                            delete cache.accessTokens[key];
                            result = true;
                        }
                        break;
                    }
                    case CredentialType.REFRESH_TOKEN: {
                        if (!!cache.refreshTokens[key]) {
                            delete cache.refreshTokens[key];
                            result = true;
                        }
                        break;
                    }
                }
                break;
            }
            case CacheSchemaType.APP_META_DATA: {
                if (!!cache.appMetadata[key]) {
                    delete cache.appMetadata[key];
                    result = true;
                }
                break;
            }
            default: {
                console.log("Invalid Cache Type");
                break;
            }
        }

        // write to the cache after removal
        if (result) {
            this.setCache(cache);
        }
        return result;
    }

    /**
     * Checks whether key is in cache.
     * @param key
     * TODO: implement after the lookup implementation
     */
    containsKey(key: string): boolean {
        return key ? true : false;
    }

    /**
     * Gets all keys in window.
     * TODO: implement after the lookup implementation
     */
    getKeys(inMemory?: boolean): string[] {
        // check memory type
        if (!inMemory) {
            console.log("Node doesn't support granular cache persistence yet");
            return [];
        }

        // read inMemoryCache
        const cache = this.getCache();
        let cacheKeys: string[] = [];

        // read all keys
        Object.keys(cache).forEach((key) => {
            Object.keys(key).forEach((internalKey) => {
                cacheKeys.push(internalKey);
            });
        });

        return cacheKeys;
    }

    /**
     * Clears all cache entries created by MSAL (except tokens).
     */
    clear(inMemory?: boolean): void {
        // check memory type
        if (!inMemory) {
            console.log("Node doesn't support granular cache persistence yet");
            return;
        }

        // read inMemoryCache
        const cache = this.getCache();

        // read all keys
        Object.keys(cache).forEach((key) => {
            Object.keys(key).forEach((internalKey) => {
                this.removeItem(internalKey);
            });
        });
    }
}
