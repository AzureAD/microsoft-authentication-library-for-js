import { expect } from "chai";
import { AuthorityType, Authority } from "../../src/authority/Authority";
import { AadAuthority } from "../../src/authority/AadAuthority";
import { ITenantDiscoveryResponse} from "../../src/authority/ITenantDiscoveryResponse"
import { AuthError } from "../../src";
import { ClientAuthErrorMessage } from "../../src/error/ClientAuthError";
import { ClientConfigurationErrorMessage } from "../../src/error/ClientConfigurationError";
import { validOpenIdConfigurationResponse } from "../TestConstants";

describe("AadAuthority.ts class", () => {

    const DEFAULT_AUTHORITY = "https://login.microsoftonline.com/common";
    const TEST_TENANT = "8e1a1629-b777-48a8-8a36-1db8500190bd";
    const TEST_AUTHORITY = `https://login.microsoftonline.com/${TEST_TENANT}`;

    // AAD authority instantiation
    const aadAuthority = new AadAuthority(DEFAULT_AUTHORITY, true);

    it.only("verifies AadAuthority instantiation", () => {
        expect(aadAuthority.IsValidationEnabled).to.equal(true);
        expect(aadAuthority.CanonicalAuthority).to.equal(`${DEFAULT_AUTHORITY}/`);
    });

    it.only("verifies error flow in AadAuthority instantiation: empty authority", () => {
        let authCreationError;
        let errAadAuthority: Authority;

        try {
            errAadAuthority = new AadAuthority("", true);
        }
        catch (e){
            authCreationError = e;
        }
        expect(authCreationError.code).to.equal(ClientConfigurationErrorMessage.invalidAuthorityType.code);
        expect(authCreationError.desc).to.equal(ClientConfigurationErrorMessage.invalidAuthorityType.desc);
    });

    it.only("verifies error flow in AadAuthority instantiation: insecure authority", () => {
        let authCreationError;
        let errAadAuthority: Authority;

        try {
            errAadAuthority = new AadAuthority("http://domain", true);
        }
        catch (e){
            authCreationError = e;
        }
        expect(authCreationError.code).to.equal(ClientConfigurationErrorMessage.authorityUriInsecure.code);
        expect(authCreationError.desc).to.equal(ClientConfigurationErrorMessage.authorityUriInsecure.desc);
    });

    it.only("verifies error flow in AadAuthority instantiation: insecure authority", () => {
        let authCreationError;
        let errAadAuthority: Authority;

        try {
            errAadAuthority = new AadAuthority("https://domain", true);
        }
        catch (e){
            authCreationError = e;
        }
        expect(authCreationError.code).to.equal(ClientConfigurationErrorMessage.authorityUriInvalidPath.code);
        expect(authCreationError.desc).to.equal(ClientConfigurationErrorMessage.authorityUriInvalidPath.desc);
    });

    it.only("verifies Authority type", () => {
        expect(aadAuthority.AuthorityType).to.equal(AuthorityType.Aad);
    });

    it.only("verifies tenant ID extraction from authority", () => {

        const testAadAuthority = new AadAuthority(TEST_AUTHORITY, true);

        expect(aadAuthority.Tenant).to.equal("common");
        expect(testAadAuthority.Tenant).to.equal(TEST_TENANT);
    });



    // TODO: Failing
    it("verifies trusted host list", () => {

        const validHost = "login.windows.net";
        const invalidHost = "login.windows.always.net"

        const isValidHostInList = aadAuthority.IsInTrustedHostList(validHost);
        const isInvalidHostInList = aadAuthority.IsInTrustedHostList(invalidHost);

        expect(isValidHostInList).to.equal(true);
        expect(isInvalidHostInList).to.equal(false);
    });

    it("verfiies openIdConfiguration Endpoint", () => {
        console.log("canonicalAuth:", aadAuthority.CanonicalAuthority);
        console.log("canonicalAuthUrlComponents:", aadAuthority.CanonicalAuthorityUrlComponents);

        aadAuthority.resolveEndpointsAsync().then(() => {
            console.log("aadAuthority", aadAuthority);
            console.log("canonicalAuth:", aadAuthority.CanonicalAuthority);
            console.log("canonicalAuthUrlComponents:", aadAuthority.CanonicalAuthorityUrlComponents);
        }).catch((err) => {
            this.logger.warning("could not resolve endpoints");
        });
    });


});
