/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowErrorBase } from "../../../core/auth_flow/AuthFlowErrorBase.js";

export class SignInError extends AuthFlowErrorBase {
    isUserNotFound(): boolean {
        return false;
    }

    isInvalidUsername(): boolean {
        return this.isUserInvalidError();
    }

    isInvalidPassword(): boolean {
        return false;
    }

    isUnsupportedChallengeType(): boolean {
        return this.isUnsupportedChallengeTypeError();
    }
}

export class SignInSubmitPasswordError extends AuthFlowErrorBase {
    isInvalidPassword(): boolean {
        return true;
    }
}

export class SignInSubmitCodeError extends AuthFlowErrorBase {
    isInvalidCode(): boolean {
        return true;
    }
}

export class SignInResendCodeError extends AuthFlowErrorBase {}
