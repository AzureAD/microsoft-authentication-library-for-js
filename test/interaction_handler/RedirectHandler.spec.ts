import chai from "chai";
import chaiAsPromised from "chai-as-promised"
chai.use(chaiAsPromised);
const expect = chai.expect;
import { Configuration, buildConfiguration } from "../../src/app/Configuration";
import { AuthorizationCodeModule, PkceCodes, NetworkRequestOptions, LogLevel, TemporaryCacheKeys, CodeResponse, TokenResponse, Account } from "@azure/msal-common";
import { TEST_CONFIG, TEST_URIS, TEST_TOKENS, TEST_DATA_CLIENT_INFO, RANDOM_TEST_GUID, TEST_HASHES, TEST_TOKEN_LIFETIMES } from "../utils/StringConstants";
import { BrowserStorage } from "../../src/cache/BrowserStorage";
import { RedirectHandler } from "../../src/interaction_handler/RedirectHandler";
import { InteractionHandler } from "../../src/interaction_handler/InteractionHandler";
import { BrowserAuthErrorMessage, BrowserAuthError } from "../../src/error/BrowserAuthError";
import { BrowserUtils } from "../../src/utils/BrowserUtils";
import sinon from "sinon";
import { BrowserConstants } from "../../src/utils/BrowserConstants";

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

describe("RedirectHandler.ts Unit Tests", () => {

    let browserStorage: BrowserStorage;
    let redirectHandler: RedirectHandler;
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
        redirectHandler = new RedirectHandler(authCodeModule, browserStorage);
    });

    afterEach(() => {
        sinon.restore();
    });

    describe("Constructor", () => {

        it("creates a subclass of InteractionHandler called RedirectHandler", () => {
            expect(redirectHandler instanceof RedirectHandler).to.be.true;
            expect(redirectHandler instanceof InteractionHandler).to.be.true;
        });
    });

    describe("showUI()", () => {

        it("throws error if requestUrl is empty", () => {
            expect(() => redirectHandler.showUI("")).to.throw(BrowserAuthErrorMessage.emptyNavigateUriError.desc);
            expect(() => redirectHandler.showUI("")).to.throw(BrowserAuthError);

            expect(() => redirectHandler.showUI(null)).to.throw(BrowserAuthErrorMessage.emptyNavigateUriError.desc);
            expect(() => redirectHandler.showUI(null)).to.throw(BrowserAuthError);
        });

        it("throws error if we are not in top frame", () => {
            sinon.stub(BrowserUtils, "isInIframe").returns(true);
            expect(() => redirectHandler.showUI(TEST_URIS.TEST_ALTERNATE_REDIR_URI)).to.throw(BrowserAuthErrorMessage.redirectInIframeError.desc);
            expect(() => redirectHandler.showUI(TEST_URIS.TEST_ALTERNATE_REDIR_URI)).to.throw(BrowserAuthError);
        });

        it("navigates browser window to given window location", () => {
            sinon.stub(BrowserUtils, "navigateWindow").callsFake((requestUrl) => {
                expect(requestUrl).to.be.eq(TEST_URIS.TEST_ALTERNATE_REDIR_URI);
            });
            const windowObj = redirectHandler.showUI(TEST_URIS.TEST_ALTERNATE_REDIR_URI);
            expect(window).to.be.eq(windowObj);
            expect(browserStorage.getItem(TemporaryCacheKeys.ORIGIN_URI)).to.be.eq(TEST_URIS.TEST_REDIR_URI);
            expect(browserStorage.getItem(BrowserConstants.INTERACTION_STATUS_KEY)).to.be.eq(BrowserConstants.INTERACTION_IN_PROGRESS_VALUE);
        });
    });

    describe("handleCodeResponse()", () => {

        it("throws error if given hash is empty", async () => {
            await expect(redirectHandler.handleCodeResponse("")).to.be.rejectedWith(BrowserAuthErrorMessage.hashEmptyError.desc);
            await expect(redirectHandler.handleCodeResponse("")).to.be.rejectedWith(BrowserAuthError);

            await expect(redirectHandler.handleCodeResponse(null)).to.be.rejectedWith(BrowserAuthErrorMessage.hashEmptyError.desc);
            await expect(redirectHandler.handleCodeResponse(null)).to.be.rejectedWith(BrowserAuthError);
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
            browserStorage.setItem(BrowserConstants.INTERACTION_STATUS_KEY, BrowserConstants.INTERACTION_IN_PROGRESS_VALUE);
            browserStorage.setItem(TemporaryCacheKeys.URL_HASH, TEST_HASHES.TEST_SUCCESS_CODE_HASH);
            sinon.stub(AuthorizationCodeModule.prototype, "handleFragmentResponse").returns(testCodeResponse);
            sinon.stub(AuthorizationCodeModule.prototype, "acquireToken").resolves(testTokenResponse);
            
            const tokenResponse = await redirectHandler.handleCodeResponse(TEST_HASHES.TEST_SUCCESS_CODE_HASH);
            expect(tokenResponse).to.deep.eq(testTokenResponse);
            expect(browserStorage.getItem(BrowserConstants.INTERACTION_STATUS_KEY)).to.be.null;
            expect(browserStorage.getItem(TemporaryCacheKeys.URL_HASH)).to.be.null;
        });
    });
});
