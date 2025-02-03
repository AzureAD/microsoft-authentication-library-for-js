/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

export interface BaseRequest {
    client_id: string;
}

export interface BaseResponse {
    continuation_token: string;
}

// Error Types
export interface ErrorResponse {
    error:
        | "invalid_request"
        | "user_not_found"
        | "unsupported_challenge_type"
        | "invalid_client"
        | "unauthorized_client"
        | "invalid_grant"
        | "expired_token";
    error_description: string;
    error_codes: number[];
    timestamp: string;
    trace_id: string;
    correlation_id: string;
    suberror?: PasswordResetSubError;
}

export type PasswordResetSubError =
    | "nativeauthapi_disabled" // For invalid_client error
    | "invalid_oob_value" // For invalid_grant error
    | "password_too_weak" // For invalid_grant error during submit
    | "password_too_short" // For invalid_grant error during submit
    | "password_too_long" // For invalid_grant error during submit
    | "password_recently_used" // For invalid_grant error during submit
    | "password_banned" // For invalid_grant error during submit
    | "password_is_invalid"; // For invalid_grant error during submit

// /start endpoint types
export interface StartResetPasswordRequest extends BaseRequest {
    challenge_type: string; // Must be 'oob redirect'
    username: string; // User's email
}

export type StartResetPasswordResponse =
    | BaseResponse
    | {
          challenge_type: "redirect";
      };

// /challenge endpoint types
export interface ChallengeResetPasswordRequest extends BaseRequest {
    challenge_type: string; // Must be 'oob redirect'
    continuation_token: string;
}

export interface ChallengeResetPasswordSuccessResponse extends BaseResponse {
    challenge_type: "oob";
    binding_method: "prompt";
    challenge_channel: "email";
    challenge_target_label: string; // Obfuscated email
    code_length: number;
}

export type ChallengeResetPasswordResponse =
    | ChallengeResetPasswordSuccessResponse
    | {
          challenge_type: "redirect";
      };

// /continue endpoint types
export interface ContinueResetPasswordRequest extends BaseRequest {
    continuation_token: string;
    grant_type: "oob";
    oob: string; // One-time passcode
}

export interface ContinueResetPasswordResponse extends BaseResponse {
    expires_in: number; // Time in seconds before token expires (max 600)
}

// /submit endpoint types
export interface SubmitResetPasswordRequest extends BaseRequest {
    continuation_token: string;
    new_password: string;
}

export interface SubmitResetPasswordResponse extends BaseResponse {
    poll_interval: number; // Minimum time in seconds between polling requests
}

// /poll_completion endpoint types
export interface PollCompletionRequest extends BaseRequest {
    continuation_token: string;
}

export type PasswordResetStatus =
    | "succeeded"
    | "failed"
    | "not_started"
    | "in_progress";

export interface PollCompletionResponse extends BaseResponse {
    status: PasswordResetStatus;
}

// Helper Types
export interface PasswordResetResult {
    success: boolean;
    status?: PasswordResetStatus;
    error?: ErrorResponse;
    continuation_token?: string;
}

export interface PasswordResetOptions {
    maxAttempts?: number;
    pollTimeout?: number; // Maximum time to wait for polling in seconds
    pollInterval?: number; // Time between polling attempts in seconds
}
