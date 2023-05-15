import { ServerError, ServerErrorMessage } from "../../src/error/ServerError";
import { AuthError } from "../../src";

describe("ServerError.ts Class", () => {
  it("ServerError object can be created", () => {

    const TEST_ERROR_CODE: string = "test";
    const TEST_ERROR_MSG: string = "This is a test error";
    let serverError = new ServerError(TEST_ERROR_CODE, TEST_ERROR_MSG);
    let err: ServerError;

    try {
      throw serverError;
    } catch (error) {
      err = error;
    }

    expect(err instanceof ServerError).toBe(true);
    expect(err instanceof AuthError).toBe(true);
    expect(err instanceof Error).toBe(true);
    expect(err.errorCode).toBe(TEST_ERROR_CODE);
    expect(err.errorMessage).toBe(TEST_ERROR_MSG);
    expect(err.message).toBe(TEST_ERROR_MSG);
    expect(err.name).toBe("ServerError");
    expect(err.stack).toContain("ServerError.spec.ts");
  });

  it("createServerUnavailableError creates a ServerError object", () => {

    const serverUnavailableError = ServerError.createServerUnavailableError();
    let err: ServerError;

    try {
      throw serverUnavailableError;
    } catch (error) {
      err = error;
    }

    expect(err.errorCode).toBe(ServerErrorMessage.serverUnavailable.code);
    expect(err.errorMessage).toBe(ServerErrorMessage.serverUnavailable.desc);
    expect(err.message).toBe(ServerErrorMessage.serverUnavailable.desc);
    expect(err.name).toBe("ServerError");
    expect(err.stack).toContain("ServerError.spec.ts");
  });

  it("createUnknownServerError creates a ServerError object", () => {

    const ERROR_FROM_SERVER = "This is the error message from the server";
    const unknownServerError = ServerError.createUnknownServerError(ERROR_FROM_SERVER);
    let err: ServerError;

    try {
      throw unknownServerError;
    } catch (error) {
      err = error;
    }

    expect(err.errorCode).toBe(ServerErrorMessage.unknownServerError.code);
    expect(err.errorMessage).toContain(ERROR_FROM_SERVER);
    expect(err.message).toBe(ERROR_FROM_SERVER);
    expect(err.name).toBe("ServerError");
    expect(err.stack).toContain("ServerError.spec.ts");
  });

});

