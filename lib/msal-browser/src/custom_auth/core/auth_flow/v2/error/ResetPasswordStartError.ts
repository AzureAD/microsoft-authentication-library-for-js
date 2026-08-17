/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowErrorV2Base } from "./AuthFlowErrorV2Base.js";

/**
 * Error raised by the first call of the native auth V2 reset-password flow
 * (`resetPasswordV2`). It surfaces only the detectors relevant to starting a
 * password reset, so an app inspecting `result.error` sees a small, focused set.
 * Any unrecognised failure carries no specific detector; inspect the error code
 * (`unexpected_error` when the server gives none) and `errorDescription`.
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
}
