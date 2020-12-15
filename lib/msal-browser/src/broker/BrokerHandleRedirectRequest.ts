/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { BrokerMessageType } from "../utils/BrowserConstants";
import { BrokerMessage } from "./BrokerMessage";

export class BrokerHandleRedirectRequest extends BrokerMessage {
    public embeddedClientId: string;
    public version: string;

    constructor(embeddedClientId: string, version: string) {
        super(BrokerMessageType.HANDLE_REDIRECT_REQUEST);

        this.embeddedClientId = embeddedClientId;
        this.version = version;
    }

    /**
     * Validate broker "handle redirect" request
     * @param message 
     * @param trustedBrokerDomains 
     */
    static validate(message: MessageEvent): BrokerHandleRedirectRequest | null {
        // First, validate message type
        if (message.data && 
            message.data.messageType === BrokerMessageType.HANDLE_REDIRECT_REQUEST &&
            message.data.embeddedClientId &&
            message.data.version) {
                
            // TODO: verify version compatibility

            return new BrokerHandleRedirectRequest(message.data.embeddedClientId, message.data.version);
        }

        return null;
    }
}
