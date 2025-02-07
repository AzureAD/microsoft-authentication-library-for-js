/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ChallengeType } from "../../CustomAuthConstants.js";
import { CustomAuthApiError, RedirectError } from "../../core/error/CustomAuthApiError.js";
import { CustomAuthApiErrorCode } from "../../core/network_client/types/ApiErrorResponseTypes.js";

import { CustomAuthInteractionClientBase } from "../../core/interaction_client/CustomAuthInteractionClientBase.js";
import {
    SignInStartParams,
    SignInResendCodeParams,
    SignInSubmitCodeParams,
    SignInSubmitPasswordParams,
    SignInContinuationTokenParams,
} from "./parameter/SignInParams.js";
import { SignInCodeSendResult, SignInCompletedResult, SignInPasswordRequiredResult } from "./result/SignInActionResult.js";
import { PublicApiId } from "../../core/telemetry/PublicApiId.js";
import { ArgumentValidator } from "../../core/utils/ArgumentValidator.js";
import { CustomAuthAuthenticationResult } from "../../core/interaction_client/CustomAuthAuthenticationResult.js";
import {
    SignInInitiateRequest,
    SignInChallengeRequest,
    OTPTokenRequest,
    SignInTokenSuccessResponse,
    PasswordTokenRequest,
    SignInContinuationTokenRequest,
} from "../../core/network_client/types/SignInApiTypes.js";
import { GrantType } from "../../core/network_client/types/BaseApiTypes.js";

export class SignInClient extends CustomAuthInteractionClientBase {
    /**
     * Starts the signin flow.
     * @param parameters The parameters required to start the sign-in flow.
     * @returns The result of the sign-in start operation.
     */
    async start(parameters: SignInStartParams): Promise<SignInPasswordRequiredResult | SignInCodeSendResult> {
        this.logger.info("Calling initiate endpoint for sign in.");
        const apiId = !parameters.password ? PublicApiId.SIGN_IN_WITH_CODE_START : PublicApiId.SIGN_IN_WITH_PASSWORD_START;
        const telemetryManager = this.initializeServerTelemetryManager(apiId);
        const initReq: SignInInitiateRequest = {
            client_id: parameters.clientId,
            challenge_type: parameters.challengeType.join(" "),
            username: parameters.username,
            correlationId: parameters.correlationId,
            telemetryManager: telemetryManager,
        };

        const initiateResponse = await this.customAuthApiClient.signInApiClient.initiate(initReq);
        const challengeReq: SignInChallengeRequest = {
            client_id: parameters.clientId,
            challenge_type: parameters.challengeType.join(" "),
            continuation_token: initiateResponse.continuation_token ?? "",
            correlationId: initiateResponse.correlation_id,
            telemetryManager: telemetryManager,
        };

        this.logger.info("Initiate endpoint called for sign in.");
        return this.performChallengeRequest(challengeReq);
    }

    /**
     * Submits the code for sign-in flow.
     * @param parameters The parameters required to submit the code.
     * @returns The result of the sign-in submit code action.
     */
    async submitCode(parameters: SignInSubmitCodeParams): Promise<SignInCompletedResult> {
        ArgumentValidator.ensureArgumentIsNotNullOrUndefined("parameters", parameters);
        ArgumentValidator.ensureArgumentIsNotEmptyString("parameters.code", parameters.code, parameters.correlationId);

        const apiId = PublicApiId.SIGN_IN_SUBMIT_CODE;
        const telemetryManager = this.initializeServerTelemetryManager(apiId);
        const reqToken: OTPTokenRequest = {
            client_id: parameters.clientId,
            continuation_token: parameters.continuationToken,
            grant_type: GrantType.OOB,
            oob: parameters.code,
            scope: parameters.scopes.join(" "),
            correlationId: parameters.correlationId,
            telemetryManager: telemetryManager,
        };
        this.logger.info("Calling token endpoint with code for sign in.");

        const response = await this.customAuthApiClient.signInApiClient.requestTokensWithOTP(reqToken);

        this.logger.info("Token endpoint called with code for sign in.");

        return new SignInCompletedResult(
            response.correlation_id,
            this.createAuthenticationResult(response, parameters.scopes, parameters.username),
        );
    }

