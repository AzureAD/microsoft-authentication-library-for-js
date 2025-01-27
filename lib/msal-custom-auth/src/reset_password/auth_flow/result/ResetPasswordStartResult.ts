/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ResetPasswordState } from "../../../core/auth_flow/AuthFlowState.js";
import { AuthFlowResultBase } from "../../../core/auth_flow/AuthFlowResultBase.js";
import { ResetPasswordError } from "../error_type/ResetPasswordError.js";
import { ResetPasswordCodeRequiredStateHandler } from "../state_handler/ResetPasswordCodeRequiredStateHandler.js";

/*
 * Result of a reset password operation.
 */
export class ResetPasswordStartResult extends AuthFlowResultBase<
    ResetPasswordState,
    ResetPasswordError,
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
