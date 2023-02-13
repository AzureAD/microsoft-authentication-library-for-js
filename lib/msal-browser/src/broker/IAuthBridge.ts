/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * Auth bridge interface, must be available on window object injected by the host or some other means external to MSAL.js
 */
export interface IAuthBridge {
    /**
     * Sends a message to broker server and receives a reply in the promise result
     * @param payload Message payload to be sent to broker server
     */
    postMessage<T1, T2>(payload: RequestMessage<T1>): Promise<ResponseMessage<T2>>;

    /**
     * Adds a handler for an event originating from broker server. Can throw exception if handler for event type already exists.
     * @param eventType Type of event to add the listner for.
     * @param listener The handler to listen on the events.
     */
    addEventListener<T>(eventType: string, listener: AuthBridgeEventHandler<T>): void;

    /**
     * Removes a handler added by addEventListener. Can throw exception if no such handler was added
     * @param eventType Type of event handler to remove.
     */
    removeEventListener(eventType: string): void;
}

export type RequestMessage<T> = {
    /**
     * Unique identifier of request message.
     * If a response is expected for this message, the response shall have the same Id.
     */
    id: string;

    /**
     * Name of the unique method as exposed by the broker server.
     */
    messageName: string;

    /**
     * Request payload as required by the method to be invoked. It could be null for methods requiring no payload.
     */
    payload?: T;
};

export type ResponseMessage<T> = {
    /**
     * Unique identifier of the request message.
     * It should be same as the ID in the request. Broker client can use this ID to correlate responses with request.
     */
    id: string;

    /**
     * Internal error code to Identity libraries. It should not be exposed end developer code.
     * This code can be logged into the telemetry of 3P developers though.
     */
    errorCode: AuthBridgeErrorCodes;

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

export enum AuthBridgeErrorCodes {
    /**
     * The request was successfully processed.
     */
    Success = 0,

    /**
     * The response is an error.
     */
    Error = 1,

    /**
     * This error is thrown when broker server isn't able to determine the cause of error.
     */
    InvalidMessageFormat = 2,

    /**
     * This error is thrown when broker server isn't able to determine the cause of error.
     */
    UnknownError = 3,

    /**
     * The broker server has deemed the broker client to be unauthorized to make such request.
     * There can be multiple reasons ranging from clientId not allowed, broker client origin not allowed etc.
     */
    Unauthrorized = 4,

    /**
     * The reuest had a timeout while broker server was trying to process it.
     * Intentionally the control of timeout span is left to the broker server.
     */
    Timeout = 5,
}

export type AuthBridgeEventHandler<T> = (event: ResponseMessage<T>) => void;
