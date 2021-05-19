/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import sinon from "sinon";
import { PublicClientApplication } from "../../src/app/PublicClientApplication";
import { TEST_CONFIG, TEST_URIS, TEST_HASHES, TEST_TOKENS, TEST_DATA_CLIENT_INFO, TEST_TOKEN_LIFETIMES, RANDOM_TEST_GUID, DEFAULT_OPENID_CONFIG_RESPONSE, testNavUrl, testLogoutUrl, TEST_STATE_VALUES, testNavUrlNoRequest, DEFAULT_TENANT_DISCOVERY_RESPONSE } from "../utils/StringConstants";
import { ServerError, Constants, AccountInfo, TokenClaims, PromptValue, AuthenticationResult, CommonAuthorizationCodeRequest, CommonAuthorizationUrlRequest, AuthToken, PersistentCacheKeys, AuthorizationCodeClient, ResponseMode, AccountEntity, ProtocolUtils, AuthenticationScheme, RefreshTokenClient, Logger, ServerTelemetryEntity, CommonSilentFlowRequest, CommonEndSessionRequest, LogLevel, NetworkResponse, ServerAuthorizationTokenResponse } from "@azure/msal-common";
import { BrowserUtils } from "../../src/utils/BrowserUtils";
import { BrowserConstants, TemporaryCacheKeys, ApiId, InteractionType, BrowserCacheLocation, WrapperSKU } from "../../src/utils/BrowserConstants";
import { Base64Encode } from "../../src/encode/Base64Encode";
import { XhrClient } from "../../src/network/XhrClient";
import { BrowserAuthErrorMessage, BrowserAuthError } from "../../src/error/BrowserAuthError";
import { RedirectHandler } from "../../src/interaction_handler/RedirectHandler";
import { PopupHandler } from "../../src/interaction_handler/PopupHandler";
import { SilentHandler } from "../../src/interaction_handler/SilentHandler";
import { CryptoOps } from "../../src/crypto/CryptoOps";
import { DatabaseStorage } from "../../src/cache/DatabaseStorage";
import { EventType } from "../../src/event/EventType";
import { SilentRequest } from "../../src/request/SilentRequest";
import { BrowserCacheManager } from "../../src/cache/BrowserCacheManager";
import { RedirectRequest } from "../../src/request/RedirectRequest";
import { NavigationClient } from "../../src/navigation/NavigationClient";
import { NavigationOptions } from "../../src/navigation/NavigationOptions";
import { PopupUtils } from "../../src/utils/PopupUtils";
import { EndSessionPopupRequest } from "../../src/request/EndSessionPopupRequest";
import { EventMessage } from "../../src/event/EventMessage";

