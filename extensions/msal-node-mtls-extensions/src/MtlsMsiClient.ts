/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as path from "path";
import * as child_process from "child_process";
import * as os from "os";
import { createRequire } from "module";
import { AuthenticationScheme } from "@azure/msal-node";
import type { AuthenticationResult } from "@azure/msal-node";

// Resolve __dirname for both CJS (test/jest) and ESM (runtime) contexts.
// In CJS environments require is defined; in ESM we need import.meta.url.
const _require =
    typeof require !== "undefined" ? require : createRequire(import.meta.url);
// The ESM build produces index.mjs; the CJS bundle produces index.js.
// Try both so the same code works in both module systems.
let _dirname: string;
try {
    _dirname = path.dirname(_require.resolve("./index.mjs"));
} catch {
    _dirname = path.dirname(_require.resolve("./index.js"));
}

/**
 * How many seconds before `expiresOn` to treat a cached token as expired.
 * Matches msal-dotnet's default proactive refresh window.
 */
const EXPIRY_BUFFER_SECONDS = 300; // 5 minutes

/** Per-process in-memory token cache. Module-level singleton. */
const tokenCache = new Map<string, AuthenticationResult>();

/**
 * Builds the cache key for a token request.
 * Includes all fields that would produce a different token.
 */
function cacheKey(request: MtlsMsiTokenRequest): string {
    return [
        request.resource,
        request.identityType ?? "SystemAssigned",
        request.identityId ?? "",
        String(request.withAttestation ?? false),
    ].join(":");
}

/**
 * Returns true if a cached result is still valid (not within the expiry buffer).
 */
function isCacheHit(result: AuthenticationResult): boolean {
    if (!result.expiresOn) return false;
    const bufferMs = EXPIRY_BUFFER_SECONDS * 1000;
    return result.expiresOn.getTime() - Date.now() > bufferMs;
}

/**
 * Clears the in-memory token cache.
 * Useful for testing or when you know the binding certificate has been rotated.
 */
export function clearMtlsMsiTokenCache(): void {
    tokenCache.clear();
}

/**
 * Options for {@link acquireMtlsMsiToken}.
 */
export interface MtlsMsiTokenRequest {
    /** Azure resource URI, e.g. "https://management.azure.com/" */
    resource: string;
    /**
     * Whether to include KeyGuard attestation (MAA JWT) in the credential
     * issuance request.  Requires that the VM supports VBS.
     * @default false
     */
    withAttestation?: boolean;
    /**
     * Identity type for the managed identity.
     * @default "SystemAssigned"
     */
    identityType?: "SystemAssigned" | "UserAssigned";
    /**
     * Client ID or resource ID for user-assigned managed identities.
     * Required when identityType is "UserAssigned".
     */
    identityId?: string;
    /** Optional correlation ID (GUID) for telemetry. */
    correlationId?: string;
    /**
     * When true, bypass the in-memory cache and always acquire a fresh token.
     * @default false
     */
    forceRefresh?: boolean;
}

/** JSON output written to stdout by MsalMtlsMsiHelper.exe on success. */
interface HelperTokenResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
    binding_certificate?: string;
    tenant_id?: string;
    client_id?: string;
}

/** JSON written to stderr by MsalMtlsMsiHelper.exe on failure. */
interface HelperErrorResponse {
    error: string;
    error_description: string;
}

/**
 * Returns the absolute path to the pre-built MsalMtlsMsiHelper binary
 * for the current OS architecture.
 *
 * Binaries are bundled under `bin/{arch}/MsalMtlsMsiHelper.exe`
 * (relative to this package root) following the same pattern used by
 * `@azure/msal-node-extensions` for its WAM broker binaries.
 */
