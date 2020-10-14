/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
const fs = require('fs');

 /**
 * Cache Plugin configuration
 */

module.exports = async function(cacheLocation) {
    const beforeCacheAccess = async (cacheContext) => {
        cacheContext.tokenCache.deserialize(await fs.readFile(cacheLocation, "utf-8", (err, data) => {
            if (err) {
                console.log(err);
            } else {
                return data;
            }
        }));
    };
    
    const afterCacheAccess = async (cacheContext) => {
        if(cacheContext.cacheHasChanged){
            await fs.writeFile(cacheLocation, cacheContext.tokenCache.serialize(), (err) => {
                if (err) {
                    console.log(err);
                }
            });
        }
    };
    
    return {
        beforeCacheAccess,
        afterCacheAccess
    }
}