import { expect } from "chai";
import sinon from "sinon";
import { Authority } from "../../src/authority/Authority";
import { INetworkModule, NetworkRequestOptions } from "../../src/network/INetworkModule";
import { Constants } from "../../src/utils/Constants";
import {
    TEST_URIS,
    RANDOM_TEST_GUID,
    DEFAULT_OPENID_CONFIG_RESPONSE,
    TEST_CONFIG,
    DEFAULT_TENANT_DISCOVERY_RESPONSE,
    B2C_OPENID_CONFIG_RESPONSE
} from "../test_kit/StringConstants";
import { ClientConfigurationErrorMessage, ClientConfigurationError } from "../../src/error/ClientConfigurationError";
import { AuthorityMetadataEntity, AuthorityOptions, ClientAuthError, ClientAuthErrorMessage, ProtocolMode } from "../../src";
import { MockStorageClass, mockCrypto } from "../client/ClientTestUtils";

let mockStorage: MockStorageClass;

const authorityOptions: AuthorityOptions = {
    protocolMode: ProtocolMode.AAD,
    knownAuthorities: [Constants.DEFAULT_AUTHORITY_HOST],
    cloudDiscoveryMetadata: "",
    authorityMetadata: ""
}

describe("Authority.ts Class Unit Tests", () => {
    beforeEach(() => {
        mockStorage = new MockStorageClass(TEST_CONFIG.MSAL_CLIENT_ID, mockCrypto);
    });
    afterEach(() => {
        sinon.restore();
    });

    describe("Constructor", () => {

        it("Creates canonical authority uri based on given uri (and normalizes with '/')", () => {
            const networkInterface: INetworkModule = {
                sendGetRequestAsync<T>(url: string, options?: NetworkRequestOptions): T {
                    // @ts-ignore
                    return null;
                },
                sendPostRequestAsync<T>(url: string, options?: NetworkRequestOptions): T {
                    // @ts-ignore
                    return null;
                }
            };
            const authority = new Authority(Constants.DEFAULT_AUTHORITY, networkInterface, mockStorage, authorityOptions);
            expect(authority.canonicalAuthority).to.be.eq(`${Constants.DEFAULT_AUTHORITY}`);
        });

        it("Throws error if URI is not in valid format", () => {
            const networkInterface: INetworkModule = {
                sendGetRequestAsync<T>(url: string, options?: NetworkRequestOptions): T {
                    // @ts-ignore
                    return null;
                },
                sendPostRequestAsync<T>(url: string, options?: NetworkRequestOptions): T {
                    // @ts-ignore
                    return null;
                }
            };

            expect(() => new Authority("http://login.microsoftonline.com/common", networkInterface, mockStorage, authorityOptions)).to.throw(ClientConfigurationErrorMessage.authorityUriInsecure.desc);
            expect(() => new Authority("This is not a URI", networkInterface, mockStorage, authorityOptions)).to.throw(ClientConfigurationErrorMessage.urlParseError.desc);
            expect(() => new Authority("", networkInterface, mockStorage, authorityOptions)).to.throw(ClientConfigurationErrorMessage.urlEmptyError.desc);
        });
    });

    describe("Getters and setters", () => {
        const networkInterface: INetworkModule = {
            sendGetRequestAsync<T>(url: string, options?: NetworkRequestOptions): T {
                // @ts-ignore
                return null;
            },
            sendPostRequestAsync<T>(url: string, options?: NetworkRequestOptions): T {
                // @ts-ignore
                return null;
            }
        };
        let authority: Authority;
        beforeEach(() => {
            authority = new Authority(Constants.DEFAULT_AUTHORITY, networkInterface, mockStorage, authorityOptions);
        });

        it("Gets canonical authority that ends in '/'", () => {
            expect(authority.canonicalAuthority.endsWith("/")).to.be.true;
            expect(authority.canonicalAuthority).to.be.eq(`${Constants.DEFAULT_AUTHORITY}`);
        });

        it("Set canonical authority performs validation and canonicalization on url", () => {
            expect(() => authority.canonicalAuthority = "http://login.microsoftonline.com/common").to.throw(ClientConfigurationErrorMessage.authorityUriInsecure.desc);
            expect(() => authority.canonicalAuthority = "https://login.microsoftonline.com/").to.not.throw();
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

        it("Gets options that were passed into constructor", () => {
            expect(authority.options).to.be.eq(authorityOptions);
        });

        describe("OAuth Endpoints", () => {

            beforeEach(async () => {
                sinon.stub(Authority.prototype, <any>"getEndpointMetadataFromNetwork").resolves(DEFAULT_OPENID_CONFIG_RESPONSE.body);
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
                authority = new Authority(Constants.DEFAULT_AUTHORITY, networkInterface, mockStorage, authorityOptions);
                expect(() => authority.authorizationEndpoint).to.throw(ClientAuthErrorMessage.endpointResolutionError.desc);
                expect(() => authority.tokenEndpoint).to.throw(ClientAuthErrorMessage.endpointResolutionError.desc);
                expect(() => authority.endSessionEndpoint).to.throw(ClientAuthErrorMessage.endpointResolutionError.desc);
                expect(() => authority.deviceCodeEndpoint).to.throw(ClientAuthErrorMessage.endpointResolutionError.desc);
                expect(() => authority.selfSignedJwtAudience).to.throw(ClientAuthErrorMessage.endpointResolutionError.desc);
            });

            it("Returns endpoints for different b2c policy than what is cached", async () => {
                sinon.restore();
                const signInPolicy = "b2c_1_sisopolicy";
                const resetPolicy = "b2c_1_password_reset";
                const baseAuthority = "https://login.microsoftonline.com/tfp/msidlabb2c.onmicrosoft.com/";
                sinon.stub(Authority.prototype, <any>"getEndpointMetadataFromNetwork").resolves(B2C_OPENID_CONFIG_RESPONSE.body);

                authority = new Authority(`${baseAuthority}${signInPolicy}`, networkInterface, mockStorage, authorityOptions);
                await authority.resolveEndpointsAsync();
                const secondAuthority = new Authority(`${baseAuthority}${resetPolicy}`, networkInterface, mockStorage, authorityOptions);
                await secondAuthority.resolveEndpointsAsync();

                expect(authority.authorizationEndpoint).to.be.eq(B2C_OPENID_CONFIG_RESPONSE.body.authorization_endpoint);
                expect(secondAuthority.authorizationEndpoint).to.be.eq(B2C_OPENID_CONFIG_RESPONSE.body.authorization_endpoint.replace(signInPolicy, resetPolicy));
                expect(authority.tokenEndpoint).to.be.eq(B2C_OPENID_CONFIG_RESPONSE.body.token_endpoint);
                expect(secondAuthority.tokenEndpoint).to.be.eq(B2C_OPENID_CONFIG_RESPONSE.body.token_endpoint.replace(signInPolicy, resetPolicy));
                expect(authority.endSessionEndpoint).to.be.eq(B2C_OPENID_CONFIG_RESPONSE.body.end_session_endpoint);
                expect(secondAuthority.endSessionEndpoint).to.be.eq(B2C_OPENID_CONFIG_RESPONSE.body.end_session_endpoint.replace(signInPolicy, resetPolicy));
            });
        });
    });

    describe("Regional authorities", () => {
        const networkInterface: INetworkModule = {
            sendGetRequestAsync<T>(url: string, options?: NetworkRequestOptions): T {
                return null;
            },
            sendPostRequestAsync<T>(url: string, options?: NetworkRequestOptions): T {
                return null;
            }
        };

        const authorityOptions = {
            protocolMode: ProtocolMode.AAD,
            knownAuthorities: [Constants.DEFAULT_AUTHORITY_HOST],
            cloudDiscoveryMetadata: "",
            authorityMetadata: "",
            azureRegionConfiguration: { azureRegion: "westus2", environmentRegion: undefined }
        };

        it("discovery endpoint metadata is updated with regional information when the region is provided", async () => {
                const deepCopyOpenIdResponse = JSON.parse(JSON.stringify(DEFAULT_OPENID_CONFIG_RESPONSE));
                networkInterface.sendGetRequestAsync = (url: string, options?: NetworkRequestOptions): any => {
                    return JSON.parse(JSON.stringify(DEFAULT_OPENID_CONFIG_RESPONSE));
                };

                const authority = new Authority(Constants.DEFAULT_AUTHORITY, networkInterface, mockStorage, authorityOptions);
                await authority.resolveEndpointsAsync();

                expect(authority.discoveryComplete()).to.be.true;
                expect(authority.authorizationEndpoint).to.be.eq(`${deepCopyOpenIdResponse.body.authorization_endpoint.replace("{tenant}", "common").replace("login.microsoftonline.com", "westus2.login.microsoft.com")}/`);
                expect(authority.tokenEndpoint).to.be.eq(`${deepCopyOpenIdResponse.body.token_endpoint.replace("{tenant}", "common").replace("login.microsoftonline.com", "westus2.login.microsoft.com")}/?allowestsrnonmsi=true`);
                expect(authority.endSessionEndpoint).to.be.eq(`${deepCopyOpenIdResponse.body.end_session_endpoint.replace("{tenant}", "common").replace("login.microsoftonline.com", "westus2.login.microsoft.com")}/`);
        });

        it("region provided by the user overrides the region auto-discovered", async () => {
                const deepCopyOpenIdResponse = JSON.parse(JSON.stringify(DEFAULT_OPENID_CONFIG_RESPONSE));
                networkInterface.sendGetRequestAsync = (url: string, options?: NetworkRequestOptions): any => {
                    return JSON.parse(JSON.stringify(DEFAULT_OPENID_CONFIG_RESPONSE));
                };

                const authority = new Authority(Constants.DEFAULT_AUTHORITY, networkInterface, mockStorage, {...authorityOptions, azureRegionConfiguration: { azureRegion: "westus2", environmentRegion: "centralus" }});
                await authority.resolveEndpointsAsync();

                expect(authority.discoveryComplete()).to.be.true;
                expect(authority.authorizationEndpoint).to.be.eq(`${deepCopyOpenIdResponse.body.authorization_endpoint.replace("{tenant}", "common").replace("login.microsoftonline.com", "westus2.login.microsoft.com")}/`);
                expect(authority.tokenEndpoint).to.be.eq(`${deepCopyOpenIdResponse.body.token_endpoint.replace("{tenant}", "common").replace("login.microsoftonline.com", "westus2.login.microsoft.com")}/?allowestsrnonmsi=true`);
                expect(authority.endSessionEndpoint).to.be.eq(`${deepCopyOpenIdResponse.body.end_session_endpoint.replace("{tenant}", "common").replace("login.microsoftonline.com", "westus2.login.microsoft.com")}/`);
        });

        it("auto discovered region only used when the user provides the AUTO_DISCOVER flag", async () => {
                const deepCopyOpenIdResponse = JSON.parse(JSON.stringify(DEFAULT_OPENID_CONFIG_RESPONSE));
                networkInterface.sendGetRequestAsync = (url: string, options?: NetworkRequestOptions): any => {
                    return JSON.parse(JSON.stringify(DEFAULT_OPENID_CONFIG_RESPONSE));
                };

                const authority = new Authority(Constants.DEFAULT_AUTHORITY, networkInterface, mockStorage, {...authorityOptions, azureRegionConfiguration: { azureRegion: Constants.AZURE_REGION_AUTO_DISCOVER_FLAG, environmentRegion: "centralus" }});
                await authority.resolveEndpointsAsync();

                expect(authority.discoveryComplete()).to.be.true;
                expect(authority.authorizationEndpoint).to.be.eq(`${deepCopyOpenIdResponse.body.authorization_endpoint.replace("{tenant}", "common").replace("login.microsoftonline.com", "centralus.login.microsoft.com")}/`);
                expect(authority.tokenEndpoint).to.be.eq(`${deepCopyOpenIdResponse.body.token_endpoint.replace("{tenant}", "common").replace("login.microsoftonline.com", "centralus.login.microsoft.com")}/?allowestsrnonmsi=true`);
                expect(authority.endSessionEndpoint).to.be.eq(`${deepCopyOpenIdResponse.body.end_session_endpoint.replace("{tenant}", "common").replace("login.microsoftonline.com", "centralus.login.microsoft.com")}/`);
        });

        it("fallbacks to the global endpoint when the user provides the AUTO_DISCOVER flag but no region is detected", async () => {
                const deepCopyOpenIdResponse = JSON.parse(JSON.stringify(DEFAULT_OPENID_CONFIG_RESPONSE));
                networkInterface.sendGetRequestAsync = (url: string, options?: NetworkRequestOptions): any => {
                    return JSON.parse(JSON.stringify(DEFAULT_OPENID_CONFIG_RESPONSE));
                };

                const authority = new Authority(Constants.DEFAULT_AUTHORITY, networkInterface, mockStorage, {...authorityOptions, azureRegionConfiguration: { azureRegion: Constants.AZURE_REGION_AUTO_DISCOVER_FLAG, environmentRegion: undefined }});
                await authority.resolveEndpointsAsync();

                expect(authority.discoveryComplete()).to.be.true;
                expect(authority.authorizationEndpoint).to.be.eq(deepCopyOpenIdResponse.body.authorization_endpoint.replace("{tenant}", "common"));
                expect(authority.tokenEndpoint).to.be.eq(deepCopyOpenIdResponse.body.token_endpoint.replace("{tenant}", "common"));
                expect(authority.endSessionEndpoint).to.be.eq(deepCopyOpenIdResponse.body.end_session_endpoint.replace("{tenant}", "common"));
        })
    })
    
    describe("Endpoint discovery", () => {

        const networkInterface: INetworkModule = {
            sendGetRequestAsync<T>(url: string, options?: NetworkRequestOptions): T {
                // @ts-ignore
                return null;
            },
            sendPostRequestAsync<T>(url: string, options?: NetworkRequestOptions): T {
                // @ts-ignore
                return null;
            }
        };
        let authority: Authority;
        beforeEach(() => {
            authority = new Authority(Constants.DEFAULT_AUTHORITY, networkInterface, mockStorage, authorityOptions);
        });

        it("discoveryComplete returns false if endpoint discovery has not been completed", () => {
            expect(authority.discoveryComplete()).to.be.false;
        });

        it("discoveryComplete returns true if resolveEndpointsAsync resolves successfully", async () => {
            sinon.stub(Authority.prototype, <any>"getEndpointMetadataFromNetwork").resolves(DEFAULT_OPENID_CONFIG_RESPONSE.body);
            await authority.resolveEndpointsAsync();
            expect(authority.discoveryComplete()).to.be.true;
        });

        
        describe("Endpoint Metadata", () => {
            it("Gets endpoints from config", async () => {
                const options = {
                    protocolMode: ProtocolMode.AAD,
                    knownAuthorities: [Constants.DEFAULT_AUTHORITY_HOST],
                    cloudDiscoveryMetadata: "",
                    authorityMetadata: JSON.stringify(DEFAULT_OPENID_CONFIG_RESPONSE.body)
                };
                authority = new Authority(Constants.DEFAULT_AUTHORITY, networkInterface, mockStorage, options);
                await authority.resolveEndpointsAsync();
    
                expect(authority.discoveryComplete()).to.be.true;
                expect(authority.authorizationEndpoint).to.be.eq(DEFAULT_OPENID_CONFIG_RESPONSE.body.authorization_endpoint.replace("{tenant}", "common"));
                expect(authority.tokenEndpoint).to.be.eq(DEFAULT_OPENID_CONFIG_RESPONSE.body.token_endpoint.replace("{tenant}", "common"));
                expect(authority.deviceCodeEndpoint).to.be.eq(authority.tokenEndpoint.replace("/token", "/devicecode"));
                expect(authority.endSessionEndpoint).to.be.eq(DEFAULT_OPENID_CONFIG_RESPONSE.body.end_session_endpoint.replace("{tenant}", "common"));
                expect(authority.selfSignedJwtAudience).to.be.eq(DEFAULT_OPENID_CONFIG_RESPONSE.body.issuer.replace("{tenant}", "common"));

                // Test that the metadata is cached
                const key = `authority-metadata-${TEST_CONFIG.MSAL_CLIENT_ID}-${Constants.DEFAULT_AUTHORITY_HOST}`;
                const cachedAuthorityMetadata = mockStorage.getAuthorityMetadata(key);
                if (!cachedAuthorityMetadata) {
                    throw Error("Cached AuthorityMetadata should not be null!");
                } else {
                    expect(cachedAuthorityMetadata.authorization_endpoint).to.be.eq(DEFAULT_OPENID_CONFIG_RESPONSE.body.authorization_endpoint);
                    expect(cachedAuthorityMetadata.token_endpoint).to.be.eq(DEFAULT_OPENID_CONFIG_RESPONSE.body.token_endpoint);
                    expect(cachedAuthorityMetadata.end_session_endpoint).to.be.eq(DEFAULT_OPENID_CONFIG_RESPONSE.body.end_session_endpoint);
                    expect(cachedAuthorityMetadata.issuer).to.be.eq(DEFAULT_OPENID_CONFIG_RESPONSE.body.issuer);
                    expect(cachedAuthorityMetadata.endpointsFromNetwork).to.be.false;
                }
            });

            it("Throws error if authorityMetadata cannot be parsed to json", (done) => {
                const options = {
                    protocolMode: ProtocolMode.AAD,
                    knownAuthorities: [Constants.DEFAULT_AUTHORITY_HOST],
                    cloudDiscoveryMetadata: "",
                    authorityMetadata: "invalid-json"
                };
                authority = new Authority(Constants.DEFAULT_AUTHORITY, networkInterface, mockStorage, options);
                authority.resolveEndpointsAsync().catch(e => {
                    expect(e).to.be.instanceOf(ClientConfigurationError);
                    expect(e.errorMessage).to.be.eq(ClientConfigurationErrorMessage.invalidAuthorityMetadata.desc);
                    done();
                });
            });

            it("Gets endpoints from cache", async () => {
                const key = `authority-metadata-${TEST_CONFIG.MSAL_CLIENT_ID}-${Constants.DEFAULT_AUTHORITY_HOST}`;
                const value = new AuthorityMetadataEntity();
                value.updateCloudDiscoveryMetadata(DEFAULT_TENANT_DISCOVERY_RESPONSE.body.metadata[0], true);
                value.updateEndpointMetadata(DEFAULT_OPENID_CONFIG_RESPONSE.body, true);
                value.updateCanonicalAuthority(Constants.DEFAULT_AUTHORITY);
                mockStorage.setAuthorityMetadata(key, value);

                authority = new Authority(Constants.DEFAULT_AUTHORITY, networkInterface, mockStorage, authorityOptions);
                await authority.resolveEndpointsAsync();
    
                expect(authority.discoveryComplete()).to.be.true;
                expect(authority.authorizationEndpoint).to.be.eq(DEFAULT_OPENID_CONFIG_RESPONSE.body.authorization_endpoint.replace("{tenant}", "common"));
                expect(authority.tokenEndpoint).to.be.eq(DEFAULT_OPENID_CONFIG_RESPONSE.body.token_endpoint.replace("{tenant}", "common"));
                expect(authority.deviceCodeEndpoint).to.be.eq(authority.tokenEndpoint.replace("/token", "/devicecode"));
                expect(authority.endSessionEndpoint).to.be.eq(DEFAULT_OPENID_CONFIG_RESPONSE.body.end_session_endpoint.replace("{tenant}", "common"));
                expect(authority.selfSignedJwtAudience).to.be.eq(DEFAULT_OPENID_CONFIG_RESPONSE.body.issuer.replace("{tenant}", "common"));

                // Test that the metadata is cached
                const cachedAuthorityMetadata = mockStorage.getAuthorityMetadata(key);
                if (!cachedAuthorityMetadata) {
                    throw Error("Cached AuthorityMetadata should not be null!");
                } else {
                    expect(cachedAuthorityMetadata.authorization_endpoint).to.be.eq(DEFAULT_OPENID_CONFIG_RESPONSE.body.authorization_endpoint);
                    expect(cachedAuthorityMetadata.token_endpoint).to.be.eq(DEFAULT_OPENID_CONFIG_RESPONSE.body.token_endpoint);
                    expect(cachedAuthorityMetadata.end_session_endpoint).to.be.eq(DEFAULT_OPENID_CONFIG_RESPONSE.body.end_session_endpoint);
                    expect(cachedAuthorityMetadata.issuer).to.be.eq(DEFAULT_OPENID_CONFIG_RESPONSE.body.issuer);
                    expect(cachedAuthorityMetadata.endpointsFromNetwork).to.be.true;
                }
            });

            it("Gets endpoints from network if cached metadata is expired", async () => {
                const key = `authority-metadata-${TEST_CONFIG.MSAL_CLIENT_ID}-${Constants.DEFAULT_AUTHORITY_HOST}`;
                const value = new AuthorityMetadataEntity();
                value.updateCloudDiscoveryMetadata(DEFAULT_TENANT_DISCOVERY_RESPONSE.body.metadata[0], true);
                value.updateEndpointMetadata(DEFAULT_OPENID_CONFIG_RESPONSE.body, true);
                value.updateCanonicalAuthority(Constants.DEFAULT_AUTHORITY);
                mockStorage.setAuthorityMetadata(key, value);

                sinon.stub(AuthorityMetadataEntity.prototype, "isExpired").returns(true);

                networkInterface.sendGetRequestAsync = (url: string, options?: NetworkRequestOptions): any => {
                    return DEFAULT_OPENID_CONFIG_RESPONSE;
                };
                authority = new Authority(Constants.DEFAULT_AUTHORITY, networkInterface, mockStorage, authorityOptions);
                await authority.resolveEndpointsAsync();
    
                expect(authority.discoveryComplete()).to.be.true;
                expect(authority.authorizationEndpoint).to.be.eq(DEFAULT_OPENID_CONFIG_RESPONSE.body.authorization_endpoint.replace("{tenant}", "common"));
                expect(authority.tokenEndpoint).to.be.eq(DEFAULT_OPENID_CONFIG_RESPONSE.body.token_endpoint.replace("{tenant}", "common"));
                expect(authority.deviceCodeEndpoint).to.be.eq(authority.tokenEndpoint.replace("/token", "/devicecode"));
                expect(authority.endSessionEndpoint).to.be.eq(DEFAULT_OPENID_CONFIG_RESPONSE.body.end_session_endpoint.replace("{tenant}", "common"));
                expect(authority.selfSignedJwtAudience).to.be.eq(DEFAULT_OPENID_CONFIG_RESPONSE.body.issuer.replace("{tenant}", "common"));

                // Test that the metadata is cached
                const cachedAuthorityMetadata = mockStorage.getAuthorityMetadata(key);
                if (!cachedAuthorityMetadata) {
                    throw Error("Cached AuthorityMetadata should not be null!");
                } else {
                    expect(cachedAuthorityMetadata.authorization_endpoint).to.be.eq(DEFAULT_OPENID_CONFIG_RESPONSE.body.authorization_endpoint);
                    expect(cachedAuthorityMetadata.token_endpoint).to.be.eq(DEFAULT_OPENID_CONFIG_RESPONSE.body.token_endpoint);
                    expect(cachedAuthorityMetadata.end_session_endpoint).to.be.eq(DEFAULT_OPENID_CONFIG_RESPONSE.body.end_session_endpoint);
                    expect(cachedAuthorityMetadata.issuer).to.be.eq(DEFAULT_OPENID_CONFIG_RESPONSE.body.issuer);
                    expect(cachedAuthorityMetadata.endpointsFromNetwork).to.be.true;
                }
            });

            it("Gets endpoints from network", async () => {
                networkInterface.sendGetRequestAsync = (url: string, options?: NetworkRequestOptions): any => {
                    return DEFAULT_OPENID_CONFIG_RESPONSE;
                };
                authority = new Authority(Constants.DEFAULT_AUTHORITY, networkInterface, mockStorage, authorityOptions);
                await authority.resolveEndpointsAsync();
    
                expect(authority.discoveryComplete()).to.be.true;
                expect(authority.authorizationEndpoint).to.be.eq(DEFAULT_OPENID_CONFIG_RESPONSE.body.authorization_endpoint.replace("{tenant}", "common"));
                expect(authority.tokenEndpoint).to.be.eq(DEFAULT_OPENID_CONFIG_RESPONSE.body.token_endpoint.replace("{tenant}", "common"));
                expect(authority.deviceCodeEndpoint).to.be.eq(authority.tokenEndpoint.replace("/token", "/devicecode"));
                expect(authority.endSessionEndpoint).to.be.eq(DEFAULT_OPENID_CONFIG_RESPONSE.body.end_session_endpoint.replace("{tenant}", "common"));
                expect(authority.selfSignedJwtAudience).to.be.eq(DEFAULT_OPENID_CONFIG_RESPONSE.body.issuer.replace("{tenant}", "common"));

                // Test that the metadata is cached
                const key = `authority-metadata-${TEST_CONFIG.MSAL_CLIENT_ID}-${Constants.DEFAULT_AUTHORITY_HOST}`;
                const cachedAuthorityMetadata = mockStorage.getAuthorityMetadata(key);
                if (!cachedAuthorityMetadata) {
                    throw Error("Cached AuthorityMetadata should not be null!");
                } else {
                    expect(cachedAuthorityMetadata.authorization_endpoint).to.be.eq(DEFAULT_OPENID_CONFIG_RESPONSE.body.authorization_endpoint);
                    expect(cachedAuthorityMetadata.token_endpoint).to.be.eq(DEFAULT_OPENID_CONFIG_RESPONSE.body.token_endpoint);
                    expect(cachedAuthorityMetadata.end_session_endpoint).to.be.eq(DEFAULT_OPENID_CONFIG_RESPONSE.body.end_session_endpoint);
                    expect(cachedAuthorityMetadata.issuer).to.be.eq(DEFAULT_OPENID_CONFIG_RESPONSE.body.issuer);
                    expect(cachedAuthorityMetadata.endpointsFromNetwork).to.be.true;
                }
            });

            it("Throws error if openid-configuration network call fails", (done) => {
                networkInterface.sendGetRequestAsync = (url: string, options?: NetworkRequestOptions): any => {
                    throw Error("Unable to reach endpoint");
                };
                authority = new Authority(Constants.DEFAULT_AUTHORITY, networkInterface, mockStorage, authorityOptions);
                authority.resolveEndpointsAsync().catch(e => {
                    expect(e).to.be.instanceOf(ClientAuthError);
                    expect(e.errorMessage).to.include(ClientAuthErrorMessage.unableToGetOpenidConfigError.desc);
                    done();
                });
            });
        });

        describe("Cloud Discovery Metadata", () => {
            it("Sets instance metadata from knownAuthorities config", async () => {
                const authorityOptions: AuthorityOptions = {
                    protocolMode: ProtocolMode.AAD,
                    knownAuthorities: [Constants.DEFAULT_AUTHORITY_HOST],
                    cloudDiscoveryMetadata: "",
                    authorityMetadata: ""
                };
                networkInterface.sendGetRequestAsync = (url: string, options?: NetworkRequestOptions): any => {
                    return DEFAULT_OPENID_CONFIG_RESPONSE;
                };
                authority = new Authority(Constants.DEFAULT_AUTHORITY, networkInterface, mockStorage, authorityOptions);
                await authority.resolveEndpointsAsync();
                expect(authority.isAlias(Constants.DEFAULT_AUTHORITY_HOST)).to.be.true;
                expect(authority.getPreferredCache()).to.be.eq(Constants.DEFAULT_AUTHORITY_HOST);
                expect(authority.canonicalAuthority).to.include(Constants.DEFAULT_AUTHORITY_HOST);

                // Test that the metadata is cached
                const key = `authority-metadata-${TEST_CONFIG.MSAL_CLIENT_ID}-${Constants.DEFAULT_AUTHORITY_HOST}`;
                const cachedAuthorityMetadata = mockStorage.getAuthorityMetadata(key);
                if (!cachedAuthorityMetadata) {
                    throw Error("Cached AuthorityMetadata should not be null!");
                } else {
                    expect(cachedAuthorityMetadata.aliases).to.contain(Constants.DEFAULT_AUTHORITY_HOST);
                    expect(cachedAuthorityMetadata.preferred_cache).to.be.eq(Constants.DEFAULT_AUTHORITY_HOST);
                    expect(cachedAuthorityMetadata.preferred_network).to.be.eq(Constants.DEFAULT_AUTHORITY_HOST);
                    expect(cachedAuthorityMetadata.aliasesFromNetwork).to.be.false;
                }
            });

            it("Sets instance metadata from cloudDiscoveryMetadata config & change canonicalAuthority to preferred_network", async () => {
                const authorityOptions: AuthorityOptions = {
                    protocolMode: ProtocolMode.AAD,
                    knownAuthorities: [],
                    cloudDiscoveryMetadata: JSON.stringify(DEFAULT_TENANT_DISCOVERY_RESPONSE.body),
                    authorityMetadata: ""
                };
                networkInterface.sendGetRequestAsync = (url: string, options?: NetworkRequestOptions): any => {
                    return DEFAULT_OPENID_CONFIG_RESPONSE;
                };

                authority = new Authority(Constants.DEFAULT_AUTHORITY, networkInterface, mockStorage, authorityOptions);
                await authority.resolveEndpointsAsync();
                expect(authority.isAlias("login.microsoftonline.com")).to.be.true;
                expect(authority.isAlias("login.windows.net")).to.be.true;
                expect(authority.isAlias("sts.windows.net")).to.be.true;
                expect(authority.getPreferredCache()).to.be.eq("sts.windows.net");
                expect(authority.canonicalAuthority).to.include("login.windows.net");

                // Test that the metadata is cached
                const key = `authority-metadata-${TEST_CONFIG.MSAL_CLIENT_ID}-sts.windows.net`;
                const cachedAuthorityMetadata = mockStorage.getAuthorityMetadata(key);
                if (!cachedAuthorityMetadata) {
                    throw Error("Cached AuthorityMetadata should not be null!");
                } else {
                    expect(cachedAuthorityMetadata.aliases).to.contain("login.microsoftonline.com");
                    expect(cachedAuthorityMetadata.aliases).to.contain("login.windows.net");
                    expect(cachedAuthorityMetadata.aliases).to.contain("sts.windows.net");
                    expect(cachedAuthorityMetadata.preferred_cache).to.be.eq("sts.windows.net");
                    expect(cachedAuthorityMetadata.preferred_network).to.be.eq("login.windows.net");
                    expect(cachedAuthorityMetadata.aliasesFromNetwork).to.be.false;
                }
            });

            it("Sets instance metadata from cache", async () => {
                const authorityOptions: AuthorityOptions = {
                    protocolMode: ProtocolMode.AAD,
                    knownAuthorities: [],
                    cloudDiscoveryMetadata: "",
                    authorityMetadata: ""
                };

                const key = `authority-metadata-${TEST_CONFIG.MSAL_CLIENT_ID}-sts.windows.net`;
                const value = new AuthorityMetadataEntity();
                value.updateCloudDiscoveryMetadata(DEFAULT_TENANT_DISCOVERY_RESPONSE.body.metadata[0], true);
                value.updateCanonicalAuthority(Constants.DEFAULT_AUTHORITY);
                mockStorage.setAuthorityMetadata(key, value);
                sinon.stub(Authority.prototype, <any>"updateEndpointMetadata").resolves("cache");
                authority = new Authority(Constants.DEFAULT_AUTHORITY, networkInterface, mockStorage, authorityOptions);
    
                await authority.resolveEndpointsAsync();
                expect(authority.isAlias("login.microsoftonline.com")).to.be.true;
                expect(authority.isAlias("login.windows.net")).to.be.true;
                expect(authority.isAlias("sts.windows.net")).to.be.true;
                expect(authority.getPreferredCache()).to.be.eq("sts.windows.net");
                expect(authority.canonicalAuthority).to.include("login.windows.net");

                // Test that the metadata is cached
                const cachedAuthorityMetadata = mockStorage.getAuthorityMetadata(key);
                if (!cachedAuthorityMetadata) {
                    throw Error("Cached AuthorityMetadata should not be null!");
                } else {
                    expect(cachedAuthorityMetadata.aliases).to.contain("login.microsoftonline.com");
                    expect(cachedAuthorityMetadata.aliases).to.contain("login.windows.net");
                    expect(cachedAuthorityMetadata.aliases).to.contain("sts.windows.net");
                    expect(cachedAuthorityMetadata.preferred_cache).to.be.eq("sts.windows.net");
                    expect(cachedAuthorityMetadata.preferred_network).to.be.eq("login.windows.net");
                    expect(cachedAuthorityMetadata.aliasesFromNetwork).to.be.true;
                }
            });

            it("Sets instance metadata from network if cached metadata is expired", async () => {
                const authorityOptions: AuthorityOptions = {
                    protocolMode: ProtocolMode.AAD,
                    knownAuthorities: [],
                    cloudDiscoveryMetadata: "",
                    authorityMetadata: ""
                }

                const key = `authority-metadata-${TEST_CONFIG.MSAL_CLIENT_ID}-sts.windows.net`;
                const value = new AuthorityMetadataEntity();
                value.updateCloudDiscoveryMetadata(DEFAULT_TENANT_DISCOVERY_RESPONSE.body.metadata[0], true);
                value.updateCanonicalAuthority(Constants.DEFAULT_AUTHORITY);
                mockStorage.setAuthorityMetadata(key, value);
                sinon.stub(AuthorityMetadataEntity.prototype, "isExpired").returns(true);
                sinon.stub(Authority.prototype, <any>"updateEndpointMetadata").resolves("cache");

                networkInterface.sendGetRequestAsync = (url: string, options?: NetworkRequestOptions): any => {
                    return DEFAULT_TENANT_DISCOVERY_RESPONSE;
                };
                authority = new Authority(Constants.DEFAULT_AUTHORITY, networkInterface, mockStorage, authorityOptions);
    
                await authority.resolveEndpointsAsync();
                expect(authority.isAlias("login.microsoftonline.com")).to.be.true;
                expect(authority.isAlias("login.windows.net")).to.be.true;
                expect(authority.isAlias("sts.windows.net")).to.be.true;
                expect(authority.getPreferredCache()).to.be.eq("sts.windows.net");
                expect(authority.canonicalAuthority).to.include("login.windows.net");

                // Test that the metadata is cached
                const cachedAuthorityMetadata = mockStorage.getAuthorityMetadata(key);
                if (!cachedAuthorityMetadata) {
                    throw Error("Cached AuthorityMetadata should not be null!");
                } else {
                    expect(cachedAuthorityMetadata.aliases).to.contain("login.microsoftonline.com");
                    expect(cachedAuthorityMetadata.aliases).to.contain("login.windows.net");
                    expect(cachedAuthorityMetadata.aliases).to.contain("sts.windows.net");
                    expect(cachedAuthorityMetadata.preferred_cache).to.be.eq("sts.windows.net");
                    expect(cachedAuthorityMetadata.preferred_network).to.be.eq("login.windows.net");
                    expect(cachedAuthorityMetadata.aliasesFromNetwork).to.be.true;
                }
            });

            it("Sets instance metadata from network", async () => {
                const authorityOptions: AuthorityOptions = {
                    protocolMode: ProtocolMode.AAD,
                    knownAuthorities: [],
                    cloudDiscoveryMetadata: "",
                    authorityMetadata: ""
                }
                networkInterface.sendGetRequestAsync = (url: string, options?: NetworkRequestOptions): any => {
                    return DEFAULT_TENANT_DISCOVERY_RESPONSE;
                };
                sinon.stub(Authority.prototype, <any>"updateEndpointMetadata").resolves("cache");
                authority = new Authority(Constants.DEFAULT_AUTHORITY, networkInterface, mockStorage, authorityOptions);
    
                await authority.resolveEndpointsAsync();
                expect(authority.isAlias("login.microsoftonline.com")).to.be.true;
                expect(authority.isAlias("login.windows.net")).to.be.true;
                expect(authority.isAlias("sts.windows.net")).to.be.true;
                expect(authority.getPreferredCache()).to.be.eq("sts.windows.net");
                expect(authority.canonicalAuthority).to.include("login.windows.net");

                // Test that the metadata is cached
                const key = `authority-metadata-${TEST_CONFIG.MSAL_CLIENT_ID}-sts.windows.net`;
                const cachedAuthorityMetadata = mockStorage.getAuthorityMetadata(key);
                if (!cachedAuthorityMetadata) {
                    throw Error("Cached AuthorityMetadata should not be null!");
                } else {
                    expect(cachedAuthorityMetadata.aliases).to.contain("login.microsoftonline.com");
                    expect(cachedAuthorityMetadata.aliases).to.contain("login.windows.net");
                    expect(cachedAuthorityMetadata.aliases).to.contain("sts.windows.net");
                    expect(cachedAuthorityMetadata.preferred_cache).to.be.eq("sts.windows.net");
                    expect(cachedAuthorityMetadata.preferred_network).to.be.eq("login.windows.net");
                    expect(cachedAuthorityMetadata.aliasesFromNetwork).to.be.true;
                }
            });

            it("Sets metadata from host if network call succeeds but does not explicitly include the host", async () => {
                const authorityOptions: AuthorityOptions = {
                    protocolMode: ProtocolMode.AAD,
                    knownAuthorities: [],
                    cloudDiscoveryMetadata: "",
                    authorityMetadata: ""
                }
                networkInterface.sendGetRequestAsync = (url: string, options?: NetworkRequestOptions): any => {
                    return DEFAULT_TENANT_DISCOVERY_RESPONSE;
                };
                sinon.stub(Authority.prototype, <any>"updateEndpointMetadata").resolves("cache");
                authority = new Authority("https://custom-domain.microsoft.com", networkInterface, mockStorage, authorityOptions);
    
                await authority.resolveEndpointsAsync();
                expect(authority.isAlias("custom-domain.microsoft.com")).to.be.true;
                expect(authority.getPreferredCache()).to.be.eq("custom-domain.microsoft.com");
                expect(authority.canonicalAuthority).to.include("custom-domain.microsoft.com");

                // Test that the metadata is cached
                const key = `authority-metadata-${TEST_CONFIG.MSAL_CLIENT_ID}-custom-domain.microsoft.com`;
                const cachedAuthorityMetadata = mockStorage.getAuthorityMetadata(key);
                if (!cachedAuthorityMetadata) {
                    throw Error("Cached AuthorityMetadata should not be null!");
                } else {
                    expect(cachedAuthorityMetadata.aliases).to.contain("custom-domain.microsoft.com");
                    expect(cachedAuthorityMetadata.preferred_cache).to.be.eq("custom-domain.microsoft.com");
                    expect(cachedAuthorityMetadata.preferred_network).to.be.eq("custom-domain.microsoft.com");
                    expect(cachedAuthorityMetadata.aliasesFromNetwork).to.be.true;
                }
            });

            it("Throws if cloudDiscoveryMetadata cannot be parsed into json", (done) => {
                const authorityOptions: AuthorityOptions = {
                    protocolMode: ProtocolMode.AAD,
                    knownAuthorities: [],
                    cloudDiscoveryMetadata: "this-is-not-valid-json",
                    authorityMetadata: ""
                }
                authority = new Authority(Constants.DEFAULT_AUTHORITY, networkInterface, mockStorage, authorityOptions);
                authority.resolveEndpointsAsync().catch(e => {
                    expect(e).to.be.instanceOf(ClientConfigurationError);
                    expect(e.errorMessage).to.be.eq(ClientConfigurationErrorMessage.invalidCloudDiscoveryMetadata.desc);
                    done();
                });
            });

            it("throws untrustedAuthority error if host is not part of knownAuthorities, cloudDiscoveryMetadata and instance discovery network call fails", (done) => {
                const authorityOptions: AuthorityOptions = {
                    protocolMode: ProtocolMode.AAD,
                    knownAuthorities: [],
                    cloudDiscoveryMetadata: "",
                    authorityMetadata: ""
                };
                networkInterface.sendGetRequestAsync = (url: string, options?: NetworkRequestOptions): any => {
                    throw Error("Unable to get response");
                };
                authority = new Authority(Constants.DEFAULT_AUTHORITY, networkInterface, mockStorage, authorityOptions);
    
                authority.resolveEndpointsAsync().catch(e => {
                    expect(e).to.be.instanceOf(ClientConfigurationError);
                    expect(e.errorMessage).to.equal(ClientConfigurationErrorMessage.untrustedAuthority.desc);
                    expect(e.errorCode).to.equal(ClientConfigurationErrorMessage.untrustedAuthority.code);
                    done();
                });
            });

            it("throws untrustedAuthority error if host is not part of knownAuthorities, cloudDiscoveryMetadata and instance discovery network call doesn't return metadata", (done) => {
                const authorityOptions: AuthorityOptions = {
                    protocolMode: ProtocolMode.AAD,
                    knownAuthorities: [],
                    cloudDiscoveryMetadata: "",
                    authorityMetadata: ""
                };
                networkInterface.sendGetRequestAsync = (url: string, options?: NetworkRequestOptions): any => {
                    return {
                        body: { 
                            error: "This endpoint does not exist"
                        }
                    };
                };
                authority = new Authority(Constants.DEFAULT_AUTHORITY, networkInterface, mockStorage, authorityOptions);
    
                authority.resolveEndpointsAsync().catch(e => {
                    expect(e).to.be.instanceOf(ClientConfigurationError);
                    expect(e.errorMessage).to.equal(ClientConfigurationErrorMessage.untrustedAuthority.desc);
                    expect(e.errorCode).to.equal(ClientConfigurationErrorMessage.untrustedAuthority.code);
                    done();
                });
            });

            it("getPreferredCache throws error if discovery is not complete", () => {
                expect(() => authority.getPreferredCache()).to.throw(ClientAuthErrorMessage.endpointResolutionError.desc);
            });
        });

        it("ADFS authority uses v1 well-known endpoint", async () => {
            const authorityUrl = "https://login.microsoftonline.com/adfs/"
            let endpoint = "";
            authority = new Authority(authorityUrl, networkInterface, mockStorage, authorityOptions);
            sinon.stub(networkInterface, <any>"sendGetRequestAsync").callsFake((openIdConfigEndpoint) => {
                endpoint = openIdConfigEndpoint;
                return DEFAULT_OPENID_CONFIG_RESPONSE;
            });

            await authority.resolveEndpointsAsync();
            expect(endpoint).to.equal(`${authorityUrl}.well-known/openid-configuration`);
        });

        it("OIDC ProtocolMode does not append v2 to endpoint", async () => {
            const authorityUrl = "https://login.microsoftonline.com/"
            let endpoint = "";
            const options = {
                protocolMode: ProtocolMode.OIDC,
                knownAuthorities: [Constants.DEFAULT_AUTHORITY],
                cloudDiscoveryMetadata: "",
                authorityMetadata: ""
            }
            authority = new Authority(authorityUrl, networkInterface, mockStorage, options);
            sinon.stub(networkInterface, <any>"sendGetRequestAsync").callsFake((openIdConfigEndpoint) => {
                endpoint = openIdConfigEndpoint;
                return DEFAULT_OPENID_CONFIG_RESPONSE;
            });

            await authority.resolveEndpointsAsync();
            expect(endpoint).to.equal(`${authorityUrl}.well-known/openid-configuration`);
        })
    });
});
