/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import sinon from "sinon";
import { PublicClientApplication } from "../../src/app/PublicClientApplication";
import {
    TEST_CONFIG,
    TEST_URIS,
    TEST_HASHES,
    TEST_TOKENS,
    TEST_DATA_CLIENT_INFO,
    TEST_TOKEN_LIFETIMES,
    RANDOM_TEST_GUID,
    testNavUrl,
    TEST_STATE_VALUES,
    TEST_TOKEN_RESPONSE,
    ID_TOKEN_CLAIMS,
} from "../utils/StringConstants";
import {
    AccountInfo,
    TokenClaims,
    PromptValue,
    CommonAuthorizationUrlRequest,
    AuthorizationCodeClient,
    ResponseMode,
    AuthenticationScheme,
    ServerTelemetryManager,
    ProtocolUtils,
    NetworkManager,
} from "@azure/msal-common";
import {
    createBrowserAuthError,
    BrowserAuthErrorMessage,
    BrowserAuthErrorCodes,
} from "../../src/error/BrowserAuthError";
import * as SilentHandler from "../../src/interaction_handler/SilentHandler";
import * as BrowserCrypto from "../../src/crypto/BrowserCrypto";
import * as PkceGenerator from "../../src/crypto/PkceGenerator";
import { SilentIframeClient } from "../../src/interaction_client/SilentIframeClient";
import { BrowserCacheManager } from "../../src/cache/BrowserCacheManager";
import { ApiId, AuthenticationResult } from "../../src";
import { NativeInteractionClient } from "../../src/interaction_client/NativeInteractionClient";
import { NativeMessageHandler } from "../../src/broker/nativeBroker/NativeMessageHandler";
import { getDefaultPerformanceClient } from "../utils/TelemetryUtils";
import { InteractionHandler } from "../../src/interaction_handler/InteractionHandler";

