/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

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
    CacheHelpers,
    GrantType,
} from "@azure/msal-common";
import {
    ClientCredentialClient,
    UsernamePasswordClient,
} from "../../src/index.js";
import {
    AUTHENTICATION_RESULT_DEFAULT_SCOPES,
    CAE_CONSTANTS,
    CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT,
    CORS_SIMPLE_REQUEST_HEADERS,
    DEFAULT_OPENID_CONFIG_RESPONSE,
    DSTS_CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT,
    DSTS_OPENID_CONFIG_RESPONSE,
    TEST_CONFIG,
    TEST_TOKENS,
} from "../test_kit/StringConstants.js";
import {
    checkMockedNetworkRequest,
    ClientTestUtils,
    getClientAssertionCallback,
    mockCrypto,
} from "./ClientTestUtils.js";
import { mockNetworkClient } from "../utils/MockNetworkClient.js";

describe("ClientCredentialClient unit tests", () => {
    let createTokenRequestBodySpy: jest.SpyInstance;
    let config: ClientConfiguration;
    beforeEach(async () => {
        createTokenRequestBodySpy = jest.spyOn(
            ClientCredentialClient.prototype,
            <any>"createTokenRequestBody"
        );

        config = await ClientTestUtils.createTestClientConfiguration(
            undefined,
            mockNetworkClient(
                DEFAULT_OPENID_CONFIG_RESPONSE.body,
                CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT
            )
        );
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("Constructor", () => {
        it("creates a ClientCredentialClient", async () => {
            const client: ClientCredentialClient = new ClientCredentialClient(
                config
            );
            expect(client).not.toBeNull();
            expect(client instanceof ClientCredentialClient).toBe(true);
            expect(client instanceof BaseClient).toBe(true);
        });
    });

    it("acquires a token", async () => {
        const client: ClientCredentialClient = new ClientCredentialClient(
            config
        );

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

        expect(createTokenRequestBodySpy.mock.lastCall[0]).toEqual(
            clientCredentialRequest
        );

        const returnVal: string = await createTokenRequestBodySpy.mock
            .results[0].value;
        const checks = {
            graphScope: true,
            clientId: true,
            grantType: GrantType.CLIENT_CREDENTIALS_GRANT,
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

    it("Adds tokenQueryParameters to the /token request", async () => {
        const badExecutePostToTokenEndpointMock = jest.spyOn(
            ClientCredentialClient.prototype,
            <any>"executePostToTokenEndpoint"
        );
        // no implementation has been mocked, the acquireToken call will fail

        const fakeConfig: ClientConfiguration =
            await ClientTestUtils.createTestClientConfiguration();
        const client: ClientCredentialClient = new ClientCredentialClient(
            fakeConfig
        );

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

        await expect(
            client.acquireToken(clientCredentialRequest)
        ).rejects.toThrow();

        if (!badExecutePostToTokenEndpointMock.mock.lastCall) {
            fail("executePostToTokenEndpointMock was not called");
        }
        const url: string = badExecutePostToTokenEndpointMock.mock
            .lastCall[0] as string;
        expect(
            url.includes("/token?testParam1=testValue1&testParam3=testValue3")
        ).toBeTruthy();
        expect(!url.includes("/token?testParam2=")).toBeTruthy();
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

        const interactionRequiredAuthErrorConfig: ClientConfiguration =
            await ClientTestUtils.createTestClientConfiguration(
                undefined,
                mockNetworkClient(DEFAULT_OPENID_CONFIG_RESPONSE.body, {
                    headers: [],
                    body: errorResponse,
                    status: 400,
                })
            );
        const client: ClientCredentialClient = new ClientCredentialClient(
            interactionRequiredAuthErrorConfig
        );

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
        const client: ClientCredentialClient = new ClientCredentialClient(
            config
        );

        const clientCredentialRequest: CommonClientCredentialRequest = {
            authority: "https://login.microsoftonline.com/common",
            correlationId: TEST_CONFIG.CORRELATION_ID,
            scopes: ["https://graph.microsoft.com/.default"],
        };

        const authenticationScopes = AUTHENTICATION_RESULT_DEFAULT_SCOPES;
        authenticationScopes.body.scope =
            "https://graph.microsoft.com/.default";
        const upcConfig: ClientConfiguration =
            await ClientTestUtils.createTestClientConfiguration(
                undefined,
                mockNetworkClient(
                    DEFAULT_OPENID_CONFIG_RESPONSE.body,
                    authenticationScopes
                )
            );
        const client2 = new UsernamePasswordClient(upcConfig);
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
        const dSTSConfig: ClientConfiguration =
            await ClientTestUtils.createTestClientConfiguration(
                undefined,
                mockNetworkClient(
                    DSTS_OPENID_CONFIG_RESPONSE.body,
                    DSTS_CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT
                )
            );
        const client: ClientCredentialClient = new ClientCredentialClient(
            dSTSConfig
        );

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

        expect(createTokenRequestBodySpy.mock.lastCall[0]).toEqual(
            clientCredentialRequest
        );

        const returnVal: string = await createTokenRequestBodySpy.mock
            .results[0].value;
        const checks = {
            dstsScope: true,
            clientId: true,
            grantType: GrantType.CLIENT_CREDENTIALS_GRANT,
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
        const dSTSConfig: ClientConfiguration =
            await ClientTestUtils.createTestClientConfiguration(
                undefined,
                mockNetworkClient(
                    DSTS_OPENID_CONFIG_RESPONSE.body,
                    DSTS_CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT
                )
            );
        const client: ClientCredentialClient = new ClientCredentialClient(
            dSTSConfig
        );

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
        const client: ClientCredentialClient = new ClientCredentialClient(
            config
        );

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

        expect(createTokenRequestBodySpy.mock.lastCall[0]).toEqual(
            clientCredentialRequest
        );

        const returnVal: string = await createTokenRequestBodySpy.mock
            .results[0].value;
        const checks = {
            graphScope: true,
            clientId: true,
            grantType: GrantType.CLIENT_CREDENTIALS_GRANT,
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

    describe("CAE, claims and client capabilities", () => {
        let client: ClientCredentialClient;
        let clientCredentialRequest: CommonClientCredentialRequest;
        beforeEach(async () => {
            const clientCapabilitiesConfig: ClientConfiguration =
                await ClientTestUtils.createTestClientConfiguration(
                    CAE_CONSTANTS.CLIENT_CAPABILITIES,
                    mockNetworkClient(
                        DEFAULT_OPENID_CONFIG_RESPONSE.body,
                        CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT
                    )
                );
            client = new ClientCredentialClient(clientCapabilitiesConfig);

            clientCredentialRequest = {
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
            };
        });

        it.each([
            [CAE_CONSTANTS.EMPTY_CLAIMS, CAE_CONSTANTS.MERGED_EMPTY_CLAIMS],
            [
                CAE_CONSTANTS.CLAIMS_WITH_ADDITIONAL_CLAIMS,
                CAE_CONSTANTS.MERGED_CLAIMS_WITH_ADDITIONAL_CLAIMS,
            ],
            [
                CAE_CONSTANTS.CLAIMS_WITH_ADDITIONAL_KEY,
                CAE_CONSTANTS.MERGED_CLAIMS_WITH_ADDITIONAL_KEY,
            ],
            [
                CAE_CONSTANTS.CLAIM_WITH_ADDITIONAL_KEY_AND_ACCESS_KEY,
                CAE_CONSTANTS.MERGED_CLAIM_WITH_ADDITIONAL_KEY_AND_ACCESS_KEY,
            ],
        ])(
            "Validates that claims and client capabilities are correctly merged",
            async (claims, mergedClaims) => {
                // acquire a token with a client that has client capabilities, but no claims in the request
                // verify that it comes from the IDP
                const authResult = (await client.acquireToken(
                    clientCredentialRequest
                )) as AuthenticationResult;
                expect(authResult.accessToken).toEqual(
                    CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT.body.access_token
                );
                expect(authResult.fromCache).toBe(false);

                // verify that the client capabilities have been merged with the (empty) claims
                const returnVal: string = await createTokenRequestBodySpy.mock
                    .results[0].value;
                expect(
                    decodeURIComponent(
                        returnVal
                            .split("&")
                            .filter((key: string) => key.includes("claims="))[0]
                            .split("claims=")[1]
                    )
                ).toEqual(CAE_CONSTANTS.MERGED_EMPTY_CLAIMS);

                // acquire a token (without changing anything) and verify that it comes from the cache
                // verify that it comes from the cache
                const cachedAuthResult = (await client.acquireToken(
                    clientCredentialRequest
                )) as AuthenticationResult;
                expect(cachedAuthResult.accessToken).toEqual(
                    CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT.body.access_token
                );
                expect(cachedAuthResult.fromCache).toBe(true);

                // acquire a token with a client that has client capabilities, and has claims in the request
                // verify that it comes from the IDP
                clientCredentialRequest.claims = claims;
                const authResult2 = (await client.acquireToken(
                    clientCredentialRequest
                )) as AuthenticationResult;
                expect(authResult2.accessToken).toEqual(
                    CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT.body.access_token
                );
                expect(authResult2.fromCache).toBe(false);

                // verify that the client capabilities have been merged with the claims
                const returnVal2: string = await createTokenRequestBodySpy.mock
                    .results[1].value;
                expect(
                    decodeURIComponent(
                        returnVal2
                            .split("&")
                            .filter((key: string) => key.includes("claims="))[0]
                            .split("claims=")[1]
                    )
                ).toEqual(mergedClaims);

                // acquire a token with a client that has client capabilities, but no claims in the request
                // verify that it comes from the cache
                delete clientCredentialRequest.claims;
                const authResult3 = (await client.acquireToken(
                    clientCredentialRequest
                )) as AuthenticationResult;
                expect(authResult3.accessToken).toEqual(
                    CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT.body.access_token
                );
                expect(authResult3.fromCache).toBe(true);

                // acquire a token with a client that has client capabilities, and has claims in the request
                // verify that it comes from the IDP
                clientCredentialRequest.claims = claims;
                const authResult4 = (await client.acquireToken(
                    clientCredentialRequest
                )) as AuthenticationResult;
                expect(authResult4.accessToken).toEqual(
                    CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT.body.access_token
                );
                expect(authResult4.fromCache).toBe(false);
            }
        );
    });

    it("Does not add claims when empty object provided", async () => {
        const client: ClientCredentialClient = new ClientCredentialClient(
            config
        );

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

        expect(createTokenRequestBodySpy.mock.lastCall[0]).toEqual(
            clientCredentialRequest
        );

        const returnVal: string = await createTokenRequestBodySpy.mock
            .results[0].value;
        const checks = {
            graphScope: true,
            clientId: true,
            grantType: GrantType.CLIENT_CREDENTIALS_GRANT,
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

    it.each([
        TEST_CONFIG.TEST_CONFIG_ASSERTION,
        getClientAssertionCallback(TEST_CONFIG.TEST_CONFIG_ASSERTION),
    ])(
        "Uses clientAssertion from ClientConfiguration when no client assertion is added to request",
        async (clientAssertion) => {
            config.clientCredentials = {
                ...config.clientCredentials,
                clientAssertion: {
                    assertion: clientAssertion,
                    assertionType: TEST_CONFIG.TEST_ASSERTION_TYPE,
                },
            };
            const client: ClientCredentialClient = new ClientCredentialClient(
                config
            );

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
            expect(authResult.state).toBe("");

            expect(createTokenRequestBodySpy.mock.lastCall[0]).toEqual(
                clientCredentialRequest
            );

            const returnVal: string = await createTokenRequestBodySpy.mock
                .results[0].value;
            const checks = {
                graphScope: true,
                clientId: true,
                grantType: GrantType.CLIENT_CREDENTIALS_GRANT,
                clientSecret: true,
                clientSku: true,
                clientVersion: true,
                clientOs: true,
                clientCpu: true,
                appName: true,
                appVersion: true,
                msLibraryCapability: true,
                testConfigAssertion: true,
                testAssertionType: true,
            };
            checkMockedNetworkRequest(returnVal, checks);
        }
    );

    it.each([
        TEST_CONFIG.TEST_REQUEST_ASSERTION,
        getClientAssertionCallback(TEST_CONFIG.TEST_REQUEST_ASSERTION),
    ])(
        "Uses the clientAssertion included in the request instead of the one in ClientConfiguration",
        async (clientAssertion) => {
            config.clientCredentials = {
                ...config.clientCredentials,
                clientAssertion: {
                    assertion:
                        "config-assertion that will be overridden by request-assertion",
                    assertionType: TEST_CONFIG.TEST_ASSERTION_TYPE,
                },
            };
            const client: ClientCredentialClient = new ClientCredentialClient(
                config
            );

            const clientCredentialRequest: CommonClientCredentialRequest = {
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                clientAssertion: {
                    assertion: clientAssertion,
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

            expect(createTokenRequestBodySpy.mock.lastCall[0]).toEqual(
                clientCredentialRequest
            );

            const returnVal: string = await createTokenRequestBodySpy.mock
                .results[0].value;
            const checks = {
                graphScope: true,
                clientId: true,
                grantType: GrantType.CLIENT_CREDENTIALS_GRANT,
                clientSecret: true,
                clientSku: true,
                clientVersion: true,
                clientOs: true,
                clientCpu: true,
                appName: true,
                appVersion: true,
                msLibraryCapability: true,
                testConfigAssertion: false,
                testRequestAssertion: true,
                testAssertionType: true,
            };
            checkMockedNetworkRequest(returnVal, checks);
        }
    );

    // For more information about this test see: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
    it("Does not add headers that do not qualify for a simple request", async () => {
        const executePostToTokenEndpointMock = jest.spyOn(
            ClientCredentialClient.prototype,
            <any>"executePostToTokenEndpoint"
        );

        const client: ClientCredentialClient = new ClientCredentialClient(
            config
        );

        const clientCredentialRequest: CommonClientCredentialRequest = {
            authority: TEST_CONFIG.validAuthority,
            correlationId: TEST_CONFIG.CORRELATION_ID,
            scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
        };

        await client.acquireToken(clientCredentialRequest);

        if (!executePostToTokenEndpointMock.mock.lastCall) {
            fail("executePostToTokenEndpointMock was not called");
        }
        const headersObject: Object = executePostToTokenEndpointMock.mock
            .lastCall[2] as Object;
        const headers = Object.keys(headersObject);
        headers.forEach((header) => {
            expect(CORS_SIMPLE_REQUEST_HEADERS).toEqual(
                expect.arrayContaining([header.toLowerCase()])
            );
        });
    });

    it("acquires a token, returns token from the cache", async () => {
        const expectedAtEntity: AccessTokenEntity =
            CacheHelpers.createAccessTokenEntity(
                "",
                "login.microsoftonline.com",
                "an_access_token",
                config.authOptions.clientId,
                TEST_CONFIG.TENANT,
                TEST_CONFIG.DEFAULT_GRAPH_SCOPE.toString(),
                Date.now() + 60 * 30 * 1000,
                Date.now() + 60 * 30 * 1000,
                mockCrypto.base64Decode,
                undefined,
                AuthenticationScheme.BEARER
            );

        jest.spyOn(
            ClientCredentialClient.prototype,
            <any>"readAccessTokenFromCache"
        ).mockReturnValueOnce(expectedAtEntity);

        const client: ClientCredentialClient = new ClientCredentialClient(
            config
        );

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
        if (!config.storageInterface) {
            fail("config.storageInterface is undefined");
        }

        const expectedAtEntity: AccessTokenEntity =
            CacheHelpers.createAccessTokenEntity(
                "",
                "login.microsoftonline.com",
                "an_access_token",
                config.authOptions.clientId,
                TEST_CONFIG.TENANT,
                TEST_CONFIG.DEFAULT_GRAPH_SCOPE.toString(),
                TimeUtils.nowSeconds() + 4600,
                TimeUtils.nowSeconds() + 4600,
                mockCrypto.base64Decode,
                TimeUtils.nowSeconds() - 4600, // expired refreshOn value
                AuthenticationScheme.BEARER
            );

        jest.spyOn(
            ClientCredentialClient.prototype,
            <any>"readAccessTokenFromCache"
        ).mockReturnValueOnce(expectedAtEntity);

        const client: ClientCredentialClient = new ClientCredentialClient(
            config
        );

        const clientCredentialRequest: CommonClientCredentialRequest = {
            authority: TEST_CONFIG.validAuthority,
            correlationId: TEST_CONFIG.CORRELATION_ID,
            scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
        };

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

        expect(createTokenRequestBodySpy.mock.lastCall[0]).toEqual(
            clientCredentialRequest
        );

        const returnVal: string = await createTokenRequestBodySpy.mock
            .results[0].value;
        const checks = {
            graphScope: true,
            clientId: true,
            grantType: GrantType.CLIENT_CREDENTIALS_GRANT,
            clientSecret: true,
        };
        checkMockedNetworkRequest(returnVal, checks);
    });

    it("acquires a token, skipCache = true", async () => {
        const client: ClientCredentialClient = new ClientCredentialClient(
            config
        );

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

        expect(createTokenRequestBodySpy.mock.lastCall[0]).toEqual(
            clientCredentialRequest
        );

        const returnVal: string = await createTokenRequestBodySpy.mock
            .results[0].value;
        const checks = {
            graphScope: true,
            clientId: true,
            grantType: GrantType.CLIENT_CREDENTIALS_GRANT,
            clientSecret: true,
        };
        checkMockedNetworkRequest(returnVal, checks);
    });

    it("Multiple access tokens matched, exception thrown", async () => {
        // mock access token
        const mockedAtEntity: AccessTokenEntity =
            CacheHelpers.createAccessTokenEntity(
                "",
                "login.microsoftonline.com",
                "an_access_token",
                config.authOptions.clientId,
                TEST_CONFIG.TENANT,
                TEST_CONFIG.DEFAULT_GRAPH_SCOPE.toString(),
                4600,
                4600,
                mockCrypto.base64Decode,
                undefined,
                AuthenticationScheme.BEARER,
                TEST_TOKENS.ACCESS_TOKEN
            );

        const mockedAtEntity2: AccessTokenEntity =
            CacheHelpers.createAccessTokenEntity(
                "",
                "login.microsoftonline.com",
                "an_access_token",
                config.authOptions.clientId,
                TEST_CONFIG.TENANT,
                TEST_CONFIG.DEFAULT_GRAPH_SCOPE.toString(),
                4600,
                4600,
                mockCrypto.base64Decode,
                undefined,
                AuthenticationScheme.BEARER,
                TEST_TOKENS.ACCESS_TOKEN
            );

        jest.spyOn(
            CacheManager.prototype,
            <any>"getAccessTokensByFilter"
        ).mockReturnValueOnce([mockedAtEntity, mockedAtEntity2]);

        const client: ClientCredentialClient = new ClientCredentialClient(
            config
        );

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
        jest.spyOn(
            Authority.prototype,
            <any>"getEndpointMetadataFromNetwork"
        ).mockReturnValueOnce(DEFAULT_OPENID_CONFIG_RESPONSE.body);
        // no need to mock out the token response, MSAL will use the AppTokenProvider instead

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
        const appTokenProviderConfig: ClientConfiguration = {
            ...(await ClientTestUtils.createTestClientConfiguration()),
            clientCredentials: undefined,
        };
        const client: ClientCredentialClient = new ClientCredentialClient(
            appTokenProviderConfig,
            appTokenProvider
        );

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