    /**
     * Submits the password for sign-in flow.
     * @param parameters The parameters required to submit the password.
     * @returns The result of the sign-in submit password action.
     */
    async submitPassword(parameters: SignInSubmitPasswordParams): Promise<SignInCompletedResult> {
        ArgumentValidator.ensureArgumentIsNotNullOrUndefined("parameters", parameters);
        ArgumentValidator.ensureArgumentIsNotEmptyString("parameters.password", parameters.password, parameters.correlationId);

        const apiId = PublicApiId.SIGN_IN_SUBMIT_PASSWORD;
        const telemetryManager = this.initializeServerTelemetryManager(apiId);
        const reqPwd: PasswordTokenRequest = {
            client_id: parameters.clientId,
            continuation_token: parameters.continuationToken,
            grant_type: GrantType.PASSWORD,
            password: parameters.password,
            scope: parameters.scopes.join(" "),
            correlationId: parameters.correlationId,
            telemetryManager: telemetryManager,
        };
        this.logger.info("Calling token endpoint with password for sign in.");

        const response = await this.customAuthApiClient.signInApiClient.requestTokensWithPassword(reqPwd);

        this.logger.info("Token endpoint called with password for sign in.");

        return new SignInCompletedResult(
            response.correlation_id ?? "",
            this.createAuthenticationResult(response, parameters.scopes, parameters.username),
        );
    }

    /**
     * Resends the code for sign-in flow.
     * @param parameters The parameters required to resend the code.
     * @returns The result of the sign-in resend code action.
     */
    async resendCode(parameters: SignInResendCodeParams): Promise<SignInCodeSendResult> {
        ArgumentValidator.ensureArgumentIsNotNullOrUndefined("parameters", parameters);
        const apiId = PublicApiId.SIGN_IN_RESEND_CODE;
        const telemetryManager = this.initializeServerTelemetryManager(apiId);
        const challengeReq: SignInChallengeRequest = {
            client_id: parameters.clientId,
            challenge_type: parameters.challengeType.join(" "),
            continuation_token: parameters.continuationToken ?? "",
            correlationId: parameters.correlationId,
            telemetryManager: telemetryManager,
        };

        const result = await this.performChallengeRequest(challengeReq);

        if (result instanceof SignInPasswordRequiredResult) {
            this.logger.error("Resend code operation failed due to the challenge type 'password' is not supported.");

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
    async signInWithContinuationToken(parameters: SignInContinuationTokenParams): Promise<SignInCompletedResult> {
        ArgumentValidator.ensureArgumentIsNotNullOrUndefined("parameters", parameters);

        const apiId = PublicApiId.SIGN_IN_AFTER_SIGN_UP;
        const telemetryManager = this.initializeServerTelemetryManager(apiId);

        // Create token request.
        const request: SignInContinuationTokenRequest = {
            client_id: parameters.clientId,
            continuation_token: parameters.continuationToken,
            correlationId: parameters.correlationId,
            telemetryManager: telemetryManager,
        };

        // Call token endpoint.
        this.logger.info("Calling token endpoint with continuation token for sign in.");

        const response = await this.customAuthApiClient.signInApiClient.signInWithContinuationToken(request);

        this.logger.info("Token endpoint called with continuation token for sign in.");

        return new SignInCompletedResult(
            response.correlation_id ?? "",
            this.createAuthenticationResult(response, parameters.scopes, parameters.username),
        );
    }

    private createAuthenticationResult(
        tokenResponse: SignInTokenSuccessResponse,
        scopes: string[],
        username: string,
    ): CustomAuthAuthenticationResult {
        return {
            accessToken: tokenResponse.access_token ?? "",
            idToken: tokenResponse.id_token ?? "",
            refreshToken: tokenResponse.refresh_token ?? "",
            expiresOn: new Date(Date.now() + (tokenResponse.expires_in ?? 0) * 1000),
            tokenType: tokenResponse.token_type ?? "",
            correlationId: "",
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

    private async performChallengeRequest(request: SignInChallengeRequest): Promise<SignInPasswordRequiredResult | SignInCodeSendResult> {
        this.logger.info("Calling challenge endpoint for sign in.");
        const challengeResponse = await this.customAuthApiClient.signInApiClient.requestChallenge(request);
        this.logger.info("Challenge endpoint called for sign in.");

        if (challengeResponse.challenge_type === ChallengeType.OOB) {
            // Code is required
            this.logger.info("Challenge type is oob for sign in.");

            return new SignInCodeSendResult(
                challengeResponse.correlation_id,
                challengeResponse.continuation_token,
                challengeResponse.challenge_channel,
                challengeResponse.challenge_target_label,
                challengeResponse.code_length,
                0,
                challengeResponse.challenge_type,
            );
        }

        if (challengeResponse.challenge_type === ChallengeType.PASSWORD) {
            // Password is required
            this.logger.info("Challenge type is password for sign in.");

            return new SignInPasswordRequiredResult(challengeResponse.correlation_id, challengeResponse.continuation_token);
        }

        this.logger.error(`Unsupported challenge type '${challengeResponse.challenge_type}' for sign in.`);

        throw new RedirectError(challengeResponse.correlation_id);
        throw new CustomAuthApiError(
            CustomAuthApiErrorCode.UNSUPPORTED_CHALLENGE_TYPE,
            `Unsupported challenge type '${challengeResponse.challenge_type}'.`,
            challengeResponse.correlation_id,
        );
    }
}
