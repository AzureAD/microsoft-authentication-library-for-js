/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import chai from "chai";
import "mocha";
import chaiAsPromised from "chai-as-promised";
import sinon from "sinon";
import { PkceCodes, NetworkRequestOptions, LogLevel, AccountInfo, AuthorityFactory, AuthorizationCodeRequest, Constants, AuthenticationResult, AuthorizationCodeClient, AuthenticationScheme, ProtocolMode, Logger, Authority, ClientConfiguration, AuthorizationCodePayload } from "@azure/msal-common";
import { Configuration, buildConfiguration, DEFAULT_REDIRECT_TIMEOUT_MS } from "../../src/config/Configuration";
import { TEST_CONFIG, TEST_URIS, TEST_TOKENS, TEST_DATA_CLIENT_INFO, RANDOM_TEST_GUID, TEST_HASHES, TEST_TOKEN_LIFETIMES, TEST_POP_VALUES, TEST_STATE_VALUES } from "../utils/StringConstants";
import { RedirectHandler } from "../../src/interaction_handler/RedirectHandler";
import { BrowserAuthErrorMessage, BrowserAuthError } from "../../src/error/BrowserAuthError";
import { BrowserUtils } from "../../src/utils/BrowserUtils";
import { BrowserConstants, TemporaryCacheKeys } from "../../src/utils/BrowserConstants";
import { CryptoOps } from "../../src/crypto/CryptoOps";
import { DatabaseStorage } from "../../src/cache/DatabaseStorage";
import { BrowserCacheManager } from "../../src/cache/BrowserCacheManager";

chai.use(chaiAsPromised);
const expect = chai.expect;

const testPkceCodes = {
    challenge: "TestChallenge",
    verifier: "TestVerifier"
} as PkceCodes;

const defaultTokenRequest: AuthorizationCodeRequest = {
    authenticationScheme: AuthenticationScheme.BEARER,
    redirectUri: `${TEST_URIS.DEFAULT_INSTANCE}/`,
    code: "thisIsATestCode",
    scopes: TEST_CONFIG.DEFAULT_SCOPES,
    codeVerifier: TEST_CONFIG.TEST_VERIFIER,
    authority: `${Constants.DEFAULT_AUTHORITY}/`,
    correlationId: RANDOM_TEST_GUID
};

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

let authorityInstance: Authority;
let authConfig: ClientConfiguration;

