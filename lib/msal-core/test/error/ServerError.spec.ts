import * as mocha from "mocha";
import { expect } from "chai";
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

    expect(err instanceof ServerError).to.be.true;
    expect(err instanceof AuthError).to.be.true;
    expect(err instanceof Error).to.be.true;
    expect(err.errorCode).to.equal(TEST_ERROR_CODE);
    expect(err.errorMessage).to.equal(TEST_ERROR_MSG);
    expect(err.message).to.equal(TEST_ERROR_MSG);
    expect(err.name).to.equal("ServerError");
    expect(err.stack).to.include("ServerError.spec.ts");
  });

  it("createServerUnavailableError creates a ServerError object", () => {

    const serverUnavailableError = ServerError.createServerUnavailableError();
    let err: ServerError;

    try {
      throw serverUnavailableError;
    } catch (error) {
      err = error;
    }

    expect(err.errorCode).to.equal(ServerErrorMessage.serverUnavailable.code);
    expect(err.errorMessage).to.equal(ServerErrorMessage.serverUnavailable.desc);
    expect(err.message).to.equal(ServerErrorMessage.serverUnavailable.desc);
    expect(err.name).to.equal("ServerError");
    expect(err.stack).to.include("ServerError.spec.ts");
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

    expect(err.errorCode).to.equal(ServerErrorMessage.unknownServerError.code);
    expect(err.errorMessage).to.contain(ERROR_FROM_SERVER);
    expect(err.message).to.equal(ERROR_FROM_SERVER);
    expect(err.name).to.equal("ServerError");
    expect(err.stack).to.include("ServerError.spec.ts");
  });

});

