import { expect } from "chai";
import sinon from "sinon";
import { TrustedAuthority } from "../../src/authority/TrustedAuthority";
import { NetworkRequestOptions } from "../../src/network/INetworkModule";
import { NetworkResponse } from "../../src/network/NetworkManager";
import { OpenIdConfigResponse } from "../../src/authority/OpenIdConfigResponse";

describe("TrustedAuthority.ts Class", function () {
    const knownAuthorities = ["fabrikamb2c.b2clogin.com"];
    const instanceMetadata = [{
        preferred_cache: "fabrikamb2c.b2clogin.com",
        preferred_network: "fabrikamb2c.b2clogin.com",
        aliases: ["fabrikamb2c.b2clogin.com"]
    }];

    afterEach(function() {
        sinon.restore();
    });

    describe("setTrustedAuthoritiesFromConfig", () => {
        it("Sets TrustedHostList with Known Authorities", () => {
            sinon.stub(TrustedAuthority, "getTrustedHostList").returns([]);
            TrustedAuthority.setTrustedAuthoritiesFromConfig(knownAuthorities, []);

            knownAuthorities.forEach(function(authority) {
                expect(TrustedAuthority.IsInTrustedHostList(authority)).to.be.true;
            });
        });

        it("Do not add additional authorities to trusted host list if it has already been populated", () => {
            sinon.stub(TrustedAuthority, "getTrustedHostList").returns(["login.microsoftonline.com"]);
            TrustedAuthority.setTrustedAuthoritiesFromConfig(["contoso.b2clogin.com"], []);

            expect(TrustedAuthority.IsInTrustedHostList("contoso.b2clogin.com")).to.be.false;
        });

        it("Throws error if both knownAuthorities and instanceMetadata are passed", (done) => {
            sinon.stub(TrustedAuthority, "getTrustedHostList").returns([]);
            
            try {
                TrustedAuthority.setTrustedAuthoritiesFromConfig(knownAuthorities, instanceMetadata);
            } catch (e) {
                expect(e).to.eq("Cannot pass both knownAuthorities and instanceMetadata");
                done();
            }
        });
    });
});
