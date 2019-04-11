
import { Authority, AuthorityType } from '../src/Authority';
import { ClientConfigurationErrorMessage } from "../src/error/ClientConfigurationError";

import { AuthorityFactory } from "../src/AuthorityFactory";

describe("Authority", () => {
    const validOpenIdConfigurationResponse = '{"authorization_endpoint":"https://authorization_endpoint","token_endpoint":"https://token_endpoint","issuer":"https://fakeIssuer", "end_session_endpoint":"https://end_session_endpoint"}';

    beforeEach(function () {
        jasmine.Ajax.install();
    });

    afterEach(function () {
        jasmine.Ajax.uninstall();
    });

    describe("AadAuthority", () => {
        it("can be created", () => {
            // Arrange
            let url = "https://login.microsoftonline.in/MYTENANT.com";
            let validate = false;
            // Act
            let authority = AuthorityFactory.CreateInstance(url, validate);
            // Assert
            expect(authority.CanonicalAuthority).toEqual("https://login.microsoftonline.in/mytenant.com/");
            expect(authority.AuthorityType).toEqual(AuthorityType.Aad);
        });

        it("can be resolved", (done: DoneFn) => {
            // Arrange
            let url = "https://login.microsoftonline.com/6babcaad-604b-40ac-a9d7-9fd97c0b779f";
            let validate = true;
            jasmine.Ajax.stubRequest(/.*openid-configuration/i).andReturn({
                responseText: validOpenIdConfigurationResponse
            });

            // Act
            let authority = AuthorityFactory.CreateInstance(url, validate);
            let promise = authority.ResolveEndpointsAsync();

            // Assert
            verifyAuthority(promise, authority, done);
        });

        it("can be resolved for untrusted hosts", (done: DoneFn) => {
            // Arrange
            let url = "https://login.microsoftonline.in/6babcaad-604b-40ac-a9d7-9fd97c0b779f";
            let validate = true;
            jasmine.Ajax.stubRequest(/.*tenant_discovery_endpoint.*openid-configuration/i).andReturn({
                responseText: validOpenIdConfigurationResponse
            });
            jasmine.Ajax.stubRequest(/.*discovery\/instance/i).andReturn({
                responseText: '{"tenant_discovery_endpoint":"https://tenant_discovery_endpoint/openid-configuration"}'
            });

            // Act
            let authority = AuthorityFactory.CreateInstance(url, validate);
            let promise = authority.ResolveEndpointsAsync();

            // Assert
            verifyAuthority(promise, authority, done);
        });
    });

    function verifyAuthority(promise: Promise<Authority>, authority: Authority, done: DoneFn) {
        promise.then((authority) => {
            expect(authority.AuthorityType).toEqual(AuthorityType.Aad);
            expect(authority.AuthorizationEndpoint).toEqual("https://authorization_endpoint");
            expect(authority.EndSessionEndpoint).toEqual("https://end_session_endpoint");
            expect(authority.SelfSignedJwtAudience).toEqual("https://fakeIssuer");
            done();
        });
    }

    describe("B2cAuthority", () => {
        it("can be created", () => {
            // Arrange
            let url = "https://login.microsoftonline.in:444/tfp/tenant/policy";
            let validate = false;

            // Act
            let authority = AuthorityFactory.CreateInstance(url, validate);

            // Assert
            expect(authority.CanonicalAuthority).toEqual(`${url}/`);
            expect(authority.AuthorityType).toEqual(AuthorityType.B2C);
        });

        it("should fail when path doesnt have enough segments", () => {
            // Arrange
            let url = "https://login.microsoftonline.com/tfp/";
            let validate = false;

            // Act
            let call = () => AuthorityFactory.CreateInstance(url, validate);

            // Assert
            expect(call).toThrow(ClientConfigurationErrorMessage.b2cAuthorityUriInvalidPath);
        });

        it("should fail when validation is not supported", (done) => {
            // Arrange
            let url = "https://login.microsoftonline.in/tfp/tenant/policy";
            let validate = true;

            // Act
            let authority = AuthorityFactory.CreateInstance(url, validate);
            let promise = authority.ResolveEndpointsAsync();

            // Assert
            promise.catch((error) => {
                expect(error).toEqual(ClientConfigurationErrorMessage.unsupportedAuthorityValidation);
                done();
            });
        });
    });

    describe("AdfsAuthority", () => {
        it("cannot be created", () => {
            // Arrange
            let url = "https://fs.contoso.com/adfs/";
            let validate = false;

            // Act
            let call = () => AuthorityFactory.CreateInstance(url, validate);

            // Assert
            expect(call).toThrow(ClientConfigurationErrorMessage.invalidAuthorityType);
        });
    });

    describe("Error", () => {
        function verifyError(done: DoneFn, response: any, expectedError: string) {
            // Arrange
            let url = "https://login.microsoftonline.in/6babcaad-604b-40ac-a9d7-9fd97c0b779f";
            let validate = true;
            jasmine.Ajax.stubRequest(/.*/i).andReturn(response);

            // Act
            let authority = AuthorityFactory.CreateInstance(url, validate);
            let promise = authority.ResolveEndpointsAsync();

            // Assert
            promise.catch((error) => {
                expect(error).toEqual(expectedError);
                done();
            });
        }

        it("is thrown when tenant discovery endpoint fails with invalid data", (done: DoneFn) => {
            verifyError(done, {
                status: 500,
                responseText: 'fatalError'
            }, "fatalError");
        });

        it("is thrown when tenant discovery endpoint fails with error details", (done: DoneFn) => {
            verifyError(done, {
                status: 400,
                responseText: '{"error": "OMG_EPIC_FAIL"}'
            }, "OMG_EPIC_FAIL");
        });

        it("is thrown when authority is not https", () => {
            // Arrange
            let url = "http://login.microsoftonline.in/6babcaad-604b-40ac-a9d7-9fd97c0b779f";
            let validate = true;

            // Act
            let call = () => AuthorityFactory.CreateInstance(url, validate);

            // Assert
            expect(call).toThrow(ClientConfigurationErrorMessage.authorityUriInsecure);
        });
    });
});
