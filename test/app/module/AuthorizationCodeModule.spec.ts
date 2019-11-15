import * as Mocha from "mocha";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
const expect = chai.expect;
chai.use(chaiAsPromised);
import { AuthorizationCodeModule } from "../../../src/app/module/AuthorizationCodeModule";
import { TEST_CONFIG, TEST_URIS } from "../../utils/StringConstants";
import { AuthModule } from "../../../src/app/module/AuthModule";
import { AuthenticationParameters } from "../../../src/request/AuthenticationParameters";
import { ClientConfigurationError } from "../../../src/error/ClientConfigurationError";

describe("AuthorizationCodeModule.ts Class Unit Tests", () => {

    let authModule = new AuthorizationCodeModule({
        auth: {
            clientId: TEST_CONFIG.MSAL_CLIENT_ID,
            clientSecret: TEST_CONFIG.MSAL_CLIENT_SECRET,
            authority: TEST_CONFIG.validAuthority,
            redirectUri: TEST_URIS.TEST_REDIR_URI,
            postLogoutRedirectUri: TEST_URIS.TEST_LOGOUT_URI
        },
        storageInterface: null,
        networkInterface: null,
        cryptoInterface: null
    });
    const emptyRequest: AuthenticationParameters = {};

    describe("Constructor", () => {

        it("creates an AuthorizationCodeModule that extends the AuthModule", () => {
            expect(authModule).to.be.not.null;
            expect(authModule instanceof AuthModule).to.be.true;
        });
    });

    describe("Login Code Url Creation", () => {

        it("throws not implemented error", async () => {
            await expect(authModule.createLoginUrl(emptyRequest)).to.be.rejected;
        });
    });

    describe("Acquire Token Code Url Creation", () => {

        it("throws not implemented error", async () => {
            await expect(authModule.createAcquireTokenUrl(emptyRequest)).to.be.rejected;
        });
    });

    describe("Token Acquisition", () => {

        it("throws not implemented error", async () => {
            await expect(authModule.acquireToken(emptyRequest)).to.be.rejected;
        });
    });

    describe("Getters and setters", () => {

        let redirectUriFunc = () => {
            return TEST_URIS.TEST_REDIR_URI;
        };

        let postLogoutRedirectUriFunc = () => {
            return TEST_URIS.TEST_LOGOUT_URI;
        };

        let authModule_functionRedirectUris = new AuthorizationCodeModule({
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                clientSecret: TEST_CONFIG.MSAL_CLIENT_SECRET,
                authority: TEST_CONFIG.validAuthority,
                redirectUri: redirectUriFunc,
                postLogoutRedirectUri: postLogoutRedirectUriFunc
            },
            storageInterface: null,
            networkInterface: null,
            cryptoInterface: null
        });

        let authModule_noRedirectUris = new AuthorizationCodeModule({
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                clientSecret: TEST_CONFIG.MSAL_CLIENT_SECRET,
                authority: TEST_CONFIG.validAuthority
            },
            storageInterface: null,
            networkInterface: null,
            cryptoInterface: null
        });

        it("gets configured redirect uri", () => {
            expect(authModule.getRedirectUri()).to.be.deep.eq(TEST_URIS.TEST_REDIR_URI);
        });

        it("gets configured redirect uri if uri is a function", () => {
            expect(authModule_functionRedirectUris.getRedirectUri()).to.be.deep.eq(TEST_URIS.TEST_REDIR_URI);
        });

        it("throws error if redirect uri is null/empty", () => {
            expect(() => authModule_noRedirectUris.getRedirectUri()).to.throw(ClientConfigurationError.createRedirectUriEmptyError().message);
        });

        it("gets configured post logout redirect uri", () => {
            expect(authModule.getPostLogoutRedirectUri()).to.be.deep.eq(TEST_URIS.TEST_LOGOUT_URI);
        });

        it("gets configured post logout redirect uri if uri is a function", () => {
            expect(authModule_functionRedirectUris.getPostLogoutRedirectUri()).to.be.deep.eq(TEST_URIS.TEST_LOGOUT_URI);
        });

        it("throws error if post logout redirect uri is null/empty", () => {
            expect(() => authModule_noRedirectUris.getPostLogoutRedirectUri()).to.throw(ClientConfigurationError.createPostLogoutRedirectUriEmptyError().message);
        });
    });
});
