import { FetchClient } from "../../src/network/FetchClient";
import { HTTP_REQUEST_TYPE } from "../../src/utils/BrowserConstants";
import {
    NetworkRequestOptions,
    Constants,
    IPerformanceClient,
    NetworkError,
} from "@azure/msal-common";
import { BrowserAuthErrorCodes } from "../../src/error/BrowserAuthError.js";

const mockResponse: Response = {
    headers: new Headers(),
    body: null,
    status: 200,
    ok: true,
    redirected: false,
    statusText: "OK",
    type: "basic",
    url: "",
    clone: () => {
        return mockResponse;
    },
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    bodyUsed: false,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(""),
    blob: () => Promise.resolve(new Blob()),
    formData: () => Promise.resolve(new FormData()),
};

describe("FetchClient.ts Unit Tests", () => {
    let fetchClient: FetchClient;
    let mockPerformanceClient: IPerformanceClient;
    const correlationId = "correlation-id";

    beforeEach(() => {
        jest.useFakeTimers();
        mockPerformanceClient = {
            incrementFields: jest.fn(),
        } as unknown as IPerformanceClient;
        fetchClient = new FetchClient();
    });

    afterEach(() => {
        jest.restoreAllMocks();
        jest.useRealTimers();
    });

    describe("Get requests", () => {
        it("sends a get request as expected", (done) => {
            const targetUri = `${Constants.DEFAULT_AUTHORITY}/`;
            global["fetch"] = jest
                .fn()
                .mockImplementation(
                    (url: RequestInfo | URL, init: RequestInit | undefined) => {
                        expect(init && init.method).toBe(HTTP_REQUEST_TYPE.GET);
                        expect(url).toBe(targetUri);
                        done();
                        return Promise.resolve(mockResponse);
                    }
                );

            fetchClient.sendGetRequestAsync(targetUri);
        });
    });

    describe("Post requests", () => {
        it("sends a post request as expected", (done) => {
            const targetUri = `${Constants.DEFAULT_AUTHORITY}/`;
            const requestOptions: NetworkRequestOptions = {
                body: "thisIsAPostBody",
            };
            global["fetch"] = jest
                .fn()
                .mockImplementation(
                    (url: RequestInfo | URL, init: RequestInit | undefined) => {
                        expect(init && init.method).toBe(
                            HTTP_REQUEST_TYPE.POST
                        );
                        expect(init && init.body).toBe(requestOptions.body);
                        expect(url).toBe(targetUri);
                        done();
                        return Promise.resolve(mockResponse);
                    }
                );

            fetchClient.sendPostRequestAsync(targetUri, {
                ...requestOptions,
                correlationId,
            });
        });

        it("retries a thrown post request once before succeeding", async () => {
            const targetUri = `${Constants.DEFAULT_AUTHORITY}/`;
            const requestOptions: NetworkRequestOptions = {
                body: "thisIsAPostBody",
            };
            global["fetch"] = jest
                .fn()
                .mockRejectedValueOnce(new TypeError("Failed to fetch"))
                .mockResolvedValueOnce(mockResponse);

            const promise = fetchClient.sendPostRequestAsync<any>(targetUri, {
                ...requestOptions,
                correlationId,
                performanceClient: mockPerformanceClient,
            });
            await jest.advanceTimersByTimeAsync(100);
            const response = await promise;

            expect(global["fetch"]).toHaveBeenCalledTimes(2);
            expect(response).toEqual({
                headers: {},
                body: {},
                status: 200,
            });
            expect(mockPerformanceClient.incrementFields).toHaveBeenCalledTimes(
                1
            );
            expect(mockPerformanceClient.incrementFields).toHaveBeenCalledWith(
                { fetchRetryCount: 1 },
                correlationId
            );
        });

        it("sends headers with the requests", (done) => {
            const targetUri = `${Constants.DEFAULT_AUTHORITY}/`;
            const reqHeaders: Record<string, string> = {
                "Content-Type": Constants.URL_FORM_CONTENT_TYPE,
            };
            const requestOptions: NetworkRequestOptions = {
                body: "thisIsAPostBody",
                headers: reqHeaders,
            };
            global["fetch"] = jest
                .fn()
                .mockImplementation(
                    (url: RequestInfo | URL, init: RequestInit | undefined) => {
                        expect(init && init.method).toBe(
                            HTTP_REQUEST_TYPE.POST
                        );
                        expect(init && init.body).toBe(requestOptions.body);

                        for (const headerName in reqHeaders) {
                            expect(
                                init &&
                                    init.headers &&
                                    // @ts-ignore
                                    init.headers.get(headerName)
                            ).toBe(reqHeaders[headerName]);
                        }
                        expect(url).toBe(targetUri);
                        done();
                        return Promise.resolve(mockResponse);
                    }
                );

            fetchClient.sendPostRequestAsync(targetUri, {
                ...requestOptions,
                correlationId,
            });
        });
    });

    describe("sendRequestAsync", () => {
        it("throws error if fetch post rejects due to transport failure", async () => {
            const targetUri = `${Constants.DEFAULT_AUTHORITY}/`;
            const requestOptions: NetworkRequestOptions = {
                body: "thisIsAPostBody",
            };

            global["fetch"] = jest
                .fn()
                .mockImplementation(
                    (url: RequestInfo | URL, init: RequestInit | undefined) => {
                        expect(init && init.method).toBe(
                            HTTP_REQUEST_TYPE.POST
                        );
                        expect(init && init.body).toBe(requestOptions.body);
                        expect(url).toBe(targetUri);
                        return Promise.reject(
                            new TypeError("Failed to fetch")
                        );
                    }
                );

            const promise = fetchClient.sendPostRequestAsync<any>(targetUri, {
                ...requestOptions,
                correlationId,
                performanceClient: mockPerformanceClient,
            });
            const expectation = expect(promise).rejects.toMatchObject({
                errorCode: BrowserAuthErrorCodes.postRequestFailed,
            });
            // Advance timer to allow the 100ms backoff before retry
            await jest.advanceTimersByTimeAsync(100);
            await expectation;
            // Verify retry occurred (2 fetch calls) and telemetry was emitted
            expect(global["fetch"]).toHaveBeenCalledTimes(2);
            expect(mockPerformanceClient.incrementFields).toHaveBeenCalledWith(
                { fetchRetryCount: 1 },
                correlationId
            );
        });

        it("throws error if fetch get returns non-200 status", (done) => {
            const targetUri = `${Constants.DEFAULT_AUTHORITY}/`;
            global["fetch"] = jest
                .fn()
                .mockImplementation(
                    (url: RequestInfo | URL, init: RequestInit | undefined) => {
                        expect(init && init.method).toBe(HTTP_REQUEST_TYPE.GET);
                        expect(url).toBe(targetUri);
                        return Promise.reject({ ...mockResponse, status: 16 });
                    }
                );

            fetchClient.sendGetRequestAsync<any>(targetUri).catch((e) => {
                expect(e).toBeInstanceOf(NetworkError);
                expect(e.errorCode).toBe(
                    BrowserAuthErrorCodes.getRequestFailed
                );
                expect(e.errorMessage).toContain(`additionalErrorInfo:`);
                done();
            });
        });

        it("throws error if fetch request cannot parse response", (done) => {
            const targetUri = `${Constants.DEFAULT_AUTHORITY}/`;
            const requestOptions: NetworkRequestOptions = {
                body: "thisIsAPostBody",
            };

            global["fetch"] = jest
                .fn()
                .mockImplementation(
                    (url: RequestInfo | URL, init: RequestInit | undefined) => {
                        expect(init && init.method).toBe(
                            HTTP_REQUEST_TYPE.POST
                        );
                        expect(init && init.body).toBe(requestOptions.body);
                        expect(url).toBe(targetUri);
                        return Promise.resolve({
                            ...mockResponse,
                            json: () => Promise.reject("thisIsNotJSON"),
                        });
                    }
                );

            fetchClient
                .sendPostRequestAsync<any>(targetUri, {
                    ...requestOptions,
                    correlationId,
                })
                .catch((e) => {
                    expect(e).toBeInstanceOf(NetworkError);
                    expect(e.errorCode).toBe(
                        BrowserAuthErrorCodes.failedToParseResponse
                    );
                    expect(e.errorMessage).toContain(`additionalErrorInfo:`);
                    done();
                });
        });

        it("throws error if fetch errors and network is unavailable", async () => {
            const targetUri = `${Constants.DEFAULT_AUTHORITY}/`;
            const requestOptions: NetworkRequestOptions = {
                body: "thisIsAPostBody",
            };

            global["fetch"] = jest
                .fn()
                .mockImplementation(
                    (url: RequestInfo | URL, init: RequestInit | undefined) => {
                        expect(init && init.method).toBe(
                            HTTP_REQUEST_TYPE.POST
                        );
                        expect(init && init.body).toBe(requestOptions.body);
                        expect(url).toBe(targetUri);
                        return Promise.reject({ ...mockResponse, status: 0 });
                    }
                );

            const oldWindowNavigator = window.navigator;
            const windowNavigatorSpy = jest.spyOn(window, "navigator", "get");
            windowNavigatorSpy.mockImplementation(() => {
                return {
                    ...oldWindowNavigator,
                    onLine: false,
                };
            });

            const promise = fetchClient.sendPostRequestAsync<any>(targetUri, {
                ...requestOptions,
                correlationId,
                performanceClient: mockPerformanceClient,
            });
            const expectation = expect(promise).rejects.toMatchObject({
                errorCode: BrowserAuthErrorCodes.noNetworkConnectivity,
            });
            await expectation;
            expect(global["fetch"]).toHaveBeenCalledTimes(1);
            expect(
                mockPerformanceClient.incrementFields
            ).not.toHaveBeenCalled();
        });

        it("does not retry aborted post requests", async () => {
            const targetUri = `${Constants.DEFAULT_AUTHORITY}/`;
            const requestOptions: NetworkRequestOptions = {
                body: "thisIsAPostBody",
            };

            global["fetch"] = jest.fn().mockRejectedValue(
                Object.assign(new Error("aborted"), {
                    name: "AbortError",
                })
            );

            const promise = fetchClient.sendPostRequestAsync<any>(targetUri, {
                ...requestOptions,
                correlationId,
                performanceClient: mockPerformanceClient,
            });
            const expectation = expect(promise).rejects.toMatchObject({
                errorCode: BrowserAuthErrorCodes.postRequestFailed,
            });
            await expectation;
            expect(global["fetch"]).toHaveBeenCalledTimes(1);
            expect(
                mockPerformanceClient.incrementFields
            ).not.toHaveBeenCalled();
        });
    });
});
