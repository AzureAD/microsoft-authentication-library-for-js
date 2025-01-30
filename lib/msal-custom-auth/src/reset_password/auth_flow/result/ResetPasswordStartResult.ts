/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowResultBase } from "../../../core/auth_flow/AuthFlowResultBase.js";
import { ResetPasswordError } from "../error_type/ResetPasswordError.js";
import { ResetPasswordCodeRequired } from "../state/ResetPasswordCodeRequired.js";
import { ResetPasswordFailed } from "../state/ResetPasswordFailed.js";

/*
 * Result of a reset password operation.
 */
export class ResetPasswordStartResult extends AuthFlowResultBase<
    ResetPasswordCodeRequired | ResetPasswordFailed,
    ResetPasswordError,
    void
> {
    constructor(state?: ResetPasswordCodeRequired) {
        super(state);
    }

    static createWithError(error: unknown): ResetPasswordStartResult {
        const result = new ResetPasswordStartResult();
        result.error = new ResetPasswordError(
            ResetPasswordStartResult.createErrorData(error),
        );
        result.state = new ResetPasswordFailed();

        return result;
    }
}
