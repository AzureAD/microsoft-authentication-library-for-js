/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { buildAccountFromIdTokenClaims, buildIdToken } from "msal-test-utils";
import { AccountInfo } from "../../src/account/AccountInfo.js";
import * as authorityMetadata from "../../src/authority/AuthorityMetadata.js";
import { CacheManager } from "../../src/cache/CacheManager.js";
import { AccessTokenEntity } from "../../src/cache/entities/AccessTokenEntity.js";
import { AccountEntity } from "../../src/cache/entities/AccountEntity.js";
import { AppMetadataEntity } from "../../src/cache/entities/AppMetadataEntity.js";
import { AuthorityMetadataEntity } from "../../src/cache/entities/AuthorityMetadataEntity.js";
import { CacheRecord } from "../../src/cache/entities/CacheRecord.js";
import { IdTokenEntity } from "../../src/cache/entities/IdTokenEntity.js";
import { RefreshTokenEntity } from "../../src/cache/entities/RefreshTokenEntity.js";
import * as AccountEntityUtils from "../../src/cache/utils/AccountEntityUtils.js";
import { AccountFilter } from "../../src/cache/utils/CacheTypes.js";
import {
    CacheHelpers,
    ClientAuthErrorCodes,
    CommonSilentFlowRequest,
    ScopeSet,
} from "../../src/index.js";
import { StubPerformanceClient } from "../../src/telemetry/performance/StubPerformanceClient.js";
import {
    AuthenticationScheme,
    CredentialType,
} from "../../src/utils/Constants.js";
import {
    generateAccountKey,
    generateCredentialKey,
    mockCrypto,
} from "../client/ClientTestUtils.js";
import {
    CACHE_MOCKS,
    GUEST_ID_TOKEN_CLAIMS,
    ID_TOKEN_ALT_CLAIMS,
    ID_TOKEN_CLAIMS,
    RANDOM_TEST_GUID,
    TEST_ACCOUNT_INFO,
    TEST_CONFIG,
    TEST_CRYPTO_VALUES,
    TEST_DPOP_VALUES,
    TEST_POP_VALUES,
    TEST_SSH_VALUES,
    TEST_TOKEN_LIFETIMES,
    TEST_TOKENS,
} from "../test_kit/StringConstants.js";
import { TestError } from "../test_kit/TestErrors.js";
import { MockCache } from "./MockCache.js";

