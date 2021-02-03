/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import "mocha";
import chai, { config } from "chai";
import chaiAsPromised from "chai-as-promised";
import sinon from "sinon";
import { PublicClientApplication } from "../../src/app/PublicClientApplication";
import { TEST_CONFIG, TEST_URIS, TEST_HASHES, TEST_TOKENS, TEST_DATA_CLIENT_INFO, TEST_TOKEN_LIFETIMES, RANDOM_TEST_GUID, DEFAULT_OPENID_CONFIG_RESPONSE, testNavUrl, testLogoutUrl, TEST_STATE_VALUES, testNavUrlNoRequest } from "../utils/StringConstants";
import { ServerError, Constants, AccountInfo, TokenClaims, PromptValue, AuthenticationResult, AuthorizationCodeRequest, AuthorizationUrlRequest, AuthToken, PersistentCacheKeys, TimeUtils, AuthorizationCodeClient, ResponseMode, AccountEntity, ProtocolUtils, AuthenticationScheme, RefreshTokenClient, Logger, ServerTelemetryEntity, SilentFlowRequest, EndSessionRequest as CommonEndSessionRequest, LogLevel } from "@azure/msal-common";
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
import pkg from "../../src/version.json";

chai.use(chaiAsPromised);
const expect = chai.expect;

