/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { PublicClientApplication } from "../../src/app/PublicClientApplication.js";
import {
    TEST_CONFIG,
    TEST_URIS,
    TEST_TOKENS,
    TEST_DATA_CLIENT_INFO,
    TEST_TOKEN_LIFETIMES,
    RANDOM_TEST_GUID,
    testNavUrl,
    TEST_TOKEN_RESPONSE,
} from "../utils/StringConstants.js";
import {
    AccountInfo,
    TokenClaims,
    AuthorizationCodeClient,
    AuthenticationScheme,
} from "@azure/msal-common";
import {
    createBrowserAuthError,
    BrowserAuthErrorCodes,
} from "../../src/error/BrowserAuthError.js";
import { CryptoOps } from "../../src/crypto/CryptoOps.js";
import { SilentAuthCodeClient } from "../../src/interaction_client/SilentAuthCodeClient.js";
import { BrowserCacheManager } from "../../src/cache/BrowserCacheManager.js";
import {
    ApiId,
    AuthorizationCodeRequest,
    AuthenticationResult,
} from "../../src/index.js";
import { InteractionHandler } from "../../src/interaction_handler/InteractionHandler.js";
import { FetchClient } from "../../src/network/FetchClient.js";

describe("SilentAuthCodeClient", () => {
    let silentAuthCodeClient: SilentAuthCodeClient;
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

        // @ts-ignore
        silentAuthCodeClient = new SilentAuthCodeClient(
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
            ApiId.acquireTokenSilent_authCode,
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
        it("throws error if code is empty", async () => {
            await expect(
                silentAuthCodeClient.acquireToken({
                    redirectUri: TEST_URIS.TEST_REDIR_URI,
                    scopes: [TEST_CONFIG.MSAL_CLIENT_ID],
                    code: "",
                })
            ).rejects.toMatchObject(
                createBrowserAuthError(BrowserAuthErrorCodes.authCodeRequired)
            );
        });

        it("successfully returns a token response (code)", async () => {
            const testServerTokenResponse = {
                token_type: TEST_CONFIG.TOKEN_TYPE_BEARER,
                scope: TEST_CONFIG.DEFAULT_SCOPES.join(" "),
                expires_in: TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN,
                ext_expires_in: TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN,
                access_token: TEST_TOKENS.ACCESS_TOKEN,
                refresh_token: TEST_TOKENS.REFRESH_TOKEN,
                id_token: TEST_TOKENS.IDTOKEN_V2,
            };
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
            const testTokenResponse: AuthenticationResult = {
                authority: TEST_CONFIG.validAuthority,
                uniqueId: testIdTokenClaims.oid || "",
                tenantId: testIdTokenClaims.tid || "",
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
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
            jest.spyOn(
                AuthorizationCodeClient.prototype,
                "getAuthCodeUrl"
            ).mockResolvedValue(testNavUrl);
            const handleCodeSpy = jest
                .spyOn(
                    InteractionHandler.prototype,
                    "handleCodeResponseFromServer"
                )
                .mockResolvedValue(testTokenResponse);

            jest.spyOn(CryptoOps.prototype, "createNewGuid").mockReturnValue(
                RANDOM_TEST_GUID
            );

            const request: AuthorizationCodeRequest = {
                redirectUri: TEST_URIS.TEST_REDIR_URI,
                code: "test-code",
            };
            const tokenResp = await silentAuthCodeClient.acquireToken(request);

            expect(handleCodeSpy).toHaveBeenCalledWith(
                {
                    code: "test-code",
                    msgraph_host: request.msGraphHost,
                    cloud_graph_host_name: request.cloudGraphHostName,
                    cloud_instance_host_name: request.cloudInstanceHostName,
                },
                expect.anything(),
                expect.anything()
            );
            expect(tokenResp).toEqual(testTokenResponse);
        });

        describe("storeInCache tests", () => {
            beforeEach(() => {
                jest.spyOn(
                    FetchClient.prototype,
                    "sendPostRequestAsync"
                ).mockResolvedValue(TEST_TOKEN_RESPONSE);
            });

            it("does not store idToken if storeInCache.idToken = false", async () => {
                const tokenResp = await silentAuthCodeClient.acquireToken({
                    code: "test-code",
                    redirectUri: TEST_URIS.TEST_REDIR_URI,
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
                const tokenResp = await silentAuthCodeClient.acquireToken({
                    code: "test-code",
                    redirectUri: TEST_URIS.TEST_REDIR_URI,
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
                const tokenResp = await silentAuthCodeClient.acquireToken({
                    code: "test-code",
                    redirectUri: TEST_URIS.TEST_REDIR_URI,
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
            await expect(silentAuthCodeClient.logout).rejects.toMatchObject(
                createBrowserAuthError(
                    BrowserAuthErrorCodes.silentLogoutUnsupported
                )
            );
        });
    });
});
