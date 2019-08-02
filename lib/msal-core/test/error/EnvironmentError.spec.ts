import * as mocha from "mocha";
import { expect } from "chai";
import { EnvironmentError, EnvironmentErrorMessage } from "../../src/error/EnvironmentError";
import { AuthError } from "../../src";

describe("EnvironmentError.ts Class", () => {
  it("EnvironmentError object can be created", () => {

    const TEST_ERROR_CODE: string = "test";
    const TEST_ERROR_MSG: string = "This is a test error";
    let environmentError = new EnvironmentError(TEST_ERROR_CODE, TEST_ERROR_MSG);
    let err: EnvironmentError;

    try {
      throw environmentError;
    } catch (error) {
      err = error;
    }

    expect(err instanceof EnvironmentError).to.be.true;
    expect(err instanceof AuthError).to.be.true;
    expect(err instanceof Error).to.be.true;
    expect(err.errorCode).to.equal(TEST_ERROR_CODE);
    expect(err.errorMessage).to.equal(TEST_ERROR_MSG);
    expect(err.message).to.equal(TEST_ERROR_MSG);
    expect(err.name).to.equal("EnvironmentError");
    expect(err.stack).to.include("EnvironmentError.spec.js");
  });

  it("createNoResolveInIframeError creates a EnvironmentError object", () => {

    const serverUnavailableError = EnvironmentError.createNoResolveInIframeError();
    let err: EnvironmentError;

    try {
      throw serverUnavailableError;
    } catch (error) {
      err = error;
    }

    expect(err.errorCode).to.equal(EnvironmentErrorMessage.noResolveInIframe.code);
    expect(err.errorMessage).to.equal(EnvironmentErrorMessage.noResolveInIframe.desc);
    expect(err.message).to.equal(EnvironmentErrorMessage.noResolveInIframe.desc);
    expect(err.name).to.equal("EnvironmentError");
    expect(err.stack).to.include("EnvironmentError.spec.js");
  });


});

