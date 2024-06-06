import {
    AuthError,
    AuthErrorCodes,
    AuthErrorMessages,
    createAuthError,
} from "../../src/error/AuthError";
import { TEST_CONFIG } from "../test_kit/StringConstants";

describe("AuthError.ts Class", () => {
    for (const key in AuthErrorCodes) {
        const code = AuthErrorCodes[key as keyof typeof AuthErrorCodes];
        it(`AuthError object can be created for code ${code}`, () => {
            const err: AuthError = createAuthError(code);

            const message = AuthErrorMessages[code];
            expect(message).toBeTruthy();

            expect(err instanceof AuthError).toBe(true);
            expect(err instanceof AuthError).toBe(true);
            expect(err instanceof Error).toBe(true);
            expect(err.errorCode).toBe(code);
            expect(err.errorMessage).toBe(message);
            expect(err.message).toBe(`${code}: ${message}`);
            expect(err.name).toBe("AuthError");
            expect(err.stack?.includes("AuthError.spec.ts")).toBe(true);
        });
    }

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
