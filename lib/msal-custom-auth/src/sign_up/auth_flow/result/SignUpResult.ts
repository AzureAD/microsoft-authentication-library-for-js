/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowResultBase } from "../../../core/auth_flow/AuthFlowResultBase.js";
import { SignUpError } from "../error_type/SignUpError.js";
import { SignUpCodeRequired } from "../state/SignUpCodeRequired.js";
import { SignUpPasswordRequired } from "../state/SignUpPasswordRequired.js";
import { SignUpAttributesRequired } from "../state/SignUpAttributesRequired.js";
import { SignUpFailed } from "../state/SignUpFailed.js";

/*
 * Result of a sign-up operation.
 */
export class SignUpResult extends AuthFlowResultBase<
    SignUpCodeRequired | SignUpPasswordRequired | SignUpAttributesRequired | SignUpFailed,
    SignUpError,
    void
> {
    constructor(state?: SignUpCodeRequired | SignUpPasswordRequired | SignUpAttributesRequired) {
        super(state);
    }

    /**
     * Creates a SignUpResult instance with error details when an exception thrown during sign-up.
     * @param {unknown} error
     * @returns {SignUpResult} The SignUpResult instance with a CustomAuthError error and failed state.
     */
    static createWithError(error: unknown): SignUpResult {
        const result = new SignUpResult();
        result.error = new SignUpError(SignUpResult.createErrorData(error));
        result.state = new SignUpFailed();

        return result;
    }
}
