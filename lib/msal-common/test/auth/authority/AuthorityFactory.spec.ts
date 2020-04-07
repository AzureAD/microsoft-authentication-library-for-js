import { expect } from "chai";
import { AuthorityFactory, B2CTrustedHostList } from "../../../src/auth/authority/AuthorityFactory";
import { INetworkModule, NetworkRequestOptions } from "../../../src/network/INetworkModule";
import { ClientConfigurationErrorMessage, Constants, Authority, ClientAuthError, ClientAuthErrorMessage } from "../../../src";
import { AadAuthority } from "../../../src/auth/authority/AadAuthority";
import { B2cAuthority } from "../../../src/auth/authority/B2cAuthority"
import { TEST_CONFIG } from "../../utils/StringConstants";

describe("AuthorityFactory.ts Class Unit Tests", () => {

    const networkInterface: INetworkModule = {
        sendGetRequestAsync<T>(url: string, options?: NetworkRequestOptions): T {
            return null;
        },
        sendPostRequestAsync<T>(url: string, options?: NetworkRequestOptions): T {
            return null;
        }
    };
    
    it("AuthorityFactory returns null if given url is null or empty", () => {
        expect(() => AuthorityFactory.createInstance("", networkInterface)).to.throw(ClientConfigurationErrorMessage.urlEmptyError.desc);
        expect(() => AuthorityFactory.createInstance(null, networkInterface)).to.throw(ClientConfigurationErrorMessage.urlEmptyError.desc);
    });

    it("Throws error for malformed url strings", () => {
        expect(() => AuthorityFactory.createInstance(`http://login.microsoftonline.com/common`, networkInterface)).to.throw(ClientConfigurationErrorMessage.authorityUriInsecure.desc);
        expect(() => AuthorityFactory.createInstance(`https://login.microsoftonline.com/`, networkInterface)).to.throw(ClientConfigurationErrorMessage.urlParseError.desc);
        expect(() => AuthorityFactory.createInstance("This is not a URI", networkInterface)).to.throw(ClientConfigurationErrorMessage.urlParseError.desc);
        expect(() => AuthorityFactory.createInstance("", networkInterface)).to.throw(ClientConfigurationErrorMessage.urlEmptyError.desc);
    });

    it("createInstance returns an AAD instance if knownAuthorities not provided", () => {
        const authorityInstance = AuthorityFactory.createInstance(Constants.DEFAULT_AUTHORITY, networkInterface);
        expect(authorityInstance instanceof AadAuthority);
        expect(authorityInstance instanceof Authority);
    });

    it("createInstance returns B2C instance if knownAuthorities is provided", () => {
        AuthorityFactory.setKnownAuthorities(["fabrikamb2c.b2clogin.com"]);
        const authorityInstance = AuthorityFactory.createInstance(TEST_CONFIG.b2cValidAuthority, networkInterface);
        expect(authorityInstance instanceof B2cAuthority);
        expect(authorityInstance instanceof Authority);
    });

    it("Do not add additional authorities to trusted host list if it has already been populated", () => {
        AuthorityFactory.setKnownAuthorities(["fabrikamb2c.b2clogin.com"]);
        AuthorityFactory.setKnownAuthorities(["fake.b2clogin.com"]);

        expect(B2CTrustedHostList).to.include("fabrikamb2c.b2clogin.com");
        expect(B2CTrustedHostList).not.to.include("fake.b2clogin.com");
        expect(B2CTrustedHostList.length).to.equal(1);
    });

    it("Throws error if AuthorityType is not AAD or B2C", (done) => {
        //Right now only way to throw this is to send adfs authority. This will need to change when we implement ADFS
        const errorAuthority = "https://login.microsoftonline.com/adfs"
        try{  
            const authorityInstance = AuthorityFactory.createInstance(errorAuthority, networkInterface);
        }
        catch(e) {
            expect(e).to.be.instanceOf(ClientAuthError)
            expect(e.errorCode).to.be.equal(ClientAuthErrorMessage.invalidAuthorityType.code)
            expect(e.errorMessage).to.be.equal(`${ClientAuthErrorMessage.invalidAuthorityType.desc} Given Url: ${errorAuthority}`)
            done();
        }
    })
});
