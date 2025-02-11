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
    SignUpParamsBase,
    SignUpResendCodeParams,
    SignUpStartParams,
    SignUpSubmitCodeParams,
    SignUpSubmitPasswordParams,
    SignUpSubmitUserAttributesParams,
} from "./parameter/SignUpParams.js";
import {
    SignUpAttributesRequiredResult,
    SignUpCodeRequiredResult,
    SignUpCompletedResult,
    SignUpPasswordRequiredResult,
} from "./result/SignUpActionResult.js";
import {
    SignUpChallengeRequest,
    SignUpContinueWithAttributesRequest,
    SignUpContinueWithOobRequest,
    SignUpContinueWithPasswordRequest,
    SignUpStartRequest,
} from "../../core/network_client/custom_auth_api/types/ApiRequestTypes.js";
import { SignUpContinueResponse } from "../../core/network_client/custom_auth_api/types/ApiResponseTypes.js";

export class SignUpClient extends CustomAuthInteractionClientBase {
    /**
     * Starts the sign up flow.
     * @param parameters The parameters for the sign up start action.
     * @returns The result of the sign up start action.
     */
    async start(parameters: SignUpStartParams): Promise<SignUpPasswordRequiredResult | SignUpCodeRequiredResult> {
        ArgumentValidator.ensureArgumentIsNotNullOrUndefined("parameters", parameters);

        const apiId = !parameters.password ? PublicApiId.SIGN_UP_START : PublicApiId.SIGN_UP_WITH_PASSWORD_START;
        const telemetryManager = this.initializeServerTelemetryManager(apiId);

        const startRequest: SignUpStartRequest = {
            username: parameters.username,
            password: parameters.password,
            attributes: parameters.attributes,
            challenge_type: parameters.challengeType.join(" "),
            telemetryManager,
            correlationId: parameters.correlationId,
        };

        this.logger.info("Calling start endpoint for sign up.");

        const startResponse = await this.customAuthApiClient.signUpApi.start(startRequest);

        this.logger.info("Start endpoint called for sign up.");

        const challengeRequest: SignUpChallengeRequest = {
            continuation_token: startResponse.continuation_token ?? "",
            challenge_type: parameters.challengeType.join(" "),
            telemetryManager,
            correlationId: startResponse.correlation_id,
        };

        return this.performChallengeRequest(challengeRequest);
    }

    /**
     * Submits the code for the sign up flow.
     * @param parameters The parameters for the sign up submit code action.
     * @returns The result of the sign up submit code action.
     */
    async submitCode(
        parameters: SignUpSubmitCodeParams,
    ): Promise<SignUpCompletedResult | SignUpPasswordRequiredResult | SignUpAttributesRequiredResult> {
        ArgumentValidator.ensureArgumentIsNotNullOrUndefined("parameters", parameters);

        const apiId = PublicApiId.SIGN_UP_SUBMIT_CODE;
        const telemetryManager = this.initializeServerTelemetryManager(apiId);

        const requestSubmitCode: SignUpContinueWithOobRequest = {
            continuation_token: parameters.continuationToken,
            oob: parameters.code,
            telemetryManager,
            correlationId: parameters.correlationId,
        };

        const result = await this.performContinueRequest(
            "SignUpClient.submitCode",
            parameters,
            telemetryManager,
            () => this.customAuthApiClient.signUpApi.continueWithCode(requestSubmitCode),
            parameters.correlationId,
        );

        if (result instanceof SignUpCodeRequiredResult) {
            throw new CustomAuthApiError(
                CustomAuthApiErrorCode.UNSUPPORTED_CHALLENGE_TYPE,
                "The challenge type 'oob' is invalid after submtting code for sign up.",
                parameters.correlationId,
            );
        }

        return result;
    }

