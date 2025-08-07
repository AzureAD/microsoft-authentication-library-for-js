import { StubbedNetworkModule } from "@azure/msal-common/browser";
import { buildConfiguration } from "../../../src/config/Configuration.js";
import { CustomAuthAuthority } from "../../../src/custom_auth/core/CustomAuthAuthority.js";
import { customAuthConfig } from "../test_resources/CustomAuthConfig.js";
import {
    getDefaultBrowserCacheManager,
    getDefaultLogger,
} from "../test_resources/TestModules.js";

describe("CustomAuthAuthority", () => {
    const authorityUrl = customAuthConfig.auth.authority;
    const customAuthProxyDomain = customAuthConfig.customAuth.authApiProxyUrl;
    const authorityHostname =
        authorityUrl && authorityUrl.startsWith("https")
            ? authorityUrl.split("/")[2]
            : authorityUrl;
    const clientId = customAuthConfig.auth.clientId;
    const authorityMetadataEntityKey = `authority-metadata-${clientId}-${authorityHostname}`;

    const config = buildConfiguration({ auth: { clientId: clientId } }, true);
    const logger = getDefaultLogger();
    const browserStorage = getDefaultBrowserCacheManager(
        clientId,
        logger,
        undefined,
        undefined,
        undefined,
        config.cache
    );

    describe("constructor", () => {
        it("should correctly parse and store the authority URL", () => {
            const customAuthAuthority = new CustomAuthAuthority(
                authorityUrl ?? "",
                config,
                StubbedNetworkModule,
                browserStorage,
                logger
            );
            expect(customAuthAuthority.canonicalAuthority).toBe(
                "https://spasamples.ciamlogin.com/spasamples.onmicrosoft.com/"
            );
        });

        it("should correctly store the customAuthProxyDomain when provided", () => {
            const customAuthAuthority = new CustomAuthAuthority(
                authorityUrl ?? "",
                config,
                StubbedNetworkModule,
                browserStorage,
                logger,
                customAuthProxyDomain
            );
            expect(customAuthAuthority["customAuthProxyDomain"]).toBe(
                customAuthProxyDomain
            );
        });

        it("should correctly store the customAuthProxyDomain when provided", () => {
            const customAuthAuthority = new CustomAuthAuthority(
                "https://login.microsoftonline.com/",
                config,
                StubbedNetworkModule,
                browserStorage,
                logger,
                customAuthProxyDomain
            );
            expect(customAuthAuthority["customAuthProxyDomain"]).toBe(
                customAuthProxyDomain
            );
        });

        it("should save authority metadata entity into cache", () => {
            const customAuthAuthority = new CustomAuthAuthority(
                authorityUrl ?? "",
                config,
                StubbedNetworkModule,
                browserStorage,
                logger
            );
            expect(customAuthAuthority.canonicalAuthority).toBe(
                "https://spasamples.ciamlogin.com/spasamples.onmicrosoft.com/"
            );

            const authorityHostname =
                customAuthAuthority.canonicalAuthorityUrlComponents
                    .HostNameAndPort;

            expect(
                browserStorage
                    .getAuthorityMetadataKeys()
                    .includes(authorityMetadataEntityKey)
            ).toBe(true);
            expect(
                browserStorage.getAuthorityMetadata(authorityMetadataEntityKey)
            ).toMatchObject({
                aliases: [authorityHostname],
                preferred_cache: authorityHostname,
            });
        });
    });

    describe("tenant getter", () => {
        it("should extract the tenant from the authority URL hostname", () => {
            const customAuthAuthority = new CustomAuthAuthority(
                authorityUrl ?? "",
                config,
                StubbedNetworkModule,
                browserStorage,
                logger
            );
            expect(customAuthAuthority.tenant).toBe(
                "spasamples.onmicrosoft.com"
            );
        });
    });

    describe("getCustomAuthDomain", () => {
        it("should return the customAuthProxyDomain when provided", () => {
            const customAuthAuthority = new CustomAuthAuthority(
                authorityUrl ?? "",
                config,
                StubbedNetworkModule,
                browserStorage,
                logger,
                customAuthProxyDomain
            );
            expect(customAuthAuthority.getCustomAuthApiDomain()).toBe(
                customAuthProxyDomain
            );
        });

        it("should generate the auth API domain based on the authority URL when customAuthProxyDomain is not provided", () => {
            const customAuthAuthority = new CustomAuthAuthority(
                authorityUrl ?? "",
                config,
                StubbedNetworkModule,
                browserStorage,
                logger
            );
            expect(customAuthAuthority.getCustomAuthApiDomain()).toBe(
                "https://spasamples.ciamlogin.com/spasamples.onmicrosoft.com/"
            );
        });
    });

    describe("getPreferredCache", () => {
        it("should return the host of authority as preferred cache", () => {
            const customAuthAuthority = new CustomAuthAuthority(
                authorityUrl ?? "",
                config,
                StubbedNetworkModule,
                browserStorage,
                logger,
                customAuthProxyDomain
            );
            expect(customAuthAuthority.getPreferredCache()).toBe(
                "spasamples.ciamlogin.com"
            );
        });
    });

    describe("tokenEndpoint", () => {
        it("should return the correct token endpoint", () => {
            const customAuthAuthority = new CustomAuthAuthority(
                authorityUrl ?? "",
                config,
                StubbedNetworkModule,
                browserStorage,
                logger,
                customAuthProxyDomain
            );
            expect(customAuthAuthority.tokenEndpoint).toBe(
                "https://myspafunctiont1.azurewebsites.net/api/ReverseProxy/oauth2/v2.0/token"
            );
        });
    });
});
