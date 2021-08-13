/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import sinon from "sinon";
import { PublicClientApplication } from "../../src/app/PublicClientApplication";
import { TEST_CONFIG, TEST_URIS, TEST_HASHES, TEST_TOKENS, TEST_DATA_CLIENT_INFO, TEST_TOKEN_LIFETIMES, RANDOM_TEST_GUID, testNavUrl, TEST_STATE_VALUES } from "../utils/StringConstants";
import { Constants, AccountInfo, TokenClaims, AuthenticationResult, CommonAuthorizationUrlRequest, AuthorizationCodeClient, ResponseMode, AuthenticationScheme, ServerTelemetryEntity } from "@azure/msal-common";
import { BrowserConstants, TemporaryCacheKeys, ApiId } from "../../src/utils/BrowserConstants";
import { BrowserAuthError } from "../../src/error/BrowserAuthError";
import { PopupHandler } from "../../src/interaction_handler/PopupHandler";
import { CryptoOps } from "../../src/crypto/CryptoOps";
import { NavigationClient } from "../../src/navigation/NavigationClient";
import { PopupUtils } from "../../src/utils/PopupUtils";
import { EndSessionPopupRequest } from "../../src/request/EndSessionPopupRequest";
import { PopupClient } from "../../src/interaction_client/PopupClient";

