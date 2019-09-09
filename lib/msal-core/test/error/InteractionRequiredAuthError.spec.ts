import * as mocha from "mocha";
import { expect } from "chai";
import { InteractionRequiredAuthError, InteractionRequiredAuthErrorMessage } from "../../src/error/InteractionRequiredAuthError";
import { AuthError, ServerError } from "../../src";

describe("InteractionRequiredAuthError.ts Class", () => {

  const ERROR_DESC = "Error from the server";

  const INTERACTION_REQ_STRING = "interaction_required";
  const LOGIN_REQ_STRING = "login_required";
  const CONSENT_REQ_STRING = "consent_required";
  const INCORRECT_REQ_STRING = "something_else_required";

  it("InteractionRequiredAuthError object can be created", () => {

    const TEST_ERROR_CODE: string = "test";
    const TEST_ERROR_MSG: string = "This is a test error";
    let interactionReqError = new InteractionRequiredAuthError(TEST_ERROR_CODE, TEST_ERROR_MSG);
    let err: InteractionRequiredAuthError;

    try {
      throw interactionReqError;
    } catch (error) {
      err = error;
    }
    expect(err instanceof InteractionRequiredAuthError).to.be.true;
    expect(err instanceof ServerError).to.be.true;
    expect(err instanceof AuthError).to.be.true;
    expect(err instanceof Error).to.be.true;
    expect(err.errorCode).to.equal(TEST_ERROR_CODE);
    expect(err.errorMessage).to.equal(TEST_ERROR_MSG);
    expect(err.message).to.equal(TEST_ERROR_MSG);
    expect(err.name).to.equal("InteractionRequiredAuthError");
    expect(err.stack).to.include("InteractionRequiredAuthError.spec.ts");
  });

  it("createLoginRequiredAuthError creates a ServerError object", () => {

    const loginRequiredError = InteractionRequiredAuthError.createLoginRequiredAuthError(ERROR_DESC);
    let err: InteractionRequiredAuthError;

    try {
      throw loginRequiredError;
    } catch (error) {
      err = error;
    }

    expect(err.errorCode).to.equal(InteractionRequiredAuthErrorMessage.loginRequired.code);
    expect(err.errorMessage).to.equal(ERROR_DESC);
    expect(err.message).to.equal(ERROR_DESC);
    expect(err.name).to.equal("InteractionRequiredAuthError");
    expect(err.stack).to.include("InteractionRequiredAuthError.spec.ts");
  });

  it("createInteractionRequiredAuthError creates a ServerError object", () => {

    const interactionRequiredError = InteractionRequiredAuthError.createInteractionRequiredAuthError(ERROR_DESC);
    let err: InteractionRequiredAuthError;

    try {
      throw interactionRequiredError;
    } catch (error) {
      err = error;
    }

    expect(err.errorCode).to.equal(InteractionRequiredAuthErrorMessage.interactionRequired.code);
    expect(err.errorMessage).to.equal(ERROR_DESC);
    expect(err.message).to.equal(ERROR_DESC);
    expect(err.name).to.equal("InteractionRequiredAuthError");
    expect(err.stack).to.include("InteractionRequiredAuthError.spec.ts");
  });

  it("createConsentRequiredAuthError creates a ServerError object", () => {

    const consentRequiredError = InteractionRequiredAuthError.createConsentRequiredAuthError(ERROR_DESC);
    let err: InteractionRequiredAuthError;

    try {
      throw consentRequiredError;
    } catch (error) {
      err = error;
    }

    expect(err.errorCode).to.equal(InteractionRequiredAuthErrorMessage.consentRequired.code);
    expect(err.errorMessage).to.equal(ERROR_DESC);
    expect(err.message).to.equal(ERROR_DESC);
    expect(err.name).to.equal("InteractionRequiredAuthError");
    expect(err.stack).to.include("InteractionRequiredAuthError.spec.ts");
  });

  it("isInteractionRequiredError function correctly detects _required strings", () => {
    expect(InteractionRequiredAuthError.isInteractionRequiredError(INTERACTION_REQ_STRING)).to.be.true;
    expect(InteractionRequiredAuthError.isInteractionRequiredError(LOGIN_REQ_STRING)).to.be.true;
    expect(InteractionRequiredAuthError.isInteractionRequiredError(CONSENT_REQ_STRING)).to.be.true;
    expect(InteractionRequiredAuthError.isInteractionRequiredError(INCORRECT_REQ_STRING)).to.be.false;
  });

});

