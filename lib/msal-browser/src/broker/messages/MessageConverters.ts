/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { PopupRequest } from "../../request/PopupRequest";
import { SilentRequest } from "../../request/SilentRequest";
import { TokenRequest } from "./TokenRequest";

export class MessageConverterts {
    clientId: string;

    constructor(clientId: string) {
        this.clientId = clientId;
    }

    getTokenRequestFromPopupRequest(popupRequest: PopupRequest): TokenRequest {
        return {
            clientId: this.clientId,
            scope: popupRequest.scopes !== null ? popupRequest.scopes.join(" ") : ".default",
            correlationId: popupRequest.correlationId ?? "",
            prompt: popupRequest.prompt,
            nonce: popupRequest.nonce,
            claims: popupRequest.claims,
            // TODO: PoP token parameters
        };
    }

    getTokenRequestFromSilentRequest(silentRequest: SilentRequest): TokenRequest {
        return {
            clientId: this.clientId,
            scope: silentRequest.scopes !== null ? silentRequest.scopes.join(" ") : ".default",
            correlationId: silentRequest.correlationId ?? "",
            prompt: "none",
            claims: silentRequest.claims,
            // TODO: PoP token parameters
        };
    }
}
