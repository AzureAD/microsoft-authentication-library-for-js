import { expect } from "chai";
import sinon from "sinon";
import {
    Authority,
    Constants,
    RefreshTokenClient,
    RefreshTokenRequest
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
        sinon.stub(Authority.prototype, <any>"discoverEndpoints").resolves(DEFAULT_OPENID_CONFIG_RESPONSE);
        sinon.stub(RefreshTokenClient.prototype, <any>"executePostToTokenEndpoint").resolves(AUTHENTICATION_RESULT);
        const createTokenRequestBodySpy = sinon.spy(RefreshTokenClient.prototype, <any>"createTokenRequestBody");

        const config = await ClientTestUtils.createTestClientConfiguration();
        const client = new RefreshTokenClient(config);
        const refreshTokenRequest: RefreshTokenRequest = {
            scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
            refreshToken: TEST_TOKENS.REFRESH_TOKEN
        };

        const authResult = await client.acquireToken(refreshTokenRequest);

        expect(JSON.parse(authResult)).to.deep.eq(AUTHENTICATION_RESULT.body);
        expect(createTokenRequestBodySpy.calledWith(refreshTokenRequest)).to.be.true;

        expect(createTokenRequestBodySpy.returnValues[0]).to.contain(`${TEST_CONFIG.DEFAULT_GRAPH_SCOPE}%20${Constants.OPENID_SCOPE}%20${Constants.PROFILE_SCOPE}%20${Constants.OFFLINE_ACCESS_SCOPE}`);
        expect(createTokenRequestBodySpy.returnValues[0]).to.contain(`${AADServerParamKeys.CLIENT_ID}=${TEST_CONFIG.MSAL_CLIENT_ID}`);
        expect(createTokenRequestBodySpy.returnValues[0]).to.contain(`${AADServerParamKeys.REFRESH_TOKEN}=${TEST_TOKENS.REFRESH_TOKEN}`);
        expect(createTokenRequestBodySpy.returnValues[0]).to.contain(`${AADServerParamKeys.GRANT_TYPE}=${GrantType.REFRESH_TOKEN_GRANT}`);
    });
});
