/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { PublicClientApplication } from "../../src/app/PublicClientApplication.js";
import {
    TEST_CONFIG,
    TEST_TOKENS,
    TEST_DATA_CLIENT_INFO,
    TEST_TOKEN_LIFETIMES,
    RANDOM_TEST_GUID,
    TEST_TOKEN_RESPONSE,
} from "../utils/StringConstants.js";
import {
    Constants,
    AccountInfo,
    TokenClaims,
    AuthenticationResult,
    AuthenticationScheme,
    RefreshTokenClient,
    CommonSilentFlowRequest,
    AccountEntity,
    CredentialType,
} from "@azure/msal-common";
import * as BrowserCrypto from "../../src/crypto/BrowserCrypto.js";
import {
    createBrowserAuthError,
    BrowserAuthErrorCodes,
} from "../../src/error/BrowserAuthError.js";
import { SilentRefreshClient } from "../../src/interaction_client/SilentRefreshClient.js";
import { BrowserCacheManager } from "../../src/cache/BrowserCacheManager.js";
import { FetchClient } from "../../src/network/FetchClient.js";

const testIdTokenClaims: TokenClaims = {
    ver: "2.0",
    iss: "https://login.microsoftonline.com/9188040d-6c67-4c5b-b112-36a304b66dad/v2.0",
    sub: "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
    name: "Abe Lincoln",
    preferred_username: "AbeLi@microsoft.com",
    oid: "00000000-0000-0000-66f3-3332eca7ea81",
    tid: "3338040d-6c67-4c5b-b112-36a304b66dad",
    nonce: "123523",
};
const testAccount: AccountInfo = {
    homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
    localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
    environment: "login.windows.net",
    tenantId: testIdTokenClaims.tid || "",
    username: testIdTokenClaims.preferred_username || "",
};

