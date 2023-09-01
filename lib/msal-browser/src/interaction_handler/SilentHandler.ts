/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    UrlString,
    CommonAuthorizationCodeRequest,
    AuthorizationCodeClient,
    Constants,
    Logger,
    IPerformanceClient,
    PerformanceEvents,
} from "@azure/msal-common";
import { InteractionHandler } from "./InteractionHandler";
import {
    createBrowserAuthError,
    BrowserAuthErrorCodes,
} from "../error/BrowserAuthError";
import { BrowserCacheManager } from "../cache/BrowserCacheManager";
import {
    BrowserSystemOptions,
    DEFAULT_IFRAME_TIMEOUT_MS,
} from "../config/Configuration";

export class SilentHandler extends InteractionHandler {
    private navigateFrameWait: number;
    private pollIntervalMilliseconds: number;

    constructor(
        authCodeModule: AuthorizationCodeClient,
        storageImpl: BrowserCacheManager,
        authCodeRequest: CommonAuthorizationCodeRequest,
        logger: Logger,
        systemOptions: Required<
            Pick<
                BrowserSystemOptions,
                "navigateFrameWait" | "pollIntervalMilliseconds"
            >
        >,
        performanceClient: IPerformanceClient
    ) {
        super(
            authCodeModule,
            storageImpl,
            authCodeRequest,
            logger,
            performanceClient
        );
        this.navigateFrameWait = systemOptions.navigateFrameWait;
        this.pollIntervalMilliseconds = systemOptions.pollIntervalMilliseconds;
    }

    /**
     * Creates a hidden iframe to given URL using user-requested scopes as an id.
     * @param urlNavigate
     * @param userRequestScopes
     */
    async initiateAuthRequest(requestUrl: string): Promise<HTMLIFrameElement> {
        this.performanceClient.addQueueMeasurement(
            PerformanceEvents.SilentHandlerInitiateAuthRequest,
            this.authCodeRequest.correlationId
        );

        if (!requestUrl) {
            // Throw error if request URL is empty.
            this.logger.info("Navigate url is empty");
            throw createBrowserAuthError(
                BrowserAuthErrorCodes.emptyNavigateUri
            );
        }

        if (this.navigateFrameWait) {
            this.performanceClient.setPreQueueTime(
                PerformanceEvents.SilentHandlerLoadFrame,
                this.authCodeRequest.correlationId
            );
            return await this.loadFrame(requestUrl);
        }
        return this.loadFrameSync(requestUrl);
    }