describe("SilentIframeClient", () => {
    globalThis.MessageChannel = require("worker_threads").MessageChannel; // jsdom does not include an implementation for MessageChannel
    let silentIframeClient: SilentIframeClient;
    let pca: PublicClientApplication;
    let browserCacheManager: BrowserCacheManager;

    beforeEach(() => {
        pca = new PublicClientApplication({
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID,
            },
        });

        //Implementation of PCA was moved to controller.
        pca = (pca as any).controller;

        //@ts-ignore
        browserCacheManager = pca.browserStorage;

        // @ts-ignore
        silentIframeClient = new SilentIframeClient(
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
            pca.performanceClient,
            //@ts-ignore
            pca.nativeInternalStorage
        );
    });

    afterEach(() => {
        sinon.restore();
        jest.restoreAllMocks();
        window.location.hash = "";
        window.sessionStorage.clear();
        window.localStorage.clear();
    });

    describe("acquireToken", () => {
        it("throws error if prompt is not set to 'none' or 'no_session'", async () => {
            const req: CommonAuthorizationUrlRequest = {
                redirectUri: TEST_URIS.TEST_REDIR_URI,
                scopes: [TEST_CONFIG.MSAL_CLIENT_ID],
                prompt: PromptValue.SELECT_ACCOUNT,
                loginHint: "testLoginHint",
                state: "",
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                responseMode: TEST_CONFIG.RESPONSE_MODE as ResponseMode,
                nonce: "",
                authenticationScheme:
                    TEST_CONFIG.TOKEN_TYPE_BEARER as AuthenticationScheme,
            };

            await expect(
                silentIframeClient.acquireToken(req)
            ).rejects.toMatchObject(
                createBrowserAuthError(
                    BrowserAuthErrorCodes.silentPromptValueError
                )
            );
        });

        it("Errors thrown during token acquisition are cached for telemetry and browserStorage is cleaned", (done) => {
            sinon
                .stub(AuthorizationCodeClient.prototype, "getAuthCodeUrl")
                .resolves(testNavUrl);
            sinon
                .stub(SilentHandler, "monitorIframeForHash")
                .rejects(
                    createBrowserAuthError(
                        BrowserAuthErrorCodes.monitorWindowTimeout
                    )
                );
            jest.spyOn(PkceGenerator, "generatePkceCodes").mockResolvedValue({
                challenge: TEST_CONFIG.TEST_CHALLENGE,
                verifier: TEST_CONFIG.TEST_VERIFIER,
            });
            jest.spyOn(BrowserCrypto, "createNewGuid").mockReturnValue(
                RANDOM_TEST_GUID
            );
            const telemetryStub = sinon
                .stub(ServerTelemetryManager.prototype, "cacheFailedRequest")
                .callsFake((e) => {
                    expect(e).toMatchObject(
                        createBrowserAuthError(
                            BrowserAuthErrorCodes.monitorWindowTimeout
                        )
                    );
                });

            silentIframeClient
                .acquireToken({
                    redirectUri: TEST_URIS.TEST_REDIR_URI,
                    loginHint: "testLoginHint",
                })
                .catch(() => {
                    expect(telemetryStub.calledOnce).toBe(true);
                    done();
                });
        });

        it("Unexpected non-msal errors do not add correlationId and browserStorage is cleaned", (done) => {
            sinon
                .stub(AuthorizationCodeClient.prototype, "getAuthCodeUrl")
                .resolves(testNavUrl);
            const testError = {
                errorCode: "Unexpected error",
                errorDesc: "Unexpected error",
            };
            sinon
                .stub(SilentHandler, "monitorIframeForHash")
                .rejects(testError);
            jest.spyOn(PkceGenerator, "generatePkceCodes").mockResolvedValue({
                challenge: TEST_CONFIG.TEST_CHALLENGE,
                verifier: TEST_CONFIG.TEST_VERIFIER,
            });
            jest.spyOn(BrowserCrypto, "createNewGuid").mockReturnValue(
                RANDOM_TEST_GUID
            );

            silentIframeClient
                .acquireToken({
                    redirectUri: TEST_URIS.TEST_REDIR_URI,
                    loginHint: "testLoginHint",
                })
                .catch((e) => {
                    expect(e).toMatchObject(testError);
                    expect(e).not.toHaveProperty("correlationId");
                    done();
                });
        });

        it("successfully returns a token response (login_hint)", async () => {
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
            sinon
                .stub(AuthorizationCodeClient.prototype, "getAuthCodeUrl")
                .resolves(testNavUrl);
            sinon
                .stub(SilentHandler, "monitorIframeForHash")
                .resolves(TEST_HASHES.TEST_SUCCESS_CODE_HASH_SILENT);
            sinon
                .stub(InteractionHandler.prototype, "handleCodeResponse")
                .resolves(testTokenResponse);
            jest.spyOn(PkceGenerator, "generatePkceCodes").mockResolvedValue({
                challenge: TEST_CONFIG.TEST_CHALLENGE,
                verifier: TEST_CONFIG.TEST_VERIFIER,
            });
            jest.spyOn(BrowserCrypto, "createNewGuid").mockReturnValue(
                RANDOM_TEST_GUID
            );
            const tokenResp = await silentIframeClient.acquireToken({
                redirectUri: TEST_URIS.TEST_REDIR_URI,
                loginHint: "testLoginHint",
                prompt: PromptValue.NO_SESSION,
            });
            expect(tokenResp).toEqual(testTokenResponse);
        });

        it("successfully returns a token response (sid)", async () => {
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
            sinon
                .stub(AuthorizationCodeClient.prototype, "getAuthCodeUrl")
                .resolves(testNavUrl);
            sinon
                .stub(SilentHandler, "monitorIframeForHash")
                .resolves(TEST_HASHES.TEST_SUCCESS_CODE_HASH_SILENT);
            sinon
                .stub(InteractionHandler.prototype, "handleCodeResponse")
                .resolves(testTokenResponse);
            jest.spyOn(PkceGenerator, "generatePkceCodes").mockResolvedValue({
                challenge: TEST_CONFIG.TEST_CHALLENGE,
                verifier: TEST_CONFIG.TEST_VERIFIER,
            });
            jest.spyOn(BrowserCrypto, "createNewGuid").mockReturnValue(
                RANDOM_TEST_GUID
            );
            const tokenResp = await silentIframeClient.acquireToken({
                redirectUri: TEST_URIS.TEST_REDIR_URI,
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                sid: TEST_CONFIG.SID,
                // not setting a prompt is equivalent to Prompt: PromptValue.NONE
            });
            expect(tokenResp).toEqual(testTokenResponse);
        });

        it("successfully returns a token response from native broker", async () => {
            pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                },
                system: {
                    allowNativeBroker: true,
                },
            });

            //PCA implementation moved to controller
            pca = (pca as any).controller;

            // @ts-ignore
            const nativeMessageHandler = new NativeMessageHandler(
                //@ts-ignore
                pca.logger,
                2000,
                getDefaultPerformanceClient()
            );
            // @ts-ignore
            silentIframeClient = new SilentIframeClient(
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
                pca.performanceClient,
                //@ts-ignore
                pca.nativeInternalStorage,
                nativeMessageHandler
            );
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
                nativeAccountId: "test-nativeAccountId",
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
            sinon
                .stub(AuthorizationCodeClient.prototype, "getAuthCodeUrl")
                .resolves(testNavUrl);
            sinon
                .stub(SilentHandler, "monitorIframeForHash")
                .resolves(TEST_HASHES.TEST_SUCCESS_NATIVE_ACCOUNT_ID_SILENT);
            sinon
                .stub(NativeInteractionClient.prototype, "acquireToken")
                .resolves(testTokenResponse);
            jest.spyOn(PkceGenerator, "generatePkceCodes").mockResolvedValue({
                challenge: TEST_CONFIG.TEST_CHALLENGE,
                verifier: TEST_CONFIG.TEST_VERIFIER,
            });
            jest.spyOn(BrowserCrypto, "createNewGuid").mockReturnValue(
                RANDOM_TEST_GUID
            );
            const tokenResp = await silentIframeClient.acquireToken({
                redirectUri: TEST_URIS.TEST_REDIR_URI,
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                sid: TEST_CONFIG.SID,
            });
            expect(tokenResp).toEqual(testTokenResponse);
        });

        it("throw if server returns accountId but extension communication has not been established", (done) => {
            pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                },
                system: {
                    allowNativeBroker: true,
                },
            });

            //PCA implementation moved to controller
            pca = (pca as any).controller;

            // @ts-ignore
            silentIframeClient = new SilentIframeClient(
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
                pca.performanceClient,
                //@ts-ignore
                pca.nativeInternalStorage
            );
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
                nativeAccountId: "test-nativeAccountId",
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
            sinon
                .stub(AuthorizationCodeClient.prototype, "getAuthCodeUrl")
                .resolves(testNavUrl);
            sinon
                .stub(SilentHandler, "monitorIframeForHash")
                .resolves(TEST_HASHES.TEST_SUCCESS_NATIVE_ACCOUNT_ID_SILENT);
            sinon
                .stub(NativeInteractionClient.prototype, "acquireToken")
                .resolves(testTokenResponse);
            jest.spyOn(PkceGenerator, "generatePkceCodes").mockResolvedValue({
                challenge: TEST_CONFIG.TEST_CHALLENGE,
                verifier: TEST_CONFIG.TEST_VERIFIER,
            });
            jest.spyOn(BrowserCrypto, "createNewGuid").mockReturnValue(
                RANDOM_TEST_GUID
            );
            silentIframeClient
                .acquireToken({
                    scopes: TEST_CONFIG.DEFAULT_SCOPES,
                })
                .catch((e) => {
                    expect(e.errorCode).toEqual(
                        BrowserAuthErrorMessage.nativeConnectionNotEstablished
                            .code
                    );
                    expect(e.errorMessage).toEqual(
                        BrowserAuthErrorMessage.nativeConnectionNotEstablished
                            .desc
                    );
                    done();
                });
        });

        it("Throws hash empty error", (done) => {
            jest.spyOn(SilentHandler, "monitorIframeForHash").mockResolvedValue(
                ""
            );
            silentIframeClient
                .acquireToken({
                    redirectUri: TEST_URIS.TEST_REDIR_URI,
                })
                .catch((e) => {
                    expect(e).toEqual(
                        createBrowserAuthError(
                            BrowserAuthErrorCodes.hashEmptyError
                        )
                    );
                    done();
                });
        });

        it("Throws hashDoesNotContainKnownProperties error", (done) => {
            jest.spyOn(SilentHandler, "monitorIframeForHash").mockResolvedValue(
                "myCustomHash"
            );
            silentIframeClient
                .acquireToken({
                    redirectUri: TEST_URIS.TEST_REDIR_URI,
                })
                .catch((e) => {
                    expect(e).toEqual(
                        createBrowserAuthError(
                            BrowserAuthErrorCodes.hashDoesNotContainKnownProperties
                        )
                    );
                    done();
                });
        });

        describe("storeInCache tests", () => {
            beforeEach(() => {
                jest.spyOn(ProtocolUtils, "setRequestState").mockReturnValue(
                    TEST_STATE_VALUES.TEST_STATE_SILENT
                );
                jest.spyOn(
                    SilentHandler,
                    "monitorIframeForHash"
                ).mockResolvedValue(TEST_HASHES.TEST_SUCCESS_CODE_HASH_SILENT);
                jest.spyOn(
                    NetworkManager.prototype,
                    "sendPostRequest"
                ).mockResolvedValue(TEST_TOKEN_RESPONSE);
                jest.spyOn(
                    PkceGenerator,
                    "generatePkceCodes"
                ).mockResolvedValue({
                    challenge: TEST_CONFIG.TEST_CHALLENGE,
                    verifier: TEST_CONFIG.TEST_VERIFIER,
                });
            });

            it("does not store idToken if storeInCache.idToken = false", async () => {
                const tokenResp = await silentIframeClient.acquireToken({
                    redirectUri: TEST_URIS.TEST_REDIR_URI,
                    scopes: TEST_CONFIG.DEFAULT_SCOPES,
                    storeInCache: {
                        idToken: false,
                    },
                    nonce: ID_TOKEN_CLAIMS.nonce, // Ensures nonce matches the mocked idToken
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
                const tokenResp = await silentIframeClient.acquireToken({
                    redirectUri: TEST_URIS.TEST_REDIR_URI,
                    scopes: TEST_CONFIG.DEFAULT_SCOPES,
                    storeInCache: {
                        accessToken: false,
                    },
                    nonce: ID_TOKEN_CLAIMS.nonce, // Ensures nonce matches the mocked idToken
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
                const tokenResp = await silentIframeClient.acquireToken({
                    redirectUri: TEST_URIS.TEST_REDIR_URI,
                    scopes: TEST_CONFIG.DEFAULT_SCOPES,
                    storeInCache: {
                        refreshToken: false,
                    },
                    nonce: ID_TOKEN_CLAIMS.nonce, // Ensures nonce matches the mocked idToken
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
            await expect(silentIframeClient.logout).rejects.toMatchObject(
                createBrowserAuthError(
                    BrowserAuthErrorCodes.silentLogoutUnsupported
                )
            );
        });
    });
});
