import { ClientConfigurationError, ClientConfigurationErrorMessage } from "../../src/error/ClientConfigurationError";
import { ClientAuthError, AuthError } from "../../src";
import { TEST_CONFIG } from "../test_kit/StringConstants";

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
        expect(err.stack).toEqual(expect.arrayContaining(["ClientConfigurationError.spec.ts"]));
    });

    it("createRedirectUriEmptyError creates a ClientConfigurationError object", () => {
        const err: ClientConfigurationError = ClientConfigurationError.createRedirectUriEmptyError();

        expect(err instanceof ClientConfigurationError).toBe(true);
        expect(err instanceof ClientAuthError).toBe(true);
        expect(err instanceof AuthError).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err.errorCode).toBe(ClientConfigurationErrorMessage.redirectUriNotSet.code);
        expect(err.errorMessage).toEqual(
            expect.arrayContaining([ClientConfigurationErrorMessage.redirectUriNotSet.desc])
        );
        expect(err.message).toEqual(
            expect.arrayContaining([ClientConfigurationErrorMessage.redirectUriNotSet.desc])
        );
        expect(err.name).toBe("ClientConfigurationError");
        expect(err.stack).toEqual(expect.arrayContaining(["ClientConfigurationError.spec.ts"]));
    });

    it("createPostLogoutRedirectUriEmptyError creates a ClientConfigurationError object", () => {
        const err: ClientConfigurationError = ClientConfigurationError.createPostLogoutRedirectUriEmptyError();

        expect(err instanceof ClientConfigurationError).toBe(true);
        expect(err instanceof ClientAuthError).toBe(true);
        expect(err instanceof AuthError).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err.errorCode).toBe(ClientConfigurationErrorMessage.postLogoutUriNotSet.code);
        expect(err.errorMessage).toEqual(
            expect.arrayContaining([ClientConfigurationErrorMessage.postLogoutUriNotSet.desc])
        );
        expect(err.message).toEqual(
            expect.arrayContaining([ClientConfigurationErrorMessage.postLogoutUriNotSet.desc])
        );
        expect(err.name).toBe("ClientConfigurationError");
        expect(err.stack).toEqual(expect.arrayContaining(["ClientConfigurationError.spec.ts"]));
    });

    it("createClaimsRequestParsingError creates a ClientConfigurationError object", () => {
        const err: ClientConfigurationError = ClientConfigurationError.createClaimsRequestParsingError("Could not parse claims.");

        expect(err instanceof ClientConfigurationError).toBe(true);
        expect(err instanceof ClientAuthError).toBe(true);
        expect(err instanceof AuthError).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err.errorCode).toBe(ClientConfigurationErrorMessage.claimsRequestParsingError.code);
        expect(err.errorMessage).toEqual(
            expect.arrayContaining([ClientConfigurationErrorMessage.claimsRequestParsingError.desc])
        );
        expect(err.message).toEqual(
            expect.arrayContaining([ClientConfigurationErrorMessage.claimsRequestParsingError.desc])
        );
        expect(err.errorMessage).toEqual(expect.arrayContaining(["Could not parse claims."]));
        expect(err.message).toEqual(expect.arrayContaining(["Could not parse claims."]));
        expect(err.name).toBe("ClientConfigurationError");
        expect(err.stack).toEqual(expect.arrayContaining(["ClientConfigurationError.spec.ts"]));
    });

    it("createInsecureAuthorityUriError creates a ClientConfigurationError object", () => {
        const err: ClientConfigurationError = ClientConfigurationError.createInsecureAuthorityUriError("test url string");

        expect(err instanceof ClientConfigurationError).toBe(true);
        expect(err instanceof ClientAuthError).toBe(true);
        expect(err instanceof AuthError).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err.errorCode).toBe(ClientConfigurationErrorMessage.authorityUriInsecure.code);
        expect(err.errorMessage).toEqual(
            expect.arrayContaining([ClientConfigurationErrorMessage.authorityUriInsecure.desc])
        );
        expect(err.message).toEqual(
            expect.arrayContaining([ClientConfigurationErrorMessage.authorityUriInsecure.desc])
        );
        expect(err.name).toBe("ClientConfigurationError");
        expect(err.stack).toEqual(expect.arrayContaining(["ClientConfigurationError.spec.ts"]));
    });

    it("createUrlParseError creates a ClientConfigurationError object", () => {
        const err: ClientConfigurationError = ClientConfigurationError.createUrlParseError("Url parse error");

        expect(err instanceof ClientConfigurationError).toBe(true);
        expect(err instanceof ClientAuthError).toBe(true);
        expect(err instanceof AuthError).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err.errorCode).toBe(ClientConfigurationErrorMessage.urlParseError.code);
        expect(err.errorMessage).toEqual(
            expect.arrayContaining([ClientConfigurationErrorMessage.urlParseError.desc])
        );
        expect(err.message).toEqual(
            expect.arrayContaining([ClientConfigurationErrorMessage.urlParseError.desc])
        );
        expect(err.name).toBe("ClientConfigurationError");
        expect(err.stack).toEqual(expect.arrayContaining(["ClientConfigurationError.spec.ts"]));
    });

    it("createUrlEmptyError creates a ClientConfigurationError object", () => {
        const err: ClientConfigurationError = ClientConfigurationError.createUrlEmptyError();

        expect(err instanceof ClientConfigurationError).toBe(true);
        expect(err instanceof ClientAuthError).toBe(true);
        expect(err instanceof AuthError).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err.errorCode).toBe(ClientConfigurationErrorMessage.urlEmptyError.code);
        expect(err.errorMessage).toEqual(
            expect.arrayContaining([ClientConfigurationErrorMessage.urlEmptyError.desc])
        );
        expect(err.message).toEqual(
            expect.arrayContaining([ClientConfigurationErrorMessage.urlEmptyError.desc])
        );
        expect(err.name).toBe("ClientConfigurationError");
        expect(err.stack).toEqual(expect.arrayContaining(["ClientConfigurationError.spec.ts"]));
    });

    it("createScopesNonArrayError creates a ClientConfigurationError object", () => {
        const err: ClientConfigurationError = ClientConfigurationError.createScopesNonArrayError(null);

        expect(err instanceof ClientConfigurationError).toBe(true);
        expect(err instanceof ClientAuthError).toBe(true);
        expect(err instanceof AuthError).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err.errorCode).toBe(ClientConfigurationErrorMessage.nonArrayScopesError.code);
        expect(err.errorMessage).toEqual(
            expect.arrayContaining([ClientConfigurationErrorMessage.nonArrayScopesError.desc])
        );
        expect(err.message).toEqual(
            expect.arrayContaining([ClientConfigurationErrorMessage.nonArrayScopesError.desc])
        );
        expect(err.name).toBe("ClientConfigurationError");
        expect(err.stack).toEqual(expect.arrayContaining(["ClientConfigurationError.spec.ts"]));
    });

    it("createEmptyScopesArrayError creates a ClientConfigurationError object", () => {
        const err: ClientConfigurationError = ClientConfigurationError.createEmptyScopesArrayError([]);

        expect(err instanceof ClientConfigurationError).toBe(true);
        expect(err instanceof ClientAuthError).toBe(true);
        expect(err instanceof AuthError).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err.errorCode).toBe(ClientConfigurationErrorMessage.emptyScopesError.code);
        expect(err.errorMessage).toEqual(
            expect.arrayContaining([ClientConfigurationErrorMessage.emptyScopesError.desc])
        );
        expect(err.message).toEqual(
            expect.arrayContaining([ClientConfigurationErrorMessage.emptyScopesError.desc])
        );
        expect(err.name).toBe("ClientConfigurationError");
        expect(err.stack).toEqual(expect.arrayContaining(["ClientConfigurationError.spec.ts"]));
    });

    it("createClientIdSingleScopeError creates a ClientConfigurationError object", () => {
        const err: ClientConfigurationError = ClientConfigurationError.createClientIdSingleScopeError([TEST_CONFIG.MSAL_CLIENT_ID, "scope1"]);

        expect(err instanceof ClientConfigurationError).toBe(true);
        expect(err instanceof ClientAuthError).toBe(true);
        expect(err instanceof AuthError).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err.errorCode).toBe(ClientConfigurationErrorMessage.clientIdSingleScopeError.code);
        expect(err.errorMessage).toEqual(
            expect.arrayContaining([ClientConfigurationErrorMessage.clientIdSingleScopeError.desc])
        );
        expect(err.message).toEqual(
            expect.arrayContaining([ClientConfigurationErrorMessage.clientIdSingleScopeError.desc])
        );
        expect(err.name).toBe("ClientConfigurationError");
        expect(err.stack).toEqual(expect.arrayContaining(["ClientConfigurationError.spec.ts"]));
    });

    it("createInvalidPromptError creates a ClientConfigurationError object", () => {
        const err: ClientConfigurationError = ClientConfigurationError.createInvalidPromptError("notaprompt");

        expect(err instanceof ClientConfigurationError).toBe(true);
        expect(err instanceof ClientAuthError).toBe(true);
        expect(err instanceof AuthError).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err.errorCode).toBe(ClientConfigurationErrorMessage.invalidPrompt.code);
        expect(err.errorMessage).toEqual(
            expect.arrayContaining([ClientConfigurationErrorMessage.invalidPrompt.desc])
        );
        expect(err.message).toEqual(
            expect.arrayContaining([ClientConfigurationErrorMessage.invalidPrompt.desc])
        );
        expect(err.name).toBe("ClientConfigurationError");
        expect(err.stack).toEqual(expect.arrayContaining(["ClientConfigurationError.spec.ts"]));
    });

    it("createEmptyTokenRequestError creates a ClientConfigurationError object", () => {
        const err: ClientConfigurationError = ClientConfigurationError.createEmptyTokenRequestError();

        expect(err instanceof ClientConfigurationError).toBe(true);
        expect(err instanceof ClientAuthError).toBe(true);
        expect(err instanceof AuthError).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err.errorCode).toBe(ClientConfigurationErrorMessage.tokenRequestEmptyError.code);
        expect(err.errorMessage).toEqual(
            expect.arrayContaining([ClientConfigurationErrorMessage.tokenRequestEmptyError.desc])
        );
        expect(err.message).toEqual(
            expect.arrayContaining([ClientConfigurationErrorMessage.tokenRequestEmptyError.desc])
        );
        expect(err.name).toBe("ClientConfigurationError");
        expect(err.stack).toEqual(expect.arrayContaining(["ClientConfigurationError.spec.ts"]));
    });
});
