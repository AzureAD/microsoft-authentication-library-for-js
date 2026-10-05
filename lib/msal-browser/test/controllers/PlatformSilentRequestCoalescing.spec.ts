/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    AccountInfo,
    AuthError,
    AzureCloudInstance,
    Constants,
    PerformanceEvent,
    PopTokenGenerator,
    getRequestThumbprint,
} from "@azure/msal-common/browser";
import { PlatformAuthExtensionHandler } from "../../src/broker/nativeBroker/PlatformAuthExtensionHandler.js";
import { PlatformAuthDOMHandler } from "../../src/broker/nativeBroker/PlatformAuthDOMHandler.js";
import { PlatformAuthRequest } from "../../src/broker/nativeBroker/PlatformAuthRequest.js";
import { PlatformAuthResponse } from "../../src/broker/nativeBroker/PlatformAuthResponse.js";
import { Configuration } from "../../src/config/Configuration.js";
import { StandardController } from "../../src/controllers/StandardController.js";
import {
    createNativeAuthError,
    NativeAuthErrorCodes,
} from "../../src/error/NativeAuthError.js";
import { PlatformAuthInteractionClient } from "../../src/interaction_client/PlatformAuthInteractionClient.js";
import { SilentIframeClient } from "../../src/interaction_client/SilentIframeClient.js";
import { SilentCacheClient } from "../../src/interaction_client/SilentCacheClient.js";
import { StandardOperatingContext } from "../../src/operatingcontext/StandardOperatingContext.js";
import { SilentRequest } from "../../src/request/SilentRequest.js";
import { SsoSilentRequest } from "../../src/request/SsoSilentRequest.js";
import { AuthenticationResult } from "../../src/response/AuthenticationResult.js";
import { BrowserPerformanceClient } from "../../src/telemetry/BrowserPerformanceClient.js";
import { ApiId, CacheLookupPolicy } from "../../src/utils/BrowserConstants.js";
import {
    ID_TOKEN_CLAIMS,
    DEFAULT_OPENID_CONFIG_RESPONSE,
    TEST_CONFIG,
    TEST_DATA_CLIENT_INFO,
    TEST_TOKENS,
} from "../utils/StringConstants.js";

type BrokerRequest = SsoSilentRequest &
    Pick<SilentRequest, "forceRefresh" | "cacheLookupPolicy"> & {
        extraParametersNoCache?: PlatformAuthRequest["extraParametersNoCache"];
        dpopNonce?: string;
    };

const account: AccountInfo = {
    homeAccountId: TEST_DATA_CLIENT_INFO.TEST_HOME_ACCOUNT_ID,
    localAccountId: TEST_DATA_CLIENT_INFO.TEST_UID,
    environment: "login.microsoftonline.com",
    tenantId: ID_TOKEN_CLAIMS.tid,
    username: "user@contoso.com",
    nativeAccountId: "native-account",
};

const result: AuthenticationResult = {
    authority: TEST_CONFIG.validAuthority,
    uniqueId: account.localAccountId,
    tenantId: account.tenantId,
    scopes: ["User.Read"],
    idToken: TEST_TOKENS.IDTOKEN_V2,
    idTokenClaims: ID_TOKEN_CLAIMS,
    accessToken: TEST_TOKENS.ACCESS_TOKEN,
    fromCache: false,
    correlationId: "operation",
    expiresOn: new Date(Date.now() + 3600000),
    account,
    tokenType: Constants.AuthenticationScheme.BEARER,
    fromPlatformBroker: true,
};

const brokerResponse: PlatformAuthResponse = {
    access_token: TEST_TOKENS.ACCESS_TOKEN,
    id_token: TEST_TOKENS.IDTOKEN_V2,
    scope: "User.Read",
    expires_in: 3600,
    client_info: TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO,
    account: {
        id: "native-account",
        properties: {},
        userName: account.username,
    },
    properties: {},
    state: "",
};

function deferred<T>() {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>((res) => {
        resolve = res;
    });
    return { promise, resolve };
}

