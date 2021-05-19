import sinon, { SinonFakeXMLHttpRequest } from "sinon";
import { XhrClient } from "../../src/network/XhrClient";
import { HTTP_REQUEST_TYPE } from "../../src/utils/BrowserConstants";
import { Constants, NetworkRequestOptions } from "@azure/msal-common";
import { BrowserAuthErrorMessage, BrowserAuthError } from "../../src/error/BrowserAuthError";

describe("XhrClient.ts Unit Tests", () => {

    let xhrClient: XhrClient;
    beforeEach(() => {
        xhrClient = new XhrClient();
    });

    afterEach(() => {
        sinon.restore();
        jest.restoreAllMocks();
    });

    describe("Get requests", () => {

        it("sends a get request as expected", () => {
            const targetUri = `${Constants.DEFAULT_AUTHORITY}/`;
            sinon.stub(XMLHttpRequest.prototype, "open").callsFake((method: string, url: string, async: boolean) => {
                expect(method).toBe(HTTP_REQUEST_TYPE.GET);
                expect(url).toBe(targetUri);
                expect(async).toBe(true);
            });
            sinon.stub(XMLHttpRequest.prototype, "send").callsFake((body) => {
                expect(body).toBeUndefined();
            });

            xhrClient.sendGetRequestAsync(targetUri);
        });
    });

    describe("Post requests", () => {

        it("sends a get request as expected", () => {
            const targetUri = `${Constants.DEFAULT_AUTHORITY}/`;
            const requestOptions: NetworkRequestOptions = {
                body: "thisIsAPostBody"
            };
            sinon.stub(XMLHttpRequest.prototype, "open").callsFake((method: string, url: string, async: boolean) => {
                expect(method).toBe(HTTP_REQUEST_TYPE.POST);
                expect(url).toBe(targetUri);
                expect(async).toBe(true);
            });
            sinon.stub(XMLHttpRequest.prototype, "send").callsFake((body) => {
                expect(body).toBe(requestOptions.body);
            });

            xhrClient.sendPostRequestAsync(targetUri, requestOptions);
        });

        it("sends headers with the requests", async () => {
            const targetUri = `${Constants.DEFAULT_AUTHORITY}/`;
            const reqHeaders: Record<string, string> = { "Content-Type": Constants.URL_FORM_CONTENT_TYPE }
            const requestOptions: NetworkRequestOptions = {
                body: "thisIsAPostBody",
                headers: reqHeaders
            };
            sinon.stub(XMLHttpRequest.prototype, "send").callsFake((body) => {
                expect(body).toBe(requestOptions.body);
            });
            const headerSpy = sinon.spy(XhrClient.prototype, <any>"setXhrHeaders");

            xhrClient.sendPostRequestAsync(targetUri, requestOptions);
            expect(headerSpy.args[0].includes(requestOptions)).toBe(true);
        });
    });

    describe("sendRequestAsync", () => {

        it("throws error if called with an unrecognized request type", async () => {
            const targetUri = `${Constants.DEFAULT_AUTHORITY}/`;
            sinon.stub(XMLHttpRequest.prototype, "open").callsFake((method: string, url: string, async: boolean) => {
                expect(method).toBe("NOTATYPE");
                expect(url).toBe(targetUri);
                expect(async).toBe(true);
                sinon.restore();
            });

            sinon.stub(HTTP_REQUEST_TYPE, "GET").value("NOTATYPE");

            try {
                await xhrClient.sendGetRequestAsync<any>(targetUri);
            } catch (e) {
                expect(e).toBeInstanceOf(BrowserAuthError);
                expect(e.errorMessage.includes(BrowserAuthErrorMessage.httpMethodNotImplementedError.desc)).toBe(true);
            }
        });

        it("throws error if xhr post returns non-200 status", (done) => {
            const xhr = sinon.useFakeXMLHttpRequest();
            let testRequest: SinonFakeXMLHttpRequest;
            xhr.onCreate = function(xhrRequest) {
                testRequest = xhrRequest;
            };
            const targetUri = `${Constants.DEFAULT_AUTHORITY}/`;
            const requestOptions: NetworkRequestOptions = {
                body: "thisIsAPostBody"
            };

            xhrClient.sendPostRequestAsync<any>(targetUri, requestOptions).catch(e => {
                expect(e).toBeInstanceOf(BrowserAuthError);
                expect(e.errorCode).toBe(BrowserAuthErrorMessage.postRequestFailed.code);
                expect(e.errorMessage.includes("Failed with status 16")).toBe(true);
                done();
            });
            testRequest!.respond(16, {}, "");
        });

        it("throws error if xhr get returns non-200 status", (done) => {
            const xhr = sinon.useFakeXMLHttpRequest();
            let testRequest: SinonFakeXMLHttpRequest;
            xhr.onCreate = function(xhrRequest) {
                testRequest = xhrRequest;
            };
            const targetUri = `${Constants.DEFAULT_AUTHORITY}/`;

            xhrClient.sendGetRequestAsync<any>(targetUri).catch(e => {
                expect(e).toBeInstanceOf(BrowserAuthError);
                expect(e.errorCode).toBe(BrowserAuthErrorMessage.getRequestFailed.code);
                expect(e.errorMessage.includes("Failed with status 16")).toBe(true);
                done();
            });
            testRequest!.respond(16, {}, "");
        });

        it("throws error if xhr request cannot parse response", (done) => {
            const xhr = sinon.useFakeXMLHttpRequest();
            let testRequest: SinonFakeXMLHttpRequest;
            xhr.onCreate = function(xhrRequest) {
                testRequest = xhrRequest;
            };
            const targetUri = `${Constants.DEFAULT_AUTHORITY}/`;
            const requestOptions: NetworkRequestOptions = {
                body: "thisIsAPostBody"
            };

            xhrClient.sendPostRequestAsync<any>(targetUri, requestOptions).catch(e => {
                expect(e).toBeInstanceOf(BrowserAuthError);
                expect(e.errorCode).toBe(BrowserAuthErrorMessage.failedToParseNetworkResponse.code);
                done();
            });
            testRequest!.respond(200, { 'Content-Type': 'text/json' }, "thisIsNotJSON");
        });

        it("throws error if xhr post errors", (done) => {
            const xhr = sinon.useFakeXMLHttpRequest();
            let testRequest: SinonFakeXMLHttpRequest;
            xhr.onCreate = function(xhrRequest) {
                testRequest = xhrRequest;
            };
            const targetUri = `${Constants.DEFAULT_AUTHORITY}/`;
            const requestOptions: NetworkRequestOptions = {
                body: "thisIsAPostBody"
            };

            xhrClient.sendPostRequestAsync<any>(targetUri, requestOptions).catch(e => {
                expect(e).toBeInstanceOf(BrowserAuthError);
                expect(e.errorCode).toBe(BrowserAuthErrorMessage.postRequestFailed.code);
                expect(e.errorMessage.includes("Failed with status 0")).toBe(true);
                done();
            });
            testRequest!.error();
        });

        it("throws error if xhr get errors", (done) => {
            const xhr = sinon.useFakeXMLHttpRequest();
            let testRequest: SinonFakeXMLHttpRequest;
            xhr.onCreate = function(xhrRequest) {
                testRequest = xhrRequest;
            };
            const targetUri = `${Constants.DEFAULT_AUTHORITY}/`;

            xhrClient.sendGetRequestAsync<any>(targetUri).catch(e => {
                expect(e).toBeInstanceOf(BrowserAuthError);
                expect(e.errorCode).toBe(BrowserAuthErrorMessage.getRequestFailed.code);
                expect(e.errorMessage.includes("Failed with status 0")).toBe(true);
                done();
            });
            testRequest!.error();
        });

        it("throws error if xhr errors and network is unavailable", (done) => {
            const xhr = sinon.useFakeXMLHttpRequest();
            let testRequest: SinonFakeXMLHttpRequest;
            xhr.onCreate = function(xhrRequest) {
                testRequest = xhrRequest;
            };
            const targetUri = `${Constants.DEFAULT_AUTHORITY}/`;
            const requestOptions: NetworkRequestOptions = {
                body: "thisIsAPostBody"
            };

            const oldWindowNavigator = window.navigator;
            const windowNavigatorSpy = jest.spyOn(window, "navigator", "get");
            windowNavigatorSpy.mockImplementation(() => {
                return {
                    ...oldWindowNavigator,
                    onLine: false
                }
            });

            xhrClient.sendPostRequestAsync<any>(targetUri, requestOptions).catch(e => {
                expect(e).toBeInstanceOf(BrowserAuthError);
                expect(e.errorCode).toBe(BrowserAuthErrorMessage.noNetworkConnectivity.code);
                done();
            });
            testRequest!.error();
        });
    });
});
