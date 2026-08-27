/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    allAncestorsSameOrigin,
    computePocd,
    topOpenerIsSameOriginOrAbsent,
} from "../../src/utils/PopupOriginCheck.js";
import { BrowserConfiguration } from "../../src/config/Configuration.js";

/**
 * Builds a fake window graph. Cross-origin ancestors and openers are modelled
 * the way browsers expose them: reading `location.href` throws SecurityError,
 * while `opener` itself stays readable (it is on the cross-origin allowlist).
 */
function makeWindow(options: {
    origin?: string;
    crossOriginLocation?: boolean;
}): Window {
    const win = {
        origin: options.origin ?? "https://app.example.com",
    } as unknown as Window & { opener?: unknown };

    Object.defineProperty(win, "location", {
        get() {
            if (options.crossOriginLocation) {
                const err = new Error("Blocked a frame");
                err.name = "SecurityError";
                throw err;
            }
            return { href: `${options.origin}/page` };
        },
    });

    // Default: top-level and self-parented.
    (win as { parent: Window }).parent = win;
    (win as { top: Window }).top = win;
    (win as { opener?: unknown }).opener = null;
    return win;
}

function configWith(originCheck?: boolean): BrowserConfiguration {
    return {
        auth: { originCheck },
    } as unknown as BrowserConfiguration;
}

describe("PopupOriginCheck", () => {
    describe("allAncestorsSameOrigin", () => {
        it("passes for a top-level window (zero hops)", () => {
            expect(allAncestorsSameOrigin(makeWindow({}))).toBe(true);
        });

        it("passes when every ancestor is same-origin", () => {
            const top = makeWindow({});
            const child = makeWindow({});
            (child as { parent: Window }).parent = top;
            (child as { top: Window }).top = top;

            expect(allAncestorsSameOrigin(child)).toBe(true);
        });

        it("fails when an ancestor is cross-origin", () => {
            const host = makeWindow({
                origin: "https://untrusted.example",
                crossOriginLocation: true,
            });
            const child = makeWindow({});
            (child as { parent: Window }).parent = host;
            (child as { top: Window }).top = host;

            expect(allAncestorsSameOrigin(child)).toBe(false);
        });

        it("fails for an opaque origin even when the frame chain is readable", () => {
            /*
             * A sandboxed frame reports its URL origin from location.origin
             * while its real security origin is opaque. Reading window.origin
             * is what distinguishes the two.
             */
            const sandboxed = makeWindow({ origin: "null" });
            expect(allAncestorsSameOrigin(sandboxed)).toBe(false);
        });
    });

    describe("topOpenerIsSameOriginOrAbsent", () => {
        it("passes when there is no opener", () => {
            expect(topOpenerIsSameOriginOrAbsent(makeWindow({}))).toBe(true);
        });

        it("passes when the opener is same-origin", () => {
            const win = makeWindow({});
            (win as { opener?: unknown }).opener = makeWindow({});
            expect(topOpenerIsSameOriginOrAbsent(win)).toBe(true);
        });

        it("fails when the opener is cross-origin", () => {
            const win = makeWindow({});
            (win as { opener?: unknown }).opener = makeWindow({
                origin: "https://untrusted.example",
                crossOriginLocation: true,
            });
            expect(topOpenerIsSameOriginOrAbsent(win)).toBe(false);
        });

        it("inspects the opener of the top window, not the current frame", () => {
            /*
             * A nested browsing context always reports opener === null, so
             * checking the current window would wrongly pass while an untrusted
             * opener still holds a handle on the top-level document.
             */
            const top = makeWindow({});
            (top as { opener?: unknown }).opener = makeWindow({
                origin: "https://untrusted.example",
                crossOriginLocation: true,
            });

            const frame = makeWindow({});
            (frame as { opener?: unknown }).opener = null;
            (frame as { top: Window }).top = top;

            expect(topOpenerIsSameOriginOrAbsent(frame)).toBe(false);
        });
    });

    describe("computePocd", () => {
        const originalWindow = global.window;

        afterEach(() => {
            Object.defineProperty(global, "window", {
                value: originalWindow,
                writable: true,
                configurable: true,
            });
        });

        const setWindow = (win: Window | undefined): void => {
            Object.defineProperty(global, "window", {
                value: win,
                writable: true,
                configurable: true,
            });
        };

        it("returns 1 for a safe top-level window", () => {
            setWindow(makeWindow({}));
            expect(computePocd(configWith(undefined))).toBe(1);
        });

        it("returns 0 when embedded in a cross-origin host", () => {
            const host = makeWindow({
                origin: "https://untrusted.example",
                crossOriginLocation: true,
            });
            const frame = makeWindow({});
            (frame as { parent: Window }).parent = host;
            (frame as { top: Window }).top = host;

            setWindow(frame);
            expect(computePocd(configWith(undefined))).toBe(0);
        });

        it("returns 0 when the top window has a cross-origin opener", () => {
            const win = makeWindow({});
            (win as { opener?: unknown }).opener = makeWindow({
                origin: "https://untrusted.example",
                crossOriginLocation: true,
            });

            setWindow(win);
            expect(computePocd(configWith(undefined))).toBe(0);
        });

        it("returns 1 without computing when originCheck is false", () => {
            const host = makeWindow({
                origin: "https://untrusted.example",
                crossOriginLocation: true,
            });
            const frame = makeWindow({});
            (frame as { parent: Window }).parent = host;
            (frame as { top: Window }).top = host;

            setWindow(frame);
            // Would compute 0; the app has opted out and accepted the risk.
            expect(computePocd(configWith(false))).toBe(1);
        });

        it("still computes when originCheck is explicitly true", () => {
            const host = makeWindow({
                origin: "https://untrusted.example",
                crossOriginLocation: true,
            });
            const frame = makeWindow({});
            (frame as { parent: Window }).parent = host;
            (frame as { top: Window }).top = host;

            setWindow(frame);
            expect(computePocd(configWith(true))).toBe(0);
        });

        it("returns 0 outside a browser environment", () => {
            setWindow(undefined);
            expect(computePocd(configWith(undefined))).toBe(0);
        });
    });
});
