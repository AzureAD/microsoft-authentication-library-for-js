/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ThrottlingUtils } from "../../src/network/ThrottlingUtils.js";
import { RequestThumbprint } from "../../src/network/RequestThumbprint.js";
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
const retryAfterHeaderNames = [
    "Retry-After",
    "retry-after",
    "RETRY-AFTER",
    "rEtRy-AfTeR",
];

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
        let cache: MockStorageClass;

        beforeEach(() => {
            jest.spyOn(Date, "now").mockReturnValue(5_000);
            cache = new MockStorageClass(
                TEST_CONFIG.MSAL_CLIENT_ID,
                mockCrypto,
                new Logger({}),
                performanceClient
            );
        });

        afterEach(() => {
            jest.restoreAllMocks();
        });

        it("reads normalized response headers without enumerating them", () => {
            const enumerateHeaders = jest.fn(Reflect.ownKeys);
            const response: NetworkResponse<ServerAuthorizationTokenResponse> =
                {
                    headers: new Proxy<Record<string, string>>(
                        { "retry-after": "120" },
                        { ownKeys: enumerateHeaders }
                    ),
                    body: {},
                    status: 400,
                };

            ThrottlingUtils.postProcess(
                cache,
                THUMBPRINT,
                response,
                RANDOM_TEST_GUID
            );

            expect(enumerateHeaders).not.toHaveBeenCalled();
            expect(
                cache.getThrottlingCache(
                    ThrottlingUtils.generateThrottlingStorageKey(THUMBPRINT)
                )
            ).toMatchObject({ throttleTime: 125_000 });
        });

        it.each(
            retryAfterHeaderNames.flatMap((headerName) =>
                [199, 300, 400, 429, 500, 503].map((status) => ({
                    headerName,
                    status,
                }))
            )
        )(
            "honors raw $headerName on HTTP $status responses",
            ({ headerName, status }) => {
                const headers = Object.freeze({ [headerName]: "120" });
                const response: NetworkResponse<ServerAuthorizationTokenResponse> =
                    {
                        headers,
                        body: {
                            error: "invalid_grant",
                            error_codes: ["50196"],
                            error_description: "test-description",
                            suberror: "test-suberror",
                        },
                        status,
                    };

                ThrottlingUtils.postProcess(
                    cache,
                    THUMBPRINT,
                    response,
                    RANDOM_TEST_GUID
                );

                expect(
                    cache.getThrottlingCache(
                        ThrottlingUtils.generateThrottlingStorageKey(THUMBPRINT)
                    )
                ).toMatchObject({
                    throttleTime: 125_000,
                    error: "invalid_grant",
                    errorCodes: ["50196"],
                    errorMessage: "test-description",
                    subError: "test-suberror",
                });
                expect(response.headers).toBe(headers);
                expect(headers[headerName]).toBe("120");
            }
        );

        it.each([429, 500, 503])(
            "uses the default throttle time on HTTP %i without Retry-After",
            (status) => {
                ThrottlingUtils.postProcess(
                    cache,
                    THUMBPRINT,
                    { headers: {}, body: {}, status },
                    RANDOM_TEST_GUID
                );

                expect(
                    cache.getThrottlingCache(
                        ThrottlingUtils.generateThrottlingStorageKey(THUMBPRINT)
                    )
                ).toMatchObject({ throttleTime: 65_000 });
            }
        );

        it.each(
            retryAfterHeaderNames.flatMap((headerName) =>
                ["", "invalid", "0", "-1"].map((retryAfter) => ({
                    headerName,
                    retryAfter,
                }))
            )
        )(
            "uses the default throttle time for $headerName '$retryAfter'",
            ({ headerName, retryAfter }) => {
                ThrottlingUtils.postProcess(
                    cache,
                    THUMBPRINT,
                    {
                        headers: { [headerName]: retryAfter },
                        body: {},
                        status: 400,
                    },
                    RANDOM_TEST_GUID
                );

                expect(
                    cache.getThrottlingCache(
                        ThrottlingUtils.generateThrottlingStorageKey(THUMBPRINT)
                    )
                ).toMatchObject({ throttleTime: 65_000 });
            }
        );

        it.each(retryAfterHeaderNames)(
            "caps a raw %s duration at the existing maximum",
            (headerName) => {
                ThrottlingUtils.postProcess(
                    cache,
                    THUMBPRINT,
                    {
                        headers: { [headerName]: "1000000000" },
                        body: {},
                        status: 429,
                    },
                    RANDOM_TEST_GUID
                );

                expect(
                    cache.getThrottlingCache(
                        ThrottlingUtils.generateThrottlingStorageKey(THUMBPRINT)
                    )
                ).toMatchObject({ throttleTime: 3_605_000 });
            }
        );

        it("does not throttle HTTP 400 without Retry-After", () => {
            const setItem = jest.spyOn(cache, "setThrottlingCache");

            ThrottlingUtils.postProcess(
                cache,
                THUMBPRINT,
                { headers: {}, body: {}, status: 400 },
                RANDOM_TEST_GUID
            );

            expect(setItem).not.toHaveBeenCalled();
        });

        it.each([200, 204, 299])(
            "does not read headers or cache a throttle on HTTP %i",
            (status) => {
                const thumbprint: RequestThumbprint = THUMBPRINT;
                const readHeaders = jest.fn(() => ({ "rEtRy-AfTeR": "120" }));
                const res: NetworkResponse<ServerAuthorizationTokenResponse> = {
                    get headers() {
                        return readHeaders();
                    },
                    body: {},
                    status,
                };
                const setItemStub = jest.spyOn(cache, "setThrottlingCache");

                ThrottlingUtils.postProcess(
                    cache,
                    thumbprint,
                    res,
                    RANDOM_TEST_GUID
                );
                expect(setItemStub).toHaveBeenCalledTimes(0);
                expect(readHeaders).not.toHaveBeenCalled();
            }
        );
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
        it.each(
            retryAfterHeaderNames.flatMap((headerName) =>
                [199, 300, 400, 429, 500, 503].map((status) => ({
                    headerName,
                    status,
                }))
            )
        )(
            "returns true when raw $headerName exists on HTTP $status",
            ({ headerName, status }) => {
                const res: NetworkResponse<ServerAuthorizationTokenResponse> = {
                    headers: { [headerName]: "test" },
                    body: {},
                    status,
                };

                expect(ThrottlingUtils.checkResponseForRetryAfter(res)).toBe(
                    true
                );
            }
        );

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

        it.each(retryAfterHeaderNames)(
            "ignores an inherited %s header",
            (headerName) => {
                const headers: Record<string, string> = {};
                Object.setPrototypeOf(headers, { [headerName]: "120" });
                const response: NetworkResponse<ServerAuthorizationTokenResponse> =
                    { headers, body: {}, status: 400 };

                expect(
                    ThrottlingUtils.checkResponseForRetryAfter(response)
                ).toBe(false);
            }
        );

        it.each(
            retryAfterHeaderNames.flatMap((headerName) =>
                [200, 204, 299].map((status) => ({
                    headerName,
                    status,
                }))
            )
        )(
            "returns false when raw $headerName exists on HTTP $status",
            ({ headerName, status }) => {
                const res: NetworkResponse<ServerAuthorizationTokenResponse> = {
                    headers: { [headerName]: "test" },
                    body: {},
                    status,
                };

                expect(ThrottlingUtils.checkResponseForRetryAfter(res)).toBe(
                    false
                );
            }
        );
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
});
