/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { BrokerOptions } from "../config/Configuration";
import { Logger, ClientAuthError, AuthenticationResult } from "@azure/msal-common";
import { BrokerHandshakeRequest } from "./BrokerHandshakeRequest";
import { BrokerHandshakeResponse } from "./BrokerHandshakeResponse";
import { PopupRequest } from "../request/PopupRequest";
import { RedirectRequest } from "../request/RedirectRequest";
import { BrokerAuthRequest } from "./BrokerAuthRequest";
import { InteractionType } from "../utils/BrowserConstants";

/**
 * Embedded application in a broker scenario.
 */
export class BrokerClient {
    private brokerOptions: BrokerOptions;
    private logger: Logger;
    private clientId: string;
    private version: string;
    private brokerOrigin: string;

    public brokeringEnabled: boolean;

    constructor(brokerOptions: BrokerOptions, logger: Logger, clientId: string, version: string) {
        this.brokerOptions = brokerOptions;
        this.logger = logger;
        this.clientId = clientId;
        this.version = version;

        if (!this.brokerOptions.trustedBrokerDomains || this.brokerOptions.trustedBrokerDomains.length < 1) {
            console.log("Application was identified as an embedded app in a broker scenario, but no trusted broker domains were provided.");
            this.brokeringEnabled = false;
        } else {
            this.brokeringEnabled = true;
        }
    }

    async initiateHandshake(): Promise<void> {
        if (!this.brokeringEnabled) {
            console.log("Brokering is not enabled, handshake was not performed.");
            return;
        }

        try {
            const response = await this.sendHandshakeRequest();
            this.brokerOrigin = response.brokerOrigin;
        } catch (e) {
            console.error(e);
            this.brokeringEnabled = false;
            throw e;
        }
    }

    async sendPopupRequest(request: PopupRequest): Promise<AuthenticationResult> {
        return this.sendRequest<AuthenticationResult>(request, InteractionType.POPUP);
    }

    async sendRedirectRequest(request: RedirectRequest): Promise<void> {
        return this.sendRequest<void>(request, InteractionType.REDIRECT);
    }

    private async sendRequest<T>(request: PopupRequest|RedirectRequest, interactionType: InteractionType): Promise<T> {
        const brokerRequest = new BrokerAuthRequest(this.clientId, interactionType, request);

        return this.messageBroker<T>(brokerRequest);
    }

    private async sendHandshakeRequest(): Promise<BrokerHandshakeResponse> {
        return new Promise<BrokerHandshakeResponse>((resolve: any, reject: any) => {
            const timeoutId = setTimeout(() => {
                console.log("Broker handshake timed out");
                reject(new ClientAuthError("message_broker_timeout", "Message broker timed out"));
            }, 2000);

            window.addEventListener("message", (message: MessageEvent) => {
                try {
                    const brokerHandshakeResponse = BrokerHandshakeResponse.validate(message, this.brokerOptions.trustedBrokerDomains);
                    if (brokerHandshakeResponse) {
                        clearTimeout(timeoutId);
                        console.log("Received handshake response: ", brokerHandshakeResponse);
                        resolve(brokerHandshakeResponse);
                    } else {
                        console.log("Message is not handshake response: ", message);
                    }
                } catch (e) {
                    reject(e);
                }
            });

            const handshakeRequest = new BrokerHandshakeRequest(this.clientId, this.version);
            window.top.postMessage(handshakeRequest, "*");
            console.log("Sending handshake request: ", handshakeRequest);
        });
    }

    private async messageBroker<T>(payload: any): Promise<T> {
        return new Promise<T>((resolve: any, reject: any) => {
            const timeoutId = setTimeout(() => {
                reject(new ClientAuthError("message_broker_timeout", "Message broker timed out"));                
            }, 2000);

            const messageChannel = new MessageChannel();
            messageChannel.port1.onmessage = ((message: MessageEvent): void => {
                console.log(`in messageBroker<T> w/ origin: ${message}`);
                clearTimeout(timeoutId);
                resolve(message);
            });
            window.top.postMessage(payload, this.brokerOrigin, [messageChannel.port2]);
        });
    }
}
