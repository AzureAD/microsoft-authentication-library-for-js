/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import chai from "chai";
import "mocha";
import chaiAsPromised from "chai-as-promised";
import { PkceCodes, NetworkRequestOptions, LogLevel, AuthorityFactory, CommonAuthorizationCodeRequest, Constants, CacheManager, AuthorizationCodeClient } from "@azure/msal-common";
import sinon from "sinon";
import { SilentHandler } from "../../src/interaction_handler/SilentHandler";
import { BrowserStorage } from "../../src/cache/BrowserStorage";
import { Configuration, buildConfiguration } from "../../src/config/Configuration";
import { TEST_CONFIG, testNavUrl, TEST_URIS, RANDOM_TEST_GUID, TEST_POP_VALUES } from "../utils/StringConstants";
import { InteractionHandler } from "../../src/interaction_handler/InteractionHandler";
import { BrowserAuthError, BrowserAuthErrorMessage } from "../../src/error/BrowserAuthError";
import { CryptoOps } from "../../src/crypto/CryptoOps";
import { TestStorageManager } from "../cache/TestStorageManager";

chai.use(chaiAsPromised);
const expect = chai.expect;

const DEFAULT_IFRAME_TIMEOUT_MS = 6000;

const testPkceCodes = {
    challenge: "TestChallenge",
    verifier: "TestVerifier"
} as PkceCodes;

const testNetworkResult = {
    testParam: "testValue"
};

const testKeySet = ["testKey1", "testKey2"];

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

