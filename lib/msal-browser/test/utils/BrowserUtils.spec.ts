/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

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
        //@ts-ignore
        window.Headers = undefined;
        //@ts-ignore
        window.fetch = undefined;
        sinon.restore();
    });

    it("clearHash() clears the window hash", () => {
        window.location.hash = "thisIsAHash";
        BrowserUtils.clearHash(window);
        expect(window.location.href.includes("#thisIsAHash")).toBe(false);
    });

    it("clearHash() clears the window hash (office addin)", () => {
        // Office.js sets replaceState to null: https://github.com/OfficeDev/office-js/issues/429
        const oldReplaceState = history.replaceState;
        //@ts-ignore
        history.replaceState = null;

        window.location.hash = "thisIsAHash";
        BrowserUtils.clearHash(window);
        expect(window.location.href.includes("#thisIsAHash")).toBe(false);
        
        history.replaceState = oldReplaceState;
    });

    it("replaceHash replaces the current window hash with the hash from the provided url", () => {
        window.location.hash = "thisIsAHash";
        const url = "http://localhost/#";
        const testHash = "#replacementHash";
        BrowserUtils.replaceHash(url + testHash);
        expect(window.location.hash).toBe(testHash);
    });

    it("replaceHash clears the current window hash when provided url does not have hash", () => {
        window.location.hash = "thisIsAHash";
        const url = "http://localhost/";
        BrowserUtils.replaceHash(url);
        expect(window.location.hash).toBe("");
    });

    it("isInIframe() returns false if window parent is the same as the current window", () => {
        sinon.stub(window, "parent").value(window);
        expect(BrowserUtils.isInIframe()).toBe(false);
    });
    
    it("isInIframe() returns true if window parent is not the same as the current window", () => {
        expect(BrowserUtils.isInIframe()).toBe(false);
        sinon.stub(window, "parent").value(null);
        expect(BrowserUtils.isInIframe()).toBe(true);
    });

    it("isInPopup() returns false if window is undefined", () => {
        // @ts-ignore
        window = undefined;
        expect(BrowserUtils.isInPopup()).toBe(false);
    });

    it("isInPopup() returns false if window opener is not the same as the current window but window name does not starts with 'msal.'", () => {
        window.opener = {...window};
        sinon.stub(window, "name").value("non-msal-popup");
        expect(BrowserUtils.isInPopup()).toBe(false);
    });

    it("isInPopup() returns false if window opener is the same as the current window", () => {
        window.opener = window;
        sinon.stub(window, "name").value("msal.");
        expect(BrowserUtils.isInPopup()).toBe(false);
    });

    it("isInPopup() returns true if window opener is not the same as the current window and the window name starts with 'msal.'", () => {
        expect(BrowserUtils.isInPopup()).toBe(false);
        window.opener = {...window};
        sinon.stub(window, "name").value("msal.popupwindow");
        expect(BrowserUtils.isInPopup()).toBe(true);
    });

    it("getCurrentUri() returns current location uri of browser", () => {
        expect(BrowserUtils.getCurrentUri()).toBe(TEST_URIS.TEST_REDIR_URI);
    });

    it("getBrowserNetworkClient() returns fetch client if available", () => {
        window.fetch = (input: RequestInfo, init?: RequestInit): Promise<Response> => {
            //@ts-ignore
            return null;
        };
        // @ts-ignore
        window.Headers = () => {};

        expect(BrowserUtils.getBrowserNetworkClient() instanceof FetchClient).toBe(true);
    });

    it("getBrowserNetworkClient() returns xhr client if available", () => {
        expect(BrowserUtils.getBrowserNetworkClient() instanceof XhrClient).toBe(true);
    });

    describe("blockRedirectInIframe", () => {
        it("throws when inside an iframe", done => {
            sinon.stub(BrowserUtils, "isInIframe").returns(true);
            try {
                BrowserUtils.blockRedirectInIframe(InteractionType.Redirect, false);
            } catch (e) {
                expect(e.errorCode).toBe(BrowserAuthErrorMessage.redirectInIframeError.code);
                done();
            }
        });

        it("doesnt throw when inside an iframe and redirects are allowed", () => {
            sinon.stub(BrowserUtils, "isInIframe").returns(true);
            BrowserUtils.blockRedirectInIframe(InteractionType.Redirect, true);
        });

        it("doesnt throw when not inside an iframe", () => {
            sinon.stub(BrowserUtils, "isInIframe").returns(false);
            BrowserUtils.blockRedirectInIframe(InteractionType.Redirect, false);
        });
    })
});
