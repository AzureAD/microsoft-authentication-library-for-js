/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ThrottlingUtils } from "../../src/network/ThrottlingUtils.js";
import { RequestThumbprint } from "../../src/network/RequestThumbprint.js";
import {
    NetworkManager,
    NetworkResponse,
} from "../../src/network/NetworkManager.js";
import { ServerAuthorizationTokenResponse } from "../../src/response/ServerAuthorizationTokenResponse.js";
import { MockStorageClass, mockCrypto } from "../client/ClientTestUtils.js";
import { NetworkRequestOptions } from "../../src/network/INetworkModule.js";
import { ServerError } from "../../src/error/ServerError.js";
import {
    AUTHENTICATION_RESULT,
    NETWORK_REQUEST_OPTIONS,
    THUMBPRINT,
    THROTTLING_ENTITY,
    DEFAULT_NETWORK_IMPLEMENTATION,
    TEST_CONFIG,
} from "../test_kit/StringConstants.js";
import {
    ClientAuthError,
    ClientAuthErrorCodes,
} from "../../src/error/ClientAuthError.js";
import { Logger } from "../../src/logger/Logger.js";

describe("NetworkManager", () => {
    describe("sendPostRequest", () => {
        afterEach(() => {
            jest.restoreAllMocks();
        });

        it("returns a response", async () => {
            const networkInterface = DEFAULT_NETWORK_IMPLEMENTATION;
            const cache = new MockStorageClass(
                TEST_CONFIG.MSAL_CLIENT_ID,
                mockCrypto,
                new Logger({})
            );
            const networkManager = new NetworkManager(networkInterface, cache);
            const thumbprint: RequestThumbprint = THUMBPRINT;
            const options: NetworkRequestOptions = NETWORK_REQUEST_OPTIONS;
            const mockRes: NetworkResponse<ServerAuthorizationTokenResponse> = {
                headers: {},
                body: AUTHENTICATION_RESULT.body,
                status: 200,
            };
            const networkStub = jest
                .spyOn(networkInterface, "sendPostRequestAsync")
                .mockResolvedValue(mockRes);
            const getThrottlingStub = jest
                .spyOn(cache, "getThrottlingCache")
                .mockImplementation();
            const setThrottlingStub = jest
                .spyOn(cache, "setThrottlingCache")
                .mockImplementation();
            const removeItemStub = jest
                .spyOn(cache, "removeItem")
                .mockImplementation();
            jest.spyOn(Date, "now").mockReturnValue(1);

            const res =
                await networkManager.sendPostRequest<ServerAuthorizationTokenResponse>(
                    thumbprint,
                    "tokenEndpoint",
                    options
                );

            expect(networkStub).toHaveBeenCalledTimes(1);
            expect(getThrottlingStub).toHaveBeenCalledTimes(1);
            expect(setThrottlingStub).toHaveBeenCalledTimes(0);
            expect(removeItemStub).toHaveBeenCalledTimes(0);
            expect(res).toEqual(mockRes);
        });

        it("blocks the request if item is found in the cache", async () => {
            const networkInterface = DEFAULT_NETWORK_IMPLEMENTATION;
            const cache = new MockStorageClass(
                TEST_CONFIG.MSAL_CLIENT_ID,
                mockCrypto,
                new Logger({})
            );
            const networkManager = new NetworkManager(networkInterface, cache);
            const thumbprint: RequestThumbprint = THUMBPRINT;
            const options: NetworkRequestOptions = NETWORK_REQUEST_OPTIONS;
            const mockThrottlingEntity = THROTTLING_ENTITY;
            const networkStub = jest
                .spyOn(networkInterface, "sendPostRequestAsync")
                .mockImplementation();
            const getThrottlingStub = jest
                .spyOn(cache, "getThrottlingCache")
                .mockReturnValue(mockThrottlingEntity);
            const setThrottlingStub = jest
                .spyOn(cache, "setThrottlingCache")
                .mockImplementation();
            const removeItemStub = jest
                .spyOn(cache, "removeItem")
                .mockImplementation();
            jest.spyOn(Date, "now").mockReturnValue(1);

            try {
                await networkManager.sendPostRequest<ServerAuthorizationTokenResponse>(
                    thumbprint,
                    "tokenEndpoint",
                    options
                );
            } catch {}

            expect(networkStub).toHaveBeenCalledTimes(0);
            expect(getThrottlingStub).toHaveBeenCalledTimes(1);
            expect(setThrottlingStub).toHaveBeenCalledTimes(0);
            expect(removeItemStub).toHaveBeenCalledTimes(0);
            expect(() =>
                ThrottlingUtils.preProcess(cache, thumbprint)
            ).toThrowError(ServerError);
        });

        it("passes request through if expired item in cache", async () => {
            const networkInterface = DEFAULT_NETWORK_IMPLEMENTATION;
            const cache = new MockStorageClass(
                TEST_CONFIG.MSAL_CLIENT_ID,
                mockCrypto,
                new Logger({})
            );
            const networkManager = new NetworkManager(networkInterface, cache);
            const thumbprint: RequestThumbprint = THUMBPRINT;
            const options: NetworkRequestOptions = NETWORK_REQUEST_OPTIONS;
            const mockRes: NetworkResponse<ServerAuthorizationTokenResponse> = {
                headers: {},
                body: AUTHENTICATION_RESULT.body,
                status: 200,
            };
            const mockThrottlingEntity = THROTTLING_ENTITY;
            const networkStub = jest
                .spyOn(networkInterface, "sendPostRequestAsync")
                .mockResolvedValue(mockRes);
            const getThrottlingStub = jest
                .spyOn(cache, "getThrottlingCache")
                .mockReturnValue(mockThrottlingEntity);
            const setThrottlingStub = jest
                .spyOn(cache, "setThrottlingCache")
                .mockImplementation();
            const removeItemStub = jest
                .spyOn(cache, "removeItem")
                .mockImplementation();
            jest.spyOn(Date, "now").mockReturnValue(10);

            const res =
                await networkManager.sendPostRequest<ServerAuthorizationTokenResponse>(
                    thumbprint,
                    "tokenEndpoint",
                    options
                );

            expect(networkStub).toHaveBeenCalledTimes(1);
            expect(getThrottlingStub).toHaveBeenCalledTimes(1);
            expect(setThrottlingStub).toHaveBeenCalledTimes(0);
            expect(removeItemStub).toHaveBeenCalledTimes(1);
            expect(res).toEqual(mockRes);
        });

        it("creates cache entry on error", async () => {
            const networkInterface = DEFAULT_NETWORK_IMPLEMENTATION;
            const cache = new MockStorageClass(
                TEST_CONFIG.MSAL_CLIENT_ID,
                mockCrypto,
                new Logger({})
            );
            const networkManager = new NetworkManager(networkInterface, cache);
            const thumbprint: RequestThumbprint = THUMBPRINT;
            const options: NetworkRequestOptions = NETWORK_REQUEST_OPTIONS;
            const mockRes: NetworkResponse<ServerAuthorizationTokenResponse> = {
                headers: {},
                body: AUTHENTICATION_RESULT.body,
                status: 500,
            };
            const networkStub = jest
                .spyOn(networkInterface, "sendPostRequestAsync")
                .mockResolvedValue(mockRes);
            const getThrottlingStub = jest
                .spyOn(cache, "getThrottlingCache")
                .mockImplementation();
            const setThrottlingStub = jest
                .spyOn(cache, "setThrottlingCache")
                .mockImplementation();
            const removeItemStub = jest
                .spyOn(cache, "removeItem")
                .mockImplementation();
            jest.spyOn(Date, "now").mockReturnValue(1);

            const res =
                await networkManager.sendPostRequest<ServerAuthorizationTokenResponse>(
                    thumbprint,
                    "tokenEndpoint",
                    options
                );

            expect(networkStub).toHaveBeenCalledTimes(1);
            expect(getThrottlingStub).toHaveBeenCalledTimes(1);
            expect(setThrottlingStub).toHaveBeenCalledTimes(1);
            expect(removeItemStub).toHaveBeenCalledTimes(0);
            expect(res).toEqual(mockRes);
        });

        it("throws network error if fetch client fails", (done) => {
            const networkInterface = DEFAULT_NETWORK_IMPLEMENTATION;
            const cache = new MockStorageClass(
                TEST_CONFIG.MSAL_CLIENT_ID,
                mockCrypto,
                new Logger({})
            );
            const networkManager = new NetworkManager(networkInterface, cache);
            const thumbprint: RequestThumbprint = THUMBPRINT;
            const options: NetworkRequestOptions = NETWORK_REQUEST_OPTIONS;

            jest.spyOn(
                networkInterface,
                "sendPostRequestAsync"
            ).mockRejectedValue(new Error("Fetch failed"));

            networkManager
                .sendPostRequest<ServerAuthorizationTokenResponse>(
                    thumbprint,
                    "tokenEndpoint",
                    options
                )
                .catch((e) => {
                    expect(e).toBeInstanceOf(ClientAuthError);
                    expect(e.errorCode).toBe(ClientAuthErrorCodes.networkError);
                    done();
                });
        });
    });
});
