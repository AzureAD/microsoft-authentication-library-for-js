import fs from "fs";
import { IdTokenEntity } from "../../lib/msal-common/src/cache/entities/IdTokenEntity";
import { AccessTokenEntity } from "../../lib/msal-common/src/cache/entities/AccessTokenEntity";
import { RefreshTokenEntity } from "../../lib/msal-common/src/cache/entities/RefreshTokenEntity";

import { InMemoryCache, internals } from "@azure/msal-node";

export type tokenMap = {
    idTokens: IdTokenEntity[],
    accessTokens: AccessTokenEntity[],
    refreshTokens: RefreshTokenEntity[]
};

export class NodeCacheTestUtils {
    static async getTokens(cacheLocation: string): Promise<tokenMap> {
        const deserializedCache = await NodeCacheTestUtils.readCacheFile(cacheLocation);
        const tokenCache: tokenMap = {
            idTokens: [],
            accessTokens: [],
            refreshTokens: []
        };

        Object.keys(tokenCache).forEach((cacheSectionKey: string) => {
            Object.keys(deserializedCache[cacheSectionKey]).map((cacheKey) => {
                const cacheSection = deserializedCache[cacheSectionKey];
                tokenCache[cacheSectionKey].push(cacheSection[cacheKey]);
            })
        });


        return Promise.resolve(tokenCache);
    }

    static async getAccounts(cacheLocation: string): Promise<Object> {
        const deserializedCache = await NodeCacheTestUtils.readCacheFile(cacheLocation);
        return Promise.resolve(deserializedCache.accounts || {});
    };

    static async readCacheFile(cacheLocation: string): Promise<any> {
        return new Promise((resolve, reject) => {
            fs.readFile(cacheLocation, "utf-8", (err, data) => {
                if (err) {
                    console.log("Error getting tokens from cache: ", err);
                    reject(err);
                }
                const cache = (data) ? data : this.getCacheTemplate();
                const deserializedCache = internals.Deserializer.deserializeAllCache(JSON.parse(cache));
                resolve(deserializedCache);
            });
        });
    }

    static async waitForTokens(cacheLocation: string, interval: number): Promise<tokenMap> {
        let tokenCache = await this.getTokens(cacheLocation);
        if (tokenCache.idTokens.length) {
            return tokenCache;
        }

        return new Promise(resolve => {
            const intervalId = setInterval(async () => {
                tokenCache = await this.getTokens(cacheLocation);

                if (tokenCache.idTokens.length) {
                    clearInterval(intervalId);
                    resolve(tokenCache);
                }
            }, interval);
        })
    }

    static async writeToCacheFile(cacheLocation: string, deserializedCache: InMemoryCache): Promise<void> {
        return new Promise((resolve, reject) => {
            fs.writeFile(cacheLocation, JSON.stringify(deserializedCache, null, 1), (error) => {
                if (error) {
                    console.error("Error writing to cache file in resetCache: ", error);
                    reject(error);
                }
                resolve();
            });
        });
    }

    static async expireAccessTokens(cacheLocation: string): Promise<void> {
        const deserializedCache = await NodeCacheTestUtils.readCacheFile(cacheLocation);
        const atKeys = Object.keys(deserializedCache.accessTokens);

        atKeys.forEach((atKey: string) => {
            deserializedCache.accessTokens[atKey].expiresOn = "0";
            deserializedCache.accessTokens[atKey].extendedExpiresOn = "0";
        });

        const serializedCache = internals.Serializer.serializeAllCache(deserializedCache);

        return new Promise((resolve, reject) => {
            fs.writeFile(cacheLocation, JSON.stringify(serializedCache, null, 1), (error) => {
                if(error) {
                    reject(error);
                }

                resolve();
            })
        });
    }

    static async resetCache(cacheLocation: string) {
        const emptyCache = this.getCacheSchema();
        await NodeCacheTestUtils.writeToCacheFile(cacheLocation, emptyCache);
    }

    private static getCacheSchema(): any {
        return {
            Account: {},
            IdToken: {},
            AccessToken: {},
            RefreshToken: {},
            AppMetadata: {}
        };
    }

    private static getCacheTemplate(): string {
        return JSON.stringify(this.getCacheSchema());
    }
}
