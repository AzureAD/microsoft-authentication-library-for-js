/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    AuthenticationResult,
    ClientConfiguration,
    Constants,
    AADServerParamKeys,
    CredentialEntity,
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
import { generateCredentialKey } from "../../src/cache/CacheHelpers.js";
import { createHash } from "crypto";

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
        it("stores additionalCacheKeyComponents for FMI cache isolation", async () => {
            const client = new ClientCredentialClient(config);
            const fmiPathValue = "test-agent-app-id";

            const request: CommonClientCredentialRequest = {
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                fmiPath: fmiPathValue,
            };

            await client.acquireToken(request);

            // Verify the cached token has additionalCacheKeyComponents with the raw fmi_path
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
                fmi_path: fmiPathValue,
            });
        });

        it("does not store additionalCacheKeyComponents when fmiPath is not set", async () => {
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
            // FMI request goes to network since no token with matching additionalCacheKeyComponents is cached
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

    describe("Cache key collision resistance", () => {
        /**
         * These tests verify that credential cache keys remain unique across
         * all combinations of auth scheme and additionalCacheKeyComponents.
         * This ensures no cache collisions when FMI is combined with PoP/SSH
         * or when multiple FMI paths are used on the same CCA instance.
         */

        function makeEntity(
            overrides: Partial<CredentialEntity>
        ): CredentialEntity {
            return {
                homeAccountId: "",
                environment: "login.microsoftonline.com",
                credentialType: Constants.CredentialType.ACCESS_TOKEN,
                clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                realm: TEST_CONFIG.TENANT,
                target: TEST_CONFIG.DEFAULT_GRAPH_SCOPE.join(" "),
                secret: "fake-token",
                ...overrides,
            } as CredentialEntity;
        }

        it("all four Bearer/PoP × FMI/no-FMI combinations produce unique cache keys", () => {
            const fmiComponents = { fmi_path: "agent-app-id" };

            const bearerPlain = makeEntity({});
            const bearerFmi = makeEntity({
                additionalCacheKeyComponents: fmiComponents,
            });
            const popPlain = makeEntity({
                credentialType:
                    Constants.CredentialType.ACCESS_TOKEN_WITH_AUTH_SCHEME,
                tokenType: Constants.AuthenticationScheme.POP,
            });
            const popFmi = makeEntity({
                credentialType:
                    Constants.CredentialType.ACCESS_TOKEN_WITH_AUTH_SCHEME,
                tokenType: Constants.AuthenticationScheme.POP,
                additionalCacheKeyComponents: fmiComponents,
            });

            const keys = [
                generateCredentialKey(bearerPlain),
                generateCredentialKey(bearerFmi),
                generateCredentialKey(popPlain),
                generateCredentialKey(popFmi),
            ];

            // All four keys must be distinct
            const uniqueKeys = new Set(keys);
            expect(uniqueKeys.size).toBe(4);
        });

        it("different FMI paths produce different cache keys for the same auth scheme", () => {
            const entity1 = makeEntity({
                additionalCacheKeyComponents: { fmi_path: "agent-a" },
            });
            const entity2 = makeEntity({
                additionalCacheKeyComponents: { fmi_path: "agent-b" },
            });

            const key1 = generateCredentialKey(entity1);
            const key2 = generateCredentialKey(entity2);

            expect(key1).not.toBe(key2);
        });

        it("same FMI path with different auth schemes produces different cache keys", () => {
            const fmiComponents = { fmi_path: "same-agent" };

            const bearerFmi = makeEntity({
                additionalCacheKeyComponents: fmiComponents,
            });
            const popFmi = makeEntity({
                credentialType:
                    Constants.CredentialType.ACCESS_TOKEN_WITH_AUTH_SCHEME,
                tokenType: Constants.AuthenticationScheme.POP,
                additionalCacheKeyComponents: fmiComponents,
            });
            const sshFmi = makeEntity({
                credentialType:
                    Constants.CredentialType.ACCESS_TOKEN_WITH_AUTH_SCHEME,
                tokenType: Constants.AuthenticationScheme.SSH,
                additionalCacheKeyComponents: fmiComponents,
            });

            const keys = [
                generateCredentialKey(bearerFmi),
                generateCredentialKey(popFmi),
                generateCredentialKey(sshFmi),
            ];

            const uniqueKeys = new Set(keys);
            expect(uniqueKeys.size).toBe(3);
        });

        it("multiple additional components produce unique keys vs single component", () => {
            const singleComponent = makeEntity({
                additionalCacheKeyComponents: { fmi_path: "agent-a" },
            });
            const multiComponent = makeEntity({
                additionalCacheKeyComponents: {
                    fmi_path: "agent-a",
                    another_key: "another_value",
                },
            });

            const key1 = generateCredentialKey(singleComponent);
            const key2 = generateCredentialKey(multiComponent);

            expect(key1).not.toBe(key2);
        });

        it("hash is stable and deterministic for the same components", () => {
            const entity1 = makeEntity({
                additionalCacheKeyComponents: { fmi_path: "agent-a" },
            });
            const entity2 = makeEntity({
                additionalCacheKeyComponents: { fmi_path: "agent-a" },
            });

            expect(generateCredentialKey(entity1)).toBe(
                generateCredentialKey(entity2)
            );
        });

        it("component key order does not affect the hash (sorted internally)", () => {
            const entity1 = makeEntity({
                additionalCacheKeyComponents: {
                    alpha: "1",
                    beta: "2",
                },
            });
            const entity2 = makeEntity({
                additionalCacheKeyComponents: {
                    beta: "2",
                    alpha: "1",
                },
            });

            expect(generateCredentialKey(entity1)).toBe(
                generateCredentialKey(entity2)
            );
        });

        it("credential key contains scheme and hash as trailing components", () => {
            const entity = makeEntity({
                credentialType:
                    Constants.CredentialType.ACCESS_TOKEN_WITH_AUTH_SCHEME,
                tokenType: Constants.AuthenticationScheme.POP,
                additionalCacheKeyComponents: { fmi_path: "agent-a" },
            });

            const key = generateCredentialKey(entity);

            // Key should end with -pop-<43-char-hash> (scheme then hash)
            const popIndex = key.lastIndexOf("-pop-");
            expect(popIndex).toBeGreaterThan(0);

            // Everything after "-pop-" should be the 43-char Base64URL hash
            const hashPart = key.substring(popIndex + 5); // skip "-pop-"
            expect(hashPart.length).toBe(43);
            // Base64URL charset: [A-Za-z0-9_-], no padding
            expect(hashPart).toMatch(/^[A-Za-z0-9_-]+$/);

            // Compare to a Bearer+FMI key — should have the hash but no "pop" segment
            const bearerFmiEntity = makeEntity({
                additionalCacheKeyComponents: { fmi_path: "agent-a" },
            });
            const bearerKey = generateCredentialKey(bearerFmiEntity);

            // Bearer key should NOT contain "-pop-"
            expect(bearerKey).not.toContain("-pop-");
            // But should end with the same hash (same components)
            expect(bearerKey).toMatch(/[a-z0-9_-]{43}$/);
        });
    });

    describe("Additional cache key hash injectivity (length-prefix encoding)", () => {
        /**
         * These tests exercise `computeAdditionalCacheKeyHash` (indirectly, via the
         * trailing 43-char Base64URL segment of the credential key). The hash uses a
         * length-prefixed (netstring) encoding — `<byteLen(key)>:<key><byteLen(value)>:<value>`
         * per sorted key — so it must be injective: distinct component maps must never
         * collide. The golden vectors are byte-identical across the MSAL SDK family
         * (Go/.NET/Java/Python), so they double as a cross-SDK consistency guard.
         *
         * NOTE: `computeAdditionalCacheKeyHash` is not exported and is not lowercased
         * internally — lowercasing happens downstream in `generateCredentialKey`. Golden
         * vectors are therefore compared case-insensitively.
         */

        function baseEntity(
            overrides: Partial<CredentialEntity>
        ): CredentialEntity {
            return {
                homeAccountId: "",
                environment: "login.microsoftonline.com",
                credentialType: Constants.CredentialType.ACCESS_TOKEN,
                clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                realm: TEST_CONFIG.TENANT,
                target: TEST_CONFIG.DEFAULT_GRAPH_SCOPE.join(" "),
                secret: "fake-token",
                ...overrides,
            } as CredentialEntity;
        }

        // Extract the appended 43-char Base64URL hash (SHA-256 → Base64URL, no padding)
        // from the end of the credential key.
        function hashFor(components: Record<string, string>): string {
            const key = generateCredentialKey(
                baseEntity({ additionalCacheKeyComponents: components })
            );
            return key.slice(-43);
        }

        describe("boundary ambiguity", () => {
            it("key/value boundary cannot be forged (fmi_path/value vs fmi_pat/hvalue)", () => {
                // Delimiter-less concatenation would serialize both to "fmi_pathvalue".
                expect(hashFor({ fmi_path: "value" })).not.toBe(
                    hashFor({ fmi_pat: "hvalue" })
                );
            });

            it("multi-entry boundary cannot be forged ({a:b, cd:e} vs {ab:c, d:e})", () => {
                expect(hashFor({ a: "b", cd: "e" })).not.toBe(
                    hashFor({ ab: "c", d: "e" })
                );
            });

            it("values containing the encoding characters (: | \\ digits) cannot forge a boundary", () => {
                const a = hashFor({ k: "1:2|3\\4" });
                const b = hashFor({ k: "1", "2|3\\4": "" });
                const c = hashFor({ k1: ":2|3\\4" });
                expect(new Set([a, b, c]).size).toBe(3);
            });
        });

        it("is injective over an adversarial alphabet (no collisions)", () => {
            // Includes empty string, digits, the encoding delimiters (: | \), a 2-byte
            // char (é), an astral emoji, and a combining sequence (e + U+0301).
            const alphabet = [
                "",
                "0",
                "1",
                "9",
                ":",
                "|",
                "\\",
                "a",
                "\u00e9", // é (precomposed, 2 UTF-8 bytes)
                "\u{1f600}", // 😀 (astral, 4 UTF-8 bytes)
                "e\u0301", // e + combining acute accent
            ];

            const maps: Record<string, string>[] = [];
            // Single-entry maps: every (key, value) pair.
            for (const k of alphabet) {
                for (const v of alphabet) {
                    maps.push({ [k]: v });
                }
            }
            // Two-entry maps: every unordered distinct key pair × every value pair.
            for (let i = 0; i < alphabet.length; i++) {
                for (let j = i + 1; j < alphabet.length; j++) {
                    for (const v1 of alphabet) {
                        for (const v2 of alphabet) {
                            maps.push({
                                [alphabet[i]]: v1,
                                [alphabet[j]]: v2,
                            });
                        }
                    }
                }
            }

            const hashes = new Set(maps.map(hashFor));
            // Every constructed map is distinct, so every hash must be distinct.
            expect(hashes.size).toBe(maps.length);
        });

        describe("determinism", () => {
            it("produces the same hash for repeated calls", () => {
                expect(hashFor({ fmi_path: "agent-a", another: "b" })).toBe(
                    hashFor({ fmi_path: "agent-a", another: "b" })
                );
            });

            it("is independent of key insertion order", () => {
                expect(hashFor({ alpha: "1", beta: "2" })).toBe(
                    hashFor({ beta: "2", alpha: "1" })
                );
            });
        });

        describe("UTF-8 byte-length correctness", () => {
            it("uses UTF-8 byte length, not UTF-16 code-unit length", () => {
                // "é" (U+00E9) is 1 UTF-16 code unit but 2 UTF-8 bytes.
                const actual = hashFor({ "\u00e9": "\u00e9" });

                // Correct (byte-length) encoding: "2:é2:é".
                const correct = createHash("sha256")
                    .update("2:\u00e92:\u00e9", "utf8")
                    .digest("base64url")
                    .toLowerCase();
                // Incorrect (String.length / code-unit) encoding: "1:é1:é".
                const wrong = createHash("sha256")
                    .update("1:\u00e91:\u00e9", "utf8")
                    .digest("base64url")
                    .toLowerCase();

                expect(actual.toLowerCase()).toBe(correct);
                expect(actual.toLowerCase()).not.toBe(wrong);
            });

            it("precomposed é and e + combining accent do not collide", () => {
                expect(hashFor({ x: "\u00e9" })).not.toBe(
                    hashFor({ x: "e\u0301" })
                );
            });
        });

        describe("empty and single-entry edges", () => {
            it("does not append a hash for empty components", () => {
                const withEmpty = generateCredentialKey(
                    baseEntity({ additionalCacheKeyComponents: {} })
                );
                const without = generateCredentialKey(baseEntity({}));
                expect(withEmpty).toBe(without);
            });

            it("handles an empty value distinctly from a non-empty value", () => {
                expect(hashFor({ k: "" })).not.toBe(hashFor({ k: "x" }));
                // Empty value still yields a well-formed 43-char Base64URL hash.
                expect(hashFor({ k: "" })).toMatch(/^[a-z0-9_-]{43}$/);
            });

            it("distinguishes an empty key from an empty value", () => {
                expect(hashFor({ "": "k" })).not.toBe(hashFor({ k: "" }));
            });
        });

        describe("golden vectors (cross-SDK consistency)", () => {
            // Byte-identical to MSAL Go/.NET/Java/Python. Compared case-insensitively
            // because the hash is only lowercased downstream in generateCredentialKey.
            const vectors: Array<[Record<string, string>, string]> = [
                [
                    { fmi_path: "agent-app-id" },
                    "a0ry_zl4gccsdp7gnw927x8s0mrmnodv6tyilt0u07m",
                ],
                [
                    { a: "b", cd: "e" },
                    "cybgactkrvlzlen1aiwzwl3ay5krkyixommrobc-ri4",
                ],
                [
                    { fmi_path: "value" },
                    "n_lucewkadzv_nybtg-2wtorgf2nrns6ihlfa7vbuzg",
                ],
                [
                    { fmi_pat: "hvalue" },
                    "tjtm16m-suk2_bkniblr25lyuki40qyceco7knuyu0k",
                ],
                [
                    { "\u00e9": "\u00e9" },
                    "xskzaoz4ibr3mznftyxctvg1ptuh-0fuzpty7ndbfls",
                ],
            ];

            it.each(vectors)(
                "matches the cross-SDK golden hash for %j",
                (components, expected) => {
                    expect(hashFor(components).toLowerCase()).toBe(expected);
                }
            );
        });
    });
});
