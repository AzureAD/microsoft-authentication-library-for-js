import * as mocha from "mocha";
import { expect } from "chai";
import { ClientConfigurationError, ClientConfigurationErrorMessage } from "../../src/error/ClientConfigurationError";
import { ClientAuthError, AuthError } from "../../src";

describe("ClientConfigurationError.ts Class", () => {

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

    expect(err instanceof ClientConfigurationError).to.be.true;
    expect(err instanceof ClientAuthError).to.be.true;
    expect(err instanceof AuthError).to.be.true;
    expect(err instanceof Error).to.be.true;
    expect(err.errorCode).to.equal(TEST_ERROR_CODE);
    expect(err.errorMessage).to.equal(TEST_ERROR_MSG);
    expect(err.message).to.equal(TEST_ERROR_MSG);
    expect(err.name).to.equal("ClientConfigurationError");
    expect(err.stack).to.include("ClientConfigurationError.spec.ts");
  });

  it("createNoStorageSupportError creates a ClientConfigurationError object", () => {

    const noStorageSupportError = ClientConfigurationError.createStorageNotSupportedError("randomCacheLocation");
    let err: ClientConfigurationError;

    try {
      throw noStorageSupportError;
    } catch (error) {
      err = error;
    }

    expect(err.errorCode).to.equal(ClientConfigurationErrorMessage.storageNotSupported.code);
    expect(err.errorMessage).to.include(ClientConfigurationErrorMessage.storageNotSupported.desc);
    expect(err.message).to.include(ClientConfigurationErrorMessage.storageNotSupported.desc);
    expect(err.errorMessage).to.include("randomCacheLocation");
    expect(err.message).to.include("randomCacheLocation");
    expect(err.name).to.equal("ClientConfigurationError");
    expect(err.stack).to.include("ClientConfigurationError.spec.ts");
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
    expect(err.stack).to.include("ClientConfigurationError.spec.ts");
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
    expect(err.stack).to.include("ClientConfigurationError.spec.ts");
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
    expect(err.stack).to.include("ClientConfigurationError.spec.ts");
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
    expect(err.stack).to.include("ClientConfigurationError.spec.ts");
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
    expect(err.stack).to.include("ClientConfigurationError.spec.ts");
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
    expect(err.stack).to.include("ClientConfigurationError.spec.ts");
  });

  it("createInvalidCorrelationIdError creates a ClientConfigurationError object", () => {

    const invalidCorrelationId = ClientConfigurationError.createInvalidCorrelationIdError();
    let err: ClientConfigurationError;

    try {
      throw invalidCorrelationId;
    } catch (error) {
      err = error;
    }

    expect(err.errorCode).to.equal(ClientConfigurationErrorMessage.invalidCorrelationIdError.code);
    expect(err.errorMessage).to.include(ClientConfigurationErrorMessage.invalidCorrelationIdError.desc);
    expect(err.message).to.include(ClientConfigurationErrorMessage.invalidCorrelationIdError.desc);
    expect(err.name).to.equal("ClientConfigurationError");
    expect(err.stack).to.include("ClientConfigurationError.spec.ts");
  });

  it("createTelemetryConfigError creates a ClientConfigurationError object", () => {
    // @ts-ignore
    const telemConfigErr: ClientConfigurationError = ClientConfigurationError.createTelemetryConfigError({
      applicationName: "missing something"
    });
    let err: ClientConfigurationError;

    try {
      throw telemConfigErr;
    } catch (error) {
      err = error;
    }

    expect(err.errorCode).to.equal(ClientConfigurationErrorMessage.telemetryConfigError.code);
    expect(err.errorMessage).to.include(ClientConfigurationErrorMessage.telemetryConfigError.desc);
    expect(err.errorMessage).to.include("applicationVersion");
    expect(err.message).to.include(ClientConfigurationErrorMessage.telemetryConfigError.desc);
    expect(err.name).to.equal("ClientConfigurationError");
    expect(err.stack).to.include("ClientConfigurationError.spec.ts");
  });

});



