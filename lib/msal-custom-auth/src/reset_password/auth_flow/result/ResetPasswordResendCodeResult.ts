/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ResetPasswordState } from "../../../core/auth_flow/AuthFlowState.js";
import { AuthFlowResultBase } from "../../../core/auth_flow/AuthFlowResultBase.js";
import { ResetPasswordResendCodeError } from "../error_type/ResetPasswordError.js";
import { ResetPasswordCodeRequiredStateHandler } from "../state_handler/ResetPasswordCodeRequiredStateHandler.js";

/*
 * Result of resending code in a reset password operation.
 */
export class ResetPasswordResendCodeResult extends AuthFlowResultBase<
    ResetPasswordState,
    ResetPasswordResendCodeError,
    void,
    ResetPasswordCodeRequiredStateHandler
> {
    constructor(stateHandler?: ResetPasswordCodeRequiredStateHandler) {
        super(undefined, stateHandler);
    }

    get state(): ResetPasswordState {
        if (!!this.error) {
            return ResetPasswordState.Failed;
        }

        if (!!this.stateHandler) {
            return ResetPasswordState.CodeRequired;
        }

        return ResetPasswordState.Unknown;
    }
}
