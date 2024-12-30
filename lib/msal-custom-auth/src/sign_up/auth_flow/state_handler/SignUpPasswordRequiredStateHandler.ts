/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { InvalidArgumentError } from "../../../core/error/InvalidArgumentError.js";
import { SignUpSubmitPasswordResult } from "../result/SignUpSubmitPasswordResult.js";
import { SignUpStateHandler } from "./SignUpStateHandler.js";

/*
 * Sign-up handler used for the state of password required.
 */
export class SignUpPasswordRequiredStateHandler extends SignUpStateHandler {
    /*
     * Submits a password for sign-up.
     * @param password - The password to submit.
     * @returns The result of the operation.
     */
    async sumbmitPassword(
        password: string,
    ): Promise<SignUpSubmitPasswordResult> {
        if (!password) {
            return Promise.resolve(
                SignUpSubmitPasswordResult.createWithError(
                    new InvalidArgumentError("password", this.correlationId),
                ),
            );
        }

        throw new Error("Method not implemented.");
    }
}
