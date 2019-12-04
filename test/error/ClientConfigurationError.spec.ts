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

    it("createRedirectUriEmptyError creates a ClientConfigurationError object", () => {

        const noStorageSupportError = ClientConfigurationError.createRedirectUriEmptyError();
        let err: ClientConfigurationError;

        try {
            throw noStorageSupportError;
        } catch (error) {
            err = error;
        }

        expect(err.errorCode).to.equal(ClientConfigurationErrorMessage.redirectUriNotSet.code);
        expect(err.errorMessage).to.include(ClientConfigurationErrorMessage.redirectUriNotSet.desc);
        expect(err.message).to.include(ClientConfigurationErrorMessage.redirectUriNotSet.desc);
        expect(err.name).to.equal("ClientConfigurationError");
        expect(err.stack).to.include("ClientConfigurationError.spec.ts");
    });

    it("createPostLogoutRedirectUriEmptyError creates a ClientConfigurationError object", () => {

        const noStorageSupportError = ClientConfigurationError.createPostLogoutRedirectUriEmptyError();
        let err: ClientConfigurationError;

        try {
            throw noStorageSupportError;
        } catch (error) {
            err = error;
        }

        expect(err.errorCode).to.equal(ClientConfigurationErrorMessage.postLogoutUriNotSet.code);
        expect(err.errorMessage).to.include(ClientConfigurationErrorMessage.postLogoutUriNotSet.desc);
        expect(err.message).to.include(ClientConfigurationErrorMessage.postLogoutUriNotSet.desc);
        expect(err.name).to.equal("ClientConfigurationError");
        expect(err.stack).to.include("ClientConfigurationError.spec.ts");
    });

    it("createPostLogoutRedirectUriEmptyError creates a ClientConfigurationError object", () => {

        const noStorageSupportError = ClientConfigurationError.createClaimsRequestParsingError("Could not parse claims.");
        let err: ClientConfigurationError;

        try {
            throw noStorageSupportError;
        } catch (error) {
            err = error;
        }

        expect(err.errorCode).to.equal(ClientConfigurationErrorMessage.claimsRequestParsingError.code);
        expect(err.errorMessage).to.include(ClientConfigurationErrorMessage.claimsRequestParsingError.desc);
        expect(err.message).to.include(ClientConfigurationErrorMessage.claimsRequestParsingError.desc);
        expect(err.errorMessage).to.include("Could not parse claims.");
        expect(err.message).to.include("Could not parse claims.");
        expect(err.name).to.equal("ClientConfigurationError");
        expect(err.stack).to.include("ClientConfigurationError.spec.ts");
    });
});
