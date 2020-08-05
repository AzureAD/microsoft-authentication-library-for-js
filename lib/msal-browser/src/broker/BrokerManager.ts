/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { BrokerOptions } from "../config/Configuration";

export class BrokerManager {
    private brokerOptions: BrokerOptions;

    constructor(brokerOptions: BrokerOptions) {
        this.brokerOptions = brokerOptions;
        console.log("Broker initiated");
    }

    /* eslint-disable */
    listenForHandshake(): void {
        window.addEventListener("message", (message: MessageEvent): void => {
            console.log(message);
            // @ts-ignore
            message.source.postMessage("Received Handshake", message.origin);
        });
    }
    /* eslint-enable */
}
