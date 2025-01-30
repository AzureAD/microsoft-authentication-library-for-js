/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowErrorBase } from "../../../core/auth_flow/AuthFlowErrorBase.js";

export class SignUpError extends AuthFlowErrorBase {
    isUserAlreadyExists(): boolean {
        return false;
    }

    isInvalidUsername(): boolean {
        return this.isUserInvalidError();
    }

    isInvalidPassword(): boolean {
        return false;
    }

    isInvalidAttributes(): boolean {
        return false;
    }

    isUnsupportedChallengeType(): boolean {
        return this.isUnsupportedChallengeTypeError();
    }
}

export class SignUpSubmitPasswordError extends AuthFlowErrorBase {
    isInvalidPassword(): boolean {
        return false;
    }
}

export class SignUpSubmitCodeError extends AuthFlowErrorBase {
    isInvalidCode(): boolean {
        return false;
    }
}

export class SignUpSubmitAttributesError extends AuthFlowErrorBase {
    isInvalidAtrtributes(): boolean {
        return false;
    }

    isMissingRequiredAttributes(): boolean {
        return false;
    }
}

export class SignUpResendCodeError extends AuthFlowErrorBase {}
