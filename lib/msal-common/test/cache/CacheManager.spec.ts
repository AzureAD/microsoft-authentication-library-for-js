/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    AuthenticationScheme,
    CredentialType,
} from "../../src/utils/Constants.js";
import { AccountEntity } from "../../src/cache/entities/AccountEntity.js";
import { AccessTokenEntity } from "../../src/cache/entities/AccessTokenEntity.js";
import { CacheRecord } from "../../src/cache/entities/CacheRecord.js";
import { AccountFilter } from "../../src/cache/utils/CacheTypes.js";
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
    GUEST_ID_TOKEN_CLAIMS,
} from "../test_kit/StringConstants.js";
import {
    ClientAuthErrorCodes,
    createClientAuthError,
} from "../../src/error/ClientAuthError.js";
import { AccountInfo } from "../../src/account/AccountInfo.js";
import { MockCache } from "./MockCache.js";
import { buildAccountFromIdTokenClaims, buildIdToken } from "msal-test-utils";
import { mockCrypto } from "../client/ClientTestUtils.js";
import { TestError } from "../test_kit/TestErrors.js";
import { CacheManager } from "../../src/cache/CacheManager.js";
import { AuthorityMetadataEntity } from "../../src/cache/entities/AuthorityMetadataEntity.js";
import { AppMetadataEntity } from "../../src/cache/entities/AppMetadataEntity.js";
import { RefreshTokenEntity } from "../../src/cache/entities/RefreshTokenEntity.js";
import { IdTokenEntity } from "../../src/cache/entities/IdTokenEntity.js";
import {
    CacheHelpers,
    CommonSilentFlowRequest,
    PerformanceEvents,
    ScopeSet,
} from "../../src/index.js";
import * as authorityMetadata from "../../src/authority/AuthorityMetadata.js";
import { MockPerformanceClient } from "../telemetry/PerformanceClient.spec.js";

