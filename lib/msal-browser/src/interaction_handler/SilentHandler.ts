/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { UrlString, StringUtils, AuthorizationCodeRequest, AuthorizationCodeClient, Constants } from "@azure/msal-common";
import { InteractionHandler } from "./InteractionHandler";
import { BrowserConstants } from "../utils/BrowserConstants";
import { BrowserAuthError } from "../error/BrowserAuthError";
import { BrowserCacheManager } from "../cache/BrowserCacheManager";
import { DEFAULT_IFRAME_TIMEOUT_MS } from "../config/Configuration";
import { FrameUtils } from "./FrameUtils";

export class SilentHandler extends InteractionHandler {

    private navigateFrameWait: number;
    constructor(authCodeModule: AuthorizationCodeClient, storageImpl: BrowserCacheManager, authCodeRequest: AuthorizationCodeRequest, navigateFrameWait: number) {
        super(authCodeModule, storageImpl, authCodeRequest);
        this.navigateFrameWait = navigateFrameWait;
    }

    /**
     * Creates a hidden iframe to given URL using user-requested scopes as an id.
     * @param urlNavigate 
     * @param userRequestScopes
     */
    async initiateAuthRequest(requestUrl: string): Promise<HTMLIFrameElement> {
        if (StringUtils.isEmpty(requestUrl)) {
            // Throw error if request URL is empty.
            this.authModule.logger.info("Navigate url is empty");
            throw BrowserAuthError.createEmptyNavigationUriError();
        }

        return this.navigateFrameWait ? await FrameUtils.loadFrame(requestUrl, this.navigateFrameWait) : FrameUtils.loadFrameSync(requestUrl);
    }

    /**
     * Monitors an iframe content window until it loads a url with a known hash, or hits a specified timeout.
     * @param iframe 
     * @param timeout 
     */
    monitorIframeForHash(iframe: HTMLIFrameElement, timeout: number): Promise<string> {
        return new Promise((resolve, reject) => {
            if (timeout < DEFAULT_IFRAME_TIMEOUT_MS) {
                this.authModule.logger.warning(`system.loadFrameTimeout or system.iframeHashTimeout set to lower (${timeout}ms) than the default (${DEFAULT_IFRAME_TIMEOUT_MS}ms). This may result in timeouts.`);
            }

            /*
             * Polling for iframes can be purely timing based,
             * since we don't need to account for interaction.
             */
            const nowMark = window.performance.now();
            const timeoutMark = nowMark + timeout;

            const intervalId = setInterval(() => {
                if (window.performance.now() > timeoutMark) {
                    FrameUtils.removeHiddenIframe(iframe);
                    clearInterval(intervalId);
                    reject(BrowserAuthError.createMonitorIframeTimeoutError());
                    return;
                }

                let href: string = Constants.EMPTY_STRING;
                const contentWindow = iframe.contentWindow;
                try {
                    /*
                     * Will throw if cross origin,
                     * which should be caught and ignored
                     * since we need the interval to keep running while on STS UI.
                     */
                    href = contentWindow ? contentWindow.location.href : Constants.EMPTY_STRING;
                } catch (e) {}

                if (StringUtils.isEmpty(href)) {
                    return;
                }

                const contentHash = contentWindow ? contentWindow.location.hash: Constants.EMPTY_STRING;
                if (UrlString.hashContainsKnownProperties(contentHash)) {
                    // Success case
                    FrameUtils.removeHiddenIframe(iframe);
                    clearInterval(intervalId);
                    resolve(contentHash);
                    return;
                }
            }, BrowserConstants.POLL_INTERVAL_MS);
        });
    }
    
}
