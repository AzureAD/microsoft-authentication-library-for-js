/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Logger, AuthenticationResult, Constants } from "@azure/msal-common";
import { BrokerHandshakeRequest } from "../msg/req/BrokerHandshakeRequest";
import { BrokerHandshakeResponse } from "../msg/resp/BrokerHandshakeResponse";
import { PopupRequest } from "../../request/PopupRequest";
import { RedirectRequest } from "../../request/RedirectRequest";
import { BrokerAuthRequest } from "../msg/req/BrokerAuthRequest";
import { InteractionType } from "../../utils/BrowserConstants";
import { BrokerRedirectResponse } from "../msg/resp/BrokerRedirectResponse";
import { BrokerAuthResponse } from "../msg/resp/BrokerAuthResponse";
import { BrowserAuthError } from "../../error/BrowserAuthError";
import { SilentRequest } from "../../request/SilentRequest";
import { BrokerHandleRedirectRequest } from "../msg/req/BrokerHandleRedirectRequest";
import { BrowserCacheManager } from "../../cache/BrowserCacheManager";
import { SsoSilentRequest } from "../../request/SsoSilentRequest";
import { BrokerAuthError } from "../../error/BrokerAuthError";
import { version } from "../../packageMetadata";
import { BrokerOptions } from "../../config/ExperimentalConfiguration";
import { DEFAULT_IFRAME_TIMEOUT_MS } from "../../config/Configuration";

const DEFAULT_MESSAGE_TIMEOUT = 2000;
const DEFAULT_POPUP_MESSAGE_TIMEOUT = 60000;
/**
 * Embedded application in a broker scenario.
 */
export class EmbeddedClientApplication {
    private logger: Logger;
    private clientId: string;
    private brokerOpts: BrokerOptions;
    private version: string;
    private brokerOrigin: string;
    private browserStorage: BrowserCacheManager;

    private get trustedBrokersProvided(): boolean {
        return !!this.brokerOpts.trustedBrokerDomains && this.brokerOpts.trustedBrokerDomains.length >= 1;
    }
    public brokerConnectionEstablished: boolean;

    constructor(clientId: string, experimentalConfig: BrokerOptions, logger: Logger, browserStorage: BrowserCacheManager) {
        this.brokerOpts = experimentalConfig;
        this.clientId = clientId;
        this.logger = logger;
        this.browserStorage = browserStorage;
        this.brokerConnectionEstablished = false;
        this.version = version;
        this.brokerOrigin = Constants.EMPTY_STRING;
    }

