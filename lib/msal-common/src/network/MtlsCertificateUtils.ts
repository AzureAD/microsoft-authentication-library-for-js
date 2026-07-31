/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ClientCredentials } from "../account/ClientCredentials.js";
import { AuthenticationScheme } from "../utils/Constants.js";
import { MtlsCertificate } from "./INetworkModule.js";

const PEM_BEGIN = "-----BEGIN CERTIFICATE-----";
const PEM_END = "-----END CERTIFICATE-----";

/**
 * Extracts the base64-encoded DER bodies of every certificate in an `x5c` value. Accepts either PEM
 * (one or more `BEGIN/END CERTIFICATE` blocks) or a bare base64 DER string. Pure string logic so it
 * is safe to run in every runtime (mirrors msal-node's `MtlsCertificateUtils`).
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
 * Converts an `x5c` certificate value into a PEM string suitable for use as the client certificate
 * on an mTLS handshake. PEM input is returned unchanged; a bare base64 DER string is wrapped.
 */
function x5cToPem(x5c: string): string {
    if (x5c.includes(PEM_BEGIN)) {
        return x5c;
    }
    return extractCertBodies(x5c).map(wrapPem).join("");
}

/**
 * Decides whether a confidential-client request should present the app's configured certificate as
 * the client TLS certificate on the token-endpoint handshake (routing to the mTLS endpoint) while
 * still receiving a plain Bearer token — i.e. Bearer-over-mTLS.
 *
 * Returns the {@link MtlsCertificate} to present, or `undefined` when the request should proceed
 * against the regular token endpoint. Per-request mTLS Proof-of-Possession always wins: when the
 * request's `authenticationScheme` is `MTLS_POP` this returns `undefined` so the dedicated PoP path
 * (which binds the token to the certificate) is used instead.
 *
 * @param clientCredentials - resolved app client credentials (holds the opt-in flag + certificate).
 * @param authenticationScheme - the request's authentication scheme.
 */
export function getBearerOverMtlsCertificate(
    clientCredentials: ClientCredentials,
    authenticationScheme?: AuthenticationScheme
): MtlsCertificate | undefined {
    const bindingCertificate = clientCredentials.mtlsBindingCertificate;
    if (
        !clientCredentials.sendCertificateOverMtls ||
        !bindingCertificate ||
        authenticationScheme === AuthenticationScheme.MTLS_POP
    ) {
        return undefined;
    }

    return {
        cert: x5cToPem(bindingCertificate.x5c),
        key: bindingCertificate.privateKey,
    };
}
