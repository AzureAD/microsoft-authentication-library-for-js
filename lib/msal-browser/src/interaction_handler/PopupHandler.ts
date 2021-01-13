/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { UrlString, StringUtils, AuthorizationCodeRequest, AuthorizationCodeClient, Constants } from "@azure/msal-common";
import { InteractionHandler, InteractionParams } from "./InteractionHandler";
import { BrowserAuthError } from "../error/BrowserAuthError";
import { BrowserConstants, InteractionType, TemporaryCacheKeys } from "../utils/BrowserConstants";
import { BrowserCacheManager } from "../cache/BrowserCacheManager";
import { DEFAULT_POPUP_TIMEOUT_MS } from "../config/Configuration";
import { AuthorizationUrlRequest } from "../request/AuthorizationUrlRequest";

export type PopupParams = InteractionParams & {
    popup?: Window|null;
    popupName: string
};

/**
 * This class implements the interaction handler base class for browsers. It is written specifically for handling
 * popup window scenarios. It includes functions for monitoring the popup window for a hash.
 */
export class PopupHandler extends InteractionHandler {

    private currentWindow: Window|undefined;

    constructor(authCodeModule: AuthorizationCodeClient, storageImpl: BrowserCacheManager, authCodeRequest: AuthorizationCodeRequest) {
        super(authCodeModule, storageImpl, authCodeRequest);

        // Properly sets this reference for the unload event.
        this.unloadWindow = this.unloadWindow.bind(this);
    }

    /**
     * Opens a popup window with given request Url.
     * @param requestUrl
     */
    initiateAuthRequest(requestUrl: string, params: PopupParams): Window {
        // Check that request url is not empty.
        if (!StringUtils.isEmpty(requestUrl)) {
            // Set interaction status in the library.
            this.browserStorage.setTemporaryCache(TemporaryCacheKeys.INTERACTION_STATUS_KEY, BrowserConstants.INTERACTION_IN_PROGRESS_VALUE, true);
            this.authModule.logger.infoPii("Navigate to:" + requestUrl);
            // Open the popup window to requestUrl.
            return this.openPopup(requestUrl, params.popupName, params.popup);
        } else {
            // Throw error if request URL is empty.
            this.authModule.logger.error("Navigate url is empty");
            throw BrowserAuthError.createEmptyNavigationUriError();
        }
    }

    /**
     * Monitors a window until it loads a url with a known hash, or hits a specified timeout.
     * @param popupWindow - window that is being monitored
     * @param timeout - milliseconds until timeout
     * @param urlNavigate - url that was navigated to
     */
    monitorPopupForHash(popupWindow: Window, timeout: number): Promise<string> {
        return new Promise((resolve, reject) => {
            if (timeout < DEFAULT_POPUP_TIMEOUT_MS) {
                this.authModule.logger.warning(`system.loadFrameTimeout or system.windowHashTimeout set to lower (${timeout}ms) than the default (${DEFAULT_POPUP_TIMEOUT_MS}ms). This may result in timeouts.`);
            }

            const maxTicks = timeout / BrowserConstants.POLL_INTERVAL_MS;
            let ticks = 0;

            const intervalId = setInterval(() => {
                if (popupWindow.closed) {
                    // Window is closed
                    this.cleanPopup();
                    clearInterval(intervalId);
                    reject(BrowserAuthError.createUserCancelledError());
                    return;
                }

                let href: string = Constants.EMPTY_STRING;
                try {
                    /*
                     * Will throw if cross origin,
                     * which should be caught and ignored
                     * since we need the interval to keep running while on STS UI.
                     */
                    href = popupWindow.location.href;
                } catch (e) {}

                // Don't process blank pages or cross domain
                if (StringUtils.isEmpty(href) || href === "about:blank") {
                    return;
                }

                // Only run clock when we are on same domain
                ticks++;
                const contentHash = popupWindow.location.hash;
                if (UrlString.hashContainsKnownProperties(contentHash)) {
                    // Success case
                    this.cleanPopup(popupWindow);
                    clearInterval(intervalId);
                    resolve(contentHash);
                    return;
                } else if (ticks > maxTicks) {
                    // Timeout error
                    this.cleanPopup(popupWindow);
                    clearInterval(intervalId);
                    reject(BrowserAuthError.createMonitorPopupTimeoutError());
                    return;
                }
            }, BrowserConstants.POLL_INTERVAL_MS);
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
    private openPopup(urlNavigate: string, popupName: string, popup?: Window|null): Window {
        try {
            let popupWindow;
            // Popup window passed in, setting url to navigate to
            if (popup) {
                popupWindow = popup;
                popupWindow.location.assign(urlNavigate);
            } else if (typeof popup === "undefined") {
                // Popup will be undefined if it was not passed in
                popupWindow = PopupHandler.openSizedPopup(urlNavigate, popupName);
            }

            // Popup will be null if popups are blocked
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
            this.browserStorage.removeItem(this.browserStorage.generateCacheKey(TemporaryCacheKeys.INTERACTION_STATUS_KEY));
            throw BrowserAuthError.createPopupWindowError(e.toString());
        }
    }

    static openSizedPopup(urlNavigate: string, popupName: string): Window|null {
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
        const left = Math.max(0, ((width / 2) - (BrowserConstants.POPUP_WIDTH / 2)) + winLeft);
        const top = Math.max(0, ((height / 2) - (BrowserConstants.POPUP_HEIGHT / 2)) + winTop);

        return window.open(urlNavigate, popupName, "width=" + BrowserConstants.POPUP_WIDTH + ", height=" + BrowserConstants.POPUP_HEIGHT + ", top=" + top + ", left=" + left);
    }

    /**
     * Event callback to unload main window.
     */
    unloadWindow(e: Event): void {
        this.browserStorage.cleanRequestByInteractionType(InteractionType.Popup);
        if (this.currentWindow) {
            this.currentWindow.close();
        }
        // Guarantees browser unload will happen, so no other errors will be thrown.
        e.preventDefault();
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
        this.browserStorage.removeItem(this.browserStorage.generateCacheKey(TemporaryCacheKeys.INTERACTION_STATUS_KEY));
    }

    /**
     * Generates the name for the popup based on the client id and request
     * @param clientId 
     * @param request 
     */
    static generatePopupName(clientId: string, request: AuthorizationUrlRequest): string {
        return `msal.${clientId}.${request.scopes.join("-")}.${request.authority}.${request.correlationId}`;
    }
}
