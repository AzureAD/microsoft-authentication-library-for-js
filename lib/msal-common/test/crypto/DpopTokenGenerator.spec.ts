/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { DpopTokenGenerator } from "../../src/crypto/DpopTokenGenerator.js";
import { ICrypto } from "../../src/crypto/ICrypto.js";
import * as TimeUtils from "../../src/utils/TimeUtils.js";
import { mockCrypto } from "../client/ClientTestUtils.js";
import { TEST_CONFIG } from "../test_kit/StringConstants.js";

describe("DpopTokenGenerator Unit Tests", () => {
    let generator: DpopTokenGenerator;
    const cryptoInterface: ICrypto = { ...mockCrypto };

    beforeEach(() => {
        generator = new DpopTokenGenerator(cryptoInterface);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

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
    });

    describe("buildResourceProofClaims", () => {
        it("UT-02: Resource DPoP proof includes ath and resource binding (uppercase htm, normalized htu, ath, iat, jti)", () => {
            const currTime = TimeUtils.nowSeconds();
            jest.spyOn(TimeUtils, "nowSeconds").mockReturnValue(currTime);

            const resourceUrl =
                "https://graph.microsoft.com/v1.0/me?$select=id,displayName";
            const htm = "get"; // lowercase — must be uppercased
            const ath = "base64url-encoded-access-token-hash";

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
                    ath: "some-ath-value",
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
                    ath: "some-ath-value",
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
                    ath: "some-ath-value",
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
                        ath: "ath-value",
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
                { resourceUrl, htm: "GET", ath: "ath-value" },
                ""
            );

            expect(claims.htu).toBe("https://api.example.com/data");
            expect(claims.htu).not.toContain("?");
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
                    ath: "ath-val",
                },
                ""
            );
            const proof2 = uniqueGenerator.buildResourceProofClaims(
                {
                    resourceUrl: "https://graph.microsoft.com/v1.0/me",
                    htm: "GET",
                    ath: "ath-val",
                },
                ""
            );

            expect(proof1.jti).not.toBe(proof2.jti);
        });
    });
});
