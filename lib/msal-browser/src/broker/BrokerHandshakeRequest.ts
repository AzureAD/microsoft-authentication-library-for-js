/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { BrokerMessage } from "./BrokerMessage";
import { CacheManager } from "@azure/msal-common";
import { BrokerMessageType } from "../utils/BrowserConstants";

export class BrokerHandshakeRequest extends BrokerMessage {
    public embeddedClientId: string;
    public version: string;

    constructor(embeddedClientId: string, version: string) {
        super(BrokerMessageType.HANDSHAKE_REQUEST);

        this.embeddedClientId = embeddedClientId;
        this.version = version;
    }

    static validate(message: MessageEvent): BrokerHandshakeRequest | null {
        // First, validate message type
        if (message.data && 
            message.data.messageType === BrokerMessageType.HANDSHAKE_REQUEST &&
            message.data.embeddedClientId &&
            message.data.version) {
                
            // TODO, verify version compatibility

            return new BrokerHandshakeRequest(message.data.embeddedClientId, message.data.version);
        }

        return null;
    }
}
