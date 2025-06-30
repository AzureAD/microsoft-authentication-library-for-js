import { mockAppMetaDataEntity, mockIdTokenEntity } from "./cacheConstants";
import { IdTokenEntity } from "../../../src/cache/entities/IdTokenEntity";
import { CacheHelpers } from "../../../src";
import { TEST_CONFIG } from "../../test_kit/StringConstants";

describe("AppMetadataEntity.ts Unit Tests", () => {
    it("Create an AppMetadataEntity", () => {
        expect(
            CacheHelpers.generateAppMetadataKey({
                clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                environment: TEST_CONFIG.validAuthorityHost,
                familyId: TEST_CONFIG.THE_FAMILY_ID,
            })
        ).toEqual(
            `appmetadata-${TEST_CONFIG.validAuthorityHost}-${TEST_CONFIG.MSAL_CLIENT_ID}`
        );
    });

    it("verify if an object is an appMetadata  entity", () => {
        const appM = {
            clientId: TEST_CONFIG.MSAL_CLIENT_ID,
            environment: TEST_CONFIG.validAuthorityHost,
            familyId: TEST_CONFIG.THE_FAMILY_ID,
        };
        const key = CacheHelpers.generateAppMetadataKey(appM);
        expect(
            CacheHelpers.isAppMetadataEntity(key, mockAppMetaDataEntity)
        ).toEqual(true);
    });

    it("verify if an object is not an appMetadata entity", () => {
        const key = CacheHelpers.generateCredentialKey(
            mockIdTokenEntity as IdTokenEntity
        );
        expect(
            CacheHelpers.isAppMetadataEntity(key, mockIdTokenEntity)
        ).toEqual(false);
    });
});
