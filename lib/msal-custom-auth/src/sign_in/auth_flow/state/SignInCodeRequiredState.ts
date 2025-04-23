/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { UnexpectedError } from "../../../core/error/UnexpectedError.js";
import { SignInState } from "./SignInState.js";
import { SignInCodeRequiredStateParameters } from "./SignInStateParameters.js";
import { SignInSubmitCodeResult } from "../result/SignInSubmitCodeResult.js";
import { SignInCompletedState } from "./SignInCompletedState.js";
import { SignInResendCodeResult } from "../result/SignInResendCodeResult.js";
import { SignInCompletedResult, SignInCodeRequiredResult } from "../../interaction_client/result/SignInActionResult.js";

/*
 * Sign-in code required state.
 */
export class SignInCodeRequiredState extends SignInState<SignInCodeRequiredStateParameters> {
    /**
     * Submit one-time passcode to continue sign-in flow.
     * @param {string} code - The code to submit.
     * @returns {Promise<SignInSubmitCodeResult>} The result of the operation.
     */
    async submitCode(code: string): Promise<SignInSubmitCodeResult> {
        try {
            this.ensureCodeIsValid(code, this.stateParameters.codeLength);

            this.stateParameters.logger.verbose("Submitting code for sign-in.", this.stateParameters.correlationId);

            const result = await this.stateParameters.signInClient.submitCode({
                clientId: this.stateParameters.config.auth.clientId,
                correlationId: this.stateParameters.correlationId,
                challengeType: this.stateParameters.config.customAuth.challengeTypes ?? [],
                continuationToken: this.stateParameters.continuationToken ?? "",
                code: code,
                username: this.stateParameters.username,
            });

            this.stateParameters.logger.verbose("Code submitted for sign-in.", this.stateParameters.correlationId);

            if (result instanceof SignInCompletedResult) {
                // Sign-in completed
                this.stateParameters.logger.verbose("Sign-in completed.", this.stateParameters.correlationId);

                return new SignInSubmitCodeResult(
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

            return SignInSubmitCodeResult.createWithError(
                new UnexpectedError("Unknown sign-in result type.", this.stateParameters.correlationId),
            );
        } catch (error) {
            this.stateParameters.logger.errorPii(
                `Failed to submit code for sign in. Error: ${error}.`,
                this.stateParameters.correlationId,
            );

            return SignInSubmitCodeResult.createWithError(error);
        }
    }

    /**
     * Resends another one-time passcode for sign-in flow if the previous one hasn't been verified.
     * @returns {Promise<SignInResendCodeResult>} The result of the operation.
     */
    async resendCode(): Promise<SignInResendCodeResult> {
        try {
            this.stateParameters.logger.verbose("Resending code for sign-in.", this.stateParameters.correlationId);

            const result = await this.stateParameters.signInClient.resendCode({
                clientId: this.stateParameters.config.auth.clientId,
                challengeType: this.stateParameters.config.customAuth.challengeTypes ?? [],
                username: this.stateParameters.username,
                correlationId: this.stateParameters.correlationId,
                continuationToken: this.stateParameters.continuationToken ?? "",
            });

            this.stateParameters.logger.verbose("Code resent for sign-in.", this.stateParameters.correlationId);

            return new SignInResendCodeResult(
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
        } catch (error) {
            this.stateParameters.logger.errorPii(
                `Failed to resend code for sign in. Error: ${error}.`,
                this.stateParameters.correlationId,
            );

            return SignInResendCodeResult.createWithError(error);
        }
    }

    /**
     * Gets the sent code length.
     * @returns {number} The length of the code.
     */
    getCodeLength(): number {
        return this.stateParameters.codeLength;
    }

    /**
     * Gets the interval in seconds for the code to be resent.
     * @returns {number} The interval in seconds for the code to be resent.
     */
    getCodeResendInterval(): number {
        return this.stateParameters.codeResendInterval;
    }
}
