import { expect } from "chai";
import sinon from "sinon";
import {
    CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT,
    DEFAULT_OPENID_CONFIG_RESPONSE,
    TEST_CONFIG,
    TEST_TOKENS,
    CORS_SIMPLE_REQUEST_HEADERS
} from "../test_kit/StringConstants";
import { BaseClient } from "../../src/client/BaseClient";
import { AADServerParamKeys, GrantType, Constants, AuthenticationScheme, ThrottlingConstants } from "../../src/utils/Constants";
import { ClientTestUtils, mockCrypto } from "./ClientTestUtils";
import { Authority } from "../../src/authority/Authority";
import { ClientCredentialClient } from "../../src/client/ClientCredentialClient";
import { CommonClientCredentialRequest } from "../../src/request/CommonClientCredentialRequest";
import { AccessTokenEntity } from "../../src/cache/entities/AccessTokenEntity"
import { TimeUtils } from "../../src/utils/TimeUtils";
import { CredentialCache } from "../../src/cache/utils/CacheTypes";
import { CacheManager } from "../../src/cache/CacheManager";
import { ClientAuthErrorMessage } from "../../src/error/ClientAuthError";

describe("ClientCredentialClient unit tests", () => {
    afterEach(() => {
        sinon.restore();
    });

    describe("Constructor", async () => {

        it("creates a ClientCredentialClient", async () => {
            sinon.stub(Authority.prototype, <any>"getEndpointMetadataFromNetwork").resolves(DEFAULT_OPENID_CONFIG_RESPONSE.body);
            const config = await ClientTestUtils.createTestClientConfiguration();
            const client = new ClientCredentialClient(config);
            expect(client).to.be.not.null;
            expect(client instanceof ClientCredentialClient).to.be.true;
            expect(client instanceof BaseClient).to.be.true;
        });
    });

    it("acquires a token", async () => {
        sinon.stub(Authority.prototype, <any>"getEndpointMetadataFromNetwork").resolves(DEFAULT_OPENID_CONFIG_RESPONSE.body);
        sinon.stub(ClientCredentialClient.prototype, <any>"executePostToTokenEndpoint").resolves(CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT);

        const createTokenRequestBodySpy = sinon.spy(ClientCredentialClient.prototype, <any>"createTokenRequestBody");

        const config = await ClientTestUtils.createTestClientConfiguration();
        const client = new ClientCredentialClient(config);
        const clientCredentialRequest: CommonClientCredentialRequest = {
            authority: TEST_CONFIG.validAuthority,
            correlationId: TEST_CONFIG.CORRELATION_ID,
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
        expect(createTokenRequestBodySpy.returnValues[0]).to.contain(`${AADServerParamKeys.X_CLIENT_SKU}=${Constants.SKU}`);
        expect(createTokenRequestBodySpy.returnValues[0]).to.contain(`${AADServerParamKeys.X_CLIENT_VER}=${TEST_CONFIG.TEST_VERSION}`);
        expect(createTokenRequestBodySpy.returnValues[0]).to.contain(`${AADServerParamKeys.X_CLIENT_OS}=${TEST_CONFIG.TEST_OS}`);
        expect(createTokenRequestBodySpy.returnValues[0]).to.contain(`${AADServerParamKeys.X_CLIENT_CPU}=${TEST_CONFIG.TEST_CPU}`);
        expect(createTokenRequestBodySpy.returnValues[0]).to.contain(`${AADServerParamKeys.X_MS_LIB_CAPABILITY}=${ThrottlingConstants.X_MS_LIB_CAPABILITY_VALUE}`);
    });

    it("Adds claims when provided", async () => {
        sinon.stub(Authority.prototype, <any>"getEndpointMetadataFromNetwork").resolves(DEFAULT_OPENID_CONFIG_RESPONSE.body);
        sinon.stub(ClientCredentialClient.prototype, <any>"executePostToTokenEndpoint").resolves(CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT);

        const createTokenRequestBodySpy = sinon.spy(ClientCredentialClient.prototype, <any>"createTokenRequestBody");

        const config = await ClientTestUtils.createTestClientConfiguration();
        const client = new ClientCredentialClient(config);
        const clientCredentialRequest: CommonClientCredentialRequest = {
            authority: TEST_CONFIG.validAuthority,
            correlationId: TEST_CONFIG.CORRELATION_ID,
            scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
            claims: TEST_CONFIG.CLAIMS
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
        expect(createTokenRequestBodySpy.returnValues[0]).to.contain(`${AADServerParamKeys.X_CLIENT_SKU}=${Constants.SKU}`);
        expect(createTokenRequestBodySpy.returnValues[0]).to.contain(`${AADServerParamKeys.X_CLIENT_VER}=${TEST_CONFIG.TEST_VERSION}`);
        expect(createTokenRequestBodySpy.returnValues[0]).to.contain(`${AADServerParamKeys.X_CLIENT_OS}=${TEST_CONFIG.TEST_OS}`);
        expect(createTokenRequestBodySpy.returnValues[0]).to.contain(`${AADServerParamKeys.X_CLIENT_CPU}=${TEST_CONFIG.TEST_CPU}`);
        expect(createTokenRequestBodySpy.returnValues[0]).to.contain(`${AADServerParamKeys.X_MS_LIB_CAPABILITY}=${ThrottlingConstants.X_MS_LIB_CAPABILITY_VALUE}`);
        expect(createTokenRequestBodySpy.returnValues[0]).to.contain(`${AADServerParamKeys.CLAIMS}=${encodeURIComponent(TEST_CONFIG.CLAIMS)}`);
    });

    it("Does not add claims when empty object provided", async () => {
        sinon.stub(Authority.prototype, <any>"getEndpointMetadataFromNetwork").resolves(DEFAULT_OPENID_CONFIG_RESPONSE.body);
        sinon.stub(ClientCredentialClient.prototype, <any>"executePostToTokenEndpoint").resolves(CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT);

        const createTokenRequestBodySpy = sinon.spy(ClientCredentialClient.prototype, <any>"createTokenRequestBody");

        const config = await ClientTestUtils.createTestClientConfiguration();
        const client = new ClientCredentialClient(config);
        const clientCredentialRequest: CommonClientCredentialRequest = {
            authority: TEST_CONFIG.validAuthority,
            correlationId: TEST_CONFIG.CORRELATION_ID,
            scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
            claims: "{}"
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
        expect(createTokenRequestBodySpy.returnValues[0]).to.contain(`${AADServerParamKeys.X_CLIENT_SKU}=${Constants.SKU}`);
        expect(createTokenRequestBodySpy.returnValues[0]).to.contain(`${AADServerParamKeys.X_CLIENT_VER}=${TEST_CONFIG.TEST_VERSION}`);
        expect(createTokenRequestBodySpy.returnValues[0]).to.contain(`${AADServerParamKeys.X_CLIENT_OS}=${TEST_CONFIG.TEST_OS}`);
        expect(createTokenRequestBodySpy.returnValues[0]).to.contain(`${AADServerParamKeys.X_CLIENT_CPU}=${TEST_CONFIG.TEST_CPU}`);
        expect(createTokenRequestBodySpy.returnValues[0]).to.contain(`${AADServerParamKeys.X_MS_LIB_CAPABILITY}=${ThrottlingConstants.X_MS_LIB_CAPABILITY_VALUE}`);
        expect(createTokenRequestBodySpy.returnValues[0]).to.not.contain(`${AADServerParamKeys.CLAIMS}=${encodeURIComponent(TEST_CONFIG.CLAIMS)}`);
    });

    it("Does not add headers that do not qualify for a simple request", async () => {
        // For more information about this test see: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
        let stubCalled = false;
        sinon.stub(Authority.prototype, <any>"getEndpointMetadataFromNetwork").resolves(DEFAULT_OPENID_CONFIG_RESPONSE.body);
        sinon.stub(ClientCredentialClient.prototype, <any>"executePostToTokenEndpoint").callsFake((tokenEndpoint: string, queryString: string, headers: Record<string, string>) => {
            const headerNames = Object.keys(headers);
            headerNames.forEach((name) => {
                expect(CORS_SIMPLE_REQUEST_HEADERS).contains(name.toLowerCase());
            });

            stubCalled = true;
            return CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT;
        });

        const config = await ClientTestUtils.createTestClientConfiguration();
        const client = new ClientCredentialClient(config);
        const clientCredentialRequest: CommonClientCredentialRequest = {
            authority: TEST_CONFIG.validAuthority,
            correlationId: TEST_CONFIG.CORRELATION_ID,
            scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
        };

        await client.acquireToken(clientCredentialRequest);
        expect(stubCalled).to.be.true;
    });

    it("acquires a token, returns token from the cache", async () => {
        sinon.stub(Authority.prototype, <any>"getEndpointMetadataFromNetwork").resolves(DEFAULT_OPENID_CONFIG_RESPONSE.body);
        const config = await ClientTestUtils.createTestClientConfiguration();
        const client = new ClientCredentialClient(config);

        const expectedAtEntity: AccessTokenEntity = AccessTokenEntity.createAccessTokenEntity(
            "", "login.microsoftonline.com", "an_access_token", config.authOptions.clientId, TEST_CONFIG.TENANT, TEST_CONFIG.DEFAULT_GRAPH_SCOPE.toString(), 4600, 4600, mockCrypto, undefined, AuthenticationScheme.BEARER);
            
        sinon.stub(ClientCredentialClient.prototype, <any>"readAccessTokenFromCache").returns(expectedAtEntity);
        sinon.stub(TimeUtils, <any>"isTokenExpired").returns(false);

        const clientCredentialRequest: CommonClientCredentialRequest = {
            authority: TEST_CONFIG.validAuthority,
            correlationId: TEST_CONFIG.CORRELATION_ID,
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
        sinon.stub(Authority.prototype, <any>"getEndpointMetadataFromNetwork").resolves(DEFAULT_OPENID_CONFIG_RESPONSE.body);
        sinon.stub(ClientCredentialClient.prototype, <any>"executePostToTokenEndpoint").resolves(CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT);

        const createTokenRequestBodySpy = sinon.spy(ClientCredentialClient.prototype, <any>"createTokenRequestBody");

        const config = await ClientTestUtils.createTestClientConfiguration();
        const client = new ClientCredentialClient(config);
        const clientCredentialRequest: CommonClientCredentialRequest = {
            authority: TEST_CONFIG.validAuthority,
            correlationId: TEST_CONFIG.CORRELATION_ID,
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

    it("Multiple access tokens matched, exception thrown", async () => {
        sinon.stub(Authority.prototype, <any>"getEndpointMetadataFromNetwork").resolves(DEFAULT_OPENID_CONFIG_RESPONSE.body);
        const config = await ClientTestUtils.createTestClientConfiguration();
        
        // mock access token
        const mockedAtEntity: AccessTokenEntity = AccessTokenEntity.createAccessTokenEntity(
            "", "login.microsoftonline.com", "an_access_token", config.authOptions.clientId, TEST_CONFIG.TENANT, TEST_CONFIG.DEFAULT_GRAPH_SCOPE.toString(), 4600, 4600, mockCrypto, undefined, TEST_TOKENS.ACCESS_TOKEN);
            
        const mockedAtEntity2: AccessTokenEntity = AccessTokenEntity.createAccessTokenEntity(
            "", "login.microsoftonline.com", "an_access_token", config.authOptions.clientId, TEST_CONFIG.TENANT, TEST_CONFIG.DEFAULT_GRAPH_SCOPE.toString(), 4600, 4600, mockCrypto, undefined, TEST_TOKENS.ACCESS_TOKEN);
            
        const mockedCredentialCache: CredentialCache = {
            accessTokens: { 
                "key1": mockedAtEntity,
                "key2": mockedAtEntity2
            },
            refreshTokens: null,
            idTokens: null
        }

        sinon.stub(CacheManager.prototype, <any>"getCredentialsFilteredBy").returns(mockedCredentialCache);

        const client = new ClientCredentialClient(config);
        const clientCredentialRequest: CommonClientCredentialRequest = {
            authority: TEST_CONFIG.validAuthority,
            correlationId: TEST_CONFIG.CORRELATION_ID,
            scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
        };

        await expect(client.acquireToken(clientCredentialRequest)).to.be.rejectedWith(`${ClientAuthErrorMessage.multipleMatchingTokens.desc}`);
    });

});
