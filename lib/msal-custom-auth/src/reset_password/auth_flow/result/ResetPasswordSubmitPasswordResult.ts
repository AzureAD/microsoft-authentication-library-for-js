/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowResultBase } from "../../../core/auth_flow/AuthFlowResultBase.js";
import { ResetPasswordSubmitPasswordError } from "../error_type/ResetPasswordError.js";
import { ResetPasswordCompleted } from "../state/ResetPasswordCompleted.js";
import { ResetPasswordFailed } from "../state/ResetPasswordFailed.js";

/*
 * Result of a reset password operation that requires a password.
 */
export class ResetPasswordSubmitPasswordResult extends AuthFlowResultBase<
    ResetPasswordCompleted | ResetPasswordFailed,
    ResetPasswordSubmitPasswordError,
    void
> {
    constructor(state?: ResetPasswordCompleted | ResetPasswordFailed) {
        super(state);
    }

    /**
     * Creates a ResetPasswordSubmitPasswordResult instance with error details when an exception thrown during resetting password submit password.
     * @param {unknown} error
     * @returns {ResetPasswordSubmitPasswordResult} The ResetPasswordSubmitPasswordResult instance with a CustomAuthError error and failed state.
     */
    static createWithError(error: unknown): ResetPasswordSubmitPasswordResult {
        const result = new ResetPasswordSubmitPasswordResult();
        result.error = new ResetPasswordSubmitPasswordError(ResetPasswordSubmitPasswordResult.createErrorData(error));
        result.state = new ResetPasswordFailed();

        return result;
    }
}
