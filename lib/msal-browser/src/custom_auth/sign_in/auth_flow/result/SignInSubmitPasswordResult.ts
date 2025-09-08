/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { SignInSubmitPasswordError } from "../error_type/SignInError.js";
import { SignInCompletedState } from "../state/SignInCompletedState.js";
import { SignInFailedState } from "../state/SignInFailedState.js";
import { AuthFlowResultBase } from "../../../core/auth_flow/AuthFlowResultBase.js";
import { CustomAuthAccountData } from "../../../get_account/auth_flow/CustomAuthAccountData.js";
import { AuthMethodRegistrationRequiredState } from "../../../core/auth_flow/jit/state/AuthMethodRegistrationState.js";

/*
 * Result of a sign-in submit password operation.
 */
export class SignInSubmitPasswordResult extends AuthFlowResultBase<
    SignInSubmitPasswordResultState,
    SignInSubmitPasswordError,
    CustomAuthAccountData
> {
    static createWithError(error: unknown): SignInSubmitPasswordResult {
        const result = new SignInSubmitPasswordResult(new SignInFailedState());
        result.error = new SignInSubmitPasswordError(
            SignInSubmitPasswordResult.createErrorData(error)
        );

        return result;
    }

    /**
     * Checks if the result is in a failed state.
     */
    isFailed(): this is SignInSubmitPasswordResult & {
        state: SignInFailedState;
    } {
        return this.state instanceof SignInFailedState;
    }

    /**
     * Checks if the result is in a completed state.
     */
    isCompleted(): this is SignInSubmitPasswordResult & {
        state: SignInCompletedState;
    } {
        return this.state instanceof SignInCompletedState;
    }

    /**
     * Checks if the result requires authentication method registration.
     * @warning This API is experimental. It may be changed in the future without notice. Do not use in production applications.
     */
    isAuthMethodRegistrationRequired(): this is SignInSubmitPasswordResult & {
        state: AuthMethodRegistrationRequiredState;
    } {
        return this.state instanceof AuthMethodRegistrationRequiredState;
    }
}

/**
 * The possible states of the SignInSubmitPasswordResult.
 * This includes:
 * - SignInCompletedState: The sign-in process has completed successfully.
 * - SignInFailedState: The sign-in process has failed.
 * - AuthMethodRegistrationRequiredState: The sign-in process requires authentication method registration.
 */
export type SignInSubmitPasswordResultState =
    | SignInCompletedState
    | SignInFailedState
    | AuthMethodRegistrationRequiredState;
