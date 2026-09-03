/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Constants, Logger } from "@azure/msal-common/browser";
import { BrowserAuthError } from "../error/BrowserAuthError.js";
import * as BrowserAuthErrorCodes from "../error/BrowserAuthErrorCodes.js";
import { clearAuthResponseFromUrl } from "./BrowserUtils.js";

export const POPUP_POLL_INTERVAL_MS = 30;

/**
 * Monitors a popup window for a URL change to the same origin as the parent application.
 * Polls the popup at a specified interval until it is redirected back to the application,
 * closed by the user, or a navigation to a same-origin URL is detected. Once a same-origin
 * URL is detected, extracts the response string (query or hash) and resolves the promise.
 *
 * @param popupWindow - The popup window to monitor for navigation.
 * @param popupWindowParent - The parent window that opened the popup.
 * @param responseMode - Response mode (`"query"` | `"fragment"`) determines whether
 *   to read `location.search` or `location.hash` from the popup once on the same
 *   origin. Any value other than `"query"` is treated as fragment.
 * @param logger - Logger instance.
 * @param unloadWindow - Event handler to remove from the parent window on cleanup.
 * @param correlationId
 */
export async function monitorPopupForHash(
    popupWindow: Window,
    popupWindowParent: Window,
    responseMode: string,
    logger: Logger,
    unloadWindow: (e: Event) => void,
    correlationId: string
): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        logger.verbose(
            "PopupMonitor.monitorPopupForHash - polling started",
            correlationId
        );

        const intervalId = window.setInterval(() => {
            if (popupWindow.closed) {
                logger.error(
                    "PopupMonitor.monitorPopupForHash - window closed",
                    correlationId
                );
                window.clearInterval(intervalId);
                reject(
                    new BrowserAuthError(
                        BrowserAuthErrorCodes.userCancelled,
                        correlationId
                    )
                );
                return;
            }

            let href = "";
            try {
                /*
                 * Will throw if cross origin,
                 * which should be caught and ignored
                 * since we need the interval to keep running while on STS UI.
                 */
                href = popupWindow.location.href;
            } catch (e) {}

            // Don't process blank pages or cross domain
            if (!href || href === "about:blank") {
                return;
            }
            window.clearInterval(intervalId);

            let responseString: string;
            if (responseMode === Constants.ResponseMode.QUERY) {
                responseString = popupWindow.location.search;
            } else {
                responseString = popupWindow.location.hash;
            }

            logger.verbose(
                "PopupMonitor.monitorPopupForHash - popup window is on same origin as caller",
                correlationId
            );

            resolve(responseString);
        }, POPUP_POLL_INTERVAL_MS);
    }).finally(() => {
        cleanPopup(popupWindow, popupWindowParent, unloadWindow);
    });
}

/**
 * Performs cleanup operations after popup authentication.
 * Strips auth-response params (code/state) from the popup URL while it is still
 * open, closes the popup window, and removes the 'beforeunload' event listener
 * from the parent window.
 *
 * @param popupWindow - The popup window to be closed.
 * @param popupWindowParent - The parent window from which the event listener will be removed.
 * @param unloadWindow - The event handler function to remove.
 */
export function cleanPopup(
    popupWindow: Window,
    popupWindowParent: Window,
    unloadWindow: (e: Event) => void
): void {
    if (!popupWindow.closed) {
        try {
            clearAuthResponseFromUrl(popupWindow);
        } catch {
            // Popup may have become cross-origin or otherwise inaccessible; ignore.
        }
    }
    popupWindow.close();

    popupWindowParent.removeEventListener("beforeunload", unloadWindow);
}
