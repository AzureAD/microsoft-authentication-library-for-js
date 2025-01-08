/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    Logger,
    LogLevel,
    IdTokenEntity,
    AccessTokenEntity,
    ScopeSet,
    ExternalTokenResponse,
    AccountEntity,
    AuthToken,
    AuthorityType,
    RefreshTokenEntity,
    TokenClaims,
    CacheHelpers,
    StubPerformanceClient,
} from "@azure/msal-common/browser";
import { TokenCache, LoadTokenOptions } from "../../src/cache/TokenCache.js";
import { CryptoOps } from "../../src/crypto/CryptoOps.js";
import { BrowserCacheManager } from "../../src/cache/BrowserCacheManager.js";
import {
    BrowserConfiguration,
    buildConfiguration,
    CacheOptions,
} from "../../src/config/Configuration.js";
import { BrowserCacheLocation } from "../../src/utils/BrowserConstants.js";
import {
    ID_TOKEN_CLAIMS,
    TEST_CONFIG,
    TEST_DATA_CLIENT_INFO,
    TEST_TOKENS,
    TEST_TOKEN_LIFETIMES,
    TEST_URIS,
} from "../utils/StringConstants.js";
import {
    BrowserAuthError,
    BrowserAuthErrorCodes,
    BrowserAuthErrorMessage,
    PublicClientApplication,
    SilentRequest,
} from "../../src/index.js";
import { base64Decode } from "../../src/encode/Base64Decode.js";
import { buildAccountFromIdTokenClaims } from "msal-test-utils";
import { createBrowserAuthError } from "../../src/error/BrowserAuthError.js";

