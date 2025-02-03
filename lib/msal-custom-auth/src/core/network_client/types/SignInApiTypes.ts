/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

export enum GrantType {
    OOB = "oob",
    PASSWORD = "password",
    ATTRIBUTES = "attributes",
}

export type ChallengeType = "oob" | "password" | "redirect";

/**
 * Request types to initiate sign-in flow
 */
export interface SignInInitiateRequest {
    /** The Application (client) ID of the app registered in Microsoft Entra admin center */
    client_id: string;
    /** Space-separated list of challenge types. Must include 'redirect'. Example: 'oob redirect' or 'password redirect' */
    challenge_type: string;
    /** Email of the customer user */
    username: string;
}

export interface SignInChallengeRequest {
    /** The Application (client) ID of the app registered in Microsoft Entra admin center */
    client_id: string;
    /** Space-separated list of challenge types. Must include 'redirect'. Example: 'oob redirect' or 'password redirect' */
    challenge_type: string;
    /** Continuation token from previous request */
    continuation_token: string;
}

export interface TokenRequestBase {
    /** The Application (client) ID of the app registered in Microsoft Entra admin center */
    client_id: string;
    /** Continuation token from previous request */
    continuation_token: string;
    /** Type of grant being requested */
    grant_type: GrantType;
    /** Space-separated list of scopes. Must include 'openid' for ID token and 'offline_access' for refresh token */
    scope: string;
}

export interface PasswordTokenRequest extends TokenRequestBase {
    grant_type: GrantType.PASSWORD;
    /** User's password */
    password: string;
}

export interface OTPTokenRequest extends TokenRequestBase {
    grant_type: GrantType.OOB;
    /** One-time passcode received via email */
    oob: string;
}

export type TokenRequest = PasswordTokenRequest | OTPTokenRequest;

/**
 * Response types for sign-in flow
 */
export interface SignInInitiateSuccessResponse {
    /** Continuation token returned by Microsoft Entra */
    continuation_token: string;
    /** Optional challenge type if web-based auth is needed */
    challenge_type?: ChallengeType;
}

export interface SingInChallengeSuccessResponse {
    /** Continuation token returned by Microsoft Entra */
    continuation_token: string;
    /** Selected challenge type for authentication */
    challenge_type: ChallengeType;
    /** Method for entering OTP. Currently only 'prompt' is valid */
    binding_method?: "prompt";
    /** Channel through which OTP was sent. Currently only 'email' is supported */
    challenge_channel?: string;
    /** Obfuscated email where OTP was sent */
    challenge_target_label?: string;
    /** Length of the generated OTP */
    code_length?: number;
}

export interface TokenSuccessResponse {
    /** Token type, always 'Bearer' */
    token_type: "Bearer";
    /** Space-separated list of granted scopes */
    scope: string;
    /** Token expiration time in seconds */
    expires_in: number;
    /** Access token for API requests */
    access_token: string;
    /** Refresh token for obtaining new access tokens */
    refresh_token?: string;
    /** JWT token containing user information */
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
    | SingInChallengeSuccessResponse
    | TokenSuccessResponse
    | CustomAuthApiErrorResponse;
