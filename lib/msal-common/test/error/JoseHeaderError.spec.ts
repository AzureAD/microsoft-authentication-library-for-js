import { JoseHeaderError, JoseHeaderErrorMessage } from "../../src/error/JoseHeaderError";
import { AuthError } from "../../src/error/AuthError";

describe("JoseHeaderError.ts Class Unit Tests", () => {
    it("JoseHeaderError object can be created", () => {
        const TEST_ERROR_CODE: string = "test";
        const TEST_ERROR_MSG: string = "This is a test error";
        const err: JoseHeaderError = new JoseHeaderError(TEST_ERROR_CODE, TEST_ERROR_MSG);
        expect(err instanceof AuthError).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err.errorMessage).toBe(TEST_ERROR_MSG);
        expect(err.message).toBe(`${TEST_ERROR_CODE}: ${TEST_ERROR_MSG}`);
        expect(err.name).toBe("JoseHeaderError");
        expect(err.stack?.includes("JoseHeaderError.spec.ts")).toBe(true);
    });

    it("createMissingClaimError creates a JoseHeaderError object", () => {
        const err: JoseHeaderError = JoseHeaderError.createMissingClaimError("alg");

        expect(err instanceof JoseHeaderError).toBe(true);
        expect(err instanceof AuthError).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err.errorCode).toBe(JoseHeaderErrorMessage.missingClaimError.code);
        expect(err.errorMessage.includes(`${JoseHeaderErrorMessage.missingClaimError.desc} Missing claim: "alg"`)).toBe(true);
        expect(err.message.includes(JoseHeaderErrorMessage.missingClaimError.desc)).toBe(true);
        expect(err.name).toBe("JoseHeaderError");
        expect(err.stack?.includes("JoseHeaderError.spec.ts")).toBe(true);
    });
});