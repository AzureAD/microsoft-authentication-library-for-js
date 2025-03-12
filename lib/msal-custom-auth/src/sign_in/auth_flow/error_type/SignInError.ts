/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowErrorBase } from "../../../core/auth_flow/AuthFlowErrorBase.js";
import { CustomAuthApiErrorCode } from "../../../core/network_client/custom_auth_api/types/ApiErrorResponseTypes.js";

/**
 * The error occurs during sign-in.
 */
export class SignInError extends AuthFlowErrorBase {
    /**
     * Checks if the user is not found.
     * @returns {boolean} True if the error is due to the user not being found, false otherwise.
     */
    isUserNotFound(): boolean {
        return this.errorData.error === CustomAuthApiErrorCode.USER_NOT_FOUND;
    }

    /**
     * Checks if the username is invalid.
     * @returns {boolean} True if the error is due to the username being invalid, false otherwise.
     */
    isInvalidUsername(): boolean {
        return this.isUserInvalidError();
    }

    /**
     * Checks if the password is incorrect.
     * @returns {boolean} True if the error is due to the password being incorrect, false otherwise.
     */
    isPasswordIncorrect(): boolean {
        return this.isPasswordIncorrectError();
    }

    /**
     * Checks if the challenge type is unsupported.
     * @returns {boolean} True if the error is due to the challenge type is not supported, false otherwise.
     */
    isUnsupportedChallengeType(): boolean {
        return this.isUnsupportedChallengeTypeError();
    }

    /**
     * Checks if challenge type is redirect (authentication method is not supported by by Microsoft Entra)
     * @returns {boolean} True if the error is due to the challenge type being redirect, false otherwise.
     */
    isRedirect(): boolean {
        return this.isRedirectError();
    }
}

/**
 * The error occurs during sign-in submit password.
 */
export class SignInSubmitPasswordError extends AuthFlowErrorBase {
    /**
     * Checks if the password submitted during sign-in is invalid.
     * @returns {boolean} True if the error is due to the password being invalid, false otherwise.
     */
    isInvalidPassword(): boolean {
        return this.isPasswordIncorrectError();
    }
}

export class SignInSubmitCodeError extends AuthFlowErrorBase {
    /**
     * Checks if the code submitted during sign-in is invalid.
     * @returns {boolean} True if the error is due to the code being invalid, false otherwise.
     */
    isInvalidCode(): boolean {
        return this.isInvalidCodeError();
    }
}

export class SignInResendCodeError extends AuthFlowErrorBase {
    /**
     * Checks if challenge type is redirect (authentication method is not supported by by Microsoft Entra)
     * @returns {boolean} True if the error is due to the challenge type being redirect, false otherwise.
     */
    isRedirect(): boolean {
        return this.isRedirectError();
    }
}
