import { expect } from "chai";
import { AuthorityFactory } from "../../src/authority/AuthorityFactory";
import { INetworkModule, NetworkRequestOptions } from "../../src/network/INetworkModule";
import { TEST_CONFIG } from "../utils/StringConstants";
import { Constants } from "../../src/utils/Constants";
import { ClientConfigurationErrorMessage } from "../../src/error/ClientConfigurationError";
import { Authority } from "../../src/authority/Authority";
import { TrustedAuthority } from "../../src/authority/TrustedAuthority";
import { AuthorityType } from "../../src/authority/AuthorityType";

describe("AuthorityFactory.ts Class Unit Tests", () => {
    const networkInterface: INetworkModule = {
        sendGetRequestAsync<T>(
            url: string,
            options?: NetworkRequestOptions
        ): T {
            return null;
        },
        sendPostRequestAsync<T>(
            url: string,
            options?: NetworkRequestOptions
        ): T {
            return null;
        }
    };

    it("AuthorityFactory returns null if given url is null or empty", () => {
        expect(() => AuthorityFactory.createInstance("", networkInterface)).to.throw(ClientConfigurationErrorMessage.urlEmptyError.desc);
        expect(() => AuthorityFactory.createInstance(null, networkInterface)).to.throw(ClientConfigurationErrorMessage.urlEmptyError.desc);
    });

    it("Throws error for malformed url strings", () => {
        expect(() =>
            AuthorityFactory.createInstance(
                "http://login.microsoftonline.com/common",
                networkInterface
            )
        ).to.throw(ClientConfigurationErrorMessage.authorityUriInsecure.desc);
        expect(() =>
            AuthorityFactory.createInstance(
                "https://login.microsoftonline.com/",
                networkInterface
            )
        ).to.throw(ClientConfigurationErrorMessage.urlParseError.desc);
        expect(() =>
            AuthorityFactory.createInstance(
                "This is not a URI",
                networkInterface
            )
        ).to.throw(ClientConfigurationErrorMessage.urlParseError.desc);
        expect(() =>
            AuthorityFactory.createInstance("", networkInterface)
        ).to.throw(ClientConfigurationErrorMessage.urlEmptyError.desc);
    });

    it("createInstance returns Default instance if AAD Authority", () => {
        const authorityInstance = AuthorityFactory.createInstance(Constants.DEFAULT_AUTHORITY, networkInterface);
        expect(authorityInstance.authorityType).to.be.eq(AuthorityType.Default);
        expect(authorityInstance instanceof Authority);
    });

    it("createInstance returns Default instance if B2C Authority", () => {
        const authorityInstance = AuthorityFactory.createInstance(TEST_CONFIG.b2cValidAuthority, networkInterface);
        expect(authorityInstance.authorityType).to.be.eq(AuthorityType.Default);
        expect(authorityInstance instanceof Authority);
    });

    it("createInstance return ADFS instance if /adfs in path", () => {
        const authorityInstance = AuthorityFactory.createInstance(TEST_CONFIG.ADFS_VALID_AUTHORITY, networkInterface);
        expect(authorityInstance.authorityType).to.be.eq(AuthorityType.Adfs);
        expect(authorityInstance instanceof Authority);
    });
});
