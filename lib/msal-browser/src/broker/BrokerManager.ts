/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { BrokerOptions } from "../config/Configuration";
import { BrokerHandshakeRequest } from "./BrokerHandshakeRequest";
import { BrokerHandshakeResponse } from "./BrokerHandshakeResponse";
import { Logger } from "@azure/msal-common";

export class BrokerManager {
    private brokerOptions: BrokerOptions;
    private version: string;
    private logger: Logger;

    constructor(brokerOptions: BrokerOptions, logger: Logger, version: string) {
        this.brokerOptions = brokerOptions;
        this.logger = logger;
        this.version = version;
    }

    /* eslint-disable */
    listenForHandshake(): void {
        window.addEventListener("message", (message: MessageEvent): void => {
            this.logger.verbose("Broker handshake request received");
            // Check that message is a BrokerHandshakeRequest
            const brokerMessageHandshake = BrokerHandshakeRequest.validate(message);
            if (brokerMessageHandshake) {
                this.logger.verbose(`Broker handshake validated: ${JSON.stringify(brokerMessageHandshake)}`);
                const brokerHandshakeResponse = new BrokerHandshakeResponse(this.version);

                // @ts-ignore
                message.source.postMessage(brokerHandshakeResponse, message.origin);
                this.logger.info(`Sending handshake response: ${JSON.stringify(brokerHandshakeResponse)}`);
            }
        });
    }
    /* eslint-enable */
}
