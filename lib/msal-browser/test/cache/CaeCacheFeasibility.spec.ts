/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    AccessTokenEntity,
    AccountEntityUtils,
    CacheHelpers,
    CredentialEntity,
    Logger,
    StubPerformanceClient,
} from "@azure/msal-common/browser";
import { BrowserCacheManager } from "../../src/cache/BrowserCacheManager.js";
import { CryptoOps } from "../../src/crypto/CryptoOps.js";
import { EventHandler } from "../../src/event/EventHandler.js";
import {
    BrowserCacheLocation,
    CacheLookupPolicy,
} from "../../src/utils/BrowserConstants.js";
import { buildConfiguration } from "../../src/config/Configuration.js";
import { prepareWebSilentRequest } from "../../src/request/SilentRequestHelpers.js";
import { SilentRequest } from "../../src/request/SilentRequest.js";
import { PublicClientApplication } from "../../src/app/PublicClientApplication.js";
import { FetchClient } from "../../src/network/FetchClient.js";
import {
    DEFAULT_OPENID_CONFIG_RESPONSE,
    DEFAULT_TENANT_DISCOVERY_RESPONSE,
    TEST_ACCESS_TOKEN_ENTITY,
    TEST_ACCOUNT_ENTITY,
    TEST_CONFIG,
    TEST_REFRESH_TOKEN_ENTITY,
    TEST_TOKEN_RESPONSE,
} from "../utils/StringConstants.js";

type CandidateCredential = CredentialEntity & {
    cacheCapability?: "cp1";
};

// Deliberately incomplete candidate: distinguish keys without changing readers.
class KeyOnlyCandidate extends BrowserCacheManager {
    generateCredentialKey(
        credential: CandidateCredential,
        additionalCacheKeyHash?: string
    ): string {
        const key = super.generateCredentialKey(
            credential,
            additionalCacheKeyHash
        );
        return credential.cacheCapability ? `${key}|cp1` : key;
    }
}

