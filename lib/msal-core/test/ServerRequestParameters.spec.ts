import { expect } from "chai";
import { ServerRequestParameters } from "../src/ServerRequestParameters";
import { Authority, ClientConfigurationError } from "../src";
import { AuthorityFactory } from "../src/authority/AuthorityFactory";
import { UrlUtils } from "../src/utils/UrlUtils";
import { TEST_CONFIG, TEST_RESPONSE_TYPE, TEST_URIS } from "./TestConstants";
import { ClientConfigurationErrorMessage } from "../src/error/ClientConfigurationError";
import { AuthenticationParameters } from "../src/AuthenticationParameters";
import { RequestUtils } from "../src/utils/RequestUtils";
import sinon from "sinon";

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

        it("Scopes are set to client id if null or empty scopes object passed", function () {
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
            expect(req.scopes).to.be.eql([TEST_CONFIG.MSAL_CLIENT_ID]);
            expect(req.scopes.length).to.be.eql(1);
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
});
