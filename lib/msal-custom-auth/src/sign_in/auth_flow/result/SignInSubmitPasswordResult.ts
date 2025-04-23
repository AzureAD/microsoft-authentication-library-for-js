/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowResultBase } from "../../../core/auth_flow/AuthFlowResultBase.js";
import { SignInSubmitPasswordError } from "../error_type/SignInError.js";
import { SignInCodeRequiredState } from "../state/SignInCodeRequiredState.js";
import { SignInCompletedState } from "../state/SignInCompletedState.js";
import { SignInFailedState } from "../state/SignInFailedState.js";

/*
 * Result of a sign-in operation that requires a password.
 */
export class SignInSubmitPasswordResult extends AuthFlowResultBase<
    SignInSubmitPasswordResultState,
    SignInSubmitPasswordError,
    void
> {
    /**
     * Creates a new instance of SignInSubmitPasswordResult.
     * @param state The state of the result.
     */
    constructor(state: SignInSubmitPasswordResultState) {
        super(state);
    }

    /**
     * Creates a new instance of SignInSubmitPasswordResult with an error.
     * @param error The error that occurred.
     * @returns {SignInSubmitPasswordResult} A new instance of SignInSubmitPasswordResult with the error set.
     */
    static createWithError(error: unknown): SignInSubmitPasswordResult {
        const result = new SignInSubmitPasswordResult(new SignInFailedState());
        result.error = new SignInSubmitPasswordError(SignInSubmitPasswordResult.createErrorData(error));

        return result;
    }

    /**
     * Checks if the result is in a failed state.
     */
    isFailed(): this is SignInSubmitPasswordResult & { state: SignInFailedState } {
        return this.state instanceof SignInFailedState;
    }

    /**
     * Checks if the result is in a code required state.
     */
    isCodeRequired(): this is SignInSubmitPasswordResult & { state: SignInCodeRequiredState } {
        return this.state instanceof SignInCodeRequiredState;
    }

    /**
     * Checks if the result is in a completed state.
     */
    isCompleted(): this is SignInSubmitPasswordResult & { state: SignInCompletedState } {
        return this.state instanceof SignInCompletedState;
    }
}

/**
 * The possible states for the SignInSubmitPasswordResult.
 * This includes:
 * - SignInCodeRequiredState: The sign-in process requires a code.
 * - SignInCompletedState: The sign-in process has completed successfully.
 * - SignInFailedState: The sign-in process has failed.
 */
export type SignInSubmitPasswordResultState = SignInCodeRequiredState | SignInCompletedState | SignInFailedState;
