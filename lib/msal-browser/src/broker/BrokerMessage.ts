/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { BrokerMessageType } from "../utils/BrowserConstants";
import { ClientAuthError } from "@azure/msal-common";
import { BrowserAuthError } from "../error/BrowserAuthError";

export abstract class BrokerMessage {
    public messageType: string;

    constructor(messageType: string) {
        this.messageType = messageType;
    }

    static validateMessage(message: MessageEvent): MessageEvent|null {
        if (message.data && message.data.messageType) {
            if (Object.values(BrokerMessageType).indexOf(message.data.messageType) > -1) {
                return message;
            } else {
                throw(BrowserAuthError.createInvalidBrokerMessageError());
            }
        } else {
            return null;
        }
    }
}
