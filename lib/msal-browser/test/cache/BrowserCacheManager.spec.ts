/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { BrowserAuthErrorMessage } from "../../src/error/BrowserAuthError.js";
import {
    TEST_CONFIG,
    TEST_TOKENS,
    TEST_DATA_CLIENT_INFO,
    RANDOM_TEST_GUID,
    TEST_URIS,
    TEST_STATE_VALUES,
    DEFAULT_OPENID_CONFIG_RESPONSE,
} from "../utils/StringConstants.js";
import { CacheOptions } from "../../src/config/Configuration.js";
import {
    Constants,
    PersistentCacheKeys,
    CommonAuthorizationCodeRequest as AuthorizationCodeRequest,
    ProtocolUtils,
    Logger,
    LogLevel,
    AuthenticationScheme,
    AuthorityMetadataEntity,
    AccountEntity,
    Authority,
    StubbedNetworkModule,
    AuthToken,
    AppMetadataEntity,
    ServerTelemetryEntity,
    ThrottlingEntity,
    CredentialType,
    ProtocolMode,
    CacheHelpers,
    CacheError,
    CacheErrorCodes,
    CacheManager,
    CacheRecord,
    PerformanceEvent,
} from "@azure/msal-common";
import {
    BrowserCacheLocation,
    InteractionType,
    TemporaryCacheKeys,
} from "../../src/utils/BrowserConstants.js";
import { CryptoOps } from "../../src/crypto/CryptoOps.js";
import { DatabaseStorage } from "../../src/cache/DatabaseStorage.js";
import { BrowserCacheManager } from "../../src/cache/BrowserCacheManager.js";
import { BrowserStateObject } from "../../src/utils/BrowserProtocolUtils.js";
import { base64Decode } from "../../src/encode/Base64Decode.js";
import { getDefaultPerformanceClient } from "../utils/TelemetryUtils.js";
import { BrowserPerformanceClient } from "../../src/telemetry/BrowserPerformanceClient.js";