    /**
     * Initiate handshake process with broker
     */
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
        }
    }

    /**
     * Preflight request to broker and check that handshake was completed.
     */
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

    /**
     * Send silent flow request to broker
     * @param request 
     */
    async sendSsoSilentRequest(request: SsoSilentRequest): Promise<AuthenticationResult> {
        await this.preflightBrokerRequest();
        const brokerAuthResultMessage = await this.sendRequest(request, InteractionType.Silent, DEFAULT_IFRAME_TIMEOUT_MS);
        const brokerAuthResult = BrokerAuthResponse.processBrokerResponseMessage(brokerAuthResultMessage, this.browserStorage);
        if (!brokerAuthResult) {
            this.logger.errorPii(`Broker response is empty in brokered ssoSilent request: ${JSON.stringify(brokerAuthResult)}`);
            throw BrokerAuthError.createBrokerResponseInvalidError();
        }
        return brokerAuthResult;
    }

    /**
     * Send popup flow request to broker.
     * @param request 
     */
    async sendPopupRequest(request: PopupRequest): Promise<AuthenticationResult> {
        await this.preflightBrokerRequest();

        const brokerAuthResultMessage = await this.sendRequest(request, InteractionType.Popup, DEFAULT_POPUP_MESSAGE_TIMEOUT);
        const brokerAuthResult = BrokerAuthResponse.processBrokerResponseMessage(brokerAuthResultMessage, this.browserStorage);
        if (!brokerAuthResult) {
            // Check redirect response
            const redirectResponse = BrokerRedirectResponse.validate(brokerAuthResultMessage);
            if (!redirectResponse) {
                this.logger.errorPii(`Broker response is empty in brokered popup request: ${JSON.stringify(brokerAuthResult)}`);
                throw BrokerAuthError.createBrokerResponseInvalidError();
            }
            this.logger.info("popupRequest requires a redirect by the broker, this app will now redirect.");
            throw BrokerAuthError.createBrokerPopupRequestRedirectingError();
        }
        return brokerAuthResult;
    }

    /**
     * Send redirect request to broker.
     * @param request 
     */
    async sendRedirectRequest(request: RedirectRequest): Promise<void> {
        await this.preflightBrokerRequest();

        const message = await this.sendRequest(request, InteractionType.Redirect, DEFAULT_MESSAGE_TIMEOUT);
        const redirectResponse = BrokerRedirectResponse.validate(message);
        if (!redirectResponse) {
            this.logger.errorPii(`Broker response is not a redirect: ${JSON.stringify(redirectResponse)}`);
            throw BrokerAuthError.createBrokerResponseInvalidError();
        }
        this.logger.info(`Broker redirecting: ${redirectResponse}`);
    }

    /**
     * Send request to broker to handle redirect response for child.
     */
    async sendHandleRedirectRequest(): Promise<AuthenticationResult | null> {
        await this.preflightBrokerRequest();
        const brokerHandleRedirectRequest = new BrokerHandleRedirectRequest(this.clientId, this.version);

        const brokerRedirectResponse = await this.messageBroker(brokerHandleRedirectRequest, DEFAULT_MESSAGE_TIMEOUT);
        return BrokerAuthResponse.processBrokerResponseMessage(brokerRedirectResponse, this.browserStorage);
    }

    /**
     * Send request to silently renew tokens to broker.
     * @param request 
     */
    async sendSilentRefreshRequest(request: SilentRequest): Promise<AuthenticationResult> {
        await this.preflightBrokerRequest();
        const brokerAuthResultMessage = await this.sendRequest(request, InteractionType.Silent, DEFAULT_MESSAGE_TIMEOUT);
        const brokerAuthResult = BrokerAuthResponse.processBrokerResponseMessage(brokerAuthResultMessage, this.browserStorage);
        if (!brokerAuthResult) {
            this.logger.errorPii(`Broker response is empty in brokered silent refresh request: ${JSON.stringify(brokerAuthResult)}`);
            throw BrokerAuthError.createBrokerResponseInvalidError();
        }
        return brokerAuthResult;
    }

    /**
     * Helper for sending request to broker.
     * @param request 
     * @param interactionType 
     * @param timeoutMs 
     */
    private async sendRequest(request: PopupRequest|RedirectRequest|SsoSilentRequest|SilentRequest, interactionType: InteractionType, timeoutMs: number): Promise<MessageEvent> {
        const brokerRequest = new BrokerAuthRequest(this.clientId, interactionType, request, Constants.EMPTY_STRING);
        return this.messageBroker(brokerRequest, timeoutMs);
    }

    /**
     * Send handshake request helper. Handshake is done without MessageChannel to ensure that the origin can be read from the message. 
     * Subsequent requests for authentication are sent over a MessageChannel, as origin is no longer required.
     */
    private async sendHandshakeRequest(): Promise<BrokerHandshakeResponse> {
        return new Promise<BrokerHandshakeResponse>((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                this.logger.warning("Broker handshake timed out");
                window.removeEventListener("message", onHandshakeResponse);
                reject(BrowserAuthError.createMessageBrokerTimeoutError());
            }, DEFAULT_MESSAGE_TIMEOUT);

            const onHandshakeResponse = (message: MessageEvent) => {
                try {
                    const brokerHandshakeResponse = BrokerHandshakeResponse.validate(message, this.brokerOpts.trustedBrokerDomains);
                    if (brokerHandshakeResponse) {
                        clearTimeout(timeoutId);
                        this.logger.info(`Received handshake response: ${JSON.stringify(brokerHandshakeResponse)}`);
                        window.removeEventListener("message", onHandshakeResponse);
                        resolve(brokerHandshakeResponse);
                    } else {
                        this.logger.warning("Message is not handshake response");
                        this.logger.verbosePii(`${JSON.stringify(message.data)}`);
                    }
                } catch (e) {
                    window.removeEventListener("message", onHandshakeResponse);
                    reject(e);
                }
            };

            window.addEventListener("message", onHandshakeResponse);

            const handshakeRequest = new BrokerHandshakeRequest(this.clientId, this.version);
            this.logger.verbose(`Sending handshake request: ${handshakeRequest}`);
            // Message top frame window
            window.top.postMessage(handshakeRequest, "*");
        });
    }

    /**
     * Broker message helper.
     * @param payload 
     * @param timeoutMs 
     */
    private async messageBroker(payload: BrokerAuthRequest|BrokerHandleRedirectRequest, timeoutMs: number = DEFAULT_MESSAGE_TIMEOUT): Promise<MessageEvent> {
        return new Promise((resolve, reject) => {
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
