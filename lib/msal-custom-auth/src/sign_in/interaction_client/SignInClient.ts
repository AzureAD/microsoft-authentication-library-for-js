/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ChallengeType } from "../../CustomAuthConstants.js";
import {
    CustomAuthApiError,
    CustomAuthApiErrorCode,
} from "../../core/error/CustomAuthApiError.js";
import { CustomAuthInteractionClientBase } from "../../core/interaction_client/CustomAuthInteractionClientBase.js";
import {
    SignInChallengeRequest,
    SignInContinuationTokenRequest,
    SignInInitiateRequest,
    SignInOobTokenRequest,
    SignInPasswordTokenRequest,
} from "../../core/network_client/custom_auth_api/request/SignInRequest.js";
import {
    SignInContinuationTokenParams,
    SignInStartParams,
    SignInResendCodeParams,
    SignInSubmitCodeParams,
    SignInSubmitPasswordParams,
} from "./parameter/SignInParams.js";
import {
    SignInCodeSendResult,
    SignInCompleteResult,
    SignInPasswordRequiredResult,
} from "./result/SignInActionResult.js";
import { PublicApiId } from "../../core/telemetry/PublicApiId.js";
import { ArgumentValidator } from "../../core/utils/ArgumentValidator.js";
import { SignInTokenResponse } from "../../core/network_client/custom_auth_api/response/ApiResponse.js";
import { CustomAuthAuthenticationResult } from "../../core/interaction_client/CustomAuthAuthenticationResult.js";

export class SignInClient extends CustomAuthInteractionClientBase {
    /**
     * Starts the signin flow.
     * @param parameters The parameters required to start the sign-in flow.
     * @returns The result of the sign-in start operation.
     */
    async start(
        parameters: SignInStartParams,
    ): Promise<SignInPasswordRequiredResult | SignInCodeSendResult> {
        ArgumentValidator.ensureArgumentIsNotNullOrUndefined(
            "parameters",
            parameters,
        );

        const apiId = !parameters.password
            ? PublicApiId.SIGN_IN_WITH_CODE_START
            : PublicApiId.SIGN_IN_WITH_PASSWORD_START;
        const telemetryManager = this.initializeServerTelemetryManager(apiId);

        // Create initiate request.
        const initiateRequest = SignInInitiateRequest.create(
            parameters,
            telemetryManager,
        );

        // Call initiate endpoint.
        this.logger.info("Calling initiate endpoint for sign in.");

        const initiateResponse =
            await this.customAuthApiClient.performSignInInitiateRequest(
                initiateRequest,
            );

        this.logger.info("Initiate endpoint called for sign in.");

        // Create challenge request.
        const challengeRequest = SignInChallengeRequest.create(
            parameters,
            initiateResponse.continuation_token ?? "",
            telemetryManager,
        );

        return this.performChallengeRequest(challengeRequest);
    }

    /**
     * Submits the code for sign-in flow.
     * @param parameters The parameters required to submit the code.
     * @returns The result of the sign-in submit code action.
     */
    async submitCode(
        parameters: SignInSubmitCodeParams,
    ): Promise<SignInCompleteResult> {
        ArgumentValidator.ensureArgumentIsNotNullOrUndefined(
            "parameters",
            parameters,
        );

        ArgumentValidator.ensureArgumentIsNotEmptyString(
            "parameters.code",
            parameters.code,
            parameters.correlationId,
        );

        const apiId = PublicApiId.SIGN_IN_SUBMIT_CODE;
        const telemetryManager = this.initializeServerTelemetryManager(apiId);

        // Create token request.
        const request = SignInOobTokenRequest.create(
            parameters,
            telemetryManager,
        );

        // Call token endpoint.
        this.logger.info("Calling token endpoint with code for sign in.");

        const response =
            await this.customAuthApiClient.performSignInOobTokenRequest(
                request,
            );

        this.logger.info("Token endpoint called with code for sign in.");

        return new SignInCompleteResult(
            response.correlation_id ?? "",
            this.createAuthenticationResult(
                response,
                parameters.scopes,
                parameters.username,
            ),
        );
    }

    /**
     * Submits the password for sign-in flow.
     * @param parameters The parameters required to submit the password.
     * @returns The result of the sign-in submit password action.
     */
    async submitPassword(
        parameters: SignInSubmitPasswordParams,
    ): Promise<SignInCompleteResult> {
        ArgumentValidator.ensureArgumentIsNotNullOrUndefined(
            "parameters",
            parameters,
        );

        ArgumentValidator.ensureArgumentIsNotEmptyString(
            "parameters.password",
            parameters.password,
            parameters.correlationId,
        );

        const apiId = PublicApiId.SIGN_IN_SUBMIT_PASSWORD;
        const telemetryManager = this.initializeServerTelemetryManager(apiId);

        // Create token request.
        const request = SignInPasswordTokenRequest.create(
            parameters,
            telemetryManager,
        );

        // Call token endpoint.
        this.logger.info("Calling token endpoint with password for sign in.");

        const response =
            await this.customAuthApiClient.performSignInPasswordTokenRequest(
                request,
            );

        this.logger.info("Token endpoint called with password for sign in.");

        return new SignInCompleteResult(
            response.correlation_id ?? "",
            this.createAuthenticationResult(
                response,
                parameters.scopes,
                parameters.username,
            ),
        );
    }

