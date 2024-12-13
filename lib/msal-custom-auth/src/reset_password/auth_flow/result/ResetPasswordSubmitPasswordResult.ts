/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ResetPasswordState } from "../../../core/auth_flow/AuthFlowState.js";
import { ResultBase } from "../../../core/auth_flow/ResultBase.js";
import { SignInContinuationStateHandler } from "../../../sign_in/auth_flow/state_handler/SignInContinuationStateHandler.js";

/*
 * Result of a reset password operation that requires a password.
 */
export class ResetPasswordSubmitPasswordResult extends ResultBase<
    ResetPasswordState,
    void,
    SignInContinuationStateHandler
> {
    constructor(stateHandler?: SignInContinuationStateHandler) {
        super(undefined, stateHandler);
    }

    get state(): ResetPasswordState {
        if (this.error) {
            return ResetPasswordState.Failed;
        }

        if (this.stateHandler) {
            return ResetPasswordState.Completed;
        }

        return ResetPasswordState.Unknown;
    }
}
