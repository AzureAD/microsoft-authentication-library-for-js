/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    LogLevel,
    Logger,
    AccountEntity,
    CacheManager,
    AuthorityMetadataEntity,
    AccessTokenEntity,
    IdTokenEntity,
    RefreshTokenEntity,
    CacheHelpers,
} from "@azure/msal-common";
import {
    JsonCache,
    InMemoryCache,
} from "./../../src/cache/serializer/SerializerTypes.js";
import { Deserializer } from "./../../src/cache/serializer/Deserializer.js";
import { NodeStorage } from "../../src/cache/NodeStorage.js";
import { version, name } from "../../package.json";
import {
    DEFAULT_CRYPTO_IMPLEMENTATION,
    DEFAULT_OPENID_CONFIG_RESPONSE,
    TEST_CONSTANTS,
} from "../utils/TestConstants.js";

const cacheJson = require("./serializer/cache.json");
const clientId = TEST_CONSTANTS.CLIENT_ID;

describe("Storage tests for msal-node: ", () => {
    let inMemoryCache: InMemoryCache = {
        accounts: {},
        idTokens: {},
        accessTokens: {},
        refreshTokens: {},
        appMetadata: {},
    };

    let logger: Logger;
    const ACCOUNT_KEY = "uid.utid-login.microsoftonline.com-utid";

    beforeEach(() => {
        const cache = JSON.stringify(cacheJson);
        const jsonCache: JsonCache = Deserializer.deserializeJSONBlob(cache);
        inMemoryCache = Deserializer.deserializeAllCache(jsonCache);

        const loggerOptions = {
            loggerCallback: () => {
                // allow user to not set a loggerCallback
            },
            piiLoggingEnabled: false,
            logLevel: LogLevel.Info,
        };
        logger = new Logger(loggerOptions!, name, version);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("Constructor tests: ", () => {
        const nodeStorage = new NodeStorage(
            logger,
            clientId,
            DEFAULT_CRYPTO_IMPLEMENTATION
        );
        expect(nodeStorage).toBeInstanceOf(NodeStorage);

        const cache = nodeStorage.getCache();
        expect(Object.keys(cache).length).toBe(0);

        const inMemoryCache = nodeStorage.getInMemoryCache();
        expect(Object.keys(inMemoryCache.accessTokens).length).toBe(0);
    });

    it("emits a change event when changeEmitter is registered", () => {
        const nodeStorage = new NodeStorage(
            logger,
            clientId,
            DEFAULT_CRYPTO_IMPLEMENTATION
        );
        const changeEmitter = jest.fn();

        nodeStorage.registerChangeEmitter(changeEmitter);
        nodeStorage.setInMemoryCache(inMemoryCache);

        expect(changeEmitter).toHaveBeenCalledTimes(2);
    });

    it("setInMemoryCache() and getInMemoryCache() tests - tests for an account", () => {
        const nodeStorage = new NodeStorage(
            logger,
            clientId,
            DEFAULT_CRYPTO_IMPLEMENTATION
        );
        nodeStorage.setInMemoryCache(inMemoryCache);

        const cache = nodeStorage.getCache();
        const account: AccountEntity = cache[ACCOUNT_KEY] as AccountEntity;
        expect(account).toBeInstanceOf(AccountEntity);
        expect(account.clientInfo).toBe(
            "eyJ1aWQiOiJ1aWQiLCAidXRpZCI6InV0aWQifQ=="
        );

        const newInMemoryCache = nodeStorage.getInMemoryCache();
        expect(newInMemoryCache.accounts[ACCOUNT_KEY]).toEqual(
            cache[ACCOUNT_KEY]
        );
    });

    it("setItem() and getItem() tests - tests for an account", () => {
        const nodeStorage = new NodeStorage(
            logger,
            clientId,
            DEFAULT_CRYPTO_IMPLEMENTATION
        );
        nodeStorage.setInMemoryCache(inMemoryCache);

        const accountKey = "uid1.utid1-login.windows.net-samplerealm";
        const newMockAccount = {
            "uid1.utid1-login.windows.net-samplerealm": {
                username: "Jane Doe",
                localAccountId: "object5678",
                realm: "samplerealm",
                environment: "login.windows.net",
                homeAccountId: "uid1.utid1",
                authorityType: "MSSTS",
                clientInfo: "eyJ1aWQiOiJ1aWQxIiwgInV0aWQiOiJ1dGlkMSJ9",
            },
        };
        let account = new AccountEntity();
        account = CacheManager.toObject(account, newMockAccount);

        nodeStorage.setItem(accountKey, account);
        const fetchedAccount = nodeStorage.getItem(accountKey);

        expect(fetchedAccount).toBeInstanceOf(AccountEntity);
        expect(account).toEqual(fetchedAccount);
    });

    it("setAccount() and getAccount() tests", async () => {
        const nodeStorage = new NodeStorage(
            logger,
            clientId,
            DEFAULT_CRYPTO_IMPLEMENTATION
        );
        nodeStorage.setInMemoryCache(inMemoryCache);
        const fetchedAccount = nodeStorage.getAccount(ACCOUNT_KEY);

        const invalidAccountKey = "uid.utid-login.microsoftonline.com-invalid";
        const invalidAccount = nodeStorage.getAccount(invalidAccountKey);

        expect(fetchedAccount).toBeInstanceOf(AccountEntity);
        expect(fetchedAccount).toEqual(inMemoryCache.accounts[ACCOUNT_KEY]);
        expect(invalidAccount).toBeNull();

        const mockAccountData = {
            username: "Jane Doe",
            localAccountId: "uid",
            realm: "samplerealm",
            environment: "login.windows.net",
            homeAccountId: "uid1.utid1",
            authorityType: "MSSTS",
            clientInfo: "eyJ1aWQiOiJ1aWQxIiwgInV0aWQiOiJ1dGlkMSJ9",
            tenantProfiles: [
                {
                    tenantId: "utid1",
                    localAccountId: "uid",
                    name: "Jane Doe",
                    isHomeTenant: true,
                },
            ],
        };

        let mockAccountEntity = CacheManager.toObject(
            new AccountEntity(),
            mockAccountData
        );
        expect(mockAccountEntity).toBeInstanceOf(AccountEntity);
        await nodeStorage.setAccount(mockAccountEntity);
        expect(
            nodeStorage.getAccount(mockAccountEntity.generateAccountKey())
        ).toEqual(mockAccountEntity);
    });

    it("setCache() and getCache() tests - tests for an accessToken", () => {
        const nodeStorage = new NodeStorage(
            logger,
            clientId,
            DEFAULT_CRYPTO_IMPLEMENTATION
        );

        const accessTokenKey =
            "uid1.utid1-login.windows.net-accesstoken-mock_client_id-samplerealm-scoperead scopewrite--";
        const accessToken: AccessTokenEntity = {
            homeAccountId: "uid1.utid1",
            environment: "login.windows.net",
            credentialType: "AccessToken",
            clientId: "mock_client_id",
            secret: "an access token",
            realm: "samplerealm",
            target: "scoperead scopewrite",
            cachedAt: "1000",
            expiresOn: "4600",
            extendedExpiresOn: "4600",
        };

        const cache = {
            "uid1.utid1-login.windows.net-accesstoken-mock_client_id-samplerealm-scoperead scopewrite--":
                accessToken,
        };
        nodeStorage.setCache(cache);
        const readCache = nodeStorage.getCache();
        expect(readCache[accessTokenKey]).toEqual(accessToken);
    });

    it("setAccessTokenCredential() and getAccessTokenCredential() tests", async () => {
        const nodeStorage = new NodeStorage(
            logger,
            clientId,
            DEFAULT_CRYPTO_IMPLEMENTATION
        );

        const accessTokenKey =
            "uid1.utid1-login.windows.net-accesstoken-mock_client_id-samplerealm-scoperead scopewrite--";
        const invalidAccessTokenKey =
            "uid1.utid1-login.windows.net-accesstoken_invalid-mock_client_id-samplerealm-scoperead scopewrite";
        const accessToken: AccessTokenEntity = {
            homeAccountId: "uid1.utid1",
            environment: "login.windows.net",
            credentialType: "AccessToken",
            clientId: "mock_client_id",
            secret: "an access token",
            realm: "samplerealm",
            target: "scoperead scopewrite",
            cachedAt: "1000",
            expiresOn: "4600",
            extendedExpiresOn: "4600",
        };

        await nodeStorage.setAccessTokenCredential(accessToken);
        const fetchedAccessToken =
            nodeStorage.getAccessTokenCredential(accessTokenKey);
        const invalidAccessToken = nodeStorage.getAccessTokenCredential(
            invalidAccessTokenKey
        );

        expect(fetchedAccessToken).toEqual(accessToken);
        expect(invalidAccessToken).toBeNull();
    });

    it("setIdTokenCredential() and getIdTokenCredential() tests", async () => {
        const nodeStorage = new NodeStorage(
            logger,
            clientId,
            DEFAULT_CRYPTO_IMPLEMENTATION
        );

        const idTokenKey =
            "uid1.utid1-login.windows.net-idtoken-mock_client_id-samplerealm---";
        const invalidIdTokenKey =
            "uid1.utid1-login.windows.net-idtoken_invalid-mock_client_id-samplerealm-";
        const idToken: IdTokenEntity = {
            homeAccountId: "uid1.utid1",
            environment: "login.windows.net",
            credentialType: "IdToken",
            clientId: "mock_client_id",
            secret: "an access token",
            realm: "samplerealm",
        };

        await nodeStorage.setIdTokenCredential(idToken);

        const fetchedIdToken = nodeStorage.getIdTokenCredential(idTokenKey);
        const invalidIdToken =
            nodeStorage.getIdTokenCredential(invalidIdTokenKey);

        expect(fetchedIdToken).toEqual(idToken);
        expect(invalidIdToken).toBeNull();
    });

    it("setRefreshTokenCredential() and getRefreshTokenCredential() tests", async () => {
        const nodeStorage = new NodeStorage(
            logger,
            clientId,
            DEFAULT_CRYPTO_IMPLEMENTATION
        );

        const refreshTokenKey =
            "uid1.utid1-login.windows.net-refreshtoken-mock_client_id-samplerealm---";
        const invalidRefreshTokenKey =
            "uid1.utid1-login.windows.net-refreshtoken_invalid-mock_client_id-samplerealm-";
        const refreshToken: RefreshTokenEntity = {
            homeAccountId: "uid1.utid1",
            environment: "login.windows.net",
            credentialType: "RefreshToken",
            clientId: "mock_client_id",
            secret: "a refresh token",
            realm: "samplerealm",
        };

        await nodeStorage.setRefreshTokenCredential(refreshToken);

        const fetchedRefreshToken =
            nodeStorage.getRefreshTokenCredential(refreshTokenKey);
        const invalidRefreshToken = nodeStorage.getRefreshTokenCredential(
            invalidRefreshTokenKey
        );

        expect(fetchedRefreshToken).toEqual(refreshToken);
        expect(invalidRefreshToken).toBeNull();
    });

    it("containsKey() tests - tests for an accountKey", () => {
        const nodeStorage = new NodeStorage(
            logger,
            clientId,
            DEFAULT_CRYPTO_IMPLEMENTATION
        );
        nodeStorage.setInMemoryCache(inMemoryCache);

        expect(nodeStorage.containsKey(ACCOUNT_KEY)).toBeTruthy();
    });

    it("getKeys() tests - tests for an accountKey", () => {
        const nodeStorage = new NodeStorage(
            logger,
            clientId,
            DEFAULT_CRYPTO_IMPLEMENTATION
        );
        nodeStorage.setInMemoryCache(inMemoryCache);
        expect(nodeStorage.getKeys().includes(ACCOUNT_KEY)).toBeTruthy();
    });

    it("removeItem() tests - removes an account", () => {
        const nodeStorage = new NodeStorage(
            logger,
            clientId,
            DEFAULT_CRYPTO_IMPLEMENTATION
        );
        nodeStorage.setInMemoryCache(inMemoryCache);

        const newInMemoryCache = nodeStorage.getInMemoryCache();
        expect(newInMemoryCache.accounts[ACCOUNT_KEY]).toBeInstanceOf(
            AccountEntity
        );

        nodeStorage.removeItem(ACCOUNT_KEY);
        expect(newInMemoryCache.accounts[ACCOUNT_KEY]).toBeUndefined;
    });

    it("should remove all keys from the cache when clear() is called", () => {
        const nodeStorage = new NodeStorage(
            logger,
            clientId,
            DEFAULT_CRYPTO_IMPLEMENTATION
        );
        nodeStorage.setInMemoryCache(inMemoryCache);

        nodeStorage.clear();

        expect(nodeStorage.getAccount(ACCOUNT_KEY)).toBeNull();

        const newInMemoryCache = nodeStorage.getInMemoryCache();
        Object.values(newInMemoryCache).forEach((cacheSection) => {
            expect(cacheSection).toEqual({});
        });
    });

    describe("Getters and Setters", () => {
        describe("AuthorityMetadata", () => {
            const host = "login.microsoftonline.com";
            const key = `authority-metadata-${clientId}-${host}`;
            const testObj: AuthorityMetadataEntity = {
                aliases: [host],
                preferred_cache: host,
                preferred_network: host,
                canonical_authority: TEST_CONSTANTS.DEFAULT_AUTHORITY,
                authorization_endpoint:
                    DEFAULT_OPENID_CONFIG_RESPONSE.body.authorization_endpoint,
                token_endpoint:
                    DEFAULT_OPENID_CONFIG_RESPONSE.body.token_endpoint,
                end_session_endpoint:
                    DEFAULT_OPENID_CONFIG_RESPONSE.body.end_session_endpoint,
                issuer: DEFAULT_OPENID_CONFIG_RESPONSE.body.issuer,
                jwks_uri: DEFAULT_OPENID_CONFIG_RESPONSE.body.jwks_uri,
                aliasesFromNetwork: false,
                endpointsFromNetwork: false,
                expiresAt: CacheHelpers.generateAuthorityMetadataExpiresAt(),
            };

            it("getAuthorityMetadata() returns null if key is not in cache", () => {
                const nodeStorage = new NodeStorage(
                    logger,
                    clientId,
                    DEFAULT_CRYPTO_IMPLEMENTATION
                );
                expect(nodeStorage.containsKey(key)).toBe(false);
                expect(nodeStorage.getAuthorityMetadataKeys()).not.toContain(
                    key
                );
                expect(nodeStorage.getAuthorityMetadata(key)).toBeNull;
            });

            it("getAuthorityMetadata() returns null if isAuthorityMetadataEntity returns false", () => {
                const nodeStorage = new NodeStorage(
                    logger,
                    clientId,
                    DEFAULT_CRYPTO_IMPLEMENTATION
                );
                // @ts-ignore
                nodeStorage.setAuthorityMetadata(key, {});

                expect(nodeStorage.getAuthorityMetadata(key)).toBeNull;
                expect(nodeStorage.containsKey(key)).toBe(true);
                expect(nodeStorage.getAuthorityMetadataKeys()).toContain(key);
            });

            it("setAuthorityMetadata() and getAuthorityMetadata() sets and returns AuthorityMetadataEntity in-memory", () => {
                const nodeStorage = new NodeStorage(
                    logger,
                    clientId,
                    DEFAULT_CRYPTO_IMPLEMENTATION
                );
                nodeStorage.setAuthorityMetadata(key, testObj);

                expect(nodeStorage.getAuthorityMetadata(key)).toStrictEqual(
                    testObj
                );
                expect(nodeStorage.containsKey(key)).toBe(true);
                expect(nodeStorage.getAuthorityMetadataKeys()).toContain(key);
            });
        });
    });
});
