import * as Mocha from "mocha";
import { expect } from "chai";
import {
    UserAgentApplication,
    Constants,
    AuthenticationParameters,
    Account,
    Configuration,
    AuthError,
    ClientAuthError,
    ClientConfigurationError,
    ServerError,
    Authority,
    AuthResponse,
    InteractionRequiredAuthError,
    Logger,
    CryptoUtils,
    LogLevel
} from "../src/index";
import sinon from "sinon";
import { AuthCache } from "../src/cache/AuthCache";
import { AccessTokenKey } from "../src/cache/AccessTokenKey";
import { AccessTokenValue } from "../src/cache/AccessTokenValue";
import { SSOTypes, TemporaryCacheKeys, PersistentCacheKeys, ServerHashParamKeys } from "../src/utils/Constants";
import { ClientAuthErrorMessage } from "../src/error/ClientAuthError";
import { ClientConfigurationErrorMessage } from "../src/error/ClientConfigurationError";
import { InteractionRequiredAuthErrorMessage } from "../src/error/InteractionRequiredAuthError";
import { TEST_URIS, TEST_DATA_CLIENT_INFO, testHashesForState, TEST_TOKENS, TEST_CONFIG, TEST_TOKEN_LIFETIMES, TEST_ERROR, TEST_AUTH_PARAMS, VALID_OPENID_CONFIGURATION_RESPONSE } from "./TestConstants";
import { setAuthInstanceStubs } from "./TestUtils";
import { IdToken } from "../src/IdToken";
import { TimeUtils } from "../src/utils/TimeUtils";
import { RequestUtils } from "../src/utils/RequestUtils";
import { UrlUtils } from "../src/utils/UrlUtils";
import { TrustedAuthority } from "../src/authority/TrustedAuthority";

