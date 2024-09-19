/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ThrottlingUtils } from "../../src/network/ThrottlingUtils";
import { RequestThumbprint } from "../../src/network/RequestThumbprint";
import { ThrottlingEntity } from "../../src/cache/entities/ThrottlingEntity";
import { NetworkResponse } from "../../src/network/NetworkManager";
import { ServerAuthorizationTokenResponse } from "../../src/response/ServerAuthorizationTokenResponse";
import { MockStorageClass, mockCrypto } from "../client/ClientTestUtils";
import {
    THUMBPRINT,
    THROTTLING_ENTITY,
    TEST_CONFIG,
} from "../test_kit/StringConstants";
import { ServerError } from "../../src/error/ServerError";
import { BaseAuthRequest, Logger } from "../../src";

const thumbprint: RequestThumbprint = THUMBPRINT;
const thumbprintValue: ThrottlingEntity = THROTTLING_ENTITY;

describe("ThrottlingUtils", () => {
    let cache: MockStorageClass;
    let removeItemSpy: jest.SpyInstance;
    beforeEach(() => {
        cache = new MockStorageClass(
            TEST_CONFIG.MSAL_CLIENT_ID,
            mockCrypto,
            new Logger({})
        );
        removeItemSpy = jest.spyOn(cache, "removeItem");
    });

    afterEach(() => {
        cache.clear();
        removeItemSpy.mockRestore();
    });

    describe("generateThrottlingStorageKey", () => {
        it("returns a throttling key", () => {
            const jsonString = JSON.stringify(thumbprint);
            const key =
                ThrottlingUtils.generateThrottlingStorageKey(thumbprint);

            expect(key).toEqual(`throttling.${jsonString}`);
        });
    });

    describe("preProcess", () => {
        it("checks the cache and throws an error", () => {
            const getThrottlingCacheSpy: jest.SpyInstance = jest
                .spyOn(cache, "getThrottlingCache")
                .mockReturnValueOnce(thumbprintValue);
            const nowSpy: jest.SpyInstance = jest
                .spyOn(Date, "now")
                .mockReturnValueOnce(1);

            expect(() => ThrottlingUtils.preProcess(cache, thumbprint)).toThrow(
                ServerError
            );
            expect(removeItemSpy.mock.calls.length === 0);

            getThrottlingCacheSpy.mockRestore();
            nowSpy.mockRestore();
        });

        it("checks the cache and removes an item", () => {
            const cache = new MockStorageClass(
                TEST_CONFIG.MSAL_CLIENT_ID,
                mockCrypto,
                new Logger({})
            );
            const getThrottlingCacheSpy: jest.SpyInstance = jest
                .spyOn(cache, "getThrottlingCache")
                .mockReturnValueOnce(thumbprintValue);
            const nowSpy: jest.SpyInstance = jest
                .spyOn(Date, "now")
                .mockReturnValueOnce(10);

            expect(() =>
                ThrottlingUtils.preProcess(cache, thumbprint)
            ).not.toThrow();
            expect(removeItemSpy.mock.calls.length === 1);

            getThrottlingCacheSpy.mockRestore();
            nowSpy.mockRestore();
        });

        it("checks the cache and does nothing with no match", () => {
            const getThrottlingCacheSpy: jest.SpyInstance = jest
                .spyOn(cache, "getThrottlingCache")
                .mockReturnValueOnce(null);

            expect(() =>
                ThrottlingUtils.preProcess(cache, thumbprint)
            ).not.toThrow();
            expect(removeItemSpy.mock.calls.length === 1);

            getThrottlingCacheSpy.mockRestore();
        });
    });

    describe("postProcess", () => {
        it("sets an item in the cache", () => {
            const res: NetworkResponse<ServerAuthorizationTokenResponse> = {
                headers: {},
                body: {},
                status: 429,
            };

            ThrottlingUtils.postProcess(cache, thumbprint, res);
            expect(removeItemSpy.mock.calls.length === 1);
        });

        it("does not set an item in the cache", () => {
            const res: NetworkResponse<ServerAuthorizationTokenResponse> = {
                headers: {},
                body: {},
                status: 200,
            };

            ThrottlingUtils.postProcess(cache, thumbprint, res);
            expect(removeItemSpy.mock.calls.length === 0);
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
        let nowSpy: jest.SpyInstance;
        beforeAll(() => {
            nowSpy = jest.spyOn(Date, "now").mockReturnValue(5000);
        });

        afterAll(() => {
            nowSpy.mockRestore();
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
            const request: BaseAuthRequest = {
                authority: TEST_CONFIG.validAuthority,
                scopes: TEST_CONFIG.DEFAULT_SCOPES,
                correlationId: TEST_CONFIG.CORRELATION_ID,
            };

            ThrottlingUtils.removeThrottle(
                cache,
                TEST_CONFIG.MSAL_CLIENT_ID,
                request
            );
            expect(removeItemSpy.mock.calls.length === 1);
        });
    });
});
