import { expect } from "chai";
import { MockCache } from "../entities/cacheConstants";
import { Serializer } from "../../../src/cache/serialize/Serializer";
import { Deserializer } from "../../../src/cache/serialize/Deserializer";
import { JsonCache, InMemoryCache } from "../../../src/cache/utils/CacheTypes";

const cachedJson = require("./cache.json");

describe("Serializer test cases", () => {
    const cache = JSON.stringify(cachedJson);
    const jsonCache: JsonCache = Deserializer.deserializeJSONBlob(cache);

    it("serializeJSONBlob", () => {
        const json = Serializer.serializeJSONBlob(cachedJson);
        expect(JSON.parse(json)).to.eql(cachedJson);
    });

    it("serializeAccountCacheEntity", () => {
        // create mock Account
        const acc = { [MockCache.accKey]: MockCache.acc };

        // serialize the mock Account and Test equivalency with the cache.json provided
        const serializedAcc = Serializer.serializeAccounts(acc);
        expect(serializedAcc[MockCache.accKey]).to.eql(jsonCache.Account[MockCache.accKey]);
    });

    it("serializeIdTokenCacheEntity", () => {
        // create mock IdToken
        const idt = { [MockCache.idTKey]: MockCache.idT };

        // serialize the mock IdToken and Test equivalency with the cache.json provided
        const serializedIdT = Serializer.serializeIdTokens(idt);
        expect(serializedIdT[MockCache.idTKey]).to.eql(jsonCache.IdToken[MockCache.idTKey]);
    });

    it("serializeAccessTokenEntity", () => {
        // create mock AccessToken
        const at = { [MockCache.atOneKey]: MockCache.atOne };

        // serialize the mock AccessToken and Test equivalency with the cache.json provided
        const serializedAt = Serializer.serializeAccessTokens(at);
        expect(serializedAt[MockCache.atOneKey]).to.eql(jsonCache.AccessToken[MockCache.atOneKey]);
    });

    it("serializeRefreshTokenCacheEntity", () => {
        // create mock Refresh Token
        const rt = { [MockCache.rtKey]: MockCache.rt };

        // serialize the mock RefreshToken and Test equivalency with the cache.json provided
        const serializedRT = Serializer.serializeRefreshTokens(rt);
        expect(serializedRT[MockCache.rtKey]).to.eql(jsonCache.RefreshToken[MockCache.rtKey]);
    });

    it("serializeAppMetadataCacheEntity", () => {
        // create mock AppMetadata
        const amdt = { [MockCache.amdtKey]: MockCache.amdt };

        // serialize the mock AppMetadata and Test equivalency with the cache.json provided
        const serializedAmdt = Serializer.serializeAppMetadata(amdt);
        expect(serializedAmdt[MockCache.amdtKey]).to.eql(jsonCache.AppMetadata[MockCache.amdtKey]);
    });

    it("serializeAll", () => {

        // deserialize the cache from memory and Test equivalency with the generated mock cache
        const inMemoryCache: InMemoryCache = Deserializer.deserializeAllCache(jsonCache);
        const jCache: JsonCache = Serializer.serializeAllCache(inMemoryCache);

        expect(jCache.Account[MockCache.accKey]).to.eql(jsonCache.Account[MockCache.accKey]);
        expect(jCache.IdToken[MockCache.idTKey]).to.eql(jsonCache.IdToken[MockCache.idTKey]);
        expect(jCache.AccessToken[MockCache.atOneKey]).to.eql(jsonCache.AccessToken[MockCache.atOneKey]);
        expect(jCache.AccessToken[MockCache.atTwoKey]).to.eql(jsonCache.AccessToken[MockCache.atTwoKey]);
        expect(jCache.RefreshToken[MockCache.rtKey]).to.eql(jsonCache.RefreshToken[MockCache.rtKey]);
        expect(jCache.RefreshToken[MockCache.rtFKey]).to.eql(jsonCache.RefreshToken[MockCache.rtFKey]);
        expect(jCache.AppMetadata[MockCache.amdtKey]).to.eql(jsonCache.AppMetadata[MockCache.amdtKey]);
    });

});
