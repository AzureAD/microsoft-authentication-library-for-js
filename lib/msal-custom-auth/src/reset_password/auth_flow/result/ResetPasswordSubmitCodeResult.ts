/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowResultBase } from "../../../core/auth_flow/AuthFlowResultBase.js";
import { ResetPasswordSubmitCodeError } from "../error_type/ResetPasswordError.js";
import { ResetPasswordFailedState } from "../state/ResetPasswordFailedState.js";
import { ResetPasswordPasswordRequiredState } from "../state/ResetPasswordPasswordRequiredState.js";

/*
 * Result of a reset password operation that requires a code.
 */
export class ResetPasswordSubmitCodeResult extends AuthFlowResultBase<
    ResetPasswordSubmitCodeResultState,
    ResetPasswordSubmitCodeError,
    void
> {
    constructor(state: ResetPasswordSubmitCodeResultState) {
        super(state);
    }

    static createWithError(error: unknown): ResetPasswordSubmitCodeResult {
        const result = new ResetPasswordSubmitCodeResult(new ResetPasswordFailedState());
        result.error = new ResetPasswordSubmitCodeError(ResetPasswordSubmitCodeResult.createErrorData(error));

        return result;
    }
}

export type ResetPasswordSubmitCodeResultState = ResetPasswordPasswordRequiredState | ResetPasswordFailedState;
