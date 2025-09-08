/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowResultBase } from "../../AuthFlowResultBase.js";
import { AuthMethodRegistrationSubmitChallengeError } from "../error_type/AuthMethodRegistrationError.js";
import { CustomAuthAccountData } from "../../../../get_account/auth_flow/CustomAuthAccountData.js";
import { AuthMethodRegistrationFailedState } from "../state/AuthMethodRegistrationFailedState.js";
import { AuthMethodRegistrationCompletedState } from "../state/AuthMethodRegistrationCompletedState.js";

/**
 * Result of submitting a challenge for authentication method registration.
 */
export class AuthMethodRegistrationSubmitChallengeResult extends AuthFlowResultBase<
    AuthMethodRegistrationSubmitChallengeResultState,
    AuthMethodRegistrationSubmitChallengeError,
    CustomAuthAccountData
> {
    /**
     * Creates an AuthMethodRegistrationSubmitChallengeResult with an error.
     * @param error The error that occurred.
     * @returns The AuthMethodRegistrationSubmitChallengeResult with error.
     */
    static createWithError(
        error: unknown
    ): AuthMethodRegistrationSubmitChallengeResult {
        const result = new AuthMethodRegistrationSubmitChallengeResult(
            new AuthMethodRegistrationFailedState()
        );
        result.error = new AuthMethodRegistrationSubmitChallengeError(
            AuthMethodRegistrationSubmitChallengeResult.createErrorData(error)
        );
        return result;
    }

    /**
     * Checks if the result indicates that registration is completed.
     * @returns true if registration is completed, false otherwise.
     * @warning This API is experimental. It may be changed in the future without notice. Do not use in production applications.
     */
    isCompleted(): boolean {
        return (
            this.state.constructor?.name ===
            "AuthMethodRegistrationCompletedState"
        );
    }

    /**
     * Checks if the result is in a failed state.
     * @returns true if the result is failed, false otherwise.
     * @warning This API is experimental. It may be changed in the future without notice. Do not use in production applications.
     */
    isFailed(): boolean {
        return this.state instanceof AuthMethodRegistrationFailedState;
    }
}

/**
 * Type definition for possible states in AuthMethodRegistrationSubmitChallengeResult.
 */
export type AuthMethodRegistrationSubmitChallengeResultState =
    | AuthMethodRegistrationCompletedState
    | AuthMethodRegistrationFailedState;
