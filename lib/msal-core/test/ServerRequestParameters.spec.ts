import { expect } from "chai";
import { ServerRequestParameters } from "../src/ServerRequestParameters";
import { Authority } from "../src";
import { AuthorityFactory } from "../src/AuthorityFactory";

describe("ServerRequestParameters.ts Class", function () {

    describe("State Generation", function () {

        it("tests if if authenticateRequestParameter generates state correctly, if state is a number", function () {
            let authenticationRequestParameters: ServerRequestParameters;
            let authority: Authority;
            authority = AuthorityFactory.CreateInstance("https://login.microsoftonline.com/common/", this.validateAuthority);
            authenticationRequestParameters = new ServerRequestParameters(authority, "0813e1d1-ad72-46a9-8665-399bba48c201", ["user.read"], "id_token", "", "12345");
            var result;
            result = authenticationRequestParameters.createNavigationUrlString(["user.read"]);
            expect(decodeURIComponent(result[4])).to.include("12345");
        });

        it('test if authenticateRequestParameter generates state correctly, if state is a url', function () {
            let authenticationRequestParameters: ServerRequestParameters;
            let authority: Authority;
            authority = AuthorityFactory.CreateInstance("https://login.microsoftonline.com/common/", this.validateAuthority);
            authenticationRequestParameters = new ServerRequestParameters(authority, "0813e1d1-ad72-46a9-8665-399bba48c201", ["user.read"], "id_token", "", "https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-implicit-grant-flow?name=value&name2=value2");
            var result;
            result = authenticationRequestParameters.createNavigationUrlString(["user.read"]);
            expect(decodeURIComponent(result[4])).to.include("https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-implicit-grant-flow?name=value&name2=value2");
        });
    });
});
