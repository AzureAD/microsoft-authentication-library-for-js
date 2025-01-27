/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { SignUpState } from "../../../core/auth_flow/AuthFlowState.js";
import { AuthFlowResultBase } from "../../../core/auth_flow/AuthFlowResultBase.js";
import { SignInContinuationStateHandler } from "../../../sign_in/auth_flow/state_handler/SignInContinuationStateHandler.js";
import { SignUpSubmitAttributesError } from "../error_type/SignUpError.js";
import { SignUpCodeRequiredStateHandler } from "../state_handler/SignUpCodeRequiredStateHandler.js";
import { SignUpPasswordRequiredStateHandler } from "../state_handler/SignUpPasswordRequiredStateHandler.js";

/*
 * Result of a sign-up operation that requires attributes.
 */
export class SignUpSubmitAttributesResult extends AuthFlowResultBase<
    SignUpState,
    SignUpSubmitAttributesError,
    void,
    | SignInContinuationStateHandler
    | SignUpCodeRequiredStateHandler
    | SignUpPasswordRequiredStateHandler
> {
    constructor(
        stateHandler?:
            | SignInContinuationStateHandler
            | SignUpCodeRequiredStateHandler
            | SignUpPasswordRequiredStateHandler,
    ) {
        super(undefined, stateHandler);

        if (this.stateHandler instanceof SignUpPasswordRequiredStateHandler) {
            this._state = SignUpState.PasswordRequired;
        } else if (
            this.stateHandler instanceof SignUpCodeRequiredStateHandler
        ) {
            this._state = SignUpState.CodeRequired;
        } else if (
            this.stateHandler instanceof SignInContinuationStateHandler
        ) {
            this._state = SignUpState.Completed;
        }
    }

    get state(): SignUpState {
        if (!!this.error) {
            return SignUpState.Failed;
        }

        if (this._state !== undefined && this._state !== null) {
            return this._state;
        }

        return SignUpState.Unknown;
    }
}
