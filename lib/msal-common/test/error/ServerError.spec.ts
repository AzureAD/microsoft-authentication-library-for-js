import { ServerError } from "../../src/error/ServerError";
import { AuthError } from "../../src/error/AuthError";
import { HTTP_BAD_REQUEST } from "../../src/utils/Constants.js";

describe("ServerError.ts Class Unit Tests", () => {
    it("ServerError object can be created", () => {
        const TEST_ERROR_CODE: string = "test";
        const TEST_ERROR_MSG: string = "This is a test error";
        const TEST_ERROR_STATUS: number = HTTP_BAD_REQUEST;
        const err: ServerError = new ServerError(
            TEST_ERROR_CODE,
            "",
            TEST_ERROR_MSG,
            undefined,
            undefined,
            TEST_ERROR_STATUS
        );

        expect(err instanceof ServerError).toBe(true);
        expect(err instanceof AuthError).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err.errorCode).toBe(TEST_ERROR_CODE);
        expect(err.errorMessage).toBe(TEST_ERROR_MSG);
        expect(err.message).toBe(`${TEST_ERROR_CODE}: ${TEST_ERROR_MSG}`);
        expect(err.name).toBe("ServerError");
        expect(err.stack?.includes("ServerError.spec.ts")).toBe(true);
        expect(err.status).toBe(TEST_ERROR_STATUS);
    });

    it("Values are set as expected when no info was provided to ServerError", () => {
        const err: ServerError = new ServerError("", "");

        expect(err instanceof ServerError).toBe(true);
        expect(err instanceof AuthError).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err.errorCode).toBe("");
        expect(err.errorMessage).toBe("");
        expect(err.errorNo).toBeUndefined();
        expect(err.message).toBe("");
        expect(err.name).toBe("ServerError");
        expect(err.stack?.includes("ServerError.spec.ts")).toBe(true);
        expect(err.status).toBeUndefined();
    });
});
