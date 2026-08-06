/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowErrorV2Base } from "./AuthFlowErrorV2Base.js";

/**
 * Error raised by the first call of the native auth V2 reset-password flow
 * (`resetPasswordV2`). It surfaces only the detectors relevant to starting a
 * password reset, so an app inspecting `result.error` sees a small, focused set.
 * Any unrecognised failure falls back to the inherited `isGeneralError()`.
 */
export class ResetPasswordStartError extends AuthFlowErrorV2Base {
    /**
     * Checks if the error is due to the user not being found. Use it to tell the
     * user no account matches the supplied username, rather than exposing a
     * generic failure that hides the real cause.
     * @returns True if the user was not found, false otherwise.
     */
    isUserNotFound(): boolean {
        return this.isUserNotFoundError();
    }

    /**
     * Checks if the error is due to the username being invalid, for example
     * because it is malformed. Use it to prompt the user to correct the username
     * before retrying the reset.
     * @returns True if the username is invalid, false otherwise.
     */
    isInvalidUsername(): boolean {
        return this.isInvalidUsernameError();
    }

    /**
     * Checks if the error is because the user does not have a password set, so a
     * reset cannot proceed. Use it to redirect the user to an alternative
     * credential or recovery path instead of retrying the reset.
     * @returns True if the user has no password, false otherwise.
     */
    isUserDoesNotHavePassword(): boolean {
        return this.isUserDoesNotHavePasswordError();
    }
}
