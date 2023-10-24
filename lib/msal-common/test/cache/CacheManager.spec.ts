/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    AuthenticationScheme,
    CredentialType,
} from "../../src/utils/Constants";
import { AccountEntity } from "../../src/cache/entities/AccountEntity";
import { AccessTokenEntity } from "../../src/cache/entities/AccessTokenEntity";
import { CacheRecord } from "../../src/cache/entities/CacheRecord";
import { AccountFilter } from "../../src/cache/utils/CacheTypes";
import sinon from "sinon";
import {
    TEST_CONFIG,
    TEST_TOKENS,
    ID_TOKEN_CLAIMS,
    CACHE_MOCKS,
    TEST_POP_VALUES,
    TEST_SSH_VALUES,
    TEST_CRYPTO_VALUES,
    TEST_ACCOUNT_INFO,
    TEST_TOKEN_LIFETIMES,
    ID_TOKEN_ALT_CLAIMS,
} from "../test_kit/StringConstants";
import {
    ClientAuthErrorCodes,
    createClientAuthError,
} from "../../src/error/ClientAuthError";
import { AccountInfo } from "../../src/account/AccountInfo";
import { MockCache } from "./MockCache";
import { mockCrypto } from "../client/ClientTestUtils";
import { TestError } from "../test_kit/TestErrors";
import { CacheManager } from "../../src/cache/CacheManager";
import { AuthorityMetadataEntity } from "../../src/cache/entities/AuthorityMetadataEntity";
import { AppMetadataEntity } from "../../src/cache/entities/AppMetadataEntity";
import { RefreshTokenEntity } from "../../src/cache/entities/RefreshTokenEntity";
import { IdTokenEntity } from "../../src/cache/entities/IdTokenEntity";
import { CommonSilentFlowRequest, ScopeSet } from "../../src";
import * as authorityMetadata from "../../src/authority/AuthorityMetadata";

