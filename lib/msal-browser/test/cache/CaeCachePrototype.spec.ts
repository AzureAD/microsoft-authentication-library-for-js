/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AccountEntityUtils, ProtocolMode } from "@azure/msal-common/browser";
import { PublicClientApplication } from "../../src/app/PublicClientApplication.js";
import { Configuration } from "../../src/config/Configuration.js";
import { StandardController } from "../../src/controllers/StandardController.js";
import { NestedAppAuthController } from "../../src/controllers/NestedAppAuthController.js";
import { StandardOperatingContext } from "../../src/operatingcontext/StandardOperatingContext.js";
import { NestedAppOperatingContext } from "../../src/operatingcontext/NestedAppOperatingContext.js";
import { loadExternalTokens } from "../../src/cache/TokenCache.js";
import { FetchClient } from "../../src/network/FetchClient.js";
import {
    BrowserCacheLocation,
    CacheLookupPolicy,
} from "../../src/utils/BrowserConstants.js";
import {
    DEFAULT_OPENID_CONFIG_RESPONSE,
    DEFAULT_TENANT_DISCOVERY_RESPONSE,
    TEST_ACCOUNT_ENTITY,
    TEST_REFRESH_TOKEN_ENTITY,
    TEST_CONFIG,
    TEST_TOKEN_RESPONSE,
} from "../utils/StringConstants.js";

class FixtureController extends StandardController {
    get cache() {
        return this.browserStorage;
    }
}

