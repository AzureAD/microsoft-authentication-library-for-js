import { expect } from "chai";
import { AuthorityType } from "../../src/authority/Authority";
import { AadAuthority } from "../../src/authority/AadAuthority";
import { AADTrustedHostList } from "../../src/utils/Constants";
import { TEST_CONFIG } from "../TestConstants";
import TelemetryManager from "../../src/telemetry/TelemetryManager";
import { TelemetryConfig } from "../../src/telemetry/TelemetryTypes";

const stubbedTelemetryConfig: TelemetryConfig = {
    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
    platform: {
        applicationName: TEST_CONFIG.applicationName,
        applicationVersion: TEST_CONFIG.applicationVersion
    }
};

const stubbedTelemetryManager = new TelemetryManager(stubbedTelemetryConfig, () => {});

describe("AadAuthority.ts Class", function () {

    it("tests initialization of aad authority", function() {
        const authority = new AadAuthority(TEST_CONFIG.validAuthority, false);

        expect(authority).to.be.instanceOf(AadAuthority);
        expect(authority.AuthorityType).to.be.equal(AuthorityType.Aad);
    });

    it("tests GetOpenIdConfigurationEndpointAsync with validateAuthority false", async function () {
        const authority = new AadAuthority(TEST_CONFIG.validAuthority, false);
        const endpoint = await authority.GetOpenIdConfigurationEndpointAsync(stubbedTelemetryManager, TEST_CONFIG.CorrelationId);

        expect(endpoint).to.include("/v2.0/.well-known/openid-configuration");
    });

    it("tests GetOpenIdConfigurationEndpointAsync with validateAuthority true", async function () {
        const authority = new AadAuthority(TEST_CONFIG.validAuthority, true);
        const endpoint = await authority.GetOpenIdConfigurationEndpointAsync(stubbedTelemetryManager, TEST_CONFIG.CorrelationId);

        expect(endpoint).to.include("/v2.0/.well-known/openid-configuration");
    });

    it("tests GetOpenIdConfigurationEndpointAsync with validateAuthority true and not in trusted host list", async function () {

        delete AADTrustedHostList["login.microsoftonline.com"];
        const authority = new AadAuthority(TEST_CONFIG.validAuthority, true);
        const endpoint = await authority.GetOpenIdConfigurationEndpointAsync(stubbedTelemetryManager, TEST_CONFIG.CorrelationId);
        AADTrustedHostList["login.microsoftonline.com"] = "login.microsoftonline.com";

        expect(endpoint).to.include("/v2.0/.well-known/openid-configuration");
    });

});