import fs from "fs";
import { TokenCacheContext, ICachePlugin } from "@azure/msal-node";

const cachePluginFunctionality = (cacheLocation: string): ICachePlugin => {
    const beforeCacheAccess = (
        cacheContext: TokenCacheContext
    ): Promise<void> => {
        return new Promise((resolve, reject) => {
            if (fs.existsSync(cacheLocation)) {
                fs.readFile(cacheLocation, "utf-8", (err, data) => {
                    if (err) {
                        return reject(err);
                    }

                    cacheContext.tokenCache.deserialize(data);
                    return resolve();
                });
            } else {
                fs.writeFile(
                    cacheLocation,
                    cacheContext.tokenCache.serialize(),
                    (err) => {
                        if (err) {
                            return reject(err);
                        }

                        return resolve();
                    }
                );
            }
        });
    };

    const afterCacheAccess = (
        cacheContext: TokenCacheContext
    ): Promise<void> => {
        return new Promise((resolve, reject) => {
            if (cacheContext.cacheHasChanged) {
                fs.writeFile(
                    cacheLocation,
                    cacheContext.tokenCache.serialize(),
                    (err) => {
                        if (err) {
                            return reject(err);
                        }

                        return resolve();
                    }
                );
            }

            return resolve();
        });
    };

    return {
        beforeCacheAccess,
        afterCacheAccess,
    };
};

export default cachePluginFunctionality;
