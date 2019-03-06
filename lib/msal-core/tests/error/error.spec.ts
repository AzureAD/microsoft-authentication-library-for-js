import { AuthError, AuthErrorMessage } from "../../src/error/AuthError";
import { ClientAuthError, ClientAuthErrorMessage } from "../../src/error/ClientAuthError";
import { ServerError, ServerErrorMessage } from "../../src/error/ServerError";
import { ClientConfigurationError, ClientConfigurationErrorMessage }  from "../../src/error/ClientConfigurationError";
import { InteractionRequiredAuthError, InteractionRequiredAuthErrorMessage } from "../../src/error/InteractionRequiredAuthError";

describe("Error", () => {
    const TEST_ERROR_CODE: string = "test";
    const TEST_ERROR_MSG: string = "This is a test error";

    let throwFunc = (err: AuthError): void => {
        throw err;
    }

    describe("AuthError", () => {
        it("can be created", () => {
            let authError = new AuthError(TEST_ERROR_CODE, TEST_ERROR_MSG);
            let err: AuthError;
            try {
                throwFunc(authError);
            } catch(error) {
                err = error;
            }
            console.log("Stack trace: " + err.stack);

            expect(err).toEqual(jasmine.any(AuthError), "AuthError could not be created.");
            expect(err.errorCode).toBe(TEST_ERROR_CODE);
            expect(err.errorMessage).toBe(TEST_ERROR_MSG);
            expect(err.message).toBe(TEST_ERROR_MSG);
            expect(err.name).toBe("AuthError");
            expect(err.stack).toContain("error.spec.js");
        });
    });

    describe("ClientAuthError", () => {
        it("can be created", () => {
            let clientAuthError = new ClientAuthError(TEST_ERROR_CODE, TEST_ERROR_MSG);
            let err: AuthError;
            try {
                throwFunc(clientAuthError);
            } catch(error) {
                err = error;
            }
            console.log("Stack trace: " + err.stack);
            console.log("Stack trace: " + clientAuthError.stack);

            expect(err).toEqual(jasmine.any(ClientAuthError), "ClientAuthError could not be created.");
            expect(err.errorCode).toBe(TEST_ERROR_CODE);
            expect(err.errorMessage).toBe(TEST_ERROR_MSG);
            expect(err.message).toBe(TEST_ERROR_MSG);
            expect(err.name).toBe("ClientAuthError");
            expect(err.stack).toContain("error.spec.js");
        });
    });

    describe("ServerError", () => {
        it("can be created", () => {
            let serverError = new ServerError("test", "This is a test error");
            let err: AuthError;
            try {
                throwFunc(serverError);
            } catch(error) {
                err = error;
            }

            expect(err).toEqual(jasmine.any(ServerError), "ServerError could not be created.");
            expect(err.errorCode).toBe(TEST_ERROR_CODE);
            expect(err.errorMessage).toBe(TEST_ERROR_MSG);
            expect(err.message).toBe(TEST_ERROR_MSG);
            expect(err.name).toBe("ServerError");
            expect(err.stack).toContain("error.spec.js");
        });
    });

    describe("ClientConfigurationError", () => {
        it("can be created", () => {
            let clientConfigurationError = new ClientConfigurationError("test", "This is a test error");
            let err: AuthError;
            try {
                throwFunc(clientConfigurationError);
            } catch(error) {
                err = error;
            }

            expect(err).toEqual(jasmine.any(ClientConfigurationError), "ClientConfigurationError could not be created.");
            expect(err.errorCode).toBe(TEST_ERROR_CODE);
            expect(err.errorMessage).toBe(TEST_ERROR_MSG);
            expect(err.message).toBe(TEST_ERROR_MSG);
            expect(err.name).toBe("ClientConfigurationError");
            expect(err.stack).toContain("error.spec.js");
        });
    });

    describe("InteractionRequiredError", () => {
        it("can be created", () => {
            let interactionReqError = new InteractionRequiredAuthError("test", "This is a test error");
            let err: AuthError;
            try {
                throwFunc(interactionReqError);
            } catch(error) {
                err = error;
            }

            expect(err).toEqual(jasmine.any(InteractionRequiredAuthError), "InteractionRequiredAuthError could not be created.");
            expect(err.errorCode).toBe(TEST_ERROR_CODE);
            expect(err.errorMessage).toBe(TEST_ERROR_MSG);
            expect(err.message).toBe(TEST_ERROR_MSG);
            expect(err.name).toBe("InteractionRequiredAuthError");
            expect(err.stack).toContain("error.spec.js");
        });
    });
});
