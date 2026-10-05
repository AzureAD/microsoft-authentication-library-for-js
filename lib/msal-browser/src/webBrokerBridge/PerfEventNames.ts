/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * Shared performance event names for web broker bridge operations.
 *
 * @internal
 */
export const PairwiseBrokerApplicationInitializeBrokering =
    "pairwiseBrokerApplicationInitializeBrokering";
export const BrokerClientApplicationHandleBrokerHandshake =
    "brokerClientApplicationHandleBrokerHandshake";
export const BrokerClientApplicationBrokeredSSOSilentRequest =
    "brokerClientApplicationBrokeredSSOSilentRequest";
export const BrokerClientApplicationBrokeredSilentRequest =
    "brokerClientApplicationBrokeredSilentRequest";
export const EmbeddedClientApplicationSendSSOSilentRequest =
    "embeddedSSOSilent";
export const EmbeddedClientApplicationSendPopupRequest = "embeddedPopup";
export const EmbeddedClientApplicationHandleRedirectRequest =
    "embeddedHandleRedirect";
export const EmbeddedClientApplicationSendSilentRefreshRequest =
    "embeddedSilentRefresh";
export const EmbeddedSendSilentRefreshRequestInternal =
    "embeddedSilentRefreshInternal";
export const SendHandshakeRequest = "sendHandshakeRequest";
export const SendMessageToBroker = "sendMessageToBroker";
export const SendRequest = "sendRequest";
export const HandleResponse = "handleBrokerResponse";
export const GetFrameDepth = "getFrameDepth";
export const OnHandshakeResponse = "onHandshakeResponse";
export const HandleBrokerMessage = "handleBrokerMessage";
export const PostMessageToAllDescendantFrames =
    "postMessageToAllDescendantFrames";
export const HandleBrokerAuthRequest = "handleBrokerAuthRequest";
export const BrokeredSilentRequest = "brokeredSilentRequest";
export const BrokeredSsoSilentRequest = "brokeredSsoSilentRequest";
export const BrokeredRedirectRequest = "brokeredRedirectRequest";
export const BrokeredPopupRequest = "brokeredPopupRequest";
export const InteractiveBrokerRequest = "interactiveBrokerRequest";
export const AcquireTokenByBroker = "acquireTokenByBroker";
