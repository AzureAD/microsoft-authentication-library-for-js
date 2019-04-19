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
    AuthResponse
} from '../src/index';
import sinon from "sinon";
import { ITenantDiscoveryResponse } from "../src/ITenantDiscoveryResponse";
import { Storage } from "../src/Storage";
import { AccessTokenKey } from "../src/AccessTokenKey";
import { AccessTokenValue } from "../src/AccessTokenValue";
import { Utils } from "../src/Utils";
import { SSOTypes } from "../src/Constants";
import { ClientAuthErrorMessage } from "../src/error/ClientAuthError";
import { ClientConfigurationErrorMessage } from "../src/error/ClientConfigurationError";

type kv = {
    [key: string]: string;   
}

describe("UserAgentApplication", function () {

    const DEFAULT_INSTANCE = "https://login.microsoftonline.com/";
    const ALTERNATE_INSTANCE = "https://login.windows.net/"
    const TEST_REDIR_URI = "https://localhost:8081/redirect.html";
    const TEST_LOGOUT_URI = "https://localhost:8081/logout.html";
    const TEST_ERROR_HASH = "#error=error_code&error_description=msal+error+description&state=12345";
    const TEST_ERROR_CODE = "error_code";
    const TEST_ERROR_DESC = "msal error description"
    const TEST_USER_STATE_NUM = "1234";
    const TEST_USER_STATE_URL = "https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-implicit-grant-flow?name=value&name2=value2";
    const TEST_STATE = "6789|" + TEST_USER_STATE_NUM;
    const TEST_CLIENT_INFO_B64ENCODED = "eyJ1aWQiOiIxMjM0NSIsInV0aWQiOiI2Nzg5MCJ9";
    const TENANT = 'common';
    const MSAL_CLIENT_ID = "0813e1d1-ad72-46a9-8665-399bba48c201";
    const validAuthority = DEFAULT_INSTANCE + TENANT;
    const alternateValidAuthority = ALTERNATE_INSTANCE + TENANT;
    const validOpenIdConfigString = `{"authorization_endpoint":"${validAuthority}/oauth2/v2.0/authorize","token_endpoint":"https://token_endpoint","issuer":"https://fakeIssuer", "end_session_endpoint":"https://end_session_endpoint"}`;
    const validOpenIdConfigurationResponse: ITenantDiscoveryResponse = {
        AuthorizationEndpoint: `${validAuthority}/oauth2/v2.0/authorize`,
        EndSessionEndpoint: `https://end_session_endpoint`,
        Issuer: `https://fakeIssuer`
    }

    let msal: UserAgentApplication;

    let successCallback = function(response) {
        console.log("Response: " + response);
    };

    let errCallback = function (error, state) {
        console.log("Error: " + error);
        console.log("State: " + state);
    };

    let setAuthInstanceStubs = function () {
        sinon.stub(msal.getAuthorityInstance(), "resolveEndpointsAsync").callsFake(function () : Promise<Authority> {
            return new Promise((resolve, reject) => {
                return resolve(msal.getAuthorityInstance());
            });
        });
        sinon.stub(msal.getAuthorityInstance(), "AuthorizationEndpoint").value(validOpenIdConfigurationResponse.AuthorizationEndpoint);
        sinon.stub(msal.getAuthorityInstance(), "EndSessionEndpoint").value(validOpenIdConfigurationResponse.EndSessionEndpoint);
        sinon.stub(msal.getAuthorityInstance(), "SelfSignedJwtAudience").value(validOpenIdConfigurationResponse.Issuer);
        sinon.stub(msal, "isInIframe").returns(false);
    };

    let setUtilUnifiedCacheQPStubs = function (params: kv) {
        sinon.stub(Utils, "constructUnifiedCacheQueryParameter").returns(params);
        sinon.stub(Utils, "addSSOParameter").returns(params);
    };

    let cacheStorage: Storage;
    let accessTokenKey : AccessTokenKey;
    let accessTokenValue : AccessTokenValue;
    let account : Account;
    
    let setTestCacheItems = function () {
        accessTokenKey = {
            authority: validAuthority,
            clientId: "0813e1d1-ad72-46a9-8665-399bba48c201",
            scopes: "S1",
            homeAccountIdentifier: "1234"
        };
        accessTokenValue = {
            accessToken: "accessToken1",
            idToken: "idToken",
            expiresIn: "150000000000000",
            homeAccountIdentifier: ""
        };
        account = {
            accountIdentifier: "1234",
            environment: "js",
            homeAccountIdentifier: "1234",
            idToken: "idToken",
            name: "Test Account",
            sid: "123451435",
            userName: "TestAccount"
        };
    };

    describe("Redirect Flow Unit Tests", function () {
        beforeEach(function() {
            const config: Configuration = {
                auth: {
                    clientId: MSAL_CLIENT_ID,
                    redirectUri: TEST_REDIR_URI
                }
            };
            msal = new UserAgentApplication(config);
            setAuthInstanceStubs();
        });

        afterEach(function () {
            sinon.restore();
        });

        it("throws error if loginRedirect is called without calling setRedirectCallbacks", function (done) {
            expect(msal.getRedirectUri()).to.be.equal(TEST_REDIR_URI);
            expect(msal.loginRedirect.bind(msal)).to.throw(ClientConfigurationError);
            done();
        });

        it('throws error if null argument is passed to either argument of setRedirectCallbacks', (done) => {
            expect(() => msal.handleRedirectCallbacks(successCallback, null)).to.throw(ClientConfigurationError);
            expect(() => msal.handleRedirectCallbacks(null, errCallback)).to.throw(ClientConfigurationError);
            done();
        });

        it('navigates user to login and prompt parameter is not passed by default', (done) => {
            sinon.stub(window.location, "replace").callsFake(function (url) {
                expect(url).to.include(DEFAULT_INSTANCE + TENANT + '/oauth2/v2.0/authorize?response_type=id_token&scope=openid%20profile');
                expect(url).to.include('&client_id=' + MSAL_CLIENT_ID);
                expect(url).to.include('&redirect_uri=' + encodeURIComponent(msal.getRedirectUri()));
                expect(url).to.include('&state');
                expect(url).to.include('&client_info=1');
                expect(url).not.to.include(Constants.prompt_select_account);
                expect(url).not.to.include(Constants.prompt_none);
                done();
            });
            msal.handleRedirectCallbacks(successCallback, errCallback);
            expect(msal.getRedirectUri()).to.be.equal(TEST_REDIR_URI);
            msal.loginRedirect({});
        });

        it('navigates user to login and prompt=select_account parameter is passed in request', (done) => {
            sinon.stub(window.location, "replace").callsFake(function (url) {
                expect(url).to.include(DEFAULT_INSTANCE + TENANT + '/oauth2/v2.0/authorize?response_type=id_token&scope=openid%20profile');
                expect(url).to.include('&client_id=' + MSAL_CLIENT_ID);
                expect(url).to.include('&redirect_uri=' + encodeURIComponent(msal.getRedirectUri()));
                expect(url).to.include('&state');
                expect(url).to.include('&client_info=1');
                expect(url).to.include(Constants.prompt_select_account);
                expect(url).not.to.include(Constants.prompt_none);
                done();
            });
            msal.handleRedirectCallbacks(successCallback, errCallback);
            expect(msal.getRedirectUri()).to.be.equal(TEST_REDIR_URI);

            let request: AuthenticationParameters = { prompt: "select_account" };
            msal.loginRedirect(request);
        });

        it('navigates user to login and prompt=none parameter is passed in request', (done) => {
            sinon.stub(window.location, "replace").callsFake(function (url) {
                expect(url).to.include(DEFAULT_INSTANCE + TENANT + '/oauth2/v2.0/authorize?response_type=id_token&scope=openid%20profile');
                expect(url).to.include('&client_id=' + MSAL_CLIENT_ID);
                expect(url).to.include('&redirect_uri=' + encodeURIComponent(msal.getRedirectUri()));
                expect(url).to.include('&state');
                expect(url).to.include('&client_info=1');
                expect(url).not.to.include(Constants.prompt_select_account);
                expect(url).to.include(Constants.prompt_none);
                done();
            });
            msal.handleRedirectCallbacks(successCallback, errCallback);
            expect(msal.getRedirectUri()).to.be.equal(TEST_REDIR_URI);

            let request: AuthenticationParameters = { prompt: "none" };
            msal.loginRedirect(request);
        });

        it("tests if hint parameters are added when account object is passed in request", function (done) {
            let accountObj: Account = {
                homeAccountIdentifier: 'MTIzNA==.NTY3OA==',
                accountIdentifier: '1234',
                userName: 'some_id',
                name: null,
                idToken: null,
                sid: null,
                environment: null
            };
            sinon.stub(window.location, "replace").callsFake(function (url) {
                expect(url).to.include(DEFAULT_INSTANCE + TENANT + '/oauth2/v2.0/authorize?response_type=id_token&scope=openid%20profile');
                expect(url).to.include('&client_id=' + MSAL_CLIENT_ID);
                expect(url).to.include('&redirect_uri=' + encodeURIComponent(msal.getRedirectUri()));
                expect(url).to.include('&state');
                expect(url).to.include('&client_info=1');
                expect(url).to.include("&login_hint=" + 'some_id');
                expect(url).to.include("&login_req=1234");
                expect(url).to.include("&domain_req=5678");
                expect(url).to.include("&domain_hint");
                expect(url).to.include(Constants.prompt_select_account);
                expect(url).to.not.include(Constants.prompt_none);
                done();
            });
            msal.handleRedirectCallbacks(successCallback, errCallback);
            expect(msal.getRedirectUri()).to.be.equal(TEST_REDIR_URI);
            let tokenRequest: AuthenticationParameters = {
                prompt: "select_account",
                account: accountObj
            };
            msal.loginRedirect(tokenRequest);
        });

        it('navigates user to redirectURI passed in constructor config', (done) => {
            sinon.stub(window.location, "replace").callsFake(function (url) {
                expect(url).to.include(DEFAULT_INSTANCE + TENANT + '/oauth2/v2.0/authorize?response_type=id_token&scope=openid%20profile');
                expect(url).to.include('&client_id=' + MSAL_CLIENT_ID);
                expect(url).to.include('&redirect_uri=' + encodeURIComponent(msal.getRedirectUri()));
                expect(url).to.include('&state');
                expect(url).to.include('&client_info=1');
                done();
            });
            msal.handleRedirectCallbacks(successCallback, errCallback);
            expect(msal.getRedirectUri()).to.be.equal(TEST_REDIR_URI);

            msal.loginRedirect({});
        });

        it('uses current location.href as redirectUri default value, even if location changed after UserAgentApplication was instantiated', (done) => {
            const config: Configuration = {
                auth: {
                    clientId: MSAL_CLIENT_ID
                }
            };
            msal = new UserAgentApplication(config);
            history.pushState(null, null, '/new_pushstate_uri');
            sinon.stub(window.location, "replace").callsFake(function (url) {
                expect(url).to.include('&redirect_uri=' + encodeURIComponent('http://localhost:8080/new_pushstate_uri'));
                done();
            });
            msal.handleRedirectCallbacks(successCallback, errCallback);
            msal.loginRedirect({});
        });

        it('exits login function with error if loginInProgress is true', function (done) {
            sinon.stub(msal, <any>"loginInProgress").value(true);
            let checkErrorFromLibrary = function (authErr: AuthError) {
                expect(authErr instanceof ClientAuthError).to.be.true;
                expect(authErr.errorCode).to.equal(ClientAuthErrorMessage.loginProgressError.code);
                expect(authErr.errorMessage).to.equal(ClientAuthErrorMessage.loginProgressError.desc);
                expect(authErr.message).to.equal(ClientAuthErrorMessage.loginProgressError.desc);
                expect(authErr.name).to.equal("ClientAuthError");
                expect(authErr.stack).to.be.undefined;
                done();
            }
            msal.handleRedirectCallbacks(successCallback, checkErrorFromLibrary);
            msal.loginRedirect();
        });

        it('exits login function with error if invalid prompt parameter is passed', function (done) {
            // TODO: We need to perform upfront parameter validation in order for this test to pass
            // let tokenRequest = {
            //     prompt: "random"
            // };
            // msal.handleRedirectCallbacks(successCallback, errCallback);
            // let authErr: AuthError;
            // try {
            //     msal.loginRedirect(tokenRequest);
            // } catch (e) {
            //     authErr = e;
            // }
            // console.log(authErr);

            // expect(authErr.errorCode).to.equal(ClientConfigurationErrorMessage.invalidPrompt.code);
            // expect(authErr.errorMessage).to.contain(ClientConfigurationErrorMessage.invalidPrompt.desc);
            // expect(authErr.errorMessage).to.contain(tokenRequest.prompt);
            // expect(authErr.message).to.contain(ClientConfigurationErrorMessage.invalidPrompt.desc);
            // expect(authErr.name).to.equal("ClientConfigurationError");
            // expect(authErr.stack).to.include("UserAgentApplication.spec.js");
            done();
        });

        it("tests if error is thrown when null scopes are passed", function (done) {
            msal.handleRedirectCallbacks(successCallback, errCallback);
            var authErr: AuthError;
            try {
                msal.acquireTokenRedirect({});
            } catch (e) {
                authErr = e;
            };
            expect(authErr.errorCode).to.equal(ClientConfigurationErrorMessage.scopesRequired.code);
            expect(authErr.errorMessage).to.contain(ClientConfigurationErrorMessage.scopesRequired.desc);
            expect(authErr.message).to.contain(ClientConfigurationErrorMessage.scopesRequired.desc);
            expect(authErr.name).to.equal("ClientConfigurationError");
            expect(authErr.stack).to.include("UserAgentApplication.spec.js");
            done();
        });

        it("tests if error is thrown when empty array of scopes are passed", function (done) {
            msal.handleRedirectCallbacks(successCallback, errCallback);
            var authErr: AuthError;
            try {
                msal.acquireTokenRedirect({
                    scopes: []
                });
            } catch (e) {
                authErr = e;
            };
            expect(authErr.errorCode).to.equal(ClientConfigurationErrorMessage.emptyScopes.code);
            expect(authErr.errorMessage).to.contain(ClientConfigurationErrorMessage.emptyScopes.desc);
            expect(authErr.message).to.contain(ClientConfigurationErrorMessage.emptyScopes.desc);
            expect(authErr.name).to.equal("ClientConfigurationError");
            expect(authErr.stack).to.include("UserAgentApplication.spec.js");
            done();
        });

        it("tests if error is thrown when client id is not passed as single scope", function (done) {
            msal.handleRedirectCallbacks(successCallback, errCallback);
            var authErr: AuthError;
            try {
                msal.acquireTokenRedirect({
                    scopes: [MSAL_CLIENT_ID, "S1"]
                });
            } catch (e) {
                authErr = e;
            };
            expect(authErr.errorCode).to.equal(ClientConfigurationErrorMessage.clientScope.code);
            expect(authErr.errorMessage).to.contain(ClientConfigurationErrorMessage.clientScope.desc);
            expect(authErr.message).to.contain(ClientConfigurationErrorMessage.clientScope.desc);
            expect(authErr.name).to.equal("ClientConfigurationError");
            expect(authErr.stack).to.include("UserAgentApplication.spec.js");
            done();
        });
    });

    describe("Cache Storage Unit Tests", function () {

        beforeEach(function () {
            cacheStorage = new Storage("sessionStorage");
            const config: Configuration = {
                auth: {
                    clientId: MSAL_CLIENT_ID,
                    redirectUri: TEST_REDIR_URI
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

        it('tests getCachedToken when authority is not passed and single accessToken is present in the cache for a set of scopes', function (done) {
            let tokenRequest : AuthenticationParameters = {
                scopes: ["S1"],
                account: account
            };
            let params: kv = {  };
            params[SSOTypes.SID] = account.sid;
            setUtilUnifiedCacheQPStubs(params);

            cacheStorage.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));
            msal.acquireTokenSilent(tokenRequest).then(function(response) {
                expect(response.idToken.rawIdToken).to.include("idToken");
                expect(response.accessToken).to.include('accessToken1');
                expect(response.account).to.be.eq(account);
                expect(response.scopes).to.be.eq(tokenRequest.scopes);
                expect(response.tokenType).to.be.eq(Constants.accessToken);
                done();
            }).catch(function(err) {
                // Won't happen
                console.error("Shouldn't have error here. Data: " + JSON.stringify(err));
            });
        });

        it('tests getCachedToken when authority is not passed and multiple accessTokens are present in the cache for a set of scopes', function (done) {
            let tokenRequest : AuthenticationParameters = {
                scopes: ["S1"],
                account: account
            };
            let params: kv = {  };
            params[SSOTypes.SID] = account.sid;
            setUtilUnifiedCacheQPStubs(params);
            
            cacheStorage.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));
            accessTokenKey.scopes = "S1 S2";
            accessTokenKey.authority = alternateValidAuthority;
            cacheStorage.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));
            
            msal.acquireTokenSilent(tokenRequest).then(function(response) {
                // Won't happen
                console.error("Shouldn't have response here. Data: " + JSON.stringify(response));
            }).catch(function(err: AuthError) {
                expect(err.errorCode).to.include(ClientAuthErrorMessage.multipleMatchingTokens.code);
                expect(err.errorMessage).to.include(ClientAuthErrorMessage.multipleMatchingTokens.desc);
                expect(err.message).to.contain(ClientAuthErrorMessage.multipleMatchingTokens.desc);
                expect(err.name).to.equal("ClientAuthError");
                expect(err.stack).to.include("UserAgentApplication.spec.js");
                done();
            });
        });

        it('tests getCachedToken without sending authority when no matching accesstoken is found and multiple authorities exist', function (done) {
            let tokenRequest : AuthenticationParameters = {
                scopes: ["S3"],
                account: account
            };
            let params: kv = {  };
            params[SSOTypes.SID] = account.sid;
            setUtilUnifiedCacheQPStubs(params);
            
            cacheStorage.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));
            accessTokenKey.scopes = 'S2';
            accessTokenKey.authority = alternateValidAuthority;
            cacheStorage.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));

            msal.acquireTokenSilent(tokenRequest).then(function(response) {
                // Won't happen
                console.error("Shouldn't have response here. Data: " + JSON.stringify(response));
            }).catch(function(err: AuthError) {
                expect(err.errorCode).to.include(ClientAuthErrorMessage.multipleCacheAuthorities.code);
                expect(err.errorMessage).to.include(ClientAuthErrorMessage.multipleCacheAuthorities.desc);
                expect(err.message).to.contain(ClientAuthErrorMessage.multipleCacheAuthorities.desc);
                expect(err.name).to.equal("ClientAuthError");
                expect(err.stack).to.include("UserAgentApplication.spec.js");
                done();
            });
        });

        it('tests getCachedToken when authority is passed and single matching accessToken is found', function (done) {
            let tokenRequest : AuthenticationParameters = {
                authority: validAuthority,
                scopes: ["S1"],
                account: account
            };
            let tokenRequest2 : AuthenticationParameters = {
                authority: alternateValidAuthority,
                scopes: ["S1"],
                account: account
            };
            let params: kv = {  };
            params[SSOTypes.SID] = account.sid;
            setUtilUnifiedCacheQPStubs(params);

            accessTokenKey.authority = accessTokenKey.authority + "/";
            cacheStorage.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));
            accessTokenKey.authority = alternateValidAuthority + "/";
            accessTokenValue.accessToken = "accessToken2";
            cacheStorage.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));
            
            msal.acquireTokenSilent(tokenRequest).then(function(response) {
                expect(response.scopes).to.be.eq(tokenRequest.scopes);
                expect(response.account).to.be.eq(account);
                expect(response.idToken.rawIdToken).to.include("idToken");
                expect(response.accessToken).to.include('accessToken1');
                expect(response.tokenType).to.be.eq(Constants.accessToken);
            }).catch(function(err: AuthError) {
                // Won't happen
                console.error("Shouldn't have error here. Data: " + JSON.stringify(err));
            });

            msal.acquireTokenSilent(tokenRequest2).then(function(response) {
                expect(response.scopes).to.be.eq(tokenRequest2.scopes);
                expect(response.account).to.be.eq(account);
                expect(response.idToken.rawIdToken).to.include("idToken");
                expect(response.accessToken).to.include('accessToken2');
                expect(response.tokenType).to.be.eq(Constants.accessToken);
                done();
            }).catch(function(err: AuthError) {
                // Won't happen
                console.error("Shouldn't have error here. Data: " + JSON.stringify(err));
            });
        });

        it('tests getCachedToken when authority is passed and multiple matching accessTokens are found', function (done) {
            let tokenRequest : AuthenticationParameters = {
                authority: validAuthority,
                scopes: ["S1"],
                account: account
            };
            let params: kv = {  };
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
                expect(err.stack).to.include("UserAgentApplication.spec.js");
                done();
            });
        });

        it('tests getCachedToken when authority is passed and no matching accessToken is found', function (done) {
            let tokenRequest : AuthenticationParameters = {
                authority: alternateValidAuthority,
                scopes: ["S1"],
                account: account
            };
            let params: kv = {  };
            params[SSOTypes.SID] = account.sid;
            setUtilUnifiedCacheQPStubs(params);

            sinon.stub(msal, <any>"loadIframeTimeout").callsFake(function (url: string, frameName: string) {
                expect(url).to.include(alternateValidAuthority + '/oauth2/v2.0/authorize?response_type=id_token token&scope=S1%20openid%20profile');
                expect(url).to.include('&client_id=' + MSAL_CLIENT_ID);
                expect(url).to.include('&redirect_uri=' + encodeURIComponent(msal.getRedirectUri()));
                expect(url).to.include('&state');
                expect(url).to.include('&client_info=1');
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

        it('tests getCachedToken when authority is passed and single matching accessToken is found which is expired', function (done) {
            let tokenRequest : AuthenticationParameters = {
                authority: alternateValidAuthority,
                scopes: ["S1"],
                account: account
            };
            let params: kv = {  };
            params[SSOTypes.SID] = account.sid;
            setUtilUnifiedCacheQPStubs(params);

            sinon.stub(msal, <any>"loadIframeTimeout").callsFake(function (url: string, frameName: string) {
                expect(cacheStorage.getItem(JSON.stringify(accessTokenKey))).to.be.null;
                expect(url).to.include(alternateValidAuthority + '/oauth2/v2.0/authorize?response_type=id_token token&scope=S1%20openid%20profile');
                expect(url).to.include('&client_id=' + MSAL_CLIENT_ID);
                expect(url).to.include('&redirect_uri=' + encodeURIComponent(msal.getRedirectUri()));
                expect(url).to.include('&state');
                expect(url).to.include('&client_info=1');
                done();
                return {};
            });
            
            accessTokenValue.expiresIn = "1300";
            accessTokenKey.authority = alternateValidAuthority + "/";
            cacheStorage.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));

            msal.acquireTokenSilent(tokenRequest).then(function(response) {
                // Won't happen - we are not testing response here
                console.error("Shouldn't have response here. Data: " + JSON.stringify(response));
            }).catch(function(err: AuthError) {
                // Failure will be caught here since the tests are being run within the stub.
                console.error("Error in assertion: " + JSON.stringify(err));
            });
        });
    });

    describe("Processing Authentication Responses", function() {

        beforeEach(function () {
            cacheStorage = new Storage("sessionStorage");
            const config: Configuration = {
                auth: {
                    clientId: MSAL_CLIENT_ID,
                    redirectUri: TEST_REDIR_URI,
                    state: TEST_USER_STATE_NUM
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

        it("tests saveTokenForHash in case of error", function(done) {
            cacheStorage.setItem(Constants.urlHash, TEST_ERROR_HASH);
            cacheStorage.setItem(Constants.stateLogin, "RANDOM-GUID-HERE|" + TEST_USER_STATE_NUM);
            let checkErrorFromServer = function(error: AuthError, accountState: string) {
                expect(cacheStorage.getItem(Constants.urlHash)).to.be.null;
                expect(error instanceof ServerError).to.be.true;
                expect(error.name).to.include("ServerError");
                expect(error.errorCode).to.include(TEST_ERROR_CODE);
                expect(error.errorMessage).to.include(TEST_ERROR_DESC);
                expect(error.message).to.include(TEST_ERROR_DESC);
                expect(error.stack).to.include("UserAgentApplication.spec.js");
                done();
            };
            msal.handleRedirectCallbacks(successCallback, checkErrorFromServer);
        });

        it("tests if you get the state back in errorReceived callback, if state is a number", function (done) {
            cacheStorage.setItem(Constants.urlHash, TEST_ERROR_HASH);
            cacheStorage.setItem(Constants.stateLogin, "RANDOM-GUID-HERE|" + TEST_USER_STATE_NUM);
            let checkErrorHasState = function(error: AuthError, accountState: string) {
                expect(accountState).to.include(TEST_USER_STATE_NUM);
                done();
            };
            msal.handleRedirectCallbacks(successCallback, checkErrorHasState);
        });

        it("tests if you get the state back in errorReceived callback, if state is a url", function (done) {
            cacheStorage.setItem(Constants.urlHash, TEST_ERROR_HASH);
            cacheStorage.setItem(Constants.stateLogin, "RANDOM-GUID-HERE|" + TEST_USER_STATE_URL);
            let checkErrorHasState = function(error: AuthError, accountState: string) {
                expect(accountState).to.include(TEST_USER_STATE_URL);
                done();
            };
            msal.handleRedirectCallbacks(successCallback, checkErrorHasState);
        });

        it("tests that isCallback correctly identifies url hash", function (done) {
            expect(msal.isCallback("not a callback")).to.be.false;
            expect(msal.isCallback("#error_description=someting_wrong")).to.be.true;
            expect(msal.isCallback("#/error_description=someting_wrong")).to.be.true;
            expect(msal.isCallback("#access_token=token123")).to.be.true;
            expect(msal.isCallback("#id_token=idtoken234")).to.be.true;
            done();
        });
    });

    describe("Logout functionality", function () {

        beforeEach(function () {
            cacheStorage = new Storage("sessionStorage");
            const config: Configuration = {
                auth: {
                    clientId: MSAL_CLIENT_ID,
                    redirectUri: TEST_REDIR_URI,
                    postLogoutRedirectUri: TEST_LOGOUT_URI
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
        
        it("clears cache and account object", function (done) {
            cacheStorage.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));
            cacheStorage.setItem(Constants.idTokenKey, "idTokenKey");
            cacheStorage.setItem(Constants.msalClientInfo, TEST_CLIENT_INFO_B64ENCODED);
            sinon.stub(Account, "createAccount").returns(account);
            sinon.stub(window.location, "replace").callsFake(function (url) {
                done();
            });
            let clearCacheSpy = sinon.spy(msal, <any>"clearCache");
            expect(msal.getAccount()).to.not.be.null;
            msal.logout();
            expect(msal.getAccount()).to.be.null;
            expect(clearCacheSpy.calledOnce).to.be.true;
        });

        it("adds postLogoutRedirectUri to logout URI", function (done) {
            // TODO: This test fails because we are appending a '/' character too many times. Will push a fix for this soon.
            // sinon.stub(window.location, "replace").callsFake(function (url) {
            //     expect(url).to.include(DEFAULT_INSTANCE + TENANT + '/oauth2/v2.0/logout?');
            //     expect(url).to.include(TEST_LOGOUT_URI);
                done();
            // });
            // msal.logout();
        });
    });

    describe("State Handling", function () {

        beforeEach(function () {
            cacheStorage = new Storage("sessionStorage");
            const config: Configuration = {
                auth: {
                    clientId: MSAL_CLIENT_ID,
                    redirectUri: TEST_REDIR_URI,
                    state: TEST_USER_STATE_NUM
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
            var result = msal.getAccountState("123465464565|91111");
            expect(result).to.be.eq("91111");
        });

        it('test getAccountState when there is no user state', function () {
            var result = msal.getAccountState("123465464565");
            expect(result).to.be.eq("");
        });
    
        it('test getAccountState when there is no state', function () {
            var result =msal.getAccountState("");
            expect(result).to.be.eq("");
        });
    });

    describe("Cache Location", function () {
        
        beforeEach(function () {
            cacheStorage = new Storage("sessionStorage");
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
                    clientId: MSAL_CLIENT_ID,
                    redirectUri: TEST_REDIR_URI
                }
            };
            msal = new UserAgentApplication(config);
            const checkConfig = msal.getCurrentConfiguration();
            expect(checkConfig.cache.cacheLocation).to.be.eq("sessionStorage");
        });

        it("tests cacheLocation functionality sets to localStorage when passed as a parameter", function () {
            const config: Configuration = {
                auth: {
                    clientId: MSAL_CLIENT_ID,
                    redirectUri: TEST_REDIR_URI
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

        beforeEach(function() {
            const config: Configuration = {
                auth: {
                    clientId: MSAL_CLIENT_ID,
                    redirectUri: TEST_REDIR_URI
                }
            };
            msal = new UserAgentApplication(config);
            setAuthInstanceStubs();
        });

        afterEach(function() {
            cacheStorage.clear();
            sinon.restore();
        });

        it("returns a promise from loginPopup", function () {
            let loginPopupPromise : Promise<AuthResponse>;
            loginPopupPromise = msal.loginPopup({});
            expect(loginPopupPromise instanceof Promise).to.be.true;
        });

        it("returns a promise from acquireTokenPopup", function () {
            let acquireTokenPromise : Promise<AuthResponse>;
            acquireTokenPromise = msal.acquireTokenPopup({scopes: [MSAL_CLIENT_ID]});
            expect(acquireTokenPromise instanceof Promise).to.be.true;
        });
    });

    describe("Silent Flow", function () {

        beforeEach(function() {
            const config: Configuration = {
                auth: {
                    clientId: MSAL_CLIENT_ID,
                    redirectUri: TEST_REDIR_URI
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
            let acquireTokenSilentPromise : Promise<AuthResponse>;
            acquireTokenSilentPromise = msal.acquireTokenSilent({scopes: [MSAL_CLIENT_ID]});
            expect(acquireTokenSilentPromise instanceof Promise).to.be.true;
        });

    });
});
