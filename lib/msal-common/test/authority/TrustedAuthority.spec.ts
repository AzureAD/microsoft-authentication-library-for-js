import { expect } from "chai";
import sinon from "sinon";
import { TrustedAuthority } from "../../src/authority/TrustedAuthority";
import { NetworkRequestOptions } from "../../src/network/INetworkModule";
import { NetworkResponse } from "../../src/network/NetworkManager";
import { OpenIdConfigResponse } from "../../src/authority/OpenIdConfigResponse";
import { ClientConfigurationErrorMessage, ClientConfigurationError } from "../../src/error/ClientConfigurationError";

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
        it("Sets TrustedHostList with knownAuthorities", () => {
            sinon.stub(TrustedAuthority, "getTrustedHostList").returns([]);
            TrustedAuthority.setTrustedAuthoritiesFromConfig(knownAuthorities, []);

            expect(TrustedAuthority.IsInTrustedHostList(knownAuthorities[0])).to.be.true;

            const savedInstanceMetadata = TrustedAuthority.getInstanceMetadata(knownAuthorities[0]);
            savedInstanceMetadata.aliases.forEach((alias) => {
                expect(alias).to.eq(knownAuthorities[0]);
            });
            expect(savedInstanceMetadata.preferred_cache).to.eq(knownAuthorities[0]);
            expect(savedInstanceMetadata.preferred_network).to.eq(knownAuthorities[0]);
        });

        it("Sets TrustedHostList with instanceMetadata", () => {
            sinon.stub(TrustedAuthority, "getTrustedHostList").returns([]);
            TrustedAuthority.setTrustedAuthoritiesFromConfig([], instanceMetadata);

            expect(TrustedAuthority.IsInTrustedHostList(knownAuthorities[0])).to.be.true;

            const savedInstanceMetadata = TrustedAuthority.getInstanceMetadata(knownAuthorities[0]);
            expect(savedInstanceMetadata.aliases).to.eq(instanceMetadata[0].aliases);
            expect(savedInstanceMetadata.preferred_cache).to.eq(instanceMetadata[0].preferred_cache);
            expect(savedInstanceMetadata.preferred_network).to.eq(instanceMetadata[0].preferred_network);
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
                expect(e).to.be.instanceOf(ClientConfigurationError);
                expect(e.errorCode).to.eq(ClientConfigurationErrorMessage.knownAuthoritiesAndInstanceMetadata.code);
                expect(e.errorMessage).to.eq(ClientConfigurationErrorMessage.knownAuthoritiesAndInstanceMetadata.desc);
                done();
            }
        });
    });

    describe("Helper Functions", () => {
        it("saveInstanceMetadata adds the passed in metadata to the internal InstanceMetadata object per alias", () => {
            const testMetadata = [{
                preferred_cache: "test.b2clogin.com",
                preferred_network: "test.b2clogin.com",
                aliases: ["test.b2clogin.com", "test2.b2clogin.com"]
            }];
            TrustedAuthority.saveInstanceMetadata(testMetadata);

            let savedInstanceMetadata;

            testMetadata[0].aliases.forEach(alias => {
                expect(TrustedAuthority.IsInTrustedHostList(alias)).to.be.true;

                savedInstanceMetadata = TrustedAuthority.getInstanceMetadata(alias);
                expect(savedInstanceMetadata.aliases).to.eq(testMetadata[0].aliases);
                expect(savedInstanceMetadata.preferred_cache).to.eq(testMetadata[0].preferred_cache);
                expect(savedInstanceMetadata.preferred_network).to.eq(testMetadata[0].preferred_network);
            });
        });

        it("saveInstanceMetadata adds all passed in metadata to the internal InstanceMetadata object", () => {
            const testMetadata = [{
                preferred_cache: "test.b2clogin.com",
                preferred_network: "test.b2clogin.com",
                aliases: ["test3.b2clogin.com"]
            },
            {
                preferred_cache: "test.b2clogin.com",
                preferred_network: "test.b2clogin.com",
                aliases: ["test4.b2clogin.com"]
            }];
            TrustedAuthority.saveInstanceMetadata(testMetadata);

            let savedInstanceMetadata;

            testMetadata.forEach(instance => {
                expect(TrustedAuthority.IsInTrustedHostList(instance.aliases[0])).to.be.true;

                savedInstanceMetadata = TrustedAuthority.getInstanceMetadata(instance.aliases[0]);
                expect(savedInstanceMetadata.aliases).to.eq(instance.aliases);
                expect(savedInstanceMetadata.preferred_cache).to.eq(instance.preferred_cache);
                expect(savedInstanceMetadata.preferred_network).to.eq(instance.preferred_network);
            });
        });

        it("createInstanceMetadataFromKnownAuthorities creates metadata object for each host passed in", () => {
            const testAuthorities = ["contoso.b2clogin.com"]
            TrustedAuthority.createInstanceMetadataFromKnownAuthorities(testAuthorities);

            expect(TrustedAuthority.IsInTrustedHostList(testAuthorities[0])).to.be.true;

            const savedInstanceMetadata = TrustedAuthority.getInstanceMetadata(testAuthorities[0]);
            savedInstanceMetadata.aliases.forEach((alias) => {
                expect(alias).to.eq(testAuthorities[0]);
            });
            expect(savedInstanceMetadata.preferred_cache).to.eq(testAuthorities[0]);
            expect(savedInstanceMetadata.preferred_network).to.eq(testAuthorities[0]);
        });
    });
});
