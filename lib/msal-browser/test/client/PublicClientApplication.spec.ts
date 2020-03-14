import * as Mocha from "mocha";
import chai from "chai";
import chaiAsPromised from "chai-as-promised"
chai.use(chaiAsPromised);
const expect = chai.expect;

import { PublicClientApplication } from "../../src/client/PublicClientApplication";
import {
    TEST_CONFIG,
    TEST_URIS,
    TEST_HASHES,
    TEST_TOKENS,
    TEST_DATA_CLIENT_INFO,
    TEST_TOKEN_LIFETIMES,
    RANDOM_TEST_GUID,
    DEFAULT_OPENID_CONFIG_RESPONSE,
    testNavUrl,
    testLogoutUrl
} from "../utils/StringConstants";

import {
    AuthError,
    ServerError,
    AuthResponse,
    LogLevel,
    Constants,
    TemporaryCacheKeys,
    TokenResponse,
    Account,
    TokenExchangeParameters,
    IdTokenClaims,
    PublicClient
} from "@azure/msal-common";

import { AuthCallback } from "../../src/types/AuthCallback";
import { BrowserConfigurationAuthErrorMessage, BrowserConfigurationAuthError } from "../../src/error/BrowserConfigurationAuthError";
import sinon from "sinon";
import { BrowserUtils } from "../../src/utils/BrowserUtils";
import { BrowserConstants } from "../../src/utils/BrowserConstants";
import { Base64Encode } from "../../src/encode/Base64Encode";
import { XhrClient } from "../../src/network/XhrClient";
import { BrowserAuthErrorMessage, BrowserAuthError } from "../../src/error/BrowserAuthError";
import { RedirectHandler } from "../../src/interaction_handler/RedirectHandler";
import { PopupHandler } from "../../src/interaction_handler/PopupHandler";

