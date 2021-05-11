/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { expect } from "chai";
import sinon from "sinon";
import {
    AUTHENTICATION_RESULT_DEFAULT_SCOPES,
    DEFAULT_OPENID_CONFIG_RESPONSE,
    TEST_CONFIG,
    TEST_TOKENS,
    TEST_DATA_CLIENT_INFO,
    TEST_URIS,
    CORS_SIMPLE_REQUEST_HEADERS
} from "../test_kit/StringConstants";
import { BaseClient } from "../../src/client/BaseClient";
import { AADServerParamKeys, GrantType, Constants, AuthenticationScheme, ThrottlingConstants } from "../../src/utils/Constants";
import { ClientTestUtils, mockCrypto } from "./ClientTestUtils";
import { Authority } from "../../src/authority/Authority";
import { OnBehalfOfClient } from "../../src/client/OnBehalfOfClient";
import { CommonOnBehalfOfRequest } from "../../src/request/CommonOnBehalfOfRequest";
import { AuthToken } from "../../src/account/AuthToken";
import { TimeUtils } from "../../src/utils/TimeUtils";
import { AccountEntity } from "../../src/cache/entities/AccountEntity";
import { IdTokenEntity } from "../../src/cache/entities/IdTokenEntity";
import { AccessTokenEntity } from "../../src/cache/entities/AccessTokenEntity";
import { ScopeSet } from "../../src/request/ScopeSet";
import { CredentialCache } from "../../src/cache/utils/CacheTypes";
import { CacheManager } from "../../src/cache/CacheManager";
import { ClientAuthErrorMessage } from "../../src/error/ClientAuthError";
import { ClientConfiguration } from "../../src";

