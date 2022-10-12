/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import sinon from "sinon";
import { PublicClientApplication } from "../../src/app/PublicClientApplication";
import { TEST_CONFIG, TEST_URIS, TEST_TOKENS, ID_TOKEN_CLAIMS, TEST_DATA_CLIENT_INFO, TEST_TOKEN_LIFETIMES, RANDOM_TEST_GUID, testLogoutUrl, TEST_STATE_VALUES, TEST_HASHES, DEFAULT_TENANT_DISCOVERY_RESPONSE, DEFAULT_OPENID_CONFIG_RESPONSE, testNavUrlNoRequest, TEST_SSH_VALUES, TEST_CRYPTO_VALUES } from "../utils/StringConstants";
import { AuthorityMetadataEntity, ServerError, Constants, AccountInfo, TokenClaims, AuthenticationResult, CommonAuthorizationUrlRequest, AuthorizationCodeClient, ResponseMode, AccountEntity, ProtocolUtils, AuthenticationScheme, RefreshTokenClient, Logger, ServerTelemetryEntity, CommonSilentFlowRequest, LogLevel, CommonAuthorizationCodeRequest, InteractionRequiredAuthError, IdTokenEntity, CacheManager, ClientAuthError } from "@azure/msal-common";
import { ApiId, InteractionType, WrapperSKU, TemporaryCacheKeys, BrowserConstants, BrowserCacheLocation, CacheLookupPolicy } from "../../src/utils/BrowserConstants";
import { CryptoOps } from "../../src/crypto/CryptoOps";
import { EventType } from "../../src/event/EventType";
import { SilentRequest } from "../../src/request/SilentRequest";
import { NavigationClient } from "../../src/navigation/NavigationClient";
import { NavigationOptions } from "../../src/navigation/NavigationOptions";
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
import { AuthorizationCodeRequest, BrowserConfigurationAuthError, EndSessionRequest } from "../../src";
import { RedirectHandler } from "../../src/interaction_handler/RedirectHandler";
import { SilentAuthCodeClient } from "../../src/interaction_client/SilentAuthCodeClient";
import { BrowserCacheManager } from "../../src/cache/BrowserCacheManager";
import { NativeMessageHandler } from "../../src/broker/nativeBroker/NativeMessageHandler";
import { NativeInteractionClient } from "../../src/interaction_client/NativeInteractionClient";
import { NativeTokenRequest } from "../../src/broker/nativeBroker/NativeRequest";
import { NativeAuthError } from "../../src/error/NativeAuthError";

const cacheConfig = {
    cacheLocation: BrowserCacheLocation.SessionStorage,
    storeAuthStateInCookie: false,
    secureCookies: false
};


jest.mock("../../src/telemetry/BrowserPerformanceMeasurement", () => {
    return {
        BrowserPerformanceMeasurement: jest.fn().mockImplementation(() => {
            return {
                startMeasurement: () => {},
                endMeasurement: () => {},
                flushMeasurement: () => 50
            }
        })
    }
});

