/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { BrokerMessage } from "./BrokerMessage";

export class BrokerHandshakeResponse extends BrokerMessage {
    public version: string;

    constructor(version: string) {
        super("BrokerHandshakeResponse");

        this.version = version;
    }

    static validate(message: MessageEvent, trustedBrokerDomains: string[]) {
        // First, validate message type
        if (message.data && 
            message.data.messageType === "BrokerHandshakeResponse" &&
            message.data.version) {
                
            // TODO, verify version compatibility

            return new BrokerHandshakeResponse(message.data.version);
        }

        return null;
    }
}
