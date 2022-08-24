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
import { ITenantDiscoveryResponse } from "../src/authority/ITenantDiscoveryResponse";
import { AuthCache } from "../src/cache/AuthCache";
import { AccessTokenKey } from "../src/cache/AccessTokenKey";
import { AccessTokenValue } from "../src/cache/AccessTokenValue";
import { SSOTypes, TemporaryCacheKeys, PersistentCacheKeys, ServerHashParamKeys } from "../src/utils/Constants";
import { WindowUtils } from "../src/utils/WindowUtils";
import { ClientAuthErrorMessage } from "../src/error/ClientAuthError";
import { ClientConfigurationErrorMessage } from "../src/error/ClientConfigurationError";
import { InteractionRequiredAuthErrorMessage } from "../src/error/InteractionRequiredAuthError";
import { ServerRequestParameters } from "../src/ServerRequestParameters";
import { TEST_URIS, TEST_DATA_CLIENT_INFO, testHashesForState, TEST_TOKENS, TEST_CONFIG, TEST_TOKEN_LIFETIMES, TEST_RESPONSE_TYPE } from "./TestConstants";
import { IdToken } from "../src/IdToken";
import { TimeUtils } from "../src/utils/TimeUtils";
import { RequestUtils } from "../src/utils/RequestUtils";
import { UrlUtils } from "../src/utils/UrlUtils";
import { AuthorityFactory } from "../src/authority/AuthorityFactory";
import { TrustedAuthority } from "../src/authority/TrustedAuthority";

type kv = {
    [key: string]: string;
};

