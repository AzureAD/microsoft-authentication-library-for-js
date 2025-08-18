/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthActionErrorBase } from "../../AuthFlowErrorBase.js";

abstract class AuthMethodRegistrationError extends AuthActionErrorBase {
    isRedirectRequired(): boolean {
        return this.isRedirectError();
    }
}

/**
 * Error that occurred during authentication method challenge request.
 */
export class AuthMethodRegistrationChallengeMethodError extends AuthMethodRegistrationError {
    /**
     * Checks if the verification contact provided is incorrect.
     * @returns true if the verification contact is incorrect, false otherwise.
     */
    isIncorrectVerificationContact(): boolean {
        return this.isIncorrectVerificationContactError();
    }
}

/**
 * Error that occurred during authentication method challenge submission.
 */
export class AuthMethodRegistrationSubmitChallengeError extends AuthMethodRegistrationError {
    /**
     * Checks if the submitted challenge code is incorrect.
     * @returns true if the challenge code is incorrect, false otherwise.
     */
    isIncorrectChallenge(): boolean {
        return this.isInvalidCodeError();
    }
}
