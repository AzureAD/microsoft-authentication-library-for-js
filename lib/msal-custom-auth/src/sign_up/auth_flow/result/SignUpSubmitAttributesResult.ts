/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { SignUpState } from "../../../core/auth_flow/AuthFlowState.js";
import { ResultBase } from "../../../core/auth_flow/ResultBase.js";
import { SignInContinuationStateHandler } from "../../../sign_in/auth_flow/state_handler/SignInContinuationStateHandler.js";
import { SignUpSubmitAttributesError } from "../error_type/SignUpError.js";

/*
 * Result of a sign-up operation that requires attributes.
 */
export class SignUpSubmitAttributesResult extends ResultBase<
    SignUpState,
    SignUpSubmitAttributesError,
    void,
    SignInContinuationStateHandler
> {
    constructor(stateHandler?: SignInContinuationStateHandler) {
        super(undefined, stateHandler);
    }

    get state(): SignUpState {
        if (!!this.error) {
            return SignUpState.Failed;
        }

        if (!!this.stateHandler) {
            return SignUpState.Completed;
        }

        return SignUpState.Unknown;
    }
}
