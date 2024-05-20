import sinon from "sinon";
import { NestedAppAuthController } from "../../src/controllers/NestedAppAuthController";
import {
    PublicClientApplication,
    createNestablePublicClientApplication,
} from "../../src/app/PublicClientApplication";
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
} from "../../src";
import { buildConfiguration } from "../../src/config/Configuration";
import { TEST_CONFIG } from "../utils/StringConstants";
import { IBridgeProxy } from "../../src/naa/IBridgeProxy";
import MockBridge from "../naa/MockBridge";
import {
    INIT_CONTEXT_RESPONSE,
    SILENT_TOKEN_REQUEST,
    SILENT_TOKEN_RESPONSE,
} from "../naa/BridgeProxyConstants";
import BridgeProxy from "../../src/naa/BridgeProxy";
import { StandardController } from "../../src/controllers/StandardController";
import { NestedAppAuthAdapter } from "../../src/naa/mapping/NestedAppAuthAdapter";
import { NestedAppOperatingContext } from "../../src/operatingcontext/NestedAppOperatingContext";

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

        sinon
            .stub(NestedAppOperatingContext.prototype, "getBridgeProxy")
            .returns(bridgeProxy);

        sinon
            .stub(NestedAppOperatingContext.prototype, "isAvailable")
            .returns(true);

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
        sinon.restore();
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
            done();
        });
    });

    // describe("acquireToken Silent", () => {
    //     it("acquireTokenSilent", async () => {
    //         let tokenRequest: SilentRequest = {
    //             scopes: ["User.Read"],
    //         };

    //         mockBridge.addAuthResultResponse(
    //             "GetTokenPopup",
    //             SILENT_TOKEN_RESPONSE
    //         );
    //         const response = await bridgeProxy.getTokenInteractive(
    //             SILENT_TOKEN_REQUEST
    //         );

    //         expect(response).not.toBeNull();
    //         expect(response.token.access_token).toBe("this.isan.accesstoken");

    //         const naaAdapater = sinon.createStubInstance(NestedAppAuthAdapter);
    //         const account: AccountInfo = naaAdapater.fromNaaAccountInfo(
    //             response.account
    //         );

    //         const request: SilentRequest = {
    //             ...tokenRequest,
    //             account,
    //         };

    //         const response2 = await pca.acquireTokenSilent(request);
    //         expect(response2).not.toBeNull();
    //         expect(response2.accessToken).toBe("this.isan.accesstoken");
    //     });
    // });
});