describe("PublicClientApplication.ts Class Unit Tests", () => {
    globalThis.MessageChannel = require("worker_threads").MessageChannel; // jsdom does not include an implementation for MessageChannel
    let pca: PublicClientApplication;
    beforeEach(() => {
        pca = new PublicClientApplication({
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID
            },
            telemetry: {
                application: {
                    appName: TEST_CONFIG.applicationName,
                    appVersion: TEST_CONFIG.applicationVersion
                }
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

    describe("intialize tests", () => {
        it("creates extension provider if allowNativeBroker is true", async () => {
            const createProviderSpy = sinon.stub(NativeMessageHandler, "createProvider").callsFake(async () => {
                return new NativeMessageHandler(pca.getLogger(), 2000, "test-extensionId");
            });
            pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID
                },
                system: {
                    allowNativeBroker: true
                }
            });
            await pca.initialize();
            expect(createProviderSpy.called).toBeTruthy();
            // @ts-ignore
            expect(pca.nativeExtensionProvider).toBeInstanceOf(NativeMessageHandler);
        });

        it("does not create extension provider if allowNativeBroker is false", async () => {
            const createProviderSpy = sinon.spy(NativeMessageHandler, "createProvider");
            pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID
                },
                system: {
                    allowNativeBroker: false
                }
            });
            await pca.initialize();
            expect(createProviderSpy.called).toBeFalsy();
            // @ts-ignore
            expect(pca.nativeExtensionProvider).toBeUndefined();
        });

        it("catches error if extension provider fails to initialize", async () => {
            const createProviderSpy = sinon.stub(NativeMessageHandler, "createProvider").callsFake(async () => {
                throw new Error("testError");
            });
            pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID
                },
                system: {
                    allowNativeBroker: true
                }
            });
            await pca.initialize();
            expect(createProviderSpy.called).toBeTruthy();
            // @ts-ignore
            expect(pca.nativeExtensionProvider).toBeUndefined();
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
            expect(response?.idToken).not.toBeNull();
            expect(response).toEqual(testTokenResponse);
            expect(redirectClientSpy.calledOnce).toBe(true);
            expect(loginSuccessFired).toBe(true);
        });

        it("Calls NativeInteractionClient.handleRedirectPromise and returns its response", async () => {
            pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID
                },
                system: {
                    allowNativeBroker: true
                }
            });

            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: "3338040d-6c67-4c5b-b112-36a304b66dad",
                username: "AbeLi@microsoft.com",
                nativeAccountId: "test-nativeAccountId"
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
                tokenType: AuthenticationScheme.BEARER,
                fromNativeBroker: true
            };

            const nativeRequest: NativeTokenRequest = {
                authority: TEST_CONFIG.validAuthority,
                clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                scope: TEST_CONFIG.DEFAULT_SCOPES.join(" "),
                accountId: testAccount.nativeAccountId!,
                redirectUri: window.location.href,
                correlationId: RANDOM_TEST_GUID,
                windowTitleSubstring: "test window"
            }
            // @ts-ignore
            pca.browserStorage.setTemporaryCache(TemporaryCacheKeys.NATIVE_REQUEST, JSON.stringify(nativeRequest), true);
            const redirectClientSpy = sinon.stub(NativeInteractionClient.prototype, "handleRedirectPromise").callsFake(() => {
                sinon.stub(pca, "getAllAccounts").returns([testAccount]);
                return Promise.resolve(testTokenResponse);
            });
            let loginSuccessFired = false;
            sinon.stub(EventHandler.prototype, "emitEvent").callsFake((eventType) => {
                if (eventType === EventType.LOGIN_SUCCESS) {
                    loginSuccessFired = true;
                }
            });
            sinon.stub(NativeMessageHandler, "createProvider").callsFake(async () => {
                return new NativeMessageHandler(pca.getLogger(), 2000, "test-extensionId");
            });
            await pca.initialize();
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
            const browserCrypto = new CryptoOps(new Logger({}));
            const stateId = ProtocolUtils.parseRequestState(browserCrypto, stateString).libraryState.id;

            window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.ORIGIN_URI}`, TEST_URIS.TEST_REDIR_URI);
            window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.AUTHORITY}.${stateId}`, TEST_CONFIG.validAuthority);
            window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.REQUEST_STATE}.${stateId}`, TEST_STATE_VALUES.TEST_STATE_REDIRECT);
            window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.URL_HASH}`, TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT);
            window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TemporaryCacheKeys.INTERACTION_STATUS_KEY}`, TEST_CONFIG.MSAL_CLIENT_ID);
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
        it("doesnt mutate request correlation id", async () => {
            const request: SilentRequest = {
                scopes: []
            };

            const result1 = await pca.loginRedirect(request)
                .catch(() => null);

            const result2 = await pca.loginRedirect(request)
            .catch(() => null);

            expect(request.correlationId).toBe(undefined);
        });

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
        it("goes directly to the native broker if nativeAccountId is present", async () => {
            pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID
                },
                system: {
                    allowNativeBroker: true
                }
            });

            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: "3338040d-6c67-4c5b-b112-36a304b66dad",
                username: "AbeLi@microsoft.com",
                nativeAccountId: "test-nativeAccountId"
            };

            sinon.stub(NativeMessageHandler, "createProvider").callsFake(async () => {
                return new NativeMessageHandler(pca.getLogger(), 2000, "test-extensionId");
            });
            await pca.initialize();
            const nativeAcquireTokenSpy = sinon.stub(NativeInteractionClient.prototype, "acquireTokenRedirect").callsFake(async () => {
                return;
            });
            const redirectSpy = sinon.stub(RedirectClient.prototype, "acquireToken").callsFake(async () => {
                return;
            });
            await pca.acquireTokenRedirect({
                scopes: ["User.Read"],
                account: testAccount
            });

            expect(nativeAcquireTokenSpy.calledOnce).toBeTruthy();
            expect(redirectSpy.calledOnce).toBeFalsy();
        });

        it("falls back to web flow if prompt is select_account", async () => {
            pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID
                },
                system: {
                    allowNativeBroker: true
                }
            });

            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: "3338040d-6c67-4c5b-b112-36a304b66dad",
                username: "AbeLi@microsoft.com",
                nativeAccountId: "test-nativeAccountId"
            };

            sinon.stub(NativeMessageHandler, "createProvider").callsFake(async () => {
                return new NativeMessageHandler(pca.getLogger(), 2000, "test-extensionId");
            });
            await pca.initialize();
            const nativeAcquireTokenSpy = sinon.spy(NativeInteractionClient.prototype, "acquireTokenRedirect");
            const redirectSpy = sinon.stub(RedirectClient.prototype, "acquireToken").callsFake(async () => {
                return;
            });
            await pca.acquireTokenRedirect({
                scopes: ["User.Read"],
                account: testAccount,
                prompt: "select_account"
            });

            expect(nativeAcquireTokenSpy.calledOnce).toBeFalsy();
            expect(redirectSpy.calledOnce).toBeTruthy();
        });

        it("falls back to web flow if native broker call fails due to fatal error", async () => {
            pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID
                },
                system: {
                    allowNativeBroker: true
                }
            });

            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: "3338040d-6c67-4c5b-b112-36a304b66dad",
                username: "AbeLi@microsoft.com",
                nativeAccountId: "test-nativeAccountId"
            };

            sinon.stub(NativeMessageHandler, "createProvider").callsFake(async () => {
                return new NativeMessageHandler(pca.getLogger(), 2000, "test-extensionId");
            });
            await pca.initialize();
            const nativeAcquireTokenSpy = sinon.stub(NativeInteractionClient.prototype, "acquireTokenRedirect").callsFake(async () => {
                throw new NativeAuthError("ContentError", "error in extension");
            });
            const redirectSpy = sinon.stub(RedirectClient.prototype, "acquireToken").callsFake(async () => {
                return;
            });
            await pca.acquireTokenRedirect({
                scopes: ["User.Read"],
                account: testAccount
            });

            expect(nativeAcquireTokenSpy.calledOnce).toBeTruthy();
            expect(redirectSpy.calledOnce).toBeTruthy();
        });

        it("falls back to web flow if native broker call fails due to interaction_required error", async () => {
            pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID
                },
                system: {
                    allowNativeBroker: true
                }
            });

            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: "3338040d-6c67-4c5b-b112-36a304b66dad",
                username: "AbeLi@microsoft.com",
                nativeAccountId: "test-nativeAccountId"
            };

            sinon.stub(NativeMessageHandler, "createProvider").callsFake(async () => {
                return new NativeMessageHandler(pca.getLogger(), 2000, "test-extensionId");
            });
            await pca.initialize();
            const nativeAcquireTokenSpy = sinon.stub(NativeInteractionClient.prototype, "acquireTokenRedirect").callsFake(async () => {
                throw InteractionRequiredAuthError.createNativeAccountUnavailableError();
            });
            const redirectSpy = sinon.stub(RedirectClient.prototype, "acquireToken").callsFake(async () => {
                return;
            });
            await pca.acquireTokenRedirect({
                scopes: ["User.Read"],
                account: testAccount
            });

            expect(nativeAcquireTokenSpy.calledOnce).toBeTruthy();
            expect(redirectSpy.calledOnce).toBeTruthy();
        });

        it("throws error if native broker call fails due to non-fatal error", async () => {
            pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID
                },
                system: {
                    allowNativeBroker: true
                }
            });

            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: "3338040d-6c67-4c5b-b112-36a304b66dad",
                username: "AbeLi@microsoft.com",
                nativeAccountId: "test-nativeAccountId"
            };

            sinon.stub(NativeMessageHandler, "createProvider").callsFake(async () => {
                return new NativeMessageHandler(pca.getLogger(), 2000, "test-extensionId");
            });
            await pca.initialize();
            const nativeAcquireTokenSpy = sinon.stub(NativeInteractionClient.prototype, "acquireTokenRedirect").callsFake(async () => {
                throw new Error("testError");
            });
            const redirectSpy = sinon.stub(RedirectClient.prototype, "acquireToken").callsFake(async () => {
                return;
            });

            await pca.acquireTokenRedirect({
                scopes: ["User.Read"],
                account: testAccount
            }).catch(e => {
                // @ts-ignore
                expect(pca.browserStorage.getInteractionInProgress()).toBeFalsy();
                expect(e.message).toEqual("testError");
            });
            expect(nativeAcquireTokenSpy.calledOnce).toBeTruthy();
            expect(redirectSpy.calledOnce).toBeFalsy();

        });

        it("doesnt mutate request correlation id", async () => {
            const request: SilentRequest = {
                scopes: []
            };

            const result1 = await pca.acquireTokenRedirect(request)
                .catch(() => null);

            const result2 = await pca.acquireTokenRedirect(request)
            .catch(() => null);

            expect(request.correlationId).toBe(undefined);
        });

        it("throws if interaction is currently in progress", async () => {
            const browserCrypto = new CryptoOps(new Logger({}));
            const logger = new Logger({});
            const browserStorage = new BrowserCacheManager("client-id", cacheConfig, browserCrypto, logger);
            browserStorage.setInteractionInProgress(true);
            await expect(pca.acquireTokenRedirect({scopes: ["openid"]})).rejects.toMatchObject(BrowserAuthError.createInteractionInProgressError());
        });

        it("throws if interaction is currently in progress for a different clientId", async () => {
            const browserCrypto = new CryptoOps(new Logger({}));
            const logger = new Logger({});
            const browserStorage = new BrowserCacheManager("client-id", cacheConfig, browserCrypto, logger);
            const secondInstanceStorage = new BrowserCacheManager("different-client-id", cacheConfig, browserCrypto, logger);
            secondInstanceStorage.setInteractionInProgress(true);

            expect(browserStorage.isInteractionInProgress(true)).toBe(false);
            expect(browserStorage.isInteractionInProgress(false)).toBe(true);
            expect(secondInstanceStorage.isInteractionInProgress(true)).toBe(true);
            expect(secondInstanceStorage.isInteractionInProgress(false)).toBe(true);
            await expect(pca.acquireTokenRedirect({scopes: ["openid"]})).rejects.toMatchObject(BrowserAuthError.createInteractionInProgressError());
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

        it("throws an error if allowNativeBroker: true and initialize was not called prior", async () => {
            pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID
                },
                system: {
                    allowNativeBroker: true
                }
            })
            await expect(pca.acquireTokenRedirect({ scopes: [] })).rejects.toMatchObject(BrowserAuthError.createNativeBrokerCalledBeforeInitialize());
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

        it("doesnt mutate request correlation id", async () => {
            const request: SilentRequest = {
                scopes: []
            };

            const result1 = await pca.loginPopup(request)
                .catch(() => null);

            const result2 = await pca.loginPopup(request)
            .catch(() => null);

            expect(request.correlationId).toBe(undefined);
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

        it("goes directly to the native broker if nativeAccountId is present", async () => {
            pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID
                },
                system: {
                    allowNativeBroker: true
                }
            });

            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: "3338040d-6c67-4c5b-b112-36a304b66dad",
                username: "AbeLi@microsoft.com",
                nativeAccountId: "test-nativeAccountId"
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

            sinon.stub(NativeMessageHandler, "createProvider").callsFake(async () => {
                return new NativeMessageHandler(pca.getLogger(), 2000, "test-extensionId");
            });
            await pca.initialize();
            const nativeAcquireTokenSpy = sinon.stub(NativeInteractionClient.prototype, "acquireToken").callsFake(async () => {
                return testTokenResponse;
            });
            const popupSpy = sinon.stub(PopupClient.prototype, "acquireToken").callsFake(async () => {
                return testTokenResponse;
            });
            const response = await pca.acquireTokenPopup({
                scopes: ["User.Read"],
                account: testAccount
            });

            expect(response).toEqual(testTokenResponse);
            expect(nativeAcquireTokenSpy.calledOnce).toBeTruthy();
            expect(popupSpy.calledOnce).toBeFalsy();
        });

        it("falls back to web flow if prompt is select_account", async () => {
            pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID
                },
                system: {
                    allowNativeBroker: true
                }
            });

            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: "3338040d-6c67-4c5b-b112-36a304b66dad",
                username: "AbeLi@microsoft.com",
                nativeAccountId: "test-nativeAccountId"
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

            sinon.stub(NativeMessageHandler, "createProvider").callsFake(async () => {
                return new NativeMessageHandler(pca.getLogger(), 2000, "test-extensionId");
            });
            await pca.initialize();
            const nativeAcquireTokenSpy = sinon.spy(NativeInteractionClient.prototype, "acquireToken");
            const popupSpy = sinon.stub(PopupClient.prototype, "acquireToken").callsFake(async () => {
                return testTokenResponse;
            });
            const response = await pca.acquireTokenPopup({
                scopes: ["User.Read"],
                account: testAccount,
                prompt: "select_account"
            });

            expect(response).toBe(testTokenResponse);
            expect(nativeAcquireTokenSpy.calledOnce).toBeFalsy();
            expect(popupSpy.calledOnce).toBeTruthy();
        });

        it("falls back to web flow if native broker call fails due to fatal error", async () => {
            pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID
                },
                system: {
                    allowNativeBroker: true
                }
            });

            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: "3338040d-6c67-4c5b-b112-36a304b66dad",
                username: "AbeLi@microsoft.com",
                nativeAccountId: "test-nativeAccountId"
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

            sinon.stub(NativeMessageHandler, "createProvider").callsFake(async () => {
                return new NativeMessageHandler(pca.getLogger(), 2000, "test-extensionId");
            });
            await pca.initialize();
            const nativeAcquireTokenSpy = sinon.stub(NativeInteractionClient.prototype, "acquireToken").callsFake(async () => {
                throw new NativeAuthError("ContentError", "error in extension");
            });
            const popupSpy = sinon.stub(PopupClient.prototype, "acquireToken").callsFake(async () => {
                return testTokenResponse;
            });
            const response = await pca.acquireTokenPopup({
                scopes: ["User.Read"],
                account: testAccount
            });

            expect(response).toBe(testTokenResponse);
            expect(nativeAcquireTokenSpy.calledOnce).toBeTruthy();
            expect(popupSpy.calledOnce).toBeTruthy();
        });

        it("falls back to web flow if native broker call fails due to interaction_required error", async () => {
            pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID
                },
                system: {
                    allowNativeBroker: true
                }
            });

            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: "3338040d-6c67-4c5b-b112-36a304b66dad",
                username: "AbeLi@microsoft.com",
                nativeAccountId: "test-nativeAccountId"
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

            sinon.stub(NativeMessageHandler, "createProvider").callsFake(async () => {
                return new NativeMessageHandler(pca.getLogger(), 2000, "test-extensionId");
            });
            await pca.initialize();
            const nativeAcquireTokenSpy = sinon.stub(NativeInteractionClient.prototype, "acquireToken").callsFake(async () => {
                throw InteractionRequiredAuthError.createNativeAccountUnavailableError();
            });
            const popupSpy = sinon.stub(PopupClient.prototype, "acquireToken").callsFake(async () => {
                return testTokenResponse;
            });
            const response = await pca.acquireTokenPopup({
                scopes: ["User.Read"],
                account: testAccount
            });

            expect(response).toBe(testTokenResponse);
            expect(nativeAcquireTokenSpy.calledOnce).toBeTruthy();
            expect(popupSpy.calledOnce).toBeTruthy();
        });

        it("throws error if native broker call fails due to non-fatal error", async () => {
            pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID
                },
                system: {
                    allowNativeBroker: true
                }
            });

            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: "3338040d-6c67-4c5b-b112-36a304b66dad",
                username: "AbeLi@microsoft.com",
                nativeAccountId: "test-nativeAccountId"
            };

            sinon.stub(NativeMessageHandler, "createProvider").callsFake(async () => {
                return new NativeMessageHandler(pca.getLogger(), 2000, "test-extensionId");
            });
            await pca.initialize();
            const nativeAcquireTokenSpy = sinon.stub(NativeInteractionClient.prototype, "acquireToken").callsFake(async () => {
                throw new Error("testError");
            });
            const popupSpy = sinon.stub(PopupClient.prototype, "acquireToken").callsFake(async () => {
                throw new Error("testError");
            });

            await pca.acquireTokenPopup({
                scopes: ["User.Read"],
                account: testAccount
            }).catch(e => {
                // @ts-ignore
                expect(pca.browserStorage.getInteractionInProgress()).toBeFalsy();
                expect(e.message).toEqual("testError");
            });
            expect(nativeAcquireTokenSpy.calledOnce).toBeTruthy();
            expect(popupSpy.calledOnce).toBeFalsy();
        });

        it("doesnt mutate request correlation id", async () => {
            const request: SilentRequest = {
                scopes: []
            };

            const result1 = await pca.acquireTokenPopup(request)
                .catch(() => null);

            const result2 = await pca.acquireTokenPopup(request)
            .catch(() => null);

            expect(request.correlationId).toBe(undefined);
        });

        it("throws error if interaction is in progress", async () => {
            const browserCrypto = new CryptoOps(new Logger({}));
            const logger = new Logger({});
            const browserStorage = new BrowserCacheManager("client-id", cacheConfig, browserCrypto, logger);
            browserStorage.setInteractionInProgress(true);

            await expect(pca.acquireTokenPopup({scopes:[]})).rejects.toMatchObject(BrowserAuthError.createInteractionInProgressError());
        });

        it("throws an error if allowNativeBroker: true and intialize was not called prior", async () => {
            pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID
                },
                system: {
                    allowNativeBroker: true
                }
            })
            await expect(pca.acquireTokenPopup({ scopes: [] })).rejects.toMatchObject(BrowserAuthError.createNativeBrokerCalledBeforeInitialize());
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
            expect(response?.idToken).not.toBeNull();
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
        it("goes directly to the native broker if nativeAccountId is present", async () => {
            pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID
                },
                system: {
                    allowNativeBroker: true
                }
            });

            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: "3338040d-6c67-4c5b-b112-36a304b66dad",
                username: "AbeLi@microsoft.com",
                nativeAccountId: "test-nativeAccountId"
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

            sinon.stub(NativeMessageHandler, "createProvider").callsFake(async () => {
                return new NativeMessageHandler(pca.getLogger(), 2000, "test-extensionId");
            });
            await pca.initialize();
            const nativeAcquireTokenSpy = sinon.stub(NativeInteractionClient.prototype, "acquireToken").callsFake(async () => {
                return testTokenResponse;
            });
            const silentSpy = sinon.stub(SilentIframeClient.prototype, "acquireToken").callsFake(async () => {
                return testTokenResponse;
            });
            const response = await pca.ssoSilent({
                scopes: ["User.Read"],
                account: testAccount
            });

            expect(response).toEqual(testTokenResponse);
            expect(nativeAcquireTokenSpy.calledOnce).toBeTruthy();
            expect(silentSpy.calledOnce).toBeFalsy();
        });

        it("falls back to web flow if native broker call fails due to fatal error", async () => {
            pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID
                },
                system: {
                    allowNativeBroker: true
                }
            });

            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: "3338040d-6c67-4c5b-b112-36a304b66dad",
                username: "AbeLi@microsoft.com",
                nativeAccountId: "test-nativeAccountId"
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

            sinon.stub(NativeMessageHandler, "createProvider").callsFake(async () => {
                return new NativeMessageHandler(pca.getLogger(), 2000, "test-extensionId");
            });
            await pca.initialize();
            const nativeAcquireTokenSpy = sinon.stub(NativeInteractionClient.prototype, "acquireToken").callsFake(async () => {
                throw new NativeAuthError("ContentError", "error in extension");
            });
            const silentSpy = sinon.stub(SilentIframeClient.prototype, "acquireToken").callsFake(async () => {
                return testTokenResponse;
            });
            const response = await pca.ssoSilent({
                scopes: ["User.Read"],
                account: testAccount
            });

            expect(response).toBe(testTokenResponse);
            expect(nativeAcquireTokenSpy.calledOnce).toBeTruthy();
            expect(silentSpy.calledOnce).toBeTruthy();
        });

        it("throws error if native broker call fails due to non-fatal error", async () => {
            pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID
                },
                system: {
                    allowNativeBroker: true
                }
            });

            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: "3338040d-6c67-4c5b-b112-36a304b66dad",
                username: "AbeLi@microsoft.com",
                nativeAccountId: "test-nativeAccountId"
            };

            sinon.stub(NativeMessageHandler, "createProvider").callsFake(async () => {
                return new NativeMessageHandler(pca.getLogger(), 2000, "test-extensionId");
            });
            await pca.initialize();
            const nativeAcquireTokenSpy = sinon.stub(NativeInteractionClient.prototype, "acquireToken").callsFake(async () => {
                throw new Error("testError");
            });
            const silentSpy = sinon.stub(SilentIframeClient.prototype, "acquireToken").callsFake(async () => {
                throw new Error("testError");
            });

            await pca.ssoSilent({
                scopes: ["User.Read"],
                account: testAccount
            }).catch(e => {
                expect(e.message).toEqual("testError");
            });
            expect(nativeAcquireTokenSpy.calledOnce).toBeTruthy();
            expect(silentSpy.calledOnce).toBeFalsy();
        });

        it("doesnt mutate request correlation id", async () => {
            const request: SilentRequest = {
                scopes: []
            };

            const result1 = await pca.ssoSilent(request)
                .catch(() => null);

            const result2 = await pca.ssoSilent(request)
            .catch(() => null);

            expect(request.correlationId).toBe(undefined);
        });

        it("throws an error if allowNativeBroker: true and initialize was not called prior", async () => {
            pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID
                },
                system: {
                    allowNativeBroker: true
                }
            })
            await expect(pca.ssoSilent({ scopes: [] })).rejects.toMatchObject(BrowserAuthError.createNativeBrokerCalledBeforeInitialize());
        });

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
            expect(response?.idToken).not.toBeNull();
            expect(response).toEqual(testTokenResponse);
            expect(silentClientSpy.calledOnce).toBe(true);
        });
    });

    describe("acquireTokenByCode", () => {
        it("goes directly to the native broker if nativeAccountId is present", async () => {
            pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID
                },
                system: {
                    allowNativeBroker: true
                }
            });

            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: "3338040d-6c67-4c5b-b112-36a304b66dad",
                username: "AbeLi@microsoft.com",
                nativeAccountId: "test-nativeAccountId"
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

            sinon.stub(NativeMessageHandler, "createProvider").callsFake(async () => {
                return new NativeMessageHandler(pca.getLogger(), 2000, "test-extensionId");
            });
            await pca.initialize();
            const nativeAcquireTokenSpy = sinon.stub(NativeInteractionClient.prototype, "acquireToken").callsFake(async () => {
                return testTokenResponse;
            });
            const response = await pca.acquireTokenByCode({
                scopes: ["User.Read"],
                nativeAccountId: "test-nativeAccountId"
            });

            expect(response).toEqual(testTokenResponse);
            expect(nativeAcquireTokenSpy.calledOnce).toBeTruthy();
        });

        it("throws error if native broker call fails", async () => {
            pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID
                },
                system: {
                    allowNativeBroker: true
                }
            });

            sinon.stub(NativeMessageHandler, "createProvider").callsFake(async () => {
                return new NativeMessageHandler(pca.getLogger(), 2000, "test-extensionId");
            });
            await pca.initialize();
            const nativeAcquireTokenSpy = sinon.stub(NativeInteractionClient.prototype, "acquireToken").callsFake(async () => {
                throw new NativeAuthError("ContentError", "something went wrong in the extension");
            });

            await pca.acquireTokenByCode({
                scopes: ["User.Read"],
                nativeAccountId: "test-nativeAccountId"
            }).catch(e => {
                expect(e.errorCode).toEqual("ContentError");
            });
            expect(nativeAcquireTokenSpy.calledOnce).toBeTruthy();
        });

        it("throws error if nativeAccountId is provided but extension is not installed", async () => {
            pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID
                },
                system: {
                    allowNativeBroker: true
                }
            });
            await pca.initialize();

            const nativeAcquireTokenSpy = sinon.spy(NativeInteractionClient.prototype, "acquireToken");

            await pca.acquireTokenByCode({
                scopes: ["User.Read"],
                nativeAccountId: "test-nativeAccountId"
            }).catch(e => {
                expect(e.errorCode).toEqual(BrowserAuthErrorMessage.unableToAcquireTokenFromNativePlatform.code);
                expect(e.errorMessage).toEqual(BrowserAuthErrorMessage.unableToAcquireTokenFromNativePlatform.desc);
            });
            expect(nativeAcquireTokenSpy.calledOnce).toBeFalsy();
        });

        it("doesnt mutate request correlation id", async () => {
            const request: AuthorizationCodeRequest = {
                code: "123"
            };

            const result1 = await pca.acquireTokenByCode(request)
                .catch(() => null);

            const result2 = await pca.acquireTokenByCode(request)
            .catch(() => null);

            expect(request.correlationId).toBe(undefined);
        });

        it("throws an error if allowNativeBroker: true and initialize was not called prior", async () => {
            pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID
                },
                system: {
                    allowNativeBroker: true
                }
            })
            await expect(pca.acquireTokenByCode({})).rejects.toMatchObject(BrowserAuthError.createNativeBrokerCalledBeforeInitialize());
        });

        it("Calls SilentAuthCodeClient.acquireToken and returns its response", async () => {
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
            const silentClientSpy = sinon.stub(SilentAuthCodeClient.prototype, "acquireToken").resolves(testTokenResponse);

            const response = await pca.acquireTokenByCode({
                code: "auth-code",
                correlationId: testTokenResponse.correlationId
            });
            expect(response?.idToken).not.toBeNull();
            expect(response).toEqual(testTokenResponse);
            expect(silentClientSpy.calledWith({
                code: "auth-code",
                correlationId: testTokenResponse.correlationId
            })).toBe(true);
        });

        it("calls SilentAuthCodeClient.acquireToken once if multiple concurrent calls are made", async () => {
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
            const silentClientSpy = sinon.stub(SilentAuthCodeClient.prototype, "acquireToken").resolves(testTokenResponse);

            const [
                response,
                response2
            ] = await Promise.all([
                pca.acquireTokenByCode({
                    code: "auth-code",
                    correlationId: testTokenResponse.correlationId
                }),
                pca.acquireTokenByCode({
                    code: "auth-code",
                    correlationId: testTokenResponse.correlationId
                })
            ]);

            expect(response).toEqual(testTokenResponse);
            expect(response2).toEqual(testTokenResponse);
            expect(silentClientSpy.callCount).toBe(1);
            expect(silentClientSpy.calledWith({
                code: "auth-code",
                correlationId: testTokenResponse.correlationId
            })).toBe(true);
        });

        it("calls SilentAuthCodeClient.acquireToken twice if multiple serial calls are made", async () => {
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
            const silentClientSpy = sinon.stub(SilentAuthCodeClient.prototype, "acquireToken").resolves(testTokenResponse);

            const response = await pca.acquireTokenByCode({
                code: "auth-code",
                correlationId: testTokenResponse.correlationId
            });

            const response2 = await pca.acquireTokenByCode({
                code: "auth-code",
                correlationId: testTokenResponse.correlationId
            });

            expect(response).toEqual(testTokenResponse);
            expect(response2).toEqual(testTokenResponse);
            expect(silentClientSpy.callCount).toBe(2);
            expect(silentClientSpy.calledWith({
                code: "auth-code",
                correlationId: testTokenResponse.correlationId
            })).toBe(true);
        });

        it("throws an error if falsey code is provided", () => {
            expect(pca.acquireTokenByCode({ code: "" })).rejects.toMatchObject(BrowserAuthError.createAuthCodeOrNativeAccountIdRequiredError())
        });
    });

    describe("acquireTokenSilent", () => {
        it("throws No Account error if no account is provided", async () => {
            await expect(pca.acquireTokenSilent({scopes: []})).rejects.toMatchObject(BrowserAuthError.createNoAccountError());
        });

        it("throws an error if allowNativeBroker: true and initialize was not called prior", async () => {
            pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID
                },
                system: {
                    allowNativeBroker: true
                }
            })
            await expect(pca.acquireTokenSilent({ scopes: [] })).rejects.toMatchObject(BrowserAuthError.createNativeBrokerCalledBeforeInitialize());
        });

        it("goes directly to the native broker if nativeAccountId is present", async () => {
            pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID
                },
                system: {
                    allowNativeBroker: true
                }
            });

            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: "3338040d-6c67-4c5b-b112-36a304b66dad",
                username: "AbeLi@microsoft.com",
                nativeAccountId: "test-nativeAccountId"
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

            sinon.stub(NativeMessageHandler, "createProvider").callsFake(async () => {
                return new NativeMessageHandler(pca.getLogger(), 2000, "test-extensionId");
            });
            await pca.initialize();
            const nativeAcquireTokenSpy = sinon.stub(NativeInteractionClient.prototype, "acquireToken").callsFake(async () => {
                return testTokenResponse;
            });
            const silentSpy = sinon.stub(SilentIframeClient.prototype, "acquireToken").callsFake(async () => {
                return testTokenResponse;
            });
            const response = await pca.acquireTokenSilent({
                scopes: ["User.Read"],
                account: testAccount
            });

            expect(response).toEqual(testTokenResponse);
            expect(nativeAcquireTokenSpy.calledOnce).toBeTruthy();
            expect(silentSpy.calledOnce).toBeFalsy();
        });

        it("falls back to web flow if native broker call fails due to fatal error", async () => {
            pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID
                },
                system: {
                    allowNativeBroker: true
                }
            });

            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: "3338040d-6c67-4c5b-b112-36a304b66dad",
                username: "AbeLi@microsoft.com",
                nativeAccountId: "test-nativeAccountId"
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

            sinon.stub(NativeMessageHandler, "createProvider").callsFake(async () => {
                return new NativeMessageHandler(pca.getLogger(), 2000, "test-extensionId");
            });
            await pca.initialize();
            const nativeAcquireTokenSpy = sinon.stub(NativeInteractionClient.prototype, "acquireToken").callsFake(async () => {
                throw new NativeAuthError("ContentError", "error in extension");
            });
            const silentSpy = sinon.stub(SilentIframeClient.prototype, "acquireToken").callsFake(async () => {
                return testTokenResponse;
            });
            const response = await pca.acquireTokenSilent({
                scopes: ["User.Read"],
                account: testAccount
            });

            expect(response).toBe(testTokenResponse);
            expect(nativeAcquireTokenSpy.calledOnce).toBeTruthy();
            expect(silentSpy.calledOnce).toBeTruthy();
        });

        it("throws error if native broker call fails due to non-fatal error", async () => {
            pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID
                },
                system: {
                    allowNativeBroker: true
                }
            });

            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: "3338040d-6c67-4c5b-b112-36a304b66dad",
                username: "AbeLi@microsoft.com",
                nativeAccountId: "test-nativeAccountId"
            };

            sinon.stub(NativeMessageHandler, "createProvider").callsFake(async () => {
                return new NativeMessageHandler(pca.getLogger(), 2000, "test-extensionId");
            });
            await pca.initialize();
            const nativeAcquireTokenSpy = sinon.stub(NativeInteractionClient.prototype, "acquireToken").callsFake(async () => {
                throw new Error("testError");
            });
            const silentSpy = sinon.stub(SilentIframeClient.prototype, "acquireToken").callsFake(async () => {
                throw new Error("testError");
            });

            await pca.acquireTokenSilent({
                scopes: ["User.Read"],
                account: testAccount
            }).catch(e => {
                expect(e.message).toEqual("testError");
            });
            expect(nativeAcquireTokenSpy.calledOnce).toBeTruthy();
            expect(silentSpy.calledOnce).toBeFalsy();
        });

        it("doesnt mutate request correlation id", async () => {
            const request: SilentRequest = {
                scopes: []
            };

            const result1 = await pca.acquireTokenSilent(request)
                .catch(() => null);

            const result2 = await pca.acquireTokenSilent(request)
            .catch(() => null);

            expect(request.correlationId).toBe(undefined);
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
            expect(response?.idToken).not.toBeNull();
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
            const testTokenResponse:AuthenticationResult = {
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
            sinon.stub(CryptoOps.prototype, "hashString").resolves(TEST_CRYPTO_VALUES.TEST_SHA256_HASH);
            const atsSpy = sinon.spy(PublicClientApplication.prototype, <any>"acquireTokenSilentAsync");
            const silentATStub = sinon.stub(RefreshTokenClient.prototype, "acquireTokenByRefreshToken").resolves(testTokenResponse);
            const tokenRequest: CommonSilentFlowRequest = {
                scopes: ["User.Read"],
                account: testAccount,
                authority: TEST_CONFIG.validAuthority,
                authenticationScheme: AuthenticationScheme.BEARER,
                claims: JSON.stringify({claim: "claim"}),
                correlationId: TEST_CONFIG.CORRELATION_ID,
                forceRefresh: false
            };
            const expectedTokenRequest: CommonSilentFlowRequest = {
                ...tokenRequest,
                scopes: ["User.Read"],
                authority: `${Constants.DEFAULT_AUTHORITY}`,
                correlationId: RANDOM_TEST_GUID,
                claims: JSON.stringify({claim: "claim"}),
                requestedClaimsHash: TEST_CRYPTO_VALUES.TEST_SHA256_HASH,
                forceRefresh: false
            };

            const silentRequest1 = pca.acquireTokenSilent(tokenRequest);
            const silentRequest2 = pca.acquireTokenSilent(tokenRequest);
            const silentRequest3 = pca.acquireTokenSilent(tokenRequest);
            const parallelResponse = await Promise.all([silentRequest1, silentRequest2, silentRequest3]);

            expect(silentATStub.calledWith(expectedTokenRequest)).toBeTruthy();
            expect(atsSpy.calledOnce).toBe(true);
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
            sinon.stub(CryptoOps.prototype, "hashString").resolves(TEST_CRYPTO_VALUES.TEST_SHA256_HASH);
            const silentATStub = sinon.stub(RefreshTokenClient.prototype, "acquireTokenByRefreshToken").resolves(testTokenResponse);
            // Beaerer requests
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

            // PoP requests
            const popTokenRequest1: CommonSilentFlowRequest = {
                scopes: ["User.Read"],
                account: testAccount,
                authority: TEST_CONFIG.validAuthority,
                authenticationScheme: AuthenticationScheme.POP,
                resourceRequestMethod: "GET",
                resourceRequestUri: "https://testUri.com/user.read",
                correlationId: TEST_CONFIG.CORRELATION_ID,
                forceRefresh: false
            }

            const popTokenRequest2: CommonSilentFlowRequest = {
                scopes: ["Mail.Read"],
                account: testAccount,
                authority: TEST_CONFIG.validAuthority,
                authenticationScheme: AuthenticationScheme.POP,
                resourceRequestMethod: "GET",
                resourceRequestUri: "https://testUri.com/mail.read",
                correlationId: TEST_CONFIG.CORRELATION_ID,
                forceRefresh: false
            }
            const expectedPopTokenRequest1: CommonSilentFlowRequest = {
                ...popTokenRequest1,
                scopes: ["User.Read"],
                authority: `${Constants.DEFAULT_AUTHORITY}`,
                correlationId: RANDOM_TEST_GUID,
                forceRefresh: false
            };

            const expectedPopTokenRequest2: CommonSilentFlowRequest = {
                ...popTokenRequest2,
                scopes: ["Mail.Read"],
                authority: `${Constants.DEFAULT_AUTHORITY}`,
                correlationId: RANDOM_TEST_GUID,
                forceRefresh: false
            };

            // SSH Certificate requests
            const sshCertRequest1: CommonSilentFlowRequest = {
                scopes: ["User.Read"],
                account: testAccount,
                authority: TEST_CONFIG.validAuthority,
                authenticationScheme: AuthenticationScheme.SSH,
                sshJwk: TEST_SSH_VALUES.ENCODED_SSH_JWK,
                sshKid: TEST_SSH_VALUES.SSH_KID,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                forceRefresh: false
            }

            const sshCertRequest2: CommonSilentFlowRequest = {
                scopes: ["Mail.Read"],
                account: testAccount,
                authority: TEST_CONFIG.validAuthority,
                authenticationScheme: AuthenticationScheme.SSH,
                sshJwk: TEST_SSH_VALUES.ALTERNATE_ENCODED_SSH_JWK,
                sshKid: TEST_SSH_VALUES.ALTERNATE_SSH_KID,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                forceRefresh: false
            }

            const expectedSshCertificateRequest1: CommonSilentFlowRequest = {
                ...sshCertRequest1,
                scopes: ["User.Read"],
                authority: `${Constants.DEFAULT_AUTHORITY}`,
                correlationId: RANDOM_TEST_GUID,
                forceRefresh: false
            };

            const expectedSshCertificateRequest2: CommonSilentFlowRequest = {
                ...sshCertRequest2,
                scopes: ["Mail.Read"],
                authority: `${Constants.DEFAULT_AUTHORITY}`,
                correlationId: RANDOM_TEST_GUID,
                forceRefresh: false
            };

            // Requests with claims
            const claimsRequest1: CommonSilentFlowRequest = {
                scopes: ["User.Read"],
                account: testAccount,
                authority: TEST_CONFIG.validAuthority,
                authenticationScheme: AuthenticationScheme.BEARER,
                claims: JSON.stringify({ claim1: "claim1"}),
                correlationId: TEST_CONFIG.CORRELATION_ID,
                forceRefresh: false
            }

            const claimsRequest2: CommonSilentFlowRequest = {
                scopes: ["User.Read"],
                account: testAccount,
                authority: TEST_CONFIG.validAuthority,
                authenticationScheme: AuthenticationScheme.BEARER,
                claims: JSON.stringify({ claim2: "claim2"}),
                requestedClaimsHash: TEST_CRYPTO_VALUES.TEST_SHA256_HASH,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                forceRefresh: false
            }

            const expectedClaimsRequest1: CommonSilentFlowRequest = {
                ...claimsRequest1,
                scopes: ["User.Read"],
                authority: `${Constants.DEFAULT_AUTHORITY}`,
                correlationId: RANDOM_TEST_GUID,
                claims: JSON.stringify({ claim1: "claim1"}),
                requestedClaimsHash: TEST_CRYPTO_VALUES.TEST_SHA256_HASH,
                forceRefresh: false
            };

            const expectedClaimsRequest2: CommonSilentFlowRequest = {
                ...claimsRequest2,
                scopes: ["User.Read"],
                authority: `${Constants.DEFAULT_AUTHORITY}`,
                correlationId: RANDOM_TEST_GUID,
                claims: JSON.stringify({ claim2: "claim2"}),
                requestedClaimsHash: TEST_CRYPTO_VALUES.TEST_SHA256_HASH,
                forceRefresh: false
            };

            const silentRequest1 = pca.acquireTokenSilent(tokenRequest1);
            const silentRequest2 = pca.acquireTokenSilent(tokenRequest1);
            const silentRequest3 = pca.acquireTokenSilent(tokenRequest2);
            const popSilentRequest1 = pca.acquireTokenSilent(popTokenRequest1);
            const popSilentRequest2 = pca.acquireTokenSilent(popTokenRequest1);
            const popSilentRequest3 = pca.acquireTokenSilent(popTokenRequest2);
            const sshCertSilentRequest1 = pca.acquireTokenSilent(sshCertRequest1);
            const sshCertSilentRequest2 = pca.acquireTokenSilent(sshCertRequest1);
            const sshCertSilentRequest3 = pca.acquireTokenSilent(sshCertRequest2);
            const claimsSilentRequest1 = pca.acquireTokenSilent(claimsRequest1);
            const claimsSilentRequest2 = pca.acquireTokenSilent(claimsRequest1);
            const claimsSilentRequest3 = pca.acquireTokenSilent(claimsRequest2);
            await Promise.all([
                silentRequest1, silentRequest2, silentRequest3,
                popSilentRequest1, popSilentRequest2, popSilentRequest3,
                sshCertSilentRequest1, sshCertSilentRequest2, sshCertSilentRequest3,
                claimsSilentRequest1, claimsSilentRequest2, claimsSilentRequest3
            ]);

            expect(silentATStub.calledWith(expectedTokenRequest1)).toBeTruthy();
            expect(silentATStub.calledWith(expectedTokenRequest2)).toBeTruthy();
            expect(silentATStub.calledWith(expectedPopTokenRequest1)).toBeTruthy();
            expect(silentATStub.calledWith(expectedPopTokenRequest2)).toBeTruthy();
            expect(silentATStub.calledWith(expectedSshCertificateRequest1)).toBeTruthy();
            expect(silentATStub.calledWith(expectedSshCertificateRequest2)).toBeTruthy();
            expect(silentATStub.calledWith(expectedClaimsRequest1)).toBeTruthy();
            expect(silentATStub.calledWith(expectedClaimsRequest2)).toBeTruthy();
            expect(silentATStub.callCount).toEqual(8);
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
            const atsSpy = sinon.spy(PublicClientApplication.prototype, <any>"acquireTokenSilentAsync");
            sinon.stub(RefreshTokenClient.prototype, <any>"acquireTokenByRefreshToken").rejects(testError);
            const tokenRequest = {
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                account: testAccount
            };
            const silentRequest1 = pca.acquireTokenSilent(tokenRequest);
            const silentRequest2 = pca.acquireTokenSilent(tokenRequest);
            const silentRequest3 = pca.acquireTokenSilent(tokenRequest);
            try {
                await Promise.all([silentRequest1, silentRequest2, silentRequest3]);
            } catch (e) {
                // Await resolution of all 3 promises since this catch block will execute as soon as any of them throw
                await silentRequest1.catch(() => {});
                await silentRequest2.catch(() => {});
                await silentRequest3.catch(() => {});
                // Test that error was cached for telemetry purposes and then thrown
                expect(atsSpy.calledOnce).toBe(true);
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
                authenticationScheme: TEST_CONFIG.TOKEN_TYPE_BEARER as AuthenticationScheme,
                correlationId: RANDOM_TEST_GUID,
                authority: `${Constants.DEFAULT_AUTHORITY}`,
                prompt: "none",
                redirectUri: TEST_URIS.TEST_REDIR_URI,
                state: TEST_STATE_VALUES.TEST_STATE_SILENT,
                nonce: RANDOM_TEST_GUID,
                responseMode: ResponseMode.FRAGMENT
            };
            const tokenResp = await pca.acquireTokenSilent(CommonSilentFlowRequest);

            expect(tokenResp).toEqual(testTokenResponse);
            expect(silentTokenHelperStub.args[0][1]).toEqual(expect.objectContaining(expectedRequest));
        });

        it("emits expect performance event when successful", (done) => {
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
            sinon.stub(ProtocolUtils, "setRequestState").returns(TEST_STATE_VALUES.TEST_STATE_SILENT);
            const silentRequest: SilentRequest = {
                scopes: ["User.Read"],
                account: testAccount
            };

            const atsSpy = sinon.stub(PublicClientApplication.prototype, <any>"acquireTokenSilentAsync").resolves({
                fromCache :true,
                accessToken: "abc",
                idToken: "defg",
                fromNativeBroker: true
            });

            const callbackId = pca.addPerformanceCallback((events => {
                expect(events[0].correlationId).toBe(RANDOM_TEST_GUID)
                expect(events[0].success).toBe(true);
                expect(events[0].fromCache).toBe(true);
                expect(events[0].accessTokenSize).toBe(3);
                expect(events[0].idTokenSize).toBe(4);
                expect(events[0].isNativeBroker).toBe(true);
                expect(events[0].requestId).toBe(undefined);

                pca.removePerformanceCallback(callbackId);
                done();
            }));

            pca.acquireTokenSilent(silentRequest);
        });

        it("emits expect performance event when there is an error", (done) => {
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
            sinon.stub(ProtocolUtils, "setRequestState").returns(TEST_STATE_VALUES.TEST_STATE_SILENT);
            const silentRequest: SilentRequest = {
                scopes: ["User.Read"],
                account: testAccount
            };

            const atsSpy = sinon.stub(PublicClientApplication.prototype, <any>"acquireTokenSilentAsync").rejects({
                errorCode: "abc",
                subError: "defg"
            });

            const callbackId = pca.addPerformanceCallback((events => {
                expect(events[0].correlationId).toBe(RANDOM_TEST_GUID)
                expect(events[0].success).toBe(false);
                expect(events[0].errorCode).toBe("abc");
                expect(events[0].subErrorCode).toBe("defg");

                pca.removePerformanceCallback(callbackId);
                done();
            }));

            pca.acquireTokenSilent(silentRequest).catch(() => {})
        });

        describe("Cache Lookup Policies", () => {
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

            const refreshRequiredCacheError = ClientAuthError.createRefreshRequiredError();
            const refreshRequiredServerError = new ServerError(BrowserConstants.INVALID_GRANT_ERROR, "Refresh Token expired")

            afterEach(() => {
                sinon.restore();
            });
            
            it("Calls SilentCacheClient.acquireToken, SilentRefreshClient.acquireToken and SilentIframeClient.acquireToken if cache lookup throws and refresh token is expired when CacheLookupPolicy is set to Default", async () => {
                const silentCacheSpy = sinon.stub(SilentCacheClient.prototype, "acquireToken").rejects(refreshRequiredCacheError);
                const silentRefreshSpy = sinon.stub(SilentRefreshClient.prototype, "acquireToken").rejects(refreshRequiredServerError);
                const silentIframeSpy = sinon.stub(SilentIframeClient.prototype, "acquireToken").resolves(testTokenResponse);
                
                const response = pca.acquireTokenSilent({scopes: ["openid"], account: testAccount, cacheLookupPolicy: CacheLookupPolicy.Default});
                await expect(response).resolves.toEqual(testTokenResponse);
                expect(silentCacheSpy.calledOnce).toBeTruthy();
                expect(silentRefreshSpy.calledOnce).toBeTruthy();
                expect(silentIframeSpy.calledOnce).toBeTruthy();
            });

            it("Calls SilentCacheClient.acquireToken, and doesn't call SilentRefreshClient.acquireToken or SilentIframeClient.acquireToken if cache lookup throws when CacheLookupPolicy is set to AccessToken", async () => {
                const silentCacheSpy = sinon.stub(SilentCacheClient.prototype, "acquireToken").rejects(refreshRequiredCacheError);
                const silentRefreshSpy = sinon.stub(SilentRefreshClient.prototype, "acquireToken");
                const silentIframeSpy = sinon.stub(SilentIframeClient.prototype, "acquireToken");

                const response = pca.acquireTokenSilent({scopes: ["openid"], account: testAccount, cacheLookupPolicy: CacheLookupPolicy.AccessToken});
                await expect(response).rejects.toMatchObject(refreshRequiredCacheError);
                expect(silentCacheSpy.calledOnce).toBeTruthy();
                expect(silentRefreshSpy.notCalled).toBeTruthy();
                expect(silentIframeSpy.notCalled).toBeTruthy();
            });

            it("Calls SilentCacheClient.acquireToken and SilentRefreshClient.acquireToken, and doesn't call SilentIframeClient.acquireToken if cache lookup throws and refresh token is expired when CacheLookupPolicy is set to AccessTokenAndRefreshToken", async () => {
                const silentCacheSpy = sinon.stub(SilentCacheClient.prototype, "acquireToken").rejects(refreshRequiredCacheError);
                const silentRefreshSpy = sinon.stub(SilentRefreshClient.prototype, "acquireToken").rejects(refreshRequiredServerError);
                const silentIframeSpy = sinon.stub(SilentIframeClient.prototype, "acquireToken");

                const response = pca.acquireTokenSilent({scopes: ["openid"], account: testAccount, cacheLookupPolicy: CacheLookupPolicy.AccessTokenAndRefreshToken});
                await expect(response).rejects.toMatchObject(refreshRequiredServerError);
                expect(silentCacheSpy.calledOnce).toBeTruthy();
                expect(silentRefreshSpy.calledOnce).toBeTruthy();
                expect(silentIframeSpy.notCalled).toBeTruthy();
            });

            it("Calls SilentRefreshClient.acquireToken, and doesn't call SilentCacheClient.acquireToken or SilentIframeClient.acquireToken if refresh token is expired when CacheLookupPolicy is set to RefreshToken", async () => {
                const silentCacheSpy = sinon.stub(SilentCacheClient.prototype, "acquireToken");
                const silentRefreshSpy = sinon.stub(SilentRefreshClient.prototype, "acquireToken").rejects(refreshRequiredServerError);
                const silentIframeSpy = sinon.stub(SilentIframeClient.prototype, "acquireToken");

                const response = pca.acquireTokenSilent({scopes: ["openid"], account: testAccount, cacheLookupPolicy: CacheLookupPolicy.RefreshToken});
                await expect(response).rejects.toMatchObject(refreshRequiredServerError);
                expect(silentCacheSpy.notCalled).toBeTruthy();
                expect(silentRefreshSpy.calledOnce).toBeTruthy();
                expect(silentIframeSpy.notCalled).toBeTruthy();
            });

            it("Calls SilentRefreshClient.acquireToken and SilentIframeClient.acquireToken, and doesn't call SilentCacheClient.acquireToken if refresh token is expired when CacheLookupPolicy is set to RefreshTokenAndNetwork", async () => {
                const silentCacheSpy = sinon.stub(SilentCacheClient.prototype, "acquireToken");
                const silentRefreshSpy = sinon.stub(SilentRefreshClient.prototype, "acquireToken").rejects(refreshRequiredServerError);
                const silentIframeSpy = sinon.stub(SilentIframeClient.prototype, "acquireToken").resolves(testTokenResponse);

                const response = pca.acquireTokenSilent({scopes: ["openid"], account: testAccount, cacheLookupPolicy: CacheLookupPolicy.RefreshTokenAndNetwork});
                await expect(response).resolves.toEqual(testTokenResponse);
                expect(silentCacheSpy.notCalled).toBeTruthy();
                expect(silentRefreshSpy.calledOnce).toBeTruthy();
                expect(silentIframeSpy.calledOnce).toBeTruthy();
            });

            it("Calls SilentIframeClient.acquireToken, and doesn't call SilentCacheClient.acquireToken or SilentRefreshClient.acquireToken when CacheLookupPolicy is set to Skip", async () => {
                const silentCacheSpy = sinon.stub(SilentCacheClient.prototype, "acquireToken");
                const silentRefreshSpy = sinon.stub(SilentRefreshClient.prototype, "acquireToken");
                const silentIframeSpy = sinon.stub(SilentIframeClient.prototype, "acquireToken").resolves(testTokenResponse);

                const response = pca.acquireTokenSilent({scopes: ["openid"], account: testAccount, cacheLookupPolicy: CacheLookupPolicy.Skip});
                await expect(response).resolves.toEqual(testTokenResponse);
                expect(silentCacheSpy.notCalled).toBeTruthy();
                expect(silentRefreshSpy.notCalled).toBeTruthy();
                expect(silentIframeSpy.calledOnce).toBeTruthy();
            });
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

        it("doesnt mutate request correlation id", async () => {
            sinon.stub(pca, "logoutRedirect").callsFake((request) => {
                return Promise.resolve();
            });
            const request: EndSessionRequest = { };

            const result1 = await pca.logout(request)
                .catch(() => null);

            const result2 = await pca.logout(request)
            .catch(() => null);

            expect(request.correlationId).toBe(undefined);
        });
    });

    describe("logoutRedirect", () => {
        it("doesnt mutate request correlation id", async () => {
            sinon.stub(RedirectClient.prototype, "logout").resolves();

            const request: EndSessionRequest = { };

            const result1 = await pca.logoutRedirect(request)
                .catch(() => null);

            const result2 = await pca.logoutRedirect(request)
            .catch(() => null);

            expect(request.correlationId).toBe(undefined);
        });

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
        it("doesnt mutate request correlation id", async () => {
            sinon.stub(PopupClient.prototype, "logout").resolves()

            const request: EndSessionRequest = { };

            const result1 = await pca.logoutPopup(request)
                .catch(() => null);

            const result2 = await pca.logoutPopup(request)
            .catch(() => null);

            expect(request.correlationId).toBe(undefined);
        });

        it("Calls PopupClient.logout and returns its response", async () => {
            const popupClientSpy = sinon.stub(PopupClient.prototype, "logout").resolves();

            const response = await pca.logoutPopup();
            expect(response).toEqual(undefined);
            expect(popupClientSpy.calledOnce).toBe(true);
        });

        it("throws error if interaction is in progress", async () => {
            const browserCrypto = new CryptoOps(new Logger({}));
            const logger = new Logger({});
            const browserStorage = new BrowserCacheManager("client-id", cacheConfig, browserCrypto, logger);
            browserStorage.setInteractionInProgress(true);

            await expect(pca.logoutPopup()).rejects.toMatchObject(BrowserAuthError.createInteractionInProgressError());
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
            idToken: TEST_TOKENS.IDTOKEN_V2,
            idTokenClaims: ID_TOKEN_CLAIMS,
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

        const idTokenData1 = {
            "realm": testAccountInfo1.tenantId,
            "environment": testAccountInfo1.environment,
            "credentialType": "IdToken",
            "secret": TEST_TOKENS.IDTOKEN_V2,
            "clientId": TEST_CONFIG.MSAL_CLIENT_ID,
            "homeAccountId": testAccountInfo1.homeAccountId,
        };

        // Account 2
        const testAccountInfo2: AccountInfo = {
            homeAccountId: "different-home-account-id",
            environment: "login.windows.net",
            tenantId: TEST_DATA_CLIENT_INFO.TEST_UTID,
            username: "anotherExample@microsoft.com",
            name: "Abe Lincoln",
            localAccountId: TEST_CONFIG.OID,
            idToken: TEST_TOKENS.IDTOKEN_V2,
            idTokenClaims: ID_TOKEN_CLAIMS,
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
        
        const idTokenData2 = {
            "realm": testAccountInfo2.tenantId,
            "environment": testAccountInfo2.environment,
            "credentialType": "IdToken",
            "secret": TEST_TOKENS.IDTOKEN_V2,
            "clientId": TEST_CONFIG.MSAL_CLIENT_ID,
            "homeAccountId": testAccountInfo2.homeAccountId,
        };
        
        beforeEach(() => {
            sinon.stub(CacheManager.prototype, "getAuthorityMetadataByAlias").callsFake((host) => {
                const authorityMetadata = new AuthorityMetadataEntity();
                authorityMetadata.updateCloudDiscoveryMetadata({
                    aliases: [host],
                    preferred_cache: host,
                    preferred_network: host
                }, false);
                return authorityMetadata;
            });

            const cacheKey1 = AccountEntity.generateAccountCacheKey(testAccountInfo1);
            window.sessionStorage.setItem(cacheKey1, JSON.stringify(testAccount1));

            const idToken1 = CacheManager.toObject(new IdTokenEntity(), idTokenData1);
            const idTokenKey1 = idToken1.generateCredentialKey();
            window.sessionStorage.setItem(idTokenKey1, JSON.stringify(idToken1));

            const cacheKey2 = AccountEntity.generateAccountCacheKey(testAccountInfo2);
            window.sessionStorage.setItem(cacheKey2, JSON.stringify(testAccount2));

            const idToken2 = CacheManager.toObject(new IdTokenEntity(), idTokenData2);
            const idTokenKey2 = idToken2.generateCredentialKey();
            window.sessionStorage.setItem(idTokenKey2, JSON.stringify(idToken2));
        });

        afterEach(() => {
            sinon.restore();
            window.sessionStorage.clear();
        });

        it("getAllAccounts returns all signed in accounts", () => {
            const accounts = pca.getAllAccounts();
            expect(accounts).toHaveLength(2);
            expect(accounts[0].idToken).not.toBeUndefined();
            expect(accounts[1].idToken).not.toBeUndefined();
        });

        it("getAllAccounts returns empty array if no accounts signed in", () => {
            window.sessionStorage.clear();
            const accounts = pca.getAllAccounts();
            expect(accounts).toEqual([]);
        });

        it("getAccountByUsername returns account specified", () => {
            const account = pca.getAccountByUsername("example@microsoft.com");
            expect(account?.idToken).not.toBeUndefined();
            expect(account).toEqual(testAccountInfo1);
        });

        it("getAccountByUsername returns account specified with case mismatch", () => {
            const account = pca.getAccountByUsername("Example@Microsoft.com");
            expect(account?.idToken).not.toBeUndefined();
            expect(account).toEqual(testAccountInfo1);

            const account2 = pca.getAccountByUsername("anotherexample@microsoft.com");
            expect(account2?.idToken).not.toBeUndefined();
            expect(account2).toEqual(testAccountInfo2);
        });

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
            expect(account?.idToken).not.toBeUndefined();
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
            expect(account?.idToken).not.toBeUndefined();
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
            idToken: TEST_TOKENS.IDTOKEN_V2,
            idTokenClaims: ID_TOKEN_CLAIMS,
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
        
        const idTokenData1 = {
            "realm": testAccountInfo1.tenantId,
            "environment": testAccountInfo1.environment,
            "credentialType": "IdToken",
            "secret": TEST_TOKENS.IDTOKEN_V2,
            "clientId": TEST_CONFIG.MSAL_CLIENT_ID,
            "homeAccountId": testAccountInfo1.homeAccountId,
        };

        beforeEach(() => {
            const cacheKey1 = AccountEntity.generateAccountCacheKey(testAccountInfo1);
            window.sessionStorage.setItem(cacheKey1, JSON.stringify(testAccount1));

            const idToken1 = CacheManager.toObject(new IdTokenEntity(), idTokenData1);
            const idTokenKey1 = idToken1.generateCredentialKey();
            window.sessionStorage.setItem(idTokenKey1, JSON.stringify(idToken1));
        });

        afterEach(() => {
            window.sessionStorage.clear();
        });

        describe("activeAccount getter and setter tests", () => {
            beforeEach(() => {
                sinon.stub(CacheManager.prototype, "getAuthorityMetadataByAlias").callsFake((host) => {
                    const authorityMetadata = new AuthorityMetadataEntity();
                    authorityMetadata.updateCloudDiscoveryMetadata({
                        aliases: [host],
                        preferred_cache: host,
                        preferred_network: host
                    }, false);
                    return authorityMetadata;
                });
            });
    
            afterEach(() => {
                sinon.restore();
            });

            it("active account is initialized as null", () => {
                // Public client should initialze with active account set to null.
                expect(pca.getActiveAccount()).toBe(null);
            });
    
            it("setActiveAccount() sets the active account local id value correctly", () => {
                expect(pca.getActiveAccount()).toBe(null);
                pca.setActiveAccount(testAccountInfo1);
                const activeAccount = pca.getActiveAccount();
                expect(activeAccount?.idToken).not.toBeUndefined();
                expect(activeAccount).toEqual(testAccountInfo1);
            });
    
            it("getActiveAccount looks up the current account values and returns them", () => {
                pca.setActiveAccount(testAccountInfo1);
                const activeAccount1 = pca.getActiveAccount();
                expect(activeAccount1?.idToken).not.toBeUndefined();
                expect(activeAccount1).toEqual(testAccountInfo1);
                
                const newName = "Ben Franklin";
                const newTestAccountInfo1 = {
                    ...testAccountInfo1,
                    name: newName,
                };
                const newTestAccount1 = {
                    ...testAccount1,
                    name: newName,
                };
                
                const cacheKey = AccountEntity.generateAccountCacheKey(newTestAccountInfo1);
                window.sessionStorage.setItem(cacheKey, JSON.stringify(newTestAccount1));
    
                const activeAccount2 = pca.getActiveAccount();
                expect(activeAccount2?.idToken).not.toBeUndefined();
                expect(activeAccount2).toEqual(newTestAccountInfo1);
            });

            describe("activeAccount tests with two accounts, both with same localId", () => {
                // Account 1
                const testAccountInfo1: AccountInfo = {
                    homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID + ".flow1",
                    environment: "login.windows.net",
                    tenantId: TEST_DATA_CLIENT_INFO.TEST_UTID,
                    username: "example@microsoft.com",
                    name: "Abe Lincoln",
                    localAccountId: TEST_CONFIG.OID,
                    idToken: TEST_TOKENS.IDTOKEN_V2,
                    idTokenClaims: ID_TOKEN_CLAIMS,
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
    
                const idTokenData1 = {
                    "realm": testAccountInfo1.tenantId,
                    "environment": testAccountInfo1.environment,
                    "credentialType": "IdToken",
                    "secret": TEST_TOKENS.IDTOKEN_V2,
                    "clientId": TEST_CONFIG.MSAL_CLIENT_ID,
                    "homeAccountId": testAccountInfo1.homeAccountId,
                };
    
                // Account 2
                const testAccountInfo2: AccountInfo = {
                    homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID + ".flow2",
                    environment: "login.windows.net",
                    tenantId: TEST_DATA_CLIENT_INFO.TEST_UTID,
                    username: "example@microsoft.com",
                    name: "Abe Lincoln",
                    localAccountId: TEST_CONFIG.OID,
                    idToken: TEST_TOKENS.IDTOKEN_V2,
                    idTokenClaims: ID_TOKEN_CLAIMS,
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
    
                const idTokenData2 = {
                    "realm": testAccountInfo2.tenantId,
                    "environment": testAccountInfo2.environment,
                    "credentialType": "IdToken",
                    "secret": TEST_TOKENS.IDTOKEN_V2,
                    "clientId": TEST_CONFIG.MSAL_CLIENT_ID,
                    "homeAccountId": testAccountInfo2.homeAccountId,
                };
    
                const cacheKey1 = AccountEntity.generateAccountCacheKey(testAccountInfo1);
                const idToken1 = CacheManager.toObject(new IdTokenEntity(), idTokenData1);
                const idTokenKey1 = idToken1.generateCredentialKey();
    
                const cacheKey2 = AccountEntity.generateAccountCacheKey(testAccountInfo2);
                const idToken2 = CacheManager.toObject(new IdTokenEntity(), idTokenData2);
                const idTokenKey2 = idToken2.generateCredentialKey();
    
                beforeEach(() => {
                    window.sessionStorage.setItem(cacheKey1, JSON.stringify(testAccount1));
                    window.sessionStorage.setItem(idTokenKey1, JSON.stringify(idToken1));
    
                    window.sessionStorage.setItem(cacheKey2, JSON.stringify(testAccount2));
                    window.sessionStorage.setItem(idTokenKey2, JSON.stringify(idToken2));
                });
    
                afterEach(() => {
                    window.sessionStorage.clear();
                });
    
                it("setActiveAccount sets both home id and local id", () => {
                    expect(pca.getActiveAccount()).toBe(null);
    
                    pca.setActiveAccount(testAccountInfo1);
                    const activeAccount = pca.getActiveAccount();
                    expect(activeAccount).not.toBeNull();
                    expect(activeAccount?.idToken).not.toBeUndefined();
                    expect(activeAccount?.homeAccountId).toEqual(testAccountInfo1.homeAccountId);
                    expect(activeAccount?.localAccountId).toEqual(testAccountInfo1.localAccountId);
                });
    
                it("getActiveAccount gets correct account when two accounts with same local id are present in cache", () => {
                    expect(pca.getActiveAccount()).toBe(null);
    
                    pca.setActiveAccount(testAccountInfo1);
                    let activeAccount = pca.getActiveAccount();
                    expect(activeAccount?.idToken).not.toBeUndefined();
                    expect(activeAccount).toEqual(testAccountInfo1);
                    expect(activeAccount).not.toEqual(testAccountInfo2);
    
                    pca.setActiveAccount(testAccountInfo2);
                    activeAccount = pca.getActiveAccount();
                    expect(activeAccount?.idToken).not.toBeUndefined();
                    expect(pca.getActiveAccount()).not.toEqual(testAccountInfo1);
                    expect(pca.getActiveAccount()).toEqual(testAccountInfo2);
                });
    
                it("getActiveAccount returns null when active account is removed from cache when another account with same local id is present", () => {
                    expect(pca.getActiveAccount()).toBe(null);
    
                    pca.setActiveAccount(testAccountInfo2);
                    const activeAccount = pca.getActiveAccount();
                    expect(activeAccount?.idToken).not.toBeUndefined();
                    expect(activeAccount).not.toEqual(testAccountInfo1);
                    expect(activeAccount).toEqual(testAccountInfo2);
    
                    window.sessionStorage.removeItem(cacheKey2);
                    window.sessionStorage.removeItem(idTokenKey2);
                    expect(pca.getActiveAccount()).toBe(null);
                });
            });
        });
        
        describe("activeAccount logout", () => {
            const testAccountInfo2: AccountInfo = {
                homeAccountId: "different-home-account-id",
                environment: "login.windows.net",
                tenantId: TEST_DATA_CLIENT_INFO.TEST_UTID,
                username: "anotherExample@microsoft.com",
                name: "Abe Lincoln",
                localAccountId: TEST_CONFIG.OID,
            };

            const testAccountInfo3: AccountInfo = {
                ...testAccountInfo1,
                idToken: undefined,
                idTokenClaims: undefined,
            };
            
            beforeEach(() => {
                pca.setActiveAccount(testAccountInfo3);
                sinon.stub(AuthorizationCodeClient.prototype, "getLogoutUri").returns(testLogoutUrl);
                sinon.stub(NavigationClient.prototype, "navigateExternal").callsFake((urlNavigate: string, options: NavigationOptions): Promise<boolean> => {
                    expect(urlNavigate).toEqual(testLogoutUrl);
                    expect(options.noHistory).toBeFalsy();
                    return Promise.resolve(true);
                });
                const popupWindow = {...window};
                sinon.stub(PopupClient.prototype, "openPopup").returns(popupWindow);
                sinon.stub(PopupClient.prototype, "openSizedPopup").returns(popupWindow);
                sinon.stub(PopupClient.prototype, "cleanPopup");
            });

            afterEach(() => {
                sinon.restore();
            });

            it("Clears active account on logoutRedirect with no account", async () => {
                expect(pca.getActiveAccount()).toEqual(testAccountInfo3);
                await pca.logoutRedirect();
                expect(pca.getActiveAccount()).toBe(null);
            });
    
            it("Clears active account on logoutRedirect when the given account info matches", async () => {
                    expect(pca.getActiveAccount()).toEqual(testAccountInfo3);
                    await pca.logoutRedirect({
                        account: testAccountInfo3
                    });
                    expect(pca.getActiveAccount()).toBe(null);
                }
            );

            it("Does not clear active account on logoutRedirect if given account object does not match", async () => {
                    expect(pca.getActiveAccount()).toEqual(testAccountInfo3);
                    await pca.logoutRedirect({
                        account: testAccountInfo2
                    });
                    expect(pca.getActiveAccount()).toEqual(testAccountInfo1);
                }
            );

            it("Clears active account on logoutPopup with no account", async () => {
                expect(pca.getActiveAccount()).toEqual(testAccountInfo3);
                await pca.logoutPopup();
                expect(pca.getActiveAccount()).toBe(null);
            });
    
            it("Clears active account on logoutPopup when the given account info matches", async () => {
                    expect(pca.getActiveAccount()).toEqual(testAccountInfo3);
                    await pca.logoutPopup({
                        account: testAccountInfo3
                    });
                    expect(pca.getActiveAccount()).toBe(null);
                }
            );

            it("Does not clear active account on logoutPopup if given account object does not match", async () => {
                    expect(pca.getActiveAccount()).toEqual(testAccountInfo3);
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

    describe("preflightBrowserEnvironmentCheck", () => {
        it("calls setInteractionInProgress", () => {
            // @ts-ignore
            pca.preflightBrowserEnvironmentCheck(InteractionType.Popup);

            // @ts-ignore
            expect(pca.browserStorage.getInteractionInProgress()).toBeTruthy;
        });

        it("doesnt call setInteractionInProgress", () => {
            // @ts-ignore
            pca.preflightBrowserEnvironmentCheck(InteractionType.Popup, false);

            // @ts-ignore
            expect(pca.browserStorage.getInteractionInProgress()).toBeFalsy;
        });
    })
});
