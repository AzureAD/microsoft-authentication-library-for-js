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
} from "../test_kit/StringConstants.js";
import { BaseClient } from "../../src/client/BaseClient.js";
import {
    AuthenticationScheme,
    Constants,
    CredentialType,
    ONE_DAY_IN_MS,
} from "../../src/utils/Constants.js";
import {
    ClientTestUtils,
    MockStorageClass,
    mockCrypto,
} from "./ClientTestUtils.js";
import { Authority } from "../../src/authority/Authority.js";
import { SilentFlowClient } from "../../src/client/SilentFlowClient.js";
import { RefreshTokenClient } from "../../src/client/RefreshTokenClient.js";
import { AuthenticationResult } from "../../src/response/AuthenticationResult.js";
import { AccountInfo } from "../../src/account/AccountInfo.js";
import * as AuthToken from "../../src/account/AuthToken.js";
import { AccountEntity } from "../../src/cache/entities/AccountEntity.js";
import { IdTokenEntity } from "../../src/cache/entities/IdTokenEntity.js";
import { AccessTokenEntity } from "../../src/cache/entities/AccessTokenEntity.js";
import * as TimeUtils from "../../src/utils/TimeUtils.js";
import { RefreshTokenEntity } from "../../src/cache/entities/RefreshTokenEntity.js";
import { CommonSilentFlowRequest } from "../../src/request/CommonSilentFlowRequest.js";
import { CacheManager } from "../../src/cache/CacheManager.js";
import {
    ClientAuthErrorCodes,
    createClientAuthError,
} from "../../src/error/ClientAuthError.js";
import { ClientConfiguration } from "../../src/config/ClientConfiguration.js";
import { ServerTelemetryManager } from "../../src/telemetry/server/ServerTelemetryManager.js";
import { StubPerformanceClient } from "../../src/telemetry/performance/StubPerformanceClient.js";
import { Logger } from "../../src/logger/Logger.js";
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

const testRefreshTokenEntity: RefreshTokenEntity = {
    homeAccountId: `${TEST_DATA_CLIENT_INFO.TEST_UID}.${TEST_DATA_CLIENT_INFO.TEST_UTID}`,
    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
    environment: testAccountEntity.environment,
    realm: ID_TOKEN_CLAIMS.tid,
    secret: AUTHENTICATION_RESULT.body.refresh_token,
    credentialType: CredentialType.REFRESH_TOKEN,
};