function getHelperPath(): string {
    if (os.platform() !== "win32") {
        throw new Error(
            "Managed Identity mTLS PoP is only supported on Windows. " +
                "The MsalMtlsMsiHelper requires Windows VBS/KeyGuard for hardware-backed key creation."
        );
    }

    const arch = os.arch();
    const supportedArches = ["x64"];
    if (!supportedArches.includes(arch)) {
        throw new Error(
            `Unsupported architecture "${arch}" for Managed Identity mTLS PoP. ` +
                `Only x64 is currently supported (arm64 is not yet validated).`
        );
    }

    // The binary is at <package root>/bin/win-{arch}/MsalMtlsMsiHelper.exe
    // __dirname resolves to the `dist/` folder at runtime; go up one level.
    return path.join(
        _dirname,
        "..",
        "bin",
        `win-${arch}`,
        "MsalMtlsMsiHelper.exe"
    );
}

/**
 * Spawns the `MsalMtlsMsiHelper.exe` subprocess and parses its JSON output.
 */
function runHelper(
    helperPath: string,
    request: MtlsMsiTokenRequest
): Promise<HelperTokenResponse> {
    return new Promise((resolve, reject) => {
        const args: string[] = [
            "--resource",
            request.resource,
            "--identity-type",
            request.identityType ?? "SystemAssigned",
        ];

        if (
            request.identityType === "UserAssigned" &&
            request.identityId
        ) {
            args.push("--identity-id", request.identityId);
        }

        if (request.withAttestation) {
            args.push("--with-attestation");
        }

        if (request.correlationId) {
            args.push("--correlation-id", request.correlationId);
        }

        const proc = child_process.spawn(helperPath, args, {
            stdio: ["ignore", "pipe", "pipe"],
            windowsHide: true,
        });

        const stdoutChunks: Buffer[] = [];
        const stderrChunks: Buffer[] = [];

        proc.stdout.on("data", (chunk: Buffer) => stdoutChunks.push(chunk));
        proc.stderr.on("data", (chunk: Buffer) => stderrChunks.push(chunk));

        proc.on("error", (err) => {
            reject(
                new Error(
                    `Failed to spawn MsalMtlsMsiHelper: ${err.message}. ` +
                        `Ensure the binary exists at: ${helperPath}`
                )
            );
        });

        proc.on("close", (code) => {
            if (code === 0) {
                const stdout = Buffer.concat(stdoutChunks).toString("utf8").trim();
                try {
                    resolve(JSON.parse(stdout) as HelperTokenResponse);
                } catch {
                    reject(
                        new Error(
                            `MsalMtlsMsiHelper produced invalid JSON: ${stdout}`
                        )
                    );
                }
            } else {
                const stderr = Buffer.concat(stderrChunks).toString("utf8").trim();
                let errorCode = "mtls_msi_helper_error";
                let errorDescription = `MsalMtlsMsiHelper exited with code ${code}: ${stderr}`;
                try {
                    const parsed = JSON.parse(stderr) as HelperErrorResponse;
                    errorCode = parsed.error;
                    errorDescription = parsed.error_description;
                } catch {
                    // stderr was not JSON; use raw text
                }
                reject(Object.assign(new Error(errorDescription), { errorCode }));
            }
        });
    });
}

/**
 * Acquires an mTLS PoP access token for a Windows Managed Identity.
 *
 * Results are cached in memory (per process) and reused until 5 minutes
 * before expiry — matching msal-dotnet's default proactive refresh window.
 * Pass `forceRefresh: true` to bypass the cache.
 *
 * This function:
 * 1. Returns a cached token if one exists and is not near expiry.
 * 2. Spawns `MsalMtlsMsiHelper.exe` which handles all Windows-specific steps:
 *    - KeyGuard RSA key creation (Windows CNG / VBS)
 *    - CSR generation and IMDS `/issuecredential` call
 *    - Optional MAA attestation (`--with-attestation`)
 *    - mTLS token request to the regional STS endpoint
 *    - Returns `tenant_id` and `client_id` in the JSON response
 * 3. Caches the result and returns a standard `AuthenticationResult`.
 *
 * @remarks
 * **Windows only.** The KeyGuard RSA key used to authenticate the mTLS TLS
 * handshake is a non-exportable hardware-backed key backed by Windows VBS.
 * It cannot be created or used from Node.js directly.
 *
 * The returned `bindingCertificate` is the public X.509 certificate (PEM)
 * that Entra STS bound to the access token. Include it in mTLS connections
 * to downstream services that validate PoP binding.
 */