describe("UserAgentApplication.ts Class", function () {
    // Test state params
    sinon.stub(TimeUtils, "now").returns(TEST_TOKEN_LIFETIMES.BASELINE_DATE_CHECK);
    const TEST_LIBRARY_STATE = RequestUtils.generateLibraryState(Constants.interactionTypeRedirect);

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
    const TEST_SERVER_ERROR_SUBCODE_CANCEL = `#error=access_denied&error_subcode=cancel&state=${TEST_LIBRARY_STATE}|`;

    // Test SSO params
    const TEST_LOGIN_HINT = "test@test.com";
    const TEST_SID = "1234-5678";

    // Sample OpenId Configurations
    const validOpenIdConfigString = `{"authorization_endpoint":"${TEST_CONFIG.validAuthority}oauth2/v2.0/authorize","token_endpoint":"https://token_endpoint","issuer":"https://fakeIssuer", "end_session_endpoint":"https://end_session_endpoint"}`;
    const validOpenIdConfigurationResponse: ITenantDiscoveryResponse = {
        AuthorizationEndpoint: `${TEST_CONFIG.validAuthority}oauth2/v2.0/authorize`,
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
        sinon.stub(msal.getAuthorityInstance(), "resolveEndpointsAsync").callsFake(function () : Promise<ITenantDiscoveryResponse> {
            return new Promise((resolve, reject) => {
                return resolve(validOpenIdConfigurationResponse);
            });
        });
        sinon.stub(msal.getAuthorityInstance(), "AuthorizationEndpoint").value(validOpenIdConfigurationResponse.AuthorizationEndpoint);
        sinon.stub(msal.getAuthorityInstance(), "EndSessionEndpoint").value(validOpenIdConfigurationResponse.EndSessionEndpoint);
        sinon.stub(msal.getAuthorityInstance(), "SelfSignedJwtAudience").value(validOpenIdConfigurationResponse.Issuer);
        sinon.stub(TrustedAuthority, "IsInTrustedHostList").returns(true);
        sinon.stub(WindowUtils, "isInIframe").returns(false);
        sinon.stub(TimeUtils, "now").returns(TEST_TOKEN_LIFETIMES.BASELINE_DATE_CHECK);
    };

    const setUtilUnifiedCacheQPStubs = function (params: kv) {
        sinon.stub(ServerRequestParameters.prototype, <any>"constructUnifiedCacheQueryParameter").returns(params);
        sinon.stub(ServerRequestParameters.prototype, <any>"addSSOParameter").returns(params);
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
            authority: TEST_CONFIG.validAuthority,
            clientId: TEST_CONFIG.MSAL_CLIENT_ID,
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
            authority: TEST_CONFIG.validAuthority,
            clientId: TEST_CONFIG.MSAL_CLIENT_ID,
            scopes: undefined,
            homeAccountIdentifier: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID
        };

        idToken = {
            accessToken: null,
            idToken: TEST_TOKENS.IDTOKEN_V2,
            expiresIn: "150000000000000",
            homeAccountIdentifier: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID
        };
    };

    afterEach(() => {
        sinon.restore();
        window.activeRenewals = {};
        window.renewStates = [];
        window.callbackMappedToRenewStates = {};
        window.promiseMappedToRenewStates = {};
    });

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
            cacheStorage = new AuthCache(TEST_CONFIG.MSAL_CLIENT_ID, "sessionStorage", true);
            const configureTestCase = () => msal = new UserAgentApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                },
                system: {
                    // @ts-ignore
                    telemetry: {
                        applicationName: TEST_CONFIG.applicationName,
                        applicationVersion: TEST_CONFIG.applicationVersion,
                    }
                }
            });
            expect(configureTestCase).toThrowError(ClientConfigurationError);
        });
        it("non stubbed telemetry manager exists in UAA when configured", () => {
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
            expect(msal.telemetryManager).toBeDefined();
            // @ts-ignore
            expect(msal.telemetryManager).not.toBeNull();
            // @ts-ignore
            expect(msal.telemetryManager.telemetryPlatform.applicationName).toBe(TEST_CONFIG.applicationName);
        });
        it("stubbed telemetry manager exists in UAA when not configured", () => {
            msal = new UserAgentApplication({
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID
                }
            });
            // @ts-ignore
            expect(msal.telemetryManager).toBeDefined();
            // @ts-ignore
            expect(msal.telemetryManager).not.toBeNull();
            // @ts-ignore
            expect(msal.telemetryManager.telemetryPlatform.applicationName).toBe("UnSetStub");
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

        it("throws error if null argument is passed to either argument of setRedirectCallbacks", (done) => {
            expect(() => msal.handleRedirectCallback(null)).toThrowError(ClientConfigurationError);
            done();
        });

        it("navigates user to redirectURI passed in the request config", (done) => {
            window.location = {
                ...oldWindowLocation
            };
            sinon.stub(window.location, "assign").callsFake((url) => {
                try {
                    expect(url).toContain(
                        TEST_URIS.DEFAULT_INSTANCE + TEST_CONFIG.TENANT + "oauth2/v2.0/authorize?response_type=id_token&scope=openid%20profile"
                    );
                    expect(url).toContain("&client_id=" + TEST_CONFIG.MSAL_CLIENT_ID);
                    expect(url).toContain("&redirect_uri=" + encodeURIComponent("http://localhost:3000"));
                    expect(url).toContain("&state");
                    expect(url).toContain("&client_info=1");
                    done();
                } catch (e) {
                    console.error(e);
                }
            });
            msal.handleRedirectCallback(authCallback);
            expect(msal.getRedirectUri()).toBe(TEST_URIS.TEST_REDIR_URI);

            const request: AuthenticationParameters = { redirectUri: "http://localhost:3000" };
            msal.loginRedirect(request);
        });

        it("state in returned hash contains expected fields", (done) => {
            window.location = {
                ...oldWindowLocation
            };
            sinon.stub(window.location, "assign").callsFake((url) => {
                try {
                    expect(url).toContain("&state");
                    const hash = UrlUtils.getHashFromUrl(url);
                    // @ts-ignore
                    const state = UrlUtils.deserializeHash(hash).state;
                    const decodedState = CryptoUtils.base64Decode(state);
                    const stateObj = JSON.parse(decodedState);

                    expect(stateObj).toHaveProperty("id");
                    expect(stateObj).toHaveProperty("ts");
                    expect(stateObj).toHaveProperty("method");
                    expect(stateObj.method).toBe(Constants.interactionTypeRedirect);

                    done();
                } catch (e) {
                    console.error(e);
                }
            });
            msal.handleRedirectCallback(authCallback);
            expect(msal.getRedirectUri()).toBe(TEST_URIS.TEST_REDIR_URI);

            const request: AuthenticationParameters = { redirectUri: "http://localhost:3000" };
            msal.loginRedirect(request);
        });

        it("navigates user to login and prompt parameter is not passed by default", (done) => {
            window.location = {
                ...oldWindowLocation
            };
            sinon.stub(window.location, "assign").callsFake((url) => {
                try {
                    expect(url).toContain(
                        TEST_URIS.DEFAULT_INSTANCE + TEST_CONFIG.TENANT + "oauth2/v2.0/authorize?response_type=id_token&scope=openid%20profile"
                    );
                    expect(url).toContain("&client_id=" + TEST_CONFIG.MSAL_CLIENT_ID);
                    expect(url).toContain("&redirect_uri=" + encodeURIComponent(msal.getRedirectUri()));
                    expect(url).toContain("&state");
                    expect(url).toContain("&client_info=1");
                    done();
                } catch (e) {
                    console.error(e);
                }
            })
            msal.handleRedirectCallback(authCallback);
            expect(msal.getRedirectUri()).toBe(TEST_URIS.TEST_REDIR_URI);
            msal.loginRedirect({});
        });

        it("navigates user to login and prompt=select_account parameter is passed in request", (done) => {
            window.location = {
                ...oldWindowLocation
            };
            sinon.stub(window.location, "assign").callsFake((url) => {
                try {
                    expect(url).toContain(
                        TEST_URIS.DEFAULT_INSTANCE + TEST_CONFIG.TENANT + "oauth2/v2.0/authorize?response_type=id_token&scope=openid%20profile"
                    );
                    expect(url).toContain("&client_id=" + TEST_CONFIG.MSAL_CLIENT_ID);
                    expect(url).toContain("&redirect_uri=" + encodeURIComponent(msal.getRedirectUri()));
                    expect(url).toContain("&state");
                    expect(url).toContain("&client_info=1");
                    expect(url).toContain(Constants.prompt_select_account);
                    done();
                } catch (e) {
                    console.error(e);
                }
            })
            
            msal.handleRedirectCallback(authCallback);
            expect(msal.getRedirectUri()).toBe(TEST_URIS.TEST_REDIR_URI);

            const request: AuthenticationParameters = { prompt: "select_account" };
            msal.loginRedirect(request);
        });

        it("navigates user to login and prompt=none parameter is passed in request", (done) => {
            window.location = {
                ...oldWindowLocation,
                assign: function (url) {
                    try {
                        expect(url).toContain(
                            TEST_URIS.DEFAULT_INSTANCE + TEST_CONFIG.TENANT + "oauth2/v2.0/authorize?response_type=id_token&scope=openid%20profile"
                        );
                        expect(url).toContain("&client_id=" + TEST_CONFIG.MSAL_CLIENT_ID);
                        expect(url).toContain("&redirect_uri=" + encodeURIComponent(msal.getRedirectUri()));
                        expect(url).toContain("&state");
                        expect(url).toContain("&client_info=1");
                        expect(url).toContain(Constants.prompt_none);
                        done();
                    } catch (e) {
                        console.error(e);
                    }
                }
            };
            msal.handleRedirectCallback(authCallback);
            expect(msal.getRedirectUri()).toBe(TEST_URIS.TEST_REDIR_URI);

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
                        expect(url).toContain(
                            TEST_URIS.DEFAULT_INSTANCE + TEST_CONFIG.TENANT + "oauth2/v2.0/authorize?response_type=id_token&scope=openid%20profile"
                        );
                        expect(url).toContain("&client_id=" + TEST_CONFIG.MSAL_CLIENT_ID);
                        expect(url).toContain("&redirect_uri=" + encodeURIComponent(msal.getRedirectUri()));
                        expect(url).toContain("&state");
                        expect(url).toContain("&client_info=1");
                        expect(url).toContain("&login_hint=" + "some_id");
                        expect(url).not.toContain("&domain_hint");
                        expect(url).toContain(Constants.prompt_select_account);
                        expect(url).not.toContain(Constants.prompt_none);
                        done();
                    } catch (e) {
                        console.error(e);
                    }
                }
            };
            msal.handleRedirectCallback(authCallback);
            expect(msal.getRedirectUri()).toBe(TEST_URIS.TEST_REDIR_URI);
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
                        expect(url).toContain(
                            TEST_URIS.DEFAULT_INSTANCE + TEST_CONFIG.TENANT + "oauth2/v2.0/authorize?response_type=id_token&scope=openid%20profile"
                        );
                        expect(url).toContain("&client_id=" + TEST_CONFIG.MSAL_CLIENT_ID);
                        expect(url).toContain("&redirect_uri=" + encodeURIComponent(msal.getRedirectUri()));
                        expect(url).toContain("&state");
                        expect(url).toContain("&client_info=1");
                        expect(url).toContain("&claims=" + encodeURIComponent(tokenRequest.claimsRequest));
                        done();
                    } catch (e) {
                        console.error(e);
                    }
                }
            };
            msal.handleRedirectCallback(tokenReceivedCallback, errorReceivedCallback);
            expect(msal.getRedirectUri()).toBe(TEST_URIS.TEST_REDIR_URI);
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
                        expect(url).toContain(
                            TEST_URIS.DEFAULT_INSTANCE + TEST_CONFIG.TENANT + "oauth2/v2.0/authorize?response_type=id_token&scope=openid%20profile"
                        );
                        expect(url).toContain("&client_id=" + TEST_CONFIG.MSAL_CLIENT_ID);
                        expect(url).toContain("&redirect_uri=" + encodeURIComponent(msal.getRedirectUri()));
                        expect(url).toContain("&state");
                        expect(url).toContain("&client_info=1");
                        expect(url).toContain("&claims=" + encodeURIComponent(tokenRequest.extraQueryParameters.claims));
                        done();
                    } catch (e) {
                        console.error(e);
                    }
                }
            };
            msal.handleRedirectCallback(tokenReceivedCallback, errorReceivedCallback);
            expect(msal.getRedirectUri()).toBe(TEST_URIS.TEST_REDIR_URI);
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
                        expect(url).toContain(
                            TEST_URIS.DEFAULT_INSTANCE + TEST_CONFIG.TENANT + "oauth2/v2.0/authorize?response_type=id_token&scope=openid%20profile"
                        );
                        expect(url).toContain("&client_id=" + TEST_CONFIG.MSAL_CLIENT_ID);
                        expect(url).toContain("&redirect_uri=" + encodeURIComponent(msal.getRedirectUri()));
                        expect(url).toContain("&state");
                        expect(url).toContain("&client_info=1");
                        expect(url).toContain("&claims=" + encodeURIComponent(tokenRequest.claimsRequest));
                        done();
                    } catch (e) {
                        console.error(e);
                    }
                }
            };
            msal.handleRedirectCallback(tokenReceivedCallback, errorReceivedCallback);
            expect(msal.getRedirectUri()).toBe(TEST_URIS.TEST_REDIR_URI);
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
                        expect(url).toContain(
                            TEST_URIS.DEFAULT_INSTANCE + TEST_CONFIG.TENANT + "oauth2/v2.0/authorize?response_type=id_token&scope=openid%20profile"
                        );
                        expect(url).toContain("&client_id=" + TEST_CONFIG.MSAL_CLIENT_ID);
                        expect(url).toContain("&redirect_uri=" + encodeURIComponent(msal.getRedirectUri()));
                        expect(url).toContain("&state");
                        expect(url).toContain("&client_info=1");
                        expect(url).not.toContain("&login_hint=");
                        expect(url).not.toContain(
                            encodeURIComponent(tokenRequestWithoutLoginHint.extraQueryParameters[SSOTypes.LOGIN_HINT])
                        );
                        done();
                    } catch (e) {
                        console.error(e);
                    }
                }
            };
            msal.handleRedirectCallback(tokenReceivedCallback, errorReceivedCallback);
            expect(msal.getRedirectUri()).toBe(TEST_URIS.TEST_REDIR_URI);
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
                        expect(url).toContain(
                            TEST_URIS.DEFAULT_INSTANCE + TEST_CONFIG.TENANT + "oauth2/v2.0/authorize?response_type=id_token&scope=openid%20profile"
                        );
                        expect(url).toContain("&client_id=" + TEST_CONFIG.MSAL_CLIENT_ID);
                        expect(url).toContain("&redirect_uri=" + encodeURIComponent(msal.getRedirectUri()));
                        expect(url).toContain("&state");
                        expect(url).toContain("&client_info=1");
                        expect(url).not.toContain("&sid=");
                        expect(url).not.toContain(
                            encodeURIComponent(tokenRequestWithoutLoginHint.extraQueryParameters[SSOTypes.SID])
                        );
                        done();
                    } catch (e) {
                        console.error(e);
                    }
                }
            };
            msal.handleRedirectCallback(tokenReceivedCallback, errorReceivedCallback);
            expect(msal.getRedirectUri()).toBe(TEST_URIS.TEST_REDIR_URI);
            msal.loginRedirect(tokenRequestWithoutLoginHint);
        });

        it("navigates user to redirectURI passed in constructor config", (done) => {
            window.location = {
                ...oldWindowLocation,
                assign: function (url) {
                    try {
                        expect(url).toContain(
                            TEST_URIS.DEFAULT_INSTANCE + TEST_CONFIG.TENANT + "oauth2/v2.0/authorize?response_type=id_token&scope=openid%20profile"
                        );
                        expect(url).toContain("&client_id=" + TEST_CONFIG.MSAL_CLIENT_ID);
                        expect(url).toContain("&redirect_uri=" + encodeURIComponent(msal.getRedirectUri()));
                        expect(url).toContain("&state");
                        expect(url).toContain("&client_info=1");
                        done();
                    } catch (e) {
                        console.error(e);
                    }
                }
            };
            msal.handleRedirectCallback(authCallback);
            expect(msal.getRedirectUri()).toBe(TEST_URIS.TEST_REDIR_URI);

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
                        expect(url).toContain("&redirect_uri=" + encodeURIComponent(TEST_URIS.TEST_REDIR_URI));
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
                    expect(url).not.toBeNull();

                    done();
                    return false;
                }
            });
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
                    expect(url).not.toBeNull();

                    done();
                    return false;
                }
            });
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
                    expect(url).not.toBeNull();
                    done();
                }
            };

            msal = new UserAgentApplication(config);
            msal.handleRedirectCallback(authCallback);
            msal.loginRedirect({
                onRedirectNavigate: url => {
                    expect(url).not.toBeNull();
                }
            });
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
                    expect(url).not.toBeNull();
                    done();
                }
            };

            msal = new UserAgentApplication(config);
            msal.handleRedirectCallback(authCallback);
            msal.loginRedirect({
                onRedirectNavigate: url => {
                    expect(url).not.toBeNull();

                    return true;
                }
            });
        });

        it("calls error callback on loginRedirect if interaction is true", function (done) {
            cacheStorage.setInteractionInProgress(true);
            window.location = oldWindowLocation;
            const checkErrorFromLibrary = function (authErr: AuthError) {
                expect(authErr instanceof ClientAuthError).toBe(true);
                expect(authErr.errorCode).toBe(ClientAuthErrorMessage.loginProgressError.code);
                expect(authErr.errorMessage).toBe(ClientAuthErrorMessage.loginProgressError.desc);
                expect(authErr.message).toBe(ClientAuthErrorMessage.loginProgressError.desc);
                expect(authErr.name).toBe("ClientAuthError");
                expect(authErr.stack).toContain("UserAgentApplication.spec.ts");
                done();
            };
            msal.handleRedirectCallback(checkErrorFromLibrary);
            msal.loginRedirect();
        });

        it("calls error callback on loginRedirect if a different clientId has interaction in progress", function (done) {
            const differentCache = new AuthCache("different-client-id", "sessionStorage", true);
            differentCache.setInteractionInProgress(true);
            window.location = oldWindowLocation;
            const checkErrorFromLibrary = function (authErr: AuthError) {
                expect(authErr instanceof ClientAuthError).toBe(true);
                expect(authErr.errorCode).toBe(ClientAuthErrorMessage.loginProgressError.code);
                expect(authErr.errorMessage).toBe(ClientAuthErrorMessage.loginProgressError.desc);
                expect(authErr.message).toBe(ClientAuthErrorMessage.loginProgressError.desc);
                expect(authErr.name).toBe("ClientAuthError");
                expect(authErr.stack).toContain("UserAgentApplication.spec.ts");
                differentCache.clear();
                done();
            };
            msal.handleRedirectCallback(checkErrorFromLibrary);
            msal.loginRedirect();
        });

        it("calls error callback on acquireTokenRedirect if interaction is true", function (done) {
            cacheStorage.setInteractionInProgress(true);
            window.location = oldWindowLocation;
            const checkErrorFromLibrary = function (authErr: AuthError) {
                expect(authErr instanceof ClientAuthError).toBe(true);
                expect(authErr.errorCode).toBe(ClientAuthErrorMessage.acquireTokenProgressError.code);
                expect(authErr.errorMessage).toBe(ClientAuthErrorMessage.acquireTokenProgressError.desc);
                expect(authErr.message).toBe(ClientAuthErrorMessage.acquireTokenProgressError.desc);
                expect(authErr.name).toBe("ClientAuthError");
                expect(authErr.stack).toContain("UserAgentApplication.spec.ts");
                done();
            };
            msal.handleRedirectCallback(checkErrorFromLibrary);
            msal.acquireTokenRedirect({scopes: [ "user.read" ]});
        });

        it("calls error callback on acquireTokenRedirect if a different clientId has interaction in progress", function (done) {
            const differentCache = new AuthCache("different-client-id", "sessionStorage", true);
            differentCache.setInteractionInProgress(true);
            window.location = oldWindowLocation;
            const checkErrorFromLibrary = function (authErr: AuthError) {
                expect(authErr instanceof ClientAuthError).toBe(true);
                expect(authErr.errorCode).toBe(ClientAuthErrorMessage.acquireTokenProgressError.code);
                expect(authErr.errorMessage).toBe(ClientAuthErrorMessage.acquireTokenProgressError.desc);
                expect(authErr.message).toBe(ClientAuthErrorMessage.acquireTokenProgressError.desc);
                expect(authErr.name).toBe("ClientAuthError");
                expect(authErr.stack).toContain("UserAgentApplication.spec.ts");
                differentCache.clear();
                done();
            };
            msal.handleRedirectCallback(checkErrorFromLibrary);
            msal.acquireTokenRedirect({scopes: [ "user.read" ]});
        });

        it("throws error on loginRedirect if interaction is true", function (done) {
            cacheStorage.setInteractionInProgress(true);
            window.location = oldWindowLocation;
            try {
                msal.loginRedirect();
            } catch(authErr) {
                expect(authErr instanceof ClientAuthError).toBe(true);
                expect(authErr.errorCode).toBe(ClientAuthErrorMessage.loginProgressError.code);
                expect(authErr.errorMessage).toBe(ClientAuthErrorMessage.loginProgressError.desc);
                expect(authErr.message).toBe(ClientAuthErrorMessage.loginProgressError.desc);
                done();
            }
        });

        it("throws error on loginRedirect if a different clientId has interaction in progress", function (done) {
            const differentCache = new AuthCache("different-client-id", "sessionStorage", true);
            differentCache.setInteractionInProgress(true);
            window.location = oldWindowLocation;
            try {
                msal.loginRedirect();
            } catch(authErr) {
                expect(authErr instanceof ClientAuthError).toBe(true);
                expect(authErr.errorCode).toBe(ClientAuthErrorMessage.loginProgressError.code);
                expect(authErr.errorMessage).toBe(ClientAuthErrorMessage.loginProgressError.desc);
                expect(authErr.message).toBe(ClientAuthErrorMessage.loginProgressError.desc);
                differentCache.clear();
                done();
            }
        });

        it("throws error on acquireTokenRedirect if interaction is true", function (done) {
            cacheStorage.setInteractionInProgress(true);
            window.location = oldWindowLocation;
            try {
                msal.acquireTokenRedirect({scopes: [ "user.read" ]});
            } catch(authErr) {
                expect(authErr instanceof ClientAuthError).toBe(true);
                expect(authErr.errorCode).toBe(ClientAuthErrorMessage.acquireTokenProgressError.code);
                expect(authErr.errorMessage).toBe(ClientAuthErrorMessage.acquireTokenProgressError.desc);
                expect(authErr.message).toBe(ClientAuthErrorMessage.acquireTokenProgressError.desc);
                done();
            }
        });

        it("throws error on acquireTokenRedirect if a different clientId has interaction in progress", function (done) {
            const differentCache = new AuthCache("different-client-id", "sessionStorage", true);
            differentCache.setInteractionInProgress(true);
            window.location = oldWindowLocation;
            try {
                msal.acquireTokenRedirect({scopes: [ "user.read" ]});
            } catch(authErr) {
                expect(authErr instanceof ClientAuthError).toBe(true);
                expect(authErr.errorCode).toBe(ClientAuthErrorMessage.acquireTokenProgressError.code);
                expect(authErr.errorMessage).toBe(ClientAuthErrorMessage.acquireTokenProgressError.desc);
                expect(authErr.message).toBe(ClientAuthErrorMessage.acquireTokenProgressError.desc);
                differentCache.clear();
                done();
            }
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

        it("Account is cached on acquireTokenRedirect call", (done) => {
            const tokenRequest: AuthenticationParameters = {
                scopes: ["S1"], 
                account: account
            };

            window.location = {
                ...oldWindowLocation,
                assign: function (url) {
                    try {
                        // @ts-ignore
                        const state = UrlUtils.deserializeHash(url).state;
                        const accountKey = AuthCache.generateAcquireTokenAccountKey(account.homeAccountIdentifier, state);

                        expect(cacheStorage.getItem(accountKey)).toBe(JSON.stringify(account));
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
                        // @ts-ignore
                        const state = UrlUtils.deserializeHash(url).state;

                        expect(cacheStorage.getItem(AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.STATE_ACQ_TOKEN, `${state}`))).toBe(state);
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
                        // @ts-ignore
                        const state = UrlUtils.deserializeHash(url).state;

                        expect(cacheStorage.getItem(AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.LOGIN_REQUEST, `${state}`))).toBe(loginRequestUrl);
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
            expect(authErr.errorCode).toBe(ClientConfigurationErrorMessage.scopesRequired.code);
            expect(authErr.errorMessage).toContain(ClientConfigurationErrorMessage.scopesRequired.desc);
            expect(authErr.message).toContain(ClientConfigurationErrorMessage.scopesRequired.desc);
            expect(authErr.name).toBe("ClientConfigurationError");
            expect(authErr.stack).toContain("UserAgentApplication.spec.ts");
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
            expect(authErr.errorCode).toBe(ClientConfigurationErrorMessage.emptyScopes.code);
            expect(authErr.errorMessage).toContain(ClientConfigurationErrorMessage.emptyScopes.desc);
            expect(authErr.message).toContain(ClientConfigurationErrorMessage.emptyScopes.desc);
            expect(authErr.name).toBe("ClientConfigurationError");
            expect(authErr.stack).toContain("UserAgentApplication.spec.ts");
            done();
        });

        it("throws an error if configured with a null request", () => {
            let correctError;
            try {
                // @ts-ignore
                msal.acquireTokenRedirect();
            } catch (e) {
                expect(e).toBeInstanceOf(ClientConfigurationError);
                correctError = true;
            }
            expect(correctError).toBe(true);
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

            setAuthInstanceStubs();
            setTestCacheItems();
            cacheStorage.setInteractionInProgress(true);
        });

        afterEach(function() {
            window.location.hash = "";
            config = {auth: {clientId: ""}};
            cacheStorage.clear();
            sinon.restore();
        });

        it("Calls the error callback if two callbacks are sent", function (done) {
            window.location.hash = testHashesForState(TEST_LIBRARY_STATE).TEST_ERROR_HASH + TEST_USER_STATE_NUM;
            cacheStorage.setItem(AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.STATE_LOGIN, `${TEST_LIBRARY_STATE}|${TEST_USER_STATE_NUM}`), `${TEST_LIBRARY_STATE}|${TEST_USER_STATE_NUM}`);

            msal = new UserAgentApplication(config);

            const checkErrorFromServer = function(error: AuthError, accountState: string) {
                expect(cacheStorage.getItem(TemporaryCacheKeys.URL_HASH)).toBeNull();
                expect(error instanceof ServerError).toBe(true);
                expect(error.name).toContain("ServerError");
                expect(error.errorCode).toContain(TEST_ERROR_CODE);
                expect(error.errorMessage).toContain(TEST_ERROR_DESC);
                expect(error.message).toContain(TEST_ERROR_DESC);
                expect(error.stack).toContain("UserAgentApplication.spec.ts");
                done();
            };
            msal.handleRedirectCallback(tokenReceivedCallback, checkErrorFromServer);
        });

        it("Calls the token callback if two callbacks are sent", function (done) {
            cacheStorage.setItem(AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.STATE_LOGIN, `${TEST_LIBRARY_STATE}|${TEST_USER_STATE_NUM}`), `${TEST_LIBRARY_STATE}|${TEST_USER_STATE_NUM}`);
            cacheStorage.setItem(AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.NONCE_IDTOKEN, `${TEST_LIBRARY_STATE}|${TEST_USER_STATE_NUM}`), TEST_NONCE);
            window.location.hash = testHashesForState(TEST_LIBRARY_STATE).TEST_SUCCESS_ID_TOKEN_HASH + TEST_USER_STATE_NUM;

            msal = new UserAgentApplication(config);

            const checkResponseFromServer = function(response: AuthResponse) {
                expect(cacheStorage.getItem(TemporaryCacheKeys.URL_HASH)).toBeNull();
                expect(response.uniqueId).toBe(TEST_UNIQUE_ID);
                expect(response.tokenType).toBe(ServerHashParamKeys.ID_TOKEN);
                expect(response.tenantId).toBe(TEST_CONFIG.MSAL_TENANT_ID);
                expect(response.accountState).toContain(TEST_USER_STATE_NUM);
                done();
            };
            msal.handleRedirectCallback(checkResponseFromServer, errorReceivedCallback);
        });

        it("Calls the response callback if single callback is sent", function (done) {
            cacheStorage.setItem(AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.STATE_LOGIN, `${TEST_LIBRARY_STATE}|${TEST_USER_STATE_NUM}`), `${TEST_LIBRARY_STATE}|${TEST_USER_STATE_NUM}`);
            cacheStorage.setItem(AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.NONCE_IDTOKEN, `${TEST_LIBRARY_STATE}|${TEST_USER_STATE_NUM}`), TEST_NONCE);
            window.location.hash = testHashesForState(TEST_LIBRARY_STATE).TEST_SUCCESS_ID_TOKEN_HASH + TEST_USER_STATE_NUM;

            msal = new UserAgentApplication(config);

            const checkResponseFromServer = function(error: AuthError, response: AuthResponse) {
                expect(cacheStorage.getItem(TemporaryCacheKeys.URL_HASH)).toBeNull();
                expect(response.uniqueId).toBe(TEST_UNIQUE_ID);
                expect(response.tokenType).toBe(ServerHashParamKeys.ID_TOKEN);
                expect(response.tenantId).toBe(TEST_CONFIG.MSAL_TENANT_ID);
                expect(response.accountState).toContain(TEST_USER_STATE_NUM);
                done();
            };
            msal.handleRedirectCallback(checkResponseFromServer);
        });

        it("Hash is processed in redirect case even if in popup or new tab", function (done) {
            const oldWindowOpener = window.opener;
            window.opener = "different_window";

            cacheStorage.setItem(AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.STATE_LOGIN, `${TEST_LIBRARY_STATE}|${TEST_USER_STATE_NUM}`), `${TEST_LIBRARY_STATE}|${TEST_USER_STATE_NUM}`);
            cacheStorage.setItem(AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.NONCE_IDTOKEN, `${TEST_LIBRARY_STATE}|${TEST_USER_STATE_NUM}`), TEST_NONCE);
            window.location.hash = testHashesForState(TEST_LIBRARY_STATE).TEST_SUCCESS_ID_TOKEN_HASH + TEST_USER_STATE_NUM;

            msal = new UserAgentApplication(config);

            const checkResponseFromServer = function(error: AuthError, response: AuthResponse) {
                expect(cacheStorage.getItem(TemporaryCacheKeys.URL_HASH)).toBeNull();
                expect(response.uniqueId).toBe(TEST_UNIQUE_ID);
                expect(response.tokenType).toBe(ServerHashParamKeys.ID_TOKEN);
                expect(response.tenantId).toBe(TEST_CONFIG.MSAL_TENANT_ID);
                expect(response.accountState).toContain(TEST_USER_STATE_NUM);
                done();
            };
            msal.handleRedirectCallback(checkResponseFromServer);
            expect(window.location.hash).toBe("");
            window.opener = oldWindowOpener;
        });

        it("Hash is not processed in popup case" , function () {
            const oldWindowOpener = window.opener;
            window.opener = "different_window";
            const TEST_LIBRARY_STATE_POPUP = RequestUtils.generateLibraryState(Constants.interactionTypePopup);

            cacheStorage.setItem(AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.STATE_LOGIN, `${TEST_LIBRARY_STATE_POPUP}|${TEST_USER_STATE_NUM}`), `${TEST_LIBRARY_STATE_POPUP}|${TEST_USER_STATE_NUM}`);
            cacheStorage.setItem(AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.NONCE_IDTOKEN, `${TEST_LIBRARY_STATE_POPUP}|${TEST_USER_STATE_NUM}`), TEST_NONCE);
            window.location.hash = testHashesForState(TEST_LIBRARY_STATE_POPUP).TEST_SUCCESS_ID_TOKEN_HASH + TEST_USER_STATE_NUM;

            const hashBeforeProcessing = window.location.hash;
            let callbackExecuted = false;
            msal = new UserAgentApplication(config);

            const checkResponseFromServer = function(error: AuthError, response: AuthResponse) {
                callbackExecuted = true;
            };

            msal.handleRedirectCallback(checkResponseFromServer);

            expect(callbackExecuted).toBe(false);
            expect(window.location.hash).toBe(hashBeforeProcessing);
            window.opener = oldWindowOpener;
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
            cacheStorage.setItem(JSON.stringify(idTokenKey), JSON.stringify(idToken));
            
            msal.acquireTokenSilent(tokenRequest).then(function(response) {
                expect(response.idToken.rawIdToken).toBe(TEST_TOKENS.IDTOKEN_V2);
                expect(response.idTokenClaims).toEqual(new IdToken(TEST_TOKENS.IDTOKEN_V2).claims);
                expect(response.accessToken).toEqual(TEST_TOKENS.ACCESSTOKEN);
                expect(response.account).toBe(account);
                expect(response.scopes).toEqual(["s1"]);
                expect(response.tokenType).toBe(ServerHashParamKeys.ACCESS_TOKEN);
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
            cacheStorage.setItem(JSON.stringify(idTokenKey), JSON.stringify(idToken));

            msal.acquireTokenSilent(tokenRequest).then(function(response) {
                expect(response.idToken.rawIdToken).toBe(TEST_TOKENS.IDTOKEN_V2);
                expect(response.idTokenClaims).toEqual(new IdToken(TEST_TOKENS.IDTOKEN_V2).claims);
                expect(response.accessToken).toEqual(TEST_TOKENS.ACCESSTOKEN);
                expect(response.account).toBe(account);
                expect(response.scopes).toEqual(["s1"]);
                expect(response.tokenType).toBe(ServerHashParamKeys.ACCESS_TOKEN);
                done();
            }).catch(function(err: AuthError) {
                // Won't happen
                console.error("Shouldn't have error here. Data: " + JSON.stringify(err));
            });
        });

        it("tests getCachedToken when common authority is passed and single matching accessToken is found", function (done) {
            const tokenRequest : AuthenticationParameters = {
                authority: TEST_CONFIG.validAuthority,
                scopes: ["S1"],
                account: account
            };
            const tokenRequestAlternate : AuthenticationParameters = {
                authority: TEST_CONFIG.alternateValidAuthority,
                scopes: ["S1"],
                account: account
            };
           
            const params: kv = {  };
            params[SSOTypes.SID] = account.sid;
            setUtilUnifiedCacheQPStubs(params);

            accessTokenKey.authority = TEST_URIS.DEFAULT_INSTANCE + "common/";
            cacheStorage.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));
            accessTokenKey.authority = TEST_URIS.ALTERNATE_INSTANCE + "common/";
            accessTokenValue.accessToken = "accessTokenAlternate";
            cacheStorage.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));
            cacheStorage.setItem(JSON.stringify(idTokenKey), JSON.stringify(idToken));
            idTokenKey.authority = TEST_URIS.ALTERNATE_INSTANCE + "common/";
            cacheStorage.setItem(JSON.stringify(idTokenKey), JSON.stringify(idToken));

            msal.acquireTokenSilent(tokenRequest).then(function(response) {
                expect(response.scopes).toEqual(["s1"]);
                expect(response.account).toBe(account);
                expect(response.idToken.rawIdToken).toEqual(TEST_TOKENS.IDTOKEN_V2);
                expect(response.idTokenClaims).toEqual(new IdToken(TEST_TOKENS.IDTOKEN_V2).claims);
                expect(response.accessToken).toEqual(TEST_TOKENS.ACCESSTOKEN);
                expect(response.tokenType).toBe(ServerHashParamKeys.ACCESS_TOKEN);
            }).catch(function(err: AuthError) {
                // Won't happen
                console.error("Shouldn't have error here. Data: " + JSON.stringify(err));
            });
            
            msal.acquireTokenSilent(tokenRequestAlternate).then(function(response) {
                expect(response.scopes).toEqual(["s1"]);
                expect(response.account).toBe(account);
                expect(response.idToken.rawIdToken).toEqual(TEST_TOKENS.IDTOKEN_V2);
                expect(response.idTokenClaims).toEqual(new IdToken(TEST_TOKENS.IDTOKEN_V2).claims);
                expect(response.accessToken).toContain("accessTokenAlternate");
                expect(response.tokenType).toBe(ServerHashParamKeys.ACCESS_TOKEN);
                done();
            }).catch(function(err: AuthError) {
                // Won't happen
                console.error("Shouldn't have error here. Data: " + JSON.stringify(err));
            });
            
        });

        it("tests getCachedToken when organizations authority is passed and single matching accessToken is found", function (done) {
            
            const tokenRequest : AuthenticationParameters = {
                authority: TEST_URIS.DEFAULT_INSTANCE + "organizations/",
                scopes: ["S1"],
                account: account
            };
            const tokenRequestAlternate : AuthenticationParameters = {
                authority: TEST_URIS.ALTERNATE_INSTANCE + "organizations/",
                scopes: ["S1"],
                account: account
            };
            const params: kv = {  };
            params[SSOTypes.SID] = account.sid;
            setUtilUnifiedCacheQPStubs(params);

            accessTokenKey.authority = TEST_URIS.DEFAULT_INSTANCE + "organizations/";
            cacheStorage.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));

            accessTokenKey.authority = TEST_URIS.ALTERNATE_INSTANCE + "organizations/";
            accessTokenValue.accessToken = "accessTokenAlternate";
            cacheStorage.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));
            
            idTokenKey.authority = TEST_URIS.DEFAULT_INSTANCE + "organizations/";
            cacheStorage.setItem(JSON.stringify(idTokenKey), JSON.stringify(idToken));
            idTokenKey.authority = TEST_URIS.ALTERNATE_INSTANCE + "organizations/";
            cacheStorage.setItem(JSON.stringify(idTokenKey), JSON.stringify(idToken));

            msal.acquireTokenSilent(tokenRequest).then(function(response) {
                expect(response.scopes).toEqual(["s1"]);
                expect(response.account).toBe(account);
                expect(response.idToken.rawIdToken).toEqual(TEST_TOKENS.IDTOKEN_V2);
                expect(response.idTokenClaims).toEqual(new IdToken(TEST_TOKENS.IDTOKEN_V2).claims);
                expect(response.accessToken).toContain(TEST_TOKENS.ACCESSTOKEN);
                expect(response.tokenType).toBe(ServerHashParamKeys.ACCESS_TOKEN);
            }).catch(function(err: AuthError) {
                // Won't happen
                console.error("Shouldn't have error here. Data: " + JSON.stringify(err));
            });
            msal.acquireTokenSilent(tokenRequestAlternate).then(function(response) {
                expect(response.scopes).toEqual(["s1"]);
                expect(response.account).toBe(account);
                expect(response.idToken.rawIdToken).toEqual(TEST_TOKENS.IDTOKEN_V2);
                expect(response.idTokenClaims).toEqual(new IdToken(TEST_TOKENS.IDTOKEN_V2).claims);
                expect(response.accessToken).toContain("accessTokenAlternate");
                expect(response.tokenType).toBe(ServerHashParamKeys.ACCESS_TOKEN);
                done();
            }).catch(function(err: AuthError) {
                // Won't happen
                console.error("Shouldn't have error here. Data: " + JSON.stringify(err));
            });
        });

        it("tests getCachedToken when consumers authority is passed and single matching accessToken is found", function (done) {
            
            const tokenRequest : AuthenticationParameters = {
                authority: TEST_URIS.DEFAULT_INSTANCE + "consumers/",
                scopes: ["S1"],
                account: account
            };
            const tokenRequestAlternate : AuthenticationParameters = {
                authority: TEST_URIS.ALTERNATE_INSTANCE + "consumers/",
                scopes: ["S1"],
                account: account
            };
            const params: kv = {  };
            params[SSOTypes.SID] = account.sid;
            setUtilUnifiedCacheQPStubs(params);

            accessTokenKey.authority = TEST_URIS.DEFAULT_INSTANCE + "9188040d-6c67-4c5b-b112-36a304b66dad/";
            cacheStorage.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));

            accessTokenKey.authority = TEST_URIS.ALTERNATE_INSTANCE + "9188040d-6c67-4c5b-b112-36a304b66dad/";
            accessTokenValue.accessToken = "accessTokenAlternate";
            cacheStorage.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));
            
            idTokenKey.authority = TEST_URIS.DEFAULT_INSTANCE + "9188040d-6c67-4c5b-b112-36a304b66dad/";
            cacheStorage.setItem(JSON.stringify(idTokenKey), JSON.stringify(idToken));
            idTokenKey.authority = TEST_URIS.ALTERNATE_INSTANCE + "9188040d-6c67-4c5b-b112-36a304b66dad/";
            cacheStorage.setItem(JSON.stringify(idTokenKey), JSON.stringify(idToken));

            msal.acquireTokenSilent(tokenRequest).then(function(response) {
                expect(response.scopes).toEqual(["s1"]);
                expect(response.account).toBe(account);
                expect(response.idToken.rawIdToken).toEqual(TEST_TOKENS.IDTOKEN_V2);
                expect(response.idTokenClaims).toEqual(new IdToken(TEST_TOKENS.IDTOKEN_V2).claims);
                expect(response.accessToken).toContain(TEST_TOKENS.ACCESSTOKEN);
                expect(response.tokenType).toBe(ServerHashParamKeys.ACCESS_TOKEN);
            }).catch(function(err: AuthError) {
                // Won't happen
                console.error("Shouldn't have error here. Data: " + JSON.stringify(err));
            });
            msal.acquireTokenSilent(tokenRequestAlternate).then(function(response) {
                expect(response.scopes).toEqual(["s1"]);
                expect(response.account).toBe(account);
                expect(response.idToken.rawIdToken).toEqual(TEST_TOKENS.IDTOKEN_V2);
                expect(response.idTokenClaims).toEqual(new IdToken(TEST_TOKENS.IDTOKEN_V2).claims);
                expect(response.accessToken).toContain("accessTokenAlternate");
                expect(response.tokenType).toBe(ServerHashParamKeys.ACCESS_TOKEN);
                done();
            }).catch(function(err: AuthError) {
                // Won't happen
                console.error("Shouldn't have error here. Data: " + JSON.stringify(err));
            });
        });

        it("tests getCachedToken when tenant authority is passed and single matching accessToken is found", function (done) {
            
            const tokenRequest : AuthenticationParameters = {
                authority: TEST_URIS.DEFAULT_INSTANCE + "common/",
                scopes: ["S1"],
                account: account
            };
            const tokenRequestAlternate : AuthenticationParameters = {
                authority: TEST_URIS.ALTERNATE_INSTANCE + "common/",
                scopes: ["S1"],
                account: account
            };
            
            const params: kv = {  };
            params[SSOTypes.SID] = account.sid;
            setUtilUnifiedCacheQPStubs(params);

            accessTokenKey.authority = TEST_URIS.DEFAULT_INSTANCE + "common/";
            cacheStorage.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));
            accessTokenKey.authority = TEST_URIS.ALTERNATE_INSTANCE + "common/";
            accessTokenValue.accessToken = "accessTokenAlternate";
            cacheStorage.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));
            cacheStorage.setItem(JSON.stringify(idTokenKey), JSON.stringify(idToken));
            idTokenKey.authority = TEST_URIS.ALTERNATE_INSTANCE + "common/";
            cacheStorage.setItem(JSON.stringify(idTokenKey), JSON.stringify(idToken));

            msal.acquireTokenSilent(tokenRequest).then(function(response) {
                expect(response.scopes).toEqual(["s1"]);
                expect(response.account).toBe(account);
                expect(response.idToken.rawIdToken).toEqual(TEST_TOKENS.IDTOKEN_V2);
                expect(response.idTokenClaims).toEqual(new IdToken(TEST_TOKENS.IDTOKEN_V2).claims);
                expect(response.accessToken).toContain(TEST_TOKENS.ACCESSTOKEN);
                expect(response.tokenType).toBe(ServerHashParamKeys.ACCESS_TOKEN);
            }).catch(function(err: AuthError) {
                // Won't happen
                console.error("Shouldn't have error here. Data: " + JSON.stringify(err));
            });
            msal.acquireTokenSilent(tokenRequestAlternate).then(function(response) {
                expect(response.scopes).toEqual(["s1"]);
                expect(response.account).toBe(account);
                expect(response.idToken.rawIdToken).toEqual(TEST_TOKENS.IDTOKEN_V2);
                expect(response.idTokenClaims).toEqual(new IdToken(TEST_TOKENS.IDTOKEN_V2).claims);
                expect(response.accessToken).toContain("accessTokenAlternate");
                expect(response.tokenType).toBe(ServerHashParamKeys.ACCESS_TOKEN);
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

            sinon.stub(msal, <any>"loadIframeTimeout").callsFake(function (url: string, frameName: string) {
                return new Promise<void>(() => {
                    expect(cacheStorage.getItem(JSON.stringify(accessTokenKey))).toBeNull();
                    expect(url).toContain(
                        TEST_CONFIG.validAuthority + "oauth2/v2.0/authorize?response_type=id_token token&scope=S1%20openid%20profile"
                    );
                    expect(url).toContain("&client_id=" + TEST_CONFIG.MSAL_CLIENT_ID);
                    expect(url).toContain("&redirect_uri=" + encodeURIComponent(msal.getRedirectUri()));
                    expect(url).toContain("&state");
                    expect(url).toContain("&client_info=1");
                    done();
                });
            });

            accessTokenKey.authority = accessTokenKey.authority;
            cacheStorage.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));
            accessTokenKey.scopes = "S1 S2";
            cacheStorage.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));
            cacheStorage.setItem(JSON.stringify(idTokenKey), JSON.stringify(idToken));

            msal.acquireTokenSilent(tokenRequest);
        });

        it("tests getCachedToken when authority is passed and no matching accessToken is found", function (done) {
            const tokenRequest : AuthenticationParameters = {
                authority: TEST_URIS.DEFAULT_INSTANCE + TEST_CONFIG.MSAL_TENANT_ID,
                scopes: ["S1"],
                account: account
            };
            const params: kv = {  };
            params[SSOTypes.SID] = account.sid;
            setUtilUnifiedCacheQPStubs(params);

            setAuthInstanceStubs();
            sinon.stub(AuthorityFactory, "saveMetadataFromNetwork").returns(null);
            const renewTokenSpy = sinon.stub(msal, <any>"renewToken").throws(AuthError);

            cacheStorage.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));
            cacheStorage.setItem(JSON.stringify(idTokenKey), JSON.stringify(idToken));

            msal.acquireTokenSilent(tokenRequest).then(function(response) {
                // Won't happen - we are not testing response here
                console.error("Shouldn't have response here. Data: " + JSON.stringify(response));
            }).catch(function(err: AuthError) {
                // Failure will be caught here since the tests are being run within the stub.
                expect(err).toBeInstanceOf(AuthError);
                expect(renewTokenSpy.calledOnce).toBe(true);
                done();
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
                return new Promise<void>(() => {
                    expect(cacheStorage.getItem(JSON.stringify(accessTokenKey))).toBeNull();
                    expect(url).toContain(
                        TEST_CONFIG.alternateValidAuthority + "oauth2/v2.0/authorize?response_type=id_token token&scope=S1%20openid%20profile"
                    );
                    expect(url).toContain("&client_id=" + TEST_CONFIG.MSAL_CLIENT_ID);
                    expect(url).toContain("&redirect_uri=" + encodeURIComponent(msal.getRedirectUri()));
                    expect(url).toContain("&state");
                    expect(url).toContain("&client_info=1");
                    done();
                });
            });

            accessTokenValue.expiresIn = "1300";
            accessTokenKey.authority = TEST_CONFIG.alternateValidAuthority;
            cacheStorage.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));
            cacheStorage.setItem(JSON.stringify(idTokenKey), JSON.stringify(idToken));

            msal.acquireTokenSilent(tokenRequest).then(function(response) {
                // Won't happen - we are not testing response here
                console.error("Shouldn't have response here. Data: " + JSON.stringify(response));
            }).catch(function(err: AuthError) {
                // Failure will be caught here since the tests are being run within the stub.
                expect(err).toBeInstanceOf(AuthError);
            });
        });

        it("tests getCachedToken returns correct Id Token when authority is passed and there are multiple ID tokens in the cache for the same account", (done) => {
            const requestAuthority = 'https://login.onmicrosoft.com/common/';
            const tokenRequest : AuthenticationParameters = {
                authority: requestAuthority,
                scopes: ["S1"],
                account: account
            };
            const params: kv = {  };
            params[SSOTypes.SID] = account.sid;
            setUtilUnifiedCacheQPStubs(params);
            accessTokenKey.authority = requestAuthority;
            cacheStorage.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));
            cacheStorage.setItem(JSON.stringify(idTokenKey), JSON.stringify(idToken));
            idTokenKey.authority = requestAuthority;
            cacheStorage.setItem(JSON.stringify(idTokenKey), JSON.stringify(idToken));

            msal.acquireTokenSilent(tokenRequest).then(function(response) {
                expect(response.idToken).not.toBeNull();
                done();
            }).catch(function(err: AuthError) {
                console.log("Shouldn't have error here. Data: " + JSON.stringify(err));
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
                return new Promise<void>(() => {
                    expect(cacheCallSpy.notCalled).toBe(true);
                    expect(url).toContain(
                        TEST_CONFIG.validAuthority + "oauth2/v2.0/authorize?response_type=id_token token&scope=S1%20openid%20profile"
                    );
                    expect(url).toContain("&client_id=" + TEST_CONFIG.MSAL_CLIENT_ID);
                    expect(url).toContain("&redirect_uri=" + encodeURIComponent(msal.getRedirectUri()));
                    expect(url).toContain("&state");
                    expect(url).toContain("&client_info=1");
                    expect(url).toContain("&claims=" + encodeURIComponent(tokenRequest.claimsRequest));
                    done();
                });
            });

            cacheStorage.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));

            msal.acquireTokenSilent(tokenRequest).then(function(response) {
                // Won't happen - we are not testing response here
                console.error("Shouldn't have response here. Data: " + JSON.stringify(response));
            }).catch(function(err: AuthError) {
                // Failure will be caught here since the tests are being run within the stub.
                expect(err).toBeInstanceOf(AuthError);
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

            sinon.stub(msal, <any>"loadIframeTimeout").callsFake(async function (url: string, frameName: string) {
                return new Promise<void>(() => {
                    expect(cacheCallSpy.notCalled).toBe(true);
                    expect(url).toContain(
                        TEST_CONFIG.validAuthority + "oauth2/v2.0/authorize?response_type=id_token token&scope=S1%20openid%20profile"
                    );
                    expect(url).toContain("&client_id=" + TEST_CONFIG.MSAL_CLIENT_ID);
                    expect(url).toContain("&redirect_uri=" + encodeURIComponent(msal.getRedirectUri()));
                    expect(url).toContain("&state");
                    expect(url).toContain("&client_info=1");
                    done();
                });
            });

            cacheStorage.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));

            msal.acquireTokenSilent(tokenRequest).then(function(response) {
                // Won't happen - we are not testing response here
                throw `Shouldn't have response here. Data: ${JSON.stringify(response)}`;
            }).catch(done);
        });

        describe("Response Type based AuthResponse", () => {
            describe("response_type = token", () => {
                let tokenRequest : AuthenticationParameters;
                beforeEach(() => {
                    tokenRequest = {
                        authority: TEST_CONFIG.validAuthority,
                        scopes: ["S1"],
                        account: account
                    };
                    setAuthInstanceStubs();
                    sinon.stub(msal, "getAccount").returns(account);
                    sinon.stub(AuthorityFactory, "saveMetadataFromNetwork").returns(null);
                });

                afterEach(() => {
                    cacheStorage.clear();
                    sinon.reset();
                });

                it("should return null if there is no cached access token", (done) => {
                    const renewTokenSpy = sinon.spy(msal, <any>"renewToken");

                    sinon.stub(msal, <any>"loadIframeTimeout").callsFake(async function (url: string, frameName: string) {
                        return new Promise<void>(() => {
                            expect(url).toContain(
                                TEST_CONFIG.validAuthority + "oauth2/v2.0/authorize?response_type=token&scope=S1%20openid%20profile"
                            );
                            expect(url).toContain("&client_id=" + TEST_CONFIG.MSAL_CLIENT_ID);
                            expect(url).toContain("&redirect_uri=" + encodeURIComponent(msal.getRedirectUri()));
                            expect(url).toContain("&state");
                            expect(url).toContain("&client_info=1");
                            expect(renewTokenSpy.calledOnce).toBe(true);
                            done();
                        });
                    });

                    msal.acquireTokenSilent(tokenRequest);
                });
                
                it("should return access token if there is a valid matching access token in the cache", (done) => {
                    cacheStorage.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));

                    msal.acquireTokenSilent(tokenRequest).then(function(response) {
                        expect(response.scopes).toEqual(["s1"]);
                        expect(response.account).toBe(account);
                        expect(response.accessToken).toContain(TEST_TOKENS.ACCESSTOKEN);
                        expect(response.tokenType).toBe(ServerHashParamKeys.ACCESS_TOKEN);
                        done();
                    }).catch(done);
                });

                it("should return null if there is an expired matching access token in the cache", (done) => {
                    accessTokenValue.expiresIn = "0";
                    cacheStorage.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));

                    const renewTokenSpy = sinon.spy(msal, <any>"renewToken");

                    sinon.stub(msal, <any>"loadIframeTimeout").callsFake(async function (url: string, frameName: string) {
                        return new Promise<void>(() => {
                            expect(url).toContain(
                                TEST_CONFIG.validAuthority + "oauth2/v2.0/authorize?response_type=token&scope=S1%20openid%20profile"
                            );
                            expect(url).toContain("&client_id=" + TEST_CONFIG.MSAL_CLIENT_ID);
                            expect(url).toContain("&redirect_uri=" + encodeURIComponent(msal.getRedirectUri()));
                            expect(url).toContain("&state");
                            expect(url).toContain("&client_info=1");
                            expect(renewTokenSpy.calledOnce).toBe(true);
                            done();
                        });
                    });

                    msal.acquireTokenSilent(tokenRequest);
                });

                it("should return access token with null id token if there is a valid matching access token in the cache but no matching id token", (done) => {
                    cacheStorage.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));

                    msal.acquireTokenSilent(tokenRequest).then(function(response) {
                        expect(response.scopes).toEqual(["s1"]);
                        expect(response.account).toBe(account);
                        expect(response.accessToken).toContain(TEST_TOKENS.ACCESSTOKEN);
                        expect(response.tokenType).toBe(ServerHashParamKeys.ACCESS_TOKEN);
                        expect(response.idToken).toBeNull();
                        expect(response.idTokenClaims).toBeNull();
                        done();
                    }).catch(done);
                });

                it("should return access token with null id token if there is a valid matching access token in the cache and an expired id token", (done) => {
                    idToken.expiresIn = "0";
                    cacheStorage.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));
                    cacheStorage.setItem(JSON.stringify(idTokenKey), JSON.stringify(idToken));

                    msal.acquireTokenSilent(tokenRequest).then(function(response) {
                        expect(response.scopes).toEqual(["s1"]);
                        expect(response.account).toBe(account);
                        expect(response.accessToken).toContain(TEST_TOKENS.ACCESSTOKEN);
                        expect(response.tokenType).toBe(ServerHashParamKeys.ACCESS_TOKEN);
                        expect(response.idToken).toBeNull();
                        expect(response.idTokenClaims).toBeNull();
                        done();
                    }).catch(done);
                });

                it("should return access token with id token if there are valid matching access token and id token in the cache", (done) => {
                    cacheStorage.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));
                    cacheStorage.setItem(JSON.stringify(idTokenKey), JSON.stringify(idToken));

                    msal.acquireTokenSilent(tokenRequest).then(function(response) {
                        expect(response.scopes).toEqual(["s1"]);
                        expect(response.account).toBe(account);
                        expect(response.idToken.rawIdToken).toEqual(TEST_TOKENS.IDTOKEN_V2);
                        expect(response.idTokenClaims).toEqual(new IdToken(TEST_TOKENS.IDTOKEN_V2).claims);
                        expect(response.accessToken).toContain(TEST_TOKENS.ACCESSTOKEN);
                        expect(response.tokenType).toBe(ServerHashParamKeys.ACCESS_TOKEN);
                        done();
                    }).catch(done);
                });
            });

            describe("response_type = id_token", () => {
                let tokenRequest : AuthenticationParameters;
                beforeEach(() => {
                    tokenRequest = {
                        authority: TEST_CONFIG.validAuthority,
                        scopes: ["openid", "profile"],
                        account: account
                    };
                    setAuthInstanceStubs();
                    sinon.stub(AuthorityFactory, "saveMetadataFromNetwork").returns(null);
                });

                afterEach(() => {
                    cacheStorage.clear();
                    sinon.reset();
                });

                it("should return null if there is no cached id token", (done) => {
                    const renewIdTokenSpy = sinon.spy(msal, <any>"renewIdToken");

                    sinon.stub(msal, <any>"loadIframeTimeout").callsFake(async function (url: string, frameName: string) {
                        return new Promise<void>(() => {
                            expect(url).toContain(
                                TEST_CONFIG.validAuthority + "oauth2/v2.0/authorize?response_type=id_token&scope=openid%20profile"
                            );
                            expect(url).toContain("&client_id=" + TEST_CONFIG.MSAL_CLIENT_ID);
                            expect(url).toContain("&redirect_uri=" + encodeURIComponent(msal.getRedirectUri()));
                            expect(url).toContain("&state");
                            expect(url).toContain("&client_info=1");
                            expect(renewIdTokenSpy.calledOnce).toBe(true);
                            done();
                        });
                    });

                    msal.acquireTokenSilent(tokenRequest);
                });

                it("should return null if there is a matching but expired id token in the cache", (done) => {
                    const renewIdTokenSpy = sinon.spy(msal, <any>"renewIdToken");

                    idToken.expiresIn = "0";
                    cacheStorage.setItem(JSON.stringify(idTokenKey), JSON.stringify(idToken));

                    sinon.stub(msal, <any>"loadIframeTimeout").callsFake(async function (url: string, frameName: string) {
                        return new Promise<void>(() => {
                            expect(url).toContain(
                                TEST_CONFIG.validAuthority + "oauth2/v2.0/authorize?response_type=id_token&scope=openid%20profile"
                            );
                            expect(url).toContain("&client_id=" + TEST_CONFIG.MSAL_CLIENT_ID);
                            expect(url).toContain("&redirect_uri=" + encodeURIComponent(msal.getRedirectUri()));
                            expect(url).toContain("&state");
                            expect(url).toContain("&client_info=1");
                            expect(renewIdTokenSpy.calledOnce).toBe(true);
                            done();
                        });
                    });

                    msal.acquireTokenSilent(tokenRequest);
                });
                
                it("should return ID token if there is a valid matching ID token in the cache", (done) => {
                    cacheStorage.setItem(JSON.stringify(idTokenKey), JSON.stringify(idToken));

                    msal.acquireTokenSilent(tokenRequest).then(function(response) {
                        expect(response.scopes).toEqual(["openid", "profile"]);
                        expect(response.account).toBe(account);
                        expect(response.idToken.rawIdToken).toBe(TEST_TOKENS.IDTOKEN_V2);
                        expect(response.idTokenClaims).toEqual(new IdToken(TEST_TOKENS.IDTOKEN_V2).claims);
                        expect(response.tokenType).toBe(ServerHashParamKeys.ID_TOKEN);
                        done();
                    }).catch(done);
                });
            });

            describe("response_type = id_token_token", () => {
                let tokenRequest : AuthenticationParameters;
                beforeEach(() => {
                    tokenRequest = {
                        authority: TEST_CONFIG.validAuthority,
                        scopes: ["S1", "openid", "profile"],
                        account: account
                    };
                    setAuthInstanceStubs();
                    sinon.stub(AuthorityFactory, "saveMetadataFromNetwork").returns(null);
                });

                afterEach(() => {
                    cacheStorage.clear();
                    sinon.reset();
                });

                it("should return null if there is no cached id token or access token", (done) => {
                    const renewTokenSpy = sinon.spy(msal, <any>"renewToken");

                    sinon.stub(msal, <any>"loadIframeTimeout").callsFake(async function (url: string, frameName: string) {
                        return new Promise<void>(() => {
                            expect(url).toContain(
                                TEST_CONFIG.validAuthority + "oauth2/v2.0/authorize?response_type=id_token token&scope=S1%20openid%20profile"
                            );
                            expect(url).toContain("&client_id=" + TEST_CONFIG.MSAL_CLIENT_ID);
                            expect(url).toContain("&redirect_uri=" + encodeURIComponent(msal.getRedirectUri()));
                            expect(url).toContain("&state");
                            expect(url).toContain("&client_info=1");
                            expect(renewTokenSpy.calledOnce).toBe(true);
                            done();
                        });
                    });

                    msal.acquireTokenSilent(tokenRequest);
                });

                it("should return null if there is a valid cached access token but no cached id token", (done) => {
                    const renewTokenSpy = sinon.spy(msal, <any>"renewToken");
                    cacheStorage.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));
                    sinon.stub(msal, <any>"loadIframeTimeout").callsFake(async function (url: string, frameName: string) {
                        return new Promise<void>(() => {
                            expect(url).toContain(
                                TEST_CONFIG.validAuthority + "oauth2/v2.0/authorize?response_type=id_token token&scope=S1%20openid%20profile"
                            );
                            expect(url).toContain("&client_id=" + TEST_CONFIG.MSAL_CLIENT_ID);
                            expect(url).toContain("&redirect_uri=" + encodeURIComponent(msal.getRedirectUri()));
                            expect(url).toContain("&state");
                            expect(url).toContain("&client_info=1");
                            expect(renewTokenSpy.calledOnce).toBe(true);
                            done();
                        });
                    });

                    msal.acquireTokenSilent(tokenRequest);
                });

                it("should return null if there is a valid cached id token but no cached access token", (done) => {
                    const renewTokenSpy = sinon.spy(msal, <any>"renewToken");
                    cacheStorage.setItem(JSON.stringify(idTokenKey), JSON.stringify(idToken));
                    sinon.stub(msal, <any>"loadIframeTimeout").callsFake(async function (url: string, frameName: string) {
                        return new Promise<void>(() => {
                            expect(url).toContain(
                                TEST_CONFIG.validAuthority + "oauth2/v2.0/authorize?response_type=id_token token&scope=S1%20openid%20profile"
                            );
                            expect(url).toContain("&client_id=" + TEST_CONFIG.MSAL_CLIENT_ID);
                            expect(url).toContain("&redirect_uri=" + encodeURIComponent(msal.getRedirectUri()));
                            expect(url).toContain("&state");
                            expect(url).toContain("&client_info=1");
                            expect(renewTokenSpy.calledOnce).toBe(true);
                            done();
                        });
                    });

                    msal.acquireTokenSilent(tokenRequest);
                });

                it("should return null if cached id token and access token are expired", (done) => {
                    const renewTokenSpy = sinon.spy(msal, <any>"renewToken");
                    accessTokenValue.expiresIn = "0";
                    idToken.expiresIn = "0";
                    cacheStorage.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));
                    cacheStorage.setItem(JSON.stringify(idTokenKey), JSON.stringify(idToken));

                    sinon.stub(msal, <any>"loadIframeTimeout").callsFake(async function (url: string, frameName: string) {
                        return new Promise<void>(() => {
                            expect(url).toContain(
                                TEST_CONFIG.validAuthority + "oauth2/v2.0/authorize?response_type=id_token token&scope=S1%20openid%20profile"
                            );
                            expect(url).toContain("&client_id=" + TEST_CONFIG.MSAL_CLIENT_ID);
                            expect(url).toContain("&redirect_uri=" + encodeURIComponent(msal.getRedirectUri()));
                            expect(url).toContain("&state");
                            expect(url).toContain("&client_info=1");
                            expect(renewTokenSpy.calledOnce).toBe(true);
                            done();
                        });
                    });

                    msal.acquireTokenSilent(tokenRequest);
                });

                it("should return null if there is a valid cached access token but the cached id token is expired", (done) => {
                    const renewTokenSpy = sinon.spy(msal, <any>"renewToken");
                    idToken.expiresIn = "0";
                    cacheStorage.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));
                    cacheStorage.setItem(JSON.stringify(idTokenKey), JSON.stringify(idToken));
                    sinon.stub(msal, <any>"loadIframeTimeout").callsFake(async function (url: string, frameName: string) {
                        return new Promise<void>(() => {
                            expect(url).toContain(
                                TEST_CONFIG.validAuthority + "oauth2/v2.0/authorize?response_type=id_token token&scope=S1%20openid%20profile"
                            );
                            expect(url).toContain("&client_id=" + TEST_CONFIG.MSAL_CLIENT_ID);
                            expect(url).toContain("&redirect_uri=" + encodeURIComponent(msal.getRedirectUri()));
                            expect(url).toContain("&state");
                            expect(url).toContain("&client_info=1");
                            expect(renewTokenSpy.calledOnce).toBe(true);
                            done();
                        });
                    });

                    msal.acquireTokenSilent(tokenRequest);
                });

                it("should return null if there is a valid id token but the cached access token is expired", (done) => {
                    const renewTokenSpy = sinon.spy(msal, <any>"renewToken");
                    accessTokenValue.expiresIn = "0";
                    cacheStorage.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));
                    cacheStorage.setItem(JSON.stringify(idTokenKey), JSON.stringify(idToken));
                    sinon.stub(msal, <any>"loadIframeTimeout").callsFake(async function (url: string, frameName: string) {
                        return new Promise<void>(() => {
                            expect(url).toContain(
                                TEST_CONFIG.validAuthority + "oauth2/v2.0/authorize?response_type=id_token token&scope=S1%20openid%20profile"
                            );
                            expect(url).toContain("&client_id=" + TEST_CONFIG.MSAL_CLIENT_ID);
                            expect(url).toContain("&redirect_uri=" + encodeURIComponent(msal.getRedirectUri()));
                            expect(url).toContain("&state");
                            expect(url).toContain("&client_info=1");
                            expect(renewTokenSpy.calledOnce).toBe(true);
                            done();
                        });
                    });

                    msal.acquireTokenSilent(tokenRequest);
                });

                it("should return valid id_token_token response if valid access and id token are found in the cache", (done) => {
                    cacheStorage.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));
                    cacheStorage.setItem(JSON.stringify(idTokenKey), JSON.stringify(idToken));

                    msal.acquireTokenSilent(tokenRequest).then(function(response) {
                        expect(response.scopes).toEqual(["s1"]);
                        expect(response.account).toBe(account);
                        expect(response.idToken.rawIdToken).toEqual(TEST_TOKENS.IDTOKEN_V2);
                        expect(response.idTokenClaims).toEqual(new IdToken(TEST_TOKENS.IDTOKEN_V2).claims);
                        expect(response.accessToken).toContain(TEST_TOKENS.ACCESSTOKEN);
                        expect(response.tokenType).toBe(ServerHashParamKeys.ACCESS_TOKEN);
                        done();
                    }).catch(done);
                });
            });
        });

        describe("Token cache item key semantic matching", () => {
            describe("Access Tokens", () => {
                let tokenRequest : AuthenticationParameters;
                beforeEach(() => {
                    tokenRequest = {
                        authority: TEST_CONFIG.validAuthority,
                        scopes: ["s1"],
                        account: account
                    };
                    setAuthInstanceStubs();
                    sinon.stub(msal, "getAccount").returns(account);
                    sinon.stub(AuthorityFactory, "saveMetadataFromNetwork").returns(null);
                });

                afterEach(() => {
                    cacheStorage.clear();
                    sinon.reset();
                });

                it("should match if key is valid JSON and contains scopes field", (done) => {
                    const validAccessTokenKey = {
                        authority: TEST_CONFIG.validAuthority,
                        clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                        scopes: "s1",
                        homeAccountIdentifier: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID
                    };
            
                    cacheStorage.setItem(JSON.stringify(validAccessTokenKey), JSON.stringify(accessTokenValue));
                    cacheStorage.setItem(JSON.stringify(idTokenKey), JSON.stringify(idToken));

                    msal.acquireTokenSilent(tokenRequest).then(function(response) {
                        expect(response.scopes).toEqual(["s1"]);
                        expect(response.account).toBe(account);
                        expect(response.idToken.rawIdToken).toBe(TEST_TOKENS.IDTOKEN_V2);
                        expect(response.idTokenClaims).toEqual(new IdToken(TEST_TOKENS.IDTOKEN_V2).claims);
                        expect(response.tokenType).toBe(ServerHashParamKeys.ACCESS_TOKEN);
                        done();
                    }).catch(done);
                });

                it("should not match if key is valid JSON but does not contain scopes field", (done) => {
                    const invalidAccessTokenKey = {
                        authority: TEST_CONFIG.validAuthority,
                        clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                        // @ts-ignore
                        scopes: undefined,
                        homeAccountIdentifier: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID
                    };
            
                    cacheStorage.setItem(JSON.stringify(invalidAccessTokenKey), JSON.stringify(accessTokenValue));
                    cacheStorage.setItem(JSON.stringify(idTokenKey), JSON.stringify(idToken));
                    const renewTokenSpy = sinon.spy(msal, <any>"renewToken");

                    sinon.stub(msal, <any>"loadIframeTimeout").callsFake(async function (url: string, frameName: string) {
                        return new Promise<void>(() => {
                            expect(url).toContain(
                                TEST_CONFIG.validAuthority + "oauth2/v2.0/authorize?response_type=token&scope=s1%20openid%20profile"
                            );
                            expect(url).toContain("&client_id=" + TEST_CONFIG.MSAL_CLIENT_ID);
                            expect(url).toContain("&redirect_uri=" + encodeURIComponent(msal.getRedirectUri()));
                            expect(url).toContain("&state");
                            expect(url).toContain("&client_info=1");
                            expect(renewTokenSpy.calledOnce).toBe(true);
                            done();
                        });
                    });

                    msal.acquireTokenSilent(tokenRequest);
                });

                it("should not match if key is not valid JSON", (done) => {
                    const invalidAccessTokenKey = `msal.${TEST_CONFIG.MSAL_CLIENT_ID}.${TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID}.scopes`;

                    cacheStorage.setItem(JSON.stringify(invalidAccessTokenKey), JSON.stringify(accessTokenValue));
                    cacheStorage.setItem(JSON.stringify(idTokenKey), JSON.stringify(idToken));
                    const renewTokenSpy = sinon.spy(msal, <any>"renewToken");

                    sinon.stub(msal, <any>"loadIframeTimeout").callsFake(async function (url: string, frameName: string) {
                        return new Promise<void>(() => {
                            expect(url).toContain(
                                TEST_CONFIG.validAuthority + "oauth2/v2.0/authorize?response_type=token&scope=s1%20openid%20profile"
                            );
                            expect(url).toContain("&client_id=" + TEST_CONFIG.MSAL_CLIENT_ID);
                            expect(url).toContain("&redirect_uri=" + encodeURIComponent(msal.getRedirectUri()));
                            expect(url).toContain("&state");
                            expect(url).toContain("&client_info=1");
                            expect(renewTokenSpy.calledOnce).toBe(true);
                            done();
                        });
                    });

                    msal.acquireTokenSilent(tokenRequest);
                });
            });

            describe("ID Token", () => {
                let tokenRequest : AuthenticationParameters;
                beforeEach(() => {
                    tokenRequest = {
                        authority: TEST_CONFIG.validAuthority,
                        scopes: Constants.oidcScopes,
                        account: account
                    };
                    setAuthInstanceStubs();
                    sinon.stub(AuthorityFactory, "saveMetadataFromNetwork").returns(null);
                });

                afterEach(() => {
                    cacheStorage.clear();
                    sinon.reset();
                });

                it("should match if key is valid JSON and contains no scopes field", (done) => {
                    const validIdTokenKey = {
                        authority: TEST_CONFIG.validAuthority,
                        clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                        // @ts-ignore
                        scopes: undefined,
                        homeAccountIdentifier: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID
                    };
            
                    cacheStorage.setItem(JSON.stringify(validIdTokenKey), JSON.stringify(idToken));

                    msal.acquireTokenSilent(tokenRequest).then(function(response) {
                        expect(response.scopes).toEqual(["openid", "profile"]);
                        expect(response.account).toBe(account);
                        expect(response.idToken.rawIdToken).toBe(TEST_TOKENS.IDTOKEN_V2);
                        expect(response.idTokenClaims).toEqual(new IdToken(TEST_TOKENS.IDTOKEN_V2).claims);
                        expect(response.tokenType).toBe(ServerHashParamKeys.ID_TOKEN);
                        done();
                    }).catch(done);
                });

                it("should not match if key is valid JSON but contains scopes field", (done) => {
                    const invalidIdTokenKey = {
                        authority: TEST_CONFIG.validAuthority,
                        clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                        scopes: "S1",
                        homeAccountIdentifier: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID
                    };

                    cacheStorage.setItem(JSON.stringify(invalidIdTokenKey), JSON.stringify(idToken));
                    const renewIdTokenSpy = sinon.spy(msal, <any>"renewIdToken");

                    sinon.stub(msal, <any>"loadIframeTimeout").callsFake(async function (url: string, frameName: string) {
                        return new Promise<void>(() => {
                            expect(url).toContain(
                                TEST_CONFIG.validAuthority + "oauth2/v2.0/authorize?response_type=id_token&scope=openid%20profile"
                            );
                            expect(url).toContain("&client_id=" + TEST_CONFIG.MSAL_CLIENT_ID);
                            expect(url).toContain("&redirect_uri=" + encodeURIComponent(msal.getRedirectUri()));
                            expect(url).toContain("&state");
                            expect(url).toContain("&client_info=1");
                            expect(renewIdTokenSpy.calledOnce).toBe(true);
                            done();
                        });
                    });

                    msal.acquireTokenSilent(tokenRequest);
                });

                it("should not match if key is not valid JSON", (done) => {
                    const invalidIdTokenKey = `msal.${TEST_CONFIG.MSAL_CLIENT_ID}.${TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID}`;

                    cacheStorage.setItem(invalidIdTokenKey, JSON.stringify(idToken));
                    const renewIdTokenSpy = sinon.spy(msal, <any>"renewIdToken");

                    sinon.stub(msal, <any>"loadIframeTimeout").callsFake(async function (url: string, frameName: string) {
                        return new Promise<void>(() => {
                            expect(url).toContain(
                                TEST_CONFIG.validAuthority + "oauth2/v2.0/authorize?response_type=id_token&scope=openid%20profile"
                            );
                            expect(url).toContain("&client_id=" + TEST_CONFIG.MSAL_CLIENT_ID);
                            expect(url).toContain("&redirect_uri=" + encodeURIComponent(msal.getRedirectUri()));
                            expect(url).toContain("&state");
                            expect(url).toContain("&client_info=1");
                            expect(renewIdTokenSpy.calledOnce).toBe(true);
                            done();
                        });
                    });

                    msal.acquireTokenSilent(tokenRequest);
                });
            });
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

            setAuthInstanceStubs();
            setTestCacheItems();
            cacheStorage.setInteractionInProgress(true);
            
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
            const successHash = testHashesForState(TEST_LIBRARY_STATE).TEST_SUCCESS_ID_TOKEN_HASH + TEST_USER_STATE_NUM;

            window.location.hash = successHash;
            cacheStorage.setItem(AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.STATE_LOGIN, `${TEST_LIBRARY_STATE}|${TEST_USER_STATE_NUM}`), `${TEST_LIBRARY_STATE}|${TEST_USER_STATE_NUM}`);
            cacheStorage.setItem(AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.NONCE_IDTOKEN, `${TEST_LIBRARY_STATE}|${TEST_USER_STATE_NUM}`), TEST_NONCE);

            msal = new UserAgentApplication(config);

            const checkRespFromServer = function(response: AuthResponse) {
                expect(response.uniqueId).toBe(TEST_UNIQUE_ID);
                expect(response.tokenType).toBe(ServerHashParamKeys.ID_TOKEN);
                expect(response.tenantId).toBe(TEST_CONFIG.MSAL_TENANT_ID);
                expect(response.accountState).toBe(TEST_USER_STATE_NUM);
                expect(cacheStorage.getItem(TemporaryCacheKeys.URL_HASH)).toBeNull();
                done();
            };
            msal.handleRedirectCallback(checkRespFromServer, errorReceivedCallback);
        });

        it("tests navigation to loginRequestUrl after first redirect", function(done) {
            config.auth.navigateToLoginRequestUrl = true;
            const loginStartPage = "http://localhost:8081/test/";
            const successHash = testHashesForState(TEST_LIBRARY_STATE).TEST_SUCCESS_ID_TOKEN_HASH + TEST_USER_STATE_NUM;

            window.location = {
                ...oldWindowLocation,
                assign: function (url) {
                    try {
                        expect(url).toBe(loginStartPage + successHash);
                        done();
                    } catch (e) {
                        console.error(e);
                    }
                },
                href: "http://localhost:8081/"
            };

            sinon.stub(window, "parent").returns(window);

            window.location.hash = successHash;
            cacheStorage.setItem(AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.LOGIN_REQUEST, `${TEST_LIBRARY_STATE}|${TEST_USER_STATE_NUM}`), loginStartPage);
            cacheStorage.setItem(AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.STATE_LOGIN, `${TEST_LIBRARY_STATE}|${TEST_USER_STATE_NUM}`), `${TEST_LIBRARY_STATE}|${TEST_USER_STATE_NUM}`);
            cacheStorage.setItem(AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.NONCE_IDTOKEN, `${TEST_LIBRARY_STATE}|${TEST_USER_STATE_NUM}`), TEST_NONCE);

            msal = new UserAgentApplication(config);
        });

        it("tests navigation to loginRequestUrl after first redirect", function(done) {
            config.auth.navigateToLoginRequestUrl = true;
            const baseStartUrl = "http://localhost:8081/test/";
            const loginStartPage = baseStartUrl + "#testHash";
            const successHash = testHashesForState(TEST_LIBRARY_STATE).TEST_SUCCESS_ID_TOKEN_HASH + TEST_USER_STATE_NUM;

            window.location = {
                ...oldWindowLocation,
                assign: function (url) {
                    try {
                        expect(url).toBe(baseStartUrl + successHash);
                        done();
                    } catch (e) {
                        console.error(e);
                    }
                },
                href: "http://localhost:8081/"
            };

            sinon.stub(window, "parent").returns(window);

            window.location.hash = successHash;
            cacheStorage.setItem(AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.LOGIN_REQUEST, `${TEST_LIBRARY_STATE}|${TEST_USER_STATE_NUM}`), loginStartPage);
            cacheStorage.setItem(AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.STATE_LOGIN, `${TEST_LIBRARY_STATE}|${TEST_USER_STATE_NUM}`), `${TEST_LIBRARY_STATE}|${TEST_USER_STATE_NUM}`);
            cacheStorage.setItem(AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.NONCE_IDTOKEN, `${TEST_LIBRARY_STATE}|${TEST_USER_STATE_NUM}`), TEST_NONCE);

            msal = new UserAgentApplication(config);
        });

        it("tests navigation to loginRequestUrl inc. user querystring after first redirect", function(done) {
            config.auth.navigateToLoginRequestUrl = true;
            const baseStartUrl = "http://localhost:8081/test/";
            const loginStartPage = baseStartUrl + "?testKey=testVal";
            const successHash = testHashesForState(TEST_LIBRARY_STATE).TEST_SUCCESS_ID_TOKEN_HASH + TEST_USER_STATE_NUM;

            window.location = {
                ...oldWindowLocation,
                assign: function (url) {
                    try {
                        expect(url).toBe(loginStartPage + successHash);
                        done();
                    } catch (e) {
                        console.error(e);
                    }
                },
                href: "http://localhost:8081/"
            };

            sinon.stub(window, "parent").returns(window);

            window.location.hash = successHash;
            cacheStorage.setItem(AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.LOGIN_REQUEST, `${TEST_LIBRARY_STATE}|${TEST_USER_STATE_NUM}`), loginStartPage);
            cacheStorage.setItem(AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.STATE_LOGIN, `${TEST_LIBRARY_STATE}|${TEST_USER_STATE_NUM}`), `${TEST_LIBRARY_STATE}|${TEST_USER_STATE_NUM}`);
            cacheStorage.setItem(AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.NONCE_IDTOKEN, `${TEST_LIBRARY_STATE}|${TEST_USER_STATE_NUM}`), TEST_NONCE);

            msal = new UserAgentApplication(config);
        });

        it("tests user hash is added back to url on final page and token response is cached", function() {
            config.auth.navigateToLoginRequestUrl = true;
            const loginUrl = "http://localhost:8081/test/";
            const userHash = "#testHash";
            const loginStartPage = loginUrl + userHash;
            const successHash = testHashesForState(TEST_LIBRARY_STATE).TEST_SUCCESS_ID_TOKEN_HASH + TEST_USER_STATE_NUM;

            window.location.href = loginUrl;

            sinon.stub(window, "parent").returns(window);
            sinon.stub(window.location, "href").returns(loginStartPage + successHash);

            window.location.hash = successHash;
            cacheStorage.setItem(AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.LOGIN_REQUEST, `${TEST_LIBRARY_STATE}|${TEST_USER_STATE_NUM}`), loginStartPage);
            cacheStorage.setItem(AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.STATE_LOGIN, `${TEST_LIBRARY_STATE}|${TEST_USER_STATE_NUM}`), `${TEST_LIBRARY_STATE}|${TEST_USER_STATE_NUM}`);
            cacheStorage.setItem(AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.NONCE_IDTOKEN, `${TEST_LIBRARY_STATE}|${TEST_USER_STATE_NUM}`), TEST_NONCE);

            expect(window.location.href).toBe(loginUrl);
            expect(window.location.hash).toBe(successHash);
            msal = new UserAgentApplication(config);
            expect(window.location.href).toBe(loginUrl);
            expect(window.location.hash).toBe(userHash);
            expect(cacheStorage.getItem(PersistentCacheKeys.IDTOKEN)).toBe(TEST_TOKENS.IDTOKEN_V2);
        });

        it("tests user query string present on final page url and token response is cached", function() {
            config.auth.navigateToLoginRequestUrl = true;
            const loginUrl = "http://localhost:8081/test/";
            const userQueryString = "?testKey=testVal";
            const loginStartPage = loginUrl + userQueryString;
            const successHash = testHashesForState(TEST_LIBRARY_STATE).TEST_SUCCESS_ID_TOKEN_HASH + TEST_USER_STATE_NUM;

            window.location.href = `${loginStartPage}${successHash}`;
            window.location.search = userQueryString;
            window.location.hash = successHash;
            window.location.pathname = "/test/";

            sinon.stub(window, "parent").returns(window);
            sinon.stub(window.location, "assign").callsFake(() => {});
            
            sinon.stub(history, "replaceState").callsFake((data, title, url) => {
                window.location.href = `http://localhost:8081${url}`;
            });
            sinon.stub(UrlUtils, "urlContainsHash").returns(true);

            cacheStorage.setItem(AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.LOGIN_REQUEST, `${TEST_LIBRARY_STATE}|${TEST_USER_STATE_NUM}`), loginStartPage);
            cacheStorage.setItem(AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.STATE_LOGIN, `${TEST_LIBRARY_STATE}|${TEST_USER_STATE_NUM}`), `${TEST_LIBRARY_STATE}|${TEST_USER_STATE_NUM}`);
            cacheStorage.setItem(AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.NONCE_IDTOKEN, `${TEST_LIBRARY_STATE}|${TEST_USER_STATE_NUM}`), TEST_NONCE);

            msal = new UserAgentApplication(config);
            expect(window.location.href).toBe(loginStartPage);
            expect(window.location.search).toBe(userQueryString);
            expect(cacheStorage.getItem(PersistentCacheKeys.IDTOKEN)).toBe(TEST_TOKENS.IDTOKEN_V2);
        });

        it("tests user hash is added back to url and query string exists on final page url and token response is cached", function() {
            config.auth.navigateToLoginRequestUrl = true;
            const loginUrl = "http://localhost:8081/test/";
            const userQueryString = "?testKey=testVal";
            const userHash = "#testHash";
            const loginStartPage = loginUrl + userQueryString + userHash;
            const successHash = testHashesForState(TEST_LIBRARY_STATE).TEST_SUCCESS_ID_TOKEN_HASH + TEST_USER_STATE_NUM;

            window.location.href = loginUrl + userQueryString;
            window.location.search = userQueryString;

            sinon.stub(window, "parent").returns(window);
            sinon.stub(window.location, "href").returns(loginStartPage + successHash);

            window.location.hash = successHash;
            cacheStorage.setItem(AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.LOGIN_REQUEST, `${TEST_LIBRARY_STATE}|${TEST_USER_STATE_NUM}`), loginStartPage);
            cacheStorage.setItem(AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.STATE_LOGIN, `${TEST_LIBRARY_STATE}|${TEST_USER_STATE_NUM}`), `${TEST_LIBRARY_STATE}|${TEST_USER_STATE_NUM}`);
            cacheStorage.setItem(AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.NONCE_IDTOKEN, `${TEST_LIBRARY_STATE}|${TEST_USER_STATE_NUM}`), TEST_NONCE);

            expect(window.location.href).toBe(loginUrl + userQueryString);
            expect(window.location.hash).toBe(successHash);
            expect(window.location.search).toBe(userQueryString);
            msal = new UserAgentApplication(config);
            expect(window.location.href).toBe(loginUrl + userQueryString);
            expect(window.location.hash).toBe(userHash);
            expect(window.location.search).toBe(userQueryString);
            expect(cacheStorage.getItem(PersistentCacheKeys.IDTOKEN)).toBe(TEST_TOKENS.IDTOKEN_V2);
        });

        it("tests navigation to homepage after first redirect if loginStartPage not set", function(done) {
            config.auth.navigateToLoginRequestUrl = true;
            const successHash = testHashesForState(TEST_LIBRARY_STATE).TEST_SUCCESS_ID_TOKEN_HASH + TEST_USER_STATE_NUM;

            window.location.assign = function (url) {
                try {
                    expect(url).toBe("/");
                    done();
                } catch (e) {
                    console.error(e);
                }
            };

            sinon.stub(window, "parent").returns(window);

            window.location.hash = successHash;
            cacheStorage.setItem(AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.STATE_LOGIN, `${TEST_LIBRARY_STATE}|${TEST_USER_STATE_NUM}`), `${TEST_LIBRARY_STATE}|${TEST_USER_STATE_NUM}`);
            cacheStorage.setItem(AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.NONCE_IDTOKEN, `${TEST_LIBRARY_STATE}|${TEST_USER_STATE_NUM}`), TEST_NONCE);

            msal = new UserAgentApplication(config);
        });

        it("tests saveTokenForHash in case of error", function(done) {
            window.location.hash = testHashesForState(TEST_LIBRARY_STATE).TEST_ERROR_HASH + TEST_USER_STATE_NUM;
            cacheStorage.setItem(AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.STATE_LOGIN, `${TEST_LIBRARY_STATE}|${TEST_USER_STATE_NUM}`), `${TEST_LIBRARY_STATE}|${TEST_USER_STATE_NUM}`);

            msal = new UserAgentApplication(config);

            const checkErrorFromServer = function(error: AuthError, response: AuthResponse) {
                expect(cacheStorage.getItem(TemporaryCacheKeys.URL_HASH)).toBeNull();
                expect(error instanceof ServerError).toBe(true);
                expect(error.name).toContain("ServerError");
                expect(error.errorCode).toContain(TEST_ERROR_CODE);
                expect(error.errorMessage).toContain(TEST_ERROR_DESC);
                expect(error.message).toContain(TEST_ERROR_DESC);
                expect(error.stack).toContain("UserAgentApplication.spec.ts");
                done();
            };
            msal.handleRedirectCallback(checkErrorFromServer);
        });

        // TEST_SERVER_ERROR_SUBCODE_CANCEL
        it("tests saveTokenForHash in case of non-consentable scopes / return to the application without consenting", function(done) {
            window.location.hash = TEST_SERVER_ERROR_SUBCODE_CANCEL + TEST_USER_STATE_NUM;
            cacheStorage.setItem(AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.STATE_LOGIN, `${TEST_LIBRARY_STATE}|${TEST_USER_STATE_NUM}`), `${TEST_LIBRARY_STATE}|${TEST_USER_STATE_NUM}`);

            msal = new UserAgentApplication(config);

            const checkErrorFromServer = function(error: AuthError, response: AuthResponse) {
                expect(cacheStorage.getItem(TemporaryCacheKeys.URL_HASH)).toBeNull();
                expect(error instanceof ServerError).toBe(true);
                expect(error.name).toContain("ServerError");
                expect(error.errorCode).toContain(TEST_ACCESS_DENIED);
                expect(error.stack).toContain("UserAgentApplication.spec.ts");
                done();
            };
            msal.handleRedirectCallback(checkErrorFromServer);
        });

        it("tests if you get the state back in errorReceived callback, if state is a number", function (done) {
            window.location.hash = testHashesForState(TEST_LIBRARY_STATE).TEST_ERROR_HASH + TEST_USER_STATE_NUM;
            cacheStorage.setItem(AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.STATE_LOGIN, `${TEST_LIBRARY_STATE}|${TEST_USER_STATE_NUM}`), `${TEST_LIBRARY_STATE}|${TEST_USER_STATE_NUM}`);

            msal = new UserAgentApplication(config);

            const checkErrorHasState = function(error: AuthError, response: AuthResponse) {
                expect(response.accountState).toContain(TEST_USER_STATE_NUM);
                done();
            };
            msal.handleRedirectCallback(checkErrorHasState);
        });

        it("tests if you get the state back in errorReceived callback, if state is a url", function (done) {
            window.location.hash = testHashesForState(TEST_LIBRARY_STATE).TEST_ERROR_HASH + TEST_USER_STATE_URL;
            cacheStorage.setItem(AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.STATE_LOGIN, `${TEST_LIBRARY_STATE}|${TEST_USER_STATE_NUM}`), `${TEST_LIBRARY_STATE}|${TEST_USER_STATE_NUM}`);

            msal = new UserAgentApplication(config);

            const checkErrorHasState = function(error: AuthError, response: AuthResponse) {
                expect(response.accountState).toContain(TEST_USER_STATE_URL);

                done();
            };
            msal.handleRedirectCallback(checkErrorHasState);
        });

        it("tests that isCallback correctly identifies url hash", function (done) {
            msal = new UserAgentApplication(config);

            expect(msal.isCallback("not a callback")).toBe(false);
            expect(msal.isCallback("#error_description=someting_wrong")).toBe(true);
            expect(msal.isCallback("#/error_description=someting_wrong")).toBe(true);
            expect(msal.isCallback("#access_token=token123")).toBe(true);
            expect(msal.isCallback("#id_token=idtoken234")).toBe(true);
            done();
        });

        it("tests that expiresIn returns the correct date for access tokens", function (done) {
            const acquireTokenAccountKey = AuthCache.generateAcquireTokenAccountKey(account.homeAccountIdentifier, `${TEST_LIBRARY_STATE}|${TEST_USER_STATE_NUM}`);
            cacheStorage.setItem(acquireTokenAccountKey, JSON.stringify(account));

            const successHash = testHashesForState(TEST_LIBRARY_STATE).TEST_SUCCESS_ACCESS_TOKEN_HASH + TEST_USER_STATE_NUM;
            window.location.hash = successHash;
            cacheStorage.setItem(AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.NONCE_IDTOKEN, `${TEST_LIBRARY_STATE}|${TEST_USER_STATE_NUM}`), TEST_NONCE);

            cacheStorage.setItem(AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.STATE_ACQ_TOKEN, `${TEST_LIBRARY_STATE}|${TEST_USER_STATE_NUM}`), `${TEST_LIBRARY_STATE}|${TEST_USER_STATE_NUM}`);
            cacheStorage.setItem(AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.NONCE_IDTOKEN, `${TEST_LIBRARY_STATE}|${TEST_USER_STATE_NUM}`), TEST_NONCE);

            msal = new UserAgentApplication(config);

            const checkRespFromServer = function(response: AuthResponse) {
                expect(response.uniqueId).toBe(TEST_UNIQUE_ID);
                expect(response.tokenType).toBe(ServerHashParamKeys.ACCESS_TOKEN);
                expect(response.tenantId).toBe(TEST_CONFIG.MSAL_TENANT_ID);
                expect(response.accountState).toBe(TEST_USER_STATE_NUM);
                expect(response.expiresOn.getTime()).toBe(
                    (TEST_TOKEN_LIFETIMES.BASELINE_DATE_CHECK + TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN) * 1000
                );
                expect(cacheStorage.getItem(TemporaryCacheKeys.URL_HASH)).toBeNull();
                done();
            };
            msal.handleRedirectCallback(checkRespFromServer, errorReceivedCallback);
        });

        it("tests that expiresIn returns the correct date for id tokens", function (done) {
            const acquireTokenAccountKey = AuthCache.generateAcquireTokenAccountKey(account.homeAccountIdentifier, `${TEST_LIBRARY_STATE}|${TEST_USER_STATE_NUM}`);
            cacheStorage.setItem(acquireTokenAccountKey, JSON.stringify(account));

            const successHash = testHashesForState(TEST_LIBRARY_STATE).TEST_SUCCESS_ID_TOKEN_HASH + TEST_USER_STATE_NUM;
            window.location.hash = successHash;
            cacheStorage.setItem(AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.STATE_LOGIN,`${TEST_LIBRARY_STATE}|${TEST_USER_STATE_NUM}`), `${TEST_LIBRARY_STATE}|${TEST_USER_STATE_NUM}`);
            cacheStorage.setItem(AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.NONCE_IDTOKEN, `${TEST_LIBRARY_STATE}|${TEST_USER_STATE_NUM}`), TEST_NONCE);

            msal = new UserAgentApplication(config);

            const checkRespFromServer = function(response: AuthResponse) {
                expect(response.uniqueId).toBe(TEST_UNIQUE_ID);
                expect(response.tokenType).toBe(ServerHashParamKeys.ID_TOKEN);
                expect(response.tenantId).toBe(TEST_CONFIG.MSAL_TENANT_ID);
                expect(response.accountState).toBe(TEST_USER_STATE_NUM);
                expect(response.expiresOn.getTime()).toBe(TEST_TOKEN_LIFETIMES.TEST_ID_TOKEN_EXP * 1000);
                expect(cacheStorage.getItem(TemporaryCacheKeys.URL_HASH)).toBeNull();
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

            setAuthInstanceStubs();
            setTestCacheItems();
            cacheStorage.setInteractionInProgress(true);
        });

        afterEach(function() {
            config = {auth: {clientId: ""}};
            cacheStorage.clear();
            sinon.restore();
        });

        it("tests saveTokenForHash in case of interaction_required error code", function(done) {
            window.location.hash = testHashesForState(TEST_LIBRARY_STATE).TEST_INTERACTION_REQ_ERROR_HASH1 + TEST_USER_STATE_NUM;
            cacheStorage.setItem(AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.STATE_LOGIN, `${TEST_LIBRARY_STATE}|${TEST_USER_STATE_NUM}`), `${TEST_LIBRARY_STATE}|${TEST_USER_STATE_NUM}`);

            msal = new UserAgentApplication(config);

            const checkErrorFromServer = function(error: AuthError, response: AuthResponse) {
                expect(cacheStorage.getItem(TemporaryCacheKeys.URL_HASH)).toBeNull();
                expect(error instanceof InteractionRequiredAuthError).toBe(true);
                expect(error.name).toContain("InteractionRequiredAuthError");
                expect(error.errorCode).toContain(InteractionRequiredAuthErrorMessage.interactionRequired.code);
                expect(error.errorMessage).toContain(TEST_ERROR_DESC);
                expect(error.message).toContain(TEST_ERROR_DESC);
                expect(error.stack).toContain("UserAgentApplication.spec.ts");
                done();
            };
            msal.handleRedirectCallback(checkErrorFromServer);
        });

        it("tests saveTokenForHash in case of interaction_required error code and description", function(done) {
            window.location.hash = testHashesForState(TEST_LIBRARY_STATE).TEST_INTERACTION_REQ_ERROR_HASH2 + TEST_USER_STATE_NUM;
            cacheStorage.setItem(AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.STATE_LOGIN, `${TEST_LIBRARY_STATE}|${TEST_USER_STATE_NUM}`), `${TEST_LIBRARY_STATE}|${TEST_USER_STATE_NUM}`);

            msal = new UserAgentApplication(config);

            const checkErrorFromServer = function(error: AuthError, response: AuthResponse) {
                expect(cacheStorage.getItem(TemporaryCacheKeys.URL_HASH)).toBeNull();
                expect(error instanceof InteractionRequiredAuthError).toBe(true);
                expect(error.name).toContain("InteractionRequiredAuthError");
                expect(error.errorCode).toContain(InteractionRequiredAuthErrorMessage.interactionRequired.code);
                expect(error.errorMessage).toContain(TEST_ERROR_DESC);
                expect(error.message).toContain(TEST_ERROR_DESC);
                expect(error.errorMessage).toContain(InteractionRequiredAuthErrorMessage.interactionRequired.code);
                expect(error.message).toContain(InteractionRequiredAuthErrorMessage.interactionRequired.code);
                expect(error.stack).toContain("UserAgentApplication.spec.ts");
                done();
            };
            msal.handleRedirectCallback(checkErrorFromServer);
        });

        it("tests saveTokenForHash in case of login_required error code", function(done) {
            window.location.hash = testHashesForState(TEST_LIBRARY_STATE).TEST_LOGIN_REQ_ERROR_HASH1 + TEST_USER_STATE_NUM;
            cacheStorage.setItem(AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.STATE_LOGIN, `${TEST_LIBRARY_STATE}|${TEST_USER_STATE_NUM}`), `${TEST_LIBRARY_STATE}|${TEST_USER_STATE_NUM}`);

            msal = new UserAgentApplication(config);

            const checkErrorFromServer = function(error: AuthError, response: AuthResponse) {
                expect(cacheStorage.getItem(TemporaryCacheKeys.URL_HASH)).toBeNull();
                expect(error instanceof InteractionRequiredAuthError).toBe(true);
                expect(error.name).toContain("InteractionRequiredAuthError");
                expect(error.errorCode).toContain(InteractionRequiredAuthErrorMessage.loginRequired.code);
                expect(error.errorMessage).toContain(TEST_ERROR_DESC);
                expect(error.message).toContain(TEST_ERROR_DESC);
                expect(error.stack).toContain("UserAgentApplication.spec.ts");
                done();
            };
            msal.handleRedirectCallback(checkErrorFromServer);
        });

        it("tests saveTokenForHash in case of login_required error code and description", function(done) {
            window.location.hash = testHashesForState(TEST_LIBRARY_STATE).TEST_LOGIN_REQ_ERROR_HASH2 + TEST_USER_STATE_NUM;
            cacheStorage.setItem(AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.STATE_LOGIN, `${TEST_LIBRARY_STATE}|${TEST_USER_STATE_NUM}`), `${TEST_LIBRARY_STATE}|${TEST_USER_STATE_NUM}`);

            msal = new UserAgentApplication(config);

            const checkErrorFromServer = function(error: AuthError, response: AuthResponse) {
                expect(cacheStorage.getItem(TemporaryCacheKeys.URL_HASH)).toBeNull();
                expect(error instanceof InteractionRequiredAuthError).toBe(true);
                expect(error.name).toContain("InteractionRequiredAuthError");
                expect(error.errorCode).toContain(InteractionRequiredAuthErrorMessage.loginRequired.code);
                expect(error.errorMessage).toContain(TEST_ERROR_DESC);
                expect(error.message).toContain(TEST_ERROR_DESC);
                expect(error.errorMessage).toContain(InteractionRequiredAuthErrorMessage.loginRequired.code);
                expect(error.message).toContain(InteractionRequiredAuthErrorMessage.loginRequired.code);
                expect(error.stack).toContain("UserAgentApplication.spec.ts");
                done();
            };
            msal.handleRedirectCallback(checkErrorFromServer);
        });

        it("tests saveTokenForHash in case of consent_required error code", function(done) {
            window.location.hash = testHashesForState(TEST_LIBRARY_STATE).TEST_CONSENT_REQ_ERROR_HASH1 + TEST_USER_STATE_NUM;
            cacheStorage.setItem(AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.STATE_LOGIN, `${TEST_LIBRARY_STATE}|${TEST_USER_STATE_NUM}`), `${TEST_LIBRARY_STATE}|${TEST_USER_STATE_NUM}`);

            msal = new UserAgentApplication(config);

            const checkErrorFromServer = function(error: AuthError, response: AuthResponse) {
                expect(cacheStorage.getItem(TemporaryCacheKeys.URL_HASH)).toBeNull();
                expect(error instanceof InteractionRequiredAuthError).toBe(true);
                expect(error.name).toContain("InteractionRequiredAuthError");
                expect(error.errorCode).toContain(InteractionRequiredAuthErrorMessage.consentRequired.code);
                expect(error.errorMessage).toContain(TEST_ERROR_DESC);
                expect(error.message).toContain(TEST_ERROR_DESC);
                expect(error.stack).toContain("UserAgentApplication.spec.ts");
                done();
            };
            msal.handleRedirectCallback(checkErrorFromServer);
        });

        it("tests saveTokenForHash in case of consent_required error code and description", function(done) {
            window.location.hash = testHashesForState(TEST_LIBRARY_STATE).TEST_CONSENT_REQ_ERROR_HASH2 + TEST_USER_STATE_NUM;
            cacheStorage.setItem(AuthCache.generateTemporaryCacheKey(TemporaryCacheKeys.STATE_LOGIN, `${TEST_LIBRARY_STATE}|${TEST_USER_STATE_NUM}`), `${TEST_LIBRARY_STATE}|${TEST_USER_STATE_NUM}`);

            msal = new UserAgentApplication(config);

            const checkErrorFromServer = function(error: AuthError, response: AuthResponse) {
                expect(cacheStorage.getItem(TemporaryCacheKeys.URL_HASH)).toBeNull();
                expect(error instanceof InteractionRequiredAuthError).toBe(true);
                expect(error.name).toContain("InteractionRequiredAuthError");
                expect(error.errorCode).toContain(InteractionRequiredAuthErrorMessage.consentRequired.code);
                expect(error.errorMessage).toContain(TEST_ERROR_DESC);
                expect(error.message).toContain(TEST_ERROR_DESC);
                expect(error.errorMessage).toContain(InteractionRequiredAuthErrorMessage.consentRequired.code);
                expect(error.message).toContain(InteractionRequiredAuthErrorMessage.consentRequired.code);
                expect(error.stack).toContain("UserAgentApplication.spec.ts");
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
            window.location.hash = "";
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
            expect(msal.getAccount()).not.toBeNull();
            msal.logout();
            expect(msal.getAccount()).toBeNull();
            expect(clearCacheSpy.calledOnce).toBe(true);
        });

        it("adds postLogoutRedirectUri to logout URI", function (done) {
            window.location = {
                ...oldWindowLocation,
                hash: "",
                assign: function (url) {
                    try {
                        expect(url).toContain(encodeURIComponent(TEST_URIS.TEST_LOGOUT_URI));
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
                        expect(url).toContain(validOpenIdConfigurationResponse.EndSessionEndpoint);
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
                        expect(url).toContain(TEST_URIS.DEFAULT_INSTANCE + TEST_CONFIG.TENANT + "oauth2/v2.0/logout?");
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
            expect(result).toBe("91111");
        });

        it("test getAccountState when there is no user state", function () {
            const result = msal.getAccountState("123465464565");
            expect(result).toBe("123465464565");
        });

        it("test getAccountState when there is no state", function () {
            const result = msal.getAccountState("");
            expect(result).toBe("");
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
            expect(checkConfig.cache.cacheLocation).toBe("sessionStorage");
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
            expect(checkConfig.cache.cacheLocation).toBe(config.cache.cacheLocation);
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
            setAuthInstanceStubs();
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
            sinon.stub(window, "open").callsFake(() => {
                return null;
            });
            const loginPopupPromise = msal.loginPopup({});
            expect(loginPopupPromise instanceof Promise).toBe(true);
            loginPopupPromise.catch(error => {});
        });

        it("returns a promise from acquireTokenPopup", function () {
            const acquireTokenPromise = msal.acquireTokenPopup({scopes: [TEST_CONFIG.MSAL_CLIENT_ID]});
            expect(acquireTokenPromise instanceof Promise).toBe(true);
            acquireTokenPromise.catch(error => {});
        });

        it("Account is cached on acquireTokenPopup call", (done) => {
            const tokenRequest: AuthenticationParameters = {
                scopes: ["S1"], 
                account: account
            };

            const TEST_LIBRARY_STATE_POPUP = RequestUtils.generateLibraryState(Constants.interactionTypePopup);

            sinon.stub(window, "open").callsFake((url) => {
                // @ts-ignore
                const state = UrlUtils.deserializeHash(url).state;
                const accountKey = AuthCache.generateAcquireTokenAccountKey(account.homeAccountIdentifier, state);

                expect(cacheStorage.getItem(accountKey)).toBe(JSON.stringify(account));
                done();
                return window;
            });


            window.focus = null;
            window.location = {
                ...oldWindowLocation,
                href: TEST_URIS.TEST_REDIR_URI + "/" + testHashesForState(TEST_LIBRARY_STATE_POPUP).TEST_SUCCESS_ACCESS_TOKEN_HASH + TEST_USER_STATE_NUM,
                hash: testHashesForState(TEST_LIBRARY_STATE_POPUP).TEST_SUCCESS_ACCESS_TOKEN_HASH + TEST_USER_STATE_NUM
            };

            const acquireTokenPromise = msal.acquireTokenPopup(tokenRequest);
            expect(acquireTokenPromise instanceof Promise).toBe(true);

            acquireTokenPromise.catch(error => {console.log(error);});
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
            sinon.restore();
        });

        it("returns a promise from acquireTokenSilent", function () {
            const acquireTokenSilentPromise = msal.acquireTokenSilent({scopes: [TEST_CONFIG.MSAL_CLIENT_ID]});
            expect(acquireTokenSilentPromise instanceof Promise).toBe(true);
            acquireTokenSilentPromise.catch(error => {});
        });

        it("acquireTokenSilent returns even if a new UserAgentApplication instance is instantiated", (done) => {
            // Tests a bug whereby the instantiation of a 2nd UserAgentApplication was causing in-progress acquireTokenSilent calls on other instances to hang
            const request = {
                scopes: [TEST_CONFIG.MSAL_CLIENT_ID], 
                loginHint: TEST_LOGIN_HINT,
                forceRefresh: true
            }
            const TEST_LIBRARY_STATE_SILENT = RequestUtils.generateLibraryState(Constants.interactionTypeSilent);
            sinon.stub(RequestUtils, "validateAndGenerateState").returns(TEST_LIBRARY_STATE_SILENT + "|");
            sinon.stub(CryptoUtils, "createNewGuid").returns("123523")
            sinon.stub(WindowUtils, "monitorIframeForHash").callsFake(() => {
                const secondUserAgentApplication = new UserAgentApplication({
                    auth: {
                        clientId: "second-test-client-id"
                    }
                });
                return Promise.resolve(testHashesForState(TEST_LIBRARY_STATE_SILENT).TEST_SUCCESS_ACCESS_TOKEN_HASH);
            });

            msal.acquireTokenSilent(request).then((result) => {
                expect(result.accessToken).toBe(TEST_TOKENS.ACCESSTOKEN);
                done();
            }).catch((e) => {
                console.log(e);
            });
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
                () => {expect(e).toBeInstanceOf(ClientConfigurationError);};
            }
        });

        it("throws an error if configured with a null request", () => {
            try {
                msal.acquireTokenPopup(null);
            } catch(e) {
                () => {expect(e).toBeInstanceOf(ClientConfigurationError);};
            }
        });
    });

    describe("Logger", () => {
        it("getLogger and setLogger", done => {
            const config: Configuration = {
                auth: {
                    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                    redirectUri: TEST_URIS.TEST_REDIR_URI
                }
            };

            msal = new UserAgentApplication(config);

            const correlationId = CryptoUtils.createNewGuid();

            const logger = new Logger((level, message, containsPii) => {
                expect(message).toContain("Message");
                expect(message).toContain(correlationId);
                expect(message).toContain("Info");

                expect(level).toBe(LogLevel.Info);
                expect(containsPii).toBe(false);

                done();
            }, {
                correlationId,
                piiLoggingEnabled: false
            });

            msal.setLogger(logger);

            expect(msal.getLogger()).toBe(logger);

            msal.getLogger().info("Message");
        });
    });

    describe("ssoSilent", () => {
        it("invokes acquireTokenSilent with loginHint", done => {
            const loginHint = "test@example.com";

            const atsStub = sinon.stub(msal, "acquireTokenSilent").callsFake(async (request) => {
                expect(request.loginHint).toBe(loginHint);
                expect(request.scopes).toEqual(Constants.oidcScopes);

                atsStub.restore();
                done();
                return {} as AuthResponse;
            });

            msal.ssoSilent({
                loginHint
            });
        });

        it("invokes acquireTokenSilent with sid", done => {
            const sid = "fakesid";

            const atsStub = sinon.stub(msal, "acquireTokenSilent").callsFake(async (request) => {
                expect(request.sid).toBe(sid);
                expect(request.scopes).toEqual(Constants.oidcScopes);

                atsStub.restore();
                done();
                return {} as AuthResponse;
            });

            msal.ssoSilent({
                sid
            });
        });

        it("throws if sid or login isnt provided", done => {
            try {
                msal.ssoSilent({});
            } catch (e) {
                expect(e.errorCode).toBe("sso_silent_error");
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
                    setAuthInstanceStubs();
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
                                expect(url).toContain(idTokenType);
                                expect(url).not.toContain(tokenType);
                                expect(url).not.toContain(idTokenTokenType);
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
                const TEST_LIBRARY_STATE_POPUP = RequestUtils.generateLibraryState(Constants.interactionTypePopup);

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
                });

                afterEach(function() {
                    window = oldWindow;
                    window.location = oldWindowLocation;
                    cacheStorage.clear();
                    sinon.restore();
                });
                
                it("loginPopup should set response_type to id_token", (done) => {
                    let navigateUrl: string;
                    sinon.stub(window, "open").callsFake((url) => {
                        navigateUrl = url;
                        return null;
                    })
                    window.location.hash = testHashesForState(TEST_LIBRARY_STATE_POPUP).TEST_SUCCESS_ACCESS_TOKEN_HASH + TEST_USER_STATE_NUM;

                    const loginPopupPromise = msal.loginPopup({});
                    loginPopupPromise.catch(error => {
                        expect(navigateUrl).toContain(idTokenType);
                        expect(navigateUrl).not.toContain(tokenType);
                        expect(navigateUrl).not.toContain(idTokenTokenType);
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
                    setAuthInstanceStubs();
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
                                expect(url).toContain(idTokenType);
                                expect(url).not.toContain(tokenType);
                                expect(url).not.toContain(idTokenTokenType);
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
                                expect(url).toContain(idTokenType);
                                expect(url).not.toContain(tokenType);
                                expect(url).not.toContain(idTokenTokenType);
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
                                expect(url).toContain(idTokenType);
                                expect(url).not.toContain(tokenType);
                                expect(url).not.toContain(idTokenTokenType);
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
                                expect(url).toContain(idTokenType);
                                expect(url).not.toContain(tokenType);
                                expect(url).not.toContain(idTokenTokenType);
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
                                expect(url).toContain(idTokenType);
                                expect(url).not.toContain(tokenType);
                                expect(url).not.toContain(idTokenTokenType);
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
                                expect(url).toContain(idTokenTokenType);
                                expect(url).not.toContain(tokenType);
                                expect(url).not.toContain(idTokenType);
                                done();
                            } catch (e) {
                                console.error(e);
                            }
                        }
                    };
                    
                    sinon.stub(msal, "getAccount").returns(account);
                    msal.acquireTokenRedirect({ scopes: ["S1", Constants.openidScope], account});
                });

                it("should set response_type to id_token token when a resource scope is included along with profile", (done) => {
                    window.location = {
                        ...oldWindowLocation,
                        assign: function (url) {
                            try {
                                expect(url).toContain(idTokenTokenType);
                                expect(url).not.toContain(tokenType);
                                expect(url).not.toContain(idTokenType);
                                done();
                            } catch (e) {
                                console.error(e);
                            }
                        }
                    };
                    
                    sinon.stub(msal, "getAccount").returns(account);
                    msal.acquireTokenRedirect({ scopes: ["S1", Constants.profileScope], account});
                });

                it("should set response_type to id_token token when a resource scope is included along with both OIDC scopes", (done) => {
                    window.location = {
                        ...oldWindowLocation,
                        assign: function (url) {
                            try {
                                expect(url).toContain(idTokenTokenType);
                                expect(url).not.toContain(tokenType);
                                expect(url).not.toContain(idTokenType);
                                done();
                            } catch (e) {
                                console.error(e);
                            }
                        }
                    };

                    const oidcScopes = [Constants.openidScope, Constants.profileScope];                        
                    sinon.stub(msal, "getAccount").returns(account);
                    msal.acquireTokenRedirect({ scopes: ["S1", ...oidcScopes], account});
                });

                it("should treat clientId as a resource scope when included with OIDC scopes and therefore set response_type to id_token token", (done) => {
                    window.location = {
                        ...oldWindowLocation,
                        assign: function (url) {
                            try {
                                expect(url).toContain(idTokenTokenType);
                                expect(url).not.toContain(tokenType);
                                expect(url).not.toContain(idTokenType);
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
                                expect(url).toContain(tokenType);
                                expect(url).not.toContain(idTokenTokenType);
                                expect(url).not.toContain(idTokenType);
                                done();
                            } catch (e) {
                                console.error(e);
                            }
                        }
                    };

                    const oidcScopes = [Constants.openidScope, Constants.profileScope];                        
                    sinon.stub(msal, "getAccount").returns(account);
                    msal.acquireTokenRedirect({ scopes: ["S1"], account});
                });

                it("should set response_type to token when multiple resource scopes are included", (done) => {
                    window.location = {
                        ...oldWindowLocation,
                        assign: function (url) {
                            try {
                                expect(url).toContain(tokenType);
                                expect(url).not.toContain(idTokenTokenType);
                                expect(url).not.toContain(idTokenType);
                                done();
                            } catch (e) {
                                console.error(e);
                            }
                        }
                    };

                    const oidcScopes = [Constants.openidScope, Constants.profileScope];                        
                    sinon.stub(msal, "getAccount").returns(account);
                    msal.acquireTokenRedirect({ scopes: ["S1", "S2"], account});
                });
                it("should treat clientId as a resource scope when included with resource scopes and therefore set response_type to token", (done) => {
                    window.location = {
                        ...oldWindowLocation,
                        assign: function (url) {
                            try {
                                expect(url).toContain(tokenType);
                                expect(url).not.toContain(idTokenTokenType);
                                expect(url).not.toContain(idTokenType);
                                done();
                            } catch (e) {
                                console.error(e);
                            }
                        }
                    };

                    const oidcScopes = [Constants.openidScope, Constants.profileScope];                        
                    sinon.stub(msal, "getAccount").returns(account);
                    msal.acquireTokenRedirect({ scopes: [TEST_CONFIG.MSAL_CLIENT_ID, "S1"], account});
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
                    setAuthInstanceStubs();
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
                                expect(url).toContain(idTokenType);
                                expect(url).not.toContain(tokenType);
                                expect(url).not.toContain(idTokenTokenType);
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
                                expect(url).toContain(idTokenType);
                                expect(url).not.toContain(tokenType);
                                expect(url).not.toContain(idTokenTokenType);
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
                                expect(url).toContain(idTokenType);
                                expect(url).not.toContain(tokenType);
                                expect(url).not.toContain(idTokenTokenType);
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
                                expect(url).toContain(idTokenType);
                                expect(url).not.toContain(tokenType);
                                expect(url).not.toContain(idTokenTokenType);
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
                                expect(url).toContain(idTokenTokenType);
                                expect(url).not.toContain(tokenType);
                                expect(url).not.toContain(idTokenType);
                                done();
                            } catch (e) {
                                console.error(e);
                            }
                        }
                    };
                    
                    msal.acquireTokenRedirect({ scopes: ["S1", Constants.openidScope], account});
                });

                it("should set response_type to id_token token when a resource scope is included along with profile", (done) => {
                    window.location = {
                        ...oldWindowLocation,
                        assign: function (url) {
                            try {
                                expect(url).toContain(idTokenTokenType);
                                expect(url).not.toContain(tokenType);
                                expect(url).not.toContain(idTokenType);
                                done();
                            } catch (e) {
                                console.error(e);
                            }
                        }
                    };
                    
                    msal.acquireTokenRedirect({ scopes: ["S1", Constants.profileScope], account});
                });

                it("should set response_type to id_token token when a resource scope is included along with both OIDC scopes", (done) => {
                    window.location = {
                        ...oldWindowLocation,
                        assign: function (url) {
                            try {
                                expect(url).toContain(idTokenTokenType);
                                expect(url).not.toContain(tokenType);
                                expect(url).not.toContain(idTokenType);
                                done();
                            } catch (e) {
                                console.error(e);
                            }
                        }
                    };

                    const oidcScopes = [Constants.openidScope, Constants.profileScope];                        
                    msal.acquireTokenRedirect({ scopes: ["S1", ...oidcScopes], account});
                });

                it("should treat clientId as a resource scope when included with OIDC scopes and therefore set response_type to id_token token", (done) => {
                    window.location = {
                        ...oldWindowLocation,
                        assign: function (url) {
                            try {
                                expect(url).toContain(idTokenTokenType);
                                expect(url).not.toContain(tokenType);
                                expect(url).not.toContain(idTokenType);
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
                                expect(url).not.toContain(tokenType);
                                expect(url).toContain(idTokenTokenType);
                                expect(url).not.toContain(idTokenType);
                                done();
                            } catch (e) {
                                console.error(e);
                            }
                        }
                    };

                    const oidcScopes = [Constants.openidScope, Constants.profileScope];                        
                    msal.acquireTokenRedirect({ scopes: ["S1"], account});
                });

                it("should set response_type to id_token token when multiple resource scopes are included because login is required", (done) => {
                    window.location = {
                        ...oldWindowLocation,
                        assign: function (url) {
                            try {
                                expect(url).not.toContain(tokenType);
                                expect(url).toContain(idTokenTokenType);
                                expect(url).not.toContain(idTokenType);
                                done();
                            } catch (e) {
                                console.error(e);
                            }
                        }
                    };

                    const oidcScopes = [Constants.openidScope, Constants.profileScope];                        
                    msal.acquireTokenRedirect({ scopes: ["S1", "S2"], account});
                });
                it("should treat clientId as a resource scope when included with resource scopes and therefore set response_type to id_token token because login is required", (done) => {
                    window.location = {
                        ...oldWindowLocation,
                        assign: function (url) {
                            try {
                                expect(url).not.toContain(tokenType);
                                expect(url).toContain(idTokenTokenType);
                                expect(url).not.toContain(idTokenType);
                                done();
                            } catch (e) {
                                console.error(e);
                            }
                        }
                    };

                    const oidcScopes = [Constants.openidScope, Constants.profileScope];                        
                    msal.acquireTokenRedirect({ scopes: [TEST_CONFIG.MSAL_CLIENT_ID, "S1"], account});
                });
            }); 
        });
    });
});
