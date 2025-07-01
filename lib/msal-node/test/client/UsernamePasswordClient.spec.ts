/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    AuthenticationResult,
    BaseClient,
    ClientConfiguration,
    CommonUsernamePasswordRequest,
    Constants,
    GrantType,
} from "@azure/msal-common";
import {
    AUTHENTICATION_RESULT_DEFAULT_SCOPES,
    DEFAULT_OPENID_CONFIG_RESPONSE,
    MOCK_PASSWORD,
    MOCK_USERNAME,
    RANDOM_TEST_GUID,
    TEST_CONFIG,
} from "../test_kit/StringConstants.js";
import { UsernamePasswordClient } from "../../src/index.js";
import {
    ClientTestUtils,
    checkMockedNetworkRequest,
    getClientAssertionCallback,
} from "./ClientTestUtils.js";
import { mockNetworkClient } from "../utils/MockNetworkClient.js";

describe("Username Password unit tests", () => {
    let createTokenRequestBodySpy: jest.SpyInstance;
    let config: ClientConfiguration;
    beforeEach(async () => {
        createTokenRequestBodySpy = jest.spyOn(
            UsernamePasswordClient.prototype,
            <any>"createTokenRequestBody"
        );

        config = await ClientTestUtils.createTestClientConfiguration(
            undefined,
            mockNetworkClient(
                DEFAULT_OPENID_CONFIG_RESPONSE.body,
                AUTHENTICATION_RESULT_DEFAULT_SCOPES
            )
        );
        if (config.systemOptions) {
            config.systemOptions.preventCorsPreflight = true;
        }
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("Constructor", () => {
        it("creates a UsernamePasswordClient", async () => {
            const client = new UsernamePasswordClient(config);
            expect(client).not.toBeNull();
            expect(client instanceof UsernamePasswordClient).toBe(true);
            expect(client instanceof BaseClient).toBe(true);
        });
    });

    it("acquires a token", async () => {
        const client = new UsernamePasswordClient(config);

        const usernamePasswordRequest: CommonUsernamePasswordRequest = {
            authority: Constants.DEFAULT_AUTHORITY,
            scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
            username: MOCK_USERNAME,
            password: MOCK_PASSWORD,
            claims: TEST_CONFIG.CLAIMS,
            correlationId: RANDOM_TEST_GUID,
        };

        const authResult = (await client.acquireToken(
            usernamePasswordRequest
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
            grantType: GrantType.RESOURCE_OWNER_PASSWORD_GRANT,
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
            UsernamePasswordClient.prototype,
            <any>"executePostToTokenEndpoint"
        );
        // no implementation has been mocked, the acquireToken call will fail

        const fakeConfig: ClientConfiguration =
            await ClientTestUtils.createTestClientConfiguration();
        const client: UsernamePasswordClient = new UsernamePasswordClient(
            fakeConfig
        );

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
            client.acquireToken(usernamePasswordRequest)
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

    it("properly encodes special characters in emails (usernames)", async () => {
        const client = new UsernamePasswordClient(config);

        const usernamePasswordRequest: CommonUsernamePasswordRequest = {
            authority: Constants.DEFAULT_AUTHORITY,
            scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
            username: `${MOCK_USERNAME}&+`,
            password: MOCK_PASSWORD,
            claims: TEST_CONFIG.CLAIMS,
            correlationId: RANDOM_TEST_GUID,
        };

        const authResult = (await client.acquireToken(
            usernamePasswordRequest
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
            grantType: GrantType.RESOURCE_OWNER_PASSWORD_GRANT,
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
        const client = new UsernamePasswordClient(config);

        const usernamePasswordRequest: CommonUsernamePasswordRequest = {
            authority: Constants.DEFAULT_AUTHORITY,
            scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
            username: MOCK_USERNAME,
            password: `${MOCK_PASSWORD}&+`,
            claims: TEST_CONFIG.CLAIMS,
            correlationId: RANDOM_TEST_GUID,
        };

        const authResult = (await client.acquireToken(
            usernamePasswordRequest
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
            grantType: GrantType.RESOURCE_OWNER_PASSWORD_GRANT,
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
        const client = new UsernamePasswordClient(config);

        const usernamePasswordRequest: CommonUsernamePasswordRequest = {
            authority: Constants.DEFAULT_AUTHORITY,
            scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
            username: MOCK_USERNAME,
            password: MOCK_PASSWORD,
            correlationId: RANDOM_TEST_GUID,
            claims: "{}",
        };

        const authResult = (await client.acquireToken(
            usernamePasswordRequest
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
            grantType: GrantType.RESOURCE_OWNER_PASSWORD_GRANT,
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
        async (clientAssertion) => {
            config.clientCredentials = {
                ...config.clientCredentials,
                clientAssertion: {
                    assertion: clientAssertion,
                    assertionType: TEST_CONFIG.TEST_ASSERTION_TYPE,
                },
            };
            const client: UsernamePasswordClient = new UsernamePasswordClient(
                config
            );

            const usernamePasswordRequest: CommonUsernamePasswordRequest = {
                authority: Constants.DEFAULT_AUTHORITY,
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                username: MOCK_USERNAME,
                password: MOCK_PASSWORD,
                correlationId: RANDOM_TEST_GUID,
            };

            const authResult = (await client.acquireToken(
                usernamePasswordRequest
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
                grantType: GrantType.RESOURCE_OWNER_PASSWORD_GRANT,
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
