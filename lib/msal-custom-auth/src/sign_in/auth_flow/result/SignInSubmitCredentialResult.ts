/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AccountInfo } from "../../../account/auth_flow/model/AccountInfo.js";
import { AuthFlowErrorBase } from "../../../core/auth_flow/AuthFlowErrorBase.js";
import { SignInState } from "../../../core/auth_flow/AuthFlowState.js";
import { ResultBase } from "../../../core/auth_flow/ResultBase.js";

/*
 * Result of a sign-in submit credential operation.
 */
export abstract class SignInSubmitCredentialResult<
    TError extends AuthFlowErrorBase
> extends ResultBase<SignInState, TError, AccountInfo> {
    constructor(resultData?: AccountInfo) {
        super(resultData);
    }

    get state(): SignInState {
        if (this.error) {
            return SignInState.Failed;
        }

        if (this.data) {
            return SignInState.Completed;
        }

        return SignInState.Unknown;
    }
}
