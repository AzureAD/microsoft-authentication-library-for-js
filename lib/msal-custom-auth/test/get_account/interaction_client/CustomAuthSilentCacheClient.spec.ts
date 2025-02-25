import {
    AccountEntity,
    AuthenticationScheme,
    BrowserCacheManager,
    BrowserConfiguration,
    EventHandler,
    ICrypto,
    INavigationClient,
    INetworkModule,
    Logger,
} from "@azure/msal-browser";
import { CustomAuthSilentCacheClient } from "../../../src/get_account/interaction_client/CustomAuthSilentCacheClient.js";
import { customAuthConfig } from "../../test_resources/CustomAuthConfig.js";
import { CustomAuthAuthority } from "../../../src/core/CustomAuthAuthority.js";
import { CacheHelpers, RefreshTokenEntity, StubPerformanceClient, TimeUtils } from "@azure/msal-common";
import {
    TestTokenResponse,
    TestAccounDetails,
    TestServerTokenResponse,
    TestHomeAccountId,
    TestTenantId,
    TestIdTokenClaims,
    RenewedTokens,
} from "../../test_resources/TestConstants.js";
import { AccessTokenEntity } from "../../../../msal-common/lib/types/exports-common.js";
import { GetAccessTokenError, InvalidRefreshTokenFound } from "../../../src/core/error/GetAccessTokenError.js";

jest.mock("@azure/msal-browser", () => {
    const actualModule = jest.requireActual("@azure/msal-browser");
    return {
        ...actualModule,
        ServerTelemetryManager: jest.fn(),
    };
});

