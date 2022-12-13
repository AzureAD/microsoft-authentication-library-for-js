import { AccessTokenEntity, Constants, CredentialEntity, CredentialType } from "../../../src";
import {TEST_CONFIG, TEST_DATA_CLIENT_INFO} from "../../test_kit/StringConstants";

describe("CredentialEntity.ts Unit Tests", () => {

    const clientId = TEST_CONFIG.MSAL_CLIENT_ID;

    it("Get credential type - access token", () => {
        const atEntity = new AccessTokenEntity();
        Object.assign(atEntity, {
            homeAccountId: `${TEST_DATA_CLIENT_INFO.TEST_UID}.${TEST_DATA_CLIENT_INFO.TEST_UTID}`,
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

    it("Get credential type - missing homeAccountId - access token", () => {
        const atEntity = new AccessTokenEntity();
        Object.assign(atEntity, {
            homeAccountId: Constants.EMPTY_STRING,
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

    it("Get credential type - metadata key - empty result", () => {
        const key = `authority-metadata-${clientId}-login.microsoftonline.com`;
        expect(CredentialEntity.getCredentialType(key)).toEqual(Constants.NOT_DEFINED);
    });

    it("Get credential type - partial workflow match - empty result", () => {
        const key = `${TEST_DATA_CLIENT_INFO.TEST_UID}.${TEST_DATA_CLIENT_INFO.TEST_UTID}_accessTokenWorkflow_login.microsoftonline.com-someothertoken-${clientId}---`;
        expect(CredentialEntity.getCredentialType(key)).toEqual(Constants.NOT_DEFINED);
    });

    it("Get credential type - missing utid - empty result", () => {
        const key = `${TEST_DATA_CLIENT_INFO.TEST_UID}_login.microsoftonline.com-accessToken-${clientId}---`;
        expect(CredentialEntity.getCredentialType(key)).toEqual(Constants.NOT_DEFINED);
    });
});
