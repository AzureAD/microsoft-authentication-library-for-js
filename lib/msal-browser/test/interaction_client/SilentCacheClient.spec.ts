/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { PublicClientApplication } from "../../src/index.js";
import {
    TEST_CONFIG,
    ID_TOKEN_CLAIMS,
    TEST_TOKENS,
} from "../utils/StringConstants.js";
import { SilentCacheClient } from "../../src/interaction_client/SilentCacheClient.js";
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
import { buildAccountFromIdTokenClaims, buildIdToken } from "msal-test-utils";

const testAccountEntity: AccountEntity = buildAccountFromIdTokenClaims(
    ID_TOKEN_CLAIMS,
    undefined,
    { environment: "login.microsoftonline.com" }
);
const testAccount: AccountInfo = {
    ...testAccountEntity.getAccountInfo(),
    idTokenClaims: ID_TOKEN_CLAIMS,
    idToken: TEST_TOKENS.IDTOKEN_V2,
};

const testIdToken: IdTokenEntity = buildIdToken(
    ID_TOKEN_CLAIMS,
    TEST_TOKENS.IDTOKEN_V2,
    {
        clientId: TEST_CONFIG.MSAL_CLIENT_ID,
        environment: testAccount.environment,
    }
);

const testAccessTokenEntity: AccessTokenEntity = {
    homeAccountId: `${ID_TOKEN_CLAIMS.oid}.${ID_TOKEN_CLAIMS.tid}`,
    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
    environment: testAccountEntity.environment,
    realm: ID_TOKEN_CLAIMS.tid,
    secret: TEST_TOKENS.ACCESS_TOKEN,
    target: TEST_CONFIG.DEFAULT_SCOPES.join(" "),
    credentialType: CredentialType.ACCESS_TOKEN,
    expiresOn: `${TimeUtils.nowSeconds() + 3600}`,
    cachedAt: `${TimeUtils.nowSeconds()}`,
    tokenType: AuthenticationScheme.BEARER,
};

const testRefreshTokenEntity: RefreshTokenEntity = {
    homeAccountId: `${ID_TOKEN_CLAIMS.oid}.${ID_TOKEN_CLAIMS.tid}`,
    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
    environment: testAccountEntity.environment,
    realm: ID_TOKEN_CLAIMS.tid,
    secret: TEST_TOKENS.REFRESH_TOKEN,
    credentialType: CredentialType.REFRESH_TOKEN,
};

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
            await pca.browserStorage.setAccount(testAccountEntity);
            // @ts-ignore
            await pca.browserStorage.setIdTokenCredential(testIdToken);

            pca.setActiveAccount(testAccount);
            expect(pca.getActiveAccount()).toEqual(testAccount);
            silentCacheClient.logout({ account: testAccount });
            //@ts-ignore
            expect(pca.getActiveAccount()).toEqual(null);
        });
    });
});
