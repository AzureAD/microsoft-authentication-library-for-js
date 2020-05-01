import { expect } from "chai";
import sinon from "sinon";
import {
    Authority,
    AuthorizationCodeClient,
    Configuration,
    Constants, RefreshTokenClient, RefreshTokenRequest
} from "../../src";
import {
    AUTHENTICATION_RESULT,
    DEFAULT_OPENID_CONFIG_RESPONSE,
    TEST_CONFIG,
    TEST_TOKENS,
} from "../utils/StringConstants";
import {BaseClient} from "../../src/client/BaseClient";
import {AADServerParamKeys, GrantType} from "../../src/utils/Constants";
import {ClientTestUtils} from "./ClientTestUtils";

describe("RefreshTokenClient unit tests", () => {

    let config: Configuration;

    beforeEach(() => {
        config = ClientTestUtils.createTestClientConfiguration();
    });

    afterEach(() => {
        sinon.restore();
    });

    describe("Constructor", () => {

        it("creates a RefreshTokenClient", () => {
            const client = new RefreshTokenClient(config);
            expect(client).to.be.not.null;
            expect(client instanceof RefreshTokenClient).to.be.true;
            expect(client instanceof BaseClient).to.be.true;
        });
    });

    describe("Acquire a token", async () => {
        sinon.stub(Authority.prototype, <any>"discoverEndpoints").resolves(DEFAULT_OPENID_CONFIG_RESPONSE);
        sinon.stub(AuthorizationCodeClient.prototype, <any>"executePostToTokenEndpoint").resolves(AUTHENTICATION_RESULT);
        const createTokenRequestBodySpy = sinon.spy(AuthorizationCodeClient.prototype, <any>"createTokenRequestBody");

        const client = new RefreshTokenClient(config);
        const refreshTokenRequest: RefreshTokenRequest = {
            scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
            refreshToken: TEST_TOKENS.REFRESH_TOKEN
        };

        const authResult = await client.acquireToken(refreshTokenRequest);

        expect(JSON.parse(authResult)).to.deep.eq(AUTHENTICATION_RESULT.body);
        expect(createTokenRequestBodySpy.calledWith(refreshTokenRequest)).to.be.ok;

        expect(createTokenRequestBodySpy.returnValues[0]).to.contain(`${AADServerParamKeys.SCOPE}=${TEST_CONFIG.DEFAULT_GRAPH_SCOPE}%20${Constants.OPENID_SCOPE}%20${Constants.PROFILE_SCOPE}%20${Constants.OFFLINE_ACCESS_SCOPE}`);
        expect(createTokenRequestBodySpy.returnValues[0]).to.contain(`${AADServerParamKeys.CLIENT_ID}=${TEST_CONFIG.MSAL_CLIENT_ID}`);
        expect(createTokenRequestBodySpy.returnValues[0]).to.contain(`${AADServerParamKeys.REFRESH_TOKEN}=${TEST_TOKENS.REFRESH_TOKEN}`);
        expect(createTokenRequestBodySpy.returnValues[0]).to.contain(`${AADServerParamKeys.GRANT_TYPE}=${GrantType.REFRESH_TOKEN_GRANT}`);
    });
});
