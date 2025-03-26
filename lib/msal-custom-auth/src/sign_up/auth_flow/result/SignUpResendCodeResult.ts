/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowResultBase } from "../../../core/auth_flow/AuthFlowResultBase.js";
import { SignUpResendCodeError } from "../error_type/SignUpError.js";
import { SignUpCodeRequiredState } from "../state/SignUpCodeRequiredState.js";
import { SignUpFailedState } from "../state/SignUpFailedState.js";

/*
 * Result of resending code in a sign-up operation.
 */
export class SignUpResendCodeResult extends AuthFlowResultBase<
    SignUpResendCodeResultState,
    SignUpResendCodeError,
    void
> {
    constructor(state: SignUpResendCodeResultState) {
        super(state);
    }

    static createWithError(error: unknown): SignUpResendCodeResult {
        const result = new SignUpResendCodeResult(new SignUpFailedState());
        result.error = new SignUpResendCodeError(SignUpResendCodeResult.createErrorData(error));

        return result;
    }
}

export type SignUpResendCodeResultState = SignUpCodeRequiredState | SignUpFailedState;
