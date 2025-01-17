/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { InvalidArgumentError } from "../../../core/error/InvalidArgumentError.js";
import { ResetPasswordSubmitPasswordError } from "../error_type/ResetPasswordError.js";
import { ResetPasswordSubmitPasswordResult } from "../result/ResetPasswordSubmitPasswordResult.js";
import { ResetPasswordStateHandler } from "./ResetPasswordStateHandler.js";

/*
 * Reset password handler for the state of password required.
 */
export class ResetPasswordPasswordRequiredStateHandler extends ResetPasswordStateHandler {
    /*
     * Submits a password for reset password.
     * @param password - The password to submit.
     * @returns The result of the operation.
     */
    async sumbmitPassword(
        password: string,
    ): Promise<ResetPasswordSubmitPasswordResult> {
        if (!password) {
            return Promise.resolve(
                ResetPasswordSubmitPasswordResult.createWithError(
                    new InvalidArgumentError("password", this.correlationId),
                    ResetPasswordSubmitPasswordError,
                ),
            );
        }

        throw new Error("Method not implemented.");
    }
}
