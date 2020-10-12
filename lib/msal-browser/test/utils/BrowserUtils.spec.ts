import { expect } from "chai";
import sinon from "sinon";
import { BrowserUtils } from "../../src/utils/BrowserUtils";
import { TEST_URIS } from "./StringConstants";
import { XhrClient } from "../../src/network/XhrClient";
import { FetchClient } from "../../src/network/FetchClient";
import { BrowserAuthError, BrowserAuthErrorMessage } from "../../src/error/BrowserAuthError";

describe("BrowserUtils.ts Function Unit Tests", () => {

    let oldWindow: Window & typeof globalThis;
    afterEach(() => {
        sinon.restore();
        oldWindow = window;
        window.Headers = undefined;
        window.fetch = undefined;
    });

    afterEach(() => {
        window = oldWindow;
    });

    it("navigateWindow() with noHistory false or not set will call location.assign", (done) => {
        sinon.useFakeTimers();
        const oldWindowLocation = window.location;
        delete window.location;
        window.location = {
            ...oldWindowLocation,
            assign: function (url) {
                try {
                    expect(url).to.include(TEST_URIS.TEST_LOGOUT_URI);
                    done();
                } catch (e) {
                    console.error(e);
                }
            }
        };
        const windowAssignSpy = sinon.spy(window.location, "assign");
        BrowserUtils.navigateWindow(TEST_URIS.TEST_LOGOUT_URI, 10000);
        expect(windowAssignSpy.calledOnce).to.be.true;
    });

    it("navigateWindow() with noHistory true will call location.replace", (done) => {
        sinon.useFakeTimers();
        const oldWindowLocation = window.location;
        delete window.location;
        window.location = {
            ...oldWindowLocation,
            replace: function (url) {
                try {
                    expect(url).to.include(TEST_URIS.TEST_REDIR_URI);
                    done();
                } catch (e) {
                    console.error(e);
                }
            }
        };
        const windowReplaceSpy = sinon.spy(window.location, "replace");
        BrowserUtils.navigateWindow(TEST_URIS.TEST_REDIR_URI, 10000, true);
        expect(windowReplaceSpy.calledOnce).to.be.true;
    });

    it("navigateWindow() throws if navigation does not take place within 5 seconds", (done) => {
        const clock = sinon.useFakeTimers();
        const oldWindowLocation = window.location;
        delete window.location;
        window.location = {
            ...oldWindowLocation,
            replace: function (url) {
                try {
                    expect(url).to.include(TEST_URIS.TEST_REDIR_URI);
                } catch (e) {
                    console.log(e);
                }
            }
        };
        const windowReplaceSpy = sinon.spy(window.location, "replace");
        try {
            BrowserUtils.navigateWindow(TEST_URIS.TEST_REDIR_URI, 10000, true);
            expect(windowReplaceSpy.calledOnce).to.be.true;
            clock.next();
        } catch (e) {
            expect(e).to.be.instanceOf(BrowserAuthError);
            expect(e.errorCode).to.eq(BrowserAuthErrorMessage.navigationFailedError.code);
            done();
        }
    });

    it("clearHash() clears the window hash", () => {
        window.location.hash = "thisIsAHash";
        BrowserUtils.clearHash();
        expect(window.location.hash).to.be.empty;
    });

    it("replaceHash replaces the current window hash with the hash from the provided url", () => {
        window.location.hash = "thisIsAHash";
        const url = "http://localhost/#";
        const testHash = "replacementHash";
        BrowserUtils.replaceHash(url + testHash);
        expect(window.location.hash).to.be.eq(testHash);
    });

    it("replaceHash clears the current window hash when provided url does not have hash", () => {
        window.location.hash = "thisIsAHash";
        const url = "http://localhost/";
        BrowserUtils.replaceHash(url);
        expect(window.location.hash).to.be.eq("");
    });
    
    it("isInIframe() returns false if window parent is not the same as the current window", () => {
        expect(BrowserUtils.isInIframe()).to.be.false;
        sinon.stub(window, "parent").value(null);
        expect(BrowserUtils.isInIframe()).to.be.true;
    });

    it("getCurrentUri() returns current location uri of browser", () => {
        expect(BrowserUtils.getCurrentUri()).to.be.eq(TEST_URIS.TEST_REDIR_URI);
    });

    it("getBrowserNetworkClient() returns fetch client if available", () => {
        window.fetch = (input: RequestInfo, init?: RequestInit): Promise<Response> => {
            return null;
        };
        // @ts-ignore
        window.Headers = () => {};

        expect(BrowserUtils.getBrowserNetworkClient() instanceof FetchClient).to.be.true;
    });

    it("getBrowserNetworkClient() returns xhr client if available", () => {
        expect(BrowserUtils.getBrowserNetworkClient() instanceof XhrClient).to.be.true;
    });
});
