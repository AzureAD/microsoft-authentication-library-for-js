/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { TokenResponse } from "@azure/msal-common";
import { InteractionHandler } from "./InteractionHandler";

export class SilentHandler extends InteractionHandler {

    /**
     * Creates a hidden iframe to given URL.
     * @param urlNavigate 
     */
    initiateAuthRequest(): Window {
        // TODO: Block reload in iframe?
        
        return null;
    }

    /**
     * Handle authorization code response in the window.
     * @param hash 
     */
    async handleCodeResponse(locationHash: string): Promise<TokenResponse> {
        return null;
    }

     /**
     * @hidden
     * Creates a new hidden iframe or gets an existing one for silent token renewal.
     * @ignore
     */
    private getHiddenIframe(iframeId: string): HTMLIFrameElement {
        if (typeof iframeId === "undefined") {
            return null;
        }

        let authFrame = document.getElementById(iframeId) as HTMLIFrameElement;
        if (!authFrame) {
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
                authFrame = (document.getElementsByTagName("body")[0].appendChild(ifr) as HTMLIFrameElement);
            } else if (document.body && document.body.insertAdjacentHTML) {
                document.body.insertAdjacentHTML("beforeend", "<iframe name='" + iframeId + "' id='" + iframeId + "' style='display:none'></iframe>");
            }

            if (window.frames && window.frames[iframeId]) {
                authFrame = window.frames[iframeId];
            }
        }

        return authFrame;
    }

    /**
     * @hidden
     * Removes a hidden iframe from the page.
     * @ignore
     */
    private removeHiddenIframe(iframe: HTMLIFrameElement) {
        if (document.body === iframe.parentNode) {
            document.body.removeChild(iframe);
        }
    }
}
