import {
    ClientAuthError,
    ClientAuthErrorCodes,
    ClientAuthErrorMessages,
    createClientAuthError,
} from "../../src/error/ClientAuthError";
import { AuthError } from "../../src/error/AuthError";

describe("ClientAuthError.ts Class Unit Tests", () => {
    for (const key in ClientAuthErrorCodes) {
        const code =
            ClientAuthErrorCodes[key as keyof typeof ClientAuthErrorCodes];
        it(`ClientAuthError object can be created for code ${code}`, () => {
            const err: ClientAuthError = createClientAuthError(code);

            const message = ClientAuthErrorMessages[code];
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
});