export async function acquireMtlsMsiToken(
    request: MtlsMsiTokenRequest
): Promise<AuthenticationResult> {
    const key = cacheKey(request);

    // Return cached token if valid and forceRefresh not requested
    if (!request.forceRefresh) {
        const cached = tokenCache.get(key);
        if (cached && isCacheHit(cached)) {
            return { ...cached, fromCache: true };
        }
    }

    const helperPath = getHelperPath();

    const helperResult = await runHelper(helperPath, request);

    const tenantId = helperResult.tenant_id;
    const expiresOn = new Date(
        Date.now() + helperResult.expires_in * 1000
    );

    const result: AuthenticationResult = {
        authority: tenantId
            ? `https://login.microsoftonline.com/${tenantId}`
            : "https://login.microsoftonline.com/common",
        uniqueId: "",
        tenantId: tenantId ?? "",
        scopes: [request.resource],
        account: null,
        idToken: "",
        idTokenClaims: {},
        accessToken: helperResult.access_token,
        fromCache: false,
        expiresOn,
        tokenType: AuthenticationScheme.MTLS_POP,
        correlationId: request.correlationId ?? "",
        extExpiresOn: expiresOn,
        bindingCertificate: helperResult.binding_certificate,
    };

    tokenCache.set(key, result);
    return result;
}

/**
 * Options for {@link makeMtlsMsiRequest}.
 */
export interface MtlsMsiRequestOptions {
    /** Full URL to call (e.g. "https://graph.microsoft.com/v1.0/me"). */
    url: string;
    /** HTTP method. @default "GET" */
    method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    /**
     * The `mtls_pop` access token to send as the `Authorization: mtls_pop <token>` header.
     * Obtain this from {@link acquireMtlsMsiToken}.
     */
    token: string;
    /**
     * Additional HTTP headers to include in the request.
     * Each entry is a `"Name: Value"` string.
     */
    headers?: string[];
    /** Request body (for POST/PUT/PATCH). */
    body?: string;
    /** Content-Type header. @default "application/json" */
    contentType?: string;
    /**
     * The Azure resource URI that scopes the KeyGuard certificate lookup.
     * Defaults to the origin of `url` if not provided.
     */
    resource?: string;
    /** Identity type for the managed identity. @default "SystemAssigned" */
    identityType?: "SystemAssigned" | "UserAssigned";
    /** Client ID or resource ID for user-assigned managed identities. */
    identityId?: string;
    /** Include KeyGuard attestation when re-retrieving the binding cert. @default false */
    withAttestation?: boolean;
    /** Optional correlation ID (GUID) for telemetry. */
    correlationId?: string;
}

/**
 * The HTTP response returned by {@link makeMtlsMsiRequest}.
 */
export interface MtlsMsiResponse {
    /** HTTP status code (e.g. 200, 403). */
    status: number;
    /** Response headers as a flat key-value map. */
    headers: Record<string, string>;
    /** Response body as a string. */
    body: string;
}

/** JSON output written to stdout by MsalMtlsMsiHelper.exe in http-request mode. */
interface HelperHttpResponse {
    status: number;
    headers: Record<string, string>;
    body: string;
}

/**
 * Spawns `MsalMtlsMsiHelper.exe --mode http-request` to make a downstream
 * HTTP call over mTLS using the KeyGuard-bound certificate.
 */
