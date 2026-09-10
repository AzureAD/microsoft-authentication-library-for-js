/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    AADServerParamKeys,
    AuthenticationResult,
    AzureCloudInstance,
    Constants,
    INativeBrokerPlugin,
    InteractionRequiredAuthError,
    NativeRequest,
    PlatformBrokerError,
    SilentFlowClient,
} from "@azure/msal-common/node";
import { PublicClientApplication } from "../../src/client/PublicClientApplication.js";
import { ClientApplication } from "../../src/client/ClientApplication.js";
import { SilentFlowRequest } from "../../src/request/SilentFlowRequest.js";
import { Configuration } from "../../src/config/Configuration.js";
import { MockNativeBrokerPlugin } from "../utils/MockNativeBrokerPlugin.js";
import {
    mockAuthenticationResult,
    mockNativeAccountInfo,
    mockNativeAuthenticationResult,
    TEST_CONSTANTS,
} from "../utils/TestConstants.js";

/** Creates a manually settled promise to hold acquisitions in flight. */
function deferred<T>() {
    let resolve!: (value: T) => void;
    let reject!: (reason: Error) => void;
    const promise = new Promise<T>((resolvePromise, rejectPromise) => {
        resolve = resolvePromise;
        reject = rejectPromise;
    });
    return { promise, resolve, reject };
}

