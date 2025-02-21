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
import { CustomAuthTokenClient } from "../../../get_account/interaction_client/CustomAuthTokeClient.js";

/*
 * Sign-up handler used for the state of code required.
 */
export class SignUpCodeRequiredStateHandler extends SignUpStateHandler {
    constructor(
        username: string,
        signUpClient: SignUpClient,
        signInClient: SignInClient,
        tokenClient: CustomAuthTokenClient,
        correlationId: string,
        logger: Logger,
        continuationToken: string,
        config: CustomAuthBrowserConfiguration,
        public codeLength: number,
        public codeResendInterval: number,
    ) {
        super(username, signUpClient, signInClient, tokenClient, correlationId, logger, continuationToken, config);
    }

    /*
     * Submits a code for sign-up.
     * @param code - The code to submit.
     * @returns The result of the operation.
     */
    async submitCode(code: string): Promise<SignUpSubmitCodeResult> {
        try {
            this.ensureCodeIsValid(code, this.codeLength);

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
                    new SignUpPasswordRequired(
                        result.correlationId,
                        result.continuationToken,
                        this.logger,
                        this.config,
                        this.signInClient,
                        this.signUpClient,
                        this.tokenClient,
                        this.username,
                    ),
                );
            } else if (result instanceof SignUpAttributesRequiredResult) {
                // Attributes required
                this.logger.info("Attributes required for sign-up.");

                return new SignUpSubmitCodeResult(
                    new SignUpAttributesRequired(
                        result.correlationId,
                        result.continuationToken,
                        this.logger,
                        this.config,
                        this.signInClient,
                        this.signUpClient,
                        this.tokenClient,
                        this.username,
                        result.requiredAttributes,
                    ),
                );
            } else if (result instanceof SignUpCompletedResult) {
                // Sign-up completed
                this.logger.info("Sign-up completed.");

                return new SignUpSubmitCodeResult(
                    new SignUpCompleted(
                        result.correlationId,
                        result.continuationToken,
                        this.logger,
                        this.config,
                        this.signInClient,
                        this.tokenClient,
                        this.username,
                    ),
                );
            }

            return SignUpSubmitCodeResult.createWithError(new UnexpectedError("Unknown sign-up result type."));
        } catch (error) {
            this.logger.error(`Failed to submit code for sign up. Error: ${error}.`);

            return SignUpSubmitCodeResult.createWithError(error);
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
                new SignUpCodeRequired(
                    result.correlationId,
                    result.continuationToken,
                    this.logger,
                    this.config,
                    this.signInClient,
                    this.signUpClient,
                    this.tokenClient,
                    this.username,
                    result.codeLength,
                    result.interval,
                ),
            );
        } catch (error) {
            this.logger.error(`Failed to resend code for sign up. Error: ${error}.`);

            return SignUpResendCodeResult.createWithError(error);
        }
    }
}
