/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as http from "http";

/**
 * Response from the IMDS /metadata/identity/getplatformmetadata endpoint.
 */
export interface PlatformMetadata {
    /** Client ID of the managed identity */
    clientId: string;
    /** Tenant ID */
    tenantId: string;
    /** Credential unit identifier used to key the certificate */
    cuId: string;
    /** MAA attestation endpoint, present when attestation is supported */
    attestationEndpoint?: string;
    /** Regional mTLS auth endpoint returned by IMDS */
    mtlsAuthEndpoint?: string;
}

const IMDS_BASE_URL = "http://169.254.169.254";
const PLATFORM_METADATA_PATH =
    "/metadata/identity/getplatformmetadata?api-version=2024-01-01";
const DEFAULT_TIMEOUT_MS = 5000;

/**
 * Calls the IMDS /metadata/identity/getplatformmetadata endpoint.
 * Returns the metadata needed to build the mTLS PoP request.
 *
 * This call is always a plain HTTP GET with `Metadata: true` — no client certificate needed.
 */
export async function getPlatformMetadata(
    timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<PlatformMetadata> {
    return new Promise<PlatformMetadata>((resolve, reject) => {
        const url = new URL(PLATFORM_METADATA_PATH, IMDS_BASE_URL);
        const options: http.RequestOptions = {
            hostname: url.hostname,
            port: url.port || 80,
            path: url.pathname + url.search,
            method: "GET",
            headers: { Metadata: "true" },
            timeout: timeoutMs,
        };

        const req = http.request(options, (res) => {
            const chunks: Buffer[] = [];
            res.on("data", (chunk: Buffer) => chunks.push(chunk));
            res.on("end", () => {
                const body = Buffer.concat(chunks).toString("utf8");
                if (res.statusCode !== 200) {
                    reject(
                        new Error(
                            `IMDS getplatformmetadata returned HTTP ${res.statusCode}: ${body}`
                        )
                    );
                    return;
                }
                try {
                    resolve(JSON.parse(body) as PlatformMetadata);
                } catch {
                    reject(
                        new Error(
                            `Failed to parse IMDS getplatformmetadata response: ${body}`
                        )
                    );
                }
            });
        });

        req.on("timeout", () => {
            req.destroy();
            reject(new Error("IMDS getplatformmetadata request timed out"));
        });

        req.on("error", reject);
        req.end();
    });
}
