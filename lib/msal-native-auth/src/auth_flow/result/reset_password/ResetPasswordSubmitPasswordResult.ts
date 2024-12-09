/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { SignInContinuationStateHandler } from "../../state_handler/sign_in/SignInContinuationStateHandler.js";
import { ResetPasswordState } from "../AuthFlowState.js";
import { ResultBase } from "../ResultBase.js";

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
