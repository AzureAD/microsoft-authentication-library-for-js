import { expect } from "chai";
import sinon from "sinon";
import {
    AUTHENTICATION_RESULT,
    DEFAULT_OPENID_CONFIG_RESPONSE,
    TEST_CONFIG,
    TEST_TOKENS,
    TEST_DATA_CLIENT_INFO,
    ID_TOKEN_CLAIMS,
} from "../utils/StringConstants";
import {BaseClient} from "../../src/client/BaseClient";
import {AADServerParamKeys, GrantType, Constants, CredentialType} from "../../src/utils/Constants";
import {ClientTestUtils} from "./ClientTestUtils";
import { Authority } from "../../src/authority/Authority";
import { RefreshTokenClient } from "../../src/client/RefreshTokenClient";
import { RefreshTokenRequest } from "../../src/request/RefreshTokenRequest";
import { TokenClaims } from "../../dist/src/account/TokenClaims";
import { AccountEntity } from "../../src/cache/entities/AccountEntity";
import { RefreshTokenEntity } from "../../src/cache/entities/RefreshTokenEntity";
import { AuthenticationResult } from "../../src/response/AuthenticationResult";
import { AccountInfo } from "../../src/account/AccountInfo";
import { CacheManager } from "../../src/cache/CacheManager";
import { ClientConfiguration } from "../../src/config/ClientConfiguration";
import { SilentFlowRequest } from "../../src/request/SilentFlowRequest";
import { ClientAuthErrorMessage } from "../../src/error/ClientAuthError";
import { ClientConfigurationErrorMessage } from "../../src/error/ClientConfigurationError";
import { AuthToken } from "../../dist/src";

const testAccountEntity: AccountEntity = new AccountEntity();
testAccountEntity.homeAccountId = `${TEST_DATA_CLIENT_INFO.TEST_UID}.${TEST_DATA_CLIENT_INFO.TEST_UTID}`;
testAccountEntity.localAccountId = "testId";
testAccountEntity.environment = "login.windows.net";
testAccountEntity.realm = ID_TOKEN_CLAIMS.tid;
testAccountEntity.username = ID_TOKEN_CLAIMS.preferred_username;
testAccountEntity.authorityType = "MSSTS";

const testRefreshTokenEntity: RefreshTokenEntity = new RefreshTokenEntity();
testRefreshTokenEntity.homeAccountId = `${TEST_DATA_CLIENT_INFO.TEST_UID}.${TEST_DATA_CLIENT_INFO.TEST_UTID}`;
testRefreshTokenEntity.clientId = TEST_CONFIG.MSAL_CLIENT_ID;
testRefreshTokenEntity.environment = testAccountEntity.environment;
testRefreshTokenEntity.realm = ID_TOKEN_CLAIMS.tid;
testRefreshTokenEntity.secret = AUTHENTICATION_RESULT.body.refresh_token;
testRefreshTokenEntity.credentialType = CredentialType.REFRESH_TOKEN;

