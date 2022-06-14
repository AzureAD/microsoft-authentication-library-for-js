import { ServerError } from "../../src/error/ServerError";
import { AuthError } from "../../src/error/AuthError";

describe("ServerError.ts Class Unit Tests", () => {

    it("ServerError object can be created", () => {
        const TEST_ERROR_CODE: string = "test";
        const TEST_ERROR_MSG: string = "This is a test error";
        const err: ServerError = new ServerError(TEST_ERROR_CODE, TEST_ERROR_MSG);

        expect(err instanceof ServerError).toBe(true);
        expect(err instanceof AuthError).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err.errorCode).toBe(TEST_ERROR_CODE);
        expect(err.errorMessage).toBe(TEST_ERROR_MSG);
        expect(err.message).toBe(`${TEST_ERROR_CODE}: ${TEST_ERROR_MSG}`);
        expect(err.name).toBe("ServerError");
        expect(err.stack?.includes("ServerError.spec.ts")).toBe(true);
    });
});
