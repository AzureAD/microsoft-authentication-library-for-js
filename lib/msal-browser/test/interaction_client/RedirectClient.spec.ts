/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import sinon from "sinon";
import { PublicClientApplication } from "../../src/app/PublicClientApplication";
import { TEST_CONFIG, TEST_URIS, TEST_HASHES, TEST_TOKENS, TEST_DATA_CLIENT_INFO, TEST_TOKEN_LIFETIMES, RANDOM_TEST_GUID, DEFAULT_OPENID_CONFIG_RESPONSE, testNavUrl, TEST_STATE_VALUES, DEFAULT_TENANT_DISCOVERY_RESPONSE, testLogoutUrl, TEST_SSH_VALUES } from "../utils/StringConstants";
import { ServerError, Constants, AccountInfo, TokenClaims, AuthenticationResult, CommonAuthorizationCodeRequest, CommonAuthorizationUrlRequest, AuthToken, PersistentCacheKeys, AuthorizationCodeClient, ResponseMode, ProtocolUtils, AuthenticationScheme, Logger, ServerTelemetryEntity, LogLevel, NetworkResponse, ServerAuthorizationTokenResponse, CcsCredential, CcsCredentialType, CommonEndSessionRequest, ServerTelemetryManager, AccountEntity, ClientConfigurationError } from "@azure/msal-common";
import { BrowserUtils } from "../../src/utils/BrowserUtils";
import { TemporaryCacheKeys, ApiId, BrowserCacheLocation, InteractionType } from "../../src/utils/BrowserConstants";
import { Base64Encode } from "../../src/encode/Base64Encode";
import { XhrClient } from "../../src/network/XhrClient";
import { BrowserAuthError, BrowserAuthErrorMessage } from "../../src/error/BrowserAuthError";
import { RedirectHandler } from "../../src/interaction_handler/RedirectHandler";
import { CryptoOps } from "../../src/crypto/CryptoOps";
import { BrowserCacheManager } from "../../src/cache/BrowserCacheManager";
import { RedirectRequest } from "../../src/request/RedirectRequest";
import { NavigationClient } from "../../src/navigation/NavigationClient";
import { NavigationOptions } from "../../src/navigation/NavigationOptions";
import { RedirectClient } from "../../src/interaction_client/RedirectClient";
import { EventHandler } from "../../src/event/EventHandler";
import { EventType } from "../../src/event/EventType";
import { NativeInteractionClient } from "../../src/interaction_client/NativeInteractionClient";
import { NativeMessageHandler } from "../../src/broker/nativeBroker/NativeMessageHandler";

const cacheConfig = {
    cacheLocation: BrowserCacheLocation.SessionStorage,
    storeAuthStateInCookie: false,
    secureCookies: false
};

const loggerOptions = {
    loggerCallback: (level: LogLevel, message: string, containsPii: boolean): void => {
        if (containsPii) {
            console.log(`Log level: ${level} Message: ${message}`);
        }
    },
    piiLoggingEnabled: true
};

