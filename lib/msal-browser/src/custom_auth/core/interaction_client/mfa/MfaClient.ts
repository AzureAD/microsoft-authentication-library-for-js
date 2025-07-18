/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthInteractionClientBase } from "../CustomAuthInteractionClientBase.js";
import {
    MfaRequestChallengeParams,
    MfaSubmitChallengeParams,
    MfaGetAuthMethodsParams,
} from "./parameter/MfaClientParameters.js";
import {
    MfaVerificationRequiredResult,
    MfaMethodSelectionRequiredResult,
    MfaCompletedResult,
    MfaGetAuthMethodsResult,
    createMfaVerificationRequiredResult,
    createMfaMethodSelectionRequiredResult,
    createMfaCompletedResult,
    createMfaGetAuthMethodsResult,
} from "./result/MfaActionResult.js";
import {
    DefaultCustomAuthApiCodeLength,
    ChallengeType,
} from "../../../CustomAuthConstants.js";
import * as PublicApiId from "../../telemetry/PublicApiId.js";
import {
    SignInChallengeRequest,
    SignInOobTokenRequest,
    SignInIntrospectRequest,
} from "../../network_client/custom_auth_api/types/ApiRequestTypes.js";
import { ensureArgumentIsNotEmptyString } from "../../utils/ArgumentValidator.js";
import { CustomAuthApiError } from "../../error/CustomAuthApiError.js";
import * as CustomAuthApiErrorCode from "../../network_client/custom_auth_api/types/ApiErrorCodes.js";
import { INTROSPECT_REQUIRED } from "../../network_client/custom_auth_api/types/ApiSuberrors.js";

/**
 * MFA client for handling multi-factor authentication flows.
 */
export class MfaClient extends CustomAuthInteractionClientBase {
    /**
     * Requests an MFA challenge to be sent to the user.
     * @param parameters The parameters for requesting the challenge.
     * @returns Promise that resolves to either MfaVerificationRequiredResult or MfaMethodSelectionRequiredResult.
     */
    async requestChallenge(
        parameters: MfaRequestChallengeParams
    ): Promise<
        MfaVerificationRequiredResult | MfaMethodSelectionRequiredResult
    > {
        const apiId = PublicApiId.MFA_REQUEST_CHALLENGE;
        const telemetryManager = this.initializeServerTelemetryManager(apiId);

        this.logger.verbose(
            "Calling challenge endpoint for MFA.",
            parameters.correlationId
        );

        const challengeReq: SignInChallengeRequest = {
            challenge_type: this.getChallengeTypes(parameters.challengeType),
            continuation_token: parameters.continuationToken,
            id: parameters.authMethodId,
            correlationId: parameters.correlationId,
            telemetryManager: telemetryManager,
        };

        try {
            const challengeResponse =
                await this.customAuthApiClient.signInApi.requestChallenge(
                    challengeReq
                );

            this.logger.verbose(
                "Challenge endpoint called for MFA.",
                parameters.correlationId
            );

            if (challengeResponse.challenge_type === ChallengeType.OOB) {
                // Verification required - code will be sent
                return createMfaVerificationRequiredResult({
                    correlationId: challengeResponse.correlation_id,
                    continuationToken:
                        challengeResponse.continuation_token ?? "",
                    challengeChannel: challengeResponse.challenge_channel ?? "",
                    challengeTargetLabel:
                        challengeResponse.challenge_target_label ?? "",
                    codeLength:
                        challengeResponse.code_length ??
                        DefaultCustomAuthApiCodeLength,
                    bindingMethod: challengeResponse.binding_method ?? "",
                });
            }

            this.logger.error(
                `Unsupported challenge type '${challengeResponse.challenge_type}' for MFA.`,
                parameters.correlationId
            );

            throw new CustomAuthApiError(
                CustomAuthApiErrorCode.UNSUPPORTED_CHALLENGE_TYPE,
                `Unsupported challenge type '${challengeResponse.challenge_type}'.`,
                challengeResponse.correlation_id
            );
        } catch (error) {
            // Check if error indicates introspect is required
            if (
                error instanceof CustomAuthApiError &&
                error.subError === INTROSPECT_REQUIRED
            ) {
                // Call introspect to get available methods
                const introspectResult = await this.getAuthMethods({
                    correlationId: parameters.correlationId,
                    continuationToken: parameters.continuationToken,
                });

                // Return method selection required result
                return createMfaMethodSelectionRequiredResult({
                    correlationId: introspectResult.correlationId,
                    continuationToken: introspectResult.continuationToken,
                    authMethods: introspectResult.authMethods,
                });
            }

            throw error;
        }
    }

    /**
     * Submits the MFA challenge response (e.g., OTP code).
     * @param parameters The parameters for submitting the challenge.
     * @returns Promise that resolves to MfaCompletedResult.
     */
    async submitChallenge(
        parameters: MfaSubmitChallengeParams
    ): Promise<MfaCompletedResult> {
        ensureArgumentIsNotEmptyString(
            "parameters.code",
            parameters.code,
            parameters.correlationId
        );

        const apiId = PublicApiId.MFA_SUBMIT_CHALLENGE;
        const telemetryManager = this.initializeServerTelemetryManager(apiId);
        const scopes = this.getScopes(parameters.scopes);

        const request: SignInOobTokenRequest = {
            continuation_token: parameters.continuationToken,
            oob: parameters.code,
            scope: scopes.join(" "),
            correlationId: parameters.correlationId,
            telemetryManager: telemetryManager,
        };

        this.logger.verbose(
            "Calling token endpoint for MFA challenge submission.",
            parameters.correlationId
        );

        const tokenResponse =
            await this.customAuthApiClient.signInApi.requestTokensWithOob(
                request
            );

        // Save tokens and create authentication result
        const result = await this.handleTokenResponse(
            tokenResponse,
            scopes,
            tokenResponse.correlation_id ?? parameters.correlationId
        );

        return createMfaCompletedResult({
            correlationId: parameters.correlationId,
            authenticationResult: result,
        });
    }

    /**
     * Gets the available authentication methods for the user.
     * @param parameters The parameters for getting auth methods.
     * @returns Promise that resolves to MfaGetAuthMethodsResult.
     */
    async getAuthMethods(
        parameters: MfaGetAuthMethodsParams
    ): Promise<MfaGetAuthMethodsResult> {
        const apiId = PublicApiId.MFA_GET_AUTH_METHODS;
        const telemetryManager = this.initializeServerTelemetryManager(apiId);

        this.logger.verbose(
            "Calling introspect endpoint for MFA auth methods.",
            parameters.correlationId
        );

        const request: SignInIntrospectRequest = {
            continuation_token: parameters.continuationToken,
            correlationId: parameters.correlationId,
            telemetryManager: telemetryManager,
        };

        const introspectResponse =
            await this.customAuthApiClient.signInApi.requestAuthMethods(
                request
            );

        this.logger.verbose(
            "Introspect endpoint called for MFA auth methods.",
            parameters.correlationId
        );

        return createMfaGetAuthMethodsResult({
            correlationId: introspectResponse.correlation_id,
            continuationToken: introspectResponse.continuation_token,
            authMethods: introspectResponse.methods,
        });
    }
}
