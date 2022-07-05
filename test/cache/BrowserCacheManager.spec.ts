/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import sinon from "sinon";
import { BrowserAuthErrorMessage } from "../../src/error/BrowserAuthError";
import { TEST_CONFIG, TEST_TOKENS, TEST_DATA_CLIENT_INFO, RANDOM_TEST_GUID, TEST_URIS, TEST_STATE_VALUES, DEFAULT_OPENID_CONFIG_RESPONSE } from "../utils/StringConstants";
import { CacheOptions } from "../../src/config/Configuration";
import { Constants, PersistentCacheKeys, CommonAuthorizationCodeRequest as AuthorizationCodeRequest, ProtocolUtils, Logger, LogLevel, AuthenticationScheme, AuthorityMetadataEntity, AccountEntity, Authority, StubbedNetworkModule, IdToken, IdTokenEntity, AccessTokenEntity, RefreshTokenEntity, AppMetadataEntity, ServerTelemetryEntity, ThrottlingEntity, CredentialType, ProtocolMode, AccountInfo, ClientAuthError, AuthError } from "@azure/msal-common";
import { BrowserCacheLocation, InteractionType, TemporaryCacheKeys } from "../../src/utils/BrowserConstants";
import { CryptoOps } from "../../src/crypto/CryptoOps";
import { DatabaseStorage } from "../../src/cache/DatabaseStorage";
import { BrowserCacheManager } from "../../src/cache/BrowserCacheManager";
import { BrowserStateObject } from "../../src/utils/BrowserProtocolUtils";
import { ClientAuthErrorMessage } from "@azure/msal-common";

