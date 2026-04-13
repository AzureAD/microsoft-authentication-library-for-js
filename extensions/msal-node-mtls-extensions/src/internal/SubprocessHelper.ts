/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as path from "path";
import * as child_process from "child_process";
import * as os from "os";
import { createRequire } from "module";

/** Lazily resolved package root (parent of lib/ or dist/). Cached after first call. */
let _pkgRoot: string | undefined;

function getPkgRoot(): string {
    if (_pkgRoot) return _pkgRoot;
    const _req =
        typeof require !== "undefined" ? require : createRequire(import.meta.url);
    _pkgRoot = path.resolve(
        path.dirname(_req.resolve("./package.json")),
        ".."
    );
    return _pkgRoot;
}

/** Lazily resolved require (CJS or ESM-compatible). */
function getRequire() {
    return typeof require !== "undefined"
        ? require
        : createRequire(import.meta.url);
}

/** JSON output written to stdout by MsalMtlsMsiHelper.exe on success (token mode). */
export interface HelperTokenResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
    binding_certificate?: string;
    tenant_id?: string;
    client_id?: string;
}

/** JSON output written to stdout by MsalMtlsMsiHelper.exe (http-request mode). */
export interface HelperHttpResponse {
    status: number;
    headers: Record<string, string>;
    body: string;
}

/** JSON written to stderr by MsalMtlsMsiHelper.exe on failure. */
interface HelperErrorResponse {
    error: string;
    error_description: string;
}

export interface SubprocessTokenRequest {
    resource: string;
    identityType?: "SystemAssigned" | "UserAssigned";
    identityId?: string;
    withAttestation?: boolean;
    correlationId?: string;
    helperPath?: string;
}

export interface SubprocessHttpRequest {
    url: string;
    method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    token: string;
    headers?: Record<string, string>;
    body?: string;
    contentType?: string;
    /**
     * The Azure resource URI the token was issued for (e.g. "https://graph.microsoft.com/").
     * The subprocess uses this to look up the matching KeyGuard-bound certificate.
     * When omitted, the subprocess falls back to deriving it from the URL's origin,
     * which is almost always wrong for downstream calls to non-Azure endpoints.
     */
    resource?: string;
    identityType?: "SystemAssigned" | "UserAssigned";
    identityId?: string;
    withAttestation?: boolean;
    correlationId?: string;
    allowInsecureTls?: boolean;
    helperPath?: string;
}

function tryAutoDiscoverKeyAttestation(): string | undefined {
    try {
        const ka = getRequire()("@azure/msal-node-key-attestation") as {
            getHelperPath?: () => string;
        };
        if (typeof ka.getHelperPath === "function") {
            return ka.getHelperPath();
        }
    } catch {
        // Package not installed — expected when using core only.
    }
    return undefined;
}

export function getHelperPath(explicitPath?: string): string {
    if (explicitPath) return explicitPath;
    if (process.env.MSAL_MTLS_HELPER_PATH) {
        return process.env.MSAL_MTLS_HELPER_PATH;
    }
    const discovered = tryAutoDiscoverKeyAttestation();
    if (discovered) return discovered;

    if (os.platform() !== "win32") {
        throw new Error(
            "Managed Identity mTLS PoP is only supported on Windows. " +
                "Install @azure/msal-node-key-attestation to get the pre-built binary."
        );
    }
    const arch = os.arch();
    if (!["x64"].includes(arch)) {
        throw new Error(
            `Unsupported architecture "${arch}" for Managed Identity mTLS PoP. ` +
                "Only x64 is currently supported."
        );
    }
    return path.join(getPkgRoot(), "bin", `win-${arch}`, "MsalMtlsMsiHelper.exe");
}

