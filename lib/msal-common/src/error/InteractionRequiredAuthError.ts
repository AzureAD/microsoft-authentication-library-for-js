/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { StringUtils } from "../utils/StringUtils";
import { ServerError } from "./ServerError";

/**
 * InteractionRequiredAuthErrorMessage class containing string constants used by error codes and messages.
 */
export const InteractionRequiredAuthErrorMessage = {
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

/**
 * Error thrown when user interaction is required at the auth server.
 */
export class InteractionRequiredAuthError extends ServerError {

    constructor(errorCode: string, errorMessage?: string) {
        super(errorCode, errorMessage);
        this.name = "InteractionRequiredAuthError";

        Object.setPrototypeOf(this, InteractionRequiredAuthError.prototype);
    }

    static isInteractionRequiredError(errorCode: string, errorString: string) : boolean {
        const interactionRequiredCodes = [
            InteractionRequiredAuthErrorMessage.interactionRequired.code,
            InteractionRequiredAuthErrorMessage.consentRequired.code,
            InteractionRequiredAuthErrorMessage.loginRequired.code
        ];

        const isInteractionRequiredErrorCode = !StringUtils.isEmpty(errorCode) && interactionRequiredCodes.indexOf(errorCode) > -1;
        const isInteractionRequiredErrorDesc = !StringUtils.isEmpty(errorString) && interactionRequiredCodes.some((irErrorCode) => {
            return errorString.indexOf(irErrorCode) > -1;
        });

        return isInteractionRequiredErrorCode || isInteractionRequiredErrorDesc;
    }
}
