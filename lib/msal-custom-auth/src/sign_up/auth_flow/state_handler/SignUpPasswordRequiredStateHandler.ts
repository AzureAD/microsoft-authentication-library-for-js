/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { InvalidArgumentError } from "../../../core/error/InvalidArgumentError.js";
import { UnexpectedError } from "../../../core/error/UnexpectedError.js";
import { SignInContinuationStateHandler } from "../../../sign_in/auth_flow/state_handler/SignInContinuationStateHandler.js";
import {
    SignUpAttributesRequiredResult,
    SignUpCodeRequiredResult,
    SignUpCompletedResult,
} from "../../interaction_client/result/SignUpActionResult.js";
import { SignUpSubmitPasswordError } from "../error_type/SignUpError.js";
import { SignUpSubmitPasswordResult } from "../result/SignUpSubmitPasswordResult.js";
import { SignUpAttributesRequiredStateHandler } from "./SignUpAttributesRequiredStateHandler.js";
import { SignUpCodeRequiredStateHandler } from "./SignUpCodeRequiredStateHandler.js";
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
            this.logger.error("Password parameter is required for sign-up.");

            return Promise.resolve(
                SignUpSubmitPasswordResult.createWithError(
                    new InvalidArgumentError("password", this.correlationId),
                    SignUpSubmitPasswordError,
                ),
            );
        }

        try {
            this.logger.info("Submitting password for sign-up.");

            const result = await this.signUpClient.submitPassword({
                clientId: this.config.auth.clientId,
                correlationId: this.correlationId,
                challengeType: this.config.customAuth.challengeTypes ?? [],
                continuationToken: this.continuationToken ?? "",
                password: password,
                username: this.username,
            });

            this.logger.info("Password submitted for sign-up.");

            if (result instanceof SignUpCodeRequiredResult) {
                // Code required
                this.logger.info("Code required for sign-up.");

                return new SignUpSubmitPasswordResult(
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
            } else if (result instanceof SignUpAttributesRequiredResult) {
                // Attributes required
                this.logger.info("Attributes required for sign-up.");

                return new SignUpSubmitPasswordResult(
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

                return new SignUpSubmitPasswordResult(
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

            return SignUpSubmitPasswordResult.createWithError(
                new UnexpectedError("Unknown sign-up result type."),
                SignUpSubmitPasswordError,
            );
        } catch (error) {
            this.logger.error(
                `Failed to submit password for sign up. Error: ${error}.`,
            );

            return SignUpSubmitPasswordResult.createWithError(
                error,
                SignUpSubmitPasswordError,
            );
        }
    }
}
