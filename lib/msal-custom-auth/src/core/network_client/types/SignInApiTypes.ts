/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { BaseApiRequest, ChallengeType, GrantType } from "./BaseApiTypes.js";

/**
 **************************************************************************************************
 * Request types to initiate sign-in flow
 */
export interface SignInInitiateRequest extends BaseApiRequest {
    client_id: string;
    challenge_type: string;
    username: string;
}

export interface SignInChallengeRequest extends BaseApiRequest {
    client_id: string;
    challenge_type: string;
    continuation_token: string;
}

export interface TokenRequestBase extends BaseApiRequest {
    client_id: string;
    continuation_token: string;
    grant_type: GrantType;
    scope: string;
}

export interface PasswordTokenRequest extends TokenRequestBase {
    password: string;
}

export interface OTPTokenRequest extends TokenRequestBase {
    oob: string;
}

export type TokenRequest = PasswordTokenRequest | OTPTokenRequest;

/**
 ************************************************************************************************
 * Response types for sign-in flow
 */
export interface SignInInitiateSuccessResponse {
    continuation_token: string;
    challenge_type?: ChallengeType;
}

export interface SingInChallengeCodeResponse {
    continuation_token: string;
    challenge_type: ChallengeType;
    binding_method?: "prompt";
    challenge_channel?: string;
    challenge_target_label?: string;
    code_length?: number;
}

export interface SingInChallengePasswordResponse {
    continuation_token: string;
    challenge_type: ChallengeType;
}

export interface SignInTokenSuccessResponse {
    token_type: "Bearer";
    scope: string;
    expires_in: number;
    access_token: string;
    refresh_token?: string;
    id_token?: string;
}

export interface CustomAuthApiErrorResponse {
    error:
        | "invalid_request"
        | "unauthorized_client"
        | "invalid_client"
        | "user_not_found"
        | "unsupported_challenge_type"
        | "invalid_grant"
        | "expired_token"
        | "invalid_scope";
    error_description: string;
    error_codes: number[];
    timestamp: string;
    trace_id: string;
    correlation_id: string;
    suberror?: "nativeauthapi_disabled" | "invalid_oob_value";
}

export type CustomAuthApiResponse =
    | SignInInitiateSuccessResponse
    | SingInChallengeCodeResponse
    | SignInTokenSuccessResponse
    | CustomAuthApiErrorResponse;
