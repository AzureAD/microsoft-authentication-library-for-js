/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowErrorBase } from "../../../core/auth_flow/AuthFlowErrorBase.js";
import { CustomAuthApiErrorCode } from "../../../core/network_client/custom_auth_api/types/ApiErrorResponseTypes.js";

export class SignInError extends AuthFlowErrorBase {
    isUserNotFound(): boolean {
        return this.errorData.error === CustomAuthApiErrorCode.USER_NOT_FOUND;
    }

    isInvalidUsername(): boolean {
        return this.isUserInvalidError();
    }

    isPasswordIncorrect(): boolean {
        return this.isPasswordIncorrectError();
    }

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
