/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import sinon from "sinon";
import { PkceCodes, NetworkRequestOptions, LogLevel, AccountInfo, AuthorityFactory, CommonAuthorizationCodeRequest, Constants, AuthenticationResult, AuthorizationCodeClient, AuthenticationScheme, ProtocolMode, Logger, Authority, ClientConfiguration, AuthorizationCodePayload, AuthorityOptions, CcsCredential, CcsCredentialType } from "@azure/msal-common";
import { Configuration, buildConfiguration } from "../../src/config/Configuration";
import { TEST_CONFIG, TEST_URIS, TEST_TOKENS, TEST_DATA_CLIENT_INFO, RANDOM_TEST_GUID, TEST_HASHES, TEST_TOKEN_LIFETIMES, TEST_POP_VALUES, TEST_STATE_VALUES, TEST_CRYPTO_VALUES } from "../utils/StringConstants";
import { RedirectHandler } from "../../src/interaction_handler/RedirectHandler";
import { BrowserAuthErrorMessage, BrowserAuthError } from "../../src/error/BrowserAuthError";
import { BrowserConstants, TemporaryCacheKeys } from "../../src/utils/BrowserConstants";
import { CryptoOps } from "../../src/crypto/CryptoOps";
import { DatabaseStorage } from "../../src/cache/DatabaseStorage";
import { BrowserCacheManager } from "../../src/cache/BrowserCacheManager";
import { NavigationClient } from "../../src/navigation/NavigationClient";
import { NavigationOptions } from "../../src/navigation/NavigationOptions";

const testPkceCodes = {
    challenge: "TestChallenge",
    verifier: "TestVerifier"
} as PkceCodes;

