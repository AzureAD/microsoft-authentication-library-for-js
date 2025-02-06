/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { BaseApiClient } from "./BaseApiClient.js";
import { CustomAuthApiEndpoint } from "./custom_auth_api/CustomAuthApiEndpoint.js";
import { GrantType } from "./types/BaseApiTypes.js";
import {
    SignInChallengeRequest,
    SignInInitiateRequest,
    SignInInitiateSuccessResponse,
    SingInChallengeCodeResponse,
    SignInTokenSuccessResponse,
    PasswordTokenRequest,
    OTPTokenRequest,
    SignInContinuationTokenRequest,
} from "./types/SignInApiTypes.js";

// https://learn.microsoft.com/en-us/entra/identity-platform/reference-native-authentication-api?tabs=emailOtp#sign-in-challenge-types

export class SingInApiClient extends BaseApiClient {
    /**
     * Initiates the sign-in flow
     * @param username User's email
     * @param authMethod 'email-otp' | 'email-password'
     */
    async initiate(params: SignInInitiateRequest): Promise<SignInInitiateSuccessResponse> {
        return this.request<SignInInitiateSuccessResponse>(
            CustomAuthApiEndpoint.SIGNIN_INITIATE,
            {
                username: params.username,
                challenge_type: params.challenge_type,
            },
            params.telemetryManager,
            params.correlationId,
        );
    }

    /**
     * Requests authentication challenge (OTP or password validation)
     * @param continuationToken Token from initiate response
     * @param authMethod 'email-otp' | 'email-password'
     */
    async requestChallenge(params: SignInChallengeRequest): Promise<SingInChallengeCodeResponse> {
        return this.request<SingInChallengeCodeResponse>(
            CustomAuthApiEndpoint.SIGNIN_INITIATE,
            {
                continuation_token: params.continuation_token,
                challenge_type: params.challenge_type,
            },
            params.telemetryManager,
            params.correlationId,
        );
    }

    /**
     * Requests security tokens using either password or OTP
     * @param continuationToken Token from challenge response
     * @param credentials Password or OTP
     * @param authMethod 'email-otp' | 'email-password'
     */
    async requestTokensWithPassword(params: PasswordTokenRequest): Promise<SignInTokenSuccessResponse> {
        return this.request<SignInTokenSuccessResponse>(
            CustomAuthApiEndpoint.SIGNIN_TOKEN,
            {
                continuation_token: params.continuation_token,
                client_id: params.client_id,
                grant_type: GrantType.PASSWORD,
                scope: params.scope,
                password: params.password,
            },
            params.telemetryManager,
            params.correlationId,
        );
    }

    async requestTokensWithOTP(params: OTPTokenRequest): Promise<SignInTokenSuccessResponse> {
        return this.request<SignInTokenSuccessResponse>(
            CustomAuthApiEndpoint.SIGNIN_TOKEN,
            {
                continuation_token: params.continuation_token,
                client_id: params.client_id,
                scope: params.scope,
                oob: params.oob,
                grant_type: GrantType.OOB,
            },
            params.telemetryManager,
            params.correlationId,
        );
    }

    async signInWithContinuationToken(params: SignInContinuationTokenRequest): Promise<SignInTokenSuccessResponse> {
        return this.request<SignInTokenSuccessResponse>(
            CustomAuthApiEndpoint.SIGNIN_TOKEN,
            {
                continuation_token: params.continuation_token,
                client_id: params.client_id,
            },
            params.telemetryManager,
            params.correlationId,
        );
    }

    protected async handleError<T>(response: Response): Promise<T> {
        const errorData = (await response.json()) as T;
        // return new CustomAuthApiError({});
        return errorData; // TODO create CustomAuthApiError object and integrate with core/ error handling
    }
}
