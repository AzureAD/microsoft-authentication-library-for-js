/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowResultBase } from "../../../core/auth_flow/AuthFlowResultBase.js";
import { ResetPasswordSubmitPasswordError } from "../error_type/ResetPasswordError.js";
import { ResetPasswordCompletedState } from "../state/ResetPasswordCompletedState.js";
import { ResetPasswordFailedState } from "../state/ResetPasswordFailedState.js";

/*
 * Result of a reset password operation that requires a password.
 */
export class ResetPasswordSubmitPasswordResult extends AuthFlowResultBase<
    ResetPasswordSubmitPasswordResultState,
    ResetPasswordSubmitPasswordError,
    void
> {
    constructor(state: ResetPasswordSubmitPasswordResultState) {
        super(state);
    }

    static createWithError(error: unknown): ResetPasswordSubmitPasswordResult {
        const result = new ResetPasswordSubmitPasswordResult(new ResetPasswordFailedState());
        result.error = new ResetPasswordSubmitPasswordError(ResetPasswordSubmitPasswordResult.createErrorData(error));

        return result;
    }
}

export type ResetPasswordSubmitPasswordResultState = ResetPasswordCompletedState | ResetPasswordFailedState;
