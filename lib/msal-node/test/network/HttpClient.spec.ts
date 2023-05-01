import { HttpClient } from "../../src/network/HttpClient";
import {
    NetworkResponse,
    NetworkRequestOptions,
    UrlToHttpRequestOptions,
} from "@azure/msal-common";
import { MockedMetadataResponse } from "../utils/TestConstants";

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

const httpsStatusCode200 = 200;
const httpsStatusCode400 = 400;
const httpsStatusCode500 = 500;
const httpsStatusCode600 = 600;
const httpsStatusMessage200 = "OK";
const httpsStatusMessage400 = "Bad Request";
const httpsStatusMessage500 = "Internal Server Error";
const httpsStatusMessage600 = "Unknown Error";
const proxyStatusCode200 = 200;
const proxyStatusCode500 = 500;
const socketStatusCode200 = 200;
const socketStatusCode400 = 400;
const socketStatusCode500 = 500;
const socketStatusCode600 = 600;

const url: string = "https://www.url.com";

// network request options for post requests
const postNetworkRequestOptions: NetworkRequestOptions = {
    headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
        "Content-Length": "1427",
    },
    body: "client_id=clientId123&redirect_uri=...",
};

// sample https get/post request headers
const headers: {
    "content-type": string;
    connection: string;
    "content-length": string;
} = {
    "content-type": "application/json; charset=utf-8",
    connection: "close",
    "content-length": "946",
};
// for proxy requests - used by the socket
const headersString: string = JSON.stringify(headers)
    .replace("{", "\r\n")
    .replace("}", "\r\n\r\n")
    .replace(new RegExp(/,/g), "\r\n")
    .replace(new RegExp(/\"/g), "")
    .replace(new RegExp(/:/g), ": ");

// sample https get request body properties
const mockGetResponseBody: {
    tenant_discovery_endpoint: string;
    token_endpoint: string;
    authorization_endpoint: string;
    device_authorization_endpoint: string;
} = {
    tenant_discovery_endpoint: "https://tenantDiscoveryEndpoint",
    token_endpoint: "https://tokenEndpoint",
    authorization_endpoint: "https://authorizationEndpoint",
    device_authorization_endpoint: "https://deviceAuthorizationEndpoint",
};
const mockGetResponseBodyBuffer: Buffer = Buffer.from(
    JSON.stringify(mockGetResponseBody)
);

// sample https post request body properties
const mockPostResponseBody: {
    access_token: string;
    refresh_token: string;
    id_token: string;
    client_info: string;
} = {
    access_token: "accessToken",
    refresh_token: "refreshToken",
    id_token: "idToken",
    client_info: "clientInfo",
};
const mockPostResponseBodyBuffer: Buffer = Buffer.from(
    JSON.stringify(mockPostResponseBody)
);

const mockServer400ErrorResponseBody = httpsStatusMessage400;
const mockServer400ErrorResponseBodyBuffer: Buffer = Buffer.from(
    mockServer400ErrorResponseBody
);
const mockServer500ErrorResponseBody = httpsStatusMessage500;
const mockServer500ErrorResponseBodyBuffer: Buffer = Buffer.from(
    mockServer500ErrorResponseBody
);
const mockServer600ErrorResponseBody = httpsStatusMessage600;
const mockServer600ErrorResponseBodyBuffer: Buffer = Buffer.from(
    mockServer600ErrorResponseBody
);

const getMockServerErrorResponse = (
    statusCode: number
): {
    error: string;
    error_description: string;
} => {
    let errorType;
    let errorDescriptionHelper;
    let statusMessage;
    if (statusCode >= 400 && statusCode <= 499) {
        errorType = "client_error";
        errorDescriptionHelper = "A client";
        statusMessage = httpsStatusMessage400;
    } else if (statusCode >= 500 && statusCode <= 599) {
        errorType = "server_error";
        errorDescriptionHelper = "A server";
        statusMessage = httpsStatusMessage500;
    } else {
        errorType = "unknown_error";
        errorDescriptionHelper = "An unknown";
        statusMessage = httpsStatusMessage600;
    }

    return {
        error: errorType,
        error_description: `${errorDescriptionHelper} error occured.\nHttp status code: ${statusCode}\nHttp status message: ${statusMessage}\nHeaders: {\"content-type\":\"application/json; charset=utf-8\",\"connection\":\"close\",\"content-length\":\"946\"}`,
    };
};

const getNetworkResponse = <T>(
    body: Object,
    statusCode: number
): NetworkResponse<T> => {
    return {
        headers: headers as Record<string, string>,
        body: JSON.parse(JSON.stringify(body)) as T,
        status: statusCode,
    };
};

const urlToHttpOptions = (url: URL): UrlToHttpRequestOptions => {
    const options: UrlToHttpRequestOptions = {
        protocol: url.protocol,
        hostname:
            url.hostname && url.hostname.startsWith("[")
                ? url.hostname.slice(1, -1)
                : url.hostname,
        hash: url.hash,
        search: url.search,
        pathname: url.pathname,
        path: `${url.pathname || ""}${url.search || ""}`,
        href: url.href,
    };
    if (url.port !== "") {
        options.port = Number(url.port);
    }
    if (url.username || url.password) {
        options.auth = `${decodeURIComponent(
            url.username
        )}:${decodeURIComponent(url.password)}`;
    }
    return options;
};

/**
 * Mocks the https request method
 * @param buffer mocked buffer containing the body of the network response
 * @param statusCode mocked status code of the https request
 * @param statusMessage mocked status message of the https request
 * @returns a mocked https request method to be used once
 */
const mockHttpsRequest = (
    buffer: Buffer,
    statusCode: number,
    statusMessage: string
) => {
    // sample https response object
    const mockHttpsResponse: {
        headers: Record<string, string>;
        statusCode: number;
        statusMessage: string;
        on: jest.Mock;
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
const mockHttpRequest = (
    body: Object,
    proxyConnectionStatusCode: number,
    socketRequestStatusCode: number
) => {
    const bodyString =
        socketRequestStatusCode !== socketStatusCode200
            ? body
            : JSON.stringify(body);

    let statusMessage;
    if (socketRequestStatusCode === socketStatusCode200) {
        statusMessage = httpsStatusMessage200;
    } else if (socketRequestStatusCode === socketStatusCode400) {
        statusMessage = httpsStatusMessage400;
    } else if (socketRequestStatusCode === socketStatusCode500) {
        statusMessage = httpsStatusMessage500;
    } else {
        statusMessage = httpsStatusMessage600;
    }

    const mockSocketResponse = `HTTP/1.1 ${socketRequestStatusCode} ${statusMessage}${headersString}${bodyString}`;
    const mockSocketResponseBuffer: Buffer = Buffer.from(mockSocketResponse);

    // sample socket object
    const mockSocket: {
        setTimeout: jest.Mock;
        on: jest.Mock;
        destroy: jest.Mock;
        write: jest.Mock;
        error: jest.Mock;
    } = {
        setTimeout: jest.fn(),
        on: jest.fn((_socketEvent: string, cb: any) =>
            cb(mockSocketResponseBuffer)
        ),
        destroy: jest.fn(),
        write: jest.fn(),
        error: jest.fn(),
    };

    return jest.fn(() => ({
        end: jest.fn(),
        on: jest.fn((_requestEvent: string, cb: any) =>
            cb(
                {
                    statusCode: proxyConnectionStatusCode,
                } as http.IncomingMessage,
                mockSocket
            )
        ),
        destroy: jest.fn(),
        error: jest.fn(),
    }));
};

describe("HttpClient", () => {
    const httpClientWithoutProxyUrl = new HttpClient();

    const proxyUrl: string = "http://proxyUrl.com";
    const httpClientWithProxyUrl = new HttpClient(proxyUrl);

    describe("Test urlToHttpOptions", () => {
        // https://github.com/nodejs/node/blob/ca033c16fe0c2a62067f6188045c225424077fbd/test/parallel/test-url-urltooptions.js#L4
        test("All properties are extracted from a URL", async () => {
            const urlObj = new URL(
                "http://user:pass@foo.bar.com:21/aaa/zzz?l=24#test"
            );
            const opts = urlToHttpOptions(urlObj);

            expect(opts instanceof URL).toStrictEqual(false);
            expect(opts.protocol).toStrictEqual("http:");
            expect(opts.auth).toStrictEqual("user:pass");
            expect(opts.hostname).toStrictEqual("foo.bar.com");
            expect(opts.port).toStrictEqual(21);
            expect(opts.path).toStrictEqual("/aaa/zzz?l=24");
            expect(opts.pathname).toStrictEqual("/aaa/zzz");
            expect(opts.search).toStrictEqual("?l=24");
            expect(opts.hash).toStrictEqual("#test");

            const { hostname } = urlToHttpOptions(new URL("http://[::1]:21"));
            expect(hostname).toStrictEqual("::1");
        });
    });

    describe("Successful Get Request", <T>() => {
        test("Via Https", async () => {
            const httpsNetworkResponse: NetworkResponse<T> = getNetworkResponse(
                mockGetResponseBody,
                httpsStatusCode200
            );
            (https.request as jest.Mock).mockImplementationOnce(
                mockHttpsRequest(
                    mockGetResponseBodyBuffer,
                    httpsStatusCode200,
                    httpsStatusMessage200
                )
            );
            await expect(
                httpClientWithoutProxyUrl.sendGetRequestAsync(url)
            ).resolves.toEqual(httpsNetworkResponse);
        });

        test("Via Proxy", async () => {
            const proxyThenSocketNetworkResponse: NetworkResponse<T> =
                getNetworkResponse(mockGetResponseBody, httpsStatusCode200);
            (http.request as jest.Mock).mockImplementationOnce(
                mockHttpRequest(
                    mockGetResponseBody,
                    proxyStatusCode200,
                    socketStatusCode200
                )
            );
            await expect(
                httpClientWithProxyUrl.sendGetRequestAsync(url)
            ).resolves.toEqual(proxyThenSocketNetworkResponse);
        });
    });

    describe("Successful Post Request", <T>() => {
        test("Via Https", async () => {
            const httpsNetworkResponse: NetworkResponse<T> = getNetworkResponse(
                mockPostResponseBody,
                httpsStatusCode200
            );
            (https.request as jest.Mock).mockImplementationOnce(
                mockHttpsRequest(
                    mockPostResponseBodyBuffer,
                    httpsStatusCode200,
                    httpsStatusMessage200
                )
            );
            await expect(
                httpClientWithoutProxyUrl.sendPostRequestAsync(
                    url,
                    postNetworkRequestOptions
                )
            ).resolves.toEqual(httpsNetworkResponse);
        });

        test("Via Proxy", async () => {
            const proxyThenSocketNetworkResponse: NetworkResponse<T> =
                getNetworkResponse(mockPostResponseBody, httpsStatusCode200);
            (http.request as jest.Mock).mockImplementationOnce(
                mockHttpRequest(
                    mockPostResponseBody,
                    proxyStatusCode200,
                    socketStatusCode200
                )
            );
            await expect(
                httpClientWithProxyUrl.sendPostRequestAsync(
                    url,
                    postNetworkRequestOptions
                )
            ).resolves.toEqual(proxyThenSocketNetworkResponse);
        });
    });

    describe("Timeout Error (Post Requests Only)", () => {
        const timeoutInMilliseconds: number = 100;
        const error: Error = new Error("Request time out");

        test("Via Https", async () => {
            (https.request as jest.Mock).mockImplementationOnce(
                mockHttpsRequest(
                    mockPostResponseBodyBuffer,
                    httpsStatusCode200,
                    httpsStatusMessage200
                )
            );
            await expect(
                httpClientWithoutProxyUrl.sendPostRequestAsync(
                    url,
                    postNetworkRequestOptions,
                    timeoutInMilliseconds
                )
            ).rejects.toEqual(error);
        });

        /**
         * can only test http timeout, not socket timeout inside of the socket
         *
         * future work: add another timeout parameter to sendPostRequestAsync so it accepts two different timeouts:
         * one for http timeout and one for the socket timeout inside of the socket
         */
        test("Via Proxy", async () => {
            (http.request as jest.Mock).mockImplementationOnce(
                mockHttpRequest(
                    mockPostResponseBody,
                    proxyStatusCode200,
                    socketStatusCode200
                )
            );
            await expect(
                httpClientWithProxyUrl.sendPostRequestAsync(
                    url,
                    postNetworkRequestOptions,
                    timeoutInMilliseconds
                )
            ).rejects.toEqual(error);
        });
    });

    describe("Bad Status Code Error", () => {
        const proxyError: Error = new Error(
            "Error connecting to proxy. Http status code: 500. Http status message: Unknown"
        );

        describe("Get Request", () => {
            describe("Via Https", () => {
                test("Client Error 400", async () => {
                    const serverErrorNetworkResponse: NetworkResponse<MockedMetadataResponse> =
                        getNetworkResponse<MockedMetadataResponse>(
                            getMockServerErrorResponse(httpsStatusCode400),
                            httpsStatusCode400
                        );
                    (https.request as jest.Mock).mockImplementationOnce(
                        mockHttpsRequest(
                            mockServer400ErrorResponseBodyBuffer,
                            httpsStatusCode400,
                            httpsStatusMessage400
                        )
                    );
                    await expect(
                        httpClientWithoutProxyUrl.sendGetRequestAsync(url)
                    ).resolves.toEqual(serverErrorNetworkResponse);
                });

                test("Server Error 500", async () => {
                    const serverErrorNetworkResponse: NetworkResponse<MockedMetadataResponse> =
                        getNetworkResponse<MockedMetadataResponse>(
                            getMockServerErrorResponse(httpsStatusCode500),
                            httpsStatusCode500
                        );
                    (https.request as jest.Mock).mockImplementationOnce(
                        mockHttpsRequest(
                            mockServer500ErrorResponseBodyBuffer,
                            httpsStatusCode500,
                            httpsStatusMessage500
                        )
                    );
                    await expect(
                        httpClientWithoutProxyUrl.sendGetRequestAsync(url)
                    ).resolves.toEqual(serverErrorNetworkResponse);
                });

                test("Unknown Error 600", async () => {
                    const serverErrorNetworkResponse: NetworkResponse<MockedMetadataResponse> =
                        getNetworkResponse<MockedMetadataResponse>(
                            getMockServerErrorResponse(httpsStatusCode600),
                            httpsStatusCode600
                        );
                    (https.request as jest.Mock).mockImplementationOnce(
                        mockHttpsRequest(
                            mockServer600ErrorResponseBodyBuffer,
                            httpsStatusCode600,
                            httpsStatusMessage600
                        )
                    );
                    await expect(
                        httpClientWithoutProxyUrl.sendGetRequestAsync(url)
                    ).resolves.toEqual(serverErrorNetworkResponse);
                });
            });

            describe("Via Proxy", () => {
                test("Proxy Connection Status Code - Proxy Connection Error 500", async () => {
                    (http.request as jest.Mock).mockImplementationOnce(
                        mockHttpRequest(
                            mockGetResponseBody,
                            proxyStatusCode500,
                            httpsStatusCode500
                        )
                    );
                    await expect(
                        httpClientWithProxyUrl.sendGetRequestAsync(url)
                    ).rejects.toEqual(proxyError);
                });

                describe("Socket (Http)", () => {
                    test("Client Error 400", async () => {
                        const serverErrorNetworkResponse: NetworkResponse<MockedMetadataResponse> =
                            getNetworkResponse<MockedMetadataResponse>(
                                getMockServerErrorResponse(socketStatusCode400),
                                socketStatusCode400
                            );
                        (http.request as jest.Mock).mockImplementationOnce(
                            mockHttpRequest(
                                mockServer400ErrorResponseBody,
                                proxyStatusCode200,
                                socketStatusCode400
                            )
                        );
                        await expect(
                            httpClientWithProxyUrl.sendGetRequestAsync(url)
                        ).resolves.toEqual(serverErrorNetworkResponse);
                    });

                    test("Server Error 500", async () => {
                        const serverErrorNetworkResponse: NetworkResponse<MockedMetadataResponse> =
                            getNetworkResponse<MockedMetadataResponse>(
                                getMockServerErrorResponse(socketStatusCode500),
                                socketStatusCode500
                            );
                        (http.request as jest.Mock).mockImplementationOnce(
                            mockHttpRequest(
                                mockServer500ErrorResponseBody,
                                proxyStatusCode200,
                                socketStatusCode500
                            )
                        );
                        await expect(
                            httpClientWithProxyUrl.sendGetRequestAsync(url)
                        ).resolves.toEqual(serverErrorNetworkResponse);
                    });

                    test("Unknown Error 600", async () => {
                        const serverErrorNetworkResponse: NetworkResponse<MockedMetadataResponse> =
                            getNetworkResponse<MockedMetadataResponse>(
                                getMockServerErrorResponse(socketStatusCode600),
                                socketStatusCode600
                            );
                        (http.request as jest.Mock).mockImplementationOnce(
                            mockHttpRequest(
                                mockServer600ErrorResponseBody,
                                proxyStatusCode200,
                                socketStatusCode600
                            )
                        );
                        await expect(
                            httpClientWithProxyUrl.sendGetRequestAsync(url)
                        ).resolves.toEqual(serverErrorNetworkResponse);
                    });
                });
            });
        });

        describe("Post Request", () => {
            describe("Via Https", () => {
                test("Client Error 400", async () => {
                    const serverErrorNetworkResponse: NetworkResponse<MockedMetadataResponse> =
                        getNetworkResponse<MockedMetadataResponse>(
                            getMockServerErrorResponse(httpsStatusCode400),
                            httpsStatusCode400
                        );
                    (https.request as jest.Mock).mockImplementationOnce(
                        mockHttpsRequest(
                            mockServer400ErrorResponseBodyBuffer,
                            httpsStatusCode400,
                            httpsStatusMessage400
                        )
                    );
                    await expect(
                        httpClientWithoutProxyUrl.sendPostRequestAsync(
                            url,
                            postNetworkRequestOptions
                        )
                    ).resolves.toEqual(serverErrorNetworkResponse);
                });

                test("Server Error 500", async () => {
                    const serverErrorNetworkResponse: NetworkResponse<MockedMetadataResponse> =
                        getNetworkResponse<MockedMetadataResponse>(
                            getMockServerErrorResponse(httpsStatusCode500),
                            httpsStatusCode500
                        );
                    (https.request as jest.Mock).mockImplementationOnce(
                        mockHttpsRequest(
                            mockServer500ErrorResponseBodyBuffer,
                            httpsStatusCode500,
                            httpsStatusMessage500
                        )
                    );
                    await expect(
                        httpClientWithoutProxyUrl.sendPostRequestAsync(
                            url,
                            postNetworkRequestOptions
                        )
                    ).resolves.toEqual(serverErrorNetworkResponse);
                });

                test("Unknown Error 600", async () => {
                    const serverErrorNetworkResponse: NetworkResponse<MockedMetadataResponse> =
                        getNetworkResponse<MockedMetadataResponse>(
                            getMockServerErrorResponse(httpsStatusCode600),
                            httpsStatusCode600
                        );
                    (https.request as jest.Mock).mockImplementationOnce(
                        mockHttpsRequest(
                            mockServer600ErrorResponseBodyBuffer,
                            httpsStatusCode600,
                            httpsStatusMessage600
                        )
                    );
                    await expect(
                        httpClientWithoutProxyUrl.sendPostRequestAsync(
                            url,
                            postNetworkRequestOptions
                        )
                    ).resolves.toEqual(serverErrorNetworkResponse);
                });
            });

            describe("Via Proxy", () => {
                test("Proxy Connection Status Code - Proxy Connection Error 500", async () => {
                    (http.request as jest.Mock).mockImplementationOnce(
                        mockHttpRequest(
                            mockPostResponseBody,
                            proxyStatusCode500,
                            httpsStatusCode500
                        )
                    );
                    await expect(
                        httpClientWithProxyUrl.sendPostRequestAsync(
                            url,
                            postNetworkRequestOptions
                        )
                    ).rejects.toEqual(proxyError);
                });

                describe("Socket (Http)", () => {
                    test("Client Error 400", async () => {
                        const serverErrorNetworkResponse: NetworkResponse<MockedMetadataResponse> =
                            getNetworkResponse<MockedMetadataResponse>(
                                getMockServerErrorResponse(socketStatusCode400),
                                socketStatusCode400
                            );
                        (http.request as jest.Mock).mockImplementationOnce(
                            mockHttpRequest(
                                mockServer400ErrorResponseBody,
                                proxyStatusCode200,
                                socketStatusCode400
                            )
                        );
                        await expect(
                            httpClientWithProxyUrl.sendPostRequestAsync(
                                url,
                                postNetworkRequestOptions
                            )
                        ).resolves.toEqual(serverErrorNetworkResponse);
                    });

                    test("Server Error 500", async () => {
                        const serverErrorNetworkResponse: NetworkResponse<MockedMetadataResponse> =
                            getNetworkResponse<MockedMetadataResponse>(
                                getMockServerErrorResponse(socketStatusCode500),
                                socketStatusCode500
                            );
                        (http.request as jest.Mock).mockImplementationOnce(
                            mockHttpRequest(
                                mockServer500ErrorResponseBody,
                                proxyStatusCode200,
                                socketStatusCode500
                            )
                        );
                        await expect(
                            httpClientWithProxyUrl.sendPostRequestAsync(
                                url,
                                postNetworkRequestOptions
                            )
                        ).resolves.toEqual(serverErrorNetworkResponse);
                    });

                    test("Unknown Error 600", async () => {
                        const serverErrorNetworkResponse: NetworkResponse<MockedMetadataResponse> =
                            getNetworkResponse<MockedMetadataResponse>(
                                getMockServerErrorResponse(socketStatusCode600),
                                socketStatusCode600
                            );
                        (http.request as jest.Mock).mockImplementationOnce(
                            mockHttpRequest(
                                mockServer600ErrorResponseBody,
                                proxyStatusCode200,
                                socketStatusCode600
                            )
                        );
                        await expect(
                            httpClientWithProxyUrl.sendPostRequestAsync(
                                url,
                                postNetworkRequestOptions
                            )
                        ).resolves.toEqual(serverErrorNetworkResponse);
                    });
                });
            });
        });
    });
});
