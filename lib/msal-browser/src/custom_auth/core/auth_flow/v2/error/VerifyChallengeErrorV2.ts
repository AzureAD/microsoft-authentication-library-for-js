/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowErrorBaseV2 } from "./AuthFlowErrorBaseV2.js";

/**
 * Error raised when verifying a challenge (submitting a one-time code). It
 * exposes the detectors relevant to code verification so the app can respond to
 * a rejected code specifically. Unrecognised failures carry no specific
 * detector; inspect the error code (`unexpected_error` when the server gives
 * none) and `errorDescription`.
 */
export class VerifyChallengeErrorV2 extends AuthFlowErrorBaseV2 {
    /**
     * Checks if the error is due to the provided code being invalid or expired.
     * Use it to prompt the user to re-enter the code or request a new one, rather
     * than restarting the whole flow.
     * @returns True if the code is invalid, false otherwise.
     */
    isInvalidCode(): boolean {
        return this.isInvalidCodeError();
    }
}
