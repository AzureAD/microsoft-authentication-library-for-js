/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { UnexpectedError } from "../../../core/error/UnexpectedError.js";
import { SignInState } from "./SignInState.js";
import { SignInPasswordRequiredStateParameters } from "./SignInStateParameters.js";
import { SignInCompletedState } from "./SignInCompletedState.js";
import { SignInCodeRequiredState } from "./SignInCodeRequiredState.js";
import { SignInSubmitPasswordResult } from "../result/SignInSubmitPasswordResult.js";
import { SignInCompletedResult, SignInCodeRequiredResult } from "../../interaction_client/result/SignInActionResult.js";

/*
 * Sign-in password required state.
 */
export class SignInPasswordRequiredState extends SignInState<SignInPasswordRequiredStateParameters> {
    /**
     * Submits a password for sign-in.
     * @param {string} password - The password to submit.
     * @returns {Promise<SignInSubmitPasswordResult>} The result of the operation.
     */
    async submitPassword(password: string): Promise<SignInSubmitPasswordResult> {
        try {
            this.ensurePasswordIsNotEmpty(password);

            this.stateParameters.logger.verbose("Submitting password for sign-in.", this.stateParameters.correlationId);

            const result = await this.stateParameters.signInClient.submitPassword({
                clientId: this.stateParameters.config.auth.clientId,
                correlationId: this.stateParameters.correlationId,
                challengeType: this.stateParameters.config.customAuth.challengeTypes ?? [],
                continuationToken: this.stateParameters.continuationToken ?? "",
                password: password,
                username: this.stateParameters.username,
            });

            this.stateParameters.logger.verbose("Password submitted for sign-in.", this.stateParameters.correlationId);

            if (result instanceof SignInCodeRequiredResult) {
                // Code required
                this.stateParameters.logger.verbose("Code required for sign-in.", this.stateParameters.correlationId);

                return new SignInSubmitPasswordResult(
                    new SignInCodeRequiredState({
                        correlationId: result.correlationId,
                        continuationToken: result.continuationToken,
                        logger: this.stateParameters.logger,
                        config: this.stateParameters.config,
                        signInClient: this.stateParameters.signInClient,
                        cacheClient: this.stateParameters.cacheClient,
                        username: this.stateParameters.username,
                        codeLength: result.codeLength,
                        codeResendInterval: result.interval,
                    }),
                );
            } else if (result instanceof SignInCompletedResult) {
                // Sign-in completed
                this.stateParameters.logger.verbose("Sign-in completed.", this.stateParameters.correlationId);

                return new SignInSubmitPasswordResult(
                    new SignInCompletedState({
                        correlationId: result.correlationId,
                        continuationToken: result.continuationToken,
                        logger: this.stateParameters.logger,
                        config: this.stateParameters.config,
                        signInClient: this.stateParameters.signInClient,
                        cacheClient: this.stateParameters.cacheClient,
                        username: this.stateParameters.username,
                    }),
                );
            }

            return SignInSubmitPasswordResult.createWithError(
                new UnexpectedError("Unknown sign-in result type.", this.stateParameters.correlationId),
            );
        } catch (error) {
            this.stateParameters.logger.errorPii(
                `Failed to submit password for sign in. Error: ${error}.`,
                this.stateParameters.correlationId,
            );

            return SignInSubmitPasswordResult.createWithError(error);
        }
    }
}
