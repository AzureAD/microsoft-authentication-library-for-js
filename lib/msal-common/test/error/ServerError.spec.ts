import { expect } from "chai";
import { ServerError } from "../../src/error/ServerError";
import { AuthError } from "../../src/error/AuthError";

describe("ServerError.ts Class Unit Tests", () => {

    it("ServerError object can be created", () => {
        const TEST_ERROR_CODE: string = "test";
        const TEST_ERROR_MSG: string = "This is a test error";
        const err: ServerError = new ServerError(TEST_ERROR_CODE, TEST_ERROR_MSG);

        expect(err instanceof ServerError).to.be.true;
        expect(err instanceof AuthError).to.be.true;
        expect(err instanceof Error).to.be.true;
        expect(err.errorCode).to.equal(TEST_ERROR_CODE);
        expect(err.errorMessage).to.equal(TEST_ERROR_MSG);
        expect(err.message).to.equal(`${TEST_ERROR_CODE}: ${TEST_ERROR_MSG}`);
        expect(err.name).to.equal("ServerError");
        expect(err.stack).to.include("ServerError.spec.ts");
    });
});
