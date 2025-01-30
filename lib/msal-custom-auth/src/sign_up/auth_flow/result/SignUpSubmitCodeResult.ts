/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowResultBase } from "../../../core/auth_flow/AuthFlowResultBase.js";
import { SignUpSubmitCodeError } from "../error_type/SignUpError.js";
import { SignUpPasswordRequired } from "../state/SignUpPasswordRequired.js";
import { SignUpCompleted } from "../state/SignUpCompleted.js";
import { SignUpFailed } from "../state/SignUpFailed.js";
import { SignUpAttributesRequired } from "../state/SignUpAttributesRequired.js";

/*
 * Result of a sign-up operation that requires a code.
 */
export class SignUpSubmitCodeResult extends AuthFlowResultBase<
    | SignUpPasswordRequired
    | SignUpAttributesRequired
    | SignUpCompleted
    | SignUpFailed,
    SignUpSubmitCodeError,
    void
> {
    constructor(
        state?:
            | SignUpPasswordRequired
            | SignUpAttributesRequired
            | SignUpCompleted
            | SignUpFailed,
    ) {
        super(state);
    }

    static createWithError(error: unknown): SignUpSubmitCodeResult {
        const result = new SignUpSubmitCodeResult();
        result.error = new SignUpSubmitCodeError(
            SignUpSubmitCodeResult.createErrorData(error),
        );
        result.state = new SignUpFailed();

        return result;
    }
}
