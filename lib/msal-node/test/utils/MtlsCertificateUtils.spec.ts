/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import crypto from "crypto";
import {
    x5cToPem,
    computeX5tSha256,
} from "../../src/utils/MtlsCertificateUtils.js";

// A deterministic 100-byte "DER" blob, long enough that base64 wrapping spans multiple 64-char lines.
const derBuffer = Buffer.from(
    Array.from({ length: 100 }, (_, i) => (i * 7) % 256)
);
const leafBase64 = derBuffer.toString("base64");

// A second, distinct blob to represent an intermediate cert in a chain.
const intermediateBuffer = Buffer.from(
    Array.from({ length: 80 }, (_, i) => (i * 5 + 1) % 256)
);
const intermediateBase64 = intermediateBuffer.toString("base64");

const PEM_BEGIN = "-----BEGIN CERTIFICATE-----";
const PEM_END = "-----END CERTIFICATE-----";

function toPem(base64Body: string): string {
    const lines = base64Body.match(/.{1,64}/g) ?? [base64Body];
    return `${PEM_BEGIN}\n${lines.join("\n")}\n${PEM_END}\n`;
}

describe("MtlsCertificateUtils", () => {
    describe("x5cToPem", () => {
        it("wraps a bare base64 DER string into a PEM block with 64-char lines", () => {
            const pem = x5cToPem(leafBase64);
            expect(pem.startsWith(PEM_BEGIN)).toBe(true);
            expect(pem.includes(PEM_END)).toBe(true);

            // Stripping the header/footer and newlines must round-trip to the original base64.
            const body = pem
                .replace(PEM_BEGIN, "")
                .replace(PEM_END, "")
                .replace(/\s+/g, "");
            expect(body).toBe(leafBase64);

            // Body lines must never exceed 64 characters.
            const bodyLines = pem
                .split("\n")
                .filter(
                    (line) =>
                        line.length > 0 &&
                        !line.startsWith("-----BEGIN") &&
                        !line.startsWith("-----END")
                );
            expect(bodyLines.length).toBeGreaterThan(1);
            bodyLines.forEach((line) => {
                expect(line.length).toBeLessThanOrEqual(64);
            });
        });

        it("returns PEM input unchanged", () => {
            const pem = toPem(leafBase64);
            expect(x5cToPem(pem)).toBe(pem);
        });

        it("preserves a multi-certificate PEM chain unchanged", () => {
            const chain = toPem(leafBase64) + toPem(intermediateBase64);
            const result = x5cToPem(chain);
            expect(result).toBe(chain);
            // Both certificates are present in the output.
            expect((result.match(/BEGIN CERTIFICATE/g) ?? []).length).toBe(2);
        });
    });

    describe("computeX5tSha256", () => {
        const expectedThumbprint = crypto
            .createHash("sha256")
            .update(derBuffer)
            .digest("base64url");

        it("computes the base64url SHA-256 of the leaf DER for a bare base64 x5c", () => {
            expect(computeX5tSha256(leafBase64)).toBe(expectedThumbprint);
        });

        it("hashes the decoded DER bytes, not the base64 text", () => {
            const wrongThumbprint = crypto
                .createHash("sha256")
                .update(leafBase64) // hashing the text would be incorrect
                .digest("base64url");
            expect(computeX5tSha256(leafBase64)).not.toBe(wrongThumbprint);
        });

        it("produces the same thumbprint whether the input is PEM or bare base64", () => {
            expect(computeX5tSha256(toPem(leafBase64))).toBe(
                expectedThumbprint
            );
        });

        it("uses the leaf (first) certificate of a chain", () => {
            const chain = toPem(leafBase64) + toPem(intermediateBase64);
            expect(computeX5tSha256(chain)).toBe(expectedThumbprint);
        });

        it("returns a base64url value (no +, /, or = padding)", () => {
            const thumbprint = computeX5tSha256(leafBase64);
            expect(thumbprint).not.toMatch(/[+/=]/);
        });
    });
});