describe("TokenCache tests", () => {
    let configuration: BrowserConfiguration;
    let logger: Logger;
    let browserStorage: BrowserCacheManager;
    let cacheConfig: Required<CacheOptions>;

    let cryptoObj: CryptoOps;
    beforeEach(async () => {
        configuration = buildConfiguration(
            {
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                },
            },
            true
        );
        cacheConfig = {
            temporaryCacheLocation: BrowserCacheLocation.SessionStorage,
            cacheLocation: BrowserCacheLocation.SessionStorage,
            storeAuthStateInCookie: false,
            secureCookies: false,
            cacheMigrationEnabled: false,
            claimsBasedCachingEnabled: false,
        };
        logger = new Logger({
            loggerCallback: (
                level: LogLevel,
                message: string,
                containsPii: boolean
            ): void => {},
            piiLoggingEnabled: true,
        });
        cryptoObj = new CryptoOps(logger);
        browserStorage = new BrowserCacheManager(
            TEST_CONFIG.MSAL_CLIENT_ID,
            cacheConfig,
            cryptoObj,
            logger,
            new StubPerformanceClient()
        );
    });

    afterEach(() => {
        jest.restoreAllMocks();
        window.sessionStorage.clear();
        window.localStorage.clear();
    });

    describe("loadExternalTokens()", () => {
        let tokenCache: TokenCache;
        let testEnvironment: string;
        let testClientInfo: string;
        let testIdToken: string;
        let testIdTokenClaims: TokenClaims;
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
            tokenCache = new TokenCache(
                configuration,
                browserStorage,
                logger,
                cryptoObj
            );
            testEnvironment = "login.microsoftonline.com";

            testClientInfo = TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO;
            testIdToken = TEST_TOKENS.IDTOKEN_V2;
            testIdTokenClaims = AuthToken.extractTokenClaims(
                testIdToken,
                base64Decode
            );
            testHomeAccountId = AccountEntity.generateHomeAccountId(
                testClientInfo,
                AuthorityType.Default,
                logger,
                cryptoObj,
                testIdTokenClaims
            );

            idTokenEntity = CacheHelpers.createIdTokenEntity(
                testHomeAccountId,
                testEnvironment,
                TEST_TOKENS.IDTOKEN_V2,
                configuration.auth.clientId,
                ID_TOKEN_CLAIMS.tid
            );
            idTokenKey = CacheHelpers.generateCredentialKey(idTokenEntity);

            scopeString = new ScopeSet(
                TEST_CONFIG.DEFAULT_SCOPES
            ).printScopes();
            (testAccessToken = TEST_TOKENS.ACCESS_TOKEN),
                (accessTokenEntity = CacheHelpers.createAccessTokenEntity(
                    testHomeAccountId,
                    testEnvironment,
                    testAccessToken,
                    configuration.auth.clientId,
                    TEST_CONFIG.TENANT,
                    scopeString,
                    TEST_TOKEN_LIFETIMES.TEST_ACCESS_TOKEN_EXP,
                    TEST_TOKEN_LIFETIMES.TEST_ACCESS_TOKEN_EXP,
                    cryptoObj.base64Decode
                ));
            accessTokenKey =
                CacheHelpers.generateCredentialKey(accessTokenEntity);

            testRefreshToken = TEST_TOKENS.REFRESH_TOKEN;
            refreshTokenEntity = CacheHelpers.createRefreshTokenEntity(
                testHomeAccountId,
                testEnvironment,
                testRefreshToken,
                configuration.auth.clientId
            );
            refreshTokenKey =
                CacheHelpers.generateCredentialKey(refreshTokenEntity);
        });

        afterEach(() => {
            browserStorage.clear();
        });

        it("loads id token with a request account", async () => {
            const requestHomeAccountId =
                TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID;
            const request: SilentRequest = {
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                account: {
                    homeAccountId: requestHomeAccountId,
                    environment: testEnvironment,
                    tenantId: TEST_CONFIG.TENANT,
                    username: "username",
                    localAccountId: TEST_DATA_CLIENT_INFO.TEST_LOCAL_ACCOUNT_ID,
                },
            };
            const response: ExternalTokenResponse = {
                id_token: testIdToken,
            };
            const options: LoadTokenOptions = {};
            const result = await tokenCache.loadExternalTokens(
                request,
                response,
                options
            );

            const testIdTokenEntity = CacheHelpers.createIdTokenEntity(
                requestHomeAccountId,
                testEnvironment,
                TEST_TOKENS.IDTOKEN_V2,
                configuration.auth.clientId,
                TEST_CONFIG.TENANT
            );
            const testIdTokenKey =
                CacheHelpers.generateCredentialKey(testIdTokenEntity);

            expect(result.idToken).toEqual(TEST_TOKENS.IDTOKEN_V2);
            expect(browserStorage.getIdTokenCredential(testIdTokenKey)).toEqual(
                testIdTokenEntity
            );
        });

        it("loads id token with request authority and client info provided in options", async () => {
            const request: SilentRequest = {
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                authority: `${TEST_URIS.DEFAULT_INSTANCE}${TEST_CONFIG.TENANT}`,
            };
            const response: ExternalTokenResponse = {
                id_token: testIdToken,
            };
            const options: LoadTokenOptions = {
                clientInfo: testClientInfo,
            };

            const result = await tokenCache.loadExternalTokens(
                request,
                response,
                options
            );

            expect(result.idToken).toEqual(TEST_TOKENS.IDTOKEN_V2);
            expect(browserStorage.getIdTokenCredential(idTokenKey)).toEqual(
                idTokenEntity
            );
        });

        it("sets account when id token is loaded", async () => {
            const request: SilentRequest = {
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                authority: `${TEST_URIS.DEFAULT_INSTANCE}${TEST_CONFIG.TENANT}`,
            };
            const response: ExternalTokenResponse = {
                id_token: testIdToken,
            };
            const options: LoadTokenOptions = {
                clientInfo: testClientInfo,
            };

            const testAccountInfo = buildAccountFromIdTokenClaims(
                ID_TOKEN_CLAIMS,
                undefined,
                { environment: testEnvironment }
            ).getAccountInfo();
            const testAccountKey =
                AccountEntity.generateAccountCacheKey(testAccountInfo);
            const result = await tokenCache.loadExternalTokens(
                request,
                response,
                options
            );

            expect(result.idToken).toEqual(TEST_TOKENS.IDTOKEN_V2);
            expect(result.account).toEqual(testAccountInfo);
            expect(browserStorage.getIdTokenCredential(idTokenKey)).toEqual(
                idTokenEntity
            );
            expect(
                browserStorage.getAccount(testAccountKey)?.homeAccountId
            ).toEqual(testAccountInfo.homeAccountId);
        });

        it("loads id token with request authority and client info provided in response", async () => {
            const request: SilentRequest = {
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                authority: `${TEST_URIS.DEFAULT_INSTANCE}${TEST_CONFIG.TENANT}`,
            };
            const response: ExternalTokenResponse = {
                id_token: testIdToken,
                client_info: testClientInfo,
            };
            const options: LoadTokenOptions = {};
            const result = await tokenCache.loadExternalTokens(
                request,
                response,
                options
            );

            expect(result.idToken).toEqual(TEST_TOKENS.IDTOKEN_V2);
            expect(browserStorage.getIdTokenCredential(idTokenKey)).toEqual(
                idTokenEntity
            );
        });

        it("throws error if request does not have account and authority", (done) => {
            const request: SilentRequest = {
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
            };
            const response: ExternalTokenResponse = {
                id_token: testIdToken,
            };
            const options: LoadTokenOptions = {};

            tokenCache
                .loadExternalTokens(request, response, options)
                .catch((e) => {
                    expect(e).toEqual(
                        createBrowserAuthError(
                            BrowserAuthErrorCodes.unableToLoadToken
                        )
                    );
                    done();
                });
        });

        it("throws error if request does not have account and clientInfo and idToken is not provided", (done) => {
            const request: SilentRequest = {
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                authority: `${TEST_URIS.DEFAULT_INSTANCE}${TEST_CONFIG.TENANT}`,
            };
            const response: ExternalTokenResponse = {
                access_token: testAccessToken,
            };
            const options: LoadTokenOptions = {};

            tokenCache
                .loadExternalTokens(request, response, options)
                .catch((e) => {
                    expect(e).toEqual(
                        createBrowserAuthError(
                            BrowserAuthErrorCodes.unableToLoadToken
                        )
                    );
                    done();
                });
        });

        it("skips storing access token if server response provided does not have expires_in", async () => {
            const request: SilentRequest = {
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                account: {
                    homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                    environment: testEnvironment,
                    tenantId: ID_TOKEN_CLAIMS.tid,
                    username: "username",
                    localAccountId: ID_TOKEN_CLAIMS.oid,
                },
            };
            const response: ExternalTokenResponse = {
                id_token: testIdToken,
                access_token: testAccessToken,
            };
            const options: LoadTokenOptions = {};

            const result = await tokenCache.loadExternalTokens(
                request,
                response,
                options
            );

            expect(result.idToken).toEqual(TEST_TOKENS.IDTOKEN_V2);
            expect(browserStorage.getIdTokenCredential(idTokenKey)).toEqual(
                idTokenEntity
            );
            expect(result.accessToken).toEqual("");
            expect(
                browserStorage.getAccessTokenCredential(accessTokenKey)
            ).toEqual(null);
        });

        it("loads access tokens from server response and token options", async () => {
            const request: SilentRequest = {
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                account: {
                    homeAccountId: testHomeAccountId,
                    environment: testEnvironment,
                    tenantId: TEST_CONFIG.TENANT,
                    username: "username",
                    localAccountId: "localAccountId",
                },
            };
            const response: ExternalTokenResponse = {
                id_token: testIdToken,
                access_token: testAccessToken,
                expires_in: TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN,
            };
            const options: LoadTokenOptions = {
                expiresOn: TEST_TOKEN_LIFETIMES.TEST_ACCESS_TOKEN_EXP,
                extendedExpiresOn: TEST_TOKEN_LIFETIMES.TEST_ACCESS_TOKEN_EXP,
            };
            const result = await tokenCache.loadExternalTokens(
                request,
                response,
                options
            );

            expect(parseInt(accessTokenEntity.expiresOn)).toBeGreaterThan(
                TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN
            );
            expect(result.accessToken).toEqual(accessTokenEntity.secret);
            expect(
                browserStorage.getAccessTokenCredential(accessTokenKey)
            ).toEqual(accessTokenEntity);
        });

        it("throws error if in non-browser environment", (done) => {
            tokenCache.isBrowserEnvironment = false;
            const request: SilentRequest = {
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                account: {
                    homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                    environment: testEnvironment,
                    tenantId: TEST_CONFIG.TENANT,
                    username: "username",
                    localAccountId: "localAccountId",
                },
            };
            const response: ExternalTokenResponse = {
                id_token: testIdToken,
                access_token: testAccessToken,
                expires_in: TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN,
            };
            const options: LoadTokenOptions = {};

            tokenCache
                .loadExternalTokens(request, response, options)
                .catch((e) => {
                    expect(e).toEqual(
                        createBrowserAuthError(
                            BrowserAuthErrorCodes.nonBrowserEnvironment
                        )
                    );
                    done();
                });
        });

        it("loads refresh token with request authority and client info provided in response", async () => {
            const request: SilentRequest = {
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                authority: `${TEST_URIS.DEFAULT_INSTANCE}${TEST_CONFIG.TENANT}`,
            };
            const response: ExternalTokenResponse = {
                refresh_token: testRefreshToken,
                client_info: testClientInfo,
            };
            const options: LoadTokenOptions = {};

            await tokenCache.loadExternalTokens(request, response, options);

            expect(
                browserStorage.getRefreshTokenCredential(refreshTokenKey)
            ).toEqual(refreshTokenEntity);
        });

        it("loads refresh token with request authority and client info provided in options", async () => {
            const request: SilentRequest = {
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                authority: `${TEST_URIS.DEFAULT_INSTANCE}${TEST_CONFIG.TENANT}`,
            };
            const response: ExternalTokenResponse = {
                refresh_token: testRefreshToken,
            };
            const options: LoadTokenOptions = {
                clientInfo: testClientInfo,
            };

            const result = await tokenCache.loadExternalTokens(
                request,
                response,
                options
            );

            // Validate account can be retrieved
            const pca = new PublicClientApplication(configuration);
            expect(pca.getAllAccounts()).toHaveLength(1);
            expect(
                pca.getAccount({
                    localAccountId: result.account.localAccountId,
                    homeAccountId: result.account.homeAccountId,
                    realm: result.account.tenantId,
                    environment: result.account.environment,
                })
            ).toEqual(result.account);

            // Validate tokens can be retrieved
            expect(
                browserStorage.getRefreshTokenCredential(refreshTokenKey)
            ).toEqual(refreshTokenEntity);
        });

        it("loads refresh token with request authority and information from id_token", async () => {
            const request: SilentRequest = {
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                authority: `${TEST_URIS.DEFAULT_INSTANCE}${TEST_CONFIG.TENANT}`,
            };
            const response: ExternalTokenResponse = {
                id_token: testIdToken,
                refresh_token: testRefreshToken,
            };
            const options: LoadTokenOptions = {};

            const result = await tokenCache.loadExternalTokens(
                request,
                response,
                options
            );

            testHomeAccountId = AccountEntity.generateHomeAccountId(
                "",
                AuthorityType.Default,
                logger,
                cryptoObj,
                testIdTokenClaims
            );

            idTokenEntity = CacheHelpers.createIdTokenEntity(
                testHomeAccountId,
                testEnvironment,
                TEST_TOKENS.IDTOKEN_V2,
                configuration.auth.clientId,
                ID_TOKEN_CLAIMS.tid
            );

            refreshTokenEntity = CacheHelpers.createRefreshTokenEntity(
                testHomeAccountId,
                testEnvironment,
                testRefreshToken,
                configuration.auth.clientId
            );

            expect(result.idToken).toEqual(TEST_TOKENS.IDTOKEN_V2);
            expect(
                browserStorage.getIdTokenCredential(
                    CacheHelpers.generateCredentialKey(idTokenEntity)
                )
            ).toEqual(idTokenEntity);
            expect(
                browserStorage.getRefreshTokenCredential(
                    CacheHelpers.generateCredentialKey(refreshTokenEntity)
                )
            ).toEqual(refreshTokenEntity);
        });
    });
});
