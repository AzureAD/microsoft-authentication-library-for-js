/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CommonAuthorizationUrlRequest, CommonEndSessionRequest, ICrypto, Logger, ProtocolUtils } from "@azure/msal-common/browser";

/**
 * Monitors a popup window for a URL change to the same origin as the parent application.
 * Polls the popup at a specified interval until it is redirected back to the application,
 * closed by the user, or a navigation to a same-origin URL is detected. Once a same-origin
 * URL is detected, extracts the response string (query or hash) and resolves the promise.
 * Performs cleanup by closing the popup and removing event listeners when done.
 *
 * @param pollIntervalMilliseconds - The interval, in milliseconds, at which to poll the popup window.
 * @param logger - Logger instance for logging monitoring events.
 * @param browserCrypto - brow
 * @param request
 * @returns Promise<string> - Resolves with the response string (query or hash) from the popup window,
 * or rejects if the popup is closed before a response is received.
 *
 * Monitoring behavior: Polls the popup window at the specified interval to detect navigation to a same-origin URL.
 * Timeout handling: If the popup is closed before a response is detected, the promise is rejected with a user cancellation error.
 * Cleanup process: On completion (success or failure), closes the popup and removes the unload event listener from the parent window.
 */
export async function monitorPopupForHash(
    pollIntervalMilliseconds: number,
    logger: Logger,
    browserCrypto: ICrypto,
    request: CommonAuthorizationUrlRequest | CommonEndSessionRequest
): Promise<string> {
    return new Promise<string>((resolve) => {
        logger.verbose(
            "PopupHandler.monitorPopupForHash - polling started",
            request.correlationId
        );

        const { libraryState } = ProtocolUtils.parseRequestState(browserCrypto, request.state || "");
        const channel = new BroadcastChannel( libraryState.id );
        let responseString: string | undefined = undefined;
        channel.onmessage = (event) => {
            responseString = event.data.payload;
            logger.warning(`Received a string from the popup = ${responseString}`, "")
        }

        const intervalId = setInterval(() => {
            // Window is closed
            if (!responseString) {
                return;
            }

            clearInterval(intervalId);
            resolve(responseString);
        }, pollIntervalMilliseconds);

        // const intervalId = setInterval(() => {
        //     // Window is closed
        //     if (popupWindow.closed) {
        //         logger.error(
        //             "PopupHandler.monitorPopupForHash - window closed",
        //             correlationId
        //         );
        //         clearInterval(intervalId);
        //         reject(
        //             createBrowserAuthError(BrowserAuthErrorCodes.userCancelled)
        //         );
        //         return;
        //     }
        //
        //     let href = "";
        //     try {
        //         /*
        //          * Will throw if cross origin,
        //          * which should be caught and ignored
        //          * since we need the interval to keep running while on STS UI.
        //          */
        //         href = popupWindow.location.href;
        //     } catch (e) {}
        //
        //     // Don't process blank pages or cross domain
        //     if (!href || href === "about:blank") {
        //         return;
        //     }
        //     clearInterval(intervalId);
        //
        //     let responseString = "";
        //     if (popupWindow) {
        //         if (responseMode === Constants.ResponseMode.QUERY) {
        //             responseString = popupWindow.location.search;
        //         } else {
        //             responseString = popupWindow.location.hash;
        //         }
        //     }
        //
        //     logger.verbose(
        //         "PopupHandler.monitorPopupForHash - popup window is on same origin as caller",
        //         correlationId
        //     );
        //
        //     resolve(responseString);
        // }, pollIntervalMilliseconds);
    });
}

/**
 * Performs cleanup operations after popup authentication.
 * Closes the popup window and removes the 'beforeunload' event listener from the parent window.
 *
 * @param popupWindow - The popup window to be closed.
 * @param popupWindowParent - The parent window from which the event listener will be removed.
 * @param unloadWindow - The event handler function to remove from the parent window's 'beforeunload' event.
 */
export function cleanPopup(
    popupWindow: Window,
    popupWindowParent: Window,
    unloadWindow: (e: Event) => void
): void {
    // Close window.
    popupWindow.close();

    // Remove window unload function
    popupWindowParent.removeEventListener("beforeunload", unloadWindow);
}
