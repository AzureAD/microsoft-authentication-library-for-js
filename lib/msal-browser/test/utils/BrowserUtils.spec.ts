/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { expect } from "chai";
import sinon from "sinon";
import { BrowserUtils } from "../../src/utils/BrowserUtils";
import { TEST_URIS } from "./StringConstants";
import { XhrClient } from "../../src/network/XhrClient";
import { FetchClient } from "../../src/network/FetchClient";
import { BrowserAuthErrorMessage, InteractionType } from "../../src";

describe("BrowserUtils.ts Function Unit Tests", () => {

    const oldWindow: Window & typeof globalThis = window;
    afterEach(() => {
        window = oldWindow;
        window.Headers = undefined;
        window.fetch = undefined;
        sinon.restore();
    });

    it("clearHash() clears the window hash", () => {
        window.location.hash = "thisIsAHash";
        BrowserUtils.clearHash(window);
        expect(window.location.href.includes("#thisIsAHash")).to.be.false;
    });

    it("clearHash() clears the window hash (office addin)", () => {
        // Office.js sets replaceState to null: https://github.com/OfficeDev/office-js/issues/429
        const oldReplaceState = history.replaceState;
        history.replaceState = null;

        window.location.hash = "thisIsAHash";
        BrowserUtils.clearHash(window);
        expect(window.location.href.includes("#thisIsAHash")).to.be.false;
        
        history.replaceState = oldReplaceState;
    });

    it("replaceHash replaces the current window hash with the hash from the provided url", () => {
        window.location.hash = "thisIsAHash";
        const url = "http://localhost/#";
        const testHash = "#replacementHash";
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

    describe("blockRedirectInIframe", () => {
        it("throws when inside an iframe", done => {
            sinon.stub(BrowserUtils, "isInIframe").returns(true);
            try {
                BrowserUtils.blockRedirectInIframe(InteractionType.Redirect, false);
            } catch (e) {
                expect(e.errorCode).to.equal(BrowserAuthErrorMessage.redirectInIframeError.code);
                done();
            }
        });

        it("doesnt throw when inside an iframe and redirects are allowed", () => {
            sinon.stub(BrowserUtils, "isInIframe").returns(true);
            BrowserUtils.blockRedirectInIframe(InteractionType.Redirect, true);
        });

        it("doesnt throw when not inside an iframe", () => {
            BrowserUtils.blockRedirectInIframe(InteractionType.Redirect, false);
        });
    })
});
