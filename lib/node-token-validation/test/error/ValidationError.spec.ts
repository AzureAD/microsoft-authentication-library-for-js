import { ValidationError, ValidationErrorMessage } from "../../src/error/ValidationError";
import { AuthError } from "@azure/msal-common"; 

describe("ValidationError", () => {

    it("ValidationError object can be created", () => {
        const TEST_ERROR_CODE: string = "test";
        const TEST_ERROR_MESSAGE: string = "This is a test error";
        const err: ValidationError = new ValidationError(TEST_ERROR_CODE, TEST_ERROR_MESSAGE);

        expect(err instanceof ValidationError).toBe(true);
        expect(err instanceof AuthError).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err.errorCode).toBe(TEST_ERROR_CODE);
        expect(err.errorMessage).toBe(TEST_ERROR_MESSAGE);
        expect(err.message).toBe(`${TEST_ERROR_CODE}: ${TEST_ERROR_MESSAGE}`);
        expect(err.name).toBe("ValidationError");
        expect(err.stack?.includes("ValidationError.spec.ts")).toBe(true);
    });
    
    it("createInvalidNonceError creates a ValidationError object", () => {
        const err: ValidationError = ValidationError.createInvalidNonceError();

        expect(err instanceof ValidationError).toBe(true);
        expect(err instanceof AuthError).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err.errorCode).toBe(ValidationErrorMessage.invalidNonce.code);
        expect(err.errorMessage.includes(ValidationErrorMessage.invalidNonce.desc)).toBe(true);
        expect(err.message.includes(ValidationErrorMessage.invalidNonce.desc)).toBe(true);
        expect(err.name).toBe("ValidationError");
        expect(err.stack?.includes("ValidationError.spec.ts")).toBe(true);
    });

    it("createInvalidCHashError creates a ValidationError object", () => {
        const err: ValidationError = ValidationError.createInvalidCHashError();

        expect(err instanceof ValidationError).toBe(true);
        expect(err instanceof AuthError).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err.errorCode).toBe(ValidationErrorMessage.invalidCHash.code);
        expect(err.errorMessage.includes(ValidationErrorMessage.invalidCHash.desc)).toBe(true);
        expect(err.message.includes(ValidationErrorMessage.invalidCHash.desc)).toBe(true);
        expect(err.name).toBe("ValidationError");
        expect(err.stack?.includes("ValidationError.spec.ts")).toBe(true);
    });

    it("createInvalidAtHashError creates a ValidationError object", () => {
        const err: ValidationError = ValidationError.createInvalidAtHashError();

        expect(err instanceof ValidationError).toBe(true);
        expect(err instanceof AuthError).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err.errorCode).toBe(ValidationErrorMessage.invalidAtHash.code);
        expect(err.errorMessage.includes(ValidationErrorMessage.invalidAtHash.desc)).toBe(true);
        expect(err.message.includes(ValidationErrorMessage.invalidAtHash.desc)).toBe(true);
        expect(err.name).toBe("ValidationError");
        expect(err.stack?.includes("ValidationError.spec.ts")).toBe(true);
    });

});
