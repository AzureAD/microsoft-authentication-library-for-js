/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthError } from "./AuthError.js";

/**
 * Represents network related errors
 */
export class NetworkError extends AuthError {
    publicError: AuthError;
    runtimeError: Error;
    httpStatus: number;
    responseHeaders?: Record<string, string>;

    constructor(publicError: AuthError, runtimeError: Error, httpStatus: number, responseHeaders?: Record<string, string>) {
        super(publicError.errorCode, publicError.errorMessage, publicError.subError);

        Object.setPrototypeOf(this, NetworkError.prototype);
        this.name = "NetworkError";
        this.publicError = publicError;
        this.runtimeError = runtimeError;
        this.httpStatus = httpStatus;
        this.responseHeaders = responseHeaders;
    }
}

/**
 * Creates NetworkError object for a failed network request
 * @param publicError - Error to be thrown back to the caller
 * @param runtimeError - Internal error that caused the public error
 * @param httpStatus - Status code of the network request
 * @param responseHeaders - Response headers of the network request, when available
 * @returns NetworkError object
 */
export function createNetworkError(publicError: AuthError, runtimeError: Error, httpStatus: number, responseHeaders?: Record<string, string>): NetworkError {
    return new NetworkError(publicError, runtimeError, httpStatus, responseHeaders);
}
