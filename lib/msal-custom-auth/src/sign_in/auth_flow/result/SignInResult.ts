/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthAccountData } from "../../../get_account/auth_flow/CustomAuthAccountData.js";
import { AuthFlowResultBase } from "../../../core/auth_flow/AuthFlowResultBase.js";
import { SignInError } from "../error_type/SignInError.js";
import { SignInCodeRequiredState } from "../state/SignInCodeRequiredState.js";
import { SignInPasswordRequiredState } from "../state/SignInPasswordRequiredState.js";
import { SignInFailedState } from "../state/SignInFailedState.js";
import { SignInCompletedState } from "../state/SignInCompletedState.js";

/*
 * Result of a sign-in operation.
 */
export class SignInResult extends AuthFlowResultBase<SignInResultState, SignInError, CustomAuthAccountData> {
    constructor(state: SignInResultState, resultData?: CustomAuthAccountData) {
        super(state, resultData);
    }

    static createWithError(error: unknown): SignInResult {
        const result = new SignInResult(new SignInFailedState());
        result.error = new SignInError(SignInResult.createErrorData(error));

        return result;
    }
}

export type SignInResultState =
    | SignInCodeRequiredState
    | SignInPasswordRequiredState
    | SignInFailedState
    | SignInCompletedState;