    /**
     * Submits the password for the sign up flow.
     * @param parameter The parameters for the sign up submit password action.
     * @returns The result of the sign up submit password action.
     */
    async submitPassword(
        parameter: SignUpSubmitPasswordParams,
    ): Promise<SignUpCompletedResult | SignUpCodeRequiredResult | SignUpAttributesRequiredResult> {
        ArgumentValidator.ensureArgumentIsNotNullOrUndefined("parameter", parameter);

        const apiId = PublicApiId.SIGN_UP_SUBMIT_PASSWORD;
        const telemetryManager = this.initializeServerTelemetryManager(apiId);

        const requestSubmitPwd: SignUpContinueWithPasswordRequest = {
            continuation_token: parameter.continuationToken,
            password: parameter.password,
            telemetryManager,
            correlationId: parameter.correlationId,
        };

        const result = await this.performContinueRequest(
            "SignUpClient.submitPassword",
            parameter,
            telemetryManager,
            () => this.customAuthApiClient.signUpApi.continueWithPassword(requestSubmitPwd),
            parameter.correlationId,
        );

        if (result instanceof SignUpPasswordRequiredResult) {
            throw new CustomAuthApiError(
                CustomAuthApiErrorCode.UNSUPPORTED_CHALLENGE_TYPE,
                "The challenge type 'password' is invalid after submtting password for sign up.",
                parameter.correlationId,
            );
        }

        return result;
    }

    /**
     * Submits the attributes for the sign up flow.
     * @param parameter The parameters for the sign up submit attributes action.
     * @returns The result of the sign up submit attributes action.
     */
    async submitAttributes(
        parameter: SignUpSubmitUserAttributesParams,
    ): Promise<SignUpCompletedResult | SignUpPasswordRequiredResult | SignUpCodeRequiredResult> {
        ArgumentValidator.ensureArgumentIsNotNullOrUndefined("parameter", parameter);

        const apiId = PublicApiId.SIGN_UP_SUBMIT_ATTRIBUTES;
        const telemetryManager = this.initializeServerTelemetryManager(apiId);
        const reqWithAttr: SignUpContinueWithAttributesRequest = {
            continuation_token: parameter.continuationToken,
            attributes: parameter.attributes,
            telemetryManager,
            correlationId: parameter.correlationId,
        };

        const result = await this.performContinueRequest(
            "SignUpClient.submitAttributes",
            parameter,
            telemetryManager,
            () => this.customAuthApiClient.signUpApi.continueWithAttributes(reqWithAttr),
            parameter.correlationId,
        );

        if (result instanceof SignUpAttributesRequiredResult) {
            throw new CustomAuthApiError(
                CustomAuthApiErrorCode.ATTRIBUTES_REQUIRED,
                "User attributes required",
                parameter.correlationId,
                [],
                "",
                result.requiredAttributes,
                result.continuationToken,
            );
        }

        return result;
    }

    /**
     * Resends the code for the sign up flow.
     * @param parameters The parameters for the sign up resend code action.
     * @returns The result of the sign up resend code action.
     */
    async resendCode(parameters: SignUpResendCodeParams): Promise<SignUpCodeRequiredResult> {
        ArgumentValidator.ensureArgumentIsNotNullOrUndefined("parameters", parameters);

        const apiId = PublicApiId.SIGN_UP_RESEND_CODE;
        const telemetryManager = this.initializeServerTelemetryManager(apiId);

        const challengeRequest: SignUpChallengeRequest = {
            continuation_token: parameters.continuationToken ?? "",
            challenge_type: parameters.challengeType.join(" "),
            telemetryManager,
            correlationId: parameters.correlationId,
        };

        const result = await this.performChallengeRequest(challengeRequest);

        if (result instanceof SignUpPasswordRequiredResult) {
            throw new CustomAuthApiError(
                CustomAuthApiErrorCode.UNSUPPORTED_CHALLENGE_TYPE,
                "The challenge type 'password' is invalid after resending code for sign up.",
                parameters.correlationId,
            );
        }

        return result;
    }

    private async performChallengeRequest(
        request: SignUpChallengeRequest,
    ): Promise<SignUpPasswordRequiredResult | SignUpCodeRequiredResult> {
        this.logger.info("Calling challenge endpoint for sign up.");

        const challengeResponse = await this.customAuthApiClient.signUpApi.requestChallenge(request);

        this.logger.info("Challenge endpoint called for sign up.");

        if (challengeResponse.challenge_type === ChallengeType.OOB) {
            // Code is required
            this.logger.info("Challenge type is oob for sign up.");

            return new SignUpCodeRequiredResult(
                challengeResponse.correlation_id,
                challengeResponse.continuation_token ?? "",
                challengeResponse.challenge_channel ?? "",
                challengeResponse.challenge_target_label ?? "",
                challengeResponse.code_length ?? DefaultCustomAuthApiCodeLength,
                challengeResponse.interval ?? DefaultCustomAuthApiCodeResendIntervalInSec,
                challengeResponse.binding_method ?? "",
            );
        }

        if (challengeResponse.challenge_type === ChallengeType.PASSWORD) {
            // Password is required
            this.logger.info("Challenge type is password for sign up.");

            return new SignUpPasswordRequiredResult(
                challengeResponse.correlation_id,
                challengeResponse.continuation_token ?? "",
            );
        }

        this.logger.error(`Unsupported challenge type '${challengeResponse.challenge_type}' for sign up.`);

        throw new CustomAuthApiError(
            CustomAuthApiErrorCode.UNSUPPORTED_CHALLENGE_TYPE,
            `Unsupported challenge type '${challengeResponse.challenge_type}'.`,
            request.correlationId,
        );
    }

