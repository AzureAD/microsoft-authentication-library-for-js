/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    AuthenticationResult,
    ClientConfiguration,
    AADServerParamKeys,
} from "@azure/msal-common";
import {
    CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT,
    DEFAULT_OPENID_CONFIG_RESPONSE,
    TEST_CONFIG,
} from "../test_kit/StringConstants.js";
import { ClientTestUtils } from "./ClientTestUtils.js";
import { mockNetworkClient } from "../utils/MockNetworkClient.js";
import { CommonClientCredentialRequest } from "../../src/request/CommonClientCredentialRequest.js";
import { ClientCredentialClient } from "../../src/client/ClientCredentialClient.js";

// A simple client-originated claims payload. MSAL does not restrict which claim keys are
// sent - any client-originated claims are merged into the request and forwarded as-is.
const NSP_CLAIMS = '{"xms_az_nwperimid":{"essential":true}}';
// A second, distinct claims value used to exercise separate-cache-entry behaviour.
const OTHER_CLAIMS = '{"xms_az_nwperimid":{"values":["eastus"]}}';
// A server-issued challenge (the cache-bypass signal).
const SERVER_CLAIMS = '{"access_token":{"nbf":{"essential":true}}}';

describe("ClientCredentialClient clientClaims tests", () => {
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
        it("merges clientClaims into the claims body parameter", async () => {
            const client = new ClientCredentialClient(config);

            const request: CommonClientCredentialRequest = {
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                clientClaims: NSP_CLAIMS,
            };

            await client.acquireToken(request);

            const returnVal: string = await createTokenRequestBodySpy.mock
                .results[0].value;
            expect(returnVal).toContain(`${AADServerParamKeys.CLAIMS}=`);
            expect(returnVal).toContain("xms_az_nwperimid");
        });

        it("merges server claims and clientClaims into the claims body parameter", async () => {
            const client = new ClientCredentialClient(config);

            const request: CommonClientCredentialRequest = {
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                claims: SERVER_CLAIMS,
                clientClaims: NSP_CLAIMS,
            };

            await client.acquireToken(request);

            const returnVal: string = await createTokenRequestBodySpy.mock
                .results[0].value;
            expect(returnVal).toContain(`${AADServerParamKeys.CLAIMS}=`);
            // both the server-issued claim and the client claim must be present
            expect(returnVal).toContain("xms_az_nwperimid");
            expect(returnVal).toContain("nbf");
        });

        it("does not include the claims body parameter when clientClaims is not set", async () => {
            const client = new ClientCredentialClient(config);

            const request: CommonClientCredentialRequest = {
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
            };

            await client.acquireToken(request);

            const returnVal: string = await createTokenRequestBodySpy.mock
                .results[0].value;
            expect(returnVal).not.toContain(`${AADServerParamKeys.CLAIMS}=`);
        });
    });

    describe("Cache isolation", () => {
        it("stores client_claims in additionalCacheKeyComponents", async () => {
            const client = new ClientCredentialClient(config);

            const request: CommonClientCredentialRequest = {
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                clientClaims: NSP_CLAIMS,
            };

            await client.acquireToken(request);

            const tokenKeys = config.storageInterface!.getTokenKeys();
            const accessTokenKeys = tokenKeys.accessToken;
            expect(accessTokenKeys.length).toBeGreaterThan(0);
            const cachedToken =
                config.storageInterface!.getAccessTokenCredential(
                    accessTokenKeys[0],
                    TEST_CONFIG.CORRELATION_ID
                );
            expect(cachedToken).not.toBeNull();
            expect(cachedToken!.additionalCacheKeyComponents).toEqual({
                client_claims: NSP_CLAIMS,
            });
        });

        it("does not store additionalCacheKeyComponents when clientClaims is not set", async () => {
            const client = new ClientCredentialClient(config);

            const request: CommonClientCredentialRequest = {
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
            };

            await client.acquireToken(request);

            const tokenKeys = config.storageInterface!.getTokenKeys();
            const accessTokenKeys = tokenKeys.accessToken;
            expect(accessTokenKeys.length).toBeGreaterThan(0);
            const cachedToken =
                config.storageInterface!.getAccessTokenCredential(
                    accessTokenKeys[0],
                    TEST_CONFIG.CORRELATION_ID
                );
            expect(cachedToken).not.toBeNull();
            expect(cachedToken!.additionalCacheKeyComponents).toBeUndefined();
        });

        it("treats whitespace-only clientClaims as absent (no additionalCacheKeyComponents)", async () => {
            const client = new ClientCredentialClient(config);

            const request: CommonClientCredentialRequest = {
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                clientClaims: "   ",
            };

            await client.acquireToken(request);

            const tokenKeys = config.storageInterface!.getTokenKeys();
            const accessTokenKeys = tokenKeys.accessToken;
            expect(accessTokenKeys.length).toBeGreaterThan(0);
            const cachedToken =
                config.storageInterface!.getAccessTokenCredential(
                    accessTokenKeys[0],
                    TEST_CONFIG.CORRELATION_ID
                );
            expect(cachedToken).not.toBeNull();
            expect(cachedToken!.additionalCacheKeyComponents).toBeUndefined();
        });

        it("treats an empty-object clientClaims (`{}`) as absent (no additionalCacheKeyComponents)", async () => {
            const client = new ClientCredentialClient(config);

            const request: CommonClientCredentialRequest = {
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                clientClaims: "{}",
            };

            await client.acquireToken(request);

            const tokenKeys = config.storageInterface!.getTokenKeys();
            const accessTokenKeys = tokenKeys.accessToken;
            expect(accessTokenKeys.length).toBeGreaterThan(0);
            const cachedToken =
                config.storageInterface!.getAccessTokenCredential(
                    accessTokenKeys[0],
                    TEST_CONFIG.CORRELATION_ID
                );
            expect(cachedToken).not.toBeNull();
            // `{}` contributes nothing to the request body, so it must not fragment
            // the cache from an omitted clientClaims.
            expect(cachedToken!.additionalCacheKeyComponents).toBeUndefined();
        });

        it("returns from network (not cache) on the first call", async () => {
            const client = new ClientCredentialClient(config);

            const request: CommonClientCredentialRequest = {
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                clientClaims: NSP_CLAIMS,
            };

            const result = (await client.acquireToken(
                request
            )) as AuthenticationResult;
            expect(result).not.toBeNull();
            expect(result.fromCache).toBe(false);
        });

        it("returns the token from cache on the second call with identical clientClaims", async () => {
            const client = new ClientCredentialClient(config);

            const request: CommonClientCredentialRequest = {
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                clientClaims: NSP_CLAIMS,
            };

            const networkResult = (await client.acquireToken(
                request
            )) as AuthenticationResult;
            expect(networkResult.fromCache).toBe(false);

            const cachedResult = (await client.acquireToken(
                request
            )) as AuthenticationResult;
            expect(cachedResult.fromCache).toBe(true);
            expect(cachedResult.accessToken).toBe(networkResult.accessToken);
        });

        it("produces separate cache entries for different clientClaims values", async () => {
            const client = new ClientCredentialClient(config);

            const result1 = (await client.acquireToken({
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                clientClaims: NSP_CLAIMS,
            })) as AuthenticationResult;
            expect(result1.fromCache).toBe(false);

            const result2 = (await client.acquireToken({
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                clientClaims: OTHER_CLAIMS,
            })) as AuthenticationResult;
            // different claims value -> separate cache entry -> network
            expect(result2.fromCache).toBe(false);
        });

        it("isolates the clientClaims cache from the non-clientClaims cache", async () => {
            const client = new ClientCredentialClient(config);

            const result1 = (await client.acquireToken({
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
            })) as AuthenticationResult;
            expect(result1.fromCache).toBe(false);

            const result2 = (await client.acquireToken({
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                clientClaims: NSP_CLAIMS,
            })) as AuthenticationResult;
            // clientClaims request must not reuse the standard token
            expect(result2.fromCache).toBe(false);
        });

        it("does not bypass the cache (unlike server claims) on repeated clientClaims calls", async () => {
            const client = new ClientCredentialClient(config);

            const request: CommonClientCredentialRequest = {
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                clientClaims: NSP_CLAIMS,
            };

            await client.acquireToken(request);
            const result = (await client.acquireToken(
                request
            )) as AuthenticationResult;
            expect(result.fromCache).toBe(true);
        });

        it("still bypasses the cache when server claims are also present", async () => {
            const client = new ClientCredentialClient(config);

            // First call - populate the cache keyed on clientClaims
            const firstResult = (await client.acquireToken({
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                clientClaims: NSP_CLAIMS,
            })) as AuthenticationResult;
            expect(firstResult.fromCache).toBe(false);

            // Second call - server claims must force a network round-trip even though
            // a token with the matching client_claims is cached
            const result = (await client.acquireToken({
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                claims: SERVER_CLAIMS,
                clientClaims: NSP_CLAIMS,
            })) as AuthenticationResult;
            expect(result.fromCache).toBe(false);
        });
    });
});
