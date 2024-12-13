/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { InvalidArgumentError } from "../../../core/error/InvalidArgumentError.js";
import { SignUpResendCodeResult } from "../result/SignUpResendCodeResult.js";
import { SignUpSubmitCodeResult } from "../result/SignUpSubmitCodeResult.js";
import { SignUpStateHandler } from "./SignUpStateHandler.js";

/*
 * Sign-up handler used for the state of code required.
 */
export class SignUpCodeRequiredStateHandler extends SignUpStateHandler {
    /*
     * Submits a code for sign-up.
     * @param code - The code to submit.
     * @returns The result of the operation.
     */
    async submitCode(code: string): Promise<SignUpSubmitCodeResult> {
        if (!code) {
            return Promise.resolve(
                SignUpSubmitCodeResult.createWithError(
                    new InvalidArgumentError("code", this.correlationId)
                )
            );
        }

        throw new Error("Method not implemented.");
    }

    /*
     * Resends a code for sign-up.
     * @returns The result of the operation.
     */
    async resendCode(): Promise<SignUpResendCodeResult> {
        throw new Error("Method not implemented.");
    }
}
