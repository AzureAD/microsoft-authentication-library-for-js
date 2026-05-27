import {
    BrowserAuthError,
    createBrowserAuthError,
    BrowserAuthErrorCodes,
    getDefaultErrorMessage,
} from "../../src/error/BrowserAuthError";
import { AuthError } from "@azure/msal-common";

describe("BrowserAuthError Unit Tests", () => {
    for (const key in BrowserAuthErrorCodes) {
        const code =
            BrowserAuthErrorCodes[key as keyof typeof BrowserAuthErrorCodes];
        it(`BrowserAuthError object can be created for code ${code}`, () => {
            const err: BrowserAuthError = createBrowserAuthError(code, "");

            const message = getDefaultErrorMessage(code);
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

    it("createBrowserAuthError sets correlationId when provided", () => {
        const TEST_CORRELATION_ID = "test-correlation-id";
        const err = createBrowserAuthError(
            BrowserAuthErrorCodes.emptyNavigateUri,
            TEST_CORRELATION_ID
        );
        expect(err.correlationId).toBe(TEST_CORRELATION_ID);
    });
});
