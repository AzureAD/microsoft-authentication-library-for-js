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
    CommonAuthorizationCodeRequest as AuthorizationCodeRequest,
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
    CommonAuthorizationUrlRequest,
    ResponseMode,
} from "@azure/msal-common";
import {
    BrowserCacheLocation,
    INTERACTION_TYPE,
    TemporaryCacheKeys,
} from "../../src/utils/BrowserConstants.js";
import { CryptoOps } from "../../src/crypto/CryptoOps.js";
import { DatabaseStorage } from "../../src/cache/DatabaseStorage.js";
import { BrowserCacheManager } from "../../src/cache/BrowserCacheManager.js";
import { base64Decode } from "../../src/encode/Base64Decode.js";
import { BrowserPerformanceClient } from "../../src/telemetry/BrowserPerformanceClient.js";
import { CookieStorage } from "../../src/cache/CookieStorage.js";
import { EventHandler } from "../../src/event/EventHandler.js";
import { version } from "../../src/packageMetadata.js";
import * as CacheKeys from "../../src/cache/CacheKeys.js";
import {
    getAccountKeysCacheKey,
    getTokenKeysCacheKey,
} from "../../src/cache/CacheKeys.js";

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
                new StubPerformanceClient(),
                new EventHandler()
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
                new StubPerformanceClient(),
                new EventHandler()
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
                new StubPerformanceClient(),
                new EventHandler()
            );
            // @ts-ignore
            localCache.browserStorage.setItem("key", "value");
            // @ts-ignore
            expect(localCache.browserStorage.getItem("key")).toBe("value");
        });
    });

    describe("initialize", () => {
        it("sets MSAL version in localStorage if not already set", async () => {
            const browserCacheManager = new BrowserCacheManager(
                TEST_CONFIG.MSAL_CLIENT_ID,
                {
                    ...cacheConfig,
                    cacheLocation: BrowserCacheLocation.LocalStorage,
                },
                browserCrypto,
                logger,
                new StubPerformanceClient(),
                new EventHandler()
            );
            await browserCacheManager.initialize(TEST_CONFIG.CORRELATION_ID);
            expect(
                window.localStorage.getItem(CacheKeys.VERSION_CACHE_KEY)
            ).toBe(version);
        });

        it("sets MSAL version in localStorage if previous version doesn't match", async () => {
            window.localStorage.setItem(CacheKeys.VERSION_CACHE_KEY, "1.0.0");
            const browserCacheManager = new BrowserCacheManager(
                TEST_CONFIG.MSAL_CLIENT_ID,
                {
                    ...cacheConfig,
                    cacheLocation: BrowserCacheLocation.LocalStorage,
                },
                browserCrypto,
                logger,
                new StubPerformanceClient(),
                new EventHandler()
            );
            await browserCacheManager.initialize(TEST_CONFIG.CORRELATION_ID);
            expect(
                window.localStorage.getItem(CacheKeys.VERSION_CACHE_KEY)
            ).toBe(version);
        });

        it("does not set MSAL version in localStorage if existing version already matches", async () => {
            // First make sure the version gets set
            const browserCacheManager1 = new BrowserCacheManager(
                TEST_CONFIG.MSAL_CLIENT_ID,
                {
                    ...cacheConfig,
                    cacheLocation: BrowserCacheLocation.LocalStorage,
                },
                browserCrypto,
                logger,
                new StubPerformanceClient(),
                new EventHandler()
            );
            await browserCacheManager1.initialize(TEST_CONFIG.CORRELATION_ID);
            expect(
                window.localStorage.getItem(CacheKeys.VERSION_CACHE_KEY)
            ).toBe(version);

            const setSpy = jest.spyOn(Storage.prototype, "setItem");
            const browserCacheManager2 = new BrowserCacheManager(
                TEST_CONFIG.MSAL_CLIENT_ID,
                {
                    ...cacheConfig,
                    cacheLocation: BrowserCacheLocation.LocalStorage,
                },
                browserCrypto,
                logger,
                new StubPerformanceClient(),
                new EventHandler()
            );
            await browserCacheManager2.initialize(TEST_CONFIG.CORRELATION_ID);
            expect(
                window.localStorage.getItem(CacheKeys.VERSION_CACHE_KEY)
            ).toBe(version);
            expect(setSpy).not.toHaveBeenCalledWith(
                CacheKeys.VERSION_CACHE_KEY,
                expect.anything()
            );
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
                new StubPerformanceClient(),
                new EventHandler()
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
                new StubPerformanceClient(),
                new EventHandler()
            );
            await browserLocalStorage.initialize(TEST_CONFIG.CORRELATION_ID);
            cacheVal = "cacheVal";
            msalCacheKey = browserSessionStorage.generateCacheKey("cacheKey");
            msalCacheKey2 = browserSessionStorage.generateCacheKey("cacheKey2");
        });

        afterEach(async () => {
            browserSessionStorage.clear(RANDOM_TEST_GUID);
            browserLocalStorage.clear(RANDOM_TEST_GUID);
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
                new StubPerformanceClient(),
                new EventHandler()
            );
            expect(browserLocalStorage.getTemporaryCache(testTempItemKey)).toBe(
                testTempItemValue
            );
        });

        it("setItem", () => {
            browserSessionStorage.setItem(
                msalCacheKey,
                cacheVal,
                RANDOM_TEST_GUID
            );
            browserLocalStorage.setItem(
                msalCacheKey2,
                cacheVal,
                RANDOM_TEST_GUID
            );
            expect(window.sessionStorage.getItem(msalCacheKey)).toBe(cacheVal);
            expect(window.localStorage.getItem(msalCacheKey2)).toBe(cacheVal);
        });

        it("setItem removes old access tokens if cache quota is reached", async () => {
            const browserCacheManager = new BrowserCacheManager(
                TEST_CONFIG.MSAL_CLIENT_ID,
                cacheConfig,
                browserCrypto,
                logger,
                new StubPerformanceClient(),
                new EventHandler()
            );
            // Create a real AccessTokenEntity to be removed
            const accessToken1 = CacheHelpers.createAccessTokenEntity(
                "homeAccountId",
                "environment",
                TEST_TOKENS.ACCESS_TOKEN,
                TEST_CONFIG.MSAL_CLIENT_ID,
                "tenantId",
                "openid",
                1000,
                1000,
                browserCrypto.base64Decode,
                500,
                AuthenticationScheme.BEARER
            );
            const accessToken2 = CacheHelpers.createAccessTokenEntity(
                "homeAccountId2",
                "environment2",
                TEST_TOKENS.ACCESS_TOKEN,
                TEST_CONFIG.MSAL_CLIENT_ID,
                "tenantId2",
                "openid2",
                1000,
                1000,
                browserCrypto.base64Decode,
                500,
                AuthenticationScheme.BEARER
            );
            const atKey1 =
                browserCacheManager.generateCredentialKey(accessToken1);
            const atKey2 =
                browserCacheManager.generateCredentialKey(accessToken2);
            await browserCacheManager.setAccessTokenCredential(
                accessToken1,
                RANDOM_TEST_GUID
            );
            await browserCacheManager.setAccessTokenCredential(
                accessToken2,
                RANDOM_TEST_GUID
            );
            expect(window.sessionStorage.getItem(atKey1)).toBe(
                JSON.stringify(accessToken1)
            );
            expect(window.sessionStorage.getItem(atKey2)).toBe(
                JSON.stringify(accessToken2)
            );
            expect(browserCacheManager.getTokenKeys().accessToken).toEqual([
                atKey1,
                atKey2,
            ]);

            // Create a new AccessTokenEntity to be removed
            const newCacheKey = "test-cache-entry";
            const newCacheVal = "test-cache-value";

            // Simulate quota exceeded error on first setItem call, then succeed
            const setItemSpy = jest
                .spyOn(Storage.prototype, "setItem")
                .mockImplementationOnce(() => {
                    const error: any = new DOMException(
                        "The quota has been exceeded",
                        "QuotaExceededError"
                    );
                    throw error;
                });

            browserCacheManager.setItem(
                newCacheKey,
                newCacheVal,
                RANDOM_TEST_GUID
            );

            // The access token should have been removed from storage
            expect(window.sessionStorage.getItem(atKey1)).toBeNull();
            expect(window.sessionStorage.getItem(atKey2)).toBe(
                JSON.stringify(accessToken2)
            );
            // The new item should be set
            expect(window.sessionStorage.getItem(newCacheKey)).toBe(
                newCacheVal
            );
            // The token keys should be updated (accessToken array should be empty)
            expect(browserCacheManager.getTokenKeys().accessToken).toEqual([
                atKey2,
            ]);

            expect(setItemSpy).toHaveBeenCalledTimes(3);
        });

        it("setItem throws error if cache quota is reached and there are no access tokens left to remove", async () => {
            const browserCacheManager = new BrowserCacheManager(
                TEST_CONFIG.MSAL_CLIENT_ID,
                cacheConfig,
                browserCrypto,
                logger,
                new StubPerformanceClient(),
                new EventHandler()
            );
            // Create a real AccessTokenEntity to be removed
            const accessToken1 = CacheHelpers.createAccessTokenEntity(
                "homeAccountId",
                "environment",
                TEST_TOKENS.ACCESS_TOKEN,
                TEST_CONFIG.MSAL_CLIENT_ID,
                "tenantId",
                "openid",
                1000,
                1000,
                browserCrypto.base64Decode,
                500,
                AuthenticationScheme.BEARER
            );
            const accessToken2 = CacheHelpers.createAccessTokenEntity(
                "homeAccountId2",
                "environment2",
                TEST_TOKENS.ACCESS_TOKEN,
                TEST_CONFIG.MSAL_CLIENT_ID,
                "tenantId2",
                "openid2",
                1000,
                1000,
                browserCrypto.base64Decode,
                500,
                AuthenticationScheme.BEARER
            );
            const accessToken3 = CacheHelpers.createAccessTokenEntity(
                "homeAccountId3",
                "environment3",
                TEST_TOKENS.ACCESS_TOKEN,
                TEST_CONFIG.MSAL_CLIENT_ID,
                "tenantId3",
                "openid3",
                1000,
                1000,
                browserCrypto.base64Decode,
                500,
                AuthenticationScheme.BEARER
            );
            const atKey1 =
                browserCacheManager.generateCredentialKey(accessToken1);
            const atKey2 =
                browserCacheManager.generateCredentialKey(accessToken2);
            const atKey3 =
                browserCacheManager.generateCredentialKey(accessToken3);
            await browserCacheManager.setAccessTokenCredential(
                accessToken1,
                RANDOM_TEST_GUID
            );
            await browserCacheManager.setAccessTokenCredential(
                accessToken2,
                RANDOM_TEST_GUID
            );
            await browserCacheManager.setAccessTokenCredential(
                accessToken3,
                RANDOM_TEST_GUID
            );
            expect(window.sessionStorage.getItem(atKey1)).toBe(
                JSON.stringify(accessToken1)
            );
            expect(window.sessionStorage.getItem(atKey2)).toBe(
                JSON.stringify(accessToken2)
            );
            expect(window.sessionStorage.getItem(atKey3)).toBe(
                JSON.stringify(accessToken3)
            );
            expect(browserCacheManager.getTokenKeys().accessToken).toEqual([
                atKey1,
                atKey2,
                atKey3,
            ]);

            // Create a new AccessTokenEntity to be removed
            const newCacheKey = "test-cache-entry";
            const newCacheVal = "test-cache-value";

            const spy = jest
                .spyOn(Storage.prototype, "setItem")
                .mockImplementation(() => {
                    const error: any = new DOMException(
                        "The quota has been exceeded",
                        "QuotaExceededError"
                    );
                    throw error;
                });

            expect(() =>
                browserCacheManager.setItem(
                    newCacheKey,
                    newCacheVal,
                    RANDOM_TEST_GUID
                )
            ).toThrow(new CacheError(CacheErrorCodes.cacheQuotaExceeded));

            // The access token should have been removed from storage
            expect(window.sessionStorage.getItem(atKey1)).toBeNull();
            expect(window.sessionStorage.getItem(atKey2)).toBeNull();
            expect(window.sessionStorage.getItem(atKey3)).toBeNull();
            expect(window.sessionStorage.getItem(newCacheKey)).toBeNull();
            expect(browserCacheManager.getTokenKeys().accessToken).toHaveLength(
                3 // Failed to update token keys map, so it should still contain all 3 keys
            );
            expect(spy).toHaveBeenCalledTimes(4); // First attempt + 3 attempts after each access token removed
        });

        it("setItem throws error if cache quota is reached and 20 access tokens have already been removed", async () => {
            const browserCacheManager = new BrowserCacheManager(
                TEST_CONFIG.MSAL_CLIENT_ID,
                cacheConfig,
                browserCrypto,
                logger,
                new StubPerformanceClient(),
                new EventHandler()
            );

            const atKeys = [];
            for (let i = 0; i < 25; i++) {
                const accessToken = CacheHelpers.createAccessTokenEntity(
                    `homeAccountId${i}`,
                    `environment${i}`,
                    TEST_TOKENS.ACCESS_TOKEN,
                    TEST_CONFIG.MSAL_CLIENT_ID,
                    `tenantId${i}`,
                    `openid${i}`,
                    1000,
                    1000,
                    browserCrypto.base64Decode,
                    500,
                    AuthenticationScheme.BEARER
                );
                const atKey =
                    browserCacheManager.generateCredentialKey(accessToken);
                atKeys.push(atKey);
                await browserCacheManager.setAccessTokenCredential(
                    accessToken,
                    RANDOM_TEST_GUID
                );
                expect(window.sessionStorage.getItem(atKey)).toBe(
                    JSON.stringify(accessToken)
                );
            }
            expect(browserCacheManager.getTokenKeys().accessToken).toEqual(
                atKeys
            );

            // Create a new AccessTokenEntity to be removed
            const newCacheKey = "test-cache-entry";
            const newCacheVal = "test-cache-value";

            const spy = jest
                // @ts-ignore
                .spyOn(browserCacheManager.browserStorage, "setItem")
                .mockImplementation(() => {
                    const error: any = new DOMException(
                        "The quota has been exceeded",
                        "QuotaExceededError"
                    );
                    throw error;
                });

            expect(() =>
                browserCacheManager.setItem(
                    newCacheKey,
                    newCacheVal,
                    RANDOM_TEST_GUID
                )
            ).toThrow(new CacheError(CacheErrorCodes.cacheQuotaExceeded));

            // The access token should have been removed from storage
            for (let i = 0; i < 20; i++) {
                expect(window.sessionStorage.getItem(atKeys[i])).toBeNull();
            }
            for (let i = 20; i < 25; i++) {
                expect(window.sessionStorage.getItem(atKeys[i])).not.toBeNull();
            }
            expect(window.sessionStorage.getItem(newCacheKey)).toBeNull();
            expect(browserCacheManager.getTokenKeys().accessToken).toHaveLength(
                25 // Failed to update the token keys map, so it should still contain all 25 keys
            );
            expect(spy).toHaveBeenCalledTimes(21); // First attempt + 20 attempts after each access token removed
        });

        it("setUserData removes old access tokens if cache quota is reached", async () => {
            const browserCacheManager = new BrowserCacheManager(
                TEST_CONFIG.MSAL_CLIENT_ID,
                cacheConfig,
                browserCrypto,
                logger,
                new StubPerformanceClient(),
                new EventHandler()
            );
            // Create a real AccessTokenEntity to be removed
            const accessToken1 = CacheHelpers.createAccessTokenEntity(
                "homeAccountId",
                "environment",
                TEST_TOKENS.ACCESS_TOKEN,
                TEST_CONFIG.MSAL_CLIENT_ID,
                "tenantId",
                "openid",
                1000,
                1000,
                browserCrypto.base64Decode,
                500,
                AuthenticationScheme.BEARER
            );
            const accessToken2 = CacheHelpers.createAccessTokenEntity(
                "homeAccountId2",
                "environment2",
                TEST_TOKENS.ACCESS_TOKEN,
                TEST_CONFIG.MSAL_CLIENT_ID,
                "tenantId2",
                "openid2",
                1000,
                1000,
                browserCrypto.base64Decode,
                500,
                AuthenticationScheme.BEARER
            );
            const atKey1 =
                browserCacheManager.generateCredentialKey(accessToken1);
            const atKey2 =
                browserCacheManager.generateCredentialKey(accessToken2);
            await browserCacheManager.setAccessTokenCredential(
                accessToken1,
                RANDOM_TEST_GUID
            );
            await browserCacheManager.setAccessTokenCredential(
                accessToken2,
                RANDOM_TEST_GUID
            );
            expect(window.sessionStorage.getItem(atKey1)).toBe(
                JSON.stringify(accessToken1)
            );
            expect(window.sessionStorage.getItem(atKey2)).toBe(
                JSON.stringify(accessToken2)
            );
            expect(browserCacheManager.getTokenKeys().accessToken).toEqual([
                atKey1,
                atKey2,
            ]);

            // Create a new AccessTokenEntity to be removed
            const newCacheKey = "test-cache-entry";
            const newCacheVal = "test-cache-value";

            // Simulate quota exceeded error on first setItem call, then succeed
            const setItemSpy = jest
                .spyOn(Storage.prototype, "setItem")
                .mockImplementationOnce(() => {
                    const error: any = new DOMException(
                        "The quota has been exceeded",
                        "QuotaExceededError"
                    );
                    throw error;
                });

            await browserCacheManager.setUserData(
                newCacheKey,
                newCacheVal,
                RANDOM_TEST_GUID,
                Date.now().toString()
            );

            // The access token should have been removed from storage
            expect(window.sessionStorage.getItem(atKey1)).toBeNull();
            expect(window.sessionStorage.getItem(atKey2)).toBe(
                JSON.stringify(accessToken2)
            );
            // The new item should be set
            expect(window.sessionStorage.getItem(newCacheKey)).toBe(
                newCacheVal
            );
            // The token keys should be updated (accessToken array should be empty)
            expect(browserCacheManager.getTokenKeys().accessToken).toEqual([
                atKey2,
            ]);

            expect(setItemSpy).toHaveBeenCalledTimes(3);
        });

        it("setUserData throws error if cache quota is reached and there are no access tokens left to remove", async () => {
            const browserCacheManager = new BrowserCacheManager(
                TEST_CONFIG.MSAL_CLIENT_ID,
                cacheConfig,
                browserCrypto,
                logger,
                new StubPerformanceClient(),
                new EventHandler()
            );
            const atKeys = [];
            for (let i = 0; i < 25; i++) {
                const accessToken = CacheHelpers.createAccessTokenEntity(
                    `homeAccountId${i}`,
                    `environment${i}`,
                    TEST_TOKENS.ACCESS_TOKEN,
                    TEST_CONFIG.MSAL_CLIENT_ID,
                    `tenantId${i}`,
                    `openid${i}`,
                    1000,
                    1000,
                    browserCrypto.base64Decode,
                    500,
                    AuthenticationScheme.BEARER
                );
                const atKey =
                    browserCacheManager.generateCredentialKey(accessToken);
                atKeys.push(atKey);
                await browserCacheManager.setAccessTokenCredential(
                    accessToken,
                    RANDOM_TEST_GUID
                );
                expect(window.sessionStorage.getItem(atKey)).toBe(
                    JSON.stringify(accessToken)
                );
            }
            expect(browserCacheManager.getTokenKeys().accessToken).toEqual(
                atKeys
            );

            // Create a new AccessTokenEntity to be removed
            const newCacheKey = "test-cache-entry";
            const newCacheVal = "test-cache-value";
            const spy = jest
                .spyOn(Storage.prototype, "setItem")
                .mockImplementation(() => {
                    const error: any = new DOMException(
                        "The quota has been exceeded",
                        "QuotaExceededError"
                    );
                    throw error;
                });
            await expect(() =>
                browserCacheManager.setUserData(
                    newCacheKey,
                    newCacheVal,
                    RANDOM_TEST_GUID,
                    Date.now().toString()
                )
            ).rejects.toEqual(
                new CacheError(CacheErrorCodes.cacheQuotaExceeded)
            );

            // The access token should have been removed from storage
            for (let i = 0; i < 20; i++) {
                expect(window.sessionStorage.getItem(atKeys[i])).toBeNull();
            }
            for (let i = 20; i < 25; i++) {
                expect(window.sessionStorage.getItem(atKeys[i])).not.toBeNull();
            }
            expect(window.sessionStorage.getItem(newCacheKey)).toBeNull();
            expect(browserCacheManager.getTokenKeys().accessToken).toHaveLength(
                25 // Failed to update token keys map, so it should still contain all 25 keys
            );
            expect(spy).toHaveBeenCalledTimes(21); // First attempt + an attempt after each access token removed
        });

        it("setUserData throws error if cache quota is reached and there are no access tokens left to remove", async () => {
            const browserCacheManager = new BrowserCacheManager(
                TEST_CONFIG.MSAL_CLIENT_ID,
                cacheConfig,
                browserCrypto,
                logger,
                new StubPerformanceClient(),
                new EventHandler()
            );
            // Create a real AccessTokenEntity to be removed
            const accessToken1 = CacheHelpers.createAccessTokenEntity(
                "homeAccountId",
                "environment",
                TEST_TOKENS.ACCESS_TOKEN,
                TEST_CONFIG.MSAL_CLIENT_ID,
                "tenantId",
                "openid",
                1000,
                1000,
                browserCrypto.base64Decode,
                500,
                AuthenticationScheme.BEARER
            );
            const accessToken2 = CacheHelpers.createAccessTokenEntity(
                "homeAccountId2",
                "environment2",
                TEST_TOKENS.ACCESS_TOKEN,
                TEST_CONFIG.MSAL_CLIENT_ID,
                "tenantId2",
                "openid2",
                1000,
                1000,
                browserCrypto.base64Decode,
                500,
                AuthenticationScheme.BEARER
            );
            const accessToken3 = CacheHelpers.createAccessTokenEntity(
                "homeAccountId3",
                "environment3",
                TEST_TOKENS.ACCESS_TOKEN,
                TEST_CONFIG.MSAL_CLIENT_ID,
                "tenantId3",
                "openid3",
                1000,
                1000,
                browserCrypto.base64Decode,
                500,
                AuthenticationScheme.BEARER
            );
            const atKey1 =
                browserCacheManager.generateCredentialKey(accessToken1);
            const atKey2 =
                browserCacheManager.generateCredentialKey(accessToken2);
            const atKey3 =
                browserCacheManager.generateCredentialKey(accessToken3);
            await browserCacheManager.setAccessTokenCredential(
                accessToken1,
                RANDOM_TEST_GUID
            );
            await browserCacheManager.setAccessTokenCredential(
                accessToken2,
                RANDOM_TEST_GUID
            );
            await browserCacheManager.setAccessTokenCredential(
                accessToken3,
                RANDOM_TEST_GUID
            );
            expect(window.sessionStorage.getItem(atKey1)).toBe(
                JSON.stringify(accessToken1)
            );
            expect(window.sessionStorage.getItem(atKey2)).toBe(
                JSON.stringify(accessToken2)
            );
            expect(window.sessionStorage.getItem(atKey3)).toBe(
                JSON.stringify(accessToken3)
            );
            expect(browserCacheManager.getTokenKeys().accessToken).toEqual([
                atKey1,
                atKey2,
                atKey3,
            ]);

            // Create a new AccessTokenEntity to be removed
            const newCacheKey = "test-cache-entry";
            const newCacheVal = "test-cache-value";
            const spy = jest
                // @ts-ignore
                .spyOn(browserCacheManager.browserStorage, "setItem")
                .mockImplementation(() => {
                    const error: any = new DOMException(
                        "The quota has been exceeded",
                        "QuotaExceededError"
                    );
                    throw error;
                });
            await expect(() =>
                browserCacheManager.setUserData(
                    newCacheKey,
                    newCacheVal,
                    RANDOM_TEST_GUID,
                    Date.now().toString()
                )
            ).rejects.toEqual(
                new CacheError(CacheErrorCodes.cacheQuotaExceeded)
            );

            // The access token should have been removed from storage
            expect(window.sessionStorage.getItem(atKey1)).toBeNull();
            expect(window.sessionStorage.getItem(atKey2)).toBeNull();
            expect(window.sessionStorage.getItem(atKey3)).toBeNull();
            expect(window.sessionStorage.getItem(newCacheKey)).toBeNull();
            expect(browserCacheManager.getTokenKeys().accessToken).toHaveLength(
                3 // Failed to update token keys map, so it should still contain all 3 keys
            );
            expect(spy).toHaveBeenCalledTimes(4); // First attempt + 3 attempts after each access token removed
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
                CacheKeys.VERSION_CACHE_KEY,
                msalCacheKey,
                msalCacheKey2,
            ]);
        });

        it("clear()", () => {
            browserSessionStorage.setTemporaryCache("cacheKey", cacheVal, true);
            browserLocalStorage.setTemporaryCache("cacheKey", cacheVal, true);
            browserSessionStorage.clear(RANDOM_TEST_GUID);
            browserLocalStorage.clear(RANDOM_TEST_GUID);
            expect(browserSessionStorage.getKeys()).toHaveLength(0);
            expect(browserLocalStorage.getKeys()).toHaveLength(0);
        });

        describe("Getters and Setters", () => {
            describe("Account", () => {
                it("getAccount returns null if key not in cache", () => {
                    const key = "not-in-cache";
                    expect(
                        browserSessionStorage.getAccount(key, RANDOM_TEST_GUID)
                    ).toBeNull();
                    expect(
                        browserLocalStorage.getAccount(key, RANDOM_TEST_GUID)
                    ).toBeNull();
                });

                it("getAccount returns null if value is not JSON", () => {
                    const key = "testKey";
                    window.localStorage.setItem(key, "this is not json");
                    window.sessionStorage.setItem(key, "this is not json");

                    expect(
                        browserSessionStorage.getAccount(key, RANDOM_TEST_GUID)
                    ).toBeNull();
                    expect(
                        browserLocalStorage.getAccount(key, RANDOM_TEST_GUID)
                    ).toBeNull();
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

                    expect(
                        browserSessionStorage.getAccount(key, RANDOM_TEST_GUID)
                    ).toBeNull();
                    expect(
                        browserLocalStorage.getAccount(key, RANDOM_TEST_GUID)
                    ).toBeNull();
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
                    expect(
                        browserLocalStorage.getAccount(
                            browserLocalStorage.generateAccountKey(
                                testAccount.getAccountInfo()
                            ),
                            TEST_CONFIG.CORRELATION_ID
                        )
                    ).toEqual(testAccount);
                    expect(
                        browserLocalStorage.getAccount(
                            browserLocalStorage.generateAccountKey(
                                testAccount.getAccountInfo()
                            ),
                            TEST_CONFIG.CORRELATION_ID
                        )
                    ).toBeInstanceOf(AccountEntity);

                    await browserSessionStorage.setAccount(
                        testAccount,
                        TEST_CONFIG.CORRELATION_ID
                    );
                    expect(
                        browserSessionStorage.getAccount(
                            browserSessionStorage.generateAccountKey(
                                testAccount.getAccountInfo()
                            ),
                            TEST_CONFIG.CORRELATION_ID
                        )
                    ).toEqual(testAccount);
                    expect(
                        browserSessionStorage.getAccount(
                            browserSessionStorage.generateAccountKey(
                                testAccount.getAccountInfo()
                            ),
                            TEST_CONFIG.CORRELATION_ID
                        )
                    ).toBeInstanceOf(AccountEntity);
                });
            });

            describe("IdTokenCredential", () => {
                it("getIdTokenCredential returns null if key not in cache", () => {
                    const key = "not-in-cache";
                    expect(
                        browserSessionStorage.getIdTokenCredential(
                            key,
                            RANDOM_TEST_GUID
                        )
                    ).toBeNull();
                    expect(
                        browserLocalStorage.getIdTokenCredential(
                            key,
                            RANDOM_TEST_GUID
                        )
                    ).toBeNull();
                });

                it("getIdTokenCredential returns null if value is not JSON", () => {
                    const key = "testKey";
                    window.localStorage.setItem(key, "this is not json");
                    window.sessionStorage.setItem(key, "this is not json");

                    expect(
                        browserSessionStorage.getIdTokenCredential(
                            key,
                            RANDOM_TEST_GUID
                        )
                    ).toBeNull();
                    expect(
                        browserLocalStorage.getIdTokenCredential(
                            key,
                            RANDOM_TEST_GUID
                        )
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
                        browserSessionStorage.getIdTokenCredential(
                            key,
                            RANDOM_TEST_GUID
                        )
                    ).toBeNull();
                    expect(
                        browserLocalStorage.getIdTokenCredential(
                            key,
                            RANDOM_TEST_GUID
                        )
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
                    expect(
                        browserLocalStorage.getIdTokenCredential(
                            browserLocalStorage.generateCredentialKey(
                                testIdToken
                            ),
                            TEST_CONFIG.CORRELATION_ID
                        )
                    ).toEqual(testIdToken);

                    await browserSessionStorage.setIdTokenCredential(
                        testIdToken,
                        TEST_CONFIG.CORRELATION_ID
                    );
                    expect(
                        browserSessionStorage.getIdTokenCredential(
                            browserSessionStorage.generateCredentialKey(
                                testIdToken
                            ),
                            TEST_CONFIG.CORRELATION_ID
                        )
                    ).toEqual(testIdToken);
                });
            });

            describe("AccessTokenCredential", () => {
                it("getAccessTokenCredential returns null if key not in cache", () => {
                    const key = "not-in-cache";
                    expect(
                        browserSessionStorage.getAccessTokenCredential(
                            key,
                            RANDOM_TEST_GUID
                        )
                    ).toBeNull();
                    expect(
                        browserLocalStorage.getAccessTokenCredential(
                            key,
                            RANDOM_TEST_GUID
                        )
                    ).toBeNull();
                });

                it("getAccessTokenCredential returns null if value is not JSON", () => {
                    const key = "testKey";
                    window.localStorage.setItem(key, "this is not json");
                    window.sessionStorage.setItem(key, "this is not json");

                    expect(
                        browserSessionStorage.getAccessTokenCredential(
                            key,
                            RANDOM_TEST_GUID
                        )
                    ).toBeNull();
                    expect(
                        browserLocalStorage.getAccessTokenCredential(
                            key,
                            RANDOM_TEST_GUID
                        )
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
                        browserSessionStorage.getAccessTokenCredential(
                            key,
                            RANDOM_TEST_GUID
                        )
                    ).toBeNull();
                    expect(
                        browserLocalStorage.getAccessTokenCredential(
                            key,
                            RANDOM_TEST_GUID
                        )
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
                    expect(
                        browserLocalStorage.getAccessTokenCredential(
                            browserLocalStorage.generateCredentialKey(
                                testAccessToken
                            ),
                            TEST_CONFIG.CORRELATION_ID
                        )
                    ).toEqual(testAccessToken);

                    await browserSessionStorage.setAccessTokenCredential(
                        testAccessToken,
                        TEST_CONFIG.CORRELATION_ID
                    );
                    expect(
                        browserSessionStorage.getAccessTokenCredential(
                            browserSessionStorage.generateCredentialKey(
                                testAccessToken
                            ),
                            TEST_CONFIG.CORRELATION_ID
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
                    await browserLocalStorage.setAccessTokenCredential(
                        testAccessTokenWithAuthScheme,
                        TEST_CONFIG.CORRELATION_ID
                    );
                    expect(
                        browserLocalStorage.getAccessTokenCredential(
                            browserLocalStorage.generateCredentialKey(
                                testAccessTokenWithoutAuthScheme
                            ),
                            TEST_CONFIG.CORRELATION_ID
                        )
                    ).toEqual(testAccessTokenWithoutAuthScheme);
                    expect(
                        browserLocalStorage.getAccessTokenCredential(
                            browserLocalStorage.generateCredentialKey(
                                testAccessTokenWithoutAuthScheme
                            ),
                            TEST_CONFIG.CORRELATION_ID
                        )?.credentialType
                    ).toBe(CredentialType.ACCESS_TOKEN);

                    await browserSessionStorage.setAccessTokenCredential(
                        testAccessTokenWithoutAuthScheme,
                        TEST_CONFIG.CORRELATION_ID
                    );
                    await browserSessionStorage.setAccessTokenCredential(
                        testAccessTokenWithAuthScheme,
                        TEST_CONFIG.CORRELATION_ID
                    );

                    expect(
                        browserSessionStorage.getAccessTokenCredential(
                            browserSessionStorage.generateCredentialKey(
                                testAccessTokenWithoutAuthScheme
                            ),
                            TEST_CONFIG.CORRELATION_ID
                        )
                    ).toEqual(testAccessTokenWithoutAuthScheme);
                    expect(
                        browserSessionStorage.getAccessTokenCredential(
                            browserSessionStorage.generateCredentialKey(
                                testAccessTokenWithoutAuthScheme
                            ),
                            TEST_CONFIG.CORRELATION_ID
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
                    await browserLocalStorage.setAccessTokenCredential(
                        testAccessTokenWithAuthScheme,
                        TEST_CONFIG.CORRELATION_ID
                    );
                    expect(
                        browserLocalStorage.getAccessTokenCredential(
                            browserLocalStorage.generateCredentialKey(
                                testAccessTokenWithAuthScheme
                            ),
                            TEST_CONFIG.CORRELATION_ID
                        )
                    ).toEqual(testAccessTokenWithAuthScheme);
                    expect(
                        browserLocalStorage.getAccessTokenCredential(
                            browserLocalStorage.generateCredentialKey(
                                testAccessTokenWithAuthScheme
                            ),
                            TEST_CONFIG.CORRELATION_ID
                        )?.credentialType
                    ).toBe(CredentialType.ACCESS_TOKEN_WITH_AUTH_SCHEME);

                    await browserSessionStorage.setAccessTokenCredential(
                        testAccessTokenWithoutAuthScheme,
                        TEST_CONFIG.CORRELATION_ID
                    );
                    await browserSessionStorage.setAccessTokenCredential(
                        testAccessTokenWithAuthScheme,
                        TEST_CONFIG.CORRELATION_ID
                    );

                    expect(
                        browserSessionStorage.getAccessTokenCredential(
                            browserSessionStorage.generateCredentialKey(
                                testAccessTokenWithAuthScheme
                            ),
                            TEST_CONFIG.CORRELATION_ID
                        )
                    ).toEqual(testAccessTokenWithAuthScheme);
                    expect(
                        browserSessionStorage.getAccessTokenCredential(
                            browserSessionStorage.generateCredentialKey(
                                testAccessTokenWithAuthScheme
                            ),
                            TEST_CONFIG.CORRELATION_ID
                        )?.credentialType
                    ).toBe(CredentialType.ACCESS_TOKEN_WITH_AUTH_SCHEME);
                });

                it("setAccessTokenCredential moves cache key to the end of the token keys array if it already exists", async () => {
                    const accessToken1 = CacheHelpers.createAccessTokenEntity(
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
                    const atKey1 =
                        browserLocalStorage.generateCredentialKey(accessToken1);

                    // Add two tokens, so we can check the order
                    const accessToken2 = CacheHelpers.createAccessTokenEntity(
                        "homeAccountId2",
                        "environment2",
                        TEST_TOKENS.ACCESS_TOKEN,
                        "client-id",
                        "tenantId2",
                        "openid2",
                        1000,
                        1000,
                        browserCrypto.base64Decode,
                        500,
                        AuthenticationScheme.BEARER,
                        "oboAssertion"
                    );
                    const atKey2 =
                        browserLocalStorage.generateCredentialKey(accessToken2);

                    await browserLocalStorage.setAccessTokenCredential(
                        accessToken1,
                        TEST_CONFIG.CORRELATION_ID
                    );
                    await browserLocalStorage.setAccessTokenCredential(
                        accessToken2,
                        TEST_CONFIG.CORRELATION_ID
                    );

                    // At this point, order should be [accessTokenKey, anotherAccessTokenKey]
                    expect(
                        browserLocalStorage.getTokenKeys().accessToken
                    ).toEqual([atKey1, atKey2]);

                    // Set the first token again, it should move to the end
                    await browserLocalStorage.setAccessTokenCredential(
                        accessToken1,
                        TEST_CONFIG.CORRELATION_ID
                    );

                    // Now the order should be [anotherAccessTokenKey, accessTokenKey]
                    expect(
                        browserLocalStorage.getTokenKeys().accessToken
                    ).toEqual([atKey2, atKey1]);
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
                    await browserLocalStorage.setAccessTokenCredential(
                        testAT2,
                        TEST_CONFIG.CORRELATION_ID
                    );
                    await browserLocalStorage.setAccessTokenCredential(
                        testAT3,
                        TEST_CONFIG.CORRELATION_ID
                    );
                    await browserLocalStorage.setAccessTokenCredential(
                        testAT4,
                        TEST_CONFIG.CORRELATION_ID
                    );
                    expect(browserLocalStorage.getTokenKeys()).toStrictEqual({
                        idToken: [],
                        accessToken: [
                            browserLocalStorage.generateCredentialKey(testAT1),
                            browserLocalStorage.generateCredentialKey(testAT2),
                            browserLocalStorage.generateCredentialKey(testAT3),
                            browserLocalStorage.generateCredentialKey(testAT4),
                        ],
                        refreshToken: [],
                    });
                    expect(
                        browserLocalStorage.getTokenKeys().accessToken.length
                    ).toBe(4);
                    expect(
                        browserLocalStorage.getAccessTokenCredential(
                            browserLocalStorage.generateCredentialKey(testAT1),
                            RANDOM_TEST_GUID
                        )
                    ).toEqual(testAT1);
                    expect(
                        browserLocalStorage.getAccessTokenCredential(
                            browserLocalStorage.generateCredentialKey(testAT2),
                            RANDOM_TEST_GUID
                        )
                    ).toEqual(testAT2);
                    expect(
                        browserLocalStorage.getAccessTokenCredential(
                            browserLocalStorage.generateCredentialKey(testAT3),
                            RANDOM_TEST_GUID
                        )
                    ).toEqual(testAT3);
                    expect(
                        browserLocalStorage.getAccessTokenCredential(
                            browserLocalStorage.generateCredentialKey(testAT4),
                            RANDOM_TEST_GUID
                        )
                    ).toEqual(testAT4);

                    browserLocalStorage.clearTokensAndKeysWithClaims(
                        "test-correlation-id"
                    );

                    expect(
                        browserLocalStorage.getAccessTokenCredential(
                            browserLocalStorage.generateCredentialKey(testAT1),
                            RANDOM_TEST_GUID
                        )
                    ).toEqual(testAT1);
                    expect(
                        browserLocalStorage.getAccessTokenCredential(
                            browserLocalStorage.generateCredentialKey(testAT2),
                            RANDOM_TEST_GUID
                        )
                    ).toBeNull();
                    expect(
                        browserLocalStorage.getAccessTokenCredential(
                            browserLocalStorage.generateCredentialKey(testAT3),
                            RANDOM_TEST_GUID
                        )
                    ).toEqual(testAT3);
                    expect(
                        browserLocalStorage.getAccessTokenCredential(
                            browserLocalStorage.generateCredentialKey(testAT2),
                            RANDOM_TEST_GUID
                        )
                    ).toBeNull();
                    expect(browserLocalStorage.getTokenKeys()).toStrictEqual({
                        idToken: [],
                        accessToken: [
                            browserLocalStorage.generateCredentialKey(testAT1),
                            browserLocalStorage.generateCredentialKey(testAT3),
                        ],
                        refreshToken: [],
                    });
                    expect(
                        browserLocalStorage.getTokenKeys().accessToken.length
                    ).toBe(2);

                    await browserSessionStorage.setAccessTokenCredential(
                        testAT1,
                        TEST_CONFIG.CORRELATION_ID
                    );
                    await browserSessionStorage.setAccessTokenCredential(
                        testAT2,
                        TEST_CONFIG.CORRELATION_ID
                    );
                    await browserSessionStorage.setAccessTokenCredential(
                        testAT3,
                        TEST_CONFIG.CORRELATION_ID
                    );
                    await browserSessionStorage.setAccessTokenCredential(
                        testAT4,
                        TEST_CONFIG.CORRELATION_ID
                    );

                    expect(browserSessionStorage.getTokenKeys()).toStrictEqual({
                        idToken: [],
                        accessToken: [
                            browserSessionStorage.generateCredentialKey(
                                testAT1
                            ),
                            browserSessionStorage.generateCredentialKey(
                                testAT2
                            ),
                            browserSessionStorage.generateCredentialKey(
                                testAT3
                            ),
                            browserSessionStorage.generateCredentialKey(
                                testAT4
                            ),
                        ],
                        refreshToken: [],
                    });

                    expect(
                        browserSessionStorage.getTokenKeys().accessToken.length
                    ).toBe(4);
                    expect(
                        browserSessionStorage.getAccessTokenCredential(
                            browserSessionStorage.generateCredentialKey(
                                testAT1
                            ),
                            RANDOM_TEST_GUID
                        )
                    ).toEqual(testAT1);
                    expect(
                        browserSessionStorage.getAccessTokenCredential(
                            browserSessionStorage.generateCredentialKey(
                                testAT2
                            ),
                            RANDOM_TEST_GUID
                        )
                    ).toEqual(testAT2);
                    expect(
                        browserSessionStorage.getAccessTokenCredential(
                            browserSessionStorage.generateCredentialKey(
                                testAT3
                            ),
                            RANDOM_TEST_GUID
                        )
                    ).toEqual(testAT3);
                    expect(
                        browserSessionStorage.getAccessTokenCredential(
                            browserSessionStorage.generateCredentialKey(
                                testAT4
                            ),
                            RANDOM_TEST_GUID
                        )
                    ).toEqual(testAT4);
                    browserSessionStorage.clearTokensAndKeysWithClaims(
                        "test-correlation-id"
                    );

                    expect(
                        browserSessionStorage.getAccessTokenCredential(
                            browserSessionStorage.generateCredentialKey(
                                testAT1
                            ),
                            RANDOM_TEST_GUID
                        )
                    ).toEqual(testAT1);
                    expect(
                        browserSessionStorage.getAccessTokenCredential(
                            browserSessionStorage.generateCredentialKey(
                                testAT2
                            ),
                            RANDOM_TEST_GUID
                        )
                    ).toBeNull();
                    expect(
                        browserSessionStorage.getAccessTokenCredential(
                            browserSessionStorage.generateCredentialKey(
                                testAT3
                            ),
                            RANDOM_TEST_GUID
                        )
                    ).toEqual(testAT3);
                    expect(
                        browserSessionStorage.getAccessTokenCredential(
                            browserSessionStorage.generateCredentialKey(
                                testAT2
                            ),
                            RANDOM_TEST_GUID
                        )
                    ).toBeNull();
                    expect(browserSessionStorage.getTokenKeys()).toStrictEqual({
                        idToken: [],
                        accessToken: [
                            browserSessionStorage.generateCredentialKey(
                                testAT1
                            ),
                            browserSessionStorage.generateCredentialKey(
                                testAT3
                            ),
                        ],
                        refreshToken: [],
                    });

                    expect(
                        browserSessionStorage.getTokenKeys().accessToken.length
                    ).toBe(2);
                });
            });

            describe("RefreshTokenCredential", () => {
                it("getRefreshTokenCredential returns null if key not in cache", () => {
                    const key = "not-in-cache";
                    expect(
                        browserSessionStorage.getRefreshTokenCredential(
                            key,
                            RANDOM_TEST_GUID
                        )
                    ).toBeNull();
                    expect(
                        browserLocalStorage.getRefreshTokenCredential(
                            key,
                            RANDOM_TEST_GUID
                        )
                    ).toBeNull();
                });

                it("getRefreshTokenCredential returns null if value is not JSON", () => {
                    const key = "testKey";
                    window.localStorage.setItem(key, "this is not json");
                    window.sessionStorage.setItem(key, "this is not json");

                    expect(
                        browserSessionStorage.getRefreshTokenCredential(
                            key,
                            RANDOM_TEST_GUID
                        )
                    ).toBeNull();
                    expect(
                        browserLocalStorage.getRefreshTokenCredential(
                            key,
                            RANDOM_TEST_GUID
                        )
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
                        browserSessionStorage.getRefreshTokenCredential(
                            key,
                            RANDOM_TEST_GUID
                        )
                    ).toBeNull();
                    expect(
                        browserLocalStorage.getRefreshTokenCredential(
                            key,
                            RANDOM_TEST_GUID
                        )
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
                    expect(
                        browserLocalStorage.getRefreshTokenCredential(
                            browserLocalStorage.generateCredentialKey(
                                testRefreshToken
                            ),
                            TEST_CONFIG.CORRELATION_ID
                        )
                    ).toEqual(testRefreshToken);

                    await browserSessionStorage.setRefreshTokenCredential(
                        testRefreshToken,
                        TEST_CONFIG.CORRELATION_ID
                    );
                    expect(
                        browserSessionStorage.getRefreshTokenCredential(
                            browserSessionStorage.generateCredentialKey(
                                testRefreshToken
                            ),
                            TEST_CONFIG.CORRELATION_ID
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

                    browserLocalStorage.setAppMetadata(
                        testAppMetadata,
                        RANDOM_TEST_GUID
                    );
                    browserSessionStorage.setAppMetadata(
                        testAppMetadata,
                        RANDOM_TEST_GUID
                    );

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

                    browserLocalStorage.setServerTelemetry(
                        testKey,
                        testVal,
                        RANDOM_TEST_GUID
                    );
                    browserSessionStorage.setServerTelemetry(
                        testKey,
                        testVal,
                        RANDOM_TEST_GUID
                    );

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

                    browserSessionStorage.clear(RANDOM_TEST_GUID);
                    browserLocalStorage.clear(RANDOM_TEST_GUID);
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

                    browserLocalStorage.setThrottlingCache(
                        testKey,
                        testVal,
                        RANDOM_TEST_GUID
                    );
                    browserSessionStorage.setThrottlingCache(
                        testKey,
                        testVal,
                        RANDOM_TEST_GUID
                    );

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
                        CacheErrorCodes.cacheQuotaExceeded
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
                        perfClient,
                        new EventHandler()
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
                                CacheErrorCodes.cacheQuotaExceeded
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

            describe("interactionInProgress", () => {
                it("handles new format", () => {
                    const perfClient = new BrowserPerformanceClient({
                        auth: {
                            clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                        },
                    });
                    const cacheManager = new BrowserCacheManager(
                        TEST_CONFIG.MSAL_CLIENT_ID,
                        cacheConfig,
                        browserCrypto,
                        logger,
                        perfClient,
                        new EventHandler()
                    );

                    cacheManager.setInteractionInProgress(true);
                    expect(
                        cacheManager.getInteractionInProgress()?.clientId
                    ).toEqual(TEST_CONFIG.MSAL_CLIENT_ID);
                    expect(
                        cacheManager.getInteractionInProgress()?.type
                    ).toEqual(INTERACTION_TYPE.SIGNIN);
                });

                it("handles old format", () => {
                    const perfClient = new BrowserPerformanceClient({
                        auth: {
                            clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                        },
                    });
                    const cacheManager = new BrowserCacheManager(
                        TEST_CONFIG.MSAL_CLIENT_ID,
                        cacheConfig,
                        browserCrypto,
                        logger,
                        perfClient,
                        new EventHandler()
                    );

                    cacheManager.setTemporaryCache(
                        `${CacheKeys.PREFIX}.${TemporaryCacheKeys.INTERACTION_STATUS_KEY}`,
                        TEST_CONFIG.MSAL_CLIENT_ID
                    );
                    expect(cacheManager.getInteractionInProgress()).toBeNull();
                });

                it("handles old format and removes temporary artifacts", () => {
                    const perfClient = new BrowserPerformanceClient({
                        auth: {
                            clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                        },
                    });
                    const cacheManager = new BrowserCacheManager(
                        TEST_CONFIG.MSAL_CLIENT_ID,
                        cacheConfig,
                        browserCrypto,
                        logger,
                        perfClient,
                        new EventHandler()
                    );

                    cacheManager.setTemporaryCache(
                        `${CacheKeys.PREFIX}.${TemporaryCacheKeys.INTERACTION_STATUS_KEY}`,
                        TEST_CONFIG.MSAL_CLIENT_ID
                    );
                    // @ts-ignore
                    const requestParamKey = cacheManager.generateCacheKey(
                        TemporaryCacheKeys.REQUEST_PARAMS
                    );
                    const requestParamPayload = JSON.stringify({
                        correlationId: "test-correlation-id",
                    });
                    cacheManager.setTemporaryCache(
                        requestParamKey,
                        requestParamPayload
                    );
                    expect(cacheManager.getInteractionInProgress()).toBeNull();
                    expect(
                        cacheManager.getTemporaryCache(requestParamKey)
                    ).toBeNull();
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
                new StubPerformanceClient(),
                new EventHandler()
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
                new StubPerformanceClient(),
                new EventHandler()
            );
            await browserLocalStorage.initialize(TEST_CONFIG.CORRELATION_ID);
            await browserSessionStorage.initialize(TEST_CONFIG.CORRELATION_ID);
            cacheVal = "cacheVal";
            msalCacheKey = browserSessionStorage.generateCacheKey("cacheKey");
            msalCacheKey2 = browserSessionStorage.generateCacheKey("cacheKey2");
        });

        afterEach(async () => {
            browserSessionStorage.clear(RANDOM_TEST_GUID);
            browserLocalStorage.clear(RANDOM_TEST_GUID);
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
                new StubPerformanceClient(),
                new EventHandler()
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

        it("clear()", () => {
            browserSessionStorage.setTemporaryCache("cacheKey", cacheVal, true);
            browserLocalStorage.setTemporaryCache("cacheKey", cacheVal, true);
            browserSessionStorage.clear(RANDOM_TEST_GUID);
            browserLocalStorage.clear(RANDOM_TEST_GUID);
            expect(browserSessionStorage.getKeys()).toHaveLength(0);
            expect(browserLocalStorage.getKeys()).toHaveLength(0);
        });

        describe("Getters and Setters", () => {
            describe("Account", () => {
                it("getAccount returns null if key not in cache", () => {
                    const key = "not-in-cache";
                    expect(
                        browserSessionStorage.getAccount(key, RANDOM_TEST_GUID)
                    ).toBeNull();
                    expect(
                        browserLocalStorage.getAccount(key, RANDOM_TEST_GUID)
                    ).toBeNull();
                });

                it("getAccount returns null if value is not JSON", () => {
                    const key = "testKey";
                    window.localStorage.setItem(key, "this is not json");
                    window.sessionStorage.setItem(key, "this is not json");

                    expect(
                        browserSessionStorage.getAccount(key, RANDOM_TEST_GUID)
                    ).toBeNull();
                    expect(
                        browserLocalStorage.getAccount(key, RANDOM_TEST_GUID)
                    ).toBeNull();
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

                    expect(
                        browserSessionStorage.getAccount(key, RANDOM_TEST_GUID)
                    ).toBeNull();
                    expect(
                        browserLocalStorage.getAccount(key, RANDOM_TEST_GUID)
                    ).toBeNull();
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
                    expect(
                        browserLocalStorage.getAccount(
                            browserLocalStorage.generateAccountKey(
                                testAccount.getAccountInfo()
                            ),
                            TEST_CONFIG.CORRELATION_ID
                        )
                    ).toEqual(testAccount);
                    expect(
                        browserLocalStorage.getAccount(
                            browserLocalStorage.generateAccountKey(
                                testAccount.getAccountInfo()
                            ),
                            TEST_CONFIG.CORRELATION_ID
                        )
                    ).toBeInstanceOf(AccountEntity);

                    await browserSessionStorage.setAccount(
                        testAccount,
                        TEST_CONFIG.CORRELATION_ID
                    );

                    expect(
                        browserSessionStorage.getAccount(
                            browserSessionStorage.generateAccountKey(
                                testAccount.getAccountInfo()
                            ),
                            TEST_CONFIG.CORRELATION_ID
                        )
                    ).toEqual(testAccount);
                    expect(
                        browserSessionStorage.getAccount(
                            browserSessionStorage.generateAccountKey(
                                testAccount.getAccountInfo()
                            ),
                            TEST_CONFIG.CORRELATION_ID
                        )
                    ).toBeInstanceOf(AccountEntity);
                });
            });

            describe("IdTokenCredential", () => {
                it("getIdTokenCredential returns null if key not in cache", () => {
                    const key = "not-in-cache";
                    expect(
                        browserSessionStorage.getIdTokenCredential(
                            key,
                            RANDOM_TEST_GUID
                        )
                    ).toBeNull();
                    expect(
                        browserLocalStorage.getIdTokenCredential(
                            key,
                            RANDOM_TEST_GUID
                        )
                    ).toBeNull();
                });

                it("getIdTokenCredential returns null if value is not JSON", () => {
                    const key = "testKey";
                    window.localStorage.setItem(key, "this is not json");
                    window.sessionStorage.setItem(key, "this is not json");

                    expect(
                        browserSessionStorage.getIdTokenCredential(
                            key,
                            RANDOM_TEST_GUID
                        )
                    ).toBeNull();
                    expect(
                        browserLocalStorage.getIdTokenCredential(
                            key,
                            RANDOM_TEST_GUID
                        )
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
                        browserSessionStorage.getIdTokenCredential(
                            key,
                            RANDOM_TEST_GUID
                        )
                    ).toBeNull();
                    expect(
                        browserLocalStorage.getIdTokenCredential(
                            key,
                            RANDOM_TEST_GUID
                        )
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
                    expect(
                        browserLocalStorage.getIdTokenCredential(
                            browserLocalStorage.generateCredentialKey(
                                testIdToken
                            ),
                            TEST_CONFIG.CORRELATION_ID
                        )
                    ).toEqual(testIdToken);

                    await browserSessionStorage.setIdTokenCredential(
                        testIdToken,
                        TEST_CONFIG.CORRELATION_ID
                    );
                    expect(
                        browserSessionStorage.getIdTokenCredential(
                            browserSessionStorage.generateCredentialKey(
                                testIdToken
                            ),
                            TEST_CONFIG.CORRELATION_ID
                        )
                    ).toEqual(testIdToken);
                });
            });

            describe("AccessTokenCredential", () => {
                it("getAccessTokenCredential returns null if key not in cache", () => {
                    const key = "not-in-cache";
                    expect(
                        browserSessionStorage.getAccessTokenCredential(
                            key,
                            RANDOM_TEST_GUID
                        )
                    ).toBeNull();
                    expect(
                        browserLocalStorage.getAccessTokenCredential(
                            key,
                            RANDOM_TEST_GUID
                        )
                    ).toBeNull();
                });

                it("getAccessTokenCredential returns null if value is not JSON", () => {
                    const key = "testKey";
                    window.localStorage.setItem(key, "this is not json");
                    window.sessionStorage.setItem(key, "this is not json");

                    expect(
                        browserSessionStorage.getAccessTokenCredential(
                            key,
                            RANDOM_TEST_GUID
                        )
                    ).toBeNull();
                    expect(
                        browserLocalStorage.getAccessTokenCredential(
                            key,
                            RANDOM_TEST_GUID
                        )
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
                        browserSessionStorage.getAccessTokenCredential(
                            key,
                            RANDOM_TEST_GUID
                        )
                    ).toBeNull();
                    expect(
                        browserLocalStorage.getAccessTokenCredential(
                            key,
                            RANDOM_TEST_GUID
                        )
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
                    expect(
                        browserLocalStorage.getAccessTokenCredential(
                            browserLocalStorage.generateCredentialKey(
                                testAccessToken
                            ),
                            TEST_CONFIG.CORRELATION_ID
                        )
                    ).toEqual(testAccessToken);

                    await browserSessionStorage.setAccessTokenCredential(
                        testAccessToken,
                        TEST_CONFIG.CORRELATION_ID
                    );
                    expect(
                        browserSessionStorage.getAccessTokenCredential(
                            browserSessionStorage.generateCredentialKey(
                                testAccessToken
                            ),
                            TEST_CONFIG.CORRELATION_ID
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
                    await browserLocalStorage.setAccessTokenCredential(
                        testAccessTokenWithAuthScheme,
                        TEST_CONFIG.CORRELATION_ID
                    );
                    expect(
                        browserLocalStorage.getAccessTokenCredential(
                            browserLocalStorage.generateCredentialKey(
                                testAccessTokenWithoutAuthScheme
                            ),
                            TEST_CONFIG.CORRELATION_ID
                        )
                    ).toEqual(testAccessTokenWithoutAuthScheme);
                    expect(
                        browserLocalStorage.getAccessTokenCredential(
                            browserLocalStorage.generateCredentialKey(
                                testAccessTokenWithoutAuthScheme
                            ),
                            TEST_CONFIG.CORRELATION_ID
                        )?.credentialType
                    ).toBe(CredentialType.ACCESS_TOKEN);

                    await browserSessionStorage.setAccessTokenCredential(
                        testAccessTokenWithoutAuthScheme,
                        TEST_CONFIG.CORRELATION_ID
                    );
                    await browserSessionStorage.setAccessTokenCredential(
                        testAccessTokenWithAuthScheme,
                        TEST_CONFIG.CORRELATION_ID
                    );

                    expect(
                        browserSessionStorage.getAccessTokenCredential(
                            browserSessionStorage.generateCredentialKey(
                                testAccessTokenWithoutAuthScheme
                            ),
                            RANDOM_TEST_GUID
                        )
                    ).toEqual(testAccessTokenWithoutAuthScheme);
                    expect(
                        browserSessionStorage.getAccessTokenCredential(
                            browserSessionStorage.generateCredentialKey(
                                testAccessTokenWithoutAuthScheme
                            ),
                            RANDOM_TEST_GUID
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
                    await browserLocalStorage.setAccessTokenCredential(
                        testAccessTokenWithAuthScheme,
                        TEST_CONFIG.CORRELATION_ID
                    );
                    expect(
                        browserLocalStorage.getAccessTokenCredential(
                            browserLocalStorage.generateCredentialKey(
                                testAccessTokenWithAuthScheme
                            ),
                            RANDOM_TEST_GUID
                        )
                    ).toEqual(testAccessTokenWithAuthScheme);
                    expect(
                        browserLocalStorage.getAccessTokenCredential(
                            browserLocalStorage.generateCredentialKey(
                                testAccessTokenWithAuthScheme
                            ),
                            RANDOM_TEST_GUID
                        )?.credentialType
                    ).toBe(CredentialType.ACCESS_TOKEN_WITH_AUTH_SCHEME);

                    await browserSessionStorage.setAccessTokenCredential(
                        testAccessTokenWithoutAuthScheme,
                        TEST_CONFIG.CORRELATION_ID
                    );
                    await browserSessionStorage.setAccessTokenCredential(
                        testAccessTokenWithAuthScheme,
                        TEST_CONFIG.CORRELATION_ID
                    );
                    expect(
                        browserSessionStorage.getAccessTokenCredential(
                            browserSessionStorage.generateCredentialKey(
                                testAccessTokenWithAuthScheme
                            ),
                            RANDOM_TEST_GUID
                        )
                    ).toEqual(testAccessTokenWithAuthScheme);
                    expect(
                        browserSessionStorage.getAccessTokenCredential(
                            browserSessionStorage.generateCredentialKey(
                                testAccessTokenWithAuthScheme
                            ),
                            RANDOM_TEST_GUID
                        )?.credentialType
                    ).toBe(CredentialType.ACCESS_TOKEN_WITH_AUTH_SCHEME);
                });
            });

            describe("RefreshTokenCredential", () => {
                it("getRefreshTokenCredential returns null if key not in cache", () => {
                    const key = "not-in-cache";
                    expect(
                        browserSessionStorage.getRefreshTokenCredential(
                            key,
                            RANDOM_TEST_GUID
                        )
                    ).toBeNull();
                    expect(
                        browserLocalStorage.getRefreshTokenCredential(
                            key,
                            RANDOM_TEST_GUID
                        )
                    ).toBeNull();
                });

                it("getRefreshTokenCredential returns null if value is not JSON", () => {
                    const key = "testKey";
                    window.localStorage.setItem(key, "this is not json");
                    window.sessionStorage.setItem(key, "this is not json");

                    expect(
                        browserSessionStorage.getRefreshTokenCredential(
                            key,
                            RANDOM_TEST_GUID
                        )
                    ).toBeNull();
                    expect(
                        browserLocalStorage.getRefreshTokenCredential(
                            key,
                            RANDOM_TEST_GUID
                        )
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
                        browserSessionStorage.getRefreshTokenCredential(
                            key,
                            RANDOM_TEST_GUID
                        )
                    ).toBeNull();
                    expect(
                        browserLocalStorage.getRefreshTokenCredential(
                            key,
                            RANDOM_TEST_GUID
                        )
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
                    expect(
                        browserLocalStorage.getRefreshTokenCredential(
                            browserLocalStorage.generateCredentialKey(
                                testRefreshToken
                            ),
                            RANDOM_TEST_GUID
                        )
                    ).toEqual(testRefreshToken);

                    await browserSessionStorage.setRefreshTokenCredential(
                        testRefreshToken,
                        TEST_CONFIG.CORRELATION_ID
                    );
                    expect(
                        browserSessionStorage.getRefreshTokenCredential(
                            browserSessionStorage.generateCredentialKey(
                                testRefreshToken
                            ),
                            RANDOM_TEST_GUID
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

                    browserLocalStorage.setAppMetadata(
                        testAppMetadata,
                        RANDOM_TEST_GUID
                    );
                    browserSessionStorage.setAppMetadata(
                        testAppMetadata,
                        RANDOM_TEST_GUID
                    );

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

                    browserLocalStorage.setServerTelemetry(
                        testKey,
                        testVal,
                        RANDOM_TEST_GUID
                    );
                    browserSessionStorage.setServerTelemetry(
                        testKey,
                        testVal,
                        RANDOM_TEST_GUID
                    );

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

                it("clear() removes AuthorityMetadataEntity from in-memory storage", () => {
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

                    browserSessionStorage.clear(RANDOM_TEST_GUID);
                    browserLocalStorage.clear(RANDOM_TEST_GUID);
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

                    browserLocalStorage.setThrottlingCache(
                        testKey,
                        testVal,
                        RANDOM_TEST_GUID
                    );
                    browserSessionStorage.setThrottlingCache(
                        testKey,
                        testVal,
                        RANDOM_TEST_GUID
                    );

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
                new StubPerformanceClient(),
                new EventHandler()
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
                new StubPerformanceClient(),
                new EventHandler()
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
                new StubPerformanceClient(),
                new EventHandler()
            );
            await browserMemoryStorage.initialize(TEST_CONFIG.CORRELATION_ID);
            cacheVal = "cacheVal";
            msalCacheKey = browserSessionStorage.generateCacheKey("cacheKey");
        });

        afterEach(() => {
            browserSessionStorage.clear(RANDOM_TEST_GUID);
            browserLocalStorage.clear(RANDOM_TEST_GUID);
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

        it("clear()", () => {
            // sessionStorage
            browserSessionStorage.setTemporaryCache(msalCacheKey, cacheVal);
            expect(document.cookie).toContain(`${msalCacheKey}=${cacheVal}`);
            browserSessionStorage.clear(RANDOM_TEST_GUID);
            expect(browserSessionStorage.getKeys()).toHaveLength(0);
            expect(document.cookie).not.toContain(
                `${msalCacheKey}=${cacheVal}`
            );
            // localStorage
            browserLocalStorage.setTemporaryCache(msalCacheKey, cacheVal);
            expect(document.cookie).toContain(`${msalCacheKey}=${cacheVal}`);
            browserLocalStorage.clear(RANDOM_TEST_GUID);
            expect(browserLocalStorage.getKeys()).toHaveLength(0);
            expect(document.cookie).not.toContain(
                `${msalCacheKey}=${cacheVal}`
            );
            // browser memory
            browserMemoryStorage.setTemporaryCache(msalCacheKey, cacheVal);
            expect(document.cookie).toContain(`${msalCacheKey}=${cacheVal}`);
            browserMemoryStorage.clear(RANDOM_TEST_GUID);
            expect(browserMemoryStorage.getKeys()).toHaveLength(0);
            expect(document.cookie).not.toContain(
                `${msalCacheKey}=${cacheVal}`
            );
        });

        it("setTempCache() with item that contains ==", () => {
            msalCacheKey = `${CacheKeys.PREFIX}.${TEST_STATE_VALUES.ENCODED_LIB_STATE}`;
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
            msalCacheKey = `${CacheKeys.PREFIX}.${TEST_STATE_VALUES.ENCODED_LIB_STATE}`;
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
            msalCacheKey = `${CacheKeys.PREFIX}.${TEST_STATE_VALUES.ENCODED_LIB_STATE}`;
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

        it("clear() with item that contains ==", () => {
            msalCacheKey = `${CacheKeys.PREFIX}.${TEST_STATE_VALUES.ENCODED_LIB_STATE}`;
            // sessionStorage
            browserSessionStorage.setTemporaryCache(msalCacheKey, cacheVal);
            expect(document.cookie).toContain(`${msalCacheKey}=${cacheVal}`);
            browserSessionStorage.clear(RANDOM_TEST_GUID);
            expect(browserSessionStorage.getKeys()).toHaveLength(0);
            expect(document.cookie).not.toContain(
                `${msalCacheKey}=${cacheVal}`
            );
            // localStorage
            browserLocalStorage.setTemporaryCache(msalCacheKey, cacheVal);
            expect(document.cookie).toContain(`${msalCacheKey}=${cacheVal}`);
            browserLocalStorage.clear(RANDOM_TEST_GUID);
            expect(browserLocalStorage.getKeys()).toHaveLength(0);
            expect(document.cookie).not.toContain(
                `${msalCacheKey}=${cacheVal}`
            );
            // browser memory
            browserMemoryStorage.setTemporaryCache(msalCacheKey, cacheVal);
            expect(document.cookie).toContain(`${msalCacheKey}=${cacheVal}`);
            browserMemoryStorage.clear(RANDOM_TEST_GUID);
            expect(browserMemoryStorage.getKeys()).toHaveLength(0);
            expect(document.cookie).not.toContain(
                `${msalCacheKey}=${cacheVal}`
            );
        });
    });

    describe("Helpers", () => {
        it("resetTempCacheItems() resets all temporary cache items with the given state", () => {
            const browserStorage = new BrowserCacheManager(
                TEST_CONFIG.MSAL_CLIENT_ID,
                cacheConfig,
                browserCrypto,
                logger,
                new StubPerformanceClient(),
                new EventHandler()
            );
            const requestParamsKey = `${CacheKeys.PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.REQUEST_PARAMS}`;
            window.sessionStorage.setItem(
                requestParamsKey,
                "TestRequestParams"
            );
            const originUriKey = `${CacheKeys.PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.ORIGIN_URI}`;
            window.sessionStorage.setItem(
                originUriKey,
                TEST_URIS.TEST_REDIR_URI
            );

            expect(window.sessionStorage[requestParamsKey]).toBe(
                "TestRequestParams"
            );
            expect(window.sessionStorage[originUriKey]).toBe(
                TEST_URIS.TEST_REDIR_URI
            );

            browserStorage.resetRequestCache();

            expect(window.sessionStorage[requestParamsKey]).toBeUndefined();
            expect(window.sessionStorage[originUriKey]).toBeUndefined();
        });

        it("Successfully retrieves and decodes response from cache", async () => {
            const browserStorage = new BrowserCacheManager(
                TEST_CONFIG.MSAL_CLIENT_ID,
                cacheConfig,
                browserCrypto,
                logger,
                new StubPerformanceClient(),
                new EventHandler()
            );
            const tokenRequest: CommonAuthorizationUrlRequest = {
                redirectUri: `${TEST_URIS.DEFAULT_INSTANCE}`,
                scopes: [Constants.OPENID_SCOPE, Constants.PROFILE_SCOPE],
                authority: `${Constants.DEFAULT_AUTHORITY}/`,
                correlationId: `${RANDOM_TEST_GUID}`,
                authenticationScheme: AuthenticationScheme.BEARER,
                responseMode: ResponseMode.FRAGMENT,
                state: TEST_CONFIG.STATE,
                nonce: RANDOM_TEST_GUID,
            };

            browserStorage.cacheAuthorizeRequest(
                tokenRequest,
                TEST_CONFIG.TEST_VERIFIER
            );

            const [cachedRequest, codeVerifier] =
                browserStorage.getCachedRequest();
            expect(cachedRequest).toEqual(tokenRequest);
            expect(codeVerifier).toEqual(TEST_CONFIG.TEST_VERIFIER);
        });

        it("Throws error if request cannot be retrieved from cache", async () => {
            const browserStorage = new BrowserCacheManager(
                TEST_CONFIG.MSAL_CLIENT_ID,
                cacheConfig,
                browserCrypto,
                logger,
                new StubPerformanceClient(),
                new EventHandler()
            );

            expect(() => browserStorage.getCachedRequest()).toThrowError(
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
                new StubPerformanceClient(),
                new EventHandler()
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
            expect(() => browserStorage.getCachedRequest()).toThrowError(
                BrowserAuthErrorMessage.unableToParseTokenRequestCacheError.desc
            );
        });
    });
});
