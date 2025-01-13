/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { ICachePlugin } from "@azure/msal-node";
import * as fs from "fs";

export const cachePlugin = (CACHE_LOCATION: string): ICachePlugin => {
    const beforeCacheAccess = async (cacheContext) => {
        return new Promise<void>(async (resolve, reject) => {
            if (fs.existsSync(CACHE_LOCATION)) {
                fs.readFile(CACHE_LOCATION, "utf-8", (error, data) => {
                    if (error) {
                        reject();
                    } else {
                        cacheContext.tokenCache.deserialize(data);
                        resolve();
                    }
                });
            } else {
                fs.writeFile(
                    CACHE_LOCATION,
                    cacheContext.tokenCache.serialize(),
                    (error) => {
                        if (error) {
                            reject();
                        }
                    }
                );
            }
        });
    };

    const afterCacheAccess = async (cacheContext) => {
        if (cacheContext.cacheHasChanged) {
            fs.writeFile(
                CACHE_LOCATION,
                cacheContext.tokenCache.serialize(),
                (error) => {
                    if (error) {
                        console.error(error);
                    }
                }
            );
        }
    };

    return {
        beforeCacheAccess,
        afterCacheAccess,
    };
};
