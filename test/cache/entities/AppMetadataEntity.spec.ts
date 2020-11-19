import { expect } from "chai";
import { AppMetadataEntity } from "../../../src/cache/entities/AppMetadataEntity";
import { mockAppMetaDataEntity, mockIdTokenEntity } from "./cacheConstants";
import { IdTokenEntity } from "../../../src";

describe("AppMetadataEntity.ts Unit Tests", () => {
    it("Verify an AppMetadataEntity", () => {
        const appM = new AppMetadataEntity();
        expect(appM instanceof AppMetadataEntity);
    });

    it("Create an AppMetadataEntity", () => {
        const appM = new AppMetadataEntity();
        Object.assign(appM, mockAppMetaDataEntity);
        expect(appM.generateAppMetadataKey()).to.eql(
            "appmetadata-login.microsoftonline.com-mock_client_id"
        );
    });

    it("verify if an object is an appMetadata  entity", () => {
        const appM = new AppMetadataEntity();
        Object.assign(appM, mockAppMetaDataEntity);
        const key = appM.generateAppMetadataKey();
        expect(AppMetadataEntity.isAppMetadataEntity(key, mockAppMetaDataEntity)).to.eql(true);
    });

    it("verify if an object is not an appMetadata entity", () => {
        const idT = new IdTokenEntity();
        Object.assign(idT, mockIdTokenEntity);
        const key = idT.generateCredentialKey();
        expect(AppMetadataEntity.isAppMetadataEntity(key, mockIdTokenEntity)).to.eql(false);
    });
});
