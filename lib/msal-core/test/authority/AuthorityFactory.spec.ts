import { expect } from "chai";
import { ClientConfigurationError, ClientConfigurationErrorMessage } from "../../src/error/ClientConfigurationError";
import { AuthorityFactory } from "../../src/authority/AuthorityFactory";
import { AadAuthority } from "../../src/authority/AadAuthority";
import { B2cAuthority } from "../../src/authority/B2cAuthority";
import { TEST_CONFIG } from "../TestConstants";

describe("AuthorityFactory.ts Class", function () {
    it("tests if empty authority url returns null", function () {
        const authority = AuthorityFactory.CreateInstance("", true, TEST_CONFIG.authorityType);

        expect(authority).to.be.null;
    });

    it("tests authority type 'b2c' returns B2C Authority instance", function() {
        const authority = AuthorityFactory.CreateInstance("https://fabrikamb2c.b2clogin.com/fabrikamb2c.onmicrosoft.com/b2c_1_susi", false, "b2c");

        expect(authority).to.be.instanceOf(B2cAuthority);
    });

    it("tests authority type 'B2C' returns B2C Authority instance", function() {
        const authority = AuthorityFactory.CreateInstance("https://fabrikamb2c.b2clogin.com/fabrikamb2c.onmicrosoft.com/b2c_1_susi", false, "B2C");

        expect(authority).to.be.instanceOf(B2cAuthority);
    });

    it("tests authority type 'aad' returns AAD Authority instance", function() {
        const authority = AuthorityFactory.CreateInstance("https://login.microsoftonline.com/common/", false, "aad");

        expect(authority).to.be.instanceOf(AadAuthority);
    });

    it("tests authority type 'AAD' returns AAD Authority instance", function() {
        const authority = AuthorityFactory.CreateInstance("https://login.microsoftonline.com/common/", false, "AAD");

        expect(authority).to.be.instanceOf(AadAuthority);
    });

    it("throws error if authority type is not aad or b2c", function() {
        let err:ClientConfigurationError;
        try{
            const authority = AuthorityFactory.CreateInstance("https://login.microsoftonline.com/common/", false, "fake_type");
        }catch(e) {
            expect(e).to.be.instanceOf(ClientConfigurationError);
            err = e;
        }
        expect(err.errorCode).to.equal(ClientConfigurationErrorMessage.invalidAuthorityType.code);
        expect(err.errorMessage).to.equal(ClientConfigurationErrorMessage.invalidAuthorityType.desc);
    });

});