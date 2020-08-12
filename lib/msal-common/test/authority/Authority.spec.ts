import { expect } from "chai";
import sinon from "sinon";
import { Authority } from "../../src/authority/Authority";
import { INetworkModule, NetworkRequestOptions } from "../../src/network/INetworkModule";
import { Constants } from "../../src/utils/Constants";
import {
    TEST_URIS,
    RANDOM_TEST_GUID,
    DEFAULT_OPENID_CONFIG_RESPONSE
} from "../utils/StringConstants";
import { ClientConfigurationErrorMessage, ClientConfigurationError } from "../../src/error/ClientConfigurationError";
import { ClientAuthErrorMessage } from "../../src";
import { ClientTestUtils } from "../client/ClientTestUtils";
import { TrustedAuthority } from "../../src/authority/TrustedAuthority";
import { hostname } from "os";

describe("Authority.ts Class Unit Tests", () => {
    afterEach(() => {
        sinon.restore();
    });

    describe("Constructor", () => {

        it("Creates canonical authority uri based on given uri (and normalizes with '/')", () => {
            const networkInterface: INetworkModule = {
                sendGetRequestAsync<T>(url: string, options?: NetworkRequestOptions): T {
                    return null;
                },
                sendPostRequestAsync<T>(url: string, options?: NetworkRequestOptions): T {
                    return null;
                }
            };
            const authority = new Authority(Constants.DEFAULT_AUTHORITY, networkInterface);
            expect(authority.canonicalAuthority).to.be.eq(`${Constants.DEFAULT_AUTHORITY}`);
        });

        it("Throws error if URI is not in valid format", () => {
            const networkInterface: INetworkModule = {
                sendGetRequestAsync<T>(url: string, options?: NetworkRequestOptions): T {
                    return null;
                },
                sendPostRequestAsync<T>(url: string, options?: NetworkRequestOptions): T {
                    return null;
                }
            };

            expect(() => new Authority("http://login.microsoftonline.com/common", networkInterface)).to.throw(ClientConfigurationErrorMessage.authorityUriInsecure.desc);
            expect(() => new Authority("https://login.microsoftonline.com/", networkInterface)).to.throw(ClientConfigurationErrorMessage.urlParseError.desc);
            expect(() => new Authority("This is not a URI", networkInterface)).to.throw(ClientConfigurationErrorMessage.urlParseError.desc);
            expect(() => new Authority("", networkInterface)).to.throw(ClientConfigurationErrorMessage.urlEmptyError.desc);
        });
    });

    describe("Getters and setters", () => {
        const networkInterface: INetworkModule = {
            sendGetRequestAsync<T>(url: string, options?: NetworkRequestOptions): T {
                return null;
            },
            sendPostRequestAsync<T>(url: string, options?: NetworkRequestOptions): T {
                return null;
            }
        };
        let authority: Authority;
        beforeEach(() => {
            authority = new Authority(Constants.DEFAULT_AUTHORITY, networkInterface);
        });

        it("Gets canonical authority that ends in '/'", () => {
            expect(authority.canonicalAuthority.endsWith("/")).to.be.true;
            expect(authority.canonicalAuthority).to.be.eq(`${Constants.DEFAULT_AUTHORITY}`);
        });

        it("Set canonical authority performs validation and canonicalization on url", () => {
            expect(() => authority.canonicalAuthority = "http://login.microsoftonline.com/common").to.throw(ClientConfigurationErrorMessage.authorityUriInsecure.desc);
            expect(() => authority.canonicalAuthority = "https://login.microsoftonline.com/").to.throw(ClientConfigurationErrorMessage.urlParseError.desc);
            expect(() => authority.canonicalAuthority = "This is not a URI").to.throw(ClientConfigurationErrorMessage.urlParseError.desc);

            authority.canonicalAuthority = `${TEST_URIS.ALTERNATE_INSTANCE}/${RANDOM_TEST_GUID}`;
            expect(authority.canonicalAuthority.endsWith("/")).to.be.true;
            expect(authority.canonicalAuthority).to.be.eq(`${TEST_URIS.ALTERNATE_INSTANCE}/${RANDOM_TEST_GUID}/`);
        });

        it("Get canonicalAuthorityUrlComponents returns current url components", () => {
            expect(authority.canonicalAuthorityUrlComponents.Protocol).to.be.eq("https:");
            expect(authority.canonicalAuthorityUrlComponents.HostNameAndPort).to.be.eq("login.microsoftonline.com");
            expect(authority.canonicalAuthorityUrlComponents.PathSegments).to.be.deep.eq(["common"]);
            expect(authority.canonicalAuthorityUrlComponents.AbsolutePath).to.be.eq("/common/");
            expect(authority.canonicalAuthorityUrlComponents.Hash).to.be.undefined;
            expect(authority.canonicalAuthorityUrlComponents.Search).to.be.undefined;
        });

        it("tenant is equal to first path segment value", () => {
            expect(authority.tenant).to.be.eq("common");
            expect(authority.tenant).to.be.eq(authority.canonicalAuthorityUrlComponents.PathSegments[0]);
        });

        describe("OAuth Endpoints", () => {

            beforeEach(async () => {
                sinon.stub(Authority.prototype, <any>"discoverEndpoints").resolves(DEFAULT_OPENID_CONFIG_RESPONSE);
                ClientTestUtils.setCloudDiscoveryMetadataStubs();
                await authority.resolveEndpointsAsync();
            });

            it("Returns authorization_endpoint of tenantDiscoveryResponse", () => {
                expect(authority.authorizationEndpoint).to.be.eq(DEFAULT_OPENID_CONFIG_RESPONSE.body.authorization_endpoint.replace("{tenant}", "common"));
            });

            it("Returns token_endpoint of tenantDiscoveryResponse", () => {
                expect(authority.tokenEndpoint).to.be.eq(DEFAULT_OPENID_CONFIG_RESPONSE.body.token_endpoint.replace("{tenant}", "common"));
            });

            it("Returns end_session_endpoint of tenantDiscoveryResponse", () => {
                expect(authority.endSessionEndpoint).to.be.eq(DEFAULT_OPENID_CONFIG_RESPONSE.body.end_session_endpoint.replace("{tenant}", "common"));
            });

            it("Returns issuer of tenantDiscoveryResponse for selfSignedJwtAudience", () => {
                expect(authority.selfSignedJwtAudience).to.be.eq(DEFAULT_OPENID_CONFIG_RESPONSE.body.issuer.replace("{tenant}", "common"));
            });

            it("Throws error if endpoint discovery is incomplete for authorizationEndpoint, tokenEndpoint, endSessionEndpoint and selfSignedJwtAudience", () => {
                authority = new Authority(Constants.DEFAULT_AUTHORITY, networkInterface);
                expect(() => authority.authorizationEndpoint).to.throw(ClientAuthErrorMessage.endpointResolutionError.desc);
                expect(() => authority.tokenEndpoint).to.throw(ClientAuthErrorMessage.endpointResolutionError.desc);
                expect(() => authority.endSessionEndpoint).to.throw(ClientAuthErrorMessage.endpointResolutionError.desc);
                expect(() => authority.deviceCodeEndpoint).to.throw(ClientAuthErrorMessage.endpointResolutionError.desc);
                expect(() => authority.selfSignedJwtAudience).to.throw(ClientAuthErrorMessage.endpointResolutionError.desc);
            });
        });
    });

    describe("Endpoint discovery", () => {

        const networkInterface: INetworkModule = {
            sendGetRequestAsync<T>(url: string, options?: NetworkRequestOptions): T {
                return null;
            },
            sendPostRequestAsync<T>(url: string, options?: NetworkRequestOptions): T {
                return null;
            }
        };
        let authority: Authority;
        beforeEach(() => {
            authority = new Authority(Constants.DEFAULT_AUTHORITY, networkInterface);
        });

        it("discoveryComplete returns false if endpoint discovery has not been completed", () => {
            expect(authority.discoveryComplete()).to.be.false;
        });

        it("discoveryComplete returns true if resolveEndpointsAsync resolves successfully", async () => {
            ClientTestUtils.setCloudDiscoveryMetadataStubs();
            sinon.stub(Authority.prototype, <any>"discoverEndpoints").resolves(DEFAULT_OPENID_CONFIG_RESPONSE);
            await authority.resolveEndpointsAsync();
            expect(authority.discoveryComplete()).to.be.true;
        });

        it("resolveEndpoints returns the openIdConfigurationEndpoint and then obtains the tenant discovery response from that endpoint", async () => {
            networkInterface.sendGetRequestAsync = (url: string, options?: NetworkRequestOptions): any => {
                return DEFAULT_OPENID_CONFIG_RESPONSE;
            };
            authority = new Authority(Constants.DEFAULT_AUTHORITY, networkInterface);
            ClientTestUtils.setCloudDiscoveryMetadataStubs();
            await authority.resolveEndpointsAsync();

            expect(authority.discoveryComplete()).to.be.true;
            expect(authority.authorizationEndpoint).to.be.eq(DEFAULT_OPENID_CONFIG_RESPONSE.body.authorization_endpoint.replace("{tenant}", "common"));
            expect(authority.tokenEndpoint).to.be.eq(DEFAULT_OPENID_CONFIG_RESPONSE.body.token_endpoint.replace("{tenant}", "common"));
            expect(authority.deviceCodeEndpoint).to.be.eq(DEFAULT_OPENID_CONFIG_RESPONSE.body.token_endpoint.replace("/token", "/devicecode"));
            expect(authority.endSessionEndpoint).to.be.eq(DEFAULT_OPENID_CONFIG_RESPONSE.body.end_session_endpoint.replace("{tenant}", "common"));
            expect(authority.selfSignedJwtAudience).to.be.eq(DEFAULT_OPENID_CONFIG_RESPONSE.body.issuer.replace("{tenant}", "common"));
        });

        it("Attempts to set instance metadata from network if not set", async () => {
            sinon.restore();
            let setFromNetwork = false;
            sinon.stub(TrustedAuthority, "getTrustedHostList").returns([]);
            sinon.stub(TrustedAuthority, "IsInTrustedHostList").returns(true);
            sinon.stub(TrustedAuthority, "setTrustedAuthoritiesFromNetwork").callsFake(async () => {
                setFromNetwork = true;
            });
            sinon.stub(TrustedAuthority, "getCloudDiscoveryMetadata").callsFake(() => {
                return {
                    preferred_cache: Constants.DEFAULT_AUTHORITY_HOST, 
                    preferred_network: Constants.DEFAULT_AUTHORITY_HOST, 
                    aliases: [Constants.DEFAULT_AUTHORITY_HOST]}
            });

            await authority.resolveEndpointsAsync();
            expect(setFromNetwork).to.be.true;
        });

        it("throws untrustedAuthority error if host is not in TrustedHostList", async () => {
            sinon.restore();
            sinon.stub(TrustedAuthority, "getTrustedHostList").returns(["testAuthority"]);
            sinon.stub(TrustedAuthority, "IsInTrustedHostList").returns(false);

            let err = null;
            try {
                await authority.resolveEndpointsAsync();
            } catch (e) {
                expect(e).to.be.instanceOf(ClientConfigurationError);
                err = e;
            }
            expect(err.errorMessage).to.equal(ClientConfigurationErrorMessage.untrustedAuthority.desc);
            expect(err.errorCode).to.equal(ClientConfigurationErrorMessage.untrustedAuthority.code);
        });

        it("ADFS authority uses v1 well-known endpoint", async () => {
            const authorityUrl = "https://login.microsoftonline.com/adfs/"
            let endpoint = "";
            authority = new Authority(authorityUrl, networkInterface);
            sinon.stub(TrustedAuthority, "getTrustedHostList").returns(["login.microsoftonline.com"]);
            sinon.stub(TrustedAuthority, "IsInTrustedHostList").returns(true);
            sinon.stub(TrustedAuthority, "getCloudDiscoveryMetadata").callsFake(() => {
                return {
                    preferred_cache: Constants.DEFAULT_AUTHORITY_HOST, 
                    preferred_network: Constants.DEFAULT_AUTHORITY_HOST, 
                    aliases: [Constants.DEFAULT_AUTHORITY_HOST]}
            });
            sinon.stub(Authority.prototype, <any>"discoverEndpoints").callsFake((openIdEndpoint) => {
                endpoint = openIdEndpoint;
                return DEFAULT_OPENID_CONFIG_RESPONSE; // Response is required but is not important for this test
            });

            await authority.resolveEndpointsAsync();
            expect(endpoint).to.equal(`${authorityUrl}.well-known/openid-configuration`);
        });
    });
});
