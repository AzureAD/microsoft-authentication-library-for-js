/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    AUTHENTICATION_RESULT,
    DEFAULT_OPENID_CONFIG_RESPONSE,
    TEST_CONFIG,
    TEST_DATA_CLIENT_INFO,
    ID_TOKEN_CLAIMS,
    TEST_URIS,
    TEST_TOKENS,
} from "../test_kit/StringConstants";
import { BaseClient } from "../../src/client/BaseClient";
import {
    AuthenticationScheme,
    Constants,
    CredentialType,
    ONE_DAY_IN_MS,
} from "../../src/utils/Constants";
import {
    ClientTestUtils,
    MockStorageClass,
    mockCrypto,
} from "./ClientTestUtils";
import { Authority } from "../../src/authority/Authority";
import { SilentFlowClient } from "../../src/client/SilentFlowClient";
import { RefreshTokenClient } from "../../src/client/RefreshTokenClient";
import { AuthenticationResult } from "../../src/response/AuthenticationResult";
import { AccountInfo } from "../../src/account/AccountInfo";
import * as AuthToken from "../../src/account/AuthToken";
import { AccountEntity } from "../../src/cache/entities/AccountEntity";
import { IdTokenEntity } from "../../src/cache/entities/IdTokenEntity";
import { AccessTokenEntity } from "../../src/cache/entities/AccessTokenEntity";
import * as TimeUtils from "../../src/utils/TimeUtils";
import { RefreshTokenEntity } from "../../src/cache/entities/RefreshTokenEntity";
import { CommonSilentFlowRequest } from "../../src/request/CommonSilentFlowRequest";
import { CacheManager } from "../../src/cache/CacheManager";
import {
    ClientAuthErrorCodes,
    createClientAuthError,
} from "../../src/error/ClientAuthError";
import { ClientConfiguration } from "../../src/config/ClientConfiguration";
import { CommonRefreshTokenRequest } from "../../src/request/CommonRefreshTokenRequest";
import { CcsCredentialType } from "../../src/account/CcsCredential";
import { ServerTelemetryManager } from "../../src/telemetry/server/ServerTelemetryManager";
import {
    InteractionRequiredAuthErrorCodes,
    createInteractionRequiredAuthError,
} from "../../src/error/InteractionRequiredAuthError";
import { StubPerformanceClient } from "../../src/telemetry/performance/StubPerformanceClient";
import { Logger } from "../../src/logger/Logger";
import { buildAccountFromIdTokenClaims } from "msal-test-utils";

const testAccountEntity: AccountEntity =
    buildAccountFromIdTokenClaims(ID_TOKEN_CLAIMS);

const testAccount: AccountInfo = {
    ...testAccountEntity.getAccountInfo(),
    idTokenClaims: ID_TOKEN_CLAIMS,
    idToken: TEST_TOKENS.IDTOKEN_V2,
};

const testIdToken: IdTokenEntity = {
    homeAccountId: `${TEST_DATA_CLIENT_INFO.TEST_UID}.${TEST_DATA_CLIENT_INFO.TEST_UTID}`,
    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
    environment: testAccountEntity.environment,
    realm: ID_TOKEN_CLAIMS.tid,
    secret: AUTHENTICATION_RESULT.body.id_token,
    credentialType: CredentialType.ID_TOKEN,
};

const testAccessTokenEntity: AccessTokenEntity = {
    homeAccountId: `${TEST_DATA_CLIENT_INFO.TEST_UID}.${TEST_DATA_CLIENT_INFO.TEST_UTID}`,
    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
    environment: testAccountEntity.environment,
    realm: ID_TOKEN_CLAIMS.tid,
    secret: AUTHENTICATION_RESULT.body.access_token,
    target:
        TEST_CONFIG.DEFAULT_SCOPES.join(" ") +
        " " +
        TEST_CONFIG.DEFAULT_GRAPH_SCOPE.join(" "),
    credentialType: CredentialType.ACCESS_TOKEN,
    cachedAt: `${TimeUtils.nowSeconds()}`,
    expiresOn: (
        TimeUtils.nowSeconds() + AUTHENTICATION_RESULT.body.expires_in
    ).toString(),
    tokenType: AuthenticationScheme.BEARER,
};

