/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import sinon from "sinon";
import { Logger, LogLevel,IdTokenEntity, AccessTokenEntity, ScopeSet, ExternalTokenResponse, AccountEntity, AuthToken, AuthorityType, RefreshTokenEntity } from "@azure/msal-common";
import { TokenCache, LoadTokenOptions } from "../../src/cache/TokenCache";
import { CryptoOps } from "../../src/crypto/CryptoOps";
import { BrowserCacheManager } from "../../src/cache/BrowserCacheManager";
import { BrowserConfiguration, buildConfiguration, CacheOptions } from "../../src/config/Configuration";
import { BrowserCacheLocation } from "../../src/utils/BrowserConstants";
import { TEST_CONFIG, TEST_DATA_CLIENT_INFO, TEST_TOKENS, TEST_TOKEN_LIFETIMES, TEST_URIS } from "../utils/StringConstants";
import { BrowserAuthErrorMessage, SilentRequest } from "../../src";

describe("TokenCache tests", () => {

    let configuration: BrowserConfiguration;
    let logger: Logger;
    let browserStorage: BrowserCacheManager;
    let cacheConfig: Required<CacheOptions>;

    let cryptoObj: CryptoOps;
    beforeEach(() => {
        configuration = buildConfiguration({
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID
            }
        }, true);
        cacheConfig = {
            cacheLocation: BrowserCacheLocation.SessionStorage,
            storeAuthStateInCookie: false,
            secureCookies: false
        };
        logger = new Logger({
            loggerCallback: (level: LogLevel, message: string, containsPii: boolean): void => {},
            piiLoggingEnabled: true
        });
        cryptoObj = new CryptoOps(logger);
        browserStorage = new BrowserCacheManager(TEST_CONFIG.MSAL_CLIENT_ID, cacheConfig, cryptoObj, logger);
    });

    afterEach(() => {
        jest.restoreAllMocks();
        sinon.restore();
        window.sessionStorage.clear();
        window.localStorage.clear();
    });

    describe("loadExternalTokens()", () => {
        let tokenCache: TokenCache;
        let testEnvironment: string;
        let testClientInfo: string;
        let testIdToken: string;
        let testIdAuthToken: AuthToken;
        let testHomeAccountId: string;
        let idTokenEntity: IdTokenEntity;
        let idTokenKey: string;
        let testAccessToken: string;
        let accessTokenEntity: AccessTokenEntity;
        let accessTokenKey: string;
        let scopeString: string;
        let testRefreshToken: string;
        let refreshTokenEntity: RefreshTokenEntity;
        let refreshTokenKey: string;

        beforeEach(() => {
            tokenCache = new TokenCache(configuration, browserStorage, logger, cryptoObj);
            testEnvironment = "login.microsoftonline.com";

            testClientInfo = `${TEST_DATA_CLIENT_INFO.TEST_UID_ENCODED}.${TEST_DATA_CLIENT_INFO.TEST_UTID_ENCODED}`;
            testIdToken = TEST_TOKENS.IDTOKEN_V2;
            testIdAuthToken = new AuthToken(testIdToken, cryptoObj);
            testHomeAccountId = AccountEntity.generateHomeAccountId(testClientInfo, AuthorityType.Default, logger, cryptoObj, testIdAuthToken);

            idTokenEntity = IdTokenEntity.createIdTokenEntity(testHomeAccountId, testEnvironment, TEST_TOKENS.IDTOKEN_V2, configuration.auth.clientId, TEST_CONFIG.TENANT);
            idTokenKey = idTokenEntity.generateCredentialKey();

            scopeString = new ScopeSet(TEST_CONFIG.DEFAULT_SCOPES).printScopes();
            testAccessToken = TEST_TOKENS.ACCESS_TOKEN,
            accessTokenEntity = AccessTokenEntity.createAccessTokenEntity(testHomeAccountId, testEnvironment, testAccessToken, configuration.auth.clientId, TEST_CONFIG.TENANT, scopeString, TEST_TOKEN_LIFETIMES.TEST_ACCESS_TOKEN_EXP, TEST_TOKEN_LIFETIMES.TEST_ACCESS_TOKEN_EXP, cryptoObj);
            accessTokenKey = accessTokenEntity.generateCredentialKey();

            testRefreshToken = TEST_TOKENS.REFRESH_TOKEN;
            refreshTokenEntity = RefreshTokenEntity.createRefreshTokenEntity(testHomeAccountId, testEnvironment, testRefreshToken, configuration.auth.clientId);
            refreshTokenKey = refreshTokenEntity.generateCredentialKey();
        });

        afterEach(() => {
            browserStorage.clear();
        });

        it("loads id token with a request account", () => {
            const requestHomeAccountId = TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID;
            const request: SilentRequest = {
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                account: {
                    homeAccountId: requestHomeAccountId,
                    environment: testEnvironment,
                    tenantId: TEST_CONFIG.TENANT,
                    username: "username",
                    localAccountId: TEST_DATA_CLIENT_INFO.TEST_LOCAL_ACCOUNT_ID
                }
            };
            const response: ExternalTokenResponse = {
                id_token: testIdToken
            };
            const options: LoadTokenOptions = {};
            const result = tokenCache.loadExternalTokens(request, response, options);

            const testIdTokenEntity = IdTokenEntity.createIdTokenEntity(requestHomeAccountId, testEnvironment, TEST_TOKENS.IDTOKEN_V2, configuration.auth.clientId, TEST_CONFIG.TENANT);
            const testIdTokenKey = testIdTokenEntity.generateCredentialKey();

            expect(result.idToken).toEqual(TEST_TOKENS.IDTOKEN_V2);
            expect(browserStorage.getIdTokenCredential(testIdTokenKey)).toEqual(testIdTokenEntity);
        });

        it("loads id token with request authority and client info provided in options", () => {
            const request: SilentRequest = {
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                authority: `${TEST_URIS.DEFAULT_INSTANCE}${TEST_CONFIG.TENANT}`
            };
            const response: ExternalTokenResponse = {
                id_token: testIdToken
            };
            const options: LoadTokenOptions = {
                clientInfo: testClientInfo
            };

            const result = tokenCache.loadExternalTokens(request, response, options);

            expect(result.idToken).toEqual(TEST_TOKENS.IDTOKEN_V2);
            expect(browserStorage.getIdTokenCredential(idTokenKey)).toEqual(idTokenEntity);
        });

        it("sets account when id token is loaded", () => {
            const request: SilentRequest = {
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                authority: `${TEST_URIS.DEFAULT_INSTANCE}${TEST_CONFIG.TENANT}`
            };
            const response: ExternalTokenResponse = {
                id_token: testIdToken
            };
            const options: LoadTokenOptions = {
                clientInfo: testClientInfo
            };

            const testAccount = AccountEntity.createAccount(testClientInfo, testHomeAccountId, testIdAuthToken, undefined, undefined, undefined, testEnvironment, undefined);
            const testAccountInfo = {
                homeAccountId: testHomeAccountId,
                environment: testEnvironment,
                tenantId: TEST_CONFIG.MSAL_TENANT_ID,
                username: "AbeLi@microsoft.com",
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_LOCAL_ACCOUNT_ID
            };
            const testAccountKey = AccountEntity.generateAccountCacheKey(testAccountInfo);
            const result = tokenCache.loadExternalTokens(request, response, options);

            expect(result.idToken).toEqual(TEST_TOKENS.IDTOKEN_V2);
            expect(result.account).toEqual(testAccount.getAccountInfo());
            expect(browserStorage.getIdTokenCredential(idTokenKey)).toEqual(idTokenEntity);
            expect(browserStorage.getAccount(testAccountKey)).toEqual(testAccount);
        });

        it("loads id token with request authority and client info provided in response", () => {
            const request: SilentRequest = {
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                authority: `${TEST_URIS.DEFAULT_INSTANCE}${TEST_CONFIG.TENANT}`
            };
            const response: ExternalTokenResponse = {
                id_token: testIdToken,
                client_info: testClientInfo
            };
            const options: LoadTokenOptions = {};
            const result = tokenCache.loadExternalTokens(request, response, options);

            expect(result.idToken).toEqual(TEST_TOKENS.IDTOKEN_V2);
            expect(browserStorage.getIdTokenCredential(idTokenKey)).toEqual(idTokenEntity);
        });

        it("throws error if id token not provided in response", () => {
            const request: SilentRequest = {
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                account: {
                    homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                    environment: testEnvironment,
                    tenantId: TEST_CONFIG.TENANT,
                    username: "username",
                    localAccountId: "localAccountId"
                }
            };
            const response: ExternalTokenResponse = {};
            const options: LoadTokenOptions = {};

            expect(() => tokenCache.loadExternalTokens(request, response, options)).toThrowError(`${BrowserAuthErrorMessage.unableToLoadTokenError.desc} | Please ensure server response includes id token.`);
        });

        it("throws error if request does not have account and authority", () => {
            const request: SilentRequest = {
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
            };
            const response: ExternalTokenResponse = {
                id_token: testIdToken
            };
            const options: LoadTokenOptions = {};

            expect(() => tokenCache.loadExternalTokens(request, response, options)).toThrowError(`${BrowserAuthErrorMessage.unableToLoadTokenError.desc} | Please provide a request with an account or a request with authority.`);
        });

        it("throws error if request does not have account and clientInfo is not provided", () => {
            const request: SilentRequest = {
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                authority: `${TEST_URIS.DEFAULT_INSTANCE}${TEST_CONFIG.TENANT}`
            };
            const response: ExternalTokenResponse = {
                id_token: testIdToken
            };
            const options: LoadTokenOptions = {};

            expect(() => tokenCache.loadExternalTokens(request, response, options)).toThrowError(`${BrowserAuthErrorMessage.unableToLoadTokenError.code}: ${BrowserAuthErrorMessage.unableToLoadTokenError.desc} | Please provide clientInfo in the response or options.`);
        });

        it("throws error if server response provided does not have expires_in", () => {
            const request: SilentRequest = {
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                account: {
                    homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                    environment: testEnvironment,
                    tenantId: TEST_CONFIG.TENANT,
                    username: "username",
                    localAccountId: "localAccountId"
                }
            };
            const response: ExternalTokenResponse = {
                id_token: testIdToken,
                access_token: testAccessToken
            };
            const options: LoadTokenOptions = {};

            expect(() => tokenCache.loadExternalTokens(request, response, options)).toThrowError(`${BrowserAuthErrorMessage.unableToLoadTokenError.code}: ${BrowserAuthErrorMessage.unableToLoadTokenError.desc} | Please ensure server response includes expires_in value.`);
        });

        it("throws error if extendedExpiresOn not provided in options", () => {
            const request: SilentRequest = {
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                account: {
                    homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                    environment: testEnvironment,
                    tenantId: TEST_CONFIG.TENANT,
                    username: "username",
                    localAccountId: "localAccountId"
                }
            };
            const response: ExternalTokenResponse = {
                id_token: testIdToken,
                access_token: testAccessToken,
                expires_in: TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN
            };
            const options: LoadTokenOptions = {};

            expect(() => tokenCache.loadExternalTokens(request, response, options)).toThrowError(`${BrowserAuthErrorMessage.unableToLoadTokenError.code}: ${BrowserAuthErrorMessage.unableToLoadTokenError.desc} | Please provide an extendedExpiresOn value in the options.`);
        });

        it("loads access tokens from server response and token options", () => {
            const request: SilentRequest = {
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                account: {
                    homeAccountId: testHomeAccountId,
                    environment: testEnvironment,
                    tenantId: TEST_CONFIG.TENANT,
                    username: "username",
                    localAccountId: "localAccountId"
                }
            };
            const response: ExternalTokenResponse = {
                id_token: testIdToken,
                access_token: testAccessToken,
                expires_in: TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN,
            };
            const options: LoadTokenOptions = {
                expiresOn: TEST_TOKEN_LIFETIMES.TEST_ACCESS_TOKEN_EXP,
                extendedExpiresOn: TEST_TOKEN_LIFETIMES.TEST_ACCESS_TOKEN_EXP
            };
            const result = tokenCache.loadExternalTokens(request, response, options);

            expect(parseInt(accessTokenEntity.expiresOn)).toBeGreaterThan(TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN);
            expect(result.accessToken).toEqual(accessTokenEntity.secret);
            expect(browserStorage.getAccessTokenCredential(accessTokenKey)).toEqual(accessTokenEntity);
        });

        it("throws error if callback not provided in non-browser environment", () => {
            tokenCache.isBrowserEnvironment = false;
            const request: SilentRequest = {
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                account: {
                    homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                    environment: testEnvironment,
                    tenantId: TEST_CONFIG.TENANT,
                    username: "username",
                    localAccountId: "localAccountId"
                }
            };
            const response: ExternalTokenResponse = {
                id_token: testIdToken,
                access_token: testAccessToken,
                expires_in: TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN
            };
            const options: LoadTokenOptions = {};

            expect(() => tokenCache.loadExternalTokens(request, response, options)).toThrowError(`${BrowserAuthErrorMessage.unableToLoadTokenError.code}: ${BrowserAuthErrorMessage.unableToLoadTokenError.desc} | loadExternalTokens is designed to work in browser environments only.`);
        });

        it("loads refresh token with request authority and client info provided in options", () => {
            const request: SilentRequest = {
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                authority: `${TEST_URIS.DEFAULT_INSTANCE}${TEST_CONFIG.TENANT}`
            };
            const response: ExternalTokenResponse = {
                id_token: testIdToken,
                refresh_token: testRefreshToken,
            };
            const options: LoadTokenOptions = {
                clientInfo: testClientInfo,
            };

            const result = tokenCache.loadExternalTokens(request, response, options);

            expect(result.idToken).toEqual(TEST_TOKENS.IDTOKEN_V2);
            expect(browserStorage.getRefreshTokenCredential(refreshTokenKey)).toEqual(refreshTokenEntity);
        });

    });
});
