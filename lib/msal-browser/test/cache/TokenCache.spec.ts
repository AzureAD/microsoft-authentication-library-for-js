/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    Logger,
    LogLevel,
    ExternalTokenResponse,
    AuthToken,
    AuthorityType,
    TokenClaims,
    CacheHelpers,
    StubPerformanceClient,
    AccountEntityUtils,
    PerformanceEvent,
    TimeUtils,
} from "@azure/msal-common/browser";
import {
    LoadTokenOptions,
    loadExternalTokens,
} from "../../src/cache/TokenCache.js";
import { CryptoOps } from "../../src/crypto/CryptoOps.js";
import { BrowserCacheManager } from "../../src/cache/BrowserCacheManager.js";
import {
    BrowserConfiguration,
    buildConfiguration,
    CacheOptions,
} from "../../src/config/Configuration.js";
import {
    ApiId,
    BrowserCacheLocation,
} from "../../src/utils/BrowserConstants.js";
import {
    ID_TOKEN_CLAIMS,
    RANDOM_TEST_GUID,
    TEST_CONFIG,
    TEST_DATA_CLIENT_INFO,
    TEST_TOKENS,
    TEST_TOKEN_LIFETIMES,
    TEST_URIS,
} from "../utils/StringConstants.js";
import {
    BrowserAuthErrorCodes,
    PublicClientApplication,
    SilentRequest,
} from "../../src/index.js";
import { base64Decode } from "../../src/encode/Base64Decode.js";
import { buildAccountFromIdTokenClaims } from "msal-test-utils";
import { createBrowserAuthError } from "../../src/error/BrowserAuthError.js";
import { EventHandler } from "../../src/event/EventHandler.js";
import * as BrowserUtils from "../../src/utils/BrowserUtils.js";
import { BrowserPerformanceClient } from "../../src/telemetry/BrowserPerformanceClient.js";
import * as BrowserRootPerformanceEvents from "../../src/telemetry/BrowserRootPerformanceEvents.js";
import * as BrowserPerformanceEvents from "../../src/telemetry/BrowserPerformanceEvents.js";

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
            cacheLocation: BrowserCacheLocation.SessionStorage,
            cacheRetentionDays: 5,
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
            new StubPerformanceClient(),
            new EventHandler()
        );
    });

    afterEach(() => {
        jest.restoreAllMocks();
        window.sessionStorage.clear();
        window.localStorage.clear();
    });

    describe("loadExternalTokens()", () => {
        let testEnvironment: string;
        let testClientInfo: string;
        let testIdToken: string;
        let testIdTokenClaims: TokenClaims;
        let testHomeAccountId: string;
        let testAccessToken: string;
        let testRefreshToken: string;

        beforeEach(() => {
            testEnvironment = "login.windows.net";

            testClientInfo = TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO;
            testIdToken = TEST_TOKENS.IDTOKEN_V2;
            testIdTokenClaims = AuthToken.extractTokenClaims(
                testIdToken,
                base64Decode
            );
            testHomeAccountId = AccountEntityUtils.generateHomeAccountId(
                testClientInfo,
                AuthorityType.Default,
                logger,
                cryptoObj,
                TEST_CONFIG.CORRELATION_ID,
                testIdTokenClaims
            );

            testAccessToken = TEST_TOKENS.ACCESS_TOKEN;
            testRefreshToken = TEST_TOKENS.REFRESH_TOKEN;
        });

        afterEach(() => {
            browserStorage.clear(RANDOM_TEST_GUID);
        });

        it("loads id token with a request account", async () => {
            const setSpy = jest.spyOn(
                BrowserCacheManager.prototype,
                "setIdTokenCredential"
            );
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
                    loginHint: "login_hint",
                },
            };
            const response: ExternalTokenResponse = {
                id_token: testIdToken,
            };
            const options: LoadTokenOptions = {};
            const result = await loadExternalTokens(
                configuration,
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
                browserStorage.generateCredentialKey(testIdTokenEntity);

            expect(result.idToken).toEqual(testIdToken);
            expect(setSpy).toHaveBeenCalledWith(
                expect.objectContaining({ secret: testIdToken }),
                expect.anything(),
                false
            );
        });

        it("sets cachedByApiId when loading external tokens", async () => {
            const request: SilentRequest = {
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                account: {
                    homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                    environment: testEnvironment,
                    tenantId: TEST_CONFIG.TENANT,
                    username: "username",
                    localAccountId: TEST_DATA_CLIENT_INFO.TEST_LOCAL_ACCOUNT_ID,
                    loginHint: "login_hint",
                },
            };
            const response: ExternalTokenResponse = {
                id_token: testIdToken,
                access_token: testAccessToken,
                refresh_token: testRefreshToken,
            };
            const options: LoadTokenOptions = {};
            const result = await loadExternalTokens(
                configuration,
                request,
                response,
                options
            );

            const accountKey = browserStorage.generateAccountKey(
                result.account!
            );
            const accountEntity = await browserStorage.getAccount(
                accountKey,
                RANDOM_TEST_GUID
            );
            expect(accountEntity?.cachedByApiId).toBe(ApiId.loadExternalTokens);
        });

        it("loads id token with request authority and client info provided in options", async () => {
            const setSpy = jest.spyOn(
                BrowserCacheManager.prototype,
                "setIdTokenCredential"
            );
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

            const result = await loadExternalTokens(
                configuration,
                request,
                response,
                options
            );

            expect(result.idToken).toEqual(testIdToken);
            expect(setSpy).toHaveBeenCalledWith(
                expect.objectContaining({ secret: testIdToken }),
                expect.anything(),
                false
            );
        });

        it("sets account when id token is loaded", async () => {
            const setSpy = jest.spyOn(
                BrowserCacheManager.prototype,
                "setIdTokenCredential"
            );
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

            const testAccountInfo = AccountEntityUtils.getAccountInfo(
                buildAccountFromIdTokenClaims(ID_TOKEN_CLAIMS, undefined, {
                    environment: testEnvironment,
                })
            );
            const testAccountKey =
                browserStorage.generateAccountKey(testAccountInfo);
            const result = await loadExternalTokens(
                configuration,
                request,
                response,
                options
            );

            expect(result.idToken).toEqual(testIdToken);
            expect(result.account).toEqual(testAccountInfo);
            expect(setSpy).toHaveBeenCalledWith(
                expect.objectContaining({ secret: testIdToken }),
                expect.anything(),
                false
            );
            expect(
                browserStorage.getAccount(testAccountKey, RANDOM_TEST_GUID)
                    ?.homeAccountId
            ).toEqual(testAccountInfo.homeAccountId);
        });

        it("loads id token with request authority and client info provided in response", async () => {
            const setSpy = jest.spyOn(
                BrowserCacheManager.prototype,
                "setIdTokenCredential"
            );
            const request: SilentRequest = {
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                authority: `${TEST_URIS.DEFAULT_INSTANCE}${TEST_CONFIG.TENANT}`,
            };
            const response: ExternalTokenResponse = {
                id_token: testIdToken,
                client_info: testClientInfo,
            };
            const options: LoadTokenOptions = {};
            const result = await loadExternalTokens(
                configuration,
                request,
                response,
                options
            );

            expect(result.idToken).toEqual(testIdToken);
            expect(setSpy).toHaveBeenCalledWith(
                expect.objectContaining({ secret: testIdToken }),
                expect.anything(),
                false
            );
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

            loadExternalTokens(configuration, request, response, options).catch(
                (e) => {
                    expect(e).toEqual(
                        createBrowserAuthError(
                            BrowserAuthErrorCodes.unableToLoadToken
                        )
                    );
                    done();
                }
            );
        });

        it("skips storing access token if server response provided does not have expires_in", async () => {
            const idSpy = jest.spyOn(
                BrowserCacheManager.prototype,
                "setIdTokenCredential"
            );
            const accessSpy = jest.spyOn(
                BrowserCacheManager.prototype,
                "setAccessTokenCredential"
            );
            const request: SilentRequest = {
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                account: {
                    homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                    environment: testEnvironment,
                    tenantId: ID_TOKEN_CLAIMS.tid,
                    username: ID_TOKEN_CLAIMS.preferred_username,
                    localAccountId: ID_TOKEN_CLAIMS.oid,
                    loginHint: ID_TOKEN_CLAIMS.login_hint,
                },
            };
            const response: ExternalTokenResponse = {
                id_token: testIdToken,
                access_token: testAccessToken,
            };
            const options: LoadTokenOptions = {};

            const result = await loadExternalTokens(
                configuration,
                request,
                response,
                options
            );

            expect(result.idToken).toEqual(TEST_TOKENS.IDTOKEN_V2);
            expect(idSpy).toHaveBeenCalledWith(
                expect.objectContaining({ secret: testIdToken }),
                expect.anything(),
                false
            );
            expect(result.accessToken).toEqual("");
            expect(accessSpy).not.toHaveBeenCalled();
        });

        it("loads access tokens from server response and token options", async () => {
            const accessSpy = jest.spyOn(
                BrowserCacheManager.prototype,
                "setAccessTokenCredential"
            );
            const request: SilentRequest = {
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                account: {
                    homeAccountId: testHomeAccountId,
                    environment: testEnvironment,
                    tenantId: TEST_CONFIG.TENANT,
                    username: ID_TOKEN_CLAIMS.preferred_username,
                    localAccountId: ID_TOKEN_CLAIMS.oid,
                    loginHint: ID_TOKEN_CLAIMS.login_hint,
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
            const result = await loadExternalTokens(
                configuration,
                request,
                response,
                options
            );

            expect(result.accessToken).toEqual(testAccessToken);
            expect(accessSpy).toHaveBeenCalledWith(
                expect.objectContaining({ secret: testAccessToken }),
                expect.anything(),
                false
            );
        });

        it("calls BrowserUtils.blockNonBrowserEnvironment", async () => {
            const blockSpy = jest.spyOn(
                BrowserUtils,
                "blockNonBrowserEnvironment"
            );

            const request: SilentRequest = {
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                account: {
                    homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                    environment: testEnvironment,
                    tenantId: TEST_CONFIG.TENANT,
                    username: ID_TOKEN_CLAIMS.preferred_username,
                    localAccountId: ID_TOKEN_CLAIMS.oid,
                    loginHint: ID_TOKEN_CLAIMS.login_hint,
                },
            };
            const response: ExternalTokenResponse = {
                id_token: testIdToken,
                access_token: testAccessToken,
                expires_in: TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN,
            };
            const options: LoadTokenOptions = {};

            await loadExternalTokens(configuration, request, response, options);

            expect(blockSpy).toHaveBeenCalled();
        });

        it("loads refresh token with request authority and client info provided in response", async () => {
            const refreshSpy = jest.spyOn(
                BrowserCacheManager.prototype,
                "setRefreshTokenCredential"
            );
            const request: SilentRequest = {
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                authority: `${TEST_URIS.DEFAULT_INSTANCE}${TEST_CONFIG.TENANT}`,
            };
            const response: ExternalTokenResponse = {
                refresh_token: testRefreshToken,
                client_info: testClientInfo,
            };
            const options: LoadTokenOptions = {};

            await loadExternalTokens(configuration, request, response, options);

            expect(refreshSpy).toHaveBeenCalledWith(
                expect.objectContaining({ secret: testRefreshToken }),
                expect.anything(),
                false
            );
        });

        it("loads refresh token with request authority and client info provided in options", async () => {
            const refreshSpy = jest.spyOn(
                BrowserCacheManager.prototype,
                "setRefreshTokenCredential"
            );
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

            const result = await loadExternalTokens(
                configuration,
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
            expect(refreshSpy).toHaveBeenCalledWith(
                expect.objectContaining({ secret: testRefreshToken }),
                expect.anything(),
                false
            );
        });

        it("loads refresh token with request authority and information from id_token", async () => {
            const idSpy = jest.spyOn(
                BrowserCacheManager.prototype,
                "setIdTokenCredential"
            );
            const refreshSpy = jest.spyOn(
                BrowserCacheManager.prototype,
                "setRefreshTokenCredential"
            );
            const request: SilentRequest = {
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                authority: `${TEST_URIS.DEFAULT_INSTANCE}${TEST_CONFIG.TENANT}`,
            };
            const response: ExternalTokenResponse = {
                id_token: testIdToken,
                refresh_token: testRefreshToken,
            };
            const options: LoadTokenOptions = {};

            const result = await loadExternalTokens(
                configuration,
                request,
                response,
                options
            );

            testHomeAccountId = AccountEntityUtils.generateHomeAccountId(
                "",
                AuthorityType.Default,
                logger,
                cryptoObj,
                TEST_CONFIG.CORRELATION_ID,
                testIdTokenClaims
            );

            expect(result.idToken).toEqual(TEST_TOKENS.IDTOKEN_V2);
            expect(idSpy).toHaveBeenCalledWith(
                expect.objectContaining({ secret: testIdToken }),
                expect.anything(),
                false
            );
            expect(refreshSpy).toHaveBeenCalledWith(
                expect.objectContaining({ secret: testRefreshToken }),
                expect.anything(),
                false
            );
        });

        it("loads refresh token with expiration time when refresh_token_expires_in is provided", async () => {
            const refreshSpy = jest.spyOn(
                BrowserCacheManager.prototype,
                "setRefreshTokenCredential"
            );
            const refreshTokenExpiresIn = 1209600; // 14 days in seconds
            const now = TimeUtils.nowSeconds();
            const expectedExpiresOn = now + refreshTokenExpiresIn;

            const request: SilentRequest = {
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                authority: `${TEST_URIS.DEFAULT_INSTANCE}${TEST_CONFIG.TENANT}`,
            };
            const response: ExternalTokenResponse = {
                refresh_token: testRefreshToken,
                client_info: testClientInfo,
                refresh_token_expires_in: refreshTokenExpiresIn,
            };
            const options: LoadTokenOptions = {};

            await loadExternalTokens(configuration, request, response, options);

            expect(refreshSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    secret: testRefreshToken,
                    expiresOn: expect.any(String),
                }),
                expect.anything(),
                false
            );

            // Validate expiresOn is within acceptable range (±2 seconds to account for test execution time)
            const callArgs = refreshSpy.mock.calls[0][0];
            expect(callArgs.expiresOn).toBeDefined();
            const expiresOnNumber = parseInt(callArgs.expiresOn as string, 10);
            expect(expiresOnNumber).toBeGreaterThanOrEqual(expectedExpiresOn);
            expect(expiresOnNumber).toBeLessThanOrEqual(expectedExpiresOn + 2);
        });

        it("loads refresh token without expiration time when refresh_token_expires_in is not provided", async () => {
            const refreshSpy = jest.spyOn(
                BrowserCacheManager.prototype,
                "setRefreshTokenCredential"
            );

            const request: SilentRequest = {
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                authority: `${TEST_URIS.DEFAULT_INSTANCE}${TEST_CONFIG.TENANT}`,
            };
            const response: ExternalTokenResponse = {
                refresh_token: testRefreshToken,
                client_info: testClientInfo,
                // No refresh_token_expires_in
            };
            const options: LoadTokenOptions = {};

            await loadExternalTokens(configuration, request, response, options);

            expect(refreshSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    secret: testRefreshToken,
                }),
                expect.anything(),
                false
            );

            // Validate expiresOn is undefined when refresh_token_expires_in is not provided
            const callArgs = refreshSpy.mock.calls[0][0];
            expect(callArgs.expiresOn).toBeUndefined();
        });

        it("uses preferred_cache from authority discovery for environment when caching tokens", async () => {
            const accountSpy = jest.spyOn(
                BrowserCacheManager.prototype,
                "setAccount"
            );
            const refreshSpy = jest.spyOn(
                BrowserCacheManager.prototype,
                "setRefreshTokenCredential"
            );
            const idSpy = jest.spyOn(
                BrowserCacheManager.prototype,
                "setIdTokenCredential"
            );

            // Use login.microsoftonline.com as authority - this should resolve to preferred_cache "login.windows.net"
            const request: SilentRequest = {
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                authority: `https://login.microsoftonline.com/${TEST_CONFIG.TENANT}`,
            };
            const response: ExternalTokenResponse = {
                id_token: testIdToken,
                refresh_token: testRefreshToken,
                client_info: testClientInfo,
            };
            const options: LoadTokenOptions = {};

            await loadExternalTokens(configuration, request, response, options);

            // Verify account is cached with preferred_cache environment (login.windows.net)
            expect(accountSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    environment: "login.windows.net", // preferred_cache for login.microsoftonline.com
                }),
                expect.anything(),
                expect.anything(),
                ApiId.loadExternalTokens
            );

            // Verify id token is cached with preferred_cache environment
            expect(idSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    environment: "login.windows.net",
                }),
                expect.anything(),
                expect.anything()
            );

            // Verify refresh token is cached with preferred_cache environment
            expect(refreshSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    environment: "login.windows.net",
                }),
                expect.anything(),
                expect.anything()
            );
        });

        describe("telemetry", () => {
            it("emits loadExternalTokens as a top-level telemetry event", async () => {
                const testAppConfig = {
                    auth: {
                        clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                    },
                };
                const perfClient = new BrowserPerformanceClient(testAppConfig);

                const request: SilentRequest = {
                    scopes: TEST_CONFIG.DEFAULT_SCOPES,
                    account: {
                        homeAccountId: testHomeAccountId,
                        environment: testEnvironment,
                        tenantId: TEST_CONFIG.TENANT,
                        username: ID_TOKEN_CLAIMS.preferred_username,
                        localAccountId: ID_TOKEN_CLAIMS.oid,
                        loginHint: ID_TOKEN_CLAIMS.login_hint,
                    },
                };
                const response: ExternalTokenResponse = {
                    id_token: testIdToken,
                    access_token: testAccessToken,
                    refresh_token: testRefreshToken,
                    expires_in: TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN,
                };
                const options: LoadTokenOptions = {};

                const eventPromise = new Promise<PerformanceEvent>(
                    (resolve) => {
                        // @ts-ignore
                        const callbackId = perfClient.addPerformanceCallback(
                            (events: PerformanceEvent[]) => {
                                const loadExternalTokensEvent = events.find(
                                    (e) =>
                                        e.name ===
                                        BrowserRootPerformanceEvents.LoadExternalTokens
                                );
                                if (loadExternalTokensEvent) {
                                    // @ts-ignore
                                    perfClient.removePerformanceCallback(
                                        callbackId
                                    );
                                    resolve(loadExternalTokensEvent);
                                }
                            }
                        );
                    }
                );

                await loadExternalTokens(
                    configuration,
                    request,
                    response,
                    options,
                    perfClient
                );

                const event = await eventPromise;
                expect(event.success).toBe(true);
                expect(event.correlationId).toBeDefined();
                expect(event.durationMs).toBeGreaterThanOrEqual(0);
            });

            it("instruments internal functions with telemetry (loadAccount, loadIdToken, loadAccessToken, loadRefreshToken)", async () => {
                const testAppConfig = {
                    auth: {
                        clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                    },
                };
                const perfClient = new BrowserPerformanceClient(testAppConfig);

                // Spy on startMeasurement to verify sub-measurements are being tracked
                const startMeasurementSpy = jest.spyOn(
                    perfClient,
                    "startMeasurement"
                );

                const request: SilentRequest = {
                    scopes: TEST_CONFIG.DEFAULT_SCOPES,
                    account: {
                        homeAccountId: testHomeAccountId,
                        environment: testEnvironment,
                        tenantId: TEST_CONFIG.TENANT,
                        username: ID_TOKEN_CLAIMS.preferred_username,
                        localAccountId: ID_TOKEN_CLAIMS.oid,
                        loginHint: ID_TOKEN_CLAIMS.login_hint,
                    },
                };
                const response: ExternalTokenResponse = {
                    id_token: testIdToken,
                    access_token: testAccessToken,
                    refresh_token: testRefreshToken,
                    expires_in: TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN,
                };
                const options: LoadTokenOptions = {};

                await loadExternalTokens(
                    configuration,
                    request,
                    response,
                    options,
                    perfClient
                );

                // Verify that startMeasurement was called for each sub-measurement
                const measurementCalls = startMeasurementSpy.mock.calls.map(
                    (call) => call[0]
                );

                expect(measurementCalls).toContain(
                    BrowserRootPerformanceEvents.LoadExternalTokens
                );
                expect(measurementCalls).toContain(
                    BrowserPerformanceEvents.LoadAccount
                );
                expect(measurementCalls).toContain(
                    BrowserPerformanceEvents.LoadIdToken
                );
                expect(measurementCalls).toContain(
                    BrowserPerformanceEvents.LoadAccessToken
                );
                expect(measurementCalls).toContain(
                    BrowserPerformanceEvents.LoadRefreshToken
                );
            });

            it("instruments loadAccount sub-measurement when using request authority", async () => {
                const testAppConfig = {
                    auth: {
                        clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                    },
                };
                const perfClient = new BrowserPerformanceClient(testAppConfig);

                // Spy on startMeasurement to verify loadAccount is being tracked
                const startMeasurementSpy = jest.spyOn(
                    perfClient,
                    "startMeasurement"
                );

                const request: SilentRequest = {
                    scopes: TEST_CONFIG.DEFAULT_SCOPES,
                    authority: `${TEST_URIS.DEFAULT_INSTANCE}${TEST_CONFIG.TENANT}`,
                };
                const response: ExternalTokenResponse = {
                    id_token: testIdToken,
                    client_info: testClientInfo,
                };
                const options: LoadTokenOptions = {};

                await loadExternalTokens(
                    configuration,
                    request,
                    response,
                    options,
                    perfClient
                );

                // Verify that startMeasurement was called for LoadAccount
                const measurementCalls = startMeasurementSpy.mock.calls.map(
                    (call) => call[0]
                );
                expect(measurementCalls).toContain(
                    BrowserPerformanceEvents.LoadAccount
                );
            });

            it("records failure in telemetry when error is thrown", async () => {
                const testAppConfig = {
                    auth: {
                        clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                    },
                };
                const perfClient = new BrowserPerformanceClient(testAppConfig);

                const request: SilentRequest = {
                    scopes: TEST_CONFIG.DEFAULT_SCOPES,
                    // No account or client info - should fail
                };
                const response: ExternalTokenResponse = {
                    access_token: testAccessToken,
                };
                const options: LoadTokenOptions = {};

                const eventPromise = new Promise<PerformanceEvent>(
                    (resolve) => {
                        // @ts-ignore
                        const callbackId = perfClient.addPerformanceCallback(
                            (events: PerformanceEvent[]) => {
                                const loadExternalTokensEvent = events.find(
                                    (e) =>
                                        e.name ===
                                        BrowserRootPerformanceEvents.LoadExternalTokens
                                );
                                if (loadExternalTokensEvent) {
                                    // @ts-ignore
                                    perfClient.removePerformanceCallback(
                                        callbackId
                                    );
                                    resolve(loadExternalTokensEvent);
                                }
                            }
                        );
                    }
                );

                await expect(
                    loadExternalTokens(
                        configuration,
                        request,
                        response,
                        options,
                        perfClient
                    )
                ).rejects.toThrow();

                const event = await eventPromise;
                expect(event.success).toBe(false);
                expect(event.correlationId).toBeDefined();
            });

            it("instruments all load functions even when tokens are not present in response", async () => {
                const testAppConfig = {
                    auth: {
                        clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                    },
                };
                const perfClient = new BrowserPerformanceClient(testAppConfig);

                // Spy on startMeasurement to verify which measurements are being tracked
                const startMeasurementSpy = jest.spyOn(
                    perfClient,
                    "startMeasurement"
                );

                const request: SilentRequest = {
                    scopes: TEST_CONFIG.DEFAULT_SCOPES,
                    account: {
                        homeAccountId: testHomeAccountId,
                        environment: testEnvironment,
                        tenantId: TEST_CONFIG.TENANT,
                        username: ID_TOKEN_CLAIMS.preferred_username,
                        localAccountId: ID_TOKEN_CLAIMS.oid,
                        loginHint: ID_TOKEN_CLAIMS.login_hint,
                    },
                };
                const response: ExternalTokenResponse = {
                    id_token: testIdToken,
                    // Only id token, no access token or refresh token
                };
                const options: LoadTokenOptions = {};

                await loadExternalTokens(
                    configuration,
                    request,
                    response,
                    options,
                    perfClient
                );

                // Verify all load functions are instrumented, even if they return null
                const measurementCalls = startMeasurementSpy.mock.calls.map(
                    (call) => call[0]
                );

                // All load functions should be instrumented
                expect(measurementCalls).toContain(
                    BrowserRootPerformanceEvents.LoadExternalTokens
                );
                expect(measurementCalls).toContain(
                    BrowserPerformanceEvents.LoadAccount
                );
                expect(measurementCalls).toContain(
                    BrowserPerformanceEvents.LoadIdToken
                );
                expect(measurementCalls).toContain(
                    BrowserPerformanceEvents.LoadAccessToken
                );
                expect(measurementCalls).toContain(
                    BrowserPerformanceEvents.LoadRefreshToken
                );
            });
        });
    });
});
