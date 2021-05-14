import { expect } from "chai";
import { ClientConfigurationError, ClientConfigurationErrorMessage } from "../../src/error/ClientConfigurationError";
import { ClientAuthError, AuthError } from "../../src";
import { TEST_CONFIG } from "../test_kit/StringConstants";

describe("ClientConfigurationError.ts Class Unit Tests", () => {

    it("ClientConfigurationError object can be created", () => {
        const TEST_ERROR_CODE: string = "test";
        const TEST_ERROR_MSG: string = "This is a test error";
        const err: ClientConfigurationError = new ClientConfigurationError(TEST_ERROR_CODE, TEST_ERROR_MSG);

        expect(err instanceof ClientConfigurationError).to.be.true;
        expect(err instanceof ClientAuthError).to.be.true;
        expect(err instanceof AuthError).to.be.true;
        expect(err instanceof Error).to.be.true;
        expect(err.errorCode).to.equal(TEST_ERROR_CODE);
        expect(err.errorMessage).to.equal(TEST_ERROR_MSG);
        expect(err.message).to.equal(`${TEST_ERROR_CODE}: ${TEST_ERROR_MSG}`);
        expect(err.name).to.equal("ClientConfigurationError");
        expect(err.stack).to.include("ClientConfigurationError.spec.ts");
    });

    it("createRedirectUriEmptyError creates a ClientConfigurationError object", () => {
        const err: ClientConfigurationError = ClientConfigurationError.createRedirectUriEmptyError();

        expect(err instanceof ClientConfigurationError).to.be.true;
        expect(err instanceof ClientAuthError).to.be.true;
        expect(err instanceof AuthError).to.be.true;
        expect(err instanceof Error).to.be.true;
        expect(err.errorCode).to.equal(ClientConfigurationErrorMessage.redirectUriNotSet.code);
        expect(err.errorMessage).to.include(ClientConfigurationErrorMessage.redirectUriNotSet.desc);
        expect(err.message).to.include(ClientConfigurationErrorMessage.redirectUriNotSet.desc);
        expect(err.name).to.equal("ClientConfigurationError");
        expect(err.stack).to.include("ClientConfigurationError.spec.ts");
    });

    it("createPostLogoutRedirectUriEmptyError creates a ClientConfigurationError object", () => {
        const err: ClientConfigurationError = ClientConfigurationError.createPostLogoutRedirectUriEmptyError();

        expect(err instanceof ClientConfigurationError).to.be.true;
        expect(err instanceof ClientAuthError).to.be.true;
        expect(err instanceof AuthError).to.be.true;
        expect(err instanceof Error).to.be.true;
        expect(err.errorCode).to.equal(ClientConfigurationErrorMessage.postLogoutUriNotSet.code);
        expect(err.errorMessage).to.include(ClientConfigurationErrorMessage.postLogoutUriNotSet.desc);
        expect(err.message).to.include(ClientConfigurationErrorMessage.postLogoutUriNotSet.desc);
        expect(err.name).to.equal("ClientConfigurationError");
        expect(err.stack).to.include("ClientConfigurationError.spec.ts");
    });

    it("createClaimsRequestParsingError creates a ClientConfigurationError object", () => {
        const err: ClientConfigurationError = ClientConfigurationError.createClaimsRequestParsingError("Could not parse claims.");

        expect(err instanceof ClientConfigurationError).to.be.true;
        expect(err instanceof ClientAuthError).to.be.true;
        expect(err instanceof AuthError).to.be.true;
        expect(err instanceof Error).to.be.true;
        expect(err.errorCode).to.equal(ClientConfigurationErrorMessage.claimsRequestParsingError.code);
        expect(err.errorMessage).to.include(ClientConfigurationErrorMessage.claimsRequestParsingError.desc);
        expect(err.message).to.include(ClientConfigurationErrorMessage.claimsRequestParsingError.desc);
        expect(err.errorMessage).to.include("Could not parse claims.");
        expect(err.message).to.include("Could not parse claims.");
        expect(err.name).to.equal("ClientConfigurationError");
        expect(err.stack).to.include("ClientConfigurationError.spec.ts");
    });

    it("createInsecureAuthorityUriError creates a ClientConfigurationError object", () => {
        const err: ClientConfigurationError = ClientConfigurationError.createInsecureAuthorityUriError("test url string");

        expect(err instanceof ClientConfigurationError).to.be.true;
        expect(err instanceof ClientAuthError).to.be.true;
        expect(err instanceof AuthError).to.be.true;
        expect(err instanceof Error).to.be.true;
        expect(err.errorCode).to.equal(ClientConfigurationErrorMessage.authorityUriInsecure.code);
        expect(err.errorMessage).to.include(ClientConfigurationErrorMessage.authorityUriInsecure.desc);
        expect(err.message).to.include(ClientConfigurationErrorMessage.authorityUriInsecure.desc);
        expect(err.name).to.equal("ClientConfigurationError");
        expect(err.stack).to.include("ClientConfigurationError.spec.ts");
    });

    it("createUrlParseError creates a ClientConfigurationError object", () => {
        const err: ClientConfigurationError = ClientConfigurationError.createUrlParseError("Url parse error");

        expect(err instanceof ClientConfigurationError).to.be.true;
        expect(err instanceof ClientAuthError).to.be.true;
        expect(err instanceof AuthError).to.be.true;
        expect(err instanceof Error).to.be.true;
        expect(err.errorCode).to.equal(ClientConfigurationErrorMessage.urlParseError.code);
        expect(err.errorMessage).to.include(ClientConfigurationErrorMessage.urlParseError.desc);
        expect(err.message).to.include(ClientConfigurationErrorMessage.urlParseError.desc);
        expect(err.name).to.equal("ClientConfigurationError");
        expect(err.stack).to.include("ClientConfigurationError.spec.ts");
    });

    it("createUrlEmptyError creates a ClientConfigurationError object", () => {
        const err: ClientConfigurationError = ClientConfigurationError.createUrlEmptyError();

        expect(err instanceof ClientConfigurationError).to.be.true;
        expect(err instanceof ClientAuthError).to.be.true;
        expect(err instanceof AuthError).to.be.true;
        expect(err instanceof Error).to.be.true;
        expect(err.errorCode).to.equal(ClientConfigurationErrorMessage.urlEmptyError.code);
        expect(err.errorMessage).to.include(ClientConfigurationErrorMessage.urlEmptyError.desc);
        expect(err.message).to.include(ClientConfigurationErrorMessage.urlEmptyError.desc);
        expect(err.name).to.equal("ClientConfigurationError");
        expect(err.stack).to.include("ClientConfigurationError.spec.ts");
    });

    it("createScopesNonArrayError creates a ClientConfigurationError object", () => {
        const err: ClientConfigurationError = ClientConfigurationError.createScopesNonArrayError(null);

        expect(err instanceof ClientConfigurationError).to.be.true;
        expect(err instanceof ClientAuthError).to.be.true;
        expect(err instanceof AuthError).to.be.true;
        expect(err instanceof Error).to.be.true;
        expect(err.errorCode).to.equal(ClientConfigurationErrorMessage.nonArrayScopesError.code);
        expect(err.errorMessage).to.include(ClientConfigurationErrorMessage.nonArrayScopesError.desc);
        expect(err.message).to.include(ClientConfigurationErrorMessage.nonArrayScopesError.desc);
        expect(err.name).to.equal("ClientConfigurationError");
        expect(err.stack).to.include("ClientConfigurationError.spec.ts");
    });

    it("createEmptyScopesArrayError creates a ClientConfigurationError object", () => {
        const err: ClientConfigurationError = ClientConfigurationError.createEmptyScopesArrayError([]);

        expect(err instanceof ClientConfigurationError).to.be.true;
        expect(err instanceof ClientAuthError).to.be.true;
        expect(err instanceof AuthError).to.be.true;
        expect(err instanceof Error).to.be.true;
        expect(err.errorCode).to.equal(ClientConfigurationErrorMessage.emptyScopesError.code);
        expect(err.errorMessage).to.include(ClientConfigurationErrorMessage.emptyScopesError.desc);
        expect(err.message).to.include(ClientConfigurationErrorMessage.emptyScopesError.desc);
        expect(err.name).to.equal("ClientConfigurationError");
        expect(err.stack).to.include("ClientConfigurationError.spec.ts");
    });

    it("createClientIdSingleScopeError creates a ClientConfigurationError object", () => {
        const err: ClientConfigurationError = ClientConfigurationError.createClientIdSingleScopeError([TEST_CONFIG.MSAL_CLIENT_ID, "scope1"]);

        expect(err instanceof ClientConfigurationError).to.be.true;
        expect(err instanceof ClientAuthError).to.be.true;
        expect(err instanceof AuthError).to.be.true;
        expect(err instanceof Error).to.be.true;
        expect(err.errorCode).to.equal(ClientConfigurationErrorMessage.clientIdSingleScopeError.code);
        expect(err.errorMessage).to.include(ClientConfigurationErrorMessage.clientIdSingleScopeError.desc);
        expect(err.message).to.include(ClientConfigurationErrorMessage.clientIdSingleScopeError.desc);
        expect(err.name).to.equal("ClientConfigurationError");
        expect(err.stack).to.include("ClientConfigurationError.spec.ts");
    });

    it("createInvalidPromptError creates a ClientConfigurationError object", () => {
        const err: ClientConfigurationError = ClientConfigurationError.createInvalidPromptError("notaprompt");

        expect(err instanceof ClientConfigurationError).to.be.true;
        expect(err instanceof ClientAuthError).to.be.true;
        expect(err instanceof AuthError).to.be.true;
        expect(err instanceof Error).to.be.true;
        expect(err.errorCode).to.equal(ClientConfigurationErrorMessage.invalidPrompt.code);
        expect(err.errorMessage).to.include(ClientConfigurationErrorMessage.invalidPrompt.desc);
        expect(err.message).to.include(ClientConfigurationErrorMessage.invalidPrompt.desc);
        expect(err.name).to.equal("ClientConfigurationError");
        expect(err.stack).to.include("ClientConfigurationError.spec.ts");
    });

    it("createEmptyTokenRequestError creates a ClientConfigurationError object", () => {
        const err: ClientConfigurationError = ClientConfigurationError.createEmptyTokenRequestError();

        expect(err instanceof ClientConfigurationError).to.be.true;
        expect(err instanceof ClientAuthError).to.be.true;
        expect(err instanceof AuthError).to.be.true;
        expect(err instanceof Error).to.be.true;
        expect(err.errorCode).to.equal(ClientConfigurationErrorMessage.tokenRequestEmptyError.code);
        expect(err.errorMessage).to.include(ClientConfigurationErrorMessage.tokenRequestEmptyError.desc);
        expect(err.message).to.include(ClientConfigurationErrorMessage.tokenRequestEmptyError.desc);
        expect(err.name).to.equal("ClientConfigurationError");
        expect(err.stack).to.include("ClientConfigurationError.spec.ts");
    });
});
