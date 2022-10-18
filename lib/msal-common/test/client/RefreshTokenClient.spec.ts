/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import sinon from "sinon";
import {
    AUTHENTICATION_RESULT,
    DEFAULT_OPENID_CONFIG_RESPONSE,
    TEST_CONFIG,
    TEST_TOKENS,
    TEST_DATA_CLIENT_INFO,
    ID_TOKEN_CLAIMS,
    AUTHENTICATION_RESULT_WITH_FOCI,
    CORS_SIMPLE_REQUEST_HEADERS,
    POP_AUTHENTICATION_RESULT,
    SSH_AUTHENTICATION_RESULT,
    AUTHENTICATION_RESULT_NO_REFRESH_TOKEN,
    AUTHENTICATION_RESULT_WITH_HEADERS,
    CORS_RESPONSE_HEADERS
} from "../test_kit/StringConstants";
import { BaseClient} from "../../src/client/BaseClient";
import { AADServerParamKeys, GrantType, Constants, CredentialType, AuthenticationScheme, ThrottlingConstants } from "../../src/utils/Constants";
import { ClientTestUtils, MockStorageClass } from "./ClientTestUtils";
import { Authority } from "../../src/authority/Authority";
import { RefreshTokenClient } from "../../src/client/RefreshTokenClient";
import { CommonRefreshTokenRequest } from "../../src/request/CommonRefreshTokenRequest";
import { AccountEntity } from "../../src/cache/entities/AccountEntity";
import { RefreshTokenEntity } from "../../src/cache/entities/RefreshTokenEntity";
import { AuthenticationResult } from "../../src/response/AuthenticationResult";
import { AccountInfo } from "../../src/account/AccountInfo";
import { CacheManager } from "../../src/cache/CacheManager";
import { ClientConfiguration } from "../../src/config/ClientConfiguration";
import { CommonSilentFlowRequest } from "../../src/request/CommonSilentFlowRequest";
import { ClientAuthError } from "../../src/error/ClientAuthError";
import { ClientConfigurationError } from "../../src/error/ClientConfigurationError";
import { AuthToken } from "../../src/account/AuthToken";
import { SilentFlowClient } from "../../src/client/SilentFlowClient";
import { AppMetadataEntity } from "../../src/cache/entities/AppMetadataEntity";
import { CcsCredentialType } from "../../src/account/CcsCredential";
import { InteractionRequiredAuthError } from "../../src/error/InteractionRequiredAuthError";
import { StubPerformanceClient } from "../../src/telemetry/performance/StubPerformanceClient";
import { Logger } from "../../src/logger/Logger";

const testAccountEntity: AccountEntity = new AccountEntity();
testAccountEntity.homeAccountId = `${TEST_DATA_CLIENT_INFO.TEST_UID}.${TEST_DATA_CLIENT_INFO.TEST_UTID}`;
testAccountEntity.localAccountId = ID_TOKEN_CLAIMS.oid;
testAccountEntity.environment = "login.windows.net";
testAccountEntity.realm = ID_TOKEN_CLAIMS.tid;
testAccountEntity.username = ID_TOKEN_CLAIMS.preferred_username;
testAccountEntity.authorityType = "MSSTS";

const testAppMetadata: AppMetadataEntity = new AppMetadataEntity();
testAppMetadata.clientId = TEST_CONFIG.MSAL_CLIENT_ID;
testAppMetadata.familyId = TEST_CONFIG.THE_FAMILY_ID;

const testRefreshTokenEntity: RefreshTokenEntity = new RefreshTokenEntity();
testRefreshTokenEntity.homeAccountId = `${TEST_DATA_CLIENT_INFO.TEST_UID}.${TEST_DATA_CLIENT_INFO.TEST_UTID}`;
testRefreshTokenEntity.clientId = TEST_CONFIG.MSAL_CLIENT_ID;
testRefreshTokenEntity.environment = testAccountEntity.environment;
testRefreshTokenEntity.realm = ID_TOKEN_CLAIMS.tid;
testRefreshTokenEntity.secret = AUTHENTICATION_RESULT.body.refresh_token;
testRefreshTokenEntity.credentialType = CredentialType.REFRESH_TOKEN;

const testFamilyRefreshTokenEntity: RefreshTokenEntity = new RefreshTokenEntity();
testFamilyRefreshTokenEntity.homeAccountId = `${TEST_DATA_CLIENT_INFO.TEST_UID}.${TEST_DATA_CLIENT_INFO.TEST_UTID}`;
testFamilyRefreshTokenEntity.clientId = TEST_CONFIG.MSAL_CLIENT_ID;
testFamilyRefreshTokenEntity.environment = testAccountEntity.environment;
testFamilyRefreshTokenEntity.realm = ID_TOKEN_CLAIMS.tid;
testFamilyRefreshTokenEntity.secret = AUTHENTICATION_RESULT.body.refresh_token;
testFamilyRefreshTokenEntity.credentialType = CredentialType.REFRESH_TOKEN;
testFamilyRefreshTokenEntity.familyId = TEST_CONFIG.THE_FAMILY_ID;