describe("SilentHandler.ts Unit Tests", () => {

    let browserStorage: BrowserStorage;
    let silentHandler: SilentHandler;
    let authCodeModule: AuthorizationCodeClient;
    beforeEach(() => {
        const appConfig: Configuration = {
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID
            }
        };
        const configObj = buildConfiguration(appConfig);
        const authorityInstance = AuthorityFactory.createInstance(configObj.auth.authority, networkInterface);
        authCodeModule = new AuthorizationCodeClient({
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
            storageInterface: new TestStorageManager(),
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
                ): void => {
                    if (containsPii) {
                        console.log(`Log level: ${level} Message: ${message}`);
                    }
                },
                piiLoggingEnabled: true,
            },
        });
        const browserCrypto = new CryptoOps();
        browserStorage = new BrowserStorage(TEST_CONFIG.MSAL_CLIENT_ID, configObj.cache, browserCrypto);
        silentHandler = new SilentHandler(authCodeModule, browserStorage, DEFAULT_IFRAME_TIMEOUT_MS);
    });

    afterEach(() => {
        sinon.restore();
    });

    describe("Constructor", () => {

        it("creates a subclass of InteractionHandler called SilentHandler", () => {
            expect(silentHandler instanceof SilentHandler).to.be.true;
            expect(silentHandler instanceof InteractionHandler).to.be.true;
        });
    });

    describe("initiateAuthRequest()", () => {

        it("throws error if requestUrl is empty", async () => {
            const testTokenReq: CommonAuthorizationCodeRequest = {
                redirectUri: `${TEST_URIS.DEFAULT_INSTANCE}/`,
                code: "thisIsATestCode",
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                codeVerifier: TEST_CONFIG.TEST_VERIFIER,
                authority: `${Constants.DEFAULT_AUTHORITY}/`,
                correlationId: RANDOM_TEST_GUID
            };
            await expect(silentHandler.initiateAuthRequest("", testTokenReq)).to.be.rejectedWith(BrowserAuthErrorMessage.emptyNavigateUriError.desc);
            await expect(silentHandler.initiateAuthRequest("", testTokenReq)).to.be.rejectedWith(BrowserAuthError);

            await expect(silentHandler.initiateAuthRequest(null, testTokenReq)).to.be.rejectedWith(BrowserAuthErrorMessage.emptyNavigateUriError.desc);
            await expect(silentHandler.initiateAuthRequest(null, testTokenReq)).to.be.rejectedWith(BrowserAuthError);
        });

        it("Creates a frame asynchronously when created with default timeout", async () => {
            const testTokenReq: CommonAuthorizationCodeRequest = {
                redirectUri: `${TEST_URIS.DEFAULT_INSTANCE}/`,
                code: "thisIsATestCode",
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                codeVerifier: TEST_CONFIG.TEST_VERIFIER,
                authority: `${Constants.DEFAULT_AUTHORITY}/`,
                correlationId: RANDOM_TEST_GUID
            };
            const loadFrameSyncSpy = sinon.spy(silentHandler, <any>"loadFrameSync");
            const loadFrameSpy = sinon.spy(silentHandler, <any>"loadFrame");
            const authFrame = await silentHandler.initiateAuthRequest(testNavUrl, testTokenReq);
            expect(loadFrameSyncSpy.calledOnce).to.be.true;
            expect(loadFrameSpy.called).to.be.true;
            expect(authFrame instanceof HTMLIFrameElement).to.be.true;
        }).timeout(DEFAULT_IFRAME_TIMEOUT_MS + 1000);

        it("Creates a frame synchronously when created with a timeout of 0", async () => {
            const testTokenReq: CommonAuthorizationCodeRequest = {
                redirectUri: `${TEST_URIS.DEFAULT_INSTANCE}/`,
                code: "thisIsATestCode",
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                codeVerifier: TEST_CONFIG.TEST_VERIFIER,
                authority: `${Constants.DEFAULT_AUTHORITY}/`,
                correlationId: RANDOM_TEST_GUID
            };
            silentHandler = new SilentHandler(authCodeModule, browserStorage, 0);
            const loadFrameSyncSpy = sinon.spy(silentHandler, <any>"loadFrameSync");
            const loadFrameSpy = sinon.spy(silentHandler, <any>"loadFrame");
            const authFrame = await silentHandler.initiateAuthRequest(testNavUrl, testTokenReq);
            expect(loadFrameSyncSpy.calledOnce).to.be.true;
            expect(loadFrameSpy.called).to.be.false;
            expect(authFrame instanceof HTMLIFrameElement).to.be.true;
        });
    });

    describe("monitorIframeForHash", () => {
        it("times out", done => {
            const iframe = {
                contentWindow: {
                    // @ts-ignore
                    location: null // example of scenario that would never otherwise resolve
                }
            };

            // @ts-ignore
            silentHandler.monitorIframeForHash(iframe, 500)
                .catch(() => {
                    done();
                });
        });

        it("times out when event loop is suspended", function(done) {
            this.timeout(5000);

            const iframe = {
                contentWindow: {
                    location: {
                        href: "http://localhost",
                        hash: ""
                    }
                }
            };

            // @ts-ignore
            silentHandler.monitorIframeForHash(iframe, 2000)
                .catch(() => {
                    done();
                });

            setTimeout(() => {
                iframe.contentWindow.location = {
                    href: "http://localhost/#/code=hello",
                    hash: "#code=hello"
                };
            }, 1600);

            /**
             * This code mimics the JS event loop being synchonously paused (e.g. tab suspension) midway through polling the iframe.
             * If the event loop is suspended for longer than the configured timeout,
             * the polling operation should throw an error for a timeout.
             */
            const startPauseDelay = 200;
            const pauseDuration = 3000;
            setTimeout(() => {
                Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, pauseDuration);
            }, startPauseDelay);
        });

        it("returns hash", done => {
            const iframe = {
                contentWindow: {
                    location: {
                        href: "http://localhost",
                        hash: ""
                    }
                }
            };

            // @ts-ignore
            silentHandler.monitorIframeForHash(iframe, 1000)
                .then((hash: string) => {
                    expect(hash).to.equal("#code=hello");
                    done();
                });

            setTimeout(() => {
                iframe.contentWindow.location = {
                    href: "http://localhost/#code=hello",
                    hash: "#code=hello"
                };
            }, 500);
        });
    });
});
