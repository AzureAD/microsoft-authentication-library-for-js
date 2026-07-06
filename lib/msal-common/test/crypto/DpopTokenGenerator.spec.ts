/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    DPOP_JWT_HEADER_ALGORITHM,
    DPOP_JWT_HEADER_TYPE,
    DpopProofClaims,
    DpopProofHeader,
    DpopTokenGenerator,
} from "../../src/crypto/DpopTokenGenerator.js";
import { ICrypto } from "../../src/crypto/ICrypto.js";
import * as TimeUtils from "../../src/utils/TimeUtils.js";
import { ClientConfigurationErrorCodes } from "../../src/error/ClientConfigurationError.js";
import crypto from "crypto";
import { mockCrypto } from "../client/ClientTestUtils.js";
import {
    RANDOM_TEST_GUID,
    TEST_CONFIG,
    TEST_DPOP_VALUES,
} from "../test_kit/StringConstants.js";

describe("DpopTokenGenerator Unit Tests", () => {
    let generator: DpopTokenGenerator;
    const cryptoInterface: ICrypto = { ...mockCrypto };
    const publicJwk = {
        kty: "EC",
        crv: "P-256",
        x: "test-x-coordinate",
        y: "test-y-coordinate",
    };
    const dpopSignature = "test-signature";

    beforeEach(() => {
        generator = new DpopTokenGenerator(cryptoInterface);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    function decodeDpopProof(proof: string): {
        header: DpopProofHeader;
        claims: DpopProofClaims;
        signingInput: string;
        signature: string;
    } {
        const [encodedHeader, encodedClaims, signature] = proof.split(".");

        return {
            header: JSON.parse(
                Buffer.from(encodedHeader, "base64url").toString("utf8")
            ),
            claims: JSON.parse(
                Buffer.from(encodedClaims, "base64url").toString("utf8")
            ),
            signingInput: `${encodedHeader}.${encodedClaims}`,
            signature,
        };
    }

    describe("buildTokenProofClaims", () => {
        it("UT-01: Token-endpoint DPoP proof uses RFC 9449 claims (htm=POST, normalized htu, iat, jti)", () => {
            const currTime = TimeUtils.nowSeconds();
            jest.spyOn(TimeUtils, "nowSeconds").mockReturnValue(currTime);

            const tokenEndpoint =
                "https://login.microsoftonline.com/common/oauth2/v2.0/token?client_id=abc&scope=openid";
            const claims = generator.buildTokenProofClaims(
                { tokenEndpoint },
                TEST_CONFIG.CORRELATION_ID
            );

            // htm must always be "POST" for the token endpoint
            expect(claims.htm).toBe("POST");

            // htu must strip query string and fragment (normalized URI)
            expect(claims.htu).toBe(
                "https://login.microsoftonline.com/common/oauth2/v2.0/token"
            );

            // iat must be current epoch time in seconds
            expect(claims.iat).toBe(currTime);

            // jti must be present and non-empty
            expect(typeof claims.jti).toBe("string");
            expect(claims.jti.length).toBeGreaterThan(0);
        });

        it("includes optional nonce in token proof when provided", () => {
            const tokenEndpoint =
                "https://login.microsoftonline.com/tenant/oauth2/v2.0/token";
            const nonce = "server-nonce-abc123";
            const claims = generator.buildTokenProofClaims(
                { tokenEndpoint, nonce },
                ""
            );

            expect(claims.nonce).toBe(nonce);
        });

        it("omits nonce from token proof when not provided", () => {
            const tokenEndpoint =
                "https://login.microsoftonline.com/tenant/oauth2/v2.0/token";
            const claims = generator.buildTokenProofClaims(
                { tokenEndpoint },
                ""
            );

            expect(claims.nonce).toBeUndefined();
        });

        it("DPoP token proof must not contain SHR fields (at, ts, m, u, p, q)", () => {
            const tokenEndpoint =
                "https://login.microsoftonline.com/tenant/oauth2/v2.0/token";
            const claims = generator.buildTokenProofClaims(
                { tokenEndpoint },
                ""
            ) as Record<string, unknown>;

            expect(claims.at).toBeUndefined();
            expect(claims.ts).toBeUndefined();
            expect(claims.m).toBeUndefined();
            expect(claims.u).toBeUndefined();
            expect(claims.p).toBeUndefined();
            expect(claims.q).toBeUndefined();
        });

        it("normalizes token endpoint htu by removing trailing query string", () => {
            const tokenEndpoint =
                "https://login.microsoftonline.com/mytenant/oauth2/v2.0/token?foo=bar&baz=qux";
            const claims = generator.buildTokenProofClaims(
                { tokenEndpoint },
                ""
            );

            expect(claims.htu).toBe(
                "https://login.microsoftonline.com/mytenant/oauth2/v2.0/token"
            );
            expect(claims.htu).not.toContain("?");
        });

        it("preserves mixed-case token endpoint path casing", () => {
            const claims = generator.buildTokenProofClaims(
                {
                    tokenEndpoint:
                        "https://login.microsoftonline.com/TenantID/OAuth2/v2.0/Token?client_id=abc",
                },
                ""
            );

            expect(claims.htu).toBe(
                "https://login.microsoftonline.com/TenantID/OAuth2/v2.0/Token"
            );
        });

        it("does not append a trailing slash to queryless token endpoint paths", () => {
            const claims = generator.buildTokenProofClaims(
                {
                    tokenEndpoint:
                        "https://login.microsoftonline.com/common/oauth2/v2.0/token",
                },
                ""
            );

            expect(claims.htu).toBe(
                "https://login.microsoftonline.com/common/oauth2/v2.0/token"
            );
        });

        it("rejects malformed, relative, and non-https token endpoint URLs", () => {
            const invalidTokenEndpoints = [
                "not-a-valid-url",
                "/common/oauth2/v2.0/token",
                "http://login.microsoftonline.com/common/oauth2/v2.0/token",
                "ftp://login.microsoftonline.com/common/oauth2/v2.0/token",
                "https:login.microsoftonline.com/common/oauth2/v2.0/token",
            ];

            invalidTokenEndpoints.forEach((tokenEndpoint) => {
                expect(() =>
                    generator.buildTokenProofClaims({ tokenEndpoint }, "")
                ).toThrow(ClientConfigurationErrorCodes.urlParseError);
            });
        });
    });

    describe("buildResourceProofClaims", () => {
        it("uses a DPoP access token fixture and computes ath as BASE64URL(SHA-256(ASCII(access_token)))", () => {
            const tokenSegments = TEST_DPOP_VALUES.ACCESS_TOKEN.split(".");
            const [, payload] = tokenSegments;
            const decodedPayload = JSON.parse(
                Buffer.from(payload, "base64url").toString("utf8")
            );
            const expectedAth = crypto
                .createHash("sha256")
                .update(Buffer.from(TEST_DPOP_VALUES.ACCESS_TOKEN, "ascii"))
                .digest("base64url");

            expect(tokenSegments).toHaveLength(3);
            expect(decodedPayload.cnf.jkt).toBe(
                TEST_DPOP_VALUES.ACCESS_TOKEN_JKT
            );
            expect(TEST_DPOP_VALUES.ACCESS_TOKEN_ATH).toBe(expectedAth);
        });

        it("UT-02: Resource DPoP proof includes ath and resource binding (uppercase htm, normalized htu, ath, iat, jti)", () => {
            const currTime = TimeUtils.nowSeconds();
            jest.spyOn(TimeUtils, "nowSeconds").mockReturnValue(currTime);

            const resourceUrl =
                "https://graph.microsoft.com/v1.0/me?$select=id,displayName";
            const htm = "get"; // lowercase — must be uppercased
            const ath = TEST_DPOP_VALUES.ACCESS_TOKEN_ATH;

            const claims = generator.buildResourceProofClaims(
                { resourceUrl, htm, ath },
                ""
            );

            // htm must be uppercased
            expect(claims.htm).toBe("GET");

            // htu must strip query string (normalized URI)
            expect(claims.htu).toBe("https://graph.microsoft.com/v1.0/me");
            expect(claims.htu).not.toContain("?");

            // ath (access token hash) must be present for resource binding
            expect(claims.ath).toBe(ath);

            // iat must be current epoch time in seconds
            expect(claims.iat).toBe(currTime);

            // jti must be present and non-empty
            expect(typeof claims.jti).toBe("string");
            expect(claims.jti.length).toBeGreaterThan(0);
        });

        it("includes optional resource nonce in resource proof when provided", () => {
            const claims = generator.buildResourceProofClaims(
                {
                    resourceUrl: "https://graph.microsoft.com/v1.0/me",
                    htm: "GET",
                    ath: TEST_DPOP_VALUES.ACCESS_TOKEN_ATH,
                    nonce: "resource-nonce-xyz",
                },
                ""
            );

            expect(claims.nonce).toBe("resource-nonce-xyz");
        });

        it("omits nonce from resource proof when not provided", () => {
            const claims = generator.buildResourceProofClaims(
                {
                    resourceUrl: "https://graph.microsoft.com/v1.0/me",
                    htm: "POST",
                    ath: TEST_DPOP_VALUES.ACCESS_TOKEN_ATH,
                },
                ""
            );

            expect(claims.nonce).toBeUndefined();
        });

        it("DPoP resource proof must not contain SHR fields (at, ts, m, u, p, q)", () => {
            const claims = generator.buildResourceProofClaims(
                {
                    resourceUrl: "https://graph.microsoft.com/v1.0/me",
                    htm: "GET",
                    ath: TEST_DPOP_VALUES.ACCESS_TOKEN_ATH,
                },
                ""
            ) as Record<string, unknown>;

            expect(claims.at).toBeUndefined();
            expect(claims.ts).toBeUndefined();
            expect(claims.m).toBeUndefined();
            expect(claims.u).toBeUndefined();
            expect(claims.p).toBeUndefined();
            expect(claims.q).toBeUndefined();
        });

        it("uppercases resource htm for all HTTP methods", () => {
            const methods = ["get", "post", "put", "patch", "delete"];
            for (const method of methods) {
                const claims = generator.buildResourceProofClaims(
                    {
                        resourceUrl: "https://graph.microsoft.com/v1.0/me",
                        htm: method,
                        ath: TEST_DPOP_VALUES.ACCESS_TOKEN_ATH,
                    },
                    ""
                );
                expect(claims.htm).toBe(method.toUpperCase());
            }
        });

        it("normalizes resource htu by removing trailing query string", () => {
            const resourceUrl =
                "https://api.example.com/data?filter=active&page=2";
            const claims = generator.buildResourceProofClaims(
                {
                    resourceUrl,
                    htm: "GET",
                    ath: TEST_DPOP_VALUES.ACCESS_TOKEN_ATH,
                },
                ""
            );

            expect(claims.htu).toBe("https://api.example.com/data");
            expect(claims.htu).not.toContain("?");
        });

        it("strips both query and fragment from resource htu", () => {
            const claims = generator.buildResourceProofClaims(
                {
                    resourceUrl:
                        "https://graph.microsoft.com/v1.0/me?$select=id#profile",
                    htm: "GET",
                    ath: TEST_DPOP_VALUES.ACCESS_TOKEN_ATH,
                },
                ""
            );

            expect(claims.htu).toBe("https://graph.microsoft.com/v1.0/me");
            expect(claims.htu).not.toContain("?");
            expect(claims.htu).not.toContain("#");
        });

        it("preserves mixed-case resource path casing", () => {
            const claims = generator.buildResourceProofClaims(
                {
                    resourceUrl:
                        "https://api.example.com/v1.0/MyResource/Items",
                    htm: "GET",
                    ath: TEST_DPOP_VALUES.ACCESS_TOKEN_ATH,
                },
                ""
            );

            expect(claims.htu).toBe(
                "https://api.example.com/v1.0/MyResource/Items"
            );
        });

        it("does not append a trailing slash to queryless resource paths", () => {
            const claims = generator.buildResourceProofClaims(
                {
                    resourceUrl: "https://api.example.com/v1.0/me",
                    htm: "GET",
                    ath: TEST_DPOP_VALUES.ACCESS_TOKEN_ATH,
                },
                ""
            );

            expect(claims.htu).toBe("https://api.example.com/v1.0/me");
        });

        it("rejects malformed, relative, and non-https resource URLs", () => {
            const invalidResourceUrls = [
                "not-a-valid-url",
                "v1.0/me",
                "http://api.example.com/v1.0/me",
                "mailto:user@example.com",
                "https:api.example.com/v1.0/me",
            ];

            invalidResourceUrls.forEach((resourceUrl) => {
                expect(() =>
                    generator.buildResourceProofClaims({
                        resourceUrl,
                        htm: "GET",
                        ath: TEST_DPOP_VALUES.ACCESS_TOKEN_ATH,
                    })
                ).toThrow(ClientConfigurationErrorCodes.urlParseError);
            });
        });

        it("rejects invalid resource HTTP methods", () => {
            const invalidMethods = ["", " ", "GET /", "GET\nPOST"];

            invalidMethods.forEach((htm) => {
                expect(() =>
                    generator.buildResourceProofClaims({
                        resourceUrl: "https://graph.microsoft.com/v1.0/me",
                        htm,
                        ath: TEST_DPOP_VALUES.ACCESS_TOKEN_ATH,
                    })
                ).toThrow(ClientConfigurationErrorCodes.invalidClaims);
            });
        });

        it("rejects missing or malformed ath values", () => {
            const invalidAths = [
                "",
                "raw-access-token",
                "Kq5sNclPz7QV2-lfQIuc6R7oRu0eHPeDcJryCH0Fspw=",
                "Kq5sNclPz7QV2+lfQIuc6R7oRu0eHPeDcJryCH0Fspw",
            ];

            invalidAths.forEach((ath) => {
                expect(() =>
                    generator.buildResourceProofClaims({
                        resourceUrl: "https://graph.microsoft.com/v1.0/me",
                        htm: "GET",
                        ath,
                    })
                ).toThrow(ClientConfigurationErrorCodes.invalidClaims);
            });
        });
    });

    describe("generateTokenProof", () => {
        it("builds and signs a compact DPoP proof JWT for token requests", async () => {
            const currTime = TimeUtils.nowSeconds();
            const sign = jest.fn().mockResolvedValue(dpopSignature);
            jest.spyOn(TimeUtils, "nowSeconds").mockReturnValue(currTime);

            const proof = await generator.generateTokenProof(
                {
                    tokenEndpoint:
                        "https://login.microsoftonline.com/tenant/oauth2/v2.0/token?client_id=abc",
                    nonce: "server-nonce",
                    publicJwk,
                    sign,
                },
                TEST_CONFIG.CORRELATION_ID
            );
            const decodedProof = decodeDpopProof(proof);

            expect(decodedProof.header).toEqual({
                typ: DPOP_JWT_HEADER_TYPE,
                alg: DPOP_JWT_HEADER_ALGORITHM,
                jwk: publicJwk,
            });
            expect(decodedProof.claims).toEqual({
                jti: RANDOM_TEST_GUID,
                htm: "POST",
                htu: "https://login.microsoftonline.com/tenant/oauth2/v2.0/token",
                iat: currTime,
                nonce: "server-nonce",
            });
            expect(sign).toHaveBeenCalledWith(
                decodedProof.signingInput,
                TEST_CONFIG.CORRELATION_ID
            );
            expect(decodedProof.signature).toBe(dpopSignature);
        });

        it("uses a caller-provided DPoP proof header algorithm", async () => {
            const proof = await generator.generateTokenProof({
                tokenEndpoint:
                    "https://login.microsoftonline.com/tenant/oauth2/v2.0/token",
                publicJwk,
                alg: "custom-alg",
                sign: jest.fn().mockResolvedValue(dpopSignature),
            });
            const decodedProof = decodeDpopProof(proof);

            expect(decodedProof.header.alg).toBe("custom-alg");
        });
    });

    describe("generateResourceProof", () => {
        it("builds and signs a compact DPoP proof JWT for resource requests", async () => {
            const currTime = TimeUtils.nowSeconds();
            const sign = jest.fn().mockResolvedValue(dpopSignature);
            jest.spyOn(TimeUtils, "nowSeconds").mockReturnValue(currTime);

            const proof = await generator.generateResourceProof(
                {
                    resourceUrl:
                        "https://graph.microsoft.com/v1.0/me?$select=id",
                    htm: "get",
                    ath: TEST_DPOP_VALUES.ACCESS_TOKEN_ATH,
                    nonce: "resource-nonce",
                    publicJwk,
                    sign,
                },
                TEST_CONFIG.CORRELATION_ID
            );
            const decodedProof = decodeDpopProof(proof);

            expect(decodedProof.header).toEqual({
                typ: DPOP_JWT_HEADER_TYPE,
                alg: DPOP_JWT_HEADER_ALGORITHM,
                jwk: publicJwk,
            });
            expect(decodedProof.claims).toEqual({
                jti: RANDOM_TEST_GUID,
                htm: "GET",
                htu: "https://graph.microsoft.com/v1.0/me",
                ath: TEST_DPOP_VALUES.ACCESS_TOKEN_ATH,
                iat: currTime,
                nonce: "resource-nonce",
            });
            expect(sign).toHaveBeenCalledWith(
                decodedProof.signingInput,
                TEST_CONFIG.CORRELATION_ID
            );
            expect(decodedProof.signature).toBe(dpopSignature);
        });
    });

    describe("jti uniqueness (UT-03, RT-01)", () => {
        it("UT-03: jti values are unique across consecutive token proof builds", () => {
            let callCount = 0;
            const uniqueGuidCrypto: ICrypto = {
                ...cryptoInterface,
                createNewGuid(): string {
                    return `unique-jti-${++callCount}`;
                },
            };
            const uniqueGenerator = new DpopTokenGenerator(uniqueGuidCrypto);
            const endpoint =
                "https://login.microsoftonline.com/common/oauth2/v2.0/token";

            const proof1 = uniqueGenerator.buildTokenProofClaims(
                { tokenEndpoint: endpoint },
                ""
            );
            const proof2 = uniqueGenerator.buildTokenProofClaims(
                { tokenEndpoint: endpoint },
                ""
            );

            expect(proof1.jti).not.toBe(proof2.jti);
        });

        it("RT-01: jti is sourced from createNewGuid (CSPRNG-backed in production) on each call", () => {
            const createNewGuidSpy = jest
                .spyOn(cryptoInterface, "createNewGuid")
                .mockReturnValueOnce("csprng-guid-1")
                .mockReturnValueOnce("csprng-guid-2");

            const endpoint =
                "https://login.microsoftonline.com/tenant/oauth2/v2.0/token";
            const proof1 = generator.buildTokenProofClaims(
                { tokenEndpoint: endpoint },
                ""
            );
            const proof2 = generator.buildTokenProofClaims(
                { tokenEndpoint: endpoint },
                ""
            );

            expect(createNewGuidSpy).toHaveBeenCalledTimes(2);
            expect(proof1.jti).toBe("csprng-guid-1");
            expect(proof2.jti).toBe("csprng-guid-2");
            expect(proof1.jti).not.toBe(proof2.jti);
        });

        it("UT-03: resource proof jti values are unique across consecutive builds", () => {
            let callCount = 0;
            const uniqueGuidCrypto: ICrypto = {
                ...cryptoInterface,
                createNewGuid(): string {
                    return `res-unique-jti-${++callCount}`;
                },
            };
            const uniqueGenerator = new DpopTokenGenerator(uniqueGuidCrypto);

            const proof1 = uniqueGenerator.buildResourceProofClaims(
                {
                    resourceUrl: "https://graph.microsoft.com/v1.0/me",
                    htm: "GET",
                    ath: TEST_DPOP_VALUES.ACCESS_TOKEN_ATH,
                },
                ""
            );
            const proof2 = uniqueGenerator.buildResourceProofClaims(
                {
                    resourceUrl: "https://graph.microsoft.com/v1.0/me",
                    htm: "GET",
                    ath: TEST_DPOP_VALUES.ACCESS_TOKEN_ATH,
                },
                ""
            );

            expect(proof1.jti).not.toBe(proof2.jti);
        });
    });
});
