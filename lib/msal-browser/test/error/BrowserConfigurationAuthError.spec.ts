import { AuthError } from "@azure/msal-common";
import {
    BrowserConfigurationAuthError,
    BrowserConfigurationAuthErrorCodes,
    BrowserConfigurationAuthErrorMessages,
    createBrowserConfigurationAuthError,
} from "../../src/error/BrowserConfigurationAuthError";

describe("BrowserConfigurationAuthError Unit Tests", () => {
    for (const key in BrowserConfigurationAuthErrorCodes) {
        const code =
            BrowserConfigurationAuthErrorCodes[
                key as keyof typeof BrowserConfigurationAuthErrorCodes
            ];
        it(`BrowserConfigurationAuthError object can be created for code ${code}`, () => {
            const err: BrowserConfigurationAuthError =
                createBrowserConfigurationAuthError(code);

            const message = BrowserConfigurationAuthErrorMessages[code];
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
});
