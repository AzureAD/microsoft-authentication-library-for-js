import { expect } from "chai";
import { UnifiedCacheManager } from "../../src/unifiedCache/UnifiedCacheManager";
import { CacheContent } from "../../src/unifiedCache/serialize/CacheInterface";
import { mockCache } from "./entities/cacheConstants";
import { CacheEntity } from "../../src/utils/Constants";

const cachedJson = require("./serialize/cache.json");

describe("UnifiedCacheManager test cases", () => {

    let unifiedCacheManager = new UnifiedCacheManager(cachedJson);

    it("initCache", () => {

        // create mock AccessToken
        const atOne = mockCache.createMockATOne();
        const atOneKey = atOne.generateAccessTokenEntityKey();
        const atTwo = mockCache.createMockATTwo();
        const atTwoKey = atTwo.generateAccessTokenEntityKey();

        expect(Object.keys(unifiedCacheManager.inMemoryCache.accessTokens).length).to.equal(2);
        expect(unifiedCacheManager.inMemoryCache.accessTokens[atOneKey]).to.eql(atOne);
        expect(unifiedCacheManager.inMemoryCache.accessTokens[atTwoKey]).to.eql(atTwo);
    });

    it("getAccount", () => {

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
