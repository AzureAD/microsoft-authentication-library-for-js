import * as mocha from "mocha";
import { expect } from "chai";
import { ClientConfigurationError, ClientConfigurationErrorMessage } from "../../src/error/ClientConfigurationError";

// TODO: Should we test the type of object created? Also setPrototypeOf() related test to be added if needed.
describe("ClientConfigurationError", () => {

  it("ClientConfigurationError object can be created", () => {

    const TEST_ERROR_CODE: string = "test";
    const TEST_ERROR_MSG: string = "This is a test error";
    const clientConfigError = new ClientConfigurationError(TEST_ERROR_CODE, TEST_ERROR_MSG);
    let err: ClientConfigurationError;

    try {
      throw clientConfigError;
    } catch (error) {
      err = error;
    }

    expect(err.errorCode).to.equal(TEST_ERROR_CODE);
    expect(err.errorMessage).to.equal(TEST_ERROR_MSG);
    expect(err.message).to.equal(TEST_ERROR_MSG);
    expect(err.name).to.equal("ClientConfigurationError");
    expect(err.stack).to.include("ClientConfigurationError.spec.js");
  });

  it("createInvalidCacheLocationConfigError creates a ClientConfigurationError object", () => {

    const givenCacheLocation = "mock_storage";
    const invalidCacheError = ClientConfigurationError.createInvalidCacheLocationConfigError(givenCacheLocation);
    let err: ClientConfigurationError;

    try {
      throw invalidCacheError;
    } catch (error) {
      err = error;
    }

    expect(err.errorCode).to.equal(ClientConfigurationErrorMessage.invalidCacheLocation.code);
    expect(err.errorMessage).to.include(ClientConfigurationErrorMessage.invalidCacheLocation.desc);
    expect(err.errorMessage).to.include(givenCacheLocation);
    expect(err.message).to.include(ClientConfigurationErrorMessage.invalidCacheLocation.desc);
    expect(err.name).to.equal("ClientConfigurationError");
    expect(err.stack).to.include("ClientConfigurationError.spec.js");
  });

  it("createNoStorageSupportError creates a ClientConfigurationError object", () => {

    const noStorageSupportError = ClientConfigurationError.createNoStorageSupportedError();
    let err: ClientConfigurationError;

    try {
      throw noStorageSupportError;
    } catch (error) {
      err = error;
    }

    expect(err.errorCode).to.equal(ClientConfigurationErrorMessage.noStorageSupported.code);
    expect(err.errorMessage).to.include(ClientConfigurationErrorMessage.noStorageSupported.desc);
    expect(err.message).to.include(ClientConfigurationErrorMessage.noStorageSupported.desc);
    expect(err.name).to.equal("ClientConfigurationError");
    expect(err.stack).to.include("ClientConfigurationError.spec.js");
  });

  it("createRedirectCallbacksNotSetError creates a ClientConfigurationError object", () => {

    const callbacksNotSetError = ClientConfigurationError.createRedirectCallbacksNotSetError();
    let err: ClientConfigurationError;

    try {
      throw callbacksNotSetError;
    } catch (error) {
      err = error;
    }

    expect(err.errorCode).to.equal(ClientConfigurationErrorMessage.noRedirectCallbacksSet.code);
    expect(err.errorMessage).to.equal(ClientConfigurationErrorMessage.noRedirectCallbacksSet.desc);
    expect(err.message).to.equal(ClientConfigurationErrorMessage.noRedirectCallbacksSet.desc);
    expect(err.name).to.equal("ClientConfigurationError");
    expect(err.stack).to.include("ClientConfigurationError.spec.js");
  });

  it("createInvalidCallbackObjectError creates a ClientConfigurationError object", () => {

    const callbackFunction: Function = null;
    const invalidCallBackObject = ClientConfigurationError.createInvalidCallbackObjectError(callbackFunction);
    let err: ClientConfigurationError;

    try {
      throw invalidCallBackObject;
    } catch (error) {
      err = error;
    }

    expect(err.errorCode).to.equal(ClientConfigurationErrorMessage.invalidCallbackObject.code);
    expect(err.errorMessage).to.include(ClientConfigurationErrorMessage.invalidCallbackObject.desc);
    expect(err.errorMessage).to.include(`Given value for callback function: ${callbackFunction}`);
    expect(err.message).to.include(ClientConfigurationErrorMessage.invalidCallbackObject.desc);
    expect(err.name).to.equal("ClientConfigurationError");
    expect(err.stack).to.include("ClientConfigurationError.spec.js");
  });

  it("createEmptyScopesArrayError creates a ClientConfigurationError object", () => {

    const scopesValue = "[]";
    const emptyScopesError = ClientConfigurationError.createEmptyScopesArrayError(scopesValue);
    let err: ClientConfigurationError;

    try {
      throw emptyScopesError;
    } catch (error) {
      err = error;
    }

    expect(err.errorCode).to.equal(ClientConfigurationErrorMessage.emptyScopes.code);
    expect(err.errorMessage).to.include(ClientConfigurationErrorMessage.emptyScopes.desc);
    expect(err.errorMessage).to.include(`Given value: ${scopesValue}`);
    expect(err.message).to.include(ClientConfigurationErrorMessage.emptyScopes.desc);
    expect(err.name).to.equal("ClientConfigurationError");
    expect(err.stack).to.include("ClientConfigurationError.spec.js");
  });

  it("createScopesNonArrayError creates a ClientConfigurationError object", () => {

    const scopesValue = "user.read";
    const nonArrayScopesError = ClientConfigurationError.createScopesNonArrayError(scopesValue);
    let err: ClientConfigurationError;

    try {
      throw nonArrayScopesError;
    } catch (error) {
      err = error;
    }

    expect(err.errorCode).to.equal(ClientConfigurationErrorMessage.nonArrayScopes.code);
    expect(err.errorMessage).to.include(ClientConfigurationErrorMessage.nonArrayScopes.desc);
    expect(err.errorMessage).to.include(`Given value: ${scopesValue}`);
    expect(err.message).to.include(ClientConfigurationErrorMessage.nonArrayScopes.desc);
    expect(err.name).to.equal("ClientConfigurationError");
    expect(err.stack).to.include("ClientConfigurationError.spec.js");
  });

  it("createClientIdSingleScopeError creates a ClientConfigurationError object", () => {

    const scopesValue = "user.read";
    const singleScopeError = ClientConfigurationError.createClientIdSingleScopeError(scopesValue);
    let err: ClientConfigurationError;

    try {
      throw singleScopeError;
    } catch (error) {
      err = error;
    }

    expect(err.errorCode).to.equal(ClientConfigurationErrorMessage.clientScope.code);
    expect(err.errorMessage).to.include(ClientConfigurationErrorMessage.clientScope.desc);
    expect(err.errorMessage).to.include(`Given value: ${scopesValue}`);
    expect(err.message).to.include(ClientConfigurationErrorMessage.clientScope.desc);
    expect(err.name).to.equal("ClientConfigurationError");
    expect(err.stack).to.include("ClientConfigurationError.spec.js");
  });

  it("createScopesRequiredError creates a ClientConfigurationError object", () => {

    const scopesValue = "random";
    const scopesRequiredError = ClientConfigurationError.createScopesRequiredError(scopesValue);
    let err: ClientConfigurationError;

    try {
      throw scopesRequiredError;
    } catch (error) {
      err = error;
    }

    expect(err.errorCode).to.equal(ClientConfigurationErrorMessage.scopesRequired.code);
    expect(err.errorMessage).to.include(ClientConfigurationErrorMessage.scopesRequired.desc);
    expect(err.errorMessage).to.include(`Given value: ${scopesValue}`);
    expect(err.message).to.include(ClientConfigurationErrorMessage.scopesRequired.desc);
    expect(err.name).to.equal("ClientConfigurationError");
    expect(err.stack).to.include("ClientConfigurationError.spec.js");
  });

  it("createInvalidPromptError creates a ClientConfigurationError object", () => {

    const promptValue = "random";
    const invalidPromptError = ClientConfigurationError.createInvalidPromptError(promptValue);
    let err: ClientConfigurationError;

    try {
      throw invalidPromptError;
    } catch (error) {
      err = error;
    }

    expect(err.errorCode).to.equal(ClientConfigurationErrorMessage.invalidPrompt.code);
    expect(err.errorMessage).to.include(ClientConfigurationErrorMessage.invalidPrompt.desc);
    expect(err.errorMessage).to.include(`Given value: ${promptValue}`);
    expect(err.message).to.include(ClientConfigurationErrorMessage.invalidPrompt.desc);
    expect(err.name).to.equal("ClientConfigurationError");
    expect(err.stack).to.include("ClientConfigurationError.spec.js");
  });

});



