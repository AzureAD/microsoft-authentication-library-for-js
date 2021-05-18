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
        expect(err.stack).toEqual(expect.arrayContaining(["BrowserAuthError.spec.ts"]));
    });

    it("createNonBrowserEnvironmentError()", () => {
        const err: BrowserAuthError = BrowserAuthError.createNonBrowserEnvironmentError();

        expect(err instanceof BrowserAuthError).toBe(true);
        expect(err instanceof AuthError).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err.errorCode).toBe(BrowserAuthErrorMessage.notInBrowserEnvironment.code);
        expect(err.errorMessage).toEqual(
            expect.arrayContaining([BrowserAuthErrorMessage.notInBrowserEnvironment.desc])
        );
        expect(err.message).toEqual(
            expect.arrayContaining([BrowserAuthErrorMessage.notInBrowserEnvironment.desc])
        );
        expect(err.name).toBe("BrowserAuthError");
        expect(err.stack).toEqual(expect.arrayContaining(["BrowserAuthError.spec.ts"]));
    });

    it("createPkceNotGeneratedError()", () => {
        const err: BrowserAuthError = BrowserAuthError.createPkceNotGeneratedError("PKCE Error detail.");

        expect(err instanceof BrowserAuthError).toBe(true);
        expect(err instanceof AuthError).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err.errorCode).toBe(BrowserAuthErrorMessage.pkceNotGenerated.code);
        expect(err.errorMessage).toEqual(expect.arrayContaining([BrowserAuthErrorMessage.pkceNotGenerated.desc]));
        expect(err.message).toEqual(expect.arrayContaining([BrowserAuthErrorMessage.pkceNotGenerated.desc]));
        expect(err.name).toBe("BrowserAuthError");
        expect(err.stack).toEqual(expect.arrayContaining(["BrowserAuthError.spec.ts"]));
    });

    it("createCryptoNotAvailableError()", () => {
        const err: BrowserAuthError = BrowserAuthError.createCryptoNotAvailableError("Crypto unavailable error detail.");

        expect(err instanceof BrowserAuthError).toBe(true);
        expect(err instanceof AuthError).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err.errorCode).toBe(BrowserAuthErrorMessage.cryptoDoesNotExist.code);
        expect(err.errorMessage).toEqual(expect.arrayContaining([BrowserAuthErrorMessage.cryptoDoesNotExist.desc]));
        expect(err.message).toEqual(expect.arrayContaining([BrowserAuthErrorMessage.cryptoDoesNotExist.desc]));
        expect(err.name).toBe("BrowserAuthError");
        expect(err.stack).toEqual(expect.arrayContaining(["BrowserAuthError.spec.ts"]));
    });

    it("createHttpMethodNotImplementedError()", () => {
        const err: BrowserAuthError = BrowserAuthError.createHttpMethodNotImplementedError("Crypto unavailable error detail.");

        expect(err instanceof BrowserAuthError).toBe(true);
        expect(err instanceof AuthError).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err.errorCode).toBe(BrowserAuthErrorMessage.httpMethodNotImplementedError.code);
        expect(err.errorMessage).toEqual(
            expect.arrayContaining([BrowserAuthErrorMessage.httpMethodNotImplementedError.desc])
        );
        expect(err.message).toEqual(
            expect.arrayContaining([BrowserAuthErrorMessage.httpMethodNotImplementedError.desc])
        );
        expect(err.name).toBe("BrowserAuthError");
        expect(err.stack).toEqual(expect.arrayContaining(["BrowserAuthError.spec.ts"]));
    });

    it("createEmptyNavigationUriError()", () => {
        const err: BrowserAuthError = BrowserAuthError.createEmptyNavigationUriError();

        expect(err instanceof BrowserAuthError).toBe(true);
        expect(err instanceof AuthError).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err.errorCode).toBe(BrowserAuthErrorMessage.emptyNavigateUriError.code);
        expect(err.errorMessage).toEqual(
            expect.arrayContaining([BrowserAuthErrorMessage.emptyNavigateUriError.desc])
        );
        expect(err.message).toEqual(
            expect.arrayContaining([BrowserAuthErrorMessage.emptyNavigateUriError.desc])
        );
        expect(err.name).toBe("BrowserAuthError");
        expect(err.stack).toEqual(expect.arrayContaining(["BrowserAuthError.spec.ts"]));
    });

    it("createEmptyHashError()", () => {
        const err: BrowserAuthError = BrowserAuthError.createEmptyHashError("");

        expect(err instanceof BrowserAuthError).toBe(true);
        expect(err instanceof AuthError).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err.errorCode).toBe(BrowserAuthErrorMessage.hashEmptyError.code);
        expect(err.errorMessage).toEqual(expect.arrayContaining([BrowserAuthErrorMessage.hashEmptyError.desc]));
        expect(err.message).toEqual(expect.arrayContaining([BrowserAuthErrorMessage.hashEmptyError.desc]));
        expect(err.name).toBe("BrowserAuthError");
        expect(err.stack).toEqual(expect.arrayContaining(["BrowserAuthError.spec.ts"]));
    });

    it("createInteractionInProgressError()", () => {
        const err: BrowserAuthError = BrowserAuthError.createInteractionInProgressError();

        expect(err instanceof BrowserAuthError).toBe(true);
        expect(err instanceof AuthError).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err.errorCode).toBe(BrowserAuthErrorMessage.interactionInProgress.code);
        expect(err.errorMessage).toEqual(
            expect.arrayContaining([BrowserAuthErrorMessage.interactionInProgress.desc])
        );
        expect(err.message).toEqual(
            expect.arrayContaining([BrowserAuthErrorMessage.interactionInProgress.desc])
        );
        expect(err.name).toBe("BrowserAuthError");
        expect(err.stack).toEqual(expect.arrayContaining(["BrowserAuthError.spec.ts"]));
    });

    it("createPopupWindowError()", () => {
        const err: BrowserAuthError = BrowserAuthError.createPopupWindowError();

        expect(err instanceof BrowserAuthError).toBe(true);
        expect(err instanceof AuthError).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err.errorCode).toBe(BrowserAuthErrorMessage.popUpWindowError.code);
        expect(err.errorMessage).toEqual(expect.arrayContaining([BrowserAuthErrorMessage.popUpWindowError.desc]));
        expect(err.message).toEqual(expect.arrayContaining([BrowserAuthErrorMessage.popUpWindowError.desc]));
        expect(err.name).toBe("BrowserAuthError");
        expect(err.stack).toEqual(expect.arrayContaining(["BrowserAuthError.spec.ts"]));
    });

    it("createPopupWindowError() with error message", () => {
        const testErrMessage = "Test Error message";
        const err: BrowserAuthError = BrowserAuthError.createPopupWindowError(testErrMessage);

        expect(err instanceof BrowserAuthError).toBe(true);
        expect(err instanceof AuthError).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err.errorCode).toBe(BrowserAuthErrorMessage.popUpWindowError.code);
        expect(err.errorMessage).toEqual(expect.arrayContaining([BrowserAuthErrorMessage.popUpWindowError.desc]));
        expect(err.errorMessage).toEqual(expect.arrayContaining([testErrMessage]));
        expect(err.message).toEqual(expect.arrayContaining([BrowserAuthErrorMessage.popUpWindowError.desc]));
        expect(err.message).toEqual(expect.arrayContaining([testErrMessage]));
        expect(err.name).toBe("BrowserAuthError");
        expect(err.stack).toEqual(expect.arrayContaining(["BrowserAuthError.spec.ts"]));
    });

    it("createEmptyWindowCreatedError()", () => {
        const err: BrowserAuthError = BrowserAuthError.createEmptyWindowCreatedError();

        expect(err instanceof BrowserAuthError).toBe(true);
        expect(err instanceof AuthError).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err.errorCode).toBe(BrowserAuthErrorMessage.emptyWindowError.code);
        expect(err.errorMessage).toEqual(expect.arrayContaining([BrowserAuthErrorMessage.emptyWindowError.desc]));
        expect(err.message).toEqual(expect.arrayContaining([BrowserAuthErrorMessage.emptyWindowError.desc]));
        expect(err.name).toBe("BrowserAuthError");
        expect(err.stack).toEqual(expect.arrayContaining(["BrowserAuthError.spec.ts"]));
    });

    it("createUserCancelledError()", () => {
        const err: BrowserAuthError = BrowserAuthError.createUserCancelledError();

        expect(err instanceof BrowserAuthError).toBe(true);
        expect(err instanceof AuthError).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err.errorCode).toBe(BrowserAuthErrorMessage.userCancelledError.code);
        expect(err.errorMessage).toEqual(expect.arrayContaining([BrowserAuthErrorMessage.userCancelledError.desc]));
        expect(err.message).toEqual(expect.arrayContaining([BrowserAuthErrorMessage.userCancelledError.desc]));
        expect(err.name).toBe("BrowserAuthError");
        expect(err.stack).toEqual(expect.arrayContaining(["BrowserAuthError.spec.ts"]));
    });

    it("createMonitorPopupTimeoutError()", () => {
        const err: BrowserAuthError = BrowserAuthError.createMonitorPopupTimeoutError();

        expect(err instanceof BrowserAuthError).toBe(true);
        expect(err instanceof AuthError).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err.errorCode).toBe(BrowserAuthErrorMessage.monitorPopupTimeoutError.code);
        expect(err.errorMessage).toEqual(
            expect.arrayContaining([BrowserAuthErrorMessage.monitorPopupTimeoutError.desc])
        );
        expect(err.message).toEqual(
            expect.arrayContaining([BrowserAuthErrorMessage.monitorPopupTimeoutError.desc])
        );
        expect(err.name).toBe("BrowserAuthError");
        expect(err.stack).toEqual(expect.arrayContaining(["BrowserAuthError.spec.ts"]));
    });

    it("createMonitorIframeTimeoutError()", () => {
        const err: BrowserAuthError = BrowserAuthError.createMonitorIframeTimeoutError();

        expect(err instanceof BrowserAuthError).toBe(true);
        expect(err instanceof AuthError).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err.errorCode).toBe(BrowserAuthErrorMessage.monitorIframeTimeoutError.code);
        expect(err.errorMessage).toEqual(
            expect.arrayContaining([BrowserAuthErrorMessage.monitorIframeTimeoutError.desc])
        );
        expect(err.message).toEqual(
            expect.arrayContaining([BrowserAuthErrorMessage.monitorIframeTimeoutError.desc])
        );
        expect(err.name).toBe("BrowserAuthError");
        expect(err.stack).toEqual(expect.arrayContaining(["BrowserAuthError.spec.ts"]));
    });

    it("createRedirectInIframeError()", () => {
        const err: BrowserAuthError = BrowserAuthError.createRedirectInIframeError(false);

        expect(err instanceof BrowserAuthError).toBe(true);
        expect(err instanceof AuthError).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err.errorCode).toBe(BrowserAuthErrorMessage.redirectInIframeError.code);
        expect(err.errorMessage).toEqual(
            expect.arrayContaining([BrowserAuthErrorMessage.redirectInIframeError.desc])
        );
        expect(err.message).toEqual(
            expect.arrayContaining([BrowserAuthErrorMessage.redirectInIframeError.desc])
        );
        expect(err.name).toBe("BrowserAuthError");
        expect(err.stack).toEqual(expect.arrayContaining(["BrowserAuthError.spec.ts"]));
    });

    it("createBlockReloadInHiddenIframeError()", () => {
        const err: BrowserAuthError = BrowserAuthError.createBlockReloadInHiddenIframeError();

        expect(err instanceof BrowserAuthError).toBe(true);
        expect(err instanceof AuthError).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err.errorCode).toBe(BrowserAuthErrorMessage.blockTokenRequestsInHiddenIframeError.code);
        expect(err.errorMessage).toEqual(
            expect.arrayContaining([BrowserAuthErrorMessage.blockTokenRequestsInHiddenIframeError.desc])
        );
        expect(err.message).toEqual(
            expect.arrayContaining([BrowserAuthErrorMessage.blockTokenRequestsInHiddenIframeError.desc])
        );
        expect(err.name).toBe("BrowserAuthError");
        expect(err.stack).toEqual(expect.arrayContaining(["BrowserAuthError.spec.ts"]));
    });

    it("createIframeClosedPrematurelyError()", () => {
        const err: BrowserAuthError = BrowserAuthError.createIframeClosedPrematurelyError();

        expect(err instanceof BrowserAuthError).toBe(true);
        expect(err instanceof AuthError).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err.errorCode).toBe(BrowserAuthErrorMessage.iframeClosedPrematurelyError.code);
        expect(err.errorMessage).toEqual(
            expect.arrayContaining([BrowserAuthErrorMessage.iframeClosedPrematurelyError.desc])
        );
        expect(err.message).toEqual(
            expect.arrayContaining([BrowserAuthErrorMessage.iframeClosedPrematurelyError.desc])
        );
        expect(err.name).toBe("BrowserAuthError");
        expect(err.stack).toEqual(expect.arrayContaining(["BrowserAuthError.spec.ts"]));
    });

    it("createSilentSSOInsufficientInfoError()", () => {
        const err: BrowserAuthError = BrowserAuthError.createSilentSSOInsufficientInfoError();

        expect(err instanceof BrowserAuthError).toBe(true);
        expect(err instanceof AuthError).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err.errorCode).toBe(BrowserAuthErrorMessage.silentSSOInsufficientInfoError.code);
        expect(err.errorMessage).toEqual(
            expect.arrayContaining([BrowserAuthErrorMessage.silentSSOInsufficientInfoError.desc])
        );
        expect(err.message).toEqual(
            expect.arrayContaining([BrowserAuthErrorMessage.silentSSOInsufficientInfoError.desc])
        );
        expect(err.name).toBe("BrowserAuthError");
        expect(err.stack).toEqual(expect.arrayContaining(["BrowserAuthError.spec.ts"]));
    });

    it("createSilentSSOInsufficientInfoError()", () => {
        const promptVal = "notAPrompt";
        const err: BrowserAuthError = BrowserAuthError.createSilentPromptValueError(promptVal);

        expect(err instanceof BrowserAuthError).toBe(true);
        expect(err instanceof AuthError).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err.errorCode).toBe(BrowserAuthErrorMessage.silentPromptValueError.code);
        expect(err.errorMessage).toEqual(expect.arrayContaining([promptVal]));
        expect(err.errorMessage).toEqual(
            expect.arrayContaining([BrowserAuthErrorMessage.silentPromptValueError.desc])
        );
        expect(err.message).toEqual(expect.arrayContaining([promptVal]));
        expect(err.message).toEqual(
            expect.arrayContaining([BrowserAuthErrorMessage.silentPromptValueError.desc])
        );
        expect(err.name).toBe("BrowserAuthError");
        expect(err.stack).toEqual(expect.arrayContaining(["BrowserAuthError.spec.ts"]));
    });
	
    it("createNoTokenRequestCacheError creates a ClientAuthError object", () => {
        const err: BrowserAuthError = BrowserAuthError.createNoTokenRequestCacheError();

        expect(err instanceof BrowserAuthError).toBe(true);
        expect(err instanceof AuthError).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err.errorCode).toBe(BrowserAuthErrorMessage.noTokenRequestCacheError.code);
        expect(err.errorMessage).toEqual(
            expect.arrayContaining([BrowserAuthErrorMessage.noTokenRequestCacheError.desc])
        );
        expect(err.message).toEqual(
            expect.arrayContaining([BrowserAuthErrorMessage.noTokenRequestCacheError.desc])
        );
        expect(err.name).toBe("BrowserAuthError");
        expect(err.stack).toEqual(expect.arrayContaining(["BrowserAuthError.spec.ts"]));
    });

    it("createInvalidCacheTypeError()", () => {
        const err: BrowserAuthError = BrowserAuthError.createInvalidCacheTypeError();

        expect(err instanceof BrowserAuthError).toBe(true);
        expect(err instanceof AuthError).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err.errorCode).toBe(BrowserAuthErrorMessage.invalidCacheType.code);
        expect(err.errorMessage).toEqual(expect.arrayContaining([BrowserAuthErrorMessage.invalidCacheType.desc]));
        expect(err.message).toEqual(expect.arrayContaining([BrowserAuthErrorMessage.invalidCacheType.desc]));
        expect(err.name).toBe("BrowserAuthError");
        expect(err.stack).toEqual(expect.arrayContaining(["BrowserAuthError.spec.ts"]));
    });
});
