import { expect } from "chai";
import { mockCache } from "../entities/cacheConstants";
import { Serializer } from "../../../src/unifiedCache/serialize/Serializer";
import { Deserializer } from "../../../src/unifiedCache/serialize/Deserializer";

const cachedJson = require("./cache.json");

describe("Serializer test cases", () => {
    const jsonContent = Deserializer.deserializeJSONBlob(cachedJson);

    it("serializeJSONBlob", () => {
        const json = Serializer.serializeJSONBlob(cachedJson);
        expect(JSON.parse(json)).to.eql(cachedJson);
    });

    it("serializeAccountCacheEntity", () => {
        // create mock Account
        const acc = mockCache.createMockAcc();
        const accKey = acc.generateAccountEntityKey();

        // serialize the mock Account and Test equivalency with the cache.json provided
        const serializedAcc = Serializer.serializeAccounts({acc});
        expect(serializedAcc[accKey]).to.eql(jsonContent.Account[accKey]);
    });

    it("serializeIdTokenCacheEntity", () => {
        // create mock IdToken
        const idt = mockCache.createMockIdT();
        const idTKey = idt.generateIdTokenEntityKey();

        // serialize the mock IdToken and Test equivalency with the cache.json provided
        const serializedIdT = Serializer.serializeIdTokens({ idt });
        expect(serializedIdT[idTKey]).to.eql(jsonContent.IdToken[idTKey]);
    });

    it("serializeAccessTokenEntity", () => {
        // create mock AccessToken
        const at = mockCache.createMockATOne();
        const atKey = at.generateAccessTokenEntityKey();

        // serialize the mock AccessToken and Test equivalency with the cache.json provided
        const serializedAt = Serializer.serializeAccessTokens({at});
        expect(serializedAt[atKey]).to.eql(jsonContent.AccessToken[atKey]);
    });

    it("serializeRefreshTokenCacheEntity", () => {
        // create mock Refresh Token
        const rt = mockCache.createMockRT();
        const rtKey = rt.generateRefreshTokenEntityKey();

        // serialize the mock RefreshToken and Test equivalency with the cache.json provided
        const serializedRT = Serializer.serializeRefreshTokens({ rt });
        expect(serializedRT[rtKey]).to.eql(jsonContent.RefreshToken[rtKey]);
    });

    it("serializeAppMetadataCacheEntity", () => {
        // create mock AppMetadata
        const amdt = mockCache.createMockAmdt();
        const amdtKey = amdt.generateAppMetaDataEntityKey();

        // serialize the mock AppMetadata and Test equivalency with the cache.json provided
        const serializedAmdt = Serializer.serializeAppMetadata({amdt});
        expect(serializedAmdt[amdtKey]).to.eql(jsonContent.AppMetadata[amdtKey]);
    });

});
