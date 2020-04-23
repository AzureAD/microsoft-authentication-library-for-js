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
    interactionRequired: "interaction_required",
    consentRequired: "consent_required",
    loginRequired: "login_required"
};

export const InteractionRequiredAuthSubErrorMessage = {
    messageOnly: "message_only",
    additionalAction: "additional_action",
    basicAction: "basic_action",
    userPasswordExpired: "user_password_expired",
    consentRequired: "consent_required"
};

/**
 * Error thrown when user interaction is required at the auth server.
 */
export class InteractionRequiredAuthError extends ServerError {
    subError: string;

    constructor(errorCode: string, errorMessage?: string, subError?: string) {
        super(errorCode, errorMessage);
        this.name = "InteractionRequiredAuthError";
        this.subError = InteractionRequiredAuthError.validateSubError(subError);

        Object.setPrototypeOf(this, InteractionRequiredAuthError.prototype);
    }

    static validateSubError(subError: string): string {
        if (subError && Object.values(InteractionRequiredAuthSubErrorMessage).includes(subError)) {
            return subError;
        }

        return "";
    }

    static isInteractionRequiredError(errorCode: string, errorString: string, subError?: string) : boolean {
        const isInteractionRequiredErrorCode = !StringUtils.isEmpty(errorCode) && Object.values(InteractionRequiredAuthErrorMessage).includes(errorCode);
        const isInteractionRequiredSubError = !StringUtils.isEmpty(subError) && Object.values(InteractionRequiredAuthSubErrorMessage).includes(subError);
        const isInteractionRequiredErrorDesc = !StringUtils.isEmpty(errorString) && Object.values(InteractionRequiredAuthErrorMessage).some((irErrorCode) => {
            return errorString.indexOf(irErrorCode) > -1;
        });

        return isInteractionRequiredErrorCode || isInteractionRequiredErrorDesc || isInteractionRequiredSubError;
    }
}
