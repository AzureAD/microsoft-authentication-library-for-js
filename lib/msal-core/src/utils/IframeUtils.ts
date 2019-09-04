import { ClientAuthError } from "../error/ClientAuthError";
import { UrlUtils } from "./UrlUtils";
import { Logger } from "../Logger";

export class IframeUtils {
    private static POLLING_INTERAL_MS = 50;

    /**
     * @hidden
     * Checks if the current page is running in an iframe.
     * @ignore
     */
    static isInIframe() {
        return window.parent !== window;
    }

    /**
     * @hidden
     * Monitors a window until it loads a url with a hash
     * @ignore
     */
    static monitorWindowForHash(contentWindow: Window, timeout: number): Promise<string> {
        return new Promise((resolve, reject) => {
            const maxTicks = timeout / IframeUtils.POLLING_INTERAL_MS;
            let ticks = 0;

            const intervalId = setInterval(() => {
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

                // Only start clock when we are on same domain
                ticks++;

                if (contentWindow.closed) {
                    clearInterval(intervalId);
                } else if (UrlUtils.urlContainsHash(href)) {
                    clearInterval(intervalId);
                    resolve(contentWindow.location.hash);
                } else if (ticks > maxTicks) {
                    clearInterval(intervalId);
                    reject(ClientAuthError.createTokenRenewalTimeoutError()); // better error?
                }
            }, IframeUtils.POLLING_INTERAL_MS);
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
        const frameCheck = frameName;

        return new Promise((resolve) => {
            setTimeout(() => {
                const frameHandle = IframeUtils.addHiddenIFrame(frameCheck, logger);
                if (frameHandle.src === "" || frameHandle.src === "about:blank") {
                    frameHandle.src = urlNavigate;
                    logger.infoPii("Frame Name : " + frameName + " Navigated to: " + urlNavigate);
                }

                resolve(frameHandle);
            }, timeoutMs);
        });
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
}
