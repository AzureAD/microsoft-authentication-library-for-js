/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { InvalidArgumentError } from "../../../error/InvalidArgumentError.js";
import { SignInSubmitPasswordResult } from "../../result/sign_in/SignInSubmitPasswordResult.js";
import { SignInStateHandler } from "./SignInStateHandler.js";

/*
 * Sign-in handler for the state which requires a password.
 */
export class SignInPasswordRequiredStateHandler extends SignInStateHandler {
    /*
     * Submits a password for sign-in.
     * @param password - The password to submit.
     * @returns The result of the operation.
     */
    async sumbmitPassword(
        password: string
    ): Promise<SignInSubmitPasswordResult> {
        if (!password) {
            const result = SignInSubmitPasswordResult.createWithError(
                new InvalidArgumentError("password", this.correlationId)
            );

            return Promise.resolve(result);
        }

        throw new Error("Method not implemented.");
    }
}
