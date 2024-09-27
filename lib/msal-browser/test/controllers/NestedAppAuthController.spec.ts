import { NestedAppAuthController } from "../../src/controllers/NestedAppAuthController.js";
import {
    PublicClientApplication,
    createNestablePublicClientApplication,
} from "../../src/app/PublicClientApplication.js";
import {
    AccountInfo,
    AuthorityMetadataEntity,
    CacheHelpers,
    CacheManager,
    LogLevel,
    Logger,
} from "@azure/msal-common";
import {
    BrowserCacheLocation,
    Configuration,
    IPublicClientApplication,
    SilentRequest,
} from "../../src/index.js";
import { buildConfiguration } from "../../src/config/Configuration.js";
import { TEST_CONFIG } from "../utils/StringConstants.js";
import { IBridgeProxy } from "../../src/naa/IBridgeProxy.js";
import MockBridge from "../naa/MockBridge.js";
import {
    INIT_CONTEXT_RESPONSE,
    SILENT_TOKEN_REQUEST,
    SILENT_TOKEN_RESPONSE,
} from "../naa/BridgeProxyConstants.js";
import BridgeProxy from "../../src/naa/BridgeProxy.js";

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
});
