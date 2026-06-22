/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    AuthError,
    InteractionRequiredAuthError,
    InteractionRequiredAuthErrorCodes,
    createInteractionRequiredAuthError,
} from "@azure/msal-common/browser";
import {
    createBrowserAuthError,
    BrowserAuthErrorCodes,
    getDefaultErrorMessage,
} from "./BrowserAuthError.js";

import * as NativeAuthErrorCodes from "./NativeAuthErrorCodes.js";
import * as NativeStatusCodes from "../broker/nativeBroker/NativeStatusCodes.js";
export { NativeAuthErrorCodes };

export type OSError = {
    error?: number;
    protocol_error?: string;
    properties?: object;
    status?: string;
    retryable?: boolean;
};

const INVALID_METHOD_ERROR = -2147186943;

export class NativeAuthError extends AuthError {
    ext: OSError | undefined;

    constructor(
        errorCode: string,
        correlationId: string,
        description?: string,
        ext?: OSError
    ) {
        super(
            errorCode,
            correlationId,
            description || getDefaultErrorMessage(errorCode)
        );

        Object.setPrototypeOf(this, NativeAuthError.prototype);
        this.name = "NativeAuthError";
        this.ext = ext;
    }
}

/**
 * These errors should result in a fallback to the 'standard' browser based auth flow.
 */
export function isFatalNativeAuthError(error: NativeAuthError): boolean {
    if (
        error.ext &&
        error.ext.status &&
        error.ext.status === NativeStatusCodes.DISABLED
    ) {
        return true;
    }

    if (
        error.ext &&
        error.ext.error &&
        error.ext.error === INVALID_METHOD_ERROR
    ) {
        return true;
    }

    switch (error.errorCode) {
        case NativeAuthErrorCodes.contentError:
        case NativeAuthErrorCodes.pageException:
            return true;
        default:
            return false;
    }
}

/**
 * Create the appropriate error object based on the WAM status code.
 * @param code
 * @param description
 * @param ext
 * @returns
 */
export function createNativeAuthError(
    code: string,
    correlationId: string,
    description?: string,
    ext?: OSError
): AuthError {
    let error: AuthError;
    if (ext && ext.status) {
        switch (ext.status) {
            case NativeStatusCodes.ACCOUNT_UNAVAILABLE:
                error = createInteractionRequiredAuthError(
                    InteractionRequiredAuthErrorCodes.nativeAccountUnavailable,
                    correlationId,
                    getDefaultErrorMessage(code)
                );
                break;
            case NativeStatusCodes.USER_INTERACTION_REQUIRED:
                error = new InteractionRequiredAuthError(
                    code,
                    correlationId,
                    description
                );
                break;
            case NativeStatusCodes.USER_CANCEL:
                error = createBrowserAuthError(
                    BrowserAuthErrorCodes.userCancelled,
                    correlationId
                );
                break;
            case NativeStatusCodes.NO_NETWORK:
                error = createBrowserAuthError(
                    BrowserAuthErrorCodes.noNetworkConnectivity,
                    correlationId
                );
                break;
            case NativeStatusCodes.UI_NOT_ALLOWED:
                error = createInteractionRequiredAuthError(
                    InteractionRequiredAuthErrorCodes.uiNotAllowed,
                    correlationId
                );
                break;
            default:
                error = new NativeAuthError(
                    code,
                    correlationId,
                    description,
                    ext
                );
        }
        return error;
    }

    error = new NativeAuthError(code, correlationId, description, ext);
    return error;
}
