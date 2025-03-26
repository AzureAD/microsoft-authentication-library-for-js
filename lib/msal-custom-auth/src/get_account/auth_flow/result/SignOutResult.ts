/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowResultBase } from "../../../core/auth_flow/AuthFlowResultBase.js";
import { SignOutError } from "../error_type/GetAccountError.js";
import { SignOutCompletedState } from "../state/SignOutCompletedState.js";
import { SignOutFailedState } from "../state/SignOutFailedState.js";

/*
 * Result of a sign-out operation.
 */
export class SignOutResult extends AuthFlowResultBase<SignOutCompletedState | SignOutFailedState, SignOutError, void> {
    constructor() {
        super(new SignOutCompletedState());
    }

    static createWithError(error: unknown): SignOutResult {
        const result = new SignOutResult();
        result.error = new SignOutError(SignOutResult.createErrorData(error));
        result.state = new SignOutFailedState();

        return result;
    }
}