describe("RefreshTokenClient unit tests", () => {
    afterEach(() => {
        sinon.restore();
    });

    const name = "test-client-id";
    const version = "0.0.1";
    const logger = new Logger({});
    const applicationTelemetry = {
        appName: "Test App",
        appVersion: "1.0.0-test.0"
    }

    let stubPerformanceClient: StubPerformanceClient;
    beforeEach(async () => {
        
        stubPerformanceClient = new StubPerformanceClient(TEST_CONFIG.MSAL_CLIENT_ID,TEST_CONFIG.validAuthority, logger, name, version, applicationTelemetry);
    });

    describe("Constructor", () => {
        it("creates a RefreshTokenClient", async () => {
            sinon.stub(Authority.prototype, <any>"getEndpointMetadataFromNetwork").resolves(DEFAULT_OPENID_CONFIG_RESPONSE.body);
            const config = await ClientTestUtils.createTestClientConfiguration();
            const client = new RefreshTokenClient(config,stubPerformanceClient);
            expect(client).not.toBeNull();
            expect(client instanceof RefreshTokenClient).toBe(true);
            expect(client instanceof BaseClient).toBe(true);
        });
    });

    describe("executeTokenRequest", () => {
        let config: ClientConfiguration;

        const refreshTokenRequest: CommonRefreshTokenRequest = {
            scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
            refreshToken: TEST_TOKENS.REFRESH_TOKEN,
            claims: TEST_CONFIG.CLAIMS,
            authority: TEST_CONFIG.validAuthority,
            correlationId: TEST_CONFIG.CORRELATION_ID,
            authenticationScheme: TEST_CONFIG.TOKEN_TYPE_BEARER as AuthenticationScheme
        };

        beforeEach(async () => {
            sinon.stub(Authority.prototype, <any>"getEndpointMetadataFromNetwork").resolves(DEFAULT_OPENID_CONFIG_RESPONSE.body);
            config = await ClientTestUtils.createTestClientConfiguration();
        });

        afterEach(() => {
            jest.restoreAllMocks();
        });

        it("Adds tokenQueryParameters to the /token request", (done) => {
            sinon.stub(RefreshTokenClient.prototype, <any>"executePostToTokenEndpoint").callsFake(async (url) => {
                expect(url.includes("/token?testParam=testValue")).toBe(true);
                done();
            });

            const client = new RefreshTokenClient(config,stubPerformanceClient);
            const refreshTokenRequest: CommonRefreshTokenRequest = {
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                refreshToken: TEST_TOKENS.REFRESH_TOKEN,
                claims: TEST_CONFIG.CLAIMS,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                authenticationScheme: TEST_CONFIG.TOKEN_TYPE_BEARER as AuthenticationScheme,
                tokenQueryParameters: {
                    testParam: "testValue"
                }
            };

            client.acquireToken(refreshTokenRequest).catch(e => {
                // Catch errors thrown after the function call this test is testing    
            });
        });

        it("Checks whether performance telemetry startMeasurement method is called", async () => {
            const spy = jest.spyOn(stubPerformanceClient, 'startMeasurement');
            
            const client = new RefreshTokenClient(config,stubPerformanceClient);
            sinon.stub(RefreshTokenClient.prototype, <any>"executePostToTokenEndpoint").resolves(AUTHENTICATION_RESULT);
            
            await client.acquireToken(refreshTokenRequest);
            expect(spy).toHaveBeenCalled();
        });

        it("Checks whether performance telemetry addStaticFields method is called", async () => {
            const spy = jest.spyOn(stubPerformanceClient, 'addStaticFields');
            
            const client = new RefreshTokenClient(config,stubPerformanceClient);
            sinon.stub(RefreshTokenClient.prototype, <any>"executePostToTokenEndpoint").resolves(AUTHENTICATION_RESULT);
            
            let refreshTokenSize;
            await client.acquireToken(refreshTokenRequest).then(() => {
                expect(spy).toHaveBeenCalled();
                for (let i=0; i<spy.mock.calls.length; i++) {
                    const arg = spy.mock.calls[i][0];
                    if (typeof arg.refreshTokenSize !== "undefined") {
                        refreshTokenSize = arg.refreshTokenSize;
                        break;
                    }
                }
            });

            expect(refreshTokenSize).toBe(19);
        });

        it("Checks whether performance telemetry addStaticFields method is called- no rt", async () => {
            const spy = jest.spyOn(stubPerformanceClient, 'addStaticFields');
            
            const client = new RefreshTokenClient(config,stubPerformanceClient);
            sinon.stub(RefreshTokenClient.prototype, <any>"executePostToTokenEndpoint").resolves(AUTHENTICATION_RESULT_NO_REFRESH_TOKEN);
            
            let refreshTokenSize;
            await client.acquireToken(refreshTokenRequest).then(() => {
                expect(spy).toHaveBeenCalled();
                for (let i=0; i<spy.mock.calls.length; i++) {
                    const arg = spy.mock.calls[i][0];
                    if (typeof arg.refreshTokenSize !== "undefined") {
                        refreshTokenSize = arg.refreshTokenSize;
                        break;
                    }
                }
            });

            expect(refreshTokenSize).toBe(0);
        });
    });

    describe("acquireToken APIs", () => {
        let config: ClientConfiguration;
        let client: RefreshTokenClient;

        const testAccount: AccountInfo = {
            homeAccountId: `${TEST_DATA_CLIENT_INFO.TEST_UID}.${TEST_DATA_CLIENT_INFO.TEST_UTID}`,
            tenantId: ID_TOKEN_CLAIMS.tid,
            environment: "login.windows.net",
            username: ID_TOKEN_CLAIMS.preferred_username,
            name: ID_TOKEN_CLAIMS.name,
            localAccountId: ID_TOKEN_CLAIMS.oid,
            idTokenClaims: ID_TOKEN_CLAIMS
        };

        beforeEach(async () => {
            sinon.stub(Authority.prototype, <any>"getEndpointMetadataFromNetwork").resolves(DEFAULT_OPENID_CONFIG_RESPONSE.body);
            sinon.stub(Authority.prototype, "getPreferredCache").returns("login.windows.net");
            AUTHENTICATION_RESULT.body.client_info = TEST_DATA_CLIENT_INFO.TEST_DECODED_CLIENT_INFO;
            sinon.stub(AuthToken, "extractTokenClaims").returns(ID_TOKEN_CLAIMS);
            sinon.stub(CacheManager.prototype, "readRefreshTokenFromCache").returns(testRefreshTokenEntity);

            config = await ClientTestUtils.createTestClientConfiguration();
            config.storageInterface!.setAccount(testAccountEntity);
            config.storageInterface!.setRefreshTokenCredential(testRefreshTokenEntity);
            config.storageInterface!.setRefreshTokenCredential(testFamilyRefreshTokenEntity);
            config.storageInterface!.setAppMetadata(testAppMetadata);
            client = new RefreshTokenClient(config,stubPerformanceClient);
        });

        afterEach(() => {
            sinon.restore();
        });

        it("Does not add headers that do not qualify for a simple request", (done) => {
            // For more information about this test see: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
            sinon.stub(RefreshTokenClient.prototype, <any>"executePostToTokenEndpoint").callsFake(async (tokenEndpoint: string, queryString: string, headers: Record<string, string>) => {
                const headerNames = Object.keys(headers);
                headerNames.forEach((name) => {
                    expect(CORS_SIMPLE_REQUEST_HEADERS.includes(name.toLowerCase())).toBe(true);
                });
    
                done();
                return AUTHENTICATION_RESULT;
            });

            const client = new RefreshTokenClient(config,stubPerformanceClient);
            const refreshTokenRequest: CommonRefreshTokenRequest = {
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                refreshToken: TEST_TOKENS.REFRESH_TOKEN,
                claims: TEST_CONFIG.CLAIMS,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                authenticationScheme: TEST_CONFIG.TOKEN_TYPE_BEARER as AuthenticationScheme
            };

            client.acquireToken(refreshTokenRequest);
        });

        it("acquires a token", async () => {
            sinon.stub(RefreshTokenClient.prototype, <any>"executePostToTokenEndpoint").resolves(AUTHENTICATION_RESULT);
            const createTokenRequestBodySpy = sinon.spy(RefreshTokenClient.prototype, <any>"createTokenRequestBody");
            const client = new RefreshTokenClient(config,stubPerformanceClient);
            const refreshTokenRequest: CommonRefreshTokenRequest = {
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                refreshToken: TEST_TOKENS.REFRESH_TOKEN,
                claims: TEST_CONFIG.CLAIMS,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                authenticationScheme: TEST_CONFIG.TOKEN_TYPE_BEARER as AuthenticationScheme
            };

            const authResult: AuthenticationResult = await client.acquireToken(refreshTokenRequest);
            const expectedScopes = [Constants.OPENID_SCOPE, Constants.PROFILE_SCOPE, TEST_CONFIG.DEFAULT_GRAPH_SCOPE[0], "email"];

            expect(authResult.uniqueId).toEqual(ID_TOKEN_CLAIMS.oid);
            expect(authResult.tenantId).toEqual(ID_TOKEN_CLAIMS.tid);
            expect(authResult.scopes).toEqual(expectedScopes);
            expect(authResult.account).toEqual(testAccount);
            expect(authResult.idToken).toEqual(AUTHENTICATION_RESULT.body.id_token);
            expect(authResult.idTokenClaims).toEqual(ID_TOKEN_CLAIMS);
            expect(authResult.accessToken).toEqual(AUTHENTICATION_RESULT.body.access_token);
            expect(authResult.state).toHaveLength(0);
            expect(createTokenRequestBodySpy.calledWith(refreshTokenRequest)).toBe(true);

            const result = await createTokenRequestBodySpy.returnValues[0] as string;
            expect(result.includes(`${TEST_CONFIG.DEFAULT_GRAPH_SCOPE[0]}`)).toBe(true);
            expect(result.includes(`${AADServerParamKeys.CLIENT_ID}=${TEST_CONFIG.MSAL_CLIENT_ID}`)).toBe(true);
            expect(result.includes(`${AADServerParamKeys.REFRESH_TOKEN}=${TEST_TOKENS.REFRESH_TOKEN}`)).toBe(true);
            expect(result.includes(`${AADServerParamKeys.GRANT_TYPE}=${GrantType.REFRESH_TOKEN_GRANT}`)).toBe(true);
            expect(result.includes(`${AADServerParamKeys.CLIENT_SECRET}=${TEST_CONFIG.MSAL_CLIENT_SECRET}`)).toBe(true);
            expect(result.includes(`${AADServerParamKeys.CLAIMS}=${encodeURIComponent(TEST_CONFIG.CLAIMS)}`)).toBe(true);
            expect(result.includes(`${AADServerParamKeys.X_CLIENT_SKU}=${Constants.SKU}`)).toBe(true);
            expect(result.includes(`${AADServerParamKeys.X_CLIENT_VER}=${TEST_CONFIG.TEST_VERSION}`)).toBe(true);
            expect(result.includes(`${AADServerParamKeys.X_CLIENT_OS}=${TEST_CONFIG.TEST_OS}`)).toBe(true);
            expect(result.includes(`${AADServerParamKeys.X_CLIENT_CPU}=${TEST_CONFIG.TEST_CPU}`)).toBe(true);
            expect(result.includes(`${AADServerParamKeys.X_APP_NAME}=${TEST_CONFIG.applicationName}`)).toBe(true);
            expect(result.includes(`${AADServerParamKeys.X_APP_VER}=${TEST_CONFIG.applicationVersion}`)).toBe(true);
            expect(result.includes(`${AADServerParamKeys.X_MS_LIB_CAPABILITY}=${ThrottlingConstants.X_MS_LIB_CAPABILITY_VALUE}`)).toBe(true);
        });

        it("acquireTokenByRefreshToken refreshes a token", async () => {
            sinon.stub(RefreshTokenClient.prototype, <any>"executePostToTokenEndpoint").resolves(AUTHENTICATION_RESULT);
            const silentFlowRequest: CommonSilentFlowRequest = {
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                account: testAccount,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                forceRefresh: false
            };

            const expectedRefreshRequest: CommonRefreshTokenRequest = {
                ...silentFlowRequest,
                authenticationScheme: TEST_CONFIG.TOKEN_TYPE_BEARER as AuthenticationScheme,
                refreshToken: testRefreshTokenEntity.secret,
                ccsCredential: {
                    credential: testAccount.homeAccountId,
                    type: CcsCredentialType.HOME_ACCOUNT_ID
                }
            };
            const refreshTokenClientSpy = sinon.stub(RefreshTokenClient.prototype, "acquireToken");

            await client.acquireTokenByRefreshToken(silentFlowRequest);
            expect(refreshTokenClientSpy.calledWith(expectedRefreshRequest)).toBe(true);
        });

        it("acquireTokenByRefreshToken refreshes a POP token", async () => {
            sinon.stub(RefreshTokenClient.prototype, <any>"executePostToTokenEndpoint").resolves(POP_AUTHENTICATION_RESULT);
            const silentFlowRequest: CommonSilentFlowRequest = {
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                account: testAccount,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                forceRefresh: false,
                authenticationScheme: AuthenticationScheme.POP
            };

            const expectedRefreshRequest: CommonRefreshTokenRequest = {
                ...silentFlowRequest,
                refreshToken: testRefreshTokenEntity.secret,
                ccsCredential: {
                    credential: testAccount.homeAccountId,
                    type: CcsCredentialType.HOME_ACCOUNT_ID
                }
            };
            const refreshTokenClientSpy = sinon.stub(RefreshTokenClient.prototype, "acquireToken");

            await client.acquireTokenByRefreshToken(silentFlowRequest);
            expect(refreshTokenClientSpy.calledWith(expectedRefreshRequest)).toBe(true);
        });

        it("acquireTokenByRefreshToken refreshes an SSH Cert", async () => {
            sinon.stub(RefreshTokenClient.prototype, <any>"executePostToTokenEndpoint").resolves(SSH_AUTHENTICATION_RESULT);
            const silentFlowRequest: CommonSilentFlowRequest = {
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                account: testAccount,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                forceRefresh: false,
                authenticationScheme: AuthenticationScheme.SSH
            };

            const expectedRefreshRequest: CommonRefreshTokenRequest = {
                ...silentFlowRequest,
                refreshToken: testRefreshTokenEntity.secret,
                ccsCredential: {
                    credential: testAccount.homeAccountId,
                    type: CcsCredentialType.HOME_ACCOUNT_ID
                }
            };
            const refreshTokenClientSpy = sinon.stub(RefreshTokenClient.prototype, "acquireToken");

            await client.acquireTokenByRefreshToken(silentFlowRequest);
            expect(refreshTokenClientSpy.calledWith(expectedRefreshRequest)).toBe(true);
        });

        it("does not add claims if none are provided", async () => {
            sinon.stub(RefreshTokenClient.prototype, <any>"executePostToTokenEndpoint").resolves(AUTHENTICATION_RESULT);
            const createTokenRequestBodySpy = sinon.spy(RefreshTokenClient.prototype, <any>"createTokenRequestBody");
            const client = new RefreshTokenClient(config,stubPerformanceClient);
            const refreshTokenRequest: CommonRefreshTokenRequest = {
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                refreshToken: TEST_TOKENS.REFRESH_TOKEN,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                authenticationScheme: TEST_CONFIG.TOKEN_TYPE_BEARER as AuthenticationScheme
            };

            const authResult: AuthenticationResult = await client.acquireToken(refreshTokenRequest);
            const expectedScopes = [Constants.OPENID_SCOPE, Constants.PROFILE_SCOPE, TEST_CONFIG.DEFAULT_GRAPH_SCOPE[0], "email"];

            expect(authResult.uniqueId).toEqual(ID_TOKEN_CLAIMS.oid);
            expect(authResult.tenantId).toEqual(ID_TOKEN_CLAIMS.tid);
            expect(authResult.scopes).toEqual(expectedScopes);
            expect(authResult.account).toEqual(testAccount);
            expect(authResult.idToken).toEqual(AUTHENTICATION_RESULT.body.id_token);
            expect(authResult.idTokenClaims).toEqual(ID_TOKEN_CLAIMS);
            expect(authResult.accessToken).toEqual(AUTHENTICATION_RESULT.body.access_token);
            expect(authResult.state).toBe("");
            expect(createTokenRequestBodySpy.calledWith(refreshTokenRequest)).toBe(true);

            const result = await createTokenRequestBodySpy.returnValues[0] as string;
            expect(result.includes(`${TEST_CONFIG.DEFAULT_GRAPH_SCOPE[0]}`)).toBe(true);
            expect(result.includes(`${AADServerParamKeys.CLIENT_ID}=${TEST_CONFIG.MSAL_CLIENT_ID}`)).toBe(true);
            expect(result.includes(`${AADServerParamKeys.REFRESH_TOKEN}=${TEST_TOKENS.REFRESH_TOKEN}`)).toBe(true);
            expect(result.includes(`${AADServerParamKeys.GRANT_TYPE}=${GrantType.REFRESH_TOKEN_GRANT}`)).toBe(true);
            expect(result.includes(`${AADServerParamKeys.CLIENT_SECRET}=${TEST_CONFIG.MSAL_CLIENT_SECRET}`)).toBe(true);
            expect(result.includes(`${AADServerParamKeys.CLAIMS}=${encodeURIComponent(TEST_CONFIG.CLAIMS)}`)).toBe(false);
            expect(result.includes(`${AADServerParamKeys.X_CLIENT_SKU}=${Constants.SKU}`)).toBe(true);
            expect(result.includes(`${AADServerParamKeys.X_CLIENT_VER}=${TEST_CONFIG.TEST_VERSION}`)).toBe(true);
            expect(result.includes(`${AADServerParamKeys.X_CLIENT_OS}=${TEST_CONFIG.TEST_OS}`)).toBe(true);
            expect(result.includes(`${AADServerParamKeys.X_CLIENT_CPU}=${TEST_CONFIG.TEST_CPU}`)).toBe(true);
            expect(result.includes(`${AADServerParamKeys.X_APP_NAME}=${TEST_CONFIG.applicationName}`)).toBe(true);
            expect(result.includes(`${AADServerParamKeys.X_APP_VER}=${TEST_CONFIG.applicationVersion}`)).toBe(true);
            expect(result.includes(`${AADServerParamKeys.X_MS_LIB_CAPABILITY}=${ThrottlingConstants.X_MS_LIB_CAPABILITY_VALUE}`)).toBe(true);
        });
        
        it("does not add claims if empty object is provided", async () => {
            sinon.stub(RefreshTokenClient.prototype, <any>"executePostToTokenEndpoint").resolves(AUTHENTICATION_RESULT);
            const createTokenRequestBodySpy = sinon.spy(RefreshTokenClient.prototype, <any>"createTokenRequestBody");
            const client = new RefreshTokenClient(config,stubPerformanceClient);
            const refreshTokenRequest: CommonRefreshTokenRequest = {
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                refreshToken: TEST_TOKENS.REFRESH_TOKEN,
                authority: TEST_CONFIG.validAuthority,
                claims: "{}",
                correlationId: TEST_CONFIG.CORRELATION_ID,
                authenticationScheme: TEST_CONFIG.TOKEN_TYPE_BEARER as AuthenticationScheme
            };

            const authResult: AuthenticationResult = await client.acquireToken(refreshTokenRequest);
            const expectedScopes = [Constants.OPENID_SCOPE, Constants.PROFILE_SCOPE, TEST_CONFIG.DEFAULT_GRAPH_SCOPE[0], "email"];

            expect(authResult.uniqueId).toEqual(ID_TOKEN_CLAIMS.oid);
            expect(authResult.tenantId).toEqual(ID_TOKEN_CLAIMS.tid);
            expect(authResult.scopes).toEqual(expectedScopes);
            expect(authResult.account).toEqual(testAccount);
            expect(authResult.idToken).toEqual(AUTHENTICATION_RESULT.body.id_token);
            expect(authResult.idTokenClaims).toEqual(ID_TOKEN_CLAIMS);
            expect(authResult.accessToken).toEqual(AUTHENTICATION_RESULT.body.access_token);
            expect(authResult.state).toBe("");
            expect(createTokenRequestBodySpy.calledWith(refreshTokenRequest)).toBe(true);

            const result = await createTokenRequestBodySpy.returnValues[0] as string;
            expect(result.includes(`${TEST_CONFIG.DEFAULT_GRAPH_SCOPE[0]}`)).toBe(true);
            expect(result.includes(`${AADServerParamKeys.CLIENT_ID}=${TEST_CONFIG.MSAL_CLIENT_ID}`)).toBe(true);
            expect(result.includes(`${AADServerParamKeys.REFRESH_TOKEN}=${TEST_TOKENS.REFRESH_TOKEN}`)).toBe(true);
            expect(result.includes(`${AADServerParamKeys.GRANT_TYPE}=${GrantType.REFRESH_TOKEN_GRANT}`)).toBe(true);
            expect(result.includes(`${AADServerParamKeys.CLIENT_SECRET}=${TEST_CONFIG.MSAL_CLIENT_SECRET}`)).toBe(true);
            expect(result.includes(`${AADServerParamKeys.CLAIMS}=${encodeURIComponent(TEST_CONFIG.CLAIMS)}`)).toBe(false);
            expect(result.includes(`${AADServerParamKeys.X_CLIENT_SKU}=${Constants.SKU}`)).toBe(true);
            expect(result.includes(`${AADServerParamKeys.X_CLIENT_VER}=${TEST_CONFIG.TEST_VERSION}`)).toBe(true);
            expect(result.includes(`${AADServerParamKeys.X_CLIENT_OS}=${TEST_CONFIG.TEST_OS}`)).toBe(true);
            expect(result.includes(`${AADServerParamKeys.X_CLIENT_CPU}=${TEST_CONFIG.TEST_CPU}`)).toBe(true);
            expect(result.includes(`${AADServerParamKeys.X_APP_NAME}=${TEST_CONFIG.applicationName}`)).toBe(true);
            expect(result.includes(`${AADServerParamKeys.X_APP_VER}=${TEST_CONFIG.applicationVersion}`)).toBe(true);
            expect(result.includes(`${AADServerParamKeys.X_MS_LIB_CAPABILITY}=${ThrottlingConstants.X_MS_LIB_CAPABILITY_VALUE}`)).toBe(true);
        });

        it("includes the requestId in the result when received in server response", async () => {
            sinon.stub(RefreshTokenClient.prototype, <any>"executePostToTokenEndpoint").resolves(AUTHENTICATION_RESULT_WITH_HEADERS);
            const client = new RefreshTokenClient(config,stubPerformanceClient);
            const refreshTokenRequest: CommonRefreshTokenRequest = {
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                refreshToken: TEST_TOKENS.REFRESH_TOKEN,
                claims: TEST_CONFIG.CLAIMS,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                authenticationScheme: TEST_CONFIG.TOKEN_TYPE_BEARER as AuthenticationScheme
            };

            const authResult: AuthenticationResult = await client.acquireToken(refreshTokenRequest);

            expect(authResult.requestId).toBeTruthy;
            expect(authResult.requestId).toEqual(CORS_RESPONSE_HEADERS.xMsRequestId);
        });

        it("does not include the requestId in the result when none in server response", async () => {
            sinon.stub(RefreshTokenClient.prototype, <any>"executePostToTokenEndpoint").resolves(AUTHENTICATION_RESULT);
            const client = new RefreshTokenClient(config,stubPerformanceClient);
            const refreshTokenRequest: CommonRefreshTokenRequest = {
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                refreshToken: TEST_TOKENS.REFRESH_TOKEN,
                claims: TEST_CONFIG.CLAIMS,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                authenticationScheme: TEST_CONFIG.TOKEN_TYPE_BEARER as AuthenticationScheme
            };

            const authResult: AuthenticationResult = await client.acquireToken(refreshTokenRequest);

            expect(authResult.requestId).toBeFalsy;
            expect(authResult.requestId).toEqual("");
        });
    });

    describe("acquireToken APIs with FOCI enabled", () => {
        let config: ClientConfiguration;
        let client: RefreshTokenClient;

        const testAccount: AccountInfo = {
            homeAccountId: `${TEST_DATA_CLIENT_INFO.TEST_UID}.${TEST_DATA_CLIENT_INFO.TEST_UTID}`,
            tenantId: ID_TOKEN_CLAIMS.tid,
            environment: "login.windows.net",
            username: ID_TOKEN_CLAIMS.preferred_username,
            name: ID_TOKEN_CLAIMS.name,
            localAccountId: ID_TOKEN_CLAIMS.oid,
            idTokenClaims: ID_TOKEN_CLAIMS
        };

        beforeEach(async () => {
            sinon.stub(Authority.prototype, <any>"getEndpointMetadataFromNetwork").resolves(DEFAULT_OPENID_CONFIG_RESPONSE.body);
            sinon.stub(Authority.prototype, "getPreferredCache").returns("login.windows.net");
            AUTHENTICATION_RESULT_WITH_FOCI.body.client_info = TEST_DATA_CLIENT_INFO.TEST_DECODED_CLIENT_INFO;
            sinon.stub(RefreshTokenClient.prototype, <any>"executePostToTokenEndpoint").resolves(AUTHENTICATION_RESULT_WITH_FOCI);
            sinon.stub(AuthToken, "extractTokenClaims").returns(ID_TOKEN_CLAIMS);
            sinon.stub(CacheManager.prototype, "readRefreshTokenFromCache").returns(testFamilyRefreshTokenEntity);

            config = await ClientTestUtils.createTestClientConfiguration();
            config.storageInterface!.setAccount(testAccountEntity);
            config.storageInterface!.setRefreshTokenCredential(testRefreshTokenEntity);
            config.storageInterface!.setRefreshTokenCredential(testFamilyRefreshTokenEntity);
            config.storageInterface!.setAppMetadata(testAppMetadata);
            client = new RefreshTokenClient(config,stubPerformanceClient);
        });

        afterEach(() => {
            sinon.restore();
        });

        it("acquires a token (FOCI)", async () => {
            const createTokenRequestBodySpy = sinon.spy(RefreshTokenClient.prototype, <any>"createTokenRequestBody");
            const client = new RefreshTokenClient(config,stubPerformanceClient);
            const refreshTokenRequest: CommonRefreshTokenRequest = {
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                refreshToken: TEST_TOKENS.REFRESH_TOKEN,
                claims: TEST_CONFIG.CLAIMS,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                authenticationScheme: TEST_CONFIG.TOKEN_TYPE_BEARER as AuthenticationScheme
            };

            const authResult: AuthenticationResult = await client.acquireToken(refreshTokenRequest);
            const expectedScopes = [Constants.OPENID_SCOPE, Constants.PROFILE_SCOPE, TEST_CONFIG.DEFAULT_GRAPH_SCOPE[0], "email"];
            expect(authResult.uniqueId).toEqual(ID_TOKEN_CLAIMS.oid);
            expect(authResult.tenantId).toEqual(ID_TOKEN_CLAIMS.tid);
            expect(authResult.scopes).toEqual(expectedScopes);
            expect(authResult.account).toEqual(testAccount);
            expect(authResult.idToken).toEqual(AUTHENTICATION_RESULT_WITH_FOCI.body.id_token);
            expect(authResult.idTokenClaims).toEqual(ID_TOKEN_CLAIMS);
            expect(authResult.accessToken).toEqual(AUTHENTICATION_RESULT_WITH_FOCI.body.access_token);
            expect(authResult.familyId).toEqual(AUTHENTICATION_RESULT_WITH_FOCI.body.foci);
            expect(authResult.state).toHaveLength(0);

            expect(createTokenRequestBodySpy.calledWith(refreshTokenRequest)).toBe(true);

            const result = await createTokenRequestBodySpy.returnValues[0] as string;
            expect(result.includes(`${TEST_CONFIG.DEFAULT_GRAPH_SCOPE[0]}`)).toBe(true);
            expect(result.includes(`${AADServerParamKeys.CLIENT_ID}=${TEST_CONFIG.MSAL_CLIENT_ID}`)).toBe(true);
            expect(result.includes(`${AADServerParamKeys.REFRESH_TOKEN}=${TEST_TOKENS.REFRESH_TOKEN}`)).toBe(true);
            expect(result.includes(`${AADServerParamKeys.GRANT_TYPE}=${GrantType.REFRESH_TOKEN_GRANT}`)).toBe(true);
            expect(result.includes(`${AADServerParamKeys.CLIENT_SECRET}=${TEST_CONFIG.MSAL_CLIENT_SECRET}`)).toBe(true);
            expect(result.includes(`${AADServerParamKeys.CLAIMS}=${encodeURIComponent(TEST_CONFIG.CLAIMS)}`)).toBe(true);
        });

        it("acquireTokenByRefreshToken refreshes a token (FOCI)", async () => {
            const silentFlowRequest: CommonSilentFlowRequest = {
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                account: testAccount,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                forceRefresh: false
            };

            const expectedRefreshRequest: CommonRefreshTokenRequest = {
                ...silentFlowRequest,
                refreshToken: testRefreshTokenEntity.secret,
                authenticationScheme: TEST_CONFIG.TOKEN_TYPE_BEARER as AuthenticationScheme,
                ccsCredential: {
                    credential: testAccount.homeAccountId,
                    type: CcsCredentialType.HOME_ACCOUNT_ID
                }
            };
            const refreshTokenClientSpy = sinon.stub(RefreshTokenClient.prototype, "acquireToken");

            await client.acquireTokenByRefreshToken(silentFlowRequest);
            expect(refreshTokenClientSpy.calledWith(expectedRefreshRequest)).toBe(true);
        });
    });

    describe("Error cases", () => {

        it("Throws error if account is not included in request object", async () => {
            sinon.stub(Authority.prototype, <any>"getEndpointMetadataFromNetwork").resolves(DEFAULT_OPENID_CONFIG_RESPONSE.body);
            const config = await ClientTestUtils.createTestClientConfiguration();
            const client = new RefreshTokenClient(config,stubPerformanceClient);
            await expect(client.acquireTokenByRefreshToken({
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                // @ts-ignore
                account: null,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                forceRefresh: false
            })).rejects.toMatchObject(ClientAuthError.createNoAccountInSilentRequestError());
        });

        it("Throws error if request object is null or undefined", async () => {
            sinon.stub(Authority.prototype, <any>"getEndpointMetadataFromNetwork").resolves(DEFAULT_OPENID_CONFIG_RESPONSE.body);
            const config = await ClientTestUtils.createTestClientConfiguration();
            const client = new RefreshTokenClient(config,stubPerformanceClient);
            //@ts-ignore
            await expect(client.acquireTokenByRefreshToken(null)).rejects.toMatchObject(ClientConfigurationError.createEmptyTokenRequestError());
            //@ts-ignore
            await expect(client.acquireTokenByRefreshToken(undefined)).rejects.toMatchObject(ClientConfigurationError.createEmptyTokenRequestError());
        });

        it("Throws error if it does not find token in cache", async () => {
            const testAccount: AccountInfo = {
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_LOCAL_ACCOUNT_ID,
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_ENCODED_HOME_ACCOUNT_ID,
                environment: "login.windows.net",
                tenantId: "testTenantId",
                username: "testname@contoso.com"
            };
            const testScope2 = "scope2";
            const testAccountEntity: AccountEntity = new AccountEntity();
            testAccountEntity.homeAccountId = TEST_DATA_CLIENT_INFO.TEST_ENCODED_HOME_ACCOUNT_ID;
            testAccountEntity.localAccountId = ID_TOKEN_CLAIMS.oid;
            testAccountEntity.environment = "login.windows.net";
            testAccountEntity.realm = "testTenantId";
            testAccountEntity.username = "username@contoso.com";
            testAccountEntity.authorityType = "MSSTS";
            sinon.stub(MockStorageClass.prototype, "getAccount").returns(testAccountEntity);
            sinon.stub(Authority.prototype, <any>"getEndpointMetadataFromNetwork").resolves(DEFAULT_OPENID_CONFIG_RESPONSE.body);
            const tokenRequest: CommonSilentFlowRequest = {
                scopes: [testScope2],
                account: testAccount,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                forceRefresh: false
            };
            const config = await ClientTestUtils.createTestClientConfiguration();
            const client = new SilentFlowClient(config,stubPerformanceClient);
            await expect(client.acquireToken(tokenRequest)).rejects.toMatchObject(InteractionRequiredAuthError.createNoTokensFoundError());
        });
    });
});
