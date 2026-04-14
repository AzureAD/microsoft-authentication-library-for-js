/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 *
 * NativeHelper.ts
 * Uses the C++ N-API addon (msal_mtls_win.node) for Windows-specific
 *
 * Flow (acquireToken):
 *   1. IMDS /getplatformmetadata  → {clientId, tenantId, cuId, mtlsAuthEndpoint}
 *   2. addon.createOrOpenKey()     → {handleId, level}   (3-level: KeyGuard/Software)
 *   3. addon.getPublicKeyDer()     → SubjectPublicKeyInfo DER
 *   4. CsrBuilder.buildCertReqInfoDer() + signHashPss → PKCS#10 CSR
 *   5. (withAttestation) addon.getAttestationToken() → MAA JWT
 *   6. IMDS /issuecredential      → binding cert PEM
 *   7. addon.makeMtlsRequest()    → Entra mTLS token endpoint → access_token
 *   8. Cache {handleId, certPem} for downstream calls
 *
 * Flow (sendRequest — downstream mTLS call):
 *   1. Look up {handleId, certPem} from identity cache
 *   2. addon.makeMtlsRequest() with cached cert+key → response
 */

import * as crypto from "crypto";
import * as os from "os";
import * as path from "path";
import { createRequire } from "module";
import {
    getPlatformMetadata,
    issueCredential,
} from "../ImdsClient.js";
import {
    buildCertReqInfoDer,
    hashCertReqInfo,
    buildFullCsr,
    type CsrOptions,
} from "./CsrBuilder.js";
// ── Request / response types (formerly in SubprocessHelper.ts) ───────────────

/** Parameters for a token acquisition request. */
interface SubprocessTokenRequest {
    resource: string;
    identityType?: "SystemAssigned" | "UserAssigned";
    identityId?: string;
    withAttestation?: boolean;
    correlationId?: string;
}

/** Parameters for a downstream mTLS HTTP request. */
interface SubprocessHttpRequest {
    url: string;
    method?: string;
    token: string;
    resource?: string;
    identityType?: "SystemAssigned" | "UserAssigned";
    identityId?: string;
    withAttestation?: boolean;
    headers?: Record<string, string>;
    body?: string;
    correlationId?: string;
}

/** JSON shape returned by a successful token acquisition. */
interface HelperTokenResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
    binding_certificate?: string;
    tenant_id?: string;
    client_id?: string;
}

/** JSON shape returned by a successful downstream HTTP call. */
interface HelperHttpResponse {
    status: number;
    headers: Record<string, string>;
    body: string;
}

// ── Addon types ───────────────────────────────────────────────────────────────

interface AddonKeyResult {
    handleId: number;
    level: "KeyGuard" | "Software";
    isVbsProtected: boolean;
}

interface AddonMtlsOpts {
    url: string;
    method: string;
    headers: Record<string, string>;
    body?: string;
    certPem: string;
    keyHandleId: number;
}

interface AddonMtlsResponse {
    status: number;
    headers: Record<string, string>;
    body: string;
}

interface MsalMtlsAddon {
    createOrOpenKey(keyName: string, forceKeyGuard?: boolean): AddonKeyResult;
    closeKey(handleId: number): void;
    getPublicKeyDer(handleId: number): Buffer;
    signHashPss(handleId: number, hash: Buffer): Buffer;
    getAttestationToken(
        handleId: number,
        attestationEndpoint: string,
        maaAuthToken: string,
        clientPayload?: string,
        clientId?: string
    ): string;
    makeMtlsRequest(opts: AddonMtlsOpts): Promise<AddonMtlsResponse>;
}

// ── Key+cert cache ────────────────────────────────────────────────────────────

interface KeyCertEntry {
    handleId: number;
    certPem: string;
    expiresAt: Date;
    tenantId: string;
    clientId: string;
    mtlsAuthEndpoint: string;
}

/** Identity cache: maps "SystemAssigned|" or "UserAssigned|<id>" → KeyCertEntry */
const _keyCertCache = new Map<string, KeyCertEntry>();

/** Token cache expiry buffer: 5 minutes (same as msal-dotnet / msal-go) */
const CERT_EXPIRY_BUFFER_MS = 5 * 60 * 1000;

function identityCacheKey(
    identityType: string,
    identityId?: string
): string {
    return `${identityType}|${identityId ?? ""}`;
}

function isCertValid(entry: KeyCertEntry): boolean {
    return entry.expiresAt.getTime() - Date.now() > CERT_EXPIRY_BUFFER_MS;
}

/** Parse the NotAfter date from a PEM certificate using Node.js crypto. */
function parseCertExpiry(certPem: string): Date {
    try {
        const cert = new crypto.X509Certificate(certPem);
        return new Date(cert.validTo);
    } catch {
        // Fallback: 23.5 hours from now (binding certs are typically 24h)
        return new Date(Date.now() + 23.5 * 60 * 60 * 1000);
    }
}

// ── Addon loader ──────────────────────────────────────────────────────────────

