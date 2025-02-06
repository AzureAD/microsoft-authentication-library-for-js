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
    LogLevel,
    Logger,
    createClientAuthError,
} from "@azure/msal-common";
import {
    AuthenticationScheme,
    AuthError,
    BrowserCacheLocation,
    CacheLookupPolicy,
    ClientAuthErrorCodes,
    Configuration,
    IPublicClientApplication,
    SilentRequest,
} from "../../src/index.js";
import { buildConfiguration } from "../../src/config/Configuration.js";
import {
    RANDOM_TEST_GUID,
    TEST_CONFIG,
    TEST_DATA_CLIENT_INFO,
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
    SILENT_TOKEN_REQUEST,
    SILENT_TOKEN_RESPONSE,
} from "../naa/BridgeProxyConstants.js";
import BridgeProxy from "../../src/naa/BridgeProxy.js";
import { NestedAppAuthAdapter } from "../../src/naa/mapping/NestedAppAuthAdapter.js";
import { CryptoOps } from "../../src/crypto/CryptoOps.js";
import exp from "constants";

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

        createNestablePublicClientApplication(config).then((result) => {
            pca = result;
        });

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
                expiresOn: new Date(Date.now() + 3600000),
                account: testAccount,
                tokenType: AuthenticationScheme.BEARER,
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

        afterEach(() => {
            jest.restoreAllMocks();
        });
    });
});
