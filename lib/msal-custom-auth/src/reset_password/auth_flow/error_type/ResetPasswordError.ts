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
}

export class ResetPasswordSubmitPasswordError extends AuthFlowErrorBase {
    isInvalidPassword(): boolean {
        return this.isInvalidNewPasswordError();
    }

    isPasswordResetFailed(): boolean {
        return (
            this.errorData instanceof CustomAuthApiError &&
            (this.errorData.error === CustomAuthApiErrorCode.PASSWORD_RESET_TIMEOUT ||
                this.errorData.error === CustomAuthApiErrorCode.PASSWORD_CHANGE_FAILED)
        );
    }

    isInvalidUsername(): boolean {
        return this.isUserInvalidError();
    }
}

export class ResetPasswordSubmitCodeError extends AuthFlowErrorBase {
    isInvalidCode(): boolean {
        return this.isInvalidCodeError();
    }
}

export class ResetPasswordResendCodeError extends AuthFlowErrorBase {}
