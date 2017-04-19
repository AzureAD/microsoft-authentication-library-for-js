/// <reference path="../../out/msal.d.ts" />
/// <reference path="../../node_modules/@types/jasmine/index.d.ts" />
/// <reference path="../../node_modules/@types/jasmine-ajax/index.d.ts" />

describe("Authority", () => {
    beforeEach(function () {
        //jasmine.Ajax.install();
    });

    afterEach(function () {
        //jasmine.Ajax.uninstall();
    });

    describe("AadAuthority", () => {
        it("can be created", () => {
            // Arrange
            let url = "https://login.microsoftonline.in/MYTENANT.com";
            let validate = false;

            // Act
            let authority = MSAL.Authority.CreateInstance(url, validate);

            // Assert
            expect(authority.CanonicalAuthority).toEqual("https://login.microsoftonline.in/mytenant.com/");
            expect(authority.AuthorityType).toEqual(MSAL.AuthorityType.Aad);
        });

        it("can be resolved", (done) => {
            // Arrange
            let url = "https://login.microsoftonline.com/6babcaad-604b-40ac-a9d7-9fd97c0b779f";
            let validate = true;
            //jasmine.Ajax.stubRequest("openid-configuration", '{"authorization_endpoint":"https://login.microsoftonline.com/6babcaad-604b-40ac-a9d7-9fd97c0b779f/oauth2/v2.0/authorize","token_endpoint":"https://login.microsoftonline.com/6babcaad-604b-40ac-a9d7-9fd97c0b779f/oauth2/v2.0/token","token_endpoint_auth_methods_supported":["client_secret_post","private_key_jwt"],"jwks_uri":"https://login.microsoftonline.com/6babcaad-604b-40ac-a9d7-9fd97c0b779f/discovery/v2.0/keys","response_modes_supported":["query","fragment","form_post"],"subject_types_supported":["pairwise"],"id_token_signing_alg_values_supported":["RS256"],"http_logout_supported":true,"frontchannel_logout_supported":true,"end_session_endpoint":"https://login.microsoftonline.com/6babcaad-604b-40ac-a9d7-9fd97c0b779f/oauth2/v2.0/logout","response_types_supported":["code","id_token","code id_token","id_token token"],"scopes_supported":["openid","profile","email","offline_access"],"issuer":"https://login.microsoftonline.com/6babcaad-604b-40ac-a9d7-9fd97c0b779f/v2.0","claims_supported":["sub","iss","cloud_instance_name","aud","exp","iat","auth_time","acr","nonce","preferred_username","name","tid","ver","at_hash","c_hash","email"],"request_uri_parameter_supported":false,"tenant_region_scope":"NA","cloud_instance_name":"microsoftonline.com","cloud_graph_host_name":"graph.windows.net"}');

            // Act
            let authority = MSAL.Authority.CreateInstance(url, validate);

            // Assert
            authority.ResolveEndpointsAsync().then((authority) => {
                expect(authority.AuthorizationEndpoint).toEqual(`${url}/oauth2/authorize`);
                done();
            });
        });
    });
});