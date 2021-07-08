/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import sinon from "sinon";
import { PublicClientApplication } from "../../src/app/PublicClientApplication";
import { TEST_CONFIG, TEST_URIS, TEST_HASHES, TEST_TOKENS, TEST_DATA_CLIENT_INFO, TEST_TOKEN_LIFETIMES, RANDOM_TEST_GUID, DEFAULT_OPENID_CONFIG_RESPONSE, testNavUrl, testLogoutUrl, TEST_STATE_VALUES, testNavUrlNoRequest, DEFAULT_TENANT_DISCOVERY_RESPONSE } from "../utils/StringConstants";
import { ServerError, Constants, AccountInfo, TokenClaims, PromptValue, AuthenticationResult, CommonAuthorizationCodeRequest, CommonAuthorizationUrlRequest, AuthToken, PersistentCacheKeys, AuthorizationCodeClient, ResponseMode, AccountEntity, ProtocolUtils, AuthenticationScheme, RefreshTokenClient, Logger, ServerTelemetryEntity, CommonSilentFlowRequest, CommonEndSessionRequest, LogLevel, TimeUtils } from "@azure/msal-common";
import { BrowserUtils } from "../../src/utils/BrowserUtils";
import { BrowserConstants, TemporaryCacheKeys, ApiId, InteractionType, BrowserCacheLocation } from "../../src/utils/BrowserConstants";
import { Base64Encode } from "../../src/encode/Base64Encode";
import { XhrClient } from "../../src/network/XhrClient";
import { BrowserAuthError } from "../../src/error/BrowserAuthError";
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
import { ClientApplication } from "../../src/app/ClientApplication";
import { ExperimentalPublicClientApplication } from "../../src/app/ExperimentalPublicClientApplication";
import { BrokerClientApplication } from "../../src/broker/client/BrokerClientApplication";
import { EmbeddedClientApplication } from "../../src/broker/client/EmbeddedClientApplication";

