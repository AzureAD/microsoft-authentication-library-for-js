import {
    JoseHeaderError,
    JoseHeaderErrorCodes,
    createJoseHeaderError,
} from "../../src/error/JoseHeaderError";
import { AuthError, getDefaultErrorMessage } from "../../src/error/AuthError";

describe("JoseHeaderError.ts Class Unit Tests", () => {
    for (const key in JoseHeaderErrorCodes) {
        const code =
            JoseHeaderErrorCodes[key as keyof typeof JoseHeaderErrorCodes];
        it(`JoseHeaderError object can be created for code ${code}`, () => {
            const err: JoseHeaderError = createJoseHeaderError(code, "");

            const message = getDefaultErrorMessage(code);
            expect(message).toBeTruthy();

            expect(err instanceof JoseHeaderError).toBe(true);
            expect(err instanceof AuthError).toBe(true);
            expect(err instanceof Error).toBe(true);
            expect(err.errorCode).toBe(code);
            expect(err.errorMessage).toBe(message);
            expect(err.message).toBe(`${code}: ${message}`);
            expect(err.name).toBe("JoseHeaderError");
            expect(err.stack?.includes("JoseHeaderError.spec.ts")).toBe(true);
        });
    }
});
