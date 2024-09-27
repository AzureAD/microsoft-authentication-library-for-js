/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { PublicClientApplication } from "../../src/app/PublicClientApplication.js";
import {
    DEFAULT_OPENID_CONFIG_RESPONSE,
    DEFAULT_TENANT_DISCOVERY_RESPONSE,
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
    TEST_TOKEN_RESPONSE,
    TEST_TOKENS,
    TEST_URIS,
    testLogoutUrl,
    testNavUrlNoRequest,
} from "../utils/StringConstants.js";
import {
    AccountEntity,
    AccountInfo,
    AuthenticationScheme,
    AuthError,
    AuthorityMetadataEntity,
    AuthorizationCodeClient,
    CacheHelpers,
    CacheManager,
    ClientAuthErrorCodes,
    CommonAuthorizationCodeRequest,
    CommonAuthorizationUrlRequest,
    CommonSilentFlowRequest,
    Constants,
    createClientAuthError,
    createInteractionRequiredAuthError,
    IdTokenEntity,
    InteractionRequiredAuthError,
    InteractionRequiredAuthErrorCodes,
    Logger,
    LogLevel,
    PerformanceClient,
    PerformanceEvent,
    PerformanceEvents,
    PersistentCacheKeys,
    ProtocolMode,
    ProtocolUtils,
    RefreshTokenClient,
    ResponseMode,
    ServerError,
    ServerResponseType,
    ServerTelemetryEntity,
    TokenClaims,
} from "@azure/msal-common";
import {
    ApiId,
    BrowserCacheLocation,
    BrowserConstants,
    CacheLookupPolicy,
    InteractionType,
    NativeConstants,
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
import { NavigationClient } from "../../src/navigation/NavigationClient.js";
import { NavigationOptions } from "../../src/navigation/NavigationOptions.js";
import { EventMessage } from "../../src/event/EventMessage.js";
import { EventHandler } from "../../src/event/EventHandler.js";
import { SilentIframeClient } from "../../src/interaction_client/SilentIframeClient.js";
import { base64Encode } from "../../src/encode/Base64Encode.js";
import { FetchClient } from "../../src/network/FetchClient.js";
import {
    BrowserAuthError,
    BrowserAuthErrorCodes,
    BrowserAuthErrorMessage,
    createBrowserAuthError,
} from "../../src/error/BrowserAuthError.js";
import * as BrowserUtils from "../../src/utils/BrowserUtils.js";
import { RedirectClient } from "../../src/interaction_client/RedirectClient.js";
import { PopupClient } from "../../src/interaction_client/PopupClient.js";
import { SilentCacheClient } from "../../src/interaction_client/SilentCacheClient.js";
import { SilentRefreshClient } from "../../src/interaction_client/SilentRefreshClient.js";
import { BaseInteractionClient } from "../../src/interaction_client/BaseInteractionClient.js";
import {
    AuthorizationCodeRequest,
    EndSessionRequest,
} from "../../src/index.js";
import { RedirectHandler } from "../../src/interaction_handler/RedirectHandler.js";
import { SilentAuthCodeClient } from "../../src/interaction_client/SilentAuthCodeClient.js";
import { BrowserCacheManager } from "../../src/cache/BrowserCacheManager.js";
import { NativeMessageHandler } from "../../src/broker/nativeBroker/NativeMessageHandler.js";
import { NativeInteractionClient } from "../../src/interaction_client/NativeInteractionClient.js";
import { NativeTokenRequest } from "../../src/broker/nativeBroker/NativeRequest.js";
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
import { buildAccountFromIdTokenClaims, buildIdToken } from "msal-test-utils";

const cacheConfig = {
    temporaryCacheLocation: BrowserCacheLocation.SessionStorage,
    cacheLocation: BrowserCacheLocation.SessionStorage,
    storeAuthStateInCookie: false,
    secureCookies: false,
    cacheMigrationEnabled: false,
    claimsBasedCachingEnabled: false,
};

let testAppConfig = {
    auth: {
        clientId: TEST_CONFIG.MSAL_CLIENT_ID,
    },

    userInputSystem: {
        loggerOptions: void 0,
    },
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

    return jest
        .spyOn(NativeMessageHandler, "createProvider")
        .mockImplementation(async () => {
            return new NativeMessageHandler(
                logger,
                2000,
                performanceClient,
                "test-extensionId"
            );
        });
}

describe("PublicClientApplication.ts Class Unit Tests", () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    globalThis.MessageChannel = require("worker_threads").MessageChannel; // jsdom does not include an implementation for MessageChannel
    let pca: PublicClientApplication;
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
                allowNativeBroker: false,
            },
        });

        await pca.initialize();

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
        globalThis.MessageChannel = require("worker_threads").MessageChannel; // jsdom does not include an implementation for MessageChannel

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
                    allowNativeBroker: true,
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
                NativeMessageHandler.prototype,
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
                        channel: NativeConstants.CHANNEL_ID,
                        extensionId: NativeConstants.PREFERRED_EXTENSION_ID,
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
                    ).toBeInstanceOf(NativeMessageHandler);
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
                    allowNativeBroker: true,
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
                NativeMessageHandler,
                "createProvider"
            );

            let ports: Set<MessagePort> = new Set();
            let handledMessages = 0;

            try {
                const eventHandler = function (event: MessageEvent) {
                    event.stopImmediatePropagation();
                    const request = event.data;
                    const req = {
                        channel: NativeConstants.CHANNEL_ID,
                        extensionId: NativeConstants.PREFERRED_EXTENSION_ID,
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

        it("creates extension provider if allowNativeBroker is true", async () => {
            const config = {
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                },
                system: {
                    allowNativeBroker: true,
                },
            };
            pca = new PublicClientApplication(config);

            const createProviderSpy = stubProvider(config);

            await pca.initialize();

            // Implementation of PCA was moved to controller.
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            pca = (pca as any).controller;

            expect(createProviderSpy).toHaveBeenCalled();
            // @ts-ignore
            expect(pca.nativeExtensionProvider).toBeInstanceOf(
                NativeMessageHandler
            );
        });

        it("does not create extension provider if allowNativeBroker is false", async () => {
            const createProviderSpy = jest.spyOn(
                NativeMessageHandler,
                "createProvider"
            );
            pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                },
                system: {
                    allowNativeBroker: false,
                },
            });
            await pca.initialize();

            //Implementation of PCA was moved to controller.
            pca = (pca as any).controller;

            expect(createProviderSpy).toHaveBeenCalledTimes(0);
            // @ts-ignore
            expect(pca.nativeExtensionProvider).toBeUndefined();
        });

        it("catches error if extension provider fails to initialize", async () => {
            const createProviderSpy = jest
                .spyOn(NativeMessageHandler, "createProvider")
                .mockRejectedValue(new Error("testError"));
            pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                },
                system: {
                    allowNativeBroker: true,
                },
            });
            await pca.initialize();

            //Implementation of PCA was moved to controller.
            pca = (pca as any).controller;

            expect(createProviderSpy).toHaveBeenCalled();
            // @ts-ignore
            expect(pca.nativeExtensionProvider).toBeUndefined();
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
                    PerformanceEvents.InitializeClientApplication
                );
                expect(events[0].correlationId).toEqual("test-correlation-id");
                expect(
                    events[0]["clearTokensAndKeysWithClaimsDurationMs"]
                ).toBeGreaterThanOrEqual(0);
                pca.removePerformanceCallback(callbackId);
                done();
            });

            pca.initialize({ correlationId: "test-correlation-id" });
        });
    });

    describe("handleRedirectPromise", () => {
        beforeEach(async () => {
            // Implementation of pca was moved to controller
            pca = (pca as any).controller;
            await pca.initialize();
        });
        it("Calls RedirectClient.handleRedirectPromise and returns its response", async () => {
            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: "3338040d-6c67-4c5b-b112-36a304b66dad",
                username: "AbeLi@microsoft.com",
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
                expiresOn: new Date(Date.now() + 3600000),
                account: testAccount,
                tokenType: AuthenticationScheme.BEARER,
            };

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
            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: "3338040d-6c67-4c5b-b112-36a304b66dad",
                username: "AbeLi@microsoft.com",
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
                expiresOn: new Date(Date.now() + 3600000),
                account: testAccount,
                tokenType: AuthenticationScheme.BEARER,
            };

            jest.spyOn(pca, "getAllAccounts").mockReturnValue([testAccount]);
            jest.spyOn(
                RedirectClient.prototype,
                "handleRedirectPromise"
            ).mockResolvedValue(testTokenResponse);

            const callbackId = pca.addPerformanceCallback((events) => {
                expect(events.length).toEqual(1);
                const event = events[0];
                expect(event.name).toBe(PerformanceEvents.AcquireTokenRedirect);
                expect(event.correlationId).toBeDefined();
                expect(event.success).toBeTruthy();
                expect(
                    event["handleRedirectPromiseDurationMs"]
                ).toBeGreaterThanOrEqual(0);
                expect(event["handleRedirectPromiseCallCount"]).toEqual(1);
                expect(event.success).toBeTruthy();
                expect(event.accountType).toEqual(undefined);
                pca.removePerformanceCallback(callbackId);
                done();
            });

            pca.handleRedirectPromise();
        });

        it("Calls NativeInteractionClient.handleRedirectPromise and returns its response", async () => {
            const config = {
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                },
                system: {
                    allowNativeBroker: true,
                },
            };
            pca = new PublicClientApplication(config);

            stubProvider(config);
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
                expiresOn: new Date(Date.now() + 3600000),
                account: testAccount,
                tokenType: AuthenticationScheme.BEARER,
                fromNativeBroker: true,
            };

            const nativeRequest: NativeTokenRequest = {
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
                    NativeInteractionClient.prototype,
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
                    allowNativeBroker: true,
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
            stubProvider(config);

            pca.initialize().then(() => {
                const callbackId = pca.addPerformanceCallback((events) => {
                    expect(events.length).toEqual(1);
                    const event = events[0];
                    expect(event.name).toBe(
                        PerformanceEvents.AcquireTokenRedirect
                    );
                    expect(event.correlationId).toBeDefined();
                    expect(event.success).toBeTruthy();
                    expect(
                        event["handleNativeRedirectPromiseDurationMs"]
                    ).toBeGreaterThanOrEqual(0);
                    expect(
                        event["handleNativeRedirectPromiseCallCount"]
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
                    expiresOn: new Date(Date.now() + 3600000),
                    account: testAccount,
                    tokenType: AuthenticationScheme.BEARER,
                    fromNativeBroker: true,
                };

                const nativeRequest: NativeTokenRequest = {
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
                    NativeInteractionClient.prototype,
                    "handleRedirectPromise"
                ).mockResolvedValue(testTokenResponse);

                pca.handleRedirectPromise();
            });
        });

        it("Emits acquireToken success event if user was already signed in", async () => {
            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: "3338040d-6c67-4c5b-b112-36a304b66dad",
                username: "AbeLi@microsoft.com",
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
                expiresOn: new Date(Date.now() + 3600000),
                account: testAccount,
                tokenType: AuthenticationScheme.BEARER,
            };
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

        it("Emits login failure event if user was already signed in", async () => {
            const redirectClientSpy: jest.SpyInstance = jest
                .spyOn(RedirectClient.prototype, "handleRedirectPromise")
                .mockRejectedValue(new Error("Error"));
            let loginFailureFired = false;
            jest.spyOn(EventHandler.prototype, "emitEvent").mockImplementation(
                (eventType) => {
                    if (eventType === EventType.LOGIN_FAILURE) {
                        loginFailureFired = true;
                    }
                }
            );
            await pca.handleRedirectPromise().catch(() => {
                expect(redirectClientSpy).toHaveBeenCalledTimes(1);
                expect(loginFailureFired).toBe(true);
            });
        });

        it("Emits acquireToken failure event if user was already signed in", async () => {
            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: "3338040d-6c67-4c5b-b112-36a304b66dad",
                username: "AbeLi@microsoft.com",
            };
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

            await pca.handleRedirectPromise().catch(() => {
                expect(redirectClientSpy).toHaveBeenCalledTimes(1);
                expect(acquireTokenFailureFired).toBe(true);
            });
        });

        it("Multiple concurrent calls to handleRedirectPromise return the same promise", async () => {
            const stateString = TEST_STATE_VALUES.TEST_STATE_REDIRECT;
            const browserCrypto = new CryptoOps(new Logger({}));
            const stateId = ProtocolUtils.parseRequestState(
                browserCrypto,
                stateString
            ).libraryState.id;

            window.sessionStorage.setItem(
                `${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.ORIGIN_URI}`,
                TEST_URIS.TEST_REDIR_URI
            );
            window.sessionStorage.setItem(
                `${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.AUTHORITY}.${stateId}`,
                TEST_CONFIG.validAuthority
            );
            window.sessionStorage.setItem(
                `${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.REQUEST_STATE}.${stateId}`,
                TEST_STATE_VALUES.TEST_STATE_REDIRECT
            );
            window.sessionStorage.setItem(
                `${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.URL_HASH}`,
                TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT
            );
            window.sessionStorage.setItem(
                `${Constants.CACHE_PREFIX}.${TemporaryCacheKeys.INTERACTION_STATUS_KEY}`,
                TEST_CONFIG.MSAL_CLIENT_ID
            );
            window.sessionStorage.setItem(
                `${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.NONCE_IDTOKEN}.${stateId}`,
                "123523"
            );
            const testTokenReq: CommonAuthorizationCodeRequest = {
                redirectUri: `${TEST_URIS.DEFAULT_INSTANCE}/`,
                code: "thisIsATestCode",
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                codeVerifier: TEST_CONFIG.TEST_VERIFIER,
                authority: `${Constants.DEFAULT_AUTHORITY}`,
                correlationId: RANDOM_TEST_GUID,
                authenticationScheme:
                    TEST_CONFIG.TOKEN_TYPE_BEARER as AuthenticationScheme,
            };
            window.sessionStorage.setItem(
                `${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.REQUEST_PARAMS}`,
                base64Encode(JSON.stringify(testTokenReq))
            );
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
                expiresOn: new Date(
                    Date.now() + testServerTokenResponse.body.expires_in * 1000
                ),
                account: testAccount,
                tokenType: AuthenticationScheme.BEARER,
            };
            const postMock = jest
                .spyOn(FetchClient.prototype, "sendPostRequestAsync")
                .mockResolvedValueOnce(testServerTokenResponse);
            pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                },
                system: {
                    allowNativeBroker: false,
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
            const tokenResponse3 = await pca.handleRedirectPromise("testHash");
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
            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: "3338040d-6c67-4c5b-b112-36a304b66dad",
                username: "AbeLi@microsoft.com",
            };
            jest.spyOn(
                StandardController.prototype,
                "getAllAccounts"
            ).mockReturnValue([testAccount]);
            // @ts-ignore
            jest.spyOn(RedirectClient.prototype, "getRedirectResponse")
                // @ts-ignore
                .mockReturnValue([null, ""]);

            const callbackId = pca.addPerformanceCallback((events) => {
                expect(events.length).toEqual(1);
                expect(events[0].success).toBe(false);
                expect(events[0].errorCode).toBe("no_server_response");
                pca.removePerformanceCallback(callbackId);
                done();
            });

            window.sessionStorage.setItem(
                `${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.CORRELATION_ID}`,
                RANDOM_TEST_GUID
            );
            window.sessionStorage.setItem(
                `${Constants.CACHE_PREFIX}.${TemporaryCacheKeys.INTERACTION_STATUS_KEY}`,
                TEST_CONFIG.MSAL_CLIENT_ID
            );
            pca.handleRedirectPromise();
        });

        it("Discards performance event if handleRedirectPromise returns null and no error code is set", async () => {
            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: "3338040d-6c67-4c5b-b112-36a304b66dad",
                username: "AbeLi@microsoft.com",
            };
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
    });
    describe("OIDC Protocol Mode tests", () => {
        beforeEach(async () => {
            pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                    protocolMode: ProtocolMode.OIDC,
                    OIDCOptions: {
                        serverResponseType: ServerResponseType.QUERY,
                    },
                },
                telemetry: {
                    application: {
                        appName: TEST_CONFIG.applicationName,
                        appVersion: TEST_CONFIG.applicationVersion,
                    },
                },
                system: {
                    allowNativeBroker: false,
                },
            });

            await pca.initialize();
        });

        it("Looks for server code response in query param if OIDCOptions.serverResponseType is set to query", async () => {
            const responseSpy = jest.spyOn(
                RedirectClient.prototype,
                <any>"getRedirectResponse"
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
                onRedirectNavigate: () => false, // Skip the navigation
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
                RedirectHandler.prototype,
                "initiateAuthRequest"
            ).mockImplementation((navigateUrl): Promise<void> => {
                expect(
                    navigateUrl.startsWith(testNavUrlNoRequest)
                ).toBeTruthy();
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
                    allowNativeBroker: true,
                },
            };
            pca = new PublicClientApplication(config);

            stubProvider(config);
            await pca.initialize();

            //Implementation of PCA was moved to controller.
            pca = (pca as any).controller;

            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: "3338040d-6c67-4c5b-b112-36a304b66dad",
                username: "AbeLi@microsoft.com",
                nativeAccountId: "test-nativeAccountId",
            };

            jest.spyOn(BrowserCrypto, "createNewGuid").mockReturnValue(
                RANDOM_TEST_GUID
            );

            const nativeAcquireTokenSpy = jest
                .spyOn(
                    NativeInteractionClient.prototype,
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
                    allowNativeBroker: true,
                },
                telemetry: {
                    client: new BrowserPerformanceClient(testAppConfig),
                },
            };
            pca = new PublicClientApplication(config);

            stubProvider(config);

            const callbackId = pca.addPerformanceCallback((events) => {
                expect(events.length).toBeGreaterThanOrEqual(1);
                for (const event of events) {
                    if (
                        event.name ===
                        PerformanceEvents.ClearTokensAndKeysWithClaims
                    ) {
                        expect(event.success).toBeTruthy();
                    }

                    if (
                        event.name ===
                        PerformanceEvents.InitializeClientApplication
                    ) {
                        expect(event.success).toBeTruthy();
                        expect(event.allowNativeBroker).toBeTruthy();
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
                    allowNativeBroker: true,
                },
            };
            pca = new PublicClientApplication(config);

            await pca.initialize();
            stubProvider(config);

            //Implementation of PCA was moved to controller.
            pca = (pca as any).controller;

            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: "3338040d-6c67-4c5b-b112-36a304b66dad",
                username: "AbeLi@microsoft.com",
                nativeAccountId: "test-nativeAccountId",
            };

            const nativeAcquireTokenSpy = jest.spyOn(
                NativeInteractionClient.prototype,
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
                    allowNativeBroker: true,
                },
            };
            pca = new PublicClientApplication(config);

            stubProvider(config);
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
            };

            const nativeAcquireTokenSpy: jest.SpyInstance = jest
                .spyOn(
                    NativeInteractionClient.prototype,
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
                    allowNativeBroker: true,
                },
            };
            pca = new PublicClientApplication(config);

            stubProvider(config);
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
            };

            const nativeAcquireTokenSpy: jest.SpyInstance = jest
                .spyOn(
                    NativeInteractionClient.prototype,
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
                    allowNativeBroker: true,
                },
            };
            pca = new PublicClientApplication(config);

            stubProvider(config);
            await pca.initialize();

            //PCA implementation moved to controller
            pca = (pca as any).controller;

            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: "3338040d-6c67-4c5b-b112-36a304b66dad",
                username: "AbeLi@microsoft.com",
                nativeAccountId: "test-nativeAccountId",
            };

            const nativeAcquireTokenSpy: jest.SpyInstance = jest
                .spyOn(
                    NativeInteractionClient.prototype,
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
                onRedirectNavigate: () => false, // Skip the navigation
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
                logger
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
                logger
            );
            const secondInstanceStorage = new BrowserCacheManager(
                "different-client-id",
                cacheConfig,
                browserCrypto,
                logger
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
            const oldWindowOpener = window.opener;
            const oldWindowName = window.name;
            const newWindow = {
                ...window,
            };

            // @ts-ignore
            delete window.opener;
            // @ts-ignore
            delete window.name;
            window.opener = newWindow;
            window.name = "msal.testPopup";

            jest.spyOn(BrowserUtils, "isInIframe").mockReturnValue(false);
            pca.acquireTokenRedirect({ scopes: ["openid"] })
                .catch((e) => {
                    expect(e).toBeInstanceOf(BrowserAuthError);
                    expect(e.errorCode).toEqual(
                        BrowserAuthErrorMessage.blockAcquireTokenInPopupsError
                            .code
                    );
                    expect(e.errorMessage).toEqual(
                        BrowserAuthErrorMessage.blockAcquireTokenInPopupsError
                            .desc
                    );
                    done();
                })
                .finally(() => {
                    window.name = oldWindowName;
                    window.opener = oldWindowOpener;
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

        it("throws error if cacheLocation is Memory Storage and storeAuthStateInCookie is false", async () => {
            pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                },
                cache: {
                    cacheLocation: BrowserCacheLocation.MemoryStorage,
                    storeAuthStateInCookie: false,
                },
                system: {
                    allowNativeBroker: false,
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

        it("Emits acquireToken Start and Failure events if user is already logged in", async () => {
            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: "3338040d-6c67-4c5b-b112-36a304b66dad",
                username: "AbeLi@microsoft.com",
            };

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

        it("Emits login Start and Failure events if no user is logged in", async () => {
            const redirectClientSpy: jest.SpyInstance = jest
                .spyOn(RedirectClient.prototype, "acquireToken")
                .mockRejectedValue(new Error("Error"));

            let loginStartEmitted = false;
            let loginFailureEmitted = false;
            jest.spyOn(EventHandler.prototype, "emitEvent").mockImplementation(
                (eventType) => {
                    if (eventType === EventType.LOGIN_START) {
                        loginStartEmitted = true;
                    } else if (eventType === EventType.LOGIN_FAILURE) {
                        loginFailureEmitted = true;
                    }
                }
            );

            await pca.acquireTokenRedirect({ scopes: ["openid"] }).catch(() => {
                expect(redirectClientSpy).toHaveBeenCalledTimes(1);
                expect(loginStartEmitted).toBe(true);
                expect(loginFailureEmitted).toBe(true);
            });
        });

        it("emits error performance event", (done) => {
            const config = {
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                },
                system: {
                    allowNativeBroker: true,
                },
            };

            stubProvider(config);
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
                        PerformanceEvents.AcquireTokenPreRedirect
                    );
                    expect(events[0].errorCode).toBe("test error code");
                    pca.removePerformanceCallback(callbackId);
                    done();
                });

                const testAccount: AccountInfo = {
                    homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                    localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                    environment: "login.windows.net",
                    tenantId: "3338040d-6c67-4c5b-b112-36a304b66dad",
                    username: "AbeLi@microsoft.com",
                    nativeAccountId: "test-nativeAccountId",
                };

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

        it("emits pre-redirect telemetry event when onRedirectNavigate callback is set", (done) => {
            const onRedirectNavigate = (url: string) => {
                expect(url).toBeDefined();
            };

            const callbackId = pca.addPerformanceCallback((events) => {
                expect(events[0].success).toBe(true);
                expect(events[0].name).toBe(
                    PerformanceEvents.AcquireTokenPreRedirect
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
                onRedirectNavigate,
            };
            pca.acquireTokenRedirect(loginRequest);
        });

        it("emits pre-redirect telemetry event when onRedirectNavigate callback is not set", (done) => {
            const callbackId = pca.addPerformanceCallback((events) => {
                expect(events[0].success).toBe(true);
                expect(events[0].name).toBe(
                    PerformanceEvents.AcquireTokenPreRedirect
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
                    PerformanceEvents.AcquireTokenPreRedirect
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

        it("discards pre-redirect telemetry event when onRedirectNavigate callback returns false", async () => {
            const onRedirectNavigate = (url: string) => {
                return false;
            };

            const measurementDiscardSpy = jest.spyOn(
                PerformanceClient.prototype,
                "discardMeasurements"
            );

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
                onRedirectNavigate,
            };
            await pca.acquireTokenRedirect(loginRequest);
            expect(measurementDiscardSpy).toHaveBeenCalledTimes(1);
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
            };
            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: testIdTokenClaims.tid || "",
                username: testIdTokenClaims.preferred_username || "",
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
                expiresOn: new Date(
                    Date.now() + testServerTokenResponse.expires_in * 1000
                ),
                account: testAccount,
                tokenType: AuthenticationScheme.BEARER,
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
                close: () => {},
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
                    allowNativeBroker: true,
                },
            };
            pca = new PublicClientApplication(config);

            stubProvider(config);
            await pca.initialize();

            //Implementation of PCA was moved to controller.
            pca = (pca as any).controller;

            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: "3338040d-6c67-4c5b-b112-36a304b66dad",
                username: "AbeLi@microsoft.com",
                nativeAccountId: "test-nativeAccountId",
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
                expiresOn: new Date(Date.now() + 3600000),
                account: testAccount,
                tokenType: AuthenticationScheme.BEARER,
            };

            jest.spyOn(BrowserCrypto, "createNewGuid").mockReturnValue(
                RANDOM_TEST_GUID
            );

            const nativeAcquireTokenSpy: jest.SpyInstance = jest
                .spyOn(NativeInteractionClient.prototype, "acquireToken")
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
                    allowNativeBroker: true,
                },
            };
            pca = new PublicClientApplication(config);

            stubProvider(config);
            await pca.initialize();

            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: "3338040d-6c67-4c5b-b112-36a304b66dad",
                username: "AbeLi@microsoft.com",
                nativeAccountId: "test-nativeAccountId",
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
                expiresOn: new Date(Date.now() + 3600000),
                account: testAccount,
                tokenType: AuthenticationScheme.BEARER,
            };

            const nativeAcquireTokenSpy: jest.SpyInstance = jest.spyOn(
                NativeInteractionClient.prototype,
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
                    allowNativeBroker: true,
                },
            };
            pca = new PublicClientApplication(config);

            stubProvider(config);
            await pca.initialize();

            //Implementation of PCA was moved to controller.
            pca = (pca as any).controller;

            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: "3338040d-6c67-4c5b-b112-36a304b66dad",
                username: "AbeLi@microsoft.com",
                nativeAccountId: "test-nativeAccountId",
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
                expiresOn: new Date(Date.now() + 3600000),
                account: testAccount,
                tokenType: AuthenticationScheme.BEARER,
            };

            const nativeAcquireTokenSpy: jest.SpyInstance = jest
                .spyOn(NativeInteractionClient.prototype, "acquireToken")
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
                    allowNativeBroker: true,
                },
            };
            pca = new PublicClientApplication(config);

            stubProvider(config);
            await pca.initialize();

            //Implementation of PCA was moved to controller.
            pca = (pca as any).controller;

            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: "3338040d-6c67-4c5b-b112-36a304b66dad",
                username: "AbeLi@microsoft.com",
                nativeAccountId: "test-nativeAccountId",
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
                expiresOn: new Date(Date.now() + 3600000),
                account: testAccount,
                tokenType: AuthenticationScheme.BEARER,
            };

            const nativeAcquireTokenSpy: jest.SpyInstance = jest
                .spyOn(NativeInteractionClient.prototype, "acquireToken")
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
                    allowNativeBroker: true,
                },
            };
            pca = new PublicClientApplication(config);

            stubProvider(config);
            await pca.initialize();

            //PCA implementation moved to controller
            pca = (pca as any).controller;

            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: "3338040d-6c67-4c5b-b112-36a304b66dad",
                username: "AbeLi@microsoft.com",
                nativeAccountId: "test-nativeAccountId",
            };

            const nativeAcquireTokenSpy: jest.SpyInstance = jest
                .spyOn(NativeInteractionClient.prototype, "acquireToken")
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
                logger
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
                    allowNativeBroker: true,
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
            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: "3338040d-6c67-4c5b-b112-36a304b66dad",
                username: "AbeLi@microsoft.com",
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
                expiresOn: new Date(Date.now() + 3600000),
                account: testAccount,
                tokenType: AuthenticationScheme.BEARER,
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

        it("Emits Login Start and Success Events if no user is signed in", async () => {
            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: "3338040d-6c67-4c5b-b112-36a304b66dad",
                username: "AbeLi@microsoft.com",
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
                expiresOn: new Date(Date.now() + 3600000),
                account: testAccount,
                tokenType: AuthenticationScheme.BEARER,
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
            let loginStartEmitted = false;
            let loginSuccessEmitted = false;
            jest.spyOn(EventHandler.prototype, "emitEvent").mockImplementation(
                (eventType) => {
                    if (eventType === EventType.LOGIN_START) {
                        loginStartEmitted = true;
                    } else if (eventType === EventType.LOGIN_SUCCESS) {
                        loginSuccessEmitted = true;
                    }
                }
            );

            const response = await pca.acquireTokenPopup({
                scopes: ["openid"],
            });
            expect(response).toEqual(testTokenResponse);
            expect(popupClientSpy).toHaveBeenCalledTimes(1);
            expect(loginStartEmitted).toBe(true);
            expect(loginSuccessEmitted).toBe(true);
        });

        it("Emits AcquireToken Start and Success Events if user is already signed in", async () => {
            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: "3338040d-6c67-4c5b-b112-36a304b66dad",
                username: "AbeLi@microsoft.com",
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
                expiresOn: new Date(Date.now() + 3600000),
                account: testAccount,
                tokenType: AuthenticationScheme.BEARER,
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
            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: "3338040d-6c67-4c5b-b112-36a304b66dad",
                username: "AbeLi@microsoft.com",
            };

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

        it("Emits Login Start and Failure events if a user is not logged in", async () => {
            const popupClientSpy: jest.SpyInstance = jest
                .spyOn(PopupClient.prototype, "acquireToken")
                .mockRejectedValue(new Error("Error"));
            let loginStartEmitted = false;
            let loginFailureEmitted = false;
            jest.spyOn(EventHandler.prototype, "emitEvent").mockImplementation(
                (eventType) => {
                    if (eventType === EventType.LOGIN_START) {
                        loginStartEmitted = true;
                    } else if (eventType === EventType.LOGIN_FAILURE) {
                        loginFailureEmitted = true;
                    }
                }
            );

            await pca.acquireTokenPopup({ scopes: ["openid"] }).catch(() => {
                expect(popupClientSpy).toHaveBeenCalledTimes(1);
                expect(loginStartEmitted).toBe(true);
                expect(loginFailureEmitted).toBe(true);
            });
        });

        it("throws error if called in a popup", (done) => {
            const oldWindowOpener = window.opener;
            const oldWindowName = window.name;

            const newWindow = {
                ...window,
            };

            // @ts-ignore
            delete window.opener;
            // @ts-ignore
            delete window.name;
            window.opener = newWindow;
            window.name = "msal.testPopup";

            pca.acquireTokenPopup({ scopes: ["openid"] })
                .catch((e) => {
                    expect(e).toBeInstanceOf(BrowserAuthError);
                    expect(e.errorCode).toEqual(
                        BrowserAuthErrorMessage.blockAcquireTokenInPopupsError
                            .code
                    );
                    expect(e.errorMessage).toEqual(
                        BrowserAuthErrorMessage.blockAcquireTokenInPopupsError
                            .desc
                    );
                    done();
                })
                .finally(() => {
                    window.name = oldWindowName;
                    window.opener = oldWindowOpener;
                });
        });

        it("emits successful performance telemetry event", (done) => {
            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: "3338040d-6c67-4c5b-b112-36a304b66dad",
                username: "AbeLi@microsoft.com",
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
                expiresOn: new Date(Date.now() + 3600000),
                account: testAccount,
                tokenType: AuthenticationScheme.BEARER,
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
                    allowNativeBroker: true,
                },
            };
            pca = new PublicClientApplication(config);

            stubProvider(config);
            await pca.initialize();

            //Implementation of PCA was moved to controller.
            pca = (pca as any).controller;

            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: "3338040d-6c67-4c5b-b112-36a304b66dad",
                username: "AbeLi@microsoft.com",
                nativeAccountId: "test-nativeAccountId",
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
                expiresOn: new Date(Date.now() + 3600000),
                account: testAccount,
                tokenType: AuthenticationScheme.BEARER,
            };

            const nativeAcquireTokenSpy: jest.SpyInstance = jest
                .spyOn(NativeInteractionClient.prototype, "acquireToken")
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
                    allowNativeBroker: true,
                },
            };
            pca = new PublicClientApplication(config);

            stubProvider(config);
            await pca.initialize();

            //Implementation of PCA was moved to controller.
            pca = (pca as any).controller;

            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: "3338040d-6c67-4c5b-b112-36a304b66dad",
                username: "AbeLi@microsoft.com",
                nativeAccountId: "test-nativeAccountId",
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
                expiresOn: new Date(Date.now() + 3600000),
                account: testAccount,
                tokenType: AuthenticationScheme.BEARER,
            };

            const nativeAcquireTokenSpy: jest.SpyInstance = jest
                .spyOn(NativeInteractionClient.prototype, "acquireToken")
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
                    allowNativeBroker: true,
                },
            };
            pca = new PublicClientApplication(config);

            stubProvider(config);
            await pca.initialize();

            //Implementation of PCA was moved to controller.
            pca = (pca as any).controller;

            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: "3338040d-6c67-4c5b-b112-36a304b66dad",
                username: "AbeLi@microsoft.com",
                nativeAccountId: "test-nativeAccountId",
            };

            const nativeAcquireTokenSpy: jest.SpyInstance = jest
                .spyOn(NativeInteractionClient.prototype, "acquireToken")
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
            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: "3338040d-6c67-4c5b-b112-36a304b66dad",
                username: "AbeLi@microsoft.com",
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
                expiresOn: new Date(Date.now() + 3600000),
                account: testAccount,
                tokenType: AuthenticationScheme.BEARER,
            };

            let ssoSilentFired = false;
            const silentClientSpy: jest.SpyInstance = jest
                .spyOn(SilentIframeClient.prototype, "acquireToken")
                .mockResolvedValue(testTokenResponse);

            jest.spyOn(EventHandler.prototype, "emitEvent").mockImplementation(
                (eventType, interactionType) => {
                    if (
                        eventType === EventType.SSO_SILENT_START &&
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
            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: "3338040d-6c67-4c5b-b112-36a304b66dad",
                username: "AbeLi@microsoft.com",
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
                expiresOn: new Date(Date.now() + 3600000),
                account: testAccount,
                tokenType: AuthenticationScheme.BEARER,
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
            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: "3338040d-6c67-4c5b-b112-36a304b66dad",
                username: "AbeLi@microsoft.com",
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
                expiresOn: new Date(Date.now() + 3600000),
                account: testAccount,
                tokenType: AuthenticationScheme.BEARER,
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
            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: "3338040d-6c67-4c5b-b112-36a304b66dad",
                username: "AbeLi@microsoft.com",
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
                    allowNativeBroker: true,
                },
            };
            pca = new PublicClientApplication(config);

            stubProvider(config);
            await pca.initialize();

            //Implementation of PCA was moved to controller.
            pca = (pca as any).controller;

            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: "3338040d-6c67-4c5b-b112-36a304b66dad",
                username: "AbeLi@microsoft.com",
                nativeAccountId: "test-nativeAccountId",
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
                expiresOn: new Date(Date.now() + 3600000),
                account: testAccount,
                tokenType: AuthenticationScheme.BEARER,
            };

            const nativeAcquireTokenSpy: jest.SpyInstance = jest
                .spyOn(NativeInteractionClient.prototype, "acquireToken")
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
                    allowNativeBroker: true,
                },
            };
            pca = new PublicClientApplication(config);

            stubProvider(config);
            await pca.initialize();

            //Implementation of PCA was moved to controller.
            pca = (pca as any).controller;

            const nativeAcquireTokenSpy: jest.SpyInstance = jest
                .spyOn(NativeInteractionClient.prototype, "acquireToken")
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
                    allowNativeBroker: true,
                },
            });
            await pca.initialize();

            const nativeAcquireTokenSpy = jest.spyOn(
                NativeInteractionClient.prototype,
                "acquireToken"
            );

            await pca
                .acquireTokenByCode({
                    scopes: ["User.Read"],
                    nativeAccountId: "test-nativeAccountId",
                })
                .catch((e) => {
                    expect(e.errorCode).toEqual(
                        BrowserAuthErrorMessage
                            .unableToAcquireTokenFromNativePlatform.code
                    );
                    expect(e.errorMessage).toEqual(
                        BrowserAuthErrorMessage
                            .unableToAcquireTokenFromNativePlatform.desc
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
            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: "3338040d-6c67-4c5b-b112-36a304b66dad",
                username: "AbeLi@microsoft.com",
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
                expiresOn: new Date(Date.now() + 3600000),
                account: testAccount,
                tokenType: AuthenticationScheme.BEARER,
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
            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: "3338040d-6c67-4c5b-b112-36a304b66dad",
                username: "AbeLi@microsoft.com",
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
                expiresOn: new Date(Date.now() + 3600000),
                account: testAccount,
                tokenType: AuthenticationScheme.BEARER,
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
            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: "3338040d-6c67-4c5b-b112-36a304b66dad",
                username: "AbeLi@microsoft.com",
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
                expiresOn: new Date(Date.now() + 3600000),
                account: testAccount,
                tokenType: AuthenticationScheme.BEARER,
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
            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: "3338040d-6c67-4c5b-b112-36a304b66dad",
                username: "AbeLi@microsoft.com",
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
                expiresOn: new Date(Date.now() + 3600000),
                account: testAccount,
                tokenType: AuthenticationScheme.BEARER,
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
            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: "3338040d-6c67-4c5b-b112-36a304b66dad",
                username: "AbeLi@microsoft.com",
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
                expiresOn: new Date(Date.now() + 3600000),
                account: testAccount,
                tokenType: AuthenticationScheme.BEARER,
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
            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: "3338040d-6c67-4c5b-b112-36a304b66dad",
                username: "AbeLi@microsoft.com",
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
                expiresOn: new Date(Date.now() + 3600000),
                account: testAccount,
                tokenType: AuthenticationScheme.BEARER,
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
                    allowNativeBroker: true,
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
                    allowNativeBroker: true,
                },
            };
            pca = new PublicClientApplication(config);

            stubProvider(config);
            await pca.initialize();

            //Implementation of PCA was moved to controller.
            pca = (pca as any).controller;

            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: "3338040d-6c67-4c5b-b112-36a304b66dad",
                username: "AbeLi@microsoft.com",
                nativeAccountId: "test-nativeAccountId",
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
                expiresOn: new Date(Date.now() + 3600000),
                account: testAccount,
                tokenType: AuthenticationScheme.BEARER,
            };

            const nativeAcquireTokenSpy: jest.SpyInstance = jest
                .spyOn(NativeInteractionClient.prototype, "acquireToken")
                .mockResolvedValue(testTokenResponse);
            const silentSpy: jest.SpyInstance = jest
                .spyOn(SilentIframeClient.prototype, "acquireToken")
                .mockResolvedValue(testTokenResponse);
            const response = await pca.acquireTokenSilent({
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
                    allowNativeBroker: true,
                },
            };
            pca = new PublicClientApplication(config);

            stubProvider(config);
            await pca.initialize();

            //Implementation of PCA was moved to controller.
            pca = (pca as any).controller;

            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: "3338040d-6c67-4c5b-b112-36a304b66dad",
                username: "AbeLi@microsoft.com",
                nativeAccountId: "test-nativeAccountId",
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
                expiresOn: new Date(Date.now() + 3600000),
                account: testAccount,
                tokenType: AuthenticationScheme.BEARER,
            };

            const nativeAcquireTokenSpy: jest.SpyInstance = jest
                .spyOn(NativeInteractionClient.prototype, "acquireToken")
                .mockRejectedValue(
                    new NativeAuthError("ContentError", "error in extension")
                );
            const silentSpy: jest.SpyInstance = jest
                .spyOn(SilentIframeClient.prototype, "acquireToken")
                .mockResolvedValue(testTokenResponse);
            const silentRequest = {
                scopes: ["User.Read"],
                account: testAccount,
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
                    allowNativeBroker: true,
                },
            };
            pca = new PublicClientApplication(config);

            stubProvider(config);
            await pca.initialize();
            //Implementation of PCA was moved to controller.
            pca = (pca as any).controller;

            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: "3338040d-6c67-4c5b-b112-36a304b66dad",
                username: "AbeLi@microsoft.com",
                nativeAccountId: "test-nativeAccountId",
            };

            const nativeAcquireTokenSpy: jest.SpyInstance = jest
                .spyOn(NativeInteractionClient.prototype, "acquireToken")
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
            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: "3338040d-6c67-4c5b-b112-36a304b66dad",
                username: "AbeLi@microsoft.com",
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
                expiresOn: new Date(Date.now() + 3600000),
                account: testAccount,
                tokenType: AuthenticationScheme.BEARER,
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
            });
            expect(response?.idToken).not.toBeNull();
            expect(response).toEqual(testTokenResponse);
            expect(silentCacheSpy).toHaveBeenCalledTimes(1);
            expect(silentRefreshSpy).toHaveBeenCalledTimes(0);
            expect(silentIframeSpy).toHaveBeenCalledTimes(0);
        });

        it("Calls SilentCacheClient.acquireToken and captures the stack trace for non-auth error", (done) => {
            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: "3338040d-6c67-4c5b-b112-36a304b66dad",
                username: "AbeLi@microsoft.com",
            };

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
                            PerformanceEvents.AcquireTokenSilent
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
            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: "3338040d-6c67-4c5b-b112-36a304b66dad",
                username: "AbeLi@microsoft.com",
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
                expiresOn: new Date(Date.now() + 3600000),
                account: testAccount,
                tokenType: AuthenticationScheme.BEARER,
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
            });
            expect(response).toEqual(testTokenResponse);
            expect(silentCacheSpy).toHaveBeenCalledTimes(1);
            expect(silentRefreshSpy).toHaveBeenCalledTimes(1);
            expect(silentIframeSpy).toHaveBeenCalledTimes(0);
        });

        it("Calls SilentIframeClient.acquireToken and returns its response if cache lookup throws and refresh token is expired", async () => {
            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: "3338040d-6c67-4c5b-b112-36a304b66dad",
                username: "AbeLi@microsoft.com",
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
                expiresOn: new Date(Date.now() + 3600000),
                account: testAccount,
                tokenType: AuthenticationScheme.BEARER,
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
            });
            expect(response).toEqual(testTokenResponse);
            expect(silentCacheSpy).toHaveBeenCalledTimes(1);
            expect(silentRefreshSpy).toHaveBeenCalledTimes(1);
            expect(silentIframeSpy).toHaveBeenCalledTimes(1);
        });

        it("Calls SilentIframeClient.acquireToken and returns its response if no RT is cached", async () => {
            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: "3338040d-6c67-4c5b-b112-36a304b66dad",
                username: "AbeLi@microsoft.com",
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
                expiresOn: new Date(Date.now() + 3600000),
                account: testAccount,
                tokenType: AuthenticationScheme.BEARER,
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
            };
            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: testIdTokenClaims.tid || "",
                username: testIdTokenClaims.preferred_username || "",
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
                tokenType: AuthenticationScheme.BEARER,
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
                authenticationScheme: AuthenticationScheme.BEARER,
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
            const silentRequest2 = pca.acquireTokenSilent(tokenRequest);
            const silentRequest3 = pca.acquireTokenSilent(tokenRequest);
            const parallelResponse = await Promise.all([
                silentRequest1,
                silentRequest2,
                silentRequest3,
            ]);

            expect(silentATStub).toHaveBeenCalledWith(expectedTokenRequest);
            expect(atsSpy).toHaveBeenCalledTimes(1);
            expect(silentATStub).toHaveBeenCalledTimes(1);
            expect(parallelResponse[0]).toEqual(testTokenResponse);
            expect(parallelResponse[1]).toEqual(testTokenResponse);
            expect(parallelResponse[2]).toEqual(testTokenResponse);
            expect(parallelResponse).toHaveLength(3);
        });

        it("makes one network request with multiple parallel silent requests with same request including claims when claimsBasedCaching is enabled", async () => {
            pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                },
                system: {
                    allowNativeBroker: false,
                },
                cache: {
                    claimsBasedCachingEnabled: true,
                },
            });

            await pca.initialize();
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
            };
            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: testIdTokenClaims.tid || "",
                username: testIdTokenClaims.preferred_username || "",
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
                tokenType: AuthenticationScheme.BEARER,
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
                authenticationScheme: AuthenticationScheme.BEARER,
                claims: JSON.stringify({ claim: "claim" }),
                correlationId: TEST_CONFIG.CORRELATION_ID,
                forceRefresh: false,
            };
            const expectedTokenRequest: CommonSilentFlowRequest = {
                ...tokenRequest,
                scopes: ["User.Read"],
                authority: `${Constants.DEFAULT_AUTHORITY}`,
                correlationId: RANDOM_TEST_GUID,
                claims: JSON.stringify({ claim: "claim" }),
                requestedClaimsHash: TEST_CRYPTO_VALUES.TEST_SHA256_HASH,
                forceRefresh: false,
            };

            const silentRequest1 = pca.acquireTokenSilent(tokenRequest);
            const silentRequest2 = pca.acquireTokenSilent(tokenRequest);
            const silentRequest3 = pca.acquireTokenSilent(tokenRequest);
            const parallelResponse = await Promise.all([
                silentRequest1,
                silentRequest2,
                silentRequest3,
            ]);

            expect(silentATStub).toHaveBeenCalledWith(expectedTokenRequest);
            expect(atsSpy).toHaveBeenCalledTimes(1);
            expect(silentATStub).toHaveBeenCalledTimes(1);
            expect(parallelResponse[0]).toEqual(testTokenResponse);
            expect(parallelResponse[1]).toEqual(testTokenResponse);
            expect(parallelResponse[2]).toEqual(testTokenResponse);
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
            };
            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: testIdTokenClaims.tid || "",
                username: testIdTokenClaims.preferred_username || "",
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
                tokenType: AuthenticationScheme.BEARER,
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
                authenticationScheme: AuthenticationScheme.BEARER,
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
                authenticationScheme: AuthenticationScheme.BEARER,
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
                authenticationScheme: AuthenticationScheme.POP,
                resourceRequestMethod: "GET",
                resourceRequestUri: "https://testUri.com/user.read",
                correlationId: TEST_CONFIG.CORRELATION_ID,
                forceRefresh: false,
            };

            const popTokenRequest2: CommonSilentFlowRequest = {
                scopes: ["Mail.Read"],
                account: testAccount,
                authority: TEST_CONFIG.validAuthority,
                authenticationScheme: AuthenticationScheme.POP,
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
                authenticationScheme: AuthenticationScheme.SSH,
                sshJwk: TEST_SSH_VALUES.ENCODED_SSH_JWK,
                sshKid: TEST_SSH_VALUES.SSH_KID,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                forceRefresh: false,
            };

            const sshCertRequest2: CommonSilentFlowRequest = {
                scopes: ["Mail.Read"],
                account: testAccount,
                authority: TEST_CONFIG.validAuthority,
                authenticationScheme: AuthenticationScheme.SSH,
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

            expect(silentATStub).toHaveBeenCalledWith(expectedTokenRequest1);
            expect(silentATStub).toHaveBeenCalledWith(expectedTokenRequest2);
            expect(silentATStub).toHaveBeenCalledWith(expectedPopTokenRequest1);
            expect(silentATStub).toHaveBeenCalledWith(expectedPopTokenRequest2);
            expect(silentATStub).toHaveBeenCalledWith(
                expectedSshCertificateRequest1
            );
            expect(silentATStub).toHaveBeenCalledWith(
                expectedSshCertificateRequest2
            );
            expect(silentATStub).toHaveBeenCalledTimes(6);
        });

        it("makes network requests for each distinct request including claims when acquireTokenSilent is called in parallel with claimsBasedCaching is enabled", async () => {
            pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                },
                system: {
                    allowNativeBroker: false,
                },
                cache: {
                    claimsBasedCachingEnabled: true,
                },
            });

            await pca.initialize();
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
            };
            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: testIdTokenClaims.tid || "",
                username: testIdTokenClaims.preferred_username || "",
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
                tokenType: AuthenticationScheme.BEARER,
            };
            jest.spyOn(BrowserCrypto, "createNewGuid").mockReturnValue(
                RANDOM_TEST_GUID
            );
            jest.spyOn(BrowserCrypto, "hashString").mockResolvedValue(
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
                authenticationScheme: AuthenticationScheme.BEARER,
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
                authenticationScheme: AuthenticationScheme.BEARER,
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
                authenticationScheme: AuthenticationScheme.POP,
                resourceRequestMethod: "GET",
                resourceRequestUri: "https://testUri.com/user.read",
                correlationId: TEST_CONFIG.CORRELATION_ID,
                forceRefresh: false,
            };

            const popTokenRequest2: CommonSilentFlowRequest = {
                scopes: ["Mail.Read"],
                account: testAccount,
                authority: TEST_CONFIG.validAuthority,
                authenticationScheme: AuthenticationScheme.POP,
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
                authenticationScheme: AuthenticationScheme.SSH,
                sshJwk: TEST_SSH_VALUES.ENCODED_SSH_JWK,
                sshKid: TEST_SSH_VALUES.SSH_KID,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                forceRefresh: false,
            };

            const sshCertRequest2: CommonSilentFlowRequest = {
                scopes: ["Mail.Read"],
                account: testAccount,
                authority: TEST_CONFIG.validAuthority,
                authenticationScheme: AuthenticationScheme.SSH,
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

            // Requests with claims
            const claimsRequest1: CommonSilentFlowRequest = {
                scopes: ["User.Read"],
                account: testAccount,
                authority: TEST_CONFIG.validAuthority,
                authenticationScheme: AuthenticationScheme.BEARER,
                claims: JSON.stringify({ claim1: "claim1" }),
                correlationId: TEST_CONFIG.CORRELATION_ID,
                forceRefresh: false,
            };

            const claimsRequest2: CommonSilentFlowRequest = {
                scopes: ["User.Read"],
                account: testAccount,
                authority: TEST_CONFIG.validAuthority,
                authenticationScheme: AuthenticationScheme.BEARER,
                claims: JSON.stringify({ claim2: "claim2" }),
                requestedClaimsHash: TEST_CRYPTO_VALUES.TEST_SHA256_HASH,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                forceRefresh: false,
            };

            const expectedClaimsRequest1: CommonSilentFlowRequest = {
                ...claimsRequest1,
                scopes: ["User.Read"],
                authority: `${Constants.DEFAULT_AUTHORITY}`,
                correlationId: RANDOM_TEST_GUID,
                claims: JSON.stringify({ claim1: "claim1" }),
                requestedClaimsHash: TEST_CRYPTO_VALUES.TEST_SHA256_HASH,
                forceRefresh: false,
            };

            const expectedClaimsRequest2: CommonSilentFlowRequest = {
                ...claimsRequest2,
                scopes: ["User.Read"],
                authority: `${Constants.DEFAULT_AUTHORITY}`,
                correlationId: RANDOM_TEST_GUID,
                claims: JSON.stringify({ claim2: "claim2" }),
                requestedClaimsHash: TEST_CRYPTO_VALUES.TEST_SHA256_HASH,
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
            const claimsSilentRequest1 = pca.acquireTokenSilent(claimsRequest1);
            const claimsSilentRequest2 = pca.acquireTokenSilent(claimsRequest1);
            const claimsSilentRequest3 = pca.acquireTokenSilent(claimsRequest2);
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
                claimsSilentRequest1,
                claimsSilentRequest2,
                claimsSilentRequest3,
            ]);

            expect(silentATStub).toHaveBeenCalledWith(expectedTokenRequest1);
            expect(silentATStub).toHaveBeenCalledWith(expectedTokenRequest2);
            expect(silentATStub).toHaveBeenCalledWith(expectedPopTokenRequest1);
            expect(silentATStub).toHaveBeenCalledWith(expectedPopTokenRequest2);
            expect(silentATStub).toHaveBeenCalledWith(
                expectedSshCertificateRequest1
            );
            expect(silentATStub).toHaveBeenCalledWith(
                expectedSshCertificateRequest2
            );
            expect(silentATStub).toHaveBeenCalledWith(expectedClaimsRequest1);
            expect(silentATStub).toHaveBeenCalledWith(expectedClaimsRequest2);
            expect(silentATStub).toHaveBeenCalledTimes(8);
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
                expect(window.sessionStorage).toHaveLength(1);
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
                expect(window.sessionStorage).toHaveLength(1);
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
                expiresOn: new Date(
                    Date.now() + TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN * 1000
                ),
                account: testAccount,
                tokenType: AuthenticationScheme.BEARER,
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
            });
            const silentRequest2 = pca.acquireTokenSilent({
                scopes: ["Scope2"],
                account: testAccount,
            });
            const silentRequest3 = pca.acquireTokenSilent({
                scopes: ["Scope3"],
                account: testAccount,
            });
            await Promise.all([silentRequest1, silentRequest2, silentRequest3]);
            expect(iframeMock).toHaveBeenCalledTimes(1);
            expect(rtMockFirstCalledTimes).toEqual(3);
            expect(rtMockSecond).toHaveBeenCalledTimes(2);
            expect(await silentRequest1).toEqual(testTokenResponse);
            expect(await silentRequest2).toEqual(testTokenResponse);
            expect(await silentRequest3).toEqual(testTokenResponse);
        });

        it("throws RT renewal error if other in progress iframe renewal throws", async () => {
            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: "testTenantId",
                username: "username@contoso.com",
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
                expiresOn: new Date(
                    Date.now() + TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN * 1000
                ),
                account: testAccount,
                tokenType: AuthenticationScheme.BEARER,
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
            };
            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: testIdTokenClaims.tid || "",
                username: testIdTokenClaims.preferred_username || "",
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
                tokenType: AuthenticationScheme.BEARER,
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
            jest.spyOn(ProtocolUtils, "setRequestState").mockReturnValue(
                TEST_STATE_VALUES.TEST_STATE_SILENT
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
                    TEST_CONFIG.TOKEN_TYPE_BEARER as AuthenticationScheme,
                correlationId: RANDOM_TEST_GUID,
                authority: `${Constants.DEFAULT_AUTHORITY}`,
                prompt: "none",
                redirectUri: TEST_URIS.TEST_REDIR_URI,
                state: TEST_STATE_VALUES.TEST_STATE_SILENT,
                nonce: RANDOM_TEST_GUID,
                responseMode: ResponseMode.FRAGMENT,
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
            };
            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: testIdTokenClaims.tid || "",
                username: testIdTokenClaims.preferred_username || "",
                idTokenClaims: { ...testIdTokenClaims },
            };

            jest.spyOn(ProtocolUtils, "setRequestState").mockReturnValue(
                TEST_STATE_VALUES.TEST_STATE_SILENT
            );
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
                    fromNativeBroker: true,
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
                expiresOn: new Date(Date.now() + 3600000),
                account: testAccount,
                tokenType: AuthenticationScheme.BEARER,
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
            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: "3338040d-6c67-4c5b-b112-36a304b66dad",
                username: "AbeLi@microsoft.com",
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
                expiresOn: new Date(Date.now() + 3600000),
                account: testAccount,
                tokenType: AuthenticationScheme.BEARER,
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
            };
            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: testIdTokenClaims.tid || "",
                username: testIdTokenClaims.preferred_username || "",
                idTokenClaims: {
                    ...testIdTokenClaims,
                },
            };

            jest.spyOn(ProtocolUtils, "setRequestState").mockReturnValue(
                TEST_STATE_VALUES.TEST_STATE_SILENT
            );
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
            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: "3338040d-6c67-4c5b-b112-36a304b66dad",
                username: "AbeLi@microsoft.com",
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
                expiresOn: new Date(Date.now() + 3600000),
                account: testAccount,
                tokenType: AuthenticationScheme.BEARER,
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

            it("Calls SilentCacheClient.acquireToken and SilentRefreshClient.acquireToken, and does not call SilentIframeClient.acquireToken if cache lookup throws and refresh token is expired when CacheLookupPolicy is set to AccessTokenAndRefreshToken", async () => {
                const silentCacheSpy: jest.SpyInstance = jest
                    .spyOn(SilentCacheClient.prototype, "acquireToken")
                    .mockRejectedValue(refreshRequiredCacheError);
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
                        cacheLookupPolicy:
                            CacheLookupPolicy.AccessTokenAndRefreshToken,
                    })
                ).rejects.toThrow(refreshRequiredServerError);
                expect(silentCacheSpy).toHaveBeenCalledTimes(1);
                expect(silentRefreshSpy).toHaveBeenCalledTimes(1);
                expect(silentIframeSpy).toHaveBeenCalledTimes(0);
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
                });
                expect(response).toEqual(testTokenResponse);
                expect(silentCacheSpy).toHaveBeenCalledTimes(0);
                expect(silentRefreshSpy).toHaveBeenCalledTimes(0);
                expect(silentIframeSpy).toHaveBeenCalledTimes(1);
            });
        });
    });

    describe("logout", () => {
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
            pca.logout().catch((error: any) => {
                expect(error).toMatchObject(
                    createBrowserAuthError(
                        BrowserAuthErrorCodes.uninitializedPublicClientApplication
                    )
                );
                done();
            });
        });

        it("calls logoutRedirect", (done) => {
            jest.spyOn(pca, "logoutRedirect").mockImplementation((request) => {
                expect(request && request.postLogoutRedirectUri).toBe(
                    "/logout"
                );
                done();
                return Promise.resolve();
            });

            pca.logout({ postLogoutRedirectUri: "/logout" });
        });

        it("doesnt mutate request correlation id", async () => {
            jest.spyOn(pca, "logoutRedirect").mockImplementation((request) => {
                return Promise.resolve();
            });
            const request: EndSessionRequest = {};

            await pca.logout(request).catch(() => null);
            await pca.logout(request).catch(() => null);

            expect(request.correlationId).toBe(undefined);
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
                logger
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

        const testAccountInfo: AccountInfo = testAccount.getAccountInfo();
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
            pca.browserStorage.setAccount(testAccount);
            // @ts-ignore
            pca.browserStorage.setIdTokenCredential(testIdToken);
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
        const testAccountInfo1: AccountInfo = testAccount1.getAccountInfo();
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
        const testAccountInfo2: AccountInfo = testAccount2.getAccountInfo();
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
            pca.browserStorage.setAccount(testAccount1);
            // @ts-ignore
            pca.browserStorage.setAccount(testAccount2);

            // @ts-ignore
            pca.browserStorage.setIdTokenCredential(idToken1);

            // @ts-ignore
            pca.browserStorage.setIdTokenCredential(idToken2);
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

        it("getAccountByUsername returns account specified", () => {
            const account = pca.getAccountByUsername(
                ID_TOKEN_CLAIMS.preferred_username
            );
            expect(account?.idTokenClaims).not.toBeUndefined();
            expect(account).toEqual(testAccountInfo1);
        });

        it("getAccountByUsername returns account specified with case mismatch", () => {
            const account = pca.getAccountByUsername(
                ID_TOKEN_CLAIMS.preferred_username.toUpperCase()
            );
            expect(account?.idTokenClaims).not.toBeUndefined();
            expect(account).toEqual(testAccountInfo1);

            const account2 = pca.getAccountByUsername(
                ID_TOKEN_ALT_CLAIMS.preferred_username.toUpperCase()
            );
            expect(account2?.idTokenClaims).not.toBeUndefined();
            expect(account2).toEqual(testAccountInfo2);
        });

        it("getAccountByUsername returns null if account does not exist", () => {
            const account = pca.getAccountByUsername(
                "this-email-doesnt-exist@microsoft.com"
            );
            expect(account).toBe(null);
        });

        it("getAccountByUsername returns null if passed username is null", () => {
            // @ts-ignore
            const account = pca.getAccountByUsername(null);
            expect(account).toBe(null);
        });

        it("getAccountByHomeId returns account specified", () => {
            const account = pca.getAccountByHomeId(
                testAccountInfo1.homeAccountId
            );
            expect(account?.idTokenClaims).not.toBeUndefined();
            expect(account).toEqual(testAccountInfo1);
        });

        it("getAccountByHomeId returns null if passed id does not exist", () => {
            const account = pca.getAccountByHomeId("this-id-doesnt-exist");
            expect(account).toBe(null);
        });

        it("getAccountByHomeId returns null if passed id is null", () => {
            // @ts-ignore
            const account = pca.getAccountByHomeId(null);
            expect(account).toBe(null);
        });

        it("getAccountByLocalId returns account specified", () => {
            const account = pca.getAccountByLocalId(ID_TOKEN_CLAIMS.oid);
            expect(account?.idTokenClaims).not.toBeUndefined();
            expect(account).toEqual(testAccountInfo1);
        });

        it("getAccountByLocalId returns null if passed id does not exist", () => {
            const account = pca.getAccountByLocalId("this-id-doesnt-exist");
            expect(account).toBe(null);
        });

        it("getAccountByLocalId returns null if passed id is null", () => {
            // @ts-ignore
            const account = pca.getAccountByLocalId(null);
            expect(account).toBe(null);
        });

        describe("getAccount", () => {
            it("getAccount returns null if empty filter is passed in", () => {
                const account = pca.getAccount({});
                expect(account).toBe(null);
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
            ...testAccount1.getAccountInfo(),
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
            ...testAccount2.getAccountInfo(),
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
            pca.browserStorage.setAccount(testAccount1);
            // @ts-ignore
            pca.browserStorage.setAccount(testAccount2);

            // @ts-ignore
            pca.browserStorage.setIdTokenCredential(idToken1);
            // @ts-ignore
            pca.browserStorage.setIdTokenCredential(idToken2);
        });

        afterEach(() => {
            window.sessionStorage.clear();
        });

        describe("activeAccount getter and setter tests", () => {
            it("active account is initialized as null", () => {
                // Public client should initialze with active account set to null.
                expect(pca.getActiveAccount()).toBe(null);
            });

            it("setActiveAccount() sets the active account local id value correctly", () => {
                expect(pca.getActiveAccount()).toBe(null);
                pca.setActiveAccount(testAccountInfo1);
                const activeAccount = pca.getActiveAccount();
                expect(activeAccount?.idTokenClaims).not.toBeUndefined();
                expect(activeAccount).toEqual(testAccountInfo1);
            });

            it("getActiveAccount picks up legacy account id from local storage", async () => {
                let pcaLocal = new PublicClientApplication({
                    auth: {
                        clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                    },
                    telemetry: {
                        application: {
                            appName: TEST_CONFIG.applicationName,
                            appVersion: TEST_CONFIG.applicationVersion,
                        },
                    },
                    cache: {
                        cacheLocation: BrowserCacheLocation.LocalStorage,
                    },
                });
                await pcaLocal.initialize();
                expect(pcaLocal.getActiveAccount()).toBe(null);

                //Implementation of PCA was moved to controller.
                pcaLocal = (pcaLocal as any).controller;

                // @ts-ignore
                const localStorage = pcaLocal.browserStorage;
                localStorage.setAccount(testAccount1);
                localStorage.setIdTokenCredential(idToken1);
                localStorage.setItem(
                    localStorage.generateCacheKey(
                        PersistentCacheKeys.ACTIVE_ACCOUNT
                    ),
                    testAccount1.localAccountId
                );

                const activeAccount = pcaLocal.getActiveAccount();
                expect(activeAccount).not.toBeNull();
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
                        AccountEntity.generateAccountCacheKey(testAccountInfo2);
                    const idTokenKey2 =
                        CacheHelpers.generateCredentialKey(idToken2);
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
                jest.spyOn(
                    PopupClient.prototype,
                    "cleanPopup"
                ).mockImplementation();
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
                expect(message.eventType).toEqual(EventType.LOGIN_START);
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

            pca.getLogger().info("Message");
        });

        test("logger undefined", async () => {
            const authApp = new PublicClientApplication(testAppConfig);

            expect(authApp.getLogger()).toBeDefined();
            expect(authApp.getLogger().info("Test logger")).toEqual(undefined);
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
            ...buildAccountFromIdTokenClaims(ID_TOKEN_CLAIMS).getAccountInfo(),
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
            expiresOn: new Date(Date.now() + 3600000),
            account: testAccount,
            tokenType: AuthenticationScheme.BEARER,
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
                    allowNativeBroker: true,
                },
            };
            pca = new PublicClientApplication(config);

            stubProvider(config);
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
                fromNativeBroker: true,
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
                    allowNativeBroker: false,
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

            logger.info("test info");
            logger.verbose("test verbose");
            logger.verbosePii("test pii verbose");

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
                    allowNativeBroker: false,
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

            logger.info("test info");
            logger.verbose("test verbose");
            logger.verbosePii("test pii verbose");

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
                    allowNativeBroker: false,
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

            logger.info("test info");
            logger.verbose("test verbose");
            logger.verbosePii("test pii verbose");

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
                    allowNativeBroker: false,
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

            logger.info("test info");
            logger.verbose("test verbose");
            logger.verbosePii("test pii verbose");

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
                    allowNativeBroker: false,
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

            logger.info("test info");
            logger.verbose("test verbose");
            logger.verbosePii("test pii verbose");

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

    describe("handleAccountCacheChange", () => {
        it("ACCOUNT_ADDED event raised when an account logs in in another tab", (done) => {
            const subscriber = (message: EventMessage) => {
                expect(message.eventType).toEqual(EventType.ACCOUNT_ADDED);
                expect(message.interactionType).toBeNull();
                expect(message.payload).toEqual(accountEntity.getAccountInfo());
                expect(message.error).toBeNull();
                expect(message.timestamp).not.toBeNull();
                done();
            };

            pca.addEventCallback(subscriber);

            const accountEntity: AccountEntity =
                buildAccountFromIdTokenClaims(ID_TOKEN_CLAIMS);

            const account: AccountInfo = accountEntity.getAccountInfo();

            const cacheKey1 = AccountEntity.generateAccountCacheKey(account);

            // @ts-ignore
            pca.controller.handleAccountCacheChange({
                key: cacheKey1,
                oldValue: null,
                newValue: JSON.stringify(accountEntity),
            });
        });

        it("ACCOUNT_REMOVED event raised when an account logs out in another tab", (done) => {
            const subscriber = (message: EventMessage) => {
                expect(message.eventType).toEqual(EventType.ACCOUNT_REMOVED);
                expect(message.interactionType).toBeNull();
                expect(message.payload).toEqual(account);
                expect(message.error).toBeNull();
                expect(message.timestamp).not.toBeNull();
                done();
            };

            pca.addEventCallback(subscriber);

            const accountEntity: AccountEntity =
                buildAccountFromIdTokenClaims(ID_TOKEN_CLAIMS);

            const account: AccountInfo = accountEntity.getAccountInfo();

            const cacheKey1 = AccountEntity.generateAccountCacheKey(account);

            // @ts-ignore
            pca.controller.handleAccountCacheChange({
                key: cacheKey1,
                oldValue: JSON.stringify(accountEntity),
                newValue: null,
            });
        });

        it("No event raised if cache value is not JSON", () => {
            const subscriber = (message: EventMessage) => {};
            pca.addEventCallback(subscriber);

            const emitEventSpy = jest.spyOn(
                EventHandler.prototype,
                "emitEvent"
            );
            // @ts-ignore
            pca.controller.handleAccountCacheChange({
                key: "testCacheKey",
                oldValue: "not JSON",
                newValue: null,
            });

            expect(emitEventSpy.mock.calls.length).toBe(0);
        });

        it("No event raised if cache value is not an account", () => {
            const subscriber = (message: EventMessage) => {};
            pca.addEventCallback(subscriber);

            const emitEventSpy = jest.spyOn(
                EventHandler.prototype,
                "emitEvent"
            );
            // @ts-ignore
            pca.controller.handleAccountCacheChange({
                key: "testCacheKey",
                oldValue: JSON.stringify({
                    testKey: "this is not an account object",
                }),
                newValue: null,
            });

            expect(emitEventSpy.mock.calls.length).toBe(0);
        });

        it("No event raised if both oldValue and newValue are falsey", () => {
            const subscriber = (message: EventMessage) => {};
            pca.addEventCallback(subscriber);

            const emitEventSpy = jest.spyOn(
                EventHandler.prototype,
                "emitEvent"
            );
            // @ts-ignore
            pca.controller.handleAccountCacheChange({
                key: "testCacheKey",
                oldValue: null,
                newValue: null,
            });

            expect(emitEventSpy.mock.calls.length).toBe(0);
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

            pca.addEventCallback(subscriber);

            const activeAccountEntity: AccountEntity =
                buildAccountFromIdTokenClaims(ID_TOKEN_CLAIMS);
            const newActiveAccountEntity: AccountEntity =
                buildAccountFromIdTokenClaims(ID_TOKEN_ALT_CLAIMS);

            const activeAccount: AccountInfo =
                activeAccountEntity.getAccountInfo();
            const newActiveAccount: AccountInfo =
                newActiveAccountEntity.getAccountInfo();

            const previousActiveAccountFilters = {
                homeAccountId: activeAccount.homeAccountId,
                localAccountId: activeAccount.localAccountId,
                tenantId: activeAccount.tenantId,
            };

            const newActiveAccountFilters = {
                homeAccountId: newActiveAccount.homeAccountId,
                localAccountId: newActiveAccount.localAccountId,
                tenantId: newActiveAccount.tenantId,
            };

            const activeAccountKey = `${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${PersistentCacheKeys.ACTIVE_ACCOUNT_FILTERS}`;

            // @ts-ignore
            pca.controller.handleAccountCacheChange({
                key: activeAccountKey,
                oldValue: JSON.stringify(previousActiveAccountFilters),
                newValue: JSON.stringify(newActiveAccountFilters),
            });
        });
    });
});
