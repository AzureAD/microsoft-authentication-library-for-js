import { expect } from "chai";
import { AuthorityFactory } from "../../src/authority/AuthorityFactory";
import { INetworkModule, NetworkRequestOptions } from "../../src/network/INetworkModule";
import { TEST_CONFIG } from "../utils/StringConstants";
import { Constants } from "../../src/utils/Constants";
import { ClientConfigurationErrorMessage } from "../../src/error/ClientConfigurationError";
import { Authority } from "../../src/authority/Authority";
import { AuthorityType } from "../../src/authority/AuthorityType";
import { ProtocolMode } from "../../src";

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
        expect(() => AuthorityFactory.createInstance("", networkInterface, ProtocolMode.AAD)).to.throw(ClientConfigurationErrorMessage.urlEmptyError.desc);
        expect(() => AuthorityFactory.createInstance(null, networkInterface, ProtocolMode.AAD)).to.throw(ClientConfigurationErrorMessage.urlEmptyError.desc);
    });

    it("Throws error for malformed url strings", () => {
        expect(() =>
            AuthorityFactory.createInstance(
                "http://login.microsoftonline.com/common",
                networkInterface,
                ProtocolMode.AAD
            )
        ).to.throw(ClientConfigurationErrorMessage.authorityUriInsecure.desc);
        expect(() =>
            AuthorityFactory.createInstance(
                "This is not a URI",
                networkInterface,
                ProtocolMode.AAD
            )
        ).to.throw(ClientConfigurationErrorMessage.urlParseError.desc);
        expect(() =>
            AuthorityFactory.createInstance("", networkInterface, ProtocolMode.AAD)
        ).to.throw(ClientConfigurationErrorMessage.urlEmptyError.desc);
    });

    it("createInstance returns Default instance if AAD Authority", () => {
        const authorityInstance = AuthorityFactory.createInstance(Constants.DEFAULT_AUTHORITY, networkInterface, ProtocolMode.AAD);
        expect(authorityInstance.authorityType).to.be.eq(AuthorityType.Default);
        expect(authorityInstance instanceof Authority);
    });

    it("createInstance returns Default instance if B2C Authority", () => {
        const authorityInstance = AuthorityFactory.createInstance(TEST_CONFIG.b2cValidAuthority, networkInterface, ProtocolMode.AAD);
        expect(authorityInstance.authorityType).to.be.eq(AuthorityType.Default);
        expect(authorityInstance instanceof Authority);
    });

    it("createInstance return ADFS instance if /adfs in path", () => {
        const authorityInstanceAAD = AuthorityFactory.createInstance(TEST_CONFIG.ADFS_VALID_AUTHORITY, networkInterface, ProtocolMode.AAD);
        expect(authorityInstanceAAD.authorityType).to.be.eq(AuthorityType.Adfs);
        expect(authorityInstanceAAD instanceof Authority);

        const authorityInstanceOIDC = AuthorityFactory.createInstance(TEST_CONFIG.ADFS_VALID_AUTHORITY, networkInterface, ProtocolMode.OIDC);
        expect(authorityInstanceOIDC.authorityType).to.be.eq(AuthorityType.Adfs);
        expect(authorityInstanceOIDC instanceof Authority);
    });

    it("createInstance returns (non v2) OIDC endpoint with ProtocolMode: OIDC", () => {
        const authorityInstance = AuthorityFactory.createInstance(Constants.DEFAULT_AUTHORITY, networkInterface, ProtocolMode.OIDC);
        expect(authorityInstance.authorityType).to.be.eq(AuthorityType.Default);
        expect(authorityInstance instanceof Authority);
    })
});
