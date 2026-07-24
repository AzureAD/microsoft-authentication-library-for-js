/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    BrowserAuthError,
    BrowserAuthErrorCodes,
} from "../../src/error/BrowserAuthError.js";
import {
    TEST_CONFIG,
    TEST_TOKENS,
    TEST_DATA_CLIENT_INFO,
    RANDOM_TEST_GUID,
    TEST_URIS,
    DEFAULT_OPENID_CONFIG_RESPONSE,
    TEST_ACCESS_TOKEN_ENTITY,
    TEST_ID_TOKEN_ENTITY,
    TEST_ACCOUNT_ENTITY,
    TEST_REFRESH_TOKEN_ENTITY,
} from "../utils/StringConstants.js";
import { CacheOptions } from "../../src/config/Configuration.js";
import {
    CommonAuthorizationCodeRequest as AuthorizationCodeRequest,
    Logger,
    LogLevel,
    AuthorityMetadataEntity,
    Authority,
    StubbedNetworkModule,
    AuthToken,
    ProtocolMode,
    CacheHelpers,
    CacheError,
    CacheErrorCodes,
    CacheManager,
    PerformanceEvent,
    StubPerformanceClient,
    CommonAuthorizationUrlRequest,
    AccountEntityUtils,
    Constants,
    CredentialEntity,
    AccountFilter,
} from "@azure/msal-common/browser";
import {
    ApiId,
    apiIdToName,
    BrowserCacheLocation,
    INTERACTION_TYPE,
    TemporaryCacheKeys,
} from "../../src/utils/BrowserConstants.js";
import { CryptoOps } from "../../src/crypto/CryptoOps.js";
import { DatabaseStorage } from "../../src/cache/DatabaseStorage.js";
import { BrowserCacheManager } from "../../src/cache/BrowserCacheManager.js";
import { base64Decode } from "../../src/encode/Base64Decode.js";
import { BrowserPerformanceClient } from "../../src/telemetry/BrowserPerformanceClient.js";
import { EventHandler } from "../../src/event/EventHandler.js";
import { version } from "../../src/packageMetadata.js";
import * as CacheKeys from "../../src/cache/CacheKeys.js";
import { getAccount } from "../../src/cache/AccountManager.js";
import { isEncrypted } from "../../src/cache/EncryptedData.js";
import { SessionStorage } from "../../src/cache/SessionStorage.js";

