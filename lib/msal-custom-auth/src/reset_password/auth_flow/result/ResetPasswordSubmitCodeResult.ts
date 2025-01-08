/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ResetPasswordState } from "../../../core/auth_flow/AuthFlowState.js";
import { ResultBase } from "../../../core/auth_flow/ResultBase.js";
import { ResetPasswordSubmitCodeError } from "../error_type/ResetPasswordError.js";
import { ResetPasswordPasswordRequiredStateHandler } from "../state_handler/ResetPasswordPasswordRequiredStateHandler.js";

/*
 * Result of a reset password operation that requires a code.
 */
export class ResetPasswordSubmitCodeResult extends ResultBase<
    ResetPasswordState,
    ResetPasswordSubmitCodeError,
    void,
    ResetPasswordPasswordRequiredStateHandler
> {
    constructor(stateHandler?: ResetPasswordPasswordRequiredStateHandler) {
        super(undefined, stateHandler);
    }

    get state(): ResetPasswordState {
        if (this.error) {
            return ResetPasswordState.Failed;
        }

        if (this.stateHandler) {
            return ResetPasswordState.PasswordRequired;
        }

        return ResetPasswordState.Unknown;
    }
}
