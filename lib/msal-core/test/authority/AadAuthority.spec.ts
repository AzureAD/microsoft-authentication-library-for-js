import { expect } from "chai";
import { AadAuthority } from "../../src/authority/AadAuthority";
import { TEST_CONFIG } from "../TestConstants";

describe("AadAuthority.ts Class", function () {

    it("tests initialization of aad authority", function() {
        const authority = new AadAuthority(TEST_CONFIG.validAuthority, false);

        expect(authority).to.be.instanceOf(AadAuthority);
    });

    it("tests GetOpenIdConfigurationEndpointAsync with validateAuthority false", async function () {
        const authority = new AadAuthority(TEST_CONFIG.validAuthority, false);
        const endpoint = await authority.GetOpenIdConfigurationEndpointAsync()

        expect(endpoint).to.include("/v2.0/.well-known/openid-configuration")
    });

    it("tests GetOpenIdConfigurationEndpointAsync with validateAuthority true", async function () {

        const authority = new AadAuthority(TEST_CONFIG.validAuthority, true);
        const endpoint = await authority.GetOpenIdConfigurationEndpointAsync()

        expect(endpoint).to.include("/v2.0/.well-known/openid-configuration")
    });

});