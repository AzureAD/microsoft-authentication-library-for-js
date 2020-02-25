import { expect } from "chai";
import { ClientConfigurationError, ClientConfigurationErrorMessage } from "../../src/error/ClientConfigurationError";
import { B2cAuthority } from "../../src/authority/B2cAuthority";
import { B2C_TEST_CONFIG } from "../TestConstants";
import { B2CTrustedHostList } from "../../src/utils/Constants";

describe("B2cAuthority.ts Class", function () {

    it("tests initialization of b2c authority", function() {
        const authority = new B2cAuthority(B2C_TEST_CONFIG.validAuthority, false);

        expect(authority).to.be.instanceOf(B2cAuthority);
    });

    it("tests GetOpenIdConfigurationEndpointAsync with validateAuthority false", async function () {
        const authority = new B2cAuthority(B2C_TEST_CONFIG.validAuthority, false);
        const endpoint = await authority.GetOpenIdConfigurationEndpointAsync()

        expect(endpoint).to.include("/v2.0/.well-known/openid-configuration")
    });

    it("throws error when authority not in trusted host list", async function () {
        const authority = new B2cAuthority(B2C_TEST_CONFIG.validAuthority, true);

        let err:ClientConfigurationError;
        try{
            const endpoint = await authority.GetOpenIdConfigurationEndpointAsync()
        }catch(e) {
            expect(e).to.be.instanceOf(ClientConfigurationError);
            err = e;
        }
        expect(err.errorCode).to.equal(ClientConfigurationErrorMessage.unsupportedAuthorityValidation.code);
        expect(err.errorMessage).to.equal(ClientConfigurationErrorMessage.unsupportedAuthorityValidation.desc);

    });

    it("tests GetOpenIdConfigurationEndpointAsync with validateAuthority true", async function () {

        B2C_TEST_CONFIG.knownAuthorities.forEach(function(authority){
            B2CTrustedHostList[authority] = authority;
        });

        const authority = new B2cAuthority(B2C_TEST_CONFIG.validAuthority, true);
        const endpoint = await authority.GetOpenIdConfigurationEndpointAsync()

        expect(endpoint).to.include("/v2.0/.well-known/openid-configuration")
    });

});