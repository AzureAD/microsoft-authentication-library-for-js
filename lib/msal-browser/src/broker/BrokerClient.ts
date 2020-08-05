/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { BrokerOptions } from "../config/Configuration";
import { Logger, AuthenticationResult, ClientAuthError } from "@azure/msal-common";

/**
 * Embedded application in a broker scenario.
 */
export class BrokerClient {
    private brokerOptions: BrokerOptions;
    private brokeringEnabled: boolean;
    private logger: Logger;

    constructor(brokerOptions: BrokerOptions, logger: Logger) {
        this.brokerOptions = brokerOptions;
        this.logger = logger;
        console.log("Embedded App handler initiated");

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
            const response: MessageEvent = await this.messageBroker<MessageEvent>("Hello world!");
            if (this.brokerOptions.trustedBrokerDomains.indexOf(response.origin) < 0) {
                throw new ClientAuthError("untrusted_broker", "The given broker origin is not trusted.");
            }
        } catch (e) {
            console.error(e);
            this.brokeringEnabled = false;
            throw e;
        }
    }

    private async messageBroker<T>(payload: any, origin?: string): Promise<T> {
        return new Promise<T>((resolve: any, reject: any) => {
            const timeoutId = setTimeout(() => {
                reject(new ClientAuthError("message_broker_timeout", "Message broker timed out"));                
            }, 2000);

            if (origin) {
                const messageChannel = new MessageChannel();
                messageChannel.port1.onmessage = ((message: MessageEvent): void => {
                    console.log(`in messageBroker<T> w/ origin: ${message}`);
                    clearTimeout(timeoutId);
                    resolve(message);
                });
                window.top.postMessage(payload, origin, [messageChannel.port2]);
            } else {
                window.addEventListener("message", (message) => {
                    console.log(`in messageBroker<T> without origin: ${message}`);
                    clearTimeout(timeoutId);
                    resolve(message);
                });

                window.top.postMessage(payload, "*");
            }
        });
    }
}
