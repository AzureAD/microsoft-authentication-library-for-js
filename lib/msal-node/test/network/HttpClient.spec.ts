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

const statusCodeOk: number = 200;

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
 * @returns a mocked https request method to be used once
 */
const mockHttpsRequest = (buffer: Buffer, statusCode: number) => {
    // sample https response object
    const mockHttpsResponse: {
        headers: Record<string, string>,
        statusCode: number,
        on: jest.Mock,
    } = {
        headers: headers,
        statusCode: statusCode,
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
 * @param httpRequestStatusCode mocked status code of the http request
 * @param socketRequestStatusCode mocked status code of the socket request
 * @returns a mocked http request method to be used once
 */
const mockHttpRequest = (body: Object, httpRequestStatusCode: number, socketRequestStatusCode: number) => {
    const bodyString = JSON.stringify(body);
    const mockSocketResponse = `HTTP/1.1 ${httpRequestStatusCode} OK${headersString}${bodyString}`;
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
        on: jest.fn((_requestEvent: string, cb: any) => cb({ statusCode: socketRequestStatusCode } as http.IncomingMessage, mockSocket)),
        destroy: jest.fn(),
        error: jest.fn(),
    }));
};

describe("HttpClient", () => {
    const httpClient = new HttpClient();

    describe("Successful Get Request", <T>() => {
        const networkResponse: NetworkResponse<T> = getNetworkResponse(mockGetResponseBody, statusCodeOk);

        test("Via Https", async () => {
            (https.request as jest.Mock).mockImplementationOnce(mockHttpsRequest(mockGetResponseBodyBuffer, statusCodeOk));
            await expect(httpClient.sendGetRequestAsync(url)).resolves.toEqual(networkResponse);
        });

        test("Via Proxy", async () => {
            (http.request as jest.Mock).mockImplementationOnce(mockHttpRequest(mockGetResponseBody, statusCodeOk, statusCodeOk));
            await expect(httpClient.sendGetRequestAsync(url, getNetworkRequestOptionsWithProxyUrl)).resolves.toEqual(networkResponse);
        });
    });

    describe("Successful Post Request", <T>() => {
        const networkResponse: NetworkResponse<T> = getNetworkResponse(mockPostResponseBody, statusCodeOk);

        test("Via Https", async () => {
            (https.request as jest.Mock).mockImplementationOnce(mockHttpsRequest(mockPostResponseBodyBuffer, statusCodeOk));
            await expect(httpClient.sendPostRequestAsync(url, postNetworkRequestOptionsWithoutProxyUrl)).resolves.toEqual(networkResponse);
        });

        test("Via Proxy", async () => {
            const socketRequestStatusCode: number = 200;
            (http.request as jest.Mock).mockImplementationOnce(mockHttpRequest(mockPostResponseBody, statusCodeOk, socketRequestStatusCode));
            await expect(httpClient.sendPostRequestAsync(url, postNetworkRequestOptionsWithProxyUrl)).resolves.toEqual(networkResponse);
        });
    });

    describe("Timeout Error (Post Requests Only)", () => {
        const timeoutInMilliseconds: number = 100;
        const error: Error = new Error("Request time out");

        test("Via Https", async () => {
            (https.request as jest.Mock).mockImplementationOnce(mockHttpsRequest(mockPostResponseBodyBuffer, statusCodeOk));
            await expect(httpClient.sendPostRequestAsync(url, postNetworkRequestOptionsWithoutProxyUrl, timeoutInMilliseconds)).rejects.toEqual(error);
        });

        /**
         * can only test http timeout, not socket timeout inside of the socket
         * 
         * future work: add another timeout parameter to sendPostRequestAsync so it accepts two different timeouts:
         * one for http timeout and one for the socket timeout inside of the socket
         */
        test("Via Proxy", async () => {
            (http.request as jest.Mock).mockImplementationOnce(mockHttpRequest(mockPostResponseBody, statusCodeOk, statusCodeOk));
            await expect(httpClient.sendPostRequestAsync(url, postNetworkRequestOptionsWithProxyUrl, timeoutInMilliseconds)).rejects.toEqual(error);
        });
    });


    describe("Bad Status Code Error", () => {
        const statusCodeError: number = 500;
        const error: Error = new Error("Error connecting to proxy");
        const networkResponse: NetworkResponse<MockedMetadataResponse> = getNetworkResponse<MockedMetadataResponse>(mockGetResponseBody, statusCodeError);

        describe("Get Request", () => {
            test("Via Https", async () => {
                (https.request as jest.Mock).mockImplementationOnce(mockHttpsRequest(mockGetResponseBodyBuffer, statusCodeError));
                await expect(httpClient.sendGetRequestAsync(url)).resolves.toEqual(networkResponse);
            });

            describe("Via Proxy", () => {
                test("Http Status Code", async () => {
                    (http.request as jest.Mock).mockImplementationOnce(mockHttpRequest(mockGetResponseBody, statusCodeError, statusCodeError));
                    await expect(httpClient.sendGetRequestAsync(url, getNetworkRequestOptionsWithProxyUrl)).rejects.toEqual(expect.objectContaining(error));
                });

                test("Socket Status Code", async () => {
                    (http.request as jest.Mock).mockImplementationOnce(mockHttpRequest(mockGetResponseBody, statusCodeOk, statusCodeError));
                    await expect(httpClient.sendGetRequestAsync(url, getNetworkRequestOptionsWithProxyUrl)).rejects.toEqual(expect.objectContaining(error));
                });
            });
        });

        describe("Post Request", <T>() => {
            const networkResponse: NetworkResponse<T> = getNetworkResponse(mockPostResponseBody, statusCodeError);
            const error: Error = new Error("Error in connection to proxy");
            test("Via Https", async () => {
                (https.request as jest.Mock).mockImplementationOnce(mockHttpsRequest(mockPostResponseBodyBuffer, statusCodeError));
                await expect(httpClient.sendPostRequestAsync(url, postNetworkRequestOptionsWithoutProxyUrl)).resolves.toEqual(networkResponse);
            });

            describe("Via Proxy", () => {
                test("Http Status Code", async () => {
                    (http.request as jest.Mock).mockImplementationOnce(mockHttpRequest(mockPostResponseBody, statusCodeError, statusCodeError));
                    await expect(httpClient.sendPostRequestAsync(url, postNetworkRequestOptionsWithProxyUrl)).rejects.toEqual(expect.objectContaining(error));
                });

                test("Socket Status Code", async () => {
                    (http.request as jest.Mock).mockImplementationOnce(mockHttpRequest(mockPostResponseBody, statusCodeOk, statusCodeError));
                    await expect(httpClient.sendPostRequestAsync(url, postNetworkRequestOptionsWithProxyUrl)).rejects.toEqual(expect.objectContaining(error));
                });
            });
        });
    });
});