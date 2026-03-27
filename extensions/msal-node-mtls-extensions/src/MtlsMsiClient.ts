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
import { getPlatformMetadata } from "./ImdsClient.js";

// Resolve __dirname for both CJS (test/jest) and ESM (runtime) contexts.
// In CJS environments require is defined; in ESM we need import.meta.url.
const _require =
    typeof require !== "undefined" ? require : createRequire(import.meta.url);
const _dirname = path.dirname(_require.resolve("./index.js"));

/**
 * Options for {@link MtlsMsiClient.acquireToken}.
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
}

/** JSON output written to stdout by MsalMtlsMsiHelper.exe on success. */
interface HelperTokenResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
    binding_certificate?: string;
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

    const arch = os.arch(); // "x64" or "arm64"
    const supportedArches = ["x64", "arm64"];
    if (!supportedArches.includes(arch)) {
        throw new Error(
            `Unsupported architecture "${arch}" for Managed Identity mTLS PoP. ` +
                `Supported: ${supportedArches.join(", ")}.`
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
 * This function:
 * 1. Calls IMDS `/metadata/identity/getplatformmetadata` (plain HTTP)
 * 2. Spawns `MsalMtlsMsiHelper.exe` which handles all Windows-specific steps:
 *    - KeyGuard RSA key creation (Windows CNG / VBS)
 *    - CSR generation and IMDS `/issuecredential` call
 *    - Optional MAA attestation (`--with-attestation`)
 *    - mTLS token request to the regional STS endpoint
 * 3. Returns a standard `AuthenticationResult`-shaped object
 *
 * @remarks
 * **Windows only.** The KeyGuard RSA key used to authenticate the mTLS TLS
 * handshake is a non-exportable hardware-backed key backed by Windows VBS.
 * It cannot be created or used from Node.js directly.
 *
 * The returned `bindingCertificate` is the public X.509 certificate (PEM)
 * that Entra STS bound to the access token.  Include it in mTLS connections
 * to downstream services that validate PoP binding.
 */
export async function acquireMtlsMsiToken(
    request: MtlsMsiTokenRequest
): Promise<AuthenticationResult> {
    const helperPath = getHelperPath();

    // Fetch IMDS metadata first to get tenantId/clientId for correlation.
    // The helper also fetches it internally; this call is for building
    // AuthenticationResult fields only. It can be skipped if not needed.
    let tenantId: string | undefined;
    try {
        const metadata = await getPlatformMetadata();
        tenantId = metadata.tenantId;
    } catch {
        // Non-fatal — helper will fetch it independently
    }

    const helperResult = await runHelper(helperPath, request);

    const expiresOn = new Date(
        Date.now() + helperResult.expires_in * 1000
    );

    return {
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
}
