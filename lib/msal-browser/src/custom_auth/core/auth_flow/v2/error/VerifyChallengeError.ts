/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowErrorV2Base } from "./AuthFlowErrorV2Base.js";

/**
 * Error raised when verifying a challenge (submitting a one-time code).
 */
export class VerifyChallengeError extends AuthFlowErrorV2Base {
    /**
     * Checks if the error is due to the provided code being invalid.
     * @returns True if the code is invalid, false otherwise.
     */
    isInvalidCode(): boolean {
        return this.isInvalidCodeError();
    }
}
