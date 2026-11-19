/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { resolveHrefV2 } from "../../../../../../src/custom_auth/core/network_client/custom_auth_api/v2/HrefResolverV2.js";
import { ParsedUrlError } from "../../../../../../src/custom_auth/core/error/ParsedUrlError.js";

describe("HrefResolverV2.resolveHrefV2", () => {
    const base = new URL(
        "https://contoso.ciamlogin.com/contoso.onmicrosoft.com/"
    );

    it.each([
        "https://contoso.ciamlogin.com/tenant-id/",
        "https://contoso.ciamlogin.com/tenant-id",
        "https://contoso.ciamlogin.com/contoso.onmicrosoft.com/",
        "https://contoso.ciamlogin.com/contoso.onmicrosoft.com",
        "https://contoso.ciamlogin.com/",
        "https://contoso.ciamlogin.com",
    ])(
        "preserves the service tenant when resolving against %s",
        (authority) => {
            const href =
                "/11111111-2222-4333-8444-555555555555/api/v0.1/auth/resetpassword?dc=test-dc-1";

            const result = resolveHrefV2(new URL(authority), href);

            expect(result.href).toBe(
                "https://contoso.ciamlogin.com/11111111-2222-4333-8444-555555555555/api/v0.1/auth/resetpassword?dc=test-dc-1"
            );
        }
    );

    it("preserves the href query string (dc data-center hint)", () => {
        const href =
            "/tenant/api/v0.1/auth/methods/email/test-email-method/verify?dc=test-dc-2";

        const result = resolveHrefV2(base, href);

        expect(result.search).toBe("?dc=test-dc-2");
        expect(result.pathname).toBe(
            "/tenant/api/v0.1/auth/methods/email/test-email-method/verify"
        );
    });

    it.each([
        "https://contoso.ciamlogin.com/contoso.onmicrosoft.com",
        "https://login.example.com/contoso.onmicrosoft.com",
    ])("preserves a tenant-domain href against %s", (authority) => {
        const baseUrl = new URL(authority);
        const href =
            "/server.onMicrosoft.com/api/v2.0/signin/start?dc=server&customer=hello%20world";

        expect(resolveHrefV2(baseUrl, href).href).toBe(
            `${baseUrl.origin}${href}`
        );
    });

    it("handles a relative href without a leading slash", () => {
        const href = "tenant/api/v0.1/auth/resetpassword";

        const result = resolveHrefV2(base, href);

        expect(result.href).toBe(
            "https://contoso.ciamlogin.com/tenant/api/v0.1/auth/resetpassword"
        );
    });

    it("preserves the service tenant in an OAuth href", () => {
        const href = "/tenant/oauth2/v2.0/authorize";

        const result = resolveHrefV2(base, href);

        expect(result.href).toBe(
            "https://contoso.ciamlogin.com/tenant/oauth2/v2.0/authorize"
        );
    });

    it.each(["http", "https"])(
        "uses an absolute %s href's path and query on the configured origin",
        (protocol) => {
            const href = `${protocol}://contoso.ciamlogin.com/contoso.onmicrosoft.com/oauth2/v2.0/authorize-challenge?dc=test-dc-2`;

            const result = resolveHrefV2(base, href);

            expect(result.href).toBe(
                `${base.origin}/contoso.onmicrosoft.com/oauth2/v2.0/authorize-challenge?dc=test-dc-2`
            );
        }
    );

    it("does not switch hosts when the href contains another origin", () => {
        const href =
            "https://service.example.com/some-tenant/api/v0.1/auth/methods/password/test-password-method/pollUpdate?dc=Y";

        const result = resolveHrefV2(base, href);

        expect(result.href).toBe(
            `${base.origin}/some-tenant/api/v0.1/auth/methods/password/test-password-method/pollUpdate?dc=Y`
        );
    });

    it("keeps a protocol-relative href on the configured origin", () => {
        const result = resolveHrefV2(
            base,
            "//service.example/tenant/api/v0.1/auth/resetpassword"
        );

        expect(result.href).toBe(
            "https://contoso.ciamlogin.com//service.example/tenant/api/v0.1/auth/resetpassword"
        );
    });

    it("preserves HTTP for a relative href resolved against a local origin", () => {
        const localBase = new URL("http://localhost:3001/api");
        const href = "/tenant/api/v0.1/auth/resetpassword";

        expect(resolveHrefV2(localBase, href).href).toBe(
            "http://localhost:3001/tenant/api/v0.1/auth/resetpassword"
        );
    });

    it("trims surrounding whitespace before resolving", () => {
        const href = "  /tenant/api/v0.1/auth/resetpassword  ";

        const result = resolveHrefV2(base, href);

        expect(result.pathname).toBe("/tenant/api/v0.1/auth/resetpassword");
    });

    it("preserves a relative path without an API marker", () => {
        const href = "/somewhere/else";

        const result = resolveHrefV2(base, href);

        expect(result.pathname).toBe("/somewhere/else");
    });

    it.each([
        "/tenant/api/v0.1/auth/resetpassword",
        "/tenant/api/v0.1/auth/resetpassword?dc=server&customer=value",
        "/tenant/api/v0.1/auth/resetpassword?dc=&customer=value&empty=",
        "/tenant/api/v0.1/auth/resetpassword?customer=first&customer=second",
        "/tenant/api/v0.1/auth/resetpassword?customer=hello%20world&encoded=%2F%2b&other=%7E",
        "/tenant/api/v0.1/auth/resetpassword?dc={dc}",
    ])("preserves the complete href and query unchanged: %s", (href) => {
        const result = resolveHrefV2(base, href);

        expect(result.href).toBe(`${base.origin}${href}`);
    });

    it("rejects a malformed absolute HTTP href", () => {
        expect(() => resolveHrefV2(base, "http://")).toThrow(ParsedUrlError);
    });

    it("preserves an absolute href's encoded query while retaining the local proxy origin", () => {
        const href =
            "HTTPS://contoso.ciamlogin.com/server.onMicrosoft.com/oauth2/v2.0/authorize-challenge?dc=server&customer=hello%20world&customer=second&encoded=%2F%2b&empty=";

        expect(
            resolveHrefV2(new URL("http://localhost:3001/api"), href).href
        ).toBe(
            "http://localhost:3001/server.onMicrosoft.com/oauth2/v2.0/authorize-challenge?dc=server&customer=hello%20world&customer=second&encoded=%2F%2b&empty="
        );
    });

    it("throws a ParsedUrlError for an empty href", () => {
        expect(() => resolveHrefV2(base, "   ")).toThrow(ParsedUrlError);
    });

    it.each([
        "javascript:alert(1)",
        "data:text/plain,test",
        "ftp://example.com",
    ])("treats a scheme-like href as a path: %s", (href) => {
        expect(resolveHrefV2(base, href).href).toBe(`${base.origin}/${href}`);
    });

    it("throws a ParsedUrlError when the resulting URL has an unsupported protocol", () => {
        expect(() =>
            resolveHrefV2(
                new URL("ftp://example.com/tenant"),
                "/tenant/api/v0.1/auth/resetpassword"
            )
        ).toThrow(ParsedUrlError);
    });
});
