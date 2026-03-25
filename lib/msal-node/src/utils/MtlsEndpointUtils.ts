/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * Public cloud mTLS authentication base host.
 * The token endpoint is: https://{region}.mtlsauth.microsoft.com/{tenantId}/oauth2/v2.0/token
 */
const MTLS_PUBLIC_CLOUD_HOST = "mtlsauth.microsoft.com";

/**
 * Constructs the regional mTLS token endpoint URL for the public cloud.
 *
 * Sovereign cloud support is deferred. Developers targeting sovereign clouds
 * should provide the authority URL manually and note that the mTLS host differs
 * (e.g., `mtlsauth.microsoftonline.us` for Azure Government).
 *
 * @param region - Azure region name (e.g. "eastus", "westeurope")
 * @param tenantId - Azure AD tenant ID (GUID or domain)
 * @returns Full mTLS token endpoint URL
 * @public
 */
export function buildMtlsTokenEndpoint(
    region: string,
    tenantId: string
): string {
    return `https://${region}.${MTLS_PUBLIC_CLOUD_HOST}/${tenantId}/oauth2/v2.0/token`;
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
