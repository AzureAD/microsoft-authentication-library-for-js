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
        return new Promise(async (resolve, reject) => {
            if (fs.existsSync(cacheLocation)) {
                fs.readFile(cacheLocation, "utf-8", (err, data) => {
                    if (err) {
                        reject();
                    } else {
                        cacheContext.tokenCache.deserialize(data);
                        resolve();
                    }
                });
            } else {
               fs.writeFile(cacheLocation, cacheContext.tokenCache.serialize(), (err) => {
                    if (err) {
                        reject();
                    }
                });
            }
        });
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