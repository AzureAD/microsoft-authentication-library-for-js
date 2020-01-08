/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { InteractionHandler } from "./InteractionHandler";
import { BrowserAuthError } from "../error/BrowserAuthError";
import { TemporaryCacheKeys, UrlString, StringUtils, Constants, AuthorizationCodeModule, TokenResponse } from "msal-common";
import { BrowserConstants } from "../utils/BrowserConstants";
import { BrowserStorage } from "../cache/BrowserStorage";

export class PopupHandler extends InteractionHandler {

    private currentWindow: Window;

    showUI(requestUrl: string): Window {
        this.browserStorage.setItem(BrowserConstants.INTERACTION_STATUS_KEY, BrowserConstants.INTERACTION_IN_PROGRESS);
        const popupWindow = this.openPopup(requestUrl, Constants.LIBRARY_NAME, BrowserConstants.POPUP_WIDTH, BrowserConstants.POPUP_HEIGHT);
        this.currentWindow = popupWindow;
        if (requestUrl && !StringUtils.isEmpty(requestUrl)) {
            this.authModule.logger.infoPii("Navigate to:" + requestUrl);
            return popupWindow;
        } else {
            this.authModule.logger.info("Navigate url is empty");
            throw BrowserAuthError.createEmptyRedirectUriError();
        }
    }

    async handleCodeResponse(locationHash: string): Promise<TokenResponse> {
        if (StringUtils.isEmpty(locationHash)) {
            throw BrowserAuthError.createEmptyHashError(locationHash);
        }

        this.browserStorage.removeItem(BrowserConstants.INTERACTION_STATUS_KEY);
        const codeResponse = this.authModule.handleFragmentResponse(locationHash);
        this.currentWindow.close();
        return this.authModule.acquireToken(null, codeResponse);
    }

    /**
     * Monitors a window until it loads a url with a hash
     * @param contentWindow 
     * @param timeout 
     * @param urlNavigate 
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
                    reject(BrowserAuthError.createTokenRenewalTimeoutError(urlNavigate)); // better error?
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
    private openPopup(urlNavigate: string, title: string, popUpWidth: number, popUpHeight: number) {
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
