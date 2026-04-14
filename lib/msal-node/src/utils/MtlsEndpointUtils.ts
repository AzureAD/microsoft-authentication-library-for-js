/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * Public cloud mTLS authentication base host.
 * Regional endpoint: https://{region}.mtlsauth.microsoft.com/{tenantId}/oauth2/v2.0/token
 * Non-regional endpoint: https://mtlsauth.microsoft.com/{tenantId}/oauth2/v2.0/token
 */
const MTLS_PUBLIC_CLOUD_HOST = "mtlsauth.microsoft.com";

/**
 * Constructs the mTLS token endpoint URL for the public cloud.
 *
 * If a region is provided, uses the regional endpoint (e.g. `eastus.mtlsauth.microsoft.com`).
 * If no region is provided, uses the non-regional endpoint (`mtlsauth.microsoft.com`).
 * The STS can infer the region from the SNI certificate, so providing a region is optional.
 *
 * Sovereign cloud support is deferred. Developers targeting sovereign clouds
 * should provide the authority URL manually and note that the mTLS host differs
 * (e.g., `mtlsauth.microsoftonline.us` for Azure Government).
 *
 * @param tenantId - Azure AD tenant ID (GUID or domain)
 * @param region - Optional Azure region name (e.g. "eastus", "westeurope")
 * @returns Full mTLS token endpoint URL
 * @public
 */
export function buildMtlsTokenEndpoint(
    tenantId: string,
    region?: string
): string {
    const host = region
        ? `${region}.${MTLS_PUBLIC_CLOUD_HOST}`
        : MTLS_PUBLIC_CLOUD_HOST;
    return `https://${host}/${tenantId}/oauth2/v2.0/token`;
}

/**
 * Extracts the tenant ID (first non-empty path segment) from an authority URL.
 *
 * For example:
 *   "https://login.microsoftonline.com/contoso.onmicrosoft.com/" → "contoso.onmicrosoft.com"
 *   "https://login.microsoftonline.com/9188040d-6c67-4c5b-b112-36a304b66dad" → "9188040d-6c67-4c5b-b112-36a304b66dad"
 *
 * @param authorityUrl - Full authority URL
 * @returns Tenant ID or tenant domain string
 * @public
 */
export function extractTenantFromAuthority(authorityUrl: string): string {
    const url = new URL(authorityUrl);
    const segments = url.pathname
        .split("/")
        .filter((segment) => segment.length > 0);
    return segments[0] ?? "";
}
