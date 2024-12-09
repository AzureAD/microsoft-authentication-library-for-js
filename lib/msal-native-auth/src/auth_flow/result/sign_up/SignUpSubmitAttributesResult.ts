/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { SignInContinuationStateHandler } from "../../state_handler/sign_in/SignInContinuationStateHandler.js";
import { SignUpState } from "../AuthFlowState.js";
import { ResultBase } from "../ResultBase.js";

/*
 * Result of a sign-up operation that requires attributes.
 */
export class SignUpSubmitAttributesResult extends ResultBase<
    SignUpState,
    void,
    SignInContinuationStateHandler
> {
    constructor(stateHandler?: SignInContinuationStateHandler) {
        super(undefined, stateHandler);
    }

    get state(): SignUpState {
        if (this.error) {
            return SignUpState.Failed;
        }

        if (this.stateHandler) {
            return SignUpState.Completed;
        }

        return SignUpState.Unknown;
    }
}
