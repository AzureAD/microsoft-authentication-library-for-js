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
import { IdTokenClaims } from "../../src/account/IdTokenClaims";
import { IdToken } from "../../src/account/IdToken";
import { RefreshTokenRequest } from "../../src/request/RefreshTokenRequest";
import { AccountEntity } from "../../src/cache/entities/AccountEntity";
import { RefreshTokenEntity } from "../../src/cache/entities/RefreshTokenEntity";
import { AuthenticationResult } from "../../src/response/AuthenticationResult";
import { AccountInfo } from "../../src/account/AccountInfo";
import { CacheManager } from "../../src/cache/CacheManager";
import { ClientConfiguration } from "../../src/config/ClientConfiguration";
import { SilentFlowRequest } from "../../src/request/SilentFlowRequest";
import { ClientAuthErrorMessage } from "../../src/error/ClientAuthError";
import { ClientConfigurationErrorMessage } from "../../src/error/ClientConfigurationError";

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

    describe("acquireToken APIs", () => {
        let config: ClientConfiguration;
        let client: RefreshTokenClient;

        const testAccount: AccountInfo = {
            homeAccountId: `${TEST_DATA_CLIENT_INFO.TEST_UID}.${TEST_DATA_CLIENT_INFO.TEST_UTID}`,
            tenantId: ID_TOKEN_CLAIMS.tid,
            environment: "login.windows.net",
            username: ID_TOKEN_CLAIMS.preferred_username,
            name: ID_TOKEN_CLAIMS.name
        };

        beforeEach(async () => {
            sinon.stub(Authority.prototype, <any>"discoverEndpoints").resolves(DEFAULT_OPENID_CONFIG_RESPONSE);
            AUTHENTICATION_RESULT.body.client_info = TEST_DATA_CLIENT_INFO.TEST_DECODED_CLIENT_INFO;
            sinon.stub(RefreshTokenClient.prototype, <any>"executePostToTokenEndpoint").resolves(AUTHENTICATION_RESULT);
            sinon.stub(IdToken, "extractIdToken").returns(ID_TOKEN_CLAIMS);
            sinon.stub(CacheManager.prototype, "getAccount").returns(testAccountEntity);
            sinon.stub(CacheManager.prototype, "getRefreshTokenEntity").returns(testRefreshTokenEntity);

            config = await ClientTestUtils.createTestClientConfiguration();
            client = new RefreshTokenClient(config);
        });

        afterEach(() => {
            sinon.restore();
        });

        it("acquires a token", async () => {          
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
            expect(authResult.uniqueId).to.deep.eq(ID_TOKEN_CLAIMS.oid);
            expect(authResult.tenantId).to.deep.eq(ID_TOKEN_CLAIMS.tid);
            expect(authResult.scopes).to.deep.eq(expectedScopes);
            expect(authResult.account).to.deep.eq(testAccount);
            expect(authResult.idToken).to.deep.eq(AUTHENTICATION_RESULT.body.id_token);
            expect(authResult.idTokenClaims).to.deep.eq(ID_TOKEN_CLAIMS);
            expect(authResult.accessToken).to.deep.eq(AUTHENTICATION_RESULT.body.access_token);
            expect(authResult.state).to.be.empty;
    
            expect(createTokenRequestBodySpy.calledWith(refreshTokenRequest)).to.be.true;
    
            expect(createTokenRequestBodySpy.returnValues[0]).to.contain(`${TEST_CONFIG.DEFAULT_GRAPH_SCOPE[0]}`);
            expect(createTokenRequestBodySpy.returnValues[0]).to.contain(`${AADServerParamKeys.CLIENT_ID}=${TEST_CONFIG.MSAL_CLIENT_ID}`);
            expect(createTokenRequestBodySpy.returnValues[0]).to.contain(`${AADServerParamKeys.REFRESH_TOKEN}=${TEST_TOKENS.REFRESH_TOKEN}`);
            expect(createTokenRequestBodySpy.returnValues[0]).to.contain(`${AADServerParamKeys.GRANT_TYPE}=${GrantType.REFRESH_TOKEN_GRANT}`);
            expect(createTokenRequestBodySpy.returnValues[0]).to.contain(`${AADServerParamKeys.CLIENT_SECRET}=${TEST_CONFIG.MSAL_CLIENT_SECRET}`);
            expect(createTokenRequestBodySpy.returnValues[0]).to.contain(`${AADServerParamKeys.CLAIMS}=${encodeURIComponent(TEST_CONFIG.CLAIMS)}`);
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
