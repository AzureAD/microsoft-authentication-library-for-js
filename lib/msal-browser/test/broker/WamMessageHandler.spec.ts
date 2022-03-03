/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Logger } from "@azure/msal-common";
import sinon from "sinon";
import { WamMessageHandler } from "../../src/broker/wam/WamMessageHandler";

describe("WamMessageHandler Tests", () => {
    let postMessageSpy: sinon.SinonSpy;
    let mcPort: MessagePort;

    beforeEach(() => {
        postMessageSpy = sinon.spy(window, "postMessage");
    });

    afterEach(() => {
        mcPort.close();
        sinon.restore();
    })

    describe("createProvider", () => {
        it("Sends handshake request to preferred extension which responds", async () => {
            const eventHandler = function (event: MessageEvent) {
                event.stopImmediatePropagation();
                const request = event.data;
                const req  = {
                    channel: "53ee284d-920a-4b59-9d30-a60315b26836",
                    extensionId: "test-ext-id",
                    responseId: request.responseId,
                    body: {
                        method: "HandshakeResponse",
                        version: 3
                    }
                };

                mcPort = postMessageSpy.args[0][2][0];
                if (!mcPort) {
                    throw new Error("MessageChannel port was not transferred");
                }
                mcPort.postMessage(req);
            };

            window.addEventListener("message", eventHandler, true);

            const wamMessageHandler = await WamMessageHandler.createProvider(new Logger({}));
            expect(wamMessageHandler).toBeInstanceOf(WamMessageHandler);

            window.removeEventListener("message", eventHandler, true);
        });

        it("Sends handshake to any extension if preferred extension is not installed", () => {

        });
    })
});