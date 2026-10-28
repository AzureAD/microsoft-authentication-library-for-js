/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthError, Constants, Logger } from "@azure/msal-common/browser";
import { clearAuthResponseFromUrl } from "./BrowserUtils.js";
import * as BrowserAuthErrorCodes from "../error/BrowserAuthErrorCodes.js";

export const IFRAME_POLL_INTERVAL_MS = 50;
export const DEFAULT_IFRAME_TIMEOUT_MS = 10000;

/**
 * Monitors an iframe content window until it loads a URL with a known hash, or hits a specified timeout.
 *
 * @param iframe - The hidden iframe to monitor.
 * @param timeout - Maximum time (ms) to wait for navigation before rejecting with
 *   `monitor_window_timeout`.
 * @param logger - Logger instance.
 * @param correlationId
 * @param responseMode - `"query"` or `"fragment"` — determines whether to read
 *   `location.search` or `location.hash`. Any value other than `"query"` is
 *   treated as fragment.
 */
export async function monitorIframeForHash(
    iframe: HTMLIFrameElement,
    timeout: number,
    logger: Logger,
    correlationId: string,
    responseMode: string
): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        if (timeout < DEFAULT_IFRAME_TIMEOUT_MS) {
            logger.warning(
                `system.iframeBridgeTimeout set to lower (${timeout}ms) than the default (${DEFAULT_IFRAME_TIMEOUT_MS}ms). This may result in timeouts.`,
                correlationId
            );
        }

        /*
         * Polling for iframes can be purely timing based,
         * since we don't need to account for interaction.
         */
        const timeoutId = window.setTimeout(() => {
            window.clearInterval(intervalId);
            reject(
                new AuthError(
                    BrowserAuthErrorCodes.timedOut,
                    correlationId,
                    undefined,
                    "monitor_window_timeout"
                )
            );
        }, timeout);

        const intervalId = window.setInterval(() => {
            const contentWindow = iframe.contentWindow;
            if (!contentWindow) {
                return;
            }

            let href: string = "";
            try {
                /*
                 * Will throw if cross origin,
                 * which should be caught and ignored
                 * since we need the interval to keep running while on STS UI.
                 */
                href = contentWindow.location.href;
            } catch (e) {}

            if (!href || href === "about:blank") {
                return;
            }

            const responseString =
                responseMode === Constants.ResponseMode.QUERY
                    ? contentWindow.location.search
                    : contentWindow.location.hash;
            window.clearTimeout(timeoutId);
            window.clearInterval(intervalId);
            resolve(responseString);
        }, IFRAME_POLL_INTERVAL_MS);
    }).finally(() => {
        /*
         * Strip auth-response params from the iframe URL. The monitor owns the
         * iframe for the duration of the poll, mirroring cleanPopup in
         * PopupMonitor.
         */
        try {
            if (iframe.contentWindow) {
                clearAuthResponseFromUrl(iframe.contentWindow);
            }
        } catch {
            // Iframe may already be navigated away or cross-origin; ignore.
        }
    });
}
