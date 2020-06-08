import { expect } from "chai";
import sinon from "sinon";
import {
    Authority,
    Constants,
    RefreshTokenClient,
    RefreshTokenRequest,
    SilentFlowClient,
    SilentFlowRequest
} from "../../src";
import {
    AUTHENTICATION_RESULT,
    DEFAULT_OPENID_CONFIG_RESPONSE,
    TEST_CONFIG,
    TEST_TOKENS,
} from "../utils/StringConstants";
import { BaseClient } from "../../src/client/BaseClient";
import { AADServerParamKeys, GrantType } from "../../src/utils/Constants";
import { ClientTestUtils } from "./ClientTestUtils";

describe("SilentFlowClient unit tests", () => {
    afterEach(() => {
        sinon.restore();
    });

    describe("Constructor", async () => {
        it("creates a SilentFlowClient", async () => {
            sinon
                .stub(Authority.prototype, <any>"discoverEndpoints")
                .resolves(DEFAULT_OPENID_CONFIG_RESPONSE);
            const config = await ClientTestUtils.createTestClientConfiguration();
            const client = new SilentFlowClient(config);
            expect(client).to.be.not.null;
            expect(client instanceof SilentFlowClient).to.be.true;
            expect(client instanceof BaseClient).to.be.true;
        });
    });

    it("acquires a token", async () => {
        sinon
            .stub(Authority.prototype, <any>"discoverEndpoints")
            .resolves(DEFAULT_OPENID_CONFIG_RESPONSE);
        sinon
            .stub(
                RefreshTokenClient.prototype,
                <any>"executePostToTokenEndpoint"
            )
            .resolves(AUTHENTICATION_RESULT);
        const createTokenRequestBodySpy = sinon.spy(
            SilentFlowClient.prototype,
            <any>"createTokenRequestBody"
        );

        const config = await ClientTestUtils.createTestClientConfiguration();
        const client = new SilentFlowClient(config);
        const silentFlowRequest: SilentFlowRequest = {
            scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
        };

        const authResult = await client.acquireToken(silenFlowRequest);

        expect(JSON.parse(authResult)).to.deep.eq(AUTHENTICATION_RESULT.body);
        expect(createTokenRequestBodySpy.calledWith(silentFlowRequest)).to.be
            .true;

        expect(createTokenRequestBodySpy.returnValues[0]).to.contain(
            `${TEST_CONFIG.DEFAULT_GRAPH_SCOPE}%20${Constants.OPENID_SCOPE}%20${Constants.PROFILE_SCOPE}%20${Constants.OFFLINE_ACCESS_SCOPE}`
        );
        expect(createTokenRequestBodySpy.returnValues[0]).to.contain(
            `${AADServerParamKeys.CLIENT_ID}=${TEST_CONFIG.MSAL_CLIENT_ID}`
        );
        expect(createTokenRequestBodySpy.returnValues[0]).to.contain(
            `${AADServerParamKeys.REFRESH_TOKEN}=${TEST_TOKENS.REFRESH_TOKEN}`
        );
        expect(createTokenRequestBodySpy.returnValues[0]).to.contain(
            `${AADServerParamKeys.GRANT_TYPE}=${GrantType.REFRESH_TOKEN_GRANT}`
        );
    });
});
