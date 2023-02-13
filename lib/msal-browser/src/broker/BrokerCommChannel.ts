/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthError } from "@azure/msal-common";
import { AuthBridgeErrorCodes, IAuthBridge, RequestMessage, ResponseMessage } from "./IAuthBridge";
import { BrokerMessageName, IBrokerCommChannel } from "./IBrokerCommChannel";

declare global { interface Window { authBridge: IAuthBridge; } }

export class BrokerCommChannel implements IBrokerCommChannel {
    static IsAvailable(): boolean {
        return window.authBridge !== undefined && window.authBridge !== null;
    }

    constructor() {
        if (!BrokerCommChannel.IsAvailable()) {
            throw new AuthError("NoAuthBridge", "Cannot reach broker server, no auth bridge was found.");
        }
    }

    async sendMessageWithPayloadAndGetResponse<T1, T2>(messageName: BrokerMessageName, payload: T1): Promise<T2> {
        const request: RequestMessage<T1> = {
            id: this.idGen(),
            messageName: BrokerMessageName[messageName].toString(),
            payload: payload
        };

        const response = await window.authBridge.postMessage<T1, T2 | AuthError>(request);
        if (response.errorCode === AuthBridgeErrorCodes.Success) {
            return response.payload as T2;
        }
        else if (response.errorCode === AuthBridgeErrorCodes.Error) {
            throw response.payload as AuthError;
        }
        else {
            throw this.handleAndFormatBrokerErrorResponse(response);
        }
    }

    async sendMessageAndGetResponse<T>(messageName: BrokerMessageName): Promise<T> {
        const request: RequestMessage<null> = {
            id: this.idGen(),
            messageName: BrokerMessageName[messageName].toString()
        };

        const response = await window.authBridge.postMessage(request) as ResponseMessage<T | AuthError>;
        if (response.errorCode === AuthBridgeErrorCodes.Success) {
            return response.payload as T;
        }
        if (response.errorCode === AuthBridgeErrorCodes.Error) {
            throw response.payload as AuthError;
        }
        else {
            throw this.handleAndFormatBrokerErrorResponse(response);
        }
    }

    async sendMessageWithPayload<T>(messageName: BrokerMessageName, payload: T): Promise<void> {
        const request: RequestMessage<T> = {
            id: this.idGen(),
            messageName: BrokerMessageName[messageName].toString(),
            payload: payload
        };

        const response = await window.authBridge.postMessage(request) as ResponseMessage<null | AuthError>;
        if (response.errorCode === AuthBridgeErrorCodes.Success) {
            return;
        }
        else if (response.errorCode === AuthBridgeErrorCodes.Error) {
            throw response.payload as AuthError;
        }
        else {
            throw this.handleAndFormatBrokerErrorResponse(response);
        }
    }

    async sendMessage(messageName: BrokerMessageName): Promise<void> {
        const request: RequestMessage<null> = {
            id: this.idGen(),
            messageName: BrokerMessageName[messageName].toString()
        };

        const response = await window.authBridge.postMessage(request) as ResponseMessage<null | AuthError>;
        if (response.errorCode === AuthBridgeErrorCodes.Success) {
            return;
        }
        else if (response.errorCode === AuthBridgeErrorCodes.Error) {
            throw response.payload as AuthError;
        }
        else {
            throw this.handleAndFormatBrokerErrorResponse(response);
        }
    }

    private handleAndFormatBrokerErrorResponse<T>(response: ResponseMessage<T>): Error {
        /*
         * TODO: log error and more thought on how MSAL.js will handle this error in layers above.
         * Developer should not see this error message
         */
        throw new Error(response.errorMessage);
    }

    /**
     * Generate a reasonable random (but not perfecty random) GUID
     * TODO: optimize it later, maybe using MSAL-common crypto
     */
    private idGen(): string {
        let guid = "";
        const format = "XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX";
        
        for (let i = 0; i < format.length; i++) {
            if (format[i] === "X") {
                guid += Math.trunc(Math.random() * 15).toString(16);
            }
            else {
                guid += "-";
            }
        }

        return guid;
    }
}

