import {
    AuthorityOptions,
    BrowserCacheManager,
    BrowserConfiguration,
    Constants,
    INetworkModule,
    Logger,
} from "@azure/msal-browser";
import { CustomAuthAuthority } from "../../src/core/CustomAuthAuthority.js";
import { customAuthConfig } from "../test_resources/CustomAuthConfig.js";

describe("CustomAuthAuthority", () => {
    const authorityUrl = customAuthConfig.auth.authority;
    const customAuthProxyDomain = customAuthConfig.customAuth.authApiProxyUrl;
    const mockCacheManager = {} as unknown as jest.Mocked<BrowserCacheManager>;
    const mockNetworkModule = {} as unknown as jest.Mocked<INetworkModule>;
    const mockLogger = {} as unknown as jest.Mocked<Logger>;
    const mockConfig = {
        auth: {
            protocolMode: "",
            OIDCOptions: {},
            knownAuthorities: [],
            cloudDiscoveryMetadata: "",
            authorityMetadata: "",
            skipAuthorityMetadataCache: false,
        },
    } as unknown as jest.Mocked<BrowserConfiguration>;

    describe("constructor", () => {
        it("should correctly parse and store the authority URL", () => {
            const customAuthAuthority = new CustomAuthAuthority(
                authorityUrl ?? "",
                mockConfig,
                mockNetworkModule,
                mockCacheManager,
                mockLogger,
            );
            expect(customAuthAuthority.canonicalAuthority).toBe(
                "https://spasamples.ciamlogin.com/spasamples.onmicrosoft.com/",
            );
        });

        it("should correctly store the customAuthProxyDomain when provided", () => {
            const customAuthAuthority = new CustomAuthAuthority(
                authorityUrl ?? "",
                mockConfig,
                mockNetworkModule,
                mockCacheManager,
                mockLogger,
                customAuthProxyDomain,
            );
            expect(customAuthAuthority["customAuthProxyDomain"]).toBe(customAuthProxyDomain);
        });

        it("should correctly store the customAuthProxyDomain when provided", () => {
            const customAuthAuthority = new CustomAuthAuthority(
                "https://login.microsoftonline.com/",
                mockConfig,
                mockNetworkModule,
                mockCacheManager,
                mockLogger,
                customAuthProxyDomain,
            );
            expect(customAuthAuthority["customAuthProxyDomain"]).toBe(customAuthProxyDomain);
        });
    });

    describe("tenant getter", () => {
        it("should extract the tenant from the authority URL hostname", () => {
            const customAuthAuthority = new CustomAuthAuthority(
                authorityUrl ?? "",
                mockConfig,
                mockNetworkModule,
                mockCacheManager,
                mockLogger,
            );
            expect(customAuthAuthority.tenant).toBe("spasamples.onmicrosoft.com");
        });
    });

    describe("getCustomAuthDomain", () => {
        it("should return the customAuthProxyDomain when provided", () => {
            const customAuthAuthority = new CustomAuthAuthority(
                authorityUrl ?? "",
                mockConfig,
                mockNetworkModule,
                mockCacheManager,
                mockLogger,
                customAuthProxyDomain,
            );
            expect(customAuthAuthority.getCustomAuthApiDomain()).toBe(customAuthProxyDomain);
        });

        it("should generate the auth API domain based on the authority URL when customAuthProxyDomain is not provided", () => {
            const customAuthAuthority = new CustomAuthAuthority(
                authorityUrl ?? "",
                mockConfig,
                mockNetworkModule,
                mockCacheManager,
                mockLogger,
            );
            expect(customAuthAuthority.getCustomAuthApiDomain()).toBe(
                "https://spasamples.ciamlogin.com/spasamples.onmicrosoft.com/",
            );
        });
    });

    describe("getPreferredCache", () => {
        it("should return the host of authority as preferred cache", () => {
            const customAuthAuthority = new CustomAuthAuthority(
                authorityUrl ?? "",
                mockConfig,
                mockNetworkModule,
                mockCacheManager,
                mockLogger,
                customAuthProxyDomain,
            );
            expect(customAuthAuthority.getPreferredCache()).toBe("spasamples.ciamlogin.com");
        });
    });
});
