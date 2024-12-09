/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ResultBase } from "../ResultBase.js";
import { ResetPasswordState } from "../AuthFlowState.js";
import { ResetPasswordCodeRequiredStateHandler } from "../../state_handler/reset_password/ResetPasswordCodeRequiredStateHandler.js";

/*
 * Result of a reset password operation.
 */
export class ResetPasswordStartResult extends ResultBase<
    ResetPasswordState,
    void,
    ResetPasswordCodeRequiredStateHandler
> {
    constructor(stateHandler?: ResetPasswordCodeRequiredStateHandler) {
        super(undefined, stateHandler);
    }

    get state(): ResetPasswordState {
        if (this.error) {
            return ResetPasswordState.Failed;
        }

        if (this.stateHandler) {
            return ResetPasswordState.CodeRequired;
        }

        return ResetPasswordState.Unknown;
    }
}
