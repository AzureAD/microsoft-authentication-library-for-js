import * as TokenProtocol from "../../src/protocol/Token.js";
import {
    HeaderNames,
    URL_FORM_CONTENT_TYPE,
} from "../../src/utils/Constants.js";
import {
    DEFAULT_OPENID_CONFIG_RESPONSE,
    AUTHENTICATION_RESULT,
    NETWORK_REQUEST_OPTIONS,
    THUMBPRINT,
    THROTTLING_ENTITY,
    RANDOM_TEST_GUID,
    TEST_CONFIG,
} from "../test_kit/StringConstants.js";
import { Authority } from "../../src/authority/Authority.js";

import { ThrottlingUtils } from "../../src/network/ThrottlingUtils.js";
import { RequestThumbprint } from "../../src/network/RequestThumbprint.js";
import { NetworkResponse } from "../../src/network/NetworkResponse.js";
import { ServerAuthorizationTokenResponse } from "../../src/response/ServerAuthorizationTokenResponse.js";
import { NetworkRequestOptions } from "../../src/network/INetworkModule.js";
import { ServerError } from "../../src/error/ServerError.js";
import {
    ClientAuthError,
    ClientAuthErrorCodes,
} from "../../src/error/ClientAuthError.js";
import { StubPerformanceClient } from "../../src/index.js";
import { Logger } from "../../src/logger/Logger.js";
import {
    mockCrypto,
    mockNetworkClient,
    MockStorageClass,
} from "../client/ClientTestUtils.js";
import { CacheManager } from "../../src/cache/CacheManager.js";

