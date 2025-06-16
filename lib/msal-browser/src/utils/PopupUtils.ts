/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Constants, Logger } from "@azure/msal-common";
import { BrowserConfiguration } from "../config/Configuration.js";
import { BrowserAuthErrorCodes, createBrowserAuthError } from "../error/BrowserAuthError.js";

/**
 * Monitors a window until it loads a url with the same origin.
 * @param popupWindow - window that is being monitored
 * @param timeout - timeout for processing hash once popup is redirected back to application
 */
export async function monitorPopupForHash(
    popupWindow: Window,
    popupWindowParent: Window,
    config: BrowserConfiguration,
    logger: Logger,
    unloadWindow: (e: Event) => void
): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        logger.verbose(
            "PopupHandler.monitorPopupForHash - polling started"
        );

        const intervalId = setInterval(() => {
            // Window is closed
            if (popupWindow.closed) {
                logger.error(
                    "PopupHandler.monitorPopupForHash - window closed"
                );
                clearInterval(intervalId);
                reject(
                    createBrowserAuthError(
                        BrowserAuthErrorCodes.userCancelled
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
            clearInterval(intervalId);

            let responseString = "";
            const responseType = config.auth.OIDCOptions.responseMode;
            if (popupWindow) {
                if (responseType === Constants.ResponseMode.QUERY) {
                    responseString = popupWindow.location.search;
                } else {
                    responseString = popupWindow.location.hash;
                }
            }

            logger.verbose(
                "PopupHandler.monitorPopupForHash - popup window is on same origin as caller"
            );

            resolve(responseString);
        }, config.system.pollIntervalMilliseconds);
    }).finally(() => {
        cleanPopup(popupWindow, popupWindowParent, unloadWindow);
    });
}

/**
 * Closes popup, removes any state vars created during popup calls.
 * @param popupWindow
 */
export function cleanPopup(popupWindow: Window, popupWindowParent: Window, unloadWindow: (e: Event) => void): void {
    // Close window.
    popupWindow.close();

    // Remove window unload function
    popupWindowParent.removeEventListener(
        "beforeunload",
        unloadWindow
    );
}
