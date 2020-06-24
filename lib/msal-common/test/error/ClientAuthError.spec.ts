import { expect } from "chai";
import { ClientAuthError, ClientAuthErrorMessage } from "../../src/error/ClientAuthError";
import { AuthError } from "../../src/error/AuthError";

describe("ClientAuthError.ts Class Unit Tests", () => {

    it("ClientAuthError object can be created", () => {
        const TEST_ERROR_CODE: string = "test";
        const TEST_ERROR_MSG: string = "This is a test error";
        const err: ClientAuthError = new ClientAuthError(TEST_ERROR_CODE, TEST_ERROR_MSG);

        expect(err instanceof ClientAuthError).to.be.true;
        expect(err instanceof AuthError).to.be.true;
        expect(err instanceof Error).to.be.true;
        expect(err.errorCode).to.equal(TEST_ERROR_CODE);
        expect(err.errorMessage).to.equal(TEST_ERROR_MSG);
        expect(err.message).to.equal(`${TEST_ERROR_CODE}: ${TEST_ERROR_MSG}`);
        expect(err.name).to.equal("ClientAuthError");
        expect(err.stack).to.include("ClientAuthError.spec.ts");
    });

    it("createClientInfoDecodingError creates a ClientAuthError object", () => {
        const err: ClientAuthError = ClientAuthError.createClientInfoDecodingError("Caught decoding error.");

        expect(err instanceof ClientAuthError).to.be.true;
        expect(err instanceof AuthError).to.be.true;
        expect(err instanceof Error).to.be.true;
        expect(err.errorCode).to.equal(ClientAuthErrorMessage.clientInfoDecodingError.code);
        expect(err.errorMessage).to.include(ClientAuthErrorMessage.clientInfoDecodingError.desc);
        expect(err.message).to.include(ClientAuthErrorMessage.clientInfoDecodingError.desc);
        expect(err.name).to.equal("ClientAuthError");
        expect(err.stack).to.include("ClientAuthError.spec.ts");
    });

    it("createClientInfoEmptyError creates a ClientAuthError object", () => {
        const err: ClientAuthError = ClientAuthError.createClientInfoEmptyError("Raw client info.");

        expect(err instanceof ClientAuthError).to.be.true;
        expect(err instanceof AuthError).to.be.true;
        expect(err instanceof Error).to.be.true;
        expect(err.errorCode).to.equal(ClientAuthErrorMessage.clientInfoEmptyError.code);
        expect(err.errorMessage).to.include(ClientAuthErrorMessage.clientInfoEmptyError.desc);
        expect(err.message).to.include(ClientAuthErrorMessage.clientInfoEmptyError.desc);
        expect(err.name).to.equal("ClientAuthError");
        expect(err.stack).to.include("ClientAuthError.spec.ts");
    });

    it("createIdTokenParsingError creates a ClientAuthError object", () => {
        const err: ClientAuthError = ClientAuthError.createIdTokenParsingError("Raw client info.");

        expect(err instanceof ClientAuthError).to.be.true;
        expect(err instanceof AuthError).to.be.true;
        expect(err instanceof Error).to.be.true;
        expect(err.errorCode).to.equal(ClientAuthErrorMessage.idTokenParsingError.code);
        expect(err.errorMessage).to.include(ClientAuthErrorMessage.idTokenParsingError.desc);
        expect(err.message).to.include(ClientAuthErrorMessage.idTokenParsingError.desc);
        expect(err.name).to.equal("ClientAuthError");
        expect(err.stack).to.include("ClientAuthError.spec.ts");
    });

    it("createIdTokenNullOrEmptyError creates a ClientAuthError object", () => {
        const err: ClientAuthError = ClientAuthError.createIdTokenNullOrEmptyError("Invalid Raw IdToken string.");

        expect(err instanceof ClientAuthError).to.be.true;
        expect(err instanceof AuthError).to.be.true;
        expect(err instanceof Error).to.be.true;
        expect(err.errorCode).to.equal(ClientAuthErrorMessage.nullOrEmptyIdToken.code);
        expect(err.errorMessage).to.include(ClientAuthErrorMessage.nullOrEmptyIdToken.desc);
        expect(err.message).to.include(ClientAuthErrorMessage.nullOrEmptyIdToken.desc);
        expect(err.name).to.equal("ClientAuthError");
        expect(err.stack).to.include("ClientAuthError.spec.ts");
    });

    it("createEndpointDiscoveryIncompleteError creates a ClientAuthError object", () => {
        const err: ClientAuthError = ClientAuthError.createEndpointDiscoveryIncompleteError("Test endpoint error.");

        expect(err instanceof ClientAuthError).to.be.true;
        expect(err instanceof AuthError).to.be.true;
        expect(err instanceof Error).to.be.true;
        expect(err.errorCode).to.equal(ClientAuthErrorMessage.endpointResolutionError.code);
        expect(err.errorMessage).to.include(ClientAuthErrorMessage.endpointResolutionError.desc);
        expect(err.message).to.include(ClientAuthErrorMessage.endpointResolutionError.desc);
        expect(err.name).to.equal("ClientAuthError");
        expect(err.stack).to.include("ClientAuthError.spec.ts");
    });

    it("createInvalidAuthorityTypeError creates a ClientAuthError object", () => {
        const err: ClientAuthError = ClientAuthError.createInvalidAuthorityTypeError("Given url.");

        expect(err instanceof ClientAuthError).to.be.true;
        expect(err instanceof AuthError).to.be.true;
        expect(err instanceof Error).to.be.true;
        expect(err.errorCode).to.equal(ClientAuthErrorMessage.invalidAuthorityType.code);
        expect(err.errorMessage).to.include(ClientAuthErrorMessage.invalidAuthorityType.desc);
        expect(err.message).to.include(ClientAuthErrorMessage.invalidAuthorityType.desc);
        expect(err.name).to.equal("ClientAuthError");
        expect(err.stack).to.include("ClientAuthError.spec.ts");
    });

    it("createHashNotDeserializedError creates a ClientAuthError object", () => {
        const err: ClientAuthError = ClientAuthError.createHashNotDeserializedError("Couldn't deserialize hash object correctly");

        expect(err instanceof ClientAuthError).to.be.true;
        expect(err instanceof AuthError).to.be.true;
        expect(err instanceof Error).to.be.true;
        expect(err.errorCode).to.equal(ClientAuthErrorMessage.hashNotDeserialized.code);
        expect(err.errorMessage).to.include(ClientAuthErrorMessage.hashNotDeserialized.desc);
        expect(err.message).to.include(ClientAuthErrorMessage.hashNotDeserialized.desc);
        expect(err.name).to.equal("ClientAuthError");
        expect(err.stack).to.include("ClientAuthError.spec.ts");
    });

    it("createStateMismatchError creates a ClientAuthError object", () => {
        const err: ClientAuthError = ClientAuthError.createStateMismatchError();

        expect(err instanceof ClientAuthError).to.be.true;
        expect(err instanceof AuthError).to.be.true;
        expect(err instanceof Error).to.be.true;
        expect(err.errorCode).to.equal(ClientAuthErrorMessage.stateMismatchError.code);
        expect(err.errorMessage).to.include(ClientAuthErrorMessage.stateMismatchError.desc);
        expect(err.message).to.include(ClientAuthErrorMessage.stateMismatchError.desc);
        expect(err.name).to.equal("ClientAuthError");
        expect(err.stack).to.include("ClientAuthError.spec.ts");
    });

    it("createNonceMismatchError creates a ClientAuthError object", () => {
        const err: ClientAuthError = ClientAuthError.createNonceMismatchError();

        expect(err instanceof ClientAuthError).to.be.true;
        expect(err instanceof AuthError).to.be.true;
        expect(err instanceof Error).to.be.true;
        expect(err.errorCode).to.equal(ClientAuthErrorMessage.nonceMismatchError.code);
        expect(err.errorMessage).to.include(ClientAuthErrorMessage.nonceMismatchError.desc);
        expect(err.message).to.include(ClientAuthErrorMessage.nonceMismatchError.desc);
        expect(err.name).to.equal("ClientAuthError");
        expect(err.stack).to.include("ClientAuthError.spec.ts");
    });

    it("createAccountMismatchError creates a ClientAuthError object", () => {
        const err: ClientAuthError = ClientAuthError.createAccountMismatchError();

        expect(err instanceof ClientAuthError).to.be.true;
        expect(err instanceof AuthError).to.be.true;
        expect(err instanceof Error).to.be.true;
        expect(err.errorCode).to.equal(ClientAuthErrorMessage.accountMismatchError.code);
        expect(err.errorMessage).to.include(ClientAuthErrorMessage.accountMismatchError.desc);
        expect(err.message).to.include(ClientAuthErrorMessage.accountMismatchError.desc);
        expect(err.name).to.equal("ClientAuthError");
        expect(err.stack).to.include("ClientAuthError.spec.ts");
    });

    it("createInvalidIdTokenError creates a ClientAuthError object", () => {
        const err: ClientAuthError = ClientAuthError.createInvalidIdTokenError(null);

        expect(err instanceof ClientAuthError).to.be.true;
        expect(err instanceof AuthError).to.be.true;
        expect(err instanceof Error).to.be.true;
        expect(err.errorCode).to.equal(ClientAuthErrorMessage.invalidIdToken.code);
        expect(err.errorMessage).to.include(ClientAuthErrorMessage.invalidIdToken.desc);
        expect(err.message).to.include(ClientAuthErrorMessage.invalidIdToken.desc);
        expect(err.name).to.equal("ClientAuthError");
        expect(err.stack).to.include("ClientAuthError.spec.ts");
    });

    it("createNoTokensFoundError creates a ClientAuthError object", () => {
        const err: ClientAuthError = ClientAuthError.createNoTokensFoundError();

        expect(err instanceof ClientAuthError).to.be.true;
        expect(err instanceof AuthError).to.be.true;
        expect(err instanceof Error).to.be.true;
        expect(err.errorCode).to.equal(ClientAuthErrorMessage.noTokensFoundError.code);
        expect(err.errorMessage).to.include(ClientAuthErrorMessage.noTokensFoundError.desc);
        expect(err.message).to.include(ClientAuthErrorMessage.noTokensFoundError.desc);
        expect(err.name).to.equal("ClientAuthError");
        expect(err.stack).to.include("ClientAuthError.spec.ts");
    });

    it("createCacheParseError creates a ClientAuthError object", () => {
        const err: ClientAuthError = ClientAuthError.createCacheParseError("Couldn't parse key");

        expect(err instanceof ClientAuthError).to.be.true;
        expect(err instanceof AuthError).to.be.true;
        expect(err instanceof Error).to.be.true;
        expect(err.errorCode).to.equal(ClientAuthErrorMessage.cacheParseError.code);
        expect(err.errorMessage).to.include(ClientAuthErrorMessage.cacheParseError.desc);
        expect(err.message).to.include(ClientAuthErrorMessage.cacheParseError.desc);
        expect(err.name).to.equal("ClientAuthError");
        expect(err.stack).to.include("ClientAuthError.spec.ts");
    });

    it("createUserLoginRequiredError creates a ClientAuthError object", () => {
        const err: ClientAuthError = ClientAuthError.createUserLoginRequiredError();

        expect(err instanceof ClientAuthError).to.be.true;
        expect(err instanceof AuthError).to.be.true;
        expect(err instanceof Error).to.be.true;
        expect(err.errorCode).to.equal(ClientAuthErrorMessage.userLoginRequiredError.code);
        expect(err.errorMessage).to.include(ClientAuthErrorMessage.userLoginRequiredError.desc);
        expect(err.message).to.include(ClientAuthErrorMessage.userLoginRequiredError.desc);
        expect(err.name).to.equal("ClientAuthError");
        expect(err.stack).to.include("ClientAuthError.spec.ts");
    });

    it("createMultipleMatchingTokensInCacheError creates a ClientAuthError object", () => {
        const err: ClientAuthError = ClientAuthError.createMultipleMatchingTokensInCacheError("scope1");

        expect(err instanceof ClientAuthError).to.be.true;
        expect(err instanceof AuthError).to.be.true;
        expect(err instanceof Error).to.be.true;
        expect(err.errorCode).to.equal(ClientAuthErrorMessage.multipleMatchingTokens.code);
        expect(err.errorMessage).to.include(ClientAuthErrorMessage.multipleMatchingTokens.desc);
        expect(err.message).to.include(ClientAuthErrorMessage.multipleMatchingTokens.desc);
        expect(err.name).to.equal("ClientAuthError");
        expect(err.stack).to.include("ClientAuthError.spec.ts");
    });

    it("createTokenRequestCannotBeMadeError creates a ClientAuthError object", () => {
        const err: ClientAuthError = ClientAuthError.createTokenRequestCannotBeMadeError();

        expect(err instanceof ClientAuthError).to.be.true;
        expect(err instanceof AuthError).to.be.true;
        expect(err instanceof Error).to.be.true;
        expect(err.errorCode).to.equal(ClientAuthErrorMessage.tokenRequestCannotBeMade.code);
        expect(err.errorMessage).to.include(ClientAuthErrorMessage.tokenRequestCannotBeMade.desc);
        expect(err.message).to.include(ClientAuthErrorMessage.tokenRequestCannotBeMade.desc);
        expect(err.name).to.equal("ClientAuthError");
        expect(err.stack).to.include("ClientAuthError.spec.ts");
    });

    it("createAppendEmptyScopeToSetError creates a ClientAuthError object", () => {
        const err: ClientAuthError = ClientAuthError.createAppendEmptyScopeToSetError("");

        expect(err instanceof ClientAuthError).to.be.true;
        expect(err instanceof AuthError).to.be.true;
        expect(err instanceof Error).to.be.true;
        expect(err.errorCode).to.equal(ClientAuthErrorMessage.appendEmptyScopeError.code);
        expect(err.errorMessage).to.include(ClientAuthErrorMessage.appendEmptyScopeError.desc);
        expect(err.message).to.include(ClientAuthErrorMessage.appendEmptyScopeError.desc);
        expect(err.name).to.equal("ClientAuthError");
        expect(err.stack).to.include("ClientAuthError.spec.ts");
    });

    it("createRemoveEmptyScopeFromSetError creates a ClientAuthError object", () => {
        const err: ClientAuthError = ClientAuthError.createRemoveEmptyScopeFromSetError("");

        expect(err instanceof ClientAuthError).to.be.true;
        expect(err instanceof AuthError).to.be.true;
        expect(err instanceof Error).to.be.true;
        expect(err.errorCode).to.equal(ClientAuthErrorMessage.removeEmptyScopeError.code);
        expect(err.errorMessage).to.include(ClientAuthErrorMessage.removeEmptyScopeError.desc);
        expect(err.message).to.include(ClientAuthErrorMessage.removeEmptyScopeError.desc);
        expect(err.name).to.equal("ClientAuthError");
        expect(err.stack).to.include("ClientAuthError.spec.ts");
    });

    it("createAppendScopeSetError creates a ClientAuthError object", () => {
        const err: ClientAuthError = ClientAuthError.createAppendScopeSetError("Couldn't append scopeset");

        expect(err instanceof ClientAuthError).to.be.true;
        expect(err instanceof AuthError).to.be.true;
        expect(err instanceof Error).to.be.true;
        expect(err.errorCode).to.equal(ClientAuthErrorMessage.appendScopeSetError.code);
        expect(err.errorMessage).to.include(ClientAuthErrorMessage.appendScopeSetError.desc);
        expect(err.message).to.include(ClientAuthErrorMessage.appendScopeSetError.desc);
        expect(err.name).to.equal("ClientAuthError");
        expect(err.stack).to.include("ClientAuthError.spec.ts");
    });

    it("createEmptyInputScopeSetError creates a ClientAuthError object", () => {
        const err: ClientAuthError = ClientAuthError.createEmptyInputScopeSetError(null);

        expect(err instanceof ClientAuthError).to.be.true;
        expect(err instanceof AuthError).to.be.true;
        expect(err instanceof Error).to.be.true;
        expect(err.errorCode).to.equal(ClientAuthErrorMessage.emptyInputScopeSetError.code);
        expect(err.errorMessage).to.include(ClientAuthErrorMessage.emptyInputScopeSetError.desc);
        expect(err.message).to.include(ClientAuthErrorMessage.emptyInputScopeSetError.desc);
        expect(err.name).to.equal("ClientAuthError");
        expect(err.stack).to.include("ClientAuthError.spec.ts");
    });

    it("createDeviceCodeCancelledError creates a ClientAuthError object", () => {
        const err: ClientAuthError = ClientAuthError.createDeviceCodeCancelledError();

        expect(err instanceof ClientAuthError).to.be.true;
        expect(err instanceof AuthError).to.be.true;
        expect(err instanceof Error).to.be.true;
        expect(err.errorCode).to.equal(ClientAuthErrorMessage.DeviceCodePollingCancelled.code);
        expect(err.errorMessage).to.include(ClientAuthErrorMessage.DeviceCodePollingCancelled.desc);
        expect(err.message).to.include(ClientAuthErrorMessage.DeviceCodePollingCancelled.desc);
        expect(err.name).to.equal("ClientAuthError");
        expect(err.stack).to.include("ClientAuthError.spec.ts");
    });

    it("createDeviceCodeExpiredError creates a ClientAuthError object", () => {
        const err: ClientAuthError = ClientAuthError.createDeviceCodeExpiredError();

        expect(err instanceof ClientAuthError).to.be.true;
        expect(err instanceof AuthError).to.be.true;
        expect(err instanceof Error).to.be.true;
        expect(err.errorCode).to.equal(ClientAuthErrorMessage.DeviceCodeExpired.code);
        expect(err.errorMessage).to.include(ClientAuthErrorMessage.DeviceCodeExpired.desc);
        expect(err.message).to.include(ClientAuthErrorMessage.DeviceCodeExpired.desc);
        expect(err.name).to.equal("ClientAuthError");
        expect(err.stack).to.include("ClientAuthError.spec.ts");
    });

    it("createInvalidCacheTypeError creates a ClientAuthError object", () => {
        const err: ClientAuthError = ClientAuthError.createInvalidCacheTypeError();

        expect(err instanceof ClientAuthError).to.be.true;
        expect(err instanceof AuthError).to.be.true;
        expect(err instanceof Error).to.be.true;
        expect(err.errorCode).to.equal(ClientAuthErrorMessage.invalidCacheType.code);
        expect(err.errorMessage).to.include(ClientAuthErrorMessage.invalidCacheType.desc);
        expect(err.message).to.include(ClientAuthErrorMessage.invalidCacheType.desc);
        expect(err.name).to.equal("ClientAuthError");
        expect(err.stack).to.include("ClientAuthError.spec.ts");
    });
});
