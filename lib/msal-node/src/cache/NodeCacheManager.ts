/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

const fs = require('fs');

export class NodeCacheManager {
    cache: string;

    /**
     * Read contents of the cache blob to in memoryCache
     * @param cachePath
     */
    readFromFile(cacheLocation: string): string {
        this.cache = fs.readFileSync(cacheLocation, 'utf8');
        return this.cache;
    }

    /**
     * Create the JSON file
     * @param jsonContent
     */
    writeToFile(cachePath: string, cache: string) {
        fs.writeFileSync(cachePath, cache, 'utf8');
    }
}