let _addon: MsalMtlsAddon | undefined;

/** Returns the path to the prebuilt .node binary inside this package. */
function getAddonPath(): string {
    const _req =
        typeof require !== "undefined" ? require : createRequire(import.meta.url);
    // Resolve package root (parent of lib/ in the built output)
    const pkgRoot = path.resolve(
        path.dirname(_req.resolve("./package.json")),
        ".."
    );
    return path.join(pkgRoot, "bin", "win-x64", "msal_mtls_win.node");
}

function loadAddon(): MsalMtlsAddon {
    if (_addon) return _addon;

    if (os.platform() !== "win32") {
        throw new Error(
            "MtlsManagedIdentityApplication requires Windows (x64). " +
                "The N-API addon is only supported on win32."
        );
    }
    if (os.arch() !== "x64") {
        throw new Error(
            `Unsupported architecture "${os.arch()}". Only x64 is supported.`
        );
    }

    const addonPath = getAddonPath();
    const _req =
        typeof require !== "undefined" ? require : createRequire(import.meta.url);
    try {
        _addon = _req(addonPath) as MsalMtlsAddon;
        return _addon;
    } catch (e) {
        throw new Error(
            `Failed to load msal_mtls_win.node from "${addonPath}": ${(e as Error).message}. ` +
                `Run 'npm run build:native' in the msal-node-mtls-extensions package.`
        );
    }
}

// ── URL helpers ───────────────────────────────────────────────────────────────

/** Normalize an mtlsAuthEndpoint (hostname or URL) to an https:// base URL. */
function normalizeEndpoint(endpoint?: string): string {
    if (!endpoint) return "https://mtlsauth.microsoft.com";
    if (endpoint.startsWith("https://") || endpoint.startsWith("http://"))
        return endpoint;
    return `https://${endpoint}`;
}

/** Build the scope from a resource URI (e.g. "https://graph.microsoft.com/"). */
function toScope(resource: string): string {
    const base = resource.replace(/\/+$/, "");
    if (base.endsWith("/.default")) return base;
    return `${base}/.default`;
}

// ── Core token acquisition ────────────────────────────────────────────────────

/**
 * Acquires an mTLS PoP token using the N-API addon.
 * Implements the full flow: IMDS metadata → key → CSR → credential → Entra token.
 */
