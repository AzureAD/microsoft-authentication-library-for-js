import { expect } from "chai";
import { CacheInterface } from "../../../src/uCache/serialize/CacheInterface";
import { mockAccessTokenEntity, mockIdTokenEntity, mockRefreshTokenEntity, mockAccountEntity, mockAppMetaDataEntity } from "../entities/cacheConstants";
import { Serializer } from "../../../src/uCache/serialize/Serializer";
import { Deserializer } from "../../../src/uCache/serialize/Deserializer";
import { AccessTokenEntity } from "../../../src/uCache/entities/AccessTokenEntity";
import { IdTokenEntity } from "../../../src/uCache/entities/IdTokenEntity";
import { RefreshTokenEntity } from "../../../src/uCache/entities/RefreshTokenEntity";
import { AccountEntity } from "../../../src/uCache/entities/AccountEntity";
import { AppMetadataEntity } from "../../../src/uCache/entities/AppMetadataEntity";

const cachedJson = require("./cache.json");

describe("CacheInterface test cases", () => {
    it.only("retrieve JSON blob: AccessTokens", () => {
        const jsonContent = CacheInterface.deserializeJSONBlob(cachedJson);

        let at = new AccessTokenEntity();
        Object.assign(at, mockAccessTokenEntity);
        const atKey = at.generateAccessTokenEntityKey();
        const serializedAt = Serializer.serializeAccessTokenEntity(at);

        expect(serializedAt[atKey]).to.eql(jsonContent.accessTokens[atKey]);

        console.log("jsonContent.accessTokens: \n", jsonContent.accessTokens);
        const deserializedAt = Deserializer.deSerializeAccessTokens(jsonContent.accessTokens);
        console.log("deserializedAt: \n", deserializedAt);
        console.log("at: \n", at);
        // expect(deserializedAt).to.eql(at[atKey]);
    });

    it.only("retrieve JSON blob: IdTokens", () => {
        const jsonContent = CacheInterface.deserializeJSONBlob(cachedJson);

        let idt = new IdTokenEntity();
        Object.assign(idt, mockIdTokenEntity);
        const serializedIdToken = Serializer.serializeIdTokenCacheEntity(idt);

        expect(serializedIdToken).to.eql(jsonContent.idTokens);
    });

    it.only("retrieve JSON blob: RefreshTokens", () => {
        const jsonContent = CacheInterface.deserializeJSONBlob(cachedJson);

        let rt = new RefreshTokenEntity();
        Object.assign(rt, mockRefreshTokenEntity);
        const serializedRT = Serializer.serializeRefreshTokenCacheEntity(rt);

        expect(serializedRT).to.eql(jsonContent.refreshTokens);
    });

    it.only("retrieve JSON blob: Accounts", () => {
        const jsonContent = CacheInterface.deserializeJSONBlob(cachedJson);

        let ac = new AccountEntity();
        Object.assign(ac, mockAccountEntity);
        const serializedAc = Serializer.serializeAccountCacheEntity(ac);

        expect(serializedAc).to.eql(jsonContent.accounts);
    });

    it.only("retrieve JSON blob: AppMetadata", () => {
        const jsonContent = CacheInterface.deserializeJSONBlob(cachedJson);

        let appMetadata = new AppMetadataEntity();
        Object.assign(appMetadata, mockAppMetaDataEntity);
        const serializedAmdt= Serializer.serializeAppMetadataCacheEntity(appMetadata);

        expect(serializedAmdt).to.eql(jsonContent.appMetadata);
    });

    it.only("retrieve empty JSON blob", () => {
        const jsonContent = CacheInterface.deserializeJSONBlob();
        expect(jsonContent.accounts).to.eql({});
        expect(jsonContent.accessTokens).to.eql({});
        expect(jsonContent.idTokens).to.eql({});
        expect(jsonContent.refreshTokens).to.eql({});
        expect(jsonContent.appMetadata).to.eql({});
    });
});
