/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowResultBase } from "../../../core/auth_flow/AuthFlowResultBase.js";
import { SignUpSubmitPasswordError } from "../error_type/SignUpError.js";
import { SignUpAttributesRequiredState } from "../state/SignUpAttributesRequiredState.js";
import { SignUpCompletedState } from "../state/SignUpCompletedState.js";
import { SignUpFailedState } from "../state/SignUpFailedState.js";

/*
 * Result of a sign-up operation that requires a password.
 */
export class SignUpSubmitPasswordResult extends AuthFlowResultBase<
    SignUpSubmitPasswordResultState,
    SignUpSubmitPasswordError,
    void
> {
    constructor(state: SignUpSubmitPasswordResultState) {
        super(state);
    }

    static createWithError(error: unknown): SignUpSubmitPasswordResult {
        const result = new SignUpSubmitPasswordResult(new SignUpFailedState());
        result.error = new SignUpSubmitPasswordError(SignUpSubmitPasswordResult.createErrorData(error));

        return result;
    }
}

export type SignUpSubmitPasswordResultState = SignUpAttributesRequiredState | SignUpCompletedState | SignUpFailedState;
