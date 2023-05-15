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
    expect(err instanceof InteractionRequiredAuthError).toBe(true);
    expect(err instanceof ServerError).toBe(true);
    expect(err instanceof AuthError).toBe(true);
    expect(err instanceof Error).toBe(true);
    expect(err.errorCode).toBe(TEST_ERROR_CODE);
    expect(err.errorMessage).toBe(TEST_ERROR_MSG);
    expect(err.message).toBe(TEST_ERROR_MSG);
    expect(err.name).toBe("InteractionRequiredAuthError");
    expect(err.stack).toContain("InteractionRequiredAuthError.spec.ts");
  });

  it("createLoginRequiredAuthError creates a ServerError object", () => {

    const loginRequiredError = InteractionRequiredAuthError.createLoginRequiredAuthError(ERROR_DESC);
    let err: InteractionRequiredAuthError;

    try {
      throw loginRequiredError;
    } catch (error) {
      err = error;
    }

    expect(err.errorCode).toBe(InteractionRequiredAuthErrorMessage.loginRequired.code);
    expect(err.errorMessage).toBe(ERROR_DESC);
    expect(err.message).toBe(ERROR_DESC);
    expect(err.name).toBe("InteractionRequiredAuthError");
    expect(err.stack).toContain("InteractionRequiredAuthError.spec.ts");
  });

  it("createInteractionRequiredAuthError creates a ServerError object", () => {

    const interactionRequiredError = InteractionRequiredAuthError.createInteractionRequiredAuthError(ERROR_DESC);
    let err: InteractionRequiredAuthError;

    try {
      throw interactionRequiredError;
    } catch (error) {
      err = error;
    }

    expect(err.errorCode).toBe(InteractionRequiredAuthErrorMessage.interactionRequired.code);
    expect(err.errorMessage).toBe(ERROR_DESC);
    expect(err.message).toBe(ERROR_DESC);
    expect(err.name).toBe("InteractionRequiredAuthError");
    expect(err.stack).toContain("InteractionRequiredAuthError.spec.ts");
  });

  it("createConsentRequiredAuthError creates a ServerError object", () => {

    const consentRequiredError = InteractionRequiredAuthError.createConsentRequiredAuthError(ERROR_DESC);
    let err: InteractionRequiredAuthError;

    try {
      throw consentRequiredError;
    } catch (error) {
      err = error;
    }

    expect(err.errorCode).toBe(InteractionRequiredAuthErrorMessage.consentRequired.code);
    expect(err.errorMessage).toBe(ERROR_DESC);
    expect(err.message).toBe(ERROR_DESC);
    expect(err.name).toBe("InteractionRequiredAuthError");
    expect(err.stack).toContain("InteractionRequiredAuthError.spec.ts");
  });

  it("isInteractionRequiredError function correctly detects _required strings", () => {
    expect(InteractionRequiredAuthError.isInteractionRequiredError(INTERACTION_REQ_STRING)).toBe(true);
    expect(InteractionRequiredAuthError.isInteractionRequiredError(LOGIN_REQ_STRING)).toBe(true);
    expect(InteractionRequiredAuthError.isInteractionRequiredError(CONSENT_REQ_STRING)).toBe(true);
    expect(InteractionRequiredAuthError.isInteractionRequiredError(INCORRECT_REQ_STRING)).toBe(false);
  });

});

