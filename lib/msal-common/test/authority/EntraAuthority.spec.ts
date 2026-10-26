/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    Authority,
    getTenantFromAuthorityString,
} from "../../src/authority/Authority.js";
import { AuthorityOptions } from "../../src/authority/AuthorityOptions.js";
import { OpenIdConfigResponse } from "../../src/authority/OpenIdConfigResponse.js";
import { ProtocolMode } from "../../src/authority/ProtocolMode.js";
import { RegionDiscovery } from "../../src/authority/RegionDiscovery.js";
import { RefreshTokenEntity } from "../../src/cache/entities/RefreshTokenEntity.js";
import { Logger } from "../../src/logger/Logger.js";
import { INetworkModule } from "../../src/network/INetworkModule.js";
import { StubPerformanceClient } from "../../src/telemetry/performance/StubPerformanceClient.js";
import { CredentialType } from "../../src/utils/Constants.js";
import { MockStorageClass, mockCrypto } from "../client/ClientTestUtils.js";

const host = "login.microsoftonline.com";
const tenantId = "3338040d-6c67-4c5b-b112-36a304b66dad";
const correlationId = "authority-transformation";
const logger = new Logger({});

function metadata(
    tenant = "common",
    issuerTenant = tenant,
    cloud = host
): OpenIdConfigResponse {
    const base = `https://${cloud}/${tenant}/oauth21/2026-08`;
    return {
        authorization_endpoint: `${base}/authorize`,
        token_endpoint: `${base}/token`,
        end_session_endpoint: `${base}/logout`,
        jwks_uri: `${base}/keys`,
        issuer: `https://${cloud}/${issuerTenant}/oauth21/2026-08`,
    };
}

