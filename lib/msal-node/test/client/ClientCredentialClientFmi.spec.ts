/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    AuthenticationResult,
    ClientConfiguration,
    Constants,
    AADServerParamKeys,
    createClientAuthError,
} from "@azure/msal-common";
import {
    CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT,
    DEFAULT_OPENID_CONFIG_RESPONSE,
    TEST_CONFIG,
} from "../test_kit/StringConstants.js";
import { ClientTestUtils, mockCrypto } from "./ClientTestUtils.js";
import { mockNetworkClient } from "../utils/MockNetworkClient.js";
import { CommonClientCredentialRequest } from "../../src/request/CommonClientCredentialRequest.js";
import { ClientCredentialClient } from "../../src/client/ClientCredentialClient.js";
import * as NodeClientAuthErrorCodes from "../../src/error/ClientAuthErrorCodes.js";

describe("ClientCredentialClient FMI tests", () => {
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

    describe("Body injection", () => {
        it("includes fmi_path in token request body when fmiPath is set", async () => {
            const client = new ClientCredentialClient(config);
            const fmiPathValue = "test-agent-app-id";

            const request: CommonClientCredentialRequest = {
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                fmiPath: fmiPathValue,
            };

            await client.acquireToken(request);

            const returnVal: string = await createTokenRequestBodySpy.mock
                .results[0].value;
            expect(returnVal).toContain(
                `${AADServerParamKeys.FMI_PATH}=${fmiPathValue}`
            );
        });

        it("does not include fmi_path in body when fmiPath is not set", async () => {
            const client = new ClientCredentialClient(config);

            const request: CommonClientCredentialRequest = {
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
            };

            await client.acquireToken(request);

            const returnVal: string = await createTokenRequestBodySpy.mock
                .results[0].value;
            expect(returnVal).not.toContain("fmi_path");
        });

        it("uses grant_type=client_credentials even with fmiPath set", async () => {
            const client = new ClientCredentialClient(config);

            const request: CommonClientCredentialRequest = {
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                fmiPath: "test-agent-app-id",
            };

            await client.acquireToken(request);

            const returnVal: string = await createTokenRequestBodySpy.mock
                .results[0].value;
            expect(returnVal).toContain(
                `${AADServerParamKeys.GRANT_TYPE}=${Constants.GrantType.CLIENT_CREDENTIALS_GRANT}`
            );
        });
    });

    describe("Cache isolation", () => {
        it("computes extCacheKeyHash for FMI cache isolation", async () => {
            const hashStringSpy = jest.spyOn(mockCrypto, "hashString");
            const client = new ClientCredentialClient(config);
            const fmiPathValue = "test-agent-app-id";

            const request: CommonClientCredentialRequest = {
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                fmiPath: fmiPathValue,
            };

            await client.acquireToken(request);

            // hashString should be called with "fmi_path" + fmiPathValue for cache key isolation
            expect(hashStringSpy).toHaveBeenCalledWith(
                "fmi_path" + fmiPathValue
            );
        });

        it("does not compute extCacheKeyHash when fmiPath is not set", async () => {
            const hashStringSpy = jest.spyOn(mockCrypto, "hashString");
            const client = new ClientCredentialClient(config);

            const request: CommonClientCredentialRequest = {
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
            };

            await client.acquireToken(request);

            // hashString should not be called for non-FMI requests with fmi_path prefix
            const fmiHashCalls = hashStringSpy.mock.calls.filter(
                (call: unknown[]) =>
                    typeof call[0] === "string" &&
                    (call[0] as string).startsWith("fmi_path")
            );
            expect(fmiHashCalls).toHaveLength(0);
        });

        it("caches FMI tokens and returns from network (not cache) on first call", async () => {
            const client = new ClientCredentialClient(config);

            const request: CommonClientCredentialRequest = {
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                fmiPath: "test-agent-app-id",
            };

            const result = (await client.acquireToken(
                request
            )) as AuthenticationResult;
            expect(result).not.toBeNull();
            expect(result.accessToken).toEqual(
                CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT.body.access_token
            );
            expect(result.fromCache).toBe(false);
        });

        it("returns FMI token from cache on second call with same fmiPath", async () => {
            const client = new ClientCredentialClient(config);

            const request: CommonClientCredentialRequest = {
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                fmiPath: "test-agent-app-id",
            };

            // First call — network
            const networkResult = (await client.acquireToken(
                request
            )) as AuthenticationResult;
            expect(networkResult.fromCache).toBe(false);

            // Second call — should return from cache
            const cachedResult = (await client.acquireToken(
                request
            )) as AuthenticationResult;
            expect(cachedResult.fromCache).toBe(true);
            expect(cachedResult.accessToken).toBe(networkResult.accessToken);
        });

        it("isolates FMI cache from non-FMI cache", async () => {
            const client = new ClientCredentialClient(config);

            // First: acquire a standard (non-FMI) token
            const standardRequest: CommonClientCredentialRequest = {
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
            };

            const result1 = (await client.acquireToken(
                standardRequest
            )) as AuthenticationResult;
            expect(result1).not.toBeNull();
            expect(result1.fromCache).toBe(false);

            // Second call with same scopes but different fmiPath — should NOT return cached standard token
            const fmiRequest: CommonClientCredentialRequest = {
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                fmiPath: "test-agent-app-id",
            };

            const result2 = (await client.acquireToken(
                fmiRequest
            )) as AuthenticationResult;
            expect(result2).not.toBeNull();
            // FMI request goes to network since no atext-type token is cached
            expect(result2.fromCache).toBe(false);
        });
    });

    describe("Assertion callback context", () => {
        it("passes fmiPath through assertion callback context", async () => {
            const assertionCallback = jest
                .fn()
                .mockResolvedValue("test-assertion");
            const configWithAssertion =
                await ClientTestUtils.createTestClientConfiguration(
                    undefined,
                    mockNetworkClient(
                        DEFAULT_OPENID_CONFIG_RESPONSE.body,
                        CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT
                    )
                );
            configWithAssertion.clientCredentials = {
                clientAssertion: {
                    assertion: assertionCallback,
                    assertionType:
                        "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
                },
            };

            const client = new ClientCredentialClient(configWithAssertion);
            const fmiPathValue = "test-agent-app-id";

            const request: CommonClientCredentialRequest = {
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                fmiPath: fmiPathValue,
            };

            await client.acquireToken(request);

            expect(assertionCallback).toHaveBeenCalled();
            const callArgs = assertionCallback.mock.calls[0][0];
            expect(callArgs).toBeDefined();
            expect(callArgs.fmiPath).toEqual(fmiPathValue);
        });

        it("passes tokenEndpoint to assertion callback", async () => {
            const assertionCallback = jest
                .fn()
                .mockResolvedValue("test-assertion");
            const configWithAssertion =
                await ClientTestUtils.createTestClientConfiguration(
                    undefined,
                    mockNetworkClient(
                        DEFAULT_OPENID_CONFIG_RESPONSE.body,
                        CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT
                    )
                );
            configWithAssertion.clientCredentials = {
                clientAssertion: {
                    assertion: assertionCallback,
                    assertionType:
                        "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
                },
            };

            const client = new ClientCredentialClient(configWithAssertion);

            const request: CommonClientCredentialRequest = {
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
            };

            await client.acquireToken(request);

            expect(assertionCallback).toHaveBeenCalled();
            const callArgs = assertionCallback.mock.calls[0][0];
            expect(callArgs).toBeDefined();
            // tokenEndpoint should be set (not undefined or resourceRequestUri)
            expect(callArgs.tokenEndpoint).toBeDefined();
            expect(typeof callArgs.tokenEndpoint).toBe("string");
            expect(callArgs.tokenEndpoint.length).toBeGreaterThan(0);
        });

        it("string assertions still work without fmiPath (backward compatibility)", async () => {
            const configWithStringAssertion =
                await ClientTestUtils.createTestClientConfiguration(
                    undefined,
                    mockNetworkClient(
                        DEFAULT_OPENID_CONFIG_RESPONSE.body,
                        CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT
                    )
                );
            configWithStringAssertion.clientCredentials = {
                clientAssertion: {
                    assertion: "static-string-assertion",
                    assertionType:
                        "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
                },
            };

            const client = new ClientCredentialClient(
                configWithStringAssertion
            );

            const request: CommonClientCredentialRequest = {
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
            };

            const result = (await client.acquireToken(
                request
            )) as AuthenticationResult;
            expect(result).not.toBeNull();
            expect(result.accessToken).toEqual(
                CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT.body.access_token
            );

            const returnVal: string = await createTokenRequestBodySpy.mock
                .results[0].value;
            expect(returnVal).toContain(
                `${AADServerParamKeys.CLIENT_ASSERTION}=static-string-assertion`
            );
        });
    });

    describe("Auth scheme validation", () => {
        it("rejects FMI request with PoP auth scheme", async () => {
            const client = new ClientCredentialClient(config);
            const request: CommonClientCredentialRequest = {
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                fmiPath: "test-agent-app-id",
                authenticationScheme: Constants.AuthenticationScheme
                    .POP as "pop",
            };
            await expect(client.acquireToken(request)).rejects.toMatchObject(
                createClientAuthError(
                    NodeClientAuthErrorCodes.fmiWithNonBearerScheme
                )
            );
        });

        it("rejects FMI request with SSH auth scheme", async () => {
            const client = new ClientCredentialClient(config);
            const request: CommonClientCredentialRequest = {
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                fmiPath: "test-agent-app-id",
                authenticationScheme: Constants.AuthenticationScheme
                    .SSH as "ssh-cert",
            };
            await expect(client.acquireToken(request)).rejects.toMatchObject(
                createClientAuthError(
                    NodeClientAuthErrorCodes.fmiWithNonBearerScheme
                )
            );
        });

        it("allows FMI request with Bearer auth scheme", async () => {
            const client = new ClientCredentialClient(config);
            const request: CommonClientCredentialRequest = {
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                fmiPath: "test-agent-app-id",
                authenticationScheme: Constants.AuthenticationScheme.BEARER,
            };
            const result = (await client.acquireToken(
                request
            )) as AuthenticationResult;
            expect(result).not.toBeNull();
            expect(result.accessToken).toBeDefined();
        });
    });
});
