import { AuthError } from "@azure/msal-common";
import {
    BrowserConfigurationAuthError,
    BrowserConfigurationAuthErrorCodes,
    createBrowserConfigurationAuthError,
} from "../../src/error/BrowserConfigurationAuthError";
import { getDefaultErrorMessage } from "../../src/error/BrowserAuthError.js";

describe("BrowserConfigurationAuthError Unit Tests", () => {
    for (const key in BrowserConfigurationAuthErrorCodes) {
        const code =
            BrowserConfigurationAuthErrorCodes[
                key as keyof typeof BrowserConfigurationAuthErrorCodes
            ];
        it(`BrowserConfigurationAuthError object can be created for code ${code}`, () => {
            const err: BrowserConfigurationAuthError =
                createBrowserConfigurationAuthError(code);

            const message = getDefaultErrorMessage(code);
            expect(message).toBeTruthy();

            expect(err instanceof BrowserConfigurationAuthError).toBe(true);
            expect(err instanceof AuthError).toBe(true);
            expect(err instanceof Error).toBe(true);
            expect(err.errorCode).toBe(code);
            expect(err.errorMessage).toBe(message);
            expect(err.message).toBe(`${code}: ${message}`);
            expect(err.name).toBe("BrowserConfigurationAuthError");
            expect(
                err.stack?.includes("BrowserConfigurationAuthError.spec.ts")
            ).toBe(true);
        });
    }

    it("createBrowserConfigurationAuthError sets correlationId when provided", () => {
        const TEST_CORRELATION_ID = "test-correlation-id";
        const code =
            BrowserConfigurationAuthErrorCodes.storageNotSupported;
        const err = createBrowserConfigurationAuthError(
            code,
            TEST_CORRELATION_ID
        );
        expect(err.correlationId).toBe(TEST_CORRELATION_ID);
    });

    it("createBrowserConfigurationAuthError leaves correlationId undefined when not provided", () => {
        const err = createBrowserConfigurationAuthError(
            BrowserConfigurationAuthErrorCodes.storageNotSupported
        );
        expect(err.correlationId).toBeUndefined();
    });
});
