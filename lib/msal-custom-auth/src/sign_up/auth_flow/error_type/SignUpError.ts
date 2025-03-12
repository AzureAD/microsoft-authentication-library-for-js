/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowErrorBase } from "../../../core/auth_flow/AuthFlowErrorBase.js";

/**
 * The error occurs during sign-up.
 */
export class SignUpError extends AuthFlowErrorBase {
    /**
     * Checks if the user already exists.
     * @returns {boolean} True if the user already exists, false otherwise.
     */
    isUserAlreadyExists(): boolean {
        return this.isUserAlreadyExistsError();
    }

    /**
     * Checks if the username is invalid.
     * @returns {boolean} True if the user is invalid, false otherwise.
     */
    isInvalidUsername(): boolean {
        return this.isUserInvalidError();
    }

    /**
     * Checks if the password is invalid.
     * @returns {boolean} True if the error is due to the password being invalid, false otherwise.
     */
    isInvalidPassword(): boolean {
        return this.isInvalidNewPasswordError();
    }

    /**
     * Checks if the error is due to missing required attributes.
     * @returns {boolean} True if the error is due to missing required attributes, false otherwise.
     */
    isMissingRequiredAttributes(): boolean {
        return this.isAttributeRequiredError();
    }

    /**
     * Checks if the error is due to attribute validation failing.
     * @returns {boolean} True if the error is due to attribute validation failing, false otherwise.
     */
    isAttributesValidationFailed(): boolean {
        return this.isAttributeValidationFailedError();
    }

    /**
     * Checks if the challenge type is unsupported.
     * @returns {boolean} True if the error is due to the challenge type being unsupported, false otherwise.
     */
    isUnsupportedChallengeType(): boolean {
        return this.isUnsupportedChallengeTypeError();
    }

    /**
     * Checks if the challenge type is redirect (authentication method is not supported by by Microsoft Entra)
     * @returns {boolean} True if the challenge type is redirect, false otherwise.
     */
    isRedirect(): boolean {
        return this.isRedirectError();
    }
}

/**
 * The error occurs during sign-up submit password.
 */
export class SignUpSubmitPasswordError extends AuthFlowErrorBase {
    /**
     * Checks if the error is due to the password being invalid.
     * @returns {boolean} True if the error is due to the password being invalid, false otherwise.
     */
    isInvalidPassword(): boolean {
        return this.isPasswordIncorrectError() || this.isInvalidNewPasswordError();
    }

    /**
     * Checks if the challenge type is redirect (authentication method is not supported by by Microsoft Entra)
     * @returns {boolean} True if the challenge type is redirect, false otherwise.
     */
    isRedirect(): boolean {
        return this.isRedirectError();
    }
}

/**
 * The error occurs during sign-up submit code.
 */
export class SignUpSubmitCodeError extends AuthFlowErrorBase {
    /**
     * Checks if the error is due to the code being invalid.
     * @returns {boolean} True if the error is due to the code being invalid, false otherwise.
     */
    isInvalidCode(): boolean {
        return this.isInvalidCodeError();
    }

    /**
     * Checks if the challenge type is redirect (authentication method is not supported by by Microsoft Entra)
     * @returns {boolean} True if the challenge type is redirect, false otherwise.
     */
    isRedirect(): boolean {
        return this.isRedirectError();
    }
}

/**
 * The error occurs during sign-up submit attributes.
 */
export class SignUpSubmitAttributesError extends AuthFlowErrorBase {
    /**
     * Checks if the error is due to missing required attributes.
     * @returns {boolean} True if the error is due to missing required attributes, false otherwise.
     */
    isMissingRequiredAttributes(): boolean {
        return this.isAttributeRequiredError();
    }

    /**
     * Checks if the error is due to attribute validation failing.
     * @returns {boolean} True if the error is due to attribute validation failing, false otherwise.
     */
    isAttributesValidationFailed(): boolean {
        return this.isAttributeValidationFailedError();
    }

    /**
     * Checks if the challenge type is redirect (authentication method is not supported by by Microsoft Entra)
     * @returns {boolean} True if the challenge type is redirect, false otherwise.
     */
    isRedirect(): boolean {
        return this.isRedirectError();
    }
}

/**
 * The error occurs during sign-up resend code.
 */
export class SignUpResendCodeError extends AuthFlowErrorBase {
    /**
     * Checks if the challenge type is redirect (authentication method is not supported by by Microsoft Entra)
     * @returns {boolean} True if the challenge type is redirect, false otherwise.
     */
    isRedirect(): boolean {
        return this.isRedirectError();
    }
}
