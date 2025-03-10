import { BrowserCacheManager, BrowserConfiguration, INetworkModule, Logger } from "@azure/msal-browser";
import { CustomAuthAuthority } from "../../src/core/CustomAuthAuthority.js";
import { customAuthConfig } from "../test_resources/CustomAuthConfig.js";
import { mock } from "node:test";

describe("CustomAuthAuthority", () => {
    const authorityUrl = customAuthConfig.auth.authority;
    const customAuthProxyDomain = customAuthConfig.customAuth.authApiProxyUrl;
    const mockMemoryStorage = new Map<string, object>();
    const authorityHostname =
        authorityUrl && authorityUrl.startsWith("https") ? authorityUrl.split("/")[2] : authorityUrl;
    const authorityMetadataEntityKey = `authority-metadata-${customAuthConfig.auth.clientId}-${authorityHostname}`;
    const mockCacheManager = {
        generateAuthorityMetadataCacheKey: jest.fn().mockImplementation(() => {
            return authorityMetadataEntityKey;
        }),
        setAuthorityMetadata: jest.fn().mockImplementation((key, metadata) => {
            mockMemoryStorage.set(key, metadata);
        }),
    } as unknown as jest.Mocked<BrowserCacheManager>;
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

        it("should save authority metadata entity into cache", () => {
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

            const authorityHostname = customAuthAuthority.canonicalAuthorityUrlComponents.HostNameAndPort;
            const authorityMetadataCacheKey =
                "authority-metadata-d5e97fb9-24bb-418d-8e7a-4e1918303c92-spasamples.ciamlogin.com";
            const metadataEntity = mockMemoryStorage.get(authorityMetadataCacheKey);

            expect(mockMemoryStorage.has(authorityMetadataCacheKey)).toBe(true);
            expect(metadataEntity).toMatchObject({
                aliases: [authorityHostname],
                preferred_cache: authorityHostname,
            });
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

    describe("tokenEndpoint", () => {
        it("should return the correct token endpoint", () => {
            const customAuthAuthority = new CustomAuthAuthority(
                authorityUrl ?? "",
                mockConfig,
                mockNetworkModule,
                mockCacheManager,
                mockLogger,
                customAuthProxyDomain,
            );
            expect(customAuthAuthority.tokenEndpoint).toBe(
                "https://myspafunctiont1.azurewebsites.net/api/ReverseProxy/oauth2/v2.0/token",
            );
        });
    });
});
