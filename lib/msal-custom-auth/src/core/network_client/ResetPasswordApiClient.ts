/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { BaseApiClient } from "./BaseApiClient.js";
import { CustomAuthApiEndpoint } from "./CustomAuthApiEndpoint.js";
import {
    ChallengeResetPasswordRequest,
    ChallengeResetPasswordResponse,
    ContinueResetPasswordRequest,
    ContinueResetPasswordResponse,
    PollCompletionRequest,
    PollCompletionResponse,
    StartResetPasswordRequest,
    StartResetPasswordResponse,
    SubmitResetPasswordRequest,
    SubmitResetPasswordResponse,
} from "./types/ResetPasswordApiTypes.js";

export class ResetPasswordApiClient extends BaseApiClient {
    /**
     * Start the password reset flow
     */
    async startResetPassword(
        params: StartResetPasswordRequest,
    ): Promise<StartResetPasswordResponse> {
        return this.request<StartResetPasswordResponse>(
            CustomAuthApiEndpoint.RESET_PWD_START,
            {
                challenge_type: params.challenge_type,
                username: params.username,
            },
        );
    }

    /**
     * Request a challenge (OTP) to be sent to the user's email
     * @param ChallengeResetPasswordRequest Parameters for the challenge request
     */
    async requestChallenge(
        params: ChallengeResetPasswordRequest,
    ): Promise<ChallengeResetPasswordResponse> {
        return this.request<ChallengeResetPasswordResponse>(
            CustomAuthApiEndpoint.RESET_PWD_CHALLENGE,
            {
                challenge_type: params.challenge_type,
                continuation_token: params.continuation_token,
            },
        );
    }

    /**
     * Submit the OTP for verification
     * @param ContinueResetPasswordRequest Token from previous response
     */
    async submitOTP(
        params: ContinueResetPasswordRequest,
    ): Promise<ContinueResetPasswordResponse> {
        return this.request<ContinueResetPasswordResponse>(
            CustomAuthApiEndpoint.RESET_PWD_CONTINUE,
            {
                continuation_token: params.continuation_token,
                grant_type: params.grant_type,
                oob: params.oob,
            },
        );
    }

    /**
     * Submit the new password
     * @param SubmitResetPasswordResponse Token from previous response
     */
    async submitNewPassword(
        params: SubmitResetPasswordRequest,
    ): Promise<SubmitResetPasswordResponse> {
        return this.request<SubmitResetPasswordResponse>(
            CustomAuthApiEndpoint.RESET_PWD_SUBMIT,
            {
                continuation_token: params.continuation_token,
                new_password: params.new_password,
            },
        );
    }

    /**
     * Poll for password reset completion status
     * @param continuationToken Token from previous response
     */
    async pollCompletion(
        params: PollCompletionRequest,
    ): Promise<PollCompletionResponse> {
        return this.request<PollCompletionResponse>(
            CustomAuthApiEndpoint.RESET_PWD_POLL,
            {
                continuation_token: params.continuation_token,
            },
        );
    }

    protected async handleError<T>(response: Response): Promise<T> {
        const errorData = (await response.json()) as T;
        // return new CustomAuthApiError({});
        return errorData; // TODO create CustomAuthApiError object and integrate with core/ error handling
    }
}
