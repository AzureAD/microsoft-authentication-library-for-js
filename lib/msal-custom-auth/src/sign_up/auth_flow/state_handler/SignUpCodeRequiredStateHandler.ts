/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Logger } from "@azure/msal-browser";
import { UnexpectedError } from "../../../core/error/UnexpectedError.js";
import { SignInClient } from "../../../sign_in/interaction_client/SignInClient.js";
import {
    SignUpAttributesRequiredResult,
    SignUpCompletedResult,
    SignUpPasswordRequiredResult,
} from "../../interaction_client/result/SignUpActionResult.js";
import { SignUpClient } from "../../interaction_client/SignUpClient.js";
import { SignUpResendCodeResult } from "../result/SignUpResendCodeResult.js";
import { SignUpSubmitCodeResult } from "../result/SignUpSubmitCodeResult.js";
import { SignUpStateHandler } from "./SignUpStateHandler.js";
import { CustomAuthBrowserConfiguration } from "../../../configuration/CustomAuthConfiguration.js";
import { SignUpCodeRequired } from "../state/SignUpCodeRequired.js";
import { SignUpCompleted } from "../state/SignUpCompleted.js";
import { SignUpPasswordRequired } from "../state/SignUpPasswordRequired.js";
import { SignUpAttributesRequired } from "../state/SignUpAttributesRequired.js";
import { CustomAuthSilentCacheClient } from "../../../get_account/interaction_client/CustomAuthSilentCacheClient.js";

/*
 * Sign-up handler used for the state of code required.
 */
export class SignUpCodeRequiredStateHandler extends SignUpStateHandler {
    constructor(
        username: string,
        signUpClient: SignUpClient,
        signInClient: SignInClient,
        cacheClient: CustomAuthSilentCacheClient,
        correlationId: string,
        logger: Logger,
        continuationToken: string,
        config: CustomAuthBrowserConfiguration,
        public codeLength: number,
        public codeResendInterval: number,
    ) {
        super(username, signUpClient, signInClient, cacheClient, correlationId, logger, continuationToken, config);
    }

    /*
     * Submits a code for sign-up.
     * @param code - The code to submit.
     * @returns The result of the operation.
     */
    async submitCode(code: string): Promise<SignUpSubmitCodeResult> {
        try {
            this.ensureCodeIsValid(code, this.codeLength);

            this.logger.info("Submitting code for sign-up.", this.correlationId);

            const result = await this.signUpClient.submitCode({
                clientId: this.config.auth.clientId,
                correlationId: this.correlationId,
                challengeType: this.config.customAuth.challengeTypes ?? [],
                continuationToken: this.continuationToken ?? "",
                code: code,
                username: this.username,
            });

            this.logger.info("Code submitted for sign-up.", this.correlationId);

            if (result instanceof SignUpPasswordRequiredResult) {
                // Password required
                this.logger.info("Password required for sign-up.", this.correlationId);

                return new SignUpSubmitCodeResult(
                    new SignUpPasswordRequired(
                        result.correlationId,
                        result.continuationToken,
                        this.logger,
                        this.config,
                        this.signInClient,
                        this.signUpClient,
                        this.cacheClient,
                        this.username,
                    ),
                );
            } else if (result instanceof SignUpAttributesRequiredResult) {
                // Attributes required
                this.logger.info("Attributes required for sign-up.", this.correlationId);

                return new SignUpSubmitCodeResult(
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
                this.logger.info("Sign-up completed.", this.correlationId);

                return new SignUpSubmitCodeResult(
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

            return SignUpSubmitCodeResult.createWithError(
                new UnexpectedError("Unknown sign-up result type.", this.correlationId),
            );
        } catch (error) {
            this.logger.errorPii(`Failed to submit code for sign up. Error: ${error}.`, this.correlationId);

            return SignUpSubmitCodeResult.createWithError(error);
        }
    }

    /*
     * Resends a code for sign-up.
     * @returns The result of the operation.
     */
    async resendCode(): Promise<SignUpResendCodeResult> {
        try {
            this.logger.info("Resending code for sign-up.", this.correlationId);

            const result = await this.signUpClient.resendCode({
                clientId: this.config.auth.clientId,
                challengeType: this.config.customAuth.challengeTypes ?? [],
                username: this.username,
                correlationId: this.correlationId,
                continuationToken: this.continuationToken ?? "",
            });

            this.logger.info("Code resent for sign-up.", this.correlationId);

            return new SignUpResendCodeResult(
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
        } catch (error) {
            this.logger.errorPii(`Failed to resend code for sign up. Error: ${error}.`, this.correlationId);

            return SignUpResendCodeResult.createWithError(error);
        }
    }
}
