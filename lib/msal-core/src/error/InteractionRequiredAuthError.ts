/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ServerError } from "./ServerError";

export const InteractionRequiredAuthErrorMessage = {
    interactionRequired: "interaction_required",
    consentRequired: "consent_required",
    loginRequired: "login_required"
};

/**
 * Error thrown when the user is required to perform an interactive token request.
 */
export class InteractionRequiredAuthError extends ServerError {

    constructor(errorCode: string, errorMessage?: string) {
        super(errorCode, errorMessage);
        this.name = "InteractionRequiredAuthError";

        Object.setPrototypeOf(this, InteractionRequiredAuthError.prototype);
    }

    static isInteractionRequiredError(errorString: string) : boolean {
        return errorString && Object.values(InteractionRequiredAuthErrorMessage).includes(errorString);
    }

    static createLoginRequiredAuthError(errorDesc: string): InteractionRequiredAuthError {
        return new InteractionRequiredAuthError(InteractionRequiredAuthErrorMessage.loginRequired, errorDesc);
    }

    static createInteractionRequiredAuthError(errorDesc: string): InteractionRequiredAuthError {
        return new InteractionRequiredAuthError(InteractionRequiredAuthErrorMessage.interactionRequired, errorDesc);
    }

    static createConsentRequiredAuthError(errorDesc: string): InteractionRequiredAuthError {
        return new InteractionRequiredAuthError(InteractionRequiredAuthErrorMessage.consentRequired, errorDesc);
    }
}
