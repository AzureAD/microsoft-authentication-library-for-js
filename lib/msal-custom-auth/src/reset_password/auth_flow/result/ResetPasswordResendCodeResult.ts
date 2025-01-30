/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowResultBase } from "../../../core/auth_flow/AuthFlowResultBase.js";
import { ResetPasswordResendCodeError } from "../error_type/ResetPasswordError.js";
import { ResetPasswordCodeRequired } from "../state/ResetPasswordCodeRequired.js";
import { ResetPasswordFailed } from "../state/ResetPasswordFailed.js";

/*
 * Result of resending code in a reset password operation.
 */
export class ResetPasswordResendCodeResult extends AuthFlowResultBase<
    ResetPasswordCodeRequired | ResetPasswordFailed,
    ResetPasswordResendCodeError,
    void
> {
    constructor(state?: ResetPasswordCodeRequired | ResetPasswordFailed) {
        super(state);
    }

    static createWithError(error: unknown): ResetPasswordResendCodeResult {
        const result = new ResetPasswordResendCodeResult();
        result.error = new ResetPasswordResendCodeError(
            ResetPasswordResendCodeResult.createErrorData(error),
        );
        result.state = new ResetPasswordFailed();

        return result;
    }
}
