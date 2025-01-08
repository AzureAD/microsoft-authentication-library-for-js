/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthError } from "../error/CustomAuthError.js";
import { InvalidArgumentError } from "../error/InvalidArgumentError.js";

/**
 * Base class for all auth flow errors.
 */
export class AuthFlowErrorBase {
    constructor(public error: CustomAuthError) {}

    protected isUserInvalidError(): boolean {
        return (
            !!this.error.errorDescription &&
            ((this.error instanceof InvalidArgumentError &&
                this.error.errorDescription.includes("username")) ||
                this.error.errorDescription.includes(
                    "username parameter is empty or not valid"
                ))
        );
    }

    protected isUnsupportedChallengeTypeError(): boolean {
        return (
            (this.error.error === this.errorCodes.INVALID_REQUEST &&
                (this.error.errorDescription?.includes(
                    "The challenge_type list parameter contains an unsupported challenge type"
                ) ??
                    false)) ||
            this.error.error === this.errorCodes.UNSUPPORTED_CHALLENGE_TYPE
        );
    }

    protected errorCodes = {
        INVALID_REQUEST: "invalid_request",
        UNSUPPORTED_CHALLENGE_TYPE: "unsupported_challenge_type",
    } as const;
}
