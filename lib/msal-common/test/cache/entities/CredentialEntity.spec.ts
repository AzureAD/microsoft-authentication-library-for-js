import { AccessTokenEntity, Constants, CredentialEntity, CredentialType } from "../../../src";
import { TEST_CONFIG } from "../../test_kit/StringConstants";

describe("CredentialEntity.ts Unit Tests", () => {

    const clientId = TEST_CONFIG.MSAL_CLIENT_ID;

    it("Get credential type - access token", () => {
        const atEntity = new AccessTokenEntity();
        Object.assign(atEntity, {
            homeAccountId: "7c03d382-b152-4b48-8db1-da9064c8705a.be7c410f-3854-4dca-beb7-c8db3d21ef75",
            environment: "login.microsoftonline.com",
            credentialType: "AccessToken",
            clientId: "mock_client_id",
            secret: "an access token sample",
            realm: "microsoft",
            target: "scope6 scope7",
            cachedAt: "1000",
            expiresOn: "4600",
            extendedExpiresOn: "4600",
            tokenType: "Bearer"
        });

        const atKey = atEntity.generateCredentialKey();

        expect(CredentialEntity.getCredentialType(atKey)).toEqual(CredentialType.ACCESS_TOKEN);
    });

    it("Get credential type - metadata key", () => {
        const key = `authority-metadata-${clientId}-login.microsoftonline.com`;
        expect(CredentialEntity.getCredentialType(key)).toEqual(Constants.NOT_DEFINED);
    });

    it("Get credential type - partial match", () => {
        const key = `123_test_uid.456_test_accesstoken_utid_login.microsoftonline.com-someothertoken-${clientId}---`;
        expect(CredentialEntity.getCredentialType(key)).toEqual(Constants.NOT_DEFINED);
    });    
});
