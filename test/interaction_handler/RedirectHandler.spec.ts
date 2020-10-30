/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import chai from "chai";
import "mocha";
import chaiAsPromised from "chai-as-promised";
import sinon from "sinon";
import { Configuration, buildConfiguration } from "../../src/config/Configuration";
import { PkceCodes, NetworkRequestOptions, LogLevel, AccountInfo, AuthorityFactory, CommonAuthorizationCodeRequest, Constants, AuthenticationResult, CacheSchemaType, AuthorizationCodeClient, AuthenticationScheme, ProtocolMode, Logger } from "@azure/msal-common";
import { TEST_CONFIG, TEST_URIS, TEST_TOKENS, TEST_DATA_CLIENT_INFO, RANDOM_TEST_GUID, TEST_HASHES, TEST_TOKEN_LIFETIMES, TEST_POP_VALUES, TEST_STATE_VALUES } from "../utils/StringConstants";
import { BrowserStorage } from "../../src/cache/BrowserStorage";
import { RedirectHandler } from "../../src/interaction_handler/RedirectHandler";
import { BrowserAuthErrorMessage, BrowserAuthError } from "../../src/error/BrowserAuthError";
import { BrowserUtils } from "../../src/utils/BrowserUtils";
import { BrowserConstants, TemporaryCacheKeys } from "../../src/utils/BrowserConstants";
import { CryptoOps } from "../../src/crypto/CryptoOps";
import { DatabaseStorage } from "../../src/cache/DatabaseStorage";

chai.use(chaiAsPromised);
const expect = chai.expect;

const testPkceCodes = {
    challenge: "TestChallenge",
    verifier: "TestVerifier"
} as PkceCodes;

const testNetworkResult = {
    testParam: "testValue"
};

const browserCrypto = new CryptoOps();

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

