/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { InvalidArgumentError } from "../../../core/error/InvalidArgumentError.js";
import { UnexpectedError } from "../../../core/error/UnexpectedError.js";
import { SignInContinuationStateHandler } from "../../../sign_in/auth_flow/state_handler/SignInContinuationStateHandler.js";
import {
    SignUpAttributesRequiredResult,
    SignUpCompletedResult,
    SignUpPasswordRequiredResult,
} from "../../interaction_client/result/SignUpActionResult.js";
import {
    SignUpResendCodeError,
    SignUpSubmitCodeError,
} from "../error_type/SignUpError.js";
import { SignUpResendCodeResult } from "../result/SignUpResendCodeResult.js";
import { SignUpSubmitCodeResult } from "../result/SignUpSubmitCodeResult.js";
import { SignUpAttributesRequiredStateHandler } from "./SignUpAttributesRequiredStateHandler.js";
import { SignUpPasswordRequiredStateHandler } from "./SignUpPasswordRequiredStateHandler.js";
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
            this.logger.error("Code parameter is required for sign-up.");

            return Promise.resolve(
                SignUpSubmitCodeResult.createWithError(
                    new InvalidArgumentError("code", this.correlationId),
                    SignUpSubmitCodeError,
                ),
            );
        }

        try {
            this.logger.info("Submitting code for sign-up.");

            const result = await this.signUpClient.submitCode({
                clientId: this.config.auth.clientId,
                correlationId: this.correlationId,
                challengeType: this.config.customAuth.challengeTypes ?? [],
                continuationToken: this.continuationToken ?? "",
                code: code,
                username: this.username,
            });

            this.logger.info("Code submitted for sign-up.");

            if (result instanceof SignUpPasswordRequiredResult) {
                // Password required
                this.logger.info("Password required for sign-up.");

                return new SignUpSubmitCodeResult(
                    new SignUpPasswordRequiredStateHandler(
                        this.username,
                        this.signUpClient,
                        this.signInClient,
                        result.correlationId,
                        this.logger,
                        result.continuationToken,
                        this.config,
                    ),
                );
            } else if (result instanceof SignUpAttributesRequiredResult) {
                // Attributes required
                this.logger.info("Attributes required for sign-up.");

                return new SignUpSubmitCodeResult(
                    new SignUpAttributesRequiredStateHandler(
                        this.username,
                        this.signUpClient,
                        this.signInClient,
                        result.correlationId,
                        this.logger,
                        result.continuationToken,
                        this.config,
                    ),
                );
            } else if (result instanceof SignUpCompletedResult) {
                // Sign-up completed
                this.logger.info("Sign-up completed.");

                return new SignUpSubmitCodeResult(
                    new SignInContinuationStateHandler(
                        this.username,
                        this.signInClient,
                        result.correlationId,
                        this.logger,
                        result.continuationToken,
                        this.config,
                    ),
                );
            }

            return SignUpSubmitCodeResult.createWithError(
                new UnexpectedError("Unknown sign-up result type."),
                SignUpSubmitCodeError,
            );
        } catch (error) {
            this.logger.error(
                `Failed to submit code for sign up. Error: ${error}.`,
            );

            return SignUpSubmitCodeResult.createWithError(
                error,
                SignUpSubmitCodeError,
            );
        }
    }

    /*
     * Resends a code for sign-up.
     * @returns The result of the operation.
     */
    async resendCode(): Promise<SignUpResendCodeResult> {
        try {
            this.logger.info("Resending code for sign-up.");

            const result = await this.signUpClient.resendCode({
                clientId: this.config.auth.clientId,
                challengeType: this.config.customAuth.challengeTypes ?? [],
                username: this.username,
                correlationId: this.correlationId,
                continuationToken: this.continuationToken ?? "",
            });

            this.logger.info("Code resent for sign-up.");

            return new SignUpResendCodeResult(
                new SignUpCodeRequiredStateHandler(
                    this.username,
                    this.signUpClient,
                    this.signInClient,
                    result.correlationId,
                    this.logger,
                    result.continuationToken,
                    this.config,
                ),
            );
        } catch (error) {
            return SignUpResendCodeResult.createWithError(
                error,
                SignUpResendCodeError,
            );
        }
    }
}
