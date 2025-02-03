/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    SignInChallengeRequest,
    SignInInitiateRequest,
    SignInOobTokenRequest,
    SignInPasswordTokenRequest,
} from "./request/SignInRequest.js";

import { ICustomAuthApiClient } from "./ICustomAuthApiClient.js";
import {
    SignUpStartRequest,
    SignUpChallengeRequest,
    SignUpSubmitCodeRequest,
    SignUpSubmitPasswordRequest,
    SignUpSubmitUserAttributesRequest,
} from "./request/SignUpRequest.js";
import { SingInApiClient } from "../SingInApiClient.js";
import { SignupApiClient } from "../SignupApiClient.js";
import { ResetPasswordApiClient } from "../ResetPasswordApiClient.js";
import { SignInInitiateSuccessResponse, SingInChallengeCodeResponse, SignInTokenSuccessResponse } from "../types/SignInApiTypes.js";
import { ChallengeResponse, GrantType, SignUpContinueResponse, SignUpStartResponse } from "../types/SignUpApiTypes.js";

/**
 * Custom Auth Client which can be used to make requests to the Custom Auth service.
 */
export class CustomAuthApiClient implements ICustomAuthApiClient {
    constructor(
        public signInApiClient: SingInApiClient,
        public signUpApiClient: SignupApiClient,
        public resetPasswordApiClient: ResetPasswordApiClient,
    ) {}

    async performSignInInitiateRequest(request: SignInInitiateRequest): Promise<SignInInitiateSuccessResponse> {
        return this.signInApiClient.initiate({
            client_id: request.parameters.clientId,
            challenge_type: request.parameters.challengeType,
            username: request.parameters.username,
        });
    }

    async performSignInChallengeRequest(request: SignInChallengeRequest): Promise<SingInChallengeCodeResponse> {
        return this.signInApiClient.requestChallenge({
            client_id: request.parameters.clientId,
            challenge_type: request.parameters.challengeType,
            continuation_token: request.parameters.continuationToken,
        });
    }

    async performSignInOobTokenRequest(request: SignInOobTokenRequest): Promise<SignInTokenSuccessResponse> {
        return this.signInApiClient.requestTokens({
            client_id: request.parameters.clientId,
            continuation_token: request.parameters.continuationToken,
            grant_type: GrantType.OOB,
            scope: (request.parameters.scopes ?? []).join(" "),
            oob: request.parameters.oob,
        });
    }

    async performSignInPasswordTokenRequest(request: SignInPasswordTokenRequest): Promise<SignInTokenSuccessResponse> {
        return this.signInApiClient.requestTokens({
            client_id: request.parameters.clientId,
            continuation_token: request.parameters.continuationToken,
            grant_type: GrantType.PASSWORD,
            scope: (request.parameters.scopes ?? []).join(" "),
            password: request.parameters.password,
        });
    }

    performSignUpStartRequest(request: SignUpStartRequest): Promise<SignUpStartResponse> {
        return this.signUpApiClient.start({
            client_id: request.parameters.clientId,
            challenge_type: request.parameters.challengeType,
            username: request.parameters.username,
            password: request.parameters.password,
            attributes: request.parameters.attributes,
        });
    }

    performSignUpChallengeRequest(request: SignUpChallengeRequest): Promise<ChallengeResponse> {
        return this.signUpApiClient.requestChallenge({
            challenge_type: request.parameters.challengeType,
            client_id: request.parameters.clientId,
            continuation_token: request.parameters.continuationToken,
        });
    }

    performSignUpSubmitCodeRequest(request: SignUpSubmitCodeRequest): Promise<SignUpContinueResponse> {
        return this.signUpApiClient.continue({
            client_id: request.parameters.clientId,
            continuation_token: request.parameters.continuationToken,
            grant_type: GrantType.OOB,
            oob: request.parameters.code,
        });
    }

    performSignUpSubmitPasswordRequest(request: SignUpSubmitPasswordRequest): Promise<SignUpContinueResponse> {
        throw new Error(`Method not implemented with parameter request '${request}'.`);
    }

    performSignUpSubmitUserAttributesRequest(request: SignUpSubmitUserAttributesRequest): Promise<SignUpContinueResponse> {
        return this.signUpApiClient.continue({
            client_id: request.parameters.clientId,
            continuation_token: request.parameters.continuationToken,
            grant_type: GrantType.ATTRIBUTES,
            attributes: request.parameters.attributes,
        });
    }
}
