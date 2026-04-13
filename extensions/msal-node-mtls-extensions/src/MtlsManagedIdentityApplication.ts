/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthenticationScheme } from "@azure/msal-node";
import type {
    AuthenticationResult,
    ManagedIdentityIdParams,
    ManagedIdentityRequestParams,
    NetworkRequestOptions,
    NetworkResponse,
} from "@azure/msal-node";
import type { LoggerOptions } from "@azure/msal-common/node";
import {
    getHelperPath,
    runHelper,
    runHelperHttpRequest,
} from "./internal/SubprocessHelper.js";

/** How many seconds before `expiresOn` to treat a cached token as stale. */
const EXPIRY_BUFFER_SECONDS = 300;

/**
 * Configuration for {@link MtlsManagedIdentityApplication}.
 *
 * Mirrors {@link ManagedIdentityConfiguration} with the following differences:
 * - `system.networkClient` is intentionally absent — WinHTTP is mandatory for
 *   the KeyGuard mTLS handshake; the private key is non-exportable and cannot
 *   be presented to Node.js's TLS stack.
 * - `withAttestation` enables inclusion of a MAA (Microsoft Azure Attestation)
 *   JWT in the IMDS credential-issuance request (required on VMs configured to
 *   mandate attestation proofs).
 *
 * **Proxy:** WinHTTP respects the Windows system proxy configuration set via
 * `netsh winhttp set proxy` or WPAD. Custom `INetworkModule` implementations
 * cannot be used because the KeyGuard key is non-exportable.
 * @public
 */
export type MtlsManagedIdentityConfiguration = {
    /** Additional client capabilities to include in token requests. */
    clientCapabilities?: Array<string>;
    /**
     * Managed identity ID parameters for user-assigned identities.
     * Omit for system-assigned managed identity.
     */
    managedIdentityIdParams?: ManagedIdentityIdParams;
    system?: {
        /** Logger options for diagnostic output. */
        loggerOptions?: LoggerOptions;
        /**
         * Disable MSAL's automatic HTTP retry behaviour.
         * @default false
         */
        disableInternalRetries?: boolean;
    };
    /**
     * When `true`, a MAA (Microsoft Azure Attestation) JWT is included in the
     * IMDS `/issuecredential` request.  Required on Trusted Launch VMs that
     * are configured to mandate attestation proofs for KeyGuard key binding.
     * @default false
     */
    withAttestation?: boolean;
    /**
     * Explicit path to the `MsalMtlsMsiHelper.exe` binary.
     *
     * When omitted, the path is resolved automatically:
     * 1. `MSAL_MTLS_HELPER_PATH` environment variable
     * 2. `@azure/msal-node-key-attestation` package (if installed)
     * 3. `bin/win-x64/MsalMtlsMsiHelper.exe` inside this package (legacy)
     */
    helperPath?: string;
};

/** Resolved, normalised internal config. */
interface ResolvedConfig {
    identityType: "SystemAssigned" | "UserAssigned";
    identityId?: string;
    withAttestation: boolean;
    helperPath: string;
}

function resolveConfig(
    config?: MtlsManagedIdentityConfiguration
): ResolvedConfig {
    const params = config?.managedIdentityIdParams;
    const identityId =
        params?.userAssignedClientId ??
        params?.userAssignedResourceId ??
        params?.userAssignedObjectId;
    const identityType: "SystemAssigned" | "UserAssigned" = identityId
        ? "UserAssigned"
        : "SystemAssigned";

    return {
        identityType,
        identityId,
        withAttestation: config?.withAttestation ?? false,
        helperPath: getHelperPath(config?.helperPath),
    };
}

function cacheKey(cfg: ResolvedConfig, resource: string): string {
    return [
        resource,
        cfg.identityType,
        cfg.identityId ?? "",
        String(cfg.withAttestation),
    ].join(":");
}

function isCacheHit(result: AuthenticationResult): boolean {
    if (!result.expiresOn) return false;
    return result.expiresOn.getTime() - Date.now() > EXPIRY_BUFFER_SECONDS * 1000;
}

/**
 * Managed Identity application for Windows mTLS Proof-of-Possession.
 *
 * Provides a single object for both token acquisition and downstream mTLS
 * calls — no separate network client configuration required.  Internally uses
 * `MsalMtlsMsiHelper.exe` (from `@azure/msal-node-key-attestation`) for all
 * Windows-specific operations (KeyGuard CNG key, IMDS credential issuance,
 * WinHTTP mTLS).
 *
 * @example
 * ```typescript
 * import { MtlsManagedIdentityApplication } from "@azure/msal-node-mtls-extensions";
 *
 * const app = new MtlsManagedIdentityApplication({ withAttestation: true });
 *
 * // Acquire an mTLS PoP token
 * const tokenResult = await app.acquireToken({
 *     resource: "https://management.azure.com/",
 * });
 *
 * // Call a downstream API over mTLS using the same object
 * const response = await app.sendGetRequestAsync(
 *     "https://management.azure.com/subscriptions?api-version=2020-01-01",
 *     {
 *         headers: {
 *             Authorization: `mtls_pop ${tokenResult.accessToken}`,
 *         },
 *     }
 * );
 * ```
 *
 * @remarks
 * **Windows only.** Requires `@azure/msal-node-key-attestation` to provide the
 * `MsalMtlsMsiHelper.exe` binary, or a path set via `helperPath` /
 * `MSAL_MTLS_HELPER_PATH`.
 * @public
 */
export class MtlsManagedIdentityApplication {
    private readonly _cfg: ResolvedConfig;
    private readonly _tokenCache = new Map<string, AuthenticationResult>();

