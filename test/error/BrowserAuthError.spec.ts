import { expect } from "chai";
import { BrowserAuthError, BrowserAuthErrorMessage } from "../../src/error/BrowserAuthError";
import { AuthError } from "@azure/msal-common";

describe("BrowserAuthError Unit Tests", () => {

    it("BrowserAuthError object can be created", () => {
        const TEST_ERROR_CODE: string = "test";
        const TEST_ERROR_MSG: string = "This is a test error";
        const err: BrowserAuthError = new BrowserAuthError(TEST_ERROR_CODE, TEST_ERROR_MSG);
        
        expect(err instanceof BrowserAuthError).to.be.true;
        expect(err instanceof AuthError).to.be.true;
        expect(err instanceof Error).to.be.true;
        expect(err.errorCode).to.equal(TEST_ERROR_CODE);
        expect(err.errorMessage).to.equal(TEST_ERROR_MSG);
        expect(err.message).to.equal(`${TEST_ERROR_CODE}: ${TEST_ERROR_MSG}`);
        expect(err.name).to.equal("BrowserAuthError");
        expect(err.stack).to.include("BrowserAuthError.spec.ts");
    });

    it("createNonBrowserEnvironmentError()", () => {
        const err: BrowserAuthError = BrowserAuthError.createNonBrowserEnvironmentError();

        expect(err instanceof BrowserAuthError).to.be.true;
        expect(err instanceof AuthError).to.be.true;
        expect(err instanceof Error).to.be.true;
        expect(err.errorCode).to.equal(BrowserAuthErrorMessage.notInBrowserEnvironment.code);
        expect(err.errorMessage).to.include(BrowserAuthErrorMessage.notInBrowserEnvironment.desc);
        expect(err.message).to.include(BrowserAuthErrorMessage.notInBrowserEnvironment.desc);
        expect(err.name).to.equal("BrowserAuthError");
        expect(err.stack).to.include("BrowserAuthError.spec.ts");
    });

    it("createPkceNotGeneratedError()", () => {
        const err: BrowserAuthError = BrowserAuthError.createPkceNotGeneratedError("PKCE Error detail.");

        expect(err instanceof BrowserAuthError).to.be.true;
        expect(err instanceof AuthError).to.be.true;
        expect(err instanceof Error).to.be.true;
        expect(err.errorCode).to.equal(BrowserAuthErrorMessage.pkceNotGenerated.code);
        expect(err.errorMessage).to.include(BrowserAuthErrorMessage.pkceNotGenerated.desc);
        expect(err.message).to.include(BrowserAuthErrorMessage.pkceNotGenerated.desc);
        expect(err.name).to.equal("BrowserAuthError");
        expect(err.stack).to.include("BrowserAuthError.spec.ts");
    });

    it("createCryptoNotAvailableError()", () => {
        const err: BrowserAuthError = BrowserAuthError.createCryptoNotAvailableError("Crypto unavailable error detail.");

        expect(err instanceof BrowserAuthError).to.be.true;
        expect(err instanceof AuthError).to.be.true;
        expect(err instanceof Error).to.be.true;
        expect(err.errorCode).to.equal(BrowserAuthErrorMessage.cryptoDoesNotExist.code);
        expect(err.errorMessage).to.include(BrowserAuthErrorMessage.cryptoDoesNotExist.desc);
        expect(err.message).to.include(BrowserAuthErrorMessage.cryptoDoesNotExist.desc);
        expect(err.name).to.equal("BrowserAuthError");
        expect(err.stack).to.include("BrowserAuthError.spec.ts");
    });

    it("createHttpMethodNotImplementedError()", () => {
        const err: BrowserAuthError = BrowserAuthError.createHttpMethodNotImplementedError("Crypto unavailable error detail.");

        expect(err instanceof BrowserAuthError).to.be.true;
        expect(err instanceof AuthError).to.be.true;
        expect(err instanceof Error).to.be.true;
        expect(err.errorCode).to.equal(BrowserAuthErrorMessage.httpMethodNotImplementedError.code);
        expect(err.errorMessage).to.include(BrowserAuthErrorMessage.httpMethodNotImplementedError.desc);
        expect(err.message).to.include(BrowserAuthErrorMessage.httpMethodNotImplementedError.desc);
        expect(err.name).to.equal("BrowserAuthError");
        expect(err.stack).to.include("BrowserAuthError.spec.ts");
    });

    it("createEmptyNavigationUriError()", () => {
        const err: BrowserAuthError = BrowserAuthError.createEmptyNavigationUriError();

        expect(err instanceof BrowserAuthError).to.be.true;
        expect(err instanceof AuthError).to.be.true;
        expect(err instanceof Error).to.be.true;
        expect(err.errorCode).to.equal(BrowserAuthErrorMessage.emptyNavigateUriError.code);
        expect(err.errorMessage).to.include(BrowserAuthErrorMessage.emptyNavigateUriError.desc);
        expect(err.message).to.include(BrowserAuthErrorMessage.emptyNavigateUriError.desc);
        expect(err.name).to.equal("BrowserAuthError");
        expect(err.stack).to.include("BrowserAuthError.spec.ts");
    });

    it("createEmptyHashError()", () => {
        const err: BrowserAuthError = BrowserAuthError.createEmptyHashError("");

        expect(err instanceof BrowserAuthError).to.be.true;
        expect(err instanceof AuthError).to.be.true;
        expect(err instanceof Error).to.be.true;
        expect(err.errorCode).to.equal(BrowserAuthErrorMessage.hashEmptyError.code);
        expect(err.errorMessage).to.include(BrowserAuthErrorMessage.hashEmptyError.desc);
        expect(err.message).to.include(BrowserAuthErrorMessage.hashEmptyError.desc);
        expect(err.name).to.equal("BrowserAuthError");
        expect(err.stack).to.include("BrowserAuthError.spec.ts");
    });

    it("createInteractionInProgressError()", () => {
        const err: BrowserAuthError = BrowserAuthError.createInteractionInProgressError();

        expect(err instanceof BrowserAuthError).to.be.true;
        expect(err instanceof AuthError).to.be.true;
        expect(err instanceof Error).to.be.true;
        expect(err.errorCode).to.equal(BrowserAuthErrorMessage.interactionInProgress.code);
        expect(err.errorMessage).to.include(BrowserAuthErrorMessage.interactionInProgress.desc);
        expect(err.message).to.include(BrowserAuthErrorMessage.interactionInProgress.desc);
        expect(err.name).to.equal("BrowserAuthError");
        expect(err.stack).to.include("BrowserAuthError.spec.ts");
    });

    it("createPopupWindowError()", () => {
        const err: BrowserAuthError = BrowserAuthError.createPopupWindowError();

        expect(err instanceof BrowserAuthError).to.be.true;
        expect(err instanceof AuthError).to.be.true;
        expect(err instanceof Error).to.be.true;
        expect(err.errorCode).to.equal(BrowserAuthErrorMessage.popUpWindowError.code);
        expect(err.errorMessage).to.include(BrowserAuthErrorMessage.popUpWindowError.desc);
        expect(err.message).to.include(BrowserAuthErrorMessage.popUpWindowError.desc);
        expect(err.name).to.equal("BrowserAuthError");
        expect(err.stack).to.include("BrowserAuthError.spec.ts");
    });

    it("createPopupWindowError() with error message", () => {
        const testErrMessage = "Test Error message";
        const err: BrowserAuthError = BrowserAuthError.createPopupWindowError(testErrMessage);

        expect(err instanceof BrowserAuthError).to.be.true;
        expect(err instanceof AuthError).to.be.true;
        expect(err instanceof Error).to.be.true;
        expect(err.errorCode).to.equal(BrowserAuthErrorMessage.popUpWindowError.code);
        expect(err.errorMessage).to.include(BrowserAuthErrorMessage.popUpWindowError.desc);
        expect(err.errorMessage).to.include(testErrMessage);
        expect(err.message).to.include(BrowserAuthErrorMessage.popUpWindowError.desc);
        expect(err.message).to.include(testErrMessage);
        expect(err.name).to.equal("BrowserAuthError");
        expect(err.stack).to.include("BrowserAuthError.spec.ts");
    });

    it("createEmptyWindowCreatedError()", () => {
        const err: BrowserAuthError = BrowserAuthError.createEmptyWindowCreatedError();

        expect(err instanceof BrowserAuthError).to.be.true;
        expect(err instanceof AuthError).to.be.true;
        expect(err instanceof Error).to.be.true;
        expect(err.errorCode).to.equal(BrowserAuthErrorMessage.emptyWindowError.code);
        expect(err.errorMessage).to.include(BrowserAuthErrorMessage.emptyWindowError.desc);
        expect(err.message).to.include(BrowserAuthErrorMessage.emptyWindowError.desc);
        expect(err.name).to.equal("BrowserAuthError");
        expect(err.stack).to.include("BrowserAuthError.spec.ts");
    });

    it("createUserCancelledError()", () => {
        const err: BrowserAuthError = BrowserAuthError.createUserCancelledError();

        expect(err instanceof BrowserAuthError).to.be.true;
        expect(err instanceof AuthError).to.be.true;
        expect(err instanceof Error).to.be.true;
        expect(err.errorCode).to.equal(BrowserAuthErrorMessage.userCancelledError.code);
        expect(err.errorMessage).to.include(BrowserAuthErrorMessage.userCancelledError.desc);
        expect(err.message).to.include(BrowserAuthErrorMessage.userCancelledError.desc);
        expect(err.name).to.equal("BrowserAuthError");
        expect(err.stack).to.include("BrowserAuthError.spec.ts");
    });

    it("createMonitorPopupTimeoutError()", () => {
        const err: BrowserAuthError = BrowserAuthError.createMonitorPopupTimeoutError();

        expect(err instanceof BrowserAuthError).to.be.true;
        expect(err instanceof AuthError).to.be.true;
        expect(err instanceof Error).to.be.true;
        expect(err.errorCode).to.equal(BrowserAuthErrorMessage.monitorPopupTimeoutError.code);
        expect(err.errorMessage).to.include(BrowserAuthErrorMessage.monitorPopupTimeoutError.desc);
        expect(err.message).to.include(BrowserAuthErrorMessage.monitorPopupTimeoutError.desc);
        expect(err.name).to.equal("BrowserAuthError");
        expect(err.stack).to.include("BrowserAuthError.spec.ts");
    });

    it("createMonitorIframeTimeoutError()", () => {
        const err: BrowserAuthError = BrowserAuthError.createMonitorIframeTimeoutError();

        expect(err instanceof BrowserAuthError).to.be.true;
        expect(err instanceof AuthError).to.be.true;
        expect(err instanceof Error).to.be.true;
        expect(err.errorCode).to.equal(BrowserAuthErrorMessage.monitorIframeTimeoutError.code);
        expect(err.errorMessage).to.include(BrowserAuthErrorMessage.monitorIframeTimeoutError.desc);
        expect(err.message).to.include(BrowserAuthErrorMessage.monitorIframeTimeoutError.desc);
        expect(err.name).to.equal("BrowserAuthError");
        expect(err.stack).to.include("BrowserAuthError.spec.ts");
    });

    it("createRedirectInIframeError()", () => {
        const err: BrowserAuthError = BrowserAuthError.createRedirectInIframeError(false);

        expect(err instanceof BrowserAuthError).to.be.true;
        expect(err instanceof AuthError).to.be.true;
        expect(err instanceof Error).to.be.true;
        expect(err.errorCode).to.equal(BrowserAuthErrorMessage.redirectInIframeError.code);
        expect(err.errorMessage).to.include(BrowserAuthErrorMessage.redirectInIframeError.desc);
        expect(err.message).to.include(BrowserAuthErrorMessage.redirectInIframeError.desc);
        expect(err.name).to.equal("BrowserAuthError");
        expect(err.stack).to.include("BrowserAuthError.spec.ts");
    });

    it("createBlockReloadInHiddenIframeError()", () => {
        const err: BrowserAuthError = BrowserAuthError.createBlockReloadInHiddenIframeError();

        expect(err instanceof BrowserAuthError).to.be.true;
        expect(err instanceof AuthError).to.be.true;
        expect(err instanceof Error).to.be.true;
        expect(err.errorCode).to.equal(BrowserAuthErrorMessage.blockTokenRequestsInHiddenIframeError.code);
        expect(err.errorMessage).to.include(BrowserAuthErrorMessage.blockTokenRequestsInHiddenIframeError.desc);
        expect(err.message).to.include(BrowserAuthErrorMessage.blockTokenRequestsInHiddenIframeError.desc);
        expect(err.name).to.equal("BrowserAuthError");
        expect(err.stack).to.include("BrowserAuthError.spec.ts");
    });

    it("createIframeClosedPrematurelyError()", () => {
        const err: BrowserAuthError = BrowserAuthError.createIframeClosedPrematurelyError();

        expect(err instanceof BrowserAuthError).to.be.true;
        expect(err instanceof AuthError).to.be.true;
        expect(err instanceof Error).to.be.true;
        expect(err.errorCode).to.equal(BrowserAuthErrorMessage.iframeClosedPrematurelyError.code);
        expect(err.errorMessage).to.include(BrowserAuthErrorMessage.iframeClosedPrematurelyError.desc);
        expect(err.message).to.include(BrowserAuthErrorMessage.iframeClosedPrematurelyError.desc);
        expect(err.name).to.equal("BrowserAuthError");
        expect(err.stack).to.include("BrowserAuthError.spec.ts");
    });

    it("createSilentSSOInsufficientInfoError()", () => {
        const err: BrowserAuthError = BrowserAuthError.createSilentSSOInsufficientInfoError();

        expect(err instanceof BrowserAuthError).to.be.true;
        expect(err instanceof AuthError).to.be.true;
        expect(err instanceof Error).to.be.true;
        expect(err.errorCode).to.equal(BrowserAuthErrorMessage.silentSSOInsufficientInfoError.code);
        expect(err.errorMessage).to.include(BrowserAuthErrorMessage.silentSSOInsufficientInfoError.desc);
        expect(err.message).to.include(BrowserAuthErrorMessage.silentSSOInsufficientInfoError.desc);
        expect(err.name).to.equal("BrowserAuthError");
        expect(err.stack).to.include("BrowserAuthError.spec.ts");
    });

    it("createSilentSSOInsufficientInfoError()", () => {
        const promptVal = "notAPrompt";
        const err: BrowserAuthError = BrowserAuthError.createSilentPromptValueError(promptVal);

        expect(err instanceof BrowserAuthError).to.be.true;
        expect(err instanceof AuthError).to.be.true;
        expect(err instanceof Error).to.be.true;
        expect(err.errorCode).to.equal(BrowserAuthErrorMessage.silentPromptValueError.code);
        expect(err.errorMessage).to.include(promptVal);
        expect(err.errorMessage).to.include(BrowserAuthErrorMessage.silentPromptValueError.desc);
        expect(err.message).to.include(promptVal);
        expect(err.message).to.include(BrowserAuthErrorMessage.silentPromptValueError.desc);
        expect(err.name).to.equal("BrowserAuthError");
        expect(err.stack).to.include("BrowserAuthError.spec.ts");
    });
	
    it("createNoTokenRequestCacheError creates a ClientAuthError object", () => {
        const err: BrowserAuthError = BrowserAuthError.createNoTokenRequestCacheError();

        expect(err instanceof BrowserAuthError).to.be.true;
        expect(err instanceof AuthError).to.be.true;
        expect(err instanceof Error).to.be.true;
        expect(err.errorCode).to.equal(BrowserAuthErrorMessage.noTokenRequestCacheError.code);
        expect(err.errorMessage).to.include(BrowserAuthErrorMessage.noTokenRequestCacheError.desc);
        expect(err.message).to.include(BrowserAuthErrorMessage.noTokenRequestCacheError.desc);
        expect(err.name).to.equal("BrowserAuthError");
        expect(err.stack).to.include("BrowserAuthError.spec.ts");
    });

    it("createInvalidCacheTypeError()", () => {
        const err: BrowserAuthError = BrowserAuthError.createInvalidCacheTypeError();

        expect(err instanceof BrowserAuthError).to.be.true;
        expect(err instanceof AuthError).to.be.true;
        expect(err instanceof Error).to.be.true;
        expect(err.errorCode).to.equal(BrowserAuthErrorMessage.invalidCacheType.code);
        expect(err.errorMessage).to.include(BrowserAuthErrorMessage.invalidCacheType.desc);
        expect(err.message).to.include(BrowserAuthErrorMessage.invalidCacheType.desc);
        expect(err.name).to.equal("BrowserAuthError");
        expect(err.stack).to.include("BrowserAuthError.spec.ts");
    });
});
