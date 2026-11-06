/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AccountEntityUtils } from "@azure/msal-common/browser";
import { PublicClientApplication } from "../../src/app/PublicClientApplication.js";
import { StandardController } from "../../src/controllers/StandardController.js";
import { StandardOperatingContext } from "../../src/operatingcontext/StandardOperatingContext.js";
import { Configuration } from "../../src/config/Configuration.js";
import {
    BrowserCacheLocation,
    CacheLookupPolicy,
} from "../../src/utils/BrowserConstants.js";
import { FetchClient } from "../../src/network/FetchClient.js";
import { BrowserPerformanceClient } from "../../src/telemetry/BrowserPerformanceClient.js";
import {
    TEST_CONFIG,
    TEST_ACCOUNT_ENTITY,
    TEST_REFRESH_TOKEN_ENTITY,
    TEST_TOKEN_RESPONSE,
    DEFAULT_OPENID_CONFIG_RESPONSE,
    DEFAULT_TENANT_DISCOVERY_RESPONSE,
} from "../utils/StringConstants.js";

class ContextFixtureController extends StandardController {
    get cache() {
        return this.browserStorage;
    }
}

describe("Experimental CAE cache contexts", () => {
    const account = AccountEntityUtils.getAccountInfo(TEST_ACCOUNT_ENTITY);
    const ordinary = { account, scopes: ["user.read"] };
    const request = {
        ...ordinary,
        claims: JSON.stringify({
            access_token: { xms_cc: { values: ["CP1"] } },
        }),
    };

    function configuration(
        location: BrowserCacheLocation,
        enabled = true
    ): Configuration {
        return {
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                authority: TEST_CONFIG.validAuthority,
                clientCapabilities: [],
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
        location: BrowserCacheLocation = BrowserCacheLocation.MemoryStorage,
        seed = true
    ) {
        const config = configuration(location);
        const controller = new ContextFixtureController(
            new StandardOperatingContext(config)
        );
        const owner = new PublicClientApplication(config, controller);
        await owner.initialize();
        if (seed) {
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
        }
        return { owner, cache: controller.cache };
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

    it("creates before sign-in and rejects disabled or empty contexts", async () => {
        const { owner } = await application(
            BrowserCacheLocation.MemoryStorage,
            false
        );
        await expect(
            owner.createCaeCacheContext("workspace-a")
        ).resolves.toBeDefined();
        expect(owner.getAllAccounts()).toHaveLength(0);
        await expect(owner.createCaeCacheContext("")).rejects.toMatchObject({
            errorCode: "experimental_cae_cache_unsupported",
        });
        const disabled = new PublicClientApplication(
            configuration(BrowserCacheLocation.MemoryStorage, false)
        );
        await disabled.initialize();
        await expect(
            disabled.createCaeCacheContext("workspace-a")
        ).rejects.toMatchObject({
            errorCode: "experimental_cae_cache_unsupported",
        });
    });

    it.each(Object.values(BrowserCacheLocation))(
        "isolates configured contexts while sharing ordinary authentication in %s",
        async (location) => {
            const post = jest
                .spyOn(FetchClient.prototype, "sendPostRequestAsync")
                .mockResolvedValueOnce(response("ordinary"))
                .mockResolvedValueOnce(response("context-a"))
                .mockResolvedValueOnce(response("context-b"));
            const { owner, cache } = await application(location);
            const a = await owner.createCaeCacheContext("workspace-a");
            const b = await owner.createCaeCacheContext("workspace-b");
            const again = await owner.createCaeCacheContext("workspace-a");
            expect((await owner.acquireTokenSilent(ordinary)).accessToken).toBe(
                "ordinary"
            );
            expect((await a.acquireTokenSilent(request)).accessToken).toBe(
                "context-a"
            );
            expect((await b.acquireTokenSilent(request)).accessToken).toBe(
                "context-b"
            );
            expect((await again.acquireTokenSilent(request)).accessToken).toBe(
                "context-a"
            );
            expect((await owner.acquireTokenSilent(ordinary)).accessToken).toBe(
                "ordinary"
            );
            expect(post).toHaveBeenCalledTimes(3);
            expect(cache.getTokenKeys().refreshToken).toHaveLength(1);
            expect(owner.getAllAccounts()).toHaveLength(1);
            await expect(a.acquireTokenSilent(ordinary)).rejects.toMatchObject({
                errorCode: "experimental_cae_cache_unsupported",
            });
        }
    );

    it.each(Object.values(BrowserCacheLocation))(
        "resets without clearing other contexts or shared authentication in %s",
        async (location) => {
            const post = jest
                .spyOn(FetchClient.prototype, "sendPostRequestAsync")
                .mockResolvedValueOnce(response("ordinary"))
                .mockResolvedValueOnce(response("old-a"))
                .mockResolvedValueOnce(response("healthy-b"))
                .mockResolvedValueOnce(response("fresh-a"));
            const { owner, cache } = await application(location);
            const a = await owner.createCaeCacheContext("workspace-a");
            const b = await owner.createCaeCacheContext("workspace-b");
            await owner.acquireTokenSilent(ordinary);
            await a.acquireTokenSilent(request);
            await b.acquireTokenSilent(request);
            await a.reset();
            expect((await a.acquireTokenSilent(request)).accessToken).toBe(
                "fresh-a"
            );
            expect((await b.acquireTokenSilent(request)).accessToken).toBe(
                "healthy-b"
            );
            expect((await owner.acquireTokenSilent(ordinary)).accessToken).toBe(
                "ordinary"
            );
            expect(cache.getTokenKeys().refreshToken).toHaveLength(1);
            expect(cache.getTokenKeys().accessToken).toHaveLength(3);
            expect(post).toHaveBeenCalledTimes(4);
        }
    );

    it("retires without an active account and cannot clear its replacement on repeat", async () => {
        const post = jest
            .spyOn(FetchClient.prototype, "sendPostRequestAsync")
            .mockResolvedValueOnce(response("old"))
            .mockResolvedValueOnce(response("replacement"));
        const { owner } = await application();
        const old = await owner.createCaeCacheContext("workspace-a");
        await old.acquireTokenSilent(request);
        owner.setActiveAccount(null);
        const retirement = old.retire();
        await expect(old.acquireTokenSilent(request)).rejects.toMatchObject({
            errorCode: "cae_token_request_invalidated",
        });
        await retirement;
        const current = await owner.createCaeCacheContext("workspace-a");
        expect((await current.acquireTokenSilent(request)).accessToken).toBe(
            "replacement"
        );
        await old.retire();
        await expect(old.reset()).rejects.toMatchObject({
            errorCode: "cae_token_request_invalidated",
        });
        expect((await current.acquireTokenSilent(request)).accessToken).toBe(
            "replacement"
        );
        expect(post).toHaveBeenCalledTimes(2);
        expect(owner.getAllAccounts()).toHaveLength(1);
    });

    it.each(["reset", "retire"] as const)(
        "%s rejects a pending result without disturbing the replacement",
        async (action) => {
            let started!: () => void;
            let complete!: (value: ReturnType<typeof response>) => void;
            const entered = new Promise<void>((resolve) => {
                started = resolve;
            });
            const held = new Promise<ReturnType<typeof response>>((resolve) => {
                complete = resolve;
            });
            const post = jest
                .spyOn(FetchClient.prototype, "sendPostRequestAsync")
                .mockImplementationOnce(() => {
                    started();
                    return held;
                })
                .mockResolvedValueOnce(response("replacement"));
            const { owner } = await application(
                BrowserCacheLocation.LocalStorage
            );
            const context = await owner.createCaeCacheContext("workspace-a");
            const rejected = expect(
                context.acquireTokenSilent(request)
            ).rejects.toMatchObject({
                errorCode: "cae_token_request_invalidated",
            });
            await entered;
            try {
                await context[action]();
                const replacement = await owner.createCaeCacheContext(
                    "workspace-a"
                );
                expect(
                    (await replacement.acquireTokenSilent(request)).accessToken
                ).toBe("replacement");
            } finally {
                complete(response("old"));
                await rejected;
            }
            const current = await owner.createCaeCacheContext("workspace-a");
            expect(
                (await current.acquireTokenSilent(request)).accessToken
            ).toBe("replacement");
            expect(post).toHaveBeenCalledTimes(2);
        }
    );

    it("does not let a deferred encrypted write delete its context replacement", async () => {
        let started!: () => void;
        let release!: () => void;
        const entered = new Promise<void>((resolve) => {
            started = resolve;
        });
        const blocked = new Promise<void>((resolve) => {
            release = resolve;
        });
        const post = jest
            .spyOn(FetchClient.prototype, "sendPostRequestAsync")
            .mockResolvedValueOnce(response("old-context-token"))
            .mockResolvedValueOnce(response("current-context-token"));
        const { owner } = await application(BrowserCacheLocation.LocalStorage);
        const context = await owner.createCaeCacheContext("workspace-a");
        const encrypt = window.crypto.subtle.encrypt.bind(window.crypto.subtle);
        jest.spyOn(window.crypto.subtle, "encrypt").mockImplementation(
            async (...args) => {
                const result = await encrypt(...args);
                if (
                    new TextDecoder()
                        .decode(args[2])
                        .includes("old-context-token")
                ) {
                    started();
                    await blocked;
                }
                return result;
            }
        );
        const rejected = expect(
            context.acquireTokenSilent(request)
        ).rejects.toMatchObject({
            errorCode: "cae_token_request_invalidated",
        });
        try {
            await entered;
            await context.reset();
            expect(
                (await context.acquireTokenSilent(request)).accessToken
            ).toBe("current-context-token");
        } finally {
            release();
            await rejected;
        }
        expect((await context.acquireTokenSilent(request)).accessToken).toBe(
            "current-context-token"
        );
        expect(post).toHaveBeenCalledTimes(2);
    });

    it("keeps challenge invalidation resource-scoped inside its context", async () => {
        const resource = "https://resource.example/.default";
        const post = jest
            .spyOn(FetchClient.prototype, "sendPostRequestAsync")
            .mockResolvedValueOnce(response("a-graph"))
            .mockResolvedValueOnce(response("b-graph"))
            .mockResolvedValueOnce(response("a-resource", resource))
            .mockRejectedValueOnce(new Error("renewal failed"));
        const { owner } = await application();
        const a = await owner.createCaeCacheContext("workspace-a");
        const b = await owner.createCaeCacheContext("workspace-b");
        await a.acquireTokenSilent(request);
        await b.acquireTokenSilent(request);
        await a.acquireTokenSilent({ ...request, scopes: [resource] });
        await expect(
            a.acquireTokenSilent({
                ...request,
                invalidateAccessTokenCache: true,
            })
        ).rejects.toMatchObject({ errorCode: "network_error" });
        await expect(
            a.acquireTokenSilent({
                ...request,
                cacheLookupPolicy: CacheLookupPolicy.AccessToken,
            })
        ).rejects.toMatchObject({ errorCode: "token_refresh_required" });
        expect((await b.acquireTokenSilent(request)).accessToken).toBe(
            "b-graph"
        );
        expect(
            (await a.acquireTokenSilent({ ...request, scopes: [resource] }))
                .accessToken
        ).toBe("a-resource");
        expect(post).toHaveBeenCalledTimes(4);
    });

    it("preserves the public owner override and isolates unscoped CP1 callers", async () => {
        const post = jest
            .spyOn(FetchClient.prototype, "sendPostRequestAsync")
            .mockResolvedValueOnce(response("scoped"))
            .mockResolvedValueOnce(response("unscoped"));
        const { owner } = await application();
        const acquire = jest.spyOn(owner, "acquireTokenSilent");
        const context = await owner.createCaeCacheContext("workspace-a");
        const input = {
            ...request,
            correlationId: TEST_CONFIG.CORRELATION_ID,
            state: "caller-state",
        };
        const result = await context.acquireTokenSilent(input);
        expect(acquire).toHaveBeenCalledWith(expect.objectContaining(input));
        expect(result.state).toBe(input.state);
        expect(result.correlationId).toBe(input.correlationId);
        expect((await owner.acquireTokenSilent(request)).accessToken).toBe(
            "unscoped"
        );
        expect((await context.acquireTokenSilent(request)).accessToken).toBe(
            "scoped"
        );
        expect(post).toHaveBeenCalledTimes(2);
    });

    it("removes retired context metadata rather than accumulating lifetime partitions", async () => {
        jest.spyOn(
            FetchClient.prototype,
            "sendPostRequestAsync"
        ).mockResolvedValue(response("context-token"));
        const { owner, cache } = await application(
            BrowserCacheLocation.SessionStorage
        );
        for (let index = 0; index < 5; index++) {
            const context = await owner.createCaeCacheContext(
                "stable-workspace"
            );
            await context.acquireTokenSilent(request);
            await context.retire();
            expect(
                Object.keys(window.sessionStorage).filter(
                    (key) =>
                        key.startsWith("msal.cae.") &&
                        !key.startsWith("msal.cae.context|")
                )
            ).toHaveLength(0);
            expect(
                Object.keys(window.sessionStorage).filter((key) =>
                    key.startsWith("msal.cae.context|")
                )
            ).toHaveLength(1);
            expect(cache.getTokenKeys().accessToken).toHaveLength(0);
        }
        expect(cache.getTokenKeys().refreshToken).toHaveLength(1);
        expect(owner.getAllAccounts()).toHaveLength(1);
    });

    it("makes retirement idempotent even during synchronous performance callbacks", async () => {
        const config = configuration(BrowserCacheLocation.MemoryStorage);
        config.telemetry = { client: new BrowserPerformanceClient(config) };
        const owner = new PublicClientApplication(config);
        await owner.initialize();
        const context = await owner.createCaeCacheContext("workspace-a");
        let reentrant: Promise<void> | undefined;
        owner.addPerformanceCallback((events) => {
            if (events.some((event) => event.name === "resetCaeCacheContext")) {
                reentrant = context.retire();
            }
        });
        const retirement = context.retire();
        await retirement;
        expect(reentrant).toBe(retirement);
    });

    it.each(Object.values(BrowserCacheLocation))(
        "does not let a different stale handle retire a newer lifetime in %s",
        async (location) => {
            const post = jest
                .spyOn(FetchClient.prototype, "sendPostRequestAsync")
                .mockResolvedValueOnce(response("old"))
                .mockResolvedValueOnce(response("new"));
            const { owner } = await application(location);
            const other =
                location === BrowserCacheLocation.MemoryStorage
                    ? owner
                    : new PublicClientApplication(configuration(location));
            if (other !== owner) {
                await other.initialize();
            }
            const stale = await other.createCaeCacheContext("workspace-a");
            const old = await owner.createCaeCacheContext("workspace-a");
            await old.acquireTokenSilent(request);
            await old.retire();
            const current = await owner.createCaeCacheContext("workspace-a");
            expect(
                (await current.acquireTokenSilent(request)).accessToken
            ).toBe("new");
            await stale.retire();
            expect(
                (
                    await current.acquireTokenSilent({
                        ...request,
                        cacheLookupPolicy: CacheLookupPolicy.AccessToken,
                    })
                ).accessToken
            ).toBe("new");
            expect(post).toHaveBeenCalledTimes(2);
        }
    );

    it("fences before authority discovery finishes and does not start renewal", async () => {
        const post = jest.spyOn(FetchClient.prototype, "sendPostRequestAsync");
        const { owner } = await application();
        const context = await owner.createCaeCacheContext("workspace-a");
        const pending = context.acquireTokenSilent(request);
        const rejected = expect(pending).rejects.toMatchObject({
            errorCode: "cae_token_request_invalidated",
        });
        await context.reset();
        await rejected;
        expect(post).not.toHaveBeenCalled();
    });

    it.each([
        BrowserCacheLocation.LocalStorage,
        BrowserCacheLocation.SessionStorage,
    ])(
        "fences another instance and preserves other contexts in %s",
        async (location) => {
            const post = jest
                .spyOn(FetchClient.prototype, "sendPostRequestAsync")
                .mockResolvedValueOnce(response("a"))
                .mockResolvedValueOnce(response("b"));
            const { owner } = await application(location);
            const other = new PublicClientApplication(configuration(location));
            await other.initialize();
            const a = await owner.createCaeCacheContext("workspace-a");
            const b = await owner.createCaeCacheContext("workspace-b");
            const otherA = await other.createCaeCacheContext("workspace-a");
            const otherB = await other.createCaeCacheContext("workspace-b");
            await a.acquireTokenSilent(request);
            await b.acquireTokenSilent(request);
            expect((await otherA.acquireTokenSilent(request)).accessToken).toBe(
                "a"
            );
            await a.reset();
            await expect(
                otherA.acquireTokenSilent({
                    ...request,
                    cacheLookupPolicy: CacheLookupPolicy.AccessToken,
                })
            ).rejects.toMatchObject({ errorCode: "token_refresh_required" });
            expect((await otherB.acquireTokenSilent(request)).accessToken).toBe(
                "b"
            );
            expect(post).toHaveBeenCalledTimes(2);
        }
    );
});