describe("CustomAuthSilentCacheClient", () => {
    let client: CustomAuthSilentCacheClient;
    let mockBrowserConfig: BrowserConfiguration;
    let mockCacheManager: BrowserCacheManager;
    let browserCrypto: ICrypto;
    let mockNetworkModule: INetworkModule;

    const mockNavigationClient = {
        navigateExternal: jest.fn(),
    } as unknown as jest.Mocked<INavigationClient>;

    beforeEach(() => {
        const serverResponse = {
            status: 200,
            body: {
                token_type: "Bearer",
                scope: TestServerTokenResponse.scope,
                expires_in: 3600,
                ext_expires_in: 3600,
                correlation_id: "test-correlation-id",
                access_token: RenewedTokens.ACCESS_TOKEN,
                refresh_token: RenewedTokens.REFRESH_TOKEN,
                id_token: TestTokenResponse.ID_TOKEN,
                client_info: TestTokenResponse.CLIENT_INFO,
            },
        };

        mockNetworkModule = {
            sendGetRequestAsync: jest.fn(),
            sendPostRequestAsync: jest.fn().mockResolvedValue(serverResponse),
        } as unknown as jest.Mocked<INetworkModule>;

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
                networkClient: mockNetworkModule,
                tokenRenewalOffsetSeconds: 300,
            },
            cache: {
                claimsBasedCachingEnabled: false,
            },
            telemetry: {},
        } as unknown as jest.Mocked<BrowserConfiguration>;

        browserCrypto = {
            createNewGuid: jest.fn(),
        } as unknown as jest.Mocked<ICrypto>;

        const decodedStr = JSON.stringify(TestIdTokenClaims);
        const mockCrypto = {
            createNewGuid: jest.fn(),
            base64Decode: jest.fn().mockReturnValue(decodedStr),
        } as unknown as jest.Mocked<ICrypto>;

        const mockEventHandler = {} as unknown as jest.Mocked<EventHandler>;
        const mockPerformanceClient = new StubPerformanceClient();
        const mockedApiClient = {} as unknown as jest.Mocked<any>;

        const mockLogger = {
            clone: jest.fn(),
            verbose: jest.fn(),
            info: jest.fn(),
            warning: jest.fn(),
            trace: jest.fn(),
            tracePii: jest.fn(),
            error: jest.fn(),
            verbosePii: jest.fn(),
            errorPii: jest.fn(),
            infoPii: jest.fn(),
        } as unknown as jest.Mocked<Logger>;
        mockLogger.clone.mockReturnValue(mockLogger);

        mockCacheManager = new BrowserCacheManager(
            customAuthConfig.auth.clientId,
            mockBrowserConfig.cache,
            browserCrypto,
            mockLogger,
        );

        jest.spyOn(mockCacheManager, "getWrapperMetadata").mockReturnValue(["", ""]);
        jest.spyOn(mockCacheManager, "getServerTelemetry").mockReturnValue(null);
        mockCacheManager.getAllAccounts = jest.fn();
        mockCacheManager.getAccountInfoFilteredBy = jest.fn();
        mockCacheManager.getActiveAccount = jest.fn();
        mockCacheManager.removeAccount = jest.fn();

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

    afterEach(() => {
        jest.clearAllMocks(); // Clear mocks between tests
    });

    describe("getAccessToken", () => {
        let accountEntityToCache: AccountEntity;
        let accessTokenEntityToCache: AccessTokenEntity;
        let refreshTokenEntityToCache: RefreshTokenEntity;

        const mockGetAccessTokenError = new GetAccessTokenError(
            InvalidRefreshTokenFound,
            "Refresh token is not found or expired.",
        );

        beforeEach(() => {
            accountEntityToCache = AccountEntity.createFromAccountInfo(TestAccounDetails);
            accessTokenEntityToCache = createAccessTokenEntity(browserCrypto);
            refreshTokenEntityToCache = createRefreshTokenEntity();

            jest.spyOn(AccountEntity, "generateHomeAccountId").mockReturnValue(TestHomeAccountId);
        });

        afterEach(() => {
            mockCacheManager.clear();
        });

        it("should get cached access token successfully and return.", async () => {
            saveTokensIntoCache(
                mockCacheManager,
                accountEntityToCache,
                accessTokenEntityToCache,
                refreshTokenEntityToCache,
            );
            const result = await client.getAccessToken(TestAccounDetails);

            expect(result).toBeDefined();
            expect(result.accessToken).toBe(accessTokenEntityToCache.secret);
            const cachedAccessTokenScopes = accessTokenEntityToCache.target.split(" ");
            expect(result.scopes).toEqual(cachedAccessTokenScopes);
        });

        it("should refresh access token (with valid cached refresh token) when cached access token is invalid.", async () => {
            accessTokenEntityToCache.cachedAt = new Date(Date.now() - 1000).getTime().toString();
            saveTokensIntoCache(
                mockCacheManager,
                accountEntityToCache,
                accessTokenEntityToCache,
                refreshTokenEntityToCache,
            );

            const result = await client.getAccessToken(TestAccounDetails);

            expect(result).toBeDefined();
            expect(result.accessToken).toBe(RenewedTokens.ACCESS_TOKEN);

            const refreshTokenKey = mockCacheManager
                .getTokenKeys()
                .refreshToken.filter((key) => key.includes(TestHomeAccountId))[0];
            const refreshToken = mockCacheManager.getRefreshTokenCredential(refreshTokenKey);
            expect(refreshToken?.secret).toEqual("renewed-refresh-token");
        });

        it("should renew token when no cached access token found (by giving unmatched scopes)", async () => {
            // result in error when fetching access token because given scopes should be subset of cached access token scopes
            const unmatchedScope = ["Mail.Read"];
            saveTokensIntoCache(
                mockCacheManager,
                accountEntityToCache,
                accessTokenEntityToCache,
                refreshTokenEntityToCache,
            );

            const result = await client.getAccessToken(TestAccounDetails, false, unmatchedScope);

            expect(result).toBeDefined();
            expect(result.accessToken).toBe(RenewedTokens.ACCESS_TOKEN);

            const refreshTokenKey = mockCacheManager
                .getTokenKeys()
                .refreshToken.filter((key) => key.includes(TestHomeAccountId))[0];
            const refreshToken = mockCacheManager.getRefreshTokenCredential(refreshTokenKey);
            expect(refreshToken?.secret).toEqual("renewed-refresh-token");
        });

        it("should skip cache lookup and refresh access token when refreshForced is true", async () => {
            saveTokensIntoCache(
                mockCacheManager,
                accountEntityToCache,
                accessTokenEntityToCache,
                refreshTokenEntityToCache,
            );

            const result = await client.getAccessToken(TestAccounDetails, true);
            expect(result).toBeDefined();

            expect(result.accessToken).toBe(RenewedTokens.ACCESS_TOKEN);

            const refreshTokenKey = mockCacheManager
                .getTokenKeys()
                .refreshToken.filter((key) => key.includes(TestHomeAccountId))[0];
            const refreshToken = mockCacheManager.getRefreshTokenCredential(refreshTokenKey);
            expect(refreshToken?.secret).toEqual("renewed-refresh-token");
        });

        it("should throw error when refresh token is not found", async () => {
            saveTokensIntoCache(mockCacheManager, accountEntityToCache, accessTokenEntityToCache);

            expect(client.getAccessToken(TestAccounDetails, true)).rejects.toThrow(mockGetAccessTokenError);
        });

        it("should throw error when refresh token is expired", async () => {
            refreshTokenEntityToCache.expiresOn = TimeUtils.nowSeconds().toString();
            saveTokensIntoCache(
                mockCacheManager,
                accountEntityToCache,
                accessTokenEntityToCache,
                refreshTokenEntityToCache,
            );

            expect(client.getAccessToken(TestAccounDetails, true)).rejects.toThrow(mockGetAccessTokenError);
        });
    });

    describe("getCurrentAccount", () => {
        it("should return account from cache", () => {
            jest.spyOn(mockCacheManager, "getAllAccounts").mockReturnValue([
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
            jest.spyOn(mockCacheManager, "getAccountInfoFilteredBy").mockReturnValue({
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
            jest.spyOn(mockCacheManager, "getAllAccounts").mockReturnValue([]);

            const account = client.getCurrentAccount();

            expect(account).toBe(null);
        });
    });

    describe("logout", () => {
        it("should logout successfully", async () => {
            jest.spyOn(mockCacheManager, "getActiveAccount").mockReturnValue({
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

async function saveTokensIntoCache(
    mockCacheManager: BrowserCacheManager,
    accountEntity?: AccountEntity,
    accessTokenEntity?: AccessTokenEntity,
    refreshTokenEntity?: RefreshTokenEntity,
): Promise<void> {
    accountEntity ? mockCacheManager.setAccount(accountEntity) : null;
    accessTokenEntity ? mockCacheManager.setAccessTokenCredential(accessTokenEntity) : null;
    refreshTokenEntity ? mockCacheManager.setRefreshTokenCredential(refreshTokenEntity) : null;
}

function createAccessTokenEntity(browserCrypto: ICrypto): AccessTokenEntity {
    const expiresOn = new Date(Date.now() + TestServerTokenResponse.expires_in * 1000).getTime();
    browserCrypto.base64Decode = jest.fn().mockReturnValue("");

    return CacheHelpers.createAccessTokenEntity(
        TestHomeAccountId,
        TestAccounDetails.environment,
        TestTokenResponse.ACCESS_TOKEN,
        customAuthConfig.auth.clientId,
        TestTenantId,
        TestServerTokenResponse.scope,
        expiresOn,
        expiresOn + 0,
        browserCrypto.base64Decode,
        undefined,
        TestServerTokenResponse.token_type as AuthenticationScheme,
    );
}

function createRefreshTokenEntity(): RefreshTokenEntity {
    return CacheHelpers.createRefreshTokenEntity(
        TestHomeAccountId,
        TestAccounDetails.environment,
        TestServerTokenResponse.refresh_token,
        customAuthConfig.auth.clientId,
    );
}
