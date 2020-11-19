/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { BrokerMessage } from "../BrokerMessage";
import { BrokerMessageType } from "../../../utils/BrowserConstants";

/**
 * 
 */
export class BrokerRedirectResponse extends BrokerMessage {
    
    constructor() {
        super(BrokerMessageType.REDIRECT_RESPONSE);
    }

    static validate(message: MessageEvent): BrokerRedirectResponse | null {
        if (message.data && message.data.messageType === BrokerMessageType.REDIRECT_RESPONSE) {
            return new BrokerRedirectResponse();
        } else {
            return null;
        }
    }
}
