import { expect } from "chai";
import { ClientConfigurationError } from "../../src/error/ClientConfigurationError";
import { AuthorityFactory } from "../../src/authority/AuthorityFactory";
import { B2C_TEST_CONFIG, TEST_CONFIG, OPENID_CONFIGURATION, TENANT_DISCOVERY_RESPONSE } from "../TestConstants";
import { Authority } from "../../src/authority/Authority";
import sinon from "sinon";

let stubbedHostList: Array<string> = [];

describe("AuthorityFactory.ts Class", function () {
    let authority = null

    beforeEach(function () {
        authority = null
        sinon.stub(Authority, "TrustedHostList").get(function() {return stubbedHostList});
    });

    afterEach(function () {
        stubbedHostList = [];
        sinon.restore();
    });

    it("tests if empty authority url returns null", function () {
        authority = AuthorityFactory.CreateInstance("", true);

        expect(authority).to.be.null;
    });

    it("tests returns AAD Authority instance", function() {
        authority = AuthorityFactory.CreateInstance(TEST_CONFIG.validAuthority, false);

        expect(authority).to.be.instanceOf(Authority);
    });

    it("tests returns B2C Authority instance when knownAuthorities set", function() {
        AuthorityFactory.setKnownAuthorities(true, TEST_CONFIG.knownAuthorities)
        
        authority = AuthorityFactory.CreateInstance(B2C_TEST_CONFIG.validAuthority, false);

        expect(authority).to.be.instanceOf(Authority);
    });

    it("Sets TrustedHostList with Known Authorities", () => {
        AuthorityFactory.setKnownAuthorities(true, TEST_CONFIG.knownAuthorities)

        expect(stubbedHostList).to.include("fabrikamb2c.b2clogin.com");
        expect(stubbedHostList).to.include("login.microsoftonline.com");
        expect(stubbedHostList).to.include("login.windows.net");
        expect(stubbedHostList).to.have.length(3);
    });

    it("Do not add additional authorities to trusted host list if it has already been populated", () => {
        AuthorityFactory.setKnownAuthorities(true, TEST_CONFIG.knownAuthorities)
        AuthorityFactory.setKnownAuthorities(true, ["contoso.b2clogin.com"])

        expect(stubbedHostList).to.include("fabrikamb2c.b2clogin.com");
        expect(stubbedHostList).to.include("login.microsoftonline.com");
        expect(stubbedHostList).to.include("login.windows.net");
        expect(stubbedHostList).not.to.include("contoso.b2clogin.com")
        expect(stubbedHostList).to.have.length(3);
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
