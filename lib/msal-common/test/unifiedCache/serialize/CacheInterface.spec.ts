import { expect } from "chai";
import { CacheInterface } from "../../../src/unifiedCache/serialize/CacheInterface";
import { mockCache } from "../entities/cacheConstants";

const cachedJson = require("./cache.json");
const accountJson = require("./Account.json");

describe("CacheInterface test cases", () => {

    const jsonContent = CacheInterface.deserializeJSONBlob(cachedJson);

    it("serializeJSONBlob", () => {
        const json = CacheInterface.serializeJSONBlob(cachedJson);
        expect(JSON.parse(json)).to.eql(cachedJson);
    });

    it("deserializeJSONBlob", () => {
        const mockAccount = {
            "uid.utid-login.microsoftonline.com-microsoft": {
                username: "John Doe",
                local_account_id: "object1234",
                realm: "microsoft",
                environment: "login.microsoftonline.com",
                home_account_id: "uid.utid",
                authority_type: "MSSTS",
                client_info: "base64encodedjson"
            }
        };
        const acc = CacheInterface.deserializeJSONBlob(accountJson);
        expect(acc.accounts).to.eql(mockAccount);
    });

    it("retrieve empty JSON blob", () => {
        const emptyCacheJson = {};
        const emptyJsonContent = CacheInterface.deserializeJSONBlob(emptyCacheJson);

        expect(emptyJsonContent.accounts).to.eql({});
        expect(emptyJsonContent.accessTokens).to.eql({});
        expect(emptyJsonContent.idTokens).to.eql({});
        expect(emptyJsonContent.refreshTokens).to.eql({});
        expect(emptyJsonContent.appMetadata).to.eql({});
    });

    it("generateAccessTokenCache", () => {
        // create mock AccessToken
        const atOne = mockCache.createMockATOne();
        const atOneKey = atOne.generateAccessTokenEntityKey();
        const atTwo = mockCache.createMockATTwo();
        const atTwoKey = atTwo.generateAccessTokenEntityKey();

        // deserialize the  AccessToken from memory and Test equivalency with the generated mock AccessToken
        const accessTokens = CacheInterface.generateAccessTokenCache(jsonContent.accessTokens);
        expect(accessTokens[atOneKey]).to.eql(atOne);
        expect(accessTokens[atTwoKey]).to.eql(atTwo);
    });

    it("generateIdTokenCache", () => {
        // create mock IdToken
        const idt = mockCache.createMockIdT();
        const idTKey = idt.generateIdTokenEntityKey();

        // deserialize the  IdToken from memory and Test equivalency with the generated mock IdToken
        const idTokens = CacheInterface.generateIdTokenCache(jsonContent.idTokens);
        expect(idTokens[idTKey]).to.eql(idt);
    });

    it("generateRefreshTokenCache", () => {
        // create mock Refresh Token
        const rt = mockCache.createMockRT();
        const rtKey = rt.generateRefreshTokenEntityKey();

        const rtF = mockCache.createMockRTWithFamilyId();
        const rtFKey = rtF.generateRefreshTokenEntityKey();

        // deserialize the RefreshToken from memory and Test equivalency with the generated mock Refresh Token
        const refreshTokens = CacheInterface.generateRefreshTokenCache(jsonContent.refreshTokens);
        expect(refreshTokens[rtKey]).to.eql(rt);
        expect(refreshTokens[rtFKey]).to.eql(rtF);
    });

    it("generateAccountCache", () => {
        // create mock Account
        const acc = mockCache.createMockAcc();
        const accKey = acc.generateAccountEntityKey();

        // deserialize the Account from memory and Test equivalency with the generated mock Account
        const accounts = CacheInterface.generateAccountCache(jsonContent.accounts);
        expect(accounts[accKey]).to.eql(acc);
    });

    it("generateAppMetadataCache", () => {
        // create mock AppMetadata
        const amdt = mockCache.createMockAmdt();
        const amdtKey = amdt.generateAppMetaDataEntityKey();

        // deserialize the AppMetadata from memory and Test equivalency with the generated mock AppMetadata
        const appMetadata = CacheInterface.generateAppMetadataCache(jsonContent.appMetadata);
        expect(appMetadata[amdtKey]).to.eql(amdt);
    });
});
