import {
    BrowserCacheManager,
    BrowserConfiguration,
    CommonSilentFlowRequest,
    EventHandler,
    ICrypto,
    INavigationClient,
    INetworkModule,
    IPerformanceClient,
    Logger,
    SilentFlowClient,
} from "@azure/msal-browser";
import { CustomAuthSilentCacheClient } from "../../../src/get_account/interaction_client/CustomAuthSilentCacheClient.js";
import { customAuthConfig } from "../../test_resources/CustomAuthConfig.js";
import { CustomAuthAuthority } from "../../../src/core/CustomAuthAuthority.js";

jest.mock("@azure/msal-browser", () => {
    const actualModule = jest.requireActual("@azure/msal-browser");
    return {
        ...actualModule,
        SilentFlowClient: jest.fn().mockImplementation(() => ({
            acquireToken: jest.fn().mockResolvedValue({
                uniqueId: "test-unique-id",
                tenantId: "test-tenant-id",
                scopes: ["test-scope"],
                account: {
                    homeAccountId: "test-home-account-id",
                    environment: "test-environment",
                    tenantId: "test-tenant-id",
                    username: "test-username",
                },
                idToken: "test-id-token",
                idTokenClaims: {},
                accessToken: "test-access-token",
                refreshToken: "test-refresh-token",
                expiresOn: new Date(),
                extExpiresOn: new Date(),
            }),
        })),
        ServerTelemetryManager: jest.fn(),
    };
});

describe("CustomAuthTokenClient", () => {
    let client: CustomAuthSilentCacheClient;
    let mockBrowserConfig: BrowserConfiguration;
    const mockCacheManager = {
        getWrapperMetadata: jest.fn(),
        getServerTelemetry: jest.fn(),
        getAllAccounts: jest.fn(),
        getAccountInfoFilteredBy: jest.fn(),
        getActiveAccount: jest.fn(),
        removeAccount: jest.fn(),
    } as unknown as jest.Mocked<BrowserCacheManager>;
    const mockNavigationClient = {
        navigateExternal: jest.fn(),
    } as unknown as jest.Mocked<INavigationClient>;

    beforeEach(() => {
        mockBrowserConfig = {
            auth: {
                clientId: customAuthConfig.auth.clientId,
                authority: customAuthConfig.auth.authority,
                postLogoutRedirectUri: "http://example.com",
            },
            system: {
                loggerOptions: {
                    loggerCallback: jest.fn(),
                    piiLoggingEnabled: false,
                    logLevel: 2,
                },
                tokenRenewalOffsetSeconds: 300,
            },
            cache: {
                claimsBasedCachingEnabled: false,
            },
            telemetry: {},
        } as unknown as jest.Mocked<BrowserConfiguration>;

        mockCacheManager.getWrapperMetadata.mockReturnValue(["", ""]);
        mockCacheManager.getServerTelemetry.mockReturnValue(null);

        const mockNetworkModule = {} as unknown as jest.Mocked<INetworkModule>;

        const mockCrypto = {
            createNewGuid: jest.fn(),
        } as unknown as jest.Mocked<ICrypto>;

        const mockEventHandler = {} as unknown as jest.Mocked<EventHandler>;
        const mockPerformanceClient = {} as unknown as jest.Mocked<IPerformanceClient>;
        const mockedApiClient = {} as unknown as jest.Mocked<any>;

        const mockLogger = {
            clone: jest.fn(),
            verbose: jest.fn(),
            info: jest.fn(),
            warning: jest.fn(),
        } as unknown as jest.Mocked<Logger>;
        mockLogger.clone.mockReturnValue(mockLogger);

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

        const authority = new CustomAuthAuthority(
            customAuthConfig.auth.authority ?? "",
            mockConfig,
            mockNetworkModule,
            mockCacheManager,
            mockLogger,
            customAuthConfig.customAuth.authApiProxyUrl,
        );

        client = new CustomAuthSilentCacheClient(
            mockBrowserConfig,
            mockCacheManager,
            mockCrypto,
            mockLogger,
            mockEventHandler,
            mockNavigationClient,
            mockPerformanceClient,
            mockedApiClient,
            authority,
        );
    });

    describe("acquireToken", () => {
        it("should call SilentFlowClient and returns result", async () => {
            const mockedRequest = {} as unknown as jest.Mocked<CommonSilentFlowRequest>;
            const result = await client.acquireToken(mockedRequest);

            expect(result).toBeDefined();
            expect(result.accessToken).toBe("test-access-token");
            expect(result.idToken).toBe("test-id-token");
            expect(result.tenantId).toBe("test-tenant-id");
        });
    });

    describe("getCurrentAccount", () => {
        it("should return account from cache", () => {
            mockCacheManager.getAllAccounts.mockReturnValue([
                {
                    homeAccountId: "test-home-account-id",
                    environment: "test-environment",
                    tenantId: "test-tenant-id",
                    username: "test-username",
                    localAccountId: "test-local-account-id",
                },
                {
                    homeAccountId: "test-home-account-id-2",
                    environment: "test-environment-2",
                    tenantId: "test-tenant-id-2",
                    username: "test-username-2",
                    localAccountId: "test-local-account-id-2",
                },
            ]);

            const account = client.getCurrentAccount();

            expect(account).toBeDefined();
            expect(account?.homeAccountId).toBe("test-home-account-id");
            expect(account?.tenantId).toBe("test-tenant-id");
            expect(account?.username).toBe("test-username");
            expect(account?.localAccountId).toBe("test-local-account-id");
            expect(account?.environment).toBe("test-environment");
        });

        it("should return account from cache if valid username is provided", () => {
            mockCacheManager.getAccountInfoFilteredBy.mockReturnValue({
                homeAccountId: "test-home-account-id",
                environment: "test-environment",
                tenantId: "test-tenant-id",
                username: "test-username",
                localAccountId: "test-local-account-id",
            });

            const account = client.getCurrentAccount("abc@test.com");

            expect(account).toBeDefined();
            expect(account?.homeAccountId).toBe("test-home-account-id");
            expect(account?.tenantId).toBe("test-tenant-id");
            expect(account?.username).toBe("test-username");
            expect(account?.localAccountId).toBe("test-local-account-id");
            expect(account?.environment).toBe("test-environment");
        });

        it("should return null if no account found", () => {
            mockCacheManager.getAllAccounts.mockReturnValue([]);

            const account = client.getCurrentAccount();

            expect(account).toBe(null);
        });
    });

    describe("logout", () => {
        it("should logout successfully", async () => {
            mockCacheManager.getActiveAccount.mockReturnValue({
                homeAccountId: "test-home-account-id-2",
                environment: "test-environment-2",
                tenantId: "test-tenant-id-2",
                username: "test-username-2",
                localAccountId: "test-local-account-id-2",
            });

            await client.logout({
                account: {
                    homeAccountId: "test-home-account-id",
                    environment: "test-environment",
                    tenantId: "test-tenant-id",
                    username: "test-username",
                    localAccountId: "test-local-account-id",
                },
            });

            expect(mockCacheManager.removeAccount).toHaveBeenCalled();
            expect(mockNavigationClient.navigateExternal).toHaveBeenCalled();
        });
    });
});
