/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AccountEntityUtils } from "@azure/msal-common/browser";
import { PublicClientApplication } from "../../src/app/PublicClientApplication.js";
import { Configuration } from "../../src/config/Configuration.js";
import { StandardController } from "../../src/controllers/StandardController.js";
import { StandardOperatingContext } from "../../src/operatingcontext/StandardOperatingContext.js";
import { loadExternalTokens } from "../../src/cache/TokenCache.js";
import { FetchClient } from "../../src/network/FetchClient.js";
import { IPlatformAuthHandler } from "../../src/broker/nativeBroker/IPlatformAuthHandler.js";
import { PlatformAuthRequest } from "../../src/broker/nativeBroker/PlatformAuthRequest.js";
import { BrowserCacheLocation } from "../../src/utils/BrowserConstants.js";
import {
    DEFAULT_OPENID_CONFIG_RESPONSE,
    DEFAULT_TENANT_DISCOVERY_RESPONSE,
    TEST_ACCOUNT_ENTITY,
    TEST_REFRESH_TOKEN_ENTITY,
    TEST_CONFIG,
    TEST_TOKEN_RESPONSE,
} from "../utils/StringConstants.js";

class FixtureController extends StandardController {
    enableBroker(provider: IPlatformAuthHandler) {
        this.config.system.allowPlatformBroker = true;
        this.platformAuthProvider = provider;
    }

    get cache() {
        return this.browserStorage;
    }
}

