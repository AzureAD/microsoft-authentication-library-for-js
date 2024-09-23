/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    NativeConstants,
    NativeExtensionMethod,
} from "../../utils/BrowserConstants.js";
import {
    Logger,
    AuthError,
    createAuthError,
    AuthErrorCodes,
    AuthenticationScheme,
    InProgressPerformanceEvent,
    PerformanceEvents,
    IPerformanceClient,
} from "@azure/msal-common/browser";
import {
    NativeExtensionRequest,
    NativeExtensionRequestBody,
} from "./NativeRequest.js";
import { createNativeAuthError } from "../../error/NativeAuthError.js";
import {
    createBrowserAuthError,
    BrowserAuthErrorCodes,
} from "../../error/BrowserAuthError.js";
import { BrowserConfiguration } from "../../config/Configuration.js";
import { createNewGuid } from "../../crypto/BrowserCrypto.js";

type ResponseResolvers<T> = {
    resolve: (value: T | PromiseLike<T>) => void;
    reject: (
        value: AuthError | Error | PromiseLike<Error> | PromiseLike<AuthError>
    ) => void;
};

export class NativeMessageHandler {
    private extensionId: string | undefined;
    private extensionVersion: string | undefined;
    private logger: Logger;
    private readonly handshakeTimeoutMs: number;
    private timeoutId: number | undefined;
    private resolvers: Map<string, ResponseResolvers<object>>;
    private handshakeResolvers: Map<string, ResponseResolvers<void>>;
    private messageChannel: MessageChannel;
    private readonly windowListener: (event: MessageEvent) => void;
    private readonly performanceClient: IPerformanceClient;
    private readonly handshakeEvent: InProgressPerformanceEvent;

    constructor(
        logger: Logger,
        handshakeTimeoutMs: number,
        performanceClient: IPerformanceClient,
        extensionId?: string
    ) {
        this.logger = logger;
        this.handshakeTimeoutMs = handshakeTimeoutMs;
        this.extensionId = extensionId;
        this.resolvers = new Map(); // Used for non-handshake messages
        this.handshakeResolvers = new Map(); // Used for handshake messages
        this.messageChannel = new MessageChannel();
        this.windowListener = this.onWindowMessage.bind(this); // Window event callback doesn't have access to 'this' unless it's bound
        this.performanceClient = performanceClient;
        this.handshakeEvent = performanceClient.startMeasurement(
            PerformanceEvents.NativeMessageHandlerHandshake
        );
    }

    /**
     * Sends a given message to the extension and resolves with the extension response
     * @param body
     */
    async sendMessage(body: NativeExtensionRequestBody): Promise<object> {
        this.logger.trace("NativeMessageHandler - sendMessage called.");
        const req: NativeExtensionRequest = {
            channel: NativeConstants.CHANNEL_ID,
            extensionId: this.extensionId,
            responseId: createNewGuid(),
            body: body,
        };

        this.logger.trace(
            "NativeMessageHandler - Sending request to browser extension"
        );
        this.logger.tracePii(
            `NativeMessageHandler - Sending request to browser extension: ${JSON.stringify(
                req
            )}`
        );
        this.messageChannel.port1.postMessage(req);

        return new Promise((resolve, reject) => {
            this.resolvers.set(req.responseId, { resolve, reject });
        });
    }

    /**
     * Returns an instance of the MessageHandler that has successfully established a connection with an extension
     * @param {Logger} logger
     * @param {number} handshakeTimeoutMs
     * @param {IPerformanceClient} performanceClient
     * @param {ICrypto} crypto
     */
    static async createProvider(
        logger: Logger,
        handshakeTimeoutMs: number,
        performanceClient: IPerformanceClient
    ): Promise<NativeMessageHandler> {
        logger.trace("NativeMessageHandler - createProvider called.");
        try {
            const preferredProvider = new NativeMessageHandler(
                logger,
                handshakeTimeoutMs,
                performanceClient,
                NativeConstants.PREFERRED_EXTENSION_ID
            );
            await preferredProvider.sendHandshakeRequest();
            return preferredProvider;
        } catch (e) {
            // If preferred extension fails for whatever reason, fallback to using any installed extension
            const backupProvider = new NativeMessageHandler(
                logger,
                handshakeTimeoutMs,
                performanceClient
            );
            await backupProvider.sendHandshakeRequest();
            return backupProvider;
        }
    }

