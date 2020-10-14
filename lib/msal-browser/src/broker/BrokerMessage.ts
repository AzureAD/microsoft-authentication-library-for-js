/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { BrokerMessageType } from "../utils/BrowserConstants";

export abstract class BrokerMessage {
    public messageType: string;

    constructor(messageType: string) {
        this.messageType = messageType;
    }

    static validateMessage(message: MessageEvent): MessageEvent|null {
        if (message.data && message.data.messageType) {
            switch(message.data.messageType) {
                case BrokerMessageType.HANDSHAKE_REQUEST:
                case BrokerMessageType.HANDSHAKE_RESPONSE:
                case BrokerMessageType.HANDLE_REDIRECT_REQUEST:
                case BrokerMessageType.AUTH_REQUEST:
                case BrokerMessageType.AUTH_RESULT:
                case BrokerMessageType.REDIRECT_RESPONSE:
                    return message;
                default:
                    return null;
            }
        } else {
            return null;
        }
    }
}
