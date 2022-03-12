/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { WamConstants, WamExtensionMethod } from "../../utils/BrowserConstants";
import { Logger, AuthError } from "@azure/msal-common";
import { WamExtensionRequest, WamExtensionRequestBody } from "./WamRequest";
import { WamAuthError } from "../../error/WamAuthError";
import { BrowserAuthError } from "../../error/BrowserAuthError";

export class WamMessageHandler {
    private extensionId: string | undefined;
    private logger: Logger;
    private responseId: number;
    private timeoutId: number | undefined;
    private resolvers: object;
    private messageChannel: MessageChannel;
    private windowListener: (event: MessageEvent) => void;

    constructor(logger: Logger, extensionId?: string) {
        this.logger = logger;
        this.extensionId = extensionId;
        this.resolvers = {};
        this.responseId = 0;
        this.messageChannel = new MessageChannel();
        this.windowListener = this.onWindowMessage.bind(this); // Window event callback doesn't have access to 'this' unless it's bound
    }

    /**
     * Sends a given message to the extension and resolves with the extension response
     * @param body 
     */
    async sendMessage<T>(body: WamExtensionRequestBody): Promise<T> {
        this.logger.trace("WamMessageHandler - sendMessage called.");
        const req = {
            channel: WamConstants.CHANNEL_ID,
            extensionId: this.extensionId,
            responseId: this.responseId++,

            body: body
        };

        this.logger.trace("WamMessageHandler - Sending request to browser extension");
        this.logger.tracePii(`WamMessageHandler - Sending request to browser extension: ${JSON.stringify(req)}`);
        this.messageChannel.port1.postMessage(req);

        return new Promise((resolve, reject) => {
            this.resolvers[req.responseId] = {resolve, reject};
        });
    }

    /**
     * Returns an instance of the MessageHandler that has successfully established a connection with an extension
     * @param logger 
     */
    static async createProvider(logger: Logger): Promise<WamMessageHandler> {
        logger.trace("WamMessageHandler - createProvider called.");
        try {
            const preferredProvider = new WamMessageHandler(logger, WamConstants.PREFERRED_EXTENSION_ID);
            await preferredProvider.sendHandshakeRequest();
            return preferredProvider;
        } catch (e) {
            // If preferred extension fails for whatever reason, fallback to using any installed extension
            const backupProvider = new WamMessageHandler(logger);
            await backupProvider.sendHandshakeRequest();
            return backupProvider;
        }
    }

    /**
     * Send handshake request helper.
     */
    private async sendHandshakeRequest(): Promise<void> {
        this.logger.trace("WamMessageHandler - sendHandshakeRequest called.");
        // Register this event listener before sending handshake
        window.addEventListener("message", this.windowListener, false); // false is important, because content script message processing should work first

        const req: WamExtensionRequest = {
            channel: WamConstants.CHANNEL_ID,
            extensionId: this.extensionId,
            responseId: this.responseId++,

            body: {
                method: WamExtensionMethod.HandshakeRequest
            }
        };

        this.messageChannel.port1.onmessage = (event) => {
            this.onChannelMessage(event);
        };

        window.postMessage(req, window.origin, [this.messageChannel.port2]);

        return new Promise((resolve, reject) => {
            this.resolvers[req.responseId] = {resolve, reject};
            this.timeoutId = window.setTimeout(() => {
                /*
                 * Throw an error if neither HandshakeResponse or original Handshake request are received in a reasonable timeframe.
                 * This typically suggests an event handler stopped propagation of the Handshake request but did not respond to it on the MessageChannel port
                 */
                window.removeEventListener("message", this.windowListener, false);
                this.messageChannel.port1.close();
                this.messageChannel.port2.close();
                reject(BrowserAuthError.createWamHandshakeTimeoutError());
                delete this.resolvers[req.responseId];
            }, 2000); // Use a reasonable timeout in milliseconds here
        });
    }

    /**
     * Invoked when a message is posted to the window. If a handshake request is received it means the extension is not installed.
     * @param event 
     */
    private onWindowMessage(event: MessageEvent): void {
        this.logger.trace("WamMessageHandler - onWindowMessage called");
        // We only accept messages from ourselves
        if (event.source !== window) {
            return;
        }

        const request = event.data;

        if (!request.channel || request.channel !== WamConstants.CHANNEL_ID) {
            return;
        }

        if (request.extensionId && request.extensionId !== this.extensionId) {
            return;
        }

        if (request.body.method === WamExtensionMethod.HandshakeRequest) {
            // If we receive this message back it means no extension intercepted the request, meaning no extension supporting handshake protocol is installed
            this.logger.verbose(request.extensionId ? `Extension with id: ${request.extensionId} not installed` : "No extension installed");
            clearTimeout(this.timeoutId);
            this.messageChannel.port1.close();
            this.messageChannel.port2.close();
            window.removeEventListener("message", this.windowListener, false);
            this.resolvers[request.responseId].reject(BrowserAuthError.createWamExtensionNotInstalledError());
        }
    }

    /**
     * Invoked when a message is received from the extension on the MessageChannel port
     * @param event 
     */
    private onChannelMessage(event: MessageEvent): void {
        this.logger.trace("WamMessageHandler - onChannelMessage called.");
        const request = event.data;
        try {
            const method = request.body.method;

            if (method === WamExtensionMethod.Response) {
                const response = request.body.response;
                this.logger.trace("WamMessageHandler - Received response from browser extension");
                this.logger.tracePii(`WamMessageHandler - Received response from browser extension: ${JSON.stringify(response)}`);
                if (response.status !== "Success") {
                    this.resolvers[request.responseId].reject(WamAuthError.createError(response.code, response.description, response.ext));
                } else if (response.result) {
                    if (response.result["code"] && response.result["description"]) {
                        this.resolvers[request.responseId].reject(WamAuthError.createError(response.result["code"], response.result["description"], response.result["ext"]));
                    } else {
                        this.resolvers[request.responseId].resolve(response.result);
                    }
                } else {
                    throw AuthError.createUnexpectedError("Event does not contain result.");
                }
                delete this.resolvers[request.responseId];
            } else if (method === WamExtensionMethod.HandshakeResponse) {
                clearTimeout(this.timeoutId); // Clear setTimeout
                window.removeEventListener("message", this.windowListener, false); // Remove 'No extension' listener
                this.extensionId = request.extensionId;
                this.logger.verbose(`WamMessageHandler - Received HandshakeResponse from extension: ${this.extensionId}`);
                this.resolvers[request.responseId].resolve();
                delete this.resolvers[request.body.responseId];
            } 
            // Do nothing if method is not Response or HandshakeResponse
        } catch (err) {
            this.logger.error(`Error parsing response from WAM Extension: ${err.toString()}`);
            this.logger.errorPii(`Unable to parse ${event}`);

            if (request.responseId) {
                this.resolvers[request.responseId].reject(err);
            } else {
                throw err;
            }
        }
    }
} 