    /**
     * Monitors an iframe content window until it loads a url with a known hash, or hits a specified timeout.
     * @param iframe
     * @param timeout
     */
    monitorIframeForHash(
        iframe: HTMLIFrameElement,
        timeout: number
    ): Promise<string> {
        this.performanceClient.addQueueMeasurement(
            PerformanceEvents.SilentHandlerMonitorIframeForHash,
            this.authCodeRequest.correlationId
        );

        return new Promise((resolve, reject) => {
            if (timeout < DEFAULT_IFRAME_TIMEOUT_MS) {
                this.logger.warning(
                    `system.loadFrameTimeout or system.iframeHashTimeout set to lower (${timeout}ms) than the default (${DEFAULT_IFRAME_TIMEOUT_MS}ms). This may result in timeouts.`
                );
            }

            /*
             * Polling for iframes can be purely timing based,
             * since we don't need to account for interaction.
             */
            const nowMark = window.performance.now();
            const timeoutMark = nowMark + timeout;

            const intervalId = setInterval(() => {
                if (window.performance.now() > timeoutMark) {
                    this.removeHiddenIframe(iframe);
                    clearInterval(intervalId);
                    reject(
                        createBrowserAuthError(
                            BrowserAuthErrorCodes.monitorWindowTimeout
                        )
                    );
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
                    href = contentWindow
                        ? contentWindow.location.href
                        : Constants.EMPTY_STRING;
                } catch (e) {}

                if (!href || href === "about:blank") {
                    return;
                }

                const contentHash = contentWindow
                    ? contentWindow.location.hash
                    : Constants.EMPTY_STRING;
                if (contentHash) {
                    if (UrlString.hashContainsKnownProperties(contentHash)) {
                        // Success case
                        this.removeHiddenIframe(iframe);
                        clearInterval(intervalId);
                        resolve(contentHash);
                        return;
                    } else {
                        // Hash is present but incorrect
                        this.logger.error(
                            "SilentHandler:monitorIFrameForHash - a hash is present in the iframe but it does not contain known properties. It's likely that the hash has been replaced by code running on the redirectUri page."
                        );
                        this.logger.errorPii(
                            `SilentHandler:monitorIFrameForHash - the url detected in the iframe is: ${href}`
                        );
                        this.removeHiddenIframe(iframe);
                        clearInterval(intervalId);
                        reject(
                            createBrowserAuthError(
                                BrowserAuthErrorCodes.hashDoesNotContainKnownProperties
                            )
                        );
                        return;
                    }
                } else {
                    // No hash is present
                    this.logger.error(
                        "SilentHandler:monitorIFrameForHash - the request has returned to the redirectUri but a hash is not present in the iframe. It's likely that the hash has been removed or the page has been redirected by code running on the redirectUri page."
                    );
                    this.logger.errorPii(
                        `SilentHandler:monitorIFrameForHash - the url detected in the iframe is: ${href}`
                    );
                    this.removeHiddenIframe(iframe);
                    clearInterval(intervalId);
                    reject(
                        createBrowserAuthError(
                            BrowserAuthErrorCodes.hashEmptyError
                        )
                    );
                    return;
                }
            }, this.pollIntervalMilliseconds);
        });
    }

    /**
     * @hidden
     * Loads iframe with authorization endpoint URL
     * @ignore
     */
    private loadFrame(urlNavigate: string): Promise<HTMLIFrameElement> {
        this.performanceClient.addQueueMeasurement(
            PerformanceEvents.SilentHandlerLoadFrame,
            this.authCodeRequest.correlationId
        );

        /*
         * This trick overcomes iframe navigation in IE
         * IE does not load the page consistently in iframe
         */

        return new Promise((resolve, reject) => {
            const frameHandle = this.createHiddenIframe();

            setTimeout(() => {
                if (!frameHandle) {
                    reject("Unable to load iframe");
                    return;
                }

                frameHandle.src = urlNavigate;

                resolve(frameHandle);
            }, this.navigateFrameWait);
        });
    }

    /**
     * @hidden
     * Loads the iframe synchronously when the navigateTimeFrame is set to `0`
     * @param urlNavigate
     * @param frameName
     * @param logger
     */
    private loadFrameSync(urlNavigate: string): HTMLIFrameElement {
        const frameHandle = this.createHiddenIframe();

        frameHandle.src = urlNavigate;

        return frameHandle;
    }

    /**
     * @hidden
     * Creates a new hidden iframe or gets an existing one for silent token renewal.
     * @ignore
     */
    private createHiddenIframe(): HTMLIFrameElement {
        const authFrame = document.createElement("iframe");

        authFrame.style.visibility = "hidden";
        authFrame.style.position = "absolute";
        authFrame.style.width = authFrame.style.height = "0";
        authFrame.style.border = "0";
        authFrame.setAttribute(
            "sandbox",
            "allow-scripts allow-same-origin allow-forms"
        );
        document.getElementsByTagName("body")[0].appendChild(authFrame);

        return authFrame;
    }

    /**
     * @hidden
     * Removes a hidden iframe from the page.
     * @ignore
     */
    private removeHiddenIframe(iframe: HTMLIFrameElement): void {
        if (document.body === iframe.parentNode) {
            document.body.removeChild(iframe);
        }
    }
}