describe("RedirectHandler.ts Unit Tests", () => {

    let browserStorage: BrowserStorage;
    let redirectHandler: RedirectHandler;
    beforeEach(() => {
        const appConfig: Configuration = {
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID
            }
        };
        const configObj = buildConfiguration(appConfig);
        const authorityInstance = AuthorityFactory.createInstance(configObj.auth.authority, networkInterface, ProtocolMode.AAD);
        const browserCrypto = new CryptoOps();

        browserStorage = new BrowserStorage(TEST_CONFIG.MSAL_CLIENT_ID, configObj.cache, browserCrypto);
        const authCodeModule = new AuthorizationCodeClient({
            authOptions: {
                ...configObj.auth,
                authority: authorityInstance,
            },
            systemOptions: {
                tokenRenewalOffsetSeconds:
                    configObj.system.tokenRenewalOffsetSeconds,
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
            storageInterface: browserStorage,
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
        
        redirectHandler = new RedirectHandler(authCodeModule, browserStorage, browserCrypto);
    });

    afterEach(() => {
        sinon.restore();
    });

    describe("Constructor", () => {

        it("creates a subclass of InteractionHandler called RedirectHandler", () => {
            expect(redirectHandler instanceof RedirectHandler).to.be.true;
        });
    });

    describe("initiateAuthRequest()", () => {

        it("throws error if requestUrl is empty", () => {
            const testTokenReq: CommonAuthorizationCodeRequest = {
                redirectUri: `${TEST_URIS.DEFAULT_INSTANCE}/`,
                code: "thisIsATestCode",
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                codeVerifier: TEST_CONFIG.TEST_VERIFIER,
                authority: `${Constants.DEFAULT_AUTHORITY}/`,
                correlationId: RANDOM_TEST_GUID
            };
            expect(() => redirectHandler.initiateAuthRequest("", testTokenReq, 3000)).to.throw(BrowserAuthErrorMessage.emptyNavigateUriError.desc);
            expect(() => redirectHandler.initiateAuthRequest("", testTokenReq, 3000)).to.throw(BrowserAuthError);

            expect(() => redirectHandler.initiateAuthRequest(null, testTokenReq, 3000)).to.throw(BrowserAuthErrorMessage.emptyNavigateUriError.desc);
            expect(() => redirectHandler.initiateAuthRequest(null, testTokenReq, 3000)).to.throw(BrowserAuthError);
        });

        it("throws error if we are not in top frame", () => {
            const testTokenReq: CommonAuthorizationCodeRequest = {
                redirectUri: `${TEST_URIS.DEFAULT_INSTANCE}/`,
                code: "thisIsATestCode",
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                codeVerifier: TEST_CONFIG.TEST_VERIFIER,
                authority: `${Constants.DEFAULT_AUTHORITY}/`,
                correlationId: RANDOM_TEST_GUID
            };
            let dbStorage = {};
            sinon.stub(DatabaseStorage.prototype, "open").callsFake(async (): Promise<void> => {
                dbStorage = {};
            });
            const browserCrypto = new CryptoOps();
            sinon.stub(BrowserUtils, "isInIframe").returns(true);
            expect(() => redirectHandler.initiateAuthRequest(TEST_URIS.TEST_ALTERNATE_REDIR_URI, testTokenReq, "", browserCrypto)).to.throw(BrowserAuthErrorMessage.redirectInIframeError.desc);
            expect(() => redirectHandler.initiateAuthRequest(TEST_URIS.TEST_ALTERNATE_REDIR_URI, testTokenReq, "", browserCrypto)).to.throw(BrowserAuthError);
        });

        it("navigates browser window to given window location", (done) => {
            let dbStorage = {};
            sinon.stub(DatabaseStorage.prototype, "open").callsFake(async (): Promise<void> => {
                dbStorage = {};
            });
            const testTokenReq: CommonAuthorizationCodeRequest = {
                redirectUri: `${TEST_URIS.DEFAULT_INSTANCE}/`,
                code: "thisIsATestCode",
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                codeVerifier: TEST_CONFIG.TEST_VERIFIER,
                authority: `${Constants.DEFAULT_AUTHORITY}/`,
                correlationId: RANDOM_TEST_GUID
            };
            sinon.stub(BrowserUtils, "navigateWindow").callsFake((requestUrl, timeout, logger) => {
                expect(requestUrl).to.be.eq(TEST_URIS.TEST_ALTERNATE_REDIR_URI);
                expect(timeout).to.be.eq(3000);
                expect(logger).to.be.instanceOf(Logger);
                expect(browserStorage.getItem(browserStorage.generateCacheKey(BrowserConstants.INTERACTION_STATUS_KEY), CacheSchemaType.TEMPORARY)).to.be.eq(BrowserConstants.INTERACTION_IN_PROGRESS_VALUE);
                return Promise.resolve(done());
            });
            redirectHandler.initiateAuthRequest(TEST_URIS.TEST_ALTERNATE_REDIR_URI, testTokenReq, 3000);
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
            const testCodeResponse = "testAuthCode";
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

            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                environment: "login.windows.net",
                tenantId: idTokenClaims.tid,
                username: idTokenClaims.preferred_username
            };
            const testTokenResponse: AuthenticationResult = {
                accessToken: TEST_TOKENS.ACCESS_TOKEN,
                idToken: TEST_TOKENS.IDTOKEN_V2,
                fromCache: false,
                scopes: ["scope1", "scope2"],
                account: testAccount,
                expiresOn: new Date(Date.now() + (TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN * 1000)),
                idTokenClaims: idTokenClaims,
                tenantId: idTokenClaims.tid,
                uniqueId: idTokenClaims.oid,
                tokenType: AuthenticationScheme.BEARER
            };
            let dbStorage = {};
            sinon.stub(DatabaseStorage.prototype, "open").callsFake(async (): Promise<void> => {
                dbStorage = {};
            });

            const testAuthCodeRequest: CommonAuthorizationCodeRequest = {
                redirectUri: TEST_URIS.TEST_REDIR_URI,
                scopes: ["scope1", "scope2"],
                code: ""
            };
            browserStorage.setItem(browserStorage.generateStateKey(TEST_STATE_VALUES.TEST_STATE), TEST_STATE_VALUES.TEST_STATE, CacheSchemaType.TEMPORARY);
            browserStorage.setItem(browserStorage.generateCacheKey(TemporaryCacheKeys.REQUEST_PARAMS), browserCrypto.base64Encode(JSON.stringify(testAuthCodeRequest)), CacheSchemaType.TEMPORARY);
            browserStorage.setItem(browserStorage.generateCacheKey(BrowserConstants.INTERACTION_STATUS_KEY), BrowserConstants.INTERACTION_IN_PROGRESS_VALUE, CacheSchemaType.TEMPORARY);
            browserStorage.setItem(browserStorage.generateCacheKey(TemporaryCacheKeys.URL_HASH), TEST_HASHES.TEST_SUCCESS_CODE_HASH, CacheSchemaType.TEMPORARY);
            sinon.stub(AuthorizationCodeClient.prototype, "handleFragmentResponse").returns(testCodeResponse);
            sinon.stub(AuthorizationCodeClient.prototype, "acquireToken").resolves(testTokenResponse);

            const tokenResponse = await redirectHandler.handleCodeResponse(TEST_HASHES.TEST_SUCCESS_CODE_HASH);
            expect(tokenResponse).to.deep.eq(testTokenResponse);
            expect(browserStorage.getItem(browserStorage.generateCacheKey(BrowserConstants.INTERACTION_STATUS_KEY), CacheSchemaType.TEMPORARY)).to.be.null;
            expect(browserStorage.getItem(browserStorage.generateCacheKey(TemporaryCacheKeys.URL_HASH), CacheSchemaType.TEMPORARY)).to.be.null;
        });
    });
});
