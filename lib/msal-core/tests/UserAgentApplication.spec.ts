import * as Mocha from "mocha";
import * as chai from "chai";
import { UserAgentApplication, ClientConfigurationError, Constants, AuthenticationParameters } from '../src/index';
import { buildConfiguration } from "../src/Configuration";
import sinon from "sinon";
import { ITenantDiscoveryResponse } from "../src/ITenantDiscoveryResponse";
const expect = chai.expect;
chai.config.includeStack = false;

describe("UserAgentApplication", function () {

    const DEFAULT_INSTANCE = "https://login.microsoftonline.com/";
    const TEST_REDIR_URI = "https://localhost:8081/redirect.html"
    const TENANT = 'common';
    const MSAL_CLIENT_ID = "0813e1d1-ad72-46a9-8665-399bba48c201";
    const validAuthority = DEFAULT_INSTANCE + TENANT;
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
    };

    describe("Redirect Flow Unit Tests", function () {
        beforeEach(function() {
            // Necessary for login redirect
            let config = buildConfiguration({ clientId: MSAL_CLIENT_ID, redirectUri: TEST_REDIR_URI }, {}, {}, {});
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
            let config = buildConfiguration({ clientId: MSAL_CLIENT_ID }, {}, {}, {});
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
        it('tests getCachedToken when authority is not passed and single accessToken is present in the cache for a set of scopes', function () {
            // var accessTokenKey = {
            //     authority: validAuthority,
            //     clientId: "0813e1d1-ad72-46a9-8665-399bba48c201",
            //     scopes: "S1",
            //     userIdentifer: "1234"
            // }
            // var accessTokenValue = {
            //     accessToken: "accessToken",
            //     idToken: "idToken",
            //     expiresIn: "150000000000000",
            //     clientInfo: ""
            // }
            // storageFake.setItem(JSON.stringify(accessTokenKey), JSON.stringify(accessTokenValue));
            // var user = { userIdentifier: "1234" };
            // let cacheResult = msal.getCachedToken({ scopes: ['S1'] }, user);
            // expect(cacheResult.token).toBe('accessToken');
            // expect(cacheResult.errorDesc).toBe(null);
            // expect(cacheResult.error).toBe(null);
            // storageFake.clear();
            console.log("Storage: " + window["sessionStorage"]);
        });
    });

});
