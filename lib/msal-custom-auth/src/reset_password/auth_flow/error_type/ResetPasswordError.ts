/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowErrorBase } from "../../../core/auth_flow/AuthFlowErrorBase.js";
import { CustomAuthApiError } from "../../../core/error/CustomAuthApiError.js";
import { CustomAuthApiErrorCode } from "../../../core/network_client/custom_auth_api/types/ApiErrorResponseTypes.js";

export class ResetPasswordError extends AuthFlowErrorBase {
    isUserNotFound(): boolean {
        return this.isUserNotFoundError();
    }

    isInvalidUsername(): boolean {
        return this.isUserInvalidError();
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

export class ResetPasswordSubmitPasswordError extends AuthFlowErrorBase {
    /**
     * Checks if the new password is invalid or incorrect.
     * @returns {boolean} True if the new password is invalid, false otherwise.
     */
    isInvalidPassword(): boolean {
        return this.isInvalidNewPasswordError() || this.isPasswordIncorrectError();
    }

    /**
     * Checks if the password reset failed due to reset timeout or password change failed.
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

export class ResetPasswordSubmitCodeError extends AuthFlowErrorBase {
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

export class ResetPasswordResendCodeError extends AuthFlowErrorBase {
    /**
     * Checks if the challenge type is redirect (authentication method is not supported by by Microsoft Entra)
     * @returns {boolean} True if the challenge type is redirect, false otherwise.
     */
    isRedirect(): boolean {
        return this.isRedirectError();
    }
}
