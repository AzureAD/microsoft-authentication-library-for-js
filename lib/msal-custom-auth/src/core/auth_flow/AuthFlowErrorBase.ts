/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    CustomAuthApiError,
    RedirectError,
} from "../error/CustomAuthApiError.js";
import { CustomAuthError } from "../error/CustomAuthError.js";
import { InvalidArgumentError } from "../error/InvalidArgumentError.js";

/**
 * Base class for all auth flow errors.
 */
export class AuthFlowErrorBase {
    constructor(public errorData: CustomAuthError) {}

    protected isUserInvalidError(): boolean {
        return (
            !!this.errorData.errorDescription &&
            ((this.errorData instanceof InvalidArgumentError &&
                this.errorData.errorDescription.includes("username")) ||
                this.errorData.errorDescription.includes(
                    "username parameter is empty or not valid"
                ))
        );
    }

    protected isUnsupportedChallengeTypeError(): boolean {
        return (
            (this.errorData.error === this.errorCodes.INVALID_REQUEST &&
                (this.errorData.errorDescription?.includes(
                    "The challenge_type list parameter contains an unsupported challenge type"
                ) ??
                    false)) ||
            this.errorData.error === this.errorCodes.UNSUPPORTED_CHALLENGE_TYPE
        );
    }

    protected isInvalidPasswordError(): boolean {
        return (
            (this.errorData.error === this.errorCodes.INVALID_GRANT &&
                this.errorData instanceof CustomAuthApiError &&
                (this.errorData.errorCodes ?? []).includes(50126)) ||
            (this.errorData instanceof InvalidArgumentError &&
                this.errorData.errorDescription?.includes("password") === true)
        );
    }

    protected isInvalidCodeError(): boolean {
        return (
            (this.errorData.error === this.errorCodes.INVALID_GRANT &&
                this.errorData instanceof CustomAuthApiError &&
                this.errorData.subError ===
                    this.errorCodes.INVALID_OOB_VALUE) ||
            (this.errorData instanceof InvalidArgumentError &&
                this.errorData.errorDescription?.includes("code") === true)
        );
    }

    protected isRedirectError(): boolean {
        return this.errorData instanceof RedirectError;
    }

    protected errorCodes = {
        INVALID_REQUEST: "invalid_request",
        UNSUPPORTED_CHALLENGE_TYPE: "unsupported_challenge_type",
        USER_NOT_FOUND: "user_not_found",
        INVALID_GRANT: "invalid_grant",
        INVALID_OOB_VALUE: "invalid_oob_value",
    } as const;
}
