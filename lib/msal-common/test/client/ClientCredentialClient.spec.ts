import sinon from "sinon";
import {
    CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT,
    DEFAULT_OPENID_CONFIG_RESPONSE,
    TEST_CONFIG,
    TEST_TOKENS,
    CORS_SIMPLE_REQUEST_HEADERS,
    DSTS_OPENID_CONFIG_RESPONSE,
    DSTS_CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT,
    AUTHENTICATION_RESULT_DEFAULT_SCOPES,
    ID_TOKEN_CLAIMS
} from "../test_kit/StringConstants";
import { BaseClient } from "../../src/client/BaseClient";
import { AADServerParamKeys, GrantType, Constants, AuthenticationScheme, ThrottlingConstants } from "../../src/utils/Constants";
import { ClientTestUtils, mockCrypto } from "./ClientTestUtils";
import { Authority } from "../../src/authority/Authority";
import { ClientCredentialClient } from "../../src/client/ClientCredentialClient";
import { CommonClientCredentialRequest } from "../../src/request/CommonClientCredentialRequest";
import { UsernamePasswordClient } from "../../src/client/UsernamePasswordClient";
import { CommonUsernamePasswordRequest } from "../../src/request/CommonUsernamePasswordRequest";
import { AccessTokenEntity } from "../../src/cache/entities/AccessTokenEntity"
import { TimeUtils } from "../../src/utils/TimeUtils";
import { CredentialCache } from "../../src/cache/utils/CacheTypes";
import { CacheManager } from "../../src/cache/CacheManager";
import { ClientAuthError } from "../../src/error/ClientAuthError";
import { AuthenticationResult } from "../../src/response/AuthenticationResult";
import { AppTokenProviderResult, AuthToken, IAppTokenProvider } from "../../src";

