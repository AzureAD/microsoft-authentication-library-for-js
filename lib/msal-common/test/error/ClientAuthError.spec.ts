import {
    ClientAuthError,
    ClientAuthErrorCodes,
    createClientAuthError,
} from "../../src/error/ClientAuthError";
import { AuthError, getDefaultErrorMessage } from "../../src/error/AuthError";

describe("ClientAuthError.ts Class Unit Tests", () => {
    for (const key in ClientAuthErrorCodes) {
        const code =
            ClientAuthErrorCodes[key as keyof typeof ClientAuthErrorCodes];
        it(`ClientAuthError object can be created for code ${code}`, () => {
            const err: ClientAuthError = createClientAuthError(code, "");

            const message = getDefaultErrorMessage(code);
            expect(message).toBeTruthy();

            expect(err instanceof ClientAuthError).toBe(true);
            expect(err instanceof AuthError).toBe(true);
            expect(err instanceof Error).toBe(true);
            expect(err.errorCode).toBe(code);
            expect(err.errorMessage).toBe(message);
            expect(err.message).toBe(`${code}: ${message}`);
            expect(err.name).toBe("ClientAuthError");
            expect(err.stack?.includes("ClientAuthError.spec.ts")).toBe(true);
        });
    }

    it("createClientAuthError sets correlationId when provided", () => {
        const TEST_CORRELATION_ID = "test-correlation-id";
        const code = ClientAuthErrorCodes.noAccountFound;
        const err = createClientAuthError(code, TEST_CORRELATION_ID);
        expect(err.correlationId).toBe(TEST_CORRELATION_ID);
        expect(err.errorCode).toBe(code);
    });
});
