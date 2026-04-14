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
    runHelper,
    runHelperHttpRequest,
} from "./internal/NativeHelper.js";

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

};

/** Resolved, normalised internal config. */
interface ResolvedConfig {
    identityType: "SystemAssigned" | "UserAssigned";
    identityId?: string;
    withAttestation: boolean;
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
    };
}

function cacheKey(cfg: ResolvedConfig, resource: string): string {
    // Use | as separator — never appears in Azure resource URIs (unlike : in https://).
    return [
        resource,
        cfg.identityType,
        cfg.identityId ?? "",
        String(cfg.withAttestation),
    ].join("|");
}

function isCacheHit(result: AuthenticationResult): boolean {
    if (!result.expiresOn) return false;
    return result.expiresOn.getTime() - Date.now() > EXPIRY_BUFFER_SECONDS * 1000;
}

/**
 * Managed Identity application for Windows mTLS Proof-of-Possession.
 *
 * Provides a single object for both token acquisition and downstream mTLS
 * calls — no separate network client configuration required. Internally uses
 * an N-API native addon (`msal_mtls_win.node`) for all Windows-specific
 * operations (KeyGuard CNG key, IMDS credential issuance, WinHTTP mTLS
 * transport). All other operations (IMDS metadata, token caching) go through
 * the standard MSAL Node pipeline.
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
 * **Windows only.** Requires the `msal_mtls_win.node` native addon (shipped
 * with this package under `bin/win-x64/`) and Windows VBS/KeyGuard for
 * hardware-backed key creation.
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

        const helperResult = await runHelper({
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
        const { token, resource } = this._extractOrFindToken(url, options?.headers);

        // Build a headers map without the Authorization entry — the native
        // addon injects "Authorization: mtls_pop <token>" itself.
        const forwardHeaders: Record<string, string> = {};
        for (const [k, v] of Object.entries(options?.headers ?? {})) {
            if (k.toLowerCase() !== "authorization") {
                forwardHeaders[k] = v;
            }
        }

        const helperResp = await runHelperHttpRequest({
            url,
            method,
            token,
            resource,
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
     * Returns the access token (and the Azure resource it was issued for) to
     * use for a downstream call.
     *
     * Priority:
     * 1. Token extracted from an `Authorization: mtls_pop <token>` header
     *    provided by the caller. The resource is recovered from the cache if the
     *    token matches a cached entry; otherwise `undefined` (subprocess uses URL origin).
     * 2. The most recently cached token from `acquireToken()` whose resource
     *    matches the URL's origin.
     * 3. Any non-expired cached token (catches the common case where the
     *    downstream URL differs from the Azure resource used in acquireToken).
     * 4. Error — the caller must call `acquireToken()` first or supply the
     *    token in `Authorization` header.
     */
    private _extractOrFindToken(
        url: string,
        headers?: Record<string, string>
    ): { token: string; resource: string | undefined } {
        // 1. Try explicit Authorization header
        const authHeader = Object.entries(headers ?? {}).find(
            ([k]) => k.toLowerCase() === "authorization"
        )?.[1];
        if (authHeader) {
            const match = /^mtls_pop\s+(.+)$/i.exec(authHeader.trim());
            if (match) {
                const token = match[1];
                // 1a. Try to recover the resource from a matching cache entry
                for (const [key, entry] of this._tokenCache.entries()) {
                    if (entry.accessToken === token && isCacheHit(entry)) {
                        return { token, resource: key.split("|")[0] };
                    }
                }
                // 1b. Token not in cache (e.g. forceRefresh replaced it) —
                //     use any valid cached resource so the subprocess can look
                //     up the right KeyGuard certificate.
                for (const [key, entry] of this._tokenCache.entries()) {
                    if (isCacheHit(entry)) {
                        return { token, resource: key.split("|")[0] };
                    }
                }
                return { token, resource: undefined };
            }
        }

        // 2. Find any cached token for the URL's origin
        const origin = new URL(url).origin;
        const resource = origin.endsWith("/") ? origin : origin + "/";
        const key = cacheKey(this._cfg, resource);
        const cached = this._tokenCache.get(key);
        if (cached && isCacheHit(cached)) return { token: cached.accessToken, resource };

        // Try without trailing slash as well
        const keyAlt = cacheKey(this._cfg, origin);
        const cachedAlt = this._tokenCache.get(keyAlt);
        if (cachedAlt && isCacheHit(cachedAlt)) return { token: cachedAlt.accessToken, resource: origin };

        // 3. Any cached, non-expired token (e.g. caller acquired Graph token but downstream URL is custom)
        for (const [key, entry] of this._tokenCache.entries()) {
            if (isCacheHit(entry)) {
                return { token: entry.accessToken, resource: key.split("|")[0] };
            }
        }

        throw new Error(
            "No mTLS PoP token available for this request. " +
                "Call acquireToken() first, or pass the token via the " +
                "'Authorization: mtls_pop <token>' header in options.headers."
        );
    }
}
