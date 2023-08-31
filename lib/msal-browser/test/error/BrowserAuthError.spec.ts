import {
    BrowserAuthError,
    BrowserAuthErrorMessage
} from "../../src/error/BrowserAuthError";
import * as BrowserAuthErrorCodes from "../../src/error/BrowserAuthErrorCodes";
import { AuthError } from "@azure/msal-common";

describe("BrowserAuthError Unit Tests", () => {
    for (const errorCode in BrowserAuthErrorCodes) {
        it(`BrowserAuthError object can be created for code ${errorCode}`, () => {
            const err: BrowserAuthError = new BrowserAuthError(
                errorCode
            );

            const message = BrowserAuthErrorMessage[errorCode];
            expect(message).toBeTruthy();

            expect(err instanceof BrowserAuthError).toBe(true);
            expect(err instanceof AuthError).toBe(true);
            expect(err instanceof Error).toBe(true);
            expect(err.errorCode).toBe(errorCode);
            expect(err.errorMessage).toBe(message);
            expect(err.message).toBe(`${errorCode}: ${message}`);
            expect(err.name).toBe("BrowserAuthError");
            expect(err.stack?.includes("BrowserAuthError.spec.ts")).toBe(true);
        });
    }
});
