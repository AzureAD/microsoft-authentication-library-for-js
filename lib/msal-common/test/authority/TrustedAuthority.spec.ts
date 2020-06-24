import { expect } from "chai";
import sinon from "sinon";
import { TrustedAuthority } from "../../src/authority/TrustedAuthority";
import { NetworkRequestOptions } from "../../src/network/INetworkModule";
import { NetworkResponse } from "../../src/network/NetworkManager";
import { OpenIdConfigResponse } from "../../src/authority/OpenIdConfigResponse";
import { ClientConfigurationErrorMessage, ClientConfigurationError } from "../../src/error/ClientConfigurationError";

describe("TrustedAuthority.ts Class", function () {
    const knownAuthorities = ["fabrikamb2c.b2clogin.com"];
    const cloudDiscoveryMetadata = [{
        preferred_cache: "fabrikamb2c.b2clogin.com",
        preferred_network: "fabrikamb2c.b2clogin.com",
        aliases: ["fabrikamb2c.b2clogin.com"]
    }];

    const fakeCloudDiscoveryResponse = JSON.stringify({tenant_discovery_endpoint: "not relevant", metadata: cloudDiscoveryMetadata})

    afterEach(function() {
        sinon.restore();
    });

    describe("setTrustedAuthoritiesFromConfig", () => {
        it("Sets TrustedHostList with knownAuthorities", () => {
            sinon.stub(TrustedAuthority, "getTrustedHostList").returns([]);
            TrustedAuthority.setTrustedAuthoritiesFromConfig(knownAuthorities, "");

            expect(TrustedAuthority.IsInTrustedHostList(knownAuthorities[0])).to.be.true;

            const savedcloudDiscoveryMetadata = TrustedAuthority.getCloudDiscoveryMetadata(knownAuthorities[0]);
            savedcloudDiscoveryMetadata.aliases.forEach((alias) => {
                expect(alias).to.eq(knownAuthorities[0]);
            });
            expect(savedcloudDiscoveryMetadata.preferred_cache).to.eq(knownAuthorities[0]);
            expect(savedcloudDiscoveryMetadata.preferred_network).to.eq(knownAuthorities[0]);
        });

        it("Sets TrustedHostList with cloudDiscoveryMetadata", () => {
            sinon.stub(TrustedAuthority, "getTrustedHostList").returns([]);
            TrustedAuthority.setTrustedAuthoritiesFromConfig([], fakeCloudDiscoveryResponse);

            expect(TrustedAuthority.IsInTrustedHostList(knownAuthorities[0])).to.be.true;

            const savedcloudDiscoveryMetadata = TrustedAuthority.getCloudDiscoveryMetadata(knownAuthorities[0]);
            savedcloudDiscoveryMetadata.aliases.forEach(alias => {
                expect(cloudDiscoveryMetadata[0].aliases).to.include(alias);
            });
            expect(savedcloudDiscoveryMetadata.preferred_cache).to.eq(cloudDiscoveryMetadata[0].preferred_cache);
            expect(savedcloudDiscoveryMetadata.preferred_network).to.eq(cloudDiscoveryMetadata[0].preferred_network);
        });

        it("Do not add additional authorities to trusted host list if it has already been populated", () => {
            sinon.stub(TrustedAuthority, "getTrustedHostList").returns(["login.microsoftonline.com"]);
            TrustedAuthority.setTrustedAuthoritiesFromConfig(["contoso.b2clogin.com"], "");

            expect(TrustedAuthority.IsInTrustedHostList("contoso.b2clogin.com")).to.be.false;
        });

        it("Throws error if both knownAuthorities and cloudDiscoveryMetadata are passed", (done) => {
            sinon.stub(TrustedAuthority, "getTrustedHostList").returns([]);
            
            try {
                TrustedAuthority.setTrustedAuthoritiesFromConfig(knownAuthorities, fakeCloudDiscoveryResponse);
            } catch (e) {
                expect(e).to.be.instanceOf(ClientConfigurationError);
                expect(e.errorCode).to.eq(ClientConfigurationErrorMessage.knownAuthoritiesAndCloudDiscoveryMetadata.code);
                expect(e.errorMessage).to.eq(ClientConfigurationErrorMessage.knownAuthoritiesAndCloudDiscoveryMetadata.desc);
                done();
            }
        });
    });

    describe("Helper Functions", () => {
        it("savecloudDiscoveryMetadata adds the passed in metadata to the internal cloudDiscoveryMetadata object per alias", () => {
            const testMetadata = [{
                preferred_cache: "test.b2clogin.com",
                preferred_network: "test.b2clogin.com",
                aliases: ["test.b2clogin.com", "test2.b2clogin.com"]
            }];
            TrustedAuthority.saveCloudDiscoveryMetadata(testMetadata);

            let savedcloudDiscoveryMetadata;

            testMetadata[0].aliases.forEach(alias => {
                expect(TrustedAuthority.IsInTrustedHostList(alias)).to.be.true;

                savedcloudDiscoveryMetadata = TrustedAuthority.getCloudDiscoveryMetadata(alias);
                expect(savedcloudDiscoveryMetadata.aliases).to.eq(testMetadata[0].aliases);
                expect(savedcloudDiscoveryMetadata.preferred_cache).to.eq(testMetadata[0].preferred_cache);
                expect(savedcloudDiscoveryMetadata.preferred_network).to.eq(testMetadata[0].preferred_network);
            });
        });

        it("savecloudDiscoveryMetadata adds all passed in metadata to the internal cloudDiscoveryMetadata object", () => {
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
            TrustedAuthority.saveCloudDiscoveryMetadata(testMetadata);

            let savedcloudDiscoveryMetadata;

            testMetadata.forEach(instance => {
                expect(TrustedAuthority.IsInTrustedHostList(instance.aliases[0])).to.be.true;

                savedcloudDiscoveryMetadata = TrustedAuthority.getCloudDiscoveryMetadata(instance.aliases[0]);
                expect(savedcloudDiscoveryMetadata.aliases).to.eq(instance.aliases);
                expect(savedcloudDiscoveryMetadata.preferred_cache).to.eq(instance.preferred_cache);
                expect(savedcloudDiscoveryMetadata.preferred_network).to.eq(instance.preferred_network);
            });
        });

        it("createcloudDiscoveryMetadataFromKnownAuthorities creates metadata object for each host passed in", () => {
            const testAuthorities = ["contoso.b2clogin.com"]
            TrustedAuthority.createCloudDiscoveryMetadataFromKnownAuthorities(testAuthorities);

            expect(TrustedAuthority.IsInTrustedHostList(testAuthorities[0])).to.be.true;

            const savedcloudDiscoveryMetadata = TrustedAuthority.getCloudDiscoveryMetadata(testAuthorities[0]);
            savedcloudDiscoveryMetadata.aliases.forEach((alias) => {
                expect(alias).to.eq(testAuthorities[0]);
            });
            expect(savedcloudDiscoveryMetadata.preferred_cache).to.eq(testAuthorities[0]);
            expect(savedcloudDiscoveryMetadata.preferred_network).to.eq(testAuthorities[0]);
        });
    });
});