describe("PublicClientApplication.ts Class Unit Tests", () => {
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

    let dbStorage = {};

    let pca: PublicClientApplication;
    beforeEach(() => {
        sinon.stub(DatabaseStorage.prototype, "open").callsFake(async (): Promise<void> => {
            dbStorage = {};
        });
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
            expect(pca).not.toBeNull;
            expect(pca instanceof PublicClientApplication).toBeTruthy();
            done();
        });

        it("handleRedirectPromise returns null if interaction is not in progress",
            async () => {
                sinon.stub(pca, <any>"interactionInProgress").returns(false);
                window.location.hash = TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT;
                window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.ORIGIN_URI}`, TEST_URIS.TEST_ALTERNATE_REDIR_URI);
                expect(await pca.handleRedirectPromise()).toBeNull;
            }
        );

        it("navigates and caches hash if navigateToLoginRequestUri is true and interaction type is redirect",
            async () => {
                sinon.stub(pca, <any>"interactionInProgress").returns(true);
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
            }
        );

        it("navigates to root and caches hash if navigateToLoginRequestUri is true",
            (done) => {
                sinon.stub(pca, <any>"interactionInProgress").returns(true);
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
            }
        );

        it("navigates to root and caches hash if navigateToLoginRequestUri is true and loginRequestUrl is 'null'",
            (done) => {
                sinon.stub(pca, <any>"interactionInProgress").returns(true);
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
            }
        );

        it("navigates and caches hash if navigateToLoginRequestUri is true and loginRequestUrl contains query string",
            (done) => {
                sinon.stub(pca, <any>"interactionInProgress").returns(true);
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
            }
        );

        it("navigates and caches hash if navigateToLoginRequestUri is true and loginRequestUrl contains query string and hash",
            (done) => {
                sinon.stub(pca, <any>"interactionInProgress").returns(true);
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
            }
        );

        it("replaces custom hash if navigateToLoginRequestUri is true and loginRequestUrl contains custom hash",
            () => {
                sinon.stub(pca, <any>"interactionInProgress").returns(true);
                const loginRequestUrl = window.location.href + "#testHash";
                window.location.hash = TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT;
                window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.ORIGIN_URI}`, loginRequestUrl);
                sinon.stub(PublicClientApplication.prototype, <any>"handleHash").callsFake((responseHash) => {
                    expect(responseHash).toEqual(TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT);
                });
                return pca.handleRedirectPromise()
                    .then(() => {
                        expect(window.location.href).toEqual(loginRequestUrl);
                    });
            }
        );

        it("replaces custom hash if navigateToLoginRequestUri is true and loginRequestUrl contains custom hash (passed in)",
            () => {
                sinon.stub(pca, <any>"interactionInProgress").returns(true);
                const loginRequestUrl = window.location.href + "#testHash";
                window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.ORIGIN_URI}`, loginRequestUrl);
                sinon.stub(PublicClientApplication.prototype, <any>"handleHash").callsFake((responseHash) => {
                    expect(responseHash).toEqual(TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT);
                });
                return pca.handleRedirectPromise(TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT)
                    .then(() => {
                        expect(window.location.href).toEqual(loginRequestUrl);
                    });
            }
        );

        it("processes hash if navigateToLoginRequestUri is true and loginRequestUrl contains trailing slash",
            (done) => {
                sinon.stub(pca, <any>"interactionInProgress").returns(true);
                const loginRequestUrl = window.location.href.endsWith("/") ? window.location.href.slice(0, -1) : window.location.href + "/";
                window.location.hash = TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT;
                window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.ORIGIN_URI}`, loginRequestUrl);
                sinon.stub(PublicClientApplication.prototype, <any>"handleHash").callsFake((responseHash) => {
                    expect(responseHash).toEqual(TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT);
                    done();
                });
                pca.handleRedirectPromise();
            }
        );

        it("clears hash if navigateToLoginRequestUri is false and loginRequestUrl contains custom hash",
            (done) => {
                pca = new PublicClientApplication({
                    auth: {
                        clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                        navigateToLoginRequestUrl: false
                    }
                });
                sinon.stub(pca, <any>"interactionInProgress").returns(true);
                const loginRequestUrl = window.location.href + "#testHash";
                window.location.hash = TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT;
                window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.ORIGIN_URI}`, loginRequestUrl);
                sinon.stub(PublicClientApplication.prototype, <any>"handleHash").callsFake((responseHash) => {
                    expect(window.location.href).not.toContain("#testHash");
                    expect(responseHash).toEqual(TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT);
                    done();
                });
                pca.handleRedirectPromise();
            }
        );
    });

    describe("Redirect Flow Unit tests", () => {

        describe("handleRedirectPromise()", () => {
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

            it(
                "Multiple concurrent calls to handleRedirectPromise return the same promise",
                async () => {
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

                    const promise1 = pca.handleRedirectPromise();
                    const promise2 = pca.handleRedirectPromise();
                    const tokenResponse1 = await promise1;
                    const tokenResponse2 = await promise2;
                    const tokenResponse3 = await pca.handleRedirectPromise("testHash");
                    expect(tokenResponse3).toBeNull();
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
                }
            );

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

            it("processes hash if navigateToLoginRequestUri is false and request origin is the same",
                async () => {
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
                }
            );

            it(
                "calls custom navigateInternal function then processes hash",
                async () => {
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
                        expect(tokenResponse).not.toBeNull();
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
                }
            );

            it(
                "processes hash if navigateToLoginRequestUri is false and request origin is different",
                async () => {
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
                }
            );
        });

        describe("loginRedirect", () => {

            it(
                "loginRedirect throws an error if interaction is currently in progress",
                async () => {
                    window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.INTERACTION_STATUS_KEY}`, BrowserConstants.INTERACTION_IN_PROGRESS_VALUE);
                    // @ts-ignore
                    await expect(pca.loginRedirect(null)).rejects.toMatchObject(BrowserAuthError.createInteractionInProgressError());
                }
            );

            it("Uses default request if no request provided", (done) => {
                sinon.stub(pca, "acquireTokenRedirect").callsFake(async (request): Promise<void> => {
                    expect(request.scopes).toContain("openid");
                    expect(request.scopes).toContain("profile");
                    done();
                    return;
                });

                pca.loginRedirect();
            });

            it("loginRedirect navigates to created login url", (done) => {
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

            it(
                "loginRedirect navigates to created login url, with empty request",
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

            it(
                "Does not use adal token from cache if it is present and SSO params have been given.",
                async () => {
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
                }
            );
        });

        describe("inside popup", () => {
            const oldWindowOpener = window.opener;
            const oldWindowName = window.name;

            beforeEach(() => {
                const newWindow = {
                    ...window
                };
                
                delete window.opener;
                delete window.name;
                window.opener = newWindow;
                window.name = "msal.testPopup"
            });
            
            afterEach(() => {
                window.name = oldWindowName;
                window.opener = oldWindowOpener;
            });

            it("acquireTokenRedirect() throws error if called in a popup", (done) => {
                sinon.stub(BrowserUtils, "isInIframe").returns(false);
                pca.acquireTokenRedirect({scopes: ["openid"]}).catch(e => {
                    expect(e).toBeInstanceOf(BrowserAuthError);
                    expect(e.errorCode).toEqual(BrowserAuthErrorMessage.blockAcquireTokenInPopupsError.code);
                    expect(e.errorMessage).toEqual(BrowserAuthErrorMessage.blockAcquireTokenInPopupsError.desc);
                    done();
                });
            });

            it("acquireTokenPopup() throws error if called in a popup", (done) => {
                pca.acquireTokenPopup({scopes: ["openid"]}).catch(e => {
                    expect(e).toBeInstanceOf(BrowserAuthError);
                    expect(e.errorCode).toEqual(BrowserAuthErrorMessage.blockAcquireTokenInPopupsError.code);
                    expect(e.errorMessage).toEqual(BrowserAuthErrorMessage.blockAcquireTokenInPopupsError.desc);
                    done();
                });
            });
        });

        describe("acquireTokenRedirect", () => {

            it("throws an error if interaction is currently in progress", async () => {
                window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.INTERACTION_STATUS_KEY}`, BrowserConstants.INTERACTION_IN_PROGRESS_VALUE);
                // @ts-ignore
                await expect(pca.acquireTokenRedirect(null)).rejects.toMatchObject(BrowserAuthError.createInteractionInProgressError());
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

            it(
                "Does not use adal token from cache if it is present and SSO params have been given.",
                async () => {
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
                }
            );
        });
    });

    describe("Popup Flow Unit tests", () => {

        describe("loginPopup", () => {
            beforeEach(() => {
                const popupWindow = {
                    ...window,
                    close: () => {}
                };
                // @ts-ignore
                sinon.stub(window, "open").returns(popupWindow);
            });

            afterEach(() => {
                sinon.restore();
            });

            it("throws error if interaction is in progress", async () => {
                window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.INTERACTION_STATUS_KEY}`, BrowserConstants.INTERACTION_IN_PROGRESS_VALUE);
                // @ts-ignore
                await expect(pca.loginPopup(null)).rejects.toMatchObject(BrowserAuthError.createInteractionInProgressError());
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
                // @ts-ignore
                const tokenResp = await pca.loginPopup(null);
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
                    // @ts-ignore
                    await pca.loginPopup(null);
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

            it("throws error if interaction is in progress", async () => {
                window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.INTERACTION_STATUS_KEY}`, BrowserConstants.INTERACTION_IN_PROGRESS_VALUE);
                await expect(pca.acquireTokenPopup({
                    redirectUri: TEST_URIS.TEST_REDIR_URI,
                    scopes: ["scope"]
                })).rejects.toMatchObject(BrowserAuthError.createInteractionInProgressError());
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
                    await pca.acquireTokenPopup(request);
                } catch(e) {}
                expect(popupSpy.getCall(0).args).toHaveLength(2);
            });

            it("opens popups asynchronously if configured", async () => {
                pca = new PublicClientApplication({
                    auth: {
                        clientId: TEST_CONFIG.MSAL_CLIENT_ID
                    },
                    system: {
                        asyncPopups: true
                    }
                });

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
                    await pca.acquireTokenPopup(request);
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
                const tokenResp = await pca.acquireTokenPopup({
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
                    await pca.acquireTokenPopup({
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
    });

    describe("ssoSilent() Tests", () => {

        it("throws error if loginHint or sid are empty", async () => {
            await expect(pca.ssoSilent({
                redirectUri: TEST_URIS.TEST_REDIR_URI,
                scopes: [TEST_CONFIG.MSAL_CLIENT_ID]
            })).rejects.toMatchObject(BrowserAuthError.createSilentSSOInsufficientInfoError());
        });

        it("throws error if prompt is not set to 'none'", async () => {
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
                authenticationScheme: TEST_CONFIG.TOKEN_TYPE_BEARER as AuthenticationScheme
            };

            await expect(pca.ssoSilent(req)).rejects.toMatchObject(BrowserAuthError.createSilentPromptValueError(req.prompt || ""));
        });

        it("successfully returns a token response (login_hint)", async () => {
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
                expiresOn: new Date(Date.now() + (testServerTokenResponse.expires_in * 1000)),
                account: testAccount,
                tokenType: AuthenticationScheme.BEARER
            };
            sinon.stub(AuthorizationCodeClient.prototype, "getAuthCodeUrl").resolves(testNavUrl);
            const loadFrameSyncSpy = sinon.spy(SilentHandler.prototype, <any>"loadFrameSync");
            sinon.stub(SilentHandler.prototype, "monitorIframeForHash").resolves(TEST_HASHES.TEST_SUCCESS_CODE_HASH_SILENT);
            sinon.stub(SilentHandler.prototype, "handleCodeResponse").resolves(testTokenResponse);
            sinon.stub(CryptoOps.prototype, "generatePkceCodes").resolves({
                challenge: TEST_CONFIG.TEST_CHALLENGE,
                verifier: TEST_CONFIG.TEST_VERIFIER
            });
            sinon.stub(CryptoOps.prototype, "createNewGuid").returns(RANDOM_TEST_GUID);
            const tokenResp = await pca.ssoSilent({
                redirectUri: TEST_URIS.TEST_REDIR_URI,
                loginHint: "testLoginHint"
            });
            expect(loadFrameSyncSpy.calledOnce).toBeTruthy();
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
                expiresOn: new Date(Date.now() + (testServerTokenResponse.expires_in * 1000)),
                account: testAccount,
                tokenType: AuthenticationScheme.BEARER
            };
            sinon.stub(AuthorizationCodeClient.prototype, "getAuthCodeUrl").resolves(testNavUrl);
            const loadFrameSyncSpy = sinon.spy(SilentHandler.prototype, <any>"loadFrameSync");
            sinon.stub(SilentHandler.prototype, "monitorIframeForHash").resolves(TEST_HASHES.TEST_SUCCESS_CODE_HASH_SILENT);
            sinon.stub(SilentHandler.prototype, "handleCodeResponse").resolves(testTokenResponse);
            sinon.stub(CryptoOps.prototype, "generatePkceCodes").resolves({
                challenge: TEST_CONFIG.TEST_CHALLENGE,
                verifier: TEST_CONFIG.TEST_VERIFIER
            });
            sinon.stub(CryptoOps.prototype, "createNewGuid").returns(RANDOM_TEST_GUID);
            const tokenResp = await pca.ssoSilent({
                redirectUri: TEST_URIS.TEST_REDIR_URI,
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                sid: TEST_CONFIG.SID
            });
            expect(loadFrameSyncSpy.calledOnce).toBeTruthy();
            expect(tokenResp).toEqual(testTokenResponse);
        });
    });

    describe("Acquire Token Silent (Iframe) Tests", () => {

        it("successfully renews token", async () => {
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
                scopes: ["scope1"],
                idToken: testServerTokenResponse.id_token,
                idTokenClaims: testIdTokenClaims,
                accessToken: testServerTokenResponse.access_token,
                fromCache: false,
                expiresOn: new Date(Date.now() + (testServerTokenResponse.expires_in * 1000)),
                account: testAccount,
                tokenType: AuthenticationScheme.BEARER
            };
            sinon.stub(CryptoOps.prototype, "createNewGuid").returns(RANDOM_TEST_GUID);
            const silentATStub = sinon.stub(RefreshTokenClient.prototype, <any>"acquireTokenByRefreshToken").resolves(testTokenResponse);
            const tokenRequest: CommonSilentFlowRequest = {
                scopes: ["scope1"],
                account: testAccount,
                authority: TEST_CONFIG.validAuthority,
                authenticationScheme: AuthenticationScheme.BEARER,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                forceRefresh: false
            };
            const expectedTokenRequest: CommonSilentFlowRequest = {
                ...tokenRequest,
                scopes: ["scope1"],
                authority: `${Constants.DEFAULT_AUTHORITY}`,
                correlationId: RANDOM_TEST_GUID,
                forceRefresh: false
            };
            const tokenResp = await pca.acquireTokenSilent(tokenRequest);
            expect(silentATStub.calledWith(expectedTokenRequest)).toBeTruthy();
            expect(tokenResp).toEqual(testTokenResponse);
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

        it(
            "Falls back to silent handler if thrown error is a refresh token expired error",
            async () => {
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
                    expiresOn: new Date(Date.now() + (testServerTokenResponse.expires_in * 1000)),
                    account: testAccount,
                    tokenType: AuthenticationScheme.BEARER
                };
                const createAcqTokenStub = sinon.stub(AuthorizationCodeClient.prototype, "getAuthCodeUrl").resolves(testNavUrl);
                const silentTokenHelperStub = sinon.stub(pca, <any>"silentTokenHelper").resolves(testTokenResponse);
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
            }
        );
    });

    describe("logoutRedirect", () => {

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

        it("doesn't include postLogoutRedirectUri if null is set on request",
            (done) => {
                sinon.stub(NavigationClient.prototype, "navigateExternal").callsFake((urlNavigate: string, options: NavigationOptions): Promise<boolean> => {
                    expect(urlNavigate).not.toContain("post_logout_redirect_uri");
                    done();
                    return Promise.resolve(true);
                });
                pca.logoutRedirect({
                    postLogoutRedirectUri: null
                });
            }
        );

        it("includes postLogoutRedirectUri as current page if none is set on request",
            (done) => {
                sinon.stub(NavigationClient.prototype, "navigateExternal").callsFake((urlNavigate: string, options: NavigationOptions): Promise<boolean> => {
                    expect(urlNavigate).toContain(`post_logout_redirect_uri=${encodeURIComponent("https://localhost:8081/index.html")}`);
                    done();
                    return Promise.resolve(true);
                });
                pca.logoutRedirect();
            }
        );

        it("doesnt navigate if onRedirectNavigate returns false", (done) => {
            const logoutUriSpy = sinon.stub(AuthorizationCodeClient.prototype, "getLogoutUri").returns(testLogoutUrl);
            sinon.stub(NavigationClient.prototype, "navigateExternal").callsFake((urlNavigate: string, options: NavigationOptions): Promise<boolean> => {
                // If onRedirectNavigate does not stop navigatation, this will be called, failing the test as done will be invoked twice
                done();
                return Promise.resolve(true);
            });
            pca.logoutRedirect({
                onRedirectNavigate: (url) => {
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

    describe("logoutPopup", () => {
        beforeEach(() => {
            const popupWindow = {
                ...window,
                close: () => {}
            };
            // @ts-ignore
            sinon.stub(window, "open").returns(popupWindow);
        });

        afterEach(() => {
            sinon.restore();
        });

        it("throws error if interaction is in progress", async () => {
            window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.INTERACTION_STATUS_KEY}`, BrowserConstants.INTERACTION_IN_PROGRESS_VALUE);

            await expect(pca.logoutPopup()).rejects.toMatchObject(BrowserAuthError.createInteractionInProgressError());
        });

        it("opens popup window before network request by default", async () => {
            const popupSpy = sinon.stub(PopupUtils, "openSizedPopup");

            try {
                await pca.logoutPopup();
            } catch(e) {}
            expect(popupSpy.getCall(0).args).toHaveLength(2);
        });

        it("opens popups asynchronously if configured", (done) => {
            pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID
                },
                system: {
                    asyncPopups: true
                }
            });
            sinon.stub(PopupUtils, "openSizedPopup").callsFake((urlNavigate, popupName) => {
                expect(urlNavigate.startsWith(TEST_URIS.TEST_END_SESSION_ENDPOINT)).toBeTruthy();
                expect(popupName.startsWith(`msal.${TEST_CONFIG.MSAL_CLIENT_ID}`)).toBeTruthy();
                done();
                return null;
            });

            pca.logoutPopup().catch(() => {});
        });

        it("catches error and cleans cache before rethrowing", async () => {
            const testError = {
                errorCode: "create_logout_url_error",
                errorMessage: "Error in creating a logout url"
            };
            sinon.stub(AuthorizationCodeClient.prototype, "getLogoutUri").throws(testError);

            try {
                await pca.logoutPopup();
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
            pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID
                },
                system: {
                    asyncPopups: true
                }
            });
            sinon.stub(PopupUtils, "openSizedPopup").callsFake((urlNavigate) => {
                expect(urlNavigate.startsWith(TEST_URIS.TEST_END_SESSION_ENDPOINT)).toBeTruthy();
                expect(urlNavigate).toContain(`post_logout_redirect_uri=${encodeURIComponent(postLogoutRedirectUri)}`);
                done();
                throw "Stop Test";
            });

            const postLogoutRedirectUri = "https://localhost:8000/logout";

            pca.logoutPopup({
                postLogoutRedirectUri
            }).catch(() => {});
        });

        it("includes postLogoutRedirectUri if one is configured", (done) => {
            const postLogoutRedirectUri = "https://localhost:8000/logout";
            pca = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                    postLogoutRedirectUri
                },
                system: {
                    asyncPopups: true
                }
            });
            sinon.stub(PopupUtils, "openSizedPopup").callsFake((urlNavigate) => {
                expect(urlNavigate.startsWith(TEST_URIS.TEST_END_SESSION_ENDPOINT)).toBeTruthy();
                expect(urlNavigate).toContain(`post_logout_redirect_uri=${encodeURIComponent(postLogoutRedirectUri)}`);
                done();
                throw "Stop Test";
            });

            pca.logoutPopup().catch(() => {});
        });

        it(
            "includes postLogoutRedirectUri as current page if none is set on request",
            (done) => {
                pca = new PublicClientApplication({
                    auth: {
                        clientId: TEST_CONFIG.MSAL_CLIENT_ID
                    },
                    system: {
                        asyncPopups: true
                    }
                });
                sinon.stub(PopupUtils, "openSizedPopup").callsFake((urlNavigate) => {
                    expect(urlNavigate.startsWith(TEST_URIS.TEST_END_SESSION_ENDPOINT)).toBeTruthy();
                    expect(urlNavigate).toContain(`post_logout_redirect_uri=${encodeURIComponent(window.location.href)}`);
                    done();
                    throw "Stop Test";
                });

                pca.logoutPopup().catch(() => {});
            }
        );

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

            pca.logoutPopup(request);
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
            expect(account).toBeNull;
        });

        it("getAccountByUsername returns null if passed username is null", () => {
            // @ts-ignore
            const account = pca.getAccountByUsername(null);
            expect(account).toBeNull;
        });

        it("getAccountByHomeId returns account specified", () => {
            const account = pca.getAccountByHomeId(TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID);
            expect(account).toEqual(testAccountInfo1);
        });

        it("getAccountByHomeId returns null if passed id doesn't exist", () => {
            const account = pca.getAccountByHomeId("this-id-doesnt-exist");
            expect(account).toBeNull;
        });

        it("getAccountByHomeId returns null if passed id is null", () => {
            // @ts-ignore
            const account = pca.getAccountByHomeId(null);
            expect(account).toBeNull;
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
            expect(pca.getActiveAccount()).toBeNull;
        });

        it(
            "setActiveAccount() sets the active account local id value correctly",
            () => {
                expect((pca as any).activeLocalAccountId).toBeNull;
                pca.setActiveAccount(testAccountInfo1);
                expect((pca as any).activeLocalAccountId).toEqual(testAccountInfo1.localAccountId);
            }
        );

        it(
            "getActiveAccount looks up the current account values and returns them()",
            () => {
                pca.setActiveAccount(testAccountInfo1);
                const activeAccount1 = pca.getActiveAccount();
                expect(activeAccount1).toEqual(testAccountInfo1);
                
                const newName = "Ben Franklin";
                window.sessionStorage.clear();
                testAccountInfo1.name = newName;
                testAccount1.name = newName;
                const cacheKey = AccountEntity.generateAccountCacheKey(testAccountInfo1);
                window.sessionStorage.setItem(cacheKey, JSON.stringify(testAccount1));

                const activeAccount2 = pca.getActiveAccount();
                expect(activeAccount2).toEqual(testAccountInfo1);
            }
        );

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
                expect((pca as any).activeLocalAccountId).toEqual(testAccountInfo1.localAccountId);
                await pca.logoutRedirect();
                expect(pca.getActiveAccount()).toBeNull;
            });
    
            it(
                "Clears active account on logoutRedirect when the given account info matches",
                async () => {
                    expect((pca as any).activeLocalAccountId).toEqual(testAccountInfo1.localAccountId);
                    await pca.logoutRedirect({
                        account: testAccountInfo1
                    });
                    expect(pca.getActiveAccount()).toBeNull;
                }
            );

            it(
                "Does not clear active account on logoutRedirect if given account object does not match",
                async () => {
                    expect((pca as any).activeLocalAccountId).toEqual(testAccountInfo1.localAccountId);
                    await pca.logoutRedirect({
                        account: testAccountInfo2
                    });
                    expect(pca.getActiveAccount()).toEqual(testAccountInfo1);
                }
            );

            it("Clears active account on logoutPopup with no account", async () => {
                expect((pca as any).activeLocalAccountId).toEqual(testAccountInfo1.localAccountId);
                await pca.logoutPopup();
                expect(pca.getActiveAccount()).toBeNull;
            });
    
            it(
                "Clears active account on logoutPopup when the given account info matches",
                async () => {
                    expect((pca as any).activeLocalAccountId).toEqual(testAccountInfo1.localAccountId);
                    await pca.logoutPopup({
                        account: testAccountInfo1
                    });
                    expect(pca.getActiveAccount()).toBeNull;
                }
            );

            it(
                "Does not clear active account on logoutPopup if given account object does not match",
                async () => {
                    expect((pca as any).activeLocalAccountId).toEqual(testAccountInfo1.localAccountId);
                    await pca.logoutPopup({
                        account: testAccountInfo2
                    });
                    expect(pca.getActiveAccount()).toEqual(testAccountInfo1);
                }
            );
        });
    });

    describe("Event API tests", () => {
        it("can add an event callback and broadcast to it", (done) => {
            const subscriber = (message: EventMessage) => {
                expect(message.eventType).toEqual(EventType.LOGIN_START);
                expect(message.interactionType).toEqual(InteractionType.Popup);
                done();
            };

            pca.addEventCallback(subscriber);
            // @ts-ignore
            pca.emitEvent(EventType.LOGIN_START, InteractionType.Popup);
        });

        it("can remove an event callback", (done) => {
            const subscriber = (message: EventMessage) => {
                expect(message.eventType).toEqual(EventType.LOGIN_START);
                expect(message.interactionType).toEqual(InteractionType.Popup);
            };

            const callbackSpy = sinon.spy(subscriber);

            const callbackId = pca.addEventCallback(callbackSpy);
            // @ts-ignore
            pca.emitEvent(EventType.LOGIN_START, InteractionType.Popup);
            pca.removeEventCallback(callbackId || "");
            // @ts-ignore
            pca.emitEvent(EventType.LOGIN_START, InteractionType.Popup);
            expect(callbackSpy.calledOnce).toBeTruthy();
            done();
        });

        it("can add multiple callbacks and broadcast to all", (done) => {
            const subscriber1 = (message: EventMessage) => {
                expect(message.eventType).toEqual(EventType.ACQUIRE_TOKEN_START);
                expect(message.interactionType).toEqual(InteractionType.Redirect);
            };

            const subscriber2 = (message: EventMessage) => {
                expect(message.eventType).toEqual(EventType.ACQUIRE_TOKEN_START);
                expect(message.interactionType).toEqual(InteractionType.Redirect);
                done();
            };

            pca.addEventCallback(subscriber1);
            pca.addEventCallback(subscriber2);
            // @ts-ignore
            pca.emitEvent(EventType.ACQUIRE_TOKEN_START, InteractionType.Redirect);
        });

        it("sets interactionType, payload, and error to null by default", (done) => {
            const subscriber = (message: EventMessage) => {
                expect(message.eventType).toEqual(EventType.LOGIN_START);
                expect(message.interactionType).toBeNull();
                expect(message.payload).toBeNull();
                expect(message.error).toBeNull();
                expect(message.timestamp).not.toBeNull();
                done();
            };

            pca.addEventCallback(subscriber);
            // @ts-ignore
            pca.emitEvent(EventType.LOGIN_START);
        });

        it("sets all expected fields on event", (done) => {
            const subscriber = (message: EventMessage) => {
                expect(message.eventType).toEqual(EventType.LOGIN_START);
                expect(message.interactionType).toEqual(InteractionType.Silent);
                expect(message.payload).toEqual({scopes: ["user.read"]});
                expect(message.error).toBeNull();
                expect(message.timestamp).not.toBeNull();
                done();
            };

            pca.addEventCallback(subscriber);
            // @ts-ignore
            pca.emitEvent(EventType.LOGIN_START, InteractionType.Silent, {scopes: ["user.read"]}, null);
        });
    });

    describe("Logger", () => {
        it("getLogger and setLogger", done => {
            const logger = new Logger({
                loggerCallback: (level, message, containsPii) => {
                    expect(message).toContain("Message");
                    expect(message).toContain(LogLevel.Info);
    
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
            const telemetryManager = pca.initializeServerTelemetryManager(100, "test-correlationId");
            const currentHeader = telemetryManager.generateCurrentRequestHeaderValue();

            expect(currentHeader).toContain("@azure/msal-react,1.0.0");
        });
    });
});
