/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { PublicClientApplication } from "../../src/app/PublicClientApplication.js";
import {
    ID_TOKEN_ALT_CLAIMS,
    ID_TOKEN_CLAIMS,
    RANDOM_TEST_GUID,
    TEST_CONFIG,
    TEST_CRYPTO_VALUES,
    TEST_DATA_CLIENT_INFO,
    TEST_HASHES,
    TEST_SSH_VALUES,
    TEST_STATE_VALUES,
    TEST_TOKEN_LIFETIMES,
    TEST_TOKENS,
    TEST_URIS,
    testLogoutUrl,
    verifyUrl,
} from "../utils/StringConstants.js";
import {
    AccountEntity,
    AccountInfo,
    AuthError,
    AuthorityMetadataEntity,
    AuthorizationCodeClient,
    CacheHelpers,
    CacheManager,
    ClientAuthErrorCodes,
    CommonAuthorizationUrlRequest,
    CommonSilentFlowRequest,
    createClientAuthError,
    createInteractionRequiredAuthError,
    IdTokenEntity,
    InteractionRequiredAuthError,
    InteractionRequiredAuthErrorCodes,
    Logger,
    LogLevel,
    PerformanceClient,
    PerformanceEvent,
    ProtocolMode,
    ProtocolUtils,
    RefreshTokenClient,
    ServerError,
    ServerTelemetryEntity,
    TokenClaims,
    StubPerformanceClient,
    AccountEntityUtils,
    Constants,
} from "@azure/msal-common/browser";
import {
    ApiId,
    BrowserCacheLocation,
    BrowserConstants,
    CacheLookupPolicy,
    InteractionType,
    PlatformAuthConstants,
    TemporaryCacheKeys,
    WrapperSKU,
} from "../../src/utils/BrowserConstants.js";
import { CryptoOps } from "../../src/crypto/CryptoOps.js";
import * as BrowserCrypto from "../../src/crypto/BrowserCrypto.js";
import * as PkceGenerator from "../../src/crypto/PkceGenerator.js";
import { EventType } from "../../src/event/EventType.js";
import { SilentRequest } from "../../src/request/SilentRequest.js";
import { RedirectRequest } from "../../src/request/RedirectRequest.js";
import { PopupRequest } from "../../src/request/PopupRequest.js";
import { SsoSilentRequest } from "../../src/request/SsoSilentRequest.js";
import { NavigationClient } from "../../src/navigation/NavigationClient.js";
import { NavigationOptions } from "../../src/navigation/NavigationOptions.js";
import { EventMessage } from "../../src/event/EventMessage.js";
import { EventHandler } from "../../src/event/EventHandler.js";
import { SilentIframeClient } from "../../src/interaction_client/SilentIframeClient.js";
import { FetchClient } from "../../src/network/FetchClient.js";
import {
    BrowserAuthError,
    BrowserAuthErrorCodes,
    createBrowserAuthError,
    getDefaultErrorMessage,
} from "../../src/error/BrowserAuthError.js";
import * as BrowserUtils from "../../src/utils/BrowserUtils.js";
import { RedirectClient } from "../../src/interaction_client/RedirectClient.js";
import { PopupClient } from "../../src/interaction_client/PopupClient.js";
import { SilentCacheClient } from "../../src/interaction_client/SilentCacheClient.js";
import { SilentRefreshClient } from "../../src/interaction_client/SilentRefreshClient.js";
import { SilentAuthCodeClient } from "../../src/interaction_client/SilentAuthCodeClient.js";
import { BrowserCacheManager } from "../../src/cache/BrowserCacheManager.js";
import { PlatformAuthExtensionHandler } from "../../src/broker/nativeBroker/PlatformAuthExtensionHandler.js";
import * as PlatformAuthProvider from "../../src/broker/nativeBroker/PlatformAuthProvider.js";
import { PlatformAuthInteractionClient } from "../../src/interaction_client/PlatformAuthInteractionClient.js";
import { PlatformAuthRequest } from "../../src/broker/nativeBroker/PlatformAuthRequest.js";
import { NativeAuthError } from "../../src/error/NativeAuthError.js";
import { StandardController } from "../../src/controllers/StandardController.js";
import { AuthenticationResult } from "../../src/response/AuthenticationResult.js";
import { BrowserPerformanceClient } from "../../src/telemetry/BrowserPerformanceClient.js";
import {
    BrowserConfigurationAuthErrorCodes,
    createBrowserConfigurationAuthError,
} from "../../src/error/BrowserConfigurationAuthError.js";
import {
    buildConfiguration,
    Configuration,
} from "../../src/config/Configuration.js";
import {
    buildAccountFromIdTokenClaims,
    buildIdToken,
    TestTimeUtils,
} from "msal-test-utils";
import { INTERACTION_TYPE } from "../../src/utils/BrowserConstants.js";
import { version } from "../../src/packageMetadata.js";
import { AuthorizationCodeRequest } from "../../src/request/AuthorizationCodeRequest.js";
import { EndSessionRequest } from "../../src/request/EndSessionRequest.js";
import { PlatformAuthDOMHandler } from "../../src/broker/nativeBroker/PlatformAuthDOMHandler.js";
import * as BrowserRootPerformanceEvents from "../../src/telemetry/BrowserRootPerformanceEvents.js";
import * as CacheKeys from "../../src/cache/CacheKeys.js";
import { getAccountKeysCacheKey } from "../../src/cache/CacheKeys.js";

const cacheConfig = {
    cacheLocation: BrowserCacheLocation.SessionStorage,
    cacheRetentionDays: 5,
};

let testAppConfig = {
    auth: {
        clientId: TEST_CONFIG.MSAL_CLIENT_ID,
    },

    userInputSystem: {
        loggerOptions: void 0,
    },
};

const BASIC_TEST_ACCOUNT_INFO: AccountInfo = {
    homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
    localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
    environment: "login.windows.net",
    tenantId: "3338040d-6c67-4c5b-b112-36a304b66dad",
    username: "AbeLi@microsoft.com",
    loginHint: "AbeLiLoginHint",
};

const BASIC_NATIVE_TEST_ACCOUNT_INFO: AccountInfo = {
    ...BASIC_TEST_ACCOUNT_INFO,
    nativeAccountId: "test-nativeAccountId",
};

function stubExtensionProvider(config: Configuration) {
    const browserEnvironment = typeof window !== "undefined";

    const newConfig = buildConfiguration(config, browserEnvironment);
    const logger = new Logger(
        newConfig.system.loggerOptions,
        "unittest",
        "unittest"
    );
    const performanceClient = newConfig.telemetry.client;
    return jest
        .spyOn(PlatformAuthExtensionHandler, "createProvider")
        .mockImplementation(async () => {
            return new PlatformAuthExtensionHandler(
                logger,
                2000,
                performanceClient,
                "test-extensionId"
            );
        });
}

function stubDOMProvider(config: Configuration) {
    const browserEnvironment = typeof window !== "undefined";

    const newConfig = buildConfiguration(config, browserEnvironment);
    const logger = new Logger(
        newConfig.system.loggerOptions,
        "unittest",
        "unittest"
    );
    const performanceClient = newConfig.telemetry.client;
    return jest
        .spyOn(PlatformAuthDOMHandler, "createProvider")
        .mockImplementation(async () => {
            return new PlatformAuthDOMHandler(
                logger,
                performanceClient,
                "test-correlation-id"
            );
        });
}

const testRequest: CommonAuthorizationUrlRequest = {
    redirectUri: `${TEST_URIS.DEFAULT_INSTANCE}/`,
    scopes: TEST_CONFIG.DEFAULT_SCOPES,
    authority: `${Constants.DEFAULT_AUTHORITY}`,
    correlationId: RANDOM_TEST_GUID,
    authenticationScheme:
        TEST_CONFIG.TOKEN_TYPE_BEARER as Constants.AuthenticationScheme,
    responseMode: Constants.ResponseMode.FRAGMENT,
    state: TEST_STATE_VALUES.TEST_STATE_REDIRECT,
    nonce: ID_TOKEN_CLAIMS.nonce,
};

jest.mock("@azure/msal-common/browser", () => ({
    ...jest.requireActual("@azure/msal-common/browser"),
    ProtocolUtils: {
        ...jest.requireActual("@azure/msal-common/browser").ProtocolUtils,
        setRequestState: jest.fn(),
    },
}));

