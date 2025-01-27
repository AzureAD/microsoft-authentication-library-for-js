/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ResetPasswordState } from "../../../core/auth_flow/AuthFlowState.js";
import { AuthFlowResultBase } from "../../../core/auth_flow/AuthFlowResultBase.js";
import { SignInContinuationStateHandler } from "../../../sign_in/auth_flow/state_handler/SignInContinuationStateHandler.js";
import { ResetPasswordSubmitPasswordError } from "../error_type/ResetPasswordError.js";

/*
 * Result of a reset password operation that requires a password.
 */
export class ResetPasswordSubmitPasswordResult extends AuthFlowResultBase<
    ResetPasswordState,
    ResetPasswordSubmitPasswordError,
    void,
    SignInContinuationStateHandler
> {
    constructor(stateHandler?: SignInContinuationStateHandler) {
        super(undefined, stateHandler);
    }

    get state(): ResetPasswordState {
        if (!!this.error) {
            return ResetPasswordState.Failed;
        }

        if (!!this.stateHandler) {
            return ResetPasswordState.Completed;
        }

        return ResetPasswordState.Unknown;
    }
}
