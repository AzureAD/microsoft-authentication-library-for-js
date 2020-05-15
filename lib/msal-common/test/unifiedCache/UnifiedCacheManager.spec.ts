import { expect } from "chai";
import { UnifiedCacheManager } from "../../src/unifiedCache/UnifiedCacheManager";
import { mockCache } from "./entities/cacheConstants";
import { InMemoryCache, JsonCache } from "../../src/unifiedCache/utils/CacheTypes";
import { Deserializer } from "../../src/unifiedCache/serialize/Deserializer";
import { ICacheStorageAsync } from "../../dist/src";

const cacheJson = require("./serialize/cache.json");

describe("UnifiedCacheManager test cases", () => {

    let store = {};
    let storageInterface: ICacheStorageAsync;
    const cache = JSON.stringify(cacheJson);
    const inMemCache: InMemoryCache = Deserializer.deserializeAllCache(Deserializer.deserializeJSONBlob(cache));

    beforeEach(() => {
        storageInterface = {
            async getCache(): Promise<InMemoryCache> {
                return inMemCache;
            },
            async setCache(): Promise<void> {
                // do nothing
            },
            async setItem(key: string, value: string): Promise<void> {
                store[key] = value;
            },
            async getItem(key: string): Promise<string> {
                return store[key];
            },
            async removeItem(key: string): Promise<void> {
                delete store[key];
            },
            async containsKey(key: string): Promise<boolean> {
                return !!store[key];
            },
            async getKeys(): Promise<Array<string>> {
                return Object.keys(store);
            },
            async clear(): Promise<void> {
                store = {};
            },
        }
    });

    it("initCache", async () => {

        let unifiedCacheManager = new UnifiedCacheManager(storageInterface);

        // create mock AccessToken
        const atOne = mockCache.createMockATOne();
        const atOneKey = atOne.generateAccessTokenEntityKey();
        const atTwo = mockCache.createMockATTwo();
        const atTwoKey = atTwo.generateAccessTokenEntityKey();
        expect(Object.keys((await unifiedCacheManager.getCacheInMemory()).accessTokens).length).to.equal(2);
        expect((await unifiedCacheManager.getCacheInMemory()).accessTokens[atOneKey]).to.eql(atOne);
        expect((await unifiedCacheManager.getCacheInMemory()).accessTokens[atTwoKey]).to.eql(atTwo);
    });

    it("getAccount", async () => {

        let unifiedCacheManager = new UnifiedCacheManager(storageInterface);

        // create mock Account
        const acc = mockCache.createMockAcc();
        const homeAccountId = "uid.utid";
        const environment = "login.microsoftonline.com";
        const realm = "microsoft";

        const genAcc = await unifiedCacheManager.getAccount(homeAccountId, environment, realm);
        expect(acc).to.eql(genAcc);

        const randomAcc = await unifiedCacheManager.getAccount("", "", "");
        expect(randomAcc).to.be.null;
    });

});