    /**
     * Send handshake request helper.
     */
    private async sendHandshakeRequest(): Promise<void> {
        this.logger.trace(
            "NativeMessageHandler - sendHandshakeRequest called."
        );
        // Register this event listener before sending handshake
        window.addEventListener("message", this.windowListener, false); // false is important, because content script message processing should work first

        const req: NativeExtensionRequest = {
            channel: NativeConstants.CHANNEL_ID,
            extensionId: this.extensionId,
            responseId: createNewGuid(),
            body: {
                method: NativeExtensionMethod.HandshakeRequest,
            },
        };
        this.handshakeEvent.add({
            extensionId: this.extensionId,
            extensionHandshakeTimeoutMs: this.handshakeTimeoutMs,
        });

        this.messageChannel.port1.onmessage = (event) => {
            this.onChannelMessage(event);
        };

        window.postMessage(req, window.origin, [this.messageChannel.port2]);

        return new Promise((resolve, reject) => {
            this.handshakeResolvers.set(req.responseId, { resolve, reject });
            this.timeoutId = window.setTimeout(() => {
                /*
                 * Throw an error if neither HandshakeResponse nor original Handshake request are received in a reasonable timeframe.
                 * This typically suggests an event handler stopped propagation of the Handshake request but did not respond to it on the MessageChannel port
                 */
                window.removeEventListener(
                    "message",
                    this.windowListener,
                    false
                );
                this.messageChannel.port1.close();
                this.messageChannel.port2.close();
                this.handshakeEvent.end({
                    extensionHandshakeTimedOut: true,
                    success: false,
                });
                reject(
                    createBrowserAuthError(
                        BrowserAuthErrorCodes.nativeHandshakeTimeout
                    )
                );
                this.handshakeResolvers.delete(req.responseId);
            }, this.handshakeTimeoutMs); // Use a reasonable timeout in milliseconds here
        });
    }

    /**
     * Invoked when a message is posted to the window. If a handshake request is received it means the extension is not installed.
     * @param event
     */
    private onWindowMessage(event: MessageEvent): void {
        this.logger.trace("NativeMessageHandler - onWindowMessage called");
        // We only accept messages from ourselves
        if (event.source !== window) {
            return;
        }

        const request = event.data;

        if (
            !request.channel ||
            request.channel !== NativeConstants.CHANNEL_ID
        ) {
            return;
        }

        if (request.extensionId && request.extensionId !== this.extensionId) {
            return;
        }

        if (request.body.method === NativeExtensionMethod.HandshakeRequest) {
            const handshakeResolver = this.handshakeResolvers.get(
                request.responseId
            );
            /*
             * Filter out responses with no matched resolvers sooner to keep channel ports open while waiting for
             * the proper response.
             */
            if (!handshakeResolver) {
                this.logger.trace(
                    `NativeMessageHandler.onWindowMessage - resolver can't be found for request ${request.responseId}`
                );
                return;
            }

            // If we receive this message back it means no extension intercepted the request, meaning no extension supporting handshake protocol is installed
            this.logger.verbose(
                request.extensionId
                    ? `Extension with id: ${request.extensionId} not installed`
                    : "No extension installed"
            );
            clearTimeout(this.timeoutId);
            this.messageChannel.port1.close();
            this.messageChannel.port2.close();
            window.removeEventListener("message", this.windowListener, false);
            this.handshakeEvent.end({
                success: false,
                extensionInstalled: false,
            });
            handshakeResolver.reject(
                createBrowserAuthError(
                    BrowserAuthErrorCodes.nativeExtensionNotInstalled
                )
            );
        }
    }

