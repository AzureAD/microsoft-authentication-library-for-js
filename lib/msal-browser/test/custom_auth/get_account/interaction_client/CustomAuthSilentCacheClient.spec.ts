import { CustomAuthSilentCacheClient } from "../../../../src/custom_auth/get_account/interaction_client/CustomAuthSilentCacheClient.js";
import { customAuthConfig } from "../../test_resources/CustomAuthConfig.js";
import { CustomAuthAuthority } from "../../../../src/custom_auth/core/CustomAuthAuthority.js";
import {
    AccessTokenEntity,
    AccountEntity,
    AccountEntityUtils,
    CacheHelpers,
    CommonSilentFlowRequest,
    Constants,
    createInteractionRequiredAuthError,
    ICrypto,
    INetworkModule,
    InteractionRequiredAuthErrorCodes,
    Logger,
    RefreshTokenEntity,
    TimeUtils,
} from "@azure/msal-common/browser";
import {
    TestTokenResponse,
    TestAccountDetails,
    TestServerTokenResponse,
    TestHomeAccountId,
    TestTenantId,
    RenewedTokens,
} from "../../test_resources/TestConstants.js";
import { DefaultScopes } from "../../../../src/custom_auth/CustomAuthConstants.js";
import { BrowserCacheManager } from "../../../../src/cache/BrowserCacheManager.js";
import { BrowserConfiguration } from "../../../../src/config/Configuration.js";
import { INavigationClient } from "../../../../src/navigation/INavigationClient.js";
import {
    RANDOM_TEST_GUID,
    TEST_CONFIG,
} from "../../../utils/StringConstants.js";
import {
    getDefaultCrypto,
    getDefaultEventHandler,
    getDefaultPerformanceClient,
} from "../../test_resources/TestModules.js";
import { mock } from "node:test";

