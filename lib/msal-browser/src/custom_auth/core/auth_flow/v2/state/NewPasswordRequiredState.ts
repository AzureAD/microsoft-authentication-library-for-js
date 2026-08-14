/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowActionRequiredStateBase } from "../../AuthFlowState.js";
import { MethodNotImplementedError } from "../../../error/MethodNotImplementedError.js";
import type { NewPasswordRequiredStateParameters } from "./CustomAuthV2StateParameters.js";
import type { SubmitNewPasswordResult } from "../result/SubmitNewPasswordResult.js";

/**
 * State returned when the user must supply a new password to complete the flow.
 * This is the final password-entry step: once a valid new password is submitted
 * the reset completes and the flow surfaces `SignInAfterResetPasswordState` so
 * the app can sign the user in.
 */
export class NewPasswordRequiredState extends AuthFlowActionRequiredStateBase<NewPasswordRequiredStateParameters> {
    readonly stateType = "newPasswordRequired";

    /**
     * Submits the new password to complete the reset. On success the returned
     * result reaches `SignInAfterResetPasswordState`, from which the app signs
     * the user in; on failure the result's error reports whether the password
     * was rejected (for example too weak) so the app can prompt for a different
     * one.
     * @param password - The new password to set.
     * @returns The result of submitting the new password.
     */
    async submitNewPassword(password: string): Promise<SubmitNewPasswordResult> {
        void password;
        throw new MethodNotImplementedError(
            "NewPasswordRequiredState.submitNewPassword"
        );
    }
}