describe("platform broker silent request coalescing", () => {
    let controller: StandardController;
    let config: Configuration;
    let performanceClient: BrowserPerformanceClient;
    let provider: PlatformAuthExtensionHandler;

    function acquireSilent(request: BrokerRequest) {
        return controller.acquireTokenSilent({
            ...request,
            scopes: request.scopes || [],
            account: request.account || account,
        });
    }

    beforeEach(async () => {
        performanceClient = new BrowserPerformanceClient({
            auth: { clientId: TEST_CONFIG.MSAL_CLIENT_ID },
        });
        config = {
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                knownAuthorities: ["login.microsoftonline.com"],
                authorityMetadata: JSON.stringify(
                    DEFAULT_OPENID_CONFIG_RESPONSE.body
                ),
            },
            system: { allowPlatformBroker: true },
            telemetry: { client: performanceClient },
        };
        const context = new StandardOperatingContext(config);
        provider = new PlatformAuthExtensionHandler(
            context.getLogger(),
            2000,
            performanceClient,
            "test-extension"
        );
        jest.spyOn(
            PlatformAuthExtensionHandler,
            "createProvider"
        ).mockResolvedValue(provider);
        controller = new StandardController(context);
        await controller.initialize();
        jest.spyOn(
            StandardController.prototype,
            "getNativeAccountId"
        ).mockImplementation(
            (request) => request.account?.nativeAccountId || "native-account"
        );
    });

    afterEach(() => {
        jest.restoreAllMocks();
        sessionStorage.clear();
        localStorage.clear();
    });

    it.each(["extension", "DOM"] as const)(
        "shares one %s broker call across a burst and late joiners, with caller-specific results",
        async (providerType) => {
            const started = deferred<void>();
            const response = deferred<PlatformAuthResponse>();
            const handler =
                providerType === "extension"
                    ? provider
                    : new PlatformAuthDOMHandler(
                          controller.getLogger(),
                          performanceClient,
                          "discovery"
                      );
            if (providerType === "DOM") {
                jest.spyOn(
                    PlatformAuthDOMHandler,
                    "createProvider"
                ).mockResolvedValue(handler as PlatformAuthDOMHandler);
                controller = new StandardController(
                    new StandardOperatingContext({
                        ...config,
                        experimental: { allowPlatformBrokerWithDOM: true },
                    })
                );
                await controller.initialize();
            }
            const send = jest
                .spyOn(handler, "sendMessage")
                .mockImplementation(() => {
                    started.resolve();
                    return response.promise;
                });
            const first = acquireSilent({
                scopes: ["User.Read"],
                correlationId: "caller-0",
            });
            await started.promise;
            const callers = [
                first,
                ...Array.from({ length: 19 }, (_, i) =>
                    acquireSilent({
                        scopes: ["User.Read"],
                        correlationId: `caller-${i + 1}`,
                    })
                ),
            ];
            response.resolve(brokerResponse);
            const results = await Promise.all(callers);
            expect(send).toHaveBeenCalledTimes(1);
            expect(results.map((value) => value.correlationId)).toEqual(
                Array.from({ length: 20 }, (_, i) => `caller-${i}`)
            );
            expect(new Set(results).size).toBe(20);
            results.forEach((value) =>
                expect(value.accessToken).toBe(TEST_TOKENS.ACCESS_TOKEN)
            );
        }
    );

    it("shares PoP key generation as well as the broker request", async () => {
        const started = deferred<void>();
        const response = deferred<PlatformAuthResponse>();
        const generateCnf = jest
            .spyOn(PopTokenGenerator.prototype, "generateCnf")
            .mockResolvedValue({
                kid: "generated-key",
                reqCnfString: "confirmation",
            });
        jest.spyOn(
            PopTokenGenerator.prototype,
            "signPopToken"
        ).mockResolvedValue("signed-token");
        const send = jest
            .spyOn(provider, "sendMessage")
            .mockImplementation(() => {
                started.resolve();
                return response.promise;
            });
        const request: BrokerRequest = {
            scopes: ["User.Read"],
            authenticationScheme: Constants.AuthenticationScheme.POP,
            resourceRequestMethod: "GET",
            resourceRequestUri: "https://resource.example.com",
            shrNonce: "proof-nonce",
        };
        const first = acquireSilent({
            ...request,
            correlationId: "first",
        });
        await started.promise;
        const second = acquireSilent({
            ...request,
            correlationId: "second",
        });
        response.resolve({
            ...brokerResponse,
            access_token: `e30.${btoa(
                JSON.stringify({ cnf: { kid: "generated-key" } })
            )}.signature`,
        });
        const results = await Promise.all([first, second]);
        expect(generateCnf).toHaveBeenCalledTimes(1);
        expect(send).toHaveBeenCalledTimes(1);
        expect(send.mock.calls[0][0]).toMatchObject({
            keyId: "generated-key",
            reqCnf: "confirmation",
            shrNonce: "proof-nonce",
        });
        expect(results.map((value) => value.accessToken)).toEqual([
            "signed-token",
            "signed-token",
        ]);
    });

    it.each([
        [
            "native account",
            { account: { ...account, nativeAccountId: "other-native" } },
        ],
        [
            "home account",
            { account: { ...account, homeAccountId: "other-home" } },
        ],
        [
            "tenant profile",
            { account: { ...account, tenantId: "other-tenant" } },
        ],
        [
            "account environment",
            { account: { ...account, environment: "other-cloud" } },
        ],
        [
            "authority",
            { authority: "https://login.microsoftonline.com/organizations" },
        ],
        ["scope casing", { scopes: ["user.read"] }],
        ["scopes", { scopes: ["Mail.Read"] }],
        [
            "claims",
            { claims: '{"access_token":{"xms_cc":{"values":["cp1"]}}}' },
        ],
        [
            "authentication scheme",
            { authenticationScheme: Constants.AuthenticationScheme.POP },
        ],
        ["PoP key", { popKid: "other-key" }],
        ["SHR nonce", { shrNonce: "other-nonce" }],
        ["SHR claims", { shrClaims: '{"custom":"value"}' }],
        ["proof method", { resourceRequestMethod: "POST" }],
        [
            "proof URI",
            { resourceRequestUri: "https://other-resource.example.com" },
        ],
        ["DPoP nonce", { dpopNonce: "server-nonce" }],
        [
            "no-cache bag",
            { extraParametersNoCache: { pop_nonce: "other-nonce" } },
        ],
        ["redirect URI", { redirectUri: "https://app.example.com/other" }],
        ["OIDC nonce", { nonce: "other-oidc-nonce" }],
        ["state", { state: "other-state" }],
        ["login hint", { loginHint: "other@contoso.com" }],
        ["embedded app", { embeddedClientId: "other-child" }],
        ["extra parameters", { extraParameters: { custom: "different" } }],
        [
            "fallback query parameters",
            { extraQueryParameters: { custom: "different" } },
        ],
        ["fallback prompt", { prompt: Constants.PromptValue.NONE }],
        ["resource", { resource: "https://resource.example.com" }],
        ["attribute partition", { attributeTokens: ["different-attribute"] }],
        [
            "cloud validation",
            {
                azureCloudOptions: {
                    azureCloudInstance: AzureCloudInstance.AzureUsGovernment,
                    tenant: "other",
                },
            },
        ],
        ["access token storage", { storeInCache: { accessToken: false } }],
        ["ID token storage", { storeInCache: { idToken: false } }],
        ["refresh token storage", { storeInCache: { refreshToken: false } }],
        ["force refresh", { forceRefresh: true }],
    ] satisfies Array<[string, BrokerRequest]>)(
        "does not share acquireTokenSilent requests with different %s",
        async (_name, difference) => {
            const started = deferred<void>();
            const response = deferred<AuthenticationResult>();
            const acquire = jest
                .spyOn(PlatformAuthInteractionClient.prototype, "acquireToken")
                .mockImplementation(() => {
                    started.resolve();
                    return response.promise;
                });
            const request: BrokerRequest & { scopes: string[] } = {
                scopes: ["User.Read"],
                account,
                resourceRequestMethod: "GET",
                resourceRequestUri: "https://resource.example.com",
            };
            const first = controller.acquireTokenSilent({
                ...request,
                correlationId: "first",
            });
            await started.promise;
            const second = controller.acquireTokenSilent({
                ...request,
                ...difference,
                correlationId: "second",
            });
            response.resolve(result);
            await Promise.all([first, second]);
            expect(acquire).toHaveBeenCalledTimes(2);
        }
    );

    it("separates cache-only callers from broker-enabled callers", async () => {
        const started = deferred<void>();
        const response = deferred<PlatformAuthResponse>();
        const send = jest
            .spyOn(provider, "sendMessage")
            .mockImplementation(() => {
                started.resolve();
                return response.promise;
            });
        const first = acquireSilent({ scopes: ["User.Read"] });
        await started.promise;
        await expect(
            acquireSilent({
                scopes: ["User.Read"],
                cacheLookupPolicy: CacheLookupPolicy.AccessToken,
            })
        ).rejects.toMatchObject({ errorCode: "no_account_found" });
        response.resolve(brokerResponse);
        await first;
        expect(send).toHaveBeenCalledTimes(1);
    });

    it("includes cache policy and embedded broker-claims behavior in the outer silent key", async () => {
        const acquire = jest
            .spyOn(PlatformAuthInteractionClient.prototype, "acquireToken")
            .mockResolvedValue(result);
        await Promise.all([
            controller.acquireTokenSilent({ scopes: ["User.Read"], account }),
            controller.acquireTokenSilent({
                scopes: ["User.Read"],
                account,
                cacheLookupPolicy: CacheLookupPolicy.AccessToken,
            }),
            controller.acquireTokenSilent({
                scopes: ["User.Read"],
                account,
                embeddedClientId: "child",
                skipBrokerClaims: false,
            }),
            controller.acquireTokenSilent({
                scopes: ["User.Read"],
                account,
                embeddedClientId: "child",
                skipBrokerClaims: true,
            }),
        ]);
        expect(acquire).toHaveBeenCalledTimes(4);
    });

    it("canonicalizes scope and dictionary ordering but preserves scope casing", async () => {
        const acquire = jest
            .spyOn(PlatformAuthInteractionClient.prototype, "acquireToken")
            .mockResolvedValue(result);
        const first: BrokerRequest = {
            scopes: [" User.Read ", "Mail.Read", "User.Read", ""],
            extraParameters: { first: "1", second: "2" },
            extraParametersNoCache: { a: "a", b: "b" },
        };
        const second: BrokerRequest = {
            scopes: ["Mail.Read", "User.Read"],
            extraParameters: { second: "2", first: "1" },
            extraParametersNoCache: { b: "b", a: "a" },
        };
        await Promise.all([
            acquireSilent(first),
            acquireSilent(second),
            acquireSilent({ scopes: ["Mail.Read", "user.read"] }),
        ]);
        expect(acquire).toHaveBeenCalledTimes(2);
    });

    it("does not merge ssoSilent with an in-flight acquireTokenSilent broker operation", async () => {
        const started = deferred<void>();
        const response = deferred<AuthenticationResult>();
        const acquire = jest
            .spyOn(PlatformAuthInteractionClient.prototype, "acquireToken")
            .mockImplementation((request) => {
                started.resolve();
                return response.promise.then((value) => ({
                    ...value,
                    correlationId: request.correlationId || "operation",
                }));
            });
        const request = {
            scopes: ["User.Read"],
            account,
            authenticationScheme: Constants.AuthenticationScheme.BEARER,
        };
        const first = controller.acquireTokenSilent({
            ...request,
            correlationId: "first",
        });
        await started.promise;
        const second = controller.ssoSilent({
            ...request,
            correlationId: "second",
        });
        response.resolve(result);
        expect(
            (await Promise.all([first, second])).map(
                (value) => value.correlationId
            )
        ).toEqual(["first", "second"]);
        expect(acquire).toHaveBeenCalledTimes(2);
    });

    it("removes completed entries rather than caching their resolved promises", async () => {
        const acquire = jest
            .spyOn(PlatformAuthInteractionClient.prototype, "acquireToken")
            .mockResolvedValue(result);
        const request = { scopes: ["User.Read"] };
        await Promise.all([acquireSilent(request), acquireSilent(request)]);
        expect(acquire).toHaveBeenCalledTimes(1);
        await acquireSilent(request);
        expect(acquire).toHaveBeenCalledTimes(2);
    });

    it("keeps the registered request available when broker code reenters the API", async () => {
        const started = deferred<void>();
        let joiningRequest: Promise<AuthenticationResult> | undefined;
        const acquire = jest
            .spyOn(PlatformAuthInteractionClient.prototype, "acquireToken")
            .mockImplementation(() => {
                if (!joiningRequest) {
                    joiningRequest = acquireSilent({
                        scopes: ["User.Read"],
                        correlationId: "joining",
                    });
                }
                started.resolve();
                return Promise.resolve(result);
            });
        const initiatingRequest = acquireSilent({
            scopes: ["User.Read"],
            correlationId: "initiating",
        });
        await started.promise;
        expect(joiningRequest).toBeDefined();
        const results = await Promise.all([initiatingRequest, joiningRequest!]);
        expect(acquire).toHaveBeenCalledTimes(1);
        expect(results.map((value) => value.correlationId)).toEqual([
            "initiating",
            "joining",
        ]);
    });

    it("preserves the keyed wire request while PoP initialization is awaiting key generation", async () => {
        const started = deferred<void>();
        const confirmation = deferred<{ kid: string; reqCnfString: string }>();
        jest.spyOn(
            PopTokenGenerator.prototype,
            "generateCnf"
        ).mockImplementation(() => {
            started.resolve();
            return confirmation.promise;
        });
        jest.spyOn(
            PopTokenGenerator.prototype,
            "signPopToken"
        ).mockResolvedValue("signed-token");
        const send = jest.spyOn(provider, "sendMessage").mockResolvedValue({
            ...brokerResponse,
            access_token: `e30.${btoa(
                JSON.stringify({ cnf: { kid: "key" } })
            )}.signature`,
        });
        const request: BrokerRequest = {
            scopes: ["User.Read"],
            authenticationScheme: Constants.AuthenticationScheme.POP,
            resourceRequestMethod: "GET",
            resourceRequestUri: "https://resource.example.com",
            extraParameters: { custom: "original" },
            extraParametersNoCache: { custom: "original" },
        };
        const acquisition = acquireSilent(request);
        await started.promise;
        request.scopes![0] = "Mail.Read";
        request.extraParameters!.custom = "changed";
        request.extraParametersNoCache!.custom = "changed";
        const originalRequest: BrokerRequest = {
            ...request,
            scopes: ["User.Read"],
            extraParameters: { custom: "original" },
            extraParametersNoCache: { custom: "original" },
        };
        const joiningRequest = acquireSilent(originalRequest);
        confirmation.resolve({ kid: "key", reqCnfString: "confirmation" });
        await Promise.all([acquisition, joiningRequest]);
        expect(send).toHaveBeenCalledTimes(1);
        expect(send.mock.calls[0][0]).toMatchObject({
            scope: expect.stringContaining("User.Read"),
            extraParameters: { custom: "original" },
            extraParametersNoCache: { custom: "original" },
        });
        expect(send.mock.calls[0][0].scope).not.toContain("Mail.Read");
    });

    it.each([false, true])(
        "propagates the shared failure object and retries after rejection (synchronous throw: %s)",
        async (synchronous) => {
            const error = new AuthError("broker-failed", "test error");
            error.correlationId = "operation";
            const acquire = jest
                .spyOn(PlatformAuthInteractionClient.prototype, "acquireToken")
                .mockImplementation(() => {
                    if (synchronous) {
                        throw error;
                    }
                    return Promise.reject(error);
                });
            const requests = ["first", "second"].map((correlationId) =>
                acquireSilent({ scopes: ["User.Read"], correlationId })
            );
            const failures = await Promise.allSettled(requests);
            failures.forEach((failure) => {
                expect(failure.status).toBe("rejected");
                if (failure.status === "rejected") {
                    expect(failure.reason).toBe(error);
                }
            });
            expect(acquire).toHaveBeenCalledTimes(1);
            acquire.mockResolvedValue(result);
            await acquireSilent({ scopes: ["User.Read"] });
            expect(acquire).toHaveBeenCalledTimes(2);
        }
    );

    it("snapshots mutable request fields before broker initialization", async () => {
        const acquire = jest
            .spyOn(PlatformAuthInteractionClient.prototype, "acquireToken")
            .mockResolvedValue(result);
        const request: BrokerRequest = {
            scopes: ["User.Read"],
            account: { ...account },
            attributeTokens: ["attribute"],
            extraParameters: { custom: "original" },
            extraParametersNoCache: { pop_nonce: "original" },
            azureCloudOptions: {
                azureCloudInstance: AzureCloudInstance.AzurePublic,
                tenant: "original",
            },
            storeInCache: { accessToken: false },
        };
        const acquisition = acquireSilent(request);
        request.scopes![0] = "Mail.Read";
        request.account!.nativeAccountId = "other-native";
        request.attributeTokens![0] = "other-attribute";
        request.extraParameters!.custom = "mutated";
        request.extraParametersNoCache!.pop_nonce = "mutated";
        request.azureCloudOptions!.tenant = "mutated";
        request.storeInCache!.accessToken = true;
        await acquisition;
        expect(acquire.mock.calls[0][0]).toMatchObject({
            scopes: ["User.Read"],
            account: { nativeAccountId: "native-account" },
            attributeTokens: ["attribute"],
            extraParameters: { custom: "original" },
            extraParametersNoCache: { pop_nonce: "original" },
            azureCloudOptions: { tenant: "original" },
            storeInCache: { accessToken: false },
        });
    });

    it("preserves per-caller acquireTokenSilent measurements when broker acquisition is shared", async () => {
        const started = deferred<void>();
        const response = deferred<AuthenticationResult>();
        const events: PerformanceEvent[] = [];
        controller.addPerformanceCallback((batch) => events.push(...batch));
        jest.spyOn(
            PlatformAuthInteractionClient.prototype,
            "acquireToken"
        ).mockImplementation(() => {
            started.resolve();
            return response.promise;
        });
        const first = controller.acquireTokenSilent({
            scopes: ["User.Read"],
            account,
            correlationId: "first",
        });
        await started.promise;
        const second = controller.acquireTokenSilent({
            scopes: ["User.Read"],
            account,
            correlationId: "second",
        });
        window.dispatchEvent(new Event("online"));
        response.resolve(result);
        await Promise.all([first, second]);
        const rootEvents = events.filter(
            (event) => event.name === "acquireTokenSilent"
        );
        expect(rootEvents.map((event) => event.correlationId).sort()).toEqual([
            "first",
            "second",
        ]);
        rootEvents.forEach((event) => {
            expect(event.success).toBe(true);
        });
        expect(
            rootEvents.find((event) => event.correlationId === "first")
                ?.onlineStatusChangeCount
        ).toBe(1);
        expect(
            rootEvents.find((event) => event.correlationId === "second")
                ?.deduped
        ).toBe(true);
        expect(
            rootEvents.find((event) => event.correlationId === "first")?.deduped
        ).toBe(false);
    });

    it("does not share operations between application instances or with interactive requests", async () => {
        const secondController = new StandardController(
            new StandardOperatingContext(config)
        );
        await secondController.initialize();
        const acquire = jest
            .spyOn(PlatformAuthInteractionClient.prototype, "acquireToken")
            .mockResolvedValue(result);
        await Promise.all([
            acquireSilent({ scopes: ["User.Read"] }),
            secondController.acquireTokenSilent({
                scopes: ["User.Read"],
                account,
            }),
            controller.acquireTokenNative(
                { scopes: ["User.Read"] },
                ApiId.acquireTokenPopup
            ),
            controller.acquireTokenNative(
                { scopes: ["User.Read"] },
                ApiId.acquireTokenPopup
            ),
        ]);
        expect(acquire).toHaveBeenCalledTimes(4);
    });

    it("preserves independent SSO web fallbacks when broker operations fail fatally", async () => {
        const error = createNativeAuthError(
            NativeAuthErrorCodes.contentError,
            "operation"
        );
        const acquire = jest
            .spyOn(PlatformAuthInteractionClient.prototype, "acquireToken")
            .mockRejectedValue(error);
        const iframe = jest
            .spyOn(SilentIframeClient.prototype, "acquireToken")
            .mockResolvedValue(result);
        await Promise.all([
            controller.ssoSilent({ scopes: ["User.Read"] }),
            controller.ssoSilent({ scopes: ["User.Read"] }),
        ]);
        expect(acquire).toHaveBeenCalledTimes(2);
        expect(iframe).toHaveBeenCalledTimes(2);
    });

    it("does not coalesce matching ssoSilent calls on either the broker or web path", async () => {
        const response = deferred<AuthenticationResult>();
        const acquire = jest
            .spyOn(PlatformAuthInteractionClient.prototype, "acquireToken")
            .mockReturnValue(response.promise);
        const iframe = jest
            .spyOn(SilentIframeClient.prototype, "acquireToken")
            .mockReturnValue(response.promise);
        const request = { scopes: ["User.Read"] };
        const brokerRequests = [
            controller.ssoSilent(request),
            controller.ssoSilent(request),
        ];
        jest.spyOn(controller, "canUsePlatformBroker").mockReturnValue(false);
        const webRequests = [
            controller.ssoSilent(request),
            controller.ssoSilent(request),
        ];
        response.resolve(result);
        await Promise.all([...brokerRequests, ...webRequests]);
        expect(acquire).toHaveBeenCalledTimes(2);
        expect(iframe).toHaveBeenCalledTimes(2);
    });

    it.each([
        ["identical parameters", {}],
        ["correlation ID", { correlationId: "different" }],
        ["forceRefresh", { forceRefresh: true }],
        [
            "cache lookup policy",
            { cacheLookupPolicy: CacheLookupPolicy.AccessToken },
        ],
        ["extra parameters", { extraParameters: { custom: "different" } }],
        [
            "extra query parameters",
            { extraQueryParameters: { custom: "different" } },
        ],
        ["state", { state: "different" }],
        ["scope order", { scopes: ["Mail.Read", "User.Read"] }],
        ["scope casing", { scopes: ["user.read", "Mail.Read"] }],
        ["scope whitespace", { scopes: [" User.Read ", "Mail.Read"] }],
        [
            "authority",
            { authority: "https://login.microsoftonline.com/organizations/" },
        ],
        ["claims", { claims: '{"access_token":{"custom":null}}' }],
        ["embedded client", { embeddedClientId: "child" }],
        ["resource", { resource: "https://resource.example.com" }],
        ["proof nonce", { shrNonce: "different" }],
    ] satisfies Array<[string, Partial<SilentRequest>]>)(
        "preserves the original web thumbprint semantics for %s",
        async (_name, difference) => {
            const webController = new StandardController(
                new StandardOperatingContext({
                    ...config,
                    system: { allowPlatformBroker: false },
                })
            );
            await webController.initialize();
            const response = deferred<AuthenticationResult>();
            const started = deferred<void>();
            const acquire = jest
                .spyOn(SilentCacheClient.prototype, "acquireToken")
                .mockImplementation(() => {
                    started.resolve();
                    return response.promise;
                });
            const request: SilentRequest = {
                scopes: ["User.Read", "Mail.Read"],
                account: { ...account, nativeAccountId: undefined },
                correlationId: "first",
            };
            const otherRequest: SilentRequest = {
                ...request,
                correlationId: "second",
                ...difference,
            };
            const originalKey = (input: SilentRequest) =>
                JSON.stringify(
                    getRequestThumbprint(
                        TEST_CONFIG.MSAL_CLIENT_ID,
                        {
                            ...input,
                            authority:
                                input.authority || TEST_CONFIG.validAuthority,
                            correlationId: input.correlationId || "",
                        },
                        account.homeAccountId
                    )
                );
            const expectedAcquisitions =
                originalKey(request) === originalKey(otherRequest) ? 1 : 2;
            const first = webController.acquireTokenSilent(request);
            await started.promise;
            const second = webController.acquireTokenSilent(otherRequest);
            response.resolve({ ...result, fromPlatformBroker: false });
            const results = await Promise.all([first, second]);
            expect(acquire).toHaveBeenCalledTimes(expectedAcquisitions);
            expect(results.map((value) => value.correlationId)).toEqual([
                request.correlationId,
                otherRequest.correlationId,
            ]);
            await webController.acquireTokenSilent(request);
            expect(acquire).toHaveBeenCalledTimes(expectedAcquisitions + 1);
        }
    );
});