describe("Experimental ordinary/CP1 token partitioning", () => {
    const account = AccountEntityUtils.getAccountInfo(TEST_ACCOUNT_ENTITY);
    const request = { account, scopes: ["user.read"] };
    const cp1 = JSON.stringify({
        access_token: { xms_cc: { values: ["CP1"] } },
    });

    function config(
        enabled = true,
        capabilities: string[] = [],
        location: BrowserCacheLocation = BrowserCacheLocation.MemoryStorage
    ): Configuration {
        return {
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                authority: TEST_CONFIG.validAuthority,
                clientCapabilities: capabilities,
                authorityMetadata: JSON.stringify(
                    DEFAULT_OPENID_CONFIG_RESPONSE.body
                ),
                cloudDiscoveryMetadata: JSON.stringify(
                    DEFAULT_TENANT_DISCOVERY_RESPONSE.body
                ),
            },
            cache: { cacheLocation: location },
            experimental: { enableCaeCachePartitioning: enabled },
            system: { allowPlatformBroker: false },
        };
    }

    async function application(
        enabled = true,
        capabilities: string[] = [],
        location: BrowserCacheLocation = BrowserCacheLocation.MemoryStorage
    ) {
        const configuration = config(enabled, capabilities, location);
        const controller = new FixtureController(
            new StandardOperatingContext(configuration)
        );
        const pca = new PublicClientApplication(configuration, controller);
        await pca.initialize();
        await controller.cache.saveCacheRecord(
            {
                account: { ...TEST_ACCOUNT_ENTITY },
                refreshToken: {
                    ...TEST_REFRESH_TOKEN_ENTITY,
                    realm: undefined,
                },
            },
            TEST_CONFIG.CORRELATION_ID,
            true,
            0
        );
        return { pca, cache: controller.cache };
    }

    function response(secret: string, scope = "user.read") {
        return {
            ...TEST_TOKEN_RESPONSE,
            body: { ...TEST_TOKEN_RESPONSE.body, scope, access_token: secret },
        };
    }

    afterEach(() => {
        jest.restoreAllMocks();
        window.localStorage.clear();
        window.sessionStorage.clear();
    });

    it.each([false, true])(
        "preserves flag-off behavior and isolates enabled families: %s",
        async (enabled) => {
            const post = jest
                .spyOn(FetchClient.prototype, "sendPostRequestAsync")
                .mockResolvedValueOnce(response("ordinary"))
                .mockResolvedValueOnce(response("cp1"))
                .mockResolvedValueOnce(response("cp1-renewed"));
            const { pca, cache } = await application(enabled);
            expect((await pca.acquireTokenSilent(request)).accessToken).toBe(
                "ordinary"
            );
            expect(
                (await pca.acquireTokenSilent({ ...request, claims: cp1 }))
                    .accessToken
            ).toBe("cp1");
            expect((await pca.acquireTokenSilent(request)).accessToken).toBe(
                enabled ? "ordinary" : "cp1"
            );
            const repeated = await pca.acquireTokenSilent({
                ...request,
                claims: cp1,
            });
            expect(repeated.accessToken).toBe(enabled ? "cp1" : "cp1-renewed");
            expect(repeated.fromCache).toBe(enabled);
            expect(post).toHaveBeenCalledTimes(enabled ? 2 : 3);
            expect(cache.getTokenKeys().accessToken).toHaveLength(
                enabled ? 2 : 1
            );
            expect(cache.getTokenKeys().refreshToken).toHaveLength(1);
        }
    );

    it("keeps simultaneous ordinary and CP1 requests separate", async () => {
        const post = jest
            .spyOn(FetchClient.prototype, "sendPostRequestAsync")
            .mockResolvedValueOnce(response("cp1"))
            .mockResolvedValueOnce(response("ordinary"));
        const { pca } = await application();
        const [cae, ordinary] = await Promise.all([
            pca.acquireTokenSilent({ ...request, claims: cp1 }),
            pca.acquireTokenSilent(request),
        ]);
        expect(cae.accessToken).toBe("cp1");
        expect(ordinary.accessToken).toBe("ordinary");
        expect(
            (await pca.acquireTokenSilent({ ...request, claims: cp1 }))
                .accessToken
        ).toBe("cp1");
        expect((await pca.acquireTokenSilent(request)).accessToken).toBe(
            "ordinary"
        );
        expect(post).toHaveBeenCalledTimes(2);
    });

    it.each([
        BrowserCacheLocation.LocalStorage,
        BrowserCacheLocation.SessionStorage,
    ])(
        "uses the normal schema for reload and preserves unknown legacy tokens in %s",
        async (location) => {
            const post = jest
                .spyOn(FetchClient.prototype, "sendPostRequestAsync")
                .mockResolvedValueOnce(response("unknown-legacy"))
                .mockResolvedValueOnce(response("ordinary"))
                .mockResolvedValueOnce(response("cp1"));
            const legacy = await application(false, [], location);
            await legacy.pca.acquireTokenSilent(request);
            const enabled = await application(true, [], location);
            expect(
                (await enabled.pca.acquireTokenSilent(request)).accessToken
            ).toBe("ordinary");
            expect(
                (
                    await enabled.pca.acquireTokenSilent({
                        ...request,
                        claims: cp1,
                    })
                ).accessToken
            ).toBe("cp1");
            expect(enabled.cache.getTokenKeys(3).accessToken).toHaveLength(3);
            expect(enabled.cache.getTokenKeys(4).accessToken).toHaveLength(0);
            const reload = new PublicClientApplication(
                config(true, [], location)
            );
            await reload.initialize();
            expect((await reload.acquireTokenSilent(request)).accessToken).toBe(
                "ordinary"
            );
            expect(
                (await reload.acquireTokenSilent({ ...request, claims: cp1 }))
                    .accessToken
            ).toBe("cp1");
            const disabled = new PublicClientApplication(
                config(false, [], location)
            );
            await disabled.initialize();
            expect(
                (await disabled.acquireTokenSilent(request)).accessToken
            ).toBe("unknown-legacy");
            expect(post).toHaveBeenCalledTimes(3);
            await enabled.pca.clearCache();
            expect(enabled.cache.getTokenKeys().accessToken).toHaveLength(0);
            expect(enabled.cache.getTokenKeys().refreshToken).toHaveLength(0);
        }
    );

    it("ignores later unmarked writes from a flag-off owner", async () => {
        const post = jest
            .spyOn(FetchClient.prototype, "sendPostRequestAsync")
            .mockResolvedValueOnce(response("ordinary"))
            .mockResolvedValueOnce(response("cp1"))
            .mockResolvedValueOnce(response("legacy-write"));
        const enabled = await application(
            true,
            [],
            BrowserCacheLocation.SessionStorage
        );
        await enabled.pca.acquireTokenSilent(request);
        await enabled.pca.acquireTokenSilent({ ...request, claims: cp1 });
        const legacy = await application(
            false,
            [],
            BrowserCacheLocation.SessionStorage
        );
        await legacy.pca.acquireTokenSilent({ ...request, forceRefresh: true });
        expect(
            (await enabled.pca.acquireTokenSilent(request)).accessToken
        ).toBe("ordinary");
        expect(
            (await enabled.pca.acquireTokenSilent({ ...request, claims: cp1 }))
                .accessToken
        ).toBe("cp1");
        expect(post).toHaveBeenCalledTimes(3);
    });

    it("replaces overlapping scopes only within the requested family", async () => {
        jest.spyOn(FetchClient.prototype, "sendPostRequestAsync")
            .mockResolvedValueOnce(response("ordinary", "user.read mail.read"))
            .mockResolvedValueOnce(response("cp1", "user.read mail.read"))
            .mockResolvedValueOnce(response("cp1-new"));
        const { pca, cache } = await application();
        const wide = { ...request, scopes: ["user.read", "mail.read"] };
        await pca.acquireTokenSilent(wide);
        await pca.acquireTokenSilent({ ...wide, claims: cp1 });
        await pca.acquireTokenSilent({
            ...request,
            claims: cp1,
            forceRefresh: true,
        });
        expect((await pca.acquireTokenSilent(wide)).accessToken).toBe(
            "ordinary"
        );
        expect(
            (await pca.acquireTokenSilent({ ...request, claims: cp1 }))
                .accessToken
        ).toBe("cp1-new");
        await expect(
            pca.acquireTokenSilent({
                ...wide,
                claims: cp1,
                cacheLookupPolicy: CacheLookupPolicy.AccessToken,
            })
        ).rejects.toMatchObject({ errorCode: "token_refresh_required" });
        expect(cache.getTokenKeys().accessToken).toHaveLength(2);
    });

    it("does not grow cache partitions for repeated different challenges", async () => {
        let grants = 0;
        const post = jest
            .spyOn(FetchClient.prototype, "sendPostRequestAsync")
            .mockImplementation(async () => response(`token-${++grants}`));
        const { pca, cache } = await application();
        await pca.acquireTokenSilent(request);
        await pca.acquireTokenSilent({ ...request, claims: cp1 });
        for (let i = 0; i < 12; i++) {
            await pca.acquireTokenSilent({
                ...request,
                claims: JSON.stringify({
                    access_token: {
                        xms_cc: { values: ["CP1"] },
                        auth_time: { essential: true, value: i },
                    },
                }),
            });
            expect(cache.getTokenKeys().accessToken).toHaveLength(2);
        }
        expect((await pca.acquireTokenSilent(request)).accessToken).toBe(
            "token-1"
        );
        expect(
            (await pca.acquireTokenSilent({ ...request, claims: cp1 }))
                .accessToken
        ).toBe("token-14");
        expect(post).toHaveBeenCalledTimes(14);
    });

    it("uses configured capability precedence and renews for other claims", async () => {
        const post = jest
            .spyOn(FetchClient.prototype, "sendPostRequestAsync")
            .mockResolvedValueOnce(response("cp1"))
            .mockResolvedValueOnce(response("challenge"));
        const { pca, cache } = await application(true, ["CP1"]);
        await pca.acquireTokenSilent(request);
        expect(
            (
                await pca.acquireTokenSilent({
                    ...request,
                    claims: JSON.stringify({
                        access_token: { xms_cc: { values: [] } },
                    }),
                })
            ).accessToken
        ).toBe("cp1");
        expect(
            (
                await pca.acquireTokenSilent({
                    ...request,
                    claims: JSON.stringify({
                        id_token: { auth_time: { essential: true } },
                    }),
                })
            ).accessToken
        ).toBe("challenge");
        expect(post).toHaveBeenCalledTimes(2);
        expect(cache.getTokenKeys().accessToken).toHaveLength(1);
    });

    it("preserves storeInCache opt-out", async () => {
        const post = jest
            .spyOn(FetchClient.prototype, "sendPostRequestAsync")
            .mockResolvedValue(response("cp1"));
        const { pca, cache } = await application();
        await pca.acquireTokenSilent({
            ...request,
            claims: cp1,
            storeInCache: { accessToken: false },
        });
        expect(cache.getTokenKeys().accessToken).toHaveLength(0);
        await pca.acquireTokenSilent({ ...request, claims: cp1 });
        expect(post).toHaveBeenCalledTimes(2);
    });

    it("rejects hydration, external imports and nested-app controllers", async () => {
        jest.spyOn(
            FetchClient.prototype,
            "sendPostRequestAsync"
        ).mockResolvedValue(response("grant"));
        const { pca } = await application();
        const result = await pca.acquireTokenSilent(request);
        await expect(pca.hydrateCache(result, request)).rejects.toMatchObject({
            errorCode: "experimental_cae_cache_unsupported",
        });
        await expect(
            loadExternalTokens(config(), request, TEST_TOKEN_RESPONSE.body, {})
        ).rejects.toMatchObject({
            errorCode: "experimental_cae_cache_unsupported",
        });
        expect(
            () =>
                new NestedAppAuthController(
                    new NestedAppOperatingContext(config())
                )
        ).toThrow("experimental_cae_cache_unsupported");
    });

    it.each([
        { attributeTokens: ["alpha"] },
        { resource: "https://resource.invalid" },
        { extraParameters: { claims: cp1 } },
        {
            claims: JSON.stringify({
                access_token: { xms_cc: { values: ["CP2"] } },
            }),
        },
    ])(
        "rejects unsupported request combinations before network: %s",
        async (unsupported) => {
            const post = jest.spyOn(
                FetchClient.prototype,
                "sendPostRequestAsync"
            );
            const { pca, cache } = await application();
            await expect(
                pca.acquireTokenSilent({ ...request, ...unsupported })
            ).rejects.toMatchObject({
                errorCode: "experimental_cae_cache_unsupported",
            });
            expect(post).not.toHaveBeenCalled();
            expect(cache.getTokenKeys().accessToken).toHaveLength(0);
        }
    );

    it.each([
        { system: { allowPlatformBroker: true } },
        { system: { protocolMode: ProtocolMode.OIDC } },
        { auth: { clientId: TEST_CONFIG.MSAL_CLIENT_ID, isMcp: true } },
    ])("rejects unsupported configurations: %s", (unsupported) => {
        expect(
            () => new PublicClientApplication({ ...config(), ...unsupported })
        ).toThrow("experimental_cae_cache_unsupported");
    });
});
