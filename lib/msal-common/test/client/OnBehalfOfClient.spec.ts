/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import sinon from "sinon";
import {
    TEST_CONFIG,
    TEST_DATA_CLIENT_INFO,
    TEST_URIS,
    ID_TOKEN_CLAIMS,
    DEFAULT_OPENID_CONFIG_RESPONSE,
    TEST_TOKENS
} from "../test_kit/StringConstants";
import { BaseClient } from "../../src/client/BaseClient";
import { ClientTestUtils } from "./ClientTestUtils";
import { OnBehalfOfClient } from "../../src/client/OnBehalfOfClient";
import { CommonOnBehalfOfRequest } from "../../src/request/CommonOnBehalfOfRequest";
import { AuthToken } from "../../src/account/AuthToken";
import { TimeUtils } from "../../src/utils/TimeUtils";
import { Authority } from "../../src/authority/Authority";
import { ClientConfiguration } from "../../src/config/ClientConfiguration";
import { AuthenticationResult, IdTokenEntity } from "../../src";
import { AccessTokenEntity } from "../../src/cache/entities/AccessTokenEntity";
import { AccountEntity } from "../../src/cache/entities/AccountEntity";
import { AuthenticationScheme, CredentialType } from "../../src/utils/Constants";
import { CacheManager } from "../../src/cache/CacheManager";
import { ScopeSet } from "../../src/request/ScopeSet";

const testAccountEntity: AccountEntity = new AccountEntity();
testAccountEntity.homeAccountId = `${TEST_DATA_CLIENT_INFO.TEST_ENCODED_HOME_ACCOUNT_ID}`;
testAccountEntity.localAccountId = ID_TOKEN_CLAIMS.oid;
testAccountEntity.environment = "login.windows.net";
testAccountEntity.realm = ID_TOKEN_CLAIMS.tid;
testAccountEntity.username = ID_TOKEN_CLAIMS.preferred_username;
testAccountEntity.name = ID_TOKEN_CLAIMS.name;
testAccountEntity.authorityType = "MSSTS";

const testAccessTokenEntity: AccessTokenEntity = new AccessTokenEntity();
testAccessTokenEntity.homeAccountId = "home_account_id";
testAccessTokenEntity.clientId = "client_id";
testAccessTokenEntity.environment = "env";
testAccessTokenEntity.realm = "this_is_tid";
testAccessTokenEntity.secret = "access_token"
testAccessTokenEntity.target = TEST_CONFIG.DEFAULT_SCOPES.join(" ") + " " + TEST_CONFIG.DEFAULT_GRAPH_SCOPE.join(" ");
testAccessTokenEntity.credentialType = CredentialType.ACCESS_TOKEN;
testAccessTokenEntity.cachedAt = `${TimeUtils.nowSeconds()}`;
testAccessTokenEntity.tokenType = AuthenticationScheme.BEARER;
testAccessTokenEntity.userAssertionHash = "user_assertion_hash";

const testIdToken: IdTokenEntity = new IdTokenEntity();
testIdToken.homeAccountId = "home_account_id";
testIdToken.clientId = "client_id_for_id_token";
testIdToken.environment = "env_id_token";
testIdToken.realm = "this_is_tid_id_token";
testIdToken.secret = "id_token";
testIdToken.credentialType = CredentialType.ID_TOKEN;

describe("OnBehalfOf unit tests", () => {
    let config: ClientConfiguration;

    beforeEach(async () => {
        sinon.stub(Authority.prototype, <any>"getEndpointMetadataFromNetwork").resolves(DEFAULT_OPENID_CONFIG_RESPONSE.body);
        config = await ClientTestUtils.createTestClientConfiguration();
        // Set up required objects and mocked return values
        const decodedLibState = "{ \"id\": \"testid\", \"ts\": 1592846482 }";
        config.cryptoInterface!.base64Decode = (input: string): string => {
            switch (input) {
                case TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO:
                    return TEST_DATA_CLIENT_INFO.TEST_DECODED_CLIENT_INFO;
                case "eyAiaWQiOiAidGVzdGlkIiwgInRzIjogMTU5Mjg0NjQ4MiB9":
                    return decodedLibState;
                default:
                    return input;
            }
        };

        config.cryptoInterface!.base64Encode = (input: string): string => {
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

    describe("Constructor", () => {

        it("creates a OnBehalfOf", async () => {
            const client = new OnBehalfOfClient(config);
            expect(client).not.toBeNull();
            expect(client instanceof OnBehalfOfClient).toBe(true);
            expect(client instanceof BaseClient).toBe(true);
        });
    });

    describe("OnBehalfOfClient.ts Class Unit Tests", () => {

        afterEach(() => {
            sinon.restore();
        });

        it("acquireToken returns token from cache", async () => {

            const oboRequest: CommonOnBehalfOfRequest = {
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                oboAssertion: "user_assertion_hash",
                skipCache: false
            };

            const mockIdTokenCached = sinon.stub(OnBehalfOfClient.prototype, <any>"readIdTokenFromCacheForOBO").returns(testIdToken);
            const config = await ClientTestUtils.createTestClientConfiguration();
            const client = new OnBehalfOfClient(config);
            const idToken: AuthToken = new AuthToken(TEST_TOKENS.IDTOKEN_V2, config.cryptoInterface!);
            const expectedAccountEntity: AccountEntity = AccountEntity.createAccount(TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO, "123-test-uid.456-test-uid", idToken, config.authOptions.authority);

            sinon.stub(CacheManager.prototype, <any>"readAccountFromCache").returns(expectedAccountEntity);
            sinon.stub(TimeUtils, <any>"isTokenExpired").returns(false);

            sinon.stub(CacheManager.prototype, <any>"getCredentialsFilteredBy").returns({
                idTokens: {},
                accessTokens: { "foo": testAccessTokenEntity },
                refreshTokens: {},
            });

            const authResult = await client.acquireToken(oboRequest) as AuthenticationResult;
            expect(mockIdTokenCached.calledWith(oboRequest)).toBe(true);
            expect(authResult.scopes).toEqual(ScopeSet.fromString(testAccessTokenEntity.target).asArray());
            expect(authResult.idToken).toEqual(testIdToken.secret);
            expect(authResult.accessToken).toEqual(testAccessTokenEntity.secret);
            expect(authResult.fromCache).toBe(true);
            expect(authResult.account!.homeAccountId).toBe(expectedAccountEntity.homeAccountId);
            expect(authResult.account!.environment).toBe(expectedAccountEntity.environment);
            expect(authResult.account!.tenantId).toBe(expectedAccountEntity.realm);
        });
    });
});
