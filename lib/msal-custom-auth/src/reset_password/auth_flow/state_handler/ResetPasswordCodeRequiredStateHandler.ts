/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { InvalidArgumentError } from "../../../core/error/InvalidArgumentError.js";
import { ResetPasswordResendCodeResult } from "../result/ResetPasswordResendCodeResult.js";
import { ResetPasswordSubmitCodeResult } from "../result/ResetPasswordSubmitCodeResult.js";
import { ResetPasswordStateHandler } from "./ResetPasswordStateHandler.js";

/*
 * Reset password handler for the state of code required.
 */
export class ResetPasswordCodeRequiredStateHandler extends ResetPasswordStateHandler {
    /*
     * Submits a code for reset password.
     * @param code - The code to submit.
     * @returns The result of the operation.
     */
    async submitCode(code: string): Promise<ResetPasswordSubmitCodeResult> {
        if (!code) {
            return Promise.resolve(
                ResetPasswordSubmitCodeResult.createWithError(
                    new InvalidArgumentError("code", this.correlationId)
                )
            );
        }

        throw new Error("Method not implemented.");
    }

    /*
     * Resends a code for reset password.
     * @returns The result of the operation.
     */
    async resendCode(): Promise<ResetPasswordResendCodeResult> {
        throw new Error("Method not implemented.");
    }
}
