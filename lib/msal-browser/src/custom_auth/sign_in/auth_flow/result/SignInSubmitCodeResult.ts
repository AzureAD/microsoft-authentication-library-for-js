/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { SignInSubmitCodeError } from "../error_type/SignInError.js";
import { SignInCompletedState } from "../state/SignInCompletedState.js";
import { SignInFailedState } from "../state/SignInFailedState.js";
import { AuthFlowResultBase } from "../../../core/auth_flow/AuthFlowResultBase.js";
import { CustomAuthAccountData } from "../../../get_account/auth_flow/CustomAuthAccountData.js";
import { AuthMethodRegistrationRequiredState } from "../../../core/auth_flow/jit/state/AuthMethodRegistrationState.js";
import { MfaAwaitingState } from "../../../core/auth_flow/mfa/state/MfaState.js";

/*
 * Result of a sign-in submit code operation.
 */
export class SignInSubmitCodeResult extends AuthFlowResultBase<
    SignInSubmitCodeResultState,
    SignInSubmitCodeError,
    CustomAuthAccountData
> {
    /**
     * Creates a new instance of SignInSubmitCodeResult with error data.
     * @param error The error that occurred.
     * @returns {SignInSubmitCodeResult} A new instance of SignInSubmitCodeResult with the error set.
     */
    static createWithError(error: unknown): SignInSubmitCodeResult {
        const result = new SignInSubmitCodeResult(new SignInFailedState());
        result.error = new SignInSubmitCodeError(
            SignInSubmitCodeResult.createErrorData(error)
        );

        return result;
    }

    /**
     * Checks if the result is in a failed state.
     */
    isFailed(): this is SignInSubmitCodeResult & { state: SignInFailedState } {
        return this.state instanceof SignInFailedState;
    }

    /**
     * Checks if the result is in a completed state.
     */
    isCompleted(): this is SignInSubmitCodeResult & {
        state: SignInCompletedState;
    } {
        return this.state instanceof SignInCompletedState;
    }

    /**
     * Checks if the result requires authentication method registration.
     * @warning This API is experimental. It may be changed in the future without notice. Do not use in production applications.
     */
    isAuthMethodRegistrationRequired(): this is SignInSubmitCodeResult & {
        state: AuthMethodRegistrationRequiredState;
    } {
        return this.state instanceof AuthMethodRegistrationRequiredState;
    }

    /**
     * Checks if the result requires MFA.
     * @warning This API is experimental. It may be changed in the future without notice. Do not use in production applications.
     */
    isMfaRequired(): this is SignInSubmitCodeResult & {
        state: MfaAwaitingState;
    } {
        return this.state instanceof MfaAwaitingState;
    }
}

/**
 * The possible states of the SignInSubmitCodeResult.
 * This includes:
 * - SignInCompletedState: The sign-in process has completed successfully.
 * - SignInFailedState: The sign-in process has failed.
 * - AuthMethodRegistrationRequiredState: The user needs to register an authentication method.
 * - MfaAwaitingState: The user is in a multi-factor authentication (MFA) waiting state.
 */
export type SignInSubmitCodeResultState =
    | SignInCompletedState
    | SignInFailedState
    | AuthMethodRegistrationRequiredState
    | MfaAwaitingState;
