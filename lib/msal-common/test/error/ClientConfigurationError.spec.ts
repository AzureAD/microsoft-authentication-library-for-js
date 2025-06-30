import { AuthError } from "../../src/error/AuthError";
import {
    ClientConfigurationError,
    ClientConfigurationErrorCodes,
    ClientConfigurationErrorMessages,
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

            const message = ClientConfigurationErrorMessages[code];
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
});
