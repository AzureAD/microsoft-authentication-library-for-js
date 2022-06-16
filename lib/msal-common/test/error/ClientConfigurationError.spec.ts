import { ClientConfigurationError, ClientConfigurationErrorMessage } from "../../src/error/ClientConfigurationError";
import { TEST_CONFIG } from "../test_kit/StringConstants";
import { ClientAuthError } from "../../src/error/ClientAuthError";
import { AuthError } from "../../src/error/AuthError";

describe("ClientConfigurationError.ts Class Unit Tests", () => {

    it("ClientConfigurationError object can be created", () => {
        const TEST_ERROR_CODE: string = "test";
        const TEST_ERROR_MSG: string = "This is a test error";
        const err: ClientConfigurationError = new ClientConfigurationError(TEST_ERROR_CODE, TEST_ERROR_MSG);

        expect(err instanceof ClientConfigurationError).toBe(true);
        expect(err instanceof ClientAuthError).toBe(true);
        expect(err instanceof AuthError).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err.errorCode).toBe(TEST_ERROR_CODE);
        expect(err.errorMessage).toBe(TEST_ERROR_MSG);
        expect(err.message).toBe(`${TEST_ERROR_CODE}: ${TEST_ERROR_MSG}`);
        expect(err.name).toBe("ClientConfigurationError");
        expect(err.stack?.includes("ClientConfigurationError.spec.ts")).toBe(true);
    });

    it("createRedirectUriEmptyError creates a ClientConfigurationError object", () => {
        const err: ClientConfigurationError = ClientConfigurationError.createRedirectUriEmptyError();

        expect(err instanceof ClientConfigurationError).toBe(true);
        expect(err instanceof ClientAuthError).toBe(true);
        expect(err instanceof AuthError).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err.errorCode).toBe(ClientConfigurationErrorMessage.redirectUriNotSet.code);
        expect(err.errorMessage.includes(ClientConfigurationErrorMessage.redirectUriNotSet.desc)).toBe(true);
        expect(err.message.includes(ClientConfigurationErrorMessage.redirectUriNotSet.desc)).toBe(true);
        expect(err.name).toBe("ClientConfigurationError");
        expect(err.stack?.includes("ClientConfigurationError.spec.ts")).toBe(true);
    });

    it("createPostLogoutRedirectUriEmptyError creates a ClientConfigurationError object", () => {
        const err: ClientConfigurationError = ClientConfigurationError.createPostLogoutRedirectUriEmptyError();

        expect(err instanceof ClientConfigurationError).toBe(true);
        expect(err instanceof ClientAuthError).toBe(true);
        expect(err instanceof AuthError).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err.errorCode).toBe(ClientConfigurationErrorMessage.postLogoutUriNotSet.code);
        expect(err.errorMessage.includes(ClientConfigurationErrorMessage.postLogoutUriNotSet.desc)).toBe(true);
        expect(err.message.includes(ClientConfigurationErrorMessage.postLogoutUriNotSet.desc)).toBe(true);
        expect(err.name).toBe("ClientConfigurationError");
        expect(err.stack?.includes("ClientConfigurationError.spec.ts")).toBe(true);
    });

    it("createClaimsRequestParsingError creates a ClientConfigurationError object", () => {
        const err: ClientConfigurationError = ClientConfigurationError.createClaimsRequestParsingError("Could not parse claims.");

        expect(err instanceof ClientConfigurationError).toBe(true);
        expect(err instanceof ClientAuthError).toBe(true);
        expect(err instanceof AuthError).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err.errorCode).toBe(ClientConfigurationErrorMessage.claimsRequestParsingError.code);
        expect(err.errorMessage.includes(ClientConfigurationErrorMessage.claimsRequestParsingError.desc)).toBe(true);
        expect(err.message.includes(ClientConfigurationErrorMessage.claimsRequestParsingError.desc)).toBe(true);
        expect(err.errorMessage.includes("Could not parse claims.")).toBe(true);
        expect(err.message.includes("Could not parse claims.")).toBe(true);
        expect(err.name).toBe("ClientConfigurationError");
        expect(err.stack?.includes("ClientConfigurationError.spec.ts")).toBe(true);
    });

    it("createInsecureAuthorityUriError creates a ClientConfigurationError object", () => {
        const err: ClientConfigurationError = ClientConfigurationError.createInsecureAuthorityUriError("test url string");

        expect(err instanceof ClientConfigurationError).toBe(true);
        expect(err instanceof ClientAuthError).toBe(true);
        expect(err instanceof AuthError).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err.errorCode).toBe(ClientConfigurationErrorMessage.authorityUriInsecure.code);
        expect(err.errorMessage.includes(ClientConfigurationErrorMessage.authorityUriInsecure.desc)).toBe(true);
        expect(err.message.includes(ClientConfigurationErrorMessage.authorityUriInsecure.desc)).toBe(true);
        expect(err.name).toBe("ClientConfigurationError");
        expect(err.stack?.includes("ClientConfigurationError.spec.ts")).toBe(true);
    });

    it("createUrlParseError creates a ClientConfigurationError object", () => {
        const err: ClientConfigurationError = ClientConfigurationError.createUrlParseError("Url parse error");

        expect(err instanceof ClientConfigurationError).toBe(true);
        expect(err instanceof ClientAuthError).toBe(true);
        expect(err instanceof AuthError).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err.errorCode).toBe(ClientConfigurationErrorMessage.urlParseError.code);
        expect(err.errorMessage.includes(ClientConfigurationErrorMessage.urlParseError.desc)).toBe(true);
        expect(err.message.includes(ClientConfigurationErrorMessage.urlParseError.desc)).toBe(true);
        expect(err.name).toBe("ClientConfigurationError");
        expect(err.stack?.includes("ClientConfigurationError.spec.ts")).toBe(true);
    });

    it("createUrlEmptyError creates a ClientConfigurationError object", () => {
        const err: ClientConfigurationError = ClientConfigurationError.createUrlEmptyError();

        expect(err instanceof ClientConfigurationError).toBe(true);
        expect(err instanceof ClientAuthError).toBe(true);
        expect(err instanceof AuthError).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err.errorCode).toBe(ClientConfigurationErrorMessage.urlEmptyError.code);
        expect(err.errorMessage.includes(ClientConfigurationErrorMessage.urlEmptyError.desc)).toBe(true);
        expect(err.message.includes(ClientConfigurationErrorMessage.urlEmptyError.desc)).toBe(true);
        expect(err.name).toBe("ClientConfigurationError");
        expect(err.stack?.includes("ClientConfigurationError.spec.ts")).toBe(true);
    });

    it("createEmptyScopesArrayError creates a ClientConfigurationError object", () => {
        const err: ClientConfigurationError = ClientConfigurationError.createEmptyScopesArrayError();

        expect(err instanceof ClientConfigurationError).toBe(true);
        expect(err instanceof ClientAuthError).toBe(true);
        expect(err instanceof AuthError).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err.errorCode).toBe(ClientConfigurationErrorMessage.emptyScopesError.code);
        expect(err.errorMessage.includes(ClientConfigurationErrorMessage.emptyScopesError.desc)).toBe(true);
        expect(err.message.includes(ClientConfigurationErrorMessage.emptyScopesError.desc)).toBe(true);
        expect(err.name).toBe("ClientConfigurationError");
        expect(err.stack?.includes("ClientConfigurationError.spec.ts")).toBe(true);
    });

    it("createClientIdSingleScopeError creates a ClientConfigurationError object", () => {
        const err: ClientConfigurationError = ClientConfigurationError.createClientIdSingleScopeError([TEST_CONFIG.MSAL_CLIENT_ID, "scope1"]);

        expect(err instanceof ClientConfigurationError).toBe(true);
        expect(err instanceof ClientAuthError).toBe(true);
        expect(err instanceof AuthError).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err.errorCode).toBe(ClientConfigurationErrorMessage.clientIdSingleScopeError.code);
        expect(err.errorMessage.includes(ClientConfigurationErrorMessage.clientIdSingleScopeError.desc)).toBe(true);
        expect(err.message.includes(ClientConfigurationErrorMessage.clientIdSingleScopeError.desc)).toBe(true);
        expect(err.name).toBe("ClientConfigurationError");
        expect(err.stack?.includes("ClientConfigurationError.spec.ts")).toBe(true);
    });

    it("createInvalidPromptError creates a ClientConfigurationError object", () => {
        const err: ClientConfigurationError = ClientConfigurationError.createInvalidPromptError("notaprompt");

        expect(err instanceof ClientConfigurationError).toBe(true);
        expect(err instanceof ClientAuthError).toBe(true);
        expect(err instanceof AuthError).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err.errorCode).toBe(ClientConfigurationErrorMessage.invalidPrompt.code);
        expect(err.errorMessage.includes(ClientConfigurationErrorMessage.invalidPrompt.desc)).toBe(true);
        expect(err.message.includes(ClientConfigurationErrorMessage.invalidPrompt.desc)).toBe(true);
        expect(err.name).toBe("ClientConfigurationError");
        expect(err.stack?.includes("ClientConfigurationError.spec.ts")).toBe(true);
    });

    it("createEmptyTokenRequestError creates a ClientConfigurationError object", () => {
        const err: ClientConfigurationError = ClientConfigurationError.createEmptyTokenRequestError();

        expect(err instanceof ClientConfigurationError).toBe(true);
        expect(err instanceof ClientAuthError).toBe(true);
        expect(err instanceof AuthError).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err.errorCode).toBe(ClientConfigurationErrorMessage.tokenRequestEmptyError.code);
        expect(err.errorMessage.includes(ClientConfigurationErrorMessage.tokenRequestEmptyError.desc)).toBe(true);
        expect(err.message.includes(ClientConfigurationErrorMessage.tokenRequestEmptyError.desc)).toBe(true);
        expect(err.name).toBe("ClientConfigurationError");
        expect(err.stack?.includes("ClientConfigurationError.spec.ts")).toBe(true);
    });

    it("createMissingSshJwkError creates a ClientConfigurationError object", () => {
        const err: ClientConfigurationError = ClientConfigurationError.createMissingSshJwkError();

        expect(err instanceof ClientConfigurationError).toBe(true);
        expect(err instanceof ClientAuthError).toBe(true);
        expect(err instanceof AuthError).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err.errorCode).toBe(ClientConfigurationErrorMessage.missingSshJwk.code);
        expect(err.errorMessage.includes(ClientConfigurationErrorMessage.missingSshJwk.desc)).toBe(true);
        expect(err.message.includes(ClientConfigurationErrorMessage.missingSshJwk.desc)).toBe(true);
        expect(err.name).toBe("ClientConfigurationError");
        expect(err.stack?.includes("ClientConfigurationError.spec.ts")).toBe(true);
    });

    it("createMissingSshKidError creates a ClientConfigurationError object", () => {
        const err: ClientConfigurationError = ClientConfigurationError.createMissingSshKidError();

        expect(err instanceof ClientConfigurationError).toBe(true);
        expect(err instanceof ClientAuthError).toBe(true);
        expect(err instanceof AuthError).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err.errorCode).toBe(ClientConfigurationErrorMessage.missingSshKid.code);
        expect(err.errorMessage.includes(ClientConfigurationErrorMessage.missingSshKid.desc)).toBe(true);
        expect(err.message.includes(ClientConfigurationErrorMessage.missingSshKid.desc)).toBe(true);
        expect(err.name).toBe("ClientConfigurationError");
        expect(err.stack?.includes("ClientConfigurationError.spec.ts")).toBe(true);
    });
});
