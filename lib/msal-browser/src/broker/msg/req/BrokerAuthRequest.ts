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

/**
 * Message type for auth requests
 */
export class BrokerAuthRequest extends BrokerMessage {
    public embeddedClientId: string;
    public interactionType: InteractionType;
    public request: RedirectRequest|PopupRequest|SsoSilentRequest|SilentRequest;

    private _embeddedAppOrigin: string;
    public get embeddedAppOrigin(): string {
        return this._embeddedAppOrigin;
    }

    constructor(embeddedClientId: string, interactionType: InteractionType, request: RedirectRequest|PopupRequest|SsoSilentRequest|SilentRequest, embeddedAppRedirectUri: string) {
        super(BrokerMessageType.AUTH_REQUEST);
        this.embeddedClientId = embeddedClientId;
        this._embeddedAppOrigin = embeddedAppRedirectUri;
        this.interactionType = interactionType;
        this.request = request;
    }

    static validate(message: MessageEvent): BrokerAuthRequest | null {
        // First, validate message type
        if (message.data && 
            message.data.messageType === BrokerMessageType.AUTH_REQUEST &&
            message.data.embeddedClientId &&
            message.data.interactionType &&
            message.data.request) {

            // TODO, verify version compatibility
            return new BrokerAuthRequest(message.data.embeddedClientId, message.data.interactionType, message.data.request, message.origin);
        }

        return null;
    }
}