    private async performContinueRequest(
        callerName: string,
        requestParams: SignUpParamsBase,
        telemetryManager: ServerTelemetryManager,
        responseGetter: () => Promise<SignUpContinueResponse>,
        requestCorrelationId: string,
    ): Promise<
        SignUpCompletedResult | SignUpPasswordRequiredResult | SignUpCodeRequiredResult | SignUpAttributesRequiredResult
    > {
        this.logger.info(`${callerName} is calling continue endpoint for sign up.`);

        try {
            const response = await responseGetter();

            this.logger.info(`Continue endpoint called by ${callerName} for sign up.`);

            return new SignUpCompletedResult(requestCorrelationId, response.continuation_token ?? "");
        } catch (error) {
            if (error instanceof CustomAuthApiError) {
                return this.handleContinueResponseError(
                    error,
                    error.correlationId ?? requestCorrelationId,
                    requestParams,
                    telemetryManager,
                );
            } else {
                this.logger.error(`${callerName} is failed to call continue endpoint for sign up. Error: ${error}`);

                throw new UnexpectedError(error, requestCorrelationId);
            }
        }
    }

    private async handleContinueResponseError(
        responseError: CustomAuthApiError,
        correlationId: string,
        requestParams: SignUpParamsBase,
        telemetryManager: ServerTelemetryManager,
    ): Promise<SignUpPasswordRequiredResult | SignUpCodeRequiredResult | SignUpAttributesRequiredResult> {
        if (
            responseError.error === CustomAuthApiErrorCode.CREDENTIAL_REQUIRED &&
            !!responseError.errorCodes &&
            responseError.errorCodes.includes(55103)
        ) {
            // Credential is required
            this.logger.info("The credential is required in the sign up flow.", correlationId);

            const continuationToken = this.readContinuationTokenFromResponeError(responseError);

            // Call the challenge endpoint to ensure the password challenge type is supported.
            const challengeRequest: SignUpChallengeRequest = {
                continuation_token: continuationToken,
                challenge_type: requestParams.challengeType.join(" "),
                telemetryManager,
                correlationId,
            };

            const challengeResult = await this.performChallengeRequest(challengeRequest);

            if (challengeResult instanceof SignUpPasswordRequiredResult) {
                return new SignUpPasswordRequiredResult(correlationId, challengeResult.continuationToken);
            }

            if (challengeResult instanceof SignUpCodeRequiredResult) {
                return new SignUpCodeRequiredResult(
                    challengeResult.correlationId,
                    challengeResult.continuationToken,
                    challengeResult.challengeChannel,
                    challengeResult.challengeTargetLabel,
                    challengeResult.codeLength,
                    challengeResult.interval,
                    challengeResult.bindingMethod,
                );
            }

            throw new CustomAuthApiError(
                CustomAuthApiErrorCode.UNSUPPORTED_CHALLENGE_TYPE,
                "The challenge type is not supported.",
                correlationId,
            );
        }

        if (this.isAttributesRequiredError(responseError, correlationId)) {
            // Attributes are required
            this.logger.info("Attributes are required in the sign up flow.", correlationId);

            const continuationToken = this.readContinuationTokenFromResponeError(responseError);

            return new SignUpAttributesRequiredResult(correlationId, continuationToken, responseError.attributes ?? []);
        }

        throw responseError;
    }

    private isAttributesRequiredError(responseError: CustomAuthApiError, correlationId: string): boolean {
        if (responseError.error === CustomAuthApiErrorCode.ATTRIBUTES_REQUIRED) {
            if (!responseError.attributes || responseError.attributes.length === 0) {
                throw new CustomAuthApiError(
                    CustomAuthApiErrorCode.INVALID_RESPONSE_BODY,
                    "Attributes are required but required_attributes field is missing in the response body.",
                    correlationId,
                );
            }

            return true;
        }

        return false;
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