const defaultTokenRequest: CommonAuthorizationCodeRequest = {
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

let browserCrypto: CryptoOps;

const networkInterface = {
    sendGetRequestAsync<T>(): T {
        return {} as T;
    },
    sendPostRequestAsync<T>(): T {
        return {} as T;
    },
};

let authorityInstance: Authority;
let authConfig: ClientConfiguration;

describe("RedirectHandler.ts Unit Tests", () => {
    let authCodeModule: AuthorizationCodeClient;
    let browserStorage: BrowserCacheManager;
    let browserRequestLogger: Logger;
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
        authorityInstance = AuthorityFactory.createInstance(configObj.auth.authority, networkInterface, browserStorage, authorityOptions);
        const loggerConfig = {
            loggerCallback: (
                level: LogLevel,
                message: string,
                containsPii: boolean
            ): void => {},
            piiLoggingEnabled: true,
        };
        const logger = new Logger(loggerConfig);
        browserCrypto = new CryptoOps(logger);
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
                },
                removeTokenBindingKey: async (): Promise<boolean> => {
                    return Promise.resolve(true);
                },
                clearKeystore: async (): Promise<boolean> => {
                    return Promise.resolve(true);
                },
                hashString: async (): Promise<string> => {
                    return Promise.resolve(TEST_CRYPTO_VALUES.TEST_SHA256_HASH);
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
        browserRequestLogger = new Logger(authConfig.loggerOptions!);
    });

    afterEach(() => {
        sinon.restore();
    });

    describe("Constructor", () => {

        it("creates a subclass of InteractionHandler called RedirectHandler", () => {
            const redirectHandler = new RedirectHandler(authCodeModule, browserStorage, defaultTokenRequest, browserRequestLogger, browserCrypto);
            expect(redirectHandler).toBeInstanceOf(RedirectHandler);
        });
    });

    describe("initiateAuthRequest()", () => {

        it("throws error if requestUrl is empty", (done) => {
            const navigationClient = new NavigationClient();
            const redirectHandler = new RedirectHandler(authCodeModule, browserStorage, defaultTokenRequest, browserRequestLogger, browserCrypto);

            redirectHandler.initiateAuthRequest("", {
                redirectTimeout: 3000,
                redirectStartPage: "",
                navigationClient
            }).catch(e => {
                expect(e).toBeInstanceOf(BrowserAuthError);
                expect(e.errorCode).toEqual(BrowserAuthErrorMessage.emptyNavigateUriError.code);
                expect(e.errorMessage).toEqual(BrowserAuthErrorMessage.emptyNavigateUriError.desc);
                done();
            });
        });

        it("navigates browser window to given window location", (done) => {
            let dbStorage = {};
            sinon.stub(DatabaseStorage.prototype, "open").callsFake(async (): Promise<void> => {
                dbStorage = {};
            });
            const navigationClient = new NavigationClient();
            navigationClient.navigateExternal = (requestUrl: string, options: NavigationOptions): Promise<boolean> => {
                expect(requestUrl).toEqual(TEST_URIS.TEST_ALTERNATE_REDIR_URI);
                expect(options.timeout).toEqual(3000);
                done();
                return Promise.resolve(true);
            };
            const redirectHandler = new RedirectHandler(authCodeModule, browserStorage, defaultTokenRequest, browserRequestLogger, browserCrypto);
            redirectHandler.initiateAuthRequest(TEST_URIS.TEST_ALTERNATE_REDIR_URI, {
                redirectStartPage: "",
                redirectTimeout: 3000,
                navigationClient
            });
        });

        it("doesnt navigate if onRedirectNavigate returns false", (done) => {
            let dbStorage = {};
            sinon.stub(DatabaseStorage.prototype, "open").callsFake(async (): Promise<void> => {
                dbStorage = {};
            });
            const navigationClient = new NavigationClient();
            navigationClient.navigateExternal = (urlNavigate: string, options: NavigationOptions): Promise<boolean> => {
                done("Navigatation should not happen if onRedirectNavigate returns false");
                return Promise.reject();
            };

            const onRedirectNavigate = (url: string) => {
                expect(url).toEqual(TEST_URIS.TEST_ALTERNATE_REDIR_URI);
                done();
                return false;
            }
            const redirectHandler = new RedirectHandler(authCodeModule, browserStorage, defaultTokenRequest, browserRequestLogger, browserCrypto);
            redirectHandler.initiateAuthRequest(TEST_URIS.TEST_ALTERNATE_REDIR_URI, {
                redirectTimeout: 300,
                redirectStartPage: "",
                onRedirectNavigate,
                navigationClient
            });
        });

        it("navigates if onRedirectNavigate doesnt return false", done => {
            let dbStorage = {};
            sinon.stub(DatabaseStorage.prototype, "open").callsFake(async (): Promise<void> => {
                dbStorage = {};
            });
            
            const navigationClient = new NavigationClient();
            navigationClient.navigateExternal = (requestUrl, options): Promise<boolean> => {
                expect(requestUrl).toEqual(TEST_URIS.TEST_ALTERNATE_REDIR_URI);
                done();
                return Promise.resolve(true);
            };

            const onRedirectNavigate = (url: string) => {
                expect(url).toEqual(TEST_URIS.TEST_ALTERNATE_REDIR_URI);
            }
            const redirectHandler = new RedirectHandler(authCodeModule, browserStorage, defaultTokenRequest, browserRequestLogger, browserCrypto);
            redirectHandler.initiateAuthRequest(TEST_URIS.TEST_ALTERNATE_REDIR_URI, {
                redirectTimeout: 3000,
                redirectStartPage: "",
                onRedirectNavigate,
                navigationClient
            });
        });
    });

    describe("handleCodeResponseFromHash()", () => {

        it("throws error if given hash is empty", () => {
            const redirectHandler = new RedirectHandler(authCodeModule, browserStorage, defaultTokenRequest, browserRequestLogger, browserCrypto);
            expect(redirectHandler.handleCodeResponseFromHash("", "", authorityInstance, authConfig.networkInterface!)).rejects.toMatchObject(BrowserAuthError.createEmptyHashError(""));
            //@ts-ignore
            expect(redirectHandler.handleCodeResponseFromHash(null, "", authorityInstance, authConfig.networkInterface!)).rejects.toMatchObject(BrowserAuthError.createEmptyHashError(null));
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
                correlationId: RANDOM_TEST_GUID,
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
                authenticationScheme: AuthenticationScheme.BEARER,
                redirectUri: TEST_URIS.TEST_REDIR_URI,
                scopes: ["scope1", "scope2"],
                code: "",
                authority: authorityInstance.canonicalAuthority,
                correlationId: RANDOM_TEST_GUID
            };
            browserStorage.setTemporaryCache(browserStorage.generateStateKey(TEST_STATE_VALUES.TEST_STATE_REDIRECT), TEST_STATE_VALUES.TEST_STATE_REDIRECT);
            browserStorage.setTemporaryCache(browserStorage.generateCacheKey(TemporaryCacheKeys.REQUEST_PARAMS), browserCrypto.base64Encode(JSON.stringify(testAuthCodeRequest)));
            browserStorage.setTemporaryCache(`${Constants.CACHE_PREFIX}.${TemporaryCacheKeys.INTERACTION_STATUS_KEY}`, TEST_CONFIG.MSAL_CLIENT_ID);
            browserStorage.setTemporaryCache(browserStorage.generateCacheKey(TemporaryCacheKeys.URL_HASH), TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT);
            sinon.stub(AuthorizationCodeClient.prototype, "handleFragmentResponse").returns(testCodeResponse);
            sinon.stub(AuthorizationCodeClient.prototype, "acquireToken").resolves(testTokenResponse);

            const redirectHandler = new RedirectHandler(authCodeModule, browserStorage, testAuthCodeRequest, browserRequestLogger, browserCrypto);
            const tokenResponse = await redirectHandler.handleCodeResponseFromHash(TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT, TEST_STATE_VALUES.TEST_STATE_REDIRECT, authorityInstance, authConfig.networkInterface!);
            expect(tokenResponse).toEqual(testTokenResponse);
            expect(browserStorage.getTemporaryCache(browserStorage.generateCacheKey(TemporaryCacheKeys.INTERACTION_STATUS_KEY))).toBe(null);
            expect(browserStorage.getTemporaryCache(browserStorage.generateCacheKey(TemporaryCacheKeys.URL_HASH))).toBe(null);
        });

        it("successfully handles response adds CCS credential to auth code request", async () => {
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
            const testCcsCred: CcsCredential = {
                credential: idTokenClaims.preferred_username || "",
                type: CcsCredentialType.UPN
            };
            const testTokenResponse: AuthenticationResult = {
                authority: authorityInstance.canonicalAuthority,
                accessToken: TEST_TOKENS.ACCESS_TOKEN,
                idToken: TEST_TOKENS.IDTOKEN_V2,
                fromCache: false,
                scopes: ["scope1", "scope2"],
                account: testAccount,
                correlationId: RANDOM_TEST_GUID,
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
                authenticationScheme: AuthenticationScheme.BEARER,
                redirectUri: TEST_URIS.TEST_REDIR_URI,
                scopes: ["scope1", "scope2"],
                code: "",
                authority: authorityInstance.canonicalAuthority,
                correlationId: RANDOM_TEST_GUID,
                ccsCredential: testCcsCred
            };
            browserStorage.setTemporaryCache(browserStorage.generateStateKey(TEST_STATE_VALUES.TEST_STATE_REDIRECT), TEST_STATE_VALUES.TEST_STATE_REDIRECT);
            browserStorage.setTemporaryCache(browserStorage.generateCacheKey(TemporaryCacheKeys.REQUEST_PARAMS), browserCrypto.base64Encode(JSON.stringify(testAuthCodeRequest)));
            browserStorage.setTemporaryCache(`${Constants.CACHE_PREFIX}.${TemporaryCacheKeys.INTERACTION_STATUS_KEY}`, TEST_CONFIG.MSAL_CLIENT_ID);
            browserStorage.setTemporaryCache(browserStorage.generateCacheKey(TemporaryCacheKeys.URL_HASH), TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT);
            browserStorage.setTemporaryCache(TemporaryCacheKeys.CCS_CREDENTIAL, JSON.stringify(testCcsCred));
            sinon.stub(AuthorizationCodeClient.prototype, "handleFragmentResponse").returns(testCodeResponse);
            sinon.stub(AuthorizationCodeClient.prototype, "acquireToken").resolves(testTokenResponse);

            const redirectHandler = new RedirectHandler(authCodeModule, browserStorage, testAuthCodeRequest, browserRequestLogger, browserCrypto);
            const tokenResponse = await redirectHandler.handleCodeResponseFromHash(TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT, TEST_STATE_VALUES.TEST_STATE_REDIRECT, authorityInstance, authConfig.networkInterface!);
            expect(tokenResponse).toEqual(testTokenResponse);
            expect(browserStorage.getTemporaryCache(browserStorage.generateCacheKey(TemporaryCacheKeys.INTERACTION_STATUS_KEY))).toBe(null);
            expect(browserStorage.getTemporaryCache(browserStorage.generateCacheKey(TemporaryCacheKeys.URL_HASH))).toBe(null);
        });
    });
});
