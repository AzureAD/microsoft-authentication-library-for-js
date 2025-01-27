/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AccountInfo } from "../../../account/auth_flow/model/AccountInfo.js";
import { InvalidArgumentError } from "../../../core/error/InvalidArgumentError.js";
import {
    SignInResendCodeParams,
    SignInSubmitCodeParams,
} from "../../interaction_client/parameter/SignInParams.js";
import {
    SignInResendCodeError,
    SignInSubmitCodeError,
} from "../error_type/SignInError.js";
import { SignInResendCodeResult } from "../result/SignInResendCodeResult.js";
import { SignInSubmitCodeResult } from "../result/SignInSubmitCodeResult.js";
import { SignInStateHandler } from "./SignInStateHandler.js";

/*
 * Sign-in handler for the state which requires a code.
 */
export class SignInCodeRequiredStateHandler extends SignInStateHandler {
    /*
     * Submits a code for sign-in.
     * @param code - The code to submit.
     * @returns The result of the operation.
     */
    async submitCode(code: string): Promise<SignInSubmitCodeResult> {
        if (!code) {
            this.logger.error("Code is required for sign-in.");

            const result = SignInSubmitCodeResult.createWithError(
                new InvalidArgumentError("code", this.correlationId),
                SignInSubmitCodeError,
            );

            return Promise.resolve(result);
        }

        try {
            const submitCodeParams: SignInSubmitCodeParams = {
                clientId: this.config.auth.clientId,
                correlationId: this.correlationId,
                challengeType: this.config.customAuth.challengeTypes ?? [],
                scopes: this.scopes ?? [],
                continuationToken: this.continuationToken ?? "",
                code: code,
                username: this.username,
            };

            this.logger.info("Submitting code for sign-in.");

            const completedResult =
                await this.signInClient.submitCode(submitCodeParams);

            this.logger.info("Code submitted for sign-in.");

            const accountManager = new AccountInfo(
                completedResult.authenticationResult.account,
                this.correlationId,
                this.config,
            );

            return new SignInSubmitCodeResult(accountManager);
        } catch (error) {
            this.logger.error(
                `Failed to submit code for sign-in. Error: ${error}.`,
            );

            return SignInSubmitCodeResult.createWithError(
                error,
                SignInSubmitCodeError,
            );
        }
    }

    /*
     * Resends a code for sign-in.
     * @returns The result of the operation.
     */
    async resendCode(): Promise<SignInResendCodeResult> {
        try {
            const submitCodeParams: SignInResendCodeParams = {
                clientId: this.config.auth.clientId,
                correlationId: this.correlationId,
                challengeType: this.config.customAuth.challengeTypes ?? [],
                scopes: this.scopes ?? [],
                continuationToken: this.continuationToken ?? "",
                username: this.username,
            };

            this.logger.info("Resending code for sign-in.");

            const result = await this.signInClient.resendCode(submitCodeParams);

            this.logger.info("Code resent for sign-in.");

            return new SignInResendCodeResult(
                new SignInCodeRequiredStateHandler(
                    this.username,
                    this.signInClient,
                    result.correlationId,
                    this.logger,
                    result.continuationToken,
                    this.config,
                    this.scopes,
                ),
            );
        } catch (error) {
            return SignInResendCodeResult.createWithError(
                error,
                SignInResendCodeError,
            );
        }
    }
}
