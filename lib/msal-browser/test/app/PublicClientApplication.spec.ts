/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import sinon from "sinon";
import { PublicClientApplication } from "../../src/app/PublicClientApplication";
import { TEST_CONFIG, TEST_URIS, TEST_TOKENS, TEST_DATA_CLIENT_INFO, TEST_TOKEN_LIFETIMES, RANDOM_TEST_GUID, testNavUrl, testLogoutUrl, TEST_STATE_VALUES, TEST_HASHES, DEFAULT_TENANT_DISCOVERY_RESPONSE, DEFAULT_OPENID_CONFIG_RESPONSE, testNavUrlNoRequest } from "../utils/StringConstants";
import { ServerError, Constants, AccountInfo, TokenClaims, AuthenticationResult, CommonAuthorizationUrlRequest, AuthorizationCodeClient, ResponseMode, AccountEntity, ProtocolUtils, AuthenticationScheme, RefreshTokenClient, Logger, ServerTelemetryEntity, CommonSilentFlowRequest, LogLevel, CommonAuthorizationCodeRequest } from "@azure/msal-common";
import { ApiId, InteractionType, WrapperSKU, TemporaryCacheKeys, BrowserConstants, BrowserCacheLocation } from "../../src/utils/BrowserConstants";
import { CryptoOps } from "../../src/crypto/CryptoOps";
import { EventType } from "../../src/event/EventType";
import { SilentRequest } from "../../src/request/SilentRequest";
import { NavigationClient } from "../../src/navigation/NavigationClient";
import { NavigationOptions } from "../../src/navigation/NavigationOptions";
import { PopupUtils } from "../../src/utils/PopupUtils";
import { EventMessage } from "../../src/event/EventMessage";
import { EventHandler } from "../../src/event/EventHandler";
import { SilentIframeClient } from "../../src/interaction_client/SilentIframeClient";
import { Base64Encode } from "../../src/encode/Base64Encode";
import { XhrClient } from "../../src/network/XhrClient";
import { BrowserAuthError, BrowserAuthErrorMessage } from "../../src/error/BrowserAuthError";
import { BrowserUtils } from "../../src/utils/BrowserUtils";
import { RedirectClient } from "../../src/interaction_client/RedirectClient";
import { PopupClient } from "../../src/interaction_client/PopupClient";
import { SilentCacheClient } from "../../src/interaction_client/SilentCacheClient";
import { SilentRefreshClient } from "../../src/interaction_client/SilentRefreshClient";
import { EndSessionRequest, BrowserConfigurationAuthError } from "../../src";
import { RedirectHandler } from "../../src/interaction_handler/RedirectHandler";

