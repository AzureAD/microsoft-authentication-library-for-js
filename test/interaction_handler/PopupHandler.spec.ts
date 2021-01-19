/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { PkceCodes, NetworkRequestOptions, LogLevel, AuthorityFactory, AuthorizationCodeRequest, Constants, AuthorizationCodeClient, ProtocolMode, Logger, AuthenticationScheme } from "@azure/msal-common";
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
chai.use(chaiAsPromised);
const expect = chai.expect;

const testPkceCodes = {
    challenge: "TestChallenge",
    verifier: "TestVerifier"
} as PkceCodes;

const testNetworkResult = {
    testParam: "testValue"
};

const testKeySet = ["testKey1", "testKey2"];

const defaultTokenRequest: AuthorizationCodeRequest = {
    authenticationScheme: AuthenticationScheme.BEARER,
    redirectUri: `${TEST_URIS.DEFAULT_INSTANCE}/`,
    code: "thisIsATestCode",
    scopes: TEST_CONFIG.DEFAULT_SCOPES,
    codeVerifier: TEST_CONFIG.TEST_VERIFIER,
    authority: `${Constants.DEFAULT_AUTHORITY}/`,
    correlationId: RANDOM_TEST_GUID
};

const networkInterface = {
    sendGetRequestAsync<T>(
        url: string,
        options?: NetworkRequestOptions
    ): T {
        return null;
    },
    sendPostRequestAsync<T>(
        url: string,
        options?: NetworkRequestOptions
    ): T {
        return null;
    },
};

