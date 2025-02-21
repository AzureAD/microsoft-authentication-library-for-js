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
import { CustomAuthTokenClient } from "../../../src/get_account/interaction_client/CustomAuthTokeClient.js";
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
    let client: CustomAuthTokenClient;
    let mockBrowserConfig: BrowserConfiguration;
    let mockFlowClient: SilentFlowClient;

    beforeEach(() => {
        mockBrowserConfig = {
            auth: {
                clientId: customAuthConfig.auth.clientId,
                authority: customAuthConfig.auth.authority,
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

        const mockCacheManager = {
            getWrapperMetadata: jest.fn(),
            getServerTelemetry: jest.fn(),
        } as unknown as jest.Mocked<BrowserCacheManager>;
        mockCacheManager.getWrapperMetadata.mockReturnValue(["", ""]);
        mockCacheManager.getServerTelemetry.mockReturnValue(null);
        const mockNetworkModule = {} as unknown as jest.Mocked<INetworkModule>;

        const mockCrypto = {
            createNewGuid: jest.fn(),
        } as unknown as jest.Mocked<ICrypto>;

        const mockEventHandler = {} as unknown as jest.Mocked<EventHandler>;
        const mockNavigationClient = {} as unknown as jest.Mocked<INavigationClient>;
        const mockPerformanceClient = {} as unknown as jest.Mocked<IPerformanceClient>;
        const mockedApiClient = {} as unknown as jest.Mocked<any>;

        const mockLogger = {
            clone: jest.fn(),
            verbose: jest.fn(),
            info: jest.fn(),
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

        client = new CustomAuthTokenClient(
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

    it("acquireToken calls SilentFlowClient and returns result", async () => {
        const mockedRequest = {} as unknown as jest.Mocked<CommonSilentFlowRequest>;
        const result = await client.acquireToken(mockedRequest);

        expect(result).toBeDefined();
        expect(result.accessToken).toBe("test-access-token");
        expect(result.idToken).toBe("test-id-token");
        expect(result.tenantId).toBe("test-tenant-id");
    });
});
