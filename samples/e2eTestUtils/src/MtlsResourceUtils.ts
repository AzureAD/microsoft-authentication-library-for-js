/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import https from "https";

const PEM_BEGIN = "-----BEGIN CERTIFICATE-----";
const PEM_END = "-----END CERTIFICATE-----";

/**
 * Wraps a bare base64 DER certificate body into a PEM block, or returns PEM input unchanged, so the
 * value can be used as the `cert` option of a Node.js https.Agent. Key Vault-sourced x5c is already
 * PEM; a bare base64 DER string is tolerated so the helper is reusable across samples.
 */
function toPem(x5c: string): string {
    if (x5c.includes(PEM_BEGIN)) {
        return x5c;
    }
    const body = x5c.replace(/\s+/g, "");
    const lines = body.match(/.{1,64}/g) ?? [body];
    return `${PEM_BEGIN}\n${lines.join("\n")}\n${PEM_END}\n`;
}

export type MtlsResourceResponse = {
    status: number;
    /** First 512 chars of the response body — safe to log in public CI. */
    body: string;
};

/**
 * Calls a resource over mutual TLS with an mTLS-bound Proof-of-Possession token, proving the token
 * is usable end-to-end: the binding certificate is presented as the client certificate on the TLS
 * handshake and the token is sent with the `mtls_pop` Authorization scheme (not `Bearer`). The mTLS
 * PoP E2E specs use this to assert a real resource call succeeds (HTTP 200) — a 401/403 means the
 * token is not actually certificate-bound (a regression).
 *
 * The `resourceUrl` MUST target the mTLS resource host (e.g. `mtlstb.graph.microsoft.com`), which
 * negotiates the client-certificate handshake; the plain resource host does not.
 *
 * @param resourceUrl - Absolute URL on the mTLS resource host.
 * @param accessToken - The mTLS PoP access token.
 * @param x5c - Binding certificate (PEM or base64 DER); presented as the TLS client certificate.
 * @param privateKey - The binding certificate's private key (PEM).
 * @returns The HTTP status and a truncated response body.
 */
export const callGraphOverMtls = (
    resourceUrl: string,
    accessToken: string,
    x5c: string,
    privateKey: string
): Promise<MtlsResourceResponse> => {
    const url = new URL(resourceUrl);
    const agent = new https.Agent({
        cert: toPem(x5c),
        key: privateKey,
    });

    return new Promise<MtlsResourceResponse>((resolve, reject) => {
        const request = https.request(
            {
                method: "GET",
                host: url.host,
                path: `${url.pathname}${url.search}`,
                agent,
                headers: {
                    // mTLS PoP tokens are presented with the "mtls_pop" scheme, not "Bearer".
                    Authorization: `mtls_pop ${accessToken}`,
                },
            },
            (response) => {
                let body = "";
                response.on("data", (chunk) => {
                    // Cap the buffered body so a large or sensitive response is never fully logged.
                    if (body.length < 512) {
                        body += chunk.toString();
                    }
                });
                response.on("end", () => {
                    resolve({
                        status: response.statusCode ?? 0,
                        body: body.slice(0, 512),
                    });
                });
            }
        );
        request.on("error", reject);
        request.end();
    });
};
