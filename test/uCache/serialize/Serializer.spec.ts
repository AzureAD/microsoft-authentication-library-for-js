import { expect } from "chai";
import { CacheInterface } from "../../../src/uCache/serialize/CacheInterface";
import { mockCache } from "../entities/cacheConstants";
import { Serializer } from "../../../src/uCache/serialize/Serializer";

const cachedJson = require("./cache.json");

describe("Serializer test cases", () => {
    const jsonContent = CacheInterface.deserializeJSONBlob(cachedJson);

    it("serializeAccessTokenEntity", () => {
        // create mock AccessToken
        const at = mockCache.createMockATOne();
        const atKey = at.generateAccessTokenEntityKey();

        // serialize the mock AccessToken and Test equivalency with the cache.json provided
        const serializedAt = Serializer.serializeAccessTokenEntity(at);
        expect(serializedAt[atKey]).to.eql(jsonContent.accessTokens[atKey]);
    });

    it("serializeIdTokenCacheEntity", () => {
        // create mock IdToken
        const idt = mockCache.createMockIdT();
        const idTKey = idt.generateIdTokenEntityKey();

        // serialize the mock IdToken and Test equivalency with the cache.json provided
        const serializedIdT = Serializer.serializeIdTokenCacheEntity(idt);
        expect(serializedIdT[idTKey]).to.eql(jsonContent.idTokens[idTKey]);
    });

    it("serializeRefreshTokenCacheEntity", () => {
        // create mock Refresh Token
        const rt = mockCache.createMockRT();
        const rtKey = rt.generateRefreshTokenEntityKey();

        // serialize the mock RefreshToken and Test equivalency with the cache.json provided
        const serializedRT = Serializer.serializeRefreshTokenCacheEntity(rt);
        expect(serializedRT[rtKey]).to.eql(jsonContent.refreshTokens[rtKey]);
    });

    it("serializeAccountCacheEntity", () => {
        // create mock Account
        const acc = mockCache.createMockAcc();
        const accKey = acc.generateAccountEntityKey();

        // serialize the mock Account and Test equivalency with the cache.json provided
        const serializedAcc = Serializer.serializeAccountCacheEntity(acc);
        expect(serializedAcc[accKey]).to.eql(jsonContent.accounts[accKey]);
    });

    it("serializeAppMetadataCacheEntity", () => {
        // create mock AppMetadata
        const amdt = mockCache.createMockAmdt();
        const amdtKey = amdt.generateAppMetaDataEntityKey();

        // serialize the mock AppMetadata and Test equivalency with the cache.json provided
        const serializedAmdt = Serializer.serializeAppMetadataCacheEntity(amdt);
        expect(serializedAmdt[amdtKey]).to.eql(
            jsonContent.appMetadata[amdtKey]
        );
    });
});
