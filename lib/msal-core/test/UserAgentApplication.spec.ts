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
    InteractionRequiredAuthError
} from "../src/index";
import sinon from "sinon";
import { ITenantDiscoveryResponse } from "../src/authority/ITenantDiscoveryResponse";
import { AuthCache } from "../src/cache/AuthCache";
import { AccessTokenKey } from "../src/cache/AccessTokenKey";
import { AccessTokenValue } from "../src/cache/AccessTokenValue";
import { SSOTypes, TemporaryCacheKeys, PersistentCacheKeys, ServerHashParamKeys, RequestStatus } from "../src/utils/Constants";
import { WindowUtils } from "../src/utils/WindowUtils";
import { ClientAuthErrorMessage } from "../src/error/ClientAuthError";
import { ClientConfigurationErrorMessage } from "../src/error/ClientConfigurationError";
import { InteractionRequiredAuthErrorMessage } from "../src/error/InteractionRequiredAuthError";
import { ServerRequestParameters } from "../src/ServerRequestParameters";
import { TEST_URIS, TEST_DATA_CLIENT_INFO, TEST_HASHES, TEST_TOKENS, TEST_CONFIG, TEST_TOKEN_LIFETIMES } from "./TestConstants";
import { IdToken } from "../src/IdToken";
import { TimeUtils } from "../src/utils/TimeUtils";

type kv = {
    [key: string]: string;
};

