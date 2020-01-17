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
        expect(err.message).to.equal(TEST_ERROR_MSG);
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

    it("createIdTokenExtractionError creates a ClientAuthError object", () => {
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
});
