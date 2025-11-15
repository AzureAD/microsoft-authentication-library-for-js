/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { HttpClient } from "../../src/network/HttpClient.js";
import {
    AuthError,
    ClientAuthErrorCodes,
    NetworkError,
    NetworkRequestOptions,
    NetworkResponse,
} from "@azure/msal-common";

// Mock fetch globally
global.fetch = jest.fn();

const url: string = "https://www.url.com";

const postNetworkRequestOptions: NetworkRequestOptions = {
    headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
        "Content-Length": "1427",
    },
    body: "client_id=clientId123&redirect_uri=...",
};

const headers = {
    "content-type": "application/json; charset=utf-8",
    connection: "close",
    "content-length": "946",
};

const mockGetResponseBody = {
    tenant_discovery_endpoint: "https://tenantDiscoveryEndpoint",
    token_endpoint: "https://tokenEndpoint",
    authorization_endpoint: "https://authorizationEndpoint",
    device_authorization_endpoint: "https://deviceAuthorizationEndpoint",
};

const mockPostResponseBody = {
    access_token: "accessToken",
    refresh_token: "refreshToken",
    id_token: "idToken",
    client_info: "clientInfo",
};

const createMockResponse = <T>(
    body: T,
    status: number,
    statusText: string = "OK"
): Response => {
    const mockHeaders = new Headers();
    Object.entries(headers).forEach(([key, value]) => {
        mockHeaders.append(key, value);
    });

    return {
        status,
        statusText,
        headers: mockHeaders,
        json: jest.fn().mockResolvedValue(body),
        text: jest.fn().mockResolvedValue(JSON.stringify(body)),
        ok: status >= 200 && status < 300,
    } as unknown as Response;
};

const createExpectedResponse = <T>(
    body: T,
    status: number
): NetworkResponse<T> => {
    return {
        headers: headers as Record<string, string>,
        body: body,
        status,
    };
};