describe("CacheManager.ts test cases", () => {
    const mockCache = new MockCache(CACHE_MOCKS.MOCK_CLIENT_ID, mockCrypto, {
        canonicalAuthority: TEST_CONFIG.validAuthority,
        cloudDiscoveryMetadata: JSON.parse(TEST_CONFIG.CLOUD_DISCOVERY_METADATA)
            .metadata,
        knownAuthorities: [TEST_CONFIG.validAuthorityHost],
    });
    let authorityMetadataStub: jest.SpyInstance;
    beforeEach(async () => {
        await mockCache.initializeCache();
        authorityMetadataStub = jest
            .spyOn(CacheManager.prototype, "getAuthorityMetadataByAlias")
            .mockImplementation((host) => {
                const authorityMetadata: AuthorityMetadataEntity = {
                    aliases: [host],
                    preferred_cache: host,
                    preferred_network: host,
                    aliasesFromNetwork: false,
                    canonical_authority: host,
                    authorization_endpoint: "",
                    token_endpoint: "",
                    end_session_endpoint: "",
                    issuer: "",
                    jwks_uri: "",
                    endpointsFromNetwork: false,
                    expiresAt:
                        CacheHelpers.generateAuthorityMetadataExpiresAt(),
                };
                return authorityMetadata;
            });
    });

    afterEach(async () => {
        await mockCache.clearCache();
        jest.restoreAllMocks();
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
            const cacheRecord: CacheRecord = {};
            cacheRecord.account = ac;
            await mockCache.cacheManager.saveCacheRecord(
                cacheRecord,
                TEST_CONFIG.CORRELATION_ID
            );
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
            const at = {
                homeAccountId: "someUid.someUtid",
                environment: "login.microsoftonline.com",
                credentialType: CredentialType.ACCESS_TOKEN,
                clientId: "mock_client_id",
                secret: "an access token sample",
                realm: "microsoft",
                target: "scope6 scope7",
                cachedAt: "1000",
                expiresOn: "4600",
                extendedExpiresOn: "4600",
                tokenType: AuthenticationScheme.BEARER,
            };

            const atKey = CacheHelpers.generateCredentialKey(at);
            const cacheRecord: CacheRecord = {};
            cacheRecord.accessToken = at;
            await mockCache.cacheManager.saveCacheRecord(
                cacheRecord,
                TEST_CONFIG.CORRELATION_ID
            );
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
            const at = CacheHelpers.createAccessTokenEntity(
                TEST_ACCOUNT_INFO.homeAccountId,
                TEST_ACCOUNT_INFO.environment,
                TEST_TOKENS.ACCESS_TOKEN,
                TEST_CONFIG.MSAL_CLIENT_ID,
                TEST_CONFIG.MSAL_TENANT_ID,
                "User.Read",
                TEST_TOKEN_LIFETIMES.TEST_ACCESS_TOKEN_EXP,
                TEST_TOKEN_LIFETIMES.TEST_ACCESS_TOKEN_EXP,
                mockCrypto.base64Decode
            );

            const atKey = CacheHelpers.generateCredentialKey(at);
            const cacheRecord: CacheRecord = {};
            cacheRecord.accessToken = at;
            await mockCache.cacheManager.saveCacheRecord(
                cacheRecord,
                TEST_CONFIG.CORRELATION_ID,
                {
                    accessToken: false,
                }
            );
            const mockCacheAT =
                mockCache.cacheManager.getAccessTokenCredential(atKey);
            expect(mockCacheAT).toBe(null);
        });

        it("save accessToken with Auth Scheme (pop)", async () => {
            const at = {
                homeAccountId: "someUid.someUtid",
                environment: "login.microsoftonline.com",
                credentialType: CredentialType.ACCESS_TOKEN_WITH_AUTH_SCHEME,
                clientId: "mock_client_id",
                secret: "an access token sample",
                realm: "microsoft",
                target: "scope6 scope7",
                cachedAt: "1000",
                expiresOn: "4600",
                extendedExpiresOn: "4600",
                keyId: "some_key",
                tokenType: AuthenticationScheme.POP,
            };

            const atKey = CacheHelpers.generateCredentialKey(at);
            const cacheRecord: CacheRecord = {};
            cacheRecord.accessToken = at;
            await mockCache.cacheManager.saveCacheRecord(
                cacheRecord,
                TEST_CONFIG.CORRELATION_ID
            );
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
            const idToken = CacheHelpers.createIdTokenEntity(
                TEST_ACCOUNT_INFO.homeAccountId,
                TEST_ACCOUNT_INFO.environment,
                TEST_TOKENS.IDTOKEN_V2_NEWCLAIM,
                TEST_CONFIG.MSAL_CLIENT_ID,
                TEST_CONFIG.MSAL_TENANT_ID
            );

            const idTokenKey = CacheHelpers.generateCredentialKey(idToken);
            const cacheRecord: CacheRecord = {};
            cacheRecord.idToken = idToken;
            await mockCache.cacheManager.saveCacheRecord(
                cacheRecord,
                TEST_CONFIG.CORRELATION_ID,
                {
                    idToken: false,
                }
            );
            const mockCacheId =
                mockCache.cacheManager.getIdTokenCredential(idTokenKey);
            expect(mockCacheId).toBe(null);
        });

        it("getIdToken matches multiple tokens, removes them and returns null", (done) => {
            mockCache.cacheManager.clear().then(async () => {
                const idToken1 = CacheHelpers.createIdTokenEntity(
                    TEST_ACCOUNT_INFO.homeAccountId,
                    TEST_ACCOUNT_INFO.environment,
                    TEST_TOKENS.IDTOKEN_V2,
                    CACHE_MOCKS.MOCK_CLIENT_ID,
                    TEST_ACCOUNT_INFO.tenantId
                );

                const idToken2 = CacheHelpers.createIdTokenEntity(
                    TEST_ACCOUNT_INFO.homeAccountId,
                    TEST_ACCOUNT_INFO.environment,
                    TEST_TOKENS.IDTOKEN_V2_NEWCLAIM,
                    CACHE_MOCKS.MOCK_CLIENT_ID,
                    TEST_ACCOUNT_INFO.tenantId
                );
                idToken2.target = "test-target";

                await mockCache.cacheManager.setIdTokenCredential(idToken1);
                await mockCache.cacheManager.setIdTokenCredential(idToken2);

                const mockPerfClient = new MockPerformanceClient();
                const correlationId = "test-correlation-id";

                mockPerfClient.addPerformanceCallback((events) => {
                    expect(events.length).toBe(1);
                    expect(events[0].multiMatchedID).toEqual(2);
                    done();
                });

                const measurement = mockPerfClient.startMeasurement(
                    PerformanceEvents.AcquireTokenSilent,
                    correlationId
                );

                expect(
                    mockCache.cacheManager.getTokenKeys().idToken.length
                ).toEqual(2);
                expect(
                    mockCache.cacheManager.getIdToken(
                        TEST_ACCOUNT_INFO,
                        undefined,
                        TEST_ACCOUNT_INFO.tenantId,
                        mockPerfClient,
                        correlationId
                    )
                ).toBeNull();
                expect(
                    mockCache.cacheManager.getTokenKeys().idToken.length
                ).toEqual(0);

                measurement.end();
            });
        });

        it("does not save refreshToken if storeInCache.refreshToken = false", async () => {
            const refreshToken = CacheHelpers.createRefreshTokenEntity(
                TEST_ACCOUNT_INFO.homeAccountId,
                TEST_ACCOUNT_INFO.environment,
                TEST_TOKENS.REFRESH_TOKEN,
                TEST_CONFIG.MSAL_CLIENT_ID
            );

            const refreshTokenKey =
                CacheHelpers.generateCredentialKey(refreshToken);
            const cacheRecord: CacheRecord = {};
            cacheRecord.refreshToken = refreshToken;
            await mockCache.cacheManager.saveCacheRecord(
                cacheRecord,
                TEST_CONFIG.CORRELATION_ID,
                {
                    refreshToken: false,
                }
            );
            const mockCacheRT =
                mockCache.cacheManager.getRefreshTokenCredential(
                    refreshTokenKey
                );
            expect(mockCacheRT).toBe(null);
        });
    });

    describe("getAllAccounts", () => {
        const account1 =
            buildAccountFromIdTokenClaims(ID_TOKEN_CLAIMS).getAccountInfo();
        const account2 =
            buildAccountFromIdTokenClaims(ID_TOKEN_ALT_CLAIMS).getAccountInfo();
        it("getAllAccounts returns an empty array if there are no accounts in the cache", () => {
            mockCache.clearCache();
            expect(mockCache.cacheManager.getAllAccounts()).toHaveLength(0);
        });
        it("getAllAccounts (gets all AccountInfo objects)", async () => {
            const accounts = mockCache.cacheManager.getAllAccounts();

            expect(accounts).not.toBeNull();
            // 2 home accounts + 1 tenant profile
            expect(accounts.length).toBe(3);
            expect(accounts[0].idTokenClaims).toEqual(ID_TOKEN_CLAIMS);
            expect(accounts[1].idTokenClaims).toEqual(GUEST_ID_TOKEN_CLAIMS);
            expect(accounts[2].idTokenClaims).toEqual(ID_TOKEN_ALT_CLAIMS);
        });

        it("getAllAccounts with isHomeTenant filter does not return guest tenant profiles as AccountInfo objects", () => {
            const homeAccounts = mockCache.cacheManager.getAllAccounts({
                isHomeTenant: true,
            });
            expect(homeAccounts).not.toBeNull();
            expect(homeAccounts.length).toBe(2);
            expect(homeAccounts[0].idTokenClaims).toEqual(ID_TOKEN_CLAIMS);
            expect(homeAccounts[1].idTokenClaims).toEqual(ID_TOKEN_ALT_CLAIMS);
        });

        describe("getAllAccounts with loginHint filter", () => {
            it("loginHint filter matching login_hint ID token claim", () => {
                // filter by loginHint = login_hint
                const successFilter: AccountFilter = {
                    loginHint: ID_TOKEN_CLAIMS.login_hint,
                };

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
                const successFilter: AccountFilter = {
                    loginHint: ID_TOKEN_CLAIMS.preferred_username,
                };

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
                const successFilter: AccountFilter = {
                    loginHint: ID_TOKEN_CLAIMS.upn,
                };

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

        describe("getAllAccounts with filter", () => {
            it("Matches accounts by username", () => {
                expect(mockCache.cacheManager.getAllAccounts()).toHaveLength(3);
                const account1Filter = { username: account1.username };
                const account2Filter = { username: account2.username };
                const accounts =
                    mockCache.cacheManager.getAllAccounts(account1Filter);
                expect(accounts).toHaveLength(1);
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
                expect(mockCache.cacheManager.getAllAccounts()).toHaveLength(3);
                const multiTenantAccountFilter = {
                    homeAccountId: account1.homeAccountId,
                };

                const multiTenantAccountHomeTenantOnlyFilter = {
                    ...multiTenantAccountFilter,
                    isHomeTenant: true,
                };

                const account2Filter = {
                    homeAccountId: account2.homeAccountId,
                };
                // Multi-tenant account has two tenant profiles which will both match the same homeAccountId
                const multiTenantAccountProfiles =
                    mockCache.cacheManager.getAllAccounts(
                        multiTenantAccountFilter
                    );
                expect(multiTenantAccountProfiles).toHaveLength(2);
                expect(multiTenantAccountProfiles[0].homeAccountId).toBe(
                    account1.homeAccountId
                );

                // Set isHomeTenant = true to only get baseAccount
                const multiTenantAccountHomeTenantOnlyProfiles =
                    mockCache.cacheManager.getAllAccounts(
                        multiTenantAccountHomeTenantOnlyFilter
                    );
                expect(multiTenantAccountHomeTenantOnlyProfiles).toHaveLength(
                    1
                );
                expect(
                    multiTenantAccountHomeTenantOnlyProfiles[0].tenantId
                ).toBe(account1.tenantId);
                expect(
                    mockCache.cacheManager.getAllAccounts(account2Filter)
                ).toHaveLength(1);
                expect(
                    mockCache.cacheManager.getAllAccounts(account2Filter)[0]
                        .homeAccountId
                ).toBe(account2.homeAccountId);
            });

            it("Matches accounts by localAccountId", () => {
                expect(mockCache.cacheManager.getAllAccounts()).toHaveLength(3);
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
                expect(mockCache.cacheManager.getAllAccounts()).toHaveLength(3);
                const firstTenantAccountFilter = {
                    tenantId: account1.tenantId,
                };
                const secondTenantAccountFilter = {
                    tenantId: account2.tenantId,
                };
                expect(
                    mockCache.cacheManager.getAllAccounts(
                        firstTenantAccountFilter
                    )
                ).toHaveLength(1);
                expect(
                    mockCache.cacheManager.getAllAccounts(
                        firstTenantAccountFilter
                    )[0].tenantId
                ).toBe(firstTenantAccountFilter.tenantId);
                // Guest profile of first user account is from the same tenant as account 2
                expect(
                    mockCache.cacheManager.getAllAccounts(
                        secondTenantAccountFilter
                    )
                ).toHaveLength(2);
                expect(
                    mockCache.cacheManager.getAllAccounts(
                        secondTenantAccountFilter
                    )[0].tenantId
                ).toBe(secondTenantAccountFilter.tenantId);
            });

            it("Matches accounts by environment", () => {
                expect(mockCache.cacheManager.getAllAccounts()).toHaveLength(3);
                // Add local account ID to further filter because environments are aliases of eachother
                const firstEnvironmentAccountsFilter = {
                    homeAccountId: account1.homeAccountId,
                    environment: account1.environment,
                };
                const secondEnvironmentAccountsFilter = {
                    homeAccountId: account2.homeAccountId,
                    environment: account2.environment,
                };
                expect(
                    mockCache.cacheManager.getAllAccounts(
                        firstEnvironmentAccountsFilter
                    )
                ).toHaveLength(2);
                expect(
                    mockCache.cacheManager.getAllAccounts(
                        firstEnvironmentAccountsFilter
                    )[0].environment
                ).toBe(account1.environment);
                expect(
                    mockCache.cacheManager.getAllAccounts(
                        secondEnvironmentAccountsFilter
                    )
                ).toHaveLength(1);
                expect(
                    mockCache.cacheManager.getAllAccounts(
                        secondEnvironmentAccountsFilter
                    )[0].environment
                ).toBe(account2.environment);
            });

            it("Matches accounts by all filters", () => {
                expect(mockCache.cacheManager.getAllAccounts()).toHaveLength(3);
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
    });

    describe("getAccountInfoFilteredBy", () => {
        const multiTenantAccount = buildAccountFromIdTokenClaims(
            ID_TOKEN_CLAIMS,
            [GUEST_ID_TOKEN_CLAIMS]
        ).getAccountInfo();
        it("returns null if no accounts match filter", () => {
            expect(
                mockCache.cacheManager.getAccountInfoFilteredBy({
                    homeAccountId: "inexistent-account-id",
                })
            ).toBeNull();
        });

        it("returns an account matching filter", () => {
            const resultAccount =
                mockCache.cacheManager.getAccountInfoFilteredBy({
                    homeAccountId: multiTenantAccount.homeAccountId,
                    tenantId: multiTenantAccount.tenantId,
                });
            expect(resultAccount).not.toBeNull();
            expect(resultAccount).toMatchObject(multiTenantAccount);
        });

        it("prioritizes the tenant profile with a matching ID token in the cache", () => {
            const mainIdTokenEntity = buildIdToken(
                ID_TOKEN_CLAIMS,
                TEST_TOKENS.IDTOKEN_V2,
                { homeAccountId: multiTenantAccount.homeAccountId }
            );
            const mainIdTokenKey =
                CacheHelpers.generateCredentialKey(mainIdTokenEntity);

            const filter = {
                homeAccountId: multiTenantAccount.homeAccountId,
            };
            // Remove main ID token
            mockCache.cacheManager.removeIdToken(mainIdTokenKey);
            const resultAccount =
                mockCache.cacheManager.getAccountInfoFilteredBy(filter);
            expect(resultAccount).not.toBeNull();
            expect(resultAccount?.tenantId).toBe(GUEST_ID_TOKEN_CLAIMS.tid);

            const allAccountsReversed = mockCache.cacheManager
                .getAllAccounts()
                .reverse();

            jest.spyOn(
                CacheManager.prototype,
                "getAllAccounts"
            ).mockReturnValueOnce(allAccountsReversed);

            const reversedResultAccount =
                mockCache.cacheManager.getAccountInfoFilteredBy(filter);
            expect(reversedResultAccount).not.toBeNull();
            expect(reversedResultAccount?.tenantId).toBe(
                GUEST_ID_TOKEN_CLAIMS.tid
            );
        });

        it("returns account matching filter with isHomeTenant = true", () => {
            const resultAccount =
                mockCache.cacheManager.getAccountInfoFilteredBy({
                    homeAccountId: multiTenantAccount.homeAccountId,
                    tenantId: multiTenantAccount.tenantId,
                    isHomeTenant: true,
                });
            expect(resultAccount).not.toBeNull();
            expect(resultAccount).toMatchObject(multiTenantAccount);
        });
    });

    describe("getBaseAccountInfo", () => {
        it("returns base account regardless of tenantId", () => {
            const multiTenantAccount = buildAccountFromIdTokenClaims(
                ID_TOKEN_CLAIMS,
                [GUEST_ID_TOKEN_CLAIMS]
            ).getAccountInfo();
            const resultAccount = mockCache.cacheManager.getBaseAccountInfo({
                homeAccountId: multiTenantAccount.homeAccountId,
                tenantId: GUEST_ID_TOKEN_CLAIMS.tid,
            });

            expect(resultAccount).toEqual(multiTenantAccount);
        });

        it("returns null if no account matches filter", () => {
            expect(
                mockCache.cacheManager.getBaseAccountInfo({
                    homeAccountId: "inexistent-homeaccountid",
                })
            ).toBeNull();
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
        const cacheRecord: CacheRecord = {};
        cacheRecord.account = ac;
        await mockCache.cacheManager.saveCacheRecord(
            cacheRecord,
            TEST_CONFIG.CORRELATION_ID
        );

        const cacheAccount = mockCache.cacheManager.getAccount(
            accountKey
        ) as AccountEntity;
        expect(cacheAccount.homeAccountId).toEqual("someUid.someUtid");
        expect(mockCache.cacheManager.getAccount("")).toBeNull();
    });

    it("getAccessTokenCredential (Bearer)", async () => {
        const accessTokenEntity: AccessTokenEntity = {
            homeAccountId: "someUid.someUtid",
            environment: "login.microsoftonline.com",
            realm: "microsoft",
            clientId: "mock_client_id",
            credentialType: CredentialType.ACCESS_TOKEN,
            target: "scope6 scope7",
            secret: TEST_TOKENS.ACCESS_TOKEN,
            cachedAt: "1000",
            expiresOn: "4600",
        };

        const credKey = CacheHelpers.generateCredentialKey(accessTokenEntity);
        const cacheRecord: CacheRecord = {};
        cacheRecord.accessToken = accessTokenEntity;
        await mockCache.cacheManager.saveCacheRecord(
            cacheRecord,
            TEST_CONFIG.CORRELATION_ID
        );

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
        const accessTokenEntity: AccessTokenEntity = {
            homeAccountId: "someUid.someUtid",
            environment: "login.microsoftonline.com",
            realm: "microsoft",
            clientId: "mock_client_id",
            credentialType: CredentialType.ACCESS_TOKEN_WITH_AUTH_SCHEME,
            target: "scope6 scope7",
            secret: TEST_TOKENS.ACCESS_TOKEN,
            cachedAt: "1000",
            expiresOn: "4600",
        };

        const credKey = CacheHelpers.generateCredentialKey(accessTokenEntity);
        const cacheRecord: CacheRecord = {};
        cacheRecord.accessToken = accessTokenEntity;
        await mockCache.cacheManager.saveCacheRecord(
            cacheRecord,
            TEST_CONFIG.CORRELATION_ID
        );

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
        const matchAccountEntity =
            buildAccountFromIdTokenClaims(ID_TOKEN_CLAIMS);
        it("homeAccountId filter", () => {
            // filter by homeAccountId
            const successFilter: AccountFilter = {
                homeAccountId: matchAccountEntity.homeAccountId,
            };
            let accounts =
                mockCache.cacheManager.getAccountsFilteredBy(successFilter);
            // getAccountsFilteredBy only gets cached accounts, so don't expect all tenant profiles to be returned as account objects
            expect(Object.keys(accounts).length).toEqual(1);

            const wrongFilter: AccountFilter = { homeAccountId: "Wrong Id" };
            accounts =
                mockCache.cacheManager.getAccountsFilteredBy(wrongFilter);
            expect(Object.keys(accounts).length).toEqual(0);
        });

        it("environment filter", () => {
            // filter by environment
            const successFilter: AccountFilter = {
                environment: matchAccountEntity.environment,
            };
            let accounts =
                mockCache.cacheManager.getAccountsFilteredBy(successFilter);
            // Both cached accounts have environments that are aliases of eachother, expect both to match
            expect(Object.keys(accounts).length).toEqual(2);
            jest.restoreAllMocks();

            const wrongFilter: AccountFilter = { environment: "Wrong Env" };
            accounts =
                mockCache.cacheManager.getAccountsFilteredBy(wrongFilter);
            expect(Object.keys(accounts).length).toEqual(0);
        });

        it("realm filter", () => {
            // filter by realm
            const successFilter: AccountFilter = {
                realm: matchAccountEntity.realm,
            };
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
        it("Returns false if key does not contain enough '-' deliniated sections", () => {
            expect(
                mockCache.cacheManager.isCredentialKey(
                    "clientid-idToken-homeId"
                )
            ).toBe(false);
        });

        it("Returns false if key does not contain a valid credential type", () => {
            expect(
                mockCache.cacheManager.isCredentialKey(
                    `homeAccountId-environment-credentialType-${CACHE_MOCKS.MOCK_CLIENT_ID}-realm-target-requestedClaimsHash-scheme`
                )
            ).toBe(false);
        });

        it("Returns false if key does not contain clientId", () => {
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

            describe("with hardcoded cloud discovery metadata", () => {
                beforeEach(() => {
                    jest.spyOn(
                        authorityMetadata,
                        "getAliasesFromMetadata"
                    ).mockReturnValueOnce(null);
                });

                it("ID token matches when filter contains its own environment", () => {
                    // filter by environment
                    expect(
                        mockCache.cacheManager.credentialMatchesFilter(
                            testIdToken,
                            {
                                environment: testIdToken.environment,
                            }
                        )
                    ).toBe(true);
                });

                it("Access token matches when filter contains its own enviroment", () => {
                    expect(
                        mockCache.cacheManager.credentialMatchesFilter(
                            testAccessToken,
                            {
                                environment: testAccessToken.environment,
                            }
                        )
                    ).toBe(true);
                });

                it("Refresh token matches when filter contains its own environment", () => {
                    expect(
                        mockCache.cacheManager.credentialMatchesFilter(
                            testRefreshToken,
                            {
                                environment: testRefreshToken.environment,
                            }
                        )
                    ).toBe(true);
                });

                // Test failure cases
                it("ID token does not match when filter contains a different environment", () => {
                    expect(
                        mockCache.cacheManager.credentialMatchesFilter(
                            testRefreshToken,
                            {
                                environment: testRefreshToken.environment,
                            }
                        )
                    ).toBe(true);
                });

                it("Access token does not match when filter contains a different environment", () => {
                    expect(
                        mockCache.cacheManager.credentialMatchesFilter(
                            testAccessToken,
                            {
                                environment: "wrong.contoso.com",
                            }
                        )
                    ).toBe(false);
                });

                it("Refresh token does not match when filter contains a different environment", () => {
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

            it("with knownAuthorities", () => {
                jest.spyOn(
                    authorityMetadata,
                    "getAliasesFromMetadata"
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
        const accountsBeforeRemove = mockCache.cacheManager.getAllAccounts();
        await mockCache.cacheManager.removeAllAccounts();
        const accountsAfterRemove = mockCache.cacheManager.getAllAccounts();

        expect(accountsBeforeRemove).toHaveLength(3);
        expect(accountsAfterRemove).toHaveLength(0);
    });

    it("removeAccount", async () => {
        const accountToRemove = buildAccountFromIdTokenClaims(ID_TOKEN_CLAIMS);
        const accountToRemoveKey = accountToRemove.generateAccountKey();
        expect(
            mockCache.cacheManager.getAccount(accountToRemoveKey)
        ).not.toBeNull();
        await mockCache.cacheManager.removeAccount(accountToRemoveKey);
        expect(
            mockCache.cacheManager.getAccount(accountToRemoveKey)
        ).toBeNull();
    });

    it("removeAccessToken", async () => {
        const at = {
            homeAccountId: "someUid.someUtid",
            environment: "login.microsoftonline.com",
            credentialType: CredentialType.ACCESS_TOKEN,
            clientId: "mock_client_id",
            secret: "an access token sample",
            realm: "microsoft",
            target: "scope6 scope7",
            cachedAt: "1000",
            expiresOn: "4600",
            extendedExpiresOn: "4600",
        };

        await mockCache.cacheManager.removeAccessToken(
            CacheHelpers.generateCredentialKey(at)
        );
        const atKey = CacheHelpers.generateCredentialKey(at);
        expect(mockCache.cacheManager.getAccount(atKey)).toBeNull();
    });

    it("removes token binding key when removeAccessToken is called for a PoP AccessToken_With_AuthScheme credential", async () => {
        const atWithAuthScheme = {
            environment: "login.microsoftonline.com",
            credentialType: CredentialType.ACCESS_TOKEN_WITH_AUTH_SCHEME,
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

        const removeTokenBindingKeySpy = jest.spyOn(
            mockCrypto,
            "removeTokenBindingKey"
        );

        await mockCache.cacheManager.removeAccessToken(
            CacheHelpers.generateCredentialKey(atWithAuthScheme)
        );
        const atKey = CacheHelpers.generateCredentialKey(atWithAuthScheme);
        expect(mockCache.cacheManager.getAccount(atKey)).toBeNull();
        expect(removeTokenBindingKeySpy.mock.calls[0][0]).toEqual(
            atWithAuthScheme.keyId
        );
    });

    it("does not try to remove binding key when removeAccessToken is called for an SSH AccessToken_With_AuthScheme credential", async () => {
        const atWithAuthScheme = {
            environment: "login.microsoftonline.com",
            credentialType: CredentialType.ACCESS_TOKEN_WITH_AUTH_SCHEME,
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

        const removeTokenBindingKeySpy = jest.spyOn(
            mockCrypto,
            "removeTokenBindingKey"
        );

        await mockCache.cacheManager.removeAccessToken(
            CacheHelpers.generateCredentialKey(atWithAuthScheme)
        );
        const atKey = CacheHelpers.generateCredentialKey(atWithAuthScheme);
        expect(mockCache.cacheManager.getAccount(atKey)).toBeNull();
        expect(removeTokenBindingKeySpy).toHaveBeenCalledTimes(0);
    });

    it("throws bindingKeyNotRemoved error when key is not deleted from storage", async () => {
        const atWithAuthScheme = {
            environment: "login.microsoftonline.com",
            credentialType: CredentialType.ACCESS_TOKEN_WITH_AUTH_SCHEME,
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

        jest.spyOn(mockCrypto, "removeTokenBindingKey").mockImplementation(
            (keyId: string): Promise<boolean> => {
                return Promise.reject();
            }
        );

        return await expect(
            mockCache.cacheManager.removeAccessToken(
                CacheHelpers.generateCredentialKey(atWithAuthScheme)
            )
        ).rejects.toThrow(
            createClientAuthError(ClientAuthErrorCodes.bindingKeyNotRemoved)
        );
    });

    it("getAccessToken matches multiple tokens, removes them and returns null", (done) => {
        mockCache.cacheManager.clear().then(async () => {
            const mockedAtEntity: AccessTokenEntity =
                CacheHelpers.createAccessTokenEntity(
                    "uid.utid",
                    "login.microsoftonline.com",
                    "an_access_token",
                    CACHE_MOCKS.MOCK_CLIENT_ID,
                    TEST_CONFIG.TENANT,
                    TEST_CONFIG.DEFAULT_GRAPH_SCOPE.toString(),
                    4600,
                    4600,
                    mockCrypto.base64Decode,
                    500,
                    AuthenticationScheme.BEARER,
                    TEST_TOKENS.ACCESS_TOKEN
                );

            const mockedAtEntity2: AccessTokenEntity =
                CacheHelpers.createAccessTokenEntity(
                    "uid.utid",
                    "login.microsoftonline.com",
                    "an_access_token",
                    CACHE_MOCKS.MOCK_CLIENT_ID,
                    TEST_CONFIG.TENANT,
                    "User.Read test_scope",
                    4600,
                    4600,
                    mockCrypto.base64Decode,
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

            await mockCache.cacheManager.setAccessTokenCredential(
                mockedAtEntity
            );
            await mockCache.cacheManager.setAccessTokenCredential(
                mockedAtEntity2
            );
            await mockCache.cacheManager.setAccount(mockedAccount);

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

            const mockPerfClient = new MockPerformanceClient();
            const correlationId = "test-correlation-id";

            mockPerfClient.addPerformanceCallback((events) => {
                expect(events.length).toBe(1);
                expect(events[0].multiMatchedAT).toEqual(2);
                done();
            });

            const measurement = mockPerfClient.startMeasurement(
                PerformanceEvents.AcquireTokenSilent,
                correlationId
            );

            expect(
                mockCache.cacheManager.getAccessToken(
                    mockedAccountInfo,
                    silentFlowRequest,
                    undefined,
                    undefined,
                    mockPerfClient,
                    correlationId
                )
            ).toBeNull();
            expect(
                mockCache.cacheManager.getTokenKeys().accessToken.length
            ).toEqual(0);

            measurement.end();
        });
    });

    it("getAccessToken only matches a Bearer Token when Authentication Scheme is set to Bearer", async () => {
        const mockedAtEntity: AccessTokenEntity =
            CacheHelpers.createAccessTokenEntity(
                "uid.utid",
                "login.microsoftonline.com",
                "access_token",
                CACHE_MOCKS.MOCK_CLIENT_ID,
                TEST_CONFIG.TENANT,
                TEST_CONFIG.DEFAULT_GRAPH_SCOPE.toString(),
                4600,
                4600,
                mockCrypto.base64Decode,
                500,
                AuthenticationScheme.BEARER,
                TEST_TOKENS.ACCESS_TOKEN
            );

        const mockedPopAtEntity: AccessTokenEntity =
            CacheHelpers.createAccessTokenEntity(
                "uid.utid",
                "login.microsoftonline.com",
                TEST_TOKENS.POP_TOKEN,
                CACHE_MOCKS.MOCK_CLIENT_ID,
                TEST_CONFIG.TENANT,
                "User.Read test_scope",
                4600,
                4600,
                mockCrypto.base64Decode,
                500,
                AuthenticationScheme.POP,
                TEST_TOKENS.ACCESS_TOKEN
            );

        const mockedSshAtEntity: AccessTokenEntity =
            CacheHelpers.createAccessTokenEntity(
                "uid.utid",
                "login.microsoftonline.com",
                TEST_TOKENS.SSH_CERTIFICATE,
                CACHE_MOCKS.MOCK_CLIENT_ID,
                TEST_CONFIG.TENANT,
                "User.Read test_scope",
                4600,
                4600,
                mockCrypto.base64Decode,
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

        await mockCache.cacheManager.setAccessTokenCredential(mockedAtEntity);
        await mockCache.cacheManager.setAccessTokenCredential(
            mockedPopAtEntity
        );
        await mockCache.cacheManager.setAccessTokenCredential(
            mockedSshAtEntity
        );
        await mockCache.cacheManager.setAccount(mockedAccount);

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

    it("getAccessToken matches a Bearer Token when Authentication Scheme is set to bearer (lowercase from adfs)", async () => {
        const mockedAtEntity: AccessTokenEntity =
            CacheHelpers.createAccessTokenEntity(
                "uid.utid",
                "login.microsoftonline.com",
                "access_token",
                CACHE_MOCKS.MOCK_CLIENT_ID,
                TEST_CONFIG.TENANT,
                TEST_CONFIG.DEFAULT_GRAPH_SCOPE.toString(),
                4600,
                4600,
                mockCrypto.base64Decode,
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

        await mockCache.cacheManager.setAccessTokenCredential(mockedAtEntity);

        await mockCache.cacheManager.setAccount(mockedAccount);

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

    it("getAccessToken only matches a POP Token when Authentication Scheme is set to pop", async () => {
        const mockedAtEntity: AccessTokenEntity =
            CacheHelpers.createAccessTokenEntity(
                "uid.utid",
                "login.microsoftonline.com",
                "access_token",
                CACHE_MOCKS.MOCK_CLIENT_ID,
                TEST_CONFIG.TENANT,
                TEST_CONFIG.DEFAULT_GRAPH_SCOPE.toString(),
                4600,
                4600,
                mockCrypto.base64Decode,
                500,
                AuthenticationScheme.BEARER,
                TEST_TOKENS.ACCESS_TOKEN
            );

        const mockedPopAtEntity: AccessTokenEntity =
            CacheHelpers.createAccessTokenEntity(
                "uid.utid",
                "login.microsoftonline.com",
                TEST_TOKENS.POP_TOKEN,
                CACHE_MOCKS.MOCK_CLIENT_ID,
                TEST_CONFIG.TENANT,
                "User.Read test_scope",
                4600,
                4600,
                mockCrypto.base64Decode,
                500,
                AuthenticationScheme.POP,
                TEST_TOKENS.ACCESS_TOKEN
            );

        const mockedSshAtEntity: AccessTokenEntity =
            CacheHelpers.createAccessTokenEntity(
                "uid.utid",
                "login.microsoftonline.com",
                TEST_TOKENS.SSH_CERTIFICATE,
                CACHE_MOCKS.MOCK_CLIENT_ID,
                TEST_CONFIG.TENANT,
                "User.Read test_scope",
                4600,
                4600,
                mockCrypto.base64Decode,
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

        await mockCache.cacheManager.setAccessTokenCredential(mockedAtEntity);
        await mockCache.cacheManager.setAccessTokenCredential(
            mockedPopAtEntity
        );
        await mockCache.cacheManager.setAccessTokenCredential(
            mockedSshAtEntity
        );
        await mockCache.cacheManager.setAccount(mockedAccount);

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

    it("getAccessToken only matches an SSH Certificate when Authentication Scheme is set to ssh-cert", async () => {
        const mockedAtEntity: AccessTokenEntity =
            CacheHelpers.createAccessTokenEntity(
                "uid.utid",
                "login.microsoftonline.com",
                "access_token",
                CACHE_MOCKS.MOCK_CLIENT_ID,
                TEST_CONFIG.TENANT,
                TEST_CONFIG.DEFAULT_GRAPH_SCOPE.toString(),
                4600,
                4600,
                mockCrypto.base64Decode,
                500,
                AuthenticationScheme.BEARER,
                undefined,
                undefined
            );

        const mockedPopAtEntity: AccessTokenEntity =
            CacheHelpers.createAccessTokenEntity(
                "uid.utid",
                "login.microsoftonline.com",
                TEST_TOKENS.POP_TOKEN,
                CACHE_MOCKS.MOCK_CLIENT_ID,
                TEST_CONFIG.TENANT,
                "User.Read test_scope",
                4600,
                4600,
                mockCrypto.base64Decode,
                500,
                AuthenticationScheme.POP,
                undefined,
                TEST_POP_VALUES.KID
            );

        const mockedSshAtEntity: AccessTokenEntity =
            CacheHelpers.createAccessTokenEntity(
                "uid.utid",
                "login.microsoftonline.com",
                TEST_TOKENS.SSH_CERTIFICATE,
                CACHE_MOCKS.MOCK_CLIENT_ID,
                TEST_CONFIG.TENANT,
                "User.Read test_scope",
                4600,
                4600,
                mockCrypto.base64Decode,
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

        await mockCache.cacheManager.setAccessTokenCredential(mockedAtEntity);
        await mockCache.cacheManager.setAccessTokenCredential(
            mockedPopAtEntity
        );
        await mockCache.cacheManager.setAccessTokenCredential(
            mockedSshAtEntity
        );
        await mockCache.cacheManager.setAccount(mockedAccount);

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
        const matchAccountInfo =
            buildAccountFromIdTokenClaims(ID_TOKEN_CLAIMS).getAccountInfo();
        const account = mockCache.cacheManager.readAccountFromCache(
            matchAccountInfo
        ) as AccountEntity;
        if (!account) {
            throw TestError.createTestSetupError(
                "Sccount does not have a value"
            );
        }
        expect(account.homeAccountId).toBe(matchAccountInfo.homeAccountId);
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
        const baseAccountInfo =
            buildAccountFromIdTokenClaims(ID_TOKEN_ALT_CLAIMS).getAccountInfo();
        // Get home ID token by default
        const idToken = mockCache.cacheManager.getIdToken(
            baseAccountInfo
        ) as IdTokenEntity;
        if (!idToken) {
            throw TestError.createTestSetupError(
                "idToken does not have a value"
            );
        }
        expect(idToken.realm).toBe(baseAccountInfo.tenantId);
        const guestIdToken = mockCache.cacheManager.getIdToken(
            baseAccountInfo,
            undefined,
            GUEST_ID_TOKEN_CLAIMS.tid
        ) as IdTokenEntity;
        if (!guestIdToken) {
            throw TestError.createTestSetupError(
                "guest idToken does not have a value"
            );
        }
        expect(guestIdToken.realm).toBe(GUEST_ID_TOKEN_CLAIMS.tid);
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
        authorityMetadataStub.mockImplementation((host) => {
            const authorityMetadata: AuthorityMetadataEntity = {
                aliases: ["login.microsoftonline.com", "login.windows.net"],
                preferred_cache: host,
                preferred_network: host,
                aliasesFromNetwork: false,
                canonical_authority: host,
                authorization_endpoint: "",
                token_endpoint: "",
                end_session_endpoint: "",
                issuer: "",
                jwks_uri: "",
                endpointsFromNetwork: false,
                expiresAt: CacheHelpers.generateAuthorityMetadataExpiresAt(),
            };
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
