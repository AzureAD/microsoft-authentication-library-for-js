/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowResultBase } from "../../../core/auth_flow/AuthFlowResultBase.js";
import { SignUpSubmitPasswordError } from "../error_type/SignUpError.js";
import { SignUpCodeRequired } from "../state/SignUpCodeRequired.js";
import { SignUpAttributesRequired } from "../state/SignUpAttributesRequired.js";
import { SignUpCompleted } from "../state/SignUpCompleted.js";
import { SignUpFailed } from "../state/SignUpFailed.js";

/*
 * Result of a sign-up operation that requires a password.
 */
export class SignUpSubmitPasswordResult extends AuthFlowResultBase<
    SignUpCodeRequired | SignUpAttributesRequired | SignUpCompleted | SignUpFailed,
    SignUpSubmitPasswordError,
    void
> {
    constructor(state?: SignUpCodeRequired | SignUpAttributesRequired | SignUpCompleted | SignUpFailed) {
        super(state);
    }

    static createWithError(error: unknown): SignUpSubmitPasswordResult {
        const result = new SignUpSubmitPasswordResult();
        result.error = new SignUpSubmitPasswordError(SignUpSubmitPasswordResult.createErrorData(error));
        result.state = new SignUpFailed();

        return result;
    }
}