    /**
     * Resends the code for sign-in flow.
     * @param parameters The parameters required to resend the code.
     * @returns The result of the sign-in resend code action.
     */
    async resendCode(
        parameters: SignInResendCodeParams,
    ): Promise<SignInCodeSendResult> {
        ArgumentValidator.ensureArgumentIsNotNullOrUndefined(
            "parameters",
            parameters,
        );

        const apiId = PublicApiId.SIGN_IN_RESEND_CODE;
        const telemetryManager = this.initializeServerTelemetryManager(apiId);

        // Create challenge request.
        const request = SignInChallengeRequest.create(
            parameters,
            parameters.continuationToken,
            telemetryManager,
        );

        const result = await this.performChallengeRequest(request);

        if (result instanceof SignInPasswordRequiredResult) {
            this.logger.error(
                "Resend code operation failed due to the challenge type 'password' is not supported.",
            );

            throw new CustomAuthApiError(
                CustomAuthApiErrorCode.UNSUPPORTED_CHALLENGE_TYPE,
                "Unsupported challenge type 'password'.",
                result.correlationId,
            );
        }

        return result;
    }

    /**
     * Signs in with continuation token.
     * @param parameters The parameters required to sign in with continuation token.
     * @returns The result of the sign-in complete action.
     */
    async signInWithContinuationToken(
        parameters: SignInContinuationTokenParams,
    ): Promise<SignInCompleteResult> {
        ArgumentValidator.ensureArgumentIsNotNullOrUndefined(
            "parameters",
            parameters,
        );

        const apiId = PublicApiId.SIGN_IN_AFTER_SIGN_UP;
        const telemetryManager = this.initializeServerTelemetryManager(apiId);

        // Create token request.
        const request = SignInContinuationTokenRequest.create(
            parameters,
            telemetryManager,
        );

        // Call token endpoint.
        this.logger.info(
            "Calling token endpoint with continuation token for sign in.",
        );

        const response =
            await this.customAuthApiClient.performSignInContinuationTokenRequest(
                request,
            );

        this.logger.info(
            "Token endpoint called with continuation token for sign in.",
        );

        return new SignInCompleteResult(
            response.correlation_id ?? "",
            this.createAuthenticationResult(
                response,
                parameters.scopes,
                parameters.username,
            ),
        );
    }

    private createAuthenticationResult(
        tokenResponse: SignInTokenResponse,
        scopes: string[],
        username: string,
    ): CustomAuthAuthenticationResult {
        return {
            accessToken: tokenResponse.access_token ?? "",
            idToken: tokenResponse.id_token ?? "",
            refreshToken: tokenResponse.refresh_token ?? "",
            expiresOn: new Date(
                Date.now() + (tokenResponse.expires_in ?? 0) * 1000,
            ),
            tokenType: tokenResponse.token_type ?? "",
            correlationId: tokenResponse.correlation_id ?? "",
            authority: this.customAuthAuthority.authorityUrl.href,
            tenantId: this.customAuthAuthority.getTenant(),
            scopes: scopes,
            account: {
                homeAccountId: "",
                environment: "",
                tenantId: this.customAuthAuthority.getTenant(),
                username: username,
                localAccountId: "",
                idToken: tokenResponse.id_token ?? "",
            },
            idTokenClaims: {},
            fromCache: false,
            uniqueId: this.browserCrypto.createNewGuid(),
        };
    }

    private async performChallengeRequest(
        request: SignInChallengeRequest,
    ): Promise<SignInPasswordRequiredResult | SignInCodeSendResult> {
        // Call challenge endpoint.
        this.logger.info("Calling challenge endpoint for sign in.");

        const challengeResponse =
            await this.customAuthApiClient.performSignInChallengeRequest(
                request,
            );

        this.logger.info("Challenge endpoint called for sign in.");

        if (challengeResponse.challenge_type === ChallengeType.OOB) {
            // Code is required
            this.logger.info("Challenge type is oob for sign in.");

            return new SignInCodeSendResult(
                challengeResponse.correlation_id ?? "",
                challengeResponse.continuation_token ?? "",
                challengeResponse.challenge_channel ?? "",
                challengeResponse.target_challenge_label ?? "",
                challengeResponse.code_length ?? 0,
                challengeResponse.interval ?? 0,
            );
        }

        if (challengeResponse.challenge_type === ChallengeType.PASSWORD) {
            // Password is required
            this.logger.info("Challenge type is password for sign in.");

            return new SignInPasswordRequiredResult(
                challengeResponse.correlation_id ?? "",
                challengeResponse.continuation_token ?? "",
            );
        }

        this.logger.error(
            `Unsupported challenge type '${challengeResponse.challenge_type}' for sign in.`,
        );

        throw new CustomAuthApiError(
            CustomAuthApiErrorCode.UNSUPPORTED_CHALLENGE_TYPE,
            `Unsupported challenge type '${challengeResponse.challenge_type}'.`,
            challengeResponse.correlation_id ?? request.correlationId,
        );
    }
}
