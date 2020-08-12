/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { BrokerOptions } from "../config/Configuration";
import { BrokerHandshakeRequest } from "./BrokerHandshakeRequest";
import { BrokerHandshakeResponse } from "./BrokerHandshakeResponse";
import { BrokerMessage } from "./BrokerMessage";
import { BrokerAuthRequest } from "./BrokerAuthRequest";

export class BrokerManager {
    private brokerOptions: BrokerOptions;
    private version: string;

    constructor(brokerOptions: BrokerOptions, version: string) {
        this.brokerOptions = brokerOptions;
        this.version = version;
    }

    /* eslint-disable */
    listenForMessage(): void {
        window.addEventListener("message", (message: MessageEvent): void => {
            console.log("Broker handshake request received");
            // Check that message is a BrokerHandshakeRequest
            const clientRequestMessage = this.validateMessage(message);
            if (clientRequestMessage.messageType === "BrokerHandshakeRequest") {
                console.log("Broker handshake validated: ", clientRequestMessage);
                const brokerHandshakeResponse = new BrokerHandshakeResponse(this.version);

                // @ts-ignore
                message.source.postMessage(brokerHandshakeResponse, message.origin);
                console.log("Sending handshake response: ", brokerHandshakeResponse);
            } else if (clientRequestMessage.messageType === "BrokerAuthRequest") {
                // Call relevant acquireToken function here
            }
        });
    }
    /* eslint-enable */

    private validateMessage(message: MessageEvent): BrokerHandshakeRequest|BrokerAuthRequest {
        message = BrokerMessage.validateMessage(message);

        if (message && message.data.messageType === "BrokerHandshakeRequest") {
            return BrokerHandshakeRequest.validate(message);
        } else if (message && message.data.messageType === "BrokerAuthRequest") {
            return BrokerAuthRequest.validate(message);
        } else {
            return null;
        }
    }
}
