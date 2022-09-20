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
import { MockStorageClass, mockCrypto } from "../client/ClientTestUtils";
import { ClientAuthErrorMessage, ClientAuthError } from "../../src/error/ClientAuthError";
import { AuthorityOptions } from "../../src/authority/AuthorityOptions";
import { ProtocolMode } from "../../src/authority/ProtocolMode";
import { AuthorityMetadataEntity } from "../../src/cache/entities/AuthorityMetadataEntity";
import { OpenIdConfigResponse } from "../../src/authority/OpenIdConfigResponse";

let mockStorage: MockStorageClass;

const authorityOptions: AuthorityOptions = {
    protocolMode: ProtocolMode.AAD,
    knownAuthorities: [Constants.DEFAULT_AUTHORITY_HOST],
    cloudDiscoveryMetadata: "",
    authorityMetadata: "",
    skipAuthorityMetadataCache: true,
}

describe("Authority.ts Class Unit Tests", () => {
    beforeEach(() => {
        mockStorage = new MockStorageClass(TEST_CONFIG.MSAL_CLIENT_ID, mockCrypto);
    });
    afterEach(() => {
        jest.restoreAllMocks();
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
            expect(authority.canonicalAuthority).toBe(`${Constants.DEFAULT_AUTHORITY}`);
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

            expect(() => new Authority("http://login.microsoftonline.com/common", networkInterface, mockStorage, authorityOptions)).toThrowError(ClientConfigurationErrorMessage.authorityUriInsecure.desc);
            expect(() => new Authority("This is not a URI", networkInterface, mockStorage, authorityOptions)).toThrowError(ClientConfigurationErrorMessage.urlParseError.desc);
            expect(() => new Authority("", networkInterface, mockStorage, authorityOptions)).toThrowError(ClientConfigurationErrorMessage.urlEmptyError.desc);
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
            expect(authority.canonicalAuthority.endsWith("/")).toBe(true);
            expect(authority.canonicalAuthority).toBe(`${Constants.DEFAULT_AUTHORITY}`);
        });

        it("Set canonical authority performs validation and canonicalization on url", () => {
            expect(() => authority.canonicalAuthority = "http://login.microsoftonline.com/common").toThrowError(ClientConfigurationErrorMessage.authorityUriInsecure.desc);
            expect(() => authority.canonicalAuthority = "https://login.microsoftonline.com/").not.toThrowError();
            expect(() => authority.canonicalAuthority = "This is not a URI").toThrowError(ClientConfigurationErrorMessage.urlParseError.desc);

            authority.canonicalAuthority = `${TEST_URIS.ALTERNATE_INSTANCE}/${RANDOM_TEST_GUID}`;
            expect(authority.canonicalAuthority.endsWith("/")).toBe(true);
            expect(authority.canonicalAuthority).toBe(`${TEST_URIS.ALTERNATE_INSTANCE}/${RANDOM_TEST_GUID}/`);
        });

        it("Get canonicalAuthorityUrlComponents returns current url components", () => {
            expect(authority.canonicalAuthorityUrlComponents.Protocol).toBe("https:");
            expect(authority.canonicalAuthorityUrlComponents.HostNameAndPort).toBe("login.microsoftonline.com");
            expect(authority.canonicalAuthorityUrlComponents.PathSegments).toEqual(["common"]);
            expect(authority.canonicalAuthorityUrlComponents.AbsolutePath).toBe("/common/");
            expect(authority.canonicalAuthorityUrlComponents.Hash).toBeUndefined();
            expect(authority.canonicalAuthorityUrlComponents.Search).toBeUndefined();
        });

        it("tenant is equal to first path segment value", () => {
            expect(authority.tenant).toBe("common");
            expect(authority.tenant).toBe(authority.canonicalAuthorityUrlComponents.PathSegments[0]);
        });

        it("Gets options that were passed into constructor", () => {
            expect(authority.options).toBe(authorityOptions);
        });

        describe("OAuth Endpoints", () => {

            beforeEach(async () => {
                jest.spyOn(Authority.prototype, <any>"getEndpointMetadataFromNetwork").mockResolvedValue(DEFAULT_OPENID_CONFIG_RESPONSE.body);
                await authority.resolveEndpointsAsync();
            });

            it("Returns authorization_endpoint of tenantDiscoveryResponse", () => {
                expect(authority.authorizationEndpoint).toBe(
                    DEFAULT_OPENID_CONFIG_RESPONSE.body.authorization_endpoint.replace("{tenant}", "common")
                );
            });

            it("Returns token_endpoint of tenantDiscoveryResponse", () => {
                expect(authority.tokenEndpoint).toBe(
                    DEFAULT_OPENID_CONFIG_RESPONSE.body.token_endpoint.replace("{tenant}", "common")
                );
            });

            it("Returns end_session_endpoint of tenantDiscoveryResponse", () => {
                expect(authority.endSessionEndpoint).toBe(
                    DEFAULT_OPENID_CONFIG_RESPONSE.body.end_session_endpoint.replace("{tenant}", "common")
                );
            });

            it("Returns issuer of tenantDiscoveryResponse for selfSignedJwtAudience", () => {
                expect(authority.selfSignedJwtAudience).toBe(DEFAULT_OPENID_CONFIG_RESPONSE.body.issuer.replace("{tenant}", "common"));
            });

            it("Returns jwks_uri of tenantDiscoveryResponse", () => {
                expect(authority.jwksUri).toBe(
                    DEFAULT_OPENID_CONFIG_RESPONSE.body.jwks_uri.replace("{tenant}", "common")
                );
            });

            it("Throws error if endpoint discovery is incomplete for authorizationEndpoint, tokenEndpoint, endSessionEndpoint and selfSignedJwtAudience", () => {
                authority = new Authority(Constants.DEFAULT_AUTHORITY, networkInterface, mockStorage, authorityOptions);
                expect(() => authority.authorizationEndpoint).toThrowError(ClientAuthErrorMessage.endpointResolutionError.desc);
                expect(() => authority.tokenEndpoint).toThrowError(ClientAuthErrorMessage.endpointResolutionError.desc);
                expect(() => authority.endSessionEndpoint).toThrowError(ClientAuthErrorMessage.endpointResolutionError.desc);
                expect(() => authority.deviceCodeEndpoint).toThrowError(ClientAuthErrorMessage.endpointResolutionError.desc);
                expect(() => authority.selfSignedJwtAudience).toThrowError(ClientAuthErrorMessage.endpointResolutionError.desc);
                expect(() => authority.jwksUri).toThrowError(ClientAuthErrorMessage.endpointResolutionError.desc);
            });

            it("Returns endpoints for different b2c policy than what is cached", async () => {
                jest.clearAllMocks();
                const signInPolicy = "b2c_1_sisopolicy";
                const resetPolicy = "b2c_1_password_reset";
                const baseAuthority = "https://login.microsoftonline.com/tfp/msidlabb2c.onmicrosoft.com/";
                jest.spyOn(Authority.prototype, <any>"getEndpointMetadataFromNetwork").mockResolvedValue(B2C_OPENID_CONFIG_RESPONSE.body);

                authority = new Authority(`${baseAuthority}${signInPolicy}`, networkInterface, mockStorage, authorityOptions);
                await authority.resolveEndpointsAsync();
                const secondAuthority = new Authority(`${baseAuthority}${resetPolicy}`, networkInterface, mockStorage, authorityOptions);
                await secondAuthority.resolveEndpointsAsync();

                expect(authority.authorizationEndpoint).toBe(B2C_OPENID_CONFIG_RESPONSE.body.authorization_endpoint);
                expect(secondAuthority.authorizationEndpoint).toBe(
                    B2C_OPENID_CONFIG_RESPONSE.body.authorization_endpoint.replace(signInPolicy, resetPolicy)
                );
                expect(authority.tokenEndpoint).toBe(B2C_OPENID_CONFIG_RESPONSE.body.token_endpoint);
                expect(secondAuthority.tokenEndpoint).toBe(
                    B2C_OPENID_CONFIG_RESPONSE.body.token_endpoint.replace(signInPolicy, resetPolicy)
                );
                expect(authority.endSessionEndpoint).toBe(B2C_OPENID_CONFIG_RESPONSE.body.end_session_endpoint);
                expect(secondAuthority.endSessionEndpoint).toBe(
                    B2C_OPENID_CONFIG_RESPONSE.body.end_session_endpoint.replace(signInPolicy, resetPolicy)
                );
            });
        });
    });

    describe("Regional authorities", () => {
        const networkInterface: INetworkModule = {
            sendGetRequestAsync<T>(url: string, options?: NetworkRequestOptions): T {
                return {} as T;
            },
            sendPostRequestAsync<T>(url: string, options?: NetworkRequestOptions): T {
                return {} as T;
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

                expect(authority.discoveryComplete()).toBe(true);
                expect(authority.authorizationEndpoint).toEqual(`${deepCopyOpenIdResponse.body.authorization_endpoint.replace("{tenant}", "common").replace("login.microsoftonline.com", "westus2.login.microsoft.com")}/`);
                expect(authority.tokenEndpoint).toEqual(`${deepCopyOpenIdResponse.body.token_endpoint.replace("{tenant}", "common").replace("login.microsoftonline.com", "westus2.login.microsoft.com")}/?allowestsrnonmsi=true`);
                expect(authority.endSessionEndpoint).toEqual(`${deepCopyOpenIdResponse.body.end_session_endpoint.replace("{tenant}", "common").replace("login.microsoftonline.com", "westus2.login.microsoft.com")}/`);
        });

        it("region provided by the user overrides the region auto-discovered", async () => {
                const deepCopyOpenIdResponse = JSON.parse(JSON.stringify(DEFAULT_OPENID_CONFIG_RESPONSE));
                networkInterface.sendGetRequestAsync = (url: string, options?: NetworkRequestOptions): any => {
                    return JSON.parse(JSON.stringify(DEFAULT_OPENID_CONFIG_RESPONSE));
                };

                const authority = new Authority(Constants.DEFAULT_AUTHORITY, networkInterface, mockStorage, {...authorityOptions, azureRegionConfiguration: { azureRegion: "westus2", environmentRegion: "centralus" }});
                await authority.resolveEndpointsAsync();

                expect(authority.discoveryComplete()).toBe(true);
                expect(authority.authorizationEndpoint).toEqual(`${deepCopyOpenIdResponse.body.authorization_endpoint.replace("{tenant}", "common").replace("login.microsoftonline.com", "westus2.login.microsoft.com")}/`);
                expect(authority.tokenEndpoint).toEqual(`${deepCopyOpenIdResponse.body.token_endpoint.replace("{tenant}", "common").replace("login.microsoftonline.com", "westus2.login.microsoft.com")}/?allowestsrnonmsi=true`);
                expect(authority.endSessionEndpoint).toEqual(`${deepCopyOpenIdResponse.body.end_session_endpoint.replace("{tenant}", "common").replace("login.microsoftonline.com", "westus2.login.microsoft.com")}/`);
        });

        it("auto discovered region only used when the user provides the AUTO_DISCOVER flag", async () => {
                const deepCopyOpenIdResponse = JSON.parse(JSON.stringify(DEFAULT_OPENID_CONFIG_RESPONSE));
                networkInterface.sendGetRequestAsync = (url: string, options?: NetworkRequestOptions): any => {
                    return JSON.parse(JSON.stringify(DEFAULT_OPENID_CONFIG_RESPONSE));
                };

                const authority = new Authority(Constants.DEFAULT_AUTHORITY, networkInterface, mockStorage, {...authorityOptions, azureRegionConfiguration: { azureRegion: Constants.AZURE_REGION_AUTO_DISCOVER_FLAG, environmentRegion: "centralus" }});
                await authority.resolveEndpointsAsync();

                expect(authority.discoveryComplete()).toBe(true);
                expect(authority.authorizationEndpoint).toEqual(`${deepCopyOpenIdResponse.body.authorization_endpoint.replace("{tenant}", "common").replace("login.microsoftonline.com", "centralus.login.microsoft.com")}/`);
                expect(authority.tokenEndpoint).toEqual(`${deepCopyOpenIdResponse.body.token_endpoint.replace("{tenant}", "common").replace("login.microsoftonline.com", "centralus.login.microsoft.com")}/?allowestsrnonmsi=true`);
                expect(authority.endSessionEndpoint).toEqual(`${deepCopyOpenIdResponse.body.end_session_endpoint.replace("{tenant}", "common").replace("login.microsoftonline.com", "centralus.login.microsoft.com")}/`);
        });

        it("fallbacks to the global endpoint when the user provides the AUTO_DISCOVER flag but no region is detected", async () => {
                const deepCopyOpenIdResponse = JSON.parse(JSON.stringify(DEFAULT_OPENID_CONFIG_RESPONSE));
                networkInterface.sendGetRequestAsync = (url: string, options?: NetworkRequestOptions): any => {
                    return JSON.parse(JSON.stringify(DEFAULT_OPENID_CONFIG_RESPONSE));
                };

                const authority = new Authority(Constants.DEFAULT_AUTHORITY, networkInterface, mockStorage, {...authorityOptions, azureRegionConfiguration: { azureRegion: Constants.AZURE_REGION_AUTO_DISCOVER_FLAG, environmentRegion: undefined }});
                await authority.resolveEndpointsAsync();

                expect(authority.discoveryComplete()).toBe(true);
                expect(authority.authorizationEndpoint).toEqual(deepCopyOpenIdResponse.body.authorization_endpoint.replace("{tenant}", "common"));
                expect(authority.tokenEndpoint).toEqual(deepCopyOpenIdResponse.body.token_endpoint.replace("{tenant}", "common"));
                expect(authority.endSessionEndpoint).toEqual(deepCopyOpenIdResponse.body.end_session_endpoint.replace("{tenant}", "common"));
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
            expect(authority.discoveryComplete()).toBe(false);
        });

        it("discoveryComplete returns true if resolveEndpointsAsync resolves successfully", async () => {
            jest.spyOn(Authority.prototype, <any>"getEndpointMetadataFromNetwork").mockResolvedValue(DEFAULT_OPENID_CONFIG_RESPONSE.body);
            await authority.resolveEndpointsAsync();
            expect(authority.discoveryComplete()).toBe(true);
        });

        it("discoveryComplete returns true if resolveEndpointsAsync resolves successfully without end_session_endpoint", async () => {
            const metadata: OpenIdConfigResponse = {
                authorization_endpoint: DEFAULT_OPENID_CONFIG_RESPONSE.body.authorization_endpoint,
                issuer: DEFAULT_OPENID_CONFIG_RESPONSE.body.issuer,
                token_endpoint: DEFAULT_OPENID_CONFIG_RESPONSE.body.token_endpoint,
                jwks_uri: DEFAULT_OPENID_CONFIG_RESPONSE.body.jwks_uri
            }
            networkInterface.sendGetRequestAsync = (url: string, options?: NetworkRequestOptions): any => {
                return {
                    body: metadata
                };
            };
            await authority.resolveEndpointsAsync();
            expect(authority.discoveryComplete()).toBe(true);
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
    
                expect(authority.discoveryComplete()).toBe(true);
                expect(authority.authorizationEndpoint).toBe(
                    DEFAULT_OPENID_CONFIG_RESPONSE.body.authorization_endpoint.replace("{tenant}", "common")
                );
                expect(authority.tokenEndpoint).toBe(
                    DEFAULT_OPENID_CONFIG_RESPONSE.body.token_endpoint.replace("{tenant}", "common")
                );
                expect(authority.deviceCodeEndpoint).toBe(authority.tokenEndpoint.replace("/token", "/devicecode"));
                expect(authority.endSessionEndpoint).toBe(
                    DEFAULT_OPENID_CONFIG_RESPONSE.body.end_session_endpoint.replace("{tenant}", "common")
                );
                expect(authority.selfSignedJwtAudience).toBe(DEFAULT_OPENID_CONFIG_RESPONSE.body.issuer.replace("{tenant}", "common"));

                // Test that the metadata is cached
                const key = `authority-metadata-${TEST_CONFIG.MSAL_CLIENT_ID}-${Constants.DEFAULT_AUTHORITY_HOST}`;
                const cachedAuthorityMetadata = mockStorage.getAuthorityMetadata(key);
                if (!cachedAuthorityMetadata) {
                    throw Error("Cached AuthorityMetadata should not be null!");
                } else {
                    expect(cachedAuthorityMetadata.authorization_endpoint).toBe(DEFAULT_OPENID_CONFIG_RESPONSE.body.authorization_endpoint);
                    expect(cachedAuthorityMetadata.token_endpoint).toBe(DEFAULT_OPENID_CONFIG_RESPONSE.body.token_endpoint);
                    expect(cachedAuthorityMetadata.end_session_endpoint).toBe(DEFAULT_OPENID_CONFIG_RESPONSE.body.end_session_endpoint);
                    expect(cachedAuthorityMetadata.issuer).toBe(DEFAULT_OPENID_CONFIG_RESPONSE.body.issuer);
                    expect(cachedAuthorityMetadata.jwks_uri).toBe(DEFAULT_OPENID_CONFIG_RESPONSE.body.jwks_uri);
                    expect(cachedAuthorityMetadata.endpointsFromNetwork).toBe(false);
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
                    expect(e).toBeInstanceOf(ClientConfigurationError);
                    expect(e.errorMessage).toBe(ClientConfigurationErrorMessage.invalidAuthorityMetadata.desc);
                    done();
                });
            });

            it("Throws error if authority does not containn end_session_endpoint but calls logout", async () => {
                const authorityJson = {
                    ...DEFAULT_OPENID_CONFIG_RESPONSE.body,
                    end_session_endpoint: undefined
                }

                const options = {
                    protocolMode: ProtocolMode.AAD,
                    knownAuthorities: [Constants.DEFAULT_AUTHORITY_HOST],
                    cloudDiscoveryMetadata: "",
                    authorityMetadata: JSON.stringify(authorityJson)
                };
                authority = new Authority(Constants.DEFAULT_AUTHORITY, networkInterface, mockStorage, options);
                await authority.resolveEndpointsAsync();

                expect(() => authority.endSessionEndpoint).toThrowError(ClientAuthError.createLogoutNotSupportedError())
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
    
                expect(authority.discoveryComplete()).toBe(true);
                expect(authority.authorizationEndpoint).toBe(
                    DEFAULT_OPENID_CONFIG_RESPONSE.body.authorization_endpoint.replace("{tenant}", "common")
                );
                expect(authority.tokenEndpoint).toBe(
                    DEFAULT_OPENID_CONFIG_RESPONSE.body.token_endpoint.replace("{tenant}", "common")
                );
                expect(authority.deviceCodeEndpoint).toBe(authority.tokenEndpoint.replace("/token", "/devicecode"));
                expect(authority.endSessionEndpoint).toBe(
                    DEFAULT_OPENID_CONFIG_RESPONSE.body.end_session_endpoint.replace("{tenant}", "common")
                );
                expect(authority.selfSignedJwtAudience).toBe(DEFAULT_OPENID_CONFIG_RESPONSE.body.issuer.replace("{tenant}", "common"));

                // Test that the metadata is cached
                const cachedAuthorityMetadata = mockStorage.getAuthorityMetadata(key);
                if (!cachedAuthorityMetadata) {
                    throw Error("Cached AuthorityMetadata should not be null!");
                } else {
                    expect(cachedAuthorityMetadata.authorization_endpoint).toBe(DEFAULT_OPENID_CONFIG_RESPONSE.body.authorization_endpoint);
                    expect(cachedAuthorityMetadata.token_endpoint).toBe(DEFAULT_OPENID_CONFIG_RESPONSE.body.token_endpoint);
                    expect(cachedAuthorityMetadata.end_session_endpoint).toBe(DEFAULT_OPENID_CONFIG_RESPONSE.body.end_session_endpoint);
                    expect(cachedAuthorityMetadata.issuer).toBe(DEFAULT_OPENID_CONFIG_RESPONSE.body.issuer);
                    expect(cachedAuthorityMetadata.jwks_uri).toBe(DEFAULT_OPENID_CONFIG_RESPONSE.body.jwks_uri);
                    expect(cachedAuthorityMetadata.endpointsFromNetwork).toBe(true);
                }
            });

            it("Gets endpoints from network if cached metadata is expired", async () => {
                const key = `authority-metadata-${TEST_CONFIG.MSAL_CLIENT_ID}-${Constants.DEFAULT_AUTHORITY_HOST}`;
                const value = new AuthorityMetadataEntity();
                value.updateCloudDiscoveryMetadata(DEFAULT_TENANT_DISCOVERY_RESPONSE.body.metadata[0], true);
                value.updateEndpointMetadata(DEFAULT_OPENID_CONFIG_RESPONSE.body, true);
                value.updateCanonicalAuthority(Constants.DEFAULT_AUTHORITY);
                mockStorage.setAuthorityMetadata(key, value);

                jest.spyOn(AuthorityMetadataEntity.prototype, "isExpired").mockReturnValue(true);

                networkInterface.sendGetRequestAsync = (url: string, options?: NetworkRequestOptions): any => {
                    return DEFAULT_OPENID_CONFIG_RESPONSE;
                };
                authority = new Authority(Constants.DEFAULT_AUTHORITY, networkInterface, mockStorage, authorityOptions);
                await authority.resolveEndpointsAsync();
    
                expect(authority.discoveryComplete()).toBe(true);
                expect(authority.authorizationEndpoint).toBe(
                    DEFAULT_OPENID_CONFIG_RESPONSE.body.authorization_endpoint.replace("{tenant}", "common")
                );
                expect(authority.tokenEndpoint).toBe(
                    DEFAULT_OPENID_CONFIG_RESPONSE.body.token_endpoint.replace("{tenant}", "common")
                );
                expect(authority.deviceCodeEndpoint).toBe(authority.tokenEndpoint.replace("/token", "/devicecode"));
                expect(authority.endSessionEndpoint).toBe(
                    DEFAULT_OPENID_CONFIG_RESPONSE.body.end_session_endpoint.replace("{tenant}", "common")
                );
                expect(authority.selfSignedJwtAudience).toBe(DEFAULT_OPENID_CONFIG_RESPONSE.body.issuer.replace("{tenant}", "common"));

                // Test that the metadata is cached
                const cachedAuthorityMetadata = mockStorage.getAuthorityMetadata(key);
                if (!cachedAuthorityMetadata) {
                    throw Error("Cached AuthorityMetadata should not be null!");
                } else {
                    expect(cachedAuthorityMetadata.authorization_endpoint).toBe(DEFAULT_OPENID_CONFIG_RESPONSE.body.authorization_endpoint);
                    expect(cachedAuthorityMetadata.token_endpoint).toBe(DEFAULT_OPENID_CONFIG_RESPONSE.body.token_endpoint);
                    expect(cachedAuthorityMetadata.end_session_endpoint).toBe(DEFAULT_OPENID_CONFIG_RESPONSE.body.end_session_endpoint);
                    expect(cachedAuthorityMetadata.issuer).toBe(DEFAULT_OPENID_CONFIG_RESPONSE.body.issuer);
                    expect(cachedAuthorityMetadata.jwks_uri).toBe(DEFAULT_OPENID_CONFIG_RESPONSE.body.jwks_uri);
                    expect(cachedAuthorityMetadata.endpointsFromNetwork).toBe(true);
                }
            });

            it("Gets endpoints from network", async () => {
                networkInterface.sendGetRequestAsync = (url: string, options?: NetworkRequestOptions): any => {
                    return DEFAULT_OPENID_CONFIG_RESPONSE;
                };
                authority = new Authority(Constants.DEFAULT_AUTHORITY, networkInterface, mockStorage, authorityOptions);
                await authority.resolveEndpointsAsync();
    
                expect(authority.discoveryComplete()).toBe(true);
                expect(authority.authorizationEndpoint).toBe(
                    DEFAULT_OPENID_CONFIG_RESPONSE.body.authorization_endpoint.replace("{tenant}", "common")
                );
                expect(authority.tokenEndpoint).toBe(
                    DEFAULT_OPENID_CONFIG_RESPONSE.body.token_endpoint.replace("{tenant}", "common")
                );
                expect(authority.deviceCodeEndpoint).toBe(authority.tokenEndpoint.replace("/token", "/devicecode"));
                expect(authority.endSessionEndpoint).toBe(
                    DEFAULT_OPENID_CONFIG_RESPONSE.body.end_session_endpoint.replace("{tenant}", "common")
                );
                expect(authority.selfSignedJwtAudience).toBe(DEFAULT_OPENID_CONFIG_RESPONSE.body.issuer.replace("{tenant}", "common"));

                // Test that the metadata is cached
                const key = `authority-metadata-${TEST_CONFIG.MSAL_CLIENT_ID}-${Constants.DEFAULT_AUTHORITY_HOST}`;
                const cachedAuthorityMetadata = mockStorage.getAuthorityMetadata(key);
                if (!cachedAuthorityMetadata) {
                    throw Error("Cached AuthorityMetadata should not be null!");
                } else {
                    expect(cachedAuthorityMetadata.authorization_endpoint).toBe(DEFAULT_OPENID_CONFIG_RESPONSE.body.authorization_endpoint);
                    expect(cachedAuthorityMetadata.token_endpoint).toBe(DEFAULT_OPENID_CONFIG_RESPONSE.body.token_endpoint);
                    expect(cachedAuthorityMetadata.end_session_endpoint).toBe(DEFAULT_OPENID_CONFIG_RESPONSE.body.end_session_endpoint);
                    expect(cachedAuthorityMetadata.issuer).toBe(DEFAULT_OPENID_CONFIG_RESPONSE.body.issuer);
                    expect(cachedAuthorityMetadata.jwks_uri).toBe(DEFAULT_OPENID_CONFIG_RESPONSE.body.jwks_uri);
                    expect(cachedAuthorityMetadata.endpointsFromNetwork).toBe(true);
                }
            });

            it("Gets endpoints from hardcoded values", async () => {
                const customAuthorityOptions: AuthorityOptions = {
                    protocolMode: ProtocolMode.AAD,
                    knownAuthorities: [Constants.DEFAULT_AUTHORITY_HOST],
                    cloudDiscoveryMetadata: "",
                    authorityMetadata: "",
                    skipAuthorityMetadataCache: false,
                };

                networkInterface.sendGetRequestAsync = (url: string, options?: NetworkRequestOptions): any => {
                    return null;
                };

                authority = new Authority(Constants.DEFAULT_AUTHORITY, networkInterface, mockStorage, customAuthorityOptions);
                await authority.resolveEndpointsAsync();

                expect(authority.discoveryComplete()).toBe(true);
                expect(authority.authorizationEndpoint).toBe(
                    DEFAULT_OPENID_CONFIG_RESPONSE.body.authorization_endpoint.replace("{tenant}", "common")
                );
                expect(authority.tokenEndpoint).toBe(
                    DEFAULT_OPENID_CONFIG_RESPONSE.body.token_endpoint.replace("{tenant}", "common")
                );
                expect(authority.deviceCodeEndpoint).toBe(authority.tokenEndpoint.replace("/token", "/devicecode"));
                expect(authority.endSessionEndpoint).toBe(
                    DEFAULT_OPENID_CONFIG_RESPONSE.body.end_session_endpoint.replace("{tenant}", "common")
                );
                expect(authority.selfSignedJwtAudience).toBe(DEFAULT_OPENID_CONFIG_RESPONSE.body.issuer.replace("{tenant}", "common"));

                // Test that the metadata is cached
                const key = `authority-metadata-${TEST_CONFIG.MSAL_CLIENT_ID}-${Constants.DEFAULT_AUTHORITY_HOST}`;
                const cachedAuthorityMetadata = mockStorage.getAuthorityMetadata(key);
                if (!cachedAuthorityMetadata) {
                    throw Error("Cached AuthorityMetadata should not be null!");
                } else {
                    expect(cachedAuthorityMetadata.authorization_endpoint).toBe(DEFAULT_OPENID_CONFIG_RESPONSE.body.authorization_endpoint.replace("{tenant}", "common"));
                    expect(cachedAuthorityMetadata.token_endpoint).toBe(DEFAULT_OPENID_CONFIG_RESPONSE.body.token_endpoint.replace("{tenant}", "common"));
                    expect(cachedAuthorityMetadata.end_session_endpoint).toBe( DEFAULT_OPENID_CONFIG_RESPONSE.body.end_session_endpoint.replace("{tenant}", "common"));
                    expect(cachedAuthorityMetadata.issuer).toBe(DEFAULT_OPENID_CONFIG_RESPONSE.body.issuer.replace("{tenant}", "{tenantid}"));
                    expect(cachedAuthorityMetadata.jwks_uri).toBe(DEFAULT_OPENID_CONFIG_RESPONSE.body.jwks_uri.replace("{tenant}", "common"));
                    expect(cachedAuthorityMetadata.endpointsFromNetwork).toBe(false);
                }
            });

            it("Gets endpoints from hardcoded values with regional information", async () => {
                const customAuthorityOptions: AuthorityOptions = {
                    protocolMode: ProtocolMode.AAD,
                    knownAuthorities: [Constants.DEFAULT_AUTHORITY_HOST],
                    cloudDiscoveryMetadata: "",
                    authorityMetadata: "",
                    skipAuthorityMetadataCache: false,
                    azureRegionConfiguration: {
                        azureRegion: "westus2",
                        environmentRegion: undefined
                    }
                };

                const expectedHardcodedRegionalValues = {
                    "authorization_endpoint": "https://westus2.login.microsoft.com/common/oauth2/v2.0/authorize/", 
                    "canonical_authority": "https://login.microsoftonline.com/common/", 
                    "end_session_endpoint": "https://westus2.login.microsoft.com/common/oauth2/v2.0/logout/", 
                    "endpointsFromNetwork": false, 
                    "issuer": "https://login.microsoftonline.com/{tenantid}/v2.0", 
                    "jwks_uri": "https://login.microsoftonline.com/common/discovery/v2.0/keys",
                    "token_endpoint": "https://westus2.login.microsoft.com/common/oauth2/v2.0/token/?allowestsrnonmsi=true"
                };

                networkInterface.sendGetRequestAsync = (url: string, options?: NetworkRequestOptions): any => {
                    return null;
                };

                authority = new Authority(Constants.DEFAULT_AUTHORITY, networkInterface, mockStorage, customAuthorityOptions);
                await authority.resolveEndpointsAsync();

                expect(authority.discoveryComplete()).toBe(true);
                expect(authority.authorizationEndpoint).toBe(
                    expectedHardcodedRegionalValues.authorization_endpoint
                );
                expect(authority.tokenEndpoint).toBe(
                    expectedHardcodedRegionalValues.token_endpoint
                );
                expect(authority.deviceCodeEndpoint).toBe(expectedHardcodedRegionalValues.token_endpoint.replace("/token", "/devicecode"));
                expect(authority.endSessionEndpoint).toBe(
                    expectedHardcodedRegionalValues.end_session_endpoint
                );
                expect(authority.selfSignedJwtAudience).toBe(expectedHardcodedRegionalValues.issuer.replace("{tenantid}", "common"));

                // Test that the metadata is cached
                const key = `authority-metadata-${TEST_CONFIG.MSAL_CLIENT_ID}-${Constants.DEFAULT_AUTHORITY_HOST}`;
                const cachedAuthorityMetadata = mockStorage.getAuthorityMetadata(key);
                if (!cachedAuthorityMetadata) {
                    throw Error("Cached AuthorityMetadata should not be null!");
                } else {
                    expect(cachedAuthorityMetadata.authorization_endpoint).toBe(expectedHardcodedRegionalValues.authorization_endpoint);
                    expect(cachedAuthorityMetadata.token_endpoint).toBe(expectedHardcodedRegionalValues.token_endpoint);
                    expect(cachedAuthorityMetadata.end_session_endpoint).toBe(expectedHardcodedRegionalValues.end_session_endpoint);
                    expect(cachedAuthorityMetadata.issuer).toBe(expectedHardcodedRegionalValues.issuer);
                    expect(cachedAuthorityMetadata.jwks_uri).toBe(expectedHardcodedRegionalValues.jwks_uri);
                    expect(cachedAuthorityMetadata.endpointsFromNetwork).toBe(false);
                }
            });

            it("Throws error if openid-configuration network call fails", (done) => {
                networkInterface.sendGetRequestAsync = (url: string, options?: NetworkRequestOptions): any => {
                    throw Error("Unable to reach endpoint");
                };
                authority = new Authority(Constants.DEFAULT_AUTHORITY, networkInterface, mockStorage, authorityOptions);
                authority.resolveEndpointsAsync().catch(e => {
                    expect(e).toBeInstanceOf(ClientAuthError);
                    expect(e.errorMessage.includes(ClientAuthErrorMessage.unableToGetOpenidConfigError.desc)).toBe(true);
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
                expect(authority.isAlias(Constants.DEFAULT_AUTHORITY_HOST)).toBe(true);
                expect(authority.getPreferredCache()).toBe(Constants.DEFAULT_AUTHORITY_HOST);
                expect(authority.canonicalAuthority.includes(Constants.DEFAULT_AUTHORITY_HOST)).toBe(true);

                // Test that the metadata is cached
                const key = `authority-metadata-${TEST_CONFIG.MSAL_CLIENT_ID}-${Constants.DEFAULT_AUTHORITY_HOST}`;
                const cachedAuthorityMetadata = mockStorage.getAuthorityMetadata(key);
                if (!cachedAuthorityMetadata) {
                    throw Error("Cached AuthorityMetadata should not be null!");
                } else {
                    expect(cachedAuthorityMetadata.aliases).toContain(Constants.DEFAULT_AUTHORITY_HOST);
                    expect(cachedAuthorityMetadata.preferred_cache).toBe(Constants.DEFAULT_AUTHORITY_HOST);
                    expect(cachedAuthorityMetadata.preferred_network).toBe(Constants.DEFAULT_AUTHORITY_HOST);
                    expect(cachedAuthorityMetadata.aliasesFromNetwork).toBe(false);
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
                expect(authority.isAlias("login.microsoftonline.com")).toBe(true);
                expect(authority.isAlias("login.windows.net")).toBe(true);
                expect(authority.isAlias("sts.windows.net")).toBe(true);
                expect(authority.getPreferredCache()).toBe("sts.windows.net");
                expect(authority.canonicalAuthority.includes("login.windows.net")).toBe(true);

                // Test that the metadata is cached
                const key = `authority-metadata-${TEST_CONFIG.MSAL_CLIENT_ID}-sts.windows.net`;
                const cachedAuthorityMetadata = mockStorage.getAuthorityMetadata(key);
                if (!cachedAuthorityMetadata) {
                    throw Error("Cached AuthorityMetadata should not be null!");
                } else {
                    expect(cachedAuthorityMetadata.aliases).toContain("login.microsoftonline.com");
                    expect(cachedAuthorityMetadata.aliases).toContain("login.windows.net");
                    expect(cachedAuthorityMetadata.aliases).toContain("sts.windows.net");
                    expect(cachedAuthorityMetadata.preferred_cache).toBe("sts.windows.net");
                    expect(cachedAuthorityMetadata.preferred_network).toBe("login.windows.net");
                    expect(cachedAuthorityMetadata.aliasesFromNetwork).toBe(false);
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
                jest.spyOn(Authority.prototype, <any>"updateEndpointMetadata").mockResolvedValue("cache");
                authority = new Authority(Constants.DEFAULT_AUTHORITY, networkInterface, mockStorage, authorityOptions);
    
                await authority.resolveEndpointsAsync();
                expect(authority.isAlias("login.microsoftonline.com")).toBe(true);
                expect(authority.isAlias("login.windows.net")).toBe(true);
                expect(authority.isAlias("sts.windows.net")).toBe(true);
                expect(authority.getPreferredCache()).toBe("sts.windows.net");
                expect(authority.canonicalAuthority.includes("login.windows.net")).toBe(true);

                // Test that the metadata is cached
                const cachedAuthorityMetadata = mockStorage.getAuthorityMetadata(key);
                if (!cachedAuthorityMetadata) {
                    throw Error("Cached AuthorityMetadata should not be null!");
                } else {
                    expect(cachedAuthorityMetadata.aliases).toContain("login.microsoftonline.com");
                    expect(cachedAuthorityMetadata.aliases).toContain("login.windows.net");
                    expect(cachedAuthorityMetadata.aliases).toContain("sts.windows.net");
                    expect(cachedAuthorityMetadata.preferred_cache).toBe("sts.windows.net");
                    expect(cachedAuthorityMetadata.preferred_network).toBe("login.windows.net");
                    expect(cachedAuthorityMetadata.aliasesFromNetwork).toBe(true);
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
                jest.spyOn(AuthorityMetadataEntity.prototype, "isExpired").mockReturnValue(true);
                jest.spyOn(Authority.prototype, <any>"updateEndpointMetadata").mockResolvedValue("cache");

                networkInterface.sendGetRequestAsync = (url: string, options?: NetworkRequestOptions): any => {
                    return DEFAULT_TENANT_DISCOVERY_RESPONSE;
                };
                authority = new Authority(Constants.DEFAULT_AUTHORITY, networkInterface, mockStorage, authorityOptions);
    
                await authority.resolveEndpointsAsync();
                expect(authority.isAlias("login.microsoftonline.com")).toBe(true);
                expect(authority.isAlias("login.windows.net")).toBe(true);
                expect(authority.isAlias("sts.windows.net")).toBe(true);
                expect(authority.getPreferredCache()).toBe("sts.windows.net");
                expect(authority.canonicalAuthority.includes("login.windows.net")).toBe(true);

                // Test that the metadata is cached
                const cachedAuthorityMetadata = mockStorage.getAuthorityMetadata(key);
                if (!cachedAuthorityMetadata) {
                    throw Error("Cached AuthorityMetadata should not be null!");
                } else {
                    expect(cachedAuthorityMetadata.aliases).toContain("login.microsoftonline.com");
                    expect(cachedAuthorityMetadata.aliases).toContain("login.windows.net");
                    expect(cachedAuthorityMetadata.aliases).toContain("sts.windows.net");
                    expect(cachedAuthorityMetadata.preferred_cache).toBe("sts.windows.net");
                    expect(cachedAuthorityMetadata.preferred_network).toBe("login.windows.net");
                    expect(cachedAuthorityMetadata.aliasesFromNetwork).toBe(true);
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
                jest.spyOn(Authority.prototype, <any>"updateEndpointMetadata").mockResolvedValue("cache");
                authority = new Authority(Constants.DEFAULT_AUTHORITY, networkInterface, mockStorage, authorityOptions);
    
                await authority.resolveEndpointsAsync();
                expect(authority.isAlias("login.microsoftonline.com")).toBe(true);
                expect(authority.isAlias("login.windows.net")).toBe(true);
                expect(authority.isAlias("sts.windows.net")).toBe(true);
                expect(authority.getPreferredCache()).toBe("sts.windows.net");
                expect(authority.canonicalAuthority.includes("login.windows.net")).toBe(true);

                // Test that the metadata is cached
                const key = `authority-metadata-${TEST_CONFIG.MSAL_CLIENT_ID}-sts.windows.net`;
                const cachedAuthorityMetadata = mockStorage.getAuthorityMetadata(key);
                if (!cachedAuthorityMetadata) {
                    throw Error("Cached AuthorityMetadata should not be null!");
                } else {
                    expect(cachedAuthorityMetadata.aliases).toContain("login.microsoftonline.com");
                    expect(cachedAuthorityMetadata.aliases).toContain("login.windows.net");
                    expect(cachedAuthorityMetadata.aliases).toContain("sts.windows.net");
                    expect(cachedAuthorityMetadata.preferred_cache).toBe("sts.windows.net");
                    expect(cachedAuthorityMetadata.preferred_network).toBe("login.windows.net");
                    expect(cachedAuthorityMetadata.aliasesFromNetwork).toBe(true);
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
                jest.spyOn(Authority.prototype, <any>"updateEndpointMetadata").mockResolvedValue("cache");
                authority = new Authority("https://custom-domain.microsoft.com", networkInterface, mockStorage, authorityOptions);
    
                await authority.resolveEndpointsAsync();
                expect(authority.isAlias("custom-domain.microsoft.com")).toBe(true);
                expect(authority.getPreferredCache()).toBe("custom-domain.microsoft.com");
                expect(authority.canonicalAuthority.includes("custom-domain.microsoft.com"));

                // Test that the metadata is cached
                const key = `authority-metadata-${TEST_CONFIG.MSAL_CLIENT_ID}-custom-domain.microsoft.com`;
                const cachedAuthorityMetadata = mockStorage.getAuthorityMetadata(key);
                if (!cachedAuthorityMetadata) {
                    throw Error("Cached AuthorityMetadata should not be null!");
                } else {
                    expect(cachedAuthorityMetadata.aliases).toContain("custom-domain.microsoft.com");
                    expect(cachedAuthorityMetadata.preferred_cache).toBe("custom-domain.microsoft.com");
                    expect(cachedAuthorityMetadata.preferred_network).toBe("custom-domain.microsoft.com");
                    expect(cachedAuthorityMetadata.aliasesFromNetwork).toBe(true);
                }
            });

            
            it("Sets metadata from host for DSTS authority", async () => {
                const authorityOptions: AuthorityOptions = {
                    protocolMode: ProtocolMode.AAD,
                    knownAuthorities: ["https://custom-domain.microsoft.com/dstsv2"],
                    cloudDiscoveryMetadata: "",
                    authorityMetadata: ""
                }
                networkInterface.sendGetRequestAsync = (url: string, options?: NetworkRequestOptions): any => {
                    return DEFAULT_TENANT_DISCOVERY_RESPONSE;
                };
                jest.spyOn(Authority.prototype, <any>"updateEndpointMetadata").mockResolvedValue("cache");
                authority = new Authority("https://custom-domain.microsoft.com/dstsv2", networkInterface, mockStorage, authorityOptions);
    
                await authority.resolveEndpointsAsync();
                expect(authority.isAlias("custom-domain.microsoft.com")).toBe(true);
                expect(authority.getPreferredCache()).toBe("custom-domain.microsoft.com");
                expect(authority.canonicalAuthority.includes("custom-domain.microsoft.com"));

                // Test that the metadata is cached
                const key = `authority-metadata-${TEST_CONFIG.MSAL_CLIENT_ID}-custom-domain.microsoft.com`;
                const cachedAuthorityMetadata = mockStorage.getAuthorityMetadata(key);
                if (!cachedAuthorityMetadata) {
                    throw Error("Cached AuthorityMetadata should not be null!");
                } else {
                    expect(cachedAuthorityMetadata.aliases).toContain("custom-domain.microsoft.com");
                    expect(cachedAuthorityMetadata.preferred_cache).toBe("custom-domain.microsoft.com");
                    expect(cachedAuthorityMetadata.preferred_network).toBe("custom-domain.microsoft.com");
                    expect(cachedAuthorityMetadata.aliasesFromNetwork).toBe(false);
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
                    expect(e).toBeInstanceOf(ClientConfigurationError);
                    expect(e.errorMessage).toBe(ClientConfigurationErrorMessage.invalidCloudDiscoveryMetadata.desc);
                    done();
                });
            });

            it("throws untrustedAuthority error if host is not part of knownAuthorities, cloudDiscoveryMetadata and instance discovery network call fails", (done) => {
                const authorityOptions: AuthorityOptions = {
                    protocolMode: ProtocolMode.AAD,
                    knownAuthorities: [],
                    cloudDiscoveryMetadata: "",
                    authorityMetadata: "",
                    skipAuthorityMetadataCache: true
                };
                networkInterface.sendGetRequestAsync = (url: string, options?: NetworkRequestOptions): any => {
                    throw Error("Unable to get response");
                };
                authority = new Authority(Constants.DEFAULT_AUTHORITY, networkInterface, mockStorage, authorityOptions);
    
                authority.resolveEndpointsAsync().catch(e => {
                    expect(e).toBeInstanceOf(ClientConfigurationError);
                    expect(e.errorMessage).toBe(ClientConfigurationErrorMessage.untrustedAuthority.desc);
                    expect(e.errorCode).toBe(ClientConfigurationErrorMessage.untrustedAuthority.code);
                    done();
                });
            });

            it("throws untrustedAuthority error if host is not part of knownAuthorities, cloudDiscoveryMetadata and instance discovery network call doesn't return metadata", (done) => {
                const authorityOptions: AuthorityOptions = {
                    protocolMode: ProtocolMode.AAD,
                    knownAuthorities: [],
                    cloudDiscoveryMetadata: "",
                    authorityMetadata: "",
                    skipAuthorityMetadataCache: true,
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
                    expect(e).toBeInstanceOf(ClientConfigurationError);
                    expect(e.errorMessage).toEqual(ClientConfigurationErrorMessage.untrustedAuthority.desc);
                    expect(e.errorCode).toEqual(ClientConfigurationErrorMessage.untrustedAuthority.code);
                    done();
                });
            });

            it("getPreferredCache throws error if discovery is not complete", () => {
                expect(() => authority.getPreferredCache()).toThrowError(ClientAuthErrorMessage.endpointResolutionError.desc);
            });
        });

        it("ADFS authority uses v1 well-known endpoint", async () => {
            const authorityUrl = "https://login.microsoftonline.com/adfs/"
            let endpoint = "";
            authority = new Authority(authorityUrl, networkInterface, mockStorage, authorityOptions);
            jest.spyOn(networkInterface, <any>"sendGetRequestAsync").mockImplementation((openIdConfigEndpoint) => {
                // @ts-ignore
                endpoint = openIdConfigEndpoint;
                return DEFAULT_OPENID_CONFIG_RESPONSE;
            });

            await authority.resolveEndpointsAsync();
            expect(endpoint).toBe(`${authorityUrl}.well-known/openid-configuration`);
        });

        it("DSTS authority uses v1 well-known endpoint with common y", async () => {
            const authorityUrl = "https://login.microsoftonline.com/dstsv2/common/"
            let endpoint = "";
            authority = new Authority(authorityUrl, networkInterface, mockStorage, authorityOptions);
            jest.spyOn(networkInterface, <any>"sendGetRequestAsync").mockImplementation((openIdConfigEndpoint) => {
                // @ts-ignore
                endpoint = openIdConfigEndpoint;
                return DEFAULT_OPENID_CONFIG_RESPONSE;
            });

            await authority.resolveEndpointsAsync();
            expect(endpoint).toBe(`${authorityUrl}.well-known/openid-configuration`);
        });

        it("DSTS authority uses v1 well-known  with tenanted authority", async () => {
            const authorityUrl = `https://login.microsoftonline.com/dstsv2/${TEST_CONFIG.TENANT}/`
            let endpoint = "";
            authority = new Authority(authorityUrl, networkInterface, mockStorage, authorityOptions);
            jest.spyOn(networkInterface, <any>"sendGetRequestAsync").mockImplementation((openIdConfigEndpoint) => {
                // @ts-ignore
                endpoint = openIdConfigEndpoint;
                return DEFAULT_OPENID_CONFIG_RESPONSE;
            });

            await authority.resolveEndpointsAsync();
            expect(endpoint).toBe(`${authorityUrl}.well-known/openid-configuration`);
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
            jest.spyOn(networkInterface, <any>"sendGetRequestAsync").mockImplementation((openIdConfigEndpoint) => {
                // @ts-ignore
                endpoint = openIdConfigEndpoint;
                return DEFAULT_OPENID_CONFIG_RESPONSE;
            });

            await authority.resolveEndpointsAsync();
            expect(endpoint).toBe(`${authorityUrl}.well-known/openid-configuration`);
        })
    });

    describe("replaceWithRegionalInformation", () => {
        it("replaces authorization_endpoint", () => {
            const originResponse: OpenIdConfigResponse = {
                ...DEFAULT_OPENID_CONFIG_RESPONSE.body,
                end_session_endpoint: undefined
            };

            const regionalResponse = Authority.replaceWithRegionalInformation(originResponse, "westus2");
            expect(regionalResponse.authorization_endpoint).toBe("https://westus2.login.microsoft.com/{tenant}/oauth2/v2.0/authorize/");
        });

        it("doesnt set end_session_endpoint if not included", () => {
            const originResponse: OpenIdConfigResponse = {
                ...DEFAULT_OPENID_CONFIG_RESPONSE.body,
                end_session_endpoint: undefined
            };

            const regionalResponse = Authority.replaceWithRegionalInformation(originResponse, "westus2");
            expect(regionalResponse.end_session_endpoint).toBeUndefined();
        })
    });
});

