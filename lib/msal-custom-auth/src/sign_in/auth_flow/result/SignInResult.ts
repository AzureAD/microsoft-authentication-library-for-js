/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AccountInfo } from "../../../account/auth_flow/model/AccountInfo.js";
import { AuthFlowResultBase } from "../../../core/auth_flow/AuthFlowResultBase.js";
import { SignInError } from "../error_type/SignInError.js";
import { SignInCodeRequired } from "../state/SignInCodeRequired.js";
import { SignInCompleted } from "../state/SignInCompleted.js";
import { SignInFailed } from "../state/SignInFailed.js";
import { SignInPasswordRequired } from "../state/SignInPasswordRequired.js";

/*
 * Result of a sign-in operation.
 */
export class SignInResult extends AuthFlowResultBase<
    | SignInCodeRequired
    | SignInPasswordRequired
    | SignInFailed
    | SignInCompleted,
    SignInError,
    AccountInfo
> {
    constructor(
        state?: SignInCodeRequired | SignInPasswordRequired | SignInCompleted,
        resultData?: AccountInfo,
    ) {
        super(state, resultData);
    }

    static createWithError(error: unknown): SignInResult {
        const result = new SignInResult();
        result.error = new SignInError(SignInResult.createErrorData(error));
        result.state = new SignInFailed();

        return result;
    }
}
