/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { PublicClientApplication } from "../../src/app/PublicClientApplication.js";
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
    TEST_SSH_VALUES,
    TEST_TOKEN_RESPONSE,
    ID_TOKEN_CLAIMS,
} from "../utils/StringConstants.js";
import {
    Constants,
    AccountInfo,
    TokenClaims,
    CommonAuthorizationUrlRequest,
    AuthorizationCodeClient,
    ResponseMode,
    AuthenticationScheme,
    ServerTelemetryEntity,
    AccountEntity,
    CommonEndSessionRequest,
    createClientConfigurationError,
    ClientConfigurationErrorCodes,
    CommonAuthorizationCodeRequest,
    AuthError,
    ProtocolUtils,
    ProtocolMode,
} from "@azure/msal-common";
import {
    TemporaryCacheKeys,
    ApiId,
    BrowserConstants,
} from "../../src/utils/BrowserConstants.js";
import * as BrowserCrypto from "../../src/crypto/BrowserCrypto.js";
import * as PkceGenerator from "../../src/crypto/PkceGenerator.js";
import { NavigationClient } from "../../src/navigation/NavigationClient.js";
import { EndSessionPopupRequest } from "../../src/request/EndSessionPopupRequest.js";
import { PopupClient } from "../../src/interaction_client/PopupClient.js";
import { NativeInteractionClient } from "../../src/interaction_client/NativeInteractionClient.js";
import { NativeMessageHandler } from "../../src/broker/nativeBroker/NativeMessageHandler.js";
import {
    BrowserAuthError,
    createBrowserAuthError,
    BrowserAuthErrorMessage,
} from "../../src/error/BrowserAuthError.js";
import { InteractionHandler } from "../../src/interaction_handler/InteractionHandler.js";
import { getDefaultPerformanceClient } from "../utils/TelemetryUtils.js";
import { AuthenticationResult } from "../../src/response/AuthenticationResult.js";
import { BrowserCacheManager } from "../../src/cache/BrowserCacheManager.js";
import { BrowserAuthErrorCodes } from "../../src/index.js";
import { FetchClient } from "../../src/network/FetchClient.js";

const testPopupWondowDefaults = {
    height: BrowserConstants.POPUP_HEIGHT,
    width: BrowserConstants.POPUP_WIDTH,
    top: 84,
    left: 270.5,
};

