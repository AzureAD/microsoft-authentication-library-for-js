/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Logger } from "@azure/msal-browser";
import { ResetPasswordResendCodeResult } from "../result/ResetPasswordResendCodeResult.js";
import { ResetPasswordSubmitCodeResult } from "../result/ResetPasswordSubmitCodeResult.js";
import { ResetPasswordStateHandler } from "./ResetPasswordStateHandler.js";
import { CustomAuthBrowserConfiguration } from "../../../configuration/CustomAuthConfiguration.js";
import { ResetPasswordClient } from "../../interaction_client/ResetPasswordClient.js";
import { SignInClient } from "../../../sign_in/interaction_client/SignInClient.js";
import { ResetPasswordCodeRequired } from "../state/ResetPasswordCodeRequired.js";
import { ResetPasswordPasswordRequired } from "../state/ResetPasswordPasswordRequired.js";
import { CustomAuthSilentCacheClient } from "../../../get_account/interaction_client/CustomAuthSilentCacheClient.js";

/*
 * Reset password handler for the state of code required.
 */
export class ResetPasswordCodeRequiredStateHandler extends ResetPasswordStateHandler {
    constructor(
        correlationId: string,
        logger: Logger,
        continuationToken: string,
        config: CustomAuthBrowserConfiguration,
        resetPasswordClient: ResetPasswordClient,
        signInClient: SignInClient,
        cacheClient: CustomAuthSilentCacheClient,
        username: string,
        public codeLength: number,
    ) {
        super(
            correlationId,
            logger,
            continuationToken,
            config,
            resetPasswordClient,
            signInClient,
            cacheClient,
            username,
        );
    }

    /**
     * Submits a code for reset password.
     * @param {string} code - The code to submit.
     * @returns {Promise<ResetPasswordSubmitCodeResult>} The result of the operation.
     */
    async submitCode(code: string): Promise<ResetPasswordSubmitCodeResult> {
        try {
            this.ensureCodeIsValid(code, this.codeLength);

            this.logger.verbose("Submitting code for password reset.", this.correlationId);

            const result = await this.resetPasswordClient.submitCode({
                clientId: this.config.auth.clientId,
                correlationId: this.correlationId,
                challengeType: this.config.customAuth.challengeTypes ?? [],
                continuationToken: this.continuationToken ?? "",
                code: code,
                username: this.username,
            });

            this.logger.verbose("Code is submitted for password reset.", this.correlationId);

            return new ResetPasswordSubmitCodeResult(
                new ResetPasswordPasswordRequired(
                    result.correlationId,
                    result.continuationToken,
                    this.logger,
                    this.config,
                    this.resetPasswordClient,
                    this.signInClient,
                    this.cacheClient,
                    this.username,
                ),
            );
        } catch (error) {
            this.logger.errorPii(`Failed to submit code for password reset. Error: ${error}.`, this.correlationId);

            return ResetPasswordSubmitCodeResult.createWithError(error);
        }
    }

    /**
     * Resends a code for reset password.
     * @returns {Promise<ResetPasswordResendCodeResult>} The result of the operation.
     */
    async resendCode(): Promise<ResetPasswordResendCodeResult> {
        try {
            this.logger.verbose("Resending code for password reset.", this.correlationId);

            const result = await this.resetPasswordClient.resendCode({
                clientId: this.config.auth.clientId,
                challengeType: this.config.customAuth.challengeTypes ?? [],
                username: this.username,
                correlationId: this.correlationId,
                continuationToken: this.continuationToken ?? "",
            });

            this.logger.verbose("Code is resent for password reset.", this.correlationId);

            return new ResetPasswordResendCodeResult(
                new ResetPasswordCodeRequired(
                    result.correlationId,
                    result.continuationToken,
                    this.logger,
                    this.config,
                    this.resetPasswordClient,
                    this.signInClient,
                    this.cacheClient,
                    this.username,
                    result.codeLength,
                ),
            );
        } catch (error) {
            this.logger.errorPii(`Failed to resend code for password reset. Error: ${error}.`, this.correlationId);

            return ResetPasswordResendCodeResult.createWithError(error);
        }
    }
}