describe("OnBehalfOf unit tests", () => {
    let config: ClientConfiguration;

    beforeEach(async () => {
        sinon.stub(Authority.prototype, <any>"getEndpointMetadataFromNetwork").resolves(DEFAULT_OPENID_CONFIG_RESPONSE.body);
        config = await ClientTestUtils.createTestClientConfiguration();
        // Set up required objects and mocked return values
        const decodedLibState = "{ \"id\": \"testid\", \"ts\": 1592846482 }";
        config.cryptoInterface.base64Decode = (input: string): string => {
            switch (input) {
                case TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO:
                    return TEST_DATA_CLIENT_INFO.TEST_DECODED_CLIENT_INFO;
                case "eyAiaWQiOiAidGVzdGlkIiwgInRzIjogMTU5Mjg0NjQ4MiB9":
                    return decodedLibState;
                default:
                    return input;
            }
        };

        config.cryptoInterface.base64Encode = (input: string): string => {
            switch (input) {
                case "123-test-uid":
                    return "MTIzLXRlc3QtdWlk";
                case "456-test-utid":
                    return "NDU2LXRlc3QtdXRpZA==";
                case TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO:
                    return TEST_DATA_CLIENT_INFO.TEST_DECODED_CLIENT_INFO;
                default:
                    return input;
            }
        };

        // Set up stubs
        const idTokenClaims = {
            ver: "2.0",
            iss: `${TEST_URIS.DEFAULT_INSTANCE}9188040d-6c67-4c5b-b112-36a304b66dad/v2.0`,
            sub: "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
            exp: 1536361411,
            name: "Abe Lincoln",
            preferred_username: "AbeLi@microsoft.com",
            oid: "00000000-0000-0000-66f3-3332eca7ea81",
            tid: "3338040d-6c67-4c5b-b112-36a304b66dad",
            nonce: "123523",
        };
        sinon.stub(AuthToken, "extractTokenClaims").returns(idTokenClaims);
    });

    afterEach(() => {
        sinon.restore();
    });

    describe("Constructor", async () => {

        it("creates a OnBehalfOf", async () => {
            const client = new OnBehalfOfClient(config);
            expect(client).to.be.not.null;
            expect(client instanceof OnBehalfOfClient).to.be.true;
            expect(client instanceof BaseClient).to.be.true;
        });
    });

    it("Does not add headers that do not qualify for a simple request", (done) => {
        // For more information about this test see: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
        sinon.stub(OnBehalfOfClient.prototype, <any>"getCachedAuthenticationResult").resolves(null);
        sinon.stub(OnBehalfOfClient.prototype, <any>"executePostToTokenEndpoint").callsFake((tokenEndpoint: string, queryString: string, headers: Record<string, string>) => {
            const headerNames = Object.keys(headers);
            headerNames.forEach((name) => {
                expect(CORS_SIMPLE_REQUEST_HEADERS).contains(name.toLowerCase());
            });

            done();
            return AUTHENTICATION_RESULT_DEFAULT_SCOPES;
        });
        
        const client = new OnBehalfOfClient(config);
        const onBehalfOfRequest: CommonOnBehalfOfRequest = {
            scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
            oboAssertion: TEST_TOKENS.ACCESS_TOKEN,
            skipCache: false
        };

        client.acquireToken(onBehalfOfRequest);
    });

    it("acquires a token, no token in the cache", async () => {

        sinon.stub(OnBehalfOfClient.prototype, <any>"getCachedAuthenticationResult").resolves(null);
        sinon.stub(OnBehalfOfClient.prototype, <any>"executePostToTokenEndpoint").resolves(AUTHENTICATION_RESULT_DEFAULT_SCOPES);

        const createTokenRequestBodySpy = sinon.spy(OnBehalfOfClient.prototype, <any>"createTokenRequestBody");

        const client = new OnBehalfOfClient(config);
        const onBehalfOfRequest: CommonOnBehalfOfRequest = {
            scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
            oboAssertion: TEST_TOKENS.ACCESS_TOKEN,
            skipCache: false
        };

        const authResult = await client.acquireToken(onBehalfOfRequest);
        const expectedScopes = [Constants.OPENID_SCOPE, Constants.PROFILE_SCOPE, Constants.OFFLINE_ACCESS_SCOPE, TEST_CONFIG.DEFAULT_GRAPH_SCOPE[0]];
        expect(authResult.scopes).to.deep.eq(expectedScopes);
        expect(authResult.idToken).to.deep.eq(AUTHENTICATION_RESULT_DEFAULT_SCOPES.body.id_token);
        expect(authResult.accessToken).to.deep.eq(AUTHENTICATION_RESULT_DEFAULT_SCOPES.body.access_token);
        expect(authResult.state).to.be.empty;

        expect(createTokenRequestBodySpy.calledWith(onBehalfOfRequest)).to.be.true;

        expect(createTokenRequestBodySpy.returnValues[0]).to.contain(`${TEST_CONFIG.DEFAULT_GRAPH_SCOPE[0]}`);
        expect(createTokenRequestBodySpy.returnValues[0]).to.contain(`${AADServerParamKeys.CLIENT_ID}=${encodeURIComponent(TEST_CONFIG.MSAL_CLIENT_ID)}`);
        expect(createTokenRequestBodySpy.returnValues[0]).to.contain(`${AADServerParamKeys.GRANT_TYPE}=${encodeURIComponent(GrantType.JWT_BEARER)}`);
        expect(createTokenRequestBodySpy.returnValues[0]).to.contain(`${AADServerParamKeys.CLIENT_SECRET}=${TEST_CONFIG.MSAL_CLIENT_SECRET}`);
        expect(createTokenRequestBodySpy.returnValues[0]).to.contain(`${AADServerParamKeys.REQUESTED_TOKEN_USE}=${AADServerParamKeys.ON_BEHALF_OF}`);
        expect(createTokenRequestBodySpy.returnValues[0]).to.contain(`${AADServerParamKeys.OBO_ASSERTION}=${TEST_TOKENS.ACCESS_TOKEN}`);
        expect(createTokenRequestBodySpy.returnValues[0]).to.contain(`${AADServerParamKeys.X_CLIENT_SKU}=${Constants.SKU}`);
        expect(createTokenRequestBodySpy.returnValues[0]).to.contain(`${AADServerParamKeys.X_CLIENT_VER}=${TEST_CONFIG.TEST_VERSION}`);
        expect(createTokenRequestBodySpy.returnValues[0]).to.contain(`${AADServerParamKeys.X_CLIENT_OS}=${TEST_CONFIG.TEST_OS}`);
        expect(createTokenRequestBodySpy.returnValues[0]).to.contain(`${AADServerParamKeys.X_CLIENT_CPU}=${TEST_CONFIG.TEST_CPU}`);
        expect(createTokenRequestBodySpy.returnValues[0]).to.contain(`${AADServerParamKeys.X_MS_LIB_CAPABILITY}=${ThrottlingConstants.X_MS_LIB_CAPABILITY_VALUE}`);
    });

    it("acquires a token, returns token from cache", async () => {

        // mock access token
        const expectedAtEntity: AccessTokenEntity = AccessTokenEntity.createAccessTokenEntity(
            "", "login.windows.net", "an_access_token", config.authOptions.clientId, TEST_CONFIG.TENANT, TEST_CONFIG.DEFAULT_GRAPH_SCOPE.toString(), 4600, 4600, mockCrypto, undefined, AuthenticationScheme.BEARER, TEST_TOKENS.ACCESS_TOKEN);

        sinon.stub(OnBehalfOfClient.prototype, <any>"readAccessTokenFromCache").returns(expectedAtEntity);
        sinon.stub(TimeUtils, <any>"isTokenExpired").returns(false);

        // mock id token
        const expectedIdTokenEntity: IdTokenEntity = IdTokenEntity.createIdTokenEntity(
            "", "login.windows.net", TEST_TOKENS.IDTOKEN_V2, config.authOptions.clientId, TEST_CONFIG.TENANT, TEST_TOKENS.ACCESS_TOKEN
        );
        sinon.stub(OnBehalfOfClient.prototype, <any>"readIdTokenFromCache").returns(expectedIdTokenEntity);

        // mock account
        const idToken: AuthToken = new AuthToken(TEST_TOKENS.IDTOKEN_V2, config.cryptoInterface);
        const expectedAccountEntity: AccountEntity = AccountEntity.createAccount(TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO, "123-test-uid.456-test-uid", config.authOptions.authority, idToken, config.cryptoInterface, TEST_TOKENS.ACCESS_TOKEN);

        sinon.stub(OnBehalfOfClient.prototype, <any>"readAccountFromCache").returns(expectedAccountEntity);

        const client = new OnBehalfOfClient(config);
        const onBehalfOfRequest: CommonOnBehalfOfRequest = {
            scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
            oboAssertion: TEST_TOKENS.ACCESS_TOKEN
        };

        const authResult = await client.acquireToken(onBehalfOfRequest);
        expect(authResult.scopes).to.deep.eq(ScopeSet.fromString(expectedAtEntity.target).asArray());
        expect(authResult.idToken).to.deep.eq(TEST_TOKENS.IDTOKEN_V2);
        expect(authResult.accessToken).to.deep.eq(expectedAtEntity.secret);
        expect(authResult.state).to.be.empty;
        expect(authResult.fromCache).to.be.true;
        expect(authResult.uniqueId).to.eq(idToken.claims.oid);
        expect(authResult.tenantId).to.eq(idToken.claims.tid);
        expect(authResult.account.homeAccountId).to.eq(expectedAccountEntity.homeAccountId);
        expect(authResult.account.environment).to.eq(expectedAccountEntity.environment);
        expect(authResult.account.tenantId).to.eq(expectedAccountEntity.realm);
    });

    it("acquires a token, skipCache=true", async () => {

        sinon.stub(OnBehalfOfClient.prototype, <any>"executePostToTokenEndpoint").resolves(AUTHENTICATION_RESULT_DEFAULT_SCOPES);

        const createTokenRequestBodySpy = sinon.spy(OnBehalfOfClient.prototype, <any>"createTokenRequestBody");

        const client = new OnBehalfOfClient(config);
        const onBehalfOfRequest: CommonOnBehalfOfRequest = {
            scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
            oboAssertion: TEST_TOKENS.ACCESS_TOKEN,
            skipCache: true
        };

        const authResult = await client.acquireToken(onBehalfOfRequest);
        const expectedScopes = [Constants.OPENID_SCOPE, Constants.PROFILE_SCOPE, Constants.OFFLINE_ACCESS_SCOPE, TEST_CONFIG.DEFAULT_GRAPH_SCOPE[0]];
        expect(authResult.scopes).to.deep.eq(expectedScopes);
        expect(authResult.idToken).to.deep.eq(AUTHENTICATION_RESULT_DEFAULT_SCOPES.body.id_token);
        expect(authResult.accessToken).to.deep.eq(AUTHENTICATION_RESULT_DEFAULT_SCOPES.body.access_token);
        expect(authResult.state).to.be.empty;

        expect(createTokenRequestBodySpy.calledWith(onBehalfOfRequest)).to.be.true;

        expect(createTokenRequestBodySpy.returnValues[0]).to.contain(`${TEST_CONFIG.DEFAULT_GRAPH_SCOPE[0]}`);
        expect(createTokenRequestBodySpy.returnValues[0]).to.contain(`${AADServerParamKeys.CLIENT_ID}=${encodeURIComponent(TEST_CONFIG.MSAL_CLIENT_ID)}`);
        expect(createTokenRequestBodySpy.returnValues[0]).to.contain(`${AADServerParamKeys.GRANT_TYPE}=${encodeURIComponent(GrantType.JWT_BEARER)}`);
        expect(createTokenRequestBodySpy.returnValues[0]).to.contain(`${AADServerParamKeys.CLIENT_SECRET}=${TEST_CONFIG.MSAL_CLIENT_SECRET}`);
        expect(createTokenRequestBodySpy.returnValues[0]).to.contain(`${AADServerParamKeys.REQUESTED_TOKEN_USE}=${AADServerParamKeys.ON_BEHALF_OF}`);
        expect(createTokenRequestBodySpy.returnValues[0]).to.contain(`${AADServerParamKeys.OBO_ASSERTION}=${TEST_TOKENS.ACCESS_TOKEN}`);
    });

    it("Multiple access tokens matched, exception thrown", async () => {
        const mockedAtEntity: AccessTokenEntity = AccessTokenEntity.createAccessTokenEntity(
            "", "login.microsoftonline.com", "an_access_token", config.authOptions.clientId, TEST_CONFIG.TENANT, TEST_CONFIG.DEFAULT_GRAPH_SCOPE.toString(), 4600, 4600, mockCrypto, undefined, AuthenticationScheme.BEARER, TEST_TOKENS.ACCESS_TOKEN);

        const mockedAtEntity2: AccessTokenEntity = AccessTokenEntity.createAccessTokenEntity(
            "", "login.microsoftonline.com", "an_access_token", config.authOptions.clientId, TEST_CONFIG.TENANT, TEST_CONFIG.DEFAULT_GRAPH_SCOPE.toString(), 4600, 4600, mockCrypto, undefined, AuthenticationScheme.BEARER, TEST_TOKENS.ACCESS_TOKEN);

        const mockedCredentialCache: CredentialCache = {
            accessTokens: {
                "key1": mockedAtEntity,
                "key2": mockedAtEntity2
            },
            refreshTokens: null,
            idTokens: null
        };

        sinon.stub(CacheManager.prototype, <any>"getCredentialsFilteredBy").returns(mockedCredentialCache);

        const client = new OnBehalfOfClient(config);
        const onBehalfOfRequest: CommonOnBehalfOfRequest = {
            scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
            oboAssertion: TEST_TOKENS.ACCESS_TOKEN
        };

        await expect(client.acquireToken(onBehalfOfRequest)).to.be.rejectedWith(`${ClientAuthErrorMessage.multipleMatchingTokens.desc}`);
    });
});