describe("CacheManager.ts test cases", () => {
    const mockCache = new MockCache(CACHE_MOCKS.MOCK_CLIENT_ID, mockCrypto, {
        canonicalAuthority: TEST_CONFIG.validAuthority,
        cloudDiscoveryMetadata: JSON.parse(TEST_CONFIG.CLOUD_DISCOVERY_METADATA)
            .metadata,
        knownAuthorities: [TEST_CONFIG.validAuthorityHost],
    });
    let authorityMetadataStub: sinon.SinonStub;
    beforeEach(() => {
        mockCache.initializeCache();
        authorityMetadataStub = sinon
            .stub(CacheManager.prototype, "getAuthorityMetadataByAlias")
            .callsFake((host) => {
                const authorityMetadata = new AuthorityMetadataEntity();
                authorityMetadata.updateCloudDiscoveryMetadata(
                    {
                        aliases: [host],
                        preferred_cache: host,
                        preferred_network: host,
                    },
                    false
                );
                return authorityMetadata;
            });
    });

    afterEach(async () => {
        await mockCache.clearCache();
        sinon.restore();
    });

    describe("saveCacheRecord tests", () => {
        it("save account", async () => {
            const ac = new AccountEntity();
            ac.homeAccountId = "someUid.someUtid";
            ac.environment = "login.microsoftonline.com";
            ac.realm = "microsoft";
            ac.localAccountId = "object1234";
            ac.username = "Jane Goodman";
            ac.authorityType = "MSSTS";

            const accountKey = ac.generateAccountKey();
            const cacheRecord = new CacheRecord();
            cacheRecord.account = ac;
            await mockCache.cacheManager.saveCacheRecord(cacheRecord);
            const mockCacheAccount = mockCache.cacheManager.getAccount(
                accountKey
            ) as AccountEntity;
            if (!mockCacheAccount) {
                throw TestError.createTestSetupError(
                    "mockCacheAccount does not have a value"
                );
            }
            expect(mockCacheAccount.homeAccountId).toEqual("someUid.someUtid");
        });

        it("save accessToken", async () => {
            const at = new AccessTokenEntity();
            Object.assign(at, {
                homeAccountId: "someUid.someUtid",
                environment: "login.microsoftonline.com",
                credentialType: "AccessToken",
                clientId: "mock_client_id",
                secret: "an access token sample",
                realm: "microsoft",
                target: "scope6 scope7",
                cachedAt: "1000",
                expiresOn: "4600",
                extendedExpiresOn: "4600",
                tokenType: "Bearer",
            });

            const atKey = at.generateCredentialKey();
            const cacheRecord = new CacheRecord();
            cacheRecord.accessToken = at;
            await mockCache.cacheManager.saveCacheRecord(cacheRecord);
            const mockCacheAT = mockCache.cacheManager.getAccessTokenCredential(
                atKey
            ) as AccessTokenEntity;
            if (!mockCacheAT) {
                throw TestError.createTestSetupError(
                    "mockCacheAT does not have a value"
                );
            }
            expect(mockCacheAT.homeAccountId).toEqual("someUid.someUtid");
            expect(mockCacheAT.credentialType).toEqual(
                CredentialType.ACCESS_TOKEN
            );
            expect(mockCacheAT.tokenType).toEqual(AuthenticationScheme.BEARER);
        });

        it("does not save accessToken if storeInCache.accessToken = false", async () => {
            const at = AccessTokenEntity.createAccessTokenEntity(
                TEST_ACCOUNT_INFO.homeAccountId,
                TEST_ACCOUNT_INFO.environment,
                TEST_TOKENS.ACCESS_TOKEN,
                TEST_CONFIG.MSAL_CLIENT_ID,
                TEST_CONFIG.MSAL_TENANT_ID,
                "User.Read",
                TEST_TOKEN_LIFETIMES.TEST_ACCESS_TOKEN_EXP,
                TEST_TOKEN_LIFETIMES.TEST_ACCESS_TOKEN_EXP,
                mockCrypto
            );

            const atKey = at.generateCredentialKey();
            const cacheRecord = new CacheRecord();
            cacheRecord.accessToken = at;
            await mockCache.cacheManager.saveCacheRecord(cacheRecord, {
                accessToken: false,
            });
            const mockCacheAT =
                mockCache.cacheManager.getAccessTokenCredential(atKey);
            expect(mockCacheAT).toBe(null);
        });

        it("save accessToken with Auth Scheme (pop)", async () => {
            const at = new AccessTokenEntity();
            Object.assign(at, {
                homeAccountId: "someUid.someUtid",
                environment: "login.microsoftonline.com",
                credentialType: "AccessToken_With_AuthScheme",
                clientId: "mock_client_id",
                secret: "an access token sample",
                realm: "microsoft",
                target: "scope6 scope7",
                cachedAt: "1000",
                expiresOn: "4600",
                extendedExpiresOn: "4600",
                keyId: "some_key",
                tokenType: "pop",
            });

            const atKey = at.generateCredentialKey();
            const cacheRecord = new CacheRecord();
            cacheRecord.accessToken = at;
            await mockCache.cacheManager.saveCacheRecord(cacheRecord);
            const mockCacheAT = mockCache.cacheManager.getAccessTokenCredential(
                atKey
            ) as AccessTokenEntity;
            if (!mockCacheAT) {
                throw TestError.createTestSetupError(
                    "mockCacheAT does not have a value"
                );
            }
            expect(mockCacheAT.homeAccountId).toEqual("someUid.someUtid");
            expect(mockCacheAT.credentialType).toEqual(
                CredentialType.ACCESS_TOKEN_WITH_AUTH_SCHEME
            );
            expect(mockCacheAT.tokenType).toEqual(AuthenticationScheme.POP);
            expect(mockCacheAT.keyId).toBeDefined();
        });

        it("does not save idToken if storeInCache.idToken = false", async () => {
            const idToken = IdTokenEntity.createIdTokenEntity(
                TEST_ACCOUNT_INFO.homeAccountId,
                TEST_ACCOUNT_INFO.environment,
                TEST_TOKENS.IDTOKEN_V2_NEWCLAIM,
                TEST_CONFIG.MSAL_CLIENT_ID,
                TEST_CONFIG.MSAL_TENANT_ID
            );

            const idTokenKey = idToken.generateCredentialKey();
            const cacheRecord = new CacheRecord();
            cacheRecord.idToken = idToken;
            await mockCache.cacheManager.saveCacheRecord(cacheRecord, {
                idToken: false,
            });
            const mockCacheId =
                mockCache.cacheManager.getIdTokenCredential(idTokenKey);
            expect(mockCacheId).toBe(null);
        });

        it("getIdToken matches multiple tokens, removes them and returns null", async () => {
            await mockCache.cacheManager.clear();

            const idToken1 = IdTokenEntity.createIdTokenEntity(
                TEST_ACCOUNT_INFO.homeAccountId,
                TEST_ACCOUNT_INFO.environment,
                TEST_TOKENS.IDTOKEN_V2,
                CACHE_MOCKS.MOCK_CLIENT_ID,
                TEST_ACCOUNT_INFO.tenantId
            );

            const idToken2 = IdTokenEntity.createIdTokenEntity(
                TEST_ACCOUNT_INFO.homeAccountId,
                TEST_ACCOUNT_INFO.environment,
                TEST_TOKENS.IDTOKEN_V2_NEWCLAIM,
                CACHE_MOCKS.MOCK_CLIENT_ID,
                TEST_ACCOUNT_INFO.tenantId
            );
            idToken2.target = "test-target";

            mockCache.cacheManager.setIdTokenCredential(idToken1);
            mockCache.cacheManager.setIdTokenCredential(idToken2);

            expect(
                mockCache.cacheManager.getTokenKeys().idToken.length
            ).toEqual(2);
            expect(
                mockCache.cacheManager.getIdToken(
                    TEST_ACCOUNT_INFO,
                    undefined,
                    TEST_ACCOUNT_INFO.tenantId
                )
            ).toBeNull();
            expect(
                mockCache.cacheManager.getTokenKeys().idToken.length
            ).toEqual(0);
        });

        it("does not save refreshToken if storeInCache.refreshToken = false", async () => {
            const refreshToken = RefreshTokenEntity.createRefreshTokenEntity(
                TEST_ACCOUNT_INFO.homeAccountId,
                TEST_ACCOUNT_INFO.environment,
                TEST_TOKENS.REFRESH_TOKEN,
                TEST_CONFIG.MSAL_CLIENT_ID
            );

            const refreshTokenKey = refreshToken.generateCredentialKey();
            const cacheRecord = new CacheRecord();
            cacheRecord.refreshToken = refreshToken;
            await mockCache.cacheManager.saveCacheRecord(cacheRecord, {
                refreshToken: false,
            });
            const mockCacheRT =
                mockCache.cacheManager.getRefreshTokenCredential(
                    refreshTokenKey
                );
            expect(mockCacheRT).toBe(null);
        });
    });

    describe("getAllAccounts", () => {
        const account1 = CACHE_MOCKS.MOCK_ACCOUNT_INFO;
        const account2 = CACHE_MOCKS.MOCK_ACCOUNT_INFO_WITH_NATIVE_ACCOUNT_ID;
        it("getAllAccounts (gets all AccountInfo objects)", async () => {
            const accounts = mockCache.cacheManager.getAllAccounts();

            expect(accounts).not.toBeNull();
            expect(accounts[0].idTokenClaims).toEqual(ID_TOKEN_CLAIMS);
        });

        describe("getAllAccounts with loginHint filter", () => {
            it("loginHint filter matching login_hint ID token claim", () => {
                // filter by loginHint = login_hint
                const loginHint = "testLoginHint";
                const successFilter: AccountFilter = {
                    loginHint: loginHint,
                };
                jest.spyOn(mockCrypto, "base64Decode").mockReturnValueOnce(
                    JSON.stringify({ login_hint: loginHint })
                );
                let accounts =
                    mockCache.cacheManager.getAllAccounts(successFilter);
                expect(accounts.length).toEqual(1);

                const wrongFilter: AccountFilter = {
                    loginHint: "WrongHint",
                };
                accounts = mockCache.cacheManager.getAllAccounts(wrongFilter);
                expect(accounts.length).toBe(0);
            });

            it("loginHint filter matching username", () => {
                // filter by loginHint = preferred_username
                const username = "janedoe@microsoft.com";
                const successFilter: AccountFilter = {
                    loginHint: username,
                };
                jest.spyOn(mockCrypto, "base64Decode").mockReturnValueOnce(
                    JSON.stringify({ preferred_username: username })
                );
                let accounts =
                    mockCache.cacheManager.getAllAccounts(successFilter);
                expect(accounts.length).toEqual(1);

                const wrongFilter: AccountFilter = {
                    loginHint: "WrongHint",
                };
                accounts = mockCache.cacheManager.getAllAccounts(wrongFilter);
                expect(accounts.length).toBe(0);
            });

            it("loginHint filter matching upn ID token claim", () => {
                // filter by loginHint = upn
                const upn = "testUpn";
                const successFilter: AccountFilter = {
                    loginHint: upn,
                };

                jest.spyOn(mockCrypto, "base64Decode").mockReturnValueOnce(
                    JSON.stringify({ upn: upn })
                );
                let accounts =
                    mockCache.cacheManager.getAllAccounts(successFilter);
                expect(accounts.length).toEqual(1);

                const wrongFilter: AccountFilter = {
                    loginHint: "WrongHint",
                };
                accounts = mockCache.cacheManager.getAllAccounts(wrongFilter);
                expect(accounts.length).toBe(0);
            });
        });

        it("Matches accounts by username", () => {
            expect(mockCache.cacheManager.getAllAccounts()).toHaveLength(2);
            const account1Filter = { username: account1.username };
            const account2Filter = { username: account2.username };
            expect(
                mockCache.cacheManager.getAllAccounts(account1Filter)
            ).toHaveLength(1);
            expect(
                mockCache.cacheManager.getAllAccounts(account1Filter)[0]
                    .username
            ).toBe(account1.username);
            expect(
                mockCache.cacheManager.getAllAccounts(account2Filter)
            ).toHaveLength(1);
            expect(
                mockCache.cacheManager.getAllAccounts(account2Filter)[0]
                    .username
            ).toBe(account2.username);
        });

        it("Matches accounts by homeAccountId", () => {
            expect(mockCache.cacheManager.getAllAccounts()).toHaveLength(2);
            const account1Filter = {
                homeAccountId: account1.homeAccountId,
            };
            const account2Filter = {
                homeAccountId: account2.homeAccountId,
            };
            expect(
                mockCache.cacheManager.getAllAccounts(account1Filter)
            ).toHaveLength(1);
            expect(
                mockCache.cacheManager.getAllAccounts(account1Filter)[0]
                    .homeAccountId
            ).toBe(account1.homeAccountId);
            expect(
                mockCache.cacheManager.getAllAccounts(account2Filter)
            ).toHaveLength(1);
            expect(
                mockCache.cacheManager.getAllAccounts(account2Filter)[0]
                    .homeAccountId
            ).toBe(account2.homeAccountId);
        });

        it("Matches accounts by localAccountId", () => {
            expect(mockCache.cacheManager.getAllAccounts()).toHaveLength(2);
            // Local account ID is sourced from ID token claims so for this test we compare against the decoded ID token claims instead of mock account object
            const account1Filter = {
                localAccountId: ID_TOKEN_CLAIMS.oid,
            };
            const account2Filter = {
                localAccountId: ID_TOKEN_ALT_CLAIMS.oid,
            };
            expect(
                mockCache.cacheManager.getAllAccounts(account1Filter)
            ).toHaveLength(1);
            expect(
                mockCache.cacheManager.getAllAccounts(account1Filter)[0]
                    .localAccountId
            ).toBe(account1Filter.localAccountId);
            expect(
                mockCache.cacheManager.getAllAccounts(account2Filter)
            ).toHaveLength(1);
            expect(
                mockCache.cacheManager.getAllAccounts(account2Filter)[0]
                    .localAccountId
            ).toBe(account2Filter.localAccountId);
        });

        it("Matches accounts by tenantId", () => {
            expect(mockCache.cacheManager.getAllAccounts()).toHaveLength(2);
            const account1Filter = {
                tenantId: account1.tenantId,
            };
            const account2Filter = {
                tenantId: account2.tenantId,
            };
            expect(
                mockCache.cacheManager.getAllAccounts(account1Filter)
            ).toHaveLength(1);
            expect(
                mockCache.cacheManager.getAllAccounts(account1Filter)[0]
                    .tenantId
            ).toBe(account1Filter.tenantId);
            expect(
                mockCache.cacheManager.getAllAccounts(account2Filter)
            ).toHaveLength(1);
            expect(
                mockCache.cacheManager.getAllAccounts(account2Filter)[0]
                    .tenantId
            ).toBe(account2Filter.tenantId);
        });

        it("Matches accounts by environment", () => {
            expect(mockCache.cacheManager.getAllAccounts()).toHaveLength(2);
            // Add local account ID to further filter because environments are aliases of eachother
            const account1Filter = {
                homeAccountId: account1.homeAccountId,
                environment: account1.environment,
            };
            const account2Filter = {
                homeAccountId: account2.homeAccountId,
                environment: account2.environment,
            };
            expect(
                mockCache.cacheManager.getAllAccounts(account1Filter)
            ).toHaveLength(1);
            expect(
                mockCache.cacheManager.getAllAccounts(account1Filter)[0]
                    .environment
            ).toBe(account1.environment);
            expect(
                mockCache.cacheManager.getAllAccounts(account2Filter)
            ).toHaveLength(1);
            expect(
                mockCache.cacheManager.getAllAccounts(account2Filter)[0]
                    .environment
            ).toBe(account2.environment);
        });

        it("Matches accounts by all filters", () => {
            expect(mockCache.cacheManager.getAllAccounts()).toHaveLength(2);
            const account1Filter = {
                ...account1,
                localAccountId: ID_TOKEN_CLAIMS.oid,
            };
            const account2Filter = {
                ...account2,
                localAccountId: ID_TOKEN_ALT_CLAIMS.oid,
            };
            expect(
                mockCache.cacheManager.getAllAccounts(account1Filter)
            ).toHaveLength(1);
            expect(
                mockCache.cacheManager.getAllAccounts(account1Filter)[0]
                    .localAccountId
            ).toBe(account1Filter.localAccountId);
            expect(
                mockCache.cacheManager.getAllAccounts(account2Filter)
            ).toHaveLength(1);
            expect(
                mockCache.cacheManager.getAllAccounts(account2Filter)[0]
                    .localAccountId
            ).toBe(account2Filter.localAccountId);
        });
    });

    it("getAccount (gets one AccountEntity object)", async () => {
        const ac = new AccountEntity();
        ac.homeAccountId = "someUid.someUtid";
        ac.environment = "login.microsoftonline.com";
        ac.realm = "microsoft";
        ac.localAccountId = "object1234";
        ac.username = "Jane Goodman";
        ac.authorityType = "MSSTS";

        const accountKey = ac.generateAccountKey();
        const cacheRecord = new CacheRecord();
        cacheRecord.account = ac;
        await mockCache.cacheManager.saveCacheRecord(cacheRecord);

        const cacheAccount = mockCache.cacheManager.getAccount(
            accountKey
        ) as AccountEntity;
        expect(cacheAccount.homeAccountId).toEqual("someUid.someUtid");
        expect(mockCache.cacheManager.getAccount("")).toBeNull();
    });

    it("getAccessTokenCredential (Bearer)", async () => {
        const accessTokenEntity = new AccessTokenEntity();
        accessTokenEntity.homeAccountId = "someUid.someUtid";
        accessTokenEntity.environment = "login.microsoftonline.com";
        accessTokenEntity.realm = "microsoft";
        accessTokenEntity.clientId = "mock_client_id";
        accessTokenEntity.credentialType = CredentialType.ACCESS_TOKEN;
        accessTokenEntity.target = "scope6 scope7";

        const credKey = accessTokenEntity.generateCredentialKey();
        const cacheRecord = new CacheRecord();
        cacheRecord.accessToken = accessTokenEntity;
        await mockCache.cacheManager.saveCacheRecord(cacheRecord);

        const cachedAccessToken =
            mockCache.cacheManager.getAccessTokenCredential(
                credKey
            ) as AccessTokenEntity;
        expect(cachedAccessToken.homeAccountId).toEqual("someUid.someUtid");
        expect(cachedAccessToken.credentialType).toEqual(
            CredentialType.ACCESS_TOKEN
        );
    });

    it("getAccessTokenCredential (POP)", async () => {
        const accessTokenEntity = new AccessTokenEntity();
        accessTokenEntity.homeAccountId = "someUid.someUtid";
        accessTokenEntity.environment = "login.microsoftonline.com";
        accessTokenEntity.realm = "microsoft";
        accessTokenEntity.clientId = "mock_client_id";
        accessTokenEntity.credentialType =
            CredentialType.ACCESS_TOKEN_WITH_AUTH_SCHEME;
        accessTokenEntity.target = "scope6 scope7";

        const credKey = accessTokenEntity.generateCredentialKey();
        const cacheRecord = new CacheRecord();
        cacheRecord.accessToken = accessTokenEntity;
        await mockCache.cacheManager.saveCacheRecord(cacheRecord);

        const cachedAccessToken =
            mockCache.cacheManager.getAccessTokenCredential(
                credKey
            ) as AccessTokenEntity;
        expect(cachedAccessToken.homeAccountId).toEqual("someUid.someUtid");
        expect(cachedAccessToken.credentialType).toEqual(
            CredentialType.ACCESS_TOKEN_WITH_AUTH_SCHEME
        );
    });

    describe("getAccountsFilteredBy", () => {
        it("homeAccountId filter", () => {
            // filter by homeAccountId
            const successFilter: AccountFilter = { homeAccountId: "uid.utid" };
            let accounts =
                mockCache.cacheManager.getAccountsFilteredBy(successFilter);
            expect(Object.keys(accounts).length).toEqual(1);

            const wrongFilter: AccountFilter = { homeAccountId: "Wrong Id" };
            accounts =
                mockCache.cacheManager.getAccountsFilteredBy(wrongFilter);
            expect(Object.keys(accounts).length).toEqual(0);
        });

        it("environment filter", () => {
            // filter by environment
            const successFilter: AccountFilter = {
                environment: "login.microsoftonline.com",
            };
            let accounts =
                mockCache.cacheManager.getAccountsFilteredBy(successFilter);
            // Both cached accounts have environments that are aliases of eachother, expect both to match
            expect(Object.keys(accounts).length).toEqual(2);
            sinon.restore();

            const wrongFilter: AccountFilter = { environment: "Wrong Env" };
            accounts =
                mockCache.cacheManager.getAccountsFilteredBy(wrongFilter);
            expect(Object.keys(accounts).length).toEqual(0);
        });

        it("realm filter", () => {
            // filter by realm
            const successFilter: AccountFilter = { realm: ID_TOKEN_CLAIMS.tid };
            let accounts =
                mockCache.cacheManager.getAccountsFilteredBy(successFilter);
            expect(Object.keys(accounts).length).toEqual(1);

            const wrongFilter: AccountFilter = { realm: "Wrong Realm" };
            accounts =
                mockCache.cacheManager.getAccountsFilteredBy(wrongFilter);
            expect(Object.keys(accounts).length).toEqual(0);
        });

        it("nativeAccountId filter", () => {
            // filter by nativeAccountId
            const successFilter: AccountFilter = {
                nativeAccountId: "mocked_native_account_id",
            };
            let accounts =
                mockCache.cacheManager.getAccountsFilteredBy(successFilter);
            expect(Object.keys(accounts).length).toEqual(1);

            const wrongFilter: AccountFilter = { realm: "notNativeAccountId" };
            accounts =
                mockCache.cacheManager.getAccountsFilteredBy(wrongFilter);
            expect(Object.keys(accounts).length).toEqual(0);
        });
    });

    describe("isCredentialKey", () => {
        it("Returns false if key doesn't contain enough '-' deliniated sections", () => {
            expect(
                mockCache.cacheManager.isCredentialKey(
                    "clientid-idToken-homeId"
                )
            ).toBe(false);
        });

        it("Returns false if key doesn't contain a valid credential type", () => {
            expect(
                mockCache.cacheManager.isCredentialKey(
                    `homeAccountId-environment-credentialType-${CACHE_MOCKS.MOCK_CLIENT_ID}-realm-target-requestedClaimsHash-scheme`
                )
            ).toBe(false);
        });

        it("Returns false if key doesn't contain clientId", () => {
            expect(
                mockCache.cacheManager.isCredentialKey(
                    `homeAccountId-environment-accessToken-clientId-realm-target-requestedClaimsHash-scheme`
                )
            ).toBe(false);
        });

        it("Returns true if key matches credential", () => {
            expect(
                mockCache.cacheManager.isCredentialKey(
                    `homeAccountId-environment-${CredentialType.ID_TOKEN}-${CACHE_MOCKS.MOCK_CLIENT_ID}-realm---`
                )
            ).toBe(true);
            expect(
                mockCache.cacheManager.isCredentialKey(
                    `homeAccountId-environment-${CredentialType.ACCESS_TOKEN}-${CACHE_MOCKS.MOCK_CLIENT_ID}-realm-target--`
                )
            ).toBe(true);
            expect(
                mockCache.cacheManager.isCredentialKey(
                    `homeAccountId-environment-${CredentialType.ACCESS_TOKEN_WITH_AUTH_SCHEME}-${CACHE_MOCKS.MOCK_CLIENT_ID}-realm-target-requestedClaimsHash-scheme`
                )
            ).toBe(true);
            expect(
                mockCache.cacheManager.isCredentialKey(
                    `homeAccountId-environment-${CredentialType.REFRESH_TOKEN}-${CACHE_MOCKS.MOCK_CLIENT_ID}-realm---`
                )
            ).toBe(true);
            expect(
                mockCache.cacheManager.isCredentialKey(
                    `homeAccountId-environment-${CredentialType.REFRESH_TOKEN}-1-realm---`
                )
            ).toBe(true); // FamilyId test
        });
    });

    describe("credentialMatchesFilter", () => {
        let testIdToken: IdTokenEntity;
        let testAccessToken: AccessTokenEntity;
        let testRefreshToken: RefreshTokenEntity;
        beforeEach(() => {
            const tokenKeys = mockCache.cacheManager.getTokenKeys();
            if (
                tokenKeys.idToken.length === 0 ||
                tokenKeys.accessToken.length === 0 ||
                tokenKeys.refreshToken.length === 0
            ) {
                throw new Error("Token keys empty");
            }
            testIdToken = mockCache.cacheManager.getIdTokenCredential(
                tokenKeys.idToken[0]
            ) as IdTokenEntity;
            testAccessToken = mockCache.cacheManager.getAccessTokenCredential(
                tokenKeys.accessToken[0]
            ) as AccessTokenEntity;
            testRefreshToken = mockCache.cacheManager.getRefreshTokenCredential(
                tokenKeys.refreshToken[0]
            ) as RefreshTokenEntity;

            if (!testIdToken || !testAccessToken || !testRefreshToken) {
                throw new Error("No tokens found in cache");
            }
        });

        it("homeAccountId filter", () => {
            // filter by homeAccountId
            expect(
                mockCache.cacheManager.credentialMatchesFilter(testIdToken, {
                    homeAccountId: testIdToken.homeAccountId,
                })
            ).toBe(true);
            expect(
                mockCache.cacheManager.credentialMatchesFilter(
                    testAccessToken,
                    {
                        homeAccountId: testAccessToken.homeAccountId,
                    }
                )
            ).toBe(true);
            expect(
                mockCache.cacheManager.credentialMatchesFilter(
                    testRefreshToken,
                    {
                        homeAccountId: testRefreshToken.homeAccountId,
                    }
                )
            ).toBe(true);

            // Test failure cases
            expect(
                mockCache.cacheManager.credentialMatchesFilter(testIdToken, {
                    homeAccountId: "someuid.someutid",
                })
            ).toBe(false);
            expect(
                mockCache.cacheManager.credentialMatchesFilter(
                    testAccessToken,
                    {
                        homeAccountId: "someuid.someutid",
                    }
                )
            ).toBe(false);
            expect(
                mockCache.cacheManager.credentialMatchesFilter(
                    testRefreshToken,
                    {
                        homeAccountId: "someuid.someutid",
                    }
                )
            ).toBe(false);
        });

        describe("environment filter", () => {
            afterEach(() => {
                jest.restoreAllMocks();
            });
            it("with configured static cloud discovery metadata", () => {
                // filter by environment
                expect(
                    mockCache.cacheManager.credentialMatchesFilter(
                        testIdToken,
                        {
                            environment: testIdToken.environment,
                        }
                    )
                ).toBe(true);
                expect(
                    mockCache.cacheManager.credentialMatchesFilter(
                        testAccessToken,
                        {
                            environment: testAccessToken.environment,
                        }
                    )
                ).toBe(true);
                expect(
                    mockCache.cacheManager.credentialMatchesFilter(
                        testRefreshToken,
                        {
                            environment: testRefreshToken.environment,
                        }
                    )
                ).toBe(true);

                // Test failure cases
                expect(
                    mockCache.cacheManager.credentialMatchesFilter(
                        testIdToken,
                        {
                            environment: "wrong.contoso.com",
                        }
                    )
                ).toBe(false);
                expect(
                    mockCache.cacheManager.credentialMatchesFilter(
                        testAccessToken,
                        {
                            environment: "wrong.contoso.com",
                        }
                    )
                ).toBe(false);
                expect(
                    mockCache.cacheManager.credentialMatchesFilter(
                        testRefreshToken,
                        {
                            environment: "wrong.contoso.com",
                        }
                    )
                ).toBe(false);
            });

            it("with hardcoded cloud discovery metadata", () => {
                jest.spyOn(
                    authorityMetadata,
                    "getAliasesFromConfigMetadata"
                ).mockReturnValue(null);
                // filter by environment
                expect(
                    mockCache.cacheManager.credentialMatchesFilter(
                        testIdToken,
                        {
                            environment: testIdToken.environment,
                        }
                    )
                ).toBe(true);
                expect(
                    mockCache.cacheManager.credentialMatchesFilter(
                        testAccessToken,
                        {
                            environment: testAccessToken.environment,
                        }
                    )
                ).toBe(true);
                expect(
                    mockCache.cacheManager.credentialMatchesFilter(
                        testRefreshToken,
                        {
                            environment: testRefreshToken.environment,
                        }
                    )
                ).toBe(true);

                // Test failure cases
                expect(
                    mockCache.cacheManager.credentialMatchesFilter(
                        testIdToken,
                        {
                            environment: "wrong.contoso.com",
                        }
                    )
                ).toBe(false);
                expect(
                    mockCache.cacheManager.credentialMatchesFilter(
                        testAccessToken,
                        {
                            environment: "wrong.contoso.com",
                        }
                    )
                ).toBe(false);
                expect(
                    mockCache.cacheManager.credentialMatchesFilter(
                        testRefreshToken,
                        {
                            environment: "wrong.contoso.com",
                        }
                    )
                ).toBe(false);
            });

            it("with knownAuthorities", () => {
                jest.spyOn(
                    authorityMetadata,
                    "getAliasesFromConfigMetadata"
                ).mockReturnValue(null);
                jest.spyOn(
                    authorityMetadata,
                    "getHardcodedAliasesForCanonicalAuthority"
                ).mockReturnValue(null);
                // filter by environment
                expect(
                    mockCache.cacheManager.credentialMatchesFilter(
                        testIdToken,
                        {
                            environment: testIdToken.environment,
                        }
                    )
                ).toBe(true);
                expect(
                    mockCache.cacheManager.credentialMatchesFilter(
                        testAccessToken,
                        {
                            environment: testAccessToken.environment,
                        }
                    )
                ).toBe(true);
                expect(
                    mockCache.cacheManager.credentialMatchesFilter(
                        testRefreshToken,
                        {
                            environment: testRefreshToken.environment,
                        }
                    )
                ).toBe(true);

                // Test failure cases
                expect(
                    mockCache.cacheManager.credentialMatchesFilter(
                        testIdToken,
                        {
                            environment: "wrong.contoso.com",
                        }
                    )
                ).toBe(false);
                expect(
                    mockCache.cacheManager.credentialMatchesFilter(
                        testAccessToken,
                        {
                            environment: "wrong.contoso.com",
                        }
                    )
                ).toBe(false);
                expect(
                    mockCache.cacheManager.credentialMatchesFilter(
                        testRefreshToken,
                        {
                            environment: "wrong.contoso.com",
                        }
                    )
                ).toBe(false);
            });
        });

        it("realm filter", () => {
            // filter by realm
            expect(
                mockCache.cacheManager.credentialMatchesFilter(testIdToken, {
                    realm: testIdToken.realm,
                })
            ).toBe(true);
            expect(
                mockCache.cacheManager.credentialMatchesFilter(
                    testAccessToken,
                    {
                        realm: testAccessToken.realm,
                    }
                )
            ).toBe(true);
            expect(
                mockCache.cacheManager.credentialMatchesFilter(
                    testRefreshToken,
                    {
                        realm: testRefreshToken.realm,
                    }
                )
            ).toBe(true);

            // Test failure cases
            expect(
                mockCache.cacheManager.credentialMatchesFilter(testIdToken, {
                    realm: "fake-realm",
                })
            ).toBe(false);
            expect(
                mockCache.cacheManager.credentialMatchesFilter(
                    testAccessToken,
                    {
                        realm: "fake-realm",
                    }
                )
            ).toBe(false);
            expect(
                mockCache.cacheManager.credentialMatchesFilter(
                    testRefreshToken,
                    {
                        realm: "fake-realm",
                    }
                )
            ).toBe(false);
        });

        it("credentialType filter", () => {
            // filter by credentialType
            expect(
                mockCache.cacheManager.credentialMatchesFilter(testIdToken, {
                    credentialType: CredentialType.ID_TOKEN,
                })
            ).toBe(true);
            expect(
                mockCache.cacheManager.credentialMatchesFilter(
                    testAccessToken,
                    {
                        credentialType: CredentialType.ACCESS_TOKEN,
                    }
                )
            ).toBe(true);
            expect(
                mockCache.cacheManager.credentialMatchesFilter(
                    testRefreshToken,
                    {
                        credentialType: CredentialType.REFRESH_TOKEN,
                    }
                )
            ).toBe(true);

            // Test failure cases
            expect(
                mockCache.cacheManager.credentialMatchesFilter(testIdToken, {
                    credentialType: CredentialType.ACCESS_TOKEN,
                })
            ).toBe(false);
            expect(
                mockCache.cacheManager.credentialMatchesFilter(testIdToken, {
                    credentialType: CredentialType.REFRESH_TOKEN,
                })
            ).toBe(false);

            expect(
                mockCache.cacheManager.credentialMatchesFilter(
                    testAccessToken,
                    {
                        credentialType: CredentialType.ID_TOKEN,
                    }
                )
            ).toBe(false);
            expect(
                mockCache.cacheManager.credentialMatchesFilter(
                    testAccessToken,
                    {
                        credentialType: CredentialType.REFRESH_TOKEN,
                    }
                )
            ).toBe(false);

            expect(
                mockCache.cacheManager.credentialMatchesFilter(
                    testRefreshToken,
                    {
                        credentialType: CredentialType.ID_TOKEN,
                    }
                )
            ).toBe(false);
            expect(
                mockCache.cacheManager.credentialMatchesFilter(
                    testRefreshToken,
                    {
                        credentialType: CredentialType.ACCESS_TOKEN,
                    }
                )
            ).toBe(false);
        });

        it("credentialType filter (Access Tokens with and without Auth Scheme)", () => {
            const accessToken = mockCache.cacheManager.getAccessTokensByFilter({
                credentialType: "AccessToken",
            });
            expect(
                mockCache.cacheManager.credentialMatchesFilter(accessToken[0], {
                    credentialType: CredentialType.ACCESS_TOKEN,
                })
            ).toBe(true);
            expect(
                mockCache.cacheManager.credentialMatchesFilter(accessToken[0], {
                    credentialType:
                        CredentialType.ACCESS_TOKEN_WITH_AUTH_SCHEME,
                })
            ).toBe(false);

            const accessTokenWithAuthScheme =
                mockCache.cacheManager.getAccessTokensByFilter({
                    credentialType:
                        CredentialType.ACCESS_TOKEN_WITH_AUTH_SCHEME,
                });
            expect(
                mockCache.cacheManager.credentialMatchesFilter(
                    accessTokenWithAuthScheme[0],
                    { credentialType: CredentialType.ACCESS_TOKEN }
                )
            ).toBe(false);
            expect(
                mockCache.cacheManager.credentialMatchesFilter(
                    accessTokenWithAuthScheme[0],
                    {
                        credentialType:
                            CredentialType.ACCESS_TOKEN_WITH_AUTH_SCHEME,
                    }
                )
            ).toBe(true);
        });

        it("clientId filter", () => {
            // filter by clientId
            expect(
                mockCache.cacheManager.credentialMatchesFilter(testIdToken, {
                    clientId: testIdToken.clientId,
                })
            ).toBe(true);
            expect(
                mockCache.cacheManager.credentialMatchesFilter(
                    testAccessToken,
                    {
                        clientId: testAccessToken.clientId,
                    }
                )
            ).toBe(true);
            expect(
                mockCache.cacheManager.credentialMatchesFilter(
                    testRefreshToken,
                    {
                        clientId: testRefreshToken.clientId,
                    }
                )
            ).toBe(true);

            // Test failure cases
            expect(
                mockCache.cacheManager.credentialMatchesFilter(testIdToken, {
                    clientId: "wrong_client_id",
                })
            ).toBe(false);
            expect(
                mockCache.cacheManager.credentialMatchesFilter(
                    testAccessToken,
                    {
                        clientId: "wrong_client_id",
                    }
                )
            ).toBe(false);
            expect(
                mockCache.cacheManager.credentialMatchesFilter(
                    testRefreshToken,
                    {
                        clientId: "wrong_client_id",
                    }
                )
            ).toBe(false);
        });

        it("target filter", () => {
            // filter by target
            expect(
                mockCache.cacheManager.credentialMatchesFilter(
                    testAccessToken,
                    {
                        target: ScopeSet.createSearchScopes(
                            testAccessToken.target.split(" ")
                        ),
                    }
                )
            ).toBe(true);

            // Test failure cases
            expect(
                mockCache.cacheManager.credentialMatchesFilter(
                    testAccessToken,
                    {
                        target: ScopeSet.createSearchScopes(["wrong_scope"]),
                    }
                )
            ).toBe(false);
        });

        it("tokenType filter", () => {
            const accessToken = mockCache.cacheManager.getAccessTokensByFilter({
                credentialType: CredentialType.ACCESS_TOKEN_WITH_AUTH_SCHEME,
                tokenType: AuthenticationScheme.BEARER,
            });
            expect(
                mockCache.cacheManager.credentialMatchesFilter(accessToken[0], {
                    tokenType: AuthenticationScheme.BEARER,
                })
            ).toBe(true);
            expect(
                mockCache.cacheManager.credentialMatchesFilter(accessToken[0], {
                    tokenType: AuthenticationScheme.POP,
                })
            ).toBe(false);
            expect(
                mockCache.cacheManager.credentialMatchesFilter(accessToken[0], {
                    tokenType: AuthenticationScheme.SSH,
                })
            ).toBe(false);

            const popToken = mockCache.cacheManager.getAccessTokensByFilter({
                credentialType: CredentialType.ACCESS_TOKEN_WITH_AUTH_SCHEME,
                tokenType: AuthenticationScheme.POP,
            });
            expect(
                mockCache.cacheManager.credentialMatchesFilter(popToken[0], {
                    tokenType: AuthenticationScheme.BEARER,
                })
            ).toBe(false);
            expect(
                mockCache.cacheManager.credentialMatchesFilter(popToken[0], {
                    tokenType: AuthenticationScheme.POP,
                })
            ).toBe(true);
            expect(
                mockCache.cacheManager.credentialMatchesFilter(popToken[0], {
                    tokenType: AuthenticationScheme.SSH,
                })
            ).toBe(false);

            const sshToken = mockCache.cacheManager.getAccessTokensByFilter({
                credentialType: CredentialType.ACCESS_TOKEN_WITH_AUTH_SCHEME,
                tokenType: AuthenticationScheme.SSH,
            });
            expect(
                mockCache.cacheManager.credentialMatchesFilter(sshToken[0], {
                    tokenType: AuthenticationScheme.BEARER,
                })
            ).toBe(false);
            expect(
                mockCache.cacheManager.credentialMatchesFilter(sshToken[0], {
                    tokenType: AuthenticationScheme.POP,
                })
            ).toBe(false);
            expect(
                mockCache.cacheManager.credentialMatchesFilter(sshToken[0], {
                    tokenType: AuthenticationScheme.SSH,
                })
            ).toBe(true);
        });
    });

    describe("getAccessTokensByFilter", () => {
        it("keyId filter", () => {
            // filter by keyId
            const successFilter = {
                credentialType: CredentialType.ACCESS_TOKEN_WITH_AUTH_SCHEME,
                tokenType: AuthenticationScheme.SSH,
                keyId: "some_key_id",
            };

            let accessTokens =
                mockCache.cacheManager.getAccessTokensByFilter(successFilter);
            expect(accessTokens.length).toEqual(1);

            const wrongFilter = {
                ...successFilter,
                keyId: "wrong_key_id",
            };

            accessTokens =
                mockCache.cacheManager.getAccessTokensByFilter(wrongFilter);
            expect(accessTokens.length).toEqual(0);
        });

        it("requestedClaimsHash filter", () => {
            // requestedClaimsHash present and matching in request and cache
            const successFilterWithRCHash = {
                credentialType: CredentialType.ACCESS_TOKEN,
                requestedClaimsHash: TEST_CRYPTO_VALUES.TEST_SHA256_HASH,
            };

            let accessTokens = mockCache.cacheManager.getAccessTokensByFilter(
                successFilterWithRCHash
            );
            expect(accessTokens.length).toEqual(1);

            // requestedClaimsHash present in requeste and cache, not matching
            const wrongFilterWithRCHash = {
                ...successFilterWithRCHash,
                requestedClaimsHash: "wrong_hash",
            };

            accessTokens = mockCache.cacheManager.getAccessTokensByFilter(
                wrongFilterWithRCHash
            );
            expect(accessTokens.length).toEqual(0);
        });

        it("userAssertionHash filter", () => {
            // userAssertionHash present and matching in request and cache
            const successFilterWithRCHash = {
                credentialType: CredentialType.ACCESS_TOKEN,
                userAssertionHash: TEST_CRYPTO_VALUES.TEST_USER_ASSERTION_HASH,
            };

            let accessTokens = mockCache.cacheManager.getAccessTokensByFilter(
                successFilterWithRCHash
            );
            expect(accessTokens.length).toEqual(1);

            // userAssertionHash present in request and cache, not matching
            const wrongFilterWithRCHash = {
                ...successFilterWithRCHash,
                userAssertionHash: "wrong_hash",
            };

            accessTokens = mockCache.cacheManager.getAccessTokensByFilter(
                wrongFilterWithRCHash
            );
            expect(accessTokens.length).toEqual(0);
        });
    });

    it("getAppMetadata and readAppMetadataFromCache", () => {
        const appMetadataKey =
            "appmetadata-login.microsoftonline.com-mock_client_id";
        const appMetadata = mockCache.cacheManager.getAppMetadata(
            appMetadataKey
        ) as AppMetadataEntity;
        if (!appMetadata) {
            throw TestError.createTestSetupError(
                "appMetadata does not have a value"
            );
        }

        expect(appMetadata.clientId).toEqual(CACHE_MOCKS.MOCK_CLIENT_ID);
        expect(appMetadata.environment).toEqual(
            CACHE_MOCKS.MOCK_ACCOUNT_INFO.environment
        );

        const cachedAppMetadata =
            mockCache.cacheManager.readAppMetadataFromCache(
                CACHE_MOCKS.MOCK_ACCOUNT_INFO.environment
            ) as AppMetadataEntity;
        if (!cachedAppMetadata) {
            throw TestError.createTestSetupError(
                "appMetadata does not have a value"
            );
        }
        expect(cachedAppMetadata.clientId).toEqual(CACHE_MOCKS.MOCK_CLIENT_ID);
        expect(cachedAppMetadata.environment).toEqual(
            CACHE_MOCKS.MOCK_ACCOUNT_INFO.environment
        );
    });

    it("removeAppMetadata", () => {
        mockCache.cacheManager.removeAppMetadata();
        expect(
            mockCache.cacheManager.getAppMetadata(
                "appmetadata-login.microsoftonline.com-mock_client_id"
            )
        ).toBeUndefined();
    });

    it("removeAllAccounts", async () => {
        const ac = new AccountEntity();
        ac.homeAccountId = "someUid.someUtid";
        ac.environment = "login.microsoftonline.com";
        ac.realm = "microsoft";
        ac.localAccountId = "object1234";
        ac.username = "Jane Goodman";
        ac.authorityType = "MSSTS";

        const cacheRecord = new CacheRecord();
        cacheRecord.account = ac;
        await mockCache.cacheManager.saveCacheRecord(cacheRecord);

        await mockCache.cacheManager.removeAllAccounts();

        // Only app metadata remaining
        expect(mockCache.cacheManager.getAllAccounts().length === 0).toBe(true);
    });

    it("removeAccount", async () => {
        expect(
            mockCache.cacheManager.getAccount(
                "uid.utid-login.microsoftonline.com-utid"
            )
        ).not.toBeNull();
        await mockCache.cacheManager.removeAccount(
            "uid.utid-login.microsoftonline.com-utid"
        );
        expect(
            mockCache.cacheManager.getAccount(
                "uid.utid-login.microsoftonline.com-utid"
            )
        ).toBeNull();
    });

    it("removeAccessToken", async () => {
        const at = new AccessTokenEntity();
        Object.assign(at, {
            homeAccountId: "someUid.someUtid",
            environment: "login.microsoftonline.com",
            credentialType: "AccessToken",
            clientId: "mock_client_id",
            secret: "an access token sample",
            realm: "microsoft",
            target: "scope6 scope7",
            cachedAt: "1000",
            expiresOn: "4600",
            extendedExpiresOn: "4600",
        });

        await mockCache.cacheManager.removeAccessToken(
            at.generateCredentialKey()
        );
        const atKey = at.generateCredentialKey();
        expect(mockCache.cacheManager.getAccount(atKey)).toBeNull();
    });

    it("removes token binding key when removeAccessToken is called for a PoP AccessToken_With_AuthScheme credential", async () => {
        const atWithAuthScheme = new AccessTokenEntity();
        const atWithAuthSchemeData = {
            environment: "login.microsoftonline.com",
            credentialType: "AccessToken_With_AuthScheme",
            secret: "an access token",
            realm: "microsoft",
            target: "scope1 scope2 scope3",
            clientId: "mock_client_id",
            cachedAt: "1000",
            homeAccountId: "uid.utid",
            extendedExpiresOn: "4600",
            expiresOn: "4600",
            keyId: "V6N_HMPagNpYS_wxM14X73q3eWzbTr9Z31RyHkIcN0Y",
            tokenType: AuthenticationScheme.POP,
        };

        const removeTokenBindingKeySpy = sinon.spy(
            mockCrypto,
            "removeTokenBindingKey"
        );

        Object.assign(atWithAuthScheme, atWithAuthSchemeData);

        await mockCache.cacheManager.removeAccessToken(
            atWithAuthScheme.generateCredentialKey()
        );
        const atKey = atWithAuthScheme.generateCredentialKey();
        expect(mockCache.cacheManager.getAccount(atKey)).toBeNull();
        expect(removeTokenBindingKeySpy.getCall(0).args[0]).toEqual(
            atWithAuthSchemeData.keyId
        );
    });

    it("does not try to remove binding key when removeAccessToken is called for an SSH AccessToken_With_AuthScheme credential", async () => {
        const atWithAuthScheme = new AccessTokenEntity();
        const atWithAuthSchemeData = {
            environment: "login.microsoftonline.com",
            credentialType: "AccessToken_With_AuthScheme",
            secret: "an SSH Cert",
            realm: "microsoft",
            target: "scope1 scope2 scope3",
            clientId: "mock_client_id",
            cachedAt: "1000",
            homeAccountId: "uid.utid",
            extendedExpiresOn: "4600",
            expiresOn: "4600",
            keyId: "some_key_id",
            tokenType: AuthenticationScheme.SSH,
        };

        const removeTokenBindingKeySpy = sinon.spy(
            mockCrypto,
            "removeTokenBindingKey"
        );

        Object.assign(atWithAuthScheme, atWithAuthSchemeData);

        await mockCache.cacheManager.removeAccessToken(
            atWithAuthScheme.generateCredentialKey()
        );
        const atKey = atWithAuthScheme.generateCredentialKey();
        expect(mockCache.cacheManager.getAccount(atKey)).toBeNull();
        expect(removeTokenBindingKeySpy.callCount).toEqual(0);
    });

    it("throws bindingKeyNotRemoved error when key isn't deleted from storage", async () => {
        const atWithAuthScheme = new AccessTokenEntity();
        const atWithAuthSchemeData = {
            environment: "login.microsoftonline.com",
            credentialType: "AccessToken_With_AuthScheme",
            secret: "an access token",
            realm: "microsoft",
            target: "scope1 scope2 scope3",
            clientId: "mock_client_id",
            cachedAt: "1000",
            homeAccountId: "uid.utid",
            extendedExpiresOn: "4600",
            expiresOn: "4600",
            keyId: "V6N_HMPagNpYS_wxM14X73q3eWzbTr9Z31RyHkIcN0Y",
            tokenType: "pop",
        };

        Object.assign(atWithAuthScheme, atWithAuthSchemeData);

        jest.spyOn(mockCrypto, "removeTokenBindingKey").mockImplementation(
            (keyId: string): Promise<boolean> => {
                return Promise.reject();
            }
        );

        return await expect(
            mockCache.cacheManager.removeAccessToken(
                atWithAuthScheme.generateCredentialKey()
            )
        ).rejects.toThrow(
            createClientAuthError(ClientAuthErrorCodes.bindingKeyNotRemoved)
        );
    });

    it("getAccessToken matches multiple tokens, removes them and returns null", async () => {
        await mockCache.cacheManager.clear();

        const mockedAtEntity: AccessTokenEntity =
            AccessTokenEntity.createAccessTokenEntity(
                "uid.utid",
                "login.microsoftonline.com",
                "an_access_token",
                CACHE_MOCKS.MOCK_CLIENT_ID,
                TEST_CONFIG.TENANT,
                TEST_CONFIG.DEFAULT_GRAPH_SCOPE.toString(),
                4600,
                4600,
                mockCrypto,
                500,
                AuthenticationScheme.BEARER,
                TEST_TOKENS.ACCESS_TOKEN
            );

        const mockedAtEntity2: AccessTokenEntity =
            AccessTokenEntity.createAccessTokenEntity(
                "uid.utid",
                "login.microsoftonline.com",
                "an_access_token",
                CACHE_MOCKS.MOCK_CLIENT_ID,
                TEST_CONFIG.TENANT,
                "User.Read test_scope",
                4600,
                4600,
                mockCrypto,
                500,
                AuthenticationScheme.BEARER,
                TEST_TOKENS.ACCESS_TOKEN
            );

        const accountData = {
            username: "John Doe",
            localAccountId: "uid",
            realm: "common",
            environment: "login.microsoftonline.com",
            homeAccountId: "uid.utid",
            authorityType: "MSSTS",
            clientInfo: "eyJ1aWQiOiJ1aWQiLCAidXRpZCI6InV0aWQifQ==",
        };
        const mockedAccount: AccountEntity = CacheManager.toObject(
            new AccountEntity(),
            accountData
        );

        mockCache.cacheManager.setAccessTokenCredential(mockedAtEntity);
        mockCache.cacheManager.setAccessTokenCredential(mockedAtEntity2);
        mockCache.cacheManager.setAccount(mockedAccount);

        expect(
            mockCache.cacheManager.getTokenKeys().accessToken.length
        ).toEqual(2);

        const mockedAccountInfo: AccountInfo = {
            homeAccountId: "uid.utid",
            localAccountId: "uid",
            environment: "login.microsoftonline.com",
            tenantId: TEST_CONFIG.TENANT,
            username: "John Doe",
        };

        const silentFlowRequest: CommonSilentFlowRequest = {
            scopes: ["user.read"],
            account: mockedAccountInfo,
            authority: TEST_CONFIG.validAuthority,
            correlationId: TEST_CONFIG.CORRELATION_ID,
            forceRefresh: false,
        };

        expect(
            mockCache.cacheManager.getAccessToken(
                mockedAccountInfo,
                silentFlowRequest
            )
        ).toBeNull();
        expect(
            mockCache.cacheManager.getTokenKeys().accessToken.length
        ).toEqual(0);
    });

    it("getAccessToken only matches a Bearer Token when Authentication Scheme is set to Bearer", () => {
        const mockedAtEntity: AccessTokenEntity =
            AccessTokenEntity.createAccessTokenEntity(
                "uid.utid",
                "login.microsoftonline.com",
                "access_token",
                CACHE_MOCKS.MOCK_CLIENT_ID,
                TEST_CONFIG.TENANT,
                TEST_CONFIG.DEFAULT_GRAPH_SCOPE.toString(),
                4600,
                4600,
                mockCrypto,
                500,
                AuthenticationScheme.BEARER,
                TEST_TOKENS.ACCESS_TOKEN
            );

        const mockedPopAtEntity: AccessTokenEntity =
            AccessTokenEntity.createAccessTokenEntity(
                "uid.utid",
                "login.microsoftonline.com",
                TEST_TOKENS.POP_TOKEN,
                CACHE_MOCKS.MOCK_CLIENT_ID,
                TEST_CONFIG.TENANT,
                "User.Read test_scope",
                4600,
                4600,
                mockCrypto,
                500,
                AuthenticationScheme.POP,
                TEST_TOKENS.ACCESS_TOKEN
            );

        const mockedSshAtEntity: AccessTokenEntity =
            AccessTokenEntity.createAccessTokenEntity(
                "uid.utid",
                "login.microsoftonline.com",
                TEST_TOKENS.SSH_CERTIFICATE,
                CACHE_MOCKS.MOCK_CLIENT_ID,
                TEST_CONFIG.TENANT,
                "User.Read test_scope",
                4600,
                4600,
                mockCrypto,
                500,
                AuthenticationScheme.SSH,
                undefined,
                TEST_SSH_VALUES.SSH_KID
            );

        const accountData = {
            username: "John Doe",
            localAccountId: "uid",
            realm: "common",
            environment: "login.microsoftonline.com",
            homeAccountId: "uid.utid",
            authorityType: "MSSTS",
            clientInfo: "eyJ1aWQiOiJ1aWQiLCAidXRpZCI6InV0aWQifQ==",
        };
        const mockedAccount: AccountEntity = CacheManager.toObject(
            new AccountEntity(),
            accountData
        );

        mockCache.cacheManager.setAccessTokenCredential(mockedAtEntity);
        mockCache.cacheManager.setAccessTokenCredential(mockedPopAtEntity);
        mockCache.cacheManager.setAccessTokenCredential(mockedSshAtEntity);
        mockCache.cacheManager.setAccount(mockedAccount);

        const mockedAccountInfo: AccountInfo = {
            homeAccountId: "uid.utid",
            localAccountId: "uid",
            environment: "login.microsoftonline.com",
            tenantId: TEST_CONFIG.TENANT,
            username: "John Doe",
        };

        const silentFlowRequest: CommonSilentFlowRequest = {
            scopes: ["user.read"],
            account: mockedAccountInfo,
            authority: TEST_CONFIG.validAuthority,
            correlationId: TEST_CONFIG.CORRELATION_ID,
            forceRefresh: false,
        };

        expect(
            mockCache.cacheManager.getAccessToken(
                mockedAccountInfo,
                silentFlowRequest
            )
        ).toEqual(mockedAtEntity);
    });

    it("getAccessToken matches a Bearer Token when Authentication Scheme is set to bearer (lowercase from adfs)", () => {
        const mockedAtEntity: AccessTokenEntity =
            AccessTokenEntity.createAccessTokenEntity(
                "uid.utid",
                "login.microsoftonline.com",
                "access_token",
                CACHE_MOCKS.MOCK_CLIENT_ID,
                TEST_CONFIG.TENANT,
                TEST_CONFIG.DEFAULT_GRAPH_SCOPE.toString(),
                4600,
                4600,
                mockCrypto,
                500,
                // @ts-ignore
                AuthenticationScheme.BEARER.toLowerCase(),
                TEST_TOKENS.ACCESS_TOKEN
            );

        const accountData = {
            username: "John Doe",
            localAccountId: "uid",
            realm: "common",
            environment: "login.microsoftonline.com",
            homeAccountId: "uid.utid",
            authorityType: "MSSTS",
            clientInfo: "eyJ1aWQiOiJ1aWQiLCAidXRpZCI6InV0aWQifQ==",
        };
        const mockedAccount: AccountEntity = CacheManager.toObject(
            new AccountEntity(),
            accountData
        );

        mockCache.cacheManager.setAccessTokenCredential(mockedAtEntity);

        mockCache.cacheManager.setAccount(mockedAccount);

        const mockedAccountInfo: AccountInfo = {
            homeAccountId: "uid.utid",
            localAccountId: "uid",
            environment: "login.microsoftonline.com",
            tenantId: TEST_CONFIG.TENANT,
            username: "John Doe",
        };

        const silentFlowRequest: CommonSilentFlowRequest = {
            scopes: ["user.read"],
            account: mockedAccountInfo,
            authority: TEST_CONFIG.validAuthority,
            correlationId: TEST_CONFIG.CORRELATION_ID,
            forceRefresh: false,
        };

        expect(
            mockCache.cacheManager.getAccessToken(
                mockedAccountInfo,
                silentFlowRequest
            )
        ).toEqual(mockedAtEntity);
    });

    it("getAccessToken only matches a POP Token when Authentication Scheme is set to pop", () => {
        const mockedAtEntity: AccessTokenEntity =
            AccessTokenEntity.createAccessTokenEntity(
                "uid.utid",
                "login.microsoftonline.com",
                "access_token",
                CACHE_MOCKS.MOCK_CLIENT_ID,
                TEST_CONFIG.TENANT,
                TEST_CONFIG.DEFAULT_GRAPH_SCOPE.toString(),
                4600,
                4600,
                mockCrypto,
                500,
                AuthenticationScheme.BEARER,
                TEST_TOKENS.ACCESS_TOKEN
            );

        const mockedPopAtEntity: AccessTokenEntity =
            AccessTokenEntity.createAccessTokenEntity(
                "uid.utid",
                "login.microsoftonline.com",
                TEST_TOKENS.POP_TOKEN,
                CACHE_MOCKS.MOCK_CLIENT_ID,
                TEST_CONFIG.TENANT,
                "User.Read test_scope",
                4600,
                4600,
                mockCrypto,
                500,
                AuthenticationScheme.POP,
                TEST_TOKENS.ACCESS_TOKEN
            );

        const mockedSshAtEntity: AccessTokenEntity =
            AccessTokenEntity.createAccessTokenEntity(
                "uid.utid",
                "login.microsoftonline.com",
                TEST_TOKENS.SSH_CERTIFICATE,
                CACHE_MOCKS.MOCK_CLIENT_ID,
                TEST_CONFIG.TENANT,
                "User.Read test_scope",
                4600,
                4600,
                mockCrypto,
                500,
                AuthenticationScheme.SSH,
                undefined,
                TEST_SSH_VALUES.SSH_KID
            );

        const accountData = {
            username: "John Doe",
            localAccountId: "uid",
            realm: "common",
            environment: "login.microsoftonline.com",
            homeAccountId: "uid.utid",
            authorityType: "MSSTS",
            clientInfo: "eyJ1aWQiOiJ1aWQiLCAidXRpZCI6InV0aWQifQ==",
        };
        const mockedAccount: AccountEntity = CacheManager.toObject(
            new AccountEntity(),
            accountData
        );

        mockCache.cacheManager.setAccessTokenCredential(mockedAtEntity);
        mockCache.cacheManager.setAccessTokenCredential(mockedPopAtEntity);
        mockCache.cacheManager.setAccessTokenCredential(mockedSshAtEntity);
        mockCache.cacheManager.setAccount(mockedAccount);

        const mockedAccountInfo: AccountInfo = {
            homeAccountId: "uid.utid",
            localAccountId: "uid",
            environment: "login.microsoftonline.com",
            tenantId: TEST_CONFIG.TENANT,
            username: "John Doe",
        };

        const silentFlowRequest: CommonSilentFlowRequest = {
            scopes: ["user.read"],
            account: mockedAccountInfo,
            authority: TEST_CONFIG.validAuthority,
            correlationId: TEST_CONFIG.CORRELATION_ID,
            forceRefresh: false,
            authenticationScheme: AuthenticationScheme.POP,
        };

        expect(
            mockCache.cacheManager.getAccessToken(
                mockedAccountInfo,
                silentFlowRequest
            )
        ).toEqual(mockedPopAtEntity);
    });

    it("getAccessToken only matches an SSH Certificate when Authentication Scheme is set to ssh-cert", () => {
        const mockedAtEntity: AccessTokenEntity =
            AccessTokenEntity.createAccessTokenEntity(
                "uid.utid",
                "login.microsoftonline.com",
                "access_token",
                CACHE_MOCKS.MOCK_CLIENT_ID,
                TEST_CONFIG.TENANT,
                TEST_CONFIG.DEFAULT_GRAPH_SCOPE.toString(),
                4600,
                4600,
                mockCrypto,
                500,
                AuthenticationScheme.BEARER,
                undefined,
                undefined
            );

        const mockedPopAtEntity: AccessTokenEntity =
            AccessTokenEntity.createAccessTokenEntity(
                "uid.utid",
                "login.microsoftonline.com",
                TEST_TOKENS.POP_TOKEN,
                CACHE_MOCKS.MOCK_CLIENT_ID,
                TEST_CONFIG.TENANT,
                "User.Read test_scope",
                4600,
                4600,
                mockCrypto,
                500,
                AuthenticationScheme.POP,
                undefined,
                TEST_POP_VALUES.KID
            );

        const mockedSshAtEntity: AccessTokenEntity =
            AccessTokenEntity.createAccessTokenEntity(
                "uid.utid",
                "login.microsoftonline.com",
                TEST_TOKENS.SSH_CERTIFICATE,
                CACHE_MOCKS.MOCK_CLIENT_ID,
                TEST_CONFIG.TENANT,
                "User.Read test_scope",
                4600,
                4600,
                mockCrypto,
                500,
                AuthenticationScheme.SSH,
                undefined,
                TEST_SSH_VALUES.SSH_KID
            );

        const accountData = {
            username: "John Doe",
            localAccountId: "uid",
            realm: "common",
            environment: "login.microsoftonline.com",
            homeAccountId: "uid.utid",
            authorityType: "MSSTS",
            clientInfo: "eyJ1aWQiOiJ1aWQiLCAidXRpZCI6InV0aWQifQ==",
        };
        const mockedAccount: AccountEntity = CacheManager.toObject(
            new AccountEntity(),
            accountData
        );

        mockCache.cacheManager.setAccessTokenCredential(mockedAtEntity);
        mockCache.cacheManager.setAccessTokenCredential(mockedPopAtEntity);
        mockCache.cacheManager.setAccessTokenCredential(mockedSshAtEntity);
        mockCache.cacheManager.setAccount(mockedAccount);

        const mockedAccountInfo: AccountInfo = {
            homeAccountId: "uid.utid",
            localAccountId: "uid",
            environment: "login.microsoftonline.com",
            tenantId: TEST_CONFIG.TENANT,
            username: "John Doe",
        };

        const silentFlowRequest: CommonSilentFlowRequest = {
            scopes: ["user.read"],
            account: mockedAccountInfo,
            authority: TEST_CONFIG.validAuthority,
            correlationId: TEST_CONFIG.CORRELATION_ID,
            forceRefresh: false,
            authenticationScheme: AuthenticationScheme.SSH,
            sshKid: TEST_SSH_VALUES.SSH_KID,
        };

        expect(
            mockCache.cacheManager.getAccessToken(
                mockedAccountInfo,
                silentFlowRequest
            )
        ).toEqual(mockedSshAtEntity);
    });

    it("readAccountFromCache", () => {
        const account = mockCache.cacheManager.readAccountFromCache(
            CACHE_MOCKS.MOCK_ACCOUNT_INFO
        ) as AccountEntity;
        if (!account) {
            throw TestError.createTestSetupError(
                "account does not have a value"
            );
        }
        expect(account.homeAccountId).toBe(
            CACHE_MOCKS.MOCK_ACCOUNT_INFO.homeAccountId
        );
    });

    it("getAccountsFilteredBy nativeAccountId", () => {
        const account = mockCache.cacheManager.getAccountsFilteredBy({
            nativeAccountId:
                CACHE_MOCKS.MOCK_ACCOUNT_INFO_WITH_NATIVE_ACCOUNT_ID
                    .nativeAccountId,
        }) as AccountEntity[];
        if (account.length < 1) {
            throw TestError.createTestSetupError(
                "account does not have a value"
            );
        }
        expect(account[0].nativeAccountId).toBe(
            CACHE_MOCKS.MOCK_ACCOUNT_INFO_WITH_NATIVE_ACCOUNT_ID.nativeAccountId
        );
    });

    it("getIdToken", () => {
        const idToken = mockCache.cacheManager.getIdToken(
            CACHE_MOCKS.MOCK_ACCOUNT_INFO
        ) as IdTokenEntity;
        if (!idToken) {
            throw TestError.createTestSetupError(
                "idToken does not have a value"
            );
        }
        expect(idToken.clientId).toBe(CACHE_MOCKS.MOCK_CLIENT_ID);
    });

    it("getRefreshToken", () => {
        const refreshToken = mockCache.cacheManager.getRefreshToken(
            CACHE_MOCKS.MOCK_ACCOUNT_INFO,
            false
        ) as RefreshTokenEntity;
        if (!refreshToken) {
            throw TestError.createTestSetupError(
                "refreshToken does not have a value"
            );
        }
        expect(refreshToken.clientId).toBe(CACHE_MOCKS.MOCK_CLIENT_ID);
    });

    it("getRefreshToken Error", () => {
        const refreshToken = mockCache.cacheManager.getRefreshToken(
            { ...CACHE_MOCKS.MOCK_ACCOUNT_INFO, homeAccountId: "fake-home-id" },
            true
        );
        expect(refreshToken).toBe(null);
    });

    it("getRefreshToken with familyId", () => {
        const refreshToken = mockCache.cacheManager.getRefreshToken(
            CACHE_MOCKS.MOCK_ACCOUNT_INFO,
            true
        ) as RefreshTokenEntity;
        if (!refreshToken) {
            throw TestError.createTestSetupError(
                "refreshToken does not have a value"
            );
        }
        expect(refreshToken.clientId).toBe(CACHE_MOCKS.MOCK_CLIENT_ID);
    });

    it("getRefreshToken with environment aliases", () => {
        authorityMetadataStub.callsFake((host) => {
            const authorityMetadata = new AuthorityMetadataEntity();
            authorityMetadata.updateCloudDiscoveryMetadata(
                {
                    aliases: ["login.microsoftonline.com", "login.windows.net"],
                    preferred_network: host,
                    preferred_cache: host,
                },
                false
            );

            return authorityMetadata;
        });
        const mockedAccountInfo: AccountInfo = {
            homeAccountId: "uid.utid",
            localAccountId: "uid",
            environment: "login.windows.net",
            tenantId: "mocked_tid",
            username: "mocked_username",
        };

        const cachedToken = mockCache.cacheManager.getRefreshToken(
            mockedAccountInfo,
            false
        ) as RefreshTokenEntity;
        if (!cachedToken) {
            throw TestError.createTestSetupError(
                "refreshToken does not have a value"
            );
        }
        expect(cachedToken.homeAccountId).toBe("uid.utid");
        expect(cachedToken.environment).toBe("login.microsoftonline.com");
    });
});
