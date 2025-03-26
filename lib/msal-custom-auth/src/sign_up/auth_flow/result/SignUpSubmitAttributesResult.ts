/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowResultBase } from "../../../core/auth_flow/AuthFlowResultBase.js";
import { SignUpSubmitAttributesError } from "../error_type/SignUpError.js";
import { SignUpCompletedState } from "../state/SignUpCompletedState.js";
import { SignUpFailedState } from "../state/SignUpFailedState.js";

/*
 * Result of a sign-up operation that requires attributes.
 */
export class SignUpSubmitAttributesResult extends AuthFlowResultBase<
    SignUpSubmitAttributesResultState,
    SignUpSubmitAttributesError,
    void
> {
    constructor(state: SignUpSubmitAttributesResultState) {
        super(state);
    }

    static createWithError(error: unknown): SignUpSubmitAttributesResult {
        const result = new SignUpSubmitAttributesResult(new SignUpFailedState());
        result.error = new SignUpSubmitAttributesError(SignUpSubmitAttributesResult.createErrorData(error));

        return result;
    }
}

export type SignUpSubmitAttributesResultState = SignUpCompletedState | SignUpFailedState;
