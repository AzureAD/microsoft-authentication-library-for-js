import { expect } from "chai";
import sinon from "sinon";
import {
    CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT,
    DEFAULT_OPENID_CONFIG_RESPONSE,
    TEST_CONFIG,
} from "../utils/StringConstants";
import { BaseClient } from "../../src/client/BaseClient";
import { AADServerParamKeys, GrantType, Constants } from "../../src/utils/Constants";
import { ClientTestUtils } from "./ClientTestUtils";
import { Authority } from "../../src/authority/Authority";
import { ClientCredentialClient } from "../../src/client/ClientCredentialClient";
import { ClientCredentialRequest } from "../../src/request/ClientCredentialRequest";
import { AccessTokenEntity } from "../../src/cache/entities/AccessTokenEntity"
import { TimeUtils } from "../../src/utils/TimeUtils";

describe("ClientCredentialClient unit tests", () => {
    beforeEach(() => {
        ClientTestUtils.setCloudDiscoveryMetadataStubs();
    });

    afterEach(() => {
        sinon.restore();
    });

    describe("Constructor", async () => {

        it("creates a ClientCredentialClient", async () => {
            sinon.stub(Authority.prototype, <any>"discoverEndpoints").resolves(DEFAULT_OPENID_CONFIG_RESPONSE);
            const config = await ClientTestUtils.createTestClientConfiguration();
            const client = new ClientCredentialClient(config);
            expect(client).to.be.not.null;
            expect(client instanceof ClientCredentialClient).to.be.true;
            expect(client instanceof BaseClient).to.be.true;
        });
    });

    it("acquires a token", async () => {
        sinon.stub(Authority.prototype, <any>"discoverEndpoints").resolves(DEFAULT_OPENID_CONFIG_RESPONSE);
        sinon.stub(ClientCredentialClient.prototype, <any>"executePostToTokenEndpoint").resolves(CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT);

        const createTokenRequestBodySpy = sinon.spy(ClientCredentialClient.prototype, <any>"createTokenRequestBody");

        const config = await ClientTestUtils.createTestClientConfiguration();
        const client = new ClientCredentialClient(config);
        const clientCredentialRequest: ClientCredentialRequest = {
            scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
        };

        const authResult = await client.acquireToken(clientCredentialRequest);
        const expectedScopes = [TEST_CONFIG.DEFAULT_GRAPH_SCOPE[0]];
        expect(authResult.scopes).to.deep.eq(expectedScopes);
        expect(authResult.accessToken).to.deep.eq(CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT.body.access_token);
        expect(authResult.state).to.be.empty;

        expect(createTokenRequestBodySpy.calledWith(clientCredentialRequest)).to.be.true;

        expect(createTokenRequestBodySpy.returnValues[0]).to.contain(`${TEST_CONFIG.DEFAULT_GRAPH_SCOPE[0]}`);
        expect(createTokenRequestBodySpy.returnValues[0]).to.contain(`${AADServerParamKeys.CLIENT_ID}=${TEST_CONFIG.MSAL_CLIENT_ID}`);
        expect(createTokenRequestBodySpy.returnValues[0]).to.contain(`${AADServerParamKeys.GRANT_TYPE}=${GrantType.CLIENT_CREDENTIALS_GRANT}`);
        expect(createTokenRequestBodySpy.returnValues[0]).to.contain(`${AADServerParamKeys.CLIENT_SECRET}=${TEST_CONFIG.MSAL_CLIENT_SECRET}`);
    });

    it("acquires a token, returns token from the cache", async () => {
        sinon.stub(Authority.prototype, <any>"discoverEndpoints").resolves(DEFAULT_OPENID_CONFIG_RESPONSE);
        const config = await ClientTestUtils.createTestClientConfiguration();
        const client = new ClientCredentialClient(config);

        const expectedAtEntity: AccessTokenEntity = AccessTokenEntity.createAccessTokenEntity(
            "", "login.microsoftonline.com", "an_access_token", config.authOptions.clientId, TEST_CONFIG.TENANT, TEST_CONFIG.DEFAULT_GRAPH_SCOPE.toString(), 4600, 4600);
            
        sinon.stub(ClientCredentialClient.prototype, <any>"readAccessTokenFromCache").returns(expectedAtEntity);
        sinon.stub(TimeUtils, <any>"isTokenExpired").returns(false);

        const clientCredentialRequest: ClientCredentialRequest = {
            scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
        };

        const authResult = await client.acquireToken(clientCredentialRequest);
        const expectedScopes = [TEST_CONFIG.DEFAULT_GRAPH_SCOPE[0]];
        expect(authResult.scopes).to.deep.eq(expectedScopes);
        expect(authResult.accessToken).to.deep.eq("an_access_token");
        expect(authResult.account).to.be.null;
        expect(authResult.fromCache).to.be.true;
        expect(authResult.uniqueId).to.be.empty;
        expect(authResult.state).to.be.empty;
    });

    it("acquires a token, skipCache = true", async () => {
        sinon.stub(Authority.prototype, <any>"discoverEndpoints").resolves(DEFAULT_OPENID_CONFIG_RESPONSE);
        sinon.stub(ClientCredentialClient.prototype, <any>"executePostToTokenEndpoint").resolves(CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT);

        const createTokenRequestBodySpy = sinon.spy(ClientCredentialClient.prototype, <any>"createTokenRequestBody");

        const config = await ClientTestUtils.createTestClientConfiguration();
        const client = new ClientCredentialClient(config);
        const clientCredentialRequest: ClientCredentialRequest = {
            scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
            skipCache: true
        };

        const authResult = await client.acquireToken(clientCredentialRequest);
        const expectedScopes = [TEST_CONFIG.DEFAULT_GRAPH_SCOPE[0]];
        expect(authResult.scopes).to.deep.eq(expectedScopes);
        expect(authResult.accessToken).to.deep.eq(CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT.body.access_token);
        expect(authResult.state).to.be.empty;

        expect(createTokenRequestBodySpy.calledWith(clientCredentialRequest)).to.be.true;

        expect(createTokenRequestBodySpy.returnValues[0]).to.contain(`${TEST_CONFIG.DEFAULT_GRAPH_SCOPE[0]}`);
        expect(createTokenRequestBodySpy.returnValues[0]).to.contain(`${AADServerParamKeys.CLIENT_ID}=${TEST_CONFIG.MSAL_CLIENT_ID}`);
        expect(createTokenRequestBodySpy.returnValues[0]).to.contain(`${AADServerParamKeys.GRANT_TYPE}=${GrantType.CLIENT_CREDENTIALS_GRANT}`);
        expect(createTokenRequestBodySpy.returnValues[0]).to.contain(`${AADServerParamKeys.CLIENT_SECRET}=${TEST_CONFIG.MSAL_CLIENT_SECRET}`);
    });
});
