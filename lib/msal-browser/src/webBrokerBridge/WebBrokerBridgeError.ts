/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * Unified error taxonomy shared by NAA and PWB.
 *
 * Each code maps to exactly one of the four base MSAL error classes
 * (`AuthError`, `ClientAuthError`, `ServerError`,
 * `InteractionRequiredAuthError`) via `toAuthError` in
 * `./WebBrokerBridgeErrorMap`.
 */
export const WebBrokerBridgeErrorCode = {
    /* Interaction / auth outcomes */
    UserInteractionRequired: "user_interaction_required",
    UserCanceled: "user_canceled",

    /* Environment / connectivity */
    NoNetwork: "no_network",
    AccountUnavailable: "account_unavailable",
    BridgeDisabled: "bridge_disabled",
    BridgeUnavailable: "bridge_unavailable",

    /* Server-side outcomes */
    TransientError: "transient_error",
    PersistentError: "persistent_error",

    /* Broker-channel failures */
    BridgeTimeout: "bridge_timeout",
    BridgeHandshakeFailed: "bridge_handshake_failed",
    BridgeConnectionReset: "bridge_connection_reset",
    BridgeResponseInvalid: "bridge_response_invalid",
    PopupWillRedirect: "popup_will_redirect",
    ShrGenerationError: "shr_generation_error",

    /* Fallback */
    Unknown: "unknown",
} as const;
export type WebBrokerBridgeErrorCode =
    (typeof WebBrokerBridgeErrorCode)[keyof typeof WebBrokerBridgeErrorCode];

/**
 * Normalized error payload carried between the broker and the embedded
 * app. Bridge-specific transports (NAA `BridgeError`, PWB `errorPayload`)
 * are lowered into this shape before being lifted to an MSAL error class.
 */
export interface WebBrokerBridgeError {
    /**
     * Common taxonomy code — see `WebBrokerBridgeErrorCode`.
     */
    readonly code: WebBrokerBridgeErrorCode;

    /**
     * Underlying provider-specific error code preserved for classes that
     * accept a variable code (e.g. `invalid_grant` on `ServerError`).
     * Ignored for codes whose mapping is a fixed constant.
     */
    readonly innerErrorCode?: string;

    /** Server sub-error (e.g. `consent_required`). */
    readonly subError?: string;

    /** Human-readable description forwarded from the underlying response. */
    readonly description?: string;

    /** Correlation id, when available. */
    readonly correlationId?: string;
}
