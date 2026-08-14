/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowActionRequiredStateBase } from "../../AuthFlowState.js";
import { MethodNotImplementedError } from "../../../error/MethodNotImplementedError.js";
import type { SignInAfterResetPasswordStateParameters } from "./CustomAuthV2StateParameters.js";
import type { SignInAfterResetPasswordResult } from "../result/SignInAfterResetPasswordResult.js";
import type { SignInAfterResetPasswordInputs } from "../../../../CustomAuthV2ActionInputs.js";

/**
 * State returned once a password reset has completed, allowing the app to sign
 * the just-reset user in without re-entering credentials. The reset flow does
 * not end at `CompletedState` directly; instead it surfaces this state carrying
 * the reset-flow continuation, mirroring V1's `ResetPasswordCompletedState` and
 * iOS's `SignInAfterResetPasswordState`. Calling {@link signIn} redeems that
 * continuation for tokens and reaches the completed state with account data.
 */
export class SignInAfterResetPasswordState extends AuthFlowActionRequiredStateBase<SignInAfterResetPasswordStateParameters> {
    readonly stateType = "signInAfterResetPassword";

    /**
     * Signs the user in using the continuation established by the completed
     * password reset. On success the returned result reaches the completed state
     * carrying the signed-in account data; on failure the result's error reports
     * why the follow-up sign-in could not complete.
     * @param inputs - Optional scopes and claims requested for the issued token.
     * @returns The result of signing in after the password reset.
     */
    async signIn(
        inputs?: SignInAfterResetPasswordInputs
    ): Promise<SignInAfterResetPasswordResult> {
        void inputs;
        throw new MethodNotImplementedError(
            "SignInAfterResetPasswordState.signIn"
        );
    }
}
