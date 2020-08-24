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
        let appM = new AppMetadataEntity();
        Object.assign(appM, mockAppMetaDataEntity);
        expect(appM.generateAppMetaDataEntityKey()).to.eql(
            "appmetadata-login.microsoftonline.com-mock_client_id"
        );
    });

    it("verify if an object is an appMetadata  entity", () => {
        let appM = new AppMetadataEntity();
        Object.assign(appM, mockAppMetaDataEntity);
        const key = appM.generateAppMetaDataEntityKey();
        expect(AppMetadataEntity.isAppMetadataEntity(key, mockAppMetaDataEntity)).to.eql(true);
    });

    it("verify if an object is not an appMetadata entity", () => {
        let idT = new IdTokenEntity();
        Object.assign(idT, mockIdTokenEntity);
        const key = idT.generateCredentialKey();
        expect(AppMetadataEntity.isAppMetadataEntity(key, mockIdTokenEntity)).to.eql(false);
    });
});
