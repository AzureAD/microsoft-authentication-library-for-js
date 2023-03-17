import { AccessTokenEntity, Constants, CredentialEntity, CredentialType } from "../../../src";
import {TEST_CONFIG, TEST_DATA_CLIENT_INFO} from "../../test_kit/StringConstants";

describe("CredentialEntity.ts Unit Tests", () => {

    const clientId = TEST_CONFIG.MSAL_CLIENT_ID;
    const homeAccountId = `${TEST_DATA_CLIENT_INFO.TEST_UID}.${TEST_DATA_CLIENT_INFO.TEST_UTID}`;

    describe("Get credential type", () => {
        it("GUID homeAccountId - Is access token", () => {
            const atEntity = new AccessTokenEntity();
            Object.assign(atEntity, {
                homeAccountId,
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

        it("String homeAccountId - Is access token", () => {
            const atEntity = new AccessTokenEntity();
            Object.assign(atEntity, {
                homeAccountId: "homeAccountId",
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

        it("Missing homeAccountId - is access token", () => {
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

        it("Host name with prefix and port - Is access token", () => {
            const atEntity = new AccessTokenEntity();
            Object.assign(atEntity, {
                homeAccountId,
                environment: "https://login.microsoftonline.com:40000",
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

        it("Host name with multiple top level domains - Is access token", () => {
            const atEntity = new AccessTokenEntity();
            Object.assign(atEntity, {
                homeAccountId,
                environment: "login.microsoftonline.us.com:40000",
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

        it("Host name with a single long top level domain - Is access token", () => {
            const atEntity = new AccessTokenEntity();
            Object.assign(atEntity, {
                homeAccountId,
                environment: "test.domainname.education:40000",
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

        it("Host name with multiple long top level domains - Is access token", () => {
            const atEntity = new AccessTokenEntity();
            Object.assign(atEntity, {
                homeAccountId,
                environment: "test.domainname.business.info:40000",
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

        it("Localhost - Is access token", () => {
            const atEntity = new AccessTokenEntity();
            Object.assign(atEntity, {
                homeAccountId,
                environment: "https://localhost:5000",
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

        it("Host name with suffix - Is access token", () => {
            const atEntity = new AccessTokenEntity();
            Object.assign(atEntity, {
                homeAccountId,
                environment: "test.domainname.education/common",
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

        it("Host name with port and suffix - Is access token", () => {
            const atEntity = new AccessTokenEntity();
            Object.assign(atEntity, {
                homeAccountId,
                environment: "test.domainname.education:40000/common",
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

        it("Host name with port and GUID suffix - Is access token", () => {
            const atEntity = new AccessTokenEntity();
            Object.assign(atEntity, {
                homeAccountId,
                environment: "test.domainname.education:40000/626ea03e-72d7-4033-8931-10b6ed62109a",
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

        it("Metadata key - empty result", () => {
            const key = `authority-metadata-${clientId}-login.microsoftonline.com`;
            expect(CredentialEntity.getCredentialType(key)).toEqual(Constants.NOT_DEFINED);
        });

        it("Partial workflow match - empty result", () => {
            const key = `${homeAccountId}-accessTokenWorkflow-login.microsoftonline.com-someothertoken-${clientId}---`;
            expect(CredentialEntity.getCredentialType(key)).toEqual(Constants.NOT_DEFINED);
        });

        it("Empty host name - empty result", () => {
            const key = `${homeAccountId}--accessToken-${clientId}---`;
            expect(CredentialEntity.getCredentialType(key)).toEqual(Constants.NOT_DEFINED);
        });
    })
});
