/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Configuration } from "../config/Configuration";
import { Logger, AuthenticationResult } from "@azure/msal-common";
import { BrokerHandshakeRequest } from "./BrokerHandshakeRequest";
import { BrokerHandshakeResponse } from "./BrokerHandshakeResponse";
import { PopupRequest } from "../request/PopupRequest";
import { RedirectRequest } from "../request/RedirectRequest";
import { BrokerAuthRequest } from "./BrokerAuthRequest";
import { InteractionType } from "../utils/BrowserConstants";
import { BrokerRedirectResponse } from "./BrokerRedirectResponse";
import { BrokerAuthResponse } from "./BrokerAuthResponse";
import { BrowserStorage } from "../cache/BrowserStorage";
import { BrowserAuthError } from "../error/BrowserAuthError";
import { SilentRequest } from "../request/SilentRequest";
import { version } from "../../package.json";

const DEFAULT_MESSAGE_TIMEOUT = 2000;
const DEFAULT_POPUP_MESSAGE_TIMEOUT = 60000;
/**
 * Embedded application in a broker scenario.
 */
export class EmbeddedClientApplication {
    private logger: Logger;
    private config: Configuration;
    private version: string;
    private brokerOrigin: string;
    private browserStorage: BrowserStorage;

    private get trustedBrokersProvided(): boolean {
        return this.config.system.brokerOptions.trustedBrokerDomains && this.config.system.brokerOptions.trustedBrokerDomains.length >= 1;
    }
    public brokerConnectionEstablished: boolean;

    constructor(configuration: Configuration, logger: Logger, browserStorage: BrowserStorage) {
        this.config = configuration;
        this.logger = logger;
        this.browserStorage = browserStorage;
        this.brokerConnectionEstablished = false;
        this.version = version;
    }

    async initiateHandshake(): Promise<void> {
        if (!this.trustedBrokersProvided) {
            throw BrowserAuthError.createNoTrustedBrokersProvidedError();
        }

        try {
            const response = await this.sendHandshakeRequest();
            this.brokerOrigin = response.brokerOrigin;
            this.brokerConnectionEstablished = true;
        } catch (e) {
            this.logger.error(e);
            this.brokerConnectionEstablished = false;
            throw e;
        }
    }

    private async preflightBrokerRequest(): Promise<void> {
        if (!this.brokerConnectionEstablished) {
            this.logger.info("Attempting handshake...");
            try {
                await this.initiateHandshake();
            } catch (e) {
                this.logger.error("Handshake rejected");
                throw BrowserAuthError.createBrokeringDisabledError(e);
            }
        }
    }

    async sendPopupRequest(request: PopupRequest): Promise<AuthenticationResult> {
        await this.preflightBrokerRequest();

        const brokerAuthResultMessage = await this.sendRequest(request, InteractionType.POPUP, DEFAULT_POPUP_MESSAGE_TIMEOUT);
        return BrokerAuthResponse.processBrokerResponse(brokerAuthResultMessage, this.browserStorage);
    }

    async sendRedirectRequest(request: RedirectRequest): Promise<void> {
        await this.preflightBrokerRequest();

        const message = await this.sendRequest(request, InteractionType.REDIRECT, DEFAULT_MESSAGE_TIMEOUT);
        BrokerRedirectResponse.validate(message);
    }

    async sendSilentRefreshRequest(request: SilentRequest): Promise<AuthenticationResult> {
        await this.preflightBrokerRequest();

        const brokerAuthResultMessage = await this.sendRequest(request, InteractionType.SILENT, DEFAULT_MESSAGE_TIMEOUT);
        return BrokerAuthResponse.processBrokerResponse(brokerAuthResultMessage, this.browserStorage);
    }

    private async sendRequest(request: PopupRequest|RedirectRequest, interactionType: InteractionType, timeoutMs: number): Promise<MessageEvent> {
        const brokerRequest = new BrokerAuthRequest(this.config.auth.clientId, interactionType, request);

        return this.messageBroker<MessageEvent>(brokerRequest, timeoutMs);
    }

    private async sendHandshakeRequest(): Promise<BrokerHandshakeResponse> {
        return new Promise<BrokerHandshakeResponse>((resolve: any, reject: any) => {
            const timeoutId = setTimeout(() => {
                this.logger.warning("Broker handshake timed out");
                reject(BrowserAuthError.createMessageBrokerTimeoutError());
            }, DEFAULT_MESSAGE_TIMEOUT);

            const onHandshakeResponse = (message: MessageEvent) => {
                try {
                    const brokerHandshakeResponse = BrokerHandshakeResponse.validate(message, this.config.system.brokerOptions.trustedBrokerDomains);
                    if (brokerHandshakeResponse) {
                        clearTimeout(timeoutId);
                        this.logger.info(`Received handshake response: ${JSON.stringify(brokerHandshakeResponse)}`);
                        resolve(brokerHandshakeResponse);
                    } else {
                        this.logger.warning(`Message is not handshake response: ${message}`);
                    }
                } catch (e) {
                    reject(e);
                }
                window.removeEventListener("message", onHandshakeResponse);
            };

            window.addEventListener("message", onHandshakeResponse);

            const handshakeRequest = new BrokerHandshakeRequest(this.config.auth.clientId, this.version);
            this.logger.verbose(`Sending handshake request: ${handshakeRequest}`);
            // Message top frame window
            window.top.postMessage(handshakeRequest, "*");
        });
    }

    private async messageBroker<T>(payload: any, timeoutMs: number = DEFAULT_MESSAGE_TIMEOUT): Promise<T> {
        return new Promise<T>((resolve: any, reject: any) => {
            const timeoutId = setTimeout(() => {
                reject(BrowserAuthError.createMessageBrokerTimeoutError());
            }, timeoutMs);

            /*
             * MessageChannel API listens on port1 and passes port2 up to the broker.
             * Broker will use port2 to message back down to the embedded client.
             */
            const messageChannel = new MessageChannel();
            messageChannel.port1.onmessage = ((message: MessageEvent): void => {
                this.logger.verbose(`in messageBroker<T> w/ origin: ${message}`);
                clearTimeout(timeoutId);
                messageChannel.port1.close();
                resolve(message);
            });
            // Message top frame window
            window.top.postMessage(payload, this.brokerOrigin, [messageChannel.port2]);
        });
    }
}
