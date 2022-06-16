import { ClientAuthError, ClientAuthErrorMessage } from "../../src/error/ClientAuthError";
import { AuthError } from "../../src/error/AuthError";

describe("ClientAuthError.ts Class Unit Tests", () => {

    it("ClientAuthError object can be created", () => {
        const TEST_ERROR_CODE: string = "test";
        const TEST_ERROR_MSG: string = "This is a test error";
        const err: ClientAuthError = new ClientAuthError(TEST_ERROR_CODE, TEST_ERROR_MSG);

        expect(err instanceof ClientAuthError).toBe(true);
        expect(err instanceof AuthError).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err.errorCode).toBe(TEST_ERROR_CODE);
        expect(err.errorMessage).toBe(TEST_ERROR_MSG);
        expect(err.message).toBe(`${TEST_ERROR_CODE}: ${TEST_ERROR_MSG}`);
        expect(err.name).toBe("ClientAuthError");
        expect(err.stack?.includes("ClientAuthError.spec.ts")).toBe(true);
    });

    it("createClientInfoDecodingError creates a ClientAuthError object", () => {
        const err: ClientAuthError = ClientAuthError.createClientInfoDecodingError("Caught decoding error.");

        expect(err instanceof ClientAuthError).toBe(true);
        expect(err instanceof AuthError).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err.errorCode).toBe(ClientAuthErrorMessage.clientInfoDecodingError.code);
        expect(err.errorMessage.includes(ClientAuthErrorMessage.clientInfoDecodingError.desc)).toBe(true);
        expect(err.message.includes(ClientAuthErrorMessage.clientInfoDecodingError.desc)).toBe(true);
        expect(err.name).toBe("ClientAuthError");
        expect(err.stack?.includes("ClientAuthError.spec.ts")).toBe(true);
    });

    it("createClientInfoEmptyError creates a ClientAuthError object", () => {
        const err: ClientAuthError = ClientAuthError.createClientInfoEmptyError();

        expect(err instanceof ClientAuthError).toBe(true);
        expect(err instanceof AuthError).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err.errorCode).toBe(ClientAuthErrorMessage.clientInfoEmptyError.code);
        expect(err.errorMessage.includes(ClientAuthErrorMessage.clientInfoEmptyError.desc)).toBe(true);
        expect(err.message.includes(ClientAuthErrorMessage.clientInfoEmptyError.desc)).toBe(true);
        expect(err.name).toBe("ClientAuthError");
        expect(err.stack?.includes("ClientAuthError.spec.ts")).toBe(true);
    });

    it("createIdTokenParsingError creates a ClientAuthError object", () => {
        const err: ClientAuthError = ClientAuthError.createTokenParsingError("Raw client info.");

        expect(err instanceof ClientAuthError).toBe(true);
        expect(err instanceof AuthError).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err.errorCode).toBe(ClientAuthErrorMessage.tokenParsingError.code);
        expect(err.errorMessage.includes(ClientAuthErrorMessage.tokenParsingError.desc)).toBe(true);
        expect(err.message.includes(ClientAuthErrorMessage.tokenParsingError.desc)).toBe(true);
        expect(err.name).toBe("ClientAuthError");
        expect(err.stack?.includes("ClientAuthError.spec.ts")).toBe(true);
    });

    it("createIdTokenNullOrEmptyError creates a ClientAuthError object", () => {
        const err: ClientAuthError = ClientAuthError.createTokenNullOrEmptyError("Invalid Raw IdToken string.");

        expect(err instanceof ClientAuthError).toBe(true);
        expect(err instanceof AuthError).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err.errorCode).toBe(ClientAuthErrorMessage.nullOrEmptyToken.code);
        expect(err.errorMessage.includes(ClientAuthErrorMessage.nullOrEmptyToken.desc)).toBe(true);
        expect(err.message.includes(ClientAuthErrorMessage.nullOrEmptyToken.desc)).toBe(true);
        expect(err.name).toBe("ClientAuthError");
        expect(err.stack?.includes("ClientAuthError.spec.ts")).toBe(true);
    });

    it("createEndpointDiscoveryIncompleteError creates a ClientAuthError object", () => {
        const err: ClientAuthError = ClientAuthError.createEndpointDiscoveryIncompleteError("Test endpoint error.");

        expect(err instanceof ClientAuthError).toBe(true);
        expect(err instanceof AuthError).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err.errorCode).toBe(ClientAuthErrorMessage.endpointResolutionError.code);
        expect(err.errorMessage.includes(ClientAuthErrorMessage.endpointResolutionError.desc)).toBe(true);
        expect(err.message.includes(ClientAuthErrorMessage.endpointResolutionError.desc)).toBe(true);
        expect(err.name).toBe("ClientAuthError");
        expect(err.stack?.includes("ClientAuthError.spec.ts")).toBe(true);
    });

    it("createHashNotDeserializedError creates a ClientAuthError object", () => {
        const err: ClientAuthError = ClientAuthError.createHashNotDeserializedError("Couldn't deserialize hash object correctly");

        expect(err instanceof ClientAuthError).toBe(true);
        expect(err instanceof AuthError).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err.errorCode).toBe(ClientAuthErrorMessage.hashNotDeserialized.code);
        expect(err.errorMessage.includes(ClientAuthErrorMessage.hashNotDeserialized.desc)).toBe(true);
        expect(err.message.includes(ClientAuthErrorMessage.hashNotDeserialized.desc)).toBe(true);
        expect(err.name).toBe("ClientAuthError");
        expect(err.stack?.includes("ClientAuthError.spec.ts")).toBe(true);
    });

    it("createStateMismatchError creates a ClientAuthError object", () => {
        const err: ClientAuthError = ClientAuthError.createStateMismatchError();

        expect(err instanceof ClientAuthError).toBe(true);
        expect(err instanceof AuthError).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err.errorCode).toBe(ClientAuthErrorMessage.stateMismatchError.code);
        expect(err.errorMessage.includes(ClientAuthErrorMessage.stateMismatchError.desc)).toBe(true);
        expect(err.message.includes(ClientAuthErrorMessage.stateMismatchError.desc)).toBe(true);
        expect(err.name).toBe("ClientAuthError");
        expect(err.stack?.includes("ClientAuthError.spec.ts")).toBe(true);
    });

    it("createNonceMismatchError creates a ClientAuthError object", () => {
        const err: ClientAuthError = ClientAuthError.createNonceMismatchError();

        expect(err instanceof ClientAuthError).toBe(true);
        expect(err instanceof AuthError).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err.errorCode).toBe(ClientAuthErrorMessage.nonceMismatchError.code);
        expect(err.errorMessage.includes(ClientAuthErrorMessage.nonceMismatchError.desc)).toBe(true);
        expect(err.message.includes(ClientAuthErrorMessage.nonceMismatchError.desc)).toBe(true);
        expect(err.name).toBe("ClientAuthError");
        expect(err.stack?.includes("ClientAuthError.spec.ts")).toBe(true);
    });

    it("createMultipleMatchingTokensInCacheError creates a ClientAuthError object", () => {
        const err: ClientAuthError = ClientAuthError.createMultipleMatchingTokensInCacheError();

        expect(err instanceof ClientAuthError).toBe(true);
        expect(err instanceof AuthError).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err.errorCode).toBe(ClientAuthErrorMessage.multipleMatchingTokens.code);
        expect(err.errorMessage.includes(ClientAuthErrorMessage.multipleMatchingTokens.desc)).toBe(true);
        expect(err.message.includes(ClientAuthErrorMessage.multipleMatchingTokens.desc)).toBe(true);
        expect(err.name).toBe("ClientAuthError");
        expect(err.stack?.includes("ClientAuthError.spec.ts")).toBe(true);
    });

    it("createTokenRequestCannotBeMadeError creates a ClientAuthError object", () => {
        const err: ClientAuthError = ClientAuthError.createTokenRequestCannotBeMadeError();

        expect(err instanceof ClientAuthError).toBe(true);
        expect(err instanceof AuthError).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err.errorCode).toBe(ClientAuthErrorMessage.tokenRequestCannotBeMade.code);
        expect(err.errorMessage.includes(ClientAuthErrorMessage.tokenRequestCannotBeMade.desc)).toBe(true);
        expect(err.message.includes(ClientAuthErrorMessage.tokenRequestCannotBeMade.desc)).toBe(true);
        expect(err.name).toBe("ClientAuthError");
        expect(err.stack?.includes("ClientAuthError.spec.ts")).toBe(true);
    });

    it("createAppendEmptyScopeToSetError creates a ClientAuthError object", () => {
        const err: ClientAuthError = ClientAuthError.createAppendEmptyScopeToSetError("");

        expect(err instanceof ClientAuthError).toBe(true);
        expect(err instanceof AuthError).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err.errorCode).toBe(ClientAuthErrorMessage.appendEmptyScopeError.code);
        expect(err.errorMessage.includes(ClientAuthErrorMessage.appendEmptyScopeError.desc)).toBe(true);
        expect(err.message.includes(ClientAuthErrorMessage.appendEmptyScopeError.desc)).toBe(true);
        expect(err.name).toBe("ClientAuthError");
        expect(err.stack?.includes("ClientAuthError.spec.ts")).toBe(true);
    });

    it("createRemoveEmptyScopeFromSetError creates a ClientAuthError object", () => {
        const err: ClientAuthError = ClientAuthError.createRemoveEmptyScopeFromSetError("");

        expect(err instanceof ClientAuthError).toBe(true);
        expect(err instanceof AuthError).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err.errorCode).toBe(ClientAuthErrorMessage.removeEmptyScopeError.code);
        expect(err.errorMessage.includes(ClientAuthErrorMessage.removeEmptyScopeError.desc)).toBe(true);
        expect(err.message.includes(ClientAuthErrorMessage.removeEmptyScopeError.desc)).toBe(true);
        expect(err.name).toBe("ClientAuthError");
        expect(err.stack?.includes("ClientAuthError.spec.ts")).toBe(true);
    });

    it("createAppendScopeSetError creates a ClientAuthError object", () => {
        const err: ClientAuthError = ClientAuthError.createAppendScopeSetError("Couldn't append scopeset");

        expect(err instanceof ClientAuthError).toBe(true);
        expect(err instanceof AuthError).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err.errorCode).toBe(ClientAuthErrorMessage.appendScopeSetError.code);
        expect(err.errorMessage.includes(ClientAuthErrorMessage.appendScopeSetError.desc)).toBe(true);
        expect(err.message.includes(ClientAuthErrorMessage.appendScopeSetError.desc)).toBe(true);
        expect(err.name).toBe("ClientAuthError");
        expect(err.stack?.includes("ClientAuthError.spec.ts")).toBe(true);
    });

    it("createEmptyInputScopeSetError creates a ClientAuthError object", () => {
        const err: ClientAuthError = ClientAuthError.createEmptyInputScopeSetError();

        expect(err instanceof ClientAuthError).toBe(true);
        expect(err instanceof AuthError).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err.errorCode).toBe(ClientAuthErrorMessage.emptyInputScopeSetError.code);
        expect(err.errorMessage.includes(ClientAuthErrorMessage.emptyInputScopeSetError.desc)).toBe(true);
        expect(err.message.includes(ClientAuthErrorMessage.emptyInputScopeSetError.desc)).toBe(true);
        expect(err.name).toBe("ClientAuthError");
        expect(err.stack?.includes("ClientAuthError.spec.ts")).toBe(true);
    });

    it("createDeviceCodeCancelledError creates a ClientAuthError object", () => {
        const err: ClientAuthError = ClientAuthError.createDeviceCodeCancelledError();

        expect(err instanceof ClientAuthError).toBe(true);
        expect(err instanceof AuthError).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err.errorCode).toBe(ClientAuthErrorMessage.DeviceCodePollingCancelled.code);
        expect(err.errorMessage.includes(ClientAuthErrorMessage.DeviceCodePollingCancelled.desc)).toBe(true);
        expect(err.message.includes(ClientAuthErrorMessage.DeviceCodePollingCancelled.desc)).toBe(true);
        expect(err.name).toBe("ClientAuthError");
        expect(err.stack?.includes("ClientAuthError.spec.ts")).toBe(true);
    });

    it("createDeviceCodeExpiredError creates a ClientAuthError object", () => {
        const err: ClientAuthError = ClientAuthError.createDeviceCodeExpiredError();

        expect(err instanceof ClientAuthError).toBe(true);
        expect(err instanceof AuthError).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err.errorCode).toBe(ClientAuthErrorMessage.DeviceCodeExpired.code);
        expect(err.errorMessage.includes(ClientAuthErrorMessage.DeviceCodeExpired.desc)).toBe(true);
        expect(err.message.includes(ClientAuthErrorMessage.DeviceCodeExpired.desc)).toBe(true);
        expect(err.name).toBe("ClientAuthError");
        expect(err.stack?.includes("ClientAuthError.spec.ts")).toBe(true);
    });

    it("createInvalidCacheTypeError creates a ClientAuthError object", () => {
        const err: ClientAuthError = ClientAuthError.createInvalidCacheTypeError();

        expect(err instanceof ClientAuthError).toBe(true);
        expect(err instanceof AuthError).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err.errorCode).toBe(ClientAuthErrorMessage.invalidCacheType.code);
        expect(err.errorMessage.includes(ClientAuthErrorMessage.invalidCacheType.desc)).toBe(true);
        expect(err.message.includes(ClientAuthErrorMessage.invalidCacheType.desc)).toBe(true);
        expect(err.name).toBe("ClientAuthError");
        expect(err.stack?.includes("ClientAuthError.spec.ts")).toBe(true);
    });

    it("createUnexpectedAccountTypeError creates a ClientAuthError object", () => {
        const err: ClientAuthError = ClientAuthError.createUnexpectedAccountTypeError();

        expect(err instanceof ClientAuthError).toBe(true);
        expect(err instanceof AuthError).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err.errorCode).toBe(ClientAuthErrorMessage.unexpectedAccountType.code);
        expect(err.errorMessage.includes(ClientAuthErrorMessage.unexpectedAccountType.desc)).toBe(true);
        expect(err.message.includes(ClientAuthErrorMessage.unexpectedAccountType.desc)).toBe(true);
        expect(err.name).toBe("ClientAuthError");
        expect(err.stack?.includes("ClientAuthError.spec.ts")).toBe(true);
    });

    it("createUnexpectedCredentialTypeError creates a ClientAuthError object", () => {
        const err: ClientAuthError = ClientAuthError.createUnexpectedCredentialTypeError();

        expect(err instanceof ClientAuthError).toBe(true);
        expect(err instanceof AuthError).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err.errorCode).toBe(ClientAuthErrorMessage.unexpectedCredentialType.code);
        expect(err.errorMessage.includes(ClientAuthErrorMessage.unexpectedCredentialType.desc)).toBe(true);
        expect(err.message.includes(ClientAuthErrorMessage.unexpectedCredentialType.desc)).toBe(true);
        expect(err.name).toBe("ClientAuthError");
        expect(err.stack?.includes("ClientAuthError.spec.ts")).toBe(true);
    });

    it("createBindingKeyNotRemovedError creates a ClientAuthError object", () => {
        const err: ClientAuthError = ClientAuthError.createBindingKeyNotRemovedError();

        expect(err instanceof ClientAuthError).toBe(true);
        expect(err instanceof AuthError).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err.errorCode).toBe(ClientAuthErrorMessage.bindingKeyNotRemovedError.code);
        expect(err.errorMessage.includes(ClientAuthErrorMessage.bindingKeyNotRemovedError.desc)).toBe(true);
        expect(err.message.includes(ClientAuthErrorMessage.bindingKeyNotRemovedError.desc)).toBe(true);
        expect(err.name).toBe("ClientAuthError");
        expect(err.stack?.includes("ClientAuthError.spec.ts")).toBe(true);
    });

    it("createLogoutNotSupportedError creates a ClientAuthError object", () => {
        const err: ClientAuthError = ClientAuthError.createLogoutNotSupportedError();

        expect(err instanceof ClientAuthError).toBe(true);
        expect(err instanceof AuthError).toBe(true);
        expect(err instanceof Error).toBe(true);
        expect(err.errorCode).toBe(ClientAuthErrorMessage.logoutNotSupported.code);
        expect(err.errorMessage.includes(ClientAuthErrorMessage.logoutNotSupported.desc)).toBe(true);
        expect(err.message.includes(ClientAuthErrorMessage.logoutNotSupported.desc)).toBe(true);
        expect(err.name).toBe("ClientAuthError");
        expect(err.stack?.includes("ClientAuthError.spec.ts")).toBe(true);
    });


});
