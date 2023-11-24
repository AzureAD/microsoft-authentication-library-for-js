/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AccountInfo } from "../../src/naa/AccountInfo";
import { AuthBridge } from "../../src/naa/AuthBridge";
import { BridgeError, isBridgeError } from "../../src/naa/BridgeError";
import { isBridgeRequestEnvelope } from "../../src/naa/BridgeRequestEnvelope";
import { InitializeBridgeResponse } from "../../src/naa/InitializeBridgeResponse";
import { TokenResponse } from "../../src/naa/TokenResponse";

export class MockBridge implements AuthBridge {
    private listeners: { [key: string]: ((response: string) => void)[] } = {};
    private responses: {
        [key: string]: (
            | TokenResponse
            | BridgeError
            | AccountInfo
            | AccountInfo[]
            | InitializeBridgeResponse
        )[];
    } = {};

    public addEventListener(
        eventName: string,
        callback: (response: string) => void
    ): void {
        if (this.listeners[eventName] === undefined) {
            this.listeners[eventName] = [];
        }
        this.listeners[eventName].push(callback);
    }

    public postMessage(message: string): void {
        const request = JSON.parse(message);
        if (isBridgeRequestEnvelope(request)) {
            const response = this.responses[request.method].pop();
            const responseEnvelope = {
                messageType: "NestedAppAuthResponse",
                requestId: request.requestId,
                success: !isBridgeError(response), // false if body is error
                body: response,
            };
            if (response !== undefined) {
                if (this.listeners["message"] !== undefined) {
                    this.listeners["message"].forEach((callback) => {
                        callback(JSON.stringify(responseEnvelope));
                    });
                }
            }
        }
    }

    public removeEventListener(
        eventName: string,
        callback: (response: string) => void
    ): void {
        if (this.listeners[eventName] !== undefined) {
            this.listeners[eventName] = this.listeners[eventName].filter(
                (listener) => listener !== callback
            );
        }
    }

    public addResponse(
        method: string,
        response:
            | TokenResponse
            | BridgeError
            | AccountInfo
            | AccountInfo[]
            | InitializeBridgeResponse
    ): void {
        if (this.responses[method] === undefined) {
            this.responses[method] = [];
        }
        this.responses[method].push(response);
    }

    public removeResponse(method: string): void {
        delete this.responses[method];
    }

    public removeAllResponses(): void {
        this.responses = {};
    }
}

export default MockBridge;
