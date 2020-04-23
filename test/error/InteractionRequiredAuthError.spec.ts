import { expect } from "chai";
import { InteractionRequiredAuthError, InteractionRequiredAuthErrorMessage } from "../../src/error/InteractionRequiredAuthError";
import { ServerError } from "../../src/error/ServerError";
import { AuthError } from "../../src/error/AuthError";


describe("InteractionRequiredAuthError.ts Class Unit Tests", () => {

    it("InteractionRequiredAuthError object can be created", () => {
        const TEST_ERROR_CODE: string = "test";
        const TEST_ERROR_MSG: string = "This is a test error";
        const err: InteractionRequiredAuthError = new InteractionRequiredAuthError(TEST_ERROR_CODE, TEST_ERROR_MSG);

        expect(err instanceof InteractionRequiredAuthError).to.be.true;
        expect(err instanceof ServerError).to.be.true;
        expect(err instanceof AuthError).to.be.true;
        expect(err instanceof Error).to.be.true;
        expect(err.errorCode).to.equal(TEST_ERROR_CODE);
        expect(err.errorMessage).to.equal(TEST_ERROR_MSG);
        expect(err.message).to.equal(`${TEST_ERROR_CODE}: ${TEST_ERROR_MSG}`);
        expect(err.name).to.equal("InteractionRequiredAuthError");
        expect(err.stack).to.include("InteractionRequiredAuthError.spec.ts");
    });

    describe("isInteractionRequiredError()", () => {

        it("Returns false if given values are empty", () => {
            expect(InteractionRequiredAuthError.isInteractionRequiredError("", "")).to.be.false;
        });

        it("Returns expected value for given error code", () => {
            expect(InteractionRequiredAuthError.isInteractionRequiredError(InteractionRequiredAuthErrorMessage.interactionRequired, "")).to.be.true;
            expect(InteractionRequiredAuthError.isInteractionRequiredError(InteractionRequiredAuthErrorMessage.consentRequired, "")).to.be.true;
            expect(InteractionRequiredAuthError.isInteractionRequiredError(InteractionRequiredAuthErrorMessage.loginRequired, "")).to.be.true;
            expect(InteractionRequiredAuthError.isInteractionRequiredError("bad_token", "")).to.be.false;
        });

        it("Returns expected value for given error string", () => {
            expect(InteractionRequiredAuthError.isInteractionRequiredError("", `This is a ${InteractionRequiredAuthErrorMessage.interactionRequired} error!`)).to.be.true;
            expect(InteractionRequiredAuthError.isInteractionRequiredError("", `This is a ${InteractionRequiredAuthErrorMessage.consentRequired} error!`)).to.be.true;
            expect(InteractionRequiredAuthError.isInteractionRequiredError("", `This is a ${InteractionRequiredAuthErrorMessage.loginRequired} error!`)).to.be.true;
            expect(InteractionRequiredAuthError.isInteractionRequiredError("", "This is not an interaction required error")).to.be.false;
        });

        it("Returns expected value for given error code and error string", () => {
            expect(InteractionRequiredAuthError.isInteractionRequiredError(InteractionRequiredAuthErrorMessage.interactionRequired, `This is a ${InteractionRequiredAuthErrorMessage.interactionRequired.code} error!`)).to.be.true;
            expect(InteractionRequiredAuthError.isInteractionRequiredError(InteractionRequiredAuthErrorMessage.consentRequired, `This is a ${InteractionRequiredAuthErrorMessage.consentRequired.code} error!`)).to.be.true;
            expect(InteractionRequiredAuthError.isInteractionRequiredError(InteractionRequiredAuthErrorMessage.loginRequired, `This is a ${InteractionRequiredAuthErrorMessage.loginRequired.code} error!`)).to.be.true;
            expect(InteractionRequiredAuthError.isInteractionRequiredError("bad_token", "This is not an interaction required error")).to.be.false;
        });
    });
});