describe("BrowserCacheManager tests", () => {
    let cacheConfig: Required<CacheOptions>;
    let logger: Logger;
    let browserCrypto: CryptoOps;
    beforeEach(() => {
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
        browserCrypto = new CryptoOps(logger);
    });

    afterEach(() => {
        jest.restoreAllMocks();
        window.sessionStorage.clear();
        window.localStorage.clear();
    });

    describe("Constructor", () => {
        it("Falls back to memory storage if cache location string does not match localStorage or sessionStorage", () => {
            cacheConfig.cacheLocation = "notALocation";
            const cacheManager = new BrowserCacheManager(
                TEST_CONFIG.MSAL_CLIENT_ID,
                cacheConfig,
                browserCrypto,
                logger
            );
            cacheManager.setItem("key", "value");
            expect(window.localStorage.getItem("key")).toBeNull();
            expect(window.sessionStorage.getItem("key")).toBeNull();
            expect(cacheManager.getItem("key")).toBe("value");
        });

        it("Falls back to memory storage if storage is not supported", () => {
            // Test sessionStorage not supported
            // @ts-ignore
            jest.spyOn(window, "sessionStorage", "get").mockReturnValue(null);
            const sessionCache = new BrowserCacheManager(
                TEST_CONFIG.MSAL_CLIENT_ID,
                cacheConfig,
                browserCrypto,
                logger
            );
            sessionCache.setItem("key", "value");
            expect(sessionCache.getItem("key")).toBe("value");

            // Test local storage not supported
            // @ts-ignore
            jest.spyOn(window, "localStorage", "get").mockReturnValue(null);
            cacheConfig.cacheLocation = BrowserCacheLocation.LocalStorage;
            const localCache = new BrowserCacheManager(
                TEST_CONFIG.MSAL_CLIENT_ID,
                cacheConfig,
                browserCrypto,
                logger
            );
            localCache.setItem("key", "value");
            expect(localCache.getItem("key")).toBe("value");
        });

        it("Creates a BrowserStorage object that implements the ICacheStorage interface", () => {
            const browserStorage = new BrowserCacheManager(
                TEST_CONFIG.MSAL_CLIENT_ID,
                cacheConfig,
                browserCrypto,
                logger
            );
            expect(browserStorage.setItem).not.toBeNull();
            expect(browserStorage.getItem).not.toBeNull();
            expect(browserStorage.removeItem).not.toBeNull();
            expect(browserStorage.getKeys).not.toBeNull();
            expect(browserStorage.clear).not.toBeNull();
        });

        it("Migrates cache entries from the old cache format", () => {
            const migrationCacheConfig = {
                ...cacheConfig,
                cacheMigrationEnabled: true,
            };
            const idTokenKey = `${Constants.CACHE_PREFIX}.${PersistentCacheKeys.ID_TOKEN}`;
            const clientInfoKey = `${Constants.CACHE_PREFIX}.${PersistentCacheKeys.CLIENT_INFO}`;
            const errorKey = `${Constants.CACHE_PREFIX}.${PersistentCacheKeys.ERROR}`;
            const errorDescKey = `${Constants.CACHE_PREFIX}.${PersistentCacheKeys.ERROR_DESC}`;
            const errorKeyVal = "error_code";
            const errorDescVal = "error occurred";
            window.sessionStorage.setItem(idTokenKey, TEST_TOKENS.IDTOKEN_V2);
            window.sessionStorage.setItem(
                clientInfoKey,
                TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO
            );
            window.sessionStorage.setItem(errorKey, errorKeyVal);
            window.sessionStorage.setItem(errorDescKey, errorDescVal);

            const browserStorage = new BrowserCacheManager(
                TEST_CONFIG.MSAL_CLIENT_ID,
                migrationCacheConfig,
                browserCrypto,
                logger
            );
            expect(window.sessionStorage.getItem(idTokenKey)).toBe(
                TEST_TOKENS.IDTOKEN_V2
            );
            expect(window.sessionStorage.getItem(clientInfoKey)).toBe(
                TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO
            );
            expect(window.sessionStorage.getItem(errorKey)).toBe(errorKeyVal);
            expect(window.sessionStorage.getItem(errorDescKey)).toBe(
                errorDescVal
            );
            expect(
                browserStorage.getTemporaryCache(
                    PersistentCacheKeys.ID_TOKEN,
                    true
                )
            ).toBe(TEST_TOKENS.IDTOKEN_V2);
            expect(
                browserStorage.getTemporaryCache(
                    PersistentCacheKeys.CLIENT_INFO,
                    true
                )
            ).toBe(TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO);
            expect(
                browserStorage.getTemporaryCache(
                    PersistentCacheKeys.ERROR,
                    true
                )
            ).toBe(errorKeyVal);
            expect(
                browserStorage.getTemporaryCache(
                    PersistentCacheKeys.ERROR_DESC,
                    true
                )
            ).toBe(errorDescVal);
        });

        it("Adds existing tokens to token key map on initialization", () => {
            // Pre-populate localstorage with tokens
            const testIdToken = CacheHelpers.createIdTokenEntity(
                "homeAccountId",
                "environment",
                TEST_TOKENS.IDTOKEN_V2,
                TEST_CONFIG.MSAL_CLIENT_ID,
                "tenantId"
            );
            const testAccessToken = CacheHelpers.createAccessTokenEntity(
                "homeAccountId",
                "environment",
                TEST_TOKENS.ACCESS_TOKEN,
                TEST_CONFIG.MSAL_CLIENT_ID,
                "tenantId",
                "scope",
                1000,
                1000,
                browserCrypto.base64Decode
            );
            const testRefreshToken = CacheHelpers.createRefreshTokenEntity(
                "homeAccountId",
                "environment",
                TEST_TOKENS.REFRESH_TOKEN,
                TEST_CONFIG.MSAL_CLIENT_ID
            );
            window.localStorage.setItem(
                CacheHelpers.generateCredentialKey(testIdToken),
                JSON.stringify(testIdToken)
            );
            window.localStorage.setItem(
                CacheHelpers.generateCredentialKey(testAccessToken),
                JSON.stringify(testAccessToken)
            );
            window.localStorage.setItem(
                CacheHelpers.generateCredentialKey(testRefreshToken),
                JSON.stringify(testRefreshToken)
            );

            // Validate that tokens are not added to token key map when cacheMigration is false
            const initialStorage = new BrowserCacheManager(
                TEST_CONFIG.MSAL_CLIENT_ID,
                {
                    cacheLocation: BrowserCacheLocation.LocalStorage,
                    temporaryCacheLocation: BrowserCacheLocation.LocalStorage,
                    storeAuthStateInCookie: false,
                    secureCookies: false,
                    cacheMigrationEnabled: false,
                    claimsBasedCachingEnabled: false,
                },
                browserCrypto,
                logger
            );
            expect(initialStorage.getTokenKeys().idToken.length).toBe(0);
            expect(initialStorage.getTokenKeys().accessToken.length).toBe(0);
            expect(initialStorage.getTokenKeys().refreshToken.length).toBe(0);

            // Validate that tokens are added to token key map when cacheMigration is true
            const migrationStorage = new BrowserCacheManager(
                TEST_CONFIG.MSAL_CLIENT_ID,
                {
                    cacheLocation: BrowserCacheLocation.LocalStorage,
                    temporaryCacheLocation: BrowserCacheLocation.LocalStorage,
                    storeAuthStateInCookie: false,
                    secureCookies: false,
                    cacheMigrationEnabled: true,
                    claimsBasedCachingEnabled: false,
                },
                browserCrypto,
                logger
            );
            expect(migrationStorage.getTokenKeys().idToken.length).toBe(1);
            expect(migrationStorage.getTokenKeys().accessToken.length).toBe(1);
            expect(migrationStorage.getTokenKeys().refreshToken.length).toBe(1);
        });

        it("Does not add tokens for other clientIds to token key map", () => {
            // Pre-populate localstorage with tokens
            const testIdToken = CacheHelpers.createIdTokenEntity(
                "homeAccountId",
                "environment",
                TEST_TOKENS.IDTOKEN_V2,
                "other-client-id",
                "tenantId"
            );
            const testAccessToken = CacheHelpers.createAccessTokenEntity(
                "homeAccountId",
                "environment",
                TEST_TOKENS.ACCESS_TOKEN,
                "other-client-id",
                "tenantId",
                "scope",
                1000,
                1000,
                browserCrypto.base64Decode
            );
            const testRefreshToken = CacheHelpers.createRefreshTokenEntity(
                "homeAccountId",
                "environment",
                TEST_TOKENS.REFRESH_TOKEN,
                "other-client-id"
            );
            window.localStorage.setItem(
                CacheHelpers.generateCredentialKey(testIdToken),
                JSON.stringify(testIdToken)
            );
            window.localStorage.setItem(
                CacheHelpers.generateCredentialKey(testAccessToken),
                JSON.stringify(testAccessToken)
            );
            window.localStorage.setItem(
                CacheHelpers.generateCredentialKey(testRefreshToken),
                JSON.stringify(testRefreshToken)
            );

            // Validate that tokens are added to token key map when cacheMigration is true
            const migrationStorage = new BrowserCacheManager(
                TEST_CONFIG.MSAL_CLIENT_ID,
                {
                    cacheLocation: BrowserCacheLocation.LocalStorage,
                    temporaryCacheLocation: BrowserCacheLocation.LocalStorage,
                    storeAuthStateInCookie: false,
                    secureCookies: false,
                    cacheMigrationEnabled: true,
                    claimsBasedCachingEnabled: false,
                },
                browserCrypto,
                logger
            );
            expect(migrationStorage.getTokenKeys().idToken.length).toBe(0);
            expect(migrationStorage.getTokenKeys().accessToken.length).toBe(0);
            expect(migrationStorage.getTokenKeys().refreshToken.length).toBe(0);
        });

        it("Adds existing accounts to account key map on initialization", () => {
            const browserSessionStorage = new BrowserCacheManager(
                TEST_CONFIG.MSAL_CLIENT_ID,
                cacheConfig,
                browserCrypto,
                logger
            );
            const authority = new Authority(
                TEST_CONFIG.validAuthority,
                StubbedNetworkModule,
                browserSessionStorage,
                {
                    protocolMode: ProtocolMode.AAD,
                    authorityMetadata: "",
                    cloudDiscoveryMetadata: "",
                    knownAuthorities: [],
                },
                logger,
                TEST_CONFIG.CORRELATION_ID
            );
            // Pre-populate localstorage with accounts
            const testAccount = AccountEntity.createAccount(
                {
                    homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                    idTokenClaims: AuthToken.extractTokenClaims(
                        TEST_TOKENS.IDTOKEN_V2,
                        base64Decode
                    ),
                    clientInfo: TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO,
                    environment: "environment",
                },
                authority
            );
            window.localStorage.setItem(
                testAccount.generateAccountKey(),
                JSON.stringify(testAccount)
            );

            // Validate that accounts are not added to account key map when cacheMigration is false
            const initialStorage = new BrowserCacheManager(
                TEST_CONFIG.MSAL_CLIENT_ID,
                {
                    cacheLocation: BrowserCacheLocation.LocalStorage,
                    temporaryCacheLocation: BrowserCacheLocation.LocalStorage,
                    storeAuthStateInCookie: false,
                    secureCookies: false,
                    cacheMigrationEnabled: false,
                    claimsBasedCachingEnabled: false,
                },
                browserCrypto,
                logger
            );
            expect(initialStorage.getAccountKeys().length).toBe(0);

            // Validate that accounts are added to account key map when cacheMigration is true
            const migrationStorage = new BrowserCacheManager(
                TEST_CONFIG.MSAL_CLIENT_ID,
                {
                    cacheLocation: BrowserCacheLocation.LocalStorage,
                    temporaryCacheLocation: BrowserCacheLocation.LocalStorage,
                    storeAuthStateInCookie: false,
                    secureCookies: false,
                    cacheMigrationEnabled: true,
                    claimsBasedCachingEnabled: false,
                },
                browserCrypto,
                logger
            );
            expect(migrationStorage.getAccountKeys().length).toBe(1);
        });
    });

    describe("Interface functions", () => {
        let browserSessionStorage: BrowserCacheManager;
        let authority: Authority;
        let browserLocalStorage: BrowserCacheManager;
        let cacheVal: string;
        let msalCacheKey: string;
        let msalCacheKey2: string;
        beforeEach(() => {
            browserSessionStorage = new BrowserCacheManager(
                TEST_CONFIG.MSAL_CLIENT_ID,
                cacheConfig,
                browserCrypto,
                logger
            );
            authority = new Authority(
                TEST_CONFIG.validAuthority,
                StubbedNetworkModule,
                browserSessionStorage,
                {
                    protocolMode: ProtocolMode.AAD,
                    authorityMetadata: "",
                    cloudDiscoveryMetadata: "",
                    knownAuthorities: [],
                },
                logger,
                TEST_CONFIG.CORRELATION_ID
            );
            jest.spyOn(
                Authority.prototype,
                "getPreferredCache"
            ).mockReturnValue("login.microsoftonline.com");
            cacheConfig.cacheLocation = BrowserCacheLocation.LocalStorage;
            browserLocalStorage = new BrowserCacheManager(
                TEST_CONFIG.MSAL_CLIENT_ID,
                cacheConfig,
                browserCrypto,
                logger
            );
            cacheVal = "cacheVal";
            msalCacheKey = browserSessionStorage.generateCacheKey("cacheKey");
            msalCacheKey2 = browserSessionStorage.generateCacheKey("cacheKey2");
        });

        afterEach(async () => {
            await browserSessionStorage.clear();
            await browserLocalStorage.clear();
        });

        it("setTemporaryCache", () => {
            browserSessionStorage.setTemporaryCache("cacheKey", cacheVal, true);
            browserLocalStorage.setTemporaryCache("cacheKey2", cacheVal, true);
            expect(window.sessionStorage.getItem(msalCacheKey)).toBe(cacheVal);
            expect(window.sessionStorage.getItem(msalCacheKey2)).toBe(cacheVal);
        });

        it("getTemporaryCache falls back to local storage if not found in session/memory storage", () => {
            const testTempItemKey = "test-temp-item-key";
            const testTempItemValue = "test-temp-item-value";
            window.localStorage.setItem(testTempItemKey, testTempItemValue);
            cacheConfig.cacheLocation = BrowserCacheLocation.LocalStorage;
            browserLocalStorage = new BrowserCacheManager(
                TEST_CONFIG.MSAL_CLIENT_ID,
                cacheConfig,
                browserCrypto,
                logger
            );
            expect(browserLocalStorage.getTemporaryCache(testTempItemKey)).toBe(
                testTempItemValue
            );
        });

        it("setItem", () => {
            window.sessionStorage.setItem(msalCacheKey, cacheVal);
            window.localStorage.setItem(msalCacheKey2, cacheVal);
            expect(browserSessionStorage.getItem(msalCacheKey)).toBe(cacheVal);
            expect(browserLocalStorage.getItem(msalCacheKey2)).toBe(cacheVal);
        });

        it("removeItem()", () => {
            browserSessionStorage.setTemporaryCache("cacheKey", cacheVal, true);
            browserLocalStorage.setTemporaryCache("cacheKey", cacheVal, true);
            browserSessionStorage.removeItem(msalCacheKey);
            browserLocalStorage.removeItem(msalCacheKey);
            expect(window.sessionStorage.getItem(msalCacheKey)).toBeNull();
            expect(window.localStorage.getItem(msalCacheKey)).toBeNull();
            expect(
                browserLocalStorage.getTemporaryCache("cacheKey", true)
            ).toBeNull();
            expect(
                browserSessionStorage.getTemporaryCache("cacheKey", true)
            ).toBeNull();
        });

        it("getKeys()", () => {
            browserLocalStorage.setItem(msalCacheKey, cacheVal);
            browserLocalStorage.setItem(msalCacheKey2, cacheVal);
            expect(browserLocalStorage.getKeys()).toEqual([
                msalCacheKey,
                msalCacheKey2,
            ]);
        });

        it("clear()", async () => {
            browserSessionStorage.setTemporaryCache("cacheKey", cacheVal, true);
            browserLocalStorage.setTemporaryCache("cacheKey", cacheVal, true);
            await browserSessionStorage.clear();
            await browserLocalStorage.clear();
            expect(browserSessionStorage.getKeys()).toHaveLength(0);
            expect(browserLocalStorage.getKeys()).toHaveLength(0);
        });

        describe("Getters and Setters", () => {
            describe("Account", () => {
                it("getAccount returns null if key not in cache", () => {
                    const key = "not-in-cache";
                    expect(browserSessionStorage.getAccount(key)).toBeNull();
                    expect(browserLocalStorage.getAccount(key)).toBeNull();
                });

                it("getAccount returns null if value is not JSON", () => {
                    const key = "testKey";
                    browserLocalStorage.setItem(key, "this is not json");
                    browserSessionStorage.setItem(key, "this is not json");

                    expect(browserSessionStorage.getAccount(key)).toBeNull();
                    expect(browserLocalStorage.getAccount(key)).toBeNull();
                });

                it("getAccount returns null if value is not account entity", () => {
                    const key = "testKey";
                    const partialAccount = {
                        homeAccountId: "home-accountId",
                    };

                    browserLocalStorage.setItem(
                        key,
                        JSON.stringify(partialAccount)
                    );
                    browserSessionStorage.setItem(
                        key,
                        JSON.stringify(partialAccount)
                    );

                    expect(browserSessionStorage.getAccount(key)).toBeNull();
                    expect(browserLocalStorage.getAccount(key)).toBeNull();
                });

                it("getAccount returns AccountEntity", () => {
                    const testAccount = AccountEntity.createAccount(
                        {
                            homeAccountId: "homeAccountId",
                            idTokenClaims: AuthToken.extractTokenClaims(
                                TEST_TOKENS.IDTOKEN_V2,
                                base64Decode
                            ),
                            clientInfo:
                                TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO,
                            cloudGraphHostName: "cloudGraphHost",
                            msGraphHost: "msGraphHost",
                        },
                        authority
                    );

                    browserLocalStorage.setAccount(testAccount);
                    browserSessionStorage.setAccount(testAccount);

                    expect(
                        browserSessionStorage.getAccount(
                            testAccount.generateAccountKey()
                        )
                    ).toEqual(testAccount);
                    expect(
                        browserSessionStorage.getAccount(
                            testAccount.generateAccountKey()
                        )
                    ).toBeInstanceOf(AccountEntity);
                    expect(
                        browserLocalStorage.getAccount(
                            testAccount.generateAccountKey()
                        )
                    ).toEqual(testAccount);
                    expect(
                        browserLocalStorage.getAccount(
                            testAccount.generateAccountKey()
                        )
                    ).toBeInstanceOf(AccountEntity);
                });
            });

            describe("IdTokenCredential", () => {
                it("getIdTokenCredential returns null if key not in cache", () => {
                    const key = "not-in-cache";
                    expect(
                        browserSessionStorage.getIdTokenCredential(key)
                    ).toBeNull();
                    expect(
                        browserLocalStorage.getIdTokenCredential(key)
                    ).toBeNull();
                });

                it("getIdTokenCredential returns null if value is not JSON", () => {
                    const key = "testKey";
                    browserLocalStorage.setItem(key, "this is not json");
                    browserSessionStorage.setItem(key, "this is not json");

                    expect(
                        browserSessionStorage.getIdTokenCredential(key)
                    ).toBeNull();
                    expect(
                        browserLocalStorage.getIdTokenCredential(key)
                    ).toBeNull();
                });

                it("getIdTokenCredential returns null if value is not idToken entity", () => {
                    const key = "testKey";
                    const partialIdTokenEntity = {
                        homeAccountId: "home-accountId",
                    };

                    browserLocalStorage.setItem(
                        key,
                        JSON.stringify(partialIdTokenEntity)
                    );
                    browserSessionStorage.setItem(
                        key,
                        JSON.stringify(partialIdTokenEntity)
                    );

                    expect(
                        browserSessionStorage.getIdTokenCredential(key)
                    ).toBeNull();
                    expect(
                        browserLocalStorage.getIdTokenCredential(key)
                    ).toBeNull();
                });

                it("getIdTokenCredential returns IdTokenEntity", () => {
                    const testIdToken = CacheHelpers.createIdTokenEntity(
                        "homeAccountId",
                        "environment",
                        TEST_TOKENS.IDTOKEN_V2,
                        "client-id",
                        "tenantId"
                    );

                    browserLocalStorage.setIdTokenCredential(testIdToken);
                    browserSessionStorage.setIdTokenCredential(testIdToken);

                    expect(
                        browserSessionStorage.getIdTokenCredential(
                            CacheHelpers.generateCredentialKey(testIdToken)
                        )
                    ).toEqual(testIdToken);
                    expect(
                        browserLocalStorage.getIdTokenCredential(
                            CacheHelpers.generateCredentialKey(testIdToken)
                        )
                    ).toEqual(testIdToken);
                });
            });

            describe("AccessTokenCredential", () => {
                it("getAccessTokenCredential returns null if key not in cache", () => {
                    const key = "not-in-cache";
                    expect(
                        browserSessionStorage.getAccessTokenCredential(key)
                    ).toBeNull();
                    expect(
                        browserLocalStorage.getAccessTokenCredential(key)
                    ).toBeNull();
                });

                it("getAccessTokenCredential returns null if value is not JSON", () => {
                    const key = "testKey";
                    browserLocalStorage.setItem(key, "this is not json");
                    browserSessionStorage.setItem(key, "this is not json");

                    expect(
                        browserSessionStorage.getAccessTokenCredential(key)
                    ).toBeNull();
                    expect(
                        browserLocalStorage.getAccessTokenCredential(key)
                    ).toBeNull();
                });

                it("getAccessTokenCredential returns null if value is not accessToken entity", () => {
                    const key = "testKey";
                    const partialAccessTokenEntity = {
                        homeAccountId: "home-accountId",
                    };

                    browserLocalStorage.setItem(
                        key,
                        JSON.stringify(partialAccessTokenEntity)
                    );
                    browserSessionStorage.setItem(
                        key,
                        JSON.stringify(partialAccessTokenEntity)
                    );

                    expect(
                        browserSessionStorage.getAccessTokenCredential(key)
                    ).toBeNull();
                    expect(
                        browserLocalStorage.getAccessTokenCredential(key)
                    ).toBeNull();
                });

                it("getAccessTokenCredential returns AccessTokenEntity", () => {
                    const testAccessToken =
                        CacheHelpers.createAccessTokenEntity(
                            "homeAccountId",
                            "environment",
                            TEST_TOKENS.ACCESS_TOKEN,
                            "client-id",
                            "tenantId",
                            "openid",
                            1000,
                            1000,
                            browserCrypto.base64Decode,
                            500,
                            AuthenticationScheme.BEARER,
                            "oboAssertion"
                        );

                    browserLocalStorage.setAccessTokenCredential(
                        testAccessToken
                    );
                    browserSessionStorage.setAccessTokenCredential(
                        testAccessToken
                    );

                    expect(
                        browserSessionStorage.getAccessTokenCredential(
                            CacheHelpers.generateCredentialKey(testAccessToken)
                        )
                    ).toEqual(testAccessToken);
                    expect(
                        browserLocalStorage.getAccessTokenCredential(
                            CacheHelpers.generateCredentialKey(testAccessToken)
                        )
                    ).toEqual(testAccessToken);
                });

                it("getAccessTokenCredential returns Bearer access token when authentication scheme is set to Bearer and both a Bearer and pop token are in the cache", () => {
                    const testAccessTokenWithoutAuthScheme =
                        CacheHelpers.createAccessTokenEntity(
                            "homeAccountId",
                            "environment",
                            TEST_TOKENS.ACCESS_TOKEN,
                            "client-id",
                            "tenantId",
                            "openid",
                            1000,
                            1000,
                            browserCrypto.base64Decode,
                            500,
                            AuthenticationScheme.BEARER,
                            "oboAssertion"
                        );
                    const testAccessTokenWithAuthScheme =
                        CacheHelpers.createAccessTokenEntity(
                            "homeAccountId",
                            "environment",
                            TEST_TOKENS.POP_TOKEN,
                            "client-id",
                            "tenantId",
                            "openid",
                            1000,
                            1000,
                            browserCrypto.base64Decode,
                            500,
                            AuthenticationScheme.POP,
                            "oboAssertion"
                        );
                    // Cache bearer token
                    browserLocalStorage.setAccessTokenCredential(
                        testAccessTokenWithoutAuthScheme
                    );
                    browserSessionStorage.setAccessTokenCredential(
                        testAccessTokenWithoutAuthScheme
                    );
                });

                it("getAccessTokenCredential returns Bearer access token when authentication scheme is set to Bearer and both a Bearer and pop token are in the cache", () => {
                    const testAccessTokenWithoutAuthScheme =
                        CacheHelpers.createAccessTokenEntity(
                            "homeAccountId",
                            "environment",
                            TEST_TOKENS.ACCESS_TOKEN,
                            "client-id",
                            "tenantId",
                            "openid",
                            1000,
                            1000,
                            browserCrypto.base64Decode,
                            500,
                            AuthenticationScheme.BEARER,
                            "oboAssertion"
                        );
                    const testAccessTokenWithAuthScheme =
                        CacheHelpers.createAccessTokenEntity(
                            "homeAccountId",
                            "environment",
                            TEST_TOKENS.POP_TOKEN,
                            "client-id",
                            "tenantId",
                            "openid",
                            1000,
                            1000,
                            browserCrypto.base64Decode,
                            500,
                            AuthenticationScheme.POP,
                            "oboAssertion"
                        );
                    // Cache bearer token
                    browserLocalStorage.setAccessTokenCredential(
                        testAccessTokenWithoutAuthScheme
                    );
                    browserSessionStorage.setAccessTokenCredential(
                        testAccessTokenWithoutAuthScheme
                    );

                    // Cache pop token
                    browserLocalStorage.setAccessTokenCredential(
                        testAccessTokenWithAuthScheme
                    );
                    browserSessionStorage.setAccessTokenCredential(
                        testAccessTokenWithAuthScheme
                    );

                    expect(
                        browserSessionStorage.getAccessTokenCredential(
                            CacheHelpers.generateCredentialKey(
                                testAccessTokenWithoutAuthScheme
                            )
                        )
                    ).toEqual(testAccessTokenWithoutAuthScheme);
                    expect(
                        browserSessionStorage.getAccessTokenCredential(
                            CacheHelpers.generateCredentialKey(
                                testAccessTokenWithoutAuthScheme
                            )
                        )?.credentialType
                    ).toBe(CredentialType.ACCESS_TOKEN);
                    expect(
                        browserLocalStorage.getAccessTokenCredential(
                            CacheHelpers.generateCredentialKey(
                                testAccessTokenWithoutAuthScheme
                            )
                        )
                    ).toEqual(testAccessTokenWithoutAuthScheme);
                    expect(
                        browserLocalStorage.getAccessTokenCredential(
                            CacheHelpers.generateCredentialKey(
                                testAccessTokenWithoutAuthScheme
                            )
                        )?.credentialType
                    ).toBe(CredentialType.ACCESS_TOKEN);
                });

                it("getAccessTokenCredential returns PoP access token when authentication scheme is set to pop and both a Bearer and pop token are in the cache", () => {
                    const testAccessTokenWithoutAuthScheme =
                        CacheHelpers.createAccessTokenEntity(
                            "homeAccountId",
                            "environment",
                            TEST_TOKENS.ACCESS_TOKEN,
                            "client-id",
                            "tenantId",
                            "openid",
                            1000,
                            1000,
                            browserCrypto.base64Decode,
                            500,
                            AuthenticationScheme.BEARER,
                            "oboAssertion"
                        );
                    const testAccessTokenWithAuthScheme =
                        CacheHelpers.createAccessTokenEntity(
                            "homeAccountId",
                            "environment",
                            TEST_TOKENS.POP_TOKEN,
                            "client-id",
                            "tenantId",
                            "openid",
                            1000,
                            1000,
                            browserCrypto.base64Decode,
                            500,
                            AuthenticationScheme.POP,
                            "oboAssertion"
                        );
                    // Cache bearer token
                    browserLocalStorage.setAccessTokenCredential(
                        testAccessTokenWithoutAuthScheme
                    );
                    browserSessionStorage.setAccessTokenCredential(
                        testAccessTokenWithoutAuthScheme
                    );

                    // Cache pop token
                    browserLocalStorage.setAccessTokenCredential(
                        testAccessTokenWithAuthScheme
                    );
                    browserSessionStorage.setAccessTokenCredential(
                        testAccessTokenWithAuthScheme
                    );

                    expect(
                        browserSessionStorage.getAccessTokenCredential(
                            CacheHelpers.generateCredentialKey(
                                testAccessTokenWithAuthScheme
                            )
                        )
                    ).toEqual(testAccessTokenWithAuthScheme);
                    expect(
                        browserSessionStorage.getAccessTokenCredential(
                            CacheHelpers.generateCredentialKey(
                                testAccessTokenWithAuthScheme
                            )
                        )?.credentialType
                    ).toBe(CredentialType.ACCESS_TOKEN_WITH_AUTH_SCHEME);
                    expect(
                        browserLocalStorage.getAccessTokenCredential(
                            CacheHelpers.generateCredentialKey(
                                testAccessTokenWithAuthScheme
                            )
                        )
                    ).toEqual(testAccessTokenWithAuthScheme);
                    expect(
                        browserLocalStorage.getAccessTokenCredential(
                            CacheHelpers.generateCredentialKey(
                                testAccessTokenWithAuthScheme
                            )
                        )?.credentialType
                    ).toBe(CredentialType.ACCESS_TOKEN_WITH_AUTH_SCHEME);
                });

                it("clearTokensWithClaimsInCache clears all access tokens with claims in tokenKeys", () => {
                    const testAT1 = CacheHelpers.createAccessTokenEntity(
                        "homeAccountId1",
                        "environment",
                        "secret1",
                        "client-id",
                        "tenantId",
                        "openid",
                        1000,
                        1000,
                        browserCrypto.base64Decode,
                        500,
                        AuthenticationScheme.BEARER,
                        "oboAssertion"
                    );
                    const testAT2 = CacheHelpers.createAccessTokenEntity(
                        "homeAccountId2",
                        "environment",
                        "secret2",
                        "client-id",
                        "tenantId",
                        "openid",
                        1000,
                        1000,
                        browserCrypto.base64Decode,
                        500,
                        AuthenticationScheme.BEARER,
                        "oboAssertion",
                        undefined,
                        "claims",
                        "claims-hash"
                    );
                    const testAT3 = CacheHelpers.createAccessTokenEntity(
                        "homeAccountId3",
                        "environment",
                        "secret3",
                        "client-id",
                        "tenantId",
                        "openid",
                        1000,
                        1000,
                        browserCrypto.base64Decode,
                        500,
                        AuthenticationScheme.BEARER,
                        "oboAssertion",
                        undefined,
                        "claims"
                    );
                    const testAT4 = CacheHelpers.createAccessTokenEntity(
                        "homeAccountId4",
                        "environment",
                        "secret4",
                        "client-id",
                        "tenantId",
                        "openid",
                        1000,
                        1000,
                        browserCrypto.base64Decode,
                        500,
                        AuthenticationScheme.BEARER,
                        "oboAssertion",
                        undefined,
                        "claims",
                        "claims-Hash"
                    );

                    expect(browserLocalStorage.getTokenKeys()).toStrictEqual({
                        idToken: [],
                        accessToken: [],
                        refreshToken: [],
                    });

                    expect(browserSessionStorage.getTokenKeys()).toStrictEqual({
                        idToken: [],
                        accessToken: [],
                        refreshToken: [],
                    });

                    browserLocalStorage.setAccessTokenCredential(testAT1);
                    browserSessionStorage.setAccessTokenCredential(testAT1);
                    browserLocalStorage.setAccessTokenCredential(testAT2);
                    browserSessionStorage.setAccessTokenCredential(testAT2);
                    browserLocalStorage.setAccessTokenCredential(testAT3);
                    browserSessionStorage.setAccessTokenCredential(testAT3);
                    browserLocalStorage.setAccessTokenCredential(testAT4);
                    browserSessionStorage.setAccessTokenCredential(testAT4);

                    expect(browserLocalStorage.getTokenKeys()).toStrictEqual({
                        idToken: [],
                        accessToken: [
                            CacheHelpers.generateCredentialKey(testAT1),
                            CacheHelpers.generateCredentialKey(testAT2),
                            CacheHelpers.generateCredentialKey(testAT3),
                            CacheHelpers.generateCredentialKey(testAT4),
                        ],
                        refreshToken: [],
                    });

                    expect(browserSessionStorage.getTokenKeys()).toStrictEqual({
                        idToken: [],
                        accessToken: [
                            CacheHelpers.generateCredentialKey(testAT1),
                            CacheHelpers.generateCredentialKey(testAT2),
                            CacheHelpers.generateCredentialKey(testAT3),
                            CacheHelpers.generateCredentialKey(testAT4),
                        ],
                        refreshToken: [],
                    });

                    expect(
                        browserSessionStorage.getTokenKeys().accessToken.length
                    ).toBe(4);
                    expect(
                        browserLocalStorage.getTokenKeys().accessToken.length
                    ).toBe(4);

                    expect(
                        browserSessionStorage.getAccessTokenCredential(
                            CacheHelpers.generateCredentialKey(testAT1)
                        )
                    ).toEqual(testAT1);
                    expect(
                        browserLocalStorage.getAccessTokenCredential(
                            CacheHelpers.generateCredentialKey(testAT1)
                        )
                    ).toEqual(testAT1);

                    expect(
                        browserSessionStorage.getAccessTokenCredential(
                            CacheHelpers.generateCredentialKey(testAT2)
                        )
                    ).toEqual(testAT2);
                    expect(
                        browserLocalStorage.getAccessTokenCredential(
                            CacheHelpers.generateCredentialKey(testAT2)
                        )
                    ).toEqual(testAT2);

                    expect(
                        browserSessionStorage.getAccessTokenCredential(
                            CacheHelpers.generateCredentialKey(testAT3)
                        )
                    ).toEqual(testAT3);
                    expect(
                        browserLocalStorage.getAccessTokenCredential(
                            CacheHelpers.generateCredentialKey(testAT3)
                        )
                    ).toEqual(testAT3);

                    expect(
                        browserSessionStorage.getAccessTokenCredential(
                            CacheHelpers.generateCredentialKey(testAT4)
                        )
                    ).toEqual(testAT4);
                    expect(
                        browserLocalStorage.getAccessTokenCredential(
                            CacheHelpers.generateCredentialKey(testAT4)
                        )
                    ).toEqual(testAT4);

                    browserSessionStorage.clearTokensAndKeysWithClaims(
                        getDefaultPerformanceClient(),
                        "test-correlation-id"
                    );
                    browserLocalStorage.clearTokensAndKeysWithClaims(
                        getDefaultPerformanceClient(),
                        "test-correlation-id"
                    );

                    expect(
                        browserSessionStorage.getAccessTokenCredential(
                            CacheHelpers.generateCredentialKey(testAT1)
                        )
                    ).toEqual(testAT1);
                    expect(
                        browserLocalStorage.getAccessTokenCredential(
                            CacheHelpers.generateCredentialKey(testAT1)
                        )
                    ).toEqual(testAT1);

                    expect(
                        browserSessionStorage.getAccessTokenCredential(
                            CacheHelpers.generateCredentialKey(testAT2)
                        )
                    ).toBeNull();
                    expect(
                        browserLocalStorage.getAccessTokenCredential(
                            CacheHelpers.generateCredentialKey(testAT2)
                        )
                    ).toBeNull();

                    expect(
                        browserSessionStorage.getAccessTokenCredential(
                            CacheHelpers.generateCredentialKey(testAT3)
                        )
                    ).toEqual(testAT3);
                    expect(
                        browserLocalStorage.getAccessTokenCredential(
                            CacheHelpers.generateCredentialKey(testAT3)
                        )
                    ).toEqual(testAT3);

                    expect(
                        browserSessionStorage.getAccessTokenCredential(
                            CacheHelpers.generateCredentialKey(testAT2)
                        )
                    ).toBeNull();
                    expect(
                        browserLocalStorage.getAccessTokenCredential(
                            CacheHelpers.generateCredentialKey(testAT2)
                        )
                    ).toBeNull();

                    expect(browserLocalStorage.getTokenKeys()).toStrictEqual({
                        idToken: [],
                        accessToken: [
                            CacheHelpers.generateCredentialKey(testAT1),
                            CacheHelpers.generateCredentialKey(testAT3),
                        ],
                        refreshToken: [],
                    });

                    expect(browserSessionStorage.getTokenKeys()).toStrictEqual({
                        idToken: [],
                        accessToken: [
                            CacheHelpers.generateCredentialKey(testAT1),
                            CacheHelpers.generateCredentialKey(testAT3),
                        ],
                        refreshToken: [],
                    });

                    expect(
                        browserSessionStorage.getTokenKeys().accessToken.length
                    ).toBe(2);
                    expect(
                        browserLocalStorage.getTokenKeys().accessToken.length
                    ).toBe(2);
                });
            });

            describe("RefreshTokenCredential", () => {
                it("getRefreshTokenCredential returns null if key not in cache", () => {
                    const key = "not-in-cache";
                    expect(
                        browserSessionStorage.getRefreshTokenCredential(key)
                    ).toBeNull();
                    expect(
                        browserLocalStorage.getRefreshTokenCredential(key)
                    ).toBeNull();
                });

                it("getRefreshTokenCredential returns null if value is not JSON", () => {
                    const key = "testKey";
                    browserLocalStorage.setItem(key, "this is not json");
                    browserSessionStorage.setItem(key, "this is not json");

                    expect(
                        browserSessionStorage.getRefreshTokenCredential(key)
                    ).toBeNull();
                    expect(
                        browserLocalStorage.getRefreshTokenCredential(key)
                    ).toBeNull();
                });

                it("getRefreshTokenCredential returns null if value is not refreshToken entity", () => {
                    const key = "testKey";
                    const partialRefreshTokenEntity = {
                        homeAccountId: "home-accountId",
                    };

                    browserLocalStorage.setItem(
                        key,
                        JSON.stringify(partialRefreshTokenEntity)
                    );
                    browserSessionStorage.setItem(
                        key,
                        JSON.stringify(partialRefreshTokenEntity)
                    );

                    expect(
                        browserSessionStorage.getRefreshTokenCredential(key)
                    ).toBeNull();
                    expect(
                        browserLocalStorage.getRefreshTokenCredential(key)
                    ).toBeNull();
                });

                it("getRefreshTokenCredential returns RefreshTokenEntity", () => {
                    const testRefreshToken =
                        CacheHelpers.createRefreshTokenEntity(
                            "homeAccountId",
                            "environment",
                            TEST_TOKENS.REFRESH_TOKEN,
                            "client-id",
                            "familyId",
                            "oboAssertion"
                        );

                    browserLocalStorage.setRefreshTokenCredential(
                        testRefreshToken
                    );
                    browserSessionStorage.setRefreshTokenCredential(
                        testRefreshToken
                    );

                    expect(
                        browserSessionStorage.getRefreshTokenCredential(
                            CacheHelpers.generateCredentialKey(testRefreshToken)
                        )
                    ).toEqual(testRefreshToken);
                    expect(
                        browserLocalStorage.getRefreshTokenCredential(
                            CacheHelpers.generateCredentialKey(testRefreshToken)
                        )
                    ).toEqual(testRefreshToken);
                });
            });

            describe("AppMetadata", () => {
                it("getAppMetadata returns null if key not in cache", () => {
                    const key = "not-in-cache";
                    expect(
                        browserSessionStorage.getAppMetadata(key)
                    ).toBeNull();
                    expect(browserLocalStorage.getAppMetadata(key)).toBeNull();
                });

                it("getAppMetadata returns null if value is not JSON", () => {
                    const key = "testKey";
                    browserLocalStorage.setItem(key, "this is not json");
                    browserSessionStorage.setItem(key, "this is not json");

                    expect(
                        browserSessionStorage.getAppMetadata(key)
                    ).toBeNull();
                    expect(browserLocalStorage.getAppMetadata(key)).toBeNull();
                });

                it("getAppMetadata returns null if value is not appMetadata entity", () => {
                    const key = "testKey";
                    const partialAppMetadataEntity = {
                        environment: "environment",
                    };

                    browserLocalStorage.setItem(
                        key,
                        JSON.stringify(partialAppMetadataEntity)
                    );
                    browserSessionStorage.setItem(
                        key,
                        JSON.stringify(partialAppMetadataEntity)
                    );

                    expect(
                        browserSessionStorage.getAppMetadata(key)
                    ).toBeNull();
                    expect(browserLocalStorage.getAppMetadata(key)).toBeNull();
                });

                it("getAppMetadata returns AppMetadataEntity", () => {
                    const testAppMetadata = {
                        clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                        environment: "login.microsoftonline.com",
                        familyId: "1",
                    };

                    browserLocalStorage.setAppMetadata(testAppMetadata);
                    browserSessionStorage.setAppMetadata(testAppMetadata);

                    expect(
                        browserSessionStorage.getAppMetadata(
                            CacheHelpers.generateAppMetadataKey(testAppMetadata)
                        )
                    ).toEqual(testAppMetadata);
                    expect(
                        browserLocalStorage.getAppMetadata(
                            CacheHelpers.generateAppMetadataKey(testAppMetadata)
                        )
                    ).toEqual(testAppMetadata);
                });
            });

            describe("ServerTelemetry", () => {
                it("getServerTelemetry returns null if key not in cache", () => {
                    const key = "not-in-cache";
                    expect(
                        browserSessionStorage.getServerTelemetry(key)
                    ).toBeNull();
                    expect(
                        browserLocalStorage.getServerTelemetry(key)
                    ).toBeNull();
                });

                it("getServerTelemetry returns null if value is not JSON", () => {
                    const key = "testKey";
                    browserLocalStorage.setItem(key, "this is not json");
                    browserSessionStorage.setItem(key, "this is not json");

                    expect(
                        browserSessionStorage.getServerTelemetry(key)
                    ).toBeNull();
                    expect(
                        browserLocalStorage.getServerTelemetry(key)
                    ).toBeNull();
                });

                it("getServerTelemetry returns null if value is not serverTelemetry entity", () => {
                    const key = "testKey";
                    const partialServerTelemetryEntity = {
                        apiId: 0,
                    };

                    browserLocalStorage.setItem(
                        key,
                        JSON.stringify(partialServerTelemetryEntity)
                    );
                    browserSessionStorage.setItem(
                        key,
                        JSON.stringify(partialServerTelemetryEntity)
                    );

                    expect(
                        browserSessionStorage.getServerTelemetry(key)
                    ).toBeNull();
                    expect(
                        browserLocalStorage.getServerTelemetry(key)
                    ).toBeNull();
                });

                it("getServerTelemetry returns ServerTelemetryEntity", () => {
                    const testKey = "server-telemetry-clientId";
                    const testVal = {
                        failedRequests: ["61|test-correlationId"],
                        errors: ["test_error"],
                        cacheHits: 2,
                    };

                    browserLocalStorage.setServerTelemetry(testKey, testVal);
                    browserSessionStorage.setServerTelemetry(testKey, testVal);

                    expect(
                        browserSessionStorage.getServerTelemetry(testKey)
                    ).toEqual(testVal);
                    expect(
                        browserLocalStorage.getServerTelemetry(testKey)
                    ).toEqual(testVal);
                });
            });

            describe("AuthorityMetadata", () => {
                const key = `authority-metadata-${TEST_CONFIG.MSAL_CLIENT_ID}-${Constants.DEFAULT_AUTHORITY_HOST}`;
                const testObj: AuthorityMetadataEntity = {
                    aliases: [Constants.DEFAULT_AUTHORITY_HOST],
                    preferred_cache: Constants.DEFAULT_AUTHORITY_HOST,
                    preferred_network: Constants.DEFAULT_AUTHORITY_HOST,
                    canonical_authority: Constants.DEFAULT_AUTHORITY,
                    authorization_endpoint:
                        //@ts-ignore
                        DEFAULT_OPENID_CONFIG_RESPONSE.body
                            .authorization_endpoint,
                    token_endpoint:
                        //@ts-ignore
                        DEFAULT_OPENID_CONFIG_RESPONSE.body.token_endpoint,
                    end_session_endpoint:
                        //@ts-ignore
                        DEFAULT_OPENID_CONFIG_RESPONSE.body
                            .end_session_endpoint,
                    issuer:
                        //@ts-ignore
                        DEFAULT_OPENID_CONFIG_RESPONSE.body.issuer,
                    jwks_uri:
                        //@ts-ignore
                        DEFAULT_OPENID_CONFIG_RESPONSE.body.jwks_uri,
                    aliasesFromNetwork: false,
                    endpointsFromNetwork: false,
                    expiresAt:
                        CacheHelpers.generateAuthorityMetadataExpiresAt(),
                };

                it("getAuthorityMetadata() returns null if key is not in cache", () => {
                    expect(
                        browserSessionStorage.getAuthorityMetadata(key)
                    ).toBeNull();
                    expect(
                        browserLocalStorage.getAuthorityMetadata(key)
                    ).toBeNull();
                });

                it("getAuthorityMetadata() returns null if isAuthorityMetadataEntity returns false", () => {
                    browserSessionStorage.setAuthorityMetadata(key, {
                        // @ts-ignore
                        invalidKey: "invalidValue",
                    });
                    browserLocalStorage.setAuthorityMetadata(key, {
                        // @ts-ignore
                        invalidKey: "invalidValue",
                    });
                    expect(
                        browserSessionStorage.getAuthorityMetadata(key)
                    ).toBeNull();
                    expect(
                        browserLocalStorage.getAuthorityMetadata(key)
                    ).toBeNull();
                    expect(
                        browserLocalStorage.getAuthorityMetadataKeys()
                    ).toEqual(expect.arrayContaining([key]));
                    expect(
                        browserSessionStorage.getAuthorityMetadataKeys()
                    ).toEqual(expect.arrayContaining([key]));
                });

                it("setAuthorityMetadata() and getAuthorityMetadata() sets and returns AuthorityMetadataEntity in-memory", () => {
                    browserSessionStorage.setAuthorityMetadata(key, testObj);
                    browserLocalStorage.setAuthorityMetadata(key, testObj);

                    expect(
                        browserSessionStorage.getAuthorityMetadata(key)
                    ).toEqual(testObj);
                    expect(
                        browserLocalStorage.getAuthorityMetadata(key)
                    ).toEqual(testObj);
                    expect(
                        browserLocalStorage.getAuthorityMetadataKeys()
                    ).toEqual(expect.arrayContaining([key]));
                    expect(
                        browserSessionStorage.getAuthorityMetadataKeys()
                    ).toEqual(expect.arrayContaining([key]));
                });

                it("clear() removes AuthorityMetadataEntity from in-memory storage", async () => {
                    browserSessionStorage.setAuthorityMetadata(key, testObj);
                    browserLocalStorage.setAuthorityMetadata(key, testObj);

                    expect(
                        browserSessionStorage.getAuthorityMetadata(key)
                    ).toEqual(testObj);
                    expect(
                        browserLocalStorage.getAuthorityMetadata(key)
                    ).toEqual(testObj);
                    expect(
                        browserLocalStorage.getAuthorityMetadataKeys()
                    ).toEqual(expect.arrayContaining([key]));
                    expect(
                        browserSessionStorage.getAuthorityMetadataKeys()
                    ).toEqual(expect.arrayContaining([key]));

                    await browserSessionStorage.clear();
                    await browserLocalStorage.clear();
                    expect(
                        browserSessionStorage.getAuthorityMetadata(key)
                    ).toBeNull();
                    expect(
                        browserLocalStorage.getAuthorityMetadata(key)
                    ).toBeNull();
                    expect(
                        browserLocalStorage.getAuthorityMetadataKeys().length
                    ).toBe(0);
                    expect(
                        browserSessionStorage.getAuthorityMetadataKeys().length
                    ).toBe(0);
                });
            });

            describe("ThrottlingCache", () => {
                it("getThrottlingCache returns null if key not in cache", () => {
                    const key = "not-in-cache";
                    expect(
                        browserSessionStorage.getServerTelemetry(key)
                    ).toBeNull();
                    expect(
                        browserLocalStorage.getServerTelemetry(key)
                    ).toBeNull();
                });

                it("getThrottlingCache returns null if value is not JSON", () => {
                    const key = "testKey";
                    browserLocalStorage.setItem(key, "this is not json");
                    browserSessionStorage.setItem(key, "this is not json");

                    expect(
                        browserSessionStorage.getThrottlingCache(key)
                    ).toBeNull();
                    expect(
                        browserLocalStorage.getThrottlingCache(key)
                    ).toBeNull();
                });

                it("getThrottlingCache returns null if value is not throttling entity", () => {
                    const key = "testKey";
                    const partialThrottlingEntity = {
                        error: "error",
                    };

                    browserLocalStorage.setItem(
                        key,
                        JSON.stringify(partialThrottlingEntity)
                    );
                    browserSessionStorage.setItem(
                        key,
                        JSON.stringify(partialThrottlingEntity)
                    );

                    expect(
                        browserSessionStorage.getThrottlingCache(key)
                    ).toBeNull();
                    expect(
                        browserLocalStorage.getThrottlingCache(key)
                    ).toBeNull();
                });

                it("getThrottlingCache returns ThrottlingEntity", () => {
                    const testKey = "throttling";
                    const testVal = {
                        throttleTime: 60,
                    };

                    browserLocalStorage.setThrottlingCache(testKey, testVal);
                    browserSessionStorage.setThrottlingCache(testKey, testVal);

                    expect(
                        browserSessionStorage.getThrottlingCache(testKey)
                    ).toEqual(testVal);

                    expect(
                        browserLocalStorage.getThrottlingCache(testKey)
                    ).toEqual(testVal);
                });
            });

            describe("saveCacheRecord", () => {
                it("saveCacheRecord re-throws and captures telemetry", (done) => {
                    const cacheError = new CacheError(
                        CacheErrorCodes.cacheQuotaExceededErrorCode
                    );
                    const testAppConfig = {
                        auth: {
                            clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                        },
                    };
                    const perfClient = new BrowserPerformanceClient(
                        testAppConfig
                    );

                    const testAccessToken =
                        CacheHelpers.createAccessTokenEntity(
                            "homeAccountId",
                            "environment",
                            TEST_TOKENS.ACCESS_TOKEN,
                            "client-id",
                            "tenantId",
                            "openid",
                            1000,
                            1000,
                            browserCrypto.base64Decode,
                            500,
                            AuthenticationScheme.BEARER,
                            "oboAssertion"
                        );

                    const cacheManager = new BrowserCacheManager(
                        TEST_CONFIG.MSAL_CLIENT_ID,
                        cacheConfig,
                        browserCrypto,
                        logger,
                        undefined,
                        perfClient
                    );
                    cacheManager.setAccessTokenCredential(testAccessToken);

                    jest.spyOn(
                        CacheManager.prototype,
                        "saveCacheRecord"
                    ).mockRejectedValue(cacheError);

                    // @ts-ignore
                    const callbackId = perfClient.addPerformanceCallback(
                        (events: PerformanceEvent[]) => {
                            expect(events.length).toEqual(1);
                            const event = events[0];
                            expect(event.name).toBe("test-measurement");
                            expect(event.correlationId).toEqual(
                                "test-correlation-id"
                            );
                            expect(event.success).toBeFalsy();
                            expect(event.errorCode).toEqual(
                                CacheErrorCodes.cacheQuotaExceededErrorCode
                            );
                            expect(event.cacheIdCount).toEqual(0);
                            expect(event.cacheRtCount).toEqual(0);
                            expect(event.cacheAtCount).toEqual(1);
                            // @ts-ignore
                            perfClient.removePerformanceCallback(callbackId);
                            done();
                        }
                    );

                    const measurement = perfClient.startMeasurement(
                        "test-measurement",
                        "test-correlation-id"
                    );

                    cacheManager
                        .saveCacheRecord({}, undefined, "test-correlation-id")
                        .then(() => {
                            throw new Error(
                                "saveCacheRecord should have thrown"
                            );
                        })
                        .catch((e) => {
                            expect(e).toBeInstanceOf(CacheError);
                            measurement.end({ success: false }, e);
                        });
                });
            });
        });
    });

    describe("Interface functions with overridden temporaryCacheLocation", () => {
        let browserSessionStorage: BrowserCacheManager;
        let authority: Authority;
        let browserLocalStorage: BrowserCacheManager;
        let cacheVal: string;
        let msalCacheKey: string;
        let msalCacheKey2: string;
        beforeEach(() => {
            browserSessionStorage = new BrowserCacheManager(
                TEST_CONFIG.MSAL_CLIENT_ID,
                cacheConfig,
                browserCrypto,
                logger
            );
            authority = new Authority(
                TEST_CONFIG.validAuthority,
                StubbedNetworkModule,
                browserSessionStorage,
                {
                    protocolMode: ProtocolMode.AAD,
                    authorityMetadata: "",
                    cloudDiscoveryMetadata: "",
                    knownAuthorities: [],
                },
                logger,
                TEST_CONFIG.CORRELATION_ID
            );
            jest.spyOn(
                Authority.prototype,
                "getPreferredCache"
            ).mockReturnValue("login.microsoftonline.com");
            cacheConfig.cacheLocation = BrowserCacheLocation.LocalStorage;
            cacheConfig.temporaryCacheLocation =
                BrowserCacheLocation.LocalStorage;
            browserLocalStorage = new BrowserCacheManager(
                TEST_CONFIG.MSAL_CLIENT_ID,
                cacheConfig,
                browserCrypto,
                logger
            );
            cacheVal = "cacheVal";
            msalCacheKey = browserSessionStorage.generateCacheKey("cacheKey");
            msalCacheKey2 = browserSessionStorage.generateCacheKey("cacheKey2");
        });

        afterEach(async () => {
            await browserSessionStorage.clear();
            await browserLocalStorage.clear();
        });

        it("setTemporaryCache", () => {
            browserSessionStorage.setTemporaryCache("cacheKey", cacheVal, true);
            browserLocalStorage.setTemporaryCache("cacheKey2", cacheVal, true);
            expect(window.sessionStorage.getItem(msalCacheKey)).toBe(cacheVal);
            expect(window.localStorage.getItem(msalCacheKey2)).toBe(cacheVal);
        });

        it("getTemporaryCache returns value from localStorage", () => {
            const testTempItemKey = "test-temp-item-key";
            const testTempItemValue = "test-temp-item-value";
            window.localStorage.setItem(testTempItemKey, testTempItemValue);
            cacheConfig.cacheLocation = BrowserCacheLocation.LocalStorage;
            browserLocalStorage = new BrowserCacheManager(
                TEST_CONFIG.MSAL_CLIENT_ID,
                cacheConfig,
                browserCrypto,
                logger
            );
            expect(browserLocalStorage.getTemporaryCache(testTempItemKey)).toBe(
                testTempItemValue
            );
        });

        it("removeItem()", () => {
            browserSessionStorage.setTemporaryCache("cacheKey", cacheVal, true);
            browserLocalStorage.setTemporaryCache("cacheKey", cacheVal, true);
            browserSessionStorage.removeItem(msalCacheKey);
            browserLocalStorage.removeItem(msalCacheKey);
            expect(window.sessionStorage.getItem(msalCacheKey)).toBeNull();
            expect(window.localStorage.getItem(msalCacheKey)).toBeNull();
            expect(
                browserLocalStorage.getTemporaryCache("cacheKey", true)
            ).toBeNull();
            expect(
                browserSessionStorage.getTemporaryCache("cacheKey", true)
            ).toBeNull();
        });

        it("clear()", async () => {
            browserSessionStorage.setTemporaryCache("cacheKey", cacheVal, true);
            browserLocalStorage.setTemporaryCache("cacheKey", cacheVal, true);
            await browserSessionStorage.clear();
            await browserLocalStorage.clear();
            expect(browserSessionStorage.getKeys()).toHaveLength(0);
            expect(browserLocalStorage.getKeys()).toHaveLength(0);
        });

        describe("Getters and Setters", () => {
            describe("Account", () => {
                it("getAccount returns null if key not in cache", () => {
                    const key = "not-in-cache";
                    expect(browserSessionStorage.getAccount(key)).toBeNull();
                    expect(browserLocalStorage.getAccount(key)).toBeNull();
                });

                it("getAccount returns null if value is not JSON", () => {
                    const key = "testKey";
                    browserLocalStorage.setItem(key, "this is not json");
                    browserSessionStorage.setItem(key, "this is not json");

                    expect(browserSessionStorage.getAccount(key)).toBeNull();
                    expect(browserLocalStorage.getAccount(key)).toBeNull();
                });

                it("getAccount returns null if value is not account entity", () => {
                    const key = "testKey";
                    const partialAccount = {
                        homeAccountId: "home-accountId",
                    };

                    browserLocalStorage.setItem(
                        key,
                        JSON.stringify(partialAccount)
                    );
                    browserSessionStorage.setItem(
                        key,
                        JSON.stringify(partialAccount)
                    );

                    expect(browserSessionStorage.getAccount(key)).toBeNull();
                    expect(browserLocalStorage.getAccount(key)).toBeNull();
                });

                it("getAccount returns AccountEntity", () => {
                    const testAccount = AccountEntity.createAccount(
                        {
                            homeAccountId: "homeAccountId",
                            idTokenClaims: AuthToken.extractTokenClaims(
                                TEST_TOKENS.IDTOKEN_V2,
                                base64Decode
                            ),
                            clientInfo:
                                TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO,
                            cloudGraphHostName: "cloudGraphHost",
                            msGraphHost: "msGraphHost",
                        },
                        authority
                    );

                    browserLocalStorage.setAccount(testAccount);
                    browserSessionStorage.setAccount(testAccount);

                    expect(
                        browserSessionStorage.getAccount(
                            testAccount.generateAccountKey()
                        )
                    ).toEqual(testAccount);
                    expect(
                        browserSessionStorage.getAccount(
                            testAccount.generateAccountKey()
                        )
                    ).toBeInstanceOf(AccountEntity);
                    expect(
                        browserLocalStorage.getAccount(
                            testAccount.generateAccountKey()
                        )
                    ).toEqual(testAccount);
                    expect(
                        browserLocalStorage.getAccount(
                            testAccount.generateAccountKey()
                        )
                    ).toBeInstanceOf(AccountEntity);
                });
            });

            describe("IdTokenCredential", () => {
                it("getIdTokenCredential returns null if key not in cache", () => {
                    const key = "not-in-cache";
                    expect(
                        browserSessionStorage.getIdTokenCredential(key)
                    ).toBeNull();
                    expect(
                        browserLocalStorage.getIdTokenCredential(key)
                    ).toBeNull();
                });

                it("getIdTokenCredential returns null if value is not JSON", () => {
                    const key = "testKey";
                    browserLocalStorage.setItem(key, "this is not json");
                    browserSessionStorage.setItem(key, "this is not json");

                    expect(
                        browserSessionStorage.getIdTokenCredential(key)
                    ).toBeNull();
                    expect(
                        browserLocalStorage.getIdTokenCredential(key)
                    ).toBeNull();
                });

                it("getIdTokenCredential returns null if value is not idToken entity", () => {
                    const key = "testKey";
                    const partialIdTokenEntity = {
                        homeAccountId: "home-accountId",
                    };

                    browserLocalStorage.setItem(
                        key,
                        JSON.stringify(partialIdTokenEntity)
                    );
                    browserSessionStorage.setItem(
                        key,
                        JSON.stringify(partialIdTokenEntity)
                    );

                    expect(
                        browserSessionStorage.getIdTokenCredential(key)
                    ).toBeNull();
                    expect(
                        browserLocalStorage.getIdTokenCredential(key)
                    ).toBeNull();
                });

                it("getIdTokenCredential returns IdTokenEntity", () => {
                    const testIdToken = CacheHelpers.createIdTokenEntity(
                        "homeAccountId",
                        "environment",
                        TEST_TOKENS.IDTOKEN_V2,
                        "client-id",
                        "tenantId"
                    );

                    browserLocalStorage.setIdTokenCredential(testIdToken);
                    browserSessionStorage.setIdTokenCredential(testIdToken);

                    expect(
                        browserSessionStorage.getIdTokenCredential(
                            CacheHelpers.generateCredentialKey(testIdToken)
                        )
                    ).toEqual(testIdToken);
                    expect(
                        browserLocalStorage.getIdTokenCredential(
                            CacheHelpers.generateCredentialKey(testIdToken)
                        )
                    ).toEqual(testIdToken);
                });
            });

            describe("AccessTokenCredential", () => {
                it("getAccessTokenCredential returns null if key not in cache", () => {
                    const key = "not-in-cache";
                    expect(
                        browserSessionStorage.getAccessTokenCredential(key)
                    ).toBeNull();
                    expect(
                        browserLocalStorage.getAccessTokenCredential(key)
                    ).toBeNull();
                });

                it("getAccessTokenCredential returns null if value is not JSON", () => {
                    const key = "testKey";
                    browserLocalStorage.setItem(key, "this is not json");
                    browserSessionStorage.setItem(key, "this is not json");

                    expect(
                        browserSessionStorage.getAccessTokenCredential(key)
                    ).toBeNull();
                    expect(
                        browserLocalStorage.getAccessTokenCredential(key)
                    ).toBeNull();
                });

                it("getAccessTokenCredential returns null if value is not accessToken entity", () => {
                    const key = "testKey";
                    const partialAccessTokenEntity = {
                        homeAccountId: "home-accountId",
                    };

                    browserLocalStorage.setItem(
                        key,
                        JSON.stringify(partialAccessTokenEntity)
                    );
                    browserSessionStorage.setItem(
                        key,
                        JSON.stringify(partialAccessTokenEntity)
                    );

                    expect(
                        browserSessionStorage.getAccessTokenCredential(key)
                    ).toBeNull();
                    expect(
                        browserLocalStorage.getAccessTokenCredential(key)
                    ).toBeNull();
                });

                it("getAccessTokenCredential returns AccessTokenEntity", () => {
                    const testAccessToken =
                        CacheHelpers.createAccessTokenEntity(
                            "homeAccountId",
                            "environment",
                            TEST_TOKENS.ACCESS_TOKEN,
                            "client-id",
                            "tenantId",
                            "openid",
                            1000,
                            1000,
                            browserCrypto.base64Decode,
                            500,
                            AuthenticationScheme.BEARER,
                            "oboAssertion"
                        );

                    browserLocalStorage.setAccessTokenCredential(
                        testAccessToken
                    );
                    browserSessionStorage.setAccessTokenCredential(
                        testAccessToken
                    );

                    expect(
                        browserSessionStorage.getAccessTokenCredential(
                            CacheHelpers.generateCredentialKey(testAccessToken)
                        )
                    ).toEqual(testAccessToken);
                    expect(
                        browserLocalStorage.getAccessTokenCredential(
                            CacheHelpers.generateCredentialKey(testAccessToken)
                        )
                    ).toEqual(testAccessToken);
                });

                it("getAccessTokenCredential returns Bearer access token when authentication scheme is set to Bearer and both a Bearer and pop token are in the cache", () => {
                    const testAccessTokenWithoutAuthScheme =
                        CacheHelpers.createAccessTokenEntity(
                            "homeAccountId",
                            "environment",
                            TEST_TOKENS.ACCESS_TOKEN,
                            "client-id",
                            "tenantId",
                            "openid",
                            1000,
                            1000,
                            browserCrypto.base64Decode,
                            500,
                            AuthenticationScheme.BEARER,
                            "oboAssertion"
                        );
                    const testAccessTokenWithAuthScheme =
                        CacheHelpers.createAccessTokenEntity(
                            "homeAccountId",
                            "environment",
                            TEST_TOKENS.POP_TOKEN,
                            "client-id",
                            "tenantId",
                            "openid",
                            1000,
                            1000,
                            browserCrypto.base64Decode,
                            500,
                            AuthenticationScheme.POP,
                            "oboAssertion"
                        );
                    // Cache bearer token
                    browserLocalStorage.setAccessTokenCredential(
                        testAccessTokenWithoutAuthScheme
                    );
                    browserSessionStorage.setAccessTokenCredential(
                        testAccessTokenWithoutAuthScheme
                    );

                    // Cache pop token
                    browserLocalStorage.setAccessTokenCredential(
                        testAccessTokenWithAuthScheme
                    );
                    browserSessionStorage.setAccessTokenCredential(
                        testAccessTokenWithAuthScheme
                    );

                    expect(
                        browserSessionStorage.getAccessTokenCredential(
                            CacheHelpers.generateCredentialKey(
                                testAccessTokenWithoutAuthScheme
                            )
                        )
                    ).toEqual(testAccessTokenWithoutAuthScheme);
                    expect(
                        browserSessionStorage.getAccessTokenCredential(
                            CacheHelpers.generateCredentialKey(
                                testAccessTokenWithoutAuthScheme
                            )
                        )?.credentialType
                    ).toBe(CredentialType.ACCESS_TOKEN);
                    expect(
                        browserLocalStorage.getAccessTokenCredential(
                            CacheHelpers.generateCredentialKey(
                                testAccessTokenWithoutAuthScheme
                            )
                        )
                    ).toEqual(testAccessTokenWithoutAuthScheme);
                    expect(
                        browserLocalStorage.getAccessTokenCredential(
                            CacheHelpers.generateCredentialKey(
                                testAccessTokenWithoutAuthScheme
                            )
                        )?.credentialType
                    ).toBe(CredentialType.ACCESS_TOKEN);
                });

                it("getAccessTokenCredential returns PoP access token when authentication scheme is set to pop and both a Bearer and pop token are in the cache", () => {
                    const testAccessTokenWithoutAuthScheme =
                        CacheHelpers.createAccessTokenEntity(
                            "homeAccountId",
                            "environment",
                            TEST_TOKENS.ACCESS_TOKEN,
                            "client-id",
                            "tenantId",
                            "openid",
                            1000,
                            1000,
                            browserCrypto.base64Decode,
                            500,
                            AuthenticationScheme.BEARER,
                            "oboAssertion"
                        );
                    const testAccessTokenWithAuthScheme =
                        CacheHelpers.createAccessTokenEntity(
                            "homeAccountId",
                            "environment",
                            TEST_TOKENS.POP_TOKEN,
                            "client-id",
                            "tenantId",
                            "openid",
                            1000,
                            1000,
                            browserCrypto.base64Decode,
                            500,
                            AuthenticationScheme.POP,
                            "oboAssertion"
                        );
                    // Cache bearer token
                    browserLocalStorage.setAccessTokenCredential(
                        testAccessTokenWithoutAuthScheme
                    );
                    browserSessionStorage.setAccessTokenCredential(
                        testAccessTokenWithoutAuthScheme
                    );

                    // Cache pop token
                    browserLocalStorage.setAccessTokenCredential(
                        testAccessTokenWithAuthScheme
                    );
                    browserSessionStorage.setAccessTokenCredential(
                        testAccessTokenWithAuthScheme
                    );

                    expect(
                        browserSessionStorage.getAccessTokenCredential(
                            CacheHelpers.generateCredentialKey(
                                testAccessTokenWithAuthScheme
                            )
                        )
                    ).toEqual(testAccessTokenWithAuthScheme);
                    expect(
                        browserSessionStorage.getAccessTokenCredential(
                            CacheHelpers.generateCredentialKey(
                                testAccessTokenWithAuthScheme
                            )
                        )?.credentialType
                    ).toBe(CredentialType.ACCESS_TOKEN_WITH_AUTH_SCHEME);
                    expect(
                        browserLocalStorage.getAccessTokenCredential(
                            CacheHelpers.generateCredentialKey(
                                testAccessTokenWithAuthScheme
                            )
                        )
                    ).toEqual(testAccessTokenWithAuthScheme);
                    expect(
                        browserLocalStorage.getAccessTokenCredential(
                            CacheHelpers.generateCredentialKey(
                                testAccessTokenWithAuthScheme
                            )
                        )?.credentialType
                    ).toBe(CredentialType.ACCESS_TOKEN_WITH_AUTH_SCHEME);
                });
            });

            describe("RefreshTokenCredential", () => {
                it("getRefreshTokenCredential returns null if key not in cache", () => {
                    const key = "not-in-cache";
                    expect(
                        browserSessionStorage.getRefreshTokenCredential(key)
                    ).toBeNull();
                    expect(
                        browserLocalStorage.getRefreshTokenCredential(key)
                    ).toBeNull();
                });

                it("getRefreshTokenCredential returns null if value is not JSON", () => {
                    const key = "testKey";
                    browserLocalStorage.setItem(key, "this is not json");
                    browserSessionStorage.setItem(key, "this is not json");

                    expect(
                        browserSessionStorage.getRefreshTokenCredential(key)
                    ).toBeNull();
                    expect(
                        browserLocalStorage.getRefreshTokenCredential(key)
                    ).toBeNull();
                });

                it("getRefreshTokenCredential returns null if value is not refreshToken entity", () => {
                    const key = "testKey";
                    const partialRefreshTokenEntity = {
                        homeAccountId: "home-accountId",
                    };

                    browserLocalStorage.setItem(
                        key,
                        JSON.stringify(partialRefreshTokenEntity)
                    );
                    browserSessionStorage.setItem(
                        key,
                        JSON.stringify(partialRefreshTokenEntity)
                    );

                    expect(
                        browserSessionStorage.getRefreshTokenCredential(key)
                    ).toBeNull();
                    expect(
                        browserLocalStorage.getRefreshTokenCredential(key)
                    ).toBeNull();
                });

                it("getRefreshTokenCredential returns RefreshTokenEntity", () => {
                    const testRefreshToken =
                        CacheHelpers.createRefreshTokenEntity(
                            "homeAccountId",
                            "environment",
                            TEST_TOKENS.REFRESH_TOKEN,
                            "client-id",
                            "familyId",
                            "oboAssertion"
                        );

                    browserLocalStorage.setRefreshTokenCredential(
                        testRefreshToken
                    );
                    browserSessionStorage.setRefreshTokenCredential(
                        testRefreshToken
                    );

                    expect(
                        browserSessionStorage.getRefreshTokenCredential(
                            CacheHelpers.generateCredentialKey(testRefreshToken)
                        )
                    ).toEqual(testRefreshToken);
                    expect(
                        browserLocalStorage.getRefreshTokenCredential(
                            CacheHelpers.generateCredentialKey(testRefreshToken)
                        )
                    ).toEqual(testRefreshToken);
                });
            });

            describe("AppMetadata", () => {
                it("getAppMetadata returns null if key not in cache", () => {
                    const key = "not-in-cache";
                    expect(
                        browserSessionStorage.getAppMetadata(key)
                    ).toBeNull();
                    expect(browserLocalStorage.getAppMetadata(key)).toBeNull();
                });

                it("getAppMetadata returns null if value is not JSON", () => {
                    const key = "testKey";
                    browserLocalStorage.setItem(key, "this is not json");
                    browserSessionStorage.setItem(key, "this is not json");

                    expect(
                        browserSessionStorage.getAppMetadata(key)
                    ).toBeNull();
                    expect(browserLocalStorage.getAppMetadata(key)).toBeNull();
                });

                it("getAppMetadata returns null if value is not appMetadata entity", () => {
                    const key = "testKey";
                    const partialAppMetadataEntity = {
                        environment: "environment",
                    };

                    browserLocalStorage.setItem(
                        key,
                        JSON.stringify(partialAppMetadataEntity)
                    );
                    browserSessionStorage.setItem(
                        key,
                        JSON.stringify(partialAppMetadataEntity)
                    );

                    expect(
                        browserSessionStorage.getAppMetadata(key)
                    ).toBeNull();
                    expect(browserLocalStorage.getAppMetadata(key)).toBeNull();
                });

                it("getAppMetadata returns AppMetadataEntity", () => {
                    const testAppMetadata = {
                        clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                        environment: "login.microsoftonline.com",
                        familyId: "1",
                    };

                    browserLocalStorage.setAppMetadata(testAppMetadata);
                    browserSessionStorage.setAppMetadata(testAppMetadata);

                    expect(
                        browserSessionStorage.getAppMetadata(
                            CacheHelpers.generateAppMetadataKey(testAppMetadata)
                        )
                    ).toEqual(testAppMetadata);
                    expect(
                        browserLocalStorage.getAppMetadata(
                            CacheHelpers.generateAppMetadataKey(testAppMetadata)
                        )
                    ).toEqual(testAppMetadata);
                });
            });

            describe("ServerTelemetry", () => {
                it("getServerTelemetry returns null if key not in cache", () => {
                    const key = "not-in-cache";
                    expect(
                        browserSessionStorage.getServerTelemetry(key)
                    ).toBeNull();
                    expect(
                        browserLocalStorage.getServerTelemetry(key)
                    ).toBeNull();
                });

                it("getServerTelemetry returns null if value is not JSON", () => {
                    const key = "testKey";
                    browserLocalStorage.setItem(key, "this is not json");
                    browserSessionStorage.setItem(key, "this is not json");

                    expect(
                        browserSessionStorage.getServerTelemetry(key)
                    ).toBeNull();
                    expect(
                        browserLocalStorage.getServerTelemetry(key)
                    ).toBeNull();
                });

                it("getServerTelemetry returns null if value is not serverTelemetry entity", () => {
                    const key = "testKey";
                    const partialServerTelemetryEntity = {
                        apiId: 0,
                    };

                    browserLocalStorage.setItem(
                        key,
                        JSON.stringify(partialServerTelemetryEntity)
                    );
                    browserSessionStorage.setItem(
                        key,
                        JSON.stringify(partialServerTelemetryEntity)
                    );

                    expect(
                        browserSessionStorage.getServerTelemetry(key)
                    ).toBeNull();
                    expect(
                        browserLocalStorage.getServerTelemetry(key)
                    ).toBeNull();
                });

                it("getServerTelemetry returns ServerTelemetryEntity", () => {
                    const testKey = "server-telemetry-clientId";
                    const testVal = {
                        failedRequests: ["61|test-correlationId"],
                        errors: ["test_error"],
                        cacheHits: 2,
                    };

                    browserLocalStorage.setServerTelemetry(testKey, testVal);
                    browserSessionStorage.setServerTelemetry(testKey, testVal);

                    expect(
                        browserSessionStorage.getServerTelemetry(testKey)
                    ).toEqual(testVal);
                    expect(
                        browserLocalStorage.getServerTelemetry(testKey)
                    ).toEqual(testVal);
                });
            });

            describe("AuthorityMetadata", () => {
                const key = `authority-metadata-${TEST_CONFIG.MSAL_CLIENT_ID}-${Constants.DEFAULT_AUTHORITY_HOST}`;
                const testObj: AuthorityMetadataEntity = {
                    aliases: [Constants.DEFAULT_AUTHORITY_HOST],
                    preferred_cache: Constants.DEFAULT_AUTHORITY_HOST,
                    preferred_network: Constants.DEFAULT_AUTHORITY_HOST,
                    canonical_authority: Constants.DEFAULT_AUTHORITY,
                    authorization_endpoint:
                        //@ts-ignore
                        DEFAULT_OPENID_CONFIG_RESPONSE.body
                            .authorization_endpoint,
                    token_endpoint:
                        //@ts-ignore
                        DEFAULT_OPENID_CONFIG_RESPONSE.body.token_endpoint,
                    end_session_endpoint:
                        //@ts-ignore
                        DEFAULT_OPENID_CONFIG_RESPONSE.body
                            .end_session_endpoint,
                    issuer:
                        //@ts-ignore
                        DEFAULT_OPENID_CONFIG_RESPONSE.body.issuer,
                    jwks_uri:
                        //@ts-ignore
                        DEFAULT_OPENID_CONFIG_RESPONSE.body.jwks_uri,
                    aliasesFromNetwork: false,
                    endpointsFromNetwork: false,
                    expiresAt:
                        CacheHelpers.generateAuthorityMetadataExpiresAt(),
                };

                it("getAuthorityMetadata() returns null if key is not in cache", () => {
                    expect(
                        browserSessionStorage.getAuthorityMetadata(key)
                    ).toBeNull();
                    expect(
                        browserLocalStorage.getAuthorityMetadata(key)
                    ).toBeNull();
                });

                it("getAuthorityMetadata() returns null if isAuthorityMetadataEntity returns false", () => {
                    browserSessionStorage.setAuthorityMetadata(key, {
                        // @ts-ignore
                        invalidKey: "invalidValue",
                    });
                    browserLocalStorage.setAuthorityMetadata(key, {
                        // @ts-ignore
                        invalidKey: "invalidValue",
                    });

                    expect(
                        browserSessionStorage.getAuthorityMetadata(key)
                    ).toBeNull();
                    expect(
                        browserLocalStorage.getAuthorityMetadata(key)
                    ).toBeNull();
                    expect(
                        browserLocalStorage.getAuthorityMetadataKeys()
                    ).toEqual(expect.arrayContaining([key]));
                    expect(
                        browserSessionStorage.getAuthorityMetadataKeys()
                    ).toEqual(expect.arrayContaining([key]));
                });

                it("setAuthorityMetadata() and getAuthorityMetadata() sets and returns AuthorityMetadataEntity in-memory", () => {
                    browserSessionStorage.setAuthorityMetadata(key, testObj);
                    browserLocalStorage.setAuthorityMetadata(key, testObj);

                    expect(
                        browserSessionStorage.getAuthorityMetadata(key)
                    ).toEqual(testObj);
                    expect(
                        browserLocalStorage.getAuthorityMetadata(key)
                    ).toEqual(testObj);
                    expect(
                        browserLocalStorage.getAuthorityMetadataKeys()
                    ).toEqual(expect.arrayContaining([key]));
                    expect(
                        browserSessionStorage.getAuthorityMetadataKeys()
                    ).toEqual(expect.arrayContaining([key]));
                });

                it("clear() removes AuthorityMetadataEntity from in-memory storage", async () => {
                    browserSessionStorage.setAuthorityMetadata(key, testObj);
                    browserLocalStorage.setAuthorityMetadata(key, testObj);

                    expect(
                        browserSessionStorage.getAuthorityMetadata(key)
                    ).toEqual(testObj);
                    expect(
                        browserLocalStorage.getAuthorityMetadata(key)
                    ).toEqual(testObj);
                    expect(
                        browserLocalStorage.getAuthorityMetadataKeys()
                    ).toEqual(expect.arrayContaining([key]));
                    expect(
                        browserSessionStorage.getAuthorityMetadataKeys()
                    ).toEqual(expect.arrayContaining([key]));

                    await browserSessionStorage.clear();
                    await browserLocalStorage.clear();
                    expect(
                        browserSessionStorage.getAuthorityMetadata(key)
                    ).toBeNull();
                    expect(
                        browserLocalStorage.getAuthorityMetadata(key)
                    ).toBeNull();
                    expect(
                        browserLocalStorage.getAuthorityMetadataKeys().length
                    ).toBe(0);
                    expect(
                        browserSessionStorage.getAuthorityMetadataKeys().length
                    ).toBe(0);
                });
            });

            describe("ThrottlingCache", () => {
                it("getThrottlingCache returns null if key not in cache", () => {
                    const key = "not-in-cache";
                    expect(
                        browserSessionStorage.getServerTelemetry(key)
                    ).toBeNull();
                    expect(
                        browserLocalStorage.getServerTelemetry(key)
                    ).toBeNull();
                });

                it("getThrottlingCache returns null if value is not JSON", () => {
                    const key = "testKey";
                    browserLocalStorage.setItem(key, "this is not json");
                    browserSessionStorage.setItem(key, "this is not json");

                    expect(
                        browserSessionStorage.getThrottlingCache(key)
                    ).toBeNull();
                    expect(
                        browserLocalStorage.getThrottlingCache(key)
                    ).toBeNull();
                });

                it("getThrottlingCache returns null if value is not throttling entity", () => {
                    const key = "testKey";
                    const partialThrottlingEntity = {
                        error: "error",
                    };

                    browserLocalStorage.setItem(
                        key,
                        JSON.stringify(partialThrottlingEntity)
                    );
                    browserSessionStorage.setItem(
                        key,
                        JSON.stringify(partialThrottlingEntity)
                    );

                    expect(
                        browserSessionStorage.getThrottlingCache(key)
                    ).toBeNull();
                    expect(
                        browserLocalStorage.getThrottlingCache(key)
                    ).toBeNull();
                });

                it("getThrottlingCache returns ThrottlingEntity", () => {
                    const testKey = "throttling";
                    const testVal = { throttleTime: 60 };

                    browserLocalStorage.setThrottlingCache(testKey, testVal);
                    browserSessionStorage.setThrottlingCache(testKey, testVal);

                    expect(
                        browserSessionStorage.getThrottlingCache(testKey)
                    ).toEqual(testVal);
                    expect(
                        browserLocalStorage.getThrottlingCache(testKey)
                    ).toEqual(testVal);
                });
            });
        });
    });

    describe("Interface functions with storeAuthStateInCookie=true", () => {
        let browserSessionStorage: BrowserCacheManager;
        let browserLocalStorage: BrowserCacheManager;
        let browserMemoryStorage: BrowserCacheManager;
        let cacheVal: string;
        let msalCacheKey: string;
        beforeEach(() => {
            cacheConfig.storeAuthStateInCookie = true;
            browserSessionStorage = new BrowserCacheManager(
                TEST_CONFIG.MSAL_CLIENT_ID,
                cacheConfig,
                browserCrypto,
                logger
            );
            cacheConfig.cacheLocation = BrowserCacheLocation.LocalStorage;
            browserLocalStorage = new BrowserCacheManager(
                TEST_CONFIG.MSAL_CLIENT_ID,
                cacheConfig,
                browserCrypto,
                logger
            );
            cacheConfig.cacheLocation = BrowserCacheLocation.MemoryStorage;
            browserMemoryStorage = new BrowserCacheManager(
                TEST_CONFIG.MSAL_CLIENT_ID,
                cacheConfig,
                browserCrypto,
                logger
            );
            cacheVal = "cacheVal";
            msalCacheKey = browserSessionStorage.generateCacheKey("cacheKey");
        });

        afterEach(async () => {
            await browserSessionStorage.clear();
            await browserLocalStorage.clear();
        });

        it("setTempCache()", () => {
            // sessionStorage
            browserSessionStorage.setTemporaryCache("cacheKey", cacheVal, true);
            expect(window.sessionStorage.getItem(msalCacheKey)).toBe(cacheVal);
            expect(document.cookie).toBe(`${msalCacheKey}=${cacheVal}`);
            browserSessionStorage.clearItemCookie(msalCacheKey);
            // localStorage
            browserLocalStorage.setTemporaryCache("cacheKey", cacheVal, true);
            expect(window.sessionStorage.getItem(msalCacheKey)).toBe(cacheVal);
            expect(document.cookie).toBe(`${msalCacheKey}=${cacheVal}`);
            browserLocalStorage.clearItemCookie(msalCacheKey);
            // browser memory
            browserMemoryStorage.setTemporaryCache("cacheKey", cacheVal, true);
            expect(browserMemoryStorage.getTemporaryCache(msalCacheKey)).toBe(
                cacheVal
            );
            expect(document.cookie).toBe(`${msalCacheKey}=${cacheVal}`);
            browserMemoryStorage.clearItemCookie(msalCacheKey);
        });

        it("getTempCache()", () => {
            const getCookieSpy = jest.spyOn(
                BrowserCacheManager.prototype,
                "getItemCookie"
            );
            // sessionStorage
            window.sessionStorage.setItem(msalCacheKey, cacheVal);
            browserSessionStorage.setItemCookie(msalCacheKey, cacheVal);
            expect(
                browserSessionStorage.getTemporaryCache("cacheKey", true)
            ).toBe(cacheVal);
            expect(getCookieSpy.mock.results[0].value).toEqual(cacheVal);
            expect(getCookieSpy).toHaveBeenCalledTimes(1);
            // localStorage
            window.localStorage.setItem(msalCacheKey, cacheVal);
            browserLocalStorage.setItemCookie(msalCacheKey, cacheVal);
            expect(
                browserLocalStorage.getTemporaryCache("cacheKey", true)
            ).toBe(cacheVal);
            expect(getCookieSpy.mock.results[1].value).toEqual(cacheVal);
            expect(getCookieSpy).toHaveBeenCalledTimes(2);
            // browser memory
            browserMemoryStorage.setItem(msalCacheKey, cacheVal);
            expect(
                browserMemoryStorage.getTemporaryCache("cacheKey", true)
            ).toBe(cacheVal);
            expect(getCookieSpy.mock.results[2].value).toEqual(cacheVal);
            expect(getCookieSpy).toHaveBeenCalledTimes(3);
        });

        it("removeTemporaryItem()", () => {
            const clearCookieSpy = jest.spyOn(
                BrowserCacheManager.prototype,
                "clearItemCookie"
            );
            // sessionStorage
            browserSessionStorage.setTemporaryCache("cacheKey", cacheVal, true);
            browserSessionStorage.removeTemporaryItem(msalCacheKey);
            expect(window.sessionStorage.getItem(msalCacheKey)).toBeNull();
            expect(document.cookie).toHaveLength(0);
            expect(clearCookieSpy).toHaveBeenCalledTimes(1);
            // localStorage
            browserLocalStorage.setTemporaryCache("cacheKey", cacheVal, true);
            browserLocalStorage.removeTemporaryItem(msalCacheKey);
            expect(window.localStorage.getItem(msalCacheKey)).toBeNull();
            expect(document.cookie).toHaveLength(0);
            expect(clearCookieSpy).toHaveBeenCalledTimes(2);
            // browser memory
            browserMemoryStorage.setTemporaryCache("cacheKey", cacheVal, true);
            browserMemoryStorage.removeTemporaryItem(msalCacheKey);
            expect(browserMemoryStorage.getItem(msalCacheKey)).toBeNull();
            expect(document.cookie).toHaveLength(0);
            expect(clearCookieSpy).toHaveBeenCalledTimes(3);
        });

        it("clear()", async () => {
            // sessionStorage
            browserSessionStorage.setItem(msalCacheKey, cacheVal);
            await browserSessionStorage.clear();
            expect(browserSessionStorage.getKeys()).toHaveLength(0);
            expect(document.cookie).toHaveLength(0);
            // localStorage
            browserLocalStorage.setTemporaryCache(msalCacheKey, cacheVal);
            await browserLocalStorage.clear();
            expect(browserLocalStorage.getKeys()).toHaveLength(0);
            expect(document.cookie).toHaveLength(0);
            // browser memory
            browserMemoryStorage.setTemporaryCache(msalCacheKey, cacheVal);
            await browserMemoryStorage.clear();
            expect(browserMemoryStorage.getKeys()).toHaveLength(0);
            expect(document.cookie).toHaveLength(0);
        });

        it("setTempCache() with item that contains ==", () => {
            msalCacheKey = `${Constants.CACHE_PREFIX}.${TEST_STATE_VALUES.ENCODED_LIB_STATE}`;
            // sessionStorage
            browserSessionStorage.setTemporaryCache(msalCacheKey, cacheVal);
            expect(window.sessionStorage.getItem(msalCacheKey)).toBe(cacheVal);
            expect(document.cookie).toBe(
                `${encodeURIComponent(msalCacheKey)}=${cacheVal}`
            );
            browserSessionStorage.clearItemCookie(msalCacheKey);
            // localStorage
            browserLocalStorage.setTemporaryCache(msalCacheKey, cacheVal);
            expect(window.sessionStorage.getItem(msalCacheKey)).toBe(cacheVal);
            expect(document.cookie).toBe(
                `${encodeURIComponent(msalCacheKey)}=${cacheVal}`
            );
            browserLocalStorage.clearItemCookie(msalCacheKey);
            // browser memory
            browserMemoryStorage.setTemporaryCache(msalCacheKey, cacheVal);
            expect(browserMemoryStorage.getTemporaryCache(msalCacheKey)).toBe(
                cacheVal
            );
            expect(document.cookie).toBe(
                `${encodeURIComponent(msalCacheKey)}=${cacheVal}`
            );
            browserMemoryStorage.clearItemCookie(msalCacheKey);
        });

        it("getTempCache() with item that contains ==", () => {
            msalCacheKey = `${Constants.CACHE_PREFIX}.${TEST_STATE_VALUES.ENCODED_LIB_STATE}`;
            const getCookieSpy = jest.spyOn(
                BrowserCacheManager.prototype,
                "getItemCookie"
            );
            // sessionStorage
            browserSessionStorage.setItem(msalCacheKey, cacheVal);
            browserSessionStorage.setItemCookie(msalCacheKey, cacheVal);
            expect(browserSessionStorage.getTemporaryCache(msalCacheKey)).toBe(
                cacheVal
            );
            expect(getCookieSpy.mock.results[0].value).toEqual(cacheVal);
            expect(getCookieSpy).toHaveBeenCalledTimes(1);
            // localStorage
            browserLocalStorage.setItem(msalCacheKey, cacheVal);
            browserLocalStorage.setItemCookie(msalCacheKey, cacheVal);
            expect(browserLocalStorage.getTemporaryCache(msalCacheKey)).toBe(
                cacheVal
            );
            expect(getCookieSpy.mock.results[1].value).toEqual(cacheVal);
            expect(getCookieSpy).toHaveBeenCalledTimes(2);
            // browser memory
            browserMemoryStorage.setItem(msalCacheKey, cacheVal);
            expect(browserLocalStorage.getTemporaryCache(msalCacheKey)).toBe(
                cacheVal
            );
            expect(getCookieSpy.mock.results[2].value).toEqual(cacheVal);
            expect(getCookieSpy).toHaveBeenCalledTimes(3);
        });

        it("removeTemporaryItem() with item that contains ==", () => {
            msalCacheKey = `${Constants.CACHE_PREFIX}.${TEST_STATE_VALUES.ENCODED_LIB_STATE}`;
            const clearCookieSpy = jest.spyOn(
                BrowserCacheManager.prototype,
                "clearItemCookie"
            );
            // sessionStorage
            browserSessionStorage.setTemporaryCache(msalCacheKey, cacheVal);
            browserSessionStorage.removeTemporaryItem(msalCacheKey);
            expect(window.sessionStorage.getItem(msalCacheKey)).toBeNull();
            expect(document.cookie).toHaveLength(0);
            expect(clearCookieSpy).toHaveBeenCalledTimes(1);
            // localStorage
            browserLocalStorage.setItem(msalCacheKey, cacheVal);
            browserLocalStorage.removeTemporaryItem(msalCacheKey);
            expect(window.sessionStorage.getItem(msalCacheKey)).toBeNull();
            expect(document.cookie).toHaveLength(0);
            expect(clearCookieSpy).toHaveBeenCalledTimes(2);
            // browser memory
            browserMemoryStorage.setTemporaryCache(msalCacheKey, cacheVal);
            browserMemoryStorage.removeTemporaryItem(msalCacheKey);
            expect(browserMemoryStorage.getItem(msalCacheKey)).toBeNull();
            expect(document.cookie).toHaveLength(0);
            expect(clearCookieSpy).toHaveBeenCalledTimes(3);
        });

        it("clear() with item that contains ==", async () => {
            msalCacheKey = `${Constants.CACHE_PREFIX}.${TEST_STATE_VALUES.ENCODED_LIB_STATE}`;
            // sessionStorage
            browserSessionStorage.setTemporaryCache(msalCacheKey, cacheVal);
            await browserSessionStorage.clear();
            expect(browserSessionStorage.getKeys()).toHaveLength(0);
            expect(document.cookie).toHaveLength(0);
            // localStorage
            browserLocalStorage.setTemporaryCache(msalCacheKey, cacheVal);
            await browserLocalStorage.clear();
            expect(browserLocalStorage.getKeys()).toHaveLength(0);
            expect(document.cookie).toHaveLength(0);
            // browser memory
            browserMemoryStorage.setTemporaryCache(msalCacheKey, cacheVal);
            await browserMemoryStorage.clear();
            expect(browserMemoryStorage.getKeys()).toHaveLength(0);
            expect(document.cookie).toHaveLength(0);
        });
    });

    describe("Cookie operations", () => {
        let browserSessionStorage: BrowserCacheManager;
        let browserLocalStorage: BrowserCacheManager;
        let cacheVal: string;
        let msalCacheKey: string;
        beforeEach(() => {
            browserSessionStorage = new BrowserCacheManager(
                TEST_CONFIG.MSAL_CLIENT_ID,
                cacheConfig,
                browserCrypto,
                logger
            );
            cacheConfig.cacheLocation = BrowserCacheLocation.LocalStorage;
            browserLocalStorage = new BrowserCacheManager(
                TEST_CONFIG.MSAL_CLIENT_ID,
                cacheConfig,
                browserCrypto,
                logger
            );
            cacheVal = "cacheVal";
            msalCacheKey = browserSessionStorage.generateCacheKey("cacheKey");
        });

        it("setItemCookie()", () => {
            browserSessionStorage.setItemCookie(msalCacheKey, cacheVal);
            expect(document.cookie).toBe(`${msalCacheKey}=${cacheVal}`);
            browserSessionStorage.clearItemCookie(msalCacheKey);
            browserLocalStorage.setItemCookie(msalCacheKey, cacheVal);
            expect(document.cookie).toBe(`${msalCacheKey}=${cacheVal}`);
        });

        it("sets samesite", () => {
            const cookieSpy = jest.spyOn(document, "cookie", "set");
            browserSessionStorage.setItemCookie(msalCacheKey, cacheVal);
            expect(cookieSpy.mock.calls[0][0]).toContain("SameSite=Lax");
        });

        it("getItemCookie()", () => {
            browserSessionStorage.setItemCookie(msalCacheKey, cacheVal);
            expect(browserSessionStorage.getItemCookie(msalCacheKey)).toBe(
                cacheVal
            );
            expect(browserLocalStorage.getItemCookie(msalCacheKey)).toBe(
                cacheVal
            );
        });

        it("clearMsalCookie()", () => {
            browserSessionStorage.setItemCookie(msalCacheKey, cacheVal);
            expect(document.cookie).not.toHaveLength(0);
            browserSessionStorage.clearMsalCookies();
            expect(document.cookie).toHaveLength(0);

            const testCookieKey = "cookie";
            const testCookie = `${testCookieKey}=thisIsACookie`;
            const testCookieWithPath = "cookie=thisIsACookie;path=/;";
            browserSessionStorage.setItemCookie(msalCacheKey, cacheVal);
            expect(document.cookie).not.toHaveLength(0);
            document.cookie = testCookieWithPath;
            browserSessionStorage.clearMsalCookies();
            expect(document.cookie).toBe(testCookie);
            browserSessionStorage.clearItemCookie(testCookieKey);
        });

        it("clearItemCookie()", () => {
            browserSessionStorage.setItemCookie(msalCacheKey, cacheVal);
            browserSessionStorage.clearItemCookie(msalCacheKey);
            expect(document.cookie).toHaveLength(0);

            browserLocalStorage.setItemCookie(msalCacheKey, cacheVal);
            browserSessionStorage.clearItemCookie(msalCacheKey);
            expect(document.cookie).toHaveLength(0);
        });

        it("getCookieExpirationTime()", () => {
            const COOKIE_LIFE_MULTIPLIER = 24 * 60 * 60 * 1000;
            const currentTime = new Date().getTime();
            jest.spyOn(Date.prototype, "getTime").mockReturnValue(currentTime);
            const cookieLifeDays = 1;
            const expectedDate = new Date(
                currentTime + cookieLifeDays * COOKIE_LIFE_MULTIPLIER
            );
            expect(
                browserLocalStorage.getCookieExpirationTime(cookieLifeDays)
            ).toBe(expectedDate.toUTCString());
        });
    });

    describe("Helpers", () => {
        it("generateAuthorityKey() creates a valid cache key for authority strings", () => {
            const browserStorage = new BrowserCacheManager(
                TEST_CONFIG.MSAL_CLIENT_ID,
                cacheConfig,
                browserCrypto,
                logger
            );
            const authorityKey = browserStorage.generateAuthorityKey(
                TEST_STATE_VALUES.TEST_STATE_REDIRECT
            );
            expect(authorityKey).toBe(
                `${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.AUTHORITY}.${RANDOM_TEST_GUID}`
            );
        });

        it("generateNonceKey() create a valid cache key for nonce strings", () => {
            const browserStorage = new BrowserCacheManager(
                TEST_CONFIG.MSAL_CLIENT_ID,
                cacheConfig,
                browserCrypto,
                logger
            );
            const nonceKey = browserStorage.generateNonceKey(
                TEST_STATE_VALUES.TEST_STATE_REDIRECT
            );
            expect(nonceKey).toBe(
                `${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.NONCE_IDTOKEN}.${RANDOM_TEST_GUID}`
            );
        });

        it("updateCacheEntries() correctly updates the authority, state and nonce in the cache", () => {
            const browserStorage = new BrowserCacheManager(
                TEST_CONFIG.MSAL_CLIENT_ID,
                cacheConfig,
                browserCrypto,
                logger
            );
            const testNonce = "testNonce";
            const stateString = TEST_STATE_VALUES.TEST_STATE_REDIRECT;
            ProtocolUtils.parseRequestState(browserCrypto, stateString)
                .libraryState.id;
            browserStorage.updateCacheEntries(
                stateString,
                testNonce,
                `${Constants.DEFAULT_AUTHORITY}/`,
                "",
                null
            );

            const stateKey = browserStorage.generateStateKey(stateString);
            const nonceKey = browserStorage.generateNonceKey(stateString);
            const authorityKey =
                browserStorage.generateAuthorityKey(stateString);

            expect(window.sessionStorage[`${stateKey}`]).toBe(stateString);
            expect(window.sessionStorage[`${nonceKey}`]).toBe(testNonce);
            expect(window.sessionStorage[`${authorityKey}`]).toBe(
                `${Constants.DEFAULT_AUTHORITY}/`
            );
        });

        it("resetTempCacheItems() resets all temporary cache items with the given state", () => {
            const stateString = TEST_STATE_VALUES.TEST_STATE_REDIRECT;
            const browserStorage = new BrowserCacheManager(
                TEST_CONFIG.MSAL_CLIENT_ID,
                cacheConfig,
                browserCrypto,
                logger
            );
            browserStorage.updateCacheEntries(
                stateString,
                "nonce",
                `${TEST_URIS.DEFAULT_INSTANCE}/`,
                "",
                null
            );
            browserStorage.setItem(
                TemporaryCacheKeys.REQUEST_PARAMS,
                "TestRequestParams"
            );
            browserStorage.setItem(
                TemporaryCacheKeys.ORIGIN_URI,
                TEST_URIS.TEST_REDIR_URI
            );

            browserStorage.resetRequestCache(stateString);
            const nonceKey = browserStorage.generateNonceKey(stateString);
            const authorityKey =
                browserStorage.generateAuthorityKey(stateString);
            expect(
                window.sessionStorage[
                    `${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${nonceKey}`
                ]
            ).toBeUndefined();
            expect(
                window.sessionStorage[
                    `${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${authorityKey}`
                ]
            ).toBeUndefined();
            expect(
                window.sessionStorage[
                    `${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.REQUEST_STATE}`
                ]
            ).toBeUndefined();
            expect(
                window.sessionStorage[
                    `${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.REQUEST_PARAMS}`
                ]
            ).toBeUndefined();
            expect(
                window.sessionStorage[
                    `${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.ORIGIN_URI}`
                ]
            ).toBeUndefined();
        });

        it("Successfully retrieves and decodes response from cache", async () => {
            const browserStorage = new BrowserCacheManager(
                TEST_CONFIG.MSAL_CLIENT_ID,
                cacheConfig,
                browserCrypto,
                logger
            );
            const tokenRequest: AuthorizationCodeRequest = {
                redirectUri: `${TEST_URIS.DEFAULT_INSTANCE}`,
                scopes: [Constants.OPENID_SCOPE, Constants.PROFILE_SCOPE],
                code: "thisIsAnAuthCode",
                codeVerifier: TEST_CONFIG.TEST_VERIFIER,
                authority: `${Constants.DEFAULT_AUTHORITY}/`,
                correlationId: `${RANDOM_TEST_GUID}`,
                authenticationScheme: AuthenticationScheme.BEARER,
            };

            browserStorage.setTemporaryCache(
                TemporaryCacheKeys.REQUEST_PARAMS,
                browserCrypto.base64Encode(JSON.stringify(tokenRequest)),
                true
            );

            const cachedRequest =
                browserStorage.getCachedRequest(RANDOM_TEST_GUID);
            expect(cachedRequest).toEqual(tokenRequest);

            // expect(() => browserStorage.getCachedRequest(RANDOM_TEST_GUID, cryptoObj)).to.throw(BrowserAuthErrorMessage.tokenRequestCacheError.desc);
        });

        it("Throws error if request cannot be retrieved from cache", async () => {
            const browserStorage = new BrowserCacheManager(
                TEST_CONFIG.MSAL_CLIENT_ID,
                cacheConfig,
                browserCrypto,
                logger
            );
            // browserStorage.setItem(TemporaryCacheKeys.REQUEST_PARAMS, cryptoObj.base64Encode(JSON.stringify(tokenRequest)));

            expect(() =>
                browserStorage.getCachedRequest(RANDOM_TEST_GUID)
            ).toThrowError(
                BrowserAuthErrorMessage.noTokenRequestCacheError.desc
            );
        });

        it("Throws error if cached request cannot be parsed correctly", async () => {
            let dbStorage = {};
            jest.spyOn(DatabaseStorage.prototype, "open").mockImplementation(
                async (): Promise<void> => {
                    dbStorage = {};
                }
            );
            const browserStorage = new BrowserCacheManager(
                TEST_CONFIG.MSAL_CLIENT_ID,
                cacheConfig,
                browserCrypto,
                logger
            );
            const tokenRequest: AuthorizationCodeRequest = {
                redirectUri: `${TEST_URIS.DEFAULT_INSTANCE}`,
                scopes: [Constants.OPENID_SCOPE, Constants.PROFILE_SCOPE],
                code: "thisIsAnAuthCode",
                codeVerifier: TEST_CONFIG.TEST_VERIFIER,
                authority: `${Constants.DEFAULT_AUTHORITY}/`,
                correlationId: `${RANDOM_TEST_GUID}`,
                authenticationScheme: AuthenticationScheme.BEARER,
            };
            const stringifiedRequest = JSON.stringify(tokenRequest);
            browserStorage.setTemporaryCache(
                TemporaryCacheKeys.REQUEST_PARAMS,
                stringifiedRequest.substring(0, stringifiedRequest.length / 2),
                true
            );
            expect(() =>
                browserStorage.getCachedRequest(RANDOM_TEST_GUID)
            ).toThrowError(
                BrowserAuthErrorMessage.unableToParseTokenRequestCacheError.desc
            );
        });

        it("Uses authority from cache if not present in cached request", async () => {
            let dbStorage = {};
            jest.spyOn(DatabaseStorage.prototype, "open").mockImplementation(
                async (): Promise<void> => {
                    dbStorage = {};
                }
            );
            const browserStorage = new BrowserCacheManager(
                TEST_CONFIG.MSAL_CLIENT_ID,
                cacheConfig,
                browserCrypto,
                logger
            );
            // Set up cache
            const authorityKey = browserStorage.generateAuthorityKey(
                TEST_STATE_VALUES.TEST_STATE_REDIRECT
            );
            const alternateAuthority = `${TEST_URIS.ALTERNATE_INSTANCE}/common/`;
            browserStorage.setItem(authorityKey, alternateAuthority);

            const cachedRequest: AuthorizationCodeRequest = {
                redirectUri: TEST_URIS.TEST_REDIR_URI,
                code: "thisIsACode",
                codeVerifier: TEST_CONFIG.TEST_VERIFIER,
                correlationId: RANDOM_TEST_GUID,
                scopes: [TEST_CONFIG.MSAL_CLIENT_ID],
                authority: "",
                authenticationScheme: AuthenticationScheme.BEARER,
            };
            const stringifiedRequest = browserCrypto.base64Encode(
                JSON.stringify(cachedRequest)
            );
            browserStorage.setTemporaryCache(
                TemporaryCacheKeys.REQUEST_PARAMS,
                stringifiedRequest,
                true
            );

            // Perform test
            const tokenRequest = browserStorage.getCachedRequest(
                TEST_STATE_VALUES.TEST_STATE_REDIRECT
            );
            expect(tokenRequest.authority).toBe(alternateAuthority);
        });

        it("cleanRequestByInteractionType() returns early if state is not present", () => {
            let dbStorage = {};
            jest.spyOn(DatabaseStorage.prototype, "open").mockImplementation(
                async (): Promise<void> => {
                    dbStorage = {};
                }
            );
            const browserStorage = new BrowserCacheManager(
                TEST_CONFIG.MSAL_CLIENT_ID,
                cacheConfig,
                browserCrypto,
                logger
            );

            const cacheKey = "cacheKey";
            const cacheValue = "cacheValue";
            browserStorage.setTemporaryCache(cacheKey, cacheValue, true);
            browserStorage.cleanRequestByInteractionType(
                InteractionType.Redirect
            );
            expect(browserStorage.getTemporaryCache(cacheKey, true)).toBe(
                cacheValue
            );
            browserStorage.clear();
        });

        it("cleanRequestByInteractionType() cleans cache", () => {
            let dbStorage = {};
            jest.spyOn(DatabaseStorage.prototype, "open").mockImplementation(
                async (): Promise<void> => {
                    dbStorage = {};
                }
            );
            const browserStorage = new BrowserCacheManager(
                TEST_CONFIG.MSAL_CLIENT_ID,
                cacheConfig,
                browserCrypto,
                logger
            );

            const browserState: BrowserStateObject = {
                interactionType: InteractionType.Redirect,
            };

            jest.spyOn(CryptoOps.prototype, "createNewGuid").mockReturnValue(
                RANDOM_TEST_GUID
            );
            const state = ProtocolUtils.setRequestState(
                browserCrypto,
                undefined,
                browserState
            );
            const cacheKey = `cacheKey.${state}`;
            const cacheValue = "cacheValue";
            browserStorage.setTemporaryCache(cacheKey, cacheValue, true);
            browserStorage.setTemporaryCache(
                `${TemporaryCacheKeys.REQUEST_STATE}.${RANDOM_TEST_GUID}`,
                state,
                true
            );
            browserStorage.cleanRequestByInteractionType(
                InteractionType.Redirect
            );
            expect(browserStorage.getKeys()).toHaveLength(0);
        });
        it("cleanRequestByInteractionType() interaction status even no request is in progress", () => {
            let dbStorage = {};
            jest.spyOn(DatabaseStorage.prototype, "open").mockImplementation(
                async (): Promise<void> => {
                    dbStorage = {};
                }
            );
            const browserStorage = new BrowserCacheManager(
                TEST_CONFIG.MSAL_CLIENT_ID,
                {
                    ...cacheConfig,
                    storeAuthStateInCookie: true,
                },
                browserCrypto,
                logger
            );

            browserStorage.setInteractionInProgress(true);
            browserStorage.cleanRequestByInteractionType(
                InteractionType.Redirect
            );
            expect(browserStorage.getInteractionInProgress()).toBeFalsy();
        });

        it("addTokenKey adds credential to key map and removeTokenKey removes the given credential from the key map", () => {
            const browserStorage = new BrowserCacheManager(
                TEST_CONFIG.MSAL_CLIENT_ID,
                {
                    ...cacheConfig,
                },
                browserCrypto,
                logger
            );

            expect(browserStorage.getTokenKeys()).toStrictEqual({
                idToken: [],
                accessToken: [],
                refreshToken: [],
            });

            browserStorage.addTokenKey("idToken1", CredentialType.ID_TOKEN);
            browserStorage.addTokenKey("idToken2", CredentialType.ID_TOKEN);
            expect(browserStorage.getTokenKeys()).toStrictEqual({
                idToken: ["idToken1", "idToken2"],
                accessToken: [],
                refreshToken: [],
            });

            browserStorage.addTokenKey(
                "accessToken1",
                CredentialType.ACCESS_TOKEN
            );
            browserStorage.addTokenKey(
                "accessToken2",
                CredentialType.ACCESS_TOKEN
            );
            expect(browserStorage.getTokenKeys()).toStrictEqual({
                idToken: ["idToken1", "idToken2"],
                accessToken: ["accessToken1", "accessToken2"],
                refreshToken: [],
            });

            browserStorage.addTokenKey(
                "refreshToken1",
                CredentialType.REFRESH_TOKEN
            );
            browserStorage.addTokenKey(
                "refreshToken2",
                CredentialType.REFRESH_TOKEN
            );
            expect(browserStorage.getTokenKeys()).toStrictEqual({
                idToken: ["idToken1", "idToken2"],
                accessToken: ["accessToken1", "accessToken2"],
                refreshToken: ["refreshToken1", "refreshToken2"],
            });

            browserStorage.removeTokenKey("idToken1", CredentialType.ID_TOKEN);
            expect(browserStorage.getTokenKeys()).toStrictEqual({
                idToken: ["idToken2"],
                accessToken: ["accessToken1", "accessToken2"],
                refreshToken: ["refreshToken1", "refreshToken2"],
            });

            browserStorage.removeTokenKey(
                "accessToken2",
                CredentialType.ACCESS_TOKEN
            );
            expect(browserStorage.getTokenKeys()).toStrictEqual({
                idToken: ["idToken2"],
                accessToken: ["accessToken1"],
                refreshToken: ["refreshToken1", "refreshToken2"],
            });

            browserStorage.removeTokenKey(
                "refreshToken1",
                CredentialType.REFRESH_TOKEN
            );
            expect(browserStorage.getTokenKeys()).toStrictEqual({
                idToken: ["idToken2"],
                accessToken: ["accessToken1"],
                refreshToken: ["refreshToken2"],
            });

            // Attempting to remove keys which exist as a different credential type results in a no-op
            browserStorage.removeTokenKey(
                "idToken2",
                CredentialType.ACCESS_TOKEN
            );
            browserStorage.removeTokenKey(
                "idToken2",
                CredentialType.REFRESH_TOKEN
            );
            browserStorage.removeTokenKey(
                "accessToken1",
                CredentialType.ID_TOKEN
            );
            browserStorage.removeTokenKey(
                "accessToken1",
                CredentialType.REFRESH_TOKEN
            );
            browserStorage.removeTokenKey(
                "refreshToken2",
                CredentialType.ID_TOKEN
            );
            browserStorage.removeTokenKey(
                "refreshToken2",
                CredentialType.ACCESS_TOKEN
            );
            expect(browserStorage.getTokenKeys()).toStrictEqual({
                idToken: ["idToken2"],
                accessToken: ["accessToken1"],
                refreshToken: ["refreshToken2"],
            });
        });
    });
});
