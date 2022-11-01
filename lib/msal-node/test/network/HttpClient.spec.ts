import { HttpClient } from '../../src/network/HttpClient';
import { NetworkResponse, NetworkRequestOptions } from '../../../msal-common';
import { MockedMetadataResponse } from '../utils/TestConstants';

import http from "http";
jest.mock("http", () => ({
    // will be overridden every test
    request: jest.fn(),
}));

import https from "https";
jest.mock("https", () => ({
    // will be overridden every test
    request: jest.fn(),
}));

const url: string = "https://www.url.com";

// network request options for get and post requests - with and without the proxyUrl
const proxyUrl: string = "http://proxyUrl.com";
const getNetworkRequestOptionsWithProxyUrl: NetworkRequestOptions = {
    proxyUrl: proxyUrl,
};
const postNetworkRequestOptionsWithoutProxyUrl: NetworkRequestOptions = {
    headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
        "Content-Length": "1427",
    },
    body: "client_id=clientId123&redirect_uri=...",
};
const postNetworkRequestOptionsWithProxyUrl: NetworkRequestOptions = {
    ...getNetworkRequestOptionsWithProxyUrl,
    ...postNetworkRequestOptionsWithoutProxyUrl,
};

// sample https get/post request headers
const headers: {
    "content-type": string,
    connection: string,
    "content-length": string,
} = {
    "content-type": "application/json; charset=utf-8",
    connection: "close",
    "content-length": "946",
};
// for proxy requests - used by the socket
const headersString: string = JSON.stringify(headers).replace("{", "\r\n").replace("}", "\r\n\r\n")
    .replace(new RegExp(/,/g), "\r\n").replace(new RegExp(/\"/g), "").replace(new RegExp(/:/g), ": ");

// sample https get request body properties
const mockGetResponseBody: {
    tenant_discovery_endpoint: string,
    token_endpoint: string,
    authorization_endpoint: string,
    device_authorization_endpoint: string,
} = {
    tenant_discovery_endpoint: "https://tenantDiscoveryEndpoint",
    token_endpoint: "https://tokenEndpoint",
    authorization_endpoint: "https://authorizationEndpoint",
    device_authorization_endpoint: "https://deviceAuthorizationEndpoint",
};
const mockGetResponseBodyBuffer: Buffer = Buffer.from(JSON.stringify(mockGetResponseBody));

// sample https post request body properties
const mockPostResponseBody: {
    access_token: string,
    refresh_token: string,
    id_token: string,
    client_info: string,
} = {
    access_token: "accessToken",
    refresh_token: "refreshToken",
    id_token: "idToken",
    client_info: "clientInfo",
};
const mockPostResponseBodyBuffer: Buffer = Buffer.from(JSON.stringify(mockPostResponseBody));

const mockServer500ErrorResponseBody = "Server Error 500";
const mockServer500ErrorResponseBodyBuffer: Buffer = Buffer.from(mockServer500ErrorResponseBody);

const mockServerErrorResponse: {
    error: string,
    error_description: string,
} = {
    error: "server_error",
    error_description: `A server error occured.\nHttp status code: 500\nHttp status message: Internal Server Error\nHeaders: {\"content-type\":\"application/json; charset=utf-8\",\"connection\":\"close\",\"content-length\":\"946\"}`,
};

const httpsStatusCodeOk = 200;
const httpsStatusCodeFailure = 500;
const httpsStatusMessage200 = "OK";
const httpsStatusMessage500 = "Internal Server Error";
const proxyStatusCodeOk = 200;
const proxyStatusCodeFailure = 500;
const socketStatusCodeOk = 200;
const socketStatusCodeFailure = 500;

const getNetworkResponse = <T>(body: Object, statusCode: number): NetworkResponse<T> => {
    return {
        headers: headers as Record<string, string>,
        body: JSON.parse(JSON.stringify(body)) as T,
        status: statusCode,
    };
}

/**
 * Mocks the https request method
 * @param buffer mocked buffer containing the body of the network response
 * @param statusCode mocked status code of the https request
 * @param statusMessage mocked status message of the https request
 * @returns a mocked https request method to be used once
 */
const mockHttpsRequest = (buffer: Buffer, statusCode: number, statusMessage: string) => {
    // sample https response object
    const mockHttpsResponse: {
        headers: Record<string, string>,
        statusCode: number,
        statusMessage: string,
        on: jest.Mock,
    } = {
        headers: headers,
        statusCode: statusCode,
        statusMessage: statusMessage,
        on: jest.fn((_responseEvent: string, cb: any) => cb(buffer)),
    };

    return jest.fn(() => ({
        write: jest.fn(),
        end: jest.fn(),
        on: jest.fn((_requestEvent: string, cb: any) => cb(mockHttpsResponse)),
        destroy: jest.fn(),
        error: jest.fn(),
    }));
};

/**
 * Mocks the http request method
 * @param body mocked body of the network response
 * @param proxyConnectionStatusCode mocked status code of the connection to the proxy
 * @param socketRequestStatusCode mocked status code of the socket (http) request
 * @returns a mocked http request method to be used once
 */
const mockHttpRequest = (body: Object, proxyConnectionStatusCode: number, socketRequestStatusCode: number) => {
    const bodyString = socketRequestStatusCode !== socketStatusCodeOk ? body : JSON.stringify(body);
    const statusMessage = socketRequestStatusCode === socketStatusCodeOk ? "OK" : "Internal Server Error";
    const mockSocketResponse = `HTTP/1.1 ${socketRequestStatusCode} ${statusMessage}${headersString}${bodyString}`;
    const mockSocketResponseBuffer: Buffer = Buffer.from(mockSocketResponse);

    // sample socket object
    const mockSocket: {
        setTimeout: jest.Mock,
        on: jest.Mock,
        destroy: jest.Mock,
        write: jest.Mock,
        error: jest.Mock,
    } = {
        setTimeout: jest.fn(),
        on: jest.fn((_socketEvent: string, cb: any) => cb(mockSocketResponseBuffer)),
        destroy: jest.fn(),
        write: jest.fn(),
        error: jest.fn(),
    };

    return jest.fn(() => ({
        end: jest.fn(),
        on: jest.fn((_requestEvent: string, cb: any) => cb({ statusCode: proxyConnectionStatusCode } as http.IncomingMessage, mockSocket)),
        destroy: jest.fn(),
        error: jest.fn(),
    }));
};

describe("HttpClient", () => {
    const httpClient = new HttpClient();

    describe("Successful Get Request", <T>() => {
        test("Via Https", async () => {
            const httpsNetworkResponse: NetworkResponse<T> = getNetworkResponse(mockGetResponseBody, httpsStatusCodeOk);
            (https.request as jest.Mock).mockImplementationOnce(mockHttpsRequest(mockGetResponseBodyBuffer, httpsStatusCodeOk, httpsStatusMessage200));
            await expect(httpClient.sendGetRequestAsync(url)).resolves.toEqual(httpsNetworkResponse);
        });

        test("Via Proxy", async () => {
            const proxyThenSocketNetworkResponse: NetworkResponse<T> = getNetworkResponse(mockGetResponseBody, httpsStatusCodeOk);
            (http.request as jest.Mock).mockImplementationOnce(mockHttpRequest(mockGetResponseBody, proxyStatusCodeOk, socketStatusCodeOk));
            await expect(httpClient.sendGetRequestAsync(url, getNetworkRequestOptionsWithProxyUrl)).resolves.toEqual(proxyThenSocketNetworkResponse);
        });
    });

    describe("Successful Post Request", <T>() => {
        test("Via Https", async () => {
            const httpsNetworkResponse: NetworkResponse<T> = getNetworkResponse(mockPostResponseBody, httpsStatusCodeOk);
            (https.request as jest.Mock).mockImplementationOnce(mockHttpsRequest(mockPostResponseBodyBuffer, httpsStatusCodeOk, httpsStatusMessage200));
            await expect(httpClient.sendPostRequestAsync(url, postNetworkRequestOptionsWithoutProxyUrl)).resolves.toEqual(httpsNetworkResponse);
        });

        test("Via Proxy", async () => {
            const proxyThenSocketNetworkResponse: NetworkResponse<T> = getNetworkResponse(mockPostResponseBody, httpsStatusCodeOk);
            (http.request as jest.Mock).mockImplementationOnce(mockHttpRequest(mockPostResponseBody, proxyStatusCodeOk, socketStatusCodeOk));
            await expect(httpClient.sendPostRequestAsync(url, postNetworkRequestOptionsWithProxyUrl)).resolves.toEqual(proxyThenSocketNetworkResponse);
        });
    });

    describe("Timeout Error (Post Requests Only)", () => {
        const timeoutInMilliseconds: number = 100;
        const error: Error = new Error("Request time out");

        test("Via Https", async () => {
            (https.request as jest.Mock).mockImplementationOnce(mockHttpsRequest(mockPostResponseBodyBuffer, httpsStatusCodeOk, httpsStatusMessage200));
            await expect(httpClient.sendPostRequestAsync(url, postNetworkRequestOptionsWithoutProxyUrl, timeoutInMilliseconds)).rejects.toEqual(error);
        });

        /**
         * can only test http timeout, not socket timeout inside of the socket
         * 
         * future work: add another timeout parameter to sendPostRequestAsync so it accepts two different timeouts:
         * one for http timeout and one for the socket timeout inside of the socket
         */
        test("Via Proxy", async () => {
            (http.request as jest.Mock).mockImplementationOnce(mockHttpRequest(mockPostResponseBody, proxyStatusCodeOk, socketStatusCodeOk));
            await expect(httpClient.sendPostRequestAsync(url, postNetworkRequestOptionsWithProxyUrl, timeoutInMilliseconds)).rejects.toEqual(error);
        });
    });

    describe("Bad Status Code Error", () => {
        const proxyError: Error = new Error("Error connecting to proxy. Status Code: 500. Status Message: Unknown");

        describe("Get Request", () => {
            test("Via Https - Server Error 500", async () => {
                const serverErrorNetworkResponse: NetworkResponse<MockedMetadataResponse> = getNetworkResponse<MockedMetadataResponse>(mockServerErrorResponse, httpsStatusCodeFailure);
                (https.request as jest.Mock).mockImplementationOnce(mockHttpsRequest(mockServer500ErrorResponseBodyBuffer, httpsStatusCodeFailure, httpsStatusMessage500));
                await expect(httpClient.sendGetRequestAsync(url)).resolves.toEqual(serverErrorNetworkResponse);
            });

            describe("Via Proxy", () => {
                test("Proxy Connection Status Code - Proxy Connection Error 500", async () => {
                    (http.request as jest.Mock).mockImplementationOnce(mockHttpRequest(mockGetResponseBody, proxyStatusCodeFailure, httpsStatusCodeFailure));
                    await expect(httpClient.sendGetRequestAsync(url, getNetworkRequestOptionsWithProxyUrl)).rejects.toEqual(proxyError);
                });

                test("Socket (Http) Status Code - Server Error 500", async () => {
                    const serverErrorNetworkResponse: NetworkResponse<MockedMetadataResponse> = getNetworkResponse<MockedMetadataResponse>(mockServerErrorResponse, socketStatusCodeFailure);
                    (http.request as jest.Mock).mockImplementationOnce(mockHttpRequest(mockServer500ErrorResponseBody, proxyStatusCodeOk, socketStatusCodeFailure));
                    await expect(httpClient.sendGetRequestAsync(url, getNetworkRequestOptionsWithProxyUrl)).resolves.toEqual(serverErrorNetworkResponse);
                });
            });
        });

        describe("Post Request", () => {
            test("Via Https - Server Error 500", async () => {
                const serverErrorNetworkResponse: NetworkResponse<MockedMetadataResponse> = getNetworkResponse<MockedMetadataResponse>(mockServerErrorResponse, httpsStatusCodeFailure);
                (https.request as jest.Mock).mockImplementationOnce(mockHttpsRequest(mockServer500ErrorResponseBodyBuffer, httpsStatusCodeFailure, httpsStatusMessage500));
                await expect(httpClient.sendPostRequestAsync(url, postNetworkRequestOptionsWithoutProxyUrl)).resolves.toEqual(serverErrorNetworkResponse);
            });

            describe("Via Proxy", () => {
                test("Proxy Connection Status Code - Proxy Connection Error 500", async () => {
                    (http.request as jest.Mock).mockImplementationOnce(mockHttpRequest(mockPostResponseBody, proxyStatusCodeFailure, httpsStatusCodeFailure));
                    await expect(httpClient.sendPostRequestAsync(url, postNetworkRequestOptionsWithProxyUrl)).rejects.toEqual(proxyError);
                });

                test("Socket (Http) Status Code - Server Error 500", async () => {
                    const serverErrorNetworkResponse: NetworkResponse<MockedMetadataResponse> = getNetworkResponse<MockedMetadataResponse>(mockServerErrorResponse, socketStatusCodeFailure);
                    (http.request as jest.Mock).mockImplementationOnce(mockHttpRequest(mockServer500ErrorResponseBody, proxyStatusCodeOk, socketStatusCodeFailure));
                    await expect(httpClient.sendPostRequestAsync(url, postNetworkRequestOptionsWithProxyUrl)).resolves.toEqual(serverErrorNetworkResponse);
                });
            });
        });
    });
});