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
import * as ResponseHeaders from "../../src/network/ResponseHeaders.js";
import { ServerAuthorizationTokenResponse } from "../../src/response/ServerAuthorizationTokenResponse.js";
import {
    INetworkModule,
    NetworkRequestOptions,
} from "../../src/network/INetworkModule.js";
import { ServerError } from "../../src/error/ServerError.js";
import {
    ClientAuthError,
    ClientAuthErrorCodes,
    createClientAuthError,
} from "../../src/error/ClientAuthError.js";
import { createNetworkError } from "../../src/error/NetworkError.js";
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
        it.each([
            ["X-MS-REQUEST-ID", "X-MS-HTTPVER", "RETRY-AFTER"],
            ["x-ms-request-id", "x-ms-httpver", "retry-after"],
            ["X-Ms-Request-Id", "X-Ms-HttpVer", "Retry-After"],
            ["x-Ms-ReQuEsT-iD", "x-Ms-HtTpVeR", "rEtRy-AfTeR"],
        ])(
            "normalizes %s, %s and %s once for telemetry and throttling without mutating the response",
            async (requestIdHeader, httpVersionHeader, retryAfterHeader) => {
                jest.spyOn(Date, "now").mockReturnValue(5_000);
                const normalize = jest.spyOn(
                    ResponseHeaders,
                    "normalizeResponseHeaders"
                );
                const headers = Object.freeze({
                    [requestIdHeader]: "test-request-id",
                    [httpVersionHeader]: "2",
                    [retryAfterHeader]: "120",
                });
                const response = Object.freeze({
                    headers,
                    body: AUTHENTICATION_RESULT.body,
                    status: 400,
                });
                const networkClient: INetworkModule = {
                    sendGetRequestAsync: jest.fn(),
                    sendPostRequestAsync: jest.fn().mockResolvedValue(response),
                };
                const performanceClient = new StubPerformanceClient();
                const addFields = jest.spyOn(performanceClient, "addFields");

                const result = await TokenProtocol.sendPostRequest(
                    THUMBPRINT,
                    "tokenEndpoint",
                    NETWORK_REQUEST_OPTIONS,
                    RANDOM_TEST_GUID,
                    mockCache,
                    networkClient,
                    new Logger({}),
                    performanceClient
                );

                expect(result.headers).toEqual({
                    "x-ms-request-id": "test-request-id",
                    "x-ms-httpver": "2",
                    "retry-after": "120",
                });
                expect(normalize).toHaveBeenCalledTimes(1);
                expect(normalize).toHaveBeenCalledWith(headers);
                expect(
                    mockCache.getThrottlingCache(
                        ThrottlingUtils.generateThrottlingStorageKey(
                            THUMBPRINT
                        ),
                        RANDOM_TEST_GUID
                    )
                ).toMatchObject({ throttleTime: 125_000 });
                expect(response.headers).toBe(headers);
                expect(response.headers[requestIdHeader]).toBe(
                    "test-request-id"
                );
                expect(addFields).toHaveBeenCalledWith(
                    expect.objectContaining({
                        requestId: "test-request-id",
                        httpVerToken: "2",
                    }),
                    RANDOM_TEST_GUID
                );
            }
        );

        it.each(
            [
                ["Content-Type", "Content-Length"],
                ["content-type", "content-length"],
                ["CONTENT-TYPE", "CONTENT-LENGTH"],
                ["cOnTeNt-TyPe", "cOnTeNt-LeNgTh"],
            ].flatMap(([contentTypeHeader, contentLengthHeader]) =>
                [
                    {
                        contentType: "text/html",
                        contentLength: "123",
                        expectedType: "text/html",
                        expectedLength: "123",
                    },
                    {
                        contentType: "",
                        contentLength: "",
                        expectedType: undefined,
                        expectedLength: undefined,
                    },
                    {
                        contentType: undefined,
                        contentLength: undefined,
                        expectedType: undefined,
                        expectedLength: undefined,
                    },
                    {
                        contentType: "",
                        contentLength: "123",
                        expectedType: undefined,
                        expectedLength: "123",
                    },
                    {
                        contentType: "text/html",
                        contentLength: undefined,
                        expectedType: "text/html",
                        expectedLength: undefined,
                    },
                ].map((values) => ({
                    contentTypeHeader,
                    contentLengthHeader,
                    ...values,
                }))
            )
        )(
            "captures $contentTypeHeader='$contentType' and $contentLengthHeader='$contentLength' in network-error telemetry",
            async ({
                contentTypeHeader,
                contentLengthHeader,
                contentType,
                contentLength,
                expectedType,
                expectedLength,
            }) => {
                const normalize = jest.spyOn(
                    ResponseHeaders,
                    "normalizeResponseHeaders"
                );
                const headers = Object.freeze({
                    ...(contentType === undefined
                        ? {}
                        : { [contentTypeHeader]: contentType }),
                    ...(contentLength === undefined
                        ? {}
                        : { [contentLengthHeader]: contentLength }),
                    "X-MS-REQUEST-ID": "test-request-id",
                    "X-MS-HTTPVER": "2",
                });
                const error = createNetworkError(
                    createClientAuthError(
                        ClientAuthErrorCodes.networkError,
                        RANDOM_TEST_GUID
                    ),
                    400,
                    headers
                );
                const networkClient: INetworkModule = {
                    sendGetRequestAsync: jest.fn(),
                    sendPostRequestAsync: jest.fn().mockRejectedValue(error),
                };
                const performanceClient = new StubPerformanceClient();
                const addFields = jest.spyOn(performanceClient, "addFields");

                await expect(
                    TokenProtocol.sendPostRequest(
                        THUMBPRINT,
                        "tokenEndpoint",
                        NETWORK_REQUEST_OPTIONS,
                        RANDOM_TEST_GUID,
                        mockCache,
                        networkClient,
                        new Logger({}),
                        performanceClient
                    )
                ).rejects.toBe(error.error);
                expect(normalize).toHaveBeenCalledTimes(1);
                expect(normalize).toHaveBeenCalledWith(headers);
                expect(error.responseHeaders).toBe(headers);
                expect(headers[contentTypeHeader]).toBe(contentType);
                expect(headers[contentLengthHeader]).toBe(contentLength);
                expect(addFields).toHaveBeenCalledWith(
                    expect.objectContaining({
                        contentTypeHeader: expectedType,
                        contentLengthHeader: expectedLength,
                        requestId: "test-request-id",
                        httpVerToken: "2",
                        httpStatus: 400,
                    }),
                    RANDOM_TEST_GUID
                );
            }
        );

        it("preserves network errors without response headers and skips header telemetry", async () => {
            const normalize = jest.spyOn(
                ResponseHeaders,
                "normalizeResponseHeaders"
            );
            const error = createNetworkError(
                createClientAuthError(
                    ClientAuthErrorCodes.networkError,
                    RANDOM_TEST_GUID
                )
            );
            const networkClient: INetworkModule = {
                sendGetRequestAsync: jest.fn(),
                sendPostRequestAsync: jest.fn().mockRejectedValue(error),
            };
            const performanceClient = new StubPerformanceClient();
            const addFields = jest.spyOn(performanceClient, "addFields");
            const setThrottle = jest.spyOn(mockCache, "setThrottlingCache");

            await expect(
                TokenProtocol.sendPostRequest(
                    THUMBPRINT,
                    "tokenEndpoint",
                    NETWORK_REQUEST_OPTIONS,
                    RANDOM_TEST_GUID,
                    mockCache,
                    networkClient,
                    new Logger({}),
                    performanceClient
                )
            ).rejects.toBe(error.error);
            expect(normalize).not.toHaveBeenCalled();
            expect(addFields).not.toHaveBeenCalled();
            expect(setThrottle).not.toHaveBeenCalled();
        });

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
