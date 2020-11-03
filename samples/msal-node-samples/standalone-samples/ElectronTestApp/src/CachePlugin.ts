/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
const fs = require('fs');

import { CACHE_LOCATION } from "./utils/Constants";

const beforeCacheAccess = async (cacheContext) => {
    if (fs.existsSync(CACHE_LOCATION)) {
        cacheContext.tokenCache.deserialize(await fs.readFile(CACHE_LOCATION, "utf-8", (err, data) => {
            if (err) {
                console.log(err);
            } else {
                return data;
            }
        }));
    } else {
        await fs.writeFile(CACHE_LOCATION, cacheContext.tokenCache.serialize(), (err) => {
            if (err) {
                console.log(err);
            }
        });
    }
};

const afterCacheAccess = async (cacheContext) => {
    if(cacheContext.cacheHasChanged){
        await fs.writeFile(CACHE_LOCATION, cacheContext.tokenCache.serialize(), (err) => {
            if (err) {
                console.log(err);
            }
        });
    }
};

export const cachePlugin = {
    beforeCacheAccess,
    afterCacheAccess
}