describe("PublicClientApplication.ts Class Unit Tests", () => {
    let pca: PublicClientApplication;
    beforeEach(() => {
        pca = new PublicClientApplication({
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID
            }
        });
    });

    afterEach(() => {
        sinon.restore();
        window.location.hash = "";
        window.sessionStorage.clear();
        window.localStorage.clear();
    });

    describe("Constructor tests", () => {
        it("passes null check", (done) => {
            expect(pca).not.toBe(null);
            expect(pca instanceof PublicClientApplication).toBeTruthy();
            done();
        });
    });

    describe("handleRedirectPromise", () => {
        it("Calls RedirectClient.handleRedirectPromise and returns its response", async () => {
            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: "3338040d-6c67-4c5b-b112-36a304b66dad",
                username: "AbeLi@microsoft.com"
            };
            const testTokenResponse: AuthenticationResult = {
                authority: TEST_CONFIG.validAuthority,
                uniqueId: testAccount.localAccountId,
                tenantId: testAccount.tenantId,
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                idToken: "test-idToken",
                idTokenClaims: {},
                accessToken: "test-accessToken",
                fromCache: false,
                correlationId: RANDOM_TEST_GUID,
                expiresOn: new Date(Date.now() + 3600000),
                account: testAccount,
                tokenType: AuthenticationScheme.BEARER
            };
            const redirectClientSpy = sinon.stub(RedirectClient.prototype, "handleRedirectPromise").callsFake(() => {
                sinon.stub(pca, "getAllAccounts").returns([testAccount]);
                return Promise.resolve(testTokenResponse);
            });
            let loginSuccessFired = false;
            sinon.stub(EventHandler.prototype, "emitEvent").callsFake((eventType) => {
                if (eventType === EventType.LOGIN_SUCCESS) {
                    loginSuccessFired = true;
                }
            });
            const response = await pca.handleRedirectPromise();
            expect(response).toEqual(testTokenResponse);
            expect(redirectClientSpy.calledOnce).toBe(true);
            expect(loginSuccessFired).toBe(true);
        });

        it("Emits acquireToken success event if user was already signed in", async () => {
            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: "3338040d-6c67-4c5b-b112-36a304b66dad",
                username: "AbeLi@microsoft.com"
            };
            const testTokenResponse: AuthenticationResult = {
                authority: TEST_CONFIG.validAuthority,
                uniqueId: testAccount.localAccountId,
                tenantId: testAccount.tenantId,
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                idToken: "test-idToken",
                idTokenClaims: {},
                accessToken: "test-accessToken",
                fromCache: false,
                correlationId: RANDOM_TEST_GUID,
                expiresOn: new Date(Date.now() + 3600000),
                account: testAccount,
                tokenType: AuthenticationScheme.BEARER
            };
            sinon.stub(pca, "getAllAccounts").returns([testAccount]);
            const redirectClientSpy = sinon.stub(RedirectClient.prototype, "handleRedirectPromise").resolves(testTokenResponse);
            let acquireTokenSuccessFired = false;
            sinon.stub(EventHandler.prototype, "emitEvent").callsFake((eventType) => {
                if (eventType === EventType.ACQUIRE_TOKEN_SUCCESS) {
                    acquireTokenSuccessFired = true;
                }
            });

            const response = await pca.handleRedirectPromise();
            expect(response).toEqual(testTokenResponse);
            expect(redirectClientSpy.calledOnce).toBe(true);
            expect(acquireTokenSuccessFired).toBe(true);
        });

        it("Emits login failure event if user was already signed in", async () => {
            const redirectClientSpy = sinon.stub(RedirectClient.prototype, "handleRedirectPromise").rejects("Error");
            let loginFailureFired = false;
            sinon.stub(EventHandler.prototype, "emitEvent").callsFake((eventType) => {
                if (eventType === EventType.LOGIN_FAILURE) {
                    loginFailureFired = true;
                }
            });

            await pca.handleRedirectPromise().catch(() => {
                expect(redirectClientSpy.calledOnce).toBe(true);
                expect(loginFailureFired).toBe(true);
            });
        });

        it("Emits acquireToken failure event if user was already signed in", async () => {
            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: "3338040d-6c67-4c5b-b112-36a304b66dad",
                username: "AbeLi@microsoft.com"
            };
            sinon.stub(pca, "getAllAccounts").returns([testAccount]);
            const redirectClientSpy = sinon.stub(RedirectClient.prototype, "handleRedirectPromise").rejects("Error");
            let acquireTokenFailureFired = false;
            sinon.stub(EventHandler.prototype, "emitEvent").callsFake((eventType) => {
                if (eventType === EventType.ACQUIRE_TOKEN_FAILURE) {
                    acquireTokenFailureFired = true;
                }
            });

            await pca.handleRedirectPromise().catch(() => {
                expect(redirectClientSpy.calledOnce).toBe(true);
                expect(acquireTokenFailureFired).toBe(true);
            });
        });

        it("Multiple concurrent calls to handleRedirectPromise return the same promise", async () => {
            const b64Encode = new Base64Encode();
            const stateString = TEST_STATE_VALUES.TEST_STATE_REDIRECT;
            const browserCrypto = new CryptoOps();
            const stateId = ProtocolUtils.parseRequestState(browserCrypto, stateString).libraryState.id;

            window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.ORIGIN_URI}`, TEST_URIS.TEST_REDIR_URI);
            window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.AUTHORITY}.${stateId}`, TEST_CONFIG.validAuthority);
            window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.REQUEST_STATE}.${stateId}`, TEST_STATE_VALUES.TEST_STATE_REDIRECT);
            window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.URL_HASH}`, TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT);
            window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.INTERACTION_STATUS_KEY}`, BrowserConstants.INTERACTION_IN_PROGRESS_VALUE);
            window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.NONCE_IDTOKEN}.${stateId}`, "123523");
            const testTokenReq: CommonAuthorizationCodeRequest = {
                redirectUri: `${TEST_URIS.DEFAULT_INSTANCE}/`,
                code: "thisIsATestCode",
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                codeVerifier: TEST_CONFIG.TEST_VERIFIER,
                authority: `${Constants.DEFAULT_AUTHORITY}`,
                correlationId: RANDOM_TEST_GUID,
                authenticationScheme: TEST_CONFIG.TOKEN_TYPE_BEARER as AuthenticationScheme
            };
            window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.REQUEST_PARAMS}`, b64Encode.encode(JSON.stringify(testTokenReq)));
            const testServerTokenResponse = {
                headers: {},
                status: 200,
                body: {
                    token_type: TEST_CONFIG.TOKEN_TYPE_BEARER,
                    scope: TEST_CONFIG.DEFAULT_SCOPES.join(" "),
                    expires_in: TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN,
                    ext_expires_in: TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN,
                    access_token: TEST_TOKENS.ACCESS_TOKEN,
                    refresh_token: TEST_TOKENS.REFRESH_TOKEN,
                    id_token: TEST_TOKENS.IDTOKEN_V2,
                    client_info: TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO
                }
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
                idToken: testServerTokenResponse.body.id_token,
                idTokenClaims: testIdTokenClaims,
                accessToken: testServerTokenResponse.body.access_token,
                fromCache: false,
                correlationId: RANDOM_TEST_GUID,
                expiresOn: new Date(Date.now() + (testServerTokenResponse.body.expires_in * 1000)),
                account: testAccount,
                tokenType: AuthenticationScheme.BEARER
            };
            sinon.stub(XhrClient.prototype, "sendGetRequestAsync").callsFake((url): any => {
                if (url.includes("discovery/instance")) {
                    return DEFAULT_TENANT_DISCOVERY_RESPONSE;
                } else if (url.includes(".well-known/openid-configuration")) {
                    return DEFAULT_OPENID_CONFIG_RESPONSE;
                }
            });
            sinon.stub(XhrClient.prototype, "sendPostRequestAsync").resolves(testServerTokenResponse);
            pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID
                }
            });

            const promise1 = pca.handleRedirectPromise();
            const promise2 = pca.handleRedirectPromise();
            const tokenResponse1 = await promise1;
            const tokenResponse2 = await promise2;
            const tokenResponse3 = await pca.handleRedirectPromise("testHash");
            expect(tokenResponse3).toBe(null);
            const tokenResponse4 = await pca.handleRedirectPromise();

            if (!tokenResponse1 || !tokenResponse2) {
                throw "This should not throw. Both responses should be non-null."
            }

            // Response from first promise
            expect(tokenResponse1.uniqueId).toEqual(testTokenResponse.uniqueId);
            expect(tokenResponse1.tenantId).toEqual(testTokenResponse.tenantId);
            expect(tokenResponse1.scopes).toEqual(testTokenResponse.scopes);
            expect(tokenResponse1.idToken).toEqual(testTokenResponse.idToken);
            expect(tokenResponse1.idTokenClaims).toEqual(expect.objectContaining(testTokenResponse.idTokenClaims));
            expect(tokenResponse1.accessToken).toEqual(testTokenResponse.accessToken);
            expect(testTokenResponse.expiresOn && tokenResponse1.expiresOn && testTokenResponse.expiresOn.getMilliseconds() >= tokenResponse1.expiresOn.getMilliseconds()).toBeTruthy();
            
            // Response from second promise
            expect(tokenResponse2.uniqueId).toEqual(testTokenResponse.uniqueId);
            expect(tokenResponse2.tenantId).toEqual(testTokenResponse.tenantId);
            expect(tokenResponse2.scopes).toEqual(testTokenResponse.scopes);
            expect(tokenResponse2.idToken).toEqual(testTokenResponse.idToken);
            expect(tokenResponse2.idTokenClaims).toEqual(expect.objectContaining(testTokenResponse.idTokenClaims));
            expect(tokenResponse2.accessToken).toEqual(testTokenResponse.accessToken);
            expect(testTokenResponse.expiresOn && tokenResponse2.expiresOn && testTokenResponse.expiresOn.getMilliseconds() >= tokenResponse2.expiresOn.getMilliseconds()).toBeTruthy();

            expect(tokenResponse1).toEqual(tokenResponse2);
            expect(tokenResponse4).toEqual(tokenResponse1);
            expect(window.sessionStorage.length).toEqual(4);
        });
    });

    describe("loginRedirect", () => {
        it("Uses default request if no request provided", (done) => {
            sinon.stub(pca, "acquireTokenRedirect").callsFake(async (request): Promise<void> => {
                expect(request.scopes).toContain("openid");
                expect(request.scopes).toContain("profile");
                done();
                return;
            });

            pca.loginRedirect();
        });

        it("navigates to created login url, with empty request", (done) => {
            sinon.stub(RedirectHandler.prototype, "initiateAuthRequest").callsFake((navigateUrl): Promise<void> => {
                expect(navigateUrl.startsWith(testNavUrlNoRequest)).toBeTruthy();
                return Promise.resolve(done());
            });
            sinon.stub(CryptoOps.prototype, "generatePkceCodes").resolves({
                challenge: TEST_CONFIG.TEST_CHALLENGE,
                verifier: TEST_CONFIG.TEST_VERIFIER
            });
            sinon.stub(CryptoOps.prototype, "createNewGuid").returns(RANDOM_TEST_GUID);

            // @ts-ignore
            pca.loginRedirect(null);
        });
    });

    describe("acquireTokenRedirect", () => {
        it("throws error if called in a popup", (done) => {
            const oldWindowOpener = window.opener;
            const oldWindowName = window.name;
            const newWindow = {
                ...window
            };
            
            delete window.opener;
            delete window.name;
            window.opener = newWindow;
            window.name = "msal.testPopup"

            sinon.stub(BrowserUtils, "isInIframe").returns(false);
            pca.acquireTokenRedirect({scopes: ["openid"]}).catch(e => {
                expect(e).toBeInstanceOf(BrowserAuthError);
                expect(e.errorCode).toEqual(BrowserAuthErrorMessage.blockAcquireTokenInPopupsError.code);
                expect(e.errorMessage).toEqual(BrowserAuthErrorMessage.blockAcquireTokenInPopupsError.desc);
                done();
            }).finally(() => {
                window.name = oldWindowName;
                window.opener = oldWindowOpener;
            });
        });

        it("throws an error if inside an iframe", async () => {
            sinon.stub(BrowserUtils, "isInIframe").returns(true);
            await expect(pca.acquireTokenRedirect({ scopes: [] })).rejects.toMatchObject(BrowserAuthError.createRedirectInIframeError(true));
        });

        it("throws error if cacheLocation is Memory Storage and storeAuthStateInCookie is false", async () =>{
            pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID
                },
                cache: {
                    cacheLocation: BrowserCacheLocation.MemoryStorage,
                    storeAuthStateInCookie: false
                }
            });

            await expect(pca.acquireTokenRedirect({scopes: []})).rejects.toMatchObject(BrowserConfigurationAuthError.createInMemoryRedirectUnavailableError());
        });

        it("Calls RedirectClient.acquireToken and returns its response", async () => {
            const redirectClientSpy = sinon.stub(RedirectClient.prototype, "acquireToken").resolves();

            const response = await pca.acquireTokenRedirect({scopes: ["openid"]});
            expect(response).toEqual(undefined);
            expect(redirectClientSpy.calledOnce).toBe(true);
        });

        it("Emits acquireToken Start and Failure events if user is already logged in", async () => {
            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: "3338040d-6c67-4c5b-b112-36a304b66dad",
                username: "AbeLi@microsoft.com"
            };

            sinon.stub(pca, "getAllAccounts").returns([testAccount]);
            const redirectClientSpy = sinon.stub(RedirectClient.prototype, "acquireToken").rejects("Error");
            let acquireTokenStartEmitted = false;
            let acquireTokenFailureEmitted = false;
            sinon.stub(EventHandler.prototype, "emitEvent").callsFake((eventType) => {
                if (eventType === EventType.ACQUIRE_TOKEN_START) {
                    acquireTokenStartEmitted = true;
                } else if (eventType === EventType.ACQUIRE_TOKEN_FAILURE) {
                    acquireTokenFailureEmitted = true;
                }
            });

            await pca.acquireTokenRedirect({scopes: ["openid"]}).catch(() => {
                expect(redirectClientSpy.calledOnce).toBe(true);
                expect(acquireTokenStartEmitted).toBe(true);
                expect(acquireTokenFailureEmitted).toBe(true);
            });
        });

        it("Emits login Start and Failure events if no user is logged in", async () => {
            const redirectClientSpy = sinon.stub(RedirectClient.prototype, "acquireToken").rejects("Error");
            let loginStartEmitted = false;
            let loginFailureEmitted = false;
            sinon.stub(EventHandler.prototype, "emitEvent").callsFake((eventType) => {
                if (eventType === EventType.LOGIN_START) {
                    loginStartEmitted = true;
                } else if (eventType === EventType.LOGIN_FAILURE) {
                    loginFailureEmitted = true;
                }
            });

            await pca.acquireTokenRedirect({scopes: ["openid"]}).catch(() => {
                expect(redirectClientSpy.calledOnce).toBe(true);
                expect(loginStartEmitted).toBe(true);
                expect(loginFailureEmitted).toBe(true);
            });
        });
    });

    describe("loginPopup", () => {
        beforeEach(() => {
            const popupWindow = {
                ...window,
                close: () => {}
            };
            // @ts-ignore
            sinon.stub(window, "open").returns(popupWindow);
        });

        it("Uses default request if no request provided", (done) => {
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
                fromCache: false,
                correlationId: RANDOM_TEST_GUID,
                expiresOn: new Date(Date.now() + (testServerTokenResponse.expires_in * 1000)),
                account: testAccount,
                tokenType: AuthenticationScheme.BEARER
            };
            sinon.stub(pca, "acquireTokenPopup").callsFake(async (request) => {
                expect(request.scopes).toContain("openid");
                expect(request.scopes).toContain("profile");
                done();
                
                return testTokenResponse;
            });

            pca.loginPopup();
        });
    });

    describe("acquireTokenPopup", () => {
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

        it("Calls PopupClient.acquireToken and returns its response", async () => {
            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: "3338040d-6c67-4c5b-b112-36a304b66dad",
                username: "AbeLi@microsoft.com"
            };
            const testTokenResponse: AuthenticationResult = {
                authority: TEST_CONFIG.validAuthority,
                uniqueId: testAccount.localAccountId,
                tenantId: testAccount.tenantId,
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                idToken: "test-idToken",
                idTokenClaims: {},
                accessToken: "test-accessToken",
                fromCache: false,
                correlationId: RANDOM_TEST_GUID,
                expiresOn: new Date(Date.now() + 3600000),
                account: testAccount,
                tokenType: AuthenticationScheme.BEARER
            };
            const popupClientSpy = sinon.stub(PopupClient.prototype, "acquireToken").resolves(testTokenResponse);

            const response = await pca.acquireTokenPopup({scopes: ["openid"]});
            expect(response).toEqual(testTokenResponse);
            expect(popupClientSpy.calledOnce).toBe(true);
        });

        it("Emits Login Start and Success Events if no user is signed in", async () => {
            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: "3338040d-6c67-4c5b-b112-36a304b66dad",
                username: "AbeLi@microsoft.com"
            };
            const testTokenResponse: AuthenticationResult = {
                authority: TEST_CONFIG.validAuthority,
                uniqueId: testAccount.localAccountId,
                tenantId: testAccount.tenantId,
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                idToken: "test-idToken",
                idTokenClaims: {},
                accessToken: "test-accessToken",
                fromCache: false,
                correlationId: RANDOM_TEST_GUID,
                expiresOn: new Date(Date.now() + 3600000),
                account: testAccount,
                tokenType: AuthenticationScheme.BEARER
            };
            const popupClientSpy = sinon.stub(PopupClient.prototype, "acquireToken").callsFake(() => {
                sinon.stub(pca, "getAllAccounts").returns([testAccount]);
                return Promise.resolve(testTokenResponse);
            });
            let loginStartEmitted = false;
            let loginSuccessEmitted = false;
            sinon.stub(EventHandler.prototype, "emitEvent").callsFake((eventType) => {
                if (eventType === EventType.LOGIN_START) {
                    loginStartEmitted = true;
                } else if (eventType === EventType.LOGIN_SUCCESS) {
                    loginSuccessEmitted = true;
                }
            });

            const response = await pca.acquireTokenPopup({scopes: ["openid"]});
            expect(response).toEqual(testTokenResponse);
            expect(popupClientSpy.calledOnce).toBe(true);
            expect(loginStartEmitted).toBe(true);
            expect(loginSuccessEmitted).toBe(true);
        });

        it("Emits AcquireToken Start and Success Events if user is already signed in", async () => {
            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: "3338040d-6c67-4c5b-b112-36a304b66dad",
                username: "AbeLi@microsoft.com"
            };
            const testTokenResponse: AuthenticationResult = {
                authority: TEST_CONFIG.validAuthority,
                uniqueId: testAccount.localAccountId,
                tenantId: testAccount.tenantId,
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                idToken: "test-idToken",
                idTokenClaims: {},
                accessToken: "test-accessToken",
                fromCache: false,
                correlationId: RANDOM_TEST_GUID,
                expiresOn: new Date(Date.now() + 3600000),
                account: testAccount,
                tokenType: AuthenticationScheme.BEARER
            };
            sinon.stub(pca, "getAllAccounts").returns([testAccount]);
            const popupClientSpy = sinon.stub(PopupClient.prototype, "acquireToken").resolves(testTokenResponse);
            let acquireTokenStartEmitted = false;
            let acquireTokenSuccessEmitted = false;
            sinon.stub(EventHandler.prototype, "emitEvent").callsFake((eventType) => {
                if (eventType === EventType.ACQUIRE_TOKEN_START) {
                    acquireTokenStartEmitted = true;
                } else if (eventType === EventType.ACQUIRE_TOKEN_SUCCESS) {
                    acquireTokenSuccessEmitted = true;
                }
            });

            const response = await pca.acquireTokenPopup({scopes: ["openid"]});
            expect(response).toEqual(testTokenResponse);
            expect(popupClientSpy.calledOnce).toBe(true);
            expect(acquireTokenStartEmitted).toBe(true);
            expect(acquireTokenSuccessEmitted).toBe(true);
        });

        it("Emits AcquireToken Start and Failure events if a user is already logged in", async () => {
            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: "3338040d-6c67-4c5b-b112-36a304b66dad",
                username: "AbeLi@microsoft.com"
            };

            sinon.stub(pca, "getAllAccounts").returns([testAccount]);
            const popupClientSpy = sinon.stub(PopupClient.prototype, "acquireToken").rejects("Error");
            let acquireTokenStartEmitted = false;
            let acquireTokenFailureEmitted = false;
            sinon.stub(EventHandler.prototype, "emitEvent").callsFake((eventType) => {
                if (eventType === EventType.ACQUIRE_TOKEN_START) {
                    acquireTokenStartEmitted = true;
                } else if (eventType === EventType.ACQUIRE_TOKEN_FAILURE) {
                    acquireTokenFailureEmitted = true;
                }
            });

            await pca.acquireTokenPopup({scopes: ["openid"]}).catch(() => {
                expect(popupClientSpy.calledOnce).toBe(true);
                expect(acquireTokenStartEmitted).toBe(true);
                expect(acquireTokenFailureEmitted).toBe(true);
            });
        });

        it("Emits Login Start and Failure events if a user is not logged in", async () => {
            const popupClientSpy = sinon.stub(PopupClient.prototype, "acquireToken").rejects("Error");
            let loginStartEmitted = false;
            let loginFailureEmitted = false;
            sinon.stub(EventHandler.prototype, "emitEvent").callsFake((eventType) => {
                if (eventType === EventType.LOGIN_START) {
                    loginStartEmitted = true;
                } else if (eventType === EventType.LOGIN_FAILURE) {
                    loginFailureEmitted = true;
                }
            });

            await pca.acquireTokenPopup({scopes: ["openid"]}).catch(() => {
                expect(popupClientSpy.calledOnce).toBe(true);
                expect(loginStartEmitted).toBe(true);
                expect(loginFailureEmitted).toBe(true);
            });
        });

        it("throws error if called in a popup", (done) => {
            const oldWindowOpener = window.opener;
            const oldWindowName = window.name;

            const newWindow = {
                ...window
            };
            
            delete window.opener;
            delete window.name;
            window.opener = newWindow;
            window.name = "msal.testPopup"

            pca.acquireTokenPopup({scopes: ["openid"]}).catch(e => {
                expect(e).toBeInstanceOf(BrowserAuthError);
                expect(e.errorCode).toEqual(BrowserAuthErrorMessage.blockAcquireTokenInPopupsError.code);
                expect(e.errorMessage).toEqual(BrowserAuthErrorMessage.blockAcquireTokenInPopupsError.desc);
                done();
            }).finally(() => {
                window.name = oldWindowName;
                window.opener = oldWindowOpener;
            });
        });
    });

    describe("ssoSilent", () => {
        it("Calls SilentIframeClient.acquireToken and returns its response", async () => {
            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: "3338040d-6c67-4c5b-b112-36a304b66dad",
                username: "AbeLi@microsoft.com"
            };
            const testTokenResponse: AuthenticationResult = {
                authority: TEST_CONFIG.validAuthority,
                uniqueId: testAccount.localAccountId,
                tenantId: testAccount.tenantId,
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                idToken: "test-idToken",
                idTokenClaims: {},
                accessToken: "test-accessToken",
                fromCache: false,
                correlationId: RANDOM_TEST_GUID,
                expiresOn: new Date(Date.now() + 3600000),
                account: testAccount,
                tokenType: AuthenticationScheme.BEARER
            };
            const silentClientSpy = sinon.stub(SilentIframeClient.prototype, "acquireToken").resolves(testTokenResponse);

            const response = await pca.ssoSilent({scopes: ["openid"]});
            expect(response).toEqual(testTokenResponse);
            expect(silentClientSpy.calledOnce).toBe(true);
        });
    });

    describe("acquireTokenSilent", () => {
        it("throws No Account error if no account is provided", async () => {
            await expect(pca.acquireTokenSilent({scopes: []})).rejects.toMatchObject(BrowserAuthError.createNoAccountError());
        });

        it("Calls SilentCacheClient.acquireToken and returns its response", async () => {
            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: "3338040d-6c67-4c5b-b112-36a304b66dad",
                username: "AbeLi@microsoft.com"
            };
            const testTokenResponse: AuthenticationResult = {
                authority: TEST_CONFIG.validAuthority,
                uniqueId: testAccount.localAccountId,
                tenantId: testAccount.tenantId,
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                idToken: "test-idToken",
                idTokenClaims: {},
                accessToken: "test-accessToken",
                fromCache: false,
                correlationId: RANDOM_TEST_GUID,
                expiresOn: new Date(Date.now() + 3600000),
                account: testAccount,
                tokenType: AuthenticationScheme.BEARER
            };
            const silentCacheSpy = sinon.stub(SilentCacheClient.prototype, "acquireToken").resolves(testTokenResponse);
            const silentRefreshSpy = sinon.spy(SilentRefreshClient.prototype, "acquireToken");
            const silentIframeSpy = sinon.spy(SilentIframeClient.prototype, "acquireToken");

            const response = await pca.acquireTokenSilent({scopes: ["openid"], account: testAccount});
            expect(response).toEqual(testTokenResponse);
            expect(silentCacheSpy.calledOnce).toBe(true);
            expect(silentRefreshSpy.called).toBe(false);
            expect(silentIframeSpy.called).toBe(false);
        });

        it("Calls SilentRefreshClient.acquireToken and returns its response if cache lookup throws", async () => {
            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: "3338040d-6c67-4c5b-b112-36a304b66dad",
                username: "AbeLi@microsoft.com"
            };
            const testTokenResponse: AuthenticationResult = {
                authority: TEST_CONFIG.validAuthority,
                uniqueId: testAccount.localAccountId,
                tenantId: testAccount.tenantId,
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                idToken: "test-idToken",
                idTokenClaims: {},
                accessToken: "test-accessToken",
                fromCache: false,
                correlationId: RANDOM_TEST_GUID,
                expiresOn: new Date(Date.now() + 3600000),
                account: testAccount,
                tokenType: AuthenticationScheme.BEARER
            };
            const silentCacheSpy = sinon.stub(SilentCacheClient.prototype, "acquireToken").rejects("Expired");
            const silentRefreshSpy = sinon.stub(SilentRefreshClient.prototype, "acquireToken").resolves(testTokenResponse);
            const silentIframeSpy = sinon.spy(SilentIframeClient.prototype, "acquireToken");

            const response = await pca.acquireTokenSilent({scopes: ["openid"], account: testAccount});
            expect(response).toEqual(testTokenResponse);
            expect(silentCacheSpy.calledOnce).toBe(true);
            expect(silentRefreshSpy.calledOnce).toBe(true);
            expect(silentIframeSpy.called).toBe(false);
        });

        it("Calls SilentIframeClient.acquireToken and returns its response if cache lookup throws and refresh token is expired", async () => {
            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: "3338040d-6c67-4c5b-b112-36a304b66dad",
                username: "AbeLi@microsoft.com"
            };
            const testTokenResponse: AuthenticationResult = {
                authority: TEST_CONFIG.validAuthority,
                uniqueId: testAccount.localAccountId,
                tenantId: testAccount.tenantId,
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                idToken: "test-idToken",
                idTokenClaims: {},
                accessToken: "test-accessToken",
                fromCache: false,
                correlationId: RANDOM_TEST_GUID,
                expiresOn: new Date(Date.now() + 3600000),
                account: testAccount,
                tokenType: AuthenticationScheme.BEARER
            };
            const silentCacheSpy = sinon.stub(SilentCacheClient.prototype, "acquireToken").rejects("Expired");
            const silentRefreshSpy = sinon.stub(SilentRefreshClient.prototype, "acquireToken").rejects(new ServerError(BrowserConstants.INVALID_GRANT_ERROR, "Refresh Token expired"));
            const silentIframeSpy = sinon.stub(SilentIframeClient.prototype, "acquireToken").resolves(testTokenResponse);

            const response = await pca.acquireTokenSilent({scopes: ["openid"], account: testAccount});
            expect(response).toEqual(testTokenResponse);
            expect(silentCacheSpy.calledOnce).toBe(true);
            expect(silentRefreshSpy.calledOnce).toBe(true);
            expect(silentIframeSpy.calledOnce).toBe(true);
        });

        it("makes one network request with multiple parallel silent requests with same request", async () => {
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
                scopes: [...TEST_CONFIG.DEFAULT_SCOPES, "User.Read"],
                idToken: testServerTokenResponse.id_token,
                idTokenClaims: testIdTokenClaims,
                accessToken: testServerTokenResponse.access_token,
                fromCache: false,
                correlationId: RANDOM_TEST_GUID,
                expiresOn: new Date(Date.now() + (testServerTokenResponse.expires_in * 1000)),
                account: testAccount,
                tokenType: AuthenticationScheme.BEARER
            };
            sinon.stub(CryptoOps.prototype, "createNewGuid").returns(RANDOM_TEST_GUID);
            const silentATStub = sinon.stub(RefreshTokenClient.prototype, "acquireTokenByRefreshToken").resolves(testTokenResponse);
            const tokenRequest: CommonSilentFlowRequest = {
                scopes: ["User.Read"],
                account: testAccount,
                authority: TEST_CONFIG.validAuthority,
                authenticationScheme: AuthenticationScheme.BEARER,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                forceRefresh: false
            };
            const expectedTokenRequest: CommonSilentFlowRequest = {
                ...tokenRequest,
                scopes: ["User.Read"],
                authority: `${Constants.DEFAULT_AUTHORITY}`,
                correlationId: RANDOM_TEST_GUID,
                forceRefresh: false
            };
            const silentRequest1 = pca.acquireTokenSilent(tokenRequest);
            const silentRequest2 = pca.acquireTokenSilent(tokenRequest);
            const silentRequest3 = pca.acquireTokenSilent(tokenRequest);
            const parallelResponse = await Promise.all([silentRequest1, silentRequest2, silentRequest3]);

            expect(silentATStub.calledWith(expectedTokenRequest)).toBeTruthy();
            expect(silentATStub.callCount).toEqual(1);
            expect(parallelResponse[0]).toEqual(testTokenResponse);
            expect(parallelResponse[1]).toEqual(testTokenResponse);
            expect(parallelResponse[2]).toEqual(testTokenResponse);
            expect(parallelResponse).toHaveLength(3);
        });

        it("makes network requests for each distinct request when acquireTokenSilent is called in parallel", async () => {
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
                scopes: [...TEST_CONFIG.DEFAULT_SCOPES, "User.Read"],
                idToken: testServerTokenResponse.id_token,
                idTokenClaims: testIdTokenClaims,
                accessToken: testServerTokenResponse.access_token,
                fromCache: false,
                correlationId: RANDOM_TEST_GUID,
                expiresOn: new Date(Date.now() + (testServerTokenResponse.expires_in * 1000)),
                account: testAccount,
                tokenType: AuthenticationScheme.BEARER
            };
            sinon.stub(CryptoOps.prototype, "createNewGuid").returns(RANDOM_TEST_GUID);
            const silentATStub = sinon.stub(RefreshTokenClient.prototype, "acquireTokenByRefreshToken").resolves(testTokenResponse);
            const tokenRequest1: CommonSilentFlowRequest = {
                scopes: ["User.Read"],
                account: testAccount,
                authority: TEST_CONFIG.validAuthority,
                authenticationScheme: AuthenticationScheme.BEARER,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                forceRefresh: false
            };
            const expectedTokenRequest1: CommonSilentFlowRequest = {
                ...tokenRequest1,
                scopes: ["User.Read"],
                authority: `${Constants.DEFAULT_AUTHORITY}`,
                correlationId: RANDOM_TEST_GUID,
                forceRefresh: false
            };
            const tokenRequest2: CommonSilentFlowRequest = {
                scopes: ["Mail.Read"],
                account: testAccount,
                authority: TEST_CONFIG.validAuthority,
                authenticationScheme: AuthenticationScheme.BEARER,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                forceRefresh: false
            };
            const expectedTokenRequest2: CommonSilentFlowRequest = {
                ...tokenRequest1,
                scopes: ["Mail.Read"],
                authority: `${Constants.DEFAULT_AUTHORITY}`,
                correlationId: RANDOM_TEST_GUID,
                forceRefresh: false
            };
            const silentRequest1 = pca.acquireTokenSilent(tokenRequest1);
            const silentRequest2 = pca.acquireTokenSilent(tokenRequest1);
            const silentRequest3 = pca.acquireTokenSilent(tokenRequest2);
            await Promise.all([silentRequest1, silentRequest2, silentRequest3]);

            expect(silentATStub.calledWith(expectedTokenRequest1)).toBeTruthy();
            expect(silentATStub.calledWith(expectedTokenRequest2)).toBeTruthy();
            expect(silentATStub.callCount).toEqual(2);
        });

        it("throws error that SilentFlowClient.acquireToken() throws", async () => {
            const testError = {
                errorCode: "create_login_url_error",
                errorMessage: "Error in creating a login url"
            };
            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: "testTenantId",
                username: "username@contoso.com"
            };
            sinon.stub(RefreshTokenClient.prototype, <any>"acquireTokenByRefreshToken").rejects(testError);
            try {
                await pca.acquireTokenSilent({
                    scopes: TEST_CONFIG.DEFAULT_SCOPES,
                    account: testAccount
                });
            } catch (e) {
                // Test that error was cached for telemetry purposes and then thrown
                expect(window.sessionStorage).toHaveLength(1);
                const failures = window.sessionStorage.getItem(`server-telemetry-${TEST_CONFIG.MSAL_CLIENT_ID}`);
                const failureObj = JSON.parse(failures || "") as ServerTelemetryEntity;
                expect(failureObj.failedRequests).toHaveLength(2);
                expect(failureObj.failedRequests[0]).toEqual(ApiId.acquireTokenSilent_silentFlow);
                expect(failureObj.errors[0]).toEqual(testError.errorCode);
                expect(e).toEqual(testError);
            }
        });

        it("throws error that SilentFlowClient.acquireToken() throws when making parallel requests", async () => {
            const testError = {
                errorCode: "create_login_url_error",
                errorMessage: "Error in creating a login url"
            };
            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: "testTenantId",
                username: "username@contoso.com"
            };
            sinon.stub(RefreshTokenClient.prototype, <any>"acquireTokenByRefreshToken").rejects(testError);
            try {
                const tokenRequest = {
                    scopes: TEST_CONFIG.DEFAULT_SCOPES,
                    account: testAccount
                };
                const silentRequest1 = pca.acquireTokenSilent(tokenRequest);
                const silentRequest2 = pca.acquireTokenSilent(tokenRequest);
                const silentRequest3 = pca.acquireTokenSilent(tokenRequest);
                await Promise.all([silentRequest1, silentRequest2, silentRequest3]);
            } catch (e) {
                // Test that error was cached for telemetry purposes and then thrown
                expect(window.sessionStorage).toHaveLength(1);
                const failures = window.sessionStorage.getItem(`server-telemetry-${TEST_CONFIG.MSAL_CLIENT_ID}`);
                const failureObj = JSON.parse(failures || "") as ServerTelemetryEntity;
                expect(failureObj.failedRequests).toHaveLength(2);
                expect(failureObj.failedRequests[0]).toEqual(ApiId.acquireTokenSilent_silentFlow);
                expect(failureObj.errors[0]).toEqual(testError.errorCode);
                expect(e).toEqual(testError);
            }
        });

        it("Falls back to silent handler if thrown error is a refresh token expired error", async () => {
            const invalidGrantError: ServerError = new ServerError("invalid_grant", "AADSTS700081: The refresh token has expired due to maximum lifetime. The token was issued on xxxxxxx and the maximum allowed lifetime for this application is 1.00:00:00.\r\nTrace ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxx\r\nCorrelation ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxx\r\nTimestamp: 2020-0x-0x XX:XX:XXZ");
            sinon.stub(RefreshTokenClient.prototype, <any>"acquireTokenByRefreshToken").rejects(invalidGrantError);
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
                scopes: [...TEST_CONFIG.DEFAULT_SCOPES, "User.Read"],
                idToken: testServerTokenResponse.id_token,
                idTokenClaims: testIdTokenClaims,
                accessToken: testServerTokenResponse.access_token,
                fromCache: false,
                correlationId: RANDOM_TEST_GUID,
                expiresOn: new Date(Date.now() + (testServerTokenResponse.expires_in * 1000)),
                account: testAccount,
                tokenType: AuthenticationScheme.BEARER
            };
            const createAcqTokenStub = sinon.stub(AuthorizationCodeClient.prototype, "getAuthCodeUrl").resolves(testNavUrl);
            const silentTokenHelperStub = sinon.stub(SilentIframeClient.prototype, <any>"silentTokenHelper").resolves(testTokenResponse);
            sinon.stub(CryptoOps.prototype, "generatePkceCodes").resolves({
                challenge: TEST_CONFIG.TEST_CHALLENGE,
                verifier: TEST_CONFIG.TEST_VERIFIER
            });
            sinon.stub(CryptoOps.prototype, "createNewGuid").returns(RANDOM_TEST_GUID);
            sinon.stub(ProtocolUtils, "setRequestState").returns(TEST_STATE_VALUES.TEST_STATE_SILENT);
            const CommonSilentFlowRequest: SilentRequest = {
                scopes: ["User.Read"],
                account: testAccount,
                extraQueryParameters: {
                    queryKey: "queryValue"
                }, 
                forceRefresh: false
            };
            const expectedRequest: CommonAuthorizationUrlRequest = {
                ...CommonSilentFlowRequest,
                scopes: ["User.Read"],
                correlationId: RANDOM_TEST_GUID,
                authority: `${Constants.DEFAULT_AUTHORITY}`,
                prompt: "none",
                redirectUri: TEST_URIS.TEST_REDIR_URI,
                state: TEST_STATE_VALUES.TEST_STATE_SILENT,
                nonce: RANDOM_TEST_GUID,
                responseMode: ResponseMode.FRAGMENT,
                codeChallenge: TEST_CONFIG.TEST_CHALLENGE,
                codeChallengeMethod: Constants.S256_CODE_CHALLENGE_METHOD,
                authenticationScheme: TEST_CONFIG.TOKEN_TYPE_BEARER as AuthenticationScheme
            };
            const tokenResp = await pca.acquireTokenSilent(CommonSilentFlowRequest);

            expect(tokenResp).toEqual(testTokenResponse);
            expect(createAcqTokenStub.calledWith(expectedRequest)).toBeTruthy();
            expect(silentTokenHelperStub.calledWith(testNavUrl)).toBeTruthy();
        });
    });

    describe("logout", () => {
        it("calls logoutRedirect", (done) => {
            sinon.stub(pca, "logoutRedirect").callsFake((request) => {
                expect(request && request.postLogoutRedirectUri).toBe("/logout");
                done();
                return Promise.resolve();
            });
    
            pca.logout({postLogoutRedirectUri: "/logout"});
        });
    });

    describe("logoutRedirect", () => {
        it("Calls RedirectClient.logout and returns its response", async () => {
            const redirectClientSpy = sinon.stub(RedirectClient.prototype, "logout").resolves();

            const response = await pca.logoutRedirect();
            expect(response).toEqual(undefined);
            expect(redirectClientSpy.calledOnce).toBe(true);
        });

        it("throws an error if inside an iframe", async () => {
            sinon.stub(BrowserUtils, "isInIframe").returns(true);
            await expect(pca.logout()).rejects.toMatchObject(BrowserAuthError.createRedirectInIframeError(true));
        });
    });

    describe("logoutPopup", () => {
        it("Calls PopupClient.logout and returns its response", async () => {
            const popupClientSpy = sinon.stub(PopupClient.prototype, "logout").resolves();

            const response = await pca.logoutPopup();
            expect(response).toEqual(undefined);
            expect(popupClientSpy.calledOnce).toBe(true);
        });
    });

    describe("getAccount tests", () => {
        // Account 1
        const testAccountInfo1: AccountInfo = {
            homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
            environment: "login.windows.net",
            tenantId: TEST_DATA_CLIENT_INFO.TEST_UTID,
            username: "example@microsoft.com",
            name: "Abe Lincoln",
            localAccountId: TEST_CONFIG.OID,
            idTokenClaims: undefined
        };

        const testAccount1: AccountEntity = new AccountEntity();
        testAccount1.homeAccountId = testAccountInfo1.homeAccountId;
        testAccount1.localAccountId = TEST_CONFIG.OID;
        testAccount1.environment = testAccountInfo1.environment;
        testAccount1.realm = testAccountInfo1.tenantId;
        testAccount1.username = testAccountInfo1.username;
        testAccount1.name = testAccountInfo1.name;
        testAccount1.authorityType = "MSSTS";
        testAccount1.clientInfo = TEST_DATA_CLIENT_INFO.TEST_CLIENT_INFO_B64ENCODED;

        // Account 2
        const testAccountInfo2: AccountInfo = {
            homeAccountId: "different-home-account-id",
            environment: "login.windows.net",
            tenantId: TEST_DATA_CLIENT_INFO.TEST_UTID,
            username: "anotherExample@microsoft.com",
            name: "Abe Lincoln",
            localAccountId: TEST_CONFIG.OID,
            idTokenClaims: undefined
        };

        const testAccount2: AccountEntity = new AccountEntity();
        testAccount2.homeAccountId = testAccountInfo2.homeAccountId;
        testAccount2.localAccountId = TEST_CONFIG.OID;
        testAccount2.environment = testAccountInfo2.environment;
        testAccount2.realm = testAccountInfo2.tenantId;
        testAccount2.username = testAccountInfo2.username;
        testAccount2.name = testAccountInfo2.name;
        testAccount2.authorityType = "MSSTS";
        testAccount2.clientInfo = TEST_DATA_CLIENT_INFO.TEST_CLIENT_INFO_B64ENCODED;

        beforeEach(() => {
            const cacheKey1 = AccountEntity.generateAccountCacheKey(testAccountInfo1);
            window.sessionStorage.setItem(cacheKey1, JSON.stringify(testAccount1));

            const cacheKey2 = AccountEntity.generateAccountCacheKey(testAccountInfo2);
            window.sessionStorage.setItem(cacheKey2, JSON.stringify(testAccount2));
        });

        afterEach(() => {
            window.sessionStorage.clear();
        });

        it("getAllAccounts returns all signed in accounts", () => {
            const account = pca.getAllAccounts();
            expect(account).toHaveLength(2);
        });

        it("getAllAccounts returns empty array if no accounts signed in", () => {
            window.sessionStorage.clear();
            const accounts = pca.getAllAccounts();
            expect(accounts).toEqual([]);
        });

        it("getAccountByUsername returns account specified", () => {
            const account = pca.getAccountByUsername("example@microsoft.com");
            expect(account).toEqual(testAccountInfo1);
        });

        it(
            "getAccountByUsername returns account specified with case mismatch",
            () => {
                const account = pca.getAccountByUsername("Example@Microsoft.com");
                expect(account).toEqual(testAccountInfo1);

                const account2 = pca.getAccountByUsername("anotherexample@microsoft.com");
                expect(account2).toEqual(testAccountInfo2);
            }
        );

        it("getAccountByUsername returns null if account doesn't exist", () => {
            const account = pca.getAccountByUsername("this-email-doesnt-exist@microsoft.com");
            expect(account).toBe(null);
        });

        it("getAccountByUsername returns null if passed username is null", () => {
            // @ts-ignore
            const account = pca.getAccountByUsername(null);
            expect(account).toBe(null);
        });

        it("getAccountByHomeId returns account specified", () => {
            const account = pca.getAccountByHomeId(TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID);
            expect(account).toEqual(testAccountInfo1);
        });

        it("getAccountByHomeId returns null if passed id doesn't exist", () => {
            const account = pca.getAccountByHomeId("this-id-doesnt-exist");
            expect(account).toBe(null);
        });

        it("getAccountByHomeId returns null if passed id is null", () => {
            // @ts-ignore
            const account = pca.getAccountByHomeId(null);
            expect(account).toBe(null);
        });

        it("getAccountByLocalId returns account specified", () => {
            const account = pca.getAccountByLocalId(TEST_CONFIG.OID);
            expect(account).toEqual(testAccountInfo1);
        });

        it("getAccountByLocalId returns null if passed id doesn't exist", () => {
            const account = pca.getAccountByLocalId("this-id-doesnt-exist");
            expect(account).toBe(null);
        });

        it("getAccountByLocalId returns null if passed id is null", () => {
            // @ts-ignore
            const account = pca.getAccountByLocalId(null);
            expect(account).toBe(null);
        });
    });

    describe("activeAccount API tests", () => {
        // Account 1
        const testAccountInfo1: AccountInfo = {
            homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
            environment: "login.windows.net",
            tenantId: TEST_DATA_CLIENT_INFO.TEST_UTID,
            username: "example@microsoft.com",
            name: "Abe Lincoln",
            localAccountId: TEST_CONFIG.OID,
            idTokenClaims: undefined
        };

        const testAccount1: AccountEntity = new AccountEntity();
        testAccount1.homeAccountId = testAccountInfo1.homeAccountId;
        testAccount1.localAccountId = TEST_CONFIG.OID;
        testAccount1.environment = testAccountInfo1.environment;
        testAccount1.realm = testAccountInfo1.tenantId;
        testAccount1.username = testAccountInfo1.username;
        testAccount1.name = testAccountInfo1.name;
        testAccount1.authorityType = "MSSTS";
        testAccount1.clientInfo = TEST_DATA_CLIENT_INFO.TEST_CLIENT_INFO_B64ENCODED;

        beforeEach(() => {
            const cacheKey1 = AccountEntity.generateAccountCacheKey(testAccountInfo1);
            window.sessionStorage.setItem(cacheKey1, JSON.stringify(testAccount1));
        });

        afterEach(() => {
            window.sessionStorage.clear();
        });

        it("active account is initialized as null", () => {
            // Public client should initialze with active account set to null.
            expect(pca.getActiveAccount()).toBe(null);
        });

        it("setActiveAccount() sets the active account local id value correctly", () => {
                expect(pca.getActiveAccount()).toBe(null);
                pca.setActiveAccount(testAccountInfo1);
                expect(pca.getActiveAccount()).toEqual(testAccountInfo1);
        });

        it("getActiveAccount looks up the current account values and returns them", () => {
                pca.setActiveAccount(testAccountInfo1);
                const activeAccount1 = pca.getActiveAccount();
                expect(activeAccount1).toEqual(testAccountInfo1);
                
                const newName = "Ben Franklin";
                testAccountInfo1.name = newName;
                testAccount1.name = newName;
                const cacheKey = AccountEntity.generateAccountCacheKey(testAccountInfo1);
                window.sessionStorage.setItem(cacheKey, JSON.stringify(testAccount1));

                const activeAccount2 = pca.getActiveAccount();
                expect(activeAccount2).toEqual(testAccountInfo1);
        });

        describe("activeAccount logout", () => {
            const testAccountInfo2: AccountInfo = {
                homeAccountId: "different-home-account-id",
                environment: "login.windows.net",
                tenantId: TEST_DATA_CLIENT_INFO.TEST_UTID,
                username: "anotherExample@microsoft.com",
                name: "Abe Lincoln",
                localAccountId: TEST_CONFIG.OID,
                idTokenClaims: undefined
            };

            beforeEach(() => {
                pca.setActiveAccount(testAccountInfo1);
                sinon.stub(AuthorizationCodeClient.prototype, "getLogoutUri").returns(testLogoutUrl);
                sinon.stub(NavigationClient.prototype, "navigateExternal").callsFake((urlNavigate: string, options: NavigationOptions): Promise<boolean> => {
                    expect(urlNavigate).toEqual(testLogoutUrl);
                    expect(options.noHistory).toBeFalsy();
                    return Promise.resolve(true);
                });
                const popupWindow = {...window};
                sinon.stub(PopupUtils.prototype, "openPopup").returns(popupWindow);
                sinon.stub(PopupUtils, "openSizedPopup").returns(popupWindow);
                sinon.stub(PopupUtils.prototype, "cleanPopup");
            });

            it("Clears active account on logoutRedirect with no account", async () => {
                expect(pca.getActiveAccount()).toEqual(testAccountInfo1);
                await pca.logoutRedirect();
                expect(pca.getActiveAccount()).toBe(null);
            });
    
            it("Clears active account on logoutRedirect when the given account info matches", async () => {
                    expect(pca.getActiveAccount()).toEqual(testAccountInfo1);
                    await pca.logoutRedirect({
                        account: testAccountInfo1
                    });
                    expect(pca.getActiveAccount()).toBe(null);
                }
            );

            it("Does not clear active account on logoutRedirect if given account object does not match", async () => {
                    expect(pca.getActiveAccount()).toEqual(testAccountInfo1);
                    await pca.logoutRedirect({
                        account: testAccountInfo2
                    });
                    expect(pca.getActiveAccount()).toEqual(testAccountInfo1);
                }
            );

            it("Clears active account on logoutPopup with no account", async () => {
                expect(pca.getActiveAccount()).toEqual(testAccountInfo1);
                await pca.logoutPopup();
                expect(pca.getActiveAccount()).toBe(null);
            });
    
            it("Clears active account on logoutPopup when the given account info matches", async () => {
                    expect(pca.getActiveAccount()).toEqual(testAccountInfo1);
                    await pca.logoutPopup({
                        account: testAccountInfo1
                    });
                    expect(pca.getActiveAccount()).toBe(null);
                }
            );

            it("Does not clear active account on logoutPopup if given account object does not match", async () => {
                    expect(pca.getActiveAccount()).toEqual(testAccountInfo1);
                    await pca.logoutPopup({
                        account: testAccountInfo2
                    });
                    expect(pca.getActiveAccount()).toEqual(testAccountInfo1);
                }
            );
        });
    });

    describe("Event API tests", () => {
        it("can add an event callback", (done) => {
            const subscriber = (message: EventMessage) => {
                expect(message.eventType).toEqual(EventType.LOGIN_START);
                expect(message.interactionType).toEqual(InteractionType.Popup);
                done();
            };

            const callbackSpy = sinon.spy(EventHandler.prototype, "addEventCallback");

            pca.addEventCallback(subscriber);
            expect(callbackSpy.calledOnce).toBeTruthy();
            done();
        });

        it("can remove an event callback", (done) => {
            const callbackSpy = sinon.spy(EventHandler.prototype, "removeEventCallback");

            const callbackId = pca.addEventCallback(() => {});
            pca.removeEventCallback(callbackId || "");
            expect(callbackSpy.calledOnce).toBeTruthy();
            done();
        });
    });

    describe("Logger", () => {
        it("getLogger and setLogger", done => {
            const logger = new Logger({
                loggerCallback: (level, message, containsPii) => {
                    expect(message).toContain("Message");
                    expect(message).toContain(LogLevel[2]);
    
                    expect(level).toEqual(LogLevel.Info);
                    expect(containsPii).toBeFalsy();
    
                    done();
                },
                piiLoggingEnabled: false
            });

            pca.setLogger(logger);

            expect(pca.getLogger()).toEqual(logger);

            pca.getLogger().info("Message");
        });
    });

    describe("initializeWrapperLibrary Tests", () => {
        it("Sets wrapperSKU and wrapperVer with passed values", () => {
            pca.initializeWrapperLibrary(WrapperSKU.React, "1.0.0");

            // @ts-ignore
            expect(pca.browserStorage.getWrapperMetadata()).toEqual([WrapperSKU.React, "1.0.0"]);
        });
    });
});
