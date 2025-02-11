/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ResetPasswordSubmitPasswordResult } from "../result/ResetPasswordSubmitPasswordResult.js";
import { ResetPasswordCompleted } from "../state/ResetPasswordCompleted.js";
import { ResetPasswordStateHandler } from "./ResetPasswordStateHandler.js";

/*
 * Reset password handler for the state of password required.
 */
export class ResetPasswordPasswordRequiredStateHandler extends ResetPasswordStateHandler {
    /*
     * Submits a new password for reset password.
     * @param password - The password to submit.
     * @returns The result of the operation.
     */
    async submitNewPassword(password: string): Promise<ResetPasswordSubmitPasswordResult> {
        try {
            this.ensurePasswordIsNotEmpty(password);

            this.logger.info("Submitting new password for password reset.");

            const result = await this.resetPasswordClient.submitNewPassword({
                clientId: this.config.auth.clientId,
                correlationId: this.correlationId,
                challengeType: this.config.customAuth.challengeTypes ?? [],
                continuationToken: this.continuationToken ?? "",
                newPassword: password,
                username: this.username,
            });

            this.logger.info("New password is submitted for sign-up.");

            return new ResetPasswordSubmitPasswordResult(
                new ResetPasswordCompleted(
                    result.correlationId,
                    result.continuationToken,
                    this.logger,
                    this.config,
                    this.signInClient,
                    this.username,
                ),
            );
        } catch (error) {
            this.logger.error(`Failed to submit password for password reset. Error: ${error}.`);

            return ResetPasswordSubmitPasswordResult.createWithError(error);
        }
    }
}
