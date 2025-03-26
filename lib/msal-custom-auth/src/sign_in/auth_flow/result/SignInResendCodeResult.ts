/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowResultBase } from "../../../core/auth_flow/AuthFlowResultBase.js";
import { SignInResendCodeError } from "../error_type/SignInError.js";
import { SignInCodeRequiredState } from "../state/SignInCodeRequiredState.js";
import { SignInFailedState } from "../state/SignInFailedState.js";

export class SignInResendCodeResult extends AuthFlowResultBase<
    SignInResendCodeResultState,
    SignInResendCodeError,
    void
> {
    constructor(state: SignInResendCodeResultState) {
        super(state);
    }

    static createWithError(error: unknown): SignInResendCodeResult {
        const result = new SignInResendCodeResult(new SignInFailedState());
        result.error = new SignInResendCodeError(SignInResendCodeResult.createErrorData(error));

        return result;
    }
}

export type SignInResendCodeResultState = SignInCodeRequiredState | SignInFailedState;
