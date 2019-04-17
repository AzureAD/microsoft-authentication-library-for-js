import * as Mocha from "mocha";
import { expect } from "chai";
import { 
    UserAgentApplication,
    Constants,
    AuthenticationParameters,
    Account,
    Configuration,
    buildConfiguration,
    AuthError,
    ClientAuthError,
    ClientConfigurationError
} from '../src/index';
import sinon from "sinon";
import { ITenantDiscoveryResponse } from "../src/ITenantDiscoveryResponse";
import { Storage } from "../src/Storage";
import { AccessTokenKey } from "../src/AccessTokenKey";
import { AccessTokenValue } from "../src/AccessTokenValue";
import { Utils } from "../src/Utils";
import { SSOTypes } from "../src/Constants";
import { ClientAuthErrorMessage } from "../src/error/ClientAuthError";

type kv = {
    [key: string]: string;   
}

describe("UserAgentApplication", function () {

    const DEFAULT_INSTANCE = "https://login.microsoftonline.com/";
    const ALTERNATE_INSTANCE = "https://login.windows.net/"
    const TEST_REDIR_URI = "https://localhost:8081/redirect.html";
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
        sinon.stub(msal.getAuthorityInstance(), "resolveEndpointsAsync").callsFake(function () {
            return new Promise((resolve, reject) => {
                resolve(msal.getAuthorityInstance());
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
    }

    describe("Redirect Flow Unit Tests", function () {
        beforeEach(function() {
            // Necessary for login redirect
            const configParams: Configuration = {
                auth: {
                    clientId: MSAL_CLIENT_ID,
                    redirectUri: TEST_REDIR_URI
                }
            };
            let config = buildConfiguration(configParams);
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

        it('navigates user to redirectURI passed in request', (done) => {
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
            const configParams: Configuration = {
                auth: {
                    clientId: MSAL_CLIENT_ID
                }
            };
            let config = buildConfiguration(configParams);
            msal = new UserAgentApplication(config);
            history.pushState(null, null, '/new_pushstate_uri');
            sinon.stub(window.location, "replace").callsFake(function (url) {
                expect(url).to.include('&redirect_uri=' + encodeURIComponent('http://localhost:8080/new_pushstate_uri'));
                done();
            });
            msal.handleRedirectCallbacks(successCallback, errCallback);
            msal.loginRedirect({});
        });

    });

    describe("Cache Storage Unit Tests", function () {
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

        beforeEach(function () {
            cacheStorage = new Storage("sessionStorage");
            const configParams: Configuration = {
                auth: {
                    clientId: MSAL_CLIENT_ID,
                    redirectUri: TEST_REDIR_URI
                }
            };
            let config = buildConfiguration(configParams);
            msal = new UserAgentApplication(config);setAuthInstanceStubs();
            setTestCacheItems();
        });

        afterEach(function() {
            cacheStorage.clear();
            sinon.restore();
        });

        it('tests getCachedToken when authority is not passed and single accessToken is present in the cache for a set of scopes', function () {
            var tokenRequest : AuthenticationParameters = {
                scopes: ["S1"],
                account: account
            };
            let params: kv = {  };
            params[SSOTypes.SID] = account.sid;
            setUtilUnifiedCacheQPStubs(params);

            cacheStorage.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));
            msal.acquireTokenSilent(tokenRequest).then(function(response) {
                expect(response.accessToken).to.include('accessToken1');
            }).catch(function(err) {
                // Won't happen
                console.error("Shouldn't have error here. Data: " + JSON.stringify(err));
            });
        });

        it('tests getCachedToken when authority is not passed and multiple accessTokens are present in the cache for a set of scopes', function () {
            var tokenRequest : AuthenticationParameters = {
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
            });
        });

        it('tests getCachedToken without sending authority when no matching accesstoken is found and multiple authorities exist', function () {
            var tokenRequest : AuthenticationParameters = {
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
            });
        });

        it('tests getCachedToken when authority is passed and no matching accessToken is found', function (done) {
            var tokenRequest : AuthenticationParameters = {
                authority: alternateValidAuthority,
                scopes: ["S1"],
                account: account
            };
            let params: kv = {  };
            params[SSOTypes.SID] = account.sid;
            setUtilUnifiedCacheQPStubs(params);

            sinon.stub(msal, <any>"loadFrame").callsFake(function (url: string, frameName: string) {
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

        it('tests getCachedToken when authority is passed and single matching accessToken is found', function () {
            var tokenRequest : AuthenticationParameters = {
                authority: validAuthority,
                scopes: ["S1"],
                account: account
            };
            let params: kv = {  };
            params[SSOTypes.SID] = account.sid;
            setUtilUnifiedCacheQPStubs(params);
            
            cacheStorage.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));
            accessTokenKey.authority = alternateValidAuthority;
            accessTokenValue.accessToken = "accessToken2";
            cacheStorage.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));
            
            msal.acquireTokenSilent(tokenRequest).then(function(response) {
                expect(response.scopes).to.include("S1");
                expect(response.idToken.rawIdToken).to.include("idToken");
                expect(response.accessToken).to.include('accessToken2');
            }).catch(function(err: AuthError) {
                // Won't happen
                console.error("Shouldn't have error here. Data: " + JSON.stringify(err));
            });
        });

        it('tests getCachedToken when authority is passed and multiple matching accessTokens are found', function () {
            var tokenRequest : AuthenticationParameters = {
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
            });
        });
    });
});
