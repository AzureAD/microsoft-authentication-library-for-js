import { FetchClient } from "../../src/network/FetchClient";
import { HTTP_REQUEST_TYPE } from "../../src/utils/BrowserConstants";
import {
    Constants,
    NetworkError,
    NetworkRequestOptions,
} from "@azure/msal-common";
import {
    BrowserAuthErrorMessage,
    BrowserAuthError,
} from "../../src/error/BrowserAuthError";

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
    beforeEach(() => {
        fetchClient = new FetchClient();
    });

    afterEach(() => {
        jest.restoreAllMocks();
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

            fetchClient.sendPostRequestAsync(targetUri, requestOptions);
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

            fetchClient.sendPostRequestAsync(targetUri, requestOptions);
        });
    });

    describe("sendRequestAsync", () => {
        it("throws error if fetch post returns non-200 status", (done) => {
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
                        return Promise.reject({ ...mockResponse, status: 16 });
                    }
                );

            fetchClient
                .sendPostRequestAsync<any>(targetUri, requestOptions)
                .catch((e) => {
                    expect(e).toBeInstanceOf(BrowserAuthError);
                    expect(e.errorCode).toBe(
                        BrowserAuthErrorMessage.postRequestFailed.code
                    );
                    done();
                });
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
                expect(e).toBeInstanceOf(BrowserAuthError);
                expect(e.errorCode).toBe(
                    BrowserAuthErrorMessage.getRequestFailed.code
                );
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
                .sendPostRequestAsync<any>(targetUri, requestOptions)
                .catch((e) => {
                    expect(e).toBeInstanceOf(NetworkError);
                    expect(e.error).toBeInstanceOf(BrowserAuthError);
                    expect(e.errorCode).toBe(
                        BrowserAuthErrorMessage.failedToParseNetworkResponse
                            .code
                    );
                    done();
                });
        });

        it("throws error if fetch errors and network is unavailable", (done) => {
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

            fetchClient
                .sendPostRequestAsync<any>(targetUri, requestOptions)
                .catch((e) => {
                    expect(e).toBeInstanceOf(BrowserAuthError);
                    expect(e.errorCode).toBe(
                        BrowserAuthErrorMessage.noNetworkConnectivity.code
                    );
                    done();
                });
        });
    });
});
