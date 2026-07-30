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
    AUTHENTICATION_RESULT,
    DEFAULT_OPENID_CONFIG_RESPONSE,
    TEST_CONFIG,
} from "../test_kit/StringConstants.js";
import { ClientTestUtils } from "./ClientTestUtils.js";
import { mockNetworkClient } from "../utils/MockNetworkClient.js";
import { CommonOnBehalfOfRequest } from "../../src/request/CommonOnBehalfOfRequest.js";
import { OnBehalfOfClient } from "../../src/client/OnBehalfOfClient.js";

// A simple NSP-style claims payload.
const NSP_CLAIMS = '{"xms_az_nwperimid":{"essential":true}}';
// A second, distinct claims value used to exercise separate-cache-entry behaviour.
const OTHER_CLAIMS = '{"xms_az_nwperimid":{"values":["eastus"]}}';
// A server-issued challenge (the cache-bypass signal).
const SERVER_CLAIMS = '{"access_token":{"nbf":{"essential":true}}}';

const baseRequest = (): CommonOnBehalfOfRequest => ({
    authority: TEST_CONFIG.validAuthority,
    correlationId: TEST_CONFIG.CORRELATION_ID,
    oboAssertion: "user_assertion_hash",
    scopes: [...TEST_CONFIG.DEFAULT_GRAPH_SCOPE],
});

