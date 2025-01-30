/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowResultBase } from "../../../core/auth_flow/AuthFlowResultBase.js";
import { SignUpResendCodeError } from "../error_type/SignUpError.js";
import { SignUpCodeRequired } from "../state/SignUpCodeRequired.js";
import { SignUpFailed } from "../state/SignUpFailed.js";

/*
 * Result of resending code in a sign-up operation.
 */
export class SignUpResendCodeResult extends AuthFlowResultBase<
    SignUpCodeRequired | SignUpFailed,
    SignUpResendCodeError,
    void
> {
    constructor(state?: SignUpCodeRequired) {
        super(state);
    }

    static createWithError(error: unknown): SignUpResendCodeResult {
        const result = new SignUpResendCodeResult();
        result.error = new SignUpResendCodeError(
            SignUpResendCodeResult.createErrorData(error),
        );
        result.state = new SignUpFailed();

        return result;
    }
}
