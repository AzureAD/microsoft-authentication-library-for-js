import { AuthError } from "@azure/msal-common";
import { BrowserConfigurationAuthError, BrowserConfigurationAuthErrorMessage } from "../../src/error/BrowserConfigurationAuthError";

describe("BrowserConfigurationAuthError Unit Tests", () => {

    it("BrowserConfigurationAuthError object can be created", () => {
        const TEST_ERROR_CODE: string = "test";
        const TEST_ERROR_MSG: string = "This is a test error";
        const err: BrowserConfigurationAuthError = new BrowserConfigurationAuthError(TEST_ERROR_CODE, TEST_ERROR_MSG);
        
        expect(err instanceof BrowserConfigurationAuthError).toBe(true);
        expect(err instanceof AuthError).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err.errorCode).toBe(TEST_ERROR_CODE);
        expect(err.errorMessage).toBe(TEST_ERROR_MSG);
        expect(err.message).toBe(`${TEST_ERROR_CODE}: ${TEST_ERROR_MSG}`);
        expect(err.name).toBe("BrowserConfigurationAuthError");
        expect(err.stack?.includes("BrowserConfigurationAuthError.spec.ts")).toBe(true);
    });

    it("createStorageNotSupportedError()", () => {
        const err: BrowserConfigurationAuthError = BrowserConfigurationAuthError.createStorageNotSupportedError("notAStorageLocation");

        expect(err instanceof BrowserConfigurationAuthError).toBe(true);
        expect(err instanceof AuthError).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err.errorCode).toBe(BrowserConfigurationAuthErrorMessage.storageNotSupportedError.code);
        expect(err.errorMessage.includes(BrowserConfigurationAuthErrorMessage.storageNotSupportedError.desc)).toBe(true);
        expect(err.message.includes(BrowserConfigurationAuthErrorMessage.storageNotSupportedError.desc)).toBe(true);
        expect(err.name).toBe("BrowserConfigurationAuthError");
        expect(err.stack?.includes("BrowserConfigurationAuthError.spec.ts")).toBe(true);
    });

    it("createRedirectCallbacksNotSetError()", () => {
        const err: BrowserConfigurationAuthError = BrowserConfigurationAuthError.createRedirectCallbacksNotSetError();

        expect(err instanceof BrowserConfigurationAuthError).toBe(true);
        expect(err instanceof AuthError).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err.errorCode).toBe(BrowserConfigurationAuthErrorMessage.noRedirectCallbacksSet.code);
        expect(err.errorMessage.includes(BrowserConfigurationAuthErrorMessage.noRedirectCallbacksSet.desc)).toBe(true);
        expect(err.message.includes(BrowserConfigurationAuthErrorMessage.noRedirectCallbacksSet.desc)).toBe(true);
        expect(err.name).toBe("BrowserConfigurationAuthError");
        expect(err.stack?.includes("BrowserConfigurationAuthError.spec.ts")).toBe(true);
    });
});
