import chai from "chai";
import chaiAsPromised from "chai-as-promised"
chai.use(chaiAsPromised);
const expect = chai.expect;
import { PkceCodes, AuthorizationCodeModule, NetworkRequestOptions, LogLevel } from "@azure/msal-common";
import sinon from "sinon";
import { SilentHandler } from "../../src/interaction_handler/SilentHandler";
import { BrowserStorage } from "../../src/cache/BrowserStorage";
import { Configuration, buildConfiguration } from "../../src/app/Configuration";
import { TEST_CONFIG, testNavUrl } from "../utils/StringConstants";
import { InteractionHandler } from "../../src/interaction_handler/InteractionHandler";
import { BrowserAuthError, BrowserAuthErrorMessage } from "../../src/error/BrowserAuthError";

const DEFAULT_IFRAME_TIMEOUT_MS = 6000;
const clearFunc = (): void => {
    return;
};

const removeFunc = (key: string): void => {
    return;
};

const setFunc = (key: string, value: string): void => {
    return;
};

const testPkceCodes = {
    challenge: "TestChallenge",
    verifier: "TestVerifier"
} as PkceCodes;

const testNetworkResult = {
    testParam: "testValue"
};

const testKeySet = ["testKey1", "testKey2"];

describe("SilentHandler.ts Unit Tests", () => {

    let browserStorage: BrowserStorage;
    let silentHandler: SilentHandler;
    let authCodeModule: AuthorizationCodeModule;
    beforeEach(() => {
        const appConfig: Configuration = {
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID
            }
        };
        const configObj = buildConfiguration(appConfig);
        authCodeModule = new AuthorizationCodeModule({
            auth: configObj.auth,
            systemOptions: {
                tokenRenewalOffsetSeconds: configObj.system.tokenRenewalOffsetSeconds,
                telemetry: configObj.system.telemetry
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
                }
            },
            storageInterface: {
                clear: clearFunc,
                containsKey: (key: string): boolean => {
                    return true;
                },
                getItem: (key: string): string => {
                    return "cacheItem";
                },
                getKeys: (): string[] => {
                    return testKeySet;
                },
                removeItem: removeFunc,
                setItem: setFunc
            },
            networkInterface: {
                sendGetRequestAsync: async (url: string, options?: NetworkRequestOptions): Promise<any> => {
                    return testNetworkResult;
                },
                sendPostRequestAsync: async (url: string, options?: NetworkRequestOptions): Promise<any> => {
                    return testNetworkResult;
                }
            },
            loggerOptions: {
                loggerCallback: (level: LogLevel, message: string, containsPii: boolean): void => {
                    if (containsPii) {
                        console.log(`Log level: ${level} Message: ${message}`);
                    }
                },
                piiLoggingEnabled: true
            }
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

    describe.only("initiateAuthRequest()", () => {
        
        it("throws error if requestUrl is empty", async () => {
            await expect(silentHandler.initiateAuthRequest("")).to.be.rejectedWith(BrowserAuthErrorMessage.emptyNavigateUriError.desc);
            await expect(silentHandler.initiateAuthRequest("")).to.be.rejectedWith(BrowserAuthError);

            await expect(silentHandler.initiateAuthRequest(null)).to.be.rejectedWith(BrowserAuthErrorMessage.emptyNavigateUriError.desc);
            await expect(silentHandler.initiateAuthRequest(null)).to.be.rejectedWith(BrowserAuthError);
        });

        it("Creates a frame synchronously when created with default timeout", async () => {
            silentHandler = new SilentHandler(authCodeModule, browserStorage, 0);
            const loadFrameSyncSpy = sinon.spy(silentHandler, <any>"loadFrameSync");
            const loadFrameSpy = sinon.spy(silentHandler, <any>"loadFrame");
            const authFrame = await silentHandler.initiateAuthRequest(testNavUrl);
            expect(loadFrameSyncSpy.calledOnce).to.be.true;
            expect(loadFrameSpy.called).to.be.false;
            expect(authFrame instanceof HTMLIFrameElement).to.be.true;
            expect(authFrame.id).to.be.eq("msalTokenFrame");
        });

        it("Creates a frame synchronously when created with a timeout of 0", async () => {
            silentHandler = new SilentHandler(authCodeModule, browserStorage, 0);
            const loadFrameSyncSpy = sinon.spy(silentHandler, <any>"loadFrameSync");
            const loadFrameSpy = sinon.spy(silentHandler, <any>"loadFrame");
            const authFrame = await silentHandler.initiateAuthRequest(testNavUrl);
            expect(loadFrameSyncSpy.calledOnce).to.be.true;
            expect(loadFrameSpy.called).to.be.false;
            expect(authFrame instanceof HTMLIFrameElement).to.be.true;
            expect(authFrame.id).to.be.eq("msalTokenFrame");
        });
    });
});
