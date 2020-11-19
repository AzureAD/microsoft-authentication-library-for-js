import { expect } from "chai";
import { Authority, AuthorityType } from "../../src/authority/Authority";
import { ClientConfigurationErrorMessage, ClientConfigurationError } from "../../src/error/ClientConfigurationError"
import { TEST_CONFIG, TENANT_DISCOVERY_RESPONSE, ADFS_TEST_CONFIG } from "../TestConstants";
import TelemetryManager from "../../src/telemetry/TelemetryManager";
import { TelemetryConfig } from "../../src/telemetry/TelemetryTypes";
import { Logger } from "../../src";
import { TrustedAuthority } from "../../src/authority/TrustedAuthority";
import sinon from "sinon";

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
        sinon.restore();
    });

    describe("Constructor", () => {
        it("tests initialization of Authority", function() {
            expect(authority).to.be.instanceOf(Authority);
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
    });

    describe("get AuthorityType", () => {
        it("Default type", () => {
            authority = new Authority(TEST_CONFIG.validAuthority, true);

            expect(authority.AuthorityType).to.equal(AuthorityType.Default)
        });

        it("ADFS type", () => {
            authority = new Authority(ADFS_TEST_CONFIG.validAuthority, true);

            expect(authority.AuthorityType).to.equal(AuthorityType.Adfs)
        });
    });

    describe("get AuthoritzationEndpoint", () => {
        it("throws error if ResolveEndpointsAsync hasn't been called yet", function () {
            try {
                const authEndpoint = authority.AuthorizationEndpoint
            }
            catch(e) {
                expect(e).to.be.equal("Please call ResolveEndpointsAsync first");
            }
        });

        it("tests AuthorizationEndpoint", async function () {
            const response = await authority.resolveEndpointsAsync(stubbedTelemetryManager, TEST_CONFIG.CorrelationId);

            expect(authority.AuthorizationEndpoint).to.equal("https://login.microsoftonline.com/common/oauth2/v2.0/authorize")
        });
    });

    describe("get EndSessionEndpoint", () => {
        it("throws error if ResolveEndpointsAsync hasn't been called yet", function () {
            try {
                const authEndpoint = authority.EndSessionEndpoint
            }
            catch(e) {
                expect(e).to.be.equal("Please call ResolveEndpointsAsync first");
            }
        });

        it("tests EndSessionEndpoint", async function () {
            const response = await authority.resolveEndpointsAsync(stubbedTelemetryManager, TEST_CONFIG.CorrelationId);
    
            expect(authority.EndSessionEndpoint).to.equal("https://login.microsoftonline.com/common/oauth2/v2.0/logout")
        });
    });

    describe("get SelfSignedJwtAudience", () => {
        it("throws error if ResolveEndpointsAsync hasn't been called yet", function () {
            try {
                const authEndpoint = authority.SelfSignedJwtAudience
            }
            catch(e) {
                expect(e).to.be.equal("Please call ResolveEndpointsAsync first");
            }
        });

        it("tests SelfSignedJwtAudience", async function () {
            const response = await authority.resolveEndpointsAsync(stubbedTelemetryManager, TEST_CONFIG.CorrelationId);
    
            expect(authority.SelfSignedJwtAudience).to.equal("https://login.microsoftonline.com/common/v2.0")
        });
    });

    describe("resolveEndpointsAsync", () => {
        it("returns authority metadata", async function () {
            const endpoints = await authority.resolveEndpointsAsync(stubbedTelemetryManager, TEST_CONFIG.CorrelationId);

            expect(endpoints.EndSessionEndpoint).to.not.be.undefined;
            expect(endpoints.AuthorizationEndpoint).to.not.be.undefined;
            expect(endpoints.Issuer).to.not.be.undefined;
        });

        it("returns authority metadata with validateAuthority false", async function () {
            authority = new Authority(TEST_CONFIG.validAuthority, false);
            sinon.stub(TrustedAuthority, "getTrustedHostList").throws("Validation is disabled. This function should not be called.");
            const endpoints = await authority.resolveEndpointsAsync(stubbedTelemetryManager, TEST_CONFIG.CorrelationId);

            expect(endpoints.EndSessionEndpoint).to.not.be.undefined;
            expect(endpoints.AuthorizationEndpoint).to.not.be.undefined;
            expect(endpoints.Issuer).to.not.be.undefined;
        });

        it("Calls Instance Discovery Endpoint if TrustedHostList not set", async function () {
            // Testing of setTrustedAuthoritiesFromNetwork done in another test
            let setFromNetworkCalled = false;
            sinon.stub(TrustedAuthority, "IsInTrustedHostList").returns(true);
            sinon.stub(TrustedAuthority, "getTrustedHostList").returns([]);
            sinon.stub(TrustedAuthority, "setTrustedAuthoritiesFromNetwork").callsFake(async function() {
                setFromNetworkCalled = true;
            });

            await authority.resolveEndpointsAsync(stubbedTelemetryManager, TEST_CONFIG.CorrelationId);
            expect(setFromNetworkCalled).to.be.true;
        });

        it("Throws error if authority is not in TrustedHostList", async function () {
            sinon.stub(TrustedAuthority, "IsInTrustedHostList").returns(false);
            let err = null;
            try {
                const endpoints = await authority.resolveEndpointsAsync(stubbedTelemetryManager, TEST_CONFIG.CorrelationId);
            } catch(e) {
                expect(e).to.be.instanceOf(ClientConfigurationError);
                err = e;
            }

            expect(err.errorCode).to.equal(ClientConfigurationErrorMessage.untrustedAuthority.code);
            expect(err.errorMessage).to.contain(ClientConfigurationErrorMessage.untrustedAuthority.desc);
        });
    });

    describe("hasCachedMetadata", () => {
        it("returns false if metadata no fetched", () => {
            expect(authority.hasCachedMetadata()).to.be.false;
        });
    
        it("returns true when metadata is provided", () => {
            const testAuthorityWithMetadata = new Authority(TEST_CONFIG.validAuthority, true, TENANT_DISCOVERY_RESPONSE);
    
            expect(testAuthorityWithMetadata.hasCachedMetadata()).to.be.true;
        });
    });

    describe("GetOpenIdConfigurationEndpoint", () => {
        it("returns well-known endpoint", () => {
            const endpoint = authority.GetOpenIdConfigurationEndpoint();
    
            expect(endpoint).to.equal(TEST_CONFIG.validAuthority + "v2.0/.well-known/openid-configuration");
        });
    
        it("returns well-known endpoint, alternate authority", () => {
            authority = new Authority(TEST_CONFIG.alternateValidAuthority, true);
            const endpoint = authority.GetOpenIdConfigurationEndpoint();
    
            expect(endpoint).to.equal(TEST_CONFIG.alternateValidAuthority + "v2.0/.well-known/openid-configuration");
        });

        it("returns v1 well-known endpoint, ADFS scenario", () => {
            authority = new Authority(ADFS_TEST_CONFIG.validAuthority, true);
            const endpoint = authority.GetOpenIdConfigurationEndpoint();
    
            expect(endpoint).to.equal(ADFS_TEST_CONFIG.validAuthority + ".well-known/openid-configuration");
        });
    });
});