export function runHelper(
    helperPath: string,
    request: SubprocessTokenRequest
): Promise<HelperTokenResponse> {
    return new Promise((resolve, reject) => {
        const args: string[] = [
            "--resource", request.resource,
            "--identity-type", request.identityType ?? "SystemAssigned",
        ];
        if (request.identityType === "UserAssigned" && request.identityId) {
            args.push("--identity-id", request.identityId);
        }
        if (request.withAttestation) args.push("--with-attestation");
        if (request.correlationId) args.push("--correlation-id", request.correlationId);

        const proc = child_process.spawn(helperPath, args, {
            stdio: ["ignore", "pipe", "pipe"],
            windowsHide: true,
        });

        const out: Buffer[] = [];
        const err: Buffer[] = [];
        proc.stdout.on("data", (c: Buffer) => out.push(c));
        proc.stderr.on("data", (c: Buffer) => err.push(c));

        proc.on("error", (e) =>
            reject(new Error(`Failed to spawn MsalMtlsMsiHelper: ${e.message}. Path: ${helperPath}`))
        );
        proc.on("close", (code) => {
            if (code === 0) {
                const stdout = Buffer.concat(out).toString("utf8").trim();
                try {
                    resolve(JSON.parse(stdout) as HelperTokenResponse);
                } catch {
                    reject(new Error(`MsalMtlsMsiHelper produced invalid JSON: ${stdout}`));
                }
            } else {
                const stderr = Buffer.concat(err).toString("utf8").trim();
                let errorCode = "mtls_msi_helper_error";
                let errorDescription = `MsalMtlsMsiHelper exited with code ${code}: ${stderr}`;
                try {
                    const parsed = JSON.parse(stderr) as HelperErrorResponse;
                    errorCode = parsed.error;
                    errorDescription = parsed.error_description;
                } catch { /* use raw text */ }
                reject(Object.assign(new Error(errorDescription), { errorCode }));
            }
        });
    });
}

export function runHelperHttpRequest(
    helperPath: string,
    request: SubprocessHttpRequest
): Promise<HelperHttpResponse> {
    return new Promise((resolve, reject) => {
        const args: string[] = [
            "--mode", "http-request",
            "--url", request.url,
            "--method", request.method ?? "GET",
            "--token", request.token,
            "--identity-type", request.identityType ?? "SystemAssigned",
        ];
        if (request.resource) args.push("--resource", request.resource);
        if (request.identityType === "UserAssigned" && request.identityId) {
            args.push("--identity-id", request.identityId);
        }
        if (request.body) args.push("--body", request.body);
        if (request.contentType) args.push("--content-type", request.contentType);
        for (const [k, v] of Object.entries(request.headers ?? {})) {
            args.push("--header", `${k}: ${v}`);
        }
        if (request.withAttestation) args.push("--with-attestation");
        if (request.correlationId) args.push("--correlation-id", request.correlationId);
        if (request.allowInsecureTls || process.env.MSAL_MTLS_ALLOW_INSECURE_TLS === "1") {
            args.push("--allow-insecure-tls");
        }

        const proc = child_process.spawn(helperPath, args, {
            stdio: ["ignore", "pipe", "pipe"],
            windowsHide: true,
        });

        const out: Buffer[] = [];
        const err: Buffer[] = [];
        proc.stdout.on("data", (c: Buffer) => out.push(c));
        proc.stderr.on("data", (c: Buffer) => err.push(c));

        proc.on("error", (e) =>
            reject(new Error(`Failed to spawn MsalMtlsMsiHelper: ${e.message}. Path: ${helperPath}`))
        );
        proc.on("close", (code) => {
            if (code === 0) {
                const stdout = Buffer.concat(out).toString("utf8").trim();
                try {
                    resolve(JSON.parse(stdout) as HelperHttpResponse);
                } catch {
                    reject(new Error(`MsalMtlsMsiHelper produced invalid JSON: ${stdout}`));
                }
            } else {
                const stderr = Buffer.concat(err).toString("utf8").trim();
                let errorCode = "mtls_msi_helper_error";
                let errorDescription = `MsalMtlsMsiHelper exited with code ${code}: ${stderr}`;
                try {
                    const parsed = JSON.parse(stderr) as HelperErrorResponse;
                    errorCode = parsed.error;
                    errorDescription = parsed.error_description;
                } catch { /* use raw text */ }
                reject(Object.assign(new Error(errorDescription), { errorCode }));
            }
        });
    });
}
