import { expect } from "chai";
import { ClientConfigurationError, ClientConfigurationErrorMessage } from "../../src/error/ClientConfigurationError";
import { AuthorityType } from "../../src/authority/Authority";
import { B2cAuthority } from "../../src/authority/B2cAuthority";
import { B2C_TEST_CONFIG } from "../TestConstants";
import { B2CTrustedHostList } from "../../src/utils/Constants";

describe("B2cAuthority.ts Class", function () {
    let authority = null;
    let endpoint = null;

    afterEach(function() {
        for (var host in B2CTrustedHostList) {
            delete B2CTrustedHostList[host];
        };

        authority = null;
        endpoint = null;
    });

    it("tests initialization of b2c authority", function() {
        authority = new B2cAuthority(B2C_TEST_CONFIG.validAuthority, false);

        expect(authority).to.be.instanceOf(B2cAuthority);
        expect(authority.AuthorityType).to.be.equal(AuthorityType.B2C);
    });

    it("tests GetOpenIdConfigurationEndpointAsync with validateAuthority false", async function () {
        authority = new B2cAuthority(B2C_TEST_CONFIG.validAuthority, false);
        endpoint = await authority.GetOpenIdConfigurationEndpointAsync();

        expect(endpoint).to.include("/v2.0/.well-known/openid-configuration");
    });

    it("tests GetOpenIdConfigurationEndpointAsync with validateAuthority true", async function () {

        B2C_TEST_CONFIG.knownAuthorities.forEach(function(authority){
            B2CTrustedHostList[authority] = authority;
        });

        authority = new B2cAuthority(B2C_TEST_CONFIG.validAuthority, true);
        endpoint = await authority.GetOpenIdConfigurationEndpointAsync();

        expect(endpoint).to.include("/v2.0/.well-known/openid-configuration");
    });
    
    it("throws error when authority not in trusted host list", async function () {
        B2CTrustedHostList["fake.b2clogin.com"] = "fake.b2clogin.com";

        authority = new B2cAuthority(B2C_TEST_CONFIG.validAuthority, true);

        let err:ClientConfigurationError;
        try{
            endpoint = await authority.GetOpenIdConfigurationEndpointAsync();
        }catch(e) {
            expect(e).to.be.instanceOf(ClientConfigurationError);
            err = e;
        }
        expect(err.errorCode).to.equal(ClientConfigurationErrorMessage.unsupportedAuthorityValidation.code);
        expect(err.errorMessage).to.equal(ClientConfigurationErrorMessage.unsupportedAuthorityValidation.desc);

    });

    it("throws error if knownAuthorities is not set and validateAuthority is true", async function () {
        authority = new B2cAuthority(B2C_TEST_CONFIG.validAuthority, true)
        try {
            endpoint = await authority.GetOpenIdConfigurationEndpointAsync();
        }
        catch(e) {
            expect(e).to.be.instanceOf(ClientConfigurationError);
            expect(e.errorCode).to.be.equal(ClientConfigurationErrorMessage.b2cKnownAuthoritiesNotSet.code);
            expect(e.errorMessage).to.be.equal(ClientConfigurationErrorMessage.b2cKnownAuthoritiesNotSet.desc);
        }

    });

});