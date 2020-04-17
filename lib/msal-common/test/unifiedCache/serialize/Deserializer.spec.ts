import { expect } from "chai";
import { CacheInterface } from "../../../src/unifiedCache/serialize/CacheInterface";
import { mockCache, MockCache } from "../entities/cacheConstants";
import { Deserializer } from "../../../src/unifiedCache/serialize/Deserializer";
import { IdToken } from "../../../src/account/IdToken";
import { InMemoryCache } from "../../../src/unifiedCache/utils/CacheTypes";

const cacheJson = require("./cache.json");

describe("Deserializer test cases", () => {

    it("deserializeJSONBlob", () => {
        const mockAccount = {
            "uid.utid-login.microsoftonline.com-microsoft": {
                username: "John Doe",
                local_account_id: "object1234",
                realm: "microsoft",
                environment: "login.microsoftonline.com",
                home_account_id: "uid.utid",
                authority_type: "MSSTS",
                client_info: "base64encodedjson",
            },
        };
        const acc = CacheInterface.deserializeJSONBlob(cacheJson);
        expect(acc.accounts).to.eql(mockAccount);
    });

    it("retrieve empty JSON blob", () => {
        const emptyCacheJson = {};
        const emptyJsonContent = CacheInterface.deserializeJSONBlob(
            emptyCacheJson
        );

        expect(emptyJsonContent.accounts).to.eql({});
        expect(emptyJsonContent.accessTokens).to.eql({});
        expect(emptyJsonContent.idTokens).to.eql({});
        expect(emptyJsonContent.refreshTokens).to.eql({});
        expect(emptyJsonContent.appMetadata).to.eql({});
    });

    it("deSerializeAccounts", () => {
        // serialize the mock Account and Test equivalency with the cache.json provided
        const accCache = Deserializer.deSerializeAccounts(jsonCache.accounts);
        expect(accCache[MockCache.accKey]).to.eql(MockCache.acc);
    });

    it("deSerializeIdTokens", () => {
        // serialize the mock IdToken and Test equivalency with the cache.json provided
        const idTCache = Deserializer.deSerializeIdTokens(jsonCache.idTokens);
        expect(idTCache[MockCache.idTKey]).to.eql(MockCache.idT);
    });


    it("deSerializeAccessTokens", () => {
        // serialize the mock AccessToken and Test equivalency with the cache.json provided
        const atCache = Deserializer.deSerializeAccessTokens(jsonCache.accessTokens);
        expect(atCache[MockCache.atOneKey]).to.eql(MockCache.atOne);
    });

    it("deSerializeRefreshTokens", () => {
        // serialize the mock RefreshToken and Test equivalency with the cache.json provided
        const rtCache = Deserializer.deSerializeRefreshTokens(jsonCache.refreshTokens);
        expect(rtCache[MockCache.rtKey]).to.eql(MockCache.rt);
    });

    it("deserializeAppMetadata", () => {
        // serialize the mock AppMetadata and Test equivalency with the cache.json provided
        const amdtCache = Deserializer.deserializeAppMetadata(jsonCache.appMetadata);
        expect(amdtCache[MockCache.amdtKey]).to.eql(MockCache.amdt);
    });

    it("deserializeAll", () => {

        // deserialize the cache from memory and Test equivalency with the generated mock cache
        const inMemoryCache: InMemoryCache = Deserializer.deserializeAllCache(jsonCache);

        expect(inMemoryCache.accounts[MockCache.accKey]).to.eql(MockCache.acc);
        expect(inMemoryCache.idTokens[MockCache.idTKey]).to.eql(MockCache.idT);
        expect(inMemoryCache.accessTokens[MockCache.atOneKey]).to.eql(MockCache.atOne);
        expect(inMemoryCache.accessTokens[MockCache.atTwoKey]).to.eql(MockCache.atTwo);
        expect(inMemoryCache.refreshTokens[MockCache.rtKey]).to.eql(MockCache.rt);
        expect(inMemoryCache.refreshTokens[MockCache.rtFKey]).to.eql(MockCache.rtF);
        expect(inMemoryCache.appMetadata[MockCache.amdtKey]).to.eql(MockCache.amdt);
    });
});
