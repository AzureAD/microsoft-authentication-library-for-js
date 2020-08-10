/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { BrokerOptions } from "../config/Configuration";
import { Logger, AuthenticationResult, ClientAuthError } from "@azure/msal-common";
import { BrokerHandshakeRequest } from "./BrokerHandshakeRequest";
import { BrokerHandshakeResponse } from "./BrokerHandshakeResponse";

/**
 * Embedded application in a broker scenario.
 */
export class BrokerClient {
    private brokerOptions: BrokerOptions;
    private brokeringEnabled: boolean;
    private logger: Logger;
    private clientId: string;
    private version: string;

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
            await this.sendHandshakeRequest();
        } catch (e) {
            console.error(e);
            this.brokeringEnabled = false;
            throw e;
        }
    }

    private async sendHandshakeRequest(): Promise<BrokerHandshakeResponse> {
        return new Promise<BrokerHandshakeResponse>((resolve: any, reject: any) => {
            const timeoutId = setTimeout(() => {
                console.log("Broker handshake timed out");
                reject(new ClientAuthError("message_broker_timeout", "Message broker timed out"));
            }, 2000);

            window.addEventListener("message", (message: MessageEvent) => {
                const brokerHandshakeResponse = BrokerHandshakeResponse.validate(message, this.brokerOptions.trustedBrokerDomains);
                if (brokerHandshakeResponse) {
                    clearTimeout(timeoutId);

                    if (this.brokerOptions.trustedBrokerDomains.indexOf(message.origin) < 0) {
                        console.log("Domain is untrusted: ", message.origin);
                        reject(new ClientAuthError("untrusted_broker", "The given broker origin is not trusted."));
                    } else {
                        console.log("Received handshake response: ", brokerHandshakeResponse);
                        resolve(brokerHandshakeResponse);
                    }
                } else {
                    console.log("Message is not handshake response: ", message);
                }
            });

            const handshakeRequest = new BrokerHandshakeRequest(this.clientId, this.version);
            window.top.postMessage(handshakeRequest, "*");
            console.log("Sending handshake request: ", handshakeRequest);
        });
    }

    private async messageBroker<T>(payload: any, origin?: string): Promise<T> {
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
            window.top.postMessage(payload, origin, [messageChannel.port2]);
        });
    }
}
