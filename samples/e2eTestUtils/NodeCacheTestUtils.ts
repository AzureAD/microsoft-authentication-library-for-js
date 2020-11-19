import { Deserializer, Serializer } from "../../lib/msal-node";
import { InMemoryCache, JsonCache } from '../../lib/msal-node/dist/cache/serializer/SerializerTypes';
import fs from "fs";

export type tokenMap = {
    idTokens: string[],
    accessTokens: string[],
    refreshTokens: string[]
};

export class NodeCacheTestUtils {
    static getTokens(cacheLocation: string): tokenMap {
        const cache = (fs.existsSync(cacheLocation)) ?  fs.readFileSync(cacheLocation, { encoding: 'utf-8' }) : "{}";
        const deserializedCache = Deserializer.deserializeAllCache(JSON.parse(cache));

        const tokenCache: tokenMap = {
            idTokens: [],
            accessTokens: [],
            refreshTokens: []
        };

        Object.keys(tokenCache).forEach((cacheSectionKey: string) => {
            Object.keys(deserializedCache[cacheSectionKey]).map((cacheKey) => {
                tokenCache[cacheSectionKey].push(cacheKey);
            })
        });

        return tokenCache;
    }

    static resetCache(cacheLocation: string) {
        const jsonCache = (fs.existsSync(cacheLocation)) ? require(cacheLocation) : this.getCacheTemplate();
        const cache: InMemoryCache = Deserializer.deserializeAllCache(jsonCache);
        Object.keys(cache).forEach( key => cache[key] = []);
        const serializedCache = Serializer.serializeAllCache(cache);

        try {
            fs.writeFileSync(cacheLocation, JSON.stringify(serializedCache, null, 1));
        } catch (error) {
            console.error("Error writing to cache file in resetCache: ", error);
        }
    }

    private static getCacheTemplate(): any {
        return JSON.stringify({
            Account: {},
            IdToken: {},
            AccessToken: {},
            RefreshToken: {},
            AppMetadata: {}
        });
    }
}
