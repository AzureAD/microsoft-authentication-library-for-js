/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Constants } from "../utils/Constants";
import { AuthError } from "./AuthError";

export const InvalidGrantAuthErrorCodes = {
    badToken: "bad_token",
};

/**
 * InvalidGrantServerErrorMessage contains string constants used by error codes and messages returned by the server indicating interaction is required
 */
export const InvalidGrantServerErrorMessage = [
    InvalidGrantAuthErrorCodes.badToken,
];

export const InvalidGrantAuthSubErrorMessage = ["bad_token"];

const InvalidGrantAuthErrorMessages = {
    [InvalidGrantAuthErrorCodes.badToken]:
        "Server returned invalid_grant because of bad refresh token. Refresh token must be removed from cache.",
};

/**
 * Invalid Grant errors defined by the SDK
 * @deprecated Use InvalidGrantAuthErrorCodes instead
 */
export const InvalidGrantAuthErrorMessage = {
    badToken: {
        code: InvalidGrantAuthErrorCodes.badToken,
        desc: InvalidGrantAuthErrorMessages[
            InvalidGrantAuthErrorCodes.badToken
        ],
    },
};

/**
 * Error thrown when invalid grant is used.
 */
export class InvalidGrantAuthError extends AuthError {
    /**
     * The time the error occured at
     */
    timestamp: string;

    /**
     * TraceId associated with the error
     */
    traceId: string;

    constructor(
        errorCode?: string,
        errorMessage?: string,
        subError?: string,
        timestamp?: string,
        traceId?: string,
        correlationId?: string
    ) {
        super(errorCode, errorMessage, subError);
        Object.setPrototypeOf(this, InvalidGrantAuthError.prototype);

        this.timestamp = timestamp || Constants.EMPTY_STRING;
        this.traceId = traceId || Constants.EMPTY_STRING;
        this.correlationId = correlationId || Constants.EMPTY_STRING;
        this.name = "InvalidGrantAuthError";
    }
}

/**
 * Helper function used to determine if an error thrown by the server requires bad token removal
 * @param errorCode
 * @param errorString
 * @param subError
 */
export function isInvalidGrantAuthError(
    errorCode?: string,
    errorString?: string,
    subError?: string
): boolean {
    const isInvalidGrantErrorCode =
        !!errorCode && InvalidGrantServerErrorMessage.indexOf(errorCode) > -1;
    const isInvalidGrantSubError =
        !!subError && InvalidGrantAuthSubErrorMessage.indexOf(subError) > -1;
    const isInvalidGrantErrorDesc =
        !!errorString &&
        InvalidGrantServerErrorMessage.some((irErrorCode) => {
            return errorString.indexOf(irErrorCode) > -1;
        });

    return (
        isInvalidGrantErrorCode ||
        isInvalidGrantErrorDesc ||
        isInvalidGrantSubError
    );
}

/**
 * Creates an InvalidGrantAuthError
 */
export function createInvalidGrantAuthError(
    errorCode: string
): InvalidGrantAuthError {
    return new InvalidGrantAuthError(
        errorCode,
        InvalidGrantAuthErrorMessages[errorCode]
    );
}
