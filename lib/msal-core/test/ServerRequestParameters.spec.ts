import { expect } from "chai";
import { ServerRequestParameters } from "../src/ServerRequestParameters";
import { Authority, ClientConfigurationError, Account } from "../src";
import { AuthorityFactory } from "../src/authority/AuthorityFactory";
import { UrlUtils } from "../src/utils/UrlUtils";
import { TEST_CONFIG, TEST_RESPONSE_TYPE, TEST_URIS, TEST_TOKENS, TEST_DATA_CLIENT_INFO } from "./TestConstants";
import { Constants } from "../src/utils/Constants";
import { ClientConfigurationErrorMessage } from "../src/error/ClientConfigurationError";
import { AuthenticationParameters } from "../src/AuthenticationParameters";
import { RequestUtils } from "../src/utils/RequestUtils";
import sinon from "sinon";
import { IdToken } from "../src/IdToken";
import { ClientInfo } from "../src/ClientInfo";
import { version } from "../src/packageMetadata";

describe("ServerRequestParameters.ts Class", function () {

    describe("Object creation", function () {

        it("Scope array pointer is not passed into constructor", function () {
            const scopes = ["S1"];
            const authority = AuthorityFactory.CreateInstance(TEST_CONFIG.validAuthority, false);
            sinon.stub(authority, "AuthorizationEndpoint").value(TEST_URIS.TEST_AUTH_ENDPT);
            const req = new ServerRequestParameters(
                authority,
                TEST_CONFIG.MSAL_CLIENT_ID,
                TEST_RESPONSE_TYPE.token,
                TEST_URIS.TEST_REDIR_URI,
                scopes,
                TEST_CONFIG.STATE,
                TEST_CONFIG.CorrelationId
            );
            expect(req.scopes).to.not.be.equal(scopes);
            expect(req.scopes.length).to.be.eql(1);
            expect(scopes.length).to.be.eql(1);
        });

        it("Scopes are set to OIDC scopes if null or empty scopes object passed", function () {
            const authority = AuthorityFactory.CreateInstance(TEST_CONFIG.validAuthority, false);
            sinon.stub(authority, "AuthorizationEndpoint").value(TEST_URIS.TEST_AUTH_ENDPT);
            const req = new ServerRequestParameters(
                authority,
                TEST_CONFIG.MSAL_CLIENT_ID,
                TEST_RESPONSE_TYPE.token,
                TEST_URIS.TEST_REDIR_URI,
                null,
                TEST_CONFIG.STATE,
                TEST_CONFIG.CorrelationId
            );
            expect(req.scopes).to.be.eql(Constants.oidcScopes);
            expect(req.scopes.length).to.be.eql(2);
        });

        it("SKU and Version are set", function () {
            const req = new ServerRequestParameters(
                null,
                TEST_CONFIG.MSAL_CLIENT_ID,
                TEST_RESPONSE_TYPE.token,
                TEST_URIS.TEST_REDIR_URI,
                null,
                TEST_CONFIG.STATE,
                TEST_CONFIG.CorrelationId
            );
            expect(req.xClientSku).to.eq("MSAL.JS");
            expect(req.xClientVer).to.eq(version);
        });

    });

    describe("State Generation", function () {

        it("tests if if authenticateRequestParameter generates state correctly, if state is a number", function () {
            let authenticationRequestParameters: ServerRequestParameters;
            let authority: Authority;
            authority = AuthorityFactory.CreateInstance("https://login.microsoftonline.com/common/", this.validateAuthority);
            const scopes = ["user.read"];
            authenticationRequestParameters = new ServerRequestParameters(
                authority,
                TEST_CONFIG.MSAL_CLIENT_ID,
                TEST_RESPONSE_TYPE.id_token,
                "",
                scopes,
                TEST_CONFIG.STATE,
                TEST_CONFIG.CorrelationId);
            const result = UrlUtils.createNavigationUrlString(authenticationRequestParameters);
            expect(decodeURIComponent(result[4])).to.include(TEST_CONFIG.STATE);
        });

        it('test if authenticateRequestParameter generates state correctly, if state is a url', function () {
            let authenticationRequestParameters: ServerRequestParameters;
            let authority: Authority;
            authority = AuthorityFactory.CreateInstance("https://login.microsoftonline.com/common/", this.validateAuthority);

            const scopes = ["user.read"];
            const state = "https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-implicit-grant-flow?name=value&name2=value2";
            authenticationRequestParameters = new ServerRequestParameters(
                authority,
                TEST_CONFIG.MSAL_CLIENT_ID,
                TEST_RESPONSE_TYPE.id_token,
                "",
                scopes,
                state,
                TEST_CONFIG.CorrelationId);
            const result = UrlUtils.createNavigationUrlString(authenticationRequestParameters);
            expect(decodeURIComponent(result[4])).to.include("https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-implicit-grant-flow?name=value&name2=value2");
        });
    });

    describe("CorrelationId Tests", function () {

        it("tests correlation Id passed by the user is set correctly", function () {
            let authenticationRequestParameters: ServerRequestParameters;
            let authority: Authority;
            authority = AuthorityFactory.CreateInstance("https://login.microsoftonline.com/common/", this.validateAuthority);

            const scopes = ["user.read"];
            authenticationRequestParameters = new ServerRequestParameters(
                authority,
                TEST_CONFIG.MSAL_CLIENT_ID,
                TEST_RESPONSE_TYPE.id_token,
                "",
                scopes,
                TEST_CONFIG.STATE,
                TEST_CONFIG.CorrelationId);
            const result = UrlUtils.createNavigationUrlString(authenticationRequestParameters);
            expect(decodeURIComponent(result[result.length-1])).to.include(TEST_CONFIG.CorrelationId);
        });

        it("tests correlation Id passed by the user is validated correctly", function () {
            let err:ClientConfigurationError;
            try {
                let authenticationRequestParameters: ServerRequestParameters;
                let authority: Authority;
                authority = AuthorityFactory.CreateInstance("https://login.microsoftonline.com/common/", this.validateAuthority);

                const scopes = ["user.read"];
                const request: AuthenticationParameters = { correlationId: "Hello"};
                RequestUtils.validateAndGenerateCorrelationId(request.correlationId);
            }
            catch (e) {
                expect(e).to.be.instanceOf(ClientConfigurationError);
                err = e;
            }

            expect(err.errorCode).to.equal(ClientConfigurationErrorMessage.invalidCorrelationIdError.code);
            expect(err.errorMessage).to.include(ClientConfigurationErrorMessage.invalidCorrelationIdError.desc);
        });
    });

    describe("generateQueryParametersString", function () {

        it("test hints populated using queryParameters", function () {
            const eQParams = {domain_hint: "MyDomain.com", locale: "en-us"};
            const extraQueryParameters = ServerRequestParameters.generateQueryParametersString(eQParams);
            expect(extraQueryParameters).to.include("domain_hint");
            expect(extraQueryParameters).to.include("locale");
        });

        it("test hints populated using queryParameters", function () {
            const eQParams = { domain_hint: "MyDomain.com", locale: "en-us" };
            const extraQueryParameters = ServerRequestParameters.generateQueryParametersString(eQParams, true);
            expect(extraQueryParameters).to.not.include("domain_hint");
            expect(extraQueryParameters).to.include("locale");
        });

        it("properly handles null", () => {
            const extraQueryParamaters = ServerRequestParameters.generateQueryParametersString(null);
            expect(extraQueryParamaters).to.be.null;
        });

    });

    describe("populateQueryParams", () => {
        const idToken: IdToken = new IdToken(TEST_TOKENS.IDTOKEN_V2);
        const clientInfo: ClientInfo = new ClientInfo(TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO, TEST_CONFIG.validAuthority);

        it("populates parameters", () => {
            const serverRequestParameters = new ServerRequestParameters(AuthorityFactory.CreateInstance("https://login.microsoftonline.com/common/", true), "client-id", "toke", "redirect-uri", [ "user.read" ], "state", "correlationid");

            serverRequestParameters.populateQueryParams(Account.createAccount(idToken, clientInfo), {
                scopes: [ "user.read" ],
                extraQueryParameters: {
                    key: "value"
                }
            });

            expect(serverRequestParameters.queryParameters).to.equal("login_hint=AbeLi%40microsoft.com");
            expect(serverRequestParameters.extraQueryParameters).to.equal("key=value");
        });

        it("populates parameters (null request)", () => {
            const serverRequestParameters = new ServerRequestParameters(AuthorityFactory.CreateInstance("https://login.microsoftonline.com/common/", true), "client-id", "toke", "redirect-uri", [ "user.read" ], "state", "correlationid");

            serverRequestParameters.populateQueryParams(Account.createAccount(idToken, clientInfo), null);

            expect(serverRequestParameters.queryParameters).to.equal("login_hint=AbeLi%40microsoft.com");
            expect(serverRequestParameters.extraQueryParameters).to.equal(null);
        });
    });
});
