/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowResultBase } from "../../../core/auth_flow/AuthFlowResultBase.js";
import { SignUpSubmitAttributesError } from "../error_type/SignUpError.js";
import { SignUpCodeRequired } from "../state/SignUpCodeRequired.js";
import { SignUpCompleted } from "../state/SignUpCompleted.js";
import { SignUpFailed } from "../state/SignUpFailed.js";
import { SignUpPasswordRequired } from "../state/SignUpPasswordRequired.js";

/*
 * Result of a sign-up operation that requires attributes.
 */
export class SignUpSubmitAttributesResult extends AuthFlowResultBase<
    SignUpCodeRequired | SignUpPasswordRequired | SignUpCompleted | SignUpFailed,
    SignUpSubmitAttributesError,
    void
> {
    constructor(state?: SignUpCodeRequired | SignUpPasswordRequired | SignUpCompleted) {
        super(state);
    }

    /**
     * Creates a SignUpSubmitAttributesResult instance with error details when an exception thrown during sign-up submit attributes.
     * @param {unknown} error
     * @returns {SignUpSubmitAttributesResult} The SignUpSubmitAttributesResult instance with a CustomAuthError error and failed state.
     */
    static createWithError(error: unknown): SignUpSubmitAttributesResult {
        const result = new SignUpSubmitAttributesResult();
        result.error = new SignUpSubmitAttributesError(SignUpSubmitAttributesResult.createErrorData(error));
        result.state = new SignUpFailed();

        return result;
    }
}
