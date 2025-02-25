/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthAccountData } from "../../../get_account/auth_flow/CustomAuthAccountData.js";
import { AuthFlowErrorBase } from "../../../core/auth_flow/AuthFlowErrorBase.js";
import { AuthFlowResultBase } from "../../../core/auth_flow/AuthFlowResultBase.js";
import { SignInCompleted } from "../state/SignInCompleted.js";
import { SignInFailed } from "../state/SignInFailed.js";

/*
 * Result of a sign-in submit credential operation.
 */
export abstract class SignInSubmitCredentialResult<TError extends AuthFlowErrorBase> extends AuthFlowResultBase<
    SignInCompleted | SignInFailed,
    TError,
    CustomAuthAccountData
> {
    constructor(state?: SignInCompleted | SignInFailed, resultData?: CustomAuthAccountData) {
        super(state, resultData);
    }
}
