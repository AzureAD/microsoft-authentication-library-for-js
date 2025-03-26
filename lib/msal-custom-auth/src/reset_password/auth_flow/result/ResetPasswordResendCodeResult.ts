/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowResultBase } from "../../../core/auth_flow/AuthFlowResultBase.js";
import { ResetPasswordResendCodeError } from "../error_type/ResetPasswordError.js";
import { ResetPasswordCodeRequiredState } from "../state/ResetPasswordCodeRequiredState.js";
import { ResetPasswordFailedState } from "../state/ResetPasswordFailedState.js";

/*
 * Result of resending code in a reset password operation.
 */
export class ResetPasswordResendCodeResult extends AuthFlowResultBase<
    ResetPasswordResendCodeResultState,
    ResetPasswordResendCodeError,
    void
> {
    constructor(state: ResetPasswordResendCodeResultState) {
        super(state);
    }

    static createWithError(error: unknown): ResetPasswordResendCodeResult {
        const result = new ResetPasswordResendCodeResult(new ResetPasswordFailedState());
        result.error = new ResetPasswordResendCodeError(ResetPasswordResendCodeResult.createErrorData(error));

        return result;
    }
}

export type ResetPasswordResendCodeResultState = ResetPasswordCodeRequiredState | ResetPasswordFailedState;
