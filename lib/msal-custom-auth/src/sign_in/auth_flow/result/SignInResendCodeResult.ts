/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowResultBase } from "../../../core/auth_flow/AuthFlowResultBase.js";
import { SignInResendCodeError } from "../error_type/SignInError.js";
import { SignInCodeRequired } from "../state/SignInCodeRequired.js";
import { SignInFailed } from "../state/SignInFailed.js";

export class SignInResendCodeResult extends AuthFlowResultBase<
    SignInCodeRequired | SignInFailed,
    SignInResendCodeError,
    void
> {
    constructor(state?: SignInCodeRequired) {
        super(state);
    }

    /**
     * Creates a SignInResendCodeResult instance with error details when an exception thrown during sign-in resend code.
     * @param {unknown} error
     * @returns {SignInResendCodeResult} The SignInResendCodeResult instance with a CustomAuthError error and failed state.
     */
    static createWithError(error: unknown): SignInResendCodeResult {
        const result = new SignInResendCodeResult();
        result.state = new SignInFailed();
        result.error = new SignInResendCodeError(SignInResendCodeResult.createErrorData(error));

        return result;
    }
}
