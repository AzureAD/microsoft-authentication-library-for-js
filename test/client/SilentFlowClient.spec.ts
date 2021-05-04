/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import sinon from "sinon";
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
import { AuthenticationScheme, Constants, CredentialType } from "../../src/utils/Constants";
import { ClientTestUtils, MockStorageClass } from "./ClientTestUtils";
import { Authority } from "../../src/authority/Authority";
import { SilentFlowClient } from "../../src/client/SilentFlowClient";
import { RefreshTokenClient } from "../../src/client/RefreshTokenClient";
import { AuthenticationResult } from "../../src/response/AuthenticationResult";
import { AccountInfo } from "../../src/account/AccountInfo";
import { CommonSilentFlowRequest, AccountEntity, IdTokenEntity, AccessTokenEntity, RefreshTokenEntity, CacheManager, ClientConfigurationErrorMessage, ClientAuthErrorMessage, TimeUtils, ClientConfiguration, RefreshTokenRequest, ServerTelemetryManager, TokenClaims } from "../../src";
import { AuthToken } from "../../src/account/AuthToken";
import { ScopeSet } from "../../src/request/ScopeSet";
import { PopTokenGenerator } from "../../src/crypto/PopTokenGenerator";

const testAccountEntity: AccountEntity = new AccountEntity();
testAccountEntity.homeAccountId = `${TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID}`;
testAccountEntity.localAccountId = ID_TOKEN_CLAIMS.oid;
testAccountEntity.environment = "login.windows.net";
testAccountEntity.realm = ID_TOKEN_CLAIMS.tid;
testAccountEntity.username = ID_TOKEN_CLAIMS.preferred_username;
testAccountEntity.name = ID_TOKEN_CLAIMS.name;
testAccountEntity.authorityType = "MSSTS";

const testIdToken: IdTokenEntity = new IdTokenEntity();
testIdToken.homeAccountId = `${TEST_DATA_CLIENT_INFO.TEST_UID}.${TEST_DATA_CLIENT_INFO.TEST_UTID}`;
testIdToken.clientId = TEST_CONFIG.MSAL_CLIENT_ID;
testIdToken.environment = testAccountEntity.environment;
testIdToken.realm = ID_TOKEN_CLAIMS.tid;
testIdToken.secret = AUTHENTICATION_RESULT.body.id_token;
testIdToken.credentialType = CredentialType.ID_TOKEN;

const testAccessTokenEntity: AccessTokenEntity = new AccessTokenEntity();
testAccessTokenEntity.homeAccountId = `${TEST_DATA_CLIENT_INFO.TEST_UID}.${TEST_DATA_CLIENT_INFO.TEST_UTID}`;
testAccessTokenEntity.clientId = TEST_CONFIG.MSAL_CLIENT_ID;
testAccessTokenEntity.environment = testAccountEntity.environment;
testAccessTokenEntity.realm = ID_TOKEN_CLAIMS.tid;
testAccessTokenEntity.secret = AUTHENTICATION_RESULT.body.access_token;
testAccessTokenEntity.target = TEST_CONFIG.DEFAULT_SCOPES.join(" ") + " " + TEST_CONFIG.DEFAULT_GRAPH_SCOPE.join(" ");
testAccessTokenEntity.credentialType = CredentialType.ACCESS_TOKEN;
testAccessTokenEntity.cachedAt = `${TimeUtils.nowSeconds()}`;
testAccessTokenEntity.tokenType = AuthenticationScheme.BEARER;

const testAccessTokenWithAuthSchemeEntity: AccessTokenEntity = new AccessTokenEntity();
testAccessTokenWithAuthSchemeEntity.homeAccountId = `${TEST_DATA_CLIENT_INFO.TEST_UID}.${TEST_DATA_CLIENT_INFO.TEST_UTID}`;
testAccessTokenWithAuthSchemeEntity.clientId = TEST_CONFIG.MSAL_CLIENT_ID;
testAccessTokenWithAuthSchemeEntity.environment = testAccountEntity.environment;
testAccessTokenWithAuthSchemeEntity.realm = ID_TOKEN_CLAIMS.tid;
testAccessTokenWithAuthSchemeEntity.secret = TEST_TOKENS.POP_TOKEN;
testAccessTokenWithAuthSchemeEntity.target = TEST_CONFIG.DEFAULT_SCOPES.join(" ") + " " + TEST_CONFIG.DEFAULT_GRAPH_SCOPE.join(" ");
testAccessTokenWithAuthSchemeEntity.credentialType = CredentialType.ACCESS_TOKEN_WITH_AUTH_SCHEME;
testAccessTokenWithAuthSchemeEntity.cachedAt = `${TimeUtils.nowSeconds()}`;
testAccessTokenWithAuthSchemeEntity.tokenType = AuthenticationScheme.POP;


