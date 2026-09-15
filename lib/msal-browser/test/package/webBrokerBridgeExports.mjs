/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const esmExports = await import("@azure/msal-browser/web-broker-bridge");
const commonJsExports = require("@azure/msal-browser/web-broker-bridge");

const expectedEventNames = {
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
    EmbeddedClientApplicationHandleRedirectRequest: "embeddedHandleRedirect",
    EmbeddedClientApplicationSendSilentRefreshRequest: "embeddedSilentRefresh",
    EmbeddedSendSilentRefreshRequestInternal: "embeddedSilentRefreshInternal",
    SendHandshakeRequest: "sendHandshakeRequest",
    SendMessageToBroker: "sendMessageToBroker",
    SendRequest: "sendRequest",
    HandleResponse: "handleBrokerResponse",
    GetFrameDepth: "getFrameDepth",
    OnHandshakeResponse: "onHandshakeResponse",
    HandleBrokerMessage: "handleBrokerMessage",
    PostMessageToAllDescendantFrames: "postMessageToAllDescendantFrames",
    HandleBrokerAuthRequest: "handleBrokerAuthRequest",
    BrokeredSilentRequest: "brokeredSilentRequest",
    BrokeredSsoSilentRequest: "brokeredSsoSilentRequest",
    BrokeredRedirectRequest: "brokeredRedirectRequest",
    BrokeredPopupRequest: "brokeredPopupRequest",
    InteractiveBrokerRequest: "interactiveBrokerRequest",
    AcquireTokenByBroker: "acquireTokenByBroker",
};

for (const [exportName, expectedValue] of Object.entries(expectedEventNames)) {
    assert.equal(
        esmExports[exportName],
        expectedValue,
        `ESM export ${exportName} changed`
    );
    assert.equal(
        commonJsExports[exportName],
        expectedValue,
        `CommonJS export ${exportName} changed`
    );
    assert.equal(
        esmExports[exportName],
        commonJsExports[exportName],
        `ESM and CommonJS exports differ for ${exportName}`
    );
}
