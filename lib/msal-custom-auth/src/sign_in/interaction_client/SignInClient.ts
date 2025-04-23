/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ServerTelemetryManager } from "@azure/msal-browser";
import { CustomAuthApiError } from "../../core/error/CustomAuthApiError.js";
import { CustomAuthApiErrorCode } from "../../core/network_client/custom_auth_api/types/ApiErrorResponseTypes.js";
import { UnexpectedError } from "../../core/error/UnexpectedError.js";
import { CustomAuthInteractionClientBase } from "../../core/interaction_client/CustomAuthInteractionClientBase.js";
import { PublicApiId } from "../../core/telemetry/PublicApiId.js";
import { ArgumentValidator } from "../../core/utils/ArgumentValidator.js";
import {
    ChallengeType,
    DefaultCustomAuthApiCodeLength,
    DefaultCustomAuthApiCodeResendIntervalInSec,
} from "../../CustomAuthConstants.js";
import {
    SignInParamsBase,
    SignInStartParams,
    SignInSubmitCodeParams,
    SignInSubmitPasswordParams,
    SignInResendCodeParams,
} from "./parameter/SignInParams.js";
import {
    SignInAttributesRequiredResult,
    SignInCodeRequiredResult,
    SignInCompletedResult,
    SignInPasswordRequiredResult,
} from "./result/SignInActionResult.js";

export class SignInClient extends CustomAuthInteractionClientBase {
    /**
     * Starts the sign in flow.
     * @param parameters The parameters for the sign in start action.
     * @returns The result of the sign in start action.
     */
    async start(parameters: SignInStartParams): Promise<SignInPasswordRequiredResult | SignInCodeRequiredResult> {
        ArgumentValidator.ensureArgumentIsNotNullOrUndefined("parameters", parameters, parameters.correlationId);

        const apiId = !parameters.password
            ? PublicApiId.SIGN_IN_WITH_CODE_START
            : PublicApiId.SIGN_IN_WITH_PASSWORD_START;
        const telemetryManager = this.initializeServerTelemetryManager(apiId);

        const startRequest = {
            username: parameters.username,
            password: parameters.password,
            challenge_type: this.getChallengeTypes(parameters.challengeType),
            telemetryManager,
            correlationId: parameters.correlationId,
        };

        this.logger.verbose("Initiating sign in.", parameters.correlationId);

        const startResponse = await this.customAuthApiClient.signInApi.initiate(startRequest);

        this.logger.verbose("Sign in initiated.", parameters.correlationId);

        const challengeRequest = {
            continuation_token: startResponse.continuation_token ?? "",
            challenge_type: this.getChallengeTypes(parameters.challengeType),
            telemetryManager,
            correlationId: startResponse.correlation_id,
        };

        return this.performChallengeRequest(challengeRequest);
    }

    /**
     * Submits the code for the sign in flow.
     * @param parameters The parameters for the sign in submit code action.
     * @returns The result of the sign in submit code action.
     */
    async submitCode(
        parameters: SignInSubmitCodeParams,
    ): Promise<SignInCompletedResult | SignInPasswordRequiredResult> {
        ArgumentValidator.ensureArgumentIsNotNullOrUndefined("parameters", parameters, parameters.correlationId);

        const apiId = PublicApiId.SIGN_IN_SUBMIT_CODE;
        const telemetryManager = this.initializeServerTelemetryManager(apiId);

        const requestSubmitCode = {
            continuation_token: parameters.continuationToken,
            oob: parameters.code,
            scope: "openid profile", // Default scopes required for sign-in
            telemetryManager,
            correlationId: parameters.correlationId,
        };

        const result = await this.performContinueRequest(
            "SignInClient.submitCode",
            parameters,
            telemetryManager,
            () => this.customAuthApiClient.signInApi.requestTokensWithOob(requestSubmitCode),
            parameters.correlationId,
        );

        if (result instanceof SignInCodeRequiredResult) {
            throw new CustomAuthApiError(
                CustomAuthApiErrorCode.UNSUPPORTED_CHALLENGE_TYPE,
                "The challenge type 'oob' is invalid after submitting code for sign in.",
                parameters.correlationId,
            );
        }

        return result;
    }

    /**
     * Submits the password for the sign in flow.
     * @param parameters The parameters for the sign in submit password action.
     * @returns The result of the sign in submit password action.
     */
    async submitPassword(
        parameters: SignInSubmitPasswordParams,
    ): Promise<SignInCompletedResult | SignInCodeRequiredResult> {
        ArgumentValidator.ensureArgumentIsNotNullOrUndefined("parameters", parameters, parameters.correlationId);

        const apiId = PublicApiId.SIGN_IN_SUBMIT_PASSWORD;
        const telemetryManager = this.initializeServerTelemetryManager(apiId);

        const requestSubmitPassword = {
            continuation_token: parameters.continuationToken,
            password: parameters.password,
            scope: "openid profile", // Default scopes required for sign-in
            telemetryManager,
            correlationId: parameters.correlationId,
        };

        const result = await this.performContinueRequest(
            "SignInClient.submitPassword",
            parameters,
            telemetryManager,
            () => this.customAuthApiClient.signInApi.requestTokensWithPassword(requestSubmitPassword),
            parameters.correlationId,
        );

        return result;
    }

