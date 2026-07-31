/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { WebBrokerBridgeError } from "./WebBrokerBridgeError.js";

/**
 * Structural interface shared by NAA and PWB bridge request messages.
 *
 * Both `BridgeRequestEnvelope` (NAA) and `BrokerAuthRequest` (PWB) satisfy
 * this shape without any wire-format changes; concrete implementations
 * derive `requestId` from whatever correlation identifiers they already
 * carry.
 */
export interface IWebBrokerBridgeMessage {
    /**
     * Unique identifier used to correlate this request with its response.
     * Format is bridge-specific (NAA uses a GUID; PWB composes
     * `${channelId}:${messageId}`).
     */
    readonly requestId: string;

    /**
     * Discriminator identifying what this message represents
     * (e.g. `"GetToken"`, `"AuthRequest"`, `"Handshake"`).
     */
    readonly type: string;
}

/**
 * Structural interface shared by NAA and PWB bridge response messages.
 *
 * Responses are matched against pending requests by `requestId`.
 */
export interface IWebBrokerBridgeResponse extends IWebBrokerBridgeMessage {
    /**
     * When present, indicates the request failed and provides the
     * unified error taxonomy code + optional context. Absent on success.
     */
    error?: WebBrokerBridgeError;
}
