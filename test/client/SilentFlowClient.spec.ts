import { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import sinon from "sinon";
import {
    AUTHENTICATION_RESULT,
    DEFAULT_OPENID_CONFIG_RESPONSE,
    TEST_CONFIG,
    TEST_TOKENS,
    TEST_DATA_CLIENT_INFO,
    TEST_URIS,
} from "../utils/StringConstants";
import { BaseClient } from "../../src/client/BaseClient";
import { AADServerParamKeys, GrantType, Constants, CredentialType } from "../../src/utils/Constants";
import { ClientTestUtils, MockStorageClass } from "./ClientTestUtils";
import { Authority } from "../../src/authority/Authority";
import { SilentFlowClient } from "../../src/client/SilentFlowClient";
import { RefreshTokenClient } from "../../src/client/RefreshTokenClient";
import { AuthenticationResult } from "../../src/response/AuthenticationResult";
import { AccountInfo } from "../../src/account/AccountInfo";
import { SilentFlowRequest, AccountEntity, IdTokenEntity, AccessTokenEntity, RefreshTokenEntity, CacheManager, ClientConfigurationErrorMessage, ClientAuthErrorMessage, AuthToken } from "../../src";
import { TokenClaims } from "../../dist/src/account/TokenClaims";

describe("SilentFlowClient unit tests", () => {
    beforeEach(() => {
        ClientTestUtils.setCloudDiscoveryMetadataStubs();
    });
    
    afterEach(() => {
        sinon.restore();
    });

    describe("Constructor", async () => {
        it("creates a SilentFlowClient", async () => {
            sinon.stub(Authority.prototype, <any>"discoverEndpoints").resolves(DEFAULT_OPENID_CONFIG_RESPONSE);
            const config = await ClientTestUtils.createTestClientConfiguration();
            const client = new SilentFlowClient(config);
            expect(client).to.be.not.null;
            expect(client instanceof SilentFlowClient).to.be.true;
            expect(client instanceof BaseClient).to.be.true;
        });
    });

    describe("Error cases", () => {
        const testAccount: AccountInfo = {
            homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
            environment: "login.windows.net",
            tenantId: "testTenantId",
            username: "testname@contoso.com"
        };

        it("Throws error if request object is null or undefined", async () => {
            sinon.stub(Authority.prototype, <any>"discoverEndpoints").resolves(DEFAULT_OPENID_CONFIG_RESPONSE);
            const config = await ClientTestUtils.createTestClientConfiguration();
            const client = new SilentFlowClient(config);
            await expect(client.acquireToken(null)).to.be.rejectedWith(ClientConfigurationErrorMessage.tokenRequestEmptyError.desc);
            await expect(client.acquireToken(null)).to.be.rejectedWith(ClientConfigurationErrorMessage.tokenRequestEmptyError.desc);
        });

        it("Throws error if scopes are not included in request object", async () => {
            sinon.stub(Authority.prototype, <any>"discoverEndpoints").resolves(DEFAULT_OPENID_CONFIG_RESPONSE);
            const config = await ClientTestUtils.createTestClientConfiguration();
            const client = new SilentFlowClient(config);
            await expect(client.acquireToken({
                scopes: null,
                account: testAccount
            })).to.be.rejectedWith(ClientConfigurationErrorMessage.emptyScopesError.desc);
        });

        it("Throws error if scopes are empty in request object", async () => {
            const tokenRequest: SilentFlowRequest = {
                scopes: [],
                account: testAccount
            };
            sinon.stub(Authority.prototype, <any>"discoverEndpoints").resolves(DEFAULT_OPENID_CONFIG_RESPONSE);
            const config = await ClientTestUtils.createTestClientConfiguration();
            const client = new SilentFlowClient(config);
            await expect(client.acquireToken(tokenRequest)).to.be.rejectedWith(ClientConfigurationErrorMessage.emptyScopesError.desc);
        });

        it("Throws error if it does not find token in cache", async () => {
            const testScope2 = "scope2";
            const testAccountEntity: AccountEntity = new AccountEntity();
            testAccountEntity.homeAccountId = TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID;
            testAccountEntity.localAccountId = "testId";
            testAccountEntity.environment = "login.windows.net";
            testAccountEntity.realm = "testTenantId";
            testAccountEntity.username = "username@contoso.com";
            testAccountEntity.authorityType = "MSSTS";
            sinon.stub(MockStorageClass.prototype, "getAccount").returns(testAccountEntity);
            sinon.stub(Authority.prototype, <any>"discoverEndpoints").resolves(DEFAULT_OPENID_CONFIG_RESPONSE);
            const tokenRequest: SilentFlowRequest = {
                scopes: [testScope2],
                account: testAccount
            };
            const config = await ClientTestUtils.createTestClientConfiguration();
            const client = new SilentFlowClient(config);
            await expect(client.acquireToken(tokenRequest)).to.be.rejectedWith(ClientAuthErrorMessage.noTokensFoundError.desc);
        });
    });

    it("acquires a token", async () => {
        const idTokenClaims: TokenClaims = {
            "ver": "2.0",
            "iss": "https://login.microsoftonline.com/9188040d-6c67-4c5b-b112-36a304b66dad/v2.0",
            "sub": "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
            "exp": 1536361411,
            "name": "Abe Lincoln",
            "preferred_username": "AbeLi@microsoft.com",
            "oid": "00000000-0000-0000-66f3-3332eca7ea81",
            "tid": "3338040d-6c67-4c5b-b112-36a304b66dad",
            "nonce": "123523",
        };

        const testAccountEntity: AccountEntity = new AccountEntity();
        testAccountEntity.homeAccountId = TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID;
        testAccountEntity.localAccountId = "testId";
        testAccountEntity.environment = "login.windows.net";
        testAccountEntity.realm = idTokenClaims.tid;
        testAccountEntity.username = idTokenClaims.preferred_username;
        testAccountEntity.authorityType = "MSSTS";

        const testIdToken: IdTokenEntity = new IdTokenEntity();
        testIdToken.homeAccountId = TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID;
        testIdToken.clientId = TEST_CONFIG.MSAL_CLIENT_ID;
        testIdToken.environment = testAccountEntity.environment;
        testIdToken.realm = idTokenClaims.tid;
        testIdToken.secret = AUTHENTICATION_RESULT.body.id_token;
        testIdToken.credentialType = CredentialType.ID_TOKEN;

        const testAccessTokenEntity: AccessTokenEntity = new AccessTokenEntity();
        testAccessTokenEntity.homeAccountId = TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID;
        testAccessTokenEntity.clientId = TEST_CONFIG.MSAL_CLIENT_ID;
        testAccessTokenEntity.environment = testAccountEntity.environment;
        testAccessTokenEntity.realm = idTokenClaims.tid;
        testAccessTokenEntity.secret = AUTHENTICATION_RESULT.body.access_token;
        testAccessTokenEntity.credentialType = CredentialType.ACCESS_TOKEN;

        const testRefreshTokenEntity: RefreshTokenEntity = new RefreshTokenEntity();
        testRefreshTokenEntity.homeAccountId = TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID;
        testRefreshTokenEntity.clientId = TEST_CONFIG.MSAL_CLIENT_ID;
        testRefreshTokenEntity.environment = testAccountEntity.environment;
        testRefreshTokenEntity.realm = idTokenClaims.tid;
        testRefreshTokenEntity.secret = AUTHENTICATION_RESULT.body.refresh_token;
        testRefreshTokenEntity.credentialType = CredentialType.REFRESH_TOKEN;

        sinon.stub(Authority.prototype, <any>"discoverEndpoints").resolves(DEFAULT_OPENID_CONFIG_RESPONSE);
        AUTHENTICATION_RESULT.body.client_info = TEST_DATA_CLIENT_INFO.TEST_DECODED_CLIENT_INFO;
        sinon.stub(RefreshTokenClient.prototype, <any>"executePostToTokenEndpoint").resolves(AUTHENTICATION_RESULT);
        sinon.stub(AuthToken, "extractTokenClaims").returns(idTokenClaims);
        sinon.stub(CacheManager.prototype, "getAccount").returns(testAccountEntity);

        const createTokenRequestBodySpy = sinon.spy(RefreshTokenClient.prototype, <any>"createTokenRequestBody");
        sinon.stub(SilentFlowClient.prototype, <any>"readIdTokenFromCache").returns(testIdToken);
        sinon.stub(SilentFlowClient.prototype, <any>"readAccessTokenFromCache").returns(testAccessTokenEntity);
        sinon.stub(SilentFlowClient.prototype, <any>"readRefreshTokenFromCache").returns(testRefreshTokenEntity);
        sinon.stub(SilentFlowClient.prototype, <any>"isTokenExpired").returns(true);

        const config = await ClientTestUtils.createTestClientConfiguration();
        const client = new SilentFlowClient(config);
        const testAccount: AccountInfo = {
            homeAccountId: `${TEST_DATA_CLIENT_INFO.TEST_UID}.${TEST_DATA_CLIENT_INFO.TEST_UTID}`,
            tenantId: idTokenClaims.tid,
            environment: "login.windows.net",
            username: idTokenClaims.preferred_username
        };

        const silentFlowRequest: SilentFlowRequest = {
            scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
            account: testAccount,
            forceRefresh: true
        };

        const authResult: AuthenticationResult = await client.acquireToken(silentFlowRequest);
        const expectedScopes = [Constants.OPENID_SCOPE, Constants.PROFILE_SCOPE, TEST_CONFIG.DEFAULT_GRAPH_SCOPE[0], "email"];
        expect(authResult.uniqueId).to.deep.eq(idTokenClaims.oid);
        expect(authResult.tenantId).to.deep.eq(idTokenClaims.tid);
        expect(authResult.scopes).to.deep.eq(expectedScopes);
        expect(authResult.account).to.deep.eq(testAccount);
        expect(authResult.idToken).to.deep.eq(AUTHENTICATION_RESULT.body.id_token);
        expect(authResult.idTokenClaims).to.deep.eq(idTokenClaims);
        expect(authResult.accessToken).to.deep.eq(AUTHENTICATION_RESULT.body.access_token);
        expect(authResult.state).to.be.empty;

        expect(createTokenRequestBodySpy.returnValues[0]).to.contain(`${TEST_CONFIG.DEFAULT_GRAPH_SCOPE[0]}`);
        expect(createTokenRequestBodySpy.returnValues[0]).to.contain(`${AADServerParamKeys.CLIENT_ID}=${TEST_CONFIG.MSAL_CLIENT_ID}`);
        expect(createTokenRequestBodySpy.returnValues[0]).to.contain(`${AADServerParamKeys.REFRESH_TOKEN}=${TEST_TOKENS.REFRESH_TOKEN}`);
        expect(createTokenRequestBodySpy.returnValues[0]).to.contain(`${AADServerParamKeys.GRANT_TYPE}=${GrantType.REFRESH_TOKEN_GRANT}`);
    });
});
