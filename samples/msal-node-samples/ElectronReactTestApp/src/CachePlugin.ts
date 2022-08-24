/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

const fs = require('fs');

import { CACHE_LOCATION } from './Constants';

const beforeCacheAccess = async (cacheContext: any) => {
    return new Promise<void>(async (resolve, reject) => {
        if (fs.existsSync(CACHE_LOCATION)) {
            fs.readFile(CACHE_LOCATION, 'utf-8', (err: any, data: any) => {
                if (err) {
                    reject();
                } else {
                    cacheContext.tokenCache.deserialize(data);
                    resolve();
                }
            });
        } else {
            fs.writeFile(CACHE_LOCATION, cacheContext.tokenCache.serialize(), (err: any) => {
                if (err) {
                    reject();
                }
            });
        }
    });
};

const afterCacheAccess = async (cacheContext: any) => {
    if (cacheContext.cacheHasChanged) {
        await fs.writeFile(CACHE_LOCATION, cacheContext.tokenCache.serialize(), (err: any) => {
            if (err) {
                console.log(err);
            }
        });
    }
};

export const cachePlugin = {
    beforeCacheAccess,
    afterCacheAccess,
};