describe("RedirectClient", () => {
    globalThis.MessageChannel = require("worker_threads").MessageChannel; // jsdom does not include an implementation for MessageChannel
    let redirectClient: RedirectClient;
    let browserStorage: BrowserCacheManager;
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
        sinon.stub(CryptoOps.prototype, "createNewGuid").returns(RANDOM_TEST_GUID);

        // @ts-ignore
        browserStorage = pca.browserStorage;

        // @ts-ignore
        redirectClient = new RedirectClient(pca.config, browserStorage, pca.browserCrypto, pca.logger, pca.eventHandler, pca.navigationClient, pca.performanceClient, pca.nativeInternalStorage);
    });

    afterEach(() => {
        sinon.restore();
        window.location.hash = "";
        window.sessionStorage.clear();
        window.localStorage.clear();
    });

    describe("handleRedirectPromise", () => {
        it("does nothing if no hash is detected", (done) => {
            browserStorage.setInteractionInProgress(true);
            const stateString = TEST_STATE_VALUES.TEST_STATE_REDIRECT;
            const browserCrypto = new CryptoOps(new Logger({}));
            const stateId = ProtocolUtils.parseRequestState(browserCrypto, stateString).libraryState.id;
            window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.REQUEST_STATE}.${stateId}`, TEST_STATE_VALUES.TEST_STATE_REDIRECT);
            redirectClient.handleRedirectPromise().then((response) => {
                expect(response).toBe(null);
                expect(window.localStorage.length).toEqual(0);
                expect(window.sessionStorage.length).toEqual(0);
                done();
            });
        });

        it("cleans temporary cache and return null if no state", (done) => {
            browserStorage.setInteractionInProgress(true);
            const stateString = TEST_STATE_VALUES.TEST_STATE_REDIRECT;
            const browserCrypto = new CryptoOps(new Logger({}));
            const stateId = ProtocolUtils.parseRequestState(browserCrypto, stateString).libraryState.id;
            window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.REQUEST_STATE}.${stateId}`, TEST_STATE_VALUES.TEST_STATE_REDIRECT);
            sinon.stub(RedirectClient.prototype, <any>"getRedirectResponseHash").returns(TEST_HASHES.TEST_SUCCESS_HASH_NO_STATE);
            redirectClient.handleRedirectPromise().then((response) => {
                expect(response).toBe(null);
                expect(window.localStorage.length).toEqual(0);
                expect(window.sessionStorage.length).toEqual(0);
                done();
            });
        });

        it("cleans temporary cache and return null if state is wrong interaction type", (done) => {
            browserStorage.setInteractionInProgress(true);
            const stateString = TEST_STATE_VALUES.TEST_STATE_REDIRECT;
            const browserCrypto = new CryptoOps(new Logger({}));
            const stateId = ProtocolUtils.parseRequestState(browserCrypto, stateString).libraryState.id;
            window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.REQUEST_STATE}.${stateId}`, TEST_STATE_VALUES.TEST_STATE_REDIRECT);
            sinon.stub(RedirectClient.prototype, <any>"getRedirectResponseHash").returns(TEST_HASHES.TEST_SUCCESS_CODE_HASH_POPUP);
            redirectClient.handleRedirectPromise().then((response) => {
                expect(response).toBe(null);
                expect(window.localStorage.length).toEqual(0);
                expect(window.sessionStorage.length).toEqual(0);
                done();
            });
        });

        it("cleans temporary cache and rethrows if error is thrown", (done) => {
            browserStorage.setInteractionInProgress(true);
            const stateString = TEST_STATE_VALUES.TEST_STATE_REDIRECT;
            const browserCrypto = new CryptoOps(new Logger({}));
            const stateId = ProtocolUtils.parseRequestState(browserCrypto, stateString).libraryState.id;
            window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.REQUEST_STATE}.${stateId}`, TEST_STATE_VALUES.TEST_STATE_REDIRECT);
            const testError = {
                errorCode: "Unexpected error!",
                errorDesc: "Unexpected error"
            }
            sinon.stub(RedirectClient.prototype, <any>"getRedirectResponseHash").throws(testError);
            redirectClient.handleRedirectPromise().catch((e) => {
                expect(e).toMatchObject(testError);
                expect(window.localStorage.length).toEqual(0);
                expect(window.sessionStorage.length).toEqual(1); // telemetry
                done();
            });
        });

        it("cleans temporary cache and return null if state cannot be decoded", (done) => {
            browserStorage.setInteractionInProgress(true);
            const stateString = TEST_STATE_VALUES.TEST_STATE_REDIRECT;
            const browserCrypto = new CryptoOps(new Logger({}));
            const stateId = ProtocolUtils.parseRequestState(browserCrypto, stateString).libraryState.id;
            window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.REQUEST_STATE}.${stateId}`, TEST_STATE_VALUES.TEST_STATE_REDIRECT);
            //sinon.stub(BrowserProtocolUtils, "extractBrowserRequestState").returns(null);
            sinon.stub(RedirectClient.prototype, <any>"getRedirectResponseHash").returns(TEST_HASHES.TEST_SUCCESS_HASH_STATE_NO_META);
            redirectClient.handleRedirectPromise().then((response) => {
                expect(response).toBe(null);
                expect(window.localStorage.length).toEqual(0);
                expect(window.sessionStorage.length).toEqual(0);
                done();
            });
        });

        it("gets hash from cache and processes response", async () => {
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

            const tokenResponse = await redirectClient.handleRedirectPromise();
            expect(tokenResponse?.uniqueId).toEqual(testTokenResponse.uniqueId);
            expect(tokenResponse?.tenantId).toEqual(testTokenResponse.tenantId);
            expect(tokenResponse?.scopes).toEqual(testTokenResponse.scopes);
            expect(tokenResponse?.idToken).toEqual(testTokenResponse.idToken);
            expect(tokenResponse?.idTokenClaims).toEqual(expect.objectContaining(testTokenResponse.idTokenClaims));
            expect(tokenResponse?.accessToken).toEqual(testTokenResponse.accessToken);
            expect(tokenResponse?.expiresOn && testTokenResponse.expiresOn && testTokenResponse.expiresOn.getMilliseconds() >= tokenResponse.expiresOn.getMilliseconds()).toBeTruthy();
            expect(window.sessionStorage.length).toEqual(4);
        });

        it("gets hash from cache and calls native broker if hash contains accountId", async () => {
            pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID
                },
                system: {
                    allowNativeBroker: true
                }
            });
            // @ts-ignore
            const nativeMessageHandler = new NativeMessageHandler(pca.logger);
            // @ts-ignore
            redirectClient = new RedirectClient(pca.config, browserStorage, pca.browserCrypto, pca.logger, pca.eventHandler, pca.navigationClient, pca.performanceClient, pca.nativeInternalStorage, nativeMessageHandler);
            const b64Encode = new Base64Encode();
            const stateString = TEST_STATE_VALUES.TEST_STATE_REDIRECT;
            const browserCrypto = new CryptoOps(new Logger({}));
            const stateId = ProtocolUtils.parseRequestState(browserCrypto, stateString).libraryState.id;

            window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.ORIGIN_URI}`, TEST_URIS.TEST_REDIR_URI);
            window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.AUTHORITY}.${stateId}`, TEST_CONFIG.validAuthority);
            window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.REQUEST_STATE}.${stateId}`, TEST_STATE_VALUES.TEST_STATE_REDIRECT);
            window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.URL_HASH}`, TEST_HASHES.TEST_SUCCESS_NATIVE_ACCOUNT_ID_REDIRECT);
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
                username: testIdTokenClaims.preferred_username || "",
                nativeAccountId: "test-nativeAccountId"
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
            sinon.stub(NativeInteractionClient.prototype, "acquireToken").resolves(testTokenResponse);

            const tokenResponse = await redirectClient.handleRedirectPromise();
            expect(tokenResponse?.uniqueId).toEqual(testTokenResponse.uniqueId);
            expect(tokenResponse?.tenantId).toEqual(testTokenResponse.tenantId);
            expect(tokenResponse?.scopes).toEqual(testTokenResponse.scopes);
            expect(tokenResponse?.idToken).toEqual(testTokenResponse.idToken);
            expect(tokenResponse?.idTokenClaims).toEqual(expect.objectContaining(testTokenResponse.idTokenClaims));
            expect(tokenResponse?.accessToken).toEqual(testTokenResponse.accessToken);
            expect(tokenResponse?.expiresOn && testTokenResponse.expiresOn && testTokenResponse.expiresOn.getMilliseconds() >= tokenResponse.expiresOn.getMilliseconds()).toBeTruthy();
        });

        it("gets hash from cache and throws if hash contains accountId but native broker connection is not established", (done) => {
            pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID
                },
                system: {
                    allowNativeBroker: true
                }
            });
            // @ts-ignore
            redirectClient = new RedirectClient(pca.config, browserStorage, pca.browserCrypto, pca.logger, pca.eventHandler, pca.navigationClient, pca.performanceClient, pca.nativeInternalStorage);
            const b64Encode = new Base64Encode();
            const stateString = TEST_STATE_VALUES.TEST_STATE_REDIRECT;
            const browserCrypto = new CryptoOps(new Logger({}));
            const stateId = ProtocolUtils.parseRequestState(browserCrypto, stateString).libraryState.id;

            window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.ORIGIN_URI}`, TEST_URIS.TEST_REDIR_URI);
            window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.AUTHORITY}.${stateId}`, TEST_CONFIG.validAuthority);
            window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.REQUEST_STATE}.${stateId}`, TEST_STATE_VALUES.TEST_STATE_REDIRECT);
            window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.URL_HASH}`, TEST_HASHES.TEST_SUCCESS_NATIVE_ACCOUNT_ID_REDIRECT);
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

            redirectClient.handleRedirectPromise().catch(e => {
                expect(e.errorCode).toEqual(BrowserAuthErrorMessage.nativeConnectionNotEstablished.code);
                expect(e.errorMessage).toEqual(BrowserAuthErrorMessage.nativeConnectionNotEstablished.desc);
                done();
            });
        });

        it("throws no cached authority error if authority is not in cache", (done) => {
            const b64Encode = new Base64Encode();
            const stateString = TEST_STATE_VALUES.TEST_STATE_REDIRECT;
            const browserCrypto = new CryptoOps(new Logger({}));
            const stateId = ProtocolUtils.parseRequestState(browserCrypto, stateString).libraryState.id;

            window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.ORIGIN_URI}`, TEST_URIS.TEST_REDIR_URI);
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

            redirectClient.handleRedirectPromise().catch((e) => {
                expect(e).toMatchObject(BrowserAuthError.createNoCachedAuthorityError());
                expect(window.sessionStorage.length).toEqual(1); // telemetry
                done();
            });
        });

        it("gets hash from cache and processes error", (done) => {
            const testAuthCodeRequest: CommonAuthorizationCodeRequest = {
                redirectUri: TEST_URIS.TEST_REDIR_URI,
                scopes: ["scope1", "scope2"],
                code: "",
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                authenticationScheme: TEST_CONFIG.TOKEN_TYPE_BEARER as AuthenticationScheme
            };

            const stateString = TEST_STATE_VALUES.TEST_STATE_REDIRECT;
            const browserCrypto = new CryptoOps(new Logger({}));
            const stateId = ProtocolUtils.parseRequestState(browserCrypto, stateString).libraryState.id;

            window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.REQUEST_PARAMS}`, browserCrypto.base64Encode(JSON.stringify(testAuthCodeRequest)));
            window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.ORIGIN_URI}`, TEST_URIS.TEST_REDIR_URI);
            window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.AUTHORITY}.${stateId}`, TEST_CONFIG.validAuthority);
            window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.REQUEST_STATE}.${stateId}`, TEST_STATE_VALUES.TEST_STATE_REDIRECT);
            window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.URL_HASH}`, TEST_HASHES.TEST_ERROR_HASH);
            window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TemporaryCacheKeys.INTERACTION_STATUS_KEY}`, TEST_CONFIG.MSAL_CLIENT_ID);

            redirectClient.handleRedirectPromise().catch((err) => {
                expect(err instanceof ServerError).toBeTruthy();
                done();
            });
        });

        it("processes hash if navigateToLoginRequestUri is false and request origin is the same", async () => {
            const b64Encode = new Base64Encode();
            const stateString = TEST_STATE_VALUES.TEST_STATE_REDIRECT;
            const browserCrypto = new CryptoOps(new Logger({}));
            const stateId = ProtocolUtils.parseRequestState(browserCrypto, stateString).libraryState.id;

            window.location.hash = TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT;
            window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.ORIGIN_URI}`, TEST_URIS.TEST_REDIR_URI);
            window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.AUTHORITY}.${stateId}`, TEST_CONFIG.validAuthority);
            window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.REQUEST_STATE}.${stateId}`, TEST_STATE_VALUES.TEST_STATE_REDIRECT);
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
            const pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                    navigateToLoginRequestUrl: false
                }
            });

            // @ts-ignore
            redirectClient = new RedirectClient(pca.config, pca.browserStorage, pca.browserCrypto, pca.logger, pca.eventHandler, pca.navigationClient, pca.performanceClient, pca.nativeInternalStorage);

            const tokenResponse = await redirectClient.handleRedirectPromise();
            expect(tokenResponse?.uniqueId).toEqual(testTokenResponse.uniqueId);
            expect(tokenResponse?.tenantId).toEqual(testTokenResponse.tenantId);
            expect(tokenResponse?.scopes).toEqual(testTokenResponse.scopes);
            expect(tokenResponse?.idToken).toEqual(testTokenResponse.idToken);
            expect(tokenResponse?.idTokenClaims).toEqual(expect.objectContaining(testTokenResponse.idTokenClaims));
            expect(tokenResponse?.accessToken).toEqual(testTokenResponse.accessToken);
            expect(testTokenResponse.expiresOn && tokenResponse?.expiresOn && testTokenResponse.expiresOn.getMilliseconds() >= tokenResponse.expiresOn.getMilliseconds()).toBeTruthy();
            expect(window.sessionStorage.length).toEqual(4);
            expect(window.location.hash).toBe("");
        });

        it("calls custom navigateInternal function then processes hash", async () => {
            const b64Encode = new Base64Encode();
            const stateString = TEST_STATE_VALUES.TEST_STATE_REDIRECT;
            const browserCrypto = new CryptoOps(new Logger({}));
            const stateId = ProtocolUtils.parseRequestState(browserCrypto, stateString).libraryState.id;

            window.location.hash = TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT;
            window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.ORIGIN_URI}`, TEST_URIS.TEST_ALTERNATE_REDIR_URI);
            window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.AUTHORITY}.${stateId}`, TEST_CONFIG.validAuthority);
            window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.REQUEST_STATE}.${stateId}`, TEST_STATE_VALUES.TEST_STATE_REDIRECT);
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
            const testServerTokenResponse: NetworkResponse<ServerAuthorizationTokenResponse> = {
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
                "nonce": "123523"
            };

            const testAccount: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: testIdTokenClaims.tid!,
                username: testIdTokenClaims.preferred_username!
            };

            const testTokenResponse: AuthenticationResult = {
                authority: TEST_CONFIG.validAuthority,
                uniqueId: testIdTokenClaims.oid!,
                tenantId: testIdTokenClaims.tid!,
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                idToken: testServerTokenResponse.body.id_token!,
                idTokenClaims: testIdTokenClaims,
                accessToken: testServerTokenResponse.body.access_token!,
                fromCache: false,
                correlationId: RANDOM_TEST_GUID,
                expiresOn: new Date(Date.now() + (testServerTokenResponse.body.expires_in! * 1000)),
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
            const pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                }
            });

            let callbackCalled = false;
            const navigationClient = new NavigationClient();
            navigationClient.navigateInternal = async (url: string, options: NavigationOptions): Promise<boolean> => {
                    callbackCalled = true;
                    expect(url).toEqual(TEST_URIS.TEST_ALTERNATE_REDIR_URI);
                    expect(options.noHistory).toBeTruthy();
                    expect(options.apiId).toEqual(ApiId.handleRedirectPromise);
                    return false;
            };
            pca.setNavigationClient(navigationClient);

            // @ts-ignore
            redirectClient = new RedirectClient(pca.config, pca.browserStorage, pca.browserCrypto, pca.logger, pca.eventHandler, pca.navigationClient, pca.performanceClient, pca.nativeInternalStorage);

            const tokenResponse = await redirectClient.handleRedirectPromise();
            if (!tokenResponse) {
                expect(tokenResponse).not.toBe(null);
                throw new Error("Token Response is null!"); // Throw to resolve Typescript complaints below
            }
            expect(callbackCalled).toBeTruthy();
            expect(tokenResponse.uniqueId).toEqual(testTokenResponse.uniqueId);
            expect(tokenResponse.tenantId).toEqual(testTokenResponse.tenantId);
            expect(tokenResponse.scopes).toEqual(testTokenResponse.scopes);
            expect(tokenResponse.idToken).toEqual(testTokenResponse.idToken);
            expect(tokenResponse.idTokenClaims).toEqual(expect.objectContaining(testTokenResponse.idTokenClaims));
            expect(tokenResponse.accessToken).toEqual(testTokenResponse.accessToken);
            expect(testTokenResponse.expiresOn!.getMilliseconds() >= tokenResponse.expiresOn!.getMilliseconds()).toBeTruthy();
            expect(window.sessionStorage.length).toEqual(4);
            expect(window.location.hash).toBe("");
        });

        it("processes hash if navigateToLoginRequestUri is false and request origin is different", async () => {
            const b64Encode = new Base64Encode();
            const stateString = TEST_STATE_VALUES.TEST_STATE_REDIRECT;
            const browserCrypto = new CryptoOps(new Logger({}));
            const stateId = ProtocolUtils.parseRequestState(browserCrypto, stateString).libraryState.id;

            window.location.hash = TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT;
            window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.ORIGIN_URI}`, TEST_URIS.TEST_ALTERNATE_REDIR_URI);
            window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.AUTHORITY}.${stateId}`, TEST_CONFIG.validAuthority);
            window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.REQUEST_STATE}.${stateId}`, TEST_STATE_VALUES.TEST_STATE_REDIRECT);
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
            const pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                    navigateToLoginRequestUrl: false
                }
            });

            // @ts-ignore
            redirectClient = new RedirectClient(pca.config, pca.browserStorage, pca.browserCrypto, pca.logger, pca.eventHandler, pca.navigationClient, pca.performanceClient, pca.nativeInternalStorage);

            const tokenResponse = await redirectClient.handleRedirectPromise();
            expect(tokenResponse?.uniqueId).toEqual(testTokenResponse.uniqueId);
            expect(tokenResponse?.tenantId).toEqual(testTokenResponse.tenantId);
            expect(tokenResponse?.scopes).toEqual(testTokenResponse.scopes);
            expect(tokenResponse?.idToken).toEqual(testTokenResponse.idToken);
            expect(tokenResponse?.idTokenClaims).toEqual(expect.objectContaining(testTokenResponse.idTokenClaims));
            expect(tokenResponse?.accessToken).toEqual(testTokenResponse.accessToken);
            expect(testTokenResponse.expiresOn && tokenResponse?.expiresOn && testTokenResponse.expiresOn.getMilliseconds() >= tokenResponse.expiresOn.getMilliseconds()).toBeTruthy();
            expect(window.sessionStorage.length).toEqual(4);
            expect(window.location.hash).toBe("");
        });

        it("returns null if interaction is not in progress", async () => {
            browserStorage.setInteractionInProgress(false);
            window.location.hash = TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT;
            window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.ORIGIN_URI}`, TEST_URIS.TEST_ALTERNATE_REDIR_URI);
            expect(await redirectClient.handleRedirectPromise()).toBe(null);
        });

        it("returns null if interaction is in progress for a different clientId", async () => {
            const browserCrypto = new CryptoOps(new Logger({}));
            const logger = new Logger({});
            const secondInstanceStorage = new BrowserCacheManager("different-client-id", cacheConfig, browserCrypto, logger);
            secondInstanceStorage.setInteractionInProgress(true);
            browserStorage.setInteractionInProgress(false);
            window.location.hash = TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT;
            window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.ORIGIN_URI}`, TEST_URIS.TEST_ALTERNATE_REDIR_URI);
            expect(browserStorage.isInteractionInProgress(true)).toBe(false);
            expect(browserStorage.isInteractionInProgress(false)).toBe(true);
            expect(secondInstanceStorage.isInteractionInProgress(true)).toBe(true);
            expect(secondInstanceStorage.isInteractionInProgress(false)).toBe(true);
            expect(await redirectClient.handleRedirectPromise()).toBe(null);
        });

        it("navigates and caches hash if navigateToLoginRequestUri is true and interaction type is redirect", async () => {
            browserStorage.setInteractionInProgress(true);
            window.location.hash = TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT;
            window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.ORIGIN_URI}`, TEST_URIS.TEST_ALTERNATE_REDIR_URI);
            sinon.stub(NavigationClient.prototype, "navigateInternal").callsFake((urlNavigate: string, options: NavigationOptions): Promise<boolean> => {
                expect(options.noHistory).toBeTruthy();
                expect(options.timeout).toBeGreaterThan(0);
                expect(urlNavigate).toEqual(TEST_URIS.TEST_ALTERNATE_REDIR_URI);
                return Promise.resolve(true);
            });
            await redirectClient.handleRedirectPromise();
            expect(window.sessionStorage.getItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.URL_HASH}`)).toEqual(TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT);
        });

        it("navigates and caches hash if navigateToLoginRequestUri is true, the application is loaded in an iframe and allowRedirectInIframe is true", async () => {
            const pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID
                }
            });
            const config = {
                // @ts-ignore
                ...pca.config,
                system: {
                    // @ts-ignore
                    ...pca.config.system,
                    allowRedirectInIframe: true
                }
            }
            // @ts-ignore
            redirectClient = new RedirectClient(config, browserStorage, pca.browserCrypto, pca.logger, pca.eventHandler, pca.navigationClient, pca.performanceClient, pca.nativeInternalStorage);
            sinon.stub(BrowserUtils, "isInIframe").returns(true);
            browserStorage.setInteractionInProgress(true);
            window.location.hash = TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT;
            window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.ORIGIN_URI}`, TEST_URIS.TEST_ALTERNATE_REDIR_URI);
            sinon.stub(NavigationClient.prototype, "navigateInternal").callsFake((urlNavigate: string, options: NavigationOptions): Promise<boolean> => {
                expect(options.noHistory).toBeTruthy();
                expect(options.timeout).toBeGreaterThan(0);
                expect(urlNavigate).toEqual(TEST_URIS.TEST_ALTERNATE_REDIR_URI);
                return Promise.resolve(true);
            });
            await redirectClient.handleRedirectPromise();
            expect(window.sessionStorage.getItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.URL_HASH}`)).toEqual(TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT);
        });

        it("navigates to root and caches hash if navigateToLoginRequestUri is true", (done) => {
            browserStorage.setInteractionInProgress(true);
            window.location.hash = TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT;
            sinon.stub(NavigationClient.prototype, "navigateInternal").callsFake((urlNavigate: string, options: NavigationOptions): Promise<boolean> => {
                expect(options.noHistory).toBeTruthy();
                expect(options.timeout).toBeGreaterThan(0);
                expect(urlNavigate).toEqual("https://localhost:8081/");
                expect(window.sessionStorage.getItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.ORIGIN_URI}`)).toEqual("https://localhost:8081/");
                done();
                return Promise.resolve(true);
            });
            redirectClient.handleRedirectPromise();
            expect(window.sessionStorage.getItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.URL_HASH}`)).toEqual(TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT);
        });

        it("navigates to root and caches hash if navigateToLoginRequestUri is true and loginRequestUrl is 'null'", (done) => {
            browserStorage.setInteractionInProgress(true);
            window.location.hash = TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT;
            window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.ORIGIN_URI}`, "null");
            sinon.stub(NavigationClient.prototype, "navigateInternal").callsFake((urlNavigate: string, options: NavigationOptions): Promise<boolean> => {
                expect(options.noHistory).toBeTruthy();
                expect(options.timeout).toBeGreaterThan(0);
                expect(urlNavigate).toEqual("https://localhost:8081/");
                expect(window.sessionStorage.getItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.ORIGIN_URI}`)).toEqual("https://localhost:8081/");
                done();
                return Promise.resolve(true);
            });
            redirectClient.handleRedirectPromise();
            expect(window.sessionStorage.getItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.URL_HASH}`)).toEqual(TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT);
        });

        it("navigates and caches hash if navigateToLoginRequestUri is true and loginRequestUrl contains query string", (done) => {
            browserStorage.setInteractionInProgress(true);
            const loginRequestUrl = window.location.href + "?testQueryString=1";
            window.location.hash = TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT;
            window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.ORIGIN_URI}`, loginRequestUrl);
            sinon.stub(NavigationClient.prototype, "navigateInternal").callsFake((urlNavigate: string, options: NavigationOptions): Promise<boolean> => {
                expect(options.noHistory).toBeTruthy();
                expect(options.timeout).toBeGreaterThan(0);
                expect(urlNavigate).toEqual(loginRequestUrl);
                done();
                return Promise.resolve(true);
            });
            redirectClient.handleRedirectPromise();
            expect(window.sessionStorage.getItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.URL_HASH}`)).toEqual(TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT);
        });

        it("navigates and caches hash if navigateToLoginRequestUri is true and loginRequestUrl contains query string and hash", (done) => {
            browserStorage.setInteractionInProgress(true);
            const loginRequestUrl = window.location.href + "?testQueryString=1#testHash";
            window.location.hash = TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT;
            window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.ORIGIN_URI}`, loginRequestUrl);
            sinon.stub(NavigationClient.prototype, "navigateInternal").callsFake((urlNavigate: string, options: NavigationOptions): Promise<boolean> => {
                expect(options.noHistory).toBeTruthy();
                expect(options.timeout).toBeGreaterThan(0);
                expect(urlNavigate).toEqual(loginRequestUrl);
                done();
                return Promise.resolve(true);
            });
            redirectClient.handleRedirectPromise();
            expect(window.sessionStorage.getItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.URL_HASH}`)).toEqual(TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT);
        });

        it("replaces custom hash if navigateToLoginRequestUri is true and loginRequestUrl contains custom hash", () => {
            browserStorage.setInteractionInProgress(true);
            const loginRequestUrl = window.location.href + "#testHash";
            window.location.hash = TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT;
            window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.ORIGIN_URI}`, loginRequestUrl);
            sinon.stub(RedirectClient.prototype, <any>"handleHash").callsFake((responseHash) => {
                expect(responseHash).toEqual(TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT);
            });
            redirectClient.handleRedirectPromise().then(() => {
                expect(window.location.href).toEqual(loginRequestUrl);
            });
        });

        it("replaces custom hash if navigateToLoginRequestUri is true and loginRequestUrl contains custom hash (passed in)", () => {
            browserStorage.setInteractionInProgress(true);
            const loginRequestUrl = window.location.href + "#testHash";
            window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.ORIGIN_URI}`, loginRequestUrl);
            sinon.stub(RedirectClient.prototype, <any>"handleHash").callsFake((responseHash) => {
                expect(responseHash).toEqual(TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT);
            });
            redirectClient.handleRedirectPromise(TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT).then(() => {
                expect(window.location.href).toEqual(loginRequestUrl);
            });
        });

        it("Does not clear custom hash if response hash is retrieved from temporary cache", () => {
            browserStorage.setInteractionInProgress(true);
            window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.ORIGIN_URI}`, window.location.href);
            window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.URL_HASH}`, TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT);

            window.location.hash = "testHash";
            const clearHashSpy = sinon.spy(BrowserUtils, "clearHash");

            sinon.stub(RedirectClient.prototype, <any>"handleHash").callsFake((responseHash) => {
                expect(responseHash).toEqual(TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT);
            });

            redirectClient.handleRedirectPromise().then(() => {
                expect(clearHashSpy.notCalled).toBe(true);
                expect(window.location.hash).toEqual("#testHash");
            });
        });

        it("processes hash if navigateToLoginRequestUri is true and loginRequestUrl contains trailing slash", (done) => {
            browserStorage.setInteractionInProgress(true);
            const loginRequestUrl = window.location.href.endsWith("/") ? window.location.href.slice(0, -1) : window.location.href + "/";
            window.location.hash = TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT;
            window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.ORIGIN_URI}`, loginRequestUrl);
            sinon.stub(RedirectClient.prototype, <any>"handleHash").callsFake((responseHash) => {
                expect(responseHash).toEqual(TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT);
                done();
            });
            redirectClient.handleRedirectPromise();
        });

        it("returns null if inside an iframe", (done) => {
            browserStorage.setInteractionInProgress(true);
            sinon.stub(BrowserUtils, "isInIframe").returns(true);
            const loginRequestUrl = window.location.href + "/testPage";
            window.location.hash = TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT;
            window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.ORIGIN_URI}`, loginRequestUrl);

            redirectClient.handleRedirectPromise().then((response) => {
                expect(response).toBe(null);
                done();
            });
        });

        it("clears hash if navigateToLoginRequestUri is false and loginRequestUrl contains custom hash", (done) => {
            const pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                    navigateToLoginRequestUrl: false
                }
            });
            // @ts-ignore
            redirectClient = new RedirectClient(pca.config, pca.browserStorage, pca.browserCrypto, pca.logger, pca.eventHandler, pca.navigationClient, pca.performanceClient, pca.nativeInternalStorage);

            browserStorage.setInteractionInProgress(true);
            const loginRequestUrl = window.location.href + "#testHash";
            window.location.hash = TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT;
            window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.ORIGIN_URI}`, loginRequestUrl);
            sinon.stub(RedirectClient.prototype, <any>"handleHash").callsFake((responseHash) => {
                expect(window.location.href).not.toContain("#testHash");
                expect(responseHash).toEqual(TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT);
                done();
            });
            redirectClient.handleRedirectPromise();
        });
    });

    describe("acquireToken", () => {
        it("throws error when AuthenticationScheme is set to SSH and SSH JWK is omitted from the request", async () => {
            const loginRequest: CommonAuthorizationUrlRequest = {
                redirectUri: TEST_URIS.TEST_REDIR_URI,
                scopes: ["user.read"],
                state: TEST_STATE_VALUES.USER_STATE,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                responseMode: TEST_CONFIG.RESPONSE_MODE as ResponseMode,
                nonce: "",
                authenticationScheme: AuthenticationScheme.SSH
            };

            expect(redirectClient.acquireToken(loginRequest)).rejects.toThrow(ClientConfigurationError.createMissingSshJwkError());
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
                sshJwk: TEST_SSH_VALUES.SSH_JWK
            };

            expect(redirectClient.acquireToken(request)).rejects.toThrow(ClientConfigurationError.createMissingSshKidError());
        });

        it("navigates to created login url", (done) => {
            sinon.stub(RedirectHandler.prototype, "initiateAuthRequest").callsFake(async (navigateUrl): Promise<void> => {
                try {
                    expect(navigateUrl).toEqual(testNavUrl);
                    return Promise.resolve(done());
                } catch (err) {
                    Promise.reject(err);
                }
            });
            sinon.stub(CryptoOps.prototype, "generatePkceCodes").resolves({
                challenge: TEST_CONFIG.TEST_CHALLENGE,
                verifier: TEST_CONFIG.TEST_VERIFIER
            });
            const loginRequest: CommonAuthorizationUrlRequest = {
                redirectUri: TEST_URIS.TEST_REDIR_URI,
                scopes: ["user.read"],
                state: TEST_STATE_VALUES.USER_STATE,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                responseMode: TEST_CONFIG.RESPONSE_MODE as ResponseMode,
                nonce: "",
                authenticationScheme: TEST_CONFIG.TOKEN_TYPE_BEARER as AuthenticationScheme
            };

            redirectClient.acquireToken(loginRequest);
        });

        it("Updates cache entries correctly", async () => {
            const emptyRequest: CommonAuthorizationUrlRequest = {
                redirectUri: TEST_URIS.TEST_REDIR_URI,
                scopes: [],
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

            sinon.stub(NavigationClient.prototype, "navigateExternal").callsFake((urlNavigate: string, options: NavigationOptions): Promise<boolean> => {
                expect(options.noHistory).toBeFalsy();
                expect(urlNavigate).not.toBe("");
                return Promise.resolve(true);
            });
            const testLogger = new Logger(loggerOptions);

            const browserCrypto = new CryptoOps(new Logger({}));
            const browserStorage = new BrowserCacheManager(TEST_CONFIG.MSAL_CLIENT_ID, cacheConfig, browserCrypto, testLogger);
            await redirectClient.acquireToken(emptyRequest);
            expect(browserStorage.getTemporaryCache(browserStorage.generateStateKey(TEST_STATE_VALUES.TEST_STATE_REDIRECT))).toEqual(TEST_STATE_VALUES.TEST_STATE_REDIRECT);
            expect(browserStorage.getTemporaryCache(browserStorage.generateNonceKey(TEST_STATE_VALUES.TEST_STATE_REDIRECT))).toEqual(RANDOM_TEST_GUID);
            expect(browserStorage.getTemporaryCache(browserStorage.generateAuthorityKey(TEST_STATE_VALUES.TEST_STATE_REDIRECT))).toEqual(`${Constants.DEFAULT_AUTHORITY}`);
        });

        it("Temporary cache is cleared when 'pageshow' event is fired", (done) => {
            let bfCacheCallback: (event: object) => any;
            jest.spyOn(window, "addEventListener").mockImplementation((eventName, callback) => {
                expect(eventName).toEqual("pageshow");
                // @ts-ignore
                bfCacheCallback = callback;
            });
            const emptyRequest: CommonAuthorizationUrlRequest = {
                redirectUri: TEST_URIS.TEST_REDIR_URI,
                scopes: [],
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

            const testLogger = new Logger(loggerOptions);
            const browserCrypto = new CryptoOps(new Logger({}));
            const browserStorage = new BrowserCacheManager(TEST_CONFIG.MSAL_CLIENT_ID, cacheConfig, browserCrypto, testLogger);

            sinon.stub(NavigationClient.prototype, "navigateExternal").callsFake((urlNavigate: string, options: NavigationOptions): Promise<boolean> => {
                expect(browserStorage.isInteractionInProgress()).toBe(true);
                expect(browserStorage.getTemporaryCache(browserStorage.generateStateKey(TEST_STATE_VALUES.TEST_STATE_REDIRECT))).toEqual(TEST_STATE_VALUES.TEST_STATE_REDIRECT);
                expect(browserStorage.getTemporaryCache(browserStorage.generateNonceKey(TEST_STATE_VALUES.TEST_STATE_REDIRECT))).toEqual(RANDOM_TEST_GUID);
                expect(browserStorage.getTemporaryCache(browserStorage.generateAuthorityKey(TEST_STATE_VALUES.TEST_STATE_REDIRECT))).toEqual(`${Constants.DEFAULT_AUTHORITY}`);
                bfCacheCallback({ persisted: true });
                expect(browserStorage.isInteractionInProgress()).toBe(false);
                expect(browserStorage.getTemporaryCache(browserStorage.generateStateKey(TEST_STATE_VALUES.TEST_STATE_REDIRECT))).toEqual(null);
                expect(browserStorage.getTemporaryCache(browserStorage.generateNonceKey(TEST_STATE_VALUES.TEST_STATE_REDIRECT))).toEqual(null);
                expect(browserStorage.getTemporaryCache(browserStorage.generateAuthorityKey(TEST_STATE_VALUES.TEST_STATE_REDIRECT))).toEqual(null);
                done();
                return Promise.resolve(true);
            });
            browserStorage.setInteractionInProgress(true); // This happens in PCA so need to set manually here
            redirectClient.acquireToken(emptyRequest);
        });

        it("Adds login_hint as CCS cache entry to the cache and urlNavigate", async () => {
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
            const testCcsCred: CcsCredential = {
                credential: testIdTokenClaims.preferred_username || "",
                type: CcsCredentialType.UPN
            };
            const emptyRequest: CommonAuthorizationUrlRequest = {
                redirectUri: TEST_URIS.TEST_REDIR_URI,
                scopes: [],
                state: TEST_STATE_VALUES.USER_STATE,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                responseMode: TEST_CONFIG.RESPONSE_MODE as ResponseMode,
                nonce: "",
                authenticationScheme: TEST_CONFIG.TOKEN_TYPE_BEARER as AuthenticationScheme,
                loginHint: testIdTokenClaims.preferred_username || ""
            };

            sinon.stub(CryptoOps.prototype, "generatePkceCodes").resolves({
                challenge: TEST_CONFIG.TEST_CHALLENGE,
                verifier: TEST_CONFIG.TEST_VERIFIER
            });

            sinon.stub(NavigationClient.prototype, "navigateExternal").callsFake((urlNavigate: string, options: NavigationOptions): Promise<boolean> => {
                expect(options.noHistory).toBeFalsy();
                expect(urlNavigate).not.toBe("");
                return Promise.resolve(true);
            });
            const testLogger = new Logger(loggerOptions);

            const browserCrypto = new CryptoOps(new Logger({}));
            const browserStorage = new BrowserCacheManager(TEST_CONFIG.MSAL_CLIENT_ID, cacheConfig, browserCrypto, testLogger);
            await redirectClient.acquireToken(emptyRequest);
            expect(browserStorage.getTemporaryCache(browserStorage.generateStateKey(TEST_STATE_VALUES.TEST_STATE_REDIRECT))).toEqual(TEST_STATE_VALUES.TEST_STATE_REDIRECT);
            expect(browserStorage.getTemporaryCache(browserStorage.generateNonceKey(TEST_STATE_VALUES.TEST_STATE_REDIRECT))).toEqual(RANDOM_TEST_GUID);
            expect(browserStorage.getTemporaryCache(browserStorage.generateAuthorityKey(TEST_STATE_VALUES.TEST_STATE_REDIRECT))).toEqual(`${Constants.DEFAULT_AUTHORITY}`);
            expect(browserStorage.getTemporaryCache(TemporaryCacheKeys.CCS_CREDENTIAL, true)).toEqual(JSON.stringify(testCcsCred));
        });

        it("Adds account homeAccountId as CCS cache entry to the cache and urlNavigate", async () => {
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
            const testCcsCred: CcsCredential = {
                credential: testAccount.homeAccountId,
                type: CcsCredentialType.HOME_ACCOUNT_ID
            };
            const emptyRequest: CommonAuthorizationUrlRequest = {
                redirectUri: TEST_URIS.TEST_REDIR_URI,
                scopes: [],
                state: TEST_STATE_VALUES.USER_STATE,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                responseMode: TEST_CONFIG.RESPONSE_MODE as ResponseMode,
                nonce: "",
                authenticationScheme: TEST_CONFIG.TOKEN_TYPE_BEARER as AuthenticationScheme,
                account: testAccount
            };

            sinon.stub(CryptoOps.prototype, "generatePkceCodes").resolves({
                challenge: TEST_CONFIG.TEST_CHALLENGE,
                verifier: TEST_CONFIG.TEST_VERIFIER
            });

            sinon.stub(NavigationClient.prototype, "navigateExternal").callsFake((urlNavigate: string, options: NavigationOptions): Promise<boolean> => {
                expect(options.noHistory).toBeFalsy();
                expect(urlNavigate).not.toBe("");
                return Promise.resolve(true);
            });
            const testLogger = new Logger(loggerOptions);

            const browserCrypto = new CryptoOps(new Logger({}));
            const browserStorage = new BrowserCacheManager(TEST_CONFIG.MSAL_CLIENT_ID, cacheConfig, browserCrypto, testLogger);
            await redirectClient.acquireToken(emptyRequest);
            expect(browserStorage.getTemporaryCache(browserStorage.generateStateKey(TEST_STATE_VALUES.TEST_STATE_REDIRECT))).toEqual(TEST_STATE_VALUES.TEST_STATE_REDIRECT);
            expect(browserStorage.getTemporaryCache(browserStorage.generateNonceKey(TEST_STATE_VALUES.TEST_STATE_REDIRECT))).toEqual(RANDOM_TEST_GUID);
            expect(browserStorage.getTemporaryCache(browserStorage.generateAuthorityKey(TEST_STATE_VALUES.TEST_STATE_REDIRECT))).toEqual(`${Constants.DEFAULT_AUTHORITY}`);
            expect(browserStorage.getTemporaryCache(TemporaryCacheKeys.CCS_CREDENTIAL, true)).toEqual(JSON.stringify(testCcsCred));
        });

        it("Caches token request correctly", async () => {
            const tokenRequest: CommonAuthorizationUrlRequest = {
                redirectUri: TEST_URIS.TEST_REDIR_URI,
                scopes: [],
                correlationId: RANDOM_TEST_GUID,
                state: TEST_STATE_VALUES.USER_STATE,
                authority: TEST_CONFIG.validAuthority,
                responseMode: TEST_CONFIG.RESPONSE_MODE as ResponseMode,
                nonce: "",
                authenticationScheme: TEST_CONFIG.TOKEN_TYPE_BEARER as AuthenticationScheme
            };

            sinon.stub(CryptoOps.prototype, "generatePkceCodes").resolves({
                challenge: TEST_CONFIG.TEST_CHALLENGE,
                verifier: TEST_CONFIG.TEST_VERIFIER
            });

            sinon.stub(NavigationClient.prototype, "navigateExternal").callsFake((urlNavigate: string, options: NavigationOptions): Promise<boolean> => {
                expect(options.noHistory).toBeFalsy();
                expect(urlNavigate).not.toBe("");
                return Promise.resolve(true);
            });

            const browserCrypto = new CryptoOps(new Logger({}));
            const testLogger = new Logger(loggerOptions);
            const browserStorage = new BrowserCacheManager(TEST_CONFIG.MSAL_CLIENT_ID, cacheConfig, browserCrypto, testLogger);
            await redirectClient.acquireToken(tokenRequest);
            const cachedRequest: CommonAuthorizationCodeRequest = JSON.parse(browserCrypto.base64Decode(browserStorage.getTemporaryCache(TemporaryCacheKeys.REQUEST_PARAMS, true) || ""));
            expect(cachedRequest.scopes).toEqual([]);
            expect(cachedRequest.codeVerifier).toEqual(TEST_CONFIG.TEST_VERIFIER);
            expect(cachedRequest.authority).toEqual(`${Constants.DEFAULT_AUTHORITY}`);
            expect(cachedRequest.correlationId).toEqual(RANDOM_TEST_GUID);
            expect(cachedRequest.authenticationScheme).toEqual(TEST_CONFIG.TOKEN_TYPE_BEARER as AuthenticationScheme);
        });

        it("Cleans cache before error is thrown", async () => {
            const emptyRequest: CommonAuthorizationUrlRequest = {
                redirectUri: TEST_URIS.TEST_REDIR_URI,
                scopes: [],
                state: TEST_STATE_VALUES.USER_STATE,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                responseMode: TEST_CONFIG.RESPONSE_MODE as ResponseMode,
                nonce: "",
                authenticationScheme: TEST_CONFIG.TOKEN_TYPE_BEARER as AuthenticationScheme
            };

            const browserCrypto = new CryptoOps(new Logger({}));
            const testLogger = new Logger(loggerOptions);
            new BrowserCacheManager(TEST_CONFIG.MSAL_CLIENT_ID, cacheConfig, browserCrypto, testLogger);
            sinon.stub(CryptoOps.prototype, "generatePkceCodes").resolves({
                challenge: TEST_CONFIG.TEST_CHALLENGE,
                verifier: TEST_CONFIG.TEST_VERIFIER
            });

            const testError = {
                errorCode: "create_login_url_error",
                errorMessage: "Error in creating a login url",
                correlationId: TEST_CONFIG.CORRELATION_ID
            };
            sinon.stub(AuthorizationCodeClient.prototype, "getAuthCodeUrl").throws(new BrowserAuthError(testError.errorCode, testError.errorMessage));
            try {
                await redirectClient.acquireToken(emptyRequest);
            } catch (e) {
                // Test that error was cached for telemetry purposes and then thrown
                expect(window.sessionStorage).toHaveLength(1);
                const failures = window.sessionStorage.getItem(`server-telemetry-${TEST_CONFIG.MSAL_CLIENT_ID}`);
                const failureObj = JSON.parse(failures || "") as ServerTelemetryEntity;
                expect(failureObj.failedRequests).toHaveLength(2);
                expect(failureObj.failedRequests[0]).toEqual(ApiId.acquireTokenRedirect);
                expect(failureObj.errors[0]).toEqual(testError.errorCode);
                expect(e).toMatchObject(testError);
            }
        });

        it("Uses adal token from cache if it is present and sets upn as the login hint.", async () => {
            const idTokenClaims: TokenClaims = {
                "iss": "https://sts.windows.net/fa15d692-e9c7-4460-a743-29f2956fd429/",
                "exp": 1536279024,
                "name": "abeli",
                "nonce": "123523",
                "oid": "05833b6b-aa1d-42d4-9ec0-1b2bb9194438",
                "sub": "5_J9rSss8-jvt_Icu6ueRNL8xXb8LF4Fsg_KooC2RJQ",
                "tid": "fa15d692-e9c7-4460-a743-29f2956fd429",
                "ver": "1.0",
                "upn": "AbeLincoln@contoso.com"
            };
            sinon.stub(AuthToken, "extractTokenClaims").returns(idTokenClaims);
            const browserCrypto = new CryptoOps(new Logger({}));
            const testLogger = new Logger(loggerOptions);
            const browserStorage: BrowserCacheManager = new BrowserCacheManager(TEST_CONFIG.MSAL_CLIENT_ID, cacheConfig, browserCrypto, testLogger);
            browserStorage.setTemporaryCache(PersistentCacheKeys.ADAL_ID_TOKEN, TEST_TOKENS.IDTOKEN_V1);
            const loginUrlSpy = sinon.spy(AuthorizationCodeClient.prototype, "getAuthCodeUrl");
            sinon.stub(CryptoOps.prototype, "generatePkceCodes").resolves({
                challenge: TEST_CONFIG.TEST_CHALLENGE,
                verifier: TEST_CONFIG.TEST_VERIFIER
            });
            sinon.stub(NavigationClient.prototype, "navigateExternal").callsFake((urlNavigate: string, options: NavigationOptions): Promise<boolean> => {
                expect(options.noHistory).toBeFalsy();
                expect(urlNavigate).not.toBe("");
                return Promise.resolve(true);
            });
            const emptyRequest: CommonAuthorizationUrlRequest = {
                redirectUri: TEST_URIS.TEST_REDIR_URI,
                scopes: [],
                state: TEST_STATE_VALUES.USER_STATE,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                responseMode: TEST_CONFIG.RESPONSE_MODE as ResponseMode,
                nonce: "",
                authenticationScheme: TEST_CONFIG.TOKEN_TYPE_BEARER as AuthenticationScheme
            };
            await redirectClient.acquireToken(emptyRequest);
            const validatedRequest: CommonAuthorizationUrlRequest = {
                ...emptyRequest,
                scopes: [],
                loginHint: idTokenClaims.upn,
                state: TEST_STATE_VALUES.TEST_STATE_REDIRECT,
                correlationId: RANDOM_TEST_GUID,
                nonce: RANDOM_TEST_GUID,
                authority: `${Constants.DEFAULT_AUTHORITY}`,
                responseMode: ResponseMode.FRAGMENT,
                codeChallenge: TEST_CONFIG.TEST_CHALLENGE,
                codeChallengeMethod: Constants.S256_CODE_CHALLENGE_METHOD,
                nativeBroker: false
            };
            expect(loginUrlSpy.calledWith(validatedRequest)).toBeTruthy();
        });

        it("Uses adal token from cache if it is present and sets preferred_name as the login hint.", async () => {
            const idTokenClaims: TokenClaims = {
                "iss": "https://sts.windows.net/fa15d692-e9c7-4460-a743-29f2956fd429/",
                "exp": 1536279024,
                "name": "abeli",
                "nonce": "123523",
                "oid": "05833b6b-aa1d-42d4-9ec0-1b2bb9194438",
                "sub": "5_J9rSss8-jvt_Icu6ueRNL8xXb8LF4Fsg_KooC2RJQ",
                "tid": "fa15d692-e9c7-4460-a743-29f2956fd429",
                "ver": "1.0",
                "preferred_username": "AbeLincoln@contoso.com"
            };
            sinon.stub(AuthToken, "extractTokenClaims").returns(idTokenClaims);
            const browserCrypto = new CryptoOps(new Logger({}));
            const testLogger = new Logger(loggerOptions);
            const browserStorage: BrowserCacheManager = new BrowserCacheManager(TEST_CONFIG.MSAL_CLIENT_ID, cacheConfig, browserCrypto, testLogger);
            browserStorage.setTemporaryCache(PersistentCacheKeys.ADAL_ID_TOKEN, TEST_TOKENS.IDTOKEN_V1);
            const loginUrlSpy = sinon.spy(AuthorizationCodeClient.prototype, "getAuthCodeUrl");
            sinon.stub(CryptoOps.prototype, "generatePkceCodes").resolves({
                challenge: TEST_CONFIG.TEST_CHALLENGE,
                verifier: TEST_CONFIG.TEST_VERIFIER
            });
            sinon.stub(NavigationClient.prototype, "navigateExternal").callsFake((urlNavigate: string, options: NavigationOptions): Promise<boolean> => {
                expect(options.noHistory).toBeFalsy();
                expect(urlNavigate).not.toBe("");
                return Promise.resolve(true);
            });
            const emptyRequest: CommonAuthorizationUrlRequest = {
                redirectUri: TEST_URIS.TEST_REDIR_URI,
                scopes: [],
                state: TEST_STATE_VALUES.USER_STATE,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                responseMode: TEST_CONFIG.RESPONSE_MODE as ResponseMode,
                nonce: "",
                authenticationScheme: TEST_CONFIG.TOKEN_TYPE_BEARER as AuthenticationScheme
            };
            await redirectClient.acquireToken(emptyRequest);
            const validatedRequest: CommonAuthorizationUrlRequest = {
                ...emptyRequest,
                scopes: [],
                loginHint: idTokenClaims.preferred_username,
                state: TEST_STATE_VALUES.TEST_STATE_REDIRECT,
                correlationId: RANDOM_TEST_GUID,
                nonce: RANDOM_TEST_GUID,
                authority: `${Constants.DEFAULT_AUTHORITY}`,
                responseMode: ResponseMode.FRAGMENT,
                codeChallenge: TEST_CONFIG.TEST_CHALLENGE,
                codeChallengeMethod: Constants.S256_CODE_CHALLENGE_METHOD,
                nativeBroker: false
            };
            expect(loginUrlSpy.calledWith(validatedRequest)).toBeTruthy();
        });

        it("Uses adal token from cache if it is present and sets preferred_name as the login hint when upn is also populated.", async () => {
            const idTokenClaims: TokenClaims = {
                "iss": "https://sts.windows.net/fa15d692-e9c7-4460-a743-29f2956fd429/",
                "exp": 1536279024,
                "name": "abeli",
                "nonce": "123523",
                "oid": "05833b6b-aa1d-42d4-9ec0-1b2bb9194438",
                "sub": "5_J9rSss8-jvt_Icu6ueRNL8xXb8LF4Fsg_KooC2RJQ",
                "tid": "fa15d692-e9c7-4460-a743-29f2956fd429",
                "ver": "1.0",
                "upn": "AbeLincol_gmail.com#EXT#@AbeLincolgmail.onmicrosoft.com",
                "preferred_username": "AbeLincoln@contoso.com"
            };
            sinon.stub(AuthToken, "extractTokenClaims").returns(idTokenClaims);
            const browserCrypto = new CryptoOps(new Logger({}));
            const testLogger = new Logger(loggerOptions);
            const browserStorage: BrowserCacheManager = new BrowserCacheManager(TEST_CONFIG.MSAL_CLIENT_ID, cacheConfig, browserCrypto, testLogger);
            browserStorage.setTemporaryCache(PersistentCacheKeys.ADAL_ID_TOKEN, TEST_TOKENS.IDTOKEN_V1);
            const loginUrlSpy = sinon.spy(AuthorizationCodeClient.prototype, "getAuthCodeUrl");
            sinon.stub(CryptoOps.prototype, "generatePkceCodes").resolves({
                challenge: TEST_CONFIG.TEST_CHALLENGE,
                verifier: TEST_CONFIG.TEST_VERIFIER
            });
            sinon.stub(NavigationClient.prototype, "navigateExternal").callsFake((urlNavigate: string, options: NavigationOptions): Promise<boolean> => {
                expect(options.noHistory).toBeFalsy();
                expect(urlNavigate).not.toBe("");
                return Promise.resolve(true);
            });
            const emptyRequest: CommonAuthorizationUrlRequest = {
                redirectUri: TEST_URIS.TEST_REDIR_URI,
                scopes: [],
                state: TEST_STATE_VALUES.USER_STATE,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                responseMode: TEST_CONFIG.RESPONSE_MODE as ResponseMode,
                nonce: "",
                authenticationScheme: TEST_CONFIG.TOKEN_TYPE_BEARER as AuthenticationScheme
            };
            await redirectClient.acquireToken(emptyRequest);
            const validatedRequest: CommonAuthorizationUrlRequest = {
                ...emptyRequest,
                scopes: [],
                loginHint: idTokenClaims.preferred_username,
                state: TEST_STATE_VALUES.TEST_STATE_REDIRECT,
                correlationId: RANDOM_TEST_GUID,
                nonce: RANDOM_TEST_GUID,
                authority: `${Constants.DEFAULT_AUTHORITY}`,
                responseMode: ResponseMode.FRAGMENT,
                codeChallenge: TEST_CONFIG.TEST_CHALLENGE,
                codeChallengeMethod: Constants.S256_CODE_CHALLENGE_METHOD,
                nativeBroker: false
            };
            expect(loginUrlSpy.calledWith(validatedRequest)).toBeTruthy();
        });

        it("Uses msal v1 token from cache if it is present and sets preferred_name as the login hint.", async () => {
            const idTokenClaims: TokenClaims = {
                "iss": "https://sts.windows.net/fa15d692-e9c7-4460-a743-29f2956fd429/",
                "exp": 1536279024,
                "name": "abeli",
                "nonce": "123523",
                "oid": "05833b6b-aa1d-42d4-9ec0-1b2bb9194438",
                "sub": "5_J9rSss8-jvt_Icu6ueRNL8xXb8LF4Fsg_KooC2RJQ",
                "tid": "fa15d692-e9c7-4460-a743-29f2956fd429",
                "ver": "1.0",
                "preferred_username": "AbeLincoln@contoso.com"
            };
            sinon.stub(AuthToken, "extractTokenClaims").returns(idTokenClaims);
            const browserCrypto = new CryptoOps(new Logger({}));
            const testLogger = new Logger(loggerOptions);
            const browserStorage: BrowserCacheManager = new BrowserCacheManager(TEST_CONFIG.MSAL_CLIENT_ID, cacheConfig, browserCrypto, testLogger);
            browserStorage.setTemporaryCache(PersistentCacheKeys.ID_TOKEN, TEST_TOKENS.IDTOKEN_V1, true);
            const loginUrlSpy = sinon.spy(AuthorizationCodeClient.prototype, "getAuthCodeUrl");
            sinon.stub(CryptoOps.prototype, "generatePkceCodes").resolves({
                challenge: TEST_CONFIG.TEST_CHALLENGE,
                verifier: TEST_CONFIG.TEST_VERIFIER
            });
            sinon.stub(NavigationClient.prototype, "navigateExternal").callsFake((urlNavigate: string, options: NavigationOptions): Promise<boolean> => {
                expect(options.noHistory).toBeFalsy();
                expect(urlNavigate).not.toBe("");
                return Promise.resolve(true);
            });
            const emptyRequest: CommonAuthorizationUrlRequest = {
                redirectUri: TEST_URIS.TEST_REDIR_URI,
                scopes: [],
                state: TEST_STATE_VALUES.USER_STATE,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                responseMode: TEST_CONFIG.RESPONSE_MODE as ResponseMode,
                nonce: "",
                authenticationScheme: TEST_CONFIG.TOKEN_TYPE_BEARER as AuthenticationScheme
            };
            await redirectClient.acquireToken(emptyRequest);
            const validatedRequest: CommonAuthorizationUrlRequest = {
                ...emptyRequest,
                scopes: [],
                loginHint: idTokenClaims.preferred_username,
                state: TEST_STATE_VALUES.TEST_STATE_REDIRECT,
                correlationId: RANDOM_TEST_GUID,
                nonce: RANDOM_TEST_GUID,
                authority: `${Constants.DEFAULT_AUTHORITY}`,
                responseMode: ResponseMode.FRAGMENT,
                codeChallenge: TEST_CONFIG.TEST_CHALLENGE,
                codeChallengeMethod: Constants.S256_CODE_CHALLENGE_METHOD,
                nativeBroker: false
            };
            expect(loginUrlSpy.calledWith(validatedRequest)).toBeTruthy();
        });

        it("Does not use adal token from cache if it is present and SSO params have been given.", async () => {
            const idTokenClaims: TokenClaims = {
                "iss": "https://sts.windows.net/fa15d692-e9c7-4460-a743-29f2956fd429/",
                "exp": 1536279024,
                "name": "abeli",
                "nonce": "123523",
                "oid": "05833b6b-aa1d-42d4-9ec0-1b2bb9194438",
                "sub": "5_J9rSss8-jvt_Icu6ueRNL8xXb8LF4Fsg_KooC2RJQ",
                "tid": "fa15d692-e9c7-4460-a743-29f2956fd429",
                "ver": "1.0",
                "upn": "AbeLincoln@contoso.com"
            };
            sinon.stub(AuthToken, "extractTokenClaims").returns(idTokenClaims);
            const browserCrypto = new CryptoOps(new Logger({}));
            const testLogger = new Logger(loggerOptions);
            const browserStorage: BrowserCacheManager = new BrowserCacheManager(TEST_CONFIG.MSAL_CLIENT_ID, cacheConfig, browserCrypto, testLogger);
            browserStorage.setTemporaryCache(PersistentCacheKeys.ADAL_ID_TOKEN, TEST_TOKENS.IDTOKEN_V1);
            const loginUrlSpy = sinon.spy(AuthorizationCodeClient.prototype, "getAuthCodeUrl");
            sinon.stub(CryptoOps.prototype, "generatePkceCodes").resolves({
                challenge: TEST_CONFIG.TEST_CHALLENGE,
                verifier: TEST_CONFIG.TEST_VERIFIER
            });
            sinon.stub(NavigationClient.prototype, "navigateExternal").callsFake((urlNavigate: string, options: NavigationOptions): Promise<boolean> => {
                expect(options.noHistory).toBeFalsy();
                expect(urlNavigate).not.toBe("");
                return Promise.resolve(true);
            });
            const loginRequest: CommonAuthorizationUrlRequest = {
                redirectUri: TEST_URIS.TEST_REDIR_URI,
                scopes: [],
                loginHint: "AbeLi@microsoft.com",
                state: TEST_STATE_VALUES.USER_STATE,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                responseMode: TEST_CONFIG.RESPONSE_MODE as ResponseMode,
                nonce: "",
                authenticationScheme: TEST_CONFIG.TOKEN_TYPE_BEARER as AuthenticationScheme
            };
            await redirectClient.acquireToken(loginRequest);
            const validatedRequest: CommonAuthorizationUrlRequest = {
                ...loginRequest,
                scopes: [],
                state: TEST_STATE_VALUES.TEST_STATE_REDIRECT,
                correlationId: RANDOM_TEST_GUID,
                authority: `${Constants.DEFAULT_AUTHORITY}`,
                nonce: RANDOM_TEST_GUID,
                responseMode: ResponseMode.FRAGMENT,
                codeChallenge: TEST_CONFIG.TEST_CHALLENGE,
                codeChallengeMethod: Constants.S256_CODE_CHALLENGE_METHOD,
                nativeBroker: false
            };
            expect(loginUrlSpy.calledWith(validatedRequest)).toBeTruthy();
        });

        it("navigates to created login url", (done) => {
            sinon.stub(RedirectHandler.prototype, "initiateAuthRequest").callsFake((navigateUrl): Promise<void> => {
                expect(navigateUrl).toEqual(testNavUrl);
                return Promise.resolve(done());
            });
            sinon.stub(CryptoOps.prototype, "generatePkceCodes").resolves({
                challenge: TEST_CONFIG.TEST_CHALLENGE,
                verifier: TEST_CONFIG.TEST_VERIFIER
            });
            const loginRequest: RedirectRequest = {
                redirectUri: TEST_URIS.TEST_REDIR_URI,
                scopes: ["user.read", "openid", "profile"],
                state: TEST_STATE_VALUES.USER_STATE,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                nonce: "",
                authenticationScheme: TEST_CONFIG.TOKEN_TYPE_BEARER as AuthenticationScheme
            };
            redirectClient.acquireToken(loginRequest);
        });

        it("passes onRedirectNavigate callback", (done) => {
            const onRedirectNavigate = (url: string) => {
                expect(url).toEqual(testNavUrl)
                done();
            };

            sinon.stub(RedirectHandler.prototype, "initiateAuthRequest").callsFake((navigateUrl, {
                redirectTimeout: timeout, redirectStartPage, onRedirectNavigate: onRedirectNavigateCb
            }): Promise<void> => {
                expect(onRedirectNavigateCb).toEqual(onRedirectNavigate);
                expect(navigateUrl).toEqual(testNavUrl);
                onRedirectNavigate(navigateUrl);
                return Promise.resolve();
            });
            sinon.stub(CryptoOps.prototype, "generatePkceCodes").resolves({
                challenge: TEST_CONFIG.TEST_CHALLENGE,
                verifier: TEST_CONFIG.TEST_VERIFIER
            });
            const loginRequest: RedirectRequest = {
                redirectUri: TEST_URIS.TEST_REDIR_URI,
                scopes: ["user.read", "openid", "profile"],
                state: TEST_STATE_VALUES.USER_STATE,
                onRedirectNavigate
            };
            redirectClient.acquireToken(loginRequest);
        });

        it("Updates cache entries correctly", async () => {
            const testScope = "testscope";
            const emptyRequest: CommonAuthorizationUrlRequest = {
                redirectUri: TEST_URIS.TEST_REDIR_URI,
                scopes: [testScope],
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
            sinon.stub(NavigationClient.prototype, "navigateExternal").callsFake((urlNavigate: string, options: NavigationOptions): Promise<boolean> => {
                expect(options.noHistory).toBeFalsy();
                expect(urlNavigate).not.toBe("");
                return Promise.resolve(true);
            });
            const browserCrypto = new CryptoOps(new Logger({}));
            const testLogger = new Logger(loggerOptions);
            const browserStorage = new BrowserCacheManager(TEST_CONFIG.MSAL_CLIENT_ID, cacheConfig, browserCrypto, testLogger);
            await redirectClient.acquireToken(emptyRequest);
            expect(browserStorage.getTemporaryCache(browserStorage.generateStateKey(TEST_STATE_VALUES.TEST_STATE_REDIRECT))).toEqual(TEST_STATE_VALUES.TEST_STATE_REDIRECT);
            expect(browserStorage.getTemporaryCache(browserStorage.generateNonceKey(TEST_STATE_VALUES.TEST_STATE_REDIRECT))).toEqual(RANDOM_TEST_GUID);
            expect(browserStorage.getTemporaryCache(browserStorage.generateAuthorityKey(TEST_STATE_VALUES.TEST_STATE_REDIRECT))).toEqual(`${Constants.DEFAULT_AUTHORITY}`);
        });

        it("Caches token request correctly", async () => {
            const testScope = "testscope";
            const tokenRequest: CommonAuthorizationUrlRequest = {
                redirectUri: TEST_URIS.TEST_REDIR_URI,
                scopes: [testScope],
                correlationId: RANDOM_TEST_GUID,
                state: TEST_STATE_VALUES.USER_STATE,
                authority: TEST_CONFIG.validAuthority,
                responseMode: TEST_CONFIG.RESPONSE_MODE as ResponseMode,
                nonce: "",
                authenticationScheme: TEST_CONFIG.TOKEN_TYPE_BEARER as AuthenticationScheme
            };
            sinon.stub(CryptoOps.prototype, "generatePkceCodes").resolves({
                challenge: TEST_CONFIG.TEST_CHALLENGE,
                verifier: TEST_CONFIG.TEST_VERIFIER
            });
            sinon.stub(NavigationClient.prototype, "navigateExternal").callsFake((urlNavigate: string, options: NavigationOptions): Promise<boolean> => {
                expect(options.noHistory).toBeFalsy();
                expect(urlNavigate).not.toBe("");
                return Promise.resolve(true);
            });
            const browserCrypto = new CryptoOps(new Logger({}));
            const testLogger = new Logger(loggerOptions);
            const browserStorage = new BrowserCacheManager(TEST_CONFIG.MSAL_CLIENT_ID, cacheConfig, browserCrypto, testLogger);
            await redirectClient.acquireToken(tokenRequest);
            const cachedRequest: CommonAuthorizationCodeRequest = JSON.parse(browserCrypto.base64Decode(browserStorage.getTemporaryCache(TemporaryCacheKeys.REQUEST_PARAMS, true) || ""));
            expect(cachedRequest.scopes).toEqual([testScope]);
            expect(cachedRequest.codeVerifier).toEqual(TEST_CONFIG.TEST_VERIFIER);
            expect(cachedRequest.authority).toEqual(`${Constants.DEFAULT_AUTHORITY}`);
            expect(cachedRequest.correlationId).toEqual(RANDOM_TEST_GUID);
            expect(cachedRequest.authenticationScheme).toEqual(TEST_CONFIG.TOKEN_TYPE_BEARER as AuthenticationScheme);
        });

        it("Cleans cache before error is thrown", async () => {
            const testScope = "testscope";
            const emptyRequest: CommonAuthorizationUrlRequest = {
                redirectUri: TEST_URIS.TEST_REDIR_URI,
                scopes: [testScope],
                state: "",
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                responseMode: TEST_CONFIG.RESPONSE_MODE as ResponseMode,
                nonce: "",
                authenticationScheme: TEST_CONFIG.TOKEN_TYPE_BEARER as AuthenticationScheme
            };
            const browserCrypto = new CryptoOps(new Logger({}));
            const testLogger = new Logger(loggerOptions);
            new BrowserCacheManager(TEST_CONFIG.MSAL_CLIENT_ID, cacheConfig, browserCrypto, testLogger);
            sinon.stub(CryptoOps.prototype, "generatePkceCodes").resolves({
                challenge: TEST_CONFIG.TEST_CHALLENGE,
                verifier: TEST_CONFIG.TEST_VERIFIER
            });

            const testError = {
                errorCode: "create_login_url_error",
                errorMessage: "Error in creating a login url"
            };
            sinon.stub(AuthorizationCodeClient.prototype, "getAuthCodeUrl").throws(testError);
            try {
                await redirectClient.acquireToken(emptyRequest);
            } catch (e) {
                // Test that error was cached for telemetry purposes and then thrown
                expect(window.sessionStorage).toHaveLength(1);
                const failures = window.sessionStorage.getItem(`server-telemetry-${TEST_CONFIG.MSAL_CLIENT_ID}`);
                const failureObj = JSON.parse(failures || "") as ServerTelemetryEntity;
                expect(failureObj.failedRequests).toHaveLength(2);
                expect(failureObj.failedRequests[0]).toEqual(ApiId.acquireTokenRedirect);
                expect(failureObj.errors[0]).toEqual(testError.errorCode);
                expect(e).toEqual(testError);
            }
        });

        it("Uses adal token from cache if it is present.", async () => {
            const testScope = "testscope";
            const idTokenClaims: TokenClaims = {
                "iss": "https://sts.windows.net/fa15d692-e9c7-4460-a743-29f2956fd429/",
                "exp": 1536279024,
                "name": "abeli",
                "nonce": "123523",
                "oid": "05833b6b-aa1d-42d4-9ec0-1b2bb9194438",
                "sub": "5_J9rSss8-jvt_Icu6ueRNL8xXb8LF4Fsg_KooC2RJQ",
                "tid": "fa15d692-e9c7-4460-a743-29f2956fd429",
                "ver": "1.0",
                "upn": "AbeLincoln@contoso.com"
            };
            sinon.stub(AuthToken, "extractTokenClaims").returns(idTokenClaims);
            const browserCrypto = new CryptoOps(new Logger({}));
            const testLogger = new Logger(loggerOptions);
            const browserStorage: BrowserCacheManager = new BrowserCacheManager(TEST_CONFIG.MSAL_CLIENT_ID, cacheConfig, browserCrypto, testLogger);
            browserStorage.setTemporaryCache(PersistentCacheKeys.ADAL_ID_TOKEN, TEST_TOKENS.IDTOKEN_V1);
            const acquireTokenUrlSpy = sinon.spy(AuthorizationCodeClient.prototype, "getAuthCodeUrl");
            sinon.stub(CryptoOps.prototype, "generatePkceCodes").resolves({
                challenge: TEST_CONFIG.TEST_CHALLENGE,
                verifier: TEST_CONFIG.TEST_VERIFIER
            });
            sinon.stub(NavigationClient.prototype, "navigateExternal").callsFake((urlNavigate: string, options: NavigationOptions): Promise<boolean> => {
                expect(options.noHistory).toBeFalsy();
                expect(urlNavigate).not.toBe("");
                return Promise.resolve(true);
            });
            const emptyRequest: CommonAuthorizationUrlRequest = {
                redirectUri: TEST_URIS.TEST_REDIR_URI,
                scopes: [testScope],
                state: TEST_STATE_VALUES.USER_STATE,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                responseMode: TEST_CONFIG.RESPONSE_MODE as ResponseMode,
                nonce: "",
                authenticationScheme: TEST_CONFIG.TOKEN_TYPE_BEARER as AuthenticationScheme
            };
            await redirectClient.acquireToken(emptyRequest);
            const validatedRequest: CommonAuthorizationUrlRequest = {
                ...emptyRequest,
                scopes: [...emptyRequest.scopes],
                loginHint: idTokenClaims.upn,
                state: TEST_STATE_VALUES.TEST_STATE_REDIRECT,
                correlationId: RANDOM_TEST_GUID,
                authority: `${Constants.DEFAULT_AUTHORITY}`,
                nonce: RANDOM_TEST_GUID,
                responseMode: ResponseMode.FRAGMENT,
                codeChallenge: TEST_CONFIG.TEST_CHALLENGE,
                codeChallengeMethod: Constants.S256_CODE_CHALLENGE_METHOD,
                nativeBroker: false
            };
            expect(acquireTokenUrlSpy.calledWith(validatedRequest)).toBeTruthy();
        });

        it("Does not use adal token from cache if it is present and SSO params have been given.", async () => {
            const idTokenClaims: TokenClaims = {
                "iss": "https://sts.windows.net/fa15d692-e9c7-4460-a743-29f2956fd429/",
                "exp": 1536279024,
                "name": "abeli",
                "nonce": "123523",
                "oid": "05833b6b-aa1d-42d4-9ec0-1b2bb9194438",
                "sub": "5_J9rSss8-jvt_Icu6ueRNL8xXb8LF4Fsg_KooC2RJQ",
                "tid": "fa15d692-e9c7-4460-a743-29f2956fd429",
                "ver": "1.0",
                "upn": "AbeLincoln@contoso.com"
            };
            sinon.stub(AuthToken, "extractTokenClaims").returns(idTokenClaims);
            const browserCrypto = new CryptoOps(new Logger({}));
            const testLogger = new Logger(loggerOptions);
            const browserStorage: BrowserCacheManager = new BrowserCacheManager(TEST_CONFIG.MSAL_CLIENT_ID, cacheConfig, browserCrypto, testLogger);
            browserStorage.setTemporaryCache(PersistentCacheKeys.ADAL_ID_TOKEN, TEST_TOKENS.IDTOKEN_V1);
            const acquireTokenUrlSpy = sinon.spy(AuthorizationCodeClient.prototype, "getAuthCodeUrl");
            sinon.stub(CryptoOps.prototype, "generatePkceCodes").resolves({
                challenge: TEST_CONFIG.TEST_CHALLENGE,
                verifier: TEST_CONFIG.TEST_VERIFIER
            });
            sinon.stub(NavigationClient.prototype, "navigateExternal").callsFake((urlNavigate: string, options: NavigationOptions): Promise<boolean> => {
                expect(options.noHistory).toBeFalsy();
                expect(urlNavigate).not.toBe("");
                return Promise.resolve(true);
            });
            const testScope = "testscope";
            const loginRequest: CommonAuthorizationUrlRequest = {
                redirectUri: TEST_URIS.TEST_REDIR_URI,
                scopes: [testScope],
                loginHint: "AbeLi@microsoft.com",
                state: TEST_STATE_VALUES.USER_STATE,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                responseMode: TEST_CONFIG.RESPONSE_MODE as ResponseMode,
                nonce: "",
                authenticationScheme: TEST_CONFIG.TOKEN_TYPE_BEARER as AuthenticationScheme
            };
            await redirectClient.acquireToken(loginRequest);
            const validatedRequest: CommonAuthorizationUrlRequest = {
                ...loginRequest,
                scopes: [...loginRequest.scopes],
                state: TEST_STATE_VALUES.TEST_STATE_REDIRECT,
                correlationId: RANDOM_TEST_GUID,
                authority: `${Constants.DEFAULT_AUTHORITY}`,
                nonce: RANDOM_TEST_GUID,
                responseMode: ResponseMode.FRAGMENT,
                codeChallenge: TEST_CONFIG.TEST_CHALLENGE,
                codeChallengeMethod: Constants.S256_CODE_CHALLENGE_METHOD,
                nativeBroker: false
            };
            expect(acquireTokenUrlSpy.calledWith(validatedRequest)).toBeTruthy();
        });
    });

    describe("logout", () => {
        it("passes logoutUri from authModule to window nav util", (done) => {
            const logoutUriSpy = sinon.stub(AuthorizationCodeClient.prototype, "getLogoutUri").returns(testLogoutUrl);
            sinon.stub(NavigationClient.prototype, "navigateExternal").callsFake((urlNavigate: string, options: NavigationOptions): Promise<boolean> => {
                expect(urlNavigate).toEqual(testLogoutUrl);
                expect(options.noHistory).toBeFalsy();
                done();
                return Promise.resolve(true);
            });
            redirectClient.logout();
            const validatedLogoutRequest: CommonEndSessionRequest = {
                correlationId: RANDOM_TEST_GUID,
                postLogoutRedirectUri: TEST_URIS.TEST_REDIR_URI
            };
            expect(logoutUriSpy.calledWith(validatedLogoutRequest));
        });

        it("includes postLogoutRedirectUri if one is passed", (done) => {
            const postLogoutRedirectUri = "https://localhost:8000/logout";
            sinon.stub(NavigationClient.prototype, "navigateExternal").callsFake((urlNavigate: string, options: NavigationOptions): Promise<boolean> => {
                expect(urlNavigate).toContain(`post_logout_redirect_uri=${encodeURIComponent(postLogoutRedirectUri)}`);
                done();
                return Promise.resolve(true);
            });
            redirectClient.logout({
                postLogoutRedirectUri
            });
        });

        it("includes postLogoutRedirectUri if one is configured", (done) => {
            const postLogoutRedirectUri = "https://localhost:8000/logout";
            sinon.stub(NavigationClient.prototype, "navigateExternal").callsFake((urlNavigate: string, options: NavigationOptions): Promise<boolean> => {
                expect(urlNavigate).toContain(`post_logout_redirect_uri=${encodeURIComponent(postLogoutRedirectUri)}`);
                done();
                return Promise.resolve(true);
            });

            const pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                    postLogoutRedirectUri
                }
            });

            // @ts-ignore
            redirectClient = new RedirectClient(pca.config, pca.browserStorage, pca.browserCrypto, pca.logger, pca.eventHandler, pca.navigationClient, pca.performanceClient, pca.nativeInternalStorage);

            redirectClient.logout();
        });

        it("doesn't include postLogoutRedirectUri if null is configured", (done) => {
            sinon.stub(NavigationClient.prototype, "navigateExternal").callsFake((urlNavigate: string, options: NavigationOptions): Promise<boolean> => {
                expect(urlNavigate).not.toContain(`post_logout_redirect_uri`);
                done();
                return Promise.resolve(true);
            });

            const pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                    postLogoutRedirectUri: null
                }
            });

            // @ts-ignore
            redirectClient = new RedirectClient(pca.config, pca.browserStorage, pca.browserCrypto, pca.logger, pca.eventHandler, pca.navigationClient, pca.performanceClient);

            redirectClient.logout();
        });

        it("doesn't include postLogoutRedirectUri if null is set on request", (done) => {
            sinon.stub(NavigationClient.prototype, "navigateExternal").callsFake((urlNavigate: string, options: NavigationOptions): Promise<boolean> => {
                expect(urlNavigate).not.toContain("post_logout_redirect_uri");
                done();
                return Promise.resolve(true);
            });
            redirectClient.logout({
                postLogoutRedirectUri: null
            });
        });

        it("includes postLogoutRedirectUri as current page if none is set on request", (done) => {
            sinon.stub(NavigationClient.prototype, "navigateExternal").callsFake((urlNavigate: string, options: NavigationOptions): Promise<boolean> => {
                expect(urlNavigate).toContain(`post_logout_redirect_uri=${encodeURIComponent("https://localhost:8081/index.html")}`);
                done();
                return Promise.resolve(true);
            });
            redirectClient.logout();
        });

        it("includes logoutHint if it is set on request", (done) => {
            const logoutHint = "test@user.com";
            sinon.stub(NavigationClient.prototype, "navigateExternal").callsFake((urlNavigate: string, options: NavigationOptions): Promise<boolean> => {
                expect(urlNavigate).toContain(`logout_hint=${encodeURIComponent(logoutHint)}`);
                done();
                return Promise.resolve(true);
            });
            redirectClient.logout({ logoutHint: logoutHint });
        });

        it("includes logoutHint from ID token claims if account is passed in and logoutHint is not", (done) => {
            const logoutHint = "test@user.com";
            const testIdTokenClaims: TokenClaims = {
                "ver": "2.0",
                "iss": "https://login.microsoftonline.com/9188040d-6c67-4c5b-b112-36a304b66dad/v2.0",
                "sub": "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
                "name": "Abe Lincoln",
                "preferred_username": "AbeLi@microsoft.com",
                "oid": "00000000-0000-0000-66f3-3332eca7ea81",
                "tid": "3338040d-6c67-4c5b-b112-36a304b66dad",
                "nonce": "123523",
                "login_hint": logoutHint
            };

            const testAccountInfo: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: testIdTokenClaims.tid || "",
                username: testIdTokenClaims.preferred_username || "",
                idTokenClaims: testIdTokenClaims
            };

            sinon.stub(NavigationClient.prototype, "navigateExternal").callsFake((urlNavigate: string, options: NavigationOptions): Promise<boolean> => {
                expect(urlNavigate).toContain(`logout_hint=${encodeURIComponent(logoutHint)}`);
                done();
                return Promise.resolve(true);
            });
            redirectClient.logout({ account: testAccountInfo });
        });

        it("logoutHint attribute takes precedence over ID Token Claims from provided account when setting logout_hint", (done) => {
            const logoutHint = "test@user.com";
            const loginHint = "anothertest@user.com";
            const testIdTokenClaims: TokenClaims = {
                "ver": "2.0",
                "iss": "https://login.microsoftonline.com/9188040d-6c67-4c5b-b112-36a304b66dad/v2.0",
                "sub": "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
                "name": "Abe Lincoln",
                "preferred_username": "AbeLi@microsoft.com",
                "oid": "00000000-0000-0000-66f3-3332eca7ea81",
                "tid": "3338040d-6c67-4c5b-b112-36a304b66dad",
                "nonce": "123523",
                "login_hint": loginHint
            };

            const testAccountInfo: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: testIdTokenClaims.tid || "",
                username: testIdTokenClaims.preferred_username || "",
                idTokenClaims: testIdTokenClaims
            };

            sinon.stub(NavigationClient.prototype, "navigateExternal").callsFake((urlNavigate: string, options: NavigationOptions): Promise<boolean> => {
                expect(urlNavigate).toContain(`logout_hint=${encodeURIComponent(logoutHint)}`);
                expect(urlNavigate).not.toContain(`logout_hint=${encodeURIComponent(loginHint)}`);
                done();
                return Promise.resolve(true);
            });
            redirectClient.logout({ account: testAccountInfo, logoutHint: logoutHint });
        });

        it("doesnt navigate if onRedirectNavigate returns false", (done) => {
            const logoutUriSpy = sinon.stub(AuthorizationCodeClient.prototype, "getLogoutUri").returns(testLogoutUrl);
            sinon.stub(NavigationClient.prototype, "navigateExternal").callsFake((urlNavigate: string, options: NavigationOptions): Promise<boolean> => {
                // If onRedirectNavigate does not stop navigatation, this will be called, failing the test as done will be invoked twice
                done();
                return Promise.resolve(true);
            });
            browserStorage.setInteractionInProgress(true);
            redirectClient.logout({
                onRedirectNavigate: (url: string) => {
                    expect(url).toEqual(testLogoutUrl);
                    return false;
                }
            })
                .then(() => {
                    expect(browserStorage.getInteractionInProgress()).toBeFalsy();

                    const validatedLogoutRequest: CommonEndSessionRequest = {
                        correlationId: RANDOM_TEST_GUID,
                        postLogoutRedirectUri: TEST_URIS.TEST_REDIR_URI
                    };
                    expect(logoutUriSpy.calledWith(validatedLogoutRequest));
                    done();
                })
        });

        it("doesnt navigate if onRedirectNavigate returns false (specific account)", (done) => {
            const testAccountInfo: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: "",
                username: "",
                idTokenClaims: {}
            };

            const logoutUriSpy = sinon.stub(AuthorizationCodeClient.prototype, "getLogoutUri").returns(testLogoutUrl);
            sinon.stub(NavigationClient.prototype, "navigateExternal").callsFake((urlNavigate: string, options: NavigationOptions): Promise<boolean> => {
                // If onRedirectNavigate does not stop navigatation, this will be called, failing the test as done will be invoked twice
                done();
                return Promise.resolve(true);
            });
            browserStorage.setInteractionInProgress(true);
            redirectClient.logout({
                account: testAccountInfo,
                onRedirectNavigate: (url: string) => {
                    expect(url).toEqual(testLogoutUrl);
                    return false;
                }
            })
                .then(() => {
                    expect(browserStorage.getInteractionInProgress()).toBeFalsy();

                    const validatedLogoutRequest: CommonEndSessionRequest = {
                        correlationId: RANDOM_TEST_GUID,
                        postLogoutRedirectUri: TEST_URIS.TEST_REDIR_URI
                    };
                    expect(logoutUriSpy.calledWith(validatedLogoutRequest));
                    done();
                })
        });

        it("does navigate if onRedirectNavigate returns true", (done) => {
            const logoutUriSpy = sinon.stub(AuthorizationCodeClient.prototype, "getLogoutUri").returns(testLogoutUrl);
            sinon.stub(NavigationClient.prototype, "navigateExternal").callsFake((urlNavigate: string, options: NavigationOptions): Promise<boolean> => {
                expect(browserStorage.getInteractionInProgress()).toBeTruthy();
                expect(urlNavigate).toEqual(testLogoutUrl);

                return Promise.resolve(true);
            });
            browserStorage.setInteractionInProgress(true);
            redirectClient.logout({
                onRedirectNavigate: (url) => {
                    expect(url).toEqual(testLogoutUrl);
                    return true;
                }
            })
                .then(() => {
                    expect(browserStorage.getInteractionInProgress()).toBeTruthy();

                    // Reset after testing it was properly set
                    browserStorage.setInteractionInProgress(false);

                    const validatedLogoutRequest: CommonEndSessionRequest = {
                        correlationId: RANDOM_TEST_GUID,
                        postLogoutRedirectUri: TEST_URIS.TEST_REDIR_URI
                    };
                    expect(logoutUriSpy.calledWith(validatedLogoutRequest));
                    done();
                })
        });

        it("does navigate if onRedirectNavigate returns true (specific account)", (done) => {
            const testAccountInfo: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: "",
                username: "",
                idTokenClaims: {}
            };

            const logoutUriSpy = sinon.stub(AuthorizationCodeClient.prototype, "getLogoutUri").returns(testLogoutUrl);
            sinon.stub(NavigationClient.prototype, "navigateExternal").callsFake((urlNavigate: string, options: NavigationOptions): Promise<boolean> => {
                expect(urlNavigate).toEqual(testLogoutUrl);

                return Promise.resolve(true);
            });
            browserStorage.setInteractionInProgress(true);
            redirectClient.logout({
                account: testAccountInfo,
                onRedirectNavigate: (url) => {
                    expect(url).toEqual(testLogoutUrl);
                    return true;
                }
            })
                .then(() => {
                    expect(browserStorage.getInteractionInProgress()).toBeTruthy();

                    // Reset after testing it was properly set
                    browserStorage.setInteractionInProgress(false);

                    const validatedLogoutRequest: CommonEndSessionRequest = {
                        correlationId: RANDOM_TEST_GUID,
                        postLogoutRedirectUri: TEST_URIS.TEST_REDIR_URI
                    };
                    expect(logoutUriSpy.calledWith(validatedLogoutRequest));
                    done();
                })
        });

        it("errors thrown are cached for telemetry and logout failure event is raised", (done) => {
            const testError = BrowserAuthError.createEmptyNavigationUriError();
            sinon.stub(NavigationClient.prototype, "navigateExternal").callsFake((): Promise<boolean> => {
                return Promise.reject(testError);
            });
            const eventSpy = sinon.spy(EventHandler.prototype, "emitEvent");
            const telemetrySpy = sinon.spy(ServerTelemetryManager.prototype, "cacheFailedRequest");
            redirectClient.logout().catch((e) => {
                expect(e).toMatchObject(testError);
                expect(telemetrySpy.calledWith(testError)).toBe(true);
                expect(eventSpy.calledWith(EventType.LOGOUT_FAILURE, InteractionType.Redirect, null, testError)).toBe(true);
                done();
            });
        });

        it("unexpected non-msal error does not add correlationId", (done) => {
            const testError = {
                errorCode: "Unexpected error",
                errorDesc: "Unexpected error"
            };
            sinon.stub(NavigationClient.prototype, "navigateExternal").callsFake((): Promise<boolean> => {
                return Promise.reject(testError);
            });
            redirectClient.logout().catch((e) => {
                expect(e).toMatchObject(testError);
                expect(e).not.toHaveProperty("correlationId");
                done();
            });
        });

        it("clears active account entry from the cache", async () => {
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

            const testAccountInfo: AccountInfo = {
                homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
                localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
                environment: "login.windows.net",
                tenantId: testIdTokenClaims.tid || "",
                username: testIdTokenClaims.preferred_username || ""
            };

            const testAccount: AccountEntity = new AccountEntity();
            testAccount.homeAccountId = testAccountInfo.homeAccountId;
            testAccount.localAccountId = testAccountInfo.localAccountId;
            testAccount.environment = testAccountInfo.environment;
            testAccount.realm = testAccountInfo.tenantId;
            testAccount.username = testAccountInfo.username;
            testAccount.name = testAccountInfo.name;
            testAccount.authorityType = "MSSTS";
            testAccount.clientInfo = TEST_DATA_CLIENT_INFO.TEST_CLIENT_INFO_B64ENCODED;

            const validatedLogoutRequest: CommonEndSessionRequest = {
                correlationId: RANDOM_TEST_GUID,
                postLogoutRedirectUri: TEST_URIS.TEST_REDIR_URI,
                account: testAccountInfo
            };

            sinon.stub(NavigationClient.prototype, "navigateExternal").callsFake((urlNavigate: string, options: NavigationOptions): Promise<boolean> => {
                return Promise.resolve(true);
            });

            window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${PersistentCacheKeys.ACTIVE_ACCOUNT_FILTERS}`, JSON.stringify({homeAccountId: testAccount.homeAccountId, localAccountId: testAccount.localAccountId}));
            window.sessionStorage.setItem(AccountEntity.generateAccountCacheKey(testAccountInfo), JSON.stringify(testAccount));

            await redirectClient.logout(validatedLogoutRequest).then(() => {
                // Interaction in progress
                expect(window.sessionStorage.length).toBe(1);
            });
        });
    });
});
