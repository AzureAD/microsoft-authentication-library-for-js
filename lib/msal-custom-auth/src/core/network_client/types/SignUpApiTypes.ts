/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { BaseApiRequest, BindingMethod, ChallengeChannel, ChallengeType, GrantType } from "./BaseApiTypes.js";

/**
 * Request types to initiate sign-up flow
 */
export interface SignUpStartRequest extends BaseApiRequest {
    /**
     * The email address of the user to sign up.
     */
    username: string;

    /**
     * The password of the user to sign up.
     */
    password?: string;

    /**
     * The attributes of the user to sign up.
     */
    attributes?: { [key: string]: string };
    challenge_type: string;
    client_id: string;
}

export interface SignUpChallengeRequest extends BaseApiRequest {
    client_id: string;
    continuation_token: string;
    challenge_type: string;
}

export interface SignUpContinueRequest extends BaseApiRequest {
    continuation_token: string;
    client_id: string;
    grant_type: GrantType;
    attributes?: { [key: string]: string };
    oob?: string;
}

export interface SignUpContinueWithPasswordRequest extends BaseApiRequest {
    continuation_token: string;
    client_id: string;
    grant_type: GrantType;
    password: string;
}

export interface SignUpSubmitUserAttributesRequest extends BaseApiRequest {
    continuation_token: string;
    client_id: string;
    grant_type: GrantType;
    attributes: { [key: string]: string };
}

/**
 * Response types for sign-up flow
 */

export interface RedirectChallengeResponse {
    challenge_type: ChallengeType;
}

export interface PasswordChallengeResponse {
    challenge_type: ChallengeType;
    continuation_token: string;
}

export interface SignUpChallengeResponse {
    interval: number;
    continuation_token: string;
    challenge_type: ChallengeType;
    binding_method: BindingMethod;
    challenge_channel: ChallengeChannel;
    challenge_target_label: string;
    code_length: number;
}

export interface SignUpStartResponse {
    continuation_token?: string;
}

/**
 * Union type for all possible challenge responses
 */
export type ChallengeResponse = SignUpChallengeResponse | RedirectChallengeResponse | PasswordChallengeResponse;

export interface SignUpContinueResponse {
    challenge_type: ChallengeType;
    continuation_token: string;
}
