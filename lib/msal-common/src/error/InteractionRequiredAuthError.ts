/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { StringUtils } from "../utils/StringUtils";
import { ServerError } from "./ServerError";

/**
 * InteractionRequiredAuthErrorMessage class containing string constants used by error codes and messages.
 */
export const InteractionRequiredAuthErrorMessage = [
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
 * Error thrown when user interaction is required at the auth server.
 */
export class InteractionRequiredAuthError extends ServerError {

    constructor(errorCode: string, errorMessage?: string, subError?: string) {
        super(errorCode, errorMessage, subError);
        this.name = "InteractionRequiredAuthError";

        Object.setPrototypeOf(this, InteractionRequiredAuthError.prototype);
    }

    static isInteractionRequiredError(errorCode: string, errorString: string, subError?: string) : boolean {
        const isInteractionRequiredErrorCode = !StringUtils.isEmpty(errorCode) && InteractionRequiredAuthErrorMessage.indexOf(errorCode) > -1;
        const isInteractionRequiredSubError = !StringUtils.isEmpty(subError) && InteractionRequiredAuthSubErrorMessage.indexOf(subError) > -1;
        const isInteractionRequiredErrorDesc = !StringUtils.isEmpty(errorString) && InteractionRequiredAuthErrorMessage.some((irErrorCode) => {
            return errorString.indexOf(irErrorCode) > -1;
        });

        return isInteractionRequiredErrorCode || isInteractionRequiredErrorDesc || isInteractionRequiredSubError;
    }
}
