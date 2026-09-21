/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { LogLevel, Logger } from "../../src/common/logger/Logger.js";
import { AccountEntity } from "../../src/common/cache/entities/AccountEntity.js";
import { CacheManager } from "../../src/common/cache/CacheManager.js";
import { AuthorityMetadataEntity } from "../../src/common/cache/entities/AuthorityMetadataEntity.js";
import { AccessTokenEntity } from "../../src/common/cache/entities/AccessTokenEntity.js";
import { IdTokenEntity } from "../../src/common/cache/entities/IdTokenEntity.js";
import { RefreshTokenEntity } from "../../src/common/cache/entities/RefreshTokenEntity.js";
import * as CacheHelpers from "../../src/common/cache/utils/CacheHelpers.js";
import * as AccountEntityUtils from "../../src/common/cache/utils/AccountEntityUtils.js";
import {
    CacheKVStore,
    JsonCache,
    InMemoryCache,
} from "./../../src/cache/serializer/SerializerTypes.js";
import { Deserializer } from "./../../src/cache/serializer/Deserializer.js";
import { NodeStorage } from "../../src/cache/NodeStorage.js";
import { TokenCache } from "../../src/cache/TokenCache.js";
import { version, name } from "../../package.json";
import {
    DEFAULT_CRYPTO_IMPLEMENTATION,
    DEFAULT_OPENID_CONFIG_RESPONSE,
    TEST_CONSTANTS,
} from "../utils/TestConstants.js";
import {
    generateAccountKey,
    generateCredentialKey,
} from "../../src/cache/CacheHelpers.js";
import { ScopeSet } from "../../src/common/request/ScopeSet.js";
import * as Constants from "../../src/common/utils/Constants.js";
import {
    AppMetadataCache,
    AppMetadataFilter,
    CredentialFilter,
    TokenKeys,
} from "../../src/common/cache/utils/CacheTypes.js";

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
        expect(AccountEntityUtils.isAccountEntity(account)).toBe(true);
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
        const newMockAccountData = {
            username: "Jane Doe",
            localAccountId: "object5678",
            realm: "samplerealm",
            environment: "login.windows.net",
            homeAccountId: "uid1.utid1",
            authorityType: "MSSTS",
            clientInfo: "eyJ1aWQiOiJ1aWQxIiwgInV0aWQiOiJ1dGlkMSJ9",
        };
        let account = {} as AccountEntity;
        account = CacheManager.toObject(account, newMockAccountData);

        nodeStorage.setItem(accountKey, account);
        const fetchedAccount = nodeStorage.getItem(accountKey);

        //@ts-ignore
        expect(AccountEntityUtils.isAccountEntity(fetchedAccount)).toBe(true);
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

        //@ts-ignore
        expect(AccountEntityUtils.isAccountEntity(fetchedAccount)).toBe(true);
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
            {} as AccountEntity,
            mockAccountData
        );
        expect(AccountEntityUtils.isAccountEntity(mockAccountEntity)).toBe(
            true
        );
        await nodeStorage.setAccount(mockAccountEntity);
        expect(
            nodeStorage.getAccount(
                generateAccountKey(
                    AccountEntityUtils.getAccountInfo(mockAccountEntity)
                )
            )
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
            lastUpdatedAt: Date.now().toString(),
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
            "uid1.utid1-login.windows.net-accesstoken-mock_client_id-samplerealm-scoperead scopewrite-";
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
            lastUpdatedAt: Date.now().toString(),
        };

        await nodeStorage.setAccessTokenCredential(accessToken, "", false);
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
            "uid1.utid1-login.windows.net-idtoken-mock_client_id-samplerealm--";
        const invalidIdTokenKey =
            "uid1.utid1-login.windows.net-idtoken_invalid-mock_client_id-samplerealm-";
        const idToken: IdTokenEntity = {
            homeAccountId: "uid1.utid1",
            environment: "login.windows.net",
            credentialType: "IdToken",
            clientId: "mock_client_id",
            secret: "an access token",
            realm: "samplerealm",
            lastUpdatedAt: Date.now().toString(),
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
            "uid1.utid1-login.windows.net-refreshtoken-mock_client_id-samplerealm--";
        const invalidRefreshTokenKey =
            "uid1.utid1-login.windows.net-refreshtoken_invalid-mock_client_id-samplerealm-";
        const refreshToken: RefreshTokenEntity = {
            homeAccountId: "uid1.utid1",
            environment: "login.windows.net",
            credentialType: "RefreshToken",
            clientId: "mock_client_id",
            secret: "a refresh token",
            realm: "samplerealm",
            lastUpdatedAt: Date.now().toString(),
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
        expect(
            AccountEntityUtils.isAccountEntity(
                newInMemoryCache.accounts[ACCOUNT_KEY]
            )
        ).toBe(true);

        nodeStorage.removeItem(ACCOUNT_KEY);
        expect(newInMemoryCache.accounts[ACCOUNT_KEY]).toBeUndefined;
    });

    it("clear() removes all cache entries except authority metadata", () => {
        const nodeStorage = new NodeStorage(
            logger,
            clientId,
            DEFAULT_CRYPTO_IMPLEMENTATION
        );
        nodeStorage.setInMemoryCache(inMemoryCache);

        const host = "login.microsoftonline.com";
        const authorityMetadataKey = `authority-metadata-${clientId}-${host}`;
        const authorityMetadata: AuthorityMetadataEntity = {
            aliases: [host],
            preferred_cache: host,
            preferred_network: host,
            canonical_authority: TEST_CONSTANTS.DEFAULT_AUTHORITY,
            authorization_endpoint:
                DEFAULT_OPENID_CONFIG_RESPONSE.body.authorization_endpoint,
            token_endpoint: DEFAULT_OPENID_CONFIG_RESPONSE.body.token_endpoint,
            end_session_endpoint:
                DEFAULT_OPENID_CONFIG_RESPONSE.body.end_session_endpoint,
            issuer: DEFAULT_OPENID_CONFIG_RESPONSE.body.issuer,
            jwks_uri: DEFAULT_OPENID_CONFIG_RESPONSE.body.jwks_uri,
            aliasesFromNetwork: false,
            endpointsFromNetwork: false,
            expiresAt: CacheHelpers.generateAuthorityMetadataExpiresAt(),
        };
        nodeStorage.setAuthorityMetadata(
            authorityMetadataKey,
            authorityMetadata
        );

        nodeStorage.clear();

        // Token/account/appMetadata entries should be cleared
        const newInMemoryCache = nodeStorage.getInMemoryCache();
        Object.values(newInMemoryCache).forEach((cacheSection) => {
            expect(cacheSection).toEqual({});
        });

        // Authority metadata should be preserved
        expect(nodeStorage.getAuthorityMetadata(authorityMetadataKey)).toEqual(
            authorityMetadata
        );
        expect(nodeStorage.getAuthorityMetadataKeys()).toContain(
            authorityMetadataKey
        );
    });

    describe("Indexed credential lookup", () => {
        function createAccessToken(
            overrides: Partial<AccessTokenEntity> = {}
        ): AccessTokenEntity {
            return {
                homeAccountId: "uid.utid",
                environment: "login.windows.net",
                credentialType: Constants.CredentialType.ACCESS_TOKEN,
                clientId,
                secret: "access-token",
                realm: "tenant-id",
                target: "scope.read scope.write",
                cachedAt: "1000",
                expiresOn: "4600",
                tokenType: Constants.AuthenticationScheme.BEARER,
                lastUpdatedAt: "1000",
                ...overrides,
            };
        }

        function createIndexedStorage(): NodeStorage {
            return new NodeStorage(
                logger,
                clientId,
                DEFAULT_CRYPTO_IMPLEMENTATION,
                {
                    canonicalAuthority:
                        "https://login.microsoftonline.com/tenant-id",
                }
            );
        }

        class ScanOracleStorage extends NodeStorage {
            getAccountKeys(): string[] {
                const cache = this.getCache();
                return Object.keys(cache).filter((key) => {
                    const value = cache[key];
                    return (
                        !!value &&
                        typeof value === "object" &&
                        AccountEntityUtils.isAccountEntity(value)
                    );
                });
            }

            getTokenKeys(): TokenKeys {
                const cache = this.getCache();
                const tokenKeys: TokenKeys = {
                    idToken: [],
                    accessToken: [],
                    refreshToken: [],
                };
                Object.keys(cache).forEach((key) => {
                    const value = cache[key];
                    if (!value || typeof value !== "object") {
                        return;
                    }
                    if (CacheHelpers.isIdTokenEntity(value)) {
                        tokenKeys.idToken.push(key);
                    } else if (CacheHelpers.isAccessTokenEntity(value)) {
                        tokenKeys.accessToken.push(key);
                    } else if (CacheHelpers.isRefreshTokenEntity(value)) {
                        tokenKeys.refreshToken.push(key);
                    }
                });
                return tokenKeys;
            }

            getAuthorityMetadataKeys(): string[] {
                return Object.keys(this.getCache()).filter((key) =>
                    this.isAuthorityMetadata(key)
                );
            }

            getAccessTokensByFilter(
                filter: CredentialFilter,
                correlationId: string
            ): AccessTokenEntity[] {
                return Array.from(
                    super
                        .getAccessTokenEntriesByFilter(
                            filter,
                            correlationId,
                            this.getTokenKeys()
                        )
                        .values()
                );
            }

            getIdTokensByFilter(
                filter: CredentialFilter,
                correlationId: string
            ): Map<string, IdTokenEntity> {
                return CacheManager.prototype.getIdTokensByFilter.call(
                    this,
                    filter,
                    correlationId,
                    this.getTokenKeys()
                );
            }

            protected getRefreshTokensByFilter(
                filter: CredentialFilter,
                correlationId: string,
                _tokenKeys?: TokenKeys
            ): RefreshTokenEntity[] {
                return super.getRefreshTokensByFilter(
                    filter,
                    correlationId,
                    this.getTokenKeys()
                );
            }

            getAppMetadataFilteredBy(
                filter: AppMetadataFilter,
                correlationId: string
            ): AppMetadataCache {
                return CacheManager.prototype.getAppMetadataFilteredBy.call(
                    this,
                    filter,
                    correlationId
                );
            }

            getAuthorityMetadataByAlias(
                host: string,
                correlationId: string
            ): AuthorityMetadataEntity | null {
                return CacheManager.prototype.getAuthorityMetadataByAlias.call(
                    this,
                    host,
                    correlationId
                );
            }
        }

        function createScanOracleStorage(): ScanOracleStorage {
            return new ScanOracleStorage(
                logger,
                clientId,
                DEFAULT_CRYPTO_IMPLEMENTATION,
                {
                    canonicalAuthority:
                        "https://login.microsoftonline.com/tenant-id",
                }
            );
        }

        it("does not inspect unrelated access tokens on hit or miss", () => {
            const nodeStorage = createIndexedStorage();
            const matchingToken = createAccessToken();
            const cache: Record<string, AccessTokenEntity> = {
                [generateCredentialKey(matchingToken)]: matchingToken,
            };

            for (let i = 0; i < 1000; i++) {
                const unrelatedToken = createAccessToken({
                    clientId: `unrelated-client-${i}`,
                    secret: `unrelated-token-${i}`,
                });
                cache[generateCredentialKey(unrelatedToken)] = unrelatedToken;
            }
            nodeStorage.setCache(cache);

            const getCredentialSpy = jest.spyOn(
                nodeStorage,
                "getAccessTokenCredential"
            );
            const getTokenKeysSpy = jest.spyOn(nodeStorage, "getTokenKeys");
            const getInMemoryCacheSpy = jest.spyOn(
                nodeStorage,
                "getInMemoryCache"
            );
            const filter = {
                homeAccountId: matchingToken.homeAccountId,
                environment: "login.microsoftonline.com",
                credentialType: matchingToken.credentialType,
                clientId: matchingToken.clientId,
                realm: matchingToken.realm,
                target: ScopeSet.fromString("scope.read", ""),
            };

            expect(nodeStorage.getAccessTokensByFilter(filter, "")).toEqual([
                matchingToken,
            ]);
            expect(getCredentialSpy).toHaveBeenCalledTimes(1);
            expect(getTokenKeysSpy).not.toHaveBeenCalled();
            expect(getInMemoryCacheSpy).not.toHaveBeenCalled();

            getCredentialSpy.mockClear();
            expect(
                nodeStorage.getAccessTokensByFilter(
                    {
                        ...filter,
                        clientId: "missing-client",
                    },
                    ""
                )
            ).toEqual([]);
            expect(getCredentialSpy).not.toHaveBeenCalled();
            expect(getTokenKeysSpy).not.toHaveBeenCalled();
            expect(getInMemoryCacheSpy).not.toHaveBeenCalled();
        });

        it("uses the OBO assertion partition without inspecting unrelated tokens", () => {
            const nodeStorage = createIndexedStorage();
            const matchingToken = createAccessToken({
                userAssertionHash: "matching-assertion",
            });
            const cache: Record<string, AccessTokenEntity> = {
                [generateCredentialKey(matchingToken)]: matchingToken,
            };

            for (let i = 0; i < 1000; i++) {
                const unrelatedToken = createAccessToken({
                    homeAccountId: `unrelated-home-${i}`,
                    secret: `unrelated-token-${i}`,
                    userAssertionHash: `unrelated-assertion-${i}`,
                });
                cache[generateCredentialKey(unrelatedToken)] = unrelatedToken;
            }
            nodeStorage.setCache(cache);
            const getCredentialSpy = jest.spyOn(
                nodeStorage,
                "getAccessTokenCredential"
            );

            expect(
                nodeStorage.getAccessTokensByFilter(
                    {
                        credentialType: matchingToken.credentialType,
                        clientId: matchingToken.clientId,
                        target: ScopeSet.fromString("scope.read", ""),
                        tokenType: Constants.AuthenticationScheme.BEARER,
                        userAssertionHash: matchingToken.userAssertionHash,
                    },
                    ""
                )
            ).toEqual([matchingToken]);
            expect(getCredentialSpy).toHaveBeenCalledTimes(1);
        });

        it("preserves scope superset matching and duplicate insertion order", () => {
            const nodeStorage = createIndexedStorage();
            const firstToken = createAccessToken({
                secret: "first-token",
                target: "scope.read scope.write",
            });
            const secondToken = createAccessToken({
                secret: "second-token",
                target: "scope.read scope.extra",
            });
            const firstKey = generateCredentialKey(firstToken);
            const secondKey = generateCredentialKey(secondToken);
            nodeStorage.setCache({
                [firstKey]: firstToken,
                [secondKey]: secondToken,
            });

            expect(
                nodeStorage
                    .getAccessTokensByFilter(
                        {
                            homeAccountId: firstToken.homeAccountId,
                            environment: "login.microsoftonline.com",
                            credentialType: firstToken.credentialType,
                            clientId: firstToken.clientId,
                            realm: firstToken.realm,
                            target: ScopeSet.fromString("SCOPE.READ", ""),
                        },
                        ""
                    )
                    .map((token) => token.secret)
            ).toEqual(["first-token", "second-token"]);
        });

        it("preserves typed key order when replacing an existing entry", () => {
            const nodeStorage = createIndexedStorage();
            const firstToken = createAccessToken({
                secret: "first-token",
                target: "scope.read",
            });
            const secondToken = createAccessToken({
                secret: "second-token",
                target: "scope.write",
            });
            const firstKey = generateCredentialKey(firstToken);
            const secondKey = generateCredentialKey(secondToken);
            nodeStorage.setCache({
                [firstKey]: firstToken,
                [secondKey]: secondToken,
            });

            nodeStorage.setItem(firstKey, { ...firstToken });

            expect(nodeStorage.getTokenKeys().accessToken).toEqual([
                firstKey,
                secondKey,
            ]);
        });

        it("preserves wildcard authentication scheme matching", () => {
            const nodeStorage = createIndexedStorage();
            const popToken = createAccessToken({
                credentialType:
                    Constants.CredentialType.ACCESS_TOKEN_WITH_AUTH_SCHEME,
                tokenType: Constants.AuthenticationScheme.POP,
                keyId: "pop-key",
                secret: "pop-token",
            });
            const sshToken = createAccessToken({
                credentialType:
                    Constants.CredentialType.ACCESS_TOKEN_WITH_AUTH_SCHEME,
                tokenType: Constants.AuthenticationScheme.SSH,
                keyId: "ssh-key",
                secret: "ssh-token",
            });
            nodeStorage.setCache({
                [generateCredentialKey(popToken)]: popToken,
                [generateCredentialKey(sshToken)]: sshToken,
            });

            expect(
                nodeStorage
                    .getAccessTokensByFilter(
                        {
                            homeAccountId: popToken.homeAccountId,
                            environment: popToken.environment,
                            credentialType: popToken.credentialType,
                            clientId: popToken.clientId,
                            realm: popToken.realm,
                            target: ScopeSet.fromString("scope.read", ""),
                        },
                        ""
                    )
                    .map((token) => token.secret)
            ).toEqual(["pop-token", "ssh-token"]);
        });

        it("does not create an unreachable OBO partition for normal access tokens", () => {
            const nodeStorage = createIndexedStorage();
            const normalToken = createAccessToken();
            nodeStorage.setCache({
                [generateCredentialKey(normalToken)]: normalToken,
            });

            const accessTokenIndex = (
                nodeStorage as unknown as {
                    accessTokenIndex: Map<string, unknown>;
                }
            ).accessTokenIndex;
            expect(accessTokenIndex.size).toBe(1);

            const oboToken = createAccessToken({
                userAssertionHash: "assertion-hash",
            });
            nodeStorage.setItem(generateCredentialKey(oboToken), oboToken);
            expect(accessTokenIndex.size).toBe(2);
        });

        it("indexes ID tokens, refresh tokens, and app metadata by aliases", async () => {
            const nodeStorage = createIndexedStorage();
            const unrelatedCache: Record<string, AccessTokenEntity> = {};
            for (let i = 0; i < 1000; i++) {
                const unrelatedToken = createAccessToken({
                    clientId: `unrelated-client-${i}`,
                    secret: `unrelated-token-${i}`,
                });
                unrelatedCache[generateCredentialKey(unrelatedToken)] =
                    unrelatedToken;
            }
            nodeStorage.setCache(unrelatedCache);
            const idToken: IdTokenEntity = {
                homeAccountId: "uid.utid",
                environment: "login.windows.net",
                credentialType: Constants.CredentialType.ID_TOKEN,
                clientId,
                secret: "id-token",
                realm: "tenant-id",
                lastUpdatedAt: "1000",
            };
            const refreshToken: RefreshTokenEntity = {
                homeAccountId: "uid.utid",
                environment: "login.windows.net",
                credentialType: Constants.CredentialType.REFRESH_TOKEN,
                clientId,
                secret: "refresh-token",
                familyId: Constants.THE_FAMILY_ID,
                lastUpdatedAt: "1000",
            };
            const appMetadata = {
                environment: "login.windows.net",
                clientId,
                familyId: Constants.THE_FAMILY_ID,
            };

            await nodeStorage.setIdTokenCredential(idToken);
            await nodeStorage.setRefreshTokenCredential(refreshToken);
            nodeStorage.setAppMetadata(appMetadata);
            const getIdTokenSpy = jest.spyOn(
                nodeStorage,
                "getIdTokenCredential"
            );
            const getRefreshTokenSpy = jest.spyOn(
                nodeStorage,
                "getRefreshTokenCredential"
            );
            const getAppMetadataSpy = jest.spyOn(nodeStorage, "getAppMetadata");

            expect(
                Array.from(
                    nodeStorage
                        .getIdTokensByFilter(
                            {
                                homeAccountId: idToken.homeAccountId,
                                environment: "login.microsoftonline.com",
                                credentialType: idToken.credentialType,
                                clientId,
                                realm: idToken.realm,
                            },
                            ""
                        )
                        .values()
                )
            ).toEqual([idToken]);
            expect(
                nodeStorage.getRefreshToken(
                    {
                        homeAccountId: refreshToken.homeAccountId,
                        environment: "login.microsoftonline.com",
                        tenantId: "tenant-id",
                        localAccountId: "uid",
                        username: "",
                    },
                    true,
                    ""
                )
            ).toEqual(refreshToken);
            expect(
                nodeStorage.readAppMetadataFromCache(
                    "login.microsoftonline.com",
                    ""
                )
            ).toEqual(appMetadata);
            expect(getIdTokenSpy).toHaveBeenCalledTimes(1);
            expect(getRefreshTokenSpy).toHaveBeenCalledTimes(1);
            expect(getAppMetadataSpy).toHaveBeenCalledTimes(1);
        });

        it("returns shape-preserving defensive cache snapshots", () => {
            const nodeStorage = createIndexedStorage();
            const firstToken = createAccessToken({ refreshOn: undefined });
            const firstKey = generateCredentialKey(firstToken);
            const inputCache = { [firstKey]: firstToken };
            nodeStorage.setCache(inputCache);
            const snapshot = new TokenCache(nodeStorage, logger).getKVStore();
            const storageSnapshot = nodeStorage.getCache();
            const filter = {
                homeAccountId: firstToken.homeAccountId,
                environment: "login.microsoftonline.com",
                credentialType: firstToken.credentialType,
                clientId: firstToken.clientId,
                realm: firstToken.realm,
                target: ScopeSet.fromString("scope.read", ""),
            };

            const snapshotToken = Object.values(
                snapshot
            )[0] as AccessTokenEntity;
            expect(
                Object.prototype.hasOwnProperty.call(snapshotToken, "refreshOn")
            ).toBe(true);
            expect(snapshotToken.refreshOn).toBeUndefined();
            snapshotToken.clientId = "mutated-client";
            delete snapshot[firstKey];
            delete storageSnapshot[firstKey];
            inputCache[firstKey].clientId = "input-mutated-client";
            delete inputCache[firstKey];
            expect(
                nodeStorage.getAccessTokensByFilter(filter, "")
            ).toHaveLength(1);
        });

        it("validates indexed candidates against the current flat store", () => {
            const nodeStorage = createIndexedStorage();
            const indexedToken = createAccessToken();
            const cacheKey = generateCredentialKey(indexedToken);
            const filter = {
                homeAccountId: indexedToken.homeAccountId,
                environment: "login.microsoftonline.com",
                credentialType: indexedToken.credentialType,
                clientId: indexedToken.clientId,
                realm: indexedToken.realm,
                target: ScopeSet.fromString("scope.read", ""),
            };
            nodeStorage.setCache({ [cacheKey]: indexedToken });

            (nodeStorage as unknown as { cache: CacheKVStore }).cache[
                cacheKey
            ] = createAccessToken({
                clientId: "replacement-client",
            });

            expect(nodeStorage.getAccessTokensByFilter(filter, "")).toEqual([]);
        });

        it("owns values supplied through cache mutation methods", () => {
            const nodeStorage = createIndexedStorage();
            const token = createAccessToken();
            const tokenKey = generateCredentialKey(token);
            nodeStorage.setItem(tokenKey, token);
            token.target = "scope.changed";

            expect(
                nodeStorage.getAccessTokensByFilter(
                    {
                        homeAccountId: token.homeAccountId,
                        environment: token.environment,
                        credentialType: token.credentialType,
                        clientId: token.clientId,
                        realm: token.realm,
                        target: ScopeSet.fromString("scope.read", ""),
                    },
                    ""
                )
            ).toHaveLength(1);

            const metadataKey = `authority-metadata-${clientId}-owned.example.com`;
            const metadata: AuthorityMetadataEntity = {
                aliases: ["owned.example.com"],
                preferred_cache: "owned.example.com",
                preferred_network: "owned.example.com",
                canonical_authority: "https://owned.example.com/tenant-id",
                authorization_endpoint: "https://owned.example.com/authorize",
                token_endpoint: "https://owned.example.com/token",
                end_session_endpoint: "https://owned.example.com/logout",
                issuer: "https://owned.example.com/tenant-id",
                jwks_uri: "https://owned.example.com/keys",
                aliasesFromNetwork: true,
                endpointsFromNetwork: true,
                expiresAt: CacheHelpers.generateAuthorityMetadataExpiresAt(),
            };
            nodeStorage.setAuthorityMetadata(metadataKey, metadata);
            metadata.aliases.push("mutated.example.com");

            expect(
                nodeStorage.getAuthorityMetadataByAlias(
                    "mutated.example.com",
                    ""
                )
            ).toBeNull();
        });

        it("matches the scan oracle across seeded cache combinations", () => {
            let seed = 0x5eed1234;
            const next = (maximum: number): number => {
                seed = (seed * 1664525 + 1013904223) >>> 0;
                return seed % maximum;
            };
            const choose = <T>(values: T[]): T => values[next(values.length)];
            const cache: CacheKVStore = {};
            const environments = [
                "login.windows.net",
                "login.microsoftonline.com",
                "unrelated.example.com",
            ];
            const realms = ["tenant-id", "other-tenant", ""];
            const targets = [
                "scope.read",
                "scope.read scope.write",
                "SCOPE.WRITE scope.read",
                "scope.extra scope.read",
            ];
            const schemes = [
                Constants.AuthenticationScheme.BEARER,
                Constants.AuthenticationScheme.POP,
                Constants.AuthenticationScheme.SSH,
            ];
            const components: Array<Record<string, string> | undefined> = [
                undefined,
                { client_claims: "claims-a" },
                { attribute_tokens: "fmi-a" },
            ];
            const assertionHashes = [undefined, "assertion-a", "assertion-b"];

            for (let i = 0; i < 160; i++) {
                const scheme = choose(schemes);
                const token = createAccessToken({
                    homeAccountId: `uid${next(4)}.utid${next(3)}`,
                    environment: choose(environments),
                    credentialType:
                        scheme === Constants.AuthenticationScheme.BEARER
                            ? Constants.CredentialType.ACCESS_TOKEN
                            : Constants.CredentialType
                                  .ACCESS_TOKEN_WITH_AUTH_SCHEME,
                    clientId: next(3) === 0 ? `client-${next(3)}` : clientId,
                    realm: choose(realms),
                    target: choose(targets),
                    tokenType: scheme,
                    keyId:
                        scheme === Constants.AuthenticationScheme.SSH
                            ? `ssh-key-${next(2)}`
                            : `pop-key-${next(2)}`,
                    userAssertionHash: choose(assertionHashes),
                    additionalCacheKeyComponents: choose(components),
                    secret: `access-token-${i}`,
                    expiresOn: String(2000 + next(5000)),
                    refreshOn: String(1500 + next(3000)),
                });
                cache[generateCredentialKey(token)] = token;
            }

            for (let i = 0; i < 30; i++) {
                const idToken: IdTokenEntity = {
                    homeAccountId: `uid${next(4)}.utid${next(3)}`,
                    environment: choose(environments),
                    credentialType: Constants.CredentialType.ID_TOKEN,
                    clientId: next(3) === 0 ? `client-${next(3)}` : clientId,
                    secret: `id-token-${i}`,
                    realm: choose(realms),
                    lastUpdatedAt: String(i),
                };
                cache[generateCredentialKey(idToken)] = idToken;

                const refreshToken: RefreshTokenEntity = {
                    homeAccountId: `uid${next(4)}.utid${next(3)}`,
                    environment: choose(environments),
                    credentialType: Constants.CredentialType.REFRESH_TOKEN,
                    clientId,
                    secret: `refresh-token-${i}`,
                    familyId:
                        next(2) === 0 ? Constants.THE_FAMILY_ID : undefined,
                    lastUpdatedAt: String(i),
                };
                cache[generateCredentialKey(refreshToken)] = refreshToken;
            }

            environments.forEach((environment, index) => {
                const metadata = {
                    environment,
                    clientId,
                    familyId:
                        index % 2 === 0 ? Constants.THE_FAMILY_ID : undefined,
                };
                cache[CacheHelpers.generateAppMetadataKey(metadata)] = metadata;
            });

            const indexed = createIndexedStorage();
            const oracle = createScanOracleStorage();
            indexed.setCache({ ...cache });
            oracle.setCache({ ...cache });

            (
                oracle as unknown as { accessTokenKeys: Set<string> }
            ).accessTokenKeys.clear();
            expect(oracle.getTokenKeys().accessToken).toEqual(
                Object.keys(cache).filter((key) => {
                    const value = cache[key];
                    return (
                        !!value &&
                        typeof value === "object" &&
                        CacheHelpers.isAccessTokenEntity(value)
                    );
                })
            );

            const outcome = <T>(
                operation: () => T
            ): { value: T } | { error: string } => {
                try {
                    return { value: operation() };
                } catch (error) {
                    return {
                        error:
                            error instanceof Error
                                ? `${error.name}:${error.message}`
                                : String(error),
                    };
                }
            };

            for (let i = 0; i < 100; i++) {
                const scheme = choose(schemes);
                const filter: CredentialFilter = {
                    homeAccountId: `uid${next(4)}.utid${next(3)}`,
                    environment: choose(environments),
                    credentialType:
                        scheme === Constants.AuthenticationScheme.BEARER
                            ? Constants.CredentialType.ACCESS_TOKEN
                            : Constants.CredentialType
                                  .ACCESS_TOKEN_WITH_AUTH_SCHEME,
                    clientId: next(3) === 0 ? `client-${next(3)}` : clientId,
                    realm: choose(realms),
                    target: ScopeSet.fromString(choose(targets), ""),
                    tokenType: scheme,
                    keyId:
                        scheme === Constants.AuthenticationScheme.SSH
                            ? `ssh-key-${next(2)}`
                            : undefined,
                    additionalCacheKeyComponents: choose(components),
                };
                if (next(4) === 0) {
                    delete filter.homeAccountId;
                    delete filter.environment;
                    delete filter.realm;
                    filter.userAssertionHash = choose(assertionHashes);
                }

                const indexedResult = outcome(() =>
                    indexed
                        .getAccessTokensByFilter(filter, "")
                        .map((token) => token.secret)
                );
                const oracleResult = outcome(() =>
                    oracle
                        .getAccessTokensByFilter(filter, "")
                        .map((token) => token.secret)
                );
                if (
                    JSON.stringify(indexedResult) !==
                    JSON.stringify(oracleResult)
                ) {
                    throw new Error(
                        JSON.stringify({
                            case: i,
                            filter,
                            indexedResult,
                            oracleResult,
                        })
                    );
                }
            }

            for (let i = 0; i < 40; i++) {
                const filter: CredentialFilter = {
                    homeAccountId: `uid${next(4)}.utid${next(3)}`,
                    environment: choose(environments),
                    credentialType: Constants.CredentialType.ID_TOKEN,
                    clientId,
                    realm: next(3) === 0 ? undefined : choose(realms),
                };
                expect(
                    outcome(() =>
                        Array.from(
                            indexed.getIdTokensByFilter(filter, "").values()
                        ).map((token) => token.secret)
                    )
                ).toEqual(
                    outcome(() =>
                        Array.from(
                            oracle.getIdTokensByFilter(filter, "").values()
                        ).map((token) => token.secret)
                    )
                );

                const account = {
                    homeAccountId: filter.homeAccountId!,
                    environment: filter.environment!,
                    tenantId: filter.realm || "tenant-id",
                    localAccountId: "local",
                    username: "",
                };
                const familyRT = next(2) === 0;
                expect(
                    outcome(
                        () =>
                            indexed.getRefreshToken(account, familyRT, "")
                                ?.secret
                    )
                ).toEqual(
                    outcome(
                        () =>
                            oracle.getRefreshToken(account, familyRT, "")
                                ?.secret
                    )
                );
            }

            environments.forEach((environment) => {
                expect(
                    indexed.getAppMetadataFilteredBy(
                        { environment, clientId },
                        ""
                    )
                ).toEqual(
                    oracle.getAppMetadataFilteredBy(
                        { environment, clientId },
                        ""
                    )
                );
            });

            const malformed = createAccessToken();
            const malformedKey = generateCredentialKey(malformed);
            const malformedValue = {
                ...malformed,
                target: undefined,
            } as unknown as AccessTokenEntity;
            indexed.setCache({
                ...indexed.getCache(),
                [malformedKey]: malformedValue,
            });
            oracle.setCache({
                ...oracle.getCache(),
                [malformedKey]: malformedValue,
            });
            const malformedFilter: CredentialFilter = {
                homeAccountId: malformed.homeAccountId,
                environment: "login.microsoftonline.com",
                credentialType: malformed.credentialType,
                clientId: malformed.clientId,
                realm: malformed.realm,
                target: ScopeSet.fromString("scope.read", ""),
            };
            expect(
                outcome(() =>
                    indexed.getAccessTokensByFilter(malformedFilter, "")
                )
            ).toEqual(
                outcome(() =>
                    oracle.getAccessTokensByFilter(malformedFilter, "")
                )
            );

            const malformedAuthorityKey = `authority-metadata-${clientId}-malformed.example.com`;
            const malformedAuthority = {
                aliases: undefined,
                preferred_cache: "malformed.example.com",
                preferred_network: "malformed.example.com",
                canonical_authority: "https://malformed.example.com/tenant-id",
                authorization_endpoint:
                    "https://malformed.example.com/authorize",
                token_endpoint: "https://malformed.example.com/token",
                issuer: "https://malformed.example.com/tenant-id",
                aliasesFromNetwork: true,
                endpointsFromNetwork: true,
                expiresAt: CacheHelpers.generateAuthorityMetadataExpiresAt(),
                jwks_uri: "https://malformed.example.com/keys",
            } as unknown as AuthorityMetadataEntity;
            indexed.setCache({
                ...indexed.getCache(),
                [malformedAuthorityKey]: malformedAuthority,
            });
            oracle.setCache({
                ...oracle.getCache(),
                [malformedAuthorityKey]: malformedAuthority,
            });
            expect(indexed.getAuthorityMetadata(malformedAuthorityKey)).toEqual(
                expect.objectContaining({
                    aliases: [],
                })
            );
            expect(
                outcome(() =>
                    indexed.getAuthorityMetadataByAlias(
                        "malformed.example.com",
                        ""
                    )
                )
            ).toEqual(
                outcome(() =>
                    oracle.getAuthorityMetadataByAlias(
                        "malformed.example.com",
                        ""
                    )
                )
            );
        });

        it("preserves exact mixed-case authority alias matching", () => {
            const nodeStorage = createIndexedStorage();
            const token = createAccessToken({
                environment: "Mixed-Cache.Example.com",
            });
            const metadataKey = `authority-metadata-${clientId}-mixed-query.example.com`;
            const metadata: AuthorityMetadataEntity = {
                aliases: ["Mixed-Query.Example.com", "Mixed-Cache.Example.com"],
                preferred_cache: "Mixed-Cache.Example.com",
                preferred_network: "Mixed-Query.Example.com",
                canonical_authority:
                    "https://Mixed-Query.Example.com/tenant-id",
                authorization_endpoint:
                    "https://Mixed-Query.Example.com/authorize",
                token_endpoint: "https://Mixed-Query.Example.com/token",
                end_session_endpoint: "https://Mixed-Query.Example.com/logout",
                issuer: "https://Mixed-Query.Example.com/tenant-id",
                jwks_uri: "https://Mixed-Query.Example.com/keys",
                aliasesFromNetwork: true,
                endpointsFromNetwork: true,
                expiresAt: CacheHelpers.generateAuthorityMetadataExpiresAt(),
            };
            nodeStorage.setCache({
                [generateCredentialKey(token)]: token,
                [metadataKey]: metadata,
            });

            expect(
                nodeStorage.getAccessTokensByFilter(
                    {
                        homeAccountId: token.homeAccountId,
                        environment: "Mixed-Query.Example.com",
                        credentialType: token.credentialType,
                        clientId: token.clientId,
                        realm: token.realm,
                        target: ScopeSet.fromString("scope.read", ""),
                    },
                    ""
                )
            ).toEqual([token]);
            expect(
                nodeStorage.getAuthorityMetadataByAlias(
                    "mixed-query.example.com",
                    ""
                )
            ).toBeNull();
        });

        it("preserves last-match authority alias semantics across mutation", () => {
            const nodeStorage = new NodeStorage(
                logger,
                clientId,
                DEFAULT_CRYPTO_IMPLEMENTATION
            );
            const token = createAccessToken({
                environment: "cache.example.com",
            });
            const firstKey = `authority-metadata-${clientId}-first.example.com`;
            const lastKey = `authority-metadata-${clientId}-last.example.com`;
            const authorityBase = {
                preferred_cache: "cache.example.com",
                preferred_network: "query.example.com",
                canonical_authority: "https://query.example.com/tenant-id",
                authorization_endpoint: "https://query.example.com/authorize",
                token_endpoint: "https://query.example.com/token",
                end_session_endpoint: "https://query.example.com/logout",
                issuer: "https://query.example.com/tenant-id",
                jwks_uri: "https://query.example.com/keys",
                aliasesFromNetwork: true,
                endpointsFromNetwork: true,
                expiresAt: CacheHelpers.generateAuthorityMetadataExpiresAt(),
            };
            nodeStorage.setCache({
                [generateCredentialKey(token)]: token,
                [firstKey]: {
                    ...authorityBase,
                    aliases: ["query.example.com", "cache.example.com"],
                },
                [lastKey]: {
                    ...authorityBase,
                    aliases: ["query.example.com", "other.example.com"],
                },
            });
            const filter: CredentialFilter = {
                homeAccountId: token.homeAccountId,
                environment: "query.example.com",
                credentialType: token.credentialType,
                clientId: token.clientId,
                realm: token.realm,
                target: ScopeSet.fromString("scope.read", ""),
            };

            expect(nodeStorage.getAccessTokensByFilter(filter, "")).toEqual([]);
            nodeStorage.setAuthorityMetadata(firstKey, {
                ...nodeStorage.getAuthorityMetadata(firstKey)!,
                token_endpoint: "https://query.example.com/updated-token",
            });
            expect(
                nodeStorage.getAuthorityMetadataByAlias("query.example.com", "")
            ).toEqual(nodeStorage.getAuthorityMetadata(lastKey));
            expect(nodeStorage.getAccessTokensByFilter(filter, "")).toEqual([]);

            nodeStorage.removeItem(lastKey);
            expect(nodeStorage.getAccessTokensByFilter(filter, "")).toEqual([
                token,
            ]);

            const firstMetadata = nodeStorage.getAuthorityMetadata(firstKey)!;
            firstMetadata.aliases.push("mutated-query.example.com");
            nodeStorage.setAuthorityMetadata(firstKey, firstMetadata);
            expect(
                nodeStorage.getAccessTokensByFilter(
                    {
                        ...filter,
                        environment: "mutated-query.example.com",
                    },
                    ""
                )
            ).toEqual([token]);
        });

        it("updates only authority indexes when metadata changes", () => {
            const nodeStorage = new NodeStorage(
                logger,
                clientId,
                DEFAULT_CRYPTO_IMPLEMENTATION
            );
            const token = createAccessToken({
                environment: "cache.example.com",
            });
            const metadataKey = `authority-metadata-${clientId}-query.example.com`;
            const metadata: AuthorityMetadataEntity = {
                aliases: ["query.example.com", "cache.example.com"],
                preferred_cache: "cache.example.com",
                preferred_network: "query.example.com",
                canonical_authority: "https://query.example.com/tenant-id",
                authorization_endpoint: "https://query.example.com/authorize",
                token_endpoint: "https://query.example.com/token",
                end_session_endpoint: "https://query.example.com/logout",
                issuer: "https://query.example.com/tenant-id",
                jwks_uri: "https://query.example.com/keys",
                aliasesFromNetwork: true,
                endpointsFromNetwork: true,
                expiresAt: CacheHelpers.generateAuthorityMetadataExpiresAt(),
            };
            nodeStorage.setCache({
                [generateCredentialKey(token)]: token,
                [metadataKey]: metadata,
            });
            const rebuildSpy = jest.spyOn(
                nodeStorage as unknown as { rebuildIndexes: () => void },
                "rebuildIndexes"
            );
            const changeEmitter = jest.fn();
            nodeStorage.registerChangeEmitter(changeEmitter);

            nodeStorage.setAuthorityMetadata(metadataKey, { ...metadata });
            expect(rebuildSpy).not.toHaveBeenCalled();
            expect(changeEmitter).not.toHaveBeenCalled();

            const updatedMetadata = {
                ...metadata,
                aliases: ["updated.example.com", "cache.example.com"],
            };
            nodeStorage.setAuthorityMetadata(metadataKey, updatedMetadata);
            expect(rebuildSpy).not.toHaveBeenCalled();
            expect(changeEmitter).toHaveBeenCalledTimes(1);
            expect(
                nodeStorage.getAuthorityMetadataByAlias("query.example.com", "")
            ).toBeNull();
            expect(
                nodeStorage.getAuthorityMetadataByAlias(
                    "updated.example.com",
                    ""
                )
            ).toEqual(updatedMetadata);
            expect(
                nodeStorage.getAccessTokensByFilter(
                    {
                        homeAccountId: token.homeAccountId,
                        environment: "updated.example.com",
                        credentialType: token.credentialType,
                        clientId: token.clientId,
                        realm: token.realm,
                        target: ScopeSet.fromString("scope.read", ""),
                    },
                    ""
                )
            ).toEqual([token]);
        });

        it("rolls back an externally supplied entry when indexing fails", () => {
            const nodeStorage = createIndexedStorage();
            const malformedToken = createAccessToken();
            const malformedKey = generateCredentialKey(malformedToken);
            Object.defineProperty(malformedToken, "target", {
                enumerable: true,
                get: () => {
                    throw new Error("malformed target");
                },
            });

            expect(() =>
                nodeStorage.setItem(malformedKey, malformedToken)
            ).toThrow("malformed target");
            expect(nodeStorage.getItem(malformedKey)).toBeUndefined();

            const token = createAccessToken();
            nodeStorage.setItem(generateCredentialKey(token), token);
            expect(
                nodeStorage.getAccessTokensByFilter(
                    {
                        homeAccountId: token.homeAccountId,
                        environment: "login.microsoftonline.com",
                        credentialType: token.credentialType,
                        clientId: token.clientId,
                        realm: token.realm,
                        target: ScopeSet.fromString("scope.read", ""),
                    },
                    ""
                )
            ).toEqual([token]);
        });

        it("finds authority metadata without inspecting unrelated entries", () => {
            const nodeStorage = new NodeStorage(
                logger,
                clientId,
                DEFAULT_CRYPTO_IMPLEMENTATION
            );
            const authorityMetadataKey = `authority-metadata-${clientId}-login.microsoftonline.com`;
            const authorityMetadata: AuthorityMetadataEntity = {
                aliases: ["login.microsoftonline.com", "login.windows.net"],
                preferred_cache: "login.windows.net",
                preferred_network: "login.microsoftonline.com",
                canonical_authority: TEST_CONSTANTS.DEFAULT_AUTHORITY,
                authorization_endpoint:
                    DEFAULT_OPENID_CONFIG_RESPONSE.body.authorization_endpoint,
                token_endpoint:
                    DEFAULT_OPENID_CONFIG_RESPONSE.body.token_endpoint,
                end_session_endpoint:
                    DEFAULT_OPENID_CONFIG_RESPONSE.body.end_session_endpoint,
                issuer: DEFAULT_OPENID_CONFIG_RESPONSE.body.issuer,
                jwks_uri: DEFAULT_OPENID_CONFIG_RESPONSE.body.jwks_uri,
                aliasesFromNetwork: true,
                endpointsFromNetwork: true,
                expiresAt: CacheHelpers.generateAuthorityMetadataExpiresAt(),
            };
            const cache: Record<
                string,
                AccessTokenEntity | AuthorityMetadataEntity
            > = {
                [authorityMetadataKey]: authorityMetadata,
            };
            for (let i = 0; i < 1000; i++) {
                const unrelatedToken = createAccessToken({
                    clientId: `unrelated-client-${i}`,
                    secret: `unrelated-token-${i}`,
                });
                cache[generateCredentialKey(unrelatedToken)] = unrelatedToken;
            }
            nodeStorage.setCache(cache);
            const getAuthorityMetadataSpy = jest.spyOn(
                nodeStorage,
                "getAuthorityMetadata"
            );

            expect(
                nodeStorage.getAuthorityMetadataByAlias("login.windows.net", "")
            ).toEqual(authorityMetadata);
            expect(getAuthorityMetadataSpy).toHaveBeenCalledTimes(1);
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
