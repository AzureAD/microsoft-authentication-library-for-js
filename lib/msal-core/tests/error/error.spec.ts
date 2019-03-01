import AuthError, { AuthErrorMessage } from "../../src/error/AuthError";
import ClientAuthError, { ClientAuthErrorMessage } from "../../src/error/ClientAuthError";
import ServerError, { ServerErrorMessage } from "../../src/error/ServerError";
import ClientConfigurationError, { ClientConfigurationErrorMessage }  from "../../src/error/ClientConfigurationError";
import InteractionRequiredAuthError, { InteractionRequiredAuthErrorMessage } from "../../src/error/InteractionRequiredAuthError";
import ClaimsRequiredError from "../../src/error/ClaimsRequiredError";

describe("ClientAuthError", () => {
    const TEST_ERROR_CODE: string = "test";
    const TEST_ERROR_MSG: string = "This is a test error";

    describe("AuthError", () => {
        it("can be created", () => {
            let authError = new AuthError(TEST_ERROR_CODE, TEST_ERROR_MSG);
            var throwFunc = function () {
                throw authError;
            };
            var err: AuthError;
            try {
                throwFunc();
            } catch(error) {
                err = error;
            }

            expect(authError).toEqual(jasmine.any(AuthError), "AuthError could not be created.");
            expect(authError.errorCode).toBe(TEST_ERROR_CODE);
            expect(authError.errorMessage).toBe(TEST_ERROR_MSG);
            expect(authError.message).toBe(TEST_ERROR_MSG);
            expect(authError.name).toBe("AuthError");
        });

        
    });

    describe("ClientAuthError", () => {
        it("can be created", () => {
            let clientAuthError = new ClientAuthError(TEST_ERROR_CODE, TEST_ERROR_MSG);

            expect(clientAuthError).toEqual(jasmine.any(ClientAuthError), "ClientAuthError could not be created.");
            expect(clientAuthError.errorCode).toBe(TEST_ERROR_CODE);
            expect(clientAuthError.errorMessage).toBe(TEST_ERROR_MSG);
            expect(clientAuthError.message).toBe(TEST_ERROR_MSG);
            expect(clientAuthError.name).toBe("ClientAuthError");
        });
    });

    describe("ServerError", () => {
        it("can be created", () => {
            let serverError = new ServerError("test", "This is a test error");

            expect(serverError).toEqual(jasmine.any(ServerError), "ServerError could not be created.");
            expect(serverError.errorCode).toBe(TEST_ERROR_CODE);
            expect(serverError.errorMessage).toBe(TEST_ERROR_MSG);
            expect(serverError.message).toBe(TEST_ERROR_MSG);
            expect(serverError.name).toBe("ServerError");
        });
    });

    describe("ClientConfigurationError", () => {
        it("can be created", () => {
            let clientConfigurationError = new ClientConfigurationError("test", "This is a test error");

            expect(clientConfigurationError).toEqual(jasmine.any(ClientConfigurationError), "ClientConfigurationError could not be created.");
            expect(clientConfigurationError.errorCode).toBe(TEST_ERROR_CODE);
            expect(clientConfigurationError.errorMessage).toBe(TEST_ERROR_MSG);
            expect(clientConfigurationError.message).toBe(TEST_ERROR_MSG);
            expect(clientConfigurationError.name).toBe("ClientConfigurationError");
        });
    });

    describe("InteractionRequiredError", () => {
        it("can be created", () => {
            let interactionReqError = new InteractionRequiredAuthError("test", "This is a test error");

            expect(interactionReqError).toEqual(jasmine.any(InteractionRequiredAuthError), "InteractionRequiredAuthError could not be created.");
            expect(interactionReqError.errorCode).toBe(TEST_ERROR_CODE);
            expect(interactionReqError.errorMessage).toBe(TEST_ERROR_MSG);
            expect(interactionReqError.message).toBe(TEST_ERROR_MSG);
            expect(interactionReqError.name).toBe("InteractionRequiredAuthError");
        });
    });

    describe("ClaimsRequiredError", () => {
        it("can be created", () => {
            let claimsRequiredError = new ClaimsRequiredError("test", "This is a test error", "claims: {}");

            expect(claimsRequiredError).toEqual(jasmine.any(ClaimsRequiredError), "ClaimsRequiredError could not be created.");
            expect(claimsRequiredError.errorCode).toBe(TEST_ERROR_CODE);
            expect(claimsRequiredError.errorMessage).toBe(TEST_ERROR_MSG);
            expect(claimsRequiredError.message).toBe(TEST_ERROR_MSG);
            expect(claimsRequiredError.name).toBe("ClaimsRequiredAuthError");
        });
    });
});
