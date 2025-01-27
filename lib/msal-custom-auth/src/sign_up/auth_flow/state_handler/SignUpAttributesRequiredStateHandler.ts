/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { InvalidArgumentError } from "../../../core/error/InvalidArgumentError.js";
import { UnexpectedError } from "../../../core/error/UnexpectedError.js";
import { SignInContinuationStateHandler } from "../../../sign_in/auth_flow/state_handler/SignInContinuationStateHandler.js";
import { UserAccountAttributes } from "../../../UserAccountAttributes.js";
import {
    SignUpCodeRequiredResult,
    SignUpCompletedResult,
    SignUpPasswordRequiredResult,
} from "../../interaction_client/result/SignUpActionResult.js";
import { SignUpSubmitAttributesError } from "../error_type/SignUpError.js";
import { SignUpSubmitAttributesResult } from "../result/SignUpSubmitAttributesResult.js";
import { SignUpCodeRequiredStateHandler } from "./SignUpCodeRequiredStateHandler.js";
import { SignUpPasswordRequiredStateHandler } from "./SignUpPasswordRequiredStateHandler.js";
import { SignUpStateHandler } from "./SignUpStateHandler.js";

/*
 * Sign-up handler used for the state of attributes required.
 */
export class SignUpAttributesRequiredStateHandler extends SignUpStateHandler {
    /*
     * Submits attributes for sign-up.
     * @param attributes - The attributes to submit.
     * @returns The result of the operation.
     */
    async sumbmitAttributes(
        attributes: UserAccountAttributes,
    ): Promise<SignUpSubmitAttributesResult> {
        if (!attributes) {
            this.logger.error("Attributes are required for sign-up.");

            return Promise.resolve(
                SignUpSubmitAttributesResult.createWithError(
                    new InvalidArgumentError("attributes", this.correlationId),
                    SignUpSubmitAttributesError,
                ),
            );
        }

        try {
            this.logger.info("Submitting attributes for sign-up.");

            const result = await this.signUpClient.submitAttributes({
                clientId: this.config.auth.clientId,
                correlationId: this.correlationId,
                challengeType: this.config.customAuth.challengeTypes ?? [],
                continuationToken: this.continuationToken ?? "",
                attributes: attributes.toRecord(),
                username: this.username,
            });

            this.logger.info("Password submitted for sign-up.");

            if (result instanceof SignUpCodeRequiredResult) {
                // Code required
                this.logger.info("Code required for sign-up.");

                return new SignUpSubmitAttributesResult(
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
            } else if (result instanceof SignUpPasswordRequiredResult) {
                // Password required
                this.logger.info("Password required for sign-up.");

                return new SignUpSubmitAttributesResult(
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
            } else if (result instanceof SignUpCompletedResult) {
                // Sign-up completed
                this.logger.info("Sign-up completed.");

                return new SignUpSubmitAttributesResult(
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

            return SignUpSubmitAttributesResult.createWithError(
                new UnexpectedError("Unknown sign-up result type."),
                SignUpSubmitAttributesError,
            );
        } catch (error) {
            this.logger.error(
                `Failed to submit attributes for sign up. Error: ${error}.`,
            );

            return SignUpSubmitAttributesResult.createWithError(
                error,
                SignUpSubmitAttributesError,
            );
        }
    }
}