    /**
     * Invoked when a message is received from the extension on the MessageChannel port
     * @param event
     */
    private onChannelMessage(event: MessageEvent): void {
        this.logger.trace("NativeMessageHandler - onChannelMessage called.");
        const request = event.data;

        const resolver = this.resolvers.get(request.responseId);
        const handshakeResolver = this.handshakeResolvers.get(
            request.responseId
        );

        try {
            const method = request.body.method;

            if (method === NativeExtensionMethod.Response) {
                if (!resolver) {
                    return;
                }
                const response = request.body.response;
                this.logger.trace(
                    "NativeMessageHandler - Received response from browser extension"
                );
                this.logger.tracePii(
                    `NativeMessageHandler - Received response from browser extension: ${JSON.stringify(
                        response
                    )}`
                );
                if (response.status !== "Success") {
                    resolver.reject(
                        createNativeAuthError(
                            response.code,
                            response.description,
                            response.ext
                        )
                    );
                } else if (response.result) {
                    if (
                        response.result["code"] &&
                        response.result["description"]
                    ) {
                        resolver.reject(
                            createNativeAuthError(
                                response.result["code"],
                                response.result["description"],
                                response.result["ext"]
                            )
                        );
                    } else {
                        resolver.resolve(response.result);
                    }
                } else {
                    throw createAuthError(
                        AuthErrorCodes.unexpectedError,
                        "Event does not contain result."
                    );
                }
                this.resolvers.delete(request.responseId);
            } else if (method === NativeExtensionMethod.HandshakeResponse) {
                if (!handshakeResolver) {
                    this.logger.trace(
                        `NativeMessageHandler.onChannelMessage - resolver can't be found for request ${request.responseId}`
                    );
                    return;
                }
                clearTimeout(this.timeoutId); // Clear setTimeout
                window.removeEventListener(
                    "message",
                    this.windowListener,
                    false
                ); // Remove 'No extension' listener
                this.extensionId = request.extensionId;
                this.extensionVersion = request.body.version;
                this.logger.verbose(
                    `NativeMessageHandler - Received HandshakeResponse from extension: ${this.extensionId}`
                );
                this.handshakeEvent.end({
                    extensionInstalled: true,
                    success: true,
                });

                handshakeResolver.resolve();
                this.handshakeResolvers.delete(request.responseId);
            }
            // Do nothing if method is not Response or HandshakeResponse
        } catch (err) {
            this.logger.error("Error parsing response from WAM Extension");
            this.logger.errorPii(
                `Error parsing response from WAM Extension: ${err as string}`
            );
            this.logger.errorPii(`Unable to parse ${event}`);

            if (resolver) {
                resolver.reject(err as AuthError);
            } else if (handshakeResolver) {
                handshakeResolver.reject(err as AuthError);
            }
        }
    }

    /**
     * Returns the Id for the browser extension this handler is communicating with
     * @returns
     */
    getExtensionId(): string | undefined {
        return this.extensionId;
    }

    /**
     * Returns the version for the browser extension this handler is communicating with
     * @returns
     */
    getExtensionVersion(): string | undefined {
        return this.extensionVersion;
    }

    /**
     * Returns boolean indicating whether or not the request should attempt to use native broker
     * @param logger
     * @param config
     * @param nativeExtensionProvider
     * @param authenticationScheme
     */
    static isNativeAvailable(
        config: BrowserConfiguration,
        logger: Logger,
        nativeExtensionProvider?: NativeMessageHandler,
        authenticationScheme?: AuthenticationScheme
    ): boolean {
        logger.trace("isNativeAvailable called");
        if (!config.system.allowNativeBroker) {
            logger.trace(
                "isNativeAvailable: allowNativeBroker is not enabled, returning false"
            );
            // Developer disabled WAM
            return false;
        }

        if (!nativeExtensionProvider) {
            logger.trace(
                "isNativeAvailable: WAM extension provider is not initialized, returning false"
            );
            // Extension is not available
            return false;
        }

        if (authenticationScheme) {
            switch (authenticationScheme) {
                case AuthenticationScheme.BEARER:
                case AuthenticationScheme.POP:
                    logger.trace(
                        "isNativeAvailable: authenticationScheme is supported, returning true"
                    );
                    return true;
                default:
                    logger.trace(
                        "isNativeAvailable: authenticationScheme is not supported, returning false"
                    );
                    return false;
            }
        }

        return true;
    }
}
