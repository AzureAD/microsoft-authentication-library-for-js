/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowErrorV2Base } from "./AuthFlowErrorV2Base.js";

/**
 * Error raised when submitting a new password.
 */
export class SubmitNewPasswordError extends AuthFlowErrorV2Base {
    /**
     * Checks if the error is due to the new password being invalid.
     * @returns True if the new password is invalid, false otherwise.
     */
    isInvalidPassword(): boolean {
        return this.isInvalidPasswordError();
    }
}
