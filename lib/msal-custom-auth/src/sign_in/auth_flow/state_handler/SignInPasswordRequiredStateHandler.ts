/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AccountInfo } from "../../../account/auth_flow/model/AccountInfo.js";
import { InvalidArgumentError } from "../../../core/error/InvalidArgumentError.js";
import { SignInSubmitPasswordParams } from "../../interaction_client/parameter/SignInParams.js";
import { SignInSubmitPasswordError } from "../error_type/SignInError.js";
import { SignInSubmitPasswordResult } from "../result/SignInSubmitPasswordResult.js";
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
    async submitPassword(
        password: string
    ): Promise<SignInSubmitPasswordResult> {
        if (!password) {
            const result = SignInSubmitPasswordResult.createWithError(
                new InvalidArgumentError("password", this.correlationId),
                SignInSubmitPasswordError
            );

            return Promise.resolve(result);
        }

        try {
            const submitPasswordParams: SignInSubmitPasswordParams = {
                clientId: this.config.auth.clientId,
                correlationId: this.correlationId,
                challengeType: this.config.customAuth.challengeTypes ?? [],
                scopes: this.scopes ?? [],
                continuationToken: this.continuationToken ?? "",
                password: password,
                username: this.username,
            };

            this.logger.info("Submitting password for sign-in.");

            const completedResult = await this.signInClient.submitPassword(
                submitPasswordParams
            );

            this.logger.info("Password submitted for sign-in.");

            const accountInfo = new AccountInfo(
                completedResult.authenticationResult.account,
                this.correlationId,
                this.config
            );

            return new SignInSubmitPasswordResult(accountInfo);
        } catch (error) {
            this.logger.error(
                `Failed to sign in after submitting password. Error: ${error}.`
            );

            return SignInSubmitPasswordResult.createWithError(
                error,
                SignInSubmitPasswordError
            );
        }
    }
}