describe("PopupClient", () => {
    let popupClient: PopupClient;
    beforeEach(() => {
        const pca = new PublicClientApplication({
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID
            }
        });
        //@ts-ignore
        popupClient = new PopupClient(pca.config, pca.browserStorage, pca.browserCrypto, pca.logger, pca.eventHandler, pca.navigationClient);
    });

    afterEach(() => {
        sinon.restore();
        window.location.hash = "";
        window.sessionStorage.clear();
        window.localStorage.clear();
    });

    describe("acquireToken", () => {
        beforeEach(() => {
            const popupWindow = {
                ...window,
                close: () => {}
            };
            // @ts-ignore
            sinon.stub(window, "open").returns(popupWindow);
        });

        afterEach(() => {
            window.localStorage.clear();
            window.sessionStorage.clear();
            sinon.restore();
        });

        it("throws error if interaction is in progress", async () => {
            window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.INTERACTION_STATUS_KEY}`, BrowserConstants.INTERACTION_IN_PROGRESS_VALUE);

            await expect(popupClient.acquireToken({scopes:[]})).rejects.toMatchObject(BrowserAuthError.createInteractionInProgressError());
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
                authenticationScheme: TEST_CONFIG.TOKEN_TYPE_BEARER as AuthenticationScheme
            };

            sinon.stub(CryptoOps.prototype, "generatePkceCodes").resolves({
                challenge: TEST_CONFIG.TEST_CHALLENGE,
                verifier: TEST_CONFIG.TEST_VERIFIER
            });

            const popupSpy = sinon.stub(PopupUtils, "openSizedPopup");

            try {
                await popupClient.acquireToken(request);
            } catch(e) {}
            expect(popupSpy.getCall(0).args).toHaveLength(2);
        });

        it("opens popups asynchronously if configured", async () => {
            const pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID
                },
                system: {
                    asyncPopups: true
                }
            });
            //@ts-ignore
            popupClient = new PopupClient(pca.config, pca.browserStorage, pca.browserCrypto, pca.logger, pca.eventHandler, pca.navigationClient);

            sinon.stub(CryptoOps.prototype, "generatePkceCodes").resolves({
                challenge: TEST_CONFIG.TEST_CHALLENGE,
                verifier: TEST_CONFIG.TEST_VERIFIER
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
                authenticationScheme: TEST_CONFIG.TOKEN_TYPE_BEARER as AuthenticationScheme
            };

            const popupSpy = sinon.stub(PopupUtils, "openSizedPopup");

            try {
                await popupClient.acquireToken(request);
            } catch(e) {}
            expect(popupSpy.calledOnce).toBeTruthy();
            expect(popupSpy.getCall(0).args).toHaveLength(2);
            expect(popupSpy.getCall(0).args[0].startsWith(TEST_URIS.TEST_AUTH_ENDPT)).toBeTruthy();
            expect(popupSpy.getCall(0).args[0]).toContain(`client_id=${encodeURIComponent(TEST_CONFIG.MSAL_CLIENT_ID)}`);
            expect(popupSpy.getCall(0).args[0]).toContain(`redirect_uri=${encodeURIComponent(request.redirectUri)}`);
            expect(popupSpy.getCall(0).args[0]).toContain(`login_hint=${encodeURIComponent(request.loginHint || "")}`);
        });

        it("resolves the response successfully", async () => {
            const testServerTokenResponse = {
                token_type: TEST_CONFIG.TOKEN_TYPE_BEARER,
                scope: TEST_CONFIG.DEFAULT_SCOPES.join(" "),
                expires_in: TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN,
                ext_expires_in: TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN,
                access_token: TEST_TOKENS.ACCESS_TOKEN,
                refresh_token: TEST_TOKENS.REFRESH_TOKEN,
                id_token: TEST_TOKENS.IDTOKEN_V2
            };
            const testIdTokenClaims: TokenClaims = {
                "ver": "2.0",
                "iss": "https://login.microsoftonline.com/9188040d-6c67-4c5b-b112-36a304b66dad/v2.0",
                "sub": "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
                "name": "Abe Lincoln",
                "preferred_username": "AbeLi@microsoft.com",
                "oid": "00000000-0000-0000-66f3-3332eca7ea81",
                "tid": "3338040d-6c67-4c5b-b112-36a304b66dad",
                "nonce": "123523",
            };
            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: testIdTokenClaims.tid || "",
                username: testIdTokenClaims.preferred_username || ""
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
                expiresOn: new Date(Date.now() + (testServerTokenResponse.expires_in * 1000)),
                account: testAccount,
                tokenType: AuthenticationScheme.BEARER
            };
            sinon.stub(AuthorizationCodeClient.prototype, "getAuthCodeUrl").resolves(testNavUrl);
            sinon.stub(PopupHandler.prototype, "initiateAuthRequest").callsFake((requestUrl: string): Window => {
                expect(requestUrl).toEqual(testNavUrl);
                return window;
            });
            sinon.stub(PopupHandler.prototype, "monitorPopupForHash").resolves(TEST_HASHES.TEST_SUCCESS_CODE_HASH_POPUP);
            sinon.stub(PopupHandler.prototype, "handleCodeResponse").resolves(testTokenResponse);
            sinon.stub(CryptoOps.prototype, "generatePkceCodes").resolves({
                challenge: TEST_CONFIG.TEST_CHALLENGE,
                verifier: TEST_CONFIG.TEST_VERIFIER
            });
            sinon.stub(CryptoOps.prototype, "createNewGuid").returns(RANDOM_TEST_GUID);
            const tokenResp = await popupClient.acquireToken({
                redirectUri: TEST_URIS.TEST_REDIR_URI,
                scopes: TEST_CONFIG.DEFAULT_SCOPES
            });
            expect(tokenResp).toEqual(testTokenResponse);
        });

        it("catches error and cleans cache before rethrowing", async () => {
            const testError = {
                errorCode: "create_login_url_error",
                errorMessage: "Error in creating a login url"
            };
            sinon.stub(AuthorizationCodeClient.prototype, "getAuthCodeUrl").resolves(testNavUrl);
            sinon.stub(PopupHandler.prototype, "initiateAuthRequest").throws(testError);
            sinon.stub(CryptoOps.prototype, "generatePkceCodes").resolves({
                challenge: TEST_CONFIG.TEST_CHALLENGE,
                verifier: TEST_CONFIG.TEST_VERIFIER
            });
            sinon.stub(CryptoOps.prototype, "createNewGuid").returns(RANDOM_TEST_GUID);
            try {
                await popupClient.acquireToken({
                    redirectUri: TEST_URIS.TEST_REDIR_URI,
                    scopes: TEST_CONFIG.DEFAULT_SCOPES
                });
            } catch (e) {
                // Test that error was cached for telemetry purposes and then thrown
                expect(window.sessionStorage).toHaveLength(1);
                const failures = window.sessionStorage.getItem(`server-telemetry-${TEST_CONFIG.MSAL_CLIENT_ID}`);
                const failureObj = JSON.parse(failures || "") as ServerTelemetryEntity;
                expect(failureObj.failedRequests).toHaveLength(2);
                expect(failureObj.failedRequests[0]).toEqual(ApiId.acquireTokenPopup);
                expect(failureObj.errors[0]).toEqual(testError.errorCode);
                expect(e).toEqual(testError);
            }
        });
    });

    describe("logout", () => {
        beforeEach(() => {
            const popupWindow = {
                ...window,
                close: () => {}
            };
            // @ts-ignore
            sinon.stub(window, "open").returns(popupWindow);
        });

        afterEach(() => {
            window.localStorage.clear();
            window.sessionStorage.clear();
            sinon.restore();
        });

        it("throws error if interaction is in progress", async () => {
            window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.INTERACTION_STATUS_KEY}`, BrowserConstants.INTERACTION_IN_PROGRESS_VALUE);

            await expect(popupClient.logout()).rejects.toMatchObject(BrowserAuthError.createInteractionInProgressError());
        });

        it("opens popup window before network request by default", async () => {
            const popupSpy = sinon.stub(PopupUtils, "openSizedPopup");

            try {
                await popupClient.logout();
            } catch(e) {}
            expect(popupSpy.getCall(0).args).toHaveLength(2);
        });

        it("opens popups asynchronously if configured", (done) => {
            const pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID
                },
                system: {
                    asyncPopups: true
                }
            });
            //@ts-ignore
            popupClient = new PopupClient(pca.config, pca.browserStorage, pca.browserCrypto, pca.logger, pca.eventHandler, pca.navigationClient);

            sinon.stub(PopupUtils, "openSizedPopup").callsFake((urlNavigate, popupName) => {
                expect(urlNavigate.startsWith(TEST_URIS.TEST_END_SESSION_ENDPOINT)).toBeTruthy();
                expect(popupName.startsWith(`msal.${TEST_CONFIG.MSAL_CLIENT_ID}`)).toBeTruthy();
                done();
                return null;
            });

            popupClient.logout().catch(() => {});
        });

        it("catches error and cleans cache before rethrowing", async () => {
            const testError = {
                errorCode: "create_logout_url_error",
                errorMessage: "Error in creating a logout url"
            };
            sinon.stub(AuthorizationCodeClient.prototype, "getLogoutUri").throws(testError);

            try {
                await popupClient.logout();
            } catch (e) {
                // Test that error was cached for telemetry purposes and then thrown
                expect(window.sessionStorage).toHaveLength(1);
                const failures = window.sessionStorage.getItem(`server-telemetry-${TEST_CONFIG.MSAL_CLIENT_ID}`);
                const failureObj = JSON.parse(failures || "") as ServerTelemetryEntity;
                expect(failureObj.failedRequests).toHaveLength(2);
                expect(failureObj.failedRequests[0]).toEqual(ApiId.logoutPopup);
                expect(failureObj.errors[0]).toEqual(testError.errorCode);
                expect(e).toEqual(testError);
            }
        });

        it("includes postLogoutRedirectUri if one is passed", (done) => {
            const pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID
                },
                system: {
                    asyncPopups: true
                }
            });
            //@ts-ignore
            popupClient = new PopupClient(pca.config, pca.browserStorage, pca.browserCrypto, pca.logger, pca.eventHandler, pca.navigationClient);

            sinon.stub(PopupUtils, "openSizedPopup").callsFake((urlNavigate) => {
                expect(urlNavigate.startsWith(TEST_URIS.TEST_END_SESSION_ENDPOINT)).toBeTruthy();
                expect(urlNavigate).toContain(`post_logout_redirect_uri=${encodeURIComponent(postLogoutRedirectUri)}`);
                done();
                throw "Stop Test";
            });

            const postLogoutRedirectUri = "https://localhost:8000/logout";

            popupClient.logout({
                postLogoutRedirectUri
            }).catch(() => {});
        });

        it("includes postLogoutRedirectUri if one is configured", (done) => {
            const postLogoutRedirectUri = "https://localhost:8000/logout";
            const pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                    postLogoutRedirectUri
                },
                system: {
                    asyncPopups: true
                }
            });
            //@ts-ignore
            popupClient = new PopupClient(pca.config, pca.browserStorage, pca.browserCrypto, pca.logger, pca.eventHandler, pca.navigationClient);

            sinon.stub(PopupUtils, "openSizedPopup").callsFake((urlNavigate) => {
                expect(urlNavigate.startsWith(TEST_URIS.TEST_END_SESSION_ENDPOINT)).toBeTruthy();
                expect(urlNavigate).toContain(`post_logout_redirect_uri=${encodeURIComponent(postLogoutRedirectUri)}`);
                done();
                throw "Stop Test";
            });

            popupClient.logout().catch(() => {});
        });

        it("includes postLogoutRedirectUri as current page if none is set on request", (done) => {
            const pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID
                },
                system: {
                    asyncPopups: true
                }
            });
            //@ts-ignore
            popupClient = new PopupClient(pca.config, pca.browserStorage, pca.browserCrypto, pca.logger, pca.eventHandler, pca.navigationClient);
            
            sinon.stub(PopupUtils, "openSizedPopup").callsFake((urlNavigate) => {
                expect(urlNavigate.startsWith(TEST_URIS.TEST_END_SESSION_ENDPOINT)).toBeTruthy();
                expect(urlNavigate).toContain(`post_logout_redirect_uri=${encodeURIComponent(window.location.href)}`);
                done();
                throw "Stop Test";
            });

            popupClient.logout().catch(() => {});
        });

        it("redirects main window when logout is complete", (done) => {
            const popupWindow = {...window};
            sinon.stub(PopupUtils, "openSizedPopup").returns(popupWindow);
            sinon.stub(PopupUtils.prototype, "openPopup").returns(popupWindow);
            sinon.stub(PopupUtils.prototype, "cleanPopup");
            sinon.stub(NavigationClient.prototype, "navigateInternal").callsFake((url, navigationOptions) => {
                expect(url.endsWith("/home")).toBeTruthy();
                expect(navigationOptions.apiId).toEqual(ApiId.logoutPopup);
                done();
                return Promise.resolve(false);
            });

            const request: EndSessionPopupRequest = {
                mainWindowRedirectUri: "/home"
            };

            popupClient.logout(request);
        });

        it("closing the popup does not throw", (done) => {
            const popupWindow = {...window};
            sinon.stub(PopupUtils, "openSizedPopup").returns(popupWindow);
            popupWindow.closed = true;
            sinon.stub(PopupUtils.prototype, "openPopup").returns(popupWindow);
            sinon.stub(PopupUtils.prototype, "cleanPopup");

            popupClient.logout().then(() => {
                done();
            });
        });
    });
});