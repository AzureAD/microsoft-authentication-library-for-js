import { expect } from "chai";
import { ServerRequestParameters } from "../src/ServerRequestParameters";
import { Authority } from "../src";
import { AuthorityFactory } from "../src/authority/AuthorityFactory";
import { UrlUtils } from "../src/utils/UrlUtils";
import { TEST_CONFIG, TEST_RESPONSE_TYPE, TEST_URIS } from "./TestConstants";
import sinon from "sinon";

describe("ServerRequestParameters.ts Class", function () {

    describe("Object creation", function () {

        it("Scope array pointer is not passed into constructor", function () {
            let scopes = ["S1"];
            let authority = AuthorityFactory.CreateInstance(TEST_CONFIG.validAuthority, false);
            sinon.stub(authority, "AuthorizationEndpoint").value(TEST_URIS.TEST_AUTH_ENDPT);
            let req = new ServerRequestParameters(
                authority,
                TEST_CONFIG.MSAL_CLIENT_ID,
                scopes,
                TEST_RESPONSE_TYPE.token,
                TEST_URIS.TEST_REDIR_URI,
                TEST_CONFIG.STATE
            );
            expect(req.scopes).to.not.be.equal(scopes);
            expect(req.scopes.length).to.be.eql(1);
            expect(scopes.length).to.be.eql(1);
        });

        it("Scopes are set to client id if null or empty scopes object passed", function () {
            let authority = AuthorityFactory.CreateInstance(TEST_CONFIG.validAuthority, false);
            sinon.stub(authority, "AuthorizationEndpoint").value(TEST_URIS.TEST_AUTH_ENDPT);
            let req = new ServerRequestParameters(
                authority,
                TEST_CONFIG.MSAL_CLIENT_ID,
                null,
                TEST_RESPONSE_TYPE.token,
                TEST_URIS.TEST_REDIR_URI,
                TEST_CONFIG.STATE
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
            authenticationRequestParameters = new ServerRequestParameters(authority, "0813e1d1-ad72-46a9-8665-399bba48c201", ["user.read"], "id_token", "", "12345");
            var result;
            result = UrlUtils.createNavigationUrlString(authenticationRequestParameters);
            expect(decodeURIComponent(result[4])).to.include("12345");
        });

        it('test if authenticateRequestParameter generates state correctly, if state is a url', function () {
            let authenticationRequestParameters: ServerRequestParameters;
            let authority: Authority;
            authority = AuthorityFactory.CreateInstance("https://login.microsoftonline.com/common/", this.validateAuthority);
            authenticationRequestParameters = new ServerRequestParameters(authority, "0813e1d1-ad72-46a9-8665-399bba48c201", ["user.read"], "id_token", "", "https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-implicit-grant-flow?name=value&name2=value2");
            var result;
            result = UrlUtils.createNavigationUrlString(authenticationRequestParameters);
            expect(decodeURIComponent(result[4])).to.include("https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-implicit-grant-flow?name=value&name2=value2");
        });
    });
});
