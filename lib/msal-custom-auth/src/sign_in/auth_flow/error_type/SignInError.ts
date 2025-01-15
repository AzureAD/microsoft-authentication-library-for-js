/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowErrorBase } from "../../../core/auth_flow/AuthFlowErrorBase.js";

export class SignInError extends AuthFlowErrorBase {
    isUserNotFound(): boolean {
        return this.errorData.error === this.errorCodes.USER_NOT_FOUND;
    }

    isInvalidUsername(): boolean {
        return this.isUserInvalidError();
    }

    isInvalidPassword(): boolean {
        return this.isInvalidPasswordError();
    }

    isUnsupportedChallengeType(): boolean {
        return this.isUnsupportedChallengeTypeError();
    }

    isRedirect(): boolean {
        return this.isRedirectError();
    }
}

export class SignInSubmitPasswordError extends AuthFlowErrorBase {
    isInvalidPassword(): boolean {
        return this.isInvalidPasswordError();
    }
}

export class SignInSubmitCodeError extends AuthFlowErrorBase {
    isInvalidCode(): boolean {
        return this.isInvalidCodeError();
    }
}

export class SignInResendCodeError extends AuthFlowErrorBase {}
