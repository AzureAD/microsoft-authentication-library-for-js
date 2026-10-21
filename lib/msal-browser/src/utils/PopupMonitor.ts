/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Constants, Logger } from "@azure/msal-common/browser";
import { BrowserAuthError } from "../error/BrowserAuthError.js";
import * as BrowserAuthErrorCodes from "../error/BrowserAuthErrorCodes.js";
import { clearAuthResponseFromUrl } from "./BrowserUtils.js";

export const POPUP_POLL_INTERVAL_MS = 30;

let activePopupPoller:
    | { correlationId: string; cancel: () => void }
    | undefined;
const pendingPopupRequests = new Map<string, boolean>();

/**
 * Tracks a popup request so it can be cancelled before response monitoring begins.
 * @param correlationId Correlation ID of the popup request.
 */
export function registerPopupRequestCancellation(correlationId: string): void {
    pendingPopupRequests.set(correlationId, false);
}

/**
 * Cancels legacy popup polling when an interaction is superseded.
 *
 * @internal
 * @param logger Logger for the interaction.
 * @param correlationId Correlation ID of the superseded request.
 */
export function cancelPendingPopupPollingResponse(
    logger: Logger,
    correlationId?: string
): void {
    if (
        activePopupPoller &&
        (!correlationId || activePopupPoller.correlationId === correlationId)
    ) {
        logger.verbose(
            "PopupMonitor.cancelPendingPopupPollingResponse - Cancelling pending popup poller",
            correlationId || ""
        );
        activePopupPoller.cancel();
    } else if (correlationId && pendingPopupRequests.has(correlationId)) {
        pendingPopupRequests.set(correlationId, true);
    }
}

/**
 * Throws when a tracked popup request has been superseded.
 * @param correlationId Correlation ID of the popup request.
 */
export function throwIfPopupRequestCancelled(correlationId: string): void {
    if (pendingPopupRequests.get(correlationId)) {
        throw new BrowserAuthError(
            BrowserAuthErrorCodes.interactionInProgressCancelled,
            correlationId
        );
    }
}

/**
 * Stops tracking a popup request after it settles.
 * @param correlationId Correlation ID of the popup request.
 */
export function clearPopupRequestCancellation(correlationId: string): void {
    pendingPopupRequests.delete(correlationId);
}

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
    let poller: { correlationId: string; cancel: () => void } | undefined;
    return new Promise<string>((resolve, reject) => {
        try {
            throwIfPopupRequestCancelled(correlationId);
        } catch (e) {
            reject(e);
            return;
        }

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

        poller = {
            correlationId,
            cancel: () => {
                window.clearInterval(intervalId);
                if (activePopupPoller === poller) {
                    activePopupPoller = undefined;
                }
                reject(
                    new BrowserAuthError(
                        BrowserAuthErrorCodes.interactionInProgressCancelled,
                        correlationId
                    )
                );
            },
        };
        activePopupPoller = poller;
    }).finally(() => {
        if (poller && activePopupPoller === poller) {
            activePopupPoller = undefined;
        }
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
