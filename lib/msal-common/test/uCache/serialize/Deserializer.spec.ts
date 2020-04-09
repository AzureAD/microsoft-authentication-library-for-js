import { expect } from "chai";
import { CacheInterface } from "../../../src/uCache/serialize/CacheInterface";
import { mockCache } from "../entities/cacheConstants";
import { Deserializer } from "../../../src/uCache/serialize/Deserializer";

const cachedJson = require("./cache.json");

describe("Deserializer test cases", () => {
    const jsonContent = CacheInterface.deserializeJSONBlob(cachedJson);

    it("deSerializeAccessTokens", () => {
        // create mock AccessToken
        const at = mockCache.createMockATOne();
        const atKey = at.generateAccessTokenEntityKey();

        // serialize the mock AccessToken and Test equivalency with the cache.json provided
        const atCache = Deserializer.deSerializeAccessTokens(jsonContent.accessTokens);
        expect(atCache[atKey]).to.eql(at);
    });

    it("deSerializeIdTokens", () => {
        // create mock IdToken
        const idt = mockCache.createMockIdT();
        const idTKey = idt.generateIdTokenEntityKey();

        // serialize the mock IdToken and Test equivalency with the cache.json provided
        const idTCache = Deserializer.deSerializeIdTokens(jsonContent.idTokens);
        expect(idTCache[idTKey]).to.eql(idt);
    });

    it("deSerializeRefreshTokens", () => {
        // create mock Refresh Token
        const rt = mockCache.createMockRT();
        const rtKey = rt.generateRefreshTokenEntityKey();

        // serialize the mock RefreshToken and Test equivalency with the cache.json provided
        const rtCache = Deserializer.deSerializeRefreshTokens(
            jsonContent.refreshTokens
        );
        expect(rtCache[rtKey]).to.eql(rt);
    });

    it("deSerializeAccounts", () => {
        // create mock Account
        const acc = mockCache.createMockAcc();
        const accKey = acc.generateAccountEntityKey();

        // serialize the mock Account and Test equivalency with the cache.json provided
        const accCache = Deserializer.deSerializeAccounts(jsonContent.accounts);
        expect(accCache[accKey]).to.eql(acc);
    });

    it("deserializeAppMetadata", () => {
        // create mock AppMetadata
        const amdt = mockCache.createMockAmdt();
        const amdtKey = amdt.generateAppMetaDataEntityKey();

        // serialize the mock AppMetadata and Test equivalency with the cache.json provided
        const amdtCache = Deserializer.deserializeAppMetadata(jsonContent.appMetadata);
        expect(amdtCache[amdtKey]).to.eql(amdt);
    });
});