describe("PopupClient", () => {
    globalThis.MessageChannel = require("worker_threads").MessageChannel; // jsdom does not include an implementation for MessageChannel
    let popupClient: PopupClient;
    let pca: PublicClientApplication;
    let browserCacheManager: BrowserCacheManager;
    beforeEach(async () => {
        pca = new PublicClientApplication({
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID,
            },
        });

        await pca.initialize();

        //Implementation of PCA was moved to controller.
        pca = (pca as any).controller;

        //@ts-ignore
        browserCacheManager = pca.browserStorage;

        //@ts-ignore
        popupClient = new PopupClient(
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
            pca.performanceClient,
            //@ts-ignore
            pca.nativeInternalStorage,
            undefined,
            TEST_CONFIG.CORRELATION_ID
        );
    });

    afterEach(() => {
        jest.restoreAllMocks();
        window.location.hash = "";
        window.sessionStorage.clear();
        window.localStorage.clear();
    });

    describe("acquireToken", () => {
        beforeEach(() => {
            const popupWindow = {
                ...window,
                close: () => {},
                focus: () => {},
                location: {
                    ...window.location,
                    assign: () => {},
                },
            };
            // @ts-ignore
            jest.spyOn(window, "open").mockReturnValue(popupWindow);
        });

        afterEach(() => {
            window.localStorage.clear();
            window.sessionStorage.clear();
        });

        it("throws error when AuthenticationScheme is set to SSH and SSH JWK is omitted from the request", async () => {
            const request: CommonAuthorizationUrlRequest = {
                redirectUri: TEST_URIS.TEST_REDIR_URI,
                scopes: ["user.read"],
                state: TEST_STATE_VALUES.USER_STATE,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                responseMode: TEST_CONFIG.RESPONSE_MODE as ResponseMode,
                nonce: "",
                authenticationScheme: AuthenticationScheme.SSH,
            };

            expect(popupClient.acquireToken(request)).rejects.toThrow(
                createClientConfigurationError(
                    ClientConfigurationErrorCodes.missingSshJwk
                )
            );
        });

        it("throws error when AuthenticationScheme is set to SSH and SSH KID is omitted from the request", async () => {
            const request: CommonAuthorizationUrlRequest = {
                redirectUri: TEST_URIS.TEST_REDIR_URI,
                scopes: ["user.read"],
                state: TEST_STATE_VALUES.USER_STATE,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                responseMode: TEST_CONFIG.RESPONSE_MODE as ResponseMode,
                nonce: "",
                authenticationScheme: AuthenticationScheme.SSH,
                sshJwk: TEST_SSH_VALUES.SSH_JWK,
            };

            expect(popupClient.acquireToken(request)).rejects.toThrow(
                createClientConfigurationError(
                    ClientConfigurationErrorCodes.missingSshKid
                )
            );
        });

        it("opens popup window before network request by default", async () => {
            const request: CommonAuthorizationUrlRequest = {
                redirectUri: TEST_URIS.TEST_REDIR_URI,
                scopes: ["scope"],
                loginHint: "AbeLi@microsoft.com",
                state: TEST_STATE_VALUES.USER_STATE,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                responseMode: TEST_CONFIG.RESPONSE_MODE as ResponseMode,
                nonce: "",
                authenticationScheme:
                    TEST_CONFIG.TOKEN_TYPE_BEARER as AuthenticationScheme,
            };

            jest.spyOn(PkceGenerator, "generatePkceCodes").mockResolvedValue({
                challenge: TEST_CONFIG.TEST_CHALLENGE,
                verifier: TEST_CONFIG.TEST_VERIFIER,
            });

            const popupSpy = jest
                .spyOn(PopupClient.prototype, "openSizedPopup")
                .mockImplementation();

            try {
                await popupClient.acquireToken(request);
            } catch (e) {}
            expect(popupSpy.mock.calls[0]).toHaveLength(2);
        });

        it("opens popups asynchronously if configured", async () => {
            let pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                },
                system: {
                    asyncPopups: true,
                },
            });

            await pca.initialize();

            //PCA implementation moved to controller
            pca = (pca as any).controller;

            //@ts-ignore
            popupClient = new PopupClient(
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
                pca.performanceClient,
                //@ts-ignore
                pca.nativeInternalStorage
            );

            jest.spyOn(PkceGenerator, "generatePkceCodes").mockResolvedValue({
                challenge: TEST_CONFIG.TEST_CHALLENGE,
                verifier: TEST_CONFIG.TEST_VERIFIER,
            });

            const request: CommonAuthorizationUrlRequest = {
                redirectUri: TEST_URIS.TEST_REDIR_URI,
                scopes: ["scope"],
                loginHint: "AbeLi@microsoft.com",
                state: TEST_STATE_VALUES.USER_STATE,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                responseMode: TEST_CONFIG.RESPONSE_MODE as ResponseMode,
                nonce: "",
                authenticationScheme:
                    TEST_CONFIG.TOKEN_TYPE_BEARER as AuthenticationScheme,
            };

            const popupSpy = jest
                .spyOn(PopupClient.prototype, "openSizedPopup")
                .mockImplementation();

            try {
                await popupClient.acquireToken(request);
            } catch (e) {}
            expect(popupSpy).toHaveBeenCalled();
            expect(popupSpy.mock.calls[0]).toHaveLength(2);
            expect(
                popupSpy.mock.calls[0][0].startsWith(TEST_URIS.TEST_AUTH_ENDPT)
            ).toBeTruthy();
            expect(popupSpy.mock.calls[0][0]).toContain(
                `client_id=${encodeURIComponent(TEST_CONFIG.MSAL_CLIENT_ID)}`
            );
            expect(popupSpy.mock.calls[0][0]).toContain(
                `redirect_uri=${encodeURIComponent(request.redirectUri)}`
            );
            expect(popupSpy.mock.calls[0][0]).toContain(
                `login_hint=${encodeURIComponent(request.loginHint || "")}`
            );
        });

        it("calls native broker if server responds with accountId", async () => {
            pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                },
                system: {
                    allowPlatformBroker: true,
                },
            });

            await pca.initialize();

            //PCA implementation moved to controller
            pca = (pca as any).controller;

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
                correlationId: RANDOM_TEST_GUID,
                fromCache: false,
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
            jest.spyOn(
                PopupClient.prototype,
                "initiateAuthRequest"
            ).mockImplementation((requestUrl: string): Window => {
                expect(requestUrl).toEqual(testNavUrl);
                return window;
            });
            jest.spyOn(
                PopupClient.prototype,
                "monitorPopupForHash"
            ).mockResolvedValue(
                TEST_HASHES.TEST_SUCCESS_NATIVE_ACCOUNT_ID_POPUP
            );
            jest.spyOn(
                NativeInteractionClient.prototype,
                "acquireToken"
            ).mockResolvedValue(testTokenResponse);
            jest.spyOn(PkceGenerator, "generatePkceCodes").mockResolvedValue({
                challenge: TEST_CONFIG.TEST_CHALLENGE,
                verifier: TEST_CONFIG.TEST_VERIFIER,
            });
            jest.spyOn(BrowserCrypto, "createNewGuid").mockReturnValue(
                RANDOM_TEST_GUID
            );
            const nativeMessageHandler = new NativeMessageHandler(
                //@ts-ignore
                pca.logger,
                2000,
                getDefaultPerformanceClient()
            );
            //@ts-ignore
            popupClient = new PopupClient(
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
                pca.performanceClient,
                //@ts-ignore
                pca.nativeInternalStorage,
                nativeMessageHandler
            );
            const tokenResp = await popupClient.acquireToken({
                redirectUri: TEST_URIS.TEST_REDIR_URI,
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
            });
            expect(tokenResp).toEqual(testTokenResponse);
        });

        it("throws if server responds with accountId but extension message handler is not instantiated", async () => {
            pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                },
                system: {
                    allowPlatformBroker: true,
                },
            });

            await pca.initialize();

            //PCA implementation moved to controller
            pca = (pca as any).controller;

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
                correlationId: RANDOM_TEST_GUID,
                fromCache: false,
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
            jest.spyOn(
                PopupClient.prototype,
                "initiateAuthRequest"
            ).mockImplementation((requestUrl: string): Window => {
                expect(requestUrl).toEqual(testNavUrl);
                return window;
            });
            jest.spyOn(
                PopupClient.prototype,
                "monitorPopupForHash"
            ).mockResolvedValue(
                TEST_HASHES.TEST_SUCCESS_NATIVE_ACCOUNT_ID_POPUP
            );
            jest.spyOn(
                NativeInteractionClient.prototype,
                "acquireToken"
            ).mockResolvedValue(testTokenResponse);
            jest.spyOn(PkceGenerator, "generatePkceCodes").mockResolvedValue({
                challenge: TEST_CONFIG.TEST_CHALLENGE,
                verifier: TEST_CONFIG.TEST_VERIFIER,
            });
            jest.spyOn(BrowserCrypto, "createNewGuid").mockReturnValue(
                RANDOM_TEST_GUID
            );
            //@ts-ignore
            popupClient = new PopupClient(
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
                pca.performanceClient,
                //@ts-ignore
                pca.nativeInternalStorage
            );

            const result = await popupClient
                .acquireToken({
                    redirectUri: TEST_URIS.TEST_REDIR_URI,
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
                });
        });

        it("resolves the response successfully", async () => {
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
                correlationId: RANDOM_TEST_GUID,
                fromCache: false,
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
            jest.spyOn(PopupClient.prototype, "initiateAuthRequest")
                .mockClear()
                .mockImplementation((requestUrl: string): Window => {
                    expect(requestUrl).toEqual(testNavUrl);
                    return window;
                });
            jest.spyOn(
                PopupClient.prototype,
                "monitorPopupForHash"
            ).mockResolvedValue(TEST_HASHES.TEST_SUCCESS_CODE_HASH_POPUP);
            jest.spyOn(
                InteractionHandler.prototype,
                "handleCodeResponse"
            ).mockResolvedValue(testTokenResponse);
            jest.spyOn(PkceGenerator, "generatePkceCodes").mockResolvedValue({
                challenge: TEST_CONFIG.TEST_CHALLENGE,
                verifier: TEST_CONFIG.TEST_VERIFIER,
            });
            jest.spyOn(BrowserCrypto, "createNewGuid").mockReturnValue(
                RANDOM_TEST_GUID
            );
            const tokenResp = await popupClient.acquireToken({
                redirectUri: TEST_URIS.TEST_REDIR_URI,
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
            });
            expect(tokenResp).toEqual(testTokenResponse);
        });

        it("throws hash_empty_error if popup returns to redirectUri without a hash", (done) => {
            jest.spyOn(
                PopupClient.prototype,
                "monitorPopupForHash"
            ).mockResolvedValue("");

            popupClient
                .acquireToken({
                    redirectUri: TEST_URIS.TEST_REDIR_URI,
                    scopes: TEST_CONFIG.DEFAULT_SCOPES,
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

        it("throws hash_does_not_contain_known_properties error if popup returns to redirectUri with unrecognized params in the hash", (done) => {
            jest.spyOn(
                PopupClient.prototype,
                "monitorPopupForHash"
            ).mockResolvedValue(
                "#fakeKey=fakeValue&anotherFakeKey=anotherFakeValue"
            );

            popupClient
                .acquireToken({
                    redirectUri: TEST_URIS.TEST_REDIR_URI,
                    scopes: TEST_CONFIG.DEFAULT_SCOPES,
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
                    TEST_STATE_VALUES.TEST_STATE_POPUP
                );
                jest.spyOn(PopupClient.prototype, "openPopup").mockReturnValue(
                    window
                );
                jest.spyOn(
                    PopupClient.prototype,
                    "monitorPopupForHash"
                ).mockResolvedValue(TEST_HASHES.TEST_SUCCESS_CODE_HASH_POPUP);
                jest.spyOn(
                    FetchClient.prototype,
                    "sendPostRequestAsync"
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
                const tokenResp = await popupClient.acquireToken({
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
                const tokenResp = await popupClient.acquireToken({
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
                const tokenResp = await popupClient.acquireToken({
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

        it("catches error and cleans cache before rethrowing", async () => {
            const testError: AuthError = new AuthError(
                "create_login_url_error",
                "Error in creating a login url"
            );
            jest.spyOn(
                AuthorizationCodeClient.prototype,
                "getAuthCodeUrl"
            ).mockResolvedValue(testNavUrl);
            jest.spyOn(
                PopupClient.prototype,
                "initiateAuthRequest"
            ).mockImplementation(() => {
                throw testError;
            });
            jest.spyOn(PkceGenerator, "generatePkceCodes").mockResolvedValue({
                challenge: TEST_CONFIG.TEST_CHALLENGE,
                verifier: TEST_CONFIG.TEST_VERIFIER,
            });
            jest.spyOn(BrowserCrypto, "createNewGuid").mockReturnValue(
                RANDOM_TEST_GUID
            );
            try {
                await popupClient.acquireToken({
                    redirectUri: TEST_URIS.TEST_REDIR_URI,
                    scopes: TEST_CONFIG.DEFAULT_SCOPES,
                });
            } catch (e) {
                // Test that error was cached for telemetry purposes and then thrown
                expect(window.sessionStorage).toHaveLength(1);
                const failures = window.sessionStorage.getItem(
                    `server-telemetry-${TEST_CONFIG.MSAL_CLIENT_ID}`
                );
                const failureObj = JSON.parse(
                    failures || ""
                ) as ServerTelemetryEntity;
                expect(failureObj.failedRequests).toHaveLength(2);
                expect(failureObj.failedRequests[0]).toEqual(
                    ApiId.acquireTokenPopup
                );
                expect(failureObj.errors[0]).toEqual(testError.errorCode);
                expect(e).toEqual(testError);
            }
        });
    });

    describe("logout", () => {
        beforeEach(() => {
            const popupWindow = {
                ...window,
                close: () => {},
            };
            // @ts-ignore
            jest.spyOn(window, "open").mockReturnValue(popupWindow);
        });

        afterEach(() => {
            window.localStorage.clear();
            window.sessionStorage.clear();
        });

        it("opens popup window before network request by default", async () => {
            const popupSpy = jest
                .spyOn(PopupClient.prototype, "openSizedPopup")
                .mockImplementation();

            try {
                await popupClient.logout();
            } catch (e) {}
            expect(popupSpy.mock.calls[0]).toHaveLength(2);
        });

        it("opens popups asynchronously if configured", async () => {
            let pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                },
                system: {
                    asyncPopups: true,
                },
            });

            await pca.initialize();

            //PCA implementation moved to controller
            pca = (pca as any).controller;

            //@ts-ignore
            popupClient = new PopupClient(
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
                pca.performanceClient,
                //@ts-ignore
                pca.nativeInternalStorage
            );

            jest.spyOn(
                PopupClient.prototype,
                "openSizedPopup"
            ).mockImplementation((urlNavigate, popupParams) => {
                expect(
                    urlNavigate.startsWith(TEST_URIS.TEST_END_SESSION_ENDPOINT)
                ).toBeTruthy();
                expect(
                    popupParams.popupName.startsWith(
                        `msal.${TEST_CONFIG.MSAL_CLIENT_ID}`
                    )
                ).toBeTruthy();
                return null;
            });

            await popupClient.logout().catch(() => {});
        });

        it("catches error and cleans cache before rethrowing", async () => {
            const testError: AuthError = new AuthError(
                "create_logout_url_error",
                "Error in creating a logout url"
            );
            jest.spyOn(
                AuthorizationCodeClient.prototype,
                "getLogoutUri"
            ).mockImplementation(() => {
                throw testError;
            });

            try {
                await popupClient.logout();
            } catch (e) {
                // Test that error was cached for telemetry purposes and then thrown
                expect(window.sessionStorage).toHaveLength(1);
                const failures = window.sessionStorage.getItem(
                    `server-telemetry-${TEST_CONFIG.MSAL_CLIENT_ID}`
                );
                const failureObj = JSON.parse(
                    failures || ""
                ) as ServerTelemetryEntity;
                expect(failureObj.failedRequests).toHaveLength(2);
                expect(failureObj.failedRequests[0]).toEqual(ApiId.logoutPopup);
                expect(failureObj.errors[0]).toEqual(testError.errorCode);
                expect(e).toEqual(testError);
            }
        });

        it("includes postLogoutRedirectUri if one is passed", async () => {
            let pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                },
                system: {
                    asyncPopups: true,
                },
            });

            await pca.initialize();

            //PCA implementation moved to controller
            pca = (pca as any).controller;

            //@ts-ignore
            popupClient = new PopupClient(
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
                pca.performanceClient,
                //@ts-ignore
                pca.nativeInternalStorage
            );

            jest.spyOn(
                PopupClient.prototype,
                "openSizedPopup"
            ).mockImplementation((urlNavigate) => {
                expect(
                    urlNavigate.startsWith(TEST_URIS.TEST_END_SESSION_ENDPOINT)
                ).toBeTruthy();
                expect(urlNavigate).toContain(
                    `post_logout_redirect_uri=${encodeURIComponent(
                        postLogoutRedirectUri
                    )}`
                );
                throw "Stop Test";
            });

            const postLogoutRedirectUri = "https://localhost:8000/logout";

            const result = await popupClient
                .logout({
                    postLogoutRedirectUri,
                })
                .catch(() => {});
        });

        it("includes postLogoutRedirectUri if one is configured", async () => {
            const postLogoutRedirectUri = "https://localhost:8000/logout";
            let pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                    postLogoutRedirectUri,
                },
                system: {
                    asyncPopups: true,
                },
            });

            await pca.initialize();

            //PCA implementation moved to controller
            pca = (pca as any).controller;

            //@ts-ignore
            popupClient = new PopupClient(
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

            jest.spyOn(
                PopupClient.prototype,
                "openSizedPopup"
            ).mockImplementation((urlNavigate) => {
                expect(
                    urlNavigate.startsWith(TEST_URIS.TEST_END_SESSION_ENDPOINT)
                ).toBeTruthy();
                expect(urlNavigate).toContain(
                    `post_logout_redirect_uri=${encodeURIComponent(
                        postLogoutRedirectUri
                    )}`
                );
                throw "Stop Test";
            });

            const result = await popupClient.logout().catch(() => {});
        });

        it("includes postLogoutRedirectUri as current page if none is set on request", async () => {
            let pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                },
                system: {
                    asyncPopups: true,
                },
            });

            await pca.initialize();

            //PCA implementation moved to controller
            pca = (pca as any).controller;

            //@ts-ignore
            popupClient = new PopupClient(
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
                pca.performanceClient,
                //@ts-ignore
                pca.nativeInternalStorage
            );

            jest.spyOn(
                PopupClient.prototype,
                "openSizedPopup"
            ).mockImplementation((urlNavigate) => {
                expect(
                    urlNavigate.startsWith(TEST_URIS.TEST_END_SESSION_ENDPOINT)
                ).toBeTruthy();
                expect(urlNavigate).toContain(
                    `post_logout_redirect_uri=${encodeURIComponent(
                        window.location.href
                    )}`
                );
                throw "Stop Test";
            });

            const result = await popupClient.logout().catch(() => {});
        });

        it("includes logoutHint if it is set on request", async () => {
            let pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                },
                system: {
                    asyncPopups: true,
                },
            });

            await pca.initialize();

            //PCA implementation moved to controller
            pca = (pca as any).controller;

            //@ts-ignore
            popupClient = new PopupClient(
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
            const logoutHint = "test@user.com";

            jest.spyOn(
                PopupClient.prototype,
                "openSizedPopup"
            ).mockImplementation((urlNavigate) => {
                expect(urlNavigate).toContain(
                    `logout_hint=${encodeURIComponent(logoutHint)}`
                );
                throw "Stop Test";
            });

            const result = await popupClient
                .logout({
                    logoutHint,
                })
                .catch(() => {});
        });

        it("includes logoutHint from ID token claims if account is passed in and logoutHint is not", async () => {
            let pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                },
                system: {
                    asyncPopups: true,
                },
            });

            await pca.initialize();

            //PCA implementation moved to controller
            pca = (pca as any).controller;

            //@ts-ignore
            popupClient = new PopupClient(
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
                pca.performanceClient,
                //@ts-ignore
                pca.nativeInternalStorage
            );

            const logoutHint = "test@user.com";
            const testIdTokenClaims: TokenClaims = {
                ver: "2.0",
                iss: "https://login.microsoftonline.com/9188040d-6c67-4c5b-b112-36a304b66dad/v2.0",
                sub: "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
                name: "Abe Lincoln",
                preferred_username: "AbeLi@microsoft.com",
                oid: "00000000-0000-0000-66f3-3332eca7ea81",
                tid: "3338040d-6c67-4c5b-b112-36a304b66dad",
                nonce: "123523",
                login_hint: logoutHint,
            };

            const testAccountInfo: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: testIdTokenClaims.tid || "",
                username: testIdTokenClaims.preferred_username || "",
                idTokenClaims: testIdTokenClaims,
            };

            const testAccount: AccountEntity = new AccountEntity();
            testAccount.homeAccountId = testAccountInfo.homeAccountId;
            testAccount.localAccountId = testAccountInfo.localAccountId;
            testAccount.environment = testAccountInfo.environment;
            testAccount.realm = testAccountInfo.tenantId;
            testAccount.username = testAccountInfo.username;
            testAccount.name = testAccountInfo.name;
            testAccount.authorityType = "MSSTS";
            testAccount.clientInfo =
                TEST_DATA_CLIENT_INFO.TEST_CLIENT_INFO_B64ENCODED;

            // @ts-ignore
            await pca.browserStorage.setAccount(testAccount);

            jest.spyOn(
                PopupClient.prototype,
                "openSizedPopup"
            ).mockImplementation((urlNavigate) => {
                expect(urlNavigate).toContain(
                    `logout_hint=${encodeURIComponent(logoutHint)}`
                );
                throw "Stop Test";
            });

            const result = await popupClient
                .logout({
                    account: testAccountInfo,
                })
                .catch(() => {});
        });

        it("logoutHint attribute takes precedence over ID Token Claims from provided account when setting logout_hint", async () => {
            let pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                },
                system: {
                    asyncPopups: true,
                },
            });

            await pca.initialize();

            //PCA implementation moved to controller
            pca = (pca as any).controller;

            //@ts-ignore
            popupClient = new PopupClient(
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
                pca.performanceClient,
                //@ts-ignore
                pca.nativeInternalStorage
            );
            const logoutHint = "test@user.com";
            const loginHint = "anothertest@user.com";
            const testIdTokenClaims: TokenClaims = {
                ver: "2.0",
                iss: "https://login.microsoftonline.com/9188040d-6c67-4c5b-b112-36a304b66dad/v2.0",
                sub: "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
                name: "Abe Lincoln",
                preferred_username: "AbeLi@microsoft.com",
                oid: "00000000-0000-0000-66f3-3332eca7ea81",
                tid: "3338040d-6c67-4c5b-b112-36a304b66dad",
                nonce: "123523",
                login_hint: loginHint,
            };

            const testAccountInfo: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: testIdTokenClaims.tid || "",
                username: testIdTokenClaims.preferred_username || "",
                idTokenClaims: testIdTokenClaims,
            };

            const testAccount: AccountEntity = new AccountEntity();
            testAccount.homeAccountId = testAccountInfo.homeAccountId;
            testAccount.localAccountId = testAccountInfo.localAccountId;
            testAccount.environment = testAccountInfo.environment;
            testAccount.realm = testAccountInfo.tenantId;
            testAccount.username = testAccountInfo.username;
            testAccount.name = testAccountInfo.name;
            testAccount.authorityType = "MSSTS";
            testAccount.clientInfo =
                TEST_DATA_CLIENT_INFO.TEST_CLIENT_INFO_B64ENCODED;

            // @ts-ignore
            await pca.browserStorage.setAccount(testAccount);

            jest.spyOn(
                PopupClient.prototype,
                "openSizedPopup"
            ).mockImplementation((urlNavigate) => {
                expect(urlNavigate).toContain(
                    `logout_hint=${encodeURIComponent(logoutHint)}`
                );
                expect(urlNavigate).not.toContain(
                    `logout_hint=${encodeURIComponent(loginHint)}`
                );
                throw "Stop Test";
            });

            const result = await popupClient
                .logout({
                    account: testAccountInfo,
                    logoutHint,
                })
                .catch(() => {});
        });

        it("redirects main window when logout is complete", (done) => {
            const popupWindow = { ...window };
            jest.spyOn(PopupClient.prototype, "openSizedPopup").mockReturnValue(
                popupWindow
            );
            jest.spyOn(PopupClient.prototype, "openPopup").mockReturnValue(
                popupWindow
            );
            jest.spyOn(
                PopupClient.prototype,
                "cleanPopup"
            ).mockImplementation();
            jest.spyOn(
                NavigationClient.prototype,
                "navigateInternal"
            ).mockImplementation((url, navigationOptions) => {
                expect(url.endsWith("/home")).toBeTruthy();
                expect(navigationOptions.apiId).toEqual(ApiId.logoutPopup);
                done();
                return Promise.resolve(false);
            });

            const request: EndSessionPopupRequest = {
                mainWindowRedirectUri: "/home",
            };

            popupClient.logout(request);
        });

        it("closing the popup does not throw", (done) => {
            const popupWindow = { ...window };
            jest.spyOn(PopupClient.prototype, "openSizedPopup").mockReturnValue(
                popupWindow
            );
            popupWindow.closed = true;
            jest.spyOn(PopupClient.prototype, "openPopup").mockReturnValue(
                popupWindow
            );
            jest.spyOn(
                PopupClient.prototype,
                "cleanPopup"
            ).mockImplementation();

            popupClient.logout().then(() => {
                done();
            });
        });

        it("clears active account entry from the cache", async () => {
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

            const testAccountInfo: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: testIdTokenClaims.tid || "",
                username: testIdTokenClaims.preferred_username || "",
            };

            const testAccount: AccountEntity = new AccountEntity();
            testAccount.homeAccountId = testAccountInfo.homeAccountId;
            testAccount.localAccountId = testAccountInfo.localAccountId;
            testAccount.environment = testAccountInfo.environment;
            testAccount.realm = testAccountInfo.tenantId;
            testAccount.username = testAccountInfo.username;
            testAccount.name = testAccountInfo.name;
            testAccount.authorityType = "MSSTS";
            testAccount.clientInfo =
                TEST_DATA_CLIENT_INFO.TEST_CLIENT_INFO_B64ENCODED;

            const validatedLogoutRequest: CommonEndSessionRequest = {
                correlationId: RANDOM_TEST_GUID,
                postLogoutRedirectUri: TEST_URIS.TEST_REDIR_URI,
                account: testAccountInfo,
            };

            const popupWindow = { ...window };
            jest.spyOn(PopupClient.prototype, "openSizedPopup").mockReturnValue(
                popupWindow
            );
            jest.spyOn(PopupClient.prototype, "openPopup").mockReturnValue(
                popupWindow
            );
            jest.spyOn(PopupClient.prototype, "cleanPopup").mockImplementation(
                (popup) => {
                    window.sessionStorage.removeItem(
                        `${Constants.CACHE_PREFIX}.${TemporaryCacheKeys.INTERACTION_STATUS_KEY}`
                    );
                }
            );
            jest.spyOn(
                NavigationClient.prototype,
                "navigateInternal"
            ).mockImplementation((url, navigationOptions) => {
                return Promise.resolve(true);
            });

            // @ts-ignore
            await pca.browserStorage.setAccount(testAccount);
            pca.setActiveAccount(testAccountInfo);

            await popupClient.logout(validatedLogoutRequest).then(() => {
                expect(pca.getActiveAccount()).toBe(null);
                expect(pca.getAllAccounts().length).toBe(0);
            });
        });
    });

    describe("openSizedPopup", () => {
        it("opens a popup with urlNavigate", () => {
            const popupParams = {
                popupName: "popup",
                popupWindowAttributes: {},
                popupWindowParent: window,
            };
            const windowOpenSpy = jest
                .spyOn(window, "open")
                .mockImplementation();
            popupClient.openSizedPopup("http://localhost/", popupParams);

            expect(windowOpenSpy).toHaveBeenCalledWith(
                "http://localhost/",
                "popup",
                expect.anything()
            );
        });

        it("opens a popup with about:blank", () => {
            const popupParams = {
                popupName: "popup",
                popupWindowAttributes: {},
                popupWindowParent: window,
            };
            const windowOpenSpy = jest
                .spyOn(window, "open")
                .mockImplementation();
            popupClient.openSizedPopup("about:blank", popupParams);

            expect(windowOpenSpy).toHaveBeenCalledWith(
                "about:blank",
                "popup",
                expect.anything()
            );
        });

        it("opens a popup using passed window parent", () => {
            const windowOpenSpy = jest
                .spyOn(window, "open")
                .mockImplementation();
            const windowParent = {
                open: windowOpenSpy,
            };
            const popupParams = {
                popupName: "popup",
                popupWindowAttributes: {},
                popupWindowParent: windowParent as unknown as Window,
            };
            popupClient.openSizedPopup("about:blank", popupParams);

            expect(windowOpenSpy).toHaveBeenCalledWith(
                "about:blank",
                "popup",
                expect.anything()
            );
        });

        it("opens a popup with popupWindowAttributes set", () => {
            const testPopupWindowAttributes = {
                popupSize: {
                    height: 100,
                    width: 100,
                },
                popupPosition: {
                    top: 100,
                    left: 100,
                },
            };
            const popupParams = {
                popupName: "popup",
                popupWindowAttributes: testPopupWindowAttributes,
                popupWindowParent: window,
            };
            const windowOpenSpy = jest
                .spyOn(window, "open")
                .mockImplementation();
            popupClient.openSizedPopup("about:blank", popupParams);

            expect(windowOpenSpy).toHaveBeenCalledWith(
                "about:blank",
                "popup",
                `width=100, height=100, top=100, left=100, scrollbars=yes`
            );
        });

        it("opens a popup with default size and position if empty object passed in for popupWindowAttributes", () => {
            const popupParams = {
                popupName: "popup",
                popupWindowAttributes: {},
                popupWindowParent: window,
            };
            const windowOpenSpy = jest
                .spyOn(window, "open")
                .mockImplementation();
            popupClient.openSizedPopup("about:blank", popupParams);

            expect(windowOpenSpy).toHaveBeenCalledWith(
                "about:blank",
                "popup",
                `width=${testPopupWondowDefaults.width}, height=${testPopupWondowDefaults.height}, top=${testPopupWondowDefaults.top}, left=${testPopupWondowDefaults.left}, scrollbars=yes`
            );
        });

        it("opens a popup with default size and position if attributes are set to zero", () => {
            const testPopupWindowAttributes = {
                popupSize: {
                    height: 0,
                    width: 0,
                },
                popupPosition: {
                    top: 0,
                    left: 0,
                },
            };
            const popupParams = {
                popupName: "popup",
                popupWindowAttributes: testPopupWindowAttributes,
                popupWindowParent: window,
            };
            const windowOpenSpy = jest
                .spyOn(window, "open")
                .mockImplementation();
            popupClient.openSizedPopup("about:blank", popupParams);

            expect(windowOpenSpy).toHaveBeenCalledWith(
                "about:blank",
                "popup",
                `width=${testPopupWondowDefaults.width}, height=${testPopupWondowDefaults.height}, top=${testPopupWondowDefaults.top}, left=${testPopupWondowDefaults.left}, scrollbars=yes`
            );
        });

        it("opens a popup with set popupSize and default popupPosition", () => {
            const testPopupWindowAttributes = {
                popupSize: {
                    height: 100,
                    width: 100,
                },
            };
            const popupParams = {
                popupName: "popup",
                popupWindowAttributes: testPopupWindowAttributes,
                popupWindowParent: window,
            };
            const windowOpenSpy = jest
                .spyOn(window, "open")
                .mockImplementation();
            popupClient.openSizedPopup("about:blank", popupParams);

            expect(windowOpenSpy).toHaveBeenCalledWith(
                "about:blank",
                "popup",
                `width=100, height=100, top=${testPopupWondowDefaults.top}, left=${testPopupWondowDefaults.left}, scrollbars=yes`
            );
        });

        it("opens a popup with set popupPosition and default popupSize", () => {
            const testPopupWindowAttributes = {
                popupPosition: {
                    top: 100,
                    left: 100,
                },
            };
            const popupParams = {
                popupName: "popup",
                popupWindowAttributes: testPopupWindowAttributes,
                popupWindowParent: window,
            };
            const windowOpenSpy = jest
                .spyOn(window, "open")
                .mockImplementation();
            popupClient.openSizedPopup("about:blank", popupParams);

            expect(windowOpenSpy).toHaveBeenCalledWith(
                "about:blank",
                "popup",
                `width=${testPopupWondowDefaults.width}, height=${testPopupWondowDefaults.height}, top=100, left=100, scrollbars=yes`
            );
        });

        it("opens a popup with default size when invalid popupSize height and width passed in", () => {
            const testPopupWindowAttributes = {
                popupSize: {
                    height: -1,
                    width: 99999,
                },
            };
            const popupParams = {
                popupName: "popup",
                popupWindowAttributes: testPopupWindowAttributes,
                popupWindowParent: window,
            };
            const windowOpenSpy = jest
                .spyOn(window, "open")
                .mockImplementation();
            popupClient.openSizedPopup("about:blank", popupParams);

            expect(windowOpenSpy).toHaveBeenCalledWith(
                "about:blank",
                "popup",
                `width=${testPopupWondowDefaults.width}, height=${testPopupWondowDefaults.height}, top=${testPopupWondowDefaults.top}, left=${testPopupWondowDefaults.left}, scrollbars=yes`
            );
        });

        it("opens a popup with default position when invalid popupPosition top and left passed in", () => {
            const testPopupWindowAttributes = {
                popupPosition: {
                    top: -1,
                    left: 99999,
                },
            };
            const popupParams = {
                popupName: "popup",
                popupWindowAttributes: testPopupWindowAttributes,
                popupWindowParent: window,
            };
            const windowOpenSpy = jest
                .spyOn(window, "open")
                .mockImplementation();
            popupClient.openSizedPopup("about:blank", popupParams);

            expect(windowOpenSpy).toHaveBeenCalledWith(
                "about:blank",
                "popup",
                `width=${testPopupWondowDefaults.width}, height=${testPopupWondowDefaults.height}, top=${testPopupWondowDefaults.top}, left=${testPopupWondowDefaults.left}, scrollbars=yes`
            );
        });
    });

    describe("unloadWindow", () => {
        it("closes window and removes temporary cache", (done) => {
            // @ts-ignore
            pca.browserStorage.setTemporaryCache(
                TemporaryCacheKeys.INTERACTION_STATUS_KEY,
                BrowserConstants.INTERACTION_IN_PROGRESS_VALUE,
                true
            );
            const popupWindow: Window = {
                ...window,
                //@ts-ignore
                location: {
                    assign: () => {},
                },
                focus: () => {},
                close: () => {
                    // @ts-ignore
                    expect(
                        //@ts-ignore
                        pca.browserStorage.getTemporaryCache(
                            TemporaryCacheKeys.INTERACTION_STATUS_KEY
                        )
                    ).toBe(null);
                    done();
                },
            };
            const popupParams = {
                popupName: "name",
                popupWindowAttributes: {},
                popup: popupWindow,
                popupWindowParent: window,
            };
            popupClient.openPopup("http://localhost", popupParams);
            popupClient.unloadWindow(new Event("test"));
        });
    });

    describe("monitorPopupForHash", () => {
        it("throws if popup is closed", (done) => {
            const popup: Window = {
                //@ts-ignore
                location: {
                    href: "about:blank",
                    hash: "",
                },
                close: () => {},
                closed: false,
            };
            popupClient.monitorPopupForHash(popup, window).catch((error) => {
                expect(error.errorCode).toEqual("user_cancelled");
                done();
            });

            setTimeout(() => {
                //@ts-ignore
                popup.closed = true;
            }, 50);
        });

        it("resolves when popup is same origin and has a hash", (done) => {
            const popup: Window = {
                //@ts-ignore
                location: {
                    href: "about:blank",
                    hash: "",
                },
                close: () => {},
                closed: false,
            };
            popupClient.monitorPopupForHash(popup, window).then((hash) => {
                expect(hash).toEqual("code=testCode");
                done();
            });

            setTimeout(() => {
                popup.location.href = "http://localhost";
                popup.location.hash = "code=testCode";
            }, 50);
        });

        it("throws timeout if popup is same origin but no hash is present", async () => {
            const popup = {
                location: {
                    href: "http://localhost",
                    hash: "",
                },
                close: () => {},
            };

            pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                },
                system: {
                    windowHashTimeout: 10,
                },
            });

            await pca.initialize();

            //PCA implementation moved to controller
            pca = (pca as any).controller;

            //@ts-ignore
            popupClient = new PopupClient(
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
                pca.performanceClient,
                //@ts-ignore
                pca.nativeInternalStorage,
                undefined,
                TEST_CONFIG.CORRELATION_ID
            );

            const result = await popupClient
                .monitorPopupForHash(popup as Window, window)
                .catch((e) => {
                    expect(e.errorCode).toEqual(
                        BrowserAuthErrorMessage.monitorPopupTimeoutError.code
                    );
                });
        });

        it("returns hash", (done) => {
            const popup = {
                location: {
                    href: "http://localhost/#/code=hello",
                    hash: "#code=hello",
                },
                history: {
                    replaceState: () => {
                        return;
                    },
                },
                close: () => {},
            };

            popupClient
                .monitorPopupForHash(popup as unknown as Window, window)
                .then((hash: string) => {
                    expect(hash).toEqual("#code=hello");
                    done();
                });
        });

        it("returns server code response in query form when serverResponseType in OIDCOptions is query", async () => {
            pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                    protocolMode: ProtocolMode.OIDC,
                    OIDCOptions: { serverResponseType: "query" },
                },
            });

            await pca.initialize();

            //Implementation of PCA was moved to controller.
            pca = (pca as any).controller;

            popupClient = new PopupClient(
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
                pca.performanceClient,
                //@ts-ignore
                pca.nativeInternalStorage,
                undefined,
                TEST_CONFIG.CORRELATION_ID
            );

            const popup = {
                location: {
                    href: TEST_URIS.TEST_QUERY_CODE_RESPONSE,
                    search: "?code=authCode",
                },
                history: {
                    replaceState: () => {
                        return;
                    },
                },
                close: () => {},
            };

            const result = await popupClient.monitorPopupForHash(
                popup as unknown as Window,
                window
            );
            expect(result).toEqual("?code=authCode");
        });

        it("closed", (done) => {
            const popup = {
                location: {
                    href: "http://localhost",
                    hash: "",
                },
                close: () => {},
                closed: true,
            };

            popupClient
                .monitorPopupForHash(popup as unknown as Window, window)
                .catch((error: AuthError) => {
                    expect(error.errorCode).toEqual("user_cancelled");
                    done();
                });
        });
    });

    describe("Name generation functions", () => {
        it("generatePopupName generates expected name", () => {
            const popupName = popupClient.generatePopupName(
                ["scope1", "scope2"],
                "https://login.microsoftonline.com/common"
            );

            expect(popupName).toEqual(
                `msal.${TEST_CONFIG.MSAL_CLIENT_ID}.scope1-scope2.https://login.microsoftonline.com/common.${TEST_CONFIG.CORRELATION_ID}`
            );
        });

        it("generateLogoutPopupName generates expected name when account passed in", () => {
            const testAccount: AccountInfo = {
                homeAccountId: "homeAccountId",
                localAccountId: "localAccountId",
                environment: "environment",
                tenantId: "tenant",
                username: "user",
            };
            const popupName = popupClient.generateLogoutPopupName({
                account: testAccount,
                correlationId: TEST_CONFIG.CORRELATION_ID,
            });

            expect(popupName).toEqual(
                `msal.${TEST_CONFIG.MSAL_CLIENT_ID}.homeAccountId.${TEST_CONFIG.CORRELATION_ID}`
            );
        });

        it("generateLogoutPopupName generates expected name when account not passed in", () => {
            const popupName = popupClient.generateLogoutPopupName({
                correlationId: TEST_CONFIG.CORRELATION_ID,
            });

            expect(popupName).toEqual(
                `msal.${TEST_CONFIG.MSAL_CLIENT_ID}.undefined.${TEST_CONFIG.CORRELATION_ID}`
            );
        });
    });

    describe("initiateAuthRequest()", () => {
        it("throws error if request uri is empty", () => {
            const testTokenReq: CommonAuthorizationCodeRequest = {
                authenticationScheme: AuthenticationScheme.BEARER,
                redirectUri: `${TEST_URIS.DEFAULT_INSTANCE}/`,
                code: "thisIsATestCode",
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                codeVerifier: TEST_CONFIG.TEST_VERIFIER,
                authority: `${Constants.DEFAULT_AUTHORITY}/`,
                correlationId: RANDOM_TEST_GUID,
            };
            expect(() =>
                popupClient.initiateAuthRequest("", {
                    popupName: "name",
                    popupWindowAttributes: {},
                    popupWindowParent: window,
                })
            ).toThrow(BrowserAuthErrorMessage.emptyNavigateUriError.desc);
            expect(() =>
                popupClient.initiateAuthRequest("", {
                    popupName: "name",
                    popupWindowAttributes: {},
                    popupWindowParent: window,
                })
            ).toThrow(BrowserAuthError);

            //@ts-ignore
            expect(() => popupClient.initiateAuthRequest(null, {})).toThrow(
                BrowserAuthErrorMessage.emptyNavigateUriError.desc
            );
            //@ts-ignore
            expect(() => popupClient.initiateAuthRequest(null, {})).toThrow(
                BrowserAuthError
            );
        });

        it("opens a popup window", (done) => {
            const testTokenReq: CommonAuthorizationCodeRequest = {
                redirectUri: `${TEST_URIS.DEFAULT_INSTANCE}/`,
                code: "thisIsATestCode",
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                codeVerifier: TEST_CONFIG.TEST_VERIFIER,
                authority: `${Constants.DEFAULT_AUTHORITY}/`,
                correlationId: RANDOM_TEST_GUID,
                authenticationScheme: AuthenticationScheme.BEARER,
            };
            window.focus = (): void => {
                return;
            };

            window.open = (
                url?: string | URL,
                target?: string,
                features?: string,
                replace?: boolean
            ): Window => {
                expect(
                    (url as string)?.startsWith(TEST_URIS.ALTERNATE_INSTANCE)
                ).toBe(true);
                done();
                return window;
            };

            popupClient.initiateAuthRequest(TEST_URIS.ALTERNATE_INSTANCE, {
                popupName: "name",
                popupWindowAttributes: {},
                popupWindowParent: window,
            });
        });
    });

    describe("initiateAuthRequest", () => {
        it("assigns urlNavigate if popup passed in", () => {
            const assignSpy = jest.fn();
            const focusSpy = jest.fn();

            const windowObject = {
                location: {
                    assign: assignSpy,
                },
                focus: focusSpy,
            };

            const testRequest: CommonAuthorizationCodeRequest = {
                redirectUri: "",
                code: "thisIsATestCode",
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                codeVerifier: TEST_CONFIG.TEST_VERIFIER,
                authority: `${Constants.DEFAULT_AUTHORITY}/`,
                correlationId: RANDOM_TEST_GUID,
                authenticationScheme: AuthenticationScheme.BEARER,
            };

            const popupWindow = popupClient.initiateAuthRequest(
                "http://localhost/#/code=hello",
                {
                    popup: windowObject as unknown as Window,
                    popupName: "name",
                    popupWindowAttributes: {},
                    popupWindowParent: window,
                }
            );

            expect(assignSpy).toHaveBeenCalledWith(
                "http://localhost/#/code=hello"
            );
            expect(popupWindow).toEqual(windowObject);
        });

        it("opens popup if no popup window is passed in", () => {
            jest.spyOn(window, "open").mockReturnValue(window);
            jest.spyOn(window, "focus").mockImplementation();

            const testRequest: CommonAuthorizationCodeRequest = {
                authenticationScheme: AuthenticationScheme.BEARER,
                redirectUri: "",
                code: "thisIsATestCode",
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                codeVerifier: TEST_CONFIG.TEST_VERIFIER,
                authority: `${Constants.DEFAULT_AUTHORITY}/`,
                correlationId: RANDOM_TEST_GUID,
            };

            const popupWindow = popupClient.initiateAuthRequest(
                "http://localhost/#/code=hello",
                {
                    popupName: "name",
                    popupWindowAttributes: {},
                    popupWindowParent: window,
                }
            );

            expect(popupWindow).toEqual(window);
        });

        it("opens popup using passed window parent", () => {
            const popupWindowParent = {
                open: jest.fn((url, target) => window),
                addEventListener: jest.fn(),
            };
            const windowOpenSpy = jest
                .spyOn(window, "open")
                .mockImplementation();
            jest.spyOn(window, "focus").mockImplementation();

            const popupWindow = popupClient.initiateAuthRequest(
                "http://localhost/#/code=hello",
                {
                    popupName: "name",
                    popupWindowAttributes: {},
                    popupWindowParent: popupWindowParent as unknown as Window,
                }
            );

            expect(popupWindow).toEqual(window);
            expect(windowOpenSpy).not.toHaveBeenCalled();
            expect(popupWindowParent.open).toHaveBeenCalledWith(
                "http://localhost/#/code=hello",
                "name",
                expect.anything()
            );
            expect(popupWindowParent.addEventListener).toHaveBeenCalledWith(
                "beforeunload",
                expect.anything()
            );
        });

        it("throws error if no popup passed in but window.open returns null", () => {
            jest.spyOn(window, "open").mockClear().mockReturnValue(null);

            const testRequest: CommonAuthorizationCodeRequest = {
                redirectUri: `${TEST_URIS.DEFAULT_INSTANCE}/`,
                code: "thisIsATestCode",
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                codeVerifier: TEST_CONFIG.TEST_VERIFIER,
                authority: `${Constants.DEFAULT_AUTHORITY}/`,
                correlationId: RANDOM_TEST_GUID,
                authenticationScheme: AuthenticationScheme.BEARER,
            };

            expect(() =>
                popupClient.initiateAuthRequest(
                    "http://localhost/#/code=hello",
                    {
                        popupName: "name",
                        popupWindowAttributes: {},
                        popupWindowParent: window,
                    }
                )
            ).toThrow(
                createBrowserAuthError(BrowserAuthErrorCodes.popupWindowError)
            );
        });

        it("throws error if popup passed in is null", () => {
            const testRequest: CommonAuthorizationCodeRequest = {
                redirectUri: `${TEST_URIS.DEFAULT_INSTANCE}/`,
                code: "thisIsATestCode",
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                codeVerifier: TEST_CONFIG.TEST_VERIFIER,
                authority: `${Constants.DEFAULT_AUTHORITY}/`,
                correlationId: RANDOM_TEST_GUID,
                authenticationScheme: AuthenticationScheme.BEARER,
            };
            expect(() =>
                popupClient.initiateAuthRequest(
                    "http://localhost/#/code=hello",
                    {
                        popup: null,
                        popupName: "name",
                        popupWindowAttributes: {},
                        popupWindowParent: window,
                    }
                )
            ).toThrow(
                createBrowserAuthError(BrowserAuthErrorCodes.popupWindowError)
            );
        });
    });
});
