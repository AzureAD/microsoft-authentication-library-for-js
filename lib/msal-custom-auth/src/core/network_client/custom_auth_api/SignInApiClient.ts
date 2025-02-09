/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { GrantType } from "../../../CustomAuthConstants.js";
import { CustomAuthApiError } from "../../error/CustomAuthApiError.js";
import { BaseApiClient } from "./BaseApiClient.js";
import { CustomAuthApiEndpoint } from "./CustomAuthApiEndpoint.js";
import { CustomAuthApiErrorCode } from "./types/ApiErrorResponseTypes.js";
import {
    SignInChallengeRequest,
    SignInContinuationTokenRequest,
    SignInInitiateRequest,
    SignInOobTokenRequest,
    SignInPasswordTokenRequest,
} from "./types/ApiRequestTypes.js";
import { SignInChallengeResponse, SignInInitiateResponse, SignInTokenResponse } from "./types/ApiResponseTypes.js";

export class SignInApiClient extends BaseApiClient {
    /**
     * Initiates the sign-in flow
     * @param username User's email
     * @param authMethod 'email-otp' | 'email-password'
     */
    async initiate(params: SignInInitiateRequest): Promise<SignInInitiateResponse> {
        const result = await this.request<SignInInitiateResponse>(
            CustomAuthApiEndpoint.SIGNIN_INITIATE,
            {
                username: params.username,
                challenge_type: params.challenge_type,
            },
            params.telemetryManager,
            params.correlationId,
        );

        this.ensureContinuationTokenIsValid(result.continuation_token, params.correlationId);

        return result;
    }

    /**
     * Requests authentication challenge (OTP or password validation)
     * @param continuationToken Token from initiate response
     * @param authMethod 'email-otp' | 'email-password'
     */
    async requestChallenge(params: SignInChallengeRequest): Promise<SignInChallengeResponse> {
        const result = await this.request<SignInChallengeResponse>(
            CustomAuthApiEndpoint.SIGNIN_CHALLENGE,
            {
                continuation_token: params.continuation_token,
                challenge_type: this.getChallengeTypes(params.challenge_type),
            },
            params.telemetryManager,
            params.correlationId,
        );

        this.ensureContinuationTokenIsValid(result.continuation_token, params.correlationId);

        return result;
    }

    /**
     * Requests security tokens using either password or OTP
     * @param continuationToken Token from challenge response
     * @param credentials Password or OTP
     * @param authMethod 'email-otp' | 'email-password'
     */
    async requestTokensWithPassword(params: SignInPasswordTokenRequest): Promise<SignInTokenResponse> {
        const result = await this.request<SignInTokenResponse>(
            CustomAuthApiEndpoint.SIGNIN_TOKEN,
            {
                continuation_token: params.continuation_token,
                grant_type: GrantType.PASSWORD,
                scope: this.getScopes(params.scope),
                password: params.password,
            },
            params.telemetryManager,
            params.correlationId,
        );

        SignInApiClient.ensureTokenResponseIsValid(result);

        return result;
    }

    async requestTokensWithOob(params: SignInOobTokenRequest): Promise<SignInTokenResponse> {
        const result = await this.request<SignInTokenResponse>(
            CustomAuthApiEndpoint.SIGNIN_TOKEN,
            {
                continuation_token: params.continuation_token,
                scope: this.getScopes(params.scope),
                oob: params.oob,
                grant_type: GrantType.OOB,
            },
            params.telemetryManager,
            params.correlationId,
        );

        SignInApiClient.ensureTokenResponseIsValid(result);

        return result;
    }

    async signInWithContinuationToken(params: SignInContinuationTokenRequest): Promise<SignInTokenResponse> {
        const result = await this.request<SignInTokenResponse>(
            CustomAuthApiEndpoint.SIGNIN_TOKEN,
            {
                continuation_token: params.continuation_token,
                username: params.username,
                scope: this.getScopes(params.scope),
                grant_type: GrantType.CONTINUATION_TOKEN,
            },
            params.telemetryManager,
            params.correlationId,
        );

        SignInApiClient.ensureTokenResponseIsValid(result);

        return result;
    }

    private static ensureTokenResponseIsValid(tokenResponse: SignInTokenResponse): void {
        let errorCode = "";
        let errorDescription = "";

        if (!tokenResponse.access_token) {
            errorCode = CustomAuthApiErrorCode.ACCESS_TOKEN_MISSING;
            errorDescription = "Access token is missing in the response body";
        } else if (!tokenResponse.id_token) {
            errorCode = CustomAuthApiErrorCode.ID_TOKEN_MISSING;
            errorDescription = "Id token is missing in the response body";
        } else if (!tokenResponse.refresh_token) {
            errorCode = CustomAuthApiErrorCode.REFRESH_TOKEN_MISSING;
            errorDescription = "Refresh token is missing in the response body";
        } else if (!tokenResponse.expires_in || tokenResponse.expires_in <= 0) {
            errorCode = CustomAuthApiErrorCode.INVALID_EXPIRES_IN;
            errorDescription = "Expires in is invalid in the response body";
        } else if (tokenResponse.token_type !== "Bearer") {
            errorCode = CustomAuthApiErrorCode.INVALID_TOKEN_TYPE;
            errorDescription = `Token type '${tokenResponse.token_type}' is invalid in the response body`;
        }

        if (!errorCode && !errorDescription) {
            return;
        }

        throw new CustomAuthApiError(errorCode, errorDescription, tokenResponse.correlation_id);
    }
}
