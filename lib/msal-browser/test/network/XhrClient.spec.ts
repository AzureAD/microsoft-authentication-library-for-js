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
                expect(method).to.be.eq(HTTP_REQUEST_TYPE.GET);
                expect(url).to.be.eq(targetUri);
                expect(async).to.be.true;
            });
            sinon.stub(HTTP_REQUEST_TYPE, "GET").value("NOTATYPE");

            await expect(xhrClient.sendGetRequestAsync<any>(targetUri)).to.be.rejectedWith(BrowserAuthErrorMessage.httpMethodNotImplementedError.desc);
            await expect(xhrClient.sendGetRequestAsync<any>(targetUri)).to.be.rejectedWith(BrowserAuthError);
        });
    });
});
