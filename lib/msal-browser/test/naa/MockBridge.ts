/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AccountInfo } from "../../src/naa/AccountInfo.js";
import { AuthBridge } from "../../src/naa/AuthBridge.js";
import { AuthResult } from "../../src/naa/AuthResult.js";
import { BridgeError, isBridgeError } from "../../src/naa/BridgeError.js";
import { isBridgeRequestEnvelope } from "../../src/naa/BridgeRequestEnvelope.js";
import { BridgeResponseEnvelope } from "../../src/naa/BridgeResponseEnvelope.js";
import { InitContext } from "../../src/naa/InitContext.js";

export class MockBridge implements AuthBridge {
    private listeners: { [key: string]: ((response: string) => void)[] } = {};
    private responses: {
        [key: string]: Partial<BridgeResponseEnvelope>[];
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
                success: !response?.error,
                ...response,
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

    public addErrorResponse(method: string, error: BridgeError): void {
        this.addResponse(method, { error });
    }

    public addInitContextResponse(
        method: string,
        initContext: InitContext
    ): void {
        this.addResponse(method, { initContext });
    }

    public addAuthResultResponse(method: string, authResult: AuthResult): void {
        this.addResponse(method, authResult);
    }

    public addAccountResponse(method: string, account: AccountInfo): void {
        this.addResponse(method, { account });
    }

    private addResponse(
        method: string,
        response: Partial<BridgeResponseEnvelope>
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
