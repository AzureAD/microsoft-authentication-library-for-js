/// <reference path="../../out/msal.d.ts" />
/// <reference path="../../node_modules/@types/jasmine/index.d.ts" />
/// <reference path="../../node_modules/@types/jasmine-ajax/index.d.ts" />

describe("Authority", () => {
    describe("AadAuthority", () => {
        beforeEach(function () {
            jasmine.Ajax.install();
        });

        afterEach(function () {
            jasmine.Ajax.uninstall();
        });

        it("can be created", () => {
            // Arrange
            let url = "https://login.microsoftonline.in/MYTENANT.com";
            let validate = false;

            // Act
            let authority = Msal.Authority.CreateInstance(url, validate);

            // Assert
            expect(authority.CanonicalAuthority).toEqual("https://login.microsoftonline.in/mytenant.com/");
            expect(authority.AuthorityType).toEqual(Msal.AuthorityType.Aad);
        });

        it("can be resolved", (done) => {
            // Arrange
            let url = "https://login.microsoftonline.com/6babcaad-604b-40ac-a9d7-9fd97c0b779f";
            let validate = true;
            jasmine.Ajax.stubRequest(/.*openid-configuration/i).andReturn({
                responseText: '{"authorization_endpoint":"https://authorization_endpoint","token_endpoint":"https://token_endpoint","issuer":"https://fakeIssuer", "end_session_endpoint":"https://end_session_endpoint"}'
            });

            // Act
            let authority = Msal.Authority.CreateInstance(url, validate);
            let promise = authority.ResolveEndpointsAsync();

            // Assert
            verifyAuthority(promise, authority, done);
        });

        it("can be resolved for untrusted hosts", (done) => {
            // Arrange
            let url = "https://login.microsoftonline.in/6babcaad-604b-40ac-a9d7-9fd97c0b779f";
            let validate = true;
            jasmine.Ajax.stubRequest(/.*tenant_discovery_endpoint.*openid-configuration/i).andReturn({
                responseText: '{"authorization_endpoint":"https://authorization_endpoint","end_session_endpoint":"https://end_session_endpoint","issuer":"https://fakeIssuer"}'
            });
            jasmine.Ajax.stubRequest(/.*discovery\/instance/i).andReturn({
                responseText: '{"tenant_discovery_endpoint":"https://tenant_discovery_endpoint/openid-configuration"}'
            });

            // Act
            let authority = Msal.Authority.CreateInstance(url, validate);
            let promise = authority.ResolveEndpointsAsync();

            // Assert
            verifyAuthority(promise, authority, done);
        });
    });

    function verifyAuthority(promise: Promise<Msal.Authority>, authority: Msal.Authority, done: DoneFn) {
        promise.then((authority) => {
            expect(authority.AuthorityType).toEqual(Msal.AuthorityType.Aad);
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
            let authority = Msal.Authority.CreateInstance(url, validate);

            // Assert
            expect(authority.CanonicalAuthority).toEqual(`${url}/`);
            expect(authority.AuthorityType).toEqual(Msal.AuthorityType.B2C);
        });

        it("should fail when path doesnt have enough segments", () => {
            // Arrange
            let url = "https://login.microsoftonline.com/tfp/";
            let validate = false;

            // Act
            let call = () => Msal.Authority.CreateInstance(url, validate);

            // Assert
            expect(call).toThrow("B2cAuthorityUriInvalidPath");
        });

        it("should fail when validation is not supported", (done) => {
            // Arrange
            let url = "https://login.microsoftonline.in/tfp/tenant/policy";
            let validate = true;

            // Act
            let authority = Msal.Authority.CreateInstance(url, validate);
            let promise = authority.ResolveEndpointsAsync();

            // Assert
            promise.catch((error) => {
                expect(error).toEqual("UnsupportedAuthorityValidation");
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
            let call = () => Msal.Authority.CreateInstance(url, validate);

            // Assert
            expect(call).toThrow("InvalidAuthorityType");
        });
    });
});