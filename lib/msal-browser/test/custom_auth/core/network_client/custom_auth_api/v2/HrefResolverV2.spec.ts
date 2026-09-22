/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { resolveHrefV2 } from "../../../../../../src/custom_auth/core/network_client/custom_auth_api/v2/HrefResolverV2.js";
import { ParsedUrlError } from "../../../../../../src/custom_auth/core/error/ParsedUrlError.js";

describe("HrefResolverV2.resolveHrefV2", () => {
    // Authority the api-client normalizes with a trailing slash before resolving hrefs.
    const base = new URL(
        "https://nativeauthasampleapp.ciamlogin.com/nativeauthasampleapp.onmicrosoft.com/"
    );

    it("strips the href tenant and re-anchors on the authority tenant path", () => {
        const href =
            "/4710d5e4-43bb-4ff9-89af-30ed8fe31c6d/api/v0.1/auth/resetpassword?dc=ESTS-PUB-SEASLR1";

        const result = resolveHrefV2(base, href);

        expect(result.href).toBe(
            "https://nativeauthasampleapp.ciamlogin.com/nativeauthasampleapp.onmicrosoft.com/api/v0.1/auth/resetpassword?dc=ESTS-PUB-SEASLR1"
        );
    });

    it("preserves the href query string (dc data-center hint)", () => {
        const href =
            "/tenant/api/v0.1/auth/methods/email/c8e4b6bda907432f91a4d15a31cad758/verify?dc=ESTS-PUB-WEULR1-AZ2-FD130-001";

        const result = resolveHrefV2(base, href);

        expect(result.search).toBe("?dc=ESTS-PUB-WEULR1-AZ2-FD130-001");
        expect(result.pathname).toBe(
            "/nativeauthasampleapp.onmicrosoft.com/api/v0.1/auth/methods/email/c8e4b6bda907432f91a4d15a31cad758/verify"
        );
    });

    it("handles a relative href without a leading slash", () => {
        const href = "tenant/api/v0.1/auth/resetpassword";

        const result = resolveHrefV2(base, href);

        expect(result.href).toBe(
            "https://nativeauthasampleapp.ciamlogin.com/nativeauthasampleapp.onmicrosoft.com/api/v0.1/auth/resetpassword"
        );
    });

    it("keeps the tail from the /oauth2/ marker", () => {
        const href = "/tenant/oauth2/v2.0/authorize";

        const result = resolveHrefV2(base, href);

        expect(result.href).toBe(
            "https://nativeauthasampleapp.ciamlogin.com/nativeauthasampleapp.onmicrosoft.com/oauth2/v2.0/authorize"
        );
    });

    it("returns an absolute http(s) href unchanged", () => {
        const href =
            "https://nativeauthasampleapp.ciamlogin.com/nativeauthasampleapp.onmicrosoft.com/oauth2/v2.0/authorize-challenge?dc=ESTS-PUB-WEULR1-AZ2-FD130-001";

        const result = resolveHrefV2(base, href);

        expect(result.href).toBe(href);
    });

    it("does not strip the tenant of an absolute href from another host", () => {
        const href =
            "https://ests-r.microsoft.com/some-tenant/api/v0.1/auth/methods/password/11d8/pollUpdate?dc=Y";

        const result = resolveHrefV2(base, href);

        expect(result.href).toBe(href);
    });

    it("produces the same result whether the authority has a trailing slash or not", () => {
        const withSlash = new URL(
            "https://nativeauthasampleapp.ciamlogin.com/nativeauthasampleapp.onmicrosoft.com/"
        );
        const withoutSlash = new URL(
            "https://nativeauthasampleapp.ciamlogin.com/nativeauthasampleapp.onmicrosoft.com"
        );
        const href = "/tenant/api/v0.1/auth/resetpassword";

        expect(resolveHrefV2(withSlash, href).href).toBe(
            resolveHrefV2(withoutSlash, href).href
        );
    });

    it("trims surrounding whitespace before resolving", () => {
        const href = "  /tenant/api/v0.1/auth/resetpassword  ";

        const result = resolveHrefV2(base, href);

        expect(result.pathname).toBe(
            "/nativeauthasampleapp.onmicrosoft.com/api/v0.1/auth/resetpassword"
        );
    });

    it("keeps a marker-less relative path as-is under the tenant path", () => {
        const href = "/somewhere/else";

        const result = resolveHrefV2(base, href);

        expect(result.pathname).toBe(
            "/nativeauthasampleapp.onmicrosoft.com/somewhere/else"
        );
    });

    it("throws a ParsedUrlError when the href cannot be resolved", () => {
        // A bare protocol-relative marker that new URL cannot parse against the origin.
        expect(() => resolveHrefV2(base, "http://")).toThrow(ParsedUrlError);
    });

    it("throws a ParsedUrlError for an empty href", () => {
        expect(() => resolveHrefV2(base, "   ")).toThrow(ParsedUrlError);
    });

    it.each([
        "javascript:alert(1)",
        "data:text/plain,test",
        "ftp://example.com",
    ])("throws a ParsedUrlError for the unsupported protocol in %s", (href) => {
        expect(() => resolveHrefV2(base, href)).toThrow(ParsedUrlError);
    });
});
