/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import crypto from "crypto";
import { Hash } from "./Constants.js";

const PEM_BEGIN = "-----BEGIN CERTIFICATE-----";
const PEM_END = "-----END CERTIFICATE-----";

/**
 * Extracts the base64-encoded DER bodies of every certificate in an `x5c` value.
 * Accepts either PEM (one or more `BEGIN/END CERTIFICATE` blocks) or a bare base64 DER string.
 */
function extractCertBodies(x5c: string): string[] {
    if (x5c.includes(PEM_BEGIN)) {
        const regex =
            /-----BEGIN CERTIFICATE-----\r*\n?(.+?)\r*\n?-----END CERTIFICATE-----/gs;
        const bodies: string[] = [];
        let match;
        while ((match = regex.exec(x5c)) !== null) {
            bodies.push(match[1].replace(/\r*\n/g, ""));
        }
        return bodies;
    }
    // Bare base64 DER (single certificate) — strip any incidental whitespace.
    return [x5c.replace(/\s+/g, "")];
}

/**
 * Wraps a base64 DER certificate body into a PEM `BEGIN/END CERTIFICATE` block with 64-char lines.
 */
function wrapPem(base64Body: string): string {
    const lines = base64Body.match(/.{1,64}/g) ?? [base64Body];
    return `${PEM_BEGIN}\n${lines.join("\n")}\n${PEM_END}\n`;
}

/**
 * Converts an `x5c` certificate value into a PEM string suitable for use as the `cert` option of a
 * Node.js `https.Agent`. PEM input is returned unchanged; a bare base64 DER string is wrapped.
 * @param x5c - The configured certificate material (PEM or base64 DER, single cert or chain).
 */
export function x5cToPem(x5c: string): string {
    if (x5c.includes(PEM_BEGIN)) {
        return x5c;
    }
    return extractCertBodies(x5c).map(wrapPem).join("");
}

/**
 * Computes the SHA-256 certificate thumbprint (x5t#S256) of the leaf certificate in an `x5c` value,
 * base64url-encoded. Used both to bind the mTLS PoP token cache entry to the certificate and to
 * surface `bindingCertificate.thumbprintSha256` on the result.
 * @param x5c - The certificate material (PEM or base64 DER); the first certificate is the leaf.
 */
export function computeX5tSha256(x5c: string): string {
    const bodies = extractCertBodies(x5c);
    const der = Buffer.from(bodies[0], "base64");
    return crypto.createHash(Hash.SHA256).update(der).digest("base64url");
}
