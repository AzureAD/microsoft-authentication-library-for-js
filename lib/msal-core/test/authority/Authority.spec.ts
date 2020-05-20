import { expect } from "chai";
import { Authority, AuthorityType } from "../../src/authority/Authority";
import { ClientConfigurationErrorMessage, ClientConfigurationError } from "../../src/error/ClientConfigurationError"
import { TEST_CONFIG, TENANT_DISCOVERY_RESPONSE, B2C_TEST_CONFIG } from "../TestConstants";
import TelemetryManager from "../../src/telemetry/TelemetryManager";
import { TelemetryConfig } from "../../src/telemetry/TelemetryTypes";
import { Logger } from "../../src";
import { AuthorityFactory } from "../../src/authority/AuthorityFactory";
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
let stubbedHostList: Array<string> = [];

describe("Authority.ts Class", function () {
    beforeEach(function() {
        authority = new Authority(TEST_CONFIG.validAuthority, false);
        sinon.stub(Authority, "TrustedHostList").get(function() {return stubbedHostList});
    });

    afterEach(function () {
        authority = null;
        stubbedHostList = [];
        sinon.restore();
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
            authority = new Authority("", false);
        }
        catch(e) {
            expect(e).to.be.equal(ClientConfigurationErrorMessage.invalidAuthorityType)
        }
    });

    it("throws authorityUriInsecure on init if not https", function () {
        try {
            authority = new Authority("http://login.microsoftonline.com/common", false);
        }
        catch(e) {
            expect(e).to.be.equal(ClientConfigurationErrorMessage.authorityUriInsecure)
        }
    });

    it("throws authorityUriInvalidPath on init if there is no path", function () {
        try {
            authority = new Authority("https://login.microsoftonline.com", false);
        }
        catch(e) {
            expect(e).to.be.equal(ClientConfigurationErrorMessage.authorityUriInvalidPath)
        }
    });

    it("hasCachedMetadata returns false if metadata no fetched", () => {
        expect(authority.hasCachedMetadata()).to.be.false;
    });

    it("hasCachedMetadata returns true when metadata is provided", () => {
        const testAuthorityWithMetadata = new Authority(TEST_CONFIG.validAuthority, false, TENANT_DISCOVERY_RESPONSE);

        expect(testAuthorityWithMetadata.hasCachedMetadata()).to.be.true;
    });

    describe("AAD Use Cases", () => {
        it("tests GetOpenIdConfigurationEndpoint with validateAuthority false", async function () {
            const authority = new Authority(TEST_CONFIG.validAuthority, false);
            const endpoint = authority.GetOpenIdConfigurationEndpoint();
    
            expect(endpoint).to.include("/v2.0/.well-known/openid-configuration");
        });
    
        it("tests GetOpenIdConfigurationEndpoint with validateAuthority true and no knownAuthorities provided", async function () {
            await AuthorityFactory.setKnownAuthorities(true, [], stubbedTelemetryManager);
            const authority = new Authority(TEST_CONFIG.validAuthority, true);
            const endpoint = authority.GetOpenIdConfigurationEndpoint();
    
            expect(endpoint).to.include("/v2.0/.well-known/openid-configuration");
        });

        it("tests GetOpenIdConfigurationEndpoint with validateAuthority true and knownAuthorities provided", async function () {
            await AuthorityFactory.setKnownAuthorities(true, TEST_CONFIG.knownAuthorities);
            const authority = new Authority(TEST_CONFIG.validAuthority, true);
            const endpoint = authority.GetOpenIdConfigurationEndpoint();
    
            expect(endpoint).to.include("/v2.0/.well-known/openid-configuration");
        });
    
        it("tests GetOpenIdConfigurationEndpoint with validateAuthority true and not in trusted host list", async function () {
            await AuthorityFactory.setKnownAuthorities(true, ["fabrikam.b2clogin.com"]);
            const authority = new Authority(TEST_CONFIG.validAuthority, true);
            try{
                const endpoint = authority.GetOpenIdConfigurationEndpoint();
            } catch(err) {
                expect(err).to.be.instanceOf(ClientConfigurationError);
                expect(err.errorCode).to.equal(ClientConfigurationErrorMessage.untrustedAuthority.code);
                expect(err.errorMessage).to.equal(ClientConfigurationErrorMessage.untrustedAuthority.desc);
            }
        });
    });

    describe("B2C Use Cases", () => {
        
        it("throws error when authority not in trusted host list", async function () {
            Authority.TrustedHostList["fake.b2clogin.com"] = "fake.b2clogin.com";
    
            authority = new Authority(B2C_TEST_CONFIG.validAuthority, true);
    
            let err:ClientConfigurationError;
            try{
                const endpoint = await authority.GetOpenIdConfigurationEndpoint();
            }catch(e) {
                expect(e).to.be.instanceOf(ClientConfigurationError);
                err = e;
            }
            expect(err.errorCode).to.equal(ClientConfigurationErrorMessage.untrustedAuthority.code);
            expect(err.errorMessage).to.equal(ClientConfigurationErrorMessage.untrustedAuthority.desc);
    
        });
    
        it("throws error if knownAuthorities is not set and validateAuthority is true", async function () {
            authority = new Authority(B2C_TEST_CONFIG.validAuthority, true)
            try {
                const endpoint = await authority.GetOpenIdConfigurationEndpoint();
            }
            catch(e) {
                expect(e).to.be.instanceOf(ClientConfigurationError);
                expect(e.errorCode).to.be.equal(ClientConfigurationErrorMessage.untrustedAuthority.code);
                expect(e.errorMessage).to.be.equal(ClientConfigurationErrorMessage.untrustedAuthority.desc);
            }
    
        });
    });
});
