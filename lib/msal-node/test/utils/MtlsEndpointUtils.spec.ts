/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    buildMtlsTokenEndpoint,
    extractTenantFromAuthority,
} from "../../src/utils/MtlsEndpointUtils.js";

describe("MtlsEndpointUtils", () => {
    describe("buildMtlsTokenEndpoint", () => {
        it("builds regional endpoint when region is provided (GUID tenant)", () => {
            const result = buildMtlsTokenEndpoint(
                "9188040d-6c67-4c5b-b112-36a304b66dad",
                "eastus"
            );
            expect(result).toBe(
                "https://eastus.mtlsauth.microsoft.com/9188040d-6c67-4c5b-b112-36a304b66dad/oauth2/v2.0/token"
            );
        });

        it("builds regional endpoint for a domain-based tenant", () => {
            const result = buildMtlsTokenEndpoint(
                "contoso.onmicrosoft.com",
                "westeurope"
            );
            expect(result).toBe(
                "https://westeurope.mtlsauth.microsoft.com/contoso.onmicrosoft.com/oauth2/v2.0/token"
            );
        });

        it("includes the region in the subdomain when region is provided", () => {
            const region = "australiaeast";
            const result = buildMtlsTokenEndpoint("tenant-id", region);
            expect(result).toContain(`${region}.mtlsauth.microsoft.com`);
        });

        it("builds non-regional endpoint when region is omitted", () => {
            const result = buildMtlsTokenEndpoint("my-tenant");
            expect(result).toBe(
                "https://mtlsauth.microsoft.com/my-tenant/oauth2/v2.0/token"
            );
        });

        it("builds non-regional endpoint when region is undefined", () => {
            const result = buildMtlsTokenEndpoint("my-tenant", undefined);
            expect(result).toBe(
                "https://mtlsauth.microsoft.com/my-tenant/oauth2/v2.0/token"
            );
        });

        it("always ends with the OAuth2 token path", () => {
            const result = buildMtlsTokenEndpoint("my-tenant", "eastus");
            expect(result).toMatch(/\/oauth2\/v2\.0\/token$/);
        });
    });

    describe("extractTenantFromAuthority", () => {
        it("extracts GUID tenant from standard AAD authority", () => {
            const result = extractTenantFromAuthority(
                "https://login.microsoftonline.com/9188040d-6c67-4c5b-b112-36a304b66dad"
            );
            expect(result).toBe("9188040d-6c67-4c5b-b112-36a304b66dad");
        });

        it("extracts domain tenant from standard AAD authority", () => {
            const result = extractTenantFromAuthority(
                "https://login.microsoftonline.com/contoso.onmicrosoft.com/"
            );
            expect(result).toBe("contoso.onmicrosoft.com");
        });

        it("extracts tenant from authority with trailing slash", () => {
            const result = extractTenantFromAuthority(
                "https://login.microsoftonline.com/my-tenant-id/"
            );
            expect(result).toBe("my-tenant-id");
        });

        it("returns empty string for authority with no path segments", () => {
            const result = extractTenantFromAuthority(
                "https://login.microsoftonline.com/"
            );
            expect(result).toBe("");
        });
    });
});
