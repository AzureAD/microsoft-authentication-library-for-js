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

    expect(err instanceof ClientConfigurationError).toBe(true);
    expect(err instanceof ClientAuthError).toBe(true);
    expect(err instanceof AuthError).toBe(true);
    expect(err instanceof Error).toBe(true);
    expect(err.errorCode).toBe(TEST_ERROR_CODE);
    expect(err.errorMessage).toBe(TEST_ERROR_MSG);
    expect(err.message).toBe(TEST_ERROR_MSG);
    expect(err.name).toBe("ClientConfigurationError");
    expect(err.stack).toContain("ClientConfigurationError.spec.ts");
  });

  it("createNoStorageSupportError creates a ClientConfigurationError object", () => {

    const noStorageSupportError = ClientConfigurationError.createStorageNotSupportedError("randomCacheLocation");
    let err: ClientConfigurationError;

    try {
      throw noStorageSupportError;
    } catch (error) {
      err = error;
    }

    expect(err.errorCode).toBe(ClientConfigurationErrorMessage.storageNotSupported.code);
    expect(err.errorMessage).toContain(ClientConfigurationErrorMessage.storageNotSupported.desc);
    expect(err.message).toContain(ClientConfigurationErrorMessage.storageNotSupported.desc);
    expect(err.errorMessage).toContain("randomCacheLocation");
    expect(err.message).toContain("randomCacheLocation");
    expect(err.name).toBe("ClientConfigurationError");
    expect(err.stack).toContain("ClientConfigurationError.spec.ts");
  });

  it("createRedirectCallbacksNotSetError creates a ClientConfigurationError object", () => {

    const callbacksNotSetError = ClientConfigurationError.createRedirectCallbacksNotSetError();
    let err: ClientConfigurationError;

    try {
      throw callbacksNotSetError;
    } catch (error) {
      err = error;
    }

    expect(err.errorCode).toBe(ClientConfigurationErrorMessage.noRedirectCallbacksSet.code);
    expect(err.errorMessage).toBe(ClientConfigurationErrorMessage.noRedirectCallbacksSet.desc);
    expect(err.message).toBe(ClientConfigurationErrorMessage.noRedirectCallbacksSet.desc);
    expect(err.name).toBe("ClientConfigurationError");
    expect(err.stack).toContain("ClientConfigurationError.spec.ts");
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

    expect(err.errorCode).toBe(ClientConfigurationErrorMessage.invalidCallbackObject.code);
    expect(err.errorMessage).toContain(ClientConfigurationErrorMessage.invalidCallbackObject.desc);
    expect(err.errorMessage).toContain(`Given value for callback function: ${callbackFunction}`);
    expect(err.message).toContain(ClientConfigurationErrorMessage.invalidCallbackObject.desc);
    expect(err.name).toBe("ClientConfigurationError");
    expect(err.stack).toContain("ClientConfigurationError.spec.ts");
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

    expect(err.errorCode).toBe(ClientConfigurationErrorMessage.emptyScopes.code);
    expect(err.errorMessage).toContain(ClientConfigurationErrorMessage.emptyScopes.desc);
    expect(err.errorMessage).toContain(`Given value: ${scopesValue}`);
    expect(err.message).toContain(ClientConfigurationErrorMessage.emptyScopes.desc);
    expect(err.name).toBe("ClientConfigurationError");
    expect(err.stack).toContain("ClientConfigurationError.spec.ts");
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

    expect(err.errorCode).toBe(ClientConfigurationErrorMessage.nonArrayScopes.code);
    expect(err.errorMessage).toContain(ClientConfigurationErrorMessage.nonArrayScopes.desc);
    expect(err.errorMessage).toContain(`Given value: ${scopesValue}`);
    expect(err.message).toContain(ClientConfigurationErrorMessage.nonArrayScopes.desc);
    expect(err.name).toBe("ClientConfigurationError");
    expect(err.stack).toContain("ClientConfigurationError.spec.ts");
  });
  
  it("createScopesRequiredError creates a ClientConfigurationError object", () => {

    const scopesValue = ["random"];
    const scopesRequiredError = ClientConfigurationError.createScopesRequiredError(scopesValue);
    let err: ClientConfigurationError;

    try {
      throw scopesRequiredError;
    } catch (error) {
      err = error;
    }

    expect(err.errorCode).toBe(ClientConfigurationErrorMessage.scopesRequired.code);
    expect(err.errorMessage).toContain(ClientConfigurationErrorMessage.scopesRequired.desc);
    expect(err.errorMessage).toContain(`Given value: ${scopesValue}`);
    expect(err.message).toContain(ClientConfigurationErrorMessage.scopesRequired.desc);
    expect(err.name).toBe("ClientConfigurationError");
    expect(err.stack).toContain("ClientConfigurationError.spec.ts");
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

    expect(err.errorCode).toBe(ClientConfigurationErrorMessage.invalidPrompt.code);
    expect(err.errorMessage).toContain(ClientConfigurationErrorMessage.invalidPrompt.desc);
    expect(err.errorMessage).toContain(`Given value: ${promptValue}`);
    expect(err.message).toContain(ClientConfigurationErrorMessage.invalidPrompt.desc);
    expect(err.name).toBe("ClientConfigurationError");
    expect(err.stack).toContain("ClientConfigurationError.spec.ts");
  });

  it("createInvalidCorrelationIdError creates a ClientConfigurationError object", () => {

    const invalidCorrelationId = ClientConfigurationError.createInvalidCorrelationIdError();
    let err: ClientConfigurationError;

    try {
      throw invalidCorrelationId;
    } catch (error) {
      err = error;
    }

    expect(err.errorCode).toBe(ClientConfigurationErrorMessage.invalidCorrelationIdError.code);
    expect(err.errorMessage).toContain(ClientConfigurationErrorMessage.invalidCorrelationIdError.desc);
    expect(err.message).toContain(ClientConfigurationErrorMessage.invalidCorrelationIdError.desc);
    expect(err.name).toBe("ClientConfigurationError");
    expect(err.stack).toContain("ClientConfigurationError.spec.ts");
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

    expect(err.errorCode).toBe(ClientConfigurationErrorMessage.telemetryConfigError.code);
    expect(err.errorMessage).toContain(ClientConfigurationErrorMessage.telemetryConfigError.desc);
    expect(err.errorMessage).toContain("applicationVersion");
    expect(err.message).toContain(ClientConfigurationErrorMessage.telemetryConfigError.desc);
    expect(err.name).toBe("ClientConfigurationError");
    expect(err.stack).toContain("ClientConfigurationError.spec.ts");
  });

});



