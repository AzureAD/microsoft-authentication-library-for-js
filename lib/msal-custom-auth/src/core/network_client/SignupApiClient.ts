/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { BaseApiClient } from "./BaseApiClient.js";
import { CustomAuthApiEndpoint } from "./CustomAuthApiEndpoint.js";
import {
    SignUpChallengeRequest,
    SignUpContinueRequest,
    SignUpStartRequest,
    ChallengeResponse,
    SignUpContinueResponse,
    SignUpStartResponse,
} from "./types/SignUpApiTypes.js";

export class SignupApiClient extends BaseApiClient {
    /**
     * Start the sign-up flow
     */
    async start(params: SignUpStartRequest): Promise<SignUpStartResponse> {
        return this.request<SignUpStartResponse>(
            CustomAuthApiEndpoint.SIGNUP_START,
            {
                username: params.username,
                ...(params.password && { password: params.password }),
                ...(params.attributes && {
                    attributes: JSON.stringify(params.attributes),
                }),
                challenge_type: params.challenge_type,
            },
        );
    }

    /**
     * Request challenge (e.g., OTP)
     */
    async requestChallenge(
        params: SignUpChallengeRequest,
    ): Promise<ChallengeResponse> {
        return this.request<ChallengeResponse>(
            CustomAuthApiEndpoint.SIGNUP_CHALLENGE,
            {
                continuation_token: params.continuation_token,
                challenge_type: params.challenge_type,
            },
        );
    }

    /**
     * Continue sign-up flow (submit OTP, password, or attributes)
     */
    async continue(
        params: SignUpContinueRequest,
    ): Promise<SignUpContinueResponse> {
        return this.request<SignUpContinueResponse>(
            CustomAuthApiEndpoint.SIGNUP_CONTINUE,
            {
                continuation_token: params.continuation_token,
                grant_type: params.grant_type,
                oob: params.oob,
            },
        );
    }

    protected async handleError<T>(response: Response): Promise<T> {
        const errorData = (await response.json()) as T;
        // return new CustomAuthApiError({});
        return errorData; // TODO create CustomAuthApiError object and integrate with core/ error handling
    }
}
