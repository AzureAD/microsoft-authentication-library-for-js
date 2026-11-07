/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    AccountEntityUtils,
    Constants,
    Logger,
    ProtocolMode,
} from "@azure/msal-common/browser";
import { PublicClientApplication } from "../../src/app/PublicClientApplication.js";
import {
    Configuration,
    buildConfiguration,
} from "../../src/config/Configuration.js";
import { StandardController } from "../../src/controllers/StandardController.js";
import { NestedAppAuthController } from "../../src/controllers/NestedAppAuthController.js";
import { StandardOperatingContext } from "../../src/operatingcontext/StandardOperatingContext.js";
import { NestedAppOperatingContext } from "../../src/operatingcontext/NestedAppOperatingContext.js";
import { loadExternalTokens } from "../../src/cache/TokenCache.js";
import * as CacheKeys from "../../src/cache/CacheKeys.js";
import { FetchClient } from "../../src/network/FetchClient.js";
import { CryptoOps } from "../../src/crypto/CryptoOps.js";
import { EventType } from "../../src/event/EventType.js";
import { prepareCaeCacheRequest } from "../../src/request/CaeCacheRequest.js";
import {
    BrowserCacheLocation,
    CacheLookupPolicy,
} from "../../src/utils/BrowserConstants.js";
import {
    DEFAULT_OPENID_CONFIG_RESPONSE,
    DEFAULT_TENANT_DISCOVERY_RESPONSE,
    TEST_ACCOUNT_ENTITY,
    TEST_ACCESS_TOKEN_ENTITY,
    TEST_REFRESH_TOKEN_ENTITY,
    TEST_CONFIG,
    TEST_TOKEN_RESPONSE,
    ID_TOKEN_CLAIMS,
} from "../utils/StringConstants.js";

class FixtureController extends StandardController {
    get cache() {
        return this.browserStorage;
    }
}

