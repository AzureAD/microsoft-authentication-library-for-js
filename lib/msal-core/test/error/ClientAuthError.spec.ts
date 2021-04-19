import { expect } from "chai";
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

    expect(err instanceof ClientAuthError).to.be.true;
    expect(err instanceof AuthError).to.be.true;
    expect(err instanceof Error).to.be.true;
    expect(err.errorCode).to.equal(TEST_ERROR_CODE);
    expect(err.errorMessage).to.equal(TEST_ERROR_MSG);
    expect(err.message).to.equal(TEST_ERROR_MSG);
    expect(err.name).to.equal("ClientAuthError");
    expect(err.stack).to.include("ClientAuthError.spec.ts");
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

    expect(err.errorCode).to.equal(ClientAuthErrorMessage.endpointResolutionError.code);
    expect(err.errorMessage).to.include(ClientAuthErrorMessage.endpointResolutionError.desc);
    expect(err.errorMessage).to.include(ERROR_DETAIL);
    expect(err.message).to.include(ClientAuthErrorMessage.endpointResolutionError.desc);
    expect(err.name).to.equal("ClientAuthError");
    expect(err.stack).to.include("ClientAuthError.spec.ts");

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

    expect(err.errorCode).to.equal(ClientAuthErrorMessage.popUpWindowError.code);
    expect(err.errorMessage).to.include(ClientAuthErrorMessage.popUpWindowError.desc);
    expect(err.errorMessage).to.include(ERROR_DETAIL);
    expect(err.message).to.include(ClientAuthErrorMessage.popUpWindowError.desc);
    expect(err.name).to.equal("ClientAuthError");
    expect(err.stack).to.include("ClientAuthError.spec.ts");
  });

  it("createTokenRenewalTimeoutError creates a ClientAuthError object", () => {

    const tokenRenewalTimeOutError = ClientAuthError.createTokenRenewalTimeoutError();
    let err: ClientAuthError;

    try {
      throw tokenRenewalTimeOutError;
    } catch (error) {
      err = error;
    }

    expect(err.errorCode).to.equal(ClientAuthErrorMessage.tokenRenewalError.code);
    expect(err.errorMessage).to.equal(ClientAuthErrorMessage.tokenRenewalError.desc);
    expect(err.message).to.equal(ClientAuthErrorMessage.tokenRenewalError.desc);
    expect(err.name).to.equal("ClientAuthError");
    expect(err.stack).to.include("ClientAuthError.spec.ts");
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

    expect(err.errorCode).to.equal(ClientAuthErrorMessage.invalidIdToken.code);
    expect(err.errorMessage).to.include(ClientAuthErrorMessage.invalidIdToken.desc);
    expect(err.message).to.include(ClientAuthErrorMessage.invalidIdToken.desc);
    expect(err.name).to.equal("ClientAuthError");
    expect(err.stack).to.include("ClientAuthError.spec.ts");
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

    expect(err.errorCode).to.equal(ClientAuthErrorMessage.invalidStateError.code);
    expect(err.errorMessage).to.include(ClientAuthErrorMessage.invalidStateError.desc);
    expect(err.errorMessage).to.include(`${invalidState}, state expected : ${state}.`);
    expect(err.message).to.include(ClientAuthErrorMessage.invalidStateError.desc);
    expect(err.name).to.equal("ClientAuthError");
    expect(err.stack).to.include("ClientAuthError.spec.ts");
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

    expect(err.errorCode).to.equal(ClientAuthErrorMessage.nonceMismatchError.code);
    expect(err.errorMessage).to.include(ClientAuthErrorMessage.nonceMismatchError.desc);
    expect(err.errorMessage).to.include(`${invalidNonce}, nonce expected : ${nonce}.`);
    expect(err.message).to.include(ClientAuthErrorMessage.nonceMismatchError.desc);
    expect(err.name).to.equal("ClientAuthError");
    expect(err.stack).to.include("ClientAuthError.spec.ts");
  });

  it("createLoginInProgressError creates a ClientAuthError object", () => {

    const loginInProgressError = ClientAuthError.createLoginInProgressError();
    let err: ClientAuthError;

    try {
      throw loginInProgressError;
    } catch (error) {
      err = error;
    }

    expect(err.errorCode).to.equal(ClientAuthErrorMessage.loginProgressError.code);
    expect(err.errorMessage).to.equal(ClientAuthErrorMessage.loginProgressError.desc);
    expect(err.message).to.equal(ClientAuthErrorMessage.loginProgressError.desc);
    expect(err.name).to.equal("ClientAuthError");
    expect(err.stack).to.include("ClientAuthError.spec.ts");
  });

  it("createAcquireTokenInProgressError creates a ClientAuthError object", () => {

    const acqTokenInProgressError = ClientAuthError.createAcquireTokenInProgressError();
    let err: ClientAuthError;

    try {
      throw acqTokenInProgressError;
    } catch (error) {
      err = error;
    }

    expect(err.errorCode).to.equal(ClientAuthErrorMessage.acquireTokenProgressError.code);
    expect(err.errorMessage).to.equal(ClientAuthErrorMessage.acquireTokenProgressError.desc);
    expect(err.message).to.equal(ClientAuthErrorMessage.acquireTokenProgressError.desc);
    expect(err.name).to.equal("ClientAuthError");
    expect(err.stack).to.include("ClientAuthError.spec.ts");
  });

  it("createUserCancelledError creates a ClientAuthError object", () => {

    const userCancelledError = ClientAuthError.createUserCancelledError();
    let err: ClientAuthError;

    try {
      throw userCancelledError;
    } catch (error) {
      err = error;
    }

    expect(err.errorCode).to.equal(ClientAuthErrorMessage.userCancelledError.code);
    expect(err.errorMessage).to.equal(ClientAuthErrorMessage.userCancelledError.desc);
    expect(err.message).to.equal(ClientAuthErrorMessage.userCancelledError.desc);
    expect(err.name).to.equal("ClientAuthError");
    expect(err.stack).to.include("ClientAuthError.spec.ts");
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

    expect(err.errorCode).to.equal(ClientAuthErrorMessage.callbackError.code);
    expect(err.errorMessage).to.include(ClientAuthErrorMessage.callbackError.desc);
    expect(err.errorMessage).to.include(ClientAuthErrorMessage.callbackError.desc);
    expect(err.message).to.include(`${ERROR_DESC}`);
    expect(err.name).to.equal("ClientAuthError");
    expect(err.stack).to.include("ClientAuthError.spec.ts");
  });

  it("createUserLoginRequiredError creates a ClientAuthError object", () => {

    const userLoginRequiredError = ClientAuthError.createUserLoginRequiredError();
    let err: ClientAuthError;

    try {
      throw userLoginRequiredError;
    } catch (error) {
      err = error;
    }

    expect(err.errorCode).to.equal(ClientAuthErrorMessage.userLoginRequiredError.code);
    expect(err.errorMessage).to.equal(ClientAuthErrorMessage.userLoginRequiredError.desc);
    expect(err.message).to.equal(ClientAuthErrorMessage.userLoginRequiredError.desc);
    expect(err.name).to.equal("ClientAuthError");
    expect(err.stack).to.include("ClientAuthError.spec.ts");
  });

  it("createUserDoesNotExistError creates a ClientAuthError object", () => {

    const userDoesNotExistError = ClientAuthError.createUserDoesNotExistError();
    let err: ClientAuthError;

    try {
      throw userDoesNotExistError;
    } catch (error) {
      err = error;
    }

    expect(err.errorCode).to.equal(ClientAuthErrorMessage.userDoesNotExistError.code);
    expect(err.errorMessage).to.equal(ClientAuthErrorMessage.userDoesNotExistError.desc);
    expect(err.message).to.equal(ClientAuthErrorMessage.userDoesNotExistError.desc);
    expect(err.name).to.equal("ClientAuthError");
    expect(err.stack).to.include("ClientAuthError.spec.ts");
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

    expect(err.errorCode).to.equal(ClientAuthErrorMessage.clientInfoDecodingError.code);
    expect(err.errorMessage).to.include(ClientAuthErrorMessage.clientInfoDecodingError.desc);
    expect(err.errorMessage).to.include(caughtErrorString);
    expect(err.message).to.include(ClientAuthErrorMessage.clientInfoDecodingError.desc);
    expect(err.name).to.equal("ClientAuthError");
    expect(err.stack).to.include("ClientAuthError.spec.ts");
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

    expect(err.errorCode).to.equal(ClientAuthErrorMessage.clientInfoNotPopulatedError.code);
    expect(err.errorMessage).to.include(ClientAuthErrorMessage.clientInfoNotPopulatedError.desc);
    expect(err.errorMessage).to.include(caughtErrorString);
    expect(err.message).to.include(ClientAuthErrorMessage.clientInfoNotPopulatedError.desc);
    expect(err.name).to.equal("ClientAuthError");
    expect(err.stack).to.include("ClientAuthError.spec.ts");
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

    expect(err.errorCode).to.equal(ClientAuthErrorMessage.nullOrEmptyIdToken.code);
    expect(err.errorMessage).to.include(ClientAuthErrorMessage.nullOrEmptyIdToken.desc);
    expect(err.errorMessage).to.include(invalidRawIdToken);
    expect(err.message).to.include(ClientAuthErrorMessage.nullOrEmptyIdToken.desc);
    expect(err.name).to.equal("ClientAuthError");
    expect(err.stack).to.include("ClientAuthError.spec.ts");
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

    expect(err.errorCode).to.equal(ClientAuthErrorMessage.idTokenNotParsed.code);
    expect(err.errorMessage).to.include(ClientAuthErrorMessage.idTokenNotParsed.desc);
    expect(err.errorMessage).to.include(invalidIdToken);
    expect(err.message).to.include(ClientAuthErrorMessage.idTokenNotParsed.desc);
    expect(err.name).to.equal("ClientAuthError");
    expect(err.stack).to.include("ClientAuthError.spec.ts");
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

    expect(err.errorCode).to.equal(ClientAuthErrorMessage.tokenEncodingError.code);
    expect(err.errorMessage).to.include(ClientAuthErrorMessage.tokenEncodingError.desc);
    expect(err.errorMessage).to.include(incorrectlyEncodedToken);
    expect(err.message).to.include(ClientAuthErrorMessage.tokenEncodingError.desc);
    expect(err.name).to.equal("ClientAuthError");
    expect(err.stack).to.include("ClientAuthError.spec.ts");
  });

});


