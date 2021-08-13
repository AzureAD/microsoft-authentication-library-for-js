/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CommonEndSessionRequest, Constants, Logger, StringUtils } from "@azure/msal-common";
import { BrowserCacheManager } from "../cache/BrowserCacheManager";
import { BrowserAuthError } from "../error/BrowserAuthError";
import { AuthorizationUrlRequest } from "../request/AuthorizationUrlRequest";
import { BrowserConstants, InteractionType, TemporaryCacheKeys } from "./BrowserConstants";

/**
 * Popup configurations for setting dimensions and position of popup window
 */
export type PopupWindowAttributes = {
    popupSize?: PopupSize,
    popupPosition?: PopupPosition
};

export type PopupSize = {
    height: number;
    width: number;
};

export type PopupPosition = {
    top: number;
    left: number;
};

export class PopupUtils {
    private browserStorage: BrowserCacheManager;
    private logger: Logger;
    private currentWindow: Window|undefined;

    constructor(storageImpl: BrowserCacheManager, logger: Logger) {
        this.browserStorage = storageImpl;
        this.logger = logger;

        // Properly sets this reference for the unload event.
        this.unloadWindow = this.unloadWindow.bind(this);
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
     * @param popupWindowAttributes
     * @ignore
     * @hidden
     */
    openPopup(urlNavigate: string, popupName: string, popupWindowAttributes: PopupWindowAttributes, popup?: Window|null): Window {
        try {
            let popupWindow;
            // Popup window passed in, setting url to navigate to
            if (popup) {
                popupWindow = popup;
                this.logger.verbosePii(`Navigating popup window to: ${urlNavigate}`);
                popupWindow.location.assign(urlNavigate);
            } else if (typeof popup === "undefined") {
                // Popup will be undefined if it was not passed in
                this.logger.verbosePii(`Opening popup window to: ${urlNavigate}`);
                popupWindow = PopupUtils.openSizedPopup(urlNavigate, popupName, popupWindowAttributes);
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
            this.logger.error("error opening popup " + e.message);
            this.browserStorage.removeItem(this.browserStorage.generateCacheKey(TemporaryCacheKeys.INTERACTION_STATUS_KEY));
            throw BrowserAuthError.createPopupWindowError(e.toString());
        }
    }

    /**
     * Helper function to set popup window dimensions and position
     * @param urlNavigate 
     * @param popupName 
     * @param popupWindowAttributes 
     * @returns 
     */
    static openSizedPopup(urlNavigate: string, popupName: string, popupWindowAttributes: PopupWindowAttributes): Window|null {
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
        const winWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
        const winHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;

        if (popupWindowAttributes.popupPosition) {
            if (popupWindowAttributes.popupPosition.top < 0 || popupWindowAttributes.popupPosition.top > winHeight || popupWindowAttributes.popupPosition.left < 0 || popupWindowAttributes.popupPosition.top > winWidth) {
                throw BrowserAuthError.createPopupWindowAttributeError("Invalid popup window position. Popup window should not be positioned off-screen.");
            }
        }

        if (popupWindowAttributes.popupSize) {
            if (popupWindowAttributes.popupSize.height < 0 || popupWindowAttributes.popupSize.height > winHeight || popupWindowAttributes.popupSize.width < 0 || popupWindowAttributes.popupSize.width > winWidth) {
                throw BrowserAuthError.createPopupWindowAttributeError("Invalid popup window size. Popup window should be smaller than parent window.");
            }
        }

        const validHeight = popupWindowAttributes.popupSize?.height || BrowserConstants.POPUP_HEIGHT;
        const validWidth = popupWindowAttributes.popupSize?.width || BrowserConstants.POPUP_WIDTH;
        const validTop = popupWindowAttributes.popupPosition?.top || Math.max(0, ((winHeight / 2) - (BrowserConstants.POPUP_HEIGHT / 2)) + winTop);
        const validLeft = popupWindowAttributes.popupPosition?.left || Math.max(0, ((winWidth / 2) - (BrowserConstants.POPUP_WIDTH / 2)) + winLeft);

        return window.open(urlNavigate, popupName, `width=${validWidth}, height=${validHeight}, top=${validTop}, left=${validLeft}, scrollbars=yes`);
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
    cleanPopup(popupWindow?: Window): void {
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
     * Monitors a window until it loads a url with the same origin.
     * @param popupWindow - window that is being monitored
     */
    monitorPopupForSameOrigin(popupWindow: Window): Promise<void> {
        return new Promise((resolve, reject) => {
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

                clearInterval(intervalId);
                resolve();
            }, BrowserConstants.POLL_INTERVAL_MS);
        });
    }

    /**
     * Generates the name for the popup based on the client id and request
     * @param clientId
     * @param request
     */
    static generatePopupName(clientId: string, request: AuthorizationUrlRequest): string {
        return `${BrowserConstants.POPUP_NAME_PREFIX}.${clientId}.${request.scopes.join("-")}.${request.authority}.${request.correlationId}`;
    }

    /**
     * Generates the name for the popup based on the client id and request for logouts
     * @param clientId 
     * @param request 
     */
    static generateLogoutPopupName(clientId: string, request: CommonEndSessionRequest): string {
        const homeAccountId = request.account && request.account.homeAccountId;
        return `${BrowserConstants.POPUP_NAME_PREFIX}.${clientId}.${homeAccountId}.${request.correlationId}`;
    }
}
