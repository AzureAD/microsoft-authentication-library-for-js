import { expect } from "chai";
import sinon from "sinon";
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
    });

    describe("Get requests", () => {

        it("sends a get request as expected", () => {
            const targetUri = `${Constants.DEFAULT_AUTHORITY}/`;
            sinon.stub(XMLHttpRequest.prototype, "open").callsFake((method: string, url: string, async: boolean) => {
                expect(method).to.be.eq(HTTP_REQUEST_TYPE.GET);
                expect(url).to.be.eq(targetUri);
                expect(async).to.be.true;
            });
            sinon.stub(XMLHttpRequest.prototype, "send").callsFake((body) => {
                expect(body).to.be.undefined;
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
                expect(method).to.be.eq(HTTP_REQUEST_TYPE.POST);
                expect(url).to.be.eq(targetUri);
                expect(async).to.be.true;
            });
            sinon.stub(XMLHttpRequest.prototype, "send").callsFake((body) => {
                expect(body).to.be.eq(requestOptions.body);
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
                expect(body).to.be.eq(requestOptions.body);
            });
            const headerSpy = sinon.spy(XhrClient.prototype, <any>"setXhrHeaders");

            xhrClient.sendPostRequestAsync(targetUri, requestOptions);
            expect(headerSpy.args[0]).to.contain(requestOptions);
        });
    });

    describe("sendRequestAsync", () => {

        it("throws error if called with an unrecognized request type", async () => {
            const targetUri = `${Constants.DEFAULT_AUTHORITY}/`;
            sinon.stub(XMLHttpRequest.prototype, "open").callsFake((method: string, url: string, async: boolean) => {
                expect(method).to.be.eq("NOTATYPE");
                expect(url).to.be.eq(targetUri);
                expect(async).to.be.true;
                sinon.restore();
            });

            sinon.stub(HTTP_REQUEST_TYPE, "GET").value("NOTATYPE");

            try {
                await xhrClient.sendGetRequestAsync<any>(targetUri);
            } catch (e) {
                expect(e).to.be.instanceOf(BrowserAuthError);
                expect(e.errorMessage).to.contain(BrowserAuthErrorMessage.httpMethodNotImplementedError.desc);
            }
        });

        it("throws error if xhr post returns non-200 status", (done) => {
            const xhr = sinon.useFakeXMLHttpRequest();
            let testRequest;
            xhr.onCreate = function(xhrRequest) {
                testRequest = xhrRequest;
            };
            const targetUri = `${Constants.DEFAULT_AUTHORITY}/`;
            const requestOptions: NetworkRequestOptions = {
                body: "thisIsAPostBody"
            };

            xhrClient.sendPostRequestAsync<any>(targetUri, requestOptions).catch(e => {
                expect(e).to.be.instanceOf(BrowserAuthError);
                expect(e.errorCode).to.be.eq(BrowserAuthErrorMessage.postRequestFailed.code);
                expect(e.errorMessage).to.contain("Failed with status 16");
                done();
            });
            testRequest.respond(16);
        });

        it("throws error if xhr get returns non-200 status", (done) => {
            const xhr = sinon.useFakeXMLHttpRequest();
            let testRequest;
            xhr.onCreate = function(xhrRequest) {
                testRequest = xhrRequest;
            };
            const targetUri = `${Constants.DEFAULT_AUTHORITY}/`;

            xhrClient.sendGetRequestAsync<any>(targetUri).catch(e => {
                expect(e).to.be.instanceOf(BrowserAuthError);
                expect(e.errorCode).to.be.eq(BrowserAuthErrorMessage.getRequestFailed.code);
                expect(e.errorMessage).to.contain("Failed with status 16");
                done();
            });
            testRequest.respond(16);
        });

        it("throws error if xhr request cannot parse response", (done) => {
            const xhr = sinon.useFakeXMLHttpRequest();
            let testRequest;
            xhr.onCreate = function(xhrRequest) {
                testRequest = xhrRequest;
            };
            const targetUri = `${Constants.DEFAULT_AUTHORITY}/`;
            const requestOptions: NetworkRequestOptions = {
                body: "thisIsAPostBody"
            };

            xhrClient.sendPostRequestAsync<any>(targetUri, requestOptions).catch(e => {
                expect(e).to.be.instanceOf(BrowserAuthError);
                expect(e.errorCode).to.be.eq(BrowserAuthErrorMessage.failedToParseNetworkResponse.code);
                done();
            });
            testRequest.respond(200, { 'Content-Type': 'text/json' }, "thisIsNotJSON");
        });

        it("throws error if xhr post errors", (done) => {
            const xhr = sinon.useFakeXMLHttpRequest();
            let testRequest;
            xhr.onCreate = function(xhrRequest) {
                testRequest = xhrRequest;
            };
            const targetUri = `${Constants.DEFAULT_AUTHORITY}/`;
            const requestOptions: NetworkRequestOptions = {
                body: "thisIsAPostBody"
            };

            xhrClient.sendPostRequestAsync<any>(targetUri, requestOptions).catch(e => {
                expect(e).to.be.instanceOf(BrowserAuthError);
                expect(e.errorCode).to.be.eq(BrowserAuthErrorMessage.postRequestFailed.code);
                expect(e.errorMessage).to.contain("Failed with status 0");
                done();
            });
            testRequest.error();
        });

        it("throws error if xhr get errors", (done) => {
            const xhr = sinon.useFakeXMLHttpRequest();
            let testRequest;
            xhr.onCreate = function(xhrRequest) {
                testRequest = xhrRequest;
            };
            const targetUri = `${Constants.DEFAULT_AUTHORITY}/`;

            xhrClient.sendGetRequestAsync<any>(targetUri).catch(e => {
                expect(e).to.be.instanceOf(BrowserAuthError);
                expect(e.errorCode).to.be.eq(BrowserAuthErrorMessage.getRequestFailed.code);
                expect(e.errorMessage).to.contain("Failed with status 0");
                done();
            });
            testRequest.error();
        });

        it("throws error if xhr errors and network is unavailable", (done) => {
            const xhr = sinon.useFakeXMLHttpRequest();
            let testRequest;
            xhr.onCreate = function(xhrRequest) {
                testRequest = xhrRequest;
            };
            const targetUri = `${Constants.DEFAULT_AUTHORITY}/`;
            const requestOptions: NetworkRequestOptions = {
                body: "thisIsAPostBody"
            };

            const oldWindow = window;
            window = {
                ...oldWindow, 
                navigator: {
                    ...oldWindow.navigator,
                    onLine: false
                }
            }

            xhrClient.sendPostRequestAsync<any>(targetUri, requestOptions).catch(e => {
                expect(e).to.be.instanceOf(BrowserAuthError);
                expect(e.errorCode).to.be.eq(BrowserAuthErrorMessage.noNetworkConnectivity.code);
                window = oldWindow;
                done();
            });
            testRequest.error(0);
        });
    });
});