const testRefreshTokenEntity: RefreshTokenEntity = new RefreshTokenEntity();
testRefreshTokenEntity.homeAccountId = `${TEST_DATA_CLIENT_INFO.TEST_UID}.${TEST_DATA_CLIENT_INFO.TEST_UTID}`;
testRefreshTokenEntity.clientId = TEST_CONFIG.MSAL_CLIENT_ID;
testRefreshTokenEntity.environment = testAccountEntity.environment;
testRefreshTokenEntity.realm = ID_TOKEN_CLAIMS.tid;
testRefreshTokenEntity.secret = AUTHENTICATION_RESULT.body.refresh_token;
testRefreshTokenEntity.credentialType = CredentialType.REFRESH_TOKEN;

describe("SilentFlowClient unit tests", () => {
    const testAccount: AccountInfo = {
        homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
        environment: "login.windows.net",
        tenantId: ID_TOKEN_CLAIMS.tid,
        username: ID_TOKEN_CLAIMS.preferred_username,
        localAccountId: ID_TOKEN_CLAIMS.oid,
        idTokenClaims: ID_TOKEN_CLAIMS,
        name: ID_TOKEN_CLAIMS.name
    };

    afterEach(() => {
        sinon.restore();
    });

    describe("Constructor", async () => {
        it("creates a SilentFlowClient", async () => {
            sinon.stub(Authority.prototype, <any>"getEndpointMetadataFromNetwork").resolves(DEFAULT_OPENID_CONFIG_RESPONSE.body);
            const config = await ClientTestUtils.createTestClientConfiguration();
            const client = new SilentFlowClient(config);
            expect(client).to.be.not.null;
            expect(client instanceof SilentFlowClient).to.be.true;
            expect(client instanceof BaseClient).to.be.true;
        });
    });

    describe("Success cases", () => {

        it("acquireCachedToken() returns correct token even if offline_access is not present in access token entity", async () => {

            const testScopes = [Constants.OPENID_SCOPE, Constants.PROFILE_SCOPE, ...TEST_CONFIG.DEFAULT_GRAPH_SCOPE];
            testAccessTokenEntity.target = testScopes.join(" ");
            sinon.stub(Authority.prototype, <any>"getEndpointMetadataFromNetwork").resolves(DEFAULT_OPENID_CONFIG_RESPONSE.body);
            sinon.stub(AuthToken, "extractTokenClaims").returns(ID_TOKEN_CLAIMS);
            sinon.stub(CacheManager.prototype, "readAccountFromCache").returns(testAccountEntity);
            sinon.stub(CacheManager.prototype, "readIdTokenFromCache").returns(testIdToken);
            sinon.stub(CacheManager.prototype, "readAccessTokenFromCache").returns(testAccessTokenEntity);
            sinon.stub(CacheManager.prototype, "readRefreshTokenFromCache").returns(testRefreshTokenEntity);

            const config = await ClientTestUtils.createTestClientConfiguration();
            const client = new SilentFlowClient(config);
            sinon.stub(TimeUtils, <any>"isTokenExpired").returns(false);

            const silentFlowRequest: CommonSilentFlowRequest = {
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                account: testAccount,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                forceRefresh: false
            };

            const response = await client.acquireCachedToken(silentFlowRequest);
            expect(response.authority).to.be.eq(`${TEST_URIS.DEFAULT_INSTANCE}${TEST_CONFIG.TENANT}/`);
            expect(response.uniqueId).to.deep.eq(ID_TOKEN_CLAIMS.oid);
            expect(response.tenantId).to.deep.eq(ID_TOKEN_CLAIMS.tid);
            expect(response.scopes).to.deep.eq(testScopes);
            expect(response.account).to.deep.eq(testAccount);
            expect(response.idToken).to.deep.eq(testIdToken.secret);
            expect(response.idTokenClaims).to.deep.eq(ID_TOKEN_CLAIMS);
            expect(response.accessToken).to.deep.eq(testAccessTokenEntity.secret);
            expect(response.state).to.be.empty;
        });

        it("acquireCachedToken() looks up Bearer token when AuthenticationScheme is not set in request", async () => {
            const testScopes = [Constants.OPENID_SCOPE, Constants.PROFILE_SCOPE, ...TEST_CONFIG.DEFAULT_GRAPH_SCOPE];
            testAccessTokenEntity.target = testScopes.join(" ");
            sinon.stub(Authority.prototype, <any>"getEndpointMetadataFromNetwork").resolves(DEFAULT_OPENID_CONFIG_RESPONSE.body);
            sinon.stub(AuthToken, "extractTokenClaims").returns(ID_TOKEN_CLAIMS);
            sinon.stub(CacheManager.prototype, "readAccountFromCache").returns(testAccountEntity);
            sinon.stub(CacheManager.prototype, "readIdTokenFromCache").returns(testIdToken);
            sinon.stub(CacheManager.prototype, "readAccessTokenFromCache").returns(testAccessTokenEntity);
            sinon.stub(CacheManager.prototype, "readRefreshTokenFromCache").returns(testRefreshTokenEntity);
            const readCacheRecordSpy = sinon.spy(CacheManager.prototype, "readCacheRecord");

            const config = await ClientTestUtils.createTestClientConfiguration();
            const client = new SilentFlowClient(config);
            sinon.stub(TimeUtils, <any>"isTokenExpired").returns(false);

            const silentFlowRequest: CommonSilentFlowRequest = {
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                account: testAccount,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                forceRefresh: false
            };

            const response = await client.acquireCachedToken(silentFlowRequest);
            expect(response.authority).to.be.eq(`${TEST_URIS.DEFAULT_INSTANCE}${TEST_CONFIG.TENANT}/`);
            expect(response.uniqueId).to.deep.eq(ID_TOKEN_CLAIMS.oid);
            expect(response.tenantId).to.deep.eq(ID_TOKEN_CLAIMS.tid);
            expect(response.scopes).to.deep.eq(testScopes);
            expect(response.account).to.deep.eq(testAccount);
            expect(response.idToken).to.deep.eq(testIdToken.secret);
            expect(response.idTokenClaims).to.deep.eq(ID_TOKEN_CLAIMS);
            expect(response.accessToken).to.deep.eq(testAccessTokenEntity.secret);
            expect(response.state).to.be.empty;
            expect(readCacheRecordSpy.calledWith(testAccount, config.authOptions.clientId, new ScopeSet(silentFlowRequest.scopes), silentFlowRequest.authority, AuthenticationScheme.BEARER));
        });

        it("acquireCachedToken() looks up Bearer token when AuthenticationScheme is set to Bearer in request", async () => {
            const testScopes = [Constants.OPENID_SCOPE, Constants.PROFILE_SCOPE, ...TEST_CONFIG.DEFAULT_GRAPH_SCOPE];
            testAccessTokenEntity.target = testScopes.join(" ");
            sinon.stub(Authority.prototype, <any>"getEndpointMetadataFromNetwork").resolves(DEFAULT_OPENID_CONFIG_RESPONSE.body);
            sinon.stub(AuthToken, "extractTokenClaims").returns(ID_TOKEN_CLAIMS);
            sinon.stub(CacheManager.prototype, "readAccountFromCache").returns(testAccountEntity);
            sinon.stub(CacheManager.prototype, "readIdTokenFromCache").returns(testIdToken);
            sinon.stub(CacheManager.prototype, "readAccessTokenFromCache").returns(testAccessTokenEntity);
            sinon.stub(CacheManager.prototype, "readRefreshTokenFromCache").returns(testRefreshTokenEntity);
            const readCacheRecordSpy = sinon.spy(CacheManager.prototype, "readCacheRecord");

            const config = await ClientTestUtils.createTestClientConfiguration();
            const client = new SilentFlowClient(config);
            sinon.stub(TimeUtils, <any>"isTokenExpired").returns(false);

            const silentFlowRequest: CommonSilentFlowRequest = {
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                account: testAccount,
                authority: TEST_CONFIG.validAuthority,
                authenticationScheme: AuthenticationScheme.BEARER,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                forceRefresh: false
            };

            const response = await client.acquireCachedToken(silentFlowRequest);
            expect(response.authority).to.be.eq(`${TEST_URIS.DEFAULT_INSTANCE}${TEST_CONFIG.TENANT}/`);
            expect(response.uniqueId).to.deep.eq(ID_TOKEN_CLAIMS.oid);
            expect(response.tenantId).to.deep.eq(ID_TOKEN_CLAIMS.tid);
            expect(response.scopes).to.deep.eq(testScopes);
            expect(response.account).to.deep.eq(testAccount);
            expect(response.idToken).to.deep.eq(testIdToken.secret);
            expect(response.idTokenClaims).to.deep.eq(ID_TOKEN_CLAIMS);
            expect(response.accessToken).to.deep.eq(testAccessTokenEntity.secret);
            expect(response.state).to.be.empty;
            expect(readCacheRecordSpy.calledWith(testAccount, config.authOptions.clientId, new ScopeSet(silentFlowRequest.scopes), silentFlowRequest.authority, AuthenticationScheme.BEARER));
        });

        it("acquireCachedToken() looks up POP token when AuthenticationScheme is set to POP in request", async () => {
            const testScopes = [Constants.OPENID_SCOPE, Constants.PROFILE_SCOPE, ...TEST_CONFIG.DEFAULT_GRAPH_SCOPE];
            testAccessTokenWithAuthSchemeEntity.target = testScopes.join(" ");
            sinon.stub(Authority.prototype, <any>"getEndpointMetadataFromNetwork").resolves(DEFAULT_OPENID_CONFIG_RESPONSE.body);
            sinon.stub(AuthToken, "extractTokenClaims").returns(ID_TOKEN_CLAIMS);
            sinon.stub(CacheManager.prototype, "readAccountFromCache").returns(testAccountEntity);
            sinon.stub(CacheManager.prototype, "readIdTokenFromCache").returns(testIdToken);
            sinon.stub(CacheManager.prototype, "readAccessTokenFromCache").returns(testAccessTokenWithAuthSchemeEntity);
            sinon.stub(CacheManager.prototype, "readRefreshTokenFromCache").returns(testRefreshTokenEntity);
            sinon.stub(PopTokenGenerator.prototype, "signPopToken").returns(Promise.resolve(TEST_TOKENS.POP_TOKEN));
            const readCacheRecordSpy = sinon.spy(CacheManager.prototype, "readCacheRecord");

            const config = await ClientTestUtils.createTestClientConfiguration();
            const client = new SilentFlowClient(config);
            sinon.stub(TimeUtils, <any>"isTokenExpired").returns(false);

            const silentFlowRequest: CommonSilentFlowRequest = {
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                account: testAccount,
                authority: TEST_CONFIG.validAuthority,
                authenticationScheme: AuthenticationScheme.BEARER,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                forceRefresh: false
            };

            const response = await client.acquireCachedToken(silentFlowRequest);
            expect(response.authority).to.be.eq(`${TEST_URIS.DEFAULT_INSTANCE}${TEST_CONFIG.TENANT}/`);
            expect(response.uniqueId).to.deep.eq(ID_TOKEN_CLAIMS.oid);
            expect(response.tenantId).to.deep.eq(ID_TOKEN_CLAIMS.tid);
            expect(response.scopes).to.deep.eq(testScopes);
            expect(response.account).to.deep.eq(testAccount);
            expect(response.idToken).to.deep.eq(testIdToken.secret);
            expect(response.idTokenClaims).to.deep.eq(ID_TOKEN_CLAIMS);
            expect(response.accessToken).to.deep.eq(testAccessTokenWithAuthSchemeEntity.secret);
            expect(response.state).to.be.empty;
            expect(readCacheRecordSpy.calledWith(testAccount, config.authOptions.clientId, new ScopeSet(silentFlowRequest.scopes), silentFlowRequest.authority, AuthenticationScheme.POP));
        });

        it("acquireCachedToken does not throw when given empty object string for claims", async () => {
            const testScopes = [Constants.OPENID_SCOPE, Constants.PROFILE_SCOPE, ...TEST_CONFIG.DEFAULT_GRAPH_SCOPE];
            testAccessTokenEntity.target = testScopes.join(" ");
            sinon.stub(Authority.prototype, <any>"getEndpointMetadataFromNetwork").resolves(DEFAULT_OPENID_CONFIG_RESPONSE.body);
            sinon.stub(AuthToken, "extractTokenClaims").returns(ID_TOKEN_CLAIMS);
            sinon.stub(CacheManager.prototype, "readAccountFromCache").returns(testAccountEntity);
            sinon.stub(CacheManager.prototype, "readIdTokenFromCache").returns(testIdToken);
            sinon.stub(CacheManager.prototype, "readAccessTokenFromCache").returns(testAccessTokenEntity);
            sinon.stub(CacheManager.prototype, "readRefreshTokenFromCache").returns(testRefreshTokenEntity);
            const config = await ClientTestUtils.createTestClientConfiguration();
            const client = new SilentFlowClient(config);
            sinon.stub(TimeUtils, <any>"isTokenExpired").returns(false);

            const silentFlowRequest: CommonSilentFlowRequest = {
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                account: testAccount,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                forceRefresh: false,
                claims: "{}"
            };

            const response = await client.acquireCachedToken(silentFlowRequest);
            expect(response.authority).to.be.eq(`${TEST_URIS.DEFAULT_INSTANCE}${TEST_CONFIG.TENANT}/`);
            expect(response.uniqueId).to.deep.eq(ID_TOKEN_CLAIMS.oid);
            expect(response.tenantId).to.deep.eq(ID_TOKEN_CLAIMS.tid);
            expect(response.scopes).to.deep.eq(testScopes);
            expect(response.account).to.deep.eq(testAccount);
            expect(response.idToken).to.deep.eq(testIdToken.secret);
            expect(response.idTokenClaims).to.deep.eq(ID_TOKEN_CLAIMS);
            expect(response.accessToken).to.deep.eq(testAccessTokenEntity.secret);
            expect(response.state).to.be.empty;
        });
    });

    describe("Error cases", () => {

        it("Throws error if account is not included in request object", async () => {
            sinon.stub(Authority.prototype, <any>"getEndpointMetadataFromNetwork").resolves(DEFAULT_OPENID_CONFIG_RESPONSE.body);
            const config = await ClientTestUtils.createTestClientConfiguration();
            const client = new SilentFlowClient(config);
            await expect(client.acquireToken({
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                account: null,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                forceRefresh: false
            })).to.be.rejectedWith(ClientAuthErrorMessage.NoAccountInSilentRequest.desc);
            await expect(client.acquireCachedToken({
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                account: null,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                forceRefresh: false
            })).to.be.rejectedWith(ClientAuthErrorMessage.NoAccountInSilentRequest.desc);
        }); 

        it("Throws error if request object is null or undefined", async () => {
            sinon.stub(Authority.prototype, <any>"getEndpointMetadataFromNetwork").resolves(DEFAULT_OPENID_CONFIG_RESPONSE.body);
            const config = await ClientTestUtils.createTestClientConfiguration();
            const client = new SilentFlowClient(config);
            await expect(client.acquireToken(null)).to.be.rejectedWith(ClientConfigurationErrorMessage.tokenRequestEmptyError.desc);
            await expect(client.acquireToken(undefined)).to.be.rejectedWith(ClientConfigurationErrorMessage.tokenRequestEmptyError.desc);
            await expect(client.acquireCachedToken(null)).to.be.rejectedWith(ClientConfigurationErrorMessage.tokenRequestEmptyError.desc);
            await expect(client.acquireCachedToken(undefined)).to.be.rejectedWith(ClientConfigurationErrorMessage.tokenRequestEmptyError.desc);
        });

        it("Throws error if scopes are not included in request object", async () => {
            sinon.stub(Authority.prototype, <any>"getEndpointMetadataFromNetwork").resolves(DEFAULT_OPENID_CONFIG_RESPONSE.body);
            const config = await ClientTestUtils.createTestClientConfiguration();
            const client = new SilentFlowClient(config);
            await expect(client.acquireToken({
                scopes: null,
                account: testAccount,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                forceRefresh: false
            })).to.be.rejectedWith(ClientConfigurationErrorMessage.emptyScopesError.desc);
        });

        it("Throws error if scopes are empty in request object", async () => {
            const tokenRequest: CommonSilentFlowRequest = {
                scopes: [],
                account: testAccount,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                forceRefresh: false
            };
            sinon.stub(Authority.prototype, <any>"getEndpointMetadataFromNetwork").resolves(DEFAULT_OPENID_CONFIG_RESPONSE.body);
            const config = await ClientTestUtils.createTestClientConfiguration();
            const client = new SilentFlowClient(config);
            await expect(client.acquireToken(tokenRequest)).to.be.rejectedWith(ClientConfigurationErrorMessage.emptyScopesError.desc);
        });

        it("Throws error if it does not find token in cache", async () => {
            const testScope2 = "scope2";
            const testAccountEntity: AccountEntity = new AccountEntity();
            testAccountEntity.homeAccountId = TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID;
            testAccountEntity.localAccountId = "testId";
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
            const client = new SilentFlowClient(config);
            await expect(client.acquireToken(tokenRequest)).to.be.rejectedWith(ClientAuthErrorMessage.noTokensFoundError.desc);
        });

        it("acquireCachedToken throws refresh requiredError if forceRefresh set to true", async () => {
            sinon.stub(Authority.prototype, <any>"getEndpointMetadataFromNetwork").resolves(DEFAULT_OPENID_CONFIG_RESPONSE.body);
            sinon.stub(AuthToken, "extractTokenClaims").returns(ID_TOKEN_CLAIMS);
            sinon.stub(CacheManager.prototype, "readAccountFromCache").returns(testAccountEntity);
            sinon.stub(CacheManager.prototype, "readIdTokenFromCache").returns(testIdToken);
            sinon.stub(CacheManager.prototype, "readAccessTokenFromCache").returns(testAccessTokenEntity);
            sinon.stub(CacheManager.prototype, "readRefreshTokenFromCache").returns(testRefreshTokenEntity);

            const config = await ClientTestUtils.createTestClientConfiguration();
            const client = new SilentFlowClient(config);
            sinon.stub(TimeUtils, <any>"isTokenExpired").returns(false);

            const silentFlowRequest: CommonSilentFlowRequest = {
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                account: testAccount,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                forceRefresh: true
            };

            await expect(client.acquireCachedToken(silentFlowRequest)).to.be.rejectedWith(ClientAuthErrorMessage.tokenRefreshRequired.desc);
        });

        it("acquireCachedToken throws refresh requiredError if claims included on request", async () => {
            sinon.stub(Authority.prototype, <any>"getEndpointMetadataFromNetwork").resolves(DEFAULT_OPENID_CONFIG_RESPONSE.body);
            sinon.stub(AuthToken, "extractTokenClaims").returns(ID_TOKEN_CLAIMS);
            sinon.stub(CacheManager.prototype, "readAccountFromCache").returns(testAccountEntity);
            sinon.stub(CacheManager.prototype, "readIdTokenFromCache").returns(testIdToken);
            sinon.stub(CacheManager.prototype, "readAccessTokenFromCache").returns(testAccessTokenEntity);
            sinon.stub(CacheManager.prototype, "readRefreshTokenFromCache").returns(testRefreshTokenEntity);
            const config = await ClientTestUtils.createTestClientConfiguration();
            const client = new SilentFlowClient(config);
            sinon.stub(TimeUtils, <any>"isTokenExpired").returns(false);

            const silentFlowRequest: CommonSilentFlowRequest = {
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                account: testAccount,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                forceRefresh: false,
                claims: TEST_CONFIG.CLAIMS
            };

            await expect(client.acquireCachedToken(silentFlowRequest)).to.be.rejectedWith(ClientAuthErrorMessage.tokenRefreshRequired.desc);
        });

        it("acquireCachedToken throws refresh requiredError if access token is expired", async () => {
            sinon.stub(Authority.prototype, <any>"getEndpointMetadataFromNetwork").resolves(DEFAULT_OPENID_CONFIG_RESPONSE.body);
            sinon.stub(AuthToken, "extractTokenClaims").returns(ID_TOKEN_CLAIMS);
            sinon.stub(CacheManager.prototype, "readAccountFromCache").returns(testAccountEntity);
            sinon.stub(CacheManager.prototype, "readIdTokenFromCache").returns(testIdToken);
            sinon.stub(CacheManager.prototype, "readAccessTokenFromCache").returns(testAccessTokenEntity);
            sinon.stub(CacheManager.prototype, "readRefreshTokenFromCache").returns(testRefreshTokenEntity);
            const config = await ClientTestUtils.createTestClientConfiguration();
            const client = new SilentFlowClient(config);
            sinon.stub(TimeUtils, <any>"isTokenExpired").returns(true);

            const silentFlowRequest: CommonSilentFlowRequest = {
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                account: testAccount,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                forceRefresh: false
            };

            await expect(client.acquireCachedToken(silentFlowRequest)).to.be.rejectedWith(ClientAuthErrorMessage.tokenRefreshRequired.desc);
        });

        it("acquireCachedToken throws refresh requiredError if no access token is cached", async () => {
            sinon.stub(Authority.prototype, <any>"getEndpointMetadataFromNetwork").resolves(DEFAULT_OPENID_CONFIG_RESPONSE.body);
            sinon.stub(AuthToken, "extractTokenClaims").returns(ID_TOKEN_CLAIMS);
            sinon.stub(CacheManager.prototype, "readAccountFromCache").returns(testAccountEntity);
            sinon.stub(CacheManager.prototype, "readIdTokenFromCache").returns(testIdToken);
            sinon.stub(CacheManager.prototype, "readAccessTokenFromCache").returns(null);
            sinon.stub(CacheManager.prototype, "readRefreshTokenFromCache").returns(testRefreshTokenEntity);
            const config = await ClientTestUtils.createTestClientConfiguration();
            const client = new SilentFlowClient(config);
            sinon.stub(TimeUtils, <any>"isTokenExpired").returns(false);

            const silentFlowRequest: CommonSilentFlowRequest = {
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                account: testAccount,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                forceRefresh: false
            };

            await expect(client.acquireCachedToken(silentFlowRequest)).to.be.rejectedWith(ClientAuthErrorMessage.tokenRefreshRequired.desc);
        });
    });

    describe("acquireToken tests", () => {
        let config: ClientConfiguration;
        let client: SilentFlowClient;
        const testAccount: AccountInfo = {
            homeAccountId: `${TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID}`,
            tenantId: ID_TOKEN_CLAIMS.tid,
            environment: "login.windows.net",
            username: ID_TOKEN_CLAIMS.preferred_username,
            name: ID_TOKEN_CLAIMS.name,
            localAccountId: ID_TOKEN_CLAIMS.oid,
            idTokenClaims: ID_TOKEN_CLAIMS
        };

        beforeEach(async () => {
            sinon.stub(Authority.prototype, <any>"getEndpointMetadataFromNetwork").resolves(DEFAULT_OPENID_CONFIG_RESPONSE.body);
            AUTHENTICATION_RESULT.body.client_info = TEST_DATA_CLIENT_INFO.TEST_DECODED_CLIENT_INFO;
            sinon.stub(RefreshTokenClient.prototype, <any>"executePostToTokenEndpoint").resolves(AUTHENTICATION_RESULT);
            sinon.stub(AuthToken, "extractTokenClaims").returns(ID_TOKEN_CLAIMS);
            sinon.stub(CacheManager.prototype, "readAccountFromCache").returns(testAccountEntity);
            sinon.stub(CacheManager.prototype, "readIdTokenFromCache").returns(testIdToken);
            sinon.stub(CacheManager.prototype, "readAccessTokenFromCache").returns(testAccessTokenEntity);
            sinon.stub(CacheManager.prototype, "readRefreshTokenFromCache").returns(testRefreshTokenEntity);

            config = await ClientTestUtils.createTestClientConfiguration();
            client = new SilentFlowClient(config);
        });

        afterEach(() => {
            sinon.restore();
        });

        it("acquireToken returns token from cache", async () => {
            const silentFlowRequest: CommonSilentFlowRequest = {
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                account: testAccount,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                forceRefresh: false
            };

            sinon.stub(TimeUtils, <any>"isTokenExpired").returns(false);
            const refreshTokenSpy = sinon.stub(RefreshTokenClient.prototype, "acquireToken");

            const authResult = await client.acquireToken(silentFlowRequest);
            expect(refreshTokenSpy.called).to.be.false;
            const expectedScopes = [Constants.OPENID_SCOPE, Constants.PROFILE_SCOPE, TEST_CONFIG.DEFAULT_GRAPH_SCOPE[0]];
            expect(authResult.uniqueId).to.deep.eq(ID_TOKEN_CLAIMS.oid);
            expect(authResult.tenantId).to.deep.eq(ID_TOKEN_CLAIMS.tid);
            expect(authResult.scopes).to.deep.eq(expectedScopes);
            expect(authResult.account).to.deep.eq(testAccount);
            expect(authResult.idToken).to.deep.eq(testIdToken.secret);
            expect(authResult.idTokenClaims).to.deep.eq(ID_TOKEN_CLAIMS);
            expect(authResult.accessToken).to.deep.eq(testAccessTokenEntity.secret);
            expect(authResult.state).to.be.empty;
        });

        it("acquireToken calls refreshToken if refresh is required", async () => {
            const silentFlowRequest: CommonSilentFlowRequest = {
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                account: testAccount,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                forceRefresh: false
            };

            const expectedRefreshRequest: RefreshTokenRequest = {
                ...silentFlowRequest,
                refreshToken: testRefreshTokenEntity.secret,
                authenticationScheme: TEST_CONFIG.TOKEN_TYPE_BEARER as AuthenticationScheme
            };

            sinon.stub(TimeUtils, <any>"isTokenExpired").returns(true);
            const refreshTokenClientSpy = sinon.stub(RefreshTokenClient.prototype, "acquireToken");

            await client.acquireToken(silentFlowRequest);
            expect(refreshTokenClientSpy.called).to.be.true;
            expect(refreshTokenClientSpy.calledWith(expectedRefreshRequest)).to.be.true;
        });

        it("acquireCachedToken returns cached token", async () => {
            config.serverTelemetryManager = new ServerTelemetryManager({
                clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                apiId: 862,
                correlationId: "test-correlation-id"
            }, null);
            client = new SilentFlowClient(config);
            const telemetryCacheHitSpy = sinon.stub(ServerTelemetryManager.prototype, "incrementCacheHits").returns(1);
            sinon.stub(TimeUtils, <any>"isTokenExpired").returns(false);

            const silentFlowRequest: CommonSilentFlowRequest = {
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                account: testAccount,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                forceRefresh: false
            };
            
            const authResult: AuthenticationResult = await client.acquireCachedToken(silentFlowRequest);
            const expectedScopes = [Constants.OPENID_SCOPE, Constants.PROFILE_SCOPE, TEST_CONFIG.DEFAULT_GRAPH_SCOPE[0]];
            expect(telemetryCacheHitSpy.calledOnce).to.be.true;
            expect(authResult.uniqueId).to.deep.eq(ID_TOKEN_CLAIMS.oid);
            expect(authResult.tenantId).to.deep.eq(ID_TOKEN_CLAIMS.tid);
            expect(authResult.scopes).to.deep.eq(expectedScopes);
            expect(authResult.account).to.deep.eq(testAccount);
            expect(authResult.idToken).to.deep.eq(testIdToken.secret);
            expect(authResult.idTokenClaims).to.deep.eq(ID_TOKEN_CLAIMS);
            expect(authResult.accessToken).to.deep.eq(testAccessTokenEntity.secret);
            expect(authResult.state).to.be.empty;
        });

        it("acquireCachedToken throws refresh requiredError if access token is expired", async () => {
            const client = new SilentFlowClient(config);
            sinon.stub(TimeUtils, "isTokenExpired").returns(true);

            const silentFlowRequest: CommonSilentFlowRequest = {
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                account: testAccount,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                forceRefresh: false
            };
            
            await expect(client.acquireCachedToken(silentFlowRequest)).to.be.rejectedWith(ClientAuthErrorMessage.tokenRefreshRequired.desc);
        });

        it("refreshes token if refreshOn time has passed", async () => {
            sinon.restore();
            sinon.stub(Authority.prototype, <any>"getEndpointMetadataFromNetwork").resolves(DEFAULT_OPENID_CONFIG_RESPONSE.body);
            AUTHENTICATION_RESULT.body.client_info = TEST_DATA_CLIENT_INFO.TEST_DECODED_CLIENT_INFO;
            sinon.stub(RefreshTokenClient.prototype, <any>"executePostToTokenEndpoint").resolves(AUTHENTICATION_RESULT);
            sinon.stub(AuthToken, "extractTokenClaims").returns(ID_TOKEN_CLAIMS);
            testAccessTokenEntity.refreshOn = `${Number(testAccessTokenEntity.cachedAt) - 1}`;
            testAccessTokenEntity.expiresOn = `${Number(testAccessTokenEntity.cachedAt) + AUTHENTICATION_RESULT.body.expires_in}`;
            sinon.stub(CacheManager.prototype, "readAccountFromCache").returns(testAccountEntity);
            sinon.stub(CacheManager.prototype, "readIdTokenFromCache").returns(testIdToken);
            sinon.stub(CacheManager.prototype, "readAccessTokenFromCache").returns(testAccessTokenEntity);
            sinon.stub(CacheManager.prototype, "readRefreshTokenFromCache").returns(testRefreshTokenEntity);
            
            const silentFlowRequest: CommonSilentFlowRequest = {
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                account: testAccount,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                forceRefresh: false
            };

            const expectedRefreshRequest: RefreshTokenRequest = {
                ...silentFlowRequest,
                refreshToken: testRefreshTokenEntity.secret,
                authenticationScheme: TEST_CONFIG.TOKEN_TYPE_BEARER as AuthenticationScheme
            };

            const refreshTokenSpy = sinon.stub(RefreshTokenClient.prototype, "acquireToken");

            await client.acquireToken(silentFlowRequest);
            expect(refreshTokenSpy.called).to.be.true;
            expect(refreshTokenSpy.calledWith(expectedRefreshRequest)).to.be.true;
        });
    });
});
