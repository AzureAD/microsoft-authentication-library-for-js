/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { BrokerMessageType } from "../../../utils/BrowserConstants";
import { BrokerMessage } from "../BrokerMessage";

export class BrokerReadyRequest extends BrokerMessage {
    public brokerClientId: string;
    public version: string;
    
    constructor(brokerClientId: string, version: string) {
        super("BrokerReadyRequest");
        this.brokerClientId = brokerClientId;
        this.version = version;
    }
    
    static validate(message: MessageEvent): BrokerReadyRequest | null {
        // First, validate message type
        if (message &&
            message.data.messageType === BrokerMessageType.BROKER_READY_REQUEST &&
            message.data.brokerClientId &&
            message.data.version) {
                
            return new BrokerReadyRequest(message.data.brokerClientId, message.data.version);
        }

        return null;
    }
}
