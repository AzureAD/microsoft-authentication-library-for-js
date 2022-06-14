import { ValidationConfigurationError, ValidationConfigurationErrorMessage } from "../../src/error/ValidationConfigurationError";
import { ClientConfigurationError } from "@azure/msal-common"; 

describe("ValidationConfigurationError", () => {

    it("ValidationError object can be created", () => {
        const TEST_ERROR_CODE: string = "test";
        const TEST_ERROR_MESSAGE: string = "This is a test error";
        const err: ValidationConfigurationError = new ValidationConfigurationError(TEST_ERROR_CODE, TEST_ERROR_MESSAGE);

        expect(err instanceof ValidationConfigurationError).toBe(true);
        expect(err instanceof ClientConfigurationError).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err.errorCode).toBe(TEST_ERROR_CODE);
        expect(err.errorMessage).toBe(TEST_ERROR_MESSAGE);
        expect(err.message).toBe(`${TEST_ERROR_CODE}: ${TEST_ERROR_MESSAGE}`);
        expect(err.name).toBe("ValidationConfigurationError");
        expect(err.stack?.includes("ValidationConfigurationError.spec.ts")).toBe(true);
    });
    
    it("createMissingTokenError creates a ValidationConfigurationError object", () => {
        const err: ValidationConfigurationError = ValidationConfigurationError.createMissingTokenError();

        expect(err instanceof ValidationConfigurationError).toBe(true);
        expect(err instanceof ClientConfigurationError).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err.errorCode).toBe(ValidationConfigurationErrorMessage.missingToken.code);
        expect(err.errorMessage.includes(ValidationConfigurationErrorMessage.missingToken.desc)).toBe(true);
        expect(err.message.includes(ValidationConfigurationErrorMessage.missingToken.desc)).toBe(true);
        expect(err.name).toBe("ValidationConfigurationError");
        expect(err.stack?.includes("ValidationConfigurationError.spec.ts")).toBe(true);
    });
    
    it("createEmptyIssuerError creates a ValidationConfigurationError object", () => {
        const err: ValidationConfigurationError = ValidationConfigurationError.createEmptyIssuerError();

        expect(err instanceof ValidationConfigurationError).toBe(true);
        expect(err instanceof ClientConfigurationError).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err.errorCode).toBe(ValidationConfigurationErrorMessage.emptyIssuer.code);
        expect(err.errorMessage.includes(ValidationConfigurationErrorMessage.emptyIssuer.desc)).toBe(true);
        expect(err.message.includes(ValidationConfigurationErrorMessage.emptyIssuer.desc)).toBe(true);
        expect(err.name).toBe("ValidationConfigurationError");
        expect(err.stack?.includes("ValidationConfigurationError.spec.ts")).toBe(true);
    });
    
    it("createEmptyAudienceError creates a ValidationConfigurationError object", () => {
        const err: ValidationConfigurationError = ValidationConfigurationError.createEmptyAudienceError();

        expect(err instanceof ValidationConfigurationError).toBe(true);
        expect(err instanceof ClientConfigurationError).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err.errorCode).toBe(ValidationConfigurationErrorMessage.emptyAudience.code);
        expect(err.errorMessage.includes(ValidationConfigurationErrorMessage.emptyAudience.desc)).toBe(true);
        expect(err.message.includes(ValidationConfigurationErrorMessage.emptyAudience.desc)).toBe(true);
        expect(err.name).toBe("ValidationConfigurationError");
        expect(err.stack?.includes("ValidationConfigurationError.spec.ts")).toBe(true);
    });
    
    it("createInvalidMetadataError creates a ValidationConfigurationError object", () => {
        const err: ValidationConfigurationError = ValidationConfigurationError.createInvalidMetadataError();

        expect(err instanceof ValidationConfigurationError).toBe(true);
        expect(err instanceof ClientConfigurationError).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err.errorCode).toBe(ValidationConfigurationErrorMessage.invalidMetadata.code);
        expect(err.errorMessage.includes(ValidationConfigurationErrorMessage.invalidMetadata.desc)).toBe(true);
        expect(err.message.includes(ValidationConfigurationErrorMessage.invalidMetadata.desc)).toBe(true);
        expect(err.name).toBe("ValidationConfigurationError");
        expect(err.stack?.includes("ValidationConfigurationError.spec.ts")).toBe(true);
    });
    
    it("createNegativeClockSkewError creates a ValidationConfigurationError object", () => {
        const err: ValidationConfigurationError = ValidationConfigurationError.createNegativeClockSkewError();

        expect(err instanceof ValidationConfigurationError).toBe(true);
        expect(err instanceof ClientConfigurationError).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err.errorCode).toBe(ValidationConfigurationErrorMessage.negativeClockSkew.code);
        expect(err.errorMessage.includes(ValidationConfigurationErrorMessage.negativeClockSkew.desc)).toBe(true);
        expect(err.message.includes(ValidationConfigurationErrorMessage.negativeClockSkew.desc)).toBe(true);
        expect(err.name).toBe("ValidationConfigurationError");
        expect(err.stack?.includes("ValidationConfigurationError.spec.ts")).toBe(true);
    });

});
