/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Constants } from "../utils/Constants";
import { AuthError } from "./AuthError";

/**
 * InteractionRequiredServerErrorMessage contains string constants used by error codes and messages returned by the server indicating interaction is required
 */
export const InteractionRequiredServerErrorMessage = [
    "interaction_required",
    "consent_required",
    "login_required",
];

export const InteractionRequiredAuthSubErrorMessage = [
    "message_only",
    "additional_action",
    "basic_action",
    "user_password_expired",
    "consent_required",
];

/**
 * Interaction required errors defined by the SDK
 */
export const InteractionRequiredAuthErrorMessage = {
    noTokensFoundError: {
        code: "no_tokens_found",
        desc: "No refresh token found in the cache. Please sign-in.",
    },
    native_account_unavailable: {
        code: "native_account_unavailable",
        desc: "The requested account is not available in the native broker. It may have been deleted or logged out. Please sign-in again using an interactive API.",
    },
};

/**
 * Error thrown when user interaction is required.
 */
export class InteractionRequiredAuthError extends AuthError {
    /**
     * The time the error occured at
     */
    timestamp: string;

    /**
     * TraceId associated with the error
     */
    traceId: string;

    /**
     * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-common/docs/claims-challenge.md
     *
     * A string with extra claims needed for the token request to succeed
     * web site: redirect the user to the authorization page and set the extra claims
     * web api: include the claims in the WWW-Authenticate header that are sent back to the client so that it knows to request a token with the extra claims
     * desktop application or browser context: include the claims when acquiring the token interactively
     * app to app context (client_credentials): include the claims in the AcquireTokenByClientCredential request
     */
    claims: string;

    constructor(
        errorCode?: string,
        errorMessage?: string,
        subError?: string,
        timestamp?: string,
        traceId?: string,
        correlationId?: string,
        claims?: string
    ) {
        super(errorCode, errorMessage, subError);
        Object.setPrototypeOf(this, InteractionRequiredAuthError.prototype);

        this.timestamp = timestamp || Constants.EMPTY_STRING;
        this.traceId = traceId || Constants.EMPTY_STRING;
        this.correlationId = correlationId || Constants.EMPTY_STRING;
        this.claims = claims || Constants.EMPTY_STRING;
        this.name = "InteractionRequiredAuthError";
    }

    /**
     * Helper function used to determine if an error thrown by the server requires interaction to resolve
     * @param errorCode
     * @param errorString
     * @param subError
     */
    static isInteractionRequiredError(
        errorCode?: string,
        errorString?: string,
        subError?: string
    ): boolean {
        const isInteractionRequiredErrorCode =
            !!errorCode &&
            InteractionRequiredServerErrorMessage.indexOf(errorCode) > -1;
        const isInteractionRequiredSubError =
            !!subError &&
            InteractionRequiredAuthSubErrorMessage.indexOf(subError) > -1;
        const isInteractionRequiredErrorDesc =
            !!errorString &&
            InteractionRequiredServerErrorMessage.some((irErrorCode) => {
                return errorString.indexOf(irErrorCode) > -1;
            });

        return (
            isInteractionRequiredErrorCode ||
            isInteractionRequiredErrorDesc ||
            isInteractionRequiredSubError
        );
    }

    /**
     * Creates an error thrown when the authorization code required for a token request is null or empty.
     */
    static createNoTokensFoundError(): InteractionRequiredAuthError {
        return new InteractionRequiredAuthError(
            InteractionRequiredAuthErrorMessage.noTokensFoundError.code,
            InteractionRequiredAuthErrorMessage.noTokensFoundError.desc
        );
    }

    /**
     * Creates an error thrown when the native broker returns ACCOUNT_UNAVAILABLE status, indicating that the account was removed and interactive sign-in is required
     * @returns
     */
    static createNativeAccountUnavailableError(): InteractionRequiredAuthError {
        return new InteractionRequiredAuthError(
            InteractionRequiredAuthErrorMessage.native_account_unavailable.code,
            InteractionRequiredAuthErrorMessage.native_account_unavailable.desc
        );
    }
}
