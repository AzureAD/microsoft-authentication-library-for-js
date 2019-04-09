import * as Mocha from "mocha";
import * as chai from "chai";
import { UserAgentApplication, ClientConfigurationError, Constants, AuthenticationParameters } from '../../src/index';
import { buildConfiguration } from "../../src/Configuration";
import sinon from "sinon";
import { ITenantDiscoveryResponse } from "../../src/ITenantDiscoveryResponse";
const expect = chai.expect;
chai.config.includeStack = false;

describe("Redirect Flow Unit Tests", function () {
    let msal: UserAgentApplication;

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

    let successCallback = function(response) {
        console.log("Response: " + response);
    };

    let errCallback = function (error, state) {
        console.log("Error: " + error);
        console.log("State: " + state);
    };

    beforeEach(function() {
        // Necessary for login redirect
        let config = buildConfiguration({ clientId: MSAL_CLIENT_ID, redirectUri: TEST_REDIR_URI }, {}, {}, {});
        msal = new UserAgentApplication(config);
        sinon.stub(msal.getAuthorityInstance(), "resolveEndpointsAsync").callsFake(function () {
            return new Promise((resolve, reject) => {
                resolve(msal.getAuthorityInstance());
            });
        });
        sinon.stub(msal.getAuthorityInstance(), "AuthorizationEndpoint").value(validOpenIdConfigurationResponse.AuthorizationEndpoint);
        sinon.stub(msal.getAuthorityInstance(), "EndSessionEndpoint").value(validOpenIdConfigurationResponse.EndSessionEndpoint);
        sinon.stub(msal.getAuthorityInstance(), "SelfSignedJwtAudience").value(validOpenIdConfigurationResponse.Issuer);
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

    it('navigates user to login and prompt parameter is not passed by default', async () => {
        sinon.stub(window.location, "replace").callsFake(function (url) {
            expect(url).to.include(DEFAULT_INSTANCE + TENANT + '/oauth2/v2.0/authorize?response_type=id_token&scope=openid%20profile');
            expect(url).to.include('&client_id=' + MSAL_CLIENT_ID);
            expect(url).to.include('&redirect_uri=' + encodeURIComponent(msal.getRedirectUri()));
            expect(url).to.include('&state');
            expect(url).to.include('&client_info=1');
            expect(url).not.to.include(Constants.prompt_select_account);
            expect(url).not.to.include(Constants.prompt_none);
        });
        msal.handleRedirectCallbacks(successCallback, errCallback);
        expect(msal.getRedirectUri()).to.be.equal(TEST_REDIR_URI);
        await msal.loginRedirect({});
    });

    it('navigates user to login and prompt=select_account parameter is passed in request', async () => {
        sinon.stub(window.location, "replace").callsFake(function (url) {
            expect(url).to.include(DEFAULT_INSTANCE + TENANT + '/oauth2/v2.0/authorize?response_type=id_token&scope=openid%20profile');
            expect(url).to.include('&client_id=' + MSAL_CLIENT_ID);
            expect(url).to.include('&redirect_uri=' + encodeURIComponent(msal.getRedirectUri()));
            expect(url).to.include('&state');
            expect(url).to.include('&client_info=1');
            expect(url).to.include(Constants.prompt_select_account);
            expect(url).not.to.include(Constants.prompt_none);
        });
        msal.handleRedirectCallbacks(successCallback, errCallback);
        expect(msal.getRedirectUri()).to.be.equal(TEST_REDIR_URI);

        let request: AuthenticationParameters = { prompt: "select_account" };
        await msal.loginRedirect(request);
    });

    it('navigates user to login and prompt=none parameter is passed in request', async () => {
        sinon.stub(window.location, "replace").callsFake(function (url) {
            expect(url).to.include(DEFAULT_INSTANCE + TENANT + '/oauth2/v2.0/authorize?response_type=id_token&scope=openid%20profile');
            expect(url).to.include('&client_id=' + MSAL_CLIENT_ID);
            expect(url).to.include('&redirect_uri=' + encodeURIComponent(msal.getRedirectUri()));
            expect(url).to.include('&state');
            expect(url).to.include('&client_info=1');
            expect(url).not.to.include(Constants.prompt_select_account);
            expect(url).to.include(Constants.prompt_none);
        });
        msal.handleRedirectCallbacks(successCallback, errCallback);
        expect(msal.getRedirectUri()).to.be.equal(TEST_REDIR_URI);

        let request: AuthenticationParameters = { prompt: "none" };
        await msal.loginRedirect(request);
    });

    // it('navigates user to redirectURI passed as extraQueryParameter', (done) => {
    //     msal = new UserAgentApplication("0813e1d1-ad72-46a9-8665-399bba48c201", null, { redirectUri: TEST_REDIR_URI });
    //     msal.setRedirectCallbacks(function(token, tokenType, state) {}, function (error) {});
    //     msal._user = null;
    //     msal._renewStates = [];
    //     msal._activeRenewals = {};
    //     msal._cacheStorage = storageFake;
    //     expect(msal._redirectUri).toBe(TEST_REDIR_URI);
    //     msal.promptUser = function (args: string) {
    //         expect(args).toContain(DEFAULT_INSTANCE + TENANT + '/oauth2/v2.0/authorize?response_type=id_token&scope=openid%20profile');
    //         expect(args).toContain('&client_id=' + msal.clientId);
    //         expect(args).toContain('&redirect_uri=' + encodeURIComponent(msal._redirectUri));
    //         expect(args).toContain('&state');
    //         expect(args).toContain('&client_info=1');
    //         done();
    //     };

    //     msal.loginRedirect();
    // });

    // it('uses current location.href as returnUri by default, even if location changed after UserAgentApplication was instantiated', (done) => {
    //     history.pushState(null, null, '/new_pushstate_uri');
    //     msal.setRedirectCallbacks(function(token, tokenType, state) {}, function (error) {});
    //     msal.promptUser = function (args: string) {
    //         expect(args).toContain('&redirect_uri=' + encodeURIComponent('http://localhost:8080/new_pushstate_uri'));
    //         done();
    //     };
    //     msal.loginRedirect();
    // });

});