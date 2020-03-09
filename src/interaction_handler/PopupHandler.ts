/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { UrlString, StringUtils, Constants, TokenResponse, PublicClient } from "@azure/msal-common";
import { InteractionHandler } from "./InteractionHandler";
import { BrowserAuthError } from "../error/BrowserAuthError";
import { BrowserConstants } from "../utils/BrowserConstants";
import { BrowserStorage } from "../cache/BrowserStorage";

/**
 * This class implements the interaction handler base class for browsers. It is written specifically for handling
 * popup window scenarios. It includes functions for monitoring the popup window for a hash.
 */
export class PopupHandler extends InteractionHandler {

    private currentWindow: Window;

    constructor(authCodeModule: PublicClient, storageImpl: BrowserStorage) {
        super(authCodeModule, storageImpl);

        // Properly sets this reference for the unload event.
        this.unloadWindow = this.unloadWindow.bind(this);
    }

    /**
     * Opens a popup window with given request Url.
     * @param requestUrl
     */
    showUI(requestUrl: string): Window {
        // Check that request url is not empty.
        if (!StringUtils.isEmpty(requestUrl)) {
            // Set interaction status in the library.
            this.browserStorage.setItem(BrowserConstants.INTERACTION_STATUS_KEY, BrowserConstants.INTERACTION_IN_PROGRESS_VALUE);
            this.authModule.logger.infoPii("Navigate to:" + requestUrl);
            // Open the popup window to requestUrl.
            return this.openPopup(requestUrl, Constants.LIBRARY_NAME, BrowserConstants.POPUP_WIDTH, BrowserConstants.POPUP_HEIGHT);
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

        // Handle code response.
        const codeResponse = this.authModule.handleFragmentResponse(locationHash);

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
                    // Window is closed
                    this.cleanPopup();
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
                    // Success case
                    const contentHash = contentWindow.location.hash;
                    this.cleanPopup(contentWindow);
                    clearInterval(intervalId);
                    resolve(contentHash);
                    return;
                } else if (ticks > maxTicks) {
                    // Timeout error
                    this.cleanPopup(contentWindow);
                    clearInterval(intervalId);
                    reject(BrowserAuthError.createPopupWindowTimeoutError(urlNavigate));
                    return;
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
                throw BrowserAuthError.createEmptyWindowCreatedError();
            }
            if (popupWindow.focus) {
                popupWindow.focus();
            }
            this.currentWindow = popupWindow;
            window.addEventListener("beforeunload", this.unloadWindow);

            return popupWindow;
        } catch (e) {
            this.authModule.logger.error("error opening popup " + e.message);
            this.browserStorage.removeItem(BrowserConstants.INTERACTION_STATUS_KEY);
            throw BrowserAuthError.createPopupWindowError(e.toString());
        }
    }

    /**
     * Event callback to unload main window.
     */
    unloadWindow(e: Event): void {
        this.authModule.cancelRequest();
        this.browserStorage.removeItem(BrowserConstants.INTERACTION_STATUS_KEY);
        this.currentWindow.close();
        // Guarantees browser unload will happen, so no other errors will be thrown.
        delete e["returnValue"];
    }

    /**
     * Closes popup, removes any state vars created during popup calls.
     * @param popupWindow
     */
    private cleanPopup(popupWindow?: Window): void {
        if (popupWindow) {
            // Close window.
            popupWindow.close();
        }
        // Remove window unload function
        window.removeEventListener("beforeunload", this.unloadWindow);

        // Interaction is completed - remove interaction status.
        this.browserStorage.removeItem(BrowserConstants.INTERACTION_STATUS_KEY);
    }
}
