/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { BaseApiClient } from "./BaseApiClient.js";
import { CustomAuthApiEndpoint } from "./custom_auth_api/CustomAuthApiEndpoint.js";
import {
    SignUpChallengeRequest,
    SignUpContinueRequest,
    SignUpStartRequest,
    ChallengeResponse,
    SignUpContinueResponse,
    SignUpStartResponse,
    SignUpContinueWithPasswordRequest,
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
            params.telemetryManager,
            params.correlationId,
        );
    }

    /**
     * Request challenge (e.g., OTP)
     */
    async requestChallenge(params: SignUpChallengeRequest): Promise<ChallengeResponse> {
        return this.request<ChallengeResponse>(
            CustomAuthApiEndpoint.SIGNUP_CHALLENGE,
            {
                continuation_token: params.continuation_token,
                challenge_type: params.challenge_type,
            },
            params.telemetryManager,
            params.correlationId,
        );
    }

    /**
     * Continue sign-up flow (submit OTP, password, or attributes)
     */
    async continue(params: SignUpContinueRequest): Promise<SignUpContinueResponse> {
        return this.request<SignUpContinueResponse>(
            CustomAuthApiEndpoint.SIGNUP_CONTINUE,
            {
                continuation_token: params.continuation_token,
                grant_type: params.grant_type,
                ...(params.oob && { oob: params.oob }),
                ...(params.attributes && {
                    attributes: JSON.stringify(params.attributes),
                }),
            },
            params.telemetryManager,
            params.correlationId,
        );
    }

    async continueWithPassword(params: SignUpContinueWithPasswordRequest): Promise<SignUpContinueResponse> {
        return this.request<SignUpContinueResponse>(
            CustomAuthApiEndpoint.SIGNUP_CONTINUE,
            {
                continuation_token: params.continuation_token,
                grant_type: params.grant_type,
                password: params.password,
            },
            params.telemetryManager,
            params.correlationId,
        );
    }

    async continueWithAttributes(params: SignUpContinueRequest): Promise<SignUpContinueResponse> {
        return this.request<SignUpContinueResponse>(
            CustomAuthApiEndpoint.SIGNUP_CONTINUE,
            {
                continuation_token: params.continuation_token,
                grant_type: params.grant_type,
                attributes: JSON.stringify(params.attributes),
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
