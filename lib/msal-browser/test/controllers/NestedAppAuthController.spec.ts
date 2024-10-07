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
} from "@azure/msal-common";
import {
    AuthenticationScheme,
    BrowserCacheLocation,
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
    INIT_CONTEXT_RESPONSE,
    NAA_APP_CONSTANTS,
    NAA_AUTHORITY,
    NAA_CLIENT_CAPABILITIES,
    NAA_CLIENT_ID,
    NAA_SCOPE,
    SILENT_TOKEN_REQUEST,
    SILENT_TOKEN_RESPONSE,
} from "../naa/BridgeProxyConstants.js";
import BridgeProxy from "../../src/naa/BridgeProxy.js";
import { NestedAppAuthAdapter } from "../../src/naa/mapping/NestedAppAuthAdapter.js";
import { CryptoOps } from "../../src/crypto/CryptoOps.js";


const cacheConfig = {
    temporaryCacheLocation: BrowserCacheLocation.SessionStorage,
    cacheLocation: BrowserCacheLocation.SessionStorage,
    storeAuthStateInCookie: false,
    secureCookies: false,
    cacheMigrationEnabled: false,
    claimsBasedCachingEnabled: false,
};

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
            done();
        });
    });

    describe("acquireTokenSilent tests", () => {
        it("acquireTokenSilent calls acquireTokenFromCache", async () => {
            const testAccount: AccountInfo = {
                homeAccountId: NAA_APP_CONSTANTS.homeAccountId,
                localAccountId: NAA_APP_CONSTANTS.localAccountId,
                environment: NAA_APP_CONSTANTS.environment,
                tenantId: NAA_APP_CONSTANTS.tenantId,
                username: NAA_APP_CONSTANTS.username,
            };

            const testTokenResponse: AuthenticationResult = {
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

            jest.spyOn(
                NestedAppAuthController.prototype as any,
                // @ts-ignore
                "acquireTokenFromCache"
            ).mockResolvedValue(testTokenResponse);

            const response = await pca.acquireTokenSilent({
                scopes: [NAA_SCOPE],
                account: testAccount,
                state: "test-state",
            });
            expect(response?.idToken).not.toBeNull();
            expect(response).toEqual(testTokenResponse);
        });
    });

    it("acquireTokenSilent sends the request to bridge if cache errors", async () => {});

    it("acquireTokenSilent prefers bridge account context", async () => {});

    it("acquireTokenSilent fails cache lookup if request", async () => {});

    it("acquireTokenSilent sends the request to bridge if access_token is expired", async () => {});

    it("acquireTokenSilent sends the request to bridge if access_token is not found in the cache", async () => {});

    it("acquireTokenSilent looks for cache first if cache policy prefers it", async () => {});

    it("acquireTokenSilent sends the request to bridge if cache policy prefers it", async () => {});
});
