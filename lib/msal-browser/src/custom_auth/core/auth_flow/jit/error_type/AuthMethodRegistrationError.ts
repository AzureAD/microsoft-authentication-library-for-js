/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthActionErrorBase } from "../../AuthFlowErrorBase.js";

/**
 * Error that occurred during authentication method challenge request.
 */
export class AuthMethodRegistrationChallengeMethodError extends AuthActionErrorBase {
    /**
     * Checks if the input for auth method registration is incorrect.
     * @returns true if the input is incorrect, false otherwise.
     */
    isInvalidInput(): boolean {
        return this.isInvalidAuthMethodRegistrationInputError();
    }
}

/**
 * Error that occurred during authentication method challenge submission.
 */
export class AuthMethodRegistrationSubmitChallengeError extends AuthActionErrorBase {
    /**
     * Checks if the submitted challenge code is incorrect.
     * @returns true if the challenge code is incorrect, false otherwise.
     */
    isIncorrectChallenge(): boolean {
        return this.isInvalidCodeError();
    }
}
