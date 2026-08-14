/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowErrorV2Base } from "./AuthFlowErrorV2Base.js";

/**
 * Error raised by the first call of the native auth V2 reset-password flow
 * (`resetPasswordV2`).
 */
export class ResetPasswordStartError extends AuthFlowErrorV2Base {
    /**
     * Checks if the error is due to the user not being found.
     * @returns True if the user was not found, false otherwise.
     */
    isUserNotFound(): boolean {
        return this.isUserNotFoundError();
    }

    /**
     * Checks if the error is due to the username being invalid.
     * @returns True if the username is invalid, false otherwise.
     */
    isInvalidUsername(): boolean {
        return this.isInvalidUsernameError();
    }

    /**
     * Checks if the error is because the user does not have a password set.
     * @returns True if the user has no password, false otherwise.
     */
    isUserDoesNotHavePassword(): boolean {
        return this.isUserDoesNotHavePasswordError();
    }
}