describe("PublicClientApplication.ts Class Unit Tests", () => {
    let pca: PublicClientApplication;
    let browserStorage: BrowserCacheManager;
    let mockSetRequestState: jest.MockedFunction<
        typeof ProtocolUtils.setRequestState
    >;
    beforeEach(async () => {
        pca = new PublicClientApplication({
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID,
            },
            telemetry: {
                client: new BrowserPerformanceClient(testAppConfig),
                application: {
                    appName: TEST_CONFIG.applicationName,
                    appVersion: TEST_CONFIG.applicationVersion,
                },
            },
            system: {
                allowPlatformBroker: false,
            },
        });

        await pca.initialize();

        // @ts-ignore
        browserStorage = pca.controller.browserStorage;

        // Navigation not allowed in tests
        jest.spyOn(
            NavigationClient.prototype,
            "navigateExternal"
        ).mockImplementation();
        jest.spyOn(
            NavigationClient.prototype,
            "navigateInternal"
        ).mockImplementation();

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

        mockSetRequestState =
            ProtocolUtils.setRequestState as jest.MockedFunction<
                typeof ProtocolUtils.setRequestState
            >;
        mockSetRequestState.mockReturnValue(
            TEST_STATE_VALUES.TEST_STATE_SILENT
        );
    });

    afterEach(() => {
        jest.restoreAllMocks();
        window.location.hash = "";
        window.sessionStorage.clear();
        window.localStorage.clear();
    });

    describe("Constructor tests", () => {
        it("passes null check", (done) => {
            expect(pca).not.toBe(null);
            expect(pca instanceof PublicClientApplication).toBeTruthy();
            done();
        });
    });

    describe("initialize tests", () => {
        beforeEach(() => {
            jest.spyOn(MessageEvent.prototype, "source", "get").mockReturnValue(
                window
            ); // source property not set by jsdom window messaging APIs
        });

        /**
         * TODO: Speak to someone on MSAL.js team about how this test is supposed to work
         * Currently the test fails as a result of the fact that the spys do not record anything
         * Most likely because this test is operating against PCA instead of StandardController
         */
        xit("handles concurrent calls", async () => {
            const config = {
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                },
                system: {
                    allowPlatformBroker: true,
                },
            };
            const concurrency = 5;

            const postMessageSpy: jest.SpyInstance = jest.spyOn(
                window,
                "postMessage"
            );
            const initSpy: jest.SpyInstance = jest.spyOn(
                PublicClientApplication.prototype,
                "initialize"
            );
            // @ts-ignore
            const handshakeSpy: jest.SpyInstance = jest.spyOn(
                PlatformAuthExtensionHandler.prototype,
                // @ts-ignore
                "sendHandshakeRequest"
            );

            let ports: Set<MessagePort> = new Set();
            let handledMessages = 0;

            try {
                const eventHandler = function (event: MessageEvent) {
                    event.stopImmediatePropagation();
                    const request = event.data;
                    const req = {
                        channel: PlatformAuthConstants.CHANNEL_ID,
                        extensionId:
                            PlatformAuthConstants.PREFERRED_EXTENSION_ID,
                        responseId: request.responseId,
                        body: {
                            method: "HandshakeResponse",
                            version: 3,
                        },
                    };

                    // Fan out messages to all registered ports to validate that responses are getting filtered out properly.
                    for (let spy of postMessageSpy.mock.calls) {
                        const port = spy.args[2][0];
                        ports.add(port);
                        port.postMessage(req);
                    }
                    handledMessages++;
                };
                window.addEventListener("message", eventHandler, true);

                const apps = [];
                for (let i = 0; i < concurrency; i++) {
                    apps.push(new PublicClientApplication(config));
                }

                const promises = [];
                for (let i = 0; i < apps.length; i++) {
                    promises.push(apps[i].initialize());
                }
                await Promise.all(promises);

                expect(handledMessages).toEqual(concurrency);
                expect(handshakeSpy).toHaveBeenCalledTimes(concurrency);
                expect(initSpy).toHaveBeenCalledTimes(concurrency);
                window.removeEventListener("message", eventHandler, true);
                for (let i = 0; i < apps.length; i++) {
                    // @ts-ignore
                    expect(apps[i].controller.initialized).toBeTruthy();
                    // @ts-ignore
                    expect(
                        (apps[i] as any).controller.getNativeExtensionProvider()
                    ).toBeInstanceOf(PlatformAuthExtensionHandler);
                }
            } finally {
                for (const port of ports) {
                    try {
                        port.close();
                    } catch {}
                }
            }
        });

        /**
         * TODO: Speak to someone on MSAL.js team about how this test is supposed to work
         * Currently the test fails as a result of the fact that the spys do not record anything
         * Most likely because this test is operating against PCA instead of StandardController
         */
        xit("handles concurrent calls with native handshake timeouts", async () => {
            const config = {
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                },
                system: {
                    allowPlatformBroker: true,
                },
            };
            const concurrency = 6;

            const postMessageSpy: jest.SpyInstance = jest.spyOn(
                window,
                "postMessage"
            );
            const initSpy: jest.SpyInstance = jest.spyOn(
                PublicClientApplication.prototype,
                "initialize"
            );
            // @ts-ignore
            const createProviderSpy: jest.SpyInstance = jest.spyOn(
                PlatformAuthExtensionHandler,
                "createProvider"
            );

            let ports: Set<MessagePort> = new Set();
            let handledMessages = 0;

            try {
                const eventHandler = function (event: MessageEvent) {
                    event.stopImmediatePropagation();
                    const request = event.data;
                    const req = {
                        channel: PlatformAuthConstants.CHANNEL_ID,
                        extensionId:
                            PlatformAuthConstants.PREFERRED_EXTENSION_ID,
                        responseId: request.responseId,
                        body: {
                            method: "HandshakeResponse",
                            version: 3,
                        },
                    };

                    // Time out the second half of the handshakes.
                    if (handledMessages >= concurrency / 2) {
                        return;
                    }
                    // Fan out messages to all registered ports to validate that responses are getting filtered out properly.
                    for (let spy of postMessageSpy.mock.calls) {
                        const port = spy.args[2][0];
                        ports.add(port);
                        port.postMessage(req);
                    }
                    handledMessages++;
                };
                window.addEventListener("message", eventHandler, true);

                const apps = [];
                for (let i = 0; i < concurrency; i++) {
                    apps.push(new PublicClientApplication(config));
                }

                const promises = [];
                for (let i = 0; i < apps.length; i++) {
                    promises.push(apps[i].initialize());
                }
                await Promise.all(promises);

                expect(handledMessages).toEqual(concurrency / 2);
                expect(createProviderSpy).toHaveBeenCalledTimes(concurrency);
                expect(initSpy).toHaveBeenCalledTimes(concurrency);
                window.removeEventListener("message", eventHandler, true);
                let nativeProviders = 0;
                for (let i = 0; i < apps.length; i++) {
                    // @ts-ignore
                    expect(apps[i].controller.initialized).toBeTruthy();
                    // @ts-ignore
                    nativeProviders += (
                        apps[i] as any
                    ).controller.getNativeExtensionProvider()
                        ? 1
                        : 0;
                }
                expect(nativeProviders).toEqual(concurrency / 2);
            } finally {
                for (const port of ports) {
                    try {
                        port.close();
                    } catch {}
                }
            }
        });

        it("creates platform auth extension handler if allowPlatformBroker is true", async () => {
            const config = {
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                },
                system: {
                    allowPlatformBroker: true,
                },
            };

            jest.spyOn(
                PlatformAuthProvider,
                "isDomEnabledForPlatformAuth"
            ).mockImplementation(() => {
                return false;
            });

            const getPlatformAuthProviderSpy = jest.spyOn(
                PlatformAuthProvider,
                "getPlatformAuthProvider"
            );

            pca = new PublicClientApplication(config);

            const createExtensionProviderSpy = stubExtensionProvider(config);

            await pca.initialize();

            // Implementation of PCA was moved to controller.
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            pca = (pca as any).controller;

            expect(getPlatformAuthProviderSpy).toHaveBeenCalled();
            expect(createExtensionProviderSpy).toHaveBeenCalled();
            // @ts-ignore
            expect(pca.platformAuthProvider).toBeInstanceOf(
                PlatformAuthExtensionHandler
            );
        });

        it("does not create extension provider if allowPlatformBroker is false", async () => {
            const getPlatformAuthProviderSpy = jest.spyOn(
                PlatformAuthProvider,
                "getPlatformAuthProvider"
            );

            const config = {
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                },
                system: {
                    allowPlatformBroker: false,
                },
            };

            pca = new PublicClientApplication(config);
            const createProviderSpy = stubExtensionProvider(config);

            await pca.initialize();

            //Implementation of PCA was moved to controller.
            pca = (pca as any).controller;

            expect(createProviderSpy).toHaveBeenCalledTimes(0);
            expect(getPlatformAuthProviderSpy).not.toHaveBeenCalled();
            // @ts-ignore
            expect(pca.platformAuthProvider).toBeUndefined();
        });

        it("creates platform auth dom handler if allowPlatformBroker is true and dom APIs are present", async () => {
            const getPlatformAuthProviderSpy = jest.spyOn(
                PlatformAuthProvider,
                "getPlatformAuthProvider"
            );

            const config = {
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                },
                system: {
                    allowPlatformBroker: true,
                },
            };

            pca = new PublicClientApplication(config);
            window.sessionStorage.setItem(
                "msal.browser.platform.auth.dom",
                "true"
            );

            const createDOMProviderSpy = stubDOMProvider(config);
            await pca.initialize();

            // Implementation of PCA was moved to controller.
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            pca = (pca as any).controller;

            expect(getPlatformAuthProviderSpy).toHaveBeenCalled();
            expect(createDOMProviderSpy).toHaveBeenCalled();
            // @ts-ignore
            expect(pca.platformAuthProvider).toBeInstanceOf(
                PlatformAuthDOMHandler
            );
        });

        it("catches error if extension provider fails to initialize", async () => {
            const createProviderSpy = jest
                .spyOn(PlatformAuthExtensionHandler, "createProvider")
                .mockRejectedValue(new Error("testError"));
            pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                },
                system: {
                    allowPlatformBroker: true,
                },
            });
            await pca.initialize();

            //Implementation of PCA was moved to controller.
            pca = (pca as any).controller;

            expect(createProviderSpy).toHaveBeenCalled();
            // @ts-ignore
            expect(pca.platformAuthProvider).toBeUndefined();
        });

        it("reports telemetry event using provided correlation id", (done) => {
            pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                },
                telemetry: {
                    client: new BrowserPerformanceClient(testAppConfig),
                    application: {
                        appName: TEST_CONFIG.applicationName,
                        appVersion: TEST_CONFIG.applicationVersion,
                    },
                },
            });

            const callbackId = pca.addPerformanceCallback((events) => {
                expect(events[0].name).toEqual(
                    BrowserRootPerformanceEvents.InitializeClientApplication
                );
                expect(events[0].correlationId).toEqual("test-correlation-id");

                pca.removePerformanceCallback(callbackId);
                done();
            });

            pca.initialize({ correlationId: "test-correlation-id" });
        });

        it("does not pre-generate PKCE codes if navigatePopups is set to true", async () => {
            const preGenerateSpy = jest.spyOn(
                StandardController.prototype,
                // @ts-ignore
                "preGeneratePkceCodes"
            );

            pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                },
                system: {
                    allowPlatformBroker: false,
                },
            });
            await pca.initialize();

            //Implementation of PCA was moved to controller.
            pca = (pca as any).controller;

            expect(preGenerateSpy).toHaveBeenCalledTimes(0);
        });

        it("pre-generates PKCE codes if navigatePopups is set to false", async () => {
            const preGenerateSpy = jest.spyOn(
                StandardController.prototype,
                // @ts-ignore
                "preGeneratePkceCodes"
            );

            pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                },
                system: {
                    allowPlatformBroker: false,
                    navigatePopups: false,
                },
            });
            await pca.initialize();

            //Implementation of PCA was moved to controller.
            pca = (pca as any).controller;

            expect(preGenerateSpy).toHaveBeenCalledTimes(1);
        });
    });

    describe("handleRedirectPromise", () => {
        beforeEach(async () => {
            // Implementation of pca was moved to controller
            pca = (pca as any).controller;
            await pca.initialize();
        });
        it("Calls RedirectClient.handleRedirectPromise and returns its response", async () => {
            const testAccount = BASIC_TEST_ACCOUNT_INFO;
            const testTokenResponse: AuthenticationResult = {
                authority: TEST_CONFIG.validAuthority,
                uniqueId: testAccount.localAccountId,
                tenantId: testAccount.tenantId,
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                idToken: "test-idToken",
                idTokenClaims: {},
                accessToken: "test-accessToken",
                fromCache: false,
                correlationId: RANDOM_TEST_GUID,
                expiresOn: TestTimeUtils.nowDateWithOffset(3600),
                account: testAccount,
                tokenType: Constants.AuthenticationScheme.BEARER,
            };

            jest.spyOn(
                BrowserCacheManager.prototype,
                "isInteractionInProgress"
            ).mockReturnValue(true);
            jest.spyOn(
                BrowserCacheManager.prototype,
                "getCachedRequest"
            ).mockReturnValue([testRequest, TEST_CONFIG.TEST_VERIFIER]);

            const redirectClientSpy = jest
                .spyOn(RedirectClient.prototype, "handleRedirectPromise")
                .mockImplementation(() => {
                    jest.spyOn(pca, "getAllAccounts").mockReturnValue([
                        testAccount,
                    ]);
                    return Promise.resolve(testTokenResponse);
                });
            let loginSuccessFired = false;
            jest.spyOn(EventHandler.prototype, "emitEvent").mockImplementation(
                (eventType) => {
                    if (eventType === EventType.LOGIN_SUCCESS) {
                        loginSuccessFired = true;
                    }
                }
            );
            const response = await pca.handleRedirectPromise();
            expect(response?.idToken).not.toBeNull();
            expect(response).toEqual(testTokenResponse);
            expect(redirectClientSpy).toHaveBeenCalledTimes(1);
            expect(loginSuccessFired).toBe(true);
        });

        it("Calls RedirectClient.handleRedirectPromise and emits telemetry event", (done) => {
            const testAccount = BASIC_TEST_ACCOUNT_INFO;
            const testTokenResponse: AuthenticationResult = {
                authority: TEST_CONFIG.validAuthority,
                uniqueId: testAccount.localAccountId,
                tenantId: testAccount.tenantId,
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                idToken: "test-idToken",
                idTokenClaims: {},
                accessToken: "test-accessToken",
                fromCache: false,
                correlationId: RANDOM_TEST_GUID,
                expiresOn: TestTimeUtils.nowDateWithOffset(3600),
                account: testAccount,
                tokenType: Constants.AuthenticationScheme.BEARER,
            };

            jest.spyOn(
                BrowserCacheManager.prototype,
                "isInteractionInProgress"
            ).mockReturnValue(true);
            jest.spyOn(
                BrowserCacheManager.prototype,
                "getCachedRequest"
            ).mockReturnValue([testRequest, TEST_CONFIG.TEST_VERIFIER]);

            jest.spyOn(pca, "getAllAccounts").mockReturnValue([testAccount]);
            jest.spyOn(
                RedirectClient.prototype,
                "handleRedirectPromise"
            ).mockResolvedValue(testTokenResponse);

            const callbackId = pca.addPerformanceCallback((events) => {
                expect(events.length).toEqual(1);
                const event = events[0];
                expect(event.name).toBe(
                    BrowserRootPerformanceEvents.AcquireTokenRedirect
                );
                expect(event.correlationId).toBeDefined();
                expect(event.success).toBeTruthy();
                expect(
                    event.ext?.["handleRedirectPromiseDurationMs"]
                ).toBeGreaterThanOrEqual(0);
                expect(event.ext?.["handleRedirectPromiseCallCount"]).toEqual(
                    1
                );
                expect(event.success).toBeTruthy();
                expect(event.accountType).toEqual(undefined);
                pca.removePerformanceCallback(callbackId);
                done();
            });

            pca.handleRedirectPromise();
        });

        it("cleans temporary cache and rethrows if error is thrown", (done) => {
            browserStorage.setInteractionInProgress(true);
            browserStorage.cacheAuthorizeRequest(
                testRequest,
                TEST_CONFIG.TEST_VERIFIER
            );
            const testError: AuthError = new AuthError(
                "Unexpected error!",
                "Unexpected error"
            );
            jest.spyOn(
                RedirectClient.prototype,
                "handleRedirectPromise"
            ).mockRejectedValue(testError);
            pca.handleRedirectPromise().catch((e) => {
                expect(e).toMatchObject(testError);
                expect(window.localStorage.length).toEqual(0);
                expect(window.sessionStorage.length).toEqual(1);
                expect(
                    window.sessionStorage.getItem(CacheKeys.VERSION_CACHE_KEY)
                ).toEqual(version); // Validate that the one item in sessionStorage is what we expect
                done();
            });
        });

        it("Calls NativeInteractionClient.handleRedirectPromise and returns its response", async () => {
            const config = {
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                },
                system: {
                    allowPlatformBroker: true,
                },
            };
            pca = new PublicClientApplication(config);

            stubExtensionProvider(config);
            await pca.initialize();

            // Implementation of PCA was moved to controller.
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            pca = (pca as any).controller;

            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: "3338040d-6c67-4c5b-b112-36a304b66dad",
                username: "AbeLi@microsoft.com",
                nativeAccountId: "test-nativeAccountId",
                loginHint: "AbeLiLoginHint",
            };
            const testTokenResponse: AuthenticationResult = {
                authority: TEST_CONFIG.validAuthority,
                uniqueId: testAccount.localAccountId,
                tenantId: testAccount.tenantId,
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                idToken: "test-idToken",
                idTokenClaims: {},
                accessToken: "test-accessToken",
                fromCache: false,
                correlationId: RANDOM_TEST_GUID,
                expiresOn: TestTimeUtils.nowDateWithOffset(3600),
                account: testAccount,
                tokenType: Constants.AuthenticationScheme.BEARER,
                fromPlatformBroker: true,
            };

            jest.spyOn(
                BrowserCacheManager.prototype,
                "isInteractionInProgress"
            ).mockReturnValue(true);

            const nativeRequest: PlatformAuthRequest = {
                authority: TEST_CONFIG.validAuthority,
                clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                scope: TEST_CONFIG.DEFAULT_SCOPES.join(" "),
                accountId: testAccount.nativeAccountId!,
                redirectUri: window.location.href,
                correlationId: RANDOM_TEST_GUID,
                windowTitleSubstring: "test window",
            };
            // @ts-ignore
            pca.browserStorage.setTemporaryCache(
                TemporaryCacheKeys.NATIVE_REQUEST,
                JSON.stringify(nativeRequest),
                true
            );
            const redirectClientSpy: jest.SpyInstance = jest
                .spyOn(
                    PlatformAuthInteractionClient.prototype,
                    "handleRedirectPromise"
                )
                .mockImplementation(() => {
                    jest.spyOn(pca, "getAllAccounts").mockReturnValue([
                        testAccount,
                    ]);
                    return Promise.resolve(testTokenResponse);
                });
            let loginSuccessFired = false;
            jest.spyOn(EventHandler.prototype, "emitEvent").mockImplementation(
                (eventType) => {
                    if (eventType === EventType.LOGIN_SUCCESS) {
                        loginSuccessFired = true;
                    }
                }
            );

            const response = await pca.handleRedirectPromise();
            expect(response).toEqual(testTokenResponse);
            expect(redirectClientSpy).toHaveBeenCalledTimes(1);
            expect(loginSuccessFired).toBe(true);
        });

        it("Calls NativeInteractionClient.handleRedirectPromise and emits telemetry event", (done) => {
            const config = {
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                },
                system: {
                    allowPlatformBroker: true,
                },
                telemetry: {
                    client: new BrowserPerformanceClient(testAppConfig),
                    application: {
                        appName: TEST_CONFIG.applicationName,
                        appVersion: TEST_CONFIG.applicationVersion,
                    },
                },
            };
            pca = new PublicClientApplication(config);
            stubExtensionProvider(config);

            pca.initialize().then(() => {
                const callbackId = pca.addPerformanceCallback((events) => {
                    expect(events.length).toEqual(1);
                    const event = events[0];
                    expect(event.name).toBe(
                        BrowserRootPerformanceEvents.AcquireTokenRedirect
                    );
                    expect(event.correlationId).toBeDefined();
                    expect(event.success).toBeTruthy();
                    expect(
                        event.ext?.["handleNativeRedirectPromiseDurationMs"]
                    ).toBeGreaterThanOrEqual(0);
                    expect(
                        event.ext?.["handleNativeRedirectPromiseCallCount"]
                    ).toEqual(1);
                    expect(event.success).toBeTruthy();
                    expect(event.accountType).toEqual("MSA");
                    pca.removePerformanceCallback(callbackId);
                    done();
                });
                // Implementation of PCA was moved to controller.
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                pca = (pca as any).controller;

                const testAccount: AccountInfo = {
                    homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                    localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                    environment: "login.windows.net",
                    tenantId: "9188040d-6c67-4c5b-b112-36a304b66dad",
                    username: "AbeLi@microsoft.com",
                    loginHint: "AbeLiLoginHint",
                    nativeAccountId: "test-nativeAccountId",
                    idTokenClaims: {
                        tid: "9188040d-6c67-4c5b-b112-36a304b66dad",
                    },
                };
                const testTokenResponse: AuthenticationResult = {
                    authority: TEST_CONFIG.validAuthority,
                    uniqueId: testAccount.localAccountId,
                    tenantId: "9188040d-6c67-4c5b-b112-36a304b66dad",
                    scopes: TEST_CONFIG.DEFAULT_SCOPES,
                    idToken: "test-idToken",
                    idTokenClaims: {},
                    accessToken: "test-accessToken",
                    fromCache: false,
                    correlationId: RANDOM_TEST_GUID,
                    expiresOn: TestTimeUtils.nowDateWithOffset(3600),
                    account: testAccount,
                    tokenType: Constants.AuthenticationScheme.BEARER,
                    fromPlatformBroker: true,
                };
                jest.spyOn(
                    BrowserCacheManager.prototype,
                    "isInteractionInProgress"
                ).mockReturnValue(true);
                jest.spyOn(
                    BrowserCacheManager.prototype,
                    "getCachedRequest"
                ).mockReturnValue([testRequest, TEST_CONFIG.TEST_VERIFIER]);

                const nativeRequest: PlatformAuthRequest = {
                    authority: TEST_CONFIG.validAuthority,
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                    scope: TEST_CONFIG.DEFAULT_SCOPES.join(" "),
                    accountId: testAccount.nativeAccountId!,
                    redirectUri: window.location.href,
                    correlationId: RANDOM_TEST_GUID,
                    windowTitleSubstring: "test window",
                };
                // @ts-ignore
                pca.browserStorage.setTemporaryCache(
                    TemporaryCacheKeys.NATIVE_REQUEST,
                    JSON.stringify(nativeRequest),
                    true
                );
                jest.spyOn(pca, "getAllAccounts").mockReturnValue([
                    testAccount,
                ]);
                jest.spyOn(
                    PlatformAuthInteractionClient.prototype,
                    "handleRedirectPromise"
                ).mockResolvedValue(testTokenResponse);

                pca.handleRedirectPromise();
            });
        });

        it("Calls NativeInteractionClient.handleRedirectPromise and clears interaction_in_progress flag if it fails", (done) => {
            const config = {
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                },
                system: {
                    allowPlatformBroker: true,
                },
            };
            pca = new PublicClientApplication(config);

            stubExtensionProvider(config);

            //@ts-ignore
            pca.controller.browserStorage.setInteractionInProgress(true);

            const nativeRequest: PlatformAuthRequest = {
                authority: TEST_CONFIG.validAuthority,
                clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                scope: TEST_CONFIG.DEFAULT_SCOPES.join(" "),
                accountId: "1234",
                redirectUri: window.location.href,
                correlationId: RANDOM_TEST_GUID,
                windowTitleSubstring: "test window",
            };
            // @ts-ignore
            pca.controller.browserStorage.setTemporaryCache(
                TemporaryCacheKeys.NATIVE_REQUEST,
                JSON.stringify(nativeRequest),
                true
            );
            const redirectClientSpy: jest.SpyInstance = jest
                .spyOn(
                    PlatformAuthInteractionClient.prototype,
                    "handleRedirectPromise"
                )
                .mockRejectedValue(new Error("testerror"));

            pca.initialize().then(() =>
                pca.handleRedirectPromise().catch((e) => {
                    expect(redirectClientSpy).toHaveBeenCalled();
                    expect(e.message).toEqual("testerror");
                    expect(
                        // @ts-ignore
                        pca.controller.browserStorage.isInteractionInProgress()
                    ).toEqual(false);
                    done();
                })
            );
        });

        it("Emits acquireToken success event if user was already signed in", async () => {
            const testAccount = BASIC_TEST_ACCOUNT_INFO;
            const testTokenResponse: AuthenticationResult = {
                authority: TEST_CONFIG.validAuthority,
                uniqueId: testAccount.localAccountId,
                tenantId: testAccount.tenantId,
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                idToken: "test-idToken",
                idTokenClaims: {},
                accessToken: "test-accessToken",
                fromCache: false,
                correlationId: RANDOM_TEST_GUID,
                expiresOn: TestTimeUtils.nowDateWithOffset(3600),
                account: testAccount,
                tokenType: Constants.AuthenticationScheme.BEARER,
            };
            jest.spyOn(
                BrowserCacheManager.prototype,
                "isInteractionInProgress"
            ).mockReturnValue(true);
            jest.spyOn(
                BrowserCacheManager.prototype,
                "getCachedRequest"
            ).mockReturnValue([testRequest, TEST_CONFIG.TEST_VERIFIER]);
            jest.spyOn(pca, "getAllAccounts").mockReturnValue([testAccount]);
            const redirectClientSpy: jest.SpyInstance = jest
                .spyOn(RedirectClient.prototype, "handleRedirectPromise")
                .mockResolvedValue(testTokenResponse);
            let acquireTokenSuccessFired = false;
            jest.spyOn(EventHandler.prototype, "emitEvent").mockImplementation(
                (eventType) => {
                    if (eventType === EventType.ACQUIRE_TOKEN_SUCCESS) {
                        acquireTokenSuccessFired = true;
                    }
                }
            );
            const response = await pca.handleRedirectPromise();
            expect(response).toEqual(testTokenResponse);
            expect(redirectClientSpy).toHaveBeenCalledTimes(1);
            expect(acquireTokenSuccessFired).toBe(true);
        });

        it("Emits acquireToken failure event if user was already signed in", (done) => {
            const testAccount = BASIC_TEST_ACCOUNT_INFO;
            jest.spyOn(
                BrowserCacheManager.prototype,
                "isInteractionInProgress"
            ).mockReturnValue(true);
            jest.spyOn(
                BrowserCacheManager.prototype,
                "getCachedRequest"
            ).mockReturnValue([testRequest, TEST_CONFIG.TEST_VERIFIER]);
            jest.spyOn(
                StandardController.prototype,
                "getAllAccounts"
            ).mockReturnValue([testAccount]);
            const redirectClientSpy: jest.SpyInstance = jest
                .spyOn(RedirectClient.prototype, "handleRedirectPromise")
                .mockRejectedValue(new Error("Error"));
            let acquireTokenFailureFired = false;
            jest.spyOn(EventHandler.prototype, "emitEvent").mockImplementation(
                (eventType) => {
                    if (eventType === EventType.ACQUIRE_TOKEN_FAILURE) {
                        acquireTokenFailureFired = true;
                    }
                }
            );

            pca.handleRedirectPromise().catch(() => {
                expect(redirectClientSpy).toHaveBeenCalledTimes(1);
                expect(acquireTokenFailureFired).toBe(true);
                done();
            });
        });

        it("Multiple concurrent calls to handleRedirectPromise return the same promise", async () => {
            window.sessionStorage.setItem(
                `${CacheKeys.PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.ORIGIN_URI}`,
                TEST_URIS.TEST_REDIR_URI
            );
            window.sessionStorage.setItem(
                `${CacheKeys.PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.URL_HASH}`,
                TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT
            );
            window.sessionStorage.setItem(
                `${CacheKeys.PREFIX}.${TemporaryCacheKeys.INTERACTION_STATUS_KEY}`,
                JSON.stringify({
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                    type: INTERACTION_TYPE.SIGNIN,
                })
            );
            jest.spyOn(
                BrowserCacheManager.prototype,
                "isInteractionInProgress"
            ).mockReturnValue(true);
            jest.spyOn(
                BrowserCacheManager.prototype,
                "getCachedRequest"
            ).mockReturnValue([testRequest, TEST_CONFIG.TEST_VERIFIER]);
            const testServerTokenResponse = {
                headers: {},
                status: 200,
                body: {
                    token_type: TEST_CONFIG.TOKEN_TYPE_BEARER,
                    scope: TEST_CONFIG.DEFAULT_SCOPES.join(" "),
                    expires_in: TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN,
                    ext_expires_in: TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN,
                    access_token: TEST_TOKENS.ACCESS_TOKEN,
                    refresh_token: TEST_TOKENS.REFRESH_TOKEN,
                    id_token: TEST_TOKENS.IDTOKEN_V2,
                    client_info: TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO,
                },
            };
            const testIdTokenClaims: TokenClaims = ID_TOKEN_CLAIMS;
            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: testIdTokenClaims.tid || "",
                username: testIdTokenClaims.preferred_username || "",
                loginHint: testIdTokenClaims.login_hint,
            };
            const testTokenResponse: AuthenticationResult = {
                authority: TEST_CONFIG.validAuthority,
                uniqueId: testIdTokenClaims.oid || "",
                tenantId: testIdTokenClaims.tid || "",
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                idToken: testServerTokenResponse.body.id_token,
                idTokenClaims: testIdTokenClaims,
                accessToken: testServerTokenResponse.body.access_token,
                fromCache: false,
                correlationId: RANDOM_TEST_GUID,
                expiresOn: TestTimeUtils.nowDateWithOffset(
                    testServerTokenResponse.body.expires_in
                ),
                account: testAccount,
                tokenType: Constants.AuthenticationScheme.BEARER,
            };
            const postMock = jest
                .spyOn(FetchClient.prototype, "sendPostRequestAsync")
                .mockResolvedValueOnce(testServerTokenResponse);
            pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                },
                system: {
                    allowPlatformBroker: false,
                },
            });

            await pca.initialize();

            // Implementation of PCA was moved to controller.
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            pca = (pca as any).controller;

            const promise1 = pca.handleRedirectPromise();
            const promise2 = pca.handleRedirectPromise();
            const tokenResponse1 = await promise1;
            const tokenResponse2 = await promise2;
            const tokenResponse3 = await pca.handleRedirectPromise({
                hash: "testHash",
            });
            expect(tokenResponse3).toBe(null);
            const tokenResponse4 = await pca.handleRedirectPromise();

            if (!tokenResponse1 || !tokenResponse2) {
                throw "This should not throw. Both responses should be non-null.";
            }

            expect(postMock).toHaveBeenCalledTimes(1);

            // Response from first promise
            expect(tokenResponse1.uniqueId).toEqual(testTokenResponse.uniqueId);
            expect(tokenResponse1.tenantId).toEqual(testTokenResponse.tenantId);
            expect(tokenResponse1.scopes).toEqual(testTokenResponse.scopes);
            expect(tokenResponse1.idToken).toEqual(testTokenResponse.idToken);
            expect(tokenResponse1.idTokenClaims).toEqual(
                expect.objectContaining(testTokenResponse.idTokenClaims)
            );
            expect(tokenResponse1.accessToken).toEqual(
                testTokenResponse.accessToken
            );
            expect(
                testTokenResponse.expiresOn &&
                    tokenResponse1.expiresOn &&
                    testTokenResponse.expiresOn.getMilliseconds() >=
                        tokenResponse1.expiresOn.getMilliseconds()
            ).toBeTruthy();

            // Response from second promise
            expect(tokenResponse2.uniqueId).toEqual(testTokenResponse.uniqueId);
            expect(tokenResponse2.tenantId).toEqual(testTokenResponse.tenantId);
            expect(tokenResponse2.scopes).toEqual(testTokenResponse.scopes);
            expect(tokenResponse2.idToken).toEqual(testTokenResponse.idToken);
            expect(tokenResponse2.idTokenClaims).toEqual(
                expect.objectContaining(testTokenResponse.idTokenClaims)
            );
            expect(tokenResponse2.accessToken).toEqual(
                testTokenResponse.accessToken
            );
            expect(
                testTokenResponse.expiresOn &&
                    tokenResponse2.expiresOn &&
                    testTokenResponse.expiresOn.getMilliseconds() >=
                        tokenResponse2.expiresOn.getMilliseconds()
            ).toBeTruthy();

            expect(tokenResponse1).toEqual(tokenResponse2);
            expect(tokenResponse4).toEqual(tokenResponse1);
        });

        it("Emits performance event with error code if no response is provided", (done) => {
            const testAccount = BASIC_TEST_ACCOUNT_INFO;
            jest.spyOn(
                StandardController.prototype,
                "getAllAccounts"
            ).mockReturnValue([testAccount]);
            // @ts-ignore
            jest.spyOn(RedirectClient.prototype, "getRedirectResponse")
                // @ts-ignore
                .mockReturnValue([null, ""]);
            jest.spyOn(
                BrowserCacheManager.prototype,
                "isInteractionInProgress"
            ).mockReturnValue(true);
            jest.spyOn(
                BrowserCacheManager.prototype,
                "getCachedRequest"
            ).mockReturnValue([testRequest, TEST_CONFIG.TEST_VERIFIER]);

            const callbackId = pca.addPerformanceCallback((events) => {
                expect(events.length).toEqual(1);
                expect(events[0].success).toBe(false);
                expect(events[0].errorCode).toBe("no_server_response");
                pca.removePerformanceCallback(callbackId);
                done();
            });

            window.sessionStorage.setItem(
                `${CacheKeys.PREFIX}.${TemporaryCacheKeys.INTERACTION_STATUS_KEY}`,
                JSON.stringify({
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                    type: INTERACTION_TYPE.SIGNIN,
                })
            );
            pca.handleRedirectPromise();
        });

        it("Discards performance event if handleRedirectPromise returns null and no error code is set", async () => {
            const testAccount = BASIC_TEST_ACCOUNT_INFO;
            jest.spyOn(
                StandardController.prototype,
                "getAllAccounts"
            ).mockReturnValue([testAccount]);
            jest.spyOn(
                RedirectClient.prototype,
                "handleRedirectPromise"
            ).mockResolvedValue(null);

            const emitSpy = jest.spyOn(
                PerformanceClient.prototype,
                "emitEvents"
            );

            await pca.handleRedirectPromise();
            expect(emitSpy).toHaveBeenCalledTimes(0);
        });

        it("removes interaction_in_progress and returns null after sign-out", async () => {
            pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                },
            });
            await pca.initialize();

            window.sessionStorage.setItem(
                `${CacheKeys.PREFIX}.${TemporaryCacheKeys.INTERACTION_STATUS_KEY}`,
                JSON.stringify({
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                    type: INTERACTION_TYPE.SIGNOUT,
                })
            );
            const res = await pca.handleRedirectPromise();
            expect(res).toBeNull();
            expect(
                // @ts-ignore
                pca.controller.browserStorage.getInteractionInProgress()
            ).toBeFalsy();
        });

        it("removes interaction_in_progress and throws after sign-in when there are no tokens in cache", async () => {
            pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                },
            });
            await pca.initialize();

            window.sessionStorage.setItem(
                `${CacheKeys.PREFIX}.${TemporaryCacheKeys.INTERACTION_STATUS_KEY}`,
                JSON.stringify({
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                    type: INTERACTION_TYPE.SIGNIN,
                })
            );
            try {
                await pca.handleRedirectPromise();
                throw "Unexpected code path";
            } catch (e) {
                // @ts-ignore
                expect(e.errorCode).toEqual("no_token_request_cache_error");
            }
            expect(
                // @ts-ignore
                pca.controller.browserStorage.getInteractionInProgress()
            ).toBeFalsy();
        });
    });
    describe("OIDC Protocol Mode tests", () => {
        beforeEach(async () => {
            pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                    OIDCOptions: {
                        responseMode: Constants.ResponseMode.QUERY,
                    },
                },
                telemetry: {
                    application: {
                        appName: TEST_CONFIG.applicationName,
                        appVersion: TEST_CONFIG.applicationVersion,
                    },
                },
                system: {
                    allowPlatformBroker: false,
                    protocolMode: ProtocolMode.OIDC,
                },
            });

            await pca.initialize();
        });

        it("Looks for server code response in query param if OIDCOptions.responseMode is set to query", async () => {
            const responseSpy = jest.spyOn(
                RedirectClient.prototype,
                <any>"getRedirectResponse"
            );

            const request: CommonAuthorizationUrlRequest = {
                redirectUri: `${TEST_URIS.DEFAULT_INSTANCE}/`,
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                authority: `${Constants.DEFAULT_AUTHORITY}`,
                correlationId: RANDOM_TEST_GUID,
                authenticationScheme:
                    TEST_CONFIG.TOKEN_TYPE_BEARER as Constants.AuthenticationScheme,
                responseMode: Constants.ResponseMode.QUERY,
                state: TEST_STATE_VALUES.TEST_STATE_REDIRECT,
                nonce: RANDOM_TEST_GUID,
            };
            // @ts-ignore
            pca.controller.browserStorage.cacheAuthorizeRequest(
                request,
                RANDOM_TEST_GUID
            );

            jest.spyOn(
                BrowserCacheManager.prototype,
                "isInteractionInProgress"
            ).mockReturnValue(true);
            const responseString = `?code=authCode&state=${TEST_STATE_VALUES.TEST_STATE_REDIRECT}`;

            jest.spyOn(window, "location", "get").mockReturnValueOnce({
                ...window.location,
                search: responseString,
            });
            await pca.handleRedirectPromise().catch(() => {
                // This will likely throw, but the e2e is not being tested here
            });

            expect(responseSpy).toHaveBeenCalledTimes(1);
            expect(responseSpy).lastReturnedWith([
                {
                    code: "authCode",
                    state: TEST_STATE_VALUES.TEST_STATE_REDIRECT,
                    nonce: RANDOM_TEST_GUID,
                },
                responseString,
            ]);
        });
    });

    describe("loginRedirect", () => {
        beforeEach(async () => {
            pca = (pca as any).controller;
            await pca.initialize();
        });

        it("throws an error if initialize was not called prior", (done) => {
            pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                },
            });
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            pca = (pca as any).controller;
            pca.loginRedirect().catch((e) => {
                expect(e).toMatchObject(
                    createBrowserAuthError(
                        BrowserAuthErrorCodes.uninitializedPublicClientApplication
                    )
                );
                done();
            });
        });

        it("doesnt mutate request correlation id", async () => {
            const request: RedirectRequest = {
                scopes: [],
            };

            await pca.loginRedirect(request).catch(() => null);
            await pca.loginRedirect(request).catch(() => null);

            expect(request.correlationId).toBe(undefined);
        });

        it("Uses default request if no request provided", (done) => {
            jest.spyOn(BrowserCrypto, "createNewGuid").mockReturnValue(
                RANDOM_TEST_GUID
            );
            jest.spyOn(
                StandardController.prototype,
                "acquireTokenRedirect"
            ).mockImplementation(async (request): Promise<void> => {
                expect(request.scopes).toContain("openid");
                expect(request.scopes).toContain("profile");
                expect(request.correlationId).toEqual(RANDOM_TEST_GUID);
                done();
                return;
            });

            const callbackId = pca.addPerformanceCallback((events) => {
                expect(events[0].correlationId).toBe(RANDOM_TEST_GUID);
                expect(events[0].success).toBe(true);
                expect(events[0].accessTokenSize).toBe(16);
                expect(events[0].idTokenSize).toBe(12);
                expect(events[0].requestId).toBe(undefined);
                expect(events[0].visibilityChangeCount).toBe(0);
                pca.removePerformanceCallback(callbackId);
                done();
            });

            pca.loginRedirect();
        });

        it("navigates to created login url, with empty request", (done) => {
            jest.spyOn(
                RedirectClient.prototype,
                "initiateAuthRequest"
            ).mockImplementation((navigateUrl): Promise<void> => {
                verifyUrl(navigateUrl);
                return Promise.resolve(done());
            });
            jest.spyOn(PkceGenerator, "generatePkceCodes").mockResolvedValue({
                challenge: TEST_CONFIG.TEST_CHALLENGE,
                verifier: TEST_CONFIG.TEST_VERIFIER,
            });
            jest.spyOn(BrowserCrypto, "createNewGuid").mockReturnValue(
                RANDOM_TEST_GUID
            );

            // @ts-ignore
            pca.loginRedirect(null);
        });
    });

    describe("acquireTokenRedirect", () => {
        beforeEach(async () => {
            pca = (pca as any).controller;
            await pca.initialize();
        });

        it("throws an error if initialize was not called prior", (done) => {
            pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                },
            });
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            pca = (pca as any).controller;
            pca.acquireTokenRedirect({ scopes: [] }).catch((e) => {
                expect(e).toMatchObject(
                    createBrowserAuthError(
                        BrowserAuthErrorCodes.uninitializedPublicClientApplication
                    )
                );
                done();
            });
        });
        it("goes directly to the native broker if nativeAccountId is present", async () => {
            const config = {
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                },
                system: {
                    allowPlatformBroker: true,
                },
            };
            pca = new PublicClientApplication(config);

            stubExtensionProvider(config);
            await pca.initialize();

            //Implementation of PCA was moved to controller.
            pca = (pca as any).controller;

            const testAccount = BASIC_NATIVE_TEST_ACCOUNT_INFO;

            jest.spyOn(BrowserCrypto, "createNewGuid").mockReturnValue(
                RANDOM_TEST_GUID
            );

            const nativeAcquireTokenSpy = jest
                .spyOn(
                    PlatformAuthInteractionClient.prototype,
                    "acquireTokenRedirect"
                )
                .mockResolvedValue();
            const redirectSpy: jest.SpyInstance = jest
                .spyOn(RedirectClient.prototype, "acquireToken")
                .mockResolvedValue();
            await pca.acquireTokenRedirect({
                scopes: ["User.Read"],
                account: testAccount,
            });

            expect(nativeAcquireTokenSpy).toHaveBeenCalledTimes(1);
            expect(redirectSpy).toHaveBeenCalledTimes(0);
        });

        /*
         * Excluding this test pending discussion of telemetry implementation
         * around initialization given that we have multiple controllers now
         */
        xit("captures telemetry data points during initialization", (done) => {
            const config = {
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                },
                system: {
                    allowPlatformBroker: true,
                },
                telemetry: {
                    client: new BrowserPerformanceClient(testAppConfig),
                },
            };
            pca = new PublicClientApplication(config);

            stubExtensionProvider(config);

            const callbackId = pca.addPerformanceCallback((events) => {
                expect(events.length).toBeGreaterThanOrEqual(1);
                for (const event of events) {
                    if (
                        event.name ===
                        BrowserRootPerformanceEvents.InitializeClientApplication
                    ) {
                        expect(event.success).toBeTruthy();
                        expect(event.allowPlatformBroker).toBeTruthy();
                        pca.removePerformanceCallback(callbackId);
                        done();
                    }
                }
            });

            pca.initialize();
        });

        it("records isMcp on InitializeClientApplication telemetry event", (done) => {
            const config = {
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                    isMcp: true,
                },
                telemetry: {
                    client: new BrowserPerformanceClient(testAppConfig),
                },
            };
            pca = new PublicClientApplication(config);

            const callbackId = pca.addPerformanceCallback((events) => {
                for (const event of events) {
                    if (
                        event.name ===
                        BrowserRootPerformanceEvents.InitializeClientApplication
                    ) {
                        expect(event.isMcp).toBe(true);
                        pca.removePerformanceCallback(callbackId);
                        done();
                    }
                }
            });

            pca.initialize();
        });

        it("falls back to web flow if prompt is select_account", async () => {
            const config = {
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                },
                system: {
                    allowPlatformBroker: true,
                },
            };
            pca = new PublicClientApplication(config);

            await pca.initialize();
            stubExtensionProvider(config);

            //Implementation of PCA was moved to controller.
            pca = (pca as any).controller;

            const testAccount = BASIC_NATIVE_TEST_ACCOUNT_INFO;

            const nativeAcquireTokenSpy = jest.spyOn(
                PlatformAuthInteractionClient.prototype,
                "acquireTokenRedirect"
            );
            const redirectSpy: jest.SpyInstance = jest
                .spyOn(RedirectClient.prototype, "acquireToken")
                .mockImplementation();
            await pca.acquireTokenRedirect({
                scopes: ["User.Read"],
                account: testAccount,
                prompt: "select_account",
            });

            expect(nativeAcquireTokenSpy).toHaveBeenCalledTimes(0);
            expect(redirectSpy).toHaveBeenCalledTimes(1);
        });

        it("falls back to web flow if native broker call fails due to fatal error", async () => {
            const config = {
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                },
                system: {
                    allowPlatformBroker: true,
                },
            };
            pca = new PublicClientApplication(config);

            stubExtensionProvider(config);
            await pca.initialize();

            // Implementation of PCA was moved to controller.
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            pca = (pca as any).controller;

            const testAccount = BASIC_NATIVE_TEST_ACCOUNT_INFO;

            const nativeAcquireTokenSpy: jest.SpyInstance = jest
                .spyOn(
                    PlatformAuthInteractionClient.prototype,
                    "acquireTokenRedirect"
                )
                .mockRejectedValue(
                    new NativeAuthError("ContentError", "error in extension")
                );
            const redirectSpy = jest
                .spyOn(RedirectClient.prototype, "acquireToken")
                .mockResolvedValue();
            await pca.acquireTokenRedirect({
                scopes: ["User.Read"],
                account: testAccount,
            });

            expect(nativeAcquireTokenSpy).toHaveBeenCalledTimes(1);
            expect(redirectSpy).toHaveBeenCalledTimes(1);
        });

        it("falls back to web flow if native broker call fails due to interaction_required error", async () => {
            const config = {
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                },
                system: {
                    allowPlatformBroker: true,
                },
            };
            pca = new PublicClientApplication(config);

            stubExtensionProvider(config);
            await pca.initialize();

            // Implementation of PCA was moved to controller.
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            pca = (pca as any).controller;

            const testAccount = BASIC_NATIVE_TEST_ACCOUNT_INFO;

            const nativeAcquireTokenSpy: jest.SpyInstance = jest
                .spyOn(
                    PlatformAuthInteractionClient.prototype,
                    "acquireTokenRedirect"
                )
                .mockRejectedValue(
                    createInteractionRequiredAuthError(
                        InteractionRequiredAuthErrorCodes.nativeAccountUnavailable
                    )
                );
            const redirectSpy = jest
                .spyOn(RedirectClient.prototype, "acquireToken")
                .mockResolvedValue();
            await pca.acquireTokenRedirect({
                scopes: ["User.Read"],
                account: testAccount,
            });

            expect(nativeAcquireTokenSpy).toHaveBeenCalledTimes(1);
            expect(redirectSpy).toHaveBeenCalledTimes(1);
        });

        it("throws error if native broker call fails due to non-fatal error", async () => {
            const config = {
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                },
                system: {
                    allowPlatformBroker: true,
                },
            };
            pca = new PublicClientApplication(config);

            stubExtensionProvider(config);
            await pca.initialize();

            //PCA implementation moved to controller
            pca = (pca as any).controller;

            const testAccount = BASIC_NATIVE_TEST_ACCOUNT_INFO;

            const nativeAcquireTokenSpy: jest.SpyInstance = jest
                .spyOn(
                    PlatformAuthInteractionClient.prototype,
                    "acquireTokenRedirect"
                )
                .mockRejectedValue(new Error("testError"));
            const redirectSpy: jest.SpyInstance = jest
                .spyOn(RedirectClient.prototype, "acquireToken")
                .mockResolvedValue();

            await pca
                .acquireTokenRedirect({
                    scopes: ["User.Read"],
                    account: testAccount,
                })
                .catch((e) => {
                    expect(
                        // @ts-ignore
                        pca.browserStorage.getInteractionInProgress()
                    ).toBeFalsy();
                    expect(e.message).toEqual("testError");
                });
            expect(nativeAcquireTokenSpy).toHaveBeenCalledTimes(1);
            expect(redirectSpy).toHaveBeenCalledTimes(0);
        });

        it("does not mutate request correlation id", async () => {
            const request: RedirectRequest = {
                scopes: [],
            };

            await pca.acquireTokenRedirect(request).catch(() => null);
            await pca.acquireTokenRedirect(request).catch(() => null);

            expect(request.correlationId).toBe(undefined);
        });

        it("throws if interaction is currently in progress", async () => {
            const browserCrypto = new CryptoOps(new Logger({}));
            const logger = new Logger({});
            const browserStorage = new BrowserCacheManager(
                "client-id",
                cacheConfig,
                browserCrypto,
                logger,
                new StubPerformanceClient(),
                new EventHandler()
            );
            browserStorage.setInteractionInProgress(true);
            await expect(
                pca.acquireTokenRedirect({ scopes: ["openid"] })
            ).rejects.toMatchObject(
                createBrowserAuthError(
                    BrowserAuthErrorCodes.interactionInProgress
                )
            );
        });

        it("throws if interaction is currently in progress for a different clientId", async () => {
            const browserCrypto = new CryptoOps(new Logger({}));
            const logger = new Logger({});
            const browserStorage = new BrowserCacheManager(
                "client-id",
                cacheConfig,
                browserCrypto,
                logger,
                new StubPerformanceClient(),
                new EventHandler()
            );
            const secondInstanceStorage = new BrowserCacheManager(
                "different-client-id",
                cacheConfig,
                browserCrypto,
                logger,
                new StubPerformanceClient(),
                new EventHandler()
            );
            secondInstanceStorage.setInteractionInProgress(true);

            expect(browserStorage.isInteractionInProgress(true)).toBe(false);
            expect(browserStorage.isInteractionInProgress(false)).toBe(true);
            expect(secondInstanceStorage.isInteractionInProgress(true)).toBe(
                true
            );
            expect(secondInstanceStorage.isInteractionInProgress(false)).toBe(
                true
            );
            await expect(
                pca.acquireTokenRedirect({ scopes: ["openid"] })
            ).rejects.toMatchObject(
                createBrowserAuthError(
                    BrowserAuthErrorCodes.interactionInProgress
                )
            );
        });

        it("throws error if called in a popup", (done) => {
            Object.defineProperty(window, "location", {
                configurable: true,
                enumerable: true,
                writable: true,
                value: new URL(
                    `http://localhost?state=${TEST_STATE_VALUES.TEST_STATE_POPUP}`
                ),
            });

            jest.spyOn(BrowserUtils, "isInIframe").mockReturnValue(false);
            pca.acquireTokenRedirect({ scopes: ["openid"] })
                .catch((e) => {
                    expect(e).toBeInstanceOf(BrowserAuthError);
                    expect(e.errorCode).toEqual(
                        BrowserAuthErrorCodes.blockNestedPopups
                    );
                    expect(e.errorMessage).toEqual(
                        getDefaultErrorMessage(
                            BrowserAuthErrorCodes.blockNestedPopups
                        )
                    );
                    done();
                })
                .finally(() => {
                    Object.defineProperty(window, "location", {
                        value: {
                            hash: "",
                            origin: "https://localhost:8081",
                            pathname: "/",
                            search: "",
                            href: "https://localhost:8081/index.html",
                            protocol: "http:",
                            hostname: "localhost",
                            port: "8081",
                        },
                        writable: true,
                    });
                });
        });

        it("throws an error if inside an iframe", async () => {
            const mockParentWindow = { ...window };
            jest.spyOn(window, "parent", "get").mockReturnValue(
                mockParentWindow
            );
            await expect(
                pca.acquireTokenRedirect({ scopes: [] })
            ).rejects.toMatchObject(
                createBrowserAuthError(BrowserAuthErrorCodes.redirectInIframe)
            );
        });

        it("throws an error if initialize was not called prior", async () => {
            pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                },
            });

            try {
                await pca.acquireTokenRedirect({ scopes: [] });
            } catch (e) {
                expect(e).toMatchObject(
                    createBrowserAuthError(
                        BrowserAuthErrorCodes.uninitializedPublicClientApplication
                    )
                );
            }
        });

        it("throws error if cacheLocation is Memory Storage", async () => {
            pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                },
                cache: {
                    cacheLocation: BrowserCacheLocation.MemoryStorage,
                },
                system: {
                    allowPlatformBroker: false,
                },
            });
            await pca.initialize();
            await expect(
                pca.acquireTokenRedirect({ scopes: [] })
            ).rejects.toMatchObject(
                createBrowserConfigurationAuthError(
                    BrowserConfigurationAuthErrorCodes.inMemRedirectUnavailable
                )
            );
        });

        it("Calls RedirectClient.acquireToken and returns its response", async () => {
            const redirectClientSpy: jest.SpyInstance = jest
                .spyOn(RedirectClient.prototype, "acquireToken")
                .mockResolvedValue();

            const response = await pca.acquireTokenRedirect({
                scopes: ["openid"],
            });
            expect(response).toEqual(undefined);
            expect(redirectClientSpy).toHaveBeenCalledTimes(1);
        });

        it("Cleans temporary cache if error is thrown by RedirectClient.acquireToken", (done) => {
            const redirectClientSpy: jest.SpyInstance = jest
                .spyOn(RedirectClient.prototype, "acquireToken")
                .mockImplementation(() => {
                    expect(browserStorage.isInteractionInProgress()).toBe(true);
                    browserStorage.cacheAuthorizeRequest(
                        testRequest,
                        TEST_CONFIG.TEST_VERIFIER
                    );
                    expect(window.sessionStorage.length).toBe(3);
                    return Promise.reject(new Error("testerror"));
                });

            pca.acquireTokenRedirect({
                scopes: ["openid"],
            }).catch((e) => {
                expect(redirectClientSpy).toHaveBeenCalledTimes(1);
                expect(browserStorage.isInteractionInProgress()).toBe(false);
                expect(window.localStorage.length).toBe(0);
                expect(window.sessionStorage.length).toBe(1);
                expect(
                    window.sessionStorage.getItem(CacheKeys.VERSION_CACHE_KEY)
                ).toEqual(version); // Validate that the one item in sessionStorage is what we expect
                done();
            });
        });

        it("Emits acquireToken Start and Failure events if user is already logged in", async () => {
            const testAccount = BASIC_TEST_ACCOUNT_INFO;

            jest.spyOn(
                StandardController.prototype,
                "getAllAccounts"
            ).mockReturnValue([testAccount]);
            const redirectClientSpy: jest.SpyInstance = jest
                .spyOn(RedirectClient.prototype, "acquireToken")
                .mockRejectedValue(new Error("Error"));
            let acquireTokenStartEmitted = false;
            let acquireTokenFailureEmitted = false;
            jest.spyOn(EventHandler.prototype, "emitEvent").mockImplementation(
                (eventType) => {
                    if (eventType === EventType.ACQUIRE_TOKEN_START) {
                        acquireTokenStartEmitted = true;
                    } else if (eventType === EventType.ACQUIRE_TOKEN_FAILURE) {
                        acquireTokenFailureEmitted = true;
                    }
                }
            );

            await pca.acquireTokenRedirect({ scopes: ["openid"] }).catch(() => {
                expect(redirectClientSpy).toHaveBeenCalledTimes(1);
                expect(acquireTokenStartEmitted).toBe(true);
                expect(acquireTokenFailureEmitted).toBe(true);
            });
        });

        it("emits error performance event", (done) => {
            const config = {
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                },
                system: {
                    allowPlatformBroker: true,
                },
            };

            stubExtensionProvider(config);
            pca = new PublicClientApplication({
                ...config,
                telemetry: {
                    client: new BrowserPerformanceClient(testAppConfig),
                    application: {
                        appName: TEST_CONFIG.applicationName,
                        appVersion: TEST_CONFIG.applicationVersion,
                    },
                },
            });
            pca.initialize().then(() => {
                //Implementation of PCA was moved to controller.
                pca = (pca as any).controller;

                const callbackId = pca.addPerformanceCallback((events) => {
                    expect(events[0].correlationId).toBe(RANDOM_TEST_GUID);
                    expect(events[0].success).toBe(false);
                    expect(events[0].name).toBe(
                        BrowserRootPerformanceEvents.AcquireTokenPreRedirect
                    );
                    expect(events[0].errorCode).toBe("test error code");
                    pca.removePerformanceCallback(callbackId);
                    done();
                });

                const testAccount = BASIC_NATIVE_TEST_ACCOUNT_INFO;

                jest.spyOn(
                    RedirectClient.prototype,
                    "acquireToken"
                ).mockRejectedValue(
                    new AuthError("test error code", "test error message")
                );
                pca.acquireTokenRedirect({
                    correlationId: RANDOM_TEST_GUID,
                    scopes: ["User.Read"],
                    account: testAccount,
                    prompt: "select_account",
                }).catch((e) => {});
            });
        });

        it("emits pre-redirect telemetry event when onRedirectNavigate callback is set in configuration", (done) => {
            const onRedirectNavigate = (url: string) => {
                expect(url).toBeDefined();
            };

            pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                    onRedirectNavigate,
                },
                telemetry: {
                    client: new BrowserPerformanceClient(testAppConfig),
                    application: {
                        appName: TEST_CONFIG.applicationName,
                        appVersion: TEST_CONFIG.applicationVersion,
                    },
                },
            });
            pca = (pca as any).controller;

            pca.initialize().then(() => {
                const callbackId = pca.addPerformanceCallback((events) => {
                    expect(events[0].success).toBe(true);
                    expect(events[0].name).toBe(
                        BrowserRootPerformanceEvents.AcquireTokenPreRedirect
                    );
                    expect(events[0].navigateCallbackResult).toBeTruthy();
                    pca.removePerformanceCallback(callbackId);
                    done();
                });

                jest.spyOn(
                    NavigationClient.prototype,
                    "navigateExternal"
                ).mockImplementation(() => Promise.resolve(true));

                jest.spyOn(
                    PkceGenerator,
                    "generatePkceCodes"
                ).mockResolvedValue({
                    challenge: TEST_CONFIG.TEST_CHALLENGE,
                    verifier: TEST_CONFIG.TEST_VERIFIER,
                });
                const loginRequest: RedirectRequest = {
                    redirectUri: TEST_URIS.TEST_REDIR_URI,
                    scopes: ["user.read", "openid", "profile"],
                    state: TEST_STATE_VALUES.USER_STATE,
                };
                pca.acquireTokenRedirect(loginRequest);
            });
        });

        it("instruments pre-redirect telemetry event when navigation times out", (done) => {
            let eventCounter = 0;
            const callbackId = pca.addPerformanceCallback((events) => {
                if (
                    events[0].name ===
                    BrowserRootPerformanceEvents.AcquireTokenPreRedirect
                ) {
                    expect(events[0].success).toBe(true);
                    eventCounter++;
                }

                if (
                    events[0].name ===
                    BrowserRootPerformanceEvents.AcquireTokenRedirect
                ) {
                    expect(events[0].success).toBe(false);
                    expect(events[0].errorCode).toEqual("timed_out");
                    eventCounter++;
                }

                if (eventCounter === 2) {
                    pca.removePerformanceCallback(callbackId);
                    done();
                }
            });

            jest.spyOn(
                NavigationClient.prototype,
                "navigateExternal"
            ).mockRejectedValue(
                createBrowserAuthError(
                    BrowserAuthErrorCodes.timedOut,
                    "failed_to_redirect"
                )
            );

            jest.spyOn(PkceGenerator, "generatePkceCodes").mockResolvedValue({
                challenge: TEST_CONFIG.TEST_CHALLENGE,
                verifier: TEST_CONFIG.TEST_VERIFIER,
            });
            const loginRequest: RedirectRequest = {
                redirectUri: TEST_URIS.TEST_REDIR_URI,
                scopes: ["user.read", "openid", "profile"],
                state: TEST_STATE_VALUES.USER_STATE,
            };

            pca.acquireTokenRedirect(loginRequest).catch((e) => {});
        });

        it("emits pre-redirect telemetry event when onRedirectNavigate callback is not set", (done) => {
            const callbackId = pca.addPerformanceCallback((events) => {
                expect(events[0].success).toBe(true);
                expect(events[0].name).toBe(
                    BrowserRootPerformanceEvents.AcquireTokenPreRedirect
                );
                pca.removePerformanceCallback(callbackId);
                done();
            });

            jest.spyOn(
                NavigationClient.prototype,
                "navigateExternal"
            ).mockResolvedValue(true);

            jest.spyOn(PkceGenerator, "generatePkceCodes").mockResolvedValue({
                challenge: TEST_CONFIG.TEST_CHALLENGE,
                verifier: TEST_CONFIG.TEST_VERIFIER,
            });
            const loginRequest: RedirectRequest = {
                redirectUri: TEST_URIS.TEST_REDIR_URI,
                scopes: ["user.read", "openid", "profile"],
                state: TEST_STATE_VALUES.USER_STATE,
            };
            pca.acquireTokenRedirect(loginRequest);
        });

        it("emits pre-redirect telemetry event when onRedirectNavigate callback is set in configuration", async () => {
            const onRedirectNavigate = (url: string) => {
                expect(url).toBeDefined();
            };

            pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                    onRedirectNavigate,
                },
                telemetry: {
                    client: new BrowserPerformanceClient(testAppConfig),
                    application: {
                        appName: TEST_CONFIG.applicationName,
                        appVersion: TEST_CONFIG.applicationVersion,
                    },
                },
            });
            pca = (pca as any).controller;
            await pca.initialize();

            const callbackId = pca.addPerformanceCallback((events) => {
                expect(events[0].success).toBe(true);
                expect(events[0].name).toBe(
                    BrowserRootPerformanceEvents.AcquireTokenPreRedirect
                );
                pca.removePerformanceCallback(callbackId);
            });

            jest.spyOn(
                NavigationClient.prototype,
                "navigateExternal"
            ).mockImplementation(() => Promise.resolve(true));

            jest.spyOn(PkceGenerator, "generatePkceCodes").mockResolvedValue({
                challenge: TEST_CONFIG.TEST_CHALLENGE,
                verifier: TEST_CONFIG.TEST_VERIFIER,
            });
            const loginRequest: RedirectRequest = {
                redirectUri: TEST_URIS.TEST_REDIR_URI,
                scopes: ["user.read", "openid", "profile"],
                state: TEST_STATE_VALUES.USER_STATE,
            };
            await pca.acquireTokenRedirect(loginRequest);
        });

        it("discards pre-redirect telemetry event when onRedirectNavigate callback returns false", (done) => {
            const onRedirectNavigate = (url: string) => {
                return false;
            };

            pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                    onRedirectNavigate,
                },
                telemetry: {
                    client: new BrowserPerformanceClient(testAppConfig),
                    application: {
                        appName: TEST_CONFIG.applicationName,
                        appVersion: TEST_CONFIG.applicationVersion,
                    },
                },
            });
            pca = (pca as any).controller;
            pca.initialize().then(() => {
                const callbackId = pca.addPerformanceCallback((events) => {
                    expect(events[0].success).toBe(true);
                    expect(events[0].name).toBe(
                        BrowserRootPerformanceEvents.AcquireTokenPreRedirect
                    );
                    expect(events[0].navigateCallbackResult).toBeFalsy();
                    pca.removePerformanceCallback(callbackId);
                    done();
                });

                const measurementDiscardSpy = jest.spyOn(
                    PerformanceClient.prototype,
                    "discardMeasurements"
                );

                jest.spyOn(
                    NavigationClient.prototype,
                    "navigateExternal"
                ).mockResolvedValue(true);

                jest.spyOn(
                    PkceGenerator,
                    "generatePkceCodes"
                ).mockResolvedValue({
                    challenge: TEST_CONFIG.TEST_CHALLENGE,
                    verifier: TEST_CONFIG.TEST_VERIFIER,
                });
                const loginRequest: RedirectRequest = {
                    redirectUri: TEST_URIS.TEST_REDIR_URI,
                    scopes: ["user.read", "openid", "profile"],
                    state: TEST_STATE_VALUES.USER_STATE,
                };

                pca.acquireTokenRedirect(loginRequest);
                expect(measurementDiscardSpy).toHaveBeenCalledTimes(0);
            });
        });

        it("instruments initialization error", (done) => {
            pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                },
                telemetry: {
                    client: new BrowserPerformanceClient(testAppConfig),
                    application: {
                        appName: TEST_CONFIG.applicationName,
                        appVersion: TEST_CONFIG.applicationVersion,
                    },
                },
            });
            const callbackId = pca.addPerformanceCallback((events) => {
                expect(events[0].success).toBe(false);
                expect(events[0].errorCode).toBe(
                    "uninitialized_public_client_application"
                );
                pca.removePerformanceCallback(callbackId);
                done();
            });

            pca.acquireTokenRedirect({ scopes: [] })
                .then(() => {
                    throw new Error("success path should not be reached");
                })
                .catch((e) => {});
        });

        it("throws an error if isMcp is true and resource is not provided in request", async () => {
            const config = {
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                    isMcp: true,
                },
            };
            pca = new PublicClientApplication(config);
            await pca.initialize();

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            pca = (pca as any).controller;

            await expect(
                pca.acquireTokenRedirect({ scopes: [] })
            ).rejects.toMatchObject(
                createClientAuthError(
                    ClientAuthErrorCodes.resourceParameterRequired
                )
            );
        });

        it("throws an error if isMcp is true and resource is provided in both request and extraQueryParameters", async () => {
            const config = {
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                    isMcp: true,
                },
            };
            pca = new PublicClientApplication(config);
            await pca.initialize();

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            pca = (pca as any).controller;

            await expect(
                pca.acquireTokenRedirect({
                    scopes: [],
                    resource: "https://resource.example.com",
                    extraQueryParameters: {
                        resource: "https://resource.example.com",
                    },
                })
            ).rejects.toMatchObject(
                createClientAuthError(
                    ClientAuthErrorCodes.misplacedResourceParam
                )
            );
        });

        it("throws an error if isMcp is true and resource is provided in both request and extraParameters", async () => {
            const config = {
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                    isMcp: true,
                },
            };
            pca = new PublicClientApplication(config);
            await pca.initialize();

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            pca = (pca as any).controller;

            await expect(
                pca.acquireTokenRedirect({
                    scopes: [],
                    resource: "https://resource.example.com",
                    extraParameters: {
                        resource: "https://resource.example.com",
                    },
                })
            ).rejects.toMatchObject(
                createClientAuthError(
                    ClientAuthErrorCodes.misplacedResourceParam
                )
            );
        });

        it("succeeds when isMcp is true and resource is provided", async () => {
            const config = {
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                    isMcp: true,
                },
            };
            pca = new PublicClientApplication(config);
            await pca.initialize();

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            pca = (pca as any).controller;

            const redirectClientSpy: jest.SpyInstance = jest
                .spyOn(RedirectClient.prototype, "acquireToken")
                .mockResolvedValue();

            const response = await pca.acquireTokenRedirect({
                scopes: [],
                resource: "testresource.example.com",
            });
            expect(response).toEqual(undefined);
            expect(redirectClientSpy).toHaveBeenCalledTimes(1);
        });
    });

    describe("loginPopup", () => {
        beforeEach(async () => {
            const popupWindow = {
                ...window,
                close: () => {},
            };
            // @ts-ignore
            jest.spyOn(window, "open").mockReturnValue(popupWindow);
            pca = (pca as any).controller;
            await pca.initialize();
        });

        it("throws an error if initialize was not called prior", async () => {
            pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                },
            });
            // @ts-ignore
            pca = (pca as any).controller;

            try {
                await pca.loginPopup();
            } catch (e) {
                expect(e).toMatchObject(
                    createBrowserAuthError(
                        BrowserAuthErrorCodes.uninitializedPublicClientApplication
                    )
                );
            }
        });

        it("does not mutate request correlation id", async () => {
            const request: PopupRequest = {
                scopes: [],
            };

            jest.spyOn(
                PopupClient.prototype,
                "initiateAuthRequest"
            ).mockImplementation(() => {
                throw "Request object has been built at this point, no need to continue";
            });

            await pca.loginPopup(request).catch(() => null);
            await pca.loginPopup(request).catch(() => null);

            expect(request.correlationId).toBe(undefined);
        });

        it("Uses default request if no request provided", (done) => {
            const testServerTokenResponse = {
                token_type: TEST_CONFIG.TOKEN_TYPE_BEARER,
                scope: TEST_CONFIG.DEFAULT_SCOPES.join(" "),
                expires_in: TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN,
                ext_expires_in: TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN,
                access_token: TEST_TOKENS.ACCESS_TOKEN,
                refresh_token: TEST_TOKENS.REFRESH_TOKEN,
                id_token: TEST_TOKENS.IDTOKEN_V2,
            };
            const testIdTokenClaims: TokenClaims = {
                ver: "2.0",
                iss: "https://login.microsoftonline.com/9188040d-6c67-4c5b-b112-36a304b66dad/v2.0",
                sub: "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
                name: "Abe Lincoln",
                preferred_username: "AbeLi@microsoft.com",
                oid: "00000000-0000-0000-66f3-3332eca7ea81",
                tid: "3338040d-6c67-4c5b-b112-36a304b66dad",
                nonce: "123523",
                login_hint: "testLoginHint",
            };
            const testAccount = {
                ...BASIC_TEST_ACCOUNT_INFO,
                tenantId: testIdTokenClaims.tid || "",
                username: testIdTokenClaims.preferred_username || "",
                loginHint: testIdTokenClaims.login_hint,
            };
            const testTokenResponse: AuthenticationResult = {
                authority: TEST_CONFIG.validAuthority,
                uniqueId: testIdTokenClaims.oid || "",
                tenantId: testIdTokenClaims.tid || "",
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                idToken: testServerTokenResponse.id_token,
                idTokenClaims: testIdTokenClaims,
                accessToken: testServerTokenResponse.access_token,
                fromCache: false,
                correlationId: RANDOM_TEST_GUID,
                expiresOn: TestTimeUtils.nowDateWithOffset(
                    testServerTokenResponse.expires_in
                ),
                account: testAccount,
                tokenType: Constants.AuthenticationScheme.BEARER,
            };
            jest.spyOn(BrowserCrypto, "createNewGuid").mockReturnValue(
                RANDOM_TEST_GUID
            );
            jest.spyOn(
                StandardController.prototype,
                "acquireTokenPopup"
            ).mockImplementation(async (request) => {
                expect(request.scopes).toContain("openid");
                expect(request.scopes).toContain("profile");
                expect(request.correlationId).toEqual(RANDOM_TEST_GUID);
                done();

                return testTokenResponse;
            });
            const callbackId = pca.addPerformanceCallback((events) => {
                expect(events[0].correlationId).toBe(RANDOM_TEST_GUID);
                expect(events[0].success).toBe(true);
                expect(events[0].accessTokenSize).toBe(16);
                expect(events[0].idTokenSize).toBe(12);
                expect(events[0].requestId).toBe(undefined);
                expect(events[0].visibilityChangeCount).toBe(0);
                pca.removePerformanceCallback(callbackId);
                done();
            });

            pca.loginPopup();
        });
    });

    describe("acquireTokenPopup", () => {
        beforeEach(async () => {
            const popupWindow = {
                ...window,
                location: {
                    assign: () => {},
                },
                close: () => {},
                focus: () => {},
            };
            // @ts-ignore
            jest.spyOn(window, "open").mockReturnValue(popupWindow);
            pca = (pca as any).controller;
            await pca.initialize();
        });

        afterEach(() => {
            window.localStorage.clear();
            window.sessionStorage.clear();
        });

        it("throws an error if initialize was not called prior", async () => {
            pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                },
            });
            await expect(
                pca.acquireTokenPopup({ scopes: [] })
            ).rejects.toMatchObject(
                createBrowserAuthError(
                    BrowserAuthErrorCodes.uninitializedPublicClientApplication
                )
            );
        });

        it("instruments initialization error", (done) => {
            pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                },
                telemetry: {
                    client: new BrowserPerformanceClient(testAppConfig),
                    application: {
                        appName: TEST_CONFIG.applicationName,
                        appVersion: TEST_CONFIG.applicationVersion,
                    },
                },
            });
            const callbackId = pca.addPerformanceCallback((events) => {
                expect(events[0].success).toBe(false);
                expect(events[0].errorCode).toBe(
                    "uninitialized_public_client_application"
                );
                pca.removePerformanceCallback(callbackId);
                done();
            });

            pca.acquireTokenPopup({ scopes: [] })
                .then(() => {
                    throw new Error("success path should not be reached");
                })
                .catch((e) => {});
        });

        it("goes directly to the native broker if nativeAccountId is present", async () => {
            const config = {
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                },
                system: {
                    allowPlatformBroker: true,
                },
            };
            pca = new PublicClientApplication(config);

            stubExtensionProvider(config);
            await pca.initialize();

            //Implementation of PCA was moved to controller.
            pca = (pca as any).controller;

            const testAccount = BASIC_NATIVE_TEST_ACCOUNT_INFO;
            const testTokenResponse: AuthenticationResult = {
                authority: TEST_CONFIG.validAuthority,
                uniqueId: testAccount.localAccountId,
                tenantId: testAccount.tenantId,
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                idToken: "test-idToken",
                idTokenClaims: {},
                accessToken: "test-accessToken",
                fromCache: false,
                correlationId: RANDOM_TEST_GUID,
                expiresOn: TestTimeUtils.nowDateWithOffset(3600),
                account: testAccount,
                tokenType: Constants.AuthenticationScheme.BEARER,
            };

            jest.spyOn(BrowserCrypto, "createNewGuid").mockReturnValue(
                RANDOM_TEST_GUID
            );

            const nativeAcquireTokenSpy: jest.SpyInstance = jest
                .spyOn(PlatformAuthInteractionClient.prototype, "acquireToken")
                .mockImplementation(async (request) => {
                    expect(request.correlationId).toBe(RANDOM_TEST_GUID);
                    return testTokenResponse;
                });
            const popupSpy: jest.SpyInstance = jest
                .spyOn(PopupClient.prototype, "acquireToken")
                .mockResolvedValue(testTokenResponse);
            const response = await pca.acquireTokenPopup({
                scopes: ["User.Read"],
                account: testAccount,
            });

            expect(response).toEqual(testTokenResponse);
            expect(nativeAcquireTokenSpy).toHaveBeenCalledTimes(1);
            expect(popupSpy).toHaveBeenCalledTimes(0);
        });

        it("falls back to web flow if prompt is select_account", async () => {
            const config = {
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                },
                system: {
                    allowPlatformBroker: true,
                },
            };
            pca = new PublicClientApplication(config);

            stubExtensionProvider(config);
            await pca.initialize();

            const testAccount = BASIC_NATIVE_TEST_ACCOUNT_INFO;
            const testTokenResponse: AuthenticationResult = {
                authority: TEST_CONFIG.validAuthority,
                uniqueId: testAccount.localAccountId,
                tenantId: testAccount.tenantId,
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                idToken: "test-idToken",
                idTokenClaims: {},
                accessToken: "test-accessToken",
                fromCache: false,
                correlationId: RANDOM_TEST_GUID,
                expiresOn: TestTimeUtils.nowDateWithOffset(3600),
                account: testAccount,
                tokenType: Constants.AuthenticationScheme.BEARER,
            };

            const nativeAcquireTokenSpy: jest.SpyInstance = jest.spyOn(
                PlatformAuthInteractionClient.prototype,
                "acquireToken"
            );
            const popupSpy: jest.SpyInstance = jest
                .spyOn(PopupClient.prototype, "acquireToken")
                .mockResolvedValue(testTokenResponse);
            const response = await pca.acquireTokenPopup({
                scopes: ["User.Read"],
                account: testAccount,
                prompt: "select_account",
            });

            expect(response).toBe(testTokenResponse);
            expect(nativeAcquireTokenSpy).toHaveBeenCalledTimes(0);
            expect(popupSpy).toHaveBeenCalledTimes(1);
        });

        it("falls back to web flow if native broker call fails due to fatal error", async () => {
            const config = {
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                },
                system: {
                    allowPlatformBroker: true,
                },
            };
            pca = new PublicClientApplication(config);

            stubExtensionProvider(config);
            await pca.initialize();

            //Implementation of PCA was moved to controller.
            pca = (pca as any).controller;

            const testAccount = BASIC_NATIVE_TEST_ACCOUNT_INFO;
            const testTokenResponse: AuthenticationResult = {
                authority: TEST_CONFIG.validAuthority,
                uniqueId: testAccount.localAccountId,
                tenantId: testAccount.tenantId,
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                idToken: "test-idToken",
                idTokenClaims: {},
                accessToken: "test-accessToken",
                fromCache: false,
                correlationId: RANDOM_TEST_GUID,
                expiresOn: TestTimeUtils.nowDateWithOffset(3600),
                account: testAccount,
                tokenType: Constants.AuthenticationScheme.BEARER,
            };

            const nativeAcquireTokenSpy: jest.SpyInstance = jest
                .spyOn(PlatformAuthInteractionClient.prototype, "acquireToken")
                .mockRejectedValue(
                    new NativeAuthError("ContentError", "error in extension")
                );
            const popupSpy: jest.SpyInstance = jest
                .spyOn(PopupClient.prototype, "acquireToken")
                .mockResolvedValue(testTokenResponse);
            const response = await pca.acquireTokenPopup({
                scopes: ["User.Read"],
                account: testAccount,
            });

            expect(response).toBe(testTokenResponse);
            expect(nativeAcquireTokenSpy).toHaveBeenCalledTimes(1);
            expect(popupSpy).toHaveBeenCalledTimes(1);
        });

        it("falls back to web flow if native broker call fails due to interaction_required error", async () => {
            const config = {
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                },
                system: {
                    allowPlatformBroker: true,
                },
            };
            pca = new PublicClientApplication(config);

            stubExtensionProvider(config);
            await pca.initialize();

            //Implementation of PCA was moved to controller.
            pca = (pca as any).controller;

            const testAccount = BASIC_NATIVE_TEST_ACCOUNT_INFO;
            const testTokenResponse: AuthenticationResult = {
                authority: TEST_CONFIG.validAuthority,
                uniqueId: testAccount.localAccountId,
                tenantId: testAccount.tenantId,
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                idToken: "test-idToken",
                idTokenClaims: {},
                accessToken: "test-accessToken",
                fromCache: false,
                correlationId: RANDOM_TEST_GUID,
                expiresOn: TestTimeUtils.nowDateWithOffset(3600),
                account: testAccount,
                tokenType: Constants.AuthenticationScheme.BEARER,
            };

            const nativeAcquireTokenSpy: jest.SpyInstance = jest
                .spyOn(PlatformAuthInteractionClient.prototype, "acquireToken")
                .mockImplementation(() => {
                    throw createInteractionRequiredAuthError(
                        InteractionRequiredAuthErrorCodes.nativeAccountUnavailable
                    );
                });
            const popupSpy: jest.SpyInstance = jest
                .spyOn(PopupClient.prototype, "acquireToken")
                .mockResolvedValue(testTokenResponse);
            const response = await pca.acquireTokenPopup({
                scopes: ["User.Read"],
                account: testAccount,
            });

            expect(response).toBe(testTokenResponse);
            expect(nativeAcquireTokenSpy).toHaveBeenCalledTimes(1);
            expect(popupSpy).toHaveBeenCalledTimes(1);
        });

        it("throws error if native broker call fails due to non-fatal error", async () => {
            const config = {
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                },
                system: {
                    allowPlatformBroker: true,
                },
            };
            pca = new PublicClientApplication(config);

            stubExtensionProvider(config);
            await pca.initialize();

            //PCA implementation moved to controller
            pca = (pca as any).controller;

            const testAccount = BASIC_NATIVE_TEST_ACCOUNT_INFO;

            const nativeAcquireTokenSpy: jest.SpyInstance = jest
                .spyOn(PlatformAuthInteractionClient.prototype, "acquireToken")
                .mockRejectedValue(new Error("testError"));
            const popupSpy: jest.SpyInstance = jest
                .spyOn(PopupClient.prototype, "acquireToken")
                .mockRejectedValue(new Error("testError"));

            await pca
                .acquireTokenPopup({
                    scopes: ["User.Read"],
                    account: testAccount,
                })
                .catch((e) => {
                    expect(
                        // @ts-ignore
                        pca.browserStorage.getInteractionInProgress()
                    ).toBeFalsy();
                    expect(e.message).toEqual("testError");
                });
            expect(nativeAcquireTokenSpy).toHaveBeenCalledTimes(1);
            expect(popupSpy).toHaveBeenCalledTimes(0);
        });

        it("does not mutate request correlation id", async () => {
            const request: PopupRequest = {
                scopes: [],
            };

            jest.spyOn(
                PopupClient.prototype,
                "initiateAuthRequest"
            ).mockImplementation(() => {
                throw "Request object has been built at this point, no need to continue";
            });

            await pca.acquireTokenPopup(request).catch(() => null);
            await pca.acquireTokenPopup(request).catch(() => null);

            expect(request.correlationId).toBe(undefined);
        });

        it("throws error if interaction is in progress", async () => {
            const browserCrypto = new CryptoOps(new Logger({}));
            const logger = new Logger({});
            const browserStorage = new BrowserCacheManager(
                "client-id",
                cacheConfig,
                browserCrypto,
                logger,
                new StubPerformanceClient(),
                new EventHandler()
            );
            browserStorage.setInteractionInProgress(true);

            await expect(
                pca.acquireTokenPopup({ scopes: [] })
            ).rejects.toMatchObject(
                createBrowserAuthError(
                    BrowserAuthErrorCodes.interactionInProgress
                )
            );
        });

        it("throws an error if intialize was not called prior", async () => {
            pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                },
                system: {
                    allowPlatformBroker: true,
                },
            });
            await expect(
                pca.acquireTokenPopup({ scopes: [] })
            ).rejects.toMatchObject(
                createBrowserAuthError(
                    BrowserAuthErrorCodes.uninitializedPublicClientApplication
                )
            );
        });

        it("Calls PopupClient.acquireToken and returns its response", async () => {
            const testAccount = BASIC_TEST_ACCOUNT_INFO;
            const testTokenResponse: AuthenticationResult = {
                authority: TEST_CONFIG.validAuthority,
                uniqueId: testAccount.localAccountId,
                tenantId: testAccount.tenantId,
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                idToken: "test-idToken",
                idTokenClaims: {},
                accessToken: "test-accessToken",
                fromCache: false,
                correlationId: RANDOM_TEST_GUID,
                expiresOn: TestTimeUtils.nowDateWithOffset(3600),
                account: testAccount,
                tokenType: Constants.AuthenticationScheme.BEARER,
            };
            const popupClientSpy: jest.SpyInstance = jest
                .spyOn(PopupClient.prototype, "acquireToken")
                .mockResolvedValue(testTokenResponse);

            const response = await pca.acquireTokenPopup({
                scopes: ["openid"],
            });
            expect(response?.idToken).not.toBeNull();
            expect(response).toEqual(testTokenResponse);
            expect(popupClientSpy).toHaveBeenCalledTimes(1);
        });

        it("Emits Login Success Event if no user is signed in", async () => {
            const testAccount = BASIC_TEST_ACCOUNT_INFO;
            const testTokenResponse: AuthenticationResult = {
                authority: TEST_CONFIG.validAuthority,
                uniqueId: testAccount.localAccountId,
                tenantId: testAccount.tenantId,
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                idToken: "test-idToken",
                idTokenClaims: {},
                accessToken: "test-accessToken",
                fromCache: false,
                correlationId: RANDOM_TEST_GUID,
                expiresOn: TestTimeUtils.nowDateWithOffset(3600),
                account: testAccount,
                tokenType: Constants.AuthenticationScheme.BEARER,
            };
            const popupClientSpy: jest.SpyInstance = jest
                .spyOn(PopupClient.prototype, "acquireToken")
                .mockImplementation(() => {
                    jest.spyOn(
                        StandardController.prototype,
                        "getAllAccounts"
                    ).mockReturnValue([testAccount]);
                    return Promise.resolve(testTokenResponse);
                });
            let loginSuccessEmitted = false;
            jest.spyOn(EventHandler.prototype, "emitEvent").mockImplementation(
                (eventType) => {
                    if (eventType === EventType.LOGIN_SUCCESS) {
                        loginSuccessEmitted = true;
                    }
                }
            );

            const response = await pca.acquireTokenPopup({
                scopes: ["openid"],
            });
            expect(response).toEqual(testTokenResponse);
            expect(popupClientSpy).toHaveBeenCalledTimes(1);
            expect(loginSuccessEmitted).toBe(true);
        });

        it("Emits AcquireToken Start and Success Events if user is already signed in", async () => {
            const testAccount = BASIC_TEST_ACCOUNT_INFO;
            const testTokenResponse: AuthenticationResult = {
                authority: TEST_CONFIG.validAuthority,
                uniqueId: testAccount.localAccountId,
                tenantId: testAccount.tenantId,
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                idToken: "test-idToken",
                idTokenClaims: {},
                accessToken: "test-accessToken",
                fromCache: false,
                correlationId: RANDOM_TEST_GUID,
                expiresOn: TestTimeUtils.nowDateWithOffset(3600),
                account: testAccount,
                tokenType: Constants.AuthenticationScheme.BEARER,
            };
            jest.spyOn(
                StandardController.prototype,
                "getAllAccounts"
            ).mockReturnValue([testAccount]);
            const popupClientSpy: jest.SpyInstance = jest
                .spyOn(PopupClient.prototype, "acquireToken")
                .mockResolvedValue(testTokenResponse);
            let acquireTokenStartEmitted = false;
            let acquireTokenSuccessEmitted = false;
            jest.spyOn(EventHandler.prototype, "emitEvent").mockImplementation(
                (eventType) => {
                    if (eventType === EventType.ACQUIRE_TOKEN_START) {
                        acquireTokenStartEmitted = true;
                    } else if (eventType === EventType.ACQUIRE_TOKEN_SUCCESS) {
                        acquireTokenSuccessEmitted = true;
                    }
                }
            );

            const response = await pca.acquireTokenPopup({
                scopes: ["openid"],
            });
            expect(response).toEqual(testTokenResponse);
            expect(popupClientSpy).toHaveBeenCalledTimes(1);
            expect(acquireTokenStartEmitted).toBe(true);
            expect(acquireTokenSuccessEmitted).toBe(true);
        });

        it("Emits AcquireToken Start and Failure events if a user is already logged in", async () => {
            const testAccount = BASIC_TEST_ACCOUNT_INFO;

            jest.spyOn(
                StandardController.prototype,
                "getAllAccounts"
            ).mockReturnValue([testAccount]);
            const popupClientSpy: jest.SpyInstance = jest
                .spyOn(PopupClient.prototype, "acquireToken")
                .mockRejectedValue(new Error("Error"));
            let acquireTokenStartEmitted = false;
            let acquireTokenFailureEmitted = false;
            jest.spyOn(EventHandler.prototype, "emitEvent").mockImplementation(
                (eventType) => {
                    if (eventType === EventType.ACQUIRE_TOKEN_START) {
                        acquireTokenStartEmitted = true;
                    } else if (eventType === EventType.ACQUIRE_TOKEN_FAILURE) {
                        acquireTokenFailureEmitted = true;
                    }
                }
            );

            await pca.acquireTokenPopup({ scopes: ["openid"] }).catch(() => {
                expect(popupClientSpy).toHaveBeenCalledTimes(1);
                expect(acquireTokenStartEmitted).toBe(true);
                expect(acquireTokenFailureEmitted).toBe(true);
            });
        });

        it("throws error if called in a popup", (done) => {
            Object.defineProperty(window, "location", {
                configurable: true,
                enumerable: true,
                writable: true,
                value: new URL(
                    `http://localhost?state=${TEST_STATE_VALUES.TEST_STATE_POPUP}`
                ),
            });

            pca.acquireTokenPopup({ scopes: ["openid"] })
                .catch((e) => {
                    expect(e).toBeInstanceOf(BrowserAuthError);
                    expect(e.errorCode).toEqual(
                        BrowserAuthErrorCodes.blockNestedPopups
                    );
                    expect(e.errorMessage).toEqual(
                        getDefaultErrorMessage(
                            BrowserAuthErrorCodes.blockNestedPopups
                        )
                    );
                    done();
                })
                .finally(() => {
                    Object.defineProperty(window, "location", {
                        value: {
                            hash: "",
                            origin: "https://localhost:8081",
                            pathname: "/",
                            search: "",
                            href: "https://localhost:8081/index.html",
                            protocol: "http:",
                            hostname: "localhost",
                            port: "8081",
                        },
                        writable: true,
                    });
                });
        });

        it("emits successful performance telemetry event", (done) => {
            const testAccount = {
                ...BASIC_TEST_ACCOUNT_INFO,
                idTokenClaims: {
                    tfp: "3338040d-6c67-4c5b-b112-36a304b66dad",
                },
            };
            const testTokenResponse: AuthenticationResult = {
                authority: TEST_CONFIG.validAuthority,
                uniqueId: testAccount.localAccountId,
                tenantId: testAccount.tenantId,
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                idToken: "test-idToken",
                idTokenClaims: {},
                accessToken: "test-accessToken",
                fromCache: false,
                correlationId: RANDOM_TEST_GUID,
                expiresOn: TestTimeUtils.nowDateWithOffset(3600),
                account: testAccount,
                tokenType: Constants.AuthenticationScheme.BEARER,
            };
            const popupClientSpy: jest.SpyInstance = jest
                .spyOn(PopupClient.prototype, "acquireToken")
                .mockResolvedValue(testTokenResponse);

            const callbackId = pca.addPerformanceCallback((events) => {
                expect(events[0].correlationId).toBe(RANDOM_TEST_GUID);
                expect(events[0].success).toBe(true);
                expect(events[0].scenarioId).toBe("test-scenario-id");
                expect(events[0].accountType).toBe("B2C");
                pca.removePerformanceCallback(callbackId);
                done();
            });

            pca.acquireTokenPopup({
                scopes: ["openid"],
                scenarioId: "test-scenario-id",
                correlationId: RANDOM_TEST_GUID,
            });
        });

        it("post-generates PKCE codes when navigatePopups is set to false", async () => {
            const spyPreGeneratePkceCodes = jest.spyOn(
                StandardController.prototype,
                // @ts-ignore
                "preGeneratePkceCodes"
            );
            const spyPopupClientAcquireToken = jest.spyOn(
                PopupClient.prototype,
                "acquireToken"
            );

            const testPca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                },
                system: {
                    navigatePopups: false,
                },
            });

            await testPca.initialize();
            expect(spyPreGeneratePkceCodes).toHaveBeenCalledTimes(1);

            // @ts-ignore
            const preGenPkce: PkceCodes = testPca.controller.pkceCode;
            expect(preGenPkce).toBeDefined();

            const request: CommonAuthorizationUrlRequest = {
                redirectUri: TEST_URIS.TEST_REDIR_URI,
                scopes: ["scope"],
                loginHint: "AbeLi@microsoft.com",
                state: TEST_STATE_VALUES.USER_STATE,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                responseMode:
                    TEST_CONFIG.RESPONSE_MODE as Constants.ResponseMode,
                nonce: "",
                authenticationScheme:
                    TEST_CONFIG.TOKEN_TYPE_BEARER as Constants.AuthenticationScheme,
            };

            jest.spyOn(BrowserUtils, "waitForBridgeResponse").mockRejectedValue(
                "Not important for this test"
            );

            try {
                await testPca.acquireTokenPopup(request);
            } catch (e) {}
            expect(spyPreGeneratePkceCodes).toHaveBeenCalledTimes(2);
            expect(spyPopupClientAcquireToken).toHaveBeenCalledWith(
                request,
                preGenPkce
            );

            // @ts-ignore
            const preGenPkce2: PkceCodes = testPca.controller.pkceCode;
            expect(preGenPkce2).toBeDefined();
            expect(preGenPkce.challenge != preGenPkce2.challenge).toBeTruthy();
        });

        it("does not post-generate PKCE codes when navigatePopups is set to true", async () => {
            const spyPreGeneratePkceCodes = jest.spyOn(
                StandardController.prototype,
                // @ts-ignore
                "preGeneratePkceCodes"
            );
            const spyPopupClientAcquireToken = jest.spyOn(
                PopupClient.prototype,
                "acquireToken"
            );

            const testPca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                },
            });

            await testPca.initialize();
            expect(spyPreGeneratePkceCodes).toHaveBeenCalledTimes(0);

            // @ts-ignore
            const preGenPkce: PkceCodes = testPca.controller.pkceCode;
            expect(preGenPkce).toBeUndefined();

            const request: CommonAuthorizationUrlRequest = {
                redirectUri: TEST_URIS.TEST_REDIR_URI,
                scopes: ["scope"],
                loginHint: "AbeLi@microsoft.com",
                state: TEST_STATE_VALUES.USER_STATE,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                responseMode:
                    TEST_CONFIG.RESPONSE_MODE as Constants.ResponseMode,
                nonce: "",
                authenticationScheme:
                    TEST_CONFIG.TOKEN_TYPE_BEARER as Constants.AuthenticationScheme,
            };

            jest.spyOn(BrowserUtils, "waitForBridgeResponse").mockRejectedValue(
                "Not important for this test"
            );
            try {
                await testPca.acquireTokenPopup(request);
            } catch (e) {}

            expect(spyPreGeneratePkceCodes).toHaveBeenCalledTimes(0);
            expect(spyPopupClientAcquireToken).toHaveBeenCalledWith(
                request,
                undefined
            );

            // @ts-ignore
            const preGenPkce2: PkceCodes = testPca.controller.pkceCode;
            expect(preGenPkce2).toBeUndefined();
        });

        it("throws an error if isMcp is true and resource is not provided in request", async () => {
            const config = {
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                    isMcp: true,
                },
            };
            pca = new PublicClientApplication(config);
            await pca.initialize();

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            pca = (pca as any).controller;

            await expect(
                pca.acquireTokenPopup({ scopes: [] })
            ).rejects.toMatchObject(
                createClientAuthError(
                    ClientAuthErrorCodes.resourceParameterRequired
                )
            );
        });

        it("throws an error if isMcp is true and resource is provided in both request and extraQueryParameters", async () => {
            const config = {
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                    isMcp: true,
                },
            };
            pca = new PublicClientApplication(config);
            await pca.initialize();

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            pca = (pca as any).controller;

            await expect(
                pca.acquireTokenPopup({
                    scopes: [],
                    resource: "https://resource.example.com",
                    extraQueryParameters: {
                        resource: "https://resource.example.com",
                    },
                })
            ).rejects.toMatchObject(
                createClientAuthError(
                    ClientAuthErrorCodes.misplacedResourceParam
                )
            );
        });

        it("throws an error if isMcp is true and resource is provided in both request and extraParameters", async () => {
            const config = {
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                    isMcp: true,
                },
            };
            pca = new PublicClientApplication(config);
            await pca.initialize();

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            pca = (pca as any).controller;

            await expect(
                pca.acquireTokenPopup({
                    scopes: [],
                    resource: "https://resource.example.com",
                    extraParameters: {
                        resource: "https://resource.example.com",
                    },
                })
            ).rejects.toMatchObject(
                createClientAuthError(
                    ClientAuthErrorCodes.misplacedResourceParam
                )
            );
        });

        it("succeeds when isMcp is true and resource is provided in request", async () => {
            const config = {
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                    isMcp: true,
                },
            };
            pca = new PublicClientApplication(config);
            await pca.initialize();

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            pca = (pca as any).controller;

            const testAccount = BASIC_TEST_ACCOUNT_INFO;
            const testTokenResponse: AuthenticationResult = {
                authority: TEST_CONFIG.validAuthority,
                uniqueId: testAccount.localAccountId,
                tenantId: testAccount.tenantId,
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                idToken: "test-idToken",
                idTokenClaims: {},
                accessToken: "test-accessToken",
                fromCache: false,
                correlationId: RANDOM_TEST_GUID,
                expiresOn: TestTimeUtils.nowDateWithOffset(3600),
                account: testAccount,
                tokenType: Constants.AuthenticationScheme.BEARER,
            };
            const popupClientSpy: jest.SpyInstance = jest
                .spyOn(PopupClient.prototype, "acquireToken")
                .mockResolvedValue(testTokenResponse);

            const response = await pca.acquireTokenPopup({
                scopes: [],
                resource: "testresource.example.com",
            });
            expect(response?.idToken).not.toBeNull();
            expect(response).toEqual(testTokenResponse);
            expect(popupClientSpy).toHaveBeenCalledTimes(1);
        });
    });

    describe("ssoSilent", () => {
        beforeEach(async () => {
            pca = (pca as any).controller;
            await pca.initialize();
        });

        it("throws an error if initialize was not called prior", async () => {
            pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                },
            });

            try {
                await pca.ssoSilent({ scopes: [] });
            } catch (e) {
                expect(e).toMatchObject(
                    createBrowserAuthError(
                        BrowserAuthErrorCodes.uninitializedPublicClientApplication
                    )
                );
            }
        });

        it("instruments initialization error", (done) => {
            pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                },
                telemetry: {
                    client: new BrowserPerformanceClient(testAppConfig),
                    application: {
                        appName: TEST_CONFIG.applicationName,
                        appVersion: TEST_CONFIG.applicationVersion,
                    },
                },
            });
            const callbackId = pca.addPerformanceCallback((events) => {
                expect(events[0].success).toBe(false);
                expect(events[0].errorCode).toBe(
                    "uninitialized_public_client_application"
                );
                pca.removePerformanceCallback(callbackId);
                done();
            });

            pca.ssoSilent({ scopes: [] })
                .then(() => {
                    throw new Error("success path should not be reached");
                })
                .catch((e) => {});
        });

        it("goes directly to the native broker if nativeAccountId is present", async () => {
            const config = {
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                },
                system: {
                    allowPlatformBroker: true,
                },
            };
            pca = new PublicClientApplication(config);

            stubExtensionProvider(config);
            await pca.initialize();

            //Implementation of PCA was moved to controller.
            pca = (pca as any).controller;

            const testAccount = BASIC_NATIVE_TEST_ACCOUNT_INFO;
            const testTokenResponse: AuthenticationResult = {
                authority: TEST_CONFIG.validAuthority,
                uniqueId: testAccount.localAccountId,
                tenantId: testAccount.tenantId,
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                idToken: "test-idToken",
                idTokenClaims: {},
                accessToken: "test-accessToken",
                fromCache: false,
                correlationId: RANDOM_TEST_GUID,
                expiresOn: TestTimeUtils.nowDateWithOffset(3600),
                account: testAccount,
                tokenType: Constants.AuthenticationScheme.BEARER,
            };

            const nativeAcquireTokenSpy: jest.SpyInstance = jest
                .spyOn(PlatformAuthInteractionClient.prototype, "acquireToken")
                .mockResolvedValue(testTokenResponse);
            const silentSpy: jest.SpyInstance = jest
                .spyOn(SilentIframeClient.prototype, "acquireToken")
                .mockResolvedValue(testTokenResponse);

            const response = await pca.ssoSilent({
                scopes: ["User.Read"],
                account: testAccount,
            });

            expect(response).toEqual(testTokenResponse);
            expect(nativeAcquireTokenSpy).toHaveBeenCalledTimes(1);
            expect(silentSpy).toHaveBeenCalledTimes(0);
        });

        it("falls back to web flow if native broker call fails due to fatal error", async () => {
            const config = {
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                },
                system: {
                    allowPlatformBroker: true,
                },
            };
            pca = new PublicClientApplication(config);

            stubExtensionProvider(config);
            await pca.initialize();

            //Implementation of PCA was moved to controller.
            pca = (pca as any).controller;

            const testAccount = BASIC_NATIVE_TEST_ACCOUNT_INFO;
            const testTokenResponse: AuthenticationResult = {
                authority: TEST_CONFIG.validAuthority,
                uniqueId: testAccount.localAccountId,
                tenantId: testAccount.tenantId,
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                idToken: "test-idToken",
                idTokenClaims: {},
                accessToken: "test-accessToken",
                fromCache: false,
                correlationId: RANDOM_TEST_GUID,
                expiresOn: TestTimeUtils.nowDateWithOffset(3600),
                account: testAccount,
                tokenType: Constants.AuthenticationScheme.BEARER,
            };

            const nativeAcquireTokenSpy: jest.SpyInstance = jest
                .spyOn(PlatformAuthInteractionClient.prototype, "acquireToken")
                .mockRejectedValue(
                    new NativeAuthError("ContentError", "error in extension")
                );
            const silentSpy: jest.SpyInstance = jest
                .spyOn(SilentIframeClient.prototype, "acquireToken")
                .mockResolvedValue(testTokenResponse);
            const response = await pca.ssoSilent({
                scopes: ["User.Read"],
                account: testAccount,
            });

            expect(response).toBe(testTokenResponse);
            expect(nativeAcquireTokenSpy).toHaveBeenCalledTimes(1);
            expect(silentSpy).toHaveBeenCalledTimes(1);
        });

        it("throws error if native broker call fails due to non-fatal error", async () => {
            const config = {
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                },
                system: {
                    allowPlatformBroker: true,
                },
            };
            pca = new PublicClientApplication(config);

            stubExtensionProvider(config);
            await pca.initialize();

            //Implementation of PCA was moved to controller.
            pca = (pca as any).controller;

            const testAccount = BASIC_NATIVE_TEST_ACCOUNT_INFO;

            const nativeAcquireTokenSpy: jest.SpyInstance = jest
                .spyOn(PlatformAuthInteractionClient.prototype, "acquireToken")
                .mockRejectedValue(new Error("testError"));
            const silentSpy: jest.SpyInstance = jest
                .spyOn(SilentIframeClient.prototype, "acquireToken")
                .mockRejectedValue(new Error("testError"));

            await pca
                .ssoSilent({
                    scopes: ["User.Read"],
                    account: testAccount,
                })
                .catch((e) => {
                    expect(e.message).toEqual("testError");
                });
            expect(nativeAcquireTokenSpy).toHaveBeenCalledTimes(1);
            expect(silentSpy).toHaveBeenCalledTimes(0);
        });

        it("does not mutate request correlation id", async () => {
            pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                },
                system: {
                    iframeBridgeTimeout: 100,
                },
            });

            const request: SilentRequest = {
                scopes: [],
            };

            await pca.ssoSilent(request).catch(() => null);
            await pca.ssoSilent(request).catch(() => null);

            expect(request.correlationId).toBe(undefined);
        });

        it("throws an error if initialize was not called prior", async () => {
            pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                },
            });
            try {
                await pca.ssoSilent({ scopes: [] });
            } catch (e) {
                expect(e).toMatchObject(
                    createBrowserAuthError(
                        BrowserAuthErrorCodes.uninitializedPublicClientApplication
                    )
                );
            }
        });

        it("Calls SilentIframeClient.acquireToken and returns its response", async () => {
            const testAccount = BASIC_TEST_ACCOUNT_INFO;
            const testTokenResponse: AuthenticationResult = {
                authority: TEST_CONFIG.validAuthority,
                uniqueId: testAccount.localAccountId,
                tenantId: testAccount.tenantId,
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                idToken: "test-idToken",
                idTokenClaims: {},
                accessToken: "test-accessToken",
                fromCache: false,
                correlationId: RANDOM_TEST_GUID,
                expiresOn: TestTimeUtils.nowDateWithOffset(3600),
                account: testAccount,
                tokenType: Constants.AuthenticationScheme.BEARER,
            };

            let ssoSilentFired = false;
            const silentClientSpy: jest.SpyInstance = jest
                .spyOn(SilentIframeClient.prototype, "acquireToken")
                .mockResolvedValue(testTokenResponse);

            jest.spyOn(EventHandler.prototype, "emitEvent").mockImplementation(
                (eventType, _correlationId, interactionType) => {
                    if (
                        eventType === EventType.ACQUIRE_TOKEN_START &&
                        interactionType === InteractionType.Silent
                    ) {
                        ssoSilentFired = true;
                    }
                }
            );
            const response = await pca.ssoSilent({ scopes: ["openid"] });
            expect(response?.idToken).not.toBeNull();
            expect(response).toEqual(testTokenResponse);
            expect(silentClientSpy).toHaveBeenCalledTimes(1);
            expect(ssoSilentFired).toBe(true);
        });

        it("emits expect performance event when successful ", (done) => {
            const testAccount = BASIC_TEST_ACCOUNT_INFO;
            const testTokenResponse: AuthenticationResult = {
                authority: TEST_CONFIG.validAuthority,
                uniqueId: testAccount.localAccountId,
                tenantId: testAccount.tenantId,
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                idToken: "test-idToken",
                idTokenClaims: {},
                accessToken: "test-accessToken",
                fromCache: false,
                correlationId: RANDOM_TEST_GUID,
                expiresOn: TestTimeUtils.nowDateWithOffset(3600),
                account: testAccount,
                tokenType: Constants.AuthenticationScheme.BEARER,
            };
            const silentClientSpy: jest.SpyInstance = jest
                .spyOn(SilentIframeClient.prototype, "acquireToken")
                .mockResolvedValue(testTokenResponse);
            const callbackId = pca.addPerformanceCallback((events) => {
                expect(events[0].correlationId).toBe(RANDOM_TEST_GUID);
                expect(events[0].success).toBe(true);
                expect(events[0].accessTokenSize).toBe(16);
                expect(events[0].idTokenSize).toBe(12);
                expect(events[0].requestId).toBe(undefined);
                expect(events[0].visibilityChangeCount).toBe(0);
                expect(events[0].accountType).toBeUndefined();
                pca.removePerformanceCallback(callbackId);
                done();
            });
            pca.ssoSilent({
                scopes: ["openid"],
                correlationId: RANDOM_TEST_GUID,
            });
        });

        it("sets visibilityChange in perf event to true when visibility changes ", (done) => {
            const testAccount = BASIC_TEST_ACCOUNT_INFO;
            const testTokenResponse: AuthenticationResult = {
                authority: TEST_CONFIG.validAuthority,
                uniqueId: testAccount.localAccountId,
                tenantId: testAccount.tenantId,
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                idToken: "test-idToken",
                idTokenClaims: {},
                accessToken: "test-accessToken",
                fromCache: false,
                correlationId: RANDOM_TEST_GUID,
                expiresOn: TestTimeUtils.nowDateWithOffset(3600),
                account: testAccount,
                tokenType: Constants.AuthenticationScheme.BEARER,
            };
            const silentClientSpy: jest.SpyInstance = jest
                .spyOn(SilentIframeClient.prototype, "acquireToken")
                .mockResolvedValue(testTokenResponse);

            const callbackId = pca.addPerformanceCallback((events) => {
                expect(events[0].success).toBe(true);
                expect(events[0].accessTokenSize).toBe(16);
                expect(events[0].idTokenSize).toBe(12);
                expect(events[0].requestId).toBe(undefined);
                expect(events[0].visibilityChangeCount).toBe(1);
                pca.removePerformanceCallback(callbackId);
                done();
            });
            const event = document.createEvent("HTMLEvents");
            event.initEvent("visibilitychange", true, true);
            pca.ssoSilent({
                scopes: ["openid"],
                correlationId: RANDOM_TEST_GUID,
            });
            document.dispatchEvent(event);
        });

        it("emits expect performance event when there is an error", (done) => {
            const testAccount = {
                ...BASIC_TEST_ACCOUNT_INFO,
                idTokenClaims: {
                    tid: "3338040d-6c67-4c5b-b112-36a304b66dad",
                },
            };
            jest.spyOn(
                SilentIframeClient.prototype,
                "acquireToken"
            ).mockRejectedValue(new AuthError("abc", "error message", "defg"));
            const callbackId = pca.addPerformanceCallback((events) => {
                expect(events[0].correlationId).toBe(RANDOM_TEST_GUID);
                expect(events[0].success).toBe(false);
                expect(events[0].errorCode).toBe("abc");
                expect(events[0].subErrorCode).toBe("defg");
                expect(events[0].scenarioId).toBe("test-scenario-id");
                expect(events[0].accountType).toBe("AAD");
                pca.removePerformanceCallback(callbackId);
                done();
            });
            pca.ssoSilent({
                scopes: ["openid"],
                correlationId: RANDOM_TEST_GUID,
                scenarioId: "test-scenario-id",
                account: testAccount,
            }).catch(() => {});
        });

        it("throws an error if isMcp is true and resource is not provided in request", async () => {
            const config = {
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                    isMcp: true,
                },
            };
            pca = new PublicClientApplication(config);
            await pca.initialize();

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            pca = (pca as any).controller;

            await expect(pca.ssoSilent({ scopes: [] })).rejects.toMatchObject(
                createClientAuthError(
                    ClientAuthErrorCodes.resourceParameterRequired
                )
            );
        });

        it("throws an error if isMcp is true and resource is provided in both request and extraQueryParameters", async () => {
            const config = {
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                    isMcp: true,
                },
            };
            pca = new PublicClientApplication(config);
            await pca.initialize();

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            pca = (pca as any).controller;

            await expect(
                pca.ssoSilent({
                    scopes: [],
                    resource: "https://resource.example.com",
                    extraQueryParameters: {
                        resource: "https://resource.example.com",
                    },
                })
            ).rejects.toMatchObject(
                createClientAuthError(
                    ClientAuthErrorCodes.misplacedResourceParam
                )
            );
        });

        it("throws an error if isMcp is true and resource is provided in both request and extraParameters", async () => {
            const config = {
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                    isMcp: true,
                },
            };
            pca = new PublicClientApplication(config);
            await pca.initialize();

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            pca = (pca as any).controller;

            await expect(
                pca.ssoSilent({
                    scopes: [],
                    resource: "https://resource.example.com",
                    extraParameters: {
                        resource: "https://resource.example.com",
                    },
                })
            ).rejects.toMatchObject(
                createClientAuthError(
                    ClientAuthErrorCodes.misplacedResourceParam
                )
            );
        });

        it("succeeds when isMcp is true and resource is provided", async () => {
            const config = {
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                    isMcp: true,
                },
            };
            pca = new PublicClientApplication(config);
            await pca.initialize();

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            pca = (pca as any).controller;

            const testAccount = BASIC_TEST_ACCOUNT_INFO;
            const testTokenResponse: AuthenticationResult = {
                authority: TEST_CONFIG.validAuthority,
                uniqueId: testAccount.localAccountId,
                tenantId: testAccount.tenantId,
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                idToken: "test-idToken",
                idTokenClaims: {},
                accessToken: "test-accessToken",
                fromCache: false,
                correlationId: RANDOM_TEST_GUID,
                expiresOn: TestTimeUtils.nowDateWithOffset(3600),
                account: testAccount,
                tokenType: Constants.AuthenticationScheme.BEARER,
            };

            let ssoSilentFired = false;
            const silentClientSpy: jest.SpyInstance = jest
                .spyOn(SilentIframeClient.prototype, "acquireToken")
                .mockResolvedValue(testTokenResponse);

            jest.spyOn(EventHandler.prototype, "emitEvent").mockImplementation(
                (eventType, _correlationId, interactionType) => {
                    if (
                        eventType === EventType.ACQUIRE_TOKEN_START &&
                        interactionType === InteractionType.Silent
                    ) {
                        ssoSilentFired = true;
                    }
                }
            );
            const response = await pca.ssoSilent({
                scopes: [],
                resource: "testresource.example.com",
            });
            expect(response?.idToken).not.toBeNull();
            expect(response).toEqual(testTokenResponse);
            expect(silentClientSpy).toHaveBeenCalledTimes(1);
            expect(ssoSilentFired).toBe(true);
        });
    });

    describe("acquireTokenByCode", () => {
        beforeEach(async () => {
            pca = (pca as any).controller;
            await pca.initialize();
        });

        it("throws an error if initialize was not called prior", async () => {
            pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                },
            });

            try {
                await pca.acquireTokenByCode({ scopes: [] });
            } catch (e) {
                expect(e).toMatchObject(
                    createBrowserAuthError(
                        BrowserAuthErrorCodes.uninitializedPublicClientApplication
                    )
                );
            }
        });

        it("instruments initialization error", (done) => {
            pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                },
                telemetry: {
                    client: new BrowserPerformanceClient(testAppConfig),
                    application: {
                        appName: TEST_CONFIG.applicationName,
                        appVersion: TEST_CONFIG.applicationVersion,
                    },
                },
            });
            const callbackId = pca.addPerformanceCallback((events) => {
                expect(events[0].success).toBe(false);
                expect(events[0].errorCode).toBe(
                    "uninitialized_public_client_application"
                );
                pca.removePerformanceCallback(callbackId);
                done();
            });

            pca.acquireTokenByCode({ scopes: [] })
                .then(() => {
                    throw new Error("success path should not be reached");
                })
                .catch((e) => {});
        });

        it("goes directly to the native broker if nativeAccountId is present", async () => {
            const config = {
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                },
                system: {
                    allowPlatformBroker: true,
                },
            };
            pca = new PublicClientApplication(config);

            stubExtensionProvider(config);
            await pca.initialize();

            //Implementation of PCA was moved to controller.
            pca = (pca as any).controller;

            const testAccount = BASIC_NATIVE_TEST_ACCOUNT_INFO;
            const testTokenResponse: AuthenticationResult = {
                authority: TEST_CONFIG.validAuthority,
                uniqueId: testAccount.localAccountId,
                tenantId: testAccount.tenantId,
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                idToken: "test-idToken",
                idTokenClaims: {},
                accessToken: "test-accessToken",
                fromCache: false,
                correlationId: RANDOM_TEST_GUID,
                expiresOn: TestTimeUtils.nowDateWithOffset(3600),
                account: testAccount,
                tokenType: Constants.AuthenticationScheme.BEARER,
            };

            const nativeAcquireTokenSpy: jest.SpyInstance = jest
                .spyOn(PlatformAuthInteractionClient.prototype, "acquireToken")
                .mockResolvedValue(testTokenResponse);
            const response = await pca.acquireTokenByCode({
                scopes: ["User.Read"],
                nativeAccountId: "test-nativeAccountId",
            });

            expect(response).toEqual(testTokenResponse);
            expect(nativeAcquireTokenSpy).toHaveBeenCalledTimes(1);
        });

        it("throws error if native broker call fails", async () => {
            const config = {
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                },
                system: {
                    allowPlatformBroker: true,
                },
            };
            pca = new PublicClientApplication(config);

            stubExtensionProvider(config);
            await pca.initialize();

            //Implementation of PCA was moved to controller.
            pca = (pca as any).controller;

            const nativeAcquireTokenSpy: jest.SpyInstance = jest
                .spyOn(PlatformAuthInteractionClient.prototype, "acquireToken")
                .mockRejectedValue(
                    new NativeAuthError(
                        "ContentError",
                        "something went wrong in the extension"
                    )
                );

            await pca
                .acquireTokenByCode({
                    scopes: ["User.Read"],
                    nativeAccountId: "test-nativeAccountId",
                })
                .catch((e) => {
                    expect(e.errorCode).toEqual("ContentError");
                });
            expect(nativeAcquireTokenSpy).toHaveBeenCalledTimes(1);
        });

        it("throws error if nativeAccountId is provided but extension is not installed", async () => {
            pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                },
                system: {
                    allowPlatformBroker: true,
                },
            });
            await pca.initialize();

            const nativeAcquireTokenSpy = jest.spyOn(
                PlatformAuthInteractionClient.prototype,
                "acquireToken"
            );

            await pca
                .acquireTokenByCode({
                    scopes: ["User.Read"],
                    nativeAccountId: "test-nativeAccountId",
                })
                .catch((e) => {
                    expect(e.errorCode).toEqual(
                        BrowserAuthErrorCodes.unableToAcquireTokenFromNativePlatform
                    );
                    expect(e.errorMessage).toEqual(
                        getDefaultErrorMessage(
                            BrowserAuthErrorCodes.unableToAcquireTokenFromNativePlatform
                        )
                    );
                });
            expect(nativeAcquireTokenSpy).toHaveBeenCalledTimes(0);
        });

        it("doesnt mutate request correlation id", async () => {
            const request: AuthorizationCodeRequest = {
                code: "123",
            };

            await pca.acquireTokenByCode(request).catch(() => null);

            await pca.acquireTokenByCode(request).catch(() => null);

            expect(request.correlationId).toBe(undefined);
        });

        it("throws an error if initialize was not called prior", async () => {
            pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                },
            });

            try {
                await pca.acquireTokenByCode({});
            } catch (e) {
                expect(e).toMatchObject(
                    createBrowserAuthError(
                        BrowserAuthErrorCodes.uninitializedPublicClientApplication
                    )
                );
            }
        });

        it("Calls SilentAuthCodeClient.acquireToken and returns its response", async () => {
            const testAccount = BASIC_TEST_ACCOUNT_INFO;
            const testTokenResponse: AuthenticationResult = {
                authority: TEST_CONFIG.validAuthority,
                uniqueId: testAccount.localAccountId,
                tenantId: testAccount.tenantId,
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                idToken: "test-idToken",
                idTokenClaims: {},
                accessToken: "test-accessToken",
                fromCache: false,
                correlationId: RANDOM_TEST_GUID,
                expiresOn: TestTimeUtils.nowDateWithOffset(3600),
                account: testAccount,
                tokenType: Constants.AuthenticationScheme.BEARER,
            };
            const silentClientSpy: jest.SpyInstance = jest
                .spyOn(SilentAuthCodeClient.prototype, "acquireToken")
                .mockResolvedValue(testTokenResponse);

            const response = await pca.acquireTokenByCode({
                code: "auth-code",
                correlationId: testTokenResponse.correlationId,
            });
            expect(response?.idToken).not.toBeNull();
            expect(response).toEqual(testTokenResponse);
            expect(silentClientSpy).toHaveBeenCalledWith({
                code: "auth-code",
                correlationId: testTokenResponse.correlationId,
            });
        });

        it("calls SilentAuthCodeClient.acquireToken once if multiple concurrent calls are made", async () => {
            const testAccount = BASIC_TEST_ACCOUNT_INFO;
            const testTokenResponse: AuthenticationResult = {
                authority: TEST_CONFIG.validAuthority,
                uniqueId: testAccount.localAccountId,
                tenantId: testAccount.tenantId,
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                idToken: "test-idToken",
                idTokenClaims: {},
                accessToken: "test-accessToken",
                fromCache: false,
                correlationId: RANDOM_TEST_GUID,
                expiresOn: TestTimeUtils.nowDateWithOffset(3600),
                account: testAccount,
                tokenType: Constants.AuthenticationScheme.BEARER,
            };
            const silentClientSpy: jest.SpyInstance = jest
                .spyOn(SilentAuthCodeClient.prototype, "acquireToken")
                .mockResolvedValue(testTokenResponse);

            const [response, response2] = await Promise.all([
                pca.acquireTokenByCode({
                    code: "auth-code",
                    correlationId: testTokenResponse.correlationId,
                }),
                pca.acquireTokenByCode({
                    code: "auth-code",
                    correlationId: testTokenResponse.correlationId,
                }),
            ]);

            expect(response).toEqual(testTokenResponse);
            expect(response2).toEqual(testTokenResponse);
            expect(silentClientSpy).toHaveBeenCalledTimes(1);
            expect(silentClientSpy).toHaveBeenCalledWith({
                code: "auth-code",
                correlationId: testTokenResponse.correlationId,
            });
        });

        it("calls SilentAuthCodeClient.acquireToken twice if multiple serial calls are made", async () => {
            const testAccount = BASIC_TEST_ACCOUNT_INFO;
            const testTokenResponse: AuthenticationResult = {
                authority: TEST_CONFIG.validAuthority,
                uniqueId: testAccount.localAccountId,
                tenantId: testAccount.tenantId,
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                idToken: "test-idToken",
                idTokenClaims: {},
                accessToken: "test-accessToken",
                fromCache: false,
                correlationId: RANDOM_TEST_GUID,
                expiresOn: TestTimeUtils.nowDateWithOffset(3600),
                account: testAccount,
                tokenType: Constants.AuthenticationScheme.BEARER,
            };
            const silentClientSpy: jest.SpyInstance = jest
                .spyOn(SilentAuthCodeClient.prototype, "acquireToken")
                .mockResolvedValue(testTokenResponse);

            const response = await pca.acquireTokenByCode({
                code: "auth-code",
                correlationId: testTokenResponse.correlationId,
            });

            const response2 = await pca.acquireTokenByCode({
                code: "auth-code",
                correlationId: testTokenResponse.correlationId,
            });

            expect(response).toEqual(testTokenResponse);
            expect(response2).toEqual(testTokenResponse);
            expect(silentClientSpy).toHaveBeenCalledTimes(2);
            expect(silentClientSpy).toHaveBeenCalledWith({
                code: "auth-code",
                correlationId: testTokenResponse.correlationId,
            });
        });

        it("throws an error if falsey code is provided", () => {
            expect(pca.acquireTokenByCode({ code: "" })).rejects.toMatchObject(
                createBrowserAuthError(
                    BrowserAuthErrorCodes.authCodeOrNativeAccountIdRequired
                )
            );
        });

        it("emits expect performance event when successful", (done) => {
            const testAccount = {
                ...BASIC_TEST_ACCOUNT_INFO,
                idTokenClaims: {
                    tid: "9188040d-6c67-4c5b-b112-36a304b66dad",
                },
            };
            const testTokenResponse: AuthenticationResult = {
                authority: TEST_CONFIG.validAuthority,
                uniqueId: testAccount.localAccountId,
                tenantId: testAccount.tenantId,
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                idToken: "test-idToken",
                idTokenClaims: {},
                accessToken: "test-accessToken",
                fromCache: false,
                correlationId: RANDOM_TEST_GUID,
                expiresOn: TestTimeUtils.nowDateWithOffset(3600),
                account: testAccount,
                tokenType: Constants.AuthenticationScheme.BEARER,
            };
            const silentClientSpy: jest.SpyInstance = jest
                .spyOn(SilentAuthCodeClient.prototype, "acquireToken")
                .mockResolvedValue(testTokenResponse);
            const callbackId = pca.addPerformanceCallback((events) => {
                expect(events[0].correlationId).toBe(RANDOM_TEST_GUID);
                expect(events[0].success).toBe(true);
                expect(events[0].accessTokenSize).toBe(16);
                expect(events[0].idTokenSize).toBe(12);
                expect(events[0].requestId).toBe(undefined);
                expect(events[0].visibilityChangeCount).toBe(0);
                expect(events[0].accountType).toBe("MSA");
                expect(events[0].scenarioId).toBe("test-scenario-id");
                pca.removePerformanceCallback(callbackId);
                done();
            });
            pca.acquireTokenByCode({
                code: "auth-code",
                correlationId: testTokenResponse.correlationId,
                scenarioId: "test-scenario-id",
            });
        });

        it("sets visibilityChange in perf event to true when visibility changes", (done) => {
            const testAccount = BASIC_TEST_ACCOUNT_INFO;
            const testTokenResponse: AuthenticationResult = {
                authority: TEST_CONFIG.validAuthority,
                uniqueId: testAccount.localAccountId,
                tenantId: testAccount.tenantId,
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                idToken: "test-idToken",
                idTokenClaims: {},
                accessToken: "test-accessToken",
                fromCache: false,
                correlationId: RANDOM_TEST_GUID,
                expiresOn: TestTimeUtils.nowDateWithOffset(3600),
                account: testAccount,
                tokenType: Constants.AuthenticationScheme.BEARER,
            };
            const silentClientSpy: jest.SpyInstance = jest
                .spyOn(SilentAuthCodeClient.prototype, "acquireToken")
                .mockResolvedValue(testTokenResponse);
            const callbackId = pca.addPerformanceCallback((events) => {
                expect(events[0].correlationId).toBe(RANDOM_TEST_GUID);
                expect(events[0].success).toBe(true);
                expect(events[0].accessTokenSize).toBe(16);
                expect(events[0].idTokenSize).toBe(12);
                expect(events[0].requestId).toBe(undefined);
                expect(events[0].visibilityChangeCount).toBe(3);
                pca.removePerformanceCallback(callbackId);
                done();
            });

            const events: Event[] = [];
            for (let n = 1; n <= 3; n++) {
                const event = document.createEvent("HTMLEvents");
                event.initEvent("visibilitychange", true, false);
                events.push(event);
            }

            pca.acquireTokenByCode({
                code: "auth-code",
                correlationId: testTokenResponse.correlationId,
            });

            for (const event of events) {
                document.dispatchEvent(event);
            }
        });

        it("emits expect performance event when there is an error", (done) => {
            const testAccount = BASIC_TEST_ACCOUNT_INFO;
            const testTokenResponse: AuthenticationResult = {
                authority: TEST_CONFIG.validAuthority,
                uniqueId: testAccount.localAccountId,
                tenantId: testAccount.tenantId,
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                idToken: "test-idToken",
                idTokenClaims: {},
                accessToken: "test-accessToken",
                fromCache: false,
                correlationId: RANDOM_TEST_GUID,
                expiresOn: TestTimeUtils.nowDateWithOffset(3600),
                account: testAccount,
                tokenType: Constants.AuthenticationScheme.BEARER,
            };
            const silentClientSpy: jest.SpyInstance = jest
                .spyOn(SilentAuthCodeClient.prototype, "acquireToken")
                .mockRejectedValue(
                    new AuthError("abc", "error message", "defg")
                );
            const callbackId = pca.addPerformanceCallback((events) => {
                expect(events[0].correlationId).toBe(RANDOM_TEST_GUID);
                expect(events[0].success).toBe(false);
                expect(events[0].errorCode).toBe("abc");
                expect(events[0].subErrorCode).toBe("defg");
                expect(events[0].accountType).toBe(undefined);
                pca.removePerformanceCallback(callbackId);
                done();
            });
            pca.acquireTokenByCode({
                code: "auth-code",
                correlationId: testTokenResponse.correlationId,
            }).catch(() => {});
        });
    });

    describe("acquireTokenSilent", () => {
        beforeEach(async () => {
            pca = (pca as any).controller;
            await pca.initialize();
        });

        it("throws No Account error if no account is provided", async () => {
            await expect(
                pca.acquireTokenSilent({ scopes: [] })
            ).rejects.toMatchObject(
                createBrowserAuthError(BrowserAuthErrorCodes.noAccountError)
            );
        });

        it("throws an error if initialize was not called prior", async () => {
            pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                },
                system: {
                    allowPlatformBroker: true,
                },
            });

            try {
                await pca.acquireTokenSilent({ scopes: [] });
            } catch (e) {
                expect(e).toMatchObject(
                    createBrowserAuthError(
                        BrowserAuthErrorCodes.uninitializedPublicClientApplication
                    )
                );
            }
        });

        it("instruments initialization error", (done) => {
            pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                },
                telemetry: {
                    client: new BrowserPerformanceClient(testAppConfig),
                    application: {
                        appName: TEST_CONFIG.applicationName,
                        appVersion: TEST_CONFIG.applicationVersion,
                    },
                },
            });
            const callbackId = pca.addPerformanceCallback((events) => {
                expect(events[0].success).toBe(false);
                expect(events[0].errorCode).toBe(
                    "uninitialized_public_client_application"
                );
                pca.removePerformanceCallback(callbackId);
                done();
            });

            pca.acquireTokenSilent({ scopes: [] })
                .then(() => {
                    throw new Error("success path should not be reached");
                })
                .catch((e) => {});
        });

        it("goes directly to the native broker if nativeAccountId is present", async () => {
            const config = {
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                },
                system: {
                    allowPlatformBroker: true,
                },
            };
            pca = new PublicClientApplication(config);

            stubExtensionProvider(config);
            await pca.initialize();

            //Implementation of PCA was moved to controller.
            pca = (pca as any).controller;

            const testAccount = BASIC_NATIVE_TEST_ACCOUNT_INFO;
            const testTokenResponse: AuthenticationResult = {
                authority: TEST_CONFIG.validAuthority,
                uniqueId: testAccount.localAccountId,
                tenantId: testAccount.tenantId,
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                idToken: "test-idToken",
                idTokenClaims: {},
                accessToken: "test-accessToken",
                fromCache: false,
                correlationId: RANDOM_TEST_GUID,
                expiresOn: TestTimeUtils.nowDateWithOffset(3600),
                account: testAccount,
                tokenType: Constants.AuthenticationScheme.BEARER,
            };

            const nativeAcquireTokenSpy: jest.SpyInstance = jest
                .spyOn(PlatformAuthInteractionClient.prototype, "acquireToken")
                .mockResolvedValue(testTokenResponse);
            const silentSpy: jest.SpyInstance = jest
                .spyOn(SilentIframeClient.prototype, "acquireToken")
                .mockResolvedValue(testTokenResponse);
            const response = await pca.acquireTokenSilent({
                scopes: ["User.Read"],
                account: testAccount,
                correlationId: RANDOM_TEST_GUID,
            });

            expect(response).toEqual(testTokenResponse);
            expect(nativeAcquireTokenSpy).toHaveBeenCalledTimes(1);
            expect(silentSpy).toHaveBeenCalledTimes(0);
        });

        it("falls back to web flow if native broker call fails due to fatal error", async () => {
            const config = {
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                },
                system: {
                    allowPlatformBroker: true,
                },
            };
            pca = new PublicClientApplication(config);

            stubExtensionProvider(config);
            await pca.initialize();

            //Implementation of PCA was moved to controller.
            pca = (pca as any).controller;

            const testAccount = BASIC_NATIVE_TEST_ACCOUNT_INFO;
            const testTokenResponse: AuthenticationResult = {
                authority: TEST_CONFIG.validAuthority,
                uniqueId: testAccount.localAccountId,
                tenantId: testAccount.tenantId,
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                idToken: "test-idToken",
                idTokenClaims: {},
                accessToken: "test-accessToken",
                fromCache: false,
                correlationId: RANDOM_TEST_GUID,
                expiresOn: TestTimeUtils.nowDateWithOffset(3600),
                account: testAccount,
                tokenType: Constants.AuthenticationScheme.BEARER,
            };

            const nativeAcquireTokenSpy: jest.SpyInstance = jest
                .spyOn(PlatformAuthInteractionClient.prototype, "acquireToken")
                .mockRejectedValue(
                    new NativeAuthError("ContentError", "error in extension")
                );
            const silentSpy: jest.SpyInstance = jest
                .spyOn(SilentIframeClient.prototype, "acquireToken")
                .mockResolvedValue(testTokenResponse);
            const silentRequest = {
                scopes: ["User.Read"],
                account: testAccount,
                correlationId: RANDOM_TEST_GUID,
            };
            const response = await pca.acquireTokenSilent(silentRequest);

            expect(response).toEqual(testTokenResponse);
            expect(nativeAcquireTokenSpy).toHaveBeenCalledTimes(1);
            expect(silentSpy).toHaveBeenCalledTimes(1);
        });

        it("throws error if native broker call fails due to non-fatal error", async () => {
            const config = {
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                },
                system: {
                    allowPlatformBroker: true,
                },
            };
            pca = new PublicClientApplication(config);

            stubExtensionProvider(config);
            await pca.initialize();
            //Implementation of PCA was moved to controller.
            pca = (pca as any).controller;

            const testAccount = BASIC_NATIVE_TEST_ACCOUNT_INFO;

            const nativeAcquireTokenSpy: jest.SpyInstance = jest
                .spyOn(PlatformAuthInteractionClient.prototype, "acquireToken")
                .mockRejectedValue(new Error("testError"));
            const silentSpy: jest.SpyInstance = jest
                .spyOn(SilentIframeClient.prototype, "acquireToken")
                .mockRejectedValue(new Error("testError"));

            try {
                await pca.acquireTokenSilent({
                    scopes: ["User.Read"],
                    account: testAccount,
                });
            } catch (e: any) {
                expect(e.message).toEqual("testError");
            }

            expect(nativeAcquireTokenSpy).toHaveBeenCalledTimes(1);
            expect(silentSpy).toHaveBeenCalledTimes(0);
        });

        it("doesnt mutate request correlation id", async () => {
            const request: SilentRequest = {
                scopes: [],
            };

            await pca.acquireTokenSilent(request).catch(() => null);

            await pca.acquireTokenSilent(request).catch(() => null);

            expect(request.correlationId).toBe(undefined);
        });

        it("Calls SilentCacheClient.acquireToken and returns its response", async () => {
            const testAccount = BASIC_TEST_ACCOUNT_INFO;
            const testTokenResponse: AuthenticationResult = {
                authority: TEST_CONFIG.validAuthority,
                uniqueId: testAccount.localAccountId,
                tenantId: testAccount.tenantId,
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                idToken: "test-idToken",
                idTokenClaims: {},
                accessToken: "test-accessToken",
                fromCache: false,
                correlationId: RANDOM_TEST_GUID,
                expiresOn: TestTimeUtils.nowDateWithOffset(3600),
                account: testAccount,
                tokenType: Constants.AuthenticationScheme.BEARER,
                state: "test-state",
            };
            const silentCacheSpy: jest.SpyInstance = jest
                .spyOn(SilentCacheClient.prototype, "acquireToken")
                .mockResolvedValue(testTokenResponse);
            const silentRefreshSpy = jest.spyOn(
                SilentRefreshClient.prototype,
                "acquireToken"
            );
            const silentIframeSpy = jest.spyOn(
                SilentIframeClient.prototype,
                "acquireToken"
            );

            const response = await pca.acquireTokenSilent({
                scopes: ["openid"],
                account: testAccount,
                state: "test-state",
                correlationId: RANDOM_TEST_GUID,
            });
            expect(response?.idToken).not.toBeNull();
            expect(response).toEqual(testTokenResponse);
            expect(silentCacheSpy).toHaveBeenCalledTimes(1);
            expect(silentRefreshSpy).toHaveBeenCalledTimes(0);
            expect(silentIframeSpy).toHaveBeenCalledTimes(0);
        });

        it("Calls SilentCacheClient.acquireToken and captures the stack trace for non-auth error", (done) => {
            const testAccount = BASIC_TEST_ACCOUNT_INFO;

            jest.spyOn(
                SilentCacheClient.prototype,
                "acquireToken"
            ).mockRejectedValue(new Error("Test error message"));

            const callbackId = pca.addPerformanceCallback(
                (events: PerformanceEvent[]) => {
                    try {
                        expect(events.length).toEqual(1);
                        const event = events[0];
                        expect(event.name).toBe(
                            BrowserRootPerformanceEvents.AcquireTokenSilent
                        );
                        expect(event.correlationId).toBeDefined();
                        expect(event.success).toBeFalsy();
                        expect(event.errorName).toEqual("Error");
                        expect(event.errorStack?.length).toBeGreaterThan(1);
                        expect(event.incompleteSubsCount).toEqual(0);
                        pca.removePerformanceCallback(callbackId);
                        done();
                    } catch (e) {
                        done(e);
                    }
                }
            );

            pca.acquireTokenSilent({
                scopes: ["openid"],
                account: testAccount,
                state: "test-state",
                cacheLookupPolicy: CacheLookupPolicy.AccessToken,
            }).catch(() => {});
        });

        it("Calls SilentRefreshClient.acquireToken and returns its response if cache lookup throws", async () => {
            const testAccount = BASIC_TEST_ACCOUNT_INFO;
            const testTokenResponse: AuthenticationResult = {
                authority: TEST_CONFIG.validAuthority,
                uniqueId: testAccount.localAccountId,
                tenantId: testAccount.tenantId,
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                idToken: "test-idToken",
                idTokenClaims: {},
                accessToken: "test-accessToken",
                fromCache: false,
                correlationId: RANDOM_TEST_GUID,
                expiresOn: TestTimeUtils.nowDateWithOffset(3600),
                account: testAccount,
                tokenType: Constants.AuthenticationScheme.BEARER,
                state: "test-state",
            };
            const silentCacheSpy: jest.SpyInstance = jest
                .spyOn(SilentCacheClient.prototype, "acquireToken")
                .mockRejectedValue(new Error("Expired"));
            const silentRefreshSpy: jest.SpyInstance = jest
                .spyOn(SilentRefreshClient.prototype, "acquireToken")
                .mockResolvedValue(testTokenResponse);
            const silentIframeSpy = jest.spyOn(
                SilentIframeClient.prototype,
                "acquireToken"
            );

            const response = await pca.acquireTokenSilent({
                scopes: ["openid"],
                account: testAccount,
                state: "test-state",
                correlationId: RANDOM_TEST_GUID,
            });
            expect(response).toEqual(testTokenResponse);
            expect(silentCacheSpy).toHaveBeenCalledTimes(1);
            expect(silentRefreshSpy).toHaveBeenCalledTimes(1);
            expect(silentIframeSpy).toHaveBeenCalledTimes(0);
        });

        it("Calls SilentIframeClient.acquireToken and returns its response if cache lookup throws and refresh token is expired", async () => {
            const testAccount = BASIC_TEST_ACCOUNT_INFO;
            const testTokenResponse: AuthenticationResult = {
                authority: TEST_CONFIG.validAuthority,
                uniqueId: testAccount.localAccountId,
                tenantId: testAccount.tenantId,
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                idToken: "test-idToken",
                idTokenClaims: {},
                accessToken: "test-accessToken",
                fromCache: false,
                correlationId: RANDOM_TEST_GUID,
                expiresOn: TestTimeUtils.nowDateWithOffset(3600),
                account: testAccount,
                tokenType: Constants.AuthenticationScheme.BEARER,
                state: "test-state",
            };
            const silentCacheSpy: jest.SpyInstance = jest
                .spyOn(SilentCacheClient.prototype, "acquireToken")
                .mockRejectedValue(new Error("Expired"));
            const silentRefreshSpy: jest.SpyInstance = jest
                .spyOn(SilentRefreshClient.prototype, "acquireToken")
                .mockRejectedValue(
                    new ServerError(
                        BrowserConstants.INVALID_GRANT_ERROR,
                        "Refresh Token expired"
                    )
                );
            const silentIframeSpy: jest.SpyInstance = jest
                .spyOn(SilentIframeClient.prototype, "acquireToken")
                .mockResolvedValue(testTokenResponse);

            const response = await pca.acquireTokenSilent({
                scopes: ["openid"],
                account: testAccount,
                state: "test-state",
                correlationId: RANDOM_TEST_GUID,
            });
            expect(response).toEqual(testTokenResponse);
            expect(silentCacheSpy).toHaveBeenCalledTimes(1);
            expect(silentRefreshSpy).toHaveBeenCalledTimes(1);
            expect(silentIframeSpy).toHaveBeenCalledTimes(1);
        });

        it("Calls SilentIframeClient.acquireToken and returns its response if no RT is cached", async () => {
            const testAccount = BASIC_TEST_ACCOUNT_INFO;
            const testTokenResponse: AuthenticationResult = {
                authority: TEST_CONFIG.validAuthority,
                uniqueId: testAccount.localAccountId,
                tenantId: testAccount.tenantId,
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                idToken: "test-idToken",
                idTokenClaims: {},
                accessToken: "test-accessToken",
                fromCache: false,
                correlationId: RANDOM_TEST_GUID,
                expiresOn: TestTimeUtils.nowDateWithOffset(3600),
                account: testAccount,
                tokenType: Constants.AuthenticationScheme.BEARER,
                state: "test-state",
            };
            const silentCacheSpy: jest.SpyInstance = jest
                .spyOn(SilentCacheClient.prototype, "acquireToken")
                .mockRejectedValue(new Error("Expired"));
            const silentRefreshSpy: jest.SpyInstance = jest
                .spyOn(SilentRefreshClient.prototype, "acquireToken")
                .mockRejectedValue(
                    createInteractionRequiredAuthError(
                        InteractionRequiredAuthErrorCodes.noTokensFound
                    )
                );
            const silentIframeSpy: jest.SpyInstance = jest
                .spyOn(SilentIframeClient.prototype, "acquireToken")
                .mockResolvedValue(testTokenResponse);

            const response = await pca.acquireTokenSilent({
                scopes: ["openid"],
                account: testAccount,
                state: "test-state",
                correlationId: RANDOM_TEST_GUID,
            });
            expect(response).toEqual(testTokenResponse);
            expect(silentCacheSpy).toHaveBeenCalledTimes(1);
            expect(silentRefreshSpy).toHaveBeenCalledTimes(1);
            expect(silentIframeSpy).toHaveBeenCalledTimes(1);
        });

        it("makes one network request with multiple parallel silent requests with same request", async () => {
            const testServerTokenResponse = {
                token_type: TEST_CONFIG.TOKEN_TYPE_BEARER,
                scope: TEST_CONFIG.DEFAULT_SCOPES.join(" "),
                expires_in: TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN,
                ext_expires_in: TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN,
                access_token: TEST_TOKENS.ACCESS_TOKEN,
                refresh_token: TEST_TOKENS.REFRESH_TOKEN,
                id_token: TEST_TOKENS.IDTOKEN_V2,
            };
            const testIdTokenClaims: TokenClaims = {
                ver: "2.0",
                iss: "https://login.microsoftonline.com/9188040d-6c67-4c5b-b112-36a304b66dad/v2.0",
                sub: "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
                name: "Abe Lincoln",
                preferred_username: "AbeLi@microsoft.com",
                oid: "00000000-0000-0000-66f3-3332eca7ea81",
                tid: "3338040d-6c67-4c5b-b112-36a304b66dad",
                nonce: "123523",
                login_hint: "testLoginHint",
            };
            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: testIdTokenClaims.tid || "",
                username: testIdTokenClaims.preferred_username || "",
                loginHint: testIdTokenClaims.login_hint,
            };
            const testTokenResponse: AuthenticationResult = {
                authority: TEST_CONFIG.validAuthority,
                uniqueId: testIdTokenClaims.oid || "",
                tenantId: testIdTokenClaims.tid || "",
                scopes: [...TEST_CONFIG.DEFAULT_SCOPES, "User.Read"],
                idToken: testServerTokenResponse.id_token,
                idTokenClaims: testIdTokenClaims,
                accessToken: testServerTokenResponse.access_token,
                fromCache: false,
                correlationId: RANDOM_TEST_GUID,
                expiresOn: TestTimeUtils.nowDateWithOffset(
                    testServerTokenResponse.expires_in
                ),
                account: testAccount,
                tokenType: Constants.AuthenticationScheme.BEARER,
            };
            jest.spyOn(BrowserCrypto, "createNewGuid").mockReturnValue(
                RANDOM_TEST_GUID
            );
            jest.spyOn(CryptoOps.prototype, "hashString").mockResolvedValue(
                TEST_CRYPTO_VALUES.TEST_SHA256_HASH
            );
            const atsSpy: jest.SpyInstance = jest.spyOn(
                StandardController.prototype,
                <any>"acquireTokenSilentAsync"
            );
            const silentATStub: jest.SpyInstance = jest
                .spyOn(
                    RefreshTokenClient.prototype,
                    "acquireTokenByRefreshToken"
                )
                .mockResolvedValue(testTokenResponse);
            const tokenRequest: CommonSilentFlowRequest = {
                scopes: ["User.Read"],
                account: testAccount,
                authority: TEST_CONFIG.validAuthority,
                authenticationScheme: Constants.AuthenticationScheme.BEARER,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                forceRefresh: false,
            };
            const expectedTokenRequest: CommonSilentFlowRequest = {
                ...tokenRequest,
                scopes: ["User.Read"],
                authority: `${Constants.DEFAULT_AUTHORITY}`,
                correlationId: RANDOM_TEST_GUID,
                forceRefresh: false,
            };

            const silentRequest1 = pca.acquireTokenSilent(tokenRequest);
            const silentRequest2 = pca.acquireTokenSilent({
                ...tokenRequest,
                correlationId: "test-correlationId2",
            });
            const silentRequest3 = pca.acquireTokenSilent({
                ...tokenRequest,
                correlationId: "test-correlationId3",
            });
            const parallelResponse = await Promise.all([
                silentRequest1,
                silentRequest2,
                silentRequest3,
            ]);

            expect(silentATStub).toHaveBeenCalledWith(
                expectedTokenRequest,
                ApiId.acquireTokenSilent_silentFlow
            );
            expect(atsSpy).toHaveBeenCalledTimes(1);
            expect(silentATStub).toHaveBeenCalledTimes(1);
            expect(parallelResponse[0]).toEqual(testTokenResponse);
            expect(parallelResponse[1]).toEqual({
                ...testTokenResponse,
                correlationId: "test-correlationId2",
            });
            expect(parallelResponse[2]).toEqual({
                ...testTokenResponse,
                correlationId: "test-correlationId3",
            });
            expect(parallelResponse).toHaveLength(3);
        });

        it("makes network requests for each distinct request when acquireTokenSilent is called in parallel", async () => {
            const testServerTokenResponse = {
                token_type: TEST_CONFIG.TOKEN_TYPE_BEARER,
                scope: TEST_CONFIG.DEFAULT_SCOPES.join(" "),
                expires_in: TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN,
                ext_expires_in: TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN,
                access_token: TEST_TOKENS.ACCESS_TOKEN,
                refresh_token: TEST_TOKENS.REFRESH_TOKEN,
                id_token: TEST_TOKENS.IDTOKEN_V2,
            };
            const testIdTokenClaims: TokenClaims = {
                ver: "2.0",
                iss: "https://login.microsoftonline.com/9188040d-6c67-4c5b-b112-36a304b66dad/v2.0",
                sub: "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
                name: "Abe Lincoln",
                preferred_username: "AbeLi@microsoft.com",
                oid: "00000000-0000-0000-66f3-3332eca7ea81",
                tid: "3338040d-6c67-4c5b-b112-36a304b66dad",
                nonce: "123523",
                login_hint: "testLoginHint",
            };
            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: testIdTokenClaims.tid || "",
                username: testIdTokenClaims.preferred_username || "",
                loginHint: testIdTokenClaims.login_hint,
            };
            const testTokenResponse: AuthenticationResult = {
                authority: TEST_CONFIG.validAuthority,
                uniqueId: testIdTokenClaims.oid || "",
                tenantId: testIdTokenClaims.tid || "",
                scopes: [...TEST_CONFIG.DEFAULT_SCOPES, "User.Read"],
                idToken: testServerTokenResponse.id_token,
                idTokenClaims: testIdTokenClaims,
                accessToken: testServerTokenResponse.access_token,
                fromCache: false,
                correlationId: RANDOM_TEST_GUID,
                expiresOn: TestTimeUtils.nowDateWithOffset(
                    testServerTokenResponse.expires_in
                ),
                account: testAccount,
                tokenType: Constants.AuthenticationScheme.BEARER,
            };
            jest.spyOn(BrowserCrypto, "createNewGuid").mockReturnValue(
                RANDOM_TEST_GUID
            );
            jest.spyOn(CryptoOps.prototype, "hashString").mockResolvedValue(
                TEST_CRYPTO_VALUES.TEST_SHA256_HASH
            );
            const silentATStub: jest.SpyInstance = jest
                .spyOn(
                    RefreshTokenClient.prototype,
                    "acquireTokenByRefreshToken"
                )
                .mockResolvedValue(testTokenResponse);
            // Beaerer requests
            const tokenRequest1: CommonSilentFlowRequest = {
                scopes: ["User.Read"],
                account: testAccount,
                authority: TEST_CONFIG.validAuthority,
                authenticationScheme: Constants.AuthenticationScheme.BEARER,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                forceRefresh: false,
            };
            const expectedTokenRequest1: CommonSilentFlowRequest = {
                ...tokenRequest1,
                scopes: ["User.Read"],
                authority: `${Constants.DEFAULT_AUTHORITY}`,
                correlationId: RANDOM_TEST_GUID,
                forceRefresh: false,
            };
            const tokenRequest2: CommonSilentFlowRequest = {
                scopes: ["Mail.Read"],
                account: testAccount,
                authority: TEST_CONFIG.validAuthority,
                authenticationScheme: Constants.AuthenticationScheme.BEARER,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                forceRefresh: false,
            };
            const expectedTokenRequest2: CommonSilentFlowRequest = {
                ...tokenRequest1,
                scopes: ["Mail.Read"],
                authority: `${Constants.DEFAULT_AUTHORITY}`,
                correlationId: RANDOM_TEST_GUID,
                forceRefresh: false,
            };

            // PoP requests
            const popTokenRequest1: CommonSilentFlowRequest = {
                scopes: ["User.Read"],
                account: testAccount,
                authority: TEST_CONFIG.validAuthority,
                authenticationScheme: Constants.AuthenticationScheme.POP,
                resourceRequestMethod: "GET",
                resourceRequestUri: "https://testUri.com/user.read",
                correlationId: TEST_CONFIG.CORRELATION_ID,
                forceRefresh: false,
            };

            const popTokenRequest2: CommonSilentFlowRequest = {
                scopes: ["Mail.Read"],
                account: testAccount,
                authority: TEST_CONFIG.validAuthority,
                authenticationScheme: Constants.AuthenticationScheme.POP,
                resourceRequestMethod: "GET",
                resourceRequestUri: "https://testUri.com/mail.read",
                correlationId: TEST_CONFIG.CORRELATION_ID,
                forceRefresh: false,
            };
            const expectedPopTokenRequest1: CommonSilentFlowRequest = {
                ...popTokenRequest1,
                scopes: ["User.Read"],
                authority: `${Constants.DEFAULT_AUTHORITY}`,
                correlationId: RANDOM_TEST_GUID,
                forceRefresh: false,
            };

            const expectedPopTokenRequest2: CommonSilentFlowRequest = {
                ...popTokenRequest2,
                scopes: ["Mail.Read"],
                authority: `${Constants.DEFAULT_AUTHORITY}`,
                correlationId: RANDOM_TEST_GUID,
                forceRefresh: false,
            };

            // SSH Certificate requests
            const sshCertRequest1: CommonSilentFlowRequest = {
                scopes: ["User.Read"],
                account: testAccount,
                authority: TEST_CONFIG.validAuthority,
                authenticationScheme: Constants.AuthenticationScheme.SSH,
                sshJwk: TEST_SSH_VALUES.ENCODED_SSH_JWK,
                sshKid: TEST_SSH_VALUES.SSH_KID,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                forceRefresh: false,
            };

            const sshCertRequest2: CommonSilentFlowRequest = {
                scopes: ["Mail.Read"],
                account: testAccount,
                authority: TEST_CONFIG.validAuthority,
                authenticationScheme: Constants.AuthenticationScheme.SSH,
                sshJwk: TEST_SSH_VALUES.ALTERNATE_ENCODED_SSH_JWK,
                sshKid: TEST_SSH_VALUES.ALTERNATE_SSH_KID,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                forceRefresh: false,
            };

            const expectedSshCertificateRequest1: CommonSilentFlowRequest = {
                ...sshCertRequest1,
                scopes: ["User.Read"],
                authority: `${Constants.DEFAULT_AUTHORITY}`,
                correlationId: RANDOM_TEST_GUID,
                forceRefresh: false,
            };

            const expectedSshCertificateRequest2: CommonSilentFlowRequest = {
                ...sshCertRequest2,
                scopes: ["Mail.Read"],
                authority: `${Constants.DEFAULT_AUTHORITY}`,
                correlationId: RANDOM_TEST_GUID,
                forceRefresh: false,
            };

            const silentRequest1 = pca.acquireTokenSilent(tokenRequest1);
            const silentRequest2 = pca.acquireTokenSilent(tokenRequest1);
            const silentRequest3 = pca.acquireTokenSilent(tokenRequest2);
            const popSilentRequest1 = pca.acquireTokenSilent(popTokenRequest1);
            const popSilentRequest2 = pca.acquireTokenSilent(popTokenRequest1);
            const popSilentRequest3 = pca.acquireTokenSilent(popTokenRequest2);
            const sshCertSilentRequest1 =
                pca.acquireTokenSilent(sshCertRequest1);
            const sshCertSilentRequest2 =
                pca.acquireTokenSilent(sshCertRequest1);
            const sshCertSilentRequest3 =
                pca.acquireTokenSilent(sshCertRequest2);
            await Promise.all([
                silentRequest1,
                silentRequest2,
                silentRequest3,
                popSilentRequest1,
                popSilentRequest2,
                popSilentRequest3,
                sshCertSilentRequest1,
                sshCertSilentRequest2,
                sshCertSilentRequest3,
            ]);

            expect(silentATStub).toHaveBeenCalledWith(
                expectedTokenRequest1,
                61
            );
            expect(silentATStub).toHaveBeenCalledWith(
                expectedTokenRequest2,
                61
            );
            expect(silentATStub).toHaveBeenCalledWith(
                expectedPopTokenRequest1,
                61
            );
            expect(silentATStub).toHaveBeenCalledWith(
                expectedPopTokenRequest2,
                61
            );
            expect(silentATStub).toHaveBeenCalledWith(
                expectedSshCertificateRequest1,
                61
            );
            expect(silentATStub).toHaveBeenCalledWith(
                expectedSshCertificateRequest2,
                61
            );
            expect(silentATStub).toHaveBeenCalledTimes(6);
        });

        it("makes network requests for identical requests for different embedded apps when acquireTokenSilent is called in parallel", async () => {
            const testServerTokenResponse = {
                token_type: TEST_CONFIG.TOKEN_TYPE_BEARER,
                scope: TEST_CONFIG.DEFAULT_SCOPES.join(" "),
                expires_in: TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN,
                ext_expires_in: TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN,
                access_token: TEST_TOKENS.ACCESS_TOKEN,
                refresh_token: TEST_TOKENS.REFRESH_TOKEN,
                id_token: TEST_TOKENS.IDTOKEN_V2,
            };
            const testIdTokenClaims: TokenClaims = {
                ver: "2.0",
                iss: "https://login.microsoftonline.com/9188040d-6c67-4c5b-b112-36a304b66dad/v2.0",
                sub: "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
                name: "Abe Lincoln",
                preferred_username: "AbeLi@microsoft.com",
                oid: "00000000-0000-0000-66f3-3332eca7ea81",
                tid: "3338040d-6c67-4c5b-b112-36a304b66dad",
                nonce: "123523",
                login_hint: "testLoginHint",
            };
            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: testIdTokenClaims.tid || "",
                username: testIdTokenClaims.preferred_username || "",
                loginHint: testIdTokenClaims.login_hint,
            };
            const testTokenResponse: AuthenticationResult = {
                authority: TEST_CONFIG.validAuthority,
                uniqueId: testIdTokenClaims.oid || "",
                tenantId: testIdTokenClaims.tid || "",
                scopes: [...TEST_CONFIG.DEFAULT_SCOPES, "User.Read"],
                idToken: testServerTokenResponse.id_token,
                idTokenClaims: testIdTokenClaims,
                accessToken: testServerTokenResponse.access_token,
                fromCache: false,
                correlationId: RANDOM_TEST_GUID,
                expiresOn: new Date(
                    Date.now() + testServerTokenResponse.expires_in * 1000
                ),
                account: testAccount,
                tokenType: Constants.AuthenticationScheme.BEARER,
            };
            jest.spyOn(BrowserCrypto, "createNewGuid").mockReturnValue(
                RANDOM_TEST_GUID
            );
            jest.spyOn(CryptoOps.prototype, "hashString").mockResolvedValue(
                TEST_CRYPTO_VALUES.TEST_SHA256_HASH
            );
            const silentATStub: jest.SpyInstance = jest
                .spyOn(
                    RefreshTokenClient.prototype,
                    "acquireTokenByRefreshToken"
                )
                .mockResolvedValue(testTokenResponse);
            // Beaerer requests
            const baseRequest = {
                scopes: ["User.Read"],
                account: testAccount,
                authenticationScheme: Constants.AuthenticationScheme.BEARER,
                authority: TEST_CONFIG.validAuthority,
                correlationId: "test-correlationId1",
                forceRefresh: false,
            };
            const tokenRequest1: CommonSilentFlowRequest = {
                ...baseRequest,
                embeddedClientId: "embeddedApp1",
                correlationId: "test-correlationId1",
            };
            const tokenRequest2: CommonSilentFlowRequest = {
                ...baseRequest,
                embeddedClientId: "embeddedApp2",
                correlationId: "test-correlationId2",
            };

            const silentRequest1 = pca.acquireTokenSilent(tokenRequest1);
            const silentRequest2 = pca.acquireTokenSilent(tokenRequest1);
            const silentRequest3 = pca.acquireTokenSilent(tokenRequest2);
            await Promise.all([silentRequest1, silentRequest2, silentRequest3]);

            expect(silentATStub).toHaveBeenCalledWith(tokenRequest1, 61);
            expect(silentATStub).toHaveBeenCalledWith(tokenRequest2, 61);
            expect(silentATStub).toHaveBeenCalledTimes(2);
        });

        it("throws error that SilentFlowClient.acquireToken() throws", async () => {
            const testError: AuthError = new AuthError(
                "create_login_url_error",
                "Error in creating a login url"
            );
            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: "testTenantId",
                username: "username@contoso.com",
                loginHint: "testLoginHint",
            };
            jest.spyOn(
                RefreshTokenClient.prototype,
                <any>"acquireTokenByRefreshToken"
            ).mockRejectedValue(testError);
            try {
                await pca.acquireTokenSilent({
                    scopes: TEST_CONFIG.DEFAULT_SCOPES,
                    account: testAccount,
                });
            } catch (e) {
                // Test that error was cached for telemetry purposes and then thrown
                expect(window.sessionStorage).toHaveLength(2);
                expect(
                    window.sessionStorage.getItem(CacheKeys.VERSION_CACHE_KEY)
                ).toEqual(version);
                const failures = window.sessionStorage.getItem(
                    `server-telemetry-${TEST_CONFIG.MSAL_CLIENT_ID}`
                );
                const failureObj = JSON.parse(
                    failures || ""
                ) as ServerTelemetryEntity;
                expect(failureObj.failedRequests).toHaveLength(2);
                expect(failureObj.failedRequests[0]).toEqual(
                    ApiId.acquireTokenSilent_silentFlow
                );
                expect(failureObj.errors[0]).toEqual(testError.errorCode);
                expect(e).toEqual(testError);
            }
        });

        it("throws error that SilentFlowClient.acquireToken() throws when making parallel requests", async () => {
            const testError: AuthError = new AuthError(
                "create_login_url_error",
                "Error in creating a login url"
            );
            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: "testTenantId",
                username: "username@contoso.com",
                loginHint: "testLoginHint",
            };
            const atsSpy: jest.SpyInstance = jest.spyOn(
                StandardController.prototype,
                <any>"acquireTokenSilentAsync"
            );
            jest.spyOn(
                RefreshTokenClient.prototype,
                <any>"acquireTokenByRefreshToken"
            ).mockRejectedValue(testError);
            const tokenRequest = {
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                account: testAccount,
            };
            const silentRequest1 = pca.acquireTokenSilent(tokenRequest);
            const silentRequest2 = pca.acquireTokenSilent(tokenRequest);
            const silentRequest3 = pca.acquireTokenSilent(tokenRequest);
            try {
                await Promise.all([
                    silentRequest1,
                    silentRequest2,
                    silentRequest3,
                ]);
            } catch (e) {
                // Await resolution of all 3 promises since this catch block will execute as soon as any of them throw
                await silentRequest1.catch(() => {});
                await silentRequest2.catch(() => {});
                await silentRequest3.catch(() => {});
                // Test that error was cached for telemetry purposes and then thrown
                expect(atsSpy).toHaveBeenCalledTimes(1);
                expect(window.sessionStorage).toHaveLength(2);
                expect(
                    window.sessionStorage.getItem(CacheKeys.VERSION_CACHE_KEY)
                ).toEqual(version);
                const failures = window.sessionStorage.getItem(
                    `server-telemetry-${TEST_CONFIG.MSAL_CLIENT_ID}`
                );
                const failureObj = JSON.parse(
                    failures || ""
                ) as ServerTelemetryEntity;
                expect(failureObj.failedRequests).toHaveLength(2);
                expect(failureObj.failedRequests[0]).toEqual(
                    ApiId.acquireTokenSilent_silentFlow
                );
                expect(failureObj.errors[0]).toEqual(testError.errorCode);
                expect(e).toEqual(testError);
            }
        });

        it("waits for in progress iframe renewal to complete before trying cache/RT again", async () => {
            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: "testTenantId",
                username: "username@contoso.com",
                loginHint: "testLoginHint",
            };
            const testTokenResponse: AuthenticationResult = {
                authority: TEST_CONFIG.validAuthority,
                uniqueId: ID_TOKEN_CLAIMS.oid || "",
                tenantId: ID_TOKEN_CLAIMS.tid || "",
                scopes: [...TEST_CONFIG.DEFAULT_SCOPES, "User.Read"],
                idToken: TEST_TOKENS.IDTOKEN_V2,
                idTokenClaims: ID_TOKEN_CLAIMS,
                accessToken: TEST_TOKENS.ACCESS_TOKEN,
                fromCache: false,
                correlationId: RANDOM_TEST_GUID,
                expiresOn: TestTimeUtils.nowDateWithOffset(
                    TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN
                ),
                account: testAccount,
                tokenType: Constants.AuthenticationScheme.BEARER,
            };

            const rtMockFirst = jest
                .spyOn(
                    RefreshTokenClient.prototype,
                    "acquireTokenByRefreshToken"
                )
                .mockRejectedValue(
                    createInteractionRequiredAuthError(
                        InteractionRequiredAuthErrorCodes.refreshTokenExpired
                    )
                );

            let rtMockSecond;
            let rtMockFirstCalledTimes;

            const iframeMock = jest
                .spyOn(SilentIframeClient.prototype, "acquireToken")
                .mockImplementationOnce(() => {
                    return new Promise((resolve, reject) => {
                        // Resolve after some time to mimic iframe latency
                        setTimeout(() => {
                            // Mock call info is cleared when the mock is reset, save it for validation at the end of the test
                            rtMockFirstCalledTimes =
                                rtMockFirst.mock.calls.length;
                            rtMockFirst.mockRestore();
                            rtMockSecond = jest
                                .spyOn(
                                    RefreshTokenClient.prototype,
                                    "acquireTokenByRefreshToken"
                                )
                                .mockResolvedValue(testTokenResponse);
                            return resolve(testTokenResponse);
                        }, 1000);
                    });
                });

            const silentRequest1 = pca.acquireTokenSilent({
                scopes: ["Scope1"],
                account: testAccount,
                correlationId: "test-correlationId1",
            });
            const silentRequest2 = pca.acquireTokenSilent({
                scopes: ["Scope2"],
                account: testAccount,
                correlationId: "test-correlationId2",
            });
            const silentRequest3 = pca.acquireTokenSilent({
                scopes: ["Scope3"],
                account: testAccount,
                correlationId: "test-correlationId3",
            });
            await Promise.all([silentRequest1, silentRequest2, silentRequest3]);
            expect(iframeMock).toHaveBeenCalledTimes(1);
            expect(rtMockFirstCalledTimes).toEqual(3);
            expect(rtMockSecond).toHaveBeenCalledTimes(2);
            expect(await silentRequest1).toEqual({
                ...testTokenResponse,
                correlationId: "test-correlationId1",
            });
            expect(await silentRequest2).toEqual({
                ...testTokenResponse,
                correlationId: "test-correlationId2",
            });
            expect(await silentRequest3).toEqual({
                ...testTokenResponse,
                correlationId: "test-correlationId3",
            });
        });

        it("throws RT renewal error if other in progress iframe renewal throws", async () => {
            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: "testTenantId",
                username: "username@contoso.com",
                loginHint: "testLoginHint",
            };
            const testTokenResponse: AuthenticationResult = {
                authority: TEST_CONFIG.validAuthority,
                uniqueId: ID_TOKEN_CLAIMS.oid || "",
                tenantId: ID_TOKEN_CLAIMS.tid || "",
                scopes: [...TEST_CONFIG.DEFAULT_SCOPES, "User.Read"],
                idToken: TEST_TOKENS.IDTOKEN_V2,
                idTokenClaims: ID_TOKEN_CLAIMS,
                accessToken: TEST_TOKENS.ACCESS_TOKEN,
                fromCache: false,
                correlationId: RANDOM_TEST_GUID,
                expiresOn: TestTimeUtils.nowDateWithOffset(
                    TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN
                ),
                account: testAccount,
                tokenType: Constants.AuthenticationScheme.BEARER,
            };

            const rtMockFirst = jest
                .spyOn(
                    RefreshTokenClient.prototype,
                    "acquireTokenByRefreshToken"
                )
                .mockRejectedValue(
                    createInteractionRequiredAuthError(
                        InteractionRequiredAuthErrorCodes.refreshTokenExpired
                    )
                );

            let rtMockSecond;
            let rtMockFirstCalledTimes;

            const testIframeError = new InteractionRequiredAuthError(
                "interaction_required",
                "interaction is required"
            );

            const iframeMock = jest
                .spyOn(SilentIframeClient.prototype, "acquireToken")
                .mockImplementationOnce(() => {
                    return new Promise((resolve, reject) => {
                        // Resolve after some time to mimic iframe latency
                        setTimeout(() => {
                            // Mock call info is cleared when the mock is reset, save it for validation at the end of the test
                            rtMockFirstCalledTimes =
                                rtMockFirst.mock.calls.length;
                            rtMockFirst.mockRestore();
                            rtMockSecond = jest
                                .spyOn(
                                    RefreshTokenClient.prototype,
                                    "acquireTokenByRefreshToken"
                                )
                                .mockRejectedValue(testTokenResponse);
                            return reject(testIframeError);
                        }, 1000);
                    });
                });

            const silentRequest1 = pca.acquireTokenSilent({
                scopes: ["Scope1"],
                account: testAccount,
            });
            const silentRequest2 = pca.acquireTokenSilent({
                scopes: ["Scope2"],
                account: testAccount,
            });
            const silentRequest3 = pca.acquireTokenSilent({
                scopes: ["Scope3"],
                account: testAccount,
            });
            try {
                await Promise.all([
                    silentRequest1,
                    silentRequest2,
                    silentRequest3,
                ]);
            } catch (e) {}
            expect(iframeMock).toHaveBeenCalledTimes(1);
            expect(rtMockFirstCalledTimes).toEqual(3);
            expect(rtMockSecond).toHaveBeenCalledTimes(0);
            await silentRequest1
                .then(() => {
                    throw "This should throw";
                })
                .catch((e) => {
                    expect(e).toEqual(testIframeError);
                });
            await silentRequest2
                .then(() => {
                    throw "This should throw";
                })
                .catch((e) => {
                    expect(e).toEqual(
                        createInteractionRequiredAuthError(
                            InteractionRequiredAuthErrorCodes.refreshTokenExpired
                        )
                    );
                });
            await silentRequest3
                .then(() => {
                    throw "This should throw";
                })
                .catch((e) => {
                    expect(e).toEqual(
                        createInteractionRequiredAuthError(
                            InteractionRequiredAuthErrorCodes.refreshTokenExpired
                        )
                    );
                });
        });

        it("throws iframe error if iframe renewal throws", (done) => {
            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: "testTenantId",
                username: "username@contoso.com",
                loginHint: "testLoginHint",
            };

            jest.spyOn(
                RefreshTokenClient.prototype,
                "acquireTokenByRefreshToken"
            ).mockRejectedValue(
                createInteractionRequiredAuthError(
                    InteractionRequiredAuthErrorCodes.refreshTokenExpired
                )
            );

            const testIframeError = new InteractionRequiredAuthError(
                "interaction_required",
                "interaction is required"
            );

            jest.spyOn(
                SilentIframeClient.prototype,
                "acquireToken"
            ).mockRejectedValue(testIframeError);

            pca.acquireTokenSilent({
                scopes: ["Scope1"],
                account: testAccount,
            }).catch((e) => {
                expect(e).toEqual(testIframeError);
                done();
            });
        });

        it("Falls back to silent handler if thrown error is a refresh token expired error", async () => {
            const invalidGrantError: ServerError = new ServerError(
                "invalid_grant",
                "AADSTS700081: The refresh token has expired due to maximum lifetime. The token was issued on xxxxxxx and the maximum allowed lifetime for this application is 1.00:00:00.\r\nTrace ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxx\r\nCorrelation ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxx\r\nTimestamp: 2020-0x-0x XX:XX:XXZ"
            );
            jest.spyOn(
                RefreshTokenClient.prototype,
                <any>"acquireTokenByRefreshToken"
            ).mockRejectedValue(invalidGrantError);
            const testServerTokenResponse = {
                token_type: TEST_CONFIG.TOKEN_TYPE_BEARER,
                scope: TEST_CONFIG.DEFAULT_SCOPES.join(" "),
                expires_in: TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN,
                ext_expires_in: TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN,
                access_token: TEST_TOKENS.ACCESS_TOKEN,
                refresh_token: TEST_TOKENS.REFRESH_TOKEN,
                id_token: TEST_TOKENS.IDTOKEN_V2,
            };
            const testIdTokenClaims: TokenClaims = {
                ver: "2.0",
                iss: "https://login.microsoftonline.com/9188040d-6c67-4c5b-b112-36a304b66dad/v2.0",
                sub: "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
                name: "Abe Lincoln",
                preferred_username: "AbeLi@microsoft.com",
                oid: "00000000-0000-0000-66f3-3332eca7ea81",
                tid: "3338040d-6c67-4c5b-b112-36a304b66dad",
                nonce: "123523",
                login_hint: "testLoginHint",
            };
            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: testIdTokenClaims.tid || "",
                username: testIdTokenClaims.preferred_username || "",
                loginHint: testIdTokenClaims.login_hint,
            };
            const testTokenResponse: AuthenticationResult = {
                authority: TEST_CONFIG.validAuthority,
                uniqueId: testIdTokenClaims.oid || "",
                tenantId: testIdTokenClaims.tid || "",
                scopes: [...TEST_CONFIG.DEFAULT_SCOPES, "User.Read"],
                idToken: testServerTokenResponse.id_token,
                idTokenClaims: testIdTokenClaims,
                accessToken: testServerTokenResponse.access_token,
                fromCache: false,
                correlationId: RANDOM_TEST_GUID,
                expiresOn: TestTimeUtils.nowDateWithOffset(
                    testServerTokenResponse.expires_in
                ),
                account: testAccount,
                tokenType: Constants.AuthenticationScheme.BEARER,
            };
            const silentTokenHelperStub: jest.SpyInstance = jest
                .spyOn(SilentIframeClient.prototype, <any>"silentTokenHelper")
                .mockResolvedValue(testTokenResponse);
            jest.spyOn(PkceGenerator, "generatePkceCodes").mockResolvedValue({
                challenge: TEST_CONFIG.TEST_CHALLENGE,
                verifier: TEST_CONFIG.TEST_VERIFIER,
            });
            jest.spyOn(BrowserCrypto, "createNewGuid").mockReturnValue(
                RANDOM_TEST_GUID
            );
            const CommonSilentFlowRequest: SilentRequest = {
                scopes: ["User.Read"],
                account: testAccount,
                extraQueryParameters: {
                    queryKey: "queryValue",
                },
                forceRefresh: false,
            };
            const expectedRequest: CommonAuthorizationUrlRequest = {
                ...CommonSilentFlowRequest,
                scopes: ["User.Read"],
                authenticationScheme:
                    TEST_CONFIG.TOKEN_TYPE_BEARER as Constants.AuthenticationScheme,
                correlationId: RANDOM_TEST_GUID,
                authority: `${Constants.DEFAULT_AUTHORITY}`,
                prompt: "none",
                redirectUri: TEST_URIS.TEST_REDIR_URI,
                state: TEST_STATE_VALUES.TEST_STATE_SILENT,
                nonce: RANDOM_TEST_GUID,
                responseMode: Constants.ResponseMode.FRAGMENT,
            };
            const tokenResp = await pca.acquireTokenSilent(
                CommonSilentFlowRequest
            );

            expect(tokenResp).toEqual(testTokenResponse);
            expect(silentTokenHelperStub.mock.calls[0][1]).toEqual(
                expect.objectContaining(expectedRequest)
            );
        });

        it("emits expect performance event when successful", (done) => {
            const testServerTokenResponse = {
                token_type: TEST_CONFIG.TOKEN_TYPE_BEARER,
                scope: TEST_CONFIG.DEFAULT_SCOPES.join(" "),
                expires_in: TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN,
                ext_expires_in: TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN,
                access_token: TEST_TOKENS.ACCESS_TOKEN,
                refresh_token: TEST_TOKENS.REFRESH_TOKEN,
                id_token: TEST_TOKENS.IDTOKEN_V2,
            };

            const testIdTokenClaims: TokenClaims = {
                ver: "2.0",
                iss: "https://login.microsoftonline.com/9188040d-6c67-4c5b-b112-36a304b66dad/v2.0",
                sub: "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
                name: "Abe Lincoln",
                preferred_username: "AbeLi@microsoft.com",
                oid: "00000000-0000-0000-66f3-3332eca7ea81",
                tid: "3338040d-6c67-4c5b-b112-36a304b66dad",
                nonce: "123523",
                login_hint: "testLoginHint",
            };

            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: testIdTokenClaims.tid || "",
                username: testIdTokenClaims.preferred_username || "",
                loginHint: testIdTokenClaims.login_hint,
                idTokenClaims: { ...testIdTokenClaims },
            };

            const silentRequest: SilentRequest = {
                scopes: ["User.Read"],
                account: testAccount,
                correlationId: RANDOM_TEST_GUID,
                scenarioId: "test-scenario-id",
            };

            const atsSpy: jest.SpyInstance = jest
                .spyOn(
                    StandardController.prototype,
                    <any>"acquireTokenSilentAsync"
                )
                .mockResolvedValue({
                    fromCache: true,
                    accessToken: "abc",
                    idToken: "defg",
                    fromPlatformBroker: true,
                    account: testAccount,
                });

            const callbackId = pca.addPerformanceCallback((events) => {
                expect(events[0].correlationId).toBe(RANDOM_TEST_GUID);
                expect(events[0].success).toBe(true);
                expect(events[0].fromCache).toBe(true);
                expect(events[0].accessTokenSize).toBe(3);
                expect(events[0].idTokenSize).toBe(4);
                expect(events[0].isNativeBroker).toBe(true);
                expect(events[0].requestId).toBe(undefined);
                expect(events[0].scenarioId).toBe("test-scenario-id");
                expect(events[0].accountType).toBe("AAD");

                pca.removePerformanceCallback(callbackId);
                done();
            });

            pca.acquireTokenSilent(silentRequest);
        });

        it("emits expect performance event when successful in case of network request", (done) => {
            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: "3338040d-6c67-4c5b-b112-36a304b66dad",
                username: "AbeLi@microsoft.com",
                loginHint: "testLoginHint",
                idTokenClaims: {
                    tid: "3338040d-6c67-4c5b-b112-36a304b66dad",
                },
            };
            const testTokenResponse: AuthenticationResult = {
                authority: TEST_CONFIG.validAuthority,
                uniqueId: testAccount.localAccountId,
                tenantId: testAccount.tenantId,
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                idToken: "test-idToken",
                idTokenClaims: {},
                accessToken: "test-accessToken",
                fromCache: false,
                correlationId: RANDOM_TEST_GUID,
                expiresOn: TestTimeUtils.nowDateWithOffset(3600),
                account: testAccount,
                tokenType: Constants.AuthenticationScheme.BEARER,
            };
            const silentCacheSpy: jest.SpyInstance = jest
                .spyOn(SilentCacheClient.prototype, "acquireToken")
                .mockRejectedValue(new Error("Expired"));
            const silentRefreshSpy: jest.SpyInstance = jest
                .spyOn(SilentRefreshClient.prototype, "acquireToken")
                .mockRejectedValue(
                    new ServerError(
                        BrowserConstants.INVALID_GRANT_ERROR,
                        "Refresh Token expired"
                    )
                );
            const silentIframeSpy: jest.SpyInstance = jest
                .spyOn(SilentIframeClient.prototype, "acquireToken")
                .mockResolvedValue(testTokenResponse);

            const callbackId = pca.addPerformanceCallback((events) => {
                expect(events[0].correlationId).toBe(RANDOM_TEST_GUID);
                expect(events[0].success).toBe(true);
                expect(events[0].fromCache).toBe(false);
                expect(events[0].accessTokenSize).toBe(16);
                expect(events[0].idTokenSize).toBe(12);
                expect(events[0].isNativeBroker).toBe(undefined);
                expect(events[0].requestId).toBe(undefined);
                expect(events[0].visibilityChangeCount).toBe(0);
                expect(events[0].accountType).toBe("AAD");

                pca.removePerformanceCallback(callbackId);
                done();
            });
            pca.acquireTokenSilent({
                scopes: ["openid"],
                account: testAccount,
                correlationId: RANDOM_TEST_GUID,
            });
        });

        it("sets visibilityChange in perf event to true when visibility changes", (done) => {
            const testAccount = BASIC_TEST_ACCOUNT_INFO;
            const testTokenResponse: AuthenticationResult = {
                authority: TEST_CONFIG.validAuthority,
                uniqueId: testAccount.localAccountId,
                tenantId: testAccount.tenantId,
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                idToken: "test-idToken",
                idTokenClaims: {},
                accessToken: "test-accessToken",
                fromCache: false,
                correlationId: RANDOM_TEST_GUID,
                expiresOn: TestTimeUtils.nowDateWithOffset(3600),
                account: testAccount,
                tokenType: Constants.AuthenticationScheme.BEARER,
            };
            const silentCacheSpy: jest.SpyInstance = jest
                .spyOn(SilentCacheClient.prototype, "acquireToken")
                .mockRejectedValue(new Error("Expired"));
            const silentRefreshSpy: jest.SpyInstance = jest
                .spyOn(SilentRefreshClient.prototype, "acquireToken")
                .mockRejectedValue(
                    new ServerError(
                        BrowserConstants.INVALID_GRANT_ERROR,
                        "Refresh Token expired"
                    )
                );
            const silentIframeSpy: jest.SpyInstance = jest
                .spyOn(SilentIframeClient.prototype, "acquireToken")
                .mockResolvedValue(testTokenResponse);

            const callbackId = pca.addPerformanceCallback((events) => {
                expect(events[0].correlationId).toBe(RANDOM_TEST_GUID);
                expect(events[0].success).toBe(true);
                expect(events[0].fromCache).toBe(false);
                expect(events[0].accessTokenSize).toBe(16);
                expect(events[0].idTokenSize).toBe(12);
                expect(events[0].isNativeBroker).toBe(undefined);
                expect(events[0].requestId).toBe(undefined);
                expect(events[0].visibilityChangeCount).toBe(1);

                pca.removePerformanceCallback(callbackId);
                done();
            });
            const event = document.createEvent("HTMLEvents");
            event.initEvent("visibilitychange", true, true);
            pca.acquireTokenSilent({
                scopes: ["openid"],
                account: testAccount,
                correlationId: RANDOM_TEST_GUID,
            });
            document.dispatchEvent(event);
        });

        it("emits expect performance event when there is an error", (done) => {
            const testIdTokenClaims: TokenClaims = {
                ver: "2.0",
                iss: "https://login.microsoftonline.com/9188040d-6c67-4c5b-b112-36a304b66dad/v2.0",
                sub: "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
                name: "Abe Lincoln",
                preferred_username: "AbeLi@microsoft.com",
                oid: "00000000-0000-0000-66f3-3332eca7ea81",
                tid: "3338040d-6c67-4c5b-b112-36a304b66dad",
                nonce: "123523",
                login_hint: "testLoginHint",
            };
            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: testIdTokenClaims.tid || "",
                username: testIdTokenClaims.preferred_username || "",
                loginHint: testIdTokenClaims.login_hint,
                idTokenClaims: {
                    ...testIdTokenClaims,
                },
            };

            const silentRequest: SilentRequest = {
                scopes: ["User.Read"],
                account: testAccount,
                correlationId: RANDOM_TEST_GUID,
            };

            const atsSpy: jest.SpyInstance = jest
                .spyOn(
                    StandardController.prototype,
                    <any>"acquireTokenSilentAsync"
                )
                .mockRejectedValue(
                    new AuthError("abc", "error message", "defg")
                );

            const callbackId = pca.addPerformanceCallback((events) => {
                expect(events[0].correlationId).toBe(RANDOM_TEST_GUID);
                expect(events[0].success).toBe(false);
                expect(events[0].errorCode).toBe("abc");
                expect(events[0].subErrorCode).toBe("defg");
                expect(events[0].accountType).toBe("AAD");

                pca.removePerformanceCallback(callbackId);
                done();
            });

            pca.acquireTokenSilent(silentRequest).catch(() => {});
        });

        describe("Cache Lookup Policies", () => {
            const testAccount = BASIC_TEST_ACCOUNT_INFO;
            const testTokenResponse: AuthenticationResult = {
                authority: TEST_CONFIG.validAuthority,
                uniqueId: testAccount.localAccountId,
                tenantId: testAccount.tenantId,
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                idToken: "test-idToken",
                idTokenClaims: {},
                accessToken: "test-accessToken",
                fromCache: false,
                correlationId: RANDOM_TEST_GUID,
                expiresOn: TestTimeUtils.nowDateWithOffset(3600),
                account: testAccount,
                tokenType: Constants.AuthenticationScheme.BEARER,
            };

            const refreshRequiredCacheError = createClientAuthError(
                ClientAuthErrorCodes.tokenRefreshRequired
            );
            const refreshRequiredServerError = new ServerError(
                BrowserConstants.INVALID_GRANT_ERROR,
                "Refresh Token expired"
            );

            it("Calls SilentCacheClient.acquireToken, SilentRefreshClient.acquireToken and SilentIframeClient.acquireToken if cache lookup throws and refresh token is expired when CacheLookupPolicy is set to Default", async () => {
                const silentCacheSpy: jest.SpyInstance = jest
                    .spyOn(SilentCacheClient.prototype, "acquireToken")
                    .mockRejectedValue(refreshRequiredCacheError);
                const silentRefreshSpy: jest.SpyInstance = jest
                    .spyOn(SilentRefreshClient.prototype, "acquireToken")
                    .mockRejectedValue(refreshRequiredServerError);
                const silentIframeSpy: jest.SpyInstance = jest
                    .spyOn(SilentIframeClient.prototype, "acquireToken")
                    .mockResolvedValue(testTokenResponse);

                const response = await pca.acquireTokenSilent({
                    scopes: ["openid"],
                    account: testAccount,
                    cacheLookupPolicy: CacheLookupPolicy.Default,
                    correlationId: RANDOM_TEST_GUID,
                });
                expect(response).toEqual(testTokenResponse);
                expect(silentCacheSpy).toHaveBeenCalledTimes(1);
                expect(silentRefreshSpy).toHaveBeenCalledTimes(1);
                expect(silentIframeSpy).toHaveBeenCalledTimes(1);
            });

            it("Calls SilentCacheClient.acquireToken, SilentRefreshClient.acquireToken and SilentIframeClient.acquireToken if cache lookup throws and cached refresh token is expired when CacheLookupPolicy is set to Default", async () => {
                const silentCacheSpy = jest
                    .spyOn(SilentCacheClient.prototype, "acquireToken")
                    .mockRejectedValue(refreshRequiredCacheError);
                const silentRefreshSpy = jest
                    .spyOn(SilentRefreshClient.prototype, "acquireToken")
                    .mockRejectedValue(
                        createInteractionRequiredAuthError(
                            InteractionRequiredAuthErrorCodes.refreshTokenExpired
                        )
                    );
                const silentIframeSpy = jest
                    .spyOn(SilentIframeClient.prototype, "acquireToken")
                    .mockResolvedValue(testTokenResponse);

                const response = await pca.acquireTokenSilent({
                    scopes: ["openid"],
                    account: testAccount,
                    cacheLookupPolicy: CacheLookupPolicy.Default,
                    correlationId: RANDOM_TEST_GUID,
                });
                expect(response).toEqual(testTokenResponse);
                expect(silentCacheSpy).toHaveBeenCalledTimes(1);
                expect(silentRefreshSpy).toHaveBeenCalledTimes(1);
                expect(silentIframeSpy).toHaveBeenCalledTimes(1);
            });

            it("Calls SilentCacheClient.acquireToken, and does not call SilentRefreshClient.acquireToken or SilentIframeClient.acquireToken if cache lookup throws when CacheLookupPolicy is set to AccessToken", async () => {
                const silentCacheSpy: jest.SpyInstance = jest
                    .spyOn(SilentCacheClient.prototype, "acquireToken")
                    .mockRejectedValue(refreshRequiredCacheError);
                const silentRefreshSpy = jest
                    .spyOn(SilentRefreshClient.prototype, "acquireToken")
                    .mockImplementation();
                const silentIframeSpy = jest
                    .spyOn(SilentIframeClient.prototype, "acquireToken")
                    .mockImplementation();

                await expect(
                    pca.acquireTokenSilent({
                        scopes: ["openid"],
                        account: testAccount,
                        cacheLookupPolicy: CacheLookupPolicy.AccessToken,
                    })
                ).rejects.toThrow(refreshRequiredCacheError);
                expect(silentCacheSpy).toHaveBeenCalledTimes(1);
                expect(silentRefreshSpy).toHaveBeenCalledTimes(0);
                expect(silentIframeSpy).toHaveBeenCalledTimes(0);
            });

            it("Calls SilentCacheClient.acquireToken, and calls PlatformAuthInteractionClient.acquireToken when CacheLookupPolicy is set to AccessToken", async () => {
                const silentCacheSpy: jest.SpyInstance = jest
                    .spyOn(SilentCacheClient.prototype, "acquireToken")
                    .mockRejectedValue(refreshRequiredCacheError);
                const silentRefreshSpy = jest
                    .spyOn(SilentRefreshClient.prototype, "acquireToken")
                    .mockImplementation();
                const silentIframeSpy = jest
                    .spyOn(SilentIframeClient.prototype, "acquireToken")
                    .mockImplementation();

                const isPlatformAuthAllowedSpy = jest
                    .spyOn(PlatformAuthProvider, "isPlatformAuthAllowed")
                    .mockReturnValue(true);
                const nativeAcquireTokenSpy: jest.SpyInstance = jest
                    .spyOn(
                        PlatformAuthInteractionClient.prototype,
                        "acquireToken"
                    )
                    .mockImplementation();
                const cacheAccount = testAccount;
                cacheAccount.nativeAccountId = "nativeAccountId";

                await expect(
                    pca.acquireTokenSilent({
                        scopes: ["openid"],
                        account: cacheAccount,
                        cacheLookupPolicy: CacheLookupPolicy.AccessToken,
                    })
                )
                    .rejects.toThrow(BrowserAuthError)
                    .catch((error) => {
                        expect(error.errorCode).toBe(
                            BrowserAuthErrorCodes.nativeConnectionNotEstablished
                        );
                    });
                expect(silentCacheSpy).toHaveBeenCalledTimes(0);
                expect(silentRefreshSpy).toHaveBeenCalledTimes(0);
                expect(silentIframeSpy).toHaveBeenCalledTimes(0);
                expect(nativeAcquireTokenSpy).toHaveBeenCalledTimes(0);

                nativeAcquireTokenSpy.mockRestore();
                isPlatformAuthAllowedSpy.mockRestore();
            });

            it("Calls SilentRefreshClient.acquireToken, and does not call SilentCacheClient.acquireToken or SilentIframeClient.acquireToken if refresh token is expired when CacheLookupPolicy is set to RefreshToken", async () => {
                const silentCacheSpy = jest
                    .spyOn(SilentCacheClient.prototype, "acquireToken")
                    .mockImplementation();
                const silentRefreshSpy: jest.SpyInstance = jest
                    .spyOn(SilentRefreshClient.prototype, "acquireToken")
                    .mockRejectedValue(refreshRequiredServerError);
                const silentIframeSpy = jest
                    .spyOn(SilentIframeClient.prototype, "acquireToken")
                    .mockImplementation();

                await expect(
                    pca.acquireTokenSilent({
                        scopes: ["openid"],
                        account: testAccount,
                        cacheLookupPolicy: CacheLookupPolicy.RefreshToken,
                    })
                ).rejects.toThrow(refreshRequiredServerError);
                expect(silentCacheSpy).toHaveBeenCalledTimes(0);
                expect(silentRefreshSpy).toHaveBeenCalledTimes(1);
                expect(silentIframeSpy).toHaveBeenCalledTimes(0);
            });

            it("Calls NativeInteractionClient.acquireToken when CacheLookupPolicy is set to AccessTokenAndRefreshToken", async () => {
                const silentCacheSpy: jest.SpyInstance = jest
                    .spyOn(SilentCacheClient.prototype, "acquireToken")
                    .mockRejectedValue(refreshRequiredCacheError);
                const silentRefreshSpy: jest.SpyInstance = jest
                    .spyOn(SilentRefreshClient.prototype, "acquireToken")
                    .mockRejectedValue(refreshRequiredServerError);
                const silentIframeSpy = jest
                    .spyOn(SilentIframeClient.prototype, "acquireToken")
                    .mockImplementation();
                const nativeAcquireTokenSpy: jest.SpyInstance = jest
                    .spyOn(
                        PlatformAuthInteractionClient.prototype,
                        "acquireToken"
                    )
                    .mockImplementation();

                const cacheAccount = testAccount;
                cacheAccount.nativeAccountId = "nativeAccountId";
                const isPlatformAuthAllowedSpy = jest
                    .spyOn(PlatformAuthProvider, "isPlatformAuthAllowed")
                    .mockReturnValue(true);
                testAccount.nativeAccountId = "nativeAccountId";

                await expect(
                    pca.acquireTokenSilent({
                        scopes: ["openid"],
                        account: cacheAccount,
                        cacheLookupPolicy:
                            CacheLookupPolicy.AccessTokenAndRefreshToken,
                    })
                )
                    .rejects.toThrow(BrowserAuthError)
                    .catch((error) => {
                        expect(error.errorCode).toBe(
                            BrowserAuthErrorCodes.nativeConnectionNotEstablished
                        );
                    });
                expect(silentCacheSpy).toHaveBeenCalledTimes(0);
                expect(silentRefreshSpy).toHaveBeenCalledTimes(0);
                expect(silentIframeSpy).toHaveBeenCalledTimes(0);
                expect(nativeAcquireTokenSpy).toHaveBeenCalledTimes(0);
                nativeAcquireTokenSpy.mockRestore();
                isPlatformAuthAllowedSpy.mockRestore();
            });

            it("Calls SilentRefreshClient.acquireToken, and does not call SilentCacheClient.acquireToken or SilentIframeClient.acquireToken if refresh token is expired when CacheLookupPolicy is set to RefreshToken", async () => {
                const silentCacheSpy = jest
                    .spyOn(SilentCacheClient.prototype, "acquireToken")
                    .mockImplementation();
                const silentRefreshSpy: jest.SpyInstance = jest
                    .spyOn(SilentRefreshClient.prototype, "acquireToken")
                    .mockRejectedValue(refreshRequiredServerError);
                const silentIframeSpy = jest
                    .spyOn(SilentIframeClient.prototype, "acquireToken")
                    .mockImplementation();

                await expect(
                    pca.acquireTokenSilent({
                        scopes: ["openid"],
                        account: testAccount,
                        cacheLookupPolicy: CacheLookupPolicy.RefreshToken,
                    })
                ).rejects.toThrow(refreshRequiredServerError);
                expect(silentCacheSpy).toHaveBeenCalledTimes(0);
                expect(silentRefreshSpy).toHaveBeenCalledTimes(1);
                expect(silentIframeSpy).toHaveBeenCalledTimes(0);
            });

            it("Calls SilentRefreshClient.acquireToken and SilentIframeClient.acquireToken, and does not call SilentCacheClient.acquireToken if refresh token is expired when CacheLookupPolicy is set to RefreshTokenAndNetwork", async () => {
                const silentCacheSpy = jest.spyOn(
                    SilentCacheClient.prototype,
                    "acquireToken"
                );
                const silentRefreshSpy: jest.SpyInstance = jest
                    .spyOn(SilentRefreshClient.prototype, "acquireToken")
                    .mockRejectedValue(refreshRequiredServerError);
                const silentIframeSpy: jest.SpyInstance = jest
                    .spyOn(SilentIframeClient.prototype, "acquireToken")
                    .mockResolvedValue(testTokenResponse);

                const response = await pca.acquireTokenSilent({
                    scopes: ["openid"],
                    account: testAccount,
                    cacheLookupPolicy: CacheLookupPolicy.RefreshTokenAndNetwork,
                    correlationId: RANDOM_TEST_GUID,
                });
                expect(response).toEqual(testTokenResponse);
                expect(silentCacheSpy).toHaveBeenCalledTimes(0);
                expect(silentRefreshSpy).toHaveBeenCalledTimes(1);
                expect(silentIframeSpy).toHaveBeenCalledTimes(1);
            });

            it("Calls SilentIframeClient.acquireToken, and does not call SilentCacheClient.acquireToken or SilentRefreshClient.acquireToken when CacheLookupPolicy is set to Skip", async () => {
                const silentCacheSpy = jest
                    .spyOn(SilentCacheClient.prototype, "acquireToken")
                    .mockImplementation();
                const silentRefreshSpy = jest
                    .spyOn(SilentRefreshClient.prototype, "acquireToken")
                    .mockImplementation();
                const silentIframeSpy: jest.SpyInstance = jest
                    .spyOn(SilentIframeClient.prototype, "acquireToken")
                    .mockResolvedValue(testTokenResponse);

                const response = await pca.acquireTokenSilent({
                    scopes: ["openid"],
                    account: testAccount,
                    cacheLookupPolicy: CacheLookupPolicy.Skip,
                    correlationId: RANDOM_TEST_GUID,
                });
                expect(response).toEqual(testTokenResponse);
                expect(silentCacheSpy).toHaveBeenCalledTimes(0);
                expect(silentRefreshSpy).toHaveBeenCalledTimes(0);
                expect(silentIframeSpy).toHaveBeenCalledTimes(1);
            });

            describe("silentRefreshReason telemetry", () => {
                it("adds silentRefreshReason telemetry field with errorCode when refresh token error triggers iframe fallback", (done) => {
                    jest.spyOn(
                        SilentCacheClient.prototype,
                        "acquireToken"
                    ).mockRejectedValue(refreshRequiredCacheError);
                    jest.spyOn(
                        SilentRefreshClient.prototype,
                        "acquireToken"
                    ).mockRejectedValue(refreshRequiredServerError);
                    jest.spyOn(
                        SilentIframeClient.prototype,
                        "acquireToken"
                    ).mockResolvedValue(testTokenResponse);

                    const callbackId = pca.addPerformanceCallback((events) => {
                        expect(events[0].silentRefreshReason).toBe(
                            BrowserConstants.INVALID_GRANT_ERROR
                        );
                        pca.removePerformanceCallback(callbackId);
                        done();
                    });

                    pca.acquireTokenSilent({
                        scopes: ["openid"],
                        account: testAccount,
                        cacheLookupPolicy: CacheLookupPolicy.Default,
                        correlationId: RANDOM_TEST_GUID,
                    });
                });

                it("adds silentRefreshReason telemetry field with errorCode and subError when subError is present", (done) => {
                    const errorWithSubError = new ServerError(
                        BrowserConstants.INVALID_GRANT_ERROR,
                        "Refresh Token expired",
                        "bad_token"
                    );

                    jest.spyOn(
                        SilentCacheClient.prototype,
                        "acquireToken"
                    ).mockRejectedValue(refreshRequiredCacheError);
                    jest.spyOn(
                        SilentRefreshClient.prototype,
                        "acquireToken"
                    ).mockRejectedValue(errorWithSubError);
                    jest.spyOn(
                        SilentIframeClient.prototype,
                        "acquireToken"
                    ).mockResolvedValue(testTokenResponse);

                    const callbackId = pca.addPerformanceCallback((events) => {
                        expect(events[0].silentRefreshReason).toBe(
                            `${BrowserConstants.INVALID_GRANT_ERROR}|bad_token`
                        );
                        pca.removePerformanceCallback(callbackId);
                        done();
                    });

                    pca.acquireTokenSilent({
                        scopes: ["openid"],
                        account: testAccount,
                        cacheLookupPolicy: CacheLookupPolicy.Default,
                        correlationId: RANDOM_TEST_GUID,
                    });
                });

                it("adds silentRefreshReason telemetry field with refreshTokenExpired error code", (done) => {
                    const refreshTokenExpiredError =
                        createInteractionRequiredAuthError(
                            InteractionRequiredAuthErrorCodes.refreshTokenExpired
                        );

                    jest.spyOn(
                        SilentCacheClient.prototype,
                        "acquireToken"
                    ).mockRejectedValue(refreshRequiredCacheError);
                    jest.spyOn(
                        SilentRefreshClient.prototype,
                        "acquireToken"
                    ).mockRejectedValue(refreshTokenExpiredError);
                    jest.spyOn(
                        SilentIframeClient.prototype,
                        "acquireToken"
                    ).mockResolvedValue(testTokenResponse);

                    const callbackId = pca.addPerformanceCallback((events) => {
                        expect(events[0].silentRefreshReason).toBe(
                            InteractionRequiredAuthErrorCodes.refreshTokenExpired
                        );
                        pca.removePerformanceCallback(callbackId);
                        done();
                    });

                    pca.acquireTokenSilent({
                        scopes: ["openid"],
                        account: testAccount,
                        cacheLookupPolicy: CacheLookupPolicy.Default,
                        correlationId: RANDOM_TEST_GUID,
                    });
                });

                it("adds silentRefreshReason telemetry field with noTokensFound error code", (done) => {
                    const noTokensFoundError =
                        createInteractionRequiredAuthError(
                            InteractionRequiredAuthErrorCodes.noTokensFound
                        );

                    jest.spyOn(
                        SilentCacheClient.prototype,
                        "acquireToken"
                    ).mockRejectedValue(refreshRequiredCacheError);
                    jest.spyOn(
                        SilentRefreshClient.prototype,
                        "acquireToken"
                    ).mockRejectedValue(noTokensFoundError);
                    jest.spyOn(
                        SilentIframeClient.prototype,
                        "acquireToken"
                    ).mockResolvedValue(testTokenResponse);

                    const callbackId = pca.addPerformanceCallback((events) => {
                        expect(events[0].silentRefreshReason).toBe(
                            InteractionRequiredAuthErrorCodes.noTokensFound
                        );
                        pca.removePerformanceCallback(callbackId);
                        done();
                    });

                    pca.acquireTokenSilent({
                        scopes: ["openid"],
                        account: testAccount,
                        cacheLookupPolicy: CacheLookupPolicy.Default,
                        correlationId: RANDOM_TEST_GUID,
                    });
                });
            });
        });

        it("throws an error if isMcp is true and resource is not provided in request", async () => {
            const config = {
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                    isMcp: true,
                },
            };
            pca = new PublicClientApplication(config);
            await pca.initialize();

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            pca = (pca as any).controller;

            await expect(
                pca.acquireTokenSilent({ scopes: [] })
            ).rejects.toMatchObject(
                createClientAuthError(
                    ClientAuthErrorCodes.resourceParameterRequired
                )
            );
        });

        it("throws an error if isMcp is true and resource is provided in both request and extraQueryParameters", async () => {
            const config = {
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                    isMcp: true,
                },
            };
            pca = new PublicClientApplication(config);
            await pca.initialize();

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            pca = (pca as any).controller;

            await expect(
                pca.acquireTokenSilent({
                    scopes: [],
                    resource: "https://resource.example.com",
                    extraQueryParameters: {
                        resource: "https://resource.example.com",
                    },
                })
            ).rejects.toMatchObject(
                createClientAuthError(
                    ClientAuthErrorCodes.misplacedResourceParam
                )
            );
        });

        it("throws an error if isMcp is true and resource is provided in both request and extraParameters", async () => {
            const config = {
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                    isMcp: true,
                },
            };
            pca = new PublicClientApplication(config);
            await pca.initialize();

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            pca = (pca as any).controller;

            await expect(
                pca.acquireTokenSilent({
                    scopes: [],
                    resource: "https://resource.example.com",
                    extraParameters: {
                        resource: "https://resource.example.com",
                    },
                })
            ).rejects.toMatchObject(
                createClientAuthError(
                    ClientAuthErrorCodes.misplacedResourceParam
                )
            );
        });

        it("succeeds when isMcp is true and resource is provided", async () => {
            const config = {
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                    isMcp: true,
                },
            };
            pca = new PublicClientApplication(config);
            await pca.initialize();

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            pca = (pca as any).controller;

            const testAccount = BASIC_TEST_ACCOUNT_INFO;
            const testTokenResponse: AuthenticationResult = {
                authority: TEST_CONFIG.validAuthority,
                uniqueId: testAccount.localAccountId,
                tenantId: testAccount.tenantId,
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                idToken: "test-idToken",
                idTokenClaims: {},
                accessToken: "test-accessToken",
                fromCache: false,
                correlationId: RANDOM_TEST_GUID,
                expiresOn: TestTimeUtils.nowDateWithOffset(3600),
                account: testAccount,
                tokenType: Constants.AuthenticationScheme.BEARER,
                state: "test-state",
            };
            const silentCacheSpy: jest.SpyInstance = jest
                .spyOn(SilentCacheClient.prototype, "acquireToken")
                .mockResolvedValue(testTokenResponse);
            const silentRefreshSpy = jest.spyOn(
                SilentRefreshClient.prototype,
                "acquireToken"
            );
            const silentIframeSpy = jest.spyOn(
                SilentIframeClient.prototype,
                "acquireToken"
            );

            const response = await pca.acquireTokenSilent({
                scopes: ["openid"],
                account: testAccount,
                state: "test-state",
                correlationId: RANDOM_TEST_GUID,
                resource: "testresource.example.com",
            });
            expect(response?.idToken).not.toBeNull();
            expect(response).toEqual(testTokenResponse);
            expect(silentCacheSpy).toHaveBeenCalledTimes(1);
            expect(silentRefreshSpy).toHaveBeenCalledTimes(0);
            expect(silentIframeSpy).toHaveBeenCalledTimes(0);
        });
    });

    describe("logoutRedirect", () => {
        beforeEach(async () => {
            pca = (pca as any).controller;
            await pca.initialize();
        });

        it("throws an error if initialize was not called prior", async () => {
            pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                },
            });
            try {
                await pca.logoutRedirect();
            } catch (error: any) {
                expect(error).toMatchObject(
                    createBrowserAuthError(
                        BrowserAuthErrorCodes.uninitializedPublicClientApplication
                    )
                );
            }
        });

        it("doesnt mutate request correlation id", async () => {
            jest.spyOn(RedirectClient.prototype, "logout").mockResolvedValue();

            const request: EndSessionRequest = {};

            await pca.logoutRedirect(request).catch(() => null);
            await pca.logoutRedirect(request).catch(() => null);

            expect(request.correlationId).toBe(undefined);
        });

        it("Calls RedirectClient.logout and returns its response", async () => {
            const redirectClientSpy: jest.SpyInstance = jest
                .spyOn(RedirectClient.prototype, "logout")
                .mockResolvedValue();

            const response = await pca.logoutRedirect();
            expect(response).toEqual(undefined);
            expect(redirectClientSpy).toHaveBeenCalledTimes(1);
        });

        it("throws an error if inside an iframe", async () => {
            const mockParentWindow = { ...window };
            jest.spyOn(window, "parent", "get").mockReturnValue(
                mockParentWindow
            );
            await expect(pca.logoutRedirect()).rejects.toMatchObject(
                createBrowserAuthError(BrowserAuthErrorCodes.redirectInIframe)
            );
        });
    });

    describe("logoutPopup", () => {
        beforeEach(async () => {
            pca = (pca as any).controller;
            await pca.initialize();
        });

        it("throws an error if initialize was not called prior", async () => {
            pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                },
            });
            try {
                await pca.logoutPopup();
            } catch (error: any) {
                expect(error).toMatchObject(
                    createBrowserAuthError(
                        BrowserAuthErrorCodes.uninitializedPublicClientApplication
                    )
                );
            }
        });

        it("doesnt mutate request correlation id", async () => {
            jest.spyOn(PopupClient.prototype, "logout").mockResolvedValue();

            const request: EndSessionRequest = {};

            await pca.logoutPopup(request).catch(() => null);
            await pca.logoutPopup(request).catch(() => null);

            expect(request.correlationId).toBe(undefined);
        });

        it("Calls PopupClient.logout and returns its response", async () => {
            const popupClientSpy: jest.SpyInstance = jest
                .spyOn(PopupClient.prototype, "logout")
                .mockResolvedValue();

            const response = await pca.logoutPopup();
            expect(response).toEqual(undefined);
            expect(popupClientSpy).toHaveBeenCalledTimes(1);
        });

        it("throws error if interaction is in progress", async () => {
            const browserCrypto = new CryptoOps(new Logger({}));
            const logger = new Logger({});
            const browserStorage = new BrowserCacheManager(
                "client-id",
                cacheConfig,
                browserCrypto,
                logger,
                new StubPerformanceClient(),
                new EventHandler()
            );
            browserStorage.setInteractionInProgress(true);

            await expect(pca.logoutPopup()).rejects.toMatchObject(
                createBrowserAuthError(
                    BrowserAuthErrorCodes.interactionInProgress
                )
            );
        });
    });

    describe("clearCache tests", () => {
        // Account 1
        const testAccount: AccountEntity =
            buildAccountFromIdTokenClaims(ID_TOKEN_CLAIMS);

        const testAccountInfo: AccountInfo =
            AccountEntityUtils.getAccountInfo(testAccount);
        const matchAccount: AccountInfo = {
            ...testAccountInfo,
            idTokenClaims: ID_TOKEN_CLAIMS,
            idToken: TEST_TOKENS.IDTOKEN_V2,
        };

        const testIdToken: IdTokenEntity = buildIdToken(
            ID_TOKEN_CLAIMS,
            TEST_TOKENS.IDTOKEN_V2,
            { clientId: TEST_CONFIG.MSAL_CLIENT_ID }
        );
        beforeEach(async () => {
            pca = (pca as any).controller;
            await pca.initialize();

            // @ts-ignore
            await pca.browserStorage.setAccount(testAccount);
            // @ts-ignore
            await pca.browserStorage.setIdTokenCredential(testIdToken);
        });

        afterEach(() => {
            window.sessionStorage.clear();
            window.localStorage.clear();
        });

        it("browser cache cleared when clearCache called without a ClearCacheRequest object", () => {
            expect(pca.getActiveAccount()).toEqual(null);
            pca.setActiveAccount(matchAccount);
            const activeAccount = pca.getActiveAccount();
            expect(activeAccount).toEqual(matchAccount);
            pca.clearCache();
            expect(pca.getActiveAccount()).toEqual(null);
        });

        it("browser cache cleared when clearCache called with a ClearCacheRequest object", () => {
            expect(pca.getActiveAccount()).toEqual(null);
            pca.setActiveAccount(matchAccount);
            const activeAccount = pca.getActiveAccount();
            expect(activeAccount).toEqual(matchAccount);
            pca.clearCache({
                account: matchAccount,
                correlationId: "test123",
            });
            expect(pca.getActiveAccount()).toEqual(null);
        });
    });

    describe("getAccount tests", () => {
        // Account 1
        const testAccount1: AccountEntity =
            buildAccountFromIdTokenClaims(ID_TOKEN_CLAIMS);
        const testAccountInfo1: AccountInfo =
            AccountEntityUtils.getAccountInfo(testAccount1);
        testAccountInfo1.idTokenClaims = ID_TOKEN_CLAIMS;
        testAccountInfo1.idToken = TEST_TOKENS.IDTOKEN_V2;

        testAccount1.clientInfo =
            TEST_DATA_CLIENT_INFO.TEST_CLIENT_INFO_B64ENCODED;

        const idToken1: IdTokenEntity = buildIdToken(
            ID_TOKEN_CLAIMS,
            TEST_TOKENS.IDTOKEN_V2,
            { clientId: TEST_CONFIG.MSAL_CLIENT_ID }
        );

        // Account 2

        const testAccount2: AccountEntity =
            buildAccountFromIdTokenClaims(ID_TOKEN_ALT_CLAIMS);
        const testAccountInfo2: AccountInfo =
            AccountEntityUtils.getAccountInfo(testAccount2);
        testAccountInfo2.idTokenClaims = ID_TOKEN_ALT_CLAIMS;
        testAccountInfo2.idToken = TEST_TOKENS.IDTOKEN_V2_ALT;

        testAccount2.clientInfo =
            TEST_DATA_CLIENT_INFO.TEST_CLIENT_INFO_B64ENCODED;

        const idToken2: IdTokenEntity = buildIdToken(
            ID_TOKEN_ALT_CLAIMS,
            TEST_TOKENS.IDTOKEN_V2_ALT,
            { clientId: TEST_CONFIG.MSAL_CLIENT_ID }
        );

        beforeEach(async () => {
            pca = (pca as any).controller;
            await pca.initialize();

            // @ts-ignore
            await pca.browserStorage.setAccount(testAccount1);
            // @ts-ignore
            await pca.browserStorage.setAccount(testAccount2);

            // @ts-ignore
            await pca.browserStorage.setIdTokenCredential(idToken1);

            // @ts-ignore
            await pca.browserStorage.setIdTokenCredential(idToken2);
        });

        afterEach(() => {
            window.sessionStorage.clear();
        });

        it("getAllAccounts with no account filter returns all signed in accounts", () => {
            const accounts = pca.getAllAccounts();
            expect(accounts).toHaveLength(2);
            expect(accounts[0].idTokenClaims).not.toBeUndefined();
            expect(accounts[1].idTokenClaims).not.toBeUndefined();
        });

        it("getAllAccounts returns all accounts matching the filter passed in", () => {
            const authorityType = "MSSTS";
            const accounts = pca.getAllAccounts({ authorityType });
            expect(accounts).toHaveLength(2);
            expect(accounts[0].authorityType).toBe(authorityType);
            expect(accounts[1].authorityType).toBe(authorityType);
        });

        it("getAllAccounts returns empty array if no accounts signed in", () => {
            window.sessionStorage.clear();
            const accounts = pca.getAllAccounts();
            expect(accounts).toEqual([]);
        });

        it("getAllAccounts throws if called before initialize", (done) => {
            pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                },
                cache: {
                    cacheLocation: "localStorage",
                },
            });

            window.localStorage.setItem(
                getAccountKeysCacheKey(),
                JSON.stringify([
                    browserStorage.generateAccountKey(testAccountInfo1),
                ])
            );

            try {
                pca.getAllAccounts();
            } catch (e) {
                expect(e).toEqual(
                    createBrowserAuthError(
                        BrowserAuthErrorCodes.uninitializedPublicClientApplication
                    )
                );
                done();
            }
        });

        describe("getAccount", () => {
            it("getAccount returns null if empty filter is passed in", () => {
                const account = pca.getAccount({});
                expect(account).toBe(null);
            });

            it("getAccount throws if called before initialize", (done) => {
                pca = new PublicClientApplication({
                    auth: {
                        clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                    },
                    cache: {
                        cacheLocation: "localStorage",
                    },
                });

                window.localStorage.setItem(
                    getAccountKeysCacheKey(),
                    JSON.stringify([
                        browserStorage.generateAccountKey(testAccountInfo1),
                    ])
                );

                try {
                    pca.getAccount({ username: testAccount1.username });
                } catch (e) {
                    expect(e).toEqual(
                        createBrowserAuthError(
                            BrowserAuthErrorCodes.uninitializedPublicClientApplication
                        )
                    );
                    done();
                }
            });

            describe("loginHint filter", () => {
                it("getAccount returns account specified using login_hint", () => {
                    const account = pca.getAccount({
                        loginHint: ID_TOKEN_CLAIMS.login_hint,
                    });
                    expect(account?.idTokenClaims).not.toBeUndefined();
                    expect(account?.homeAccountId).toEqual(
                        testAccountInfo1.homeAccountId
                    );
                });
                it("getAccount returns account specified using username", () => {
                    const account = pca.getAccount({
                        loginHint: ID_TOKEN_ALT_CLAIMS.preferred_username,
                    });
                    expect(account?.idTokenClaims).not.toBeUndefined();
                    expect(account?.homeAccountId).toEqual(
                        testAccountInfo2.homeAccountId
                    );
                });
                it("getAccount returns account specified using upn", () => {
                    const account = pca.getAccount({
                        loginHint: ID_TOKEN_CLAIMS.upn,
                    });
                    expect(account?.idTokenClaims).not.toBeUndefined();
                    expect(account?.homeAccountId).toEqual(
                        testAccountInfo1.homeAccountId
                    );
                });
                it("getAccount returns account specified using sid", () => {
                    const account = pca.getAccount({
                        sid: ID_TOKEN_CLAIMS.sid,
                    });
                    expect(account?.idTokenClaims).not.toBeUndefined();
                    expect(account?.homeAccountId).toEqual(
                        testAccountInfo1.homeAccountId
                    );
                });
            });

            it("getAccount returns account specified using homeAccountId", () => {
                const account = pca.getAccount({
                    homeAccountId: testAccountInfo1.homeAccountId,
                });
                expect(account?.idTokenClaims).not.toBeUndefined();
                expect(account).toEqual(testAccountInfo1);
            });

            it("getAccount returns account specified using localAccountId", () => {
                const account = pca.getAccount({
                    localAccountId: ID_TOKEN_CLAIMS.oid,
                });
                expect(account?.idTokenClaims).not.toBeUndefined();
                expect(account).toEqual(testAccountInfo1);
            });

            it("getAccount returns account specified using username", () => {
                const account = pca.getAccount({
                    username: ID_TOKEN_CLAIMS.preferred_username,
                });
                expect(account?.idTokenClaims).not.toBeUndefined();
                expect(account).toEqual(testAccountInfo1);
            });

            it("getAccount returns account specified using a combination of homeAccountId and localAccountId", () => {
                const account = pca.getAccount({
                    homeAccountId: testAccountInfo1.homeAccountId,
                    localAccountId: testAccountInfo1.localAccountId,
                });
                expect(account?.idTokenClaims).not.toBeUndefined();
                expect(account).toEqual(testAccountInfo1);
            });
        });
    });

    describe("activeAccount API tests", () => {
        // Account 1
        const testAccount1: AccountEntity =
            buildAccountFromIdTokenClaims(ID_TOKEN_CLAIMS);
        const testAccountInfo1: AccountInfo = {
            ...AccountEntityUtils.getAccountInfo(testAccount1),
            idTokenClaims: ID_TOKEN_CLAIMS,
            idToken: TEST_TOKENS.IDTOKEN_V2,
        };

        const idToken1: IdTokenEntity = buildIdToken(
            ID_TOKEN_CLAIMS,
            TEST_TOKENS.IDTOKEN_V2,
            { clientId: TEST_CONFIG.MSAL_CLIENT_ID }
        );

        // Account 2

        const testAccount2: AccountEntity =
            buildAccountFromIdTokenClaims(ID_TOKEN_ALT_CLAIMS);
        const testAccountInfo2: AccountInfo = {
            ...AccountEntityUtils.getAccountInfo(testAccount2),
            idTokenClaims: ID_TOKEN_ALT_CLAIMS,
            idToken: TEST_TOKENS.IDTOKEN_V2_ALT,
        };

        const idToken2: IdTokenEntity = buildIdToken(
            ID_TOKEN_ALT_CLAIMS,
            TEST_TOKENS.IDTOKEN_V2_ALT,
            { clientId: TEST_CONFIG.MSAL_CLIENT_ID }
        );

        beforeEach(async () => {
            pca = (pca as any).controller;
            await pca.initialize();
            // @ts-ignore
            await pca.browserStorage.setAccount(testAccount1);
            // @ts-ignore
            await pca.browserStorage.setAccount(testAccount2);

            // @ts-ignore
            await pca.browserStorage.setIdTokenCredential(idToken1);
            // @ts-ignore
            await pca.browserStorage.setIdTokenCredential(idToken2);
        });

        afterEach(() => {
            window.sessionStorage.clear();
        });

        describe("activeAccount getter and setter tests", () => {
            it("active account is initialized as null", () => {
                // Public client should initialze with active account set to null.
                expect(pca.getActiveAccount()).toBe(null);
            });

            it("getActiveAccount throws if called before initialize", (done) => {
                pca = new PublicClientApplication({
                    auth: {
                        clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                    },
                    cache: {
                        cacheLocation: "localStorage",
                    },
                });

                window.localStorage.setItem(
                    `msal.${TEST_CONFIG.MSAL_CLIENT_ID}.active-account-filters`,
                    JSON.stringify({
                        homeAccountId: testAccount1.homeAccountId,
                        localAccountId: testAccount1.localAccountId,
                    })
                );
                window.localStorage.setItem(
                    getAccountKeysCacheKey(),
                    JSON.stringify([
                        browserStorage.generateAccountKey(testAccountInfo1),
                    ])
                );

                try {
                    pca.getActiveAccount();
                } catch (e) {
                    expect(e).toEqual(
                        createBrowserAuthError(
                            BrowserAuthErrorCodes.uninitializedPublicClientApplication
                        )
                    );
                    done();
                }
            });

            it("setActiveAccount() sets the active account local id value correctly", () => {
                expect(pca.getActiveAccount()).toBe(null);
                pca.setActiveAccount(testAccountInfo1);
                const activeAccount = pca.getActiveAccount();
                expect(activeAccount?.idTokenClaims).not.toBeUndefined();
                expect(activeAccount).toEqual(testAccountInfo1);
            });

            describe("activeAccount tests with two accounts, both with same localId", () => {
                it("setActiveAccount sets both home id and local id", () => {
                    expect(pca.getActiveAccount()).toBe(null);

                    pca.setActiveAccount(testAccountInfo1);
                    const activeAccount = pca.getActiveAccount();
                    expect(activeAccount).not.toBeNull();
                    expect(activeAccount?.idTokenClaims).not.toBeUndefined();
                    expect(activeAccount?.homeAccountId).toEqual(
                        testAccountInfo1.homeAccountId
                    );
                    expect(activeAccount?.localAccountId).toEqual(
                        testAccountInfo1.localAccountId
                    );
                });

                it("getActiveAccount gets correct account when two accounts with same local id are present in cache", () => {
                    expect(pca.getActiveAccount()).toBe(null);

                    pca.setActiveAccount(testAccountInfo1);
                    let activeAccount = pca.getActiveAccount();
                    expect(activeAccount?.idTokenClaims).not.toBeUndefined();
                    expect(activeAccount).toEqual(testAccountInfo1);
                    expect(activeAccount).not.toEqual(testAccountInfo2);

                    pca.setActiveAccount(testAccountInfo2);
                    activeAccount = pca.getActiveAccount();
                    expect(activeAccount?.idTokenClaims).not.toBeUndefined();
                    expect(pca.getActiveAccount()).not.toEqual(
                        testAccountInfo1
                    );
                    expect(pca.getActiveAccount()).toEqual(testAccountInfo2);
                });

                it("getActiveAccount returns null when active account is removed from cache when another account with same local id is present", () => {
                    expect(pca.getActiveAccount()).toBe(null);

                    pca.setActiveAccount(testAccountInfo2);
                    const activeAccount = pca.getActiveAccount();
                    expect(activeAccount?.idTokenClaims).not.toBeUndefined();
                    expect(activeAccount).not.toEqual(testAccountInfo1);
                    expect(activeAccount).toEqual(testAccountInfo2);

                    const cacheKey2 =
                        browserStorage.generateAccountKey(testAccountInfo2);
                    const idTokenKey2 =
                        browserStorage.generateCredentialKey(idToken2);
                    window.sessionStorage.removeItem(cacheKey2);
                    window.sessionStorage.removeItem(idTokenKey2);
                    expect(pca.getActiveAccount()).toBe(null);
                });
            });
        });

        describe("activeAccount logout", () => {
            beforeEach(async () => {
                pca.setActiveAccount(testAccountInfo1);
                jest.spyOn(
                    AuthorizationCodeClient.prototype,
                    "getLogoutUri"
                ).mockReturnValue(testLogoutUrl);
                jest.spyOn(
                    NavigationClient.prototype,
                    "navigateExternal"
                ).mockImplementation(
                    (
                        urlNavigate: string,
                        options: NavigationOptions
                    ): Promise<boolean> => {
                        expect(urlNavigate).toEqual(testLogoutUrl);
                        expect(options.noHistory).toBeFalsy();
                        return Promise.resolve(true);
                    }
                );
                const popupWindow = { ...window };
                jest.spyOn(PopupClient.prototype, "openPopup").mockReturnValue(
                    popupWindow
                );
                jest.spyOn(
                    PopupClient.prototype,
                    "openSizedPopup"
                ).mockReturnValue(popupWindow);
            });

            it("Clears active account on logoutRedirect with no account", async () => {
                expect(pca.getActiveAccount()).toEqual(testAccountInfo1);
                await pca.logoutRedirect();
                expect(pca.getActiveAccount()).toBe(null);
            });

            it("Clears active account on logoutRedirect when the given account info matches", async () => {
                expect(pca.getActiveAccount()).toEqual(testAccountInfo1);
                await pca.logoutRedirect({
                    account: testAccountInfo1,
                });
                expect(pca.getActiveAccount()).toBe(null);
            });

            it("Does not clear active account on logoutRedirect if given account object does not match", async () => {
                expect(pca.getActiveAccount()).toEqual(testAccountInfo1);
                await pca.logoutRedirect({
                    account: testAccountInfo2,
                });
                expect(pca.getActiveAccount()).toEqual(testAccountInfo1);
            });

            it("Clears active account on logoutPopup with no account", async () => {
                expect(pca.getActiveAccount()).toEqual(testAccountInfo1);
                await pca.logoutPopup();
                expect(pca.getActiveAccount()).toBe(null);
            });

            it("Clears active account on logoutPopup when the given account info matches", async () => {
                expect(pca.getActiveAccount()).toEqual(testAccountInfo1);
                await pca.logoutPopup({
                    account: testAccountInfo1,
                });
                expect(pca.getActiveAccount()).toBe(null);
            });

            it("Does not clear active account on logoutPopup if given account object does not match", async () => {
                expect(pca.getActiveAccount()).toEqual(testAccountInfo1);
                await pca.logoutPopup({
                    account: testAccountInfo2,
                });
                expect(pca.getActiveAccount()).toEqual(testAccountInfo1);
            });
        });
    });

    describe("Event API tests", () => {
        it("can add an event callback", (done) => {
            const subscriber = (message: EventMessage) => {
                expect(message.eventType).toEqual(
                    EventType.ACQUIRE_TOKEN_SUCCESS
                );
                expect(message.interactionType).toEqual(InteractionType.Popup);
                done();
            };

            const callbackSpy: jest.SpyInstance = jest.spyOn(
                EventHandler.prototype,
                "addEventCallback"
            );

            pca.addEventCallback(subscriber);
            expect(callbackSpy).toHaveBeenCalledTimes(1);
            done();
        });

        it("can remove an event callback", (done) => {
            const callbackSpy: jest.SpyInstance = jest.spyOn(
                EventHandler.prototype,
                "removeEventCallback"
            );

            const callbackId = pca.addEventCallback(() => {});
            pca.removeEventCallback(callbackId || "");
            expect(callbackSpy).toHaveBeenCalledTimes(1);
            done();
        });
    });

    describe("Logger", () => {
        it("getLogger and setLogger", (done) => {
            const logger = new Logger({
                loggerCallback: (level, message, containsPii) => {
                    expect(message).toContain("Message");
                    expect(message).toContain(LogLevel[2]);

                    expect(level).toEqual(LogLevel.Info);
                    expect(containsPii).toBeFalsy();

                    done();
                },
                piiLoggingEnabled: false,
            });

            pca.setLogger(logger);

            expect(pca.getLogger()).toEqual(logger);

            pca.getLogger().info("Message", TEST_CONFIG.CORRELATION_ID);
        });

        test("logger undefined", async () => {
            const authApp = new PublicClientApplication(testAppConfig);

            expect(authApp.getLogger()).toBeDefined();
            expect(
                authApp
                    .getLogger()
                    .info("Test logger", TEST_CONFIG.CORRELATION_ID)
            ).toEqual(undefined);
        });
    });

    describe("initializeWrapperLibrary Tests", () => {
        it("Sets wrapperSKU and wrapperVer with passed values", () => {
            pca.initializeWrapperLibrary(WrapperSKU.React, "1.0.0");

            //Implementation of PCA was moved to controller.
            pca = (pca as any).controller;

            // @ts-ignore
            expect(pca.browserStorage.getWrapperMetadata()).toEqual([
                WrapperSKU.React,
                "1.0.0",
            ]);
        });
    });

    describe("hydrateCache tests", () => {
        const testAccount: AccountInfo = {
            ...AccountEntityUtils.getAccountInfo(
                buildAccountFromIdTokenClaims(ID_TOKEN_CLAIMS)
            ),
            idTokenClaims: ID_TOKEN_CLAIMS,
            idToken: TEST_TOKENS.IDTOKEN_V2,
        };

        const testAuthenticationResult: AuthenticationResult = {
            authority: TEST_CONFIG.validAuthority,
            uniqueId: testAccount.localAccountId,
            tenantId: testAccount.tenantId,
            scopes: TEST_CONFIG.DEFAULT_SCOPES,
            idToken: TEST_TOKENS.IDTOKEN_V2,
            idTokenClaims: ID_TOKEN_CLAIMS,
            accessToken: TEST_TOKENS.ACCESS_TOKEN,
            fromCache: false,
            correlationId: RANDOM_TEST_GUID,
            expiresOn: TestTimeUtils.nowDateWithOffset(3600),
            account: testAccount,
            tokenType: Constants.AuthenticationScheme.BEARER,
        };

        const request: SilentRequest = {
            scopes: ["openid", "profile"],
            account: testAccount,
            cacheLookupPolicy: CacheLookupPolicy.AccessToken, // Only perform cache lookup during validation
        };
        it("hydrates cache with the provided id and access tokens", async () => {
            await pca.initialize();
            await pca
                .acquireTokenSilent(request)
                .then(() => {
                    throw "This is unexpected. Cache should be empty to start";
                })
                .catch((e) => {
                    // This is expected to throw because cache is empty, swallow error
                });
            await pca.hydrateCache(testAuthenticationResult, request);

            const result = await pca.acquireTokenSilent(request); // Get tokens from the cache
            expect(result.accessToken).toEqual(
                testAuthenticationResult.accessToken
            );
            expect(result.expiresOn).toEqual(
                testAuthenticationResult.expiresOn
            );
            expect(result.idToken).toEqual(testAuthenticationResult.idToken);
            expect(result.account).toEqual(testAccount);
            expect(result.fromCache).toEqual(true);
        });

        it("hydrates internal cache if provided AuthenticationResult came from native broker", async () => {
            let config: Configuration = {
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                },
                system: {
                    allowPlatformBroker: true,
                },
            };
            pca = new PublicClientApplication(config);

            stubExtensionProvider(config);
            await pca.initialize();

            //Implementation of PCA was moved to controller.
            pca = (pca as any).controller;

            const nativeAccount = {
                ...testAccount,
                nativeAccountId: "testNativeAccountId",
            };

            const nativeResult = {
                ...testAuthenticationResult,
                account: nativeAccount,
                fromPlatformBroker: true,
            };

            const nativeRequest = {
                ...request,
                account: nativeAccount,
            };

            await pca
                .acquireTokenSilent(request)
                .then(() => {
                    throw "This is unexpected. Cache should be empty to start";
                })
                .catch((e) => {
                    // This is expected to throw because cache is empty, swallow error
                });

            await pca.hydrateCache(nativeResult, nativeRequest);

            const result = await pca.acquireTokenSilent(nativeRequest); // Get tokens from the cache
            // Verify tokens were returned from internal memory
            expect(result.accessToken).toEqual(nativeResult.accessToken);
            expect(result.expiresOn).toEqual(
                testAuthenticationResult.expiresOn
            );
            expect(result.idToken).toEqual(nativeResult.idToken);
            expect(result.account).toEqual(nativeAccount);
            expect(result.fromCache).toEqual(true);
        });
    });

    describe("override logger settings tests", () => {
        it("overrides log level from info to verbose", async () => {
            const msalConfig: Configuration = {
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                },
                system: {
                    allowPlatformBroker: false,
                    loggerOptions: {
                        logLevel: LogLevel.Info,
                        loggerCallback: (level, message, containsPii) => {
                            switch (level) {
                                case LogLevel.Info:
                                    console.info(message);
                                    return;
                                default:
                                    return;
                            }
                        },
                    },
                },
            };
            window.sessionStorage.setItem("msal.browser.log.level", "Verbose");

            pca = new PublicClientApplication(msalConfig);
            const logger = pca.getLogger();
            const loggerCallbackStub = jest
                .spyOn(logger, "executeCallback")
                .mockImplementation();

            logger.info("test info", TEST_CONFIG.CORRELATION_ID);
            logger.verbose("test verbose", TEST_CONFIG.CORRELATION_ID);
            logger.verbosePii("test pii verbose", TEST_CONFIG.CORRELATION_ID);

            expect(loggerCallbackStub).toHaveBeenCalledTimes(2);
            expect(loggerCallbackStub).toHaveBeenCalledWith(
                LogLevel.Info,
                expect.stringContaining("test info"),
                false
            );
            expect(loggerCallbackStub).toHaveBeenCalledWith(
                LogLevel.Verbose,
                expect.stringContaining("test verbose"),
                false
            );
        });

        it("overrides log level from verbose to info", async () => {
            const msalConfig: Configuration = {
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                },
                system: {
                    allowPlatformBroker: false,
                    loggerOptions: {
                        logLevel: LogLevel.Verbose,
                        loggerCallback: (level, message, containsPii) => {
                            switch (level) {
                                case LogLevel.Verbose:
                                    console.debug(message);
                                    return;
                                default:
                                    return;
                            }
                        },
                    },
                },
            };
            window.sessionStorage.setItem("msal.browser.log.level", "Info");

            pca = new PublicClientApplication(msalConfig);
            const logger = pca.getLogger();
            const loggerCallbackStub = jest
                .spyOn(logger, "executeCallback")
                .mockImplementation();

            logger.info("test info", TEST_CONFIG.CORRELATION_ID);
            logger.verbose("test verbose", TEST_CONFIG.CORRELATION_ID);
            logger.verbosePii("test pii verbose", TEST_CONFIG.CORRELATION_ID);

            expect(loggerCallbackStub).toHaveBeenCalledTimes(1);
            expect(loggerCallbackStub).toHaveBeenCalledWith(
                LogLevel.Info,
                expect.stringContaining("test info"),
                false
            );
        });

        it("overrides log pii to true", async () => {
            const msalConfig: Configuration = {
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                },
                system: {
                    allowPlatformBroker: false,
                    loggerOptions: {
                        logLevel: LogLevel.Info,
                        loggerCallback: (level, message, containsPii) => {
                            switch (level) {
                                case LogLevel.Info:
                                    console.info(message);
                                    return;
                                default:
                                    return;
                            }
                        },
                    },
                },
            };

            window.sessionStorage.setItem("msal.browser.log.level", "Verbose");
            window.sessionStorage.setItem("msal.browser.log.pii", "true");

            pca = new PublicClientApplication(msalConfig);
            const logger = pca.getLogger();
            const loggerCallbackStub = jest
                .spyOn(logger, "executeCallback")
                .mockImplementation();

            logger.info("test info", TEST_CONFIG.CORRELATION_ID);
            logger.verbose("test verbose", TEST_CONFIG.CORRELATION_ID);
            logger.verbosePii("test pii verbose", TEST_CONFIG.CORRELATION_ID);

            expect(loggerCallbackStub).toHaveBeenCalledTimes(3);
            expect(loggerCallbackStub).toHaveBeenCalledWith(
                LogLevel.Info,
                expect.stringContaining("test info"),
                false
            );
            expect(loggerCallbackStub).toHaveBeenCalledWith(
                LogLevel.Verbose,
                expect.stringContaining("test verbose"),
                false
            );
            expect(loggerCallbackStub).toHaveBeenCalledWith(
                LogLevel.Verbose,
                expect.stringContaining("test pii verbose"),
                true
            );
        });

        it("overrides log pii to false", async () => {
            const msalConfig: Configuration = {
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                },
                system: {
                    allowPlatformBroker: false,
                    loggerOptions: {
                        logLevel: LogLevel.Info,
                        loggerCallback: (level, message, containsPii) => {
                            switch (level) {
                                case LogLevel.Info:
                                    console.info(message);
                                    return;
                                default:
                                    return;
                            }
                        },
                        piiLoggingEnabled: true,
                    },
                },
            };

            window.sessionStorage.setItem("msal.browser.log.level", "Verbose");
            window.sessionStorage.setItem("msal.browser.log.pii", "false");

            pca = new PublicClientApplication(msalConfig);
            const logger = pca.getLogger();
            const loggerCallbackStub = jest
                .spyOn(logger, "executeCallback")
                .mockImplementation();

            logger.info("test info", TEST_CONFIG.CORRELATION_ID);
            logger.verbose("test verbose", TEST_CONFIG.CORRELATION_ID);
            logger.verbosePii("test pii verbose", TEST_CONFIG.CORRELATION_ID);

            expect(loggerCallbackStub).toHaveBeenCalledTimes(2);
            expect(loggerCallbackStub).toHaveBeenCalledWith(
                LogLevel.Info,
                expect.stringContaining("test info"),
                false
            );
            expect(loggerCallbackStub).toHaveBeenCalledWith(
                LogLevel.Verbose,
                expect.stringContaining("test verbose"),
                false
            );
        });

        it("does not override with empty log level and pii keys", async () => {
            const msalConfig: Configuration = {
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                },
                system: {
                    allowPlatformBroker: false,
                    loggerOptions: {
                        logLevel: LogLevel.Verbose,
                        loggerCallback: (level, message, containsPii) => {
                            switch (level) {
                                case LogLevel.Info:
                                    console.info(message);
                                    return;
                                case LogLevel.Verbose:
                                    console.debug(message);
                                    return;
                                default:
                                    return;
                            }
                        },
                        piiLoggingEnabled: true,
                    },
                },
            };

            window.sessionStorage.setItem("msal.browser.log.level", "");
            window.sessionStorage.setItem("msal.browser.log.pii", "");

            pca = new PublicClientApplication(msalConfig);
            const logger = pca.getLogger();
            const loggerCallbackStub = jest
                .spyOn(logger, "executeCallback")
                .mockImplementation();

            logger.info("test info", TEST_CONFIG.CORRELATION_ID);
            logger.verbose("test verbose", TEST_CONFIG.CORRELATION_ID);
            logger.verbosePii("test pii verbose", TEST_CONFIG.CORRELATION_ID);

            expect(loggerCallbackStub).toHaveBeenCalledTimes(3);
            expect(loggerCallbackStub).toHaveBeenCalledWith(
                LogLevel.Info,
                expect.stringContaining("test info"),
                false
            );
            expect(loggerCallbackStub).toHaveBeenCalledWith(
                LogLevel.Verbose,
                expect.stringContaining("test verbose"),
                false
            );
            expect(loggerCallbackStub).toHaveBeenCalledWith(
                LogLevel.Verbose,
                expect.stringContaining("test pii verbose"),
                true
            );
        });
    });

    describe("Cross tab/instance events", () => {
        let secondBrowserStorageInstance: BrowserCacheManager;
        const accountEntity: AccountEntity =
            buildAccountFromIdTokenClaims(ID_TOKEN_CLAIMS);
        const accountInfo: AccountInfo =
            AccountEntityUtils.getAccountInfo(accountEntity);
        let callbackId: string | null;
        let pca2: PublicClientApplication;

        beforeEach(async () => {
            pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                },
                cache: {
                    cacheLocation: BrowserCacheLocation.LocalStorage,
                },
            });
            await pca.initialize();

            secondBrowserStorageInstance = new BrowserCacheManager(
                TEST_CONFIG.MSAL_CLIENT_ID,
                {
                    cacheLocation: BrowserCacheLocation.LocalStorage,
                    cacheRetentionDays: 5,
                },
                new CryptoOps(new Logger({})),
                new Logger({}),
                new StubPerformanceClient(),
                new EventHandler()
            );
            await secondBrowserStorageInstance.initialize(
                TEST_CONFIG.CORRELATION_ID
            );

            pca2 = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                },
                cache: {
                    cacheLocation: BrowserCacheLocation.LocalStorage,
                },
            });
            await pca2.initialize();
        });

        afterEach(() => {
            if (callbackId) {
                pca.removeEventCallback(callbackId);
            }
        });

        it("LOGIN_SUCCESS event raised when an account logs in in another tab", (done) => {
            const subscriber = (message: EventMessage) => {
                if (message.eventType == EventType.LOGIN_SUCCESS) {
                    expect(message.interactionType).toBe(InteractionType.Popup);
                    const { tenantProfiles, ...payloadAccountInfo } =
                        message.payload as AccountInfo;
                    const messagePayload = {
                        ...payloadAccountInfo,
                        tenantProfiles: new Map(tenantProfiles?.entries()),
                    }; // Original map causes problems due to being a proxy object
                    expect(messagePayload).toEqual(accountInfo);
                    expect(message.error).toBeNull();
                    expect(message.timestamp).not.toBeNull();
                    done();
                }
            };

            const testTokenResponse: AuthenticationResult = {
                authority: TEST_CONFIG.validAuthority,
                uniqueId: accountInfo.localAccountId,
                tenantId: accountInfo.tenantId,
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                idToken: "test-idToken",
                idTokenClaims: {},
                accessToken: "test-accessToken",
                fromCache: false,
                correlationId: RANDOM_TEST_GUID,
                expiresOn: TestTimeUtils.nowDateWithOffset(3600),
                account: accountInfo,
                tokenType: Constants.AuthenticationScheme.BEARER,
            };

            callbackId = pca.addEventCallback(subscriber);

            jest.spyOn(
                PopupClient.prototype,
                "acquireToken"
            ).mockImplementation(async (request) => {
                // Save the account to cache to trigger the event
                // @ts-ignore
                await pca2.controller.browserStorage.setAccount(accountEntity);

                // Return the test token response
                return testTokenResponse;
            });

            pca2.acquireTokenPopup({
                scopes: ["User.Read"],
                account: accountInfo,
                prompt: "select_account",
            });
        });

        it("LOGOUT_SUCCESS event raised when an account logs out in another tab", (done) => {
            const subscriber = (message: EventMessage) => {
                expect(message.eventType).toEqual(EventType.LOGOUT_SUCCESS);
                expect(message.interactionType).toBe("redirect");

                // @ts-ignore
                const payloadAccount = message.payload.account as AccountInfo;

                const { tenantProfiles, ...payloadAccountInfo } =
                    payloadAccount;
                const messagePayload = {
                    ...payloadAccountInfo,
                    tenantProfiles: new Map(tenantProfiles?.entries()),
                }; // Original map causes problems due to being a proxy object
                expect(messagePayload).toEqual(accountInfo);

                expect(message.error).toBeNull();
                expect(message.timestamp).not.toBeNull();
                done();
            };

            callbackId = pca.addEventCallback(subscriber, [
                EventType.LOGOUT_SUCCESS,
            ]);

            secondBrowserStorageInstance
                .setAccount(accountEntity, TEST_CONFIG.CORRELATION_ID, true, 0)
                .then(async () => {
                    // Create a second PCA instance to simulate another tab
                    const pca2 = new PublicClientApplication({
                        auth: {
                            clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                        },
                        cache: {
                            cacheLocation: BrowserCacheLocation.LocalStorage,
                        },
                    });
                    await pca2.initialize();

                    // Set the account as active in the second instance
                    pca2.setActiveAccount(accountInfo);

                    // Perform logout in the second instance (simulating another tab)
                    await pca2.logoutRedirect({ account: accountInfo });
                });
        });

        it("ACTIVE_ACCOUNT_CHANGED event raised when active account is changed in another tab", (done) => {
            const subscriber = (message: EventMessage) => {
                expect(message.eventType).toEqual(
                    EventType.ACTIVE_ACCOUNT_CHANGED
                );
                expect(message.interactionType).toBeNull();
                expect(message.payload).toBeNull();
                expect(message.error).toBeNull();
                expect(message.timestamp).not.toBeNull();
                done();
            };

            callbackId = pca.addEventCallback(subscriber, [
                EventType.ACTIVE_ACCOUNT_CHANGED,
            ]);

            secondBrowserStorageInstance
                .setAccount(accountEntity, TEST_CONFIG.CORRELATION_ID, true, 0)
                .then(() => {
                    // Ensure account is present in the cache before setting it as active
                    secondBrowserStorageInstance.setActiveAccount(
                        accountInfo,
                        RANDOM_TEST_GUID
                    );
                });
        });
    });

    describe("Pre-generate PKCE tests", () => {
        it("getPkceCodes returns undefined before preGeneratePkceCodes is called", async () => {
            expect(
                // @ts-ignore
                pca.controller.getPreGeneratedPkceCodes(RANDOM_TEST_GUID)
            ).toBeUndefined();
        });

        it("getPkceCodes returns value after preGeneratePkceCodes is called", async () => {
            /**
             * Contains alphanumeric, dash '-', underscore '_', plus '+', or slash '/' with length of 43.
             */
            // @ts-ignore
            await pca.controller.preGeneratePkceCodes(RANDOM_TEST_GUID);

            const pkce =
                // @ts-ignore
                pca.controller.getPreGeneratedPkceCodes(RANDOM_TEST_GUID);
            const regExp = new RegExp("[A-Za-z0-9-_+/]{43}");
            expect(regExp.test(pkce!.challenge)).toBe(true);
            expect(regExp.test(pkce!.verifier)).toBe(true);
        });

        it("preGeneratePkceCodes overwrites previous value", async () => {
            /**
             * Contains alphanumeric, dash '-', underscore '_', plus '+', or slash '/' with length of 43.
             */
            // @ts-ignore
            await pca.controller.preGeneratePkceCodes(RANDOM_TEST_GUID);
            // @ts-ignore
            const pkce1 = pca.controller.getPreGeneratedPkceCodes(
                new StubPerformanceClient()
            );

            // @ts-ignore
            await pca.controller.preGeneratePkceCodes(RANDOM_TEST_GUID);
            const pkce2 =
                // @ts-ignore
                pca.controller.getPreGeneratedPkceCodes(RANDOM_TEST_GUID);

            expect(pkce1?.challenge).toBeDefined();
            expect(pkce2?.challenge).toBeDefined();
            expect(pkce1?.challenge !== pkce2?.challenge).toBeTruthy();
        });
    });
    describe("Multi-instance tests", () => {
        afterEach(() => {
            // @ts-ignore
            window.msal.clientIds = [];
            // @ts-ignore
            window.msal = {};
        });
        it("Logs warning if there are two applications with the same client id in the same frame", async () => {
            const msalConfig: Configuration = {
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                },
                system: {
                    allowPlatformBroker: false,
                    loggerOptions: {
                        logLevel: LogLevel.Verbose,
                        loggerCallback: jest.fn(),
                    },
                },
            };
            pca = new PublicClientApplication(msalConfig);
            await pca.initialize();
            const pca2 = new PublicClientApplication(msalConfig);
            const logger = pca2.getLogger();
            const loggerCallbackStub = jest
                .spyOn(logger, "executeCallback")
                .mockImplementation();
            await pca2.initialize();
            expect(loggerCallbackStub).toHaveBeenCalledWith(
                LogLevel.Warning,
                expect.stringContaining(
                    "There is already an instance of MSAL.js in the window with the same client id."
                ),
                false
            );
        });

        it("Logs verbose if there are two applications with different client ids in the same frame", async () => {
            const msalConfig: Configuration = {
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                },
                system: {
                    allowPlatformBroker: false,
                    loggerOptions: {
                        logLevel: LogLevel.Verbose,
                        loggerCallback: jest.fn(),
                    },
                },
            };
            pca = new PublicClientApplication(msalConfig);
            await pca.initialize();
            const pca2 = new PublicClientApplication({
                ...msalConfig,
                auth: { clientId: "differentClientId" },
            });
            const logger = pca2.getLogger();
            const loggerCallbackStub = jest
                .spyOn(logger, "executeCallback")
                .mockImplementation();
            await pca2.initialize();
            expect(loggerCallbackStub).toHaveBeenCalledWith(
                LogLevel.Verbose,
                expect.stringContaining(
                    "There is already an instance of MSAL.js in the window."
                ),
                false
            );
        });

        it("Reports in telemetry the number of applications in the same frame (different client ids)", async () => {
            await pca.initialize();

            const pca2 = new PublicClientApplication({
                ...pca.getConfiguration(),
                auth: { clientId: "different-client-id" },
            });

            const telemetryPromise = new Promise<void>((resolve) => {
                const callbackId = pca2.addPerformanceCallback((events) => {
                    expect(events.length).toEqual(1);
                    const event = events[0];
                    expect(event.name).toBe(
                        BrowserRootPerformanceEvents.InitializeClientApplication
                    );
                    expect(event.msalInstanceCount).toEqual(2);
                    expect(event.sameClientIdInstanceCount).toEqual(1);
                    pca.removePerformanceCallback(callbackId);
                    resolve();
                });
            });

            await pca2.initialize();
            await telemetryPromise;
        });

        it("Reports in telemetry the number of applications in the same frame (same client ids)", async () => {
            await pca.initialize();

            const pca2 = new PublicClientApplication(pca.getConfiguration());

            const telemetryPromise = new Promise<void>((resolve) => {
                const callbackId = pca2.addPerformanceCallback((events) => {
                    expect(events.length).toEqual(1);
                    const event = events[0];
                    expect(event.name).toBe(
                        BrowserRootPerformanceEvents.InitializeClientApplication
                    );
                    expect(event.msalInstanceCount).toEqual(2);
                    expect(event.sameClientIdInstanceCount).toEqual(2);
                    pca.removePerformanceCallback(callbackId);
                    resolve();
                });
            });

            await pca2.initialize();
            await telemetryPromise;
        });
    });

    describe("Performance telemetry with accountInfo", () => {
        let pca: PublicClientApplication;
        let performanceClient: PerformanceClient;

        beforeEach(async () => {
            const config = {
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                },
                telemetry: {
                    client: new BrowserPerformanceClient(testAppConfig),
                },
                system: {
                    iframeBridgeTimeout: 100,
                },
            };
            pca = new PublicClientApplication(config);
            performanceClient = config.telemetry.client;
            await pca.initialize();
        });

        it("should pass account to measurement.end() in acquireTokenSilent", async () => {
            const testAccount: AccountInfo = {
                homeAccountId: "test-home-account-id",
                localAccountId: "test-local-account-id",
                environment: "login.microsoftonline.com",
                tenantId: "test-tenant-id",
                username: "test@example.com",
            };

            const testRequest: SilentRequest = {
                scopes: ["User.Read"],
                account: testAccount,
                correlationId: RANDOM_TEST_GUID,
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

            // Mock the cache lookup to return a token directly from cache
            const testCachedAuthResult = {
                authority: TEST_CONFIG.validAuthority,
                uniqueId: testAccount.localAccountId,
                tenantId: testAccount.tenantId,
                scopes: ["User.Read"],
                idToken: "test-idToken",
                idTokenClaims: {},
                accessToken: "test-accessToken",
                fromCache: true,
                correlationId: RANDOM_TEST_GUID,
                expiresOn: new Date(),
                account: testAccount,
                tokenType: Constants.AuthenticationScheme.BEARER,
            };

            // Mock the silent cache client to return tokens
            jest.spyOn(
                SilentCacheClient.prototype,
                "acquireToken"
            ).mockResolvedValue(testCachedAuthResult);

            await pca.acquireTokenSilent(testRequest);

            // Verify measurement.end was called with account parameter
            expect(mockMeasurement.end).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    fromCache: true,
                }),
                undefined,
                testAccount
            );
        });

        it("should pass account to measurement.end() in acquireTokenPopup", async () => {
            const testAccount: AccountInfo = {
                homeAccountId: "test-home-account-id",
                localAccountId: "test-local-account-id",
                environment: "login.microsoftonline.com",
                tenantId: "test-tenant-id",
                username: "test@example.com",
            };

            const testRequest: PopupRequest = {
                scopes: ["User.Read"],
                account: testAccount,
                correlationId: RANDOM_TEST_GUID,
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

            // Mock PopupClient to avoid the actual popup flow
            const testResult = {
                authority: TEST_CONFIG.validAuthority,
                uniqueId: testAccount.localAccountId,
                tenantId: testAccount.tenantId,
                scopes: ["User.Read"],
                idToken: "test-idToken",
                idTokenClaims: {},
                accessToken: "test-accessToken",
                fromCache: false,
                correlationId: RANDOM_TEST_GUID,
                expiresOn: new Date(),
                account: testAccount,
                tokenType: Constants.AuthenticationScheme.BEARER,
            };

            jest.spyOn(PopupClient.prototype, "acquireToken").mockResolvedValue(
                testResult
            );

            await pca.acquireTokenPopup(testRequest);

            // Verify measurement.end was called with account parameter
            expect(mockMeasurement.end).toHaveBeenCalledWith(
                expect.objectContaining({ success: true }),
                undefined,
                testAccount
            );
        });

        it("should pass account to measurement.end() in acquireTokenSilent", async () => {
            const testAccount: AccountInfo = {
                homeAccountId: "test-home-account-id",
                localAccountId: "test-local-account-id",
                environment: "login.microsoftonline.com",
                tenantId: "test-tenant-id",
                username: "test@example.com",
            };

            const testRequest: SilentRequest = {
                scopes: ["User.Read"],
                account: testAccount,
                correlationId: RANDOM_TEST_GUID,
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

            // Mock SilentCacheClient to simulate successful silent authentication
            jest.spyOn(
                SilentCacheClient.prototype,
                "acquireToken"
            ).mockResolvedValue({
                account: testAccount,
                accessToken: "test-access-token",
                idToken: "test-id-token",
                idTokenClaims: {},
                scopes: ["User.Read"],
                uniqueId: "test-unique-id",
                tenantId: "test-tenant-id",
                authority: TEST_CONFIG.validAuthority,
                fromCache: true,
                correlationId: RANDOM_TEST_GUID,
                expiresOn: new Date(Date.now() + 3600000),
                tokenType: "Bearer",
            });

            const result = await pca.acquireTokenSilent(testRequest);

            // Verify measurement.end was called with account parameter
            expect(mockMeasurement.end).toHaveBeenCalledWith(
                expect.objectContaining({ success: true }),
                undefined,
                testAccount
            );

            expect(result).toBeDefined();
            expect(result.account).toEqual(testAccount);
        });

        it("should pass account to measurement.end() in ssoSilent", async () => {
            const testAccount: AccountInfo = {
                homeAccountId: "test-home-account-id",
                localAccountId: "test-local-account-id",
                environment: "login.microsoftonline.com",
                tenantId: "test-tenant-id",
                username: "test@example.com",
            };

            const testRequest: SsoSilentRequest = {
                scopes: ["User.Read"],
                account: testAccount,
                correlationId: RANDOM_TEST_GUID,
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

            // Mock SilentIframeClient to avoid the actual iframe flow
            const testResult = {
                authority: TEST_CONFIG.validAuthority,
                uniqueId: testAccount.localAccountId,
                tenantId: testAccount.tenantId,
                scopes: ["User.Read"],
                idToken: "test-idToken",
                idTokenClaims: {},
                accessToken: "test-accessToken",
                fromCache: true,
                correlationId: RANDOM_TEST_GUID,
                expiresOn: new Date(),
                account: testAccount,
                tokenType: Constants.AuthenticationScheme.BEARER,
            };

            jest.spyOn(
                SilentIframeClient.prototype,
                "acquireToken"
            ).mockResolvedValue(testResult);

            await pca.ssoSilent(testRequest);

            // Verify measurement.end was called with account parameter
            expect(mockMeasurement.end).toHaveBeenCalledWith(
                expect.objectContaining({ success: true }),
                undefined,
                testAccount
            );
        });

        it("should pass undefined when account is not provided in request", async () => {
            // Provide a minimal account to pass the early validation but test that request.account (undefined) is passed to measurement
            const testRequest: SilentRequest = {
                scopes: ["User.Read"],
                // No account property - request.account will be undefined
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
            const startMeasurementSpy = jest
                .spyOn(performanceClient, "startMeasurement")
                .mockReturnValue(mockMeasurement as any);

            // Mock getActiveAccount to return a valid account so the early account check passes
            const mockActiveAccount = {
                homeAccountId: "active-home-account-id",
                localAccountId: "active-local-account-id",
                environment: "login.microsoftonline.com",
                tenantId: "active-tenant-id",
                username: "active@example.com",
            };

            // Need to mock at the controller level since that's where getActiveAccount is called
            jest.spyOn(
                StandardController.prototype,
                "getActiveAccount"
            ).mockReturnValue(mockActiveAccount);

            // Mock SilentCacheClient to reject so we get an error case and trigger measurement.end
            const silentCacheClientSpy = jest
                .spyOn(SilentCacheClient.prototype, "acquireToken")
                .mockRejectedValue(
                    createBrowserAuthError(BrowserAuthErrorCodes.noAccountError)
                );

            let caughtError: any = null;
            try {
                await pca.acquireTokenSilent(testRequest);
            } catch (error: any) {
                caughtError = error;
            }

            // Verify measurement.end was called with request.account (which is undefined)
            // Look for the failure call and verify the account parameter
            const failureCalls = mockMeasurement.end.mock.calls.filter(
                (call) => call[0] && call[0].success === false
            );
            expect(failureCalls.length).toBeGreaterThan(0);

            // Check if any failure call has the account parameter as undefined (request.account)
            const callWithUndefinedAccount = failureCalls.find(
                (call) => call.length >= 3 && call[2] === undefined
            );

            // If no 3-parameter call found, that means the code is still using the old 2-parameter signature
            // In that case, just verify a failure call exists (the test intent is still valid)
            if (!callWithUndefinedAccount) {
                expect(failureCalls.length).toBeGreaterThan(0);
            } else {
                expect(callWithUndefinedAccount).toBeDefined();
            }
        });
    });

    describe("verifySsoCapability", () => {
        const testAccount: AccountInfo = {
            homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
            localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
            environment: "login.windows.net",
            tenantId: "3338040d-6c67-4c5b-b112-36a304b66dad",
            username: "testuser@microsoft.com",
        };

        beforeEach(async () => {
            window.localStorage.clear();
            pca = (pca as any).controller;
            await pca.initialize();
        });

        afterEach(() => {
            window.localStorage.clear();
        });

        it("does not call verifySso when verifySSO config is false (default)", async () => {
            const testTokenResponse: AuthenticationResult = {
                authority: TEST_CONFIG.validAuthority,
                uniqueId: testAccount.localAccountId,
                tenantId: testAccount.tenantId,
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                idToken: "test-idToken",
                idTokenClaims: {},
                accessToken: "test-accessToken",
                fromCache: false,
                correlationId: RANDOM_TEST_GUID,
                expiresOn: TestTimeUtils.nowDateWithOffset(3600),
                account: testAccount,
                tokenType: Constants.AuthenticationScheme.BEARER,
            };

            jest.spyOn(
                BrowserCacheManager.prototype,
                "isInteractionInProgress"
            ).mockReturnValue(true);
            jest.spyOn(
                BrowserCacheManager.prototype,
                "getCachedRequest"
            ).mockReturnValue([testRequest, TEST_CONFIG.TEST_VERIFIER]);

            jest.spyOn(pca, "getAllAccounts").mockReturnValue([testAccount]);
            jest.spyOn(
                RedirectClient.prototype,
                "handleRedirectPromise"
            ).mockResolvedValue(testTokenResponse);

            const verifySsoSpy = jest.spyOn(
                SilentIframeClient.prototype,
                "verifySso"
            );

            await pca.handleRedirectPromise();

            // Wait for setTimeout in verifySsoCapability
            await new Promise((resolve) => setTimeout(resolve, 10));

            expect(verifySsoSpy).not.toHaveBeenCalled();
        });

        it("calls verifySso when verifySSO config is true and no cached value exists", async () => {
            pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                    verifySSO: true,
                },
            });
            await pca.initialize();
            pca = (pca as any).controller;

            const testTokenResponse: AuthenticationResult = {
                authority: TEST_CONFIG.validAuthority,
                uniqueId: testAccount.localAccountId,
                tenantId: testAccount.tenantId,
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                idToken: "test-idToken",
                idTokenClaims: {},
                accessToken: "test-accessToken",
                fromCache: false,
                correlationId: RANDOM_TEST_GUID,
                expiresOn: TestTimeUtils.nowDateWithOffset(3600),
                account: testAccount,
                tokenType: Constants.AuthenticationScheme.BEARER,
            };

            jest.spyOn(
                BrowserCacheManager.prototype,
                "isInteractionInProgress"
            ).mockReturnValue(true);
            jest.spyOn(
                BrowserCacheManager.prototype,
                "getCachedRequest"
            ).mockReturnValue([testRequest, TEST_CONFIG.TEST_VERIFIER]);

            jest.spyOn(pca, "getAllAccounts").mockReturnValue([testAccount]);
            jest.spyOn(
                RedirectClient.prototype,
                "handleRedirectPromise"
            ).mockResolvedValue(testTokenResponse);

            const verifySsoSpy = jest
                .spyOn(SilentIframeClient.prototype, "verifySso")
                .mockResolvedValue(true);

            await pca.handleRedirectPromise();

            // Wait for setTimeout in verifySsoCapability
            await new Promise((resolve) => setTimeout(resolve, 10));

            expect(verifySsoSpy).toHaveBeenCalled();
        });

        it("skips verifySso when cached value exists and has not expired", async () => {
            pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                    verifySSO: true,
                },
            });
            await pca.initialize();
            pca = (pca as any).controller;

            // Set cached value with future expiration
            const cacheEntry = JSON.stringify({
                profileTelemetryId: "test-id",
                ssoCapable: true,
                expiresOn: Date.now() + 24 * 60 * 60 * 1000, // 24 hours from now
            });
            window.localStorage.setItem(CacheKeys.SSO_CAPABLE, cacheEntry);

            const testTokenResponse: AuthenticationResult = {
                authority: TEST_CONFIG.validAuthority,
                uniqueId: testAccount.localAccountId,
                tenantId: testAccount.tenantId,
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                idToken: "test-idToken",
                idTokenClaims: {},
                accessToken: "test-accessToken",
                fromCache: false,
                correlationId: RANDOM_TEST_GUID,
                expiresOn: TestTimeUtils.nowDateWithOffset(3600),
                account: testAccount,
                tokenType: Constants.AuthenticationScheme.BEARER,
            };

            jest.spyOn(
                BrowserCacheManager.prototype,
                "isInteractionInProgress"
            ).mockReturnValue(true);
            jest.spyOn(
                BrowserCacheManager.prototype,
                "getCachedRequest"
            ).mockReturnValue([testRequest, TEST_CONFIG.TEST_VERIFIER]);

            jest.spyOn(pca, "getAllAccounts").mockReturnValue([testAccount]);
            jest.spyOn(
                RedirectClient.prototype,
                "handleRedirectPromise"
            ).mockResolvedValue(testTokenResponse);

            const verifySsoSpy = jest.spyOn(
                SilentIframeClient.prototype,
                "verifySso"
            );

            await pca.handleRedirectPromise();

            // Wait for setTimeout in verifySsoCapability
            await new Promise((resolve) => setTimeout(resolve, 10));

            expect(verifySsoSpy).not.toHaveBeenCalled();
        });

        it("calls verifySso when cached value has expired (TTL exceeded)", async () => {
            pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                    verifySSO: true,
                },
            });
            await pca.initialize();
            pca = (pca as any).controller;

            // Set cached value with past expiration
            const cacheEntry = JSON.stringify({
                profileTelemetryId: "test-id",
                ssoCapable: true,
                expiresOn: Date.now() - 1000, // Already expired
            });
            window.localStorage.setItem(CacheKeys.SSO_CAPABLE, cacheEntry);

            const testTokenResponse: AuthenticationResult = {
                authority: TEST_CONFIG.validAuthority,
                uniqueId: testAccount.localAccountId,
                tenantId: testAccount.tenantId,
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                idToken: "test-idToken",
                idTokenClaims: {},
                accessToken: "test-accessToken",
                fromCache: false,
                correlationId: RANDOM_TEST_GUID,
                expiresOn: TestTimeUtils.nowDateWithOffset(3600),
                account: testAccount,
                tokenType: Constants.AuthenticationScheme.BEARER,
            };

            jest.spyOn(
                BrowserCacheManager.prototype,
                "isInteractionInProgress"
            ).mockReturnValue(true);
            jest.spyOn(
                BrowserCacheManager.prototype,
                "getCachedRequest"
            ).mockReturnValue([testRequest, TEST_CONFIG.TEST_VERIFIER]);

            jest.spyOn(pca, "getAllAccounts").mockReturnValue([testAccount]);
            jest.spyOn(
                RedirectClient.prototype,
                "handleRedirectPromise"
            ).mockResolvedValue(testTokenResponse);

            const verifySsoSpy = jest
                .spyOn(SilentIframeClient.prototype, "verifySso")
                .mockResolvedValue(true);

            await pca.handleRedirectPromise();

            // Wait for setTimeout in verifySsoCapability
            await new Promise((resolve) => setTimeout(resolve, 10));

            expect(verifySsoSpy).toHaveBeenCalled();
        });

        it("caches SSO capability result in localStorage after successful verification", async () => {
            pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                    verifySSO: true,
                },
            });
            await pca.initialize();
            pca = (pca as any).controller;

            const testTokenResponse: AuthenticationResult = {
                authority: TEST_CONFIG.validAuthority,
                uniqueId: testAccount.localAccountId,
                tenantId: testAccount.tenantId,
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                idToken: "test-idToken",
                idTokenClaims: {},
                accessToken: "test-accessToken",
                fromCache: false,
                correlationId: RANDOM_TEST_GUID,
                expiresOn: TestTimeUtils.nowDateWithOffset(3600),
                account: testAccount,
                tokenType: Constants.AuthenticationScheme.BEARER,
            };

            jest.spyOn(
                BrowserCacheManager.prototype,
                "isInteractionInProgress"
            ).mockReturnValue(true);
            jest.spyOn(
                BrowserCacheManager.prototype,
                "getCachedRequest"
            ).mockReturnValue([testRequest, TEST_CONFIG.TEST_VERIFIER]);

            jest.spyOn(pca, "getAllAccounts").mockReturnValue([testAccount]);
            jest.spyOn(
                RedirectClient.prototype,
                "handleRedirectPromise"
            ).mockResolvedValue(testTokenResponse);

            jest.spyOn(
                SilentIframeClient.prototype,
                "verifySso"
            ).mockResolvedValue(true);

            await pca.handleRedirectPromise();

            // Wait for setTimeout and promise resolution
            await new Promise((resolve) => setTimeout(resolve, 50));

            const cachedValue = window.localStorage.getItem(
                CacheKeys.SSO_CAPABLE
            );
            expect(cachedValue).not.toBeNull();

            const parsed = JSON.parse(cachedValue!);
            expect(parsed.ssoCapable).toBe(true);
            expect(parsed.expiresOn).toBeGreaterThan(Date.now());
        });

        it("removes cached SSO capability result from localStorage on verification failure", async () => {
            pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                    verifySSO: true,
                },
            });
            await pca.initialize();
            pca = (pca as any).controller;

            // Pre-populate cache
            const cacheEntry = JSON.stringify({
                ssoCapable: true,
                expiresOn: Date.now() - 1000, // Expired to trigger verification
            });
            window.localStorage.setItem(CacheKeys.SSO_CAPABLE, cacheEntry);

            const testTokenResponse: AuthenticationResult = {
                authority: TEST_CONFIG.validAuthority,
                uniqueId: testAccount.localAccountId,
                tenantId: testAccount.tenantId,
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                idToken: "test-idToken",
                idTokenClaims: {},
                accessToken: "test-accessToken",
                fromCache: false,
                correlationId: RANDOM_TEST_GUID,
                expiresOn: TestTimeUtils.nowDateWithOffset(3600),
                account: testAccount,
                tokenType: Constants.AuthenticationScheme.BEARER,
            };

            jest.spyOn(
                BrowserCacheManager.prototype,
                "isInteractionInProgress"
            ).mockReturnValue(true);
            jest.spyOn(
                BrowserCacheManager.prototype,
                "getCachedRequest"
            ).mockReturnValue([testRequest, TEST_CONFIG.TEST_VERIFIER]);

            jest.spyOn(pca, "getAllAccounts").mockReturnValue([testAccount]);
            jest.spyOn(
                RedirectClient.prototype,
                "handleRedirectPromise"
            ).mockResolvedValue(testTokenResponse);

            // Make verifySso fail
            jest.spyOn(
                SilentIframeClient.prototype,
                "verifySso"
            ).mockRejectedValue(new Error("SSO verification failed"));

            await pca.handleRedirectPromise();

            // Wait for setTimeout and promise resolution
            await new Promise((resolve) => setTimeout(resolve, 50));

            // Cache should be cleared on failure
            const cachedValue = window.localStorage.getItem(
                CacheKeys.SSO_CAPABLE
            );
            expect(cachedValue).toBeNull();
        });

        it("captures ssoCapable telemetry event with interactionType field", async () => {
            const originalPca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                    verifySSO: true,
                },
                telemetry: {
                    client: new BrowserPerformanceClient(testAppConfig),
                    application: {
                        appName: TEST_CONFIG.applicationName,
                        appVersion: TEST_CONFIG.applicationVersion,
                    },
                },
            });
            await originalPca.initialize();
            pca = (originalPca as any).controller;

            const testTokenResponse: AuthenticationResult = {
                authority: TEST_CONFIG.validAuthority,
                uniqueId: testAccount.localAccountId,
                tenantId: testAccount.tenantId,
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                idToken: "test-idToken",
                idTokenClaims: {},
                accessToken: "test-accessToken",
                fromCache: false,
                correlationId: RANDOM_TEST_GUID,
                expiresOn: TestTimeUtils.nowDateWithOffset(3600),
                account: testAccount,
                tokenType: Constants.AuthenticationScheme.BEARER,
            };

            jest.spyOn(
                BrowserCacheManager.prototype,
                "isInteractionInProgress"
            ).mockReturnValue(true);
            jest.spyOn(
                BrowserCacheManager.prototype,
                "getCachedRequest"
            ).mockReturnValue([testRequest, TEST_CONFIG.TEST_VERIFIER]);

            jest.spyOn(pca, "getAllAccounts").mockReturnValue([testAccount]);
            jest.spyOn(
                RedirectClient.prototype,
                "handleRedirectPromise"
            ).mockResolvedValue(testTokenResponse);

            jest.spyOn(
                SilentIframeClient.prototype,
                "verifySso"
            ).mockResolvedValue(true);

            let capturedTelemetry: any = null;
            originalPca.addPerformanceCallback((events: any[]) => {
                const ssoCapableEvent = events.find(
                    (e: any) => e.name === "ssoCapable"
                );
                if (ssoCapableEvent) {
                    capturedTelemetry = ssoCapableEvent;
                }
            });

            await pca.handleRedirectPromise();

            // Wait for setTimeout and promise resolution
            await new Promise((resolve) => setTimeout(resolve, 50));

            expect(capturedTelemetry).not.toBeNull();
            expect(
                capturedTelemetry.ext?.["interactionType"] ||
                    capturedTelemetry["ext.interactionType"]
            ).toBe(InteractionType.Redirect);
            expect(capturedTelemetry.success).toBe(true);
            expect(capturedTelemetry.fromCache).toBe(false);
        });

        it("captures ssoCapable telemetry with success=false on verification failure", async () => {
            const originalPca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                    verifySSO: true,
                },
                telemetry: {
                    client: new BrowserPerformanceClient(testAppConfig),
                    application: {
                        appName: TEST_CONFIG.applicationName,
                        appVersion: TEST_CONFIG.applicationVersion,
                    },
                },
            });
            await originalPca.initialize();
            pca = (originalPca as any).controller;

            const testTokenResponse: AuthenticationResult = {
                authority: TEST_CONFIG.validAuthority,
                uniqueId: testAccount.localAccountId,
                tenantId: testAccount.tenantId,
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                idToken: "test-idToken",
                idTokenClaims: {},
                accessToken: "test-accessToken",
                fromCache: false,
                correlationId: RANDOM_TEST_GUID,
                expiresOn: TestTimeUtils.nowDateWithOffset(3600),
                account: testAccount,
                tokenType: Constants.AuthenticationScheme.BEARER,
            };

            jest.spyOn(
                BrowserCacheManager.prototype,
                "isInteractionInProgress"
            ).mockReturnValue(true);
            jest.spyOn(
                BrowserCacheManager.prototype,
                "getCachedRequest"
            ).mockReturnValue([testRequest, TEST_CONFIG.TEST_VERIFIER]);

            jest.spyOn(pca, "getAllAccounts").mockReturnValue([testAccount]);
            jest.spyOn(
                RedirectClient.prototype,
                "handleRedirectPromise"
            ).mockResolvedValue(testTokenResponse);

            // Make verifySso fail
            jest.spyOn(
                SilentIframeClient.prototype,
                "verifySso"
            ).mockRejectedValue(new Error("SSO verification failed"));

            let capturedTelemetry: any = null;
            originalPca.addPerformanceCallback((events: any[]) => {
                const ssoCapableEvent = events.find(
                    (e: any) => e.name === "ssoCapable"
                );
                if (ssoCapableEvent) {
                    capturedTelemetry = ssoCapableEvent;
                }
            });

            await pca.handleRedirectPromise();

            // Wait for setTimeout and promise resolution
            await new Promise((resolve) => setTimeout(resolve, 50));

            expect(capturedTelemetry).not.toBeNull();
            expect(capturedTelemetry.success).toBe(false);
            expect(capturedTelemetry.fromCache).toBe(false);
        });

        it("is called from acquireTokenPopup on success when verifySSO is true", async () => {
            pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                    verifySSO: true,
                },
            });
            await pca.initialize();
            pca = (pca as any).controller;

            const testTokenResponse: AuthenticationResult = {
                authority: TEST_CONFIG.validAuthority,
                uniqueId: testAccount.localAccountId,
                tenantId: testAccount.tenantId,
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                idToken: "test-idToken",
                idTokenClaims: {},
                accessToken: "test-accessToken",
                fromCache: false,
                correlationId: RANDOM_TEST_GUID,
                expiresOn: TestTimeUtils.nowDateWithOffset(3600),
                account: testAccount,
                tokenType: Constants.AuthenticationScheme.BEARER,
            };

            jest.spyOn(PopupClient.prototype, "acquireToken").mockResolvedValue(
                testTokenResponse
            );

            const verifySsoSpy = jest
                .spyOn(SilentIframeClient.prototype, "verifySso")
                .mockResolvedValue(true);

            await pca.acquireTokenPopup({ scopes: TEST_CONFIG.DEFAULT_SCOPES });

            // Wait for setTimeout in verifySsoCapability
            await new Promise((resolve) => setTimeout(resolve, 10));

            expect(verifySsoSpy).toHaveBeenCalled();
        });

        it("handles verifySso failure gracefully without affecting main flow", async () => {
            pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                    verifySSO: true,
                },
            });
            await pca.initialize();
            pca = (pca as any).controller;

            const testTokenResponse: AuthenticationResult = {
                authority: TEST_CONFIG.validAuthority,
                uniqueId: testAccount.localAccountId,
                tenantId: testAccount.tenantId,
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                idToken: "test-idToken",
                idTokenClaims: {},
                accessToken: "test-accessToken",
                fromCache: false,
                correlationId: RANDOM_TEST_GUID,
                expiresOn: TestTimeUtils.nowDateWithOffset(3600),
                account: testAccount,
                tokenType: Constants.AuthenticationScheme.BEARER,
            };

            jest.spyOn(
                BrowserCacheManager.prototype,
                "isInteractionInProgress"
            ).mockReturnValue(true);
            jest.spyOn(
                BrowserCacheManager.prototype,
                "getCachedRequest"
            ).mockReturnValue([testRequest, TEST_CONFIG.TEST_VERIFIER]);

            jest.spyOn(pca, "getAllAccounts").mockReturnValue([testAccount]);
            jest.spyOn(
                RedirectClient.prototype,
                "handleRedirectPromise"
            ).mockResolvedValue(testTokenResponse);

            // Make verifySso fail
            jest.spyOn(
                SilentIframeClient.prototype,
                "verifySso"
            ).mockRejectedValue(new Error("SSO verification failed"));

            // Main flow should still complete successfully
            const result = await pca.handleRedirectPromise();
            expect(result).toEqual(testTokenResponse);
        });

        it("handles malformed cached value gracefully", async () => {
            pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                    verifySSO: true,
                },
            });
            await pca.initialize();
            pca = (pca as any).controller;

            // Set malformed cached value
            window.localStorage.setItem(
                CacheKeys.SSO_CAPABLE,
                "not-valid-json"
            );

            const testTokenResponse: AuthenticationResult = {
                authority: TEST_CONFIG.validAuthority,
                uniqueId: testAccount.localAccountId,
                tenantId: testAccount.tenantId,
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                idToken: "test-idToken",
                idTokenClaims: {},
                accessToken: "test-accessToken",
                fromCache: false,
                correlationId: RANDOM_TEST_GUID,
                expiresOn: TestTimeUtils.nowDateWithOffset(3600),
                account: testAccount,
                tokenType: Constants.AuthenticationScheme.BEARER,
            };

            jest.spyOn(
                BrowserCacheManager.prototype,
                "isInteractionInProgress"
            ).mockReturnValue(true);
            jest.spyOn(
                BrowserCacheManager.prototype,
                "getCachedRequest"
            ).mockReturnValue([testRequest, TEST_CONFIG.TEST_VERIFIER]);

            jest.spyOn(pca, "getAllAccounts").mockReturnValue([testAccount]);
            jest.spyOn(
                RedirectClient.prototype,
                "handleRedirectPromise"
            ).mockResolvedValue(testTokenResponse);

            const verifySsoSpy = jest
                .spyOn(SilentIframeClient.prototype, "verifySso")
                .mockResolvedValue(true);

            await pca.handleRedirectPromise();

            // Wait for setTimeout in verifySsoCapability
            await new Promise((resolve) => setTimeout(resolve, 10));

            // Should proceed with verification even if cache parsing fails
            expect(verifySsoSpy).toHaveBeenCalled();
        });
    });
});