describe("PopupHandler.ts Unit Tests", () => {
    let authCodeModule: AuthorizationCodeClient;
    let browserStorage: BrowserCacheManager;
    const cryptoOps = new CryptoOps();
    beforeEach(() => {
        const appConfig: Configuration = {
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID
            }
        };
        const configObj = buildConfiguration(appConfig, true);
        const authorityInstance = AuthorityFactory.createInstance(configObj.auth.authority, networkInterface, ProtocolMode.AAD);
        const authConfig = {
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
                }
            },
            storageInterface: null,
            networkInterface: {
                sendGetRequestAsync: async (
                    url: string,
                    options?: NetworkRequestOptions
                ): Promise<any> => {
                    return testNetworkResult;
                },
                sendPostRequestAsync: async (
                    url: string,
                    options?: NetworkRequestOptions
                ): Promise<any> => {
                    return testNetworkResult;
                },
            },
            loggerOptions: {
                loggerCallback: (
                    level: LogLevel,
                    message: string,
                    containsPii: boolean
                ): void => {},
                piiLoggingEnabled: true,
            },
        };
        authConfig.storageInterface = new TestStorageManager(TEST_CONFIG.MSAL_CLIENT_ID, authConfig.cryptoInterface);
        authCodeModule = new AuthorizationCodeClient(authConfig);
        const logger = new Logger(authConfig.loggerOptions);
        browserStorage = new BrowserCacheManager(TEST_CONFIG.MSAL_CLIENT_ID, configObj.cache, cryptoOps, logger);
    });

    afterEach(() => {
        sinon.restore();
    });

    describe("Constructor", () => {

        it("creates a valid PopupHandler", () => {
            const popupHandler = new PopupHandler(authCodeModule, browserStorage, defaultTokenRequest);
            expect(popupHandler instanceof PopupHandler).to.be.true;
            expect(popupHandler instanceof InteractionHandler).to.be.true;
        });
    });

    describe("initiateAuthRequest()", () => {

        it("throws error if request uri is empty", () => {
            const testTokenReq: AuthorizationCodeRequest = {
                authenticationScheme: AuthenticationScheme.BEARER,
                redirectUri: `${TEST_URIS.DEFAULT_INSTANCE}/`,
                code: "thisIsATestCode",
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                codeVerifier: TEST_CONFIG.TEST_VERIFIER,
                authority: `${Constants.DEFAULT_AUTHORITY}/`,
                correlationId: RANDOM_TEST_GUID
            };
            const popupHandler = new PopupHandler(authCodeModule, browserStorage, testTokenReq);
            expect(() => popupHandler.initiateAuthRequest("", {})).to.throw(BrowserAuthErrorMessage.emptyNavigateUriError.desc);
            expect(() => popupHandler.initiateAuthRequest("", {})).to.throw(BrowserAuthError);

            expect(() => popupHandler.initiateAuthRequest(null, {})).to.throw(BrowserAuthErrorMessage.emptyNavigateUriError.desc);
            expect(() => popupHandler.initiateAuthRequest(null, {})).to.throw(BrowserAuthError);
        });

        it("opens a popup window", () => {
            const testTokenReq: AuthorizationCodeRequest = {
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

            const popupHandler = new PopupHandler(authCodeModule, browserStorage, testTokenReq);
            popupHandler.initiateAuthRequest(TEST_URIS.ALTERNATE_INSTANCE, {});
            expect(browserStorage.getTemporaryCache(TemporaryCacheKeys.INTERACTION_STATUS_KEY, true)).to.be.eq(BrowserConstants.INTERACTION_IN_PROGRESS_VALUE);
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

            const popupHandler = new PopupHandler(authCodeModule, browserStorage, defaultTokenRequest);
            // @ts-ignore
            popupHandler.monitorPopupForHash(popup, 500)
                .catch(() => {
                    done();
                });
        });

        it("returns hash", done => {
            const popup = {
                location: {
                    href: "http://localhost",
                    hash: ""
                },
                close: () => {}
            };

            const popupHandler = new PopupHandler(authCodeModule, browserStorage, defaultTokenRequest);
            // @ts-ignore
            popupHandler.monitorPopupForHash(popup, 1000)
                .then((hash: string) => {
                    expect(hash).to.equal("#code=hello");
                    done();
                });

            setTimeout(() => {
                popup.location = {
                    href: "http://localhost/#/code=hello",
                    hash: "#code=hello"
                };
            }, 500);
        });

        it("closed", done => {
            const popup = {
                location: {
                    href: "http://localhost",
                    hash: ""
                },
                close: () => {},
                closed: false
            };

            const popupHandler = new PopupHandler(authCodeModule, browserStorage, defaultTokenRequest);
            // @ts-ignore
            popupHandler.monitorPopupForHash(popup, 1000)
                .catch((error) => {
                    expect(error.errorCode).to.equal("user_cancelled");
                    done();
                });

            setTimeout(() => {
                popup.closed = true;
            }, 500);
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

            const testRequest: AuthorizationCodeRequest = {
                redirectUri: "",
                code: "thisIsATestCode",
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                codeVerifier: TEST_CONFIG.TEST_VERIFIER,
                authority: `${Constants.DEFAULT_AUTHORITY}/`,
                correlationId: RANDOM_TEST_GUID,
                authenticationScheme: AuthenticationScheme.BEARER
            };

            const popupHandler = new PopupHandler(authCodeModule, browserStorage, testRequest);
            const popupWindow = popupHandler.initiateAuthRequest("http://localhost/#/code=hello", {
                // @ts-ignore
                popup: windowObject
            });

            expect(assignSpy.calledWith("http://localhost/#/code=hello")).to.be.true;
            expect(popupWindow).to.equal(windowObject);
        });

        it("opens popup if no popup window is passed in", () => {
            sinon.stub(window, "open").returns(window);
            sinon.stub(window, "focus");

            const testRequest: AuthorizationCodeRequest = {
                authenticationScheme: AuthenticationScheme.BEARER,
                redirectUri: "",
                code: "thisIsATestCode",
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                codeVerifier: TEST_CONFIG.TEST_VERIFIER,
                authority: `${Constants.DEFAULT_AUTHORITY}/`,
                correlationId: RANDOM_TEST_GUID
            };

            const popupHandler = new PopupHandler(authCodeModule, browserStorage, testRequest);
            const popupWindow = popupHandler.initiateAuthRequest("http://localhost/#/code=hello", {});

            expect(popupWindow).to.equal(window);
        });

        it("throws error if no popup passed in but window.open returns null", () => {
            sinon.stub(window, "open").returns(null);

            const testRequest: AuthorizationCodeRequest = {
                redirectUri: `${TEST_URIS.DEFAULT_INSTANCE}/`,
                code: "thisIsATestCode",
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                codeVerifier: TEST_CONFIG.TEST_VERIFIER,
                authority: `${Constants.DEFAULT_AUTHORITY}/`,
                correlationId: RANDOM_TEST_GUID,
                authenticationScheme: AuthenticationScheme.BEARER
            };

            const popupHandler = new PopupHandler(authCodeModule, browserStorage, testRequest);
            expect(() => popupHandler.initiateAuthRequest("http://localhost/#/code=hello", {})).to.throw(BrowserAuthErrorMessage.emptyWindowError.desc);
        });

        it("throws error if popup passed in is null", () => {
            const testRequest: AuthorizationCodeRequest = {
                redirectUri: `${TEST_URIS.DEFAULT_INSTANCE}/`,
                code: "thisIsATestCode",
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                codeVerifier: TEST_CONFIG.TEST_VERIFIER,
                authority: `${Constants.DEFAULT_AUTHORITY}/`,
                correlationId: RANDOM_TEST_GUID,
                authenticationScheme: AuthenticationScheme.BEARER
            };

            const popupHandler = new PopupHandler(authCodeModule, browserStorage, testRequest);
            expect(() => popupHandler.initiateAuthRequest("http://localhost/#/code=hello", {
                popup: null
            })).to.throw(BrowserAuthErrorMessage.emptyWindowError.desc);
            expect(() => popupHandler.initiateAuthRequest("http://localhost/#/code=hello", {
                popup: null
            })).to.throw(BrowserAuthError);
        });
    });

    describe("openSizedPopup", () => {
        it("opens a popup with urlNavigate", () => {
            const windowOpenSpy = sinon.stub(window, "open");
            PopupHandler.openSizedPopup("http://localhost/", "popup");

            expect(windowOpenSpy.calledWith("http://localhost/", "popup")).to.be.true;
        });

        it("opens a popup with about:blank", () => {
            const windowOpenSpy = sinon.stub(window, "open");
            PopupHandler.openSizedPopup("about:blank", "popup");

            expect(windowOpenSpy.calledWith("about:blank", "popup")).to.be.true;
        });
    });

    describe("generatePopupName", () => {
        it("generates expected name", () => {
            const popupName = PopupHandler.generatePopupName("client-id", {
                scopes: [ "scope1", "scope2"],
                authority: "https://login.microsoftonline.com/common",
                correlationId: "correlation-id"
            });

            expect(popupName).to.equal("msal.client-id.scope1-scope2.https://login.microsoftonline.com/common.correlation-id");
        })
    })
});
