import { expect } from "chai";
import { Authority, AuthorityType } from "../../src/authority/Authority";
import { ClientConfigurationErrorMessage } from "../../src/error/ClientConfigurationError"
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

class testAuthority extends Authority{
    public constructor(authority: string, validateAuthority: boolean) {
        super(authority, validateAuthority);
    }

    public get AuthorityType(): AuthorityType {
        return AuthorityType.Aad;
    }

    public async GetOpenIdConfigurationEndpointAsync(): Promise<string> {
        return this.DefaultOpenIdConfigurationEndpoint;
    }
}

let authority: testAuthority;

describe("Authority.ts Class", function () {
    beforeEach(function() {
        authority = new testAuthority(TEST_CONFIG.validAuthority, false);
    });

    afterEach(function () {
        authority = null;
    });

    it("tests initialization of Authority", function() {

        expect(authority).to.be.instanceOf(testAuthority);
        expect(authority.AuthorityType).to.be.equal(AuthorityType.Aad);
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
        const endSessionEndpoint = response.EndSessionEndpoint

        expect(response).to.be.instanceOf(testAuthority);
        expect(endSessionEndpoint).to.contain(response.Tenant)
    });

    it("tests SelfSignedJwtAudience", async function () {
        const response = await authority.resolveEndpointsAsync(stubbedTelemetryManager, TEST_CONFIG.CorrelationId);
        const selfSignedJwtAudience = response.SelfSignedJwtAudience

        expect(response).to.be.instanceOf(testAuthority);
        expect(selfSignedJwtAudience).to.contain(response.Tenant)
    });

    it("throws invalidAuthorityType on init if authority is not url", function () {
        try {
            authority = new testAuthority("", false);
        }
        catch(e) {
            expect(e).to.be.equal(ClientConfigurationErrorMessage.invalidAuthorityType)
        }
    });

    it("throws authorityUriInsecure on init if not https", function () {
        try {
            authority = new testAuthority("http://login.microsoftonline.com/common", false);
        }
        catch(e) {
            expect(e).to.be.equal(ClientConfigurationErrorMessage.authorityUriInsecure)
        }
    });

    it("throws authorityUriInvalidPath on init if there is no path", function () {
        try {
            authority = new testAuthority("https://login.microsoftonline.com", false);
        }
        catch(e) {
            expect(e).to.be.equal(ClientConfigurationErrorMessage.authorityUriInvalidPath)
        }
    });


});