/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as crypto from "crypto";
import * as http from "http";

/**
 * Response from the IMDS /metadata/identity/getplatformmetadata endpoint.
 */
export interface PlatformMetadata {
    /** Client ID of the managed identity */
    clientId: string;
    /** Tenant ID */
    tenantId: string;
    /**
     * VM unique ID (vmId from the CuidInfo object returned by IMDS).
     * Used to key the binding certificate and embed in the CSR cuId attribute.
     */
    cuId: string;
    /**
     * VM Scale Set ID (vmssId), may be empty string if not part of a scale set.
     * Included in the CSR cuId attribute JSON alongside cuId/vmId.
     */
    vmssId: string;
    /** MAA attestation endpoint, present when attestation is supported */
    attestationEndpoint?: string;
    /** Regional mTLS auth endpoint returned by IMDS */
    mtlsAuthEndpoint?: string;
}

const IMDS_BASE_URL = "http://169.254.169.254";
const PLATFORM_METADATA_PATH =
    "/metadata/identity/getplatformmetadata?cred-api-version=2.0";
const DEFAULT_TIMEOUT_MS = 5000;

/**
 * Calls the IMDS /metadata/identity/getplatformmetadata endpoint.
 * Returns the metadata needed to build the mTLS PoP request.
 *
 * This call is always a plain HTTP GET with `Metadata: true` — no client certificate needed.
 *
 * IMDS requires the `x-ms-client-request-id` header; without it the endpoint returns HTTP 400.
 * A new correlation ID is generated per call to match MSAL.NET behavior.
 */
export async function getPlatformMetadata(
    timeoutMs: number = DEFAULT_TIMEOUT_MS,
    correlationId: string = crypto.randomUUID()
): Promise<PlatformMetadata> {
    return new Promise<PlatformMetadata>((resolve, reject) => {
        const url = new URL(PLATFORM_METADATA_PATH, IMDS_BASE_URL);
        const options: http.RequestOptions = {
            hostname: url.hostname,
            port: url.port || 80,
            path: url.pathname + url.search,
            method: "GET",
            headers: {
                Metadata: "true",
                "x-ms-client-request-id": correlationId,
            },
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
                    const raw = JSON.parse(body) as {
                        clientId: string;
                        tenantId: string;
                        cuId: string | { vmId: string; vmssId?: string };
                        attestationEndpoint?: string;
                        mtlsAuthEndpoint?: string;
                    };
                    // Normalize cuId: IMDS may return a plain string or a CuidInfo object
                    // {vmId: "...", vmssId: "..."}. Extract both fields.
                    const cuId =
                        typeof raw.cuId === "string"
                            ? raw.cuId
                            : raw.cuId?.vmId ?? String(raw.cuId);
                    const vmssId =
                        typeof raw.cuId === "object"
                            ? (raw.cuId?.vmssId ?? "")
                            : "";
                    resolve({ ...raw, cuId, vmssId } as PlatformMetadata);
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

/** Azure Attestation resource — used when requesting IMDS token for MAA attestation */
export const MAA_RESOURCE = "https://attest.azure.net";

/** Response from IMDS /metadata/identity/oauth2/token */
export interface ImdsTokenResponse {
    access_token: string;
    expires_in: string;
    token_type: string;
}

/**
 * Acquires an access token via IMDS managed identity for a given resource.
 * Used to get the MAA auth token before calling AttestKeyGuardImportKey.
 */
export async function getImdsToken(
    resource: string,
    timeoutMs: number = 10000,
    correlationId: string = crypto.randomUUID()
): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        const encodedResource = encodeURIComponent(resource);
        const path = `/metadata/identity/oauth2/token?api-version=2018-02-01&resource=${encodedResource}`;
        const options: http.RequestOptions = {
            hostname: "169.254.169.254",
            port: 80,
            path,
            method: "GET",
            headers: {
                Metadata: "true",
                "x-ms-client-request-id": correlationId,
            },
            timeout: timeoutMs,
        };

        const req = http.request(options, (res) => {
            const chunks: Buffer[] = [];
            res.on("data", (c: Buffer) => chunks.push(c));
            res.on("end", () => {
                const body = Buffer.concat(chunks).toString("utf8");
                if (res.statusCode !== 200) {
                    reject(
                        new Error(
                            `IMDS token request for MAA returned HTTP ${res.statusCode}: ${body}`
                        )
                    );
                    return;
                }
                try {
                    const parsed = JSON.parse(body) as ImdsTokenResponse;
                    resolve(parsed.access_token);
                } catch {
                    reject(new Error(`Failed to parse IMDS token response: ${body}`));
                }
            });
        });

        req.on("timeout", () => {
            req.destroy();
            reject(new Error("IMDS token request timed out"));
        });
        req.on("error", reject);
        req.end();
    });
}
export interface IssueCredentialResponse {
    /** PEM-encoded binding certificate issued by IMDS (field name: "certificate") */
    certificate: string;
    tenant_id: string;
    client_id: string;
    /** Regional mTLS Entra auth endpoint (field name: "mtls_authentication_endpoint") */
    mtls_authentication_endpoint: string;
    identity_type?: string;
}

const ISSUE_CREDENTIAL_PATH =
    "/metadata/identity/issuecredential?cred-api-version=2.0";

/**
 * POSTs a PKCS#10 CSR (and optional MAA attestation JWT) to IMDS /issuecredential.
 * Returns the PEM binding certificate and associated identity metadata.
 *
 * This call is always plain HTTP to the link-local IMDS address — no client cert needed.
 */
export async function issueCredential(
    csrBase64: string,
    attestationToken?: string,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    correlationId: string = crypto.randomUUID()
): Promise<IssueCredentialResponse> {
    return new Promise<IssueCredentialResponse>((resolve, reject) => {
        const bodyObj: Record<string, string> = {
            csr: csrBase64,
        };
        if (attestationToken) bodyObj["attestation_token"] = attestationToken;
        const bodyStr = JSON.stringify(bodyObj);

        const options: http.RequestOptions = {
            hostname: "169.254.169.254",
            port: 80,
            path: ISSUE_CREDENTIAL_PATH,
            method: "POST",
            headers: {
                Metadata: "true",
                "Content-Type": "application/json",
                "Content-Length": String(Buffer.byteLength(bodyStr)),
                "x-ms-client-request-id": correlationId,
            },
            timeout: timeoutMs,
        };

        const req = http.request(options, (res) => {
            const chunks: Buffer[] = [];
            res.on("data", (c: Buffer) => chunks.push(c));
            res.on("end", () => {
                const body = Buffer.concat(chunks).toString("utf8");
                if (res.statusCode !== 200) {
                    reject(
                        new Error(
                            `IMDS issuecredential returned HTTP ${res.statusCode}: ${body}`
                        )
                    );
                    return;
                }
                try {
                    resolve(JSON.parse(body) as IssueCredentialResponse);
                } catch {
                    reject(
                        new Error(
                            `Failed to parse IMDS issuecredential response: ${body}`
                        )
                    );
                }
            });
        });

        req.on("timeout", () => {
            req.destroy();
            reject(new Error("IMDS issuecredential request timed out"));
        });
        req.on("error", reject);
        req.write(bodyStr);
        req.end();
    });
}
