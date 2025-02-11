/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ServerTelemetryManager } from "@azure/msal-browser";
import { CustomAuthApiError } from "../../core/error/CustomAuthApiError.js";
import { CustomAuthInteractionClientBase } from "../../core/interaction_client/CustomAuthInteractionClientBase.js";
import { CustomAuthApiErrorCode } from "../../core/network_client/custom_auth_api/types/ApiErrorResponseTypes.js";
import {
    ResetPasswordChallengeRequest,
    ResetPasswordContinueRequest,
    ResetPasswordPollCompletionRequest,
    ResetPasswordStartRequest,
    ResetPasswordSubmitRequest,
} from "../../core/network_client/custom_auth_api/types/ApiRequestTypes.js";
import { PublicApiId } from "../../core/telemetry/PublicApiId.js";
import { ArgumentValidator } from "../../core/utils/ArgumentValidator.js";
import {
    ChallengeType,
    DefaultCustomAuthApiCodeLength,
    PasswordResetPollingTimeoutInMs,
    ResetPasswordPollStatus,
} from "../../CustomAuthConstants.js";
import {
    ResetPasswordResendCodeParams,
    ResetPasswordStartParams,
    ResetPasswordSubmitCodeParams,
    ResetPasswordSubmitNewPasswordParams,
} from "./parameter/ResetPasswordParams.js";
import {
    ResetPasswordCodeRequiredResult,
    ResetPasswordCompletedResult,
    ResetPasswordPasswordRequiredResult,
} from "./result/ResetPasswordActionResult.js";

export class ResetPasswordClient extends CustomAuthInteractionClientBase {
    /**
     * Starts the password reset flow.
     * @param parameters The parameters for starting the password reset flow.
     * @returns The result of password reset start operation.
     */
    async start(parameters: ResetPasswordStartParams): Promise<ResetPasswordCodeRequiredResult> {
        ArgumentValidator.ensureArgumentIsNotNullOrUndefined("parameters", parameters);

        const apiId = PublicApiId.PASSWORD_RESET_START;
        const telemetryManager = this.initializeServerTelemetryManager(apiId);

        const startRequest: ResetPasswordStartRequest = {
            challenge_type: parameters.challengeType.join(" "),
            username: parameters.username,
            correlationId: parameters.correlationId,
            telemetryManager: telemetryManager,
        };

        this.logger.info("Calling start endpoint for password reset flow.");

        const startResponse = await this.customAuthApiClient.resetPasswordApi.start(startRequest);

        this.logger.verbose("Start endpoint for password reset returned successfully.");

        const challengeRequest: ResetPasswordChallengeRequest = {
            continuation_token: startResponse.continuation_token ?? "",
            challenge_type: parameters.challengeType.join(" "),
            correlationId: parameters.correlationId,
            telemetryManager: telemetryManager,
        };

        return this.performChallengeRequest(challengeRequest);
    }

    /**
     * Submits the code for password reset.
     * @param parameters The parameters for submitting the code for password reset.
     * @returns The result of submitting the code for password reset.
     */
    async submitCode(parameters: ResetPasswordSubmitCodeParams): Promise<ResetPasswordPasswordRequiredResult> {
        ArgumentValidator.ensureArgumentIsNotNullOrUndefined("parameters", parameters);
        ArgumentValidator.ensureArgumentIsNotEmptyString("parameters.code", parameters.code, parameters.correlationId);

        const apiId = PublicApiId.PASSWORD_RESET_SUBMIT_CODE;
        const telemetryManager = this.initializeServerTelemetryManager(apiId);

        const continueRequest: ResetPasswordContinueRequest = {
            continuation_token: parameters.continuationToken,
            oob: parameters.code,
            correlationId: parameters.correlationId,
            telemetryManager: telemetryManager,
        };

        this.logger.info("Calling continue endpoint with code for password reset.");

        const response = await this.customAuthApiClient.resetPasswordApi.continueWithCode(continueRequest);

        this.logger.info("Continue endpoint called successfully with code for password reset.");

        return new ResetPasswordPasswordRequiredResult(response.correlation_id, response.continuation_token ?? "");
    }

    /**
     * Resends the code for password reset.
     * @param parameters The parameters for resending the code for password reset.
     * @returns The result of resending the code for password reset.
     */
    async resendCode(parameters: ResetPasswordResendCodeParams): Promise<ResetPasswordCodeRequiredResult> {
        ArgumentValidator.ensureArgumentIsNotNullOrUndefined("parameters", parameters);

        const apiId = PublicApiId.PASSWORD_RESET_RESEND_CODE;
        const telemetryManager = this.initializeServerTelemetryManager(apiId);

        const challengeRequest: ResetPasswordChallengeRequest = {
            continuation_token: parameters.continuationToken,
            challenge_type: parameters.challengeType.join(" "),
            correlationId: parameters.correlationId,
            telemetryManager: telemetryManager,
        };

        return this.performChallengeRequest(challengeRequest);
    }

