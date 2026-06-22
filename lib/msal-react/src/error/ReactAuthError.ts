/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthError } from "@azure/msal-browser";

export const ReactAuthErrorMessage = {
    invalidInteractionType: {
        code: "invalid_interaction_type",
        desc: "The provided interaction type is invalid.",
    },
    unableToFallbackToInteraction: {
        code: "unable_to_fallback_to_interaction",
        desc: "Interaction is required but another interaction is already in progress. Please try again when the current interaction is complete.",
    },
};

export class ReactAuthError extends AuthError {
    constructor(
        errorCode: string,
        correlationId: string,
        errorMessage?: string
    ) {
        super(errorCode, correlationId, errorMessage);

        Object.setPrototypeOf(this, ReactAuthError.prototype);
        this.name = "ReactAuthError";
    }

    static createInvalidInteractionTypeError(
        correlationId?: string
    ): ReactAuthError {
        return new ReactAuthError(
            ReactAuthErrorMessage.invalidInteractionType.code,
            correlationId || "",
            ReactAuthErrorMessage.invalidInteractionType.desc
        );
    }

    static createUnableToFallbackToInteractionError(
        correlationId?: string
    ): ReactAuthError {
        return new ReactAuthError(
            ReactAuthErrorMessage.unableToFallbackToInteraction.code,
            correlationId || "",
            ReactAuthErrorMessage.unableToFallbackToInteraction.desc
        );
    }
}