describe("HttpClient", () => {
    let httpClient: HttpClient;
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

    beforeEach(() => {
        httpClient = new HttpClient();
        mockFetch.mockClear();
    });

    describe("sendGetRequestAsync", () => {
        test("successful GET request", async () => {
            const expectedResponse = createExpectedResponse(
                mockGetResponseBody,
                200
            );
            mockFetch.mockResolvedValueOnce(
                createMockResponse(mockGetResponseBody, 200)
            );

            const result = await httpClient.sendGetRequestAsync(url);

            expect(mockFetch).toHaveBeenCalledWith(url, {
                method: "GET",
                headers: new Headers(),
                signal: expect.any(AbortSignal),
            });
            expect(result).toEqual(expectedResponse);
        });

        test("GET request with headers", async () => {
            const options: NetworkRequestOptions = {
                headers: { Authorization: "Bearer token" },
            };
            const expectedResponse = createExpectedResponse(
                mockGetResponseBody,
                200
            );
            mockFetch.mockResolvedValueOnce(
                createMockResponse(mockGetResponseBody, 200)
            );

            const result = await httpClient.sendGetRequestAsync(url, options);

            expect(mockFetch).toHaveBeenCalledWith(url, {
                method: "GET",
                headers: expect.any(Headers),
                signal: expect.any(AbortSignal),
            });
            expect(result).toEqual(expectedResponse);
        });

        test("GET request with timeout", async () => {
            const expectedResponse = createExpectedResponse(
                mockGetResponseBody,
                200
            );
            mockFetch.mockResolvedValueOnce(
                createMockResponse(mockGetResponseBody, 200)
            );

            const result = await httpClient.sendGetRequestAsync(
                url,
                undefined,
                5000
            );

            expect(mockFetch).toHaveBeenCalledWith(url, {
                method: "GET",
                headers: new Headers(),
                signal: expect.any(AbortSignal),
            });
            expect(result).toEqual(expectedResponse);
        });

        test("GET request timeout error", async () => {
            mockFetch.mockRejectedValueOnce(
                Object.assign(new Error("The operation was aborted"), {
                    name: "AbortError",
                })
            );

            try {
                await httpClient.sendGetRequestAsync(url, undefined, 100);
                fail("Expected timeout error to be thrown");
            } catch (error) {
                expect(error).toBeInstanceOf(AuthError);
                expect((error as AuthError).errorCode).toBe(
                    ClientAuthErrorCodes.networkError
                );
                expect((error as AuthError).errorMessage).toBe(
                    "Request timeout"
                );
            }
        });

        test("GET request network error", async () => {
            mockFetch.mockRejectedValueOnce(new Error("Network failure"));

            try {
                await httpClient.sendGetRequestAsync(url);
                fail("Expected network error to be thrown");
            } catch (error) {
                expect(error).toBeInstanceOf(NetworkError);
                expect((error as NetworkError).error).toBeInstanceOf(AuthError);
                expect((error as NetworkError).error.errorCode).toBe(
                    ClientAuthErrorCodes.networkError
                );
                expect((error as NetworkError).error.errorMessage).toBe(
                    "Network request failed: Network failure, additionalErrorInfo: error.name:Error, error.message:Network failure"
                );
            }
        });

        test("GET request with 400 client error", async () => {
            const errorBody = {
                error: "client_error",
                error_description:
                    'A client error occurred.\nHttp status code: 400\nHttp status message: Bad Request\nHeaders: {"content-type":"application/json; charset=utf-8","connection":"close","content-length":"946"}',
            };
            const expectedResponse = createExpectedResponse(errorBody, 400);
            mockFetch.mockResolvedValueOnce(
                createMockResponse(errorBody, 400, "Bad Request")
            );

            const result = await httpClient.sendGetRequestAsync(url);

            expect(result).toEqual(expectedResponse);
        });

        test("GET request with 500 server error", async () => {
            const errorBody = {
                error: "server_error",
                error_description:
                    'A server error occurred.\nHttp status code: 500\nHttp status message: Internal Server Error\nHeaders: {"content-type":"application/json; charset=utf-8","connection":"close","content-length":"946"}',
            };
            const expectedResponse = createExpectedResponse(errorBody, 500);
            mockFetch.mockResolvedValueOnce(
                createMockResponse(errorBody, 500, "Internal Server Error")
            );

            const result = await httpClient.sendGetRequestAsync(url);

            expect(result).toEqual(expectedResponse);
        });

        test("GET request JSON parsing error", async () => {
            const mockResponse = {
                status: 200,
                statusText: "OK",
                headers: new Headers(),
                json: jest.fn().mockRejectedValue(new Error("Invalid JSON")),
                text: jest.fn().mockResolvedValue("invalid json"),
            } as unknown as Response;

            mockFetch.mockResolvedValueOnce(mockResponse);

            try {
                await httpClient.sendGetRequestAsync(url);
                fail("Expected JSON parsing error to be thrown");
            } catch (error) {
                expect(error).toBeInstanceOf(AuthError);
                expect((error as AuthError).errorCode).toBe(
                    ClientAuthErrorCodes.tokenParsingError
                );
                expect((error as AuthError).errorMessage).toBe(
                    "Failed to parse response: Invalid JSON"
                );
            }
        });
    });

    describe("sendPostRequestAsync", () => {
        test("successful POST request", async () => {
            const expectedResponse = createExpectedResponse(
                mockPostResponseBody,
                200
            );
            mockFetch.mockResolvedValueOnce(
                createMockResponse(mockPostResponseBody, 200)
            );

            const result = await httpClient.sendPostRequestAsync(
                url,
                postNetworkRequestOptions
            );

            expect(mockFetch).toHaveBeenCalledWith(url, {
                method: "POST",
                headers: expect.any(Headers),
                body: postNetworkRequestOptions.body,
                signal: expect.any(AbortSignal),
            });
            expect(result).toEqual(expectedResponse);
        });

        test("POST request without body", async () => {
            const options: NetworkRequestOptions = {
                headers: { "Content-Type": "application/json" },
            };
            const expectedResponse = createExpectedResponse(
                mockPostResponseBody,
                200
            );
            mockFetch.mockResolvedValueOnce(
                createMockResponse(mockPostResponseBody, 200)
            );

            const result = await httpClient.sendPostRequestAsync(url, options);

            expect(mockFetch).toHaveBeenCalledWith(url, {
                method: "POST",
                headers: expect.any(Headers),
                body: "",
                signal: expect.any(AbortSignal),
            });
            expect(result).toEqual(expectedResponse);
        });

        test("POST request network error", async () => {
            mockFetch.mockRejectedValueOnce(new Error("Network failure"));

            try {
                await httpClient.sendPostRequestAsync(
                    url,
                    postNetworkRequestOptions
                );
                fail("Expected network error to be thrown");
            } catch (error) {
                expect(error).toBeInstanceOf(NetworkError);
                expect((error as NetworkError).error).toBeInstanceOf(AuthError);
                expect((error as NetworkError).error.errorCode).toBe(
                    ClientAuthErrorCodes.networkError
                );
                expect((error as NetworkError).error.errorMessage).toBe(
                    "Network request failed: Network failure, additionalErrorInfo: error.name:Error, error.message:Network failure"
                );
            }
        });

        test("POST request JSON parsing error", async () => {
            const mockResponse = {
                status: 200,
                statusText: "OK",
                headers: new Headers(),
                json: jest.fn().mockRejectedValue(new Error("Invalid JSON")),
                text: jest.fn().mockResolvedValue("invalid json"),
            } as unknown as Response;

            mockFetch.mockResolvedValueOnce(mockResponse);

            try {
                await httpClient.sendPostRequestAsync(
                    url,
                    postNetworkRequestOptions
                );
                fail("Expected JSON parsing error to be thrown");
            } catch (error) {
                expect(error).toBeInstanceOf(AuthError);
                expect((error as AuthError).errorCode).toBe(
                    ClientAuthErrorCodes.tokenParsingError
                );
                expect((error as AuthError).errorMessage).toBe(
                    "Failed to parse response: Invalid JSON"
                );
            }
        });

        test("POST request with 400 client error", async () => {
            const errorBody = {
                error: "client_error",
                error_description:
                    'A client error occurred.\nHttp status code: 400\nHttp status message: Bad Request\nHeaders: {"content-type":"application/json; charset=utf-8","connection":"close","content-length":"946"}',
            };
            const expectedResponse = createExpectedResponse(errorBody, 400);
            mockFetch.mockResolvedValueOnce(
                createMockResponse(errorBody, 400, "Bad Request")
            );

            const result = await httpClient.sendPostRequestAsync(
                url,
                postNetworkRequestOptions
            );

            expect(result).toEqual(expectedResponse);
        });
    });

    describe("utility functions", () => {
        test("getFetchHeaders handles empty options", () => {
            // This tests the utility function indirectly through the main methods
            mockFetch.mockResolvedValueOnce(
                createMockResponse(mockGetResponseBody, 200)
            );

            httpClient.sendGetRequestAsync(url);

            expect(mockFetch).toHaveBeenCalledWith(
                url,
                expect.objectContaining({
                    headers: expect.any(Headers),
                })
            );
        });

        test("getFetchHeaders converts options headers", () => {
            const options: NetworkRequestOptions = {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer token",
                },
            };

            mockFetch.mockResolvedValueOnce(
                createMockResponse(mockGetResponseBody, 200)
            );

            httpClient.sendGetRequestAsync(url, options);

            expect(mockFetch).toHaveBeenCalledWith(
                url,
                expect.objectContaining({
                    headers: expect.any(Headers),
                })
            );
        });
    });
});
