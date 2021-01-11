import { Deserializer, Serializer, TokenCache } from "../../lib/msal-node";
import { InMemoryCache, JsonCache } from '../../lib/msal-node/dist/cache/serializer/SerializerTypes';
import fs from "fs";
import { AccessToken } from '@azure/identity';

export type tokenMap = {
    idTokens: string[],
    accessTokens: any[],
    refreshTokens: string[]
};

export class NodeCacheTestUtils {
    static getTokens(deserializedCache: InMemoryCache): tokenMap {
            const tokenCache: tokenMap = {
                idTokens: [],
                accessTokens: [],
                refreshTokens: []
            };
    
            Object.keys(tokenCache).forEach((cacheSectionKey: string) => {
                Object.keys(deserializedCache[cacheSectionKey]).map((cacheKey) => {
                    const cacheSection = deserializedCache[cacheSectionKey];
                    tokenCache[cacheSectionKey].push({ 
                        key: cacheKey,
                        token: cacheSection[cacheKey]
                    });
                })
            });

        return tokenCache;
    }

    static readCacheFile(cacheLocation: string, callback: Function) {
        fs.readFile(cacheLocation, "utf-8", (err, data) => {
            if (err) {
                console.log("Error getting tokens from cache: ", err);
            }
            const cache = (data) ? data : this.getCacheTemplate();
            
            const deserializedCache = Deserializer.deserializeAllCache(JSON.parse(cache));
            callback(deserializedCache);
        });
    }

    static writeToCacheFile(cacheLocation: string, deserializedCache: InMemoryCache, callback: Function) {
        fs.writeFile(cacheLocation, JSON.stringify(deserializedCache, null, 1), (error) => {
            if (error) {
                console.error("Error writing to cache file in resetCache: ", error);
            }

            if(callback) {
                callback();
            }
        });
    }

    static async expireAccessTokens(deserializedCache: InMemoryCache): Promise<InMemoryCache> {
        const atKeys = Object.keys(deserializedCache.accessTokens);

        atKeys.forEach((atKey: string) => {
            deserializedCache.accessTokens[atKey].expiresOn = "0";
            deserializedCache.accessTokens[atKey].extendedExpiresOn = "0";
        });

        return deserializedCache;
    }

    static resetCache(cacheLocation: string) {
        const emptyCache = this.getCacheSchema();
        NodeCacheTestUtils.writeToCacheFile(cacheLocation, emptyCache, null);
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
