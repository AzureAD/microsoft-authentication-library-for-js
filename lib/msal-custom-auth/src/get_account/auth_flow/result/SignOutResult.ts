/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowResultBase } from "../../../core/auth_flow/AuthFlowResultBase.js";
import { SignOutError } from "../error_type/GetAccountError.js";
import { SignOutCompleted } from "../state/SignOutCompleted.js";
import { SignOutFailed } from "../state/SignOutFailed.js";

/*
 * Result of a sign-out operation.
 */
export class SignOutResult extends AuthFlowResultBase<SignOutCompleted | SignOutFailed, SignOutError, void> {
    constructor() {
        super(new SignOutCompleted());
    }

    static createWithError(error: unknown): SignOutResult {
        const result = new SignOutResult();
        result.error = new SignOutError(SignOutResult.createErrorData(error));
        result.state = new SignOutFailed();

        return result;
    }
}
