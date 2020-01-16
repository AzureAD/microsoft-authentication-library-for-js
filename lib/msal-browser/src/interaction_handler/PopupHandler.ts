/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
// Common package imports
import { UrlString, StringUtils, Constants, TokenResponse } from "@azure/msal-common";
// Base class
import { InteractionHandler } from "./InteractionHandler";
// Errors
import { BrowserAuthError } from "../error/BrowserAuthError";
// Constants
import { BrowserConstants } from "../utils/BrowserConstants";

/**
 * This class implements the interaction handler base class for browsers. It is written specifically for handling
 * popup window scenarios. It includes functions for monitoring the popup window for a hash.
 */
export class PopupHandler extends InteractionHandler {

    // Currently opened window handle.
    private currentWindow: Window;

    /**
     * Opens a popup window with given request Url.
     * @param requestUrl 
     */
    showUI(requestUrl: string): Window {
        // Check that request url is not empty.
        if (!StringUtils.isEmpty(requestUrl)) {
            // Set interaction status in the library.
            this.browserStorage.setItem(BrowserConstants.INTERACTION_STATUS_KEY, BrowserConstants.INTERACTION_IN_PROGRESS_VALUE);
            // Open the popup window to requestUrl.
            const popupWindow = this.openPopup(requestUrl, Constants.LIBRARY_NAME, BrowserConstants.POPUP_WIDTH, BrowserConstants.POPUP_HEIGHT);
            // Save the window handle.
            this.currentWindow = popupWindow;
            this.authModule.logger.infoPii("Navigate to:" + requestUrl);
            // Return popup window handle.
            return popupWindow;
        } else {
            // Throw error if request URL is empty.
            this.authModule.logger.error("Navigate url is empty");
            throw BrowserAuthError.createEmptyNavigationUriError();
        }
    }

    /**
     * Function to handle response parameters from hash.
     * @param locationHash 
     */
    async handleCodeResponse(locationHash: string): Promise<TokenResponse> {
        // Check that location hash isn't empty.
        if (StringUtils.isEmpty(locationHash)) {
            throw BrowserAuthError.createEmptyHashError(locationHash);
        }

        // Interaction is completed - remove interaction status.
        this.browserStorage.removeItem(BrowserConstants.INTERACTION_STATUS_KEY);
        // Handle code response.
        const codeResponse = this.authModule.handleFragmentResponse(locationHash);
        // Close window.
        this.currentWindow.close();
        // Acquire token with retrieved code.
        return this.authModule.acquireToken(codeResponse);
    }

    /**
     * Monitors a window until it loads a url with a hash
     * @param contentWindow - window that is being monitored
     * @param timeout - milliseconds until timeout
     * @param urlNavigate - url that was navigated to
     */
    monitorWindowForHash(contentWindow: Window, timeout: number, urlNavigate: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const maxTicks = timeout / BrowserConstants.POPUP_POLL_INTERVAL_MS;
            let ticks = 0;

            const intervalId = setInterval(() => {
                if (contentWindow.closed) {
                    clearInterval(intervalId);
                    reject(BrowserAuthError.createUserCancelledError());
                    return;
                }

                let href;
                try {
                    /*
                     * Will throw if cross origin,
                     * which should be caught and ignored
                     * since we need the interval to keep running while on STS UI.
                     */
                    href = contentWindow.location.href;
                } catch (e) {}

                // Don't process blank pages or cross domain
                if (!href || href === "about:blank") {
                    return;
                }

                // Only run clock when we are on same domain
                ticks++;

                if (UrlString.hashContainsKnownProperties(href)) {
                    clearInterval(intervalId);
                    resolve(contentWindow.location.hash);
                } else if (ticks > maxTicks) {
                    clearInterval(intervalId);
                    contentWindow.close();
                    reject(BrowserAuthError.createPopupWindowTimeoutError(urlNavigate)); // better error?
                }
            }, BrowserConstants.POPUP_POLL_INTERVAL_MS);
        });
    }

    /**
     * @hidden
     *
     * Configures popup window for login.
     *
     * @param urlNavigate
     * @param title
     * @param popUpWidth
     * @param popUpHeight
     * @ignore
     * @hidden
     */
    private openPopup(urlNavigate: string, title: string, popUpWidth: number, popUpHeight: number): Window {
        try {
            /**
             * adding winLeft and winTop to account for dual monitor
             * using screenLeft and screenTop for IE8 and earlier
             */
            const winLeft = window.screenLeft ? window.screenLeft : window.screenX;
            const winTop = window.screenTop ? window.screenTop : window.screenY;
            /**
             * window.innerWidth displays browser window"s height and width excluding toolbars
             * using document.documentElement.clientWidth for IE8 and earlier
             */
            const width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
            const height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
            const left = ((width / 2) - (popUpWidth / 2)) + winLeft;
            const top = ((height / 2) - (popUpHeight / 2)) + winTop;

            // open the window
            const popupWindow = window.open(urlNavigate, title, "width=" + popUpWidth + ", height=" + popUpHeight + ", top=" + top + ", left=" + left);
            if (!popupWindow) {
                throw BrowserAuthError.createPopupWindowError();
            }
            if (popupWindow.focus) {
                popupWindow.focus();
            }

            return popupWindow;
        } catch (e) {
            this.authModule.logger.error("error opening popup " + e.message);
            this.browserStorage.removeItem(BrowserConstants.INTERACTION_STATUS_KEY);
            throw BrowserAuthError.createPopupWindowError(e.toString());
        }
    }
}
