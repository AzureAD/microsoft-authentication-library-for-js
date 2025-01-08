/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { SignInState } from "../../../core/auth_flow/AuthFlowState.js";
import { ResultBase } from "../../../core/auth_flow/ResultBase.js";
import { SignInResendCodeError } from "../error_type/SignInError.js";
import { SignInCodeRequiredStateHandler } from "../state_handler/SignInCodeRequiredStateHandler.js";

export class SignInResendCodeResult extends ResultBase<
    SignInState,
    SignInResendCodeError,
    void,
    SignInCodeRequiredStateHandler
> {
    constructor(stateHandler?: SignInCodeRequiredStateHandler) {
        super(undefined, stateHandler);
    }

    get state(): SignInState {
        if (this.error) {
            return SignInState.Failed;
        }

        if (this.stateHandler) {
            return SignInState.CodeRequired;
        }

        return SignInState.Unknown;
    }
}
