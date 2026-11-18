/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    monitorIframeForHash,
    DEFAULT_IFRAME_TIMEOUT_MS,
    IFRAME_POLL_INTERVAL_MS,
} from "../../src/utils/IframeMonitor.js";
import { Constants, Logger } from "@azure/msal-common/browser";

const logger = new Logger({});
const NAV_DELAY_MS = IFRAME_POLL_INTERVAL_MS * 2;
const CORR_ID = "test-correlation-id";

function makeFakeIframe(initialHref = "about:blank"): HTMLIFrameElement {
    let href = initialHref;
    let hash = "";
    let search = "";
    const fakeContentWindow = {
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
    };
    const iframe = {
        get contentWindow() {
            return fakeContentWindow as unknown as Window;
        },
        // Test helper that mirrors real Window.location: assigning href
        // re-parses the URL and updates hash/search accordingly.
        _setHref(h: string) {
            href = h;
            try {
                const parsed = new URL(h);
                hash = parsed.hash;
                search = parsed.search;
            } catch {
                hash = "";
                search = "";
            }
        },
        // Simulate parent so cleanup is a no-op
        parentNode: null,
    } as unknown as HTMLIFrameElement;
    return iframe;
}

describe("IframeMonitor.monitorIframeForHash", () => {
    it("resolves with the hash once the iframe navigates to a same-origin URL (as a fragment)", async () => {
        const iframe = makeFakeIframe();
        const promise = monitorIframeForHash(
            iframe,
            DEFAULT_IFRAME_TIMEOUT_MS,
            logger,
            CORR_ID,
            Constants.ResponseMode.FRAGMENT
        );

        setTimeout(() => {
            (iframe as any)._setHref(
                "http://localhost/redirect#code=abc&state=xyz"
            );
        }, NAV_DELAY_MS);

        await expect(promise).resolves.toBe("#code=abc&state=xyz");
    });

    it("resolves with the search string once the iframe navigates to a same-origin URL (as a query param)", async () => {
        const iframe = makeFakeIframe();
        const promise = monitorIframeForHash(
            iframe,
            DEFAULT_IFRAME_TIMEOUT_MS,
            logger,
            CORR_ID,
            Constants.ResponseMode.QUERY
        );

        setTimeout(() => {
            (iframe as any)._setHref(
                "http://localhost/redirect?code=abc&state=xyz"
            );
        }, NAV_DELAY_MS);

        await expect(promise).resolves.toBe("?code=abc&state=xyz");
    });

    it("rejects with monitor_window_timeout when the iframe never navigates", async () => {
        const iframe = makeFakeIframe();
        const shortTimeout = IFRAME_POLL_INTERVAL_MS;
        await expect(
            monitorIframeForHash(
                iframe,
                shortTimeout,
                logger,
                CORR_ID,
                Constants.ResponseMode.FRAGMENT
            )
        ).rejects.toMatchObject({
            errorCode: "timed_out",
            subError: "monitor_window_timeout",
        });
    });

    it("logs a warning when timeout is below DEFAULT_IFRAME_TIMEOUT_MS", async () => {
        const iframe = makeFakeIframe();
        const warnSpy = jest.spyOn(logger, "warning");
        const belowDefault = 500;
        const promise = monitorIframeForHash(
            iframe,
            belowDefault,
            logger,
            CORR_ID,
            Constants.ResponseMode.FRAGMENT
        );

        setTimeout(() => {
            (iframe as any)._setHref("http://localhost/redirect#code=ok");
        }, NAV_DELAY_MS);

        await promise;
        expect(warnSpy).toHaveBeenCalledWith(
            expect.stringContaining(
                `lower (${belowDefault}ms) than the default`
            ),
            CORR_ID
        );
        warnSpy.mockRestore();
    });

    it("ignores cross-origin reads", async () => {
        const iframe = makeFakeIframe();
        let throwCount = 0;

        const fakeContentWindow = {
            get location() {
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
        };
        Object.defineProperty(iframe, "contentWindow", {
            get() {
                return fakeContentWindow;
            },
        });

        await expect(
            monitorIframeForHash(
                iframe,
                DEFAULT_IFRAME_TIMEOUT_MS,
                logger,
                CORR_ID,
                Constants.ResponseMode.FRAGMENT
            )
        ).resolves.toBe("#code=ok");
        expect(throwCount).toBeGreaterThan(0);
    });
});
