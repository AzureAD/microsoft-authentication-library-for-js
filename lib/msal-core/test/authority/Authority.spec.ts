import { expect } from "chai";
import { Authority } from "../../src/authority/Authority";
import { ClientConfigurationErrorMessage } from "../../src/error/ClientConfigurationError"
import { TEST_CONFIG, TENANT_DISCOVERY_RESPONSE } from "../TestConstants";
import TelemetryManager from "../../src/telemetry/TelemetryManager";
import { TelemetryConfig } from "../../src/telemetry/TelemetryTypes";
import { Logger } from "../../src";

const stubbedTelemetryConfig: TelemetryConfig = {
    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
    platform: {
        applicationName: TEST_CONFIG.applicationName,
        applicationVersion: TEST_CONFIG.applicationVersion
    }
};

const stubbedTelemetryManager = new TelemetryManager(stubbedTelemetryConfig, () => {}, new Logger(() => {}));

let authority: Authority;

describe("Authority.ts Class", function () {
    beforeEach(function() {
        authority = new Authority(TEST_CONFIG.validAuthority, true);
    });

    afterEach(function () {
        authority = null;
    });

    it("tests initialization of Authority", function() {
        expect(authority).to.be.instanceOf(Authority);
    });

    it("throws error if ResolveEndpointsAsync hasn't been called yet", function () {
        try {
            const authEndpoint = authority.AuthorizationEndpoint
        }
        catch(e) {
            expect(e).to.be.equal("Please call ResolveEndpointsAsync first");
        }
    });

    it("tests EndSessionEndpoint", async function () {
        const response = await authority.resolveEndpointsAsync(stubbedTelemetryManager, TEST_CONFIG.CorrelationId);

        expect(authority.EndSessionEndpoint).to.equal("https://login.microsoftonline.com/common/oauth2/v2.0/logout")
    });

    it("tests SelfSignedJwtAudience", async function () {
        const response = await authority.resolveEndpointsAsync(stubbedTelemetryManager, TEST_CONFIG.CorrelationId);

        expect(authority.SelfSignedJwtAudience).to.equal("https://login.microsoftonline.com/common/v2.0")
    });

    it("throws invalidAuthorityType on init if authority is not url", function () {
        try {
            authority = new Authority("", true);
        }
        catch(e) {
            expect(e).to.be.equal(ClientConfigurationErrorMessage.invalidAuthorityType)
        }
    });

    it("throws authorityUriInsecure on init if not https", function () {
        try {
            authority = new Authority("http://login.microsoftonline.com/common", true);
        }
        catch(e) {
            expect(e).to.be.equal(ClientConfigurationErrorMessage.authorityUriInsecure)
        }
    });

    it("throws authorityUriInvalidPath on init if there is no path", function () {
        try {
            authority = new Authority("https://login.microsoftonline.com", true);
        }
        catch(e) {
            expect(e).to.be.equal(ClientConfigurationErrorMessage.authorityUriInvalidPath)
        }
    });

    it("hasCachedMetadata returns false if metadata no fetched", () => {
        expect(authority.hasCachedMetadata()).to.be.false;
    });

    it("hasCachedMetadata returns true when metadata is provided", () => {
        const testAuthorityWithMetadata = new Authority(TEST_CONFIG.validAuthority, true, TENANT_DISCOVERY_RESPONSE);

        expect(testAuthorityWithMetadata.hasCachedMetadata()).to.be.true;
    });

    it("GetOpenIdConfigurationEndpoint returns well-known endpoint", async function () {
        const endpoint = authority.GetOpenIdConfigurationEndpoint();

        expect(endpoint).to.include("/v2.0/.well-known/openid-configuration");
        expect(endpoint).to.include(TEST_CONFIG.validAuthority);
    });

    it("GetOpenIdConfigurationEndpoint returns well-known endpoint", async function () {
        authority = new Authority(TEST_CONFIG.alternateValidAuthority, true);
        const endpoint = authority.GetOpenIdConfigurationEndpoint();

        expect(endpoint).to.include("/v2.0/.well-known/openid-configuration");
        expect(endpoint).to.include(TEST_CONFIG.alternateValidAuthority);
    });
});
