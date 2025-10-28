/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    AuthenticationResult,
    Authority,
    ClientAssertion,
    Constants,
    INetworkModule,
    Logger,
    ProtocolMode,
    ServerTelemetryManager,
    StubPerformanceClient,
} from "@azure/msal-common/node";
import {
    AUTHENTICATION_RESULT_DEFAULT_SCOPES,
    DEFAULT_OPENID_CONFIG_RESPONSE,
    MOCK_PASSWORD,
    MOCK_USERNAME,
    RANDOM_TEST_GUID,
    TEST_CONFIG,
} from "../test_kit/StringConstants.js";
import { UsernamePasswordClient } from "../../src/client/UsernamePasswordClient.js";
import {
    MockStorageClass,
    checkMockedNetworkRequest,
    getClientAssertionCallback,
    mockCrypto,
} from "./ClientTestUtils.js";
import { CommonUsernamePasswordRequest } from "../../src/request/CommonUsernamePasswordRequest.js";
import { buildAppConfiguration, NodeConfiguration } from "../../src/config/Configuration.js";
import { ApiId } from "../../src/utils/Constants.js";
import { TokenCache } from "../../src/cache/TokenCache.js";
import { mockNetworkClient } from "../utils/MockNetworkClient.js";
import { HttpClient } from "../../src/network/HttpClient.js";

