import { expect } from "chai";
import { CacheManager, CacheContent } from "../../src/unifiedCache/CacheManager";
import { mockCache } from "./entities/cacheConstants";
import { CacheEntity } from "../../src/utils/Constants";

const cachedJson = require("./serialize/cache.json");

describe("CacheManager test cases", () => {

    let cacheManager = new CacheManager(cachedJson);

    it.only("initCache", () => {

        // create mock AccessToken
        const atOne = mockCache.createMockATOne();
        const atOneKey = atOne.generateAccessTokenEntityKey();
        const atTwo = mockCache.createMockATTwo();
        const atTwoKey = atTwo.generateAccessTokenEntityKey();

        expect(Object.keys(cacheManager.cacheContent.accessTokens).length).to.equal(2);
        expect(cacheManager.cacheContent.accessTokens[atOneKey]).to.eql(atOne);
        expect(cacheManager.cacheContent.accessTokens[atTwoKey]).to.eql(atTwo);
    });

    it.only("getAccount", () => {

        // create mock Account
        const acc = mockCache.createMockAcc();
        const homeAccountId = "uid.utid";
        const environment = "login.microsoftonline.com";
        const realm = "microsoft";

        const genAcc = cacheManager.getAccount(homeAccountId, environment, realm);
        expect(acc).to.eql(genAcc);

        const randomAcc = cacheManager.getAccount("", "", "");
        expect(randomAcc).to.be.undefined;
    });

});