describe("RedirectHandler.ts Unit Tests", () => {
    let authCodeModule: AuthorizationCodeClient;
    let browserStorage: BrowserCacheManager;
    beforeEach(() => {
        const appConfig: Configuration = {
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID
            }
        };
        const configObj = buildConfiguration(appConfig, true);
        authorityInstance = AuthorityFactory.createInstance(configObj.auth.authority, networkInterface, ProtocolMode.AAD);
        const browserCrypto = new CryptoOps();
        const loggerConfig = {
            loggerCallback: (
                level: LogLevel,
                message: string,
                containsPii: boolean
            ): void => {},
            piiLoggingEnabled: true,
        };
        const logger = new Logger(loggerConfig);
        browserStorage = new BrowserCacheManager(TEST_CONFIG.MSAL_CLIENT_ID, configObj.cache, browserCrypto, logger);
        authConfig = {
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
            loggerOptions: loggerConfig,
        };        
        authCodeModule = new AuthorizationCodeClient(authConfig);
    });

    afterEach(() => {
        sinon.restore();
    });

    describe("Constructor", () => {

        it("creates a subclass of InteractionHandler called RedirectHandler", () => {
            const redirectHandler = new RedirectHandler(authCodeModule, browserStorage, defaultTokenRequest, browserCrypto);
            expect(redirectHandler instanceof RedirectHandler).to.be.true;
        });
    });

    describe("initiateAuthRequest()", () => {

        it("throws error if requestUrl is empty", () => {
            const redirectHandler = new RedirectHandler(authCodeModule, browserStorage, defaultTokenRequest, browserCrypto);
            expect(() => redirectHandler.initiateAuthRequest("", {
                redirectTimeout: 3000,
                redirectStartPage: ""
            })).to.throw(BrowserAuthErrorMessage.emptyNavigateUriError.desc);
            expect(() => redirectHandler.initiateAuthRequest("", {
                redirectTimeout: 3000,
                redirectStartPage: ""
            })).to.throw(BrowserAuthError);

            expect(() => redirectHandler.initiateAuthRequest(null, {
                redirectTimeout: 3000,
                redirectStartPage: ""
            })).to.throw(BrowserAuthErrorMessage.emptyNavigateUriError.desc);
            expect(() => redirectHandler.initiateAuthRequest(null, {
                redirectTimeout: 3000,
                redirectStartPage: ""
            })).to.throw(BrowserAuthError);
        });

        it("navigates browser window to given window location", (done) => {
            let dbStorage = {};
            sinon.stub(DatabaseStorage.prototype, "open").callsFake(async (): Promise<void> => {
                dbStorage = {};
            });
            sinon.stub(BrowserUtils, "navigateWindow").callsFake((requestUrl, timeout, logger) => {
                expect(requestUrl).to.be.eq(TEST_URIS.TEST_ALTERNATE_REDIR_URI);
                expect(timeout).to.be.eq(3000);
                expect(logger).to.be.instanceOf(Logger);
                expect(browserStorage.getTemporaryCache(TemporaryCacheKeys.INTERACTION_STATUS_KEY, true)).to.be.eq(BrowserConstants.INTERACTION_IN_PROGRESS_VALUE);
                return Promise.resolve(done());
            });
            const redirectHandler = new RedirectHandler(authCodeModule, browserStorage, defaultTokenRequest, browserCrypto);
            redirectHandler.initiateAuthRequest(TEST_URIS.TEST_ALTERNATE_REDIR_URI, {
                redirectStartPage: "",
                redirectTimeout: 3000
            });
        });

        it("doesnt navigate if onRedirectNavigate returns false", done => {
            let dbStorage = {};
            sinon.stub(DatabaseStorage.prototype, "open").callsFake(async (): Promise<void> => {
                dbStorage = {};
            });
            sinon.stub(BrowserUtils, "navigateWindow").callsFake((requestUrl, timeout, logger) => {
                done("Navigatation should not happen if onRedirectNavigate returns false");
                return Promise.reject();
            });

            const onRedirectNavigate = url => {
                expect(url).to.equal(TEST_URIS.TEST_ALTERNATE_REDIR_URI);
                done();
                return false;
            }
            const redirectHandler = new RedirectHandler(authCodeModule, browserStorage, defaultTokenRequest, browserCrypto);
            redirectHandler.initiateAuthRequest(TEST_URIS.TEST_ALTERNATE_REDIR_URI, {
                redirectTimeout: 300,
                redirectStartPage: "",
                onRedirectNavigate,
            });
        });

        it("navigates if onRedirectNavigate doesnt return false", done => {
            let dbStorage = {};
            sinon.stub(DatabaseStorage.prototype, "open").callsFake(async (): Promise<void> => {
                dbStorage = {};
            });
            sinon.stub(BrowserUtils, "navigateWindow").callsFake((requestUrl, timeout, logger) => {
                expect(requestUrl).to.equal(TEST_URIS.TEST_ALTERNATE_REDIR_URI);
                done();
                return Promise.resolve();
            });

            const onRedirectNavigate = url => {
                expect(url).to.equal(TEST_URIS.TEST_ALTERNATE_REDIR_URI);
            }
            const redirectHandler = new RedirectHandler(authCodeModule, browserStorage, defaultTokenRequest, browserCrypto);
            redirectHandler.initiateAuthRequest(TEST_URIS.TEST_ALTERNATE_REDIR_URI, {
                redirectTimeout: 3000,
                redirectStartPage: "",
                onRedirectNavigate
            });
        });
    });

    describe("handleCodeResponse()", () => {

        it("throws error if given hash is empty", async () => {
            const redirectHandler = new RedirectHandler(authCodeModule, browserStorage, defaultTokenRequest, browserCrypto);
            await expect(redirectHandler.handleCodeResponse("", "", authorityInstance, authConfig.networkInterface)).to.be.rejectedWith(BrowserAuthErrorMessage.hashEmptyError.desc);
            await expect(redirectHandler.handleCodeResponse("", "", authorityInstance, authConfig.networkInterface)).to.be.rejectedWith(BrowserAuthError);

            await expect(redirectHandler.handleCodeResponse(null, "", authorityInstance, authConfig.networkInterface)).to.be.rejectedWith(BrowserAuthErrorMessage.hashEmptyError.desc);
            await expect(redirectHandler.handleCodeResponse(null, "", authorityInstance, authConfig.networkInterface)).to.be.rejectedWith(BrowserAuthError);
        });

        it("successfully handles response", async () => {
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

            const testCodeResponse: AuthorizationCodePayload = {
                code: "authcode",
                nonce: idTokenClaims.nonce,
                state: TEST_STATE_VALUES.TEST_STATE_REDIRECT
            };

            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID_ENCODED,
                environment: "login.windows.net",
                tenantId: idTokenClaims.tid,
                username: idTokenClaims.preferred_username
            };
            const testTokenResponse: AuthenticationResult = {
                authority: authorityInstance.canonicalAuthority,
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

            const testAuthCodeRequest: AuthorizationCodeRequest = {
                authenticationScheme: AuthenticationScheme.BEARER,
                redirectUri: TEST_URIS.TEST_REDIR_URI,
                scopes: ["scope1", "scope2"],
                code: "",
                authority: authorityInstance.canonicalAuthority,
                correlationId: RANDOM_TEST_GUID
            };
            browserStorage.setTemporaryCache(browserStorage.generateStateKey(TEST_STATE_VALUES.TEST_STATE_REDIRECT), TEST_STATE_VALUES.TEST_STATE_REDIRECT);
            browserStorage.setTemporaryCache(browserStorage.generateCacheKey(TemporaryCacheKeys.REQUEST_PARAMS), browserCrypto.base64Encode(JSON.stringify(testAuthCodeRequest)));
            browserStorage.setTemporaryCache(browserStorage.generateCacheKey(TemporaryCacheKeys.INTERACTION_STATUS_KEY), BrowserConstants.INTERACTION_IN_PROGRESS_VALUE);
            browserStorage.setTemporaryCache(browserStorage.generateCacheKey(TemporaryCacheKeys.URL_HASH), TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT);
            sinon.stub(AuthorizationCodeClient.prototype, "handleFragmentResponse").returns(testCodeResponse);
            sinon.stub(AuthorizationCodeClient.prototype, "acquireToken").resolves(testTokenResponse);

            const redirectHandler = new RedirectHandler(authCodeModule, browserStorage, testAuthCodeRequest, browserCrypto);
            const tokenResponse = await redirectHandler.handleCodeResponse(TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT, TEST_STATE_VALUES.TEST_STATE_REDIRECT, authorityInstance, authConfig.networkInterface);
            expect(tokenResponse).to.deep.eq(testTokenResponse);
            expect(browserStorage.getTemporaryCache(browserStorage.generateCacheKey(TemporaryCacheKeys.INTERACTION_STATUS_KEY))).to.be.null;
            expect(browserStorage.getTemporaryCache(browserStorage.generateCacheKey(TemporaryCacheKeys.URL_HASH))).to.be.null;
        });
    });
});
