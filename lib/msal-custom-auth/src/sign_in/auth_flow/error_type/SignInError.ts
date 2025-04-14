/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowErrorBase } from "../../../core/auth_flow/AuthFlowErrorBase.js";
import { CustomAuthApiErrorCode } from "../../../core/network_client/custom_auth_api/types/ApiErrorResponseTypes.js";

export class SignInError extends AuthFlowErrorBase {
    /**
     * Checks if the error is due to the user not being found.
     * @returns true if the error is due to the user not being found, false otherwise.
     */
    isUserNotFound(): boolean {
        return this.errorData.error === CustomAuthApiErrorCode.USER_NOT_FOUND;
    }

    /**
     * Checks if the error is due to the username being invalid.
     * @returns true if the error is due to the username being invalid, false otherwise.
     */
    isInvalidUsername(): boolean {
        return this.isUserInvalidError();
    }

    /**
     * Checks if the error is due to the provided password being incorrect.
     * @returns true if the error is due to the provided password being incorrect, false otherwise.
     */
    isPasswordIncorrect(): boolean {
        return this.isPasswordIncorrectError();
    }

    /**
     * Checks if the error is due to the provided challenge type is not supported.
     * @returns {boolean} True if the error is due to the provided challenge type is not supported, false otherwise.
     */
    isUnsupportedChallengeType(): boolean {
        return this.isUnsupportedChallengeTypeError();
    }

    /**
     * Checks if challenge type is redirect (authentication method is not supported by by Microsoft Entra)
     * @returns {boolean} True if the error is due to the challenge type being redirect, false otherwise.
     */
    isRedirectionRequired(): boolean {
        return this.isRedirectError();
    }
}

export class SignInSubmitPasswordError extends AuthFlowErrorBase {
    /**
     * Checks if the password submitted during sign-in is incorrect.
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
    isRedirectionRequired(): boolean {
        return this.isRedirectError();
    }
}
