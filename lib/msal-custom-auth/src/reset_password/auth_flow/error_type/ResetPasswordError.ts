/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowErrorBase } from "../../../core/auth_flow/AuthFlowErrorBase.js";

export class ResetPasswordError extends AuthFlowErrorBase {
    isUserNotFound(): boolean {
        return false;
    }

    isInvalidUsername(): boolean {
        return this.isUserInvalidError();
    }

    isUnsupportedChallengeType(): boolean {
        return this.isUnsupportedChallengeTypeError();
    }
}

export class ResetPasswordSubmitPasswordError extends AuthFlowErrorBase {
    isInvalidPassword(): boolean {
        return true;
    }

    isPasswordResetFailed(): boolean {
        return false;
    }

    isInvalidUsername(): boolean {
        return this.isUserInvalidError();
    }
}

export class ResetPasswordSubmitCodeError extends AuthFlowErrorBase {
    isInvalidCode(): boolean {
        return true;
    }
}

export class ResetPasswordResendCodeError extends AuthFlowErrorBase {}
