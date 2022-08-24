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
            expect(req.scopes).not.toBe(scopes);
            expect(req.scopes.length).toEqual(1);
            expect(scopes.length).toEqual(1);
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
            expect(req.scopes).toEqual(Constants.oidcScopes);
            expect(req.scopes.length).toEqual(2);
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
            expect(req.xClientSku).toBe("MSAL.JS");
            expect(req.xClientVer).toBe(version);
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
            expect(decodeURIComponent(result[4])).toContain(TEST_CONFIG.STATE);
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
            expect(decodeURIComponent(result[4])).toContain(
                "https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-implicit-grant-flow?name=value&name2=value2"
            );
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
            expect(decodeURIComponent(result[result.length-1])).toContain(TEST_CONFIG.CorrelationId);
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
                expect(e).toBeInstanceOf(ClientConfigurationError);
                err = e;
            }

            expect(err.errorCode).toBe(ClientConfigurationErrorMessage.invalidCorrelationIdError.code);
            expect(err.errorMessage).toContain(ClientConfigurationErrorMessage.invalidCorrelationIdError.desc
            );
        });
    });

    describe("generateQueryParametersString", function () {

        it("test hints populated using queryParameters", function () {
            const eQParams = {domain_hint: "MyDomain.com", locale: "en-us"};
            const extraQueryParameters = ServerRequestParameters.generateQueryParametersString(eQParams);
            expect(extraQueryParameters).toContain("domain_hint");
            expect(extraQueryParameters).toContain("locale");
        });

        it("test hints populated using queryParameters", function () {
            const eQParams = { domain_hint: "MyDomain.com", locale: "en-us" };
            const extraQueryParameters = ServerRequestParameters.generateQueryParametersString(eQParams, true);
            expect(extraQueryParameters).not.toContain("domain_hint");
            expect(extraQueryParameters).toContain("locale");
        });

        it("properly handles null", () => {
            const extraQueryParamaters = ServerRequestParameters.generateQueryParametersString(null);
            expect(extraQueryParamaters).toBeNull();
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

            expect(serverRequestParameters.queryParameters).toBe("login_hint=AbeLi%40microsoft.com");
            expect(serverRequestParameters.extraQueryParameters).toBe("key=value");
        });

        it("populates parameters (null request)", () => {
            const serverRequestParameters = new ServerRequestParameters(AuthorityFactory.CreateInstance("https://login.microsoftonline.com/common/", true), "client-id", "toke", "redirect-uri", [ "user.read" ], "state", "correlationid");

            serverRequestParameters.populateQueryParams(Account.createAccount(idToken, clientInfo), null);

            expect(serverRequestParameters.queryParameters).toBe("login_hint=AbeLi%40microsoft.com");
            expect(serverRequestParameters.extraQueryParameters).toBe(null);
        });

        it("populates login_hint claim if available (on request)", () => {
            const serverRequestParameters = new ServerRequestParameters(AuthorityFactory.CreateInstance("https://login.microsoftonline.com/common/", true), "client-id", "toke", "redirect-uri", [ "user.read" ], "state", "correlationid");

            serverRequestParameters.populateQueryParams(Account.createAccount(idToken, clientInfo), {
                // @ts-ignore
                account: {
                    idTokenClaims: {
                        login_hint: "opaque-login-hint"
                    }
                }
            });

            expect(serverRequestParameters.queryParameters).toBe("login_hint=opaque-login-hint");
            expect(serverRequestParameters.extraQueryParameters).toBe(null);
        });

        it("populates login_hint claim if available (on account)", () => {
            const serverRequestParameters = new ServerRequestParameters(AuthorityFactory.CreateInstance("https://login.microsoftonline.com/common/", true), "client-id", "toke", "redirect-uri", [ "user.read" ], "state", "correlationid");

            const account = Account.createAccount(idToken, clientInfo);

            serverRequestParameters.populateQueryParams({
                ...account,
                idTokenClaims: {
                    ...account.idTokenClaims,
                    login_hint: "opaque-login-hint"
                }
            }, null);

            expect(serverRequestParameters.queryParameters).toBe("login_hint=opaque-login-hint");
            expect(serverRequestParameters.extraQueryParameters).toBe(null);
        });

        it("populates sid claim if available (on request)", () => {
            const serverRequestParameters = new ServerRequestParameters(AuthorityFactory.CreateInstance("https://login.microsoftonline.com/common/", true), "client-id", "toke", "redirect-uri", [ "user.read" ], "state", "correlationid");

            serverRequestParameters.populateQueryParams(Account.createAccount(idToken, clientInfo), {
                sid: "session-id"
            });

            expect(serverRequestParameters.queryParameters).toBe("sid=session-id");
            expect(serverRequestParameters.extraQueryParameters).toBe(null);
        });

        it("populates sid claim if available (on request account)", () => {
            const serverRequestParameters = new ServerRequestParameters(AuthorityFactory.CreateInstance("https://login.microsoftonline.com/common/", true), "client-id", "toke", "redirect-uri", [ "user.read" ], "state", "correlationid");

            serverRequestParameters.populateQueryParams(Account.createAccount(idToken, clientInfo), {
                // @ts-ignore
                account: {
                    idTokenClaims: {},
                    sid: "session-id"
                }
            });

            expect(serverRequestParameters.queryParameters).toBe("sid=session-id");
            expect(serverRequestParameters.extraQueryParameters).toBe(null);
        });

        it("populates sid claim if available (on account)", () => {
            const serverRequestParameters = new ServerRequestParameters(AuthorityFactory.CreateInstance("https://login.microsoftonline.com/common/", true), "client-id", "toke", "redirect-uri", [ "user.read" ], "state", "correlationid");

            const account = Account.createAccount(idToken, clientInfo);
            account.sid = "session-id";

            serverRequestParameters.populateQueryParams(account, {
                prompt: "none"
            });

            expect(serverRequestParameters.queryParameters).toBe("sid=session-id");
            expect(serverRequestParameters.extraQueryParameters).toBe(null);
        });

        it("populates loginHint if available (on request)", () => {
            const serverRequestParameters = new ServerRequestParameters(AuthorityFactory.CreateInstance("https://login.microsoftonline.com/common/", true), "client-id", "toke", "redirect-uri", [ "user.read" ], "state", "correlationid");

            const account = Account.createAccount(idToken, clientInfo);

            serverRequestParameters.populateQueryParams(account, {
                loginHint: "test@example.com"
            });

            expect(serverRequestParameters.queryParameters).toBe("login_hint=test%40example.com");
            expect(serverRequestParameters.extraQueryParameters).toBe(null);
        });
    });
});