describe("Unpublished CAE partition prototype", () => {
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
        "same flow with experiment enabled=%s",
        async (enabled) => {
            const post = jest
                .spyOn(FetchClient.prototype, "sendPostRequestAsync")
                .mockResolvedValueOnce(response("ordinary"))
                .mockResolvedValueOnce(response("cae"))
                .mockResolvedValueOnce(response("cae-refreshed"));
            const { pca, cache } = await application(enabled);
            expect((await pca.acquireTokenSilent(request)).accessToken).toBe(
                "ordinary"
            );
            expect(
                (await pca.acquireTokenSilent({ ...request, claims: cp1 }))
                    .accessToken
            ).toBe("cae");
            expect((await pca.acquireTokenSilent(request)).accessToken).toBe(
                enabled ? "ordinary" : "cae"
            );
            const repeated = await pca.acquireTokenSilent({
                ...request,
                claims: cp1,
            });
            expect(repeated.accessToken).toBe(
                enabled ? "cae" : "cae-refreshed"
            );
            expect(repeated.fromCache).toBe(enabled);
            expect(post).toHaveBeenCalledTimes(enabled ? 2 : 3);
            expect(cache.getTokenKeys().accessToken).toHaveLength(
                enabled ? 2 : 1
            );
            expect(cache.getTokenKeys().refreshToken).toHaveLength(1);
            expect(
                cache.getAllAccounts({}, TEST_CONFIG.CORRELATION_ID)
            ).toHaveLength(1);
        }
    );

    it("isolates reverse acquisition order and reuses both families", async () => {
        const post = jest
            .spyOn(FetchClient.prototype, "sendPostRequestAsync")
            .mockResolvedValueOnce(response("cae"))
            .mockResolvedValueOnce(response("ordinary"));
        const { pca } = await application();
        await pca.acquireTokenSilent({ ...request, claims: cp1 });
        await pca.acquireTokenSilent(request);
        for (let i = 0; i < 3; i++) {
            expect(
                (await pca.acquireTokenSilent({ ...request, claims: cp1 }))
                    .accessToken
            ).toBe("cae");
            expect((await pca.acquireTokenSilent(request)).accessToken).toBe(
                "ordinary"
            );
        }
        expect(post).toHaveBeenCalledTimes(2);
    });

    it("preserves account isolation and clears both families on local logout", async () => {
        jest.spyOn(
            FetchClient.prototype,
            "sendPostRequestAsync"
        ).mockResolvedValue(response("grant"));
        const { pca, cache } = await application();
        await pca.acquireTokenSilent(request);
        await pca.acquireTokenSilent({ ...request, claims: cp1 });
        await expect(
            pca.acquireTokenSilent({
                ...request,
                account: {
                    ...account,
                    homeAccountId: "other.synthetic-account",
                },
                claims: cp1,
                cacheLookupPolicy: CacheLookupPolicy.AccessToken,
            })
        ).rejects.toMatchObject({ errorCode: "token_refresh_required" });
        expect(cache.getTokenKeys().accessToken).toHaveLength(2);
        await pca.clearCache();
        expect(cache.getTokenKeys().accessToken).toHaveLength(0);
        expect(cache.getTokenKeys().refreshToken).toHaveLength(0);
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

    it("uses configured capability precedence and ignores unknown legacy AT provenance", async () => {
        const post = jest
            .spyOn(FetchClient.prototype, "sendPostRequestAsync")
            .mockResolvedValue(response("configured-cae"));
        const { pca, cache } = await application(true, ["CP1"]);
        await cache.saveCacheRecord(
            {
                accessToken: {
                    ...TEST_ACCESS_TOKEN_ENTITY,
                    secret: "unknown-legacy",
                },
            },
            TEST_CONFIG.CORRELATION_ID,
            true,
            0
        );
        expect((await pca.acquireTokenSilent(request)).accessToken).toBe(
            "configured-cae"
        );
        const repeated = await pca.acquireTokenSilent({
            ...request,
            claims: JSON.stringify({
                access_token: { xms_cc: { values: [] } },
            }),
        });
        expect(repeated.accessToken).toBe("configured-cae");
        expect(repeated.fromCache).toBe(true);
        expect(post).toHaveBeenCalledTimes(1);
        const body = new URLSearchParams(post.mock.calls[0][1]?.body);
        expect(
            JSON.parse(body.get("claims")!).access_token.xms_cc.values
        ).toEqual(["CP1"]);
    });

    it("replaces overlapping CAE scopes without evicting ordinary scopes", async () => {
        jest.spyOn(FetchClient.prototype, "sendPostRequestAsync")
            .mockResolvedValueOnce(response("ordinary", "user.read mail.read"))
            .mockResolvedValueOnce(response("cae-old", "user.read mail.read"))
            .mockResolvedValueOnce(response("cae-new", "mail.read files.read"));
        const { pca, cache } = await application();
        await pca.acquireTokenSilent(request);
        await pca.acquireTokenSilent({ ...request, claims: cp1 });
        await pca.acquireTokenSilent({
            ...request,
            scopes: ["files.read"],
            claims: cp1,
        });
        expect(cache.getTokenKeys().accessToken).toHaveLength(2);
        expect((await pca.acquireTokenSilent(request)).accessToken).toBe(
            "ordinary"
        );
        expect(
            (
                await pca.acquireTokenSilent({
                    ...request,
                    scopes: ["mail.read"],
                    claims: cp1,
                })
            ).accessToken
        ).toBe("cae-new");
        await expect(
            pca.acquireTokenSilent({
                ...request,
                claims: cp1,
                cacheLookupPolicy: CacheLookupPolicy.AccessToken,
            })
        ).rejects.toMatchObject({ errorCode: "token_refresh_required" });
    });

    it("keeps challenge values out of the partition key", async () => {
        const post = jest
            .spyOn(FetchClient.prototype, "sendPostRequestAsync")
            .mockResolvedValue(response("grant"));
        const { pca, cache } = await application();
        await pca.acquireTokenSilent(request);
        for (let i = 0; i < 12; i++) {
            await pca.acquireTokenSilent({
                ...request,
                claims: JSON.stringify({
                    access_token: {
                        xms_cc: { values: ["CP1"] },
                        auth_time: { value: i },
                    },
                }),
            });
        }
        expect(post).toHaveBeenCalledTimes(13);
        expect(cache.getTokenKeys().accessToken).toHaveLength(2);
        expect(
            (await pca.acquireTokenSilent({ ...request, claims: cp1 }))
                .fromCache
        ).toBe(true);
        expect(post).toHaveBeenCalledTimes(13);
    });

    it.each([false, true])(
        "keeps conflicting write policies separate, first write=%s",
        async (firstWrites) => {
            const post = jest
                .spyOn(FetchClient.prototype, "sendPostRequestAsync")
                .mockResolvedValueOnce(
                    response(firstWrites ? "stored" : "not-stored")
                )
                .mockResolvedValueOnce(
                    response(firstWrites ? "not-stored" : "stored")
                );
            const { pca, cache } = await application();
            const results = await Promise.all([
                pca.acquireTokenSilent({
                    ...request,
                    claims: cp1,
                    forceRefresh: true,
                    storeInCache: { accessToken: firstWrites },
                }),
                pca.acquireTokenSilent({
                    ...request,
                    claims: cp1,
                    forceRefresh: true,
                    storeInCache: { accessToken: !firstWrites },
                }),
            ]);
            expect(results.map((result) => result.accessToken).sort()).toEqual([
                "not-stored",
                "stored",
            ]);
            expect(post).toHaveBeenCalledTimes(2);
            expect(cache.getTokenKeys().accessToken).toHaveLength(1);
            expect(
                (await pca.acquireTokenSilent({ ...request, claims: cp1 }))
                    .accessToken
            ).toBe("stored");
        }
    );

    it.each([
        BrowserCacheLocation.MemoryStorage,
        BrowserCacheLocation.SessionStorage,
        BrowserCacheLocation.LocalStorage,
    ])(
        "invalidates the rejected capability family when challenge renewal fails in %s",
        async (location) => {
            jest.spyOn(FetchClient.prototype, "sendPostRequestAsync")
                .mockResolvedValueOnce(response("previous-cae"))
                .mockResolvedValueOnce({
                    status: 400,
                    headers: {},
                    body: {
                        error: "interaction_required",
                        error_description: "Synthetic denial",
                    },
                });
            const { pca } = await application(true, [], location);
            await pca.acquireTokenSilent({ ...request, claims: cp1 });
            await expect(
                pca.acquireTokenSilent({
                    ...request,
                    claims: JSON.stringify({
                        access_token: {
                            xms_cc: { values: ["CP1"] },
                            auth_time: { essential: true },
                        },
                    }),
                    forceRefresh: true,
                    cacheLookupPolicy: CacheLookupPolicy.RefreshToken,
                })
            ).rejects.toMatchObject({ errorCode: "interaction_required" });
            await expect(
                pca.acquireTokenSilent({
                    ...request,
                    claims: cp1,
                    cacheLookupPolicy: CacheLookupPolicy.AccessToken,
                })
            ).rejects.toMatchObject({ errorCode: "token_refresh_required" });
        }
    );

    it.each([
        BrowserCacheLocation.SessionStorage,
        BrowserCacheLocation.LocalStorage,
    ])("rejects a late CAE completion across PCAs in %s", async (location) => {
        let completeOld!: (value: ReturnType<typeof response>) => void;
        const oldResponse = new Promise<ReturnType<typeof response>>(
            (resolve) => {
                completeOld = resolve;
            }
        );
        let started!: () => void;
        const oldStarted = new Promise<void>((resolve) => {
            started = resolve;
        });
        jest.spyOn(FetchClient.prototype, "sendPostRequestAsync")
            .mockResolvedValueOnce(response("ordinary"))
            .mockImplementationOnce(() => {
                started();
                return oldResponse;
            })
            .mockResolvedValueOnce(response("newer-cae"));
        const { pca, cache } = await application(true, [], location);
        const successes: unknown[] = [];
        pca.addEventCallback((event) => {
            if (event.eventType === EventType.ACQUIRE_TOKEN_SUCCESS) {
                successes.push(event.payload);
            }
        });
        await pca.acquireTokenSilent(request);
        const older = pca.acquireTokenSilent({ ...request, claims: cp1 });
        await oldStarted;
        const other = new PublicClientApplication(config(true, [], location));
        await other.initialize();
        await other.acquireTokenSilent({
            ...request,
            claims: JSON.stringify({
                access_token: {
                    xms_cc: { values: ["CP1"] },
                    auth_time: { essential: true },
                },
            }),
        });
        completeOld(response("older-cae"));
        await expect(older).rejects.toMatchObject({
            errorCode: "cae_token_request_invalidated",
        });
        expect(successes).not.toContainEqual(
            expect.objectContaining({ accessToken: "older-cae" })
        );
        expect((await pca.acquireTokenSilent(request)).accessToken).toBe(
            "ordinary"
        );
        expect(
            (await other.acquireTokenSilent({ ...request, claims: cp1 }))
                .accessToken
        ).toBe("newer-cae");
        expect(cache.getTokenKeys().accessToken).toHaveLength(2);
    });

    it.each([
        BrowserCacheLocation.LocalStorage,
        BrowserCacheLocation.SessionStorage,
    ])(
        "reuses isolated families after reload and toggle rollback in %s",
        async (location) => {
            const post = jest
                .spyOn(FetchClient.prototype, "sendPostRequestAsync")
                .mockResolvedValueOnce(response("ordinary-v4"))
                .mockResolvedValueOnce(response("cae-v4"))
                .mockResolvedValueOnce(response("ordinary-rollback-v3"));
            const { pca, cache } = await application(true, [], location);
            await pca.acquireTokenSilent(request);
            await pca.acquireTokenSilent({ ...request, claims: cp1 });
            expect(
                cache.getTokenKeys(CacheKeys.CREDENTIAL_SCHEMA_VERSION)
                    .accessToken
            ).toHaveLength(0);
            expect(
                cache.getTokenKeys(
                    CacheKeys.CAPABILITY_ACCESS_TOKEN_SCHEMA_VERSION
                ).accessToken
            ).toHaveLength(2);
            expect(cache.getTokenKeys().refreshToken).toHaveLength(1);
            const storage =
                location === BrowserCacheLocation.LocalStorage
                    ? window.localStorage
                    : window.sessionStorage;
            const keys = cache.getTokenKeys(
                CacheKeys.CAPABILITY_ACCESS_TOKEN_SCHEMA_VERSION
            ).accessToken;
            expect(keys.every((key) => key.startsWith("msal.4|"))).toBe(true);
            if (location === BrowserCacheLocation.LocalStorage) {
                expect(JSON.parse(storage.getItem(keys[0])!)).toHaveProperty(
                    "data"
                );
            }
            const reloaded = new PublicClientApplication(
                config(true, [], location)
            );
            await reloaded.initialize();
            expect(
                (await reloaded.acquireTokenSilent(request)).accessToken
            ).toBe("ordinary-v4");
            expect(
                (await reloaded.acquireTokenSilent({ ...request, claims: cp1 }))
                    .accessToken
            ).toBe("cae-v4");
            expect(post).toHaveBeenCalledTimes(2);

            const disabled = new PublicClientApplication(
                config(false, [], location)
            );
            await disabled.initialize();
            expect(
                (await disabled.acquireTokenSilent(request)).accessToken
            ).toBe("ordinary-rollback-v3");
            const enabledAgain = new PublicClientApplication(
                config(true, [], location)
            );
            await enabledAgain.initialize();
            expect(
                (await enabledAgain.acquireTokenSilent(request)).accessToken
            ).toBe("ordinary-v4");
            expect(
                (
                    await enabledAgain.acquireTokenSilent({
                        ...request,
                        claims: cp1,
                    })
                ).accessToken
            ).toBe("cae-v4");
            expect(post).toHaveBeenCalledTimes(3);
            await enabledAgain.clearCache();
            expect(
                storage.getItem(
                    CacheKeys.getTokenKeysCacheKey(
                        TEST_CONFIG.MSAL_CLIENT_ID,
                        4
                    )
                )
            ).toBeNull();
            expect(keys.every((key) => storage.getItem(key) === null)).toBe(
                true
            );
        }
    );

    it("does not overwrite a newer token when invalidation occurs during asynchronous storage", async () => {
        let release!: () => void;
        const paused = new Promise<void>((resolve) => {
            release = resolve;
        });
        let entered!: () => void;
        const enteredStorage = new Promise<void>((resolve) => {
            entered = resolve;
        });
        jest.spyOn(FetchClient.prototype, "sendPostRequestAsync")
            .mockResolvedValueOnce(response("older-storage"))
            .mockResolvedValueOnce(response("newer-storage"));
        const { pca, cache } = await application(
            true,
            [],
            BrowserCacheLocation.LocalStorage
        );
        const setUserData = cache.setUserData.bind(cache);
        jest.spyOn(cache, "setUserData").mockImplementation(
            async (key, value, correlationId, timestamp, kmsi) => {
                if (
                    key.startsWith("msal.4|") &&
                    JSON.parse(value).secret === "older-storage"
                ) {
                    entered();
                    await paused;
                }
                await setUserData(key, value, correlationId, timestamp, kmsi);
            }
        );
        const older = pca.acquireTokenSilent({ ...request, claims: cp1 });
        await enteredStorage;
        await pca.acquireTokenSilent({
            ...request,
            claims: JSON.stringify({
                access_token: {
                    xms_cc: { values: ["CP1"] },
                    auth_time: { essential: true },
                },
            }),
        });
        release();
        await expect(older).rejects.toMatchObject({
            errorCode: "cae_token_request_invalidated",
        });
        expect(
            (await pca.acquireTokenSilent({ ...request, claims: cp1 }))
                .accessToken
        ).toBe("newer-storage");
        expect(cache.getTokenKeys(4).accessToken).toHaveLength(1);
        const persisted = Object.keys(window.localStorage).filter((key) =>
            key.startsWith("msal.4|")
        );
        expect(persisted).toHaveLength(1);
    });

    it("rejects an old acquisition after logout and restoration of the same account", async () => {
        let complete!: (value: ReturnType<typeof response>) => void;
        const held = new Promise<ReturnType<typeof response>>((resolve) => {
            complete = resolve;
        });
        let started!: () => void;
        const ready = new Promise<void>((resolve) => {
            started = resolve;
        });
        jest.spyOn(FetchClient.prototype, "sendPostRequestAsync")
            .mockImplementationOnce(() => {
                started();
                return held;
            })
            .mockResolvedValueOnce(response("new-session"));
        const { pca, cache } = await application(
            true,
            [],
            BrowserCacheLocation.LocalStorage
        );
        const old = pca.acquireTokenSilent({ ...request, claims: cp1 });
        await ready;
        await pca.clearCache();
        await cache.saveCacheRecord(
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
        const newSession = new PublicClientApplication(
            config(true, [], BrowserCacheLocation.LocalStorage)
        );
        await newSession.initialize();
        await newSession.acquireTokenSilent({ ...request, claims: cp1 });
        complete(response("old-session"));
        await expect(old).rejects.toMatchObject({
            errorCode: "cae_token_request_invalidated",
        });
        expect(
            (await newSession.acquireTokenSilent({ ...request, claims: cp1 }))
                .accessToken
        ).toBe("new-session");
    });

    it("rechecks invalidation after hashing before evicting a newer token", async () => {
        let release!: () => void;
        const held = new Promise<void>((resolve) => {
            release = resolve;
        });
        let entered!: () => void;
        const ready = new Promise<void>((resolve) => {
            entered = resolve;
        });
        const originalHash = CryptoOps.prototype.hashString;
        let pause = true;
        jest.spyOn(CryptoOps.prototype, "hashString").mockImplementation(
            async function (this: CryptoOps, value: string) {
                if (pause && value.includes("experimental_cae_capability")) {
                    pause = false;
                    entered();
                    await held;
                }
                return originalHash.call(this, value);
            }
        );
        jest.spyOn(FetchClient.prototype, "sendPostRequestAsync")
            .mockResolvedValueOnce(response("old-hash"))
            .mockResolvedValueOnce(response("new-hash"));
        const { pca } = await application();
        const old = pca.acquireTokenSilent({ ...request, claims: cp1 });
        await ready;
        await pca.acquireTokenSilent({
            ...request,
            claims: JSON.stringify({
                access_token: {
                    xms_cc: { values: ["CP1"] },
                    auth_time: { essential: true },
                },
            }),
        });
        release();
        await expect(old).rejects.toMatchObject({
            errorCode: "cae_token_request_invalidated",
        });
        expect(
            (await pca.acquireTokenSilent({ ...request, claims: cp1 }))
                .accessToken
        ).toBe("new-hash");
    });

    it("invalidates the effective authority tenant rather than the supplied account tenant", async () => {
        const tenant = "22222222-2222-4222-8222-222222222222";
        const idToken = [
            Buffer.from(JSON.stringify({ alg: "none" })).toString("base64url"),
            Buffer.from(
                JSON.stringify({ ...ID_TOKEN_CLAIMS, tid: tenant })
            ).toString("base64url"),
            "synthetic",
        ].join(".");
        jest.spyOn(FetchClient.prototype, "sendPostRequestAsync")
            .mockResolvedValueOnce({
                ...response("tenant-b"),
                body: { ...response("tenant-b").body, id_token: idToken },
            })
            .mockResolvedValueOnce({
                status: 400,
                headers: {},
                body: {
                    error: "interaction_required",
                    error_description: "Synthetic denial",
                },
            });
        const { pca } = await application();
        const targetRequest = {
            ...request,
            authority: `https://login.microsoftonline.com/${tenant}`,
            claims: cp1,
        };
        const result = await pca.acquireTokenSilent(targetRequest);
        await expect(
            pca.acquireTokenSilent({
                ...targetRequest,
                claims: JSON.stringify({
                    access_token: {
                        xms_cc: { values: ["CP1"] },
                        auth_time: { essential: true },
                    },
                }),
            })
        ).rejects.toMatchObject({ errorCode: "interaction_required" });
        await expect(
            pca.acquireTokenSilent({
                ...targetRequest,
                account: result.account!,
                cacheLookupPolicy: CacheLookupPolicy.AccessToken,
            })
        ).rejects.toMatchObject({ errorCode: "token_refresh_required" });
    });

    it.each([
        BrowserCacheLocation.MemoryStorage,
        BrowserCacheLocation.LocalStorage,
    ])(
        "rejects broker configuration in %s before broker discovery",
        (location) => {
            const configuration = config();
            configuration.cache = { cacheLocation: location };
            configuration.system = { allowPlatformBroker: true };
            const postMessage = jest.spyOn(window, "postMessage");
            expect(() => new PublicClientApplication(configuration)).toThrow(
                "experimental_cae_cache_unsupported"
            );
            expect(postMessage).not.toHaveBeenCalled();
        }
    );

    it("rejects each hybrid-code caller before code-only coalescing or network", async () => {
        const post = jest.spyOn(FetchClient.prototype, "sendPostRequestAsync");
        const { pca } = await application();
        await Promise.all(
            [
                { code: "synthetic-code", scopes: ["user.read"] },
                { code: "synthetic-code", scopes: ["user.read"], claims: cp1 },
                {
                    code: "synthetic-code",
                    scopes: ["user.read"],
                    resource: "https://example.test",
                },
            ].map(async (codeRequest) => {
                await expect(
                    pca.acquireTokenByCode(codeRequest)
                ).rejects.toMatchObject({
                    errorCode: "experimental_cae_cache_unsupported",
                });
            })
        );
        expect(post).not.toHaveBeenCalled();
    });

    it.each([
        { authenticationScheme: Constants.AuthenticationScheme.DPOP },
        { attributeTokens: ["unsupported"] },
        { embeddedClientId: "unsupported" },
        { resource: "https://example.test" },
        { extraParameters: { claims: cp1 } },
    ])("rejects unsupported request %j", (overrides) => {
        expect(() =>
            prepareCaeCacheRequest(
                { ...request, ...overrides },
                buildConfiguration(config(), true)
            )
        ).toThrow("experimental_cae_cache_unsupported");
    });

    it.each([ProtocolMode.OIDC])(
        "rejects unsupported protocol %s",
        (protocolMode) => {
            const configuration = config();
            configuration.system = { protocolMode };
            expect(() =>
                prepareCaeCacheRequest(
                    request,
                    buildConfiguration(configuration, true)
                )
            ).toThrow("experimental_cae_cache_unsupported");
        }
    );

    it.each([
        "contoso.onmicrosoft.com",
        TEST_CONFIG.MSAL_TENANT_ID.toUpperCase(),
    ])(
        "resolves canonical generation identity for authority %s",
        async (tenant) => {
            const configuration = config();
            configuration.auth.authority = `https://login.microsoftonline.com/${tenant}`;
            configuration.auth.authorityMetadata = JSON.stringify({
                ...(DEFAULT_OPENID_CONFIG_RESPONSE.body as object),
                token_endpoint: `https://login.microsoftonline.com/${TEST_CONFIG.MSAL_TENANT_ID}/oauth2/v2.0/token`,
                authorization_endpoint: `https://login.microsoftonline.com/${TEST_CONFIG.MSAL_TENANT_ID}/oauth2/v2.0/authorize`,
                issuer: `https://login.microsoftonline.com/${TEST_CONFIG.MSAL_TENANT_ID}/v2.0`,
            });
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
            const post = jest
                .spyOn(FetchClient.prototype, "sendPostRequestAsync")
                .mockResolvedValue(response("canonical"));
            expect(
                (await pca.acquireTokenSilent({ ...request, claims: cp1 }))
                    .accessToken
            ).toBe("canonical");
            expect(
                (await pca.acquireTokenSilent({ ...request, claims: cp1 }))
                    .fromCache
            ).toBe(true);
            expect(post).toHaveBeenCalledTimes(1);
        }
    );

    it.each([
        [
            "https://graph.microsoft.com/.default",
            "https://example.sharepoint.com/.default",
        ],
        [
            "https://example.sharepoint.com/.default",
            "https://graph.microsoft.com/.default",
        ],
    ])(
        "a %s challenge does not cancel healthy %s acquisition",
        async (challenged, healthy) => {
            let complete!: (value: ReturnType<typeof response>) => void;
            const held = new Promise<ReturnType<typeof response>>((resolve) => {
                complete = resolve;
            });
            let started!: () => void;
            const ready = new Promise<void>((resolve) => {
                started = resolve;
            });
            jest.spyOn(FetchClient.prototype, "sendPostRequestAsync")
                .mockImplementationOnce(() => {
                    started();
                    return held;
                })
                .mockResolvedValueOnce(
                    response("challenge-result", challenged)
                );
            const { pca, cache } = await application(
                true,
                [],
                BrowserCacheLocation.SessionStorage
            );
            const pending = pca.acquireTokenSilent({
                account,
                scopes: [healthy],
                claims: cp1,
            });
            await ready;
            await pca.acquireTokenSilent({
                account,
                scopes: [challenged],
                claims: JSON.stringify({
                    access_token: {
                        xms_cc: { values: ["CP1"] },
                        auth_time: { essential: true },
                    },
                }),
            });
            complete(response("healthy-result", healthy));
            expect((await pending).accessToken).toBe("healthy-result");
            expect(
                (
                    await pca.acquireTokenSilent({
                        account,
                        scopes: [healthy],
                        claims: cp1,
                    })
                ).fromCache
            ).toBe(true);
            expect(cache.getTokenKeys(4).accessToken).toHaveLength(2);
        }
    );

    it.each([
        ["User.Read", "https://graph.microsoft.com/User.Read"],
        ["https://graph.microsoft.com/User.Read", "User.Read"],
    ])(
        "invalidates Graph scopes across %s and %s spellings",
        async (first, challenged) => {
            jest.spyOn(FetchClient.prototype, "sendPostRequestAsync")
                .mockResolvedValueOnce(response("rejected-graph", first))
                .mockResolvedValueOnce({
                    status: 400,
                    headers: {},
                    body: {
                        error: "interaction_required",
                        error_description: "Synthetic denial",
                    },
                });
            const { pca } = await application();
            await pca.acquireTokenSilent({
                account,
                scopes: [first],
                claims: cp1,
            });
            await expect(
                pca.acquireTokenSilent({
                    account,
                    scopes: [challenged],
                    claims: JSON.stringify({
                        access_token: {
                            xms_cc: { values: ["CP1"] },
                            auth_time: { essential: true },
                        },
                    }),
                })
            ).rejects.toMatchObject({ errorCode: "interaction_required" });
            await expect(
                pca.acquireTokenSilent({
                    account,
                    scopes: [first],
                    claims: cp1,
                    cacheLookupPolicy: CacheLookupPolicy.AccessToken,
                })
            ).rejects.toMatchObject({ errorCode: "token_refresh_required" });
        }
    );

    it("retains validated named-tenant resolution for offline cache-only requests", async () => {
        const configuration = config();
        configuration.auth.authority =
            "https://login.microsoftonline.com/contoso.onmicrosoft.com";
        const get = jest
            .spyOn(FetchClient.prototype, "sendGetRequestAsync")
            .mockResolvedValue({
                ...DEFAULT_OPENID_CONFIG_RESPONSE,
                body: {
                    ...(DEFAULT_OPENID_CONFIG_RESPONSE.body as object),
                    token_endpoint: `https://login.microsoftonline.com/${TEST_CONFIG.MSAL_TENANT_ID}/oauth2/v2.0/token`,
                    authorization_endpoint: `https://login.microsoftonline.com/${TEST_CONFIG.MSAL_TENANT_ID}/oauth2/v2.0/authorize`,
                    issuer: `https://login.microsoftonline.com/${TEST_CONFIG.MSAL_TENANT_ID}/v2.0`,
                },
            });
        const post = jest
            .spyOn(FetchClient.prototype, "sendPostRequestAsync")
            .mockResolvedValue(response("cached-domain"));
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
        await pca.acquireTokenSilent({ ...request, claims: cp1 });
        expect(get).toHaveBeenCalledTimes(1);
        get.mockRejectedValue(new Error("Offline discovery"));
        const result = await pca.acquireTokenSilent({
            ...request,
            claims: cp1,
            cacheLookupPolicy: CacheLookupPolicy.AccessToken,
        });
        expect(result.accessToken).toBe("cached-domain");
        expect(result.fromCache).toBe(true);
        expect(get).toHaveBeenCalledTimes(1);
        expect(post).toHaveBeenCalledTimes(1);
    });

    it("does not reuse an invalidated promise or let its cleanup remove the replacement", async () => {
        let finishOld!: (value: ReturnType<typeof response>) => void;
        let finishReplacement!: (value: ReturnType<typeof response>) => void;
        const oldResponse = new Promise<ReturnType<typeof response>>(
            (resolve) => {
                finishOld = resolve;
            }
        );
        const replacementResponse = new Promise<ReturnType<typeof response>>(
            (resolve) => {
                finishReplacement = resolve;
            }
        );
        let oldStarted!: () => void;
        let replacementStarted!: () => void;
        const oldReady = new Promise<void>((resolve) => {
            oldStarted = resolve;
        });
        const replacementReady = new Promise<void>((resolve) => {
            replacementStarted = resolve;
        });
        const post = jest
            .spyOn(FetchClient.prototype, "sendPostRequestAsync")
            .mockImplementationOnce(() => {
                oldStarted();
                return oldResponse;
            })
            .mockResolvedValueOnce(response("accepted-challenge"))
            .mockImplementationOnce(() => {
                replacementStarted();
                return replacementResponse;
            });
        const { pca, cache } = await application();
        const old = pca.acquireTokenSilent({ ...request, claims: cp1 });
        await oldReady;
        await pca.acquireTokenSilent({
            ...request,
            claims: JSON.stringify({
                access_token: {
                    xms_cc: { values: ["CP1"] },
                    auth_time: { essential: true },
                },
            }),
        });
        const cached = await pca.acquireTokenSilent({
            ...request,
            claims: cp1,
        });
        expect(cached.accessToken).toBe("accepted-challenge");
        expect(cached.fromCache).toBe(true);
        for (const key of cache.getTokenKeys(4).accessToken) {
            cache.removeAccessToken(key, TEST_CONFIG.CORRELATION_ID);
        }
        const replacement = pca.acquireTokenSilent({ ...request, claims: cp1 });
        await replacementReady;
        finishOld(response("invalidated-original"));
        await expect(old).rejects.toMatchObject({
            errorCode: "cae_token_request_invalidated",
        });
        const duplicate = pca.acquireTokenSilent({ ...request, claims: cp1 });
        finishReplacement(response("replacement"));
        expect((await replacement).accessToken).toBe("replacement");
        expect((await duplicate).accessToken).toBe("replacement");
        expect(post).toHaveBeenCalledTimes(3);
    });

    it.each([
        BrowserCacheLocation.SessionStorage,
        BrowserCacheLocation.LocalStorage,
    ])(
        "explicit CP1-only invalidation survives a failed renewal in %s",
        async (location) => {
            const post = jest
                .spyOn(FetchClient.prototype, "sendPostRequestAsync")
                .mockResolvedValueOnce(response("ordinary"))
                .mockResolvedValueOnce(response("rejected-cae"))
                .mockResolvedValueOnce({
                    status: 400,
                    headers: {},
                    body: {
                        error: "interaction_required",
                        error_description: "Synthetic denial",
                    },
                });
            const { pca, cache } = await application(true, [], location);
            await pca.acquireTokenSilent(request);
            await pca.acquireTokenSilent({ ...request, claims: cp1 });
            await expect(
                pca.acquireTokenSilent({
                    ...request,
                    claims: cp1,
                    invalidateAccessTokenCache: true,
                })
            ).rejects.toMatchObject({ errorCode: "interaction_required" });
            await expect(
                pca.acquireTokenSilent({
                    ...request,
                    claims: cp1,
                    cacheLookupPolicy: CacheLookupPolicy.AccessToken,
                })
            ).rejects.toMatchObject({ errorCode: "token_refresh_required" });
            expect((await pca.acquireTokenSilent(request)).accessToken).toBe(
                "ordinary"
            );
            expect(cache.getTokenKeys().refreshToken).toHaveLength(1);
            expect(post).toHaveBeenCalledTimes(3);
            const body = new URLSearchParams(post.mock.calls[2][1]?.body);
            expect(JSON.parse(body.get("claims")!).access_token).toEqual({
                xms_cc: { values: ["CP1"] },
            });
        }
    );

    it("explicit CP1-only invalidation fences an older request on another instance", async () => {
        let release!: (value: ReturnType<typeof response>) => void;
        const held = new Promise<ReturnType<typeof response>>((resolve) => {
            release = resolve;
        });
        let started!: () => void;
        const ready = new Promise<void>((resolve) => {
            started = resolve;
        });
        jest.spyOn(FetchClient.prototype, "sendPostRequestAsync")
            .mockImplementationOnce(() => {
                started();
                return held;
            })
            .mockResolvedValueOnce(response("replacement"));
        const { pca } = await application(
            true,
            [],
            BrowserCacheLocation.LocalStorage
        );
        const old = pca.acquireTokenSilent({ ...request, claims: cp1 });
        await ready;
        const other = new PublicClientApplication(
            config(true, [], BrowserCacheLocation.LocalStorage)
        );
        await other.initialize();
        await other.acquireTokenSilent({
            ...request,
            claims: cp1,
            invalidateAccessTokenCache: true,
        });
        release(response("older"));
        await expect(old).rejects.toMatchObject({
            errorCode: "cae_token_request_invalidated",
        });
        expect(
            (await other.acquireTokenSilent({ ...request, claims: cp1 }))
                .accessToken
        ).toBe("replacement");
    });

    it("coalesces identical explicit invalidation requests without repeated epoch changes", async () => {
        const post = jest
            .spyOn(FetchClient.prototype, "sendPostRequestAsync")
            .mockResolvedValueOnce(response("initial"))
            .mockResolvedValueOnce(response("replacement"));
        const { pca } = await application();
        await pca.acquireTokenSilent({ ...request, claims: cp1 });
        const results = await Promise.all([
            pca.acquireTokenSilent({
                ...request,
                claims: cp1,
                invalidateAccessTokenCache: true,
            }),
            pca.acquireTokenSilent({
                ...request,
                claims: cp1,
                invalidateAccessTokenCache: true,
            }),
        ]);
        expect(results.map((result) => result.accessToken)).toEqual([
            "replacement",
            "replacement",
        ]);
        expect(post).toHaveBeenCalledTimes(2);
    });

    it("rejects explicit invalidation when disabled or combined with cache-only lookup", async () => {
        const disabled = await application(false);
        await expect(
            disabled.pca.acquireTokenSilent({
                ...request,
                invalidateAccessTokenCache: true,
            })
        ).rejects.toMatchObject({
            errorCode: "experimental_cae_cache_unsupported",
        });
        const enabled = await application();
        await expect(
            enabled.pca.acquireTokenSilent({
                ...request,
                invalidateAccessTokenCache: true,
                cacheLookupPolicy: CacheLookupPolicy.AccessToken,
            })
        ).rejects.toMatchObject({
            errorCode: "experimental_cae_cache_unsupported",
        });
    });

    it("reads newly indexed encrypted tokens before their broadcast arrives", async () => {
        const post = jest
            .spyOn(FetchClient.prototype, "sendPostRequestAsync")
            .mockResolvedValueOnce(response("ordinary-shared"))
            .mockResolvedValueOnce(response("cae-shared"));
        const { pca } = await application(
            true,
            [],
            BrowserCacheLocation.LocalStorage
        );
        const other = new PublicClientApplication(
            config(true, [], BrowserCacheLocation.LocalStorage)
        );
        await other.initialize();
        jest.spyOn(
            BroadcastChannel.prototype,
            "postMessage"
        ).mockImplementation(() => {});
        await pca.acquireTokenSilent(request);
        await pca.acquireTokenSilent({ ...request, claims: cp1 });
        const ordinary = await other.acquireTokenSilent({
            ...request,
            cacheLookupPolicy: CacheLookupPolicy.AccessToken,
        });
        const cae = await other.acquireTokenSilent({
            ...request,
            claims: cp1,
            cacheLookupPolicy: CacheLookupPolicy.AccessToken,
        });
        expect(ordinary.accessToken).toBe("ordinary-shared");
        expect(cae.accessToken).toBe("cae-shared");
        expect(ordinary.fromCache && cae.fromCache).toBe(true);
        expect(post).toHaveBeenCalledTimes(2);
    });

    it.each(["a", "AAAA", "!!!!"])(
        "renews after a missed broadcast contains corrupt encrypted data %s",
        async (data) => {
            const post = jest
                .spyOn(FetchClient.prototype, "sendPostRequestAsync")
                .mockResolvedValueOnce(response("corrupt-cae"))
                .mockResolvedValueOnce(response("renewed-cae"));
            const { pca, cache } = await application(
                true,
                [],
                BrowserCacheLocation.LocalStorage
            );
            const other = new PublicClientApplication(
                config(true, [], BrowserCacheLocation.LocalStorage)
            );
            await other.initialize();
            jest.spyOn(
                BroadcastChannel.prototype,
                "postMessage"
            ).mockImplementation(() => {});
            const diagnostic = jest.spyOn(Logger.prototype, "error");
            await pca.acquireTokenSilent({ ...request, claims: cp1 });
            const key = cache.getTokenKeys(
                CacheKeys.CAPABILITY_ACCESS_TOKEN_SCHEMA_VERSION
            ).accessToken[0];
            const encrypted = JSON.parse(window.localStorage.getItem(key)!);
            window.localStorage.setItem(
                key,
                JSON.stringify({ ...encrypted, data })
            );
            const result = await other.acquireTokenSilent({
                ...request,
                claims: cp1,
            });
            expect(result.accessToken).toBe("renewed-cae");
            expect(result.fromCache).toBe(false);
            expect(post).toHaveBeenCalledTimes(2);
            expect(diagnostic).toHaveBeenCalledWith(
                "Failed to decrypt an indexed cache entry",
                expect.any(String)
            );
        }
    );

    it("does not let a corrupt sibling scope block an encrypted cache hit", async () => {
        const post = jest
            .spyOn(FetchClient.prototype, "sendPostRequestAsync")
            .mockResolvedValueOnce(response("corrupt-mail", "mail.read"))
            .mockResolvedValueOnce(response("healthy-user"));
        const { pca, cache } = await application(
            true,
            [],
            BrowserCacheLocation.LocalStorage
        );
        const other = new PublicClientApplication(
            config(true, [], BrowserCacheLocation.LocalStorage)
        );
        await other.initialize();
        jest.spyOn(
            BroadcastChannel.prototype,
            "postMessage"
        ).mockImplementation(() => {});
        await pca.acquireTokenSilent({
            ...request,
            scopes: ["mail.read"],
            claims: cp1,
        });
        await pca.acquireTokenSilent({ ...request, claims: cp1 });
        const key = cache.getTokenKeys(
            CacheKeys.CAPABILITY_ACCESS_TOKEN_SCHEMA_VERSION
        ).accessToken[0];
        const encrypted = JSON.parse(window.localStorage.getItem(key)!);
        window.localStorage.setItem(
            key,
            JSON.stringify({ ...encrypted, data: "AAAA" })
        );
        const result = await other.acquireTokenSilent({
            ...request,
            claims: cp1,
            cacheLookupPolicy: CacheLookupPolicy.AccessToken,
        });
        expect(result.accessToken).toBe("healthy-user");
        expect(result.fromCache).toBe(true);
        expect(post).toHaveBeenCalledTimes(2);
    });

    it("surfaces unexpected read-through failures instead of renewing silently", async () => {
        const post = jest
            .spyOn(FetchClient.prototype, "sendPostRequestAsync")
            .mockResolvedValueOnce(response("cached-cae"));
        const { pca } = await application(
            true,
            [],
            BrowserCacheLocation.LocalStorage
        );
        const other = new PublicClientApplication(
            config(true, [], BrowserCacheLocation.LocalStorage)
        );
        await other.initialize();
        jest.spyOn(
            BroadcastChannel.prototype,
            "postMessage"
        ).mockImplementation(() => {});
        await pca.acquireTokenSilent({ ...request, claims: cp1 });
        const error = new Error("unexpected crypto failure");
        jest.spyOn(window.crypto.subtle, "decrypt").mockRejectedValueOnce(
            error
        );
        await expect(
            other.acquireTokenSilent({ ...request, claims: cp1 })
        ).rejects.toBe(error);
        expect(post).toHaveBeenCalledTimes(1);
    });

    it("does not restore a token invalidated while decrypting a missed broadcast", async () => {
        const post = jest
            .spyOn(FetchClient.prototype, "sendPostRequestAsync")
            .mockResolvedValueOnce(response("rejected-cae"))
            .mockRejectedValueOnce(new Error("renewal failed"));
        const { pca } = await application(
            true,
            [],
            BrowserCacheLocation.LocalStorage
        );
        const other = new PublicClientApplication(
            config(true, [], BrowserCacheLocation.LocalStorage)
        );
        await other.initialize();
        jest.spyOn(
            BroadcastChannel.prototype,
            "postMessage"
        ).mockImplementation(() => {});
        await pca.acquireTokenSilent({ ...request, claims: cp1 });

        let started!: () => void;
        let release!: () => void;
        const decryptStarted = new Promise<void>((resolve) => {
            started = resolve;
        });
        const blocked = new Promise<void>((resolve) => {
            release = resolve;
        });
        const decrypt = window.crypto.subtle.decrypt.bind(window.crypto.subtle);
        jest.spyOn(window.crypto.subtle, "decrypt").mockImplementationOnce(
            async (...args) => {
                started();
                await blocked;
                return decrypt(...args);
            }
        );
        const cacheOnly = {
            ...request,
            claims: cp1,
            cacheLookupPolicy: CacheLookupPolicy.AccessToken,
        };
        const stale = expect(
            other.acquireTokenSilent(cacheOnly)
        ).rejects.toMatchObject({
            errorCode: "cae_token_request_invalidated",
        });
        try {
            await decryptStarted;
            await expect(
                pca.acquireTokenSilent({
                    ...request,
                    claims: cp1,
                    invalidateAccessTokenCache: true,
                })
            ).rejects.toMatchObject({ errorCode: "network_error" });
            await expect(
                other.acquireTokenSilent(cacheOnly)
            ).rejects.toMatchObject({
                errorCode: "token_refresh_required",
            });
        } finally {
            release();
            await stale;
        }
        await expect(other.acquireTokenSilent(cacheOnly)).rejects.toMatchObject(
            {
                errorCode: "token_refresh_required",
            }
        );
        expect(post).toHaveBeenCalledTimes(2);
    });

    it("rejects unknown capability sets and malformed claims", () => {
        expect(() =>
            prepareCaeCacheRequest(
                request,
                buildConfiguration(config(true, ["CP2"]), true)
            )
        ).toThrow("experimental_cae_cache_unsupported");
        expect(() =>
            prepareCaeCacheRequest(
                { ...request, claims: "{" },
                buildConfiguration(config(), true)
            )
        ).toThrow();
    });
});
