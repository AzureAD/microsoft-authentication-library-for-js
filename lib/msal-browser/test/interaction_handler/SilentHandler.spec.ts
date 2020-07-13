import chai from "chai";
import chaiAsPromised from "chai-as-promised"
chai.use(chaiAsPromised);
const expect = chai.expect;
import { PkceCodes, NetworkRequestOptions, LogLevel, AuthorityFactory, AuthorizationCodeRequest, Constants, CacheManager, AuthorizationCodeClient } from "@azure/msal-common";
import sinon from "sinon";
import { SilentHandler } from "../../src/interaction_handler/SilentHandler";
import { BrowserStorage } from "../../src/cache/BrowserStorage";
import { Configuration, buildConfiguration } from "../../src/config/Configuration";
import { TEST_CONFIG, testNavUrl, TEST_URIS, RANDOM_TEST_GUID } from "../utils/StringConstants";
import { InteractionHandler } from "../../src/interaction_handler/InteractionHandler";
import { BrowserAuthError, BrowserAuthErrorMessage } from "../../src/error/BrowserAuthError";

const DEFAULT_IFRAME_TIMEOUT_MS = 6000;
class TestStorageInterface extends CacheManager {
    setItem(key: string, value: string | object, type?: string): void {
        return;
    }
    getItem(key: string, type?: string): string | object {
        return "cacheItem";
    }
    removeItem(key: string, type?: string): boolean {
        return true;
    }
    containsKey(key: string, type?: string): boolean {
        return true;
    }
    getKeys(): string[] {
        return testKeySet;
    }
    clear(): void {
        return;
    }
}

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
                    configObj.system.tokenRenewalOffsetSeconds,
                telemetry: configObj.system.telemetry,
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
            },
            storageInterface: new TestStorageInterface(),
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
        browserStorage = new BrowserStorage(TEST_CONFIG.MSAL_CLIENT_ID, configObj.cache);
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
			const testTokenReq: AuthorizationCodeRequest = {
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
			const testTokenReq: AuthorizationCodeRequest = {
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
            expect(authFrame.id).to.be.eq("msalTokenFrame");
        }).timeout(DEFAULT_IFRAME_TIMEOUT_MS + 1000);

        it("Creates a frame synchronously when created with a timeout of 0", async () => {
			const testTokenReq: AuthorizationCodeRequest = {
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
            expect(authFrame.id).to.be.eq("msalTokenFrame");
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
