import { expect } from "chai";
import { AppMetadataEntity } from "../../../src/cache/entities/AppMetadataEntity";
import { mockAppMetaDataEntity } from "./cacheConstants";

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
});