describe("BrowserCacheManager tests", () => {

    let cacheConfig: Required<CacheOptions>;
    let logger: Logger;
    let browserCrypto: CryptoOps;
    beforeEach(() => {
        cacheConfig = {
            cacheLocation: BrowserCacheLocation.SessionStorage,
            storeAuthStateInCookie: false,
            secureCookies: false
        };
        logger = new Logger({
            loggerCallback: (level: LogLevel, message: string, containsPii: boolean): void => {},
            piiLoggingEnabled: true
        });
        browserCrypto = new CryptoOps(logger);
    });

    afterEach(() => {
        jest.restoreAllMocks();
        sinon.restore();
        window.sessionStorage.clear();
        window.localStorage.clear();
    });

    describe("Constructor", () => {

        it("Falls back to memory storage if cache location string does not match localStorage or sessionStorage",
            () => {
                cacheConfig.cacheLocation = "notALocation";
                const cacheManager = new BrowserCacheManager(TEST_CONFIG.MSAL_CLIENT_ID, cacheConfig, browserCrypto, logger);
                cacheManager.setItem("key", "value");
                expect(window.localStorage.getItem("key")).toBeNull();
                expect(window.sessionStorage.getItem("key")).toBeNull();
                expect(cacheManager.getItem("key")).toBe("value");
            }
        );

        it("Falls back to memory storage if storage is not supported", () => {
            // Test sessionStorage not supported
            // @ts-ignore
            jest.spyOn(window, "sessionStorage", "get").mockReturnValue(null);
            const sessionCache = new BrowserCacheManager(TEST_CONFIG.MSAL_CLIENT_ID, cacheConfig, browserCrypto, logger);
            sessionCache.setItem("key", "value");
            expect(sessionCache.getItem("key")).toBe("value");

            // Test local storage not supported
            // @ts-ignore
            jest.spyOn(window, "localStorage", "get").mockReturnValue(null);
            cacheConfig.cacheLocation = BrowserCacheLocation.LocalStorage;
            const localCache = new BrowserCacheManager(TEST_CONFIG.MSAL_CLIENT_ID, cacheConfig, browserCrypto, logger);
            localCache.setItem("key", "value");
            expect(localCache.getItem("key")).toBe("value");
        });

        it("Creates a BrowserStorage object that implements the ICacheStorage interface",
            () => {
                const browserStorage = new BrowserCacheManager(TEST_CONFIG.MSAL_CLIENT_ID, cacheConfig, browserCrypto, logger);
                expect(browserStorage.setItem).not.toBeNull();
                expect(browserStorage.getItem).not.toBeNull();
                expect(browserStorage.removeItem).not.toBeNull();
                expect(browserStorage.containsKey).not.toBeNull();
                expect(browserStorage.getKeys).not.toBeNull();
                expect(browserStorage.clear).not.toBeNull();
            }
        );

        it("Migrates cache entries from the old cache format", () => {
            const idTokenKey = `${Constants.CACHE_PREFIX}.${PersistentCacheKeys.ID_TOKEN}`;
            const clientInfoKey = `${Constants.CACHE_PREFIX}.${PersistentCacheKeys.CLIENT_INFO}`;
            const errorKey = `${Constants.CACHE_PREFIX}.${PersistentCacheKeys.ERROR}`;
            const errorDescKey = `${Constants.CACHE_PREFIX}.${PersistentCacheKeys.ERROR_DESC}`;
            const errorKeyVal = "error_code";
            const errorDescVal = "error occurred";
            window.sessionStorage.setItem(idTokenKey, TEST_TOKENS.IDTOKEN_V2);
            window.sessionStorage.setItem(clientInfoKey, TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO);
            window.sessionStorage.setItem(errorKey, errorKeyVal);
            window.sessionStorage.setItem(errorDescKey, errorDescVal);

            const browserStorage = new BrowserCacheManager(TEST_CONFIG.MSAL_CLIENT_ID, cacheConfig, browserCrypto, logger);
            expect(window.sessionStorage.getItem(idTokenKey)).toBe(TEST_TOKENS.IDTOKEN_V2);
            expect(window.sessionStorage.getItem(clientInfoKey)).toBe(TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO);
            expect(window.sessionStorage.getItem(errorKey)).toBe(errorKeyVal);
            expect(window.sessionStorage.getItem(errorDescKey)).toBe(errorDescVal);
            expect(browserStorage.getTemporaryCache(PersistentCacheKeys.ID_TOKEN, true)).toBe(TEST_TOKENS.IDTOKEN_V2);
            expect(browserStorage.getTemporaryCache(PersistentCacheKeys.CLIENT_INFO, true)).toBe(TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO);
            expect(browserStorage.getTemporaryCache(PersistentCacheKeys.ERROR, true)).toBe(errorKeyVal);
            expect(browserStorage.getTemporaryCache(PersistentCacheKeys.ERROR_DESC, true)).toBe(errorDescVal);
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
            browserSessionStorage = new BrowserCacheManager(TEST_CONFIG.MSAL_CLIENT_ID, cacheConfig, browserCrypto, logger);
            authority = new Authority(TEST_CONFIG.validAuthority, StubbedNetworkModule, browserSessionStorage, {
                protocolMode: ProtocolMode.AAD,
                authorityMetadata: "",
                cloudDiscoveryMetadata: "",
                knownAuthorities: []
            });
            sinon.stub(Authority.prototype, "getPreferredCache").returns("login.microsoftonline.com");
            cacheConfig.cacheLocation = BrowserCacheLocation.LocalStorage;
            browserLocalStorage = new BrowserCacheManager(TEST_CONFIG.MSAL_CLIENT_ID, cacheConfig, browserCrypto, logger);
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

        it(
            "getTemporaryCache falls back to local storage if not found in session/memory storage",
            () => {
                const testTempItemKey = "test-temp-item-key";
                const testTempItemValue = "test-temp-item-value";
                window.localStorage.setItem(testTempItemKey, testTempItemValue);
                cacheConfig.cacheLocation = BrowserCacheLocation.LocalStorage;
                browserLocalStorage = new BrowserCacheManager(TEST_CONFIG.MSAL_CLIENT_ID, cacheConfig, browserCrypto, logger);
                expect(browserLocalStorage.getTemporaryCache(testTempItemKey)).toBe(testTempItemValue);
            }
        )

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
            expect(browserLocalStorage.getTemporaryCache("cacheKey", true)).toBeNull();
            expect(browserSessionStorage.getTemporaryCache("cacheKey", true)).toBeNull();
        });

        it("containsKey()", () => {
            browserSessionStorage.setTemporaryCache("cacheKey", cacheVal, true);
            browserLocalStorage.setItem(msalCacheKey, cacheVal);
            expect(browserSessionStorage.containsKey(msalCacheKey)).toBe(true);
            expect(browserLocalStorage.containsKey(msalCacheKey)).toBe(true);
        });

        it("getKeys()", () => {
            browserLocalStorage.setItem(msalCacheKey, cacheVal);
            browserLocalStorage.setItem(msalCacheKey2, cacheVal);
            expect(browserLocalStorage.getKeys()).toEqual([msalCacheKey, msalCacheKey2]);
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
                        homeAccountId: "home-accountId"
                    };

                    browserLocalStorage.setItem(key, JSON.stringify(partialAccount));
                    browserSessionStorage.setItem(key, JSON.stringify(partialAccount));

                    expect(browserSessionStorage.getAccount(key)).toBeNull();
                    expect(browserLocalStorage.getAccount(key)).toBeNull();
                });

                it("getAccount returns AccountEntity", () => {
                    const testAccount = AccountEntity.createAccount(TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO, "homeAccountId", new IdToken(TEST_TOKENS.IDTOKEN_V2, browserCrypto), authority, "oboAssertion", "cloudGraphHost", "msGraphHost");

                    browserLocalStorage.setAccount(testAccount);
                    browserSessionStorage.setAccount(testAccount);

                    expect(browserSessionStorage.getAccount(testAccount.generateAccountKey())).toEqual(testAccount);
                    expect(browserSessionStorage.getAccount(testAccount.generateAccountKey())).toBeInstanceOf(AccountEntity);
                    expect(browserLocalStorage.getAccount(testAccount.generateAccountKey())).toEqual(testAccount);
                    expect(browserLocalStorage.getAccount(testAccount.generateAccountKey())).toBeInstanceOf(AccountEntity);
                });
            });

            describe("IdTokenCredential", () => {
                it("getIdTokenCredential returns null if key not in cache", () => {
                    const key = "not-in-cache";
                    expect(browserSessionStorage.getIdTokenCredential(key)).toBeNull();
                    expect(browserLocalStorage.getIdTokenCredential(key)).toBeNull();
                });

                it("getIdTokenCredential returns null if value is not JSON", () => {
                    const key = "testKey";
                    browserLocalStorage.setItem(key, "this is not json");
                    browserSessionStorage.setItem(key, "this is not json");

                    expect(browserSessionStorage.getIdTokenCredential(key)).toBeNull();
                    expect(browserLocalStorage.getIdTokenCredential(key)).toBeNull();
                });

                it(
                    "getIdTokenCredential returns null if value is not idToken entity",
                    () => {
                        const key = "testKey";
                        const partialIdTokenEntity = {
                            homeAccountId: "home-accountId"
                        };

                        browserLocalStorage.setItem(key, JSON.stringify(partialIdTokenEntity));
                        browserSessionStorage.setItem(key, JSON.stringify(partialIdTokenEntity));

                        expect(browserSessionStorage.getIdTokenCredential(key)).toBeNull();
                        expect(browserLocalStorage.getIdTokenCredential(key)).toBeNull();
                    }
                );

                it("getIdTokenCredential returns IdTokenEntity", () => {
                    const testIdToken = IdTokenEntity.createIdTokenEntity("homeAccountId", "environment", TEST_TOKENS.IDTOKEN_V2, "client-id", "tenantId");

                    browserLocalStorage.setIdTokenCredential(testIdToken);
                    browserSessionStorage.setIdTokenCredential(testIdToken);

                    expect(browserSessionStorage.getIdTokenCredential(testIdToken.generateCredentialKey())).toEqual(testIdToken);
                    expect(browserSessionStorage.getIdTokenCredential(testIdToken.generateCredentialKey())).toBeInstanceOf(IdTokenEntity);
                    expect(browserLocalStorage.getIdTokenCredential(testIdToken.generateCredentialKey())).toEqual(testIdToken);
                    expect(browserLocalStorage.getIdTokenCredential(testIdToken.generateCredentialKey())).toBeInstanceOf(IdTokenEntity);
                });
            });

            describe("AccessTokenCredential", () => {
                it("getAccessTokenCredential returns null if key not in cache", () => {
                    const key = "not-in-cache";
                    expect(browserSessionStorage.getAccessTokenCredential(key)).toBeNull();
                    expect(browserLocalStorage.getAccessTokenCredential(key)).toBeNull();
                });

                it("getAccessTokenCredential returns null if value is not JSON", () => {
                    const key = "testKey";
                    browserLocalStorage.setItem(key, "this is not json");
                    browserSessionStorage.setItem(key, "this is not json");

                    expect(browserSessionStorage.getAccessTokenCredential(key)).toBeNull();
                    expect(browserLocalStorage.getAccessTokenCredential(key)).toBeNull();
                });

                it(
                    "getAccessTokenCredential returns null if value is not accessToken entity",
                    () => {
                        const key = "testKey";
                        const partialAccessTokenEntity = {
                            homeAccountId: "home-accountId"
                        };

                        browserLocalStorage.setItem(key, JSON.stringify(partialAccessTokenEntity));
                        browserSessionStorage.setItem(key, JSON.stringify(partialAccessTokenEntity));

                        expect(browserSessionStorage.getAccessTokenCredential(key)).toBeNull();
                        expect(browserLocalStorage.getAccessTokenCredential(key)).toBeNull();
                    }
                );

                it("getAccessTokenCredential returns AccessTokenEntity", () => {
                    const testAccessToken = AccessTokenEntity.createAccessTokenEntity("homeAccountId", "environment", TEST_TOKENS.ACCESS_TOKEN, "client-id", "tenantId", "openid", 1000, 1000, browserCrypto, 500, AuthenticationScheme.BEARER, "oboAssertion");

                    browserLocalStorage.setAccessTokenCredential(testAccessToken);
                    browserSessionStorage.setAccessTokenCredential(testAccessToken);

                    expect(browserSessionStorage.getAccessTokenCredential(testAccessToken.generateCredentialKey())).toEqual(testAccessToken);
                    expect(browserSessionStorage.getAccessTokenCredential(testAccessToken.generateCredentialKey())).toBeInstanceOf(AccessTokenEntity);
                    expect(browserLocalStorage.getAccessTokenCredential(testAccessToken.generateCredentialKey())).toEqual(testAccessToken);
                    expect(browserLocalStorage.getAccessTokenCredential(testAccessToken.generateCredentialKey())).toBeInstanceOf(AccessTokenEntity);
                });
                
                it(
                    "getAccessTokenCredential returns Bearer access token when authentication scheme is set to Bearer and both a Bearer and pop token are in the cache",
                    () => {
                        const testAccessTokenWithoutAuthScheme = AccessTokenEntity.createAccessTokenEntity("homeAccountId", "environment", TEST_TOKENS.ACCESS_TOKEN, "client-id", "tenantId", "openid", 1000, 1000, browserCrypto, 500, AuthenticationScheme.BEARER, "oboAssertion");
                        const testAccessTokenWithAuthScheme = AccessTokenEntity.createAccessTokenEntity("homeAccountId", "environment", TEST_TOKENS.POP_TOKEN, "client-id", "tenantId", "openid", 1000, 1000, browserCrypto, 500, AuthenticationScheme.POP, "oboAssertion");
                        // Cache bearer token
                        browserLocalStorage.setAccessTokenCredential(testAccessTokenWithoutAuthScheme);
                        browserSessionStorage.setAccessTokenCredential(testAccessTokenWithoutAuthScheme);

                        // Cache pop token
                        browserLocalStorage.setAccessTokenCredential(testAccessTokenWithAuthScheme);
                        browserSessionStorage.setAccessTokenCredential(testAccessTokenWithAuthScheme);

                        expect(browserSessionStorage.getAccessTokenCredential(testAccessTokenWithoutAuthScheme.generateCredentialKey())).toEqual(testAccessTokenWithoutAuthScheme);
                        expect(browserSessionStorage.getAccessTokenCredential(testAccessTokenWithoutAuthScheme.generateCredentialKey())?.credentialType).toBe(CredentialType.ACCESS_TOKEN);
                        expect(browserSessionStorage.getAccessTokenCredential(testAccessTokenWithoutAuthScheme.generateCredentialKey())).toBeInstanceOf(AccessTokenEntity);
                        expect(browserLocalStorage.getAccessTokenCredential(testAccessTokenWithoutAuthScheme.generateCredentialKey())).toEqual(testAccessTokenWithoutAuthScheme);
                        expect(browserLocalStorage.getAccessTokenCredential(testAccessTokenWithoutAuthScheme.generateCredentialKey())?.credentialType).toBe(CredentialType.ACCESS_TOKEN);
                        expect(browserLocalStorage.getAccessTokenCredential(testAccessTokenWithoutAuthScheme.generateCredentialKey())).toBeInstanceOf(AccessTokenEntity);
                    }
                );

                it(
                    "getAccessTokenCredential returns PoP access token when authentication scheme is set to pop and both a Bearer and pop token are in the cache",
                    () => {
                        const testAccessTokenWithoutAuthScheme = AccessTokenEntity.createAccessTokenEntity("homeAccountId", "environment", TEST_TOKENS.ACCESS_TOKEN, "client-id", "tenantId", "openid", 1000, 1000, browserCrypto, 500, AuthenticationScheme.BEARER, "oboAssertion");
                        const testAccessTokenWithAuthScheme = AccessTokenEntity.createAccessTokenEntity("homeAccountId", "environment", TEST_TOKENS.POP_TOKEN, "client-id", "tenantId", "openid", 1000, 1000, browserCrypto, 500, AuthenticationScheme.POP, "oboAssertion");
                        // Cache bearer token
                        browserLocalStorage.setAccessTokenCredential(testAccessTokenWithoutAuthScheme);
                        browserSessionStorage.setAccessTokenCredential(testAccessTokenWithoutAuthScheme);

                        // Cache pop token
                        browserLocalStorage.setAccessTokenCredential(testAccessTokenWithAuthScheme);
                        browserSessionStorage.setAccessTokenCredential(testAccessTokenWithAuthScheme);

                        expect(browserSessionStorage.getAccessTokenCredential(testAccessTokenWithAuthScheme.generateCredentialKey())).toEqual(testAccessTokenWithAuthScheme);
                        expect(browserSessionStorage.getAccessTokenCredential(testAccessTokenWithAuthScheme.generateCredentialKey())?.credentialType).toBe(CredentialType.ACCESS_TOKEN_WITH_AUTH_SCHEME);
                        expect(browserSessionStorage.getAccessTokenCredential(testAccessTokenWithAuthScheme.generateCredentialKey())).toBeInstanceOf(AccessTokenEntity);
                        expect(browserLocalStorage.getAccessTokenCredential(testAccessTokenWithAuthScheme.generateCredentialKey())).toEqual(testAccessTokenWithAuthScheme);
                        expect(browserLocalStorage.getAccessTokenCredential(testAccessTokenWithAuthScheme.generateCredentialKey())?.credentialType).toBe(CredentialType.ACCESS_TOKEN_WITH_AUTH_SCHEME);
                        expect(browserLocalStorage.getAccessTokenCredential(testAccessTokenWithAuthScheme.generateCredentialKey())).toBeInstanceOf(AccessTokenEntity);
                    }
                )
            });

            describe("RefreshTokenCredential", () => {
                it("getRefreshTokenCredential returns null if key not in cache", () => {
                    const key = "not-in-cache";
                    expect(browserSessionStorage.getRefreshTokenCredential(key)).toBeNull();
                    expect(browserLocalStorage.getRefreshTokenCredential(key)).toBeNull();
                });

                it("getRefreshTokenCredential returns null if value is not JSON", () => {
                    const key = "testKey";
                    browserLocalStorage.setItem(key, "this is not json");
                    browserSessionStorage.setItem(key, "this is not json");

                    expect(browserSessionStorage.getRefreshTokenCredential(key)).toBeNull();
                    expect(browserLocalStorage.getRefreshTokenCredential(key)).toBeNull();
                });

                it(
                    "getRefreshTokenCredential returns null if value is not refreshToken entity",
                    () => {
                        const key = "testKey";
                        const partialRefreshTokenEntity = {
                            homeAccountId: "home-accountId"
                        };

                        browserLocalStorage.setItem(key, JSON.stringify(partialRefreshTokenEntity));
                        browserSessionStorage.setItem(key, JSON.stringify(partialRefreshTokenEntity));

                        expect(browserSessionStorage.getRefreshTokenCredential(key)).toBeNull();
                        expect(browserLocalStorage.getRefreshTokenCredential(key)).toBeNull();
                    }
                );

                it("getRefreshTokenCredential returns RefreshTokenEntity", () => {
                    const testRefreshToken = RefreshTokenEntity.createRefreshTokenEntity("homeAccountId", "environment", TEST_TOKENS.REFRESH_TOKEN, "client-id", "familyId", "oboAssertion");

                    browserLocalStorage.setRefreshTokenCredential(testRefreshToken);
                    browserSessionStorage.setRefreshTokenCredential(testRefreshToken);

                    expect(browserSessionStorage.getRefreshTokenCredential(testRefreshToken.generateCredentialKey())).toEqual(testRefreshToken);
                    expect(browserSessionStorage.getRefreshTokenCredential(testRefreshToken.generateCredentialKey())).toBeInstanceOf(RefreshTokenEntity);
                    expect(browserLocalStorage.getRefreshTokenCredential(testRefreshToken.generateCredentialKey())).toEqual(testRefreshToken);
                    expect(browserLocalStorage.getRefreshTokenCredential(testRefreshToken.generateCredentialKey())).toBeInstanceOf(RefreshTokenEntity);
                });
            });

            describe("AppMetadata", () => {
                it("getAppMetadata returns null if key not in cache", () => {
                    const key = "not-in-cache";
                    expect(browserSessionStorage.getAppMetadata(key)).toBeNull();
                    expect(browserLocalStorage.getAppMetadata(key)).toBeNull();
                });

                it("getAppMetadata returns null if value is not JSON", () => {
                    const key = "testKey";
                    browserLocalStorage.setItem(key, "this is not json");
                    browserSessionStorage.setItem(key, "this is not json");

                    expect(browserSessionStorage.getAppMetadata(key)).toBeNull();
                    expect(browserLocalStorage.getAppMetadata(key)).toBeNull();
                });

                it("getAppMetadata returns null if value is not appMetadata entity", () => {
                    const key = "testKey";
                    const partialAppMetadataEntity = {
                        environment: "environment"
                    };

                    browserLocalStorage.setItem(key, JSON.stringify(partialAppMetadataEntity));
                    browserSessionStorage.setItem(key, JSON.stringify(partialAppMetadataEntity));

                    expect(browserSessionStorage.getAppMetadata(key)).toBeNull();
                    expect(browserLocalStorage.getAppMetadata(key)).toBeNull();
                });

                it("getAppMetadata returns AppMetadataEntity", () => {
                    const testAppMetadata = AppMetadataEntity.createAppMetadataEntity("clientId", "environment", "familyid");

                    browserLocalStorage.setAppMetadata(testAppMetadata);
                    browserSessionStorage.setAppMetadata(testAppMetadata);

                    expect(browserSessionStorage.getAppMetadata(testAppMetadata.generateAppMetadataKey())).toEqual(testAppMetadata);
                    expect(browserSessionStorage.getAppMetadata(testAppMetadata.generateAppMetadataKey())).toBeInstanceOf(AppMetadataEntity);
                    expect(browserLocalStorage.getAppMetadata(testAppMetadata.generateAppMetadataKey())).toEqual(testAppMetadata);
                    expect(browserLocalStorage.getAppMetadata(testAppMetadata.generateAppMetadataKey())).toBeInstanceOf(AppMetadataEntity);
                });
            });

            describe("ServerTelemetry", () => {
                it("getServerTelemetry returns null if key not in cache", () => {
                    const key = "not-in-cache";
                    expect(browserSessionStorage.getServerTelemetry(key)).toBeNull();
                    expect(browserLocalStorage.getServerTelemetry(key)).toBeNull();
                });

                it("getServerTelemetry returns null if value is not JSON", () => {
                    const key = "testKey";
                    browserLocalStorage.setItem(key, "this is not json");
                    browserSessionStorage.setItem(key, "this is not json");

                    expect(browserSessionStorage.getServerTelemetry(key)).toBeNull();
                    expect(browserLocalStorage.getServerTelemetry(key)).toBeNull();
                });

                it(
                    "getServerTelemetry returns null if value is not serverTelemetry entity",
                    () => {
                        const key = "testKey";
                        const partialServerTelemetryEntity = {
                            apiId: 0
                        };

                        browserLocalStorage.setItem(key, JSON.stringify(partialServerTelemetryEntity));
                        browserSessionStorage.setItem(key, JSON.stringify(partialServerTelemetryEntity));

                        expect(browserSessionStorage.getServerTelemetry(key)).toBeNull();
                        expect(browserLocalStorage.getServerTelemetry(key)).toBeNull();
                    }
                );

                it("getServerTelemetry returns ServerTelemetryEntity", () => {
                    const testKey = "server-telemetry-clientId";
                    const testVal = new ServerTelemetryEntity();

                    browserLocalStorage.setServerTelemetry(testKey, testVal);
                    browserSessionStorage.setServerTelemetry(testKey, testVal);

                    expect(browserSessionStorage.getServerTelemetry(testKey)).toEqual(testVal);
                    expect(browserSessionStorage.getServerTelemetry(testKey)).toBeInstanceOf(ServerTelemetryEntity);
                    expect(browserLocalStorage.getServerTelemetry(testKey)).toEqual(testVal);
                    expect(browserLocalStorage.getServerTelemetry(testKey)).toBeInstanceOf(ServerTelemetryEntity);
                });
            });

            describe("AuthorityMetadata", () =>{
                const key = `authority-metadata-${TEST_CONFIG.MSAL_CLIENT_ID}-${Constants.DEFAULT_AUTHORITY_HOST}`;
                const testObj: AuthorityMetadataEntity = new AuthorityMetadataEntity();
                testObj.aliases = [Constants.DEFAULT_AUTHORITY_HOST];
                testObj.preferred_cache = Constants.DEFAULT_AUTHORITY_HOST;
                testObj.preferred_network = Constants.DEFAULT_AUTHORITY_HOST;
                testObj.canonical_authority = Constants.DEFAULT_AUTHORITY;
                testObj.authorization_endpoint = DEFAULT_OPENID_CONFIG_RESPONSE.body.authorization_endpoint;
                testObj.token_endpoint = DEFAULT_OPENID_CONFIG_RESPONSE.body.token_endpoint;
                testObj.end_session_endpoint = DEFAULT_OPENID_CONFIG_RESPONSE.body.end_session_endpoint;
                testObj.issuer = DEFAULT_OPENID_CONFIG_RESPONSE.body.issuer;
                testObj.jwks_uri = DEFAULT_OPENID_CONFIG_RESPONSE.body.jwks_uri;
                testObj.aliasesFromNetwork = false;
                testObj.endpointsFromNetwork = false;

                it("getAuthorityMetadata() returns null if key is not in cache", () => {
                    expect(browserSessionStorage.getAuthorityMetadata(key)).toBeNull();
                    expect(browserLocalStorage.getAuthorityMetadata(key)).toBeNull();
                });

                it(
                    "getAuthorityMetadata() returns null if isAuthorityMetadataEntity returns false",
                    () => {
                        sinon.stub(AuthorityMetadataEntity, "isAuthorityMetadataEntity").returns(false);
                        browserSessionStorage.setAuthorityMetadata(key, testObj);
                        browserLocalStorage.setAuthorityMetadata(key, testObj);

                        expect(browserSessionStorage.getAuthorityMetadata(key)).toBeNull();
                        expect(browserLocalStorage.getAuthorityMetadata(key)).toBeNull();
                        expect(browserSessionStorage.containsKey(key)).toBe(false);
                        expect(browserLocalStorage.containsKey(key)).toBe(false);
                        expect(browserLocalStorage.getAuthorityMetadataKeys()).toEqual(expect.arrayContaining([key]));
                        expect(browserSessionStorage.getAuthorityMetadataKeys()).toEqual(expect.arrayContaining([key]));
                    }
                );

                it(
                    "setAuthorityMetadata() and getAuthorityMetadata() sets and returns AuthorityMetadataEntity in-memory",
                    () => {
                        browserSessionStorage.setAuthorityMetadata(key, testObj);
                        browserLocalStorage.setAuthorityMetadata(key, testObj);

                        expect(browserSessionStorage.getAuthorityMetadata(key)).toEqual(testObj);
                        expect(browserLocalStorage.getAuthorityMetadata(key)).toEqual(testObj);
                        expect(browserSessionStorage.containsKey(key)).toBe(false);
                        expect(browserLocalStorage.containsKey(key)).toBe(false);
                        expect(browserLocalStorage.getAuthorityMetadataKeys()).toEqual(expect.arrayContaining([key]));
                        expect(browserSessionStorage.getAuthorityMetadataKeys()).toEqual(expect.arrayContaining([key]));
                    }
                );

                it("clear() removes AuthorityMetadataEntity from in-memory storage", async () => {
                    browserSessionStorage.setAuthorityMetadata(key, testObj);
                    browserLocalStorage.setAuthorityMetadata(key, testObj);

                    expect(browserSessionStorage.getAuthorityMetadata(key)).toEqual(testObj);
                    expect(browserLocalStorage.getAuthorityMetadata(key)).toEqual(testObj);
                    expect(browserLocalStorage.getAuthorityMetadataKeys()).toEqual(expect.arrayContaining([key]));
                    expect(browserSessionStorage.getAuthorityMetadataKeys()).toEqual(expect.arrayContaining([key]));

                    await  browserSessionStorage.clear();
                    await browserLocalStorage.clear();
                    expect(browserSessionStorage.getAuthorityMetadata(key)).toBeNull();
                    expect(browserLocalStorage.getAuthorityMetadata(key)).toBeNull();
                    expect(browserLocalStorage.getAuthorityMetadataKeys().length).toBe(0);
                    expect(browserSessionStorage.getAuthorityMetadataKeys().length).toBe(0);
                });
            });

            describe("ThrottlingCache", () => {
                it("getThrottlingCache returns null if key not in cache", () => {
                    const key = "not-in-cache";
                    expect(browserSessionStorage.getServerTelemetry(key)).toBeNull();
                    expect(browserLocalStorage.getServerTelemetry(key)).toBeNull();
                });

                it("getThrottlingCache returns null if value is not JSON", () => {
                    const key = "testKey";
                    browserLocalStorage.setItem(key, "this is not json");
                    browserSessionStorage.setItem(key, "this is not json");

                    expect(browserSessionStorage.getThrottlingCache(key)).toBeNull();
                    expect(browserLocalStorage.getThrottlingCache(key)).toBeNull();
                });

                it(
                    "getThrottlingCache returns null if value is not throttling entity",
                    () => {
                        const key = "testKey";
                        const partialThrottlingEntity = {
                            error: "error"
                        };

                        browserLocalStorage.setItem(key, JSON.stringify(partialThrottlingEntity));
                        browserSessionStorage.setItem(key, JSON.stringify(partialThrottlingEntity));

                        expect(browserSessionStorage.getThrottlingCache(key)).toBeNull();
                        expect(browserLocalStorage.getThrottlingCache(key)).toBeNull();
                    }
                );

                it("getThrottlingCache returns ThrottlingEntity", () => {
                    const testKey = "throttling";
                    const testVal = new ThrottlingEntity();
                    testVal.throttleTime = 60;

                    browserLocalStorage.setThrottlingCache(testKey, testVal);
                    browserSessionStorage.setThrottlingCache(testKey, testVal);

                    expect(browserSessionStorage.getThrottlingCache(testKey)).toEqual(testVal);
                    expect(browserSessionStorage.getThrottlingCache(testKey)).toBeInstanceOf(ThrottlingEntity);
                    expect(browserLocalStorage.getThrottlingCache(testKey)).toEqual(testVal);
                    expect(browserLocalStorage.getThrottlingCache(testKey)).toBeInstanceOf(ThrottlingEntity);
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
            browserSessionStorage = new BrowserCacheManager(TEST_CONFIG.MSAL_CLIENT_ID, cacheConfig, browserCrypto, logger);
            cacheConfig.cacheLocation = BrowserCacheLocation.LocalStorage;
            browserLocalStorage = new BrowserCacheManager(TEST_CONFIG.MSAL_CLIENT_ID, cacheConfig, browserCrypto, logger);
            cacheConfig.cacheLocation = BrowserCacheLocation.MemoryStorage;
            browserMemoryStorage = new BrowserCacheManager(TEST_CONFIG.MSAL_CLIENT_ID, cacheConfig, browserCrypto, logger);
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
            expect(browserMemoryStorage.getTemporaryCache(msalCacheKey)).toBe(cacheVal);
            expect(document.cookie).toBe(`${msalCacheKey}=${cacheVal}`);
            browserMemoryStorage.clearItemCookie(msalCacheKey);
        });

        it("getTempCache()", () => {
            const getCookieSpy = sinon.spy(BrowserCacheManager.prototype, "getItemCookie");
            // sessionStorage
            window.sessionStorage.setItem(msalCacheKey, cacheVal);
            browserSessionStorage.setItemCookie(msalCacheKey, cacheVal);
            expect(browserSessionStorage.getTemporaryCache("cacheKey", true)).toBe(cacheVal);
            expect(getCookieSpy.returned(cacheVal)).toBe(true);
            expect(getCookieSpy.calledOnce).toBe(true);
            // localStorage
            window.localStorage.setItem(msalCacheKey, cacheVal);
            browserLocalStorage.setItemCookie(msalCacheKey, cacheVal);
            expect(browserLocalStorage.getTemporaryCache("cacheKey", true)).toBe(cacheVal);
            expect(getCookieSpy.returned(cacheVal)).toBe(true);
            expect(getCookieSpy.calledTwice).toBe(true);
            // browser memory
            browserMemoryStorage.setItem(msalCacheKey, cacheVal);
            expect(browserMemoryStorage.getTemporaryCache("cacheKey", true)).toBe(cacheVal);
            expect(getCookieSpy.returned(cacheVal)).toBe(true);
            expect(getCookieSpy.calledThrice).toBe(true);
        });

        it("removeItem()", () => {
            const clearCookieSpy = sinon.spy(BrowserCacheManager.prototype, "clearItemCookie");
            // sessionStorage
            browserSessionStorage.setTemporaryCache("cacheKey", cacheVal, true);
            browserSessionStorage.removeItem(msalCacheKey);
            expect(window.sessionStorage.getItem(msalCacheKey)).toBeNull();
            expect(document.cookie).toHaveLength(0);
            expect(clearCookieSpy.calledOnce).toBe(true);
            // localStorage
            browserLocalStorage.setTemporaryCache("cacheKey", cacheVal, true);
            browserLocalStorage.removeItem(msalCacheKey);
            expect(window.localStorage.getItem(msalCacheKey)).toBeNull();
            expect(document.cookie).toHaveLength(0);
            expect(clearCookieSpy.calledTwice).toBe(true);
            // browser memory
            browserMemoryStorage.setTemporaryCache("cacheKey", cacheVal, true);
            browserMemoryStorage.removeItem(msalCacheKey);
            expect(browserMemoryStorage.getItem(msalCacheKey)).toBeNull();
            expect(document.cookie).toHaveLength(0);
            expect(clearCookieSpy.calledThrice).toBe(true);
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
            expect(document.cookie).toBe(`${encodeURIComponent(msalCacheKey)}=${cacheVal}`);
            browserSessionStorage.clearItemCookie(msalCacheKey);
            // localStorage
            browserLocalStorage.setTemporaryCache(msalCacheKey, cacheVal);
            expect(window.sessionStorage.getItem(msalCacheKey)).toBe(cacheVal);
            expect(document.cookie).toBe(`${encodeURIComponent(msalCacheKey)}=${cacheVal}`);
            browserLocalStorage.clearItemCookie(msalCacheKey);
            // browser memory
            browserMemoryStorage.setTemporaryCache(msalCacheKey, cacheVal);
            expect(browserMemoryStorage.getTemporaryCache(msalCacheKey)).toBe(cacheVal);
            expect(document.cookie).toBe(`${encodeURIComponent(msalCacheKey)}=${cacheVal}`);
            browserMemoryStorage.clearItemCookie(msalCacheKey);
        });

        it("getTempCache() with item that contains ==", () => {
            msalCacheKey = `${Constants.CACHE_PREFIX}.${TEST_STATE_VALUES.ENCODED_LIB_STATE}`;
            const getCookieSpy = sinon.spy(BrowserCacheManager.prototype, "getItemCookie");
            // sessionStorage
            browserSessionStorage.setItem(msalCacheKey, cacheVal);
            browserSessionStorage.setItemCookie(msalCacheKey, cacheVal);
            expect(browserSessionStorage.getTemporaryCache(msalCacheKey)).toBe(cacheVal);
            expect(getCookieSpy.returned(cacheVal)).toBe(true);
            expect(getCookieSpy.calledOnce).toBe(true);
            // localStorage
            browserLocalStorage.setItem(msalCacheKey, cacheVal);
            browserLocalStorage.setItemCookie(msalCacheKey, cacheVal);
            expect(browserLocalStorage.getTemporaryCache(msalCacheKey)).toBe(cacheVal);
            expect(getCookieSpy.returned(cacheVal)).toBe(true);
            expect(getCookieSpy.calledTwice).toBe(true);
            // browser memory
            browserMemoryStorage.setItem(msalCacheKey, cacheVal);
            expect(browserLocalStorage.getTemporaryCache(msalCacheKey)).toBe(cacheVal);
            expect(getCookieSpy.returned(cacheVal)).toBe(true);
            expect(getCookieSpy.calledThrice).toBe(true);
        });

        it("removeItem() with item that contains ==", () => {
            msalCacheKey = `${Constants.CACHE_PREFIX}.${TEST_STATE_VALUES.ENCODED_LIB_STATE}`;
            const clearCookieSpy = sinon.spy(BrowserCacheManager.prototype, "clearItemCookie");
            // sessionStorage
            browserSessionStorage.setTemporaryCache(msalCacheKey, cacheVal);
            browserSessionStorage.removeItem(msalCacheKey);
            expect(window.sessionStorage.getItem(msalCacheKey)).toBeNull();
            expect(document.cookie).toHaveLength(0);
            expect(clearCookieSpy.calledOnce).toBe(true);
            // localStorage
            browserLocalStorage.setItem(msalCacheKey, cacheVal);
            browserLocalStorage.removeItem(msalCacheKey);
            expect(window.sessionStorage.getItem(msalCacheKey)).toBeNull();
            expect(document.cookie).toHaveLength(0);
            expect(clearCookieSpy.calledTwice).toBe(true);
            // browser memory
            browserMemoryStorage.setTemporaryCache(msalCacheKey, cacheVal);
            browserMemoryStorage.removeItem(msalCacheKey);
            expect(browserMemoryStorage.getItem(msalCacheKey)).toBeNull();
            expect(document.cookie).toHaveLength(0);
            expect(clearCookieSpy.calledThrice).toBe(true);
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
            browserSessionStorage = new BrowserCacheManager(TEST_CONFIG.MSAL_CLIENT_ID, cacheConfig, browserCrypto, logger);
            cacheConfig.cacheLocation = BrowserCacheLocation.LocalStorage;
            browserLocalStorage = new BrowserCacheManager(TEST_CONFIG.MSAL_CLIENT_ID, cacheConfig, browserCrypto, logger);
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
            expect(browserSessionStorage.getItemCookie(msalCacheKey)).toBe(cacheVal);
            expect(browserLocalStorage.getItemCookie(msalCacheKey)).toBe(cacheVal);
        });

        it("clearMsalCookie()", () => {
            browserSessionStorage.setItemCookie(msalCacheKey, cacheVal);
            expect(document.cookie).not.toHaveLength(0);
            browserSessionStorage.clearMsalCookies();
            expect(document.cookie).toHaveLength(0);
            
            const testCookieKey = "cookie"
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
            sinon.stub(Date.prototype, "getTime").returns(currentTime);
            const cookieLifeDays = 1;
            const expectedDate = new Date(currentTime + (cookieLifeDays * COOKIE_LIFE_MULTIPLIER));
            expect(browserLocalStorage.getCookieExpirationTime(cookieLifeDays)).toBe(expectedDate.toUTCString());
        });
    });

    describe("Helpers", () => {

        it(
            "generateAuthorityKey() creates a valid cache key for authority strings",
            () => {
                const browserStorage = new BrowserCacheManager(TEST_CONFIG.MSAL_CLIENT_ID, cacheConfig, browserCrypto, logger);
                const authorityKey = browserStorage.generateAuthorityKey(TEST_STATE_VALUES.TEST_STATE_REDIRECT);
                expect(authorityKey).toBe(
                    `${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.AUTHORITY}.${RANDOM_TEST_GUID}`
                );
            }
        );

        it("generateNonceKey() create a valid cache key for nonce strings", () => {
            const browserStorage = new BrowserCacheManager(TEST_CONFIG.MSAL_CLIENT_ID, cacheConfig, browserCrypto, logger);
            const nonceKey = browserStorage.generateNonceKey(TEST_STATE_VALUES.TEST_STATE_REDIRECT);
            expect(nonceKey).toBe(
                `${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.NONCE_IDTOKEN}.${RANDOM_TEST_GUID}`
            );
        });

        it(
            "updateCacheEntries() correctly updates the authority, state and nonce in the cache",
            () => {
                const browserStorage = new BrowserCacheManager(TEST_CONFIG.MSAL_CLIENT_ID, cacheConfig, browserCrypto, logger);
                const testNonce = "testNonce";
                const stateString = TEST_STATE_VALUES.TEST_STATE_REDIRECT;
                ProtocolUtils.parseRequestState(browserCrypto, stateString).libraryState.id;
                browserStorage.updateCacheEntries(stateString, testNonce, `${Constants.DEFAULT_AUTHORITY}/`, "", null);

                const stateKey = browserStorage.generateStateKey(stateString);
                const nonceKey = browserStorage.generateNonceKey(stateString);
                const authorityKey = browserStorage.generateAuthorityKey(stateString);

                expect(window.sessionStorage[`${stateKey}`]).toBe(stateString);
                expect(window.sessionStorage[`${nonceKey}`]).toBe(testNonce);
                expect(window.sessionStorage[`${authorityKey}`]).toBe(`${Constants.DEFAULT_AUTHORITY}/`);
            }
        );

        it(
            "resetTempCacheItems() resets all temporary cache items with the given state",
            () => {
                const stateString = TEST_STATE_VALUES.TEST_STATE_REDIRECT;
                const browserStorage = new BrowserCacheManager(TEST_CONFIG.MSAL_CLIENT_ID, cacheConfig, browserCrypto, logger);
                browserStorage.updateCacheEntries(stateString, "nonce", `${TEST_URIS.DEFAULT_INSTANCE}/`, "", null);
                browserStorage.setItem(TemporaryCacheKeys.REQUEST_PARAMS, "TestRequestParams");
                browserStorage.setItem(TemporaryCacheKeys.ORIGIN_URI, TEST_URIS.TEST_REDIR_URI);

                browserStorage.resetRequestCache(stateString);
                const nonceKey = browserStorage.generateNonceKey(stateString);
                const authorityKey = browserStorage.generateAuthorityKey(stateString);
                expect(window.sessionStorage[`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${nonceKey}`]).toBeUndefined();
                expect(window.sessionStorage[`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${authorityKey}`]).toBeUndefined();
                expect(window.sessionStorage[`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.REQUEST_STATE}`]).toBeUndefined();
                expect(window.sessionStorage[`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.REQUEST_PARAMS}`]).toBeUndefined();
                expect(window.sessionStorage[`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.ORIGIN_URI}`]).toBeUndefined();
            }
        );

        it("Successfully retrieves and decodes response from cache", async () => {
            const browserStorage = new BrowserCacheManager(TEST_CONFIG.MSAL_CLIENT_ID, cacheConfig, browserCrypto, logger);
            const tokenRequest: AuthorizationCodeRequest = {
                redirectUri: `${TEST_URIS.DEFAULT_INSTANCE}`,
                scopes: [Constants.OPENID_SCOPE, Constants.PROFILE_SCOPE],
                code: "thisIsAnAuthCode",
                codeVerifier: TEST_CONFIG.TEST_VERIFIER,
                authority: `${Constants.DEFAULT_AUTHORITY}/`,
                correlationId: `${RANDOM_TEST_GUID}`,
                authenticationScheme: AuthenticationScheme.BEARER
            };

            browserStorage.setTemporaryCache(TemporaryCacheKeys.REQUEST_PARAMS, browserCrypto.base64Encode(JSON.stringify(tokenRequest)), true);

            const cachedRequest = browserStorage.getCachedRequest(RANDOM_TEST_GUID, browserCrypto);
            expect(cachedRequest).toEqual(tokenRequest);

            // expect(() => browserStorage.getCachedRequest(RANDOM_TEST_GUID, cryptoObj)).to.throw(BrowserAuthErrorMessage.tokenRequestCacheError.desc);
        });

        it("Throws error if request cannot be retrieved from cache", async () => {
            const browserStorage = new BrowserCacheManager(TEST_CONFIG.MSAL_CLIENT_ID, cacheConfig, browserCrypto, logger);
            const cryptoObj = new CryptoOps(logger);
            // browserStorage.setItem(TemporaryCacheKeys.REQUEST_PARAMS, cryptoObj.base64Encode(JSON.stringify(tokenRequest)));

            expect(() => browserStorage.getCachedRequest(RANDOM_TEST_GUID, cryptoObj)).toThrowError(BrowserAuthErrorMessage.noTokenRequestCacheError.desc);
        });

        it("Throws error if cached request cannot be parsed correctly", async () => {
            let dbStorage = {};
            sinon.stub(DatabaseStorage.prototype, "open").callsFake(async (): Promise<void> => {
                dbStorage = {};
            });
            const browserStorage = new BrowserCacheManager(TEST_CONFIG.MSAL_CLIENT_ID, cacheConfig, browserCrypto, logger);
            const cryptoObj = new CryptoOps(logger);
            const tokenRequest: AuthorizationCodeRequest = {
                redirectUri: `${TEST_URIS.DEFAULT_INSTANCE}`,
                scopes: [Constants.OPENID_SCOPE, Constants.PROFILE_SCOPE],
                code: "thisIsAnAuthCode",
                codeVerifier: TEST_CONFIG.TEST_VERIFIER,
                authority: `${Constants.DEFAULT_AUTHORITY}/`,
                correlationId: `${RANDOM_TEST_GUID}`,
                authenticationScheme: AuthenticationScheme.BEARER
            };
            const stringifiedRequest = JSON.stringify(tokenRequest);
            browserStorage.setTemporaryCache(TemporaryCacheKeys.REQUEST_PARAMS, stringifiedRequest.substring(0, stringifiedRequest.length / 2), true);
            expect(() => browserStorage.getCachedRequest(RANDOM_TEST_GUID, cryptoObj)).toThrowError(BrowserAuthErrorMessage.unableToParseTokenRequestCacheError.desc);
        });

        it(
            "Uses authority from cache if not present in cached request",
            async () => {
                let dbStorage = {};
                sinon.stub(DatabaseStorage.prototype, "open").callsFake(async (): Promise<void> => {
                    dbStorage = {};
                });
                const browserStorage = new BrowserCacheManager(TEST_CONFIG.MSAL_CLIENT_ID, cacheConfig, browserCrypto, logger);
                // Set up cache
                const authorityKey = browserStorage.generateAuthorityKey(TEST_STATE_VALUES.TEST_STATE_REDIRECT);
                const alternateAuthority = `${TEST_URIS.ALTERNATE_INSTANCE}/common/`;
                browserStorage.setItem(authorityKey, alternateAuthority);

                const cachedRequest: AuthorizationCodeRequest = {
                    redirectUri: TEST_URIS.TEST_REDIR_URI,
                    code: "thisIsACode",
                    codeVerifier: TEST_CONFIG.TEST_VERIFIER,
                    correlationId: RANDOM_TEST_GUID,
                    scopes: [TEST_CONFIG.MSAL_CLIENT_ID],
                    authority: "",
                    authenticationScheme: AuthenticationScheme.BEARER
                };
                const stringifiedRequest = browserCrypto.base64Encode(JSON.stringify(cachedRequest));
                browserStorage.setTemporaryCache(TemporaryCacheKeys.REQUEST_PARAMS, stringifiedRequest, true);

                // Perform test
                const tokenRequest = browserStorage.getCachedRequest(TEST_STATE_VALUES.TEST_STATE_REDIRECT, browserCrypto);
                expect(tokenRequest.authority).toBe(alternateAuthority);
            }
        );

        it(
            "cleanRequestByInteractionType() returns early if state is not present",
            () => {
                let dbStorage = {};
                sinon.stub(DatabaseStorage.prototype, "open").callsFake(async (): Promise<void> => {
                    dbStorage = {};
                });
                const browserStorage = new BrowserCacheManager(TEST_CONFIG.MSAL_CLIENT_ID, cacheConfig, browserCrypto, logger);

                const cacheKey = "cacheKey";
                const cacheValue = "cacheValue";
                browserStorage.setTemporaryCache(cacheKey, cacheValue, true);
                browserStorage.cleanRequestByInteractionType(InteractionType.Redirect);
                expect(browserStorage.getTemporaryCache(cacheKey, true)).toBe(cacheValue);
                browserStorage.clear();
            }
        );

        it("cleanRequestByInteractionType() cleans cache", () => {
            let dbStorage = {};
            sinon.stub(DatabaseStorage.prototype, "open").callsFake(async (): Promise<void> => {
                dbStorage = {};
            });
            const browserStorage = new BrowserCacheManager(TEST_CONFIG.MSAL_CLIENT_ID, cacheConfig, browserCrypto, logger);

            const browserState: BrowserStateObject = {
                interactionType: InteractionType.Redirect
            };
            
            sinon.stub(CryptoOps.prototype, "createNewGuid").returns(RANDOM_TEST_GUID);
            const state = ProtocolUtils.setRequestState(
                browserCrypto,
                undefined,
                browserState
            );
            const cacheKey = `cacheKey.${state}`;
            const cacheValue = "cacheValue";
            browserStorage.setTemporaryCache(cacheKey, cacheValue, true);
            browserStorage.setTemporaryCache(`${TemporaryCacheKeys.REQUEST_STATE}.${RANDOM_TEST_GUID}`, state, true);
            browserStorage.cleanRequestByInteractionType(InteractionType.Redirect);
            expect(browserStorage.getKeys()).toHaveLength(0);
        });
        it("cleanRequestByInteractionType() interaction status even no request is in progress", () => {
            let dbStorage = {};
            sinon.stub(DatabaseStorage.prototype, "open").callsFake(async (): Promise<void> => {
                dbStorage = {};
            });
            const browserStorage = new BrowserCacheManager(TEST_CONFIG.MSAL_CLIENT_ID, {
                ...cacheConfig,
                storeAuthStateInCookie: true
            }, browserCrypto, logger);
            
            browserStorage.setInteractionInProgress(true);
            browserStorage.cleanRequestByInteractionType(InteractionType.Redirect);
            expect(browserStorage.getInteractionInProgress()).toBeFalsy();
        });

        describe("getAccountInfoByFilter", () => {
            cacheConfig = {
                cacheLocation: BrowserCacheLocation.SessionStorage,
                storeAuthStateInCookie: false,
                secureCookies: false
            };
            logger = new Logger({
                loggerCallback: (level: LogLevel, message: string, containsPii: boolean): void => {},
                piiLoggingEnabled: true
            });
            const browserStorage = new BrowserCacheManager(TEST_CONFIG.MSAL_CLIENT_ID, cacheConfig, browserCrypto, logger);

            const accountEntity1 = {
                homeAccountId: "test-home-accountId-1",
                localAccountId: "test-local-accountId-1",
                username: "user-1@example.com",
                environment: "test-environment-1",
                realm: "test-tenantId-1",
                name: "name-1",
                idTokenClaims: {},
                authorityType: "AAD"
            }

            const accountEntity2 = {
                homeAccountId: "test-home-accountId-2",
                localAccountId: "test-local-accountId-2",
                username: "user-2@example.com",
                environment: "test-environment-2",
                realm: "test-tenantId-2",
                name: "name-2",
                idTokenClaims: {},
                authorityType: "AAD"
            }

            const account1: AccountInfo = {
                homeAccountId: accountEntity1.homeAccountId,
                localAccountId: accountEntity1.localAccountId,
                username: accountEntity1.username,
                environment: accountEntity1.environment,
                tenantId: accountEntity1.realm,
                name: accountEntity1.name,
                idTokenClaims: accountEntity1.idTokenClaims
            };

            const account2: AccountInfo = {
                homeAccountId: accountEntity2.homeAccountId,
                localAccountId: accountEntity2.localAccountId,
                username: accountEntity2.username,
                environment: accountEntity2.environment,
                tenantId: accountEntity2.realm,
                name: accountEntity2.name,
                idTokenClaims: accountEntity2.idTokenClaims
            };
            const cacheKey1 = AccountEntity.generateAccountCacheKey(account1);
            const cacheKey2 = AccountEntity.generateAccountCacheKey(account2);

            beforeEach(() => {
                browserStorage.setItem(cacheKey1, JSON.stringify(accountEntity1));
                browserStorage.setItem(cacheKey2, JSON.stringify(accountEntity2));
            });

            afterEach(() => {
                browserStorage.clear();
            });

            it("Matches accounts by username", () => {
                expect(browserStorage.getAllAccounts()).toHaveLength(2);
                const account1Filter = {username: account1.username};
                const account2Filter = {username: account2.username};
                expect(browserStorage.getAccountInfoByFilter(account1Filter)).toHaveLength(1);
                expect(browserStorage.getAccountInfoByFilter(account1Filter)).toContainEqual(account1);
                expect(browserStorage.getAccountInfoByFilter(account2Filter)).toHaveLength(1);
                expect(browserStorage.getAccountInfoByFilter(account2Filter)).toContainEqual(account2);
            });

            it("Matches accounts by homeAccountId", () => {
                expect(browserStorage.getAllAccounts()).toHaveLength(2);
                const account1Filter = {homeAccountId: account1.homeAccountId};
                const account2Filter = {homeAccountId: account2.homeAccountId};
                expect(browserStorage.getAccountInfoByFilter(account1Filter)).toHaveLength(1);
                expect(browserStorage.getAccountInfoByFilter(account1Filter)).toContainEqual(account1);
                expect(browserStorage.getAccountInfoByFilter(account2Filter)).toHaveLength(1);
                expect(browserStorage.getAccountInfoByFilter(account2Filter)).toContainEqual(account2);
            });

            it("Matches accounts by localAccountId", () => {
                expect(browserStorage.getAllAccounts()).toHaveLength(2);
                const account1Filter = {localAccountId: account1.localAccountId};
                const account2Filter = {localAccountId: account2.localAccountId};
                expect(browserStorage.getAccountInfoByFilter(account1Filter)).toHaveLength(1);
                expect(browserStorage.getAccountInfoByFilter(account1Filter)).toContainEqual(account1);
                expect(browserStorage.getAccountInfoByFilter(account2Filter)).toHaveLength(1);
                expect(browserStorage.getAccountInfoByFilter(account2Filter)).toContainEqual(account2);
            });

            it("Matches accounts by tenantId", () => {
                expect(browserStorage.getAllAccounts()).toHaveLength(2);
                const account1Filter = {tenantId: account1.tenantId};
                const account2Filter = {tenantId: account2.tenantId};
                expect(browserStorage.getAccountInfoByFilter(account1Filter)).toHaveLength(1);
                expect(browserStorage.getAccountInfoByFilter(account1Filter)).toContainEqual(account1);
                expect(browserStorage.getAccountInfoByFilter(account2Filter)).toHaveLength(1);
                expect(browserStorage.getAccountInfoByFilter(account2Filter)).toContainEqual(account2);
            });

            it("Matches accounts by environment", () => {
                expect(browserStorage.getAllAccounts()).toHaveLength(2);
                const account1Filter = {environment: account1.environment};
                const account2Filter = {environment: account2.environment};
                expect(browserStorage.getAccountInfoByFilter(account1Filter)).toHaveLength(1);
                expect(browserStorage.getAccountInfoByFilter(account1Filter)).toContainEqual(account1);
                expect(browserStorage.getAccountInfoByFilter(account2Filter)).toHaveLength(1);
                expect(browserStorage.getAccountInfoByFilter(account2Filter)).toContainEqual(account2);
            });

            it("Matches accounts by all filters", () => {
                expect(browserStorage.getAllAccounts()).toHaveLength(2);
                const account1Filter = account1;
                const account2Filter = account2;
                expect(browserStorage.getAccountInfoByFilter(account1Filter)).toHaveLength(1);
                expect(browserStorage.getAccountInfoByFilter(account1Filter)).toContainEqual(account1);
                expect(browserStorage.getAccountInfoByFilter(account2Filter)).toHaveLength(1);
                expect(browserStorage.getAccountInfoByFilter(account2Filter)).toContainEqual(account2);
            });
        });

        describe("getAccountInfoByHints", () => {
            cacheConfig = {
                cacheLocation: BrowserCacheLocation.SessionStorage,
                storeAuthStateInCookie: false,
                secureCookies: false
            };
            logger = new Logger({
                loggerCallback: (level: LogLevel, message: string, containsPii: boolean): void => {},
                piiLoggingEnabled: true
            });
            const browserStorage = new BrowserCacheManager(TEST_CONFIG.MSAL_CLIENT_ID, cacheConfig, browserCrypto, logger);

            const accountEntity1 = {
                homeAccountId: "test-home-accountId-1",
                localAccountId: "test-local-accountId-1",
                username: "user-1@example.com",
                environment: "test-environment-1",
                realm: "test-tenantId-1",
                name: "name-1",
                idTokenClaims: {
                    sid: "session-1"
                },
                authorityType: "AAD"
            }

            const accountEntity2 = {
                homeAccountId: "test-home-accountId-2",
                localAccountId: "test-local-accountId-2",
                username: "user-2@example.com",
                environment: "test-environment-2",
                realm: "test-tenantId-2",
                name: "name-2",
                idTokenClaims: {
                    sid: "session-2"
                },
                authorityType: "AAD"
            }

            const account1: AccountInfo = {
                homeAccountId: accountEntity1.homeAccountId,
                localAccountId: accountEntity1.localAccountId,
                username: accountEntity1.username,
                environment: accountEntity1.environment,
                tenantId: accountEntity1.realm,
                name: accountEntity1.name,
                idTokenClaims: accountEntity1.idTokenClaims,
                nativeAccountId: undefined
            };

            const account2: AccountInfo = {
                homeAccountId: accountEntity2.homeAccountId,
                localAccountId: accountEntity2.localAccountId,
                username: accountEntity2.username,
                environment: accountEntity2.environment,
                tenantId: accountEntity2.realm,
                name: accountEntity2.name,
                idTokenClaims: accountEntity2.idTokenClaims,
                nativeAccountId: undefined
            };
            const cacheKey1 = AccountEntity.generateAccountCacheKey(account1);
            const cacheKey2 = AccountEntity.generateAccountCacheKey(account2);

            beforeEach(() => {
                browserStorage.setItem(cacheKey1, JSON.stringify(accountEntity1));
                browserStorage.setItem(cacheKey2, JSON.stringify(accountEntity2));
            });

            afterEach(() => {
                browserStorage.clear();
            });

            it("Matches account by loginHint", () => {
                expect(browserStorage.getAccountInfoByHints(account1.username)).toEqual(account1);
                expect(browserStorage.getAccountInfoByHints(account2.username)).toEqual(account2);
            });

            it("Matches account by sid", () => {
                expect(browserStorage.getAccountInfoByHints(undefined, account1.idTokenClaims!.sid)).toEqual(account1);
                expect(browserStorage.getAccountInfoByHints(undefined, account2.idTokenClaims!.sid)).toEqual(account2);
            });

            it("Throws if multiple accounts match by loginHint", (done) => {
                const accountEntity3 = {
                    homeAccountId: "test-home-accountId-3",
                    localAccountId: "test-local-accountId-3",
                    username: accountEntity1.username, // Keep this the same as account 1
                    environment: "test-environment-3",
                    realm: "test-tenantId-3",
                    name: "name-3",
                    idTokenClaims: accountEntity1.idTokenClaims, // Keep this the same as account 1 
                    authorityType: "AAD"
                }

                const account3: AccountInfo = {
                    homeAccountId: accountEntity3.homeAccountId,
                    localAccountId: accountEntity3.localAccountId,
                    username: accountEntity3.username,
                    environment: accountEntity3.environment,
                    tenantId: accountEntity3.realm,
                    name: accountEntity3.name,
                    idTokenClaims: accountEntity3.idTokenClaims,
                    nativeAccountId: undefined
                };

                const cacheKey3 = AccountEntity.generateAccountCacheKey(account3);
                browserStorage.setItem(cacheKey3, JSON.stringify(accountEntity3));

                try {
                    browserStorage.getAccountInfoByHints(accountEntity3.username);
                } catch (e) {
                    expect((e as AuthError).errorCode).toEqual(ClientAuthErrorMessage.multipleMatchingAccounts.code);
                    expect((e as AuthError).errorMessage).toEqual(ClientAuthErrorMessage.multipleMatchingAccounts.desc);
                    done();
                }
            });

            it("Throws if multiple accounts match by sid", (done) => {
                const accountEntity3 = {
                    homeAccountId: "test-home-accountId-3",
                    localAccountId: "test-local-accountId-3",
                    username: accountEntity1.username, // Keep this the same as account 1
                    environment: "test-environment-3",
                    realm: "test-tenantId-3",
                    name: "name-3",
                    idTokenClaims: accountEntity1.idTokenClaims, // Keep this the same as account 1 
                    authorityType: "AAD"
                }

                const account3: AccountInfo = {
                    homeAccountId: accountEntity3.homeAccountId,
                    localAccountId: accountEntity3.localAccountId,
                    username: accountEntity3.username,
                    environment: accountEntity3.environment,
                    tenantId: accountEntity3.realm,
                    name: accountEntity3.name,
                    idTokenClaims: accountEntity3.idTokenClaims,
                    nativeAccountId: undefined
                };

                const cacheKey3 = AccountEntity.generateAccountCacheKey(account3);
                browserStorage.setItem(cacheKey3, JSON.stringify(accountEntity3));

                try {
                    browserStorage.getAccountInfoByHints(undefined, accountEntity3.idTokenClaims!.sid);
                } catch (e) {
                    expect((e as AuthError).errorCode).toEqual(ClientAuthErrorMessage.multipleMatchingAccounts.code);
                    expect((e as AuthError).errorMessage).toEqual(ClientAuthErrorMessage.multipleMatchingAccounts.desc);
                    done();
                }
            });

            it("Returns null if no accounts match", () => {
                expect(browserStorage.getAccountInfoByHints("fakeUser@contoso.com")).toBe(null);
                expect(browserStorage.getAccountInfoByHints(undefined, "fake-sid")).toBe(null);
            });

        });
    });
});
