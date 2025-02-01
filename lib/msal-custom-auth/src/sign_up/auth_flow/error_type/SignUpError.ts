/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowErrorBase } from "../../../core/auth_flow/AuthFlowErrorBase.js";

export class SignUpError extends AuthFlowErrorBase {
    isUserAlreadyExists(): boolean {
        return this.isUserAlreadyExistsError();
    }

    isInvalidUsername(): boolean {
        return this.isUserInvalidError();
    }

    isInvalidPassword(): boolean {
        return this.isInvalidNewPasswordError();
    }

    isMissingRequiredAttributes(): boolean {
        return this.isAttributeRequiredError();
    }

    isAttributesValidationFailed(): boolean {
        return this.isAttributeValidationFailedError();
    }

    isUnsupportedChallengeType(): boolean {
        return this.isUnsupportedChallengeTypeError();
    }

    isRedirect(): boolean {
        return this.isRedirectError();
    }
}

export class SignUpSubmitPasswordError extends AuthFlowErrorBase {
    isInvalidPassword(): boolean {
        return (
            this.isPasswordIncorrectError() || this.isInvalidNewPasswordError()
        );
    }

    isRedirect(): boolean {
        return this.isRedirectError();
    }
}

export class SignUpSubmitCodeError extends AuthFlowErrorBase {
    isInvalidCode(): boolean {
        return this.isInvalidCodeError();
    }

    isRedirect(): boolean {
        return this.isRedirectError();
    }
}

export class SignUpSubmitAttributesError extends AuthFlowErrorBase {
    isMissingRequiredAttributes(): boolean {
        return this.isAttributeRequiredError();
    }

    isAttributesValidationFailed(): boolean {
        return this.isAttributeValidationFailedError();
    }

    isRedirect(): boolean {
        return this.isRedirectError();
    }
}

export class SignUpResendCodeError extends AuthFlowErrorBase {
    isRedirect(): boolean {
        return this.isRedirectError();
    }
}
