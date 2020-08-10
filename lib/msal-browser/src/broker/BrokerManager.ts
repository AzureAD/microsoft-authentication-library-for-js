/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { BrokerOptions } from "../config/Configuration";
import { BrokerHandshakeRequest } from "./BrokerHandshakeRequest";
import { BrokerHandshakeResponse } from "./BrokerHandshakeResponse";

export class BrokerManager {
    private brokerOptions: BrokerOptions;
    private version: string;

    constructor(brokerOptions: BrokerOptions, version: string) {
        this.brokerOptions = brokerOptions;
        this.version = version;
    }

    /* eslint-disable */
    listenForHandshake(): void {
        window.addEventListener("message", (message: MessageEvent): void => {
            console.log("Broker handshake request received");
            // Check that message is a BrokerHandshakeRequest
            const brokerMessageHandshake = BrokerHandshakeRequest.validate(message);
            if (brokerMessageHandshake) {
                console.log("Broker handshake validated: ", brokerMessageHandshake);
                const brokerHandshakeResponse = new BrokerHandshakeResponse(this.version);

                // @ts-ignore
                message.source.postMessage(brokerHandshakeResponse, message.origin);
                console.log("Sending handshake response: ", brokerHandshakeResponse);
            }
        });
    }
    /* eslint-enable */
}
