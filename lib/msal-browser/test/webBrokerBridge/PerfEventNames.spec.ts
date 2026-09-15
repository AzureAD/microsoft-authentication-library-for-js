/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as PerfEventNames from "../../src/webBrokerBridge/PerfEventNames.js";

describe("PerfEventNames", () => {
    it("preserves the existing web broker bridge event names", () => {
        expect(PerfEventNames).toEqual({
            PairwiseBrokerApplicationInitializeBrokering:
                "pairwiseBrokerApplicationInitializeBrokering",
            BrokerClientApplicationHandleBrokerHandshake:
                "brokerClientApplicationHandleBrokerHandshake",
            BrokerClientApplicationBrokeredSSOSilentRequest:
                "brokerClientApplicationBrokeredSSOSilentRequest",
            BrokerClientApplicationBrokeredSilentRequest:
                "brokerClientApplicationBrokeredSilentRequest",
            EmbeddedClientApplicationSendSSOSilentRequest: "embeddedSSOSilent",
            EmbeddedClientApplicationSendPopupRequest: "embeddedPopup",
            EmbeddedClientApplicationHandleRedirectRequest:
                "embeddedHandleRedirect",
            EmbeddedClientApplicationSendSilentRefreshRequest:
                "embeddedSilentRefresh",
            EmbeddedSendSilentRefreshRequestInternal:
                "embeddedSilentRefreshInternal",
            SendHandshakeRequest: "sendHandshakeRequest",
            SendMessageToBroker: "sendMessageToBroker",
            SendRequest: "sendRequest",
            HandleResponse: "handleBrokerResponse",
            GetFrameDepth: "getFrameDepth",
            OnHandshakeResponse: "onHandshakeResponse",
            HandleBrokerMessage: "handleBrokerMessage",
            PostMessageToAllDescendantFrames:
                "postMessageToAllDescendantFrames",
            HandleBrokerAuthRequest: "handleBrokerAuthRequest",
            BrokeredSilentRequest: "brokeredSilentRequest",
            BrokeredSsoSilentRequest: "brokeredSsoSilentRequest",
            BrokeredRedirectRequest: "brokeredRedirectRequest",
            BrokeredPopupRequest: "brokeredPopupRequest",
            InteractiveBrokerRequest: "interactiveBrokerRequest",
            AcquireTokenByBroker: "acquireTokenByBroker",
        });
    });
});
