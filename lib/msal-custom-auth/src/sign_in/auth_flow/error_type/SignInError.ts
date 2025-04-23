/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowErrorBase } from "../../../core/auth_flow/AuthFlowErrorBase.js";

export class SignInError extends AuthFlowErrorBase {
    /**
     * Checks if the error is due to the user not found.
     * @returns {boolean} True if the error is due to the user not found, false otherwise.
     */
    isUserNotFound(): boolean {
        return this.isUserNotFoundError();
    }

    /**
     * Checks if the error is due to the username being invalid.
     * @returns {boolean} True if the error is due to the username being invalid, false otherwise.
     */
    isInvalidUsername(): boolean {
        return this.isUserInvalidError();
    }

    /**
     * Checks if the error is due to the password being incorrect.
     * @returns {boolean} True if the error is due to the password being incorrect, false otherwise.
     */
    isIncorrectPassword(): boolean {
        return this.isPasswordIncorrectError();
    }

    /**
     * Checks if the error is due to the provided challenge type not being supported.
     * @returns {boolean} True if the error is due to the provided challenge type not being supported, false otherwise.
     */
    isUnsupportedChallengeType(): boolean {
        return this.isUnsupportedChallengeTypeError();
    }

    /**
     * Check if client app supports the challenge type configured in Entra.
     * @returns {boolean} True if "loginPopup" function is required to continue the operation.
     */
    isRedirectRequired(): boolean {
        return this.isRedirectError();
    }
}

export class SignInSubmitPasswordError extends AuthFlowErrorBase {
    /**
     * Checks if the error is due to the password being incorrect.
     * @returns {boolean} True if the error is due to the password being incorrect, false otherwise.
     */
    isIncorrectPassword(): boolean {
        return this.isPasswordIncorrectError();
    }

    /**
     * Check if client app supports the challenge type configured in Entra.
     * @returns {boolean} True if "loginPopup" function is required to continue the operation.
     */
    isRedirectRequired(): boolean {
        return this.isRedirectError();
    }
}

export class SignInSubmitCodeError extends AuthFlowErrorBase {
    /**
     * Checks if the provided code is invalid.
     * @returns {boolean} True if the provided code is invalid, false otherwise.
     */
    isInvalidCode(): boolean {
        return this.isInvalidCodeError();
    }

    /**
     * Check if client app supports the challenge type configured in Entra.
     * @returns {boolean} True if "loginPopup" function is required to continue the operation.
     */
    isRedirectRequired(): boolean {
        return this.isRedirectError();
    }
}

export class SignInResendCodeError extends AuthFlowErrorBase {
    /**
     * Check if client app supports the challenge type configured in Entra.
     * @returns {boolean} True if "loginPopup" function is required to continue the operation.
     */
    isRedirectRequired(): boolean {
        return this.isRedirectError();
    }
}