describe("SilentRefreshClient", () => {
    let silentRefreshClient: SilentRefreshClient;
    let browserCacheManager: BrowserCacheManager;

    beforeEach(() => {
        let pca = new PublicClientApplication({
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID,
            },
        });

        //Implementation of PCA was moved to controller.
        pca = (pca as any).controller;

        //@ts-ignore
        browserCacheManager = pca.browserStorage;

        jest.spyOn(BrowserCrypto, "createNewGuid").mockReturnValue(
            RANDOM_TEST_GUID
        );
        // @ts-ignore
        silentRefreshClient = new SilentRefreshClient(
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
        window.location.hash = "";
        window.sessionStorage.clear();
        window.localStorage.clear();
    });

    describe("acquireToken", () => {
        it("successfully renews token", async () => {
            const testServerTokenResponse = {
                token_type: TEST_CONFIG.TOKEN_TYPE_BEARER,
                scope: TEST_CONFIG.DEFAULT_SCOPES.join(" "),
                expires_in: TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN,
                ext_expires_in: TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN,
                access_token: TEST_TOKENS.ACCESS_TOKEN,
                refresh_token: TEST_TOKENS.REFRESH_TOKEN,
                id_token: TEST_TOKENS.IDTOKEN_V2,
            };
            const testTokenResponse: AuthenticationResult = {
                authority: TEST_CONFIG.validAuthority,
                uniqueId: testIdTokenClaims.oid || "",
                tenantId: testIdTokenClaims.tid || "",
                scopes: ["scope1"],
                idToken: testServerTokenResponse.id_token,
                idTokenClaims: testIdTokenClaims,
                accessToken: testServerTokenResponse.access_token,
                fromCache: false,
                correlationId: RANDOM_TEST_GUID,
                expiresOn: new Date(
                    Date.now() + testServerTokenResponse.expires_in * 1000
                ),
                account: testAccount,
                tokenType: AuthenticationScheme.BEARER,
            };
            const silentATStub = jest
                .spyOn(
                    RefreshTokenClient.prototype,
                    <any>"acquireTokenByRefreshToken"
                )
                .mockResolvedValue(testTokenResponse);
            const tokenRequest: CommonSilentFlowRequest = {
                scopes: ["scope1"],
                account: testAccount,
                authority: TEST_CONFIG.validAuthority,
                authenticationScheme: AuthenticationScheme.BEARER,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                forceRefresh: false,
            };
            const expectedTokenRequest: CommonSilentFlowRequest = {
                ...tokenRequest,
                scopes: ["scope1"],
                authority: `${Constants.DEFAULT_AUTHORITY}`,
                correlationId: RANDOM_TEST_GUID,
                forceRefresh: false,
            };
            const tokenResp = await silentRefreshClient.acquireToken(
                tokenRequest
            );
            expect(silentATStub).toHaveBeenCalledWith(expectedTokenRequest);
            expect(tokenResp).toEqual(testTokenResponse);
        });

        it("Relative redirectUri is converted to absolute", async () => {
            const testServerTokenResponse = {
                token_type: TEST_CONFIG.TOKEN_TYPE_BEARER,
                scope: TEST_CONFIG.DEFAULT_SCOPES.join(" "),
                expires_in: TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN,
                ext_expires_in: TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN,
                access_token: TEST_TOKENS.ACCESS_TOKEN,
                refresh_token: TEST_TOKENS.REFRESH_TOKEN,
                id_token: TEST_TOKENS.IDTOKEN_V2,
            };
            const testTokenResponse: AuthenticationResult = {
                authority: TEST_CONFIG.validAuthority,
                uniqueId: testIdTokenClaims.oid || "",
                tenantId: testIdTokenClaims.tid || "",
                scopes: ["scope1"],
                idToken: testServerTokenResponse.id_token,
                idTokenClaims: testIdTokenClaims,
                accessToken: testServerTokenResponse.access_token,
                fromCache: false,
                correlationId: RANDOM_TEST_GUID,
                expiresOn: new Date(
                    Date.now() + testServerTokenResponse.expires_in * 1000
                ),
                account: testAccount,
                tokenType: AuthenticationScheme.BEARER,
            };
            const silentATStub = jest
                .spyOn(
                    RefreshTokenClient.prototype,
                    <any>"acquireTokenByRefreshToken"
                )
                .mockResolvedValue(testTokenResponse);
            const tokenRequest: CommonSilentFlowRequest = {
                scopes: ["scope1"],
                account: testAccount,
                authority: TEST_CONFIG.validAuthority,
                authenticationScheme: AuthenticationScheme.BEARER,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                forceRefresh: false,
                redirectUri: "/", // relative redirectUri
            };
            const expectedTokenRequest: CommonSilentFlowRequest = {
                ...tokenRequest,
                scopes: ["scope1"],
                authority: `${Constants.DEFAULT_AUTHORITY}`,
                correlationId: RANDOM_TEST_GUID,
                forceRefresh: false,
                redirectUri: "https://localhost:8081/", // absolute redirectUri
            };
            const tokenResp = await silentRefreshClient.acquireToken(
                tokenRequest
            );
            expect(silentATStub).toHaveBeenCalledWith(expectedTokenRequest);
            expect(tokenResp).toEqual(testTokenResponse);
        });

        describe("storeInCache tests", () => {
            beforeEach(() => {
                const rtEntity = {
                    secret: TEST_TOKENS.REFRESH_TOKEN,
                    credentialType: CredentialType.REFRESH_TOKEN,
                    homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                    environment: "login.windows.net",
                    realm: testIdTokenClaims.tid || "",
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                };
                const accountEntity = new AccountEntity();
                jest.spyOn(
                    BrowserCacheManager.prototype,
                    "getAccount"
                ).mockReturnValue(accountEntity);
                jest.spyOn(
                    BrowserCacheManager.prototype,
                    "getRefreshToken"
                ).mockReturnValue(rtEntity);
                jest.spyOn(
                    FetchClient.prototype,
                    "sendPostRequestAsync"
                ).mockResolvedValue(TEST_TOKEN_RESPONSE);
            });

            it("does not store idToken if storeInCache.idToken = false", async () => {
                const tokenResp = await silentRefreshClient.acquireToken({
                    authority: TEST_CONFIG.validAuthority,
                    correlationId: TEST_CONFIG.CORRELATION_ID,
                    account: testAccount,
                    forceRefresh: true,
                    scopes: TEST_CONFIG.DEFAULT_SCOPES,
                    storeInCache: {
                        idToken: false,
                    },
                });

                // Response should still contain acquired tokens
                expect(tokenResp.idToken).toEqual(
                    TEST_TOKEN_RESPONSE.body.id_token
                );
                expect(tokenResp.accessToken).toEqual(
                    TEST_TOKEN_RESPONSE.body.access_token
                );

                // Cache should not contain tokens which were turned off
                const tokenKeys = browserCacheManager.getTokenKeys();
                expect(tokenKeys.idToken).toHaveLength(0);
                expect(tokenKeys.accessToken).toHaveLength(1);
                expect(tokenKeys.refreshToken).toHaveLength(1);
            });

            it("does not store accessToken if storeInCache.accessToken = false", async () => {
                const tokenResp = await silentRefreshClient.acquireToken({
                    authority: TEST_CONFIG.validAuthority,
                    correlationId: TEST_CONFIG.CORRELATION_ID,
                    account: testAccount,
                    forceRefresh: true,
                    scopes: TEST_CONFIG.DEFAULT_SCOPES,
                    storeInCache: {
                        accessToken: false,
                    },
                });

                // Response should still contain acquired tokens
                expect(tokenResp.idToken).toEqual(
                    TEST_TOKEN_RESPONSE.body.id_token
                );
                expect(tokenResp.accessToken).toEqual(
                    TEST_TOKEN_RESPONSE.body.access_token
                );

                // Cache should not contain tokens which were turned off
                const tokenKeys = browserCacheManager.getTokenKeys();
                expect(tokenKeys.idToken).toHaveLength(1);
                expect(tokenKeys.accessToken).toHaveLength(0);
                expect(tokenKeys.refreshToken).toHaveLength(1);
            });

            it("does not store refreshToken if storeInCache.refreshToken = false", async () => {
                const tokenResp = await silentRefreshClient.acquireToken({
                    authority: TEST_CONFIG.validAuthority,
                    correlationId: TEST_CONFIG.CORRELATION_ID,
                    account: testAccount,
                    forceRefresh: true,
                    scopes: TEST_CONFIG.DEFAULT_SCOPES,
                    storeInCache: {
                        refreshToken: false,
                    },
                });

                // Response should still contain acquired tokens
                expect(tokenResp.idToken).toEqual(
                    TEST_TOKEN_RESPONSE.body.id_token
                );
                expect(tokenResp.accessToken).toEqual(
                    TEST_TOKEN_RESPONSE.body.access_token
                );

                // Cache should not contain tokens which were turned off
                const tokenKeys = browserCacheManager.getTokenKeys();
                expect(tokenKeys.idToken).toHaveLength(1);
                expect(tokenKeys.accessToken).toHaveLength(1);
                expect(tokenKeys.refreshToken).toHaveLength(0);
            });
        });
    });

    describe("logout", () => {
        it("logout throws unsupported error", async () => {
            await expect(silentRefreshClient.logout).rejects.toMatchObject(
                createBrowserAuthError(
                    BrowserAuthErrorCodes.silentLogoutUnsupported
                )
            );
        });
    });
});
