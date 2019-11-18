import { expect } from "chai";
import { ClientAuthError } from "../../src/error/ClientAuthError";
import { AuthError } from "../../src/error/AuthError";

describe("ClientAuthError.ts Class", () => {

    it("ClientAuthError object can be created", () => {
        const TEST_ERROR_CODE: string = "test";
        const TEST_ERROR_MSG: string = "This is a test error";
        const clientAuthError = new ClientAuthError(TEST_ERROR_CODE, TEST_ERROR_MSG);
        let err: ClientAuthError;

        try {
            throw clientAuthError;
        } catch (error) {
            err = error;
        }

        expect(err instanceof ClientAuthError).to.be.true;
        expect(err instanceof AuthError).to.be.true;
        expect(err instanceof Error).to.be.true;
        expect(err.errorCode).to.equal(TEST_ERROR_CODE);
        expect(err.errorMessage).to.equal(TEST_ERROR_MSG);
        expect(err.message).to.equal(TEST_ERROR_MSG);
        expect(err.name).to.equal("ClientAuthError");
        expect(err.stack).to.include("ClientAuthError.spec.ts");
    });
});
