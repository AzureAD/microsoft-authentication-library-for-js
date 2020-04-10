import { expect } from "chai";
import { AuthorityFactory } from "../../../src/auth/authority/AuthorityFactory";
import { INetworkModule, NetworkRequestOptions } from "../../../src/network/INetworkModule";
import { ClientConfigurationErrorMessage, ClientAuthErrorMessage, Constants, Authority } from "../../../src";
import { AadAuthority } from "../../../src/auth/authority/AadAuthority";

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

    it("Throws error for B2C url strings that contain tfp", () => {
        expect(() => AuthorityFactory.createInstance("https://contoso.b2clogin.com/tfp/contoso.onmicrosoft.com/B2C_1_signupsignin1", networkInterface)).to.throw(ClientAuthErrorMessage.invalidAuthorityType.desc);
    });

    it("Throws error for malformed url strings", () => {
        expect(() => AuthorityFactory.createInstance(`http://login.microsoftonline.com/common`, networkInterface)).to.throw(ClientConfigurationErrorMessage.authorityUriInsecure.desc);
        expect(() => AuthorityFactory.createInstance(`https://login.microsoftonline.com/`, networkInterface)).to.throw(ClientConfigurationErrorMessage.urlParseError.desc);
        expect(() => AuthorityFactory.createInstance("This is not a URI", networkInterface)).to.throw(ClientConfigurationErrorMessage.urlParseError.desc);
        expect(() => AuthorityFactory.createInstance("", networkInterface)).to.throw(ClientConfigurationErrorMessage.urlEmptyError.desc);
    });

    it("createInstance returns an AAD instance for any valid url string that does not contain a tfp", () => {
        const authorityInstance = AuthorityFactory.createInstance(Constants.DEFAULT_AUTHORITY, networkInterface);
        expect(authorityInstance instanceof AadAuthority);
        expect(authorityInstance instanceof Authority);
    });
});
