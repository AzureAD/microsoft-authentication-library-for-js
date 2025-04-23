/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowResultBase } from "../../../core/auth_flow/AuthFlowResultBase.js";
import { SignInResendCodeError } from "../error_type/SignInError.js";
import { SignInCodeRequiredState } from "../state/SignInCodeRequiredState.js";
import { SignInFailedState } from "../state/SignInFailedState.js";

/*
 * Result of resending code in a sign-in operation.
 */
export class SignInResendCodeResult extends AuthFlowResultBase<
    SignInResendCodeResultState,
    SignInResendCodeError,
    void
> {
    /**
     * Creates a new instance of SignInResendCodeResult.
     * @param state The state of the result.
     */
    constructor(state: SignInResendCodeResultState) {
        super(state);
    }

    /**
     * Creates a new instance of SignInResendCodeResult with an error.
     * @param error The error that occurred.
     * @returns {SignInResendCodeResult} A new instance of SignInResendCodeResult with the error set.
     */
    static createWithError(error: unknown): SignInResendCodeResult {
        const result = new SignInResendCodeResult(new SignInFailedState());
        result.error = new SignInResendCodeError(SignInResendCodeResult.createErrorData(error));

        return result;
    }

    /**
     * Checks if the result is in a failed state.
     */
    isFailed(): this is SignInResendCodeResult & { state: SignInFailedState } {
        return this.state instanceof SignInFailedState;
    }

    /**
     * Checks if the result is in a code required state.
     */
    isCodeRequired(): this is SignInResendCodeResult & { state: SignInCodeRequiredState } {
        return this.state instanceof SignInCodeRequiredState;
    }
}

/**
 * The possible states for the SignInResendCodeResult.
 * This includes:
 * - SignInCodeRequiredState: The sign-in process requires a code.
 * - SignInFailedState: The sign-in process has failed.
 */
export type SignInResendCodeResultState = SignInCodeRequiredState | SignInFailedState;
