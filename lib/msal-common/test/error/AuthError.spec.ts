import { AuthError, AuthErrorMessage } from "../../src/error/AuthError";
import { TEST_CONFIG } from "../test_kit/StringConstants";

describe("AuthError.ts Class", () => {
    it("AuthError object can be created", () => {
        const TEST_ERROR_CODE: string = "test";
        const TEST_ERROR_MSG: string = "This is a test error";
        const authError = new AuthError(TEST_ERROR_CODE, TEST_ERROR_MSG);
        let err;

        try {
            throw authError;
        } catch (error) {
            err = error;
        }

        expect(err instanceof AuthError).toBe(true);
        expect(err instanceof Error).toBe(true);
        const authErr = err as AuthError;
        expect(authErr.errorCode).toBe(TEST_ERROR_CODE);
        expect(authErr.errorMessage).toBe(TEST_ERROR_MSG);
        expect(authErr.message).toBe(`${TEST_ERROR_CODE}: ${TEST_ERROR_MSG}`);
        expect(authErr.name).toBe("AuthError");
        expect(authErr.stack?.includes("AuthError.spec.ts")).toBe(true);
    });

    it("createUnexpectedError creates a AuthError object", () => {
        const ERROR_DESC = "This is the error";
        const unexpectedError = AuthError.createUnexpectedError(ERROR_DESC);
        let err;

        try {
            throw unexpectedError;
        } catch (error) {
            err = error;
        }

        expect(err instanceof AuthError).toBe(true);
        expect(err instanceof Error).toBe(true);
        const authErr = err as AuthError;
        expect(authErr.errorCode).toBe(AuthErrorMessage.unexpectedError.code);
        expect(
            authErr.errorMessage.includes(AuthErrorMessage.unexpectedError.desc)
        ).toBe(true);
        expect(authErr.errorMessage.includes(ERROR_DESC)).toBe(true);
        expect(
            authErr.message.includes(AuthErrorMessage.unexpectedError.desc)
        ).toBe(true);
        expect(authErr.name).toBe("AuthError");
        expect(authErr.stack?.includes("AuthError.spec.ts")).toBe(true);
    });

    it("setCorrelationId adds the provided correlationId to the error object", () => {
        const TEST_ERROR_CODE: string = "test";
        const TEST_ERROR_MSG: string = "This is a test error";
        const err = new AuthError(TEST_ERROR_CODE, TEST_ERROR_MSG);
        err.setCorrelationId(TEST_CONFIG.CORRELATION_ID);

        expect(err.errorCode).toBe(TEST_ERROR_CODE);
        expect(err.errorMessage).toBe(TEST_ERROR_MSG);
        expect(err.correlationId).toBe(TEST_CONFIG.CORRELATION_ID);
        expect(err.message).toBe(`${TEST_ERROR_CODE}: ${TEST_ERROR_MSG}`);
        expect(err.name).toBe("AuthError");
        expect(err.stack?.includes("AuthError.spec.ts")).toBe(true);
    });
});
