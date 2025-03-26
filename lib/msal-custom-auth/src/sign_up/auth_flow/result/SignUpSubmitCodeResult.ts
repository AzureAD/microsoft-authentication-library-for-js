/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowResultBase } from "../../../core/auth_flow/AuthFlowResultBase.js";
import { SignUpSubmitCodeError } from "../error_type/SignUpError.js";
import { SignUpAttributesRequiredState } from "../state/SignUpAttributesRequiredState.js";
import { SignUpPasswordRequiredState } from "../state/SignUpPasswordRequiredState.js";
import { SignUpCompletedState } from "../state/SignUpCompletedState.js";
import { SignUpFailedState } from "../state/SignUpFailedState.js";

/*
 * Result of a sign-up operation that requires a code.
 */
export class SignUpSubmitCodeResult extends AuthFlowResultBase<
    SignUpSubmitCodeResultState,
    SignUpSubmitCodeError,
    void
> {
    constructor(state: SignUpSubmitCodeResultState) {
        super(state);
    }

    static createWithError(error: unknown): SignUpSubmitCodeResult {
        const result = new SignUpSubmitCodeResult(new SignUpFailedState());
        result.error = new SignUpSubmitCodeError(SignUpSubmitCodeResult.createErrorData(error));

        return result;
    }
}

export type SignUpSubmitCodeResultState =
    | SignUpPasswordRequiredState
    | SignUpAttributesRequiredState
    | SignUpCompletedState
    | SignUpFailedState;
