import chai from "chai";
import chaiAsPromised from "chai-as-promised"
chai.use(chaiAsPromised);
const expect = chai.expect;
import { PkceCodes, AuthorizationCodeModule, NetworkRequestOptions, LogLevel, Account, TokenResponse, CodeResponse } from "@azure/msal-common";
import { PopupHandler } from "../../src/interaction_handler/PopupHandler";
import { BrowserStorage } from "../../src/cache/BrowserStorage";
import { Configuration, buildConfiguration } from "../../src/app/Configuration";
import { TEST_CONFIG, TEST_TOKENS, TEST_TOKEN_LIFETIMES, TEST_DATA_CLIENT_INFO, TEST_URIS, RANDOM_TEST_GUID, TEST_HASHES } from "../utils/StringConstants";
import sinon from "sinon";
import { InteractionHandler } from "../../src/interaction_handler/InteractionHandler";
import { BrowserAuthErrorMessage, BrowserAuthError } from "../../src/error/BrowserAuthError";
import { BrowserConstants } from "../../src/utils/BrowserConstants";

const DEFAULT_POPUP_TIMEOUT_MS = 60000;
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


describe("PopupHandler.ts Unit Tests", () => {

    let browserStorage: BrowserStorage;
    let popupHandler: PopupHandler;
    beforeEach(() => {
        const appConfig: Configuration = {
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                tmp_clientSecret: "testSecret"
            }
        };
        const configObj = buildConfiguration(appConfig);
        const authCodeModule = new AuthorizationCodeModule({
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
        popupHandler = new PopupHandler(authCodeModule, browserStorage);
    });

    afterEach(() => {
        sinon.restore();
    });

    describe("Constructor", () => {

        it("creates a valid PopupHandler", () => {
            expect(popupHandler instanceof PopupHandler).to.be.true;
            expect(popupHandler instanceof InteractionHandler).to.be.true;
        });
    });

    describe("showUI()", () => {

        it("throws error if request uri is empty", () => {
            expect(() => popupHandler.showUI("")).to.throw(BrowserAuthErrorMessage.emptyNavigateUriError.desc);
            expect(() => popupHandler.showUI("")).to.throw(BrowserAuthError);

            expect(() => popupHandler.showUI(null)).to.throw(BrowserAuthErrorMessage.emptyNavigateUriError.desc);
            expect(() => popupHandler.showUI(null)).to.throw(BrowserAuthError);
        });

        it("opens a popup window", () => {
            // sinon.stub(window, "open").returns(window);
            window.focus = (): void => {
                return;
            };

            window.open = (url?: string, target?: string, features?: string, replace?: boolean): Window => {
                return window;
            };

            const popupWindow = popupHandler.showUI(TEST_URIS.ALTERNATE_INSTANCE);
            expect(browserStorage.getItem(BrowserConstants.INTERACTION_STATUS_KEY)).to.be.eq(BrowserConstants.INTERACTION_IN_PROGRESS_VALUE);
        });
    });

    describe("handleCodeResponse()", () => {

        it("throws error if given location hash is empty", async () => {
            await expect(popupHandler.handleCodeResponse("")).to.be.rejectedWith(BrowserAuthErrorMessage.hashEmptyError.desc);
            await expect(popupHandler.handleCodeResponse("")).to.be.rejectedWith(BrowserAuthError);

            await expect(popupHandler.handleCodeResponse(null)).to.be.rejectedWith(BrowserAuthErrorMessage.hashEmptyError.desc);
            await expect(popupHandler.handleCodeResponse(null)).to.be.rejectedWith(BrowserAuthError);
        });

        it("successfully handles response", async () => {
            const testCodeResponse: CodeResponse = {
                code: "testAuthCode",
                userRequestState: `${RANDOM_TEST_GUID}|testState`
            };
            const idTokenClaims = {
                "ver": "2.0",
                "iss": `${TEST_URIS.DEFAULT_INSTANCE}9188040d-6c67-4c5b-b112-36a304b66dad/v2.0`,
                "sub": "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
                "exp": "1536361411",
                "name": "Abe Lincoln",
                "preferred_username": "AbeLi@microsoft.com",
                "oid": "00000000-0000-0000-66f3-3332eca7ea81",
                "tid": "3338040d-6c67-4c5b-b112-36a304b66dad",
                "nonce": "123523"
            };

            const testAccount = new Account(idTokenClaims.oid, TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID, idTokenClaims, TEST_TOKENS.IDTOKEN_V2);
            const testTokenResponse: TokenResponse = {
                accessToken: TEST_TOKENS.ACCESS_TOKEN,
                idToken: TEST_TOKENS.IDTOKEN_V2,
                scopes: ["scope1", "scope2"],
                refreshToken: TEST_TOKENS.REFRESH_TOKEN,
                account: testAccount,
                expiresOn: new Date(Date.now() + (TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN * 1000)),
                idTokenClaims: idTokenClaims,
                tenantId: idTokenClaims.tid,
                tokenType: "Bearer",
                uniqueId: idTokenClaims.oid,
                userRequestState: "testState"
            };
            sinon.stub(AuthorizationCodeModule.prototype, "handleFragmentResponse").returns(testCodeResponse);
            sinon.stub(AuthorizationCodeModule.prototype, "acquireToken").resolves(testTokenResponse);
            
            const tokenResponse = await popupHandler.handleCodeResponse(TEST_HASHES.TEST_SUCCESS_CODE_HASH);
            expect(tokenResponse).to.deep.eq(testTokenResponse);
        });
    });
});
