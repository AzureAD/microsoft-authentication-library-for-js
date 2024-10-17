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
} from "../test_kit/StringConstants.js";
import { ServerError } from "../../src/error/ServerError.js";
import { BaseAuthRequest, Logger } from "../../src/index.js";

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
                new Logger({})
            );
            const removeItemStub = jest
                .spyOn(cache, "removeItem")
                .mockImplementation();
            jest.spyOn(cache, "getThrottlingCache").mockReturnValue(
                thumbprintValue
            );
            jest.spyOn(Date, "now").mockReturnValue(1);

            try {
                ThrottlingUtils.preProcess(cache, thumbprint);
            } catch {}
            expect(removeItemStub).toHaveBeenCalledTimes(0);

            expect(() =>
                ThrottlingUtils.preProcess(cache, thumbprint)
            ).toThrowError(ServerError);
        });

        it("checks the cache and removes an item", () => {
            const thumbprint: RequestThumbprint = THUMBPRINT;
            const thumbprintValue: ThrottlingEntity = THROTTLING_ENTITY;
            const cache = new MockStorageClass(
                TEST_CONFIG.MSAL_CLIENT_ID,
                mockCrypto,
                new Logger({})
            );
            const removeItemStub = jest
                .spyOn(cache, "removeItem")
                .mockImplementation();
            jest.spyOn(cache, "getThrottlingCache").mockReturnValue(
                thumbprintValue
            );
            jest.spyOn(Date, "now").mockReturnValue(10);

            ThrottlingUtils.preProcess(cache, thumbprint);
            expect(removeItemStub).toHaveBeenCalledTimes(1);

            expect(() =>
                ThrottlingUtils.preProcess(cache, thumbprint)
            ).not.toThrow();
        });

        it("checks the cache and does nothing with no match", () => {
            const thumbprint: RequestThumbprint = THUMBPRINT;
            const cache = new MockStorageClass(
                TEST_CONFIG.MSAL_CLIENT_ID,
                mockCrypto,
                new Logger({})
            );
            const removeItemStub = jest
                .spyOn(cache, "removeItem")
                .mockImplementation();
            jest.spyOn(cache, "getThrottlingCache").mockReturnValue(null);

            ThrottlingUtils.preProcess(cache, thumbprint);
            expect(removeItemStub).toHaveBeenCalledTimes(0);

            expect(() =>
                ThrottlingUtils.preProcess(cache, thumbprint)
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
                new Logger({})
            );
            const setItemStub = jest
                .spyOn(cache, "setThrottlingCache")
                .mockImplementation();

            ThrottlingUtils.postProcess(cache, thumbprint, res);
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
                new Logger({})
            );
            const setItemStub = jest
                .spyOn(cache, "setThrottlingCache")
                .mockImplementation();

            ThrottlingUtils.postProcess(cache, thumbprint, res);
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
                new Logger({})
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
