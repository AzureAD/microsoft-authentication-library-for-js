import sinon from "sinon";
import {
    AccessTokenEntity,
    AppTokenProviderResult,
    AuthenticationResult,
    AuthenticationScheme,
    Authority,
    BaseClient,
    CacheManager,
    ClientConfiguration,
    CommonClientCredentialRequest,
    CommonUsernamePasswordRequest,
    IAppTokenProvider,
    InteractionRequiredAuthError,
    TimeUtils,
    createClientAuthError,
    ClientAuthErrorCodes,
} from "@azure/msal-common";
import { ClientCredentialClient, UsernamePasswordClient } from "../../src";
import {
    AUTHENTICATION_RESULT_DEFAULT_SCOPES,
    CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT,
    CORS_SIMPLE_REQUEST_HEADERS,
    DEFAULT_OPENID_CONFIG_RESPONSE,
    DSTS_CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT,
    DSTS_OPENID_CONFIG_RESPONSE,
    TEST_CONFIG,
    TEST_TOKENS,
} from "../test_kit/StringConstants";
import {
    checkMockedNetworkRequest,
    ClientTestUtils,
    mockCrypto,
} from "./ClientTestUtils";

describe("ClientCredentialClient unit tests", () => {
    let config: ClientConfiguration;

    beforeEach(async () => {
        config = await ClientTestUtils.createTestClientConfiguration();
    });

    afterEach(() => {
        sinon.restore();
    });

    describe("Constructor", () => {
        it("creates a ClientCredentialClient", async () => {
            sinon
                .stub(
                    Authority.prototype,
                    <any>"getEndpointMetadataFromNetwork"
                )
                .resolves(DEFAULT_OPENID_CONFIG_RESPONSE.body);
            const client = new ClientCredentialClient(config);
            expect(client).not.toBeNull();
            expect(client instanceof ClientCredentialClient).toBe(true);
            expect(client instanceof BaseClient).toBe(true);
        });
    });

    it("acquires a token", async () => {
        sinon
            .stub(Authority.prototype, <any>"getEndpointMetadataFromNetwork")
            .resolves(DEFAULT_OPENID_CONFIG_RESPONSE.body);
        sinon
            .stub(
                ClientCredentialClient.prototype,
                <any>"executePostToTokenEndpoint"
            )
            .resolves(CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT);

        const createTokenRequestBodySpy = sinon.spy(
            ClientCredentialClient.prototype,
            <any>"createTokenRequestBody"
        );

        const client = new ClientCredentialClient(config);
        const clientCredentialRequest: CommonClientCredentialRequest = {
            authority: TEST_CONFIG.validAuthority,
            correlationId: TEST_CONFIG.CORRELATION_ID,
            scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
        };

        const authResult = (await client.acquireToken(
            clientCredentialRequest
        )) as AuthenticationResult;
        const expectedScopes = [TEST_CONFIG.DEFAULT_GRAPH_SCOPE[0]];
        expect(authResult.scopes).toEqual(expectedScopes);
        expect(authResult.accessToken).toEqual(
            CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT.body.access_token
        );
        expect(authResult.state).toHaveLength(0);

        expect(
            createTokenRequestBodySpy.calledWith(clientCredentialRequest)
        ).toBe(true);

        const returnVal = (await createTokenRequestBodySpy
            .returnValues[0]) as string;
        const checks = {
            graphScope: true,
            clientId: true,
            grantType: true,
            clientSecret: true,
            clientSku: true,
            clientVersion: true,
            clientOs: true,
            clientCpu: true,
            appName: true,
            appVersion: true,
            msLibraryCapability: true,
        };
        checkMockedNetworkRequest(returnVal, checks);
    });

    it("Adds tokenQueryParameters to the /token request", (done) => {
        sinon
            .stub(
                ClientCredentialClient.prototype,
                <any>"executePostToTokenEndpoint"
            )
            .callsFake((url: string) => {
                try {
                    expect(
                        url.includes(
                            "/token?testParam1=testValue1&testParam3=testValue3"
                        )
                    ).toBeTruthy();
                    expect(!url.includes("/token?testParam2=")).toBeTruthy();
                    done();
                } catch (error) {
                    done(error);
                }
            });

        const clientCredentialRequest: CommonClientCredentialRequest = {
            authority: TEST_CONFIG.validAuthority,
            correlationId: TEST_CONFIG.CORRELATION_ID,
            scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
            tokenQueryParameters: {
                testParam1: "testValue1",
                testParam2: "",
                testParam3: "testValue3",
            },
        };

        const client = new ClientCredentialClient(config);
        client.acquireToken(clientCredentialRequest).catch(() => {
            // Catch errors thrown after the function call this test is testing
        });
    });

    it("acquireToken's interactionRequiredAuthError error contains claims", async () => {
        const errorResponse = {
            error: "interaction_required",
            error_description:
                "AADSTS50079: Due to a configuration change made by your administrator, or because you moved to a new location, you must enroll in multifactor authentication to access 'bf8d80f9-9098-4972-b203-500f535113b1'.\r\nTrace ID: b72a68c3-0926-4b8e-bc35-3150069c2800\r\nCorrelation ID: 73d656cf-54b1-4eb2-b429-26d8165a52d7\r\nTimestamp: 2017-05-01 22:43:20Z",
            error_codes: [50079],
            timestamp: "2017-05-01 22:43:20Z",
            trace_id: "b72a68c3-0926-4b8e-bc35-3150069c2800",
            correlation_id: "73d656cf-54b1-4eb2-b429-26d8165a52d7",
            claims: '{"access_token":{"polids":{"essential":true,"values":["9ab03e19-ed42-4168-b6b7-7001fb3e933a"]}}}',
        };

        sinon
            .stub(Authority.prototype, <any>"getEndpointMetadataFromNetwork")
            .resolves(DEFAULT_OPENID_CONFIG_RESPONSE.body);
        sinon
            .stub(
                ClientCredentialClient.prototype,
                <any>"executePostToTokenEndpoint"
            )
            .resolves({
                headers: [],
                body: errorResponse,
                status: 400,
            });

        const config = await ClientTestUtils.createTestClientConfiguration();
        const client = new ClientCredentialClient(config);
        const clientCredentialRequest: CommonClientCredentialRequest = {
            authority: TEST_CONFIG.validAuthority,
            correlationId: TEST_CONFIG.CORRELATION_ID,
            scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
        };

        const interactionRequiredAuthError = new InteractionRequiredAuthError(
            "interaction_required",
            "AADSTS50079: Due to a configuration change made by your administrator, or because you moved to a new location, you must enroll in multifactor authentication to access 'bf8d80f9-9098-4972-b203-500f535113b1'.\r\nTrace ID: b72a68c3-0926-4b8e-bc35-3150069c2800\r\nCorrelation ID: 73d656cf-54b1-4eb2-b429-26d8165a52d7\r\nTimestamp: 2017-05-01 22:43:20Z",
            "",
            "2017-05-01 22:43:20Z",
            "b72a68c3-0926-4b8e-bc35-3150069c2800",
            "73d656cf-54b1-4eb2-b429-26d8165a52d7",
            '{"access_token":{"polids":{"essential":true,"values":["9ab03e19-ed42-4168-b6b7-7001fb3e933a"]}}}'
        );
        await expect(
            client.acquireToken(clientCredentialRequest)
        ).rejects.toEqual(interactionRequiredAuthError);
    });

    // regression test for https://github.com/AzureAD/microsoft-authentication-library-for-js/issues/5134
    it('Multiple access tokens would match, but one of them has a Home Account ID of ""', async () => {
        sinon
            .stub(Authority.prototype, <any>"getEndpointMetadataFromNetwork")
            .resolves(DEFAULT_OPENID_CONFIG_RESPONSE.body);
        sinon
            .stub(
                ClientCredentialClient.prototype,
                <any>"executePostToTokenEndpoint"
            )
            .resolves(CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT);

        const authenticationScopes = AUTHENTICATION_RESULT_DEFAULT_SCOPES;
        authenticationScopes.body.scope =
            "https://graph.microsoft.com/.default";
        sinon
            .stub(
                UsernamePasswordClient.prototype,
                <any>"executePostToTokenEndpoint"
            )
            .resolves(authenticationScopes);

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

        const authResult = (await client.acquireToken(
            clientCredentialRequest
        )) as AuthenticationResult;
        expect(authResult.fromCache).toBe(false);
        const authResult2 = (await client2.acquireToken(
            usernamePasswordRequest
        )) as AuthenticationResult;
        expect(authResult2.fromCache).toBe(false);
        await expect(
            client.acquireToken(clientCredentialRequest)
        ).resolves.not.toThrow(
            createClientAuthError(ClientAuthErrorCodes.multipleMatchingTokens)
        );
    });

    it("acquires a token from dSTS authority", async () => {
        sinon
            .stub(Authority.prototype, <any>"getEndpointMetadataFromNetwork")
            .resolves(DSTS_OPENID_CONFIG_RESPONSE.body);
        sinon
            .stub(
                ClientCredentialClient.prototype,
                <any>"executePostToTokenEndpoint"
            )
            .resolves(DSTS_CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT);

        const createTokenRequestBodySpy = sinon.spy(
            ClientCredentialClient.prototype,
            <any>"createTokenRequestBody"
        );

        const client = new ClientCredentialClient(config);
        const clientCredentialRequest: CommonClientCredentialRequest = {
            authority: TEST_CONFIG.DSTS_VALID_AUTHORITY,
            correlationId: TEST_CONFIG.CORRELATION_ID,
            scopes: TEST_CONFIG.DSTS_TEST_SCOPE,
        };

        const authResult = (await client.acquireToken(
            clientCredentialRequest
        )) as AuthenticationResult;
        const expectedScopes = [TEST_CONFIG.DSTS_TEST_SCOPE[0]];
        expect(authResult.scopes).toEqual(expectedScopes);
        expect(authResult.accessToken).toEqual(
            DSTS_CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT.body.access_token
        );
        expect(authResult.state).toHaveLength(0);

        expect(
            createTokenRequestBodySpy.calledWith(clientCredentialRequest)
        ).toBe(true);

        const returnVal = (await createTokenRequestBodySpy
            .returnValues[0]) as string;
        const checks = {
            dstsScope: true,
            clientId: true,
            grantType: true,
            clientSecret: true,
            clientSku: true,
            clientVersion: true,
            clientOs: true,
            clientCpu: true,
            appName: true,
            appVersion: true,
            msLibraryCapability: true,
        };
        checkMockedNetworkRequest(returnVal, checks);
    });

    it("acquires a token from cache when using dSTS authority", async () => {
        sinon
            .stub(Authority.prototype, <any>"getEndpointMetadataFromNetwork")
            .resolves(DSTS_OPENID_CONFIG_RESPONSE.body);
        sinon
            .stub(
                ClientCredentialClient.prototype,
                <any>"executePostToTokenEndpoint"
            )
            .resolves(DSTS_CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT);

        const client = new ClientCredentialClient(config);
        const clientCredentialRequest: CommonClientCredentialRequest = {
            authority: TEST_CONFIG.DSTS_VALID_AUTHORITY,
            correlationId: TEST_CONFIG.CORRELATION_ID,
            scopes: TEST_CONFIG.DSTS_TEST_SCOPE,
        };

        // First call should return from "network" (mocked)
        const networkAuthResult = (await client.acquireToken(
            clientCredentialRequest
        )) as AuthenticationResult;
        expect(networkAuthResult.fromCache).toBe(false);
        // Second call should return from cache
        const cachedAuthResult = (await client.acquireToken(
            clientCredentialRequest
        )) as AuthenticationResult;
        expect(cachedAuthResult.fromCache).toBe(true);
        expect(cachedAuthResult.accessToken).toBe(
            networkAuthResult.accessToken
        );
        expect(cachedAuthResult.expiresOn).toStrictEqual(
            networkAuthResult.expiresOn
        );
    });

    it("Adds claims when provided", async () => {
        sinon
            .stub(Authority.prototype, <any>"getEndpointMetadataFromNetwork")
            .resolves(DEFAULT_OPENID_CONFIG_RESPONSE.body);
        sinon
            .stub(
                ClientCredentialClient.prototype,
                <any>"executePostToTokenEndpoint"
            )
            .resolves(CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT);

        const createTokenRequestBodySpy = sinon.spy(
            ClientCredentialClient.prototype,
            <any>"createTokenRequestBody"
        );

        const client = new ClientCredentialClient(config);
        const clientCredentialRequest: CommonClientCredentialRequest = {
            authority: TEST_CONFIG.validAuthority,
            correlationId: TEST_CONFIG.CORRELATION_ID,
            scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
            claims: TEST_CONFIG.CLAIMS,
        };

        const authResult = (await client.acquireToken(
            clientCredentialRequest
        )) as AuthenticationResult;
        const expectedScopes = [TEST_CONFIG.DEFAULT_GRAPH_SCOPE[0]];
        expect(authResult.scopes).toEqual(expectedScopes);
        expect(authResult.accessToken).toEqual(
            CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT.body.access_token
        );
        expect(authResult.state).toBe("");

        expect(
            createTokenRequestBodySpy.calledWith(clientCredentialRequest)
        ).toBe(true);

        const returnVal = (await createTokenRequestBodySpy
            .returnValues[0]) as string;
        const checks = {
            graphScope: true,
            clientId: true,
            grantType: true,
            clientSecret: true,
            clientSku: true,
            clientVersion: true,
            clientOs: true,
            clientCpu: true,
            appName: true,
            appVersion: true,
            msLibraryCapability: true,
            claims: true,
        };
        checkMockedNetworkRequest(returnVal, checks);
    });

    it("Does not add claims when empty object provided", async () => {
        sinon
            .stub(Authority.prototype, <any>"getEndpointMetadataFromNetwork")
            .resolves(DEFAULT_OPENID_CONFIG_RESPONSE.body);
        sinon
            .stub(
                ClientCredentialClient.prototype,
                <any>"executePostToTokenEndpoint"
            )
            .resolves(CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT);

        const createTokenRequestBodySpy = sinon.spy(
            ClientCredentialClient.prototype,
            <any>"createTokenRequestBody"
        );

        const client = new ClientCredentialClient(config);
        const clientCredentialRequest: CommonClientCredentialRequest = {
            authority: TEST_CONFIG.validAuthority,
            correlationId: TEST_CONFIG.CORRELATION_ID,
            scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
            claims: "{}",
        };

        const authResult = (await client.acquireToken(
            clientCredentialRequest
        )) as AuthenticationResult;
        const expectedScopes = [TEST_CONFIG.DEFAULT_GRAPH_SCOPE[0]];
        expect(authResult.scopes).toEqual(expectedScopes);
        expect(authResult.accessToken).toEqual(
            CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT.body.access_token
        );
        expect(authResult.state).toBe("");

        expect(
            createTokenRequestBodySpy.calledWith(clientCredentialRequest)
        ).toBe(true);

        const returnVal = (await createTokenRequestBodySpy
            .returnValues[0]) as string;
        const checks = {
            graphScope: true,
            clientId: true,
            grantType: true,
            clientSecret: true,
            clientSku: true,
            clientVersion: true,
            clientOs: true,
            clientCpu: true,
            appName: true,
            appVersion: true,
            msLibraryCapability: true,
            claims: false,
        };
        checkMockedNetworkRequest(returnVal, checks);
    });

    it("Uses clientAssertion from ClientConfiguration when no client assertion is added to request", async () => {
        sinon
            .stub(Authority.prototype, <any>"getEndpointMetadataFromNetwork")
            .resolves(DEFAULT_OPENID_CONFIG_RESPONSE.body);
        sinon
            .stub(
                ClientCredentialClient.prototype,
                <any>"executePostToTokenEndpoint"
            )
            .resolves(CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT);

        const createTokenRequestBodySpy = sinon.spy(
            ClientCredentialClient.prototype,
            <any>"createTokenRequestBody"
        );

        config.clientCredentials = {
            ...config.clientCredentials,
            clientAssertion: {
                assertion: TEST_CONFIG.TEST_CONFIG_ASSERTION,
                assertionType: TEST_CONFIG.TEST_ASSERTION_TYPE,
            },
        };
        const client = new ClientCredentialClient(config);
        const clientCredentialRequest: CommonClientCredentialRequest = {
            authority: TEST_CONFIG.validAuthority,
            correlationId: TEST_CONFIG.CORRELATION_ID,
            scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
            claims: "{}",
        };

        const authResult = (await client.acquireToken(
            clientCredentialRequest
        )) as AuthenticationResult;
        const expectedScopes = [TEST_CONFIG.DEFAULT_GRAPH_SCOPE[0]];
        expect(authResult.scopes).toEqual(expectedScopes);
        expect(authResult.accessToken).toEqual(
            CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT.body.access_token
        );
        expect(authResult.state).toBe("");

        expect(
            createTokenRequestBodySpy.calledWith(clientCredentialRequest)
        ).toBe(true);

        const returnVal = (await createTokenRequestBodySpy
            .returnValues[0]) as string;
        const checks = {
            graphScope: true,
            clientId: true,
            grantType: true,
            clientSecret: true,
            clientSku: true,
            clientVersion: true,
            clientOs: true,
            clientCpu: true,
            appName: true,
            appVersion: true,
            msLibraryCapability: true,
            claims: false,
            testConfigAssertion: true,
            testAssertionType: true,
        };
        checkMockedNetworkRequest(returnVal, checks);
    });

    it("Uses the clientAssertion included in the request instead of the one in ClientConfiguration", async () => {
        sinon
            .stub(Authority.prototype, <any>"getEndpointMetadataFromNetwork")
            .resolves(DEFAULT_OPENID_CONFIG_RESPONSE.body);
        sinon
            .stub(
                ClientCredentialClient.prototype,
                <any>"executePostToTokenEndpoint"
            )
            .resolves(CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT);

        const createTokenRequestBodySpy = sinon.spy(
            ClientCredentialClient.prototype,
            <any>"createTokenRequestBody"
        );

        config.clientCredentials = {
            ...config.clientCredentials,
            clientAssertion: {
                assertion: TEST_CONFIG.TEST_CONFIG_ASSERTION,
                assertionType: TEST_CONFIG.TEST_ASSERTION_TYPE,
            },
        };
        const client = new ClientCredentialClient(config);
        const clientCredentialRequest: CommonClientCredentialRequest = {
            authority: TEST_CONFIG.validAuthority,
            correlationId: TEST_CONFIG.CORRELATION_ID,
            scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
            claims: "{}",
            clientAssertion: {
                assertion: TEST_CONFIG.TEST_REQUEST_ASSERTION,
                assertionType: TEST_CONFIG.TEST_ASSERTION_TYPE,
            },
        };

        const authResult = (await client.acquireToken(
            clientCredentialRequest
        )) as AuthenticationResult;
        const expectedScopes = [TEST_CONFIG.DEFAULT_GRAPH_SCOPE[0]];
        expect(authResult.scopes).toEqual(expectedScopes);
        expect(authResult.accessToken).toEqual(
            CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT.body.access_token
        );
        expect(authResult.state).toBe("");

        expect(
            createTokenRequestBodySpy.calledWith(clientCredentialRequest)
        ).toBe(true);

        const returnVal = (await createTokenRequestBodySpy
            .returnValues[0]) as string;
        const checks = {
            graphScope: true,
            clientId: true,
            grantType: true,
            clientSecret: true,
            clientSku: true,
            clientVersion: true,
            clientOs: true,
            clientCpu: true,
            appName: true,
            appVersion: true,
            msLibraryCapability: true,
            claims: false,
            testConfigAssertion: false,
            testRequestAssertion: true,
            testAssertionType: true,
        };
        checkMockedNetworkRequest(returnVal, checks);
    });

    it("Does not add headers that do not qualify for a simple request", async () => {
        // For more information about this test see: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
        let stubCalled = false;
        sinon
            .stub(Authority.prototype, <any>"getEndpointMetadataFromNetwork")
            .resolves(DEFAULT_OPENID_CONFIG_RESPONSE.body);
        // @ts-ignore
        sinon
            .stub(
                ClientCredentialClient.prototype,
                <any>"executePostToTokenEndpoint"
            )
            .callsFake(
                // @ts-ignore
                (
                    // @ts-ignore
                    tokenEndpoint: string,
                    // @ts-ignore
                    queryString: string,
                    headers: Record<string, string>
                ) => {
                    const headerNames = Object.keys(headers);
                    headerNames.forEach((name) => {
                        expect(CORS_SIMPLE_REQUEST_HEADERS).toEqual(
                            expect.arrayContaining([name.toLowerCase()])
                        );
                    });

                    stubCalled = true;
                    return CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT;
                }
            );

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
        sinon
            .stub(Authority.prototype, <any>"getEndpointMetadataFromNetwork")
            .resolves(DEFAULT_OPENID_CONFIG_RESPONSE.body);
        const client = new ClientCredentialClient(config);

        const expectedAtEntity: AccessTokenEntity =
            AccessTokenEntity.createAccessTokenEntity(
                "",
                "login.microsoftonline.com",
                "an_access_token",
                config.authOptions.clientId,
                TEST_CONFIG.TENANT,
                TEST_CONFIG.DEFAULT_GRAPH_SCOPE.toString(),
                4600,
                4600,
                mockCrypto,
                undefined,
                AuthenticationScheme.BEARER
            );

        sinon
            .stub(
                ClientCredentialClient.prototype,
                <any>"readAccessTokenFromCache"
            )
            .returns(expectedAtEntity);
        sinon.stub(TimeUtils, <any>"isTokenExpired").returns(false);

        const clientCredentialRequest: CommonClientCredentialRequest = {
            authority: TEST_CONFIG.validAuthority,
            correlationId: TEST_CONFIG.CORRELATION_ID,
            scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
        };

        const authResult = (await client.acquireToken(
            clientCredentialRequest
        )) as AuthenticationResult;
        const expectedScopes = [TEST_CONFIG.DEFAULT_GRAPH_SCOPE[0]];
        expect(authResult.scopes).toEqual(expectedScopes);
        expect(authResult.accessToken).toEqual("an_access_token");
        expect(authResult.account).toBeNull();
        expect(authResult.fromCache).toBe(true);
        expect(authResult.uniqueId).toHaveLength(0);
        expect(authResult.state).toHaveLength(0);
    });

    it("acquires a token from the cache and its refresh_in value is expired. A new token is successfully requested in the background via a network request.", async () => {
        sinon
            .stub(Authority.prototype, <any>"getEndpointMetadataFromNetwork")
            .resolves(DEFAULT_OPENID_CONFIG_RESPONSE.body);
        sinon
            .stub(
                ClientCredentialClient.prototype,
                <any>"executePostToTokenEndpoint"
            )
            .resolves(CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT);

        const createTokenRequestBodySpy = sinon.spy(
            ClientCredentialClient.prototype,
            <any>"createTokenRequestBody"
        );
        const client = new ClientCredentialClient(config);
        const clientCredentialRequest: CommonClientCredentialRequest = {
            authority: TEST_CONFIG.validAuthority,
            correlationId: TEST_CONFIG.CORRELATION_ID,
            scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
        };

        const expectedAtEntity: AccessTokenEntity =
            AccessTokenEntity.createAccessTokenEntity(
                "",
                "login.microsoftonline.com",
                "an_access_token",
                config.authOptions.clientId,
                TEST_CONFIG.TENANT,
                TEST_CONFIG.DEFAULT_GRAPH_SCOPE.toString(),
                TimeUtils.nowSeconds() + 4600,
                TimeUtils.nowSeconds() + 4600,
                mockCrypto,
                TimeUtils.nowSeconds() - 4600, // expired refreshOn value
                AuthenticationScheme.BEARER
            );

        sinon
            .stub(
                ClientCredentialClient.prototype,
                <any>"readAccessTokenFromCache"
            )
            .returns(expectedAtEntity);

        if (!config.storageInterface) {
            fail("config.storageInterface is undefined");
        }

        // The cached token returned from acquireToken below is mocked, which means it won't exist in the cache at this point
        const accessTokenKey: string | undefined = config.storageInterface
            .getKeys()
            .find((value) => value.indexOf("accesstoken") >= 0);
        expect(accessTokenKey).toBeUndefined();

        // Acquire a token (from the cache). The refresh_in value is expired, so there will be an asynchronous network request
        // to refresh the token. That result will be stored in the cache.
        const authResult = (await await client.acquireToken(
            clientCredentialRequest
        )) as AuthenticationResult;

        /**
         * Wait up to two seconds for acquireToken and its mocked network requests to complete and
         * populate the cache (in the background). Periodically check the cache to ensure the refreshed token
         * exists (the network request was successful).
         * @param cache config.storageInterface
         * @returns AccessTokenEntity - the access token in the cache
         */
        const waitUntilAccessTokenInCacheThenReturnIt = async (
            cache: CacheManager
        ): Promise<AccessTokenEntity | null> => {
            let counter: number = 0;
            return await new Promise((resolve) => {
                // every one millisecond
                const interval = setInterval(() => {
                    // look for the access token's key in the cache
                    const accessTokenKey = cache
                        .getKeys()
                        .find((value) => value.indexOf("accesstoken") >= 0);

                    // if the access token's key is in the cache
                    if (accessTokenKey) {
                        // use it to get the access token (from the cache)
                        const accessTokenFromCache: AccessTokenEntity | null =
                            cache.getAccessTokenCredential(accessTokenKey);
                        // return it and clear the interval
                        resolve(accessTokenFromCache);
                        clearInterval(interval);
                        // otherwise, if the access token's key is NOT in the cache (yet)
                    } else {
                        counter++;
                        // if 2 seconds have elapsed while waiting for the access token's key to be in the cache,
                        // exit the interval so that this test doesn't time out
                        if (counter === 2000) {
                            resolve(null);
                        }
                    }
                }, 1); // 1 millisecond
            });
        };
        const accessTokenFromCache: AccessTokenEntity | null =
            await waitUntilAccessTokenInCacheThenReturnIt(
                config.storageInterface
            );

        expect(accessTokenFromCache?.clientId).toEqual(
            expectedAtEntity.clientId
        );

        const expectedScopes = [TEST_CONFIG.DEFAULT_GRAPH_SCOPE[0]];
        expect(authResult.scopes).toEqual(expectedScopes);
        expect(authResult.accessToken).toEqual("an_access_token");
        expect(authResult.account).toBeNull();
        expect(authResult.fromCache).toBe(true);
        expect(authResult.uniqueId).toHaveLength(0);
        expect(authResult.state).toHaveLength(0);

        expect(
            createTokenRequestBodySpy.calledWith(clientCredentialRequest)
        ).toBe(true);

        const returnVal = (await createTokenRequestBodySpy
            .returnValues[0]) as string;
        const checks = {
            graphScope: true,
            clientId: true,
            grantType: true,
            clientSecret: true,
        };
        checkMockedNetworkRequest(returnVal, checks);
    });

    it("acquires a token, skipCache = true", async () => {
        sinon
            .stub(Authority.prototype, <any>"getEndpointMetadataFromNetwork")
            .resolves(DEFAULT_OPENID_CONFIG_RESPONSE.body);
        sinon
            .stub(
                ClientCredentialClient.prototype,
                <any>"executePostToTokenEndpoint"
            )
            .resolves(CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT);

        const createTokenRequestBodySpy = sinon.spy(
            ClientCredentialClient.prototype,
            <any>"createTokenRequestBody"
        );

        const client = new ClientCredentialClient(config);
        const clientCredentialRequest: CommonClientCredentialRequest = {
            authority: TEST_CONFIG.validAuthority,
            correlationId: TEST_CONFIG.CORRELATION_ID,
            scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
            skipCache: true,
        };

        const authResult = (await client.acquireToken(
            clientCredentialRequest
        )) as AuthenticationResult;
        const expectedScopes = [TEST_CONFIG.DEFAULT_GRAPH_SCOPE[0]];
        expect(authResult.scopes).toEqual(expectedScopes);
        expect(authResult.accessToken).toEqual(
            CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT.body.access_token
        );
        expect(authResult.state).toHaveLength(0);

        expect(
            createTokenRequestBodySpy.calledWith(clientCredentialRequest)
        ).toBe(true);

        const returnVal = (await createTokenRequestBodySpy
            .returnValues[0]) as string;
        const checks = {
            graphScope: true,
            clientId: true,
            grantType: true,
            clientSecret: true,
        };
        checkMockedNetworkRequest(returnVal, checks);
    });

    it("Multiple access tokens matched, exception thrown", async () => {
        sinon
            .stub(Authority.prototype, <any>"getEndpointMetadataFromNetwork")
            .resolves(DEFAULT_OPENID_CONFIG_RESPONSE.body);

        // mock access token
        const mockedAtEntity: AccessTokenEntity =
            AccessTokenEntity.createAccessTokenEntity(
                "",
                "login.microsoftonline.com",
                "an_access_token",
                config.authOptions.clientId,
                TEST_CONFIG.TENANT,
                TEST_CONFIG.DEFAULT_GRAPH_SCOPE.toString(),
                4600,
                4600,
                mockCrypto,
                undefined,
                AuthenticationScheme.BEARER,
                TEST_TOKENS.ACCESS_TOKEN
            );

        const mockedAtEntity2: AccessTokenEntity =
            AccessTokenEntity.createAccessTokenEntity(
                "",
                "login.microsoftonline.com",
                "an_access_token",
                config.authOptions.clientId,
                TEST_CONFIG.TENANT,
                TEST_CONFIG.DEFAULT_GRAPH_SCOPE.toString(),
                4600,
                4600,
                mockCrypto,
                undefined,
                AuthenticationScheme.BEARER,
                TEST_TOKENS.ACCESS_TOKEN
            );

        sinon
            .stub(CacheManager.prototype, <any>"getAccessTokensByFilter")
            .returns([mockedAtEntity, mockedAtEntity2]);

        const client = new ClientCredentialClient(config);
        const clientCredentialRequest: CommonClientCredentialRequest = {
            authority: TEST_CONFIG.validAuthority,
            correlationId: TEST_CONFIG.CORRELATION_ID,
            scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
        };

        await expect(
            client.acquireToken(clientCredentialRequest)
        ).rejects.toMatchObject(
            createClientAuthError(ClientAuthErrorCodes.multipleMatchingTokens)
        );
    });

    it("Uses the extensibility AppTokenProvider callback to get a token", async () => {
        sinon
            .stub(Authority.prototype, <any>"getEndpointMetadataFromNetwork")
            .resolves(DEFAULT_OPENID_CONFIG_RESPONSE.body);
        // no need to stub out the token response, MSAL will use the AppTokenProvider instead

        const accessToken = "some_token";
        const appTokenProviderResult: AppTokenProviderResult = {
            accessToken: accessToken,
            expiresInSeconds: 1800,
            refreshInSeconds: 900,
        };

        const expectedScopes = [TEST_CONFIG.DEFAULT_GRAPH_SCOPE[0]];

        let callbackedCalledCount = 0;

        const appTokenProvider: IAppTokenProvider = (
            appTokenProviderParameters
        ) => {
            callbackedCalledCount++;

            expect(appTokenProviderParameters.scopes).toEqual(expectedScopes);
            expect(appTokenProviderParameters.tenantId).toEqual("common");
            expect(appTokenProviderParameters.correlationId).toEqual(
                TEST_CONFIG.CORRELATION_ID
            );
            expect(appTokenProviderParameters.claims).toBeUndefined();

            return new Promise<AppTokenProviderResult>((resolve) =>
                resolve(appTokenProviderResult)
            );
        };

        // client credentials not needed
        config.clientCredentials = undefined;

        const client = new ClientCredentialClient(config, appTokenProvider);
        const clientCredentialRequest: CommonClientCredentialRequest = {
            authority: TEST_CONFIG.validAuthority,
            correlationId: TEST_CONFIG.CORRELATION_ID,
            scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
        };

        const authResult = (await client.acquireToken(
            clientCredentialRequest
        )) as AuthenticationResult;

        expect(callbackedCalledCount).toEqual(1);

        expect(authResult.scopes).toEqual(expectedScopes);
        expect(authResult.accessToken).toEqual(accessToken);
        expect(authResult.state).toHaveLength(0);
        const dateDiff =
            (authResult.expiresOn!.valueOf() - Date.now().valueOf()) / 1000;
        expect(dateDiff).toBeLessThanOrEqual(1900);
        expect(dateDiff).toBeGreaterThan(1700);

        const authResult2 = (await client.acquireToken(
            clientCredentialRequest
        )) as AuthenticationResult;

        // expect the callback to not be called again, because token comes from the cache
        expect(callbackedCalledCount).toEqual(1);

        expect(authResult2.scopes).toEqual(expectedScopes);
        expect(authResult2.accessToken).toEqual(accessToken);
    });
});
