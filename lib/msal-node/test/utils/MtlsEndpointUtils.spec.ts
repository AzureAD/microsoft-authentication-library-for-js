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
        it("builds endpoint for a known region and GUID tenant", () => {
            const result = buildMtlsTokenEndpoint(
                "eastus",
                "9188040d-6c67-4c5b-b112-36a304b66dad"
            );
            expect(result).toBe(
                "https://eastus.mtlsauth.microsoft.com/9188040d-6c67-4c5b-b112-36a304b66dad/oauth2/v2.0/token"
            );
        });

        it("builds endpoint for a domain-based tenant", () => {
            const result = buildMtlsTokenEndpoint(
                "westeurope",
                "contoso.onmicrosoft.com"
            );
            expect(result).toBe(
                "https://westeurope.mtlsauth.microsoft.com/contoso.onmicrosoft.com/oauth2/v2.0/token"
            );
        });

        it("includes the region in the subdomain", () => {
            const region = "australiaeast";
            const result = buildMtlsTokenEndpoint(
                region,
                "tenant-id"
            );
            expect(result).toContain(`${region}.mtlsauth.microsoft.com`);
        });

        it("always ends with the OAuth2 token path", () => {
            const result = buildMtlsTokenEndpoint("eastus", "my-tenant");
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
