import { expect } from "chai";
import { AuthError } from "@azure/msal-common";
import { BrowserConfigurationAuthError, BrowserConfigurationAuthErrorMessage } from "../../src/error/BrowserConfigurationAuthError";

describe("BrowserConfigurationAuthError Unit Tests", () => {

    it("BrowserConfigurationAuthError object can be created", () => {
        const TEST_ERROR_CODE: string = "test";
        const TEST_ERROR_MSG: string = "This is a test error";
        const err: BrowserConfigurationAuthError = new BrowserConfigurationAuthError(TEST_ERROR_CODE, TEST_ERROR_MSG);
        
        expect(err instanceof BrowserConfigurationAuthError).to.be.true;
        expect(err instanceof AuthError).to.be.true;
        expect(err instanceof Error).to.be.true;
        expect(err.errorCode).to.equal(TEST_ERROR_CODE);
        expect(err.errorMessage).to.equal(TEST_ERROR_MSG);
        expect(err.message).to.equal(`${TEST_ERROR_CODE}: ${TEST_ERROR_MSG}`);
        expect(err.name).to.equal("BrowserConfigurationAuthError");
        expect(err.stack).to.include("BrowserConfigurationAuthError.spec.ts");
    });

    it("createStorageNotSupportedError()", () => {
        const err: BrowserConfigurationAuthError = BrowserConfigurationAuthError.createStorageNotSupportedError("notAStorageLocation");

        expect(err instanceof BrowserConfigurationAuthError).to.be.true;
        expect(err instanceof AuthError).to.be.true;
        expect(err instanceof Error).to.be.true;
        expect(err.errorCode).to.equal(BrowserConfigurationAuthErrorMessage.storageNotSupportedError.code);
        expect(err.errorMessage).to.include(BrowserConfigurationAuthErrorMessage.storageNotSupportedError.desc);
        expect(err.message).to.include(BrowserConfigurationAuthErrorMessage.storageNotSupportedError.desc);
        expect(err.name).to.equal("BrowserConfigurationAuthError");
        expect(err.stack).to.include("BrowserConfigurationAuthError.spec.ts");
    });

    it("createInvalidCallbackObjectError()", () => {
        const err: BrowserConfigurationAuthError = BrowserConfigurationAuthError.createInvalidCallbackObjectError(null);

        expect(err instanceof BrowserConfigurationAuthError).to.be.true;
        expect(err instanceof AuthError).to.be.true;
        expect(err instanceof Error).to.be.true;
        expect(err.errorCode).to.equal(BrowserConfigurationAuthErrorMessage.invalidCallbackObject.code);
        expect(err.errorMessage).to.include(BrowserConfigurationAuthErrorMessage.invalidCallbackObject.desc);
        expect(err.message).to.include(BrowserConfigurationAuthErrorMessage.invalidCallbackObject.desc);
        expect(err.name).to.equal("BrowserConfigurationAuthError");
        expect(err.stack).to.include("BrowserConfigurationAuthError.spec.ts");
    });

    it("createRedirectCallbacksNotSetError()", () => {
        const err: BrowserConfigurationAuthError = BrowserConfigurationAuthError.createRedirectCallbacksNotSetError();

        expect(err instanceof BrowserConfigurationAuthError).to.be.true;
        expect(err instanceof AuthError).to.be.true;
        expect(err instanceof Error).to.be.true;
        expect(err.errorCode).to.equal(BrowserConfigurationAuthErrorMessage.noRedirectCallbacksSet.code);
        expect(err.errorMessage).to.include(BrowserConfigurationAuthErrorMessage.noRedirectCallbacksSet.desc);
        expect(err.message).to.include(BrowserConfigurationAuthErrorMessage.noRedirectCallbacksSet.desc);
        expect(err.name).to.equal("BrowserConfigurationAuthError");
        expect(err.stack).to.include("BrowserConfigurationAuthError.spec.ts");
    });
});