describe("RefreshTokenClient unit tests", () => {
    beforeEach(() => {
        ClientTestUtils.setCloudDiscoveryMetadataStubs();
    });

    afterEach(() => {
        sinon.restore();
    });

    describe("Constructor", async () => {

        it("creates a RefreshTokenClient", async () => {
            sinon.stub(Authority.prototype, <any>"discoverEndpoints").resolves(DEFAULT_OPENID_CONFIG_RESPONSE);
            const config = await ClientTestUtils.createTestClientConfiguration();
            const client = new RefreshTokenClient(config);
            expect(client).to.be.not.null;
            expect(client instanceof RefreshTokenClient).to.be.true;
            expect(client instanceof BaseClient).to.be.true;
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
        sinon.stub(Authority.prototype, <any>"discoverEndpoints").resolves(DEFAULT_OPENID_CONFIG_RESPONSE);
        AUTHENTICATION_RESULT.body.client_info = TEST_DATA_CLIENT_INFO.TEST_DECODED_CLIENT_INFO;
        sinon.stub(RefreshTokenClient.prototype, <any>"executePostToTokenEndpoint").resolves(AUTHENTICATION_RESULT);
        sinon.stub(AuthToken, "extractTokenClaims").returns(idTokenClaims);
        
        const createTokenRequestBodySpy = sinon.spy(RefreshTokenClient.prototype, <any>"createTokenRequestBody");

        const config = await ClientTestUtils.createTestClientConfiguration();
        const client = new RefreshTokenClient(config);
        const refreshTokenRequest: RefreshTokenRequest = {
            scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
            refreshToken: TEST_TOKENS.REFRESH_TOKEN
        };
    describe("acquireToken APIs", () => {
        let config: ClientConfiguration;
        let client: RefreshTokenClient;

        const testAccount: AccountInfo = {
            homeAccountId: `${TEST_DATA_CLIENT_INFO.TEST_UID}.${TEST_DATA_CLIENT_INFO.TEST_UTID}`,
            tenantId: ID_TOKEN_CLAIMS.tid,
            environment: "login.windows.net",
            username: ID_TOKEN_CLAIMS.preferred_username
        };

        beforeEach(async () => {
            sinon.stub(Authority.prototype, <any>"discoverEndpoints").resolves(DEFAULT_OPENID_CONFIG_RESPONSE);
            AUTHENTICATION_RESULT.body.client_info = TEST_DATA_CLIENT_INFO.TEST_DECODED_CLIENT_INFO;
            sinon.stub(RefreshTokenClient.prototype, <any>"executePostToTokenEndpoint").resolves(AUTHENTICATION_RESULT);
            sinon.stub(AuthToken, "extractTokenClaims").returns(ID_TOKEN_CLAIMS);
            sinon.stub(CacheManager.prototype, "getAccount").returns(testAccountEntity);
            sinon.stub(CacheManager.prototype, "getRefreshTokenEntity").returns(testRefreshTokenEntity);

            config = await ClientTestUtils.createTestClientConfiguration();
            client = new RefreshTokenClient(config);
        });

        afterEach(() => {
            sinon.restore();
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
            sinon.stub(Authority.prototype, <any>"discoverEndpoints").resolves(DEFAULT_OPENID_CONFIG_RESPONSE);
            AUTHENTICATION_RESULT.body.client_info = TEST_DATA_CLIENT_INFO.TEST_DECODED_CLIENT_INFO;
            sinon.stub(RefreshTokenClient.prototype, <any>"executePostToTokenEndpoint").resolves(AUTHENTICATION_RESULT);
            sinon.stub(AuthToken, "extractTokenClaims").returns(idTokenClaims);
             
            const createTokenRequestBodySpy = sinon.spy(RefreshTokenClient.prototype, <any>"createTokenRequestBody");
    
            const config = await ClientTestUtils.createTestClientConfiguration();
            const client = new RefreshTokenClient(config);
            const refreshTokenRequest: RefreshTokenRequest = {
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                refreshToken: TEST_TOKENS.REFRESH_TOKEN,
                claims: TEST_CONFIG.CLAIMS
            };
    
            const authResult: AuthenticationResult = await client.acquireToken(refreshTokenRequest);
            const expectedScopes = [Constants.OPENID_SCOPE, Constants.PROFILE_SCOPE, TEST_CONFIG.DEFAULT_GRAPH_SCOPE[0], "email"];
            expect(authResult.uniqueId).to.deep.eq(idTokenClaims.oid);
            expect(authResult.tenantId).to.deep.eq(idTokenClaims.tid);
            expect(authResult.scopes).to.deep.eq(expectedScopes);
            expect(authResult.account).to.deep.eq(testAccount);
            expect(authResult.idToken).to.deep.eq(AUTHENTICATION_RESULT.body.id_token);
            expect(authResult.idTokenClaims).to.deep.eq(idTokenClaims);
            expect(authResult.accessToken).to.deep.eq(AUTHENTICATION_RESULT.body.access_token);
            expect(authResult.state).to.be.empty;

            expect(createTokenRequestBodySpy.calledWith(refreshTokenRequest)).to.be.true;

            await expect(createTokenRequestBodySpy.returnValues[0]).to.eventually.contain(`${TEST_CONFIG.DEFAULT_GRAPH_SCOPE[0]}`);
            await expect(createTokenRequestBodySpy.returnValues[0]).to.eventually.contain(`${AADServerParamKeys.CLIENT_ID}=${TEST_CONFIG.MSAL_CLIENT_ID}`);
            await expect(createTokenRequestBodySpy.returnValues[0]).to.eventually.contain(`${AADServerParamKeys.REFRESH_TOKEN}=${TEST_TOKENS.REFRESH_TOKEN}`);
            await expect(createTokenRequestBodySpy.returnValues[0]).to.eventually.contain(`${AADServerParamKeys.GRANT_TYPE}=${GrantType.REFRESH_TOKEN_GRANT}`);
            await expect(createTokenRequestBodySpy.returnValues[0]).to.eventually.contain(`${AADServerParamKeys.CLIENT_SECRET}=${TEST_CONFIG.MSAL_CLIENT_SECRET}`);
        });

        it("acquireTokenByRefreshToken refreshes a token", async () => {
            const silentFlowRequest: SilentFlowRequest = {
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                account: testAccount
            };

            const expectedRefreshRequest: RefreshTokenRequest = {
                ...silentFlowRequest,
                refreshToken: testRefreshTokenEntity.secret
            };
            const refreshTokenClientSpy = sinon.stub(RefreshTokenClient.prototype, "acquireToken");

            await client.acquireTokenByRefreshToken(silentFlowRequest);
            expect(refreshTokenClientSpy.calledWith(expectedRefreshRequest)).to.be.true;
        });
    });

    describe("Error cases", () => {
        it("Throws error if account is not included in request object", async () => {
            sinon.stub(Authority.prototype, <any>"discoverEndpoints").resolves(DEFAULT_OPENID_CONFIG_RESPONSE);
            const config = await ClientTestUtils.createTestClientConfiguration();
            const client = new RefreshTokenClient(config);
            await expect(client.acquireTokenByRefreshToken({
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                account: null
            })).to.be.rejectedWith(ClientAuthErrorMessage.NoAccountInSilentRequest.desc);
        });

        it("Throws error if request object is null or undefined", async () => {
            sinon.stub(Authority.prototype, <any>"discoverEndpoints").resolves(DEFAULT_OPENID_CONFIG_RESPONSE);
            const config = await ClientTestUtils.createTestClientConfiguration();
            const client = new RefreshTokenClient(config);
            await expect(client.acquireTokenByRefreshToken(null)).to.be.rejectedWith(ClientConfigurationErrorMessage.tokenRequestEmptyError.desc);
            await expect(client.acquireTokenByRefreshToken(undefined)).to.be.rejectedWith(ClientConfigurationErrorMessage.tokenRequestEmptyError.desc);
        });
    });
});