describe("SilentFlowClient unit tests", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    const logger = new Logger({});

    let stubPerformanceClient: StubPerformanceClient;
    beforeEach(async () => {
        stubPerformanceClient = new StubPerformanceClient();
    });

    describe("Constructor", () => {
        it("creates a SilentFlowClient", async () => {
            jest.spyOn(
                Authority.prototype,
                <any>"getEndpointMetadataFromNetwork"
            ).mockResolvedValue(DEFAULT_OPENID_CONFIG_RESPONSE.body);
            const config =
                await ClientTestUtils.createTestClientConfiguration();
            const client = new SilentFlowClient(config, stubPerformanceClient);
            expect(client).not.toBeNull();
            expect(client instanceof SilentFlowClient).toBe(true);
            expect(client instanceof BaseClient).toBe(true);
        });
    });

    describe("Success cases", () => {
        it("acquireCachedToken returns correct token even if offline_access is not present in access token entity", async () => {
            const testScopes = [
                Constants.OPENID_SCOPE,
                Constants.PROFILE_SCOPE,
                ...TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
            ];
            testAccessTokenEntity.target = testScopes.join(" ");
            jest.spyOn(
                Authority.prototype,
                <any>"getEndpointMetadataFromNetwork"
            ).mockResolvedValue(DEFAULT_OPENID_CONFIG_RESPONSE.body);
            jest.spyOn(
                CacheManager.prototype,
                "readAccountFromCache"
            ).mockReturnValue(testAccountEntity);
            jest.spyOn(CacheManager.prototype, "getIdToken").mockReturnValue(
                testIdToken
            );
            jest.spyOn(
                CacheManager.prototype,
                "getAccessToken"
            ).mockReturnValue(testAccessTokenEntity);
            jest.spyOn(
                CacheManager.prototype,
                "getRefreshToken"
            ).mockReturnValue(testRefreshTokenEntity);

            const config =
                await ClientTestUtils.createTestClientConfiguration();
            const client = new SilentFlowClient(config, stubPerformanceClient);
            jest.spyOn(TimeUtils, <any>"isTokenExpired").mockReturnValue(false);

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
            const testScopes = [
                Constants.OPENID_SCOPE,
                Constants.PROFILE_SCOPE,
                ...TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
            ];
            testAccessTokenEntity.target = testScopes.join(" ");
            jest.spyOn(
                Authority.prototype,
                <any>"getEndpointMetadataFromNetwork"
            ).mockResolvedValue(DEFAULT_OPENID_CONFIG_RESPONSE.body);
            jest.spyOn(
                CacheManager.prototype,
                "readAccountFromCache"
            ).mockReturnValue(testAccountEntity);
            jest.spyOn(CacheManager.prototype, "getIdToken").mockReturnValue(
                testIdToken
            );
            jest.spyOn(
                CacheManager.prototype,
                "getAccessToken"
            ).mockReturnValue(testAccessTokenEntity);
            jest.spyOn(
                CacheManager.prototype,
                "getRefreshToken"
            ).mockReturnValue(testRefreshTokenEntity);
            const config =
                await ClientTestUtils.createTestClientConfiguration();
            const client = new SilentFlowClient(config, stubPerformanceClient);
            jest.spyOn(TimeUtils, <any>"isTokenExpired").mockReturnValue(false);

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

        it("acquireCachedToken returns token from cache if scopes are undefined in request object", async () => {
            jest.spyOn(
                Authority.prototype,
                <any>"getEndpointMetadataFromNetwork"
            ).mockResolvedValue(DEFAULT_OPENID_CONFIG_RESPONSE.body);
            jest.spyOn(
                CacheManager.prototype,
                "readAccountFromCache"
            ).mockReturnValue(testAccountEntity);
            jest.spyOn(CacheManager.prototype, "getIdToken").mockReturnValue(
                testIdToken
            );
            jest.spyOn(
                CacheManager.prototype,
                "getAccessToken"
            ).mockReturnValue(testAccessTokenEntity);
            jest.spyOn(
                CacheManager.prototype,
                "getRefreshToken"
            ).mockReturnValue(testRefreshTokenEntity);
            jest.spyOn(TimeUtils, <any>"isTokenExpired").mockReturnValue(false);

            const config =
                await ClientTestUtils.createTestClientConfiguration();
            const client = new SilentFlowClient(config, stubPerformanceClient);
            const response = await client.acquireCachedToken({
                //@ts-ignore
                scopes: undefined,
                account: testAccount,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                forceRefresh: false,
            });
            const authResult: AuthenticationResult = response[0];

            expect(authResult.account).toEqual(testAccount);
            expect(authResult.idToken).toEqual(testIdToken.secret);
            expect(authResult.accessToken).toEqual(
                testAccessTokenEntity.secret
            );
        });

        it("acquireCachedToken returns token from cache if scopes are empty in request object", async () => {
            jest.spyOn(
                Authority.prototype,
                <any>"getEndpointMetadataFromNetwork"
            ).mockResolvedValue(DEFAULT_OPENID_CONFIG_RESPONSE.body);
            jest.spyOn(
                CacheManager.prototype,
                "readAccountFromCache"
            ).mockReturnValue(testAccountEntity);
            jest.spyOn(CacheManager.prototype, "getIdToken").mockReturnValue(
                testIdToken
            );
            jest.spyOn(
                CacheManager.prototype,
                "getAccessToken"
            ).mockReturnValue(testAccessTokenEntity);
            jest.spyOn(
                CacheManager.prototype,
                "getRefreshToken"
            ).mockReturnValue(testRefreshTokenEntity);
            jest.spyOn(TimeUtils, <any>"isTokenExpired").mockReturnValue(false);

            const config =
                await ClientTestUtils.createTestClientConfiguration();
            const client = new SilentFlowClient(config, stubPerformanceClient);
            const response = await client.acquireCachedToken({
                scopes: [],
                account: testAccount,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                forceRefresh: false,
            });
            const authResult: AuthenticationResult = response[0];

            expect(authResult.account).toEqual(testAccount);
            expect(authResult.idToken).toEqual(testIdToken.secret);
            expect(authResult.accessToken).toEqual(
                testAccessTokenEntity.secret
            );
        });

        it("acquireCachedToken throws when given valid claims with default configuration", async () => {
            const testScopes = [
                Constants.OPENID_SCOPE,
                Constants.PROFILE_SCOPE,
                ...TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
            ];
            testAccessTokenEntity.target = testScopes.join(" ");
            jest.spyOn(
                Authority.prototype,
                <any>"getEndpointMetadataFromNetwork"
            ).mockResolvedValue(DEFAULT_OPENID_CONFIG_RESPONSE.body);
            jest.spyOn(
                CacheManager.prototype,
                "readAccountFromCache"
            ).mockReturnValue(testAccountEntity);
            jest.spyOn(CacheManager.prototype, "getIdToken").mockReturnValue(
                testIdToken
            );
            jest.spyOn(
                CacheManager.prototype,
                "getAccessToken"
            ).mockReturnValue(testAccessTokenEntity);
            jest.spyOn(
                CacheManager.prototype,
                "getRefreshToken"
            ).mockReturnValue(testRefreshTokenEntity);
            const config =
                await ClientTestUtils.createTestClientConfiguration();
            const client = new SilentFlowClient(config, stubPerformanceClient);
            jest.spyOn(TimeUtils, <any>"isTokenExpired").mockReturnValue(false);

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
            const testScopes = [
                Constants.OPENID_SCOPE,
                Constants.PROFILE_SCOPE,
                ...TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
            ];
            testAccessTokenEntity.target = testScopes.join(" ");
            jest.spyOn(
                Authority.prototype,
                <any>"getEndpointMetadataFromNetwork"
            ).mockResolvedValue(DEFAULT_OPENID_CONFIG_RESPONSE.body);
            jest.spyOn(
                CacheManager.prototype,
                "readAccountFromCache"
            ).mockReturnValue(testAccountEntity);
            jest.spyOn(CacheManager.prototype, "getIdToken").mockReturnValue(
                testIdToken
            );
            jest.spyOn(
                CacheManager.prototype,
                "getAccessToken"
            ).mockReturnValue(testAccessTokenEntity);
            jest.spyOn(
                CacheManager.prototype,
                "getRefreshToken"
            ).mockReturnValue(testRefreshTokenEntity);
            const config =
                await ClientTestUtils.createTestClientConfiguration();
            const client = new SilentFlowClient(
                {
                    ...config,
                    cacheOptions: {
                        ...config.cacheOptions,
                        claimsBasedCachingEnabled: true,
                    },
                },
                stubPerformanceClient
            );
            jest.spyOn(TimeUtils, <any>"isTokenExpired").mockReturnValue(false);

            const silentFlowRequest: CommonSilentFlowRequest = {
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                account: testAccount,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                forceRefresh: false,
                claims: `{ "access_token": { "xms_cc":{"values":["cp1"] } }}`,
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

        it("acquireCachedToken returns correct token when max age is provided and has not transpired yet", async () => {
            const testScopes = [
                Constants.OPENID_SCOPE,
                Constants.PROFILE_SCOPE,
                ...TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
            ];
            testAccessTokenEntity.target = testScopes.join(" ");
            jest.spyOn(
                Authority.prototype,
                <any>"getEndpointMetadataFromNetwork"
            ).mockResolvedValue(DEFAULT_OPENID_CONFIG_RESPONSE.body);

            const idTokenClaimsWithAuthTime = {
                ...ID_TOKEN_CLAIMS,
                auth_time: Date.now() - ONE_DAY_IN_MS * 2,
            };
            jest.spyOn(AuthToken, "extractTokenClaims").mockReturnValue(
                idTokenClaimsWithAuthTime
            );
            jest.spyOn(
                CacheManager.prototype,
                "readAccountFromCache"
            ).mockReturnValue(testAccountEntity);
            jest.spyOn(CacheManager.prototype, "getIdToken").mockReturnValue(
                testIdToken
            );
            jest.spyOn(
                CacheManager.prototype,
                "getAccessToken"
            ).mockReturnValue(testAccessTokenEntity);
            jest.spyOn(
                CacheManager.prototype,
                "getRefreshToken"
            ).mockReturnValue(testRefreshTokenEntity);

            const config =
                await ClientTestUtils.createTestClientConfiguration();
            const client = new SilentFlowClient(config, stubPerformanceClient);
            jest.spyOn(TimeUtils, <any>"isTokenExpired").mockReturnValue(false);

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
        it("Throws error if account is not included in request object", async () => {
            jest.spyOn(
                Authority.prototype,
                <any>"getEndpointMetadataFromNetwork"
            ).mockResolvedValue(DEFAULT_OPENID_CONFIG_RESPONSE.body);
            const config =
                await ClientTestUtils.createTestClientConfiguration();
            const client = new SilentFlowClient(config, stubPerformanceClient);
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
            const testScope2 = "scope2";
            const testAccountEntity: AccountEntity = new AccountEntity();
            testAccountEntity.homeAccountId =
                TEST_DATA_CLIENT_INFO.TEST_ENCODED_HOME_ACCOUNT_ID;
            testAccountEntity.localAccountId = "testId";
            testAccountEntity.environment = "login.windows.net";
            testAccountEntity.realm = "testTenantId";
            testAccountEntity.username = "username@contoso.com";
            testAccountEntity.authorityType = "MSSTS";
            jest.spyOn(
                MockStorageClass.prototype,
                "getAccount"
            ).mockReturnValue(testAccountEntity);
            jest.spyOn(
                Authority.prototype,
                <any>"getEndpointMetadataFromNetwork"
            ).mockResolvedValue(DEFAULT_OPENID_CONFIG_RESPONSE.body);
            const tokenRequest: CommonSilentFlowRequest = {
                scopes: [testScope2],
                account: testAccount,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                forceRefresh: false,
            };
            const config =
                await ClientTestUtils.createTestClientConfiguration();
            const client = new SilentFlowClient(config, stubPerformanceClient);
            await expect(
                client.acquireCachedToken(tokenRequest)
            ).rejects.toMatchObject(
                createClientAuthError(ClientAuthErrorCodes.tokenRefreshRequired)
            );
        });

        it("acquireCachedToken throws refresh requiredError if forceRefresh set to true", async () => {
            jest.spyOn(
                Authority.prototype,
                <any>"getEndpointMetadataFromNetwork"
            ).mockResolvedValue(DEFAULT_OPENID_CONFIG_RESPONSE.body);
            jest.spyOn(
                CacheManager.prototype,
                "readAccountFromCache"
            ).mockReturnValue(testAccountEntity);
            jest.spyOn(CacheManager.prototype, "getIdToken").mockReturnValue(
                testIdToken
            );
            jest.spyOn(
                CacheManager.prototype,
                "getAccessToken"
            ).mockReturnValue(testAccessTokenEntity);
            jest.spyOn(
                CacheManager.prototype,
                "getRefreshToken"
            ).mockReturnValue(testRefreshTokenEntity);

            const config =
                await ClientTestUtils.createTestClientConfiguration();
            const client = new SilentFlowClient(config, stubPerformanceClient);
            jest.spyOn(TimeUtils, <any>"isTokenExpired").mockReturnValue(false);

            const silentFlowRequest: CommonSilentFlowRequest = {
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                account: testAccount,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                forceRefresh: true,
            };

            expect(
                client.acquireCachedToken(silentFlowRequest)
            ).rejects.toMatchObject(
                createClientAuthError(ClientAuthErrorCodes.tokenRefreshRequired)
            );
        });

        it("acquireCachedToken throws refresh requiredError if access token is expired", async () => {
            jest.spyOn(
                Authority.prototype,
                <any>"getEndpointMetadataFromNetwork"
            ).mockResolvedValue(DEFAULT_OPENID_CONFIG_RESPONSE.body);
            jest.spyOn(
                CacheManager.prototype,
                "readAccountFromCache"
            ).mockReturnValue(testAccountEntity);
            jest.spyOn(CacheManager.prototype, "getIdToken").mockReturnValue(
                testIdToken
            );
            jest.spyOn(
                CacheManager.prototype,
                "getAccessToken"
            ).mockReturnValue(testAccessTokenEntity);
            jest.spyOn(
                CacheManager.prototype,
                "getRefreshToken"
            ).mockReturnValue(testRefreshTokenEntity);
            const config =
                await ClientTestUtils.createTestClientConfiguration();
            const client = new SilentFlowClient(config, stubPerformanceClient);
            jest.spyOn(TimeUtils, <any>"isTokenExpired").mockReturnValue(true);

            const silentFlowRequest: CommonSilentFlowRequest = {
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                account: testAccount,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                forceRefresh: false,
            };

            expect(
                client.acquireCachedToken(silentFlowRequest)
            ).rejects.toMatchObject(
                createClientAuthError(ClientAuthErrorCodes.tokenRefreshRequired)
            );
        });

        it("acquireCachedToken throws refresh requiredError if access token was cached after the current time", async () => {
            jest.spyOn(
                Authority.prototype,
                <any>"getEndpointMetadataFromNetwork"
            ).mockResolvedValue(DEFAULT_OPENID_CONFIG_RESPONSE.body);
            jest.spyOn(
                CacheManager.prototype,
                "readAccountFromCache"
            ).mockReturnValue(testAccountEntity);
            jest.spyOn(CacheManager.prototype, "getIdToken").mockReturnValue(
                testIdToken
            );
            jest.spyOn(
                CacheManager.prototype,
                "getAccessToken"
            ).mockReturnValue(testAccessTokenEntity);
            jest.spyOn(
                CacheManager.prototype,
                "getRefreshToken"
            ).mockReturnValue(testRefreshTokenEntity);
            const config =
                await ClientTestUtils.createTestClientConfiguration();
            const client = new SilentFlowClient(config, stubPerformanceClient);
            jest.spyOn(TimeUtils, <any>"wasClockTurnedBack").mockReturnValue(
                true
            );

            const silentFlowRequest: CommonSilentFlowRequest = {
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                account: testAccount,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                forceRefresh: false,
            };

            expect(
                client.acquireCachedToken(silentFlowRequest)
            ).rejects.toMatchObject(
                createClientAuthError(ClientAuthErrorCodes.tokenRefreshRequired)
            );
        });

        it("acquireCachedToken throws refresh requiredError if no access token is cached", async () => {
            jest.spyOn(
                Authority.prototype,
                <any>"getEndpointMetadataFromNetwork"
            ).mockResolvedValue(DEFAULT_OPENID_CONFIG_RESPONSE.body);
            jest.spyOn(
                CacheManager.prototype,
                "readAccountFromCache"
            ).mockReturnValue(testAccountEntity);
            jest.spyOn(CacheManager.prototype, "getIdToken").mockReturnValue(
                testIdToken
            );
            jest.spyOn(
                CacheManager.prototype,
                "getAccessToken"
            ).mockReturnValue(null);
            jest.spyOn(
                CacheManager.prototype,
                "getRefreshToken"
            ).mockReturnValue(testRefreshTokenEntity);
            const config =
                await ClientTestUtils.createTestClientConfiguration();
            const client = new SilentFlowClient(config, stubPerformanceClient);
            jest.spyOn(TimeUtils, <any>"isTokenExpired").mockReturnValue(false);

            const silentFlowRequest: CommonSilentFlowRequest = {
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                account: testAccount,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                forceRefresh: false,
            };

            expect(
                client.acquireCachedToken(silentFlowRequest)
            ).rejects.toMatchObject(
                createClientAuthError(ClientAuthErrorCodes.tokenRefreshRequired)
            );
        });
    });

    describe("acquireCachedToken tests", () => {
        let config: ClientConfiguration;
        let client: SilentFlowClient;

        beforeEach(async () => {
            jest.spyOn(
                Authority.prototype,
                <any>"getEndpointMetadataFromNetwork"
            ).mockResolvedValue(DEFAULT_OPENID_CONFIG_RESPONSE.body);
            AUTHENTICATION_RESULT.body.client_info =
                TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO;
            jest.spyOn(
                RefreshTokenClient.prototype,
                <any>"executePostToTokenEndpoint"
            ).mockResolvedValue(AUTHENTICATION_RESULT);
            jest.spyOn(
                CacheManager.prototype,
                "readAccountFromCache"
            ).mockReturnValue(testAccountEntity);
            jest.spyOn(CacheManager.prototype, "getIdToken").mockReturnValue(
                testIdToken
            );
            jest.spyOn(
                CacheManager.prototype,
                "getAccessToken"
            ).mockReturnValue(testAccessTokenEntity);
            jest.spyOn(
                CacheManager.prototype,
                "getRefreshToken"
            ).mockReturnValue(testRefreshTokenEntity);

            config = await ClientTestUtils.createTestClientConfiguration();
            client = new SilentFlowClient(config, stubPerformanceClient);
        });

        it("acquireCachedToken returns token from cache", async () => {
            config.serverTelemetryManager = new ServerTelemetryManager(
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
            );
            client = new SilentFlowClient(config, stubPerformanceClient);
            const telemetryCacheHitSpy = jest
                .spyOn(ServerTelemetryManager.prototype, "incrementCacheHits")
                .mockReturnValue(1);
            jest.spyOn(TimeUtils, <any>"isTokenExpired").mockReturnValue(false);

            const silentFlowRequest: CommonSilentFlowRequest = {
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                account: testAccount,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                forceRefresh: false,
            };

            jest.spyOn(TimeUtils, <any>"isTokenExpired").mockReturnValue(false);
            const refreshTokenSpy = jest
                .spyOn(RefreshTokenClient.prototype, "acquireToken")
                .mockImplementation();

            const response = await client.acquireCachedToken(silentFlowRequest);
            const authResult: AuthenticationResult = response[0];
            expect(refreshTokenSpy).not.toHaveBeenCalled();
            const expectedScopes = testAccessTokenEntity.target.split(" ");
            expect(telemetryCacheHitSpy).toHaveBeenCalledTimes(1);
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
            const client = new SilentFlowClient(config, stubPerformanceClient);
            jest.spyOn(TimeUtils, <any>"isTokenExpired").mockReturnValue(false);

            const idTokenClaimsWithAuthTime = {
                ...ID_TOKEN_CLAIMS,
                auth_time: Date.now() - ONE_DAY_IN_MS * 2,
            };
            jest.spyOn(AuthToken, "extractTokenClaims").mockReturnValue(
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
            const client = new SilentFlowClient(config, stubPerformanceClient);
            jest.spyOn(TimeUtils, <any>"isTokenExpired").mockReturnValue(false);

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
            const client = new SilentFlowClient(config, stubPerformanceClient);
            jest.spyOn(TimeUtils, "isTokenExpired").mockReturnValue(true);

            const silentFlowRequest: CommonSilentFlowRequest = {
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                account: testAccount,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                forceRefresh: false,
            };

            expect(
                client.acquireCachedToken(silentFlowRequest)
            ).rejects.toMatchObject(
                createClientAuthError(ClientAuthErrorCodes.tokenRefreshRequired)
            );
        });
    });
});
