import { StubbedNetworkModule } from "@azure/msal-common/browser";
import { buildConfiguration } from "../../../src/config/Configuration.js";
import { CustomAuthAuthority } from "../../../src/custom_auth/core/CustomAuthAuthority.js";
import { customAuthConfig } from "../test_resources/CustomAuthConfig.js";
import {
    getDefaultBrowserCacheManager,
    getDefaultLogger,
    getDefaultPerformanceClient,
} from "../test_resources/TestModules.js";
import { TEST_CONFIG } from "../../utils/StringConstants.js";
import { TestAccountDetails } from "../test_resources/TestConstants.js";
import { setNativeAuthSession } from "../../../src/custom_auth/core/utils/NativeAuthSession.js";

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
    const performanceClient = getDefaultPerformanceClient();
    const browserStorage = getDefaultBrowserCacheManager(
        clientId,
        logger,
        undefined,
        undefined,
        undefined,
        config.cache
    );

    afterEach(async () => {
        jest.restoreAllMocks();
        await browserStorage.clear(TEST_CONFIG.CORRELATION_ID);
    });

    describe("constructor", () => {
        it("caches the native API endpoint without reading accounts before cache initialization", () => {
            const getAccounts = jest
                .spyOn(browserStorage, "getAllAccounts")
                .mockImplementation(() => {
                    throw new Error("Cache is not initialized");
                });

            new CustomAuthAuthority(
                authorityUrl ?? "",
                config,
                StubbedNetworkModule,
                browserStorage,
                logger,
                performanceClient,
                customAuthProxyDomain
            );

            expect(getAccounts).not.toHaveBeenCalled();
            expect(
                browserStorage.getAuthorityMetadata(
                    authorityMetadataEntityKey,
                    TEST_CONFIG.CORRELATION_ID
                )
            ).toMatchObject({
                token_endpoint:
                    "https://myspafunctiont1.azurewebsites.net/api/ReverseProxy/oauth2/v2.0/token",
            });
        });

        it("should correctly parse and store the authority URL", () => {
            const customAuthAuthority = new CustomAuthAuthority(
                authorityUrl ?? "",
                config,
                StubbedNetworkModule,
                browserStorage,
                logger,
                performanceClient
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
                performanceClient,
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
                performanceClient,
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
                logger,
                performanceClient
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
                browserStorage.getAuthorityMetadata(
                    authorityMetadataEntityKey,
                    TEST_CONFIG.CORRELATION_ID
                )
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
                logger,
                performanceClient
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
                performanceClient,
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
                logger,
                performanceClient
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
                performanceClient,
                customAuthProxyDomain
            );
            expect(customAuthAuthority.getPreferredCache()).toBe(
                "spasamples.ciamlogin.com"
            );
        });
    });

    describe("tokenEndpoint", () => {
        it("updates token routing as the session changes without changing the native API domain or metadata", () => {
            const sharedAuthority = new CustomAuthAuthority(
                authorityUrl ?? "",
                config,
                StubbedNetworkModule,
                browserStorage,
                logger,
                performanceClient,
                customAuthProxyDomain
            );
            const cachedMetadata = browserStorage.getAuthorityMetadata(
                authorityMetadataEntityKey,
                TEST_CONFIG.CORRELATION_ID
            );
            const saveMetadata = jest.spyOn(
                browserStorage,
                "setAuthorityMetadata"
            );
            const getAccounts = jest.spyOn(browserStorage, "getAllAccounts");
            const proxyEndpoint =
                "https://myspafunctiont1.azurewebsites.net/api/ReverseProxy/oauth2/v2.0/token";
            const directEndpoint =
                "https://spasamples.ciamlogin.com/spasamples.onmicrosoft.com/oauth2/v2.0/token";

            getAccounts.mockReturnValue([]);
            expect(sharedAuthority.tokenEndpoint).toBe(proxyEndpoint);

            getAccounts.mockReturnValue([TestAccountDetails]);
            expect(sharedAuthority.tokenEndpoint).toBe(directEndpoint);
            expect(sharedAuthority.getCustomAuthApiDomain()).toBe(
                customAuthProxyDomain
            );

            getAccounts.mockReturnValue([]);
            expect(sharedAuthority.tokenEndpoint).toBe(proxyEndpoint);

            setNativeAuthSession(
                browserStorage,
                TestAccountDetails,
                TEST_CONFIG.CORRELATION_ID
            );
            getAccounts.mockReturnValue([TestAccountDetails]);
            expect(sharedAuthority.tokenEndpoint).toBe(proxyEndpoint);
            expect(sharedAuthority.getCustomAuthApiDomain()).toBe(
                customAuthProxyDomain
            );
            expect(saveMetadata).not.toHaveBeenCalled();
            expect(
                browserStorage.getAuthorityMetadata(
                    authorityMetadataEntityKey,
                    TEST_CONFIG.CORRELATION_ID
                )
            ).toEqual(cachedMetadata);
        });

        it.each(["signed out", "browser", "native"])(
            "uses the canonical token endpoint without a proxy for a %s session",
            (session) => {
                jest.spyOn(browserStorage, "getAllAccounts").mockReturnValue(
                    session === "signed out" ? [] : [TestAccountDetails]
                );
                if (session === "native") {
                    setNativeAuthSession(
                        browserStorage,
                        TestAccountDetails,
                        TEST_CONFIG.CORRELATION_ID
                    );
                }
                const authority = new CustomAuthAuthority(
                    authorityUrl ?? "",
                    config,
                    StubbedNetworkModule,
                    browserStorage,
                    logger,
                    performanceClient
                );

                expect(authority.tokenEndpoint).toBe(
                    "https://spasamples.ciamlogin.com/spasamples.onmicrosoft.com/oauth2/v2.0/token"
                );
            }
        );

        it("warns when multiple accounts are cached and routes using the first account", () => {
            jest.spyOn(browserStorage, "getAllAccounts").mockReturnValue([
                TestAccountDetails,
                {
                    ...TestAccountDetails,
                    homeAccountId: "another-account",
                },
            ]);
            const warning = jest.spyOn(logger, "warning");
            const authority = new CustomAuthAuthority(
                authorityUrl ?? "",
                config,
                StubbedNetworkModule,
                browserStorage,
                logger,
                performanceClient,
                customAuthProxyDomain
            );

            expect(authority.tokenEndpoint).toBe(
                "https://spasamples.ciamlogin.com/spasamples.onmicrosoft.com/oauth2/v2.0/token"
            );
            expect(warning).toHaveBeenCalledWith(
                "Multiple accounts found in cache. This is not supported in the Native Auth scenario.",
                expect.any(String)
            );
        });

        it("should return the correct token endpoint", () => {
            const customAuthAuthority = new CustomAuthAuthority(
                authorityUrl ?? "",
                config,
                StubbedNetworkModule,
                browserStorage,
                logger,
                performanceClient,
                customAuthProxyDomain
            );
            expect(customAuthAuthority.tokenEndpoint).toBe(
                "https://myspafunctiont1.azurewebsites.net/api/ReverseProxy/oauth2/v2.0/token"
            );
        });
    });
});