describe("ClientCredentialClient unit tests", () => {
    afterEach(() => {
        sinon.restore();
    });

    describe("Constructor", () => {

        it("creates a ClientCredentialClient", async () => {
            sinon.stub(Authority.prototype, <any>"getEndpointMetadataFromNetwork").resolves(DEFAULT_OPENID_CONFIG_RESPONSE.body);
            const config = await ClientTestUtils.createTestClientConfiguration();
            const client = new ClientCredentialClient(config);
            expect(client).not.toBeNull();
            expect(client instanceof ClientCredentialClient).toBe(true);
            expect(client instanceof BaseClient).toBe(true);
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

        const authResult = await client.acquireToken(clientCredentialRequest) as AuthenticationResult;
        const expectedScopes = [TEST_CONFIG.DEFAULT_GRAPH_SCOPE[0]];
        expect(authResult.scopes).toEqual(expectedScopes);
        expect(authResult.accessToken).toEqual(CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT.body.access_token);
        expect(authResult.state).toHaveLength(0);

        expect(createTokenRequestBodySpy.calledWith(clientCredentialRequest)).toBe(true);

        const returnVal = await createTokenRequestBodySpy.returnValues[0] as string;
        expect(returnVal.includes(`${TEST_CONFIG.DEFAULT_GRAPH_SCOPE[0]}`)).toBe(true);
        expect(returnVal.includes(`${AADServerParamKeys.CLIENT_ID}=${TEST_CONFIG.MSAL_CLIENT_ID}`)).toBe(true);
        expect(returnVal.includes(`${AADServerParamKeys.GRANT_TYPE}=${GrantType.CLIENT_CREDENTIALS_GRANT}`)).toBe(true);
        expect(returnVal.includes(`${AADServerParamKeys.CLIENT_SECRET}=${TEST_CONFIG.MSAL_CLIENT_SECRET}`)).toBe(true);
        expect(returnVal.includes(`${AADServerParamKeys.X_CLIENT_SKU}=${Constants.SKU}`)).toBe(true);
        expect(returnVal.includes(`${AADServerParamKeys.X_CLIENT_VER}=${TEST_CONFIG.TEST_VERSION}`)).toBe(true);
        expect(returnVal.includes(`${AADServerParamKeys.X_CLIENT_OS}=${TEST_CONFIG.TEST_OS}`)).toBe(true);
        expect(returnVal.includes(`${AADServerParamKeys.X_CLIENT_CPU}=${TEST_CONFIG.TEST_CPU}`)).toBe(true);
        expect(returnVal.includes(`${AADServerParamKeys.X_APP_NAME}=${TEST_CONFIG.applicationName}`)).toBe(true);
        expect(returnVal.includes(`${AADServerParamKeys.X_APP_VER}=${TEST_CONFIG.applicationVersion}`)).toBe(true);
        expect(returnVal.includes(`${AADServerParamKeys.X_MS_LIB_CAPABILITY}=${ThrottlingConstants.X_MS_LIB_CAPABILITY_VALUE}`)).toBe(true);
    });

    // regression test for https://github.com/AzureAD/microsoft-authentication-library-for-js/issues/5134
    it("Multiple access tokens would match, but one of them has a Home Account ID of \"\"", async () => {
        sinon.stub(Authority.prototype, <any>"getEndpointMetadataFromNetwork").resolves(DEFAULT_OPENID_CONFIG_RESPONSE.body);
        sinon.stub(ClientCredentialClient.prototype, <any>"executePostToTokenEndpoint").resolves(CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT);
        
        const authenticationScopes = AUTHENTICATION_RESULT_DEFAULT_SCOPES;
        authenticationScopes.body.scope = "https://graph.microsoft.com/.default";
        sinon.stub(UsernamePasswordClient.prototype, <any>"executePostToTokenEndpoint").resolves(authenticationScopes);

        const idTokenClaims = {
            ...ID_TOKEN_CLAIMS,
            tid: "common",
        };
        sinon.stub(AuthToken, "extractTokenClaims").returns(idTokenClaims);

        const config = await ClientTestUtils.createTestClientConfiguration();

        const client = new ClientCredentialClient(config);
        const clientCredentialRequest: CommonClientCredentialRequest = {
            authority: "https://login.microsoftonline.com/common",
            correlationId: TEST_CONFIG.CORRELATION_ID,
            scopes: ["https://graph.microsoft.com/.default"],
        };

        const client2 = new UsernamePasswordClient(config);
        const usernamePasswordRequest: CommonUsernamePasswordRequest = {
            authority: "https://login.microsoftonline.com/common",
            correlationId: TEST_CONFIG.CORRELATION_ID,
            scopes: ["https://graph.microsoft.com/.default"],
            username: "mock_name",
            password: "mock_password",
        };

        const authResult = await client.acquireToken(clientCredentialRequest) as AuthenticationResult;
        expect(authResult.fromCache).toBe(false);
        const authResult2 = await client2.acquireToken(usernamePasswordRequest) as AuthenticationResult;
        expect(authResult2.fromCache).toBe(false);
        await expect(client.acquireToken(clientCredentialRequest)).resolves.not.toThrow(ClientAuthError.createMultipleMatchingTokensInCacheError());
    });

    it("acquires a token from dSTS authority", async () => {
        sinon.stub(Authority.prototype, <any>"getEndpointMetadataFromNetwork").resolves(DSTS_OPENID_CONFIG_RESPONSE.body);
        sinon.stub(ClientCredentialClient.prototype, <any>"executePostToTokenEndpoint").resolves(DSTS_CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT);

        const createTokenRequestBodySpy = sinon.spy(ClientCredentialClient.prototype, <any>"createTokenRequestBody");

        const config = await ClientTestUtils.createTestClientConfiguration();
        const client = new ClientCredentialClient(config);
        const clientCredentialRequest: CommonClientCredentialRequest = {
            authority: TEST_CONFIG.DSTS_VALID_AUTHORITY,
            correlationId: TEST_CONFIG.CORRELATION_ID,
            scopes: TEST_CONFIG.DSTS_TEST_SCOPE,
        };

        const authResult = await client.acquireToken(clientCredentialRequest) as AuthenticationResult;
        const expectedScopes = [TEST_CONFIG.DSTS_TEST_SCOPE[0]];
        expect(authResult.scopes).toEqual(expectedScopes);
        expect(authResult.accessToken).toEqual(DSTS_CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT.body.access_token);
        expect(authResult.state).toHaveLength(0);

        expect(createTokenRequestBodySpy.calledWith(clientCredentialRequest)).toBe(true);

        const returnVal = await createTokenRequestBodySpy.returnValues[0] as string;
        expect(returnVal.includes(encodeURIComponent(TEST_CONFIG.DSTS_TEST_SCOPE[0]))).toBe(true);
        expect(returnVal.includes(`${AADServerParamKeys.CLIENT_ID}=${TEST_CONFIG.MSAL_CLIENT_ID}`)).toBe(true);
        expect(returnVal.includes(`${AADServerParamKeys.GRANT_TYPE}=${GrantType.CLIENT_CREDENTIALS_GRANT}`)).toBe(true);
        expect(returnVal.includes(`${AADServerParamKeys.CLIENT_SECRET}=${TEST_CONFIG.MSAL_CLIENT_SECRET}`)).toBe(true);
        expect(returnVal.includes(`${AADServerParamKeys.X_CLIENT_SKU}=${Constants.SKU}`)).toBe(true);
        expect(returnVal.includes(`${AADServerParamKeys.X_CLIENT_VER}=${TEST_CONFIG.TEST_VERSION}`)).toBe(true);
        expect(returnVal.includes(`${AADServerParamKeys.X_CLIENT_OS}=${TEST_CONFIG.TEST_OS}`)).toBe(true);
        expect(returnVal.includes(`${AADServerParamKeys.X_CLIENT_CPU}=${TEST_CONFIG.TEST_CPU}`)).toBe(true);
        expect(returnVal.includes(`${AADServerParamKeys.X_APP_NAME}=${TEST_CONFIG.applicationName}`)).toBe(true);
        expect(returnVal.includes(`${AADServerParamKeys.X_APP_VER}=${TEST_CONFIG.applicationVersion}`)).toBe(true);
        expect(returnVal.includes(`${AADServerParamKeys.X_MS_LIB_CAPABILITY}=${ThrottlingConstants.X_MS_LIB_CAPABILITY_VALUE}`)).toBe(true);
    });

    it("acquires a token from cache when using dSTS authority", async () => {
        sinon.stub(Authority.prototype, <any>"getEndpointMetadataFromNetwork").resolves(DSTS_OPENID_CONFIG_RESPONSE.body);
        sinon.stub(ClientCredentialClient.prototype, <any>"executePostToTokenEndpoint").resolves(DSTS_CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT);

        const config = await ClientTestUtils.createTestClientConfiguration();
        const client = new ClientCredentialClient(config);
        const clientCredentialRequest: CommonClientCredentialRequest = {
            authority: TEST_CONFIG.DSTS_VALID_AUTHORITY,
            correlationId: TEST_CONFIG.CORRELATION_ID,
            scopes: TEST_CONFIG.DSTS_TEST_SCOPE,
        };

        // First call should return from "network" (mocked)
        const networkAuthResult = await client.acquireToken(clientCredentialRequest) as AuthenticationResult;
        expect(networkAuthResult.fromCache).toBe(false);
        // Second call should return from cache
        const cachedAuthResult = await client.acquireToken(clientCredentialRequest) as AuthenticationResult;
        expect(cachedAuthResult.fromCache).toBe(true);
        expect(cachedAuthResult.accessToken).toBe(networkAuthResult.accessToken);
        expect(cachedAuthResult.expiresOn).toStrictEqual(networkAuthResult.expiresOn);
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

        const authResult = await client.acquireToken(clientCredentialRequest) as AuthenticationResult;
        const expectedScopes = [TEST_CONFIG.DEFAULT_GRAPH_SCOPE[0]];
        expect(authResult.scopes).toEqual(expectedScopes);
        expect(authResult.accessToken).toEqual(CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT.body.access_token);
        expect(authResult.state).toBe("");

        expect(createTokenRequestBodySpy.calledWith(clientCredentialRequest)).toBe(true);

        expect(createTokenRequestBodySpy.returnValues[0].includes(`${TEST_CONFIG.DEFAULT_GRAPH_SCOPE[0]}`)).toBe(true);
        expect(createTokenRequestBodySpy.returnValues[0].includes(`${AADServerParamKeys.CLIENT_ID}=${TEST_CONFIG.MSAL_CLIENT_ID}`)).toBe(true);
        expect(createTokenRequestBodySpy.returnValues[0].includes(`${AADServerParamKeys.GRANT_TYPE}=${GrantType.CLIENT_CREDENTIALS_GRANT}`)).toBe(true);
        expect(createTokenRequestBodySpy.returnValues[0].includes(`${AADServerParamKeys.CLIENT_SECRET}=${TEST_CONFIG.MSAL_CLIENT_SECRET}`)).toBe(true);
        expect(createTokenRequestBodySpy.returnValues[0].includes(`${AADServerParamKeys.X_CLIENT_SKU}=${Constants.SKU}`)).toBe(true);
        expect(createTokenRequestBodySpy.returnValues[0].includes(`${AADServerParamKeys.X_CLIENT_VER}=${TEST_CONFIG.TEST_VERSION}`)).toBe(true);
        expect(createTokenRequestBodySpy.returnValues[0].includes(`${AADServerParamKeys.X_CLIENT_OS}=${TEST_CONFIG.TEST_OS}`)).toBe(true);
        expect(createTokenRequestBodySpy.returnValues[0].includes(`${AADServerParamKeys.X_CLIENT_CPU}=${TEST_CONFIG.TEST_CPU}`)).toBe(true);
        expect(createTokenRequestBodySpy.returnValues[0].includes(`${AADServerParamKeys.X_APP_NAME}=${TEST_CONFIG.applicationName}`)).toBe(true);
        expect(createTokenRequestBodySpy.returnValues[0].includes(`${AADServerParamKeys.X_APP_VER}=${TEST_CONFIG.applicationVersion}`)).toBe(true);
        expect(createTokenRequestBodySpy.returnValues[0].includes(`${AADServerParamKeys.X_MS_LIB_CAPABILITY}=${ThrottlingConstants.X_MS_LIB_CAPABILITY_VALUE}`)).toBe(true);
        expect(createTokenRequestBodySpy.returnValues[0].includes(`${AADServerParamKeys.CLAIMS}=${encodeURIComponent(TEST_CONFIG.CLAIMS)}`)).toBe(true);
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

        const authResult = await client.acquireToken(clientCredentialRequest) as AuthenticationResult;
        const expectedScopes = [TEST_CONFIG.DEFAULT_GRAPH_SCOPE[0]];
        expect(authResult.scopes).toEqual(expectedScopes);
        expect(authResult.accessToken).toEqual(CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT.body.access_token);
        expect(authResult.state).toBe("");

        expect(createTokenRequestBodySpy.calledWith(clientCredentialRequest)).toBe(true);

        expect(createTokenRequestBodySpy.returnValues[0].includes(`${TEST_CONFIG.DEFAULT_GRAPH_SCOPE[0]}`)).toBe(true);
        expect(createTokenRequestBodySpy.returnValues[0].includes(`${AADServerParamKeys.CLIENT_ID}=${TEST_CONFIG.MSAL_CLIENT_ID}`)).toBe(true);
        expect(createTokenRequestBodySpy.returnValues[0].includes(`${AADServerParamKeys.GRANT_TYPE}=${GrantType.CLIENT_CREDENTIALS_GRANT}`)).toBe(true);
        expect(createTokenRequestBodySpy.returnValues[0].includes(`${AADServerParamKeys.CLIENT_SECRET}=${TEST_CONFIG.MSAL_CLIENT_SECRET}`)).toBe(true);
        expect(createTokenRequestBodySpy.returnValues[0].includes(`${AADServerParamKeys.X_CLIENT_SKU}=${Constants.SKU}`)).toBe(true);
        expect(createTokenRequestBodySpy.returnValues[0].includes(`${AADServerParamKeys.X_CLIENT_VER}=${TEST_CONFIG.TEST_VERSION}`)).toBe(true);
        expect(createTokenRequestBodySpy.returnValues[0].includes(`${AADServerParamKeys.X_CLIENT_OS}=${TEST_CONFIG.TEST_OS}`)).toBe(true);
        expect(createTokenRequestBodySpy.returnValues[0].includes(`${AADServerParamKeys.X_CLIENT_CPU}=${TEST_CONFIG.TEST_CPU}`)).toBe(true);
        expect(createTokenRequestBodySpy.returnValues[0].includes(`${AADServerParamKeys.X_APP_NAME}=${TEST_CONFIG.applicationName}`)).toBe(true);
        expect(createTokenRequestBodySpy.returnValues[0].includes(`${AADServerParamKeys.X_APP_VER}=${TEST_CONFIG.applicationVersion}`)).toBe(true);
        expect(createTokenRequestBodySpy.returnValues[0].includes(`${AADServerParamKeys.X_MS_LIB_CAPABILITY}=${ThrottlingConstants.X_MS_LIB_CAPABILITY_VALUE}`)).toBe(true);
        expect(createTokenRequestBodySpy.returnValues[0].includes(`${AADServerParamKeys.CLAIMS}=${encodeURIComponent(TEST_CONFIG.CLAIMS)}`)).toBe(false);
    });

    it("Uses clientAssertion from ClientConfiguration when no client assertion is added to request", async () => {
        sinon.stub(Authority.prototype, <any>"getEndpointMetadataFromNetwork").resolves(DEFAULT_OPENID_CONFIG_RESPONSE.body);
        sinon.stub(ClientCredentialClient.prototype, <any>"executePostToTokenEndpoint").resolves(CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT);

        const createTokenRequestBodySpy = sinon.spy(ClientCredentialClient.prototype, <any>"createTokenRequestBody");

        const config = await ClientTestUtils.createTestClientConfiguration();
        config.clientCredentials = {
            ...config.clientCredentials,
            clientAssertion: {
                assertion: TEST_CONFIG.TEST_CONFIG_ASSERTION,
                assertionType: TEST_CONFIG.TEST_ASSERTION_TYPE
            }
        }
        const client = new ClientCredentialClient(config);
        const clientCredentialRequest: CommonClientCredentialRequest = {
            authority: TEST_CONFIG.validAuthority,
            correlationId: TEST_CONFIG.CORRELATION_ID,
            scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
            claims: "{}"
        };

        const authResult = await client.acquireToken(clientCredentialRequest) as AuthenticationResult;
        const expectedScopes = [TEST_CONFIG.DEFAULT_GRAPH_SCOPE[0]];
        expect(authResult.scopes).toEqual(expectedScopes);
        expect(authResult.accessToken).toEqual(CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT.body.access_token);
        expect(authResult.state).toBe("");

        expect(createTokenRequestBodySpy.calledWith(clientCredentialRequest)).toBe(true);

        expect(createTokenRequestBodySpy.returnValues[0].includes(`${TEST_CONFIG.DEFAULT_GRAPH_SCOPE[0]}`)).toBe(true);
        expect(createTokenRequestBodySpy.returnValues[0].includes(`${AADServerParamKeys.CLIENT_ID}=${TEST_CONFIG.MSAL_CLIENT_ID}`)).toBe(true);
        expect(createTokenRequestBodySpy.returnValues[0].includes(`${AADServerParamKeys.GRANT_TYPE}=${GrantType.CLIENT_CREDENTIALS_GRANT}`)).toBe(true);
        expect(createTokenRequestBodySpy.returnValues[0].includes(`${AADServerParamKeys.CLIENT_SECRET}=${TEST_CONFIG.MSAL_CLIENT_SECRET}`)).toBe(true);
        expect(createTokenRequestBodySpy.returnValues[0].includes(`${AADServerParamKeys.X_CLIENT_SKU}=${Constants.SKU}`)).toBe(true);
        expect(createTokenRequestBodySpy.returnValues[0].includes(`${AADServerParamKeys.X_CLIENT_VER}=${TEST_CONFIG.TEST_VERSION}`)).toBe(true);
        expect(createTokenRequestBodySpy.returnValues[0].includes(`${AADServerParamKeys.X_CLIENT_OS}=${TEST_CONFIG.TEST_OS}`)).toBe(true);
        expect(createTokenRequestBodySpy.returnValues[0].includes(`${AADServerParamKeys.X_CLIENT_CPU}=${TEST_CONFIG.TEST_CPU}`)).toBe(true);
        expect(createTokenRequestBodySpy.returnValues[0].includes(`${AADServerParamKeys.X_APP_NAME}=${TEST_CONFIG.applicationName}`)).toBe(true);
        expect(createTokenRequestBodySpy.returnValues[0].includes(`${AADServerParamKeys.X_APP_VER}=${TEST_CONFIG.applicationVersion}`)).toBe(true);
        expect(createTokenRequestBodySpy.returnValues[0].includes(`${AADServerParamKeys.X_MS_LIB_CAPABILITY}=${ThrottlingConstants.X_MS_LIB_CAPABILITY_VALUE}`)).toBe(true);
        expect(createTokenRequestBodySpy.returnValues[0].includes(`${AADServerParamKeys.CLAIMS}=${encodeURIComponent(TEST_CONFIG.CLAIMS)}`)).toBe(false);
        expect(createTokenRequestBodySpy.returnValues[0].includes(`${AADServerParamKeys.CLIENT_ASSERTION}=${encodeURIComponent(TEST_CONFIG.TEST_CONFIG_ASSERTION)}`)).toBe(true)
        expect(createTokenRequestBodySpy.returnValues[0].includes(`${AADServerParamKeys.CLIENT_ASSERTION_TYPE}=${encodeURIComponent(TEST_CONFIG.TEST_ASSERTION_TYPE)}`)).toBe(true)
    });

    it("Uses the clientAssertion included in the request instead of the one in ClientConfiguration", async () => {
        sinon.stub(Authority.prototype, <any>"getEndpointMetadataFromNetwork").resolves(DEFAULT_OPENID_CONFIG_RESPONSE.body);
        sinon.stub(ClientCredentialClient.prototype, <any>"executePostToTokenEndpoint").resolves(CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT);

        const createTokenRequestBodySpy = sinon.spy(ClientCredentialClient.prototype, <any>"createTokenRequestBody");

        const config = await ClientTestUtils.createTestClientConfiguration();
        config.clientCredentials = {
            ...config.clientCredentials,
            clientAssertion: {
                assertion: TEST_CONFIG.TEST_CONFIG_ASSERTION,
                assertionType: TEST_CONFIG.TEST_ASSERTION_TYPE
            }
        }
        const client = new ClientCredentialClient(config);
        const clientCredentialRequest: CommonClientCredentialRequest = {
            authority: TEST_CONFIG.validAuthority,
            correlationId: TEST_CONFIG.CORRELATION_ID,
            scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
            claims: "{}",
            clientAssertion: {
                assertion: TEST_CONFIG.TEST_REQUEST_ASSERTION,
                assertionType: TEST_CONFIG.TEST_ASSERTION_TYPE
            }
        };

        const authResult = await client.acquireToken(clientCredentialRequest) as AuthenticationResult;
        const expectedScopes = [TEST_CONFIG.DEFAULT_GRAPH_SCOPE[0]];
        expect(authResult.scopes).toEqual(expectedScopes);
        expect(authResult.accessToken).toEqual(CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT.body.access_token);
        expect(authResult.state).toBe("");

        expect(createTokenRequestBodySpy.calledWith(clientCredentialRequest)).toBe(true);

        expect(createTokenRequestBodySpy.returnValues[0].includes(`${TEST_CONFIG.DEFAULT_GRAPH_SCOPE[0]}`)).toBe(true);
        expect(createTokenRequestBodySpy.returnValues[0].includes(`${AADServerParamKeys.CLIENT_ID}=${TEST_CONFIG.MSAL_CLIENT_ID}`)).toBe(true);
        expect(createTokenRequestBodySpy.returnValues[0].includes(`${AADServerParamKeys.GRANT_TYPE}=${GrantType.CLIENT_CREDENTIALS_GRANT}`)).toBe(true);
        expect(createTokenRequestBodySpy.returnValues[0].includes(`${AADServerParamKeys.CLIENT_SECRET}=${TEST_CONFIG.MSAL_CLIENT_SECRET}`)).toBe(true);
        expect(createTokenRequestBodySpy.returnValues[0].includes(`${AADServerParamKeys.X_CLIENT_SKU}=${Constants.SKU}`)).toBe(true);
        expect(createTokenRequestBodySpy.returnValues[0].includes(`${AADServerParamKeys.X_CLIENT_VER}=${TEST_CONFIG.TEST_VERSION}`)).toBe(true);
        expect(createTokenRequestBodySpy.returnValues[0].includes(`${AADServerParamKeys.X_CLIENT_OS}=${TEST_CONFIG.TEST_OS}`)).toBe(true);
        expect(createTokenRequestBodySpy.returnValues[0].includes(`${AADServerParamKeys.X_CLIENT_CPU}=${TEST_CONFIG.TEST_CPU}`)).toBe(true);
        expect(createTokenRequestBodySpy.returnValues[0].includes(`${AADServerParamKeys.X_APP_NAME}=${TEST_CONFIG.applicationName}`)).toBe(true);
        expect(createTokenRequestBodySpy.returnValues[0].includes(`${AADServerParamKeys.X_APP_VER}=${TEST_CONFIG.applicationVersion}`)).toBe(true);
        expect(createTokenRequestBodySpy.returnValues[0].includes(`${AADServerParamKeys.X_MS_LIB_CAPABILITY}=${ThrottlingConstants.X_MS_LIB_CAPABILITY_VALUE}`)).toBe(true);
        expect(createTokenRequestBodySpy.returnValues[0].includes(`${AADServerParamKeys.CLAIMS}=${encodeURIComponent(TEST_CONFIG.CLAIMS)}`)).toBe(false);
        expect(createTokenRequestBodySpy.returnValues[0].includes(`${AADServerParamKeys.CLIENT_ASSERTION}=${encodeURIComponent(TEST_CONFIG.TEST_CONFIG_ASSERTION)}`)).toBe(false)
        expect(createTokenRequestBodySpy.returnValues[0].includes(`${AADServerParamKeys.CLIENT_ASSERTION}=${encodeURIComponent(TEST_CONFIG.TEST_REQUEST_ASSERTION)}`)).toBe(true)
        expect(createTokenRequestBodySpy.returnValues[0].includes(`${AADServerParamKeys.CLIENT_ASSERTION_TYPE}=${encodeURIComponent(TEST_CONFIG.TEST_ASSERTION_TYPE)}`)).toBe(true)
    });

    it("Does not add headers that do not qualify for a simple request", async () => {
        // For more information about this test see: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
        let stubCalled = false;
        sinon.stub(Authority.prototype, <any>"getEndpointMetadataFromNetwork").resolves(DEFAULT_OPENID_CONFIG_RESPONSE.body);
        sinon.stub(ClientCredentialClient.prototype, <any>"executePostToTokenEndpoint").callsFake((tokenEndpoint: string, queryString: string, headers: Record<string, string>) => {
            const headerNames = Object.keys(headers);
            headerNames.forEach((name) => {
                expect(CORS_SIMPLE_REQUEST_HEADERS).toEqual(expect.arrayContaining([name.toLowerCase()]));
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
        expect(stubCalled).toBe(true);
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

        const authResult = await client.acquireToken(clientCredentialRequest) as AuthenticationResult;
        const expectedScopes = [TEST_CONFIG.DEFAULT_GRAPH_SCOPE[0]];
        expect(authResult.scopes).toEqual(expectedScopes);
        expect(authResult.accessToken).toEqual("an_access_token");
        expect(authResult.account).toBeNull();
        expect(authResult.fromCache).toBe(true);
        expect(authResult.uniqueId).toHaveLength(0);
        expect(authResult.state).toHaveLength(0);
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

        const authResult = await client.acquireToken(clientCredentialRequest) as AuthenticationResult;
        const expectedScopes = [TEST_CONFIG.DEFAULT_GRAPH_SCOPE[0]];
        expect(authResult.scopes).toEqual(expectedScopes);
        expect(authResult.accessToken).toEqual(CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT.body.access_token);
        expect(authResult.state).toHaveLength(0);

        expect(createTokenRequestBodySpy.calledWith(clientCredentialRequest)).toBe(true);

        const returnVal = await createTokenRequestBodySpy.returnValues[0] as string;
        expect(returnVal.includes(`${TEST_CONFIG.DEFAULT_GRAPH_SCOPE[0]}`)).toBe(true);
        expect(returnVal.includes(`${AADServerParamKeys.CLIENT_ID}=${TEST_CONFIG.MSAL_CLIENT_ID}`)).toBe(true);
        expect(returnVal.includes(`${AADServerParamKeys.GRANT_TYPE}=${GrantType.CLIENT_CREDENTIALS_GRANT}`)).toBe(true);
        expect(returnVal.includes(`${AADServerParamKeys.CLIENT_SECRET}=${TEST_CONFIG.MSAL_CLIENT_SECRET}`)).toBe(true);
    });

    it("Multiple access tokens matched, exception thrown", async () => {
        sinon.stub(Authority.prototype, <any>"getEndpointMetadataFromNetwork").resolves(DEFAULT_OPENID_CONFIG_RESPONSE.body);
        const config = await ClientTestUtils.createTestClientConfiguration();
        
        // mock access token
        const mockedAtEntity: AccessTokenEntity = AccessTokenEntity.createAccessTokenEntity(
            "", "login.microsoftonline.com", "an_access_token", config.authOptions.clientId, TEST_CONFIG.TENANT, TEST_CONFIG.DEFAULT_GRAPH_SCOPE.toString(), 4600, 4600, mockCrypto, undefined, AuthenticationScheme.BEARER, TEST_TOKENS.ACCESS_TOKEN);
            
        const mockedAtEntity2: AccessTokenEntity = AccessTokenEntity.createAccessTokenEntity(
            "", "login.microsoftonline.com", "an_access_token", config.authOptions.clientId, TEST_CONFIG.TENANT, TEST_CONFIG.DEFAULT_GRAPH_SCOPE.toString(), 4600, 4600, mockCrypto, undefined, AuthenticationScheme.BEARER, TEST_TOKENS.ACCESS_TOKEN);
            
        const mockedCredentialCache: CredentialCache = {
            accessTokens: { 
                "key1": mockedAtEntity,
                "key2": mockedAtEntity2
            },
            // @ts-ignore
            refreshTokens: null,
            // @ts-ignore
            idTokens: null
        }

        sinon.stub(CacheManager.prototype, <any>"getCredentialsFilteredBy").returns(mockedCredentialCache);

        const client = new ClientCredentialClient(config);
        const clientCredentialRequest: CommonClientCredentialRequest = {
            authority: TEST_CONFIG.validAuthority,
            correlationId: TEST_CONFIG.CORRELATION_ID,
            scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
        };

        await expect(client.acquireToken(clientCredentialRequest)).rejects.toMatchObject(ClientAuthError.createMultipleMatchingTokensInCacheError());
    });

    it("Uses the extensibility AppTokenProvider callback to get a token", async () => {
        sinon.stub(Authority.prototype, <any>"getEndpointMetadataFromNetwork").resolves(DEFAULT_OPENID_CONFIG_RESPONSE.body);
        // no need to stub out the token response, MSAL will use the AppTokenProvider instead

        const config = await ClientTestUtils.createTestClientConfiguration();
        const accessToken = "some_token";
        const appTokenProviderResult: AppTokenProviderResult = {
            accessToken: accessToken,
            expiresInSeconds: 1800,
            refreshInSeconds: 900,
        }

        const expectedScopes = [TEST_CONFIG.DEFAULT_GRAPH_SCOPE[0]];

        let callbackedCalledCount = 0;

        const appTokenProvider: IAppTokenProvider =  (appTokenProviderParameters) => {
            
            callbackedCalledCount++;

            expect(appTokenProviderParameters.scopes).toEqual(expectedScopes);
            expect(appTokenProviderParameters.tenantId).toEqual("common");
            expect(appTokenProviderParameters.correlationId).toEqual(TEST_CONFIG.CORRELATION_ID);
            expect(appTokenProviderParameters.claims).toBeUndefined();
                
            return new Promise<AppTokenProviderResult>(
                (resolve) => resolve(appTokenProviderResult));                        
        };
    
        // client credentials not needed
        config.clientCredentials = undefined;    

        const client = new ClientCredentialClient(config, appTokenProvider);
        const clientCredentialRequest: CommonClientCredentialRequest = {
            authority: TEST_CONFIG.validAuthority,
            correlationId: TEST_CONFIG.CORRELATION_ID,
            scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
        };

        const authResult = await client.acquireToken(clientCredentialRequest) as AuthenticationResult;

        expect(callbackedCalledCount).toEqual(1);

        expect(authResult.scopes).toEqual(expectedScopes);
        expect(authResult.accessToken).toEqual(accessToken);
        expect(authResult.state).toHaveLength(0);
        const dateDiff = (authResult.expiresOn!.valueOf() - Date.now().valueOf()) / 1000;
        expect(dateDiff).toBeLessThanOrEqual(1900);
        expect(dateDiff).toBeGreaterThan(1700);

        const authResult2 = await client.acquireToken(clientCredentialRequest) as AuthenticationResult;

        // expect the callback to not be called again, because token comes from the cache
        expect(callbackedCalledCount).toEqual(1);

        expect(authResult2.scopes).toEqual(expectedScopes);
        expect(authResult2.accessToken).toEqual(accessToken);
    });
});
