import { Constants } from "@azure/msal-browser";
import { CustomAuthAuthority } from "../../src/core/CustomAuthAuthority.js";
import { customAuthConfig } from "../test_resources/CustomAuthConfig.js";

describe("CustomAuthAuthority", () => {
    const authorityUrl = customAuthConfig.auth.authority ?? "";
    const customAuthProxyDomain = customAuthConfig.customAuth.authApiProxyUrl;

    describe("constructor", () => {
        it("should correctly parse and store the authority URL", () => {
            const customAuthAuthority = new CustomAuthAuthority(authorityUrl);
            expect(customAuthAuthority.authorityUrl.origin).toBe(authorityUrl);
        });

        it("should correctly store the customAuthProxyDomain when provided", () => {
            const customAuthAuthority = new CustomAuthAuthority(
                authorityUrl,
                customAuthProxyDomain,
            );
            expect(customAuthAuthority["customAuthProxyDomain"]).toBe(
                customAuthProxyDomain,
            );
        });
    });

    describe("getTenant", () => {
        it("should extract the tenant from the authority URL hostname", () => {
            const customAuthAuthority = new CustomAuthAuthority(authorityUrl);
            expect(customAuthAuthority.getTenant()).toBe("spasamples");
        });

        it("should handle a different authority URL correctly", () => {
            const anotherUrl = "https://mytenant.microsoft.com";
            const customAuthAuthority = new CustomAuthAuthority(anotherUrl);
            expect(customAuthAuthority.getTenant()).toBe("mytenant");
        });
    });

    describe("getCustomAuthDomain", () => {
        it("should return the customAuthProxyDomain when provided", () => {
            const customAuthAuthority = new CustomAuthAuthority(
                authorityUrl,
                customAuthProxyDomain,
            );
            expect(customAuthAuthority.getCustomAuthDomain()).toBe(
                customAuthProxyDomain,
            );
        });

        it("should generate the auth API domain based on the authority URL when customAuthProxyDomain is not provided", () => {
            const customAuthAuthority = new CustomAuthAuthority(authorityUrl);
            const expectedDomain = `${customAuthAuthority.getTenant()}${Constants.AAD_TENANT_DOMAIN_SUFFIX}`;
            const expectedUrl = new URL(expectedDomain, authorityUrl).href;
            expect(customAuthAuthority.getCustomAuthDomain()).toBe(expectedUrl);
        });
    });
});
