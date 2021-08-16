import { AuthError, AuthErrorMessage } from "../../src/error/AuthError";
import { TEST_CONFIG } from "../test_kit/StringConstants";

describe("AuthError.ts Class", () => {

    it("AuthError object can be created", () => {
        const TEST_ERROR_CODE: string = "test";
        const TEST_ERROR_MSG: string = "This is a test error";
        const authError = new AuthError(TEST_ERROR_CODE, TEST_ERROR_MSG);
        let err: AuthError;

        try {
            throw authError;
        } catch (error) {
            err = error;
        }

        expect(err instanceof AuthError).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err.errorCode).toBe(TEST_ERROR_CODE);
        expect(err.errorMessage).toBe(TEST_ERROR_MSG);
        expect(err.message).toBe(`${TEST_ERROR_CODE}: ${TEST_ERROR_MSG}`);
        expect(err.name).toBe("AuthError");
        expect(err.stack?.includes("AuthError.spec.ts")).toBe(true);
    });

    it("createUnexpectedError creates a AuthError object", () => {
        const ERROR_DESC = "This is the error";
        const unexpectedError = AuthError.createUnexpectedError(ERROR_DESC);
        let err: AuthError;

        try {
            throw unexpectedError;
        } catch (error) {
            err = error;
        }

        expect(err instanceof AuthError).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err.errorCode).toBe(AuthErrorMessage.unexpectedError.code);
        expect(err.errorMessage.includes(AuthErrorMessage.unexpectedError.desc)).toBe(true);
        expect(err.errorMessage.includes(ERROR_DESC)).toBe(true);
        expect(err.message.includes(AuthErrorMessage.unexpectedError.desc)).toBe(true);
        expect(err.name).toBe("AuthError");
        expect(err.stack?.includes("AuthError.spec.ts")).toBe(true);
    });

    it("setCorrelationId adds the provided correlationId to the error object", () => {
        const TEST_ERROR_CODE: string = "test";
        const TEST_ERROR_MSG: string = "This is a test error";
        const err = new AuthError(TEST_ERROR_CODE, TEST_ERROR_MSG);
        err.setCorrelationId(TEST_CONFIG.CORRELATION_ID);

        expect(err.errorCode).toBe(TEST_ERROR_CODE);
        expect(err.errorMessage).toBe(TEST_ERROR_MSG);
        expect(err.correlationId).toBe(TEST_CONFIG.CORRELATION_ID)
        expect(err.message).toBe(`${TEST_ERROR_CODE}: ${TEST_ERROR_MSG}`);
        expect(err.name).toBe("AuthError");
        expect(err.stack?.includes("AuthError.spec.ts")).toBe(true);
    });
});
