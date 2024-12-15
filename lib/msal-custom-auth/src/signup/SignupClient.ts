/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowType } from "../common/AuthFlowTypes.js";
import { BaseAuthClient } from "../common/BaseAuthClient.js";
import { CustomAuthApiError } from "../core/error/CustomAuthApiError.js";
import { SignUpErrorResponse } from "./types/SignUpErrorsTypes.js";
import {
    SignUpChallengeRequest,
    SignUpContinueRequest,
    SignUpStartRequest,
} from "./types/SignUpRequestTypes.js";
import {
    ChallengeResponse,
    SignUpContinueResponse,
    SignUpStartResponse,
} from "./types/SignUpResponseTypes.js";

export class SignUpClient extends BaseAuthClient {
    /**
     * Start the sign-up flow
     */
    async start(params: SignUpStartRequest): Promise<SignUpStartResponse> {
        return this.makeRequest<SignUpStartResponse>(
            `${AuthFlowType.SIGN_UP}/${this.version}/start`,
            {
                username: params.username,
                ...(params.password && { password: params.password }),
                ...(params.attributes && {
                    attributes: JSON.stringify(params.attributes),
                }),
                challenge_type:
                    params.challenge_type || "oob password redirect",
            }
        );
    }

    /**
     * Request challenge (e.g., OTP)
     */
    async requestChallenge(
        params: SignUpChallengeRequest
    ): Promise<ChallengeResponse> {
        return this.makeRequest<ChallengeResponse>(
            `${AuthFlowType.SIGN_UP}/${this.version}/challenge`,
            {
                continuation_token: params.continuation_token,
                challenge_type:
                    params.challenge_type || "oob password redirect",
            }
        );
    }

    /**
     * Continue sign-up flow (submit OTP, password, or attributes)
     */
    async continue(
        params: SignUpContinueRequest
    ): Promise<SignUpContinueResponse> {
        return this.makeRequest<SignUpContinueResponse>(
            `${AuthFlowType.SIGN_UP}/${this.version}/continue`,
            {
                continuation_token: params.continuation_token,
                grant_type: params.grant_type,
                oob: params.oob,
            }
        );
    }

    protected async handleError(
        response: Response
    ): Promise<SignUpErrorResponse> {
        const errorData = await response.json();
        return new CustomAuthApiError({});
    }
}