    /**
     * Submits the new password for password reset.
     * @param parameters The parameters for submitting the new password for password reset.
     * @returns The result of submitting the new password for password reset.
     */
    async submitNewPassword(parameters: ResetPasswordSubmitNewPasswordParams): Promise<ResetPasswordCompletedResult> {
        ArgumentValidator.ensureArgumentIsNotNullOrUndefined("parameters", parameters);
        ArgumentValidator.ensureArgumentIsNotEmptyString(
            "parameters.newPassword",
            parameters.newPassword,
            parameters.correlationId,
        );

        const apiId = PublicApiId.PASSWORD_RESET_SUBMIT_PASSWORD;
        const telemetryManager = this.initializeServerTelemetryManager(apiId);

        const submitRequest: ResetPasswordSubmitRequest = {
            continuation_token: parameters.continuationToken,
            new_password: parameters.newPassword,
            correlationId: parameters.correlationId,
            telemetryManager: telemetryManager,
        };

        this.logger.info("Calling submit endpoint with new password for password reset.");

        const submitResponse = await this.customAuthApiClient.resetPasswordApi.submitNewPassword(submitRequest);

        this.logger.info("Submit endpoint called successfully with new password for password reset.");

        return this.performPollCompletionRequest(
            submitResponse.continuation_token ?? "",
            submitResponse.poll_interval,
            parameters.correlationId,
            telemetryManager,
        );
    }

    private async performChallengeRequest(
        request: ResetPasswordChallengeRequest,
    ): Promise<ResetPasswordCodeRequiredResult> {
        this.logger.info("Calling challenge endpoint for password reset flow.");

        const response = await this.customAuthApiClient.resetPasswordApi.requestChallenge(request);

        this.logger.info("Challenge endpoint for password reset returned successfully.");

        if (response.challenge_type === ChallengeType.OOB) {
            // Code is required
            this.logger.info("Code is required for password reset flow.");

            return new ResetPasswordCodeRequiredResult(
                response.correlation_id,
                response.continuation_token ?? "",
                response.challenge_channel ?? "",
                response.challenge_target_label ?? "",
                response.code_length ?? DefaultCustomAuthApiCodeLength,
                response.binding_method ?? "",
            );
        }

        this.logger.error(
            `Unsupported challenge type '${response.challenge_type}' returned from challenge endpoint for password reset.`,
        );

        throw new CustomAuthApiError(
            CustomAuthApiErrorCode.UNSUPPORTED_CHALLENGE_TYPE,
            `Unsupported challenge type '${response.challenge_type}'.`,
            response.correlation_id,
        );
    }

    private async performPollCompletionRequest(
        continuationToken: string,
        pollInterval: number,
        correlationId: string,
        telemetryManager: ServerTelemetryManager,
    ): Promise<ResetPasswordCompletedResult> {
        const startTime = performance.now();

        while (performance.now() - startTime < PasswordResetPollingTimeoutInMs) {
            const pollRequest: ResetPasswordPollCompletionRequest = {
                continuation_token: continuationToken,
                correlationId: correlationId,
                telemetryManager: telemetryManager,
            };

            this.logger.info("Calling the poll completion endpoint for password reset flow.");

            const pollResponse = await this.customAuthApiClient.resetPasswordApi.pollCompletion(pollRequest);

            this.logger.info("Poll completion endpoint for password reset returned successfully.");

            if (pollResponse.status === ResetPasswordPollStatus.SUCCEEDED) {
                return new ResetPasswordCompletedResult(
                    pollResponse.correlation_id,
                    pollResponse.continuation_token ?? "",
                );
            } else if (pollResponse.status === ResetPasswordPollStatus.FAILED) {
                throw new CustomAuthApiError(
                    CustomAuthApiErrorCode.PASSWORD_CHANGE_FAILED,
                    "Password is failed to be reset.",
                    pollResponse.correlation_id,
                );
            }

            this.logger.info(
                `Poll completion endpoint for password reset is not started or in progress, waiting ${pollInterval} seconds for next check.`,
            );

            await this.delay(pollInterval * 1000);
        }

        this.logger.error("Password reset flow has timed out.");

        throw new CustomAuthApiError(
            CustomAuthApiErrorCode.PASSWORD_RESET_TIMEOUT,
            "Password reset flow has timed out.",
            correlationId,
        );
    }

    private async delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
