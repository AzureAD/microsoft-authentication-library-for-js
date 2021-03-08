/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

export class FrameUtils {
    /**
     * @hidden
     * Loads iframe with authorization endpoint URL
     * @ignore
     */
    static loadFrame(urlNavigate: string, navigateFrameWait: number): Promise<HTMLIFrameElement> {
        /*
         * This trick overcomes iframe navigation in IE
         * IE does not load the page consistently in iframe
         */

        return new Promise((resolve, reject) => {
            const frameHandle = FrameUtils.createHiddenIframe();

            setTimeout(() => {
                if (!frameHandle) {
                    reject("Unable to load iframe");
                    return;
                }

                frameHandle.src = urlNavigate;

                resolve(frameHandle);
            }, navigateFrameWait);
        });
    }

    /**
     * @hidden
     * Loads the iframe synchronously when the navigateTimeFrame is set to `0`
     * @param urlNavigate
     * @param frameName
     * @param logger
     */
    static loadFrameSync(urlNavigate: string): HTMLIFrameElement{
        const frameHandle = this.createHiddenIframe();

        frameHandle.src = urlNavigate;

        return frameHandle;
    }

    /**
     * @hidden
     * Creates a new hidden iframe or gets an existing one for silent token renewal.
     * @ignore
     */
    static createHiddenIframe(): HTMLIFrameElement {
        const authFrame = document.createElement("iframe");

        authFrame.style.visibility = "hidden";
        authFrame.style.position = "absolute";
        authFrame.style.width = authFrame.style.height = "0";
        authFrame.style.border = "0";
        authFrame.setAttribute("sandbox", "allow-scripts allow-same-origin allow-forms allow-popups");
        document.getElementsByTagName("body")[0].appendChild(authFrame);

        return authFrame;
    }

    /**
     * @hidden
     * Removes a hidden iframe from the page.
     * @ignore
     */
    static removeHiddenIframe(iframe: HTMLIFrameElement): void {
        if (document.body === iframe.parentNode) {
            document.body.removeChild(iframe);
        }
    }
}