describe("Native silent request coalescing", () => {
    const config: Configuration = {
        auth: {
            clientId: TEST_CONSTANTS.CLIENT_ID,
            authority: TEST_CONSTANTS.DEFAULT_AUTHORITY,
        },
    };
    let plugin: INativeBrokerPlugin;
    let brokerSpy: jest.SpyInstance<
        Promise<AuthenticationResult>,
        [NativeRequest]
    >;
    let app: PublicClientApplication;
    let request: SilentFlowRequest;

    beforeEach(() => {
        plugin = new MockNativeBrokerPlugin();
        brokerSpy = jest
            .spyOn(plugin, "acquireTokenSilent")
            .mockResolvedValue(mockNativeAuthenticationResult);
        app = new PublicClientApplication({
            ...config,
            broker: { nativeBrokerPlugin: plugin },
        });
        request = {
            account: { ...mockNativeAccountInfo },
            scopes: ["User.Read", "Mail.Read"],
        };
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("shares a burst and late joiners while returning caller-specific results", async () => {
        const response = deferred<AuthenticationResult>();
        brokerSpy.mockReturnValue(response.promise);
        const requests = Array.from({ length: 100 }, (_, index) =>
            app.acquireTokenSilent({
                ...request,
                correlationId: `caller-${index}`,
            })
        );
        let settled = false;
        const resultsPromise = Promise.all(requests).then((results) => {
            settled = true;
            return results;
        });

        await new Promise<void>((resolve) => setImmediate(resolve));
        const lateRequest = app.acquireTokenSilent({
            ...request,
            correlationId: "late-caller",
        });
        await new Promise<void>((resolve) => setImmediate(resolve));
        expect(brokerSpy).toHaveBeenCalledTimes(1);
        expect(settled).toBe(false);

        response.resolve(mockNativeAuthenticationResult);
        const results = await resultsPromise;
        results.forEach((result, index) => {
            expect(result).toEqual({
                ...mockNativeAuthenticationResult,
                correlationId: `caller-${index}`,
            });
        });
        expect(await lateRequest).toEqual({
            ...mockNativeAuthenticationResult,
            correlationId: "late-caller",
        });
        expect(results[0]).not.toBe(results[1]);
        expect(mockNativeAuthenticationResult.correlationId).toBe(
            "test-correlationId"
        );

        await app.acquireTokenSilent(request);
        expect(brokerSpy).toHaveBeenCalledTimes(2);
    });

    it("generates distinct caller correlation IDs when omitted", async () => {
        const results = await Promise.all([
            app.acquireTokenSilent(request),
            app.acquireTokenSilent(request),
        ]);
        expect(brokerSpy).toHaveBeenCalledTimes(1);
        expect(results[0].correlationId).toBe(
            brokerSpy.mock.calls[0][0].correlationId
        );
        expect(results[1].correlationId).toEqual(expect.any(String));
        expect(results[1].correlationId).not.toBe(results[0].correlationId);
    });

    it("preserves native request preparation, including PoP and merged parameters", async () => {
        const popRequest: SilentFlowRequest = {
            ...request,
            authenticationScheme: Constants.AuthenticationScheme.POP,
            resourceRequestMethod: "POST",
            resourceRequestUri: "https://resource.example/api",
            shrNonce: "nonce",
            redirectUri: "ms-appx-web://broker/client",
            extraQueryParameters: { query: "value", shared: "query-value" },
            extraParameters: {
                body: "value",
                shared: "body-value",
                [AADServerParamKeys.X_CLIENT_EXTRA_SKU]: "caller-sku",
            },
            azureCloudOptions: {
                azureCloudInstance: AzureCloudInstance.AzureUsGovernment,
                tenant: "tenant",
            },
        };
        await Promise.all([
            app.acquireTokenSilent(popRequest),
            app.acquireTokenSilent({ ...popRequest }),
        ]);
        expect(brokerSpy).toHaveBeenCalledTimes(1);
        const brokerRequest = brokerSpy.mock.calls[0][0];
        expect(brokerRequest).toMatchObject({
            clientId: config.auth.clientId,
            authority: config.auth.authority,
            accountId: request.account.nativeAccountId,
            scopes: request.scopes,
            authenticationScheme: Constants.AuthenticationScheme.POP,
            resourceRequestMethod: popRequest.resourceRequestMethod,
            resourceRequestUri: popRequest.resourceRequestUri,
            shrNonce: popRequest.shrNonce,
            redirectUri: popRequest.redirectUri,
            extraParameters: {
                query: "value",
                body: "value",
                shared: "body-value",
            },
        });
        expect(
            brokerRequest.extraParameters?.[
                AADServerParamKeys.X_CLIENT_EXTRA_SKU
            ]
        ).not.toBe("caller-sku");
        expect(popRequest.authenticationScheme).toBe(
            Constants.AuthenticationScheme.POP
        );
        expect(popRequest.scopes).toEqual(["User.Read", "Mail.Read"]);
    });

    it("coalesces by the merged native extra parameters rather than their source", async () => {
        await Promise.all([
            app.acquireTokenSilent({
                ...request,
                extraQueryParameters: { first: "1", shared: "ignored" },
                extraParameters: { shared: "used", second: "2" },
            }),
            app.acquireTokenSilent({
                ...request,
                extraParameters: { second: "2", first: "1", shared: "used" },
            }),
        ]);
        expect(brokerSpy).toHaveBeenCalledTimes(1);
    });

    it("coalesces explicit defaults and equivalent case-preserving scope sets", async () => {
        const secondScopes = [" Mail.Read ", "User.Read", "User.Read", ""];
        await Promise.all([
            app.acquireTokenSilent(request),
            app.acquireTokenSilent({
                ...request,
                authority: config.auth.authority,
                redirectUri: "",
                forceRefresh: false,
                scopes: secondScopes,
            }),
        ]);
        expect(brokerSpy).toHaveBeenCalledTimes(1);
        expect(brokerSpy.mock.calls[0][0].scopes).toEqual(request.scopes);
        expect(secondScopes).toEqual([
            " Mail.Read ",
            "User.Read",
            "User.Read",
            "",
        ]);
    });

    it.each<[string, Partial<SilentFlowRequest>]>([
        ["scopes", { scopes: ["Other.Scope"] }],
        ["scope casing", { scopes: ["user.read", "Mail.Read"] }],
        [
            "claims",
            { claims: '{"access_token":{"xms_cc":{"values":["cp1"]}}}' },
        ],
        ["authority", { authority: "https://login.microsoftonline.us/tenant" }],
        [
            "native account ID",
            {
                account: {
                    ...mockNativeAccountInfo,
                    nativeAccountId: "different-native-account",
                },
            },
        ],
        [
            "missing native account ID",
            {
                account: {
                    ...mockNativeAccountInfo,
                    nativeAccountId: undefined,
                },
            },
        ],
        ["forceRefresh", { forceRefresh: true }],
        ["redirect URI", { redirectUri: "ms-appx-web://broker/other" }],
        ["resource", { resource: "https://resource.example" }],
        ["extra parameters", { extraParameters: { custom: "value" } }],
        [
            "extra query parameters",
            { extraQueryParameters: { custom: "value" } },
        ],
    ])("separates requests with different %s", async (_field, overrides) => {
        await Promise.all([
            app.acquireTokenSilent(request),
            app.acquireTokenSilent({ ...request, ...overrides }),
        ]);
        expect(brokerSpy).toHaveBeenCalledTimes(2);
    });

    it.each<[string, Partial<SilentFlowRequest>]>([
        [
            "scheme",
            { authenticationScheme: Constants.AuthenticationScheme.BEARER },
        ],
        ["method", { resourceRequestMethod: "GET" }],
        ["URI", { resourceRequestUri: "https://resource.example/other" }],
        ["nonce", { shrNonce: "other-nonce" }],
    ])(
        "separates PoP requests with different %s",
        async (_field, overrides) => {
            const popRequest: SilentFlowRequest = {
                ...request,
                authenticationScheme: Constants.AuthenticationScheme.POP,
                resourceRequestMethod: "POST",
                resourceRequestUri: "https://resource.example/api",
                shrNonce: "nonce",
            };
            await Promise.all([
                app.acquireTokenSilent(popRequest),
                app.acquireTokenSilent({ ...popRequest, ...overrides }),
            ]);
            expect(brokerSpy).toHaveBeenCalledTimes(2);
        }
    );

    it("shares an MSAL failure without mutating its type, details, or caller IDs", async () => {
        const response = deferred<AuthenticationResult>();
        const error = new InteractionRequiredAuthError(
            "interaction_required",
            "underlying-correlation",
            "Interaction required"
        );
        error.platformBrokerError = new PlatformBrokerError(
            "InteractionRequired",
            "underlying-correlation",
            "Broker details",
            42,
            0
        );
        brokerSpy.mockReturnValueOnce(response.promise);
        const pending = Promise.allSettled([
            app.acquireTokenSilent({ ...request, correlationId: "first" }),
            app.acquireTokenSilent({ ...request, correlationId: "second" }),
        ]);
        await new Promise<void>((resolve) => setImmediate(resolve));
        expect(brokerSpy).toHaveBeenCalledTimes(1);
        response.reject(error);
        const results = await pending;
        const [first, second] = results;
        if (first.status !== "rejected" || second.status !== "rejected") {
            throw new Error("Both native callers must receive the failure");
        }
        for (const [index, result] of results.entries()) {
            if (result.status === "rejected") {
                expect(result.reason).toBeInstanceOf(
                    InteractionRequiredAuthError
                );
                expect(result.reason.message).toBe(error.message);
                expect(result.reason.stack).toBe(error.stack);
                expect(result.reason).toMatchObject({
                    errorCode: error.errorCode,
                    platformBrokerError: error.platformBrokerError,
                    correlationId: index === 0 ? "first" : "second",
                });
            }
        }
        expect(first.reason).not.toBe(second.reason);
        expect(error.correlationId).toBe("underlying-correlation");
        await app.acquireTokenSilent(request);
        expect(brokerSpy).toHaveBeenCalledTimes(2);
    });

    it.each(["throw", "reject"])(
        "cleans up after a plugin's non-MSAL %s without falling back",
        async (failure) => {
            const cacheSpy = jest.spyOn(
                SilentFlowClient.prototype,
                "acquireCachedToken"
            );
            const error = new Error("Plugin failed");
            brokerSpy.mockImplementationOnce(() => {
                if (failure === "throw") {
                    throw error;
                }
                return Promise.reject(error);
            });
            const results = await Promise.allSettled([
                app.acquireTokenSilent(request),
                app.acquireTokenSilent(request),
            ]);
            expect(results).toEqual([
                { status: "rejected", reason: error },
                { status: "rejected", reason: error },
            ]);
            expect(brokerSpy).toHaveBeenCalledTimes(1);
            expect(cacheSpy).not.toHaveBeenCalled();
            await app.acquireTokenSilent(request);
            expect(brokerSpy).toHaveBeenCalledTimes(2);
        }
    );

    it("does not coalesce across application instances sharing a plugin", async () => {
        const otherApp = new PublicClientApplication({
            ...config,
            broker: { nativeBrokerPlugin: plugin },
        });
        await Promise.all([
            app.acquireTokenSilent(request),
            otherApp.acquireTokenSilent(request),
        ]);
        expect(brokerSpy).toHaveBeenCalledTimes(2);
    });

    it("keeps native and base-class acquisitions separate on the same instance", async () => {
        const cacheSpy = jest
            .spyOn(SilentFlowClient.prototype, "acquireCachedToken")
            .mockResolvedValue([
                mockAuthenticationResult,
                Constants.CacheOutcome.NOT_APPLICABLE,
            ]);
        const [nativeResult, nonNativeResult] = await Promise.all([
            app.acquireTokenSilent(request),
            ClientApplication.prototype.acquireTokenSilent.call(app, {
                ...request,
            }),
        ]);
        expect(brokerSpy).toHaveBeenCalledTimes(1);
        expect(cacheSpy).toHaveBeenCalledTimes(1);
        expect(nativeResult.account).toEqual(
            mockNativeAuthenticationResult.account
        );
        expect(nonNativeResult.account).toEqual(
            mockAuthenticationResult.account
        );
    });

    it("coalesces the non-native path when the configured broker is unavailable", async () => {
        plugin.isBrokerAvailable = false;
        const fallbackApp = new PublicClientApplication({
            ...config,
            broker: { nativeBrokerPlugin: plugin },
        });
        const cacheSpy = jest
            .spyOn(SilentFlowClient.prototype, "acquireCachedToken")
            .mockResolvedValue([
                mockAuthenticationResult,
                Constants.CacheOutcome.NOT_APPLICABLE,
            ]);
        await Promise.all([
            fallbackApp.acquireTokenSilent({
                ...request,
                redirectUri: "ms-appx-web://broker/client",
            }),
            fallbackApp.acquireTokenSilent(request),
        ]);
        expect(brokerSpy).not.toHaveBeenCalled();
        expect(cacheSpy).toHaveBeenCalledTimes(1);
        expect(cacheSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                authenticationScheme: Constants.AuthenticationScheme.BEARER,
                scopes: [...request.scopes, ...Constants.OIDC_DEFAULT_SCOPES],
            })
        );
    });

    it("validates every MCP caller before it can join a native request", async () => {
        const mcpApp = new PublicClientApplication({
            auth: { ...config.auth, isMcp: true },
            broker: { nativeBrokerPlugin: plugin },
        });
        const result = mcpApp.acquireTokenSilent({
            ...request,
            resource: "https://resource.example",
        });
        await expect(mcpApp.acquireTokenSilent(request)).rejects.toMatchObject({
            errorCode: "resource_parameter_required",
        });
        await result;
        expect(brokerSpy).toHaveBeenCalledTimes(1);
    });
});
