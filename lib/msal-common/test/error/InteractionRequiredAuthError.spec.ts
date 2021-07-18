import { InteractionRequiredAuthError, InteractionRequiredAuthErrorMessage, InteractionRequiredAuthSubErrorMessage } from "../../src/error/InteractionRequiredAuthError";
import { ServerError } from "../../src/error/ServerError";
import { AuthError } from "../../src/error/AuthError";


describe("InteractionRequiredAuthError.ts Class Unit Tests", () => {

    it("InteractionRequiredAuthError object can be created", () => {
        const TEST_ERROR_CODE: string = "test";
        const TEST_ERROR_MSG: string = "This is a test error";
        const err: InteractionRequiredAuthError = new InteractionRequiredAuthError(TEST_ERROR_CODE, TEST_ERROR_MSG);

        expect(err instanceof InteractionRequiredAuthError).toBe(true);
        expect(err instanceof ServerError).toBe(true);
        expect(err instanceof AuthError).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err.errorCode).toBe(TEST_ERROR_CODE);
        expect(err.errorMessage).toBe(TEST_ERROR_MSG);
        expect(err.message).toBe(`${TEST_ERROR_CODE}: ${TEST_ERROR_MSG}`);
        expect(err.name).toBe("InteractionRequiredAuthError");
        expect(err.stack?.includes("InteractionRequiredAuthError.spec.ts")).toBe(true);
    });

    describe("isInteractionRequiredError()", () => {

        it("Returns false if given values are empty", () => {
            expect(InteractionRequiredAuthError.isInteractionRequiredError("", "")).toBe(false);
        });

        it("Returns expected value for given error code", () => {
            InteractionRequiredAuthErrorMessage.forEach(function (errorCode) {
                expect(InteractionRequiredAuthError.isInteractionRequiredError(errorCode, "")).toBe(true);
            });
            expect(InteractionRequiredAuthError.isInteractionRequiredError("bad_token", "")).toBe(false);
        });

        it("Returns expected value for given error string", () => {
            InteractionRequiredAuthErrorMessage.forEach(function (errorCode) {
                expect(InteractionRequiredAuthError.isInteractionRequiredError("", `This is a ${errorCode} error!`)).toBe(true);
            });
            expect(InteractionRequiredAuthError.isInteractionRequiredError("", "This is not an interaction required error")).toBe(false);
        });

        it("Returns expected value for given error code and error string", () => {
            InteractionRequiredAuthErrorMessage.forEach(function (errorCode) {
                expect(InteractionRequiredAuthError.isInteractionRequiredError(errorCode, `This is a ${errorCode} error!`)).toBe(true);
            });
            expect(InteractionRequiredAuthError.isInteractionRequiredError("bad_token", "This is not an interaction required error")).toBe(false);
        });

        it("Returns expected value for given sub-error", () => {
            InteractionRequiredAuthSubErrorMessage.forEach(function (subErrorCode) {
                expect(InteractionRequiredAuthError.isInteractionRequiredError("", "", subErrorCode)).toBe(true);
            });
            expect(InteractionRequiredAuthError.isInteractionRequiredError("", "", "bad_token")).toBe(false);
        });
    });
});
