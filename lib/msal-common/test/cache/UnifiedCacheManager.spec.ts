import { expect } from "chai";
import { UnifiedCacheManager } from "../../src/cache/UnifiedCacheManager";
import { mockCache } from "./entities/cacheConstants";
import { ICacheStorage } from "../../src/cache/interface/ICacheStorage";

const cachedJson = require("./serialize/cache.json");

describe("UnifiedCacheManager test cases", () => {

    let store = {};
    beforeEach(() => {
        store = {};
    });

    it.only("initCache", () => {

        const cache = JSON.stringify(cachedJson);
        const cacheStorage: ICacheStorage = {
            async getSerializedCache(): Promise<string> {
                return cache;
            },
            setSerializedCache(): void {
                // placeholder
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
            }
        };

        let unifiedCacheManager = new UnifiedCacheManager(cacheStorage);

        // create mock AccessToken
        const atOne = mockCache.createMockATOne();
        const atOneKey = atOne.generateAccessTokenEntityKey();
        const atTwo = mockCache.createMockATTwo();
        const atTwoKey = atTwo.generateAccessTokenEntityKey();

        expect(
            Object.keys(unifiedCacheManager.getCacheInMemory().accessTokens)
                .length
        ).to.equal(2);
        expect(
            unifiedCacheManager.getCacheInMemory().accessTokens[atOneKey]
        ).to.eql(atOne);
        expect(
            unifiedCacheManager.getCacheInMemory().accessTokens[atTwoKey]
        ).to.eql(atTwo);
    });

    it("getAccount", () => {

        const cache = JSON.stringify(cachedJson);
        const cacheStorage: ICacheStorage = {
            async getSerializedCache(): Promise<string> {
                return cache;
            },
            setSerializedCache(): void {
                // placeholder
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
            }
        };

        let unifiedCacheManager = new UnifiedCacheManager(cacheStorage);

        // create mock Account
        const acc = mockCache.createMockAcc();
        const homeAccountId = "uid.utid";
        const environment = "login.microsoftonline.com";
        const realm = "microsoft";

        const genAcc = unifiedCacheManager.getAccount(homeAccountId, environment, realm);
        expect(acc).to.eql(genAcc);

        const randomAcc = unifiedCacheManager.getAccount("", "", "");
        expect(randomAcc).to.be.undefined;
    });

});
