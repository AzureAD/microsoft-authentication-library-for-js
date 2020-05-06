import { expect } from "chai";
import { MockCache } from "../entities/cacheConstants";
import { Deserializer } from "../../../src/cache/serialize/Deserializer";
import { InMemoryCache, JsonCache } from "../../../src/cache/utils/CacheTypes";

const cacheJson = require("./cache.json");

describe("Deserializer test cases", () => {

    const cache = JSON.stringify(cacheJson);
    const jsonCache: JsonCache = Deserializer.deserializeJSONBlob(cache);

    it("deserializeJSONBlob", () => {
        const mockAccount = {
            "uid.utid-login.microsoftonline.com-microsoft": {
                username: "John Doe",
                local_account_id: "object1234",
                realm: "microsoft",
                environment: "login.microsoftonline.com",
                home_account_id: "uid.utid",
                authority_type: "MSSTS",
                client_info: "eyJ1aWQiOiJ1aWQiLCAidXRpZCI6InV0aWQifQ==",
            },
        };
        const acc = Deserializer.deserializeJSONBlob(cache);
        expect(acc.Account).to.eql(mockAccount);
    });

    it("deSerializeAccounts", () => {
        // serialize the mock Account and Test equivalency with the cache.json provided
        const accCache = Deserializer.deserializeAccounts(jsonCache.Account);
        expect(accCache[MockCache.accKey]).to.eql(MockCache.acc);
    });

    it("deSerializeIdTokens", () => {
        // serialize the mock IdToken and Test equivalency with the cache.json provided
        const idTCache = Deserializer.deserializeIdTokens(jsonCache.IdToken);
        expect(idTCache[MockCache.idTKey]).to.eql(MockCache.idT);
    });


    it("deSerializeAccessTokens", () => {
        // serialize the mock AccessToken and Test equivalency with the cache.json provided
        const atCache = Deserializer.deserializeAccessTokens(jsonCache.AccessToken);
        expect(atCache[MockCache.atOneKey]).to.eql(MockCache.atOne);
    });

    it("deSerializeRefreshTokens", () => {
        // serialize the mock RefreshToken and Test equivalency with the cache.json provided
        const rtCache = Deserializer.deserializeRefreshTokens(jsonCache.RefreshToken);
        expect(rtCache[MockCache.rtKey]).to.eql(MockCache.rt);
    });

    it("deserializeAppMetadata", () => {
        // serialize the mock AppMetadata and Test equivalency with the cache.json provided
        const amdtCache = Deserializer.deserializeAppMetadata(jsonCache.AppMetadata);
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
