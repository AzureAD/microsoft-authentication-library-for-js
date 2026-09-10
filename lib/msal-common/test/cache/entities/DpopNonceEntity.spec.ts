/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    canonicalizeDpopNonceIssuer,
    createDpopNonceEntity,
    DPOP_NONCE_MAX_SIZE_BYTES,
    DPOP_NONCE_TTL_MS,
    DpopNonceSource,
    DpopNonceType,
    generateDpopNonceCacheKey,
    isDpopNonceEntityValid,
    parseDpopNonceCacheKey,
    validateDpopNonce,
} from "../../../src/cache/entities/DpopNonceEntity.js";
import { ClientConfigurationErrorCodes } from "../../../src/error/ClientConfigurationError.js";

describe("DpopNonceEntity", () => {
    describe("validateDpopNonce", () => {
        it("accepts exactly 1024 UTF-8 bytes and preserves the nonce exactly", () => {
            const asciiNonce = "a".repeat(DPOP_NONCE_MAX_SIZE_BYTES);
            const multiByteNonce = "é".repeat(DPOP_NONCE_MAX_SIZE_BYTES / 2);
            const opaqueNonce = "  opaque%2Fnonce+/=  ";

            expect(validateDpopNonce(asciiNonce)).toBe(asciiNonce);
            expect(validateDpopNonce(multiByteNonce)).toBe(multiByteNonce);
            expect(validateDpopNonce(opaqueNonce)).toBe(opaqueNonce);
        });

        it("rejects values larger than 1024 UTF-8 bytes", () => {
            expect(() =>
                validateDpopNonce("a".repeat(DPOP_NONCE_MAX_SIZE_BYTES + 1))
            ).toThrow(ClientConfigurationErrorCodes.invalidDpopNonce);
            expect(() =>
                validateDpopNonce("é".repeat(DPOP_NONCE_MAX_SIZE_BYTES / 2 + 1))
            ).toThrow(ClientConfigurationErrorCodes.invalidDpopNonce);
        });

        it.each([undefined, null, 1, {}, [], ""])(
            "rejects non-string and empty value %#",
            (nonce) => {
                expect(() => validateDpopNonce(nonce)).toThrow(
                    ClientConfigurationErrorCodes.invalidDpopNonce
                );
            }
        );

        it.each(["nonce\u0000", "nonce\t", "nonce\u007f", "nonce\u0085"])(
            "rejects control characters in %p",
            (nonce) => {
                expect(() => validateDpopNonce(nonce)).toThrow(
                    ClientConfigurationErrorCodes.invalidDpopNonce
                );
            }
        );
    });

    describe("canonicalizeDpopNonceIssuer", () => {
        it("canonicalizes authorization-server endpoints while preserving the endpoint path", () => {
            expect(
                canonicalizeDpopNonceIssuer(
                    "HTTPS://BÜCHER.example:443/tenant/oauth2/../oauth2/v2.0/token?query=1#fragment",
                    DpopNonceType.AuthorizationServer
                )
            ).toBe("https://xn--bcher-kva.example/tenant/oauth2/v2.0/token");
        });

        it("canonicalizes resource-server keys to HTTPS origin only", () => {
            expect(
                canonicalizeDpopNonceIssuer(
                    "https://BÜCHER.example:443/v1.0/me?query=1#fragment",
                    DpopNonceType.ResourceServer
                )
            ).toBe("https://xn--bcher-kva.example");
            expect(
                canonicalizeDpopNonceIssuer(
                    "https://example.com:8443/path",
                    DpopNonceType.ResourceServer
                )
            ).toBe("https://example.com:8443");
        });

        it.each([
            "not-a-uri",
            "/relative",
            "https:opaque",
            "http://example.com/path",
            "ftp://example.com/path",
            `https://${"user"}@example.com/path`,
        ])("rejects unsupported URI %p", (uri) => {
            expect(() =>
                canonicalizeDpopNonceIssuer(uri, DpopNonceType.ResourceServer)
            ).toThrow(ClientConfigurationErrorCodes.invalidDpopHtu);
        });
    });

    describe("entity lifetime and cache keys", () => {
        const now = 2_000_000_000_000;

        it("accepts exact TTL and current-time boundaries", () => {
            const ttlBoundary = createDpopNonceEntity(
                "client-id",
                DpopNonceType.ResourceServer,
                DpopNonceSource.ResourceServer,
                "nonce",
                now - DPOP_NONCE_TTL_MS
            );
            const currentTimeBoundary = createDpopNonceEntity(
                "client-id",
                DpopNonceType.ResourceServer,
                DpopNonceSource.ResourceServer,
                "nonce",
                now
            );

            expect(
                isDpopNonceEntityValid(
                    ttlBoundary,
                    "client-id",
                    DpopNonceType.ResourceServer,
                    now
                )
            ).toBe(true);
            expect(
                isDpopNonceEntityValid(
                    currentTimeBoundary,
                    "client-id",
                    DpopNonceType.ResourceServer,
                    now
                )
            ).toBe(true);
        });

        it("rejects timestamps just outside TTL and current-time boundaries", () => {
            const expired = createDpopNonceEntity(
                "client-id",
                DpopNonceType.ResourceServer,
                DpopNonceSource.ResourceServer,
                "nonce",
                now - DPOP_NONCE_TTL_MS - 1
            );
            const futureDated = createDpopNonceEntity(
                "client-id",
                DpopNonceType.ResourceServer,
                DpopNonceSource.ResourceServer,
                "nonce",
                now + 1
            );

            expect(
                isDpopNonceEntityValid(
                    expired,
                    "client-id",
                    DpopNonceType.ResourceServer,
                    now
                )
            ).toBe(false);
            expect(
                isDpopNonceEntityValid(
                    futureDated,
                    "client-id",
                    DpopNonceType.ResourceServer,
                    now
                )
            ).toBe(false);
        });

        it("uses a versioned key without persisting the issuer URI", () => {
            const key = generateDpopNonceCacheKey(
                "client|id",
                DpopNonceType.ResourceServer,
                "issuer-hash"
            );

            expect(key).not.toContain("https://");
            expect(parseDpopNonceCacheKey(key)).toEqual({
                schemaVersion: 1,
                clientId: "client|id",
                nonceType: DpopNonceType.ResourceServer,
                issuerHash: "issuer-hash",
            });
        });
    });
});
