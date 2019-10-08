import { expect } from "chai";
import { ServerRequestParameters } from "../src/ServerRequestParameters";
import { Authority, AuthenticationParameters } from "../src";
import { AuthorityFactory } from "../src/authority/AuthorityFactory";
import { UrlUtils } from "../src/utils/UrlUtils";
import { TEST_CONFIG, TEST_RESPONSE_TYPE, TEST_URIS } from "./TestConstants";
import sinon from "sinon";

describe("ServerRequestParameters.ts Class", function () {

    describe("Object creation", function () {

        it("Scope array pointer is not passed into constructor", function () {
            let testScopes = ["S1"];
            let authority = AuthorityFactory.CreateInstance(TEST_CONFIG.validAuthority, false);
            sinon.stub(authority, "AuthorizationEndpoint").value(TEST_URIS.TEST_AUTH_ENDPT);
            let reqParams: AuthenticationParameters = {
                scopes: testScopes,
                state: TEST_CONFIG.STATE
            };
            let req = new ServerRequestParameters(
                authority,
                TEST_CONFIG.MSAL_CLIENT_ID,
                reqParams,
                null,
                TEST_URIS.TEST_REDIR_URI,
                false,
                "noInteraction"
            );
            expect(req.scopes.asArray()).to.not.be.equal(testScopes);
            expect(req.scopes.getScopeCount()).to.be.eql(1);
            expect(testScopes.length).to.be.eql(1);
        });

        it("Scopes are set to client id if null or empty scopes object passed", function () {
            let authority = AuthorityFactory.CreateInstance(TEST_CONFIG.validAuthority, false);
            sinon.stub(authority, "AuthorizationEndpoint").value(TEST_URIS.TEST_AUTH_ENDPT);
            let reqParams: AuthenticationParameters = {
                state: TEST_CONFIG.STATE
            };
            let req = new ServerRequestParameters(
                authority,
                TEST_CONFIG.MSAL_CLIENT_ID,
                reqParams,
                null,
                TEST_URIS.TEST_REDIR_URI,
                true,
                "redirectInteraction"
            );
            expect(req.scopes).to.be.eql([TEST_CONFIG.MSAL_CLIENT_ID]);
            expect(req.scopes.getScopeCount()).to.be.eql(1);
        });

    });

    describe("State Generation", function () {

        it("tests if if authenticateRequestParameter generates state correctly, if state is a number", function () {
            let serverRequestParameters: ServerRequestParameters;
            let authority: Authority;
            authority = AuthorityFactory.CreateInstance("https://login.microsoftonline.com/common/", this.validateAuthority);
            let req: AuthenticationParameters = {
                scopes: ["user.read"],
                state: "12345"
            };
            serverRequestParameters = new ServerRequestParameters(
                authority, 
                "0813e1d1-ad72-46a9-8665-399bba48c201", 
                req,
                null, 
                TEST_URIS.TEST_REDIR_URI,
                false,
                "redirectInteraction"
            );
            var result;
            result = serverRequestParameters.createNavigationUrlString();
            expect(decodeURIComponent(result[4])).to.include("12345");
        });

        it('test if authenticateRequestParameter generates state correctly, if state is a url', function () {
            let serverRequestParameters: ServerRequestParameters;
            let authority: Authority;
            authority = AuthorityFactory.CreateInstance("https://login.microsoftonline.com/common/", this.validateAuthority);
            let req: AuthenticationParameters = {
                scopes: ["user.read"],
                state: "https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-implicit-grant-flow?name=value&name2=value2"
            };
            serverRequestParameters = new ServerRequestParameters(
                authority, 
                "0813e1d1-ad72-46a9-8665-399bba48c201", 
                req,
                null, 
                TEST_URIS.TEST_REDIR_URI, 
                false,
                "redirectInteraction"
            );
            var result;
            result = serverRequestParameters.createNavigationUrlString();
            expect(decodeURIComponent(result[4])).to.include("https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-implicit-grant-flow?name=value&name2=value2");
        });
    });
});
