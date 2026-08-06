/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ThrottlingUtils } from "../../src/network/ThrottlingUtils.js";
import {
    RequestThumbprint,
    getRequestThumbprint,
} from "../../src/network/RequestThumbprint.js";
import { ThrottlingEntity } from "../../src/cache/entities/ThrottlingEntity.js";
import { NetworkResponse } from "../../src/network/NetworkResponse.js";
import { ServerAuthorizationTokenResponse } from "../../src/response/ServerAuthorizationTokenResponse.js";
import { MockStorageClass, mockCrypto } from "../client/ClientTestUtils.js";
import {
    THUMBPRINT,
    THROTTLING_ENTITY,
    TEST_CONFIG,
    RANDOM_TEST_GUID,
} from "../test_kit/StringConstants.js";
import { ServerError } from "../../src/error/ServerError.js";
import { BaseAuthRequest, Logger } from "../../src/index.js";
import { StubPerformanceClient } from "../../src/telemetry/performance/StubPerformanceClient.js";

const performanceClient = new StubPerformanceClient();

describe("ThrottlingUtils", () => {
    afterAll(() => {
        jest.restoreAllMocks();
    });

    describe("generateThrottlingStorageKey", () => {
        it("returns a throttling key", () => {
            const thumbprint: RequestThumbprint = THUMBPRINT;
            const jsonString = JSON.stringify(thumbprint);
            const key =
                ThrottlingUtils.generateThrottlingStorageKey(thumbprint);

            expect(key).toEqual(`throttling.${jsonString}`);
        });
    });

    describe("preProcess", () => {
        it("checks the cache and throws an error", () => {
            const thumbprint: RequestThumbprint = THUMBPRINT;
            const thumbprintValue: ThrottlingEntity = THROTTLING_ENTITY;
            const cache = new MockStorageClass(
                TEST_CONFIG.MSAL_CLIENT_ID,
                mockCrypto,
                new Logger({}),
                performanceClient
            );
            const removeItemStub = jest
                .spyOn(cache, "removeItem")
                .mockImplementation();
            jest.spyOn(cache, "getThrottlingCache").mockReturnValue(
                thumbprintValue
            );
            jest.spyOn(Date, "now").mockReturnValue(1);

            try {
                ThrottlingUtils.preProcess(cache, thumbprint, RANDOM_TEST_GUID);
            } catch {}
            expect(removeItemStub).toHaveBeenCalledTimes(0);

            expect(() =>
                ThrottlingUtils.preProcess(cache, thumbprint, RANDOM_TEST_GUID)
            ).toThrowError(ServerError);
        });

        it("checks the cache and removes an item", () => {
            const thumbprint: RequestThumbprint = THUMBPRINT;
            const thumbprintValue: ThrottlingEntity = THROTTLING_ENTITY;
            const cache = new MockStorageClass(
                TEST_CONFIG.MSAL_CLIENT_ID,
                mockCrypto,
                new Logger({}),
                performanceClient
            );
            const removeItemStub = jest
                .spyOn(cache, "removeItem")
                .mockImplementation();
            jest.spyOn(cache, "getThrottlingCache").mockReturnValue(
                thumbprintValue
            );
            jest.spyOn(Date, "now").mockReturnValue(10);

            ThrottlingUtils.preProcess(cache, thumbprint, RANDOM_TEST_GUID);
            expect(removeItemStub).toHaveBeenCalledTimes(1);

            expect(() =>
                ThrottlingUtils.preProcess(cache, thumbprint, RANDOM_TEST_GUID)
            ).not.toThrow();
        });

        it("checks the cache and does nothing with no match", () => {
            const thumbprint: RequestThumbprint = THUMBPRINT;
            const cache = new MockStorageClass(
                TEST_CONFIG.MSAL_CLIENT_ID,
                mockCrypto,
                new Logger({}),
                performanceClient
            );
            const removeItemStub = jest
                .spyOn(cache, "removeItem")
                .mockImplementation();
            jest.spyOn(cache, "getThrottlingCache").mockReturnValue(null);

            ThrottlingUtils.preProcess(cache, thumbprint, RANDOM_TEST_GUID);
            expect(removeItemStub).toHaveBeenCalledTimes(0);

            expect(() =>
                ThrottlingUtils.preProcess(cache, thumbprint, RANDOM_TEST_GUID)
            ).not.toThrow();
        });
    });

    describe("postProcess", () => {
        it("sets an item in the cache", () => {
            const thumbprint: RequestThumbprint = THUMBPRINT;
            const res: NetworkResponse<ServerAuthorizationTokenResponse> = {
                headers: {},
                body: {},
                status: 429,
            };
            const cache = new MockStorageClass(
                TEST_CONFIG.MSAL_CLIENT_ID,
                mockCrypto,
                new Logger({}),
                performanceClient
            );
            const setItemStub = jest
                .spyOn(cache, "setThrottlingCache")
                .mockImplementation();

            ThrottlingUtils.postProcess(
                cache,
                thumbprint,
                res,
                RANDOM_TEST_GUID
            );
            expect(setItemStub).toHaveBeenCalledTimes(1);
        });

        it("does not set an item in the cache", () => {
            const thumbprint: RequestThumbprint = THUMBPRINT;
            const res: NetworkResponse<ServerAuthorizationTokenResponse> = {
                headers: {},
                body: {},
                status: 200,
            };
            const cache = new MockStorageClass(
                TEST_CONFIG.MSAL_CLIENT_ID,
                mockCrypto,
                new Logger({}),
                performanceClient
            );
            const setItemStub = jest
                .spyOn(cache, "setThrottlingCache")
                .mockImplementation();

            ThrottlingUtils.postProcess(
                cache,
                thumbprint,
                res,
                RANDOM_TEST_GUID
            );
            expect(setItemStub).toHaveBeenCalledTimes(0);
        });
    });

    describe("checkResponseStatus", () => {
        it("returns true if status == 429", () => {
            const res: NetworkResponse<ServerAuthorizationTokenResponse> = {
                headers: {},
                body: {},
                status: 429,
            };

            const bool = ThrottlingUtils.checkResponseStatus(res);
            expect(bool).toBe(true);
        });

        it("returns true if 500 <= status < 600", () => {
            const res: NetworkResponse<ServerAuthorizationTokenResponse> = {
                headers: {},
                body: {},
                status: 500,
            };

            const bool = ThrottlingUtils.checkResponseStatus(res);
            expect(bool).toBe(true);
        });

        it("returns false if status is not 429 or between 500 and 600", () => {
            const res: NetworkResponse<ServerAuthorizationTokenResponse> = {
                headers: {},
                body: {},
                status: 430,
            };

            const bool = ThrottlingUtils.checkResponseStatus(res);
            expect(bool).toBe(false);
        });
    });

    describe("checkResponseForRetryAfter", () => {
        it("returns true when Retry-After header exists and when status <= 200", () => {
            const headers: Record<string, string> = {};
            headers["Retry-After"] = "test";
            const res: NetworkResponse<ServerAuthorizationTokenResponse> = {
                headers,
                body: {},
                status: 199,
            };

            const bool = ThrottlingUtils.checkResponseForRetryAfter(res);
            expect(bool).toBe(true);
        });

        it("returns true when Retry-After header exists and when status > 300", () => {
            const headers: Record<string, string> = {};
            headers["Retry-After"] = "test";
            const res: NetworkResponse<ServerAuthorizationTokenResponse> = {
                headers,
                body: {},
                status: 300,
            };

            const bool = ThrottlingUtils.checkResponseForRetryAfter(res);
            expect(bool).toBe(true);
        });

        it("returns false when there is no RetryAfter header", () => {
            const headers: Record<string, string> = {};
            const res: NetworkResponse<ServerAuthorizationTokenResponse> = {
                headers,
                body: {},
                status: 301,
            };

            const bool = ThrottlingUtils.checkResponseForRetryAfter(res);
            expect(bool).toBe(false);
        });

        it("returns false when 200 <= status < 300", () => {
            const headers: Record<string, string> = {};
            const res: NetworkResponse<ServerAuthorizationTokenResponse> = {
                headers,
                body: {},
                status: 200,
            };

            const bool = ThrottlingUtils.checkResponseForRetryAfter(res);
            expect(bool).toBe(false);
        });
    });

    describe("calculateThrottleTime", () => {
        beforeAll(() => {
            jest.spyOn(Date, "now").mockReturnValue(5000);
        });

        it("returns calculated time to throttle", () => {
            const time = ThrottlingUtils.calculateThrottleTime(10);
            expect(time).toEqual(15000);
        });

        it("calculates with the default time given a bad number", () => {
            const time1 = ThrottlingUtils.calculateThrottleTime(-1);
            const time2 = ThrottlingUtils.calculateThrottleTime(0);
            //@ts-ignore
            const time3 = ThrottlingUtils.calculateThrottleTime(null);

            // Based on Constants.DEFAULT_THROTTLE_TIME_SECONDS
            expect(time1).toEqual(65000);
            expect(time2).toEqual(65000);
            expect(time3).toEqual(65000);
        });

        it("calculates with the default MAX if given too large of a number", () => {
            const time = ThrottlingUtils.calculateThrottleTime(1000000000);

            // Based on Constants.DEFAULT_MAX_THROTTLE_TIME_SECONDS
            expect(time).toEqual(3605000);
        });
    });

    describe("removeThrottle", () => {
        it("removes the entry from storage", () => {
            const cache = new MockStorageClass(
                TEST_CONFIG.MSAL_CLIENT_ID,
                mockCrypto,
                new Logger({}),
                performanceClient
            );
            const clientId = TEST_CONFIG.MSAL_CLIENT_ID;
            const removeItemStub = jest.spyOn(cache, "removeItem");

            const request: BaseAuthRequest = {
                authority: TEST_CONFIG.validAuthority,
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                correlationId: TEST_CONFIG.CORRELATION_ID,
            };

            ThrottlingUtils.removeThrottle(cache, clientId, request);
            expect(removeItemStub).toHaveBeenCalledTimes(1);
        });
    });

    // Documents the app-wide fallback: when the thumbprint has NO user component
    // (homeAccountIdentifier), error-class throttling remains app-wide. This confirms the
    // per-user keying does not change behavior for flows that cannot supply a user identity.
    describe("App-wide throttling when no user component is present", () => {
        it("throttles a different user after another user's 5xx because the thumbprint has no user component", () => {
            const cache = new MockStorageClass(
                TEST_CONFIG.MSAL_CLIENT_ID,
                mockCrypto,
                new Logger({}),
                performanceClient
            );

            // Two logically different users issuing the same public-client request
            // (same clientId, authority and scopes). Because no user component is
            // supplied, the requests are indistinguishable.
            const userARequest: BaseAuthRequest = {
                authority: TEST_CONFIG.validAuthority,
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                correlationId: TEST_CONFIG.CORRELATION_ID,
            };
            const userBRequest: BaseAuthRequest = {
                authority: TEST_CONFIG.validAuthority,
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                correlationId: TEST_CONFIG.CORRELATION_ID,
            };

            const thumbprintA = getRequestThumbprint(
                TEST_CONFIG.MSAL_CLIENT_ID,
                userARequest
            );
            const thumbprintB = getRequestThumbprint(
                TEST_CONFIG.MSAL_CLIENT_ID,
                userBRequest
            );

            // The two users collide on the same app-wide throttling key.
            expect(
                ThrottlingUtils.generateThrottlingStorageKey(thumbprintA)
            ).toEqual(
                ThrottlingUtils.generateThrottlingStorageKey(thumbprintB)
            );

            // User A's token request fails with a server-side 500.
            const userAResponse: NetworkResponse<ServerAuthorizationTokenResponse> =
                {
                    headers: {},
                    body: {
                        error: "server_error",
                        error_description: "user A's request failed",
                    },
                    status: 500,
                };
            ThrottlingUtils.postProcess(
                cache,
                thumbprintA,
                userAResponse,
                RANDOM_TEST_GUID
            );

            // With no user component the 5xx is stored app-wide, so User B is throttled.
            expect(() =>
                ThrottlingUtils.preProcess(cache, thumbprintB, RANDOM_TEST_GUID)
            ).toThrowError(ServerError);
        });
    });

    // Verifies response-type-aware throttling: when a user component (homeAccountIdentifier) is
    // present, error-class (HTTP 5xx) throttling is scoped per-user, while service-directed
    // throttling (HTTP 429 / Retry-After) stays app-wide.
    describe("Response-type-aware throttling", () => {
        const baseRequest: BaseAuthRequest = {
            authority: TEST_CONFIG.validAuthority,
            scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
            correlationId: TEST_CONFIG.CORRELATION_ID,
        };

        const server500Response: NetworkResponse<ServerAuthorizationTokenResponse> =
            {
                headers: {},
                body: {
                    error: "server_error",
                    error_description: "user A's request failed",
                },
                status: 500,
            };

        const http429Response: NetworkResponse<ServerAuthorizationTokenResponse> =
            {
                headers: {},
                body: {
                    error: "temporarily_unavailable",
                    error_description: "too many requests",
                },
                status: 429,
            };

        it("does NOT throttle a different user after another user's 5xx (per-user error-class throttling)", () => {
            const cache = new MockStorageClass(
                TEST_CONFIG.MSAL_CLIENT_ID,
                mockCrypto,
                new Logger({}),
                performanceClient
            );

            const thumbprintA = getRequestThumbprint(
                TEST_CONFIG.MSAL_CLIENT_ID,
                baseRequest,
                "userA-home-account-id"
            );
            const thumbprintB = getRequestThumbprint(
                TEST_CONFIG.MSAL_CLIENT_ID,
                baseRequest,
                "userB-home-account-id"
            );

            // User A's request fails with HTTP 500.
            ThrottlingUtils.postProcess(
                cache,
                thumbprintA,
                server500Response,
                RANDOM_TEST_GUID
            );

            // User B (a different user) is NOT throttled by user A's failure.
            expect(() =>
                ThrottlingUtils.preProcess(cache, thumbprintB, RANDOM_TEST_GUID)
            ).not.toThrow();

            // User A itself remains throttled.
            expect(() =>
                ThrottlingUtils.preProcess(cache, thumbprintA, RANDOM_TEST_GUID)
            ).toThrowError(ServerError);
        });

        it("DOES throttle a different user after another user's 429 (service-directed throttling stays app-wide)", () => {
            const cache = new MockStorageClass(
                TEST_CONFIG.MSAL_CLIENT_ID,
                mockCrypto,
                new Logger({}),
                performanceClient
            );

            const thumbprintA = getRequestThumbprint(
                TEST_CONFIG.MSAL_CLIENT_ID,
                baseRequest,
                "userA-home-account-id"
            );
            const thumbprintB = getRequestThumbprint(
                TEST_CONFIG.MSAL_CLIENT_ID,
                baseRequest,
                "userB-home-account-id"
            );

            // User A's request fails with HTTP 429 (service-directed rate limiting).
            ThrottlingUtils.postProcess(
                cache,
                thumbprintA,
                http429Response,
                RANDOM_TEST_GUID
            );

            // User B is throttled because 429 back-off is app-wide.
            expect(() =>
                ThrottlingUtils.preProcess(cache, thumbprintB, RANDOM_TEST_GUID)
            ).toThrowError(ServerError);
        });
    });
});