describe("PublicClientApplication.ts Class Unit Tests", () => {
    const cacheConfig = {
        cacheLocation: BrowserCacheLocation.SessionStorage,
        storeAuthStateInCookie: false
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
            expect(pca).to.be.not.null;
            expect(pca instanceof PublicClientApplication).to.be.true;
            done();
        });

        it("handleRedirectPromise returns null if interaction is not in progress", async () => {
            sinon.stub(pca, <any>"interactionInProgress").returns(false);
            window.location.hash = TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT;
            window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.ORIGIN_URI}`, TEST_URIS.TEST_ALTERNATE_REDIR_URI);
            expect(await pca.handleRedirectPromise()).to.be.null;
        });

        it("navigates and caches hash if navigateToLoginRequestUri is true and interaction type is redirect", (done) => {
            sinon.stub(pca, <any>"interactionInProgress").returns(true);
            window.location.hash = TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT;
            window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.ORIGIN_URI}`, TEST_URIS.TEST_ALTERNATE_REDIR_URI);
            sinon.stub(BrowserUtils, "navigateWindow").callsFake((urlNavigate: string, timeout: number, logger: Logger, noHistory?: boolean) => {
                expect(noHistory).to.be.true;
                expect(timeout).to.be.greaterThan(0);
                expect(logger).to.be.instanceOf(Logger);
                expect(urlNavigate).to.be.eq(TEST_URIS.TEST_ALTERNATE_REDIR_URI);
                return Promise.resolve(done());
            });
            pca.handleRedirectPromise();
            expect(window.sessionStorage.getItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.URL_HASH}`)).to.be.eq(null);
        });

        it("navigates to root and caches hash if navigateToLoginRequestUri is true", (done) => {
            sinon.stub(pca, <any>"interactionInProgress").returns(true);
            window.location.hash = TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT;
            sinon.stub(BrowserUtils, "navigateWindow").callsFake((urlNavigate: string, timeout: number, logger: Logger, noHistory?: boolean) => {
                expect(noHistory).to.be.true;
                expect(timeout).to.be.greaterThan(0);
                expect(logger).to.be.instanceOf(Logger);
                expect(urlNavigate).to.be.eq("https://localhost:8081/");
                expect(window.sessionStorage.getItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.ORIGIN_URI}`)).to.be.eq("https://localhost:8081/");
                return Promise.resolve(done());
            });
            pca.handleRedirectPromise();
            expect(window.sessionStorage.getItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.URL_HASH}`)).to.be.eq(null);
        });

        it("navigates to root and caches hash if navigateToLoginRequestUri is true and loginRequestUrl is 'null'", (done) => {
            sinon.stub(pca, <any>"interactionInProgress").returns(true);
            window.location.hash = TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT;
            window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.ORIGIN_URI}`, "null");
            sinon.stub(BrowserUtils, "navigateWindow").callsFake((urlNavigate: string, timeout: number, logger: Logger, noHistory?: boolean) => {
                expect(noHistory).to.be.true;
                expect(timeout).to.be.greaterThan(0);
                expect(logger).to.be.instanceOf(Logger);
                expect(urlNavigate).to.be.eq("https://localhost:8081/");
                expect(window.sessionStorage.getItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.ORIGIN_URI}`)).to.be.eq("https://localhost:8081/");
                return Promise.resolve(done());
            });
            pca.handleRedirectPromise();
            expect(window.sessionStorage.getItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.URL_HASH}`)).to.be.eq(null);
        });

        it("navigates and caches hash if navigateToLoginRequestUri is true and loginRequestUrl contains query string", (done) => {
            sinon.stub(pca, <any>"interactionInProgress").returns(true);
            const loginRequestUrl = window.location.href + "?testQueryString=1";
            window.location.hash = TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT;
            window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.ORIGIN_URI}`, loginRequestUrl);
            sinon.stub(BrowserUtils, "navigateWindow").callsFake((urlNavigate: string, timeout: number, logger: Logger, noHistory?: boolean) => {
                expect(noHistory).to.be.true;
                expect(timeout).to.be.greaterThan(0);
                expect(logger).to.be.instanceOf(Logger);
                expect(urlNavigate).to.be.eq(loginRequestUrl);
                return Promise.resolve(done());
            });
            pca.handleRedirectPromise();
            expect(window.sessionStorage.getItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.URL_HASH}`)).to.be.eq(null);
        });

        it("navigates and caches hash if navigateToLoginRequestUri is true and loginRequestUrl contains query string and hash", (done) => {
            sinon.stub(pca, <any>"interactionInProgress").returns(true);
            const loginRequestUrl = window.location.href + "?testQueryString=1#testHash";
            window.location.hash = TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT;
            window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.ORIGIN_URI}`, loginRequestUrl);
            sinon.stub(BrowserUtils, "navigateWindow").callsFake((urlNavigate: string, timeout: number, logger: Logger, noHistory?: boolean) => {
                expect(noHistory).to.be.true;
                expect(timeout).to.be.greaterThan(0);
                expect(logger).to.be.instanceOf(Logger);
                expect(urlNavigate).to.be.eq(loginRequestUrl);
                return Promise.resolve(done());
            });
            pca.handleRedirectPromise();
            expect(window.sessionStorage.getItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.URL_HASH}`)).to.be.eq(null);
        });

        it("replaces custom hash if navigateToLoginRequestUri is true and loginRequestUrl contains custom hash", () => {
            sinon.stub(pca, <any>"interactionInProgress").returns(true);
            const loginRequestUrl = window.location.href + "#testHash";
            window.location.hash = TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT;
            window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.ORIGIN_URI}`, loginRequestUrl);
            sinon.stub(PublicClientApplication.prototype, <any>"handleHash").callsFake((responseHash) => {
                expect(responseHash).to.be.eq(TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT);
            });
            return pca.handleRedirectPromise()
                .then(() => {
                    expect(window.location.href).to.be.eq(loginRequestUrl);
                });
        });

        it("replaces custom hash if navigateToLoginRequestUri is true and loginRequestUrl contains custom hash (passed in)", () => {
            sinon.stub(pca, <any>"interactionInProgress").returns(true);
            const loginRequestUrl = window.location.href + "#testHash";
            window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.ORIGIN_URI}`, loginRequestUrl);
            sinon.stub(PublicClientApplication.prototype, <any>"handleHash").callsFake((responseHash) => {
                expect(responseHash).to.be.eq(TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT);
            });
            return pca.handleRedirectPromise(TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT)
                .then(() => {
                    expect(window.location.href).to.be.eq(loginRequestUrl);
                });
        });

        it("processes hash if navigateToLoginRequestUri is true and loginRequestUrl contains trailing slash", (done) => {
            sinon.stub(pca, <any>"interactionInProgress").returns(true);
            const loginRequestUrl = window.location.href.endsWith("/") ? window.location.href.slice(0, -1) : window.location.href + "/";
            window.location.hash = TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT;
            window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.ORIGIN_URI}`, loginRequestUrl);
            sinon.stub(PublicClientApplication.prototype, <any>"handleHash").callsFake((responseHash) => {
                expect(responseHash).to.be.eq(TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT);
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
            sinon.stub(pca, <any>"interactionInProgress").returns(true);
            const loginRequestUrl = window.location.href + "#testHash";
            window.location.hash = TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT;
            window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.ORIGIN_URI}`, loginRequestUrl);
            sinon.stub(PublicClientApplication.prototype, <any>"handleHash").callsFake((responseHash) => {
                expect(window.location.href).to.not.contain("#testHash");
                expect(responseHash).to.be.eq(TEST_HASHES.TEST_SUCCESS_CODE_HASH_REDIRECT);
                done();
            });
            pca.handleRedirectPromise();
        });
    });

    describe("Non-browser environment", () => {
        let oldWindow;

        beforeEach(() => {
            // @ts-ignore
            oldWindow = { ...global.window };

            // @ts-ignore
            global.window = undefined;
        });

        afterEach(() => {
            // @ts-ignore
            global.window = oldWindow;

            // @ts-ignore
            global.window.parent = oldWindow;
        });

        it("Constructor doesnt throw if window is undefined", () => {
            new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID
                }
            });
        });

        it("acquireTokenSilent throws", (done) => {
            const instance = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID
                }
            });

            instance.acquireTokenSilent({scopes: ["openid"], account: null})
                .catch(error => {
                    expect(error.errorCode).to.equal(BrowserAuthErrorMessage.notInBrowserEnvironment.code);
                    done();
                });
        });

        it("ssoSilent throws", (done) => {
            const instance = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID
                }
            });

            instance.ssoSilent({})
                .catch(error => {
                    expect(error.errorCode).to.equal(BrowserAuthErrorMessage.notInBrowserEnvironment.code);
                    done();
                });
        });

        it("acquireTokenPopup throws", (done) => {
            const instance = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID
                }
            });

            instance.acquireTokenPopup({scopes: ["openid"]}).catch((error) => {
                expect(error.errorCode).to.equal(BrowserAuthErrorMessage.notInBrowserEnvironment.code);
                done();
            });
        });

        it("acquireTokenRedirect throws", (done) => {
            const instance = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID
                }
            });

            instance.acquireTokenRedirect({scopes: ["openid"]})
                .catch(error => {
                    expect(error.errorCode).to.equal(BrowserAuthErrorMessage.notInBrowserEnvironment.code);
                    done();
                });
        });

        it("loginPopup throws", (done) => {
            const instance = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID
                }
            });

            instance.loginPopup({scopes: ["openid"]})
                .catch(error => {
                    expect(error.errorCode).to.equal(BrowserAuthErrorMessage.notInBrowserEnvironment.code);
                    done();
                });
        });

        it("loginRedirect throws", (done) => {
            const instance = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID
                }
            });

            instance.loginRedirect({scopes: ["openid"]})
                .catch(error => {
                    expect(error.errorCode).to.equal(BrowserAuthErrorMessage.notInBrowserEnvironment.code);
                    done();
                });
        });

        it("logout throws", (done) => {
            const instance = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID
                }
            });

            instance.logout()
                .catch(error => {
                    expect(error.errorCode).to.equal(BrowserAuthErrorMessage.notInBrowserEnvironment.code);
                    done();
                });
        });

        it("getAllAccounts returns empty array", () => {
            const instance = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID
                }
            });

            const accounts = instance.getAllAccounts();
            expect(accounts).to.deep.equal([]);
        });

        it("getAccountByUsername returns null", () => {
            const instance = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID
                }
            });

            const account = instance.getAccountByUsername("example@test.com");
            expect(account).to.equal(null);
        });

        it("handleRedirectPromise returns null", (done) => {
            const instance = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID
                }
            });

            instance.handleRedirectPromise().then(result => {
                expect(result).to.be.null;
                done();
            });
        });

        it("addEventCallback does not throw", (done) => {
            const instance = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID
                }
            });

            expect(() => instance.addEventCallback(() => {})).to.not.throw();
            done();
        });
    });

    describe("Redirect Flow Unit tests", () => {

        describe("handleRedirectPromise()", () => {
            it("does nothing if no hash is detected", (done) => {
                pca.handleRedirectPromise().then(() => {
                    expect(window.localStorage.length).to.be.eq(0);
                    expect(window.sessionStorage.length).to.be.eq(0);
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
                const testTokenReq: AuthorizationCodeRequest = {
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
                    headers: null,
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
                    tenantId: testIdTokenClaims.tid,
                    username: testIdTokenClaims.preferred_username
                };
                const testTokenResponse: AuthenticationResult = {
                    authority: TEST_CONFIG.validAuthority,
                    uniqueId: testIdTokenClaims.oid,
                    tenantId: testIdTokenClaims.tid,
                    scopes: TEST_CONFIG.DEFAULT_SCOPES,
                    idToken: testServerTokenResponse.body.id_token,
                    idTokenClaims: testIdTokenClaims,
                    accessToken: testServerTokenResponse.body.access_token,
                    fromCache: false,
                    expiresOn: new Date(Date.now() + (testServerTokenResponse.body.expires_in * 1000)),
                    account: testAccount,
                    tokenType: AuthenticationScheme.BEARER
                };
                sinon.stub(XhrClient.prototype, "sendGetRequestAsync").resolves(DEFAULT_OPENID_CONFIG_RESPONSE);
                sinon.stub(XhrClient.prototype, "sendPostRequestAsync").resolves(testServerTokenResponse);
                pca = new PublicClientApplication({
                    auth: {
                        clientId: TEST_CONFIG.MSAL_CLIENT_ID
                    }
                });

                const tokenResponse = await pca.handleRedirectPromise();
                expect(tokenResponse.uniqueId).to.be.eq(testTokenResponse.uniqueId);
                expect(tokenResponse.tenantId).to.be.eq(testTokenResponse.tenantId);
                expect(tokenResponse.scopes).to.be.deep.eq(testTokenResponse.scopes);
                expect(tokenResponse.idToken).to.be.eq(testTokenResponse.idToken);
                expect(tokenResponse.idTokenClaims).to.be.contain(testTokenResponse.idTokenClaims);
                expect(tokenResponse.accessToken).to.be.eq(testTokenResponse.accessToken);
                expect(testTokenResponse.expiresOn.getMilliseconds() >= tokenResponse.expiresOn.getMilliseconds()).to.be.true;
                expect(window.sessionStorage.length).to.be.eq(4);
            });

            it("gets hash from cache and processes error", (done) => {
                const testAuthCodeRequest: AuthorizationCodeRequest = {
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
                    expect(err instanceof ServerError).to.be.true;
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

                const testTokenReq: AuthorizationCodeRequest = {
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
                    headers: null,
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
                    tenantId: testIdTokenClaims.tid,
                    username: testIdTokenClaims.preferred_username
                };

                const testTokenResponse: AuthenticationResult = {
                    authority: TEST_CONFIG.validAuthority,
                    uniqueId: testIdTokenClaims.oid,
                    tenantId: testIdTokenClaims.tid,
                    scopes: TEST_CONFIG.DEFAULT_SCOPES,
                    idToken: testServerTokenResponse.body.id_token,
                    idTokenClaims: testIdTokenClaims,
                    accessToken: testServerTokenResponse.body.access_token,
                    fromCache: false,
                    expiresOn: new Date(Date.now() + (testServerTokenResponse.body.expires_in * 1000)),
                    account: testAccount,
                    tokenType: AuthenticationScheme.BEARER
                };

                sinon.stub(XhrClient.prototype, "sendGetRequestAsync").resolves(DEFAULT_OPENID_CONFIG_RESPONSE);
                sinon.stub(XhrClient.prototype, "sendPostRequestAsync").resolves(testServerTokenResponse);
                pca = new PublicClientApplication({
                    auth: {
                        clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                        navigateToLoginRequestUrl: false
                    }
                });

                const tokenResponse = await pca.handleRedirectPromise();
                expect(tokenResponse.uniqueId).to.be.eq(testTokenResponse.uniqueId);
                expect(tokenResponse.tenantId).to.be.eq(testTokenResponse.tenantId);
                expect(tokenResponse.scopes).to.be.deep.eq(testTokenResponse.scopes);
                expect(tokenResponse.idToken).to.be.eq(testTokenResponse.idToken);
                expect(tokenResponse.idTokenClaims).to.be.contain(testTokenResponse.idTokenClaims);
                expect(tokenResponse.accessToken).to.be.eq(testTokenResponse.accessToken);
                expect(testTokenResponse.expiresOn.getMilliseconds() >= tokenResponse.expiresOn.getMilliseconds()).to.be.true;
                expect(window.sessionStorage.length).to.be.eq(4);
                expect(window.location.hash).to.be.empty;
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

                const testTokenReq: AuthorizationCodeRequest = {
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
                    headers: null,
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
                    tenantId: testIdTokenClaims.tid,
                    username: testIdTokenClaims.preferred_username
                };

                const testTokenResponse: AuthenticationResult = {
                    authority: TEST_CONFIG.validAuthority,
                    uniqueId: testIdTokenClaims.oid,
                    tenantId: testIdTokenClaims.tid,
                    scopes: TEST_CONFIG.DEFAULT_SCOPES,
                    idToken: testServerTokenResponse.body.id_token,
                    idTokenClaims: testIdTokenClaims,
                    accessToken: testServerTokenResponse.body.access_token,
                    fromCache: false,
                    expiresOn: new Date(Date.now() + (testServerTokenResponse.body.expires_in * 1000)),
                    account: testAccount,
                    tokenType: AuthenticationScheme.BEARER
                };

                sinon.stub(XhrClient.prototype, "sendGetRequestAsync").resolves(DEFAULT_OPENID_CONFIG_RESPONSE);
                sinon.stub(XhrClient.prototype, "sendPostRequestAsync").resolves(testServerTokenResponse);
                pca = new PublicClientApplication({
                    auth: {
                        clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                        navigateToLoginRequestUrl: false
                    }
                });

                const tokenResponse = await pca.handleRedirectPromise();
                expect(tokenResponse.uniqueId).to.be.eq(testTokenResponse.uniqueId);
                expect(tokenResponse.tenantId).to.be.eq(testTokenResponse.tenantId);
                expect(tokenResponse.scopes).to.be.deep.eq(testTokenResponse.scopes);
                expect(tokenResponse.idToken).to.be.eq(testTokenResponse.idToken);
                expect(tokenResponse.idTokenClaims).to.be.contain(testTokenResponse.idTokenClaims);
                expect(tokenResponse.accessToken).to.be.eq(testTokenResponse.accessToken);
                expect(testTokenResponse.expiresOn.getMilliseconds() >= tokenResponse.expiresOn.getMilliseconds()).to.be.true;
                expect(window.sessionStorage.length).to.be.eq(4);
                expect(window.location.hash).to.be.empty;
            });
        });

        describe("loginRedirect", () => {

            it("loginRedirect throws an error if interaction is currently in progress", async () => {
                window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.INTERACTION_STATUS_KEY}`, BrowserConstants.INTERACTION_IN_PROGRESS_VALUE);
                await expect(pca.loginRedirect(null)).to.be.rejectedWith(BrowserAuthErrorMessage.interactionInProgress.desc);
                await expect(pca.loginRedirect(null)).to.be.rejectedWith(BrowserAuthError);
            });

            it("Uses default request if no request provided", (done) => {
                sinon.stub(pca, "acquireTokenRedirect").callsFake((request) => {
                    expect(request.scopes).to.contain("openid");
                    expect(request.scopes).to.contain("profile");
                    done();
                    return null;
                });

                pca.loginRedirect();
            });

            it("loginRedirect navigates to created login url", (done) => {
                sinon.stub(RedirectHandler.prototype, "initiateAuthRequest").callsFake((navigateUrl): Promise<void> => {
                    try {
                        expect(navigateUrl).to.be.eq(testNavUrl);
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
                const loginRequest: AuthorizationUrlRequest = {
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

            it("loginRedirect navigates to created login url, with empty request", (done) => {
                sinon.stub(RedirectHandler.prototype, "initiateAuthRequest").callsFake((navigateUrl): Promise<void> => {
                    expect(navigateUrl.startsWith(testNavUrlNoRequest)).to.be.true;
                    return Promise.resolve(done());
                });
                sinon.stub(CryptoOps.prototype, "generatePkceCodes").resolves({
                    challenge: TEST_CONFIG.TEST_CHALLENGE,
                    verifier: TEST_CONFIG.TEST_VERIFIER
                });
                sinon.stub(CryptoOps.prototype, "createNewGuid").returns(RANDOM_TEST_GUID);

                pca.loginRedirect(null);
            });

            it("Updates cache entries correctly", async () => {
                const emptyRequest: AuthorizationUrlRequest = {
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
                sinon.stub(BrowserUtils, "navigateWindow").callsFake((urlNavigate: string, timeout: number, logger: Logger, noHistory?: boolean) => {
                    expect(noHistory).to.be.undefined;
                    expect(logger).to.be.instanceOf(Logger);
                    expect(urlNavigate).to.be.not.empty;
                    return Promise.resolve();
                });
                const testLogger = new Logger(loggerOptions);

                const browserCrypto = new CryptoOps();
                const browserStorage = new BrowserCacheManager(TEST_CONFIG.MSAL_CLIENT_ID, cacheConfig, browserCrypto, testLogger);
                await pca.loginRedirect(emptyRequest);
                expect(browserStorage.getTemporaryCache(browserStorage.generateStateKey(TEST_STATE_VALUES.TEST_STATE_REDIRECT))).to.be.deep.eq(TEST_STATE_VALUES.TEST_STATE_REDIRECT);
                expect(browserStorage.getTemporaryCache(browserStorage.generateNonceKey(TEST_STATE_VALUES.TEST_STATE_REDIRECT))).to.be.eq(RANDOM_TEST_GUID);
                expect(browserStorage.getTemporaryCache(browserStorage.generateAuthorityKey(TEST_STATE_VALUES.TEST_STATE_REDIRECT))).to.be.eq(`${Constants.DEFAULT_AUTHORITY}`);
            });

            it("Caches token request correctly", async () => {
                const tokenRequest: AuthorizationUrlRequest = {
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
                sinon.stub(BrowserUtils, "navigateWindow").callsFake((urlNavigate: string, timeout: number, logger: Logger, noHistory?: boolean) => {
                    expect(noHistory).to.be.undefined;
                    expect(logger).to.be.instanceOf(Logger);
                    expect(urlNavigate).to.be.not.empty;
                    return Promise.resolve();
                });

                const browserCrypto = new CryptoOps();
                const testLogger = new Logger(loggerOptions);
                const browserStorage = new BrowserCacheManager(TEST_CONFIG.MSAL_CLIENT_ID, cacheConfig, browserCrypto, testLogger);
                await pca.loginRedirect(tokenRequest);
                const cachedRequest: AuthorizationCodeRequest = JSON.parse(browserCrypto.base64Decode(browserStorage.getTemporaryCache(TemporaryCacheKeys.REQUEST_PARAMS, true)));
                expect(cachedRequest.scopes).to.be.deep.eq([]);
                expect(cachedRequest.codeVerifier).to.be.deep.eq(TEST_CONFIG.TEST_VERIFIER);
                expect(cachedRequest.authority).to.be.deep.eq(`${Constants.DEFAULT_AUTHORITY}`);
                expect(cachedRequest.correlationId).to.be.deep.eq(RANDOM_TEST_GUID);
            });

            it("Cleans cache before error is thrown", async () => {
                const emptyRequest: AuthorizationUrlRequest = {
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
                    expect(window.sessionStorage).to.be.length(1);
                    const failures = window.sessionStorage.getItem(`server-telemetry-${TEST_CONFIG.MSAL_CLIENT_ID}`);
                    const failureObj = JSON.parse(failures) as ServerTelemetryEntity;
                    expect(failureObj.failedRequests).to.be.length(2);
                    expect(failureObj.failedRequests[0]).to.eq(ApiId.acquireTokenRedirect);
                    expect(failureObj.errors[0]).to.eq(testError.errorCode);
                    expect(e).to.be.eq(testError);
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
                sinon.stub(BrowserUtils, "navigateWindow").callsFake((urlNavigate: string, timeout: number, logger: Logger, noHistory?: boolean) => {
                    expect(noHistory).to.be.undefined;
                    expect(logger).to.be.instanceOf(Logger);
                    expect(urlNavigate).to.be.not.empty;
                    return Promise.resolve();
                });
                const emptyRequest: AuthorizationUrlRequest = {
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
                const validatedRequest: AuthorizationUrlRequest = {
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
                expect(loginUrlSpy.calledWith(validatedRequest)).to.be.true;
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
                sinon.stub(BrowserUtils, "navigateWindow").callsFake((urlNavigate: string, timeout: number, logger: Logger, noHistory?: boolean) => {
                    expect(noHistory).to.be.undefined;
                    expect(logger).to.be.instanceOf(Logger);
                    expect(urlNavigate).to.be.not.empty;
                    return Promise.resolve();
                });
                const loginRequest: AuthorizationUrlRequest = {
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
                const validatedRequest: AuthorizationUrlRequest = {
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
                expect(loginUrlSpy.calledWith(validatedRequest)).to.be.true;
            });
        });

        describe("acquireTokenRedirect", () => {

            it("throws an error if interaction is currently in progress", async () => {
                window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.INTERACTION_STATUS_KEY}`, BrowserConstants.INTERACTION_IN_PROGRESS_VALUE);
                await expect(pca.acquireTokenRedirect(null)).to.be.rejectedWith(BrowserAuthErrorMessage.interactionInProgress.desc);
                await expect(pca.acquireTokenRedirect(null)).to.be.rejectedWith(BrowserAuthError);
            });

            it("throws an error if inside an iframe", async () => {
                sinon.stub(BrowserUtils, "isInIframe").returns(true);
                await expect(pca.acquireTokenRedirect({ scopes: [] })).to.be.rejectedWith(BrowserAuthErrorMessage.redirectInIframeError.desc);
            });

            it("navigates to created login url", (done) => {
                sinon.stub(RedirectHandler.prototype, "initiateAuthRequest").callsFake((navigateUrl): Promise<void> => {
                    expect(navigateUrl).to.be.eq(testNavUrl);
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
                const expectedUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=0813e1d1-ad72-46a9-8665-399bba48c201&scope=user.read%20openid%20profile&redirect_uri=https%3A%2F%2Flocalhost%3A8081%2Findex.html&client-request-id=11553a9b-7116-48b1-9d48-f6d4a8ff8371&response_mode=fragment&response_type=code&x-client-SKU=msal.js.browser&x-client-VER=${pkg.version}&x-client-OS=&x-client-CPU=&client_info=1&code_challenge=JsjesZmxJwehdhNY9kvyr0QOeSMEvryY_EHZo3BKrqg&code_challenge_method=S256&nonce=11553a9b-7116-48b1-9d48-f6d4a8ff8371&state=eyJpZCI6IjExNTUzYTliLTcxMTYtNDhiMS05ZDQ4LWY2ZDRhOGZmODM3MSIsIm1ldGEiOnsiaW50ZXJhY3Rpb25UeXBlIjoicmVkaXJlY3QifX0%3D%7CuserState`;

                const onRedirectNavigate = (url) => {
                    expect(url).to.equal(expectedUrl)
                    done();
                };

                sinon.stub(RedirectHandler.prototype, "initiateAuthRequest").callsFake((navigateUrl, {
                    redirectTimeout: timeout, redirectStartPage, onRedirectNavigate: onRedirectNavigateCb
                }): Promise<void> => {
                    expect(onRedirectNavigateCb).to.be.eq(onRedirectNavigate);
                    expect(navigateUrl).to.eq(expectedUrl);
                    onRedirectNavigateCb(navigateUrl);
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
                const emptyRequest: AuthorizationUrlRequest = {
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
                sinon.stub(BrowserUtils, "navigateWindow").callsFake((urlNavigate: string, timeout: number, logger: Logger, noHistory?: boolean) => {
                    expect(noHistory).to.be.undefined;
                    expect(logger).to.be.instanceOf(Logger);
                    expect(urlNavigate).to.be.not.empty;
                    return Promise.resolve();
                });
                const browserCrypto = new CryptoOps();
                const testLogger = new Logger(loggerOptions);
                const browserStorage = new BrowserCacheManager(TEST_CONFIG.MSAL_CLIENT_ID, cacheConfig, browserCrypto, testLogger);
                await pca.loginRedirect(emptyRequest);
                expect(browserStorage.getTemporaryCache(browserStorage.generateStateKey(TEST_STATE_VALUES.TEST_STATE_REDIRECT))).to.be.deep.eq(TEST_STATE_VALUES.TEST_STATE_REDIRECT);
                expect(browserStorage.getTemporaryCache(browserStorage.generateNonceKey(TEST_STATE_VALUES.TEST_STATE_REDIRECT))).to.be.eq(RANDOM_TEST_GUID);
                expect(browserStorage.getTemporaryCache(browserStorage.generateAuthorityKey(TEST_STATE_VALUES.TEST_STATE_REDIRECT))).to.be.eq(`${Constants.DEFAULT_AUTHORITY}`);
            });

            it("Caches token request correctly", async () => {
                const testScope = "testscope";
                const tokenRequest: AuthorizationUrlRequest = {
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
                sinon.stub(BrowserUtils, "navigateWindow").callsFake((urlNavigate: string, timeout: number, logger: Logger, noHistory?: boolean) => {
                    expect(noHistory).to.be.undefined;
                    expect(logger).to.be.instanceOf(Logger);
                    expect(urlNavigate).to.be.not.empty;
                    return Promise.resolve();
                });
                const browserCrypto = new CryptoOps();
                const testLogger = new Logger(loggerOptions);
                const browserStorage = new BrowserCacheManager(TEST_CONFIG.MSAL_CLIENT_ID, cacheConfig, browserCrypto, testLogger);
                await pca.acquireTokenRedirect(tokenRequest);
                const cachedRequest: AuthorizationCodeRequest = JSON.parse(browserCrypto.base64Decode(browserStorage.getTemporaryCache(TemporaryCacheKeys.REQUEST_PARAMS, true)));
                expect(cachedRequest.scopes).to.be.deep.eq([testScope]);
                expect(cachedRequest.codeVerifier).to.be.deep.eq(TEST_CONFIG.TEST_VERIFIER);
                expect(cachedRequest.authority).to.be.deep.eq(`${Constants.DEFAULT_AUTHORITY}`);
                expect(cachedRequest.correlationId).to.be.deep.eq(RANDOM_TEST_GUID);
            });

            it("Cleans cache before error is thrown", async () => {
                const testScope = "testscope";
                const emptyRequest: AuthorizationUrlRequest = {
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
                    expect(window.sessionStorage).to.be.length(1);
                    const failures = window.sessionStorage.getItem(`server-telemetry-${TEST_CONFIG.MSAL_CLIENT_ID}`);
                    const failureObj = JSON.parse(failures) as ServerTelemetryEntity;
                    expect(failureObj.failedRequests).to.be.length(2);
                    expect(failureObj.failedRequests[0]).to.eq(ApiId.acquireTokenRedirect);
                    expect(failureObj.errors[0]).to.eq(testError.errorCode);
                    expect(e).to.be.eq(testError);
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
                sinon.stub(BrowserUtils, "navigateWindow").callsFake((urlNavigate: string, timeout: number, logger: Logger, noHistory?: boolean) => {
                    expect(noHistory).to.be.undefined;
                    expect(logger).to.be.instanceOf(Logger);
                    expect(urlNavigate).to.be.not.empty;
                    return Promise.resolve();
                });
                const emptyRequest: AuthorizationUrlRequest = {
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
                const validatedRequest: AuthorizationUrlRequest = {
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
                expect(acquireTokenUrlSpy.calledWith(validatedRequest)).to.be.true;
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
                sinon.stub(BrowserUtils, "navigateWindow").callsFake((urlNavigate: string, timeout: number, logger: Logger, noHistory?: boolean) => {
                    expect(noHistory).to.be.undefined;
                    expect(logger).to.be.instanceOf(Logger);
                    expect(urlNavigate).to.be.not.empty;
                    return Promise.resolve();
                });
                const testScope = "testscope";
                const loginRequest: AuthorizationUrlRequest = {
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
                const validatedRequest: AuthorizationUrlRequest = {
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
                expect(acquireTokenUrlSpy.calledWith(validatedRequest)).to.be.true;
            });
        });
    });

    describe("Popup Flow Unit tests", () => {

        describe("loginPopup", () => {
            beforeEach(() => {
                sinon.stub(window, "open").returns(window);
            });

            afterEach(() => {
                sinon.restore();
            });

            it("throws error if interaction is in progress", async () => {
                window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.INTERACTION_STATUS_KEY}`, BrowserConstants.INTERACTION_IN_PROGRESS_VALUE);
                await expect(pca.loginPopup(null)).to.be.rejectedWith(BrowserAuthErrorMessage.interactionInProgress.desc);
                await expect(pca.loginPopup(null)).to.be.rejectedWith(BrowserAuthError);
            });

            it("Uses default request if no request provided", (done) => {
                sinon.stub(pca, "acquireTokenPopup").callsFake((request) => {
                    expect(request.scopes).to.contain("openid");
                    expect(request.scopes).to.contain("profile");
                    done();
                    return null;
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
                    tenantId: testIdTokenClaims.tid,
                    username: testIdTokenClaims.preferred_username
                };
                const testTokenResponse: AuthenticationResult = {
                    authority: TEST_CONFIG.validAuthority,
                    uniqueId: testIdTokenClaims.oid,
                    tenantId: testIdTokenClaims.tid,
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
                    expect(requestUrl).to.be.eq(testNavUrl);
                    return window;
                });
                sinon.stub(PopupHandler.prototype, "monitorPopupForHash").resolves(TEST_HASHES.TEST_SUCCESS_CODE_HASH_POPUP);
                sinon.stub(PopupHandler.prototype, "handleCodeResponse").resolves(testTokenResponse);
                sinon.stub(CryptoOps.prototype, "generatePkceCodes").resolves({
                    challenge: TEST_CONFIG.TEST_CHALLENGE,
                    verifier: TEST_CONFIG.TEST_VERIFIER
                });
                sinon.stub(CryptoOps.prototype, "createNewGuid").returns(RANDOM_TEST_GUID);
                const tokenResp = await pca.loginPopup(null);
                expect(tokenResp).to.be.deep.eq(testTokenResponse);
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
                    await pca.loginPopup(null);
                } catch (e) {
                    // Test that error was cached for telemetry purposes and then thrown
                    expect(window.sessionStorage).to.be.length(1);
                    const failures = window.sessionStorage.getItem(`server-telemetry-${TEST_CONFIG.MSAL_CLIENT_ID}`);
                    const failureObj = JSON.parse(failures) as ServerTelemetryEntity;
                    expect(failureObj.failedRequests).to.be.length(2);
                    expect(failureObj.failedRequests[0]).to.eq(ApiId.acquireTokenPopup);
                    expect(failureObj.errors[0]).to.eq(testError.errorCode);
                    expect(e).to.be.eq(testError);
                }
            });
        });

        describe("acquireTokenPopup", () => {
            beforeEach(() => {
                sinon.stub(window, "open").returns(window);
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
                })).rejectedWith(BrowserAuthErrorMessage.interactionInProgress.desc);
                await expect(pca.acquireTokenPopup({
                    redirectUri: TEST_URIS.TEST_REDIR_URI,
                    scopes: ["scope"]
                })).rejectedWith(BrowserAuthError);
            });

            it("opens popup window before network request by default", async () => {
                const request: AuthorizationUrlRequest = {
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

                const popupSpy = sinon.stub(PopupHandler, "openSizedPopup");

                try {
                    await pca.acquireTokenPopup(request);
                } catch(e) {}
                expect(popupSpy.getCall(0).args).to.be.length(2);
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

                const request: AuthorizationUrlRequest = {
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

                const popupSpy = sinon.stub(PopupHandler, "openSizedPopup");

                try {
                    await pca.acquireTokenPopup(request);
                } catch(e) {}
                expect(popupSpy.calledOnce).to.be.true;
                expect(popupSpy.getCall(0).args).to.be.length(2);
                expect(popupSpy.getCall(0).args[0].startsWith(TEST_URIS.TEST_AUTH_ENDPT)).to.be.true;
                expect(popupSpy.getCall(0).args[0]).to.include(`client_id=${encodeURIComponent(TEST_CONFIG.MSAL_CLIENT_ID)}`);
                expect(popupSpy.getCall(0).args[0]).to.include(`redirect_uri=${encodeURIComponent(request.redirectUri)}`);
                expect(popupSpy.getCall(0).args[0]).to.include(`login_hint=${encodeURIComponent(request.loginHint)}`);
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
                    tenantId: testIdTokenClaims.tid,
                    username: testIdTokenClaims.preferred_username
                };
                const testTokenResponse: AuthenticationResult = {
                    authority: TEST_CONFIG.validAuthority,
                    uniqueId: testIdTokenClaims.oid,
                    tenantId: testIdTokenClaims.tid,
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
                    expect(requestUrl).to.be.eq(testNavUrl);
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
                expect(tokenResp).to.be.deep.eq(testTokenResponse);
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
                    expect(window.sessionStorage).to.be.length(1);
                    const failures = window.sessionStorage.getItem(`server-telemetry-${TEST_CONFIG.MSAL_CLIENT_ID}`);
                    const failureObj = JSON.parse(failures) as ServerTelemetryEntity;
                    expect(failureObj.failedRequests).to.be.length(2);
                    expect(failureObj.failedRequests[0]).to.eq(ApiId.acquireTokenPopup);
                    expect(failureObj.errors[0]).to.eq(testError.errorCode);
                    expect(e).to.be.eq(testError);
                }
            });
        });
    });

    describe("ssoSilent() Tests", () => {

        it("throws error if loginHint or sid are empty", async () => {
            await expect(pca.ssoSilent({
                redirectUri: TEST_URIS.TEST_REDIR_URI,
                scopes: [TEST_CONFIG.MSAL_CLIENT_ID]
            })).to.be.rejectedWith(BrowserAuthError);
            await expect(pca.ssoSilent({
                redirectUri: TEST_URIS.TEST_REDIR_URI,
                scopes: [TEST_CONFIG.MSAL_CLIENT_ID]
            })).to.be.rejectedWith(BrowserAuthErrorMessage.silentSSOInsufficientInfoError.desc);
        });

        it("throws error if prompt is not set to 'none'", async () => {
            const req: AuthorizationUrlRequest = {
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

            await expect(pca.ssoSilent(req)).to.be.rejectedWith(BrowserAuthError);
            await expect(pca.ssoSilent(req)).to.be.rejectedWith(BrowserAuthErrorMessage.silentPromptValueError.desc);
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
                tenantId: testIdTokenClaims.tid,
                username: testIdTokenClaims.preferred_username
            };
            const testTokenResponse: AuthenticationResult = {
                authority: TEST_CONFIG.validAuthority,
                uniqueId: testIdTokenClaims.oid,
                tenantId: testIdTokenClaims.tid,
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
            expect(loadFrameSyncSpy.calledOnce).to.be.true;
            expect(tokenResp).to.be.deep.eq(testTokenResponse);
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
                tenantId: testIdTokenClaims.tid,
                username: testIdTokenClaims.preferred_username
            };
            const testTokenResponse: AuthenticationResult = {
                authority: TEST_CONFIG.validAuthority,
                uniqueId: testIdTokenClaims.oid,
                tenantId: testIdTokenClaims.tid,
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
            expect(loadFrameSyncSpy.calledOnce).to.be.true;
            expect(tokenResp).to.be.deep.eq(testTokenResponse);
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
                tenantId: testIdTokenClaims.tid,
                username: testIdTokenClaims.preferred_username
            };
            const testTokenResponse: AuthenticationResult = {
                authority: TEST_CONFIG.validAuthority,
                uniqueId: testIdTokenClaims.oid,
                tenantId: testIdTokenClaims.tid,
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
            const tokenRequest: SilentFlowRequest = {
                scopes: ["scope1"],
                account: testAccount,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                forceRefresh: false
            };
            const expectedTokenRequest: SilentFlowRequest = {
                ...tokenRequest,
                scopes: ["scope1"],
                authority: `${Constants.DEFAULT_AUTHORITY}`,
                correlationId: RANDOM_TEST_GUID,
                forceRefresh: false
            };
            const tokenResp = await pca.acquireTokenSilent(tokenRequest);
            expect(silentATStub.calledWith(expectedTokenRequest)).to.be.true;
            expect(tokenResp).to.be.deep.eq(testTokenResponse);
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
                expect(window.sessionStorage).to.be.length(1);
                const failures = window.sessionStorage.getItem(`server-telemetry-${TEST_CONFIG.MSAL_CLIENT_ID}`);
                const failureObj = JSON.parse(failures) as ServerTelemetryEntity;
                expect(failureObj.failedRequests).to.be.length(2);
                expect(failureObj.failedRequests[0]).to.eq(ApiId.acquireTokenSilent_silentFlow);
                expect(failureObj.errors[0]).to.eq(testError.errorCode);
                expect(e).to.be.eq(testError);
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
                tenantId: testIdTokenClaims.tid,
                username: testIdTokenClaims.preferred_username
            };
            const testTokenResponse: AuthenticationResult = {
                authority: TEST_CONFIG.validAuthority,
                uniqueId: testIdTokenClaims.oid,
                tenantId: testIdTokenClaims.tid,
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
            const silentFlowRequest: SilentRequest = {
                scopes: ["User.Read"],
                account: testAccount,
                extraQueryParameters: {
                    queryKey: "queryValue"
                }, 
                forceRefresh: false
            };
            const expectedRequest: AuthorizationUrlRequest = {
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
            const tokenResp = await pca.acquireTokenSilent(silentFlowRequest);

            expect(tokenResp).to.be.deep.eq(testTokenResponse);
            expect(createAcqTokenStub.calledWith(expectedRequest)).to.be.true;
            expect(silentTokenHelperStub.calledWith(testNavUrl)).to.be.true;
        });
    });

    describe("logout", () => {

        it("passes logoutUri from authModule to window nav util", (done) => {
            const logoutUriSpy = sinon.stub(AuthorizationCodeClient.prototype, "getLogoutUri").returns(testLogoutUrl);
            sinon.stub(BrowserUtils, "navigateWindow").callsFake((urlNavigate: string, timeout: number, logger: Logger, noHistory: boolean | undefined) => {
                expect(urlNavigate).to.be.eq(testLogoutUrl);
                expect(logger).to.be.instanceOf(Logger);
                expect(noHistory).to.be.undefined;
                return Promise.resolve(done());
            });
            pca.logout();
            const validatedLogoutRequest: CommonEndSessionRequest = {
                correlationId: RANDOM_TEST_GUID,
                postLogoutRedirectUri: TEST_URIS.TEST_REDIR_URI
            };
            expect(logoutUriSpy.calledWith(validatedLogoutRequest));
        });

        it("includes postLogoutRedirectUri if one is passed", (done) => {
            const postLogoutRedirectUri = "https://localhost:8000/logout";
            sinon.stub(BrowserUtils, "navigateWindow").callsFake((urlNavigate: string, timeout: number, logger: Logger, noHistory: boolean | undefined) => {
                expect(urlNavigate).to.include(`post_logout_redirect_uri=${encodeURIComponent(postLogoutRedirectUri)}`);
                return Promise.resolve(done());
            });
            pca.logout({
                postLogoutRedirectUri
            });
        });

        it("includes postLogoutRedirectUri if one is configured", (done) => {
            const postLogoutRedirectUri = "https://localhost:8000/logout";
            sinon.stub(BrowserUtils, "navigateWindow").callsFake((urlNavigate: string, timeout: number, logger: Logger, noHistory: boolean | undefined) => {
                expect(urlNavigate).to.include(`post_logout_redirect_uri=${encodeURIComponent(postLogoutRedirectUri)}`);
                return Promise.resolve(done());
            });
            
            const pcaWithPostLogout = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                    postLogoutRedirectUri
                }
            });

            pcaWithPostLogout.logout();
        });

        it("doesnt include postLogoutRedirectUri if null is configured", (done) => {
            sinon.stub(BrowserUtils, "navigateWindow").callsFake((urlNavigate: string, timeout: number, logger: Logger, noHistory: boolean | undefined) => {
                expect(urlNavigate).to.not.include(`post_logout_redirect_uri`);
                return Promise.resolve(done());
            });
            
            const pcaWithPostLogout = new PublicClientApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                    postLogoutRedirectUri: null
                }
            });

            pcaWithPostLogout.logout();
        });

        it("doesnt include postLogoutRedirectUri if null is set on request", (done) => {
            sinon.stub(BrowserUtils, "navigateWindow").callsFake((urlNavigate: string, timeout: number, logger: Logger, noHistory: boolean | undefined) => {
                expect(urlNavigate).to.not.include("post_logout_redirect_uri");
                return Promise.resolve(done());
            });
            pca.logout({
                postLogoutRedirectUri: null
            });
        });

        it("includes postLogoutRedirectUri as current page if none is set on request", (done) => {
            sinon.stub(BrowserUtils, "navigateWindow").callsFake((urlNavigate: string, timeout: number, logger: Logger, noHistory: boolean | undefined) => {
                expect(urlNavigate).to.include(`post_logout_redirect_uri=${encodeURIComponent("https://localhost:8081/index.html")}`);
                return Promise.resolve(done());
            });
            pca.logout();
        });

        it("doesnt navigate if onRedirectNavigate returns false", (done) => {
            const logoutUriSpy = sinon.stub(AuthorizationCodeClient.prototype, "getLogoutUri").returns(testLogoutUrl);
            sinon.stub(BrowserUtils, "navigateWindow").callsFake((urlNavigate: string, timeout: number, logger: Logger, noHistory: boolean | undefined) => {
                // If onRedirectNavigate does not stop navigatation, this will be called, failing the test as done will be invoked twice
                return Promise.resolve(done());
            });
            pca.logout({
                onRedirectNavigate: (url) => {
                    expect(url).to.be.eq(testLogoutUrl);
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
        
        it("throws an error if inside an iframe", async () => {
            sinon.stub(BrowserUtils, "isInIframe").returns(true);
            await expect(pca.logout()).to.be.rejectedWith(BrowserAuthErrorMessage.redirectInIframeError.desc);
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
            expect(account).to.be.length(2);
        });

        it("getAllAccounts returns empty array if no accounts signed in", () => {
            window.sessionStorage.clear();
            const accounts = pca.getAllAccounts();
            expect(accounts).to.deep.eq([]);
        });

        it("getAccountByUsername returns account specified", () => {
            const account = pca.getAccountByUsername("example@microsoft.com");
            expect(account).to.deep.eq(testAccountInfo1);
        });

        it("getAccountByUsername returns account specified with case mismatch", () => {
            const account = pca.getAccountByUsername("Example@Microsoft.com");
            expect(account).to.deep.eq(testAccountInfo1);

            const account2 = pca.getAccountByUsername("anotherexample@microsoft.com");
            expect(account2).to.deep.eq(testAccountInfo2);
        });

        it("getAccountByUsername returns null if account doesn't exist", () => {
            const account = pca.getAccountByUsername("this-email-doesnt-exist@microsoft.com");
            expect(account).to.be.null;
        });

        it("getAccountByUsername returns null if passed username is null", () => {
            const account = pca.getAccountByUsername(null);
            expect(account).to.be.null;
        });

        it("getAccountByHomeId returns account specified", () => {
            const account = pca.getAccountByHomeId(TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID);
            expect(account).to.deep.eq(testAccountInfo1);
        });

        it("getAccountByHomeId returns null if passed id doesn't exist", () => {
            const account = pca.getAccountByHomeId("this-id-doesnt-exist");
            expect(account).to.be.null;
        });

        it("getAccountByHomeId returns null if passed id is null", () => {
            const account = pca.getAccountByHomeId(null);
            expect(account).to.be.null;
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
            expect(pca.getActiveAccount()).to.be.null;
        });

        it("setActiveAccount() sets the active account local id value correctly", () => {
            expect((pca as any).activeLocalAccountId).to.be.null;
            pca.setActiveAccount(testAccountInfo1);
            expect((pca as any).activeLocalAccountId).to.be.eq(testAccountInfo1.localAccountId);
        });

        it("getActiveAccount looks up the current account values and returns them()", () => {
            pca.setActiveAccount(testAccountInfo1);
            const activeAccount1 = pca.getActiveAccount();
            expect(activeAccount1).to.be.deep.eq(testAccountInfo1);
            
            const newName = "Ben Franklin";
            window.sessionStorage.clear();
            testAccountInfo1.name = newName;
            testAccount1.name = newName;
            const cacheKey = AccountEntity.generateAccountCacheKey(testAccountInfo1);
            window.sessionStorage.setItem(cacheKey, JSON.stringify(testAccount1));

            const activeAccount2 = pca.getActiveAccount();
            expect(activeAccount2).to.be.deep.eq(testAccountInfo1);
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
                sinon.stub(BrowserUtils, "navigateWindow").callsFake((urlNavigate: string, timeout: number, logger: Logger, noHistory: boolean) => {
                    expect(urlNavigate).to.be.eq(testLogoutUrl);
                    expect(logger).to.be.instanceOf(Logger);
                    expect(noHistory).to.be.undefined;
                    return Promise.resolve();
                });
            });

            it("Clears active account on logout with no account", async () => {
                expect((pca as any).activeLocalAccountId).to.be.eq(testAccountInfo1.localAccountId);
                await pca.logout();
                expect(pca.getActiveAccount()).to.be.null;
            });
    
            it("Clears active account on logout when the given account info matches", async () => {
                expect((pca as any).activeLocalAccountId).to.be.eq(testAccountInfo1.localAccountId);
                await pca.logout({
                    account: testAccountInfo1
                });
                expect(pca.getActiveAccount()).to.be.null;
            });

            it("Does not clear active account on logout if given account object does not match", async () => {
                expect((pca as any).activeLocalAccountId).to.be.eq(testAccountInfo1.localAccountId);
                await pca.logout({
                    account: testAccountInfo2
                });
                expect(pca.getActiveAccount()).to.be.deep.eq(testAccountInfo1);
            });
        });
    });

    describe("Event API tests", () => {
        it("can add an event callback and broadcast to it", (done) => {
            const subscriber = (message) => {
                expect(message.eventType).to.deep.eq(EventType.LOGIN_START);
                expect(message.interactionType).to.deep.eq(InteractionType.Popup);
                done();
            };

            pca.addEventCallback(subscriber);
            // @ts-ignore
            pca.emitEvent(EventType.LOGIN_START, InteractionType.Popup);
        });

        it("can remove an event callback", (done) => {
            const subscriber = (message) => {
                expect(message.eventType).to.deep.eq(EventType.LOGIN_START);
                expect(message.interactionType).to.deep.eq(InteractionType.Popup);
            };

            const callbackSpy = sinon.spy(subscriber);

            const callbackId = pca.addEventCallback(callbackSpy);
            // @ts-ignore
            pca.emitEvent(EventType.LOGIN_START, InteractionType.Popup);
            pca.removeEventCallback(callbackId);
            // @ts-ignore
            pca.emitEvent(EventType.LOGIN_START, InteractionType.Popup);
            expect(callbackSpy.calledOnce).to.be.true;
            done();
        });

        it("can add multiple callbacks and broadcast to all", (done) => {
            const subscriber1 = (message) => {
                expect(message.eventType).to.deep.eq(EventType.ACQUIRE_TOKEN_START);
                expect(message.interactionType).to.deep.eq(InteractionType.Redirect);
            };

            const subscriber2 = (message) => {
                expect(message.eventType).to.deep.eq(EventType.ACQUIRE_TOKEN_START);
                expect(message.interactionType).to.deep.eq(InteractionType.Redirect);
                done();
            };

            pca.addEventCallback(subscriber1);
            pca.addEventCallback(subscriber2);
            // @ts-ignore
            pca.emitEvent(EventType.ACQUIRE_TOKEN_START, InteractionType.Redirect);
        });

        it("sets interactionType, payload, and error to null by default", (done) => {
            const subscriber = (message) => {
                expect(message.eventType).to.deep.eq(EventType.LOGIN_START);
                expect(message.interactionType).to.be.null;
                expect(message.payload).to.be.null;
                expect(message.error).to.be.null;
                expect(message.timestamp).to.not.be.null;
                done();
            };

            pca.addEventCallback(subscriber);
            // @ts-ignore
            pca.emitEvent(EventType.LOGIN_START);
        });

        it("sets all expected fields on event", (done) => {
            const subscriber = (message) => {
                expect(message.eventType).to.deep.eq(EventType.LOGIN_START);
                expect(message.interactionType).to.deep.eq(InteractionType.Silent);
                expect(message.payload).to.deep.eq({scopes: ["user.read"]});
                expect(message.error).to.be.null;
                expect(message.timestamp).to.not.be.null;
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
                    expect(message).to.contain("Message");
                    expect(message).to.contain(LogLevel.Info);
    
                    expect(level).to.equal(LogLevel.Info);
                    expect(containsPii).to.be.false;
    
                    done();
                },
                piiLoggingEnabled: false
            });

            pca.setLogger(logger);

            expect(pca.getLogger()).to.equal(logger);

            pca.getLogger().info("Message");
        });
    });

    describe("initializeWrapperLibrary Tests", () => {
        it("Sets wrapperSKU and wrapperVer with passed values", () => {
            pca.initializeWrapperLibrary(WrapperSKU.React, "1.0.0");

            // @ts-ignore
            const telemetryManager = pca.initializeServerTelemetryManager(100, "test-correlationId");
            const currentHeader = telemetryManager.generateCurrentRequestHeaderValue();

            expect(currentHeader).to.include("@azure/msal-react,1.0.0");
        });
    });
});
