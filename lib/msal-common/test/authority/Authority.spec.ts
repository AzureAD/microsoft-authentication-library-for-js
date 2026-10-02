import {
    Authority,
    buildStaticAuthorityOptions,
    formatAuthorityUri,
    getTenantFromAuthorityString,
} from "../../src/authority/Authority.js";
import {
    INetworkModule,
    NetworkRequestOptions,
} from "../../src/network/INetworkModule.js";
import * as Constants from "../../src/utils/Constants.js";
import {
    TEST_URIS,
    RANDOM_TEST_GUID,
    DEFAULT_OPENID_CONFIG_RESPONSE,
    TEST_CONFIG,
    DEFAULT_TENANT_DISCOVERY_RESPONSE,
    B2C_OPENID_CONFIG_RESPONSE,
} from "../test_kit/StringConstants.js";
import {
    ClientConfigurationError,
    createClientConfigurationError,
    ClientConfigurationErrorCodes,
} from "../../src/error/ClientConfigurationError.js";
import { MockStorageClass, mockCrypto } from "../client/ClientTestUtils.js";
import {
    ClientAuthError,
    createClientAuthError,
    ClientAuthErrorCodes,
} from "../../src/error/ClientAuthError.js";
import {
    AuthorityOptions,
    StaticAuthorityOptions,
} from "../../src/authority/AuthorityOptions.js";
import { ProtocolMode } from "../../src/authority/ProtocolMode.js";
import { AuthorityMetadataEntity } from "../../src/cache/entities/AuthorityMetadataEntity.js";
import { OpenIdConfigResponse } from "../../src/authority/OpenIdConfigResponse.js";
import {
    CacheHelpers,
    Logger,
    LogLevel,
    TimeUtils,
    UrlString,
} from "../../src/index.js";
import {
    isValidRegionName,
    RegionDiscovery,
} from "../../src/authority/RegionDiscovery.js";
import { RegionDiscoveryMetadata } from "../../src/authority/RegionDiscoveryMetadata.js";
import { InstanceDiscoveryMetadata } from "../../src/authority/AuthorityMetadata.js";
import * as authorityMetadata from "../../src/authority/AuthorityMetadata.js";
import { getDefaultErrorMessage } from "../../src/error/AuthError.js";
import { StubPerformanceClient } from "../../src/telemetry/performance/StubPerformanceClient.js";

let mockStorage: MockStorageClass;

const authorityOptions: AuthorityOptions = {
    protocolMode: ProtocolMode.AAD,
    knownAuthorities: [Constants.DEFAULT_AUTHORITY_HOST],
    cloudDiscoveryMetadata: "",
    authorityMetadata: "",
};

const loggerOptions = {
    loggerCallback: (): void => {},
    piiLoggingEnabled: true,
    logLevel: LogLevel.Verbose,
};
const logger = new Logger(loggerOptions);

const authorityMetadataCacheValue: AuthorityMetadataEntity = {
    authorization_endpoint:
        DEFAULT_OPENID_CONFIG_RESPONSE.body.authorization_endpoint,
    token_endpoint: DEFAULT_OPENID_CONFIG_RESPONSE.body.token_endpoint,
    end_session_endpoint:
        DEFAULT_OPENID_CONFIG_RESPONSE.body.end_session_endpoint,
    issuer: DEFAULT_OPENID_CONFIG_RESPONSE.body.issuer,
    jwks_uri: DEFAULT_OPENID_CONFIG_RESPONSE.body.jwks_uri,
    endpointsFromNetwork: true,
    aliases: DEFAULT_TENANT_DISCOVERY_RESPONSE.body.metadata[0].aliases,
    preferred_cache:
        DEFAULT_TENANT_DISCOVERY_RESPONSE.body.metadata[0].preferred_cache,
    preferred_network:
        DEFAULT_TENANT_DISCOVERY_RESPONSE.body.metadata[0].preferred_network,
    aliasesFromNetwork: true,
    canonical_authority: Constants.DEFAULT_AUTHORITY,
    expiresAt: CacheHelpers.generateAuthorityMetadataExpiresAt(),
};

