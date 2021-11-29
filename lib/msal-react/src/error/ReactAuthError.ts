/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthError } from "@azure/msal-browser";

export enum ReactAuthErrorCodes {
    INVALID_INTERACTION_TYPE = "invalid_interaction_type",
    UNABLE_TO_FALLBACK_TO_INTERACTION = "unable_to_fallback_to_interaction"
}

const ReactAuthErrorMessage = {
    [ReactAuthErrorCodes.INVALID_INTERACTION_TYPE]: "The provided interaction type is invalid.",
    [ReactAuthErrorCodes.UNABLE_TO_FALLBACK_TO_INTERACTION]: "Interaction is required, but another interaction is currently in progress. Please try again when the current interaction is complete."
};

export class ReactAuthError extends AuthError {
    constructor(errorCode: string, errorMessage?: string) {
        super(errorCode, errorMessage);

        Object.setPrototypeOf(this, ReactAuthError.prototype);
        this.name = "ReactAuthError";
    }

    static createReactAuthError(code: ReactAuthErrorCodes): ReactAuthError {
        return new ReactAuthError(code, ReactAuthErrorMessage[code]);
    }
}
