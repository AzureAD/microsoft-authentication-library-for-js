/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowErrorBaseV2 } from "../../../../core/auth_flow/v2/error/AuthFlowErrorBaseV2.js";

/**
 * Error raised when submitting a new password. It exposes the detectors relevant
 * to password submission so the app can react to a rejected password
 * specifically. Unrecognised failures carry no specific detector; inspect the
 * error code (`unexpected_error` when the server gives none) and
 * `errorDescription`.
 */
export class SubmitNewPasswordErrorV2 extends AuthFlowErrorBaseV2 {
    /**
     * Checks if the error is due to the new password being invalid, for example
     * because it fails the tenant's complexity policy. Use it to prompt the user
     * for a stronger password rather than restarting the reset flow.
     * @returns True if the new password is invalid, false otherwise.
     */
    isInvalidPassword(): boolean {
        return this.isInvalidPasswordError();
    }
}
