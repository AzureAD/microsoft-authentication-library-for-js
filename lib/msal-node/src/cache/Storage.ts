/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import {
    CredentialType,
    CacheSchemaType,
    AccountEntity,
    AccessTokenEntity,
    RefreshTokenEntity,
    IdTokenEntity,
    AppMetadataEntity,
    CacheManager,
    CredentialEntity,
    ClientAuthError,
    Logger
} from '@azure/msal-common';
import { Deserializer } from "./serializer/Deserializer";
import { Serializer } from "./serializer/Serializer";
import { InMemoryCache, JsonCache } from "./serializer/SerializerTypes";

/**
 * This class implements Storage for node, reading cache from user specified storage location or an  extension library
 */
export class Storage extends CacheManager {
    // Cache configuration, either set by user or default values.
    private logger: Logger;

    constructor(logger: Logger) {
        super();
        this.logger = logger;
    }

    private inMemoryCache: InMemoryCache = {
        accounts: {},
        accessTokens: {},
        refreshTokens: {},
        appMetadata: {},
        idTokens: {},
    };

    private changeEmitters: Array<Function> = [];

    registerChangeEmitter(func: () => void): void {
        this.changeEmitters.push(func);
    }

    emitChange() {
        this.changeEmitters.forEach(func => func.call(null));
    }

    /**
     * gets the current in memory cache for the client
     */
    getCache(): object {
        this.logger.verbose("Getting in-memory cache");
        return this.inMemoryCache;
    }

    /**
     * sets the current in memory cache for the client
     * @param inMemoryCache
     */
    setCache(inMemoryCache: InMemoryCache) {
        this.logger.verbose("Setting in-memory cache");
        this.inMemoryCache = inMemoryCache;
        this.emitChange();
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
        type?: string
    ): void {
        this.logger.verbose(`setItem called for item type: ${type}`);
        this.logger.verbosePii(`Item key: ${key}`);
        // read inMemoryCache
        const cache = this.getCache() as InMemoryCache;

        // save the cacheItem
        switch (type) {
            case CacheSchemaType.ACCOUNT: {
                cache.accounts[key] = value as AccountEntity;
                break;
            }
            case CacheSchemaType.CREDENTIAL: {
                const credentialType = CredentialEntity.getCredentialType(key);
                switch (credentialType) {
                    case CredentialType.ID_TOKEN: {
                        this.logger.verbose(`Credential type: ${CredentialType.ID_TOKEN}`);
                        cache.idTokens[key] = value as IdTokenEntity;
                        break;
                    }
                    case CredentialType.ACCESS_TOKEN: {
                        this.logger.verbose(`Credential type: ${CredentialType.ACCESS_TOKEN}`);
                        cache.accessTokens[key] = value as AccessTokenEntity;
                        break;
                    }
                    case CredentialType.REFRESH_TOKEN: {
                        this.logger.verbose(`Credential type: ${CredentialType.REFRESH_TOKEN}`);
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
                throw ClientAuthError.createInvalidCacheTypeError();
            }
        }

        // update inMemoryCache
        this.setCache(cache);
        this.emitChange();
    }

    /**
     * Gets cache item with given key.
     * Will retrieve frm cookies if storeAuthStateInCookie is set to true.
     * @param key
     * @param type
     * @param inMemory
     */
    getItem(key: string, type?: string): string | object {
        this.logger.verbose(`getItem called for item type: ${type}`);
        this.logger.verbosePii(`Item key: ${key}`);
        // read inMemoryCache
        const cache = this.getCache() as InMemoryCache;

        // save the cacheItem
        switch (type!) {
            case CacheSchemaType.ACCOUNT: {
                return (cache.accounts[key] as AccountEntity) || null;
            }
            case CacheSchemaType.CREDENTIAL: {
                const credentialType = CredentialEntity.getCredentialType(key);
                let credential = null;
                switch (credentialType) {
                    case CredentialType.ID_TOKEN: {
                        this.logger.verbose(`Credential type: ${CredentialType.ID_TOKEN}`);
                        credential = (cache.idTokens[key] as IdTokenEntity) || null;
                        break;
                    }
                    case CredentialType.ACCESS_TOKEN: {
                        this.logger.verbose(`Credential type: ${CredentialType.ACCESS_TOKEN}`);
                        credential = (cache.accessTokens[key] as AccessTokenEntity) || null;
                        break;
                    }
                    case CredentialType.REFRESH_TOKEN: {
                        this.logger.verbose(`Credential type: ${CredentialType.REFRESH_TOKEN}`);
                        credential = (cache.refreshTokens[key] as RefreshTokenEntity) || null;
                        break;
                    }
                }
                return credential!;
            }
            case CacheSchemaType.APP_META_DATA: {
                return (cache.appMetadata[key] as AppMetadataEntity) || null;
            }
            default: {
                throw ClientAuthError.createInvalidCacheTypeError();
            }
        }
    }

    /**
     * Removes the cache item from memory with the given key.
     * @param key
     * @param type
     * @param inMemory
     */
    removeItem(key: string, type?: string): boolean {
        this.logger.verbose(`removeItem called for item type: ${type}`);
        this.logger.verbosePii(`Item key: ${key}`);
        // read inMemoryCache
        const cache = this.getCache() as InMemoryCache;
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
                const credentialType = CredentialEntity.getCredentialType(key);
                switch (credentialType) {
                    case CredentialType.ID_TOKEN: {
                        this.logger.verbose(`Credential type: ${CredentialType.ID_TOKEN}`);
                        if (!!cache.idTokens[key]) {
                            delete cache.idTokens[key];
                            result = true;
                        }
                        break;
                    }
                    case CredentialType.ACCESS_TOKEN: {
                        this.logger.verbose(`Credential type: ${CredentialType.ACCESS_TOKEN}`);
                        if (!!cache.accessTokens[key]) {
                            delete cache.accessTokens[key];
                            result = true;
                        }
                        break;
                    }
                    case CredentialType.REFRESH_TOKEN: {
                        this.logger.verbose(`Credential type: ${CredentialType.REFRESH_TOKEN}`);
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
                throw ClientAuthError.createInvalidCacheTypeError();
            }
        }

        // write to the cache after removal
        if (result) {
            this.setCache(cache);
            this.emitChange();
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
     */
    getKeys(): string[] {
        this.logger.verbose("Retrieving all cache keys");
        // read inMemoryCache
        const cache: InMemoryCache= this.getCache() as InMemoryCache;
        return [
            ...Object.keys(cache.accounts),
            ...Object.keys(cache.idTokens),
            ...Object.keys(cache.accessTokens),
            ...Object.keys(cache.refreshTokens),
            ...Object.keys(cache.appMetadata),
        ];
    }

    /**
     * Clears all cache entries created by MSAL (except tokens).
     */
    clear(): void {
        this.logger.verbose("Clearing cache entries created by MSAL");
        // read inMemoryCache
        const cacheKeys = this.getKeys();

        // delete each element
        cacheKeys.forEach(key => {
            this.removeItem(key);
        });
        this.emitChange();
    }

    /**
     * Initialize in memory cache from an exisiting cache vault
     * @param cache
     */
    static generateInMemoryCache(cache: string): InMemoryCache {
        return Deserializer.deserializeAllCache(
            Deserializer.deserializeJSONBlob(cache)
        );
    }

    /**
     * retrieves the final JSON
     * @param inMemoryCache
     */
    static generateJsonCache(inMemoryCache: InMemoryCache): JsonCache {
        return Serializer.serializeAllCache(inMemoryCache);
    }
}
