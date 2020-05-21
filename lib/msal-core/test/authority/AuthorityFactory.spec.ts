import { expect } from "chai";
import { ClientConfigurationError, ClientConfigurationErrorMessage } from "../../src/error/ClientConfigurationError";
import { AuthorityFactory } from "../../src/authority/AuthorityFactory";
import { TEST_CONFIG, OPENID_CONFIGURATION, TENANT_DISCOVERY_RESPONSE } from "../TestConstants";
import { Authority } from "../../src/authority/Authority";
import sinon from "sinon";
import TelemetryManager from "../../src/telemetry/TelemetryManager";
import { TelemetryConfig } from "../../src/telemetry/TelemetryTypes";
import { Logger } from "../../src/Logger";

const stubbedTelemetryConfig: TelemetryConfig = {
    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
    platform: {
        applicationName: TEST_CONFIG.applicationName,
        applicationVersion: TEST_CONFIG.applicationVersion
    }
};

const stubbedTelemetryManager = new TelemetryManager(stubbedTelemetryConfig, () => {}, new Logger(() => {}));

describe("AuthorityFactory.ts Class", function () {
    let authority = null

    beforeEach(function () {
        authority = null
    });

    afterEach(function() {
        sinon.restore();
    })

    describe("CreateInstance", () => {
        it("tests if empty authority url returns null", function () {
            authority = AuthorityFactory.CreateInstance("", true);
    
            expect(authority).to.be.null;
        });
    
        it("tests returns Authority instance with validateAuthority set to false", function() {
            authority = AuthorityFactory.CreateInstance(TEST_CONFIG.validAuthority, false);
    
            expect(authority).to.be.instanceOf(Authority);
        });

        it("tests returns Authority instance with validateAuthority set to true", function() {
            sinon.stub(AuthorityFactory, "IsInTrustedHostList").returns(true);
            authority = AuthorityFactory.CreateInstance(TEST_CONFIG.validAuthority, true);

            expect(authority).to.be.instanceOf(Authority);
        });

        it("throws error when authority not in TrustedHostList", function () {
            sinon.stub(AuthorityFactory, "IsInTrustedHostList").returns(false);
    
            let err:ClientConfigurationError;
            try{
                authority = AuthorityFactory.CreateInstance(TEST_CONFIG.validAuthority, true);;
            }catch(e) {
                expect(e).to.be.instanceOf(ClientConfigurationError);
                err = e;
            }
            expect(err.errorCode).to.equal(ClientConfigurationErrorMessage.untrustedAuthority.code);
            expect(err.errorMessage).to.include(ClientConfigurationErrorMessage.untrustedAuthority.desc);
        });
    });

    describe("setTrustedAuthoritiesFromConfig", () => {
        it("Sets TrustedHostList with Known Authorities", async () => {
            sinon.stub(AuthorityFactory, "getTrustedHostList").returns([]);
            AuthorityFactory.setTrustedAuthoritiesFromConfig(true, TEST_CONFIG.knownAuthorities);

            TEST_CONFIG.knownAuthorities.forEach(function(authority) {
                expect(AuthorityFactory.IsInTrustedHostList(authority)).to.be.true;
            });
        });
    
        it("Do not add additional authorities to trusted host list if it has already been populated", async () => {
            sinon.stub(AuthorityFactory, "getTrustedHostList").returns(["login.microsoftonline.com"]);
            AuthorityFactory.setTrustedAuthoritiesFromConfig(true, ["contoso.b2clogin.com"]);
    
            expect(AuthorityFactory.IsInTrustedHostList("contoso.b2clogin.com")).to.be.false;
        });
    });

    describe("saveMetadataFromConfig", () => {
        it("does nothing if json is falsey", () => {
            AuthorityFactory.saveMetadataFromConfig(TEST_CONFIG.validAuthority, "");
            expect(AuthorityFactory.getMetadata(TEST_CONFIG.validAuthority)).to.be.undefined;
        });

        it("throws if invalid json is provided", done => {
            try {
                AuthorityFactory.saveMetadataFromConfig(TEST_CONFIG.validAuthority, "invalid-json");
            } catch (e) {
                expect(e).instanceOf(ClientConfigurationError);
                expect((e as ClientConfigurationError).errorCode).to.equal("authority_metadata_error");

                // Test should timeout if it doesnt throw
                done();
            }
        });

        it("throws if json is missing required keys", done => {
            try {
                AuthorityFactory.saveMetadataFromConfig(TEST_CONFIG.validAuthority, "{}");
            } catch (e) {
                expect(e).instanceOf(ClientConfigurationError);
                expect((e as ClientConfigurationError).errorCode).to.equal("authority_metadata_error");

                // Test should timeout if it doesnt throw
                done();
            }
        });

        it("parses and stores metadata", () => {
            AuthorityFactory.saveMetadataFromConfig(TEST_CONFIG.validAuthority, JSON.stringify(OPENID_CONFIGURATION));

            expect(AuthorityFactory.getMetadata(TEST_CONFIG.validAuthority)).to.deep.equal(TENANT_DISCOVERY_RESPONSE);
        });
    });
});
