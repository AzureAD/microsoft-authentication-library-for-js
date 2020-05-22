import { expect } from "chai";
import { ClientConfigurationError, ClientConfigurationErrorMessage } from "../../src/error/ClientConfigurationError";
import { AuthorityFactory } from "../../src/authority/AuthorityFactory";
import { TEST_CONFIG, OPENID_CONFIGURATION, TENANT_DISCOVERY_RESPONSE } from "../TestConstants";
import sinon from "sinon";


describe("AuthorityFactory.ts Class", function () {
    afterEach(function() {
        sinon.restore();
    })

    describe("CreateInstance", () => {
        it("tests if empty authority url returns null", function () {
            let authority = AuthorityFactory.CreateInstance("", true);
    
            expect(authority).to.be.null;
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
