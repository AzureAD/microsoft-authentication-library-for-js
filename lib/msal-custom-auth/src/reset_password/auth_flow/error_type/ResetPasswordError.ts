/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowErrorBase } from "../../../core/auth_flow/AuthFlowErrorBase.js";
import { CustomAuthApiError } from "../../../core/error/CustomAuthApiError.js";
import { CustomAuthApiErrorCode } from "../../../core/network_client/custom_auth_api/types/ApiErrorResponseTypes.js";

/**
 * The error occurs during reset password.
 */
export class ResetPasswordError extends AuthFlowErrorBase {
    /**
     * Checks if the user is not found.
     * @returns {boolean} True if the user is not found, false otherwise.
     */
    isUserNotFound(): boolean {
        return this.isUserNotFoundError();
    }

    /**
     * Checks if the username is invalid.
     * @returns {boolean} True if the user is not found, false otherwise.
     */
    isInvalidUsername(): boolean {
        return this.isUserInvalidError();
    }

    /**
     * Checks if the challenge type is unsupported.
     * @returns {boolean} True if the challenge type is unsupported, false otherwise.
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
 * The error occurs during reset password submit password.
 */
export class ResetPasswordSubmitPasswordError extends AuthFlowErrorBase {
    /**
     * Checks if the new password is invalid.
     * @returns {boolean} True if the new password is invalid, false otherwise.
     */
    isInvalidPassword(): boolean {
        return this.isInvalidNewPasswordError() || this.isPasswordIncorrectError();
    }

    /**
     * Checks if the password reset failed.
     * @returns {boolean} True if the password reset failed, false otherwise.
     */
    isPasswordResetFailed(): boolean {
        return (
            this.errorData instanceof CustomAuthApiError &&
            (this.errorData.error === CustomAuthApiErrorCode.PASSWORD_RESET_TIMEOUT ||
                this.errorData.error === CustomAuthApiErrorCode.PASSWORD_CHANGE_FAILED)
        );
    }
}

/**
 * The error occurs during reset password submit code.
 */
export class ResetPasswordSubmitCodeError extends AuthFlowErrorBase {
    /**
     * Checks if submitted code during resetting password is invalid.
     * @returns {boolean} True if submitted code is invalid, false otherwise.
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
 * The error occurs during reset password resend code.
 */
export class ResetPasswordResendCodeError extends AuthFlowErrorBase {
    /**
     * Checks if the challenge type is redirect (authentication method is not supported by by Microsoft Entra)
     * @returns {boolean} True if the challenge type is redirect, false otherwise.
     */
    isRedirect(): boolean {
        return this.isRedirectError();
    }
}
