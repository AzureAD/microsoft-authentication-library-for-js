/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthError } from "@azure/msal-common";
import { IAuthBridge } from "./IAuthBridge";
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
            messageName: messageName,
            payload: payload
        };

        const response = await window.authBridge.postMessage(request) as ResponseMessage<T2>;
        if (response.errorCode === BrokerErrorCodes.Success) {
            return response.payload as T2;
        }
        else {
            throw this.handleAndFormatBrokerErrorResponse(response);
        }
    }

    async sendMessageAndGetResponse<T>(messageName: BrokerMessageName): Promise<T> {
        const request: RequestMessage<null> = {
            id: this.idGen(),
            messageName: messageName
        };

        const response = await window.authBridge.postMessage(request) as ResponseMessage<T>;
        if (response.errorCode === BrokerErrorCodes.Success) {
            return response.payload as T;
        }
        else {
            throw this.handleAndFormatBrokerErrorResponse(response);
        }
    }

    async sendMessageWithPayload<T>(messageName: BrokerMessageName, payload: T): Promise<void> {
        const request: RequestMessage<T> = {
            id: this.idGen(),
            messageName: messageName,
            payload: payload
        };

        const response = await window.authBridge.postMessage(request) as ResponseMessage<null>;
        if (response.errorCode === BrokerErrorCodes.Success) {
            return;
        }
        else {
            throw this.handleAndFormatBrokerErrorResponse(response);
        }
    }

    async sendMessage(messageName: BrokerMessageName): Promise<void> {
        const request: RequestMessage<null> = {
            id: this.idGen(),
            messageName: messageName
        };

        const response = await window.authBridge.postMessage(request) as ResponseMessage<null>;
        if (response.errorCode === BrokerErrorCodes.Success) {
            return;
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

type RequestMessage<T> = {
    /**
     * Unique identifier of request message.
     * If a response is expected for this message, the response shall have the same Id.
     */
    id: string;

    /**
     * Name of the unique method as exposed by the broker server.
     */
    messageName: BrokerMessageName;

    /**
     * Request payload as required by the method to be invoked. It could be null for methods requiring no payload.
     */
    payload?: T;
};

type ResponseMessage<T> = {
    /**
     * Unique identifier of the request message.
     * It should be same as the ID in the request. Broker client can use this ID to correlate responses with request.
     */
    id: string;

    /**
     * Internal error code to Identity libraries. It should not be exposed end developer code.
     * This code can be logged into the telemetry of 3P developers though.
     */
    errorCode: BrokerErrorCodes;

    /**
     * Detailed internal error message. Could be undefined for success.
     * This message should not be exposed to the users or end developer code.
     */
    errorMessage?: string;

    /**
     * Response paylod, if there is one to be returned. 
     */
    payload?: T;
};

enum BrokerErrorCodes {
    /**
     * The request was successfully processed.
     */
    Success = 0,

    /**
     * This error is thrown when broker server isn't able to determine the cause of error.
     */
    UnknownError = 1,

    /**
     * The broker server has deemed the broker client to be unauthorized to make such request.
     * There can be multiple reasons ranging from clientId not allowed, broker client origin not allowed etc.
     */
    Unauthrorized = 2,

    /**
     * The reuest had a timeout while broker server was trying to process it.
     * Intentionally the control of timeout span is left to the broker server.
     */
    Timeout = 3,
}