describe("UserAgentApplication.ts Class", function () {

    // Test state params
    const TEST_USER_STATE_NUM = "1234";
    const TEST_USER_STATE_URL = "https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-implicit-grant-flow/scope1";

    // Test Unique Params
    const TEST_NONCE = "123523";
    const IDTOKEN_OID = "00000000-0000-0000-66f3-3332eca7ea81";
    const TEST_UNIQUE_ID = IDTOKEN_OID;

    // Test Hash Params
    const TEST_ERROR_CODE = "error_code";
    const TEST_ERROR_DESC = "msal error description";

    const TEST_ACCESS_DENIED = "access_denied";
    const TEST_SERVER_ERROR_SUBCODE_CANCEL = "#error=access_denied&error_subcode=cancel&state=RANDOM-GUID-HERE|";

    // Test SSO params
    const TEST_LOGIN_HINT = "test@test.com";
    const TEST_SID = "1234-5678";

    // Sample OpenId Configurations
    const validOpenIdConfigString = `{"authorization_endpoint":"${TEST_CONFIG.validAuthority}/oauth2/v2.0/authorize","token_endpoint":"https://token_endpoint","issuer":"https://fakeIssuer", "end_session_endpoint":"https://end_session_endpoint"}`;
    const validOpenIdConfigurationResponse: ITenantDiscoveryResponse = {
        AuthorizationEndpoint: `${TEST_CONFIG.validAuthority}/oauth2/v2.0/authorize`,
        EndSessionEndpoint: "https://end_session_endpoint",
        Issuer: "https://fakeIssuer"
    };

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

    const setAuthInstanceStubs = function () {
        sinon.restore();
        sinon.stub(msal.getAuthorityInstance(), "resolveEndpointsAsync").callsFake(function () : Promise<Authority> {
            return new Promise((resolve, reject) => {
                return resolve(msal.getAuthorityInstance());
            });
        });
        sinon.stub(msal.getAuthorityInstance(), "AuthorizationEndpoint").value(validOpenIdConfigurationResponse.AuthorizationEndpoint);
        sinon.stub(msal.getAuthorityInstance(), "EndSessionEndpoint").value(validOpenIdConfigurationResponse.EndSessionEndpoint);
        sinon.stub(msal.getAuthorityInstance(), "SelfSignedJwtAudience").value(validOpenIdConfigurationResponse.Issuer);
        sinon.stub(WindowUtils, "isInIframe").returns(false);
    };

    const setUtilUnifiedCacheQPStubs = function (params: kv) {
        sinon.stub(ServerRequestParameters.prototype, <any>"constructUnifiedCacheQueryParameter").returns(params);
        sinon.stub(ServerRequestParameters.prototype, <any>"addSSOParameter").returns(params);
    };

    let cacheStorage: AuthCache;
    let accessTokenKey : AccessTokenKey;
    let accessTokenValue : AccessTokenValue;
    let account : Account;

    const setTestCacheItems = function () {
        accessTokenKey = {
            authority: TEST_CONFIG.validAuthority,
            clientId: "0813e1d1-ad72-46a9-8665-399bba48c201",
            scopes: "S1",
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
    };

    describe("Telemetry in UserAgenApplication", () => {
        it("configure telemtry in UAA happy case smoke test", () => {
            msal = new UserAgentApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID
                },
                system: {
                    telemetry: {
                        applicationName: TEST_CONFIG.applicationName,
                        applicationVersion: TEST_CONFIG.applicationVersion,
                        telemetryEmitter: event => {}
                    }
                }
            });
        });
        it("configure telemtry in UAA missing configuration throws config error", () => {
            const configureTestCase = () => msal = new UserAgentApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID
                },
                system: {
                    // @ts-ignore
                    telemetry: {
                        applicationName: TEST_CONFIG.applicationName,
                        applicationVersion: TEST_CONFIG.applicationVersion,
                    }
                }
            });

            expect(configureTestCase).to.throw(ClientConfigurationError);
        });
        it("telemetry manager exists in UAA when configured", () => {
            msal = new UserAgentApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID
                },
                system: {
                    telemetry: {
                        applicationName: TEST_CONFIG.applicationName,
                        applicationVersion: TEST_CONFIG.applicationVersion,
                        telemetryEmitter: event => {}
                    }
                }
            });
            // @ts-ignore
            expect(msal.telemetryManager).to.not.be.undefined;
            // @ts-ignore
            expect(msal.telemetryManager).to.not.be.null;
        });
        it("telemetry manager doesn't exis in UAA when not configured", () => {
            msal = new UserAgentApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID
                }
            });
            // @ts-ignore
            expect(msal.telemetryManager).to.be.null;
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
            setAuthInstanceStubs();
            setTestCacheItems();

            delete window.location;
        });

        afterEach(function () {
            cacheStorage.clear();
            sinon.restore();
            window.location = oldWindowLocation;
        });

        it("throws error if loginRedirect is called without calling setRedirectCallbacks", function (done) {
            expect(msal.getRedirectUri()).to.be.equal(TEST_URIS.TEST_REDIR_URI);
            expect(msal.loginRedirect.bind(msal)).to.throw(ClientConfigurationError);
            done();
        });

        it("throws error if null argument is passed to either argument of setRedirectCallbacks", (done) => {
            expect(() => msal.handleRedirectCallback(null)).to.throw(ClientConfigurationError);
            done();
        });

        it("navigates user to login and prompt parameter is not passed by default", (done) => {
            window.location = {
                ...oldWindowLocation,
                assign: function (url) {
                    try {
                        expect(url).to.include(TEST_URIS.DEFAULT_INSTANCE + TEST_CONFIG.TENANT + "/oauth2/v2.0/authorize?response_type=id_token&scope=openid%20profile");
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
                        expect(url).to.include(TEST_URIS.DEFAULT_INSTANCE + TEST_CONFIG.TENANT + "/oauth2/v2.0/authorize?response_type=id_token&scope=openid%20profile");
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
                        expect(url).to.include(TEST_URIS.DEFAULT_INSTANCE + TEST_CONFIG.TENANT + "/oauth2/v2.0/authorize?response_type=id_token&scope=openid%20profile");
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
                        expect(url).to.include(TEST_URIS.DEFAULT_INSTANCE + TEST_CONFIG.TENANT + "/oauth2/v2.0/authorize?response_type=id_token&scope=openid%20profile");
                        expect(url).to.include("&client_id=" + TEST_CONFIG.MSAL_CLIENT_ID);
                        expect(url).to.include("&redirect_uri=" + encodeURIComponent(msal.getRedirectUri()));
                        expect(url).to.include("&state");
                        expect(url).to.include("&client_info=1");
                        expect(url).to.include("&login_hint=" + "some_id");
                        expect(url).to.include("&login_req=1234");
                        expect(url).to.include("&domain_req=5678");
                        expect(url).to.include("&domain_hint");
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
                        expect(url).to.include(TEST_URIS.DEFAULT_INSTANCE + TEST_CONFIG.TENANT + "/oauth2/v2.0/authorize?response_type=id_token&scope=openid%20profile");
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
                        expect(url).to.include(TEST_URIS.DEFAULT_INSTANCE + TEST_CONFIG.TENANT + "/oauth2/v2.0/authorize?response_type=id_token&scope=openid%20profile");
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
                        expect(url).to.include(TEST_URIS.DEFAULT_INSTANCE + TEST_CONFIG.TENANT + "/oauth2/v2.0/authorize?response_type=id_token&scope=openid%20profile");
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
                    login_hint: JSON.stringify(TEST_LOGIN_HINT)
                }
            };
            window.location = {
                ...oldWindowLocation,
                assign: function (url) {
                    try {
                        expect(url).to.include(TEST_URIS.DEFAULT_INSTANCE + TEST_CONFIG.TENANT + "/oauth2/v2.0/authorize?response_type=id_token&scope=openid%20profile");
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
                    sid: JSON.stringify(TEST_SID)
                }
            };
            window.location = {
                ...oldWindowLocation,
                assign: function (url) {
                    try {
                        expect(url).to.include(TEST_URIS.DEFAULT_INSTANCE + TEST_CONFIG.TENANT + "/oauth2/v2.0/authorize?response_type=id_token&scope=openid%20profile");
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
                        expect(url).to.include(TEST_URIS.DEFAULT_INSTANCE + TEST_CONFIG.TENANT + "/oauth2/v2.0/authorize?response_type=id_token&scope=openid%20profile");
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

        it("exits login function with error if interaction is true", function (done) {
            cacheStorage.setItem(TemporaryCacheKeys.INTERACTION_STATUS, RequestStatus.IN_PROGRESS);
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

        it("exits login function with error if invalid prompt parameter is passed", function (done) {
            /*
             * TODO: We need to perform upfront parameter validation in order for this test to pass
             * let tokenRequest = {
             *     prompt: "random"
             * };
             * msal.handleRedirectCallbacks(successCallback, errCallback);
             * let authErr: AuthError;
             * try {
             *     msal.loginRedirect(tokenRequest);
             * } catch (e) {
             *     authErr = e;
             * }
             * console.log(authErr);
             */

            /*
             * expect(authErr.errorCode).to.equal(ClientConfigurationErrorMessage.invalidPrompt.code);
             * expect(authErr.errorMessage).to.contain(ClientConfigurationErrorMessage.invalidPrompt.desc);
             * expect(authErr.errorMessage).to.contain(tokenRequest.prompt);
             * expect(authErr.message).to.contain(ClientConfigurationErrorMessage.invalidPrompt.desc);
             * expect(authErr.name).to.equal("ClientConfigurationError");
             * expect(authErr.stack).to.include("UserAgentApplication.spec.ts");
             */
            done();
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

        it("tests if error is thrown when client id is not passed as single scope", function (done) {
            msal.handleRedirectCallback(authCallback);
            let authErr: AuthError;
            try {
                msal.acquireTokenRedirect({
                    scopes: [TEST_CONFIG.MSAL_CLIENT_ID, "S1"]
                });
            } catch (e) {
                authErr = e;
            }
            expect(authErr.errorCode).to.equal(ClientConfigurationErrorMessage.clientScope.code);
            expect(authErr.errorMessage).to.contain(ClientConfigurationErrorMessage.clientScope.desc);
            expect(authErr.message).to.contain(ClientConfigurationErrorMessage.clientScope.desc);
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
            const config: Configuration = {
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                    redirectUri: TEST_URIS.TEST_REDIR_URI
                }
            };
            msal = new UserAgentApplication(config);
            setAuthInstanceStubs();
            setTestCacheItems();
        });

        afterEach(function() {
            cacheStorage.clear();
            sinon.restore();
        });

        it("Calls the error callback if two callbacks are sent", function (done) {
            cacheStorage.setItem(TemporaryCacheKeys.URL_HASH, TEST_HASHES.TEST_ERROR_HASH + TEST_USER_STATE_NUM);
            cacheStorage.setItem(TemporaryCacheKeys.STATE_LOGIN, "RANDOM-GUID-HERE|" + TEST_USER_STATE_NUM);
            const checkErrorFromServer = function(error: AuthError, accountState: string) {
                expect(cacheStorage.getItem(TemporaryCacheKeys.URL_HASH)).to.be.null;
                expect(error instanceof ServerError).to.be.true;
                expect(error.name).to.include("ServerError");
                expect(error.errorCode).to.include(TEST_ERROR_CODE);
                expect(error.errorMessage).to.include(TEST_ERROR_DESC);
                expect(error.message).to.include(TEST_ERROR_DESC);
                expect(error.stack).to.include("UserAgentApplication.spec.ts");
                done();
            };
            msal.handleRedirectCallback(tokenReceivedCallback, checkErrorFromServer);
        });

        it("Calls the token callback if two callbacks are sent", function (done) {
            cacheStorage.setItem(TemporaryCacheKeys.STATE_LOGIN, "RANDOM-GUID-HERE|" + TEST_USER_STATE_NUM);
            cacheStorage.setItem(`${TemporaryCacheKeys.NONCE_IDTOKEN}|RANDOM-GUID-HERE|${TEST_USER_STATE_NUM}`, TEST_NONCE);
            cacheStorage.setItem(TemporaryCacheKeys.URL_HASH, TEST_HASHES.TEST_SUCCESS_ID_TOKEN_HASH + TEST_USER_STATE_NUM);

            const checkResponseFromServer = function(response: AuthResponse) {
                expect(cacheStorage.getItem(TemporaryCacheKeys.URL_HASH)).to.be.null;
                expect(response.uniqueId).to.be.eq(TEST_UNIQUE_ID);
                expect(response.tokenType).to.be.eq(ServerHashParamKeys.ID_TOKEN);
                expect(response.tenantId).to.be.eq(TEST_CONFIG.MSAL_TENANT_ID);
                expect(response.accountState).to.include(TEST_USER_STATE_NUM);
                done();
            };
            msal.handleRedirectCallback(checkResponseFromServer, errorReceivedCallback);
        });

        it("Calls the response callback if single callback is sent", function (done) {
            cacheStorage.setItem(TemporaryCacheKeys.STATE_LOGIN, "RANDOM-GUID-HERE|" + TEST_USER_STATE_NUM);
            cacheStorage.setItem(`${TemporaryCacheKeys.NONCE_IDTOKEN}|RANDOM-GUID-HERE|${TEST_USER_STATE_NUM}`, TEST_NONCE);
            cacheStorage.setItem(TemporaryCacheKeys.URL_HASH, TEST_HASHES.TEST_SUCCESS_ID_TOKEN_HASH + TEST_USER_STATE_NUM);

            const checkResponseFromServer = function(error: AuthError, response: AuthResponse) {
                expect(cacheStorage.getItem(TemporaryCacheKeys.URL_HASH)).to.be.null;
                expect(response.uniqueId).to.be.eq(TEST_UNIQUE_ID);
                expect(response.tokenType).to.be.eq(ServerHashParamKeys.ID_TOKEN);
                expect(response.tenantId).to.be.eq(TEST_CONFIG.MSAL_TENANT_ID);
                expect(response.accountState).to.include(TEST_USER_STATE_NUM);
                done();
            };
            msal.handleRedirectCallback(checkResponseFromServer);
        });
    });

    describe("Cache Storage Unit Tests", function () {

        beforeEach(function () {
            cacheStorage = new AuthCache(TEST_CONFIG.MSAL_CLIENT_ID, "sessionStorage", true);
            const config: Configuration = {
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                    redirectUri: TEST_URIS.TEST_REDIR_URI
                }
            };
            msal = new UserAgentApplication(config);
            setAuthInstanceStubs();
            setTestCacheItems();
        });

        afterEach(function() {
            cacheStorage.clear();
            sinon.restore();
        });

        it("tests getCachedToken when authority is not passed and single accessToken is present in the cache for a set of scopes", function (done) {
            const tokenRequest : AuthenticationParameters = {
                scopes: ["S1"],
                account: account
            };
            const params: kv = {  };
            params[SSOTypes.SID] = account.sid;
            setUtilUnifiedCacheQPStubs(params);

            cacheStorage.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));
            msal.acquireTokenSilent(tokenRequest).then(function(response) {
                expect(response.idToken.rawIdToken).to.equal(TEST_TOKENS.IDTOKEN_V2);
                expect(response.idTokenClaims).to.be.deep.eq(new IdToken(TEST_TOKENS.IDTOKEN_V2).claims);
                expect(response.accessToken).to.be.deep.eq(TEST_TOKENS.ACCESSTOKEN);
                expect(response.account).to.be.eq(account);
                expect(response.scopes).to.be.deep.eq(tokenRequest.scopes);
                expect(response.tokenType).to.be.eq(ServerHashParamKeys.ACCESS_TOKEN);
                done();
            }).catch(function(err) {
                // Won't happen
                console.error("Shouldn't have error here. Data: " + JSON.stringify(err));
            });
        });

        it("tests getCachedToken when authority is not passed and multiple accessTokens are present in the cache for a set of scopes", function (done) {
            const tokenRequest : AuthenticationParameters = {
                scopes: ["S1"],
                account: account
            };
            const params: kv = {  };
            params[SSOTypes.SID] = account.sid;
            setUtilUnifiedCacheQPStubs(params);

            cacheStorage.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));
            accessTokenKey.scopes = "S1 S2";
            accessTokenKey.authority = TEST_CONFIG.alternateValidAuthority;
            cacheStorage.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));

            msal.acquireTokenSilent(tokenRequest).then(function(response) {
                // Won't happen
                console.error("Shouldn't have response here. Data: " + JSON.stringify(response));
            }).catch(function(err: AuthError) {
                expect(err.errorCode).to.include(ClientAuthErrorMessage.multipleMatchingTokens.code);
                expect(err.errorMessage).to.include(ClientAuthErrorMessage.multipleMatchingTokens.desc);
                expect(err.message).to.contain(ClientAuthErrorMessage.multipleMatchingTokens.desc);
                expect(err.name).to.equal("ClientAuthError");
                expect(err.stack).to.include("UserAgentApplication.spec.ts");
                done();
            });
        });

        it("tests getCachedToken without sending authority when no matching accesstoken is found and multiple authorities exist", function (done) {
            const tokenRequest : AuthenticationParameters = {
                scopes: ["S3"],
                account: account
            };
            const params: kv = {  };
            params[SSOTypes.SID] = account.sid;
            setUtilUnifiedCacheQPStubs(params);

            cacheStorage.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));
            accessTokenKey.scopes = "S2";
            accessTokenKey.authority = TEST_CONFIG.alternateValidAuthority;
            cacheStorage.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));

            msal.acquireTokenSilent(tokenRequest).then(function(response) {
                // Won't happen
                console.error("Shouldn't have response here. Data: " + JSON.stringify(response));
            }).catch(function(err: AuthError) {
                expect(err.errorCode).to.include(ClientAuthErrorMessage.multipleCacheAuthorities.code);
                expect(err.errorMessage).to.include(ClientAuthErrorMessage.multipleCacheAuthorities.desc);
                expect(err.message).to.contain(ClientAuthErrorMessage.multipleCacheAuthorities.desc);
                expect(err.name).to.equal("ClientAuthError");
                expect(err.stack).to.include("UserAgentApplication.spec.ts");
                done();
            });
        });

        it("tests getCachedToken when authority is passed and single matching accessToken is found", function (done) {
            const tokenRequest : AuthenticationParameters = {
                authority: TEST_CONFIG.validAuthority,
                scopes: ["S1"],
                account: account
            };
            const tokenRequest2 : AuthenticationParameters = {
                authority: TEST_CONFIG.alternateValidAuthority,
                scopes: ["S1"],
                account: account
            };
            const params: kv = {  };
            params[SSOTypes.SID] = account.sid;
            setUtilUnifiedCacheQPStubs(params);

            accessTokenKey.authority = accessTokenKey.authority + "/";
            cacheStorage.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));
            accessTokenKey.authority = TEST_CONFIG.alternateValidAuthority + "/";
            accessTokenValue.accessToken = "accessToken2";
            cacheStorage.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));

            msal.acquireTokenSilent(tokenRequest).then(function(response) {
                expect(response.scopes).to.be.deep.eq(tokenRequest.scopes);
                expect(response.account).to.be.eq(account);
                expect(response.idToken.rawIdToken).to.eql(TEST_TOKENS.IDTOKEN_V2);
                expect(response.idTokenClaims).to.eql(new IdToken(TEST_TOKENS.IDTOKEN_V2).claims);
                expect(response.accessToken).to.eql(TEST_TOKENS.ACCESSTOKEN);
                expect(response.tokenType).to.be.eq(ServerHashParamKeys.ACCESS_TOKEN);
            }).catch(function(err: AuthError) {
                // Won't happen
                console.error("Shouldn't have error here. Data: " + JSON.stringify(err));
            });

            msal.acquireTokenSilent(tokenRequest2).then(function(response) {
                expect(response.scopes).to.be.deep.eq(tokenRequest2.scopes);
                expect(response.account).to.be.eq(account);
                expect(response.idToken.rawIdToken).to.eql(TEST_TOKENS.IDTOKEN_V2);
                expect(response.idTokenClaims).to.eql(new IdToken(TEST_TOKENS.IDTOKEN_V2).claims);
                expect(response.accessToken).to.include("accessToken2");
                expect(response.tokenType).to.be.eq(ServerHashParamKeys.ACCESS_TOKEN);
                done();
            }).catch(function(err: AuthError) {
                // Won't happen
                console.error("Shouldn't have error here. Data: " + JSON.stringify(err));
            });
        });

        it("tests getCachedToken when authority is passed and multiple matching accessTokens are found", function (done) {
            const tokenRequest : AuthenticationParameters = {
                authority: TEST_CONFIG.validAuthority,
                scopes: ["S1"],
                account: account
            };
            const params: kv = {  };
            params[SSOTypes.SID] = account.sid;
            setUtilUnifiedCacheQPStubs(params);
            accessTokenKey.authority = accessTokenKey.authority + "/";
            cacheStorage.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));
            accessTokenKey.scopes = "S1 S2";
            cacheStorage.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));

            msal.acquireTokenSilent(tokenRequest).then(function(response) {
                console.error("Shouldn't have response here. Data: " + JSON.stringify(response));
            }).catch(function(err: AuthError) {
                expect(err.errorCode).to.include(ClientAuthErrorMessage.multipleMatchingTokens.code);
                expect(err.errorMessage).to.include(ClientAuthErrorMessage.multipleMatchingTokens.desc);
                expect(err.message).to.contain(ClientAuthErrorMessage.multipleMatchingTokens.desc);
                expect(err.name).to.equal("ClientAuthError");
                expect(err.stack).to.include("UserAgentApplication.spec.ts");
                done();
            });
        });

        it("tests getCachedToken when authority is passed and no matching accessToken is found", function (done) {
            const tokenRequest : AuthenticationParameters = {
                authority: TEST_CONFIG.alternateValidAuthority,
                scopes: ["S1"],
                account: account
            };
            const params: kv = {  };
            params[SSOTypes.SID] = account.sid;
            setUtilUnifiedCacheQPStubs(params);

            sinon.stub(msal, <any>"loadIframeTimeout").callsFake(function (url: string, frameName: string) {
                expect(url).to.include(TEST_CONFIG.alternateValidAuthority + "/oauth2/v2.0/authorize?response_type=id_token token&scope=S1%20openid%20profile");
                expect(url).to.include("&client_id=" + TEST_CONFIG.MSAL_CLIENT_ID);
                expect(url).to.include("&redirect_uri=" + encodeURIComponent(msal.getRedirectUri()));
                expect(url).to.include("&state");
                expect(url).to.include("&client_info=1");
                done();
                return {};
            });

            cacheStorage.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));

            msal.acquireTokenSilent(tokenRequest).then(function(response) {
                // Won't happen - we are not testing response here
                console.error("Shouldn't have response here. Data: " + JSON.stringify(response));
            }).catch(function(err: AuthError) {
                // Failure will be caught here since the tests are being run within the stub.
                console.error("Error in assertion: " + JSON.stringify(err));
            });
        });

        it("tests getCachedToken when authority is passed and single matching accessToken is found which is expired", function (done) {
            const tokenRequest : AuthenticationParameters = {
                authority: TEST_CONFIG.alternateValidAuthority,
                scopes: ["S1"],
                account: account
            };
            const params: kv = {  };
            params[SSOTypes.SID] = account.sid;
            setUtilUnifiedCacheQPStubs(params);

            sinon.stub(msal, <any>"loadIframeTimeout").callsFake(function (url: string, frameName: string) {
                expect(cacheStorage.getItem(JSON.stringify(accessTokenKey))).to.be.null;
                expect(url).to.include(TEST_CONFIG.alternateValidAuthority + "/oauth2/v2.0/authorize?response_type=id_token token&scope=S1%20openid%20profile");
                expect(url).to.include("&client_id=" + TEST_CONFIG.MSAL_CLIENT_ID);
                expect(url).to.include("&redirect_uri=" + encodeURIComponent(msal.getRedirectUri()));
                expect(url).to.include("&state");
                expect(url).to.include("&client_info=1");
                done();
                return {};
            });

            accessTokenValue.expiresIn = "1300";
            accessTokenKey.authority = TEST_CONFIG.alternateValidAuthority + "/";
            cacheStorage.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));

            msal.acquireTokenSilent(tokenRequest).then(function(response) {
                // Won't happen - we are not testing response here
                console.error("Shouldn't have response here. Data: " + JSON.stringify(response));
            }).catch(function(err: AuthError) {
                // Failure will be caught here since the tests are being run within the stub.
                console.error("Error in assertion: " + JSON.stringify(err));
            });
        });

        it("tests getCachedToken is skipped when claims are passed in", function (done) {
            const claimsRequestObj: any = {
                "accessToken": {
                    "test": null
                }
            };
            const tokenRequest : AuthenticationParameters = {
                authority: TEST_CONFIG.validAuthority,
                scopes: ["S1"],
                account: account,
                claimsRequest: JSON.stringify(claimsRequestObj)
            };
            const params: kv = {  };
            params[SSOTypes.SID] = account.sid;
            setUtilUnifiedCacheQPStubs(params);
            const cacheCallSpy = sinon.spy(msal, <any>"getCachedToken");

            sinon.stub(msal, <any>"loadIframeTimeout").callsFake(function (url: string, frameName: string) {
                expect(cacheCallSpy.notCalled).to.be.true;
                expect(url).to.include(TEST_CONFIG.validAuthority + "/oauth2/v2.0/authorize?response_type=id_token token&scope=S1%20openid%20profile");
                expect(url).to.include("&client_id=" + TEST_CONFIG.MSAL_CLIENT_ID);
                expect(url).to.include("&redirect_uri=" + encodeURIComponent(msal.getRedirectUri()));
                expect(url).to.include("&state");
                expect(url).to.include("&client_info=1");
                expect(url).to.include("&claims=" + encodeURIComponent(tokenRequest.claimsRequest));
                done();
                return {};
            });

            cacheStorage.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));

            msal.acquireTokenSilent(tokenRequest).then(function(response) {
                // Won't happen - we are not testing response here
                console.error("Shouldn't have response here. Data: " + JSON.stringify(response));
            }).catch(function(err: AuthError) {
                // Failure will be caught here since the tests are being run within the stub.
                console.error("Error in assertion: " + JSON.stringify(err));
            });
        });

        it("tests getCachedToken is skipped when force is set true", function (done) {

            const tokenRequest : AuthenticationParameters = {
                authority: TEST_CONFIG.validAuthority,
                scopes: ["S1"],
                account: account,
                forceRefresh: true
            };

            setUtilUnifiedCacheQPStubs({
                [SSOTypes.SID]: account.sid
            });
            const cacheCallSpy = sinon.spy(msal, <any>"getCachedToken");

            sinon.stub(msal, <any>"loadIframeTimeout").callsFake(function (url: string, frameName: string) {
                expect(cacheCallSpy.notCalled).to.be.true;
                expect(url).to.include(TEST_CONFIG.validAuthority + "/oauth2/v2.0/authorize?response_type=id_token token&scope=S1%20openid%20profile");
                expect(url).to.include("&client_id=" + TEST_CONFIG.MSAL_CLIENT_ID);
                expect(url).to.include("&redirect_uri=" + encodeURIComponent(msal.getRedirectUri()));
                expect(url).to.include("&state");
                expect(url).to.include("&client_info=1");
                done();
                return {};
            });

            cacheStorage.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));

            msal.acquireTokenSilent(tokenRequest).then(function(response) {
                // Won't happen - we are not testing response here
                throw `Shouldn't have response here. Data: ${JSON.stringify(response)}`;
            }).catch(done);
        });
    });

    describe("Processing Authentication Responses", function() {

        beforeEach(function () {
            cacheStorage = new AuthCache(TEST_CONFIG.MSAL_CLIENT_ID, "sessionStorage", true);
            const config: Configuration = {
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                    redirectUri: TEST_URIS.TEST_REDIR_URI
                }
            };
            msal = new UserAgentApplication(config);
            setAuthInstanceStubs();
            setTestCacheItems();
        });

        afterEach(function() {
            cacheStorage.clear();
            sinon.restore();
        });

        it("tests saveTokenForHash in case of response", function(done) {
            const successHash = TEST_HASHES.TEST_SUCCESS_ID_TOKEN_HASH + TEST_USER_STATE_NUM;
            cacheStorage.setItem(TemporaryCacheKeys.STATE_LOGIN, "RANDOM-GUID-HERE|" + TEST_USER_STATE_NUM);
            cacheStorage.setItem(`${TemporaryCacheKeys.NONCE_IDTOKEN}|RANDOM-GUID-HERE|${TEST_USER_STATE_NUM}`, TEST_NONCE);
            cacheStorage.setItem(TemporaryCacheKeys.URL_HASH, successHash);
            const checkRespFromServer = function(response: AuthResponse) {
                expect(response.uniqueId).to.be.eq(TEST_UNIQUE_ID);
                expect(response.tokenType).to.be.eq(ServerHashParamKeys.ID_TOKEN);
                expect(response.tenantId).to.be.eq(TEST_CONFIG.MSAL_TENANT_ID);
                expect(response.accountState).to.be.eq(TEST_USER_STATE_NUM);
                expect(cacheStorage.getItem(TemporaryCacheKeys.URL_HASH)).to.be.null;
                done();
            };
            msal.handleRedirectCallback(checkRespFromServer, errorReceivedCallback);
        });

        it("tests saveTokenForHash in case of error", function(done) {
            cacheStorage.setItem(TemporaryCacheKeys.URL_HASH, TEST_HASHES.TEST_ERROR_HASH + TEST_USER_STATE_NUM);
            cacheStorage.setItem(TemporaryCacheKeys.STATE_LOGIN, "RANDOM-GUID-HERE|" + TEST_USER_STATE_NUM);
            const checkErrorFromServer = function(error: AuthError, response: AuthResponse) {
                expect(cacheStorage.getItem(TemporaryCacheKeys.URL_HASH)).to.be.null;
                expect(error instanceof ServerError).to.be.true;
                expect(error.name).to.include("ServerError");
                expect(error.errorCode).to.include(TEST_ERROR_CODE);
                expect(error.errorMessage).to.include(TEST_ERROR_DESC);
                expect(error.message).to.include(TEST_ERROR_DESC);
                expect(error.stack).to.include("UserAgentApplication.spec.ts");
                done();
            };
            msal.handleRedirectCallback(checkErrorFromServer);
        });

        // TEST_SERVER_ERROR_SUBCODE_CANCEL
        it("tests saveTokenForHash in case of non-consentable scopes / return to the application without consenting", function(done) {
            cacheStorage.setItem(TemporaryCacheKeys.URL_HASH, TEST_SERVER_ERROR_SUBCODE_CANCEL + TEST_USER_STATE_NUM);
            cacheStorage.setItem(TemporaryCacheKeys.STATE_LOGIN, "RANDOM-GUID-HERE|" + TEST_USER_STATE_NUM);
            const checkErrorFromServer = function(error: AuthError, response: AuthResponse) {
                expect(cacheStorage.getItem(TemporaryCacheKeys.URL_HASH)).to.be.null;
                expect(error instanceof ServerError).to.be.true;
                expect(error.name).to.include("ServerError");
                expect(error.errorCode).to.include(TEST_ACCESS_DENIED);
                expect(error.stack).to.include("UserAgentApplication.spec.ts");
                done();
            };
            msal.handleRedirectCallback(checkErrorFromServer);
        });

        it("tests if you get the state back in errorReceived callback, if state is a number", function (done) {
            cacheStorage.setItem(TemporaryCacheKeys.URL_HASH, TEST_HASHES.TEST_ERROR_HASH + TEST_USER_STATE_NUM);
            cacheStorage.setItem(TemporaryCacheKeys.STATE_LOGIN, "RANDOM-GUID-HERE|" + TEST_USER_STATE_NUM);
            const checkErrorHasState = function(error: AuthError, response: AuthResponse) {
                expect(response.accountState).to.include(TEST_USER_STATE_NUM);
                done();
            };
            msal.handleRedirectCallback(checkErrorHasState);
        });

        it("tests if you get the state back in errorReceived callback, if state is a url", function (done) {
            cacheStorage.setItem(TemporaryCacheKeys.URL_HASH, TEST_HASHES.TEST_ERROR_HASH + TEST_USER_STATE_URL);
            cacheStorage.setItem(TemporaryCacheKeys.STATE_LOGIN, "RANDOM-GUID-HERE|" + TEST_USER_STATE_URL);
            const checkErrorHasState = function(error: AuthError, response: AuthResponse) {
                expect(response.accountState).to.include(TEST_USER_STATE_URL);
                done();
            };
            msal.handleRedirectCallback(checkErrorHasState);
        });

        it("tests that isCallback correctly identifies url hash", function (done) {
            expect(msal.isCallback("not a callback")).to.be.false;
            expect(msal.isCallback("#error_description=someting_wrong")).to.be.true;
            expect(msal.isCallback("#/error_description=someting_wrong")).to.be.true;
            expect(msal.isCallback("#access_token=token123")).to.be.true;
            expect(msal.isCallback("#id_token=idtoken234")).to.be.true;
            done();
        });

        it("tests that expiresIn returns the correct date for access tokens", function (done) {
            sinon.stub(TimeUtils, "now").returns(TEST_TOKEN_LIFETIMES.BASELINE_DATE_CHECK);
            const acquireTokenAccountKey = AuthCache.generateAcquireTokenAccountKey(account.homeAccountIdentifier, "RANDOM-GUID-HERE|" + TEST_USER_STATE_NUM);
            cacheStorage.setItem(acquireTokenAccountKey, JSON.stringify(account));
            const successHash = TEST_HASHES.TEST_SUCCESS_ACCESS_TOKEN_HASH + TEST_USER_STATE_NUM;
            cacheStorage.setItem(TemporaryCacheKeys.STATE_ACQ_TOKEN, "RANDOM-GUID-HERE|" + TEST_USER_STATE_NUM);
            cacheStorage.setItem(`${TemporaryCacheKeys.NONCE_IDTOKEN}|RANDOM-GUID-HERE|${TEST_USER_STATE_NUM}`, TEST_NONCE);
            cacheStorage.setItem(TemporaryCacheKeys.URL_HASH, successHash);

            const checkRespFromServer = function(response: AuthResponse) {
                expect(response.uniqueId).to.be.eq(TEST_UNIQUE_ID);
                expect(response.tokenType).to.be.eq(ServerHashParamKeys.ACCESS_TOKEN);
                expect(response.tenantId).to.be.eq(TEST_CONFIG.MSAL_TENANT_ID);
                expect(response.accountState).to.be.eq(TEST_USER_STATE_NUM);
                expect(response.expiresOn.getTime()).to.be.eq((TEST_TOKEN_LIFETIMES.BASELINE_DATE_CHECK + TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN) * 1000);
                expect(cacheStorage.getItem(TemporaryCacheKeys.URL_HASH)).to.be.null;
                done();
            };
            msal.handleRedirectCallback(checkRespFromServer, errorReceivedCallback);
        });

        it("tests that expiresIn returns the correct date for id tokens", function (done) {
            const acquireTokenAccountKey = AuthCache.generateAcquireTokenAccountKey(account.homeAccountIdentifier, "RANDOM-GUID-HERE|" + TEST_USER_STATE_NUM);
            cacheStorage.setItem(acquireTokenAccountKey, JSON.stringify(account));
            const successHash = TEST_HASHES.TEST_SUCCESS_ID_TOKEN_HASH + TEST_USER_STATE_NUM;
            cacheStorage.setItem(TemporaryCacheKeys.STATE_LOGIN, "RANDOM-GUID-HERE|" + TEST_USER_STATE_NUM);
            cacheStorage.setItem(`${TemporaryCacheKeys.NONCE_IDTOKEN}|RANDOM-GUID-HERE|${TEST_USER_STATE_NUM}`, TEST_NONCE);
            cacheStorage.setItem(TemporaryCacheKeys.URL_HASH, successHash);
            const checkRespFromServer = function(response: AuthResponse) {
                expect(response.uniqueId).to.be.eq(TEST_UNIQUE_ID);
                expect(response.tokenType).to.be.eq(ServerHashParamKeys.ID_TOKEN);
                expect(response.tenantId).to.be.eq(TEST_CONFIG.MSAL_TENANT_ID);
                expect(response.accountState).to.be.eq(TEST_USER_STATE_NUM);
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
            const config: Configuration = {
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                    redirectUri: TEST_URIS.TEST_REDIR_URI
                }
            };
            msal = new UserAgentApplication(config);
            setAuthInstanceStubs();
            setTestCacheItems();
        });

        afterEach(function() {
            cacheStorage.clear();
            sinon.restore();
        });

        it("tests saveTokenForHash in case of interaction_required error code", function(done) {
            cacheStorage.setItem(TemporaryCacheKeys.URL_HASH, TEST_HASHES.TEST_INTERACTION_REQ_ERROR_HASH1 + TEST_USER_STATE_NUM);
            cacheStorage.setItem(TemporaryCacheKeys.STATE_LOGIN, "RANDOM-GUID-HERE|" + TEST_USER_STATE_NUM);
            const checkErrorFromServer = function(error: AuthError, response: AuthResponse) {
                expect(cacheStorage.getItem(TemporaryCacheKeys.URL_HASH)).to.be.null;
                expect(error instanceof InteractionRequiredAuthError).to.be.true;
                expect(error.name).to.include("InteractionRequiredAuthError");
                expect(error.errorCode).to.include(InteractionRequiredAuthErrorMessage.interactionRequired.code);
                expect(error.errorMessage).to.include(TEST_ERROR_DESC);
                expect(error.message).to.include(TEST_ERROR_DESC);
                expect(error.stack).to.include("UserAgentApplication.spec.ts");
                done();
            };
            msal.handleRedirectCallback(checkErrorFromServer);
        });

        it("tests saveTokenForHash in case of interaction_required error code and description", function(done) {
            cacheStorage.setItem(TemporaryCacheKeys.URL_HASH, TEST_HASHES.TEST_INTERACTION_REQ_ERROR_HASH2 + TEST_USER_STATE_NUM);
            cacheStorage.setItem(TemporaryCacheKeys.STATE_LOGIN, "RANDOM-GUID-HERE|" + TEST_USER_STATE_NUM);
            const checkErrorFromServer = function(error: AuthError, response: AuthResponse) {
                expect(cacheStorage.getItem(TemporaryCacheKeys.URL_HASH)).to.be.null;
                expect(error instanceof InteractionRequiredAuthError).to.be.true;
                expect(error.name).to.include("InteractionRequiredAuthError");
                expect(error.errorCode).to.include(InteractionRequiredAuthErrorMessage.interactionRequired.code);
                expect(error.errorMessage).to.include(TEST_ERROR_DESC);
                expect(error.message).to.include(TEST_ERROR_DESC);
                expect(error.errorMessage).to.include(InteractionRequiredAuthErrorMessage.interactionRequired.code);
                expect(error.message).to.include(InteractionRequiredAuthErrorMessage.interactionRequired.code);
                expect(error.stack).to.include("UserAgentApplication.spec.ts");
                done();
            };
            msal.handleRedirectCallback(checkErrorFromServer);
        });

        it("tests saveTokenForHash in case of login_required error code", function(done) {
            cacheStorage.setItem(TemporaryCacheKeys.URL_HASH, TEST_HASHES.TEST_LOGIN_REQ_ERROR_HASH1 + TEST_USER_STATE_NUM);
            cacheStorage.setItem(TemporaryCacheKeys.STATE_LOGIN, "RANDOM-GUID-HERE|" + TEST_USER_STATE_NUM);
            const checkErrorFromServer = function(error: AuthError, response: AuthResponse) {
                expect(cacheStorage.getItem(TemporaryCacheKeys.URL_HASH)).to.be.null;
                expect(error instanceof InteractionRequiredAuthError).to.be.true;
                expect(error.name).to.include("InteractionRequiredAuthError");
                expect(error.errorCode).to.include(InteractionRequiredAuthErrorMessage.loginRequired.code);
                expect(error.errorMessage).to.include(TEST_ERROR_DESC);
                expect(error.message).to.include(TEST_ERROR_DESC);
                expect(error.stack).to.include("UserAgentApplication.spec.ts");
                done();
            };
            msal.handleRedirectCallback(checkErrorFromServer);
        });

        it("tests saveTokenForHash in case of login_required error code and description", function(done) {
            cacheStorage.setItem(TemporaryCacheKeys.URL_HASH, TEST_HASHES.TEST_LOGIN_REQ_ERROR_HASH2 + TEST_USER_STATE_NUM);
            cacheStorage.setItem(TemporaryCacheKeys.STATE_LOGIN, "RANDOM-GUID-HERE|" + TEST_USER_STATE_NUM);
            const checkErrorFromServer = function(error: AuthError, response: AuthResponse) {
                expect(cacheStorage.getItem(TemporaryCacheKeys.URL_HASH)).to.be.null;
                expect(error instanceof InteractionRequiredAuthError).to.be.true;
                expect(error.name).to.include("InteractionRequiredAuthError");
                expect(error.errorCode).to.include(InteractionRequiredAuthErrorMessage.loginRequired.code);
                expect(error.errorMessage).to.include(TEST_ERROR_DESC);
                expect(error.message).to.include(TEST_ERROR_DESC);
                expect(error.errorMessage).to.include(InteractionRequiredAuthErrorMessage.loginRequired.code);
                expect(error.message).to.include(InteractionRequiredAuthErrorMessage.loginRequired.code);
                expect(error.stack).to.include("UserAgentApplication.spec.ts");
                done();
            };
            msal.handleRedirectCallback(checkErrorFromServer);
        });

        it("tests saveTokenForHash in case of consent_required error code", function(done) {
            cacheStorage.setItem(TemporaryCacheKeys.URL_HASH, TEST_HASHES.TEST_CONSENT_REQ_ERROR_HASH1 + TEST_USER_STATE_NUM);
            cacheStorage.setItem(TemporaryCacheKeys.STATE_LOGIN, "RANDOM-GUID-HERE|" + TEST_USER_STATE_NUM);
            const checkErrorFromServer = function(error: AuthError, response: AuthResponse) {
                expect(cacheStorage.getItem(TemporaryCacheKeys.URL_HASH)).to.be.null;
                expect(error instanceof InteractionRequiredAuthError).to.be.true;
                expect(error.name).to.include("InteractionRequiredAuthError");
                expect(error.errorCode).to.include(InteractionRequiredAuthErrorMessage.consentRequired.code);
                expect(error.errorMessage).to.include(TEST_ERROR_DESC);
                expect(error.message).to.include(TEST_ERROR_DESC);
                expect(error.stack).to.include("UserAgentApplication.spec.ts");
                done();
            };
            msal.handleRedirectCallback(checkErrorFromServer);
        });

        it("tests saveTokenForHash in case of consent_required error code and description", function(done) {
            cacheStorage.setItem(TemporaryCacheKeys.URL_HASH, TEST_HASHES.TEST_CONSENT_REQ_ERROR_HASH2 + TEST_USER_STATE_NUM);
            cacheStorage.setItem(TemporaryCacheKeys.STATE_LOGIN, "RANDOM-GUID-HERE|" + TEST_USER_STATE_NUM);
            const checkErrorFromServer = function(error: AuthError, response: AuthResponse) {
                expect(cacheStorage.getItem(TemporaryCacheKeys.URL_HASH)).to.be.null;
                expect(error instanceof InteractionRequiredAuthError).to.be.true;
                expect(error.name).to.include("InteractionRequiredAuthError");
                expect(error.errorCode).to.include(InteractionRequiredAuthErrorMessage.consentRequired.code);
                expect(error.errorMessage).to.include(TEST_ERROR_DESC);
                expect(error.message).to.include(TEST_ERROR_DESC);
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
            setAuthInstanceStubs();
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
                        expect(url).to.include(validOpenIdConfigurationResponse.EndSessionEndpoint);
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
                        expect(url).to.include(TEST_URIS.DEFAULT_INSTANCE + TEST_CONFIG.TENANT + "/oauth2/v2.0/logout?");
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
            setAuthInstanceStubs();
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
            setAuthInstanceStubs();
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
            const config: Configuration = {
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                    redirectUri: TEST_URIS.TEST_REDIR_URI
                }
            };
            msal = new UserAgentApplication(config);
            setAuthInstanceStubs();

            delete window.location;
        });

        afterEach(function() {
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

        it("throws an error if configured with a null request", () => {
            let correctError;
            try {
                // @ts-ignore
                msal.acquireTokenPopup();
            } catch (e) {
                expect(e).to.be.instanceOf(ClientConfigurationError);
                correctError = true;
            }
            expect(correctError).to.be.true;
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
            setAuthInstanceStubs();
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

        it("throws an error if configured with a null request", () => {
            let correctError;
            try {
                // @ts-ignore
                msal.acquireTokenSilent();
            } catch (e) {
                expect(e).to.be.instanceOf(ClientConfigurationError);
                correctError = true;
            }
            expect(correctError).to.be.true;
        });

    });
});
