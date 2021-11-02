import { BrowserAuthError, BrowserAuthErrorMessage } from "../../src/error/BrowserAuthError";
import { AuthError } from "@azure/msal-common";

describe("BrowserAuthError Unit Tests", () => {

    it("BrowserAuthError object can be created", () => {
        const TEST_ERROR_CODE: string = "test";
        const TEST_ERROR_MSG: string = "This is a test error";
        const err: BrowserAuthError = new BrowserAuthError(TEST_ERROR_CODE, TEST_ERROR_MSG);
        
        expect(err instanceof BrowserAuthError).toBe(true);
        expect(err instanceof AuthError).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err.errorCode).toBe(TEST_ERROR_CODE);
        expect(err.errorMessage).toBe(TEST_ERROR_MSG);
        expect(err.message).toBe(`${TEST_ERROR_CODE}: ${TEST_ERROR_MSG}`);
        expect(err.name).toBe("BrowserAuthError");
        expect(err.stack?.includes("BrowserAuthError.spec.ts")).toBe(true);
    });

    it("createNonBrowserEnvironmentError()", () => {
        const err: BrowserAuthError = BrowserAuthError.createNonBrowserEnvironmentError();

        expect(err instanceof BrowserAuthError).toBe(true);
        expect(err instanceof AuthError).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err.errorCode).toBe(BrowserAuthErrorMessage.notInBrowserEnvironment.code);
        expect(err.errorMessage.includes(BrowserAuthErrorMessage.notInBrowserEnvironment.desc)).toBe(true);
        expect(err.message.includes(BrowserAuthErrorMessage.notInBrowserEnvironment.desc)).toBe(true);
        expect(err.name).toBe("BrowserAuthError");
        expect(err.stack?.includes("BrowserAuthError.spec.ts")).toBe(true);
    });

    it("createPkceNotGeneratedError()", () => {
        const err: BrowserAuthError = BrowserAuthError.createPkceNotGeneratedError("PKCE Error detail.");

        expect(err instanceof BrowserAuthError).toBe(true);
        expect(err instanceof AuthError).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err.errorCode).toBe(BrowserAuthErrorMessage.pkceNotGenerated.code);
        expect(err.errorMessage?.includes(BrowserAuthErrorMessage.pkceNotGenerated.desc)).toBe(true);
        expect(err.message?.includes(BrowserAuthErrorMessage.pkceNotGenerated.desc)).toBe(true);
        expect(err.name).toBe("BrowserAuthError");
        expect(err.stack?.includes("BrowserAuthError.spec.ts")).toBe(true);
    });

    it("createCryptoNotAvailableError()", () => {
        const err: BrowserAuthError = BrowserAuthError.createCryptoNotAvailableError("Crypto unavailable error detail.");

        expect(err instanceof BrowserAuthError).toBe(true);
        expect(err instanceof AuthError).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err.errorCode).toBe(BrowserAuthErrorMessage.cryptoDoesNotExist.code);
        expect(err.errorMessage?.includes(BrowserAuthErrorMessage.cryptoDoesNotExist.desc)).toBe(true);
        expect(err.message?.includes(BrowserAuthErrorMessage.cryptoDoesNotExist.desc)).toBe(true);
        expect(err.name).toBe("BrowserAuthError");
        expect(err.stack?.includes("BrowserAuthError.spec.ts")).toBe(true);
    });

    it("createHttpMethodNotImplementedError()", () => {
        const err: BrowserAuthError = BrowserAuthError.createHttpMethodNotImplementedError("Crypto unavailable error detail.");

        expect(err instanceof BrowserAuthError).toBe(true);
        expect(err instanceof AuthError).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err.errorCode).toBe(BrowserAuthErrorMessage.httpMethodNotImplementedError.code);
        expect(err.errorMessage.includes(BrowserAuthErrorMessage.httpMethodNotImplementedError.desc)).toBe(true);
        expect(err.message.includes(BrowserAuthErrorMessage.httpMethodNotImplementedError.desc)).toBe(true);
        expect(err.name).toBe("BrowserAuthError");
        expect(err.stack?.includes("BrowserAuthError.spec.ts")).toBe(true);
    });

    it("createEmptyNavigationUriError()", () => {
        const err: BrowserAuthError = BrowserAuthError.createEmptyNavigationUriError();

        expect(err instanceof BrowserAuthError).toBe(true);
        expect(err instanceof AuthError).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err.errorCode).toBe(BrowserAuthErrorMessage.emptyNavigateUriError.code);
        expect(err.errorMessage.includes(BrowserAuthErrorMessage.emptyNavigateUriError.desc)).toBe(true);
        expect(err.message.includes(BrowserAuthErrorMessage.emptyNavigateUriError.desc)).toBe(true);
        expect(err.name).toBe("BrowserAuthError");
        expect(err.stack?.includes("BrowserAuthError.spec.ts")).toBe(true);
    });

    it("createEmptyHashError()", () => {
        const err: BrowserAuthError = BrowserAuthError.createEmptyHashError("");

        expect(err instanceof BrowserAuthError).toBe(true);
        expect(err instanceof AuthError).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err.errorCode).toBe(BrowserAuthErrorMessage.hashEmptyError.code);
        expect(err.errorMessage?.includes(BrowserAuthErrorMessage.hashEmptyError.desc)).toBe(true);
        expect(err.message?.includes(BrowserAuthErrorMessage.hashEmptyError.desc)).toBe(true);
        expect(err.name).toBe("BrowserAuthError");
        expect(err.stack?.includes("BrowserAuthError.spec.ts")).toBe(true);
    });

    it("createInteractionInProgressError()", () => {
        const err: BrowserAuthError = BrowserAuthError.createInteractionInProgressError();

        expect(err instanceof BrowserAuthError).toBe(true);
        expect(err instanceof AuthError).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err.errorCode).toBe(BrowserAuthErrorMessage.interactionInProgress.code);
        expect(err.errorMessage.includes(BrowserAuthErrorMessage.interactionInProgress.desc)).toBe(true);
        expect(err.message.includes(BrowserAuthErrorMessage.interactionInProgress.desc)).toBe(true);
        expect(err.name).toBe("BrowserAuthError");
        expect(err.stack?.includes("BrowserAuthError.spec.ts")).toBe(true);
    });

    it("createPopupWindowError()", () => {
        const err: BrowserAuthError = BrowserAuthError.createPopupWindowError();

        expect(err instanceof BrowserAuthError).toBe(true);
        expect(err instanceof AuthError).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err.errorCode).toBe(BrowserAuthErrorMessage.popupWindowError.code);
        expect(err.errorMessage?.includes(BrowserAuthErrorMessage.popupWindowError.desc)).toBe(true);
        expect(err.message?.includes(BrowserAuthErrorMessage.popupWindowError.desc)).toBe(true);
        expect(err.name).toBe("BrowserAuthError");
        expect(err.stack?.includes("BrowserAuthError.spec.ts")).toBe(true);
    });

    it("createPopupWindowError() with error message", () => {
        const testErrMessage = "Test Error message";
        const err: BrowserAuthError = BrowserAuthError.createPopupWindowError(testErrMessage);

        expect(err instanceof BrowserAuthError).toBe(true);
        expect(err instanceof AuthError).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err.errorCode).toBe(BrowserAuthErrorMessage.popupWindowError.code);
        expect(err.errorMessage?.includes(BrowserAuthErrorMessage.popupWindowError.desc)).toBe(true);
        expect(err.errorMessage?.includes(testErrMessage)).toBe(true);
        expect(err.message?.includes(BrowserAuthErrorMessage.popupWindowError.desc)).toBe(true);
        expect(err.message?.includes(testErrMessage)).toBe(true);
        expect(err.name).toBe("BrowserAuthError");
        expect(err.stack?.includes("BrowserAuthError.spec.ts")).toBe(true);
    });

    it("createEmptyWindowCreatedError()", () => {
        const err: BrowserAuthError = BrowserAuthError.createEmptyWindowCreatedError();

        expect(err instanceof BrowserAuthError).toBe(true);
        expect(err instanceof AuthError).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err.errorCode).toBe(BrowserAuthErrorMessage.emptyWindowError.code);
        expect(err.errorMessage?.includes(BrowserAuthErrorMessage.emptyWindowError.desc)).toBe(true);
        expect(err.message?.includes(BrowserAuthErrorMessage.emptyWindowError.desc)).toBe(true);
        expect(err.name).toBe("BrowserAuthError");
        expect(err.stack?.includes("BrowserAuthError.spec.ts")).toBe(true);
    });

    it("createUserCancelledError()", () => {
        const err: BrowserAuthError = BrowserAuthError.createUserCancelledError();

        expect(err instanceof BrowserAuthError).toBe(true);
        expect(err instanceof AuthError).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err.errorCode).toBe(BrowserAuthErrorMessage.userCancelledError.code);
        expect(err.errorMessage?.includes(BrowserAuthErrorMessage.userCancelledError.desc)).toBe(true);
        expect(err.message?.includes(BrowserAuthErrorMessage.userCancelledError.desc)).toBe(true);
        expect(err.name).toBe("BrowserAuthError");
        expect(err.stack?.includes("BrowserAuthError.spec.ts")).toBe(true);
    });

    it("createMonitorPopupTimeoutError()", () => {
        const err: BrowserAuthError = BrowserAuthError.createMonitorPopupTimeoutError();

        expect(err instanceof BrowserAuthError).toBe(true);
        expect(err instanceof AuthError).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err.errorCode).toBe(BrowserAuthErrorMessage.monitorPopupTimeoutError.code);
        expect(err.errorMessage.includes(BrowserAuthErrorMessage.monitorPopupTimeoutError.desc)).toBe(true);
        expect(err.message.includes(BrowserAuthErrorMessage.monitorPopupTimeoutError.desc)).toBe(true);
        expect(err.name).toBe("BrowserAuthError");
        expect(err.stack?.includes("BrowserAuthError.spec.ts")).toBe(true);
    });

    it("createMonitorIframeTimeoutError()", () => {
        const err: BrowserAuthError = BrowserAuthError.createMonitorIframeTimeoutError();

        expect(err instanceof BrowserAuthError).toBe(true);
        expect(err instanceof AuthError).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err.errorCode).toBe(BrowserAuthErrorMessage.monitorIframeTimeoutError.code);
        expect(err.errorMessage.includes(BrowserAuthErrorMessage.monitorIframeTimeoutError.desc)).toBe(true);
        expect(err.message.includes(BrowserAuthErrorMessage.monitorIframeTimeoutError.desc)).toBe(true);
        expect(err.name).toBe("BrowserAuthError");
        expect(err.stack?.includes("BrowserAuthError.spec.ts")).toBe(true);
    });

    it("createRedirectInIframeError()", () => {
        const err: BrowserAuthError = BrowserAuthError.createRedirectInIframeError(false);

        expect(err instanceof BrowserAuthError).toBe(true);
        expect(err instanceof AuthError).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err.errorCode).toBe(BrowserAuthErrorMessage.redirectInIframeError.code);
        expect(err.errorMessage.includes(BrowserAuthErrorMessage.redirectInIframeError.desc)).toBe(true);
        expect(err.message.includes(BrowserAuthErrorMessage.redirectInIframeError.desc)).toBe(true);
        expect(err.name).toBe("BrowserAuthError");
        expect(err.stack?.includes("BrowserAuthError.spec.ts")).toBe(true);
    });

    it("createBlockReloadInHiddenIframeError()", () => {
        const err: BrowserAuthError = BrowserAuthError.createBlockReloadInHiddenIframeError();

        expect(err instanceof BrowserAuthError).toBe(true);
        expect(err instanceof AuthError).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err.errorCode).toBe(BrowserAuthErrorMessage.blockTokenRequestsInHiddenIframeError.code);
        expect(err.errorMessage.includes(BrowserAuthErrorMessage.blockTokenRequestsInHiddenIframeError.desc)).toBe(true);
        expect(err.message.includes(BrowserAuthErrorMessage.blockTokenRequestsInHiddenIframeError.desc)).toBe(true);
        expect(err.name).toBe("BrowserAuthError");
        expect(err.stack?.includes("BrowserAuthError.spec.ts")).toBe(true);
    });

    it("createIframeClosedPrematurelyError()", () => {
        const err: BrowserAuthError = BrowserAuthError.createIframeClosedPrematurelyError();

        expect(err instanceof BrowserAuthError).toBe(true);
        expect(err instanceof AuthError).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err.errorCode).toBe(BrowserAuthErrorMessage.iframeClosedPrematurelyError.code);
        expect(err.errorMessage.includes(BrowserAuthErrorMessage.iframeClosedPrematurelyError.desc)).toBe(true);
        expect(err.message.includes(BrowserAuthErrorMessage.iframeClosedPrematurelyError.desc)).toBe(true);
        expect(err.name).toBe("BrowserAuthError");
        expect(err.stack?.includes("BrowserAuthError.spec.ts")).toBe(true);
    });

    it("createSilentPromptValueError()", () => {
        const promptVal = "notAPrompt";
        const err: BrowserAuthError = BrowserAuthError.createSilentPromptValueError(promptVal);

        expect(err instanceof BrowserAuthError).toBe(true);
        expect(err instanceof AuthError).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err.errorCode).toBe(BrowserAuthErrorMessage.silentPromptValueError.code);
        expect(err.errorMessage?.includes(promptVal)).toBe(true);
        expect(err.errorMessage.includes(BrowserAuthErrorMessage.silentPromptValueError.desc)).toBe(true);
        expect(err.message?.includes(promptVal)).toBe(true);
        expect(err.message.includes(BrowserAuthErrorMessage.silentPromptValueError.desc)).toBe(true);
        expect(err.name).toBe("BrowserAuthError");
        expect(err.stack?.includes("BrowserAuthError.spec.ts")).toBe(true);
    });
	
    it("createNoTokenRequestCacheError creates a ClientAuthError object", () => {
        const err: BrowserAuthError = BrowserAuthError.createNoTokenRequestCacheError();

        expect(err instanceof BrowserAuthError).toBe(true);
        expect(err instanceof AuthError).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err.errorCode).toBe(BrowserAuthErrorMessage.noTokenRequestCacheError.code);
        expect(err.errorMessage.includes(BrowserAuthErrorMessage.noTokenRequestCacheError.desc)).toBe(true);
        expect(err.message.includes(BrowserAuthErrorMessage.noTokenRequestCacheError.desc)).toBe(true);
        expect(err.name).toBe("BrowserAuthError");
        expect(err.stack?.includes("BrowserAuthError.spec.ts")).toBe(true);
    });

    it("createInvalidCacheTypeError()", () => {
        const err: BrowserAuthError = BrowserAuthError.createInvalidCacheTypeError();

        expect(err instanceof BrowserAuthError).toBe(true);
        expect(err instanceof AuthError).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err.errorCode).toBe(BrowserAuthErrorMessage.invalidCacheType.code);
        expect(err.errorMessage?.includes(BrowserAuthErrorMessage.invalidCacheType.desc)).toBe(true);
        expect(err.message?.includes(BrowserAuthErrorMessage.invalidCacheType.desc)).toBe(true);
        expect(err.name).toBe("BrowserAuthError");
        expect(err.stack?.includes("BrowserAuthError.spec.ts")).toBe(true);
    });

    it("createUnableToLoadTokenError()", () => {
        const err: BrowserAuthError = BrowserAuthError.createUnableToLoadTokenError("Load Token Error Detail");

        expect(err instanceof BrowserAuthError).toBe(true);
        expect(err instanceof AuthError).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err.errorCode).toBe(BrowserAuthErrorMessage.unableToLoadTokenError.code);
        expect(err.errorMessage?.includes(BrowserAuthErrorMessage.unableToLoadTokenError.desc)).toBe(true);
        expect(err.message?.includes(BrowserAuthErrorMessage.unableToLoadTokenError.desc)).toBe(true);
        expect(err.name).toBe("BrowserAuthError");
        expect(err.stack?.includes("BrowserAuthError.spec.ts")).toBe(true);
    });

    it("createSigningKeyNotFoundInStorageError()", () => {
        const err: BrowserAuthError = BrowserAuthError.createSigningKeyNotFoundInStorageError("");

        expect(err instanceof BrowserAuthError).toBe(true);
        expect(err instanceof AuthError).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err.errorCode).toBe(BrowserAuthErrorMessage.signingKeyNotFoundInStorage.code);
        expect(err.errorMessage?.includes(BrowserAuthErrorMessage.signingKeyNotFoundInStorage.desc)).toBe(true);
        expect(err.message?.includes(BrowserAuthErrorMessage.signingKeyNotFoundInStorage.desc)).toBe(true);
        expect(err.name).toBe("BrowserAuthError");
        expect(err.stack?.includes("BrowserAuthError.spec.ts")).toBe(true);
    });

    it("createDatabaseUnavailableError()", () => {
        const err: BrowserAuthError = BrowserAuthError.createDatabaseUnavailableError();

        expect(err instanceof BrowserAuthError).toBe(true);
        expect(err instanceof AuthError).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err.errorCode).toBe(BrowserAuthErrorMessage.databaseUnavailable.code);
        expect(err.errorMessage?.includes(BrowserAuthErrorMessage.databaseUnavailable.desc)).toBe(true);
        expect(err.message?.includes(BrowserAuthErrorMessage.databaseUnavailable.desc)).toBe(true);
        expect(err.name).toBe("BrowserAuthError");
        expect(err.stack?.includes("BrowserAuthError.spec.ts")).toBe(true);
    });
});
