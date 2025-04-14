/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowErrorBase } from "../../../core/auth_flow/AuthFlowErrorBase.js";

export class SignUpError extends AuthFlowErrorBase {
    /**
     * Checks if the error is due to the user already exists.
     * @returns {boolean} True if the error is due to the user already exists, false otherwise.
     */
    isUserAlreadyExists(): boolean {
        return this.isUserAlreadyExistsError();
    }

    /**
     * Checks if the error is due to the username is invalid.
     * @returns {boolean} True if the error is due to the user is invalid, false otherwise.
     */
    isInvalidUsername(): boolean {
        return this.isUserInvalidError();
    }

    /**
     * Checks if the error is due to the password being invalid or incorrect.
     * @returns {boolean} True if the error is due to the password being invalid, false otherwise.
     */
    isInvalidPassword(): boolean {
        return this.isInvalidNewPasswordError();
    }

    /**
     * Checks if the error is due to the required attributes are missing.
     * @returns {boolean} True if the error is due to the required attributes are missing, false otherwise.
     */
    isMissingRequiredAttributes(): boolean {
        return this.isAttributeRequiredError();
    }

    /**
     * Checks if the error is due to the attributes validation failed.
     * @returns {boolean} True if the error is due to the attributes validation failed, false otherwise.
     */
    isAttributesValidationFailed(): boolean {
        return this.isAttributeValidationFailedError();
    }

    /**
     * Checks if the error is due to the provided challenge type is not supported.
     * @returns {boolean} True if the error is due to the provided challenge type is not supported, false otherwise.
     */
    isUnsupportedChallengeType(): boolean {
        return this.isUnsupportedChallengeTypeError();
    }

    /**
     * Checks if the challenge type is redirect (authentication method is not supported by by Microsoft Entra)
     * @returns {boolean} True if the challenge type is redirect, false otherwise.
     */
    isRedirectionRequired(): boolean {
        return this.isRedirectError();
    }
}

export class SignUpSubmitPasswordError extends AuthFlowErrorBase {
    /**
     * Checks if the error is due to the password being invalid or incorrect.
     * @returns {boolean} True if the error is due to the password being invalid, false otherwise.
     */
    isInvalidPassword(): boolean {
        return this.isPasswordIncorrectError() || this.isInvalidNewPasswordError();
    }

    /**
     * Checks if the challenge type is redirect (authentication method is not supported by by Microsoft Entra)
     * @returns {boolean} True if the challenge type is redirect, false otherwise.
     */
    isRedirectionRequired(): boolean {
        return this.isRedirectError();
    }
}

export class SignUpSubmitCodeError extends AuthFlowErrorBase {
    /**
     * Checks if the provided code is invalid.
     * @returns {boolean} True if the provided code is invalid, false otherwise.
     */
    isInvalidCode(): boolean {
        return this.isInvalidCodeError();
    }

    /**
     * Checks if the challenge type is redirect (authentication method is not supported by by Microsoft Entra)
     * @returns {boolean} True if the challenge type is redirect, false otherwise.
     */
    isRedirectionRequired(): boolean {
        return this.isRedirectError();
    }
}

export class SignUpSubmitAttributesError extends AuthFlowErrorBase {
    /**
     * Checks if the error is due to the required attributes are missing.
     * @returns {boolean} True if the error is due to the required attributes are missing, false otherwise.
     */
    isMissingRequiredAttributes(): boolean {
        return this.isAttributeRequiredError();
    }

    /**
     * Checks if the error is due to the attributes validation failed.
     * @returns {boolean} True if the error is due to the attributes validation failed, false otherwise.
     */
    isAttributesValidationFailed(): boolean {
        return this.isAttributeValidationFailedError();
    }

    /**
     * Checks if the challenge type is redirect (authentication method is not supported by by Microsoft Entra)
     * @returns {boolean} True if the challenge type is redirect, false otherwise.
     */
    isRedirectionRequired(): boolean {
        return this.isRedirectError();
    }
}

export class SignUpResendCodeError extends AuthFlowErrorBase {
    /**
     * Checks if the challenge type is redirect (authentication method is not supported by by Microsoft Entra)
     * @returns {boolean} True if the challenge type is redirect, false otherwise.
     */
    isRedirectionRequired(): boolean {
        return this.isRedirectError();
    }
}
