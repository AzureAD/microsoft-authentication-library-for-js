/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { SignUpCodeRequiredStateHandler } from "../state_handler/SignUpCodeRequiredStateHandler.js";
import { SignUpState } from "../../../core/auth_flow/AuthFlowState.js";
import { ResultBase } from "../../../core/auth_flow/ResultBase.js";

/*
 * Result of resending code in a sign-up operation.
 */
export class SignUpResendCodeResult extends ResultBase<
    SignUpState,
    void,
    SignUpCodeRequiredStateHandler
> {
    constructor(stateHandler?: SignUpCodeRequiredStateHandler) {
        super(undefined, stateHandler);
    }

    get state(): SignUpState {
        if (this.error) {
            return SignUpState.Failed;
        }

        if (this.stateHandler) {
            return SignUpState.CodeRequired;
        }

        return SignUpState.Unknown;
    }
}
