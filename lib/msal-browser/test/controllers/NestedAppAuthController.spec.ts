import { NestedAppAuthController } from "../../src/controllers/NestedAppAuthController.js";
import {
    PublicClientApplication,
    createNestablePublicClientApplication,
} from "../../src/app/PublicClientApplication.js";
import {
    AccountInfo,
    AuthenticationResult,
    AuthorityMetadataEntity,
    CacheHelpers,
    CacheManager,
    ICrypto,
    Logger,
    createClientAuthError,
    Constants,
} from "@azure/msal-common/browser";
import {
    AuthError,
    CacheLookupPolicy,
    ClientAuthError,
    ClientAuthErrorCodes,
    Configuration,
    IPublicClientApplication,
} from "../../src/index.js";
import { buildConfiguration } from "../../src/config/Configuration.js";
import {
    RANDOM_TEST_GUID,
    TEST_CONFIG,
    TEST_TOKENS,
} from "../utils/StringConstants.js";
import { IBridgeProxy } from "../../src/naa/IBridgeProxy.js";
import MockBridge from "../naa/MockBridge.js";
import {
    BRIDGE_ERROR_PERSISTENT_ERROR_CLIENT,
    INIT_CONTEXT_RESPONSE,
    NAA_APP_CONSTANTS,
    NAA_AUTHORITY,
    NAA_CLIENT_CAPABILITIES,
    NAA_CLIENT_ID,
    NAA_CORRELATION_ID,
    NAA_SCOPE,
    SILENT_TOKEN_RESPONSE,
} from "../naa/BridgeProxyConstants.js";
import BridgeProxy from "../../src/naa/BridgeProxy.js";
import { NestedAppAuthAdapter } from "../../src/naa/mapping/NestedAppAuthAdapter.js";
import { CryptoOps } from "../../src/crypto/CryptoOps.js";
import { TestTimeUtils } from "msal-test-utils";

function stubProvider(config: Configuration) {
    const browserEnvironment = typeof window !== "undefined";

    const newConfig = buildConfiguration(config, browserEnvironment);
    const logger = new Logger(
        newConfig.system.loggerOptions,
        "unittest",
        "unittest"
    );
    const performanceClient = newConfig.telemetry.client;
}

