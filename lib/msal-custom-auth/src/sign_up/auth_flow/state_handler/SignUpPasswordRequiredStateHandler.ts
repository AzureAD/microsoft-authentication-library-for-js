/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

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
    async submitPassword(password: string): Promise<SignUpSubmitPasswordResult> {
        try {
            this.ensurePasswordIsNotEmpty(password);

            this.logger.verbose("Submitting password for sign-up.", this.correlationId);

            const result = await this.signUpClient.submitPassword({
                clientId: this.config.auth.clientId,
                correlationId: this.correlationId,
                challengeType: this.config.customAuth.challengeTypes ?? [],
                continuationToken: this.continuationToken ?? "",
                password: password,
                username: this.username,
            });

            this.logger.verbose("Password submitted for sign-up.", this.correlationId);

            if (result instanceof SignUpCodeRequiredResult) {
                // Code required
                this.logger.verbose("Code required for sign-up.", this.correlationId);

                return new SignUpSubmitPasswordResult(
                    new SignUpCodeRequired(
                        result.correlationId,
                        result.continuationToken,
                        this.logger,
                        this.config,
                        this.signInClient,
                        this.signUpClient,
                        this.cacheClient,
                        this.username,
                        result.codeLength,
                        result.interval,
                    ),
                );
            } else if (result instanceof SignUpAttributesRequiredResult) {
                // Attributes required
                this.logger.verbose("Attributes required for sign-up.", this.correlationId);

                return new SignUpSubmitPasswordResult(
                    new SignUpAttributesRequired(
                        result.correlationId,
                        result.continuationToken,
                        this.logger,
                        this.config,
                        this.signInClient,
                        this.signUpClient,
                        this.cacheClient,
                        this.username,
                        result.requiredAttributes,
                    ),
                );
            } else if (result instanceof SignUpCompletedResult) {
                // Sign-up completed
                this.logger.verbose("Sign-up completed.", this.correlationId);

                return new SignUpSubmitPasswordResult(
                    new SignUpCompleted(
                        result.correlationId,
                        result.continuationToken,
                        this.logger,
                        this.config,
                        this.signInClient,
                        this.cacheClient,
                        this.username,
                    ),
                );
            }

            return SignUpSubmitPasswordResult.createWithError(
                new UnexpectedError("Unknown sign-up result type.", this.correlationId),
            );
        } catch (error) {
            this.logger.errorPii(`Failed to submit password for sign up. Error: ${error}.`, this.correlationId);

            return SignUpSubmitPasswordResult.createWithError(error);
        }
    }
}
