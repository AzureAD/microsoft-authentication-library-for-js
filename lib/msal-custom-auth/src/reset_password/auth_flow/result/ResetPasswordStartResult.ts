/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowResultBase } from "../../../core/auth_flow/AuthFlowResultBase.js";
import { ResetPasswordError } from "../error_type/ResetPasswordError.js";
import { ResetPasswordCodeRequiredState } from "../state/ResetPasswordCodeRequiredState.js";
import { ResetPasswordFailedState } from "../state/ResetPasswordFailedState.js";

/*
 * Result of a reset password operation.
 */
export class ResetPasswordStartResult extends AuthFlowResultBase<
    ResetPasswordStartResultState,
    ResetPasswordError,
    void
> {
    constructor(state: ResetPasswordStartResultState) {
        super(state);
    }

    static createWithError(error: unknown): ResetPasswordStartResult {
        const result = new ResetPasswordStartResult(new ResetPasswordFailedState());
        result.error = new ResetPasswordError(ResetPasswordStartResult.createErrorData(error));

        return result;
    }
}

export type ResetPasswordStartResultState = ResetPasswordCodeRequiredState | ResetPasswordFailedState;
