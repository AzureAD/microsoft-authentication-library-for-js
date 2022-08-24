import { ClientConfigurationError } from "../../src/error/ClientConfigurationError";
import { AuthorityFactory } from "../../src/authority/AuthorityFactory";
import { TEST_CONFIG, OPENID_CONFIGURATION, TENANT_DISCOVERY_RESPONSE } from "../TestConstants";
import sinon from "sinon";
import { Authority } from "../../src/authority/Authority";

describe("AuthorityFactory.ts Class", function () {
    afterEach(function() {
        sinon.restore();
    });

    describe("CreateInstance", () => {
        it("tests if empty authority url returns null", function () {
            let authority = AuthorityFactory.CreateInstance("", true);
    
            expect(authority).toBeNull();
        });

        it("Creates Authority Instance", function () {
            let authority = AuthorityFactory.CreateInstance(TEST_CONFIG.validAuthority, false);

            expect(authority).toBeInstanceOf(Authority);
        });

        it("calls saveMetadataFromConfig if metadata provided", function (done) {
            // Verification of saved metadata is done in separate tests below
            const testMetadata = JSON.stringify(OPENID_CONFIGURATION)
            sinon.stub(AuthorityFactory, "saveMetadataFromConfig").callsFake(function (authorityUrl, metadata) {
                expect(authorityUrl).toBe(TEST_CONFIG.validAuthority);
                expect(metadata).toBe(testMetadata);
                done();
            });
            
            AuthorityFactory.CreateInstance(TEST_CONFIG.validAuthority, false, testMetadata);
        });
    });

    describe("saveMetadataFromConfig", () => {
        it("does nothing if json is falsey", () => {
            AuthorityFactory.saveMetadataFromConfig("testJsonFalsey.com", "");
            expect(AuthorityFactory.getMetadata("testJsonFalsey.com")).toBeUndefined();
        });

        it("throws if invalid json is provided", done => {
            try {
                AuthorityFactory.saveMetadataFromConfig(TEST_CONFIG.validAuthority, "invalid-json");
            } catch (e) {
                expect(e).toBeInstanceOf(ClientConfigurationError);
                expect((e as ClientConfigurationError).errorCode).toBe("authority_metadata_error");

                // Test should timeout if it doesnt throw
                done();
            }
        });

        it("throws if json is missing required keys", done => {
            try {
                AuthorityFactory.saveMetadataFromConfig(TEST_CONFIG.validAuthority, "{}");
            } catch (e) {
                expect(e).toBeInstanceOf(ClientConfigurationError);
                expect((e as ClientConfigurationError).errorCode).toBe("authority_metadata_error");

                // Test should timeout if it doesnt throw
                done();
            }
        });

        it("parses and stores metadata", () => {
            AuthorityFactory.saveMetadataFromConfig(TEST_CONFIG.validAuthority, JSON.stringify(OPENID_CONFIGURATION));

            expect(AuthorityFactory.getMetadata(TEST_CONFIG.validAuthority)).toEqual(TENANT_DISCOVERY_RESPONSE);
        });
    });
});
