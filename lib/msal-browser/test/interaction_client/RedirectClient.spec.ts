/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import sinon from "sinon";
import { PublicClientApplication } from "../../src/app/PublicClientApplication";
import { TEST_CONFIG, TEST_URIS, TEST_HASHES, TEST_TOKENS, TEST_DATA_CLIENT_INFO, TEST_TOKEN_LIFETIMES, RANDOM_TEST_GUID, DEFAULT_OPENID_CONFIG_RESPONSE, testNavUrl, TEST_STATE_VALUES, testNavUrlNoRequest, DEFAULT_TENANT_DISCOVERY_RESPONSE, testLogoutUrl } from "../utils/StringConstants";
import { ServerError, Constants, AccountInfo, TokenClaims, AuthenticationResult, CommonAuthorizationCodeRequest, CommonAuthorizationUrlRequest, AuthToken, PersistentCacheKeys, AuthorizationCodeClient, ResponseMode, ProtocolUtils, AuthenticationScheme, Logger, ServerTelemetryEntity, LogLevel, NetworkResponse, ServerAuthorizationTokenResponse, CcsCredential, CcsCredentialType, CommonEndSessionRequest } from "@azure/msal-common";
import { BrowserUtils } from "../../src/utils/BrowserUtils";
import { BrowserConstants, TemporaryCacheKeys, ApiId, BrowserCacheLocation } from "../../src/utils/BrowserConstants";
import { Base64Encode } from "../../src/encode/Base64Encode";
import { XhrClient } from "../../src/network/XhrClient";
import { BrowserAuthErrorMessage, BrowserAuthError } from "../../src/error/BrowserAuthError";
import { RedirectHandler } from "../../src/interaction_handler/RedirectHandler";
import { CryptoOps } from "../../src/crypto/CryptoOps";
import { BrowserCacheManager } from "../../src/cache/BrowserCacheManager";
import { RedirectRequest } from "../../src/request/RedirectRequest";
import { NavigationClient } from "../../src/navigation/NavigationClient";
import { NavigationOptions } from "../../src/navigation/NavigationOptions";
import { RedirectClient } from "../../src/interaction_client/RedirectClient";

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

    describe("handleRedirectPromise", () => {
        it("does nothing if no hash is detected", (done) => {
            pca.handleRedirectPromise().then(() => {
                expect(window.localStorage.length).toEqual(0);
                expect(window.sessionStorage.length).toEqual(0);
                done();
            });
        });

        it("gets hash from cache and processes response", async () => {
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

            const tokenResponse = await pca.handleRedirectPromise();
            expect(tokenResponse?.uniqueId).toEqual(testTokenResponse.uniqueId);
            expect(tokenResponse?.tenantId).toEqual(testTokenResponse.tenantId);
            expect(tokenResponse?.scopes).toEqual(testTokenResponse.scopes);
            expect(tokenResponse?.idToken).toEqual(testTokenResponse.idToken);
            expect(tokenResponse?.idTokenClaims).toEqual(expect.objectContaining(testTokenResponse.idTokenClaims));
            expect(tokenResponse?.accessToken).toEqual(testTokenResponse.accessToken);
            expect(tokenResponse?.expiresOn && testTokenResponse.expiresOn && testTokenResponse.expiresOn.getMilliseconds() >= tokenResponse.expiresOn.getMilliseconds()).toBeTruthy();
            expect(window.sessionStorage.length).toEqual(4);
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
            const browserCrypto = new CryptoOps();
            const stateId = ProtocolUtils.parseRequestState(browserCrypto, stateString).libraryState.id;

            window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.REQUEST_PARAMS}`, browserCrypto.base64Encode(JSON.stringify(testAuthCodeRequest)));
            window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.ORIGIN_URI}`, TEST_URIS.TEST_REDIR_URI);
            window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.AUTHORITY}.${stateId}`, TEST_CONFIG.validAuthority);
            window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.REQUEST_STATE}.${stateId}`, TEST_STATE_VALUES.TEST_STATE_REDIRECT);
            window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.URL_HASH}`, TEST_HASHES.TEST_ERROR_HASH);
            window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.INTERACTION_STATUS_KEY}`, BrowserConstants.INTERACTION_IN_PROGRESS_VALUE);

            pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID
                }
            });

            pca.handleRedirectPromise().catch((err) => {
                expect(err instanceof ServerError).toBeTruthy();
                done();
            });
        });

        it("processes hash if navigateToLoginRequestUri is false and request origin is the same", async () => {
            const b64Encode = new Base64Encode();
            const stateString = TEST_STATE_VALUES.TEST_STATE_REDIRECT;
            const browserCrypto = new CryptoOps();
            const stateId = ProtocolUtils.parseRequestState(browserCrypto, stateString).libraryState.id;

            window.location.hash = TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT;
            window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.ORIGIN_URI}`, TEST_URIS.TEST_REDIR_URI);
            window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.AUTHORITY}.${stateId}`, TEST_CONFIG.validAuthority);
            window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.REQUEST_STATE}.${stateId}`, TEST_STATE_VALUES.TEST_STATE_REDIRECT);
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
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                    navigateToLoginRequestUrl: false
                }
            });

            const tokenResponse = await pca.handleRedirectPromise();
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
            const browserCrypto = new CryptoOps();
            const stateId = ProtocolUtils.parseRequestState(browserCrypto, stateString).libraryState.id;

            window.location.hash = TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT;
            window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.ORIGIN_URI}`, TEST_URIS.TEST_ALTERNATE_REDIR_URI);
            window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.AUTHORITY}.${stateId}`, TEST_CONFIG.validAuthority);
            window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.REQUEST_STATE}.${stateId}`, TEST_STATE_VALUES.TEST_STATE_REDIRECT);
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
            pca = new PublicClientApplication({
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

            const tokenResponse = await pca.handleRedirectPromise();
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
            const browserCrypto = new CryptoOps();
            const stateId = ProtocolUtils.parseRequestState(browserCrypto, stateString).libraryState.id;

            window.location.hash = TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT;
            window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.ORIGIN_URI}`, TEST_URIS.TEST_ALTERNATE_REDIR_URI);
            window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.AUTHORITY}.${stateId}`, TEST_CONFIG.validAuthority);
            window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.REQUEST_STATE}.${stateId}`, TEST_STATE_VALUES.TEST_STATE_REDIRECT);
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
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                    navigateToLoginRequestUrl: false
                }
            });

            const tokenResponse = await pca.handleRedirectPromise();
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
            sinon.stub(RedirectClient.prototype, <any>"interactionInProgress").returns(false);
            window.location.hash = TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT;
            window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.ORIGIN_URI}`, TEST_URIS.TEST_ALTERNATE_REDIR_URI);
            expect(await pca.handleRedirectPromise()).toBe(null);
        });

        it("navigates and caches hash if navigateToLoginRequestUri is true and interaction type is redirect", async () => {
            sinon.stub(RedirectClient.prototype, <any>"interactionInProgress").returns(true);
            window.location.hash = TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT;
            window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.ORIGIN_URI}`, TEST_URIS.TEST_ALTERNATE_REDIR_URI);
            sinon.stub(NavigationClient.prototype, "navigateInternal").callsFake((urlNavigate: string, options: NavigationOptions): Promise<boolean> => {
                expect(options.noHistory).toBeTruthy();
                expect(options.timeout).toBeGreaterThan(0);
                expect(urlNavigate).toEqual(TEST_URIS.TEST_ALTERNATE_REDIR_URI);
                return Promise.resolve(true);
            });
            await pca.handleRedirectPromise();
            expect(window.sessionStorage.getItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.URL_HASH}`)).toEqual(TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT);
        });

        it("navigates to root and caches hash if navigateToLoginRequestUri is true", (done) => {
            sinon.stub(RedirectClient.prototype, <any>"interactionInProgress").returns(true);
            window.location.hash = TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT;
            sinon.stub(NavigationClient.prototype, "navigateInternal").callsFake((urlNavigate: string, options: NavigationOptions): Promise<boolean> => {
                expect(options.noHistory).toBeTruthy();
                expect(options.timeout).toBeGreaterThan(0);
                expect(urlNavigate).toEqual("https://localhost:8081/");
                expect(window.sessionStorage.getItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.ORIGIN_URI}`)).toEqual("https://localhost:8081/");
                done();
                return Promise.resolve(true);
            });
            pca.handleRedirectPromise();
            expect(window.sessionStorage.getItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.URL_HASH}`)).toEqual(TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT);
        });

        it("navigates to root and caches hash if navigateToLoginRequestUri is true and loginRequestUrl is 'null'", (done) => {
            sinon.stub(RedirectClient.prototype, <any>"interactionInProgress").returns(true);
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
            pca.handleRedirectPromise();
            expect(window.sessionStorage.getItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.URL_HASH}`)).toEqual(TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT);
        });

        it("navigates and caches hash if navigateToLoginRequestUri is true and loginRequestUrl contains query string", (done) => {
            sinon.stub(RedirectClient.prototype, <any>"interactionInProgress").returns(true);
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
            pca.handleRedirectPromise();
            expect(window.sessionStorage.getItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.URL_HASH}`)).toEqual(TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT);
        });

        it("navigates and caches hash if navigateToLoginRequestUri is true and loginRequestUrl contains query string and hash", (done) => {
            sinon.stub(RedirectClient.prototype, <any>"interactionInProgress").returns(true);
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
            pca.handleRedirectPromise();
            expect(window.sessionStorage.getItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.URL_HASH}`)).toEqual(TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT);
        });

        it("replaces custom hash if navigateToLoginRequestUri is true and loginRequestUrl contains custom hash", () => {
            sinon.stub(RedirectClient.prototype, <any>"interactionInProgress").returns(true);
            const loginRequestUrl = window.location.href + "#testHash";
            window.location.hash = TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT;
            window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.ORIGIN_URI}`, loginRequestUrl);
            sinon.stub(RedirectClient.prototype, <any>"handleHash").callsFake((responseHash) => {
                expect(responseHash).toEqual(TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT);
            });
            pca.handleRedirectPromise().then(() => {
                expect(window.location.href).toEqual(loginRequestUrl);
            });
        });

        it("replaces custom hash if navigateToLoginRequestUri is true and loginRequestUrl contains custom hash (passed in)", () => {
            sinon.stub(RedirectClient.prototype, <any>"interactionInProgress").returns(true);
            const loginRequestUrl = window.location.href + "#testHash";
            window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.ORIGIN_URI}`, loginRequestUrl);
            sinon.stub(RedirectClient.prototype, <any>"handleHash").callsFake((responseHash) => {
                expect(responseHash).toEqual(TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT);
            });
            pca.handleRedirectPromise(TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT).then(() => {
                expect(window.location.href).toEqual(loginRequestUrl);
            });
        });

        it("processes hash if navigateToLoginRequestUri is true and loginRequestUrl contains trailing slash", (done) => {
            sinon.stub(RedirectClient.prototype, <any>"interactionInProgress").returns(true);
            const loginRequestUrl = window.location.href.endsWith("/") ? window.location.href.slice(0, -1) : window.location.href + "/";
            window.location.hash = TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT;
            window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.ORIGIN_URI}`, loginRequestUrl);
            sinon.stub(RedirectClient.prototype, <any>"handleHash").callsFake((responseHash) => {
                expect(responseHash).toEqual(TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT);
                done();
            });
            pca.handleRedirectPromise();
        });

        it("clears hash if navigateToLoginRequestUri is false and loginRequestUrl contains custom hash", (done) => {
            pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                    navigateToLoginRequestUrl: false
                }
            });
            sinon.stub(RedirectClient.prototype, <any>"interactionInProgress").returns(true);
            const loginRequestUrl = window.location.href + "#testHash";
            window.location.hash = TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT;
            window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.ORIGIN_URI}`, loginRequestUrl);
            sinon.stub(RedirectClient.prototype, <any>"handleHash").callsFake((responseHash) => {
                expect(window.location.href).not.toContain("#testHash");
                expect(responseHash).toEqual(TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT);
                done();
            });
            pca.handleRedirectPromise();
        });
    });

    describe("acquireToken", () => {
        it("throws if interaction is currently in progress", async () => {
            window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.INTERACTION_STATUS_KEY}`, BrowserConstants.INTERACTION_IN_PROGRESS_VALUE);
            // @ts-ignore
            await expect(pca.loginRedirect(null)).rejects.toMatchObject(BrowserAuthError.createInteractionInProgressError());
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
            sinon.stub(CryptoOps.prototype, "createNewGuid").returns(RANDOM_TEST_GUID);
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

            pca.loginRedirect(loginRequest);
        });

        it("navigates to created login url, with empty request",
            (done) => {
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
            }
        );

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

            sinon.stub(CryptoOps.prototype, "createNewGuid").returns(RANDOM_TEST_GUID);
            sinon.stub(NavigationClient.prototype, "navigateExternal").callsFake((urlNavigate: string, options: NavigationOptions): Promise<boolean> => {
                expect(options.noHistory).toBeFalsy();
                expect(urlNavigate).not.toBe("");
                return Promise.resolve(true);
            });
            const testLogger = new Logger(loggerOptions);

            const browserCrypto = new CryptoOps();
            const browserStorage = new BrowserCacheManager(TEST_CONFIG.MSAL_CLIENT_ID, cacheConfig, browserCrypto, testLogger);
            await pca.loginRedirect(emptyRequest);
            expect(browserStorage.getTemporaryCache(browserStorage.generateStateKey(TEST_STATE_VALUES.TEST_STATE_REDIRECT))).toEqual(TEST_STATE_VALUES.TEST_STATE_REDIRECT);
            expect(browserStorage.getTemporaryCache(browserStorage.generateNonceKey(TEST_STATE_VALUES.TEST_STATE_REDIRECT))).toEqual(RANDOM_TEST_GUID);
            expect(browserStorage.getTemporaryCache(browserStorage.generateAuthorityKey(TEST_STATE_VALUES.TEST_STATE_REDIRECT))).toEqual(`${Constants.DEFAULT_AUTHORITY}`);
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

            sinon.stub(CryptoOps.prototype, "createNewGuid").returns(RANDOM_TEST_GUID);
            sinon.stub(NavigationClient.prototype, "navigateExternal").callsFake((urlNavigate: string, options: NavigationOptions): Promise<boolean> => {
                expect(options.noHistory).toBeFalsy();
                expect(urlNavigate).not.toBe("");
                return Promise.resolve(true);
            });
            const testLogger = new Logger(loggerOptions);

            const browserCrypto = new CryptoOps();
            const browserStorage = new BrowserCacheManager(TEST_CONFIG.MSAL_CLIENT_ID, cacheConfig, browserCrypto, testLogger);
            await pca.loginRedirect(emptyRequest);
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

            sinon.stub(CryptoOps.prototype, "createNewGuid").returns(RANDOM_TEST_GUID);
            sinon.stub(NavigationClient.prototype, "navigateExternal").callsFake((urlNavigate: string, options: NavigationOptions): Promise<boolean> => {
                expect(options.noHistory).toBeFalsy();
                expect(urlNavigate).not.toBe("");
                return Promise.resolve(true);
            });
            const testLogger = new Logger(loggerOptions);

            const browserCrypto = new CryptoOps();
            const browserStorage = new BrowserCacheManager(TEST_CONFIG.MSAL_CLIENT_ID, cacheConfig, browserCrypto, testLogger);
            await pca.loginRedirect(emptyRequest);
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

            sinon.stub(CryptoOps.prototype, "createNewGuid").returns(RANDOM_TEST_GUID);
            sinon.stub(NavigationClient.prototype, "navigateExternal").callsFake((urlNavigate: string, options: NavigationOptions): Promise<boolean> => {
                expect(options.noHistory).toBeFalsy();
                expect(urlNavigate).not.toBe("");
                return Promise.resolve(true);
            });

            const browserCrypto = new CryptoOps();
            const testLogger = new Logger(loggerOptions);
            const browserStorage = new BrowserCacheManager(TEST_CONFIG.MSAL_CLIENT_ID, cacheConfig, browserCrypto, testLogger);
            await pca.loginRedirect(tokenRequest);
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

            const browserCrypto = new CryptoOps();
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
                await pca.loginRedirect(emptyRequest);
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
            const browserCrypto = new CryptoOps();
            const testLogger = new Logger(loggerOptions);
            const browserStorage: BrowserCacheManager = new BrowserCacheManager(TEST_CONFIG.MSAL_CLIENT_ID, cacheConfig, browserCrypto, testLogger);
            browserStorage.setTemporaryCache(PersistentCacheKeys.ADAL_ID_TOKEN, TEST_TOKENS.IDTOKEN_V1);
            const loginUrlSpy = sinon.spy(AuthorizationCodeClient.prototype, "getAuthCodeUrl");
            sinon.stub(CryptoOps.prototype, "generatePkceCodes").resolves({
                challenge: TEST_CONFIG.TEST_CHALLENGE,
                verifier: TEST_CONFIG.TEST_VERIFIER
            });
            sinon.stub(CryptoOps.prototype, "createNewGuid").returns(RANDOM_TEST_GUID);
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
            await pca.loginRedirect(emptyRequest);
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
                codeChallengeMethod: Constants.S256_CODE_CHALLENGE_METHOD
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
            const browserCrypto = new CryptoOps();
            const testLogger = new Logger(loggerOptions);
            const browserStorage: BrowserCacheManager = new BrowserCacheManager(TEST_CONFIG.MSAL_CLIENT_ID, cacheConfig, browserCrypto, testLogger);
            browserStorage.setTemporaryCache(PersistentCacheKeys.ADAL_ID_TOKEN, TEST_TOKENS.IDTOKEN_V1);
            const loginUrlSpy = sinon.spy(AuthorizationCodeClient.prototype, "getAuthCodeUrl");
            sinon.stub(CryptoOps.prototype, "generatePkceCodes").resolves({
                challenge: TEST_CONFIG.TEST_CHALLENGE,
                verifier: TEST_CONFIG.TEST_VERIFIER
            });
            sinon.stub(CryptoOps.prototype, "createNewGuid").returns(RANDOM_TEST_GUID);
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
            await pca.loginRedirect(loginRequest);
            const validatedRequest: CommonAuthorizationUrlRequest = {
                ...loginRequest,
                scopes: [],
                state: TEST_STATE_VALUES.TEST_STATE_REDIRECT,
                correlationId: RANDOM_TEST_GUID,
                authority: `${Constants.DEFAULT_AUTHORITY}`,
                nonce: RANDOM_TEST_GUID,
                responseMode: ResponseMode.FRAGMENT,
                codeChallenge: TEST_CONFIG.TEST_CHALLENGE,
                codeChallengeMethod: Constants.S256_CODE_CHALLENGE_METHOD
            };
            expect(loginUrlSpy.calledWith(validatedRequest)).toBeTruthy();
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

        it("navigates to created login url", (done) => {
            sinon.stub(RedirectHandler.prototype, "initiateAuthRequest").callsFake((navigateUrl): Promise<void> => {
                expect(navigateUrl).toEqual(testNavUrl);
                return Promise.resolve(done());
            });
            sinon.stub(CryptoOps.prototype, "generatePkceCodes").resolves({
                challenge: TEST_CONFIG.TEST_CHALLENGE,
                verifier: TEST_CONFIG.TEST_VERIFIER
            });
            sinon.stub(CryptoOps.prototype, "createNewGuid").returns(RANDOM_TEST_GUID);
            const loginRequest: RedirectRequest = {
                redirectUri: TEST_URIS.TEST_REDIR_URI,
                scopes: ["user.read", "openid", "profile"],
                state: TEST_STATE_VALUES.USER_STATE,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                nonce: "",
                authenticationScheme: TEST_CONFIG.TOKEN_TYPE_BEARER as AuthenticationScheme
            };
            pca.acquireTokenRedirect(loginRequest);
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
            sinon.stub(CryptoOps.prototype, "createNewGuid").returns(RANDOM_TEST_GUID);
            const loginRequest: RedirectRequest = {
                redirectUri: TEST_URIS.TEST_REDIR_URI,
                scopes: ["user.read", "openid", "profile"],
                state: TEST_STATE_VALUES.USER_STATE,
                onRedirectNavigate
            };
            pca.acquireTokenRedirect(loginRequest);
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
            sinon.stub(CryptoOps.prototype, "createNewGuid").returns(RANDOM_TEST_GUID);
            sinon.stub(NavigationClient.prototype, "navigateExternal").callsFake((urlNavigate: string, options: NavigationOptions): Promise<boolean> => {
                expect(options.noHistory).toBeFalsy();
                expect(urlNavigate).not.toBe("");
                return Promise.resolve(true);
            });
            const browserCrypto = new CryptoOps();
            const testLogger = new Logger(loggerOptions);
            const browserStorage = new BrowserCacheManager(TEST_CONFIG.MSAL_CLIENT_ID, cacheConfig, browserCrypto, testLogger);
            await pca.loginRedirect(emptyRequest);
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
            sinon.stub(CryptoOps.prototype, "createNewGuid").returns(RANDOM_TEST_GUID);
            sinon.stub(NavigationClient.prototype, "navigateExternal").callsFake((urlNavigate: string, options: NavigationOptions): Promise<boolean> => {
                expect(options.noHistory).toBeFalsy();
                expect(urlNavigate).not.toBe("");
                return Promise.resolve(true);
            });
            const browserCrypto = new CryptoOps();
            const testLogger = new Logger(loggerOptions);
            const browserStorage = new BrowserCacheManager(TEST_CONFIG.MSAL_CLIENT_ID, cacheConfig, browserCrypto, testLogger);
            await pca.acquireTokenRedirect(tokenRequest);
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
            const browserCrypto = new CryptoOps();
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
                await pca.acquireTokenRedirect(emptyRequest);
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
            const browserCrypto = new CryptoOps();
            const testLogger = new Logger(loggerOptions);
            const browserStorage: BrowserCacheManager = new BrowserCacheManager(TEST_CONFIG.MSAL_CLIENT_ID, cacheConfig, browserCrypto, testLogger);
            browserStorage.setTemporaryCache(PersistentCacheKeys.ADAL_ID_TOKEN, TEST_TOKENS.IDTOKEN_V1);
            const acquireTokenUrlSpy = sinon.spy(AuthorizationCodeClient.prototype, "getAuthCodeUrl");
            sinon.stub(CryptoOps.prototype, "generatePkceCodes").resolves({
                challenge: TEST_CONFIG.TEST_CHALLENGE,
                verifier: TEST_CONFIG.TEST_VERIFIER
            });
            sinon.stub(CryptoOps.prototype, "createNewGuid").returns(RANDOM_TEST_GUID);
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
            await pca.acquireTokenRedirect(emptyRequest);
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
                codeChallengeMethod: Constants.S256_CODE_CHALLENGE_METHOD
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
            const browserCrypto = new CryptoOps();
            const testLogger = new Logger(loggerOptions);
            const browserStorage: BrowserCacheManager = new BrowserCacheManager(TEST_CONFIG.MSAL_CLIENT_ID, cacheConfig, browserCrypto, testLogger);
            browserStorage.setTemporaryCache(PersistentCacheKeys.ADAL_ID_TOKEN, TEST_TOKENS.IDTOKEN_V1);
            const acquireTokenUrlSpy = sinon.spy(AuthorizationCodeClient.prototype, "getAuthCodeUrl");
            sinon.stub(CryptoOps.prototype, "generatePkceCodes").resolves({
                challenge: TEST_CONFIG.TEST_CHALLENGE,
                verifier: TEST_CONFIG.TEST_VERIFIER
            });
            sinon.stub(CryptoOps.prototype, "createNewGuid").returns(RANDOM_TEST_GUID);
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
            await pca.acquireTokenRedirect(loginRequest);
            const validatedRequest: CommonAuthorizationUrlRequest = {
                ...loginRequest,
                scopes: [...loginRequest.scopes],
                state: TEST_STATE_VALUES.TEST_STATE_REDIRECT,
                correlationId: RANDOM_TEST_GUID,
                authority: `${Constants.DEFAULT_AUTHORITY}`,
                nonce: RANDOM_TEST_GUID,
                responseMode: ResponseMode.FRAGMENT,
                codeChallenge: TEST_CONFIG.TEST_CHALLENGE,
                codeChallengeMethod: Constants.S256_CODE_CHALLENGE_METHOD
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
            pca.logoutRedirect();
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
            pca.logoutRedirect({
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
            
            const pcaWithPostLogout = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                    postLogoutRedirectUri
                }
            });

            pcaWithPostLogout.logoutRedirect();
        });

        it("doesn't include postLogoutRedirectUri if null is configured", (done) => {
            sinon.stub(NavigationClient.prototype, "navigateExternal").callsFake((urlNavigate: string, options: NavigationOptions): Promise<boolean> => {
                expect(urlNavigate).not.toContain(`post_logout_redirect_uri`);
                done();
                return Promise.resolve(true);
            });
            
            const pcaWithPostLogout = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                    postLogoutRedirectUri: null
                }
            });

            pcaWithPostLogout.logoutRedirect();
        });

        it("doesn't include postLogoutRedirectUri if null is set on request", (done) => {
            sinon.stub(NavigationClient.prototype, "navigateExternal").callsFake((urlNavigate: string, options: NavigationOptions): Promise<boolean> => {
                expect(urlNavigate).not.toContain("post_logout_redirect_uri");
                done();
                return Promise.resolve(true);
            });
            pca.logoutRedirect({
                postLogoutRedirectUri: null
            });
        });

        it("includes postLogoutRedirectUri as current page if none is set on request", (done) => {
            sinon.stub(NavigationClient.prototype, "navigateExternal").callsFake((urlNavigate: string, options: NavigationOptions): Promise<boolean> => {
                expect(urlNavigate).toContain(`post_logout_redirect_uri=${encodeURIComponent("https://localhost:8081/index.html")}`);
                done();
                return Promise.resolve(true);
            });
            pca.logoutRedirect();
        });

        it("doesnt navigate if onRedirectNavigate returns false", (done) => {
            const logoutUriSpy = sinon.stub(AuthorizationCodeClient.prototype, "getLogoutUri").returns(testLogoutUrl);
            sinon.stub(NavigationClient.prototype, "navigateExternal").callsFake((urlNavigate: string, options: NavigationOptions): Promise<boolean> => {
                // If onRedirectNavigate does not stop navigatation, this will be called, failing the test as done will be invoked twice
                done();
                return Promise.resolve(true);
            });
            pca.logoutRedirect({
                onRedirectNavigate: (url: string) => {
                    expect(url).toEqual(testLogoutUrl);
                    done();
                    return false;
                }
            });
            const validatedLogoutRequest: CommonEndSessionRequest = {
                correlationId: RANDOM_TEST_GUID,
                postLogoutRedirectUri: TEST_URIS.TEST_REDIR_URI
            };
            expect(logoutUriSpy.calledWith(validatedLogoutRequest));
        });

        it("does navigate if onRedirectNavigate returns true", (done) => {
            const logoutUriSpy = sinon.stub(AuthorizationCodeClient.prototype, "getLogoutUri").returns(testLogoutUrl);
            sinon.stub(NavigationClient.prototype, "navigateExternal").callsFake((urlNavigate: string, options: NavigationOptions): Promise<boolean> => {
                expect(urlNavigate).toEqual(testLogoutUrl);
                done();
                return Promise.resolve(true);
            });
            pca.logoutRedirect({
                onRedirectNavigate: (url) => {
                    expect(url).toEqual(testLogoutUrl);
                    return true;
                }
            });
            const validatedLogoutRequest: CommonEndSessionRequest = {
                correlationId: RANDOM_TEST_GUID,
                postLogoutRedirectUri: TEST_URIS.TEST_REDIR_URI
            };
            expect(logoutUriSpy.calledWith(validatedLogoutRequest));
        });
        
        it("throws an error if inside an iframe", async () => {
            sinon.stub(BrowserUtils, "isInIframe").returns(true);
            await expect(pca.logoutRedirect()).rejects.toMatchObject(BrowserAuthError.createRedirectInIframeError(true));
        });
    });
});