describe("Ordinary/CP1 token partitioning", () => {
    const account = AccountEntityUtils.getAccountInfo(TEST_ACCOUNT_ENTITY);
    const request = { account, scopes: ["user.read"] };
    const cp1 = JSON.stringify({
        access_token: { xms_cc: { values: ["CP1"] } },
    });

    function config(
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
            system: { allowPlatformBroker: false },
        };
    }

    async function application(
        capabilities: string[] = [],
        location: BrowserCacheLocation = BrowserCacheLocation.MemoryStorage
    ) {
        const configuration = config(capabilities, location);
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
        return { pca, cache: controller.cache, controller };
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

    it("reuses simultaneous ordinary and CP1 tokens with one refresh-token cache", async () => {
        const post = jest
            .spyOn(FetchClient.prototype, "sendPostRequestAsync")
            .mockResolvedValueOnce(response("cp1"))
            .mockResolvedValueOnce(response("ordinary"));
        const { pca, cache } = await application();
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
        expect(cache.getTokenKeys().accessToken).toHaveLength(2);
        expect(cache.getTokenKeys().refreshToken).toHaveLength(1);
    });

    it.each([
        BrowserCacheLocation.LocalStorage,
        BrowserCacheLocation.SessionStorage,
    ])("reuses both token families after reload in %s", async (location) => {
        const post = jest
            .spyOn(FetchClient.prototype, "sendPostRequestAsync")
            .mockResolvedValueOnce(response("ordinary"))
            .mockResolvedValueOnce(response("cp1"));
        const { pca, cache } = await application([], location);
        await pca.acquireTokenSilent(request);
        await pca.acquireTokenSilent({ ...request, claims: cp1 });
        const reload = new PublicClientApplication(config([], location));
        await reload.initialize();
        expect((await reload.acquireTokenSilent(request)).accessToken).toBe(
            "ordinary"
        );
        expect(
            (await reload.acquireTokenSilent({ ...request, claims: cp1 }))
                .accessToken
        ).toBe("cp1");
        expect(post).toHaveBeenCalledTimes(2);
        expect(cache.getTokenKeys(4).accessToken).toHaveLength(2);
        await reload.clearCache();
        expect(cache.getTokenKeys().accessToken).toHaveLength(0);
        expect(cache.getTokenKeys().refreshToken).toHaveLength(0);
    });

    it.each([{ capabilities: ["CP1"] }, { capabilities: ["CP1", "CP2"] }])(
        "merges configured capabilities before lookup and preserves explicit challenge renewal: %j",
        async ({ capabilities }) => {
            const post = jest
                .spyOn(FetchClient.prototype, "sendPostRequestAsync")
                .mockResolvedValueOnce(response("configured"))
                .mockResolvedValueOnce(response("challenge"))
                .mockResolvedValueOnce(response("forced"));
            const { pca } = await application(capabilities);
            expect((await pca.acquireTokenSilent(request)).accessToken).toBe(
                "configured"
            );
            expect((await pca.acquireTokenSilent(request)).fromCache).toBe(
                true
            );
            const challenge = JSON.stringify({
                access_token: { auth_time: { essential: true } },
            });
            expect(
                (
                    await pca.acquireTokenSilent({
                        ...request,
                        claims: challenge,
                    })
                ).accessToken
            ).toBe("challenge");
            expect(
                (
                    await pca.acquireTokenSilent({
                        ...request,
                        forceRefresh: true,
                    })
                ).accessToken
            ).toBe("forced");
            expect(post).toHaveBeenCalledTimes(3);
        }
    );

    it("composes attribute-token and capability partitions", async () => {
        const post = jest
            .spyOn(FetchClient.prototype, "sendPostRequestAsync")
            .mockResolvedValueOnce(response("ordinary-alpha"))
            .mockResolvedValueOnce(response("cp1-alpha"))
            .mockResolvedValueOnce(response("cp1-beta"));
        const { pca } = await application();
        for (const [claims, attribute, token] of [
            [undefined, "alpha", "ordinary-alpha"],
            [cp1, "alpha", "cp1-alpha"],
            [cp1, "beta", "cp1-beta"],
        ]) {
            const attributed = {
                ...request,
                claims,
                attributeTokens: [attribute!],
            };
            expect((await pca.acquireTokenSilent(attributed)).accessToken).toBe(
                token
            );
            expect((await pca.acquireTokenSilent(attributed)).fromCache).toBe(
                true
            );
        }
        expect(post).toHaveBeenCalledTimes(3);
    });

    it("preserves explicit xms_cc requirements when configured capabilities are merged", async () => {
        const post = jest
            .spyOn(FetchClient.prototype, "sendPostRequestAsync")
            .mockResolvedValueOnce(response("configured"))
            .mockResolvedValueOnce(response("challenged"));
        const { pca } = await application(["CP1"]);
        await pca.acquireTokenSilent(request);
        const required = JSON.stringify({
            access_token: { xms_cc: { values: ["CP1"], essential: true } },
        });
        expect(
            (await pca.acquireTokenSilent({ ...request, claims: required }))
                .accessToken
        ).toBe("challenged");
        expect(post).toHaveBeenCalledTimes(2);
        const body = new URLSearchParams(post.mock.calls[1][1]?.body);
        expect(JSON.parse(body.get("claims")!).access_token.xms_cc).toEqual({
            values: ["CP1"],
            essential: true,
        });
        await expect(
            pca.acquireTokenSilent({
                ...request,
                claims: '{"access_token":{"xms_cc":{"values":[123]}}}',
            })
        ).rejects.toMatchObject({ errorCode: "invalid_claims" });
        expect(post).toHaveBeenCalledTimes(2);
    });

    it("does not coalesce web requests whose effective broker capabilities differ", async () => {
        const post = jest
            .spyOn(FetchClient.prototype, "sendPostRequestAsync")
            .mockImplementation(async (_url, options) => {
                const body = new URLSearchParams(options?.body);
                return response(
                    JSON.parse(body.get("claims")!).access_token?.xms_cc
                        ? "cp1"
                        : "ordinary"
                );
            });
        const { pca } = await application(["CP1"]);
        const brokerRequest = {
            ...request,
            extraParameters: { brk_client_id: TEST_CONFIG.MSAL_CLIENT_ID },
        };
        const [ordinary, capable] = await Promise.all([
            pca.acquireTokenSilent({
                ...brokerRequest,
                skipBrokerClaims: true,
            }),
            pca.acquireTokenSilent({
                ...brokerRequest,
                skipBrokerClaims: false,
            }),
        ]);
        expect(ordinary.accessToken).toBe("ordinary");
        expect(capable.accessToken).toBe("cp1");
        expect(post).toHaveBeenCalledTimes(2);
    });

    it("does not coalesce native requests whose raw broker capability policy differs", async () => {
        jest.spyOn(
            FetchClient.prototype,
            "sendPostRequestAsync"
        ).mockResolvedValue(response("ordinary"));
        const source = await application();
        const ordinary = await source.pca.acquireTokenSilent(request);
        const { pca, controller } = await application(["CP1"]);
        const nativeAccount = {
            ...ordinary.account,
            nativeAccountId: "nativeAccountId",
        };
        const sendMessage = jest.fn(async (_request: PlatformAuthRequest) => {
            throw new Error("Broker called");
        });
        controller.enableBroker({
            getExtensionId: () => undefined,
            getExtensionName: () => "com.microsoft.browsercore",
            getExtensionVersion: () => "1.0.0",
            sendMessage,
        });
        const brokerRequest = {
            ...request,
            account: nativeAccount,
            extraParameters: { brk_client_id: TEST_CONFIG.MSAL_CLIENT_ID },
        };
        await pca.hydrateCache(
            { ...ordinary, account: nativeAccount, fromPlatformBroker: true },
            { ...brokerRequest, skipBrokerClaims: true }
        );
        const results = await Promise.allSettled([
            pca.acquireTokenSilent({
                ...brokerRequest,
                skipBrokerClaims: true,
            }),
            pca.acquireTokenSilent({
                ...brokerRequest,
                skipBrokerClaims: false,
            }),
        ]);
        expect(results[0]).toMatchObject({
            status: "fulfilled",
            value: { accessToken: "ordinary" },
        });
        expect(results[1]).toMatchObject({
            status: "rejected",
            reason: expect.objectContaining({ message: "Broker called" }),
        });
        expect(sendMessage).toHaveBeenCalledTimes(1);
        expect(
            JSON.parse(sendMessage.mock.calls[0][0].claims!).access_token.xms_cc
                .values
        ).toEqual(["CP1"]);
    });

    it("hydrates a configured CP1 token without introducing a cache-specific API", async () => {
        const post = jest
            .spyOn(FetchClient.prototype, "sendPostRequestAsync")
            .mockResolvedValue(response("source"));
        const source = await application();
        const result = await source.pca.acquireTokenSilent(request);
        const target = await application(["CP1"]);
        await target.pca.hydrateCache(
            { ...result, accessToken: "hydrated" },
            request
        );
        expect((await target.pca.acquireTokenSilent(request)).accessToken).toBe(
            "hydrated"
        );
        expect(post).toHaveBeenCalledTimes(1);
    });

    it("preserves capability and challenge claims through broker cache lookup", async () => {
        jest.spyOn(
            FetchClient.prototype,
            "sendPostRequestAsync"
        ).mockResolvedValue(response("ordinary"));
        const { pca, controller } = await application();
        const ordinary = await pca.acquireTokenSilent(request);
        const nativeAccount = {
            ...ordinary.account,
            nativeAccountId: "nativeAccountId",
        };
        const sendMessage = jest.fn(async (_request: PlatformAuthRequest) => {
            throw new Error("Broker called");
        });
        controller.enableBroker({
            getExtensionId: () => undefined,
            getExtensionName: () => "com.microsoft.browsercore",
            getExtensionVersion: () => "1.0.0",
            sendMessage,
        });
        const nativeRequest = { ...request, account: nativeAccount };
        const nativeResult = {
            ...ordinary,
            account: nativeAccount,
            fromPlatformBroker: true,
        };
        await pca.hydrateCache(nativeResult, nativeRequest);
        await expect(
            pca.acquireTokenSilent({ ...nativeRequest, claims: cp1 })
        ).rejects.toThrow("Broker called");
        expect(sendMessage).toHaveBeenCalledTimes(1);
        await pca.hydrateCache(
            { ...nativeResult, accessToken: "native-cp1" },
            { ...nativeRequest, claims: cp1 }
        );
        expect(
            (await pca.acquireTokenSilent({ ...nativeRequest, claims: cp1 }))
                .accessToken
        ).toBe("native-cp1");
        expect((await pca.acquireTokenSilent(nativeRequest)).accessToken).toBe(
            "ordinary"
        );
        expect(sendMessage).toHaveBeenCalledTimes(1);
        await expect(
            pca.acquireTokenSilent({
                ...nativeRequest,
                claims: JSON.stringify({
                    access_token: {
                        xms_cc: { values: ["CP1"] },
                        auth_time: { essential: true },
                    },
                }),
            })
        ).rejects.toThrow("Broker called");
        expect(sendMessage).toHaveBeenCalledTimes(2);
    });

    it("keeps skipped broker capabilities out of both outgoing claims and cache selection", async () => {
        jest.spyOn(
            FetchClient.prototype,
            "sendPostRequestAsync"
        ).mockResolvedValue(response("ordinary"));
        const source = await application();
        const ordinary = await source.pca.acquireTokenSilent(request);
        const { pca, controller } = await application(["CP1"]);
        const nativeAccount = {
            ...ordinary.account,
            nativeAccountId: "nativeAccountId",
        };
        const sendMessage = jest.fn(async (_request: PlatformAuthRequest) => {
            throw new Error("Broker called");
        });
        controller.enableBroker({
            getExtensionId: () => undefined,
            getExtensionName: () => "com.microsoft.browsercore",
            getExtensionVersion: () => "1.0.0",
            sendMessage,
        });
        const nativeRequest = {
            ...request,
            account: nativeAccount,
            embeddedClientId: "embedded-app",
            skipBrokerClaims: true,
        };
        await pca.hydrateCache(
            { ...ordinary, account: nativeAccount, fromPlatformBroker: true },
            nativeRequest
        );
        expect((await pca.acquireTokenSilent(nativeRequest)).accessToken).toBe(
            "ordinary"
        );
        expect(sendMessage).not.toHaveBeenCalled();
        await expect(
            pca.acquireTokenSilent({
                ...nativeRequest,
                scopes: ["another.scope"],
            })
        ).rejects.toThrow("Broker called");
        expect(
            JSON.parse(sendMessage.mock.calls[0][0].claims!).access_token
                ?.xms_cc
        ).toBeUndefined();
    });

    it.each([
        { embeddedClientId: "embedded-app" },
        {
            extraParameters: {
                brk_client_id: TEST_CONFIG.MSAL_CLIENT_ID,
                brk_redirect_uri: "https://localhost",
            },
        },
    ])(
        "preserves skipped capabilities through brokered web lookup and renewal: %j",
        async (brokerParameters) => {
            const post = jest
                .spyOn(FetchClient.prototype, "sendPostRequestAsync")
                .mockResolvedValueOnce(response("ordinary"))
                .mockResolvedValueOnce(response("ordinary-renewed"))
                .mockResolvedValueOnce(response("configured-cp1"));
            const source = await application();
            const ordinary = await source.pca.acquireTokenSilent(request);
            const { pca } = await application(["CP1"]);
            const embeddedRequest = {
                ...request,
                ...brokerParameters,
                skipBrokerClaims: true,
            };
            await pca.hydrateCache(ordinary, embeddedRequest);
            expect(
                (await pca.acquireTokenSilent(embeddedRequest)).accessToken
            ).toBe("ordinary");
            expect(post).toHaveBeenCalledTimes(1);
            expect(
                (
                    await pca.acquireTokenSilent({
                        ...embeddedRequest,
                        forceRefresh: true,
                    })
                ).accessToken
            ).toBe("ordinary-renewed");
            const embeddedBody = new URLSearchParams(
                post.mock.calls[1][1]?.body
            );
            expect(embeddedBody.get("brk_client_id")).toBe(
                TEST_CONFIG.MSAL_CLIENT_ID
            );
            expect(
                JSON.parse(embeddedBody.get("claims")!).access_token?.xms_cc
            ).toBeUndefined();
            expect(
                (
                    await pca.acquireTokenSilent({
                        ...request,
                        skipBrokerClaims: true,
                    })
                ).accessToken
            ).toBe("configured-cp1");
            const ordinaryBody = new URLSearchParams(
                post.mock.calls[2][1]?.body
            );
            expect(
                JSON.parse(ordinaryBody.get("claims")!).access_token.xms_cc
                    .values
            ).toEqual(["CP1"]);
        }
    );

    it("imports a token using the request's capability and reuses it", async () => {
        const configuration = config([], BrowserCacheLocation.SessionStorage);
        const { pca } = await application(
            [],
            BrowserCacheLocation.SessionStorage
        );
        await loadExternalTokens(
            configuration,
            { ...request, claims: cp1 },
            {
                ...TEST_TOKEN_RESPONSE.body,
                access_token: "imported-cp1",
                scope: "user.read",
            },
            {}
        );
        expect(
            (await pca.acquireTokenSilent({ ...request, claims: cp1 }))
                .accessToken
        ).toBe("imported-cp1");
    });
});
