import { AuthError, getDefaultErrorMessage } from "../../src/error/AuthError";
import {
    ClientConfigurationError,
    ClientConfigurationErrorCodes,
    createClientConfigurationError,
} from "../../src/error/ClientConfigurationError";

describe("ClientConfigurationError.ts Class Unit Tests", () => {
    for (const key in ClientConfigurationErrorCodes) {
        const code =
            ClientConfigurationErrorCodes[
                key as keyof typeof ClientConfigurationErrorCodes
            ];
        it(`ClientConfigurationError object can be created for code ${code}`, () => {
            const err: ClientConfigurationError =
                createClientConfigurationError(code);

            const message = getDefaultErrorMessage(code);
            expect(message).toBeTruthy();

            expect(err instanceof ClientConfigurationError).toBe(true);
            expect(err instanceof AuthError).toBe(true);
            expect(err instanceof Error).toBe(true);
            expect(err.errorCode).toBe(code);
            expect(err.errorMessage).toBe(message);
            expect(err.message).toBe(`${code}: ${message}`);
            expect(err.name).toBe("ClientConfigurationError");
            expect(
                err.stack?.includes("ClientConfigurationError.spec.ts")
            ).toBe(true);
        });
    }

    it("createClientConfigurationError sets correlationId when provided", () => {
        const TEST_CORRELATION_ID = "test-correlation-id";
        const code = ClientConfigurationErrorCodes.redirectUriEmpty;
        const err = createClientConfigurationError(code, TEST_CORRELATION_ID);
        expect(err.correlationId).toBe(TEST_CORRELATION_ID);
        expect(err.errorCode).toBe(code);
    });

    it("createClientConfigurationError leaves correlationId undefined when not provided", () => {
        const err = createClientConfigurationError(
            ClientConfigurationErrorCodes.redirectUriEmpty
        );
        expect(err.correlationId).toBeUndefined();
    });
});
