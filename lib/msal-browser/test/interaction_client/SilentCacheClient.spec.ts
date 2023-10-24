/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import sinon from "sinon";
import { PublicClientApplication } from "../../src";
import {
    TEST_CONFIG,
    ID_TOKEN_CLAIMS,
    TEST_TOKENS,
} from "../utils/StringConstants";
import { SilentCacheClient } from "../../src/interaction_client/SilentCacheClient";
import {
    AuthToken,
    CacheManager,
    IdTokenEntity,
    AccountEntity,
    AccessTokenEntity,
    CredentialType,
    AuthenticationScheme,
    RefreshTokenEntity,
    TimeUtils,
    AuthenticationResult,
    AccountInfo,
} from "@azure/msal-common";

const testAccount: AccountInfo = {
    homeAccountId: `${ID_TOKEN_CLAIMS.oid}.${ID_TOKEN_CLAIMS.tid}`,
    environment: "login.microsoftonline.com",
    tenantId: ID_TOKEN_CLAIMS.tid,
    username: ID_TOKEN_CLAIMS.preferred_username,
    localAccountId: ID_TOKEN_CLAIMS.oid,
    idTokenClaims: ID_TOKEN_CLAIMS,
    name: ID_TOKEN_CLAIMS.name,
    authorityType: "MSSTS",
    nativeAccountId: undefined,
    tenants: [ID_TOKEN_CLAIMS.tid],
};

const testAccountEntity: AccountEntity =
    AccountEntity.createFromAccountInfo(testAccount);

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

describe("SilentCacheClient", () => {
    let silentCacheClient: SilentCacheClient;
    let pca: PublicClientApplication;

    beforeEach(async () => {
        pca = new PublicClientApplication({
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID,
            },
        });

        await pca.initialize();
        //Implementation of PCA was moved to controller.
        pca = (pca as any).controller;
        // @ts-ignore
        silentCacheClient = new SilentCacheClient(
            //@ts-ignore
            pca.config,
            //@ts-ignore
            pca.browserStorage,
            //@ts-ignore
            pca.browserCrypto,
            //@ts-ignore
            pca.logger,
            //@ts-ignore
            pca.eventHandler,
            //@ts-ignore
            pca.navigationClient,
            //@ts-ignore
            pca.performanceClient
        );
    });

    afterEach(() => {
        jest.restoreAllMocks();
        sinon.restore();
    });

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
                expiresOn: new Date(
                    Number(testAccessTokenEntity.expiresOn) * 1000
                ),
                tokenType: AuthenticationScheme.BEARER,
            };
            sinon
                .stub(CacheManager.prototype, "readAccountFromCache")
                .returns(testAccountEntity);
            sinon
                .stub(CacheManager.prototype, "getIdToken")
                .returns(testIdToken);
            sinon
                .stub(CacheManager.prototype, "getAccessToken")
                .returns(testAccessTokenEntity);
            sinon
                .stub(CacheManager.prototype, "getRefreshToken")
                .returns(testRefreshTokenEntity);

            await expect(
                silentCacheClient.acquireToken({
                    authority: TEST_CONFIG.validAuthority,
                    correlationId: "testCorrelationId",
                    account: testAccount,
                    scopes: ["openid"],
                    forceRefresh: false,
                })
            ).resolves.toMatchObject(response);
        });
    });

    describe("logout", () => {
        it("logout clears browser cache", async () => {
            // @ts-ignore
            pca.browserStorage.setAccount(testAccountEntity);
            // @ts-ignore
            pca.browserStorage.setIdTokenCredential(testIdToken);

            pca.setActiveAccount(testAccount);
            expect(pca.getActiveAccount()).toEqual({
                ...testAccount,
                idTokenClaims: ID_TOKEN_CLAIMS,
            });
            silentCacheClient.logout({ account: testAccount });
            //@ts-ignore
            expect(pca.getActiveAccount()).toEqual(null);
        });
    });
});
