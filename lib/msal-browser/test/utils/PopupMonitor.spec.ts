/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Constants, Logger } from "@azure/msal-common/browser";
import * as BrowserAuthErrorCodes from "../../src/error/BrowserAuthErrorCodes.js";
import {
    monitorPopupForHash,
    POPUP_POLL_INTERVAL_MS,
} from "../../src/utils/PopupMonitor.js";

const logger = new Logger({});
const NAV_DELAY_MS = POPUP_POLL_INTERVAL_MS * 2;
const CORR_ID = "test-correlation-id";

function makeFakePopup(initialHref = "about:blank"): Window {
    let closed = false;
    let href = initialHref;
    let hash = "";
    let search = "";

    const parseHref = (h: string) => {
        try {
            const u = new URL(h);
            hash = u.hash;
            search = u.search;
        } catch {
            hash = "";
            search = "";
        }
    };
    parseHref(initialHref);

    return {
        get closed() {
            return closed;
        },
        close() {
            closed = true;
        },
        get location() {
            return {
                get href() {
                    return href;
                },
                get hash() {
                    return hash;
                },
                get search() {
                    return search;
                },
            };
        },
        // Test helpers
        _setHref(h: string) {
            href = h;
            parseHref(h);
        },
        _setHash(h: string) {
            hash = h;
        },
        _setSearch(s: string) {
            search = s;
        },
        _close() {
            closed = true;
        },
    } as unknown as Window;
}

describe("PopupMonitor.monitorPopupForHash", () => {
    let parentWindow: Window;
    let unloadHandler: (e: Event) => void;
    let removeListenerSpy: jest.SpyInstance;

    beforeEach(() => {
        parentWindow = window;
        unloadHandler = () => {};
        removeListenerSpy = jest.spyOn(parentWindow, "removeEventListener");
    });

    afterEach(() => {
        removeListenerSpy.mockRestore();
    });

    it("resolves with the hash once the popup navigates to a same-origin URL (as a fragment)", async () => {
        const popup = makeFakePopup();
        const promise = monitorPopupForHash(
            popup,
            parentWindow,
            Constants.ResponseMode.FRAGMENT,
            logger,
            unloadHandler,
            CORR_ID
        );

        // Simulate same-origin navigation after a tick
        setTimeout(() => {
            (popup as any)._setHref(
                "http://localhost/redirect#code=abc&state=xyz"
            );
        }, NAV_DELAY_MS);

        await expect(promise).resolves.toBe("#code=abc&state=xyz");
    });

    it("resolves with the search string once the popup navigates to a same-origin URL (as a query param)", async () => {
        const popup = makeFakePopup();
        const promise = monitorPopupForHash(
            popup,
            parentWindow,
            Constants.ResponseMode.QUERY,
            logger,
            unloadHandler,
            CORR_ID
        );

        setTimeout(() => {
            (popup as any)._setHref(
                "http://localhost/redirect?code=abc&state=xyz"
            );
        }, NAV_DELAY_MS);

        await expect(promise).resolves.toBe("?code=abc&state=xyz");
    });

    it("rejects with user_cancelled when the popup is closed before navigation", async () => {
        const popup = makeFakePopup();
        const promise = monitorPopupForHash(
            popup,
            parentWindow,
            Constants.ResponseMode.FRAGMENT,
            logger,
            unloadHandler,
            CORR_ID
        );

        setTimeout(() => (popup as any)._close(), NAV_DELAY_MS);

        await expect(promise).rejects.toMatchObject({
            errorCode: BrowserAuthErrorCodes.userCancelled,
        });
    });

    it("ignores cross-origin location reads", async () => {
        const popup = makeFakePopup();
        let throwCount = 0;

        // Make .href throw twice (cross-origin), then return same-origin URL
        Object.defineProperty(popup, "location", {
            get() {
                if (throwCount < 2) {
                    throwCount++;
                    throw new Error("cross-origin");
                }
                return {
                    href: "http://localhost/redirect#code=ok",
                    hash: "#code=ok",
                    search: "",
                };
            },
        });

        await expect(
            monitorPopupForHash(
                popup,
                parentWindow,
                Constants.ResponseMode.FRAGMENT,
                logger,
                unloadHandler,
                CORR_ID
            )
        ).resolves.toBe("#code=ok");
        expect(throwCount).toBeGreaterThan(0);
    });

    it("calls cleanPopup on success", async () => {
        const popup = makeFakePopup();
        const closeSpy = jest.spyOn(popup, "close");

        const promise = monitorPopupForHash(
            popup,
            parentWindow,
            Constants.ResponseMode.FRAGMENT,
            logger,
            unloadHandler,
            CORR_ID
        );

        setTimeout(() => {
            (popup as any)._setHref("http://localhost/redirect#code=ok");
        }, NAV_DELAY_MS);

        await promise;
        // cleanPopup both closes the popup and removes the beforeunload listener
        expect(closeSpy).toHaveBeenCalled();
        expect(removeListenerSpy).toHaveBeenCalledWith(
            "beforeunload",
            unloadHandler
        );
    });

    it("calls cleanPopup on failure (window-closed)", async () => {
        const popup = makeFakePopup();
        const closeSpy = jest.spyOn(popup, "close");

        const promise = monitorPopupForHash(
            popup,
            parentWindow,
            Constants.ResponseMode.FRAGMENT,
            logger,
            unloadHandler,
            CORR_ID
        );

        setTimeout(() => (popup as any)._close(), NAV_DELAY_MS);

        await expect(promise).rejects.toBeDefined();

        // cleanPopup removes the beforeunload listener even if the popup is already closed
        expect(removeListenerSpy).toHaveBeenCalledWith(
            "beforeunload",
            unloadHandler
        );
    });

    it("keeps polling while the popup is on about:blank, then resolves once it navigates", async () => {
        const popup = makeFakePopup("about:blank");
        const promise = monitorPopupForHash(
            popup,
            window,
            Constants.ResponseMode.FRAGMENT,
            logger,
            () => {},
            CORR_ID
        );

        // Tick once on about:blank, then navigate.
        setTimeout(() => {
            (popup as any)._setHref("http://localhost/redirect#code=ok");
        }, NAV_DELAY_MS + POPUP_POLL_INTERVAL_MS);

        await expect(promise).resolves.toBe("#code=ok");
    });
});