describe("Authority.ts Class Unit Tests", () => {
    beforeEach(() => {
        mockStorage = new MockStorageClass(
            TEST_CONFIG.MSAL_CLIENT_ID,
            mockCrypto,
            logger,
            new StubPerformanceClient()
        );
    });
    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("Constructor", () => {
        it("Creates canonical authority uri based on given uri (and normalizes with '/')", () => {
            const networkInterface: INetworkModule = {
                sendGetRequestAsync<T>(
                    url: string,
                    options?: NetworkRequestOptions
                ): T {
                    // @ts-ignore
                    return null;
                },
                sendPostRequestAsync<T>(
                    url: string,
                    options?: NetworkRequestOptions
                ): T {
                    // @ts-ignore
                    return null;
                },
            };
            const authority = new Authority(
                Constants.DEFAULT_AUTHORITY,
                networkInterface,
                mockStorage,
                authorityOptions,
                logger,
                TEST_CONFIG.CORRELATION_ID,
                new StubPerformanceClient()
            );
            expect(authority.canonicalAuthority).toBe(
                `${Constants.DEFAULT_AUTHORITY}`
            );
        });

        it("Throws error if URI is not in valid format", () => {
            const networkInterface: INetworkModule = {
                sendGetRequestAsync<T>(
                    url: string,
                    options?: NetworkRequestOptions
                ): T {
                    // @ts-ignore
                    return null;
                },
                sendPostRequestAsync<T>(
                    url: string,
                    options?: NetworkRequestOptions
                ): T {
                    // @ts-ignore
                    return null;
                },
            };

            expect(
                () =>
                    new Authority(
                        "http://login.microsoftonline.com/common",
                        networkInterface,
                        mockStorage,
                        authorityOptions,
                        logger,
                        TEST_CONFIG.CORRELATION_ID,
                        new StubPerformanceClient()
                    )
            ).toThrow(
                new ClientConfigurationError(
                    ClientConfigurationErrorCodes.authorityUriInsecure,
                    ""
                )
            );
            expect(
                () =>
                    new Authority(
                        "This is not a URI",
                        networkInterface,
                        mockStorage,
                        authorityOptions,
                        logger,
                        TEST_CONFIG.CORRELATION_ID,
                        new StubPerformanceClient()
                    )
            ).toThrow(
                new ClientConfigurationError(
                    ClientConfigurationErrorCodes.urlParseError,
                    ""
                )
            );
            expect(
                () =>
                    new Authority(
                        "",
                        networkInterface,
                        mockStorage,
                        authorityOptions,
                        logger,
                        TEST_CONFIG.CORRELATION_ID,
                        new StubPerformanceClient()
                    )
            ).toThrow(
                new ClientConfigurationError(
                    ClientConfigurationErrorCodes.urlEmptyError,
                    ""
                )
            );
        });
    });

    describe("Getters and setters", () => {
        const networkInterface: INetworkModule = {
            sendGetRequestAsync<T>(
                url: string,
                options?: NetworkRequestOptions
            ): T {
                // @ts-ignore
                return null;
            },
            sendPostRequestAsync<T>(
                url: string,
                options?: NetworkRequestOptions
            ): T {
                // @ts-ignore
                return null;
            },
        };
        let authority: Authority;
        beforeEach(() => {
            authority = new Authority(
                Constants.DEFAULT_AUTHORITY,
                networkInterface,
                mockStorage,
                authorityOptions,
                logger,
                TEST_CONFIG.CORRELATION_ID,
                new StubPerformanceClient()
            );
        });

        it("Gets canonical authority that ends in '/'", () => {
            expect(authority.canonicalAuthority.endsWith("/")).toBe(true);
            expect(authority.canonicalAuthority).toBe(
                `${Constants.DEFAULT_AUTHORITY}`
            );
        });

        it("Set canonical authority performs validation and canonicalization on url", () => {
            expect(
                () =>
                    (authority.canonicalAuthority =
                        "http://login.microsoftonline.com/common")
            ).toThrow(
                new ClientConfigurationError(
                    ClientConfigurationErrorCodes.authorityUriInsecure,
                    ""
                )
            );
            expect(
                () =>
                    (authority.canonicalAuthority =
                        "https://login.microsoftonline.com/")
            ).not.toThrow();
            expect(
                () => (authority.canonicalAuthority = "This is not a URI")
            ).toThrow(
                new ClientConfigurationError(
                    ClientConfigurationErrorCodes.urlParseError,
                    ""
                )
            );

            authority.canonicalAuthority = `${TEST_URIS.ALTERNATE_INSTANCE}/${RANDOM_TEST_GUID}`;
            expect(authority.canonicalAuthority.endsWith("/")).toBe(true);
            expect(authority.canonicalAuthority).toBe(
                `${TEST_URIS.ALTERNATE_INSTANCE}/${RANDOM_TEST_GUID}/`
            );
        });

        it("Get canonicalAuthorityUrlComponents returns current url components", () => {
            expect(authority.canonicalAuthorityUrlComponents.Protocol).toBe(
                "https:"
            );
            expect(
                authority.canonicalAuthorityUrlComponents.HostNameAndPort
            ).toBe("login.microsoftonline.com");
            expect(
                authority.canonicalAuthorityUrlComponents.PathSegments
            ).toEqual(["common"]);
            expect(authority.canonicalAuthorityUrlComponents.AbsolutePath).toBe(
                "/common/"
            );
            expect(
                authority.canonicalAuthorityUrlComponents.Hash
            ).toBeUndefined();
            expect(
                authority.canonicalAuthorityUrlComponents.Search
            ).toBeUndefined();
        });

        it("tenant is equal to first path segment value", () => {
            expect(authority.tenant).toBe("common");
            expect(authority.tenant).toBe(
                authority.canonicalAuthorityUrlComponents.PathSegments[0]
            );
        });

        it("Gets options that were passed into constructor", () => {
            expect(authority.options).toBe(authorityOptions);
        });

        describe("OAuth Endpoints", () => {
            beforeEach(async () => {
                jest.spyOn(
                    Authority.prototype,
                    <any>"getEndpointMetadataFromNetwork"
                ).mockResolvedValue(DEFAULT_OPENID_CONFIG_RESPONSE.body);
                await authority.resolveEndpointsAsync();
            });

            it("Returns authorization_endpoint of tenantDiscoveryResponse", () => {
                expect(authority.authorizationEndpoint).toBe(
                    DEFAULT_OPENID_CONFIG_RESPONSE.body.authorization_endpoint.replace(
                        "{tenant}",
                        "common"
                    )
                );
            });

            it("Returns token_endpoint of tenantDiscoveryResponse", () => {
                expect(authority.tokenEndpoint).toBe(
                    DEFAULT_OPENID_CONFIG_RESPONSE.body.token_endpoint.replace(
                        "{tenant}",
                        "common"
                    )
                );
            });

            it("Returns end_session_endpoint of tenantDiscoveryResponse", () => {
                expect(authority.endSessionEndpoint).toBe(
                    DEFAULT_OPENID_CONFIG_RESPONSE.body.end_session_endpoint.replace(
                        "{tenant}",
                        "common"
                    )
                );
            });

            it("Returns issuer of tenantDiscoveryResponse for selfSignedJwtAudience", () => {
                expect(authority.selfSignedJwtAudience).toBe(
                    DEFAULT_OPENID_CONFIG_RESPONSE.body.issuer.replace(
                        "{tenant}",
                        "common"
                    )
                );
            });

            it("Returns jwks_uri of tenantDiscoveryResponse", () => {
                expect(authority.jwksUri).toBe(
                    DEFAULT_OPENID_CONFIG_RESPONSE.body.jwks_uri.replace(
                        "{tenant}",
                        "common"
                    )
                );
            });

            it("Throws error if endpoint discovery is incomplete for authorizationEndpoint, tokenEndpoint, endSessionEndpoint and selfSignedJwtAudience", () => {
                authority = new Authority(
                    Constants.DEFAULT_AUTHORITY,
                    networkInterface,
                    mockStorage,
                    authorityOptions,
                    logger,
                    TEST_CONFIG.CORRELATION_ID,
                    new StubPerformanceClient()
                );
                expect(() => authority.authorizationEndpoint).toThrowError(
                    createClientAuthError(
                        ClientAuthErrorCodes.endpointResolutionError,
                        ""
                    )
                );
                expect(() => authority.tokenEndpoint).toThrowError(
                    createClientAuthError(
                        ClientAuthErrorCodes.endpointResolutionError,
                        ""
                    )
                );
                expect(() => authority.endSessionEndpoint).toThrowError(
                    createClientAuthError(
                        ClientAuthErrorCodes.endpointResolutionError,
                        ""
                    )
                );
                expect(() => authority.deviceCodeEndpoint).toThrowError(
                    createClientAuthError(
                        ClientAuthErrorCodes.endpointResolutionError,
                        ""
                    )
                );
                expect(() => authority.selfSignedJwtAudience).toThrowError(
                    createClientAuthError(
                        ClientAuthErrorCodes.endpointResolutionError,
                        ""
                    )
                );
                expect(() => authority.jwksUri).toThrowError(
                    createClientAuthError(
                        ClientAuthErrorCodes.endpointResolutionError,
                        ""
                    )
                );
            });

            it("Returns endpoints for different b2c policy than what is cached", async () => {
                jest.clearAllMocks();
                const signInPolicy = "b2c_1_sisopolicy";
                const resetPolicy = "b2c_1_password_reset";
                const baseAuthority =
                    "https://msidlabb2c.b2clogin.com/msidlabb2c.onmicrosoft.com/";
                jest.spyOn(
                    Authority.prototype,
                    <any>"getEndpointMetadataFromNetwork"
                ).mockResolvedValue(B2C_OPENID_CONFIG_RESPONSE.body);

                authority = new Authority(
                    `${baseAuthority}${signInPolicy}`,
                    networkInterface,
                    mockStorage,
                    {
                        ...authorityOptions,
                        knownAuthorities: ["msidlabb2c.b2clogin.com"],
                    },
                    logger,
                    TEST_CONFIG.CORRELATION_ID,
                    new StubPerformanceClient()
                );

                await authority.resolveEndpointsAsync();
                const secondAuthority = new Authority(
                    `${baseAuthority}${resetPolicy}`,
                    networkInterface,
                    mockStorage,
                    {
                        ...authorityOptions,
                        knownAuthorities: ["msidlabb2c.b2clogin.com"],
                    },
                    logger,
                    TEST_CONFIG.CORRELATION_ID,
                    new StubPerformanceClient()
                );

                await secondAuthority.resolveEndpointsAsync();

                expect(authority.authorizationEndpoint).toBe(
                    B2C_OPENID_CONFIG_RESPONSE.body.authorization_endpoint
                );
                expect(secondAuthority.authorizationEndpoint).toBe(
                    B2C_OPENID_CONFIG_RESPONSE.body.authorization_endpoint.replace(
                        signInPolicy,
                        resetPolicy
                    )
                );
                expect(authority.tokenEndpoint).toBe(
                    B2C_OPENID_CONFIG_RESPONSE.body.token_endpoint
                );
                expect(secondAuthority.tokenEndpoint).toBe(
                    B2C_OPENID_CONFIG_RESPONSE.body.token_endpoint.replace(
                        signInPolicy,
                        resetPolicy
                    )
                );
                expect(authority.endSessionEndpoint).toBe(
                    B2C_OPENID_CONFIG_RESPONSE.body.end_session_endpoint
                );
                expect(secondAuthority.endSessionEndpoint).toBe(
                    B2C_OPENID_CONFIG_RESPONSE.body.end_session_endpoint.replace(
                        signInPolicy,
                        resetPolicy
                    )
                );
            });
        });

        describe("Switch tenants", () => {
            const tenant = "51db77ae-2865-4010-bc5d-8f99097f494b";
            const newTenant = "1d56e21e-b696-410b-83a0-bc2d775d0b39";
            const tenantDomain = "tenant.domain.onmicrosoft.com";
            const newTenantDomain = "new.tenant.domain.onmicrosoft.com";
            const response = { ...DEFAULT_OPENID_CONFIG_RESPONSE.body };
            const b2cResponse = { ...B2C_OPENID_CONFIG_RESPONSE.body };
            for (const [key, value] of Object.entries(response)) {
                if (typeof response[key] === "string") {
                    // @ts-ignore
                    response[key] = value.replace("{tenant}", tenant);
                }
            }

            it("Returns correct endpoint for AAD", async () => {
                jest.spyOn(
                    Authority.prototype,
                    <any>"getEndpointMetadataFromHardcodedValues"
                ).mockReturnValue(response);

                const authority = new Authority(
                    Constants.DEFAULT_AUTHORITY,
                    networkInterface,
                    mockStorage,
                    authorityOptions,
                    logger,
                    TEST_CONFIG.CORRELATION_ID,
                    new StubPerformanceClient()
                );
                await authority.resolveEndpointsAsync();

                expect(authority.authorizationEndpoint).toBe(
                    response.authorization_endpoint
                );

                const newAuthorityEndpoint =
                    response.authorization_endpoint.replace(tenant, newTenant);
                const urlComponents = new UrlString(
                    newAuthorityEndpoint,
                    ""
                ).getUrlComponents();

                // Mimic tenant switching
                // @ts-ignore
                authority.metadata.authorization_endpoint =
                    newAuthorityEndpoint;
                jest.spyOn(
                    Authority.prototype,
                    <any>"canonicalAuthorityUrlComponents",
                    "get"
                ).mockReturnValue(urlComponents);

                expect(authority.authorizationEndpoint).toBe(
                    response.authorization_endpoint.replace(tenant, newTenant)
                );
            });

            it("Returns correct endpoint for B2C", async () => {
                jest.spyOn(
                    Authority.prototype,
                    <any>"getEndpointMetadataFromNetwork"
                ).mockResolvedValue(b2cResponse);

                const baseAuthority = `https://msidlabb2c.b2clogin.com/tfp/${tenantDomain}/`;
                const customAuthority = new Authority(
                    baseAuthority,
                    networkInterface,
                    mockStorage,
                    {
                        ...authorityOptions,
                        knownAuthorities: ["msidlabb2c.b2clogin.com"],
                    },
                    logger,
                    TEST_CONFIG.CORRELATION_ID,
                    new StubPerformanceClient()
                );
                await customAuthority.resolveEndpointsAsync();

                expect(customAuthority.authorizationEndpoint).toBe(
                    b2cResponse.authorization_endpoint
                );

                const newAuthorityEndpoint =
                    b2cResponse.authorization_endpoint.replace(
                        tenantDomain,
                        newTenantDomain
                    );
                const urlComponents = new UrlString(
                    newAuthorityEndpoint,
                    ""
                ).getUrlComponents();

                // Mimic tenant switching
                // @ts-ignore
                customAuthority.metadata.authorization_endpoint =
                    newAuthorityEndpoint;
                jest.spyOn(
                    Authority.prototype,
                    <any>"canonicalAuthorityUrlComponents",
                    "get"
                ).mockReturnValue(urlComponents);

                expect(customAuthority.authorizationEndpoint).toBe(
                    b2cResponse.authorization_endpoint.replace(
                        tenantDomain,
                        newTenantDomain
                    )
                );
            });

            it("Returns correct endpoint when AAD cached canonical endpoint contains tenant name", async () => {
                jest.spyOn(
                    Authority.prototype,
                    <any>"getEndpointMetadataFromNetwork"
                ).mockResolvedValue(response);

                const customAuthority = new Authority(
                    `https://login.microsoftonline.com/${tenantDomain}/`,
                    networkInterface,
                    mockStorage,
                    authorityOptions,
                    logger,
                    TEST_CONFIG.CORRELATION_ID,
                    new StubPerformanceClient()
                );
                await customAuthority.resolveEndpointsAsync();

                expect(customAuthority.authorizationEndpoint).toBe(
                    response.authorization_endpoint.replace(
                        tenant,
                        tenantDomain
                    )
                );

                const newAuthorityEndpoint =
                    response.authorization_endpoint.replace(tenant, newTenant);
                const urlComponents = new UrlString(
                    newAuthorityEndpoint,
                    ""
                ).getUrlComponents();

                // Mimic tenant switching
                // @ts-ignore
                customAuthority.metadata.authorization_endpoint =
                    newAuthorityEndpoint;
                jest.spyOn(
                    Authority.prototype,
                    <any>"canonicalAuthorityUrlComponents",
                    "get"
                ).mockReturnValue(urlComponents);

                expect(customAuthority.authorizationEndpoint).toBe(
                    response.authorization_endpoint.replace(tenant, newTenant)
                );
            });
        });
    });

    describe("Regional authorities", () => {
        const networkInterface: INetworkModule = {
            sendGetRequestAsync<T>(
                url: string,
                options?: NetworkRequestOptions
            ): T {
                return {} as T;
            },
            sendPostRequestAsync<T>(
                url: string,
                options?: NetworkRequestOptions
            ): T {
                return {} as T;
            },
        };

        const authorityOptions = {
            protocolMode: ProtocolMode.AAD,
            knownAuthorities: [Constants.DEFAULT_AUTHORITY_HOST],
            cloudDiscoveryMetadata: "",
            authorityMetadata: "",
            azureRegionConfiguration: {
                azureRegion: "westus2",
                environmentRegion: undefined,
            },
        };

        it("discovery endpoint metadata is updated with regional information when the region is provided", async () => {
            const deepCopyOpenIdResponse = JSON.parse(
                JSON.stringify(DEFAULT_OPENID_CONFIG_RESPONSE)
            );
            networkInterface.sendGetRequestAsync = (
                url: string,
                options?: NetworkRequestOptions
            ): any => {
                return JSON.parse(
                    JSON.stringify(DEFAULT_OPENID_CONFIG_RESPONSE)
                );
            };

            const authority = new Authority(
                Constants.DEFAULT_AUTHORITY,
                networkInterface,
                mockStorage,
                authorityOptions,
                logger,
                TEST_CONFIG.CORRELATION_ID,
                new StubPerformanceClient()
            );
            await authority.resolveEndpointsAsync();

            expect(authority.discoveryComplete()).toBe(true);
            expect(authority.authorizationEndpoint).toEqual(
                `${deepCopyOpenIdResponse.body.authorization_endpoint
                    .replace("{tenant}", "common")
                    .replace(
                        "login.microsoftonline.com",
                        "westus2.login.microsoft.com"
                    )}/`
            );
            expect(authority.tokenEndpoint).toEqual(
                `${deepCopyOpenIdResponse.body.token_endpoint
                    .replace("{tenant}", "common")
                    .replace(
                        "login.microsoftonline.com",
                        "westus2.login.microsoft.com"
                    )}/`
            );
            expect(authority.endSessionEndpoint).toEqual(
                `${deepCopyOpenIdResponse.body.end_session_endpoint
                    .replace("{tenant}", "common")
                    .replace(
                        "login.microsoftonline.com",
                        "westus2.login.microsoft.com"
                    )}/`
            );
        });

        it("region provided by the user overrides the region auto-discovered", async () => {
            const deepCopyOpenIdResponse = JSON.parse(
                JSON.stringify(DEFAULT_OPENID_CONFIG_RESPONSE)
            );
            networkInterface.sendGetRequestAsync = (
                url: string,
                options?: NetworkRequestOptions
            ): any => {
                return JSON.parse(
                    JSON.stringify(DEFAULT_OPENID_CONFIG_RESPONSE)
                );
            };

            const authority = new Authority(
                Constants.DEFAULT_AUTHORITY,
                networkInterface,
                mockStorage,
                {
                    ...authorityOptions,
                    azureRegionConfiguration: {
                        azureRegion: "westus2",
                        environmentRegion: "centralus",
                    },
                },
                logger,
                TEST_CONFIG.CORRELATION_ID,
                new StubPerformanceClient()
            );
            await authority.resolveEndpointsAsync();

            expect(authority.discoveryComplete()).toBe(true);
            expect(authority.authorizationEndpoint).toEqual(
                `${deepCopyOpenIdResponse.body.authorization_endpoint
                    .replace("{tenant}", "common")
                    .replace(
                        "login.microsoftonline.com",
                        "westus2.login.microsoft.com"
                    )}/`
            );
            expect(authority.tokenEndpoint).toEqual(
                `${deepCopyOpenIdResponse.body.token_endpoint
                    .replace("{tenant}", "common")
                    .replace(
                        "login.microsoftonline.com",
                        "westus2.login.microsoft.com"
                    )}/`
            );
            expect(authority.endSessionEndpoint).toEqual(
                `${deepCopyOpenIdResponse.body.end_session_endpoint
                    .replace("{tenant}", "common")
                    .replace(
                        "login.microsoftonline.com",
                        "westus2.login.microsoft.com"
                    )}/`
            );
        });

        it.each([
            "hostile.example/path",
            "hostile.example?query",
            "hostile.example#fragment",
            "east.us",
            "EastUS",
            "east us",
        ])("throws for invalid configured region %s", async (invalidRegion) => {
            const authority = new Authority(
                Constants.DEFAULT_AUTHORITY,
                networkInterface,
                mockStorage,
                {
                    ...authorityOptions,
                    azureRegionConfiguration: {
                        azureRegion: invalidRegion,
                        environmentRegion: undefined,
                    },
                },
                logger,
                TEST_CONFIG.CORRELATION_ID,
                new StubPerformanceClient()
            );

            await expect(
                authority.resolveEndpointsAsync()
            ).rejects.toMatchObject({
                errorCode: "invalid_azure_region",
            });
        });

        it("region is not auto-discovered if a region is provided by the user", async () => {
            const deepCopyOpenIdResponse = JSON.parse(
                JSON.stringify(DEFAULT_OPENID_CONFIG_RESPONSE)
            );
            networkInterface.sendGetRequestAsync = (
                url: string,
                options?: NetworkRequestOptions
            ): any => {
                return JSON.parse(
                    JSON.stringify(DEFAULT_OPENID_CONFIG_RESPONSE)
                );
            };

            const regionDiscoverySpy = jest.spyOn(
                RegionDiscovery.prototype,
                <any>"detectRegion"
            );

            const authority = new Authority(
                Constants.DEFAULT_AUTHORITY,
                networkInterface,
                mockStorage,
                {
                    ...authorityOptions,
                    azureRegionConfiguration: {
                        azureRegion: "westus2",
                        environmentRegion: "centralus",
                    },
                },
                logger,
                TEST_CONFIG.CORRELATION_ID,
                new StubPerformanceClient()
            );
            await authority.resolveEndpointsAsync();

            expect(regionDiscoverySpy).not.toHaveBeenCalled();

            expect(authority.discoveryComplete()).toBe(true);
            expect(authority.authorizationEndpoint).toEqual(
                `${deepCopyOpenIdResponse.body.authorization_endpoint
                    .replace("{tenant}", "common")
                    .replace(
                        "login.microsoftonline.com",
                        "westus2.login.microsoft.com"
                    )}/`
            );
            expect(authority.tokenEndpoint).toEqual(
                `${deepCopyOpenIdResponse.body.token_endpoint
                    .replace("{tenant}", "common")
                    .replace(
                        "login.microsoftonline.com",
                        "westus2.login.microsoft.com"
                    )}/`
            );
            expect(authority.endSessionEndpoint).toEqual(
                `${deepCopyOpenIdResponse.body.end_session_endpoint
                    .replace("{tenant}", "common")
                    .replace(
                        "login.microsoftonline.com",
                        "westus2.login.microsoft.com"
                    )}/`
            );
        });

        it("auto discovered region only used when the user provides the AUTO_DISCOVER flag", async () => {
            const deepCopyOpenIdResponse = JSON.parse(
                JSON.stringify(DEFAULT_OPENID_CONFIG_RESPONSE)
            );
            networkInterface.sendGetRequestAsync = (
                url: string,
                options?: NetworkRequestOptions
            ): any => {
                return JSON.parse(
                    JSON.stringify(DEFAULT_OPENID_CONFIG_RESPONSE)
                );
            };

            const authority = new Authority(
                Constants.DEFAULT_AUTHORITY,
                networkInterface,
                mockStorage,
                {
                    ...authorityOptions,
                    azureRegionConfiguration: {
                        azureRegion: Constants.AZURE_REGION_AUTO_DISCOVER_FLAG,
                        environmentRegion: "centralus",
                    },
                },
                logger,
                TEST_CONFIG.CORRELATION_ID,
                new StubPerformanceClient()
            );
            await authority.resolveEndpointsAsync();

            expect(authority.discoveryComplete()).toBe(true);
            expect(authority.authorizationEndpoint).toEqual(
                `${deepCopyOpenIdResponse.body.authorization_endpoint
                    .replace("{tenant}", "common")
                    .replace(
                        "login.microsoftonline.com",
                        "centralus.login.microsoft.com"
                    )}/`
            );
            expect(authority.tokenEndpoint).toEqual(
                `${deepCopyOpenIdResponse.body.token_endpoint
                    .replace("{tenant}", "common")
                    .replace(
                        "login.microsoftonline.com",
                        "centralus.login.microsoft.com"
                    )}/`
            );
            expect(authority.endSessionEndpoint).toEqual(
                `${deepCopyOpenIdResponse.body.end_session_endpoint
                    .replace("{tenant}", "common")
                    .replace(
                        "login.microsoftonline.com",
                        "centralus.login.microsoft.com"
                    )}/`
            );
        });

        it("fallbacks to the global endpoint when the user provides the AUTO_DISCOVER flag but no region is detected", async () => {
            const deepCopyOpenIdResponse = JSON.parse(
                JSON.stringify(DEFAULT_OPENID_CONFIG_RESPONSE)
            );
            networkInterface.sendGetRequestAsync = (
                url: string,
                options?: NetworkRequestOptions
            ): any => {
                return JSON.parse(
                    JSON.stringify(DEFAULT_OPENID_CONFIG_RESPONSE)
                );
            };

            const authority = new Authority(
                Constants.DEFAULT_AUTHORITY,
                networkInterface,
                mockStorage,
                {
                    ...authorityOptions,
                    azureRegionConfiguration: {
                        azureRegion: Constants.AZURE_REGION_AUTO_DISCOVER_FLAG,
                        environmentRegion: undefined,
                    },
                },
                logger,
                TEST_CONFIG.CORRELATION_ID,
                new StubPerformanceClient()
            );
            await authority.resolveEndpointsAsync();

            expect(authority.discoveryComplete()).toBe(true);
            expect(authority.authorizationEndpoint).toEqual(
                deepCopyOpenIdResponse.body.authorization_endpoint.replace(
                    "{tenant}",
                    "common"
                )
            );
            expect(authority.tokenEndpoint).toEqual(
                deepCopyOpenIdResponse.body.token_endpoint.replace(
                    "{tenant}",
                    "common"
                )
            );
            expect(authority.endSessionEndpoint).toEqual(
                deepCopyOpenIdResponse.body.end_session_endpoint.replace(
                    "{tenant}",
                    "common"
                )
            );
        });
    });

    describe("RegionDiscovery IMDS compute endpoint", () => {
        const correlationId = TEST_CONFIG.CORRELATION_ID;

        const buildNetworkInterface = (
            getImpl: (url: string, options?: NetworkRequestOptions) => unknown
        ): INetworkModule => ({
            sendGetRequestAsync: <T>(
                url: string,
                options?: NetworkRequestOptions
            ): Promise<T> => Promise.resolve(getImpl(url, options) as T),
            sendPostRequestAsync: <T>(): Promise<T> => Promise.resolve({} as T),
        });

        it.each(["eastus", "westus2", "east-us-2", "a", "a1", "a-1"])(
            "accepts valid region name %s",
            (region) => {
                expect(isValidRegionName(region)).toBe(true);
            }
        );

        it.each([
            "",
            "hostile.example/path",
            "hostile.example?query",
            "hostile.example#fragment",
            "EastUS",
            "1eastus",
            "-eastus",
            "east_us",
            "east us",
            "eastus\n",
        ])("rejects invalid region name %s", (region) => {
            expect(isValidRegionName(region)).toBe(false);
        });

        it("throws for an invalid environment region", async () => {
            const networkInterface = buildNetworkInterface(() => ({
                status: Constants.HTTP_SUCCESS,
                body: { location: "centralus" },
            }));
            const regionDiscovery = new RegionDiscovery(
                networkInterface,
                logger,
                new StubPerformanceClient(),
                correlationId
            );
            const regionDiscoveryMetadata: RegionDiscoveryMetadata = {};

            await expect(
                regionDiscovery.detectRegion(
                    "hostile.example/path",
                    regionDiscoveryMetadata
                )
            ).rejects.toMatchObject({
                errorCode: "invalid_azure_region",
            });
        });

        it("throws for an invalid region returned by IMDS", async () => {
            const networkInterface = buildNetworkInterface(() => ({
                status: Constants.HTTP_SUCCESS,
                body: { location: "hostile.example/path" },
            }));
            const regionDiscovery = new RegionDiscovery(
                networkInterface,
                logger,
                new StubPerformanceClient(),
                correlationId
            );
            const regionDiscoveryMetadata: RegionDiscoveryMetadata = {};

            await expect(
                regionDiscovery.detectRegion(undefined, regionDiscoveryMetadata)
            ).rejects.toMatchObject({
                errorCode: "invalid_azure_region",
            });
        });

        it("calls the IMDS /compute JSON endpoint and reads the location field", async () => {
            let requestedUrl = "";
            const networkInterface = buildNetworkInterface((url) => {
                requestedUrl = url;
                return {
                    status: Constants.HTTP_SUCCESS,
                    body: { location: "centralus" },
                };
            });

            const regionDiscovery = new RegionDiscovery(
                networkInterface,
                logger,
                new StubPerformanceClient(),
                correlationId
            );
            const regionDiscoveryMetadata: RegionDiscoveryMetadata = {};

            const region = await regionDiscovery.detectRegion(
                undefined,
                regionDiscoveryMetadata
            );

            expect(region).toBe("centralus");
            expect(requestedUrl).toBe(
                `${Constants.IMDS_ENDPOINT}?api-version=${Constants.IMDS_VERSION}`
            );
            expect(requestedUrl).toContain(
                "metadata/instance/compute?api-version=2021-02-01"
            );
            expect(requestedUrl).not.toContain("format=text");
            expect(requestedUrl).not.toContain("/compute/location");
            expect(regionDiscoveryMetadata.region_source).toBe(
                Constants.RegionDiscoverySources.IMDS
            );
        });

        it("falls back to FAILED_AUTO_DETECTION when the location field is missing", async () => {
            const networkInterface = buildNetworkInterface(() => ({
                status: Constants.HTTP_SUCCESS,
                body: { vmId: "11111111-1111-1111-1111-111111111111" },
            }));

            const regionDiscovery = new RegionDiscovery(
                networkInterface,
                logger,
                new StubPerformanceClient(),
                correlationId
            );
            const regionDiscoveryMetadata: RegionDiscoveryMetadata = {};

            const region = await regionDiscovery.detectRegion(
                undefined,
                regionDiscoveryMetadata
            );

            expect(region).toBeNull();
            expect(regionDiscoveryMetadata.region_source).toBe(
                Constants.RegionDiscoverySources.FAILED_AUTO_DETECTION
            );
        });

        it("falls back to FAILED_AUTO_DETECTION when the location field is null", async () => {
            const networkInterface = buildNetworkInterface(() => ({
                status: Constants.HTTP_SUCCESS,
                body: { location: null },
            }));

            const regionDiscovery = new RegionDiscovery(
                networkInterface,
                logger,
                new StubPerformanceClient(),
                correlationId
            );
            const regionDiscoveryMetadata: RegionDiscoveryMetadata = {};

            const region = await regionDiscovery.detectRegion(
                undefined,
                regionDiscoveryMetadata
            );

            expect(region).toBeNull();
            expect(regionDiscoveryMetadata.region_source).toBe(
                Constants.RegionDiscoverySources.FAILED_AUTO_DETECTION
            );
        });

        it("falls back to FAILED_AUTO_DETECTION when the IMDS body is malformed JSON", async () => {
            // The network client throws while parsing a malformed JSON body.
            const networkInterface = buildNetworkInterface(() => {
                throw new Error("Failed to parse response");
            });

            const regionDiscovery = new RegionDiscovery(
                networkInterface,
                logger,
                new StubPerformanceClient(),
                correlationId
            );
            const regionDiscoveryMetadata: RegionDiscoveryMetadata = {};

            const region = await regionDiscovery.detectRegion(
                undefined,
                regionDiscoveryMetadata
            );

            expect(region).toBeNull();
            expect(regionDiscoveryMetadata.region_source).toBe(
                Constants.RegionDiscoverySources.FAILED_AUTO_DETECTION
            );
        });

        it("negotiates a new api-version on 400 then reads location from the retry", async () => {
            const requestedUrls: string[] = [];
            const networkInterface = buildNetworkInterface((url) => {
                requestedUrls.push(url);

                // Probe for supported versions (no api-version param).
                if (url === `${Constants.IMDS_ENDPOINT}?format=json`) {
                    return {
                        status: Constants.HTTP_BAD_REQUEST,
                        body: {
                            error: "invalid",
                            "newest-versions": ["2020-10-01"],
                        },
                    };
                }

                // First call with the default api-version is rejected.
                if (
                    url ===
                    `${Constants.IMDS_ENDPOINT}?api-version=${Constants.IMDS_VERSION}`
                ) {
                    return { status: Constants.HTTP_BAD_REQUEST, body: {} };
                }

                // Retry with the negotiated api-version succeeds.
                return {
                    status: Constants.HTTP_SUCCESS,
                    body: { location: "centralus" },
                };
            });

            const regionDiscovery = new RegionDiscovery(
                networkInterface,
                logger,
                new StubPerformanceClient(),
                correlationId
            );
            const regionDiscoveryMetadata: RegionDiscoveryMetadata = {};

            const region = await regionDiscovery.detectRegion(
                undefined,
                regionDiscoveryMetadata
            );

            expect(region).toBe("centralus");
            expect(regionDiscoveryMetadata.region_source).toBe(
                Constants.RegionDiscoverySources.IMDS
            );
            expect(requestedUrls).toContain(
                `${Constants.IMDS_ENDPOINT}?api-version=2020-10-01`
            );
            requestedUrls.forEach((url) => {
                expect(url).not.toContain("format=text");
            });
        });
    });

    describe("Endpoint discovery", () => {
        const networkInterface: INetworkModule = {
            sendGetRequestAsync<T>(
                url: string,
                options?: NetworkRequestOptions
            ): T {
                // @ts-ignore
                return null;
            },
            sendPostRequestAsync<T>(
                url: string,
                options?: NetworkRequestOptions
            ): T {
                // @ts-ignore
                return null;
            },
        };
        let authority: Authority;
        beforeEach(() => {
            authority = new Authority(
                Constants.DEFAULT_AUTHORITY,
                networkInterface,
                mockStorage,
                authorityOptions,
                logger,
                TEST_CONFIG.CORRELATION_ID,
                new StubPerformanceClient()
            );
        });

        it("discoveryComplete returns false if endpoint discovery has not been completed", () => {
            expect(authority.discoveryComplete()).toBe(false);
        });

        it("discoveryComplete returns true if resolveEndpointsAsync resolves successfully", async () => {
            jest.spyOn(
                Authority.prototype,
                <any>"getEndpointMetadataFromNetwork"
            ).mockResolvedValue(DEFAULT_OPENID_CONFIG_RESPONSE.body);
            await authority.resolveEndpointsAsync();
            expect(authority.discoveryComplete()).toBe(true);
        });

        it("discoveryComplete returns true if resolveEndpointsAsync resolves successfully without end_session_endpoint", async () => {
            const metadata: OpenIdConfigResponse = {
                authorization_endpoint:
                    DEFAULT_OPENID_CONFIG_RESPONSE.body.authorization_endpoint,
                issuer: DEFAULT_OPENID_CONFIG_RESPONSE.body.issuer,
                token_endpoint:
                    DEFAULT_OPENID_CONFIG_RESPONSE.body.token_endpoint,
                jwks_uri: DEFAULT_OPENID_CONFIG_RESPONSE.body.jwks_uri,
            };
            networkInterface.sendGetRequestAsync = (
                url: string,
                options?: NetworkRequestOptions
            ): any => {
                return {
                    body: metadata,
                };
            };
            await authority.resolveEndpointsAsync();
            expect(authority.discoveryComplete()).toBe(true);
        });

        describe("Endpoint Metadata", () => {
            let getEndpointMetadataFromConfigSpy: jest.SpyInstance;
            let getEndpointMetadataFromHarcodedValuesSpy: jest.SpyInstance;
            let getEndpointMetadataFromNetworkSpy: jest.SpyInstance;

            beforeEach(() => {
                getEndpointMetadataFromConfigSpy = jest.spyOn(
                    Authority.prototype as any,
                    "getEndpointMetadataFromConfig"
                );

                getEndpointMetadataFromHarcodedValuesSpy = jest.spyOn(
                    Authority.prototype as any,
                    "getEndpointMetadataFromHardcodedValues"
                );

                getEndpointMetadataFromNetworkSpy = jest.spyOn(
                    Authority.prototype as any,
                    "getEndpointMetadataFromNetwork"
                );
            });

            afterEach(() => {
                jest.restoreAllMocks();
            });

            it("Gets endpoints from config", async () => {
                const options = {
                    protocolMode: ProtocolMode.AAD,
                    knownAuthorities: [Constants.DEFAULT_AUTHORITY_HOST],
                    cloudDiscoveryMetadata: "",
                    authorityMetadata: JSON.stringify(
                        DEFAULT_OPENID_CONFIG_RESPONSE.body
                    ),
                };
                authority = new Authority(
                    Constants.DEFAULT_AUTHORITY,
                    networkInterface,
                    mockStorage,
                    options,
                    logger,
                    TEST_CONFIG.CORRELATION_ID,
                    new StubPerformanceClient()
                );
                await authority.resolveEndpointsAsync();

                expect(authority.discoveryComplete()).toBe(true);
                expect(authority.authorizationEndpoint).toBe(
                    DEFAULT_OPENID_CONFIG_RESPONSE.body.authorization_endpoint.replace(
                        "{tenant}",
                        "common"
                    )
                );
                expect(authority.tokenEndpoint).toBe(
                    DEFAULT_OPENID_CONFIG_RESPONSE.body.token_endpoint.replace(
                        "{tenant}",
                        "common"
                    )
                );
                expect(authority.deviceCodeEndpoint).toBe(
                    authority.tokenEndpoint.replace("/token", "/devicecode")
                );
                expect(authority.endSessionEndpoint).toBe(
                    DEFAULT_OPENID_CONFIG_RESPONSE.body.end_session_endpoint.replace(
                        "{tenant}",
                        "common"
                    )
                );
                expect(authority.selfSignedJwtAudience).toBe(
                    DEFAULT_OPENID_CONFIG_RESPONSE.body.issuer.replace(
                        "{tenant}",
                        "common"
                    )
                );

                // Test that the metadata is cached
                const key = `authority-metadata-${TEST_CONFIG.MSAL_CLIENT_ID}-${Constants.DEFAULT_AUTHORITY_HOST}`;
                const cachedAuthorityMetadata =
                    mockStorage.getAuthorityMetadata(key);
                if (!cachedAuthorityMetadata) {
                    throw Error("Cached AuthorityMetadata should not be null!");
                } else {
                    expect(cachedAuthorityMetadata.authorization_endpoint).toBe(
                        DEFAULT_OPENID_CONFIG_RESPONSE.body
                            .authorization_endpoint
                    );
                    expect(cachedAuthorityMetadata.token_endpoint).toBe(
                        DEFAULT_OPENID_CONFIG_RESPONSE.body.token_endpoint
                    );
                    expect(cachedAuthorityMetadata.end_session_endpoint).toBe(
                        DEFAULT_OPENID_CONFIG_RESPONSE.body.end_session_endpoint
                    );
                    expect(cachedAuthorityMetadata.issuer).toBe(
                        DEFAULT_OPENID_CONFIG_RESPONSE.body.issuer
                    );
                    expect(cachedAuthorityMetadata.jwks_uri).toBe(
                        DEFAULT_OPENID_CONFIG_RESPONSE.body.jwks_uri
                    );
                    expect(cachedAuthorityMetadata.endpointsFromNetwork).toBe(
                        false
                    );
                }

                expect(getEndpointMetadataFromConfigSpy).toHaveBeenCalled();
                expect(
                    getEndpointMetadataFromHarcodedValuesSpy
                ).not.toHaveBeenCalled();
                expect(
                    getEndpointMetadataFromNetworkSpy
                ).not.toHaveBeenCalled();
            });

            it("Throws error if authorityMetadata cannot be parsed to json", (done) => {
                const options = {
                    protocolMode: ProtocolMode.AAD,
                    knownAuthorities: [Constants.DEFAULT_AUTHORITY_HOST],
                    cloudDiscoveryMetadata: "",
                    authorityMetadata: "invalid-json",
                };
                authority = new Authority(
                    Constants.DEFAULT_AUTHORITY,
                    networkInterface,
                    mockStorage,
                    options,
                    logger,
                    TEST_CONFIG.CORRELATION_ID,
                    new StubPerformanceClient()
                );
                authority.resolveEndpointsAsync().catch((e) => {
                    expect(e).toBeInstanceOf(ClientConfigurationError);
                    expect(e.errorMessage).toBe(
                        getDefaultErrorMessage(
                            ClientConfigurationErrorCodes.invalidAuthorityMetadata
                        )
                    );
                    done();
                });
            });

            it("Throws error if authority does not contain end_session_endpoint but calls logout", async () => {
                const authorityJson = {
                    ...DEFAULT_OPENID_CONFIG_RESPONSE.body,
                    end_session_endpoint: undefined,
                };

                const options = {
                    protocolMode: ProtocolMode.AAD,
                    knownAuthorities: [Constants.DEFAULT_AUTHORITY_HOST],
                    cloudDiscoveryMetadata: "",
                    authorityMetadata: JSON.stringify(authorityJson),
                };
                authority = new Authority(
                    Constants.DEFAULT_AUTHORITY,
                    networkInterface,
                    mockStorage,
                    options,
                    logger,
                    TEST_CONFIG.CORRELATION_ID,
                    new StubPerformanceClient()
                );
                await authority.resolveEndpointsAsync();

                expect(() => authority.endSessionEndpoint).toThrowError(
                    createClientAuthError(
                        ClientAuthErrorCodes.endSessionEndpointNotSupported,
                        ""
                    )
                );
            });

            it("Gets endpoints from hardcoded values", async () => {
                const customAuthorityOptions: AuthorityOptions = {
                    protocolMode: ProtocolMode.AAD,
                    knownAuthorities: [Constants.DEFAULT_AUTHORITY_HOST],
                    cloudDiscoveryMetadata: "",
                    authorityMetadata: "",
                };

                networkInterface.sendGetRequestAsync = (
                    url: string,
                    options?: NetworkRequestOptions
                ): any => {
                    return null;
                };

                authority = new Authority(
                    Constants.DEFAULT_AUTHORITY,
                    networkInterface,
                    mockStorage,
                    customAuthorityOptions,
                    logger,
                    TEST_CONFIG.CORRELATION_ID,
                    new StubPerformanceClient()
                );

                await authority.resolveEndpointsAsync();

                expect(authority.discoveryComplete()).toBe(true);
                expect(authority.authorizationEndpoint).toBe(
                    DEFAULT_OPENID_CONFIG_RESPONSE.body.authorization_endpoint.replace(
                        "{tenant}",
                        "common"
                    )
                );
                expect(authority.tokenEndpoint).toBe(
                    DEFAULT_OPENID_CONFIG_RESPONSE.body.token_endpoint.replace(
                        "{tenant}",
                        "common"
                    )
                );
                expect(authority.deviceCodeEndpoint).toBe(
                    authority.tokenEndpoint.replace("/token", "/devicecode")
                );
                expect(authority.endSessionEndpoint).toBe(
                    DEFAULT_OPENID_CONFIG_RESPONSE.body.end_session_endpoint.replace(
                        "{tenant}",
                        "common"
                    )
                );
                expect(authority.selfSignedJwtAudience).toBe(
                    DEFAULT_OPENID_CONFIG_RESPONSE.body.issuer.replace(
                        "{tenant}",
                        "common"
                    )
                );

                expect(getEndpointMetadataFromConfigSpy).toHaveBeenCalled();
                expect(
                    getEndpointMetadataFromHarcodedValuesSpy
                ).toHaveBeenCalled();
                expect(
                    getEndpointMetadataFromNetworkSpy
                ).not.toHaveBeenCalled();
            });

            it("Gets China cloud endpoints from hardcoded values for preferred and legacy aliases", async () => {
                const customAuthorityOptions: AuthorityOptions = {
                    protocolMode: ProtocolMode.AAD,
                    knownAuthorities: [],
                    cloudDiscoveryMetadata: "",
                    authorityMetadata: "",
                };

                const chinaAuthorityHosts = [
                    "login.partner.microsoftonline.cn",
                    "login.chinacloudapi.cn",
                ];

                for (const host of chinaAuthorityHosts) {
                    jest.clearAllMocks();
                    const authority = new Authority(
                        `https://${host}/common/`,
                        networkInterface,
                        new MockStorageClass(
                            TEST_CONFIG.MSAL_CLIENT_ID,
                            mockCrypto,
                            logger,
                            new StubPerformanceClient()
                        ),
                        customAuthorityOptions,
                        logger,
                        TEST_CONFIG.CORRELATION_ID,
                        new StubPerformanceClient()
                    );

                    await authority.resolveEndpointsAsync();

                    expect(authority.discoveryComplete()).toBe(true);
                    expect(
                        authority.isAlias("login.partner.microsoftonline.cn")
                    ).toBe(true);
                    expect(authority.isAlias("login.chinacloudapi.cn")).toBe(
                        true
                    );
                    expect(authority.canonicalAuthority).toContain(
                        "login.partner.microsoftonline.cn"
                    );
                    expect(authority.authorizationEndpoint).toBe(
                        "https://login.partner.microsoftonline.cn/common/oauth2/v2.0/authorize"
                    );
                    expect(authority.tokenEndpoint).toBe(
                        "https://login.partner.microsoftonline.cn/common/oauth2/v2.0/token"
                    );
                    expect(authority.selfSignedJwtAudience).toBe(
                        "https://login.partner.microsoftonline.cn/common/v2.0"
                    );
                    expect(getEndpointMetadataFromConfigSpy).toHaveBeenCalled();
                    expect(
                        getEndpointMetadataFromHarcodedValuesSpy
                    ).toHaveBeenCalled();
                    expect(
                        getEndpointMetadataFromNetworkSpy
                    ).not.toHaveBeenCalled();
                }
            });

            it("Gets endpoints for tenanted Microsoft authority from hardcoded values", async () => {
                const customAuthorityOptions: AuthorityOptions = {
                    protocolMode: ProtocolMode.AAD,
                    knownAuthorities: [],
                    cloudDiscoveryMetadata: "",
                    authorityMetadata: "",
                };

                const tenantId = "fake-tenant-id";
                authority = new Authority(
                    `https://login.microsoftonline.com/${tenantId}`,
                    networkInterface,
                    mockStorage,
                    customAuthorityOptions,
                    logger,
                    TEST_CONFIG.CORRELATION_ID,
                    new StubPerformanceClient()
                );

                await authority.resolveEndpointsAsync();

                expect(authority.discoveryComplete()).toBe(true);
                expect(authority.authorizationEndpoint).toBe(
                    DEFAULT_OPENID_CONFIG_RESPONSE.body.authorization_endpoint.replace(
                        "{tenant}",
                        tenantId
                    )
                );
                expect(authority.tokenEndpoint).toBe(
                    DEFAULT_OPENID_CONFIG_RESPONSE.body.token_endpoint.replace(
                        "{tenant}",
                        tenantId
                    )
                );
                expect(authority.deviceCodeEndpoint).toBe(
                    authority.tokenEndpoint.replace("/token", "/devicecode")
                );
                expect(authority.endSessionEndpoint).toBe(
                    DEFAULT_OPENID_CONFIG_RESPONSE.body.end_session_endpoint.replace(
                        "{tenant}",
                        tenantId
                    )
                );
                expect(authority.selfSignedJwtAudience).toBe(
                    DEFAULT_OPENID_CONFIG_RESPONSE.body.issuer.replace(
                        "{tenant}",
                        tenantId
                    )
                );

                expect(getEndpointMetadataFromConfigSpy).toHaveBeenCalled();
                expect(
                    getEndpointMetadataFromHarcodedValuesSpy
                ).toHaveBeenCalled();
                expect(
                    getEndpointMetadataFromNetworkSpy
                ).not.toHaveBeenCalled();
            });

            it("Gets endpoints from hardcoded values with regional information", async () => {
                const customAuthorityOptions: AuthorityOptions = {
                    protocolMode: ProtocolMode.AAD,
                    knownAuthorities: [Constants.DEFAULT_AUTHORITY_HOST],
                    cloudDiscoveryMetadata: "",
                    authorityMetadata: "",
                    azureRegionConfiguration: {
                        azureRegion: "westus2",
                        environmentRegion: undefined,
                    },
                };

                const expectedHardcodedRegionalValues = {
                    authorization_endpoint:
                        "https://westus2.login.microsoft.com/common/oauth2/v2.0/authorize/",
                    canonical_authority:
                        "https://login.microsoftonline.com/common/",
                    end_session_endpoint:
                        "https://westus2.login.microsoft.com/common/oauth2/v2.0/logout/",
                    endpointsFromNetwork: false,
                    issuer: "https://login.microsoftonline.com/{tenantid}/v2.0",
                    jwks_uri:
                        "https://login.microsoftonline.com/common/discovery/v2.0/keys",
                    token_endpoint:
                        "https://westus2.login.microsoft.com/common/oauth2/v2.0/token/",
                };

                networkInterface.sendGetRequestAsync = (
                    url: string,
                    options?: NetworkRequestOptions
                ): any => {
                    return null;
                };

                authority = new Authority(
                    Constants.DEFAULT_AUTHORITY,
                    networkInterface,
                    mockStorage,
                    customAuthorityOptions,
                    logger,
                    TEST_CONFIG.CORRELATION_ID,
                    new StubPerformanceClient()
                );
                await authority.resolveEndpointsAsync();

                expect(authority.discoveryComplete()).toBe(true);
                expect(authority.authorizationEndpoint).toBe(
                    expectedHardcodedRegionalValues.authorization_endpoint
                );
                expect(authority.tokenEndpoint).toBe(
                    expectedHardcodedRegionalValues.token_endpoint
                );
                expect(authority.deviceCodeEndpoint).toBe(
                    expectedHardcodedRegionalValues.token_endpoint.replace(
                        "/token",
                        "/devicecode"
                    )
                );
                expect(authority.endSessionEndpoint).toBe(
                    expectedHardcodedRegionalValues.end_session_endpoint
                );
                expect(authority.selfSignedJwtAudience).toBe(
                    expectedHardcodedRegionalValues.issuer.replace(
                        "{tenantid}",
                        "common"
                    )
                );

                expect(getEndpointMetadataFromConfigSpy).toHaveBeenCalled();
                expect(
                    getEndpointMetadataFromHarcodedValuesSpy
                ).toHaveBeenCalled();
                expect(
                    getEndpointMetadataFromNetworkSpy
                ).not.toHaveBeenCalled();
            });

            it("Gets endpoints from cache if not present in configuration or hardcoded metadata", async () => {
                const key = `authority-metadata-${TEST_CONFIG.MSAL_CLIENT_ID}-${Constants.DEFAULT_AUTHORITY_HOST}`;
                mockStorage.setAuthorityMetadata(
                    key,
                    authorityMetadataCacheValue
                );

                authority = new Authority(
                    Constants.DEFAULT_AUTHORITY,
                    networkInterface,
                    mockStorage,
                    authorityOptions,
                    logger,
                    TEST_CONFIG.CORRELATION_ID,
                    new StubPerformanceClient()
                );

                // Force hardcoded metadata to return null
                getEndpointMetadataFromHarcodedValuesSpy.mockReturnValue(null);
                await authority.resolveEndpointsAsync();

                expect(authority.discoveryComplete()).toBe(true);
                expect(authority.authorizationEndpoint).toBe(
                    DEFAULT_OPENID_CONFIG_RESPONSE.body.authorization_endpoint.replace(
                        "{tenant}",
                        "common"
                    )
                );
                expect(authority.tokenEndpoint).toBe(
                    DEFAULT_OPENID_CONFIG_RESPONSE.body.token_endpoint.replace(
                        "{tenant}",
                        "common"
                    )
                );
                expect(authority.deviceCodeEndpoint).toBe(
                    authority.tokenEndpoint.replace("/token", "/devicecode")
                );
                expect(authority.endSessionEndpoint).toBe(
                    DEFAULT_OPENID_CONFIG_RESPONSE.body.end_session_endpoint.replace(
                        "{tenant}",
                        "common"
                    )
                );
                expect(authority.selfSignedJwtAudience).toBe(
                    DEFAULT_OPENID_CONFIG_RESPONSE.body.issuer.replace(
                        "{tenant}",
                        "common"
                    )
                );

                // Test that the metadata is cached
                const cachedAuthorityMetadata =
                    mockStorage.getAuthorityMetadata(key);
                if (!cachedAuthorityMetadata) {
                    throw Error("Cached AuthorityMetadata should not be null!");
                } else {
                    expect(cachedAuthorityMetadata.authorization_endpoint).toBe(
                        DEFAULT_OPENID_CONFIG_RESPONSE.body
                            .authorization_endpoint
                    );
                    expect(cachedAuthorityMetadata.token_endpoint).toBe(
                        DEFAULT_OPENID_CONFIG_RESPONSE.body.token_endpoint
                    );
                    expect(cachedAuthorityMetadata.end_session_endpoint).toBe(
                        DEFAULT_OPENID_CONFIG_RESPONSE.body.end_session_endpoint
                    );
                    expect(cachedAuthorityMetadata.issuer).toBe(
                        DEFAULT_OPENID_CONFIG_RESPONSE.body.issuer
                    );
                    expect(cachedAuthorityMetadata.jwks_uri).toBe(
                        DEFAULT_OPENID_CONFIG_RESPONSE.body.jwks_uri
                    );
                    expect(cachedAuthorityMetadata.endpointsFromNetwork).toBe(
                        true
                    );
                }

                expect(getEndpointMetadataFromConfigSpy).toHaveBeenCalled();
                expect(
                    getEndpointMetadataFromHarcodedValuesSpy
                ).toHaveBeenCalled();
                expect(
                    getEndpointMetadataFromNetworkSpy
                ).not.toHaveBeenCalled();
            });

            it("Gets endpoints from network if cached metadata is expired and metadata was not included in configuration or hardcoded values", async () => {
                const key = `authority-metadata-${TEST_CONFIG.MSAL_CLIENT_ID}-${Constants.DEFAULT_AUTHORITY_HOST}`;
                mockStorage.setAuthorityMetadata(key, {
                    ...authorityMetadataCacheValue,
                    expiresAt: TimeUtils.nowSeconds() - 1000,
                });

                networkInterface.sendGetRequestAsync = (
                    url: string,
                    options?: NetworkRequestOptions
                ): any => {
                    return DEFAULT_OPENID_CONFIG_RESPONSE;
                };
                authority = new Authority(
                    Constants.DEFAULT_AUTHORITY,
                    networkInterface,
                    mockStorage,
                    authorityOptions,
                    logger,
                    TEST_CONFIG.CORRELATION_ID,
                    new StubPerformanceClient()
                );

                // Force hardcoded metadata to return null
                getEndpointMetadataFromHarcodedValuesSpy.mockReturnValue(null);

                await authority.resolveEndpointsAsync();

                expect(authority.discoveryComplete()).toBe(true);
                expect(authority.authorizationEndpoint).toBe(
                    DEFAULT_OPENID_CONFIG_RESPONSE.body.authorization_endpoint.replace(
                        "{tenant}",
                        "common"
                    )
                );
                expect(authority.tokenEndpoint).toBe(
                    DEFAULT_OPENID_CONFIG_RESPONSE.body.token_endpoint.replace(
                        "{tenant}",
                        "common"
                    )
                );
                expect(authority.deviceCodeEndpoint).toBe(
                    authority.tokenEndpoint.replace("/token", "/devicecode")
                );
                expect(authority.endSessionEndpoint).toBe(
                    DEFAULT_OPENID_CONFIG_RESPONSE.body.end_session_endpoint.replace(
                        "{tenant}",
                        "common"
                    )
                );
                expect(authority.selfSignedJwtAudience).toBe(
                    DEFAULT_OPENID_CONFIG_RESPONSE.body.issuer.replace(
                        "{tenant}",
                        "common"
                    )
                );

                // Test that the metadata is cached
                const cachedAuthorityMetadata =
                    mockStorage.getAuthorityMetadata(key);
                if (!cachedAuthorityMetadata) {
                    throw Error("Cached AuthorityMetadata should not be null!");
                } else {
                    expect(cachedAuthorityMetadata.authorization_endpoint).toBe(
                        DEFAULT_OPENID_CONFIG_RESPONSE.body
                            .authorization_endpoint
                    );
                    expect(cachedAuthorityMetadata.token_endpoint).toBe(
                        DEFAULT_OPENID_CONFIG_RESPONSE.body.token_endpoint
                    );
                    expect(cachedAuthorityMetadata.end_session_endpoint).toBe(
                        DEFAULT_OPENID_CONFIG_RESPONSE.body.end_session_endpoint
                    );
                    expect(cachedAuthorityMetadata.issuer).toBe(
                        DEFAULT_OPENID_CONFIG_RESPONSE.body.issuer
                    );
                    expect(cachedAuthorityMetadata.jwks_uri).toBe(
                        DEFAULT_OPENID_CONFIG_RESPONSE.body.jwks_uri
                    );
                    expect(cachedAuthorityMetadata.endpointsFromNetwork).toBe(
                        true
                    );
                }

                expect(getEndpointMetadataFromConfigSpy).toHaveBeenCalled();
                expect(
                    getEndpointMetadataFromHarcodedValuesSpy
                ).toHaveBeenCalled();
                expect(getEndpointMetadataFromNetworkSpy).toHaveBeenCalled();
            });

            it("Gets endpoints from network", async () => {
                networkInterface.sendGetRequestAsync = (
                    url: string,
                    options?: NetworkRequestOptions
                ): any => {
                    return DEFAULT_OPENID_CONFIG_RESPONSE;
                };
                authority = new Authority(
                    Constants.DEFAULT_AUTHORITY,
                    networkInterface,
                    mockStorage,
                    authorityOptions,
                    logger,
                    TEST_CONFIG.CORRELATION_ID,
                    new StubPerformanceClient()
                );
                getEndpointMetadataFromHarcodedValuesSpy.mockReturnValue(null);

                await authority.resolveEndpointsAsync();

                expect(authority.discoveryComplete()).toBe(true);
                expect(authority.authorizationEndpoint).toBe(
                    DEFAULT_OPENID_CONFIG_RESPONSE.body.authorization_endpoint.replace(
                        "{tenant}",
                        "common"
                    )
                );
                expect(authority.tokenEndpoint).toBe(
                    DEFAULT_OPENID_CONFIG_RESPONSE.body.token_endpoint.replace(
                        "{tenant}",
                        "common"
                    )
                );
                expect(authority.deviceCodeEndpoint).toBe(
                    authority.tokenEndpoint.replace("/token", "/devicecode")
                );
                expect(authority.endSessionEndpoint).toBe(
                    DEFAULT_OPENID_CONFIG_RESPONSE.body.end_session_endpoint.replace(
                        "{tenant}",
                        "common"
                    )
                );
                expect(authority.selfSignedJwtAudience).toBe(
                    DEFAULT_OPENID_CONFIG_RESPONSE.body.issuer.replace(
                        "{tenant}",
                        "common"
                    )
                );

                // Test that the metadata is cached
                const key = `authority-metadata-${TEST_CONFIG.MSAL_CLIENT_ID}-${Constants.DEFAULT_AUTHORITY_HOST}`;
                const cachedAuthorityMetadata =
                    mockStorage.getAuthorityMetadata(key);
                if (!cachedAuthorityMetadata) {
                    throw Error("Cached AuthorityMetadata should not be null!");
                } else {
                    expect(cachedAuthorityMetadata.authorization_endpoint).toBe(
                        DEFAULT_OPENID_CONFIG_RESPONSE.body
                            .authorization_endpoint
                    );
                    expect(cachedAuthorityMetadata.token_endpoint).toBe(
                        DEFAULT_OPENID_CONFIG_RESPONSE.body.token_endpoint
                    );
                    expect(cachedAuthorityMetadata.end_session_endpoint).toBe(
                        DEFAULT_OPENID_CONFIG_RESPONSE.body.end_session_endpoint
                    );
                    expect(cachedAuthorityMetadata.issuer).toBe(
                        DEFAULT_OPENID_CONFIG_RESPONSE.body.issuer
                    );
                    expect(cachedAuthorityMetadata.jwks_uri).toBe(
                        DEFAULT_OPENID_CONFIG_RESPONSE.body.jwks_uri
                    );
                    expect(cachedAuthorityMetadata.endpointsFromNetwork).toBe(
                        true
                    );
                }

                expect(getEndpointMetadataFromConfigSpy).toHaveBeenCalled();
                expect(
                    getEndpointMetadataFromHarcodedValuesSpy
                ).toHaveBeenCalled();
                expect(getEndpointMetadataFromNetworkSpy).toHaveBeenCalled();
            });

            it("Throws error if openid-configuration network call fails", (done) => {
                networkInterface.sendGetRequestAsync = (
                    url: string,
                    options?: NetworkRequestOptions
                ): any => {
                    throw Error("Unable to reach endpoint");
                };
                authority = new Authority(
                    Constants.DEFAULT_AUTHORITY,
                    networkInterface,
                    mockStorage,
                    authorityOptions,
                    logger,
                    TEST_CONFIG.CORRELATION_ID,
                    new StubPerformanceClient()
                );
                // Force hardcoded metadata to return null
                getEndpointMetadataFromHarcodedValuesSpy.mockReturnValue(null);

                authority.resolveEndpointsAsync().catch((e) => {
                    expect(e).toBeInstanceOf(ClientAuthError);
                    expect(e.errorCode).toBe(
                        ClientAuthErrorCodes.openIdConfigError
                    );
                    done();
                });
            });

            describe("validateIssuer", () => {
                const issuerValidationFailedError =
                    createClientConfigurationError(
                        ClientConfigurationErrorCodes.issuerValidationFailed,
                        ""
                    );

                const buildAuthority = (
                    authorityUrl: string,
                    knownAuthorities: string[] = [
                        Constants.DEFAULT_AUTHORITY_HOST,
                    ],
                    protocolMode: ProtocolMode = ProtocolMode.AAD
                ): Authority =>
                    new Authority(
                        authorityUrl,
                        networkInterface,
                        mockStorage,
                        {
                            protocolMode,
                            knownAuthorities,
                            cloudDiscoveryMetadata: "",
                            authorityMetadata: "",
                        },
                        logger,
                        TEST_CONFIG.CORRELATION_ID,
                        new StubPerformanceClient()
                    );

                const callValidateIssuer = (
                    authority: Authority,
                    issuer: string
                ): void => {
                    // @ts-ignore - exercising private method directly
                    authority.validateIssuer(issuer);
                };

                it("throws if the issuer is empty", () => {
                    const testAuthority = buildAuthority(
                        Constants.DEFAULT_AUTHORITY
                    );
                    expect(() => callValidateIssuer(testAuthority, "")).toThrow(
                        issuerValidationFailedError
                    );
                });

                it("skips issuer validation when endpoint metadata is supplied via authorityMetadata config", async () => {
                    /*
                     * Issuer validation only runs on the network path. When the
                     * developer supplies authorityMetadata config, that path is
                     * skipped entirely — even an issuer that would otherwise
                     * fail Rules 1–4 must be accepted.
                     */
                    // Force hardcoded values to return null so config is the only local source
                    getEndpointMetadataFromHarcodedValuesSpy.mockReturnValue(
                        null
                    );

                    const authorityJson = {
                        ...DEFAULT_OPENID_CONFIG_RESPONSE.body,
                        issuer: "https://malicious.attacker.com/tenant/v2.0",
                    };

                    const configAuthority = new Authority(
                        Constants.DEFAULT_AUTHORITY,
                        networkInterface,
                        mockStorage,
                        {
                            ...authorityOptions,
                            authorityMetadata: JSON.stringify(authorityJson),
                        },
                        logger,
                        TEST_CONFIG.CORRELATION_ID,
                        new StubPerformanceClient()
                    );

                    await expect(
                        configAuthority.resolveEndpointsAsync()
                    ).resolves.not.toThrow();
                    expect(configAuthority.discoveryComplete()).toBe(true);
                    expect(
                        getEndpointMetadataFromNetworkSpy
                    ).not.toHaveBeenCalled();
                });

                describe("Rule 1: scheme + host equality (any authority)", () => {
                    it("accepts an issuer that shares scheme and host with the authority but differs in path", () => {
                        const testAuthority = buildAuthority(
                            "https://accounts.google.com/",
                            ["https://accounts.google.com/"],
                            ProtocolMode.OIDC
                        );
                        expect(() =>
                            callValidateIssuer(
                                testAuthority,
                                "https://accounts.google.com/some/other/path"
                            )
                        ).not.toThrow();
                    });

                    it("accepts an exact match including path", () => {
                        const testAuthority = buildAuthority(
                            "https://accounts.google.com/",
                            ["https://accounts.google.com/"],
                            ProtocolMode.OIDC
                        );
                        expect(() =>
                            callValidateIssuer(
                                testAuthority,
                                "https://accounts.google.com/"
                            )
                        ).not.toThrow();
                    });

                    it("rejects an issuer on a different host", () => {
                        const testAuthority = buildAuthority(
                            "https://accounts.google.com/",
                            ["https://accounts.google.com/"],
                            ProtocolMode.OIDC
                        );
                        expect(() =>
                            callValidateIssuer(
                                testAuthority,
                                "https://attacker.example/"
                            )
                        ).toThrow(issuerValidationFailedError);
                    });

                    it("rejects an issuer when only the scheme differs", () => {
                        const testAuthority = buildAuthority(
                            "https://accounts.google.com/",
                            ["https://accounts.google.com/"],
                            ProtocolMode.OIDC
                        );
                        expect(() =>
                            callValidateIssuer(
                                testAuthority,
                                "http://accounts.google.com/"
                            )
                        ).toThrow(issuerValidationFailedError);
                    });
                });

                describe("Rule 2: well-known Microsoft authority host (HTTPS only)", () => {
                    it("accepts an issuer whose host is a known Microsoft alias different from the authority", () => {
                        const testAuthority = buildAuthority(
                            Constants.DEFAULT_AUTHORITY
                        );
                        // sts.windows.net is in InstanceDiscoveryMetadataAliases for the public cloud
                        expect(() =>
                            callValidateIssuer(
                                testAuthority,
                                "https://sts.windows.net/tenantid/"
                            )
                        ).not.toThrow();
                    });

                    it("accepts a sovereign issuer host paired with a different sovereign authority host (China cloud)", () => {
                        const testAuthority = buildAuthority(
                            "https://login.chinacloudapi.cn/common/",
                            ["https://login.chinacloudapi.cn/"]
                        );
                        expect(() =>
                            callValidateIssuer(
                                testAuthority,
                                "https://login.partner.microsoftonline.cn/tenantid/v2.0"
                            )
                        ).not.toThrow();
                    });

                    it("accepts a sovereign issuer host with a custom sovereign authority host (China cloud)", () => {
                        const testAuthority = buildAuthority(
                            "https://custom.chinacloudapi.cn/common/",
                            ["https://login.chinacloudapi.cn/"]
                        );
                        expect(() =>
                            callValidateIssuer(
                                testAuthority,
                                "https://login.partner.microsoftonline.cn/tenantid/v2.0"
                            )
                        ).not.toThrow();
                    });

                    it("rejects a known Microsoft host issuer when the scheme is not https", () => {
                        const testAuthority = buildAuthority(
                            Constants.DEFAULT_AUTHORITY
                        );
                        expect(() =>
                            callValidateIssuer(
                                testAuthority,
                                "http://sts.windows.net/tenantid/"
                            )
                        ).toThrow(issuerValidationFailedError);
                    });

                    it("rejects an issuer whose host is not a known Microsoft alias", () => {
                        const testAuthority = buildAuthority(
                            Constants.DEFAULT_AUTHORITY
                        );
                        expect(() =>
                            callValidateIssuer(
                                testAuthority,
                                "https://attacker.example/tenantid/"
                            )
                        ).toThrow(issuerValidationFailedError);
                    });
                });

                describe("Rule 3: regional variant of a known Microsoft host (HTTPS only)", () => {
                    it("accepts a regional issuer derived from a known Microsoft host", () => {
                        const testAuthority = buildAuthority(
                            Constants.DEFAULT_AUTHORITY
                        );
                        expect(() =>
                            callValidateIssuer(
                                testAuthority,
                                "https://westus2.login.microsoftonline.com/tenantid/v2.0"
                            )
                        ).not.toThrow();
                    });

                    it("rejects a regional issuer when the scheme is not https", () => {
                        const testAuthority = buildAuthority(
                            Constants.DEFAULT_AUTHORITY
                        );
                        expect(() =>
                            callValidateIssuer(
                                testAuthority,
                                "http://westus2.login.microsoftonline.com/tenantid/v2.0"
                            )
                        ).toThrow(issuerValidationFailedError);
                    });

                    it("rejects when the parent host (after the region label) is not a known Microsoft alias", () => {
                        const testAuthority = buildAuthority(
                            Constants.DEFAULT_AUTHORITY
                        );
                        expect(() =>
                            callValidateIssuer(
                                testAuthority,
                                "https://westus2.attacker.example/tenantid/v2.0"
                            )
                        ).toThrow(issuerValidationFailedError);
                    });

                    it("rejects when the issuer host has no dot (single label)", () => {
                        const testAuthority = buildAuthority(
                            Constants.DEFAULT_AUTHORITY
                        );
                        expect(() =>
                            callValidateIssuer(
                                testAuthority,
                                "https://localhost/"
                            )
                        ).toThrow(issuerValidationFailedError);
                    });
                });

                describe("Rule 4: CIAM tenant pattern {tenant}.ciamlogin.com", () => {
                    const ciamAuthorityUrl =
                        "https://contoso.ciamlogin.com/contoso.onmicrosoft.com/";
                    const ciamKnownAuthorities = [
                        "https://contoso.ciamlogin.com/",
                    ];

                    it("accepts the bare tenant host pattern (https://{tenant}.ciamlogin.com)", () => {
                        const testAuthority = buildAuthority(
                            ciamAuthorityUrl,
                            ciamKnownAuthorities
                        );
                        expect(() =>
                            callValidateIssuer(
                                testAuthority,
                                "https://contoso.ciamlogin.com"
                            )
                        ).not.toThrow();
                    });

                    it("accepts the tenant host with tenant path (https://{tenant}.ciamlogin.com/{tenant})", () => {
                        const testAuthority = buildAuthority(
                            ciamAuthorityUrl,
                            ciamKnownAuthorities
                        );
                        expect(() =>
                            callValidateIssuer(
                                testAuthority,
                                "https://contoso.ciamlogin.com/contoso"
                            )
                        ).not.toThrow();
                    });

                    it("accepts the tenant host with tenant/v2.0 path", () => {
                        const testAuthority = buildAuthority(
                            ciamAuthorityUrl,
                            ciamKnownAuthorities
                        );
                        expect(() =>
                            callValidateIssuer(
                                testAuthority,
                                "https://contoso.ciamlogin.com/contoso/v2.0"
                            )
                        ).not.toThrow();
                    });

                    it("ignores trailing slashes when matching a CIAM pattern", () => {
                        const testAuthority = buildAuthority(
                            ciamAuthorityUrl,
                            ciamKnownAuthorities
                        );
                        expect(() =>
                            callValidateIssuer(
                                testAuthority,
                                "https://contoso.ciamlogin.com/contoso/v2.0/"
                            )
                        ).not.toThrow();
                    });

                    it("accepts the tenant host with {tenant}.onmicrosoft.com path (transformCIAMAuthority form)", () => {
                        const testAuthority = buildAuthority(
                            ciamAuthorityUrl,
                            ciamKnownAuthorities
                        );
                        expect(() =>
                            callValidateIssuer(
                                testAuthority,
                                "https://contoso.ciamlogin.com/contoso.onmicrosoft.com"
                            )
                        ).not.toThrow();
                    });

                    it("accepts the tenant host with {tenant}.onmicrosoft.com/v2.0 path", () => {
                        const testAuthority = buildAuthority(
                            ciamAuthorityUrl,
                            ciamKnownAuthorities
                        );
                        expect(() =>
                            callValidateIssuer(
                                testAuthority,
                                "https://contoso.ciamlogin.com/contoso.onmicrosoft.com/v2.0"
                            )
                        ).not.toThrow();
                    });

                    it("rejects a CIAM-shaped issuer for a different tenant", () => {
                        const testAuthority = buildAuthority(
                            ciamAuthorityUrl,
                            ciamKnownAuthorities
                        );
                        expect(() =>
                            callValidateIssuer(
                                testAuthority,
                                "https://attacker.ciamlogin.com/contoso/v2.0"
                            )
                        ).toThrow(issuerValidationFailedError);
                    });

                    it("rejects a non-CIAM issuer when no other rule matches", () => {
                        const testAuthority = buildAuthority(
                            ciamAuthorityUrl,
                            ciamKnownAuthorities
                        );
                        expect(() =>
                            callValidateIssuer(
                                testAuthority,
                                "https://attacker.example/contoso/v2.0"
                            )
                        ).toThrow(issuerValidationFailedError);
                    });
                });

                describe("Rule 5: issuer host in knownAuthorities", () => {
                    it("accepts an issuer whose host is explicitly listed in knownAuthorities", () => {
                        const tenantGuid =
                            "12345678-1234-1234-1234-123456789abc";
                        const testAuthority = buildAuthority(
                            "https://contoso.ciamlogin.com/contoso.onmicrosoft.com/",
                            [
                                "contoso.ciamlogin.com",
                                `${tenantGuid}.ciamlogin.com`,
                            ]
                        );
                        expect(() =>
                            callValidateIssuer(
                                testAuthority,
                                `https://${tenantGuid}.ciamlogin.com/${tenantGuid}/v2.0`
                            )
                        ).not.toThrow();
                    });

                    it("rejects an issuer whose host is NOT in knownAuthorities and no other rule matches", () => {
                        const tenantGuid =
                            "12345678-1234-1234-1234-123456789abc";
                        const testAuthority = buildAuthority(
                            "https://contoso.ciamlogin.com/contoso.onmicrosoft.com/",
                            ["contoso.ciamlogin.com"]
                        );
                        expect(() =>
                            callValidateIssuer(
                                testAuthority,
                                `https://${tenantGuid}.ciamlogin.com/${tenantGuid}/v2.0`
                            )
                        ).toThrow(issuerValidationFailedError);
                    });

                    it("rejects an HTTP issuer even when the host is listed in knownAuthorities", () => {
                        const tenantGuid =
                            "12345678-1234-1234-1234-123456789abc";
                        const testAuthority = buildAuthority(
                            "https://contoso.ciamlogin.com/contoso.onmicrosoft.com/",
                            [
                                "contoso.ciamlogin.com",
                                `${tenantGuid}.ciamlogin.com`,
                            ]
                        );
                        expect(() =>
                            callValidateIssuer(
                                testAuthority,
                                `http://${tenantGuid}.ciamlogin.com/${tenantGuid}/v2.0`
                            )
                        ).toThrow(issuerValidationFailedError);
                    });

                    it("accepts an issuer whose host is in knownAuthorities regardless of case", () => {
                        const tenantGuid =
                            "12345678-1234-1234-1234-123456789abc";
                        const testAuthority = buildAuthority(
                            "https://contoso.ciamlogin.com/contoso.onmicrosoft.com/",
                            [
                                "contoso.ciamlogin.com",
                                `${tenantGuid}.ciamlogin.com`,
                            ]
                        );
                        expect(() =>
                            callValidateIssuer(
                                testAuthority,
                                `https://${tenantGuid.toUpperCase()}.ciamlogin.com/${tenantGuid}/v2.0`
                            )
                        ).not.toThrow();
                    });
                });
            });
        });

        describe("Cloud Discovery Metadata", () => {
            it("Sets instance metadata from knownAuthorities config", async () => {
                const authorityOptions: AuthorityOptions = {
                    protocolMode: ProtocolMode.AAD,
                    knownAuthorities: [Constants.DEFAULT_AUTHORITY_HOST],
                    cloudDiscoveryMetadata: "",
                    authorityMetadata: "",
                };
                networkInterface.sendGetRequestAsync = (
                    url: string,
                    options?: NetworkRequestOptions
                ): any => {
                    return DEFAULT_OPENID_CONFIG_RESPONSE;
                };
                authority = new Authority(
                    Constants.DEFAULT_AUTHORITY,
                    networkInterface,
                    mockStorage,
                    authorityOptions,
                    logger,
                    TEST_CONFIG.CORRELATION_ID,
                    new StubPerformanceClient()
                );
                await authority.resolveEndpointsAsync();
                expect(
                    authority.isAlias(Constants.DEFAULT_AUTHORITY_HOST)
                ).toBe(true);
                expect(authority.getPreferredCache()).toBe(
                    Constants.DEFAULT_AUTHORITY_HOST
                );
                expect(
                    authority.canonicalAuthority.includes(
                        Constants.DEFAULT_AUTHORITY_HOST
                    )
                ).toBe(true);

                // Test that the metadata is cached
                const key = `authority-metadata-${TEST_CONFIG.MSAL_CLIENT_ID}-${Constants.DEFAULT_AUTHORITY_HOST}`;
                const cachedAuthorityMetadata =
                    mockStorage.getAuthorityMetadata(key);
                if (!cachedAuthorityMetadata) {
                    throw Error("Cached AuthorityMetadata should not be null!");
                } else {
                    expect(cachedAuthorityMetadata.aliases).toContain(
                        Constants.DEFAULT_AUTHORITY_HOST
                    );
                    expect(cachedAuthorityMetadata.preferred_cache).toBe(
                        Constants.DEFAULT_AUTHORITY_HOST
                    );
                    expect(cachedAuthorityMetadata.preferred_network).toBe(
                        Constants.DEFAULT_AUTHORITY_HOST
                    );
                    expect(cachedAuthorityMetadata.aliasesFromNetwork).toBe(
                        false
                    );
                }
            });

            it("Correctly sets instance metadata from cloudDiscoveryMetadata config and changes canonicalAuthority to preferred_network", async () => {
                const tenantDiscoveryResponseBody =
                    DEFAULT_TENANT_DISCOVERY_RESPONSE.body;

                const expectedCloudDiscoveryMetadata =
                    tenantDiscoveryResponseBody.metadata[0];

                const configAliases = expectedCloudDiscoveryMetadata.aliases;

                const authorityOptions: AuthorityOptions = {
                    protocolMode: ProtocolMode.AAD,
                    knownAuthorities: [],
                    cloudDiscoveryMetadata: JSON.stringify(
                        tenantDiscoveryResponseBody
                    ),
                    authorityMetadata: "",
                };

                networkInterface.sendGetRequestAsync = (
                    url: string,
                    options?: NetworkRequestOptions
                ): any => {
                    return DEFAULT_OPENID_CONFIG_RESPONSE;
                };

                authority = new Authority(
                    Constants.DEFAULT_AUTHORITY,
                    networkInterface,
                    mockStorage,
                    authorityOptions,
                    logger,
                    TEST_CONFIG.CORRELATION_ID,
                    new StubPerformanceClient()
                );

                await authority.resolveEndpointsAsync();
                expect(authority.isAlias(configAliases[0])).toBe(true);
                expect(authority.isAlias(configAliases[1])).toBe(true);
                expect(authority.isAlias(configAliases[2])).toBe(true);
                expect(authority.isAlias(configAliases[3])).toBe(true);

                expect(authority.getPreferredCache()).toBe(
                    expectedCloudDiscoveryMetadata.preferred_cache
                );
                expect(
                    authority.canonicalAuthority.includes(
                        expectedCloudDiscoveryMetadata.preferred_network
                    )
                ).toBe(true);
            });

            it("Correctly caches instance metadata from configuration", async () => {
                const tenantDiscoveryResponseBody =
                    DEFAULT_TENANT_DISCOVERY_RESPONSE.body;

                const expectedCloudDiscoveryMetadata =
                    tenantDiscoveryResponseBody.metadata[0];

                const configAliases = expectedCloudDiscoveryMetadata.aliases;

                const authorityOptions: AuthorityOptions = {
                    protocolMode: ProtocolMode.AAD,
                    knownAuthorities: [],
                    cloudDiscoveryMetadata: JSON.stringify(
                        tenantDiscoveryResponseBody
                    ),
                    authorityMetadata: "",
                };
                networkInterface.sendGetRequestAsync = (
                    url: string,
                    options?: NetworkRequestOptions
                ): any => {
                    return DEFAULT_OPENID_CONFIG_RESPONSE;
                };

                authority = new Authority(
                    Constants.DEFAULT_AUTHORITY,
                    networkInterface,
                    mockStorage,
                    authorityOptions,
                    logger,
                    TEST_CONFIG.CORRELATION_ID,
                    new StubPerformanceClient()
                );
                await authority.resolveEndpointsAsync();

                const key = `authority-metadata-${TEST_CONFIG.MSAL_CLIENT_ID}-sts.windows.net`;
                const cachedAuthorityMetadata =
                    mockStorage.getAuthorityMetadata(key);
                if (!cachedAuthorityMetadata) {
                    throw Error("Cached AuthorityMetadata should not be null!");
                } else {
                    expect(cachedAuthorityMetadata.aliases).toContain(
                        configAliases[0]
                    );
                    expect(cachedAuthorityMetadata.aliases).toContain(
                        configAliases[1]
                    );
                    expect(cachedAuthorityMetadata.aliases).toContain(
                        configAliases[2]
                    );
                    expect(cachedAuthorityMetadata.aliases).toContain(
                        configAliases[3]
                    );
                    expect(cachedAuthorityMetadata.preferred_cache).toBe(
                        expectedCloudDiscoveryMetadata.preferred_cache
                    );
                    expect(cachedAuthorityMetadata.preferred_network).toBe(
                        expectedCloudDiscoveryMetadata.preferred_network
                    );
                    expect(cachedAuthorityMetadata.aliasesFromNetwork).toBe(
                        false
                    );
                }
            });

            describe("Metadata sources", () => {
                let getCloudDiscoveryMetadataFromConfigSpy: jest.SpyInstance;
                let getCloudDiscoveryMetadataFromHarcodedValuesSpy: jest.SpyInstance;
                let getCloudDiscoveryMetadataFromNetworkSpy: jest.SpyInstance;

                beforeEach(() => {
                    getCloudDiscoveryMetadataFromConfigSpy = jest.spyOn(
                        Authority.prototype as any,
                        "getCloudDiscoveryMetadataFromConfig"
                    );

                    getCloudDiscoveryMetadataFromHarcodedValuesSpy = jest.spyOn(
                        authorityMetadata,
                        "getCloudDiscoveryMetadataFromHardcodedValues"
                    );

                    getCloudDiscoveryMetadataFromNetworkSpy = jest.spyOn(
                        Authority.prototype as any,
                        "getCloudDiscoveryMetadataFromNetwork"
                    );
                });

                afterEach(() => {
                    jest.restoreAllMocks();
                });
                /**
                 * Order of precedence for cloud discovery metadata:
                 * 1. Metadata passed in as authorityMetadata config
                 * 2. Hardcoded Metadata
                 * 3. Cached metadata previously obtained from network
                 * 4. Network call to instance discovery endpoint
                 */
                it("Sets instance metadata from cloudDiscoveryMetadata config source", async () => {
                    const tenantDiscoveryResponseBody =
                        DEFAULT_TENANT_DISCOVERY_RESPONSE.body;

                    const expectedCloudDiscoveryMetadata =
                        tenantDiscoveryResponseBody.metadata[0];

                    const configAliases =
                        expectedCloudDiscoveryMetadata.aliases;

                    const authorityOptions: AuthorityOptions = {
                        protocolMode: ProtocolMode.AAD,
                        knownAuthorities: [],
                        cloudDiscoveryMetadata: JSON.stringify(
                            tenantDiscoveryResponseBody
                        ),
                        authorityMetadata: "",
                    };
                    networkInterface.sendGetRequestAsync = (
                        url: string,
                        options?: NetworkRequestOptions
                    ): any => {
                        return DEFAULT_OPENID_CONFIG_RESPONSE;
                    };

                    authority = new Authority(
                        Constants.DEFAULT_AUTHORITY,
                        networkInterface,
                        mockStorage,
                        authorityOptions,
                        logger,
                        TEST_CONFIG.CORRELATION_ID,
                        new StubPerformanceClient()
                    );

                    await authority.resolveEndpointsAsync();
                    expect(
                        getCloudDiscoveryMetadataFromConfigSpy
                    ).toHaveBeenCalled();
                    expect(
                        getCloudDiscoveryMetadataFromHarcodedValuesSpy
                    ).not.toHaveBeenCalled();
                    expect(
                        getCloudDiscoveryMetadataFromNetworkSpy
                    ).not.toHaveBeenCalled();

                    expect(authority.isAlias(configAliases[0])).toBe(true);
                    expect(authority.isAlias(configAliases[1])).toBe(true);
                    expect(authority.isAlias(configAliases[2])).toBe(true);
                    expect(authority.isAlias(configAliases[3])).toBe(true);

                    expect(authority.getPreferredCache()).toBe(
                        expectedCloudDiscoveryMetadata.preferred_cache
                    );
                    expect(
                        authority.canonicalAuthority.includes(
                            expectedCloudDiscoveryMetadata.preferred_network
                        )
                    ).toBe(true);
                });

                it("sets instance metadata from hardcoded values if not present in config", async () => {
                    const authorityOptions: AuthorityOptions = {
                        protocolMode: ProtocolMode.AAD,
                        knownAuthorities: [],
                        cloudDiscoveryMetadata: "",
                        authorityMetadata: "",
                    };

                    networkInterface.sendGetRequestAsync = (
                        url: string,
                        options?: NetworkRequestOptions
                    ): any => {
                        return DEFAULT_OPENID_CONFIG_RESPONSE;
                    };

                    authority = new Authority(
                        Constants.DEFAULT_AUTHORITY,
                        networkInterface,
                        mockStorage,
                        authorityOptions,
                        logger,
                        TEST_CONFIG.CORRELATION_ID,
                        new StubPerformanceClient()
                    );

                    const hardcodedCloudDiscoveryMetadata =
                        InstanceDiscoveryMetadata;

                    const expectedCloudDiscoveryMetadata =
                        hardcodedCloudDiscoveryMetadata.metadata[0];

                    const configAliases =
                        expectedCloudDiscoveryMetadata.aliases;

                    await authority.resolveEndpointsAsync();
                    expect(authority.isAlias(configAliases[0])).toBe(true);
                    expect(authority.isAlias(configAliases[1])).toBe(true);
                    expect(authority.isAlias(configAliases[2])).toBe(true);
                    expect(authority.getPreferredCache()).toBe(
                        expectedCloudDiscoveryMetadata.preferred_cache
                    );
                    expect(
                        authority.canonicalAuthority.includes(
                            expectedCloudDiscoveryMetadata.preferred_network
                        )
                    ).toBe(true);

                    expect(
                        getCloudDiscoveryMetadataFromConfigSpy
                    ).toHaveBeenCalled();
                    expect(
                        getCloudDiscoveryMetadataFromHarcodedValuesSpy
                    ).toHaveBeenCalled();
                    expect(
                        getCloudDiscoveryMetadataFromNetworkSpy
                    ).not.toHaveBeenCalled();
                });

                it("Sets instance metadata from cache when not present in configuration or hardcoded values", async () => {
                    const authorityOptions: AuthorityOptions = {
                        protocolMode: ProtocolMode.AAD,
                        knownAuthorities: [],
                        cloudDiscoveryMetadata: "",
                        authorityMetadata: "",
                    };

                    const tenantDiscoveryResponseBody =
                        DEFAULT_TENANT_DISCOVERY_RESPONSE.body;

                    const expectedCloudDiscoveryMetadata =
                        tenantDiscoveryResponseBody.metadata[0];

                    const configAliases =
                        expectedCloudDiscoveryMetadata.aliases;

                    const key = `authority-metadata-${TEST_CONFIG.MSAL_CLIENT_ID}-sts.windows.net`;
                    mockStorage.setAuthorityMetadata(
                        key,
                        authorityMetadataCacheValue
                    );
                    jest.spyOn(
                        Authority.prototype,
                        <any>"updateEndpointMetadata"
                    ).mockResolvedValue("cache");
                    authority = new Authority(
                        Constants.DEFAULT_AUTHORITY,
                        networkInterface,
                        mockStorage,
                        authorityOptions,
                        logger,
                        TEST_CONFIG.CORRELATION_ID,
                        new StubPerformanceClient()
                    );

                    getCloudDiscoveryMetadataFromHarcodedValuesSpy.mockReturnValue(
                        null
                    );

                    await authority.resolveEndpointsAsync();
                    expect(authority.isAlias(configAliases[0])).toBe(true);
                    expect(authority.isAlias(configAliases[1])).toBe(true);
                    expect(authority.isAlias(configAliases[2])).toBe(true);
                    expect(authority.getPreferredCache()).toBe(
                        expectedCloudDiscoveryMetadata.preferred_cache
                    );
                    expect(
                        authority.canonicalAuthority.includes(
                            expectedCloudDiscoveryMetadata.preferred_network
                        )
                    ).toBe(true);

                    // Test that the metadata is cached
                    const cachedAuthorityMetadata =
                        mockStorage.getAuthorityMetadata(key);
                    if (!cachedAuthorityMetadata) {
                        throw Error(
                            "Cached AuthorityMetadata should not be null!"
                        );
                    } else {
                        expect(cachedAuthorityMetadata.aliases).toContain(
                            configAliases[0]
                        );
                        expect(cachedAuthorityMetadata.aliases).toContain(
                            configAliases[1]
                        );
                        expect(cachedAuthorityMetadata.aliases).toContain(
                            configAliases[2]
                        );
                        expect(cachedAuthorityMetadata.preferred_cache).toBe(
                            expectedCloudDiscoveryMetadata.preferred_cache
                        );
                        expect(cachedAuthorityMetadata.preferred_network).toBe(
                            expectedCloudDiscoveryMetadata.preferred_network
                        );
                        expect(cachedAuthorityMetadata.aliasesFromNetwork).toBe(
                            true
                        );
                    }

                    expect(
                        getCloudDiscoveryMetadataFromConfigSpy
                    ).toHaveBeenCalled();
                    expect(
                        getCloudDiscoveryMetadataFromHarcodedValuesSpy
                    ).toHaveBeenCalled();
                    expect(
                        getCloudDiscoveryMetadataFromNetworkSpy
                    ).not.toHaveBeenCalled();
                });

                it("sets instance metadata from network if not present in config, hardcoded values or cache", async () => {
                    const authorityOptions: AuthorityOptions = {
                        protocolMode: ProtocolMode.AAD,
                        knownAuthorities: [],
                        cloudDiscoveryMetadata: "",
                        authorityMetadata: "",
                    };
                    networkInterface.sendGetRequestAsync = (
                        url: string,
                        options?: NetworkRequestOptions
                    ): any => {
                        if (url.includes("discovery/instance")) {
                            return DEFAULT_TENANT_DISCOVERY_RESPONSE;
                        } else {
                            return DEFAULT_OPENID_CONFIG_RESPONSE;
                        }
                    };

                    authority = new Authority(
                        Constants.DEFAULT_AUTHORITY,
                        networkInterface,
                        mockStorage,
                        authorityOptions,
                        logger,
                        TEST_CONFIG.CORRELATION_ID,
                        new StubPerformanceClient()
                    );
                    getCloudDiscoveryMetadataFromHarcodedValuesSpy.mockReturnValue(
                        null
                    );
                    await authority.resolveEndpointsAsync();
                    expect(
                        getCloudDiscoveryMetadataFromConfigSpy
                    ).toHaveBeenCalled();
                    expect(
                        getCloudDiscoveryMetadataFromHarcodedValuesSpy
                    ).toHaveBeenCalled();
                    expect(
                        getCloudDiscoveryMetadataFromNetworkSpy
                    ).toHaveBeenCalled();
                });

                it("Sets instance metadata from network if not present in config, or hardcoded values and cache entry is expired", async () => {
                    const authorityOptions: AuthorityOptions = {
                        protocolMode: ProtocolMode.AAD,
                        knownAuthorities: [],
                        cloudDiscoveryMetadata: "",
                        authorityMetadata: "",
                    };

                    const key = `authority-metadata-${TEST_CONFIG.MSAL_CLIENT_ID}-sts.windows.net`;
                    mockStorage.setAuthorityMetadata(key, {
                        ...authorityMetadataCacheValue,
                        expiresAt: TimeUtils.nowSeconds() - 1000,
                    });
                    jest.spyOn(
                        Authority.prototype,
                        <any>"updateEndpointMetadata"
                    ).mockResolvedValue("cache");

                    networkInterface.sendGetRequestAsync = (
                        url: string,
                        options?: NetworkRequestOptions
                    ): any => {
                        if (url.includes("discovery/instance")) {
                            return DEFAULT_TENANT_DISCOVERY_RESPONSE;
                        } else {
                            return DEFAULT_OPENID_CONFIG_RESPONSE;
                        }
                    };

                    authority = new Authority(
                        Constants.DEFAULT_AUTHORITY,
                        networkInterface,
                        mockStorage,
                        authorityOptions,
                        logger,
                        TEST_CONFIG.CORRELATION_ID,
                        new StubPerformanceClient()
                    );

                    getCloudDiscoveryMetadataFromHarcodedValuesSpy.mockReturnValue(
                        null
                    );

                    await authority.resolveEndpointsAsync();
                    expect(authority.isAlias("login.microsoftonline.com")).toBe(
                        true
                    );
                    expect(authority.isAlias("login.windows.net")).toBe(true);
                    expect(authority.isAlias("sts.windows.net")).toBe(true);
                    expect(authority.getPreferredCache()).toBe(
                        "sts.windows.net"
                    );
                    expect(
                        authority.canonicalAuthority.includes(
                            "login.windows.net"
                        )
                    ).toBe(true);

                    // Test that the metadata is cached
                    const cachedAuthorityMetadata =
                        mockStorage.getAuthorityMetadata(key);
                    if (!cachedAuthorityMetadata) {
                        throw Error(
                            "Cached AuthorityMetadata should not be null!"
                        );
                    } else {
                        expect(cachedAuthorityMetadata.aliases).toContain(
                            "login.microsoftonline.com"
                        );
                        expect(cachedAuthorityMetadata.aliases).toContain(
                            "login.windows.net"
                        );
                        expect(cachedAuthorityMetadata.aliases).toContain(
                            "sts.windows.net"
                        );
                        expect(cachedAuthorityMetadata.preferred_cache).toBe(
                            "sts.windows.net"
                        );
                        expect(cachedAuthorityMetadata.preferred_network).toBe(
                            "login.windows.net"
                        );
                        expect(cachedAuthorityMetadata.aliasesFromNetwork).toBe(
                            true
                        );
                    }

                    expect(
                        getCloudDiscoveryMetadataFromConfigSpy
                    ).toHaveBeenCalled();
                    expect(
                        getCloudDiscoveryMetadataFromHarcodedValuesSpy
                    ).toHaveBeenCalled();
                    expect(
                        getCloudDiscoveryMetadataFromNetworkSpy
                    ).toHaveBeenCalled();
                });

                it("Sets metadata from host if network call succeeds but does not explicitly include the host", async () => {
                    const authorityOptions: AuthorityOptions = {
                        protocolMode: ProtocolMode.AAD,
                        knownAuthorities: [],
                        cloudDiscoveryMetadata: "",
                        authorityMetadata: "",
                    };
                    networkInterface.sendGetRequestAsync = (
                        url: string,
                        options?: NetworkRequestOptions
                    ): any => {
                        return DEFAULT_TENANT_DISCOVERY_RESPONSE;
                    };
                    jest.spyOn(
                        Authority.prototype,
                        <any>"updateEndpointMetadata"
                    ).mockResolvedValue("cache");
                    authority = new Authority(
                        "https://custom-domain.microsoft.com",
                        networkInterface,
                        mockStorage,
                        authorityOptions,
                        logger,
                        TEST_CONFIG.CORRELATION_ID,
                        new StubPerformanceClient()
                    );

                    await authority.resolveEndpointsAsync();
                    expect(
                        authority.isAlias("custom-domain.microsoft.com")
                    ).toBe(true);
                    expect(authority.getPreferredCache()).toBe(
                        "custom-domain.microsoft.com"
                    );
                    expect(
                        authority.canonicalAuthority.includes(
                            "custom-domain.microsoft.com"
                        )
                    );

                    // Test that the metadata is cached
                    const key = `authority-metadata-${TEST_CONFIG.MSAL_CLIENT_ID}-custom-domain.microsoft.com`;
                    const cachedAuthorityMetadata =
                        mockStorage.getAuthorityMetadata(key);
                    if (!cachedAuthorityMetadata) {
                        throw Error(
                            "Cached AuthorityMetadata should not be null!"
                        );
                    } else {
                        expect(cachedAuthorityMetadata.aliases).toContain(
                            "custom-domain.microsoft.com"
                        );
                        expect(cachedAuthorityMetadata.preferred_cache).toBe(
                            "custom-domain.microsoft.com"
                        );
                        expect(cachedAuthorityMetadata.preferred_network).toBe(
                            "custom-domain.microsoft.com"
                        );
                        expect(cachedAuthorityMetadata.aliasesFromNetwork).toBe(
                            true
                        );
                    }
                });
            });

            it("Throws if cloudDiscoveryMetadata cannot be parsed into json", (done) => {
                const authorityOptions: AuthorityOptions = {
                    protocolMode: ProtocolMode.AAD,
                    knownAuthorities: [],
                    cloudDiscoveryMetadata: "this-is-not-valid-json",
                    authorityMetadata: "",
                };
                authority = new Authority(
                    Constants.DEFAULT_AUTHORITY,
                    networkInterface,
                    mockStorage,
                    authorityOptions,
                    logger,
                    TEST_CONFIG.CORRELATION_ID,
                    new StubPerformanceClient()
                );
                authority.resolveEndpointsAsync().catch((e) => {
                    expect(e).toBeInstanceOf(ClientConfigurationError);
                    getDefaultErrorMessage(
                        ClientConfigurationErrorCodes.invalidCloudDiscoveryMetadata
                    );
                    done();
                });
            });

            it("throws untrustedAuthority error if host is not part of knownAuthorities, cloudDiscoveryMetadata and instance discovery network call fails", (done) => {
                const getCloudDiscoveryMetadataFromHarcodedValuesSpy: jest.SpyInstance =
                    jest.spyOn(
                        authorityMetadata,
                        "getCloudDiscoveryMetadataFromHardcodedValues"
                    );

                getCloudDiscoveryMetadataFromHarcodedValuesSpy.mockReturnValue(
                    null
                );

                const authorityOptions: AuthorityOptions = {
                    protocolMode: ProtocolMode.AAD,
                    knownAuthorities: [],
                    cloudDiscoveryMetadata: "",
                    authorityMetadata: "",
                };
                networkInterface.sendGetRequestAsync = (
                    url: string,
                    options?: NetworkRequestOptions
                ): any => {
                    throw Error("Unable to get response");
                };
                authority = new Authority(
                    Constants.DEFAULT_AUTHORITY,
                    networkInterface,
                    mockStorage,
                    authorityOptions,
                    logger,
                    TEST_CONFIG.CORRELATION_ID,
                    new StubPerformanceClient()
                );

                authority.resolveEndpointsAsync().catch((e) => {
                    expect(e).toBeInstanceOf(ClientConfigurationError);
                    expect(e.errorMessage).toBe(
                        getDefaultErrorMessage(
                            ClientConfigurationErrorCodes.untrustedAuthority
                        )
                    );
                    expect(e.errorCode).toBe(
                        ClientConfigurationErrorCodes.untrustedAuthority
                    );
                    done();
                });
            });

            it("throws untrustedAuthority error if host is not part of knownAuthorities, cloudDiscoveryMetadata and instance discovery network call doesn't return metadata, and the error returned from AAD is 'invalid_instance'", (done) => {
                const getCloudDiscoveryMetadataFromHarcodedValuesSpy: jest.SpyInstance =
                    jest.spyOn(
                        authorityMetadata,
                        "getCloudDiscoveryMetadataFromHardcodedValues"
                    );

                getCloudDiscoveryMetadataFromHarcodedValuesSpy.mockReturnValue(
                    null
                );

                const authorityOptions: AuthorityOptions = {
                    protocolMode: ProtocolMode.AAD,
                    knownAuthorities: [],
                    cloudDiscoveryMetadata: "",
                    authorityMetadata: "",
                };
                networkInterface.sendGetRequestAsync = (
                    url: string,
                    options?: NetworkRequestOptions
                ): any => {
                    return {
                        body: {
                            error: Constants.INVALID_INSTANCE,
                            error_description: "error_description",
                        },
                    };
                };
                authority = new Authority(
                    Constants.DEFAULT_AUTHORITY,
                    networkInterface,
                    mockStorage,
                    authorityOptions,
                    logger,
                    TEST_CONFIG.CORRELATION_ID,
                    new StubPerformanceClient()
                );

                authority.resolveEndpointsAsync().catch((e) => {
                    expect(e).toBeInstanceOf(ClientConfigurationError);
                    expect(e.errorMessage).toBe(
                        getDefaultErrorMessage(
                            ClientConfigurationErrorCodes.untrustedAuthority
                        )
                    );
                    expect(e.errorCode).toEqual(
                        ClientConfigurationErrorCodes.untrustedAuthority
                    );
                    done();
                });
            });

            it("throws untrustedAuthority error if host is not part of knownAuthorities, cloudDiscoveryMetadata and instance discovery network call doesn't return metadata, and the error returned from AAD is NOT 'invalid_instance'", async () => {
                const authorityOptions: AuthorityOptions = {
                    protocolMode: ProtocolMode.AAD,
                    knownAuthorities: [],
                    cloudDiscoveryMetadata: "",
                    authorityMetadata: "",
                };
                networkInterface.sendGetRequestAsync = (
                    url: string,
                    options?: NetworkRequestOptions
                ): any => {
                    return {
                        body: {
                            error: "not_invalid_instance",
                            error_description: "error_description",
                        },
                    };
                };
                jest.spyOn(
                    Authority.prototype,
                    <any>"updateEndpointMetadata"
                ).mockResolvedValue("cache");
                authority = new Authority(
                    Constants.DEFAULT_AUTHORITY,
                    networkInterface,
                    mockStorage,
                    authorityOptions,
                    logger,
                    TEST_CONFIG.CORRELATION_ID,
                    new StubPerformanceClient()
                );

                await authority.resolveEndpointsAsync();
                expect(authority.isAlias("login.microsoftonline.com")).toBe(
                    true
                );
            });

            it("getPreferredCache throws error if discovery is not complete", () => {
                expect(() => authority.getPreferredCache()).toThrowError(
                    createClientAuthError(
                        ClientAuthErrorCodes.endpointResolutionError,
                        ""
                    )
                );
            });
        });

        it("ADFS authority uses v1 well-known endpoint", async () => {
            const authorityUrl = "https://login.microsoftonline.com/adfs/";
            authority = new Authority(
                authorityUrl,
                networkInterface,
                mockStorage,
                authorityOptions,
                logger,
                TEST_CONFIG.CORRELATION_ID,
                new StubPerformanceClient()
            );

            await authority.resolveEndpointsAsync();
            // @ts-ignore
            expect(authority.defaultOpenIdConfigurationEndpoint).toBe(
                `${authorityUrl}.well-known/openid-configuration`
            );
        });

        it("Arbitrary B2C (non-microsoft known authority) authority uses v2 well-known endpoint", async () => {
            const authorityUrl = TEST_CONFIG.b2cValidAuthority;
            let endpoint = "";
            authority = new Authority(
                authorityUrl,
                networkInterface,
                mockStorage,
                { ...authorityOptions, knownAuthorities: [authorityUrl] },
                logger,
                TEST_CONFIG.CORRELATION_ID,
                new StubPerformanceClient()
            );
            jest.spyOn(
                networkInterface,
                <any>"sendGetRequestAsync"
            ).mockImplementation((openIdConfigEndpoint) => {
                // @ts-ignore
                endpoint = openIdConfigEndpoint;
                // Use a B2C-appropriate issuer so validateIssuer (Rule 1: same
                // scheme + host) does not reject the discovery response.
                return {
                    ...DEFAULT_OPENID_CONFIG_RESPONSE,
                    body: {
                        ...DEFAULT_OPENID_CONFIG_RESPONSE.body,
                        issuer: "https://fabrikamb2c.b2clogin.com/tfp/fabrikamb2c.onmicrosoft.com/b2c_1_susi/v2.0/",
                    },
                };
            });

            await authority.resolveEndpointsAsync();
            expect(endpoint).toBe(
                `${authorityUrl}/v2.0/.well-known/openid-configuration`
            );
        });

        it("v2 is not added to authority if already provided", async () => {
            const authorityUrl =
                "https://login.microsoftonline.com/test-tenant-id/v2.0";
            authority = new Authority(
                authorityUrl,
                networkInterface,
                mockStorage,
                { ...authorityOptions, knownAuthorities: [authorityUrl] },
                logger,
                TEST_CONFIG.CORRELATION_ID,
                new StubPerformanceClient()
            );

            await authority.resolveEndpointsAsync();
            // @ts-ignore
            expect(authority.defaultOpenIdConfigurationEndpoint).toBe(
                `${authorityUrl}/.well-known/openid-configuration`
            );
        });

        it("Does not append v2 to endpoint when not using a known Microsoft authority", async () => {
            const authorityUrl = "https://test.com/";
            let endpoint = "";
            const options = {
                protocolMode: ProtocolMode.OIDC,
                knownAuthorities: ["https://test.com"],
                cloudDiscoveryMetadata: "",
                authorityMetadata: "",
            };
            authority = new Authority(
                authorityUrl,
                networkInterface,
                mockStorage,
                options,
                logger,
                TEST_CONFIG.CORRELATION_ID,
                new StubPerformanceClient()
            );
            jest.spyOn(
                networkInterface,
                <any>"sendGetRequestAsync"
            ).mockImplementation((openIdConfigEndpoint) => {
                // @ts-ignore
                endpoint = openIdConfigEndpoint;
                // Use a matching issuer so validateIssuer (Rule 1: same scheme + host)
                // passes for this non-Microsoft OIDC authority.
                return {
                    ...DEFAULT_OPENID_CONFIG_RESPONSE,
                    body: {
                        ...DEFAULT_OPENID_CONFIG_RESPONSE.body,
                        issuer: "https://test.com/v2.0",
                    },
                };
            });

            await authority.resolveEndpointsAsync();
            expect(endpoint).toBe(
                `${authorityUrl}.well-known/openid-configuration`
            );
        });

        it("Does append v2 to endpoint when using a known Microsoft authority", async () => {
            const authorityUrl = "https://login.microsoftonline.com/";
            const options = {
                protocolMode: ProtocolMode.OIDC,
                knownAuthorities: [Constants.DEFAULT_AUTHORITY],
                cloudDiscoveryMetadata: "",
                authorityMetadata: "",
            };
            authority = new Authority(
                authorityUrl,
                networkInterface,
                mockStorage,
                options,
                logger,
                TEST_CONFIG.CORRELATION_ID,
                new StubPerformanceClient()
            );

            await authority.resolveEndpointsAsync();
            // @ts-ignore
            expect(authority.defaultOpenIdConfigurationEndpoint).toBe(
                `${authorityUrl}v2.0/.well-known/openid-configuration`
            );
        });
    });

    describe("replaceWithRegionalInformation", () => {
        it("throws before regionalizing an endpoint when the region is invalid", () => {
            const tokenEndpoint =
                "https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token";

            expect(() =>
                Authority.buildRegionalAuthorityString(
                    tokenEndpoint,
                    "hostile.example/path",
                    ""
                )
            ).toThrow(
                expect.objectContaining({
                    errorCode: "invalid_azure_region",
                })
            );
        });

        it("replaces authorization_endpoint", () => {
            const originResponse: OpenIdConfigResponse = {
                ...DEFAULT_OPENID_CONFIG_RESPONSE.body,
                end_session_endpoint: undefined,
            };

            const regionalResponse = Authority.replaceWithRegionalInformation(
                originResponse,
                "westus2",
                ""
            );
            expect(regionalResponse.authorization_endpoint).toBe(
                "https://westus2.login.microsoft.com/{tenant}/oauth2/v2.0/authorize/"
            );
        });

        it("doesnt set end_session_endpoint if not included", () => {
            const originResponse: OpenIdConfigResponse = {
                ...DEFAULT_OPENID_CONFIG_RESPONSE.body,
                end_session_endpoint: undefined,
            };

            const regionalResponse = Authority.replaceWithRegionalInformation(
                originResponse,
                "westus2",
                ""
            );
            expect(regionalResponse.end_session_endpoint).toBeUndefined();
        });

        it("throws before modifying metadata when the region is invalid", () => {
            const originResponse: OpenIdConfigResponse = {
                ...DEFAULT_OPENID_CONFIG_RESPONSE.body,
            };

            expect(() =>
                Authority.replaceWithRegionalInformation(
                    originResponse,
                    "hostile.example/path",
                    ""
                )
            ).toThrow(
                expect.objectContaining({
                    errorCode: "invalid_azure_region",
                })
            );
        });
    });

    describe("getTenantFromAuthorityString", () => {
        it("returns tenantId if authority is a tenant-specific authority", () => {
            expect(
                getTenantFromAuthorityString(
                    TEST_CONFIG.tenantedValidAuthority,
                    ""
                )
            ).toBe(TEST_CONFIG.MSAL_TENANT_ID);
        });
        it("returns undefined if authority is a named authority (common, organizations, consumers", () => {
            expect(
                getTenantFromAuthorityString(TEST_CONFIG.validAuthority, "")
            ).toBeUndefined();
            expect(
                getTenantFromAuthorityString(
                    TEST_CONFIG.organizationsAuthority,
                    ""
                )
            ).toBeUndefined();
            expect(
                getTenantFromAuthorityString(TEST_CONFIG.consumersAuthority, "")
            ).toBeUndefined();
        });

        it("should not throw if authority has no path segments (certain OIDC scenarios)", () => {
            const authorityUrl = "https://login.live.com";
            expect(() =>
                getTenantFromAuthorityString(authorityUrl, "")
            ).not.toThrow();
        });
    });

    describe("formatAuthorityUri", () => {
        it("returns the same authority URL if it already ends with a forward slash", () => {
            const authorityUrl = "https://login.microsoftonline.com/common/";
            expect(formatAuthorityUri(authorityUrl)).toBe(authorityUrl);
        });

        it("appends forward slash if authority URL does not end with a forward slash", () => {
            const authorityUrl = "https://login.microsoftonline.com/common";
            const formattedAuthorityUrl = authorityUrl + "/";
            expect(formatAuthorityUri(authorityUrl)).toBe(
                formattedAuthorityUrl
            );
        });
    });

    describe("buildStaticAuthorityOptions", () => {
        const fullAuthorityOptions: Partial<AuthorityOptions> = {
            authority: TEST_CONFIG.validAuthority,
            knownAuthorities: [TEST_CONFIG.validAuthority],
            cloudDiscoveryMetadata: TEST_CONFIG.CLOUD_DISCOVERY_METADATA,
        };

        const matchStaticAuthorityOptions: StaticAuthorityOptions = {
            canonicalAuthority: TEST_CONFIG.validAuthority + "/",
            knownAuthorities: [TEST_CONFIG.validAuthority],
            cloudDiscoveryMetadata: JSON.parse(
                TEST_CONFIG.CLOUD_DISCOVERY_METADATA
            ),
        };

        it("correctly builds static authority options when all optional fields are correctly provided", () => {
            const staticAuthorityOptions =
                buildStaticAuthorityOptions(fullAuthorityOptions);
            expect(staticAuthorityOptions).toEqual(matchStaticAuthorityOptions);
        });

        it("doesn't set canonicalAuthority if authority is not provided", () => {
            const { authority, ...partialAuthorityOptions } =
                fullAuthorityOptions;
            const staticAuthorityOptions = buildStaticAuthorityOptions(
                partialAuthorityOptions
            );
            expect(staticAuthorityOptions.canonicalAuthority).toBeUndefined();
        });

        it("doesn't set knownAuthorities if knownAuthorities array is not provided", () => {
            const { knownAuthorities, ...partialAuthorityOptions } =
                fullAuthorityOptions;
            const staticAuthorityOptions = buildStaticAuthorityOptions(
                partialAuthorityOptions
            );
            expect(staticAuthorityOptions.knownAuthorities).toBeUndefined();
        });

        it("doesn't set cloudDiscoveryMetadata if cloudDiscoveryMetadata string is not provided", () => {
            const { cloudDiscoveryMetadata, ...partialAuthorityOptions } =
                fullAuthorityOptions;
            const staticAuthorityOptions = buildStaticAuthorityOptions(
                partialAuthorityOptions
            );
            expect(
                staticAuthorityOptions.cloudDiscoveryMetadata
            ).toBeUndefined();
        });

        it("throws if cloudDiscoveryMetadata string is not valid JSON", () => {
            const invalidCloudDiscoveryMetadata = "this-is-not-valid-json";
            const invalidCloudDiscoveryMetadataOptions: Partial<AuthorityOptions> =
                {
                    ...fullAuthorityOptions,
                    cloudDiscoveryMetadata: invalidCloudDiscoveryMetadata,
                };
            expect(() => {
                buildStaticAuthorityOptions(
                    invalidCloudDiscoveryMetadataOptions
                );
            }).toThrow(
                createClientConfigurationError(
                    ClientConfigurationErrorCodes.invalidCloudDiscoveryMetadata,
                    ""
                )
            );
        });
    });
});
