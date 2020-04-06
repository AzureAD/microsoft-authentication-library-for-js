/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ClientAuthError } from "./ClientAuthError";

/**
 * AuthenticationRequiredError class containing string constants used by error codes and messages.
 */
export const AuthenticationRequiredErrorMessage = {
    refreshTokenExpired: {
        code: "refresh_token_expired",
        desc: "Refresh token is expired. If you still have a session, you can call ssoSilent - otherwise you need to use an interactive API."
    },
    interactionRequired: {
        code: "interaction_required"
    },
    consentRequired: {
        code: "consent_required"
    },
    loginRequired: {
        code: "login_required"
    }
};

export class AuthenticationRequiredError extends ClientAuthError {

    constructor(errorCode: string, errorMessage?: string) {
        super(errorCode, errorMessage);
        this.name = "AuthenticationRequiredError";

        Object.setPrototypeOf(this, AuthenticationRequiredError.prototype);
    }

    static isInteractionRequiredError(errorCode: string, errorString: string) : boolean {
        const interactionRequiredCodes = [
            AuthenticationRequiredErrorMessage.interactionRequired.code,
            AuthenticationRequiredErrorMessage.consentRequired.code,
            AuthenticationRequiredErrorMessage.loginRequired.code
        ];

        const isInteractionRequiredErrorCode = errorCode && interactionRequiredCodes.indexOf(errorCode) > -1;
        const isInteractionRequiredErrorDesc = errorString && interactionRequiredCodes.indexOf(errorString) > -1;

        return isInteractionRequiredErrorCode || isInteractionRequiredErrorDesc;
    }

    /**
     * Creates an error thrown when the requested token set has an expired access and refresh token.
     * @param caughtError 
     */
    static createRefreshTokenExpiredError(): ClientAuthError {
        return new ClientAuthError(AuthenticationRequiredErrorMessage.refreshTokenExpired.code,
            AuthenticationRequiredErrorMessage.refreshTokenExpired.desc);
    }
}