    constructor(config?: MtlsManagedIdentityConfiguration) {
        this._cfg = resolveConfig(config);
    }

    /**
     * Acquires an mTLS PoP access token for the managed identity.
     *
     * Results are cached in memory and reused until 5 minutes before expiry.
     * Set `forceRefresh: true` to bypass the cache.
     */
    async acquireToken(
        request: ManagedIdentityRequestParams
    ): Promise<AuthenticationResult> {
        const key = cacheKey(this._cfg, request.resource);

        if (!request.forceRefresh) {
            const cached = this._tokenCache.get(key);
            if (cached && isCacheHit(cached)) {
                return { ...cached, fromCache: true };
            }
        }

        const helperResult = await runHelper(this._cfg.helperPath, {
            resource: request.resource,
            identityType: this._cfg.identityType,
            identityId: this._cfg.identityId,
            withAttestation: this._cfg.withAttestation,
        });

        const expiresOn = new Date(Date.now() + helperResult.expires_in * 1000);
        const tenantId = helperResult.tenant_id ?? "";

        const result: AuthenticationResult = {
            authority: tenantId
                ? `https://login.microsoftonline.com/${tenantId}`
                : "https://login.microsoftonline.com/common",
            uniqueId: "",
            tenantId,
            scopes: [request.resource],
            account: null,
            idToken: "",
            idTokenClaims: {},
            accessToken: helperResult.access_token,
            fromCache: false,
            expiresOn,
            tokenType: AuthenticationScheme.MTLS_POP,
            correlationId: "",
            extExpiresOn: expiresOn,
            bindingCertificate: helperResult.binding_certificate,
        };

        this._tokenCache.set(key, result);
        return result;
    }

    /**
     * Makes a downstream GET request over mTLS using the KeyGuard-bound
     * certificate.
     *
     * Include `Authorization: mtls_pop <token>` in `options.headers`.
     * Obtain the token from {@link acquireToken}.
     */
    async sendGetRequestAsync<T>(
        url: string,
        options?: NetworkRequestOptions
    ): Promise<NetworkResponse<T>> {
        return this._sendRequest<T>("GET", url, options);
    }

    /**
     * Makes a downstream POST request over mTLS using the KeyGuard-bound
     * certificate.
     *
     * Include `Authorization: mtls_pop <token>` in `options.headers`.
     * Obtain the token from {@link acquireToken}.
     */
    async sendPostRequestAsync<T>(
        url: string,
        options?: NetworkRequestOptions
    ): Promise<NetworkResponse<T>> {
        return this._sendRequest<T>("POST", url, options);
    }

    /**
     * Clears the in-memory token cache.
     *
     * Call this if you know the binding certificate has been rotated or if
     * you receive an unexpected 401 on a downstream call.
     */
    clearTokenCache(): void {
        this._tokenCache.clear();
    }

    private async _sendRequest<T>(
        method: "GET" | "POST",
        url: string,
        options?: NetworkRequestOptions
    ): Promise<NetworkResponse<T>> {
        const token = this._extractOrFindToken(url, options?.headers);

        // Build a headers map without the Authorization entry — the subprocess
        // always sends "Authorization: mtls_pop <token>" itself.
        const forwardHeaders: Record<string, string> = {};
        for (const [k, v] of Object.entries(options?.headers ?? {})) {
            if (k.toLowerCase() !== "authorization") {
                forwardHeaders[k] = v;
            }
        }

        const helperResp = await runHelperHttpRequest(this._cfg.helperPath, {
            url,
            method,
            token,
            headers: forwardHeaders,
            body: options?.body,
            identityType: this._cfg.identityType,
            identityId: this._cfg.identityId,
            withAttestation: this._cfg.withAttestation,
        });

        return {
            status: helperResp.status,
            headers: helperResp.headers,
            body: helperResp.body as unknown as T,
        };
    }

    /**
     * Returns the access token to use for a downstream call.
     *
     * Priority:
     * 1. Token extracted from an `Authorization: mtls_pop <token>` header
     *    provided by the caller (the caller's explicitly chosen token).
     * 2. The most recently cached token from `acquireToken()` whose resource
     *    matches the URL's origin.
     * 3. Error — the caller must call `acquireToken()` first or supply the
     *    token in `Authorization` header.
     */
    private _extractOrFindToken(
        url: string,
        headers?: Record<string, string>
    ): string {
        // 1. Try explicit Authorization header
        const authHeader = Object.entries(headers ?? {}).find(
            ([k]) => k.toLowerCase() === "authorization"
        )?.[1];
        if (authHeader) {
            const match = /^mtls_pop\s+(.+)$/i.exec(authHeader.trim());
            if (match) return match[1];
        }

        // 2. Find any cached token for the URL's origin
        const origin = new URL(url).origin;
        const resource = origin.endsWith("/") ? origin : origin + "/";
        const key = cacheKey(this._cfg, resource);
        const cached = this._tokenCache.get(key);
        if (cached && isCacheHit(cached)) return cached.accessToken;

        // Try without trailing slash as well
        const keyAlt = cacheKey(this._cfg, origin);
        const cachedAlt = this._tokenCache.get(keyAlt);
        if (cachedAlt && isCacheHit(cachedAlt)) return cachedAlt.accessToken;

        // 3. Any cached, non-expired token (e.g. caller used a different resource string)
        for (const entry of this._tokenCache.values()) {
            if (isCacheHit(entry)) return entry.accessToken;
        }

        throw new Error(
            "No mTLS PoP token available for this request. " +
                "Call acquireToken() first, or pass the token via the " +
                "'Authorization: mtls_pop <token>' header in options.headers."
        );
    }
}
