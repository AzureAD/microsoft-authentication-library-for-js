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

    it("createNoWindowObjectError()", () => {
        const err: BrowserAuthError = BrowserAuthError.createNoWindowObjectError();

        expect(err instanceof BrowserAuthError).to.be.true;
        expect(err instanceof AuthError).to.be.true;
        expect(err instanceof Error).to.be.true;
        expect(err.errorCode).to.equal(BrowserAuthErrorMessage.noWindowObjectError.code);
        expect(err.errorMessage).to.include(BrowserAuthErrorMessage.noWindowObjectError.desc);
        expect(err.message).to.include(BrowserAuthErrorMessage.noWindowObjectError.desc);
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

    it("createPopupWindowTimeoutError()", () => {
        const err: BrowserAuthError = BrowserAuthError.createMonitorWindowTimeoutError("https://contoso.com/redirect");

        expect(err instanceof BrowserAuthError).to.be.true;
        expect(err instanceof AuthError).to.be.true;
        expect(err instanceof Error).to.be.true;
        expect(err.errorCode).to.equal(BrowserAuthErrorMessage.monitorWindowTimeoutError.code);
        expect(err.errorMessage).to.include(BrowserAuthErrorMessage.monitorWindowTimeoutError.desc);
        expect(err.message).to.include(BrowserAuthErrorMessage.monitorWindowTimeoutError.desc);
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
});
