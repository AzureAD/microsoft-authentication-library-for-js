/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { InvalidArgumentError } from "../../../core/error/InvalidArgumentError.js";
import { UnexpectedError } from "../../../core/error/UnexpectedError.js";
import {
    SignUpAttributesRequiredResult,
    SignUpCodeRequiredResult,
    SignUpCompletedResult,
} from "../../interaction_client/result/SignUpActionResult.js";
import { SignUpSubmitPasswordResult } from "../result/SignUpSubmitPasswordResult.js";
import { SignUpAttributesRequired } from "../state/SignUpAttributesRequired.js";
import { SignUpCodeRequired } from "../state/SignUpCodeRequired.js";
import { SignUpCompleted } from "../state/SignUpCompleted.js";
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
                    new SignUpCodeRequired(
                        result.correlationId,
                        result.continuationToken,
                        this.logger,
                        this.config,
                        this.signInClient,
                        this.signUpClient,
                        this.username,
                        result.codeLength,
                        result.interval,
                    ),
                );
            } else if (result instanceof SignUpAttributesRequiredResult) {
                // Attributes required
                this.logger.info("Attributes required for sign-up.");

                return new SignUpSubmitPasswordResult(
                    new SignUpAttributesRequired(
                        result.correlationId,
                        result.continuationToken,
                        this.logger,
                        this.config,
                        this.signInClient,
                        this.signUpClient,
                        this.username,
                        result.requiredAttributes,
                    ),
                );
            } else if (result instanceof SignUpCompletedResult) {
                // Sign-up completed
                this.logger.info("Sign-up completed.");

                return new SignUpSubmitPasswordResult(
                    new SignUpCompleted(
                        result.correlationId,
                        result.continuationToken,
                        this.logger,
                        this.config,
                        this.signInClient,
                        this.username,
                    ),
                );
            }

            return SignUpSubmitPasswordResult.createWithError(
                new UnexpectedError("Unknown sign-up result type."),
            );
        } catch (error) {
            this.logger.error(
                `Failed to submit password for sign up. Error: ${error}.`,
            );

            return SignUpSubmitPasswordResult.createWithError(error);
        }
    }
}