export async function runHelper(
    request: SubprocessTokenRequest
): Promise<HelperTokenResponse> {
    const addon = loadAddon();
    const correlationId = request.correlationId ?? crypto.randomUUID();

    // ── Step 1: Platform metadata ─────────────────────────────────────────────
    const meta = await getPlatformMetadata(5000, correlationId);
    const { clientId, tenantId, cuId, vmssId } = meta;
    const mtlsAuthEndpoint = normalizeEndpoint(meta.mtlsAuthEndpoint);

    // ── Check key+cert cache (cert lives much longer than the access token) ───
    const idKey = identityCacheKey(
        request.identityType ?? "SystemAssigned",
        request.identityId
    );
    let keyCertEntry = _keyCertCache.get(idKey);

    let handleId: number;
    let certPem: string;

    if (keyCertEntry && isCertValid(keyCertEntry)) {
        // Reuse existing key handle and binding cert
        handleId = keyCertEntry.handleId;
        certPem = keyCertEntry.certPem;
    } else {
        // ── Step 2: Create/open CNG key ───────────────────────────────────────
        const keyName = `MSALMtlsKey_${cuId}`;
        const keyResult = addon.createOrOpenKey(keyName);
        handleId = keyResult.handleId;

        // ── Step 3: Export public key ─────────────────────────────────────────
        const pubKeyDer = addon.getPublicKeyDer(handleId);

        // ── Step 4: Build and sign CSR ────────────────────────────────────────
        const csrOpts: CsrOptions = { clientId, tenantId, cuId, vmssId, pubKeyDer };
        const certReqInfoDer = buildCertReqInfoDer(csrOpts);
        const hashBuf = hashCertReqInfo(certReqInfoDer);
        const signature = addon.signHashPss(handleId, hashBuf);
        const csrBase64 = buildFullCsr(certReqInfoDer, signature);

        // ── Step 5: Attestation (optional) ───────────────────────────────────
        let attestationToken: string | undefined;
        if (request.withAttestation && meta.attestationEndpoint && keyResult.isVbsProtected) {
            try {
                // Pass empty string for auth_token — AttestationClientLib.dll acquires
                // the MAA token internally via managed identity (same VM context).
                // Pass empty string for client_payload to match MSAL.NET behavior
                // (AttestationClient.cs passes null for both auth_token and client_payload).
                const clientPayload = "";
                const jwt = addon.getAttestationToken(
                    handleId,
                    meta.attestationEndpoint,
                    "",               // auth_token: empty → DLL fetches internally
                    clientPayload,
                    clientId
                );
                if (jwt) attestationToken = jwt;
            } catch (e) {
                // Attestation failure is non-fatal — proceed without it
                console.warn(
                    `[msal-node-mtls] Attestation failed (proceeding without): ${(e as Error).message}`
                );
            }
        }

        // ── Step 6: Issue credential (IMDS) ──────────────────────────────────
        const credResp = await issueCredential(
            csrBase64,
            attestationToken,
            5000,
            correlationId
        );
        // IMDS returns the certificate as base64 DER — wrap it in PEM markers.
        const b64 = credResp.certificate.replace(/\s/g, "");
        certPem = `-----BEGIN CERTIFICATE-----\n${b64.match(/.{1,64}/g)!.join("\n")}\n-----END CERTIFICATE-----`;

        // Cache key+cert
        const expiresAt = parseCertExpiry(certPem);
        keyCertEntry = {
            handleId,
            certPem,
            expiresAt,
            tenantId: credResp.tenant_id || tenantId,
            clientId: credResp.client_id || clientId,
            mtlsAuthEndpoint:
                normalizeEndpoint(credResp.mtls_authentication_endpoint) || mtlsAuthEndpoint,
        };
        _keyCertCache.set(idKey, keyCertEntry);
    }

    // ── Step 7: Acquire token from Entra mTLS endpoint ────────────────────────
    const tokenUrl = `${keyCertEntry.mtlsAuthEndpoint}/${keyCertEntry.tenantId}/oauth2/v2.0/token`;
    const scope = toScope(request.resource);
    const tokenBody =
        `client_id=${encodeURIComponent(keyCertEntry.clientId)}` +
        `&scope=${encodeURIComponent(scope)}` +
        `&grant_type=client_credentials` +
        `&token_type=mtls_pop`;

    const tokenResp = await addon.makeMtlsRequest({
        url: tokenUrl,
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "x-ms-client-request-id": correlationId,
        },
        body: tokenBody,
        certPem: keyCertEntry.certPem,
        keyHandleId: handleId,
    });

    if (tokenResp.status !== 200) {
        throw Object.assign(
            new Error(
                `Entra mTLS token request failed: HTTP ${tokenResp.status}: ${tokenResp.body}`
            ),
            { errorCode: "mtls_token_request_failed" }
        );
    }

    let tokenJson: {
        access_token: string;
        token_type: string;
        expires_in: number;
        [k: string]: unknown;
    };
    try {
        tokenJson = JSON.parse(tokenResp.body);
    } catch {
        throw new Error(
            `Failed to parse Entra token response: ${tokenResp.body}`
        );
    }

    if (tokenJson.error) {
        throw Object.assign(
            new Error(
                `Entra mTLS error: ${tokenJson.error}: ${tokenJson.error_description ?? ""}`
            ),
            { errorCode: String(tokenJson.error) }
        );
    }

    return {
        access_token: tokenJson.access_token,
        token_type: "mtls_pop",
        expires_in: tokenJson.expires_in,
        binding_certificate: keyCertEntry.certPem,
        tenant_id: keyCertEntry.tenantId,
        client_id: keyCertEntry.clientId,
    };
}

// ── Downstream mTLS call ──────────────────────────────────────────────────────

/**
 * Makes a downstream mTLS call using the cached binding cert+key.
 * Caller must have called runHelper() first to populate the cache.
 */
export async function runHelperHttpRequest(
    request: SubprocessHttpRequest
): Promise<HelperHttpResponse> {
    const addon = loadAddon();
    const correlationId = request.correlationId ?? crypto.randomUUID();

    const idKey = identityCacheKey(
        request.identityType ?? "SystemAssigned",
        request.identityId
    );
    const entry = _keyCertCache.get(idKey);
    if (!entry) {
        throw new Error(
            "No binding cert available for mTLS downstream call. " +
                "Call acquireToken() first to obtain a binding certificate."
        );
    }
    if (!isCertValid(entry)) {
        // Cert expired — invalidate cache; caller should re-acquire
        _keyCertCache.delete(idKey);
        throw new Error(
            "Binding certificate has expired. Call acquireToken() again to refresh."
        );
    }

    const headers: Record<string, string> = {
        "x-ms-client-request-id": correlationId,
        ...request.headers,
    };
    // Inject Authorization header if not already present
    const hasAuth = Object.keys(headers).some(
        (k) => k.toLowerCase() === "authorization"
    );
    if (!hasAuth && request.token) {
        headers["Authorization"] = `mtls_pop ${request.token}`;
    }

    const resp = await addon.makeMtlsRequest({
        url: request.url,
        method: request.method ?? "GET",
        headers,
        body: request.body,
        certPem: entry.certPem,
        keyHandleId: entry.handleId,
    });

    return {
        status: resp.status,
        headers: resp.headers,
        body: resp.body,
    };
}

/** Clear the key+cert cache (e.g. after cert rotation). */
export function clearNativeCache(): void {
    _keyCertCache.clear();
}

/** Check if the native addon is loadable on this platform. */
export function isNativeAddonAvailable(): boolean {
    if (os.platform() !== "win32" || os.arch() !== "x64") return false;
    try {
        loadAddon();
        return true;
    } catch {
        return false;
    }
}