describe("UserAgentApplication.ts Class", function () {
    // Test state params
    sinon.stub(TimeUtils, "now").returns(TEST_TOKEN_LIFETIMES.BASELINE_DATE_CHECK);
 
    const TEST_LIBRARY_STATE = RequestUtils.generateLibraryState(Constants.interactionTypeRedirect);

    const oldWindowLocation = window.location;

    let msal: UserAgentApplication;

    const authCallback = function (error: AuthError, response: AuthResponse) {
        if (error) {
            console.error(error);
        } else {
            console.log(response);
        }
    };

    const tokenReceivedCallback = function (response: AuthResponse) {
        console.log(response);
    };

    const errorReceivedCallback = function (error: AuthError, state: string) {
        if (error) {
            console.error(error);
        } else {
            console.log(state);
        }
    };

    let cacheStorage: AuthCache;
    let accessTokenKey : AccessTokenKey;
    let accessTokenValue : AccessTokenValue;
    let idTokenKey : AccessTokenKey;
    let idToken: AccessTokenValue;
    let account : Account;
    let config: Configuration;

    const setTestCacheItems = function () {
        accessTokenKey = {
            authority: TEST_CONFIG.VALID_AUTHORITY,
            clientId: "0813e1d1-ad72-46a9-8665-399bba48c201",
            scopes: "s1",
            homeAccountIdentifier: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID
        };
        accessTokenValue = {
            accessToken: TEST_TOKENS.ACCESSTOKEN,
            idToken: TEST_TOKENS.IDTOKEN_V2,
            expiresIn: "150000000000000",
            homeAccountIdentifier: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID
        };
        account = {
            accountIdentifier: "1234",
            environment: "js",
            homeAccountIdentifier: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
            idToken: new IdToken(TEST_TOKENS.IDTOKEN_V2).claims,
            idTokenClaims: new IdToken(TEST_TOKENS.IDTOKEN_V2).claims,
            name: "Abe Lincoln",
            sid: "123451435",
            userName: "AbeLi@microsoft.com"
        };

        idTokenKey = {
            authority: TEST_CONFIG.VALID_AUTHORITY,
            clientId: "0813e1d1-ad72-46a9-8665-399bba48c201",
            scopes: undefined,
            homeAccountIdentifier: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID
        }

        idToken = {
            accessToken: null,
            idToken: TEST_TOKENS.IDTOKEN_V2,
            expiresIn: "150000000000000",
            homeAccountIdentifier: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID
        };
    };

    describe("Telemetry in UserAgentApplication", () => {
        it("configure telemtry in UAA happy case smoke test", () => {
            msal = new UserAgentApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID
                },
                system: {
                    telemetry: {
                        applicationName: TEST_CONFIG.APPLICATION_NAME,
                        applicationVersion: TEST_CONFIG.APPLICATION_VERSION,
                        telemetryEmitter: event => {}
                    }
                }
            });
        });
        it("configure telemtry in UAA missing configuration throws config error", () => {
            cacheStorage = new AuthCache(TEST_CONFIG.MSAL_CLIENT_ID, "sessionStorage", true);
            const configureTestCase = () => msal = new UserAgentApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                },
                system: {
                    // @ts-ignore
                    telemetry: {
                        applicationName: TEST_CONFIG.APPLICATION_NAME,
                        applicationVersion: TEST_CONFIG.APPLICATION_VERSION,
                    }
                }
            });
            expect(configureTestCase).to.throw(ClientConfigurationError);
        });
        it("non stubbed telemetry manager exists in UAA when configured", () => {
            msal = new UserAgentApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID
                },
                system: {
                    telemetry: {
                        applicationName: TEST_CONFIG.APPLICATION_NAME,
                        applicationVersion: TEST_CONFIG.APPLICATION_VERSION,
                        telemetryEmitter: event => {}
                    }
                }
            });
            // @ts-ignore
            expect(msal.telemetryManager).to.not.be.undefined;
            // @ts-ignore
            expect(msal.telemetryManager).to.not.be.null;
            // @ts-ignore
            expect(msal.telemetryManager.telemetryPlatform.applicationName).to.eq(TEST_CONFIG.APPLICATION_NAME);
        });
        it("stubbed telemetry manager exists in UAA when not configured", () => {
            msal = new UserAgentApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID
                }
            });
            // @ts-ignore
            expect(msal.telemetryManager).to.not.be.undefined;
            // @ts-ignore
            expect(msal.telemetryManager).to.not.be.null;
            // @ts-ignore
            expect(msal.telemetryManager.telemetryPlatform.applicationName).to.eq("UnSetStub");
        });
    });

    describe("Redirect Flow Unit Tests", function () {
        beforeEach(function() {
            cacheStorage = new AuthCache(TEST_CONFIG.MSAL_CLIENT_ID, "sessionStorage", true);
            const config: Configuration = {
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                    redirectUri: TEST_URIS.TEST_REDIR_URI
                }
            };
            msal = new UserAgentApplication(config);
            setAuthInstanceStubs(msal);
            setTestCacheItems();

            delete window.location;
        });

        afterEach(function () {
            cacheStorage.clear();
            sinon.restore();
            window.location = oldWindowLocation;
        });

        it("throws error if null argument is passed to either argument of setRedirectCallbacks", (done) => {
            expect(() => msal.handleRedirectCallback(null)).to.throw(ClientConfigurationError);
            done();
        });

        it("navigates user to redirectURI passed in the request config", (done) => {
            window.location = {
                ...oldWindowLocation,
                assign: function (url) {
                    try {
                        expect(url).to.include(TEST_URIS.DEFAULT_INSTANCE + TEST_CONFIG.TENANT + "oauth2/v2.0/authorize?response_type=id_token&scope=openid%20profile");
                        expect(url).to.include("&client_id=" + TEST_CONFIG.MSAL_CLIENT_ID);
                        expect(url).to.include("&redirect_uri=" + encodeURIComponent("http://localhost:3000"));
                        expect(url).to.include("&state");
                        expect(url).to.include("&client_info=1");
                        done();
                    } catch (e) {
                        console.error(e);
                    }
                }
            };
            msal.handleRedirectCallback(authCallback);
            expect(msal.getRedirectUri()).to.be.equal(TEST_URIS.TEST_REDIR_URI);

            const request: AuthenticationParameters = { redirectUri: "http://localhost:3000" };
            msal.loginRedirect(request);
        });

        it("state in returned hash contains expected fields", (done) => {
            window.location = {
                ...oldWindowLocation,
                assign: function (url) {
                    try {
                        expect(url).to.include("&state");
                        let hash = UrlUtils.getHashFromUrl(url);
                        let state = UrlUtils.deserializeHash(hash).state;
                        let decodedState = CryptoUtils.base64Decode(state);
                        let stateObj = JSON.parse(decodedState);

                        expect(stateObj).to.include.keys("id");
                        expect(stateObj).to.include.keys("ts");
                        expect(stateObj).to.include.keys("method");
                        expect(stateObj.method).to.equal(Constants.interactionTypeRedirect);

                        done();
                    } catch (e) {
                        console.error(e);
                    }
                }
            };
            msal.handleRedirectCallback(authCallback);
            expect(msal.getRedirectUri()).to.be.equal(TEST_URIS.TEST_REDIR_URI);

            const request: AuthenticationParameters = { redirectUri: "http://localhost:3000" };
            msal.loginRedirect(request);
        });

        it("navigates user to login and prompt parameter is not passed by default", (done) => {
            window.location = {
                ...oldWindowLocation,
                assign: function (url) {
                    try {
                        expect(url).to.include(TEST_URIS.DEFAULT_INSTANCE + TEST_CONFIG.TENANT + "oauth2/v2.0/authorize?response_type=id_token&scope=openid%20profile");
                        expect(url).to.include("&client_id=" + TEST_CONFIG.MSAL_CLIENT_ID);
                        expect(url).to.include("&redirect_uri=" + encodeURIComponent(msal.getRedirectUri()));
                        expect(url).to.include("&state");
                        expect(url).to.include("&client_info=1");
                        expect(url).not.to.include(Constants.prompt_select_account);
                        expect(url).not.to.include(Constants.prompt_none);
                        done();
                    } catch (e) {
                        console.error(e);
                    }
                }
            };
            msal.handleRedirectCallback(authCallback);
            expect(msal.getRedirectUri()).to.be.equal(TEST_URIS.TEST_REDIR_URI);
            msal.loginRedirect({});
        });

        it("navigates user to login and prompt=select_account parameter is passed in request", (done) => {
            window.location = {
                ...oldWindowLocation,
                assign: function (url) {
                    try {
                        expect(url).to.include(TEST_URIS.DEFAULT_INSTANCE + TEST_CONFIG.TENANT + "oauth2/v2.0/authorize?response_type=id_token&scope=openid%20profile");
                        expect(url).to.include("&client_id=" + TEST_CONFIG.MSAL_CLIENT_ID);
                        expect(url).to.include("&redirect_uri=" + encodeURIComponent(msal.getRedirectUri()));
                        expect(url).to.include("&state");
                        expect(url).to.include("&client_info=1");
                        expect(url).to.include(Constants.prompt_select_account);
                        expect(url).not.to.include(Constants.prompt_none);
                        done();
                    } catch (e) {
                        console.error(e);
                    }
                }
            };
            msal.handleRedirectCallback(authCallback);
            expect(msal.getRedirectUri()).to.be.equal(TEST_URIS.TEST_REDIR_URI);

            const request: AuthenticationParameters = { prompt: "select_account" };
            msal.loginRedirect(request);
        });

        it("navigates user to login and prompt=none parameter is passed in request", (done) => {
            window.location = {
                ...oldWindowLocation,
                assign: function (url) {
                    try {
                        expect(url).to.include(TEST_URIS.DEFAULT_INSTANCE + TEST_CONFIG.TENANT + "oauth2/v2.0/authorize?response_type=id_token&scope=openid%20profile");
                        expect(url).to.include("&client_id=" + TEST_CONFIG.MSAL_CLIENT_ID);
                        expect(url).to.include("&redirect_uri=" + encodeURIComponent(msal.getRedirectUri()));
                        expect(url).to.include("&state");
                        expect(url).to.include("&client_info=1");
                        expect(url).not.to.include(Constants.prompt_select_account);
                        expect(url).to.include(Constants.prompt_none);
                        done();
                    } catch (e) {
                        console.error(e);
                    }
                }
            };
            msal.handleRedirectCallback(authCallback);
            expect(msal.getRedirectUri()).to.be.equal(TEST_URIS.TEST_REDIR_URI);

            const request: AuthenticationParameters = { prompt: "none" };
            msal.loginRedirect(request);
        });

        it("tests if hint parameters are added when account object is passed in request", function (done) {
            const accountObj: Account = {
                homeAccountIdentifier: "MTIzNA==.NTY3OA==",
                accountIdentifier: "1234",
                userName: "some_id",
                name: null,
                idToken: null,
                idTokenClaims: null,
                sid: null,
                environment: null
            };
            window.location = {
                ...oldWindowLocation,
                assign: function (url) {
                    try {
                        expect(url).to.include(TEST_URIS.DEFAULT_INSTANCE + TEST_CONFIG.TENANT + "oauth2/v2.0/authorize?response_type=id_token&scope=openid%20profile");
                        expect(url).to.include("&client_id=" + TEST_CONFIG.MSAL_CLIENT_ID);
                        expect(url).to.include("&redirect_uri=" + encodeURIComponent(msal.getRedirectUri()));
                        expect(url).to.include("&state");
                        expect(url).to.include("&client_info=1");
                        expect(url).to.include("&login_hint=" + "some_id");
                        expect(url).to.not.include("&domain_hint");
                        expect(url).to.include(Constants.prompt_select_account);
                        expect(url).to.not.include(Constants.prompt_none);
                        done();
                    } catch (e) {
                        console.error(e);
                    }
                }
            };
            msal.handleRedirectCallback(authCallback);
            expect(msal.getRedirectUri()).to.be.equal(TEST_URIS.TEST_REDIR_URI);
            const tokenRequest: AuthenticationParameters = {
                prompt: "select_account",
                account: accountObj
            };
            msal.loginRedirect(tokenRequest);
        });

        it("tests that claims is added to the url when passed in request object", function (done) {
            const claimsRequestObj: any = {
                "accessToken": {
                    "test": null
                }
            };
            const tokenRequest: AuthenticationParameters = {
                claimsRequest: JSON.stringify(claimsRequestObj)
            };
            window.location = {
                ...oldWindowLocation,
                assign: function (url) {
                    try {
                        expect(url).to.include(TEST_URIS.DEFAULT_INSTANCE + TEST_CONFIG.TENANT + "oauth2/v2.0/authorize?response_type=id_token&scope=openid%20profile");
                        expect(url).to.include("&client_id=" + TEST_CONFIG.MSAL_CLIENT_ID);
                        expect(url).to.include("&redirect_uri=" + encodeURIComponent(msal.getRedirectUri()));
                        expect(url).to.include("&state");
                        expect(url).to.include("&client_info=1");
                        expect(url).to.include("&claims=" + encodeURIComponent(tokenRequest.claimsRequest));
                        done();
                    } catch (e) {
                        console.error(e);
                    }
                }
            };
            msal.handleRedirectCallback(tokenReceivedCallback, errorReceivedCallback);
            expect(msal.getRedirectUri()).to.be.equal(TEST_URIS.TEST_REDIR_URI);
            msal.loginRedirect(tokenRequest);
        });

        it("tests that claims is added to the url when passed in extraQueryParameters", function (done) {
            const claimsRequestObj: any = {
                "accessToken": {
                    "test": null
                }
            };
            const tokenRequest: AuthenticationParameters = {
                extraQueryParameters: {
                    claims: JSON.stringify(claimsRequestObj)
                }
            };
            window.location = {
                ...oldWindowLocation,
                assign: function (url) {
                    try {
                        expect(url).to.include(TEST_URIS.DEFAULT_INSTANCE + TEST_CONFIG.TENANT + "oauth2/v2.0/authorize?response_type=id_token&scope=openid%20profile");
                        expect(url).to.include("&client_id=" + TEST_CONFIG.MSAL_CLIENT_ID);
                        expect(url).to.include("&redirect_uri=" + encodeURIComponent(msal.getRedirectUri()));
                        expect(url).to.include("&state");
                        expect(url).to.include("&client_info=1");
                        expect(url).to.include("&claims=" + encodeURIComponent(tokenRequest.extraQueryParameters.claims));
                        done();
                    } catch (e) {
                        console.error(e);
                    }
                }
            };
            msal.handleRedirectCallback(tokenReceivedCallback, errorReceivedCallback);
            expect(msal.getRedirectUri()).to.be.equal(TEST_URIS.TEST_REDIR_URI);
            msal.loginRedirect(tokenRequest);
        });

        it("removes claims from extraQueryParameters when passed in extraQueryParameters and request object", function (done) {
            const claimsRequestObj: any = {
                "accessToken": {
                    "test": null
                }
            };
            const claimsRequestObj2: any = {
                "accessToken": {
                    "test2": null
                }
            };
            const tokenRequest: AuthenticationParameters = {
                claimsRequest: JSON.stringify(claimsRequestObj),
                extraQueryParameters: {
                    claims: JSON.stringify(claimsRequestObj2)
                }
            };
            window.location = {
                ...oldWindowLocation,
                assign: function (url) {
                    try {
                        expect(url).to.include(TEST_URIS.DEFAULT_INSTANCE + TEST_CONFIG.TENANT + "oauth2/v2.0/authorize?response_type=id_token&scope=openid%20profile");
                        expect(url).to.include("&client_id=" + TEST_CONFIG.MSAL_CLIENT_ID);
                        expect(url).to.include("&redirect_uri=" + encodeURIComponent(msal.getRedirectUri()));
                        expect(url).to.include("&state");
                        expect(url).to.include("&client_info=1");
                        expect(url).to.include("&claims=" + encodeURIComponent(tokenRequest.claimsRequest));
                        done();
                    } catch (e) {
                        console.error(e);
                    }
                }
            };
            msal.handleRedirectCallback(tokenReceivedCallback, errorReceivedCallback);
            expect(msal.getRedirectUri()).to.be.equal(TEST_URIS.TEST_REDIR_URI);
            msal.loginRedirect(tokenRequest);
        });

        it("removes login_hint from request.extraQueryParameters", (done) => {
            const tokenRequestWithoutLoginHint: AuthenticationParameters = {
                extraQueryParameters: {
                    login_hint: JSON.stringify(TEST_CONFIG.LOGIN_HINT)
                }
            };
            window.location = {
                ...oldWindowLocation,
                assign: function (url) {
                    try {
                        expect(url).to.include(TEST_URIS.DEFAULT_INSTANCE + TEST_CONFIG.TENANT + "oauth2/v2.0/authorize?response_type=id_token&scope=openid%20profile");
                        expect(url).to.include("&client_id=" + TEST_CONFIG.MSAL_CLIENT_ID);
                        expect(url).to.include("&redirect_uri=" + encodeURIComponent(msal.getRedirectUri()));
                        expect(url).to.include("&state");
                        expect(url).to.include("&client_info=1");
                        expect(url).to.not.include("&login_hint=");
                        expect(url).to.not.include(encodeURIComponent(tokenRequestWithoutLoginHint.extraQueryParameters[SSOTypes.LOGIN_HINT]));
                        done();
                    } catch (e) {
                        console.error(e);
                    }
                }
            };
            msal.handleRedirectCallback(tokenReceivedCallback, errorReceivedCallback);
            expect(msal.getRedirectUri()).to.be.equal(TEST_URIS.TEST_REDIR_URI);
            msal.loginRedirect(tokenRequestWithoutLoginHint);
        });

        it("removes sid from request.extraQueryParameters", (done) => {
            const tokenRequestWithoutLoginHint: AuthenticationParameters = {
                extraQueryParameters: {
                    sid: JSON.stringify(TEST_CONFIG.SID)
                }
            };
            window.location = {
                ...oldWindowLocation,
                assign: function (url) {
                    try {
                        expect(url).to.include(TEST_URIS.DEFAULT_INSTANCE + TEST_CONFIG.TENANT + "oauth2/v2.0/authorize?response_type=id_token&scope=openid%20profile");
                        expect(url).to.include("&client_id=" + TEST_CONFIG.MSAL_CLIENT_ID);
                        expect(url).to.include("&redirect_uri=" + encodeURIComponent(msal.getRedirectUri()));
                        expect(url).to.include("&state");
                        expect(url).to.include("&client_info=1");
                        expect(url).to.not.include("&sid=");
                        expect(url).to.not.include(encodeURIComponent(tokenRequestWithoutLoginHint.extraQueryParameters[SSOTypes.SID]));
                        done();
                    } catch (e) {
                        console.error(e);
                    }
                }
            };
            msal.handleRedirectCallback(tokenReceivedCallback, errorReceivedCallback);
            expect(msal.getRedirectUri()).to.be.equal(TEST_URIS.TEST_REDIR_URI);
            msal.loginRedirect(tokenRequestWithoutLoginHint);
        });

        it("navigates user to redirectURI passed in constructor config", (done) => {
            window.location = {
                ...oldWindowLocation,
                assign: function (url) {
                    try {
                        expect(url).to.include(TEST_URIS.DEFAULT_INSTANCE + TEST_CONFIG.TENANT + "oauth2/v2.0/authorize?response_type=id_token&scope=openid%20profile");
                        expect(url).to.include("&client_id=" + TEST_CONFIG.MSAL_CLIENT_ID);
                        expect(url).to.include("&redirect_uri=" + encodeURIComponent(msal.getRedirectUri()));
                        expect(url).to.include("&state");
                        expect(url).to.include("&client_info=1");
                        done();
                    } catch (e) {
                        console.error(e);
                    }
                }
            };
            msal.handleRedirectCallback(authCallback);
            expect(msal.getRedirectUri()).to.be.equal(TEST_URIS.TEST_REDIR_URI);

            msal.loginRedirect({});
        });

        it("uses current location.href as redirectUri default value, even if location changed after UserAgentApplication was instantiated", (done) => {
            const config: Configuration = {
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID
                }
            };
            window.location = {
                ...oldWindowLocation,
                hash: "",
                assign: function (url) {
                    try {
                        expect(url).to.include("&redirect_uri=" + encodeURIComponent(TEST_URIS.TEST_REDIR_URI));
                        done();
                    } catch (e) {
                        console.error(e);
                    }
                }
            };
            msal = new UserAgentApplication(config);
            history.pushState(null, null, "/new_pushstate_uri");

            msal.handleRedirectCallback(authCallback);
            msal.loginRedirect({});
        });

        it("loginRedirect does not navigate if onRedirectNavigate is implemented and returns false", done => {
            const config: Configuration = {
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID
                }
            };

            window.location = {
                ...oldWindowLocation,
                hash: "",
                assign: function (url) {
                    throw new Error("window.location.assign should not be called when onRedirectNavigate returns false");
                }
            };

            msal = new UserAgentApplication(config);
            msal.handleRedirectCallback(authCallback);
            msal.loginRedirect({
                onRedirectNavigate: url => {
                    expect(url).to.be.not.null;

                    done();
                    return false;
                }
            })
        });

        it("acquireTokenRedirect does not navigate if onRedirectNavigate is implemented and returns false", done => {
            const config: Configuration = {
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID
                }
            };

            window.location = {
                ...oldWindowLocation,
                hash: "",
                assign: function (url) {
                    throw new Error("window.location.assign should not be called when onRedirectNavigate returns false");
                }
            };

            msal = new UserAgentApplication(config);
            msal.handleRedirectCallback(authCallback);
            msal.acquireTokenRedirect({
                scopes: [ "user.read" ],
                account,
                onRedirectNavigate: url => {
                    expect(url).to.be.not.null;

                    done();
                    return false;
                }
            })
        });

        it("navigates if onRedirectNavigate returns null", done => {
            const config: Configuration = {
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID
                }
            };

            window.location = {
                ...oldWindowLocation,
                hash: "",
                assign: function (url) {
                    expect(url).to.not.be.null;
                    done();
                }
            };

            msal = new UserAgentApplication(config);
            msal.handleRedirectCallback(authCallback);
            msal.loginRedirect({
                onRedirectNavigate: url => {
                    expect(url).to.be.not.null;
                }
            })
        });

        it("navigates if onRedirectNavigate returns true", done => {
            const config: Configuration = {
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID
                }
            };

            window.location = {
                ...oldWindowLocation,
                hash: "",
                assign: function (url) {
                    expect(url).to.not.be.null;
                    done();
                }
            };

            msal = new UserAgentApplication(config);
            msal.handleRedirectCallback(authCallback);
            msal.loginRedirect({
                onRedirectNavigate: url => {
                    expect(url).to.be.not.null;

                    return true
                }
            })
        });

        it("calls error callback on loginRedirect if interaction is true", function (done) {
            cacheStorage.setItem(TemporaryCacheKeys.INTERACTION_STATUS, Constants.inProgress);
            window.location = oldWindowLocation;
            const checkErrorFromLibrary = function (authErr: AuthError) {
                expect(authErr instanceof ClientAuthError).to.be.true;
                expect(authErr.errorCode).to.equal(ClientAuthErrorMessage.loginProgressError.code);
                expect(authErr.errorMessage).to.equal(ClientAuthErrorMessage.loginProgressError.desc);
                expect(authErr.message).to.equal(ClientAuthErrorMessage.loginProgressError.desc);
                expect(authErr.name).to.equal("ClientAuthError");
                expect(authErr.stack).to.include("UserAgentApplication.spec.ts");
                done();
            };
            msal.handleRedirectCallback(checkErrorFromLibrary);
            msal.loginRedirect();
        });

        it("calls error callback on acquireTokenRedirect if interaction is true", function (done) {
            cacheStorage.setItem(TemporaryCacheKeys.INTERACTION_STATUS, Constants.inProgress);
            window.location = oldWindowLocation;
            const checkErrorFromLibrary = function (authErr: AuthError) {
                expect(authErr instanceof ClientAuthError).to.be.true;
                expect(authErr.errorCode).to.equal(ClientAuthErrorMessage.acquireTokenProgressError.code);
                expect(authErr.errorMessage).to.equal(ClientAuthErrorMessage.acquireTokenProgressError.desc);
                expect(authErr.message).to.equal(ClientAuthErrorMessage.acquireTokenProgressError.desc);
                expect(authErr.name).to.equal("ClientAuthError");
                expect(authErr.stack).to.include("UserAgentApplication.spec.ts");
                done();
            };
            msal.handleRedirectCallback(checkErrorFromLibrary);
            msal.acquireTokenRedirect({scopes: [ "user.read" ]});
        });


        it("throws error on loginRedirect if interaction is true", function (done) {
            cacheStorage.setItem(TemporaryCacheKeys.INTERACTION_STATUS, Constants.inProgress);
            window.location = oldWindowLocation;
            try {
                msal.loginRedirect();
            } catch(authErr) {
                expect(authErr instanceof ClientAuthError).to.be.true;
                expect(authErr.errorCode).to.equal(ClientAuthErrorMessage.loginProgressError.code);
                expect(authErr.errorMessage).to.equal(ClientAuthErrorMessage.loginProgressError.desc);
                expect(authErr.message).to.equal(ClientAuthErrorMessage.loginProgressError.desc);
                done();
            }
        });

        it("throws error on acquireTokenRedirect if interaction is true", function (done) {
            cacheStorage.setItem(TemporaryCacheKeys.INTERACTION_STATUS, Constants.inProgress);
            window.location = oldWindowLocation;
            try {
                msal.acquireTokenRedirect({scopes: [ "user.read" ]});
            } catch(authErr) {
                expect(authErr instanceof ClientAuthError).to.be.true;
                expect(authErr.errorCode).to.equal(ClientAuthErrorMessage.acquireTokenProgressError.code);
                expect(authErr.errorMessage).to.equal(ClientAuthErrorMessage.acquireTokenProgressError.desc);
                expect(authErr.message).to.equal(ClientAuthErrorMessage.acquireTokenProgressError.desc);
                done();
            }
        });

        it("exits login function with error if invalid prompt parameter is passed", function (done) {
            let tokenRequest = {
                prompt: "random"
            };

            try {
                msal.loginRedirect(tokenRequest);
            } catch(authErr) {
                expect(authErr.errorCode).to.equal(ClientConfigurationErrorMessage.invalidPrompt.code);
                expect(authErr.errorMessage).to.contain(ClientConfigurationErrorMessage.invalidPrompt.desc);
                expect(authErr.errorMessage).to.contain(tokenRequest.prompt);
                expect(authErr.message).to.contain(ClientConfigurationErrorMessage.invalidPrompt.desc);
                expect(authErr.name).to.equal("ClientConfigurationError");
                expect(authErr.stack).to.include("UserAgentApplication.spec.ts");
                done();
            }
        });

        it("Account is cached on acquireTokenRedirect call", (done) => {
            const tokenRequest: AuthenticationParameters = {
                scopes: ["S1"], 
                account: account
            };

            window.location = {
                ...oldWindowLocation,
                assign: function (url) {
                    try {
                        const state = UrlUtils.deserializeHash(url).state;
                        const accountKey = AuthCache.generateAcquireTokenAccountKey(account.homeAccountIdentifier, state)

                        expect(cacheStorage.getItem(accountKey)).equals(JSON.stringify(account));
                        done();
                    } catch (e) {
                        console.error(e);
                    }
                }
            };

            msal.handleRedirectCallback(authCallback);
            msal.acquireTokenRedirect(tokenRequest);
        });

        it("State is cached on acquireTokenRedirect call", (done) => {
            const tokenRequest: AuthenticationParameters = {
                scopes: ["S1"], 
                account: account
            };

            window.location = {
                ...oldWindowLocation,
                assign: function (url) {
                    try {
                        const state = UrlUtils.deserializeHash(url).state;

                        expect(cacheStorage.getItem(AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.STATE_ACQ_TOKEN, `${state}`))).to.be.equal(state);
                        done();
                    } catch (e) {
                        console.error(e);
                    }
                }
            };

            msal.handleRedirectCallback(authCallback);
            msal.acquireTokenRedirect(tokenRequest);
        });

        it("LoginStartPage is cached on acquireTokenRedirect call", (done) => {
            const tokenRequest: AuthenticationParameters = {
                scopes: ["S1"], 
                account: account
            };

            window.location = {
                ...oldWindowLocation,
                assign: function (url) {
                    try {
                        const loginRequestUrl = window.location.href;
                        const state = UrlUtils.deserializeHash(url).state;

                        expect(cacheStorage.getItem(AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.LOGIN_REQUEST, `${state}`))).to.be.equal(loginRequestUrl);
                        done();
                    } catch (e) {
                        console.error(e);
                    }
                }
            };

            msal.handleRedirectCallback(authCallback);
            msal.acquireTokenRedirect(tokenRequest);
        });

        it("tests if error is thrown when null scopes are passed", function (done) {
            msal.handleRedirectCallback(authCallback);
            let authErr: AuthError;
            try {
                msal.acquireTokenRedirect({});
            } catch (e) {
                authErr = e;
            }
            expect(authErr.errorCode).to.equal(ClientConfigurationErrorMessage.scopesRequired.code);
            expect(authErr.errorMessage).to.contain(ClientConfigurationErrorMessage.scopesRequired.desc);
            expect(authErr.message).to.contain(ClientConfigurationErrorMessage.scopesRequired.desc);
            expect(authErr.name).to.equal("ClientConfigurationError");
            expect(authErr.stack).to.include("UserAgentApplication.spec.ts");
            done();
        });

        it("tests if error is thrown when empty array of scopes are passed", function (done) {
            msal.handleRedirectCallback(authCallback);
            let authErr: AuthError;
            try {
                msal.acquireTokenRedirect({
                    scopes: []
                });
            } catch (e) {
                authErr = e;
            }
            expect(authErr.errorCode).to.equal(ClientConfigurationErrorMessage.emptyScopes.code);
            expect(authErr.errorMessage).to.contain(ClientConfigurationErrorMessage.emptyScopes.desc);
            expect(authErr.message).to.contain(ClientConfigurationErrorMessage.emptyScopes.desc);
            expect(authErr.name).to.equal("ClientConfigurationError");
            expect(authErr.stack).to.include("UserAgentApplication.spec.ts");
            done();
        });

        it("throws an error if configured with a null request", () => {
            let correctError;
            try {
                // @ts-ignore
                msal.acquireTokenRedirect();
            } catch (e) {
                expect(e).to.be.instanceOf(ClientConfigurationError);
                correctError = true;
            }
            expect(correctError).to.be.true;
        });
    });

    describe("Different Callback Signatures", function () {

        beforeEach(function () {
            cacheStorage = new AuthCache(TEST_CONFIG.MSAL_CLIENT_ID, "sessionStorage", true);
            config = {
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                    redirectUri: TEST_URIS.TEST_REDIR_URI,
                    navigateToLoginRequestUrl: false
                }
            };

            setAuthInstanceStubs(msal);
            setTestCacheItems();
        });

        afterEach(function() {
            window.location.hash = "";
            config = {auth: {clientId: ""}};
            cacheStorage.clear();
            sinon.restore();
        });

        it("Calls the error callback if two callbacks are sent", function (done) {
            window.location.hash = testHashesForState(TEST_LIBRARY_STATE).TEST_ERROR_HASH + TEST_CONFIG.STATE_NUM;
            cacheStorage.setItem(AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.STATE_LOGIN, `${TEST_LIBRARY_STATE}|${TEST_CONFIG.STATE_NUM}`), `${TEST_LIBRARY_STATE}|${TEST_CONFIG.STATE_NUM}`);

            msal = new UserAgentApplication(config);

            const checkErrorFromServer = function(error: AuthError, accountState: string) {
                expect(cacheStorage.getItem(TemporaryCacheKeys.URL_HASH)).to.be.null;
                expect(error instanceof ServerError).to.be.true;
                expect(error.name).to.include("ServerError");
                expect(error.errorCode).to.include(TEST_ERROR.CODE);
                expect(error.errorMessage).to.include(TEST_ERROR.DESCRIPTION);
                expect(error.message).to.include(TEST_ERROR.DESCRIPTION);
                expect(error.stack).to.include("UserAgentApplication.spec.ts");
                done();
            };
            msal.handleRedirectCallback(tokenReceivedCallback, checkErrorFromServer);
        });

        it("Calls the token callback if two callbacks are sent", function (done) {
            cacheStorage.setItem(AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.STATE_LOGIN, `${TEST_LIBRARY_STATE}|${TEST_CONFIG.STATE_NUM}`), `${TEST_LIBRARY_STATE}|${TEST_CONFIG.STATE_NUM}`);
            cacheStorage.setItem(AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.NONCE_IDTOKEN, `${TEST_LIBRARY_STATE}|${TEST_CONFIG.STATE_NUM}`), TEST_AUTH_PARAMS.NONCE);
            window.location.hash = testHashesForState(TEST_LIBRARY_STATE).TEST_SUCCESS_ID_TOKEN_HASH + TEST_CONFIG.STATE_NUM;

            msal = new UserAgentApplication(config);

            const checkResponseFromServer = function(response: AuthResponse) {
                expect(cacheStorage.getItem(TemporaryCacheKeys.URL_HASH)).to.be.null;
                expect(response.uniqueId).to.be.eq(TEST_AUTH_PARAMS.UNIQUE_ID);
                expect(response.tokenType).to.be.eq(ServerHashParamKeys.ID_TOKEN);
                expect(response.tenantId).to.be.eq(TEST_CONFIG.MSAL_TENANT_ID);
                expect(response.accountState).to.include(TEST_CONFIG.STATE_NUM);
                done();
            };
            msal.handleRedirectCallback(checkResponseFromServer, errorReceivedCallback);
        });

        it("Calls the response callback if single callback is sent", function (done) {
            cacheStorage.setItem(AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.STATE_LOGIN, `${TEST_LIBRARY_STATE}|${TEST_CONFIG.STATE_NUM}`), `${TEST_LIBRARY_STATE}|${TEST_CONFIG.STATE_NUM}`);
            cacheStorage.setItem(AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.NONCE_IDTOKEN, `${TEST_LIBRARY_STATE}|${TEST_CONFIG.STATE_NUM}`), TEST_AUTH_PARAMS.NONCE);
            window.location.hash = testHashesForState(TEST_LIBRARY_STATE).TEST_SUCCESS_ID_TOKEN_HASH + TEST_CONFIG.STATE_NUM;

            msal = new UserAgentApplication(config);

            const checkResponseFromServer = function(error: AuthError, response: AuthResponse) {
                expect(cacheStorage.getItem(TemporaryCacheKeys.URL_HASH)).to.be.null;
                expect(response.uniqueId).to.be.eq(TEST_AUTH_PARAMS.UNIQUE_ID);
                expect(response.tokenType).to.be.eq(ServerHashParamKeys.ID_TOKEN);
                expect(response.tenantId).to.be.eq(TEST_CONFIG.MSAL_TENANT_ID);
                expect(response.accountState).to.include(TEST_CONFIG.STATE_NUM);
                done();
            };
            msal.handleRedirectCallback(checkResponseFromServer);
        });

        it("Hash is processed in redirect case even if in popup or new tab", function (done) {
            const oldWindowOpener = window.opener;
            window.opener = "different_window";

            cacheStorage.setItem(AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.STATE_LOGIN, `${TEST_LIBRARY_STATE}|${TEST_CONFIG.STATE_NUM}`), `${TEST_LIBRARY_STATE}|${TEST_CONFIG.STATE_NUM}`);
            cacheStorage.setItem(AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.NONCE_IDTOKEN, `${TEST_LIBRARY_STATE}|${TEST_CONFIG.STATE_NUM}`), TEST_AUTH_PARAMS.NONCE);
            window.location.hash = testHashesForState(TEST_LIBRARY_STATE).TEST_SUCCESS_ID_TOKEN_HASH + TEST_CONFIG.STATE_NUM;

            msal = new UserAgentApplication(config);

            const checkResponseFromServer = function(error: AuthError, response: AuthResponse) {
                expect(cacheStorage.getItem(TemporaryCacheKeys.URL_HASH)).to.be.null;
                expect(response.uniqueId).to.be.eq(TEST_AUTH_PARAMS.UNIQUE_ID);
                expect(response.tokenType).to.be.eq(ServerHashParamKeys.ID_TOKEN);
                expect(response.tenantId).to.be.eq(TEST_CONFIG.MSAL_TENANT_ID);
                expect(response.accountState).to.include(TEST_CONFIG.STATE_NUM);
                done();
            };
            msal.handleRedirectCallback(checkResponseFromServer);
            expect(window.location.hash).to.be.equal("");
            window.opener = oldWindowOpener;
        });

        it("Hash is not processed in popup case" , function () {
            const oldWindowOpener = window.opener;
            window.opener = "different_window";
            const TEST_LIBRARY_STATE_POPUP = RequestUtils.generateLibraryState(Constants.interactionTypePopup)

            cacheStorage.setItem(AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.STATE_LOGIN, `${TEST_LIBRARY_STATE_POPUP}|${TEST_CONFIG.STATE_NUM}`), `${TEST_LIBRARY_STATE_POPUP}|${TEST_CONFIG.STATE_NUM}`);
            cacheStorage.setItem(AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.NONCE_IDTOKEN, `${TEST_LIBRARY_STATE_POPUP}|${TEST_CONFIG.STATE_NUM}`), TEST_AUTH_PARAMS.NONCE);
            window.location.hash = testHashesForState(TEST_LIBRARY_STATE_POPUP).TEST_SUCCESS_ID_TOKEN_HASH + TEST_CONFIG.STATE_NUM;

            let hashBeforeProcessing = window.location.hash;
            let callbackExecuted = false
            msal = new UserAgentApplication(config);

            const checkResponseFromServer = function(error: AuthError, response: AuthResponse) {
                callbackExecuted = true;
            };

            msal.handleRedirectCallback(checkResponseFromServer);

            expect(callbackExecuted).to.be.false;
            expect(window.location.hash).to.be.equal(hashBeforeProcessing);
            window.opener = oldWindowOpener;
        });
    });

    describe("Processing Authentication Responses", function() {

        beforeEach(function () {
            cacheStorage = new AuthCache(TEST_CONFIG.MSAL_CLIENT_ID, "sessionStorage", true);
            config = {
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                    redirectUri: TEST_URIS.TEST_REDIR_URI,
                    navigateToLoginRequestUrl: false
                }
            };

            setAuthInstanceStubs(msal);
            setTestCacheItems();
            
            delete window.location;
            window.location = {
                ...oldWindowLocation
            };
        });

        afterEach(function() {
            config = {auth: {clientId: ""}};
            cacheStorage.clear();
            sinon.restore();
        });

        it("tests saveTokenForHash in case of response", function(done) {
            const successHash = testHashesForState(TEST_LIBRARY_STATE).TEST_SUCCESS_ID_TOKEN_HASH + TEST_CONFIG.STATE_NUM;

            window.location.hash = successHash;
            cacheStorage.setItem(AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.STATE_LOGIN, `${TEST_LIBRARY_STATE}|${TEST_CONFIG.STATE_NUM}`), `${TEST_LIBRARY_STATE}|${TEST_CONFIG.STATE_NUM}`);
            cacheStorage.setItem(AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.NONCE_IDTOKEN, `${TEST_LIBRARY_STATE}|${TEST_CONFIG.STATE_NUM}`), TEST_AUTH_PARAMS.NONCE);

            msal = new UserAgentApplication(config);

            const checkRespFromServer = function(response: AuthResponse) {
                expect(response.uniqueId).to.be.eq(TEST_AUTH_PARAMS.UNIQUE_ID);
                expect(response.tokenType).to.be.eq(ServerHashParamKeys.ID_TOKEN);
                expect(response.tenantId).to.be.eq(TEST_CONFIG.MSAL_TENANT_ID);
                expect(response.accountState).to.be.eq(TEST_CONFIG.STATE_NUM);
                expect(cacheStorage.getItem(TemporaryCacheKeys.URL_HASH)).to.be.null;
                done();
            };
            msal.handleRedirectCallback(checkRespFromServer, errorReceivedCallback);
        });

        it("tests navigation to loginRequestUrl after first redirect", function(done) {
            config.auth.navigateToLoginRequestUrl = true;
            const loginStartPage = "http://localhost:8081/test/"
            const successHash = testHashesForState(TEST_LIBRARY_STATE).TEST_SUCCESS_ID_TOKEN_HASH + TEST_CONFIG.STATE_NUM;

            window.location = {
                ...oldWindowLocation,
                assign: function (url) {
                    try {
                        expect(url).to.equal(loginStartPage + successHash);
                        done();
                    } catch (e) {
                        console.error(e);
                    }
                },
                href: "http://localhost:8081/"
            };

            sinon.stub(window, "parent").returns(window);

            window.location.hash = successHash;
            cacheStorage.setItem(AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.LOGIN_REQUEST, `${TEST_LIBRARY_STATE}|${TEST_CONFIG.STATE_NUM}`), loginStartPage);
            cacheStorage.setItem(AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.STATE_LOGIN, `${TEST_LIBRARY_STATE}|${TEST_CONFIG.STATE_NUM}`), `${TEST_LIBRARY_STATE}|${TEST_CONFIG.STATE_NUM}`);
            cacheStorage.setItem(AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.NONCE_IDTOKEN, `${TEST_LIBRARY_STATE}|${TEST_CONFIG.STATE_NUM}`), TEST_AUTH_PARAMS.NONCE);

            msal = new UserAgentApplication(config);
        });

        it("tests navigation to loginRequestUrl after first redirect", function(done) {
            config.auth.navigateToLoginRequestUrl = true;
            const baseStartUrl = "http://localhost:8081/test/"
            const loginStartPage = baseStartUrl + "#testHash"
            const successHash = testHashesForState(TEST_LIBRARY_STATE).TEST_SUCCESS_ID_TOKEN_HASH + TEST_CONFIG.STATE_NUM;

            window.location = {
                ...oldWindowLocation,
                assign: function (url) {
                    try {
                        expect(url).to.equal(baseStartUrl + successHash);
                        done();
                    } catch (e) {
                        console.error(e);
                    }
                },
                href: "http://localhost:8081/"
            };

            sinon.stub(window, "parent").returns(window);

            window.location.hash = successHash;
            cacheStorage.setItem(AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.LOGIN_REQUEST, `${TEST_LIBRARY_STATE}|${TEST_CONFIG.STATE_NUM}`), loginStartPage);
            cacheStorage.setItem(AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.STATE_LOGIN, `${TEST_LIBRARY_STATE}|${TEST_CONFIG.STATE_NUM}`), `${TEST_LIBRARY_STATE}|${TEST_CONFIG.STATE_NUM}`);
            cacheStorage.setItem(AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.NONCE_IDTOKEN, `${TEST_LIBRARY_STATE}|${TEST_CONFIG.STATE_NUM}`), TEST_AUTH_PARAMS.NONCE);

            msal = new UserAgentApplication(config);
        });

        it("tests navigation to loginRequestUrl inc. user querystring after first redirect", function(done) {
            config.auth.navigateToLoginRequestUrl = true;
            const baseStartUrl = "http://localhost:8081/test/"
            const loginStartPage = baseStartUrl + "?testKey=testVal"
            const successHash = testHashesForState(TEST_LIBRARY_STATE).TEST_SUCCESS_ID_TOKEN_HASH + TEST_CONFIG.STATE_NUM;

            window.location = {
                ...oldWindowLocation,
                assign: function (url) {
                    try {
                        expect(url).to.equal(loginStartPage + successHash);
                        done();
                    } catch (e) {
                        console.error(e);
                    }
                },
                href: "http://localhost:8081/"
            };

            sinon.stub(window, "parent").returns(window);

            window.location.hash = successHash;
            cacheStorage.setItem(AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.LOGIN_REQUEST, `${TEST_LIBRARY_STATE}|${TEST_CONFIG.STATE_NUM}`), loginStartPage);
            cacheStorage.setItem(AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.STATE_LOGIN, `${TEST_LIBRARY_STATE}|${TEST_CONFIG.STATE_NUM}`), `${TEST_LIBRARY_STATE}|${TEST_CONFIG.STATE_NUM}`);
            cacheStorage.setItem(AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.NONCE_IDTOKEN, `${TEST_LIBRARY_STATE}|${TEST_CONFIG.STATE_NUM}`), TEST_AUTH_PARAMS.NONCE);

            msal = new UserAgentApplication(config);
        });

        it("tests user hash is added back to url on final page and token response is cached", function() {
            config.auth.navigateToLoginRequestUrl = true;
            const loginUrl = "http://localhost:8081/test/"
            const userHash = "#testHash"
            const loginStartPage = loginUrl + userHash
            const successHash = testHashesForState(TEST_LIBRARY_STATE).TEST_SUCCESS_ID_TOKEN_HASH + TEST_CONFIG.STATE_NUM;

            window.location.href = loginUrl;

            sinon.stub(window, "parent").returns(window);
            sinon.stub(window.location, "href").returns(loginStartPage + successHash)

            window.location.hash = successHash;
            cacheStorage.setItem(AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.LOGIN_REQUEST, `${TEST_LIBRARY_STATE}|${TEST_CONFIG.STATE_NUM}`), loginStartPage);
            cacheStorage.setItem(AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.STATE_LOGIN, `${TEST_LIBRARY_STATE}|${TEST_CONFIG.STATE_NUM}`), `${TEST_LIBRARY_STATE}|${TEST_CONFIG.STATE_NUM}`);
            cacheStorage.setItem(AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.NONCE_IDTOKEN, `${TEST_LIBRARY_STATE}|${TEST_CONFIG.STATE_NUM}`), TEST_AUTH_PARAMS.NONCE);

            expect(window.location.href).to.equal(loginUrl);
            expect(window.location.hash).to.equal(successHash);
            msal = new UserAgentApplication(config);
            expect(window.location.href).to.equal(loginUrl);
            expect(window.location.hash).to.equal(userHash);
            expect(cacheStorage.getItem(PersistentCacheKeys.IDTOKEN)).to.equal(TEST_TOKENS.IDTOKEN_V2);
        });

        it("tests user query string present on final page url and token response is cached", function() {
            config.auth.navigateToLoginRequestUrl = true;
            const loginUrl = "http://localhost:8081/test/"
            const userQueryString = "?testKey=testVal"
            const loginStartPage = loginUrl + userQueryString;
            const successHash = testHashesForState(TEST_LIBRARY_STATE).TEST_SUCCESS_ID_TOKEN_HASH + TEST_CONFIG.STATE_NUM;

            window.location.href = loginStartPage;
            window.location.search = userQueryString;

            sinon.stub(window, "parent").returns(window);
            sinon.stub(window.location, "href").returns(loginStartPage + successHash)

            window.location.hash = successHash;
            cacheStorage.setItem(AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.LOGIN_REQUEST, `${TEST_LIBRARY_STATE}|${TEST_CONFIG.STATE_NUM}`), loginStartPage);
            cacheStorage.setItem(AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.STATE_LOGIN, `${TEST_LIBRARY_STATE}|${TEST_CONFIG.STATE_NUM}`), `${TEST_LIBRARY_STATE}|${TEST_CONFIG.STATE_NUM}`);
            cacheStorage.setItem(AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.NONCE_IDTOKEN, `${TEST_LIBRARY_STATE}|${TEST_CONFIG.STATE_NUM}`), TEST_AUTH_PARAMS.NONCE);

            expect(window.location.href).to.equal(loginStartPage);
            expect(window.location.hash).to.equal(successHash);
            expect(window.location.search).to.equal(userQueryString);
            msal = new UserAgentApplication(config);
            expect(window.location.href).to.equal(loginStartPage);
            expect(window.location.hash).to.equal("");
            expect(window.location.search).to.equal(userQueryString);
            expect(cacheStorage.getItem(PersistentCacheKeys.IDTOKEN)).to.equal(TEST_TOKENS.IDTOKEN_V2);
        });

        it("tests user hash is added back to url and query string exists on final page url and token response is cached", function() {
            config.auth.navigateToLoginRequestUrl = true;
            const loginUrl = "http://localhost:8081/test/"
            const userQueryString = "?testKey=testVal"
            const userHash = "#testHash"
            const loginStartPage = loginUrl + userQueryString + userHash;
            const successHash = testHashesForState(TEST_LIBRARY_STATE).TEST_SUCCESS_ID_TOKEN_HASH + TEST_CONFIG.STATE_NUM;

            window.location.href = loginUrl + userQueryString;
            window.location.search = userQueryString;

            sinon.stub(window, "parent").returns(window);
            sinon.stub(window.location, "href").returns(loginStartPage + successHash)

            window.location.hash = successHash;
            cacheStorage.setItem(AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.LOGIN_REQUEST, `${TEST_LIBRARY_STATE}|${TEST_CONFIG.STATE_NUM}`), loginStartPage);
            cacheStorage.setItem(AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.STATE_LOGIN, `${TEST_LIBRARY_STATE}|${TEST_CONFIG.STATE_NUM}`), `${TEST_LIBRARY_STATE}|${TEST_CONFIG.STATE_NUM}`);
            cacheStorage.setItem(AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.NONCE_IDTOKEN, `${TEST_LIBRARY_STATE}|${TEST_CONFIG.STATE_NUM}`), TEST_AUTH_PARAMS.NONCE);

            expect(window.location.href).to.equal(loginUrl + userQueryString);
            expect(window.location.hash).to.equal(successHash);
            expect(window.location.search).to.equal(userQueryString);
            msal = new UserAgentApplication(config);
            expect(window.location.href).to.equal(loginUrl + userQueryString);
            expect(window.location.hash).to.equal(userHash);
            expect(window.location.search).to.equal(userQueryString);
            expect(cacheStorage.getItem(PersistentCacheKeys.IDTOKEN)).to.equal(TEST_TOKENS.IDTOKEN_V2);
        });

        it("tests navigation to homepage after first redirect if loginStartPage not set", function(done) {
            config.auth.navigateToLoginRequestUrl = true;
            const successHash = testHashesForState(TEST_LIBRARY_STATE).TEST_SUCCESS_ID_TOKEN_HASH + TEST_CONFIG.STATE_NUM;

            window.location.assign = function (url) {
                try {
                    expect(url).to.equal("/");
                    done();
                } catch (e) {
                    console.error(e);
                }
            };

            sinon.stub(window, "parent").returns(window);

            window.location.hash = successHash;
            cacheStorage.setItem(AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.STATE_LOGIN, `${TEST_LIBRARY_STATE}|${TEST_CONFIG.STATE_NUM}`), `${TEST_LIBRARY_STATE}|${TEST_CONFIG.STATE_NUM}`);
            cacheStorage.setItem(AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.NONCE_IDTOKEN, `${TEST_LIBRARY_STATE}|${TEST_CONFIG.STATE_NUM}`), TEST_AUTH_PARAMS.NONCE);

            msal = new UserAgentApplication(config);
        });

        it("tests saveTokenForHash in case of error", function(done) {
            window.location.hash = testHashesForState(TEST_LIBRARY_STATE).TEST_ERROR_HASH + TEST_CONFIG.STATE_NUM;
            cacheStorage.setItem(AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.STATE_LOGIN, `${TEST_LIBRARY_STATE}|${TEST_CONFIG.STATE_NUM}`), `${TEST_LIBRARY_STATE}|${TEST_CONFIG.STATE_NUM}`);

            msal = new UserAgentApplication(config);

            const checkErrorFromServer = function(error: AuthError, response: AuthResponse) {
                expect(cacheStorage.getItem(TemporaryCacheKeys.URL_HASH)).to.be.null;
                expect(error instanceof ServerError).to.be.true;
                expect(error.name).to.include("ServerError");
                expect(error.errorCode).to.include(TEST_ERROR.CODE);
                expect(error.errorMessage).to.include(TEST_ERROR.DESCRIPTION);
                expect(error.message).to.include(TEST_ERROR.DESCRIPTION);
                expect(error.stack).to.include("UserAgentApplication.spec.ts");
                done();
            };
            msal.handleRedirectCallback(checkErrorFromServer);
        });

        // testServerErrorSubcodeCancel
        it("tests saveTokenForHash in case of non-consentable scopes / return to the application without consenting", function(done) {
            const testAccessDenied = "access_denied";
            const testServerErrorSubcodeCancel = `#error=access_denied&error_subcode=cancel&state=${TEST_LIBRARY_STATE}|`;
            window.location.hash = testServerErrorSubcodeCancel + TEST_CONFIG.STATE_NUM;
            cacheStorage.setItem(AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.STATE_LOGIN, `${TEST_LIBRARY_STATE}|${TEST_CONFIG.STATE_NUM}`), `${TEST_LIBRARY_STATE}|${TEST_CONFIG.STATE_NUM}`);

            msal = new UserAgentApplication(config);

            const checkErrorFromServer = function(error: AuthError, response: AuthResponse) {
                expect(cacheStorage.getItem(TemporaryCacheKeys.URL_HASH)).to.be.null;
                expect(error instanceof ServerError).to.be.true;
                expect(error.name).to.include("ServerError");
                expect(error.errorCode).to.include(testAccessDenied);
                expect(error.stack).to.include("UserAgentApplication.spec.ts");
                done();
            };
            msal.handleRedirectCallback(checkErrorFromServer);
        });

        it("tests if you get the state back in errorReceived callback, if state is a number", function (done) {
            window.location.hash = testHashesForState(TEST_LIBRARY_STATE).TEST_ERROR_HASH + TEST_CONFIG.STATE_NUM;
            cacheStorage.setItem(AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.STATE_LOGIN, `${TEST_LIBRARY_STATE}|${TEST_CONFIG.STATE_NUM}`), `${TEST_LIBRARY_STATE}|${TEST_CONFIG.STATE_NUM}`);

            msal = new UserAgentApplication(config);

            const checkErrorHasState = function(error: AuthError, response: AuthResponse) {
                expect(response.accountState).to.include(TEST_CONFIG.STATE_NUM);
                done();
            };
            msal.handleRedirectCallback(checkErrorHasState);
        });

        it("tests if you get the state back in errorReceived callback, if state is a url", function (done) {
            window.location.hash = testHashesForState(TEST_LIBRARY_STATE).TEST_ERROR_HASH + TEST_CONFIG.STATE_URL;
            cacheStorage.setItem(AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.STATE_LOGIN, `${TEST_LIBRARY_STATE}|${TEST_CONFIG.STATE_NUM}`), `${TEST_LIBRARY_STATE}|${TEST_CONFIG.STATE_NUM}`);

            msal = new UserAgentApplication(config);

            const checkErrorHasState = function(error: AuthError, response: AuthResponse) {
                expect(response.accountState).to.include(TEST_CONFIG.STATE_URL);

                done();
            };
            msal.handleRedirectCallback(checkErrorHasState);
        });

        it("tests that isCallback correctly identifies url hash", function (done) {
            msal = new UserAgentApplication(config);

            expect(msal.isCallback("not a callback")).to.be.false;
            expect(msal.isCallback("#error_description=someting_wrong")).to.be.true;
            expect(msal.isCallback("#/error_description=someting_wrong")).to.be.true;
            expect(msal.isCallback("#access_token=token123")).to.be.true;
            expect(msal.isCallback("#id_token=idtoken234")).to.be.true;
            done();
        });

        it("tests that expiresIn returns the correct date for access tokens", function (done) {
            const acquireTokenAccountKey = AuthCache.generateAcquireTokenAccountKey(account.homeAccountIdentifier, `${TEST_LIBRARY_STATE}|${TEST_CONFIG.STATE_NUM}`);
            cacheStorage.setItem(acquireTokenAccountKey, JSON.stringify(account));

            const successHash = testHashesForState(TEST_LIBRARY_STATE).TEST_SUCCESS_ACCESS_TOKEN_HASH + TEST_CONFIG.STATE_NUM;
            window.location.hash = successHash;
            cacheStorage.setItem(AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.NONCE_IDTOKEN, `${TEST_LIBRARY_STATE}|${TEST_CONFIG.STATE_NUM}`), TEST_AUTH_PARAMS.NONCE);

            cacheStorage.setItem(AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.STATE_ACQ_TOKEN, `${TEST_LIBRARY_STATE}|${TEST_CONFIG.STATE_NUM}`), `${TEST_LIBRARY_STATE}|${TEST_CONFIG.STATE_NUM}`);
            cacheStorage.setItem(AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.NONCE_IDTOKEN, `${TEST_LIBRARY_STATE}|${TEST_CONFIG.STATE_NUM}`), TEST_AUTH_PARAMS.NONCE);

            msal = new UserAgentApplication(config);

            const checkRespFromServer = function(response: AuthResponse) {
                expect(response.uniqueId).to.be.eq(TEST_AUTH_PARAMS.UNIQUE_ID);
                expect(response.tokenType).to.be.eq(ServerHashParamKeys.ACCESS_TOKEN);
                expect(response.tenantId).to.be.eq(TEST_CONFIG.MSAL_TENANT_ID);
                expect(response.accountState).to.be.eq(TEST_CONFIG.STATE_NUM);
                expect(response.expiresOn.getTime()).to.be.eq((TEST_TOKEN_LIFETIMES.BASELINE_DATE_CHECK + TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN) * 1000);
                expect(cacheStorage.getItem(TemporaryCacheKeys.URL_HASH)).to.be.null;
                done();
            };
            msal.handleRedirectCallback(checkRespFromServer, errorReceivedCallback);
        });

        it("tests that expiresIn returns the correct date for id tokens", function (done) {
            const acquireTokenAccountKey = AuthCache.generateAcquireTokenAccountKey(account.homeAccountIdentifier, `${TEST_LIBRARY_STATE}|${TEST_CONFIG.STATE_NUM}`);
            cacheStorage.setItem(acquireTokenAccountKey, JSON.stringify(account));

            const successHash = testHashesForState(TEST_LIBRARY_STATE).TEST_SUCCESS_ID_TOKEN_HASH + TEST_CONFIG.STATE_NUM;
            window.location.hash = successHash;
            cacheStorage.setItem(AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.STATE_LOGIN,`${TEST_LIBRARY_STATE}|${TEST_CONFIG.STATE_NUM}`), `${TEST_LIBRARY_STATE}|${TEST_CONFIG.STATE_NUM}`);
            cacheStorage.setItem(AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.NONCE_IDTOKEN, `${TEST_LIBRARY_STATE}|${TEST_CONFIG.STATE_NUM}`), TEST_AUTH_PARAMS.NONCE);

            msal = new UserAgentApplication(config);

            const checkRespFromServer = function(response: AuthResponse) {
                expect(response.uniqueId).to.be.eq(TEST_AUTH_PARAMS.UNIQUE_ID);
                expect(response.tokenType).to.be.eq(ServerHashParamKeys.ID_TOKEN);
                expect(response.tenantId).to.be.eq(TEST_CONFIG.MSAL_TENANT_ID);
                expect(response.accountState).to.be.eq(TEST_CONFIG.STATE_NUM);
                expect(response.expiresOn.getTime()).to.be.eq(TEST_TOKEN_LIFETIMES.TEST_ID_TOKEN_EXP * 1000);
                expect(cacheStorage.getItem(TemporaryCacheKeys.URL_HASH)).to.be.null;
                done();
            };
            msal.handleRedirectCallback(checkRespFromServer, errorReceivedCallback);
        });
    });

    describe("InteractionRequired Error Types", function () {
        beforeEach(function () {
            cacheStorage = new AuthCache(TEST_CONFIG.MSAL_CLIENT_ID, "sessionStorage", true);
            config = {
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                    redirectUri: TEST_URIS.TEST_REDIR_URI,
                    navigateToLoginRequestUrl: false
                }
            };

            setAuthInstanceStubs(msal);
            setTestCacheItems();
        });

        afterEach(function() {
            config = {auth: {clientId: ""}};
            cacheStorage.clear();
            sinon.restore();
        });

        it("tests saveTokenForHash in case of interaction_required error code", function(done) {
            window.location.hash = testHashesForState(TEST_LIBRARY_STATE).TEST_INTERACTION_REQ_ERROR_HASH1 + TEST_CONFIG.STATE_NUM;
            cacheStorage.setItem(AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.STATE_LOGIN, `${TEST_LIBRARY_STATE}|${TEST_CONFIG.STATE_NUM}`), `${TEST_LIBRARY_STATE}|${TEST_CONFIG.STATE_NUM}`);

            msal = new UserAgentApplication(config);

            const checkErrorFromServer = function(error: AuthError, response: AuthResponse) {
                expect(cacheStorage.getItem(TemporaryCacheKeys.URL_HASH)).to.be.null;
                expect(error instanceof InteractionRequiredAuthError).to.be.true;
                expect(error.name).to.include("InteractionRequiredAuthError");
                expect(error.errorCode).to.include(InteractionRequiredAuthErrorMessage.interactionRequired.code);
                expect(error.errorMessage).to.include(TEST_ERROR.DESCRIPTION);
                expect(error.message).to.include(TEST_ERROR.DESCRIPTION);
                expect(error.stack).to.include("UserAgentApplication.spec.ts");
                done();
            };
            msal.handleRedirectCallback(checkErrorFromServer);
        });

        it("tests saveTokenForHash in case of interaction_required error code and description", function(done) {
            window.location.hash = testHashesForState(TEST_LIBRARY_STATE).TEST_INTERACTION_REQ_ERROR_HASH2 + TEST_CONFIG.STATE_NUM;
            cacheStorage.setItem(AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.STATE_LOGIN, `${TEST_LIBRARY_STATE}|${TEST_CONFIG.STATE_NUM}`), `${TEST_LIBRARY_STATE}|${TEST_CONFIG.STATE_NUM}`);

            msal = new UserAgentApplication(config);

            const checkErrorFromServer = function(error: AuthError, response: AuthResponse) {
                expect(cacheStorage.getItem(TemporaryCacheKeys.URL_HASH)).to.be.null;
                expect(error instanceof InteractionRequiredAuthError).to.be.true;
                expect(error.name).to.include("InteractionRequiredAuthError");
                expect(error.errorCode).to.include(InteractionRequiredAuthErrorMessage.interactionRequired.code);
                expect(error.errorMessage).to.include(TEST_ERROR.DESCRIPTION);
                expect(error.message).to.include(TEST_ERROR.DESCRIPTION);
                expect(error.errorMessage).to.include(InteractionRequiredAuthErrorMessage.interactionRequired.code);
                expect(error.message).to.include(InteractionRequiredAuthErrorMessage.interactionRequired.code);
                expect(error.stack).to.include("UserAgentApplication.spec.ts");
                done();
            };
            msal.handleRedirectCallback(checkErrorFromServer);
        });

        it("tests saveTokenForHash in case of login_required error code", function(done) {
            window.location.hash = testHashesForState(TEST_LIBRARY_STATE).TEST_LOGIN_REQ_ERROR_HASH1 + TEST_CONFIG.STATE_NUM;
            cacheStorage.setItem(AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.STATE_LOGIN, `${TEST_LIBRARY_STATE}|${TEST_CONFIG.STATE_NUM}`), `${TEST_LIBRARY_STATE}|${TEST_CONFIG.STATE_NUM}`);

            msal = new UserAgentApplication(config);

            const checkErrorFromServer = function(error: AuthError, response: AuthResponse) {
                expect(cacheStorage.getItem(TemporaryCacheKeys.URL_HASH)).to.be.null;
                expect(error instanceof InteractionRequiredAuthError).to.be.true;
                expect(error.name).to.include("InteractionRequiredAuthError");
                expect(error.errorCode).to.include(InteractionRequiredAuthErrorMessage.loginRequired.code);
                expect(error.errorMessage).to.include(TEST_ERROR.DESCRIPTION);
                expect(error.message).to.include(TEST_ERROR.DESCRIPTION);
                expect(error.stack).to.include("UserAgentApplication.spec.ts");
                done();
            };
            msal.handleRedirectCallback(checkErrorFromServer);
        });

        it("tests saveTokenForHash in case of login_required error code and description", function(done) {
            window.location.hash = testHashesForState(TEST_LIBRARY_STATE).TEST_LOGIN_REQ_ERROR_HASH2 + TEST_CONFIG.STATE_NUM;
            cacheStorage.setItem(AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.STATE_LOGIN, `${TEST_LIBRARY_STATE}|${TEST_CONFIG.STATE_NUM}`), `${TEST_LIBRARY_STATE}|${TEST_CONFIG.STATE_NUM}`);

            msal = new UserAgentApplication(config);

            const checkErrorFromServer = function(error: AuthError, response: AuthResponse) {
                expect(cacheStorage.getItem(TemporaryCacheKeys.URL_HASH)).to.be.null;
                expect(error instanceof InteractionRequiredAuthError).to.be.true;
                expect(error.name).to.include("InteractionRequiredAuthError");
                expect(error.errorCode).to.include(InteractionRequiredAuthErrorMessage.loginRequired.code);
                expect(error.errorMessage).to.include(TEST_ERROR.DESCRIPTION);
                expect(error.message).to.include(TEST_ERROR.DESCRIPTION);
                expect(error.errorMessage).to.include(InteractionRequiredAuthErrorMessage.loginRequired.code);
                expect(error.message).to.include(InteractionRequiredAuthErrorMessage.loginRequired.code);
                expect(error.stack).to.include("UserAgentApplication.spec.ts");
                done();
            };
            msal.handleRedirectCallback(checkErrorFromServer);
        });

        it("tests saveTokenForHash in case of consent_required error code", function(done) {
            window.location.hash = testHashesForState(TEST_LIBRARY_STATE).TEST_CONSENT_REQ_ERROR_HASH1 + TEST_CONFIG.STATE_NUM;
            cacheStorage.setItem(AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.STATE_LOGIN, `${TEST_LIBRARY_STATE}|${TEST_CONFIG.STATE_NUM}`), `${TEST_LIBRARY_STATE}|${TEST_CONFIG.STATE_NUM}`);

            msal = new UserAgentApplication(config);

            const checkErrorFromServer = function(error: AuthError, response: AuthResponse) {
                expect(cacheStorage.getItem(TemporaryCacheKeys.URL_HASH)).to.be.null;
                expect(error instanceof InteractionRequiredAuthError).to.be.true;
                expect(error.name).to.include("InteractionRequiredAuthError");
                expect(error.errorCode).to.include(InteractionRequiredAuthErrorMessage.consentRequired.code);
                expect(error.errorMessage).to.include(TEST_ERROR.DESCRIPTION);
                expect(error.message).to.include(TEST_ERROR.DESCRIPTION);
                expect(error.stack).to.include("UserAgentApplication.spec.ts");
                done();
            };
            msal.handleRedirectCallback(checkErrorFromServer);
        });

        it("tests saveTokenForHash in case of consent_required error code and description", function(done) {
            window.location.hash = testHashesForState(TEST_LIBRARY_STATE).TEST_CONSENT_REQ_ERROR_HASH2 + TEST_CONFIG.STATE_NUM;
            cacheStorage.setItem(AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.STATE_LOGIN, `${TEST_LIBRARY_STATE}|${TEST_CONFIG.STATE_NUM}`), `${TEST_LIBRARY_STATE}|${TEST_CONFIG.STATE_NUM}`);

            msal = new UserAgentApplication(config);

            const checkErrorFromServer = function(error: AuthError, response: AuthResponse) {
                expect(cacheStorage.getItem(TemporaryCacheKeys.URL_HASH)).to.be.null;
                expect(error instanceof InteractionRequiredAuthError).to.be.true;
                expect(error.name).to.include("InteractionRequiredAuthError");
                expect(error.errorCode).to.include(InteractionRequiredAuthErrorMessage.consentRequired.code);
                expect(error.errorMessage).to.include(TEST_ERROR.DESCRIPTION);
                expect(error.message).to.include(TEST_ERROR.DESCRIPTION);
                expect(error.errorMessage).to.include(InteractionRequiredAuthErrorMessage.consentRequired.code);
                expect(error.message).to.include(InteractionRequiredAuthErrorMessage.consentRequired.code);
                expect(error.stack).to.include("UserAgentApplication.spec.ts");
                done();
            };
            msal.handleRedirectCallback(checkErrorFromServer);
        });
    });

    describe("Logout functionality", function () {

        beforeEach(function () {
            cacheStorage = new AuthCache(TEST_CONFIG.MSAL_CLIENT_ID, "sessionStorage", true);
            const config: Configuration = {
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                    redirectUri: TEST_URIS.TEST_REDIR_URI,
                    postLogoutRedirectUri: TEST_URIS.TEST_LOGOUT_URI
                }
            };
            msal = new UserAgentApplication(config);
            setAuthInstanceStubs(msal);
            setTestCacheItems();
            delete window.location;
        });

        afterEach(function () {
            window.location = oldWindowLocation;
            cacheStorage.clear();
            sinon.restore();
        });

        it("clears cache and account object", function (done) {
            cacheStorage.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));
            cacheStorage.setItem(PersistentCacheKeys.IDTOKEN, "idTokenKey");
            cacheStorage.setItem(PersistentCacheKeys.CLIENT_INFO, TEST_DATA_CLIENT_INFO.TEST_CLIENT_INFO_B64ENCODED);
            sinon.stub(Account, "createAccount").returns(account);
            window.location = {
                ...oldWindowLocation,
                hash: "",
                assign: function (url) {
                    try {
                        done();
                    } catch (e) {
                        console.error(e);
                    }
                }
            };
            const clearCacheSpy = sinon.spy(msal, <any>"clearCache");
            expect(msal.getAccount()).to.not.be.null;
            msal.logout();
            expect(msal.getAccount()).to.be.null;
            expect(clearCacheSpy.calledOnce).to.be.true;
        });

        it("adds postLogoutRedirectUri to logout URI", function (done) {
            window.location = {
                ...oldWindowLocation,
                hash: "",
                assign: function (url) {
                    try {
                        expect(url).to.include(encodeURIComponent(TEST_URIS.TEST_LOGOUT_URI));
                        done();
                    } catch (e) {
                        console.error(e);
                    }
                }
            };
            msal.logout();
        });
        it("uses the end_session_endpoint url", function (done) {
            window.location = {
                ...oldWindowLocation,
                hash: "",
                assign: function (url) {
                    try {
                        expect(url).to.include(VALID_OPENID_CONFIGURATION_RESPONSE.EndSessionEndpoint);
                        done();
                    } catch (e) {
                        console.error(e);
                    }
                }
            };
            msal.logout();
        });
        it("falls back to default url when there is no end_session_endpoint ", function (done) {
            sinon.stub(msal.getAuthorityInstance(), "EndSessionEndpoint").reset();
            sinon.stub(msal.getAuthorityInstance(), "EndSessionEndpoint").value("");
            window.location = {
                ...oldWindowLocation,
                hash: "",
                assign: function (url) {
                    try {
                        expect(url).to.include(TEST_URIS.DEFAULT_INSTANCE + TEST_CONFIG.TENANT + "oauth2/v2.0/logout?");
                        done();
                    } catch (e) {
                        console.error(e);
                    }
                }
            };
            msal.logout();
        });

    });

    describe("State Handling", function () {

        beforeEach(function () {
            cacheStorage = new AuthCache(TEST_CONFIG.MSAL_CLIENT_ID, "sessionStorage", true);
            const config: Configuration = {
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                    redirectUri: TEST_URIS.TEST_REDIR_URI
                }
            };
            msal = new UserAgentApplication(config);
            setAuthInstanceStubs(msal);
            setTestCacheItems();
        });

        afterEach(function() {
            cacheStorage.clear();
            sinon.restore();
        });

        it("tests getAccountState with a user passed state", function () {
            const result = msal.getAccountState("123465464565|91111");
            expect(result).to.be.eq("91111");
        });

        it("test getAccountState when there is no user state", function () {
            const result = msal.getAccountState("123465464565");
            expect(result).to.be.eq("123465464565");
        });

        it("test getAccountState when there is no state", function () {
            const result = msal.getAccountState("");
            expect(result).to.be.eq("");
        });
    });

    describe("Cache Location", function () {

        beforeEach(function () {
            cacheStorage = new AuthCache(TEST_CONFIG.MSAL_CLIENT_ID, "sessionStorage", true);
            setAuthInstanceStubs(msal);
            setTestCacheItems();
        });

        afterEach(function() {
            cacheStorage.clear();
            sinon.restore();
        });

        it("tests cacheLocation functionality defaults to sessionStorage", function () {
            const config: Configuration = {
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                    redirectUri: TEST_URIS.TEST_REDIR_URI
                }
            };
            msal = new UserAgentApplication(config);
            const checkConfig = msal.getCurrentConfiguration();
            expect(checkConfig.cache.cacheLocation).to.be.eq("sessionStorage");
        });

        it("tests cacheLocation functionality sets to localStorage when passed as a parameter", function () {
            const config: Configuration = {
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                    redirectUri: TEST_URIS.TEST_REDIR_URI
                },
                cache: {
                    cacheLocation: "localStorage"
                }
            };
            msal = new UserAgentApplication(config);
            const checkConfig = msal.getCurrentConfiguration();
            expect(checkConfig.cache.cacheLocation).to.be.eq(config.cache.cacheLocation);
        });
    });

    describe("Popup Flow", function () {

        const oldWindow = window;

        beforeEach(function() {
            cacheStorage = new AuthCache(TEST_CONFIG.MSAL_CLIENT_ID, "sessionStorage", true);
            const config: Configuration = {
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                    redirectUri: TEST_URIS.TEST_REDIR_URI
                }
            };
            msal = new UserAgentApplication(config);
            setAuthInstanceStubs(msal);
            setTestCacheItems();

            delete window.location;
        });

        afterEach(function() {
            window = oldWindow;
            window.location = oldWindowLocation;
            cacheStorage.clear();
            sinon.restore();
        });

        it("returns a promise from loginPopup", function () {
            window = {
                ...oldWindow,
                open: function (url?, target?, features?, replace?): Window {
                    return null;
                }
            };
            const loginPopupPromise = msal.loginPopup({});
            expect(loginPopupPromise instanceof Promise).to.be.true;
            loginPopupPromise.catch(error => {});
        });

        it("returns a promise from acquireTokenPopup", function () {
            const acquireTokenPromise = msal.acquireTokenPopup({scopes: [TEST_CONFIG.MSAL_CLIENT_ID]});
            expect(acquireTokenPromise instanceof Promise).to.be.true;
            acquireTokenPromise.catch(error => {});
        });

        it("Account is cached on acquireTokenPopup call", (done) => {
            const tokenRequest: AuthenticationParameters = {
                scopes: ["S1"], 
                account: account
            };

            const TEST_LIBRARY_STATE_POPUP = RequestUtils.generateLibraryState(Constants.interactionTypePopup)

            window = {
                ...oldWindow,
                location: {
                    ...oldWindowLocation,
                    href: TEST_URIS.TEST_REDIR_URI + "/" + testHashesForState(TEST_LIBRARY_STATE_POPUP).TEST_SUCCESS_ACCESS_TOKEN_HASH + TEST_CONFIG.STATE_NUM,
                    hash: testHashesForState(TEST_LIBRARY_STATE_POPUP).TEST_SUCCESS_ACCESS_TOKEN_HASH + TEST_CONFIG.STATE_NUM,
                },
                open: function (url?, target?, features?, replace?): Window {
                    const state = UrlUtils.deserializeHash(url).state;
                    const accountKey = AuthCache.generateAcquireTokenAccountKey(account.homeAccountIdentifier, state)
    
                    expect(cacheStorage.getItem(accountKey)).equals(JSON.stringify(account));
                    done();
                    return window
                },
                close: function(): void {},
                focus: null
            };

            const acquireTokenPromise = msal.acquireTokenPopup(tokenRequest);
            expect(acquireTokenPromise instanceof Promise).to.be.true;

            acquireTokenPromise.catch(error => {console.log(error)});
        });

    });

    describe("Silent Flow", function () {

        beforeEach(function() {
            const config: Configuration = {
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                    redirectUri: TEST_URIS.TEST_REDIR_URI
                }
            };
            msal = new UserAgentApplication(config);
            setAuthInstanceStubs(msal);
        });

        afterEach(function() {
            cacheStorage.clear();
            sinon.restore();
        });

        it("returns a promise from acquireTokenSilent", function () {
            const acquireTokenSilentPromise = msal.acquireTokenSilent({scopes: [TEST_CONFIG.MSAL_CLIENT_ID]});
            expect(acquireTokenSilentPromise instanceof Promise).to.be.true;
            acquireTokenSilentPromise.catch(error => {});
        });
    });

    describe("Test null request calls for acquireTokenSilent and acquireTokenPopup", () => {
        let msal : UserAgentApplication;
        
        beforeEach(function() {
            sinon.stub(TrustedAuthority, "getTrustedHostList").returns(["login.microsoftonline.com"]);
            const config: Configuration = {
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                    redirectUri: TEST_URIS.TEST_REDIR_URI
                }
            };
    
            msal = new UserAgentApplication(config);
        });

        afterEach(() => {
            sinon.restore();
        }); 

        it("throws an error if configured with a null request", () => {
            try {
                msal.acquireTokenSilent(null);
            } catch(e) {
                () => {expect(e).to.be.instanceOf(ClientConfigurationError);}
            };
        });

        it("throws an error if configured with a null request", () => {
            try {
                msal.acquireTokenPopup(null);
            } catch(e) {
                () => {expect(e).to.be.instanceOf(ClientConfigurationError);}
            };
        });
    });

    describe('Logger', () => {
        it('getLogger and setLogger', done => {
            const config: Configuration = {
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                    redirectUri: TEST_URIS.TEST_REDIR_URI
                }
            };

            msal = new UserAgentApplication(config);

            const correlationId = CryptoUtils.createNewGuid();

            const logger = new Logger((level, message, containsPii) => {
                expect(message).to.contain('Message');
                expect(message).to.contain(correlationId);
                expect(message).to.contain(LogLevel.Info);

                expect(level).to.equal(LogLevel.Info);
                expect(containsPii).to.be.false;

                done();
            }, {
                correlationId,
                piiLoggingEnabled: false
            });

            msal.setLogger(logger);

            expect(msal.getLogger()).to.equal(logger);

            msal.getLogger().info('Message');
        });
    });

    describe("ssoSilent", () => {
        it("invokes acquireTokenSilent with loginHint", done => {
            const loginHint = "test@example.com";

            const atsStub = sinon.stub(msal, "acquireTokenSilent").callsFake(async (request) => {
                expect(request.loginHint).to.equal(loginHint);
                expect(request.scopes).to.deep.equal(Constants.oidcScopes);

                atsStub.restore();
                done();
            });

            msal.ssoSilent({
                loginHint
            });
        });

        it("invokes acquireTokenSilent with sid", done => {
            const sid = "fakesid";

            const atsStub = sinon.stub(msal, "acquireTokenSilent").callsFake(async (request) => {
                expect(request.sid).to.equal(sid);
                expect(request.scopes).to.deep.equal(Constants.oidcScopes);

                atsStub.restore();
                done();
            });

            msal.ssoSilent({
                sid
            });
        });

        it("throws if sid or login isnt provided", done => {
            try {
                msal.ssoSilent({});
            } catch (e) {
                expect(e.errorCode).to.equal("sso_silent_error");
                done();
            }
        });
    });

    describe("Response type configuration", () => {
        // Trailing ampersand is added to avoid id_token matching id_token token
        const idTokenType = "response_type=id_token&";
        const idTokenTokenType = "response_type=id_token token&";
        const tokenType = "response_type=token&";

        describe("Login APIs", () => {
            describe("loginRedirect", () => {
                beforeEach(function() {
                    cacheStorage = new AuthCache(TEST_CONFIG.MSAL_CLIENT_ID, "sessionStorage", true);
                    const config: Configuration = {
                        auth: {
                            clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                            redirectUri: TEST_URIS.TEST_REDIR_URI
                        }
                    };
                    msal = new UserAgentApplication(config);
                    setAuthInstanceStubs(msal);
                    setTestCacheItems();
        
                    delete window.location;
                });
        
                afterEach(function () {
                    cacheStorage.clear();
                    sinon.restore();
                    window.location = oldWindowLocation;
                });
    
                // Redirect 
                
                it("loginRedirect should set response_type to id_token", (done) => {
                    window.location = {
                        ...oldWindowLocation,
                        assign: function (url) {
                            try {
                                expect(url).to.include(idTokenType);
                                expect(url).to.not.include(tokenType)
                                expect(url).to.not.include(idTokenTokenType);
                                done();
                            } catch (e) {
                                console.error(e);
                            }
                        }
                    };
                    
                    msal.loginRedirect();
                });
            });

            describe("loginPopup", () => {
                const oldWindow = window;
                const TEST_LIBRARY_STATE_POPUP = RequestUtils.generateLibraryState(Constants.interactionTypePopup)

                beforeEach(function() {
                    cacheStorage = new AuthCache(TEST_CONFIG.MSAL_CLIENT_ID, "sessionStorage", true);
                    const config: Configuration = {
                        auth: {
                            clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                            redirectUri: TEST_URIS.TEST_REDIR_URI
                        }
                    };
                    msal = new UserAgentApplication(config);
                    setAuthInstanceStubs(msal);
                    setTestCacheItems();

                    delete window.location;
                });

                afterEach(function() {
                    window = oldWindow;
                    window.location = oldWindowLocation;
                    cacheStorage.clear();
                    sinon.restore();
                });
                
                it("loginPopup should set response_type to id_token", (done) => {
                    let navigateUrl;
                    window = {
                        ...oldWindow,
                        location: {
                            ...oldWindowLocation,
                            hash: testHashesForState(TEST_LIBRARY_STATE_POPUP).TEST_SUCCESS_ACCESS_TOKEN_HASH + TEST_CONFIG.STATE_NUM,
                        },
                        open: function (url?, target?, features?, replace?): Window {
                            navigateUrl = url;
                            return null;
                        }
                    };
                    const loginPopupPromise = msal.loginPopup({});
                    loginPopupPromise.catch(error => {
                        expect(navigateUrl).to.include(idTokenType);
                        expect(navigateUrl).to.not.include(tokenType)
                        expect(navigateUrl).to.not.include(idTokenTokenType);
                        done();
                    });
                });
            });
        });

        describe("Acquire Token APIs", () => {
            describe("with matching accounts", () => {
                beforeEach(function() {
                    cacheStorage = new AuthCache(TEST_CONFIG.MSAL_CLIENT_ID, "sessionStorage", true);
                    const config: Configuration = {
                        auth: {
                            clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                            redirectUri: TEST_URIS.TEST_REDIR_URI,
                        }
                    };
                    msal = new UserAgentApplication(config);
                    setAuthInstanceStubs(msal);
                    setTestCacheItems();
    
                    delete window.location;
                });
        
                afterEach(function () {
                    cacheStorage.clear();
                    sinon.restore();
                    window.location = oldWindowLocation;
                });

                it("should set response_type to id_token when clientId is the only input scope", (done) => {
                    window.location = {
                        ...oldWindowLocation,
                        assign: function (url) {
                            try {
                                expect(url).to.include(idTokenType);
                                expect(url).to.not.include(tokenType)
                                expect(url).to.not.include(idTokenTokenType);
                                done();
                            } catch (e) {
                                console.error(e);
                            }
                        }
                    };

                    sinon.stub(msal, "getAccount").returns(account);
                    msal.acquireTokenRedirect({ scopes: [TEST_CONFIG.MSAL_CLIENT_ID ], account});
                });

                it("should set response_type to id_token when openid and profile are the only scopes", (done) => {
                    window.location = {
                        ...oldWindowLocation,
                        assign: function (url) {
                            try {
                                expect(url).to.include(idTokenType);
                                expect(url).to.not.include(tokenType)
                                expect(url).to.not.include(idTokenTokenType);
                                done();
                            } catch (e) {
                                console.error(e);
                            }
                        }
                    };
                    
                    sinon.stub(msal, "getAccount").returns(account);
                    msal.acquireTokenRedirect({ scopes: [Constants.openidScope, Constants.profileScope], account});
                });

                it("should set response_type to id_token when openid is the only scope", (done) => {
                    window.location = {
                        ...oldWindowLocation,
                        assign: function (url) {
                            try {
                                expect(url).to.include(idTokenType);
                                expect(url).to.not.include(tokenType)
                                expect(url).to.not.include(idTokenTokenType);
                                done();
                            } catch (e) {
                                console.error(e);
                            }
                        }
                    };
                    
                    sinon.stub(msal, "getAccount").returns(account);
                    msal.acquireTokenRedirect({ scopes: [Constants.openidScope], account});
                });

                it("should set response_type to id_token when profile is the only scope", (done) => {
                    window.location = {
                        ...oldWindowLocation,
                        assign: function (url) {
                            try {
                                expect(url).to.include(idTokenType);
                                expect(url).to.not.include(tokenType)
                                expect(url).to.not.include(idTokenTokenType);
                                done();
                            } catch (e) {
                                console.error(e);
                            }
                        }
                    };
                    
                    sinon.stub(msal, "getAccount").returns(account);
                    msal.acquireTokenRedirect({ scopes: [Constants.profileScope], account});
                });

                it("should set response_type to id_token when profile is the only scope", (done) => {
                    window.location = {
                        ...oldWindowLocation,
                        assign: function (url) {
                            try {
                                expect(url).to.include(idTokenType);
                                expect(url).to.not.include(tokenType)
                                expect(url).to.not.include(idTokenTokenType);
                                done();
                            } catch (e) {
                                console.error(e);
                            }
                        }
                    };
                    
                    sinon.stub(msal, "getAccount").returns(account);
                    msal.acquireTokenRedirect({ scopes: [Constants.profileScope], account});
                });

                it("should set response_type to id_token token when a resource scope is included along with openid", (done) => {
                    window.location = {
                        ...oldWindowLocation,
                        assign: function (url) {
                            try {
                                expect(url).to.include(idTokenTokenType);
                                expect(url).to.not.include(tokenType)
                                expect(url).to.not.include(idTokenType);
                                done();
                            } catch (e) {
                                console.error(e);
                            }
                        }
                    };
                    
                    sinon.stub(msal, "getAccount").returns(account);
                    msal.acquireTokenRedirect({ scopes: ['S1', Constants.openidScope], account});
                });

                it("should set response_type to id_token token when a resource scope is included along with profile", (done) => {
                    window.location = {
                        ...oldWindowLocation,
                        assign: function (url) {
                            try {
                                expect(url).to.include(idTokenTokenType);
                                expect(url).to.not.include(tokenType)
                                expect(url).to.not.include(idTokenType);
                                done();
                            } catch (e) {
                                console.error(e);
                            }
                        }
                    };
                    
                    sinon.stub(msal, "getAccount").returns(account);
                    msal.acquireTokenRedirect({ scopes: ['S1', Constants.profileScope], account});
                });

                it("should set response_type to id_token token when a resource scope is included along with both OIDC scopes", (done) => {
                    window.location = {
                        ...oldWindowLocation,
                        assign: function (url) {
                            try {
                                expect(url).to.include(idTokenTokenType);
                                expect(url).to.not.include(tokenType)
                                expect(url).to.not.include(idTokenType);
                                done();
                            } catch (e) {
                                console.error(e);
                            }
                        }
                    };

                    const oidcScopes = [Constants.openidScope, Constants.profileScope];                        
                    sinon.stub(msal, "getAccount").returns(account);
                    msal.acquireTokenRedirect({ scopes: ['S1', ...oidcScopes], account});
                });

                it("should treat clientId as a resource scope when included with OIDC scopes and therefore set response_type to id_token token", (done) => {
                    window.location = {
                        ...oldWindowLocation,
                        assign: function (url) {
                            try {
                                expect(url).to.include(idTokenTokenType);
                                expect(url).to.not.include(tokenType)
                                expect(url).to.not.include(idTokenType);
                                done();
                            } catch (e) {
                                console.error(e);
                            }
                        }
                    };

                    const oidcScopes = [Constants.openidScope, Constants.profileScope];                        
                    sinon.stub(msal, "getAccount").returns(account);
                    msal.acquireTokenRedirect({ scopes: [TEST_CONFIG.MSAL_CLIENT_ID, ...oidcScopes], account});
                });

                it("should set response_type to token when only a single resource scope is included", (done) => {
                    window.location = {
                        ...oldWindowLocation,
                        assign: function (url) {
                            try {
                                expect(url).to.include(tokenType);
                                expect(url).to.not.include(idTokenTokenType)
                                expect(url).to.not.include(idTokenType);
                                done();
                            } catch (e) {
                                console.error(e);
                            }
                        }
                    };

                    const oidcScopes = [Constants.openidScope, Constants.profileScope];                        
                    sinon.stub(msal, "getAccount").returns(account);
                    msal.acquireTokenRedirect({ scopes: ['S1'], account});
                });

                it("should set response_type to token when multiple resource scopes are included", (done) => {
                    window.location = {
                        ...oldWindowLocation,
                        assign: function (url) {
                            try {
                                expect(url).to.include(tokenType);
                                expect(url).to.not.include(idTokenTokenType)
                                expect(url).to.not.include(idTokenType);
                                done();
                            } catch (e) {
                                console.error(e);
                            }
                        }
                    };

                    const oidcScopes = [Constants.openidScope, Constants.profileScope];                        
                    sinon.stub(msal, "getAccount").returns(account);
                    msal.acquireTokenRedirect({ scopes: ['S1', 'S2'], account});
                });
                it("should treat clientId as a resource scope when included with resource scopes and therefore set response_type to token", (done) => {
                    window.location = {
                        ...oldWindowLocation,
                        assign: function (url) {
                            try {
                                expect(url).to.include(tokenType);
                                expect(url).to.not.include(idTokenTokenType)
                                expect(url).to.not.include(idTokenType);
                                done();
                            } catch (e) {
                                console.error(e);
                            }
                        }
                    };

                    const oidcScopes = [Constants.openidScope, Constants.profileScope];                        
                    sinon.stub(msal, "getAccount").returns(account);
                    msal.acquireTokenRedirect({ scopes: [TEST_CONFIG.MSAL_CLIENT_ID, 'S1'], account});
                });
            }); 

            describe("when accounts don't match", () => {
                beforeEach(function() {
                    cacheStorage = new AuthCache(TEST_CONFIG.MSAL_CLIENT_ID, "sessionStorage", true);
                    const config: Configuration = {
                        auth: {
                            clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                            redirectUri: TEST_URIS.TEST_REDIR_URI,
                        }
                    };
                    msal = new UserAgentApplication(config);
                    setAuthInstanceStubs(msal);
                    setTestCacheItems();
    
                    delete window.location;
                });
        
                afterEach(function () {
                    cacheStorage.clear();
                    sinon.restore();
                    window.location = oldWindowLocation;
                });

                it("should set response_type to id_token when clientId is the only input scope", (done) => {
                    window.location = {
                        ...oldWindowLocation,
                        assign: function (url) {
                            try {
                                expect(url).to.include(idTokenType);
                                expect(url).to.not.include(tokenType)
                                expect(url).to.not.include(idTokenTokenType);
                                done();
                            } catch (e) {
                                console.error(e);
                            }
                        }
                    };

                    msal.acquireTokenRedirect({ scopes: [TEST_CONFIG.MSAL_CLIENT_ID ], account});
                });

                it("should set response_type to id_token when openid and profile are the only scopes", (done) => {
                    window.location = {
                        ...oldWindowLocation,
                        assign: function (url) {
                            try {
                                expect(url).to.include(idTokenType);
                                expect(url).to.not.include(tokenType)
                                expect(url).to.not.include(idTokenTokenType);
                                done();
                            } catch (e) {
                                console.error(e);
                            }
                        }
                    };
                    
                    msal.acquireTokenRedirect({ scopes: [Constants.openidScope, Constants.profileScope], account});
                });

                it("should set response_type to id_token when openid is the only scope", (done) => {
                    window.location = {
                        ...oldWindowLocation,
                        assign: function (url) {
                            try {
                                expect(url).to.include(idTokenType);
                                expect(url).to.not.include(tokenType)
                                expect(url).to.not.include(idTokenTokenType);
                                done();
                            } catch (e) {
                                console.error(e);
                            }
                        }
                    };
                    
                    msal.acquireTokenRedirect({ scopes: [Constants.openidScope], account });
                });

                it("should set response_type to id_token when profile is the only scope", (done) => {
                    window.location = {
                        ...oldWindowLocation,
                        assign: function (url) {
                            try {
                                expect(url).to.include(idTokenType);
                                expect(url).to.not.include(tokenType)
                                expect(url).to.not.include(idTokenTokenType);
                                done();
                            } catch (e) {
                                console.error(e);
                            }
                        }
                    };
                    
                    msal.acquireTokenRedirect({ scopes: [Constants.profileScope], account});
                });

                it("should set response_type to id_token token when a resource scope is included along with openid", (done) => {
                    window.location = {
                        ...oldWindowLocation,
                        assign: function (url) {
                            try {
                                expect(url).to.include(idTokenTokenType);
                                expect(url).to.not.include(tokenType)
                                expect(url).to.not.include(idTokenType);
                                done();
                            } catch (e) {
                                console.error(e);
                            }
                        }
                    };
                    
                    msal.acquireTokenRedirect({ scopes: ['S1', Constants.openidScope], account});
                });

                it("should set response_type to id_token token when a resource scope is included along with profile", (done) => {
                    window.location = {
                        ...oldWindowLocation,
                        assign: function (url) {
                            try {
                                expect(url).to.include(idTokenTokenType);
                                expect(url).to.not.include(tokenType)
                                expect(url).to.not.include(idTokenType);
                                done();
                            } catch (e) {
                                console.error(e);
                            }
                        }
                    };
                    
                    msal.acquireTokenRedirect({ scopes: ['S1', Constants.profileScope], account});
                });

                it("should set response_type to id_token token when a resource scope is included along with both OIDC scopes", (done) => {
                    window.location = {
                        ...oldWindowLocation,
                        assign: function (url) {
                            try {
                                expect(url).to.include(idTokenTokenType);
                                expect(url).to.not.include(tokenType)
                                expect(url).to.not.include(idTokenType);
                                done();
                            } catch (e) {
                                console.error(e);
                            }
                        }
                    };

                    const oidcScopes = [Constants.openidScope, Constants.profileScope];                        
                    msal.acquireTokenRedirect({ scopes: ['S1', ...oidcScopes], account});
                });

                it("should treat clientId as a resource scope when included with OIDC scopes and therefore set response_type to id_token token", (done) => {
                    window.location = {
                        ...oldWindowLocation,
                        assign: function (url) {
                            try {
                                expect(url).to.include(idTokenTokenType);
                                expect(url).to.not.include(tokenType)
                                expect(url).to.not.include(idTokenType);
                                done();
                            } catch (e) {
                                console.error(e);
                            }
                        }
                    };

                    const oidcScopes = [Constants.openidScope, Constants.profileScope];                        
                    msal.acquireTokenRedirect({ scopes: [TEST_CONFIG.MSAL_CLIENT_ID, ...oidcScopes], account});
                });

                it("should set response_type to id_token token when only a single resource scope is included because login is required", (done) => {
                    window.location = {
                        ...oldWindowLocation,
                        assign: function (url) {
                            try {
                                expect(url).to.not.include(tokenType);
                                expect(url).to.include(idTokenTokenType);
                                expect(url).to.not.include(idTokenType);
                                done();
                            } catch (e) {
                                console.error(e);
                            }
                        }
                    };

                    const oidcScopes = [Constants.openidScope, Constants.profileScope];                        
                    msal.acquireTokenRedirect({ scopes: ['S1'], account});
                });

                it("should set response_type to id_token token when multiple resource scopes are included because login is required", (done) => {
                    window.location = {
                        ...oldWindowLocation,
                        assign: function (url) {
                            try {
                                expect(url).to.not.include(tokenType);
                                expect(url).to.include(idTokenTokenType);
                                expect(url).to.not.include(idTokenType);
                                done();
                            } catch (e) {
                                console.error(e);
                            }
                        }
                    };

                    const oidcScopes = [Constants.openidScope, Constants.profileScope];                        
                    msal.acquireTokenRedirect({ scopes: ['S1', 'S2'], account});
                });
                it("should treat clientId as a resource scope when included with resource scopes and therefore set response_type to id_token token because login is required", (done) => {
                    window.location = {
                        ...oldWindowLocation,
                        assign: function (url) {
                            try {
                                expect(url).to.not.include(tokenType);
                                expect(url).to.include(idTokenTokenType)
                                expect(url).to.not.include(idTokenType);
                                done();
                            } catch (e) {
                                console.error(e);
                            }
                        }
                    };

                    const oidcScopes = [Constants.openidScope, Constants.profileScope];                        
                    msal.acquireTokenRedirect({ scopes: [TEST_CONFIG.MSAL_CLIENT_ID, 'S1'], account});
                });
            }); 
        });
    });
});
