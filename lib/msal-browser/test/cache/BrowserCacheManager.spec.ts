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
    CredentialType,
    ProtocolMode,
    CacheHelpers,
    CacheError,
    CacheErrorCodes,
    CacheManager,
    PerformanceEvent,
    StubPerformanceClient,
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
import { CookieStorage } from "../../src/cache/CookieStorage.js";

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
            const cacheManager = new BrowserCacheManager(
                TEST_CONFIG.MSAL_CLIENT_ID,
                { ...cacheConfig, cacheLocation: "notALocation" },
                browserCrypto,
                logger,
                new StubPerformanceClient()
            );
            // @ts-ignore
            cacheManager.browserStorage.setItem("key", "value");
            expect(window.localStorage.getItem("key")).toBeNull();
            expect(window.sessionStorage.getItem("key")).toBeNull();
            // @ts-ignore
            expect(cacheManager.browserStorage.getItem("key")).toBe("value");
        });

        it("Falls back to memory storage if storage is not supported", () => {
            // Test sessionStorage not supported
            // @ts-ignore
            jest.spyOn(window, "sessionStorage", "get").mockReturnValue(null);
            const sessionCache = new BrowserCacheManager(
                TEST_CONFIG.MSAL_CLIENT_ID,
                cacheConfig,
                browserCrypto,
                logger,
                new StubPerformanceClient()
            );
            // @ts-ignore
            sessionCache.browserStorage.setItem("key", "value");
            // @ts-ignore
            expect(sessionCache.browserStorage.getItem("key")).toBe("value");

            // Test local storage not supported
            // @ts-ignore
            jest.spyOn(window, "localStorage", "get").mockReturnValue(null);
            const localCache = new BrowserCacheManager(
                TEST_CONFIG.MSAL_CLIENT_ID,
                {
                    ...cacheConfig,
                    cacheLocation: BrowserCacheLocation.LocalStorage,
                },
                browserCrypto,
                logger,
                new StubPerformanceClient()
            );
            // @ts-ignore
            localCache.browserStorage.setItem("key", "value");
            // @ts-ignore
            expect(localCache.browserStorage.getItem("key")).toBe("value");
        });
    });

    describe("Interface functions", () => {
        let browserSessionStorage: BrowserCacheManager;
        let authority: Authority;
        let browserLocalStorage: BrowserCacheManager;
        let cacheVal: string;
        let msalCacheKey: string;
        let msalCacheKey2: string;
        beforeEach(async () => {
            browserSessionStorage = new BrowserCacheManager(
                TEST_CONFIG.MSAL_CLIENT_ID,
                cacheConfig,
                browserCrypto,
                logger,
                new StubPerformanceClient()
            );
            await browserSessionStorage.initialize(TEST_CONFIG.CORRELATION_ID);
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
            browserLocalStorage = new BrowserCacheManager(
                TEST_CONFIG.MSAL_CLIENT_ID,
                {
                    ...cacheConfig,
                    cacheLocation: BrowserCacheLocation.LocalStorage,
                },
                browserCrypto,
                logger,
                new StubPerformanceClient()
            );
            await browserLocalStorage.initialize(TEST_CONFIG.CORRELATION_ID);
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
            browserLocalStorage = new BrowserCacheManager(
                TEST_CONFIG.MSAL_CLIENT_ID,
                {
                    ...cacheConfig,
                    cacheLocation: BrowserCacheLocation.LocalStorage,
                },
                browserCrypto,
                logger,
                new StubPerformanceClient()
            );
            expect(browserLocalStorage.getTemporaryCache(testTempItemKey)).toBe(
                testTempItemValue
            );
        });

        it("setItem", () => {
            window.sessionStorage.setItem(msalCacheKey, cacheVal);
            window.localStorage.setItem(msalCacheKey2, cacheVal);
            expect(window.sessionStorage.getItem(msalCacheKey)).toBe(cacheVal);
            expect(window.localStorage.getItem(msalCacheKey2)).toBe(cacheVal);
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
            window.localStorage.setItem(msalCacheKey, cacheVal);
            window.localStorage.setItem(msalCacheKey2, cacheVal);
            expect(browserLocalStorage.getKeys()).toEqual([
                "msal.account.keys",
                `msal.token.keys.${TEST_CONFIG.MSAL_CLIENT_ID}`,
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
                    window.localStorage.setItem(key, "this is not json");
                    window.sessionStorage.setItem(key, "this is not json");

                    expect(browserSessionStorage.getAccount(key)).toBeNull();
                    expect(browserLocalStorage.getAccount(key)).toBeNull();
                });

                it("getAccount returns null if value is not account entity", () => {
                    const key = "testKey";
                    const partialAccount = {
                        homeAccountId: "home-accountId",
                    };

                    window.localStorage.setItem(
                        key,
                        JSON.stringify(partialAccount)
                    );
                    window.sessionStorage.setItem(
                        key,
                        JSON.stringify(partialAccount)
                    );

                    expect(browserSessionStorage.getAccount(key)).toBeNull();
                    expect(browserLocalStorage.getAccount(key)).toBeNull();
                });

                it("getAccount returns AccountEntity", async () => {
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

                    await browserLocalStorage.setAccount(
                        testAccount,
                        TEST_CONFIG.CORRELATION_ID
                    );
                    await browserSessionStorage.setAccount(
                        testAccount,
                        TEST_CONFIG.CORRELATION_ID
                    );

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
                    window.localStorage.setItem(key, "this is not json");
                    window.sessionStorage.setItem(key, "this is not json");

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

                    window.localStorage.setItem(
                        key,
                        JSON.stringify(partialIdTokenEntity)
                    );
                    window.sessionStorage.setItem(
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

                it("getIdTokenCredential returns IdTokenEntity", async () => {
                    const testIdToken = CacheHelpers.createIdTokenEntity(
                        "homeAccountId",
                        "environment",
                        TEST_TOKENS.IDTOKEN_V2,
                        "client-id",
                        "tenantId"
                    );

                    await browserLocalStorage.setIdTokenCredential(
                        testIdToken,
                        TEST_CONFIG.CORRELATION_ID
                    );
                    await browserSessionStorage.setIdTokenCredential(
                        testIdToken,
                        TEST_CONFIG.CORRELATION_ID
                    );

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
                    window.localStorage.setItem(key, "this is not json");
                    window.sessionStorage.setItem(key, "this is not json");

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

                    window.localStorage.setItem(
                        key,
                        JSON.stringify(partialAccessTokenEntity)
                    );
                    window.sessionStorage.setItem(
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

                it("getAccessTokenCredential returns AccessTokenEntity", async () => {
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

                    await browserLocalStorage.setAccessTokenCredential(
                        testAccessToken,
                        TEST_CONFIG.CORRELATION_ID
                    );
                    await browserSessionStorage.setAccessTokenCredential(
                        testAccessToken,
                        TEST_CONFIG.CORRELATION_ID
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

                it("getAccessTokenCredential returns Bearer access token when authentication scheme is set to Bearer and both a Bearer and pop token are in the cache", async () => {
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
                    await browserLocalStorage.setAccessTokenCredential(
                        testAccessTokenWithoutAuthScheme,
                        TEST_CONFIG.CORRELATION_ID
                    );
                    await browserSessionStorage.setAccessTokenCredential(
                        testAccessTokenWithoutAuthScheme,
                        TEST_CONFIG.CORRELATION_ID
                    );
                });

                it("getAccessTokenCredential returns Bearer access token when authentication scheme is set to Bearer and both a Bearer and pop token are in the cache", async () => {
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
                    await browserLocalStorage.setAccessTokenCredential(
                        testAccessTokenWithoutAuthScheme,
                        TEST_CONFIG.CORRELATION_ID
                    );
                    await browserSessionStorage.setAccessTokenCredential(
                        testAccessTokenWithoutAuthScheme,
                        TEST_CONFIG.CORRELATION_ID
                    );

                    // Cache pop token
                    await browserLocalStorage.setAccessTokenCredential(
                        testAccessTokenWithAuthScheme,
                        TEST_CONFIG.CORRELATION_ID
                    );
                    await browserSessionStorage.setAccessTokenCredential(
                        testAccessTokenWithAuthScheme,
                        TEST_CONFIG.CORRELATION_ID
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

                it("getAccessTokenCredential returns PoP access token when authentication scheme is set to pop and both a Bearer and pop token are in the cache", async () => {
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
                    await browserLocalStorage.setAccessTokenCredential(
                        testAccessTokenWithoutAuthScheme,
                        TEST_CONFIG.CORRELATION_ID
                    );
                    await browserSessionStorage.setAccessTokenCredential(
                        testAccessTokenWithoutAuthScheme,
                        TEST_CONFIG.CORRELATION_ID
                    );

                    // Cache pop token
                    await browserLocalStorage.setAccessTokenCredential(
                        testAccessTokenWithAuthScheme,
                        TEST_CONFIG.CORRELATION_ID
                    );
                    await browserSessionStorage.setAccessTokenCredential(
                        testAccessTokenWithAuthScheme,
                        TEST_CONFIG.CORRELATION_ID
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

                it("clearTokensWithClaimsInCache clears all access tokens with claims in tokenKeys", async () => {
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

                    await browserLocalStorage.setAccessTokenCredential(
                        testAT1,
                        TEST_CONFIG.CORRELATION_ID
                    );
                    await browserSessionStorage.setAccessTokenCredential(
                        testAT1,
                        TEST_CONFIG.CORRELATION_ID
                    );
                    await browserLocalStorage.setAccessTokenCredential(
                        testAT2,
                        TEST_CONFIG.CORRELATION_ID
                    );
                    await browserSessionStorage.setAccessTokenCredential(
                        testAT2,
                        TEST_CONFIG.CORRELATION_ID
                    );
                    await browserLocalStorage.setAccessTokenCredential(
                        testAT3,
                        TEST_CONFIG.CORRELATION_ID
                    );
                    await browserSessionStorage.setAccessTokenCredential(
                        testAT3,
                        TEST_CONFIG.CORRELATION_ID
                    );
                    await browserLocalStorage.setAccessTokenCredential(
                        testAT4,
                        TEST_CONFIG.CORRELATION_ID
                    );
                    await browserSessionStorage.setAccessTokenCredential(
                        testAT4,
                        TEST_CONFIG.CORRELATION_ID
                    );

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
                    window.localStorage.setItem(key, "this is not json");
                    window.sessionStorage.setItem(key, "this is not json");

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

                    window.localStorage.setItem(
                        key,
                        JSON.stringify(partialRefreshTokenEntity)
                    );
                    window.sessionStorage.setItem(
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

                it("getRefreshTokenCredential returns RefreshTokenEntity", async () => {
                    const testRefreshToken =
                        CacheHelpers.createRefreshTokenEntity(
                            "homeAccountId",
                            "environment",
                            TEST_TOKENS.REFRESH_TOKEN,
                            "client-id",
                            "familyId",
                            "oboAssertion"
                        );

                    await browserLocalStorage.setRefreshTokenCredential(
                        testRefreshToken,
                        TEST_CONFIG.CORRELATION_ID
                    );
                    await browserSessionStorage.setRefreshTokenCredential(
                        testRefreshToken,
                        TEST_CONFIG.CORRELATION_ID
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
                    window.localStorage.setItem(key, "this is not json");
                    window.sessionStorage.setItem(key, "this is not json");

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

                    window.localStorage.setItem(
                        key,
                        JSON.stringify(partialAppMetadataEntity)
                    );
                    window.sessionStorage.setItem(
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
                    window.localStorage.setItem(key, "this is not json");
                    window.sessionStorage.setItem(key, "this is not json");

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

                    window.localStorage.setItem(
                        key,
                        JSON.stringify(partialServerTelemetryEntity)
                    );
                    window.sessionStorage.setItem(
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
                    window.localStorage.setItem(key, "this is not json");
                    window.sessionStorage.setItem(key, "this is not json");

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

                    window.localStorage.setItem(
                        key,
                        JSON.stringify(partialThrottlingEntity)
                    );
                    window.sessionStorage.setItem(
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
                        perfClient
                    );

                    jest.spyOn(
                        CacheManager.prototype,
                        "saveCacheRecord"
                    ).mockRejectedValue(cacheError);

                    // @ts-ignore
                    const callbackId = perfClient.addPerformanceCallback(
                        (events: PerformanceEvent[]) => {
                            expect(events.length).toEqual(1);
                            const event = events[0];
                            if (event.name !== "test-measurement") {
                                return;
                            }
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
                        .setAccessTokenCredential(
                            testAccessToken,
                            TEST_CONFIG.CORRELATION_ID
                        )
                        .then(() =>
                            cacheManager
                                .saveCacheRecord(
                                    {},
                                    "test-correlation-id",
                                    undefined
                                )
                                .then(() => {
                                    throw new Error(
                                        "saveCacheRecord should have thrown"
                                    );
                                })
                                .catch((e) => {
                                    expect(e).toBeInstanceOf(CacheError);
                                    measurement.end({ success: false }, e);
                                })
                        );
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
        beforeEach(async () => {
            browserSessionStorage = new BrowserCacheManager(
                TEST_CONFIG.MSAL_CLIENT_ID,
                cacheConfig,
                browserCrypto,
                logger,
                new StubPerformanceClient()
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
            browserLocalStorage = new BrowserCacheManager(
                TEST_CONFIG.MSAL_CLIENT_ID,
                {
                    ...cacheConfig,
                    cacheLocation: BrowserCacheLocation.LocalStorage,
                    temporaryCacheLocation: BrowserCacheLocation.LocalStorage,
                },
                browserCrypto,
                logger,
                new StubPerformanceClient()
            );
            await browserLocalStorage.initialize(TEST_CONFIG.CORRELATION_ID);
            await browserSessionStorage.initialize(TEST_CONFIG.CORRELATION_ID);
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
            browserLocalStorage = new BrowserCacheManager(
                TEST_CONFIG.MSAL_CLIENT_ID,
                {
                    ...cacheConfig,
                    cacheLocation: BrowserCacheLocation.LocalStorage,
                },
                browserCrypto,
                logger,
                new StubPerformanceClient()
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
                    window.localStorage.setItem(key, "this is not json");
                    window.sessionStorage.setItem(key, "this is not json");

                    expect(browserSessionStorage.getAccount(key)).toBeNull();
                    expect(browserLocalStorage.getAccount(key)).toBeNull();
                });

                it("getAccount returns null if value is not account entity", () => {
                    const key = "testKey";
                    const partialAccount = {
                        homeAccountId: "home-accountId",
                    };

                    window.localStorage.setItem(
                        key,
                        JSON.stringify(partialAccount)
                    );
                    window.sessionStorage.setItem(
                        key,
                        JSON.stringify(partialAccount)
                    );

                    expect(browserSessionStorage.getAccount(key)).toBeNull();
                    expect(browserLocalStorage.getAccount(key)).toBeNull();
                });

                it("getAccount returns AccountEntity", async () => {
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

                    await browserLocalStorage.setAccount(
                        testAccount,
                        TEST_CONFIG.CORRELATION_ID
                    );
                    await browserSessionStorage.setAccount(
                        testAccount,
                        TEST_CONFIG.CORRELATION_ID
                    );

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
                    window.localStorage.setItem(key, "this is not json");
                    window.sessionStorage.setItem(key, "this is not json");

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

                    window.localStorage.setItem(
                        key,
                        JSON.stringify(partialIdTokenEntity)
                    );
                    window.sessionStorage.setItem(
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

                it("getIdTokenCredential returns IdTokenEntity", async () => {
                    const testIdToken = CacheHelpers.createIdTokenEntity(
                        "homeAccountId",
                        "environment",
                        TEST_TOKENS.IDTOKEN_V2,
                        "client-id",
                        "tenantId"
                    );

                    await browserLocalStorage.setIdTokenCredential(
                        testIdToken,
                        TEST_CONFIG.CORRELATION_ID
                    );
                    await browserSessionStorage.setIdTokenCredential(
                        testIdToken,
                        TEST_CONFIG.CORRELATION_ID
                    );

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
                    window.localStorage.setItem(key, "this is not json");
                    window.sessionStorage.setItem(key, "this is not json");

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

                    window.localStorage.setItem(
                        key,
                        JSON.stringify(partialAccessTokenEntity)
                    );
                    window.sessionStorage.setItem(
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

                it("getAccessTokenCredential returns AccessTokenEntity", async () => {
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

                    await browserLocalStorage.setAccessTokenCredential(
                        testAccessToken,
                        TEST_CONFIG.CORRELATION_ID
                    );
                    await browserSessionStorage.setAccessTokenCredential(
                        testAccessToken,
                        TEST_CONFIG.CORRELATION_ID
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

                it("getAccessTokenCredential returns Bearer access token when authentication scheme is set to Bearer and both a Bearer and pop token are in the cache", async () => {
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
                    await browserLocalStorage.setAccessTokenCredential(
                        testAccessTokenWithoutAuthScheme,
                        TEST_CONFIG.CORRELATION_ID
                    );
                    await browserSessionStorage.setAccessTokenCredential(
                        testAccessTokenWithoutAuthScheme,
                        TEST_CONFIG.CORRELATION_ID
                    );

                    // Cache pop token
                    await browserLocalStorage.setAccessTokenCredential(
                        testAccessTokenWithAuthScheme,
                        TEST_CONFIG.CORRELATION_ID
                    );
                    await browserSessionStorage.setAccessTokenCredential(
                        testAccessTokenWithAuthScheme,
                        TEST_CONFIG.CORRELATION_ID
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

                it("getAccessTokenCredential returns PoP access token when authentication scheme is set to pop and both a Bearer and pop token are in the cache", async () => {
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
                    await browserLocalStorage.setAccessTokenCredential(
                        testAccessTokenWithoutAuthScheme,
                        TEST_CONFIG.CORRELATION_ID
                    );
                    await browserSessionStorage.setAccessTokenCredential(
                        testAccessTokenWithoutAuthScheme,
                        TEST_CONFIG.CORRELATION_ID
                    );

                    // Cache pop token
                    await browserLocalStorage.setAccessTokenCredential(
                        testAccessTokenWithAuthScheme,
                        TEST_CONFIG.CORRELATION_ID
                    );
                    await browserSessionStorage.setAccessTokenCredential(
                        testAccessTokenWithAuthScheme,
                        TEST_CONFIG.CORRELATION_ID
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
                    window.localStorage.setItem(key, "this is not json");
                    window.sessionStorage.setItem(key, "this is not json");

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

                    window.localStorage.setItem(
                        key,
                        JSON.stringify(partialRefreshTokenEntity)
                    );
                    window.sessionStorage.setItem(
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

                it("getRefreshTokenCredential returns RefreshTokenEntity", async () => {
                    const testRefreshToken =
                        CacheHelpers.createRefreshTokenEntity(
                            "homeAccountId",
                            "environment",
                            TEST_TOKENS.REFRESH_TOKEN,
                            "client-id",
                            "familyId",
                            "oboAssertion"
                        );

                    await browserLocalStorage.setRefreshTokenCredential(
                        testRefreshToken,
                        TEST_CONFIG.CORRELATION_ID
                    );
                    await browserSessionStorage.setRefreshTokenCredential(
                        testRefreshToken,
                        TEST_CONFIG.CORRELATION_ID
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
                    window.localStorage.setItem(key, "this is not json");
                    window.sessionStorage.setItem(key, "this is not json");

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

                    window.localStorage.setItem(
                        key,
                        JSON.stringify(partialAppMetadataEntity)
                    );
                    window.sessionStorage.setItem(
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
                    window.localStorage.setItem(key, "this is not json");
                    window.sessionStorage.setItem(key, "this is not json");

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

                    window.localStorage.setItem(
                        key,
                        JSON.stringify(partialServerTelemetryEntity)
                    );
                    window.sessionStorage.setItem(
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
                    window.localStorage.setItem(key, "this is not json");
                    window.sessionStorage.setItem(key, "this is not json");

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

                    window.localStorage.setItem(
                        key,
                        JSON.stringify(partialThrottlingEntity)
                    );
                    window.sessionStorage.setItem(
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
        beforeEach(async () => {
            browserSessionStorage = new BrowserCacheManager(
                TEST_CONFIG.MSAL_CLIENT_ID,
                {
                    ...cacheConfig,
                    cacheLocation: BrowserCacheLocation.SessionStorage,
                    storeAuthStateInCookie: true,
                },
                browserCrypto,
                logger,
                new StubPerformanceClient()
            );
            await browserSessionStorage.initialize(TEST_CONFIG.CORRELATION_ID);
            browserLocalStorage = new BrowserCacheManager(
                TEST_CONFIG.MSAL_CLIENT_ID,
                {
                    ...cacheConfig,
                    cacheLocation: BrowserCacheLocation.LocalStorage,
                    storeAuthStateInCookie: true,
                },
                browserCrypto,
                logger,
                new StubPerformanceClient()
            );
            await browserLocalStorage.initialize(TEST_CONFIG.CORRELATION_ID);
            browserMemoryStorage = new BrowserCacheManager(
                TEST_CONFIG.MSAL_CLIENT_ID,
                {
                    ...cacheConfig,
                    cacheLocation: BrowserCacheLocation.MemoryStorage,
                    storeAuthStateInCookie: true,
                },
                browserCrypto,
                logger,
                new StubPerformanceClient()
            );
            await browserMemoryStorage.initialize(TEST_CONFIG.CORRELATION_ID);
            cacheVal = "cacheVal";
            msalCacheKey = browserSessionStorage.generateCacheKey("cacheKey");
        });

        afterEach(async () => {
            await browserSessionStorage.clear();
            await browserLocalStorage.clear();
        });

        it("setTempCache()", () => {
            // sessionStorage
            browserSessionStorage.setTemporaryCache(
                msalCacheKey,
                cacheVal,
                true
            );
            expect(window.sessionStorage.getItem(msalCacheKey)).toBe(cacheVal);
            expect(document.cookie).toContain(`${msalCacheKey}=${cacheVal}`);
            // @ts-ignore
            browserSessionStorage.cookieStorage.removeItem(msalCacheKey);
            // localStorage
            browserLocalStorage.setTemporaryCache(msalCacheKey, cacheVal, true);
            expect(window.sessionStorage.getItem(msalCacheKey)).toBe(cacheVal);
            expect(document.cookie).toContain(`${msalCacheKey}=${cacheVal}`);
            // @ts-ignore
            browserLocalStorage.cookieStorage.removeItem(msalCacheKey);
            // browser memory
            browserMemoryStorage.setTemporaryCache(
                msalCacheKey,
                cacheVal,
                true
            );
            expect(browserMemoryStorage.getTemporaryCache(msalCacheKey)).toBe(
                cacheVal
            );
            expect(document.cookie).toContain(`${msalCacheKey}=${cacheVal}`);
            // @ts-ignore
            browserMemoryStorage.cookieStorage.removeItem(msalCacheKey);
        });

        it("getTempCache()", () => {
            // sessionStorage
            browserSessionStorage.setTemporaryCache(msalCacheKey, cacheVal);
            expect(
                browserSessionStorage.getTemporaryCache(msalCacheKey, true)
            ).toBe(cacheVal);
            expect(
                // @ts-ignore
                browserSessionStorage.cookieStorage.getItem(msalCacheKey)
            ).toEqual(cacheVal);
            // localStorage
            browserLocalStorage.setTemporaryCache(msalCacheKey, cacheVal);
            expect(
                browserLocalStorage.getTemporaryCache(msalCacheKey, true)
            ).toBe(cacheVal);
            expect(
                // @ts-ignore
                browserLocalStorage.cookieStorage.getItem(msalCacheKey)
            ).toEqual(cacheVal);
            // @ts-ignore
            browserMemoryStorage.setTemporaryCache(msalCacheKey, cacheVal);
            expect(
                browserMemoryStorage.getTemporaryCache(msalCacheKey, true)
            ).toBe(cacheVal);
            expect(
                // @ts-ignore
                browserMemoryStorage.cookieStorage.getItem(msalCacheKey)
            ).toEqual(cacheVal);
        });

        it("removeTemporaryItem()", () => {
            const clearCookieSpy = jest.spyOn(
                CookieStorage.prototype,
                "removeItem"
            );
            // sessionStorage
            browserSessionStorage.setTemporaryCache(
                msalCacheKey,
                cacheVal,
                true
            );
            expect(document.cookie).toContain(`${msalCacheKey}=${cacheVal}`);
            browserSessionStorage.removeTemporaryItem(msalCacheKey);
            expect(window.sessionStorage.getItem(msalCacheKey)).toBeNull();
            expect(document.cookie).not.toContain(
                `${msalCacheKey}=${cacheVal}`
            );
            expect(clearCookieSpy).toHaveBeenCalledTimes(1);
            // localStorage
            browserLocalStorage.setTemporaryCache(msalCacheKey, cacheVal, true);
            expect(document.cookie).toContain(`${msalCacheKey}=${cacheVal}`);
            browserLocalStorage.removeTemporaryItem(msalCacheKey);
            expect(window.localStorage.getItem(msalCacheKey)).toBeNull();
            expect(document.cookie).not.toContain(
                `${msalCacheKey}=${cacheVal}`
            );
            expect(clearCookieSpy).toHaveBeenCalledTimes(2);
            // browser memory
            browserMemoryStorage.setTemporaryCache(
                msalCacheKey,
                cacheVal,
                true
            );
            expect(document.cookie).toContain(`${msalCacheKey}=${cacheVal}`);
            browserMemoryStorage.removeTemporaryItem(msalCacheKey);
            expect(
                // @ts-ignore
                browserMemoryStorage.temporaryCacheStorage.getItem(msalCacheKey)
            ).toBeNull();
            expect(document.cookie).not.toContain(
                `${msalCacheKey}=${cacheVal}`
            );
            expect(clearCookieSpy).toHaveBeenCalledTimes(3);
        });

        it("clear()", async () => {
            // sessionStorage
            browserSessionStorage.setTemporaryCache(msalCacheKey, cacheVal);
            expect(document.cookie).toContain(`${msalCacheKey}=${cacheVal}`);
            await browserSessionStorage.clear();
            expect(browserSessionStorage.getKeys()).toHaveLength(0);
            expect(document.cookie).not.toContain(
                `${msalCacheKey}=${cacheVal}`
            );
            // localStorage
            browserLocalStorage.setTemporaryCache(msalCacheKey, cacheVal);
            expect(document.cookie).toContain(`${msalCacheKey}=${cacheVal}`);
            await browserLocalStorage.clear();
            expect(browserLocalStorage.getKeys()).toHaveLength(0);
            expect(document.cookie).not.toContain(
                `${msalCacheKey}=${cacheVal}`
            );
            // browser memory
            browserMemoryStorage.setTemporaryCache(msalCacheKey, cacheVal);
            expect(document.cookie).toContain(`${msalCacheKey}=${cacheVal}`);
            await browserMemoryStorage.clear();
            expect(browserMemoryStorage.getKeys()).toHaveLength(0);
            expect(document.cookie).not.toContain(
                `${msalCacheKey}=${cacheVal}`
            );
        });

        it("setTempCache() with item that contains ==", () => {
            msalCacheKey = `${Constants.CACHE_PREFIX}.${TEST_STATE_VALUES.ENCODED_LIB_STATE}`;
            // sessionStorage
            browserSessionStorage.setTemporaryCache(msalCacheKey, cacheVal);
            expect(window.sessionStorage.getItem(msalCacheKey)).toBe(cacheVal);
            expect(document.cookie).toContain(
                `${encodeURIComponent(msalCacheKey)}=${cacheVal}`
            );
            // @ts-ignore
            browserSessionStorage.cookieStorage.removeItem(msalCacheKey);
            // localStorage
            browserLocalStorage.setTemporaryCache(msalCacheKey, cacheVal);
            expect(window.sessionStorage.getItem(msalCacheKey)).toBe(cacheVal);
            expect(document.cookie).toContain(
                `${encodeURIComponent(msalCacheKey)}=${cacheVal}`
            );
            // @ts-ignore
            browserLocalStorage.cookieStorage.removeItem(msalCacheKey);
            // browser memory
            browserMemoryStorage.setTemporaryCache(msalCacheKey, cacheVal);
            expect(browserMemoryStorage.getTemporaryCache(msalCacheKey)).toBe(
                cacheVal
            );
            expect(document.cookie).toContain(
                `${encodeURIComponent(msalCacheKey)}=${cacheVal}`
            );
            // @ts-ignore
            browserMemoryStorage.cookieStorage.removeItem(msalCacheKey);
        });

        it("getTempCache() with item that contains ==", () => {
            msalCacheKey = `${Constants.CACHE_PREFIX}.${TEST_STATE_VALUES.ENCODED_LIB_STATE}`;
            const getCookieSpy = jest.spyOn(CookieStorage.prototype, "getItem");
            // sessionStorage
            browserSessionStorage.setTemporaryCache(msalCacheKey, cacheVal);
            expect(browserSessionStorage.getTemporaryCache(msalCacheKey)).toBe(
                cacheVal
            );
            expect(getCookieSpy.mock.results[0].value).toEqual(cacheVal);
            expect(getCookieSpy).toHaveBeenCalledTimes(1);
            // localStorage
            browserLocalStorage.setTemporaryCache(msalCacheKey, cacheVal);
            expect(browserLocalStorage.getTemporaryCache(msalCacheKey)).toBe(
                cacheVal
            );
            expect(getCookieSpy.mock.results[1].value).toEqual(cacheVal);
            expect(getCookieSpy).toHaveBeenCalledTimes(2);
            // @ts-ignore
            browserMemoryStorage.setTemporaryCache(msalCacheKey, cacheVal);
            expect(browserLocalStorage.getTemporaryCache(msalCacheKey)).toBe(
                cacheVal
            );
            expect(getCookieSpy.mock.results[2].value).toEqual(cacheVal);
            expect(getCookieSpy).toHaveBeenCalledTimes(3);
        });

        it("removeTemporaryItem() with item that contains ==", () => {
            msalCacheKey = `${Constants.CACHE_PREFIX}.${TEST_STATE_VALUES.ENCODED_LIB_STATE}`;
            const clearCookieSpy = jest.spyOn(
                CookieStorage.prototype,
                "removeItem"
            );
            // sessionStorage
            browserSessionStorage.setTemporaryCache(msalCacheKey, cacheVal);
            expect(window.sessionStorage.getItem(msalCacheKey)).toBe(cacheVal);
            expect(document.cookie).toContain(`${msalCacheKey}=${cacheVal}`);
            browserSessionStorage.removeTemporaryItem(msalCacheKey);
            expect(window.sessionStorage.getItem(msalCacheKey)).toBeNull();
            expect(document.cookie).not.toContain(
                `${msalCacheKey}=${cacheVal}`
            );
            expect(clearCookieSpy).toHaveBeenCalledTimes(1);
            // localStorage
            browserLocalStorage.setTemporaryCache(msalCacheKey, cacheVal);
            expect(document.cookie).toContain(`${msalCacheKey}=${cacheVal}`);
            browserLocalStorage.removeTemporaryItem(msalCacheKey);
            expect(window.sessionStorage.getItem(msalCacheKey)).toBeNull();
            expect(document.cookie).not.toContain(
                `${msalCacheKey}=${cacheVal}`
            );
            expect(clearCookieSpy).toHaveBeenCalledTimes(2);
            // browser memory
            browserMemoryStorage.setTemporaryCache(msalCacheKey, cacheVal);
            expect(document.cookie).toContain(`${msalCacheKey}=${cacheVal}`);
            browserMemoryStorage.removeTemporaryItem(msalCacheKey);
            // @ts-ignore
            expect(
                browserMemoryStorage.getTemporaryCache(msalCacheKey)
            ).toBeNull();
            expect(document.cookie).not.toContain(
                `${msalCacheKey}=${cacheVal}`
            );
            expect(clearCookieSpy).toHaveBeenCalledTimes(3);
        });

        it("clear() with item that contains ==", async () => {
            msalCacheKey = `${Constants.CACHE_PREFIX}.${TEST_STATE_VALUES.ENCODED_LIB_STATE}`;
            // sessionStorage
            browserSessionStorage.setTemporaryCache(msalCacheKey, cacheVal);
            expect(document.cookie).toContain(`${msalCacheKey}=${cacheVal}`);
            await browserSessionStorage.clear();
            expect(browserSessionStorage.getKeys()).toHaveLength(0);
            expect(document.cookie).not.toContain(
                `${msalCacheKey}=${cacheVal}`
            );
            // localStorage
            browserLocalStorage.setTemporaryCache(msalCacheKey, cacheVal);
            expect(document.cookie).toContain(`${msalCacheKey}=${cacheVal}`);
            await browserLocalStorage.clear();
            expect(browserLocalStorage.getKeys()).toHaveLength(0);
            expect(document.cookie).not.toContain(
                `${msalCacheKey}=${cacheVal}`
            );
            // browser memory
            browserMemoryStorage.setTemporaryCache(msalCacheKey, cacheVal);
            expect(document.cookie).toContain(`${msalCacheKey}=${cacheVal}`);
            await browserMemoryStorage.clear();
            expect(browserMemoryStorage.getKeys()).toHaveLength(0);
            expect(document.cookie).not.toContain(
                `${msalCacheKey}=${cacheVal}`
            );
        });
    });

    describe("Helpers", () => {
        it("generateAuthorityKey() creates a valid cache key for authority strings", () => {
            const browserStorage = new BrowserCacheManager(
                TEST_CONFIG.MSAL_CLIENT_ID,
                cacheConfig,
                browserCrypto,
                logger,
                new StubPerformanceClient()
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
                logger,
                new StubPerformanceClient()
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
                logger,
                new StubPerformanceClient()
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
                logger,
                new StubPerformanceClient()
            );
            browserStorage.updateCacheEntries(
                stateString,
                "nonce",
                `${TEST_URIS.DEFAULT_INSTANCE}/`,
                "",
                null
            );
            window.sessionStorage.setItem(
                TemporaryCacheKeys.REQUEST_PARAMS,
                "TestRequestParams"
            );
            window.sessionStorage.setItem(
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
                logger,
                new StubPerformanceClient()
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
                logger,
                new StubPerformanceClient()
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
                logger,
                new StubPerformanceClient()
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
                logger,
                new StubPerformanceClient()
            );
            // Set up cache
            const authorityKey = browserStorage.generateAuthorityKey(
                TEST_STATE_VALUES.TEST_STATE_REDIRECT
            );
            const alternateAuthority = `${TEST_URIS.ALTERNATE_INSTANCE}/common/`;
            window.sessionStorage.setItem(authorityKey, alternateAuthority);

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
                logger,
                new StubPerformanceClient()
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
                logger,
                new StubPerformanceClient()
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
                logger,
                new StubPerformanceClient()
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
                logger,
                new StubPerformanceClient()
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