describe("BrowserCacheManager tests", () => {
    let cacheConfig: Required<CacheOptions>;
    let logger: Logger;
    let browserCrypto: CryptoOps;
    beforeEach(() => {
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

        it("stamps previousLibraryVersion as a global telemetry field when a prior version is cached", async () => {
            window.localStorage.setItem(CacheKeys.VERSION_CACHE_KEY, "1.0.0");
            const perfClient = new StubPerformanceClient();
            const addGlobalFieldsSpy = jest.spyOn(
                perfClient,
                "addGlobalFields"
            );
            const browserCacheManager = new BrowserCacheManager(
                TEST_CONFIG.MSAL_CLIENT_ID,
                {
                    ...cacheConfig,
                    cacheLocation: BrowserCacheLocation.LocalStorage,
                },
                browserCrypto,
                logger,
                perfClient,
                new EventHandler()
            );
            await browserCacheManager.initialize(TEST_CONFIG.CORRELATION_ID);
            expect(addGlobalFieldsSpy).toHaveBeenCalledWith({
                previousLibraryVersion: "1.0.0",
            });
        });

        it("does not stamp previousLibraryVersion when no prior version is cached", async () => {
            const perfClient = new StubPerformanceClient();
            const addGlobalFieldsSpy = jest.spyOn(
                perfClient,
                "addGlobalFields"
            );
            const browserCacheManager = new BrowserCacheManager(
                TEST_CONFIG.MSAL_CLIENT_ID,
                {
                    ...cacheConfig,
                    cacheLocation: BrowserCacheLocation.LocalStorage,
                },
                browserCrypto,
                logger,
                perfClient,
                new EventHandler()
            );
            await browserCacheManager.initialize(TEST_CONFIG.CORRELATION_ID);
            expect(addGlobalFieldsSpy).not.toHaveBeenCalled();
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

    describe("Cache Migration and Schema Versioning", () => {
        let browserCacheManager: BrowserCacheManager;
        let performanceClient: StubPerformanceClient;

        beforeEach(async () => {
            performanceClient = new StubPerformanceClient();
            browserCacheManager = new BrowserCacheManager(
                TEST_CONFIG.MSAL_CLIENT_ID,
                {
                    ...cacheConfig,
                    cacheLocation: BrowserCacheLocation.LocalStorage,
                },
                browserCrypto,
                logger,
                performanceClient,
                new EventHandler()
            );
        });

        afterEach(() => {
            window.localStorage.clear();
            window.sessionStorage.clear();
            jest.restoreAllMocks();
        });

        describe("migrateExistingCache", () => {
            it("should migrate v0 tokens to current schema in localStorage", async () => {
                await browserCacheManager.initialize(
                    TEST_CONFIG.CORRELATION_ID
                );

                // Setup some current cache entries
                await browserCacheManager.saveCacheRecord(
                    {
                        account: TEST_ACCOUNT_ENTITY,
                        accessToken: TEST_ACCESS_TOKEN_ENTITY,
                        idToken: TEST_ID_TOKEN_ENTITY,
                        refreshToken: TEST_REFRESH_TOKEN_ENTITY,
                    },
                    TEST_CONFIG.CORRELATION_ID,
                    true,
                    0
                );

                // Setup some v0 cache entries
                const v0AccountKey = "msal.account.keys";
                const v0TokenKey = `msal.token.keys.${TEST_CONFIG.MSAL_CLIENT_ID}`;
                const v0Account = {
                    ...TEST_ACCOUNT_ENTITY,
                    homeAccountId: "different-uid.different-utid",
                };
                const accountKey = `${v0Account.homeAccountId}-${v0Account.environment}-${v0Account.realm}`;
                window.localStorage.setItem(
                    v0AccountKey,
                    JSON.stringify([accountKey])
                );
                window.localStorage.setItem(
                    accountKey,
                    JSON.stringify(v0Account)
                );

                const v0IdToken = {
                    ...TEST_ID_TOKEN_ENTITY,
                    homeAccountId: "different-uid.different-utid",
                };
                const idTokenKey = `${v0IdToken.homeAccountId}-${v0IdToken.environment}-idtoken-${v0IdToken.clientId}-${v0IdToken.realm}`;
                window.localStorage.setItem(
                    idTokenKey,
                    JSON.stringify(v0IdToken)
                );

                const v0AccessToken = {
                    ...TEST_ACCESS_TOKEN_ENTITY,
                    homeAccountId: "different-uid.different-utid",
                };
                const accessTokenKey = `${v0AccessToken.homeAccountId}-${v0AccessToken.environment}-accesstoken-${v0AccessToken.clientId}-${v0AccessToken.realm}`;
                window.localStorage.setItem(
                    accessTokenKey,
                    JSON.stringify(v0AccessToken)
                );

                const v0RefreshToken = {
                    ...TEST_REFRESH_TOKEN_ENTITY,
                    homeAccountId: "different-uid.different-utid",
                };
                const refreshTokenKey = `${v0RefreshToken.homeAccountId}-${v0RefreshToken.environment}-refreshtoken-${v0RefreshToken.clientId}-${v0RefreshToken.realm}`;
                window.localStorage.setItem(
                    refreshTokenKey,
                    JSON.stringify(v0RefreshToken)
                );

                window.localStorage.setItem(
                    v0TokenKey,
                    JSON.stringify({
                        idToken: [idTokenKey],
                        accessToken: [accessTokenKey],
                        refreshToken: [refreshTokenKey],
                    })
                );

                const addFieldsSpy = jest.spyOn(performanceClient, "addFields");

                await browserCacheManager.migrateExistingCache(
                    TEST_CONFIG.CORRELATION_ID
                );

                expect(addFieldsSpy).toHaveBeenCalledWith(
                    {
                        preMigrateATCount: 1,
                        preMigrateAcntCount: 1,
                        preMigrateITCount: 1,
                        preMigrateRTCount: 1,
                    },
                    TEST_CONFIG.CORRELATION_ID
                );

                expect(addFieldsSpy).toHaveBeenCalledWith(
                    {
                        postMigrateATCount: 2,
                        postMigrateAcntCount: 2,
                        postMigrateITCount: 2,
                        postMigrateRTCount: 2,
                    },
                    TEST_CONFIG.CORRELATION_ID
                );
            });

            it("should migrate v1 tokens to current schema in localStorage", async () => {
                await browserCacheManager.initialize(
                    TEST_CONFIG.CORRELATION_ID
                );

                // Setup some current cache entries
                await browserCacheManager.saveCacheRecord(
                    {
                        account: TEST_ACCOUNT_ENTITY,
                        accessToken: TEST_ACCESS_TOKEN_ENTITY,
                        idToken: TEST_ID_TOKEN_ENTITY,
                        refreshToken: TEST_REFRESH_TOKEN_ENTITY,
                    },
                    TEST_CONFIG.CORRELATION_ID,
                    true,
                    0
                );

                // Setup some v1 cache entries
                const v1AccountKey = "msal.1.account.keys";
                const v1TokenKey = `msal.1.token.keys.${TEST_CONFIG.MSAL_CLIENT_ID}`;
                const v1Account = {
                    ...TEST_ACCOUNT_ENTITY,
                    homeAccountId: "different-uid.different-utid",
                };
                const accountKey = `msal.1-${v1Account.homeAccountId}-${v1Account.environment}-${v1Account.realm}`;
                window.localStorage.setItem(
                    v1AccountKey,
                    JSON.stringify([accountKey])
                );
                window.localStorage.setItem(
                    accountKey,
                    JSON.stringify(v1Account)
                );

                const v1IdToken = {
                    ...TEST_ID_TOKEN_ENTITY,
                    homeAccountId: "different-uid.different-utid",
                };
                const idTokenKey = `msal.1-${v1IdToken.homeAccountId}-${v1IdToken.environment}-idtoken-${v1IdToken.clientId}-${v1IdToken.realm}`;
                window.localStorage.setItem(
                    idTokenKey,
                    JSON.stringify(v1IdToken)
                );

                const v1AccessToken = {
                    ...TEST_ACCESS_TOKEN_ENTITY,
                    homeAccountId: "different-uid.different-utid",
                };
                const accessTokenKey = `msal.1-${v1AccessToken.homeAccountId}-${v1AccessToken.environment}-accesstoken-${v1AccessToken.clientId}-${v1AccessToken.realm}`;
                window.localStorage.setItem(
                    accessTokenKey,
                    JSON.stringify(v1AccessToken)
                );

                const v1RefreshToken = {
                    ...TEST_REFRESH_TOKEN_ENTITY,
                    homeAccountId: "different-uid.different-utid",
                };
                const refreshTokenKey = `msal.1-${v1RefreshToken.homeAccountId}-${v1RefreshToken.environment}-refreshtoken-${v1RefreshToken.clientId}-${v1RefreshToken.realm}`;
                window.localStorage.setItem(
                    refreshTokenKey,
                    JSON.stringify(v1RefreshToken)
                );

                window.localStorage.setItem(
                    v1TokenKey,
                    JSON.stringify({
                        idToken: [idTokenKey],
                        accessToken: [accessTokenKey],
                        refreshToken: [refreshTokenKey],
                    })
                );

                const addFieldsSpy = jest.spyOn(performanceClient, "addFields");

                await browserCacheManager.migrateExistingCache(
                    TEST_CONFIG.CORRELATION_ID
                );

                expect(addFieldsSpy).toHaveBeenCalledWith(
                    {
                        preMigrateATCount: 1,
                        preMigrateAcntCount: 1,
                        preMigrateITCount: 1,
                        preMigrateRTCount: 1,
                    },
                    TEST_CONFIG.CORRELATION_ID
                );

                expect(addFieldsSpy).toHaveBeenCalledWith(
                    {
                        postMigrateATCount: 2,
                        postMigrateAcntCount: 2,
                        postMigrateITCount: 2,
                        postMigrateRTCount: 2,
                    },
                    TEST_CONFIG.CORRELATION_ID
                );
            });

            it("should migrate v2 tokens to current schema in localStorage", async () => {
                await browserCacheManager.initialize(
                    TEST_CONFIG.CORRELATION_ID
                );

                // Setup some current cache entries
                await browserCacheManager.saveCacheRecord(
                    {
                        account: TEST_ACCOUNT_ENTITY,
                        accessToken: TEST_ACCESS_TOKEN_ENTITY,
                        idToken: TEST_ID_TOKEN_ENTITY,
                        refreshToken: TEST_REFRESH_TOKEN_ENTITY,
                    },
                    TEST_CONFIG.CORRELATION_ID,
                    true,
                    0
                );

                // Setup some schema 2 cache entries
                const schema2Account = {
                    ...TEST_ACCOUNT_ENTITY,
                    homeAccountId: "schema2-cleanup.uid.utid",
                    lastUpdatedAt: (Date.now() - 1000).toString(),
                };
                const schema2AccountKey =
                    `msal.2|${schema2Account.homeAccountId}|${schema2Account.environment}|utid`.toLowerCase();
                window.localStorage.setItem(
                    CacheKeys.getAccountKeysCacheKey(2),
                    JSON.stringify([schema2AccountKey])
                );
                window.localStorage.setItem(
                    schema2AccountKey,
                    JSON.stringify(schema2Account)
                );

                const timestamp = (Date.now() - 1000).toString();
                const schema2IdToken = {
                    ...TEST_ID_TOKEN_ENTITY,
                    homeAccountId: schema2Account.homeAccountId,
                    lastUpdatedAt: timestamp,
                };
                const schema2AccessToken = {
                    ...TEST_ACCESS_TOKEN_ENTITY,
                    homeAccountId: schema2Account.homeAccountId,
                    lastUpdatedAt: timestamp,
                };
                const schema2RefreshToken = {
                    ...TEST_REFRESH_TOKEN_ENTITY,
                    homeAccountId: schema2Account.homeAccountId,
                    lastUpdatedAt: timestamp,
                };

                const compactIdTokenKey =
                    `msal.2|${schema2IdToken.homeAccountId}|${schema2IdToken.environment}|${schema2IdToken.credentialType}|${schema2IdToken.clientId}|${schema2IdToken.realm}||`.toLowerCase();
                const legacyIdTokenKey =
                    `msal.2|${schema2IdToken.homeAccountId}|${schema2IdToken.environment}|${schema2IdToken.credentialType}|${schema2IdToken.clientId}|${schema2IdToken.realm}|||`.toLowerCase();
                const compactAccessTokenKey =
                    `msal.2|${schema2AccessToken.homeAccountId}|${schema2AccessToken.environment}|${schema2AccessToken.credentialType}|${schema2AccessToken.clientId}|${schema2AccessToken.realm}|${schema2AccessToken.target}|`.toLowerCase();
                const legacyAccessTokenKey =
                    `msal.2|${schema2AccessToken.homeAccountId}|${schema2AccessToken.environment}|${schema2AccessToken.credentialType}|${schema2AccessToken.clientId}|${schema2AccessToken.realm}|${schema2AccessToken.target}||`.toLowerCase();
                const schema2RefreshTokenFamilyId =
                    schema2RefreshToken.familyId ||
                    schema2RefreshToken.clientId;
                const compactRefreshTokenKey = `msal.2|${
                    schema2RefreshToken.homeAccountId
                }|${schema2RefreshToken.environment}|${
                    schema2RefreshToken.credentialType
                }|${schema2RefreshTokenFamilyId}|${
                    schema2RefreshToken.realm || ""
                }||`.toLowerCase();
                const legacyRefreshTokenKey = `msal.2|${
                    schema2RefreshToken.homeAccountId
                }|${schema2RefreshToken.environment}|${
                    schema2RefreshToken.credentialType
                }|${schema2RefreshTokenFamilyId}|${
                    schema2RefreshToken.realm || ""
                }|||`.toLowerCase();

                window.localStorage.setItem(
                    compactIdTokenKey,
                    JSON.stringify(schema2IdToken)
                );
                window.localStorage.setItem(
                    legacyIdTokenKey,
                    JSON.stringify(schema2IdToken)
                );
                window.localStorage.setItem(
                    compactAccessTokenKey,
                    JSON.stringify(schema2AccessToken)
                );
                window.localStorage.setItem(
                    legacyAccessTokenKey,
                    JSON.stringify(schema2AccessToken)
                );
                window.localStorage.setItem(
                    compactRefreshTokenKey,
                    JSON.stringify(schema2RefreshToken)
                );
                window.localStorage.setItem(
                    legacyRefreshTokenKey,
                    JSON.stringify(schema2RefreshToken)
                );
                window.localStorage.setItem(
                    CacheKeys.getTokenKeysCacheKey(
                        TEST_CONFIG.MSAL_CLIENT_ID,
                        2
                    ),
                    JSON.stringify({
                        idToken: [compactIdTokenKey, legacyIdTokenKey],
                        accessToken: [
                            compactAccessTokenKey,
                            legacyAccessTokenKey,
                        ],
                        refreshToken: [
                            compactRefreshTokenKey,
                            legacyRefreshTokenKey,
                        ],
                    })
                );

                const addFieldsSpy = jest.spyOn(performanceClient, "addFields");

                await browserCacheManager.migrateExistingCache(
                    TEST_CONFIG.CORRELATION_ID
                );

                expect(addFieldsSpy).toHaveBeenCalledWith(
                    {
                        preMigrateATCount: 1,
                        preMigrateAcntCount: 1,
                        preMigrateITCount: 1,
                        preMigrateRTCount: 1,
                    },
                    TEST_CONFIG.CORRELATION_ID
                );

                expect(addFieldsSpy).toHaveBeenCalledWith(
                    {
                        postMigrateATCount: 2,
                        postMigrateAcntCount: 2,
                        postMigrateITCount: 2,
                        postMigrateRTCount: 2,
                    },
                    TEST_CONFIG.CORRELATION_ID
                );

                const currentTokenKeys = browserCacheManager.getTokenKeys();
                expect(currentTokenKeys.idToken).toEqual([
                    browserCacheManager.generateCredentialKey(
                        TEST_ID_TOKEN_ENTITY
                    ),
                    browserCacheManager.generateCredentialKey(schema2IdToken),
                ]);
                expect(currentTokenKeys.accessToken).toEqual([
                    browserCacheManager.generateCredentialKey(
                        TEST_ACCESS_TOKEN_ENTITY
                    ),
                    browserCacheManager.generateCredentialKey(
                        schema2AccessToken
                    ),
                ]);
                expect(currentTokenKeys.refreshToken).toEqual([
                    browserCacheManager.generateCredentialKey(
                        TEST_REFRESH_TOKEN_ENTITY
                    ),
                    browserCacheManager.generateCredentialKey(
                        schema2RefreshToken
                    ),
                ]);

                const schema2TokenKeys = browserCacheManager.getTokenKeys(2);
                expect(schema2TokenKeys.idToken).toEqual([
                    compactIdTokenKey,
                    legacyIdTokenKey,
                ]);
                expect(schema2TokenKeys.accessToken).toEqual([
                    compactAccessTokenKey,
                    legacyAccessTokenKey,
                ]);
                expect(schema2TokenKeys.refreshToken).toEqual([
                    compactRefreshTokenKey,
                    legacyRefreshTokenKey,
                ]);

                expect(window.localStorage.getItem(compactIdTokenKey)).toBe(
                    JSON.stringify(schema2IdToken)
                );
                expect(window.localStorage.getItem(legacyIdTokenKey)).toBe(
                    JSON.stringify(schema2IdToken)
                );
                expect(window.localStorage.getItem(compactAccessTokenKey)).toBe(
                    JSON.stringify(schema2AccessToken)
                );
                expect(window.localStorage.getItem(legacyAccessTokenKey)).toBe(
                    JSON.stringify(schema2AccessToken)
                );
                expect(
                    window.localStorage.getItem(compactRefreshTokenKey)
                ).toBe(JSON.stringify(schema2RefreshToken));
                expect(window.localStorage.getItem(legacyRefreshTokenKey)).toBe(
                    JSON.stringify(schema2RefreshToken)
                );
                expect(
                    window.localStorage.getItem(
                        CacheKeys.getTokenKeysCacheKey(
                            TEST_CONFIG.MSAL_CLIENT_ID,
                            2
                        )
                    )
                ).not.toBeNull();
            });

            describe("getKMSIValues", () => {
                it("should return empty map when there are no idTokens", () => {
                    const kmsiMap = browserCacheManager.getKMSIValues();
                    expect(kmsiMap).toEqual({});
                });

                it("should handle idToken with no signin_state claim", async () => {
                    await browserCacheManager.initialize(
                        TEST_CONFIG.CORRELATION_ID
                    );

                    // Use existing IDTOKEN_V2 which doesn't have signin_state claim
                    const idTokenWithoutKmsi = {
                        ...TEST_ID_TOKEN_ENTITY,
                        secret: TEST_TOKENS.IDTOKEN_V2,
                    };
                    await browserCacheManager.setIdTokenCredential(
                        idTokenWithoutKmsi,
                        TEST_CONFIG.CORRELATION_ID,
                        false
                    );

                    const kmsiMap = browserCacheManager.getKMSIValues();
                    // IDTOKEN_V2 doesn't have signin_state, so KMSI should be false
                    expect(kmsiMap[idTokenWithoutKmsi.homeAccountId]).toBe(
                        false
                    );
                });

                it("should return correct KMSI values for multiple accounts", async () => {
                    await browserCacheManager.initialize(
                        TEST_CONFIG.CORRELATION_ID
                    );

                    // Account 1 - Use IDTOKEN_V2 which doesn't have signin_state
                    const idToken1 = {
                        ...TEST_ID_TOKEN_ENTITY,
                        homeAccountId: "account1.tenant1",
                        secret: TEST_TOKENS.IDTOKEN_V2,
                    };
                    await browserCacheManager.setIdTokenCredential(
                        idToken1,
                        TEST_CONFIG.CORRELATION_ID,
                        false
                    );

                    // Account 2 - Use IDTOKEN_V2_ALT which also doesn't have signin_state
                    const idToken2 = {
                        ...TEST_ID_TOKEN_ENTITY,
                        homeAccountId: "account2.tenant2",
                        secret: TEST_TOKENS.IDTOKEN_V2_ALT,
                    };
                    await browserCacheManager.setIdTokenCredential(
                        idToken2,
                        TEST_CONFIG.CORRELATION_ID,
                        false
                    );

                    const kmsiMap = browserCacheManager.getKMSIValues();
                    expect(Object.keys(kmsiMap).length).toBe(2);
                    expect(kmsiMap["account1.tenant1"]).toBe(false);
                    expect(kmsiMap["account2.tenant2"]).toBe(false);
                });

                it("should return KMSI=true for idToken with signin_state claim", async () => {
                    await browserCacheManager.initialize(
                        TEST_CONFIG.CORRELATION_ID
                    );

                    // Create an idToken entity with signin_state in the claims
                    // We'll mock the getUserData to return a token with the right structure
                    const idTokenWithKmsi = {
                        ...TEST_ID_TOKEN_ENTITY,
                        homeAccountId: "kmsi-account.tenant",
                        secret: TEST_TOKENS.IDTOKEN_V2,
                    };

                    // Store the token first
                    await browserCacheManager.setIdTokenCredential(
                        idTokenWithKmsi,
                        TEST_CONFIG.CORRELATION_ID,
                        true
                    );

                    // Mock getUserData to inject signin_state into the decoded claims
                    // We need to mock at the point where getKMSIValues reads the token
                    const originalGetUserData = browserCacheManager[
                        "browserStorage"
                    ].getUserData.bind(browserCacheManager["browserStorage"]);
                    jest.spyOn(
                        browserCacheManager["browserStorage"],
                        "getUserData"
                    ).mockImplementation((key: string) => {
                        const data = originalGetUserData(key);
                        if (data) {
                            const parsed = JSON.parse(data);
                            if (
                                parsed.homeAccountId === "kmsi-account.tenant"
                            ) {
                                // Create a mock token with signin_state
                                // Base64 encode a payload with signin_state: ["kmsi"]
                                const header =
                                    "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9"; // {"typ":"JWT","alg":"RS256"}
                                const payload = Buffer.from(
                                    JSON.stringify({
                                        oid: "00000000-0000-0000-66f3-3332eca7ea81",
                                        sub: "sub",
                                        signin_state: ["kmsi"],
                                    })
                                ).toString("base64");
                                const signature = "signature";
                                parsed.secret = `${header}.${payload}.${signature}`;
                            }
                            return JSON.stringify(parsed);
                        }
                        return data;
                    });

                    const kmsiMap = browserCacheManager.getKMSIValues();
                    expect(kmsiMap["kmsi-account.tenant"]).toBe(true);

                    // Restore the original method
                    jest.restoreAllMocks();
                });

                it("should skip invalid idToken entries", async () => {
                    await browserCacheManager.initialize(
                        TEST_CONFIG.CORRELATION_ID
                    );

                    // Create a valid idToken first
                    await browserCacheManager.setIdTokenCredential(
                        TEST_ID_TOKEN_ENTITY,
                        TEST_CONFIG.CORRELATION_ID,
                        true
                    );

                    // Manually add an invalid entry
                    const tokenKeys = browserCacheManager.getTokenKeys();
                    tokenKeys.idToken.push("invalid-key");
                    browserCacheManager.setTokenKeys(
                        tokenKeys,
                        TEST_CONFIG.CORRELATION_ID
                    );

                    const kmsiMap = browserCacheManager.getKMSIValues();
                    // Should only have the valid token
                    expect(Object.keys(kmsiMap).length).toBe(1);
                    expect(
                        kmsiMap[TEST_ID_TOKEN_ENTITY.homeAccountId]
                    ).toBeDefined();
                });
            });

            describe("migrateIdTokens - KMSI edge cases", () => {
                it("should migrate when old token has signin_state and is newer", async () => {
                    await browserCacheManager.initialize(
                        TEST_CONFIG.CORRELATION_ID
                    );

                    // Create a v0 token WITH signin_state (KMSI) - different account to avoid conflicts
                    // Use recent timestamp to avoid cache expiration
                    const recentTimestamp = (Date.now() - 1000).toString(); // 1 second ago
                    const v0IdToken = {
                        ...TEST_ID_TOKEN_ENTITY,
                        homeAccountId: "v0-account.tenant",
                        secret: TEST_TOKENS.IDTOKEN_V2, // Has signin_state
                        lastUpdatedAt: recentTimestamp,
                    };
                    const v0IdTokenKey = `${v0IdToken.homeAccountId}-${v0IdToken.environment}-idtoken-${v0IdToken.clientId}-${v0IdToken.realm}`;
                    window.localStorage.setItem(
                        v0IdTokenKey,
                        JSON.stringify(v0IdToken)
                    );

                    // Setup v0 account
                    const v0Account = {
                        ...TEST_ACCOUNT_ENTITY,
                        homeAccountId: "v0-account.tenant",
                    };
                    const v0AccountKey = `${v0Account.homeAccountId}-${v0Account.environment}-${v0Account.realm}`;
                    window.localStorage.setItem(
                        v0AccountKey,
                        JSON.stringify(v0Account)
                    );
                    window.localStorage.setItem(
                        "msal.account.keys",
                        JSON.stringify([v0AccountKey])
                    );

                    // Setup v0 token keys
                    window.localStorage.setItem(
                        `msal.token.keys.${TEST_CONFIG.MSAL_CLIENT_ID}`,
                        JSON.stringify({
                            idToken: [v0IdTokenKey],
                            accessToken: [],
                            refreshToken: [],
                        })
                    );

                    const performanceIncrement = jest.spyOn(
                        performanceClient,
                        "incrementFields"
                    );

                    await browserCacheManager.migrateExistingCache(
                        TEST_CONFIG.CORRELATION_ID
                    );

                    // Should have migrated successfully
                    expect(performanceIncrement).toHaveBeenCalledWith(
                        { migratedITCount: 1 },
                        TEST_CONFIG.CORRELATION_ID
                    );
                });

                it("should NOT overwrite newer tokens with KMSI during migration", async () => {
                    await browserCacheManager.initialize(
                        TEST_CONFIG.CORRELATION_ID
                    );

                    // Setup a fresh account and idToken (this will be the "current" v2 state)
                    const currentAccount = {
                        ...TEST_ACCOUNT_ENTITY,
                        homeAccountId: "test-account.tenant",
                        lastUpdatedAt: "3000", // Newest
                    };

                    const currentIdToken = {
                        ...TEST_ID_TOKEN_ENTITY,
                        homeAccountId: "test-account.tenant",
                        secret: TEST_TOKENS.IDTOKEN_V2, // Has signin_state
                        lastUpdatedAt: "3000", // Newest
                    };
                    await browserCacheManager.setAccount(
                        currentAccount,
                        TEST_CONFIG.CORRELATION_ID,
                        true,
                        0
                    );
                    await browserCacheManager.setIdTokenCredential(
                        currentIdToken,
                        TEST_CONFIG.CORRELATION_ID,
                        true
                    );

                    // Now setup an older v0 token - use IDTOKEN_V2_ALT as a different token
                    const v0IdToken = {
                        ...TEST_ID_TOKEN_ENTITY,
                        homeAccountId: "test-account.tenant",
                        secret: TEST_TOKENS.IDTOKEN_V2_ALT,
                        lastUpdatedAt: "1000", // Older
                    };
                    const v0IdTokenKey = `${v0IdToken.homeAccountId}-${v0IdToken.environment}-idtoken-${v0IdToken.clientId}-${v0IdToken.realm}`;
                    window.localStorage.setItem(
                        v0IdTokenKey,
                        JSON.stringify(v0IdToken)
                    );

                    // Setup v0 account
                    const v0Account = {
                        ...TEST_ACCOUNT_ENTITY,
                        homeAccountId: "test-account.tenant",
                        lastUpdatedAt: "1000",
                    };
                    const v0AccountKey = `${v0Account.homeAccountId}-${v0Account.environment}-${v0Account.realm}`;
                    window.localStorage.setItem(
                        v0AccountKey,
                        JSON.stringify(v0Account)
                    );
                    window.localStorage.setItem(
                        "msal.account.keys",
                        JSON.stringify([v0AccountKey])
                    );

                    // Setup v0 token keys
                    window.localStorage.setItem(
                        `msal.token.keys.${TEST_CONFIG.MSAL_CLIENT_ID}`,
                        JSON.stringify({
                            idToken: [v0IdTokenKey],
                            accessToken: [],
                            refreshToken: [],
                        })
                    );

                    await browserCacheManager.migrateExistingCache(
                        TEST_CONFIG.CORRELATION_ID
                    );

                    // Should NOT have overwritten - current token with signin_state should remain
                    const currentToken =
                        browserCacheManager.getIdTokenCredential(
                            browserCacheManager.generateCredentialKey(
                                currentIdToken
                            ),
                            TEST_CONFIG.CORRELATION_ID
                        );
                    expect(currentToken?.secret).toBe(TEST_TOKENS.IDTOKEN_V2);
                });

                it("should skip migration when account is missing", async () => {
                    await browserCacheManager.initialize(
                        TEST_CONFIG.CORRELATION_ID
                    );

                    // Create v0 idToken without corresponding account
                    const v0IdToken = {
                        ...TEST_ID_TOKEN_ENTITY,
                        homeAccountId: "orphaned-account",
                    };
                    const v0IdTokenKey = `${v0IdToken.homeAccountId}-${v0IdToken.environment}-idtoken-${v0IdToken.clientId}-${v0IdToken.realm}`;
                    window.localStorage.setItem(
                        v0IdTokenKey,
                        JSON.stringify(v0IdToken)
                    );

                    // Setup v0 token keys but NO account keys
                    window.localStorage.setItem(
                        `msal.token.keys.${TEST_CONFIG.MSAL_CLIENT_ID}`,
                        JSON.stringify({
                            idToken: [v0IdTokenKey],
                            accessToken: [],
                            refreshToken: [],
                        })
                    );

                    const performanceIncrement = jest.spyOn(
                        performanceClient,
                        "incrementFields"
                    );

                    await browserCacheManager.migrateExistingCache(
                        TEST_CONFIG.CORRELATION_ID
                    );

                    // Should have skipped the migration
                    expect(performanceIncrement).toHaveBeenCalledWith(
                        { skipITMigrateCount: 1 },
                        TEST_CONFIG.CORRELATION_ID
                    );
                });
            });

            describe("migrateAccessTokens/RefreshTokens - KMSI edge cases", () => {
                it("should skip access token migration when kmsiMap doesn't contain homeAccountId", async () => {
                    await browserCacheManager.initialize(
                        TEST_CONFIG.CORRELATION_ID
                    );

                    // Create v0 access token without corresponding idToken
                    const v0AccessToken = {
                        ...TEST_ACCESS_TOKEN_ENTITY,
                        homeAccountId: "orphaned-account",
                    };
                    const v0AccessTokenKey = `${v0AccessToken.homeAccountId}-${v0AccessToken.environment}-accesstoken-${v0AccessToken.clientId}-${v0AccessToken.realm}`;
                    window.localStorage.setItem(
                        v0AccessTokenKey,
                        JSON.stringify(v0AccessToken)
                    );

                    // Setup v0 token keys
                    window.localStorage.setItem(
                        `msal.token.keys.${TEST_CONFIG.MSAL_CLIENT_ID}`,
                        JSON.stringify({
                            idToken: [],
                            accessToken: [v0AccessTokenKey],
                            refreshToken: [],
                        })
                    );

                    const performanceIncrement = jest.spyOn(
                        performanceClient,
                        "incrementFields"
                    );

                    await browserCacheManager.migrateExistingCache(
                        TEST_CONFIG.CORRELATION_ID
                    );

                    // Should have skipped the migration
                    expect(performanceIncrement).toHaveBeenCalledWith(
                        { skipATMigrateCount: 1 },
                        TEST_CONFIG.CORRELATION_ID
                    );
                });

                it("should skip refresh token migration when kmsiMap doesn't contain homeAccountId", async () => {
                    await browserCacheManager.initialize(
                        TEST_CONFIG.CORRELATION_ID
                    );

                    // Create v0 refresh token without corresponding idToken
                    const v0RefreshToken = {
                        ...TEST_REFRESH_TOKEN_ENTITY,
                        homeAccountId: "orphaned-account",
                    };
                    const v0RefreshTokenKey = `${v0RefreshToken.homeAccountId}-${v0RefreshToken.environment}-refreshtoken-${v0RefreshToken.clientId}----`;
                    window.localStorage.setItem(
                        v0RefreshTokenKey,
                        JSON.stringify(v0RefreshToken)
                    );

                    // Setup v0 token keys
                    window.localStorage.setItem(
                        `msal.token.keys.${TEST_CONFIG.MSAL_CLIENT_ID}`,
                        JSON.stringify({
                            idToken: [],
                            accessToken: [],
                            refreshToken: [v0RefreshTokenKey],
                        })
                    );

                    const performanceIncrement = jest.spyOn(
                        performanceClient,
                        "incrementFields"
                    );

                    await browserCacheManager.migrateExistingCache(
                        TEST_CONFIG.CORRELATION_ID
                    );

                    // Should have skipped the migration
                    expect(performanceIncrement).toHaveBeenCalledWith(
                        { skipRTMigrateCount: 1 },
                        TEST_CONFIG.CORRELATION_ID
                    );
                });

                it("should migrate access tokens with correct KMSI value from kmsiMap", async () => {
                    await browserCacheManager.initialize(
                        TEST_CONFIG.CORRELATION_ID
                    );

                    // Setup idToken with KMSI=true
                    const idToken = {
                        ...TEST_ID_TOKEN_ENTITY,
                        secret: TEST_TOKENS.IDTOKEN_V2, // Has signin_state with kmsi
                    };
                    await browserCacheManager.setIdTokenCredential(
                        idToken,
                        TEST_CONFIG.CORRELATION_ID,
                        true
                    );

                    // Create v0 access token for same account
                    const v0AccessToken = {
                        ...TEST_ACCESS_TOKEN_ENTITY,
                        homeAccountId: idToken.homeAccountId,
                    };
                    const v0AccessTokenKey = `${v0AccessToken.homeAccountId}-${v0AccessToken.environment}-accesstoken-${v0AccessToken.clientId}-${v0AccessToken.realm}`;
                    window.localStorage.setItem(
                        v0AccessTokenKey,
                        JSON.stringify(v0AccessToken)
                    );

                    // Setup v0 token keys
                    window.localStorage.setItem(
                        `msal.token.keys.${TEST_CONFIG.MSAL_CLIENT_ID}`,
                        JSON.stringify({
                            idToken: [],
                            accessToken: [v0AccessTokenKey],
                            refreshToken: [],
                        })
                    );

                    const performanceIncrement = jest.spyOn(
                        performanceClient,
                        "incrementFields"
                    );

                    await browserCacheManager.migrateExistingCache(
                        TEST_CONFIG.CORRELATION_ID
                    );

                    // Should have migrated successfully
                    expect(performanceIncrement).toHaveBeenCalledWith(
                        { migratedATCount: 1 },
                        TEST_CONFIG.CORRELATION_ID
                    );
                });

                it("should only migrate access tokens when newer than existing", async () => {
                    await browserCacheManager.initialize(
                        TEST_CONFIG.CORRELATION_ID
                    );

                    // Use recent timestamp to avoid cache expiration
                    const recentTimestamp = (Date.now() - 1000).toString(); // 1 second ago

                    // Setup idToken first for KMSI map
                    const idToken = {
                        ...TEST_ID_TOKEN_ENTITY,
                        lastUpdatedAt: recentTimestamp,
                    };
                    await browserCacheManager.setIdTokenCredential(
                        idToken,
                        TEST_CONFIG.CORRELATION_ID,
                        true
                    );

                    // Create v0 access token (older) with specific target
                    const v0AccessToken = {
                        ...TEST_ACCESS_TOKEN_ENTITY,
                        lastUpdatedAt: recentTimestamp,
                        target: "scope1 scope2",
                    };
                    const v0AccessTokenKey = `${v0AccessToken.homeAccountId}-${v0AccessToken.environment}-accesstoken-${v0AccessToken.clientId}-${v0AccessToken.realm}-${v0AccessToken.target}--`;
                    window.localStorage.setItem(
                        v0AccessTokenKey,
                        JSON.stringify(v0AccessToken)
                    );

                    // Setup v0 token keys
                    window.localStorage.setItem(
                        `msal.token.keys.${TEST_CONFIG.MSAL_CLIENT_ID}`,
                        JSON.stringify({
                            idToken: [],
                            accessToken: [v0AccessTokenKey],
                            refreshToken: [],
                        })
                    );

                    const performanceIncrement = jest.spyOn(
                        performanceClient,
                        "incrementFields"
                    );

                    await browserCacheManager.migrateExistingCache(
                        TEST_CONFIG.CORRELATION_ID
                    );

                    // Should have migrated the old token
                    expect(performanceIncrement).toHaveBeenCalledWith(
                        { migratedATCount: 1 },
                        TEST_CONFIG.CORRELATION_ID
                    );

                    // Verify the token was migrated
                    const migratedToken =
                        browserCacheManager.getAccessTokenCredential(
                            browserCacheManager.generateCredentialKey(
                                v0AccessToken
                            ),
                            TEST_CONFIG.CORRELATION_ID
                        );
                    expect(migratedToken).toBeDefined();
                });
            });
        });

        describe("updateOldEntry", () => {
            it("should add lastUpdatedAt to v0 entries that don't have it", async () => {
                const v0Key = "test-v0-key";
                const { lastUpdatedAt, ...v0Value } = TEST_ACCESS_TOKEN_ENTITY;
                window.localStorage.setItem(v0Key, JSON.stringify(v0Value));

                await browserCacheManager.updateOldEntry(
                    v0Key,
                    TEST_CONFIG.CORRELATION_ID
                );

                const updatedValue = JSON.parse(
                    window.localStorage.getItem(v0Key)!
                );
                expect(updatedValue.lastUpdatedAt).toBeDefined();
                expect(typeof updatedValue.lastUpdatedAt).toBe("string");
            });

            it("should remove expired cache entries based on cache retention days", async () => {
                const v0Key = "test-expired-key";
                const expiredTimestamp = (
                    Date.now() -
                    10 * 24 * 60 * 60 * 1000
                ).toString(); // 10 days ago
                const v0Value = {
                    someProperty: "value",
                    lastUpdatedAt: expiredTimestamp,
                };
                window.localStorage.setItem(v0Key, JSON.stringify(v0Value));

                const result = await browserCacheManager.updateOldEntry(
                    v0Key,
                    TEST_CONFIG.CORRELATION_ID
                );

                expect(result.entry).toBeNull();
                expect(result.removalReason).toBe("ttlExpired");
                expect(window.localStorage.getItem(v0Key)).toBeNull();
            });

            it("should remove expired access tokens based on expiresOn", async () => {
                const v0Key = "test-expired-access-token";
                const expiredExpiresOn = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
                const v0Value = {
                    credentialType: Constants.CredentialType.ACCESS_TOKEN,
                    environment: "login.microsoftonline.com",
                    homeAccountId: "test",
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                    realm: "common",
                    target: "https://graph.microsoft.com/.default",
                    secret: TEST_TOKENS.ACCESS_TOKEN,
                    tokenType: Constants.AuthenticationScheme.BEARER,
                    expiresOn: expiredExpiresOn.toString(),
                    lastUpdatedAt: Date.now().toString(),
                };
                window.localStorage.setItem(v0Key, JSON.stringify(v0Value));

                const result = await browserCacheManager.updateOldEntry(
                    v0Key,
                    TEST_CONFIG.CORRELATION_ID
                );

                expect(result.entry).toBeNull();
                expect(result.removalReason).toBe("expired");
                expect(window.localStorage.getItem(v0Key)).toBeNull();
            });

            it("should return decrypted value if cached entry is encrypted", async () => {
                const encryptedKey = "test-encrypted-key";
                await browserCacheManager.initialize(
                    TEST_CONFIG.CORRELATION_ID
                );
                await browserCacheManager.setUserData(
                    encryptedKey,
                    JSON.stringify(TEST_ACCESS_TOKEN_ENTITY),
                    TEST_CONFIG.CORRELATION_ID,
                    TEST_ACCESS_TOKEN_ENTITY.lastUpdatedAt,
                    false
                );

                const result = await browserCacheManager.updateOldEntry(
                    encryptedKey,
                    TEST_CONFIG.CORRELATION_ID
                );

                expect(
                    isEncrypted(
                        JSON.parse(
                            window.localStorage.getItem(encryptedKey) || "{}"
                        )
                    )
                ).toBe(true);
                expect(result.entry).toEqual(TEST_ACCESS_TOKEN_ENTITY);
            });

            it("should handle missing cache entries gracefully", async () => {
                const missingKey = "non-existent-key";
                const result = await browserCacheManager.updateOldEntry(
                    missingKey,
                    TEST_CONFIG.CORRELATION_ID
                );
                expect(result.entry).toBeNull();
                expect(result.removalReason).toBe("invalid");
            });

            it("should remove invalid entries from storage", async () => {
                const v0Key = "test-invalid-entry";
                const invalidValue = {
                    someProperty: "value",
                    lastUpdatedAt: Date.now().toString(),
                };
                window.localStorage.setItem(
                    v0Key,
                    JSON.stringify(invalidValue)
                );

                const result = await browserCacheManager.updateOldEntry(
                    v0Key,
                    TEST_CONFIG.CORRELATION_ID
                );

                expect(result.entry).toBeNull();
                expect(result.removalReason).toBe("invalid");
                expect(window.localStorage.getItem(v0Key)).toBeNull();
            });

            it("should remove encrypted entries with mismatched encryption key from storage", async () => {
                const v0Key = "test-encrypted-mismatch";
                const encryptedValue = {
                    id: "different-encryption-id",
                    nonce: "test-nonce",
                    data: "encrypted-data",
                    lastUpdatedAt: Date.now().toString(),
                };
                window.localStorage.setItem(
                    v0Key,
                    JSON.stringify(encryptedValue)
                );

                await browserCacheManager.initialize(
                    TEST_CONFIG.CORRELATION_ID
                );
                const result = await browserCacheManager.updateOldEntry(
                    v0Key,
                    TEST_CONFIG.CORRELATION_ID
                );

                expect(result.entry).toBeNull();
                expect(result.removalReason).toBe("decryptFailed");
                expect(window.localStorage.getItem(v0Key)).toBeNull();
            });
        });

        describe("removeStaleAccounts", () => {
            it("should remove encrypted accounts with mismatched encryption key", async () => {
                await browserCacheManager.initialize(
                    TEST_CONFIG.CORRELATION_ID
                );

                // Setup an old-schema account with a mismatched encryption key
                const accountKey = `${TEST_ACCOUNT_ENTITY.homeAccountId}-${TEST_ACCOUNT_ENTITY.environment}-${TEST_ACCOUNT_ENTITY.realm}`;
                const encryptedAccount = {
                    id: "different-encryption-id",
                    nonce: "test-nonce",
                    data: "encrypted-data",
                    lastUpdatedAt: Date.now().toString(),
                };
                window.localStorage.setItem(
                    accountKey,
                    JSON.stringify(encryptedAccount)
                );
                // Register the key in v0 account keys
                window.localStorage.setItem(
                    "msal.account.keys",
                    JSON.stringify([accountKey])
                );

                const incrementFieldsSpy = jest.spyOn(
                    performanceClient,
                    "incrementFields"
                );

                await browserCacheManager.removeStaleAccounts(
                    0,
                    0,
                    TEST_CONFIG.CORRELATION_ID
                );

                // Account should be removed from storage
                expect(window.localStorage.getItem(accountKey)).toBeNull();
                expect(incrementFieldsSpy).toHaveBeenCalledWith(
                    { oldAcntCount: 1 },
                    TEST_CONFIG.CORRELATION_ID
                );
                expect(incrementFieldsSpy).toHaveBeenCalledWith(
                    {
                        decryptFailedAcntCount: 1,
                    },
                    TEST_CONFIG.CORRELATION_ID
                );
            });

            it("should not remove encrypted accounts with valid encryption key", async () => {
                await browserCacheManager.initialize(
                    TEST_CONFIG.CORRELATION_ID
                );

                // Save account using the current encryption key
                const accountKey = `${TEST_ACCOUNT_ENTITY.homeAccountId}-${TEST_ACCOUNT_ENTITY.environment}-${TEST_ACCOUNT_ENTITY.realm}`;
                await browserCacheManager.setUserData(
                    accountKey,
                    JSON.stringify(TEST_ACCOUNT_ENTITY),
                    TEST_CONFIG.CORRELATION_ID,
                    Date.now().toString(),
                    false
                );

                // Register the key in v0 account keys
                window.localStorage.setItem(
                    "msal.account.keys",
                    JSON.stringify([accountKey])
                );

                await browserCacheManager.removeStaleAccounts(
                    0,
                    0,
                    TEST_CONFIG.CORRELATION_ID
                );

                // Account should still be in storage
                expect(window.localStorage.getItem(accountKey)).not.toBeNull();
            });

            it("should remove unparseable account entries from storage", async () => {
                const accountKey = "bad-account-key";
                window.localStorage.setItem(accountKey, "not-valid-json{{{");
                window.localStorage.setItem(
                    "msal.account.keys",
                    JSON.stringify([accountKey])
                );

                await browserCacheManager.removeStaleAccounts(
                    0,
                    0,
                    TEST_CONFIG.CORRELATION_ID
                );

                expect(window.localStorage.getItem(accountKey)).toBeNull();
            });
        });

        describe("per-type migration counter telemetry", () => {
            it("should increment ttlExpiredITCount when id token TTL is expired", async () => {
                await browserCacheManager.initialize(
                    TEST_CONFIG.CORRELATION_ID
                );

                const expiredTimestamp = (
                    Date.now() -
                    8 * 24 * 60 * 60 * 1000
                ).toString(); // 8 days ago
                const v0IdToken = {
                    ...TEST_ID_TOKEN_ENTITY,
                    lastUpdatedAt: expiredTimestamp,
                };
                const v0Key = `${v0IdToken.homeAccountId}-${v0IdToken.environment}-idtoken-${v0IdToken.clientId}-${v0IdToken.realm}`;
                window.localStorage.setItem(v0Key, JSON.stringify(v0IdToken));
                window.localStorage.setItem(
                    `msal.token.keys.${TEST_CONFIG.MSAL_CLIENT_ID}`,
                    JSON.stringify({
                        idToken: [v0Key],
                        accessToken: [],
                        refreshToken: [],
                    })
                );

                const incrementFieldsSpy = jest.spyOn(
                    performanceClient,
                    "incrementFields"
                );

                await browserCacheManager.migrateExistingCache(
                    TEST_CONFIG.CORRELATION_ID
                );

                expect(incrementFieldsSpy).toHaveBeenCalledWith(
                    { ttlExpiredITCount: 1 },
                    TEST_CONFIG.CORRELATION_ID
                );
            });

            it("should increment invalidATCount when access token is unparseable", async () => {
                await browserCacheManager.initialize(
                    TEST_CONFIG.CORRELATION_ID
                );

                const v0Key =
                    "test-home-test-environment-accesstoken-test-clientid-test-realm";
                window.localStorage.setItem(
                    v0Key,
                    JSON.stringify({
                        lastUpdatedAt: Date.now().toString(),
                    })
                );
                window.localStorage.setItem(
                    `msal.token.keys.${TEST_CONFIG.MSAL_CLIENT_ID}`,
                    JSON.stringify({
                        idToken: [],
                        accessToken: [v0Key],
                        refreshToken: [],
                    })
                );

                const incrementFieldsSpy = jest.spyOn(
                    performanceClient,
                    "incrementFields"
                );

                await browserCacheManager.migrateExistingCache(
                    TEST_CONFIG.CORRELATION_ID
                );

                expect(incrementFieldsSpy).toHaveBeenCalledWith(
                    { invalidATCount: 1 },
                    TEST_CONFIG.CORRELATION_ID
                );
            });

            it("should increment decryptFailedRTCount when refresh token decryption fails", async () => {
                await browserCacheManager.initialize(
                    TEST_CONFIG.CORRELATION_ID
                );

                const v0Key = `${TEST_REFRESH_TOKEN_ENTITY.homeAccountId}-${TEST_REFRESH_TOKEN_ENTITY.environment}-refreshtoken-${TEST_REFRESH_TOKEN_ENTITY.clientId}--`;
                const encryptedValue = {
                    id: "different-encryption-id",
                    nonce: "test-nonce",
                    data: "encrypted-data",
                    lastUpdatedAt: Date.now().toString(),
                };
                window.localStorage.setItem(
                    v0Key,
                    JSON.stringify(encryptedValue)
                );
                window.localStorage.setItem(
                    `msal.token.keys.${TEST_CONFIG.MSAL_CLIENT_ID}`,
                    JSON.stringify({
                        idToken: [],
                        accessToken: [],
                        refreshToken: [v0Key],
                    })
                );

                const incrementFieldsSpy = jest.spyOn(
                    performanceClient,
                    "incrementFields"
                );

                await browserCacheManager.migrateExistingCache(
                    TEST_CONFIG.CORRELATION_ID
                );

                expect(incrementFieldsSpy).toHaveBeenCalledWith(
                    { decryptFailedRTCount: 1 },
                    TEST_CONFIG.CORRELATION_ID
                );
            });

            it("should increment expiredATCount when access token expiresOn is in the past", async () => {
                await browserCacheManager.initialize(
                    TEST_CONFIG.CORRELATION_ID
                );

                const expiredExpiresOn = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
                const v0AccessToken = {
                    ...TEST_ACCESS_TOKEN_ENTITY,
                    expiresOn: expiredExpiresOn.toString(),
                    lastUpdatedAt: Date.now().toString(),
                };
                const v0Key = `${v0AccessToken.homeAccountId}-${v0AccessToken.environment}-accesstoken-${v0AccessToken.clientId}-${v0AccessToken.realm}`;
                window.localStorage.setItem(
                    v0Key,
                    JSON.stringify(v0AccessToken)
                );
                window.localStorage.setItem(
                    `msal.token.keys.${TEST_CONFIG.MSAL_CLIENT_ID}`,
                    JSON.stringify({
                        idToken: [],
                        accessToken: [v0Key],
                        refreshToken: [],
                    })
                );

                const incrementFieldsSpy = jest.spyOn(
                    performanceClient,
                    "incrementFields"
                );

                await browserCacheManager.migrateExistingCache(
                    TEST_CONFIG.CORRELATION_ID
                );

                expect(incrementFieldsSpy).toHaveBeenCalledWith(
                    { expiredATCount: 1 },
                    TEST_CONFIG.CORRELATION_ID
                );
            });
        });

        describe("KMSI (Keep Me Signed In) Storage Tests", () => {
            beforeEach(async () => {
                await browserCacheManager.initialize(
                    TEST_CONFIG.CORRELATION_ID
                );
            });

            it("should NOT encrypt idToken when KMSI is true", async () => {
                const idToken = {
                    ...TEST_ID_TOKEN_ENTITY,
                    secret: TEST_TOKENS.IDTOKEN_V2,
                };

                await browserCacheManager.setIdTokenCredential(
                    idToken,
                    TEST_CONFIG.CORRELATION_ID,
                    true // KMSI = true, NO encryption (user wants to stay signed in)
                );

                const key = browserCacheManager.generateCredentialKey(idToken);
                const rawValue = window.localStorage.getItem(key);
                expect(rawValue).toBeDefined();

                const parsedValue = JSON.parse(rawValue!);
                expect(isEncrypted(parsedValue)).toBe(false);
                expect(parsedValue).toStrictEqual(idToken);
            });

            it("should encrypt idToken when KMSI is false", async () => {
                const idToken = {
                    ...TEST_ID_TOKEN_ENTITY,
                    secret: TEST_TOKENS.IDTOKEN_V2,
                };

                await browserCacheManager.setIdTokenCredential(
                    idToken,
                    TEST_CONFIG.CORRELATION_ID,
                    false // KMSI = false, encryption for additional security
                );

                const key = browserCacheManager.generateCredentialKey(idToken);
                const rawValue = window.localStorage.getItem(key);
                expect(rawValue).toBeDefined();

                const parsedValue = JSON.parse(rawValue!);
                expect(isEncrypted(parsedValue)).toBe(true);
            });

            it("should NOT encrypt accessToken when KMSI is true", async () => {
                const accessToken = {
                    ...TEST_ACCESS_TOKEN_ENTITY,
                };

                await browserCacheManager.setAccessTokenCredential(
                    accessToken,
                    TEST_CONFIG.CORRELATION_ID,
                    true // KMSI = true, NO encryption
                );

                const key =
                    browserCacheManager.generateCredentialKey(accessToken);
                const rawValue = window.localStorage.getItem(key);
                expect(rawValue).toBeDefined();

                const parsedValue = JSON.parse(rawValue!);
                expect(isEncrypted(parsedValue)).toBe(false);
                expect(parsedValue).toStrictEqual(accessToken);
            });

            it("should encrypt accessToken when KMSI is false", async () => {
                const accessToken = {
                    ...TEST_ACCESS_TOKEN_ENTITY,
                };

                await browserCacheManager.setAccessTokenCredential(
                    accessToken,
                    TEST_CONFIG.CORRELATION_ID,
                    false // KMSI = false, encryption for security
                );

                const key =
                    browserCacheManager.generateCredentialKey(accessToken);
                const rawValue = window.localStorage.getItem(key);
                expect(rawValue).toBeDefined();

                const parsedValue = JSON.parse(rawValue!);
                expect(isEncrypted(parsedValue)).toBe(true);
            });

            it("should NOT encrypt refreshToken when KMSI is true", async () => {
                const refreshToken = {
                    ...TEST_REFRESH_TOKEN_ENTITY,
                };

                await browserCacheManager.setRefreshTokenCredential(
                    refreshToken,
                    TEST_CONFIG.CORRELATION_ID,
                    true // KMSI = true, NO encryption
                );

                const key =
                    browserCacheManager.generateCredentialKey(refreshToken);
                const rawValue = window.localStorage.getItem(key);
                expect(rawValue).toBeDefined();

                const parsedValue = JSON.parse(rawValue!);
                expect(isEncrypted(parsedValue)).toBe(false);
                expect(parsedValue).toStrictEqual(refreshToken);
            });

            it("should encrypt refreshToken when KMSI is false", async () => {
                const refreshToken = {
                    ...TEST_REFRESH_TOKEN_ENTITY,
                };

                await browserCacheManager.setRefreshTokenCredential(
                    refreshToken,
                    TEST_CONFIG.CORRELATION_ID,
                    false // KMSI = false, encryption for security
                );

                const key =
                    browserCacheManager.generateCredentialKey(refreshToken);
                const rawValue = window.localStorage.getItem(key);
                expect(rawValue).toBeDefined();

                const parsedValue = JSON.parse(rawValue!);
                expect(isEncrypted(parsedValue)).toBe(true);
            });

            it("should NOT encrypt account when KMSI is true", async () => {
                const account = { ...TEST_ACCOUNT_ENTITY };

                await browserCacheManager.setAccount(
                    account,
                    TEST_CONFIG.CORRELATION_ID,
                    true, // KMSI = true, NO encryption
                    0
                );

                const accountInfo = {
                    homeAccountId: account.homeAccountId,
                    environment: account.environment,
                    tenantId: account.realm,
                    username: account.username,
                    localAccountId: account.localAccountId,
                };
                const key = browserCacheManager.generateAccountKey(accountInfo);
                const rawValue = window.localStorage.getItem(key);
                expect(rawValue).toBeDefined();

                const parsedValue = JSON.parse(rawValue!);
                expect(isEncrypted(parsedValue)).toBe(false);
            });

            it("should set cachedByApiId on account", async () => {
                const account = { ...TEST_ACCOUNT_ENTITY };

                const apiId = ApiId.acquireTokenPopup;
                await browserCacheManager.setAccount(
                    account,
                    TEST_CONFIG.CORRELATION_ID,
                    true,
                    apiId
                );

                const accountInfo = {
                    homeAccountId: account.homeAccountId,
                    environment: account.environment,
                    tenantId: account.realm,
                    username: account.username,
                    localAccountId: account.localAccountId,
                };
                const key = browserCacheManager.generateAccountKey(accountInfo);
                const rawValue = window.localStorage.getItem(key);
                expect(rawValue).toBeDefined();

                const parsedValue = JSON.parse(rawValue!);
                expect(parsedValue.cachedByApiId).toBe(apiId);
            });

            it("should encrypt account when KMSI is false", async () => {
                const account = { ...TEST_ACCOUNT_ENTITY };

                await browserCacheManager.setAccount(
                    account,
                    TEST_CONFIG.CORRELATION_ID,
                    false, // KMSI = false, encryption for security
                    0
                );

                const accountInfo = {
                    homeAccountId: account.homeAccountId,
                    environment: account.environment,
                    tenantId: account.realm,
                    username: account.username,
                    localAccountId: account.localAccountId,
                };
                const key = browserCacheManager.generateAccountKey(accountInfo);
                const rawValue = window.localStorage.getItem(key);
                expect(rawValue).toBeDefined();

                const parsedValue = JSON.parse(rawValue!);
                expect(isEncrypted(parsedValue)).toBe(true);
            });

            it("should retrieve idToken without decryption when KMSI is true", async () => {
                const idToken = {
                    ...TEST_ID_TOKEN_ENTITY,
                    secret: TEST_TOKENS.IDTOKEN_V2,
                };

                // Store without encryption (KMSI=true)
                await browserCacheManager.setIdTokenCredential(
                    idToken,
                    TEST_CONFIG.CORRELATION_ID,
                    true
                );

                // Retrieve and verify no decryption needed
                const key = browserCacheManager.generateCredentialKey(idToken);
                const retrieved = browserCacheManager.getIdTokenCredential(
                    key,
                    TEST_CONFIG.CORRELATION_ID
                );

                expect(retrieved).toBeDefined();
                expect(retrieved?.secret).toBe(idToken.secret);
                expect(retrieved?.homeAccountId).toBe(idToken.homeAccountId);
            });

            it("should retrieve and decrypt accessToken when KMSI is false", async () => {
                const accessToken = {
                    ...TEST_ACCESS_TOKEN_ENTITY,
                };

                // Store with encryption (KMSI=false)
                await browserCacheManager.setAccessTokenCredential(
                    accessToken,
                    TEST_CONFIG.CORRELATION_ID,
                    false
                );

                // Retrieve and verify decryption works
                const key =
                    browserCacheManager.generateCredentialKey(accessToken);
                const retrieved = browserCacheManager.getAccessTokenCredential(
                    key,
                    TEST_CONFIG.CORRELATION_ID
                );

                expect(retrieved).toBeDefined();
                expect(retrieved?.secret).toBe(accessToken.secret);
                expect(retrieved?.homeAccountId).toBe(
                    accessToken.homeAccountId
                );
            });
        });

        describe("Schema Key Generation", () => {
            it("should generate v0 account keys cache key correctly", () => {
                const v0Key = CacheKeys.getAccountKeysCacheKey(0);
                expect(v0Key).toBe("msal.account.keys");
            });

            it("should generate v1 account keys cache key correctly", () => {
                const v1Key = CacheKeys.getAccountKeysCacheKey(1);
                expect(v1Key).toBe("msal.1.account.keys");
            });

            it("should generate v0 token keys cache key correctly", () => {
                const v0Key = CacheKeys.getTokenKeysCacheKey(
                    TEST_CONFIG.MSAL_CLIENT_ID,
                    0
                );
                expect(v0Key).toBe(
                    `msal.token.keys.${TEST_CONFIG.MSAL_CLIENT_ID}`
                );
            });

            it("should generate v1 token keys cache key correctly", () => {
                const v1Key = CacheKeys.getTokenKeysCacheKey(
                    TEST_CONFIG.MSAL_CLIENT_ID,
                    1
                );
                expect(v1Key).toBe(
                    `msal.1.token.keys.${TEST_CONFIG.MSAL_CLIENT_ID}`
                );
            });
        });

        describe("Cache Key Generation", () => {
            it("should generate credential keys with schema version", () => {
                const credential: CredentialEntity = {
                    credentialType: Constants.CredentialType.ACCESS_TOKEN,
                    environment: "login.microsoftonline.com",
                    homeAccountId: "test.tenant",
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                    realm: "tenant",
                    target: "scope1 scope2",
                    tokenType: Constants.AuthenticationScheme.BEARER,
                    secret: "token-secret",
                    lastUpdatedAt: Date.now().toString(),
                };

                const key =
                    browserCacheManager.generateCredentialKey(credential);
                expect(key).toContain(
                    `msal.${CacheKeys.CREDENTIAL_SCHEMA_VERSION}`
                );
                expect(key).toContain(credential.homeAccountId);
                expect(key).toContain(credential.environment);
                expect(key).toContain(credential.credentialType.toLowerCase());
            });

            it("should generate account keys with schema version", () => {
                const account = {
                    homeAccountId: "test.tenant",
                    environment: "login.microsoftonline.com",
                    tenantId: "tenant",
                    username: "test@example.com",
                    localAccountId: "test",
                };

                const key = browserCacheManager.generateAccountKey(account);
                expect(key).toContain(
                    `msal.${CacheKeys.ACCOUNT_SCHEMA_VERSION}`
                );
                expect(key).toContain(account.homeAccountId);
                expect(key).toContain(account.environment);
            });
        });

        describe("Token Keys Management with Schema Versioning", () => {
            it("should get token keys for different schema versions", () => {
                const v0TokenKeys = {
                    idToken: ["id1"],
                    accessToken: ["at1"],
                    refreshToken: ["rt1"],
                };
                const v1TokenKeys = {
                    idToken: ["id2"],
                    accessToken: ["at2"],
                    refreshToken: ["rt2"],
                };

                window.localStorage.setItem(
                    CacheKeys.getTokenKeysCacheKey(
                        TEST_CONFIG.MSAL_CLIENT_ID,
                        0
                    ),
                    JSON.stringify(v0TokenKeys)
                );
                window.localStorage.setItem(
                    CacheKeys.getTokenKeysCacheKey(
                        TEST_CONFIG.MSAL_CLIENT_ID,
                        1
                    ),
                    JSON.stringify(v1TokenKeys)
                );

                const retrievedV0 = browserCacheManager.getTokenKeys(0);
                const retrievedV1 = browserCacheManager.getTokenKeys(1);

                expect(retrievedV0).toEqual(v0TokenKeys);
                expect(retrievedV1).toEqual(v1TokenKeys);
            });

            it("should set token keys for different schema versions", () => {
                const tokenKeys = {
                    idToken: ["id1"],
                    accessToken: ["at1"],
                    refreshToken: ["rt1"],
                };

                browserCacheManager.setTokenKeys(
                    tokenKeys,
                    TEST_CONFIG.CORRELATION_ID,
                    0
                );
                browserCacheManager.setTokenKeys(
                    tokenKeys,
                    TEST_CONFIG.CORRELATION_ID,
                    1
                );

                const v0Key = CacheKeys.getTokenKeysCacheKey(
                    TEST_CONFIG.MSAL_CLIENT_ID,
                    0
                );
                const v1Key = CacheKeys.getTokenKeysCacheKey(
                    TEST_CONFIG.MSAL_CLIENT_ID,
                    1
                );

                expect(window.localStorage.getItem(v0Key)).toBe(
                    JSON.stringify(tokenKeys)
                );
                expect(window.localStorage.getItem(v1Key)).toBe(
                    JSON.stringify(tokenKeys)
                );
            });

            it("should remove token keys cache when all arrays are empty", () => {
                const emptyTokenKeys = {
                    idToken: [],
                    accessToken: [],
                    refreshToken: [],
                };

                browserCacheManager.setTokenKeys(
                    emptyTokenKeys,
                    TEST_CONFIG.CORRELATION_ID,
                    0
                );
                browserCacheManager.setTokenKeys(
                    emptyTokenKeys,
                    TEST_CONFIG.CORRELATION_ID,
                    1
                );

                const v0Key = CacheKeys.getTokenKeysCacheKey(
                    TEST_CONFIG.MSAL_CLIENT_ID,
                    0
                );
                const v1Key = CacheKeys.getTokenKeysCacheKey(
                    TEST_CONFIG.MSAL_CLIENT_ID,
                    1
                );

                expect(window.localStorage.getItem(v0Key)).toBeNull();
                expect(window.localStorage.getItem(v1Key)).toBeNull();
            });
        });

        it("should remove access tokens from correct schema version", () => {
            const v0TokenKeys = {
                idToken: [],
                accessToken: ["at1", "at2"],
                refreshToken: [],
            };
            const v1TokenKeys = {
                idToken: [],
                accessToken: ["at3", "at4"],
                refreshToken: [],
            };

            window.localStorage.setItem(
                CacheKeys.getTokenKeysCacheKey(TEST_CONFIG.MSAL_CLIENT_ID, 0),
                JSON.stringify(v0TokenKeys)
            );
            window.localStorage.setItem(
                CacheKeys.getTokenKeysCacheKey(TEST_CONFIG.MSAL_CLIENT_ID, 1),
                JSON.stringify(v1TokenKeys)
            );

            browserCacheManager.removeAccessTokenKeys(
                ["at1"],
                TEST_CONFIG.CORRELATION_ID,
                0
            );
            browserCacheManager.removeAccessTokenKeys(
                ["at3"],
                TEST_CONFIG.CORRELATION_ID,
                1
            );

            const updatedV0 = browserCacheManager.getTokenKeys(0);
            const updatedV1 = browserCacheManager.getTokenKeys(1);

            // Verify v0 schema: "at1" was removed, "at2" remains
            expect(updatedV0.accessToken).toEqual(["at2"]);
            expect(updatedV0.idToken).toEqual([]);
            expect(updatedV0.refreshToken).toEqual([]);

            // Verify v1 schema: "at3" was removed, "at4" remains
            expect(updatedV1.accessToken).toEqual(["at4"]);
            expect(updatedV1.idToken).toEqual([]);
            expect(updatedV1.refreshToken).toEqual([]);
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
                TEST_CONFIG.CORRELATION_ID,
                new StubPerformanceClient()
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

        it("setItem", () => {
            window.sessionStorage.setItem(msalCacheKey, cacheVal);
            window.localStorage.setItem(msalCacheKey2, cacheVal);
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
                "",
                500,
                Constants.AuthenticationScheme.BEARER
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
                "",
                500,
                Constants.AuthenticationScheme.BEARER
            );
            const atKey1 =
                browserCacheManager.generateCredentialKey(accessToken1);
            const atKey2 =
                browserCacheManager.generateCredentialKey(accessToken2);
            await browserCacheManager.setAccessTokenCredential(
                accessToken1,
                RANDOM_TEST_GUID,
                true
            );
            await browserCacheManager.setAccessTokenCredential(
                accessToken2,
                RANDOM_TEST_GUID,
                true
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
                "",
                500,
                Constants.AuthenticationScheme.BEARER
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
                "",
                500,
                Constants.AuthenticationScheme.BEARER
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
                "",
                500,
                Constants.AuthenticationScheme.BEARER
            );
            const atKey1 =
                browserCacheManager.generateCredentialKey(accessToken1);
            const atKey2 =
                browserCacheManager.generateCredentialKey(accessToken2);
            const atKey3 =
                browserCacheManager.generateCredentialKey(accessToken3);
            await browserCacheManager.setAccessTokenCredential(
                accessToken1,
                RANDOM_TEST_GUID,
                true
            );
            await browserCacheManager.setAccessTokenCredential(
                accessToken2,
                RANDOM_TEST_GUID,
                true
            );
            await browserCacheManager.setAccessTokenCredential(
                accessToken3,
                RANDOM_TEST_GUID,
                true
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
                    "",
                    500,
                    Constants.AuthenticationScheme.BEARER
                );
                const atKey =
                    browserCacheManager.generateCredentialKey(accessToken);
                atKeys.push(atKey);
                await browserCacheManager.setAccessTokenCredential(
                    accessToken,
                    RANDOM_TEST_GUID,
                    true
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
                "",
                500,
                Constants.AuthenticationScheme.BEARER
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
                "",
                500,
                Constants.AuthenticationScheme.BEARER
            );
            const atKey1 =
                browserCacheManager.generateCredentialKey(accessToken1);
            const atKey2 =
                browserCacheManager.generateCredentialKey(accessToken2);
            await browserCacheManager.setAccessTokenCredential(
                accessToken1,
                RANDOM_TEST_GUID,
                true
            );
            await browserCacheManager.setAccessTokenCredential(
                accessToken2,
                RANDOM_TEST_GUID,
                true
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
                Date.now().toString(),
                true
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
                    "",
                    500,
                    Constants.AuthenticationScheme.BEARER
                );
                const atKey =
                    browserCacheManager.generateCredentialKey(accessToken);
                atKeys.push(atKey);
                await browserCacheManager.setAccessTokenCredential(
                    accessToken,
                    RANDOM_TEST_GUID,
                    true
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
                    Date.now().toString(),
                    true
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
                "",
                500,
                Constants.AuthenticationScheme.BEARER
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
                "",
                500,
                Constants.AuthenticationScheme.BEARER
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
                "",
                500,
                Constants.AuthenticationScheme.BEARER
            );
            const atKey1 =
                browserCacheManager.generateCredentialKey(accessToken1);
            const atKey2 =
                browserCacheManager.generateCredentialKey(accessToken2);
            const atKey3 =
                browserCacheManager.generateCredentialKey(accessToken3);
            await browserCacheManager.setAccessTokenCredential(
                accessToken1,
                RANDOM_TEST_GUID,
                true
            );
            await browserCacheManager.setAccessTokenCredential(
                accessToken2,
                RANDOM_TEST_GUID,
                true
            );
            await browserCacheManager.setAccessTokenCredential(
                accessToken3,
                RANDOM_TEST_GUID,
                true
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
                    Date.now().toString(),
                    true
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

        it("setItem prioritizes removing oldest schema tokens first when cache quota is exceeded", async () => {
            const browserCacheManager = new BrowserCacheManager(
                TEST_CONFIG.MSAL_CLIENT_ID,
                cacheConfig,
                browserCrypto,
                logger,
                new StubPerformanceClient(),
                new EventHandler()
            );

            // Create v0 access tokens
            const v0AccessToken1 = TEST_ACCESS_TOKEN_ENTITY;
            const v0AccessToken2 = {
                ...TEST_ACCESS_TOKEN_ENTITY,
                target: "different-scope",
            };

            // Create v1 access tokens
            const v1AccessToken1 = {
                ...TEST_ACCESS_TOKEN_ENTITY,
                homeAccountId: "v1-home-account-id",
            };
            const v1AccessToken2 = {
                ...TEST_ACCESS_TOKEN_ENTITY,
                homeAccountId: "v1-home-account-id",
                target: "different-scope",
            };

            // Create v2 access tokens
            const v2AccessToken1 = {
                ...TEST_ACCESS_TOKEN_ENTITY,
                homeAccountId: "v2-home-account-id",
            };
            const v2AccessToken2 = {
                ...TEST_ACCESS_TOKEN_ENTITY,
                homeAccountId: "v2-home-account-id",
                target: "different-scope",
            };

            // Generate keys with schema versions
            const v0AtKey1 = `${v0AccessToken1.homeAccountId}-${v0AccessToken1.environment}-${v0AccessToken1.credentialType}-${v0AccessToken1.clientId}-${v0AccessToken1.target}`;
            const v0AtKey2 = `${v0AccessToken2.homeAccountId}-${v0AccessToken2.environment}-${v0AccessToken2.credentialType}-${v0AccessToken2.clientId}-${v0AccessToken2.target}`;
            const v1AtKey1 = `msal.1-${v1AccessToken1.homeAccountId}-${v1AccessToken1.environment}-${v1AccessToken1.credentialType}-${v1AccessToken1.clientId}-${v1AccessToken1.target}`;
            const v1AtKey2 = `msal.1-${v1AccessToken2.homeAccountId}-${v1AccessToken2.environment}-${v1AccessToken2.credentialType}-${v1AccessToken2.clientId}-${v1AccessToken2.target}`;
            const v2AtKey1 = `msal.2|${v2AccessToken1.homeAccountId}|${v2AccessToken1.environment}|${v2AccessToken1.credentialType}|${v2AccessToken1.clientId}|${v2AccessToken1.target}`;
            const v2AtKey2 = `msal.2|${v2AccessToken2.homeAccountId}|${v2AccessToken2.environment}|${v2AccessToken2.credentialType}|${v2AccessToken2.clientId}|${v2AccessToken2.target}`;

            // Store tokens directly in cache
            window.sessionStorage.setItem(
                v0AtKey1,
                JSON.stringify(v0AccessToken1)
            );
            window.sessionStorage.setItem(
                v0AtKey2,
                JSON.stringify(v0AccessToken2)
            );
            window.sessionStorage.setItem(
                v1AtKey1,
                JSON.stringify(v1AccessToken1)
            );
            window.sessionStorage.setItem(
                v1AtKey2,
                JSON.stringify(v1AccessToken2)
            );
            window.sessionStorage.setItem(
                v2AtKey1,
                JSON.stringify(v2AccessToken1)
            );
            window.sessionStorage.setItem(
                v2AtKey2,
                JSON.stringify(v2AccessToken2)
            );

            // Set token keys with schema versions
            const v0TokenKeys = {
                idToken: [],
                accessToken: [v0AtKey1, v0AtKey2],
                refreshToken: [],
            };
            const v1TokenKeys = {
                idToken: [],
                accessToken: [v1AtKey1, v1AtKey2],
                refreshToken: [],
            };
            const v2TokenKeys = {
                idToken: [],
                accessToken: [v2AtKey1, v2AtKey2],
                refreshToken: [],
            };
            browserCacheManager.setTokenKeys(v0TokenKeys, RANDOM_TEST_GUID, 0);
            browserCacheManager.setTokenKeys(v1TokenKeys, RANDOM_TEST_GUID, 1);
            browserCacheManager.setTokenKeys(v2TokenKeys, RANDOM_TEST_GUID, 2);

            // Verify tokens are in cache
            expect(window.sessionStorage.getItem(v0AtKey1)).toBe(
                JSON.stringify(v0AccessToken1)
            );
            expect(window.sessionStorage.getItem(v0AtKey2)).toBe(
                JSON.stringify(v0AccessToken2)
            );
            expect(window.sessionStorage.getItem(v1AtKey1)).toBe(
                JSON.stringify(v1AccessToken1)
            );
            expect(window.sessionStorage.getItem(v1AtKey2)).toBe(
                JSON.stringify(v1AccessToken2)
            );
            expect(window.sessionStorage.getItem(v2AtKey1)).toBe(
                JSON.stringify(v2AccessToken1)
            );
            expect(window.sessionStorage.getItem(v2AtKey2)).toBe(
                JSON.stringify(v2AccessToken2)
            );

            // Verify token keys are set correctly
            const initialV0TokenKeys = browserCacheManager.getTokenKeys(0);
            const initialV1TokenKeys = browserCacheManager.getTokenKeys(1);
            const initialV2TokenKeys = browserCacheManager.getTokenKeys(2);
            expect(initialV0TokenKeys.accessToken).toEqual([
                v0AtKey1,
                v0AtKey2,
            ]);
            expect(initialV1TokenKeys.accessToken).toEqual([
                v1AtKey1,
                v1AtKey2,
            ]);
            expect(initialV2TokenKeys.accessToken).toEqual([
                v2AtKey1,
                v2AtKey2,
            ]);

            const newCacheKey = "test-cache-entry";
            const newCacheVal = "test-cache-value";

            // Mock storage to throw quota error twice, then succeed
            let callCount = 0;
            jest.spyOn(SessionStorage.prototype, "setItem").mockImplementation(
                (key, value) => {
                    if (key === newCacheKey && callCount < 2) {
                        callCount++;
                        const error: any = new DOMException(
                            "The quota has been exceeded",
                            "QuotaExceededError"
                        );
                        throw error;
                    }
                    // Call the original implementation for other keys or after quota errors
                    return window.sessionStorage.setItem(key, value);
                }
            );

            browserCacheManager.setItem(
                newCacheKey,
                newCacheVal,
                RANDOM_TEST_GUID
            );

            // First v0 tokens should be removed, v1 and v2 tokens should remain
            expect(window.sessionStorage.getItem(v0AtKey1)).toBeNull();
            expect(window.sessionStorage.getItem(v0AtKey2)).toBeNull();
            expect(window.sessionStorage.getItem(v1AtKey1)).toBe(
                JSON.stringify(v1AccessToken1)
            );
            expect(window.sessionStorage.getItem(v1AtKey2)).toBe(
                JSON.stringify(v1AccessToken2)
            );
            expect(window.sessionStorage.getItem(v2AtKey1)).toBe(
                JSON.stringify(v2AccessToken1)
            );
            expect(window.sessionStorage.getItem(v2AtKey2)).toBe(
                JSON.stringify(v2AccessToken2)
            );

            // The new item should be set
            expect(window.sessionStorage.getItem(newCacheKey)).toBe(
                newCacheVal
            );

            // Token keys should be updated correctly - v0 tokens removed, v1 and v2 tokens remain
            const updatedV0Keys = browserCacheManager.getTokenKeys(0);
            const updatedV1Keys = browserCacheManager.getTokenKeys(1);
            const updatedV2Keys = browserCacheManager.getTokenKeys(2);
            expect(updatedV0Keys.accessToken).toEqual([]);
            expect(updatedV1Keys.accessToken).toEqual([v1AtKey1, v1AtKey2]);
            expect(updatedV2Keys.accessToken).toEqual([v2AtKey1, v2AtKey2]);

            // Reset callCount to check v1 tokens get removed next
            callCount = 0;
            const newCacheVal2 = "test-cache-value-2";
            browserCacheManager.setItem(
                newCacheKey,
                newCacheVal2,
                RANDOM_TEST_GUID
            );

            // Now v1 tokens should be removed, v2 tokens should remain
            expect(window.sessionStorage.getItem(v1AtKey1)).toBeNull();
            expect(window.sessionStorage.getItem(v1AtKey2)).toBeNull();
            expect(window.sessionStorage.getItem(v2AtKey1)).toBe(
                JSON.stringify(v2AccessToken1)
            );
            expect(window.sessionStorage.getItem(v2AtKey2)).toBe(
                JSON.stringify(v2AccessToken2)
            );

            // The new item should be updated
            expect(window.sessionStorage.getItem(newCacheKey)).toBe(
                newCacheVal2
            );

            // Token keys should be updated correctly - v0 and v1 tokens removed, v2 tokens remain
            const finalV0Keys = browserCacheManager.getTokenKeys(0);
            const finalV1Keys = browserCacheManager.getTokenKeys(1);
            const finalV2Keys = browserCacheManager.getTokenKeys(2);
            expect(finalV0Keys.accessToken).toEqual([]);
            expect(finalV1Keys.accessToken).toEqual([]);
            expect(finalV2Keys.accessToken).toEqual([v2AtKey1, v2AtKey2]);

            // Reset callCount again to test v2 token removal
            callCount = 0;
            const newCacheVal3 = "test-cache-value-3";
            browserCacheManager.setItem(
                newCacheKey,
                newCacheVal3,
                RANDOM_TEST_GUID
            );

            // Now v2 tokens should be removed as well
            expect(window.sessionStorage.getItem(v2AtKey1)).toBeNull();
            expect(window.sessionStorage.getItem(v2AtKey2)).toBeNull();

            // The new item should be updated
            expect(window.sessionStorage.getItem(newCacheKey)).toBe(
                newCacheVal3
            );

            // All token keys should be cleared
            const finalV2KeysAfterAllRemovals =
                browserCacheManager.getTokenKeys(2);
            expect(finalV2KeysAfterAllRemovals.accessToken).toEqual([]);
        });

        it("setUserData prioritizes removing oldest schema tokens first when cache quota is exceeded", async () => {
            const browserCacheManager = new BrowserCacheManager(
                TEST_CONFIG.MSAL_CLIENT_ID,
                cacheConfig,
                browserCrypto,
                logger,
                new StubPerformanceClient(),
                new EventHandler()
            );

            // Create v0 access tokens
            const v0AccessToken1 = TEST_ACCESS_TOKEN_ENTITY;
            const v0AccessToken2 = {
                ...TEST_ACCESS_TOKEN_ENTITY,
                target: "different-scope",
            };

            // Create v1 access tokens
            const v1AccessToken1 = {
                ...TEST_ACCESS_TOKEN_ENTITY,
                homeAccountId: "v1-home-account-id",
            };
            const v1AccessToken2 = {
                ...TEST_ACCESS_TOKEN_ENTITY,
                homeAccountId: "v1-home-account-id",
                target: "different-scope",
            };

            // Create v2 access tokens
            const v2AccessToken1 = {
                ...TEST_ACCESS_TOKEN_ENTITY,
                homeAccountId: "v2-home-account-id",
            };
            const v2AccessToken2 = {
                ...TEST_ACCESS_TOKEN_ENTITY,
                homeAccountId: "v2-home-account-id",
                target: "different-scope",
            };

            // Generate keys with schema versions
            const v0AtKey1 = `${v0AccessToken1.homeAccountId}-${v0AccessToken1.environment}-${v0AccessToken1.credentialType}-${v0AccessToken1.clientId}-${v0AccessToken1.target}`;
            const v0AtKey2 = `${v0AccessToken2.homeAccountId}-${v0AccessToken2.environment}-${v0AccessToken2.credentialType}-${v0AccessToken2.clientId}-${v0AccessToken2.target}`;
            const v1AtKey1 = `msal.1-${v1AccessToken1.homeAccountId}-${v1AccessToken1.environment}-${v1AccessToken1.credentialType}-${v1AccessToken1.clientId}-${v1AccessToken1.target}`;
            const v1AtKey2 = `msal.1-${v1AccessToken2.homeAccountId}-${v1AccessToken2.environment}-${v1AccessToken2.credentialType}-${v1AccessToken2.clientId}-${v1AccessToken2.target}`;
            const v2AtKey1 = `msal.2|${v2AccessToken1.homeAccountId}|${v2AccessToken1.environment}|${v2AccessToken1.credentialType}|${v2AccessToken1.clientId}|${v2AccessToken1.target}`;
            const v2AtKey2 = `msal.2|${v2AccessToken2.homeAccountId}|${v2AccessToken2.environment}|${v2AccessToken2.credentialType}|${v2AccessToken2.clientId}|${v2AccessToken2.target}`;

            // Store tokens directly in cache
            window.sessionStorage.setItem(
                v0AtKey1,
                JSON.stringify(v0AccessToken1)
            );
            window.sessionStorage.setItem(
                v0AtKey2,
                JSON.stringify(v0AccessToken2)
            );
            window.sessionStorage.setItem(
                v1AtKey1,
                JSON.stringify(v1AccessToken1)
            );
            window.sessionStorage.setItem(
                v1AtKey2,
                JSON.stringify(v1AccessToken2)
            );
            window.sessionStorage.setItem(
                v2AtKey1,
                JSON.stringify(v2AccessToken1)
            );
            window.sessionStorage.setItem(
                v2AtKey2,
                JSON.stringify(v2AccessToken2)
            );

            // Set token keys with schema versions
            const v0TokenKeys = {
                idToken: [],
                accessToken: [v0AtKey1, v0AtKey2],
                refreshToken: [],
            };
            const v1TokenKeys = {
                idToken: [],
                accessToken: [v1AtKey1, v1AtKey2],
                refreshToken: [],
            };
            const v2TokenKeys = {
                idToken: [],
                accessToken: [v2AtKey1, v2AtKey2],
                refreshToken: [],
            };
            browserCacheManager.setTokenKeys(v0TokenKeys, RANDOM_TEST_GUID, 0);
            browserCacheManager.setTokenKeys(v1TokenKeys, RANDOM_TEST_GUID, 1);
            browserCacheManager.setTokenKeys(v2TokenKeys, RANDOM_TEST_GUID, 2);

            const newCacheKey = "test-cache-entry";
            const newCacheVal = "test-cache-value";

            // Mock setUserData to throw quota error once, then succeed
            let callCount = 0;
            jest.spyOn(SessionStorage.prototype, "setItem").mockImplementation(
                (key, value) => {
                    if (key === newCacheKey && callCount < 2) {
                        callCount++;
                        const error: any = new DOMException(
                            "The quota has been exceeded",
                            "QuotaExceededError"
                        );
                        throw error;
                    }
                    // Call the original implementation for other keys or after quota errors
                    return window.sessionStorage.setItem(key, value);
                }
            );

            await browserCacheManager.setUserData(
                newCacheKey,
                newCacheVal,
                RANDOM_TEST_GUID,
                Date.now().toString(),
                true
            );

            // First v0 tokens should be removed, v1 and v2 tokens should remain
            expect(window.sessionStorage.getItem(v0AtKey1)).toBeNull();
            expect(window.sessionStorage.getItem(v0AtKey2)).toBeNull();
            expect(window.sessionStorage.getItem(v1AtKey1)).toBe(
                JSON.stringify(v1AccessToken1)
            );
            expect(window.sessionStorage.getItem(v1AtKey2)).toBe(
                JSON.stringify(v1AccessToken2)
            );
            expect(window.sessionStorage.getItem(v2AtKey1)).toBe(
                JSON.stringify(v2AccessToken1)
            );
            expect(window.sessionStorage.getItem(v2AtKey2)).toBe(
                JSON.stringify(v2AccessToken2)
            );

            // The new item should be set
            expect(window.sessionStorage.getItem(newCacheKey)).toBe(
                newCacheVal
            );

            // Token keys should be updated correctly - v0 tokens removed, v1 and v2 tokens remain
            const updatedV0Keys = browserCacheManager.getTokenKeys(0);
            const updatedV1Keys = browserCacheManager.getTokenKeys(1);
            const updatedV2Keys = browserCacheManager.getTokenKeys(2);
            expect(updatedV0Keys.accessToken).toEqual([]);
            expect(updatedV1Keys.accessToken).toEqual([v1AtKey1, v1AtKey2]);
            expect(updatedV2Keys.accessToken).toEqual([v2AtKey1, v2AtKey2]);

            // Reset callCount to check v1 tokens get removed next
            callCount = 0;
            const newCacheVal2 = "test-cache-value-2";
            await browserCacheManager.setUserData(
                newCacheKey,
                newCacheVal2,
                RANDOM_TEST_GUID,
                Date.now().toString(),
                true
            );

            // Now v1 tokens should be removed, v2 tokens should remain
            expect(window.sessionStorage.getItem(v1AtKey1)).toBeNull();
            expect(window.sessionStorage.getItem(v1AtKey2)).toBeNull();
            expect(window.sessionStorage.getItem(v2AtKey1)).toBe(
                JSON.stringify(v2AccessToken1)
            );
            expect(window.sessionStorage.getItem(v2AtKey2)).toBe(
                JSON.stringify(v2AccessToken2)
            );

            // The new item should be updated
            expect(window.sessionStorage.getItem(newCacheKey)).toBe(
                newCacheVal2
            );

            // Token keys should be updated correctly - v0 and v1 tokens removed, v2 tokens remain
            const finalV0Keys = browserCacheManager.getTokenKeys(0);
            const finalV1Keys = browserCacheManager.getTokenKeys(1);
            const finalV2Keys = browserCacheManager.getTokenKeys(2);
            expect(finalV0Keys.accessToken).toEqual([]);
            expect(finalV1Keys.accessToken).toEqual([]);
            expect(finalV2Keys.accessToken).toEqual([v2AtKey1, v2AtKey2]);

            // Reset callCount again to test v2 token removal
            callCount = 0;
            const newCacheVal3 = "test-cache-value-3";
            await browserCacheManager.setUserData(
                newCacheKey,
                newCacheVal3,
                RANDOM_TEST_GUID,
                Date.now().toString(),
                true
            );

            // Now v2 tokens should be removed as well
            expect(window.sessionStorage.getItem(v2AtKey1)).toBeNull();
            expect(window.sessionStorage.getItem(v2AtKey2)).toBeNull();

            // The new item should be updated
            expect(window.sessionStorage.getItem(newCacheKey)).toBe(
                newCacheVal3
            );

            // All token keys should be cleared
            const finalV2KeysAfterAllRemovals =
                browserCacheManager.getTokenKeys(2);
            expect(finalV2KeysAfterAllRemovals.accessToken).toEqual([]);
        });

        it("removeItem()", () => {
            browserSessionStorage.setTemporaryCache("cacheKey", cacheVal, true);
            browserLocalStorage.setTemporaryCache("cacheKey", cacheVal, true);
            browserSessionStorage.removeItem(msalCacheKey);
            browserLocalStorage.removeItem(msalCacheKey);
            expect(window.sessionStorage.getItem(msalCacheKey)).toBeNull();
            expect(window.localStorage.getItem(msalCacheKey)).toBeNull();
            expect(
                browserLocalStorage.getTemporaryCache(
                    "cacheKey",
                    TEST_CONFIG.CORRELATION_ID,
                    true
                )
            ).toBeNull();
            expect(
                browserSessionStorage.getTemporaryCache(
                    "cacheKey",
                    TEST_CONFIG.CORRELATION_ID,
                    true
                )
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

                it("getAccount adds accountCachedBy telemetry field", async () => {
                    const perfClient = new StubPerformanceClient();
                    const addFieldsSpy = jest.spyOn(perfClient, "addFields");
                    const tempCache = new BrowserCacheManager(
                        TEST_CONFIG.MSAL_CLIENT_ID,
                        cacheConfig,
                        browserCrypto,
                        logger,
                        perfClient,
                        new EventHandler()
                    );
                    await tempCache.initialize(TEST_CONFIG.CORRELATION_ID);

                    const account = {
                        ...TEST_ACCOUNT_ENTITY,
                        cachedByApiId: ApiId.hydrateCache,
                    };
                    const key = tempCache.generateAccountKey(
                        AccountEntityUtils.getAccountInfo(account)
                    );
                    await tempCache.setUserData(
                        key,
                        JSON.stringify(account),
                        TEST_CONFIG.CORRELATION_ID,
                        account.lastUpdatedAt || Date.now().toString(),
                        false
                    );

                    const result = tempCache.getAccount(
                        key,
                        TEST_CONFIG.CORRELATION_ID
                    );

                    expect(result?.cachedByApiId).toBe(ApiId.hydrateCache);
                    expect(addFieldsSpy).toHaveBeenCalledWith(
                        { accountCachedBy: apiIdToName(ApiId.hydrateCache) },
                        TEST_CONFIG.CORRELATION_ID
                    );
                });

                it("getAccount returns AccountEntity", async () => {
                    const testAccount = AccountEntityUtils.createAccountEntity(
                        {
                            homeAccountId: "homeAccountId",
                            idTokenClaims: AuthToken.extractTokenClaims(
                                TEST_TOKENS.IDTOKEN_V2,
                                base64Decode,
                                ""
                            ),
                            clientInfo:
                                TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO,
                            cloudGraphHostName: "cloudGraphHost",
                            msGraphHost: "msGraphHost",
                        },
                        authority,
                        ""
                    );

                    await browserLocalStorage.setAccount(
                        testAccount,
                        TEST_CONFIG.CORRELATION_ID,
                        true,
                        0
                    );
                    expect(
                        browserLocalStorage.getAccount(
                            browserLocalStorage.generateAccountKey(
                                AccountEntityUtils.getAccountInfo(testAccount)
                            ),
                            TEST_CONFIG.CORRELATION_ID
                        )
                    ).toEqual(testAccount);

                    await browserSessionStorage.setAccount(
                        testAccount,
                        TEST_CONFIG.CORRELATION_ID,
                        true,
                        0
                    );

                    expect(
                        browserSessionStorage.getAccount(
                            browserSessionStorage.generateAccountKey(
                                AccountEntityUtils.getAccountInfo(testAccount)
                            ),
                            TEST_CONFIG.CORRELATION_ID
                        )
                    ).toEqual(testAccount);
                });

                it("getAccount returns null if accountFilter is passed but values are undefined", () => {
                    const testAccountFilter: AccountFilter = {
                        loginHint: undefined,
                        sid: undefined,
                    };

                    expect(
                        getAccount(
                            testAccountFilter,
                            logger,
                            browserSessionStorage,
                            TEST_CONFIG.CORRELATION_ID
                        )
                    ).toEqual(null);
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
                        TEST_CONFIG.CORRELATION_ID,
                        true
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
                        TEST_CONFIG.CORRELATION_ID,
                        true
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
                            "",
                            500,
                            Constants.AuthenticationScheme.BEARER,
                            "oboAssertion"
                        );

                    await browserLocalStorage.setAccessTokenCredential(
                        testAccessToken,
                        TEST_CONFIG.CORRELATION_ID,
                        true
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
                        TEST_CONFIG.CORRELATION_ID,
                        true
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
                            "",
                            500,
                            Constants.AuthenticationScheme.BEARER,
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
                            "",
                            500,
                            Constants.AuthenticationScheme.POP,
                            "oboAssertion"
                        );
                    // Cache bearer token
                    await browserLocalStorage.setAccessTokenCredential(
                        testAccessTokenWithoutAuthScheme,
                        TEST_CONFIG.CORRELATION_ID,
                        true
                    );
                    await browserLocalStorage.setAccessTokenCredential(
                        testAccessTokenWithAuthScheme,
                        TEST_CONFIG.CORRELATION_ID,
                        true
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
                    ).toBe(Constants.CredentialType.ACCESS_TOKEN);
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
                            "",
                            500,
                            Constants.AuthenticationScheme.BEARER,
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
                            "",
                            500,
                            Constants.AuthenticationScheme.POP,
                            "oboAssertion"
                        );
                    // Cache bearer token
                    await browserLocalStorage.setAccessTokenCredential(
                        testAccessTokenWithoutAuthScheme,
                        TEST_CONFIG.CORRELATION_ID,
                        true
                    );
                    await browserLocalStorage.setAccessTokenCredential(
                        testAccessTokenWithAuthScheme,
                        TEST_CONFIG.CORRELATION_ID,
                        true
                    );
                    expect(
                        browserLocalStorage.getAccessTokenCredential(
                            browserLocalStorage.generateCredentialKey(
                                testAccessTokenWithoutAuthScheme
                            ),
                            RANDOM_TEST_GUID
                        )
                    ).toEqual(testAccessTokenWithoutAuthScheme);
                    expect(
                        browserLocalStorage.getAccessTokenCredential(
                            browserLocalStorage.generateCredentialKey(
                                testAccessTokenWithoutAuthScheme
                            ),
                            RANDOM_TEST_GUID
                        )?.credentialType
                    ).toBe(Constants.CredentialType.ACCESS_TOKEN);

                    await browserSessionStorage.setAccessTokenCredential(
                        testAccessTokenWithoutAuthScheme,
                        TEST_CONFIG.CORRELATION_ID,
                        true
                    );
                    await browserSessionStorage.setAccessTokenCredential(
                        testAccessTokenWithAuthScheme,
                        TEST_CONFIG.CORRELATION_ID,
                        true
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
                    ).toBe(Constants.CredentialType.ACCESS_TOKEN);
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
                            "",
                            500,
                            Constants.AuthenticationScheme.BEARER,
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
                            "",
                            500,
                            Constants.AuthenticationScheme.POP,
                            "oboAssertion"
                        );
                    // Cache bearer token
                    await browserLocalStorage.setAccessTokenCredential(
                        testAccessTokenWithoutAuthScheme,
                        TEST_CONFIG.CORRELATION_ID,
                        true
                    );
                    await browserLocalStorage.setAccessTokenCredential(
                        testAccessTokenWithAuthScheme,
                        TEST_CONFIG.CORRELATION_ID,
                        true
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
                    ).toBe(
                        Constants.CredentialType.ACCESS_TOKEN_WITH_AUTH_SCHEME
                    );

                    await browserSessionStorage.setAccessTokenCredential(
                        testAccessTokenWithoutAuthScheme,
                        TEST_CONFIG.CORRELATION_ID,
                        true
                    );
                    await browserSessionStorage.setAccessTokenCredential(
                        testAccessTokenWithAuthScheme,
                        TEST_CONFIG.CORRELATION_ID,
                        true
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
                    ).toBe(
                        Constants.CredentialType.ACCESS_TOKEN_WITH_AUTH_SCHEME
                    );
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
                        "",
                        500,
                        Constants.AuthenticationScheme.BEARER,
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
                        "",
                        500,
                        Constants.AuthenticationScheme.BEARER
                    );
                    const atKey2 =
                        browserLocalStorage.generateCredentialKey(accessToken2);

                    await browserLocalStorage.setAccessTokenCredential(
                        accessToken1,
                        TEST_CONFIG.CORRELATION_ID,
                        true
                    );
                    await browserLocalStorage.setAccessTokenCredential(
                        accessToken2,
                        TEST_CONFIG.CORRELATION_ID,
                        true
                    );

                    // At this point, order should be [accessTokenKey, anotherAccessTokenKey]
                    expect(
                        browserLocalStorage.getTokenKeys().accessToken
                    ).toEqual([atKey1, atKey2]);

                    // Set the first token again, it should move to the end
                    await browserLocalStorage.setAccessTokenCredential(
                        accessToken1,
                        TEST_CONFIG.CORRELATION_ID,
                        true
                    );

                    // Now the order should be [anotherAccessTokenKey, accessTokenKey]
                    expect(
                        browserLocalStorage.getTokenKeys().accessToken
                    ).toEqual([atKey2, atKey1]);
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
                        TEST_CONFIG.CORRELATION_ID,
                        true
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
                        TEST_CONFIG.CORRELATION_ID,
                        true
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
                        browserSessionStorage.getAppMetadata(
                            key,
                            TEST_CONFIG.CORRELATION_ID
                        )
                    ).toBeNull();
                    expect(
                        browserLocalStorage.getAppMetadata(
                            key,
                            TEST_CONFIG.CORRELATION_ID
                        )
                    ).toBeNull();
                });

                it("getAppMetadata returns null if value is not JSON", () => {
                    const key = "testKey";
                    window.localStorage.setItem(key, "this is not json");
                    window.sessionStorage.setItem(key, "this is not json");

                    expect(
                        browserSessionStorage.getAppMetadata(
                            key,
                            TEST_CONFIG.CORRELATION_ID
                        )
                    ).toBeNull();
                    expect(
                        browserLocalStorage.getAppMetadata(
                            key,
                            TEST_CONFIG.CORRELATION_ID
                        )
                    ).toBeNull();
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
                        browserSessionStorage.getAppMetadata(
                            key,
                            TEST_CONFIG.CORRELATION_ID
                        )
                    ).toBeNull();
                    expect(
                        browserLocalStorage.getAppMetadata(
                            key,
                            TEST_CONFIG.CORRELATION_ID
                        )
                    ).toBeNull();
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
                            CacheHelpers.generateAppMetadataKey(
                                testAppMetadata
                            ),
                            TEST_CONFIG.CORRELATION_ID
                        )
                    ).toEqual(testAppMetadata);
                    expect(
                        browserLocalStorage.getAppMetadata(
                            CacheHelpers.generateAppMetadataKey(
                                testAppMetadata
                            ),
                            TEST_CONFIG.CORRELATION_ID
                        )
                    ).toEqual(testAppMetadata);
                });
            });

            describe("ServerTelemetry", () => {
                it("getServerTelemetry returns null if key not in cache", () => {
                    const key = "not-in-cache";
                    expect(
                        browserSessionStorage.getServerTelemetry(
                            key,
                            TEST_CONFIG.CORRELATION_ID
                        )
                    ).toBeNull();
                    expect(
                        browserLocalStorage.getServerTelemetry(
                            key,
                            TEST_CONFIG.CORRELATION_ID
                        )
                    ).toBeNull();
                });

                it("getServerTelemetry returns null if value is not JSON", () => {
                    const key = "testKey";
                    window.localStorage.setItem(key, "this is not json");
                    window.sessionStorage.setItem(key, "this is not json");

                    expect(
                        browserSessionStorage.getServerTelemetry(
                            key,
                            TEST_CONFIG.CORRELATION_ID
                        )
                    ).toBeNull();
                    expect(
                        browserLocalStorage.getServerTelemetry(
                            key,
                            TEST_CONFIG.CORRELATION_ID
                        )
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
                        browserSessionStorage.getServerTelemetry(
                            key,
                            TEST_CONFIG.CORRELATION_ID
                        )
                    ).toBeNull();
                    expect(
                        browserLocalStorage.getServerTelemetry(
                            key,
                            TEST_CONFIG.CORRELATION_ID
                        )
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
                        browserSessionStorage.getServerTelemetry(
                            testKey,
                            TEST_CONFIG.CORRELATION_ID
                        )
                    ).toEqual(testVal);
                    expect(
                        browserLocalStorage.getServerTelemetry(
                            testKey,
                            TEST_CONFIG.CORRELATION_ID
                        )
                    ).toEqual(testVal);
                });
            });

            describe("AuthorityMetadata", () => {
                const key = `authority-metadata-${TEST_CONFIG.MSAL_CLIENT_ID}-${Constants.DEFAULT_AUTHORITY_HOST}`;
                const testObj: AuthorityMetadataEntity = {
                    aliases: [Constants.DEFAULT_AUTHORITY_HOST],
                    preferred_cache: Constants.DEFAULT_AUTHORITY_HOST,
                    preferred_network: Constants.DEFAULT_AUTHORITY_HOST,
                    canonical_authority: Constants.DEFAULT_AUTHORITY_HOST,
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
                        browserSessionStorage.getAuthorityMetadata(
                            key,
                            TEST_CONFIG.CORRELATION_ID
                        )
                    ).toBeNull();
                    expect(
                        browserLocalStorage.getAuthorityMetadata(
                            key,
                            TEST_CONFIG.CORRELATION_ID
                        )
                    ).toBeNull();
                });

                it("getAuthorityMetadata() returns null if isAuthorityMetadataEntity returns false", () => {
                    browserSessionStorage.setAuthorityMetadata(
                        key,
                        {
                            // @ts-ignore
                            invalidKey: "invalidValue",
                        },
                        TEST_CONFIG.CORRELATION_ID
                    );
                    browserLocalStorage.setAuthorityMetadata(
                        key,
                        {
                            // @ts-ignore
                            invalidKey: "invalidValue",
                        },
                        TEST_CONFIG.CORRELATION_ID
                    );
                    expect(
                        browserSessionStorage.getAuthorityMetadata(
                            key,
                            TEST_CONFIG.CORRELATION_ID
                        )
                    ).toBeNull();
                    expect(
                        browserLocalStorage.getAuthorityMetadata(
                            key,
                            TEST_CONFIG.CORRELATION_ID
                        )
                    ).toBeNull();
                    expect(
                        browserLocalStorage.getAuthorityMetadataKeys()
                    ).toEqual(expect.arrayContaining([key]));
                    expect(
                        browserSessionStorage.getAuthorityMetadataKeys()
                    ).toEqual(expect.arrayContaining([key]));
                });

                it("setAuthorityMetadata() and getAuthorityMetadata() sets and returns AuthorityMetadataEntity in-memory", () => {
                    browserSessionStorage.setAuthorityMetadata(
                        key,
                        testObj,
                        TEST_CONFIG.CORRELATION_ID
                    );
                    browserLocalStorage.setAuthorityMetadata(
                        key,
                        testObj,
                        TEST_CONFIG.CORRELATION_ID
                    );

                    expect(
                        browserSessionStorage.getAuthorityMetadata(
                            key,
                            TEST_CONFIG.CORRELATION_ID
                        )
                    ).toEqual(testObj);
                    expect(
                        browserLocalStorage.getAuthorityMetadata(
                            key,
                            TEST_CONFIG.CORRELATION_ID
                        )
                    ).toEqual(testObj);
                    expect(
                        browserLocalStorage.getAuthorityMetadataKeys()
                    ).toEqual(expect.arrayContaining([key]));
                    expect(
                        browserSessionStorage.getAuthorityMetadataKeys()
                    ).toEqual(expect.arrayContaining([key]));
                });

                it("clear() removes AuthorityMetadataEntity from in-memory storage", async () => {
                    browserSessionStorage.setAuthorityMetadata(
                        key,
                        testObj,
                        TEST_CONFIG.CORRELATION_ID
                    );
                    browserLocalStorage.setAuthorityMetadata(
                        key,
                        testObj,
                        TEST_CONFIG.CORRELATION_ID
                    );

                    expect(
                        browserSessionStorage.getAuthorityMetadata(
                            key,
                            TEST_CONFIG.CORRELATION_ID
                        )
                    ).toEqual(testObj);
                    expect(
                        browserLocalStorage.getAuthorityMetadata(
                            key,
                            TEST_CONFIG.CORRELATION_ID
                        )
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
                        browserSessionStorage.getAuthorityMetadata(
                            key,
                            TEST_CONFIG.CORRELATION_ID
                        )
                    ).toBeNull();
                    expect(
                        browserLocalStorage.getAuthorityMetadata(
                            key,
                            TEST_CONFIG.CORRELATION_ID
                        )
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
                        browserSessionStorage.getServerTelemetry(
                            key,
                            TEST_CONFIG.CORRELATION_ID
                        )
                    ).toBeNull();
                    expect(
                        browserLocalStorage.getServerTelemetry(
                            key,
                            TEST_CONFIG.CORRELATION_ID
                        )
                    ).toBeNull();
                });

                it("getThrottlingCache returns null if value is not JSON", () => {
                    const key = "testKey";
                    window.localStorage.setItem(key, "this is not json");
                    window.sessionStorage.setItem(key, "this is not json");

                    expect(
                        browserSessionStorage.getThrottlingCache(
                            key,
                            TEST_CONFIG.CORRELATION_ID
                        )
                    ).toBeNull();
                    expect(
                        browserLocalStorage.getThrottlingCache(
                            key,
                            TEST_CONFIG.CORRELATION_ID
                        )
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
                        browserSessionStorage.getThrottlingCache(
                            key,
                            TEST_CONFIG.CORRELATION_ID
                        )
                    ).toBeNull();
                    expect(
                        browserLocalStorage.getThrottlingCache(
                            key,
                            TEST_CONFIG.CORRELATION_ID
                        )
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
                        browserSessionStorage.getThrottlingCache(
                            testKey,
                            TEST_CONFIG.CORRELATION_ID
                        )
                    ).toEqual(testVal);

                    expect(
                        browserLocalStorage.getThrottlingCache(
                            testKey,
                            TEST_CONFIG.CORRELATION_ID
                        )
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
                            "",
                            500,
                            Constants.AuthenticationScheme.BEARER,
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
                            TEST_CONFIG.CORRELATION_ID,
                            true
                        )
                        .then(() =>
                            cacheManager
                                .saveCacheRecord(
                                    {},
                                    "test-correlation-id",
                                    true,
                                    0,
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
                        cacheManager.getTemporaryCache(
                            requestParamKey,
                            TEST_CONFIG.CORRELATION_ID
                        )
                    ).toBeNull();
                });

                it("throws error when interaction is already in progress without override flag", () => {
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

                    expect(() => {
                        cacheManager.setInteractionInProgress(true);
                    }).toThrow();
                });

                it("allows override when allowOverride flag is true", () => {
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

                    // Set initial interaction
                    cacheManager.setInteractionInProgress(
                        true,
                        INTERACTION_TYPE.SIGNIN
                    );
                    expect(
                        cacheManager.getInteractionInProgress()?.type
                    ).toEqual(INTERACTION_TYPE.SIGNIN);

                    // Override with new interaction type
                    cacheManager.setInteractionInProgress(
                        true,
                        INTERACTION_TYPE.SIGNIN,
                        true
                    );
                    expect(
                        cacheManager.getInteractionInProgress()?.type
                    ).toEqual(INTERACTION_TYPE.SIGNIN);
                    expect(
                        cacheManager.getInteractionInProgress()?.clientId
                    ).toEqual(TEST_CONFIG.MSAL_CLIENT_ID);
                });

                it("calls cancelPendingBridgeResponse when overriding interaction", () => {
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

                    // Mock BrowserUtils
                    const BrowserUtils = require("../../src/utils/BrowserUtils.js");
                    const cancelSpy = jest.spyOn(
                        BrowserUtils,
                        "cancelPendingBridgeResponse"
                    );

                    // Set initial interaction
                    cacheManager.setInteractionInProgress(true);

                    // Override interaction
                    cacheManager.setInteractionInProgress(
                        true,
                        INTERACTION_TYPE.SIGNIN,
                        true
                    );

                    // Verify cancelPendingBridgeResponse was called
                    expect(cancelSpy).toHaveBeenCalledWith(logger, "");

                    cancelSpy.mockRestore();
                });

                it("logs warning when overriding interaction", () => {
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

                    const warningSpy = jest.spyOn(logger, "warning");

                    // Set initial interaction
                    cacheManager.setInteractionInProgress(
                        true,
                        INTERACTION_TYPE.SIGNIN
                    );

                    // Override interaction
                    cacheManager.setInteractionInProgress(
                        true,
                        INTERACTION_TYPE.SIGNIN,
                        true
                    );

                    // Verify warning was logged
                    expect(warningSpy).toHaveBeenCalledWith(
                        expect.stringContaining(
                            "Overriding existing interaction_in_progress"
                        ),
                        ""
                    );

                    warningSpy.mockRestore();
                });
            });
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

            browserStorage.resetRequestCache(TEST_CONFIG.CORRELATION_ID);

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
                authenticationScheme: Constants.AuthenticationScheme.BEARER,
                responseMode: Constants.ResponseMode.FRAGMENT,
                state: TEST_CONFIG.STATE,
                nonce: RANDOM_TEST_GUID,
            };

            browserStorage.cacheAuthorizeRequest(
                tokenRequest,
                TEST_CONFIG.CORRELATION_ID,
                TEST_CONFIG.TEST_VERIFIER
            );

            const [cachedRequest, codeVerifier] =
                browserStorage.getCachedRequest(TEST_CONFIG.CORRELATION_ID);
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

            expect(() =>
                browserStorage.getCachedRequest(TEST_CONFIG.CORRELATION_ID)
            ).toThrow(
                new BrowserAuthError(
                    BrowserAuthErrorCodes.noTokenRequestCacheError,
                    ""
                )
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
                authenticationScheme: Constants.AuthenticationScheme.BEARER,
            };
            const stringifiedRequest = JSON.stringify(tokenRequest);
            browserStorage.setTemporaryCache(
                TemporaryCacheKeys.REQUEST_PARAMS,
                stringifiedRequest.substring(0, stringifiedRequest.length / 2),
                true
            );
            expect(() =>
                browserStorage.getCachedRequest(TEST_CONFIG.CORRELATION_ID)
            ).toThrow(
                new BrowserAuthError(
                    BrowserAuthErrorCodes.unableToParseTokenRequestCacheError,
                    ""
                )
            );
        });
    });
});
