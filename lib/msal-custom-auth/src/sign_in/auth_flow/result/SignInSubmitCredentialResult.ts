/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AccountInfo } from "../../../account/auth_flow/model/AccountInfo.js";
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
    AccountInfo
> {
    constructor(state?: SignInCompleted | SignInFailed, resultData?: AccountInfo) {
        super(state, resultData);
    }
}
