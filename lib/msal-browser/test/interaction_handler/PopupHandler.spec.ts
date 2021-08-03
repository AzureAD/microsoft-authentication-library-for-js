/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { PkceCodes, AuthorityFactory, CommonAuthorizationCodeRequest, Constants, AuthorizationCodeClient, ProtocolMode, Logger, AuthenticationScheme, AuthorityOptions, ClientConfiguration, AuthError } from "@azure/msal-common";
import { PopupHandler } from "../../src/interaction_handler/PopupHandler";
import { Configuration, buildConfiguration } from "../../src/config/Configuration";
import { TEST_CONFIG, TEST_URIS, RANDOM_TEST_GUID, TEST_POP_VALUES } from "../utils/StringConstants";
import sinon from "sinon";
import { InteractionHandler } from "../../src/interaction_handler/InteractionHandler";
import { BrowserAuthErrorMessage, BrowserAuthError } from "../../src/error/BrowserAuthError";
import { BrowserConstants, TemporaryCacheKeys } from "../../src/utils/BrowserConstants";
import { CryptoOps } from "../../src/crypto/CryptoOps";
import { TestStorageManager } from "../cache/TestStorageManager";
import { BrowserCacheManager } from "../../src/cache/BrowserCacheManager";

const testPkceCodes = {
    challenge: "TestChallenge",
    verifier: "TestVerifier"
} as PkceCodes;

const testNetworkResult = {
    testParam: "testValue"
};

const defaultTokenRequest: CommonAuthorizationCodeRequest = {
    authenticationScheme: AuthenticationScheme.BEARER,
    redirectUri: `${TEST_URIS.DEFAULT_INSTANCE}/`,
    code: "thisIsATestCode",
    scopes: TEST_CONFIG.DEFAULT_SCOPES,
    codeVerifier: TEST_CONFIG.TEST_VERIFIER,
    authority: `${Constants.DEFAULT_AUTHORITY}/`,
    correlationId: RANDOM_TEST_GUID
};

const networkInterface = {
    sendGetRequestAsync<T>(): T {
        return {} as T;
    },
    sendPostRequestAsync<T>(): T {
        return {} as T;
    },
};