function runHelperHttpRequest(
    helperPath: string,
    options: MtlsMsiRequestOptions
): Promise<HelperHttpResponse> {
    return new Promise((resolve, reject) => {
        const args: string[] = [
            "--mode", "http-request",
            "--url", options.url,
            "--method", options.method ?? "GET",
            "--token", options.token,
            "--identity-type", options.identityType ?? "SystemAssigned",
        ];

        if (options.resource) {
            args.push("--resource", options.resource);
        }

        if (options.identityType === "UserAssigned" && options.identityId) {
            args.push("--identity-id", options.identityId);
        }

        if (options.body) {
            args.push("--body", options.body);
        }

        if (options.contentType) {
            args.push("--content-type", options.contentType);
        }

        for (const header of options.headers ?? []) {
            args.push("--header", header);
        }

        if (options.withAttestation) {
            args.push("--with-attestation");
        }

        if (options.correlationId) {
            args.push("--correlation-id", options.correlationId);
        }

        const proc = child_process.spawn(helperPath, args, {
            stdio: ["ignore", "pipe", "pipe"],
            windowsHide: true,
        });

        const stdoutChunks: Buffer[] = [];
        const stderrChunks: Buffer[] = [];

        proc.stdout.on("data", (chunk: Buffer) => stdoutChunks.push(chunk));
        proc.stderr.on("data", (chunk: Buffer) => stderrChunks.push(chunk));

        proc.on("error", (err) => {
            reject(
                new Error(
                    `Failed to spawn MsalMtlsMsiHelper: ${err.message}. ` +
                        `Ensure the binary exists at: ${helperPath}`
                )
            );
        });

        proc.on("close", (code) => {
            if (code === 0) {
                const stdout = Buffer.concat(stdoutChunks).toString("utf8").trim();
                try {
                    resolve(JSON.parse(stdout) as HelperHttpResponse);
                } catch {
                    reject(new Error(`MsalMtlsMsiHelper produced invalid JSON: ${stdout}`));
                }
            } else {
                const stderr = Buffer.concat(stderrChunks).toString("utf8").trim();
                let errorCode = "mtls_msi_helper_error";
                let errorDescription = `MsalMtlsMsiHelper exited with code ${code}: ${stderr}`;
                try {
                    const parsed = JSON.parse(stderr) as HelperErrorResponse;
                    errorCode = parsed.error;
                    errorDescription = parsed.error_description;
                } catch {
                    // stderr was not JSON; use raw text
                }
                reject(Object.assign(new Error(errorDescription), { errorCode }));
            }
        });
    });
}

/**
 * Makes a downstream HTTP call over mTLS using the KeyGuard-bound certificate.
 *
 * Because the KeyGuard private key is non-exportable from Windows CNG,
 * Node.js cannot open a mutual-TLS connection with it directly. This function
 * delegates the HTTP call to `MsalMtlsMsiHelper.exe`, which re-retrieves the
 * KeyGuard certificate and makes the request using .NET's `HttpClient` with
 * `SslClientCertificates` — the same approach msal-dotnet uses internally.
 *
 * The token must have been previously acquired via {@link acquireMtlsMsiToken}.
 *
 * @example
 * ```typescript
 * const tokenResult = await acquireMtlsMsiToken({ resource: "https://graph.microsoft.com/" });
 *
 * const response = await makeMtlsMsiRequest({
 *     url: "https://graph.microsoft.com/v1.0/me",
 *     token: tokenResult.accessToken,
 * });
 *
 * console.log(response.status); // 200
 * console.log(JSON.parse(response.body));
 * ```
 *
 * @remarks
 * **Windows only.** Requires the same VM and Managed Identity configuration
 * as {@link acquireMtlsMsiToken}.
 */
export async function makeMtlsMsiRequest(
    options: MtlsMsiRequestOptions
): Promise<MtlsMsiResponse> {
    const helperPath = getHelperPath();
    return runHelperHttpRequest(helperPath, options);
}