describe("OnBehalfOfClient claimsFromClient tests", () => {
    let createTokenRequestBodySpy: jest.SpyInstance;
    let config: ClientConfiguration;

    beforeEach(async () => {
        createTokenRequestBodySpy = jest.spyOn(
            OnBehalfOfClient.prototype,
            <any>"createTokenRequestBody"
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

    describe("Body injection", () => {
        it("merges claimsFromClient into the claims body parameter", async () => {
            const client = new OnBehalfOfClient(config);

            await client.acquireToken({
                ...baseRequest(),
                claimsFromClient: NSP_CLAIMS,
            });

            const returnVal: string = await createTokenRequestBodySpy.mock
                .results[0].value;
            expect(returnVal).toContain(`${AADServerParamKeys.CLAIMS}=`);
            expect(returnVal).toContain("xms_az_nwperimid");
        });

        it("merges server claims and claimsFromClient into the claims body parameter", async () => {
            const client = new OnBehalfOfClient(config);

            await client.acquireToken({
                ...baseRequest(),
                claims: SERVER_CLAIMS,
                claimsFromClient: NSP_CLAIMS,
            });

            const returnVal: string = await createTokenRequestBodySpy.mock
                .results[0].value;
            expect(returnVal).toContain(`${AADServerParamKeys.CLAIMS}=`);
            // both the server-issued claim and the client claim must be present
            expect(returnVal).toContain("xms_az_nwperimid");
            expect(returnVal).toContain("nbf");
        });

        it("does not include the claims body parameter when claimsFromClient is not set", async () => {
            const client = new OnBehalfOfClient(config);

            await client.acquireToken(baseRequest());

            const returnVal: string = await createTokenRequestBodySpy.mock
                .results[0].value;
            expect(returnVal).not.toContain(`${AADServerParamKeys.CLAIMS}=`);
        });

        it("treats whitespace-only claimsFromClient as absent (no claims body parameter)", async () => {
            const client = new OnBehalfOfClient(config);

            await client.acquireToken({
                ...baseRequest(),
                claimsFromClient: "   ",
            });

            const returnVal: string = await createTokenRequestBodySpy.mock
                .results[0].value;
            expect(returnVal).not.toContain(`${AADServerParamKeys.CLAIMS}=`);
        });
    });

    describe("Cache isolation", () => {
        it("stores client_claims in additionalCacheKeyComponents", async () => {
            const client = new OnBehalfOfClient(config);

            await client.acquireToken({
                ...baseRequest(),
                claimsFromClient: NSP_CLAIMS,
            });

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

        it("does not store additionalCacheKeyComponents when claimsFromClient is not set", async () => {
            const client = new OnBehalfOfClient(config);

            await client.acquireToken(baseRequest());

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

        it("returns the token from cache on the second call with identical claimsFromClient", async () => {
            const client = new OnBehalfOfClient(config);

            const networkResult = (await client.acquireToken({
                ...baseRequest(),
                claimsFromClient: NSP_CLAIMS,
            })) as AuthenticationResult;
            expect(networkResult.fromCache).toBe(false);

            const cachedResult = (await client.acquireToken({
                ...baseRequest(),
                claimsFromClient: NSP_CLAIMS,
            })) as AuthenticationResult;
            expect(cachedResult.fromCache).toBe(true);
            expect(cachedResult.accessToken).toBe(networkResult.accessToken);
        });

        it("produces separate cache entries for different claimsFromClient values", async () => {
            const client = new OnBehalfOfClient(config);

            const result1 = (await client.acquireToken({
                ...baseRequest(),
                claimsFromClient: NSP_CLAIMS,
            })) as AuthenticationResult;
            expect(result1.fromCache).toBe(false);

            const result2 = (await client.acquireToken({
                ...baseRequest(),
                claimsFromClient: OTHER_CLAIMS,
            })) as AuthenticationResult;
            // different claims value -> separate cache entry -> network
            expect(result2.fromCache).toBe(false);
        });

        it("isolates the claimsFromClient cache from the non-claimsFromClient cache", async () => {
            const client = new OnBehalfOfClient(config);

            const result1 = (await client.acquireToken(
                baseRequest()
            )) as AuthenticationResult;
            expect(result1.fromCache).toBe(false);

            const result2 = (await client.acquireToken({
                ...baseRequest(),
                claimsFromClient: NSP_CLAIMS,
            })) as AuthenticationResult;
            // claimsFromClient request must not reuse the standard token
            expect(result2.fromCache).toBe(false);
        });

        it("treats whitespace-only claimsFromClient as absent for caching", async () => {
            const client = new OnBehalfOfClient(config);

            const result1 = (await client.acquireToken(
                baseRequest()
            )) as AuthenticationResult;
            expect(result1.fromCache).toBe(false);

            // whitespace claimsFromClient must reuse the non-claimsFromClient cache entry
            const result2 = (await client.acquireToken({
                ...baseRequest(),
                claimsFromClient: "   ",
            })) as AuthenticationResult;
            expect(result2.fromCache).toBe(true);
        });

        it("treats an empty-object claimsFromClient (`{}`) as absent for caching", async () => {
            const client = new OnBehalfOfClient(config);

            const result1 = (await client.acquireToken(
                baseRequest()
            )) as AuthenticationResult;
            expect(result1.fromCache).toBe(false);

            // `{}` contributes nothing to the request body, so it must reuse the
            // non-claimsFromClient cache entry rather than producing a separate one.
            const result2 = (await client.acquireToken({
                ...baseRequest(),
                claimsFromClient: "{}",
            })) as AuthenticationResult;
            expect(result2.fromCache).toBe(true);
        });

        it("does not bypass the cache (unlike server claims) on repeated claimsFromClient calls", async () => {
            const client = new OnBehalfOfClient(config);

            await client.acquireToken({
                ...baseRequest(),
                claimsFromClient: NSP_CLAIMS,
            });
            const result = (await client.acquireToken({
                ...baseRequest(),
                claimsFromClient: NSP_CLAIMS,
            })) as AuthenticationResult;
            expect(result.fromCache).toBe(true);
        });

        it("still bypasses the cache when server claims are also present", async () => {
            const client = new OnBehalfOfClient(config);

            // First call - populate the cache keyed on claimsFromClient
            const firstResult = (await client.acquireToken({
                ...baseRequest(),
                claimsFromClient: NSP_CLAIMS,
            })) as AuthenticationResult;
            expect(firstResult.fromCache).toBe(false);

            // Second call - server claims must force a network round-trip even though
            // a token with the matching client_claims is cached
            const result = (await client.acquireToken({
                ...baseRequest(),
                claims: SERVER_CLAIMS,
                claimsFromClient: NSP_CLAIMS,
            })) as AuthenticationResult;
            expect(result.fromCache).toBe(false);
        });
    });
});
