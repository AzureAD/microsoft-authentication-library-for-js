import {
    BrowserAuthError,
    BrowserAuthErrorMessages
} from "../../src/error/BrowserAuthError";
import * as BrowserAuthErrorCodes from "../../src/error/BrowserAuthErrorCodes";
import { AuthError } from "@azure/msal-common";

describe("BrowserAuthError Unit Tests", () => {
    for (const key in BrowserAuthErrorCodes) {
        const code = BrowserAuthErrorCodes[key as keyof typeof BrowserAuthErrorCodes];
        it(`BrowserAuthError object can be created for code ${code}`, () => {
            const err: BrowserAuthError = new BrowserAuthError(
                code
            );

            const message = BrowserAuthErrorMessages[code];
            expect(message).toBeTruthy();

            expect(err instanceof BrowserAuthError).toBe(true);
            expect(err instanceof AuthError).toBe(true);
            expect(err instanceof Error).toBe(true);
            expect(err.errorCode).toBe(code);
            expect(err.errorMessage).toBe(message);
            expect(err.message).toBe(`${code}: ${message}`);
            expect(err.name).toBe("BrowserAuthError");
            expect(err.stack?.includes("BrowserAuthError.spec.ts")).toBe(true);
        });
    }
});
