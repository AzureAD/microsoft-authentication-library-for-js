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
import { CommonRefreshTokenRequest } from "../../src/request/CommonRefreshTokenRequest.js";
import { CcsCredentialType } from "../../src/account/CcsCredential.js";
import { ServerTelemetryManager } from "../../src/telemetry/server/ServerTelemetryManager.js";
import {
    InteractionRequiredAuthErrorCodes,
    createInteractionRequiredAuthError,
} from "../../src/error/InteractionRequiredAuthError.js";
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

        it("acquireToken returns token from cache if scopes are undefined in request object", async () => {
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
                client.acquireToken(tokenRequest)
            ).rejects.toMatchObject(
                createInteractionRequiredAuthError(
                    InteractionRequiredAuthErrorCodes.noTokensFound
                )
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

    describe("acquireToken tests", () => {
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

        it("acquireToken returns token from cache", async () => {
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

            const authResult = await client.acquireToken(silentFlowRequest);
            expect(refreshTokenSpy).not.toHaveBeenCalled();
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

            jest.spyOn(TimeUtils, <any>"isTokenExpired").mockReturnValue(true);
            const refreshTokenClientSpy = jest.spyOn(
                RefreshTokenClient.prototype,
                "acquireToken"
            );

            await client.acquireToken(silentFlowRequest);
            expect(refreshTokenClientSpy).toHaveBeenCalled();
            expect(refreshTokenClientSpy).toHaveBeenCalledWith(
                expectedRefreshRequest
            );
        });

        it("acquireCachedToken returns cached token", async () => {
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

            const response = await client.acquireCachedToken(silentFlowRequest);
            const authResult: AuthenticationResult = response[0];
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

        it("refreshes token if refreshOn time has passed", async () => {
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
            testAccessTokenEntity.refreshOn = `${
                Number(testAccessTokenEntity.cachedAt) - 1
            }`;
            testAccessTokenEntity.expiresOn = `${
                Number(testAccessTokenEntity.cachedAt) +
                AUTHENTICATION_RESULT.body.expires_in
            }`;
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
            jest.spyOn(
                MockStorageClass.prototype,
                "getAccount"
            ).mockReturnValue(testAccountEntity);

            const silentFlowRequest: CommonSilentFlowRequest = {
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                account: testAccount,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                forceRefresh: false,
            };

            if (!config.storageInterface) {
                fail("config.storageInterface is undefined");
            }

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
                testAccessTokenEntity.clientId
            );
        });

        it("Adds tokenQueryParameters to the /token request", (done) => {
            AUTHENTICATION_RESULT.body.client_info =
                TEST_DATA_CLIENT_INFO.TEST_DECODED_CLIENT_INFO;
            jest.spyOn(
                RefreshTokenClient.prototype,
                <any>"executePostToTokenEndpoint"
            )
                // @ts-expect-error
                .mockImplementation((url: string) => {
                    try {
                        expect(
                            url.includes(
                                "/token?testParam1=testValue1&testParam3=testValue3"
                            )
                        ).toBeTruthy();
                        expect(
                            !url.includes("/token?testParam2=")
                        ).toBeTruthy();
                        done();
                        return AUTHENTICATION_RESULT;
                    } catch (error) {
                        done(error);
                        return error;
                    }
                });
            jest.spyOn(
                Authority.prototype,
                <any>"getEndpointMetadataFromNetwork"
            ).mockResolvedValue(DEFAULT_OPENID_CONFIG_RESPONSE.body);
            testAccessTokenEntity.refreshOn = `${
                Number(testAccessTokenEntity.cachedAt) - 1
            }`;
            testAccessTokenEntity.expiresOn = `${
                Number(testAccessTokenEntity.cachedAt) +
                AUTHENTICATION_RESULT.body.expires_in
            }`;
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
            jest.spyOn(
                MockStorageClass.prototype,
                "getAccount"
            ).mockReturnValue(testAccountEntity);

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

            client.acquireToken(silentFlowRequest).catch((error) => {
                // Catch errors thrown after the function call this test is testing
            });
        });
    });
});
