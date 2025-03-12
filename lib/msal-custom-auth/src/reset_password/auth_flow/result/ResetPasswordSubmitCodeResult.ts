/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowResultBase } from "../../../core/auth_flow/AuthFlowResultBase.js";
import { ResetPasswordSubmitCodeError } from "../error_type/ResetPasswordError.js";
import { ResetPasswordCodeRequired } from "../state/ResetPasswordCodeRequired.js";
import { ResetPasswordFailed } from "../state/ResetPasswordFailed.js";

/*
 * Result of a reset password operation that requires a code.
 */
export class ResetPasswordSubmitCodeResult extends AuthFlowResultBase<
    ResetPasswordCodeRequired | ResetPasswordFailed,
    ResetPasswordSubmitCodeError,
    void
> {
    constructor(state?: ResetPasswordCodeRequired | ResetPasswordFailed) {
        super(state);
    }

    static createWithError(error: unknown): ResetPasswordSubmitCodeResult {
        const result = new ResetPasswordSubmitCodeResult();
        result.error = new ResetPasswordSubmitCodeError(ResetPasswordSubmitCodeResult.createErrorData(error));
        result.state = new ResetPasswordFailed();

        return result;
    }
}
