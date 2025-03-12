/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    AuthErrorCodes,
    BaseClient,
    ClientAuthErrorCodes,
    ClientConfiguration,
    CommonDeviceCodeRequest,
    Constants,
    GrantType,
    createAuthError,
    createClientAuthError,
} from "@azure/msal-common";
import {
    AUTHENTICATION_RESULT,
    AUTHORIZATION_PENDING_RESPONSE,
    DEFAULT_OPENID_CONFIG_RESPONSE,
    DEVICE_CODE_EXPIRED_RESPONSE,
    DEVICE_CODE_RESPONSE,
    TEST_CONFIG,
    CORS_SIMPLE_REQUEST_HEADERS,
    RANDOM_TEST_GUID,
    SERVER_UNEXPECTED_ERROR,
} from "../test_kit/StringConstants.js";
import {
    checkMockedNetworkRequest,
    ClientTestUtils,
} from "./ClientTestUtils.js";
import { DeviceCodeClient } from "../../src/index.js";
import { mockNetworkClient } from "../utils/MockNetworkClient.js";

describe("DeviceCodeClient unit tests", () => {
    let createTokenRequestBodySpy: jest.SpyInstance;
    let executePostRequestToDeviceCodeEndpointSpy: jest.SpyInstance;
    let executePostToTokenEndpointSpy: jest.SpyInstance;
    let queryStringSpy: jest.SpyInstance;
    let config: ClientConfiguration;
    beforeEach(async () => {
        createTokenRequestBodySpy = jest.spyOn(
            DeviceCodeClient.prototype,
            <any>"createTokenRequestBody"
        );

        executePostRequestToDeviceCodeEndpointSpy = jest
            .spyOn(
                DeviceCodeClient.prototype,
                <any>"executePostRequestToDeviceCodeEndpoint"
            )
            .mockReturnValue(DEVICE_CODE_RESPONSE);

        executePostToTokenEndpointSpy = jest.spyOn(
            DeviceCodeClient.prototype,
            <any>"executePostToTokenEndpoint"
        );

        queryStringSpy = jest.spyOn(
            DeviceCodeClient.prototype,
            <any>"createQueryString"
        );

        config = await ClientTestUtils.createTestClientConfiguration(
            undefined,
            mockNetworkClient(
                DEFAULT_OPENID_CONFIG_RESPONSE.body,
                AUTHENTICATION_RESULT
            )
        );
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("Constructor", () => {
        it("creates a DeviceCodeClient", async () => {
            const client = new DeviceCodeClient(config);
            expect(client).not.toBeNull();
            expect(client instanceof DeviceCodeClient).toBe(true);
            expect(client instanceof BaseClient).toBe(true);
        });
    });

    describe("Acquire a token", () => {
        it("Does not add headers that do not qualify for a simple request", async () => {
            const request: CommonDeviceCodeRequest = {
                authority: TEST_CONFIG.validAuthority,
                correlationId: "test-correlationId",
                scopes: [
                    ...TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                    ...TEST_CONFIG.DEFAULT_SCOPES,
                ],
                deviceCodeCallback: () => {},
            };

            const client = new DeviceCodeClient(config);
            await client.acquireToken(request);

            const lastNetworkCall = executePostToTokenEndpointSpy.mock.lastCall;
            const headers = lastNetworkCall[2]; // headers are the third parameter in executePostToTokenEndpoint

            const headerNames = Object.keys(headers);
            headerNames.forEach((name) => {
                expect(CORS_SIMPLE_REQUEST_HEADERS).toEqual(
                    expect.arrayContaining([name.toLowerCase()])
                );
            });
        }, 6000);

        it("Acquires a token successfully", async () => {
            let deviceCodeResponse = null;
            const request: CommonDeviceCodeRequest = {
                authority: TEST_CONFIG.validAuthority,
                correlationId: "test-correlationId",
                scopes: [
                    ...TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                    ...TEST_CONFIG.DEFAULT_SCOPES,
                ],
                deviceCodeCallback: (response) =>
                    (deviceCodeResponse = response),
            };

            const client = new DeviceCodeClient(config);
            await client.acquireToken(request);

            // Check that deviceCodeCallback was called with the right arguments
            expect(deviceCodeResponse).toEqual(DEVICE_CODE_RESPONSE);

            const queryString: string = await queryStringSpy.mock.results[0]
                .value;
            const queryStringChecks = {
                clientId: true,
                queryString: true,
            };
            // re-use checkMockedNetworkRequest to check the query string
            checkMockedNetworkRequest(queryString, queryStringChecks);

            const returnVal: string = await createTokenRequestBodySpy.mock
                .results[0].value;
            const returnValChecks = {
                clientId: true,
                grantType: GrantType.DEVICE_CODE_GRANT,
                clientSku: true,
                clientVersion: true,
                clientOs: true,
                clientCpu: true,
                appName: true,
                appVersion: true,
                msLibraryCapability: true,
                deviceCode: true,
                queryString: true,
            };
            checkMockedNetworkRequest(returnVal, returnValChecks);
        }, 6000);

        it("Adds extraQueryParameters to the /devicecode url", async () => {
            const deviceCodeRequest: CommonDeviceCodeRequest = {
                authority: TEST_CONFIG.validAuthority,
                correlationId: "test-correlationId",
                scopes: [
                    ...TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                    ...TEST_CONFIG.DEFAULT_SCOPES,
                ],
                extraQueryParameters: {
                    testParam1: "testValue1",
                    testParam2: "",
                    testParam3: "testValue3",
                },
                deviceCodeCallback: () => {},
            };

            const client = new DeviceCodeClient(config);
            await client.acquireToken(deviceCodeRequest);

            if (!executePostRequestToDeviceCodeEndpointSpy.mock.lastCall) {
                fail("executePostRequestToDeviceCodeEndpoint was not called");
            }
            const deviceCodeUrl: string =
                executePostRequestToDeviceCodeEndpointSpy.mock
                    .lastCall[0] as string;
            expect(
                deviceCodeUrl.includes(
                    "/devicecode?testParam1=testValue1&testParam3=testValue3"
                )
            ).toBeTruthy();
            expect(
                !deviceCodeUrl.includes("/devicecode?testParam2=")
            ).toBeTruthy();
        });

        it("Adds claims to request", async () => {
            let deviceCodeResponse = null;
            const request: CommonDeviceCodeRequest = {
                authority: Constants.DEFAULT_AUTHORITY,
                scopes: [
                    ...TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                    ...TEST_CONFIG.DEFAULT_SCOPES,
                ],
                claims: TEST_CONFIG.CLAIMS,
                deviceCodeCallback: (response) =>
                    (deviceCodeResponse = response),
                correlationId: RANDOM_TEST_GUID,
            };

            const client = new DeviceCodeClient(config);
            await client.acquireToken(request);

            // Check that deviceCodeCallback was called with the right arguments
            expect(deviceCodeResponse).toEqual(DEVICE_CODE_RESPONSE);

            const queryString: string = await queryStringSpy.mock.results[0]
                .value;
            const queryStringChecks = {
                clientId: true,
                queryString: true,
            };
            // re-use checkMockedNetworkRequest to check the query string
            checkMockedNetworkRequest(queryString, queryStringChecks);

            const returnVal: string = await createTokenRequestBodySpy.mock
                .results[0].value;
            const returnValChecks = {
                clientId: true,
                grantType: GrantType.DEVICE_CODE_GRANT,
                claims: true,
                clientSku: true,
                clientVersion: true,
                clientOs: true,
                clientCpu: true,
                appName: true,
                appVersion: true,
                msLibraryCapability: true,
                deviceCode: true,
                queryString: true,
            };
            checkMockedNetworkRequest(returnVal, returnValChecks);
        }, 6000);

        it("Does not add claims to request if empty object passed", async () => {
            let deviceCodeResponse = null;
            const request: CommonDeviceCodeRequest = {
                authority: Constants.DEFAULT_AUTHORITY,
                scopes: [
                    ...TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                    ...TEST_CONFIG.DEFAULT_SCOPES,
                ],
                claims: "{ }",
                deviceCodeCallback: (response) =>
                    (deviceCodeResponse = response),
                correlationId: RANDOM_TEST_GUID,
            };

            const client = new DeviceCodeClient(config);
            await client.acquireToken(request);

            // Check that deviceCodeCallback was called with the right arguments
            expect(deviceCodeResponse).toEqual(DEVICE_CODE_RESPONSE);

            const queryString: string = await queryStringSpy.mock.results[0]
                .value;
            const queryStringChecks = {
                clientId: true,
                queryString: true,
            };
            // re-use checkMockedNetworkRequest to check the query string
            checkMockedNetworkRequest(queryString, queryStringChecks);

            const returnVal: string = await createTokenRequestBodySpy.mock
                .results[0].value;
            const returnValChecks = {
                clientId: true,
                grantType: GrantType.DEVICE_CODE_GRANT,
                claims: false,
                clientSku: true,
                clientVersion: true,
                clientOs: true,
                clientCpu: true,
                appName: true,
                appVersion: true,
                msLibraryCapability: true,
                deviceCode: true,
                queryString: true,
            };
            checkMockedNetworkRequest(returnVal, returnValChecks);
        }, 6000);

        it("Acquires a token successfully after authorization_pending error", async () => {
            executePostToTokenEndpointSpy.mockReturnValueOnce(
                AUTHORIZATION_PENDING_RESPONSE
            );

            const request: CommonDeviceCodeRequest = {
                authority: TEST_CONFIG.validAuthority,
                correlationId: "test-correlationId",
                scopes: [
                    ...TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                    ...TEST_CONFIG.DEFAULT_SCOPES,
                ],
                deviceCodeCallback: () => {},
            };

            const client = new DeviceCodeClient(config);
            await client.acquireToken(request);

            const firstCallReturnVal = await executePostToTokenEndpointSpy.mock
                .results[0].value;
            expect(firstCallReturnVal).toBe(AUTHORIZATION_PENDING_RESPONSE);

            const secondCallReturnVal = await executePostToTokenEndpointSpy.mock
                .results[1].value;
            expect(secondCallReturnVal).toBe(AUTHENTICATION_RESULT);
        }, 12000);
    });

    describe("Device code exceptions", () => {
        it("Throw device code flow cancelled exception if DeviceCodeRequest.cancel=true", async () => {
            const request: CommonDeviceCodeRequest = {
                authority: TEST_CONFIG.validAuthority,
                correlationId: "test-correlationId",
                scopes: [
                    ...TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                    ...TEST_CONFIG.DEFAULT_SCOPES,
                ],
                deviceCodeCallback: () => {},
            };

            const client = new DeviceCodeClient(config);
            request.cancel = true;
            await expect(client.acquireToken(request)).rejects.toMatchObject(
                createClientAuthError(
                    ClientAuthErrorCodes.deviceCodePollingCancelled
                )
            );
        }, 6000);

        it("Throw device code expired exception if device code is expired", async () => {
            executePostRequestToDeviceCodeEndpointSpy.mockReturnValueOnce(
                DEVICE_CODE_EXPIRED_RESPONSE
            );

            executePostToTokenEndpointSpy.mockReturnValueOnce(
                AUTHORIZATION_PENDING_RESPONSE
            );

            const request: CommonDeviceCodeRequest = {
                authority: TEST_CONFIG.validAuthority,
                correlationId: "test-correlationId",
                scopes: [
                    ...TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                    ...TEST_CONFIG.DEFAULT_SCOPES,
                ],
                deviceCodeCallback: () => {},
            };

            const client = new DeviceCodeClient(config);
            await expect(client.acquireToken(request)).rejects.toMatchObject(
                createClientAuthError(ClientAuthErrorCodes.deviceCodeExpired)
            );
        }, 6000);

        it("Throw device code expired exception if the timeout expires", async () => {
            executePostToTokenEndpointSpy.mockReturnValueOnce(
                AUTHORIZATION_PENDING_RESPONSE
            );

            const request: CommonDeviceCodeRequest = {
                authority: TEST_CONFIG.validAuthority,
                correlationId: "test-correlationId",
                scopes: [
                    ...TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                    ...TEST_CONFIG.DEFAULT_SCOPES,
                ],
                deviceCodeCallback: () => {},
                timeout: DEVICE_CODE_RESPONSE.interval - 1, // Setting a timeout equal to the interval polling time minus one to allow for one call to the token endpoint
            };

            const client = new DeviceCodeClient(config);
            await expect(client.acquireToken(request)).rejects.toMatchObject(
                createClientAuthError(ClientAuthErrorCodes.userTimeoutReached)
            );

            expect(executePostToTokenEndpointSpy.mock.calls.length).toBe(1);
        }, 15000);

        it("Throws if server throws an unexpected error", async () => {
            executePostToTokenEndpointSpy.mockReturnValueOnce(
                SERVER_UNEXPECTED_ERROR
            );

            const request: CommonDeviceCodeRequest = {
                authority: TEST_CONFIG.validAuthority,
                correlationId: "test-correlationId",
                scopes: [
                    ...TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                    ...TEST_CONFIG.DEFAULT_SCOPES,
                ],
                deviceCodeCallback: () => {},
            };

            const client = new DeviceCodeClient(config);
            await expect(client.acquireToken(request)).rejects.toMatchObject(
                createAuthError(
                    AuthErrorCodes.postRequestFailed,
                    "Service Unavailable"
                )
            );
        }, 15000);
    });
});