const testScopes = [
    Constants.OPENID_SCOPE,
    Constants.PROFILE_SCOPE,
    ...TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
];
const testAccessTokenEntity2: AccessTokenEntity = {
    ...testAccessTokenEntity,
    target: testScopes.join(" "),
};

const testRefreshTokenEntity: RefreshTokenEntity = {
    homeAccountId: `${TEST_DATA_CLIENT_INFO.TEST_UID}.${TEST_DATA_CLIENT_INFO.TEST_UTID}`,
    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
    environment: testAccountEntity.environment,
    realm: ID_TOKEN_CLAIMS.tid,
    secret: AUTHENTICATION_RESULT.body.refresh_token,
    credentialType: CredentialType.REFRESH_TOKEN,
};

const idTokenClaimsWithAuthTime = {
    ...ID_TOKEN_CLAIMS,
    auth_time: Date.now() - ONE_DAY_IN_MS * 2,
};

const logger = new Logger({});

describe("SilentFlowClient unit tests", () => {
    let stubPerformanceClient: StubPerformanceClient;
    let config: ClientConfiguration;
    let client: SilentFlowClient;
    let readAccountFromCacheSpy: jest.SpyInstance;
    let getIdTokenSpy: jest.SpyInstance;
    let getRefreshTokenSpy: jest.SpyInstance;
    let isTokenExpiredSpy: jest.SpyInstance;
    beforeEach(async () => {
        stubPerformanceClient = new StubPerformanceClient();
        config = await ClientTestUtils.createTestClientConfiguration();
        client = new SilentFlowClient(config, stubPerformanceClient);

        jest.spyOn(
            Authority.prototype,
            <any>"getEndpointMetadataFromNetwork"
        ).mockResolvedValue(DEFAULT_OPENID_CONFIG_RESPONSE.body);
        readAccountFromCacheSpy = jest
            .spyOn(CacheManager.prototype, "readAccountFromCache")
            .mockReturnValue(testAccountEntity);
        getIdTokenSpy = jest
            .spyOn(CacheManager.prototype, "getIdToken")
            .mockReturnValue(testIdToken);
        getRefreshTokenSpy = jest
            .spyOn(CacheManager.prototype, "getRefreshToken")
            .mockReturnValue(testRefreshTokenEntity);
        isTokenExpiredSpy = jest
            .spyOn(TimeUtils, "isTokenExpired")
            .mockReturnValue(false);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("Constructor", () => {
        it("creates a SilentFlowClient", async () => {
            expect(client).not.toBeNull();
            expect(client instanceof SilentFlowClient).toBe(true);
            expect(client instanceof BaseClient).toBe(true);
        });
    });

    describe("Success cases", () => {
        beforeEach(() => {
            jest.spyOn(
                CacheManager.prototype,
                "getAccessToken"
            ).mockReturnValue(testAccessTokenEntity2);
        });
        it("acquireCachedToken returns correct token even if offline_access is not present in access token entity", async () => {
            const silentFlowRequest: CommonSilentFlowRequest = {
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                account: testAccount,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                forceRefresh: false,
            };

            const response = await client.acquireCachedToken(silentFlowRequest);
            const authResult: AuthenticationResult = response[0];
            expect(authResult.authority).toBe(
                `${TEST_URIS.DEFAULT_INSTANCE}${TEST_CONFIG.TENANT}/`
            );
            expect(authResult.uniqueId).toEqual(ID_TOKEN_CLAIMS.oid);
            expect(authResult.tenantId).toEqual(ID_TOKEN_CLAIMS.tid);
            expect(authResult.scopes).toEqual(testScopes);
            expect(authResult.account).toEqual(testAccount);
            expect(authResult.idToken).toEqual(testIdToken.secret);
            expect(authResult.idTokenClaims).toEqual(ID_TOKEN_CLAIMS);
            expect(authResult.accessToken).toEqual(
                testAccessTokenEntity.secret
            );
            expect(authResult.state).toHaveLength(0);
        });

        it("acquireCachedToken does not throw when given empty object string for claims", async () => {
            const silentFlowRequest: CommonSilentFlowRequest = {
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                account: testAccount,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                forceRefresh: false,
                claims: "{}",
            };

            const response = await client.acquireCachedToken(silentFlowRequest);
            const authResult: AuthenticationResult = response[0];
            expect(authResult.authority).toEqual(
                `${TEST_URIS.DEFAULT_INSTANCE}${TEST_CONFIG.TENANT}/`
            );
            expect(authResult.uniqueId).toEqual(ID_TOKEN_CLAIMS.oid);
            expect(authResult.tenantId).toEqual(ID_TOKEN_CLAIMS.tid);
            expect(authResult.scopes).toEqual(testScopes);
            expect(authResult.account).toEqual(testAccount);
            expect(authResult.idToken).toEqual(testIdToken.secret);
            expect(authResult.idTokenClaims).toEqual(ID_TOKEN_CLAIMS);
            expect(authResult.accessToken).toEqual(
                testAccessTokenEntity.secret
            );
            expect(authResult.state).toBe("");
        });

        it("acquireToken returns token from cache if scopes are undefined in request object", async () => {
            const authResult = await client.acquireToken({
                //@ts-ignore
                scopes: undefined,
                account: testAccount,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                forceRefresh: false,
            });

            expect(authResult.account).toEqual(testAccount);
            expect(authResult.idToken).toEqual(testIdToken.secret);
            expect(authResult.accessToken).toEqual(
                testAccessTokenEntity.secret
            );
        });

        it("acquireToken returns token from cache if scopes are empty in request object", async () => {
            const authResult = await client.acquireToken({
                scopes: [],
                account: testAccount,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                forceRefresh: false,
            });

            expect(authResult.account).toEqual(testAccount);
            expect(authResult.idToken).toEqual(testIdToken.secret);
            expect(authResult.accessToken).toEqual(
                testAccessTokenEntity.secret
            );
        });

        it("acquireCachedToken throws when given valid claims with default configuration", async () => {
            const silentFlowRequest: CommonSilentFlowRequest = {
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                account: testAccount,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                forceRefresh: false,
                claims: `{ "access_token": { "xms_cc":{"values":["cp1"] } }}`,
            };

            await expect(
                client.acquireCachedToken(silentFlowRequest)
            ).rejects.toMatchObject(
                createClientAuthError(ClientAuthErrorCodes.tokenRefreshRequired)
            );
        });

        it("acquireCachedToken does not throw when given valid claims with claimsBasedCachingEnabled", async () => {
            const clientWithClaimsBasedCachingEnabled = new SilentFlowClient(
                {
                    ...config,
                    cacheOptions: {
                        ...config.cacheOptions,
                        claimsBasedCachingEnabled: true,
                    },
                },
                stubPerformanceClient
            );

            const silentFlowRequest: CommonSilentFlowRequest = {
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                account: testAccount,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                forceRefresh: false,
                claims: `{ "access_token": { "xms_cc":{"values":["cp1"] } }}`,
            };

            const response =
                await clientWithClaimsBasedCachingEnabled.acquireCachedToken(
                    silentFlowRequest
                );
            const authResult: AuthenticationResult = response[0];
            expect(authResult.authority).toEqual(
                `${TEST_URIS.DEFAULT_INSTANCE}${TEST_CONFIG.TENANT}/`
            );
            expect(authResult.uniqueId).toEqual(ID_TOKEN_CLAIMS.oid);
            expect(authResult.tenantId).toEqual(ID_TOKEN_CLAIMS.tid);
            expect(authResult.scopes).toEqual(testScopes);
            expect(authResult.account).toEqual(testAccount);
            expect(authResult.idToken).toEqual(testIdToken.secret);
            expect(authResult.idTokenClaims).toEqual(ID_TOKEN_CLAIMS);
            expect(authResult.accessToken).toEqual(
                testAccessTokenEntity.secret
            );
            expect(authResult.state).toBe("");
        });

        it("acquireCachedToken returns correct token when max age is provided and has not transpired yet", async () => {
            jest.spyOn(AuthToken, "extractTokenClaims").mockReturnValueOnce(
                idTokenClaimsWithAuthTime
            );

            const silentFlowRequest: CommonSilentFlowRequest = {
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                account: testAccount,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                forceRefresh: false,
                maxAge: ONE_DAY_IN_MS * 3,
            };

            const response = await client.acquireCachedToken(silentFlowRequest);
            const authResult: AuthenticationResult = response[0];
            expect(authResult.authority).toBe(
                `${TEST_URIS.DEFAULT_INSTANCE}${TEST_CONFIG.TENANT}/`
            );
            expect(authResult.uniqueId).toEqual(ID_TOKEN_CLAIMS.oid);
            expect(authResult.tenantId).toEqual(ID_TOKEN_CLAIMS.tid);
            expect(authResult.scopes).toEqual(testScopes);
            expect(authResult.account).toEqual({
                ...testAccount,
                idTokenClaims: idTokenClaimsWithAuthTime,
            });
            expect(authResult.idToken).toEqual(testIdToken.secret);
            expect(authResult.idTokenClaims).toEqual(idTokenClaimsWithAuthTime);
            expect(authResult.accessToken).toEqual(
                testAccessTokenEntity.secret
            );
            expect(authResult.state).toHaveLength(0);
        });
    });

    describe("Error cases", () => {
        let getAccessTokenSpy: jest.SpyInstance;
        beforeEach(() => {
            getAccessTokenSpy = jest
                .spyOn(CacheManager.prototype, "getAccessToken")
                .mockReturnValue(testAccessTokenEntity);
        });

        it("Throws error if account is not included in request object", async () => {
            readAccountFromCacheSpy.mockRestore();
            getIdTokenSpy.mockRestore();
            getAccessTokenSpy.mockRestore();
            getRefreshTokenSpy.mockRestore();
            isTokenExpiredSpy.mockRestore();

            await expect(
                client.acquireToken({
                    scopes: TEST_CONFIG.DEFAULT_SCOPES,
                    // @ts-ignore
                    account: null,
                    authority: TEST_CONFIG.validAuthority,
                    correlationId: TEST_CONFIG.CORRELATION_ID,
                    forceRefresh: false,
                })
            ).rejects.toMatchObject(
                createClientAuthError(
                    ClientAuthErrorCodes.noAccountInSilentRequest
                )
            );

            await expect(
                client.acquireCachedToken({
                    scopes: TEST_CONFIG.DEFAULT_SCOPES,
                    // @ts-ignore
                    account: null,
                    authority: TEST_CONFIG.validAuthority,
                    correlationId: TEST_CONFIG.CORRELATION_ID,
                    forceRefresh: false,
                })
            ).rejects.toMatchObject(
                createClientAuthError(
                    ClientAuthErrorCodes.noAccountInSilentRequest
                )
            );
        });

        it("Throws error if it does not find token in cache", async () => {
            readAccountFromCacheSpy.mockRestore();
            getIdTokenSpy.mockRestore();
            getAccessTokenSpy.mockRestore();
            getRefreshTokenSpy.mockRestore();
            isTokenExpiredSpy.mockRestore();

            const testAccountEntity2: AccountEntity = new AccountEntity();
            testAccountEntity2.homeAccountId =
                TEST_DATA_CLIENT_INFO.TEST_ENCODED_HOME_ACCOUNT_ID;
            testAccountEntity2.localAccountId = "testId";
            testAccountEntity2.environment = "login.windows.net";
            testAccountEntity2.realm = "testTenantId";
            testAccountEntity2.username = "username@contoso.com";
            testAccountEntity2.authorityType = "MSSTS";
            jest.spyOn(
                MockStorageClass.prototype,
                "getAccount"
            ).mockReturnValueOnce(testAccountEntity2);

            const testScope2 = "scope2";
            const tokenRequest: CommonSilentFlowRequest = {
                scopes: [testScope2],
                account: testAccount,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                forceRefresh: false,
            };

            await expect(
                client.acquireToken(tokenRequest)
            ).rejects.toMatchObject(
                createInteractionRequiredAuthError(
                    InteractionRequiredAuthErrorCodes.noTokensFound
                )
            );
        });

        it("acquireCachedToken throws refresh requiredError if forceRefresh set to true", async () => {
            isTokenExpiredSpy.mockRestore();

            const silentFlowRequest: CommonSilentFlowRequest = {
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                account: testAccount,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                forceRefresh: true,
            };

            await expect(
                client.acquireCachedToken(silentFlowRequest)
            ).rejects.toMatchObject(
                createClientAuthError(ClientAuthErrorCodes.tokenRefreshRequired)
            );
        });

        it("acquireCachedToken throws refresh requiredError if access token is expired", async () => {
            jest.spyOn(TimeUtils, "isTokenExpired").mockReturnValueOnce(true);

            const silentFlowRequest: CommonSilentFlowRequest = {
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                account: testAccount,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                forceRefresh: false,
            };

            await expect(
                client.acquireCachedToken(silentFlowRequest)
            ).rejects.toMatchObject(
                createClientAuthError(ClientAuthErrorCodes.tokenRefreshRequired)
            );
        });

        it("acquireCachedToken throws refresh requiredError if access token was cached after the current time", async () => {
            isTokenExpiredSpy.mockRestore();

            jest.spyOn(TimeUtils, "wasClockTurnedBack").mockReturnValueOnce(
                true
            );

            const silentFlowRequest: CommonSilentFlowRequest = {
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                account: testAccount,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                forceRefresh: false,
            };

            await expect(
                client.acquireCachedToken(silentFlowRequest)
            ).rejects.toMatchObject(
                createClientAuthError(ClientAuthErrorCodes.tokenRefreshRequired)
            );
        });

        it("acquireCachedToken throws refresh requiredError if no access token is cached", async () => {
            jest.spyOn(
                CacheManager.prototype,
                "getAccessToken"
            ).mockReturnValueOnce(null);

            const silentFlowRequest: CommonSilentFlowRequest = {
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                account: testAccount,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                forceRefresh: false,
            };

            await expect(
                client.acquireCachedToken(silentFlowRequest)
            ).rejects.toMatchObject(
                createClientAuthError(ClientAuthErrorCodes.tokenRefreshRequired)
            );
        });
    });

    describe("acquireToken tests", () => {
        let executePostToTokenEndpointSpy: jest.SpyInstance;
        let acquireTokenSpy: jest.SpyInstance;
        beforeEach(async () => {
            AUTHENTICATION_RESULT.body.client_info =
                TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO;
            executePostToTokenEndpointSpy = jest
                .spyOn(
                    RefreshTokenClient.prototype,
                    <any>"executePostToTokenEndpoint"
                )
                .mockResolvedValue(AUTHENTICATION_RESULT);

            jest.spyOn(
                CacheManager.prototype,
                "getAccessToken"
            ).mockReturnValue(testAccessTokenEntity);

            jest.spyOn(
                MockStorageClass.prototype,
                "getAccount"
            ).mockReturnValue(testAccountEntity);

            acquireTokenSpy = jest.spyOn(
                RefreshTokenClient.prototype,
                "acquireToken"
            );
        });

        it("acquireToken returns token from cache", async () => {
            const silentFlowRequest: CommonSilentFlowRequest = {
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                account: testAccount,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                forceRefresh: false,
            };

            const authResult = await client.acquireToken(silentFlowRequest);
            expect(acquireTokenSpy.mock.calls.length === 0);
            const expectedScopes = testAccessTokenEntity.target.split(" ");
            expect(authResult.uniqueId).toEqual(ID_TOKEN_CLAIMS.oid);
            expect(authResult.tenantId).toEqual(ID_TOKEN_CLAIMS.tid);
            expect(authResult.scopes).toEqual(expectedScopes);
            expect(authResult.account).toEqual(testAccount);
            expect(authResult.idToken).toEqual(testIdToken.secret);
            expect(authResult.idTokenClaims).toEqual(ID_TOKEN_CLAIMS);
            expect(authResult.accessToken).toEqual(
                testAccessTokenEntity.secret
            );
            expect(authResult.state).toHaveLength(0);
        });

        it("acquireToken calls refreshToken if refresh is required", async () => {
            jest.spyOn(TimeUtils, "isTokenExpired").mockReturnValueOnce(true);

            const silentFlowRequest: CommonSilentFlowRequest = {
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                account: testAccount,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                forceRefresh: false,
            };

            const expectedRefreshRequest: CommonRefreshTokenRequest = {
                ...silentFlowRequest,
                refreshToken: testRefreshTokenEntity.secret,
                authenticationScheme:
                    TEST_CONFIG.TOKEN_TYPE_BEARER as AuthenticationScheme,
                ccsCredential: {
                    credential: testAccount.homeAccountId,
                    type: CcsCredentialType.HOME_ACCOUNT_ID,
                },
            };

            await client.acquireToken(silentFlowRequest);
            expect(acquireTokenSpy.mock.calls.length === 1);
            expect(acquireTokenSpy.mock.lastCall[0]).toEqual(
                expectedRefreshRequest
            );
        });

        it("acquireCachedToken returns cached token", async () => {
            const incrementCacheHitsSpy: jest.SpyInstance = jest
                .spyOn(ServerTelemetryManager.prototype, "incrementCacheHits")
                .mockReturnValueOnce(1);

            const configWithServerTelemetryManager = {
                ...config,
                serverTelemetryManager: new ServerTelemetryManager(
                    {
                        clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                        apiId: 862,
                        correlationId: "test-correlation-id",
                    },
                    new MockStorageClass(
                        TEST_CONFIG.MSAL_CLIENT_ID,
                        mockCrypto,
                        logger
                    )
                ),
            };
            const clientWithServerTelemetryManagerInConfig =
                new SilentFlowClient(
                    configWithServerTelemetryManager,
                    stubPerformanceClient
                );

            const silentFlowRequest: CommonSilentFlowRequest = {
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                account: testAccount,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                forceRefresh: false,
            };

            const response =
                await clientWithServerTelemetryManagerInConfig.acquireCachedToken(
                    silentFlowRequest
                );
            const authResult: AuthenticationResult = response[0];
            const expectedScopes = testAccessTokenEntity.target.split(" ");
            expect(incrementCacheHitsSpy.mock.calls.length === 1);
            expect(authResult.uniqueId).toEqual(ID_TOKEN_CLAIMS.oid);
            expect(authResult.tenantId).toEqual(ID_TOKEN_CLAIMS.tid);
            expect(authResult.scopes).toEqual(expectedScopes);
            expect(authResult.account).toEqual(testAccount);
            expect(authResult.idToken).toEqual(testIdToken.secret);
            expect(authResult.idTokenClaims).toEqual(ID_TOKEN_CLAIMS);
            expect(authResult.accessToken).toEqual(
                testAccessTokenEntity.secret
            );
            expect(authResult.state).toHaveLength(0);
        });

        it("Throws error if max age is equal to 0 or has transpired since the last end-user authentication", async () => {
            jest.spyOn(AuthToken, "extractTokenClaims").mockReturnValueOnce(
                idTokenClaimsWithAuthTime
            );

            const silentFlowRequest: CommonSilentFlowRequest = {
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                account: testAccount,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                forceRefresh: false,
                maxAge: 0, // 0 indicates an immediate refresh
            };

            await expect(
                client.acquireCachedToken(silentFlowRequest)
            ).rejects.toMatchObject(
                createClientAuthError(ClientAuthErrorCodes.maxAgeTranspired)
            );
        });

        it("Throws error if max age is requested and auth time is not included in the token claims", async () => {
            const silentFlowRequest: CommonSilentFlowRequest = {
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                account: testAccount,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                forceRefresh: false,
                maxAge: ONE_DAY_IN_MS * 3,
            };

            await expect(
                client.acquireCachedToken(silentFlowRequest)
            ).rejects.toMatchObject(
                createClientAuthError(ClientAuthErrorCodes.authTimeNotFound)
            );
        });

        it("acquireCachedToken throws refresh requiredError if access token is expired", async () => {
            jest.spyOn(TimeUtils, "isTokenExpired").mockReturnValueOnce(true);

            const silentFlowRequest: CommonSilentFlowRequest = {
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                account: testAccount,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                forceRefresh: false,
            };

            await expect(
                client.acquireCachedToken(silentFlowRequest)
            ).rejects.toMatchObject(
                createClientAuthError(ClientAuthErrorCodes.tokenRefreshRequired)
            );
        });

        it("refreshes token if refreshOn time has passed", async () => {
            if (!config.storageInterface) {
                fail("config.storageInterface is undefined");
            }

            isTokenExpiredSpy.mockRestore();

            const expectedAccessTokenEntity: AccessTokenEntity = {
                ...testAccessTokenEntity,
                refreshOn: `${Number(testAccessTokenEntity.cachedAt) - 1}`,
                expiresOn: `${
                    Number(testAccessTokenEntity.cachedAt) +
                    AUTHENTICATION_RESULT.body.expires_in
                }`,
            };
            jest.spyOn(
                CacheManager.prototype,
                "getAccessToken"
            ).mockReturnValueOnce(expectedAccessTokenEntity);

            const silentFlowRequest: CommonSilentFlowRequest = {
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                account: testAccount,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                forceRefresh: false,
            };

            // The cached token returned from acquireToken below is mocked, which means it won't exist in the cache at this point
            const accessTokenKey: string | undefined = config.storageInterface
                .getKeys()
                .find((value) => value.indexOf("accesstoken") >= 0);
            expect(accessTokenKey).toBeUndefined();

            // Acquire a token (from the cache). The refresh_in value is expired, so there will be an asynchronous network request
            // to refresh the token. That result will be stored in the cache.
            await client.acquireToken(silentFlowRequest);

            /**
             * Wait up to two seconds for acquireToken and its mocked network requests to complete and
             * populate the cache (in the background). Periodically check the cache to ensure the refreshed token
             * exists (the network request was successful).
             * @param cache config.storageInterface
             * @returns AccessTokenEntity - the access token in the cache
             */
            const waitUntilAccessTokenInCacheThenReturnIt = async (
                cache: CacheManager
            ): Promise<AccessTokenEntity | null> => {
                let counter: number = 0;
                return await new Promise((resolve) => {
                    // every one millisecond
                    const interval = setInterval(() => {
                        // look for the access token's key in the cache
                        const accessTokenKey = cache
                            .getKeys()
                            .find((value) => value.indexOf("accesstoken") >= 0);

                        // if the access token's key is in the cache
                        if (accessTokenKey) {
                            // use it to get the access token (from the cache)
                            const accessTokenFromCache: AccessTokenEntity | null =
                                cache.getAccessTokenCredential(accessTokenKey);
                            // return it and clear the interval
                            resolve(accessTokenFromCache);
                            clearInterval(interval);
                            // otherwise, if the access token's key is NOT in the cache (yet)
                        } else {
                            counter++;
                            // if 2 seconds have elapsed while waiting for the access token's key to be in the cache,
                            // exit the interval so that this test doesn't time out
                            if (counter === 2000) {
                                resolve(null);
                            }
                        }
                    }, 1); // 1 millisecond
                });
            };
            const accessTokenFromCache: AccessTokenEntity | null =
                await waitUntilAccessTokenInCacheThenReturnIt(
                    config.storageInterface
                );

            expect(accessTokenFromCache?.clientId).toEqual(
                expectedAccessTokenEntity.clientId
            );
        });

        it("Adds tokenQueryParameters to the /token request", async () => {
            jest.spyOn(TimeUtils, "isTokenExpired").mockReturnValueOnce(true);

            const silentFlowRequest: CommonSilentFlowRequest = {
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                account: testAccount,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                forceRefresh: false,
                tokenQueryParameters: {
                    testParam1: "testValue1",
                    testParam2: "",
                    testParam3: "testValue3",
                },
            };

            await client.acquireToken(silentFlowRequest);
            if (!executePostToTokenEndpointSpy.mock.lastCall) {
                fail("executePostToTokenEndpointMock was not called");
            }

            const url: string = executePostToTokenEndpointSpy.mock
                .lastCall[0] as string;
            expect(
                url.includes(
                    "/token?testParam1=testValue1&testParam3=testValue3"
                )
            ).toBeTruthy();
            expect(!url.includes("/token?testParam2=")).toBeTruthy();
        });
    });
});