describe("CustomAuthSilentCacheClient", () => {
    let client: CustomAuthSilentCacheClient;
    let mockBrowserConfig: BrowserConfiguration;
    let mockCacheManager: BrowserCacheManager;
    let mockCrypto: ICrypto;
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

        const mockLogger = {
            clone: jest.fn(),
            info: jest.fn(),
            verbose: jest.fn(),
            warning: jest.fn(),
            trace: jest.fn(),
            tracePii: jest.fn(),
            error: jest.fn(),
            verbosePii: jest.fn(),
            errorPii: jest.fn(),
            infoPii: jest.fn(),
        } as unknown as jest.Mocked<Logger>;

        mockLogger.clone.mockReturnValue(mockLogger);

        const mockEventHandler = getDefaultEventHandler();
        const mockPerformanceClient = getDefaultPerformanceClient();
        const mockedApiClient = {} as unknown as jest.Mocked<any>;
        mockCrypto = getDefaultCrypto(
            customAuthConfig.auth.clientId,
            mockLogger,
            mockPerformanceClient
        );

        mockCacheManager = new BrowserCacheManager(
            customAuthConfig.auth.clientId,
            mockBrowserConfig.cache,
            mockCrypto,
            mockLogger,
            mockPerformanceClient,
            mockEventHandler
        );

        const authority = new CustomAuthAuthority(
            customAuthConfig.auth.authority ?? "",
            mockBrowserConfig,
            mockNetworkModule,
            mockCacheManager,
            mockLogger,
            mockPerformanceClient,
            customAuthConfig.customAuth.authApiProxyUrl
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
            authority
        );
    });

    afterEach(() => {
        jest.clearAllMocks(); // Clear mocks between tests
    });

    describe("getAccessToken", () => {
        let accountEntityToCache: AccountEntity;
        let accessTokenEntityToCache: AccessTokenEntity;
        let refreshTokenEntityToCache: RefreshTokenEntity;

        const defaultScopes = [...DefaultScopes];
        const commonSilentFlowRequest = {
            authority: customAuthConfig.auth.authority,
            correlationId: "test-correlation-id",
            scopes: defaultScopes,
            account: TestAccountDetails,
            forceRefresh: false,
            storeInCache: {
                idToken: true,
                accessToken: true,
                refreshToken: true,
            },
        } as CommonSilentFlowRequest;

        beforeEach(() => {
            accountEntityToCache =
                AccountEntityUtils.createAccountEntityFromAccountInfo(
                    TestAccountDetails
                );
            accessTokenEntityToCache = createAccessTokenEntity(mockCrypto);
            refreshTokenEntityToCache = createRefreshTokenEntity();
        });

        afterEach(() => {
            mockCacheManager.clear("test-correlation-id");
        });

        it("should get cached access token successfully and return.", async () => {
            await saveTokensIntoCache(
                "test-correlation-id",
                mockCacheManager,
                accountEntityToCache,
                accessTokenEntityToCache,
                refreshTokenEntityToCache
            );

            const result = await client.acquireToken(commonSilentFlowRequest);

            expect(result).toBeDefined();
            expect(result.accessToken).toBe(accessTokenEntityToCache.secret);
            const cachedAccessTokenScopes =
                accessTokenEntityToCache.target.split(" ");
            expect(result.scopes).toEqual(cachedAccessTokenScopes);
        });

        it("should refresh access token (with valid cached refresh token) when cached access token is invalid.", async () => {
            accessTokenEntityToCache.cachedAt = new Date(Date.now() - 1000)
                .getTime()
                .toString();
            await saveTokensIntoCache(
                "test-correlation-id",
                mockCacheManager,
                accountEntityToCache,
                accessTokenEntityToCache,
                refreshTokenEntityToCache
            );

            const result = await client.acquireToken(commonSilentFlowRequest);

            expect(result).toBeDefined();
            expect(result.accessToken).toBe(RenewedTokens.ACCESS_TOKEN);

            const refreshTokenKey = mockCacheManager
                .getTokenKeys()
                .refreshToken.filter((key) =>
                    key.includes(TestHomeAccountId)
                )[0];
            const refreshToken = mockCacheManager.getRefreshTokenCredential(
                refreshTokenKey,
                RANDOM_TEST_GUID
            );
            expect(refreshToken?.secret).toEqual("renewed-refresh-token");
        });

        it("should renew token when no cached access token found (by giving unmatched scopes)", async () => {
            // result in error when fetching access token because given scopes should be subset of cached access token scopes
            const unmatchedScope = ["Mail.Read"];
            await saveTokensIntoCache(
                "test-correlation-id",
                mockCacheManager,
                accountEntityToCache,
                accessTokenEntityToCache,
                refreshTokenEntityToCache
            );

            commonSilentFlowRequest.scopes = unmatchedScope;

            const result = await client.acquireToken(commonSilentFlowRequest);

            expect(result).toBeDefined();
            expect(result.accessToken).toBe(RenewedTokens.ACCESS_TOKEN);

            const refreshTokenKey = mockCacheManager
                .getTokenKeys()
                .refreshToken.filter((key) =>
                    key.includes(TestHomeAccountId)
                )[0];
            const refreshToken = mockCacheManager.getRefreshTokenCredential(
                refreshTokenKey,
                RANDOM_TEST_GUID
            );
            expect(refreshToken?.secret).toEqual("renewed-refresh-token");
        });

        it("should skip cache lookup and refresh access token when refreshForced is true", async () => {
            await saveTokensIntoCache(
                "test-correlation-id",
                mockCacheManager,
                accountEntityToCache,
                accessTokenEntityToCache,
                refreshTokenEntityToCache
            );

            commonSilentFlowRequest.forceRefresh = true;

            const result = await client.acquireToken(commonSilentFlowRequest);

            expect(result).toBeDefined();
            expect(result.accessToken).toBe(RenewedTokens.ACCESS_TOKEN);

            const refreshTokenKey = mockCacheManager
                .getTokenKeys()
                .refreshToken.filter((key) =>
                    key.includes(TestHomeAccountId)
                )[0];
            const refreshToken = mockCacheManager.getRefreshTokenCredential(
                refreshTokenKey,
                RANDOM_TEST_GUID
            );
            expect(refreshToken?.secret).toEqual("renewed-refresh-token");
        });

        it("should throw error when refresh token is not found", async () => {
            await saveTokensIntoCache(
                "test-correlation-id",
                mockCacheManager,
                accountEntityToCache,
                accessTokenEntityToCache
            );

            const mockNoTokensFoundError = createInteractionRequiredAuthError(
                InteractionRequiredAuthErrorCodes.noTokensFound,
                ""
            );

            commonSilentFlowRequest.forceRefresh = true;

            expect(
                client.acquireToken(commonSilentFlowRequest)
            ).rejects.toThrow(mockNoTokensFoundError);
        });

        it("should throw error when refresh token is expired", async () => {
            refreshTokenEntityToCache.expiresOn =
                TimeUtils.nowSeconds().toString();
            await saveTokensIntoCache(
                "test-correlation-id",
                mockCacheManager,
                accountEntityToCache,
                accessTokenEntityToCache,
                refreshTokenEntityToCache
            );

            const mockRefreshTokenExpiredError =
                createInteractionRequiredAuthError(
                    InteractionRequiredAuthErrorCodes.refreshTokenExpired,
                    ""
                );

            commonSilentFlowRequest.forceRefresh = true;

            expect(
                client.acquireToken(commonSilentFlowRequest)
            ).rejects.toThrow(mockRefreshTokenExpiredError);
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
                    loginHint: "test-login-hint",
                },
                {
                    homeAccountId: "test-home-account-id-2",
                    environment: "test-environment-2",
                    tenantId: "test-tenant-id-2",
                    username: "test-username-2",
                    localAccountId: "test-local-account-id-2",
                    loginHint: "test-login-hint-2",
                },
            ]);

            const account = client.getCurrentAccount("test-corrlation-id");

            expect(account).toBeDefined();
            expect(account?.homeAccountId).toBe("test-home-account-id");
            expect(account?.tenantId).toBe("test-tenant-id");
            expect(account?.username).toBe("test-username");
            expect(account?.localAccountId).toBe("test-local-account-id");
            expect(account?.environment).toBe("test-environment");
        });

        it("should return null if no account found", () => {
            jest.spyOn(mockCacheManager, "getAllAccounts").mockReturnValue([]);

            const account = client.getCurrentAccount("test-corrlation-id");

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
                loginHint: "test-login-hint-2",
            });

            jest.spyOn(mockCacheManager, "removeAccount");

            await client.logout({
                account: {
                    homeAccountId: "test-home-account-id",
                    environment: "test-environment",
                    tenantId: "test-tenant-id",
                    username: "test-username",
                    localAccountId: "test-local-account-id",
                    loginHint: "test-login-hint",
                },
            });

            expect(mockCacheManager.removeAccount).toHaveBeenCalled();
            expect(mockNavigationClient.navigateExternal).toHaveBeenCalled();
        });
    });
});

