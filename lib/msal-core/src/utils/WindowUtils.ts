import { ClientAuthError } from "../error/ClientAuthError";
import { UrlUtils } from "./UrlUtils";
import { Logger } from "../Logger";
import { AuthCache } from "../cache/AuthCache";
import { TemporaryCacheKeys, Constants } from "../utils/Constants";

export class WindowUtils {
    /**
     * @hidden
     * Interval in milliseconds that we poll a window
     * @ignore
     */
    private static POLLING_INTERVAL_MS = 50;

    /**
     * @hidden
     * Checks if the current page is running in an iframe.
     * @ignore
     */
    static isInIframe(): boolean {
        return window.parent !== window;
    }

    /**
     * @hidden
     * Check if the current page is running in a popup.
     * @ignore
     */
    static isInPopup(): boolean {
        return !!(window.opener && window.opener !== window);
    }

    /**
     * @hidden
     * Monitors a window until it loads a url with a hash
     * @ignore
     */
    static monitorWindowForHash(contentWindow: Window, timeout: number, urlNavigate: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const maxTicks = timeout / WindowUtils.POLLING_INTERVAL_MS;
            let ticks = 0;

            const intervalId = setInterval(() => {
                if (contentWindow.closed) {
                    clearInterval(intervalId);
                    reject(ClientAuthError.createUserCancelledError());
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

                if (UrlUtils.urlContainsHash(href)) {
                    clearInterval(intervalId);
                    resolve(contentWindow.location.hash);
                } else if (ticks > maxTicks) {
                    clearInterval(intervalId);
                    reject(ClientAuthError.createTokenRenewalTimeoutError(urlNavigate)); // better error?
                }
            }, WindowUtils.POLLING_INTERVAL_MS);
        });
    }

    /**
     * @hidden
     * Loads iframe with authorization endpoint URL
     * @ignore
     */
    static loadFrame(urlNavigate: string, frameName: string, timeoutMs: number, logger: Logger): Promise<HTMLIFrameElement> {
        /*
         * This trick overcomes iframe navigation in IE
         * IE does not load the page consistently in iframe
         */
        logger.info("LoadFrame: " + frameName);

        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const frameHandle = this.loadFrameSync(urlNavigate, frameName, logger);

                if (!frameHandle) {
                    reject(`Unable to load iframe with name: ${frameName}`);
                    return;
                }

                resolve(frameHandle);
            }, timeoutMs);
        });
    }

    /**
     * @hidden
     * Loads the iframe synchronously when the navigateTimeFrame is set to `0`
     * @param urlNavigate
     * @param frameName
     * @param logger
     */
    static loadFrameSync(urlNavigate: string, frameName: string, logger: Logger): HTMLIFrameElement{
        const frameHandle = WindowUtils.addHiddenIFrame(frameName, logger);

        // returning to handle null in loadFrame, also to avoid null object access errors
        if (!frameHandle) {
            return null;
        }
        else if (frameHandle.src === "" || frameHandle.src === "about:blank") {
            frameHandle.src = urlNavigate;
            logger.infoPii("Frame Name : " + frameName + " Navigated to: " + urlNavigate);
        }

        return frameHandle;
    }

    /**
     * @hidden
     * Adds the hidden iframe for silent token renewal.
     * @ignore
     */
    static addHiddenIFrame(iframeId: string, logger: Logger): HTMLIFrameElement {
        if (typeof iframeId === "undefined") {
            return null;
        }

        logger.info("Add msal frame to document:" + iframeId);
        let adalFrame = document.getElementById(iframeId) as HTMLIFrameElement;
        if (!adalFrame) {
            if (document.createElement &&
        document.documentElement &&
        (window.navigator.userAgent.indexOf("MSIE 5.0") === -1)) {
                const ifr = document.createElement("iframe");
                ifr.setAttribute("id", iframeId);
                ifr.style.visibility = "hidden";
                ifr.style.position = "absolute";
                ifr.style.width = ifr.style.height = "0";
                ifr.style.border = "0";
                ifr.setAttribute("sandbox", "allow-scripts allow-same-origin allow-forms");
                adalFrame = (document.getElementsByTagName("body")[0].appendChild(ifr) as HTMLIFrameElement);
            } else if (document.body && document.body.insertAdjacentHTML) {
                document.body.insertAdjacentHTML("beforeend", "<iframe name='" + iframeId + "' id='" + iframeId + "' style='display:none'></iframe>");
            }

            if (window.frames && window.frames[iframeId]) {
                adalFrame = window.frames[iframeId];
            }
        }

        return adalFrame;
    }

    /**
     * @hidden
     * Removes a hidden iframe from the page.
     * @ignore
     */
    static removeHiddenIframe(iframe: HTMLIFrameElement) {
        if (document.body !== iframe.parentNode) {
            document.body.removeChild(iframe);
        }
    }

    /**
     * @hidden
     * Find and return the iframe element with the given hash
     * @ignore
     */
    static getIframeWithHash(hash: string): HTMLIFrameElement {
        const iframes = document.getElementsByTagName("iframe");
        const iframeArray: Array<HTMLIFrameElement> = Array.apply(null, Array(iframes.length)).map((iframe: HTMLIFrameElement, index: number) => iframes.item(index)); // eslint-disable-line prefer-spread

        return iframeArray.filter((iframe: HTMLIFrameElement) => {
            try {
                return iframe.contentWindow.location.hash === hash;
            } catch (e) {
                return false;
            }
        })[0];
    }

    /**
     * @hidden
     * Returns an array of all the popups opened by MSAL
     * @ignore
     */
    static getPopups(): Array<Window> {
        if (!window.openedWindows) {
            window.openedWindows = [];
        }

        return window.openedWindows;
    }

    /**
     * @hidden
     * Find and return the popup with the given hash
     * @ignore
     */
    static getPopUpWithHash(hash: string): Window {
        return WindowUtils.getPopups().filter(popup => {
            try {
                return popup.location.hash === hash;
            } catch (e) {
                return false;
            }
        })[0];
    }

    /**
     * @hidden
     * Add the popup to the known list of popups
     * @ignore
     */
    static trackPopup(popup: Window): void {
        WindowUtils.getPopups().push(popup);
    }

    /**
     * @hidden
     * Close all popups
     * @ignore
     */
    static closePopups(): void {
        WindowUtils.getPopups().forEach(popup => popup.close());
    }

    /**
     * @ignore
     *
     * blocks any login/acquireToken calls to reload from within a hidden iframe (generated for silent calls)
     */
    static blockReloadInHiddenIframes() {
        // return an error if called from the hidden iframe created by the msal js silent calls
        if (UrlUtils.urlContainsHash(window.location.hash) && WindowUtils.isInIframe()) {
            throw ClientAuthError.createBlockTokenRequestsInHiddenIframeError();
        }
    }

    /**
     *
     * @param cacheStorage
     */
    static checkIfBackButtonIsPressed(cacheStorage: AuthCache) {
        const redirectCache = cacheStorage.getItem(TemporaryCacheKeys.REDIRECT_REQUEST);

        // if redirect request is set and there is no hash
        if(redirectCache && !UrlUtils.urlContainsHash(window.location.hash)) {
            const splitCache = redirectCache.split(Constants.resourceDelimiter);
            const state = splitCache.length > 1 ? splitCache[splitCache.length-1]: null;
            cacheStorage.resetTempCacheItems(state);
        }
    }
}