describe("Username Password unit tests", () => {
    let createTokenRequestBodySpy: jest.SpyInstance;
    let config: NodeConfiguration;
    let clientAssertion: ClientAssertion;
    let mockStorage: MockStorageClass;
    let mockServerTelemetryManager: ServerTelemetryManager;
    let mockAuthority: Authority;
    let networkClient: INetworkModule;
    const logger = new Logger({});

    beforeEach(async () => {
        createTokenRequestBodySpy = jest.spyOn(
            UsernamePasswordClient.prototype,
            <any>"createTokenRequestBody"
        );

        networkClient = mockNetworkClient(
            DEFAULT_OPENID_CONFIG_RESPONSE.body,
            AUTHENTICATION_RESULT_DEFAULT_SCOPES
        );

        config = buildAppConfiguration({
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                clientSecret: TEST_CONFIG.MSAL_CLIENT_SECRET,
            },
            system: {
                networkClient: networkClient
            },
            telemetry: {
                application: {
                    appName: TEST_CONFIG.applicationName,
                    appVersion: TEST_CONFIG.applicationVersion,
                }
            }
        });

        clientAssertion = {
            assertion: TEST_CONFIG.TEST_CONFIG_ASSERTION,
            assertionType: TEST_CONFIG.TEST_ASSERTION_TYPE,
        }

        mockStorage = new MockStorageClass(
            logger,
            TEST_CONFIG.MSAL_CLIENT_ID,
            mockCrypto
        );

        mockServerTelemetryManager = new ServerTelemetryManager({clientId: TEST_CONFIG.MSAL_CLIENT_ID, apiId: ApiId.acquireTokenByUsernamePassword, correlationId: TEST_CONFIG.CORRELATION_ID}, mockStorage);

        mockAuthority = new Authority(
            TEST_CONFIG.validAuthority,
            networkClient,
            mockStorage,
            {
                protocolMode: ProtocolMode.AAD,
                knownAuthorities: [TEST_CONFIG.validAuthority],
                cloudDiscoveryMetadata: "",
                authorityMetadata: "",
            },
            logger,
            TEST_CONFIG.CORRELATION_ID,
            new StubPerformanceClient()
        );
        
        await mockAuthority.resolveEndpointsAsync();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("Constructor", () => {
        it("creates a UsernamePasswordClient", async () => {
            const client = new UsernamePasswordClient(config, clientAssertion, logger, mockCrypto, mockStorage, mockServerTelemetryManager, mockAuthority);
            expect(client).not.toBeNull();
            expect(client instanceof UsernamePasswordClient).toBe(true);
        });
    });

    it("acquires a token", async () => {
        const client = new UsernamePasswordClient(config, clientAssertion, logger, mockCrypto, mockStorage, mockServerTelemetryManager, mockAuthority);

        const usernamePasswordRequest: CommonUsernamePasswordRequest = {
            authority: Constants.DEFAULT_AUTHORITY,
            scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
            username: MOCK_USERNAME,
            password: MOCK_PASSWORD,
            claims: TEST_CONFIG.CLAIMS,
            correlationId: RANDOM_TEST_GUID,
        };

        const authResult = (await client.acquireToken(
            usernamePasswordRequest,
            new TokenCache(mockStorage, logger)
        )) as AuthenticationResult;
        const expectedScopes = [
            Constants.OPENID_SCOPE,
            Constants.PROFILE_SCOPE,
            Constants.OFFLINE_ACCESS_SCOPE,
            TEST_CONFIG.DEFAULT_GRAPH_SCOPE[0],
        ];
        expect(authResult.scopes).toEqual(expectedScopes);
        expect(authResult.idToken).toEqual(
            AUTHENTICATION_RESULT_DEFAULT_SCOPES.body.id_token
        );
        expect(authResult.accessToken).toEqual(
            AUTHENTICATION_RESULT_DEFAULT_SCOPES.body.access_token
        );
        expect(authResult.state).toHaveLength(0);

        expect(createTokenRequestBodySpy.mock.lastCall[0]).toEqual(
            usernamePasswordRequest
        );

        const returnVal: string = await createTokenRequestBodySpy.mock
            .results[0].value;
        const checks = {
            graphScope: true,
            clientId: true,
            grantType: Constants.GrantType.RESOURCE_OWNER_PASSWORD_GRANT,
            clientSecret: true,
            clientSku: true,
            clientVersion: true,
            clientOs: true,
            clientCpu: true,
            appName: true,
            appVersion: true,
            msLibraryCapability: true,
            claims: true,
            responseType: true,
            username: MOCK_USERNAME,
            password: MOCK_PASSWORD,
        };
        checkMockedNetworkRequest(returnVal, checks);
    });

    it("Adds tokenQueryParameters to the /token request", async () => {
        const badExecutePostToTokenEndpointMock = jest.spyOn(
            HttpClient.prototype,
            "sendPostRequestAsync"
        );
        // no implementation has been mocked, the acquireToken call will fail
        const fakeConfig = buildAppConfiguration({
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID
            }
        });
        const client: UsernamePasswordClient = new UsernamePasswordClient(fakeConfig, clientAssertion, logger, mockCrypto, mockStorage, mockServerTelemetryManager, mockAuthority);

        const usernamePasswordRequest: CommonUsernamePasswordRequest = {
            authority: Constants.DEFAULT_AUTHORITY,
            scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
            username: MOCK_USERNAME,
            password: MOCK_PASSWORD,
            claims: TEST_CONFIG.CLAIMS,
            correlationId: RANDOM_TEST_GUID,
            tokenQueryParameters: {
                testParam1: "testValue1",
                testParam2: "",
                testParam3: "testValue3",
            },
        };

        await expect(
            client.acquireToken(usernamePasswordRequest, new TokenCache(mockStorage, logger))
        ).rejects.toThrow();

        if (!badExecutePostToTokenEndpointMock.mock.lastCall) {
            throw "executePostToTokenEndpointMock was not called";
        }
        const url: string = badExecutePostToTokenEndpointMock.mock
            .lastCall[0] as string;
        expect(
            url.includes("/token?testParam1=testValue1&testParam3=testValue3")
        ).toBeTruthy();
        expect(!url.includes("/token?testParam2=")).toBeTruthy();
    });

    it("properly encodes special characters in emails (usernames)", async () => {
        const client = new UsernamePasswordClient(config, clientAssertion, logger, mockCrypto, mockStorage, mockServerTelemetryManager, mockAuthority);

        const usernamePasswordRequest: CommonUsernamePasswordRequest = {
            authority: Constants.DEFAULT_AUTHORITY,
            scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
            username: `${MOCK_USERNAME}&+`,
            password: MOCK_PASSWORD,
            claims: TEST_CONFIG.CLAIMS,
            correlationId: RANDOM_TEST_GUID,
        };

        const authResult = (await client.acquireToken(
            usernamePasswordRequest,
            new TokenCache(mockStorage, logger)
        )) as AuthenticationResult;
        const expectedScopes = [
            Constants.OPENID_SCOPE,
            Constants.PROFILE_SCOPE,
            Constants.OFFLINE_ACCESS_SCOPE,
            TEST_CONFIG.DEFAULT_GRAPH_SCOPE[0],
        ];
        expect(authResult.scopes).toEqual(expectedScopes);
        expect(authResult.idToken).toEqual(
            AUTHENTICATION_RESULT_DEFAULT_SCOPES.body.id_token
        );
        expect(authResult.accessToken).toEqual(
            AUTHENTICATION_RESULT_DEFAULT_SCOPES.body.access_token
        );
        expect(authResult.state).toHaveLength(0);

        expect(createTokenRequestBodySpy.mock.lastCall[0]).toEqual(
            usernamePasswordRequest
        );

        const returnVal: string = await createTokenRequestBodySpy.mock
            .results[0].value;
        const checks = {
            graphScope: true,
            clientId: true,
            grantType: Constants.GrantType.RESOURCE_OWNER_PASSWORD_GRANT,
            clientSecret: true,
            clientSku: true,
            clientVersion: true,
            clientOs: true,
            clientCpu: true,
            appName: true,
            appVersion: true,
            msLibraryCapability: true,
            claims: true,
            responseType: true,
            username: `${MOCK_USERNAME}%26%2B`,
            password: MOCK_PASSWORD,
        };
        checkMockedNetworkRequest(returnVal, checks);
    });

    it("properly encodes special characters in passwords", async () => {
        const client = new UsernamePasswordClient(config, clientAssertion, logger, mockCrypto, mockStorage, mockServerTelemetryManager, mockAuthority);

        const usernamePasswordRequest: CommonUsernamePasswordRequest = {
            authority: Constants.DEFAULT_AUTHORITY,
            scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
            username: MOCK_USERNAME,
            password: `${MOCK_PASSWORD}&+`,
            claims: TEST_CONFIG.CLAIMS,
            correlationId: RANDOM_TEST_GUID,
        };

        const authResult = (await client.acquireToken(
            usernamePasswordRequest,
            new TokenCache(mockStorage, logger)
        )) as AuthenticationResult;
        const expectedScopes = [
            Constants.OPENID_SCOPE,
            Constants.PROFILE_SCOPE,
            Constants.OFFLINE_ACCESS_SCOPE,
            TEST_CONFIG.DEFAULT_GRAPH_SCOPE[0],
        ];
        expect(authResult.scopes).toEqual(expectedScopes);
        expect(authResult.idToken).toEqual(
            AUTHENTICATION_RESULT_DEFAULT_SCOPES.body.id_token
        );
        expect(authResult.accessToken).toEqual(
            AUTHENTICATION_RESULT_DEFAULT_SCOPES.body.access_token
        );
        expect(authResult.state).toHaveLength(0);

        expect(createTokenRequestBodySpy.mock.lastCall[0]).toEqual(
            usernamePasswordRequest
        );

        const returnVal: string = await createTokenRequestBodySpy.mock
            .results[0].value;
        const checks = {
            graphScope: true,
            clientId: true,
            grantType: Constants.GrantType.RESOURCE_OWNER_PASSWORD_GRANT,
            clientSecret: true,
            clientSku: true,
            clientVersion: true,
            clientOs: true,
            clientCpu: true,
            appName: true,
            appVersion: true,
            msLibraryCapability: true,
            claims: true,
            responseType: true,
            username: MOCK_USERNAME,
            password: `${MOCK_PASSWORD}%26%2B`,
        };
        checkMockedNetworkRequest(returnVal, checks);
    });

    it("Does not include claims if empty object is passed", async () => {
        const client = new UsernamePasswordClient(config, clientAssertion, logger, mockCrypto, mockStorage, mockServerTelemetryManager, mockAuthority);

        const usernamePasswordRequest: CommonUsernamePasswordRequest = {
            authority: Constants.DEFAULT_AUTHORITY,
            scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
            username: MOCK_USERNAME,
            password: MOCK_PASSWORD,
            correlationId: RANDOM_TEST_GUID,
            claims: "{}",
        };

        const authResult = (await client.acquireToken(
            usernamePasswordRequest,
            new TokenCache(mockStorage, logger)
        )) as AuthenticationResult;
        const expectedScopes = [
            Constants.OPENID_SCOPE,
            Constants.PROFILE_SCOPE,
            Constants.OFFLINE_ACCESS_SCOPE,
            TEST_CONFIG.DEFAULT_GRAPH_SCOPE[0],
        ];
        expect(authResult.scopes).toEqual(expectedScopes);
        expect(authResult.idToken).toEqual(
            AUTHENTICATION_RESULT_DEFAULT_SCOPES.body.id_token
        );
        expect(authResult.accessToken).toEqual(
            AUTHENTICATION_RESULT_DEFAULT_SCOPES.body.access_token
        );
        expect(authResult.state).toBe("");

        expect(createTokenRequestBodySpy.mock.lastCall[0]).toEqual(
            usernamePasswordRequest
        );

        const returnVal: string = await createTokenRequestBodySpy.mock
            .results[0].value;
        const checks = {
            graphScope: true,
            clientId: true,
            grantType: Constants.GrantType.RESOURCE_OWNER_PASSWORD_GRANT,
            clientSecret: true,
            clientSku: true,
            clientVersion: true,
            clientOs: true,
            clientCpu: true,
            appName: true,
            appVersion: true,
            msLibraryCapability: true,
            claims: false,
            responseType: true,
            username: MOCK_USERNAME,
            password: MOCK_PASSWORD,
        };
        checkMockedNetworkRequest(returnVal, checks);
    });

    it.each([
        TEST_CONFIG.TEST_CONFIG_ASSERTION,
        getClientAssertionCallback(TEST_CONFIG.TEST_CONFIG_ASSERTION),
    ])(
        "Uses clientAssertion from ClientConfiguration when no client assertion is added to request",
        async (testClientAssertion) => {
            clientAssertion = {
                assertion: testClientAssertion,
                assertionType: TEST_CONFIG.TEST_ASSERTION_TYPE,
            }
            const client: UsernamePasswordClient = new UsernamePasswordClient(config, clientAssertion, logger, mockCrypto, mockStorage, mockServerTelemetryManager, mockAuthority);

            const usernamePasswordRequest: CommonUsernamePasswordRequest = {
                authority: Constants.DEFAULT_AUTHORITY,
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                username: MOCK_USERNAME,
                password: MOCK_PASSWORD,
                correlationId: RANDOM_TEST_GUID,
            };

            const authResult = (await client.acquireToken(
                usernamePasswordRequest,
                new TokenCache(mockStorage, logger)
            )) as AuthenticationResult;
            const expectedScopes = [
                Constants.OPENID_SCOPE,
                Constants.PROFILE_SCOPE,
                Constants.OFFLINE_ACCESS_SCOPE,
                TEST_CONFIG.DEFAULT_GRAPH_SCOPE[0],
            ];
            expect(authResult.scopes).toEqual(expectedScopes);
            expect(authResult.idToken).toEqual(
                AUTHENTICATION_RESULT_DEFAULT_SCOPES.body.id_token
            );
            expect(authResult.accessToken).toEqual(
                AUTHENTICATION_RESULT_DEFAULT_SCOPES.body.access_token
            );
            expect(authResult.state).toBe("");

            expect(createTokenRequestBodySpy.mock.lastCall[0]).toEqual(
                usernamePasswordRequest
            );

            const returnVal: string = await createTokenRequestBodySpy.mock
                .results[0].value;
            const checks = {
                graphScope: true,
                clientId: true,
                grantType: Constants.GrantType.RESOURCE_OWNER_PASSWORD_GRANT,
                clientSecret: true,
                clientSku: true,
                clientVersion: true,
                clientOs: true,
                clientCpu: true,
                appName: true,
                appVersion: true,
                msLibraryCapability: true,
                responseType: true,
                username: MOCK_USERNAME,
                password: MOCK_PASSWORD,
                testConfigAssertion: true,
                testAssertionType: true,
            };
            checkMockedNetworkRequest(returnVal, checks);
        }
    );
});
