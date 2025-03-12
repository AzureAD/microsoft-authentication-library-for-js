/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowErrorBase } from "../../../core/auth_flow/AuthFlowErrorBase.js";

export class SignUpError extends AuthFlowErrorBase {
    isUserAlreadyExists(): boolean {
        return this.isUserAlreadyExistsError();
    }

    isInvalidUsername(): boolean {
        return this.isUserInvalidError();
    }

    isInvalidPassword(): boolean {
        return this.isInvalidNewPasswordError();
    }

    isMissingRequiredAttributes(): boolean {
        return this.isAttributeRequiredError();
    }

    isAttributesValidationFailed(): boolean {
        return this.isAttributeValidationFailedError();
    }

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
    isRedirect(): boolean {
        return this.isRedirectError();
    }
}

export class SignUpSubmitCodeError extends AuthFlowErrorBase {
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

export class SignUpSubmitAttributesError extends AuthFlowErrorBase {
    isMissingRequiredAttributes(): boolean {
        return this.isAttributeRequiredError();
    }

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

export class SignUpResendCodeError extends AuthFlowErrorBase {
    /**
     * Checks if the challenge type is redirect (authentication method is not supported by by Microsoft Entra)
     * @returns {boolean} True if the challenge type is redirect, false otherwise.
     */
    isRedirect(): boolean {
        return this.isRedirectError();
    }
}
