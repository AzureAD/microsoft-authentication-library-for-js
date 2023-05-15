import { ClientAuthError, ClientAuthErrorMessage } from "../../src/error/ClientAuthError";
import { IdToken } from "../../src/IdToken";
import { AuthError, ServerHashParamKeys } from "../../src";

describe("ClientAuthError.ts Class", () => {

  it("ClientAuthError object can be created", () => {
    const TEST_ERROR_CODE: string = "test";
    const TEST_ERROR_MSG: string = "This is a test error";
    const clientAuthError = new ClientAuthError(TEST_ERROR_CODE, TEST_ERROR_MSG);
    let err: ClientAuthError;

    try {
      throw clientAuthError;
    } catch (error) {
      err = error;
    }

    expect(err instanceof ClientAuthError).toBe(true);
    expect(err instanceof AuthError).toBe(true);
    expect(err instanceof Error).toBe(true);
    expect(err.errorCode).toBe(TEST_ERROR_CODE);
    expect(err.errorMessage).toBe(TEST_ERROR_MSG);
    expect(err.message).toBe(TEST_ERROR_MSG);
    expect(err.name).toBe("ClientAuthError");
    expect(err.stack).toContain("ClientAuthError.spec.ts");
  });

  it("createEndpointResolutionError creates a ClientAuthError object", () => {

    const ERROR_DETAIL = "This is the error detail";
    const endPtReslnError = ClientAuthError.createEndpointResolutionError(ERROR_DETAIL);
    let err: ClientAuthError;

    try {
      throw endPtReslnError;
    } catch (error) {
      err = error;
    }

    expect(err.errorCode).toBe(ClientAuthErrorMessage.endpointResolutionError.code);
    expect(err.errorMessage).toContain(ClientAuthErrorMessage.endpointResolutionError.desc);
    expect(err.errorMessage).toContain(ERROR_DETAIL);
    expect(err.message).toContain(ClientAuthErrorMessage.endpointResolutionError.desc);
    expect(err.name).toBe("ClientAuthError");
    expect(err.stack).toContain("ClientAuthError.spec.ts");

  });

  it("createPopupWindowError creates a ClientAuthError object", () => {

    const ERROR_DETAIL = "Details:";
    const popupWindowError = ClientAuthError.createPopupWindowError(ERROR_DETAIL);
    let err: ClientAuthError;

    try {
      throw popupWindowError;
    } catch (error) {
      err = error;
    }

    expect(err.errorCode).toBe(ClientAuthErrorMessage.popUpWindowError.code);
    expect(err.errorMessage).toContain(ClientAuthErrorMessage.popUpWindowError.desc);
    expect(err.errorMessage).toContain(ERROR_DETAIL);
    expect(err.message).toContain(ClientAuthErrorMessage.popUpWindowError.desc);
    expect(err.name).toBe("ClientAuthError");
    expect(err.stack).toContain("ClientAuthError.spec.ts");
  });

  it("createTokenRenewalTimeoutError creates a ClientAuthError object", () => {

    const tokenRenewalTimeOutError = ClientAuthError.createTokenRenewalTimeoutError();
    let err: ClientAuthError;

    try {
      throw tokenRenewalTimeOutError;
    } catch (error) {
      err = error;
    }

    expect(err.errorCode).toBe(ClientAuthErrorMessage.tokenRenewalError.code);
    expect(err.errorMessage).toBe(ClientAuthErrorMessage.tokenRenewalError.desc);
    expect(err.message).toBe(ClientAuthErrorMessage.tokenRenewalError.desc);
    expect(err.name).toBe("ClientAuthError");
    expect(err.stack).toContain("ClientAuthError.spec.ts");
  });

  // TODO: Cklarify if we want to throw decoded idToken back to the client?
  it("createInvalidIdTokenError creates a ClientAuthError object", () => {

    // Chose not to spy/stub as the idToken functionality needed in error class tests
    // is more depedent on already pried open idToken in IDToken Class
    const idToken: IdToken = null;

    const invalidTokenError = ClientAuthError.createInvalidIdTokenError(idToken);
    let err: ClientAuthError;

    try {
      throw invalidTokenError;
    } catch (error) {
      err = error;
    }

    expect(err.errorCode).toBe(ClientAuthErrorMessage.invalidIdToken.code);
    expect(err.errorMessage).toContain(ClientAuthErrorMessage.invalidIdToken.desc);
    expect(err.message).toContain(ClientAuthErrorMessage.invalidIdToken.desc);
    expect(err.name).toBe("ClientAuthError");
    expect(err.stack).toContain("ClientAuthError.spec.ts");
  });

  it("createInvalidStateError creates a ClientAuthError object", () => {

    const state = "12345";
    const invalidState = "67890";
    const invalidStateError = ClientAuthError.createInvalidStateError(invalidState, state);
    let err: ClientAuthError;

    try {
      throw invalidStateError;
    } catch (error) {
      err = error;
    }

    expect(err.errorCode).toBe(ClientAuthErrorMessage.invalidStateError.code);
    expect(err.errorMessage).toContain(ClientAuthErrorMessage.invalidStateError.desc);
    expect(err.errorMessage).toContain(`${invalidState}, state expected : ${state}.`);
    expect(err.message).toContain(ClientAuthErrorMessage.invalidStateError.desc);
    expect(err.name).toBe("ClientAuthError");
    expect(err.stack).toContain("ClientAuthError.spec.ts");
  });

  it("createNonceMismatchError creates a ClientAuthError object", () => {

    const nonce = "12345";
    const invalidNonce = "67890";
    const invalidNonceError = ClientAuthError.createNonceMismatchError(invalidNonce, nonce);
    let err: ClientAuthError;

    try {
      throw invalidNonceError;
    } catch (error) {
      err = error;
    }

    expect(err.errorCode).toBe(ClientAuthErrorMessage.nonceMismatchError.code);
    expect(err.errorMessage).toContain(ClientAuthErrorMessage.nonceMismatchError.desc);
    expect(err.errorMessage).toContain(`${invalidNonce}, nonce expected : ${nonce}.`);
    expect(err.message).toContain(ClientAuthErrorMessage.nonceMismatchError.desc);
    expect(err.name).toBe("ClientAuthError");
    expect(err.stack).toContain("ClientAuthError.spec.ts");
  });

  it("createLoginInProgressError creates a ClientAuthError object", () => {

    const loginInProgressError = ClientAuthError.createLoginInProgressError();
    let err: ClientAuthError;

    try {
      throw loginInProgressError;
    } catch (error) {
      err = error;
    }

    expect(err.errorCode).toBe(ClientAuthErrorMessage.loginProgressError.code);
    expect(err.errorMessage).toBe(ClientAuthErrorMessage.loginProgressError.desc);
    expect(err.message).toBe(ClientAuthErrorMessage.loginProgressError.desc);
    expect(err.name).toBe("ClientAuthError");
    expect(err.stack).toContain("ClientAuthError.spec.ts");
  });

  it("createAcquireTokenInProgressError creates a ClientAuthError object", () => {

    const acqTokenInProgressError = ClientAuthError.createAcquireTokenInProgressError();
    let err: ClientAuthError;

    try {
      throw acqTokenInProgressError;
    } catch (error) {
      err = error;
    }

    expect(err.errorCode).toBe(ClientAuthErrorMessage.acquireTokenProgressError.code);
    expect(err.errorMessage).toBe(ClientAuthErrorMessage.acquireTokenProgressError.desc);
    expect(err.message).toBe(ClientAuthErrorMessage.acquireTokenProgressError.desc);
    expect(err.name).toBe("ClientAuthError");
    expect(err.stack).toContain("ClientAuthError.spec.ts");
  });

  it("createUserCancelledError creates a ClientAuthError object", () => {

    const userCancelledError = ClientAuthError.createUserCancelledError();
    let err: ClientAuthError;

    try {
      throw userCancelledError;
    } catch (error) {
      err = error;
    }

    expect(err.errorCode).toBe(ClientAuthErrorMessage.userCancelledError.code);
    expect(err.errorMessage).toBe(ClientAuthErrorMessage.userCancelledError.desc);
    expect(err.message).toBe(ClientAuthErrorMessage.userCancelledError.desc);
    expect(err.name).toBe("ClientAuthError");
    expect(err.stack).toContain("ClientAuthError.spec.ts");
  });

  it("createErrorInCallbackFunction creates a ClientAuthError object", () => {

    const ERROR_DESC = "There is a callback error";
    const errorInCallback = ClientAuthError.createErrorInCallbackFunction(ERROR_DESC);
    let err: ClientAuthError;

    try {
      throw errorInCallback;
    } catch (error) {
      err = error;
    }

    expect(err.errorCode).toBe(ClientAuthErrorMessage.callbackError.code);
    expect(err.errorMessage).toContain(ClientAuthErrorMessage.callbackError.desc);
    expect(err.errorMessage).toContain(ClientAuthErrorMessage.callbackError.desc);
    expect(err.message).toContain(`${ERROR_DESC}`);
    expect(err.name).toBe("ClientAuthError");
    expect(err.stack).toContain("ClientAuthError.spec.ts");
  });

  it("createUserLoginRequiredError creates a ClientAuthError object", () => {

    const userLoginRequiredError = ClientAuthError.createUserLoginRequiredError();
    let err: ClientAuthError;

    try {
      throw userLoginRequiredError;
    } catch (error) {
      err = error;
    }

    expect(err.errorCode).toBe(ClientAuthErrorMessage.userLoginRequiredError.code);
    expect(err.errorMessage).toBe(ClientAuthErrorMessage.userLoginRequiredError.desc);
    expect(err.message).toBe(ClientAuthErrorMessage.userLoginRequiredError.desc);
    expect(err.name).toBe("ClientAuthError");
    expect(err.stack).toContain("ClientAuthError.spec.ts");
  });

  it("createUserDoesNotExistError creates a ClientAuthError object", () => {

    const userDoesNotExistError = ClientAuthError.createUserDoesNotExistError();
    let err: ClientAuthError;

    try {
      throw userDoesNotExistError;
    } catch (error) {
      err = error;
    }

    expect(err.errorCode).toBe(ClientAuthErrorMessage.userDoesNotExistError.code);
    expect(err.errorMessage).toBe(ClientAuthErrorMessage.userDoesNotExistError.desc);
    expect(err.message).toBe(ClientAuthErrorMessage.userDoesNotExistError.desc);
    expect(err.name).toBe("ClientAuthError");
    expect(err.stack).toContain("ClientAuthError.spec.ts");
  });

  it("createClientInfoDecodingError creates a ClientAuthError object", () => {

    const caughtErrorString = "There was an error.";
    const clientInfoDecodingError = ClientAuthError.createClientInfoDecodingError(caughtErrorString);
    let err: ClientAuthError;

    try {
      throw clientInfoDecodingError;
    } catch (error) {
      err = error;
    }

    expect(err.errorCode).toBe(ClientAuthErrorMessage.clientInfoDecodingError.code);
    expect(err.errorMessage).toContain(ClientAuthErrorMessage.clientInfoDecodingError.desc);
    expect(err.errorMessage).toContain(caughtErrorString);
    expect(err.message).toContain(ClientAuthErrorMessage.clientInfoDecodingError.desc);
    expect(err.name).toBe("ClientAuthError");
    expect(err.stack).toContain("ClientAuthError.spec.ts");
  });

  it("createClientInfoNotPopulatedError creates a ClientAuthError object", () => {

    const caughtErrorString = "There was an error.";
    const clientInfoNotPopulatedError = ClientAuthError.createClientInfoNotPopulatedError(caughtErrorString);
    let err: ClientAuthError;

    try {
      throw clientInfoNotPopulatedError;
    } catch (error) {
      err = error;
    }

    expect(err.errorCode).toBe(ClientAuthErrorMessage.clientInfoNotPopulatedError.code);
    expect(err.errorMessage).toContain(ClientAuthErrorMessage.clientInfoNotPopulatedError.desc);
    expect(err.errorMessage).toContain(caughtErrorString);
    expect(err.message).toContain(ClientAuthErrorMessage.clientInfoNotPopulatedError.desc);
    expect(err.name).toBe("ClientAuthError");
    expect(err.stack).toContain("ClientAuthError.spec.ts");
  });

  it("createIdTokenNullOrEmptyError creates a ClientAuthError object", () => {

    const invalidRawIdToken = "invalidRawIdToken";
    const nullOrEmptyIdTokenError = ClientAuthError.createIdTokenNullOrEmptyError(invalidRawIdToken);
    let err: ClientAuthError;

    try {
      throw nullOrEmptyIdTokenError;
    } catch (error) {
      err = error;
    }

    expect(err.errorCode).toBe(ClientAuthErrorMessage.nullOrEmptyIdToken.code);
    expect(err.errorMessage).toContain(ClientAuthErrorMessage.nullOrEmptyIdToken.desc);
    expect(err.errorMessage).toContain(invalidRawIdToken);
    expect(err.message).toContain(ClientAuthErrorMessage.nullOrEmptyIdToken.desc);
    expect(err.name).toBe("ClientAuthError");
    expect(err.stack).toContain("ClientAuthError.spec.ts");
  });

  it("createIdTokenParsingError creates a ClientAuthError object", () => {

    const invalidIdToken = "You can't parse this.";
    const createIdTokenParsingError = ClientAuthError.createIdTokenParsingError(invalidIdToken);
    let err: ClientAuthError;

    try {
      throw createIdTokenParsingError;
    } catch (error) {
      err = error;
    }

    expect(err.errorCode).toBe(ClientAuthErrorMessage.idTokenNotParsed.code);
    expect(err.errorMessage).toContain(ClientAuthErrorMessage.idTokenNotParsed.desc);
    expect(err.errorMessage).toContain(invalidIdToken);
    expect(err.message).toContain(ClientAuthErrorMessage.idTokenNotParsed.desc);
    expect(err.name).toBe("ClientAuthError");
    expect(err.stack).toContain("ClientAuthError.spec.ts");
  });

  it("createTokenEncodingError creates a ClientAuthError object", () => {

    const incorrectlyEncodedToken = "This isn't encoded correctly!";
    const tokenEncodingError = ClientAuthError.createTokenEncodingError(incorrectlyEncodedToken);
    let err: ClientAuthError;

    try {
      throw tokenEncodingError;
    } catch (error) {
      err = error;
    }

    expect(err.errorCode).toBe(ClientAuthErrorMessage.tokenEncodingError.code);
    expect(err.errorMessage).toContain(ClientAuthErrorMessage.tokenEncodingError.desc);
    expect(err.errorMessage).toContain(incorrectlyEncodedToken);
    expect(err.message).toContain(ClientAuthErrorMessage.tokenEncodingError.desc);
    expect(err.name).toBe("ClientAuthError");
    expect(err.stack).toContain("ClientAuthError.spec.ts");
  });

});


