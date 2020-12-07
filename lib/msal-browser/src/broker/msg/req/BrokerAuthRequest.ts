/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { InteractionType, BrokerMessageType } from "../../../utils/BrowserConstants";
import { PopupRequest } from "../../../request/PopupRequest";
import { RedirectRequest } from "../../../request/RedirectRequest";
import { BrokerMessage } from "../BrokerMessage";
import { SilentRequest } from "../../../request/SilentRequest";
import { SsoSilentRequest } from "../../../request/SsoSilentRequest";

export class BrokerAuthRequest extends BrokerMessage {
    public embeddedClientId: string;
    public embeddedAppRedirectUri: string;
    public interactionType: InteractionType;
    public request: RedirectRequest | PopupRequest | SsoSilentRequest | SilentRequest;

    constructor(embeddedClientId: string, embeddedAppRedirectUri: string, interactionType: InteractionType, request: RedirectRequest | PopupRequest | SsoSilentRequest) {
        super(BrokerMessageType.AUTH_REQUEST);
        this.embeddedClientId = embeddedClientId;
        this.embeddedAppRedirectUri = embeddedAppRedirectUri;
        this.interactionType = interactionType;
        this.request = request;
    }

    static validate(message: MessageEvent): BrokerAuthRequest| null {
        // First, validate message type
        // eslint-disable-next-line no-console
        if (message.data && 
            message.data.messageType === BrokerMessageType.AUTH_REQUEST &&
            message.data.embeddedClientId &&
            message.data.interactionType &&
            message.data.request) {

            // TODO, verify version compatibility
            return new BrokerAuthRequest(message.data.embeddedClientId, message.origin, message.data.interactionType, message.data.request);
        }

        return null;
    }
}
