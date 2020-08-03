import { expect } from "chai";
import sinon from "sinon";
import {
    AUTHENTICATION_RESULT,
    DEFAULT_OPENID_CONFIG_RESPONSE,
    TEST_CONFIG,
    TEST_TOKENS,
    TEST_DATA_CLIENT_INFO,
    TEST_URIS,
} from "../utils/StringConstants";
import {BaseClient} from "../../src/client/BaseClient";
import {AADServerParamKeys, GrantType, Constants} from "../../src/utils/Constants";
import {ClientTestUtils} from "./ClientTestUtils";
import { Authority } from "../../src/authority/Authority";
import { RefreshTokenClient } from "../../src/client/RefreshTokenClient";
import { IdTokenClaims } from "../../src/account/IdTokenClaims";
import { IdToken } from "../../src/account/IdToken";
import { RefreshTokenRequest } from "../../src/request/RefreshTokenRequest";
import { AccountInfo, AuthenticationResult } from "../../src";

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
        const idTokenClaims: IdTokenClaims = {
            "ver": "2.0",
            "iss": "https://login.microsoftonline.com/9188040d-6c67-4c5b-b112-36a304b66dad/v2.0",
            "sub": "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
            "exp": "1536361411",
            "name": "Abe Lincoln",
            "preferred_username": "AbeLi@microsoft.com",
            "oid": "00000000-0000-0000-66f3-3332eca7ea81",
            "tid": "3338040d-6c67-4c5b-b112-36a304b66dad",
            "nonce": "123523",
        };
        sinon.stub(Authority.prototype, <any>"discoverEndpoints").resolves(DEFAULT_OPENID_CONFIG_RESPONSE);
        AUTHENTICATION_RESULT.body.client_info = TEST_DATA_CLIENT_INFO.TEST_DECODED_CLIENT_INFO;
        sinon.stub(RefreshTokenClient.prototype, <any>"executePostToTokenEndpoint").resolves(AUTHENTICATION_RESULT);
        sinon.stub(IdToken, "extractIdToken").returns(idTokenClaims);
        
        const createTokenRequestBodySpy = sinon.spy(RefreshTokenClient.prototype, <any>"createTokenRequestBody");

        const config = await ClientTestUtils.createTestClientConfiguration();
        const client = new RefreshTokenClient(config);
        const refreshTokenRequest: RefreshTokenRequest = {
            scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
            refreshToken: TEST_TOKENS.REFRESH_TOKEN,
            redirectUri: TEST_URIS.TEST_REDIR_URI
        };

        const authResult: AuthenticationResult = await client.acquireToken(refreshTokenRequest);
        const testAccount: AccountInfo = {
            homeAccountId: `${TEST_DATA_CLIENT_INFO.TEST_UID}.${TEST_DATA_CLIENT_INFO.TEST_UTID}`,
            tenantId: idTokenClaims.tid,
            environment: "login.windows.net",
            username: idTokenClaims.preferred_username
        };
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

        expect(createTokenRequestBodySpy.returnValues[0]).to.contain(`${TEST_CONFIG.DEFAULT_GRAPH_SCOPE[0]}`);
        expect(createTokenRequestBodySpy.returnValues[0]).to.contain(`${AADServerParamKeys.CLIENT_ID}=${TEST_CONFIG.MSAL_CLIENT_ID}`);
        expect(createTokenRequestBodySpy.returnValues[0]).to.contain(`${AADServerParamKeys.REFRESH_TOKEN}=${TEST_TOKENS.REFRESH_TOKEN}`);
        expect(createTokenRequestBodySpy.returnValues[0]).to.contain(`${AADServerParamKeys.GRANT_TYPE}=${GrantType.REFRESH_TOKEN_GRANT}`);
        expect(createTokenRequestBodySpy.returnValues[0]).to.contain(`${AADServerParamKeys.CLIENT_SECRET}=${TEST_CONFIG.MSAL_CLIENT_SECRET}`);
    });
});