async function saveTokensIntoCache(
    correlationId: string,
    cacheManager: BrowserCacheManager,
    accountEntity?: AccountEntity,
    accessTokenEntity?: AccessTokenEntity,
    refreshTokenEntity?: RefreshTokenEntity
): Promise<void> {
    accountEntity
        ? await cacheManager.setAccount(accountEntity, correlationId, true, 0)
        : null;
    accessTokenEntity
        ? await cacheManager.setAccessTokenCredential(
              accessTokenEntity,
              correlationId,
              true
          )
        : null;
    refreshTokenEntity
        ? await cacheManager.setRefreshTokenCredential(
              refreshTokenEntity,
              correlationId,
              true
          )
        : null;
}

function createAccessTokenEntity(browserCrypto: ICrypto): AccessTokenEntity {
    const expiresOn = new Date(
        Date.now() + TestServerTokenResponse.expires_in * 1000
    ).getTime();

    return CacheHelpers.createAccessTokenEntity(
        TestHomeAccountId,
        TestAccountDetails.environment,
        TestTokenResponse.ACCESS_TOKEN,
        customAuthConfig.auth.clientId,
        TestTenantId,
        TestServerTokenResponse.scope,
        expiresOn,
        expiresOn + 0,
        browserCrypto.base64Decode,
        undefined,
        TestServerTokenResponse.token_type as Constants.AuthenticationScheme
    );
}

function createRefreshTokenEntity(): RefreshTokenEntity {
    return CacheHelpers.createRefreshTokenEntity(
        TestHomeAccountId,
        TestAccountDetails.environment,
        TestServerTokenResponse.refresh_token,
        customAuthConfig.auth.clientId
    );
}