describe("ExperimentalClientApplication.ts Class Unit Tests", () => {
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

    let epca: ExperimentalPublicClientApplication;
    beforeEach(() => {
        sinon.stub(DatabaseStorage.prototype, "open").callsFake(async (): Promise<void> => {
            dbStorage = {};
        });
        epca = new ExperimentalPublicClientApplication({
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID
            }
        }, {});
    });

    afterEach(() => {
        sinon.restore();
        window.location.hash = "";
        window.sessionStorage.clear();
        window.localStorage.clear();
    });

    describe("Constructor tests", () => {

        it("passes null check", (done) => {
            expect(epca).not.toBeNull();
            expect(epca instanceof ClientApplication).toBeTruthy();
            expect(epca instanceof PublicClientApplication).toBeTruthy();
            expect(epca instanceof ExperimentalPublicClientApplication).toBeTruthy();
            done();
        });

        it("handleRedirectPromise returns null if interaction is not in progress", async () => {
            sinon.stub(epca!, <any>"interactionInProgress").returns(false);
            window.location.hash = TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT;
            window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.ORIGIN_URI}`, TEST_URIS.TEST_ALTERNATE_REDIR_URI);
            expect(await epca?.handleRedirectPromise()).toBeNull();
        });

        it("navigates and caches hash if navigateToLoginRequestUri is true and interaction type is redirect", async () => {
            sinon.stub(epca!, <any>"interactionInProgress").returns(true);
            window.location.hash = TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT;
            window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.ORIGIN_URI}`, TEST_URIS.TEST_ALTERNATE_REDIR_URI);
            sinon.stub(NavigationClient.prototype, "navigateInternal").callsFake((urlNavigate: string, options: NavigationOptions): Promise<boolean> => {
                expect(options.noHistory).toBeTruthy();
                expect(options.timeout).toBeGreaterThan(0);
                expect(options.apiId).not.toBeUndefined();
                expect(urlNavigate).toEqual(TEST_URIS.TEST_ALTERNATE_REDIR_URI);
                return Promise.resolve(true);
            });
            await epca?.handleRedirectPromise();
            expect(window.sessionStorage.getItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.URL_HASH}`)).toEqual(TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT);
        });

        it("navigates to root and caches hash if navigateToLoginRequestUri is true", async () => {
            sinon.stub(epca!, <any>"interactionInProgress").returns(true);
            window.location.hash = TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT;
            sinon.stub(NavigationClient.prototype, "navigateInternal").callsFake((urlNavigate: string, options: NavigationOptions): Promise<boolean> => {
                expect(options.noHistory).toBeTruthy();
                expect(options.timeout).toBeGreaterThan(0);
                expect(options.apiId).not.toBeUndefined();
                expect(urlNavigate).toEqual("https://localhost:8081/");
                expect(window.sessionStorage.getItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.ORIGIN_URI}`)).toEqual("https://localhost:8081/");
                return Promise.resolve(true);
            });
            await epca?.handleRedirectPromise();
            expect(window.sessionStorage.getItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.URL_HASH}`)).toEqual(TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT);
        });

        it("navigates to root and caches hash if navigateToLoginRequestUri is true and loginRequestUrl is 'null'", async () => {
            sinon.stub(epca!, <any>"interactionInProgress").returns(true);
            window.location.hash = TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT;
            window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.ORIGIN_URI}`, "null");
            sinon.stub(NavigationClient.prototype, "navigateInternal").callsFake((urlNavigate: string, options: NavigationOptions): Promise<boolean> => {
                expect(options.noHistory).toBeTruthy();
                expect(options.timeout).toBeGreaterThan(0);
                expect(options.apiId).not.toBeUndefined();
                expect(urlNavigate).toEqual("https://localhost:8081/");
                expect(window.sessionStorage.getItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.ORIGIN_URI}`)).toEqual("https://localhost:8081/");
                return Promise.resolve(true);
            });
            epca?.handleRedirectPromise();
            expect(window.sessionStorage.getItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.URL_HASH}`)).toEqual(TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT);
        });

        it("navigates and caches hash if navigateToLoginRequestUri is true and loginRequestUrl contains query string", async () => {
            sinon.stub(epca!, <any>"interactionInProgress").returns(true);
            const loginRequestUrl = window.location.href + "?testQueryString=1";
            window.location.hash = TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT;
            window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.ORIGIN_URI}`, loginRequestUrl);
            sinon.stub(NavigationClient.prototype, "navigateInternal").callsFake((urlNavigate: string, options: NavigationOptions): Promise<boolean> => {
                expect(options.noHistory).toBeTruthy();
                expect(options.timeout).toBeGreaterThan(0);
                expect(options.apiId).not.toBeUndefined();
                expect(urlNavigate).toEqual(loginRequestUrl);
                return Promise.resolve(true);
            });
            await epca?.handleRedirectPromise();
            expect(window.sessionStorage.getItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.URL_HASH}`)).toEqual(TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT);
        });

        it("navigates and caches hash if navigateToLoginRequestUri is true and loginRequestUrl contains query string and hash", async () => {
            sinon.stub(epca!, <any>"interactionInProgress").returns(true);
            const loginRequestUrl = window.location.href + "?testQueryString=1#testHash";
            window.location.hash = TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT;
            window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.ORIGIN_URI}`, loginRequestUrl);
            sinon.stub(NavigationClient.prototype, "navigateInternal").callsFake((urlNavigate: string, options: NavigationOptions): Promise<boolean> => {
                expect(options.noHistory).toBeTruthy();
                expect(options.timeout).toBeGreaterThan(0);
                expect(options.apiId).not.toBeUndefined();
                expect(urlNavigate).toEqual(loginRequestUrl);
                expect(window.sessionStorage.getItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.ORIGIN_URI}`)).toEqual(loginRequestUrl);
                return Promise.resolve(true);
            });
            await epca?.handleRedirectPromise();
            expect(window.sessionStorage.getItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.URL_HASH}`)).toEqual(TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT);
        });

        it("replaces custom hash if navigateToLoginRequestUri is true and loginRequestUrl contains custom hash", () => {
            sinon.stub(epca!, <any>"interactionInProgress").returns(true);
            const loginRequestUrl = window.location.href + "#testHash";
            window.location.hash = TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT;
            window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.ORIGIN_URI}`, loginRequestUrl);
            sinon.stub(ClientApplication.prototype, <any>"handleHash").callsFake((responseHash) => {
                expect(responseHash).toEqual(TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT);
            });
            return epca?.handleRedirectPromise().then(() => {
                expect(window.location.href).toEqual(loginRequestUrl);
            });
        });

        it("replaces custom hash if navigateToLoginRequestUri is true and loginRequestUrl contains custom hash (passed in)", () => {
            sinon.stub(epca!, <any>"interactionInProgress").returns(true);
            const loginRequestUrl = window.location.href + "#testHash";
            window.location.hash = TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT;
            window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.ORIGIN_URI}`, loginRequestUrl);
            sinon.stub(ClientApplication.prototype, <any>"handleHash").callsFake((responseHash) => {
                expect(responseHash).toEqual(TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT);
            });
            return epca?.handleRedirectPromise(TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT)
                .then(() => {
                    expect(window.location.href).toEqual(loginRequestUrl);
                });
        });

        it("processes hash if navigateToLoginRequestUri is true and loginRequestUrl contains trailing slash", (done) => {
            sinon.stub(epca!, <any>"interactionInProgress").returns(true);
            const loginRequestUrl = window.location.href.endsWith("/") ? window.location.href.slice(0, -1) : window.location.href + "/";
            window.location.hash = TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT;
            window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.ORIGIN_URI}`, loginRequestUrl);
            sinon.stub(ClientApplication.prototype, <any>"handleHash").callsFake((responseHash) => {
                expect(responseHash).toEqual(TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT);
                done();
            });
            epca?.handleRedirectPromise();
        });

        it("clears hash if navigateToLoginRequestUri is false and loginRequestUrl contains custom hash", (done) => {
            epca = new ExperimentalPublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                    navigateToLoginRequestUrl: false
                }
            }, {});
            sinon.stub(epca!, <any>"interactionInProgress").returns(true);
            const loginRequestUrl = window.location.href + "#testHash";
            window.location.hash = TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT;
            window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.ORIGIN_URI}`, loginRequestUrl);
            sinon.stub(ClientApplication.prototype, <any>"handleHash").callsFake((responseHash) => {
                expect(window.location.href).not.toContain("#testHash");
                expect(responseHash).toEqual(TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT);
                done();
            });
            epca?.handleRedirectPromise();
        });

        it("Uses the broker's version of handleRedirectPromise", async () => {
            const brokerInstance = new ExperimentalPublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID
                }
            }, {
                brokerOptions: {
                    preferredInteractionType: InteractionType.Redirect,
                    actAsBroker: true
                }
            });
            const listenMsgSpy = sinon.stub(BrokerClientApplication.prototype, "listenForBrokerMessage").callsFake(() => {
                return;
            });
            await brokerInstance.initializeBrokering();
            expect(listenMsgSpy.calledOnce).toBeTruthy();

            const handleRedirectSpy = sinon.stub(BrokerClientApplication.prototype, "handleRedirectPromise").callsFake(async (hash) => {
                expect(hash).toStrictEqual(TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT);
                return null;
            });

            const response = await brokerInstance.handleRedirectPromise(TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT);
            expect(handleRedirectSpy.calledOnce).toBeTruthy();
            expect(response).toBeNull();
        });

        it("Uses the embedded app's version of handleRedirectPromise", async () => {
            const embeddedAppInstance = new ExperimentalPublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID
                }
            }, {
                brokerOptions: {
                    preferredInteractionType: InteractionType.Redirect,
                    allowBrokering: true,
                    trustedBrokerDomains: ["https://localhost:30662"]
                }
            });
            const sendHandshakeSpy = sinon.stub(EmbeddedClientApplication.prototype, <any>"sendHandshakeRequest").callsFake(async () => {
                return {
                    brokerOrigin: "http://localhost:30662"
                };
            });
            await embeddedAppInstance.initializeBrokering();
            expect(sendHandshakeSpy.calledOnce).toBeTruthy();

            const handleRedirectSpy = sinon.stub(EmbeddedClientApplication.prototype, "sendHandleRedirectRequest").callsFake(async () => {
                return null;
            });

            const response = await embeddedAppInstance.handleRedirectPromise();
            expect(handleRedirectSpy.calledOnce).toBeTruthy();
            expect(response).toBeNull();
        });
    });

    describe("initializeBrokering()", () => {
        let brokerInstance: ExperimentalPublicClientApplication;
        let embeddedAppInstance: ExperimentalPublicClientApplication;
        beforeEach(() => {
            brokerInstance = new ExperimentalPublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID
                }
            }, {
                brokerOptions: {
                    preferredInteractionType: InteractionType.Redirect,
                    actAsBroker: true
                }
            });
            embeddedAppInstance = new ExperimentalPublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID
                }
            }, {
                brokerOptions: {
                    preferredInteractionType: InteractionType.Redirect,
                    allowBrokering: true,
                    trustedBrokerDomains: ["https://localhost:30662"]
                }
            });
        });

        it("broker does not call initiateHandshake", async () => {
            const initHandshakeSpy = sinon.spy(EmbeddedClientApplication.prototype, "initiateHandshake");
            const listenMsgSpy = sinon.stub(BrokerClientApplication.prototype, "listenForBrokerMessage").callsFake(() => {
                return;
            });
            await brokerInstance.initializeBrokering();
            expect(initHandshakeSpy.called).toBeFalsy();
            expect(listenMsgSpy.calledOnce).toBeTruthy();
        });

        it("embedded app does not call listenForBrokerMessage", async () => {
            const initHandshakeSpy = sinon.stub(EmbeddedClientApplication.prototype, "initiateHandshake").callsFake(async () => {
                return;
            });
            const listenMsgSpy = sinon.spy(BrokerClientApplication.prototype, "listenForBrokerMessage");
            await embeddedAppInstance.initializeBrokering();
            expect(initHandshakeSpy.called).toBeTruthy();
            expect(listenMsgSpy.calledOnce).toBeFalsy();
        });

        it("only initializes broker when both broker and embedded app are configured", async () => {
            const instance = new ExperimentalPublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID
                }
            }, {
                brokerOptions: {
                    preferredInteractionType: InteractionType.Redirect,
                    allowBrokering: true,
                    actAsBroker: true
                }
            });
            const initHandshakeSpy = sinon.spy(EmbeddedClientApplication.prototype, "initiateHandshake");
            const listenMsgSpy = sinon.spy(BrokerClientApplication.prototype, "listenForBrokerMessage");
            await instance.initializeBrokering();
            expect(initHandshakeSpy.called).toBeFalsy();
            expect(listenMsgSpy.calledOnce).toBeTruthy();
        });

        it("does not initialize broker listener if broker is rendered in iframe", async () => {
            sinon.stub(BrowserUtils, "isInIframe").returns(true);
            const listenMsgSpy = sinon.spy(BrokerClientApplication.prototype, "listenForBrokerMessage");
            await brokerInstance.initializeBrokering();
            expect(listenMsgSpy.calledOnce).toBeFalsy();
        });

        it("does not create experimental object if experimental APIs are not configured", () => {
            const instance = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID
                }
            });
            expect(instance).toBeUndefined();
        });
    });

    describe("Redirect Flow Unit tests", () => {

        describe("handleRedirectPromise()", () => {
            it("does nothing if no hash is detected", (done) => {
                epca?.handleRedirectPromise().then(() => {
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
                epca = new ExperimentalPublicClientApplication({
                    auth: {
                        clientId: TEST_CONFIG.MSAL_CLIENT_ID
                    }
                }, {});

                const tokenResponse = await epca?.handleRedirectPromise();
                expect(tokenResponse?.uniqueId).toEqual(testTokenResponse.uniqueId);
                expect(tokenResponse?.tenantId).toEqual(testTokenResponse.tenantId);
                expect(tokenResponse?.scopes).toStrictEqual(testTokenResponse.scopes);
                expect(tokenResponse?.idToken).toEqual(testTokenResponse.idToken);
                expect(tokenResponse?.idTokenClaims).toEqual(expect.objectContaining(testTokenResponse.idTokenClaims));
                expect(tokenResponse?.accessToken).toEqual(testTokenResponse.accessToken);
                expect(tokenResponse?.expiresOn && tokenResponse?.expiresOn?.getMilliseconds() >= tokenResponse.expiresOn.getMilliseconds()).toBeTruthy();
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

                epca = new ExperimentalPublicClientApplication({
                    auth: {
                        clientId: TEST_CONFIG.MSAL_CLIENT_ID
                    }
                }, {});

                epca?.handleRedirectPromise().catch((err) => {
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
                epca = new ExperimentalPublicClientApplication({
                    auth: {
                        clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                        navigateToLoginRequestUrl: false
                    }
                }, {});

                const tokenResponse = await epca?.handleRedirectPromise();
                expect(tokenResponse?.uniqueId).toEqual(testTokenResponse.uniqueId);
                expect(tokenResponse?.tenantId).toEqual(testTokenResponse.tenantId);
                expect(tokenResponse?.scopes).toStrictEqual(testTokenResponse.scopes);
                expect(tokenResponse?.idToken).toEqual(testTokenResponse.idToken);
                expect(tokenResponse?.idTokenClaims).toEqual(expect.objectContaining(testTokenResponse.idTokenClaims));
                expect(tokenResponse?.accessToken).toEqual(testTokenResponse.accessToken);
                expect(tokenResponse?.expiresOn && tokenResponse.expiresOn.getMilliseconds() >= tokenResponse.expiresOn.getMilliseconds()).toBeTruthy();
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
                epca = new ExperimentalPublicClientApplication({
                    auth: {
                        clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                        navigateToLoginRequestUrl: false
                    }
                }, {});
                let callbackCalled = false;
                const navigationClient = new NavigationClient();
                navigationClient.navigateInternal = async (url: string, options: NavigationOptions): Promise<boolean> => {
                        callbackCalled = true;
                        expect(url).toEqual(TEST_URIS.TEST_ALTERNATE_REDIR_URI);
                        expect(options.noHistory).toBeTruthy();
                        expect(options.apiId).toEqual(ApiId.handleRedirectPromise);
                        return false;
                };
                epca.setNavigationClient(navigationClient);

                const tokenResponse = await epca.handleRedirectPromise();
                if (!tokenResponse) {
                    expect(tokenResponse).not.toBeNull();
                    throw new Error("Token Response is null!"); // Throw to resolve Typescript complaints below
                }
                expect(tokenResponse?.uniqueId).toEqual(testTokenResponse.uniqueId);
                expect(tokenResponse?.tenantId).toEqual(testTokenResponse.tenantId);
                expect(tokenResponse?.scopes).toStrictEqual(testTokenResponse.scopes);
                expect(tokenResponse?.idToken).toEqual(testTokenResponse.idToken);
                expect(tokenResponse?.idTokenClaims).toEqual(expect.objectContaining(testTokenResponse.idTokenClaims));
                expect(tokenResponse?.accessToken).toEqual(testTokenResponse.accessToken);
                expect(tokenResponse?.expiresOn && tokenResponse.expiresOn.getMilliseconds() >= tokenResponse.expiresOn.getMilliseconds()).toBeTruthy();
                expect(window.sessionStorage.length).toEqual(4);
                expect(window.location.hash).toBe("");
            });
        });

        describe("loginRedirect", () => {

            it("loginRedirect throws an error if interaction is currently in progress", async () => {
                window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.INTERACTION_STATUS_KEY}`, BrowserConstants.INTERACTION_IN_PROGRESS_VALUE);
                // @ts-ignore
                await expect(epca.loginRedirect(null)).rejects.toMatchObject(BrowserAuthError.createInteractionInProgressError());
            });

            it("Uses default request if no request provided", (done) => {
                sinon.stub(epca!, "acquireTokenRedirect").callsFake(async (request): Promise<void> => {
                    expect(request.scopes).toContain("openid");
                    expect(request.scopes).toContain("profile");
                    done();
                });

                epca?.loginRedirect();
            });

            it("loginRedirect navigates to created login url", (done) => {
                sinon.stub(RedirectHandler.prototype, "initiateAuthRequest").callsFake((navigateUrl): Promise<void> => {
                    expect(navigateUrl).toEqual(testNavUrl);
                    return Promise.resolve(done());
                });
                sinon.stub(CryptoOps.prototype, "generatePkceCodes").resolves({
                    challenge: TEST_CONFIG.TEST_CHALLENGE,
                    verifier: TEST_CONFIG.TEST_VERIFIER
                });
                sinon.stub(CryptoOps.prototype, "createNewGuid").returns(RANDOM_TEST_GUID);
                sinon.stub(TimeUtils, "nowSeconds").returns(TEST_STATE_VALUES.TEST_TIMESTAMP);
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

                epca?.loginRedirect(loginRequest);
            });

            it("loginRedirect navigates to created login url, with empty request", (done) => {
                sinon.stub(RedirectHandler.prototype, "initiateAuthRequest").callsFake((navigateUrl): Promise<void> => {
                    expect(navigateUrl.startsWith(testNavUrlNoRequest)).toBeTruthy();
                    return Promise.resolve(done());
                });
                sinon.stub(CryptoOps.prototype, "generatePkceCodes").resolves({
                    challenge: TEST_CONFIG.TEST_CHALLENGE,
                    verifier: TEST_CONFIG.TEST_VERIFIER
                });
                sinon.stub(CryptoOps.prototype, "createNewGuid").returns(RANDOM_TEST_GUID);
                sinon.stub(TimeUtils, "nowSeconds").returns(TEST_STATE_VALUES.TEST_TIMESTAMP);

                epca?.loginRedirect();
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

                sinon.stub(CryptoOps.prototype, "createNewGuid").returns(RANDOM_TEST_GUID);
                sinon.stub(TimeUtils, "nowSeconds").returns(TEST_STATE_VALUES.TEST_TIMESTAMP);
                sinon.stub(NavigationClient.prototype, "navigateExternal").callsFake((urlNavigate: string, options: NavigationOptions): Promise<boolean> => {
                    expect(options.noHistory).toBeFalsy();
                    expect(options.timeout).toBeGreaterThan(0);
                    expect(options.apiId).not.toBeUndefined();
                    expect(urlNavigate).not.toBe("");
                    return Promise.resolve(true);
                });
                const testLogger = new Logger(loggerOptions);

                const browserCrypto = new CryptoOps();
                const browserStorage = new BrowserCacheManager(TEST_CONFIG.MSAL_CLIENT_ID, cacheConfig, browserCrypto, testLogger);
                await epca?.loginRedirect(emptyRequest);
                expect(browserStorage.getTemporaryCache(browserStorage.generateStateKey(TEST_STATE_VALUES.TEST_STATE_REDIRECT))).toStrictEqual(TEST_STATE_VALUES.TEST_STATE_REDIRECT);
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
                sinon.stub(TimeUtils, "nowSeconds").returns(TEST_STATE_VALUES.TEST_TIMESTAMP);
                sinon.stub(NavigationClient.prototype, "navigateExternal").callsFake((urlNavigate: string, options: NavigationOptions): Promise<boolean> => {
                    expect(options.noHistory).toBeFalsy();
                    expect(options.timeout).toBeGreaterThan(0);
                    expect(options.apiId).not.toBeUndefined();
                    expect(urlNavigate).not.toBe("");
                    return Promise.resolve(true);
                });

                const browserCrypto = new CryptoOps();
                const testLogger = new Logger(loggerOptions);
                const browserStorage = new BrowserCacheManager(TEST_CONFIG.MSAL_CLIENT_ID, cacheConfig, browserCrypto, testLogger);
                await epca?.loginRedirect(tokenRequest);
                const cachedRequest: CommonAuthorizationCodeRequest = JSON.parse(browserCrypto.base64Decode(browserStorage.getTemporaryCache(TemporaryCacheKeys.REQUEST_PARAMS, true)!));
                expect(cachedRequest.scopes).toStrictEqual([]);
                expect(cachedRequest.codeVerifier).toStrictEqual(TEST_CONFIG.TEST_VERIFIER);
                expect(cachedRequest.authority).toStrictEqual(`${Constants.DEFAULT_AUTHORITY}`);
                expect(cachedRequest.correlationId).toStrictEqual(RANDOM_TEST_GUID);
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
                    await epca?.loginRedirect(emptyRequest);
                } catch (e) {
                    // Test that error was cached for telemetry purposes and then thrown
                    expect(window.sessionStorage).toHaveLength(1);
                    const failures = window.sessionStorage.getItem(`server-telemetry-${TEST_CONFIG.MSAL_CLIENT_ID}`) || "";
                    const failureObj = JSON.parse(failures) as ServerTelemetryEntity;
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
                sinon.stub(TimeUtils, "nowSeconds").returns(TEST_STATE_VALUES.TEST_TIMESTAMP);
                sinon.stub(NavigationClient.prototype, "navigateExternal").callsFake((urlNavigate: string, options: NavigationOptions): Promise<boolean> => {
                    expect(options.noHistory).toBeFalsy();
                    expect(options.timeout).toBeGreaterThan(0);
                    expect(options.apiId).not.toBeUndefined();
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
                await epca?.loginRedirect(emptyRequest);
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
                sinon.stub(TimeUtils, "nowSeconds").returns(TEST_STATE_VALUES.TEST_TIMESTAMP);
                sinon.stub(NavigationClient.prototype, "navigateExternal").callsFake((urlNavigate: string, options: NavigationOptions): Promise<boolean> => {
                    expect(options.noHistory).toBeFalsy();
                    expect(options.timeout).toBeGreaterThan(0);
                    expect(options.apiId).not.toBeUndefined();
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
                await epca?.loginRedirect(loginRequest);
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
        });

        describe("acquireTokenRedirect", () => {

            it("throws an error if interaction is currently in progress", async () => {
                window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.INTERACTION_STATUS_KEY}`, BrowserConstants.INTERACTION_IN_PROGRESS_VALUE);
                // @ts-ignore
                await expect(epca.acquireTokenRedirect(null)).rejects.toMatchObject(BrowserAuthError.createInteractionInProgressError());
            });

            it("throws an error if inside an iframe", async () => {
                sinon.stub(BrowserUtils, "isInIframe").returns(true);
                await expect(epca?.acquireTokenRedirect({ scopes: [] })).rejects.toMatchObject(BrowserAuthError.createRedirectInIframeError(true));
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
                sinon.stub(TimeUtils, "nowSeconds").returns(TEST_STATE_VALUES.TEST_TIMESTAMP);
                const loginRequest: RedirectRequest = {
                    redirectUri: TEST_URIS.TEST_REDIR_URI,
                    scopes: ["user.read", "openid", "profile"],
                    state: TEST_STATE_VALUES.USER_STATE,
                    authority: TEST_CONFIG.validAuthority,
                    correlationId: TEST_CONFIG.CORRELATION_ID,
                    nonce: "",
                    authenticationScheme: TEST_CONFIG.TOKEN_TYPE_BEARER as AuthenticationScheme
                };
                epca?.acquireTokenRedirect(loginRequest);
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
                epca?.acquireTokenRedirect(loginRequest);
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
                sinon.stub(TimeUtils, "nowSeconds").returns(TEST_STATE_VALUES.TEST_TIMESTAMP);
                sinon.stub(NavigationClient.prototype, "navigateExternal").callsFake((urlNavigate: string, options: NavigationOptions): Promise<boolean> => {
                    expect(options.noHistory).toBeFalsy();
                    expect(options.timeout).toBeGreaterThan(0);
                    expect(options.apiId).not.toBeUndefined();
                    expect(urlNavigate).not.toBe("");
                    return Promise.resolve(true);
                });
                const browserCrypto = new CryptoOps();
                const testLogger = new Logger(loggerOptions);
                const browserStorage = new BrowserCacheManager(TEST_CONFIG.MSAL_CLIENT_ID, cacheConfig, browserCrypto, testLogger);
                await epca?.loginRedirect(emptyRequest);
                expect(browserStorage.getTemporaryCache(browserStorage.generateStateKey(TEST_STATE_VALUES.TEST_STATE_REDIRECT))).toStrictEqual(TEST_STATE_VALUES.TEST_STATE_REDIRECT);
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
                    expect(options.timeout).toBeGreaterThan(0);
                    expect(options.apiId).not.toBeUndefined();
                    expect(urlNavigate).not.toBe("");
                    return Promise.resolve(true);
                });
                const browserCrypto = new CryptoOps();
                const testLogger = new Logger(loggerOptions);
                const browserStorage = new BrowserCacheManager(TEST_CONFIG.MSAL_CLIENT_ID, cacheConfig, browserCrypto, testLogger);
                await epca?.acquireTokenRedirect(tokenRequest);
                const cachedRequest: CommonAuthorizationCodeRequest = JSON.parse(browserCrypto.base64Decode(browserStorage.getTemporaryCache(TemporaryCacheKeys.REQUEST_PARAMS, true)!));
                expect(cachedRequest.scopes).toStrictEqual([testScope]);
                expect(cachedRequest.codeVerifier).toStrictEqual(TEST_CONFIG.TEST_VERIFIER);
                expect(cachedRequest.authority).toStrictEqual(`${Constants.DEFAULT_AUTHORITY}`);
                expect(cachedRequest.correlationId).toStrictEqual(RANDOM_TEST_GUID);
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
                    await epca?.acquireTokenRedirect(emptyRequest);
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
                sinon.stub(TimeUtils, "nowSeconds").returns(TEST_STATE_VALUES.TEST_TIMESTAMP);
                sinon.stub(NavigationClient.prototype, "navigateExternal").callsFake((urlNavigate: string, options: NavigationOptions): Promise<boolean> => {
                    expect(options.noHistory).toBeFalsy();
                    expect(options.timeout).toBeGreaterThan(0);
                    expect(options.apiId).not.toBeUndefined();
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
                await epca?.acquireTokenRedirect(emptyRequest);
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
                sinon.stub(TimeUtils, "nowSeconds").returns(TEST_STATE_VALUES.TEST_TIMESTAMP);
                sinon.stub(NavigationClient.prototype, "navigateExternal").callsFake((urlNavigate: string, options: NavigationOptions): Promise<boolean> => {
                    expect(options.noHistory).toBeFalsy();
                    expect(options.timeout).toBeGreaterThan(0);
                    expect(options.apiId).not.toBeUndefined();
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
                await epca?.acquireTokenRedirect(loginRequest);
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
                await expect(epca.loginPopup(null)).rejects.toMatchObject(BrowserAuthError.createInteractionInProgressError());
            });

            it("Uses default request if no request provided", (done) => {
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
                sinon.stub(epca!, "acquireTokenPopup").callsFake(async (request): Promise<AuthenticationResult> => {
                    expect(request.scopes).toContain("openid");
                    expect(request.scopes).toContain("profile");
                    done();
                    return testTokenResponse;
                });

                epca?.loginPopup();
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
                const tokenResp = await epca?.loginPopup();
                expect(tokenResp).toStrictEqual(testTokenResponse);
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
                    await epca?.loginPopup();
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
                await expect(epca?.acquireTokenPopup({
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
                    await epca?.acquireTokenPopup(request);
                } catch(e) {}
                expect(popupSpy.getCall(0).args).toHaveLength(2);
            });

            it("opens popups asynchronously if configured", async () => {
                epca = new ExperimentalPublicClientApplication({
                    auth: {
                        clientId: TEST_CONFIG.MSAL_CLIENT_ID
                    },
                    system: {
                        asyncPopups: true
                    }
                }, {});

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
                    await epca?.acquireTokenPopup(request);
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
                const tokenResp = await epca?.acquireTokenPopup({
                    redirectUri: TEST_URIS.TEST_REDIR_URI,
                    scopes: TEST_CONFIG.DEFAULT_SCOPES
                });
                expect(tokenResp).toStrictEqual(testTokenResponse);
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
                    await epca?.acquireTokenPopup({
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

            it("embedded app sends request to broker", async () => {
                const embeddedApp = new ExperimentalPublicClientApplication({
                    auth: {
                        clientId: TEST_CONFIG.MSAL_CLIENT_ID
                    }
                }, {
                    brokerOptions: {
                        preferredInteractionType: InteractionType.Redirect,
                        allowBrokering: true,
                        trustedBrokerDomains: ["https://localhost:30662"]
                    }
                });
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

                sinon.stub(CryptoOps.prototype, "generatePkceCodes").resolves({
                    challenge: TEST_CONFIG.TEST_CHALLENGE,
                    verifier: TEST_CONFIG.TEST_VERIFIER
                });
                sinon.stub(CryptoOps.prototype, "createNewGuid").returns(RANDOM_TEST_GUID);                
                sinon.stub(EmbeddedClientApplication.prototype, <any>"sendHandshakeRequest").callsFake(async () => {
                    return {
                        brokerOrigin: "http://localhost:30662"
                    };
                });
                await embeddedApp.initializeBrokering();
                const brokeredPopupSpy = sinon.stub(EmbeddedClientApplication.prototype, "sendPopupRequest").callsFake(async (request) => {
                    return testTokenResponse;
                });
                const response = await embeddedApp.acquireTokenPopup({
                    redirectUri: TEST_URIS.TEST_REDIR_URI,
                    scopes: TEST_CONFIG.DEFAULT_SCOPES
                });

                expect(response).toStrictEqual(testTokenResponse);
                expect(brokeredPopupSpy.calledOnce).toBeTruthy();
            });
        });
    });

    describe("ssoSilent() Tests", () => {

        it("throws error if loginHint or sid are empty", async () => {
            await expect(epca?.ssoSilent({
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

            await expect(epca?.ssoSilent(req)).rejects.toMatchObject(BrowserAuthError.createSilentPromptValueError(req.prompt || ""));
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
            const tokenResp = await epca?.ssoSilent({
                redirectUri: TEST_URIS.TEST_REDIR_URI,
                loginHint: "testLoginHint"
            });
            expect(loadFrameSyncSpy.calledOnce).toBeTruthy();
            expect(tokenResp).toStrictEqual(testTokenResponse);
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
            const tokenResp = await epca?.ssoSilent({
                redirectUri: TEST_URIS.TEST_REDIR_URI,
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                sid: TEST_CONFIG.SID
            });
            expect(loadFrameSyncSpy.calledOnce).toBeTruthy();
            expect(tokenResp).toStrictEqual(testTokenResponse);
        });

        it("embedded app sends request to broker", async () => {
            const embeddedApp = new ExperimentalPublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID
                }
            }, {
                brokerOptions: {
                    preferredInteractionType: InteractionType.Redirect,
                    allowBrokering: true,
                    trustedBrokerDomains: ["https://localhost:30662"]
                }
            });
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

            sinon.stub(CryptoOps.prototype, "generatePkceCodes").resolves({
                challenge: TEST_CONFIG.TEST_CHALLENGE,
                verifier: TEST_CONFIG.TEST_VERIFIER
            });
            sinon.stub(CryptoOps.prototype, "createNewGuid").returns(RANDOM_TEST_GUID);                
            sinon.stub(EmbeddedClientApplication.prototype, <any>"sendHandshakeRequest").callsFake(async () => {
                return {
                    brokerOrigin: "http://localhost:30662"
                };
            });
            await embeddedApp.initializeBrokering();
            const brokeredPopupSpy = sinon.stub(EmbeddedClientApplication.prototype, "sendSsoSilentRequest").callsFake(async (request) => {
                return testTokenResponse;
            });
            const response = await embeddedApp.ssoSilent({
                redirectUri: TEST_URIS.TEST_REDIR_URI,
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                sid: TEST_CONFIG.SID
            });

            expect(response).toStrictEqual(testTokenResponse);
            expect(brokeredPopupSpy.calledOnce).toBeTruthy();
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
            const tokenResp = await epca?.acquireTokenSilent(tokenRequest);
            expect(silentATStub.calledWith(expectedTokenRequest)).toBeTruthy();
            expect(tokenResp).toStrictEqual(testTokenResponse);
        });

        it("throws error that RefreshTokenClient.acquireTokenByRefreshToken() throws", async () => {
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
                await epca?.acquireTokenSilent({
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
                expiresOn: new Date(Date.now() + (testServerTokenResponse.expires_in * 1000)),
                account: testAccount,
                tokenType: AuthenticationScheme.BEARER
            };
            const createAcqTokenStub = sinon.stub(AuthorizationCodeClient.prototype, "getAuthCodeUrl").resolves(testNavUrl);
            const silentTokenHelperStub = sinon.stub(epca!, <any>"silentTokenHelper").resolves(testTokenResponse);
            sinon.stub(CryptoOps.prototype, "generatePkceCodes").resolves({
                challenge: TEST_CONFIG.TEST_CHALLENGE,
                verifier: TEST_CONFIG.TEST_VERIFIER
            });
            sinon.stub(CryptoOps.prototype, "createNewGuid").returns(RANDOM_TEST_GUID);
            sinon.stub(ProtocolUtils, "setRequestState").returns(TEST_STATE_VALUES.TEST_STATE_SILENT);
            const silentFlowRequest: SilentRequest = {
                scopes: ["User.Read"],
                account: testAccount,
                extraQueryParameters: {
                    queryKey: "queryValue"
                }, 
                forceRefresh: false
            };
            const expectedRequest: CommonAuthorizationUrlRequest = {
                ...silentFlowRequest,
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
            const tokenResp = await epca?.acquireTokenSilent(silentFlowRequest);

            expect(tokenResp).toStrictEqual(testTokenResponse);
            expect(createAcqTokenStub.calledWith(expectedRequest)).toBeTruthy();
            expect(silentTokenHelperStub.calledWith(testNavUrl)).toBeTruthy();
        });
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
            epca?.logoutRedirect();
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
            epca?.logoutRedirect({
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
            
            const pcaWithPostLogout = new ExperimentalPublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                    postLogoutRedirectUri
                }
            }, {});

            pcaWithPostLogout.logoutRedirect();
        });

        it("doesn't include postLogoutRedirectUri if null is configured", (done) => {
            sinon.stub(NavigationClient.prototype, "navigateExternal").callsFake((urlNavigate: string, options: NavigationOptions): Promise<boolean> => {
                expect(urlNavigate).not.toContain(`post_logout_redirect_uri`);
                done();
                return Promise.resolve(true);
            });
            
            const pcaWithPostLogout = new ExperimentalPublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                    postLogoutRedirectUri: null
                }
            }, {});

            pcaWithPostLogout.logoutRedirect();
        });

        it("doesnt include postLogoutRedirectUri if null is set on request", (done) => {
            sinon.stub(NavigationClient.prototype, "navigateExternal").callsFake((urlNavigate: string, options: NavigationOptions): Promise<boolean> => {
                expect(urlNavigate).not.toContain(`post_logout_redirect_uri`);
                done();
                return Promise.resolve(true);
            });
            epca?.logoutRedirect({
                postLogoutRedirectUri: null
            });
        });

        it("includes postLogoutRedirectUri as current page if none is set on request", (done) => {
            sinon.stub(NavigationClient.prototype, "navigateExternal").callsFake((urlNavigate: string, options: NavigationOptions): Promise<boolean> => {
                expect(urlNavigate).toContain(`post_logout_redirect_uri=${encodeURIComponent("https://localhost:8081/index.html")}`);
                done();
                return Promise.resolve(true);
            });
            epca?.logoutRedirect();
        });

        it("doesnt navigate if onRedirectNavigate returns false", (done) => {
            const logoutUriSpy = sinon.stub(AuthorizationCodeClient.prototype, "getLogoutUri").returns(testLogoutUrl);
            sinon.stub(NavigationClient.prototype, "navigateExternal").callsFake((urlNavigate: string, options: NavigationOptions): Promise<boolean> => {
                // If onRedirectNavigate does not stop navigatation, this will be called, failing the test as done will be invoked twice
                done();
                return Promise.resolve(true);
            });
            epca?.logoutRedirect({
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
            epca?.logoutRedirect({
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
            await expect(epca?.logoutRedirect()).rejects.toMatchObject(BrowserAuthError.createRedirectInIframeError(true));
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

            await expect(epca?.logoutPopup()).rejects.toMatchObject(BrowserAuthError.createInteractionInProgressError());
        });

        it("opens popup window before network request by default", async () => {
            const popupSpy = sinon.stub(PopupUtils, "openSizedPopup");

            try {
                await epca?.logoutPopup();
            } catch(e) {}
            expect(popupSpy.getCall(0).args).toHaveLength(2);
        });

        it("opens popups asynchronously if configured", (done) => {
            epca = new ExperimentalPublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID
                },
                system: {
                    asyncPopups: true
                }
            }, {});
            sinon.stub(PopupUtils, "openSizedPopup").callsFake((urlNavigate, popupName) => {
                expect(urlNavigate.startsWith(TEST_URIS.TEST_END_SESSION_ENDPOINT)).toBeTruthy();
                expect(popupName.startsWith(`msal.${TEST_CONFIG.MSAL_CLIENT_ID}`)).toBeTruthy();
                done();
                return null;
            });

            epca?.logoutPopup().catch(() => {});
        });

        it("catches error and cleans cache before rethrowing", async () => {
            const testError = {
                errorCode: "create_logout_url_error",
                errorMessage: "Error in creating a logout url"
            };
            sinon.stub(AuthorizationCodeClient.prototype, "getLogoutUri").throws(testError);

            try {
                await epca?.logoutPopup();
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
            epca = new ExperimentalPublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID
                },
                system: {
                    asyncPopups: true
                }
            }, {});
            sinon.stub(PopupUtils, "openSizedPopup").callsFake((urlNavigate) => {
                expect(urlNavigate.startsWith(TEST_URIS.TEST_END_SESSION_ENDPOINT)).toBeTruthy();
                expect(urlNavigate).toContain(`post_logout_redirect_uri=${encodeURIComponent(postLogoutRedirectUri)}`);
                done();
                throw "Stop Test";
            });

            const postLogoutRedirectUri = "https://localhost:8000/logout";

            epca?.logoutPopup({
                postLogoutRedirectUri
            }).catch(() => {});
        });

        it("includes postLogoutRedirectUri if one is configured", (done) => {
            const postLogoutRedirectUri = "https://localhost:8000/logout";
            epca = new ExperimentalPublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                    postLogoutRedirectUri
                },
                system: {
                    asyncPopups: true
                }
            }, {});
            sinon.stub(PopupUtils, "openSizedPopup").callsFake((urlNavigate) => {
                expect(urlNavigate.startsWith(TEST_URIS.TEST_END_SESSION_ENDPOINT)).toBeTruthy();
                expect(urlNavigate).toContain(`post_logout_redirect_uri=${encodeURIComponent(postLogoutRedirectUri)}`);
                done();
                throw "Stop Test";
            });

            epca?.logoutPopup().catch(() => {});
        });

        it("includes postLogoutRedirectUri as current page if none is set on request", (done) => {
            epca = new ExperimentalPublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID
                },
                system: {
                    asyncPopups: true
                }
            }, {});
            sinon.stub(PopupUtils, "openSizedPopup").callsFake((urlNavigate) => {
                expect(urlNavigate.startsWith(TEST_URIS.TEST_END_SESSION_ENDPOINT)).toBeTruthy();
                expect(urlNavigate).toContain(`post_logout_redirect_uri=${encodeURIComponent(window.location.href)}`);
                done();
                throw "Stop Test";
            });

            epca?.logoutPopup().catch(() => {});
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

            epca?.logoutPopup(request);
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
            const account = epca?.getAllAccounts();
            expect(account).toHaveLength(2);
        });

        it("getAllAccounts returns empty array if no accounts signed in", () => {
            window.sessionStorage.clear();
            const accounts = epca?.getAllAccounts();
            expect(accounts).toEqual([]);
        });

        it("getAccountByUsername returns account specified", () => {
            const account = epca?.getAccountByUsername("example@microsoft.com");
            expect(account).toEqual(testAccountInfo1);
        });

        it("getAccountByUsername returns account specified with case mismatch", () => {
            const account = epca?.getAccountByUsername("Example@Microsoft.com");
            expect(account).toEqual(testAccountInfo1);

            const account2 = epca?.getAccountByUsername("anotherexample@microsoft.com");
            expect(account2).toEqual(testAccountInfo2);
        });

        it("getAccountByUsername returns null if account doesn't exist", () => {
            const account = epca?.getAccountByUsername("this-email-doesnt-exist@microsoft.com");
            expect(account).toBeNull();
        });

        it("getAccountByHomeId returns account specified", () => {
            const account = epca?.getAccountByHomeId(TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID);
            expect(account).toEqual(testAccountInfo1);
        });

        it("getAccountByHomeId returns null if passed id doesn't exist", () => {
            const account = epca?.getAccountByHomeId("this-id-doesnt-exist");
            expect(account).toBeNull();
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
            expect(epca?.getActiveAccount()).toBeNull();
        });

        it("setActiveAccount() sets the active account local id value correctly", () => {
            expect((epca as any).activeLocalAccountId).toBeNull();
            epca?.setActiveAccount(testAccountInfo1);
            expect((epca as any).activeLocalAccountId).toEqual(testAccountInfo1.localAccountId);
        });

        it("getActiveAccount looks up the current account values and returns them()", () => {
            epca?.setActiveAccount(testAccountInfo1);
            const activeAccount1 = epca?.getActiveAccount();
            expect(activeAccount1).toStrictEqual(testAccountInfo1);

            const newName = "Ben Franklin";
            window.sessionStorage.clear();
            testAccountInfo1.name = newName;
            testAccount1.name = newName;
            const cacheKey = AccountEntity.generateAccountCacheKey(testAccountInfo1);
            window.sessionStorage.setItem(cacheKey, JSON.stringify(testAccount1));

            const activeAccount2 = epca?.getActiveAccount();
            expect(activeAccount2).toStrictEqual(testAccountInfo1);
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
                epca?.setActiveAccount(testAccountInfo1);
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

            it("Clears active account on logout with no account", async () => {
                expect((epca as any).activeLocalAccountId).toEqual(testAccountInfo1.localAccountId);
                await epca?.logout();
                expect(epca?.getActiveAccount()).toBeNull();
            });

            it("Clears active account on logout when the given account info matches", async () => {
                expect((epca as any).activeLocalAccountId).toEqual(testAccountInfo1.localAccountId);
                await epca?.logout({
                    account: testAccountInfo1
                });
                expect(epca?.getActiveAccount()).toBeNull();
            });

            it("Does not clear active account on logout if given account object does not match", async () => {
                expect((epca as any).activeLocalAccountId).toEqual(testAccountInfo1.localAccountId);
                await epca?.logout({
                    account: testAccountInfo2
                });
                expect(epca?.getActiveAccount()).toStrictEqual(testAccountInfo1);
            });
        });
    });

    describe("Event API tests", () => {
        it("can add an event callback and broadcast to it", (done) => {
            const subscriber = (message: EventMessage) => {
                expect(message.eventType).toEqual(EventType.LOGIN_START);
                expect(message.interactionType).toEqual(InteractionType.Popup);
                done();
            };

            epca?.addEventCallback(subscriber);
            // @ts-ignore
            epca.eventHandler.emitEvent(EventType.LOGIN_START, InteractionType.Popup);
        });

        it("can remove an event callback", (done) => {
            const subscriber = (message: EventMessage) => {
                expect(message.eventType).toEqual(EventType.LOGIN_START);
                expect(message.interactionType).toEqual(InteractionType.Popup);
            };

            const callbackSpy = sinon.spy(subscriber);

            const callbackId = epca?.addEventCallback(callbackSpy);
            // @ts-ignore
            epca.eventHandler.emitEvent(EventType.LOGIN_START, InteractionType.Popup);
            epca?.removeEventCallback(callbackId!);
            // @ts-ignore
            epca.eventHandler.emitEvent(EventType.LOGIN_START, InteractionType.Popup);
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

            epca?.addEventCallback(subscriber1);
            epca?.addEventCallback(subscriber2);
            // @ts-ignore
            epca.emitEvent(EventType.ACQUIRE_TOKEN_START, InteractionType.Redirect);
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

            epca?.addEventCallback(subscriber);
            // @ts-ignore
            epca.emitEvent(EventType.LOGIN_START);
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

            epca?.addEventCallback(subscriber);
            // @ts-ignore
            epca.emitEvent(EventType.LOGIN_START, InteractionType.Silent, {scopes: ["user.read"]}, null);
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

            epca?.setLogger(logger);

            expect(epca?.getLogger()).toEqual(logger);

            epca?.getLogger().info("Message");
        });
    });
});