describe("CAE shared-cache feasibility (observed failures, not fix acceptance)", () => {
    const correlationId = TEST_CONFIG.CORRELATION_ID;
    const account = AccountEntityUtils.getAccountInfo(TEST_ACCOUNT_ENTITY);
    const request = {
        scopes: ["user.read"],
        authority: TEST_CONFIG.validAuthority,
        correlationId,
    };
    const logger = new Logger({});
    const cp1Claims = JSON.stringify({
        access_token: { xms_cc: { values: ["CP1"] } },
    });

    function response(secret: string): typeof TEST_TOKEN_RESPONSE {
        return {
            ...TEST_TOKEN_RESPONSE,
            body: {
                ...TEST_TOKEN_RESPONSE.body,
                scope: "user.read",
                access_token: secret,
            },
        };
    }

    function deferred<T>(): {
        promise: Promise<T>;
        resolve: (value: T) => void;
    } {
        let resolve!: (value: T) => void;
        const promise = new Promise<T>((complete) => {
            resolve = complete;
        });
        return { promise, resolve };
    }

    function token(
        secret: string,
        overrides: Partial<AccessTokenEntity> = {}
    ): AccessTokenEntity {
        return {
            ...TEST_ACCESS_TOKEN_ENTITY,
            secret,
            ...overrides,
        };
    }

    async function manager(
        location: BrowserCacheLocation,
        CacheClass: typeof BrowserCacheManager = BrowserCacheManager
    ): Promise<BrowserCacheManager> {
        const cache = new CacheClass(
            TEST_CONFIG.MSAL_CLIENT_ID,
            { cacheLocation: location, cacheRetentionDays: 5 },
            new CryptoOps(logger),
            logger,
            new StubPerformanceClient(),
            new EventHandler(),
            {
                canonicalAuthority: `https://${account.environment}/${account.tenantId}/`,
                knownAuthorities: [account.environment],
            }
        );
        await cache.initialize(correlationId);
        return cache;
    }

    async function save(
        cache: BrowserCacheManager,
        accessToken: AccessTokenEntity
    ): Promise<void> {
        await cache.saveCacheRecord({ accessToken }, correlationId, true, 0);
    }

    async function application(
        location: BrowserCacheLocation,
        clientCapabilities: string[] = []
    ): Promise<PublicClientApplication> {
        const cache = await manager(location);
        await cache.saveCacheRecord(
            {
                account: { ...TEST_ACCOUNT_ENTITY },
                refreshToken: { ...TEST_REFRESH_TOKEN_ENTITY },
            },
            correlationId,
            true,
            0
        );
        const pca = new PublicClientApplication({
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                clientCapabilities,
                authority: TEST_CONFIG.validAuthority,
                authorityMetadata: JSON.stringify(
                    DEFAULT_OPENID_CONFIG_RESPONSE.body
                ),
                cloudDiscoveryMetadata: JSON.stringify(
                    DEFAULT_TENANT_DISCOVERY_RESPONSE.body
                ),
            },
            cache: { cacheLocation: location },
            system: { allowPlatformBroker: false },
        });
        await pca.initialize();
        return pca;
    }

    afterEach(() => {
        jest.restoreAllMocks();
        window.sessionStorage.clear();
        window.localStorage.clear();
    });

    describe.each([
        BrowserCacheLocation.SessionStorage,
        BrowserCacheLocation.LocalStorage,
    ])("%s", (location) => {
        it("configured CP1 can reuse an ordinary token and later replace it", async () => {
            const post = jest
                .spyOn(FetchClient.prototype, "sendPostRequestAsync")
                .mockResolvedValueOnce(response("ordinary-grant"))
                .mockResolvedValueOnce(response("configured-cae"));
            const ordinary = await application(location);
            await ordinary.acquireTokenSilent({ ...request, account });
            const configured = await application(location, ["CP1"]);
            const first = await configured.acquireTokenSilent({
                ...request,
                account,
            });
            expect(first.accessToken).toBe("ordinary-grant");
            expect(first.fromCache).toBe(true);
            expect(post).toHaveBeenCalledTimes(1);
            await configured.acquireTokenSilent({
                ...request,
                account,
                forceRefresh: true,
            });
            expect(
                (await configured.acquireTokenSilent({ ...request, account }))
                    .accessToken
            ).toBe("configured-cae");
            const reloadedOrdinary = await application(location);
            expect(
                (
                    await reloadedOrdinary.acquireTokenSilent({
                        ...request,
                        account,
                    })
                ).accessToken
            ).toBe("configured-cae");
            const body = new URLSearchParams(post.mock.calls[1][1]?.body);
            expect(
                JSON.parse(body.get("claims")!).access_token.xms_cc.values
            ).toEqual(["CP1"]);
            expect(post).toHaveBeenCalledTimes(2);
        });

        it("actual refresh grants collide and repeated CP1 requests bypass the cache", async () => {
            const post = jest
                .spyOn(FetchClient.prototype, "sendPostRequestAsync")
                .mockResolvedValueOnce(response("ordinary-grant"))
                .mockResolvedValueOnce(response("cae-grant"))
                .mockResolvedValueOnce(response("cae-renewed"));
            const get = jest
                .spyOn(FetchClient.prototype, "sendGetRequestAsync")
                .mockRejectedValue(new Error("Unexpected discovery request"));
            const pca = await application(location);
            const silentRequest = { ...request, account };

            const ordinary = await pca.acquireTokenSilent(silentRequest);
            expect(ordinary.accessToken).toBe("ordinary-grant");
            expect(ordinary.fromCache).toBe(false);
            const cae = await pca.acquireTokenSilent({
                ...silentRequest,
                claims: cp1Claims,
            });
            expect(cae.accessToken).toBe("cae-grant");
            const contaminated = await pca.acquireTokenSilent(silentRequest);
            expect(contaminated.accessToken).toBe("cae-grant");
            expect(contaminated.fromCache).toBe(true);
            const repeatedCae = await pca.acquireTokenSilent({
                ...silentRequest,
                claims: cp1Claims,
            });
            expect(repeatedCae.accessToken).toBe("cae-renewed");
            expect(repeatedCae.fromCache).toBe(false);
            expect(post).toHaveBeenCalledTimes(3);
            const bodies = post.mock.calls.map(
                ([, options]) => new URLSearchParams(options?.body)
            );
            expect(
                JSON.parse(bodies[0].get("claims") || "{}").access_token?.xms_cc
            ).toBeUndefined();
            expect(
                JSON.parse(bodies[1].get("claims")!).access_token.xms_cc
            ).toEqual({ values: ["CP1"] });
            for (const body of bodies) {
                expect(body.get("grant_type")).toBe("refresh_token");
                expect(body.get("refresh_token")).toBe(
                    TEST_REFRESH_TOKEN_ENTITY.secret
                );
            }
            expect(get).not.toHaveBeenCalled();
        });

        it("a rejected challenge renewal leaves the previous token available", async () => {
            const post = jest
                .spyOn(FetchClient.prototype, "sendPostRequestAsync")
                .mockResolvedValueOnce(response("rejected-by-resource"))
                .mockResolvedValueOnce({
                    status: 400,
                    headers: {},
                    body: {
                        error: "interaction_required",
                        error_description: "Synthetic challenge denial",
                    },
                });
            const pca = await application(location);
            await pca.acquireTokenSilent({
                ...request,
                account,
                claims: cp1Claims,
            });
            await expect(
                pca.acquireTokenSilent({
                    ...request,
                    account,
                    cacheLookupPolicy: CacheLookupPolicy.RefreshToken,
                    claims: JSON.stringify({
                        access_token: {
                            xms_cc: { values: ["CP1"] },
                            auth_time: { essential: true },
                        },
                    }),
                })
            ).rejects.toMatchObject({ errorCode: "interaction_required" });
            const cached = await pca.acquireTokenSilent({
                ...request,
                account,
                cacheLookupPolicy: CacheLookupPolicy.AccessToken,
            });
            expect(cached.accessToken).toBe("rejected-by-resource");
            expect(cached.fromCache).toBe(true);
            expect(post).toHaveBeenCalledTimes(2);
        });

        it("an older in-flight grant overwrites a completed challenge renewal", async () => {
            const oldGrant = deferred<typeof TEST_TOKEN_RESPONSE>();
            const oldStarted = deferred<void>();
            const post = jest
                .spyOn(FetchClient.prototype, "sendPostRequestAsync")
                .mockImplementationOnce(() => {
                    oldStarted.resolve();
                    return oldGrant.promise;
                })
                .mockResolvedValueOnce(response("newer-challenge"));
            const pca = await application(location);
            const older = pca.acquireTokenSilent({
                ...request,
                account,
                claims: cp1Claims,
            });
            await oldStarted.promise;
            const newer = await pca.acquireTokenSilent({
                ...request,
                account,
                claims: JSON.stringify({
                    access_token: {
                        xms_cc: { values: ["CP1"] },
                        auth_time: { essential: true },
                    },
                }),
            });
            expect(newer.accessToken).toBe("newer-challenge");
            oldGrant.resolve(response("older-completed-last"));
            expect((await older).accessToken).toBe("older-completed-last");
            expect(
                (await pca.acquireTokenSilent({ ...request, account }))
                    .accessToken
            ).toBe("older-completed-last");
            expect(post).toHaveBeenCalledTimes(2);
        });

        it("deduplicates matching CAE calls without merging an ordinary grant", async () => {
            const caeGrant = deferred<typeof TEST_TOKEN_RESPONSE>();
            const caeStarted = deferred<void>();
            const post = jest
                .spyOn(FetchClient.prototype, "sendPostRequestAsync")
                .mockImplementationOnce(() => {
                    caeStarted.resolve();
                    return caeGrant.promise;
                })
                .mockResolvedValueOnce(response("ordinary-concurrent"));
            const pca = await application(location);
            const first = pca.acquireTokenSilent({
                ...request,
                account,
                claims: cp1Claims,
            });
            const duplicate = pca.acquireTokenSilent({
                ...request,
                account,
                claims: cp1Claims,
            });
            await caeStarted.promise;
            expect(
                (await pca.acquireTokenSilent({ ...request, account }))
                    .accessToken
            ).toBe("ordinary-concurrent");
            caeGrant.resolve(response("cae-concurrent"));
            expect((await first).accessToken).toBe("cae-concurrent");
            expect((await duplicate).accessToken).toBe("cae-concurrent");
            expect(post).toHaveBeenCalledTimes(2);
            expect(
                (await pca.acquireTokenSilent({ ...request, account }))
                    .accessToken
            ).toBe("cae-concurrent");
        });

        it.each([
            ["ordinary", "cae"],
            ["cae", "ordinary"],
        ])(
            "retains only the last %s -> %s token, including on reload",
            async (first, last) => {
                const cache = await manager(location);
                await cache.saveCacheRecord(
                    {
                        account: { ...TEST_ACCOUNT_ENTITY },
                        refreshToken: { ...TEST_REFRESH_TOKEN_ENTITY },
                    },
                    correlationId,
                    true,
                    0
                );
                await save(cache, token(first));
                await save(cache, token(last));

                expect(cache.getTokenKeys().accessToken).toHaveLength(1);
                expect(cache.getAccessToken(account, request)?.secret).toBe(
                    last
                );
                const reloaded = await manager(location);
                expect(reloaded.getAccessToken(account, request)?.secret).toBe(
                    last
                );
                expect(
                    reloaded.getRefreshToken(account, false, correlationId)
                        ?.secret
                ).toBe(TEST_REFRESH_TOKEN_ENTITY.secret);
                expect(reloaded.getAllAccounts({}, correlationId)).toHaveLength(
                    1
                );
            }
        );

        it("evicts an ordinary token on a partially overlapping CAE write", async () => {
            const cache = await manager(location);
            await save(
                cache,
                token("ordinary", { target: "user.read mail.read" })
            );
            await save(cache, token("cae", { target: "mail.read files.read" }));
            expect(cache.getTokenKeys().accessToken).toHaveLength(1);
            expect(cache.getAccessToken(account, request)).toBeNull();
            expect(
                cache.getAccessToken(account, {
                    ...request,
                    scopes: ["mail.read"],
                })?.secret
            ).toBe("cae");
        });

        it("a capability suffix alone does not prevent ordinary-token eviction", async () => {
            const cache = await manager(location, KeyOnlyCandidate);
            const ordinary = token("ordinary");
            const cae = { ...token("cae"), cacheCapability: "cp1" as const };
            expect(cache.generateCredentialKey(ordinary)).not.toBe(
                cache.generateCredentialKey(cae)
            );
            await save(cache, ordinary);
            await save(cache, cae);
            expect(cache.getTokenKeys().accessToken).toHaveLength(1);
            expect(cache.getAccessToken(account, request)?.secret).toBe("cae");
        });

        it("a key-only reader clears both tokens when eviction is bypassed", async () => {
            const cache = await manager(location, KeyOnlyCandidate);
            const cae = { ...token("cae"), cacheCapability: "cp1" as const };
            await cache.setAccessTokenCredential(
                token("ordinary"),
                correlationId,
                true
            );
            await cache.setAccessTokenCredential(cae, correlationId, true);
            expect(cache.getTokenKeys().accessToken).toHaveLength(2);
            expect(cache.getAccessToken(account, request)).toBeNull();
            expect(cache.getTokenKeys().accessToken).toHaveLength(0);
        });

        it("additional component metadata alone still evicts the ordinary token", async () => {
            const cache = await manager(location);
            await save(cache, token("ordinary"));
            await save(
                cache,
                token("cae", {
                    additionalCacheKeyComponents: { cache_capability: "cp1" },
                })
            );
            expect(cache.getTokenKeys().accessToken).toHaveLength(1);
            expect(cache.getAccessToken(account, request)).toBeNull();
        });

        it("distinct component values accumulate rather than replace overlapping tokens", async () => {
            const cache = await manager(location);
            for (let i = 0; i < 12; i++) {
                await save(
                    cache,
                    token(`challenge-${i}`, {
                        additionalCacheKeyComponents: {
                            challenge: `challenge-${i}`,
                        },
                    })
                );
            }
            expect(cache.getTokenKeys().accessToken).toHaveLength(12);
            const reloaded = await manager(location);
            expect(reloaded.getTokenKeys().accessToken).toHaveLength(12);
        });

        it("late completion overwrites a newer accepted result", async () => {
            const cache = await manager(location);
            await save(cache, token("newer-challenge-result"));
            await save(cache, token("older-request-completed-last"));
            expect(cache.getAccessToken(account, request)?.secret).toBe(
                "older-request-completed-last"
            );
            const reloaded = await manager(location);
            expect(reloaded.getAccessToken(account, request)?.secret).toBe(
                "older-request-completed-last"
            );
        });

        it("an unknown legacy CAE entry remains readable by an ordinary reader", async () => {
            const cache = await manager(location);
            await save(cache, token("legacy-cae"));
            const reloaded = await manager(location);
            expect(reloaded.getAccessToken(account, request)?.secret).toBe(
                "legacy-cae"
            );
        });
    });

    it.each([
        { homeAccountId: "different.synthetic-account" },
        { environment: "different.example.test" },
        { realm: "different-tenant" },
        { clientId: "different-client" },
        { target: "https://different.example.test/.default" },
    ])(
        "preserves existing identity/resource isolation: %j",
        async (overrides) => {
            const cache = await manager(BrowserCacheLocation.SessionStorage);
            await save(cache, token("ordinary"));
            await save(cache, token("unrelated", overrides));
            expect(cache.getTokenKeys().accessToken).toHaveLength(2);
            expect(cache.getAccessToken(account, request)?.secret).toBe(
                "ordinary"
            );
        }
    );

    it("old entity validation rejects a distinct capability credential type", () => {
        expect(
            CacheHelpers.isAccessTokenEntity({
                ...token("cae"),
                credentialType: "AccessTokenWithCapability",
            })
        ).toBe(false);
    });

    describe("silent request identity", () => {
        function key(overrides: Partial<SilentRequest>): string {
            return prepareWebSilentRequest({
                request: { ...request, ...overrides },
                account,
                correlationId,
                config: buildConfiguration(
                    { auth: { clientId: TEST_CONFIG.MSAL_CLIENT_ID } },
                    true
                ),
            }).key;
        }

        it("distinguishes per-request CP1 claims from ordinary requests", () => {
            expect(
                key({
                    claims: JSON.stringify({
                        access_token: { xms_cc: { values: ["CP1"] } },
                    }),
                })
            ).not.toBe(key({}));
        });

        it("distinguishes forced refresh and cache lookup policies", () => {
            expect(key({ forceRefresh: true })).not.toBe(key({}));
            expect(
                key({ cacheLookupPolicy: CacheLookupPolicy.RefreshToken })
            ).not.toBe(key({}));
        });

        it("does not distinguish conflicting access-token write policies", () => {
            expect(key({ storeInCache: { accessToken: false } })).toBe(
                key({ storeInCache: { accessToken: true } })
            );
        });
    });
});
