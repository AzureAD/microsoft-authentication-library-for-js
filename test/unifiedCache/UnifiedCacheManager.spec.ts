import { expect } from "chai";
import { UnifiedCacheManager } from "../../src/unifiedCache/UnifiedCacheManager";
import { mockCache } from "./entities/cacheConstants";
import { InMemoryCache, JsonCache } from "../../src/unifiedCache/utils/CacheTypes";
import { ICacheStorage } from "../../src/cache/ICacheStorage";
import { Deserializer } from "../../src/unifiedCache/serialize/Deserializer";

const cacheJson = require("./serialize/cache.json");

describe("UnifiedCacheManager test cases", () => {

    let store = {};
    let storageInterface: ICacheStorage;
    const cache = JSON.stringify(cacheJson);
    const inMemCache: InMemoryCache = Deserializer.deserializeAllCache(Deserializer.deserializeJSONBlob(cache));

    beforeEach(() => {
        storageInterface = {
            getCache(): InMemoryCache {
                return inMemCache;
            },
            setCache(): void {
                // do nothing
            },
            setItem(key: string, value: string): void {
                store[key] = value;
            },
            getItem(key: string): string {
                return store[key];
            },
            removeItem(key: string): void {
                delete store[key];
            },
            containsKey(key: string): boolean {
                return !!store[key];
            },
            getKeys(): string[] {
                return Object.keys(store);
            },
            clear(): void {
                store = {};
            },
        }
    });

    it("initCache", () => {

        let unifiedCacheManager = new UnifiedCacheManager(storageInterface);

        // create mock AccessToken
        const atOne = mockCache.createMockATOne();
        const atOneKey = atOne.generateAccessTokenEntityKey();
        const atTwo = mockCache.createMockATTwo();
        const atTwoKey = atTwo.generateAccessTokenEntityKey();

        expect(Object.keys(unifiedCacheManager.getCacheInMemory().accessTokens).length).to.equal(2);
        expect(unifiedCacheManager.getCacheInMemory().accessTokens[atOneKey]).to.eql(atOne);
        expect(unifiedCacheManager.getCacheInMemory().accessTokens[atTwoKey]).to.eql(atTwo);
    });

    it("getAccount", () => {

        let unifiedCacheManager = new UnifiedCacheManager(storageInterface);

        // create mock Account
        const acc = mockCache.createMockAcc();
        const homeAccountId = "uid.utid";
        const environment = "login.microsoftonline.com";
        const realm = "microsoft";

        const genAcc = unifiedCacheManager.getAccount(homeAccountId, environment, realm);
        expect(acc).to.eql(genAcc);

        const randomAcc = unifiedCacheManager.getAccount("", "", "");
        expect(randomAcc).to.be.null;
    });

});
