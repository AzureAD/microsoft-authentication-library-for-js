import { AuthError, AuthErrorMessage } from "../../src/error/AuthError";

describe("AuthError.ts Class", () => {
  it("AuthError object can be created", () => {
    const TEST_ERROR_CODE: string = "test";
    const TEST_ERROR_MSG: string = "This is a test error";
    const authError = new AuthError(TEST_ERROR_CODE, TEST_ERROR_MSG);
    let err: AuthError;

    try {
      throw authError;
    } catch (error) {
      err = error;
    }

    expect(err instanceof AuthError).toBe(true);
    expect(err instanceof Error).toBe(true);
    expect(err.errorCode).toBe(TEST_ERROR_CODE);
    expect(err.errorMessage).toBe(TEST_ERROR_MSG);
    expect(err.message).toBe(TEST_ERROR_MSG);
    expect(err.name).toBe("AuthError");
    expect(err.stack).toContain("AuthError.spec.ts");
  });

  it("createUnexpectedError creates a AuthError object", () => {

    const ERROR_DESC = "This is the error";
    const unexpectedError = AuthError.createUnexpectedError(ERROR_DESC);
    let err: AuthError;

    try {
      throw unexpectedError;
    } catch (error) {
      err = error;
    }

    expect(err.errorCode).toBe(AuthErrorMessage.unexpectedError.code);
    expect(err.errorMessage).toContain(AuthErrorMessage.unexpectedError.desc);
    expect(err.errorMessage).toContain(ERROR_DESC);
    expect(err.message).toContain(AuthErrorMessage.unexpectedError.desc);
    expect(err.name).toBe("AuthError");
    expect(err.stack).toContain("AuthError.spec.ts");
  });

});


