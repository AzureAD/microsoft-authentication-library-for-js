/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import sinon from "sinon";
import { PublicClientApplication, BrowserAuthError } from "../../src";
import { TEST_CONFIG, ID_TOKEN_CLAIMS, TEST_TOKENS, DEFAULT_OPENID_CONFIG_RESPONSE } from "../utils/StringConstants";
import { SilentCacheClient } from "../../src/interaction_client/SilentCacheClient";
import { AuthToken, CacheManager, IdTokenEntity, AccountEntity, AccessTokenEntity, CredentialType, AuthenticationScheme, RefreshTokenEntity, TimeUtils, AuthenticationResult, AccountInfo, Authority } from "@azure/msal-common";

const testAccountEntity: AccountEntity = new AccountEntity();
testAccountEntity.homeAccountId = `${ID_TOKEN_CLAIMS.oid}.${ID_TOKEN_CLAIMS.tid}`;
testAccountEntity.localAccountId = ID_TOKEN_CLAIMS.oid;
testAccountEntity.environment = "login.microsoftonline.com";
testAccountEntity.realm = ID_TOKEN_CLAIMS.tid;
testAccountEntity.username = ID_TOKEN_CLAIMS.preferred_username;
testAccountEntity.name = ID_TOKEN_CLAIMS.name;
testAccountEntity.authorityType = "MSSTS";

const testIdToken: IdTokenEntity = new IdTokenEntity();
testIdToken.homeAccountId = `${ID_TOKEN_CLAIMS.oid}.${ID_TOKEN_CLAIMS.tid}`;
testIdToken.clientId = TEST_CONFIG.MSAL_CLIENT_ID;
testIdToken.environment = testAccountEntity.environment;
testIdToken.realm = ID_TOKEN_CLAIMS.tid;
testIdToken.secret = TEST_TOKENS.IDTOKEN_V2;
testIdToken.credentialType = CredentialType.ID_TOKEN;

const testAccessTokenEntity: AccessTokenEntity = new AccessTokenEntity();
testAccessTokenEntity.homeAccountId = `${ID_TOKEN_CLAIMS.oid}.${ID_TOKEN_CLAIMS.tid}`;
testAccessTokenEntity.clientId = TEST_CONFIG.MSAL_CLIENT_ID;
testAccessTokenEntity.environment = testAccountEntity.environment;
testAccessTokenEntity.realm = ID_TOKEN_CLAIMS.tid;
testAccessTokenEntity.secret = TEST_TOKENS.ACCESS_TOKEN;
testAccessTokenEntity.target = TEST_CONFIG.DEFAULT_SCOPES.join(" ");
testAccessTokenEntity.credentialType = CredentialType.ACCESS_TOKEN;
testAccessTokenEntity.expiresOn = `${TimeUtils.nowSeconds() + 3600}`;
testAccessTokenEntity.cachedAt = `${TimeUtils.nowSeconds()}`;
testAccessTokenEntity.tokenType = AuthenticationScheme.BEARER;

const testRefreshTokenEntity: RefreshTokenEntity = new RefreshTokenEntity();
testRefreshTokenEntity.homeAccountId = `${ID_TOKEN_CLAIMS.oid}.${ID_TOKEN_CLAIMS.tid}`;
testRefreshTokenEntity.clientId = TEST_CONFIG.MSAL_CLIENT_ID;
testRefreshTokenEntity.environment = testAccountEntity.environment;
testRefreshTokenEntity.realm = ID_TOKEN_CLAIMS.tid;
testRefreshTokenEntity.secret = TEST_TOKENS.REFRESH_TOKEN;
testRefreshTokenEntity.credentialType = CredentialType.REFRESH_TOKEN;

const testAccount: AccountInfo = {
    homeAccountId: `${ID_TOKEN_CLAIMS.oid}.${ID_TOKEN_CLAIMS.tid}`,
    environment: testAccountEntity.environment,
    tenantId: ID_TOKEN_CLAIMS.tid,
    username: ID_TOKEN_CLAIMS.preferred_username,
    localAccountId: ID_TOKEN_CLAIMS.oid,
    idTokenClaims: ID_TOKEN_CLAIMS,
    name: ID_TOKEN_CLAIMS.name
};


describe("SilentCacheClient", () => {
    let silentCacheClient: SilentCacheClient;

    beforeEach(() => {
        const pca = new PublicClientApplication({
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID
            }
        });
        // @ts-ignore
        silentCacheClient = new SilentCacheClient(pca.config, pca.browserStorage, pca.browserCrypto, pca.logger, pca.eventHandler, pca.navigationClient, pca.performanceClient);
    })
    describe("acquireToken", () => {
        it("successfully acquires the token from the cache", async () => {
            const response: AuthenticationResult = {
                authority: TEST_CONFIG.validAuthority,
                uniqueId: testAccount.localAccountId,
                tenantId: testAccount.tenantId,
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                account: testAccount,
                idToken: TEST_TOKENS.IDTOKEN_V2,
                accessToken: TEST_TOKENS.ACCESS_TOKEN,
                idTokenClaims: ID_TOKEN_CLAIMS,
                fromCache: true,
                correlationId: "testCorrelationId",
                expiresOn: new Date(Number(testAccessTokenEntity.expiresOn) * 1000),
                tokenType: AuthenticationScheme.BEARER
            }
            sinon.stub(AuthToken, "extractTokenClaims").returns(ID_TOKEN_CLAIMS);
            sinon.stub(CacheManager.prototype, "readAccountFromCache").returns(testAccountEntity);
            sinon.stub(CacheManager.prototype, "readIdTokenFromCache").returns(testIdToken);
            sinon.stub(CacheManager.prototype, "readAccessTokenFromCache").returns(testAccessTokenEntity);
            sinon.stub(CacheManager.prototype, "readRefreshTokenFromCache").returns(testRefreshTokenEntity);

            await expect(silentCacheClient.acquireToken({
                authority: TEST_CONFIG.validAuthority,
                correlationId: "testCorrelationId",
                account: testAccount, 
                scopes: ["openid"],
                forceRefresh: false
            })).resolves.toMatchObject(response);
        });
    });

    describe("logout", () => {
        it("logout throws unsupported error", async () => {
            await expect(silentCacheClient.logout).rejects.toMatchObject(BrowserAuthError.createSilentLogoutUnsupportedError());
        });
    });
});
