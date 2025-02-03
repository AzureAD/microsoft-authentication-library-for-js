/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { BaseApiClient } from "./BaseApiClient.js";
import { CustomAuthApiEndpoint } from "./CustomAuthApiEndpoint.js";
import {
    GrantType,
    SignInChallengeRequest,
    SignInInitiateRequest,
    TokenRequest,
    SignInInitiateSuccessResponse,
    SingInChallengeSuccessResponse,
    TokenSuccessResponse,
} from "./types/SignInApiTypes.js";

// https://learn.microsoft.com/en-us/entra/identity-platform/reference-native-authentication-api?tabs=emailOtp#sign-in-challenge-types

export class SingInApiClient extends BaseApiClient {
    /**
     * Initiates the sign-in flow
     * @param username User's email
     * @param authMethod 'email-otp' | 'email-password'
     */
    async initiate(
        params: SignInInitiateRequest,
    ): Promise<SignInInitiateSuccessResponse> {
        return this.request<SignInInitiateSuccessResponse>(
            CustomAuthApiEndpoint.SIGNIN_INITIATE,
            {
                username: params.username,
                challenge_type: params.challenge_type,
            },
        );
    }

    /**
     * Requests authentication challenge (OTP or password validation)
     * @param continuationToken Token from initiate response
     * @param authMethod 'email-otp' | 'email-password'
     */
    async requestChallenge(
        params: SignInChallengeRequest,
    ): Promise<SingInChallengeSuccessResponse> {
        return this.request<SingInChallengeSuccessResponse>(
            CustomAuthApiEndpoint.SIGNIN_INITIATE,
            {
                continuation_token: params.continuation_token,
                challenge_type: params.challenge_type,
            },
        );
    }

    /**
     * Requests security tokens using either password or OTP
     * @param continuationToken Token from challenge response
     * @param credentials Password or OTP
     * @param authMethod 'email-otp' | 'email-password'
     */
    async requestTokens(params: TokenRequest): Promise<TokenSuccessResponse> {
        const baseParams = {
            continuation_token: params.continuation_token,
            client_id: params.client_id,
            grant_type: params.grant_type,
            scope: params.scope,
        };

        // Type guard to check which type of request it is
        if (params.grant_type === GrantType.OOB) {
            return this.request<TokenSuccessResponse>(
                CustomAuthApiEndpoint.SIGNIN_TOKEN,
                {
                    ...baseParams,
                    oob: params.oob,
                },
            );
        } else {
            return this.request<TokenSuccessResponse>(
                CustomAuthApiEndpoint.SIGNIN_TOKEN,
                {
                    ...baseParams,
                    password: params.password,
                },
            );
        }
    }

    protected async handleError<T>(response: Response): Promise<T> {
        const errorData = (await response.json()) as T;
        // return new CustomAuthApiError({});
        return errorData; // TODO create CustomAuthApiError object and integrate with core/ error handling
    }
}
