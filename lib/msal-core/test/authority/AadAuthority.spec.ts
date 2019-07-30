import { expect } from "chai";
import { AuthorityType, Authority } from "../../src/authority/Authority";
import { AadAuthority } from "../../src/authority/AadAuthority";
import { ITenantDiscoveryResponse} from "../../src/authority/ITenantDiscoveryResponse"

describe("AadAuthority.ts class", () => {

    const DEFAULT_AUTHORITY = "https://login.microsoftonline.com/common";
    const AAD_INSTANCE_DISCOVERY_ENDPOINT = "https://login.microsoftonline.com/common/discovery/instance";
    const AAD_INSTANCE_DISCOVERY_ENDPOINT_URL = `${AAD_INSTANCE_DISCOVERY_ENDPOINT}?api-version=1.0&authorization_endpoint=${this.CanonicalAuthority}oauth2/v2.0/authorize`;

    const TEST_TENANT = "8e1a1629-b777-48a8-8a36-1db8500190bd";
    const testTenantDiscoveryResponse: ITenantDiscoveryResponse  = {
        AuthorizationEndpoint: "string",
        EndSessionEndpoint: "string",
        Issuer: "string"
    }


    // AAD authority instantiation
    const aadAuthority = new AadAuthority(DEFAULT_AUTHORITY, true);

    it("verifies Authority type", function () {
        expect(aadAuthority.AuthorityType).to.equal(AuthorityType.Aad);
    });

    it("verifies trusted host list", function () {

        const validHost = "login.windows.net";
        const invalidHost = "login.windows.always.net"

        const isValidHostInList = aadAuthority.IsInTrustedHostList(validHost);
        const isInvalidHostInList = aadAuthority.IsInTrustedHostList(invalidHost);

        expect(isValidHostInList).to.equal(true);
        expect(isInvalidHostInList).to.equal(false);
    });






    it("verfiies openIdConfiguration Endpoint", function () {
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
