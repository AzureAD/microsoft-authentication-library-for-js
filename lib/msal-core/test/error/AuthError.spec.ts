import { expect } from "chai";
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

    expect(err instanceof AuthError).to.be.true;
    expect(err instanceof Error).to.be.true;
    expect(err.errorCode).to.equal(TEST_ERROR_CODE);
    expect(err.errorMessage).to.equal(TEST_ERROR_MSG);
    expect(err.message).to.equal(TEST_ERROR_MSG);
    expect(err.name).to.equal("AuthError");
    expect(err.stack).to.include("AuthError.spec.ts");
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

    expect(err.errorCode).to.equal(AuthErrorMessage.unexpectedError.code);
    expect(err.errorMessage).to.contain(AuthErrorMessage.unexpectedError.desc);
    expect(err.errorMessage).to.contain(ERROR_DESC);
    expect(err.message).to.contain(AuthErrorMessage.unexpectedError.desc);
    expect(err.name).to.equal("AuthError");
    expect(err.stack).to.include("AuthError.spec.ts");
  });

});


