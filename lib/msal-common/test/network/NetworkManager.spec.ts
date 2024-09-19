/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ThrottlingUtils } from "../../src/network/ThrottlingUtils";
import { RequestThumbprint } from "../../src/network/RequestThumbprint";
import {
    NetworkManager,
    NetworkResponse,
} from "../../src/network/NetworkManager";
import { ServerAuthorizationTokenResponse } from "../../src/response/ServerAuthorizationTokenResponse";
import { MockStorageClass, mockCrypto } from "../client/ClientTestUtils";
import { NetworkRequestOptions } from "../../src/network/INetworkModule";
import { ServerError } from "../../src/error/ServerError";
import {
    AUTHENTICATION_RESULT,
    NETWORK_REQUEST_OPTIONS,
    THUMBPRINT,
    THROTTLING_ENTITY,
    DEFAULT_NETWORK_IMPLEMENTATION,
    TEST_CONFIG,
} from "../test_kit/StringConstants";
import {
    ClientAuthErrorCodes,
    createClientAuthError,
} from "../../src/error/ClientAuthError";
import { Logger } from "../../src/logger/Logger";

const thumbprint: RequestThumbprint = THUMBPRINT;

const sendPostRequest = async (
    cache: MockStorageClass
): Promise<NetworkResponse<ServerAuthorizationTokenResponse>> => {
    const networkManager = new NetworkManager(
        DEFAULT_NETWORK_IMPLEMENTATION,
        cache
    );

    return await networkManager.sendPostRequest<ServerAuthorizationTokenResponse>(
        thumbprint,
        "tokenEndpoint",
        NETWORK_REQUEST_OPTIONS as NetworkRequestOptions
    );
};

describe("NetworkManager", () => {
    describe("sendPostRequest", () => {
        let cache: MockStorageClass;
        let sendPostRequestAsyncSpy: jest.SpyInstance;
        let getThrottlingCacheSpy: jest.SpyInstance;
        let setThrottlingCacheSpy: jest.SpyInstance;
        let removeItemSpy: jest.SpyInstance;
        let nowSpy: jest.SpyInstance;
        beforeEach(async () => {
            cache = new MockStorageClass(
                TEST_CONFIG.MSAL_CLIENT_ID,
                mockCrypto,
                new Logger({})
            );

            sendPostRequestAsyncSpy = jest.spyOn(
                DEFAULT_NETWORK_IMPLEMENTATION,
                "sendPostRequestAsync"
            );
            getThrottlingCacheSpy = jest.spyOn(cache, "getThrottlingCache");
            setThrottlingCacheSpy = jest.spyOn(cache, "setThrottlingCache");
            removeItemSpy = jest.spyOn(cache, "removeItem");
            nowSpy = jest.spyOn(Date, "now");
        });

        afterEach(() => {
            cache.clear();
            jest.restoreAllMocks();
        });

        it("returns a response", async () => {
            const mockRes: NetworkResponse<ServerAuthorizationTokenResponse> = {
                headers: {},
                body: AUTHENTICATION_RESULT.body,
                status: 200,
            };
            sendPostRequestAsyncSpy.mockReturnValue(Promise.resolve(mockRes));
            nowSpy.mockReturnValue(1);

            const result = await sendPostRequest(cache);
            expect(result).toEqual(mockRes);

            expect(sendPostRequestAsyncSpy.mock.calls.length === 1);
            expect(getThrottlingCacheSpy.mock.calls.length === 1);
            expect(setThrottlingCacheSpy.mock.calls.length === 0);
            expect(removeItemSpy.mock.calls.length === 0);
        });

        it("blocks the request if item is found in the cache", async () => {
            const mockThrottlingEntity = THROTTLING_ENTITY;
            getThrottlingCacheSpy.mockReturnValue(mockThrottlingEntity);
            nowSpy.mockReturnValue(1);

            try {
                await sendPostRequest(cache);
            } catch {}
            expect(() => ThrottlingUtils.preProcess(cache, thumbprint)).toThrow(
                ServerError
            );

            expect(sendPostRequestAsyncSpy.mock.calls.length === 0);
            expect(getThrottlingCacheSpy.mock.calls.length === 1);
            expect(setThrottlingCacheSpy.mock.calls.length === 0);
            expect(removeItemSpy.mock.calls.length === 0);
        });

        it("passes request through if expired item in cache", async () => {
            const mockRes: NetworkResponse<ServerAuthorizationTokenResponse> = {
                headers: {},
                body: AUTHENTICATION_RESULT.body,
                status: 200,
            };
            const mockThrottlingEntity = THROTTLING_ENTITY;
            sendPostRequestAsyncSpy.mockReturnValue(Promise.resolve(mockRes));
            getThrottlingCacheSpy.mockReturnValue(mockThrottlingEntity);
            nowSpy.mockReturnValue(10);

            const result = await sendPostRequest(cache);
            expect(result).toEqual(mockRes);

            expect(sendPostRequestAsyncSpy.mock.calls.length === 1);
            expect(getThrottlingCacheSpy.mock.calls.length === 1);
            expect(setThrottlingCacheSpy.mock.calls.length === 0);
            expect(removeItemSpy.mock.calls.length === 1);
        });

        it("creates cache entry on error", async () => {
            const mockRes: NetworkResponse<ServerAuthorizationTokenResponse> = {
                headers: {},
                body: AUTHENTICATION_RESULT.body,
                status: 500,
            };
            sendPostRequestAsyncSpy.mockReturnValue(Promise.resolve(mockRes));
            nowSpy.mockReturnValue(1);

            const result = await sendPostRequest(cache);
            expect(result).toEqual(mockRes);

            expect(sendPostRequestAsyncSpy.mock.calls.length === 1);
            expect(getThrottlingCacheSpy.mock.calls.length === 1);
            expect(setThrottlingCacheSpy.mock.calls.length === 1);
            expect(removeItemSpy.mock.calls.length === 0);
        });

        it("throws network error if fetch client fails", async () => {
            sendPostRequestAsyncSpy.mockReturnValue(
                Promise.reject("Fetch failed")
            );

            await expect(sendPostRequest(cache)).rejects.toMatchObject(
                createClientAuthError(ClientAuthErrorCodes.networkError)
            );
        });
    });
});
