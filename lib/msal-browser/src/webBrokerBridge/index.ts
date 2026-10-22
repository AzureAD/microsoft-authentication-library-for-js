/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * Shared web broker bridge contracts and runtime utilities.
 *
 * @packageDocumentation
 * @module @azure/msal-browser/web-broker-bridge
 */

export type {
    IWebBrokerBridgeMessage,
    IWebBrokerBridgeResponse,
} from "./IWebBrokerBridgeMessage.js";
export type { WebBrokerBridgeError } from "./WebBrokerBridgeError.js";
export { WebBrokerBridgeErrorCode } from "./WebBrokerBridgeError.js";
export { toAuthError } from "./WebBrokerBridgeErrorMap.js";
export { PendingRequestRegistry } from "./PendingRequestRegistry.js";
export type { WebBrokerBridgeSendFn } from "./PendingRequestRegistry.js";
export {
    addLegacyRequestFields,
    addResourceField,
    normalizeIncomingRequest,
    normalizeResourceField,
} from "./adapter/CrossVersionRequestAdapter.js";
export type {
    CrossVersionRequest,
    CrossVersionRequestFields,
    LegacyRequestFields,
} from "./adapter/CrossVersionRequestAdapter.js";
export {
    AcquireTokenByBroker,
    BrokerClientApplicationBrokeredSilentRequest,
    BrokerClientApplicationBrokeredSSOSilentRequest,
    BrokerClientApplicationHandleBrokerHandshake,
    BrokeredPopupRequest,
    BrokeredRedirectRequest,
    BrokeredSilentRequest,
    BrokeredSsoSilentRequest,
    EmbeddedClientApplicationHandleRedirectRequest,
    EmbeddedClientApplicationSendPopupRequest,
    EmbeddedClientApplicationSendSilentRefreshRequest,
    EmbeddedClientApplicationSendSSOSilentRequest,
    EmbeddedSendSilentRefreshRequestInternal,
    GetFrameDepth,
    HandleBrokerAuthRequest,
    HandleBrokerMessage,
    HandleResponse,
    InteractiveBrokerRequest,
    OnHandshakeResponse,
    PairwiseBrokerApplicationInitializeBrokering,
    PostMessageToAllDescendantFrames,
    SendHandshakeRequest,
    SendMessageToBroker,
    SendRequest,
} from "./PerfEventNames.js";
