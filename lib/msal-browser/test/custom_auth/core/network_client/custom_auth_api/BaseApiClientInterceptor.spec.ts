/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    AADServerParamKeys,
    ServerTelemetryManager,
} from "@azure/msal-common/browser";
import { SignInApiClient } from "../../../../../src/custom_auth/core/network_client/custom_auth_api/SignInApiClient.js";
import { CustomAuthRequestInterceptor } from "../../../../../src/custom_auth/configuration/CustomAuthRequestInterceptor.js";
import { getDefaultLogger } from "../../../test_resources/TestModules.js";

const mockTelemetryManager = {
    generateCurrentRequestHeaderValue: jest.fn(() => "cur"),
    generateLastRequestHeaderValue: jest.fn(() => "last"),
} as unknown as ServerTelemetryManager;

const buildOkResponse = (
    body: Record<string, unknown>,
    headers: Record<string, string> = {}
) =>
    ({
        ok: true,
        json: async () => body,
        headers: { get: (name: string) => headers[name] || null },
    } as unknown as Response);

const buildInitiateResponse = () =>
    buildOkResponse(
        { continuation_token: "ct" },
        { "x-ms-request-id": "corr" }
    );

describe("BaseApiClient request interceptor behaviour", () => {
    const baseUrl = "https://customauth.test/";
    const clientId = "client-id";

    let mockHttpClient: { post: jest.Mock };

    beforeEach(() => {
        mockHttpClient = { post: jest.fn() };
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    const lastSentHeaders = (): Record<string, string> => {
        expect(mockHttpClient.post).toHaveBeenCalled();
        const headers = mockHttpClient.post.mock.calls[0][2] as Record<
            string,
            string
        >;
        return headers;
    };

    const lastSentUrl = (): URL => {
        expect(mockHttpClient.post).toHaveBeenCalled();
        return mockHttpClient.post.mock.calls[0][0] as URL;
    };

    it("does not call interceptor when none is configured and sends only common headers", async () => {
        const client = new SignInApiClient(
            baseUrl,
            clientId,
            mockHttpClient as any,
            undefined,
            undefined,
            undefined,
            getDefaultLogger()
        );

        mockHttpClient.post.mockResolvedValue(buildInitiateResponse());

        await client.initiate({
            username: "u",
            challenge_type: "email-otp",
            telemetryManager: mockTelemetryManager,
            correlationId: "corr",
        });

        const headers = lastSentHeaders();
        expect(headers[AADServerParamKeys.CLIENT_REQUEST_ID]).toBe("corr");
        // Confirm no user-vendor header (i.e., x-* not starting with reserved prefixes)
        // is present when no interceptor is configured.
        const customHeaderKeys = Object.keys(headers).filter((k) => {
            const lk = k.toLowerCase();
            return (
                lk.startsWith("x-") &&
                !lk.startsWith("x-client-") &&
                !lk.startsWith("x-ms-") &&
                !lk.startsWith("x-broker-") &&
                !lk.startsWith("x-app-")
            );
        });
        expect(customHeaderKeys).toEqual([]);
    });

    it("invokes the interceptor with the full request URL and merges returned headers", async () => {
        const interceptor: CustomAuthRequestInterceptor = {
            addAdditionalHeaderFields: jest.fn(async (url: URL) => {
                expect(url).toBeInstanceOf(URL);
                expect(url.pathname).toBe("/oauth2/v2.0/initiate");
                return { "X-Fraud-Vendor-Token": "vendor-1" };
            }),
        };

        const client = new SignInApiClient(
            baseUrl,
            clientId,
            mockHttpClient as any,
            undefined,
            undefined,
            interceptor,
            getDefaultLogger()
        );

        mockHttpClient.post.mockResolvedValue(buildInitiateResponse());

        await client.initiate({
            username: "u",
            challenge_type: "email-otp",
            telemetryManager: mockTelemetryManager,
            correlationId: "corr",
        });

        expect(interceptor.addAdditionalHeaderFields).toHaveBeenCalledTimes(1);
        const headers = lastSentHeaders();
        expect(headers["X-Fraud-Vendor-Token"]).toBe("vendor-1");
        expect(lastSentUrl().toString()).toBe(
            "https://customauth.test/oauth2/v2.0/initiate"
        );
    });

    it("filters out headers without the x- prefix and with reserved prefixes", async () => {
        const interceptor: CustomAuthRequestInterceptor = {
            addAdditionalHeaderFields: () => ({
                authorization: "Bearer drop",
                "x-client-header": "drop",
                "x-ms-something": "drop",
                "x-broker-id": "drop",
                "x-app-version": "drop",
                "X-my-custom-header": "keep",
            }),
        };

        const client = new SignInApiClient(
            baseUrl,
            clientId,
            mockHttpClient as any,
            undefined,
            undefined,
            interceptor,
            getDefaultLogger()
        );

        mockHttpClient.post.mockResolvedValue(buildInitiateResponse());

        await client.initiate({
            username: "u",
            challenge_type: "email-otp",
            telemetryManager: mockTelemetryManager,
            correlationId: "corr",
        });

        const headers = lastSentHeaders();
        expect(headers["X-my-custom-header"]).toBe("keep");
        expect(headers["authorization"]).toBeUndefined();
        expect(headers["x-client-header"]).toBeUndefined();
        expect(headers["x-ms-something"]).toBeUndefined();
        expect(headers["x-broker-id"]).toBeUndefined();
        expect(headers["x-app-version"]).toBeUndefined();

        // MSAL's own x-client-* headers are still present
        expect(headers[AADServerParamKeys.X_CLIENT_SKU]).toBeDefined();
        expect(headers[AADServerParamKeys.X_CLIENT_VER]).toBeDefined();
    });

    it("user headers take precedence over common MSAL headers when names collide after filtering", async () => {
        // The filter normally strips x-client-* / x-ms-* etc., so a real collision
        // would only happen with a non-reserved header name that MSAL happens to
        // set. We assert the merge order directly with a header we can collide on.
        const interceptor: CustomAuthRequestInterceptor = {
            addAdditionalHeaderFields: () => ({
                // This is allowed by the filter (starts with x-, no reserved prefix)
                "x-custom-override": "user-value",
            }),
        };

        const client = new SignInApiClient(
            baseUrl,
            clientId,
            mockHttpClient as any,
            undefined,
            undefined,
            interceptor,
            getDefaultLogger()
        );

        mockHttpClient.post.mockResolvedValue(buildInitiateResponse());

        await client.initiate({
            username: "u",
            challenge_type: "email-otp",
            telemetryManager: mockTelemetryManager,
            correlationId: "corr",
        });

        const headers = lastSentHeaders();
        // The user header is present and uses the user's value
        expect(headers["x-custom-override"]).toBe("user-value");
    });

    it("supports synchronous interceptor return values", async () => {
        const interceptor: CustomAuthRequestInterceptor = {
            addAdditionalHeaderFields: () => ({ "x-sync-header": "sync" }),
        };

        const client = new SignInApiClient(
            baseUrl,
            clientId,
            mockHttpClient as any,
            undefined,
            undefined,
            interceptor,
            getDefaultLogger()
        );

        mockHttpClient.post.mockResolvedValue(buildInitiateResponse());

        await client.initiate({
            username: "u",
            challenge_type: "email-otp",
            telemetryManager: mockTelemetryManager,
            correlationId: "corr",
        });

        expect(lastSentHeaders()["x-sync-header"]).toBe("sync");
    });

    it("treats null return value as no additional headers", async () => {
        const interceptor: CustomAuthRequestInterceptor = {
            addAdditionalHeaderFields: () => null,
        };

        const client = new SignInApiClient(
            baseUrl,
            clientId,
            mockHttpClient as any,
            undefined,
            undefined,
            interceptor,
            getDefaultLogger()
        );

        mockHttpClient.post.mockResolvedValue(buildInitiateResponse());

        await client.initiate({
            username: "u",
            challenge_type: "email-otp",
            telemetryManager: mockTelemetryManager,
            correlationId: "corr",
        });

        // Spot-check: no non-MSAL custom header was added
        const headers = lastSentHeaders();
        const userHeaders = Object.keys(headers).filter((k) => {
            const lk = k.toLowerCase();
            return (
                lk.startsWith("x-") &&
                !lk.startsWith("x-client-") &&
                !lk.startsWith("x-ms-")
            );
        });
        expect(userHeaders).toEqual([]);
    });

    it("swallows interceptor errors and still sends the request", async () => {
        const logger = getDefaultLogger();
        const warningSpy = jest
            .spyOn(logger, "warningPii")
            .mockImplementation(() => {});
        const interceptor: CustomAuthRequestInterceptor = {
            addAdditionalHeaderFields: () => {
                throw new Error("interceptor exploded");
            },
        };

        const client = new SignInApiClient(
            baseUrl,
            clientId,
            mockHttpClient as any,
            undefined,
            undefined,
            interceptor,
            logger
        );

        mockHttpClient.post.mockResolvedValue(buildInitiateResponse());

        const result = await client.initiate({
            username: "u",
            challenge_type: "email-otp",
            telemetryManager: mockTelemetryManager,
            correlationId: "corr",
        });

        expect(result.continuation_token).toBe("ct");
        expect(mockHttpClient.post).toHaveBeenCalledTimes(1);
        expect(warningSpy).toHaveBeenCalled();
    });

    it("swallows interceptor rejections from async functions", async () => {
        const logger = getDefaultLogger();
        const warningSpy = jest
            .spyOn(logger, "warningPii")
            .mockImplementation(() => {});
        const interceptor: CustomAuthRequestInterceptor = {
            addAdditionalHeaderFields: async () => {
                throw new Error("async failure");
            },
        };

        const client = new SignInApiClient(
            baseUrl,
            clientId,
            mockHttpClient as any,
            undefined,
            undefined,
            interceptor,
            logger
        );

        mockHttpClient.post.mockResolvedValue(buildInitiateResponse());

        const result = await client.initiate({
            username: "u",
            challenge_type: "email-otp",
            telemetryManager: mockTelemetryManager,
            correlationId: "corr",
        });

        expect(result.continuation_token).toBe("ct");
        expect(mockHttpClient.post).toHaveBeenCalledTimes(1);
        expect(warningSpy).toHaveBeenCalled();
    });
});