describe("CacheManager.ts test cases", () => {
    const DPOP_AUTHENTICATION_SCHEME = "dpop" as AuthenticationScheme;
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
            const ac: AccountEntity = {
                homeAccountId: "someUid.someUtid",
                environment: "login.microsoftonline.com",
                realm: "microsoft",
                localAccountId: "object1234",
                username: "Jane Goodman",
                authorityType: "MSSTS",
                lastUpdatedAt: Date.now().toString(),
            };

            const accountKey = generateAccountKey(
                AccountEntityUtils.getAccountInfo(ac)
            );
            const cacheRecord: CacheRecord = {};
            cacheRecord.account = ac;
            await mockCache.cacheManager.saveCacheRecord(
                cacheRecord,
                TEST_CONFIG.CORRELATION_ID,
                true,
                0
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
                lastUpdatedAt: Date.now().toString(),
            };

            const atKey = generateCredentialKey(at);
            const cacheRecord: CacheRecord = {};
            cacheRecord.accessToken = at;
            await mockCache.cacheManager.saveCacheRecord(
                cacheRecord,
                TEST_CONFIG.CORRELATION_ID,
                true,
                0
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
                mockCrypto.base64Decode,
                ""
            );

            const atKey = generateCredentialKey(at);
            const cacheRecord: CacheRecord = {};
            cacheRecord.accessToken = at;
            await mockCache.cacheManager.saveCacheRecord(
                cacheRecord,
                TEST_CONFIG.CORRELATION_ID,
                true,
                0,
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
                lastUpdatedAt: Date.now().toString(),
            };

            const atKey = generateCredentialKey(at);
            const cacheRecord: CacheRecord = {};
            cacheRecord.accessToken = at;
            await mockCache.cacheManager.saveCacheRecord(
                cacheRecord,
                TEST_CONFIG.CORRELATION_ID,
                true,
                0
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

        it("save accessToken with Auth Scheme (dpop)", async () => {
            const at = CacheHelpers.createAccessTokenEntity(
                "someUid.someUtid",
                "login.microsoftonline.com",
                TEST_DPOP_VALUES.ACCESS_TOKEN,
                "mock_client_id",
                "microsoft",
                "scope6 scope7",
                4600,
                4600,
                mockCrypto.base64Decode,
                TEST_CONFIG.CORRELATION_ID,
                undefined,
                DPOP_AUTHENTICATION_SCHEME,
                undefined,
                TEST_DPOP_VALUES.ACCESS_TOKEN_JKT
            );

            const atKey = generateCredentialKey(at);
            const cacheRecord: CacheRecord = {};
            cacheRecord.accessToken = at;
            await mockCache.cacheManager.saveCacheRecord(
                cacheRecord,
                TEST_CONFIG.CORRELATION_ID,
                true,
                0
            );
            const mockCacheAT = mockCache.cacheManager.getAccessTokenCredential(
                atKey
            ) as AccessTokenEntity;
            if (!mockCacheAT) {
                throw TestError.createTestSetupError(
                    "mockCacheAT does not have a value"
                );
            }
            expect(mockCacheAT.credentialType).toEqual(
                CredentialType.ACCESS_TOKEN_WITH_AUTH_SCHEME
            );
            expect(mockCacheAT.tokenType).toEqual(DPOP_AUTHENTICATION_SCHEME);
            expect(mockCacheAT.keyId).toEqual(
                TEST_DPOP_VALUES.ACCESS_TOKEN_JKT
            );
        });

        it("requires request-context keyId metadata for accessToken with Auth Scheme (dpop)", () => {
            expect(() =>
                CacheHelpers.createAccessTokenEntity(
                    "someUid.someUtid",
                    "login.microsoftonline.com",
                    TEST_DPOP_VALUES.ACCESS_TOKEN,
                    "mock_client_id",
                    "microsoft",
                    "scope6 scope7",
                    4600,
                    4600,
                    mockCrypto.base64Decode,
                    TEST_CONFIG.CORRELATION_ID,
                    undefined,
                    DPOP_AUTHENTICATION_SCHEME
                )
            ).toThrow(ClientAuthErrorCodes.keyIdMissing);
        });

        it("does not save idToken if storeInCache.idToken = false", async () => {
            const idToken = CacheHelpers.createIdTokenEntity(
                TEST_ACCOUNT_INFO.homeAccountId,
                TEST_ACCOUNT_INFO.environment,
                TEST_TOKENS.IDTOKEN_V2_NEWCLAIM,
                TEST_CONFIG.MSAL_CLIENT_ID,
                TEST_CONFIG.MSAL_TENANT_ID
            );

            const idTokenKey = generateCredentialKey(idToken);
            const cacheRecord: CacheRecord = {};
            cacheRecord.idToken = idToken;
            await mockCache.cacheManager.saveCacheRecord(
                cacheRecord,
                TEST_CONFIG.CORRELATION_ID,
                true,
                0,
                {
                    idToken: false,
                }
            );
            const mockCacheId =
                mockCache.cacheManager.getIdTokenCredential(idTokenKey);
            expect(mockCacheId).toBe(null);
        });

        it("getIdToken matches multiple tokens, removes them and returns null", async () => {
            await mockCache.cacheManager.clear();
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

            const correlationId = "test-correlation-id";

            const addFieldsSpy = jest.spyOn(
                StubPerformanceClient.prototype,
                "addFields"
            );

            expect(
                mockCache.cacheManager.getTokenKeys().idToken.length
            ).toEqual(2);
            expect(
                mockCache.cacheManager.getIdToken(
                    TEST_ACCOUNT_INFO,
                    correlationId,
                    undefined,
                    TEST_ACCOUNT_INFO.tenantId
                )
            ).toBeNull();
            expect(
                mockCache.cacheManager.getTokenKeys().idToken.length
            ).toEqual(0);

            expect(addFieldsSpy).toHaveBeenCalledWith(
                expect.objectContaining({ multiMatchedID: 2 }),
                correlationId
            );
        });

        it("does not save refreshToken if storeInCache.refreshToken = false", async () => {
            const refreshToken = CacheHelpers.createRefreshTokenEntity(
                TEST_ACCOUNT_INFO.homeAccountId,
                TEST_ACCOUNT_INFO.environment,
                TEST_TOKENS.REFRESH_TOKEN,
                TEST_CONFIG.MSAL_CLIENT_ID
            );

            const refreshTokenKey = generateCredentialKey(refreshToken);
            const cacheRecord: CacheRecord = {};
            cacheRecord.refreshToken = refreshToken;
            await mockCache.cacheManager.saveCacheRecord(
                cacheRecord,
                TEST_CONFIG.CORRELATION_ID,
                true,
                0,
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
        const account1 = AccountEntityUtils.getAccountInfo(
            buildAccountFromIdTokenClaims(ID_TOKEN_CLAIMS)
        );
        const account2 = AccountEntityUtils.getAccountInfo(
            buildAccountFromIdTokenClaims(ID_TOKEN_ALT_CLAIMS)
        );
        it("getAllAccounts returns an empty array if there are no accounts in the cache", () => {
            mockCache.clearCache();
            expect(
                mockCache.cacheManager.getAllAccounts({}, RANDOM_TEST_GUID)
            ).toHaveLength(0);
        });
        it("getAllAccounts (gets all AccountInfo objects)", async () => {
            const accounts = mockCache.cacheManager.getAllAccounts(
                {},
                RANDOM_TEST_GUID
            );

            expect(accounts).not.toBeNull();
            // 2 home accounts + 1 tenant profile
            expect(accounts.length).toBe(3);
            expect(accounts[0].idTokenClaims).toEqual(ID_TOKEN_CLAIMS);
            expect(accounts[1].idTokenClaims).toEqual(GUEST_ID_TOKEN_CLAIMS);
            expect(accounts[2].idTokenClaims).toEqual(ID_TOKEN_ALT_CLAIMS);
        });

        it("getAllAccounts with isHomeTenant filter does not return guest tenant profiles as AccountInfo objects", () => {
            const homeAccounts = mockCache.cacheManager.getAllAccounts(
                {
                    isHomeTenant: true,
                },
                RANDOM_TEST_GUID
            );
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

                let accounts = mockCache.cacheManager.getAllAccounts(
                    successFilter,
                    RANDOM_TEST_GUID
                );
                expect(accounts.length).toEqual(1);

                const wrongFilter: AccountFilter = {
                    loginHint: "WrongHint",
                };
                accounts = mockCache.cacheManager.getAllAccounts(
                    wrongFilter,
                    RANDOM_TEST_GUID
                );
                expect(accounts.length).toBe(0);
            });

            it("loginHint filter matching username", () => {
                // filter by loginHint = preferred_username
                const successFilter: AccountFilter = {
                    loginHint: ID_TOKEN_CLAIMS.preferred_username,
                };

                let accounts = mockCache.cacheManager.getAllAccounts(
                    successFilter,
                    RANDOM_TEST_GUID
                );
                expect(accounts.length).toEqual(1);

                const wrongFilter: AccountFilter = {
                    loginHint: "WrongHint",
                };
                accounts = mockCache.cacheManager.getAllAccounts(
                    wrongFilter,
                    RANDOM_TEST_GUID
                );
                expect(accounts.length).toBe(0);
            });

            it("loginHint filter matching upn ID token claim", () => {
                // filter by loginHint = upn
                const successFilter: AccountFilter = {
                    loginHint: ID_TOKEN_CLAIMS.upn,
                };

                let accounts = mockCache.cacheManager.getAllAccounts(
                    successFilter,
                    RANDOM_TEST_GUID
                );
                expect(accounts.length).toEqual(1);

                const wrongFilter: AccountFilter = {
                    loginHint: "WrongHint",
                };
                accounts = mockCache.cacheManager.getAllAccounts(
                    wrongFilter,
                    RANDOM_TEST_GUID
                );
                expect(accounts.length).toBe(0);
            });
        });

        describe("getAllAccounts with filter", () => {
            it("Matches accounts by username", () => {
                expect(
                    mockCache.cacheManager.getAllAccounts({}, RANDOM_TEST_GUID)
                ).toHaveLength(3);
                const account1Filter = { username: account1.username };
                const account2Filter = { username: account2.username };
                const accounts = mockCache.cacheManager.getAllAccounts(
                    account1Filter,
                    RANDOM_TEST_GUID
                );
                expect(accounts).toHaveLength(1);
                expect(
                    mockCache.cacheManager.getAllAccounts(
                        account1Filter,
                        RANDOM_TEST_GUID
                    )[0].username
                ).toBe(account1.username);
                expect(
                    mockCache.cacheManager.getAllAccounts(
                        account2Filter,
                        RANDOM_TEST_GUID
                    )
                ).toHaveLength(1);
                expect(
                    mockCache.cacheManager.getAllAccounts(
                        account2Filter,
                        RANDOM_TEST_GUID
                    )[0].username
                ).toBe(account2.username);
            });

            it("Matches accounts by username when tenant profile upn is undefined", async () => {
                // Regression test: when TenantProfile.upn is undefined (the common case for AAD v2 tokens),
                // the username filter should still correctly filter accounts by preferred_username.
                const claimsWithoutUpn = {
                    ...ID_TOKEN_CLAIMS,
                    oid: "00000000-0000-0000-0000-111111111111",
                    tid: "00000000-0000-0000-0000-222222222222",
                    preferred_username: "noUpnUser@microsoft.com",
                    upn: undefined,
                };
                const accountWithoutUpn =
                    buildAccountFromIdTokenClaims(claimsWithoutUpn);
                await mockCache.cacheManager.setAccount(accountWithoutUpn);

                // Should match the account by its preferred_username
                const matchingFilter = {
                    username: "noUpnUser@microsoft.com",
                };
                const matchedAccounts = mockCache.cacheManager.getAllAccounts(
                    matchingFilter,
                    RANDOM_TEST_GUID
                );
                expect(matchedAccounts).toHaveLength(1);
                expect(matchedAccounts[0].username).toBe(
                    "noUpnUser@microsoft.com"
                );

                // Should NOT match a different username
                const nonMatchingFilter = {
                    username: "someOtherUser@microsoft.com",
                };
                const nonMatchedAccounts =
                    mockCache.cacheManager.getAllAccounts(
                        nonMatchingFilter,
                        RANDOM_TEST_GUID
                    );
                // Should not include the noUpnUser account
                expect(
                    nonMatchedAccounts.find(
                        (a) => a.username === "noUpnUser@microsoft.com"
                    )
                ).toBeUndefined();
            });

            it("Matches accounts by username via upn when preferred_username does not match", async () => {
                // Test that username filter falls back to upn when preferred_username doesn't match
                const claimsWithUpn = {
                    ...ID_TOKEN_CLAIMS,
                    oid: "00000000-0000-0000-0000-333333333333",
                    tid: "00000000-0000-0000-0000-444444444444",
                    preferred_username: "differentName@microsoft.com",
                    upn: "upnMatch@microsoft.com",
                };
                const accountWithUpn =
                    buildAccountFromIdTokenClaims(claimsWithUpn);
                await mockCache.cacheManager.setAccount(accountWithUpn);

                // Should match via upn fallback
                const upnFilter = {
                    username: "upnMatch@microsoft.com",
                };
                const matchedAccounts = mockCache.cacheManager.getAllAccounts(
                    upnFilter,
                    RANDOM_TEST_GUID
                );
                expect(matchedAccounts).toHaveLength(1);
                expect(matchedAccounts[0].tenantId).toBe(
                    "00000000-0000-0000-0000-444444444444"
                );
            });

            it("Matches accounts by homeAccountId", () => {
                expect(
                    mockCache.cacheManager.getAllAccounts({}, RANDOM_TEST_GUID)
                ).toHaveLength(3);
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
                        multiTenantAccountFilter,
                        RANDOM_TEST_GUID
                    );
                expect(multiTenantAccountProfiles).toHaveLength(2);
                expect(multiTenantAccountProfiles[0].homeAccountId).toBe(
                    account1.homeAccountId
                );

                // Set isHomeTenant = true to only get baseAccount
                const multiTenantAccountHomeTenantOnlyProfiles =
                    mockCache.cacheManager.getAllAccounts(
                        multiTenantAccountHomeTenantOnlyFilter,
                        RANDOM_TEST_GUID
                    );
                expect(multiTenantAccountHomeTenantOnlyProfiles).toHaveLength(
                    1
                );
                expect(
                    multiTenantAccountHomeTenantOnlyProfiles[0].tenantId
                ).toBe(account1.tenantId);
                expect(
                    mockCache.cacheManager.getAllAccounts(
                        account2Filter,
                        RANDOM_TEST_GUID
                    )
                ).toHaveLength(1);
                expect(
                    mockCache.cacheManager.getAllAccounts(
                        account2Filter,
                        RANDOM_TEST_GUID
                    )[0].homeAccountId
                ).toBe(account2.homeAccountId);
            });

            it("Matches accounts by localAccountId", () => {
                expect(
                    mockCache.cacheManager.getAllAccounts({}, RANDOM_TEST_GUID)
                ).toHaveLength(3);
                // Local account ID is sourced from ID token claims so for this test we compare against the decoded ID token claims instead of mock account object
                const account1Filter = {
                    localAccountId: ID_TOKEN_CLAIMS.oid,
                };
                const account2Filter = {
                    localAccountId: ID_TOKEN_ALT_CLAIMS.oid,
                };
                expect(
                    mockCache.cacheManager.getAllAccounts(
                        account1Filter,
                        RANDOM_TEST_GUID
                    )
                ).toHaveLength(1);
                expect(
                    mockCache.cacheManager.getAllAccounts(
                        account1Filter,
                        RANDOM_TEST_GUID
                    )[0].localAccountId
                ).toBe(account1Filter.localAccountId);
                expect(
                    mockCache.cacheManager.getAllAccounts(
                        account2Filter,
                        RANDOM_TEST_GUID
                    )
                ).toHaveLength(1);
                expect(
                    mockCache.cacheManager.getAllAccounts(
                        account2Filter,
                        RANDOM_TEST_GUID
                    )[0].localAccountId
                ).toBe(account2Filter.localAccountId);
            });

            it("Matches accounts by tenantId", () => {
                expect(
                    mockCache.cacheManager.getAllAccounts({}, RANDOM_TEST_GUID)
                ).toHaveLength(3);
                const firstTenantAccountFilter = {
                    tenantId: account1.tenantId,
                };
                const secondTenantAccountFilter = {
                    tenantId: account2.tenantId,
                };
                expect(
                    mockCache.cacheManager.getAllAccounts(
                        firstTenantAccountFilter,
                        RANDOM_TEST_GUID
                    )
                ).toHaveLength(1);
                expect(
                    mockCache.cacheManager.getAllAccounts(
                        firstTenantAccountFilter,
                        RANDOM_TEST_GUID
                    )[0].tenantId
                ).toBe(firstTenantAccountFilter.tenantId);
                // Guest profile of first user account is from the same tenant as account 2
                expect(
                    mockCache.cacheManager.getAllAccounts(
                        secondTenantAccountFilter,
                        RANDOM_TEST_GUID
                    )
                ).toHaveLength(2);
                expect(
                    mockCache.cacheManager.getAllAccounts(
                        secondTenantAccountFilter,
                        RANDOM_TEST_GUID
                    )[0].tenantId
                ).toBe(secondTenantAccountFilter.tenantId);
            });

            it("Matches accounts by environment", () => {
                expect(
                    mockCache.cacheManager.getAllAccounts({}, RANDOM_TEST_GUID)
                ).toHaveLength(3);
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
                        firstEnvironmentAccountsFilter,
                        RANDOM_TEST_GUID
                    )
                ).toHaveLength(2);
                expect(
                    mockCache.cacheManager.getAllAccounts(
                        firstEnvironmentAccountsFilter,
                        RANDOM_TEST_GUID
                    )[0].environment
                ).toBe(account1.environment);
                expect(
                    mockCache.cacheManager.getAllAccounts(
                        secondEnvironmentAccountsFilter,
                        RANDOM_TEST_GUID
                    )
                ).toHaveLength(1);
                expect(
                    mockCache.cacheManager.getAllAccounts(
                        secondEnvironmentAccountsFilter,
                        RANDOM_TEST_GUID
                    )[0].environment
                ).toBe(account2.environment);
            });

            it("Matches accounts by all filters", () => {
                expect(
                    mockCache.cacheManager.getAllAccounts({}, RANDOM_TEST_GUID)
                ).toHaveLength(3);
                const account1Filter = {
                    ...account1,
                    localAccountId: ID_TOKEN_CLAIMS.oid,
                };
                const account2Filter = {
                    ...account2,
                    localAccountId: ID_TOKEN_ALT_CLAIMS.oid,
                };
                expect(
                    mockCache.cacheManager.getAllAccounts(
                        account1Filter,
                        RANDOM_TEST_GUID
                    )
                ).toHaveLength(1);
                expect(
                    mockCache.cacheManager.getAllAccounts(
                        account1Filter,
                        RANDOM_TEST_GUID
                    )[0].localAccountId
                ).toBe(account1Filter.localAccountId);
                expect(
                    mockCache.cacheManager.getAllAccounts(
                        account2Filter,
                        RANDOM_TEST_GUID
                    )
                ).toHaveLength(1);
                expect(
                    mockCache.cacheManager.getAllAccounts(
                        account2Filter,
                        RANDOM_TEST_GUID
                    )[0].localAccountId
                ).toBe(account2Filter.localAccountId);
            });
        });
    });

    describe("getAccountInfoFilteredBy", () => {
        const multiTenantAccount = AccountEntityUtils.getAccountInfo(
            buildAccountFromIdTokenClaims(ID_TOKEN_CLAIMS, [
                GUEST_ID_TOKEN_CLAIMS,
            ])
        );
        it("returns null if no accounts match filter", () => {
            expect(
                mockCache.cacheManager.getAccountInfoFilteredBy(
                    {
                        homeAccountId: "inexistent-account-id",
                    },
                    RANDOM_TEST_GUID
                )
            ).toBeNull();
        });

        it("returns null if filter passed in contains empty values", () => {
            expect(
                mockCache.cacheManager.getAccountInfoFilteredBy(
                    {
                        homeAccountId: "",
                        loginHint: "",
                    },
                    RANDOM_TEST_GUID
                )
            ).toBeNull();
        });

        it("returns an account matching filter", () => {
            const resultAccount =
                mockCache.cacheManager.getAccountInfoFilteredBy(
                    {
                        homeAccountId: multiTenantAccount.homeAccountId,
                        tenantId: multiTenantAccount.tenantId,
                    },
                    RANDOM_TEST_GUID
                );
            expect(resultAccount).not.toBeNull();
            expect(resultAccount).toMatchObject(multiTenantAccount);
        });

        it("prioritizes the tenant profile with a matching ID token in the cache", () => {
            const mainIdTokenEntity = buildIdToken(
                ID_TOKEN_CLAIMS,
                TEST_TOKENS.IDTOKEN_V2,
                { homeAccountId: multiTenantAccount.homeAccountId }
            );
            const mainIdTokenKey = generateCredentialKey(mainIdTokenEntity);

            const filter = {
                homeAccountId: multiTenantAccount.homeAccountId,
            };
            // Remove main ID token
            mockCache.cacheManager.removeIdToken(
                mainIdTokenKey,
                RANDOM_TEST_GUID
            );
            const resultAccount =
                mockCache.cacheManager.getAccountInfoFilteredBy(
                    filter,
                    RANDOM_TEST_GUID
                );
            expect(resultAccount).not.toBeNull();
            expect(resultAccount?.tenantId).toBe(GUEST_ID_TOKEN_CLAIMS.tid);

            const allAccountsReversed = mockCache.cacheManager
                .getAllAccounts({}, RANDOM_TEST_GUID)
                .reverse();

            jest.spyOn(
                CacheManager.prototype,
                "getAllAccounts"
            ).mockReturnValueOnce(allAccountsReversed);

            const reversedResultAccount =
                mockCache.cacheManager.getAccountInfoFilteredBy(
                    filter,
                    RANDOM_TEST_GUID
                );
            expect(reversedResultAccount).not.toBeNull();
            expect(reversedResultAccount?.tenantId).toBe(
                GUEST_ID_TOKEN_CLAIMS.tid
            );
        });

        it("returns first inserted account when multiple accounts have idTokenClaims", () => {
            const filter = {
                homeAccountId: multiTenantAccount.homeAccountId,
            };

            // Verify insertion order: home tenant first, guest tenant second
            const allAccounts = mockCache.cacheManager.getAllAccounts(
                filter,
                RANDOM_TEST_GUID
            );
            expect(allAccounts).toHaveLength(2);
            expect(allAccounts[0].tenantId).toBe(ID_TOKEN_CLAIMS.tid);
            expect(allAccounts[1].tenantId).toBe(GUEST_ID_TOKEN_CLAIMS.tid);

            // getAccountInfoFilteredBy should return the first (home) account
            const resultAccount =
                mockCache.cacheManager.getAccountInfoFilteredBy(
                    filter,
                    RANDOM_TEST_GUID
                );
            expect(resultAccount).not.toBeNull();
            expect(resultAccount?.tenantId).toBe(ID_TOKEN_CLAIMS.tid);
        });

        it("returns account matching filter with isHomeTenant = true", () => {
            const resultAccount =
                mockCache.cacheManager.getAccountInfoFilteredBy(
                    {
                        homeAccountId: multiTenantAccount.homeAccountId,
                        tenantId: multiTenantAccount.tenantId,
                        isHomeTenant: true,
                    },
                    RANDOM_TEST_GUID
                );
            expect(resultAccount).not.toBeNull();
            expect(resultAccount).toMatchObject(multiTenantAccount);
        });

        it("should return guest account when isHomeTenant filter is false", () => {
            // Test the case where isHomeTenant=false filter is used and should match guest tenant profiles
            const guestAccount =
                mockCache.cacheManager.getAccountInfoFilteredBy(
                    {
                        homeAccountId: multiTenantAccount.homeAccountId,
                        isHomeTenant: false,
                    },
                    RANDOM_TEST_GUID
                );

            expect(guestAccount).not.toBeNull();
            expect(guestAccount?.tenantProfiles).toBeDefined();
            if (guestAccount?.tenantProfiles) {
                const currentTenantProfile = guestAccount.tenantProfiles.get(
                    guestAccount.tenantId
                );
                expect(currentTenantProfile?.isHomeTenant).toBe(false);
            }
        });

        it("should return null when filter values are undefined", () => {
            // Test that when isHomeTenant filter is undefined, it doesn't affect filtering
            const accountWithUndefinedFilter =
                mockCache.cacheManager.getAccountInfoFilteredBy(
                    {
                        homeAccountId: undefined,
                        isHomeTenant: undefined,
                    },
                    RANDOM_TEST_GUID
                );

            expect(accountWithUndefinedFilter).toEqual(null);
        });

        it("should filter combined with other filters properly", () => {
            // Test that isHomeTenant filter works in combination with other filters
            const accountByIdAndHomeTenant =
                mockCache.cacheManager.getAccountInfoFilteredBy(
                    {
                        homeAccountId: multiTenantAccount.homeAccountId,
                        tenantId: multiTenantAccount.tenantId,
                        isHomeTenant: true,
                    },
                    RANDOM_TEST_GUID
                );

            expect(accountByIdAndHomeTenant).not.toBeNull();
            expect(accountByIdAndHomeTenant?.homeAccountId).toEqual(
                multiTenantAccount.homeAccountId
            );
            expect(accountByIdAndHomeTenant?.tenantId).toEqual(
                multiTenantAccount.tenantId
            );

            if (accountByIdAndHomeTenant?.tenantProfiles) {
                const currentTenantProfile =
                    accountByIdAndHomeTenant.tenantProfiles.get(
                        accountByIdAndHomeTenant.tenantId
                    );
                expect(currentTenantProfile?.isHomeTenant).toBe(true);
            }
        });

        it("should return null when no matching tenant profiles exist", () => {
            // Test edge case where filter criteria don't match any profiles
            const nonExistentAccount =
                mockCache.cacheManager.getAccountInfoFilteredBy(
                    {
                        homeAccountId: "non-existent-id",
                        isHomeTenant: true,
                    },
                    RANDOM_TEST_GUID
                );

            expect(nonExistentAccount).toBeNull();
        });
    });

    describe("getBaseAccountInfo", () => {
        it("returns base account regardless of tenantId", () => {
            const multiTenantAccount = AccountEntityUtils.getAccountInfo(
                buildAccountFromIdTokenClaims(ID_TOKEN_CLAIMS, [
                    GUEST_ID_TOKEN_CLAIMS,
                ])
            );
            const resultAccount = mockCache.cacheManager.getBaseAccountInfo(
                {
                    homeAccountId: multiTenantAccount.homeAccountId,
                    tenantId: GUEST_ID_TOKEN_CLAIMS.tid,
                },
                RANDOM_TEST_GUID
            );

            expect(resultAccount).toEqual(multiTenantAccount);
        });

        it("returns null if no account matches filter", () => {
            expect(
                mockCache.cacheManager.getBaseAccountInfo(
                    {
                        homeAccountId: "inexistent-homeaccountid",
                    },
                    RANDOM_TEST_GUID
                )
            ).toBeNull();
        });
    });

    it("getAccount (gets one AccountEntity object)", async () => {
        const ac: AccountEntity = {
            homeAccountId: "someUid.someUtid",
            environment: "login.microsoftonline.com",
            realm: "microsoft",
            localAccountId: "object1234",
            username: "Jane Goodman",
            authorityType: "MSSTS",
            lastUpdatedAt: Date.now().toString(),
        };

        const accountKey = generateAccountKey(
            AccountEntityUtils.getAccountInfo(ac)
        );
        const cacheRecord: CacheRecord = {};
        cacheRecord.account = ac;
        await mockCache.cacheManager.saveCacheRecord(
            cacheRecord,
            TEST_CONFIG.CORRELATION_ID,
            true,
            0
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
            lastUpdatedAt: Date.now().toString(),
        };

        const credKey = generateCredentialKey(accessTokenEntity);
        const cacheRecord: CacheRecord = {};
        cacheRecord.accessToken = accessTokenEntity;
        await mockCache.cacheManager.saveCacheRecord(
            cacheRecord,
            TEST_CONFIG.CORRELATION_ID,
            true,
            0
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
            lastUpdatedAt: Date.now().toString(),
        };

        const credKey = generateCredentialKey(accessTokenEntity);
        const cacheRecord: CacheRecord = {};
        cacheRecord.accessToken = accessTokenEntity;
        await mockCache.cacheManager.saveCacheRecord(
            cacheRecord,
            TEST_CONFIG.CORRELATION_ID,
            true,
            0
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
            let accounts = mockCache.cacheManager.getAccountsFilteredBy(
                successFilter,
                RANDOM_TEST_GUID
            );
            // getAccountsFilteredBy only gets cached accounts, so don't expect all tenant profiles to be returned as account objects
            expect(Object.keys(accounts).length).toEqual(1);

            const wrongFilter: AccountFilter = { homeAccountId: "Wrong Id" };
            accounts = mockCache.cacheManager.getAccountsFilteredBy(
                wrongFilter,
                RANDOM_TEST_GUID
            );
            expect(Object.keys(accounts).length).toEqual(0);
        });

        it("environment filter", () => {
            // filter by environment
            const successFilter: AccountFilter = {
                environment: matchAccountEntity.environment,
            };
            let accounts = mockCache.cacheManager.getAccountsFilteredBy(
                successFilter,
                RANDOM_TEST_GUID
            );
            // Both cached accounts have environments that are aliases of eachother, expect both to match
            expect(Object.keys(accounts).length).toEqual(2);
            jest.restoreAllMocks();

            const wrongFilter: AccountFilter = { environment: "Wrong Env" };
            accounts = mockCache.cacheManager.getAccountsFilteredBy(
                wrongFilter,
                RANDOM_TEST_GUID
            );
            expect(Object.keys(accounts).length).toEqual(0);
        });

        it("realm filter", () => {
            // filter by realm
            const successFilter: AccountFilter = {
                realm: matchAccountEntity.realm,
            };
            let accounts = mockCache.cacheManager.getAccountsFilteredBy(
                successFilter,
                RANDOM_TEST_GUID
            );
            expect(Object.keys(accounts).length).toEqual(1);

            const wrongFilter: AccountFilter = { realm: "Wrong Realm" };
            accounts = mockCache.cacheManager.getAccountsFilteredBy(
                wrongFilter,
                RANDOM_TEST_GUID
            );
            expect(Object.keys(accounts).length).toEqual(0);
        });

        it("nativeAccountId filter", () => {
            // filter by nativeAccountId
            const successFilter: AccountFilter = {
                nativeAccountId: "mocked_native_account_id",
            };
            let accounts = mockCache.cacheManager.getAccountsFilteredBy(
                successFilter,
                RANDOM_TEST_GUID
            );
            expect(Object.keys(accounts).length).toEqual(1);

            const wrongFilter: AccountFilter = { realm: "notNativeAccountId" };
            accounts = mockCache.cacheManager.getAccountsFilteredBy(
                wrongFilter,
                RANDOM_TEST_GUID
            );
            expect(Object.keys(accounts).length).toEqual(0);
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
                mockCache.cacheManager.credentialMatchesFilter(
                    testIdToken,
                    {
                        homeAccountId: testIdToken.homeAccountId,
                    },
                    TEST_CONFIG.CORRELATION_ID
                )
            ).toBe(true);
            expect(
                mockCache.cacheManager.credentialMatchesFilter(
                    testAccessToken,
                    {
                        homeAccountId: testAccessToken.homeAccountId,
                    },
                    TEST_CONFIG.CORRELATION_ID
                )
            ).toBe(true);
            expect(
                mockCache.cacheManager.credentialMatchesFilter(
                    testRefreshToken,
                    {
                        homeAccountId: testRefreshToken.homeAccountId,
                    },
                    TEST_CONFIG.CORRELATION_ID
                )
            ).toBe(true);

            // Test failure cases
            expect(
                mockCache.cacheManager.credentialMatchesFilter(
                    testIdToken,
                    {
                        homeAccountId: "someuid.someutid",
                    },
                    TEST_CONFIG.CORRELATION_ID
                )
            ).toBe(false);
            expect(
                mockCache.cacheManager.credentialMatchesFilter(
                    testAccessToken,
                    {
                        homeAccountId: "someuid.someutid",
                    },
                    TEST_CONFIG.CORRELATION_ID
                )
            ).toBe(false);
            expect(
                mockCache.cacheManager.credentialMatchesFilter(
                    testRefreshToken,
                    {
                        homeAccountId: "someuid.someutid",
                    },
                    TEST_CONFIG.CORRELATION_ID
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
                        },
                        TEST_CONFIG.CORRELATION_ID
                    )
                ).toBe(true);
                expect(
                    mockCache.cacheManager.credentialMatchesFilter(
                        testAccessToken,
                        {
                            environment: testAccessToken.environment,
                        },
                        TEST_CONFIG.CORRELATION_ID
                    )
                ).toBe(true);
                expect(
                    mockCache.cacheManager.credentialMatchesFilter(
                        testRefreshToken,
                        {
                            environment: testRefreshToken.environment,
                        },
                        TEST_CONFIG.CORRELATION_ID
                    )
                ).toBe(true);

                // Test failure cases
                expect(
                    mockCache.cacheManager.credentialMatchesFilter(
                        testIdToken,
                        {
                            environment: "wrong.contoso.com",
                        },
                        TEST_CONFIG.CORRELATION_ID
                    )
                ).toBe(false);
                expect(
                    mockCache.cacheManager.credentialMatchesFilter(
                        testAccessToken,
                        {
                            environment: "wrong.contoso.com",
                        },
                        TEST_CONFIG.CORRELATION_ID
                    )
                ).toBe(false);
                expect(
                    mockCache.cacheManager.credentialMatchesFilter(
                        testRefreshToken,
                        {
                            environment: "wrong.contoso.com",
                        },
                        TEST_CONFIG.CORRELATION_ID
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
                            },
                            TEST_CONFIG.CORRELATION_ID
                        )
                    ).toBe(true);
                });

                it("Access token matches when filter contains its own enviroment", () => {
                    expect(
                        mockCache.cacheManager.credentialMatchesFilter(
                            testAccessToken,
                            {
                                environment: testAccessToken.environment,
                            },
                            TEST_CONFIG.CORRELATION_ID
                        )
                    ).toBe(true);
                });

                it("Refresh token matches when filter contains its own environment", () => {
                    expect(
                        mockCache.cacheManager.credentialMatchesFilter(
                            testRefreshToken,
                            {
                                environment: testRefreshToken.environment,
                            },
                            TEST_CONFIG.CORRELATION_ID
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
                            },
                            TEST_CONFIG.CORRELATION_ID
                        )
                    ).toBe(true);
                });

                it("Access token does not match when filter contains a different environment", () => {
                    expect(
                        mockCache.cacheManager.credentialMatchesFilter(
                            testAccessToken,
                            {
                                environment: "wrong.contoso.com",
                            },
                            TEST_CONFIG.CORRELATION_ID
                        )
                    ).toBe(false);
                });

                it("Refresh token does not match when filter contains a different environment", () => {
                    expect(
                        mockCache.cacheManager.credentialMatchesFilter(
                            testRefreshToken,
                            {
                                environment: "wrong.contoso.com",
                            },
                            TEST_CONFIG.CORRELATION_ID
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
                        },
                        TEST_CONFIG.CORRELATION_ID
                    )
                ).toBe(true);
                expect(
                    mockCache.cacheManager.credentialMatchesFilter(
                        testAccessToken,
                        {
                            environment: testAccessToken.environment,
                        },
                        TEST_CONFIG.CORRELATION_ID
                    )
                ).toBe(true);
                expect(
                    mockCache.cacheManager.credentialMatchesFilter(
                        testRefreshToken,
                        {
                            environment: testRefreshToken.environment,
                        },
                        TEST_CONFIG.CORRELATION_ID
                    )
                ).toBe(true);

                // Test failure cases
                expect(
                    mockCache.cacheManager.credentialMatchesFilter(
                        testIdToken,
                        {
                            environment: "wrong.contoso.com",
                        },
                        TEST_CONFIG.CORRELATION_ID
                    )
                ).toBe(false);
                expect(
                    mockCache.cacheManager.credentialMatchesFilter(
                        testAccessToken,
                        {
                            environment: "wrong.contoso.com",
                        },
                        TEST_CONFIG.CORRELATION_ID
                    )
                ).toBe(false);
                expect(
                    mockCache.cacheManager.credentialMatchesFilter(
                        testRefreshToken,
                        {
                            environment: "wrong.contoso.com",
                        },
                        TEST_CONFIG.CORRELATION_ID
                    )
                ).toBe(false);
            });
        });

        it("realm filter", () => {
            // filter by realm
            expect(
                mockCache.cacheManager.credentialMatchesFilter(
                    testIdToken,
                    {
                        realm: testIdToken.realm,
                    },
                    TEST_CONFIG.CORRELATION_ID
                )
            ).toBe(true);
            expect(
                mockCache.cacheManager.credentialMatchesFilter(
                    testAccessToken,
                    {
                        realm: testAccessToken.realm,
                    },
                    TEST_CONFIG.CORRELATION_ID
                )
            ).toBe(true);
            expect(
                mockCache.cacheManager.credentialMatchesFilter(
                    testRefreshToken,
                    {
                        realm: testRefreshToken.realm,
                    },
                    TEST_CONFIG.CORRELATION_ID
                )
            ).toBe(true);

            // Test failure cases
            expect(
                mockCache.cacheManager.credentialMatchesFilter(
                    testIdToken,
                    {
                        realm: "fake-realm",
                    },
                    TEST_CONFIG.CORRELATION_ID
                )
            ).toBe(false);
            expect(
                mockCache.cacheManager.credentialMatchesFilter(
                    testAccessToken,
                    {
                        realm: "fake-realm",
                    },
                    TEST_CONFIG.CORRELATION_ID
                )
            ).toBe(false);
            expect(
                mockCache.cacheManager.credentialMatchesFilter(
                    testRefreshToken,
                    {
                        realm: "fake-realm",
                    },
                    TEST_CONFIG.CORRELATION_ID
                )
            ).toBe(false);
        });

        it("credentialType filter", () => {
            // filter by credentialType
            expect(
                mockCache.cacheManager.credentialMatchesFilter(
                    testIdToken,
                    {
                        credentialType: CredentialType.ID_TOKEN,
                    },
                    TEST_CONFIG.CORRELATION_ID
                )
            ).toBe(true);
            expect(
                mockCache.cacheManager.credentialMatchesFilter(
                    testAccessToken,
                    {
                        credentialType: CredentialType.ACCESS_TOKEN,
                    },
                    TEST_CONFIG.CORRELATION_ID
                )
            ).toBe(true);
            expect(
                mockCache.cacheManager.credentialMatchesFilter(
                    testRefreshToken,
                    {
                        credentialType: CredentialType.REFRESH_TOKEN,
                    },
                    TEST_CONFIG.CORRELATION_ID
                )
            ).toBe(true);

            // Test failure cases
            expect(
                mockCache.cacheManager.credentialMatchesFilter(
                    testIdToken,
                    {
                        credentialType: CredentialType.ACCESS_TOKEN,
                    },
                    TEST_CONFIG.CORRELATION_ID
                )
            ).toBe(false);
            expect(
                mockCache.cacheManager.credentialMatchesFilter(
                    testIdToken,
                    {
                        credentialType: CredentialType.REFRESH_TOKEN,
                    },
                    TEST_CONFIG.CORRELATION_ID
                )
            ).toBe(false);

            expect(
                mockCache.cacheManager.credentialMatchesFilter(
                    testAccessToken,
                    {
                        credentialType: CredentialType.ID_TOKEN,
                    },
                    TEST_CONFIG.CORRELATION_ID
                )
            ).toBe(false);
            expect(
                mockCache.cacheManager.credentialMatchesFilter(
                    testAccessToken,
                    {
                        credentialType: CredentialType.REFRESH_TOKEN,
                    },
                    TEST_CONFIG.CORRELATION_ID
                )
            ).toBe(false);

            expect(
                mockCache.cacheManager.credentialMatchesFilter(
                    testRefreshToken,
                    {
                        credentialType: CredentialType.ID_TOKEN,
                    },
                    TEST_CONFIG.CORRELATION_ID
                )
            ).toBe(false);
            expect(
                mockCache.cacheManager.credentialMatchesFilter(
                    testRefreshToken,
                    {
                        credentialType: CredentialType.ACCESS_TOKEN,
                    },
                    TEST_CONFIG.CORRELATION_ID
                )
            ).toBe(false);
        });

        it("credentialType filter (Access Tokens with and without Auth Scheme)", () => {
            const accessToken = mockCache.cacheManager.getAccessTokensByFilter(
                {
                    credentialType: "AccessToken",
                },
                RANDOM_TEST_GUID
            );
            expect(
                mockCache.cacheManager.credentialMatchesFilter(
                    accessToken[0],
                    {
                        credentialType: CredentialType.ACCESS_TOKEN,
                    },
                    TEST_CONFIG.CORRELATION_ID
                )
            ).toBe(true);
            expect(
                mockCache.cacheManager.credentialMatchesFilter(
                    accessToken[0],
                    {
                        credentialType:
                            CredentialType.ACCESS_TOKEN_WITH_AUTH_SCHEME,
                    },
                    TEST_CONFIG.CORRELATION_ID
                )
            ).toBe(false);

            const accessTokenWithAuthScheme =
                mockCache.cacheManager.getAccessTokensByFilter(
                    {
                        credentialType:
                            CredentialType.ACCESS_TOKEN_WITH_AUTH_SCHEME,
                    },
                    RANDOM_TEST_GUID
                );
            expect(
                mockCache.cacheManager.credentialMatchesFilter(
                    accessTokenWithAuthScheme[0],
                    { credentialType: CredentialType.ACCESS_TOKEN },
                    TEST_CONFIG.CORRELATION_ID
                )
            ).toBe(false);
            expect(
                mockCache.cacheManager.credentialMatchesFilter(
                    accessTokenWithAuthScheme[0],
                    {
                        credentialType:
                            CredentialType.ACCESS_TOKEN_WITH_AUTH_SCHEME,
                    },
                    TEST_CONFIG.CORRELATION_ID
                )
            ).toBe(true);
        });

        it("clientId filter", () => {
            // filter by clientId
            expect(
                mockCache.cacheManager.credentialMatchesFilter(
                    testIdToken,
                    {
                        clientId: testIdToken.clientId,
                    },
                    TEST_CONFIG.CORRELATION_ID
                )
            ).toBe(true);
            expect(
                mockCache.cacheManager.credentialMatchesFilter(
                    testAccessToken,
                    {
                        clientId: testAccessToken.clientId,
                    },
                    TEST_CONFIG.CORRELATION_ID
                )
            ).toBe(true);
            expect(
                mockCache.cacheManager.credentialMatchesFilter(
                    testRefreshToken,
                    {
                        clientId: testRefreshToken.clientId,
                    },
                    TEST_CONFIG.CORRELATION_ID
                )
            ).toBe(true);

            // Test failure cases
            expect(
                mockCache.cacheManager.credentialMatchesFilter(
                    testIdToken,
                    {
                        clientId: "wrong_client_id",
                    },
                    TEST_CONFIG.CORRELATION_ID
                )
            ).toBe(false);
            expect(
                mockCache.cacheManager.credentialMatchesFilter(
                    testAccessToken,
                    {
                        clientId: "wrong_client_id",
                    },
                    TEST_CONFIG.CORRELATION_ID
                )
            ).toBe(false);
            expect(
                mockCache.cacheManager.credentialMatchesFilter(
                    testRefreshToken,
                    {
                        clientId: "wrong_client_id",
                    },
                    TEST_CONFIG.CORRELATION_ID
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
                            testAccessToken.target.split(" "),
                            ""
                        ),
                    },
                    TEST_CONFIG.CORRELATION_ID
                )
            ).toBe(true);

            // Test failure cases
            expect(
                mockCache.cacheManager.credentialMatchesFilter(
                    testAccessToken,
                    {
                        target: ScopeSet.createSearchScopes(
                            ["wrong_scope"],
                            ""
                        ),
                    },
                    TEST_CONFIG.CORRELATION_ID
                )
            ).toBe(false);
        });

        it("tokenType filter", () => {
            const accessToken = mockCache.cacheManager.getAccessTokensByFilter(
                {
                    credentialType:
                        CredentialType.ACCESS_TOKEN_WITH_AUTH_SCHEME,
                    tokenType: AuthenticationScheme.BEARER,
                },
                RANDOM_TEST_GUID
            );
            expect(
                mockCache.cacheManager.credentialMatchesFilter(
                    accessToken[0],
                    {
                        tokenType: AuthenticationScheme.BEARER,
                    },
                    TEST_CONFIG.CORRELATION_ID
                )
            ).toBe(true);
            expect(
                mockCache.cacheManager.credentialMatchesFilter(
                    accessToken[0],
                    {
                        tokenType: AuthenticationScheme.POP,
                    },
                    TEST_CONFIG.CORRELATION_ID
                )
            ).toBe(false);
            expect(
                mockCache.cacheManager.credentialMatchesFilter(
                    accessToken[0],
                    {
                        tokenType: AuthenticationScheme.SSH,
                    },
                    TEST_CONFIG.CORRELATION_ID
                )
            ).toBe(false);

            const popToken = mockCache.cacheManager.getAccessTokensByFilter(
                {
                    credentialType:
                        CredentialType.ACCESS_TOKEN_WITH_AUTH_SCHEME,
                    tokenType: AuthenticationScheme.POP,
                },
                RANDOM_TEST_GUID
            );
            expect(
                mockCache.cacheManager.credentialMatchesFilter(
                    popToken[0],
                    {
                        tokenType: AuthenticationScheme.BEARER,
                    },
                    TEST_CONFIG.CORRELATION_ID
                )
            ).toBe(false);
            expect(
                mockCache.cacheManager.credentialMatchesFilter(
                    popToken[0],
                    {
                        tokenType: AuthenticationScheme.POP,
                    },
                    TEST_CONFIG.CORRELATION_ID
                )
            ).toBe(true);
            expect(
                mockCache.cacheManager.credentialMatchesFilter(
                    popToken[0],
                    {
                        tokenType: AuthenticationScheme.SSH,
                    },
                    TEST_CONFIG.CORRELATION_ID
                )
            ).toBe(false);

            const sshToken = mockCache.cacheManager.getAccessTokensByFilter(
                {
                    credentialType:
                        CredentialType.ACCESS_TOKEN_WITH_AUTH_SCHEME,
                    tokenType: AuthenticationScheme.SSH,
                },
                RANDOM_TEST_GUID
            );
            expect(
                mockCache.cacheManager.credentialMatchesFilter(
                    sshToken[0],
                    {
                        tokenType: AuthenticationScheme.BEARER,
                    },
                    TEST_CONFIG.CORRELATION_ID
                )
            ).toBe(false);
            expect(
                mockCache.cacheManager.credentialMatchesFilter(
                    sshToken[0],
                    {
                        tokenType: AuthenticationScheme.POP,
                    },
                    TEST_CONFIG.CORRELATION_ID
                )
            ).toBe(false);
            expect(
                mockCache.cacheManager.credentialMatchesFilter(
                    sshToken[0],
                    {
                        tokenType: AuthenticationScheme.SSH,
                    },
                    TEST_CONFIG.CORRELATION_ID
                )
            ).toBe(true);
        });

        it("additionalCacheKeyComponents bidirectional isolation", () => {
            // Entity with components should NOT match filter without them
            const entityWithComponents = {
                ...testAccessToken,
                additionalCacheKeyComponents: { fmi_path: "agent123" },
            };
            expect(
                mockCache.cacheManager.credentialMatchesFilter(
                    entityWithComponents,
                    {},
                    TEST_CONFIG.CORRELATION_ID
                )
            ).toBe(false);

            // Entity without components should NOT match filter with them
            expect(
                mockCache.cacheManager.credentialMatchesFilter(
                    testAccessToken,
                    {
                        additionalCacheKeyComponents: {
                            fmi_path: "agent123",
                        },
                    },
                    TEST_CONFIG.CORRELATION_ID
                )
            ).toBe(false);

            // Entity with components should match filter with same components
            expect(
                mockCache.cacheManager.credentialMatchesFilter(
                    entityWithComponents,
                    {
                        additionalCacheKeyComponents: {
                            fmi_path: "agent123",
                        },
                    },
                    TEST_CONFIG.CORRELATION_ID
                )
            ).toBe(true);

            // Entity with different component values should NOT match
            expect(
                mockCache.cacheManager.credentialMatchesFilter(
                    entityWithComponents,
                    {
                        additionalCacheKeyComponents: {
                            fmi_path: "differentAgent",
                        },
                    },
                    TEST_CONFIG.CORRELATION_ID
                )
            ).toBe(false);

            // Entity with multiple components must match all key-value pairs
            const entityWithMultipleComponents = {
                ...testAccessToken,
                additionalCacheKeyComponents: {
                    claims_hash: "abc",
                    fmi_path: "agent123",
                },
            };
            expect(
                mockCache.cacheManager.credentialMatchesFilter(
                    entityWithMultipleComponents,
                    {
                        additionalCacheKeyComponents: {
                            claims_hash: "abc",
                            fmi_path: "agent123",
                        },
                    },
                    TEST_CONFIG.CORRELATION_ID
                )
            ).toBe(true);
            expect(
                mockCache.cacheManager.credentialMatchesFilter(
                    entityWithMultipleComponents,
                    {
                        additionalCacheKeyComponents: {
                            fmi_path: "agent123",
                        },
                    },
                    TEST_CONFIG.CORRELATION_ID
                )
            ).toBe(false);

            // Entity without components should match filter without them
            expect(
                mockCache.cacheManager.credentialMatchesFilter(
                    testAccessToken,
                    {},
                    TEST_CONFIG.CORRELATION_ID
                )
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

            let accessTokens = mockCache.cacheManager.getAccessTokensByFilter(
                successFilter,
                RANDOM_TEST_GUID
            );
            expect(accessTokens.length).toEqual(1);

            const wrongFilter = {
                ...successFilter,
                keyId: "wrong_key_id",
            };

            accessTokens = mockCache.cacheManager.getAccessTokensByFilter(
                wrongFilter,
                RANDOM_TEST_GUID
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
                successFilterWithRCHash,
                RANDOM_TEST_GUID
            );
            expect(accessTokens.length).toEqual(1);

            // userAssertionHash present in request and cache, not matching
            const wrongFilterWithRCHash = {
                ...successFilterWithRCHash,
                userAssertionHash: "wrong_hash",
            };

            accessTokens = mockCache.cacheManager.getAccessTokensByFilter(
                wrongFilterWithRCHash,
                RANDOM_TEST_GUID
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
                CACHE_MOCKS.MOCK_ACCOUNT_INFO.environment,
                TEST_CONFIG.CORRELATION_ID
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
        mockCache.cacheManager.removeAppMetadata(RANDOM_TEST_GUID);
        expect(
            mockCache.cacheManager.getAppMetadata(
                "appmetadata-login.microsoftonline.com-mock_client_id"
            )
        ).toBeUndefined();
    });

    it("removeAllAccounts", () => {
        const accountsBeforeRemove = mockCache.cacheManager.getAllAccounts(
            {},
            RANDOM_TEST_GUID
        );
        mockCache.cacheManager.removeAllAccounts(RANDOM_TEST_GUID);
        const accountsAfterRemove = mockCache.cacheManager.getAllAccounts(
            {},
            RANDOM_TEST_GUID
        );

        expect(accountsBeforeRemove).toHaveLength(3);
        expect(accountsAfterRemove).toHaveLength(0);
    });

    it("removeAccount", () => {
        const accountToRemove = buildAccountFromIdTokenClaims(ID_TOKEN_CLAIMS);
        const accountToRemoveKey = generateAccountKey(
            AccountEntityUtils.getAccountInfo(accountToRemove)
        );
        expect(
            mockCache.cacheManager.getAccount(accountToRemoveKey)
        ).not.toBeNull();
        mockCache.cacheManager.removeAccount(
            AccountEntityUtils.getAccountInfo(accountToRemove),
            RANDOM_TEST_GUID
        );
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
            lastUpdatedAt: Date.now().toString(),
        };

        mockCache.cacheManager.removeAccessToken(
            generateCredentialKey(at),
            RANDOM_TEST_GUID
        );
        const atKey = generateCredentialKey(at);
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
            lastUpdatedAt: Date.now().toString(),
        };

        const removeTokenBindingKeySpy = jest.spyOn(
            mockCrypto,
            "removeTokenBindingKey"
        );

        mockCache.cacheManager.removeAccessToken(
            generateCredentialKey(atWithAuthScheme),
            RANDOM_TEST_GUID
        );
        const atKey = generateCredentialKey(atWithAuthScheme);
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
            lastUpdatedAt: Date.now().toString(),
        };

        const removeTokenBindingKeySpy = jest.spyOn(
            mockCrypto,
            "removeTokenBindingKey"
        );

        mockCache.cacheManager.removeAccessToken(
            generateCredentialKey(atWithAuthScheme),
            RANDOM_TEST_GUID
        );
        const atKey = generateCredentialKey(atWithAuthScheme);
        expect(mockCache.cacheManager.getAccount(atKey)).toBeNull();
        expect(removeTokenBindingKeySpy).toHaveBeenCalledTimes(0);
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
                    "",
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
                    "",
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
                {} as AccountEntity,
                accountData
            );

            await mockCache.cacheManager.setAccessTokenCredential(
                mockedAtEntity,
                "",
                false
            );
            await mockCache.cacheManager.setAccessTokenCredential(
                mockedAtEntity2,
                "",
                false
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
                loginHint: "loginHint",
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
                    silentFlowRequest,
                    undefined,
                    undefined
                )
            ).toBeNull();
            expect(
                mockCache.cacheManager.getTokenKeys().accessToken.length
            ).toEqual(0);
            done();
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
                "",
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
                "",
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
                "",
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
            {} as AccountEntity,
            accountData
        );

        await mockCache.cacheManager.setAccessTokenCredential(
            mockedAtEntity,
            "",
            false
        );
        await mockCache.cacheManager.setAccessTokenCredential(
            mockedPopAtEntity,
            "",
            false
        );
        await mockCache.cacheManager.setAccessTokenCredential(
            mockedSshAtEntity,
            "",
            false
        );
        await mockCache.cacheManager.setAccount(mockedAccount);

        const mockedAccountInfo: AccountInfo = {
            homeAccountId: "uid.utid",
            localAccountId: "uid",
            environment: "login.microsoftonline.com",
            tenantId: TEST_CONFIG.TENANT,
            username: "John Doe",
            loginHint: "testLoginHint",
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
                "",
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
            {} as AccountEntity,
            accountData
        );

        await mockCache.cacheManager.setAccessTokenCredential(
            mockedAtEntity,
            "",
            false
        );

        await mockCache.cacheManager.setAccount(mockedAccount);

        const mockedAccountInfo: AccountInfo = {
            homeAccountId: "uid.utid",
            localAccountId: "uid",
            environment: "login.microsoftonline.com",
            tenantId: TEST_CONFIG.TENANT,
            username: "John Doe",
            loginHint: "testLoginHint",
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
                "",
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
                "",
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
                "",
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
            {} as AccountEntity,
            accountData
        );

        await mockCache.cacheManager.setAccessTokenCredential(
            mockedAtEntity,
            "",
            false
        );
        await mockCache.cacheManager.setAccessTokenCredential(
            mockedPopAtEntity,
            "",
            false
        );
        await mockCache.cacheManager.setAccessTokenCredential(
            mockedSshAtEntity,
            "",
            false
        );
        await mockCache.cacheManager.setAccount(mockedAccount);

        const mockedAccountInfo: AccountInfo = {
            homeAccountId: "uid.utid",
            localAccountId: "uid",
            environment: "login.microsoftonline.com",
            tenantId: TEST_CONFIG.TENANT,
            username: "John Doe",
            loginHint: "testLoginHint",
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
                "",
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
                "",
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
                "",
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
            {} as AccountEntity,
            accountData
        );

        await mockCache.cacheManager.setAccessTokenCredential(
            mockedAtEntity,
            "",
            false
        );
        await mockCache.cacheManager.setAccessTokenCredential(
            mockedPopAtEntity,
            "",
            false
        );
        await mockCache.cacheManager.setAccessTokenCredential(
            mockedSshAtEntity,
            "",
            false
        );
        await mockCache.cacheManager.setAccount(mockedAccount);

        const mockedAccountInfo: AccountInfo = {
            homeAccountId: "uid.utid",
            localAccountId: "uid",
            environment: "login.microsoftonline.com",
            tenantId: TEST_CONFIG.TENANT,
            username: "John Doe",
            loginHint: "testLoginHint",
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

    it("getAccessToken ignores sshKid as request key context for DPoP", async () => {
        const mockedAtEntity = CacheHelpers.createAccessTokenEntity(
            "uid.utid",
            "login.microsoftonline.com",
            "access_token",
            CACHE_MOCKS.MOCK_CLIENT_ID,
            TEST_CONFIG.TENANT,
            TEST_CONFIG.DEFAULT_GRAPH_SCOPE.toString(),
            4600,
            4600,
            mockCrypto.base64Decode,
            "",
            500,
            AuthenticationScheme.BEARER,
            undefined,
            undefined
        );
        const mockedPopAtEntity = CacheHelpers.createAccessTokenEntity(
            "uid.utid",
            "login.microsoftonline.com",
            TEST_TOKENS.POP_TOKEN,
            CACHE_MOCKS.MOCK_CLIENT_ID,
            TEST_CONFIG.TENANT,
            "User.Read test_scope",
            4600,
            4600,
            mockCrypto.base64Decode,
            "",
            500,
            AuthenticationScheme.POP,
            TEST_TOKENS.ACCESS_TOKEN
        );
        const mockedDpopAtEntity = CacheHelpers.createAccessTokenEntity(
            "uid.utid",
            "login.microsoftonline.com",
            TEST_DPOP_VALUES.ACCESS_TOKEN,
            CACHE_MOCKS.MOCK_CLIENT_ID,
            TEST_CONFIG.TENANT,
            "User.Read test_scope",
            4600,
            4600,
            mockCrypto.base64Decode,
            TEST_CONFIG.CORRELATION_ID,
            500,
            DPOP_AUTHENTICATION_SCHEME,
            undefined,
            TEST_DPOP_VALUES.ACCESS_TOKEN_JKT
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
            {} as AccountEntity,
            accountData
        );

        await mockCache.cacheManager.setAccessTokenCredential(
            mockedAtEntity,
            "",
            false
        );
        await mockCache.cacheManager.setAccessTokenCredential(
            mockedPopAtEntity,
            "",
            false
        );
        await mockCache.cacheManager.setAccessTokenCredential(
            mockedDpopAtEntity,
            "",
            false
        );
        await mockCache.cacheManager.setAccount(mockedAccount);

        const mockedAccountInfo: AccountInfo = {
            homeAccountId: "uid.utid",
            localAccountId: "uid",
            environment: "login.microsoftonline.com",
            tenantId: TEST_CONFIG.TENANT,
            username: "John Doe",
            loginHint: "testLoginHint",
        };
        const bearerSilentFlowRequest: CommonSilentFlowRequest = {
            scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
            account: mockedAccountInfo,
            authority: TEST_CONFIG.validAuthority,
            correlationId: TEST_CONFIG.CORRELATION_ID,
            forceRefresh: false,
            authenticationScheme: AuthenticationScheme.BEARER,
            sshKid: TEST_DPOP_VALUES.ACCESS_TOKEN_JKT,
        };
        const popSilentFlowRequest: CommonSilentFlowRequest = {
            scopes: ["user.read"],
            account: mockedAccountInfo,
            authority: TEST_CONFIG.validAuthority,
            correlationId: TEST_CONFIG.CORRELATION_ID,
            forceRefresh: false,
            authenticationScheme: AuthenticationScheme.POP,
            sshKid: TEST_DPOP_VALUES.ACCESS_TOKEN_JKT,
        };
        const dpopSilentFlowRequest: CommonSilentFlowRequest = {
            scopes: ["user.read"],
            account: mockedAccountInfo,
            authority: TEST_CONFIG.validAuthority,
            correlationId: TEST_CONFIG.CORRELATION_ID,
            forceRefresh: false,
            authenticationScheme: DPOP_AUTHENTICATION_SCHEME,
            sshKid: TEST_DPOP_VALUES.ACCESS_TOKEN_JKT,
        };

        expect(
            mockCache.cacheManager.getAccessToken(
                mockedAccountInfo,
                bearerSilentFlowRequest
            )
        ).toBe(mockedAtEntity);
        expect(
            mockCache.cacheManager.getAccessToken(
                mockedAccountInfo,
                popSilentFlowRequest
            )
        ).toBe(mockedPopAtEntity);
        expect(
            mockCache.cacheManager.getAccessToken(
                mockedAccountInfo,
                dpopSilentFlowRequest
            )
        ).toBe(mockedDpopAtEntity);
    });

    it("schema-compat upgrade: legacy and partitioned access tokens can coexist and resolve correctly", async () => {
        await mockCache.cacheManager.clear();

        const legacyAtEntity: AccessTokenEntity =
            CacheHelpers.createAccessTokenEntity(
                "uid.utid",
                "login.microsoftonline.com",
                "legacy_access_token",
                CACHE_MOCKS.MOCK_CLIENT_ID,
                TEST_CONFIG.TENANT,
                TEST_CONFIG.DEFAULT_GRAPH_SCOPE.toString(),
                4600,
                4600,
                mockCrypto.base64Decode,
                "",
                500,
                AuthenticationScheme.BEARER,
                TEST_TOKENS.ACCESS_TOKEN
            );

        const partitionedAtEntity: AccessTokenEntity =
            CacheHelpers.createAccessTokenEntity(
                "uid.utid",
                "login.microsoftonline.com",
                "partitioned_access_token",
                CACHE_MOCKS.MOCK_CLIENT_ID,
                TEST_CONFIG.TENANT,
                TEST_CONFIG.DEFAULT_GRAPH_SCOPE.toString(),
                4600,
                4600,
                mockCrypto.base64Decode,
                "",
                500,
                AuthenticationScheme.BEARER,
                TEST_TOKENS.ACCESS_TOKEN
            );
        partitionedAtEntity.additionalCacheKeyComponents = {
            attribute_tokens: "alpha zeta",
        };

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
            {} as AccountEntity,
            accountData
        );

        await mockCache.cacheManager.setAccessTokenCredential(
            legacyAtEntity,
            "",
            false
        );
        await mockCache.cacheManager.setAccessTokenCredential(
            partitionedAtEntity,
            "",
            false
        );
        await mockCache.cacheManager.setAccount(mockedAccount);

        const mockedAccountInfo: AccountInfo = {
            homeAccountId: "uid.utid",
            localAccountId: "uid",
            environment: "login.microsoftonline.com",
            tenantId: TEST_CONFIG.TENANT,
            username: "John Doe",
            loginHint: "testLoginHint",
        };

        const legacyRequest: CommonSilentFlowRequest = {
            scopes: ["user.read"],
            account: mockedAccountInfo,
            authority: TEST_CONFIG.validAuthority,
            correlationId: TEST_CONFIG.CORRELATION_ID,
            forceRefresh: false,
        };

        const partitionedRequest: CommonSilentFlowRequest = {
            ...legacyRequest,
            attributeTokens: ["zeta", "alpha"],
        };

        expect(
            mockCache.cacheManager.getAccessToken(
                mockedAccountInfo,
                legacyRequest
            )
        ).toEqual(legacyAtEntity);

        expect(
            mockCache.cacheManager.getAccessToken(
                mockedAccountInfo,
                partitionedRequest
            )
        ).toEqual(partitionedAtEntity);
    });

    it("schema-compat downgrade: legacy requests do not resolve partitioned-only access tokens", async () => {
        await mockCache.cacheManager.clear();

        const partitionedAtEntity: AccessTokenEntity =
            CacheHelpers.createAccessTokenEntity(
                "uid.utid",
                "login.microsoftonline.com",
                "partitioned_access_token",
                CACHE_MOCKS.MOCK_CLIENT_ID,
                TEST_CONFIG.TENANT,
                TEST_CONFIG.DEFAULT_GRAPH_SCOPE.toString(),
                4600,
                4600,
                mockCrypto.base64Decode,
                "",
                500,
                AuthenticationScheme.BEARER,
                TEST_TOKENS.ACCESS_TOKEN
            );
        partitionedAtEntity.additionalCacheKeyComponents = {
            attribute_tokens: "alpha zeta",
        };

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
            {} as AccountEntity,
            accountData
        );

        await mockCache.cacheManager.setAccessTokenCredential(
            partitionedAtEntity,
            "",
            false
        );
        await mockCache.cacheManager.setAccount(mockedAccount);

        const mockedAccountInfo: AccountInfo = {
            homeAccountId: "uid.utid",
            localAccountId: "uid",
            environment: "login.microsoftonline.com",
            tenantId: TEST_CONFIG.TENANT,
            username: "John Doe",
            loginHint: "testLoginHint",
        };

        const legacyRequest: CommonSilentFlowRequest = {
            scopes: ["user.read"],
            account: mockedAccountInfo,
            authority: TEST_CONFIG.validAuthority,
            correlationId: TEST_CONFIG.CORRELATION_ID,
            forceRefresh: false,
        };

        expect(
            mockCache.cacheManager.getAccessToken(
                mockedAccountInfo,
                legacyRequest
            )
        ).toBeNull();
    });

    it("getAccessToken uses the cached access token key id for DPoP", async () => {
        const dpopAtEntity = CacheHelpers.createAccessTokenEntity(
            "uid.utid",
            "login.microsoftonline.com",
            TEST_DPOP_VALUES.ACCESS_TOKEN,
            CACHE_MOCKS.MOCK_CLIENT_ID,
            TEST_CONFIG.TENANT,
            "user.read",
            4600,
            4600,
            mockCrypto.base64Decode,
            TEST_CONFIG.CORRELATION_ID,
            500,
            DPOP_AUTHENTICATION_SCHEME,
            undefined,
            TEST_DPOP_VALUES.ACCESS_TOKEN_JKT
        );
        const mockedAccount: AccountEntity = CacheManager.toObject(
            {} as AccountEntity,
            {
                username: "John Doe",
                localAccountId: "uid",
                realm: "common",
                environment: "login.microsoftonline.com",
                homeAccountId: "uid.utid",
                authorityType: "MSSTS",
                clientInfo: "eyJ1aWQiOiJ1aWQiLCAidXRpZCI6InV0aWQifQ==",
            }
        );
        const mockedAccountInfo: AccountInfo = {
            homeAccountId: "uid.utid",
            localAccountId: "uid",
            environment: "login.microsoftonline.com",
            tenantId: TEST_CONFIG.TENANT,
            username: "John Doe",
            loginHint: "testLoginHint",
        };
        const dpopRequest: CommonSilentFlowRequest = {
            scopes: ["user.read"],
            account: mockedAccountInfo,
            authority: TEST_CONFIG.validAuthority,
            correlationId: TEST_CONFIG.CORRELATION_ID,
            forceRefresh: false,
            authenticationScheme: DPOP_AUTHENTICATION_SCHEME,
            resourceRequestMethod: "GET",
            resourceRequestUri: "https://graph.microsoft.com/v1.0/me",
        };

        await mockCache.cacheManager.setAccessTokenCredential(
            dpopAtEntity,
            "",
            false
        );
        await mockCache.cacheManager.setAccount(mockedAccount);

        expect(
            mockCache.cacheManager.getAccessToken(mockedAccountInfo, {
                ...dpopRequest,
                dpopJkt: TEST_DPOP_VALUES.ACCESS_TOKEN_JKT,
            })
        ).toEqual(dpopAtEntity);
        expect(
            mockCache.cacheManager.getAccessToken(mockedAccountInfo, {
                ...dpopRequest,
                dpopJkt: "different-jkt",
            })
        ).toEqual(dpopAtEntity);
        expect(
            mockCache.cacheManager.getAccessToken(
                mockedAccountInfo,
                dpopRequest
            )
        ).toEqual(dpopAtEntity);
    });

    it("getAccessTokensByFilter matches DPoP access tokens by tokenType and jkt", async () => {
        const SPEC_DPOP_AUTHENTICATION_SCHEME = "DPoP" as AuthenticationScheme;
        const mockedDpopAtEntity = CacheHelpers.createAccessTokenEntity(
            "uid.utid",
            "login.microsoftonline.com",
            TEST_DPOP_VALUES.ACCESS_TOKEN,
            CACHE_MOCKS.MOCK_CLIENT_ID,
            TEST_CONFIG.TENANT,
            "User.Read test_scope",
            4600,
            4600,
            mockCrypto.base64Decode,
            TEST_CONFIG.CORRELATION_ID,
            500,
            DPOP_AUTHENTICATION_SCHEME,
            undefined,
            TEST_DPOP_VALUES.ACCESS_TOKEN_JKT
        );
        const specCasedDpopAtEntity = CacheHelpers.createAccessTokenEntity(
            "uid.utid",
            "login.microsoftonline.com",
            TEST_DPOP_VALUES.ACCESS_TOKEN,
            CACHE_MOCKS.MOCK_CLIENT_ID,
            TEST_CONFIG.TENANT,
            "User.Read test_scope_2",
            4600,
            4600,
            mockCrypto.base64Decode,
            TEST_CONFIG.CORRELATION_ID,
            500,
            SPEC_DPOP_AUTHENTICATION_SCHEME,
            undefined,
            TEST_DPOP_VALUES.ACCESS_TOKEN_JKT
        );

        await mockCache.cacheManager.setAccessTokenCredential(
            mockedDpopAtEntity,
            "",
            false
        );
        await mockCache.cacheManager.setAccessTokenCredential(
            specCasedDpopAtEntity,
            "",
            false
        );

        expect(
            mockCache.cacheManager.getAccessTokensByFilter(
                {
                    credentialType:
                        CredentialType.ACCESS_TOKEN_WITH_AUTH_SCHEME,
                    tokenType: DPOP_AUTHENTICATION_SCHEME,
                    keyId: TEST_DPOP_VALUES.ACCESS_TOKEN_JKT,
                },
                TEST_CONFIG.CORRELATION_ID
            )
        ).toEqual([mockedDpopAtEntity, specCasedDpopAtEntity]);
        expect(
            mockCache.cacheManager.getAccessTokensByFilter(
                {
                    credentialType:
                        CredentialType.ACCESS_TOKEN_WITH_AUTH_SCHEME,
                    tokenType: SPEC_DPOP_AUTHENTICATION_SCHEME,
                    keyId: TEST_DPOP_VALUES.ACCESS_TOKEN_JKT,
                },
                TEST_CONFIG.CORRELATION_ID
            )
        ).toEqual([mockedDpopAtEntity, specCasedDpopAtEntity]);
        expect(
            mockCache.cacheManager.getAccessTokensByFilter(
                {
                    credentialType:
                        CredentialType.ACCESS_TOKEN_WITH_AUTH_SCHEME,
                    tokenType: DPOP_AUTHENTICATION_SCHEME,
                    keyId: "different-jkt",
                },
                TEST_CONFIG.CORRELATION_ID
            )
        ).toEqual([]);
        expect(
            mockCache.cacheManager.getAccessTokensByFilter(
                {
                    credentialType:
                        CredentialType.ACCESS_TOKEN_WITH_AUTH_SCHEME,
                    tokenType: DPOP_AUTHENTICATION_SCHEME,
                },
                TEST_CONFIG.CORRELATION_ID
            )
        ).toEqual([mockedDpopAtEntity, specCasedDpopAtEntity]);
        expect(
            mockCache.cacheManager.getAccessTokensByFilter(
                {
                    credentialType:
                        CredentialType.ACCESS_TOKEN_WITH_AUTH_SCHEME,
                    tokenType: SPEC_DPOP_AUTHENTICATION_SCHEME,
                },
                TEST_CONFIG.CORRELATION_ID
            )
        ).toEqual([mockedDpopAtEntity, specCasedDpopAtEntity]);
    });

    it("getAccountsFilteredBy nativeAccountId", () => {
        const account = mockCache.cacheManager.getAccountsFilteredBy(
            {
                nativeAccountId:
                    CACHE_MOCKS.MOCK_ACCOUNT_INFO_WITH_NATIVE_ACCOUNT_ID
                        .nativeAccountId,
            },
            RANDOM_TEST_GUID
        ) as AccountEntity[];
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
        const baseAccountInfo = AccountEntityUtils.getAccountInfo(
            buildAccountFromIdTokenClaims(ID_TOKEN_ALT_CLAIMS)
        );
        // Get home ID token by default
        const idToken = mockCache.cacheManager.getIdToken(
            baseAccountInfo,
            RANDOM_TEST_GUID
        ) as IdTokenEntity;
        if (!idToken) {
            throw TestError.createTestSetupError(
                "idToken does not have a value"
            );
        }
        expect(idToken.realm).toBe(baseAccountInfo.tenantId);
        const guestIdToken = mockCache.cacheManager.getIdToken(
            baseAccountInfo,
            RANDOM_TEST_GUID,
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
            false,
            RANDOM_TEST_GUID
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
            true,
            RANDOM_TEST_GUID
        );
        expect(refreshToken).toBe(null);
    });

    it("getRefreshToken with familyId", () => {
        const refreshToken = mockCache.cacheManager.getRefreshToken(
            CACHE_MOCKS.MOCK_ACCOUNT_INFO,
            true,
            RANDOM_TEST_GUID
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
            loginHint: "mocked_login_hint",
        };

        const cachedToken = mockCache.cacheManager.getRefreshToken(
            mockedAccountInfo,
            false,
            RANDOM_TEST_GUID
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
