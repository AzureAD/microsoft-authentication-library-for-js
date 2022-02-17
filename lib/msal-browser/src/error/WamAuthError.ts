/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthError, InteractionRequiredAuthError } from "@azure/msal-common";
import { BrowserAuthError } from "./BrowserAuthError";

export type OSError = {
    error: number;
    protocol_error: string;
    properties: object;
    status: string;
    retryable?: boolean;
};

export enum WamStatusCode {
    USER_INTERACTION_REQUIRED = "USER_INTERACTION_REQUIRED",
    USER_CANCEL = "USER_CANCEL",
    NO_NETWORK = "NO_NETWORK",
    TRANSIENT_ERROR = "TRANSIENT_ERROR",
    PERSISTENT_ERROR = "PERSISTENT_ERROR", 
}

export const WamAuthErrorMessage = {
    extensionError: {
        code: "ContentError"
    }
};

export class WamAuthError extends AuthError {
    ext: OSError | undefined;

    constructor(errorCode: string, description: string, ext?: OSError) {
        super(errorCode, description);

        Object.setPrototypeOf(this, WamAuthError.prototype);
        this.name = "WamAuthError";
        this.ext = ext;
    }

    /**
     * These errors should result in a fallback to the 'standard' browser based auth flow.
     */
    isFatal(): boolean {
        if (this.ext && this.ext.status && this.ext.status === WamStatusCode.PERSISTENT_ERROR) {
            return true;
        }
        
        switch (this.errorCode) {
            case WamAuthErrorMessage.extensionError.code:
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
    static createError(code: string, description: string, ext?: OSError): AuthError {
        if (ext && ext.status) {
            switch (ext.status) {
                case WamStatusCode.USER_INTERACTION_REQUIRED:
                    return new InteractionRequiredAuthError(code, description);
                case WamStatusCode.USER_CANCEL:
                    return BrowserAuthError.createUserCancelledError();
                case WamStatusCode.NO_NETWORK:
                    return BrowserAuthError.createNoNetworkConnectivityError();
            }
        }

        return new WamAuthError(code, description, ext);
    }
}
