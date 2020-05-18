import { expect } from "chai";
import { ClientConfigurationError, ClientConfigurationErrorMessage } from "../../src/error/ClientConfigurationError";
import { AuthorityFactory } from "../../src/authority/AuthorityFactory";
import { AadAuthority } from "../../src/authority/AadAuthority";
import { B2cAuthority, B2CTrustedHostList } from "../../src/authority/B2cAuthority";
import { B2C_TEST_CONFIG, TEST_CONFIG, OPENID_CONFIGURATION, TENANT_DISCOVERY_RESPONSE } from "../TestConstants";
import { OpenIdConfiguration, ITenantDiscoveryResponse } from "../../src/authority/ITenantDiscoveryResponse";

describe("AuthorityFactory.ts Class", function () {
    let authority = null

    beforeEach(function () {
        authority = null

        for (var host in B2CTrustedHostList) {
            delete B2CTrustedHostList[host];
        };
    });

    it("tests if empty authority url returns null", function () {
        authority = AuthorityFactory.CreateInstance("", true);

        expect(authority).to.be.null;
    });

    it("tests returns AAD Authority instance", function() {
        authority = AuthorityFactory.CreateInstance(TEST_CONFIG.validAuthority, false);

        expect(authority).to.be.instanceOf(AadAuthority);
    });

    it("tests returns B2C Authority instance when knownAuthorities set", function() {
        AuthorityFactory.setKnownAuthorities(true, B2C_TEST_CONFIG.knownAuthorities)
        
        authority = AuthorityFactory.CreateInstance(B2C_TEST_CONFIG.validAuthority, false);

        expect(authority).to.be.instanceOf(B2cAuthority);
    });

    it("throws error when Authority is ADFS", function() {
        // Replace this test with a proper ADFS check when ADFS is supported
        let err: ClientConfigurationError;
        try {
            authority = AuthorityFactory.CreateInstance("https://testendpoint.domain.com/adfs", false);
        }
        catch(e) {
            expect(e).to.be.instanceOf(ClientConfigurationError);
            err = e
        }

        expect(err.errorCode).to.be.equal(ClientConfigurationErrorMessage.invalidAuthorityType.code);
        expect(err.errorMessage).to.be.equal(ClientConfigurationErrorMessage.invalidAuthorityType.desc);
    });

    it("Sets B2CTrustedHostList with Known Authorities", () => {
        AuthorityFactory.setKnownAuthorities(true, B2C_TEST_CONFIG.knownAuthorities)

        expect(B2CTrustedHostList["fabrikamb2c.b2clogin.com"]).to.be.equal("fabrikamb2c.b2clogin.com");
        expect(Object.keys(B2CTrustedHostList)).to.have.length(1);
    });

    it("Do not add additional authorities to trusted host list if it has already been populated", () => {
        AuthorityFactory.setKnownAuthorities(true, B2C_TEST_CONFIG.knownAuthorities)
        AuthorityFactory.setKnownAuthorities(true, ["contoso.b2clogin.com"])

        expect(B2CTrustedHostList["fabrikamb2c.b2clogin.com"]).to.be.equal("fabrikamb2c.b2clogin.com");
        expect(Object.keys(B2CTrustedHostList)).not.to.include("contoso.b2clogin.com")
        expect(Object.keys(B2CTrustedHostList)).to.have.length(1);
    });

    describe("parseAuthorityMetadata", () => {
        it("does nothing if json is falsey", () => {
            AuthorityFactory.parseAuthorityMetadata(TEST_CONFIG.validAuthority, "");
            expect(AuthorityFactory.getAuthorityMetadata(TEST_CONFIG.validAuthority)).to.be.undefined;
        });

        it("throws if invalid json is provided", done => {
            try {
                AuthorityFactory.parseAuthorityMetadata(TEST_CONFIG.validAuthority, "invalid-json");
            } catch (e) {
                expect(e).instanceOf(ClientConfigurationError);
                expect((e as ClientConfigurationError).errorCode).to.equal("authority_metadata_error");

                // Test should timeout if it doesnt throw
                done();
            }
        });

        it("throws if json is missing required keys", done => {
            try {
                AuthorityFactory.parseAuthorityMetadata(TEST_CONFIG.validAuthority, "{}");
            } catch (e) {
                expect(e).instanceOf(ClientConfigurationError);
                expect((e as ClientConfigurationError).errorCode).to.equal("authority_metadata_error");

                // Test should timeout if it doesnt throw
                done();
            }
        });

        it("parses and stores metadata", () => {
            AuthorityFactory.parseAuthorityMetadata(TEST_CONFIG.validAuthority, JSON.stringify(OPENID_CONFIGURATION));

            expect(AuthorityFactory.getAuthorityMetadata(TEST_CONFIG.validAuthority)).to.deep.equal(TENANT_DISCOVERY_RESPONSE);
        });
    });
});
