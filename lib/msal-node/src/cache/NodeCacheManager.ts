/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    CacheInMemObjects,
    CacheContent,
    CacheInterface,
    CacheJson,
    Serializer,
} from '@azure/msal-common';
const fs = require('fs');

export class NodeCacheManager {
    // Storage interface
    inMemoryCache: CacheInMemObjects = {
        accessTokens: {},
        idTokens: {},
        refreshTokens: {},
        accounts: {},
        appMetadata: {},
    };

    constructor(cachePath: string) {
        const fileContent = this.readFromFile(cachePath);
        this.inMemoryCache = this.initializeCacheFromJson(fileContent);
    }

    /**
     * Initialize in memory cache from an exisiting cache vault
     */
    initializeCacheFromJson(jsonContent: CacheContent): CacheInMemObjects {
        return {
            accessTokens: CacheInterface.generateAccessTokenCache(
                jsonContent.accessTokens
            ),
            idTokens: CacheInterface.generateIdTokenCache(jsonContent.idTokens),
            refreshTokens: CacheInterface.generateRefreshTokenCache(
                jsonContent.refreshTokens
            ),
            accounts: CacheInterface.generateAccountCache(jsonContent.accounts),
            appMetadata: CacheInterface.generateAppMetadataCache(
                jsonContent.appMetadata
            ),
        };
    }

    /**
     * retrieve the cache in memory
     */
    getCacheInMemory() {
        return this.inMemoryCache;
    }

    /**
     * set the memory
     */
    setCacheInMemory(cache: CacheInMemObjects): void {
        this.inMemoryCache = {
            accessTokens: { ...cache.accessTokens },
            idTokens: { ...cache.idTokens },
            refreshTokens: { ...cache.refreshTokens },
            accounts: { ...cache.accounts },
            appMetadata: { ...cache.appMetadata },
        };
    }

    /**
     * Read contents of the cache blob to in memoryCache
     * @param cachePath
     */
    readFromFile(cacheLocation: string): CacheContent {
        const cacheJsonFile = fs.readFileSync(cacheLocation, 'utf8');
        return CacheInterface.deserializeJSONBlob(cacheJsonFile);
    }

    /**
     * Create the JSON file
     * @param jsonContent
     */
    writeToFile(cachePath: string, cacheJson: CacheJson) {
        const cacheJSON = CacheInterface.serializeJSONBlob(cacheJson);
        fs.writeFileSync(cachePath, cacheJSON, 'utf8');
    }

    /**
     * retrieves the final JSON
     */
    getFinalJSONCache(cacheInMem: CacheInMemObjects) {
        const finalJson = Serializer.serializeAllCache(cacheInMem);
        return finalJson;
    }
}