describe("NestedAppAuthController.ts Class Unit Tests", () => {
    // create bridgeProxy
    let bridgeProxy: IBridgeProxy;
    let mockBridge: MockBridge;

    let pca: IPublicClientApplication;
    let config: Configuration;
    let windowSpy: jest.SpyInstance;
    beforeEach(async () => {
        // mock the bridge
        mockBridge = window.nestedAppAuthBridge as MockBridge;
        mockBridge.addInitContextResponse(
            "GetInitContext",
            INIT_CONTEXT_RESPONSE
        );
        bridgeProxy = await BridgeProxy.create();
        jest.spyOn(BridgeProxy, "create").mockResolvedValue(bridgeProxy);

        config = {
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                authority: TEST_CONFIG.validAuthority,
            },
        };

        pca = await createNestablePublicClientApplication(config);

        windowSpy = jest.spyOn(global, "window", "get");

        jest.spyOn(
            CacheManager.prototype,
            "getAuthorityMetadataByAlias"
        ).mockImplementation((host) => {
            const authorityMetadata: AuthorityMetadataEntity = {
                aliases: [host],
                preferred_cache: host,
                preferred_network: host,
                aliasesFromNetwork: false,
                canonical_authority: host,
                authorization_endpoint: "",
                token_endpoint: "",
                end_session_endpoint: "",
                issuer: "",
                jwks_uri: "",
                endpointsFromNetwork: false,
                expiresAt: CacheHelpers.generateAuthorityMetadataExpiresAt(),
            };
            return authorityMetadata;
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
        windowSpy.mockRestore();
        window.sessionStorage.clear();
        window.localStorage.clear();
    });

    describe("Constructor", () => {
        it("null check", (done) => {
            expect(pca).not.toBe(undefined);
            expect(pca).not.toBeNull();
            expect(pca instanceof PublicClientApplication).toBeTruthy();
            // @ts-ignore
            expect(pca.controller).toBeInstanceOf(NestedAppAuthController);
            expect(pca.getActiveAccount()).toBeNull();
            done();
        });
    });

    describe("acquireTokenInteractive tests", () => {
        it("acquireTokenInteractive throws if request is missing resource parameter and isMcp is true", async () => {
            const mcpConfig = {
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                    authority: TEST_CONFIG.validAuthority,
                    isMcp: true,
                },
            };

            const mcpPca = await createNestablePublicClientApplication(
                mcpConfig
            );

            await expect(() =>
                mcpPca.acquireTokenPopup({
                    scopes: [NAA_SCOPE],
                    correlationId: NAA_CORRELATION_ID,
                } as any)
            ).rejects.toMatchObject(
                createClientAuthError(
                    ClientAuthErrorCodes.resourceParameterRequired
                )
            );
        });

        it("acquireTokenInteractive throws if resource is provided in both request and extraQueryParameters when isMcp is true", async () => {
            const mcpConfig = {
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                    authority: TEST_CONFIG.validAuthority,
                    isMcp: true,
                },
            };

            const mcpPca = await createNestablePublicClientApplication(
                mcpConfig
            );

            await expect(() =>
                mcpPca.acquireTokenPopup({
                    scopes: [NAA_SCOPE],
                    correlationId: NAA_CORRELATION_ID,
                    resource: "https://resource.example.com",
                    extraQueryParameters: {
                        resource: "https://resource.example.com",
                    },
                } as any)
            ).rejects.toMatchObject(
                createClientAuthError(
                    ClientAuthErrorCodes.misplacedResourceParam
                )
            );
        });

        it("acquireTokenInteractive throws if resource is provided in both request and extraParameters when isMcp is true", async () => {
            const mcpConfig = {
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                    authority: TEST_CONFIG.validAuthority,
                    isMcp: true,
                },
            };

            const mcpPca = await createNestablePublicClientApplication(
                mcpConfig
            );

            await expect(() =>
                mcpPca.acquireTokenPopup({
                    scopes: [NAA_SCOPE],
                    correlationId: NAA_CORRELATION_ID,
                    resource: "https://resource.example.com",
                    extraParameters: {
                        resource: "https://resource.example.com",
                    },
                } as any)
            ).rejects.toMatchObject(
                createClientAuthError(
                    ClientAuthErrorCodes.misplacedResourceParam
                )
            );
        });

        it("acquireTokenInteractive passes resource parameter to bridge if included", async () => {
            const resource = "https://resource.example.com";
            const mcpConfig = {
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                    authority: TEST_CONFIG.validAuthority,
                    isMcp: true,
                },
            };

            const mcpPca = await createNestablePublicClientApplication(
                mcpConfig
            );
            mockBridge.addAuthResultResponse(
                "GetTokenPopup",
                SILENT_TOKEN_RESPONSE
            );

            await mcpPca.acquireTokenPopup({
                scopes: [NAA_SCOPE],
                resource: resource,
                correlationId: NAA_CORRELATION_ID,
            } as any);

            const bridgeRequest = JSON.parse(
                mockBridge.getBridgeRequests().at(-1)!
            ) as any;
            expect(bridgeRequest.tokenParams?.resource).toBe(resource);
        });
    });

    describe("acquireTokenSilent tests", () => {
        let testAccount: AccountInfo;
        let testTokenResponse: AuthenticationResult;
        let nestedAppAuthAdapter: NestedAppAuthAdapter;
        beforeEach(() => {
            testAccount = {
                homeAccountId: NAA_APP_CONSTANTS.homeAccountId,
                localAccountId: NAA_APP_CONSTANTS.localAccountId,
                environment: NAA_APP_CONSTANTS.environment,
                tenantId: NAA_APP_CONSTANTS.tenantId,
                username: NAA_APP_CONSTANTS.username,
                loginHint: NAA_APP_CONSTANTS.loginHint,
            };

            testTokenResponse = {
                authority: NAA_AUTHORITY,
                uniqueId: NAA_APP_CONSTANTS.localAccountId,
                tenantId: NAA_APP_CONSTANTS.tenantId,
                scopes: [NAA_SCOPE],
                idToken: TEST_TOKENS.IDTOKEN_V2,
                idTokenClaims: NAA_APP_CONSTANTS.idTokenClaims,
                accessToken: TEST_TOKENS.ACCESS_TOKEN,
                fromCache: false,
                correlationId: RANDOM_TEST_GUID,
                expiresOn: TestTimeUtils.nowDateWithOffset(3600),
                account: testAccount,
                tokenType: Constants.AuthenticationScheme.BEARER,
                state: "test-state",
            };

            // All logger options properties are optional... so passing empty object
            const logger = new Logger({});
            const crypto: ICrypto = new CryptoOps(logger);
            nestedAppAuthAdapter = new NestedAppAuthAdapter(
                NAA_CLIENT_ID,
                NAA_CLIENT_CAPABILITIES,
                crypto,
                logger
            );
        });

        it("acquireTokenSilent calls acquireTokenFromCache with no cache policy set", async () => {
            jest.spyOn(
                NestedAppAuthController.prototype as any,
                "acquireTokenFromCache"
            ).mockResolvedValue(testTokenResponse);

            const setActiveAccountSpy = jest.spyOn(
                PublicClientApplication.prototype,
                "setActiveAccount"
            );

            const response = await pca.acquireTokenSilent({
                scopes: [NAA_SCOPE],
                account: testAccount,
                state: "test-state",
            });
            expect(response?.idToken).not.toBeNull();
            expect(response).toEqual(testTokenResponse);
            expect(setActiveAccountSpy).toHaveBeenCalledTimes(0);
        });

        it("acquireTokenSilent looks for cache first if cache policy prefers it", async () => {
            jest.spyOn(
                NestedAppAuthController.prototype as any,
                "acquireTokenFromCache"
            ).mockResolvedValue(testTokenResponse);

            const activeAccount = {
                homeAccountId: NAA_APP_CONSTANTS.altHomeAccountId,
                localAccountId: NAA_APP_CONSTANTS.altLocalAccountId,
                environment: NAA_APP_CONSTANTS.environment,
                tenantId: NAA_APP_CONSTANTS.tenantId,
                username: NAA_APP_CONSTANTS.altUsername,
            };

            jest.spyOn(
                PublicClientApplication.prototype as any,
                "setActiveAccount"
            ).mockResolvedValue(activeAccount);

            const response = await pca.acquireTokenSilent({
                scopes: [NAA_SCOPE],
                account: testAccount,
                state: "test-state",
                cacheLookupPolicy: CacheLookupPolicy.AccessToken,
            });
            expect(response?.idToken).not.toBeNull();
            expect(response).toEqual(testTokenResponse);
            expect(response.account.localAccountId).toEqual(
                NAA_APP_CONSTANTS.localAccountId
            );
        });

        it("acquireTokenSilent sends the request to bridge if cache policy prefers it", async () => {
            mockBridge.addAuthResultResponse("GetToken", SILENT_TOKEN_RESPONSE);

            const testRequest = {
                scopes: [NAA_SCOPE],
                account: testAccount,
                cacheLookupPolicy: CacheLookupPolicy.Skip,
                correlationId: NAA_CORRELATION_ID,
            };

            const testResponse = nestedAppAuthAdapter.fromNaaTokenResponse(
                nestedAppAuthAdapter.toNaaTokenRequest(testRequest),
                SILENT_TOKEN_RESPONSE,
                0
            );

            const hydrateCacheSpy = jest.spyOn(
                NestedAppAuthController.prototype as any,
                "hydrateCache"
            );

            const response = await pca.acquireTokenSilent(testRequest);

            expect(response.accessToken).toEqual(testResponse.accessToken);
            expect(hydrateCacheSpy).toHaveBeenCalledTimes(1);
        });

        it("acquireTokenSilent ignores cache if forceRefresh is on", async () => {
            mockBridge.addAuthResultResponse("GetToken", SILENT_TOKEN_RESPONSE);

            const testRequest = {
                scopes: [NAA_SCOPE],
                account: testAccount,
                forceRefresh: true,
                correlationId: NAA_CORRELATION_ID,
            };

            const testTokenResponse = nestedAppAuthAdapter.fromNaaTokenResponse(
                nestedAppAuthAdapter.toNaaTokenRequest(testRequest),
                SILENT_TOKEN_RESPONSE,
                0
            );

            const response = await pca.acquireTokenSilent(testRequest);

            expect(response?.idToken).not.toBeNull();
            expect(response.accessToken).toEqual(testTokenResponse.accessToken);
        });

        it("acquireTokenSilent sends the request to bridge if cache misses", async () => {
            mockBridge.addAuthResultResponse("GetToken", SILENT_TOKEN_RESPONSE);
            jest.spyOn(
                NestedAppAuthController.prototype as any,
                "acquireTokenFromCache"
            ).mockResolvedValue(null);

            const testRequest = {
                scopes: [NAA_SCOPE],
                account: testAccount,
                correlationId: NAA_CORRELATION_ID,
            };

            const testResponse = nestedAppAuthAdapter.fromNaaTokenResponse(
                nestedAppAuthAdapter.toNaaTokenRequest(testRequest),
                SILENT_TOKEN_RESPONSE,
                0
            );
            const response = await pca.acquireTokenSilent(testRequest);

            expect(response.accessToken).toEqual(testResponse.accessToken);
        });

        it("acquireTokenSilent sends the request to bridge if request has claims", async () => {
            mockBridge.addAuthResultResponse("GetToken", SILENT_TOKEN_RESPONSE);

            const testRequest = {
                scopes: [NAA_SCOPE],
                account: testAccount,
                claims: JSON.stringify({ token_claims: "testClaims" }),
                correlationId: NAA_CORRELATION_ID,
            };

            const testResponse = nestedAppAuthAdapter.fromNaaTokenResponse(
                nestedAppAuthAdapter.toNaaTokenRequest(testRequest),
                SILENT_TOKEN_RESPONSE,
                0
            );
            const response = await pca.acquireTokenSilent(testRequest);
            expect(response.accessToken).toEqual(testResponse.accessToken);
        });

        it("acquireTokenSilent handles NAA BridgeError and throws MSAL error", async () => {
            mockBridge.addErrorResponse(
                "GetToken",
                BRIDGE_ERROR_PERSISTENT_ERROR_CLIENT
            );

            const testRequest = {
                scopes: [NAA_SCOPE],
                account: testAccount,
                correlationId: NAA_CORRELATION_ID,
            };

            await expect(() =>
                pca.acquireTokenSilent(testRequest)
            ).rejects.toBeInstanceOf(AuthError);
        });

        it("acquireTokenSilent rethrows MSAL errors", async () => {
            mockBridge.addAuthResultResponse("GetToken", SILENT_TOKEN_RESPONSE);
            jest.spyOn(
                NestedAppAuthAdapter.prototype as any,
                "fromNaaTokenResponse"
            ).mockImplementation(() => {
                throw createClientAuthError(
                    ClientAuthErrorCodes.nullOrEmptyToken
                );
            });

            const testRequest = {
                scopes: [NAA_SCOPE],
                account: testAccount,
                correlationId: NAA_CORRELATION_ID,
            };

            await expect(() =>
                pca.acquireTokenSilent(testRequest)
            ).rejects.toMatchObject(
                createClientAuthError(ClientAuthErrorCodes.nullOrEmptyToken)
            );
        });

        it("acquireTokenSilent throws ClientAuthError if access token is empty", async () => {
            mockBridge.addAuthResultResponse("GetToken", {
                ...SILENT_TOKEN_RESPONSE,
                token: {
                    ...SILENT_TOKEN_RESPONSE.token,
                    access_token: "",
                },
            });

            const testRequest = {
                scopes: [NAA_SCOPE],
                account: testAccount,
                correlationId: NAA_CORRELATION_ID,
            };

            await expect(() =>
                pca.acquireTokenSilent(testRequest)
            ).rejects.toMatchObject(
                createClientAuthError(ClientAuthErrorCodes.nullOrEmptyToken)
            );
        });

        it("acquireTokenSilent forwards forceRefresh flag to bridge token params", async () => {
            mockBridge.addAuthResultResponse("GetToken", SILENT_TOKEN_RESPONSE);

            const testRequest = {
                scopes: [NAA_SCOPE],
                account: testAccount,
                forceRefresh: true,
                correlationId: NAA_CORRELATION_ID,
            };

            await pca.acquireTokenSilent(testRequest);

            const bridgeRequest = JSON.parse(
                mockBridge.getBridgeRequests().at(-1)!
            ) as any;
            expect(bridgeRequest.tokenParams?.forceRefresh).toBe(true);
        });

        it("acquireTokenSilent does not set forceRefresh on bridge token params when not provided", async () => {
            mockBridge.addAuthResultResponse("GetToken", SILENT_TOKEN_RESPONSE);

            const testRequest = {
                scopes: [NAA_SCOPE],
                account: testAccount,
                correlationId: NAA_CORRELATION_ID,
                cacheLookupPolicy: CacheLookupPolicy.Skip,
            };

            await pca.acquireTokenSilent(testRequest);

            const bridgeRequest = JSON.parse(
                mockBridge.getBridgeRequests().at(-1)!
            ) as any;
            expect(bridgeRequest.tokenParams?.forceRefresh).toBeUndefined();
        });

        describe("response validation", () => {
            it("acquireTokenSilent derives account fields from idTokenClaims when bridge returns minimal account", async () => {
                // Bridge returns minimal account with only required fields
                const minimalAccountResponse = {
                    token: {
                        ...SILENT_TOKEN_RESPONSE.token,
                    },
                    account: {
                        environment: "login.microsoftonline.com",
                        username: "", // Empty - should be derived from claims
                        // No homeAccountId, localAccountId, tenantId, name, etc.
                    },
                };
                mockBridge.addAuthResultResponse(
                    "GetToken",
                    minimalAccountResponse
                );

                const testRequest = {
                    scopes: [NAA_SCOPE],
                    account: testAccount,
                    correlationId: NAA_CORRELATION_ID,
                    cacheLookupPolicy: CacheLookupPolicy.Skip,
                };

                const response = await pca.acquireTokenSilent(testRequest);

                // Account fields should be derived from idTokenClaims in the token response
                const expectedClaims = SILENT_TOKEN_RESPONSE.account
                    .idTokenClaims as Record<string, unknown>;
                expect(response.account).toBeDefined();
                expect(response.account?.localAccountId).toBe(
                    expectedClaims.oid
                );
                expect(response.account?.tenantId).toBe(expectedClaims.tid);
                expect(response.account?.username).toBe(
                    expectedClaims.preferred_username
                );
                expect(response.account?.name).toBe(expectedClaims.name);
            });

            it("acquireTokenSilent throws error when bridge returns empty environment", async () => {
                const invalidAccountResponse = {
                    token: {
                        ...SILENT_TOKEN_RESPONSE.token,
                    },
                    account: {
                        environment: "", // Empty - should throw
                        username: "test@contoso.com",
                    },
                };
                mockBridge.addAuthResultResponse(
                    "GetToken",
                    invalidAccountResponse
                );

                const testRequest = {
                    scopes: [NAA_SCOPE],
                    account: testAccount,
                    correlationId: NAA_CORRELATION_ID,
                    cacheLookupPolicy: CacheLookupPolicy.Skip,
                };

                await expect(() =>
                    pca.acquireTokenSilent(testRequest)
                ).rejects.toBeInstanceOf(ClientAuthError);
            });
        });

        afterEach(() => {
            jest.restoreAllMocks();
        });

        it("acquireTokenSilent returns cached token when isMcp is true and cachedAccessToken.resource matches request.resource", async () => {
            const resource = "https://resource.example.com";

            const mcpConfig = {
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                    authority: TEST_CONFIG.validAuthority,
                    isMcp: true,
                },
            };

            const mcpPca = await createNestablePublicClientApplication(
                mcpConfig
            );
            const mcpController = (mcpPca as any).controller;

            const accountContext = {
                homeAccountId: testAccount.homeAccountId,
                environment: testAccount.environment,
                tenantId: testAccount.tenantId,
            };
            jest.spyOn(
                mcpController.bridgeProxy,
                "getAccountContext"
            ).mockReturnValue(accountContext);

            const accountManager = require("../../src/cache/AccountManager.js");
            jest.spyOn(accountManager, "getAccount").mockReturnValue(
                testAccount
            );

            const tokenKeys = {
                idToken: ["idTokenKey"],
                accessToken: ["accessTokenKey"],
                refreshToken: [],
                appMetadata: [],
            };
            jest.spyOn(
                mcpController.browserStorage,
                "getTokenKeys"
            ).mockReturnValue(tokenKeys);

            const cachedAccessToken = {
                secret: TEST_TOKENS.ACCESS_TOKEN,
                cachedAt: "1000000000",
                expiresOn: "9999999999",
                resource,
                realm: testAccount.tenantId,
                target: NAA_SCOPE,
            };
            const getAccessTokenSpy = jest
                .spyOn(mcpController.browserStorage, "getAccessToken")
                .mockReturnValue(cachedAccessToken);

            const cachedIdToken = {
                secret: TEST_TOKENS.IDTOKEN_V2,
            };
            jest.spyOn(
                mcpController.browserStorage,
                "getIdToken"
            ).mockReturnValue(cachedIdToken);

            const expectedResult: AuthenticationResult = {
                ...testTokenResponse,
                fromCache: true,
                accessToken: cachedAccessToken.secret,
                idToken: cachedIdToken.secret,
                account: testAccount,
            };
            const toAuthenticationResultFromCacheSpy = jest
                .spyOn(
                    mcpController.nestedAppAuthAdapter,
                    "toAuthenticationResultFromCache"
                )
                .mockReturnValue(expectedResult as any);

            const bridgeGetTokenSilentSpy = jest.spyOn(
                mcpController.bridgeProxy,
                "getTokenSilent"
            );

            const response = await mcpPca.acquireTokenSilent({
                scopes: [NAA_SCOPE],
                account: testAccount,
                resource,
                correlationId: NAA_CORRELATION_ID,
                cacheLookupPolicy: CacheLookupPolicy.AccessToken,
            } as any);

            expect(response).toEqual(expectedResult);
            expect(response.fromCache).toBe(true);
            expect(bridgeGetTokenSilentSpy).not.toHaveBeenCalled();
            expect(getAccessTokenSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    homeAccountId: testAccount.homeAccountId,
                }),
                expect.objectContaining({ resource }),
                tokenKeys,
                testAccount.tenantId
            );
            expect(toAuthenticationResultFromCacheSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    homeAccountId: testAccount.homeAccountId,
                }),
                expect.objectContaining({ secret: cachedIdToken.secret }),
                expect.objectContaining({ resource }),
                expect.objectContaining({ resource }),
                NAA_CORRELATION_ID
            );
        });

        it("acquireTokenSilent falls back to bridge when isMcp is true and cachedAccessToken.resource does not match request.resource", async () => {
            const requestResource = "https://resource.example.com";
            const cachedResource = "https://different-resource.example.com";

            const mcpConfig = {
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                    authority: TEST_CONFIG.validAuthority,
                    isMcp: true,
                },
            };

            const mcpPca = await createNestablePublicClientApplication(
                mcpConfig
            );
            const mcpController = (mcpPca as any).controller;

            const accountContext = {
                homeAccountId: testAccount.homeAccountId,
                environment: testAccount.environment,
                tenantId: testAccount.tenantId,
            };
            jest.spyOn(
                mcpController.bridgeProxy,
                "getAccountContext"
            ).mockReturnValue(accountContext);

            const accountManager = require("../../src/cache/AccountManager.js");
            jest.spyOn(accountManager, "getAccount").mockReturnValue(
                testAccount
            );

            const tokenKeys = {
                idToken: ["idTokenKey"],
                accessToken: ["accessTokenKey"],
                refreshToken: [],
                appMetadata: [],
            };
            jest.spyOn(
                mcpController.browserStorage,
                "getTokenKeys"
            ).mockReturnValue(tokenKeys);

            const cachedAccessToken = {
                secret: TEST_TOKENS.ACCESS_TOKEN,
                cachedAt: "1000000000",
                expiresOn: "9999999999",
                resource: cachedResource,
                realm: testAccount.tenantId,
                target: NAA_SCOPE,
            };
            jest.spyOn(
                mcpController.browserStorage,
                "getAccessToken"
            ).mockReturnValue(cachedAccessToken);

            mockBridge.addAuthResultResponse("GetToken", SILENT_TOKEN_RESPONSE);
            const bridgeGetTokenSilentSpy = jest.spyOn(
                mcpController.bridgeProxy,
                "getTokenSilent"
            );

            await mcpPca.acquireTokenSilent({
                scopes: [NAA_SCOPE],
                account: testAccount,
                resource: requestResource,
                correlationId: NAA_CORRELATION_ID,
                cacheLookupPolicy: CacheLookupPolicy.AccessToken,
            } as any);

            expect(bridgeGetTokenSilentSpy).toHaveBeenCalledTimes(1);
            const bridgeRequest = JSON.parse(
                mockBridge.getBridgeRequests().at(-1)!
            ) as any;
            expect(bridgeRequest.tokenParams?.resource).toBe(requestResource);
        });

        it("acquireTokenSilent falls back to bridge when isMcp is true and cached AT doesn't have a resource", async () => {
            const requestResource = "https://resource.example.com";

            const mcpConfig = {
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                    authority: TEST_CONFIG.validAuthority,
                    isMcp: true,
                },
            };

            const mcpPca = await createNestablePublicClientApplication(
                mcpConfig
            );
            const mcpController = (mcpPca as any).controller;

            const accountContext = {
                homeAccountId: testAccount.homeAccountId,
                environment: testAccount.environment,
                tenantId: testAccount.tenantId,
            };
            jest.spyOn(
                mcpController.bridgeProxy,
                "getAccountContext"
            ).mockReturnValue(accountContext);

            const accountManager = require("../../src/cache/AccountManager.js");
            jest.spyOn(accountManager, "getAccount").mockReturnValue(
                testAccount
            );

            const tokenKeys = {
                idToken: ["idTokenKey"],
                accessToken: ["accessTokenKey"],
                refreshToken: [],
                appMetadata: [],
            };
            jest.spyOn(
                mcpController.browserStorage,
                "getTokenKeys"
            ).mockReturnValue(tokenKeys);

            const cachedAccessToken = {
                secret: TEST_TOKENS.ACCESS_TOKEN,
                cachedAt: "1000000000",
                expiresOn: "9999999999",
                realm: testAccount.tenantId,
                target: NAA_SCOPE,
            };
            jest.spyOn(
                mcpController.browserStorage,
                "getAccessToken"
            ).mockReturnValue(cachedAccessToken);

            mockBridge.addAuthResultResponse("GetToken", SILENT_TOKEN_RESPONSE);
            const bridgeGetTokenSilentSpy = jest.spyOn(
                mcpController.bridgeProxy,
                "getTokenSilent"
            );

            await mcpPca.acquireTokenSilent({
                scopes: [NAA_SCOPE],
                account: testAccount,
                resource: requestResource,
                correlationId: NAA_CORRELATION_ID,
                cacheLookupPolicy: CacheLookupPolicy.AccessToken,
            } as any);

            expect(bridgeGetTokenSilentSpy).toHaveBeenCalledTimes(1);
            const bridgeRequest = JSON.parse(
                mockBridge.getBridgeRequests().at(-1)!
            ) as any;
            expect(bridgeRequest.tokenParams?.resource).toBe(requestResource);
        });
    });

    describe("Performance telemetry with accountInfo", () => {
        let localPca: IPublicClientApplication;
        let performanceClient: any;
        let mockBridge: MockBridge;

        beforeEach(async () => {
            jest.clearAllMocks();

            // Set up mock bridge
            mockBridge = window.nestedAppAuthBridge as MockBridge;

            // Create config with BrowserPerformanceClient like the working tests
            const config = {
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                },
                telemetry: {
                    client: new (require("../../src/telemetry/BrowserPerformanceClient.js").BrowserPerformanceClient)(
                        {
                            auth: { clientId: TEST_CONFIG.MSAL_CLIENT_ID },
                            system: { loggerOptions: {} },
                        }
                    ),
                },
            };

            localPca = await createNestablePublicClientApplication(config);
            performanceClient = config.telemetry.client;
        });

        it("should pass account to measurement.end() in acquireTokenPopup", async () => {
            const testAccount: AccountInfo = {
                homeAccountId: "test-home-account-id",
                localAccountId: "test-local-account-id",
                environment: "login.microsoftonline.com",
                tenantId: "test-tenant-id",
                username: "test@example.com",
            };

            const testRequest = {
                scopes: ["user.read"],
                account: testAccount,
            };

            // Mock measurement object with end method
            const mockMeasurement = {
                end: jest.fn().mockReturnValue({}),
                discard: jest.fn(),
                add: jest.fn(),
                increment: jest.fn(),
                event: {
                    eventId: "test-event-id",
                    status: "InProgress" as any,
                    authority: TEST_CONFIG.validAuthority,
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                    correlationId: RANDOM_TEST_GUID,
                    name: "test-event",
                    startTimeMs: Date.now(),
                    libraryName: "msal-browser",
                    libraryVersion: "test-version",
                },
                measurement: {},
            };

            // Spy on startMeasurement to return our mock measurement
            jest.spyOn(performanceClient, "startMeasurement").mockReturnValue(
                mockMeasurement as any
            );

            // Mock the bridge response for interactive token request
            mockBridge.addAuthResultResponse("GetTokenPopup", {
                ...SILENT_TOKEN_RESPONSE,
                account: {
                    ...SILENT_TOKEN_RESPONSE.account,
                    homeAccountId: testAccount.homeAccountId,
                    localAccountId: testAccount.localAccountId,
                    environment: testAccount.environment,
                    tenantId: testAccount.tenantId,
                    username: testAccount.username,
                },
            });

            const result = await localPca.acquireTokenPopup(testRequest);

            // Verify measurement.end was called with account parameter
            expect(mockMeasurement.end).toHaveBeenCalledWith(
                expect.objectContaining({ success: true }),
                undefined,
                expect.objectContaining({
                    homeAccountId: testAccount.homeAccountId,
                    localAccountId: testAccount.localAccountId,
                    environment: testAccount.environment,
                    tenantId: testAccount.tenantId,
                    username: testAccount.username,
                })
            );

            expect(result).toBeDefined();
            expect(result.account).toBeDefined();
        });

        it("should pass account to measurement.end() in acquireTokenSilent", async () => {
            const testAccount: AccountInfo = {
                homeAccountId: "test-home-account-id",
                localAccountId: "test-local-account-id",
                environment: "login.microsoftonline.com",
                tenantId: "test-tenant-id",
                username: "test@example.com",
            };

            const silentRequest = {
                scopes: ["user.read"],
                account: testAccount,
            };

            // Mock measurement object with end method
            const mockMeasurement = {
                end: jest.fn().mockReturnValue({}),
                discard: jest.fn(),
                add: jest.fn(),
                increment: jest.fn(),
                event: {
                    eventId: "test-event-id",
                    status: "InProgress" as any,
                    authority: TEST_CONFIG.validAuthority,
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                    correlationId: RANDOM_TEST_GUID,
                    name: "test-event",
                    startTimeMs: Date.now(),
                    libraryName: "msal-browser",
                    libraryVersion: "test-version",
                },
                measurement: {},
            };

            // Spy on startMeasurement to return our mock measurement
            jest.spyOn(performanceClient, "startMeasurement").mockReturnValue(
                mockMeasurement as any
            );

            // Mock the bridge response for silent token request
            mockBridge.addAuthResultResponse("GetToken", {
                ...SILENT_TOKEN_RESPONSE,
                account: {
                    ...SILENT_TOKEN_RESPONSE.account,
                    homeAccountId: testAccount.homeAccountId,
                    localAccountId: testAccount.localAccountId,
                    environment: testAccount.environment,
                    tenantId: testAccount.tenantId,
                    username: testAccount.username,
                },
            });

            const result = await localPca.acquireTokenSilent(silentRequest);

            // Verify measurement.end was called with account parameter
            expect(mockMeasurement.end).toHaveBeenCalledWith(
                expect.objectContaining({ success: true }),
                undefined,
                expect.objectContaining({
                    homeAccountId: testAccount.homeAccountId,
                    localAccountId: testAccount.localAccountId,
                    environment: testAccount.environment,
                    tenantId: testAccount.tenantId,
                    username: testAccount.username,
                })
            );

            expect(result).toBeDefined();
            expect(result.account).toBeDefined();
        });

        it("should not pass account when account is not provided in request", async () => {
            const silentRequest = {
                scopes: ["user.read"],
                // No account provided
            };

            // Mock measurement object with end method
            const mockMeasurement = {
                end: jest.fn().mockReturnValue({}),
                discard: jest.fn(),
                add: jest.fn(),
                increment: jest.fn(),
                event: {
                    eventId: "test-event-id",
                    status: "InProgress" as any,
                    authority: TEST_CONFIG.validAuthority,
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                    correlationId: RANDOM_TEST_GUID,
                    name: "test-event",
                    startTimeMs: Date.now(),
                    libraryName: "msal-browser",
                    libraryVersion: "test-version",
                },
                measurement: {},
            };

            // Spy on startMeasurement to return our mock measurement
            jest.spyOn(performanceClient, "startMeasurement").mockReturnValue(
                mockMeasurement as any
            );

            // Mock the bridge response for silent token request without account in request
            mockBridge.addAuthResultResponse("GetToken", SILENT_TOKEN_RESPONSE);

            const result = await localPca.acquireTokenSilent(silentRequest);

            // Verify measurement.end was called without account parameter (undefined as third argument)
            // We expect the successful call to have the account as undefined since request.account was undefined
            const successfulCalls = mockMeasurement.end.mock.calls.filter(
                (call) => call[0] && call[0].success === true
            );
            expect(successfulCalls.length).toBeGreaterThan(0);

            // At least one successful call should have undefined as the third parameter (account)
            const callWithUndefinedAccount = successfulCalls.find(
                (call) => call[2] === undefined
            );
            expect(callWithUndefinedAccount).toBeDefined();

            expect(result).toBeDefined();
        });

        afterEach(() => {
            jest.restoreAllMocks();
        });
    });

    describe("getAccount tests", () => {
        it("should not return cached account A when searching for account B by login hint", async () => {
            // Setup: Account A cached but no idToken or idTokenClaims
            const cachedAccountA: AccountInfo = {
                homeAccountId: "account-a-home-id",
                localAccountId: "account-a-local-id",
                environment: "login.microsoftonline.com",
                tenantId: "tenant-id",
                username: "userA@contoso.com",
                loginHint: "userA@contoso.com",
            };

            // Account B that we're searching for (not cached)
            const searchLoginHintB = "userB@contoso.com";

            // Mock the browser storage to return account A
            const cacheManager = (pca as any).controller.browserStorage;
            jest.spyOn(cacheManager, "getAccountKeys").mockReturnValue([
                "account-a-key",
            ]);

            const accountEntityA = {
                homeAccountId: cachedAccountA.homeAccountId,
                localAccountId: cachedAccountA.localAccountId,
                environment: cachedAccountA.environment,
                realm: cachedAccountA.tenantId,
                username: cachedAccountA.username,
                loginHint: cachedAccountA.loginHint,
                authorityType: "MSSTS",
                clientInfo: "",
                tenantProfiles: [],
            };

            jest.spyOn(cacheManager, "getAccount").mockReturnValue(
                accountEntityA
            );

            // Mock that there are no ID tokens for account A (simulating no idToken or idTokenClaims)
            jest.spyOn(cacheManager, "getTokenKeys").mockReturnValue({
                idToken: [], // No ID tokens
                accessToken: [],
                refreshToken: [],
                appMetadata: [],
            });

            jest.spyOn(cacheManager, "getIdTokenCredential").mockReturnValue(
                null
            );

            // Call getAccount with login hint for account B
            const result = pca.getAccount({
                loginHint: searchLoginHintB,
            });

            // Result should be null since account A doesn't match the login hint for account B
            expect(result).toBeNull();
        });
    });
});