describe("PopupHandler.ts Unit Tests", () => {
    let authCodeModule: AuthorizationCodeClient;
    let browserStorage: BrowserCacheManager;
    let browserRequestLogger: Logger;
    const cryptoOps = new CryptoOps();
    beforeEach(() => {
        const appConfig: Configuration = {
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID
            }
        };
        const configObj = buildConfiguration(appConfig, true);
        const authorityOptions: AuthorityOptions = {
            protocolMode: ProtocolMode.AAD,
            knownAuthorities: [],
            cloudDiscoveryMetadata: "",
            authorityMetadata: ""
        }
        const authorityInstance = AuthorityFactory.createInstance(configObj.auth.authority, networkInterface, browserStorage, authorityOptions);
        const authConfig: ClientConfiguration = {
            authOptions: {
                ...configObj.auth,
                authority: authorityInstance,
            },
            systemOptions: {
                tokenRenewalOffsetSeconds:
                    configObj.system.tokenRenewalOffsetSeconds
            },
            cryptoInterface: {
                createNewGuid: (): string => {
                    return "newGuid";
                },
                base64Decode: (input: string): string => {
                    return "testDecodedString";
                },
                base64Encode: (input: string): string => {
                    return "testEncodedString";
                },
                generatePkceCodes: async (): Promise<PkceCodes> => {
                    return testPkceCodes;
                },
                getPublicKeyThumbprint: async (): Promise<string> => {
                    return TEST_POP_VALUES.ENCODED_REQ_CNF;
                },
                signJwt: async (): Promise<string> => {
                    return "signedJwt";
                },
                removeTokenBindingKey: async (): Promise<boolean> => {
                    return Promise.resolve(true);
                },
                clearKeystore: async (): Promise<boolean> => {
                    return Promise.resolve(true);
                }
            },
            networkInterface: {
                sendGetRequestAsync: async (): Promise<any> => {
                    return testNetworkResult;
                },
                sendPostRequestAsync: async (): Promise<any> => {
                    return testNetworkResult;
                },
            },
            loggerOptions: {
                loggerCallback: (): void => {},
                piiLoggingEnabled: true,
            },
        };
        authConfig.storageInterface = new TestStorageManager(TEST_CONFIG.MSAL_CLIENT_ID, authConfig.cryptoInterface!);
        authCodeModule = new AuthorizationCodeClient(authConfig);
        const logger = new Logger(authConfig.loggerOptions!);
        browserStorage = new BrowserCacheManager(TEST_CONFIG.MSAL_CLIENT_ID, configObj.cache, cryptoOps, logger);
        browserRequestLogger = new Logger(authConfig.loggerOptions!);
    });

    afterEach(() => {
        sinon.restore();
    });

    describe("Constructor", () => {

        it("creates a valid PopupHandler", () => {
            const popupHandler = new PopupHandler(authCodeModule, browserStorage, defaultTokenRequest, browserRequestLogger);
            expect(popupHandler).toBeInstanceOf(PopupHandler);
            expect(popupHandler).toBeInstanceOf(InteractionHandler);
        });
    });

    describe("initiateAuthRequest()", () => {

        it("throws error if request uri is empty", () => {
            const testTokenReq: CommonAuthorizationCodeRequest = {
                authenticationScheme: AuthenticationScheme.BEARER,
                redirectUri: `${TEST_URIS.DEFAULT_INSTANCE}/`,
                code: "thisIsATestCode",
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                codeVerifier: TEST_CONFIG.TEST_VERIFIER,
                authority: `${Constants.DEFAULT_AUTHORITY}/`,
                correlationId: RANDOM_TEST_GUID
            };
            const popupHandler = new PopupHandler(authCodeModule, browserStorage, testTokenReq, browserRequestLogger);
            expect(() => popupHandler.initiateAuthRequest("", {popupName: "name"})).toThrow(BrowserAuthErrorMessage.emptyNavigateUriError.desc);
            expect(() => popupHandler.initiateAuthRequest("", {popupName: "name"})).toThrow(BrowserAuthError);

            //@ts-ignore
            expect(() => popupHandler.initiateAuthRequest(null, {})).toThrow(BrowserAuthErrorMessage.emptyNavigateUriError.desc);
            //@ts-ignore
            expect(() => popupHandler.initiateAuthRequest(null, {})).toThrow(BrowserAuthError);
        });

        it("opens a popup window", () => {
            const testTokenReq: CommonAuthorizationCodeRequest = {
                redirectUri: `${TEST_URIS.DEFAULT_INSTANCE}/`,
                code: "thisIsATestCode",
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                codeVerifier: TEST_CONFIG.TEST_VERIFIER,
                authority: `${Constants.DEFAULT_AUTHORITY}/`,
                correlationId: RANDOM_TEST_GUID,
                authenticationScheme: AuthenticationScheme.BEARER
            };
            // sinon.stub(window, "open").returns(window);
            window.focus = (): void => {
                return;
            };

            window.open = (url?: string, target?: string, features?: string, replace?: boolean): Window => {
                return window;
            };

            const popupHandler = new PopupHandler(authCodeModule, browserStorage, testTokenReq, browserRequestLogger);
            popupHandler.initiateAuthRequest(TEST_URIS.ALTERNATE_INSTANCE, {popupName: "name"});
            expect(browserStorage.getTemporaryCache(TemporaryCacheKeys.INTERACTION_STATUS_KEY, true)).toEqual(BrowserConstants.INTERACTION_IN_PROGRESS_VALUE);
        });
    });

    describe("monitorPopupForHash", () => {
        it("times out", done => {
            const popup = {
                location: {
                    href: "http://localhost",
                    hash: ""
                },
                close: () => {}
            };

            const popupHandler = new PopupHandler(authCodeModule, browserStorage, defaultTokenRequest, browserRequestLogger);
            // @ts-ignore
            popupHandler.monitorPopupForHash(popup, 500)
                .catch(() => {
                    done();
                });
        });

        it("returns hash", done => {
            const popup = {
                location: {
                    href: "http://localhost/#/code=hello",
                    hash: "#code=hello"
                },
                history: {
                    replaceState: () => { return }
                },
                close: () => {}
            };

            const popupHandler = new PopupHandler(authCodeModule, browserStorage, defaultTokenRequest, browserRequestLogger);
            // @ts-ignore
            popupHandler.monitorPopupForHash(popup, 1000)
                .then((hash: string) => {
                    expect(hash).toEqual("#code=hello");
                    done();
                });
        });

        it("closed", done => {
            const popup = {
                location: {
                    href: "http://localhost",
                    hash: ""
                },
                close: () => {},
                closed: true
            };

            const popupHandler = new PopupHandler(authCodeModule, browserStorage, defaultTokenRequest, browserRequestLogger);
            // @ts-ignore
            popupHandler.monitorPopupForHash(popup, 1000)
                .catch((error: AuthError) => {
                    expect(error.errorCode).toEqual("user_cancelled");
                    done();
                });
        });
    });

    describe("openPopup", () => {
        afterEach(() => {
            sinon.restore();
        });

        it("assigns urlNavigate if popup passed in", () => {
            const assignSpy = sinon.spy();
            const focusSpy = sinon.spy();

            const windowObject = {
                location: {
                    assign: assignSpy
                },
                focus: focusSpy
            };

            const testRequest: CommonAuthorizationCodeRequest = {
                redirectUri: "",
                code: "thisIsATestCode",
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                codeVerifier: TEST_CONFIG.TEST_VERIFIER,
                authority: `${Constants.DEFAULT_AUTHORITY}/`,
                correlationId: RANDOM_TEST_GUID,
                authenticationScheme: AuthenticationScheme.BEARER
            };

            const popupHandler = new PopupHandler(authCodeModule, browserStorage, testRequest, browserRequestLogger);
            const popupWindow = popupHandler.initiateAuthRequest("http://localhost/#/code=hello", {
                // @ts-ignore
                popup: windowObject
            });

            expect(assignSpy.calledWith("http://localhost/#/code=hello")).toBe(true);
            expect(popupWindow).toEqual(windowObject);
        });

        it("opens popup if no popup window is passed in", () => {
            sinon.stub(window, "open").returns(window);
            sinon.stub(window, "focus");

            const testRequest: CommonAuthorizationCodeRequest = {
                authenticationScheme: AuthenticationScheme.BEARER,
                redirectUri: "",
                code: "thisIsATestCode",
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                codeVerifier: TEST_CONFIG.TEST_VERIFIER,
                authority: `${Constants.DEFAULT_AUTHORITY}/`,
                correlationId: RANDOM_TEST_GUID
            };

            const popupHandler = new PopupHandler(authCodeModule, browserStorage, testRequest, browserRequestLogger);
            const popupWindow = popupHandler.initiateAuthRequest("http://localhost/#/code=hello", {
                popupName: "name"
            });

            expect(popupWindow).toEqual(window);
        });

        it("throws error if no popup passed in but window.open returns null", () => {
            sinon.stub(window, "open").returns(null);

            const testRequest: CommonAuthorizationCodeRequest = {
                redirectUri: `${TEST_URIS.DEFAULT_INSTANCE}/`,
                code: "thisIsATestCode",
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                codeVerifier: TEST_CONFIG.TEST_VERIFIER,
                authority: `${Constants.DEFAULT_AUTHORITY}/`,
                correlationId: RANDOM_TEST_GUID,
                authenticationScheme: AuthenticationScheme.BEARER
            };

            const popupHandler = new PopupHandler(authCodeModule, browserStorage, testRequest, browserRequestLogger);
            expect(() => popupHandler.initiateAuthRequest("http://localhost/#/code=hello", {popupName: "name"})).toThrow(BrowserAuthErrorMessage.emptyWindowError.desc);
        });

        it("throws error if popup passed in is null", () => {
            const testRequest: CommonAuthorizationCodeRequest = {
                redirectUri: `${TEST_URIS.DEFAULT_INSTANCE}/`,
                code: "thisIsATestCode",
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                codeVerifier: TEST_CONFIG.TEST_VERIFIER,
                authority: `${Constants.DEFAULT_AUTHORITY}/`,
                correlationId: RANDOM_TEST_GUID,
                authenticationScheme: AuthenticationScheme.BEARER
            };

            const popupHandler = new PopupHandler(authCodeModule, browserStorage, testRequest, browserRequestLogger);
            expect(() => popupHandler.initiateAuthRequest("http://localhost/#/code=hello", {
                popup: null,
                popupName: "name"
            })).toThrow(BrowserAuthErrorMessage.emptyWindowError.desc);
            expect(() => popupHandler.initiateAuthRequest("http://localhost/#/code=hello", {
                popup: null,
                popupName: "name"
            })).toThrow(BrowserAuthError);
        });
    });
});
