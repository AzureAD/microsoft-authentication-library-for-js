/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowResultBase } from "../../../core/auth_flow/AuthFlowResultBase.js";
import { SignUpError } from "../error_type/SignUpError.js";
import { SignUpAttributesRequiredState } from "../state/SignUpAttributesRequiredState.js";
import { SignUpCodeRequiredState } from "../state/SignUpCodeRequiredState.js";
import { SignUpFailedState } from "../state/SignUpFailedState.js";
import { SignUpPasswordRequiredState } from "../state/SignUpPasswordRequiredState.js";

/*
 * Result of a sign-up operation.
 */
export class SignUpResult extends AuthFlowResultBase<SignUpResultState, SignUpError, void> {
    constructor(state: SignUpResultState) {
        super(state);
    }

    static createWithError(error: unknown): SignUpResult {
        const result = new SignUpResult(new SignUpFailedState());
        result.error = new SignUpError(SignUpResult.createErrorData(error));

        return result;
    }
}

export type SignUpResultState =
    | SignUpCodeRequiredState
    | SignUpPasswordRequiredState
    | SignUpAttributesRequiredState
    | SignUpFailedState;
