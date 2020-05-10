/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { promises as fs } from 'fs';

export class CacheManager {

    /**
     * Read contents of the cache blob to in memoryCache
     * @param cachePath
     */
    static async readFromFile(cacheLocation: string): Promise<string> {
        return await fs.readFile(cacheLocation, 'utf8');
    }

    /**
     * Create the JSON file
     * @param jsonContent
     */
    static async writeToFile(cachePath: string, cache: string) {
        await fs.writeFile(cachePath, cache, 'utf8');
    }
}
