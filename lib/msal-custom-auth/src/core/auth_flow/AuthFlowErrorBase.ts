/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthApiError, RedirectError } from "../error/CustomAuthApiError.js";
import { CustomAuthError } from "../error/CustomAuthError.js";
import { InvalidArgumentError } from "../error/InvalidArgumentError.js";
import {
    CustomAuthApiErrorCode,
    CustomAuthApiSuberror,
} from "../network_client/custom_auth_api/types/ApiErrorResponseTypes.js";
/**
 * Base class for all auth flow errors.
 */
export class AuthFlowErrorBase {
    constructor(public errorData: CustomAuthError) {}

    protected isUserNotFoundError(): boolean {
        return this.errorData.error === CustomAuthApiErrorCode.USER_NOT_FOUND;
    }

    protected isUserInvalidError(): boolean {
        return (
            (this.errorData instanceof InvalidArgumentError && this.errorData.errorDescription?.includes("username")) ||
            (this.errorData instanceof CustomAuthApiError &&
                !!this.errorData.errorDescription?.includes("username parameter is empty or not valid") &&
                !!this.errorData.errorCodes?.includes(90100))
        );
    }

    protected isUnsupportedChallengeTypeError(): boolean {
        return (
            (this.errorData.error === CustomAuthApiErrorCode.INVALID_REQUEST &&
                (this.errorData.errorDescription?.includes(
                    "The challenge_type list parameter contains an unsupported challenge type",
                ) ??
                    false)) ||
            this.errorData.error === CustomAuthApiErrorCode.UNSUPPORTED_CHALLENGE_TYPE
        );
    }

    protected isPasswordIncorrectError(): boolean {
        const isIncorrectPassword =
            this.errorData.error === CustomAuthApiErrorCode.INVALID_GRANT &&
            this.errorData instanceof CustomAuthApiError &&
            (this.errorData.errorCodes ?? []).includes(50126);

        const isPasswordEmpty =
            this.errorData instanceof InvalidArgumentError &&
            this.errorData.errorDescription?.includes("password") === true;

        return isIncorrectPassword || isPasswordEmpty;
    }

    protected isInvalidCodeError(): boolean {
        return (
            (this.errorData.error === CustomAuthApiErrorCode.INVALID_GRANT &&
                this.errorData instanceof CustomAuthApiError &&
                this.errorData.subError === CustomAuthApiSuberror.INVALID_OOB_VALUE) ||
            (this.errorData instanceof InvalidArgumentError &&
                this.errorData.errorDescription?.includes("code") === true)
        );
    }

    protected isRedirectError(): boolean {
        return this.errorData instanceof RedirectError;
    }

    protected isInvalidNewPasswordError(): boolean {
        return (
            this.errorData instanceof CustomAuthApiError &&
            this.errorData.error === CustomAuthApiErrorCode.INVALID_GRANT &&
            [
                CustomAuthApiSuberror.PASSWORD_BANNED,
                CustomAuthApiSuberror.PASSWORD_IS_INVALID,
                CustomAuthApiSuberror.PASSWORD_RECENTLY_USED,
                CustomAuthApiSuberror.PASSWORD_TOO_LONG,
                CustomAuthApiSuberror.PASSWORD_TOO_SHORT,
                CustomAuthApiSuberror.PASSWORD_TOO_WEAK,
            ].includes(this.errorData.subError ?? "")
        );
    }

    protected isUserAlreadyExistsError(): boolean {
        return (
            this.errorData instanceof CustomAuthApiError &&
            this.errorData.error === CustomAuthApiErrorCode.USER_ALREADY_EXISTS
        );
    }

    protected isAttributeRequiredError(): boolean {
        return (
            this.errorData instanceof CustomAuthApiError &&
            this.errorData.error === CustomAuthApiErrorCode.ATTRIBUTES_REQUIRED
        );
    }

    protected isAttributeValidationFailedError(): boolean {
        return (
            (this.errorData instanceof CustomAuthApiError &&
                this.errorData.error === CustomAuthApiErrorCode.INVALID_GRANT &&
                this.errorData.subError === CustomAuthApiSuberror.ATTRIBUTE_VALIATION_FAILED) ||
            (this.errorData instanceof InvalidArgumentError &&
                this.errorData.errorDescription?.includes("attributes") === true)
        );
    }
}
