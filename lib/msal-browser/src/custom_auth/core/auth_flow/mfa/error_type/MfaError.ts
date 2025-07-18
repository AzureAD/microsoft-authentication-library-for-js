/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthActionErrorBase } from "../../AuthFlowErrorBase.js";

/**
 * Base class for MFA-related errors.
 */
abstract class MfaError extends AuthActionErrorBase {
    /**
     * Checks if the error requires a redirect to complete authentication.
     * @returns true if redirect is required, false otherwise.
     */
    isRedirectRequired(): boolean {
        return this.isRedirectError();
    }
}

/**
 * Error that occurred during MFA challenge request.
 */
export class MfaRequestChallengeError extends MfaError {}

/**
 * Error that occurred during MFA challenge submission.
 */
export class MfaSubmitChallengeError extends MfaError {
    /**
     * Checks if the submitted code (e.g., OTP code) is invalid.
     * @returns true if the code is invalid, false otherwise.
     */
    isInvalidCode(): boolean {
        return this.isInvalidCodeError();
    }
}

/**
 * Error that occurred while getting authentication methods.
 */
export class MfaGetAuthMethodsError extends MfaError {}
