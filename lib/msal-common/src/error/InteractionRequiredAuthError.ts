/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthError } from "./AuthError";

/**
 * InteractionRequiredServerErrorMessage contains string constants used by error codes and messages returned by the server indicating interaction is required
 */
export const InteractionRequiredServerErrorMessage = [
    "interaction_required",
    "consent_required",
    "login_required"
];

export const InteractionRequiredAuthSubErrorMessage = [
    "message_only",
    "additional_action",
    "basic_action",
    "user_password_expired",
    "consent_required"
];

/**
 * Interaction required errors defined by the SDK
 */
export const InteractionRequiredAuthErrorMessage = {
    noTokensFoundError: {
        code: "no_tokens_found",
        desc: "No refresh token found in the cache. Please sign-in."
    },
    native_account_unavailable: {
        code: "native_account_unavailable",
        desc: "The requested account is not available in the native broker. It may have been deleted or logged out. Please sign-in again using an interactive API."
    }
};

/**
 * Error thrown when user interaction is required.
 */
export class InteractionRequiredAuthError extends AuthError {

    constructor(errorCode?: string, errorMessage?: string, subError?: string) {
        super(errorCode, errorMessage, subError);
        this.name = "InteractionRequiredAuthError";

        Object.setPrototypeOf(this, InteractionRequiredAuthError.prototype);
    }

    /**
     * Helper function used to determine if an error thrown by the server requires interaction to resolve
     * @param errorCode 
     * @param errorString 
     * @param subError 
     */
    static isInteractionRequiredError(errorCode?: string, errorString?: string, subError?: string): boolean {
        const isInteractionRequiredErrorCode = !!errorCode && InteractionRequiredServerErrorMessage.indexOf(errorCode) > -1;
        const isInteractionRequiredSubError = !!subError && InteractionRequiredAuthSubErrorMessage.indexOf(subError) > -1;
        const isInteractionRequiredErrorDesc = !!errorString && InteractionRequiredServerErrorMessage.some((irErrorCode) => {
            return errorString.indexOf(irErrorCode) > -1;
        });

        return isInteractionRequiredErrorCode || isInteractionRequiredErrorDesc || isInteractionRequiredSubError;
    }

    /**
     * Creates an error thrown when the authorization code required for a token request is null or empty.
     */
    static createNoTokensFoundError(): InteractionRequiredAuthError {
        return new InteractionRequiredAuthError(InteractionRequiredAuthErrorMessage.noTokensFoundError.code, InteractionRequiredAuthErrorMessage.noTokensFoundError.desc);
    }

    /**
     * Creates an error thrown when the native broker returns ACCOUNT_UNAVAILABLE status, indicating that the account was removed and interactive sign-in is required
     * @returns 
     */
    static createNativeAccountUnavailableError(): InteractionRequiredAuthError {
        return new InteractionRequiredAuthError(InteractionRequiredAuthErrorMessage.native_account_unavailable.code, InteractionRequiredAuthErrorMessage.native_account_unavailable.desc);
    }
}
