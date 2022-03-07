/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Logger, AuthError, AuthErrorMessage } from "@azure/msal-common";
import sinon from "sinon";
import { WamMessageHandler } from "../../src/broker/wam/WamMessageHandler";
import { BrowserAuthError, BrowserAuthErrorMessage } from "../../src/error/BrowserAuthError";
import { WamConstants, WamExtensionMethod } from "../../src/utils/BrowserConstants";
import { WamAuthError } from "../../src/error/WamAuthError";

describe("WamInteractionClient Tests", () => {
    let postMessageSpy: sinon.SinonSpy;
    let mcPort: MessagePort;
    globalThis.MessageChannel = require("worker_threads").MessageChannel; // jsdom does not include an implementation for MessageChannel

    beforeEach(() => {
        postMessageSpy = sinon.spy(window, "postMessage");
        sinon.stub(MessageEvent.prototype, "source").get(() => window); // source property not set by jsdom window messaging APIs
    });

    afterEach(() => {
        mcPort.close();
        sinon.restore();
    });

    describe("acquireToken Tests", () => {

    });

});