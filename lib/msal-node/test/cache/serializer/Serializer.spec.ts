import { JsonCache, InMemoryCache } from "../../../src/cache/serializer/SerializerTypes";
import { Serializer } from "../../../src/cache/serializer/Serializer";
import { Deserializer } from "../../../src/cache/serializer/Deserializer";
import { MockCache } from "../cacheConstants";

const cachedJson = require("./cache.json");

describe("Serializer test cases", () => {

    const cache = JSON.stringify(cachedJson);
    const jsonCache: JsonCache = Deserializer.deserializeJSONBlob(cache);

    test("serializeJSONBlob", () => {
        const json = Serializer.serializeJSONBlob(cachedJson);
        expect(JSON.parse(json)).toMatchObject(cachedJson);
    });

    test("serializeAccountCacheEntity", () => {
        // create mock Account
        const acc = { [MockCache.accKey]: MockCache.acc };

        // serialize the mock Account and Test equivalency with the cache.json provided
        const serializedAcc = Serializer.serializeAccounts(acc);
        expect(JSON.parse(serializedAcc[MockCache.accKey])).toMatchObject(jsonCache.Account[MockCache.accKey]);
    });

    test("serializeIdTokenCacheEntity", () => {
        // create mock IdToken
        const idt = { [MockCache.idTKey]: MockCache.idT };

        // serialize the mock IdToken and Test equivalency with the cache.json provided
        const serializedIdT = Serializer.serializeIdTokens(idt);
        expect(JSON.parse(serializedIdT[MockCache.idTKey])).toMatchObject(jsonCache.IdToken[MockCache.idTKey]);
    });

    test("serializeAccessTokenEntity", () => {
        // create mock AccessToken
        const at = { [MockCache.atOneKey]: MockCache.atOne };

        // serialize the mock AccessToken and Test equivalency with the cache.json provided
        const serializedAt = Serializer.serializeAccessTokens(at);
        expect(JSON.parse(serializedAt[MockCache.atOneKey])).toMatchObject(jsonCache.AccessToken[MockCache.atOneKey]);
    });

    test("serializeRefreshTokenCacheEntity", () => {
        // create mock Refresh Token
        const rt = { [MockCache.rtKey]: MockCache.rt };

        // serialize the mock RefreshToken and Test equivalency with the cache.json provided
        const serializedRT = Serializer.serializeRefreshTokens(rt);
        expect(JSON.parse(serializedRT[MockCache.rtKey])).toMatchObject(jsonCache.RefreshToken[MockCache.rtKey]);
    });

    test("serializeAppMetadataCacheEntity", () => {
        // create mock AppMetadata
        const amdt = { [MockCache.amdtKey]: MockCache.amdt };

        // serialize the mock AppMetadata and Test equivalency with the cache.json provided
        const serializedAmdt = Serializer.serializeAppMetadata(amdt);
        expect(JSON.parse(serializedAmdt[MockCache.amdtKey])).toMatchObject(jsonCache.AppMetadata[MockCache.amdtKey]);
    });

    test("serializeAll", () => {

        // deserialize the cache from memory and Test equivalency with the generated mock cache
        const inMemoryCache: InMemoryCache = Deserializer.deserializeAllCache(jsonCache);
        const jCache: JsonCache = Serializer.serializeAllCache(inMemoryCache);

        expect(JSON.parse(jCache.Account[MockCache.accKey])).toMatchObject(jsonCache.Account[MockCache.accKey]);
        expect(JSON.parse(jCache.IdToken[MockCache.idTKey])).toMatchObject(jsonCache.IdToken[MockCache.idTKey]);
        expect(JSON.parse(jCache.AccessToken[MockCache.atOneKey])).toMatchObject(jsonCache.AccessToken[MockCache.atOneKey]);
        expect(JSON.parse(jCache.AccessToken[MockCache.atTwoKey])).toMatchObject(jsonCache.AccessToken[MockCache.atTwoKey]);
        expect(JSON.parse(jCache.RefreshToken[MockCache.rtKey])).toMatchObject(jsonCache.RefreshToken[MockCache.rtKey]);
        expect(JSON.parse(jCache.RefreshToken[MockCache.rtFKey])).toMatchObject(jsonCache.RefreshToken[MockCache.rtFKey]);
        expect(JSON.parse(jCache.AppMetadata[MockCache.amdtKey])).toMatchObject(jsonCache.AppMetadata[MockCache.amdtKey]);
    });
});