describe("BaseClient.ts Class Unit Tests", () => {
    let mockCache: CacheManager;
    beforeEach(() => {
        mockCache = new MockStorageClass(
            TEST_CONFIG.MSAL_CLIENT_ID,
            mockCrypto,
            new Logger({}),
            new StubPerformanceClient()
        );
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("Header utils", () => {
        beforeEach(() => {
            jest.spyOn(
                Authority.prototype,
                <any>"getEndpointMetadataFromNetwork"
            ).mockResolvedValue(DEFAULT_OPENID_CONFIG_RESPONSE.body);
        });

        it("Creates default token request headers", async () => {
            const headers = TokenProtocol.createTokenRequestHeaders(
                new Logger({}),
                false
            );

            expect(headers[HeaderNames.CONTENT_TYPE]).toBe(
                URL_FORM_CONTENT_TYPE
            );
        });

        it("Creates default token request headers", async () => {
            const headers = TokenProtocol.createTokenRequestHeaders(
                new Logger({}),
                true
            );

            expect(headers[HeaderNames.CONTENT_TYPE]).toBe(
                URL_FORM_CONTENT_TYPE
            );
        });
    });

    describe("sendPostRequest tests", () => {
        it("returns a response", async () => {
            const thumbprint: RequestThumbprint = THUMBPRINT;
            const options: NetworkRequestOptions = NETWORK_REQUEST_OPTIONS;
            const mockRes: NetworkResponse<ServerAuthorizationTokenResponse> = {
                headers: {},
                body: AUTHENTICATION_RESULT.body,
                status: 200,
            };
            const networkStub = jest
                .spyOn(mockNetworkClient, "sendPostRequestAsync")
                // @ts-ignore
                .mockResolvedValue(mockRes);
            const getThrottlingStub = jest
                .spyOn(
                    // @ts-ignore
                    mockCache,
                    "getThrottlingCache"
                )
                .mockImplementation();
            const setThrottlingStub = jest
                .spyOn(
                    // @ts-ignore
                    mockCache,
                    "setThrottlingCache"
                )
                .mockImplementation();
            const removeItemStub = jest
                .spyOn(
                    // @ts-ignore
                    mockCache,
                    "removeItem"
                )
                .mockImplementation();
            jest.spyOn(Date, "now").mockReturnValue(1);

            const res =
                await TokenProtocol.sendPostRequest<ServerAuthorizationTokenResponse>(
                    thumbprint,
                    "tokenEndpoint",
                    options,
                    RANDOM_TEST_GUID,
                    mockCache,
                    mockNetworkClient,
                    new Logger({}),
                    new StubPerformanceClient()
                );

            expect(networkStub).toHaveBeenCalledTimes(1);
            expect(getThrottlingStub).toHaveBeenCalledTimes(1);
            expect(setThrottlingStub).toHaveBeenCalledTimes(0);
            expect(removeItemStub).toHaveBeenCalledTimes(0);
            expect(res).toEqual(mockRes);
        });

        it("blocks the request if item is found in the cache", async () => {
            const thumbprint: RequestThumbprint = THUMBPRINT;
            const options: NetworkRequestOptions = NETWORK_REQUEST_OPTIONS;
            const mockThrottlingEntity = THROTTLING_ENTITY;
            const networkStub = jest
                .spyOn(mockNetworkClient, "sendPostRequestAsync")
                // @ts-ignore
                .mockImplementation();
            const getThrottlingStub = jest
                .spyOn(mockCache, "getThrottlingCache")
                .mockReturnValue(mockThrottlingEntity);
            const setThrottlingStub = jest
                .spyOn(mockCache, "setThrottlingCache")
                .mockImplementation();
            const removeItemStub = jest
                .spyOn(mockCache, "removeItem")
                .mockImplementation();
            jest.spyOn(Date, "now").mockReturnValue(1);

            try {
                await TokenProtocol.sendPostRequest<ServerAuthorizationTokenResponse>(
                    thumbprint,
                    "tokenEndpoint",
                    options,
                    RANDOM_TEST_GUID,
                    mockCache,
                    mockNetworkClient,
                    new Logger({}),
                    new StubPerformanceClient()
                );
            } catch {}

            expect(networkStub).toHaveBeenCalledTimes(0);
            expect(getThrottlingStub).toHaveBeenCalledTimes(1);
            expect(setThrottlingStub).toHaveBeenCalledTimes(0);
            expect(removeItemStub).toHaveBeenCalledTimes(0);
            expect(() =>
                ThrottlingUtils.preProcess(
                    mockCache,
                    thumbprint,
                    RANDOM_TEST_GUID
                )
            ).toThrowError(ServerError);
        });

        it("passes request through if expired item in cache", async () => {
            const thumbprint: RequestThumbprint = THUMBPRINT;
            const options: NetworkRequestOptions = NETWORK_REQUEST_OPTIONS;
            const mockRes: NetworkResponse<ServerAuthorizationTokenResponse> = {
                headers: {},
                body: AUTHENTICATION_RESULT.body,
                status: 200,
            };
            const mockThrottlingEntity = THROTTLING_ENTITY;
            const networkStub = jest
                .spyOn(mockNetworkClient, "sendPostRequestAsync")
                // @ts-ignore
                .mockResolvedValue(mockRes);
            const getThrottlingStub = jest
                .spyOn(mockCache, "getThrottlingCache")
                .mockReturnValue(mockThrottlingEntity);
            const setThrottlingStub = jest
                .spyOn(mockCache, "setThrottlingCache")
                .mockImplementation();
            const removeItemStub = jest
                .spyOn(mockCache, "removeItem")
                .mockImplementation();
            jest.spyOn(Date, "now").mockReturnValue(10);

            const res =
                await TokenProtocol.sendPostRequest<ServerAuthorizationTokenResponse>(
                    thumbprint,
                    "tokenEndpoint",
                    options,
                    RANDOM_TEST_GUID,
                    mockCache,
                    mockNetworkClient,
                    new Logger({}),
                    new StubPerformanceClient()
                );

            expect(networkStub).toHaveBeenCalledTimes(1);
            expect(getThrottlingStub).toHaveBeenCalledTimes(1);
            expect(setThrottlingStub).toHaveBeenCalledTimes(0);
            expect(removeItemStub).toHaveBeenCalledTimes(1);
            expect(res).toEqual(mockRes);
        });

        it("creates cache entry on error", async () => {
            const thumbprint: RequestThumbprint = THUMBPRINT;
            const options: NetworkRequestOptions = NETWORK_REQUEST_OPTIONS;
            const mockRes: NetworkResponse<ServerAuthorizationTokenResponse> = {
                headers: {},
                body: AUTHENTICATION_RESULT.body,
                status: 500,
            };
            const networkStub = jest
                .spyOn(mockNetworkClient, "sendPostRequestAsync")
                // @ts-ignore
                .mockResolvedValue(mockRes);
            const getThrottlingStub = jest
                .spyOn(mockCache, "getThrottlingCache")
                .mockImplementation();
            const setThrottlingStub = jest
                .spyOn(mockCache, "setThrottlingCache")
                .mockImplementation();
            const removeItemStub = jest
                .spyOn(mockCache, "removeItem")
                .mockImplementation();
            jest.spyOn(Date, "now").mockReturnValue(1);

            const res =
                await TokenProtocol.sendPostRequest<ServerAuthorizationTokenResponse>(
                    thumbprint,
                    "tokenEndpoint",
                    options,
                    RANDOM_TEST_GUID,
                    mockCache,
                    mockNetworkClient,
                    new Logger({}),
                    new StubPerformanceClient()
                );

            expect(networkStub).toHaveBeenCalledTimes(1);
            expect(getThrottlingStub).toHaveBeenCalledTimes(1);
            expect(setThrottlingStub).toHaveBeenCalledTimes(1);
            expect(removeItemStub).toHaveBeenCalledTimes(0);
            expect(res).toEqual(mockRes);
        });

        it("throws network error if fetch client fails", async () => {
            const thumbprint: RequestThumbprint = THUMBPRINT;
            const options: NetworkRequestOptions = NETWORK_REQUEST_OPTIONS;

            jest.spyOn(
                mockNetworkClient,
                "sendPostRequestAsync"
                // @ts-ignore
            ).mockRejectedValue(new Error("Fetch failed"));

            try {
                await TokenProtocol.sendPostRequest<ServerAuthorizationTokenResponse>(
                    thumbprint,
                    "tokenEndpoint",
                    options,
                    RANDOM_TEST_GUID,
                    mockCache,
                    mockNetworkClient,
                    new Logger({}),
                    new StubPerformanceClient()
                );
                throw new Error("Function did not throw");
            } catch (e) {
                expect(e).toBeInstanceOf(ClientAuthError);
                expect((e as ClientAuthError).errorCode).toBe(
                    ClientAuthErrorCodes.networkError
                );
            }
        });
    });
});
