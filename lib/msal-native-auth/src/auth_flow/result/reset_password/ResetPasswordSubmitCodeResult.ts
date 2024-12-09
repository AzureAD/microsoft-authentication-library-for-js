/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ResetPasswordPasswordRequiredStateHandler } from "../../state_handler/reset_password/ResetPasswordPasswordRequiredStateHandler.js";
import { ResetPasswordState } from "../AuthFlowState.js";
import { ResultBase } from "../ResultBase.js";

/*
 * Result of a reset password operation that requires a code.
 */
export class ResetPasswordSubmitCodeResult extends ResultBase<
    ResetPasswordState,
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