    /**
     * Resends the code for the sign in flow.
     * @param parameters The parameters for the sign in resend code action.
     * @returns The result of the sign in resend code action.
     */
    async resendCode(parameters: SignInResendCodeParams): Promise<SignInCodeRequiredResult> {
        ArgumentValidator.ensureArgumentIsNotNullOrUndefined("parameters", parameters, parameters.correlationId);

        const apiId = PublicApiId.SIGN_IN_RESEND_CODE;
        const telemetryManager = this.initializeServerTelemetryManager(apiId);

        const challengeRequest = {
            continuation_token: parameters.continuationToken ?? "",
            challenge_type: this.getChallengeTypes(parameters.challengeType),
            telemetryManager,
            correlationId: parameters.correlationId,
        };

        const result = await this.performChallengeRequest(challengeRequest);

        if (result instanceof SignInPasswordRequiredResult) {
            throw new CustomAuthApiError(
                CustomAuthApiErrorCode.UNSUPPORTED_CHALLENGE_TYPE,
                "The challenge type 'password' is invalid after resending code for sign in.",
                parameters.correlationId,
            );
        }

        return result;
    }

    private async performChallengeRequest(
        request: any,
    ): Promise<SignInPasswordRequiredResult | SignInCodeRequiredResult> {
        this.logger.verbose("Calling challenge endpoint for sign in.", request.correlationId);

        const challengeResponse = await this.customAuthApiClient.signInApi.requestChallenge(request);

        this.logger.verbose("Challenge endpoint called for sign in.", request.correlationId);

        if (challengeResponse.challenge_type === ChallengeType.OOB) {
            // Code is required
            this.logger.verbose("Challenge type is oob for sign in.", request.correlationId);

            return new SignInCodeRequiredResult(
                challengeResponse.correlation_id,
                challengeResponse.continuation_token ?? "",
                challengeResponse.challenge_channel ?? "",
                challengeResponse.challenge_target_label ?? "",
                challengeResponse.code_length ?? DefaultCustomAuthApiCodeLength,
                challengeResponse.code_length ?? DefaultCustomAuthApiCodeLength,
                challengeResponse.binding_method ?? "",
            );
        }

        if (challengeResponse.challenge_type === ChallengeType.PASSWORD) {
            // Password is required
            this.logger.verbose("Challenge type is password for sign in.", request.correlationId);

            return new SignInPasswordRequiredResult(
                challengeResponse.correlation_id,
                challengeResponse.continuation_token ?? "",
            );
        }

        this.logger.error(
            `Unsupported challenge type '${challengeResponse.challenge_type}' for sign in.`,
            request.correlationId,
        );

        throw new CustomAuthApiError(
            CustomAuthApiErrorCode.UNSUPPORTED_CHALLENGE_TYPE,
            `Unsupported challenge type '${challengeResponse.challenge_type}'.`,
            request.correlationId,
        );
    }

    private async performContinueRequest(
        callerName: string,
        requestParams: SignInParamsBase,
        telemetryManager: ServerTelemetryManager,
        responseGetter: () => Promise<any>,
        requestCorrelationId: string,
    ): Promise<SignInCompletedResult | SignInPasswordRequiredResult | SignInCodeRequiredResult> {
        this.logger.verbose(`${callerName} is calling continue endpoint for sign in.`, requestCorrelationId);

        try {
            const response = await responseGetter();

            this.logger.verbose(`Continue endpoint called by ${callerName} for sign in.`, requestCorrelationId);

            return new SignInCompletedResult(requestCorrelationId, response.continuation_token ?? "");
        } catch (error) {
            if (error instanceof CustomAuthApiError) {
                return this.handleContinueResponseError(
                    error,
                    error.correlationId ?? requestCorrelationId,
                    requestParams,
                    telemetryManager,
                );
            } else {
                this.logger.errorPii(
                    `${callerName} failed to call continue endpoint for sign in. Error: ${error}`,
                    requestCorrelationId,
                );

                throw new UnexpectedError(error, requestCorrelationId);
            }
        }
    }

    private async handleContinueResponseError(
        responseError: CustomAuthApiError,
        correlationId: string,
        requestParams: SignInParamsBase,
        telemetryManager: ServerTelemetryManager,
    ): Promise<SignInPasswordRequiredResult | SignInCodeRequiredResult> {
        if (
            responseError.error === CustomAuthApiErrorCode.CREDENTIAL_REQUIRED &&
            !!responseError.errorCodes &&
            responseError.errorCodes.includes(55103)
        ) {
            // Credential is required
            this.logger.verbose("The credential is required in the sign in flow.", correlationId);

            const continuationToken = this.readContinuationTokenFromResponeError(responseError);

            // Call the challenge endpoint to ensure the password challenge type is supported.
            const challengeRequest = {
                continuation_token: continuationToken,
                challenge_type: this.getChallengeTypes(requestParams.challengeType),
                telemetryManager,
                correlationId,
            };

            return this.performChallengeRequest(challengeRequest);
        }

        throw responseError;
    }

    private readContinuationTokenFromResponeError(responseError: CustomAuthApiError): string {
        if (!responseError.continuationToken) {
            throw new CustomAuthApiError(
                CustomAuthApiErrorCode.CONTINUATION_TOKEN_MISSING,
                "Continuation token is missing in the response body",
                responseError.correlationId,
            );
        }

        return responseError.continuationToken;
    }
}