describe("PublicClientApplication.ts Class Unit Tests", () => {

    const testLoggerCallback = (level: LogLevel, message: string, containsPii: boolean): void => {
        if (containsPii) {
            console.log(`Log level: ${level} Message: ${message}`);
        }
    }

    const authCallback: AuthCallback = (authErr: AuthError, response: AuthResponse) => {
        if (authErr) {
            expect(authErr instanceof AuthError, `${authErr}`).to.be.true;
        } else if (response) {
            console.log(response);
        } else {
            console.log("This shouldn't print, check the test");
        }
    };

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

        it("passes null check", () => {
            expect(pca).to.be.not.null;
            expect(pca instanceof PublicClientApplication).to.be.true;
        });
    });

    describe("Redirect Flow Unit tests", () => {

        describe("handleRedirectCallback()", () => {

            it("throws error if callback is not valid", async () => {
                await expect(pca.handleRedirectCallback(null)).rejectedWith(BrowserConfigurationAuthErrorMessage.invalidCallbackObject.desc);
                await expect(pca.handleRedirectCallback(null)).rejectedWith(BrowserConfigurationAuthError);
            });

            it("does nothing if no hash is detected", () => {
                pca.handleRedirectCallback(authCallback);
                expect(window.localStorage.length).to.be.eq(0);
                expect(window.sessionStorage.length).to.be.eq(0);
            });

            it("navigates and caches hash if navigateToLoginRequestUri is true", () => {
                window.location.hash = TEST_HASHES.TEST_SUCCESS_CODE_HASH;
                window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.ORIGIN_URI}`, TEST_URIS.TEST_REDIR_URI);
                sinon.stub(BrowserUtils, "navigateWindow").callsFake((urlNavigate: string, noHistory?: boolean) => {
                    expect(noHistory).to.be.true;
                    expect(urlNavigate).to.be.eq(TEST_URIS.TEST_REDIR_URI);
                });
                pca = new PublicClientApplication({
                    auth: {
                        clientId: TEST_CONFIG.MSAL_CLIENT_ID
                    }
                });
                pca.handleRedirectCallback(authCallback);
                expect(window.sessionStorage.getItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.URL_HASH}`)).to.be.eq(TEST_HASHES.TEST_SUCCESS_CODE_HASH);
            });

            it("gets hash from cache and processes response", async () => {
                const b64Encode = new Base64Encode();
                window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.ORIGIN_URI}`, TEST_URIS.TEST_REDIR_URI);
                window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.REQUEST_STATE}`, RANDOM_TEST_GUID);
                window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.URL_HASH}`, TEST_HASHES.TEST_SUCCESS_CODE_HASH);
                window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${BrowserConstants.INTERACTION_STATUS_KEY}`, BrowserConstants.INTERACTION_IN_PROGRESS_VALUE);
                window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.NONCE_IDTOKEN}${Constants.RESOURCE_DELIM}${RANDOM_TEST_GUID}`, "123523");
                const testTokenReq: TokenExchangeParameters = {
                    scopes: TEST_CONFIG.DEFAULT_SCOPES,
                    resource: "",
                    codeVerifier: TEST_CONFIG.TEST_VERIFIER,
                    extraQueryParameters: null,
                    authority: `${Constants.DEFAULT_AUTHORITY}/`,
                    correlationId: RANDOM_TEST_GUID
                };
                window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.REQUEST_PARAMS}`, b64Encode.encode(JSON.stringify(testTokenReq)));
                const testServerTokenResponse = {
                    token_type: TEST_CONFIG.TOKEN_TYPE_BEARER,
                    scope: TEST_CONFIG.DEFAULT_SCOPES.join(" "),
                    expires_in: TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN,
                    ext_expires_in: TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN,
                    access_token: TEST_TOKENS.ACCESS_TOKEN,
                    refresh_token: TEST_TOKENS.REFRESH_TOKEN,
                    id_token: TEST_TOKENS.IDTOKEN_V2
                };
                const testIdTokenClaims: IdTokenClaims = {
                    "ver": "2.0",
                    "iss": "https://login.microsoftonline.com/9188040d-6c67-4c5b-b112-36a304b66dad/v2.0",
                    "sub": "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
                    "name": "Abe Lincoln",
                    "preferred_username": "AbeLi@microsoft.com",
                    "oid": "00000000-0000-0000-66f3-3332eca7ea81",
                    "tid": "3338040d-6c67-4c5b-b112-36a304b66dad",
                    "nonce": "123523",
                };
                const testAccount = new Account(testIdTokenClaims.oid, TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID, testIdTokenClaims, TEST_TOKENS.IDTOKEN_V2);
                const testTokenResponse: TokenResponse = {
                    uniqueId: testIdTokenClaims.oid,
                    tenantId: testIdTokenClaims.tid,
                    scopes: TEST_CONFIG.DEFAULT_SCOPES,
                    tokenType: TEST_CONFIG.TOKEN_TYPE_BEARER,
                    idToken: testServerTokenResponse.id_token,
                    idTokenClaims: testIdTokenClaims,
                    accessToken: testServerTokenResponse.access_token,
                    refreshToken: testServerTokenResponse.refresh_token,
                    expiresOn: new Date(Date.now() + (testServerTokenResponse.expires_in * 1000)),
                    account: testAccount,
                    userRequestState: ""
                };
                sinon.stub(XhrClient.prototype, "sendGetRequestAsync").resolves(DEFAULT_OPENID_CONFIG_RESPONSE);
                sinon.stub(XhrClient.prototype, "sendPostRequestAsync").resolves(testServerTokenResponse);
                pca = new PublicClientApplication({
                    auth: {
                        clientId: TEST_CONFIG.MSAL_CLIENT_ID
                    }
                });

                await pca.handleRedirectCallback((authErr: AuthError, tokenResponse: TokenResponse) => {
                    if (authErr) {
                        console.log(authErr);
                        return;
                    }
                    expect(tokenResponse.uniqueId).to.be.eq(testTokenResponse.uniqueId);
                    expect(tokenResponse.tenantId).to.be.eq(testTokenResponse.tenantId);
                    expect(tokenResponse.scopes).to.be.deep.eq(testTokenResponse.scopes);
                    expect(tokenResponse.tokenType).to.be.eq(testTokenResponse.tokenType);
                    expect(tokenResponse.idToken).to.be.eq(testTokenResponse.idToken);
                    expect(tokenResponse.idTokenClaims).to.be.contain(testTokenResponse.idTokenClaims);
                    expect(tokenResponse.accessToken).to.be.eq(testTokenResponse.accessToken);
                    expect(tokenResponse.refreshToken).to.be.eq(testTokenResponse.refreshToken);
                    expect(testTokenResponse.expiresOn.getMilliseconds() >= tokenResponse.expiresOn.getMilliseconds()).to.be.true;
                    expect(tokenResponse.account.accountIdentifier).to.be.deep.eq(testTokenResponse.account.accountIdentifier);
                    expect(tokenResponse.account.environment).to.be.deep.eq(testTokenResponse.account.environment);
                    expect(tokenResponse.account.homeAccountIdentifier).to.be.deep.eq(testTokenResponse.account.homeAccountIdentifier);
                    expect(tokenResponse.account.idToken).to.be.deep.eq(testTokenResponse.account.idToken);
                    expect(tokenResponse.account.idTokenClaims).to.be.contain(testTokenResponse.account.idTokenClaims);
                    expect(tokenResponse.account.name).to.be.deep.eq(testTokenResponse.account.name);
                    expect(tokenResponse.account.sid).to.be.deep.eq(testTokenResponse.account.sid);
                    expect(tokenResponse.account.userName).to.be.deep.eq(testTokenResponse.account.userName);
                });
                expect(window.sessionStorage.length).to.be.eq(3);
            });

            it("gets hash from cache and processes error", () => {
                window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.ORIGIN_URI}`, TEST_URIS.TEST_REDIR_URI);
                window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.REQUEST_STATE}`, RANDOM_TEST_GUID);
                window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.URL_HASH}`, TEST_HASHES.TEST_ERROR_HASH);
                window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${BrowserConstants.INTERACTION_STATUS_KEY}`, BrowserConstants.INTERACTION_IN_PROGRESS_VALUE);
                pca = new PublicClientApplication({
                    auth: {
                        clientId: TEST_CONFIG.MSAL_CLIENT_ID
                    }
                });
                pca.handleRedirectCallback((authErr: AuthError, response: AuthResponse) => {
                    expect(response).to.be.undefined;
                    expect(authErr instanceof ServerError).to.be.true;
                });
            });

            it("processes hash if navigateToLoginRequestUri is false", async () => {
                const b64Encode = new Base64Encode();
                window.location.hash = TEST_HASHES.TEST_SUCCESS_CODE_HASH;
                window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.ORIGIN_URI}`, TEST_URIS.TEST_REDIR_URI);
                window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.REQUEST_STATE}`, RANDOM_TEST_GUID);
                window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${BrowserConstants.INTERACTION_STATUS_KEY}`, BrowserConstants.INTERACTION_IN_PROGRESS_VALUE);
                window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.NONCE_IDTOKEN}${Constants.RESOURCE_DELIM}${RANDOM_TEST_GUID}`, "123523");
                const testTokenReq: TokenExchangeParameters = {
                    scopes: TEST_CONFIG.DEFAULT_SCOPES,
                    resource: "",
                    codeVerifier: TEST_CONFIG.TEST_VERIFIER,
                    extraQueryParameters: null,
                    authority: `${Constants.DEFAULT_AUTHORITY}/`,
                    correlationId: RANDOM_TEST_GUID
                };
                window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.REQUEST_PARAMS}`, b64Encode.encode(JSON.stringify(testTokenReq)));
                const testServerTokenResponse = {
                    token_type: TEST_CONFIG.TOKEN_TYPE_BEARER,
                    scope: TEST_CONFIG.DEFAULT_SCOPES.join(" "),
                    expires_in: TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN,
                    ext_expires_in: TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN,
                    access_token: TEST_TOKENS.ACCESS_TOKEN,
                    refresh_token: TEST_TOKENS.REFRESH_TOKEN,
                    id_token: TEST_TOKENS.IDTOKEN_V2
                };
                const testIdTokenClaims: IdTokenClaims = {
                    "ver": "2.0",
                    "iss": "https://login.microsoftonline.com/9188040d-6c67-4c5b-b112-36a304b66dad/v2.0",
                    "sub": "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
                    "name": "Abe Lincoln",
                    "preferred_username": "AbeLi@microsoft.com",
                    "oid": "00000000-0000-0000-66f3-3332eca7ea81",
                    "tid": "3338040d-6c67-4c5b-b112-36a304b66dad",
                    "nonce": "123523",
                };
                const testAccount = new Account(testIdTokenClaims.oid, TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID, testIdTokenClaims, TEST_TOKENS.IDTOKEN_V2);
                const testTokenResponse: TokenResponse = {
                    uniqueId: testIdTokenClaims.oid,
                    tenantId: testIdTokenClaims.tid,
                    scopes: TEST_CONFIG.DEFAULT_SCOPES,
                    tokenType: TEST_CONFIG.TOKEN_TYPE_BEARER,
                    idToken: testServerTokenResponse.id_token,
                    idTokenClaims: testIdTokenClaims,
                    accessToken: testServerTokenResponse.access_token,
                    refreshToken: testServerTokenResponse.refresh_token,
                    expiresOn: new Date(Date.now() + (testServerTokenResponse.expires_in * 1000)),
                    account: testAccount,
                    userRequestState: ""
                };
                sinon.stub(XhrClient.prototype, "sendGetRequestAsync").resolves(DEFAULT_OPENID_CONFIG_RESPONSE);
                sinon.stub(XhrClient.prototype, "sendPostRequestAsync").resolves(testServerTokenResponse);
                pca = new PublicClientApplication({
                    auth: {
                        clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                        navigateToLoginRequestUrl: false
                    }
                });
                await pca.handleRedirectCallback((authErr: AuthError, tokenResponse: TokenResponse) => {
                    if (authErr) {
                        console.log(authErr);
                        return;
                    }
                    expect(tokenResponse.uniqueId).to.be.eq(testTokenResponse.uniqueId);
                    expect(tokenResponse.tenantId).to.be.eq(testTokenResponse.tenantId);
                    expect(tokenResponse.scopes).to.be.deep.eq(testTokenResponse.scopes);
                    expect(tokenResponse.tokenType).to.be.eq(testTokenResponse.tokenType);
                    expect(tokenResponse.idToken).to.be.eq(testTokenResponse.idToken);
                    expect(tokenResponse.idTokenClaims).to.be.contain(testTokenResponse.idTokenClaims);
                    expect(tokenResponse.accessToken).to.be.eq(testTokenResponse.accessToken);
                    expect(tokenResponse.refreshToken).to.be.eq(testTokenResponse.refreshToken);
                    expect(testTokenResponse.expiresOn.getMilliseconds() >= tokenResponse.expiresOn.getMilliseconds()).to.be.true;
                    expect(tokenResponse.account.accountIdentifier).to.be.deep.eq(testTokenResponse.account.accountIdentifier);
                    expect(tokenResponse.account.environment).to.be.deep.eq(testTokenResponse.account.environment);
                    expect(tokenResponse.account.homeAccountIdentifier).to.be.deep.eq(testTokenResponse.account.homeAccountIdentifier);
                    expect(tokenResponse.account.idToken).to.be.deep.eq(testTokenResponse.account.idToken);
                    expect(tokenResponse.account.idTokenClaims).to.be.contain(testTokenResponse.account.idTokenClaims);
                    expect(tokenResponse.account.name).to.be.deep.eq(testTokenResponse.account.name);
                    expect(tokenResponse.account.sid).to.be.deep.eq(testTokenResponse.account.sid);
                    expect(tokenResponse.account.userName).to.be.deep.eq(testTokenResponse.account.userName);
                });
                expect(window.sessionStorage.length).to.be.eq(3);
                expect(window.location.hash).to.be.empty;
            });
        });

        describe("loginRedirect", () => {

            it("loginRedirect throws an error if authCallback is not set", () => {
                expect(() => pca.loginRedirect({})).to.throw(BrowserConfigurationAuthErrorMessage.noRedirectCallbacksSet.desc);
                expect(() => pca.loginRedirect({})).to.throw(BrowserConfigurationAuthError);
            });

            it("loginRedirect throws an error if interaction is currently in progress", async () => {
                await pca.handleRedirectCallback((authErr: AuthError, response: AuthResponse) => {
                    expect(authErr instanceof BrowserAuthError).to.be.true;
                    expect(authErr.errorMessage).to.be.eq(BrowserAuthErrorMessage.interactionInProgress.desc);
                });
                window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${BrowserConstants.INTERACTION_STATUS_KEY}`, BrowserConstants.INTERACTION_IN_PROGRESS_VALUE);
                pca.loginRedirect({});
            });

            it("loginRedirect navigates to created login url", async () => {
                sinon.stub(PublicClient.prototype, "createLoginUrl").resolves(testNavUrl);
                sinon.stub(RedirectHandler.prototype, "showUI").callsFake((navigateUrl): Window => {
                    expect(navigateUrl).to.be.eq(testNavUrl);
                    return window;
                });
                await pca.handleRedirectCallback((authErr: AuthError, response: AuthResponse) => {
                    console.log(response);
                    console.log(authErr);
                });
                pca.loginRedirect({});
            });

            it("loginRedirect cleans request before throwing error", () => {
                const testError = "Error in creating a login url";
                pca.handleRedirectCallback((authErr: AuthError, response: AuthResponse) => {
                    console.log(response);
                    console.log(authErr);
                });
                window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.ORIGIN_URI}`, TEST_URIS.TEST_REDIR_URI);
                window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.REQUEST_STATE}`, RANDOM_TEST_GUID);
                window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.NONCE_IDTOKEN}${Constants.RESOURCE_DELIM}${RANDOM_TEST_GUID}`, "123523");
                sinon.stub(PublicClient.prototype, "createLoginUrl").throws(testError);
                try {
                    pca.loginRedirect({});
                } catch (e) {
                    expect(window.sessionStorage).to.be.empty;
                    expect(`${e}`).to.contain(testError);
                }
            });
        });

        describe("acquireTokenRedirect", () => {

            it("acquireTokenRedirect throws an error if authCallback is not set", () => {
                expect(() => pca.acquireTokenRedirect({})).to.throw(BrowserConfigurationAuthErrorMessage.noRedirectCallbacksSet.desc);
                expect(() => pca.acquireTokenRedirect({})).to.throw(BrowserConfigurationAuthError);
            });

            it("acquireTokenRedirect throws an error if interaction is currently in progress", async () => {
                await pca.handleRedirectCallback((authErr: AuthError, response: AuthResponse) => {
                    expect(authErr instanceof BrowserAuthError).to.be.true;
                    expect(authErr.errorMessage).to.be.eq(BrowserAuthErrorMessage.interactionInProgress.desc);
                });
                window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${BrowserConstants.INTERACTION_STATUS_KEY}`, BrowserConstants.INTERACTION_IN_PROGRESS_VALUE);
                pca.acquireTokenRedirect({});
            });

            it("acquireTokenRedirect navigates to created login url", async () => {
                sinon.stub(PublicClient.prototype, "createAcquireTokenUrl").resolves(testNavUrl);
                sinon.stub(RedirectHandler.prototype, "showUI").callsFake((navigateUrl): Window => {
                    expect(navigateUrl).to.be.eq(testNavUrl);
                    return window;
                });
                await pca.handleRedirectCallback((authErr: AuthError, response: AuthResponse) => {
                    console.log(response);
                    console.log(authErr);
                });
                pca.acquireTokenRedirect({});
            });

            it("acquireTokenRedirect cleans request before throwing error", () => {
                const testError = "Error in creating a login url";
                pca.handleRedirectCallback((authErr: AuthError, response: AuthResponse) => {
                    console.log(response);
                    console.log(authErr);
                    expect(false).to.be.true;
                });
                window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.ORIGIN_URI}`, TEST_URIS.TEST_REDIR_URI);
                window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.REQUEST_STATE}`, RANDOM_TEST_GUID);
                window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.NONCE_IDTOKEN}${Constants.RESOURCE_DELIM}${RANDOM_TEST_GUID}`, "123523");
                sinon.stub(PublicClient.prototype, "createAcquireTokenUrl").throws(testError);
                try {
                    pca.acquireTokenRedirect({
                        scopes: TEST_CONFIG.DEFAULT_SCOPES
                    });
                } catch (e) {
                    expect(window.sessionStorage).to.be.empty;
                    expect(`${e}`).to.contain(testError);
                }
            });
        });
    });

    describe("Popup Flow Unit tests", () => {

        describe("loginPopup", () => {

            it("throws error if interaction is in progress", async () => {
                window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${BrowserConstants.INTERACTION_STATUS_KEY}`, BrowserConstants.INTERACTION_IN_PROGRESS_VALUE);
                await expect(pca.loginPopup({})).rejectedWith(BrowserAuthErrorMessage.interactionInProgress.desc);
                await expect(pca.loginPopup({})).rejectedWith(BrowserAuthError);
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
                const testIdTokenClaims: IdTokenClaims = {
                    "ver": "2.0",
                    "iss": "https://login.microsoftonline.com/9188040d-6c67-4c5b-b112-36a304b66dad/v2.0",
                    "sub": "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
                    "name": "Abe Lincoln",
                    "preferred_username": "AbeLi@microsoft.com",
                    "oid": "00000000-0000-0000-66f3-3332eca7ea81",
                    "tid": "3338040d-6c67-4c5b-b112-36a304b66dad",
                    "nonce": "123523",
                };
                const testAccount = new Account(testIdTokenClaims.oid, TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID, testIdTokenClaims, TEST_TOKENS.IDTOKEN_V2);
                const testTokenResponse: TokenResponse = {
                    uniqueId: testIdTokenClaims.oid,
                    tenantId: testIdTokenClaims.tid,
                    scopes: TEST_CONFIG.DEFAULT_SCOPES,
                    tokenType: TEST_CONFIG.TOKEN_TYPE_BEARER,
                    idToken: testServerTokenResponse.id_token,
                    idTokenClaims: testIdTokenClaims,
                    accessToken: testServerTokenResponse.access_token,
                    refreshToken: testServerTokenResponse.refresh_token,
                    expiresOn: new Date(Date.now() + (testServerTokenResponse.expires_in * 1000)),
                    account: testAccount,
                    userRequestState: ""
                };
                sinon.stub(PublicClient.prototype, "createLoginUrl").resolves(testNavUrl);
                sinon.stub(PopupHandler.prototype, "showUI").callsFake((requestUrl: string): Window => {
                    expect(requestUrl).to.be.eq(testNavUrl);
                    return window;
                });
                sinon.stub(PopupHandler.prototype, "monitorWindowForHash").resolves(TEST_HASHES.TEST_SUCCESS_CODE_HASH);
                sinon.stub(PopupHandler.prototype, "handleCodeResponse").resolves(testTokenResponse);
                const tokenResp = await pca.loginPopup({});
                expect(tokenResp).to.be.deep.eq(testTokenResponse);
            });

            it("catches error and cleans cache before rethrowing", async () => {
                const testError = "Error in creating a login url";
                window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.ORIGIN_URI}`, TEST_URIS.TEST_REDIR_URI);
                window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.REQUEST_STATE}`, RANDOM_TEST_GUID);
                window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.NONCE_IDTOKEN}${Constants.RESOURCE_DELIM}${RANDOM_TEST_GUID}`, "123523");
                sinon.stub(PublicClient.prototype, "createLoginUrl").resolves(testNavUrl);
                sinon.stub(PopupHandler.prototype, "showUI").throws(testError);
                try {
                    const tokenResp = await pca.loginPopup({});
                } catch (e) {
                    expect(window.sessionStorage).to.be.empty;
                    expect(`${e}`).to.be.eq(testError);
                }
            });
        });

        describe("acquireTokenPopup", () => {

            it("throws error if interaction is in progress", async () => {
                window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${BrowserConstants.INTERACTION_STATUS_KEY}`, BrowserConstants.INTERACTION_IN_PROGRESS_VALUE);
                await expect(pca.acquireTokenPopup({})).rejectedWith(BrowserAuthErrorMessage.interactionInProgress.desc);
                await expect(pca.acquireTokenPopup({})).rejectedWith(BrowserAuthError);
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
                const testIdTokenClaims: IdTokenClaims = {
                    "ver": "2.0",
                    "iss": "https://login.microsoftonline.com/9188040d-6c67-4c5b-b112-36a304b66dad/v2.0",
                    "sub": "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
                    "name": "Abe Lincoln",
                    "preferred_username": "AbeLi@microsoft.com",
                    "oid": "00000000-0000-0000-66f3-3332eca7ea81",
                    "tid": "3338040d-6c67-4c5b-b112-36a304b66dad",
                    "nonce": "123523",
                };
                const testAccount = new Account(testIdTokenClaims.oid, TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID, testIdTokenClaims, TEST_TOKENS.IDTOKEN_V2);
                const testTokenResponse: TokenResponse = {
                    uniqueId: testIdTokenClaims.oid,
                    tenantId: testIdTokenClaims.tid,
                    scopes: TEST_CONFIG.DEFAULT_SCOPES,
                    tokenType: TEST_CONFIG.TOKEN_TYPE_BEARER,
                    idToken: testServerTokenResponse.id_token,
                    idTokenClaims: testIdTokenClaims,
                    accessToken: testServerTokenResponse.access_token,
                    refreshToken: testServerTokenResponse.refresh_token,
                    expiresOn: new Date(Date.now() + (testServerTokenResponse.expires_in * 1000)),
                    account: testAccount,
                    userRequestState: ""
                };
                sinon.stub(PublicClient.prototype, "createAcquireTokenUrl").resolves(testNavUrl);
                sinon.stub(PopupHandler.prototype, "showUI").callsFake((requestUrl: string): Window => {
                    expect(requestUrl).to.be.eq(testNavUrl);
                    return window;
                });
                sinon.stub(PopupHandler.prototype, "monitorWindowForHash").resolves(TEST_HASHES.TEST_SUCCESS_CODE_HASH);
                sinon.stub(PopupHandler.prototype, "handleCodeResponse").resolves(testTokenResponse);
                const tokenResp = await pca.acquireTokenPopup({
                    scopes: TEST_CONFIG.DEFAULT_SCOPES
                });
                expect(tokenResp).to.be.deep.eq(testTokenResponse);
            });

            it("catches error and cleans cache before rethrowing", async () => {
                const testError = "Error in creating a login url";
                window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.ORIGIN_URI}`, TEST_URIS.TEST_REDIR_URI);
                window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.REQUEST_STATE}`, RANDOM_TEST_GUID);
                window.sessionStorage.setItem(`${Constants.CACHE_PREFIX}.${TEST_CONFIG.MSAL_CLIENT_ID}.${TemporaryCacheKeys.NONCE_IDTOKEN}${Constants.RESOURCE_DELIM}${RANDOM_TEST_GUID}`, "123523");
                sinon.stub(PublicClient.prototype, "createAcquireTokenUrl").resolves(testNavUrl);
                sinon.stub(PopupHandler.prototype, "showUI").throws(testError);
                try {
                    const tokenResp = await pca.acquireTokenPopup({
                        scopes: TEST_CONFIG.DEFAULT_SCOPES
                    });
                } catch (e) {
                    expect(window.sessionStorage).to.be.empty;
                    expect(`${e}`).to.be.eq(testError);
                }
            });
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
            const testIdTokenClaims: IdTokenClaims = {
                "ver": "2.0",
                "iss": "https://login.microsoftonline.com/9188040d-6c67-4c5b-b112-36a304b66dad/v2.0",
                "sub": "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
                "name": "Abe Lincoln",
                "preferred_username": "AbeLi@microsoft.com",
                "oid": "00000000-0000-0000-66f3-3332eca7ea81",
                "tid": "3338040d-6c67-4c5b-b112-36a304b66dad",
                "nonce": "123523",
            };
            const testAccount = new Account(testIdTokenClaims.oid, TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID, testIdTokenClaims, TEST_TOKENS.IDTOKEN_V2);
            const testTokenResponse: TokenResponse = {
                uniqueId: testIdTokenClaims.oid,
                tenantId: testIdTokenClaims.tid,
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                tokenType: TEST_CONFIG.TOKEN_TYPE_BEARER,
                idToken: testServerTokenResponse.id_token,
                idTokenClaims: testIdTokenClaims,
                accessToken: testServerTokenResponse.access_token,
                refreshToken: testServerTokenResponse.refresh_token,
                expiresOn: new Date(Date.now() + (testServerTokenResponse.expires_in * 1000)),
                account: testAccount,
                userRequestState: ""
            };
            sinon.stub(PublicClient.prototype, "renewToken").resolves(testTokenResponse);
            const tokenResp = await pca.acquireTokenSilent({
                scopes: TEST_CONFIG.DEFAULT_SCOPES
            });
            expect(tokenResp).to.be.deep.eq(testTokenResponse);
        });

        it("throws error that renewToken throws", async () => {
            const testError = "Error in creating a login url";
            sinon.stub(PublicClient.prototype, "renewToken").throws(testError);
            try {
                const tokenResp = await pca.acquireTokenSilent({
                    scopes: TEST_CONFIG.DEFAULT_SCOPES
                });
            } catch (e) {
                expect(`${e}`).to.contain(testError);
                expect(window.sessionStorage).to.be.empty;
            }
        });
    });

    describe("logout", () => {

        it("passes logoutUri from authModule to window nav util", () => {
            sinon.stub(PublicClient.prototype, "logout").resolves(testLogoutUrl);
            sinon.stub(BrowserUtils, "navigateWindow").callsFake((urlNavigate: string, noHistory: boolean) => {
                expect(urlNavigate).to.be.eq(testLogoutUrl);
                console.log(noHistory);
            });
            pca.logout();
        });
    });

    describe("Getters and Setters Unit Tests", () => {

        let pca_alternate_redirUris = new PublicClientApplication({
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                redirectUri: TEST_URIS.TEST_ALTERNATE_REDIR_URI,
                postLogoutRedirectUri: TEST_URIS.TEST_LOGOUT_URI
            }
        });

        it("getRedirectUri returns the currently configured redirect uri", () => {
            expect(pca.getRedirectUri()).to.be.eq(TEST_URIS.TEST_REDIR_URI);
            expect(pca_alternate_redirUris.getRedirectUri()).to.be.eq(TEST_URIS.TEST_ALTERNATE_REDIR_URI);
        });

        it("getPostLogoutRedirectUri returns the currently configured post logout redirect uri", () => {
            expect(pca.getPostLogoutRedirectUri()).to.be.eq(TEST_URIS.TEST_REDIR_URI);
            expect(pca_alternate_redirUris.getPostLogoutRedirectUri()).to.be.eq(TEST_URIS.TEST_LOGOUT_URI);
        });
    });
});
