import { expect } from "chai";
import { ClientConfigurationError, ClientConfigurationErrorMessage } from "../../src/error/ClientConfigurationError";
import { AuthorityFactory } from "../../src/authority/AuthorityFactory";
import { AadAuthority } from "../../src/authority/AadAuthority";
import { B2cAuthority } from "../../src/authority/B2cAuthority";
import { B2C_TEST_CONFIG } from "../TestConstants";
import { B2CTrustedHostList } from "../../src/utils/Constants";

describe("AuthorityFactory.ts Class", function () {
    it("tests if empty authority url returns null", function () {
        const authority = AuthorityFactory.CreateInstance("", true);

        expect(authority).to.be.null;
    });

    it("tests authority type 'aad' returns AAD Authority instance", function() {
        const authority = AuthorityFactory.CreateInstance("https://login.microsoftonline.com/common/", false);

        expect(authority).to.be.instanceOf(AadAuthority);
    });

    it("tests authority type 'b2c' returns B2C Authority instance", function() {
        B2C_TEST_CONFIG.knownAuthorities.forEach(function(authority){
            B2CTrustedHostList[authority] = authority;
        });
        const authority = AuthorityFactory.CreateInstance("https://fabrikamb2c.b2clogin.com/fabrikamb2c.onmicrosoft.com/b2c_1_susi", false);

        expect(authority).to.be.instanceOf(B2cAuthority);
    });

});