describe("Entra authority contract", () => {
    let storage: MockStorageClass;
    let get: jest.Mock;
    let post: jest.Mock;
    let network: INetworkModule;

    beforeEach(() => {
        storage = new MockStorageClass(
            "client-id",
            mockCrypto,
            logger,
            new StubPerformanceClient()
        );
        get = jest.fn();
        post = jest.fn();
        network = {
            sendGetRequestAsync: get,
            sendPostRequestAsync: post,
        };
    });

    afterEach(() => jest.restoreAllMocks());

    function authority(
        tenant = "common",
        cloud = host,
        options: Partial<AuthorityOptions> = {}
    ): Authority {
        return new Authority(
            `https://${cloud}/${tenant}/`,
            network,
            storage,
            {
                protocolMode: ProtocolMode.AAD,
                knownAuthorities: [],
                cloudDiscoveryMetadata: "",
                authorityMetadata: "",
                ...options,
            },
            logger,
            correlationId,
            new StubPerformanceClient()
        );
    }

    it.each(["common", "organizations", "client", tenantId])(
        "uses the new contract by default for %s",
        async (tenant) => {
            const instance = authority(tenant);
            await instance.resolveEndpointsAsync();
            expect(instance.authorizationEndpoint).toBe(
                `https://${host}/${tenant}/oauth21/2026-08/authorize`
            );
            expect(instance.tokenEndpoint).toBe(
                `https://${host}/${tenant}/oauth21/2026-08/token`
            );
            expect(instance.deviceCodeEndpoint).toBe(
                `https://${host}/${tenant}/oauth21/2026-08/devicecode`
            );
            expect(instance.endSessionEndpoint).toBe(
                `https://${host}/${tenant}/oauth21/2026-08/logout`
            );
            expect(instance.jwksUri).toBe(
                `https://${host}/${tenant}/oauth21/2026-08/keys`
            );
            expect(instance.selfSignedJwtAudience).toBe(
                `https://${host}/${tenant}/oauth21/2026-08`
            );
            expect(get).not.toHaveBeenCalled();
        }
    );

    it.each([
        ["login.windows.net", host],
        ["sts.windows.net", host],
        ["login.microsoft.com", host],
        ["login.chinacloudapi.cn", "login.partner.microsoftonline.cn"],
        ["login.usgovcloudapi.net", "login.microsoftonline.us"],
        ["login.sovcloud-identity.fr", "login.sovcloud-identity.fr"],
        ["login.sovcloud-identity.de", "login.sovcloud-identity.de"],
        ["login.sovcloud-identity.sg", "login.sovcloud-identity.sg"],
    ])("canonicalizes %s to %s", async (alias, canonical) => {
        const instance = authority("common", alias);
        await instance.resolveEndpointsAsync();
        expect(instance.tokenEndpoint).toBe(
            `https://${canonical}/common/oauth21/2026-08/token`
        );
        expect(get).not.toHaveBeenCalled();
    });

    it.each(Object.values(ProtocolMode))(
        "does not use protocol mode %s as an Entra version selector",
        async (protocolMode) => {
            const instance = authority("common", host, { protocolMode });
            await instance.resolveEndpointsAsync();
            expect(instance.tokenEndpoint).toBe(
                `https://${host}/common/oauth21/2026-08/token`
            );
            expect(get).not.toHaveBeenCalled();
        }
    );

    it("discovers named-tenant metadata on the canonical host of an alias", async () => {
        get.mockResolvedValue({ body: metadata(tenantId) });
        const instance = authority("contoso.com", "login.windows.net");
        await instance.resolveEndpointsAsync();
        expect(get).toHaveBeenCalledTimes(1);
        expect(get).toHaveBeenCalledWith(
            `https://${host}/contoso.com/oauth21/2026-08/.well-known/openid-configuration`,
            {}
        );
        expect(instance.tokenEndpoint).toBe(
            `https://${host}/${tenantId}/oauth21/2026-08/token`
        );
    });

    it.each(["consumers", "contoso.onmicrosoft.com"])(
        "discovers the resolved issuer for %s",
        async (tenant) => {
            get.mockResolvedValue({
                body: {
                    ...metadata(tenantId),
                    future_discovery_field: "ignored",
                },
            });
            const instance = authority(tenant);
            await instance.resolveEndpointsAsync();
            expect(get).toHaveBeenCalledWith(
                `https://${host}/${tenant}/oauth21/2026-08/.well-known/openid-configuration`,
                {}
            );
            expect(instance.selfSignedJwtAudience).toBe(
                `https://${host}/${tenantId}/oauth21/2026-08`
            );
            expect(instance.tokenEndpoint).toBe(
                `https://${host}/${tenantId}/oauth21/2026-08/token`
            );
        }
    );

    it.each([
        "issuer",
        "authorization_endpoint",
        "token_endpoint",
        "end_session_endpoint",
        "jwks_uri",
    ] as const)("rejects incoherent configured %s", async (field) => {
        const instance = authority("common", host, {
            authorityMetadata: JSON.stringify({
                ...metadata(),
                [field]: `https://${host}/common/oauth2/v2.0/token`,
            }),
        });
        await expect(instance.resolveEndpointsAsync()).rejects.toMatchObject({
            errorCode: "invalid_authority_metadata",
            correlationId,
        });
        expect(get).not.toHaveBeenCalled();
        expect(post).not.toHaveBeenCalled();
        expect(instance.discoveryComplete()).toBe(false);
    });

    it("rejects old network metadata without retry or caching it", async () => {
        get.mockResolvedValue({
            body: {
                ...metadata(tenantId),
                issuer: `https://${host}/${tenantId}/v2.0`,
            },
        });
        const instance = authority("contoso.com");
        await expect(instance.resolveEndpointsAsync()).rejects.toMatchObject({
            errorCode: "invalid_authority_metadata",
        });
        expect(get).toHaveBeenCalledTimes(1);
        expect(get.mock.calls[0][0]).toBe(
            `https://${host}/contoso.com/oauth21/2026-08/.well-known/openid-configuration`
        );
        expect(storage.getAuthorityMetadataKeys()).toHaveLength(0);
        expect(post).not.toHaveBeenCalled();
    });

    it("rejects cached endpoints from another revision without a network retry", async () => {
        storage.setAuthorityMetadata(
            storage.generateAuthorityMetadataCacheKey("login.windows.net"),
            {
                ...metadata(tenantId),
                token_endpoint: `https://${host}/${tenantId}/oauth21/2026-09/token`,
                aliases: [host, "login.windows.net"],
                preferred_network: host,
                preferred_cache: "login.windows.net",
                canonical_authority: `https://${host}/contoso.com/`,
                aliasesFromNetwork: false,
                endpointsFromNetwork: true,
                expiresAt: Math.floor(Date.now() / 1000) + 3600,
            }
        );
        await expect(
            authority("contoso.com").resolveEndpointsAsync()
        ).rejects.toMatchObject({ errorCode: "invalid_authority_metadata" });
        expect(get).not.toHaveBeenCalled();
        expect(post).not.toHaveBeenCalled();
    });

    it("accepts coherent configured metadata without discovery", async () => {
        const instance = authority("common", host, {
            authorityMetadata: JSON.stringify(metadata()),
        });
        await instance.resolveEndpointsAsync();
        expect(instance.selfSignedJwtAudience).toBe(metadata().issuer);
        expect(get).not.toHaveBeenCalled();
    });

    it("does not retry a failed discovery against an older endpoint", async () => {
        get.mockRejectedValue(new Error("discovery failed"));
        await expect(
            authority("contoso.com").resolveEndpointsAsync()
        ).rejects.toMatchObject({ errorCode: "openid_config_error" });
        expect(get).toHaveBeenCalledTimes(1);
        expect(get.mock.calls[0][0]).toContain("/oauth21/2026-08/");
        expect(post).not.toHaveBeenCalled();
    });

    it.each(["config", "network"])(
        "accepts requested-name and resolved-GUID endpoints from %s",
        async (source) => {
            const document = {
                ...metadata("contoso.com", tenantId),
                token_endpoint: metadata(tenantId).token_endpoint,
                jwks_uri: metadata(tenantId).jwks_uri,
            };
            get.mockResolvedValue({ body: document });
            const instance = authority("contoso.com", host, {
                authorityMetadata:
                    source === "config" ? JSON.stringify(document) : "",
            });
            await instance.resolveEndpointsAsync();
            expect(instance.authorizationEndpoint).toBe(
                document.authorization_endpoint
            );
            expect(instance.tokenEndpoint).toBe(document.token_endpoint);
            expect(instance.jwksUri).toBe(document.jwks_uri);
            expect(instance.selfSignedJwtAudience).toBe(document.issuer);
            expect(get).toHaveBeenCalledTimes(source === "config" ? 0 : 1);
        }
    );

    it.each(["config", "network"])(
        "allows missing logout metadata from %s but fails an attempted logout",
        async (source) => {
            const document = {
                ...metadata(tenantId),
                end_session_endpoint: undefined,
            };
            get.mockResolvedValue({ body: document });
            const options = {
                authorityMetadata:
                    source === "config" ? JSON.stringify(document) : "",
            };
            for (let count = 0; count < 2; count++) {
                const instance = authority("contoso.com", host, options);
                await instance.resolveEndpointsAsync();
                expect(instance.tokenEndpoint).toBe(document.token_endpoint);
                expect(() => instance.endSessionEndpoint).toThrow(
                    "end_session_endpoint_not_supported"
                );
            }
            expect(get).toHaveBeenCalledTimes(source === "config" ? 0 : 1);
        }
    );

    it.each([
        `https://login.windows.net/${tenantId}/oauth21/2026-08/token`,
        `https://${host}/unrelated.com/oauth21/2026-08/token`,
        `https://${host}/11111111-1111-1111-1111-111111111111/oauth21/2026-08/token`,
        `https://${host}/${tenantId}/oauth21/2026-09/token`,
        `http://${host}/${tenantId}/oauth21/2026-08/token`,
        `https://${host}/${tenantId}/oauth21/2026-08/authorize`,
    ])("rejects an incoherent named-tenant token endpoint %s", async (url) => {
        get.mockResolvedValue({
            body: { ...metadata("contoso.com", tenantId), token_endpoint: url },
        });
        await expect(
            authority("contoso.com").resolveEndpointsAsync()
        ).rejects.toMatchObject({
            errorCode: "invalid_authority_metadata",
            correlationId,
        });
        expect(get).toHaveBeenCalledTimes(1);
        expect(storage.getAuthorityMetadataKeys()).toHaveLength(0);
        expect(post).not.toHaveBeenCalled();
    });

    it("preserves query parameters on coherent endpoints", async () => {
        const document = metadata();
        document.end_session_endpoint += "?existing=value";
        const instance = authority("common", host, {
            authorityMetadata: JSON.stringify(document),
        });
        await instance.resolveEndpointsAsync();
        expect(instance.endSessionEndpoint).toBe(document.end_session_endpoint);
    });

    it.each(["config", "network"])(
        "preserves legacy Microsoft-host B2C discovery from %s",
        async (source) => {
            // NodeStorage retains metadata references rather than serializing them.
            jest.spyOn(storage, "setAuthorityMetadata").mockImplementation(
                (key, value) => {
                    Object.assign(storage.store, { [key]: value });
                }
            );
            const entra = authority();
            await entra.resolveEndpointsAsync();
            const url = `https://${host}/tfp/contoso.onmicrosoft.com/b2c_1_susi/`;
            const document = {
                authorization_endpoint: `${url}oauth2/v2.0/authorize`,
                token_endpoint: `${url}oauth2/v2.0/token`,
                end_session_endpoint: `${url}oauth2/v2.0/logout`,
                issuer: `https://${host}/${tenantId}/v2.0/`,
                jwks_uri: `${url}discovery/v2.0/keys`,
            };
            get.mockResolvedValue({ body: document });
            const instance = authority(
                "tfp/contoso.onmicrosoft.com/b2c_1_susi",
                host,
                {
                    authorityMetadata:
                        source === "config" ? JSON.stringify(document) : "",
                }
            );
            await instance.resolveEndpointsAsync();
            expect(instance.tokenEndpoint).toBe(document.token_endpoint);
            expect(instance.authorizationEndpoint).toBe(
                document.authorization_endpoint
            );
            expect(entra.tokenEndpoint).toBe(metadata().token_endpoint);
            expect(entra.selfSignedJwtAudience).toBe(metadata().issuer);
            expect(get).toHaveBeenCalledTimes(source === "config" ? 0 : 1);
            if (source === "network") {
                expect(get).toHaveBeenCalledWith(
                    `${url}v2.0/.well-known/openid-configuration`,
                    {}
                );
            }
        }
    );

    it.each(["westus", "TryAutoDetect"])(
        "reuses canonical discovery metadata with region %s",
        async (region) => {
            jest.spyOn(
                RegionDiscovery.prototype,
                "detectRegion"
            ).mockResolvedValue("westus");
            get.mockResolvedValue({ body: metadata(tenantId) });
            const options = {
                azureRegionConfiguration: {
                    azureRegion: region,
                    environmentRegion: undefined,
                },
            };
            for (let count = 0; count < 2; count++) {
                const instance = authority("contoso.com", host, options);
                await instance.resolveEndpointsAsync();
                expect(instance.tokenEndpoint).toBe(
                    `https://westus.login.microsoft.com/${tenantId}/oauth21/2026-08/token/`
                );
            }
            expect(get).toHaveBeenCalledTimes(1);
            const cached = storage.getAuthorityMetadataByAlias(
                host,
                correlationId
            );
            expect(cached?.token_endpoint).toBe(
                `https://${host}/${tenantId}/oauth21/2026-08/token`
            );
        }
    );

    it("isolates named tenants while reusing the current tenant's discovery", async () => {
        get.mockResolvedValueOnce({ body: metadata("first.com", tenantId) });
        const first = authority("first.com");
        await first.resolveEndpointsAsync();
        get.mockResolvedValue({ body: metadata("second.com", tenantId) });
        const second = authority("second.com");
        await second.resolveEndpointsAsync();
        await authority("second.com").resolveEndpointsAsync();
        expect(get).toHaveBeenCalledTimes(2);
        expect(first.tokenEndpoint).toBe(
            `https://${host}/first.com/oauth21/2026-08/token`
        );
        expect(second.tokenEndpoint).toBe(
            `https://${host}/second.com/oauth21/2026-08/token`
        );
    });

    it.each([
        ["global", "westus", "eastus"],
        ["global", "eastus", "westus"],
        ["westus", "global", "eastus"],
        ["westus", "eastus", "global"],
        ["eastus", "global", "westus"],
        ["eastus", "westus", "global"],
    ])(
        "isolates shared-cache endpoints in discovery order %s, %s, %s",
        async (...order) => {
            jest.spyOn(storage, "setAuthorityMetadata").mockImplementation(
                (key, value) => {
                    Object.assign(storage.store, { [key]: value });
                }
            );
            get.mockResolvedValue({ body: metadata(tenantId) });
            const instances: { instance: Authority; endpointBase: string }[] =
                [];
            for (const region of order) {
                const instance = authority(
                    "contoso.com",
                    host,
                    region === "global"
                        ? {}
                        : {
                              azureRegionConfiguration: {
                                  azureRegion: region,
                                  environmentRegion: undefined,
                              },
                          }
                );
                await instance.resolveEndpointsAsync();
                instances.push({
                    instance,
                    endpointBase:
                        region === "global"
                            ? `https://${host}/${tenantId}/oauth21/2026-08`
                            : `https://${region}.login.microsoft.com/${tenantId}/oauth21/2026-08`,
                });
                for (const resolved of instances) {
                    const trailingSlash = resolved.endpointBase.includes(
                        ".login.microsoft.com/"
                    )
                        ? "/"
                        : "";
                    expect(resolved.instance.tokenEndpoint).toBe(
                        `${resolved.endpointBase}/token${trailingSlash}`
                    );
                    expect(resolved.instance.authorizationEndpoint).toBe(
                        `${resolved.endpointBase}/authorize${trailingSlash}`
                    );
                }
                expect(
                    storage.getAuthorityMetadataByAlias(host, correlationId)
                        ?.token_endpoint
                ).toBe(metadata(tenantId).token_endpoint);
            }
            expect(get).toHaveBeenCalledTimes(1);
        }
    );

    it("preserves refresh-token keys and records during discovery", async () => {
        const credential: RefreshTokenEntity = {
            homeAccountId: "uid.utid",
            environment: "login.windows.net",
            credentialType: CredentialType.REFRESH_TOKEN,
            clientId: "client-id",
            secret: "cached-refresh-token",
            lastUpdatedAt: "0",
        };
        await storage.setRefreshTokenCredential(credential);
        const key = storage.generateCredentialKey(credential);
        await authority().resolveEndpointsAsync();
        expect(storage.generateCredentialKey(credential)).toBe(key);
        expect(storage.getRefreshTokenCredential(key)).toEqual(credential);
        expect(storage.getTokenKeys().refreshToken).toEqual([key]);
    });

    it.each([
        "https://example.com/tenant/",
        "https://contoso.b2clogin.com/tenant/policy/",
        "https://tenant.ciamlogin.com/tenant/",
        "https://example.com/adfs/",
    ])("does not rewrite non-Entra endpoints for %s", async (url) => {
        const oldMetadata = {
            authorization_endpoint: `${url}authorize`,
            token_endpoint: `${url}token`,
            issuer: url,
            jwks_uri: `${url}keys`,
        };
        const instance = new Authority(
            url,
            network,
            storage,
            {
                protocolMode: ProtocolMode.OIDC,
                knownAuthorities: [new URL(url).hostname],
                cloudDiscoveryMetadata: "",
                authorityMetadata: JSON.stringify(oldMetadata),
            },
            logger,
            correlationId,
            new StubPerformanceClient()
        );
        await instance.resolveEndpointsAsync();
        expect(instance.tokenEndpoint).toBe(oldMetadata.token_endpoint);
        expect(get).not.toHaveBeenCalled();
    });

    it("does not treat the profile revision as the credential realm", () => {
        expect(
            getTenantFromAuthorityString(
                `https://${host}/${tenantId}/oauth21/2026-08/`,
                correlationId
            )
        ).toBe(tenantId);
        expect(
            getTenantFromAuthorityString(
                `https://${host}/common/oauth21/2026-08/`,
                correlationId
            )
        ).toBeUndefined();
        expect(
            getTenantFromAuthorityString(
                `https://${host}/client/oauth21/2026-08/`,
                correlationId
            )
        ).toBeUndefined();
        expect(
            getTenantFromAuthorityString(
                "https://contoso.b2clogin.com/tenant/oauth21/2026-08/",
                correlationId
            )
        ).toBe("2026-08");
    });
});
