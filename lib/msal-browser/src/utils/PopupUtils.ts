/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    CommonAuthorizationUrlRequest,
    CommonEndSessionRequest,
    ICrypto,
    Logger,
    ProtocolUtils,
} from "@azure/msal-common/browser";
import {
    BrowserAuthErrorCodes,
    createBrowserAuthError,
} from "../error/BrowserAuthError.js";

/**
 * Monitors a popup window for a URL change to the same origin as the parent application.
 * Polls the popup at a specified interval until it is redirected back to the application,
 * closed by the user, or a navigation to a same-origin URL is detected. Once a same-origin
 * URL is detected, extracts the response string (query or hash) and resolves the promise.
 * Performs cleanup by closing the popup and removing event listeners when done.
 *
 * @param pollIntervalMilliseconds - The interval, in milliseconds, at which to poll the popup window.
 * @param timeoutMs - popup timeout, ms.
 * @param logger - Logger instance for logging monitoring events.
 * @param browserCrypto - browser crypto.
 * @param request - popup request.
 * @returns Promise<string> - Resolves with the response string (query or hash) from the popup window,
 * or rejects if the popup is closed before a response is received.
 *
 * Monitoring behavior: Polls the popup window at the specified interval to detect navigation to a same-origin URL.
 * Timeout handling: If the popup is closed before a response is detected, the promise is rejected with a user cancellation error.
 * Cleanup process: On completion (success or failure), closes the popup and removes the unload event listener from the parent window.
 */
export async function monitorPopupForHash(
    pollIntervalMilliseconds: number,
    timeoutMs: number,
    logger: Logger,
    browserCrypto: ICrypto,
    request: CommonAuthorizationUrlRequest | CommonEndSessionRequest
): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        logger.verbose(
            "PopupHandler.monitorPopupForHash - polling started",
            request.correlationId
        );

        const { libraryState } = ProtocolUtils.parseRequestState(
            browserCrypto.base64Decode,
            request.state || ""
        );
        const channel = new BroadcastChannel(libraryState.id);
        let responseString: string | undefined = undefined;
        channel.onmessage = (event) => {
            responseString = event.data.payload;
        };

        /*
         * Polling for iframes can be purely timing based,
         * since we don't need to account for interaction.
         */
        const timeoutId = window.setTimeout(() => {
            window.clearInterval(intervalId);
            channel.close();
            reject(
                createBrowserAuthError(
                    BrowserAuthErrorCodes.monitorPopupTimeout
                )
            );
        }, timeoutMs);

        const intervalId = setInterval(() => {
            // Window is closed
            if (!responseString) {
                return;
            }

            clearInterval(intervalId);
            clearTimeout(timeoutId);
            channel.close();
            resolve(responseString);
        }, pollIntervalMilliseconds);
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
